"use client";

import type React from "react";
import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Bot,
  User,
  Loader2,
  Zap,
  ImageIcon,
  Mic,
  Eye,
  Code2,
  Settings,
  Briefcase,
  Heart,
  Gamepad2,
  GraduationCap,
  Palette,
  MessageSquare,
  Globe,
  Volume2,
  RotateCcw,
  PanelLeftClose,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { predefinedPersonas } from "./persona"
import AISidebar from "./ai-sidebar";
import ChatInterface from "./chat-interface";
import VisionInterface from "./vision-interface";
import TTSInterface from "./tts-interface";
import EmbeddingInterface from "./embedding-interface";
import { LoginModal } from './login-modal';
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { toast } from "sonner";

interface Persona {
  id: string;
  name: string;
  icon: React.ReactNode;
  systemPrompt: string;
  description: string;
  color: string;
}

interface Model {
  id: string;
  name: string;
}

interface User {
  id: string;
  email: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  provider?: "lunos" | "unli";
  type?: "text" | "image" | "audio" | "embedding";
  imageUrl?: string;
  audioUrl?: string;
}

const GUEST_ID_KEY = "ai_agent_guest_id";
const GUEST_MESSAGE_COUNT_KEY = "ai_agent_guest_count";
const MAX_GUEST_MESSAGES = 5;
const SELECTED_MODEL_KEY = "ai_agent_selected_model";

type Provider = "lunos" | "unli";
type AIMode = "chat" | "tts" | "embedding";

