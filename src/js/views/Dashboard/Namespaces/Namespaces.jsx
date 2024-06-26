import PropTypes from 'prop-types'
import React, { useContext, useEffect, useState } from 'react'
import { Sparklines, SparklinesLine } from 'react-sparklines'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import {
  Alert,
  ContentArea,
  ErrorBoundary,
  ScoreBadge
} from '../../../components'
import { Head } from '../../../components/Table/'
import { Context } from '../../../state'
import { httpGet } from '../../../utils'
import { lookupNamespaceByID } from '../../../utils'

import { PopupGraph } from './PopupGraph'

function formatNumber(value) {
  return value.toLocaleString()
}

function Namespaces({ onReady }) {
  const [globalState] = useContext(Context)
  const navigate = useNavigate()
  const [state, setState] = useState({
    chart: null,
    fetchedNamespaces: false,
    fetchedKPIHistory: false,
    kpiHistory: {},
    kpiHistoryErrorMessage: null,
    namespaces: [],
    namespaceErrorMessage: null
  })
  const { t } = useTranslation()

  useEffect(() => {
    if (state.fetchedNamespaces === false) {
      const url = new URL('/reports/namespace-kpis', globalState.baseURL)
      httpGet(
        globalState.fetch,
        url,
        ({ data }) => {
          const namespaces = data.sort((a, b) =>
            a.stack_health_score < b.stack_health_score ? 1 : -1
          )
          setState({
            ...state,
            namespaces: namespaces,
            fetchedNamespaces: true,
            namespaceErrorMessage: null
          })
        },
        ({ message }) => {
          setState({
            ...state,
            fetchedNamespaces: true,
            namespaceErrorMessage: message
          })
        }
      )
    }
  }, [state.fetchedNamespaces])

  useEffect(() => {
    if (state.fetchedKPIHistory === false) {
      const url = new URL('/reports/namespace-shs-history', globalState.baseURL)
      httpGet(
        globalState.fetch,
        url,
        ({ data }) => {
          const namespaces = new Set()
          const kpiHistory = {}
          data.forEach((entry) => {
            namespaces.add(entry.namespace_id)
          })
          namespaces.forEach((namespace_id) => {
            const history = data
              .filter((entry) => entry.namespace_id === namespace_id)
              .map((entry) => {
                if (entry.namespace_id === namespace_id)
                  return {
                    date: entry.scored_on,
                    value: entry.health_score
                  }
              })
            kpiHistory[namespace_id] = history.sort((a, b) => {
              return a.date > b.date ? 1 : -1
            })
          })
          setState({
            ...state,
            kpiHistory: kpiHistory,
            fetchedKPIHistory: true,
            kpiHistoryErrorMessage: null
          })
        },
        ({ message }) => {
          setState({
            ...state,
            kpiHistory: {},
            fetchedKPIHistory: false,
            kpiHistoryErrorMessage: message
          })
        }
      )
    }
  }, [state.fetchedKPIHistory])

  useEffect(() => {
    if (state.fetchedNamespaces === true && state.fetchedKPIHistory === true)
      onReady()
  }, [state.fetchedNamespaces, state.fetchedKPIHistory])

  const columns = [
    {
      title: t('terms.namespace'),
      name: 'namespace',
      type: 'text',
      tableOptions: {
        headerClassName: 'w-4/12'
      }
    },
    {
      title: t('terms.projects'),
      name: 'projects',
      type: 'text',
      tableOptions: {
        headerClassName: 'text-center w-2/12'
      }
    },
    {
      title: t('terms.stackHealthScore'),
      name: 'stack_health_score',
      type: 'text',
      tableOptions: {
        headerClassName: 'text-center w-2/12'
      }
    },
    {
      title: t('terms.scoreHistory'),
      name: 'score_history',
      type: 'text',
      tableOptions: {
        headerClassName: 'text-center w-4/12'
      }
    }
  ]

  function onShowChart(namespace_id) {
    const namespace = state.namespaces.filter(
      (entry) => entry.namespace_id === namespace_id
    )[0]
    setState({
      ...state,
      chart: {
        title: t('dashboard.namespaces.chartTitle', {
          namespace: namespace.namespace
        }),
        data: state.kpiHistory[namespace_id]
      }
    })
  }
  return (
    <ErrorBoundary>
      {state.chart !== null && (
        <PopupGraph
          title={state.chart.title}
          icon="fas chart-line"
          label={t('dashboard.namespaces.stackHealthScore')}
          data={state.chart.data}
          onClose={() => {
            setState({
              ...state,
              chart: null
            })
          }}
        />
      )}
      <ContentArea
        className="flex flex-col lg:h-full pr-0"
        pageIcon="fas boxes"
        pageTitle={t('dashboard.namespaces.title')}
        setPageTitle={false}>
        {state.namespaceErrorMessage !== null && (
          <Alert level="error">{state.namespaceErrorMessage}</Alert>
        )}
        {state.kpiHistoryErrorMessage !== null && (
          <Alert level="error">{state.kpiHistoryErrorMessage}</Alert>
        )}
        <div className="bg-gray-50 h-full overflow-y-scroll rounded-lg shadow">
          <table className="bg-gray-50 divide-y divide-gray-200 table-fixed w-full">
            <Head columns={columns} />
            <tbody className="bg-white divide-y divide-gray-200">
              {state.namespaces.map((namespace) => {
                const values = (
                  state.kpiHistory[namespace.namespace_id] || []
                ).map((entry) => entry.value)
                const projectsURL =
                  '/ui/projects?f=' +
                  encodeURIComponent(
                    `namespace_slug:${
                      lookupNamespaceByID(
                        globalState.metadata.namespaces,
                        namespace.namespace_id
                      ).slug
                    }`
                  )
                return (
                  <tr
                    className="hover:bg-gray-100 cursor-pointer hover:text-blue-700"
                    key={`namespace-${namespace.namespace_id}`}>
                    <td className="w-4/12">
                      <Link
                        to={projectsURL}
                        className="block h-full w-full px-5 py-1.5 whitespace-nowrap">
                        {namespace.namespace}
                      </Link>
                    </td>
                    <td className="w-2/12">
                      <Link
                        to={projectsURL}
                        className="block h-full w-full px-5 py-1.5 text-center">
                        {formatNumber(namespace.projects)}
                      </Link>
                    </td>
                    <td className="w-2/12">
                      <Link
                        to={projectsURL}
                        className="block h-full w-full px-5 py-1.5 text-center">
                        <ScoreBadge
                          value={Math.round(namespace.stack_health_score)}
                        />
                      </Link>
                    </td>
                    <td
                      className="p-0 pr-5 text-center w-4/12"
                      onClick={() => onShowChart(namespace.namespace_id)}>
                      <div className="border border-gray-100 rounded sparkline">
                        {values && (
                          <Sparklines data={values} height={20} margin={5}>
                            <SparklinesLine
                              color="#1d4ed8"
                              style={{ strokeWidth: 0.3 }}
                            />
                          </Sparklines>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </ContentArea>
    </ErrorBoundary>
  )
}
Namespaces.propTypes = {
  onReady: PropTypes.func.isRequired
}
export { Namespaces }
