import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { PageLoader } from "@/components/ui/loading-spinner";
import { Heart, CreditCard, QrCode, Copy, Check, ArrowRight, Loader2, ExternalLink, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { DonationCause, Donation } from "@shared/schema";

const PRESET_AMOUNTS = [200, 500, 1000, 2000, 5000, 10000];

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
}

export default function Donate() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCause, setSelectedCause] = useState<DonationCause | null>(null);
  const [amountCents, setAmountCents] = useState(1000);
  const [customAmount, setCustomAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "card">("pix");
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [currentDonation, setCurrentDonation] = useState<Donation | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: causes, isLoading } = useQuery<DonationCause[]>({
    queryKey: ["/api/donation-causes?activeOnly=true"],
  });

  const { data: selectedCauseDetails } = useQuery<DonationCause>({
    queryKey: selectedCause?.id ? [`/api/donation-causes/${selectedCause.id}`] : ["disabled"],
    enabled: !!selectedCause?.id,
  });

  const createDonationMutation = useMutation({
    mutationFn: async (data: { causeId: number; amountCents: number; provider: string }) => {
      const res = await apiRequest("POST", "/api/donations", data);
      return res.json() as Promise<Donation>;
    },
    onSuccess: (donation: Donation) => {
      setCurrentDonation(donation);
      setShowPaymentDialog(true);
      queryClient.invalidateQueries({ queryKey: ["/api/donations"] });
    },
    onError: () => {
      toast({ title: "Erro ao iniciar doação", variant: "destructive" });
    },
  });

  const handleAmountChange = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    setCustomAmount(cleaned);
    if (cleaned) {
      const cents = parseInt(cleaned) * 100;
      if (cents >= 200) {
        setAmountCents(cents);
      }
    }
  };

  const handlePresetAmount = (cents: number) => {
    setAmountCents(cents);
    setCustomAmount((cents / 100).toString());
  };

  const handleDonate = () => {
    if (!selectedCause) {
      toast({ title: "Selecione uma causa", variant: "destructive" });
      return;
    }
    if (amountCents < 200) {
      toast({ title: "Valor mínimo: R$ 2,00", variant: "destructive" });
      return;
    }
    createDonationMutation.mutate({
      causeId: selectedCause.id,
      amountCents,
      provider: paymentMethod === "pix" ? "PIX" : "CARD",
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: "Código PIX copiado!" });
    setTimeout(() => setCopied(false), 3000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <PageLoader text="Carregando causas..." />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Heart className="h-8 w-8 text-rose-500 fill-rose-500" />
          <h1 className="text-3xl font-bold">Faça uma Doação</h1>
        </div>
        <p className="text-muted-foreground">
          Escolha uma causa e contribua com qualquer valor a partir de R$ 2,00
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-4">1. Escolha uma causa</h2>
          {(!causes || causes.length === 0) ? (
            <Card className="p-8 text-center">
              <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">Nenhuma causa disponível no momento.</p>
              <p className="text-sm text-muted-foreground mt-2">Volte em breve!</p>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {causes.map((cause) => (
                <Card
                  key={cause.id}
                  className={`p-4 cursor-pointer transition-all hover-elevate ${
                    selectedCause?.id === cause.id 
                      ? "ring-2 ring-primary bg-primary/5" 
                      : ""
                  }`}
                  onClick={() => setSelectedCause(cause)}
                  data-testid={`card-cause-${cause.id}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-full ${
                      selectedCause?.id === cause.id 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-muted"
                    }`}>
                      <Heart className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{cause.title}</h3>
                      {cause.description && (
                        <p className="text-sm text-muted-foreground mt-1">{cause.description}</p>
                      )}
                      {cause.category && (
                        <Badge variant="outline" className="mt-2">{cause.category}</Badge>
                      )}
                    </div>
                    {selectedCause?.id === cause.id && (
                      <Check className="h-5 w-5 text-primary" />
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {selectedCause && (
          <>
            <div>
              <h2 className="text-lg font-semibold mb-4">2. Escolha o valor</h2>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-4">
                {PRESET_AMOUNTS.map((preset) => (
                  <Button
                    key={preset}
                    variant={amountCents === preset ? "default" : "outline"}
                    onClick={() => handlePresetAmount(preset)}
                    className="text-sm"
                    data-testid={`button-amount-${preset}`}
                  >
                    {formatCurrency(preset)}
                  </Button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">R$</span>
                <Input
                  type="text"
                  placeholder="Outro valor"
                  value={customAmount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  className="max-w-32"
                  data-testid="input-custom-amount"
                />
                {amountCents < 200 && customAmount && (
                  <span className="text-sm text-destructive">Mínimo: R$ 2,00</span>
                )}
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-4">3. Forma de pagamento</h2>
              <Tabs value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as "pix" | "card")}>
                <TabsList className="grid w-full grid-cols-2 max-w-md">
                  <TabsTrigger value="pix" className="gap-2" data-testid="tab-pix">
                    <QrCode className="h-4 w-4" />
                    PIX
                  </TabsTrigger>
                  <TabsTrigger value="card" className="gap-2" data-testid="tab-card">
                    <CreditCard className="h-4 w-4" />
                    Cartão
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="pix" className="mt-4">
                  <Card className="p-4 bg-muted/30">
                    <p className="text-sm text-muted-foreground">
                      Pagamento instantâneo via PIX. Após confirmar, você receberá um QR Code para pagamento.
                    </p>
                  </Card>
                </TabsContent>
                <TabsContent value="card" className="mt-4">
                  <Card className="p-4 bg-muted/30">
                    <p className="text-sm text-muted-foreground">
                      Pagamento via cartão de crédito. Você será redirecionado para uma página segura.
                    </p>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            <Card className="p-6 bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/30 border-rose-200 dark:border-rose-800">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-sm text-muted-foreground">Você está doando</p>
                  <p className="text-3xl font-bold text-rose-600">{formatCurrency(amountCents)}</p>
                  <p className="text-sm mt-1">para <strong>{selectedCause.title}</strong></p>
                </div>
                <Button
                  size="lg"
                  onClick={handleDonate}
                  disabled={createDonationMutation.isPending || amountCents < 200}
                  className="bg-rose-600 hover:bg-rose-700 gap-2"
                  data-testid="button-donate"
                >
                  {createDonationMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Doar Agora
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </>
        )}
      </div>

      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {paymentMethod === "pix" ? <QrCode className="h-5 w-5" /> : <CreditCard className="h-5 w-5" />}
              {paymentMethod === "pix" ? "Pague com PIX" : "Pagamento com Cartão"}
            </DialogTitle>
          </DialogHeader>
          
          {paymentMethod === "pix" ? (
            <div className="space-y-4 py-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Escaneie o QR Code ou copie o código para pagar
                </p>
                
                {currentDonation?.pixQrCode ? (
                  <div className="flex justify-center mb-4">
                    <img 
                      src={`data:image/png;base64,${currentDonation.pixQrCode}`} 
                      alt="QR Code PIX" 
                      className="w-48 h-48"
                    />
                  </div>
                ) : (
                  <div className="w-48 h-48 mx-auto bg-muted rounded-lg flex items-center justify-center mb-4">
                    <QrCode className="h-24 w-24 text-muted-foreground" />
                  </div>
                )}
                
                {currentDonation?.pixCopyPaste ? (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Código PIX Copia e Cola:</p>
                    <div className="flex gap-2">
                      <Input 
                        value={currentDonation.pixCopyPaste} 
                        readOnly 
                        className="text-xs"
                      />
                      <Button 
                        size="icon" 
                        variant="outline"
                        onClick={() => copyToClipboard(currentDonation.pixCopyPaste!)}
                      >
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                ) : selectedCauseDetails?.destinationType === "PIX" && selectedCauseDetails?.destinationPayload ? (
                  <div className="space-y-3 text-left bg-muted/30 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Faça a transferência manual</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <p><strong>Chave PIX:</strong> {(selectedCauseDetails.destinationPayload as any)?.pixKey || "Consulte a causa"}</p>
                      <p><strong>Valor:</strong> {formatCurrency(amountCents)}</p>
                    </div>
                    {(selectedCauseDetails.destinationPayload as any)?.pixKey && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="w-full gap-2"
                        onClick={() => copyToClipboard((selectedCauseDetails.destinationPayload as any).pixKey)}
                      >
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        Copiar Chave PIX
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4 space-y-2">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                    <p className="text-muted-foreground text-sm">
                      Gerando código PIX...
                    </p>
                  </div>
                )}
              </div>
              
              <div className="bg-muted/50 p-3 rounded-lg text-center">
                <p className="text-sm font-medium">Valor: {formatCurrency(amountCents)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Após o pagamento, a doação será confirmada automaticamente.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="text-center space-y-4">
                <CreditCard className="h-16 w-16 mx-auto text-muted-foreground/50" />
                <div>
                  <p className="font-medium">Pagamento com Cartão</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Esta opção de pagamento estará disponível em breve.
                  </p>
                </div>
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-2">
                    <AlertCircle className="h-4 w-4" />
                    <span className="font-medium text-sm">Em desenvolvimento</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Por favor, utilize o PIX para realizar sua doação agora. O pagamento via cartão será habilitado em breve.
                  </p>
                </div>
                <Button 
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => {
                    setPaymentMethod("pix");
                  }}
                >
                  <QrCode className="h-4 w-4" />
                  Usar PIX
                </Button>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
