import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Crown, Lock } from "lucide-react";
import { useState } from "react";
import { SubscriptionDialog } from "@/components/SubscriptionDialog";

interface PreviewGateProps {
  children: React.ReactNode;
  placeholder?: React.ReactNode;
  blurContent?: boolean;
}

export function PreviewGate({ children, placeholder, blurContent = true }: PreviewGateProps) {
  const { user } = useAuth();
  const [showDialog, setShowDialog] = useState(false);

  const hasFullAccess = user?.status === "active" || user?.role === "admin";

  if (hasFullAccess) {
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
            <h3 className="font-semibold text-lg mb-2">Conte\u00fado Premium</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Assine para desbloquear acesso completo a este conte\u00fado.
            </p>
            <Button onClick={() => setShowDialog(true)} data-testid="button-unlock-content">
              <Crown className="mr-2 h-4 w-4" /> Desbloquear
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
  const [showDialog, setShowDialog] = useState(false);

  const hasFullAccess = user?.status === "active" || user?.role === "admin";

  if (hasFullAccess) {
    return null;
  }

  return (
    <>
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-3 flex items-center justify-between gap-4 flex-wrap" data-testid="banner-preview">
        <div className="flex items-center gap-2">
          <Crown className="h-5 w-5" />
          <span className="font-medium">Modo Demonstra\u00e7\u00e3o</span>
          <span className="text-white/80 hidden sm:inline">- Assine para acesso completo</span>
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

export function usePreviewMode() {
  const { user } = useAuth();
  const hasFullAccess = user?.status === "active" || user?.role === "admin";
  return {
    isPreview: !hasFullAccess,
    hasFullAccess,
  };
}
