import PropTypes from 'prop-types'
import React from 'react'
import { useTranslation } from 'react-i18next'

import { Icon } from '../../components'

function Filter({
  disabled,
  onChange,
  onSubmit,
  onRefresh,
  onShowHelp,
  value
}) {
  const { t } = useTranslation()

  function handleSubmit(event) {
    event.preventDefault()
    onSubmit(event.target.value)
  }

  return (
    <form
      className="flex flex-row items-center md:space-x-2 mr-2 text-gray-500 sm:w-full md:w-full"
      onSubmit={handleSubmit}>
      <div className="relative flex items-stretch rounded-md shadow-sm flex-grow focus-within:z-10">
        <input
          autoFocus={true}
          className="block w-full rounded-none rounded-l-md pl-10 sm:text-sm border-gray-300 focus:border-gray-300 focus:outline-0 focus:ring-0"
          type="text"
          autoComplete="off"
          disabled={disabled}
          name="search"
          onChange={(event) => onChange(event.target.value)}
          placeholder={t('common.search')}
          style={{ padding: '.575rem' }}
          value={value}
        />
        <button
          type="button"
          className="-ml-px relative inline-flex items-center space-x-2 px-4 py-2 border border-gray-300 text-sm font-medium rounded-r-md text-gray-700 bg-gray-50 hover:bg-gray-100 hover:text-blue-600 focus:outline-0"
          onClick={onShowHelp}>
          <Icon icon="fas question-circle" />
        </button>
      </div>
      <button
        type="button"
        className="ml-3 text-sm font-medium whitespace-nowrap hover:text-blue-600"
        disabled={disabled}
        onClick={() => {
          onRefresh()
        }}>
        <Icon
          className={`lg:mr-2` + (disabled === true ? ' fa-spin' : '')}
          icon="fas redo"
        />
        <span className="hidden lg:inline-block">{t('common.refresh')}</span>
      </button>
    </form>
  )
}

Filter.propTypes = {
  disabled: PropTypes.bool,
  onChange: PropTypes.func,
  onSubmit: PropTypes.func,
  onRefresh: PropTypes.func,
  onShowHelp: PropTypes.func,
  value: PropTypes.string
}
export { Filter }
