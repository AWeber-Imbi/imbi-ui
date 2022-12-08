import React from 'react'
import PropTypes from 'prop-types'
import { Trans, useTranslation } from 'react-i18next'

function ProjectFactEntry({ value, recordedBy, factType }) {
  const { t, i18n } = useTranslation()

  return (
    <Trans i18nKey="project.feed.updatedFact" i18n={i18n} t={t}>
      <span className="font-medium text-gray-900 whitespace-nowrap">
        {{ recordedBy }}
      </span>
      <span>{{ factType }}</span>
      <span className="font-medium text-gray-900 whitespace-nowrap">
        {{ value }}
      </span>
    </Trans>
  )
}
ProjectFactEntry.propTypes = {
  value: PropTypes.string.isRequired,
  recordedBy: PropTypes.string.isRequired,
  factType: PropTypes.string.isRequired
}
export { ProjectFactEntry }
