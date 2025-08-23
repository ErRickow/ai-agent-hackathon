"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
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
  PanelLeftClose,
  MessageSquare,
  Globe,
  Volume2,
  RotateCcw,
  Menu,
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

const GUEST_MESSAGE_COUNT_KEY = "ai_agent_guest_count";
const MAX_GUEST_MESSAGES = 5;

type Provider = "lunos" | "unli";
type AIMode = "chat" | "vision" | "tts" | "embedding";

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
  const [ttsText, setTtsText] = useState("");
  const [embeddingText, setEmbeddingText] = useState("");
  const [uploadedImage, setUploadedImage] = useState < string | null > (null);
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
        } else {
          const count = parseInt(localStorage.getItem(GUEST_MESSAGE_COUNT_KEY) || "0");
          setGuestMessageCount(count);
        }
      } catch (error) {
        console.error("Failed to check session:", error);
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
    const fetchModels = async () => {
      try {
        const response = await fetch(`/api/models?provider=${provider}`);
        const data = await response.json();
        if (data.models && data.models.length > 0) {
          setModels(data.models);
          // Atur model default ke model pertama dalam daftar
          setSelectedModel(data.models[0].id);
        } else {
          setModels([]);
          setSelectedModel("");
        }
      } catch (error) {
        console.error("Failed to fetch models:", error);
        setModels([]);
        setSelectedModel("");
      }
    };
    fetchModels();
  }, [provider]); // Dijalankan setiap kali 'provider' berubah

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;
    if (user) {
      await sendAuthenticatedMessage();
    } else {
      await sendGuestMessage();
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
    const userMessage: Message = { id: Date.now().toString(), role: "user", content: currentInput, timestamp: new Date() };
    
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
          message: currentInput, provider, model: selectedModel,
          systemPrompt: useCustomPrompt ? customSystemPrompt : selectedPersona.systemPrompt,
        }),
      });

      if (!response.ok || !response.body) {
        if (response.status === 403) setShowLoginModal(true);
        throw new Error("Failed to get response from server.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = "";
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        // Logika parsing SSE
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim().startsWith('data:'));
        for (const line of lines) {
            const data = line.replace(/^data: /, '').trim();
            if (data === '[DONE]') continue;
            try {
                const parsed = JSON.parse(data);
                fullResponse += parsed.content || "";
                setStreamingMessage(fullResponse);
            } catch (e) { console.error("Stream parse error:", e); }
        }
      }
      
      if (!isAuthenticated) {
        const assistantMessage: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: fullResponse, timestamp: new Date(), provider };
        setMessages((prev) => [...prev, assistantMessage]);
        const newCount = guestMessageCount + 1;
        setGuestMessageCount(newCount);
        localStorage.setItem(GUEST_MESSAGE_COUNT_KEY, newCount.toString());
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => prev.slice(0, -1)); // Rollback optimistic UI
    } finally {
      setIsLoading(false);
      setStreamingMessage("");
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
      console.error("Embedding error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeImage = async () => {
    if (!uploadedImage || !visionPrompt.trim() || isLoading) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/vision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: uploadedImage,
          prompt: visionPrompt,
          provider,
        }),
      });

      const data = await response.json();

      const visionMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: data.analysis,
        timestamp: new Date(),
        provider,
        type: "text",
      };

      setMessages((prev) => [...prev, visionMessage]);
      setVisionPrompt("");
      setUploadedImage(null);
    } catch (error) {
      console.error("Vision error:", error);
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

  const handleImageGenToggle = (enabled: boolean) => {
    setIsImageGenMode(enabled);
    setInput("");
  };

  const getModeIcon = (mode: AIMode) => {
    switch (mode) {
      case "chat":
        return <MessageSquare className="w-4 h-4" />;
      case "vision":
        return <Eye className="w-4 h-4" />;
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
      case "vision":
        return "Vision Analysis";
      case "tts":
        return "Text to Speech";
      case "embedding":
        return "Text Embeddings";
    }
  };

  return (
    <TooltipProvider>
      <div className="flex h-screen bg-background text-foreground overflow-hidden">
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
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 w-full">
          {/* Header */}
          <header className="border-b border-border bg-card/50 backdrop-blur-sm shrink-0">
            <div className="flex items-center justify-between p-3 sm:p-4 gap-2">
              {/* Left Section */}
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="lg:hidden p-2 shrink-0" 
                  onClick={() => setIsSidebarOpen(true)}
                >
                  <Menu className="w-5 h-5" />
                </Button>
                
                <div className="flex items-center gap-2 min-w-0">
                  {getModeIcon(aiMode)}
                  <h2 className="font-semibold capitalize text-sm sm:text-base truncate">
                    {getModeTitle(aiMode)}
                  </h2>
                  <Badge variant="secondary" className="text-xs shrink-0 hidden xs:inline-flex">
                    {provider === "lunos" ? "Lunos" : "Unli.dev"}
                  </Badge>
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

          {/* Content Area */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
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
              />
            )}
            {aiMode === "vision" && (
              <VisionInterface
                isLoading={isLoading}
                uploadedImage={uploadedImage}
                setUploadedImage={setUploadedImage}
                visionPrompt={visionPrompt}
                setVisionPrompt={setVisionPrompt}
                analyzeImage={analyzeImage}
                handleKeyPress={handleKeyPress}
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