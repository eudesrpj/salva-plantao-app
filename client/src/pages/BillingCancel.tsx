import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle, Home, RefreshCw } from "lucide-react";

export default function BillingCancel() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-b from-amber-50 to-background dark:from-amber-950/20 dark:to-background">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <div className="mx-auto bg-amber-100 dark:bg-amber-900/30 p-4 rounded-full w-fit mb-4">
            <XCircle className="h-12 w-12 text-amber-600 dark:text-amber-400" />
          </div>
          <CardTitle className="text-2xl">Pagamento Não Concluído</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Seu pagamento não foi finalizado. Você pode tentar novamente a qualquer momento.
          </p>
          <div className="flex flex-col gap-2">
            <Button
              onClick={() => setLocation("/")}
              className="w-full"
              size="lg"
              data-testid="button-go-home"
            >
              <Home className="mr-2 h-4 w-4" />
              Voltar ao App
            </Button>
            <Button
              variant="outline"
              onClick={() => window.history.back()}
              className="w-full"
              data-testid="button-try-again"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Tentar Novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
