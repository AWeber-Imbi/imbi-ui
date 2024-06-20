import PropTypes from 'prop-types'
import React, { useContext, useEffect, useRef, useState } from 'react'

import { Context } from '../../../state'
import { Alert, Button, Icon, Loading, Table } from '../../../components'
import { useTranslation } from 'react-i18next'
import { SlideOver } from '../../../components/SlideOver/SlideOver'
import { ViewSSMParam } from './ViewSSMParam'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { httpGet } from '../../../utils'
import { AddSSMParam } from './AddSSMParam'

function cloneParams(searchParams) {
  const newParams = new URLSearchParams()
  for (const [key, value] of searchParams) {
    newParams.set(key, value)
  }
  return newParams
}

function SSMConfiguration({ project }) {
  const [globalState, dispatch] = useContext(Context)
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [fetching, setFetching] = useState(false)
  const [errorMessage, setErrorMessage] = useState()
  const [rows, setRows] = useState([])
  const [slideOverOpen, setSlideOverOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState()
  const [slideOverFocusTrigger, setSlideOverFocusTrigger] = useState({})
  const [showArrows, setShowArrows] = useState(false)
  const [showSecureStrings, setShowSecureStrings] = useState(false)
  const [showCreatePage, setShowCreatePage] = useState(false)
  const arrowLeftRef = useRef(null)
  const arrowRightRef = useRef(null)

  if (searchParams.get('v') && !slideOverOpen && rows.length > 0) {
    setSlideOverOpen(true)
    setShowArrows(true)
    setSelectedIndex(
      rows.findIndex((row) => row.name === searchParams.get('v'))
    )
  } else if (!searchParams.get('v') && slideOverOpen) {
    setSlideOverOpen(false)
    setShowArrows(false)
  }

  function move(index) {
    setSelectedIndex(index)
    const newParams = cloneParams(searchParams)
    newParams.set('v', rows[index].name)
    setSearchParams(newParams)
    setShowSecureStrings(false)
  }

  function onShowSecureStringsChange(value) {
    setShowSecureStrings(value)
  }

  function refreshParams() {
    setFetching(true)

    httpGet(
      globalState.fetch,
      new URL(`/projects/${project.id}/configuration/ssm`, globalState.baseURL),
      ({ data }) => {
        setRows(
          data
            .sort((a, b) => (a.name > b.name ? 1 : -1))
            .map((param) => {
              const types = new Set()
              const environments = new Set()
              param.values.forEach((value) => {
                types.add(value.type)
                environments.add(value.environment)
              })
              param['type'] = Array.from(types).sort().join(', ')
              param['environments'] = Array.from(environments).sort().join(', ')
              return param
            })
        )
        setFetching(false)
      },
      ({ message, status }) => {
        if (status === 403) {
          navigate('/ui/')
        } else {
          setErrorMessage(message)
          setFetching(false)
        }
      }
    )
  }

  useEffect(() => {
    refreshParams()
  }, [])

  if (fetching) return <Loading></Loading>
  if (errorMessage) return <Alert level="error">{errorMessage}</Alert>

  let namespaceSlug
  for (const namespace of globalState.metadata.namespaces) {
    if (namespace.slug === project.namespace_slug) {
      namespaceSlug = namespace.aws_ssm_slug
      break
    }
  }
  const prefix = globalState.ssmPrefixTemplate
    .replace('{namespace_slug}', namespaceSlug)
    .replace('{project_type_slug}', project.project_type_slug)
    .replace('{project_slug}', project.slug)

  if (showCreatePage) {
    return (
      <AddSSMParam
        onClose={() => {
          setShowCreatePage(false)
          refreshParams()
        }}
        project={project}
        onSubmit={() => {}}
        pathPrefix={prefix}
      />
    )
  }

  return (
    <>
      <div className="flex justify-end">
        <Button
          className="btn-green"
          type="submit"
          onClick={() => setShowCreatePage(true)}>
          <Icon className="mr-2" icon="fas plus-circle" />
          {t('project.configuration.ssm.add')}
        </Button>
      </div>
      <Table
        columns={[
          {
            title: t('common.name'),
            name: 'name',
            type: 'text',
            tableOptions: {
              className: 'truncate',
              headerClassName: 'w-6/12'
            }
          },
          {
            title: t('common.type'),
            name: 'type',
            type: 'text',
            tableOptions: {
              className: 'truncate',
              headerClassName: 'w-1/12'
            }
          },
          {
            title: t('terms.environments'),
            name: 'environments',
            type: 'text',
            tableOptions: {
              className: 'truncate',
              headerClassName: 'w-2/12'
            }
          }
        ]}
        data={rows}
        onRowClick={({ index }) => {
          const newParams = cloneParams(searchParams)
          newParams.set('v', rows[index].name)
          setSearchParams(newParams)
          setSlideOverOpen(true)
          setSelectedIndex(index)
          setShowArrows(true)
        }}
        checkIsHighlighted={(row) => row.name === searchParams.get('v')}
      />
      <SlideOver
        open={slideOverOpen}
        title={
          <div className="flex items-center">
            {t('aws.ssmParameter')}
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
                    if (selectedIndex < rows.length - 1) move(selectedIndex + 1)
                  }}
                  tabIndex={selectedIndex === rows.length - 1 ? -1 : 0}>
                  <Icon
                    icon="fas arrow-right"
                    className={
                      'h-4 select-none block' +
                      (selectedIndex === rows.length - 1
                        ? ' text-gray-200'
                        : '')
                    }
                  />
                </button>
              </>
            )}
          </div>
        }
        focusTrigger={slideOverFocusTrigger}
        onClose={() => {
          const newParams = cloneParams(searchParams)
          newParams.delete('v')
          setSearchParams(newParams)
          setSlideOverOpen(false)
        }}
        onKeyDown={(e) => {
          if (!showArrows) return
          if (selectedIndex > 0 && e.key === 'ArrowLeft') {
            arrowLeftRef.current?.focus()
            move(selectedIndex - 1)
          } else if (
            selectedIndex < rows.length - 1 &&
            e.key === 'ArrowRight'
          ) {
            arrowRightRef.current?.focus()
            move(selectedIndex + 1)
          }
        }}>
        <ViewSSMParam
          project={project}
          pathPrefix={prefix}
          param={rows[selectedIndex]}
          showSecureStrings={showSecureStrings}
          onShowSecureStringsChange={onShowSecureStringsChange}
          onDeleteComplete={() => {
            const newParams = cloneParams(searchParams)
            newParams.delete('v')
            setSearchParams(newParams)
            refreshParams()
          }}
          onDeleteOpen={() => setShowArrows(false)}
          onDeleteClose={() => {
            setShowArrows(true)
            setSlideOverFocusTrigger({})
          }}
        />
      </SlideOver>
    </>
  )
}

SSMConfiguration.propTypes = {
  project: PropTypes.object.isRequired
}
export { SSMConfiguration }
