import { Rule, chain } from '@angular-devkit/schematics';
import { Schema } from './schema';
import { handleUncommittedChanges } from '../utils/handle-uncommitted-changes';
import { replaceUsages } from './steps/replace-usages';

export function migrate(options: Schema): Rule {
  return chain([handleUncommittedChanges(options), replaceUsages(options)]);
}
