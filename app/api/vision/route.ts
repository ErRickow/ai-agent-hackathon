import { type NextRequest, NextResponse } from "next/server"

class UnliClient {
  private apiKey: string
  private baseURL: string

  constructor(config: { apiKey: string; baseURL: string }) {
    this.apiKey = config.apiKey
    this.baseURL = config.baseURL
  }

  chat = {
    completions: {
      create: async (options: {
        model: string
        messages: Array<{
          role: string
          content: Array<{ type: string; text?: string; image_url?: { url: string } }> | string
        }>
        max_tokens?: number
        temperature?: number
      }) => {
        const response = await fetch(`${this.baseURL}/chat/completions`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(options),
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        return response.json()
      },
    },
  }
}

export async function POST(request: NextRequest) {
  try {
    const { image, prompt, provider } = await request.json()

    if (provider === "unli") {
      const client = new UnliClient({
        apiKey: "sk-e75005eb20d3a45a62791ba6e1da46380cd9521748891354",
        baseURL: "https://api.unli.dev/v1",
      })

      const response = await client.chat.completions.create({
        model: "auto",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: image,
                },
              },
              {
                type: "text",
                text: prompt,
              },
            ],
          },
        ],
        max_tokens: 1000,
        temperature: 0.7,
      })

      return NextResponse.json({ analysis: response.choices[0].message.content })
    }

    return NextResponse.json({ error: "Provider not supported for vision" }, { status: 400 })
  } catch (error) {
    console.error("Vision error:", error)
    return NextResponse.json({ error: "Failed to analyze image" }, { status: 500 })
  }
}
