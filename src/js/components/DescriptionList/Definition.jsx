import React from 'react'
import PropTypes from 'prop-types'
import { Icon } from '../Icon/Icon'

function Definition({ term, icon, children, className }) {
  return (
    <div>
      <dt className="font-medium text-gray-500 w-48">{term}</dt>
      <dd
        className={`mt-1 items-start truncate ${
          className !== undefined ? className : ''
        }`}>
        {icon && <Icon icon={icon} className="mr-2 " />}
        {children}
      </dd>
    </div>
  )
}
Definition.propTypes = {
  term: PropTypes.string.isRequired,
  icon: PropTypes.string,
  children: PropTypes.node.isRequired,
  className: PropTypes.string
}
export { Definition }
