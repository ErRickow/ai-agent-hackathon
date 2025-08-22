import { type NextRequest, NextResponse } from "next/server";

class LunosClient {
  private apiKey: string;
  private baseURL: string;
  private appId?: string;

  constructor(config: { apiKey: string; baseURL?: string; appId?: string }) {
    this.apiKey = config.apiKey;
    this.baseURL = config.baseURL || "https://api.lunos.tech/v1";
    this.appId = config.appId;
  }

  audio = {
    generations: async (options: {
      input: string;
      voice: string;
      model: string;
      response_format?: string;
      speed?: number;
    }) => {
      const response = await fetch(`${this.baseURL}/audio/generations`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          ...(this.appId && { "X-App-ID": this.appId }),
        },
        body: JSON.stringify(options),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      return response;
    },
  };
}

export async function POST(request: NextRequest) {
  try {
    const { text, provider } = await request.json();

    if (provider === "lunos") {
      if (!process.env.LUNOS_KEY) {
        throw new Error("LUNOS_KEY environment variable is not set.");
      }
      
      const client = new LunosClient({
        apiKey: process.env.LUNOS_KEY,
        appId: "er-project",
      });

      const lunosResponse = await client.audio.generations({
        input: text,
        voice: "alloy",
        model: "openai/tts",
        response_format: "mp3",
      });

      // Ambil body dari respons Lunos (yang merupakan stream audio)
      const audioStream = lunosResponse.body;

      if (!audioStream) {
        return NextResponse.json({ error: "No audio stream received from provider" }, { status: 500 });
      }

      // Buat respons baru untuk dikirim ke client, dengan stream audio sebagai body
      // dan header yang sesuai.
      const response = new NextResponse(audioStream, {
        status: 200,
        headers: {
          "Content-Type": "audio/mpeg",
          "Content-Disposition": `attachment; filename="speech.mp3"`,
        },
      });

      return response;
    }

    return NextResponse.json(
      { error: "Provider not supported for TTS" },
      { status: 400 }
    );
  } catch (error) {
    console.error("TTS error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json(
      { error: "Failed to generate speech", details: errorMessage },
      { status: 500 }
    );
  }
}