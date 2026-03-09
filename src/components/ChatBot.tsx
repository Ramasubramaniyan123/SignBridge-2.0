import { useState, useRef, useCallback, useEffect } from "react";
import { MessageCircle, X, Send, Hand, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { streamChat } from "@/lib/chat-stream";
import { useChatHistory } from "@/hooks/use-chat-history";
import { cn } from "@/lib/utils";

export function ChatBot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    addMessage,
    updateLastAssistantMessage,
    clearHistory,
    loading: historyLoading,
    isAuthenticated,
  } = useChatHistory();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg = { role: "user" as const, content: text };
    await addMessage(userMsg);
    setInput("");
    setIsLoading(true);

    let assistantSoFar = "";

    try {
      await streamChat({
        messages: [...messages, userMsg],
        onDelta: (chunk) => {
          assistantSoFar += chunk;
          updateLastAssistantMessage(assistantSoFar, false);
        },
        onDone: async () => {
          // Save the complete assistant message
          if (assistantSoFar) {
            await updateLastAssistantMessage(assistantSoFar, true);
          }
          setIsLoading(false);
        },
        onError: async (errMsg) => {
          const errorContent = `⚠️ ${errMsg}`;
          await addMessage({ role: "assistant", content: errorContent });
          setIsLoading(false);
        },
      });
    } catch {
      await addMessage({ role: "assistant", content: "⚠️ Failed to connect. Please try again." });
      setIsLoading(false);
    }
  }, [input, isLoading, messages, addMessage, updateLastAssistantMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <>
      {/* Floating trigger button */}
      <AnimatePresence>
        {!open && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50"
          >
            <Button
              onClick={() => setOpen(true)}
              size="lg"
              className="h-14 w-14 rounded-full shadow-lg"
            >
              <MessageCircle className="h-6 w-6" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50 w-[calc(100vw-2rem)] max-w-md"
          >
            <div className="bg-card border border-border rounded-2xl shadow-2xl flex flex-col h-[min(32rem,calc(100vh-8rem))] overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-primary/5">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                    <Hand className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">SignBridge Assistant</p>
                    <p className="text-[10px] text-muted-foreground">Ask about ISL gestures & more</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {messages.length > 0 && isAuthenticated && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={clearHistory}
                      className="h-8 w-8"
                      title="Clear chat history"
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => setOpen(false)} className="h-8 w-8">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                {historyLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Hand className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm font-medium">Hi there! 👋</p>
                    <p className="text-xs mt-1">Ask me anything about Indian Sign Language.</p>
                    {!isAuthenticated && (
                      <p className="text-xs mt-3 text-amber-600">Sign in to save your chat history.</p>
                    )}
                    <div className="mt-4 flex flex-wrap justify-center gap-2">
                      {["How do I sign 'Hello'?", "Tips for better detection", "What letters are supported?"].map(
                        (q) => (
                          <button
                            key={q}
                            onClick={() => setInput(q)}
                            className="text-xs px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:bg-secondary transition-colors"
                          >
                            {q}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                ) : (
                  messages.map((msg, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex",
                        msg.role === "user" ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm",
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground rounded-br-md"
                            : "bg-secondary text-secondary-foreground rounded-bl-md"
                        )}
                      >
                        {msg.role === "assistant" ? (
                          <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        )}
                      </div>
                    </div>
                  ))
                )}

                {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
                  <div className="flex justify-start">
                    <div className="bg-secondary rounded-2xl rounded-bl-md px-4 py-3">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="p-3 border-t border-border">
                <div className="flex items-center gap-2">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    className="flex-1 bg-secondary/50 rounded-xl px-4 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
                    disabled={isLoading}
                  />
                  <Button
                    onClick={send}
                    disabled={!input.trim() || isLoading}
                    size="icon"
                    className="h-10 w-10 rounded-xl shrink-0"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
