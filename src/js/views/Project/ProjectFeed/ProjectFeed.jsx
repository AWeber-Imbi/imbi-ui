import { DateTime } from 'luxon'
import PropTypes from 'prop-types'
import React, { useContext, useEffect, useState } from 'react'
import InfiniteScroll from 'react-infinite-scroll-component'

import { Context } from '../../../state'
import { httpGet } from '../../../utils'
import { Alert, Card, ErrorBoundary, Loading } from '../../../components'
import { ProjectFactEntry } from './ProjectFactEntry'
import { useTranslation } from 'react-i18next'

const FETCH_LIMIT = 25

function ProjectFeed({ projectID }) {
  const [state, dispatch] = useContext(Context)
  const [factHistory, setFactHistory] = useState({
    entries: [],
    hasMore: true
  })
  const [errorMessage, setErrorMessage] = useState()
  const { t } = useTranslation()

  useEffect(() => {
    httpGet(
      state.fetch,
      buildURL(0),
      (result) => {
        const entries = normalizeFactHistory(result)
        setFactHistory({
          entries: entries,
          hasMore: entries.length === FETCH_LIMIT
        })
      },
      (error) => setErrorMessage(error)
    )
  }, [])

  async function fetchNext() {
    httpGet(
      state.fetch,
      buildURL(factHistory.entries.length),
      (result) => {
        const entries = normalizeFactHistory(result)
        setFactHistory((prevState) => ({
          entries: prevState.entries.concat(entries),
          hasMore: entries.length === FETCH_LIMIT
        }))
      },
      (error) => setErrorMessage(error)
    )
  }

  function buildURL(offset) {
    return new URL(
      `/projects/${projectID}/fact-history?limit=${FETCH_LIMIT}&offset=${offset}`,
      state.baseURL
    )
  }

  function normalizeFactHistory(entries) {
    const factTypeById = new Map(
      state.metadata.projectFactTypes.map((f) => [f.id, f])
    )
    // defaulting 'type' to 'ProjectFeedType' for backwards compatibility
    return entries
      .filter((f) => (f.type || 'ProjectFeedEntry') === 'ProjectFeedEntry')
      .map((f) => ({
        ...f,
        project_fact_type: factTypeById.get(f.fact_type_id).name,
        recorded_at: DateTime.fromISO(f.recorded_at).toLocaleString(
          DateTime.DATETIME_MED
        )
      }))
  }

  let content
  if (errorMessage) {
    content = <Alert level="error">{errorMessage}</Alert>
  } else if (factHistory.entries.length === 0) {
    content = factHistory.hasMore ? (
      <div className="flex flex-col justify-items-center content-center h-full">
        <Loading />
      </div>
    ) : (
      <></>
    )
  } else {
    const entries = factHistory.entries.map((fact, index) => (
      <li key={index} className="relative pb-8 pr-3">
        {index !== factHistory.entries.length - 1 && (
          <span
            className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200"
            aria-hidden="true"
          />
        )}
        <ProjectFactEntry
          score={fact.score}
          recordedBy={fact.recorded_by}
          recordedAt={fact.recorded_at}
          factType={fact.project_fact_type}
          value={fact.value}
          iconClass={
            fact.icon_class
              ? fact.icon_class
              : fact.value === 'true'
              ? 'fas check-circle'
              : fact.value === 'false'
              ? 'fas times-circle'
              : 'fas sticky-note'
          }
        />
      </li>
    ))

    content = (
      <ul
        id="project-feed-list"
        role="list"
        className="h-[95%] my-3 overflow-auto">
        <InfiniteScroll
          next={fetchNext}
          hasMore={factHistory.hasMore}
          loader={<Loading />}
          dataLength={factHistory.entries.length}
          scrollableTarget="project-feed-list"
          scrollThreshold={0.7}>
          {entries}
        </InfiniteScroll>
      </ul>
    )
  }

  return (
    <ErrorBoundary>
      <Card className="flow-root h-full">
        <h2 className="font-medium mb-2">{t('project.feed')}</h2>
        {content}
      </Card>
    </ErrorBoundary>
  )
}
ProjectFeed.propTypes = {
  projectID: PropTypes.number.isRequired
}
export { ProjectFeed }
