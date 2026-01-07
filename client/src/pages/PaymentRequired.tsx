import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, QrCode, Copy, Check, MessageCircle } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface PaymentSettings {
  pixKey: string;
  whatsapp: string;
  instructions: string;
  price: string;
}

export default function PaymentRequired() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const { data: settings, isLoading } = useQuery<PaymentSettings>({
    queryKey: ["/api/public/payment-settings"],
    queryFn: async () => {
      const res = await fetch("/api/public/payment-settings");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const copyPixKey = () => {
    if (settings?.pixKey) {
      navigator.clipboard.writeText(settings.pixKey);
      setCopied(true);
      toast({ title: "Copiado!", description: "Chave Pix copiada para a área de transferência." });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const openWhatsApp = () => {
    if (settings?.whatsapp) {
      const phone = settings.whatsapp.replace(/\D/g, "");
      const message = encodeURIComponent("Olá! Realizei o pagamento da assinatura do Salva Plantão. Segue o comprovante:");
      window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md shadow-xl border-slate-200" data-testid="card-payment-required">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-4">
            <QrCode className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl font-display text-slate-900">Assinatura Necessária</CardTitle>
          <CardDescription className="text-base">
            Olá, {user?.firstName}! Para acessar o <strong>Salva Plantão</strong>, realize o pagamento via Pix.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : (
            <>
              <div className="bg-slate-100 p-4 rounded-lg text-center space-y-2">
                <p className="text-sm font-medium text-slate-500">Chave Pix:</p>
                <div 
                  className="flex items-center justify-center gap-2 cursor-pointer group"
                  onClick={copyPixKey}
                >
                  <p className="text-lg font-bold font-mono text-slate-900 select-all" data-testid="text-pix-key">
                    {settings?.pixKey || "Carregando..."}
                  </p>
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4 text-slate-400 group-hover:text-primary transition-colors" />
                  )}
                </div>
                <p className="text-xs text-slate-400">(Clique para copiar)</p>
              </div>
              
              <div className="text-sm text-slate-600 space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-500">Valor:</span>
                  <span className="font-bold text-lg text-slate-900" data-testid="text-price">
                    R$ {settings?.price || "29,90"} / mês
                  </span>
                </div>
                <p className="text-slate-500" data-testid="text-instructions">
                  {settings?.instructions || "Após o pagamento, envie o comprovante para liberação imediata."}
                </p>
              </div>
            </>
          )}
        </CardContent>
        <CardFooter className="flex justify-between border-t bg-slate-50/50 p-6 rounded-b-xl">
          <Button 
            variant="ghost" 
            onClick={() => logout()} 
            className="text-red-500 hover:text-red-600 hover:bg-red-50"
            data-testid="button-logout"
          >
            <LogOut className="mr-2 h-4 w-4" /> Sair
          </Button>
          <Button onClick={openWhatsApp} className="shadow-lg shadow-primary/25" data-testid="button-send-receipt">
            <MessageCircle className="mr-2 h-4 w-4" /> Enviar Comprovante
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
