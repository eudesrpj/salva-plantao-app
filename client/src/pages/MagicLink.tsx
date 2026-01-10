import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

export default function MagicLink() {
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const token = params.get("token");
  const errorParam = params.get("error");
  
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    errorParam ? "error" : "loading"
  );
  const [errorMessage, setErrorMessage] = useState(
    errorParam === "expired_token" ? "Link expirado" : 
    errorParam === "invalid_token" ? "Link invalido" : 
    errorParam ? "Erro ao verificar link" : ""
  );

  useEffect(() => {
    if (!token || errorParam) return;

    const verifyToken = async () => {
      try {
        const response = await fetch(`/api/auth/email/verify-magic?token=${encodeURIComponent(token)}`, {
          method: "GET",
          credentials: "include"
        });
        
        if (response.redirected) {
          window.location.href = response.url;
          return;
        }
        
        if (response.ok) {
          setStatus("success");
          setTimeout(() => {
            navigate("/");
          }, 1500);
        } else {
          const data = await response.json().catch(() => ({}));
          setStatus("error");
          setErrorMessage(data.message || "Link invalido ou expirado");
        }
      } catch (err) {
        setStatus("error");
        setErrorMessage("Erro ao verificar link");
      }
    };

    verifyToken();
  }, [token, errorParam, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4" data-testid="magic-link-page">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">
            Salva Plantao
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8">
          {status === "error" ? (
            <>
              <XCircle className="w-16 h-16 text-destructive mb-4" />
              <p className="text-lg font-medium text-center mb-2">{errorMessage || "Link invalido ou expirado"}</p>
              <p className="text-sm text-muted-foreground text-center mb-4">
                Por favor, solicite um novo codigo de acesso
              </p>
              <Button onClick={() => navigate("/login")} data-testid="button-go-login">
                Ir para login
              </Button>
            </>
          ) : status === "success" ? (
            <>
              <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
              <p className="text-lg font-medium text-center mb-2">Login realizado!</p>
              <p className="text-sm text-muted-foreground text-center">
                Redirecionando...
              </p>
            </>
          ) : (
            <>
              <Loader2 className="w-16 h-16 text-primary animate-spin mb-4" />
              <p className="text-lg font-medium text-center mb-2">Verificando...</p>
              <p className="text-sm text-muted-foreground text-center">
                Aguarde um momento
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
