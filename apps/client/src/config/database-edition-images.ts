import { DatabaseEdition } from '@visualizedb/shared';
import SupabaseImage from '@/assets/supabase.png';
import TimescaleImage from '@/assets/timescale.png';
import MySql5_7Image from '@/assets/mysql_5_7.png';
import SqlServerImage from '@/assets/sql_server_logo_2.png';
import CloudflareD1Image from '@/assets/cloudflare_d1.png';

export const databaseEditionToImageMap: Record<DatabaseEdition, string> = {
    // PostgreSQL
    [DatabaseEdition.POSTGRESQL_SUPABASE]: SupabaseImage,
    [DatabaseEdition.POSTGRESQL_TIMESCALE]: TimescaleImage,

    // MySQL
    [DatabaseEdition.MYSQL_5_7]: MySql5_7Image,

    // SQL Server
    [DatabaseEdition.SQL_SERVER_2016_AND_BELOW]: SqlServerImage,

    // SQLite
    [DatabaseEdition.SQLITE_CLOUDFLARE_D1]: CloudflareD1Image,
};
