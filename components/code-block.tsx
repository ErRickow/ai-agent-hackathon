"use client"

import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"
import React, { useEffect, useState } from "react"
import { codeToHtml } from "shiki"

export type CodeBlockProps = {
    children ? : React.ReactNode
    className ? : string
  } & React.HTMLProps < HTMLDivElement >
  
  function CodeBlock({ children, className, ...props }: CodeBlockProps) {
    return (
      <div
      className={cn(
        "not-prose flex w-full flex-col overflow-hidden border",
        "border-border bg-card text-card-foreground rounded-xl",
        "max-w-full",
        className
      )}
      {...props}
    >
      {children}
    </div>
    )
  }

export type CodeBlockCodeProps = {
    code: string
    language ? : string
    theme ? : string
    className ? : string
  } & React.HTMLProps < HTMLDivElement >
  
  function CodeBlockCode({
    code,
    language = "tsx",
    theme = "github-light",
    className,
    ...props
  }: CodeBlockCodeProps) {
    const { resolvedTheme: appTheme } = useTheme()
    const [highlightedHtml, setHighlightedHtml] = useState < string | null > (null)
    
    useEffect(() => {
      async function highlight() {
        try {
          const html = await codeToHtml(code, {
            lang: language,
            theme: appTheme === "dark" ? "github-dark" : "github-light",
          })
          setHighlightedHtml(html)
        } catch (error) {
          // Fallback jika language tidak dikenali
          console.warn(`Language "${language}" not supported, falling back to text`)
          const html = await codeToHtml(code, {
            lang: "text",
            theme: appTheme === "dark" ? "github-dark" : "github-light",
          })
          setHighlightedHtml(html)
        }
      }
      highlight()
    }, [code, language, appTheme])
    
    const classNames = cn(
      "w-full overflow-x-auto text-[13px] leading-relaxed",
      "scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border",
      "px-4 py-3",
      "[&>pre]:!m-0 [&>pre]:!p-0 [&>pre]:!bg-transparent [&>pre]:overflow-x-visible",
      "[&>pre]:font-mono [&_code]:font-mono",
      "[&>pre]:leading-relaxed [&_code]:leading-relaxed",
      className
    )
    
    return highlightedHtml ? (
      <div
      className={classNames}
      dangerouslySetInnerHTML={{ __html: highlightedHtml }}
      {...props}
    />
    ) : (
      <div className={classNames} {...props}>
      <pre className="!m-0 !p-0 !bg-transparent font-mono leading-relaxed">
        <code className="font-mono">{code}</code>
      </pre>
    </div>
    )
  }

export type CodeBlockGroupProps = React.HTMLAttributes < HTMLDivElement >
  
  function CodeBlockGroup({
    children,
    className,
    ...props
  }: CodeBlockGroupProps) {
    return (
      <div
      className={cn(
        "flex items-center justify-between gap-2",
        "px-4 py-2",
        "border-b border-border bg-muted/30",
        "text-sm text-muted-foreground",
        "font-medium",
        "min-h-[44px]",
        className
      )}
      {...props}
    >
      {children}
    </div>
    )
  }

export { CodeBlockGroup, CodeBlockCode, CodeBlock }