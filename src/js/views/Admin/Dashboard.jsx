import React, { useContext, useEffect } from 'react'

import { WishedFutureState } from '../../components'
import { Context } from '../../state'

function Dashboard() {
  const [state, dispatch] = useContext(Context)
  useEffect(() => {
    dispatch({
      type: 'SET_CURRENT_PAGE',
      payload: {
        title: 'admin.title',
        url: new URL('/ui/admin', state.baseURL)
      }
    })
  }, [])
  return (
    <div className="flex-grow flex h-full items-center justify-center">
      <WishedFutureState>
        This page will have have an overview of the operational state of the
        service and include info like # of projects, users, etc.
      </WishedFutureState>
    </div>
  )
}
export { Dashboard }
