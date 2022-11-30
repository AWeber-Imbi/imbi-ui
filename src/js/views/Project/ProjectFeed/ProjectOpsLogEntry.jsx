import React from 'react'
import PropTypes from 'prop-types'
import { Icon } from '../../../components'
import { Trans, useTranslation } from 'react-i18next'

function ProjectOpsLogEntry({
  iconClass,
  displayName,
  changeType,
  project,
  environment,
  version,
  recordedAt
}) {
  const { t, i18n } = useTranslation()

  const i18nKey = version ? 'project.feed.opsLogVersion' : 'project.feed.opsLog'

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
          <Trans i18nKey={i18nKey} i18n={i18n} t={t}>
            <span className="font-medium text-gray-900 whitespace-nowrap">
              {{ displayName }}
            </span>
            <span>{{ changeType }}</span>
            <span>{{ project }}</span>
            <span className="font-medium text-gray-900 whitespace-nowrap">
              {{ environment }}
            </span>
            <span className="font-medium text-gray-900 whitespace-nowrap">
              {{ version }}
            </span>
          </Trans>
          <p className="text-xs whitespace-nowrap mt-1">{recordedAt}</p>
        </div>
      </div>
    </div>
  )
}
ProjectOpsLogEntry.propTypes = {
  iconClass: PropTypes.string.isRequired,
  displayName: PropTypes.string.isRequired,
  changeType: PropTypes.string.isRequired,
  project: PropTypes.string.isRequired,
  recordedAt: PropTypes.string.isRequired,
  environment: PropTypes.string.isRequired,
  version: PropTypes.string
}
export { ProjectOpsLogEntry }
