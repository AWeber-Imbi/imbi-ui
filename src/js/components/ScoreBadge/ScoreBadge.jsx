import PropTypes from 'prop-types'
import React from 'react'

import { Badge } from '../'

function ScoreBadge({ value }) {
  // Handle null, undefined or non-numeric values
  const numValue =
    value === null || value === undefined || isNaN(Number(value))
      ? 0
      : Number(value)

  let color = 'red'
  if (numValue === 0) color = 'gray'
  if (numValue > 69) color = 'yellow'
  if (numValue > 89) color = 'green'

  return (
    <Badge className="text-sm" color={color}>
      {numValue.toLocaleString()}
    </Badge>
  )
}

ScoreBadge.propTypes = {
  value: PropTypes.number
}

export { ScoreBadge }
