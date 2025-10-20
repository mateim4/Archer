/**
 * ESLint rule to prevent hardcoded color values
 * 
 * This rule detects and warns about hardcoded color values in:
 * - Hex colors (#fff, #8b5cf6)
 * - RGB/RGBA colors (rgb(255, 255, 255), rgba(139, 92, 246, 0.5))
 * 
 * Suggests using design tokens instead:
 * - tokens.semanticColors.*
 * - tokens.purplePalette.*
 * - tokens.components.*
 */

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow hardcoded color values in style objects',
      category: 'Design System',
      recommended: true,
    },
    messages: {
      hardcodedColor: 'Hardcoded color "{{value}}" found. Use tokens.semanticColors or tokens.purplePalette instead.',
    },
    fixable: null,
    schema: [],
  },

  create(context) {
    // Regex patterns for color detection
    const hexColorRegex = /#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/;
    const rgbaColorRegex = /rgba?\s*\([^)]+\)/;

    // CSS color properties to check
    const colorProperties = new Set([
      'color',
      'backgroundColor',
      'borderColor',
      'borderTopColor',
      'borderRightColor',
      'borderBottomColor',
      'borderLeftColor',
      'outlineColor',
      'fill',
      'stroke',
      'background',
      'border',
    ]);

    function checkForHardcodedColor(node, value) {
      if (typeof value === 'string' && (hexColorRegex.test(value) || rgbaColorRegex.test(value))) {
        context.report({
          node,
          messageId: 'hardcodedColor',
          data: {
            value: value,
          },
        });
      }
    }

    return {
      // Check object properties (style objects, makeStyles)
      Property(node) {
        if (node.key && node.key.name && colorProperties.has(node.key.name)) {
          const value = node.value;
          
          // Check string literals
          if (value.type === 'Literal' && typeof value.value === 'string') {
            checkForHardcodedColor(value, value.value);
          }
          
          // Check template literals
          if (value.type === 'TemplateLiteral' && value.quasis.length > 0) {
            value.quasis.forEach(quasi => {
              if (quasi.value && quasi.value.cooked) {
                checkForHardcodedColor(value, quasi.value.cooked);
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
                if (prop.key && prop.key.name && colorProperties.has(prop.key.name)) {
                  if (prop.value.type === 'Literal' && typeof prop.value.value === 'string') {
                    checkForHardcodedColor(prop.value, prop.value.value);
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
