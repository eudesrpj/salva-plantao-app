import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Copy, Plus, Edit2, Trash2, FileText, Stethoscope, Activity, Heart } from "lucide-react";
import type { EvolutionModel, PhysicalExamTemplate, SignsSymptoms, SemiologicalSigns } from "@shared/schema";

const CATEGORIES = [
  { value: "clinica_medica", label: "Clínica Médica" },
  { value: "pediatria", label: "Pediatria" },
  { value: "gineco", label: "Ginecologia" },
  { value: "pronto_atendimento", label: "Pronto-Atendimento" },
  { value: "emergencia", label: "Emergência" },
  { value: "uti", label: "UTI" },
];

const PHYSICAL_EXAM_SECTIONS = [
  { value: "estado_geral", label: "Estado Geral", default: "Bom estado geral, lúcido e orientado em tempo e espaço, corado, hidratado, acianótico, anictérico, afebril." },
  { value: "sinais_vitais", label: "Sinais Vitais", default: "PA: ___x___ mmHg | FC: ___ bpm | FR: ___ irpm | Tax: ___°C | SpO2: ___%" },
  { value: "cabeca_pescoco", label: "Cabeça e Pescoço", default: "Pupilas isocóricas e fotorreagentes. Mucosas oculares normocoradas. Orofaringe sem alterações. Tireóide não palpável. Sem linfonodomegalias cervicais." },
  { value: "cardiovascular", label: "Cardiovascular", default: "Bulhas cardíacas rítmicas, normofonéticas, em 2 tempos, sem sopros. Pulsos periféricos presentes e simétricos." },
  { value: "respiratorio", label: "Respiratório", default: "Tórax simétrico, eupneico. Murmúrio vesicular presente bilateralmente, sem ruídos adventícios." },
  { value: "abdome", label: "Abdome", default: "Plano, flácido, indolor à palpação superficial e profunda. Ruídos hidroaéreos presentes. Sem visceromegalias. Sem sinais de irritação peritoneal." },
  { value: "neurologico", label: "Neurológico", default: "Glasgow 15. Força muscular preservada nos 4 membros. Reflexos profundos presentes e simétricos. Sem sinais meníngeos." },
  { value: "extremidades", label: "Extremidades", default: "Extremidades bem perfundidas. Sem edema. Panturrilhas livres." },
];

const SYMPTOM_CATEGORIES = [
  { value: "cardiologia", label: "Cardiologia" },
  { value: "respiratorio", label: "Respiratório" },
  { value: "abdome", label: "Abdome" },
  { value: "neurologico", label: "Neurológico" },
  { value: "geral", label: "Geral" },
];

