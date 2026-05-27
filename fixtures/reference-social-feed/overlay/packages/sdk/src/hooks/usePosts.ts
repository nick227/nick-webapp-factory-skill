import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getApiClient, ApiError } from '../client'

type FeedParams = {
  limit?: number
}

type CreatePostInput = {
  body: string
}

export function useFeed(params: FeedParams = {}) {
  return useInfiniteQuery({
    queryKey: ['feed', params],
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) => {
      const { data, error, response } = await getApiClient().GET('/posts/feed', {
        params: {
          query: {
            cursor: pageParam,
            limit: params.limit ?? 20,
          },
        },
      })
      if (error) throw new ApiError(response.status, (error as any).error)
      return data!
    },
    getNextPageParam: (lastPage) => lastPage.meta.nextCursor ?? undefined,
  })
}

export function useCreatePost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (body: CreatePostInput) => {
      const { data, error, response } = await getApiClient().POST('/posts', { body })
      if (error) throw new ApiError(response.status, (error as any).error)
      return data!
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] })
    },
  })
}
