"use client";

import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
  MessageAvatar,
} from "./message";
import { Bot, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import * as React from "react";

type MessageAssistantProps = {
  children: string;
  selectedPersona: {
    id: string;
    name: string;
    icon: React.ReactNode;
  };
};

export function MessageAssistant({ children, selectedPersona }: MessageAssistantProps) {
  const [copied, setCopied] = React.useState(false);
  
  const copyToClipboard = () => {
    // Implementasi copy to clipboard
    navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <Message className={cn("group flex w-full max-w-3xl flex-1 items-start gap-4 px-6 pb-2")}>
      <div className="flex flex-row items-start gap-3 justify-start">
        <MessageAvatar
          fallback={selectedPersona.icon || <Bot />}
          alt={selectedPersona.name || "Assistant"}
        />
        <MessageContent
          className="bg-secondary prose dark:prose-invert relative max-w-[70%] rounded-3xl px-5 py-2.5"
          markdown={true}
        >
          {children}
        </MessageContent>
      </div>
      <MessageActions className="flex gap-0 opacity-0 transition-opacity duration-0 group-hover:opacity-100 justify-start">
        <MessageAction tooltip={copied ? "Copied!" : "Copy text"}>
          <button
            className="hover:bg-accent/60 text-muted-foreground hover:text-foreground flex size-7.5 items-center justify-center rounded-full bg-transparent transition"
            aria-label="Copy text"
            onClick={copyToClipboard}
            type="button"
          >
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          </button>
        </MessageAction>
      </MessageActions>
    </Message>
  );
}