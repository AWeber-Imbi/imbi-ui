import React, { useContext, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { Alert, Loading, ScoreBadge } from '../../../components'
import { NavigableTable } from '../../../components/Table'
import { useTranslation } from 'react-i18next'
import { Context } from '../../../state'
import { fetchPages } from '../../../utils'
import { ViewComponent } from './ViewComponent'
import { ComponentStatusBadge } from './ComponentStatusBadge'

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
        if (isComplete) {
          setFetching(false)
          setComponents((prevState) =>
            prevState
              .concat(data)
              .sort((a, b) => (a['name'] < b['name'] ? -1 : 1))
          )
        } else {
          setComponents((prevState) => prevState.concat(data))
        }
      },
      (message) => {
        setErrorMessage(message)
        setFetching(false)
      }
    )
  }, [])

  function onSortChange(sortFunction) {
    setComponents((prevState) => [...prevState].sort(sortFunction))
  }

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
          type: 'text',
          tableOptions: {
            headerClassName: 'w-3/12',
            className: 'truncate'
          }
        },
        {
          title: t('terms.package'),
          name: 'package_url',
          type: 'text',
          tableOptions: {
            headerClassName: 'w-4/12',
            className: 'truncate'
          }
        },
        {
          title: t('project.components.activeVersion'),
          name: 'active_version',
          type: 'text',
          tableOptions: {
            headerClassName: 'w-1/12',
            className: 'overflow-clip'
          }
        },
        {
          title: t('terms.version'),
          name: 'version',
          type: 'text',
          tableOptions: {
            headerClassName: 'w-1/12',
            className: 'overflow-clip'
          }
        },
        {
          title: t('project.components.status'),
          name: 'status',
          type: 'text',
          tableOptions: {
            headerClassName: 'w-1/12',
            lookupFunction: ComponentStatusBadge
          }
        }
      ]}
      data={components}
      defaultSort="name"
      extractSearchParam={(obj) => obj.name}
      onSortChange={onSortChange}
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
