import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getApiClient, ApiError } from '../client'

export function useGoogleAuth() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (credential: string) => {
      const { data, error, response } = await getApiClient().POST('/auth/google', {
        body: { credential },
      })
      if (error) throw new ApiError(response.status, (error as any).error)
      return data!
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] })
    },
  })
}
