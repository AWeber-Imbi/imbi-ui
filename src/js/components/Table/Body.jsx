import PropTypes from 'prop-types'
import React from 'react'

import { Columns } from '../../schema'

import { Row } from '.'

function Body({
  columns,
  data,
  itemKey,
  onDeleteClick,
  onEditClick,
  onRowClick,
  rowURL,
  checkIsHighlighted
}) {
  let rowOffset = -1
  return (
    <tbody className="bg-white divide-y divide-gray-200">
      {data.map((row) => {
        rowOffset += 1
        return (
          <Row
            columns={columns}
            data={row}
            index={rowOffset}
            itemKey={itemKey}
            key={'table-row-' + rowOffset}
            onClick={onRowClick}
            onDeleteClick={onDeleteClick}
            onEditClick={onEditClick}
            rowURL={rowURL}
            isHighlighted={checkIsHighlighted && checkIsHighlighted(row)}
          />
        )
      })}
    </tbody>
  )
}

Body.propTypes = {
  columns: Columns.isRequired,
  data: PropTypes.arrayOf(PropTypes.object).isRequired,
  itemKey: PropTypes.string,
  onDeleteClick: PropTypes.func,
  onEditClick: PropTypes.func,
  onRowClick: PropTypes.func,
  rowURL: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  checkIsHighlighted: PropTypes.func
}
export { Body }
