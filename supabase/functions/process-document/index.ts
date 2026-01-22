import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, type } = await req.json();

    if (!content) {
      return new Response(
        JSON.stringify({ error: "No content provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("AI service not configured");
    }

    console.log(`Processing document of type: ${type}`);

    const systemPrompt = `You are a document processing AI specialized in extracting learner/student registration information from various document formats.

Your task is to:
1. Parse the provided text content
2. Extract learner information including:
   - Full name (required)
   - Date of birth (YYYY-MM-DD format if possible)
   - Grade level (8-12 for high school)
   - Parent/Guardian name
   - Parent email
   - Parent phone number
3. Return structured JSON data

Be flexible with input formats - the data might come in various formats like:
- Tabular data (CSV-like)
- Form-style key-value pairs
- Narrative text
- Lists

Always try to extract as much information as possible even if some fields are missing.`;

    const userPrompt = `Extract learner registration information from the following document content. Return a JSON array of learners with the following structure:

{
  "learners": [
    {
      "name": "Full Name",
      "dateOfBirth": "YYYY-MM-DD or null",
      "grade": "8-12 or null",
      "parentName": "Parent Name or null",
      "parentEmail": "email@example.com or null",
      "parentPhone": "phone number or null",
      "status": "pending"
    }
  ]
}

Document content:
${content}

Return ONLY valid JSON, no additional text or explanation.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 4000,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please contact support." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      throw new Error(`AI service error: ${response.status}`);
    }

    const data = await response.json();
    let aiContent = data.choices?.[0]?.message?.content;

    if (!aiContent) {
      console.error("No content in AI response:", data);
      throw new Error("No content generated");
    }

    // Clean up the response - remove markdown code blocks if present
    aiContent = aiContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    // Parse the JSON response
    let parsedResult;
    try {
      parsedResult = JSON.parse(aiContent);
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", aiContent);
      // Return empty learners array if parsing fails
      parsedResult = { learners: [] };
    }

    console.log(`Extracted ${parsedResult.learners?.length || 0} learners from document`);

    return new Response(
      JSON.stringify(parsedResult),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error processing document:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to process document" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});