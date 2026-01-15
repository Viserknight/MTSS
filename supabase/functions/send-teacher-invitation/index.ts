import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InvitationRequest {
  email: string;
  invitedBy: string;
}

const handler = async (req: Request): Promise<Response> => {
  const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { email, invitedBy }: InvitationRequest = await req.json();

    if (!email || !invitedBy) {
      return new Response(
        JSON.stringify({ error: "Email and invitedBy are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Generate a unique token
    const token = crypto.randomUUID();

    // Check if invitation already exists
    const { data: existing } = await supabase
      .from("teacher_invitations")
      .select("id, status")
      .eq("email", email)
      .single();

    if (existing) {
      if (existing.status === "accepted") {
        return new Response(
          JSON.stringify({ error: "This email has already been registered as a teacher" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      // Update existing invitation with new token
      await supabase
        .from("teacher_invitations")
        .update({ 
          token, 
          status: "pending",
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        })
        .eq("id", existing.id);
    } else {
      // Create new invitation
      const { error: insertError } = await supabase
        .from("teacher_invitations")
        .insert({
          email,
          token,
          invited_by: invitedBy,
        });

      if (insertError) {
        console.error("Insert error:", insertError);
        return new Response(
          JSON.stringify({ error: "Failed to create invitation" }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    // Get the origin from the request or use a default
    const origin = req.headers.get("origin") || "https://id-preview--72353310-fddf-4360-b2c8-dd2fef0c8a81.lovable.app";
    const inviteLink = `${origin}/teacher-signup?token=${token}`;

    // Send invitation email
    const emailResponse = await resend.emails.send({
      from: "MTSS <onboarding@resend.dev>",
      to: [email],
      subject: "You're Invited to Join MTSS as a Teacher",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #d4af37; color: #1e3a5f; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to MTSS</h1>
              <p>Mogwase Technical Secondary School</p>
            </div>
            <div class="content">
              <h2>You're Invited!</h2>
              <p>You have been invited to join Mogwase Technical Secondary School as a teacher on our educational platform.</p>
              <p>Click the button below to complete your registration:</p>
              <p style="text-align: center;">
                <a href="${inviteLink}" class="button">Complete Registration</a>
              </p>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; background: #eee; padding: 10px; border-radius: 5px;">${inviteLink}</p>
              <p><strong>This invitation will expire in 7 days.</strong></p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Mogwase Technical Secondary School</p>
              <p>"We Strive for Excellence"</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, message: "Invitation sent successfully" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-teacher-invitation:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
