import { Volume2, VolumeX, Play, Bell, MessageCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNotificationSound, SOUND_THEME_LABELS, SoundTheme } from "@/hooks/use-notification-sound";

export function SoundSettings() {
  const { settings, isLoading, updateSettings, testSound, isSaving } = useNotificationSound();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            Sons de Notificação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded" />
            <div className="h-8 bg-muted rounded" />
            <div className="h-8 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {settings.soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          Sons de Notificação
        </CardTitle>
        <CardDescription>
          Configure os sons de alerta para mensagens e notificações
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="sound-enabled">Sons Ativados</Label>
            <p className="text-sm text-muted-foreground">
              Ativar ou desativar todos os sons do app
            </p>
          </div>
          <Switch
            id="sound-enabled"
            checked={settings.soundEnabled}
            onCheckedChange={(checked) => updateSettings({ soundEnabled: checked })}
            disabled={isSaving}
            data-testid="switch-sound-enabled"
          />
        </div>

        {settings.soundEnabled && (
          <>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Volume</Label>
                <span className="text-sm text-muted-foreground">{settings.soundVolume}%</span>
              </div>
              <Slider
                value={[settings.soundVolume]}
                onValueChange={([value]) => updateSettings({ soundVolume: value })}
                max={100}
                min={0}
                step={5}
                disabled={isSaving}
                data-testid="slider-volume"
              />
            </div>

            <div className="space-y-3">
              <Label>Tema de Som</Label>
              <div className="flex items-center gap-2">
                <Select
                  value={settings.soundTheme}
                  onValueChange={(value: SoundTheme) => updateSettings({ soundTheme: value })}
                  disabled={isSaving}
                >
                  <SelectTrigger className="flex-1" data-testid="select-sound-theme">
                    <SelectValue placeholder="Selecione um tema" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(SOUND_THEME_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key} data-testid={`option-theme-${key}`}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => testSound(settings.soundTheme)}
                  disabled={isSaving}
                  data-testid="button-test-sound"
                >
                  <Play className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Clique no botão de play para ouvir o som selecionado
              </p>
            </div>

            <div className="border-t pt-4 space-y-4">
              <h4 className="font-medium text-sm">Sons por Tipo</h4>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-muted-foreground" />
                  <div className="space-y-0.5">
                    <Label htmlFor="chat-sound">Chat</Label>
                    <p className="text-xs text-muted-foreground">
                      Novas mensagens no chat
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => testSound(settings.soundTheme, "chat")}
                    disabled={isSaving || !settings.chatSoundEnabled}
                    data-testid="button-test-chat-sound"
                  >
                    <Play className="h-3 w-3" />
                  </Button>
                  <Switch
                    id="chat-sound"
                    checked={settings.chatSoundEnabled}
                    onCheckedChange={(checked) => updateSettings({ chatSoundEnabled: checked })}
                    disabled={isSaving}
                    data-testid="switch-chat-sound"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-muted-foreground" />
                  <div className="space-y-0.5">
                    <Label htmlFor="notification-sound">Notificações</Label>
                    <p className="text-xs text-muted-foreground">
                      Alertas e avisos do sistema
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => testSound(settings.soundTheme, "notification")}
                    disabled={isSaving || !settings.notificationSoundEnabled}
                    data-testid="button-test-notification-sound"
                  >
                    <Play className="h-3 w-3" />
                  </Button>
                  <Switch
                    id="notification-sound"
                    checked={settings.notificationSoundEnabled}
                    onCheckedChange={(checked) => updateSettings({ notificationSoundEnabled: checked })}
                    disabled={isSaving}
                    data-testid="switch-notification-sound"
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
