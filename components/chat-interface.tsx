"use client";

import type React from "react";
import { Send, Bot, User, Loader2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CodeBlock, CodeBlockCode, CodeBlockGroup } from "@/components/code-block";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import { useAutoScroll } from "@/lib/hooks/use-auto-scroll";

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
        className="text-primary hover:underline break-all"
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
  const messagesContainerRef = useAutoScroll([messages, streamingMessage]);
  
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
  
  return (
    <>
      {/* Messages Area */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ backgroundColor: selectedPersona.color, color: userTextColor }}
              >
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
            // KEMBALIKAN LOGIKA FLEX DIRECTION
            className={`flex gap-4 items-start ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            {/* AVATAR */}
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1`}
              style={{
                backgroundColor: message.role === 'user' ? selectedPersona.color : 'var(--muted)',
                color: message.role === 'user' ? userTextColor : 'var(--muted-foreground)',
              }}
            >
              {message.role === "user" ? (
                <User className="w-4 h-4" />
              ) : (
                <Bot className="w-4 h-4" />
              )}
            </div>

            {/* MESSAGE CONTENT */}
            <div className={`flex-1 space-y-1 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
              <div className="font-semibold text-sm">
                {message.role === "user" ? "You" : selectedPersona.name}
              </div>
              <div className={`w-full break-words`}>
                {message.type === "image" && message.imageUrl ? (
                  <div className="space-y-2 pt-2">
                    <img
                      src={message.imageUrl}
                      alt="Generated"
                      className={`rounded-lg max-w-sm h-auto ${message.role === 'user' ? 'ml-auto' : 'mr-auto'}`}
                    />
                    <p className="text-sm">{message.content}</p>
                  </div>
                ) : message.type === "audio" && message.audioUrl ? (
                  <div className="space-y-2 pt-2">
                    <audio controls className={`w-full max-w-sm ${message.role === 'user' ? 'ml-auto' : 'mr-auto'}`}>
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
              <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
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

        {/* ... (Streaming dan Loading Indicator tidak perlu diubah, mereka selalu di kiri) */}

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