import React, { useEffect, useState } from 'react';
import { ConfigContext } from './config-context';

import { useStorage } from '@/hooks/use-storage';
import type { VisualizeDBConfig } from '@visualizedb/shared';

export const ConfigProvider: React.FC<React.PropsWithChildren> = ({
    children,
}) => {
    const { getConfig, updateConfig: updateDataConfig } = useStorage();
    const [config, setConfig] = useState<VisualizeDBConfig | undefined>();

    useEffect(() => {
        const loadConfig = async () => {
            const config = await getConfig();
            setConfig(config);
        };

        loadConfig();
    }, [getConfig]);

    const updateConfig: ConfigContext['updateConfig'] = async ({
        config,
        updateFn,
    }) => {
        const promise = new Promise<void>((resolve) => {
            setConfig((prevConfig) => {
                let baseConfig: VisualizeDBConfig = { defaultDiagramId: '' };
                if (prevConfig) {
                    baseConfig = prevConfig;
                }

                const updatedConfig = updateFn
                    ? updateFn(baseConfig)
                    : { ...baseConfig, ...config };

                updateDataConfig(updatedConfig).then(() => {
                    resolve();
                });
                return updatedConfig;
            });
        });

        return promise;
    };

    return (
        <ConfigContext.Provider
            value={{
                config,
                updateConfig,
            }}
        >
            {children}
        </ConfigContext.Provider>
    );
};
