import { Line } from 'react-chartjs-2'
import PropTypes from 'prop-types'
import React from 'react'

function LineChart({ className, data, height, width, minValue, maxValue }) {
  return (
    <div className={className}>
      <Line
        data={data}
        height={height}
        width={width}
        options={{
          animation: false,
          responsive: true,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              suggestedMin: minValue,
              suggestedMax: maxValue
            }
          }
        }}
        type="line"
      />
    </div>
  )
}
LineChart.propTypes = {
  className: PropTypes.string,
  data: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  height: PropTypes.number,
  width: PropTypes.number,
  minValue: PropTypes.number,
  maxValue: PropTypes.number
}
export { LineChart }
