// @ts-nocheck - Deno runtime types
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

serve(async (req: Request) => {
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

    // TODO: Replace with your custom API endpoint
    // This is where you'll integrate your own gesture detection API
    const CUSTOM_API_ENDPOINT = Deno.env.get("CUSTOM_GESTURE_API_ENDPOINT");
    const CUSTOM_API_KEY = Deno.env.get("CUSTOM_GESTURE_API_KEY");
    
    if (!CUSTOM_API_ENDPOINT) {
      return new Response(JSON.stringify({ 
        error: "Custom API endpoint not configured",
        message: "Please set CUSTOM_GESTURE_API_ENDPOINT environment variable"
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Example: Call your custom API
    const response = await fetch(CUSTOM_API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(CUSTOM_API_KEY && { "Authorization": `Bearer ${CUSTOM_API_KEY}` }),
      },
      body: JSON.stringify({
        image: image,
        // Add any other parameters your API needs
        model: "sign-language-detection",
        confidence_threshold: 0.85
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Custom API error:", response.status, errorText);
      return new Response(JSON.stringify({ 
        error: "Gesture detection failed",
        details: errorText
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await response.json();
    
    // Validate and normalize the response from your API
    // Adjust this based on your API's response format
    const detectedLabel = result.label || result.gesture || result.prediction || "none";
    const confidence = result.confidence || result.score || 0;
    const reasoning = result.reasoning || result.explanation || "";

    const matchedLabel = GESTURE_LABELS.find(
      (l) => l.toLowerCase() === detectedLabel.toLowerCase(),
    );

    return new Response(
      JSON.stringify({
        label: matchedLabel || "none",
        confidence: Math.min(100, Math.max(0, Math.round(confidence * 100))),
        reasoning: reasoning,
        // Include any additional data from your API
        raw_response: result
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
