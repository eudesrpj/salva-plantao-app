import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { QrCode, Copy, Check, MessageCircle, Crown } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

interface PaymentSettings {
  pixKey: string;
  whatsapp: string;
  instructions: string;
  price: string;
}

interface SubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SubscriptionDialog({ open, onOpenChange }: SubscriptionDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const { data: settings, isLoading } = useQuery<PaymentSettings>({
    queryKey: ["/api/public/payment-settings"],
    queryFn: async () => {
      const res = await fetch("/api/public/payment-settings");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: open,
  });

  const copyPixKey = () => {
    if (settings?.pixKey) {
      navigator.clipboard.writeText(settings.pixKey);
      setCopied(true);
      toast({ title: "Copiado!", description: "Chave Pix copiada para a \u00e1rea de transfer\u00eancia." });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const openWhatsApp = () => {
    if (settings?.whatsapp) {
      const phone = settings.whatsapp.replace(/\D/g, "");
      const message = encodeURIComponent("Ol\u00e1! Realizei o pagamento da assinatura do Salva Plant\u00e3o. Segue o comprovante:");
      window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="dialog-subscription">
        <DialogHeader className="text-center">
          <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-2">
            <Crown className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="text-xl font-display">Assinar Salva Plant\u00e3o</DialogTitle>
          <DialogDescription>
            Ol\u00e1, {user?.firstName}! Desbloqueie acesso completo ao aplicativo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isLoading ? (
            <div className="flex justify-center py-6">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : (
            <>
              <div className="bg-muted p-4 rounded-lg text-center space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Chave Pix:</p>
                <div
                  className="flex items-center justify-center gap-2 cursor-pointer group"
                  onClick={copyPixKey}
                  data-testid="button-copy-pix"
                >
                  <p className="text-base font-bold font-mono select-all" data-testid="text-pix-key">
                    {settings?.pixKey || "Carregando..."}
                  </p>
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">(Clique para copiar)</p>
              </div>

              <div className="text-sm space-y-3">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">Valor:</span>
                  <span className="font-bold text-lg" data-testid="text-price">
                    R$ {settings?.price || "29,90"} / m\u00eas
                  </span>
                </div>
                <p className="text-muted-foreground text-sm" data-testid="text-instructions">
                  {settings?.instructions || "Ap\u00f3s o pagamento, envie o comprovante para libera\u00e7\u00e3o imediata."}
                </p>
              </div>

              <Button onClick={openWhatsApp} className="w-full" size="lg" data-testid="button-send-receipt">
                <MessageCircle className="mr-2 h-4 w-4" /> Enviar Comprovante via WhatsApp
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function SubscribeButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();

  if (user?.status === "active" || user?.role === "admin") {
    return null;
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className={className}
        data-testid="button-subscribe"
      >
        <Crown className="mr-2 h-4 w-4" /> Assinar
      </Button>
      <SubscriptionDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
