import React, { useContext, useEffect, useState } from 'react'
import PropTypes from 'prop-types'

import { Alert, Button, Loading, Markdown, Modal } from '../../components'
import { Context } from '../../state'
import { httpGet } from '../../utils'

export function ViewNote({ onClose, urlPath }) {
  const [state] = useContext(Context)
  const [fetchData, setFetchData] = useState(true)
  const [note, setNote] = useState(null)
  const [errorMessage, setErrorMessage] = useState(null)

  useEffect(() => {
    if (fetchData) {
      setFetchData(false)
      httpGet(
        state.fetch,
        new URL(urlPath, state.baseURL),
        (result) => {
          setNote(result)
        },
        (error) => {
          setErrorMessage(error)
        }
      )
    }
  }, [fetchData])

  if (note === null) {
    return <Loading />
  }
  if (errorMessage !== null) {
    return (
      <Alert className="mb-3" level="error">
        {errorMessage}
      </Alert>
    )
  }

  return (
    <Modal onClose={onClose}>
      <Markdown className="overflow-auto max-h-[70vh] border-solid border-2 p-2 rounded">
        {note.content}
      </Markdown>
      <div className="flex flex-row mt-2">
        <span className="text-bold">Created by:&nbsp;</span>
        <span>{note.created_by}</span>
        <span className="flex-grow"></span>
        <Button onClick={onClose}>Close</Button>
      </div>
    </Modal>
  )
}
ViewNote.propTypes = {
  onClose: PropTypes.func.isRequired,
  urlPath: PropTypes.string.isRequired
}
