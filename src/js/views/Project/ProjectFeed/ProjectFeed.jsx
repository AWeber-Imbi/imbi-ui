import { DateTime } from 'luxon'
import PropTypes from 'prop-types'
import React, { useContext, useEffect, useState } from 'react'
import InfiniteScroll from 'react-infinite-scroll-component'

import { Context } from '../../../state'
import { httpGet, parseLinkHeader } from '../../../utils'
import { Alert, Card, ErrorBoundary, Loading } from '../../../components'
import { ProjectFactEntry } from './ProjectFactEntry'
import { useTranslation } from 'react-i18next'
import { ProjectOpsLogEntry } from './ProjectOpsLogEntry'
import { ProjectCreatedEntry } from './ProjectCreatedEntry'
import { ProjectUpdatedEntry } from './ProjectUpdatedEntry'
import { Entry } from './Entry'

function ProjectFeed({ projectID }) {
  const [state] = useContext(Context)
  const [feed, setFeed] = useState({
    entries: [],
    nextLink: new URL(`/projects/${projectID}/feed`, state.baseURL)
  })
  const [errorMessage, setErrorMessage] = useState()
  const { t } = useTranslation()

  useEffect(() => {
    fetchNext()
  }, [])

  async function fetchNext() {
    httpGet(
      state.fetch,
      feed.nextLink,
      ({ data, headers }) => {
        const links = parseLinkHeader(headers.get('Link'))
        const next = Object.hasOwn(links, 'next') ? links.next[0] : null
        setFeed((prevState) => ({
          entries: prevState.entries.concat(
            data.filter((entry) =>
              ['ProjectFeedEntry', 'OperationsLogEntry'].includes(entry.type)
            )
          ),
          nextLink: next
        }))
      },
      (error) => setErrorMessage(error)
    )
  }

  function formatDate(d) {
    return DateTime.fromISO(d).toLocaleString(DateTime.DATETIME_MED)
  }

  let content
  if (errorMessage) {
    content = <Alert level="error">{errorMessage}</Alert>
  } else if (feed.entries.length === 0) {
    content = feed.nextLink ? (
      <div className="flex flex-col justify-items-center content-center h-full">
        <Loading />
      </div>
    ) : (
      <></>
    )
  } else {
    const entries = feed.entries.map((entry, index) => (
      <li key={index} className="relative pb-8 pr-3">
        {index !== feed.entries.length - 1 && (
          <span
            className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200"
            aria-hidden="true"
          />
        )}
        {entry.type === 'ProjectFeedEntry' && entry.what === 'updated fact' && (
          <Entry
            recordedAt={formatDate(entry.when)}
            iconClass={
              entry.icon_class
                ? entry.icon_class
                : entry.value === 'true'
                ? 'fas check'
                : entry.value === 'false'
                ? 'fas times'
                : 'fas sticky-note'
            }>
            <ProjectFactEntry
              what={entry.what}
              recordedBy={entry.display_name}
              factType={entry.fact_name}
              value={entry.value}
            />
          </Entry>
        )}
        {entry.type === 'ProjectFeedEntry' && entry.what === 'created' && (
          <Entry recordedAt={formatDate(entry.when)} iconClass="fas plus">
            <ProjectCreatedEntry recordedBy={entry.display_name} />
          </Entry>
        )}
        {entry.type === 'ProjectFeedEntry' && entry.what === 'updated' && (
          <Entry recordedAt={formatDate(entry.when)} iconClass="fas pencil-alt">
            <ProjectUpdatedEntry recordedBy={entry.display_name} />
          </Entry>
        )}
        {entry.type === 'OperationsLogEntry' && (
          <Entry
            recordedAt={formatDate(entry.recorded_at)}
            iconClass="fas project-diagram">
            <ProjectOpsLogEntry
              displayName={entry.display_name}
              recordedAt={formatDate(entry.recorded_at)}
              changeType={entry.change_type.toLowerCase()}
              project={entry.project_name}
              environment={entry.environment}
              version={entry.version}
              iconClass="fas project-diagram"
            />
          </Entry>
        )}
      </li>
    ))

    content = (
      <ul
        id="project-feed-list"
        role="list"
        className="h-[95%] my-3 overflow-auto">
        <InfiniteScroll
          next={fetchNext}
          hasMore={feed.nextLink !== null}
          loader={<Loading />}
          dataLength={feed.entries.length}
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
        <h2 className="font-medium mb-2">{t('project.feed.title')}</h2>
        {content}
      </Card>
    </ErrorBoundary>
  )
}
ProjectFeed.propTypes = {
  projectID: PropTypes.number.isRequired
}
export { ProjectFeed }
