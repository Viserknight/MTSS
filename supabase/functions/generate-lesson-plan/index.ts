import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// CAPS Lesson Plan Format for Grades 8-12
const CAPS_LESSON_PLAN_FORMAT = `
═══════════════════════════════════════════════════════════════════════════════
                         CAPS LESSON PLAN FORMAT (Grades 8-12)
═══════════════════════════════════════════════════════════════════════════════

SCHOOL: [School Name]
SUBJECT: [Subject Name]
GRADE: [Grade Level]
TOPIC: [Topic/Theme]
DATE: [Date]
DURATION: [Duration in minutes]
TEACHER: [Teacher Name]

───────────────────────────────────────────────────────────────────────────────
1. CAPS REFERENCE
───────────────────────────────────────────────────────────────────────────────
Content Area: [CAPS Content Area]
Specific Topic: [CAPS Specific Topic]
Week/Term: [Week number / Term number]

───────────────────────────────────────────────────────────────────────────────
2. LEARNING OBJECTIVES (CAPS-aligned)
───────────────────────────────────────────────────────────────────────────────
By the end of this lesson, learners should be able to:
• [Objective 1 - use Bloom's taxonomy verbs: explain, demonstrate, analyze, etc.]
• [Objective 2]
• [Objective 3]

───────────────────────────────────────────────────────────────────────────────
3. PRIOR KNOWLEDGE
───────────────────────────────────────────────────────────────────────────────
Learners should already know:
• [Pre-requisite knowledge 1]
• [Pre-requisite knowledge 2]

Baseline Assessment Questions:
• [Quick question to check readiness]

───────────────────────────────────────────────────────────────────────────────
4. RESOURCES / LTSM (Learner Teacher Support Materials)
───────────────────────────────────────────────────────────────────────────────
Teacher Resources:
• [Textbook, page numbers]
• [Visual aids, charts, models]
• [Technology/media]

Learner Resources:
• [Workbook, worksheets]
• [Stationery, equipment]

───────────────────────────────────────────────────────────────────────────────
5. LESSON PHASES
───────────────────────────────────────────────────────────────────────────────

╔═══════════════════════════════════════════════════════════════════════════════╗
║ PHASE 1: INTRODUCTION                                          [10-15 min]   ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║ Teacher Activities:                                                           ║
║ • [Attention grabber / hook activity]                                        ║
║ • [Link to prior knowledge]                                                  ║
║ • [State learning objectives clearly]                                        ║
║                                                                              ║
║ Learner Activities:                                                          ║
║ • [Respond to questions]                                                     ║
║ • [Share prior knowledge]                                                    ║
╚═══════════════════════════════════════════════════════════════════════════════╝

╔═══════════════════════════════════════════════════════════════════════════════╗
║ PHASE 2: DEVELOPMENT / DIRECT INSTRUCTION                      [20-30 min]   ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║ Teacher Activities:                                                           ║
║ • [Explain key concepts step-by-step]                                        ║
║ • [Demonstrate with examples]                                                ║
║ • [Use questioning techniques]                                               ║
║ • [Check for understanding]                                                  ║
║                                                                              ║
║ Learner Activities:                                                          ║
║ • [Take notes]                                                               ║
║ • [Participate in discussions]                                               ║
║ • [Complete guided practice]                                                 ║
║                                                                              ║
║ Differentiation Strategies:                                                  ║
║ • Struggling learners: [Support strategies]                                  ║
║ • Advanced learners: [Extension activities]                                  ║
╚═══════════════════════════════════════════════════════════════════════════════╝

╔═══════════════════════════════════════════════════════════════════════════════╗
║ PHASE 3: PRACTICE / APPLICATION                                [10-15 min]   ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║ Individual/Group Activities:                                                 ║
║ • [Practice exercises]                                                       ║
║ • [Problem-solving tasks]                                                    ║
║ • [Group work activities]                                                    ║
║                                                                              ║
║ Teacher Role:                                                                ║
║ • [Monitor and support]                                                      ║
║ • [Provide feedback]                                                         ║
╚═══════════════════════════════════════════════════════════════════════════════╝

╔═══════════════════════════════════════════════════════════════════════════════╗
║ PHASE 4: CONSOLIDATION / CONCLUSION                            [5-10 min]    ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║ • [Summarize key learning points]                                            ║
║ • [Address misconceptions]                                                   ║
║ • [Link to next lesson]                                                      ║
║ • [Assign homework/extended learning]                                        ║
╚═══════════════════════════════════════════════════════════════════════════════╝

───────────────────────────────────────────────────────────────────────────────
6. ASSESSMENT
───────────────────────────────────────────────────────────────────────────────
Formative Assessment:
• [Observation during lesson]
• [Questioning]
• [Quick quiz/exit ticket]

Success Criteria:
• [How will you know learners achieved objectives?]

Homework / Extended Learning:
• [Task description]
• [Due date]

───────────────────────────────────────────────────────────────────────────────
7. EXPANDED OPPORTUNITY ACTIVITIES
───────────────────────────────────────────────────────────────────────────────
For Remediation:
• [Activities for learners who didn't achieve objectives]

For Enrichment:
• [Activities for learners who need extension]

───────────────────────────────────────────────────────────────────────────────
8. TEACHER REFLECTION (Post-lesson)
───────────────────────────────────────────────────────────────────────────────
□ Were the learning objectives achieved?
□ What worked well?
□ What needs improvement?
□ Notes for next lesson:

═══════════════════════════════════════════════════════════════════════════════
`;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { subject, grade, topic, imageBase64, editContent, mode } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("AI service not configured");
    }

    let messages: any[] = [];

    // Mode: Extract from image (teacher photographs their handwritten/printed lesson plan)
    if (mode === "extract" && imageBase64) {
      console.log("Extracting lesson plan from uploaded image");
      
      messages = [
        {
          role: "system",
          content: `You are an expert at reading and digitizing lesson plans from images. 
Extract ALL content from the image and format it into the official CAPS lesson plan format.
Preserve all information from the original while organizing it into the proper structure.

Use this exact format:
${CAPS_LESSON_PLAN_FORMAT}

Fill in all sections based on what you can see in the image. If a section is not visible or present, 
mark it as "[To be completed]" rather than making up content.`
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Please extract and digitize this lesson plan into the official CAPS format:" },
            { type: "image_url", image_url: { url: imageBase64 } }
          ]
        }
      ];
    }
    // Mode: Edit existing content based on teacher description
    else if (mode === "edit" && editContent) {
      console.log("Editing lesson plan based on description");
      
      // If there's an image with editing instructions
      if (imageBase64) {
        messages = [
          {
            role: "system",
            content: `You are an expert South African CAPS curriculum designer. 
The teacher has an existing lesson plan and wants to modify it based on their instructions and/or a reference image.
Make the requested changes while maintaining the CAPS lesson plan format structure.

Official CAPS format:
${CAPS_LESSON_PLAN_FORMAT}`
          },
          {
            role: "user",
            content: [
              { type: "text", text: `Here is my current lesson plan:\n\n${editContent.currentPlan}\n\nPlease make changes based on what you see in this image and/or these instructions: ${editContent.instruction || 'Update based on the image'}` },
              { type: "image_url", image_url: { url: imageBase64 } }
            ]
          }
        ];
      } else {
        messages = [
          {
            role: "system",
            content: `You are an expert South African CAPS curriculum designer. 
The teacher has an existing lesson plan and wants to modify it based on their instructions.
Make the requested changes while maintaining the CAPS lesson plan format structure.
If the current format doesn't match CAPS format, convert it while making the requested changes.

Official CAPS format:
${CAPS_LESSON_PLAN_FORMAT}`
          },
          {
            role: "user",
            content: editContent.instruction
              ? `Here is my current lesson plan:\n\n${editContent.currentPlan}\n\nPlease make these changes: ${editContent.instruction}`
              : `Please convert this to proper CAPS format:\n\n${editContent.currentPlan}`
          }
        ];
      }
    }
    // Mode: Generate new lesson plan (default)
    else {
      if (!subject || !grade || !topic) {
        return new Response(
          JSON.stringify({ error: "Missing required fields: subject, grade, topic" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`Generating lesson plan for ${subject} Grade ${grade}: ${topic}`);

      messages = [
        {
          role: "system",
          content: `You are an expert South African CAPS (Curriculum and Assessment Policy Statement) curriculum designer and experienced teacher. 
Create detailed, engaging, and pedagogically sound lesson plans using the official CAPS format.

Guidelines:
- Follow CAPS objectives and assessment standards for the specified subject and grade
- Include clear learning objectives using Bloom's taxonomy verbs
- Design activities that promote critical thinking and learner engagement
- Consider diverse learning styles and abilities
- Include formative assessment opportunities
- Provide practical examples relevant to South African context
- Include cross-curricular connections where relevant

Use this EXACT format structure:
${CAPS_LESSON_PLAN_FORMAT}`
        },
        {
          role: "user",
          content: `Create a comprehensive CAPS-aligned lesson plan for:

Subject: ${subject}
Grade: ${grade}
Topic: ${topic}

Generate a complete lesson plan following the official CAPS format provided. 
Fill in ALL sections with specific, practical content that a teacher can use immediately.
Include actual examples, specific questions, and detailed activities.`
        }
      ];
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages,
        max_tokens: 4000,
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

    console.log("Lesson plan operation completed successfully");

    return new Response(
      JSON.stringify({ content }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error with lesson plan:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to process lesson plan" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
