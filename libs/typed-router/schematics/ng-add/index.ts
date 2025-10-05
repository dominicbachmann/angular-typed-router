import { Rule, chain } from '@angular-devkit/schematics';
import { Schema } from './schema';
import { updateRouteDeclarations } from './steps/update-route-declarations';
import { runMigrate } from './steps/run-migrate';
import { addDeclarationFile } from './steps/add-declaration-file';
import { handleUncommittedChanges } from '../utils/handle-uncommitted-changes';
import { informUser } from './steps/inform-user';

export function ngAdd(options: Schema): Rule {
  if (!options.project) {
    throw new Error('Project name is required.');
  }

  return chain([
    handleUncommittedChanges(options),
    addDeclarationFile(options),
    updateRouteDeclarations(options),
    runMigrate(options),
    informUser(),
  ]);
}
