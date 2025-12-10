import { useCallback, useState } from 'react';
import { useVisualizeDB } from './use-visualizedb';
import { useDebounce } from './use-debounce-v2';
import type { DBTable } from '@/lib/domain';

// Hook for updating table properties with debouncing for performance
export const useUpdateTable = (table: DBTable) => {
    const { updateTable: visualizeDBUpdateTable } = useVisualizeDB();
    const [localTableName, setLocalTableName] = useState(table.name);
    const [prevTableName, setPrevTableName] = useState(table.name);

    if (table.name !== prevTableName) {
        setPrevTableName(table.name);
        setLocalTableName(table.name);
    }

    // Debounced update function
    const debouncedUpdate = useDebounce(
        useCallback(
            (value: string) => {
                if (value.trim() && value.trim() !== table.name) {
                    visualizeDBUpdateTable(table.id, { name: value.trim() });
                }
            },
            [visualizeDBUpdateTable, table.id, table.name]
        ),
        1000 // 1000ms debounce
    );

    // Update local state immediately for responsive UI
    const handleTableNameChange = useCallback(
        (value: string) => {
            setLocalTableName(value);
            debouncedUpdate(value);
        },
        [debouncedUpdate]
    );

    return {
        tableName: localTableName,
        handleTableNameChange,
    };
};
