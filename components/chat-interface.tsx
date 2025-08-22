"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Send, Loader2, Bot } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  ChatContainerRoot,
  ChatContainerContent,
  ChatContainerScrollAnchor,
} from "./chat-container";
import {
  Message as MessageContainer,
  MessageAvatar,
  MessageContent
} from "./prompt-kit/message";
import { MessageUser } from "./prompt-kit/message-user";
import { MessageAssistant } from "./prompt-kit/message-assistant";
import { cn } from "@/lib/utils";
import { PromptInput, PromptInputTextarea, PromptInputActions, PromptInputAction } from "./prompt-kit/prompt-input";

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
  
  return (
    <>
      <ChatContainerRoot className="flex-1 p-4 w-full h-auto max-h-[1000px] lg:max-h-full">
        <ChatContainerContent className="space-y-4 max-w-4xl mx-auto">
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
            <React.Fragment key={message.id}>
              {message.role === "user" ? (
                <MessageUser id={message.id} children={message.content} />
              ) : (
                <MessageAssistant children={message.content} selectedPersona={selectedPersona} />
              )}
            </React.Fragment>
          ))}
          {streamingMessage && (
            <MessageContainer className={cn("group flex w-full max-w-3xl flex-1 items-start gap-4 px-6 pb-2")}>
              <div className="flex flex-row items-start gap-3 justify-start">
                <MessageAvatar
                  fallback={selectedPersona.icon || <Bot />}
                  alt={selectedPersona.name || "Assistant"}
                />
                <MessageContent
                  className="bg-secondary prose dark:prose-invert relative max-w-[70%] rounded-3xl px-5 py-2.5"
                  markdown={true}
                >
                  {streamingMessage}
                </MessageContent>
              </div>
            </MessageContainer>
          )}
        </ChatContainerContent>
        <ChatContainerScrollAnchor ref={messagesEndRef} />
      </ChatContainerRoot>
      <div className="p-4 border-t border-border">
        <div className="flex gap-2 max-w-4xl mx-auto">
          <PromptInput
            isLoading={isLoading}
            value={input}
            onValueChange={setInput}
            onSubmit={sendMessage}
          >
            <PromptInputActions>
              <PromptInputTextarea
                onKeyDown={handleKeyPress}
                placeholder={`ask ${selectedPersona.name}...`}
              />
              <PromptInputAction tooltip="Kirim Pesan">
                <Button variant="ghost" className="h-10 w-10">
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </PromptInputAction>
            </PromptInputActions>
          </PromptInput>
        </div>
      </div>
    </>
  );
}