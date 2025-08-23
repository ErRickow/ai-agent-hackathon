import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    // Hapus cookie sesi
    cookies().set("session", "", { expires: new Date(0), path: "/" });
    return NextResponse.json({ success: true, message: "Logout successful" });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json({ error: "Failed to logout" }, { status: 500 });
  }
}