import { TSESLint, TSESTree } from '@typescript-eslint/utils';

const rule: TSESLint.RuleModule<'relativeTo', []> = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow usage of "relativeTo" in router navigation extras to enforce absolute typed navigation.',
    },
    schema: [],
    messages: {
      relativeTo: 'Usage of "relativeTo" is forbidden. Use absolute paths / commands instead.',
    },
  },
  defaultOptions: [],
  create(context) {
    function isNavigationMember(node: TSESTree.MemberExpression) {
      if (node.computed) return false;
      if (node.property.type !== 'Identifier') return false;
      return ['navigate', 'createUrlTree', 'navigateByUrl'].includes(node.property.name);
    }

    return {
      CallExpression(node) {
        if (node.callee.type === 'MemberExpression' && isNavigationMember(node.callee)) {
          for (const arg of node.arguments) {
            if (arg.type === 'ObjectExpression') {
              for (const prop of arg.properties) {
                if (
                  prop.type === 'Property' &&
                  !prop.computed &&
                  prop.key.type === 'Identifier' &&
                  prop.key.name === 'relativeTo'
                ) {
                  context.report({ node: prop.key, messageId: 'relativeTo' });
                }
              }
            }
          }
        }
      },
    };
  },
};

export default rule;

