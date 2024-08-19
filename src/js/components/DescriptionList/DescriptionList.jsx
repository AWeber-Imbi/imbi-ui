import React from 'react'
import PropTypes from 'prop-types'

function DescriptionList({ children, className = '' }) {
  return (
    <dl className={`space-y-3 overflow-hidden text-gray-900 ${className}`}>
      {children}
    </dl>
  )
}

DescriptionList.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string
}
export { DescriptionList }
