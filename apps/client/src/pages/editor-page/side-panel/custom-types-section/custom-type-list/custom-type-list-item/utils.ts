import type { DBCustomType, DBTable } from '@visualizedb/shared';

export const checkIfCustomTypeUsed = ({
    customType,
    tables,
}: {
    customType: DBCustomType;
    tables: DBTable[];
}): boolean => {
    const typeNameToFind = customType.name;

    for (const table of tables) {
        for (const field of table.fields) {
            if (field.type.name === typeNameToFind) {
                return true;
            }
        }
    }
    return false;
};
