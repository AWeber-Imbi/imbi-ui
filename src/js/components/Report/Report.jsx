import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { Column } from '../../schema'
import { useContext } from 'react'
import { Context } from '../../state'
import { useTranslation } from 'react-i18next'
import { fetchPages, httpGet } from '../../utils'
import { Alert } from '../Alert/Alert'
import { Loading } from '../Loading/Loading'
import { ContentArea } from '../ContentArea/ContentArea'
import { NavigableTable, Table } from '../Table'
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
 *   return (
 *     <Report
 *       endpoint="/reports/my-report"
 *       keyPrefix="reports.myReport"
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
  columns,
  endpoint,
  keyPrefix,
  pageIcon,
  title,
  ...tableProps
}) {
  const [state, dispatch] = useContext(Context)
  const { t: globalT } = useTranslation()
  const { t } = useTranslation('translation', { keyPrefix })

  const [errorMessage, setErrorMessage] = useState(null)
  const [fetched, setFetched] = useState(false)
  const [reportData, setReportData] = useState([])
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
          if (isComplete) {
            setFetched(true)
            setReportData((prevState) => prevState.concat(data))
          } else {
            setReportData((prevState) => prevState.concat(data))
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
      setReportData(
        [...reportData].sort((a, b) => {
          if (a[column] === null || a[column] < b[column])
            return direction === 'asc' ? -1 : 1
          if (b[column] === null || b[column] < a[column])
            return direction === 'asc' ? 1 : -1
        })
      )
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
      <Table {...tableProps} data={reportData} columns={augmentedColumns} />
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
  columns: PropTypes.arrayOf(PropTypes.exact(ReportColumn)).isRequired,
  endpoint: PropTypes.string.isRequired,
  keyPrefix: PropTypes.string.isRequired,
  pageIcon: PropTypes.string,
  title: PropTypes.string,
  ...TableProps
}

export default Report
