"use client";

import type React from "react";
import React from "react";
import { Send, Bot, User, Loader2, Copy, Paperclip, X, Trash2, RotateCcw, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CodeBlock, CodeBlockCode, CodeBlockGroup } from "@/components/code-block";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { useAutoScroll } from "@/lib/hooks/use-auto-scroll";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ImageIcon } from "lucide-react";
import { ButtonCopy } from "./button-copy";
import { TextEffect } from "./core/text-effect";
import { TextShimmer } from '@/components/core/text-shimmer';

const MAX_INPUT_LENGTH = 2000;

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

interface Persona {
  id?: string;
  name: string;
  description: string;
  systemPrompt: string;
  icon: React.ReactNode;
  color: string;
}

interface ChatInterfaceProps {
  messages: Message[];
  streamingMessage: string;
  selectedPersona: Persona;
  provider: "lunos" | "unli";
  isLoading: boolean;
  input: string;
  setInput: (value: string) => void;
  sendMessage: () => void;
  handleKeyPress: (e: React.KeyboardEvent) => void;
  isImageGenMode: boolean;
  onImageGenToggle: (enabled: boolean) => void;
  uploadedImage: string | null;
  setUploadedImage: (value: string | null) => void;
  // Fungsi baru untuk delete dan reset
  onDeleteMessage: (messageId: string) => void;
  onResetConversation: () => void;
}

const markdownComponents = {
  code({ node, inline, className, children, ...props }: any) {
    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : 'text';
    const codeString = String(children).replace(/\n$/, '');
    
    if (inline) {
      return (
        <code 
          className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono break-words"
          {...props}
        >
          {children}
        </code>
      );
    }
    
    return (
      <div className="my-4 w-full overflow-hidden">
        <CodeBlock className="w-full">
          <CodeBlockGroup className="px-4 py-2 border-b border-border flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{language}</span>
            <ButtonCopy code={codeString} />
          </CodeBlockGroup>
          <div className="overflow-x-auto">
            <CodeBlockCode 
              code={codeString} 
              language={language}
            />
          </div>
        </CodeBlock>
      </div>
    );
  },
  pre({ children }: any) {
    return <>{children}</>;
  },
  a({ href, children, ...props }: any) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary hover:underline break-words"
        {...props}
      >
        {children}
      </a>
    );
  },
  p({ children, ...props }: any) {
    return (
      <p className="break-words overflow-wrap-anywhere" {...props}>
        {children}
      </p>
    );
  }
};

const BotAvatar = ({ persona, provider }: { persona: Persona; provider: "lunos" | "unli" }) => {
  if (persona.id === "assistant") {
    const faviconUrl = provider === "lunos" ?
      "https://www.google.com/s2/favicons?sz=64&domain_url=https://lunos.tech" :
      "https://www.google.com/s2/favicons?sz=64&domain_url=https://unli.dev";
    return <img src={faviconUrl} alt={`${provider} icon`} className="w-4 h-4 rounded-full" />;
  }
  
  return <>{persona.icon}</>;
};

