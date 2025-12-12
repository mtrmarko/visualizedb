import { customAlphabet } from 'nanoid';
const randomId = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 25);

export const generateId = () => randomId();

export const deepCopy = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));
