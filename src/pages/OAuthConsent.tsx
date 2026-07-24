import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";

type OAuthNamespace = {
  getAuthorizationDetails: (
    id: string,
  ) => Promise<{ data: any; error: { message: string } | null }>;
  approveAuthorization: (
    id: string,
  ) => Promise<{ data: any; error: { message: string } | null }>;
  denyAuthorization: (
    id: string,
  ) => Promise<{ data: any; error: { message: string } | null }>;
};

function getOAuth(): OAuthNamespace | null {
  const anyAuth = (supabase.auth as unknown) as { oauth?: OAuthNamespace };
  return anyAuth.oauth ?? null;
}

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) {
        setError("Missing authorization_id");
        return;
      }
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        const next = window.location.pathname + window.location.search;
        window.location.href = "/auth?next=" + encodeURIComponent(next);
        return;
      }
      const oauth = getOAuth();
      if (!oauth) {
        setError(
          "OAuth authorization is not enabled on this project. Please try again later.",
        );
        return;
      }
      const { data, error } = await oauth.getAuthorizationDetails(authorizationId);
      if (!active) return;
      if (error) {
        setError(error.message);
        return;
      }
      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) {
        window.location.href = immediate;
        return;
      }
      setDetails(data);
    })();
    return () => {
      active = false;
    };
  }, [authorizationId]);

  async function decide(approve: boolean) {
    const oauth = getOAuth();
    if (!oauth) return;
    setBusy(true);
    const { data, error } = approve
      ? await oauth.approveAuthorization(authorizationId)
      : await oauth.denyAuthorization(authorizationId);
    if (error) {
      setBusy(false);
      setError(error.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("No redirect returned by the authorization server.");
      return;
    }
    window.location.href = target;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-xl mx-auto">
          <Card className="p-8 bg-gradient-card border-border/50">
            {error ? (
              <>
                <h1 className="text-2xl font-display font-bold mb-4">
                  Authorization error
                </h1>
                <p className="text-muted-foreground">{error}</p>
              </>
            ) : !details ? (
              <p className="text-muted-foreground">Loading…</p>
            ) : (
              <>
                <h1 className="text-2xl font-display font-bold mb-4">
                  Connect {details.client?.name ?? "an app"} to PredictEsport
                </h1>
                <p className="text-muted-foreground mb-6">
                  {details.client?.name ?? "This application"} is requesting
                  access to your PredictEsport account. It will be able to call
                  MCP tools as you, with your permissions.
                </p>
                <div className="flex gap-3">
                  <Button
                    onClick={() => decide(true)}
                    disabled={busy}
                    className="flex-1"
                  >
                    Approve
                  </Button>
                  <Button
                    onClick={() => decide(false)}
                    disabled={busy}
                    variant="outline"
                    className="flex-1"
                  >
                    Deny
                  </Button>
                </div>
              </>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}
