import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Crown, Lock, Clock, Zap } from "lucide-react";
import { useState, createContext, useContext } from "react";
import { SubscriptionDialog } from "@/components/SubscriptionDialog";
import { useLocation } from "wouter";

interface PreviewStatus {
  isSubscribed: boolean;
  previewAllowed: boolean;
  previewExpired: boolean;
  remainingMinutes: number | null;
  remainingActions: number | null;
  actionsUsed: number;
}

interface PreviewContextType {
  isSubscribed: boolean;
  previewAllowed: boolean;
  previewExpired: boolean;
  remainingMinutes: number | null;
  remainingActions: number | null;
  isLoading: boolean;
  refetch: () => void;
}

const PreviewContext = createContext<PreviewContextType | null>(null);

export function PreviewProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  
  const { data, isLoading, refetch } = useQuery<PreviewStatus>({
    queryKey: ["/api/preview/status"],
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: true,
  });

  const hasFullAccess = user?.status === "active" || user?.role === "admin";

  const value: PreviewContextType = {
    isSubscribed: hasFullAccess || data?.isSubscribed || false,
    previewAllowed: hasFullAccess || data?.previewAllowed || false,
    previewExpired: !hasFullAccess && (data?.previewExpired || false),
    remainingMinutes: data?.remainingMinutes ?? null,
    remainingActions: data?.remainingActions ?? null,
    isLoading,
    refetch,
  };

  return (
    <PreviewContext.Provider value={value}>
      {children}
    </PreviewContext.Provider>
  );
}

export function usePreviewStatus() {
  const context = useContext(PreviewContext);
  if (!context) {
    const { user } = useAuth();
    const hasFullAccess = user?.status === "active" || user?.role === "admin";
    return {
      isSubscribed: hasFullAccess,
      previewAllowed: true,
      previewExpired: false,
      remainingMinutes: null,
      remainingActions: null,
      isLoading: false,
      refetch: () => {},
    };
  }
  return context;
}

interface PreviewGateProps {
  children: React.ReactNode;
  placeholder?: React.ReactNode;
  blurContent?: boolean;
}

export function PreviewGate({ children, placeholder, blurContent = true }: PreviewGateProps) {
  const { user } = useAuth();
  const { previewExpired, previewAllowed } = usePreviewStatus();
  const [showDialog, setShowDialog] = useState(false);

  const hasFullAccess = user?.status === "active" || user?.role === "admin";

  if (hasFullAccess) {
    return <>{children}</>;
  }

  // If preview is allowed and not expired, show content
  if (previewAllowed && !previewExpired) {
    return <>{children}</>;
  }

  if (placeholder) {
    return <>{placeholder}</>;
  }

  if (blurContent) {
    return (
      <div className="relative">
        <div className="blur-sm pointer-events-none select-none opacity-60">
          {children}
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-[2px]">
          <div className="text-center p-6 max-w-sm">
            <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit mb-3">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold text-lg mb-2">
              {previewExpired ? "Demonstração Encerrada" : "Conteúdo Premium"}
            </h3>
            <p className="text-muted-foreground text-sm mb-4">
              {previewExpired 
                ? "Seu período de demonstração terminou. Assine para continuar."
                : "Assine para desbloquear acesso completo a este conteúdo."}
            </p>
            <Button onClick={() => setShowDialog(true)} data-testid="button-unlock-content">
              <Crown className="mr-2 h-4 w-4" /> {previewExpired ? "Assinar Agora" : "Desbloquear"}
            </Button>
          </div>
        </div>
        <SubscriptionDialog open={showDialog} onOpenChange={setShowDialog} />
      </div>
    );
  }

  return null;
}

export function PreviewBanner() {
  const { user } = useAuth();
  const { previewExpired, remainingMinutes, remainingActions } = usePreviewStatus();
  const [showDialog, setShowDialog] = useState(false);

  const hasFullAccess = user?.status === "active" || user?.role === "admin";

  if (hasFullAccess) {
    return null;
  }

  return (
    <>
      <div 
        className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-3 flex items-center justify-between gap-4 flex-wrap" 
        data-testid="banner-preview"
      >
        <div className="flex items-center gap-2 flex-wrap">
          <Crown className="h-5 w-5" />
          <span className="font-medium">Modo Demonstração</span>
          {!previewExpired && (remainingMinutes !== null || remainingActions !== null) && (
            <span className="text-white/80 text-sm hidden sm:flex items-center gap-2">
              {remainingMinutes !== null && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {remainingMinutes}min
                </span>
              )}
              {remainingActions !== null && (
                <span className="flex items-center gap-1">
                  <Zap className="h-3 w-3" /> {remainingActions} ações
                </span>
              )}
            </span>
          )}
          {previewExpired && (
            <span className="text-white/90 font-medium">- Demo expirada</span>
          )}
        </div>
        <Button
          size="sm"
          variant="secondary"
          className="bg-white text-amber-600 hover:bg-white/90"
          onClick={() => setShowDialog(true)}
          data-testid="button-subscribe-banner"
        >
          Assinar Agora
        </Button>
      </div>
      <SubscriptionDialog open={showDialog} onOpenChange={setShowDialog} />
    </>
  );
}

export function PreviewExpiredOverlay() {
  const { user } = useAuth();
  const { previewExpired, isLoading, refetch } = usePreviewStatus();
  const [showDialog, setShowDialog] = useState(false);
  const [, setLocation] = useLocation();

  const hasFullAccess = user?.status === "active" || user?.role === "admin";

  if (hasFullAccess || isLoading || !previewExpired) {
    return null;
  }

  const handleBack = () => {
    // Redirect to landing page - this is safe since they're not logged out
    setLocation("/welcome");
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-background rounded-xl shadow-2xl max-w-md w-full p-6 text-center animate-in fade-in-0 zoom-in-95 duration-200">
          <div className="mx-auto bg-amber-100 dark:bg-amber-900/30 p-4 rounded-full w-fit mb-4">
            <Crown className="h-10 w-10 text-amber-600 dark:text-amber-400" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Acesso de Demonstração Encerrado</h2>
          <p className="text-muted-foreground mb-6">
            Seu período de demonstração terminou. Assine agora para continuar usando todas as funcionalidades do Salva Plantão.
          </p>
          <div className="flex flex-col gap-3">
            <Button
              size="lg"
              className="w-full"
              onClick={() => setShowDialog(true)}
              data-testid="button-subscribe-expired"
            >
              <Crown className="mr-2 h-4 w-4" /> Assinar Agora
            </Button>
            <Button
              variant="ghost"
              onClick={handleBack}
              data-testid="button-back-landing"
            >
              Voltar para Início
            </Button>
          </div>
        </div>
      </div>
      <SubscriptionDialog open={showDialog} onOpenChange={setShowDialog} />
    </>
  );
}

export function usePreviewMode() {
  const { user } = useAuth();
  const hasFullAccess = user?.status === "active" || user?.role === "admin";
  return {
    isPreview: !hasFullAccess,
    hasFullAccess,
  };
}
