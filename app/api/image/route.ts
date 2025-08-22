import { type NextRequest, NextResponse } from "next/server"

class LunosClient {
  private apiKey: string
  private baseURL: string
  private appId ? : string
  
  constructor(config: { apiKey: string;baseURL ? : string;appId ? : string }) {
    this.apiKey = config.apiKey
    this.baseURL = config.baseURL || "https://api.lunos.tech/v1"
    this.appId = config.appId
  }
  
  image = {
    generate: async (options: {
      prompt: string
      model: string
      n ? : number
      size ? : string
      quality ? : string
      response_format ? : string
      appId ? : string
    }) => {
      // Build the request body with all required parameters
      const requestBody = {
        model: options.model,
        prompt: options.prompt,
        n: options.n || 1,
        size: options.size || "1024x1024",
        quality: options.quality || "hd",
        response_format: options.response_format || "url"
      }
      
      const headers: Record < string, string > = {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      }
      
      // Add X-App-ID header if available
      if (this.appId || options.appId) {
        headers["X-App-ID"] = options.appId || this.appId!
      }
      
      const response = await fetch(`${this.baseURL}/image/generations`, {
        method: "POST",
        headers,
        body: JSON.stringify(requestBody),
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
      }
      
      return response.json()
    },
  }
}

export async function POST(request: NextRequest) {
  try {
    const { prompt, provider } = await request.json()
    
    // Validate required fields
    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }
    
    if (provider === "lunos") {
      // Check if API key is available
      if (!process.env.LUNOS_KEY) {
        console.error("LUNOS_KEY environment variable is not set")
        return NextResponse.json({ error: "API configuration error" }, { status: 500 })
      }
      
      const client = new LunosClient({
        apiKey: process.env.LUNOS_KEY,
        appId: "er-project",
      })
      
      const response = await client.image.generate({
        prompt,
        model: "openai/dall-e-3",
        n: 1,
        size: "1024x1024",
        quality: "hd",
        response_format: "url",
      })
      
      // Validate response structure
      if (!response.data || !Array.isArray(response.data) || response.data.length === 0) {
        throw new Error("Invalid response format from Lunos API")
      }
      
      return NextResponse.json({
        imageUrl: response.data[0].url,
        cost: response.cost,
        model: response.model
      })
    }
    
    return NextResponse.json({ error: "Provider not supported for image generation" }, { status: 400 })
  } catch (error) {
    console.error("Image generation error:", error)
    
    // Provide more specific error messages
    if (error instanceof Error) {
      return NextResponse.json({
        error: "Failed to generate image",
        details: error.message
      }, { status: 500 })
    }
    
    return NextResponse.json({ error: "Failed to generate image" }, { status: 500 })
  }
}