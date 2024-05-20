import React from 'react'
import PropTypes from 'prop-types'
import { Icon } from '../Icon/Icon'

function DefinitionRow({ term, icon, children, className }) {
  return (
    <div className="flex gap-2">
      <dt className="shrink-0 w-1/6 items-start text-xs font-medium text-gray-500 tracking-wider break-words">
        {term}
      </dt>
      <dd className={`${className !== undefined ? className : ''}`}>
        {icon && <Icon icon={icon} className="mr-2 " />}
        {children}
      </dd>
    </div>
  )
}
DefinitionRow.propTypes = {
  term: PropTypes.node.isRequired,
  icon: PropTypes.string,
  children: PropTypes.node.isRequired,
  className: PropTypes.string
}
export { DefinitionRow }
