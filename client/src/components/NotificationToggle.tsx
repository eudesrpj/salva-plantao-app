import { useState, useEffect } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  isPushSupported, 
  isPushEnabled, 
  subscribeToPush, 
  unsubscribeFromPush,
  getNotificationPermission
} from "@/lib/pushNotifications";

export function NotificationToggle() {
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const { toast } = useToast();

  useEffect(() => {
    async function checkStatus() {
      const isSupported = await isPushSupported();
      setSupported(isSupported);
      
      if (isSupported) {
        const isEnabled = await isPushEnabled();
        setEnabled(isEnabled);
        const perm = await getNotificationPermission();
        setPermission(perm);
      }
      setLoading(false);
    }
    checkStatus();
  }, []);

  const handleToggle = async () => {
    setLoading(true);
    try {
      if (enabled) {
        const result = await unsubscribeFromPush();
        if (result.success) {
          setEnabled(false);
          toast({ title: "Notificações desativadas", description: result.message });
        } else {
          toast({ title: "Erro", description: result.message, variant: "destructive" });
        }
      } else {
        const result = await subscribeToPush();
        if (result.success) {
          setEnabled(true);
          toast({ title: "Notificações ativadas", description: result.message });
        } else {
          toast({ title: "Erro", description: result.message, variant: "destructive" });
        }
        const perm = await getNotificationPermission();
        setPermission(perm);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!supported) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <BellOff className="h-4 w-4" />
        <span>Notificações não suportadas</span>
      </div>
    );
  }

  if (permission === 'denied') {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <BellOff className="h-4 w-4" />
        <span>Notificações bloqueadas pelo navegador</span>
      </div>
    );
  }

  return (
    <Button
      variant={enabled ? "default" : "outline"}
      size="sm"
      onClick={handleToggle}
      disabled={loading}
      data-testid="button-toggle-notifications"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : enabled ? (
        <>
          <Bell className="h-4 w-4 mr-2" />
          Notificações ativadas
        </>
      ) : (
        <>
          <BellOff className="h-4 w-4 mr-2" />
          Ativar notificações
        </>
      )}
    </Button>
  );
}
