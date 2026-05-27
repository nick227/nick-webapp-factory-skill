export const creatorProfiles = [
  {
    id: 'creator-1',
    username: 'mara',
    displayName: 'Mara Chen',
    bio: 'Build notes, studio experiments, and practical creative systems.',
    avatarUrl: null,
  },
  {
    id: 'creator-2',
    username: 'ivo',
    displayName: 'Ivo Grant',
    bio: 'Audio sketches and field recordings.',
    avatarUrl: null,
  },
]

export const creatorPosts = [
  {
    id: 'post-1',
    body: 'Shipped a new behind-the-scenes breakdown today. The useful bit was cutting the draft in half before recording.',
    createdAt: new Date().toISOString(),
    author: creatorProfiles[0],
    counts: { comments: 8, reactions: 42, reposts: 3 },
  },
  {
    id: 'post-2',
    body: 'Small reminder: capture the rough version while the idea is still warm.',
    createdAt: new Date().toISOString(),
    author: creatorProfiles[1],
    counts: { comments: 4, reactions: 29, reposts: 2 },
  },
]
