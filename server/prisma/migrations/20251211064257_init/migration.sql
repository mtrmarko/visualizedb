-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" INTEGER NOT NULL,
    "updated_at" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "diagrams" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "database_type" TEXT NOT NULL,
    "database_edition" TEXT,
    "tables_json" TEXT,
    "relationships_json" TEXT,
    "dependencies_json" TEXT,
    "areas_json" TEXT,
    "custom_types_json" TEXT,
    "notes_json" TEXT,
    "created_at" INTEGER NOT NULL,
    "updated_at" INTEGER NOT NULL,
    CONSTRAINT "diagrams_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "diagram_versions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "diagram_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "version_name" TEXT NOT NULL,
    "description" TEXT,
    "snapshot_json" TEXT NOT NULL,
    "created_at" INTEGER NOT NULL,
    CONSTRAINT "diagram_versions_diagram_id_fkey" FOREIGN KEY ("diagram_id") REFERENCES "diagrams" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "diagram_versions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "user_config" (
    "user_id" TEXT NOT NULL PRIMARY KEY,
    "default_diagram_id" TEXT,
    "config_json" TEXT,
    CONSTRAINT "user_config_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "diagram_filters" (
    "diagram_id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "table_ids_json" TEXT,
    "schema_ids_json" TEXT,
    CONSTRAINT "diagram_filters_diagram_id_fkey" FOREIGN KEY ("diagram_id") REFERENCES "diagrams" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "diagram_filters_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "diagrams_user_id_idx" ON "diagrams"("user_id");

-- CreateIndex
CREATE INDEX "diagrams_updated_at_idx" ON "diagrams"("updated_at");

-- CreateIndex
CREATE INDEX "diagram_versions_diagram_id_idx" ON "diagram_versions"("diagram_id");

-- CreateIndex
CREATE INDEX "diagram_versions_created_at_idx" ON "diagram_versions"("created_at");
