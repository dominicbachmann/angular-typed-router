import { SchematicContext, Tree } from '@angular-devkit/schematics';

export const informUser = () => (host: Tree, context: SchematicContext) => {
  context.logger.info('\n⚠️ IMPORTANT: Route Declaration Change Required ⚠️');
  context.logger.info(
    'We attempted to automatically update your route declarations.'
  );
  context.logger.info(
    'Please verify that all route files now use the correct format:'
  );
  context.logger.info('FROM: export const routes: Routes = [];');
  context.logger.info(
    'TO:   export const routes = [] as const satisfies Routes;'
  );
  context.logger.info(
    '\nThis change is necessary for proper type inference of your routes.\n'
  );
  return host;
};
