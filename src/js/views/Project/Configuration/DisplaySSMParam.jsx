import React from 'react'
import { useTranslation } from 'react-i18next'
import PropTypes from 'prop-types'
import { DescriptionList } from '../../../components/DescriptionList/DescriptionList'
import { Definition } from '../../../components/DescriptionList/Definition'

function DisplaySSMParam({ param }) {
  const { t } = useTranslation()

  return (
    <>
      <DescriptionList>
        <Definition term={t('common.name')}>{param.name}</Definition>
        <Definition term={t('common.type')}>{param.type}</Definition>
      </DescriptionList>
      <h1 className="text-xl font-medium text-gray-900 mt-6 mb-3">Values</h1>
      <DescriptionList>
        {param.values.map(({ environment, value }, i) => {
          return (
            <Definition key={i} className="break-words" term={environment}>
              {value}
            </Definition>
          )
        })}
      </DescriptionList>
    </>
  )
}

DisplaySSMParam.propTypes = {
  param: PropTypes.object.isRequired
}

export { DisplaySSMParam }
