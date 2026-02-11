import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const log = (step: string, details?: unknown) =>
  console.log(`[SYNC-AUDIENCE] ${step}${details ? " - " + JSON.stringify(details) : ""}`);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    log("Starting audience sync");

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) throw new Error("RESEND_API_KEY not configured");

    const audienceId = Deno.env.get("RESEND_AUDIENCE_ID");
    if (!audienceId) throw new Error("RESEND_AUDIENCE_ID not configured");

    const resend = new Resend(resendKey);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Get premium user IDs
    const { data: premiumUsers, error: premiumErr } = await supabase
      .from("premium_users")
      .select("user_id");

    if (premiumErr) throw new Error(`Failed to fetch premium users: ${premiumErr.message}`);
    if (!premiumUsers || premiumUsers.length === 0) {
      log("No premium users found");
      return new Response(JSON.stringify({ success: true, synced: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userIds = premiumUsers.map((pu) => pu.user_id);

    // 2. Get emails from profiles
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, email, display_name")
      .in("user_id", userIds);

    const emailMap = new Map<string, { email: string; name?: string }>();

    if (profiles) {
      for (const p of profiles) {
        if (p.email) emailMap.set(p.email, { email: p.email, name: p.display_name || undefined });
      }
    }

    // Fallback: check auth.users for missing emails
    for (const uid of userIds) {
      const hasEmail = profiles?.some((p) => p.user_id === uid && p.email);
      if (!hasEmail) {
        const { data: authUser } = await supabase.auth.admin.getUserById(uid);
        if (authUser?.user?.email) {
          emailMap.set(authUser.user.email, { email: authUser.user.email });
        }
      }
    }

    log("Premium emails found", { count: emailMap.size });

    // 3. Get existing contacts in Resend audience
    const existingContacts = await resend.contacts.list({ audienceId });
    const existingEmails = new Set(
      existingContacts.data?.data?.map((c: { email: string }) => c.email) || []
    );

    log("Existing contacts in audience", { count: existingEmails.size });

    // 4. Add new contacts
    let added = 0;
    let removed = 0;
    const errors: string[] = [];

    for (const [email, info] of emailMap) {
      if (!existingEmails.has(email)) {
        try {
          await resend.contacts.create({
            audienceId,
            email,
            firstName: info.name || "",
            unsubscribed: false,
          });
          added++;
          log("Contact added", { email });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          errors.push(`add ${email}: ${msg}`);
        }
      }
    }

    // 5. Remove contacts no longer premium
    if (existingContacts.data?.data) {
      for (const contact of existingContacts.data.data) {
        if (!emailMap.has(contact.email)) {
          try {
            await resend.contacts.remove({ audienceId, id: contact.id });
            removed++;
            log("Contact removed", { email: contact.email });
          } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            errors.push(`remove ${contact.email}: ${msg}`);
          }
        }
      }
    }

    log("Sync complete", { added, removed, errors: errors.length });

    return new Response(
      JSON.stringify({ success: true, added, removed, total: emailMap.size, errors }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    log("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
