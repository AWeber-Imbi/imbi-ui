import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { Column } from '../../schema'
import { useContext } from 'react'
import { Context } from '../../state'
import { useTranslation } from 'react-i18next'
import { createSingleColumnSorter, fetchPages, httpGet } from '../../utils'
import { Alert } from '../Alert/Alert'
import { Loading } from '../Loading/Loading'
import { ContentArea } from '../ContentArea/ContentArea'
import { Table } from '../Table'
import { Markdown } from '../Markdown/Markdown'

/**
 * Sortable report table with field descriptions
 *
 * This component is a `Table.Table` with the textual content coming from the
 * localization catalog properties rooted at `keyPrefix`. The title of the report
 * is `${keyPrefix}.title` and the defaults properties for the columns are rooted
 * at `${keyPrefix}.columns`. The component also includes a Definitions section
 * following the table that is derived from the column titles and descriptions.
 * If a column lacks a description, then it will be omitted from the Definitions
 * section.
 *
 * The following localization entry defines a report with one column where
 * `property_name` is the name of the property for the column **in the API
 * response**. The only column in the table has the title *Property Title*
 * and would be described in the Definitions section.
 *
 * ```
 * {
 *   reports: {
 *     myReport: {
 *       title: 'My Report',
 *       columns: {
 *         property_name: {
 *           title: 'Property Title',
 *           description: 'Long winded description of the property' +
 *             ' that can include **markdown**'
 *         }
 *       }
 *     }
 *   }
 * }
 * ```
 *
 * The view definition for this is:
 *
 * ```
 * function MyReport() {
 *   const [data, setData] = React.useState([])
 *   return (
 *     <Report
 *       endpoint="/reports/my-report"
 *       keyPrefix="reports.myReport"
 *       data={data}
 *       onDataLoaded={setData}
 *       columns={[
 *         { name: 'property_name', type: 'text' }
 *       ]}/>
 *   )
 * }
 * ```
 *
 * The `Report` component takes care of:
 *
 *  1. retrieving the report data from the API at `/reports/my-report` and
 *     passing the result as `data` to the `Table`
 *  2. creating the `Column` collection for the `Table` based on the
 *     localization catalog rooted at `keyPrefix`
 *  3. implementing **single column** sorting based on simple comparison or
 *     the optional `column.sortCallback`
 *  4. generating the Definitions section based on the column title and
 *     descriptions
 *  5. dispatching `SET_CURRENT_PAGE` to update the breadcrumbs
 *
 *  Note that the client of this component is the owner of the report data.
 *  This means that you can implement data transformations or filtering as
 *  you see fit. The `Report` takes care of loading the data from the API
 *  and displaying it.
 *
 * @param data {array} -- array of rows to display
 * @param onDataLoaded {function} -- hook to invoke when data is updated
 * @param onSortChange {function} -- optional hook to invoke when the sort order
 *   is updated. Is passed a sorting function suitable for `Array.sort`.
 * @param children -- optional nodes to display above the table content
 * @param columns {ReportColumn} -- array of report columns in the order that
 *  they appear in the table
 * @param endpoint {string} -- Imbi API endpoint to retrieve the report data from
 * @param keyPrefix {string} -- translation key prefix. This is passed to
 *   useTranslation to retrieve the translation details for the report
 * @param pageIcon {string} -- optional FontAwesome icon name to use on the page
 * @param title {string} -- optional title override
 * @param tableProps {TableProps} -- additional properties are passed to the
 *   inner `Table` component
 * @returns {JSX.Element}
 * @constructor
 */
function Report({
  children,
  columns,
  endpoint,
  keyPrefix,
  pageIcon,
  data,
  onDataLoaded,
  onSortChange,
  title,
  ...tableProps
}) {
  const [state, dispatch] = useContext(Context)
  const { t: globalT } = useTranslation()
  const { t } = useTranslation('translation', { keyPrefix })

  const [errorMessage, setErrorMessage] = useState(null)
  const [fetched, setFetched] = useState(false)
  const [sort, setSort] = useState(['', null])

  const pageTitle = title || t('title')

  useEffect(() => {
    dispatch({
      type: 'SET_CURRENT_PAGE',
      payload: {
        title: pageTitle,
        url: new URL(`/ui${endpoint}`, state.baseURL)
      }
    })
  }, [])

  useEffect(() => {
    if (!fetched) {
      fetchPages(
        endpoint,
        state,
        (data, isComplete) => {
          onDataLoaded((prevState) => prevState.concat(data))
          if (isComplete) {
            setFetched(true)
          }
        },
        (message) => {
          setErrorMessage(message)
        }
      )
    }
  }, [fetched])

  function onSortDirection(column, direction) {
    const [curCol, curDir] = sort
    if (curCol !== column || curDir !== direction) {
      const sorter = createSingleColumnSorter(column, direction)
      if (onSortChange) {
        onSortChange(sorter)
      } else {
        onDataLoaded([...data].sort(sorter))
      }
      setSort([column, direction])
    }
  }

  if (errorMessage !== null) {
    return <Alert level="error" message={errorMessage} />
  }
  if (fetched === false) {
    return <Loading />
  }

  const augmentedColumns = columns.map((column) => ({
    description: t(`columns.${column.name}.description`, ''),
    title: t(`columns.${column.name}.title`, ''),
    sortCallback: onSortDirection,
    ...column,
    sortDirection: sort[0] === column.name ? sort[1] : null
  }))

  return (
    <ContentArea
      pageTitle={title || t(`title`)}
      className="flex-grow"
      pageIcon={pageIcon}>
      {children}
      <Table {...tableProps} data={data} columns={augmentedColumns} />
      <div className="italic text-gray-600 text-right text-xs">
        {globalT('reports.lastUpdated', { lastUpdated: new Date().toString() })}
      </div>
      <div className="ml-4 text-gray-600">
        <h1 className="font-medium my-2">{globalT('common.definitions')}</h1>
        <dl className="ml-2 text-sm">
          {augmentedColumns
            .filter((c) => c.description)
            .map((column, idx) => (
              <div key={`${column.name}-term`}>
                <dt
                  key={`term-${idx}`}
                  className={'font-medium' + (idx > 0 ? ' mt-2' : '')}>
                  {column.title}
                </dt>
                <dd>
                  <Markdown>{column.description}</Markdown>
                </dd>
              </div>
            ))}
        </dl>
      </div>
    </ContentArea>
  )
}

const ReportColumn = Object.fromEntries(
  Object.entries(Column).map(([k, v]) => {
    if (k === 'title' || k === 'description') {
      // we will provide these from translation if defined
      return [k, PropTypes.string]
    }
    return [k, v]
  })
)
const TableProps = Object.fromEntries(
  Object.entries(Table.propTypes).filter(
    ([k]) => k !== 'columns' && k !== 'data'
  )
)
Report.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.arrayOf(PropTypes.node)
  ]),
  columns: PropTypes.arrayOf(PropTypes.exact(ReportColumn)).isRequired,
  data: PropTypes.array.isRequired,
  endpoint: PropTypes.string.isRequired,
  keyPrefix: PropTypes.string.isRequired,
  onDataLoaded: PropTypes.func.isRequired,
  onSortChange: PropTypes.func,
  pageIcon: PropTypes.string,
  title: PropTypes.string,
  ...TableProps
}

export default Report
