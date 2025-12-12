import { DatabaseType } from './database-type';

export enum DatabaseEdition {
    // PostgreSQL
    POSTGRESQL_SUPABASE = 'supabase',
    POSTGRESQL_TIMESCALE = 'timescale',

    // MySQL
    MYSQL_5_7 = 'mysql_5_7',

    // SQL Server
    SQL_SERVER_2016_AND_BELOW = 'sql_server_2016_and_below',

    // SQLite
    SQLITE_CLOUDFLARE_D1 = 'cloudflare_d1',
}

export const databaseEditionToLabelMap: Record<DatabaseEdition, string> = {
    // PostgreSQL
    [DatabaseEdition.POSTGRESQL_SUPABASE]: 'Supabase',
    [DatabaseEdition.POSTGRESQL_TIMESCALE]: 'Timescale',

    // MySQL
    [DatabaseEdition.MYSQL_5_7]: 'V5.7',

    // SQL Server
    [DatabaseEdition.SQL_SERVER_2016_AND_BELOW]: '2016 and below',

    // SQLite
    [DatabaseEdition.SQLITE_CLOUDFLARE_D1]: 'Cloudflare D1',
};

export const databaseTypeToEditionMap: Record<DatabaseType, DatabaseEdition[]> =
    {
        [DatabaseType.POSTGRESQL]: [
            DatabaseEdition.POSTGRESQL_SUPABASE,
            DatabaseEdition.POSTGRESQL_TIMESCALE,
        ],
        [DatabaseType.MYSQL]: [DatabaseEdition.MYSQL_5_7],
        [DatabaseType.SQL_SERVER]: [DatabaseEdition.SQL_SERVER_2016_AND_BELOW],
        [DatabaseType.SQLITE]: [DatabaseEdition.SQLITE_CLOUDFLARE_D1],
        [DatabaseType.GENERIC]: [],
        [DatabaseType.MARIADB]: [],
        [DatabaseType.CLICKHOUSE]: [],
        [DatabaseType.COCKROACHDB]: [],
        [DatabaseType.ORACLE]: [],
    };