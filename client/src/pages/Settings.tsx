import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useTheme, Theme, ColorScheme, FontSize } from "@/contexts/ThemeContext";
import { Sun, Moon, Monitor, Palette, Type, LayoutGrid, Check } from "lucide-react";

const THEME_OPTIONS: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Escuro", icon: Moon },
  { value: "system", label: "Sistema", icon: Monitor },
];

const COLOR_OPTIONS: { value: ColorScheme; label: string; color: string }[] = [
  { value: "blue", label: "Azul Médico", color: "bg-sky-600" },
  { value: "green", label: "Verde Saúde", color: "bg-emerald-600" },
  { value: "purple", label: "Roxo Premium", color: "bg-violet-600" },
  { value: "orange", label: "Laranja Energia", color: "bg-orange-500" },
  { value: "rose", label: "Rosa Cuidado", color: "bg-rose-500" },
];

const FONT_OPTIONS: { value: FontSize; label: string; preview: string }[] = [
  { value: "small", label: "Pequeno", preview: "Aa" },
  { value: "medium", label: "Médio", preview: "Aa" },
  { value: "large", label: "Grande", preview: "Aa" },
];

export default function Settings() {
  const { theme, colorScheme, fontSize, compactMode, setTheme, setColorScheme, setFontSize, setCompactMode } = useTheme();

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">Personalize sua experiência no app</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sun className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-lg">Aparência</CardTitle>
              <CardDescription>Escolha o tema do aplicativo</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {THEME_OPTIONS.map((option) => {
              const Icon = option.icon;
              const isSelected = theme === option.value;
              return (
                <Button
                  key={option.value}
                  variant={isSelected ? "default" : "outline"}
                  className="flex flex-col h-auto py-4 gap-2"
                  onClick={() => setTheme(option.value)}
                  data-testid={`button-theme-${option.value}`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-sm">{option.label}</span>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-lg">Cor do Tema</CardTitle>
              <CardDescription>Escolha a cor principal do aplicativo</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {COLOR_OPTIONS.map((option) => {
              const isSelected = colorScheme === option.value;
              return (
                <button
                  key={option.value}
                  className={`relative flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                    isSelected ? "border-primary ring-2 ring-primary/20" : "border-border hover-elevate"
                  }`}
                  onClick={() => setColorScheme(option.value)}
                  data-testid={`button-color-${option.value}`}
                >
                  <div className={`w-10 h-10 rounded-full ${option.color}`} />
                  <span className="text-xs font-medium">{option.label}</span>
                  {isSelected && (
                    <div className="absolute top-2 right-2">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Type className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-lg">Tamanho da Fonte</CardTitle>
              <CardDescription>Ajuste o tamanho do texto</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {FONT_OPTIONS.map((option) => {
              const isSelected = fontSize === option.value;
              const sizeClass = option.value === "small" ? "text-sm" : option.value === "large" ? "text-lg" : "text-base";
              return (
                <Button
                  key={option.value}
                  variant={isSelected ? "default" : "outline"}
                  className="flex flex-col h-auto py-4 gap-2"
                  onClick={() => setFontSize(option.value)}
                  data-testid={`button-font-${option.value}`}
                >
                  <span className={`font-bold ${sizeClass}`}>{option.preview}</span>
                  <span className="text-sm">{option.label}</span>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <LayoutGrid className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-lg">Layout</CardTitle>
              <CardDescription>Ajuste o layout do aplicativo</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="compact-mode" className="font-medium">Modo Compacto</Label>
              <p className="text-sm text-muted-foreground">Reduz espaçamentos para exibir mais conteúdo</p>
            </div>
            <Switch
              id="compact-mode"
              checked={compactMode}
              onCheckedChange={setCompactMode}
              data-testid="switch-compact-mode"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
