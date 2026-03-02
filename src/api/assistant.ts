import { apiClient } from './client'
import { useAuthStore } from '@/stores/authStore'
import type {
  Conversation,
  ConversationWithMessages,
  CreateConversationRequest,
  UpdateConversationRequest,
} from '@/types/assistant'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

// REST endpoints via apiClient
export const createConversation = (data?: CreateConversationRequest) =>
  apiClient.post<Conversation>('/assistant/conversations', data ?? {})

export const listConversations = (params?: {
  limit?: number
  offset?: number
  include_archived?: boolean
}) => apiClient.get<Conversation[]>('/assistant/conversations', params)

export const getConversation = (id: string) =>
  apiClient.get<ConversationWithMessages>(
    `/assistant/conversations/${id}`,
  )

export const deleteConversation = (id: string) =>
  apiClient.delete<void>(`/assistant/conversations/${id}`)

export const updateConversation = (
  id: string,
  data: UpdateConversationRequest,
) =>
  apiClient.patch<Conversation>(
    `/assistant/conversations/${id}`,
    data,
  )

// SSE streaming via native fetch (Axios doesn't support streaming)
export type SSEEventHandler = {
  onText?: (text: string) => void
  onToolUseStart?: (id: string, name: string) => void
  onToolInput?: (partialJson: string) => void
  onContentBlockStop?: () => void
  onDone?: (
    messageId: string,
    usage: { input_tokens: number; output_tokens: number },
  ) => void
  onError?: (message: string) => void
}

export async function sendMessageSSE(
  conversationId: string,
  content: string,
  handlers: SSEEventHandler,
  signal?: AbortSignal,
): Promise<void> {
  const token = useAuthStore.getState().accessToken
  const url =
    `${API_BASE_URL}/assistant/conversations/` +
    `${conversationId}/messages`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ content }),
    signal,
  })

  if (!response.ok) {
    const errorText = await response.text()
    handlers.onError?.(errorText || `HTTP ${response.status}`)
    return
  }

  const reader = response.body?.getReader()
  if (!reader) {
    handlers.onError?.('No response body')
    return
  }

  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      let currentEvent = ''
      for (const line of lines) {
        if (line.startsWith('event: ')) {
          currentEvent = line.slice(7).trim()
        } else if (line.startsWith('data: ')) {
          const data = line.slice(6)
          try {
            const parsed = JSON.parse(data)
            switch (currentEvent) {
              case 'text':
                handlers.onText?.(parsed.text)
                break
              case 'tool_use_start':
                handlers.onToolUseStart?.(
                  parsed.id,
                  parsed.name,
                )
                break
              case 'tool_input':
                handlers.onToolInput?.(parsed.partial_json)
                break
              case 'content_block_stop':
                handlers.onContentBlockStop?.()
                break
              case 'done':
                handlers.onDone?.(
                  parsed.message_id,
                  parsed.usage,
                )
                break
              case 'error':
                handlers.onError?.(parsed.message)
                break
            }
          } catch {
            // Skip unparseable data lines
          }
          currentEvent = ''
        } else if (line.trim() === '') {
          currentEvent = ''
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}
