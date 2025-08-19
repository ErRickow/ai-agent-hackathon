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

  audio = {
    textToSpeech: async (options: {
      text: string
      voice: string
      model: string
      response_format?: string
      speed?: number
      appId?: string
    }) => {
      const response = await fetch(`${this.baseURL}/audio/speech`, {
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

      return response
    },
  }
}

export async function POST(request: NextRequest) {
  try {
    const { text, provider } = await request.json()

    if (provider === "lunos") {
      const client = new LunosClient({
        apiKey: "sk-e75005eb20d3a45a62791ba6e1da46380cd9521748891354",
        appId: "hackathon-tts-v1.0",
      })

      const response = await client.audio.textToSpeech({
        text,
        voice: "alloy",
        model: "openai/tts",
        response_format: "mp3",
        speed: 1.0,
      })

      // Convert audio buffer to base64 URL
      const audioBuffer = await response.arrayBuffer()
      const base64Audio = Buffer.from(audioBuffer).toString("base64")
      const audioUrl = `data:audio/mpeg;base64,${base64Audio}`

      return NextResponse.json({ audioUrl })
    }

    return NextResponse.json({ error: "Provider not supported for TTS" }, { status: 400 })
  } catch (error) {
    console.error("TTS error:", error)
    return NextResponse.json({ error: "Failed to generate speech" }, { status: 500 })
  }
}
