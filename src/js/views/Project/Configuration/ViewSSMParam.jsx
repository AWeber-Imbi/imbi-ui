import React from 'react'
import PropTypes from 'prop-types'
import { DisplaySSMParam } from './DisplaySSMParam'
import { DisplaySecureStringParam } from './DisplaySecureStringParam'

function ViewSSMParam({ param }) {
  if (param.type === 'SecureString') {
    return <DisplaySecureStringParam param={param} />
  } else {
    return <DisplaySSMParam param={param} />
  }
}

ViewSSMParam.propTypes = {
  param: PropTypes.object
}

export { ViewSSMParam }
