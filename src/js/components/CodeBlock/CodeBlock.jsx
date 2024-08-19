import PropTypes from 'prop-types'
import React from 'react'
import SyntaxHighlighter from 'react-syntax-highlighter'
import { github } from 'react-syntax-highlighter/dist/cjs/styles/hljs'

function CodeBlock({ language = null, value }) {
  return (
    <SyntaxHighlighter
      className="p-2 rounded"
      language={language}
      style={github}>
      {value}
    </SyntaxHighlighter>
  )
}

CodeBlock.propTypes = {
  language: PropTypes.string,
  value: PropTypes.string.isRequired
}
export { CodeBlock }
