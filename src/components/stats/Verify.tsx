import { useState } from "react";
import { ShieldCheck, ShieldAlert, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Manifest, useManifest } from "@/lib/stats";
import { useTr } from "@/hooks/useTr";
import { Loading } from "./parts";

const hex = (buf: ArrayBuffer) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");

type Result = { path: string; ok: boolean; got: string };

/** Re-télécharge chaque fichier publié et compare son SHA-256 à celui du manifeste, dans le navigateur. */
const VerifyButton = ({ m }: { m: Manifest }) => {
  const { tr } = useTr();
  const [state, setState] = useState<"idle" | "run" | "done">("idle");
  const [res, setRes] = useState<Result[]>([]);
  const run = async () => {
    setState("run");
    const out: Result[] = [];
    for (const f of m.outputs) {
      try {
        const r = await fetch("/" + f.path, { cache: "no-store" });
        const got = hex(await crypto.subtle.digest("SHA-256", await r.arrayBuffer()));
        out.push({ path: f.path, ok: got === f.sha256, got });
      } catch {
        out.push({ path: f.path, ok: false, got: "erreur" });
      }
    }
    setRes(out);
    setState("done");
  };
  const allOk = res.length > 0 && res.every((r) => r.ok);
  return (
    <div>
      <Button onClick={run} disabled={state === "run"} variant="outline" className="gap-2">
        {state === "run" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
        {tr("Vérifier l'intégrité des fichiers maintenant", "Verify file integrity now")}
      </Button>
      {state === "done" && (
        <div className={`mt-3 rounded-lg border p-3 text-sm ${allOk ? "border-emerald-500/40 bg-emerald-500/10" : "border-red-500/40 bg-red-500/10"}`}>
          <div className="mb-2 flex items-center gap-2 font-semibold">
            {allOk ? <ShieldCheck className="h-4 w-4 text-emerald-400" /> : <ShieldAlert className="h-4 w-4 text-red-400" />}
            {allOk
              ? tr("Les empreintes SHA-256 calculées dans votre navigateur correspondent au manifeste.", "SHA-256 hashes computed in your browser match the manifest.")
              : tr("Écart détecté — ne pas faire confiance à ces fichiers.", "Mismatch detected — do not trust these files.")}
          </div>
          <ul className="space-y-0.5 font-mono text-xs">
            {res.map((r) => (
              <li key={r.path}>{r.ok ? "✓" : "✗"} {r.path} <span className="opacity-60">{r.got.slice(0, 16)}…</span></li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export const VerifyPanel = () => {
  const { tr, lng } = useTr();
  const { data: m, isLoading, error } = useManifest();
  if (isLoading) return <Loading />;
  if (error || !m) return <p className="text-sm text-red-400">{tr("Manifeste indisponible.", "Manifest unavailable.")}</p>;
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-border/60 bg-card/60 p-5">
          <h3 className="mb-3 font-display text-xl font-bold">{tr("1 · D'où viennent les chiffres", "1 · Where the numbers come from")}</h3>
          <p className="text-sm text-muted-foreground">
            {tr(
              "Chaque chiffre de ce site est recalculé automatiquement par notre pipeline à partir des journaux bruts de nos bots (paris, décisions, prédictions horodatées). Rien n'est saisi à la main. Le tableau ci-dessous liste les fichiers sources avec leur empreinte SHA-256 : si une source change, l'empreinte change.",
              "Every number on this site is recomputed automatically by our pipeline from the raw logs of our bots (bets, decisions, timestamped predictions). Nothing is typed by hand. The table below lists the source files with their SHA-256 fingerprint: if a source changes, the fingerprint changes.",
            )}
          </p>
        </div>
        <div className="rounded-xl border border-border/60 bg-card/60 p-5">
          <h3 className="mb-3 font-display text-xl font-bold">{tr("2 · Règles de calcul (fixes)", "2 · Calculation rules (fixed)")}</h3>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {m.rules.map((r) => <li key={r}>{r}</li>)}
          </ul>
        </div>
      </div>

      <div className="rounded-xl border border-border/60 bg-card/60 p-5">
        <h3 className="mb-3 font-display text-xl font-bold">{tr("3 · Fichiers sources et empreintes", "3 · Source files and fingerprints")}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-muted-foreground">
              <tr><th className="py-1 pr-3">{tr("Source", "Source")}</th><th className="pr-3">{tr("Rôle", "Role")}</th><th className="pr-3">SHA-256</th><th>{tr("Mise à jour", "Updated")}</th></tr>
            </thead>
            <tbody>
              {m.files.map((f) => (
                <tr key={f.id} className="border-t border-border/40 align-top">
                  <td className="py-1.5 pr-3 font-mono">{f.id}</td>
                  <td className="pr-3 text-muted-foreground">{f.role}</td>
                  <td className="pr-3 font-mono">{f.sha256.slice(0, 12)}…</td>
                  <td className="text-muted-foreground">{new Date(f.last_update).toLocaleDateString(lng)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-border/60 bg-card/60 p-5">
        <h3 className="mb-3 font-display text-xl font-bold">{tr("4 · Vérifier vous-même", "4 · Check it yourself")}</h3>
        <ol className="mb-4 list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
          <li>{tr("Téléchargez le registre des paris (CSV) et le manifeste.", "Download the bet ledger (CSV) and the manifest.")}</li>
          <li>{tr("Chaque ligne porte le slug du marché Polymarket public : vous pouvez ouvrir le marché et constater l'issue (gagnant/perdant).", "Each row carries the public Polymarket market slug: open the market and confirm the outcome.")}</li>
          <li>{tr("Calculez l'empreinte du fichier et comparez-la à celle du manifeste :", "Hash the file and compare with the manifest:")} <code className="rounded bg-muted px-1.5 py-0.5 text-xs">sha256sum lol_ledger.csv</code></li>
        </ol>
        <div className="mb-4 flex flex-wrap gap-2">
          {m.outputs.map((o) => (
            <a key={o.path} href={"/" + o.path} download className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-secondary">
              ⬇ {o.path.replace("data/", "")}
            </a>
          ))}
        </div>
        <VerifyButton m={m} />
        <p className="mt-3 text-xs text-muted-foreground">
          {tr("Manifeste généré le", "Manifest generated")} {new Date(m.generated_utc).toLocaleString(lng, { timeZone: "UTC" })} UTC
        </p>
      </div>
    </div>
  );
};
