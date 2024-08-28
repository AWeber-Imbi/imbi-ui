import React, { useContext, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { Card } from '../../components'
import { Context } from '../../state'

export { Components } from './Components'
export { NamespaceKPIs } from './NamespaceKPIs'
export { OutdatedProjects } from './OutdatedProjects'
export { ProjectTypeDefinitions } from './ProjectTypeDefinitions'

function Reports() {
  const { t } = useTranslation()
  const [state, dispatch] = useContext(Context)
  useEffect(() => {
    dispatch({
      type: 'SET_CURRENT_PAGE',
      payload: {
        title: 'terms.reports',
        url: new URL('/ui/reports', state.baseURL)
      }
    })
  }, [])
  return (
    <div className="flex-grow px-3 py-4">
      <Card className="space-y-3">
        <h1 className="text-gray-700 text-lg">{t('reports.available')}</h1>
        <ul className="list-disc list-inside ml-4 text-gray-600">
          <li>
            <Link to="/ui/reports/components">
              {t('reports.components.title')}
            </Link>
          </li>
          <li>
            <Link to="/ui/reports/namespace-kpis">
              {t('reports.namespaceKPIs.title')}
            </Link>
          </li>
          <li>
            <Link to="/ui/reports/outdated-projects">
              {t('reports.outdatedProjects.title')}
            </Link>
          </li>
          <li>
            <Link to="/ui/reports/project-type-definitions">
              {t('reports.projectTypeDefinitions.title')}
            </Link>
          </li>
        </ul>
      </Card>
    </div>
  )
}

export { Reports }
