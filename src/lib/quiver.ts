import { QuiverAI } from '@quiverai/sdk'

let client: QuiverAI | null = null

export function getQuiverClient(): QuiverAI {
  if (!client) {
    const apiKey = process.env.QUIVER_AI_API_KEY
    if (!apiKey) {
      throw new Error('QUIVER_AI_API_KEY environment variable is required')
    }
    client = new QuiverAI({ bearerAuth: apiKey })
  }
  return client
}

export interface GenerateSVGOptions {
  prompt: string
  instructions?: string
  count?: number
  temperature?: number
}

export async function generateSVG(options: GenerateSVGOptions): Promise<string[]> {
  const quiver = getQuiverClient()

  const response = await quiver.createSVGs.generateSVG({
    model: 'arrow-preview',
    prompt: options.prompt,
    instructions: options.instructions,
    n: options.count ?? 1,
    temperature: options.temperature ?? 0.8,
  })

  const result = response.result
  if (!result || typeof result !== 'object' || !('data' in result)) {
    return []
  }

  const svgResponse = result as { data: Array<{ svg: string }> }
  return svgResponse.data.map(item => item.svg).filter(Boolean)
}
