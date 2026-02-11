import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const log = (step: string, details?: unknown) =>
  console.log(`[DAILY-PREDICTIONS] ${step}${details ? " - " + JSON.stringify(details) : ""}`);

const GITHUB_CSV_URL =
  "https://raw.githubusercontent.com/franc0510/streamlit-shine-sparkle/main/public/Documents/schedule_with_probs.csv";

interface MatchRow {
  datetime: string;
  tournament: string;
  format: string;
  team1: string;
  team2: string;
  proba1: number;
  proba2: number;
}

function parseCSV(text: string): MatchRow[] {
  const lines = text.split("\n").slice(1); // skip header
  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  return lines
    .filter((line) => line.trim())
    .map((line) => {
      const cols = line.split(",");
      const dt = new Date(cols[0]);
      const status = cols[9];
      return {
        datetime: cols[0],
        dateObj: dt,
        tournament: cols[1],
        format: cols[2],
        team1: cols[3],
        team2: cols[4],
        proba1: parseFloat(cols[5]),
        proba2: parseFloat(cols[6]),
        status,
      };
    })
    .filter((m) => m.status === "ok" && m.dateObj >= now && m.dateObj <= in24h)
    .map(({ dateObj, status, ...rest }) => rest);
}

function calculateMinOdds(proba: number): string {
  if (proba <= 0) return "-";
  return (100 / proba).toFixed(2);
}

