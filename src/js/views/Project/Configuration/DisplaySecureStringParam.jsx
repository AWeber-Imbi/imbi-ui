import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import PropTypes from 'prop-types'
import { DescriptionList } from '../../../components/DescriptionList/DescriptionList'
import { Definition } from '../../../components/DescriptionList/Definition'
import { Toggle } from '../../../components/Form/Toggle'

function DisplaySecureStringParam({ param }) {
  const { t } = useTranslation()
  const [isShown, setIsShown] = useState(false)

  return (
    <>
      <DescriptionList>
        <Definition term={t('common.name')}>{param.name}</Definition>
        <Definition term={t('common.type')}>{param.type}</Definition>
      </DescriptionList>
      <div className="flex items-center justify-between mt-6 mb-3">
        <h1 className="text-xl font-medium text-gray-900">Values</h1>
        <div className="flex items-center gap-1">
          <p>Show decrypted value</p>
          <Toggle
            onChange={(name, value) => setIsShown(value)}
            name="is-hidden"
            value={isShown}
          />
        </div>
      </div>

      <DescriptionList>
        {param.values.map(({ environment, value }, i) => {
          return (
            <Definition key={i} className="break-words" term={environment}>
              {isShown ? value : '********'}
            </Definition>
          )
        })}
      </DescriptionList>
    </>
  )
}

DisplaySecureStringParam.propTypes = {
  param: PropTypes.object.isRequired
}

export { DisplaySecureStringParam }
