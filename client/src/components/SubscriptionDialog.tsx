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
import { Crown, CreditCard, Loader2, Tag } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";

interface Plan {
  id: number;
  name: string;
  slug: string;
  priceCents: number;
}

interface SubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SubscriptionDialog({ open, onOpenChange }: SubscriptionDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);

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
      const discount = data.discountType === 'percentage' 
        ? data.discountValue 
        : (data.discountValue * 100);
      setAppliedCoupon({ code: data.code, discount });
      toast({ title: "Cupom aplicado!", description: `Desconto de ${data.discountType === 'percentage' ? `${data.discountValue}%` : `R$ ${data.discountValue}`}` });
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

  const handleSubscribe = (planSlug: string) => {
    checkoutMutation.mutate(planSlug);
  };

  const handleValidateCoupon = () => {
    if (couponCode.trim()) {
      validateCouponMutation.mutate(couponCode.trim());
    }
  };

  const monthlyPlan = plans?.find(p => p.slug === 'mensal');
  const price = monthlyPlan ? (monthlyPlan.priceCents / 100).toFixed(2).replace('.', ',') : "29,90";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="dialog-subscription">
        <DialogHeader className="text-center">
          <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-2">
            <Crown className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="text-xl font-display">Assinar Salva Plantão</DialogTitle>
          <DialogDescription>
            Olá, {user?.firstName}! Desbloqueie acesso completo ao aplicativo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {plansLoading ? (
            <div className="flex justify-center py-6">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : (
            <>
              <div className="bg-muted p-4 rounded-lg text-center space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Assinatura Mensal</p>
                <p className="text-3xl font-bold" data-testid="text-price">
                  R$ {price}
                  <span className="text-sm font-normal text-muted-foreground">/mês</span>
                </p>
                {appliedCoupon && (
                  <p className="text-sm text-green-600 dark:text-green-400">
                    Cupom aplicado: {appliedCoupon.code}
                  </p>
                )}
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
              </div>

              <Button
                onClick={() => handleSubscribe('mensal')}
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
                Você será redirecionado para a página de pagamento seguro.
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