export default function ChatInterface({
  messages,
  streamingMessage,
  selectedPersona,
  provider,
  isLoading,
  input,
  setInput,
  sendMessage,
  handleKeyPress,
  isImageGenMode,
  onImageGenToggle,
  uploadedImage,
  setUploadedImage,
  onDeleteMessage,
  onResetConversation,
}: ChatInterfaceProps) {
  const messagesContainerRef = useAutoScroll([messages, streamingMessage]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  
  const getContrastingTextColor = (hexColor: string) => {
    if (!hexColor) return '#FFFFFF';
    const r = parseInt(hexColor.substr(1, 2), 16);
    const g = parseInt(hexColor.substr(3, 2), 16);
    const b = parseInt(hexColor.substr(5, 2), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#000000' : '#FFFFFF';
  };
  
  const userTextColor = getContrastingTextColor(selectedPersona.color);
  
  // Function to get loading text based on mode
  const getLoadingText = () => {
    return isImageGenMode ? "Membuat gambar..." : "Berpikir...";
  };
  
  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* Header dengan tombol reset */}
      {messages.length > 0 && (
        <div className="flex justify-between items-center p-2 sm:p-4 border-b border-border bg-card/50 backdrop-blur-sm">
          <div className="text-sm text-muted-foreground">
            {messages.length} pesan
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                className="gap-2 text-xs sm:text-sm"
              >
                <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4" />
                Reset Chat
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset Percakapan?</AlertDialogTitle>
                <AlertDialogDescription>
                  Tindakan ini akan menghapus semua pesan dalam percakapan ini. Tindakan ini tidak dapat dibatalkan.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={onResetConversation}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Ya, Reset
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      {/* Messages Area */}
      <div 
        ref={messagesContainerRef} 
        className="flex-1 w-full overflow-y-auto p-4 space-y-6"
        style={{ scrollBehavior: 'smooth' }}
      >
        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 px-4">
            <div 
              className="w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center"
              style={{ backgroundColor: selectedPersona.color, color: userTextColor }}
            >
              <BotAvatar persona={selectedPersona} provider={provider} />
            </div>
            <div className="space-y-2 max-w-md">
              <h3 className="text-lg sm:text-xl font-semibold">Mulai percakapan dengan {selectedPersona.name}</h3>
              <TextShimmer duration={1} className="text-muted-foreground text-sm sm:text-base">
                {selectedPersona.description}
              </TextShimmer>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`group flex gap-2 sm:gap-4 items-start w-full ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            {/* AVATAR */}
            <div
              className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1`}
              style={{
                backgroundColor: message.role === 'user' ? selectedPersona.color : 'var(--muted)',
                color: message.role === 'user' ? userTextColor : 'var(--muted-foreground)',
              }}
            >
              {message.role === "user" ? (
                <User className="w-3 h-3 sm:w-4 sm:h-4" />
              ) : (
                <BotAvatar persona={selectedPersona} provider={message.provider || provider} />
              )}
            </div>

            {/* MESSAGE CONTENT */}
            <div className={`flex-1 space-y-1 min-w-0 max-w-full overflow-hidden ${message.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
              <div className={`flex items-center gap-2 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`font-semibold text-xs sm:text-sm ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                  {message.role === "user" ? "You" : selectedPersona.name}
                </div>
                
                {/* Dropdown menu untuk delete message */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 sm:h-5 sm:w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreVertical className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align={message.role === 'user' ? 'end' : 'start'}>
                    <DropdownMenuItem
                      onClick={() => navigator.clipboard.writeText(message.content)}
                      className="gap-2"
                    >
                      <Copy className="h-3 w-3" />
                      Copy
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDeleteMessage(message.id)}
                      className="gap-2 text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <div className={`break-words overflow-hidden w-full ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                {message.type === "image" && message.imageUrl ? (
                  <div className="space-y-2 pt-2 w-full">
                    <img
                      src={message.imageUrl}
                      alt="Generated"
                      className={`rounded-lg max-w-full w-full sm:max-w-xs lg:max-w-sm h-auto ${message.role === 'user' ? 'ml-auto' : 'mr-auto'}`}
                    />
                    <p className="text-xs sm:text-sm break-words">{message.content}</p>
                  </div>
                ) : message.type === "audio" && message.audioUrl ? (
                  <div className="space-y-2 pt-2 w-full">
                    <audio controls className={`w-full max-w-full sm:max-w-sm ${message.role === 'user' ? 'ml-auto' : 'mr-auto'}`}>
                      <source src={message.audioUrl} type="audio/mpeg" />
                    </audio>
                    <p className="text-xs sm:text-sm break-words">{message.content}</p>
                  </div>
                ) : (
                  <div className={`prose prose-xs sm:prose-sm max-w-full w-full dark:prose-invert prose-pre:max-w-full prose-pre:overflow-x-auto prose-code:break-words ${message.role === 'assistant' ? 'text-left' : ''} ${message.role === 'user' ? 'user-message' : ''}`}>
                    <ReactMarkdown
                      components={markdownComponents}
                      remarkPlugins={[remarkGfm, remarkBreaks, remarkMath]}
                      rehypePlugins={[rehypeKatex]}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
              <div className={`flex items-center gap-2 text-xs text-muted-foreground pt-1 flex-wrap ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <span>{formatTimestamp(message.timestamp)}</span>
                {message.provider && (
                  <a 
                    href={message.provider === "lunos" ? "https://lunos.tech/?utm_source=ai-agent-hackathon" : "https://unli.dev/?utm_source=ai-agent-hackathon"} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <Badge variant="outline" className="text-xs cursor-pointer hover:ring-2 hover:ring-primary/50">
                      {message.provider === "lunos" ? "Lunos" : "Unli.dev"}
                    </Badge>
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Streaming Message */}
        {streamingMessage && (
          <div className="flex gap-2 sm:gap-4 items-start w-full">
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-1">
              <BotAvatar persona={selectedPersona} provider={provider} />
            </div>
            <div className="flex-1 space-y-1 min-w-0 max-w-full overflow-hidden flex flex-col items-start">
              <div className="font-semibold text-xs sm:text-sm text-left w-full">
                {selectedPersona.name}
              </div>
              <div className="break-words overflow-hidden w-full text-left">
                <div className="prose prose-xs sm:prose-sm max-w-full w-full dark:prose-invert prose-pre:max-w-full prose-pre:overflow-x-auto text-left">
                  <ReactMarkdown
                    components={markdownComponents}
                    remarkPlugins={[remarkGfm, remarkBreaks, remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                  >
                    {streamingMessage}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading Indicator */}
        {isLoading && !streamingMessage && (
          <div className="flex gap-2 sm:gap-4 items-start w-full">
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-1">
              <BotAvatar persona={selectedPersona} provider={provider} />
            </div>
            <div className="flex-1 space-y-2 min-w-0 flex flex-col items-start">
              <div className="font-semibold text-xs sm:text-sm text-left w-full">
                {selectedPersona.name}
              </div>
              <div className="flex items-center gap-2">
                <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                <TextShimmer duration={1} className="text-xs sm:text-sm text-muted-foreground">
                  {getLoadingText()}
                </TextShimmer>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-border bg-card/50 backdrop-blur-sm p-2 sm:p-4 w-full flex-shrink-0">
        <div className="relative bg-background rounded-lg border max-w-full">
          {/* Image Preview Area */}
          {uploadedImage && (
            <div className="p-2 border-b">
              <div className="relative w-16 h-16 sm:w-20 sm:h-20">
                <img
                  src={uploadedImage}
                  alt="Preview"
                  className="w-full h-full object-cover rounded"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-muted hover:bg-destructive text-destructive-foreground"
                  onClick={() => setUploadedImage(null)}
                >
                  <X className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </div>
            </div>
          )}
          
          <div className="flex items-center space-x-2 p-2 sm:p-3 pb-0">
            <Switch
              id="image-generation-mode"
              checked={isImageGenMode}
              onCheckedChange={onImageGenToggle}
            />
            <Label
              htmlFor="image-generation-mode"
              className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground"
            >
              <ImageIcon className="h-3 w-3 sm:h-4 sm:h-4" />
              <span className="hidden sm:inline">Imagen</span>
            </Label>
          </div>
          
          {/* Textarea and Buttons */}
          <div className="flex items-end gap-1 sm:gap-2 p-2">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleImageUpload}
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 h-8 w-8 sm:h-10 sm:w-10"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Attach Image</p>
              </TooltipContent>
            </Tooltip>
            
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              maxLength={MAX_INPUT_LENGTH}
              onPaste={(e) => {
                e.preventDefault();
                const pastedText = e.clipboardData.getData("text");
                const currentText = e.currentTarget.value;
                const remainingSpace = MAX_INPUT_LENGTH - currentText.length;
                if (remainingSpace > 0) {
                  const textToInsert = pastedText.substring(0, remainingSpace);
                  setInput(currentText + textToInsert);
                }
              }}
              placeholder={
                uploadedImage
                  ? "Tanyakan tentang gambarnya..."
                  : isImageGenMode
                    ? `Deskripsikan gambarnya...`
                    : `Tanyakan sesuatu...`
              }
              className="flex-1 min-h-[2rem] sm:min-h-[2.5rem] max-h-24 sm:max-h-32 resize-none border-0 shadow-none focus-visible:ring-0 px-2 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm"
              disabled={isLoading}
            />
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={sendMessage}
                  disabled={isLoading || (!input.trim() && !uploadedImage)}
                  size="icon"
                  className="shrink-0 h-8 w-8 sm:h-10 sm:w-10"
                >
                  {isLoading ? (
                    <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                  ) : (
                    <Send className="w-3 h-3 sm:w-4 sm:h-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Kirim pesannya</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  );
}