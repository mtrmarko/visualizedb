import { createContext } from 'react';
import { emptyFn } from '@/lib/utils';
import type { VisualizeDBConfig } from '@visualizedb/shared';

export interface ConfigContext {
    config?: VisualizeDBConfig;
    updateConfig: (params: {
        config?: Partial<VisualizeDBConfig>;
        updateFn?: (config: VisualizeDBConfig) => VisualizeDBConfig;
    }) => Promise<void>;
}

export const ConfigContext = createContext<ConfigContext>({
    config: undefined,
    updateConfig: emptyFn,
});
