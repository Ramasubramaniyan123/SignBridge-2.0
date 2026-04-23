// @ts-nocheck - Deno runtime types
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are SignBridge Assistant — a friendly, knowledgeable AI helper embedded in the SignBridge app, which helps users learn and detect Indian Sign Language (ISL) gestures.

Your capabilities:
- Answer questions about Indian Sign Language, its alphabet, numbers, and common words.
- Explain how to form specific hand gestures for ISL letters, numbers, or words.
- Give tips on improving gesture detection accuracy (lighting, background, hand positioning).
- Help users navigate the app (detection page, learning page, history, settings).
- Provide general information about sign language, deaf culture, and accessibility.

Guidelines:
- Keep answers concise and helpful. Use bullet points and short paragraphs.
- When describing gestures, be specific about finger positions, palm orientation, and hand movement.
- If you're unsure about a specific ISL gesture, say so honestly.
- Be encouraging and supportive of users learning sign language.
- Use emoji sparingly to keep a friendly tone 👋`;

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();

    // TODO: Replace with your custom chat API endpoint
    // This is where you'll integrate your own AI chat API
    const CUSTOM_CHAT_API_ENDPOINT = Deno.env.get("CUSTOM_CHAT_API_ENDPOINT");
    const CUSTOM_CHAT_API_KEY = Deno.env.get("CUSTOM_CHAT_API_KEY");
    
    if (!CUSTOM_CHAT_API_ENDPOINT) {
      return new Response(
        JSON.stringify({ 
          error: "Custom chat API not configured",
          message: "Please set CUSTOM_CHAT_API_ENDPOINT environment variable"
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const response = await fetch(CUSTOM_CHAT_API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(CUSTOM_CHAT_API_KEY && { "Authorization": `Bearer ${CUSTOM_CHAT_API_KEY}` }),
      },
      body: JSON.stringify({
        model: "your-model-name",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit reached. Please wait a moment and try again." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits in workspace settings." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(
        JSON.stringify({ error: "AI service temporarily unavailable." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("Chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
