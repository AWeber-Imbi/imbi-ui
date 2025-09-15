import PropTypes from 'prop-types'
import React from 'react'

import { Badge } from '../'

function ScoreBadge({ value }) {
  let color = 'red'
  if (!value) value = 0
  if (value === 0) color = 'gray'
  if (value > 69) color = 'yellow'
  if (value > 89) color = 'green'
  return (
    <Badge className="text-sm" color={color}>
      {value.toLocaleString()}
    </Badge>
  )
}
ScoreBadge.propTypes = {
  value: PropTypes.number.isRequired
}
export { ScoreBadge }
