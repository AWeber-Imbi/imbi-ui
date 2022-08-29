import { DateTime } from 'luxon'
import PropTypes from 'prop-types'
import React, {Fragment, useContext, useEffect, useState} from 'react'

import { Context } from '../../../state'
import { httpGet } from '../../../utils'
import {
  Alert, Badge,
  ErrorBoundary, Icon,
  Loading,
  Panel
} from '../../../components'
import {useTranslation} from "react-i18next";
import Gravatar from "react-gravatar";

function FactHistory({ urlPath, projectID, factTypes }) {
  const [state, dispatch] = useContext(Context)
  const [history, setHistory] = useState()
  const [errorMessage, setErrorMessage] = useState()
  const { t } = useTranslation()

  useEffect(() => {
    dispatch({
      type: 'SET_CURRENT_PAGE',
      payload: {
        title: 'factHistory.title',
        url: new URL(`${urlPath}/fact-history`, state.baseURL)
      }
    })

    const url = new URL(
      `/projects/${projectID}/fact-history`,
      state.baseURL)
    httpGet(
      state.fetch,
      url,
      (result) => {
        const factTypeById = new Map(factTypes.map(f => [f.id, f]))
        setHistory(result.map(f => ({
          ...f,
          project_fact_type: factTypeById.get(f.fact_type_id).name,
          recorded_at: DateTime.fromISO(f.recorded_at)
            .toLocaleString(DateTime.DATETIME_MED)
        })))
      },
      (error) => setErrorMessage(error)
    )
  }, [])

  let content;
  if (errorMessage) {
    content = <Alert level="error">{errorMessage}</Alert>
  } else if (!history) {
    content = <Loading />
  } else {
    console.log('history', history)
    content = (
      <Panel className="flex overflow-hidden justify-center">
        <div className="grid grid-cols-fact-history gap-6 m-4">
          {history.map((fact, index) => {

            let scoreColor = 'red'
            if (fact.score > 69) scoreColor = 'yellow'
            if (fact.score > 89) scoreColor = 'green'

            return (
              <Fragment key={index}>
                <div className="flex items-center justify-center relative">
                  <div className="bg-blue-500 w-4 h-4 rounded-full"></div>
                  {index !== history.length - 1 && (
                    <div className="bg-blue-500 w-0.5 h-[calc(100%+1.5rem)] absolute top-[24px] right-0 bottom-0 left-[7px]"></div>
                  )}
                </div>
                <div className="flex gap-4 items-center">
                  <Gravatar
                    className="h-8 w-8 rounded-full"
                    default="mp"
                    email={fact.recorded_by_email}
                    size={22}
                  />
                  <p>
                    <b>{fact.recorded_by}</b> set <span className="font-medium">{fact.project_fact_type}</span> to {
                      fact.icon_class && <Icon icon={fact.icon_class}/>
                    } {fact.value} at {fact.recorded_at}
                  </p>
                </div>
                <div className="self-center">
                  <div className="w-12 flex justify-center">
                    <Badge
                      className="text-sm"
                      color={scoreColor}>
                      {fact.score.toString()}
                    </Badge>
                  </div>
                </div>
              </Fragment>
            )
          })}
        </div>

        {/*{history.map((fact, index) => {*/}
        {/*  return <Entry*/}
        {/*    key={index}*/}
        {/*    score={fact.score}*/}
        {/*    iconClass={fact.icon_class}*/}
        {/*    recordedBy={fact.recorded_by}*/}
        {/*    recordedAt={fact.recorded_at}*/}
        {/*    recordedByEmail={fact.recorded_by_email}*/}
        {/*    factType={fact.project_fact_type}*/}
        {/*    value={fact.value}*/}
        {/*    isLast={index === history.length - 1}/>*/}
        {/*})}*/}
      </Panel>
    )
  }

  return (
    <ErrorBoundary>
      {content}
    </ErrorBoundary>
  )
}
FactHistory.propTypes = {
  urlPath: PropTypes.string.isRequired,
  projectID: PropTypes.number.isRequired,
  factTypes: PropTypes.arrayOf(PropTypes.object).isRequired
}
export { FactHistory }
