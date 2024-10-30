import PropTypes from 'prop-types'
import React, { useRef, useState } from 'react'

import { Columns } from '../../schema'
import { Table } from './Table'
import { useSearchParams } from 'react-router-dom'
import { SlideOver } from '../SlideOver/SlideOver'
import { Icon } from '../Icon/Icon'
import { createSingleColumnSorter } from '../../utils'

/**
 * Table that shows a slide over when a row is clicked
 *
 * @param columns passed as-is to Table
 * @param data array of data objects, passed to Table and used for navigation
 * @param defaultSort optional column name that the data is sorted by
 * @param defaultSortDirection optional "sort direction" in use if defaultSort
 *                             is included, defaults to "asc"
 * @param extractSearchParam function that returns the property from data[n] used in
 *                           the search params for tracking
 * @param onSortChange function to call when the user selects a different sort order
 *                     for the table.
 * @param selectedIndex index of the current value in data or undefined
 * @param setSelectedIndex setter used for next/previous
 * @param slideOverElement element to use as the root of the content in the slide over
 * @param title title of the slide over
 */
function NavigableTable({
  columns,
  data,
  defaultSort,
  defaultSortDirection,
  extractSearchParam,
  onSortChange,
  selectedIndex,
  setSelectedIndex,
  slideOverElement,
  title
}) {
  const [searchParams, setSearchParams] = useSearchParams()

  const [sort, setSort] = useState([
    defaultSort || '',
    defaultSortDirection || 'asc'
  ])
  const [showArrows, setShowArrows] = useState(false)
  const [slideOverOpen, setSlideOverOpen] = useState(false)
  const arrowLeftRef = useRef(null)
  const arrowRightRef = useRef(null)

  if (!searchParams.get('v') && slideOverOpen) {
    setSlideOverOpen(false)
    setShowArrows(false)
  }
  if (
    searchParams.get('v') &&
    !slideOverOpen &&
    data.length > 0 &&
    selectedIndex !== undefined
  ) {
    setSlideOverOpen(true)
    setShowArrows(true)
  }

  function updateSearchParamsWith(newValue) {
    const newParams = new URLSearchParams()
    for (const [key, value] of searchParams) {
      newParams.set(key, value)
    }
    if (newValue === undefined) {
      newParams.delete('v')
    } else {
      newParams.set('v', newValue)
    }
    setSearchParams(newParams)
  }
  function move(index) {
    setSelectedIndex(index)
    updateSearchParamsWith(extractSearchParam(data[index]))
  }

  function onSortDirection(column, direction) {
    const [curCol, curDir] = sort
    if (curCol !== column || curDir !== direction) {
      onSortChange(createSingleColumnSorter(column, direction))
      setSort([column, direction])
    }
  }

  const augmentedColumns = onSortChange
    ? columns.map((column) => ({
        ...column,
        sortCallback: onSortDirection,
        sortDirection: sort[0] === column.name ? sort[1] : null
      }))
    : columns

  return (
    <div className="m0">
      <Table
        columns={augmentedColumns}
        data={data}
        onRowClick={({ index }) => {
          updateSearchParamsWith(extractSearchParam(data[index]))
          setSlideOverOpen(true)
          setSelectedIndex(index)
          setShowArrows(true)
        }}
        checkIsHighlighted={(row) =>
          extractSearchParam(row) === searchParams.get('v')
        }
      />
      <SlideOver
        open={slideOverOpen}
        onClose={() => {
          updateSearchParamsWith(undefined)
          setSlideOverOpen(false)
        }}
        onKeyDown={(e) => {
          if (!showArrows || selectedIndex !== undefined) return
          if (selectedIndex > 0 && e.key === 'ArrowLeft') {
            arrowLeftRef.current?.focus()
            move(selectedIndex - 1)
          } else if (
            selectedIndex < data.length - 1 &&
            e.key === 'ArrowRight'
          ) {
            arrowRightRef.current?.focus()
            move(selectedIndex + 1)
          }
        }}
        title={
          <div className="flex items-center">
            {title}
            {selectedIndex !== undefined && showArrows && (
              <>
                <button
                  ref={arrowLeftRef}
                  className="ml-4 mr-2 h-min outline-offset-4"
                  onClick={() => {
                    if (selectedIndex > 0) move(selectedIndex - 1)
                  }}
                  tabIndex={selectedIndex === 0 ? -1 : 0}>
                  <Icon
                    icon="fas arrow-left"
                    className={
                      'h-4 select-none block' +
                      (selectedIndex === 0 ? ' text-gray-200' : '')
                    }
                  />
                </button>
                <button
                  ref={arrowRightRef}
                  className="outline-offset-4"
                  onClick={() => {
                    if (selectedIndex < data.length - 1) move(selectedIndex + 1)
                  }}
                  tabIndex={selectedIndex === data.length - 1 ? -1 : 0}>
                  <Icon
                    icon="fas arrow-right"
                    className={
                      'h-4 select-none block' +
                      (selectedIndex === data.length - 1
                        ? ' text-gray-200'
                        : '')
                    }
                  />
                </button>
              </>
            )}
          </div>
        }>
        {data?.length > 0 ? slideOverElement : <></>}
      </SlideOver>
    </div>
  )
}

NavigableTable.propTypes = {
  columns: Columns,
  data: PropTypes.arrayOf(PropTypes.object),
  defaultSort: PropTypes.string,
  defaultSortDirection: PropTypes.string,
  extractSearchParam: PropTypes.func.isRequired,
  onSortChange: PropTypes.func,
  selectedIndex: PropTypes.number,
  setSelectedIndex: PropTypes.func.isRequired,
  slideOverElement: PropTypes.node.isRequired,
  title: PropTypes.string.isRequired
}

export { NavigableTable }
