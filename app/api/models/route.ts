import { type NextRequest, NextResponse } from "next/server";

// Struktur data yang dinormalisasi untuk model
interface Model {
  id: string;
  name: string;
}

// Fungsi untuk mengambil model Lunos
async function getLunosModels(apiKey: string): Promise < Model[] > {
  const response = await fetch("https://api.lunos.tech/public/models", {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });
  if (!response.ok) {
    console.error("Failed to fetch Lunos models:", await response.text());
    return [];
  }
  const data = await response.json();
  // Normalisasi data Lunos
  return data.map((model: any) => ({
    id: model.id,
    name: model.name,
  }));
}

// Fungsi untuk mengambil model Unli.dev
async function getUnliModels(apiKey: string): Promise < Model[] > {
  const response = await fetch("https://api.unli.dev/v1/models", {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });
  if (!response.ok) {
    console.error("Failed to fetch Unli.dev models:", await response.text());
    return [];
  }
  const data = await response.json();
  // Normalisasi data Unli.dev
  return data.data.map((model: any) => ({
    id: model.id,
    name: model.name || model.id, // Gunakan ID jika nama tidak ada
  }));
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const provider = searchParams.get("provider");
  
  if (!provider) {
    return NextResponse.json({ error: "Provider is required" }, { status: 400 });
  }
  
  try {
    let models: Model[] = [];
    if (provider === "lunos") {
      const apiKey = process.env.LUNOS_KEY;
      if (!apiKey) throw new Error("LUNOS_KEY is not set");
      models = await getLunosModels(apiKey);
    } else if (provider === "unli") {
      const apiKey = process.env.UNLI_KEY;
      if (!apiKey) throw new Error("UNLI_KEY is not set");
      models = await getUnliModels(apiKey);
    } else {
      return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
    }
    return NextResponse.json({ models });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`Error fetching models for ${provider}:`, message);
    return NextResponse.json({ error: "Failed to fetch models", details: message }, { status: 500 });
  }
}