# React Patterns

Load this file at Phase 4 (feature pages). Design system, primitives, and layout conventions are in `references/frontend-design.md` (load that at Phase 3).

---

## Page Pattern

Pages are thin. They call SDK hooks, handle loading/error/empty states, and compose primitives. No data fetching, no business logic, no raw fetch calls.

```typescript
// apps/web/src/pages/Feed.tsx
import { useFeed } from '@project/sdk'
import { Card, CardContent } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageSpinner } from '@/components/ui/Spinner'
import { Skeleton } from '@/components/ui/Skeleton'
import { Rss } from 'lucide-react'

export function FeedPage() {
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useFeed()
  const posts = data?.pages.flatMap(p => p.data) ?? []

  if (isLoading) return <PageSpinner />

  return (
    <div className="space-y-3">
      {posts.length === 0
        ? <EmptyState icon={Rss} title="Nothing here yet" description="Follow people to see their posts." />
        : posts.map(post => <PostItem key={post.id} post={post} />)
      }
      {hasNextPage && (
        <button
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
          className="w-full py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {isFetchingNextPage ? 'Loading…' : 'Load more'}
        </button>
      )}
    </div>
  )
}
```

List pages follow `references/list-query-conventions.md`. If an endpoint accepts `q`, render a search input and pass `{ q }` to the SDK hook. If an endpoint returns `{ data, meta }`, flatten `data.pages.flatMap(page => page.data)` and use `hasNextPage`/`fetchNextPage`.

---

## Component Pattern

Feature components (in `apps/web/src/components/`) receive typed props. They never call hooks that fetch or mutate data, and never call hook functions from `@project/sdk`. Type-only imports from `@project/sdk` are fine and expected — components should be typed against the same generated types as pages. Never fetch data directly.

**Exception — self-contained plugin interaction widgets** (`GoogleLoginButton`, `ChatWidget`, `FileUpload`, AI gen widgets, etc.) may call SDK hooks internally. These components are installed by plugins into `apps/web/src/components/` but function as interaction end-points where the hook and the UI are inseparably coupled. They still accept configuration via props.

```typescript
// apps/web/src/components/PostItem.tsx
import type { Post } from '@project/sdk'
import { Card, CardContent } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { formatDistanceToNow } from 'date-fns'

interface PostItemProps {
  post: Post
  onDelete?: (id: string) => void
}

export function PostItem({ post, onDelete }: PostItemProps) {
  return (
    <Card>
      <CardContent className="flex gap-3 pt-4">
        <Avatar src={post.author?.avatarUrl} name={post.author?.displayName} size="md" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">{post.author?.displayName}</span>
            <span className="text-muted-foreground text-xs shrink-0">
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
            </span>
          </div>
          <p className="text-sm mt-1 whitespace-pre-wrap break-words">{post.body}</p>
        </div>
      </CardContent>
    </Card>
  )
}
```

---

## Skeleton Pattern

Use skeletons for any content area that takes time to load. Match the shape of the real content.

```typescript
// apps/web/src/components/PostItemSkeleton.tsx
import { Card, CardContent } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'

export function PostItemSkeleton() {
  return (
    <Card>
      <CardContent className="flex gap-3 pt-4">
        <Skeleton className="h-9 w-9 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-3/4" />
        </div>
      </CardContent>
    </Card>
  )
}
```

Render `Array.from({ length: 3 }).map((_, i) => <PostItemSkeleton key={i} />)` while loading.

---

## Form Usage

Forms use the declarative `<Form>` component from `components/ui/Form.tsx`. Define fields as config, pass a zod schema. Never render raw `<input>` or `<textarea>` elements in pages.

