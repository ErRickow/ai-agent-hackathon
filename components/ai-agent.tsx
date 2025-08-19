"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Sheet, SheetContent } from "@/components/ui/sheet"
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
} from "lucide-react"

interface Persona {
  id: string
  name: string
  icon: React.ReactNode
  systemPrompt: string
  description: string
}

const predefinedPersonas: Persona[] = [
  {
    id: "assistant",
    name: "AI Assistant",
    icon: <Bot className="w-4 h-4" />,
    systemPrompt: "You are a helpful AI assistant. Provide clear, accurate, and helpful responses to user queries.",
    description: "General purpose helpful assistant",
  },
  {
    id: "expert",
    name: "Technical Expert",
    icon: <GraduationCap className="w-4 h-4" />,
    systemPrompt:
      "You are a technical expert with deep knowledge in programming, AI, and technology. Provide detailed, accurate technical explanations and solutions.",
    description: "Expert in programming and technology",
  },
  {
    id: "creative",
    name: "Creative Writer",
    icon: <Palette className="w-4 h-4" />,
    systemPrompt:
      "You are a creative writer and storyteller. Help users with creative writing, brainstorming ideas, and crafting engaging content.",
    description: "Creative writing and storytelling",
  },
  {
    id: "business",
    name: "Business Advisor",
    icon: <Briefcase className="w-4 h-4" />,
    systemPrompt:
      "You are a business advisor with expertise in strategy, marketing, and entrepreneurship. Provide practical business advice and insights.",
    description: "Business strategy and advice",
  },
  {
    id: "coach",
    name: "Life Coach",
    icon: <Heart className="w-4 h-4" />,
    systemPrompt:
      "You are a supportive life coach. Help users with personal development, motivation, and achieving their goals with empathy and encouragement.",
    description: "Personal development and motivation",
  },
  {
    id: "gaming",
    name: "Gaming Buddy",
    icon: <Gamepad2 className="w-4 h-4" />,
    systemPrompt:
      "You are a gaming enthusiast and expert. Help users with game strategies, recommendations, and discuss gaming topics with enthusiasm.",
    description: "Gaming expert and enthusiast",
  },
]

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  provider?: "lunos" | "unli"
  type?: "text" | "image" | "audio" | "embedding"
  imageUrl?: string
  audioUrl?: string
}

type Provider = "lunos" | "unli"
type AIMode = "chat" | "image" | "vision" | "tts" | "embedding"

