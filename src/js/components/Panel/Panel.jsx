import PropTypes from 'prop-types'
import React from 'react'

function Panel({ children, className }) {
  return (
    <div
      className={`bg-white shadow rounded-lg p-3 ${
        className !== undefined ? className : ''
      }`}>
      {children}
    </div>
  )
}
Panel.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
    PropTypes.func
  ]),
  className: PropTypes.string
}
export { Panel }
