'use strict'

const PHRASES = ['Bom dia', 'Boa tarde', 'Boa noite']

function containsPhrase(text) {
  if (typeof text !== 'string') {
    return false
  }
  return PHRASES.some((phrase) => text.includes(phrase))
}

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Forbid client-side greeting prefixing in components/**',
      recommended: false,
    },
    schema: [],
    messages: {
      noClientPrefix: 'Do not build greeting strings on the client. Render the server-formatted `greeting` prop verbatim.',
    },
  },
  create(context) {
    const filename = context.getFilename()
    const isClientComponent = /[\\/](components|app[\\/].*components)[\\/]/i.test(filename)

    if (!isClientComponent) {
      return {}
    }

    const report = (node) => {
      context.report({ node, messageId: 'noClientPrefix' })
    }

    return {
      TemplateLiteral(node) {
        if (node.expressions.length === 0) {
          return
        }
        const raw = node.quasis.map((part) => part.value.raw).join('')
        if (containsPhrase(raw)) {
          report(node)
        }
      },
      BinaryExpression(node) {
        if (node.operator !== '+') {
          return
        }

        const flatten = (expr, parts = []) => {
          if (expr.type === 'BinaryExpression' && expr.operator === '+') {
            flatten(expr.left, parts)
            flatten(expr.right, parts)
            return parts
          }
          parts.push(expr)
          return parts
        }

        const parts = flatten(node)
        const hasIdentifier = parts.some((part) => part.type === 'Identifier' || part.type === 'MemberExpression')
        if (!hasIdentifier) {
          return
        }

        for (const part of parts) {
          if (part.type === 'Literal' && typeof part.value === 'string' && containsPhrase(part.value)) {
            report(node)
            break
          }
        }
      },
      JSXExpressionContainer(node) {
        if (node.expression?.type === 'TemplateLiteral' && node.expression.expressions.length > 0) {
          const raw = node.expression.quasis.map((part) => part.value.raw).join('')
          if (containsPhrase(raw)) {
            report(node)
          }
        }
      },
    }
  },
}
