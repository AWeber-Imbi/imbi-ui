import PropTypes from 'prop-types'
import React from 'react'
import { useTranslation } from 'react-i18next'

import { Context } from './Context'

function StateDisplay({
  nounSingular = 'terms.record',
  nounPlural = 'terms.records'
}) {
  const { t } = useTranslation()
  return (
    <Context.Consumer>
      {(context) =>
        t('paginator.position', {
          startRecord: (context.currentPage - 1) * context.pageSize + 1,
          endRecord: Math.min(
            context.itemCount,
            context.currentPage * context.pageSize
          ).toLocaleString(),
          totalRecords: context.itemCount.toLocaleString(),
          noun: context.itemCount === 1 ? t(nounSingular) : t(nounPlural)
        })
      }
    </Context.Consumer>
  )
}

StateDisplay.propTypes = {
  nounSingular: PropTypes.string,
  nounPlural: PropTypes.string
}
export { StateDisplay }
