"use client";

import type React from "react";
import { useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CodeBlock, CodeBlockCode, CodeBlockGroup } from "@/components/code-block";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  provider ? : "lunos" | "unli";
  type ? : "text" | "image" | "audio" | "embedding";
  imageUrl ? : string;
  audioUrl ? : string;
}

interface Persona {
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
}

// Custom components untuk ReactMarkdown dengan CodeBlock baru
const markdownComponents = {
  code({ node, inline, className, children, ...props }: any) {
    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : 'text';
    const codeString = String(children).replace(/\n$/, '');
    
    if (inline) {
      return (
        <code 
          className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono"
          {...props}
        >
          {children}
        </code>
      );
    }
    
    return (
      <CodeBlock className="my-4">
        <CodeBlockGroup className="px-4 py-2 border-b border-border">
          <span className="text-sm text-muted-foreground">{language}</span>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigator.clipboard.writeText(codeString)}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </CodeBlockGroup>
        <CodeBlockCode 
          code={codeString} 
          language={language}
        />
      </CodeBlock>
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
        className="text-primary hover:underline"
        {...props}
      >
        {children}
      </a>
    );
  }
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
}: ChatInterfaceProps) {
  const messagesEndRef = useRef < HTMLDivElement > (null);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingMessage]);
  
  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  
  return (
    <>
      {/* Messages Area */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              {selectedPersona.icon}
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">Mulai percakapan dengan {selectedPersona.name}</h3>
              <p className="text-muted-foreground max-w-md">
                {selectedPersona.description}
              </p>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${
              message.role === "user" ? "flex-row-reverse" : "flex-row"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.role === "user" 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-muted"
              }`}
            >
              {message.role === "user" ? (
                <User className="w-4 h-4" />
              ) : (
                <Bot className="w-4 h-4" />
              )}
            </div>
            <div
              className={`flex-1 space-y-2 ${
                message.role === "user" ? "flex flex-col items-end" : ""
              }`}
            >
              <div
                className={`rounded-lg p-3 max-w-[80%] ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground ml-auto"
                    : "bg-muted"
                }`}
              >
                {message.type === "image" && message.imageUrl ? (
                  <div className="space-y-2">
                    <img
                      src={message.imageUrl}
                      alt="Generated"
                      className="rounded-lg max-w-full h-auto"
                    />
                    <p className="text-sm">{message.content}</p>
                  </div>
                ) : message.type === "audio" && message.audioUrl ? (
                  <div className="space-y-2">
                    <audio controls className="w-full">
                      <source src={message.audioUrl} type="audio/mpeg" />
                    </audio>
                    <p className="text-sm">{message.content}</p>
                  </div>
                ) : (
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown
                      components={markdownComponents}
                      remarkPlugins={[remarkGfm, remarkBreaks]}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{formatTimestamp(message.timestamp)}</span>
                {message.provider && (
                  <Badge variant="outline" className="text-xs">
                    {message.provider === "lunos" ? "Lunos" : "Unli.dev"}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Streaming Message */}
        {streamingMessage && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="bg-muted rounded-lg p-3 max-w-[80%]">
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <ReactMarkdown
                    components={markdownComponents}
                    remarkPlugins={[remarkGfm, remarkBreaks]}
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
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="bg-muted rounded-lg p-3 max-w-[80%]">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Mengetik...</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-border bg-card/50 backdrop-blur-sm p-4">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Ketik pesan Anda..."
            className="flex-1 min-h-[44px] max-h-32 resize-none"
            disabled={isLoading}
          />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                size="icon"
                className="shrink-0"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Kirim pesan</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </>
  );
}