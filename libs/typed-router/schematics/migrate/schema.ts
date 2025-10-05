import './schema.json';

export interface Schema {
  /**
   * The name of the project to migrate.
   */
  project: string;

  /**
   * Path to the project source files.
   * If not specified, the project source root will be used.
   */
  path?: string;

  /**
   * Whether to allow the migration to run even if there are uncommitted Git changes.
   */
  allowDirty?: boolean;
}
