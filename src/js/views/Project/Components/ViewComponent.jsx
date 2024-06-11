import React from 'react'
import PropTypes from 'prop-types'
import { useTranslation } from 'react-i18next'
import { DescriptionList } from '../../../components/DescriptionList/DescriptionList'
import { Definition } from '../../../components/DescriptionList/Definition'

function ViewComponent({ component }) {
  const { t } = useTranslation()
  return (
    <DescriptionList>
      <Definition term={t('common.name')}>{component.name}</Definition>
      <Definition term={t('project.components.packageURL')}>
        {component.package_url}
      </Definition>
      <Definition term={t('terms.version')}>{component.version}</Definition>
      <Definition term={t('project.components.status')}>
        {component.status}
      </Definition>
      <Definition term={t('terms.score')}>
        {component.score || 'N/A'}
      </Definition>
    </DescriptionList>
  )
}

ViewComponent.propTypes = {
  component: PropTypes.object
}
export { ViewComponent }
