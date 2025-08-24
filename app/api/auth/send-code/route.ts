// app/api/auth/send-code/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";

const buatKodeOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: "Email wajib diisi" }, { status: 400 });
    }
    
    const kode = buatKodeOTP();
    const kadaluarsa = new Date(Date.now() + 10 * 60 * 1000);
    
    await addDoc(collection(db, "auth_codes"), {
      email,
      code: kode,
      expires: kadaluarsa,
    });
    
    const apiKey = process.env.MAILRY_API_KEY;
    if (!apiKey) {
      throw new Error("MAILRY_API_KEY environment variable belum diatur.");
    }
    
    // --- Konten Email dalam Bahasa Indonesia ---
    const mailryPayload = {
      to: email,
      subject: `Kode login Anda untuk Agentic Merdeka`,
      htmlBody: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #4A90E2;">Selamat datang di Agentic Merdeka!</h2>
          <p>Halo,</p>
          <p>Anda meminta untuk masuk ke aplikasi kami. Silakan gunakan kode berikut untuk menyelesaikan proses login Anda:</p>
          <p style="font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #333; margin: 20px 0;">${kode}</p>
          <p>Kode ini berlaku selama 10 menit ke depan. Jika Anda tidak meminta ini, Anda dapat mengabaikan email ini dengan aman.</p>
          <p>Terima kasih,<br/>Tim AI Agent Hackathon</p>
          <hr style="border: none; border-top: 1px solid #eee; margin-top: 20px;" />
          <p style="font-size: 12px; color: #999;">Jika Anda mengalami kesulitan, silakan hubungi dukungan kami. Ingat untuk memeriksa folder spam/junk jika Anda tidak melihat email kami di kotak masuk.</p>
        </div>
      `,
      plainBody: `
        Selamat datang di AI Agent Hackathon!
        
        Kode login Anda adalah: ${kode}
        
        Kode ini berlaku selama 10 menit ke depan. Jika Anda tidak meminta ini, silakan abaikan email ini.
        
        Terima kasih,
        Autentikasi ini untuk berpartisipasi dalam event AI Hackathon Spesial HUT RI 2025 🎉
      `
    };
    
    const mailryResponse = await fetch("https://api.mailry.co/ext/inbox/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(mailryPayload),
    });
    
    if (!mailryResponse.ok) {
      const errorBody = await mailryResponse.json();
      console.error("Kesalahan API Mailry:", errorBody);
      throw new Error(`Kesalahan Mailry: ${errorBody.message || 'Gagal mengirim email.'}`);
    }
    
    return NextResponse.json({ message: "Kode verifikasi telah dikirim. Silakan periksa email Anda." });
    
  } catch (error) {
    console.error("Kesalahan API Route:", error);
    const message = error instanceof Error ? error.message : "Terjadi kesalahan yang tidak diketahui.";
    return NextResponse.json({ error: "Gagal mengirim kode verifikasi.", details: message }, { status: 500 });
  }
}