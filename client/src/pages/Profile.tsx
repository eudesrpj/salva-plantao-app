import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Save, Stamp, User, Copy } from "lucide-react";
import type { DoctorProfile } from "@shared/schema";

const UF_OPTIONS = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"];
const SPECIALTIES = ["Clínica Médica", "Cardiologia", "Pediatria", "Ginecologia", "Cirurgia Geral", "Ortopedia", "Neurologia", "Psiquiatria", "Dermatologia", "Oftalmologia", "Otorrinolaringologia", "Urologia", "Gastroenterologia", "Pneumologia", "Nefrologia", "Endocrinologia", "Reumatologia", "Infectologia", "Medicina de Emergência", "Intensivista", "Outra"];

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [crm, setCrm] = useState("");
  const [crmState, setCrmState] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [stampText, setStampText] = useState("");

  const { data: profile, isLoading } = useQuery<DoctorProfile | null>({
    queryKey: ["/api/doctor-profile"],
    queryFn: async () => {
      const res = await fetch("/api/doctor-profile", { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
  });

  useEffect(() => {
    if (profile) {
      setCrm(profile.crm || "");
      setCrmState(profile.crmState || "");
      setSpecialty(profile.specialty || "");
      setStampText(profile.stampText || "");
    }
  }, [profile]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/doctor-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ crm, crmState, specialty, stampText, userId: user?.id }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/doctor-profile"] });
      toast({ title: "Perfil salvo!", description: "Suas informações foram atualizadas." });
    },
    onError: () => {
      toast({ title: "Erro", description: "Falha ao salvar perfil.", variant: "destructive" });
    },
  });

  const generateStamp = () => {
    const name = `Dr(a). ${user?.firstName} ${user?.lastName}`;
    const crmText = crm && crmState ? `CRM ${crmState} ${crm}` : "";
    const specialtyText = specialty || "";
    setStampText(`${name}\n${crmText}${specialtyText ? `\n${specialtyText}` : ""}`);
  };

  const copyStamp = () => {
    navigator.clipboard.writeText(stampText);
    toast({ title: "Copiado!", description: "Carimbo copiado para a área de transferência." });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      <header>
        <h1 className="text-3xl font-bold font-display text-slate-900">Meu Perfil</h1>
        <p className="text-slate-500">Configure seu carimbo digital e informações profissionais.</p>
      </header>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" /> Informações Profissionais
            </CardTitle>
            <CardDescription>Dados exibidos no seu carimbo digital.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome Completo</label>
              <Input value={`${user?.firstName || ""} ${user?.lastName || ""}`} disabled className="bg-slate-50" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">CRM</label>
                <Input 
                  value={crm} 
                  onChange={(e) => setCrm(e.target.value)} 
                  placeholder="123456"
                  data-testid="input-crm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">UF</label>
                <Select value={crmState} onValueChange={setCrmState}>
                  <SelectTrigger data-testid="select-uf">
                    <SelectValue placeholder="UF" />
                  </SelectTrigger>
                  <SelectContent>
                    {UF_OPTIONS.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Especialidade</label>
              <Select value={specialty} onValueChange={setSpecialty}>
                <SelectTrigger data-testid="select-specialty">
                  <SelectValue placeholder="Selecione sua especialidade" />
                </SelectTrigger>
                <SelectContent>
                  {SPECIALTIES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <Button variant="outline" onClick={generateStamp} className="w-full" data-testid="button-generate-stamp">
              <Stamp className="mr-2 h-4 w-4" /> Gerar Carimbo Automático
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stamp className="h-5 w-5 text-primary" /> Carimbo Digital
            </CardTitle>
            <CardDescription>Texto que será exibido no seu carimbo.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Texto do Carimbo</label>
              <Textarea 
                value={stampText} 
                onChange={(e) => setStampText(e.target.value)} 
                placeholder="Dr(a). Nome Completo&#10;CRM XX 000000&#10;Especialidade"
                rows={5}
                className="font-mono text-sm"
                data-testid="textarea-stamp"
              />
            </div>

            <div className="bg-slate-100 p-4 rounded-lg">
              <p className="text-xs text-slate-500 mb-2">Pré-visualização:</p>
              <div className="bg-white border-2 border-dashed border-slate-300 p-4 rounded text-center font-mono text-sm whitespace-pre-line">
                {stampText || "Seu carimbo aparecerá aqui..."}
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={copyStamp} className="flex-1" data-testid="button-copy-stamp">
                <Copy className="mr-2 h-4 w-4" /> Copiar
              </Button>
              <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="flex-1" data-testid="button-save-profile">
                <Save className="mr-2 h-4 w-4" />
                {saveMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
