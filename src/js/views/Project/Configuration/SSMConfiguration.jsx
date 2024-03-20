import PropTypes from 'prop-types'
import React, { useContext, useEffect, useRef, useState } from 'react'

import { Context } from '../../../state'
import { Alert, Icon, Loading, Table } from '../../../components'
import { useTranslation } from 'react-i18next'
import { SlideOver } from '../../../components/SlideOver/SlideOver'
import { ViewSSMParam } from './ViewSSMParam'
import { useSearchParams } from 'react-router-dom'
import { httpGet } from '../../../utils'

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
  const [searchParams, setSearchParams] = useSearchParams()
  const [onFetch, setOnFetch] = useState(true)
  const [fetching, setFetching] = useState(false)
  const [errorMessage, setErrorMessage] = useState()
  const [rows, setRows] = useState([])
  const [slideOverOpen, setSlideOverOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState()
  const [slideOverFocusTrigger, setSlideOverFocusTrigger] = useState({})
  const [showArrows, setShowArrows] = useState(false)
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
  }

  useEffect(() => {
    if (fetching || !onFetch) return
    setFetching(true)

    httpGet(
      globalState.fetch,
      new URL(`/projects/${project.id}/configuration/ssm`, globalState.baseURL),
      ({ data }) => {
        setRows(data.sort((a, b) => (a.name > b.name ? 1 : -1)))
        setFetching(false)
      },
      ({ message }) => {
        setErrorMessage(message)
        setFetching(false)
      }
    )
    setOnFetch(false)
  }, [onFetch])

  if (fetching) return <Loading></Loading>
  if (errorMessage) return <Alert level="error">{errorMessage}</Alert>

  return (
    <div className="m-0">
      <Table
        columns={[
          {
            title: t('common.name'),
            name: 'name',
            type: 'text',
            tableOptions: {
              headerClassName: 'w-10/12'
            }
          },
          {
            title: t('common.type'),
            name: 'type',
            type: 'text',
            tableOptions: {
              className: 'truncate'
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
        <ViewSSMParam param={rows[selectedIndex]} />
      </SlideOver>
    </div>
  )
}

SSMConfiguration.propTypes = {
  project: PropTypes.object.isRequired
}
export { SSMConfiguration }
