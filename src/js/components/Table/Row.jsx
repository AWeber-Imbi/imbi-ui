import PropTypes from 'prop-types'
import React, { Fragment } from 'react'
import { useTranslation } from 'react-i18next'

import { Columns } from '../../schema'
import { Column } from '.'

function Row({
  columns,
  data,
  index,
  itemKey,
  onClick,
  onDeleteClick,
  onEditClick,
  rowURL,
  isHighlighted
}) {
  const { t } = useTranslation()
  const toRender = columns
    .map((column) => {
      if (column.tableOptions === undefined) return column
      if (column.tableOptions.hide !== true) return column
    })
    .filter((column) => column !== undefined)

  function deleteOnClick(e) {
    e.preventDefault()
    onDeleteClick(data[itemKey])
  }

  function editOnClick(e) {
    e.preventDefault()
    onEditClick(data[itemKey])
  }

  let colOffset = -1
  return (
    <tr
      className={
        (onClick !== undefined ? 'cursor-pointer ' : '') +
        (isHighlighted && 'bg-gray-100 text-blue-700 ') +
        'hover:bg-gray-100 hover:text-blue-700'
      }
      onClick={(event) => {
        // Let elements with an explicit onclick do their thing
        // This is necessary for the Edit and Delete buttons ;)
        if (event.target.onclick === null) {
          event.preventDefault()
          if (onClick !== undefined) onClick({ data, index })
        }
      }}>
      {toRender.map((column) => {
        colOffset += 1
        let to =
          rowURL === undefined
            ? undefined
            : typeof rowURL == 'function'
            ? rowURL(data)
            : rowURL
        return (
          <Column
            definition={column}
            key={'table-row-' + index + '-col-' + colOffset}
            linkTo={to}>
            {data[column.name]}
          </Column>
        )
      })}
      {(onEditClick !== undefined || onDeleteClick !== undefined) && (
        <Column
          definition={{
            name: 'edit-delete',
            title: 'Edit / Delete',
            tableOptions: { className: 'text-center' },
            type: 'internal'
          }}>
          <Fragment>
            {onEditClick !== undefined && (
              <button
                type="button"
                className="text-center text-gray-400 hover:text-blue-700 focus:outline-none"
                onClick={editOnClick}>
                {t('common.edit')}
              </button>
            )}
            {onEditClick !== undefined && onDeleteClick !== undefined && (
              <span className="mx-2">&ndash;</span>
            )}
            {onDeleteClick !== undefined && (
              <button
                type="button"
                className="text-center text-gray-400 hover:text-red-700 focus:outline-none"
                onClick={deleteOnClick}>
                {t('common.delete')}
              </button>
            )}
          </Fragment>
        </Column>
      )}
    </tr>
  )
}
Row.defaultProps = {
  isHighlighted: false
}
Row.propTypes = {
  columns: Columns.isRequired,
  data: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  itemKey: PropTypes.string,
  onClick: PropTypes.func,
  onDeleteClick: PropTypes.func,
  onEditClick: PropTypes.func,
  rowURL: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  isHighlighted: PropTypes.bool
}
export { Row }
