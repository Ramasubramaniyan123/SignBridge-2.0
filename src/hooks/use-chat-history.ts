import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

type Msg = { role: "user" | "assistant"; content: string };

export function useChatHistory() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(true);

  // Load messages on mount
  useEffect(() => {
    if (!user) {
      setMessages([]);
      setLoading(false);
      return;
    }

    const loadMessages = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("chat_messages")
        .select("role, content")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
        .limit(100);

      if (error) {
        console.error("Failed to load chat history:", error);
      } else if (data) {
        setMessages(data.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })));
      }
      setLoading(false);
    };

    loadMessages();
  }, [user]);

  const addMessage = useCallback(
    async (msg: Msg) => {
      setMessages((prev) => [...prev, msg]);

      if (user) {
        const { error } = await supabase.from("chat_messages").insert({
          user_id: user.id,
          role: msg.role,
          content: msg.content,
        });
        if (error) {
          console.error("Failed to save message:", error);
        }
      }
    },
    [user]
  );

  const updateLastAssistantMessage = useCallback(
    async (content: string, shouldSave = false) => {
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content } : m));
        }
        return [...prev, { role: "assistant", content }];
      });

      // Only save when streaming is complete
      if (shouldSave && user) {
        const { error } = await supabase.from("chat_messages").insert({
          user_id: user.id,
          role: "assistant",
          content,
        });
        if (error) {
          console.error("Failed to save assistant message:", error);
        }
      }
    },
    [user]
  );

  const clearHistory = useCallback(async () => {
    setMessages([]);

    if (user) {
      const { error } = await supabase
        .from("chat_messages")
        .delete()
        .eq("user_id", user.id);
      if (error) {
        console.error("Failed to clear chat history:", error);
      }
    }
  }, [user]);

  return {
    messages,
    setMessages,
    addMessage,
    updateLastAssistantMessage,
    clearHistory,
    loading,
    isAuthenticated: !!user,
  };
}
