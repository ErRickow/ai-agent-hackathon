import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, addDoc, serverTimestamp, deleteDoc, orderBy, limit } from "firebase/firestore";
import { SignJWT } from "jose";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json();
    
    if (!email || !code) {
      return NextResponse.json({ error: "Email and code are required" }, { status: 400 });
    }
    
    const q = query(
      collection(db, "auth_codes"),
      where("email", "==", email),
      where("code", "==", code),
      orderBy("expires", "desc"),
      limit(1)
    );
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return NextResponse.json({ error: "Invalid verification code." }, { status: 400 });
    }
    
    const codeDoc = snapshot.docs[0];
    const codeData = codeDoc.data();
    
    // Cek apakah kode sudah kedaluwarsa
    if (new Date() > codeData.expires.toDate()) {
      await deleteDoc(codeDoc.ref);
      return NextResponse.json({ error: "Code has expired." }, { status: 400 });
    }
    
    const usersRef = collection(db, "users");
    const userQuery = query(usersRef, where("email", "==", email), limit(1));
    const userSnapshot = await getDocs(userQuery);
    
    let userId;
    if (userSnapshot.empty) {
      const newUserRef = await addDoc(usersRef, { email, createdAt: serverTimestamp() });
      userId = newUserRef.id;
    } else {
      userId = userSnapshot.docs[0].id;
    }
    
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const jwt = await new SignJWT({ email, userId })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("30d")
      .sign(secret);
    
    cookies().set("session", jwt, { httpOnly: true, secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 30, path: "/" });
    
    await deleteDoc(codeDoc.ref);
    
    return NextResponse.json({ success: true, message: "Login successful!" });
    
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Verification failed." }, { status: 500 });
  }
}