import { createHmac } from 'crypto'
import type { VideoGenProvider, VideoGenOptions, VideoTask } from './videogen'

const BASE_URL = (process.env.KLING_API_URL ?? 'https://api.klingai.com').replace(/\/$/, '')

// Kling uses short-lived HS256 JWTs for auth — regenerated per request.
function generateToken(): string {
  const apiKey = process.env.KLING_API_KEY
  const apiSecret = process.env.KLING_API_SECRET
  if (!apiKey || !apiSecret) {
    throw new Error('KLING_API_KEY and KLING_API_SECRET must be set')
  }

  const now = Math.floor(Date.now() / 1000)
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const payload = Buffer.from(
    JSON.stringify({ iss: apiKey, exp: now + 1800, nbf: now - 5 }),
  ).toString('base64url')
  const signature = createHmac('sha256', apiSecret)
    .update(`${header}.${payload}`)
    .digest('base64url')

  return `${header}.${payload}.${signature}`
}

function authHeaders() {
  return {
    Authorization: `Bearer ${generateToken()}`,
    'Content-Type': 'application/json',
  }
}

interface KlingSubmitResponse {
  code: number
  message: string
  data: { task_id: string; task_status: string }
}

interface KlingPollResponse {
  code: number
  message: string
  data: {
    task_id: string
    task_status: string          // submitted | processing | succeed | failed
    task_status_msg?: string
    task_result?: {
      videos?: Array<{ url: string; duration: string }>
    }
  }
}

function mapStatus(klingStatus: string): VideoTask['status'] {
  switch (klingStatus) {
    case 'submitted': return 'pending'
    case 'processing': return 'processing'
    case 'succeed': return 'completed'
    case 'failed': return 'failed'
    default: return 'processing'
  }
}

export class KlingProvider implements VideoGenProvider {
  async submit({ prompt, duration, aspectRatio }: VideoGenOptions): Promise<{ providerTaskId: string }> {
    const res = await fetch(`${BASE_URL}/v1/videos/text2video`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        prompt,
        duration: String(duration),
        aspect_ratio: aspectRatio,
        cfg_scale: 0.5,
        mode: 'std',
      }),
    })

    const json = (await res.json()) as KlingSubmitResponse
    if (!res.ok || json.code !== 0) {
      throw {
        statusCode: 502,
        message: `Kling submit error: ${json.message ?? res.status}`,
      }
    }

    return { providerTaskId: json.data.task_id }
  }

  async poll(providerTaskId: string): Promise<VideoTask> {
    const res = await fetch(`${BASE_URL}/v1/videos/text2video/${providerTaskId}`, {
      headers: authHeaders(),
    })

    const json = (await res.json()) as KlingPollResponse
    if (!res.ok || json.code !== 0) {
      throw {
        statusCode: 502,
        message: `Kling poll error: ${json.message ?? res.status}`,
      }
    }

    const { task_id, task_status, task_status_msg, task_result } = json.data
    const videoUrl = task_result?.videos?.[0]?.url

    return {
      providerTaskId: task_id,
      status: mapStatus(task_status),
      videoUrl,
      errorMsg: task_status === 'failed' ? (task_status_msg ?? 'Generation failed') : undefined,
    }
  }
}
