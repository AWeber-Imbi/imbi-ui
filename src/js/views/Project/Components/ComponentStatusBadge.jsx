import React from 'react'
import { Badge } from '../../../components'
import PropTypes from 'prop-types'

function ComponentStatusBadge(value) {
  if (value === null) {
    return null
  }

  let color
  if (value === 'Deprecated') {
    color = 'orange'
  } else if (value === 'Forbidden') {
    color = 'red'
  } else if (value === 'Outdated') {
    color = 'yellow'
  } else if (value === 'Unscored') {
    color = 'gray'
  } else if (value === 'Up-to-date') {
    color = 'green'
  } else {
    color = 'gray'
  }
  return (
    <Badge className="text-sm" color={color}>
      {value}
    </Badge>
  )
}
ComponentStatusBadge.propTypes = {
  value: PropTypes.string.isRequired
}

export { ComponentStatusBadge }
