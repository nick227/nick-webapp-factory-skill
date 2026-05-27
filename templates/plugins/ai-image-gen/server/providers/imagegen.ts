// Image generation provider interface and factory.
// Add new providers (Stability AI, Replicate, etc.) as separate files.

export interface GenerateOptions {
  prompt: string
  width: number
  height: number
  steps?: number
}

export interface GenerateResult {
  buffer: Buffer
  mimeType: string
}

export interface ImageGenProvider {
  generate(options: GenerateOptions): Promise<GenerateResult>
}

export function createImageGenProvider(): ImageGenProvider {
  const provider = process.env.IMAGE_GEN_PROVIDER ?? 'dezgo'

  switch (provider) {
    case 'openai': {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { OpenAIDalleProvider } = require('./OpenAIDalleProvider')
        return new OpenAIDalleProvider()
      } catch {
        throw new Error(
          'OpenAIDalleProvider requires the openai package. Run: pnpm add openai',
        )
      }
    }
    case 'local': {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { LocalDiffusionProvider } = require('./LocalDiffusionProvider')
      return new LocalDiffusionProvider()
    }
    case 'dezgo':
    default: {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { DezgoProvider } = require('./DezgoProvider')
      return new DezgoProvider()
    }
  }
}
