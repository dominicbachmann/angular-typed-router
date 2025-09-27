import { TSESLint, TSESTree } from '@typescript-eslint/utils';

// Forbids usage of trailing slashes in navigation usage sites:
// 1. <a routerLink="foo/bar/"> (plain attribute)
// 2. router.navigateByUrl('foo/bar/')
// 3. router.navigateByUrl('/foo/bar/')
// Root '/' is allowed.

const rule: TSESLint.RuleModule<'navTrailing', []> = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow trailing slash in routerLink attributes and navigateByUrl string arguments.',
    },
    fixable: 'code',
    messages: {
      navTrailing: 'Navigation target "{{path}}" must not end with a trailing slash.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const sourceCode = context.getSourceCode();

    function reportAndFixLiteral(node: TSESTree.Literal & { value: string }) {
      const path = node.value;
      if (typeof path !== 'string') return;
      if (path.length > 1 && path.endsWith('/')) {
        context.report({
          node,
          messageId: 'navTrailing',
          data: { path },
          fix(fixer) {
            const fixed = path.replace(/\/+$/g, '');
            return fixer.replaceText(node, `'${fixed}'`);
          },
        });
      }
    }

    function checkCallExpression(node: TSESTree.CallExpression) {
      if (node.callee.type !== 'MemberExpression' || node.callee.computed) return;
      const prop = node.callee.property;
      if (prop.type !== 'Identifier') return;
      if (prop.name !== 'navigateByUrl') return;
      const first = node.arguments[0];
      if (first && first.type === 'Literal' && typeof first.value === 'string') {
        reportAndFixLiteral(first as TSESTree.Literal & { value: string });
      }
    }

    // Template (HTML) files: naive regex scan for routerLink=".../" occurrences (plain attribute only)
    function scanTemplateTextOnce() {
      const text = sourceCode.getText();
      // regex matches routerLink=".../" capturing path group 1
      const attrRegex = /routerLink\s*=\s*"([^"\n]*?)"/g; // simple attribute matcher
      let match: RegExpExecArray | null;
      while ((match = attrRegex.exec(text))) {
        const full = match[0];
        const path = match[1];
        if (path.length > 1 && path.endsWith('/')) {
          // Location of the path literal inside the attribute
            const pathStartIdx = match.index + full.indexOf('"') + 1;
            const pathEndIdx = pathStartIdx + path.length; // exclusive
            context.report({
              loc: {
                start: sourceCode.getLocFromIndex(pathStartIdx),
                end: sourceCode.getLocFromIndex(pathEndIdx),
              },
              messageId: 'navTrailing',
              data: { path },
              fix(fixer) {
                const fixed = path.replace(/\/+$/g, '');
                return fixer.replaceTextRange([pathStartIdx, pathEndIdx], fixed);
              },
            });
        }
      }
    }

    let scanned = false;

    return {
      Program() {
        // Run once per file; HTML templates also come through with Program root when using angular-eslint
        if (!scanned) {
          scanTemplateTextOnce();
          scanned = true;
        }
      },
      CallExpression: checkCallExpression,
    };
  },
};

export default rule;

