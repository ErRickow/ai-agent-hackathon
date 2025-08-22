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
  Menu,
  MessageSquare,
  Cpu,
  Globe,
  Volume2,
  RotateCcw,
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

type Provider = "lunos" | "unli";
type AIMode = "chat" | "vision" | "tts" | "embedding";

function AIAgent() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [models, setModels] = useState < Model[] > ([]);
  const [selectedModel, setSelectedModel] = useState < string > ("");
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [provider, setProvider] = useState<Provider>("lunos");
  const [aiMode, setAIMode] = useState<AIMode>("chat");
  const [streamingMessage, setStreamingMessage] = useState("");
  const [isImageGenMode, setIsImageGenMode] = useState(false);
  const [ttsText, setTtsText] = useState("");
  const [embeddingText, setEmbeddingText] = useState("");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [visionPrompt, setVisionPrompt] = useState("");
  const [selectedPersona, setSelectedPersona] = useState<Persona>(predefinedPersonas[0]);
  const [customSystemPrompt, setCustomSystemPrompt] = useState("");
  const [useCustomPrompt, setUseCustomPrompt] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingMessage]);
  
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
    
    const currentInput = input.trim();
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: currentInput,
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    
    if (isImageGenMode) {
      // LOGIKA UNTUK IMAGE GENERATION
      try {
        const response = await fetch("/api/image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: currentInput, provider }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Image generation failed");
        }
        
        const data = await response.json();
        const imageMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `Generated image for: "${currentInput}"`,
          timestamp: new Date(),
          provider,
          type: "image",
          imageUrl: data.imageUrl,
        };
        setMessages((prev) => [...prev, imageMessage]);
      } catch (error) {
        console.error("Image generation error:", error);
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `Maaf, gagal membuat gambar. Error: ${error instanceof Error ? error.message : "Unknown error"}`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
        setIsImageGenMode(false); // Matikan mode gambar setelah selesai
      }
    } else {
      // LOGIKA UNTUK CHAT BIASA (TERMASUK STREAMING)
      setStreamingMessage("");
      try {
        const systemPrompt = useCustomPrompt ? customSystemPrompt : selectedPersona.systemPrompt;
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: currentInput,
            provider,
            model: selectedModel,
            systemPrompt,
            messages: messages.map((m) => ({ role: m.role, content: m.content })),
          }),
        });
        
        if (!response.ok || !response.body) {
          throw new Error("Failed to get response from server.");
        }
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullResponse = "";
        let buffer = "";
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          
          // Proses semua baris lengkap di dalam buffer
          let boundary = buffer.lastIndexOf('\n');
          if (boundary === -1) continue;
          
          const lines = buffer.substring(0, boundary).split('\n');
          buffer = buffer.substring(boundary + 1); // Simpan sisa chunk yang tidak lengkap
          
          for (const line of lines) {
            if (line.trim() === "" || !line.startsWith("data:")) continue;
            
            const data = line.slice(6).trim();
            if (data === "[DONE]") {
              // Keluar dari loop jika sudah selesai
              break;
            }
            
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                fullResponse += parsed.content;
                setStreamingMessage(fullResponse);
              }
            } catch (e) {
              console.error("Gagal parse JSON dari stream:", e);
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
        
      } catch (error) {
        console.error("Chat error:", error);
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `Maaf, terjadi kesalahan. Coba lagi nanti.`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
        setStreamingMessage("");
      } finally {
        setIsLoading(false);
      }
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
      case "image":
        return <ImageIcon className="w-4 h-4" />;
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
      case "image":
        return "Image Generation";
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
      <div className="flex h-screen bg-background text-foreground">
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
          models = { models }
          selectedModel = { selectedModel }
          setSelectedModel = { setSelectedModel }
        />
        <div className="flex-1 flex flex-col">
          <header className="border-b border-border bg-card/50 backdrop-blur-sm">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setIsSidebarOpen(true)}>
                  <Menu className="w-5 h-5" />
                </Button>
                <div className="flex items-center gap-2">
                  {getModeIcon(aiMode)}
                  <h2 className="font-semibold capitalize">{getModeTitle(aiMode)}</h2>
                  <Badge variant="secondary" className="text-xs">
                    {provider === "lunos" ? "Lunos" : "Unli.dev"}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {selectedPersona.name}
                </Badge>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setMessages([]);
                        setImagePrompt("");
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
          <div className="flex-1 flex flex-col">
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
                isImageGenMode = {isImageGenMode}
                onImageGenToggle = {handleImageGenToggle}
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
    </TooltipProvider>
  );
}

export { AIAgent };