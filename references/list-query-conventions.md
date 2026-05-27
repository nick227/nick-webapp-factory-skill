# List, Search, and Paging Conventions

Use these conventions for every list, feed, search, and plugin endpoint. List behavior is infrastructure: define it once in OpenAPI, implement it once in services, and let SDK hooks/pages follow the same shape.

---

## Standard Response Envelope

All cursor-paginated list endpoints return:

```yaml
PaginatedMeta:
  type: object
  required: [hasMore, nextCursor]
  properties:
    hasMore: { type: boolean }
    nextCursor:
      type: string
      nullable: true

PaginatedPosts:
  type: object
  required: [data, meta]
  properties:
    data:
      type: array
      items: { $ref: '#/components/schemas/Post' }
    meta:
      $ref: '#/components/schemas/PaginatedMeta'
```

Do not return bare arrays. Do not return top-level `cursor`. The `meta` object gives the contract room to grow later with `total`, `facets`, or applied filters.

---

## Standard Query Parameters

Define these once in `components/parameters` and reuse them by `$ref`.

```yaml
Cursor:
  in: query
  name: cursor
  schema:
    type: string
  description: Opaque cursor returned by the previous page.

Limit:
  in: query
  name: limit
  schema:
    type: integer
    minimum: 1
    maximum: 100
    default: 20

SearchQuery:
  in: query
  name: q
  schema:
    type: string
    minLength: 1
    maxLength: 200
  description: Simple text search within this resource.

Sort:
  in: query
  name: sort
  schema:
    type: string
```

Use explicit filter params (`authorId`, `status`, `tag`, `from`, `to`) instead of JSON-encoded filter blobs.

---

## Cursor Rules

Cursors are opaque strings. Never expose raw timestamps as the public cursor contract.

Encode a stable sort pair:

Copy `templates/server/pagination.ts` to `apps/server/src/lib/pagination.ts`. It provides `encodeCursor`, `decodeCursor`, and `normalizeLimit`.

Sort by the same stable pair in services:

```typescript
orderBy: [
  { createdAt: 'desc' },
  { id: 'desc' },
]
```

For Prisma cursor filtering, use the decoded `{ createdAt, id }` pair so rows with equal timestamps are not skipped or duplicated.

---

## Search Rules

Use `q` on resource list endpoints for scoped search:

```text
GET /users?q=nick
GET /posts?q=fastify
GET /media?q=invoice
```

Use `/search` only for global, cross-resource search:

```text
GET /search?q=nick&type=users,posts
```

Search endpoints still use the same `{ data, meta }` envelope when paginated.

---

## SDK Hook Pattern

Any GET operation with `cursor` uses `useInfiniteQuery`.

```typescript
export function usePosts(params?: { q?: string; limit?: number }) {
  return useInfiniteQuery({
    queryKey: ['posts', params],
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) => {
      const { data, error, response } = await getApiClient().GET('/posts', {
        params: { query: { ...params, cursor: pageParam } },
      })
      if (error) throw new ApiError(response.status, (error as any).error)
      return data!
    },
    getNextPageParam: (lastPage) => lastPage.meta.nextCursor ?? undefined,
  })
}
```

Query keys include all filters and search params.

---

## Page Generator Behavior

`scripts/generate-pages.ts` should infer list UX from the OpenAPI operation:

- `cursor` query param or `{ meta.nextCursor }` response: generate an infinite list page.
- `q` query param: generate a search input and pass `{ q }` to the hook.
- ordinary GET collection route: generate a regular list page.

Generated pages are stubs, but their data access pattern must be correct from the start.

---

## Anti-Patterns

- Returning `T[]` directly.
- Returning `{ data: T[], cursor }` from new endpoints.
- Exposing raw timestamps as cursors.
- Supporting generic `filter={...}` JSON query strings.
- Implementing pagination differently per plugin.
