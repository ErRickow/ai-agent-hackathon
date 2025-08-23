// app/api/auth/send-code/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }
    
    const code = generateOTP();
    const expires = new Date(Date.now() + 10 * 60 * 1000);
    
    await addDoc(collection(db, "auth_codes"), {
      email,
      code,
      expires,
    });
    
    const apiKey = process.env.MAILRY_API_KEY;
    if (!apiKey) {
      throw new Error("MAILRY_API_KEY environment variable is not set.");
    }
    
    // --- PERUBAHAN DI SINI: Konten Email Dibuat Lebih Natural ---
    const mailryPayload = {
      to: email,
      subject: `Here is your login code for AI Agent Hackathon`, // Subjek lebih personal
      htmlBody: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #4A90E2;">Welcome to Agentic Merdeka!</h2>
          <p>Halo,</p>
          <p>You requested to log in to our application. Please use the following code to complete your login process:</p>
          <p style="font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #333; margin: 20px 0;">${code}</p>
          <p>This code is valid for the next 10 minutes. If you did not request this, you can safely ignore this email.</p>
          <p>Thanks,<br/>The AI Agent Hackathon Team</p>
          <hr style="border: none; border-top: 1px solid #eee; margin-top: 20px;" />
          <p style="font-size: 12px; color: #999;">If you're having trouble, please contact our support. Remember to check your spam/junk folder if you don't see our emails in your inbox.</p>
        </div>
      `,
      plainBody: `
        Welcome to AI Agent Hackathon!
        
        Your login code is: ${code}
        
        This code is valid for the next 10 minutes. If you did not request this, please ignore this email.
        
        Thanks,
        This Auth Is To Participate An Event AI Hackathon Special Hut RI 2025 🎉
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
      console.error("Mailry API Error:", errorBody);
      throw new Error(`Mailry Error: ${errorBody.message || 'Failed to send email.'}`);
    }
    
    return NextResponse.json({ message: "Verification code sent. Please check your email." });
    
  } catch (error) {
    console.error("API Route Error:", error);
    const message = error instanceof Error ? error.message : "An unknown error occurred.";
    return NextResponse.json({ error: "Failed to send verification code.", details: message }, { status: 500 });
  }
}