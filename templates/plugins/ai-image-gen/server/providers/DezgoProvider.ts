import type { ImageGenProvider, GenerateOptions, GenerateResult } from './imagegen'

const DEZGO_ENDPOINT = 'https://api.dezgo.com/text2image'
const DEFAULT_MODEL = 'flux_1_schnell_fp8'

export class DezgoProvider implements ImageGenProvider {
  async generate({ prompt, width, height, steps = 20 }: GenerateOptions): Promise<GenerateResult> {
    const apiKey = process.env.DEZGO_API_KEY
    if (!apiKey) throw new Error('DEZGO_API_KEY is not set')

    const response = await fetch(DEZGO_ENDPOINT, {
      method: 'POST',
      headers: {
        'X-Dezgo-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        model: process.env.DEZGO_MODEL ?? DEFAULT_MODEL,
        width,
        height,
        steps,
        format: 'png',
      }),
    })

    if (!response.ok) {
      const text = await response.text().catch(() => '(no body)')
      throw {
        statusCode: 502,
        message: `Dezgo error ${response.status}: ${text}`,
      }
    }

    const buffer = Buffer.from(await response.arrayBuffer())
    return { buffer, mimeType: 'image/png' }
  }
}
