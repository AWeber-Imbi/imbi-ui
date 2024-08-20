import PropTypes from 'prop-types'
import React from 'react'

function Body({ children, className = 'text-gray-500' }) {
  return <div className={`${className}`}>{children}</div>
}

Body.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.array,
    PropTypes.string,
    PropTypes.element
  ]).isRequired,
  className: PropTypes.string
}
export { Body }