```typescript
// apps/web/src/pages/CreatePost.tsx
import { z } from 'zod'
import { Form, type FieldConfig } from '@/components/ui/Form'
import { useCreatePost } from '@project/sdk'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'

const schema = z.object({
  body: z.string().min(1).max(5000),
})

const fields: FieldConfig[] = [
  { name: 'body', label: 'What\'s on your mind?', type: 'textarea', voice: true, required: true },
]

export function CreatePostPage() {
  const { mutateAsync } = useCreatePost()
  const navigate = useNavigate()

  return (
    <Form
      fields={fields}
      schema={schema}
      submitLabel="Post"
      onSubmit={async (data) => {
        await mutateAsync(data)
        toast.success('Posted')
        navigate('/')
      }}
    />
  )
}
```

---

## Auth Guard

Wraps protected routes. Redirects to `/login` if unauthenticated.

```typescript
// apps/web/src/lib/AuthGuard.tsx
import { Navigate, Outlet } from 'react-router-dom'
import { useCurrentUser } from '@project/sdk'
import { PageSpinner } from '@/components/ui/Spinner'

export function AuthGuard() {
  const { data, isLoading, error } = useCurrentUser()

  if (isLoading) return <PageSpinner />
  if (error || !data) return <Navigate to="/login" replace />

  return <Outlet />
}
```

---

## Routing

```typescript
// apps/web/src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthGuard } from '@/lib/AuthGuard'
import { Shell } from '@/components/layout/Shell'

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<AuthGuard />}>
          <Route element={<Shell><Outlet /></Shell>}>
            <Route path="/" element={<FeedPage />} />
            <Route path="/profile/:username" element={<ProfilePage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}
```

---

## Optimistic UI

Use React Query's `onMutate` / `onError` / `onSettled` lifecycle for instant feedback on mutations. The follow/unfollow toggle is the canonical example.

```typescript
// packages/sdk/src/hooks/useFollows.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getApiClient, ApiError } from '../client'

export function useFollow(targetUserId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const { error, response } = await getApiClient().POST('/follows/{userId}', {
        params: { path: { userId: targetUserId } }
      })
      if (error) throw new ApiError(response.status, (error as any).error)
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['profile', targetUserId] })
      const snapshot = queryClient.getQueryData(['profile', targetUserId])
      queryClient.setQueryData(['profile', targetUserId], (old: any) => ({
        ...old,
        isFollowing: true,
        followerCount: old.followerCount + 1,
      }))
      return { snapshot }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.snapshot) queryClient.setQueryData(['profile', targetUserId], ctx.snapshot)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', targetUserId] })
    },
  })
}

export function useUnfollow(targetUserId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const { error, response } = await getApiClient().DELETE('/follows/{userId}', {
        params: { path: { userId: targetUserId } }
      })
      if (error) throw new ApiError(response.status, (error as any).error)
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['profile', targetUserId] })
      const snapshot = queryClient.getQueryData(['profile', targetUserId])
      queryClient.setQueryData(['profile', targetUserId], (old: any) => ({
        ...old,
        isFollowing: false,
        followerCount: Math.max(0, old.followerCount - 1),
      }))
      return { snapshot }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.snapshot) queryClient.setQueryData(['profile', targetUserId], ctx.snapshot)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', targetUserId] })
    },
  })
}
```

Rules:
- `onMutate`: cancel in-flight queries, snapshot current data, apply optimistic update. Return snapshot so `onError` can access it.
- `onError`: roll back to snapshot.
- `onSettled`: always invalidate to sync with server truth, even on success.
- Use the same pattern for reactions (like/unlike) and any other toggle action.

---

## Error Boundary

Wrap each page route with an error boundary. Never let a page-level error crash the whole shell.

```typescript
// apps/web/src/lib/PageErrorBoundary.tsx
import { Component, type ReactNode } from 'react'
import { EmptyState } from '@/components/ui/EmptyState'
import { AlertTriangle } from 'lucide-react'

export class PageErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null }
  static getDerivedStateFromError(error: Error) { return { error } }
  render() {
    if (this.state.error) {
      return (
        <EmptyState
          icon={AlertTriangle}
          title="Something went wrong"
          description="Try refreshing the page."
          action={{ label: 'Refresh', onClick: () => window.location.reload() }}
        />
      )
    }
    return this.props.children
  }
}
```
