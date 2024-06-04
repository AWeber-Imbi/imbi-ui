import PropTypes from 'prop-types'
import React from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '..'

function Footer({
  children,
  disabled,
  instructions,
  onSubmitClick,
  onCancelClick
}) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-row mt-10 pt-5">
      {instructions}
      <div className="flex-grow text-right space-x-3">
        {onCancelClick && (
          <Button className={'btn-white'} onClick={onCancelClick}>
            {t('common.cancel')}
          </Button>
        )}
        <Button
          className="btn-green"
          onClick={onSubmitClick}
          disabled={disabled}
          type="submit">
          {children === undefined ? t('common.submit') : children}
        </Button>
      </div>
    </div>
  )
}
Footer.defaultProps = {
  disabled: false
}
Footer.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.element),
    PropTypes.element,
    PropTypes.string
  ]),
  disabled: PropTypes.bool,
  instructions: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.element),
    PropTypes.element,
    PropTypes.string
  ]),
  onSubmitClick: PropTypes.func,
  onCancelClick: PropTypes.func
}
export { Footer }
