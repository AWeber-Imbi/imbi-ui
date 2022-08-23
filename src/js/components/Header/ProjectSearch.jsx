import React, { useContext, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { Context } from '../../state'

function ProjectSearch() {
  const [globalState] = useContext(Context)
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [value, setValue] = useState('')

  function handleSubmit(event) {
    event.preventDefault()
    if (value !== '') {
      const url = new URL(
        `/ui/projects?f=${encodeURIComponent(value)}`,
        globalState.baseURL
      )
      navigate(url, { replace: true })
      setValue('')
    }
  }

  return (
    <div className="w-64 mr-2">
      <form onSubmit={handleSubmit}>
        <input
          className="form-input border-blue-600 mb-0 focus:outline-0"
          type="text"
          autoComplete="off"
          name="search"
          placeholder={t('common.search')}
          onChange={(event) => {
            setValue(event.target.value)
          }}
          value={value}
        />
      </form>
    </div>
  )
}

export { ProjectSearch }