function buildEmailHTML(matches: MatchRow[]): string {
  const matchRows = matches
    .map((m) => {
      const dt = new Date(m.datetime);
      const dateStr = dt.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
      const timeStr = dt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });

      // Determine the recommended bet (highest probability)
      const bestTeam = m.proba1 >= m.proba2 ? m.team1 : m.team2;
      const bestProba = Math.max(m.proba1, m.proba2);
      const minOdds = calculateMinOdds(bestProba);

      return `
        <tr>
          <td style="padding:12px 8px; border-bottom:1px solid #2a2a4a; color:#ccc; font-size:13px;">${dateStr} ${timeStr}</td>
          <td style="padding:12px 8px; border-bottom:1px solid #2a2a4a; color:#fff; font-weight:600;">${m.team1} vs ${m.team2}</td>
          <td style="padding:12px 8px; border-bottom:1px solid #2a2a4a; color:#ccc; font-size:13px;">${m.tournament}</td>
          <td style="padding:12px 8px; border-bottom:1px solid #2a2a4a; color:#00D6D6; font-weight:700;">${bestTeam}</td>
          <td style="padding:12px 8px; border-bottom:1px solid #2a2a4a; color:#4ade80; font-weight:600;">${bestProba.toFixed(1)}%</td>
          <td style="padding:12px 8px; border-bottom:1px solid #2a2a4a; color:#D9A134; font-weight:600;">≥ ${minOdds}</td>
        </tr>`;
    })
    .join("");

  return `
    <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px; background-color: #1a1a2e; color: #ffffff;">
      <h1 style="color: #00D6D6; text-align: center; margin-bottom: 5px;">🎮 Prédictions du jour</h1>
      <p style="text-align: center; color: #888; margin-top: 0;">Matchs des prochaines 24h — ${new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}</p>
      
      <div style="background-color: #16213e; border-radius: 10px; padding: 15px; margin: 20px 0; overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="border-bottom: 2px solid #00D6D6;">
              <th style="padding: 10px 8px; text-align: left; color: #00D6D6; font-size: 12px; text-transform: uppercase;">Date</th>
              <th style="padding: 10px 8px; text-align: left; color: #00D6D6; font-size: 12px; text-transform: uppercase;">Match</th>
              <th style="padding: 10px 8px; text-align: left; color: #00D6D6; font-size: 12px; text-transform: uppercase;">Ligue</th>
              <th style="padding: 10px 8px; text-align: left; color: #00D6D6; font-size: 12px; text-transform: uppercase;">Pari</th>
              <th style="padding: 10px 8px; text-align: left; color: #00D6D6; font-size: 12px; text-transform: uppercase;">Proba</th>
              <th style="padding: 10px 8px; text-align: left; color: #00D6D6; font-size: 12px; text-transform: uppercase;">Cote min</th>
            </tr>
          </thead>
          <tbody>
            ${matchRows}
          </tbody>
        </table>
      </div>

      <p style="text-align: center; font-size: 13px; color: #888;">
        💡 <em>Pariez uniquement si la cote proposée est supérieure ou égale à la cote minimum indiquée.</em>
      </p>
      
      <div style="text-align: center; margin: 25px 0;">
        <a href="https://predict-esport.lovable.app" 
           style="display: inline-block; background-color: #00D6D6; color: #0f172a; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">
          Voir les détails sur PredictEsport →
        </a>
      </div>
      
      <hr style="border: none; border-top: 1px solid #333; margin: 25px 0;">
      <p style="text-align: center; color: #666; font-size: 12px;">PredictEsport — Email quotidien réservé aux membres Premium</p>
    </div>
  `;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    log("Function started");

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) throw new Error("RESEND_API_KEY not configured");

    const resend = new Resend(resendKey);

    // 1. Fetch CSV from GitHub
    log("Fetching CSV from GitHub...");
    const csvRes = await fetch(GITHUB_CSV_URL, { cache: "no-store" });
    if (!csvRes.ok) throw new Error(`Failed to fetch CSV: ${csvRes.status}`);
    const csvText = await csvRes.text();

    // 2. Parse & filter next 24h
    const matches = parseCSV(csvText);
    log("Matches in next 24h", { count: matches.length });

    if (matches.length === 0) {
      log("No matches in next 24h, skipping email send");
      return new Response(JSON.stringify({ success: true, message: "No matches to send", emailsSent: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Get premium user emails
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get premium user IDs
    const { data: premiumUsers, error: premiumErr } = await supabaseAdmin
      .from("premium_users")
      .select("user_id");

    if (premiumErr) throw new Error(`Failed to fetch premium users: ${premiumErr.message}`);
    if (!premiumUsers || premiumUsers.length === 0) {
      log("No premium users found");
      return new Response(JSON.stringify({ success: true, message: "No premium users", emailsSent: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userIds = premiumUsers.map((pu) => pu.user_id);
    log("Premium users found", { count: userIds.length });

    // Get emails from profiles
    const { data: profiles, error: profileErr } = await supabaseAdmin
      .from("profiles")
      .select("user_id, email")
      .in("user_id", userIds);

    if (profileErr) throw new Error(`Failed to fetch profiles: ${profileErr.message}`);

    // Also check Stripe premium users via auth (for users who subscribed via Stripe)
    // Get emails directly from auth.users for premium_users entries
    const emails: string[] = [];
    
    // From profiles table
    if (profiles) {
      for (const p of profiles) {
        if (p.email) emails.push(p.email);
      }
    }

    // If no emails from profiles, try auth.users
    if (emails.length === 0) {
      for (const uid of userIds) {
        const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(uid);
        if (authUser?.user?.email) emails.push(authUser.user.email);
      }
    }

    // Also get Stripe premium users (those with active subscriptions but not in premium_users table)
    // We'll check via Stripe in the check-subscription function, but for emails we rely on premium_users + profiles

    const uniqueEmails = [...new Set(emails)];
    log("Unique emails to send to", { count: uniqueEmails.length });

    if (uniqueEmails.length === 0) {
      log("No emails found for premium users");
      return new Response(JSON.stringify({ success: true, message: "No emails found", emailsSent: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. Build & send email
    const html = buildEmailHTML(matches);
    let sent = 0;
    const errors: string[] = [];

    for (const email of uniqueEmails) {
      try {
        await resend.emails.send({
          from: "PredictEsport <onboarding@resend.dev>",
          to: [email],
          subject: `🎮 ${matches.length} prédiction${matches.length > 1 ? "s" : ""} pour aujourd'hui`,
          html,
        });
        sent++;
        log("Email sent", { email });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        log("Failed to send email", { email, error: msg });
        errors.push(`${email}: ${msg}`);
      }
    }

    log("Done", { sent, errors: errors.length });

    return new Response(
      JSON.stringify({ success: true, emailsSent: sent, matchCount: matches.length, errors }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    log("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: "An error occurred processing daily predictions." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
