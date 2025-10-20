/**
 * ESLint rule to prevent hardcoded spacing values
 * 
 * This rule detects and warns about hardcoded pixel spacing values in:
 * - Padding properties
 * - Margin properties
 * - Gap properties
 * 
 * Suggests using design tokens instead:
 * - tokens.spacing.* (xs, s, m, l, xl, xxl, xxxl)
 */

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow hardcoded spacing values in style objects',
      category: 'Design System',
      recommended: true,
    },
    messages: {
      hardcodedSpacing: 'Hardcoded spacing "{{value}}" found. Use tokens.spacing scale (xs, s, m, l, xl, etc.) instead.',
    },
    fixable: null,
    schema: [],
  },

  create(context) {
    // Regex pattern for pixel spacing detection
    const pixelSpacingRegex = /^\s*\d+px\s*$/;
    const multiplePixelSpacingRegex = /\d+px/g;

    // CSS spacing properties to check
    const spacingProperties = new Set([
      'padding',
      'paddingLeft',
      'paddingRight',
      'paddingTop',
      'paddingBottom',
      'paddingInline',
      'paddingBlock',
      'margin',
      'marginLeft',
      'marginRight',
      'marginTop',
      'marginBottom',
      'marginInline',
      'marginBlock',
      'gap',
      'rowGap',
      'columnGap',
      'gridGap',
      'gridRowGap',
      'gridColumnGap',
    ]);

    function checkForHardcodedSpacing(node, value) {
      if (typeof value === 'string') {
        // Check single pixel value
        if (pixelSpacingRegex.test(value)) {
          context.report({
            node,
            messageId: 'hardcodedSpacing',
            data: {
              value: value.trim(),
            },
          });
        }
        // Check multiple pixel values (e.g., "10px 20px")
        else if (multiplePixelSpacingRegex.test(value)) {
          context.report({
            node,
            messageId: 'hardcodedSpacing',
            data: {
              value: value,
            },
          });
        }
      }
    }

    return {
      // Check object properties (style objects, makeStyles)
      Property(node) {
        if (node.key && node.key.name && spacingProperties.has(node.key.name)) {
          const value = node.value;
          
          // Check string literals
          if (value.type === 'Literal' && typeof value.value === 'string') {
            checkForHardcodedSpacing(value, value.value);
          }
          
          // Check template literals
          if (value.type === 'TemplateLiteral' && value.quasis.length > 0) {
            value.quasis.forEach(quasi => {
              if (quasi.value && quasi.value.cooked) {
                checkForHardcodedSpacing(value, quasi.value.cooked);
              }
            });
          }
        }
      },

      // Check JSX style prop
      JSXAttribute(node) {
        if (node.name && node.name.name === 'style') {
          const value = node.value;
          
          // Check if style prop has an object expression
          if (value && value.type === 'JSXExpressionContainer') {
            const expression = value.expression;
            
            if (expression.type === 'ObjectExpression') {
              expression.properties.forEach(prop => {
                if (prop.key && prop.key.name && spacingProperties.has(prop.key.name)) {
                  if (prop.value.type === 'Literal' && typeof prop.value.value === 'string') {
                    checkForHardcodedSpacing(prop.value, prop.value.value);
                  }
                }
              });
            }
          }
        }
      },
    };
  },
};
