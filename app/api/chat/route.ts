import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, updateDoc, arrayUnion, serverTimestamp } from "firebase/firestore";

// Klien untuk Lunos API
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

// Klien untuk Unli.dev API
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
    // Ambil userId dari header yang ditambahkan oleh middleware
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      // Ini seharusnya tidak terjadi jika middleware berjalan benar
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { message, provider, model, systemPrompt } = await request.json();
    
    const userChatRef = doc(db, "users", userId);
    const userChatSnap = await getDoc(userChatRef);
    
    // Ambil riwayat pesan dari Firestore
    const previousMessages = userChatSnap.exists() ? userChatSnap.data().messages || [] : [];
    
    // Siapkan pesan untuk dikirim ke API AI
    const systemMessage = systemPrompt ? [{ role: "system", content: systemPrompt }] : [];
    const messagesForApi = [...systemMessage, ...previousMessages.map((msg: any) => ({ role: msg.role, content: msg.content })), { role: "user", content: message }];
    
    let aiApiResponse: Response;
    
    if (provider === "lunos") {
      const client = new LunosClient({
        apiKey: process.env.LUNOS_KEY!,
        baseURL: "https://api.lunos.tech/v1",
        appId: "er-project",
      });
      aiApiResponse = await client.chat.createCompletion({ model, messages: messagesForApi, stream: true });
    } else {
      const client = new UnliClient({
        apiKey: process.env.UNLI_KEY!,
        baseURL: "https://api.unli.dev/v1",
      });
      aiApiResponse = await client.chat.completions.create({ model, messages: messagesForApi, stream: true });
    }
    
    // Logika Streaming
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    let fullResponseContent = "";
    
    const stream = new ReadableStream({
      async start(controller) {
        const reader = aiApiResponse.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }
        
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              const userMessagePayload = { role: "user", content: message, timestamp: new Date() };
              const assistantMessagePayload = { role: "assistant", content: fullResponseContent, timestamp: new Date(), provider };
              
              if (userChatSnap.exists()) {
                await updateDoc(userChatRef, {
                  messages: arrayUnion(userMessagePayload, assistantMessagePayload),
                  lastActive: serverTimestamp(),
                });
              } else {
                await setDoc(userChatRef, {
                  messages: [userMessagePayload, assistantMessagePayload],
                  lastActive: serverTimestamp(),
                }, { merge: true });
              }
              break; // Keluar dari loop setelah selesai
            }
            
            buffer += decoder.decode(value, { stream: true });
            let boundary = buffer.lastIndexOf('\n');
            if (boundary === -1) continue;
            
            const lines = buffer.substring(0, boundary).split('\n');
            buffer = buffer.substring(boundary + 1);
            
            for (const line of lines) {
              if (line.trim() === "" || !line.startsWith("data:")) continue;
              
              const data = line.slice(6).trim();
              if (data === "[DONE]") {
                continue;
              }
              
              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content || "";
                
                if (content) {
                  fullResponseContent += content;
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
                }
              } catch (e) {
                console.error("Gagal parse JSON dari stream:", e, "Line:", line);
              }
            }
          }
        } catch (error) {
          console.error("Stream error:", error);
          controller.error(error);
        } finally {
          controller.close();
        }
        // --- AKHIR PERUBAHAN ---
      },
    });
    
    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
    
  } catch (error) {
    console.error("Authenticated Chat Error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}