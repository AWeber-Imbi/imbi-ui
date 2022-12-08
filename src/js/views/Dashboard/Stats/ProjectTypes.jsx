import React, { useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Alert, ContentArea, ErrorBoundary } from '../../../components/'
import { Context } from '../../../state'
import { httpGet } from '../../../utils'

import { Container } from './Container'
import { Value } from './Value'
import PropTypes from 'prop-types'

function ProjectTypes({ onReady }) {
  const [state, setState] = useState({
    data: {
      project_types: []
    },
    fetched: false,
    errorMessage: null
  })
  const [globalState] = useContext(Context)
  const { t } = useTranslation()
  useEffect(() => {
    if (state.fetched === false) {
      const url = new URL('/dashboard', globalState.baseURL)
      httpGet(
        globalState.fetch,
        url,
        ({ data }) => {
          setState({
            data: data,
            fetched: true,
            errorMessage: null
          })
        },
        (error) => {
          setState({
            data: { project_types: [] },
            fetched: true,
            errorMessage: error
          })
        }
      )
    } else {
      onReady()
    }
  }, [state])

  return (
    <ErrorBoundary>
      <ContentArea
        className="flex-grow pt-0"
        pageIcon="fas cubes"
        pageTitle={t('dashboard.projectTypes')}
        setPageTitle={false}>
        {state.errorMessage !== null && (
          <Alert level="error">{state.errorMessage}</Alert>
        )}
        <Container>
          {state.data.project_types.map((row) => {
            return (
              <Value
                key={`stats-${row.name}`}
                title={row.count === 1 ? row.name : row.plural}
                icon={row.icon}
                url={
                  '/ui/projects?f=' +
                  encodeURIComponent('project_type_slug:' + row.slug)
                }
                value={row.count}
              />
            )
          })}
        </Container>
      </ContentArea>
    </ErrorBoundary>
  )
}
ProjectTypes.propTypes = {
  onReady: PropTypes.func.isRequired
}
export { ProjectTypes }
