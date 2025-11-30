import React from 'react';
import { StorageProvider as DexieStorageProvider } from './storage-provider';
import { ApiStorageProvider } from './api-storage-provider';

const useBackend = import.meta.env.VITE_USE_BACKEND === 'true';

export const StorageProvider: React.FC<React.PropsWithChildren> = ({
    children,
}) => {
    console.log('useBackend:', useBackend);
    if (useBackend) {
        return <ApiStorageProvider>{children}</ApiStorageProvider>;
    }

    return <DexieStorageProvider>{children}</DexieStorageProvider>;
};

// // eslint-disable-next-line react-refresh/only-export-components
// export { useStorage } from './use-storage';
// eslint-disable-next-line react-refresh/only-export-components
export { storageContext } from './storage-context';
export type { StorageContext } from './storage-context';
