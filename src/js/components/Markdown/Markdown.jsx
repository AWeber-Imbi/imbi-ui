import PropTypes from 'prop-types'
import React from 'react'
import ReactMarkdown from 'react-markdown'

class Link extends React.PureComponent {
  render() {
    return (
      <a
        href={this.props.href}
        className="text-blue-600 hover:text-blue-800"
        rel="noreferrer"
        target="_blank">
        {this.props.children}
      </a>
    )
  }
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

class UL extends React.PureComponent {
  render() {
    return <ul className="list-disc list-inside">{this.props.children}</ul>
  }
}
UL.propTypes = {
  children: PropTypes.any
}

class Paragraph extends React.PureComponent {
  render() {
    return <p className="pb-1">{this.props.children}</p>
  }
}
Paragraph.propTypes = {
  children: PropTypes.any
}

class Heading extends React.PureComponent {
  constructor(props) {
    super(props)
    this.level = props.level
  }
  render() {
    if (this.level === 1) {
      return <h1 className="text-xl pb-2 text-bold">{this.props.children}</h1>
    }
    if (this.level === 2) {
      return <h2 className="text-lg pb-1 text-bold">{this.props.children}</h2>
    }
    if (this.level === 3) {
      return <h3 className="pb-1 text-bold">{this.props.children}</h3>
    }
    return <p className="text-bold">{this.props.children}</p>
  }
}
Heading.propTypes = {
  level: PropTypes.number.isRequired,
  children: PropTypes.any
}

class Markdown extends React.PureComponent {
  static propTypes = {
    children: PropTypes.oneOfType([
      PropTypes.element,
      PropTypes.arrayOf(PropTypes.element),
      PropTypes.string
    ]),
    className: PropTypes.string
  }

  render() {
    return (
      <ReactMarkdown
        className={this.props.className}
        components={{
          a: ({ ...props }) => <Link {...props} />,
          ul: ({ ...props }) => <UL {...props} />,
          h1: ({ ...props }) => <Heading level={1} {...props} />,
          h2: ({ ...props }) => <Heading level={2} {...props} />,
          h3: ({ ...props }) => <Heading level={3} {...props} />,
          p: ({ ...props }) => <Paragraph {...props} />
        }}>
        {this.props.children}
      </ReactMarkdown>
    )
  }
}
export { Markdown }