function AIAgent() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [provider, setProvider] = useState<Provider>("lunos")
  const [aiMode, setAIMode] = useState<AIMode>("chat")
  const [streamingMessage, setStreamingMessage] = useState("")
  const [imagePrompt, setImagePrompt] = useState("")
  const [ttsText, setTtsText] = useState("")
  const [embeddingText, setEmbeddingText] = useState("")
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [visionPrompt, setVisionPrompt] = useState("")

  const [selectedPersona, setSelectedPersona] = useState<Persona>(predefinedPersonas[0])
  const [customSystemPrompt, setCustomSystemPrompt] = useState("")
  const [useCustomPrompt, setUseCustomPrompt] = useState(false)
  const [isPersonaDialogOpen, setIsPersonaDialogOpen] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, streamingMessage])

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)
    setStreamingMessage("")

    try {
      const systemPrompt = useCustomPrompt ? customSystemPrompt : selectedPersona.systemPrompt

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
      })

      if (!response.ok) {
        throw new Error("Failed to get response")
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let fullResponse = ""

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split("\n")

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6)
              if (data === "[DONE]") {
                break
              }
              try {
                const parsed = JSON.parse(data)
                if (parsed.content) {
                  fullResponse += parsed.content
                  setStreamingMessage(fullResponse)
                }
              } catch (e) {
                // Skip invalid JSON
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
      }

      setMessages((prev) => [...prev, assistantMessage])
      setStreamingMessage("")
    } catch (error) {
      console.error("Error:", error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Maaf, terjadi kesalahan saat memproses permintaan Anda.",
        timestamp: new Date(),
        provider,
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const generateImage = async () => {
    if (!imagePrompt.trim() || isLoading) return

    setIsLoading(true)
    try {
      const response = await fetch("/api/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: imagePrompt, provider }),
      })

      const data = await response.json()

      const imageMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: `Generated image: "${imagePrompt}"`,
        timestamp: new Date(),
        provider,
        type: "image",
        imageUrl: data.imageUrl,
      }

      setMessages((prev) => [...prev, imageMessage])
      setImagePrompt("")
    } catch (error) {
      console.error("Image generation error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const generateSpeech = async () => {
    if (!ttsText.trim() || isLoading) return

    setIsLoading(true)
    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: ttsText, provider }),
      })

      const data = await response.json()

      const audioMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: `Generated speech: "${ttsText}"`,
        timestamp: new Date(),
        provider,
        type: "audio",
        audioUrl: data.audioUrl,
      }

      setMessages((prev) => [...prev, audioMessage])
      setTtsText("")
    } catch (error) {
      console.error("TTS error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const generateEmbedding = async () => {
    if (!embeddingText.trim() || isLoading) return

    setIsLoading(true)
    try {
      const response = await fetch("/api/embedding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: embeddingText, provider }),
      })

      const data = await response.json()

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
      }

      setMessages((prev) => [...prev, embeddingMessage])
      setEmbeddingText("")
    } catch (error) {
      console.error("Embedding error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const analyzeImage = async () => {
    if (!uploadedImage || !visionPrompt.trim() || isLoading) return

    setIsLoading(true)
    try {
      const response = await fetch("/api/vision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: uploadedImage,
          prompt: visionPrompt,
          provider,
        }),
      })

      const data = await response.json()

      const visionMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: data.analysis,
        timestamp: new Date(),
        provider,
        type: "text",
      }

      setMessages((prev) => [...prev, visionMessage])
      setVisionPrompt("")
      setUploadedImage(null)
    } catch (error) {
      console.error("Vision error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (aiMode === "chat") {
        sendMessage()
      } else if (aiMode === "image") {
        generateImage()
      } else if (aiMode === "vision") {
        analyzeImage()
      } else if (aiMode === "tts") {
        generateSpeech()
      } else if (aiMode === "embedding") {
        generateEmbedding()
      }
    }
  }

  const getModeIcon = (mode: AIMode) => {
    switch (mode) {
      case "chat":
        return <MessageSquare className="w-4 h-4" />
      case "image":
        return <ImageIcon className="w-4 h-4" />
      case "vision":
        return <Eye className="w-4 h-4" />
      case "tts":
        return <Mic className="w-4 h-4" />
      case "embedding":
        return <Code2 className="w-4 h-4" />
    }
  }

  const getModeTitle = (mode: AIMode) => {
    switch (mode) {
      case "chat":
        return "Chat"
      case "image":
        return "Image Generation"
      case "vision":
        return "Vision Analysis"
      case "tts":
        return "Text to Speech"
      case "embedding":
        return "Text Embeddings"
    }
  }

  return (
    <TooltipProvider>
      <div className="flex h-screen bg-background text-foreground">
        {/* Desktop Sidebar */}
        <div className={`hidden lg:flex flex-col w-80 border-r border-border bg-card transition-all duration-300`}>
          <div className="p-6 border-b border-border">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              AI Agent Hub
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Multi-modal AI Assistant</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* AI Mode Selection */}
            <div>
              <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">AI Mode</Label>
              <div className="mt-3 space-y-2">
                {[
                  { id: "chat", label: "Chat", icon: MessageSquare },
                  { id: "image", label: "Image Gen", icon: ImageIcon },
                  { id: "vision", label: "Vision", icon: Eye },
                  { id: "tts", label: "Text-to-Speech", icon: Volume2 },
                  { id: "embedding", label: "Embeddings", icon: Zap },
                ].map(({ id, label, icon: Icon }) => (
                  <Tooltip key={id}>
                    <TooltipTrigger asChild>
                      <Button
                        variant={aiMode === id ? "default" : "ghost"}
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => setAIMode(id as any)}
                      >
                        <Icon className="w-4 h-4 mr-2" />
                        {label}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>{label} functionality</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </div>

            {/* Provider Selection */}
            <div>
              <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Provider</Label>
              <div className="mt-3 space-y-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={provider === "lunos" ? "default" : "ghost"}
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => setProvider("lunos")}
                    >
                      <Cpu className="w-4 h-4 mr-2" />
                      Lunos API
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>Use Lunos API for AI operations</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={provider === "unli" ? "default" : "ghost"}
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => setProvider("unli")}
                    >
                      <Globe className="w-4 h-4 mr-2" />
                      Unli.dev API
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>Use Unli.dev API for AI operations</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>

            {/* Persona Configuration */}
            <div>
              <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Persona</Label>
              <div className="mt-3">
                <div className="p-3 bg-secondary/30 rounded-lg mb-3">
                  <div className="flex items-center gap-2 mb-1">
                    {selectedPersona.icon}
                    <span className="font-medium text-sm">{selectedPersona.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{selectedPersona.description}</p>
                </div>

                <Dialog open={isPersonaDialogOpen} onOpenChange={setIsPersonaDialogOpen}>
                  <DialogTrigger asChild>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full bg-transparent">
                          <Settings className="w-4 h-4 mr-2" />
                          Configure Persona
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p>Change AI personality and behavior</p>
                      </TooltipContent>
                    </Tooltip>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>AI Persona Settings</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6">
                      <div>
                        <Label className="text-base font-semibold">Choose Persona</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                          {predefinedPersonas.map((persona) => (
                            <Card
                              key={persona.id}
                              className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                                selectedPersona.id === persona.id && !useCustomPrompt
                                  ? "ring-2 ring-primary bg-primary/5"
                                  : "hover:bg-secondary/50"
                              }`}
                              onClick={() => {
                                setSelectedPersona(persona)
                                setUseCustomPrompt(false)
                              }}
                            >
                              <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 p-2 rounded-lg bg-primary/10">{persona.icon}</div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold text-sm">{persona.name}</h3>
                                  <p className="text-xs text-muted-foreground mt-1">{persona.description}</p>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>

                      <div className="border-t pt-6">
                        <div className="flex items-center gap-2 mb-3">
                          <input
                            type="checkbox"
                            id="custom-prompt"
                            checked={useCustomPrompt}
                            onChange={(e) => setUseCustomPrompt(e.target.checked)}
                            className="rounded"
                          />
                          <Label htmlFor="custom-prompt" className="text-base font-semibold">
                            Use Custom System Prompt
                          </Label>
                        </div>
                        <Textarea
                          value={customSystemPrompt}
                          onChange={(e) => setCustomSystemPrompt(e.target.value)}
                          placeholder="Enter your custom system prompt here..."
                          className="min-h-[120px] font-mono text-sm"
                          disabled={!useCustomPrompt}
                        />
                      </div>

                      <div className="bg-secondary/30 p-4 rounded-lg">
                        <h4 className="font-semibold text-sm mb-2">Current System Prompt:</h4>
                        <p className="text-sm text-muted-foreground font-mono leading-relaxed">
                          {useCustomPrompt
                            ? customSystemPrompt || "No custom prompt set"
                            : selectedPersona.systemPrompt}
                        </p>
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsPersonaDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={() => setIsPersonaDialogOpen(false)}>Apply Settings</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Sidebar */}
        <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
          <SheetContent side="left" className="w-80 p-0">
            <div className="p-6 border-b border-border">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                AI Agent Hub
              </h1>
              <p className="text-sm text-muted-foreground mt-1">Multi-modal AI Assistant</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* AI Mode Selection */}
              <div>
                <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">AI Mode</Label>
                <div className="mt-3 space-y-2">
                  {[
                    { id: "chat", label: "Chat", icon: MessageSquare },
                    { id: "image", label: "Image Gen", icon: ImageIcon },
                    { id: "vision", label: "Vision", icon: Eye },
                    { id: "tts", label: "Text-to-Speech", icon: Volume2 },
                    { id: "embedding", label: "Embeddings", icon: Zap },
                  ].map(({ id, label, icon: Icon }) => (
                    <Button
                      key={id}
                      variant={aiMode === id ? "default" : "ghost"}
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => {
                        setAIMode(id as any)
                        setIsSidebarOpen(false)
                      }}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Provider Selection */}
              <div>
                <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Provider</Label>
                <div className="mt-3 space-y-2">
                  <Button
                    variant={provider === "lunos" ? "default" : "ghost"}
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => setProvider("lunos")}
                  >
                    <Cpu className="w-4 h-4 mr-2" />
                    Lunos API
                  </Button>
                  <Button
                    variant={provider === "unli" ? "default" : "ghost"}
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => setProvider("unli")}
                  >
                    <Globe className="w-4 h-4 mr-2" />
                    Unli.dev API
                  </Button>
                </div>
              </div>

              {/* Persona Configuration */}
              <div>
                <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Persona</Label>
                <div className="mt-3">
                  <div className="p-3 bg-secondary/30 rounded-lg mb-3">
                    <div className="flex items-center gap-2 mb-1">
                      {selectedPersona.icon}
                      <span className="font-medium text-sm">{selectedPersona.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{selectedPersona.description}</p>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full bg-transparent"
                    onClick={() => setIsPersonaDialogOpen(true)}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Configure Persona
                  </Button>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Main Content */}
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
                        setMessages([])
                        setImagePrompt(null)
                        setTtsText(null)
                        setEmbeddingText(null)
                        setVisionPrompt(null)
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
          <div className="flex-1 flex flex-col">
            {aiMode === "chat" && (
              <>
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4 max-w-4xl mx-auto">
                    {messages.length === 0 && (
                      <div className="text-center text-muted-foreground py-12">
                        <div className="flex items-center justify-center gap-2 mb-4">
                          {selectedPersona.icon}
                          <Bot className="w-12 h-12 opacity-50" />
                        </div>
                        <p className="font-semibold text-lg">
                          {useCustomPrompt ? "Custom AI Assistant" : selectedPersona.name} Ready
                        </p>
                        <p className="text-sm mt-2 max-w-md mx-auto">
                          {useCustomPrompt ? "Using your custom system prompt" : selectedPersona.description}
                        </p>
                      </div>
                    )}

                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`flex gap-3 max-w-[80%] ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                        >
                          <div className="flex-shrink-0">
                            {message.role === "user" ? (
                              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                                <User className="w-4 h-4 text-primary-foreground" />
                              </div>
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                                {selectedPersona.icon}
                              </div>
                            )}
                          </div>
                          <div
                            className={`rounded-lg p-4 ${
                              message.role === "user"
                                ? "bg-primary text-primary-foreground"
                                : "bg-secondary text-secondary-foreground"
                            }`}
                          >
                            <div className="whitespace-pre-wrap font-mono text-sm leading-relaxed">
                              {message.content}
                            </div>
                            {message.imageUrl && (
                              <img
                                src={message.imageUrl || "/placeholder.svg"}
                                alt="Generated"
                                className="mt-3 rounded-lg max-w-full h-auto"
                              />
                            )}
                            {message.audioUrl && (
                              <audio controls className="mt-3 w-full">
                                <source src={message.audioUrl} type="audio/mpeg" />
                              </audio>
                            )}
                            <div className="flex items-center gap-2 mt-3 text-xs opacity-70">
                              <span>{message.timestamp.toLocaleTimeString()}</span>
                              {message.provider && (
                                <Badge variant="outline" className="text-xs">
                                  {message.provider}
                                </Badge>
                              )}
                              {message.type && message.type !== "text" && (
                                <Badge variant="secondary" className="text-xs">
                                  {message.type}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {streamingMessage && (
                      <div className="flex gap-3 justify-start">
                        <div className="flex gap-3 max-w-[80%]">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                              {selectedPersona.icon}
                            </div>
                          </div>
                          <div className="rounded-lg p-4 bg-secondary text-secondary-foreground">
                            <div className="whitespace-pre-wrap font-mono text-sm leading-relaxed">
                              {streamingMessage}
                              <span className="animate-pulse">▋</span>
                            </div>
                            <div className="flex items-center gap-2 mt-3 text-xs opacity-70">
                              <Badge variant="outline" className="text-xs">
                                {provider}
                              </Badge>
                              <span>streaming...</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div ref={messagesEndRef} />
                </ScrollArea>

                {/* Chat Input */}
                <div className="p-4 border-t border-border">
                  <div className="flex gap-2 max-w-4xl mx-auto">
                    <Textarea
                      ref={textareaRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={`Chat with ${useCustomPrompt ? "Custom AI" : selectedPersona.name}...`}
                      className="min-h-[60px] resize-none font-mono"
                      disabled={isLoading}
                    />
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button onClick={sendMessage} disabled={!input.trim() || isLoading} size="lg" className="px-4">
                          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Send message (Enter)</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </>
            )}

            {aiMode === "image" && (
              <div className="flex-1 p-6">
                <div className="max-w-2xl mx-auto space-y-6">
                  <div>
                    <Label htmlFor="image-prompt" className="text-base font-semibold">
                      Image Prompt
                    </Label>
                    <Textarea
                      id="image-prompt"
                      value={imagePrompt}
                      onChange={(e) => setImagePrompt(e.target.value)}
                      placeholder="Describe the image you want to generate..."
                      className="mt-2 min-h-[120px]"
                      onKeyPress={handleKeyPress}
                    />
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={generateImage}
                        disabled={!imagePrompt.trim() || isLoading}
                        className="w-full"
                        size="lg"
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <ImageIcon className="w-4 h-4 mr-2" />
                        )}
                        Generate Image
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Generate image from text description</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            )}

            {aiMode === "vision" && (
              <div className="flex-1 p-6">
                <div className="max-w-2xl mx-auto space-y-6">
                  <div>
                    <Label htmlFor="image-upload" className="text-base font-semibold">
                      Upload Image
                    </Label>
                    <Input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      ref={fileInputRef}
                      className="mt-2"
                    />
                    {uploadedImage && (
                      <img
                        src={uploadedImage || "/placeholder.svg"}
                        alt="Uploaded"
                        className="mt-4 rounded-lg max-w-full h-64 object-cover mx-auto"
                      />
                    )}
                  </div>
                  <div>
                    <Label htmlFor="vision-prompt" className="text-base font-semibold">
                      What do you want to know about this image?
                    </Label>
                    <Textarea
                      id="vision-prompt"
                      value={visionPrompt}
                      onChange={(e) => setVisionPrompt(e.target.value)}
                      placeholder="Ask about the image..."
                      className="mt-2"
                      onKeyPress={handleKeyPress}
                    />
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={analyzeImage}
                        disabled={!uploadedImage || !visionPrompt.trim() || isLoading}
                        className="w-full"
                        size="lg"
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <Eye className="w-4 h-4 mr-2" />
                        )}
                        Analyze Image
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Analyze uploaded image with AI vision</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            )}

            {aiMode === "tts" && (
              <div className="flex-1 p-6">
                <div className="max-w-2xl mx-auto space-y-6">
                  <div>
                    <Label htmlFor="tts-text" className="text-base font-semibold">
                      Text to Speech
                    </Label>
                    <Textarea
                      id="tts-text"
                      value={ttsText}
                      onChange={(e) => setTtsText(e.target.value)}
                      placeholder="Enter text to convert to speech..."
                      className="mt-2 min-h-[120px]"
                      onKeyPress={handleKeyPress}
                    />
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={generateSpeech}
                        disabled={!ttsText.trim() || isLoading}
                        className="w-full"
                        size="lg"
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <Mic className="w-4 h-4 mr-2" />
                        )}
                        Generate Speech
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Convert text to natural speech audio</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            )}

            {aiMode === "embedding" && (
              <div className="flex-1 p-6">
                <div className="max-w-2xl mx-auto space-y-6">
                  <div>
                    <Label htmlFor="embedding-text" className="text-base font-semibold">
                      Text for Embedding
                    </Label>
                    <Textarea
                      id="embedding-text"
                      value={embeddingText}
                      onChange={(e) => setEmbeddingText(e.target.value)}
                      placeholder="Enter text to generate embeddings..."
                      className="mt-2 min-h-[120px]"
                      onKeyPress={handleKeyPress}
                    />
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={generateEmbedding}
                        disabled={!embeddingText.trim() || isLoading}
                        className="w-full"
                        size="lg"
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <Code2 className="w-4 h-4 mr-2" />
                        )}
                        Generate Embedding
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Generate vector embeddings for semantic search</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}

export { AIAgent }
