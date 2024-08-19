import PropTypes from 'prop-types'
import React from 'react'
import ReactMarkdown from 'react-markdown'

function Link({ children, href }) {
  return (
    <a
      href={href}
      className="text-blue-600 hover:text-blue-800p"
      rel="noreferrer"
      target="_blank">
      {children}
    </a>
  )
}
Link.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.element,
    PropTypes.arrayOf(PropTypes.element),
    PropTypes.arrayOf(PropTypes.string),
    PropTypes.string
  ]),
  href: PropTypes.string
}

function UL({ children }) {
  return <ul className="list-disc list-inside">{children}</ul>
}
UL.propTypes = {
  children: PropTypes.any
}

function Paragraph({ children }) {
  return <p className="pb-1">{children}</p>
}
Paragraph.propTypes = {
  children: PropTypes.any
}

function Heading({ level, children }) {
  if (level === 1) {
    return <h1 className="text-xl pb-2 text-bold">{children}</h1>
  }
  if (level === 2) {
    return <h2 className="text-lg pb-1 text-bold">{children}</h2>
  }
  if (level === 3) {
    return <h3 className="pb-1 text-bold">{children}</h3>
  }
  return <p className="text-bold">{children}</p>
}
Heading.propTypes = {
  level: PropTypes.number.isRequired,
  children: PropTypes.any
}

function Markdown({ children, className }) {
  return (
    <ReactMarkdown
      className={className}
      components={{
        a: ({ ...props }) => <Link {...props} />,
        ul: ({ ...props }) => <UL {...props} />,
        h1: ({ ...props }) => <Heading level={1} {...props} />,
        h2: ({ ...props }) => <Heading level={2} {...props} />,
        h3: ({ ...props }) => <Heading level={3} {...props} />,
        p: ({ ...props }) => <Paragraph {...props} />
      }}>
      {children}
    </ReactMarkdown>
  )
}
Markdown.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.element,
    PropTypes.arrayOf(PropTypes.element),
    PropTypes.string
  ]),
  className: PropTypes.string
}
export { Markdown }
