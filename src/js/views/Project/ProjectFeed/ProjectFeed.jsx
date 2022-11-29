import { DateTime } from 'luxon'
import PropTypes from 'prop-types'
import React, { useContext, useEffect, useState } from 'react'
import InfiniteScroll from 'react-infinite-scroll-component'

import { Context } from '../../../state'
import { httpGet, parseLinkHeader } from '../../../utils'
import { Alert, Card, ErrorBoundary, Loading } from '../../../components'
import { ProjectFactEntry } from './ProjectFactEntry'
import { useTranslation } from 'react-i18next'

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
            data
              .filter(
                (entry) =>
                  (entry.type || 'ProjectFeedEntry') === 'ProjectFeedEntry'
              )
              .map((entry) => ({
                ...entry,
                when: DateTime.fromISO(entry.when).toLocaleString(
                  DateTime.DATETIME_MED
                )
              }))
          ),
          nextLink: next
        }))
      },
      (error) => setErrorMessage(error)
    )
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
        <ProjectFactEntry
          score={entry.score}
          recordedBy={entry.display_name}
          recordedAt={entry.when}
          factType={entry.fact_name}
          value={entry.value}
          iconClass={
            entry.icon_class
              ? entry.icon_class
              : entry.value === 'true'
              ? 'fas check-circle'
              : entry.value === 'false'
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
