import PropTypes from 'prop-types'
import React, { useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Alert, ContentArea, ErrorBoundary, Panel } from '../../../components'
import { Context } from '../../../state'
import { httpGet } from '../../../utils'

import { ActivityEntry } from './ActivityEntry'

function Feed({ onReady }) {
  const [globalState] = useContext(Context)
  const [state, setState] = useState({
    data: [],
    fetched: false,
    errorMessage: null
  })
  const { t } = useTranslation()

  useEffect(() => {
    if (state.fetched === false) {
      const url = new URL('/activity-feed', globalState.baseURL)
      httpGet(
        globalState.fetch,
        url,
        (result) => {
          // defaulting 'type' to 'ProjectFeedType' for backwards compatibility
          setState({
            data: result.filter(
              (f) => (f.type || 'ProjectFeedEntry') === 'ProjectFeedEntry'
            ),
            fetched: true,
            errorMessage: null
          })
        },
        (error) => {
          setState({ data: [], fetched: true, errorMessage: error })
        }
      )
    } else {
      onReady()
    }
  }, [state.fetched])

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
          <div className="h-full overflow-y-scroll">
            <ul className="space-y-1">
              {state.data
                .filter((e) => e.display_name !== 'SonarQube')
                .map((entry, offset) => {
                  return (
                    <>
                      <ActivityEntry key={`entry-${offset}`} entry={entry} />
                      <div className="h-[1px] w-full bg-gray-200"></div>
                    </>
                  )
                })}
            </ul>
          </div>
        </Panel>
      </ContentArea>
    </ErrorBoundary>
  )
}
Feed.propTypes = {
  onReady: PropTypes.func.isRequired
}
export { Feed }
