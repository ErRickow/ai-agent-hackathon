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
  user: { id: string; email: string } | null;
  onLoginClick: () => void;
  onLogoutClick: () => void;
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
  user,
  onLoginClick,
  onLogoutClick
}: AISidebarProps) {
  const handleSelectPersona = (persona: any) => {
    onSelectPersona(persona);
    setUseCustomPrompt(false);
  };

  const aiModes = [
    { id: "chat", label: "Chat", icon: MessageSquare },
    { id: "tts", label: "Text-to-Speech", icon: Volume2 },
    { id: "embedding", label: "Embeddings", icon: Zap },
  ];

  const SectionHeader = ({ children }: { children: React.ReactNode }) => (
    <Label className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wide">
      {children}
    </Label>
  );

  const PersonaCard = () => (
    <div className="p-2 sm:p-3 bg-secondary/30 rounded-lg mb-2 sm:mb-3">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0">
          {selectedPersona.icon}
        </div>
        <span className="font-medium text-xs sm:text-sm truncate">
          {selectedPersona.name}
        </span>
      </div>
      <p className="text-xs text-muted-foreground line-clamp-2">
        {selectedPersona.description}
      </p>
    </div>
  );

  const UserSection = () => (
    <div className="p-3 sm:p-4 border-t border-border">
      {user ? (
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-semibold truncate">
              {user.email}
            </p>
            <Button 
              variant="link" 
              size="sm" 
              className="p-0 h-auto text-xs" 
              onClick={onLogoutClick}
            >
              Logout
            </Button>
          </div>
        </div>
      ) : (
        <Button className="w-full text-xs sm:text-sm" onClick={onLoginClick}>
          Login
        </Button>
      )}
    </div>
  );

  const DesktopSidebar = () => (
    <div className="hidden lg:flex flex-col w-full lg:w-80 xl:w-96 border-r border-border bg-card transition-all duration-300 min-h-screen">
      {/* Header */}
      <div className="p-4 lg:p-6 border-b border-border">
        <h1 className="text-lg lg:text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          AI Agent Hackathon
        </h1>
        <p className="text-xs lg:text-sm text-muted-foreground mt-1">
          Multi-modal AI Assistant
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 lg:p-4 space-y-4 lg:space-y-6">
        {/* AI Mode Section */}
        <div>
          <SectionHeader>AI Mode</SectionHeader>
          <div className="mt-2 lg:mt-3 space-y-1 lg:space-y-2">
            {aiModes.map(({ id, label, icon: Icon }) => (
              <TooltipProvider key={id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={aiMode === id ? "default" : "ghost"}
                      size="sm"
                      className="w-full justify-start text-xs lg:text-sm h-8 lg:h-9"
                      onClick={() => setAIMode(id)}
                    >
                      <Icon className="w-3 h-3 lg:w-4 lg:h-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{label}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{label} functionality</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        </div>

        {/* Provider Section */}
        <div>
          <SectionHeader>Provider</SectionHeader>
          <div className="mt-2 lg:mt-3 space-y-1 lg:space-y-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={provider === "lunos" ? "default" : "ghost"}
                    size="sm"
                    className="w-full justify-start text-xs lg:text-sm h-8 lg:h-9"
                    onClick={() => setProvider("lunos")}
                  >
                    <img
                      src={`https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent("https://lunos.tech")}`}
                      alt="Lunos.tech Favicon"
                      width={16}
                      height={16}
                      className="mr-2 rounded-full flex-shrink-0 w-3 h-3 lg:w-4 lg:h-4"
                    />
                    <span className="truncate">Lunos API</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Use Lunos API for AI operations</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={provider === "unli" ? "default" : "ghost"}
                    size="sm"
                    className="w-full justify-start text-xs lg:text-sm h-8 lg:h-9"
                    onClick={() => setProvider("unli")}
                  >
                    <img
                      src={`https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent("https://unli.dev")}`}
                      alt="Unli.dev Favicon"
                      width={16}
                      height={16}
                      className="mr-2 rounded-full flex-shrink-0 w-3 h-3 lg:w-4 lg:h-4"
                    />
                    <span className="truncate">Unli.dev API</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Use Unli.dev API for AI operations</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Model Section */}
        <div>
          <SectionHeader>Model</SectionHeader>
          <div className="mt-2 lg:mt-3">
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger className="text-xs lg:text-sm h-8 lg:h-9">
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                {models.map((model) => (
                  <SelectItem key={model.id} value={model.id} className="text-xs lg:text-sm">
                    {model.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Persona Section */}
        <div>
          <SectionHeader>Persona</SectionHeader>
          <div className="mt-2 lg:mt-3">
            <PersonaCard />
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

      {/* User Section */}
      <UserSection />
    </div>
  );

  const MobileSidebar = () => (
    <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
      <SheetContent side="left" className="w-full sm:w-80 p-0 overflow-y-auto">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-border">
          <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Hackathon AI
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Multi-modal AI Assistant
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 sm:space-y-6">
          {/* AI Mode Section */}
          <div>
            <SectionHeader>AI Mode</SectionHeader>
            <div className="mt-2 sm:mt-3 space-y-1 sm:space-y-2">
              {aiModes.map(({ id, label, icon: Icon }) => (
                <Button
                  key={id}
                  variant={aiMode === id ? "default" : "ghost"}
                  size="sm"
                  className="w-full justify-start text-xs sm:text-sm h-8 sm:h-9"
                  onClick={() => {
                    setAIMode(id as any);
                    setIsSidebarOpen(false);
                  }}
                >
                  <Icon className="w-3 h-3 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
                  <span className="truncate">{label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Provider Section */}
          <div>
            <SectionHeader>Provider</SectionHeader>
            <div className="mt-2 sm:mt-3 space-y-1 sm:space-y-2">
              <Button
                variant={provider === "lunos" ? "default" : "ghost"}
                size="sm"
                className="w-full justify-start text-xs sm:text-sm h-8 sm:h-9"
                onClick={() => {
                  setProvider("lunos");
                  setIsSidebarOpen(false);
                }}
              >
                <img
                  src={`https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent("https://lunos.tech")}`}
                  alt="Lunos.tech Favicon"
                  width={16}
                  height={16}
                  className="mr-2 rounded-full flex-shrink-0 w-3 h-3 sm:w-4 sm:h-4"
                />
                <span className="truncate">Lunos API</span>
              </Button>
              
              <Button
                variant={provider === "unli" ? "default" : "ghost"}
                size="sm"
                className="w-full justify-start text-xs sm:text-sm h-8 sm:h-9"
                onClick={() => {
                  setProvider("unli");
                  setIsSidebarOpen(false);
                }}
              >
                <img
                  src={`https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent("https://unli.dev")}`}
                  alt="Unli.dev Favicon"
                  width={16}
                  height={16}
                  className="mr-2 rounded-full flex-shrink-0 w-3 h-3 sm:w-4 sm:h-4"
                />
                <span className="truncate">Unli.dev API</span>
              </Button>
            </div>
          </div>

          {/* Model Section */}
          <div>
            <SectionHeader>Model</SectionHeader>
            <div className="mt-2 sm:mt-3">
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger className="text-xs sm:text-sm h-8 sm:h-9">
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  {models.map((model) => (
                    <SelectItem key={model.id} value={model.id} className="text-xs sm:text-sm">
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Persona Section */}
          <div>
            <SectionHeader>Persona</SectionHeader>
            <div className="mt-2 sm:mt-3">
              <PersonaCard />
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

        {/* User Section */}
        <UserSection />
      </SheetContent>
    </Sheet>
  );

  return (
    <>
      <DesktopSidebar />
      <MobileSidebar />
    </>
  );
}