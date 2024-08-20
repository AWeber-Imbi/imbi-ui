import PropTypes from 'prop-types'
import React from 'react'

const colors = {
  blue: 'border border-blue-300 bg-blue-100 text-blue-800',
  dark: 'border border-gray-300 bg-gray-500 text-gray-300',
  gray: 'border border-gray-300 bg-gray-100 text-gray-800',
  green: 'border border-green-300 bg-green-100 text-green-800',
  indigo: 'border border-indigo-300 bg-indigo-100 text-indigo-800',
  orange: 'border border-orange-300 bg-orange-100 text-orange-800',
  pink: 'border border-pink-300 bg-pink-100 text-pink-800',
  purple: 'border border-purple-300 bg-purple-100 text-purple-800',
  red: 'border border-red-300 bg-red-100 text-red-800',
  yellow: 'border border-yellow-300 bg-yellow-100 text-yellow-800'
}

function Badge({ className, color = 'gray', children, href, target }) {
  if (href !== undefined)
    return (
      <a
        href={href}
        target={target}
        className={
          `inline-flex cursor-pointer items-center px-2.5 py-0.5 rounded-md text-sm font-medium ${colors[color]}` +
          (className !== undefined ? ` ${className}` : '')
        }>
        {children}
      </a>
    )
  return (
    <div
      className={
        `inline-flex cursor-default items-center px-2.5 py-0.5 rounded-md text-sm font-medium ${colors[color]}` +
        (className !== undefined ? ` ${className}` : '')
      }>
      {children}
    </div>
  )
}

Badge.propTypes = {
  className: PropTypes.string,
  color: PropTypes.oneOf([
    'blue',
    'dark',
    'gray',
    'green',
    'indigo',
    'pink',
    'purple',
    'red',
    'yellow'
  ]),
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.element,
    PropTypes.string
  ]).isRequired,
  href: PropTypes.string,
  target: PropTypes.string
}
export { Badge }
