import { Form } from '../../components'
import React from 'react'
import PropTypes, { string } from 'prop-types'
import { useTranslation } from 'react-i18next'

function AutomationList({
  automations,
  selectedAutomations,
  setSelectedAutomations
}) {
  const { t } = useTranslation()

  if (!automations.length) {
    return <></>
  }

  const fields = automations.map((automation) => (
    <Form.Field
      key={automation.automationSlug}
      title={automation.automationName}
      name={automation.automationSlug}
      type="toggle"
      value={
        selectedAutomations.find((v) => v === automation.automationSlug) !==
        undefined
      }
      onChange={(key, value) =>
        setSelectedAutomations((prevState) => {
          if (value) {
            return prevState.find((v) => v === key)
              ? prevState
              : prevState.concat([key])
          } else {
            return prevState.filter((v) => v !== key)
          }
        })
      }
    />
  ))
  return (
    <div className="grid grid-cols-3 gap-4 items-start mt-8 pt-2 border-t border-t-gray-300">
      <div className="text-sm mt-2 font-medium text-gray-700">
        {t('project.automations')}
      </div>
      <div className="col-span-2 ml-2">{fields}</div>
    </div>
  )
}

AutomationList.propTypes = {
  automations: PropTypes.array.isRequired,
  selectedAutomations: PropTypes.arrayOf(string).isRequired,
  setSelectedAutomations: PropTypes.func.isRequired
}

export { AutomationList }
