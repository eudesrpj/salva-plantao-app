import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import characterImage from "@assets/Gemini_Generated_Image_otqqaqotqqaqotqq_1767828384979.png";

interface OneTimeMessagesResponse {
  payment: { shouldShow: boolean };
  donation: { shouldShow: boolean; socialCauseName?: string };
}

export function OneTimeMessageOverlay() {
  const [dismissedPayment, setDismissedPayment] = useState(false);
  const [dismissedDonation, setDismissedDonation] = useState(false);

  const { data, isLoading } = useQuery<OneTimeMessagesResponse>({
    queryKey: ["/api/one-time-messages"],
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  const ackMutation = useMutation({
    mutationFn: async (type: "payment" | "donation") => {
      await apiRequest("POST", "/api/one-time-messages/ack", { type });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/one-time-messages"] });
    },
  });

  const handleDismissPayment = () => {
    setDismissedPayment(true);
    ackMutation.mutate("payment");
  };

  const handleDismissDonation = () => {
    setDismissedDonation(true);
    ackMutation.mutate("donation");
  };

  if (isLoading) return null;

  const showPayment = data?.payment.shouldShow && !dismissedPayment;
  const showDonation = data?.donation.shouldShow && !dismissedDonation;

  if (!showPayment && !showDonation) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" data-testid="overlay-one-time-messages">
      {showPayment && (
        <Card className="relative max-w-md w-full animate-in fade-in slide-in-from-bottom-4 duration-300 shadow-xl" data-testid="card-payment-welcome">
          <Button
            size="icon"
            variant="ghost"
            className="absolute top-2 right-2"
            onClick={handleDismissPayment}
            data-testid="button-close-payment"
          >
            <X className="h-4 w-4" />
          </Button>
          <CardContent className="pt-6 pb-6">
            <div className="flex items-start gap-4">
              <div className="shrink-0 w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                <img 
                  src={characterImage} 
                  alt="Salva Plantão" 
                  className="w-full h-full object-cover scale-110"
                />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Bem-vindo ao plantão!
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Obrigado por confiar no Salva Plantão.
                  <br />
                  Agora você tem mais agilidade, mais segurança e menos dor de cabeça no plantão.
                  <br />
                  <span className="font-medium text-foreground">Bora trabalhar juntos.</span>
                </p>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={handleDismissPayment} data-testid="button-confirm-payment">
                Fechar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {showDonation && !showPayment && (
        <Card className="relative max-w-md w-full animate-in fade-in slide-in-from-bottom-4 duration-300 shadow-xl" data-testid="card-donation-thanks">
          <Button
            size="icon"
            variant="ghost"
            className="absolute top-2 right-2"
            onClick={handleDismissDonation}
            data-testid="button-close-donation"
          >
            <X className="h-4 w-4" />
          </Button>
          <CardContent className="pt-6 pb-6">
            <div className="flex items-start gap-4">
              <div className="shrink-0 w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center opacity-90">
                <img 
                  src={characterImage} 
                  alt="Salva Plantão" 
                  className="w-full h-full object-cover scale-110 grayscale-[10%]"
                />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Obrigado por apoiar uma causa
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Sua doação será destinada integralmente a uma causa social, descontados apenas os custos operacionais e impostos.
                  <br /><br />
                  <span className="text-foreground">Hoje, você ajudou a apoiar:</span>
                  <br />
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {data?.donation.socialCauseName || "Causa social"}
                  </span>
                  <br /><br />
                  Gestos assim mudam vidas. Obrigado por fazer parte disso.
                </p>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={handleDismissDonation} data-testid="button-confirm-donation">
                Fechar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
