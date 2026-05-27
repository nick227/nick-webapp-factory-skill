import { useCreatePost, useFeed } from '@project/sdk'
import { ActivityComposer } from '@/components/activity/ActivityComposer'
import { ActivityFeed } from '@/components/activity/ActivityFeed'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/Button'
import { Rss } from 'lucide-react'

export function FeedPage() {
  const feed = useFeed()
  const createPost = useCreatePost()
  const items = feed.data?.pages.flatMap((page) => page.data) ?? []

  if (feed.isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-28 w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <ActivityComposer
        isLoading={createPost.isPending}
        onSubmit={(body) => createPost.mutateAsync({ body })}
      />

      {items.length === 0 ? (
        <EmptyState icon={Rss} title="Nothing here yet" description="Follow people or publish the first post." />
      ) : (
        <ActivityFeed items={items as any} />
      )}

      {feed.hasNextPage && (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => feed.fetchNextPage()}
          loading={feed.isFetchingNextPage}
        >
          Load more
        </Button>
      )}
    </div>
  )
}
