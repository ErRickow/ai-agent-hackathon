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
import ImageGenerationInterface from "./image-generation-interface";
import VisionInterface from "./vision-interface";
import TTSInterface from "./tts-interface";
import EmbeddingInterface from "./embedding-interface";

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
type AIMode = "chat" | "image" | "vision" | "tts" | "embedding";

function AIAgent() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [provider, setProvider] = useState<Provider>("lunos");
  const [aiMode, setAIMode] = useState<AIMode>("chat");
  const [streamingMessage, setStreamingMessage] = useState("");
  const [imagePrompt, setImagePrompt] = useState("");
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

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setStreamingMessage("");

    try {
      const systemPrompt = useCustomPrompt ? customSystemPrompt : selectedPersona.systemPrompt;
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: input.trim(),
          provider,
          systemPrompt,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") {
                break;
              }
              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  fullResponse += parsed.content;
                  setStreamingMessage(fullResponse);
                }
              } catch (e) {
              }
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
    } catch (error) {
      console.error("Error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Maaf, terjadi kesalahan saat memproses permintaan Anda.",
        timestamp: new Date(),
        provider,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateImage = async () => {
    if (!imagePrompt.trim() || isLoading) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: imagePrompt, provider }),
      });

      const data = await response.json();

      const imageMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: `Generated image: "${imagePrompt}"`,
        timestamp: new Date(),
        provider,
        type: "image",
        imageUrl: data.imageUrl,
      };

      setMessages((prev) => [...prev, imageMessage]);
      setImagePrompt("");
    } catch (error) {
      console.error("Image generation error:", error);
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

      const data = await response.json();

      const audioMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: `Generated speech: "${ttsText}"`,
        timestamp: new Date(),
        provider,
        type: "audio",
        audioUrl: data.audioUrl,
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
      if (aiMode === "chat") {
        sendMessage();
      } else if (aiMode === "image") {
        generateImage();
      } else if (aiMode === "vision") {
        analyzeImage();
      } else if (aiMode === "tts") {
        generateSpeech();
      } else if (aiMode === "embedding") {
        generateEmbedding();
      }
    }
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
                sendMessage={sendMessage}
                handleKeyPress={handleKeyPress}
              />
            )}
            {aiMode === "image" && (
              <ImageGenerationInterface
                isLoading={isLoading}
                imagePrompt={imagePrompt}
                setImagePrompt={setImagePrompt}
                generateImage={generateImage}
                handleKeyPress={handleKeyPress}
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