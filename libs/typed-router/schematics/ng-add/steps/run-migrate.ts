import { schematic, SchematicContext, Tree } from '@angular-devkit/schematics';
import { Schema } from '../schema';

export const runMigrate =
  (options: Schema) => (host: Tree, context: SchematicContext) => {
    if (options.migrate) {
      context.logger.info('Running migration to angular-typed-router...');
      return schematic('migrate', {
        project: options.project,
        allowDirty: options.allowDirty,
      });
    }
    return host;
  };
