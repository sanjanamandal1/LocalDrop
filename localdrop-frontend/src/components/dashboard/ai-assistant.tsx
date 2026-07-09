"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Sparkles, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/provider";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: string;
}

function parseMessageText(text: string) {
  const parts: React.ReactNode[] = [];
  let currentIndex = 0;
  
  const regex = /(\*\*.*?\*\*|\[.*?\]\(.*?\))/g;
  let match;
  
  while ((match = regex.exec(text)) !== null) {
    const matchIndex = match.index;
    
    if (matchIndex > currentIndex) {
      parts.push(text.substring(currentIndex, matchIndex));
    }
    
    const matchedStr = match[0];
    if (matchedStr.startsWith('**') && matchedStr.endsWith('**')) {
      const boldText = matchedStr.slice(2, -2);
      parts.push(<strong key={matchIndex} className="font-bold">{boldText}</strong>);
    } else if (matchedStr.startsWith('[') && matchedStr.includes('](')) {
      const closeBracket = matchedStr.indexOf('](');
      const linkText = matchedStr.slice(1, closeBracket);
      const url = matchedStr.slice(closeBracket + 2, -1);
      
      parts.push(
        <a
          key={matchIndex}
          href={url}
          className="text-pink-600 dark:text-pink-400 font-semibold hover:underline"
        >
          {linkText}
        </a>
      );
    }
    
    currentIndex = regex.lastIndex;
  }
  
  if (currentIndex < text.length) {
    parts.push(text.substring(currentIndex));
  }
  
  return parts.length > 0 ? parts : text;
}

