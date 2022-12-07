import PropTypes from 'prop-types'
import React, { useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import InfiniteScroll from 'react-infinite-scroll-component'

import {
  Alert,
  ContentArea,
  ErrorBoundary,
  Loading,
  Panel
} from '../../../components'
import { Context } from '../../../state'
import { httpGet, parseLinkHeader } from '../../../utils'

import { ActivityEntry } from './ActivityEntry'
import { OpsLogEntry } from './OpsLogEntry'

function Feed({ onReady }) {
  const [globalState] = useContext(Context)
  const [state, setState] = useState({
    data: [],
    fetched: false,
    errorMessage: null,
    nextLink: new URL('/activity-feed?omit_user=SonarQube', globalState.baseURL)
  })
  const { t } = useTranslation()

  useEffect(() => {
    if (!state.fetched) {
      fetchNext()
    } else {
      onReady()
    }
  }, [state.fetched])

  function fetchNext() {
    httpGet(
      globalState.fetch,
      state.nextLink,
      ({ data, headers }) => {
        const links = parseLinkHeader(headers.get('Link'))
        const next = Object.hasOwn(links, 'next') ? links.next[0] : null
        setState((prevState) => ({
          data: prevState.data.concat(data),
          fetched: true,
          errorMessage: null,
          nextLink: next
            ? new URL(`${next}&omit_user=SonarQube`, globalState.baseURL)
            : null
        }))
      },
      (error) => {
        setState({
          data: [],
          fetched: true,
          errorMessage: error,
          nextLink: null
        })
      }
    )
  }

  return (
    <ErrorBoundary>
      <ContentArea
        className="flex flex-col lg:h-full pl-0"
        pageIcon="fas rss"
        pageTitle={t('dashboard.activityFeed.recentActivity')}
        setPageTitle={false}>
        <Panel className="flex-grow overflow-hidden pb-5">
          {state.errorMessage !== null && (
            <Alert level="error">{state.errorMessage}</Alert>
          )}
          <ul
            id="activity-feed-list"
            role="list"
            className="space-y-1 h-full overflow-auto">
            <InfiniteScroll
              next={fetchNext}
              hasMore={state.nextLink !== null}
              loader={<Loading />}
              dataLength={state.data.length}
              scrollableTarget="activity-feed-list"
              scrollThreshold={0.7}>
              {state.data.map((entry, index) => {
                let entryComponent = <></>
                if (entry.type === 'ProjectFeedEntry')
                  entryComponent = (
                    <ActivityEntry key={`entry-${index}`} entry={entry} />
                  )
                else if (entry.type === 'OperationsLogEntry')
                  entryComponent = (
                    <OpsLogEntry key={`entry-${index}`} entry={entry} />
                  )
                return (
                  <>
                    {entryComponent}
                    <div className="h-[1px] w-full bg-gray-200"></div>
                  </>
                )
              })}
            </InfiniteScroll>
          </ul>
        </Panel>
      </ContentArea>
    </ErrorBoundary>
  )
}
Feed.propTypes = {
  onReady: PropTypes.func.isRequired
}
export { Feed }
