import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GESTURE_LABELS = [
  "A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z",
  "0","1","2","3","4","5","6","7","8","9",
  "Hello","Thank You","Yes","No","Help","Goodbye","Sorry","Please","I Love You","Friend","Water","Food","Home","School","Good","Bad",
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image } = await req.json();
    if (!image) {
      return new Response(JSON.stringify({ error: "No image provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are an Indian Sign Language (ISL) gesture recognition expert. Analyze the provided image and identify the hand gesture being shown.

You MUST respond by calling the detect_gesture function with your analysis. Look for hand shapes, finger positions, and orientations that match ISL gestures.

The possible gestures are: ${GESTURE_LABELS.join(", ")}

If no hand gesture is visible or the image is unclear, use label "none" with confidence 0.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: image },
              },
              {
                type: "text",
                text: "What Indian Sign Language gesture is shown in this image? Analyze the hand shape carefully.",
              },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "detect_gesture",
              description: "Report the detected ISL gesture from the image",
              parameters: {
                type: "object",
                properties: {
                  label: {
                    type: "string",
                    description: "The detected gesture label. Must be one of the known ISL gestures or 'none'.",
                  },
                  confidence: {
                    type: "number",
                    description: "Confidence score from 0-100",
                  },
                  reasoning: {
                    type: "string",
                    description: "Brief explanation of why this gesture was identified",
                  },
                },
                required: ["label", "confidence", "reasoning"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "detect_gesture" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        const retryAfterHeader = response.headers.get("retry-after");
        const parsedRetryAfter = retryAfterHeader ? Number.parseInt(retryAfterHeader, 10) : NaN;
        const retryAfterSeconds = Number.isFinite(parsedRetryAfter) && parsedRetryAfter > 0 ? parsedRetryAfter : 30;

        // Return HTTP 200 so the caller/UI doesn't treat rate-limits as a fatal runtime error;
        // clients should respect `rateLimited` and pause before sending more frames.
        return new Response(
          JSON.stringify({
            rateLimited: true,
            retryAfterSeconds,
            error: "Rate limit exceeded, please try again later.",
          }),
          {
            status: 200,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
              "X-Rate-Limited": "true",
              "Retry-After": String(retryAfterSeconds),
            },
          }
        );
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits in Settings." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      return new Response(JSON.stringify({ label: "none", confidence: 0, reasoning: "No detection" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = JSON.parse(toolCall.function.arguments);

    // Validate and normalize the label
    const matchedLabel = GESTURE_LABELS.find(
      (l) => l.toLowerCase() === result.label?.toLowerCase(),
    );

    return new Response(
      JSON.stringify({
        label: matchedLabel || "none",
        confidence: Math.min(100, Math.max(0, Math.round(result.confidence || 0))),
        reasoning: result.reasoning || "",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("detect-gesture error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