export function AIAssistant() {
  const { t } = useI18n();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load chat history from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("localdrop-ai-chat");
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch {
        // Fallback to initial message
      }
    } else {
      // Set initial greeting
      const greeting: Message = {
        id: "greet-1",
        sender: "assistant",
        text: "Hi there. I'm your LocalDrop assistant. Ask me anything about matching, analytics, payouts, or disputes.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages([greeting]);
    }
  }, []);

  // Save chat history when messages change
  const saveChatHistory = (newMessages: Message[]) => {
    setMessages(newMessages);
    localStorage.setItem("localdrop-ai-chat", JSON.stringify(newMessages));
  };

  // Scroll to bottom of chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen, isLoading]);

  // Determine suggested prompts based on current page
  const getSuggestedPrompts = () => {
    if (pathname.includes("/creator/match")) {
      return ["ai.prompt.match", "ai.prompt.geofence"] as const;
    }
    if (pathname.includes("/analytics")) {
      return ["ai.prompt.dashboard", "ai.prompt.payout"] as const;
    }
    return ["ai.prompt.match", "ai.prompt.payout"] as const;
  };

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedMessages = [...messages, userMsg];
    saveChatHistory(updatedMessages);
    setInput("");
    setIsLoading(true);

    try {
      // Send chat history to backend AI endpoint
      const response = await api.post<{ success: boolean; reply: string }>("/ai/chat", {
        messages: updatedMessages,
        pathname
      });

      const assistantMsg: Message = {
        id: `assistant-${Date.now()}`,
        sender: "assistant",
        text: response.data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      saveChatHistory([...updatedMessages, assistantMsg]);
    } catch {
      // Graceful fallback when API fails or offline
      const fallbackMsg: Message = {
        id: `assistant-fallback-${Date.now()}`,
        sender: "assistant",
        text: "I had trouble connecting. Please try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      saveChatHistory([...updatedMessages, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    const greeting: Message = {
      id: "greet-1",
      sender: "assistant",
      text: "Hi there. I'm your LocalDrop assistant. Ask me anything about matching, analytics, payouts, or disputes.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    saveChatHistory([greeting]);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end">
      {/* Tooltip above FAB */}
      {!isOpen && (
        <div className="relative mb-3.5 select-none rounded-full border-2 border-[var(--ld-ink)] bg-[var(--ld-lime)] px-3 py-1.5 text-xs font-black text-[#08050f] shadow-[3px_4px_0_var(--ld-ink)]">
          Ask assistant
          <div className="absolute -bottom-1 right-6 h-2 w-2 rotate-45 border-b-2 border-r-2 border-[var(--ld-ink)] bg-[var(--ld-lime)]"></div>
        </div>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="mb-4 flex h-[480px] w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-[24px] border-2 border-[var(--ld-ink)] bg-card text-card-foreground shadow-[8px_9px_0_var(--ld-ink),0_18px_44px_rgba(8,5,15,0.16)] transition-all duration-300 sm:w-[360px]">
          {/* Header */}
          <div className="flex items-center justify-between border-b-2 border-[var(--ld-ink)] bg-[var(--ld-cream)] px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="relative flex h-9 w-9 items-center justify-center rounded-full border-2 border-[var(--ld-ink)] bg-[var(--ld-pink)] text-[#08050f] shadow-[3px_4px_0_var(--ld-ink)]">
                <Sparkles className="h-4 w-4" />
                <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full border-2 border-[var(--ld-ink)] bg-[var(--ld-mint)]" />
              </div>
              <div>
                <h3 className="text-sm font-black leading-tight text-foreground">LocalDrop AI</h3>
                <span className="text-[10px] font-black uppercase tracking-[0.08em] text-primary">Campaign copilot</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={clearChat}
                className="h-7 w-7 text-xs"
                title="Clear Chat"
              >
                <Sparkles className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-7 w-7"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Messages Area */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
          >
            {messages.map((m) => {
              const isAssistant = m.sender === "assistant";
              return (
                <div
                  key={m.id}
                  className={cn(
                    "flex items-start gap-2 max-w-[88%] animate-in fade-in slide-in-from-bottom-2 duration-200",
                    isAssistant ? "mr-auto" : "ml-auto flex-row-reverse"
                  )}
                >
                  {isAssistant && (
                    <div className="flex h-7 w-7 shrink-0 select-none items-center justify-center rounded-full border-2 border-[var(--ld-ink)] bg-[var(--ld-pink)] text-[#08050f]">
                      <Sparkles className="h-3.5 w-3.5" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "relative flex flex-col rounded-[18px] border-2 border-[var(--ld-ink)] px-3.5 py-2.5 text-sm font-semibold shadow-[3px_4px_0_var(--ld-ink)]",
                      isAssistant
                        ? "rounded-tl-none bg-[var(--ld-surface)] text-foreground"
                        : "rounded-tr-none bg-[var(--ld-sky)] text-[#08050f]"
                    )}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">{parseMessageText(m.text)}</p>
                    <span className="mt-1 text-[9px] opacity-70 self-end">
                      {m.timestamp}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Typing Indicator */}
            {isLoading && (
              <div className="flex items-start gap-2 max-w-[88%] mr-auto animate-in fade-in duration-200">
                <div className="flex h-7 w-7 shrink-0 select-none items-center justify-center rounded-full border-2 border-[var(--ld-ink)] bg-[var(--ld-pink)] text-[#08050f]">
                  <Sparkles className="h-3.5 w-3.5" />
                </div>
                <div className="mr-auto flex items-center gap-1.5 rounded-[18px] rounded-tl-none border-2 border-[var(--ld-ink)] bg-[var(--ld-surface)] px-3.5 py-3 shadow-[3px_4px_0_var(--ld-ink)]">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--ld-pink)] delay-100"></span>
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--ld-lime)] delay-200"></span>
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--ld-sky)] delay-300"></span>
                </div>
              </div>
            )}
          </div>

          {/* Suggested Prompts */}
          <div className="border-t-2 border-[var(--ld-ink)] bg-[var(--ld-cream)] px-4 py-2.5">
            <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.08em] text-primary">
              {t("ai.suggestedPrompts")}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {getSuggestedPrompts().map((key) => (
                <button
                  key={key}
                  onClick={() => handleSend(t(key))}
                  disabled={isLoading}
                  className="rounded-full border-2 border-[var(--ld-ink)] bg-card px-2.5 py-1 text-left text-[11px] font-black text-foreground shadow-[2px_3px_0_var(--ld-ink)] transition-all duration-200 hover:bg-[var(--ld-lime)] active:translate-x-1 active:translate-y-1 active:shadow-none disabled:opacity-50"
                >
                  {t(key)}
                </button>
              ))}
            </div>
          </div>

          {/* Footer Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }}
            className="flex items-center gap-2 border-t-2 border-[var(--ld-ink)] bg-card p-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("ai.askAnything")}
              className="flex-1 rounded-full border-2 border-[var(--ld-ink)] bg-background px-4 py-1.5 text-sm font-semibold text-foreground focus:outline-none"
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="icon"
              className="h-8 w-8 rounded-full"
              disabled={!input.trim() || isLoading}
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </form>
        </div>
      )}

      {/* Floating Action Button (FAB) */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--ld-pink)] text-[#08050f]"
        aria-label="Ask AI Assistant"
      >
        {isOpen ? (
          <X className="h-5 w-5 animate-in spin-in-90 duration-200" />
        ) : (
          <Sparkles className="h-5 w-5" />
        )}
      </Button>
    </div>
  );
}
