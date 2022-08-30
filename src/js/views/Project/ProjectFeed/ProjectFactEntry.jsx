import React from 'react'
import PropTypes from 'prop-types'
import { Icon, Tooltip } from '../../../components'
import { useTranslation } from 'react-i18next'

function ProjectFactEntry({
  value,
  score,
  recordedBy,
  recordedAt,
  factType,
  iconClass
}) {
  const { t } = useTranslation()

  return (
    <div className="relative flex items-start space-x-3">
      <div>
        <div className="relative px-1">
          <div className="h-8 w-8 bg-gray-100 rounded-full ring-8 ring-white flex items-center justify-center">
            <Icon icon={iconClass} />
          </div>
        </div>
      </div>
      <div className="min-w-0 flex-1 py-1.5">
        <div className="text-sm text-gray-500">
          <span className="font-medium text-gray-900 whitespace-nowrap">
            {recordedBy}
          </span>
          {' set '}
          {factType}
          {' to '}
          <Tooltip value={`${t('terms.score')}: ${score}`}>
            <span className="font-medium text-gray-900 whitespace-nowrap">
              {value}
            </span>
          </Tooltip>{' '}
          <p className="text-xs whitespace-nowrap mt-1">{recordedAt}</p>
        </div>
      </div>
    </div>
  )
}
ProjectFactEntry.propTypes = {
  value: PropTypes.string.isRequired,
  score: PropTypes.number.isRequired,
  recordedBy: PropTypes.string.isRequired,
  recordedAt: PropTypes.string.isRequired,
  factType: PropTypes.string.isRequired,
  iconClass: PropTypes.string
}
export { ProjectFactEntry }