export default function Evolution() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("modelos");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [editingText, setEditingText] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newModel, setNewModel] = useState({ title: "", content: "", category: "" });

  const { data: evolutionModels = [], isLoading: loadingModels } = useQuery<EvolutionModel[]>({
    queryKey: ["/api/evolution-models", selectedCategory],
  });

  const { data: physicalExamTemplates = [] } = useQuery<PhysicalExamTemplate[]>({
    queryKey: ["/api/physical-exam-templates"],
  });

  const { data: signsSymptoms = [] } = useQuery<SignsSymptoms[]>({
    queryKey: ["/api/signs-symptoms"],
  });

  const { data: semiologicalSigns = [] } = useQuery<SemiologicalSigns[]>({
    queryKey: ["/api/semiological-signs"],
  });

  const createModelMutation = useMutation({
    mutationFn: (data: typeof newModel) => apiRequest("POST", "/api/evolution-models", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/evolution-models"] });
      setIsDialogOpen(false);
      setNewModel({ title: "", content: "", category: "" });
      toast({ title: "Modelo criado com sucesso" });
    },
  });

  const deleteModelMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/evolution-models/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/evolution-models"] });
      toast({ title: "Modelo excluído" });
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Texto copiado!", description: "Cole no prontuário." });
  };

  const getCompletePhysicalExam = () => {
    const sections = PHYSICAL_EXAM_SECTIONS.map(s => {
      const template = physicalExamTemplates.find(t => t.section === s.value);
      return `${s.label}:\n${template?.content || s.default}`;
    });
    return sections.join("\n\n");
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground" data-testid="text-page-title">Evolução Clínica</h1>
          <p className="text-muted-foreground">Modelos de evolução e textos para cópia rápida</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="modelos" data-testid="tab-models">
            <FileText className="w-4 h-4 mr-2" />
            Modelos
          </TabsTrigger>
          <TabsTrigger value="exame_fisico" data-testid="tab-physical-exam">
            <Stethoscope className="w-4 h-4 mr-2" />
            Exame Físico
          </TabsTrigger>
          <TabsTrigger value="sinais_sintomas" data-testid="tab-signs-symptoms">
            <Activity className="w-4 h-4 mr-2" />
            Sinais/Sintomas
          </TabsTrigger>
          <TabsTrigger value="signos" data-testid="tab-semiological">
            <Heart className="w-4 h-4 mr-2" />
            Signos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="modelos" className="space-y-4 mt-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48" data-testid="select-category">
                <SelectValue placeholder="Filtrar por categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas categorias</SelectItem>
                {CATEGORIES.map(c => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-new-model">
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Modelo
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Novo Modelo de Evolução</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Título do modelo"
                    value={newModel.title}
                    onChange={(e) => setNewModel({ ...newModel, title: e.target.value })}
                    data-testid="input-model-title"
                  />
                  <Select value={newModel.category} onValueChange={(v) => setNewModel({ ...newModel, category: v })}>
                    <SelectTrigger data-testid="select-model-category">
                      <SelectValue placeholder="Categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(c => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Textarea
                    placeholder="Texto da evolução..."
                    value={newModel.content}
                    onChange={(e) => setNewModel({ ...newModel, content: e.target.value })}
                    rows={10}
                    data-testid="textarea-model-content"
                  />
                  <Button 
                    onClick={() => createModelMutation.mutate(newModel)}
                    disabled={!newModel.title || !newModel.content || createModelMutation.isPending}
                    data-testid="button-save-model"
                  >
                    Salvar Modelo
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {loadingModels ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : evolutionModels.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Nenhum modelo de evolução cadastrado. Crie o primeiro modelo!
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {evolutionModels
                .filter(m => selectedCategory === "all" || m.category === selectedCategory)
                .map((model) => (
                <Card key={model.id} data-testid={`card-model-${model.id}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <CardTitle className="text-lg">{model.title}</CardTitle>
                      <div className="flex items-center gap-2">
                        {model.category && (
                          <Badge variant="secondary">
                            {CATEGORIES.find(c => c.value === model.category)?.label || model.category}
                          </Badge>
                        )}
                        <Button size="icon" variant="ghost" onClick={() => copyToClipboard(model.content)} data-testid={`button-copy-model-${model.id}`}>
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => deleteModelMutation.mutate(model.id)} data-testid={`button-delete-model-${model.id}`}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={model.content}
                      readOnly
                      rows={6}
                      className="bg-muted/50"
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="exame_fisico" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Button onClick={() => copyToClipboard(getCompletePhysicalExam())} data-testid="button-copy-full-exam">
              <Copy className="w-4 h-4 mr-2" />
              Copiar Exame Completo
            </Button>
          </div>

          <div className="grid gap-4">
            {PHYSICAL_EXAM_SECTIONS.map((section) => {
              const template = physicalExamTemplates.find(t => t.section === section.value);
              const content = template?.content || section.default;
              return (
                <Card key={section.value} data-testid={`card-exam-${section.value}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-base">{section.label}</CardTitle>
                      <Button size="icon" variant="ghost" onClick={() => copyToClipboard(content)} data-testid={`button-copy-exam-${section.value}`}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{content}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="sinais_sintomas" className="space-y-4 mt-4">
          {signsSymptoms.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Nenhum sinal/sintoma cadastrado pelo administrador.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {signsSymptoms.map((item) => (
                <Card key={item.id} className="hover-elevate" data-testid={`card-symptom-${item.id}`}>
                  <CardContent className="py-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-medium">{item.title}</p>
                        <p className="text-sm text-muted-foreground">{item.content}</p>
                      </div>
                      <Button size="icon" variant="ghost" onClick={() => copyToClipboard(item.content)} data-testid={`button-copy-symptom-${item.id}`}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="signos" className="space-y-4 mt-4">
          {semiologicalSigns.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Nenhum signo semiológico cadastrado pelo administrador.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {semiologicalSigns.map((item) => (
                <Card key={item.id} className="hover-elevate" data-testid={`card-sign-${item.id}`}>
                  <CardContent className="py-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-medium">{item.title}</p>
                        <p className="text-sm text-muted-foreground">{item.content}</p>
                      </div>
                      <Button size="icon" variant="ghost" onClick={() => copyToClipboard(item.content)} data-testid={`button-copy-sign-${item.id}`}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
