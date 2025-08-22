import { type NextRequest, NextResponse } from "next/server"

class LunosClient {
  private apiKey: string
  private baseURL: string
  private appId ? : string
  
  constructor(config: { apiKey: string;baseURL: string;appId ? : string }) {
    this.apiKey = config.apiKey
    this.baseURL = config.baseURL
    this.appId = config.appId
  }
  
  chat = {
    createCompletion: async (options: {
      model: string
      messages: Array < { role: string;content: string } >
        max_tokens ? : number
      temperature ? : number
      stream ? : boolean
    }) => {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
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

class UnliClient {
  private apiKey: string
  private baseURL: string
  
  constructor(config: { apiKey: string;baseURL: string }) {
    this.apiKey = config.apiKey
    this.baseURL = config.baseURL
  }
  
  chat = {
    completions: {
      create: async (options: {
        model: string
        messages: Array < { role: string;content: string } >
          max_tokens ? : number
        temperature ? : number
        stream ? : boolean
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
        
        return response
      },
    },
  }
}


export async function POST(request: NextRequest) {
  try {
    const { message, provider, messages, systemPrompt } = await request.json()
    
    const systemMessage = systemPrompt ? [{ role: "system", content: systemPrompt }] : []
    const allMessages = [...systemMessage, ...messages, { role: "user", content: message }]
    
    let response: Response
    
    if (provider === "lunos") {
      const client = new LunosClient({
        apiKey: process.env.LUNOS_KEY,
        appId: "er-project",
      })
      
      response = await client.chat.createCompletion({
        model: "google/gemini-2.0-flash",
        messages: allMessages,
        max_tokens: 4024,
        temperature: 0.7,
        stream: true,
      })
    } else {
      const client = new UnliClient({
        apiKey: process.env.UNLI_KEY,
        baseURL: "https://api.unli.dev/v1",
      })
      
      response = await client.chat.completions.create({
        model: "auto",
        messages: allMessages,
        max_tokens: 4024,
        temperature: 0.7,
        stream: true,
      })
    }
    
    const encoder = new TextEncoder()
    const decoder = new TextDecoder()
    let buffer = ""
    
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader()
        if (!reader) {
          controller.close()
          return
        }
        
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) {
              // Jika masih ada sisa di buffer setelah stream selesai, proses
              if (buffer.length > 0) {
                // Penanganan sisa buffer jika diperlukan, meskipun biasanya stream berakhir dengan newline
              }
              break
            }
            
            // Tambahkan chunk baru ke buffer
            buffer += decoder.decode(value, { stream: true })
            
            // Proses semua baris lengkap di dalam buffer
            let boundary = buffer.lastIndexOf('\n')
            if (boundary === -1) {
              // Jika tidak ada newline, tunggu chunk berikutnya
              continue;
            }
            
            const lines = buffer.substring(0, boundary).split('\n');
            buffer = buffer.substring(boundary + 1); // Simpan sisa chunk yang tidak lengkap
            
            for (const line of lines) {
              if (line.trim() === "" || !line.startsWith("data:")) continue
              
              const data = line.slice(6).trim()
              if (data === "[DONE]") {
                controller.enqueue(encoder.encode("data: [DONE]\n\n"))
                controller.close()
                return
              }
              
              try {
                const parsed = JSON.parse(data)
                const content = parsed.choices?.[0]?.delta?.content || ""
                
                if (content) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`))
                }
              } catch (e) {
                console.error("Gagal parse JSON dari stream:", e)
              }
            }
          }
        } catch (error) {
          console.error("Stream error:", error)
          controller.error(error)
        } finally {
          controller.close()
        }
      },
    })
    
    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}