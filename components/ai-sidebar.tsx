import * as React from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Zap,
  ImageIcon,
  Eye,
  Mic,
  Code2,
  Settings,
  Briefcase,
  Heart,
  Gamepad2,
  GraduationCap,
  Palette,
  Menu,
  MessageSquare,
  Volume2,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import PersonaSettingsDialog from "./persona-settings-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Model {
  id: string;
  name: string;
}

interface AISidebarProps {
  aiMode: string;
  setAIMode: (mode: any) => void;
  provider: string;
  setProvider: (provider: string) => void;
  selectedPersona: any;
  predefinedPersonas: any[];
  customSystemPrompt: string;
  setCustomSystemPrompt: (prompt: string) => void;
  useCustomPrompt: boolean;
  setUseCustomPrompt: (use: boolean) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  onSelectPersona: (persona: any) => void;
  models: Model[];
  selectedModel: string;
  setSelectedModel: (modelId: string) => void;
}

export default function AISidebar({
  aiMode,
  setAIMode,
  provider,
  setProvider,
  selectedPersona,
  predefinedPersonas,
  customSystemPrompt,
  setCustomSystemPrompt,
  useCustomPrompt,
  setUseCustomPrompt,
  isSidebarOpen,
  setIsSidebarOpen,
  onSelectPersona,
  models,
  selectedModel,
  setSelectedModel,
}: AISidebarProps) {
  const handleSelectPersona = (persona: any) => {
    onSelectPersona(persona);
    setUseCustomPrompt(false);
  };
  
  return (
    <>
      <div className={`hidden lg:flex flex-col w-80 border-r border-border bg-card transition-all duration-300`}>
        <div className="p-6 border-b border-border">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            AI Agent Hackathon
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Multi-modal AI Assistant</p>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <div>
            <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">AI Mode</Label>
            <div className="mt-3 space-y-2">
              {[
                { id: "chat", label: "Chat", icon: MessageSquare },
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
                      onClick={() => setAIMode(id)}
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
                    <img
                      src={`https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent("https://lunos.tech")}`}
                      alt="Lunos.tech Favicon"
                      width={16}
                      height={16}
                      className="mr-2 rounded-full"
                    />
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
                    <img
                      src={`https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent("https://unli.dev")}`}
                      alt="Unli.dev Favicon"
                      width={16}
                      height={16}
                      className="mr-2 rounded-full"
                    />
                    Unli.dev API
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Use Unli.dev API for AI operations</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
          <div>
            <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Model</Label>
            <div className="mt-3">
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  {models.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Persona</Label>
            <div className="mt-3">
              <div className="p-3 bg-secondary/30 rounded-lg mb-3">
                <div className="flex items-center gap-2 mb-1">
                  {selectedPersona.icon}
                  <span className="font-medium text-sm">{selectedPersona.name}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{selectedPersona.description}</p>
              </div>
              <PersonaSettingsDialog
                selectedPersona={selectedPersona}
                predefinedPersonas={predefinedPersonas}
                customSystemPrompt={customSystemPrompt}
                setCustomSystemPrompt={setCustomSystemPrompt}
                useCustomPrompt={useCustomPrompt}
                setUseCustomPrompt={setUseCustomPrompt}
                onSelectPersona={handleSelectPersona}
              />
            </div>
          </div>
        </div>
      </div>
      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetContent side="left" className="w-80 p-0">
          <div className="p-6 border-b border-border">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              AI Agent 
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Multi-modal AI Assistant</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
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
                      setAIMode(id as any);
                      setIsSidebarOpen(false);
                    }}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {label}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Provider</Label>
              <div className="mt-3 space-y-2">
                <Button
                  variant={provider === "lunos" ? "default" : "ghost"}
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setProvider("lunos")}
                >
                    <img
                      src={`https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent("https://lunos.tech")}`}
                      alt="Lunos.tech Favicon"
                      width={16}
                      height={16}
                      className="mr-2 rounded-full"
                    />
                  Lunos API
                </Button>
                <Button
                  variant={provider === "unli" ? "default" : "ghost"}
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setProvider("unli")}
                >
                    <img
                      src={`https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent("https://unli.dev")}`}
                      alt="Unli.dev Favicon"
                      width={16}
                      height={16}
                      className="mr-2 rounded-full"
                    />
                  Unli.dev API
                </Button>
              </div>
            </div>
            {/* Added the missing Model section */}
            <div>
              <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Model</Label>
              <div className="mt-3">
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a model" />
                  </SelectTrigger>
                  <SelectContent>
                    {models.map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        {model.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Persona</Label>
              <div className="mt-3">
                <div className="p-3 bg-secondary/30 rounded-lg mb-3">
                  <div className="flex items-center gap-2 mb-1">
                    {selectedPersona.icon}
                    <span className="font-medium text-sm">{selectedPersona.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{selectedPersona.description}</p>
                </div>
                <PersonaSettingsDialog
                  selectedPersona={selectedPersona}
                  predefinedPersonas={predefinedPersonas}
                  customSystemPrompt={customSystemPrompt}
                  setCustomSystemPrompt={setCustomSystemPrompt}
                  useCustomPrompt={useCustomPrompt}
                  setUseCustomPrompt={setUseCustomPrompt}
                  onSelectPersona={handleSelectPersona}
                />
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}