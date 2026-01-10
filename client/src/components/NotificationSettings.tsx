import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Bell, Clock, Shield, Save, Loader2 } from "lucide-react";
import { NotificationToggle } from "./NotificationToggle";
import { SoundSettings } from "./SoundSettings";

export function NotificationSettings() {
  const { toast } = useToast();
  
  const { data: segments = [] } = useQuery<string[]>({
    queryKey: ["/api/notifications/segments"],
  });
  
  const { data: settings, isLoading } = useQuery<{
    segments: string[];
    quietHoursStart: string | null;
    quietHoursEnd: string | null;
    allowEmergencyOverride: boolean;
  }>({
    queryKey: ["/api/notifications/settings"],
  });
  
  const [selectedSegments, setSelectedSegments] = useState<string[]>([]);
  const [quietStart, setQuietStart] = useState("");
  const [quietEnd, setQuietEnd] = useState("");
  const [allowEmergency, setAllowEmergency] = useState(true);
  const [initialized, setInitialized] = useState(false);
  
  if (settings && !initialized) {
    setSelectedSegments(settings.segments || []);
    setQuietStart(settings.quietHoursStart || "");
    setQuietEnd(settings.quietHoursEnd || "");
    setAllowEmergency(settings.allowEmergencyOverride !== false);
    setInitialized(true);
  }
  
  const saveMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/notifications/settings", {
        segments: selectedSegments,
        quietHoursStart: quietStart || null,
        quietHoursEnd: quietEnd || null,
        allowEmergencyOverride: allowEmergency,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/settings"] });
      toast({ title: "Preferências salvas!" });
    },
    onError: () => {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    },
  });
  
  const toggleSegment = (seg: string) => {
    setSelectedSegments(prev => 
      prev.includes(seg) ? prev.filter(s => s !== seg) : [...prev, seg]
    );
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Ativar Notificações
          </CardTitle>
          <CardDescription>
            Receba alertas importantes diretamente no seu dispositivo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NotificationToggle />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Especialidades de Interesse
          </CardTitle>
          <CardDescription>
            Selecione as áreas para receber notificações segmentadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {segments.map((seg) => (
              <div key={seg} className="flex items-center space-x-2">
                <Checkbox
                  id={`seg-${seg}`}
                  checked={selectedSegments.includes(seg)}
                  onCheckedChange={() => toggleSegment(seg)}
                  data-testid={`checkbox-segment-${seg.replace(/\s/g, "-").toLowerCase()}`}
                />
                <Label htmlFor={`seg-${seg}`} className="text-sm cursor-pointer">
                  {seg}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Horário Silencioso
          </CardTitle>
          <CardDescription>
            Defina um período para não receber notificações push
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="quiet-start" className="text-sm">Início</Label>
              <Input
                id="quiet-start"
                type="time"
                value={quietStart}
                onChange={(e) => setQuietStart(e.target.value)}
                placeholder="22:00"
                data-testid="input-quiet-hours-start"
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="quiet-end" className="text-sm">Fim</Label>
              <Input
                id="quiet-end"
                type="time"
                value={quietEnd}
                onChange={(e) => setQuietEnd(e.target.value)}
                placeholder="07:00"
                data-testid="input-quiet-hours-end"
              />
            </div>
          </div>
          
          <div className="flex items-center justify-between pt-4 border-t">
            <div>
              <Label htmlFor="emergency-override" className="font-medium">
                Permitir emergências
              </Label>
              <p className="text-sm text-muted-foreground">
                Notificações de emergência ignoram o horário silencioso
              </p>
            </div>
            <Switch
              id="emergency-override"
              checked={allowEmergency}
              onCheckedChange={setAllowEmergency}
              data-testid="switch-emergency-override"
            />
          </div>
        </CardContent>
      </Card>
      
      <Button
        onClick={() => saveMutation.mutate()}
        disabled={saveMutation.isPending}
        className="w-full"
        data-testid="button-save-notification-settings"
      >
        {saveMutation.isPending ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Save className="h-4 w-4 mr-2" />
        )}
        Salvar Preferências
      </Button>
      
      <SoundSettings />
    </div>
  );
}
