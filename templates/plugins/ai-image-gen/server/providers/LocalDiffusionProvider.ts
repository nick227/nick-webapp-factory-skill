import type { ImageGenProvider, GenerateOptions, GenerateResult } from './imagegen'

// Targets the Automatic1111 WebUI REST API (--api flag required).
// Start Automatic1111 with: python launch.py --api --listen
// ComfyUI uses a different request format — replace the body structure if needed.

interface Txt2ImgResponse {
  images: string[]  // base64-encoded PNG strings
}

export class LocalDiffusionProvider implements ImageGenProvider {
  private readonly baseUrl: string

  constructor() {
    this.baseUrl = (process.env.LOCAL_DIFFUSION_URL ?? 'http://localhost:7860').replace(/\/$/, '')
  }

  async generate({ prompt, width = 512, height = 512, steps = 20 }: GenerateOptions): Promise<GenerateResult> {
    const response = await fetch(`${this.baseUrl}/sdapi/v1/txt2img`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        negative_prompt: '',
        steps,
        width,
        height,
        cfg_scale: 7,
        sampler_name: 'DPM++ 2M Karras',
        batch_size: 1,
        n_iter: 1,
      }),
    }).catch(() => {
      throw {
        statusCode: 502,
        message: `Local diffusion server unreachable at ${this.baseUrl}. Is Automatic1111 running?`,
      }
    })

    if (!response.ok) {
      const text = await response.text().catch(() => '(no body)')
      throw {
        statusCode: 502,
        message: `Local diffusion error ${response.status}: ${text}`,
      }
    }

    const json = (await response.json()) as Txt2ImgResponse
    const base64 = json.images?.[0]
    if (!base64) throw { statusCode: 502, message: 'Local diffusion returned no image data' }

    const buffer = Buffer.from(base64, 'base64')
    return { buffer, mimeType: 'image/png' }
  }
}
