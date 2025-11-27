import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ROIEmailRequest {
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("[send-roi-results] Request received");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email }: ROIEmailRequest = await req.json();
    console.log("[send-roi-results] Sending to:", email);

    if (!email || !email.includes("@")) {
      return new Response(
        JSON.stringify({ error: "Invalid email address" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const emailResponse = await resend.emails.send({
      from: "PredictEsport <onboarding@resend.dev>",
      to: [email],
      subject: "Your Worlds 2025 Results Recap 🎮",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #1a1a2e; color: #ffffff;">
          <h1 style="color: #00D6D6; text-align: center;">Your Worlds 2025 Results Recap 🎮</h1>
          
          <p>Hello,</p>
          <p>Thank you for using our tool!</p>
          <p>Here is a quick overview of your betting results for Worlds 2025:</p>
          
          <div style="background-color: #16213e; border-radius: 10px; padding: 20px; margin: 20px 0;">
            <h2 style="color: #D9A134; margin-top: 0;">🧾 Summary</h2>
            <ul style="list-style: none; padding: 0;">
              <li style="margin: 10px 0;">📊 Total bets placed: <strong>29</strong></li>
              <li style="margin: 10px 0;">💰 Total amount wagered: <strong>€2,900</strong></li>
              <li style="margin: 10px 0;">💵 Total amount returned: <strong>€3,613</strong></li>
              <li style="margin: 10px 0;">✅ Final profit: <strong style="color: #4ade80;">+€713</strong></li>
              <li style="margin: 10px 0;">📈 ROI: <strong style="color: #4ade80;">+25%</strong></li>
            </ul>
          </div>
          
          <div style="background-color: #16213e; border-radius: 10px; padding: 20px; margin: 20px 0;">
            <h2 style="color: #D9A134; margin-top: 0;">📊 Overview of your bets</h2>
            <p>Here are a few sample entries from your results:</p>
            
            <div style="background-color: #0f172a; border-radius: 8px; padding: 15px; margin: 10px 0;">
              <p style="margin: 5px 0;"><strong>2025-11-02 — Semifinal</strong></p>
              <p style="margin: 5px 0;">Gen.G vs KT Rolster → KT Rolster (odds 5.8) → <span style="color: #4ade80;">Won</span> → €480</p>
            </div>
            
            <div style="background-color: #0f172a; border-radius: 8px; padding: 15px; margin: 10px 0;">
              <p style="margin: 5px 0;"><strong>2025-10-15 — Swiss Stage</strong></p>
              <p style="margin: 5px 0;">Anyone's Legend vs Gen.G → Anyone's Legend (odds 2.90) → <span style="color: #4ade80;">Won</span> → €190</p>
            </div>
            
            <div style="background-color: #0f172a; border-radius: 8px; padding: 15px; margin: 10px 0;">
              <p style="margin: 5px 0;"><strong>2025-10-15 — Swiss Stage</strong></p>
              <p style="margin: 5px 0;">Bilibili Gaming vs 100 Thieves → 100 Thieves (odds 7.00) → <span style="color: #4ade80;">Won</span> → €600</p>
            </div>
            
            <p style="text-align: center; color: #888;">…</p>
            <p style="font-style: italic; color: #888;">(You can find the full detailed list in your downloadable file.)</p>
          </div>
          
          <div style="background-color: #16213e; border-radius: 10px; padding: 20px; margin: 20px 0;">
            <h2 style="color: #D9A134; margin-top: 0;">🔍 Want a deeper analysis?</h2>
            <p>Your full report is available here:</p>
            <p style="text-align: center;">
              <a href="https://docs.google.com/spreadsheets/d/1TC4yLYQiGeqae4B2xN766FE_UeSK9ZUb78tMvvx8M_c/edit?usp=sharing" 
                 style="display: inline-block; background-color: #00D6D6; color: #0f172a; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                👉 View Full Report
              </a>
            </p>
            <p>It includes:</p>
            <ul>
              <li>Every bet you placed</li>
              <li>Each stage of the tournament</li>
              <li>Individual wins and losses</li>
              <li>Detailed performance metrics</li>
            </ul>
          </div>
          
          <hr style="border: none; border-top: 1px solid #333; margin: 30px 0;">
          
          <p>Thank you again for your trust.</p>
          <p>See you soon for more analytics!</p>
          
          <p style="color: #00D6D6; font-weight: bold;">Predict Esport Team</p>
        </div>
      `,
    });

    console.log("[send-roi-results] Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("[send-roi-results] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
