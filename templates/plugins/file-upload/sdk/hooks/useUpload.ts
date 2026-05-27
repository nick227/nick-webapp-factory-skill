import { useMutation } from '@tanstack/react-query'

export interface UploadResult {
  url: string
  key: string
  mimeType: string
  size: number
}

const BASE_URL = (
  typeof import.meta !== 'undefined'
    ? (import.meta as any).env?.VITE_API_URL
    : undefined
) ?? ''

// Uses fetch() with FormData directly — openapi-fetch does not support multipart.
export function useUpload() {
  return useMutation({
    mutationFn: async (file: File): Promise<{ data: UploadResult }> => {
      const body = new FormData()
      body.append('file', file)

      const response = await fetch(`${BASE_URL}/media/upload`, {
        method: 'POST',
        credentials: 'include',
        body,
        // Do NOT set Content-Type — browser must set it with the multipart boundary.
      })

      const json = await response.json()

      if (!response.ok) {
        throw new Error(json.error ?? `Upload failed (${response.status})`)
      }

      return json
    },
  })
}
