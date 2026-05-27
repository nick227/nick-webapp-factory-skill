import { PostService } from '../services/PostService'

const postService = new PostService()

export async function getFeed(request: any, reply: any) {
  const result = await postService.getFeed({
    cursor: request.query.cursor,
    limit: request.query.limit,
  })
  return reply.send(result)
}

export async function createPost(request: any, reply: any) {
  const post = await postService.create(request.user.id, request.body)
  return reply.status(201).send({ data: post })
}
