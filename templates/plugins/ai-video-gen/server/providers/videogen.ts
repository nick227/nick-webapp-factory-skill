// Video generation provider interface and factory.

export interface VideoGenOptions {
  prompt: string
  duration: 5 | 10
  aspectRatio: '16:9' | '9:16' | '1:1'
}

export interface VideoTask {
  providerTaskId: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  videoUrl?: string
  thumbnailUrl?: string
  errorMsg?: string
}

export interface VideoGenProvider {
  submit(options: VideoGenOptions): Promise<{ providerTaskId: string }>
  poll(providerTaskId: string): Promise<VideoTask>
}

export function createVideoGenProvider(): VideoGenProvider {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { KlingProvider } = require('./KlingProvider')
  return new KlingProvider()
}
