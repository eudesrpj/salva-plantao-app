import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Check, CreditCard, QrCode, Tag } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface BillingPlan {
  id: number;
  code: string;
  name: string;
  description: string;
  priceCents: number;
  originalPriceCents: number | null;
  durationDays: number;
  discountPercent: number;
  isActive: boolean;
}

interface PaywallModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PaywallModal({ open, onOpenChange }: PaywallModalProps) {
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<string>("monthly");
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountCents: number } | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  const { data: plans = [], isLoading: isLoadingPlans } = useQuery<BillingPlan[]>({
    queryKey: ["/api/billing/plans"],
    enabled: open
  });

  const checkoutMutation = useMutation({
    mutationFn: async (data: { planCode: string; couponCode?: string }) => {
      return apiRequest("POST", "/api/billing/checkout", data);
    },
    onSuccess: (data: any) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao processar pagamento",
        variant: "destructive"
      });
    }
  });

  const handleValidateCoupon = async () => {
    if (!couponCode.trim()) return;

    setIsValidatingCoupon(true);
    try {
      const result: any = await apiRequest("POST", "/api/billing/validate-coupon", {
        couponCode: couponCode.trim().toUpperCase(),
        planCode: selectedPlan
      });

      if (result.valid) {
        setAppliedCoupon({
          code: couponCode.trim().toUpperCase(),
          discountCents: result.discountCents || 0
        });
        toast({
          title: "Cupom aplicado!",
          description: `Desconto de R$ ${(result.discountCents / 100).toFixed(2)}`
        });
      } else {
        toast({
          title: "Cupom invalido",
          description: result.message || "Cupom nao encontrado",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao validar cupom",
        variant: "destructive"
      });
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleCheckout = () => {
    checkoutMutation.mutate({
      planCode: selectedPlan,
      couponCode: appliedCoupon?.code
    });
  };

  const selectedPlanData = plans.find(p => p.code === selectedPlan);
  const finalPrice = selectedPlanData
    ? (selectedPlanData.priceCents - (appliedCoupon?.discountCents || 0)) / 100
    : 0;

  const formatPrice = (cents: number) => {
    return `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" data-testid="paywall-modal">
        <DialogHeader>
          <DialogTitle className="text-xl">Assine o Salva Plantao</DialogTitle>
          <DialogDescription>
            Escolha seu plano e tenha acesso completo a todos os recursos
          </DialogDescription>
        </DialogHeader>

        {isLoadingPlans ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            <RadioGroup value={selectedPlan} onValueChange={setSelectedPlan}>
              <div className="space-y-3">
                {plans.map((plan) => (
                  <Card 
                    key={plan.code}
                    className={`cursor-pointer transition-colors ${
                      selectedPlan === plan.code ? "border-primary" : ""
                    }`}
                    onClick={() => setSelectedPlan(plan.code)}
                    data-testid={`plan-card-${plan.code}`}
                  >
                    <CardHeader className="p-4 pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <RadioGroupItem value={plan.code} id={plan.code} />
                          <div>
                            <CardTitle className="text-base">{plan.name}</CardTitle>
                            <CardDescription className="text-xs">
                              {plan.durationDays} dias de acesso
                            </CardDescription>
                          </div>
                        </div>
                        <div className="text-right">
                          {plan.originalPriceCents && plan.originalPriceCents > plan.priceCents && (
                            <p className="text-xs text-muted-foreground line-through">
                              {formatPrice(plan.originalPriceCents)}
                            </p>
                          )}
                          <p className="text-lg font-bold text-primary">
                            {formatPrice(plan.priceCents)}
                          </p>
                          {plan.discountPercent > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              -{plan.discountPercent}%
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </RadioGroup>

            <div className="space-y-2">
              <Label htmlFor="coupon">Cupom de desconto</Label>
              <div className="flex gap-2">
                <Input
                  id="coupon"
                  placeholder="CODIGO"
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
                    onClick={handleValidateCoupon}
                    disabled={!couponCode.trim() || isValidatingCoupon}
                    data-testid="button-apply-coupon"
                  >
                    {isValidatingCoupon ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Tag className="w-4 h-4" />
                    )}
                  </Button>
                )}
              </div>
              {appliedCoupon && (
                <p className="text-sm text-green-600">
                  Cupom {appliedCoupon.code} aplicado: -{formatPrice(appliedCoupon.discountCents)}
                </p>
              )}
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-medium">Total:</span>
                <span className="text-2xl font-bold text-primary">
                  R$ {finalPrice.toFixed(2).replace(".", ",")}
                </span>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={handleCheckout}
                disabled={checkoutMutation.isPending || !selectedPlan}
                data-testid="button-checkout"
              >
                {checkoutMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <CreditCard className="w-4 h-4 mr-2" />
                )}
                Assinar agora
              </Button>

              <p className="text-xs text-center text-muted-foreground mt-3">
                Pagamento seguro via Pix ou cartao de credito
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
