import { MessageCircle, Repeat2, Star } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Card, CardContent } from '@/components/ui/Card'
import { cn } from '@/lib/utils'

export type ActivityFeedItem = {
  id: string
  body: string
  createdAt: string
  author?: {
    displayName?: string | null
    username?: string | null
    avatarUrl?: string | null
  } | null
  counts?: {
    comments?: number
    reactions?: number
    reposts?: number
  }
}

interface ActivityFeedProps {
  items: ActivityFeedItem[]
  className?: string
}

function ActivityItem({ item }: { item: ActivityFeedItem }) {
  const name = item.author?.displayName ?? item.author?.username ?? 'Member'
  return (
    <Card>
      <CardContent className="flex gap-3 p-4">
        <Avatar src={item.author?.avatarUrl} name={name} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-medium text-foreground">{name}</span>
            {item.author?.username && (
              <span className="truncate text-xs text-muted-foreground">@{item.author.username}</span>
            )}
          </div>
          <p className="mt-1 whitespace-pre-wrap break-words text-sm text-foreground">{item.body}</p>
          <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1"><MessageCircle size={14} />{item.counts?.comments ?? 0}</span>
            <span className="inline-flex items-center gap-1"><Repeat2 size={14} />{item.counts?.reposts ?? 0}</span>
            <span className="inline-flex items-center gap-1"><Star size={14} />{item.counts?.reactions ?? 0}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function ActivityFeed({ items, className }: ActivityFeedProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {items.map((item) => <ActivityItem key={item.id} item={item} />)}
    </div>
  )
}
