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

  embedding = {
    embed: async (options: {
      input: string
      model: string
      response_format?: string
      appId?: string
    }) => {
      const response = await fetch(`${this.baseURL}/embeddings`, {
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
    const { text, provider } = await request.json()

    if (provider === "lunos") {
      const client = new LunosClient({
        apiKey: "sk-e75005eb20d3a45a62791ba6e1da46380cd9521748891354",
        appId: "hackathon-embedding-v1.0",
      })

      const response = await client.embedding.embed({
        input: text,
        model: "openai/text-embedding-3-small",
        response_format: "float",
      })

      return NextResponse.json({ embedding: response.data[0].embedding })
    }

    return NextResponse.json({ error: "Provider not supported for embeddings" }, { status: 400 })
  } catch (error) {
    console.error("Embedding error:", error)
    return NextResponse.json({ error: "Failed to generate embedding" }, { status: 500 })
  }
}
