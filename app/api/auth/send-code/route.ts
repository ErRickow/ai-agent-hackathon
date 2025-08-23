import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";

// Fungsi untuk membuat kode OTP 6 digit
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

    const mailryPayload = {
      to: email,
      subject: `Your Verification Code: ${code}`,
      htmlBody: `
        <h1>Your AI Agent Verification Code</h1>
        <p>Here is your code: <strong>${code}</strong></p>
        <p>This code will expire in 10 minutes.</p>
        <hr>
        <p><em>Didn't receive the email in your inbox? Please check your spam or junk folder.</em></p>
      `,
      plainBody: `Your verification code is: ${code}. It will expire in 10 minutes. If you can't find this email, please check your spam folder.`
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
        throw new Error("Failed to send email via Mailry.");
    }

    return NextResponse.json({ message: "Verification code sent. Please check your email." });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to send verification code." }, { status: 500 });
  }
}