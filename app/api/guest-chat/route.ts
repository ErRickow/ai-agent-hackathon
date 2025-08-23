import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, updateDoc, arrayUnion, serverTimestamp, increment } from "firebase/firestore";

const MAX_GUEST_MESSAGES = 5;

// Kelas LunosClient disalin dari /api/chat/route.ts
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
        const errorBody = await response.json();
        console.error("Lunos API Error:", errorBody);
        throw new Error(`Lunos API Error: ${errorBody.error?.message || response.statusText}`);
      }
      
      return response
    },
  }
}

// Kelas UnliClient disalin dari /api/chat/route.ts
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
          const errorBody = await response.json();
          console.error("Unli.dev API Error:", errorBody);
          throw new Error(`Unli.dev API Error: ${errorBody.error?.message || response.statusText}`);
        }
        
        return response
      },
    },
  }
}


export async function POST(request: NextRequest) {
  try {
    const { guestId, message, provider, model, systemPrompt } = await request.json();
    
    if (!guestId || typeof guestId !== 'string') {
      return NextResponse.json({ error: "Guest ID is missing or invalid" }, { status: 400 });
    }
    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: "Message is missing or invalid" }, { status: 400 });
    }
    if (!provider || (provider !== 'lunos' && provider !== 'unli')) {
      return NextResponse.json({ error: "Provider is missing or invalid" }, { status: 400 });
    }
    if (!model || typeof model !== 'string') {
      return NextResponse.json({ error: "Model is missing or invalid" }, { status: 400 });
    }
    
    const guestRef = doc(db, "guests", guestId);
    const guestSnap = await getDoc(guestRef);
    
    let messageCount = 0;
    if (guestSnap.exists()) {
      messageCount = guestSnap.data().messageCount || 0;
    }
    
    if (messageCount >= MAX_GUEST_MESSAGES) {
      return NextResponse.json({ error: "Message limit reached. Please log in." }, { status: 403 });
    }
    
    const previousMessages = guestSnap.exists() ? guestSnap.data().messages.map((m: any) => ({ role: m.role, content: m.content })) : [];
    const systemMessage = systemPrompt ? [{ role: "system", content: systemPrompt }] : []
    const messagesForApi = [...systemMessage, ...previousMessages, { role: "user", content: message }];
    
    let aiApiResponse: Response;
    
    if (provider === "lunos") {
      const client = new LunosClient({ apiKey: process.env.LUNOS_KEY!, baseURL: "https://api.lunos.tech/v1", appId: "er-project" });
      aiApiResponse = await client.chat.createCompletion({ model, messages: messagesForApi, stream: true });
    } else {
      const client = new UnliClient({ apiKey: process.env.UNLI_KEY!, baseURL: "https://api.unli.dev/v1" });
      aiApiResponse = await client.chat.completions.create({ model, messages: messagesForApi, stream: true });
    }
    
    const encoder = new TextEncoder()
    const decoder = new TextDecoder()
    let buffer = ""
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
            if (done) break;
            
            buffer += decoder.decode(value, { stream: true });
            let boundary = buffer.lastIndexOf('\n');
            if (boundary === -1) continue;
            
            const lines = buffer.substring(0, boundary).split('\n');
            buffer = buffer.substring(boundary + 1);
            
            for (const line of lines) {
              if (line.trim() === "" || !line.startsWith("data:")) continue;
              
              const data = line.slice(6).trim();
              if (data === "[DONE]") {
                controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                controller.close();
                return;
              }
              
              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content || "";
                
                if (content) {
                  fullResponseContent += content; // Akumulasi konten respons
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
                }
              } catch (e) {
                console.error("Gagal parse JSON dari stream:", e);
              }
            }
          }
        } catch (error) {
          console.error("Stream error:", error);
          controller.error(error);
        } finally {
          const userMessagePayload = { role: "user", content: message, timestamp: new Date() };
          const assistantMessagePayload = { role: "assistant", content: fullResponseContent, timestamp: new Date(), provider };
          
          if (guestSnap.exists()) {
            await updateDoc(guestRef, {
              messages: arrayUnion(userMessagePayload, assistantMessagePayload),
              messageCount: increment(1),
              lastActive: serverTimestamp(),
            });
          } else {
            await setDoc(guestRef, {
              messages: [userMessagePayload, assistantMessagePayload],
              messageCount: 1,
              createdAt: serverTimestamp(),
              lastActive: serverTimestamp(),
            });
          }
          controller.close();
        }
      },
    });
    
    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
    
  } catch (error) {
    console.error("Guest Chat Route Error:", error);
    const message = error instanceof Error ? error.message : "Unknown server error.";
    return NextResponse.json({ error: "Internal Server Error", details: message }, { status: 500 });
  }
}