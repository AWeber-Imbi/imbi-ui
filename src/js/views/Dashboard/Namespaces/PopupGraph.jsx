import PropTypes from 'prop-types'
import React from 'react'

import { Chart, Modal } from '../../../components/'

function PopupGraph({ title, icon, label, data, onClose }) {
  const lineData = {
    labels: data.map((entry) => {
      return entry.date
    }),
    datasets: [
      {
        fill: false,
        backgroundColor: 'rgb(0, 99, 255)',
        borderColor: 'rgba(0, 99, 255)',
        data: data.map((entry) => {
          return entry.value
        }),
        label: label,
        radius: 0
      }
    ]
  }
  return (
    <Modal onClose={onClose}>
      <Modal.Title icon={icon} showClose={true} onClose={onClose}>
        {title}
      </Modal.Title>
      <Chart.Line data={lineData} minValue={0} maxValue={100} />
    </Modal>
  )
}
PopupGraph.propTypes = {
  title: PropTypes.string.isRequired,
  icon: PropTypes.string,
  label: PropTypes.string.isRequired,
  data: PropTypes.arrayOf(PropTypes.object).isRequired,
  onClose: PropTypes.func
}
export { PopupGraph }