function AIAgent() {
  // --- State ---
  const [messages, setMessages] = useState < Message[] > ([]);
  const [models, setModels] = useState < Model[] > ([]);
  const [selectedModel, setSelectedModel] = useState < string > ("");
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [provider, setProvider] = useState < Provider > ("lunos");
  const [aiMode, setAIMode] = useState < AIMode > ("chat");
  const [streamingMessage, setStreamingMessage] = useState("");
  const [isImageGenMode, setIsImageGenMode] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [ttsText, setTtsText] = useState("");
  const [embeddingText, setEmbeddingText] = useState("");
  const [visionPrompt, setVisionPrompt] = useState("");
  const [selectedPersona, setSelectedPersona] = useState < Persona > (predefinedPersonas[0]);
  const [customSystemPrompt, setCustomSystemPrompt] = useState("");
  const [useCustomPrompt, setUseCustomPrompt] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState < User | null > (null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [guestMessageCount, setGuestMessageCount] = useState(0);
  const messagesEndRef = useRef < HTMLDivElement > (null);

  // --- useEffect Hooks ---
  
  //Periksa sesi & muat data guest saat aplikasi dimuat
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/me');
        const data = await response.json();
        if (data.user) {
          setUser(data.user);
          localStorage.removeItem(GUEST_MESSAGE_COUNT_KEY);
          localStorage.removeItem(GUEST_ID_KEY);
        } else {
          let guestId = localStorage.getItem(GUEST_ID_KEY);
          if (!guestId) {
            guestId = crypto.randomUUID();
            localStorage.setItem(GUEST_ID_KEY, guestId);
          }
          const count = parseInt(localStorage.getItem(GUEST_MESSAGE_COUNT_KEY) || "0");
          setGuestMessageCount(count);
        }
      } catch (error) {
        console.error("Failed to check session:", error);
        toast.error("Gagal cek session, mohon bersabar")
      }
    };
    checkSession();
  }, []);
  
  // Muat riwayat obrolan berdasarkan status login
  useEffect(() => {
    if (user?.id) {
      const unsub = onSnapshot(doc(db, "users", user.id), (doc) => {
        const data = doc.data();
        if (data && data.messages) {
          const fetchedMessages = data.messages.map((msg: any) => ({
            ...msg,
            id: msg.timestamp.seconds + msg.role,
            timestamp: msg.timestamp.toDate(),
          }));
          setMessages(fetchedMessages);
        } else {
          setMessages([]);
        }
      });
      return () => unsub();
    } else {
      setMessages([]);
    }
  }, [user]);
  
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, streamingMessage]);
  
  useEffect(() => {
    if (selectedModel) {
      localStorage.setItem(SELECTED_MODEL_KEY, selectedModel);
    }
  }, [selectedModel]);
  
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await fetch(`/api/models?provider=${provider}`);
        const data = await response.json();
        if (data.models && data.models.length > 0) {
          setModels(data.models);
          const savedModel = localStorage.getItem(SELECTED_MODEL_KEY);
          if (savedModel && data.models.some((m: Model) => m.id === savedModel)) {
            setSelectedModel(savedModel);
          } else {
            setSelectedModel(data.models[0].id);
          }
        } else {
          setModels([]);
          setSelectedModel("");
        }
      } catch (error) {
        toast.error("Gagal load model")
        console.error("Failed to fetch models:", error);
        setModels([]);
        setSelectedModel("");
      }
    };
    fetchModels();
  }, [provider]);

  const handleDeleteMessage = async (messageId: string) => {
    try {
      const response = await fetch('/api/messages', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete message");
      }
      toast.success("Pesan berhasil dihapus");
    } catch (error) {
      console.error(error);
      toast.error("Gagal menghapus pesan.");
    }
  };

  const handleResetConversation = async () => {
    try {
      const response = await fetch('/api/messages', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to reset conversation");
      }
      toast.success("Percakapan berhasil direset");
    } catch (error) {
      console.error(error);
      toast.error("Gagal mereset percakapan.");
    }
  };

  const generateImage = async () => {
    if (!input.trim() || isLoading) return;
    setIsLoading(true);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const response = await fetch("/api/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: input, provider }),
      });

      if (!response.ok) {
        toast.warn(`API Error ${response.status}`)
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Gambar berhasil dibuat untuk prompt: "${input}"`,
        timestamp: new Date(),
        provider,
        type: "image",
        imageUrl: data.imageUrl,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Image generation error:", error);
      toast.error("Gagal membuat gambar. Silakan coba lagi.");
      // Rollback pesan pengguna jika gagal
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
      setInput("");
    }
  };

  const handleSendMessage = async () => {
    if (uploadedImage) {
      await analyzeImage();
    } else if (isImageGenMode) {
      await generateImage();
    } else {
      if (!input.trim() || isLoading) return;
      if (user) {
        await sendAuthenticatedMessage();
      } else {
        await sendGuestMessage();
      }
    }
  };
  
  const sendGuestMessage = async () => {
    if (guestMessageCount >= MAX_GUEST_MESSAGES) {
      setShowLoginModal(true);
      return;
    }
    await processMessageStream("/api/guest-chat", false);
  };
  
  const sendAuthenticatedMessage = async () => {
    await processMessageStream("/api/chat", true);
  };

  const processMessageStream = async (endpoint: string, isAuthenticated: boolean) => {
    const currentInput = input.trim();
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: currentInput,
      timestamp: new Date(),
    };
    
    // Optimistic UI
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setStreamingMessage("");
    
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // guestId hanya dikirim jika itu adalah guest
          ...(!isAuthenticated && { guestId: localStorage.getItem(GUEST_ID_KEY) }),
          message: currentInput,
          provider,
          model: selectedModel,
          systemPrompt: useCustomPrompt ? customSystemPrompt : selectedPersona.systemPrompt,
        }),
      });
      
      if (!response.ok) {
        if (response.status === 403 || response.status === 401) {
          setShowLoginModal(true);
        }
        throw new Error(`Server error: ${response.status}`);
      }
      
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let fullResponse = "";
      let buffer = "";
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        
        let eolIndex;
        while ((eolIndex = buffer.indexOf('\n')) >= 0) {
          const line = buffer.slice(0, eolIndex).trim();
          buffer = buffer.slice(eolIndex + 1);
          
          if (line.startsWith('data:')) {
            const data = line.replace(/^data: /, '').trim();
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              fullResponse += parsed.content || "";
              setStreamingMessage(fullResponse);
            } catch (e) {
              toast.error("Terjadi kesalahan saat streaming")
              console.error("Stream parse error:", e, "on line:", line);
            }
          }
        }
      }
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: fullResponse,
        timestamp: new Date(),
        provider,
      };
      
      setMessages((prev) => [...prev, assistantMessage]);
      setStreamingMessage("");
      
      if (!isAuthenticated) {
        const newCount = guestMessageCount + 1;
        setGuestMessageCount(newCount);
        localStorage.setItem(GUEST_MESSAGE_COUNT_KEY, newCount.toString());
      }
      
    } catch (error) {
      toast.error("Terjadi Kesalahan, mohon bersabar")
      console.error("Chat error:", error);
      setMessages((prev) => prev.slice(0, -1)); // Rollback optimistic UI
    } finally {
      setIsLoading(false);
    }
  };

  const generateSpeech = async () => {
    if (!ttsText.trim() || isLoading) return;
    
    setIsLoading(true);
    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: ttsText, provider }),
      });
      
      if (!response.ok) {
        toast.error(`API error ${response.status}`)
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // 1. Dapatkan audio sebagai Blob
      const audioBlob = await response.blob();
      
      // 2. Buat Object URL dari Blob
      const audioUrl = URL.createObjectURL(audioBlob);
      
      const audioMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: `Generated speech: "${ttsText}"`,
        timestamp: new Date(),
        provider,
        type: "audio",
        audioUrl: audioUrl,
      };
      
      setMessages((prev) => [...prev, audioMessage]);
      setTtsText("");
    } catch (error) {
      toast.error("TTS ERROR mohon bersabar")
      console.error("TTS error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateEmbedding = async () => {
    if (!embeddingText.trim() || isLoading) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/embedding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: embeddingText, provider }),
      });

      const data = await response.json();

      const embeddingMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: `Embedding generated for: "${embeddingText}"\nDimensions: ${data.embedding.length}\nFirst 5 values: [${data.embedding
          .slice(0, 5)
          .map((n: number) => n.toFixed(4))
          .join(", ")}...]`,
        timestamp: new Date(),
        provider,
        type: "embedding",
      };

      setMessages((prev) => [...prev, embeddingMessage]);
      setEmbeddingText("");
    } catch (error) {
      toast.error("Embeddings Error, mohon bersabar")
      console.error("Embedding error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeImage = async () => {
    if (!uploadedImage || !input.trim() || isLoading) return;
    
    setIsLoading(true);
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
      type: "image",
      imageUrl: uploadedImage,
    };
    setMessages((prev) => [...prev, userMessage]);
    
    const imageToSend = uploadedImage;
    setInput("");
    setUploadedImage(null);
    
    try {
      const response = await fetch("/api/vision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: imageToSend,
          prompt: userMessage.content,
          provider: "unli",
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Gagal menganalisis gambar.");
      }
      
      const data = await response.json();
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.analysis,
        timestamp: new Date(),
        provider: "unli",
        type: "text",
      };
      
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Vision error:", error);
      toast.error((error as Error).message);
      // Rollback jika gagal
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (aiMode === 'chat') {
        handleSendMessage();
      } else if (aiMode === 'vision') {
        analyzeImage();
      } else if (aiMode === 'tts') {
        generateSpeech();
      } else if (aiMode === 'embedding') {
        generateEmbedding();
      }
    }
  };
  
  const handleLogout = async () => {
    const response = await fetch('/api/auth/logout', { method: 'POST' });
    if (response.ok) {
      toast.success("Berhasil logout")
      window.location.reload();
    } else {
      toast.error("Logout gagal")
      console.error("Logout failed");
    }
  };

  const handleImageGenToggle = (enabled: boolean) => {
    setIsImageGenMode(enabled);
    setInput("");
  };

  const getModeIcon = (mode: AIMode) => {
    switch (mode) {
      case "chat":
        return <MessageSquare className="w-4 h-4" />;
      case "tts":
        return <Mic className="w-4 h-4" />;
      case "embedding":
        return <Code2 className="w-4 h-4" />;
    }
  };

  const getModeTitle = (mode: AIMode) => {
    switch (mode) {
      case "chat":
        return "Chat";
      case "tts":
        return "Text to Speech";
      case "embedding":
        return "Text Embeddings";
    }
  };

  return (
    <TooltipProvider>
      <div className="flex h-screen w-full bg-background text-foreground no-scroll-parent">
        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
        
        {/* Sidebar */}
        <div className={`
          fixed lg:relative lg:translate-x-0 transition-transform duration-300 ease-in-out z-50
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          w-full sm:w-80 h-full
        `}>
          <AISidebar
            aiMode={aiMode}
            setAIMode={setAIMode}
            provider={provider}
            setProvider={setProvider}
            selectedPersona={selectedPersona}
            predefinedPersonas={predefinedPersonas}
            customSystemPrompt={customSystemPrompt}
            setCustomSystemPrompt={setCustomSystemPrompt}
            useCustomPrompt={useCustomPrompt}
            setUseCustomPrompt={setUseCustomPrompt}
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
            onSelectPersona={setSelectedPersona}
            models={models}
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
            user={user}
            onLoginClick={() => setShowLoginModal(true)}
            onLogoutClick={handleLogout}
          />
        </div>

        {/* Main Content Area */}
        <div className="flex-column-full flex-1 min-w-0 chat-container">
          {/* Header */}
          <header className="border-b border-border bg-card/50 backdrop-blur-sm chat-header">
            <div className="flex items-center justify-between p-3 sm:p-4 gap-2">
              {/* Left Section */}
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="lg:hidden p-2 shrink-0" 
                  onClick={() => setIsSidebarOpen(true)}
                >
                  <PanelLeftClose className="w-5 h-5" />
                </Button>
                
                <div className="flex items-center gap-2 min-w-0">
                  {getModeIcon(aiMode)}
                  <h2 className="font-semibold capitalize text-sm sm:text-base truncate">
                    {getModeTitle(aiMode)}
                  </h2>
                  <a 
                      href={provider === "lunos" ? "https://lunos.tech/?utm_source=ai-agent-hackathon" : "https://unli.dev/?utm_source=agentic-merdeka.vercel.app"} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      <Badge variant="secondary" className="text-xs shrink-0 hidden xs:inline-flex cursor-pointer hover:ring-2 hover:ring-primary/50">
                        {provider === "lunos" ? "Lunos" : "Unli.dev"}
                      </Badge>
                    </a>
                </div>
              </div>

              {/* Right Section */}
              <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                <Badge variant="outline" className="text-xs max-w-24 sm:max-w-32 truncate">
                  {selectedPersona.name}
                </Badge>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-2"
                      onClick={() => {
                        setMessages([]);
                        setInput("");
                        setTtsText("");
                        setEmbeddingText("");
                        setVisionPrompt("");
                        setUploadedImage(null);
                      }}
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Clear all content</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </header>

          {/* Content Area - Full remaining height */}
          <div className="flex-1-min-height">
            {aiMode === "chat" && (
              <ChatInterface
                messages={messages}
                streamingMessage={streamingMessage}
                selectedPersona={selectedPersona}
                provider={provider}
                isLoading={isLoading}
                input={input}
                setInput={setInput}
                sendMessage={handleSendMessage}
                handleKeyPress={handleKeyPress}
                isImageGenMode={isImageGenMode}
                onImageGenToggle={handleImageGenToggle}
                uploadedImage={uploadedImage}
                setUploadedImage={setUploadedImage}
                onDeleteMessage={handleDeleteMessage}
                onResetConversation={handleResetConversation}
                user={user}
              />
            )}
            {aiMode === "tts" && (
              <TTSInterface
                isLoading={isLoading}
                ttsText={ttsText}
                setTtsText={setTtsText}
                generateSpeech={generateSpeech}
                handleKeyPress={handleKeyPress}
              />
            )}
            {aiMode === "embedding" && (
              <EmbeddingInterface
                isLoading={isLoading}
                embeddingText={embeddingText}
                setEmbeddingText={setEmbeddingText}
                generateEmbedding={generateEmbedding}
                handleKeyPress={handleKeyPress}
              />
            )}
          </div>
        </div>
      </div>
      <LoginModal open={showLoginModal} onOpenChange={setShowLoginModal} />
    </TooltipProvider>
  );
}

export { AIAgent };