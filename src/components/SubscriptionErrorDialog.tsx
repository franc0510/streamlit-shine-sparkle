import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { AlertCircle, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DiagnosticStep {
  name: string;
  status: "pending" | "success" | "error" | "loading";
  message?: string;
  details?: string;
}

interface SubscriptionErrorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  diagnostics: DiagnosticStep[];
  onRetry: () => void;
}

export const SubscriptionErrorDialog = ({
  open,
  onOpenChange,
  diagnostics,
  onRetry,
}: SubscriptionErrorDialogProps) => {
  const hasErrors = diagnostics.some((d) => d.status === "error");
  const isLoading = diagnostics.some((d) => d.status === "loading");

  const getStatusIcon = (status: DiagnosticStep["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "error":
        return <XCircle className="w-5 h-5 text-destructive" />;
      case "loading":
        return <Loader2 className="w-5 h-5 text-primary animate-spin" />;
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-muted" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-destructive" />
            Diagnostic de la redirection Stripe
          </DialogTitle>
          <DialogDescription>
            {hasErrors
              ? "Des problèmes ont été détectés lors de la tentative de redirection"
              : isLoading
              ? "Vérification en cours..."
              : "Tous les contrôles sont passés"}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[400px] pr-4">
          <div className="space-y-4">
            {diagnostics.map((step, index) => (
              <div
                key={index}
                className="flex gap-3 p-3 rounded-lg bg-muted/50 border border-border"
              >
                <div className="flex-shrink-0 mt-0.5">
                  {getStatusIcon(step.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{step.name}</p>
                  {step.message && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {step.message}
                    </p>
                  )}
                  {step.details && step.status === "error" && (
                    <div className="mt-2 p-2 bg-destructive/10 rounded text-xs font-mono break-all">
                      {step.details}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="flex gap-2 justify-end mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
          {hasErrors && (
            <Button onClick={onRetry} disabled={isLoading}>
              {isLoading ? "Vérification..." : "Réessayer"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
