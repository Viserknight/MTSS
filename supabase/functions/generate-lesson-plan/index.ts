import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { subject, grade, topic } = await req.json();

    if (!subject || !grade || !topic) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: subject, grade, topic" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("AI service not configured");
    }

    console.log(`Generating lesson plan for ${subject} Grade ${grade}: ${topic}`);

    const systemPrompt = `You are an expert South African CAPS (Curriculum and Assessment Policy Statement) curriculum designer and experienced teacher. 
Your role is to create detailed, engaging, and pedagogically sound lesson plans that align with CAPS requirements.

Guidelines:
- Follow CAPS objectives and assessment standards for the specified subject and grade
- Include clear learning objectives using Bloom's taxonomy verbs
- Design activities that promote critical thinking and learner engagement
- Consider diverse learning styles and abilities
- Include formative assessment opportunities
- Provide practical examples relevant to South African context
- Structure content logically with appropriate time allocations
- Include cross-curricular connections where relevant`;

    const userPrompt = `Create a comprehensive CAPS-aligned lesson plan for:

Subject: ${subject}
Grade: ${grade}
Topic: ${topic}

The lesson plan should include:

1. LESSON OVERVIEW
   - Duration (typically 45-60 minutes)
   - CAPS Content Area and Topic
   - Specific Aims and Learning Objectives

2. PRIOR KNOWLEDGE
   - What learners should already know
   - Quick assessment questions to gauge readiness

3. RESOURCES REQUIRED
   - Teaching materials
   - Learner materials
   - Technology/media if applicable

4. LESSON STRUCTURE

   INTRODUCTION (10-15 minutes)
   - Hook/attention grabber
   - Link to prior knowledge
   - State learning objectives

   DEVELOPMENT (25-35 minutes)
   - Main teaching activities
   - Learner activities
   - Differentiation strategies for diverse learners
   - Key concepts and explanations

   CONSOLIDATION (10-15 minutes)
   - Summary of key points
   - Check for understanding
   - Address misconceptions

5. ASSESSMENT
   - Formative assessment activities
   - Success criteria
   - Homework/extended learning task

6. REFLECTION
   - Questions for teacher self-reflection
   - Notes for future lessons

Format the lesson plan clearly with headings, bullet points, and practical details that a teacher can immediately use in the classroom.`;

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
        max_tokens: 2000,
        temperature: 0.7,
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
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error("No content in AI response:", data);
      throw new Error("No content generated");
    }

    console.log("Lesson plan generated successfully");

    return new Response(
      JSON.stringify({ content }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error generating lesson plan:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to generate lesson plan" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
