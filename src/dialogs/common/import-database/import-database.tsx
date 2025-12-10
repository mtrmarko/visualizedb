import React, {
    Suspense,
    useCallback,
    useEffect,
    useState,
    useRef,
    useMemo,
} from 'react';
import { Button } from '@/components/button/button';
import {
    DialogClose,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogInternalContent,
    DialogTitle,
} from '@/components/dialog/dialog';
import type { DatabaseType } from '@/lib/domain/database-type';
import { Editor } from '@/components/code-snippet/code-snippet';
import type { DatabaseEdition } from '@/lib/domain/database-edition';
import { useTranslation } from 'react-i18next';
import { ZoomableImage } from '@/components/zoomable-image/zoomable-image';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { Spinner } from '@/components/spinner/spinner';
import {
    fixMetadataJson,
    isStringMetadataJson,
} from '@/lib/data/import-metadata/utils';
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from '@/components/resizable/resizable';
import { useTheme } from '@/hooks/use-theme';
import type { OnChange } from '@monaco-editor/react';
import { useDebounce } from '@/hooks/use-debounce-v2';
import { InstructionsSection } from './instructions-section/instructions-section';
import { parseSQLError } from '@/lib/data/sql-import';
import type { editor, IDisposable } from 'monaco-editor';
import { waitFor } from '@/lib/utils';
import { validateSQL } from '@/lib/data/sql-import/sql-validator';
import { SQLValidationStatus } from './sql-validation-status';
import { setupDBMLLanguage } from '@/components/code-snippet/languages/dbml-language';
import type { ImportMethod } from '@/lib/import-method/import-method';
import { detectImportMethod } from '@/lib/import-method/detect-import-method';
import { verifyDBML } from '@/lib/dbml/dbml-import/verify-dbml';
import {
    clearErrorHighlight,
    highlightErrorLine,
} from '@/components/code-snippet/dbml/utils';

const calculateContentSizeMB = (content: string): number => {
    return content.length / (1024 * 1024); // Convert to MB
};

const calculateIsLargeFile = (content: string): boolean => {
    const contentSizeMB = calculateContentSizeMB(content);
    return contentSizeMB > 2; // Consider large if over 2MB
};

const errorScriptOutputMessage =
    'Invalid JSON. Please correct it or contact us at support@visualizedb.io for help.';

export interface ImportDatabaseProps {
    goBack?: () => void;
    onImport: () => void;
    onCreateEmptyDiagram?: () => void;
    scriptResult: string;
    setScriptResult: React.Dispatch<React.SetStateAction<string>>;
    databaseType: DatabaseType;
    databaseEdition?: DatabaseEdition;
    setDatabaseEdition: React.Dispatch<
        React.SetStateAction<DatabaseEdition | undefined>
    >;
    keepDialogAfterImport?: boolean;
    title: string;
    importMethod: ImportMethod;
    setImportMethod: (method: ImportMethod) => void;
}

