import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { getApiClient, ApiError } from '../client'

export interface VideoGenInput {
  prompt: string
  duration?: 5 | 10
  aspectRatio?: '16:9' | '9:16' | '1:1'
}

export function useGenerateVideo() {
  const queryClient = useQueryClient()
  const [taskId, setTaskId] = useState<string | null>(null)

  const submit = useMutation({
    mutationFn: async (input: VideoGenInput) => {
      const { data, error, response } = await getApiClient().POST('/ai-video/generate', { body: input })
      if (error) throw new ApiError(response.status, (error as any).error)
      return data!
    },
    onSuccess: (data) => {
      if (data?.data?.id) setTaskId(data.data.id)
      queryClient.invalidateQueries({ queryKey: ['generatedVideos'] })
    },
  })

  const status = useQuery({
    queryKey: ['videoStatus', taskId],
    queryFn: async () => {
      const { data, error, response } = await getApiClient().GET('/ai-video/status/{taskId}', {
        params: { path: { taskId: taskId! } },
      })
      if (error) throw new ApiError(response.status, (error as any).error)
      return data!
    },
    enabled: !!taskId,
    refetchInterval: (query) => {
      const s = query.state.data?.data?.status
      if (!s || s === 'completed' || s === 'failed') return false
      return 5_000
    },
  })

  // Invalidate history list when video generation reaches a terminal state
  const statusValue = status.data?.data?.status
  useEffect(() => {
    if (statusValue === 'completed' || statusValue === 'failed') {
      queryClient.invalidateQueries({ queryKey: ['generatedVideos'] })
    }
  }, [statusValue, queryClient])

  return { submit, status, taskId, resetTask: () => setTaskId(null) }
}

export function useGeneratedVideos(params?: { limit?: number }) {
  return useInfiniteQuery({
    queryKey: ['generatedVideos', params],
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) => {
      const { data, error, response } = await getApiClient().GET('/ai-video/history', {
        params: { query: { ...params, cursor: pageParam } },
      })
      if (error) throw new ApiError(response.status, (error as any).error)
      return data!
    },
    getNextPageParam: (lastPage) => lastPage?.meta.nextCursor ?? undefined,
  })
}
