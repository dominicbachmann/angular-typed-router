import * as ts from 'typescript';
import { join } from 'path';
import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { Schema } from '../schema';
import { readWorkspace } from '@schematics/angular/utility';

export const updateRouteDeclarations =
  (options: Schema): Rule =>
  async (tree: Tree, context: SchematicContext) => {
    const workspace = await readWorkspace(tree);
    const project = workspace.projects.get(options.project!);
    if (!project) return tree;

    const routeFiles = findRouteFiles(
      tree,
      project.sourceRoot || join(project.root, 'src')
    );

    for (const filePath of routeFiles) {
      if (!tree.exists(filePath)) continue;

      const sourceText = tree.read(filePath)?.toString();
      if (!sourceText) continue;

      const sourceFile = ts.createSourceFile(
        filePath,
        sourceText,
        ts.ScriptTarget.Latest,
        true
      );

      const result = transformRouteDeclarations(sourceFile, sourceText);

      if (result.changed) {
        context.logger.info(`Updated route declaration in ${filePath}`);
        tree.overwrite(filePath, result.content);
      }
    }

    return tree;
  };

function findRouteFiles(tree: Tree, sourceRoot: string): string[] {
  const result: string[] = [];

  // Look for common route file patterns
  tree.getDir(sourceRoot).visit((filePath) => {
    if (
      filePath.endsWith('.routes.ts') ||
      (filePath.includes('routes') && filePath.endsWith('.ts'))
    ) {
      result.push(filePath);
    }
  });

  return result;
}

function transformRouteDeclarations(
  sourceFile: ts.SourceFile,
  sourceText: string
): { changed: boolean; content: string } {
  let changed = false;
  const replacements: { start: number; end: number; newText: string }[] = [];

  function visit(node: ts.Node) {
    // Look for variable declarations like "routes: Routes = [...]"
    if (
      ts.isVariableDeclaration(node) &&
      node.type &&
      ts.isTypeReferenceNode(node.type) &&
      node.type.typeName.getText() === 'Routes' &&
      node.initializer &&
      ts.isArrayLiteralExpression(node.initializer)
    ) {
      const variableName = node.name.getText();
      const arrayText = node.initializer.getText();

      replacements.push({
        start: node.getStart(),
        end: node.getEnd(),
        newText: `${variableName} = ${arrayText} as const satisfies Routes`,
      });

      changed = true;
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  let result = sourceText;
  for (const { start, end, newText } of replacements.sort(
    (a, b) => b.start - a.start
  )) {
    result = result.substring(0, start) + newText + result.substring(end);
  }

  return { changed, content: result };
}