export const ImportDatabase: React.FC<ImportDatabaseProps> = ({
    setScriptResult,
    goBack,
    scriptResult,
    onImport,
    onCreateEmptyDiagram,
    databaseType,
    databaseEdition,
    setDatabaseEdition,
    keepDialogAfterImport,
    title,
    importMethod,
    setImportMethod,
}) => {
    const { effectiveTheme } = useTheme();
    // Manual error message (e.g. from JSON check action)
    const [manualErrorMessage, setManualErrorMessage] = useState('');
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
    const decorationsCollection = useRef<
        editor.IEditorDecorationsCollection | undefined
    >(undefined);
    const pasteDisposableRef = useRef<IDisposable | null>(null);

    const { t } = useTranslation();
    const { isSm: isDesktop } = useBreakpoint('sm');

    const [showCheckJsonButton, setShowCheckJsonButton] = useState(false);
    const [isCheckingJson, setIsCheckingJson] = useState(false);
    const [showSSMSInfoDialog, setShowSSMSInfoDialog] = useState(false);

    // Async validation error state
    const [asyncErrorMessage, setAsyncErrorMessage] = useState<string>('');
    const [isAutoFixing, setIsAutoFixing] = useState(false);

    const clearDecorations = useCallback(() => {
        clearErrorHighlight(decorationsCollection.current);
    }, []);

    const handleImportMethodChange = useCallback(
        (newMethod: ImportMethod) => {
            setImportMethod(newMethod);
            setScriptResult('');
            setManualErrorMessage('');
            setAsyncErrorMessage('');
            setShowCheckJsonButton(false);
            clearDecorations();
        },
        [setImportMethod, setScriptResult, clearDecorations]
    );

    // Synchronous validation logic using useMemo
    const syncValidationResult = useMemo(() => {
        if (!scriptResult.trim() || importMethod === 'query') {
            return null;
        }

        if (importMethod === 'dbml') {
            const validateResponse = verifyDBML(scriptResult, { databaseType });
            if (!validateResponse.hasError) {
                return {
                    isValid: true,
                    errors: [],
                    warnings: [],
                    errorMessage: '',
                    fixedSQL: undefined,
                };
            } else {
                return {
                    isValid: false,
                    errors: [
                        {
                            message:
                                validateResponse.parsedError?.message ||
                                'Invalid DBML syntax',
                            line: validateResponse.parsedError?.line || 1,
                            type: 'syntax' as const,
                        },
                    ],
                    warnings: [],
                    errorMessage:
                        validateResponse.parsedError?.message ||
                        'Invalid DBML syntax',
                    parsedError: validateResponse.parsedError,
                    fixedSQL: undefined,
                };
            }
        }

        // SQL validation
        const validation = validateSQL(scriptResult, databaseType);
        return {
            ...validation,
            errorMessage:
                validation.fixedSQL && validation.errors.length > 0
                    ? 'SQL contains syntax errors'
                    : '',
        };
    }, [scriptResult, importMethod, databaseType]);

    const showAutoFixButton = useMemo(
        () =>
            !!(
                syncValidationResult &&
                syncValidationResult.fixedSQL &&
                syncValidationResult.errors.length > 0
            ),
        [syncValidationResult]
    );

    // Derived error message
    const displayErrorMessage = useMemo(() => {
        if (syncValidationResult?.errorMessage) {
            return syncValidationResult.errorMessage;
        }
        if (asyncErrorMessage) {
            return asyncErrorMessage;
        }
        return manualErrorMessage;
    }, [syncValidationResult, asyncErrorMessage, manualErrorMessage]);

    // Handle DBML highlighting (side effect of validation)
    useEffect(() => {
        if (
            syncValidationResult?.parsedError &&
            importMethod === 'dbml' &&
            editorRef.current
        ) {
            highlightErrorLine({
                error: syncValidationResult.parsedError,
                model: editorRef.current.getModel(),
                editorDecorationsCollection: decorationsCollection.current,
            });
        } else {
            clearDecorations();
        }
    }, [syncValidationResult, importMethod, clearDecorations]);

    // Async SQL validation
    useEffect(() => {
        requestAnimationFrame(() => setAsyncErrorMessage('')); // Reset async error when dependencies change

        if (
            importMethod === 'ddl' &&
            syncValidationResult &&
            !syncValidationResult.errorMessage &&
            !syncValidationResult.errors.length
        ) {
            parseSQLError({
                sqlContent: scriptResult,
                sourceDatabaseType: databaseType,
            }).then((result) => {
                if (!result.success && result.error) {
                    setAsyncErrorMessage(result.error);
                }
            });
        }
    }, [importMethod, scriptResult, databaseType, syncValidationResult]);

    // Check if the script result is a valid JSON
    useEffect(() => {
        if (importMethod !== 'query') {
            return;
        }

        if (scriptResult.trim().length === 0) {
            requestAnimationFrame(() => {
                setManualErrorMessage('');
                setShowCheckJsonButton(false);
            });
            return;
        }

        if (isStringMetadataJson(scriptResult)) {
            requestAnimationFrame(() => {
                setManualErrorMessage('');
                setShowCheckJsonButton(false);
            });
        } else if (
            scriptResult.trim().includes('{') &&
            scriptResult.trim().includes('}')
        ) {
            requestAnimationFrame(() => {
                setShowCheckJsonButton(true);
                setManualErrorMessage('');
            });
        } else {
            requestAnimationFrame(() => {
                setManualErrorMessage(errorScriptOutputMessage);
                setShowCheckJsonButton(false);
            });
        }
    }, [scriptResult, importMethod]);

    const handleImport = useCallback(() => {
        if (
            displayErrorMessage.length === 0 &&
            scriptResult.trim().length !== 0
        ) {
            onImport();
        }
    }, [displayErrorMessage.length, onImport, scriptResult]);

    const handleAutoFix = useCallback(() => {
        if (syncValidationResult?.fixedSQL) {
            setIsAutoFixing(true);
            setManualErrorMessage('');
            setAsyncErrorMessage('');

            // Apply the fix with a delay so user sees the fixing message
            setTimeout(() => {
                setScriptResult(syncValidationResult.fixedSQL!);

                setTimeout(() => {
                    setIsAutoFixing(false);
                }, 100);
            }, 1000);
        }
    }, [syncValidationResult, setScriptResult]);

    const handleErrorClick = useCallback((line: number) => {
        if (editorRef.current) {
            // Set cursor to the error line
            editorRef.current.setPosition({ lineNumber: line, column: 1 });
            editorRef.current.revealLineInCenter(line);
            editorRef.current.focus();
        }
    }, []);

    const formatEditor = useCallback(() => {
        if (editorRef.current) {
            const model = editorRef.current.getModel();
            if (model) {
                const content = model.getValue();

                // Skip formatting for large files (> 2MB)
                if (calculateIsLargeFile(content)) {
                    return;
                }
            }

            setTimeout(() => {
                editorRef.current
                    ?.getAction('editor.action.formatDocument')
                    ?.run();
            }, 50);
        }
    }, []);

    const handleInputChange: OnChange = useCallback(
        (inputValue) => {
            setScriptResult(inputValue ?? '');

            // Automatically open SSMS info when input length is exactly 65535
            if ((inputValue ?? '').length === 65535) {
                setShowSSMSInfoDialog(true);
            }
        },
        [setScriptResult]
    );

    const debouncedHandleInputChange = useDebounce(handleInputChange, 500);

    const handleCheckJson = useCallback(async () => {
        setIsCheckingJson(true);

        await waitFor(1000);
        const fixedJson = fixMetadataJson(scriptResult);

        if (isStringMetadataJson(fixedJson)) {
            setScriptResult(fixedJson);
            setManualErrorMessage('');
            formatEditor();
        } else {
            setScriptResult(fixedJson);
            setManualErrorMessage(errorScriptOutputMessage);
            formatEditor();
        }

        setShowCheckJsonButton(false);
        setIsCheckingJson(false);
    }, [scriptResult, setScriptResult, formatEditor]);

    useEffect(() => {
        // Cleanup paste handler on unmount
        return () => {
            if (pasteDisposableRef.current) {
                pasteDisposableRef.current.dispose();
                pasteDisposableRef.current = null;
            }
        };
    }, []);

    const handleEditorDidMount = useCallback(
        (editor: editor.IStandaloneCodeEditor) => {
            editorRef.current = editor;
            decorationsCollection.current =
                editor.createDecorationsCollection();

            // Cleanup previous disposable if it exists
            if (pasteDisposableRef.current) {
                pasteDisposableRef.current.dispose();
                pasteDisposableRef.current = null;
            }

            // Add paste handler for all modes
            const disposable = editor.onDidPaste(() => {
                const model = editor.getModel();
                if (!model) return;

                const content = model.getValue();

                // Skip formatting for large files (> 2MB) to prevent browser freezing
                const isLargeFile = calculateIsLargeFile(content);

                // First, detect content type to determine if we should switch modes
                const detectedType = detectImportMethod(content);
                if (detectedType && detectedType !== importMethod) {
                    // Switch to the detected mode immediately using the handler
                    handleImportMethodChange(detectedType);

                    // Only format if it's JSON (query mode) AND file is not too large
                    if (detectedType === 'query' && !isLargeFile) {
                        // For JSON mode, format after a short delay
                        setTimeout(() => {
                            editor
                                .getAction('editor.action.formatDocument')
                                ?.run();
                        }, 100);
                    }
                    // For DDL and DBML modes, do NOT format as it can break the syntax
                } else {
                    // Content type didn't change, apply formatting based on current mode
                    if (importMethod === 'query' && !isLargeFile) {
                        // Only format JSON content if not too large
                        setTimeout(() => {
                            editor
                                .getAction('editor.action.formatDocument')
                                ?.run();
                        }, 100);
                    }
                    // For DDL and DBML modes or large files, do NOT format
                }
            });

            pasteDisposableRef.current = disposable;
        },
        [importMethod, handleImportMethodChange]
    );

    const renderHeader = useCallback(() => {
        return (
            <DialogHeader>
                <DialogTitle>{title}</DialogTitle>
                <DialogDescription className="hidden" />
            </DialogHeader>
        );
    }, [title]);

    const renderInstructions = useCallback(
        () => (
            <InstructionsSection
                databaseType={databaseType}
                importMethod={importMethod}
                setDatabaseEdition={setDatabaseEdition}
                setImportMethod={handleImportMethodChange}
                databaseEdition={databaseEdition}
                setShowSSMSInfoDialog={setShowSSMSInfoDialog}
                showSSMSInfoDialog={showSSMSInfoDialog}
            />
        ),
        [
            databaseType,
            importMethod,
            setDatabaseEdition,
            handleImportMethodChange,
            databaseEdition,
            setShowSSMSInfoDialog,
            showSSMSInfoDialog,
        ]
    );

    const renderOutputTextArea = useCallback(
        () => (
            <div className="flex size-full flex-col gap-1 overflow-hidden rounded-md border p-1">
                <div className="w-full text-center text-xs text-muted-foreground">
                    {importMethod === 'query'
                        ? 'Smart Query Output'
                        : importMethod === 'dbml'
                          ? 'DBML Script'
                          : 'SQL Script'}
                </div>
                <div className="flex-1 overflow-hidden">
                    <Suspense fallback={<Spinner />}>
                        <Editor
                            value={scriptResult}
                            onChange={debouncedHandleInputChange}
                            language={
                                importMethod === 'query'
                                    ? 'json'
                                    : importMethod === 'dbml'
                                      ? 'dbml'
                                      : 'sql'
                            }
                            loading={<Spinner />}
                            onMount={handleEditorDidMount}
                            beforeMount={setupDBMLLanguage}
                            theme={
                                effectiveTheme === 'dark'
                                    ? 'dbml-dark'
                                    : 'dbml-light'
                            }
                            options={{
                                formatOnPaste: false, // Never format on paste - we handle it manually
                                minimap: { enabled: false },
                                scrollBeyondLastLine: false,
                                automaticLayout: true,
                                lineNumbers: 'on',
                                guides: {
                                    indentation: false,
                                },
                                folding: true,
                                lineNumbersMinChars: 3,
                                renderValidationDecorations: 'off',
                                lineDecorationsWidth: 0,
                                overviewRulerBorder: false,
                                overviewRulerLanes: 0,
                                hideCursorInOverviewRuler: true,
                                contextmenu: false,

                                scrollbar: {
                                    vertical: 'hidden',
                                    horizontal: 'hidden',
                                    alwaysConsumeMouseWheel: false,
                                },
                            }}
                            className="size-full min-h-40"
                        />
                    </Suspense>
                </div>

                {displayErrorMessage ||
                ((importMethod === 'ddl' || importMethod === 'dbml') &&
                    syncValidationResult) ? (
                    <SQLValidationStatus
                        validation={syncValidationResult}
                        errorMessage={displayErrorMessage}
                        isAutoFixing={isAutoFixing}
                        onErrorClick={handleErrorClick}
                    />
                ) : null}
            </div>
        ),
        [
            displayErrorMessage,
            scriptResult,
            importMethod,
            effectiveTheme,
            debouncedHandleInputChange,
            handleEditorDidMount,
            syncValidationResult,
            isAutoFixing,
            handleErrorClick,
        ]
    );

    const renderContent = useCallback(() => {
        return (
            <DialogInternalContent>
                {isDesktop ? (
                    <ResizablePanelGroup
                        direction={isDesktop ? 'horizontal' : 'vertical'}
                        className="min-h-[500px]"
                    >
                        <ResizablePanel
                            defaultSize={25}
                            minSize={25}
                            maxSize={99}
                            className="min-h-fit rounded-md bg-gradient-to-b from-slate-50 to-slate-100 p-2 dark:from-slate-900 dark:to-slate-800 md:min-h-fit md:min-w-[350px] md:rounded-l-md md:p-2"
                        >
                            {renderInstructions()}
                        </ResizablePanel>
                        <ResizableHandle withHandle />
                        <ResizablePanel className="min-h-40 py-2 md:px-2 md:py-0">
                            {renderOutputTextArea()}
                        </ResizablePanel>
                    </ResizablePanelGroup>
                ) : (
                    <div className="flex flex-col gap-2">
                        {renderInstructions()}
                        {renderOutputTextArea()}
                    </div>
                )}
            </DialogInternalContent>
        );
    }, [renderOutputTextArea, renderInstructions, isDesktop]);

    const renderFooter = useCallback(() => {
        return (
            <DialogFooter className="flex !justify-between gap-2">
                <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
                    {goBack && (
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={goBack}
                        >
                            {t('new_diagram_dialog.back')}
                        </Button>
                    )}
                    {isDesktop ? (
                        <ZoomableImage src="/load-new-db-instructions.gif">
                            <Button type="button" variant="link">
                                {t(
                                    'new_diagram_dialog.import_database.instructions_link'
                                )}
                            </Button>
                        </ZoomableImage>
                    ) : null}
                </div>
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:space-x-2">
                    {onCreateEmptyDiagram && (
                        <DialogClose asChild>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onCreateEmptyDiagram}
                            >
                                {t('new_diagram_dialog.empty_diagram')}
                            </Button>
                        </DialogClose>
                    )}

                    {showCheckJsonButton ? (
                        <Button
                            type="button"
                            variant="default"
                            onClick={handleCheckJson}
                            disabled={isCheckingJson}
                        >
                            {isCheckingJson ? (
                                <Spinner size="small" />
                            ) : (
                                t(
                                    'new_diagram_dialog.import_database.check_script_result'
                                )
                            )}
                        </Button>
                    ) : showAutoFixButton && importMethod === 'ddl' ? (
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={handleAutoFix}
                            disabled={isAutoFixing}
                            className="bg-sky-600 text-white hover:bg-sky-700"
                        >
                            {isAutoFixing ? (
                                <Spinner size="small" />
                            ) : (
                                'Try auto-fix'
                            )}
                        </Button>
                    ) : keepDialogAfterImport ? (
                        <Button
                            type="button"
                            variant="default"
                            disabled={
                                scriptResult.trim().length === 0 ||
                                displayErrorMessage.length > 0 ||
                                isAutoFixing
                            }
                            onClick={handleImport}
                        >
                            {t('new_diagram_dialog.import')}
                        </Button>
                    ) : (
                        <DialogClose asChild>
                            <Button
                                type="button"
                                variant="default"
                                disabled={
                                    scriptResult.trim().length === 0 ||
                                    displayErrorMessage.length > 0 ||
                                    isAutoFixing
                                }
                                onClick={handleImport}
                            >
                                {t('new_diagram_dialog.import')}
                            </Button>
                        </DialogClose>
                    )}

                    {!isDesktop ? (
                        <ZoomableImage src="/load-new-db-instructions.gif">
                            <Button type="button" variant="link">
                                {t(
                                    'new_diagram_dialog.import_database.instructions_link'
                                )}
                            </Button>
                        </ZoomableImage>
                    ) : null}
                </div>
            </DialogFooter>
        );
    }, [
        handleImport,
        isDesktop,
        keepDialogAfterImport,
        onCreateEmptyDiagram,
        displayErrorMessage.length,
        scriptResult,
        showCheckJsonButton,
        isCheckingJson,
        handleCheckJson,
        goBack,
        t,
        importMethod,
        isAutoFixing,
        showAutoFixButton,
        handleAutoFix,
    ]);

    return (
        <>
            {renderHeader()}
            {renderContent()}
            {renderFooter()}
        </>
    );
};
