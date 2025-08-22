"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
import * as React from "react";
import { Markdown } from "../markdown";

export type MessageProps = {
  children: React.ReactNode;
  className ? : string;
} & React.HTMLProps < HTMLDivElement > ;

const Message = ({ children, className, ...props }: MessageProps) => (
  <div className={cn("flex gap-3", className)} {...props}>
    {children}
  </div>
);

export type MessageAvatarProps = {
  src ? : string;
  alt: string;
  fallback ? : React.ReactNode;
  className ? : string;
};

const MessageAvatar = ({ src, alt, fallback, className }: MessageAvatarProps) => {
  return (
    <Avatar className={cn("h-8 w-8 shrink-0", className)}>
      {src ? <AvatarImage src={src} alt={alt} /> : null}
      {fallback && <AvatarFallback delayMs={0}>{fallback}</AvatarFallback>}
    </Avatar>
  );
};

export type MessageContentProps = {
  children: React.ReactNode;
  markdown ? : boolean;
  className ? : string;
} & React.HTMLProps < HTMLDivElement > ;

const MessageContent = ({ children, markdown = false, className, ...props }: MessageContentProps) => {
  const classNames = cn(
    "rounded-lg p-4 text-foreground prose break-words whitespace-normal",
    className
  );
  return markdown ? (
    <Markdown className={classNames}>
      {children as string}
    </Markdown>
  ) : (
    <div className={classNames} {...props}>
      {children}
    </div>
  );
};

export type MessageActionsProps = {
  children: React.ReactNode;
  className ? : string;
} & React.HTMLProps < HTMLDivElement > ;

const MessageActions = ({ children, className, ...props }: MessageActionsProps) => (
  <div
    className={cn("text-muted-foreground flex items-center gap-2", className)}
    {...props}
  >
    {children}
  </div>
);

export type MessageActionProps = {
  className ? : string;
  tooltip: React.ReactNode;
  children: React.ReactNode;
  side ? : "top" | "bottom" | "left" | "right";
} & React.ComponentProps < typeof Tooltip > ;

const MessageAction = ({ tooltip, children, className, side = "top", ...props }: MessageActionProps) => {
  return (
    <Tooltip {...props}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side} className={className}>
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
};

export { Message, MessageAvatar, MessageContent, MessageActions, MessageAction };