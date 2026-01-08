import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { LogOut, QrCode, Copy, Check, MessageCircle, CreditCard, Tag, Loader2, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface PaymentSettings {
  pixKey: string;
  whatsapp: string;
  instructions: string;
  price: string;
}

interface PlanData {
  name: string;
  priceCents: number;
  billingPeriod: string;
}

interface CouponData {
  valid: boolean;
  id: number;
  code: string;
  discountType: string;
  discountValue: string;
  discountMonths: number;
}

interface CreateSubscriptionResponse {
  subscription: any;
  payment: any;
  pixQrCode?: string;
  pixCopyPaste?: string;
  invoiceUrl?: string;
  message?: string;
}

export default function PaymentRequired() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<CouponData | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"PIX" | "CREDIT_CARD">("PIX");
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const [paymentData, setPaymentData] = useState<CreateSubscriptionResponse | null>(null);

  const { data: settings, isLoading: loadingSettings } = useQuery<PaymentSettings>({
    queryKey: ["/api/public/payment-settings"],
  });

  const { data: plan } = useQuery<PlanData>({
    queryKey: ["/api/subscription/plan"],
  });

  const validateCouponMutation = useMutation({
    mutationFn: async (code: string) => {
      const res = await apiRequest("POST", "/api/subscription/validate-coupon", { code });
      return res.json();
    },
    onSuccess: (data: CouponData) => {
      setAppliedCoupon(data);
      toast({
        title: "Cupom aplicado!",
        description: `Desconto de ${data.discountType === "percentage" ? data.discountValue + "%" : "R$ " + data.discountValue} aplicado.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Cupom inválido",
        description: error.message || "Não foi possível aplicar o cupom.",
        variant: "destructive",
      });
    },
  });

  const createSubscriptionMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/subscription/create", {
        paymentMethod,
        couponCode: appliedCoupon?.code,
        name: user?.firstName,
      });
      return res.json();
    },
    onSuccess: (data: CreateSubscriptionResponse) => {
      setPaymentData(data);
      setShowPaymentDetails(true);
      if (data.message) {
        toast({
          title: "Assinatura criada",
          description: data.message,
        });
      } else {
        toast({
          title: "Pagamento gerado!",
          description: paymentMethod === "PIX" ? "Use o QR Code ou código para pagar." : "Acesse o link de pagamento.",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar assinatura",
        description: error.message || "Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const priceCents = plan?.priceCents || 2990;
  const discountCents = appliedCoupon
    ? appliedCoupon.discountType === "percentage"
      ? Math.floor(priceCents * (Number(appliedCoupon.discountValue) / 100))
      : Math.floor(Number(appliedCoupon.discountValue) * 100)
    : 0;
  const finalPrice = (priceCents - discountCents) / 100;

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: "Copiado!", description: "Código copiado para a área de transferência." });
    setTimeout(() => setCopied(false), 2000);
  };

  const openWhatsApp = () => {
    if (settings?.whatsapp) {
      const phone = settings.whatsapp.replace(/\D/g, "");
      const message = encodeURIComponent("Olá! Realizei o pagamento da assinatura do Salva Plantão. Segue o comprovante:");
      window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
    }
  };

  if (showPaymentDetails && paymentData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
        <Card className="w-full max-w-md shadow-xl" data-testid="card-payment-details">
          <CardHeader className="text-center">
            <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-4">
              {paymentMethod === "PIX" ? (
                <QrCode className="h-10 w-10 text-primary" />
              ) : (
                <CreditCard className="h-10 w-10 text-primary" />
              )}
            </div>
            <CardTitle className="text-2xl">Pagamento {paymentMethod}</CardTitle>
            <CardDescription>
              Complete o pagamento para ativar sua assinatura
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {paymentMethod === "PIX" && paymentData.pixQrCode && (
              <div className="text-center space-y-4">
                <div className="bg-white p-4 rounded-lg inline-block">
                  <img
                    src={`data:image/png;base64,${paymentData.pixQrCode}`}
                    alt="QR Code PIX"
                    className="w-48 h-48 mx-auto"
                    data-testid="img-pix-qrcode"
                  />
                </div>
                {paymentData.pixCopyPaste && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Ou copie o código PIX:</p>
                    <div
                      className="flex items-center gap-2 p-3 bg-muted rounded-lg cursor-pointer"
                      onClick={() => copyText(paymentData.pixCopyPaste!)}
                      data-testid="button-copy-pix"
                    >
                      <code className="flex-1 text-xs break-all">
                        {paymentData.pixCopyPaste.substring(0, 50)}...
                      </code>
                      {copied ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {paymentData.invoiceUrl && paymentMethod === "CREDIT_CARD" && (
              <Button
                className="w-full"
                onClick={() => window.open(paymentData.invoiceUrl, "_blank")}
                data-testid="button-open-invoice"
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Pagar com Cartão
              </Button>
            )}

            {paymentData.message && (
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 rounded-lg text-sm">
                {paymentData.message}
              </div>
            )}

            <div className="flex justify-between items-center py-2 border-t">
              <span className="text-muted-foreground">Total:</span>
              <span className="font-bold text-lg" data-testid="text-total-price">
                R$ {finalPrice.toFixed(2).replace(".", ",")}
              </span>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button variant="outline" className="w-full" onClick={openWhatsApp} data-testid="button-whatsapp">
              <MessageCircle className="mr-2 h-4 w-4" />
              Enviar Comprovante via WhatsApp
            </Button>
            <Button
              variant="ghost"
              className="w-full text-muted-foreground"
              onClick={() => setShowPaymentDetails(false)}
              data-testid="button-back"
            >
              Voltar
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <Card className="w-full max-w-md shadow-xl" data-testid="card-payment-required">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-4">
            <CheckCircle2 className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl">Assine o Salva Plantão</CardTitle>
          <CardDescription className="text-base">
            Olá, {user?.firstName}! Ative sua assinatura para acessar todos os recursos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {loadingSettings ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="bg-muted/50 p-4 rounded-lg text-center space-y-2">
                <Badge variant="secondary" className="mb-2">Plano Mensal</Badge>
                <div className="flex items-center justify-center gap-2">
                  {discountCents > 0 && (
                    <span className="text-lg text-muted-foreground line-through">
                      R$ {(priceCents / 100).toFixed(2).replace(".", ",")}
                    </span>
                  )}
                  <span className="text-3xl font-bold text-foreground" data-testid="text-final-price">
                    R$ {finalPrice.toFixed(2).replace(".", ",")}
                  </span>
                  <span className="text-muted-foreground">/mês</span>
                </div>
                {appliedCoupon && (
                  <Badge variant="default" className="mt-2">
                    <Tag className="mr-1 h-3 w-3" />
                    Cupom {appliedCoupon.code} aplicado
                  </Badge>
                )}
              </div>

              <div className="space-y-3">
                <Label>Cupom de desconto</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Digite o código do cupom"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    disabled={!!appliedCoupon}
                    data-testid="input-coupon"
                  />
                  {appliedCoupon ? (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setAppliedCoupon(null);
                        setCouponCode("");
                      }}
                      data-testid="button-remove-coupon"
                    >
                      Remover
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => validateCouponMutation.mutate(couponCode)}
                      disabled={!couponCode || validateCouponMutation.isPending}
                      data-testid="button-apply-coupon"
                    >
                      {validateCouponMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Aplicar"
                      )}
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <Label>Forma de pagamento</Label>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant={paymentMethod === "PIX" ? "default" : "outline"}
                    className="h-auto py-4 flex flex-col gap-1"
                    onClick={() => setPaymentMethod("PIX")}
                    data-testid="button-payment-pix"
                  >
                    <QrCode className="h-6 w-6" />
                    <span>PIX</span>
                  </Button>
                  <Button
                    type="button"
                    variant={paymentMethod === "CREDIT_CARD" ? "default" : "outline"}
                    className="h-auto py-4 flex flex-col gap-1"
                    onClick={() => setPaymentMethod("CREDIT_CARD")}
                    data-testid="button-payment-card"
                  >
                    <CreditCard className="h-6 w-6" />
                    <span>Cartão</span>
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-3 border-t bg-muted/30 p-6 rounded-b-xl">
          <Button
            className="w-full shadow-lg"
            size="lg"
            onClick={() => createSubscriptionMutation.mutate()}
            disabled={createSubscriptionMutation.isPending}
            data-testid="button-subscribe"
          >
            {createSubscriptionMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                Assinar por R$ {finalPrice.toFixed(2).replace(".", ",")} / mês
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            onClick={() => logout()}
            className="text-destructive hover:text-destructive"
            data-testid="button-logout"
          >
            <LogOut className="mr-2 h-4 w-4" /> Sair
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
