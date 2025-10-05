// This import only ensures that the schema is included in the build
import './schema.json';
/**
 * Options available to the ng-add schematic.
 */
export interface Schema {
  /**
   * The name of the project to add angular-typed-router to.
   */
  project?: string;

  /**
   * Whether to allow the migration to run even if there are uncommitted Git changes.
   */
  allowDirty?: boolean;

  /**
   * Whether to run the migration to update existing imports from @angular/router to angular-typed-router.
   */
  migrate?: boolean;
}
