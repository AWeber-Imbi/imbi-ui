import React from 'react'
import PropTypes from 'prop-types'
import { Display } from './Display'

function ViewIdentifier({ cachedIdentifier }) {
  if (!cachedIdentifier) return <></>
  return <Display entry={cachedIdentifier} />
}
ViewIdentifier.propTypes = {
  cachedIdentifier: PropTypes.object
}

export { ViewIdentifier }
