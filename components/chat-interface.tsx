import * as React from "react";
import { ScrollShadow } from "@heroui/react";
import { Textarea } from "@heroui/react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Send, Loader2, Bot, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import 'katex/dist/katex.min.css';

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

interface ChatInterfaceProps {
  messages: Message[];
  streamingMessage: string;
  selectedPersona: {
    id: string;
    name: string;
    icon: React.ReactNode;
    systemPrompt: string;
    description: string;
  };
  provider: "lunos" | "unli";
  isLoading: boolean;
  input: string;
  setInput: (input: string) => void;
  sendMessage: () => void;
  handleKeyPress: (e: React.KeyboardEvent) => void;
}

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
  const messagesEndRef = React.useRef < HTMLDivElement > (null);
  const textareaRef = React.useRef < HTMLTextAreaElement > (null);
  
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingMessage]);
  
  return (
    <>
      <ScrollShadow className="flex-1 p-4 w-full h-auto max-h-[1000px] lg:max-h-full">
        <div className="space-y-4 max-w-4xl mx-auto">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground py-12">
              <div className="flex items-center justify-center gap-2 mb-4">
                {selectedPersona.icon}
                <Bot className="w-12 h-12 opacity-50" />
              </div>
              <p className="font-semibold text-lg">AI Assistant Ready</p>
              <p className="text-sm mt-2 max-w-md mx-auto">{selectedPersona.description}</p>
            </div>
          )}
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`flex gap-3 max-w-[80%] ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
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
                    message.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  <div className="prose dark:prose-invert">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm, remarkMath]}
                      rehypePlugins={[rehypeKatex]}
                      components={{
                        code(props) {
                          const { children, className, node, ...rest } = props;
                          const match = /language-(\w+)/.exec(className || '');
                          return match ? (
                            <SyntaxHighlighter
                              {...rest}
                              PreTag="div"
                              language={match[1]}
                              style={vscDarkPlus}
                            >
                              {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                          ) : (
                            <code {...rest} className={className}>
                              {children}
                            </code>
                          );
                        },
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
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
                  <div className="prose dark:prose-invert">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm, remarkMath]}
                      rehypePlugins={[rehypeKatex]}
                      components={{
                        code(props) {
                          const { children, className, node, ...rest } = props;
                          const match = /language-(\w+)/.exec(className || '');
                          return match ? (
                            <SyntaxHighlighter
                              {...rest}
                              PreTag="div"
                              language={match[1]}
                              style={vscDarkPlus}
                            >
                              {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                          ) : (
                            <code {...rest} className={className}>
                              {children}
                            </code>
                          );
                        },
                      }}
                    >
                      {streamingMessage}
                    </ReactMarkdown>
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
      </ScrollShadow>
      <div className="p-4 border-t border-border">
        <div className="flex gap-2 max-w-4xl mx-auto">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`ask ${selectedPersona.name}...`}
            className="min-h-[60px] resize-none font-mono"
            isDisabled={isLoading}
          />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={sendMessage} disabled={!input.trim() || isLoading} size="lg" className="px-4">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Kirim Pesan</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </>
  );
}