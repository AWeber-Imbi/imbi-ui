import React, { useContext, useEffect } from 'react'
import { Context } from '../../../state'
import PropTypes from 'prop-types'
import { SSMConfiguration } from './SSMConfiguration'
import { WishedFutureState } from '../../../components'
import { useTranslation } from 'react-i18next'

function Configuration({ urlPath, project }) {
  const [globalState, dispatch] = useContext(Context)
  const { t } = useTranslation()

  useEffect(() => {
    dispatch({
      type: 'SET_CURRENT_PAGE',
      payload: {
        title: 'common.configuration',
        url: new URL(`${urlPath}/configuration`, globalState.baseURL)
      }
    })
  }, [])

  switch (project.configuration_type) {
    case 'ssm':
      return <SSMConfiguration project={project} />
    default:
      return (
        <div className="pt-20 flex items-center justify-center">
          <WishedFutureState>
            {t('wishedFutureState.configuration')}
          </WishedFutureState>
        </div>
      )
  }
}

Configuration.propTypes = {
  urlPath: PropTypes.string.isRequired,
  project: PropTypes.object.isRequired
}
export { Configuration }
