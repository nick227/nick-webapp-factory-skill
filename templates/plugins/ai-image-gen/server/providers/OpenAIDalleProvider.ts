import OpenAI from 'openai'
import type { ImageGenProvider, GenerateOptions, GenerateResult } from './imagegen'

// DALL-E 3 only supports three fixed sizes. We pick the closest aspect ratio.
type DalleSize = '1024x1024' | '1792x1024' | '1024x1792'

function pickSize(width: number, height: number): DalleSize {
  const ratio = width / height
  if (ratio > 1.2) return '1792x1024'
  if (ratio < 0.83) return '1024x1792'
  return '1024x1024'
}

export class OpenAIDalleProvider implements ImageGenProvider {
  private readonly openai: OpenAI

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) throw new Error('OPENAI_API_KEY is not set')
    this.openai = new OpenAI({ apiKey })
  }

  async generate({ prompt, width, height }: GenerateOptions): Promise<GenerateResult> {
    const model = (process.env.DALLE_MODEL ?? 'dall-e-3') as 'dall-e-3' | 'dall-e-2'
    const size = pickSize(width, height)

    const response = await this.openai.images.generate({
      model,
      prompt,
      size,
      quality: 'standard',
      n: 1,
    })

    const url = response.data[0]?.url
    if (!url) throw { statusCode: 502, message: 'OpenAI DALL-E returned no image URL' }

    const imageRes = await fetch(url)
    if (!imageRes.ok) {
      throw { statusCode: 502, message: 'Failed to fetch generated image from OpenAI CDN' }
    }

    const buffer = Buffer.from(await imageRes.arrayBuffer())
    return { buffer, mimeType: 'image/png' }
  }
}
