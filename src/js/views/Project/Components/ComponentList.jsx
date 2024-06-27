import React, { useContext, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { Alert, Loading, ScoreBadge } from '../../../components'
import { NavigableTable } from '../../../components/Table'
import { useTranslation } from 'react-i18next'
import { Context } from '../../../state'
import { fetchPages } from '../../../utils'
import { ViewComponent } from './ViewComponent'

function ComponentList({ project, urlPath }) {
  const [globalState, dispatch] = useContext(Context)
  const { t } = useTranslation()
  const [components, setComponents] = useState([])
  const [fetching, setFetching] = useState(false)
  const [errorMessage, setErrorMessage] = useState()
  const [selectedIndex, setSelectedIndex] = useState(0)

  useEffect(() => {
    dispatch({
      type: 'SET_CURRENT_PAGE',
      payload: {
        title: t('project.components.plural'),
        url: new URL(`${urlPath}/components`, globalState.baseURL)
      }
    })
  }, [])

  useEffect(() => {
    setFetching(true)
    fetchPages(
      `/projects/${project.id}/components`,
      globalState,
      (data, isComplete) => {
        setComponents((prevState) => prevState.concat(data))
        if (isComplete) setFetching(false)
      },
      (message) => {
        setErrorMessage(message)
        setFetching(false)
      }
    )
  }, [])

  if (fetching) return <Loading />
  if (errorMessage) return <Alert level="error">{errorMessage}</Alert>

  return (
    <NavigableTable
      columns={[
        {
          title: '',
          name: 'icon_class',
          type: 'icon',
          tableOptions: {
            headerClassName: 'w-1/12'
          }
        },
        {
          title: t('common.name'),
          name: 'name',
          type: 'text'
        },
        {
          title: t('terms.package'),
          name: 'package_url',
          type: 'text'
        },
        {
          title: t('terms.version'),
          name: 'version',
          type: 'text'
        },
        {
          title: t('project.components.status'),
          name: 'status',
          type: 'text'
        },
        {
          title: t('terms.healthScore'),
          name: 'score',
          type: 'text',
          tableOptions: {
            lookupFunction: (value) => {
              if (value !== null) {
                return <ScoreBadge value={value} />
              }
              return null
            }
          }
        }
      ]}
      data={components}
      extractSearchParam={(obj) => obj.name}
      title={t('project.components.singular')}
      selectedIndex={selectedIndex}
      setSelectedIndex={setSelectedIndex}
      slideOverElement={<ViewComponent component={components[selectedIndex]} />}
    />
  )
}

ComponentList.propTypes = {
  urlPath: PropTypes.string,
  project: PropTypes.object.isRequired
}
export { ComponentList }
