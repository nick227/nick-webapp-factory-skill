import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getApiClient, ApiError } from '../client'

export interface GenerateImageInput {
  prompt: string
  width?: number
  height?: number
}

export function useGenerateImage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: GenerateImageInput) => {
      const { data, error, response } = await getApiClient().POST('/ai-image/generate', { body: input })
      if (error) throw new ApiError(response.status, (error as any).error)
      return data!
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generatedImages'] })
    },
  })
}

export function useGeneratedImages(params?: { limit?: number }) {
  return useInfiniteQuery({
    queryKey: ['generatedImages', params],
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) => {
      const { data, error, response } = await getApiClient().GET('/ai-image/history', {
        params: { query: { ...params, cursor: pageParam } },
      })
      if (error) throw new ApiError(response.status, (error as any).error)
      return data!
    },
    getNextPageParam: (lastPage) => lastPage?.meta.nextCursor ?? undefined,
  })
}
