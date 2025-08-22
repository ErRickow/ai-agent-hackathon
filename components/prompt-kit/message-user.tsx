"use client";

import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
  MessageAvatar,
} from "./message";
import { cn } from "@/lib/utils";
import { Copy, Trash, Check, User } from "lucide-react";
import * as React from "react";

type MessageUserProps = {
  id: string;
  children: string;
};

export function MessageUser({ id, children }: MessageUserProps) {
  const [copied, setCopied] = React.useState(false);
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <Message className={cn("group flex w-full max-w-3xl flex-col items-end gap-0.5 px-6 pb-2")}>
      <div className="flex flex-row items-start gap-3 justify-end">
        <MessageContent
          className="bg-accent prose dark:prose-invert relative max-w-[70%] rounded-3xl px-5 py-2.5"
          markdown={true}
        >
          {children}
        </MessageContent>
        <MessageAvatar
          src="/placeholder-user.jpg"
          alt="User Avatar"
          fallback={<User className="w-4 h-4 text-primary-foreground" />}
          className="bg-primary text-primary-foreground"
        />
      </div>
      <MessageActions className="flex gap-0 opacity-0 transition-opacity duration-0 group-hover:opacity-100 justify-end">
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
        <MessageAction tooltip="Delete">
          <button
            className="hover:bg-accent/60 text-muted-foreground hover:text-foreground flex size-7.5 items-center justify-center rounded-full bg-transparent transition"
            aria-label="Delete"
            type="button"
          >
            <Trash className="size-4" />
          </button>
        </MessageAction>
      </MessageActions>
    </Message>
  );
}