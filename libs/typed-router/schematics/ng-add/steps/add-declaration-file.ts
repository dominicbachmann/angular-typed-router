import { Schema } from '../schema';
import { SchematicContext, Tree } from '@angular-devkit/schematics';
import { readWorkspace } from '@schematics/angular/utility';
import { ProjectType } from '@schematics/angular/utility/workspace-models';
import { dirname, join, relative } from 'path';
import { JSONFile } from '@schematics/angular/utility/json-file';

export const addDeclarationFile =
  (options: Schema) => async (host: Tree, context: SchematicContext) => {
    const workspace = await readWorkspace(host);
    const project = workspace.projects.get(options.project!);
    if (
      project &&
      project.extensions['projectType'] === ProjectType.Application
    ) {
      const projectRoot = project.root;
      const augmentationFileName = 'angular-typed-router.d.ts';
      const declarationFilePath = join(projectRoot, augmentationFileName);
      // TODO: Check if app.routes.ts exists and if it has the correct export
      const augmentationFileContent = `import type { routes } from './src/app/app.routes';

declare module 'angular-typed-router' {
  interface UserTypedRoutes {
    routes: typeof routes;
  }
  interface AllowedRouteParamValues {

  }
}
`;
      host.create(declarationFilePath, augmentationFileContent);

      const buildTsConfig = project?.targets.get('build')?.options?.tsConfig;
      const testTsConfig = project?.targets.get('test')?.options?.tsConfig;

      if (buildTsConfig && typeof buildTsConfig === 'string') {
        addDeclarationFileToTsConfig(host, buildTsConfig, declarationFilePath);
      }
      if (testTsConfig && typeof testTsConfig === 'string') {
        addDeclarationFileToTsConfig(host, testTsConfig, declarationFilePath);
      }
    } else {
      context.logger.warn(
        `Project "${options.project}" not found or is not an application.`
      );
    }
  };

function addDeclarationFileToTsConfig(
  host: Tree,
  tsConfigPath: string,
  declarationFilePath: string
) {
  if (host.exists(tsConfigPath)) {
    const json = new JSONFile(host, tsConfigPath);

    const includeArray = (json.get(['include']) as string[]) || [];

    const relativePath = relative(dirname(tsConfigPath), declarationFilePath);

    if (!includeArray.includes(relativePath)) {
      includeArray.push(relativePath);
      json.modify(['include'], includeArray);
    }
  }
}
