import { Schema } from '../schema';
import {
  SchematicContext,
  SchematicsException,
  Tree,
} from '@angular-devkit/schematics';
import { readWorkspace } from '@schematics/angular/utility';
import * as ts from 'typescript';

interface ImportMapping {
  oldImport: string;
  newImport: string;
  fromModule: string;
  toModule: string;
}

export const replaceUsages =
  (options: Schema) => async (tree: Tree, context: SchematicContext) => {
    const workspace = await readWorkspace(tree);
    const project = workspace.projects.get(options.project);

    if (!project) {
      throw new SchematicsException(`Project "${options.project}" not found.`);
    }

    const sourceRoot = options.path || project.sourceRoot;

    if (!sourceRoot) {
      throw new SchematicsException(
        `Could not determine source root for project "${options.project}".`
      );
    }

    context.logger.info(`Migrating Angular Router imports in ${sourceRoot}...`);

    const importMappings = [
      {
        oldImport: 'Router',
        newImport: 'TypedRouter',
        fromModule: '@angular/router',
        toModule: 'angular-typed-router',
      },
      {
        oldImport: 'RouterLink',
        newImport: 'TypedRouterLink',
        fromModule: '@angular/router',
        toModule: 'angular-typed-router',
      },
    ] as const satisfies ImportMapping[];

    const tsFiles = getTypeScriptFiles(tree, sourceRoot);

    for (const filePath of tsFiles) {
      migrateFile(tree, filePath, importMappings);
    }

    context.logger.info('Migration complete!');

    return tree;
  };

function getTypeScriptFiles(tree: Tree, rootPath: string) {
  const files: string[] = [];

  function getFilesRecursively(path: string) {
    const dir = tree.getDir(path);

    const entries = dir.subfiles;

    for (const entry of entries) {
      if (
        entry.endsWith('.ts') &&
        !entry.endsWith('.d.ts') &&
        !entry.endsWith('.spec.ts')
      ) {
        files.push(`${path}/${entry}`);
      }
    }

    const directories = dir.subdirs;

    for (const directory of directories) {
      getFilesRecursively(`${path}/${directory}`);
    }
  }

  getFilesRecursively(rootPath);
  return files;
}

function migrateFile(tree: Tree, filePath: string, mappings: ImportMapping[]) {
  const content = tree.read(filePath);
  if (!content) {
    return;
  }

  const sourceText = content.toString('utf-8');
  const sourceFile = ts.createSourceFile(
    filePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true
  );

  let updatedSourceText = sourceText;
  let hasChanged = false;

  const importsToAdd = new Map<string, Set<string>>();
  const importsToRemove = new Set<string>();
  const componentImportsToReplace = new Map<
    ts.NodeArray<ts.Expression>,
    Map<number, string>
  >();

  sourceFile.forEachChild((node) => {
    if (ts.isImportDeclaration(node)) {
      const moduleSpecifier = node.moduleSpecifier;
      if (ts.isStringLiteral(moduleSpecifier)) {
        const moduleName = moduleSpecifier.text;

        if (moduleName === '@angular/router') {
          if (node.importClause && node.importClause.namedBindings) {
            const namedBindings = node.importClause.namedBindings;

            if (ts.isNamedImports(namedBindings)) {
              const importSpecifiers = namedBindings.elements;

              for (const specifier of importSpecifiers) {
                const importName = specifier.name.text;

                const mapping = mappings.find(
                  (m) => m.oldImport === importName
                );
                if (mapping) {
                  if (!importsToAdd.has(mapping.toModule)) {
                    importsToAdd.set(mapping.toModule, new Set());
                  }
                  importsToAdd.get(mapping.toModule)!.add(mapping.newImport);

                  importsToRemove.add(importName);

                  hasChanged = true;
                }
              }
            }
          }
        }
      }
    }
  });

  if (hasChanged || componentImportsToReplace.size > 0) {
    updatedSourceText = processImports(
      sourceFile,
      updatedSourceText,
      importsToRemove
    );
    updatedSourceText = addNewImports(updatedSourceText, importsToAdd);

    const updatedSourceFile = ts.createSourceFile(
      filePath,
      updatedSourceText,
      ts.ScriptTarget.Latest,
      true
    );

    updatedSourceText = replaceAllClassReferences(
      updatedSourceFile,
      updatedSourceText,
      mappings
    );

    tree.overwrite(filePath, updatedSourceText);
  }
}

