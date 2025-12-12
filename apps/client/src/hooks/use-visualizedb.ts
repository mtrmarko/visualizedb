import { visualizeDBContext } from '@/context/visualizedb-context/visualizedb-context';
import { useContext } from 'react';

export const useVisualizeDB = () => useContext(visualizeDBContext);
