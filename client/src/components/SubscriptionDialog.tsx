import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Crown, CreditCard, Loader2, Tag, Check, AlertCircle } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

interface Plan {
  id: number;
  name: string;
  slug: string;
  priceCents: number;
  priceDisplay: string;
  billingPeriod: string;
  cycle: string;
}

interface SubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SubscriptionDialog({ open, onOpenChange }: SubscriptionDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number; discountType: string } | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string>("mensal");

  const { data: plans, isLoading: plansLoading } = useQuery<Plan[]>({
    queryKey: ["/api/plans"],
    enabled: open,
  });

  const validateCouponMutation = useMutation({
    mutationFn: async (code: string) => {
      const res = await apiRequest("POST", "/api/subscription/validate-coupon", { code });
      return res.json();
    },
    onSuccess: (data) => {
      setAppliedCoupon({ 
        code: data.code, 
        discount: data.discountValue,
        discountType: data.discountType
      });
      toast({ 
        title: "Cupom aplicado!", 
        description: `Desconto de ${data.discountType === 'percentage' ? `${data.discountValue}%` : `R$ ${data.discountValue}`}` 
      });
    },
    onError: () => {
      toast({ title: "Cupom inválido", description: "Verifique o código e tente novamente.", variant: "destructive" });
    }
  });

  const checkoutMutation = useMutation({
    mutationFn: async (planSlug: string) => {
      const res = await apiRequest("POST", "/api/billing/checkout", { 
        planSlug, 
        couponCode: appliedCoupon?.code 
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast({ title: "Erro", description: "URL de checkout não disponível.", variant: "destructive" });
      }
    },
    onError: (error: any) => {
      toast({ title: "Erro ao criar checkout", description: error.message || "Tente novamente.", variant: "destructive" });
    }
  });

  const handleSubscribe = () => {
    checkoutMutation.mutate(selectedPlan);
  };

  const handleValidateCoupon = () => {
    if (couponCode.trim()) {
      validateCouponMutation.mutate(couponCode.trim());
    }
  };

  const getPlanPrice = (plan: Plan) => {
    const price = plan.priceCents / 100;
    if (appliedCoupon) {
      if (appliedCoupon.discountType === 'percentage') {
        return price * (1 - appliedCoupon.discount / 100);
      } else {
        return Math.max(price - appliedCoupon.discount, 0);
      }
    }
    return price;
  };

  const formatPrice = (value: number) => {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
  };

  const getPlanPeriodLabel = (period: string) => {
    switch (period) {
      case 'monthly': return '/mês';
      case 'semiannually': return '/semestre';
      case 'yearly': return '/ano';
      default: return '';
    }
  };

  const getPlanSavings = (plan: Plan) => {
    const monthlyPlan = plans?.find(p => p.slug === 'mensal');
    if (!monthlyPlan || plan.slug === 'mensal') return null;
    
    const monthlyPrice = monthlyPlan.priceCents / 100;
    const months = plan.billingPeriod === 'semiannually' ? 6 : 12;
    const regularTotal = monthlyPrice * months;
    const planPrice = plan.priceCents / 100;
    const savings = ((regularTotal - planPrice) / regularTotal * 100).toFixed(0);
    
    return parseInt(savings) > 0 ? `${savings}% de economia` : null;
  };

  if (user?.status === 'active' || user?.role === 'admin') {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md" data-testid="dialog-subscription">
          <DialogHeader className="text-center">
            <div className="mx-auto bg-green-100 dark:bg-green-900/30 p-4 rounded-full w-fit mb-2">
              <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <DialogTitle className="text-xl font-display">Você já é assinante!</DialogTitle>
            <DialogDescription>
              Sua assinatura está ativa. Obrigado por apoiar o Salva Plantão!
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => onOpenChange(false)} className="w-full mt-4">
            Fechar
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" data-testid="dialog-subscription">
        <DialogHeader className="text-center">
          <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-2">
            <Crown className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="text-xl font-display">Assinar Salva Plantão</DialogTitle>
          <DialogDescription>
            Olá{user?.firstName ? `, ${user.firstName}` : ''}! Escolha seu plano e desbloqueie acesso completo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {plansLoading ? (
            <div className="flex justify-center py-6">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : (
            <>
              <div className="grid gap-3">
                {plans?.map((plan) => {
                  const isSelected = selectedPlan === plan.slug;
                  const finalPrice = getPlanPrice(plan);
                  const savings = getPlanSavings(plan);
                  
                  return (
                    <button
                      key={plan.id}
                      onClick={() => setSelectedPlan(plan.slug)}
                      className={cn(
                        "relative p-4 rounded-lg border-2 text-left transition-all",
                        isSelected
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border hover:border-primary/50"
                      )}
                      data-testid={`button-plan-${plan.slug}`}
                    >
                      {savings && (
                        <span className="absolute -top-2 right-3 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                          {savings}
                        </span>
                      )}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{plan.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatPrice(finalPrice)}{getPlanPeriodLabel(plan.billingPeriod)}
                          </p>
                        </div>
                        <div className={cn(
                          "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                          isSelected ? "border-primary bg-primary" : "border-muted-foreground"
                        )}>
                          {isSelected && <Check className="h-3 w-3 text-white" />}
                        </div>
                      </div>
                      {appliedCoupon && (
                        <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                          Original: {plan.priceDisplay}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="space-y-2">
                <Label htmlFor="coupon">Cupom de desconto (opcional)</Label>
                <div className="flex gap-2">
                  <Input
                    id="coupon"
                    placeholder="Digite o código"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    data-testid="input-coupon"
                  />
                  <Button
                    variant="outline"
                    onClick={handleValidateCoupon}
                    disabled={!couponCode.trim() || validateCouponMutation.isPending}
                    data-testid="button-validate-coupon"
                  >
                    {validateCouponMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Tag className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {appliedCoupon && (
                  <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                    <Check className="h-3 w-3" /> Cupom {appliedCoupon.code} aplicado
                  </p>
                )}
              </div>

              <Button
                onClick={handleSubscribe}
                className="w-full"
                size="lg"
                disabled={checkoutMutation.isPending}
                data-testid="button-subscribe-checkout"
              >
                {checkoutMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CreditCard className="mr-2 h-4 w-4" />
                )}
                Assinar Agora
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Pagamento seguro via PIX ou cartão de crédito. Você será redirecionado para finalizar.
              </p>
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

interface PaywallModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message?: string;
}

export function PaywallModal({ open, onOpenChange, message }: PaywallModalProps) {
  const { user } = useAuth();
  
  if (user?.status === 'active' || user?.role === 'admin') {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="dialog-paywall">
        <DialogHeader className="text-center">
          <div className="mx-auto bg-amber-100 dark:bg-amber-900/30 p-4 rounded-full w-fit mb-2">
            <AlertCircle className="h-8 w-8 text-amber-600 dark:text-amber-400" />
          </div>
          <DialogTitle className="text-xl font-display">Assinatura Necessária</DialogTitle>
          <DialogDescription>
            {message || "Sua assinatura está inativa. Assine para continuar usando o Salva Plantão."}
          </DialogDescription>
        </DialogHeader>
        <SubscriptionDialogContent onComplete={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function SubscriptionDialogContent({ onComplete }: { onComplete?: () => void }) {
  const { toast } = useToast();
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number; discountType: string } | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string>("mensal");

  const { data: plans, isLoading: plansLoading } = useQuery<Plan[]>({
    queryKey: ["/api/plans"],
  });

  const validateCouponMutation = useMutation({
    mutationFn: async (code: string) => {
      const res = await apiRequest("POST", "/api/subscription/validate-coupon", { code });
      return res.json();
    },
    onSuccess: (data) => {
      setAppliedCoupon({ 
        code: data.code, 
        discount: data.discountValue,
        discountType: data.discountType
      });
      toast({ title: "Cupom aplicado!" });
    },
    onError: () => {
      toast({ title: "Cupom inválido", variant: "destructive" });
    }
  });

  const checkoutMutation = useMutation({
    mutationFn: async (planSlug: string) => {
      const res = await apiRequest("POST", "/api/billing/checkout", { 
        planSlug, 
        couponCode: appliedCoupon?.code 
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error: any) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  });

  if (plansLoading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const selectedPlanData = plans?.find(p => p.slug === selectedPlan);
  const price = selectedPlanData ? (selectedPlanData.priceCents / 100) : 29.90;
  const finalPrice = appliedCoupon 
    ? (appliedCoupon.discountType === 'percentage' 
        ? price * (1 - appliedCoupon.discount / 100)
        : Math.max(price - appliedCoupon.discount, 0))
    : price;

  return (
    <div className="space-y-4 py-2">
      <div className="flex gap-2 justify-center">
        {plans?.map(plan => (
          <button
            key={plan.id}
            onClick={() => setSelectedPlan(plan.slug)}
            className={cn(
              "px-3 py-2 rounded-lg text-sm font-medium transition-all",
              selectedPlan === plan.slug
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-muted/80"
            )}
          >
            {plan.name.replace('Plano ', '')}
          </button>
        ))}
      </div>

      <div className="text-center">
        <p className="text-2xl font-bold">R$ {finalPrice.toFixed(2).replace('.', ',')}</p>
        {appliedCoupon && <p className="text-xs text-green-600">Cupom aplicado!</p>}
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Código do cupom"
          value={couponCode}
          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
          data-testid="input-coupon-paywall"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => validateCouponMutation.mutate(couponCode)}
          disabled={!couponCode || validateCouponMutation.isPending}
        >
          {validateCouponMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Aplicar"}
        </Button>
      </div>

      <Button
        className="w-full"
        onClick={() => checkoutMutation.mutate(selectedPlan)}
        disabled={checkoutMutation.isPending}
        data-testid="button-paywall-subscribe"
      >
        {checkoutMutation.isPending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <CreditCard className="mr-2 h-4 w-4" />
        )}
        Assinar Agora
      </Button>
    </div>
  );
}
