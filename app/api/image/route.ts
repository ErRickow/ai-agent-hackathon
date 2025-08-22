import { type NextRequest, NextResponse } from "next/server"

class LunosClient {
  private apiKey: string
  private baseURL: string
  private appId?: string

  constructor(config: { apiKey: string; baseURL?: string; appId?: string }) {
    this.apiKey = config.apiKey
    this.baseURL = config.baseURL || "https://api.lunos.tech/v1"
    this.appId = config.appId
  }

  image = {
    generate: async (options: {
      prompt: string
      model: string
      size?: string
      quality?: string
      appId?: string
    }) => {
      const response = await fetch(`${this.baseURL}/images/generations`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          ...(this.appId && { "X-App-ID": this.appId }),
        },
        body: JSON.stringify(options),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return response.json()
    },
  }
}

export async function POST(request: NextRequest) {
  try {
    const { prompt, provider } = await request.json()

    if (provider === "lunos") {
      const client = new LunosClient({
        apiKey: process.env.LUNOS_KEY,
        appId: "er-project",
      })

      const response = await client.image.generate({
        prompt,
        model: "openai/dall-e-3",
        size: "1024x1024",
        quality: "hd",
      })

      return NextResponse.json({ imageUrl: response.data[0].url })
    }

    return NextResponse.json({ error: "Provider not supported for image generation" }, { status: 400 })
  } catch (error) {
    console.error("Image generation error:", error)
    return NextResponse.json({ error: "Failed to generate image" }, { status: 500 })
  }
}