function processImports(
  sourceFile: ts.SourceFile,
  sourceText: string,
  importsToRemove: Set<string>
) {
  let updatedText = sourceText;

  sourceFile.forEachChild((node) => {
    if (ts.isImportDeclaration(node)) {
      const moduleSpecifier = node.moduleSpecifier;
      if (
        ts.isStringLiteral(moduleSpecifier) &&
        moduleSpecifier.text === '@angular/router'
      ) {
        if (node.importClause && node.importClause.namedBindings) {
          const namedBindings = node.importClause.namedBindings;

          if (ts.isNamedImports(namedBindings)) {
            const importSpecifiers = namedBindings.elements;
            const remainingImports = importSpecifiers.filter(
              (specifier) => !importsToRemove.has(specifier.name.text)
            );

            if (remainingImports.length !== importSpecifiers.length) {
              if (remainingImports.length === 0) {
                updatedText =
                  updatedText.substring(0, node.getStart()) +
                  updatedText.substring(node.getEnd());
              } else {
                const namedBindingsStart = namedBindings.getStart();
                const namedBindingsEnd = namedBindings.getEnd();

                const newNamedBindings =
                  '{ ' +
                  remainingImports
                    .map((specifier) => specifier.getText())
                    .join(', ') +
                  ' }';

                updatedText =
                  updatedText.substring(0, namedBindingsStart) +
                  newNamedBindings +
                  updatedText.substring(namedBindingsEnd);
              }
            }
          }
        }
      }
    }
  });

  return updatedText;
}

function addNewImports(
  sourceText: string,
  importsToAdd: Map<string, Set<string>>
): string {
  let updatedText = sourceText;

  for (const [moduleName, importNames] of Array.from(importsToAdd.entries())) {
    const importStatement = `import { ${Array.from(importNames).join(
      ', '
    )} } from '${moduleName}';\n`;

    let insertPosition = 0;

    const importRegex = /^import .* from .*;$/gm;
    let match: RegExpExecArray | null;

    while ((match = importRegex.exec(updatedText)) !== null) {
      insertPosition = match.index + match[0].length;
    }

    updatedText =
      updatedText.substring(0, insertPosition) +
      '\n' +
      importStatement +
      updatedText.substring(insertPosition);
  }

  return updatedText;
}

function replaceAllClassReferences(
  sourceFile: ts.SourceFile,
  sourceText: string,
  mappings: ImportMapping[]
): string {
  const replacementMap = new Map<string, string>(
    mappings.map((m) => [m.oldImport, m.newImport])
  );

  const replacements: { start: number; end: number; newText: string }[] = [];

  function visitNode(node: ts.Node) {
    if (ts.isIdentifier(node)) {
      const replacement = replacementMap.get(node.text);

      if (replacement) {
        let parent = node.parent;
        let isPartOfImport = false;

        while (parent) {
          if (ts.isImportDeclaration(parent) || ts.isImportSpecifier(parent)) {
            isPartOfImport = true;
            break;
          }
          parent = parent.parent;
        }

        if (!isPartOfImport) {
          replacements.push({
            start: node.getStart(sourceFile),
            end: node.getEnd(),
            newText: replacement,
          });
        }
      }
    }

    ts.forEachChild(node, visitNode);
  }

  visitNode(sourceFile);

  let result = sourceText;
  for (const { start, end, newText } of replacements.sort(
    (a, b) => b.start - a.start
  )) {
    result = result.substring(0, start) + newText + result.substring(end);
  }

  return result;
}
