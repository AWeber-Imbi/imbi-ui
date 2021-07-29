import React, { useContext, useEffect } from 'react'

import { WishedFutureState } from '../../components'
import { Context } from '../../state'

function OperationsLog() {
  const [state, dispatch] = useContext(Context)
  useEffect(() => {
    dispatch({
      type: 'SET_CURRENT_PAGE',
      payload: {
        title: 'operationsLog.title',
        url: new URL('/ui/operations-log', state.baseURL)
      }
    })
  }, [])
  return (
    <div className="flex-grow flex items-center justify-center">
      <WishedFutureState>
        This page will a searchable table that indicates all changes in the
        operational environment by project.
      </WishedFutureState>
    </div>
  )
}
export { OperationsLog }
