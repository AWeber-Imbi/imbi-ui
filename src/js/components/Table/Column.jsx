import { Link } from 'react-router-dom'
import PropTypes from 'prop-types'
import React from 'react'

import { Column as ColumnPropTypes } from '../../schema'
import { Icon } from '..'
import { DateTime } from 'luxon'

function Column({ definition, children, linkTo }) {
  let clsName = ''
  let value = children
  if (definition !== undefined && definition.tableOptions !== undefined) {
    if (definition.type === 'icon')
      value = <Icon className="mr-2" icon={children} title={children} />
    else if (definition.type === 'datetime')
      value = DateTime.fromISO(children).toLocaleString(DateTime.DATETIME_MED)
    if (definition.tableOptions.className !== undefined)
      clsName = definition.tableOptions.className
    if (definition.tableOptions.lookupFunction !== undefined)
      value = definition.tableOptions.lookupFunction(children)
  }
  if (linkTo !== undefined)
    return (
      <td>
        <Link
          className={`align-middle h-full inline-block px-5 py-1.5 w-full whitespace-nowrap ${clsName}`}
          to={linkTo}>
          {value}
        </Link>
      </td>
    )
  return <td className={`px-5 py-1.5 whitespace-nowrap ${clsName}`}>{value}</td>
}
Column.propTypes = {
  definition: PropTypes.exact(ColumnPropTypes),
  children: PropTypes.oneOfType([
    PropTypes.element,
    PropTypes.number,
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.element),
    PropTypes.arrayOf(PropTypes.number),
    PropTypes.arrayOf(PropTypes.string)
  ]),
  linkTo: PropTypes.string
}
export { Column }
