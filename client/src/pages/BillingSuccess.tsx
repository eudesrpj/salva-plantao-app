import { useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Home } from "lucide-react";
import { queryClient } from "@/lib/queryClient";

export default function BillingSuccess() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["/api/billing/status"] });
    queryClient.invalidateQueries({ queryKey: ["/api/preview/status"] });
    queryClient.invalidateQueries({ queryKey: ["/api/user"] });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-b from-green-50 to-background dark:from-green-950/20 dark:to-background">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <div className="mx-auto bg-green-100 dark:bg-green-900/30 p-4 rounded-full w-fit mb-4">
            <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-2xl">Pagamento Confirmado!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Seu pagamento foi processado com sucesso. Sua assinatura está ativa e você já pode usar todas as funcionalidades do Salva Plantão.
          </p>
          <Button
            onClick={() => setLocation("/")}
            className="w-full"
            size="lg"
            data-testid="button-go-home"
          >
            <Home className="mr-2 h-4 w-4" />
            Ir para o Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
