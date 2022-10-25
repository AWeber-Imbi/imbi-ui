import React from 'react'
import PropTypes from 'prop-types'

function DescriptionList({ children }) {
  return (
    <dl className="lg:ml-4 my-3 space-y-6 overflow-hidden text-gray-900">
      {children}
    </dl>
  )
}
DescriptionList.propTypes = {
  children: PropTypes.node.isRequired
}
export { DescriptionList }
