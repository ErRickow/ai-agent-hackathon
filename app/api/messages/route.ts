import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export async function DELETE(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  try {
    const { messageId, action } = await request.json();
    const userChatRef = doc(db, "users", userId);
    
    if (action === "reset") {
      // Aksi untuk mereset seluruh percakapan
      await updateDoc(userChatRef, { messages: [] });
      return NextResponse.json({ success: true, message: "Conversation reset." });
    }
    
    if (messageId) {
      // Aksi untuk menghapus satu pesan
      const userChatSnap = await getDoc(userChatRef);
      if (userChatSnap.exists()) {
        const currentMessages = userChatSnap.data().messages || [];
        const updatedMessages = currentMessages.filter((msg: any) => {
          const msgId = msg.timestamp.seconds + msg.role;
          return msgId !== messageId;
        });
        
        await updateDoc(userChatRef, { messages: updatedMessages });
        return NextResponse.json({ success: true, message: "Message deleted." });
      }
    }
    
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    
  } catch (error) {
    console.error("Delete message error:", error);
    return NextResponse.json({ error: "Failed to update messages" }, { status: 500 });
  }
}