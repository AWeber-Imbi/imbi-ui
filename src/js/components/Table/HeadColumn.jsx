import PropTypes from 'prop-types'
import React from 'react'

import { Column } from '../../schema'
import { Icon } from '../'

const Asc = 'asc'
const Desc = 'desc'

const SortIcon = {
  null: 'fas sort',
  asc: 'fas sort-up',
  desc: 'fas sort-down'
}

const ColClassName =
  'align-middle px-6 py-2 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap'

function HeadColumn({ column, children, className, disabled, srOnly }) {
  function onSortClick(event) {
    event.preventDefault()
    if (disabled) return

    if (column.sortCallback !== undefined) {
      const direction =
        column.sortDirection === null
          ? Asc
          : column.sortDirection === Asc
          ? Desc
          : null

      column.sortCallback(column.name, direction)
    }
  }

  let clsName =
    column.tableOptions !== undefined &&
    column.tableOptions.headerClassName !== undefined
      ? column.tableOptions.headerClassName
      : ''

  if (className !== undefined) clsName = `${clsName} ${className}`
  clsName = `${clsName} ${
    column.sortCallback !== undefined ? 'cursor-pointer' : ''
  }`
  if (disabled) clsName = `${clsName} disabled cursor-wait`

  if (srOnly === true) {
    return (
      <th scope="col" className={'relative px-6 py-2 ' + clsName}>
        <span className="sr-only">
          {children !== undefined && children}
          {column.title !== undefined && column.title}
        </span>
      </th>
    )
  }
  return (
    <th
      scope="col"
      className={`${ColClassName} ${clsName} ${
        column.sortDirection !== null && column.sortDirection !== undefined
          ? 'text-blue-700'
          : 'text-gray-500'
      }`}
      onClick={onSortClick}>
      {column.sortCallback !== undefined &&
        column.sortDirection !== undefined && (
          <Icon
            icon={SortIcon[column.sortDirection]}
            className={`mr-2 ${
              column.sortDirection !== null ? ' text-blue-700' : ''
            }`}
          />
        )}
      {children !== undefined && children}
      {column.title !== undefined && column.title}
    </th>
  )
}
HeadColumn.defaultProps = {
  column: { name: 'default', title: 'default', type: 'text' },
  sort: null,
  srOnly: false
}
HeadColumn.propTypes = {
  column: PropTypes.exact(Column),
  children: PropTypes.string,
  className: PropTypes.string,
  disabled: PropTypes.bool,
  srOnly: PropTypes.bool
}
export { HeadColumn }
