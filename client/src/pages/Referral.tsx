
import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Printer, Eye, ArrowRightLeft, Plus, Trash2, BookTemplate, Edit } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { DoctorProfile, ReferralDestination, ReferralReason } from "@shared/schema";

// Define a type for referral objects
interface Referral {
  id: number;
  patientName: string;
  destination: string;
  createdAt: string;
}

interface Template {
    name: string;
    content: string;
}

const defaultTemplates: Template[] = [
    {
        name: "Padrão SUS (Simplificado)",
        content: `Encaminho o(a) paciente acima para avaliação e conduta, por apresentar o seguinte quadro:\n\nQueixa Principal:\n\nHistória da Doença Atual (HDA):\n\nExames Realizados:\n\nConduta Inicial:\n`
    },
    {
        name: "Ficha de Referência HRPT",
        content: `SECRETÁRIO DE ESTADO DA SAÚDE\nREGIÃO CANTÃO\nMUNICÍPIO:\n\n1. IDENTIFICAÇÃO DO PACIENTE\nNOME: {patientName}\nRG: {patientDocument} ÓRGÃO EMISSOR: CPF:\nDATA NASC.: {patientBirthDate} IDADE: {patientAge} PESO: SEXO: {patientSex}\nCARTÃO SUS: RESPONSÁVEL:\nTELEFONE: ENDEREÇO: {patientAddress}\nMUNICÍPIO:\n\n2. SOLICITAÇÃO\nPROCEDIMENTO SOLICITADO(ESPECIFICAR):\nDIAGNÓSTICO: CID:\nESPECIALIDADE:\nEXAMES MAIS SIGNIFICATIVOS:\n\nHISTÓRIA CLÍNICA:\n\nMEDICAÇÕES REALIZADAS:\nUSO DE ANTIB( )NÃO ( ) SIM - QUAL:\n\nCOMORBIDADES: ( ) NÃO ( ) SIM QUAL:\nSINAIS VITAIS: PA: {pa}, TEMP: {temp}, RESPIRAÇÃO: {fr}, FREQ.CARD: {fc}, SATURAÇÃO: {spo2}\nGLASGOW: ESTADO GERAL:\nUSO DE OXIG. ( ) SIM ( ) NÃO LITROS/MIN.\nTESTE DO COVID POSITIVO: ( ) TESTE DO COVID NEGATIVO( ) SUSPEITA DE TUB:( ) SIM ( ) NÃO\nNECESSIDADE DE ISOLAMENTO:\n\nDATA: {currentDate} ASSINATURA E CARIMBO DO MÉDICO:\n\n3. AUTORIZO GESTOR MUNICIPAL ORIGEM\nDATA: / /\nASSINATURA DE CARIMBO GESTOR MUNICIPAL\n\n4.AUTORIZO DA REGULAÇÃO NIR/HRPT\nDATA: / /\nMÉDICO/CRM\nDEFERIDO: INDEFERIDO:\nPENDENTE:\nOBS:\n\n5.CONTRA REFERÊNCIA\nUNIDADE DE ATENDIMENTO:\nTRATAMENTO REALIZADO:\n\nDATA: / / ASSINATURA E CARIMBO DO MÉDICO:\nOBS: CASOS PEDIÁTRICOS É OBRIGATÓRIO O PESO`
    }
];

export default function Referral() {
  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isManageTemplatesOpen, setIsManageTemplatesOpen] = useState(false);
  const [templates, setTemplates] = useState<Template[]>(() => {
    try {
        const savedTemplates = localStorage.getItem("referral_templates");
        return savedTemplates ? JSON.parse(savedTemplates) : defaultTemplates;
    } catch (error) {
        return defaultTemplates;
    }
  });
  const [selectedTemplate, setSelectedTemplate] = useState<string>(templates[0].name);

  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [templateName, setTemplateName] = useState("");
  const [templateContent, setTemplateContent] = useState("");

  
  const [form, setForm] = useState({
    patientName: "",
    patientBirthDate: "",
    patientAge: "",
    patientSex: "",
    patientDocument: "",
    patientAddress: "",
    originUnit: "",
    vitalSigns: { pa: "", fc: "", fr: "", spo2: "", temp: "" },
    referralReason: "",
    destination: "",
    clinicalHistory: templates[0].content,
  });

  const { data: doctorProfile } = useQuery<DoctorProfile>({ queryKey: ["/api/doctor-profile"] });
  const { data: referrals = [] } = useQuery<Referral[]>({ queryKey: ["/api/medical-referrals"] });
  const { data: destinations = [] } = useQuery<ReferralDestination[]>({ queryKey: ["/api/referral-destinations"] });
  const { data: reasons = [] } = useQuery<ReferralReason[]>({ queryKey: ["/api/referral-reasons"] });

  useEffect(() => {
    localStorage.setItem("referral_templates", JSON.stringify(templates));
  }, [templates]);

  const handleTemplateChange = (templateName: string) => {
      const template = templates.find(t => t.name === templateName);
      if (template) {
          setSelectedTemplate(template.name);
          setForm(prevForm => ({ ...prevForm, clinicalHistory: template.content }));
      }
  };

  const handleOpenNewTemplateDialog = () => {
    setEditingTemplate(null);
    setTemplateName("");
    setTemplateContent("");
    setIsTemplateDialogOpen(true);
  };

  const handleOpenEditTemplateDialog = (template: Template) => {
    setEditingTemplate(template);
    setTemplateName(template.name);
    setTemplateContent(template.content);
    setIsTemplateDialogOpen(true);
  };

  const handleSaveTemplate = () => {
    if (!templateName || !templateContent) {
      toast({ title: "Erro", description: "Nome e conteúdo do modelo são obrigatórios.", variant: "destructive" });
      return;
    }

    if (editingTemplate) {
      setTemplates(templates.map(t => t.name === editingTemplate.name ? { name: templateName, content: templateContent } : t));
    } else {
      if (templates.some(t => t.name === templateName)) {
        toast({ title: "Erro", description: "Já existe um modelo com este nome.", variant: "destructive" });
        return;
      }
      setTemplates([...templates, { name: templateName, content: templateContent }]);
    }
    
    setIsTemplateDialogOpen(false);
    setEditingTemplate(null);
    toast({ title: "Sucesso", description: `Modelo "${templateName}" salvo.` });
  };
  
  const handleDeleteTemplate = (templateName: string) => {
      const isDefault = defaultTemplates.some(t => t.name === templateName);
      if (isDefault) {
          toast({ title: "Ação não permitida", description: "Não é possível excluir um modelo padrão.", variant: "destructive" });
          return;
      }
      setTemplates(templates.filter(t => t.name !== templateName));
      toast({ title: "Sucesso", description: `Modelo "${templateName}" excluído.` });
  };


  const createMutation = useMutation({
    mutationFn: (data: typeof form) => apiRequest("POST", "/api/medical-referrals", { ...data, patientBirthDate: data.patientBirthDate ? new Date(data.patientBirthDate) : null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/medical-referrals"] });
      toast({ title: "Encaminhamento salvo com sucesso" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/medical-referrals/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/medical-referrals"] });
      toast({ title: "Encaminhamento excluído" });
    },
  });

  const getInterpolatedContent = () => {
    let content = form.clinicalHistory;
    const replacements: Record<string, string> = {
        '{patientName}': form.patientName,
        '{patientBirthDate}': form.patientBirthDate ? format(new Date(form.patientBirthDate), 'dd/MM/yyyy') : '',
        '{patientAge}': form.patientAge,
        '{patientSex}': form.patientSex === 'M' ? 'Masculino' : 'Feminino',
        '{patientDocument}': form.patientDocument,
        '{patientAddress}': form.patientAddress,
        '{pa}': form.vitalSigns.pa,
        '{fc}': form.vitalSigns.fc,
        '{fr}': form.vitalSigns.fr,
        '{spo2}': form.vitalSigns.spo2,
        '{temp}': form.vitalSigns.temp,
        '{currentDate}': format(new Date(), 'dd/MM/yyyy'),
    };

    Object.entries(replacements).forEach(([key, value]) => {
        content = content.replace(new RegExp(key.replace(/\{/g, '\\{').replace(/\}/g, '\\}'), 'g'), value || '___');
    });

    return content;
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;
    
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Encaminhamento Médico</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; font-size: 12px; }
            .signature { margin-top: 40px; text-align: center; }
            .signature-line { border-top: 1px solid #000; width: 250px; margin: 0 auto 5px; }
            .whitespace-pre-wrap { white-space: pre-wrap; word-wrap: break-word; }
            @media print { body { padding: 10px; } }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
            <h1 className="text-2xl font-bold text-foreground" data-testid="text-page-title">Encaminhamento Médico</h1>
            <p className="text-muted-foreground">Selecione um modelo, preencha e gere o encaminhamento.</p>
        </div>
        <Dialog open={isManageTemplatesOpen} onOpenChange={setIsManageTemplatesOpen}>
            <DialogTrigger asChild>
                <Button variant="outline"><BookTemplate className="w-4 h-4 mr-2" /> Gerenciar Modelos</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader><DialogTitle>Gerenciar Modelos de Encaminhamento</DialogTitle></DialogHeader>
                <div className="space-y-4 py-4">
                    {templates.map(template => (
                        <div key={template.name} className="flex items-center justify-between p-2 border rounded-lg">
                           <span className="font-medium">{template.name}</span>
                           <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleOpenEditTemplateDialog(template)}><Edit className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteTemplate(template.name)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                           </div>
                        </div>
                    ))}
                </div>
                <DialogFooter><Button onClick={handleOpenNewTemplateDialog}><Plus className="w-4 h-4 mr-2"/>Adicionar Novo</Button></DialogFooter>
            </DialogContent>
        </Dialog>
      </div>

       <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader><DialogTitle>{editingTemplate ? "Editar" : "Adicionar Novo"} Modelo</DialogTitle></DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="template-name" className="text-right">Nome</Label>
                        <Input id="template-name" value={templateName} onChange={(e) => setTemplateName(e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="template-content" className="text-right">Conteúdo</Label>
                        <Textarea id="template-content" value={templateContent} onChange={(e) => setTemplateContent(e.target.value)} className="col-span-3" rows={10}/>
                    </div>
                     <div className="text-xs text-muted-foreground col-start-2 col-span-3">
                        Use chaves para substituição: {`{patientName}`}, {`{patientAge}`}, etc.
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="secondary">Cancelar</Button></DialogClose>
                    <Button type="button" onClick={handleSaveTemplate}>Salvar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
             <CardHeader><CardTitle>Modelo de Encaminhamento</CardTitle></CardHeader>
            <CardContent>
                <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
                    <SelectTrigger><SelectValue placeholder="Selecione um modelo"/></SelectTrigger>
                    <SelectContent>{templates.map(t => <SelectItem key={t.name} value={t.name}>{t.name}</SelectItem>)}</SelectContent>
                </Select>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><ArrowRightLeft className="w-5 h-5" /> Dados do Paciente</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><Label htmlFor="patientName">Nome Completo *</Label><Input id="patientName" value={form.patientName} onChange={(e) => setForm({ ...form, patientName: e.target.value })} placeholder="Nome completo do paciente" /></div>
              <div className="grid grid-cols-3 gap-4">
                <div><Label htmlFor="patientBirthDate">Data de Nascimento</Label><Input id="patientBirthDate" type="date" value={form.patientBirthDate} onChange={(e) => setForm({ ...form, patientBirthDate: e.target.value })}/></div>
                <div><Label htmlFor="patientAge">Idade</Label><Input id="patientAge" value={form.patientAge} onChange={(e) => setForm({ ...form, patientAge: e.target.value })} placeholder="Ex: 45 anos"/></div>
                <div><Label htmlFor="patientSex">Sexo</Label><Select value={form.patientSex} onValueChange={(v) => setForm({ ...form, patientSex: v })}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent><SelectItem value="M">Masculino</SelectItem><SelectItem value="F">Feminino</SelectItem></SelectContent></Select></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label htmlFor="patientDocument">Documento</Label><Input id="patientDocument" value={form.patientDocument} onChange={(e) => setForm({ ...form, patientDocument: e.target.value })} placeholder="CPF / RG / CNS"/></div>
                <div><Label htmlFor="originUnit">Unidade de Origem</Label><Input id="originUnit" value={form.originUnit} onChange={(e) => setForm({ ...form, originUnit: e.target.value })} placeholder="Nome da unidade"/></div>
              </div>
              <div><Label htmlFor="patientAddress">Endereço</Label><Input id="patientAddress" value={form.patientAddress} onChange={(e) => setForm({ ...form, patientAddress: e.target.value })} placeholder="Endereço completo"/></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Sinais Vitais</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-3">
                 {(Object.keys(form.vitalSigns) as Array<keyof typeof form.vitalSigns>).map(key => (
                     <div key={key}>
                        <Label htmlFor={key} className="text-xs font-semibold uppercase">{key}</Label>
                        <Input id={key} value={form.vitalSigns[key]} onChange={(e) => setForm({...form, vitalSigns: {...form.vitalSigns, [key]: e.target.value}})} />
                     </div>
                 ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Conteúdo do Encaminhamento</CardTitle></CardHeader>
            <CardContent className="space-y-4">
               <div className="grid grid-cols-2 gap-4">
                <div><Label htmlFor="destination">Serviço de Destino *</Label><Input id="destination" value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} placeholder="Ex: UPA, Hospital..."/></div>
                <div><Label htmlFor="referralReason">Motivo *</Label><Input id="referralReason" value={form.referralReason} onChange={(e) => setForm({ ...form, referralReason: e.target.value })} placeholder="Ex: Avaliação especializada"/></div>
              </div>
              <div>
                <Label htmlFor="clinicalHistory">História Clínica e Justificativa (do Modelo)</Label>
                <Textarea id="clinicalHistory" value={form.clinicalHistory} onChange={(e) => setForm({ ...form, clinicalHistory: e.target.value })} rows={12} />
              </div>
              <div className="flex gap-2 flex-wrap">
                <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                  <DialogTrigger asChild><Button variant="outline" disabled={!form.patientName}><Eye className="w-4 h-4 mr-2" /> Visualizar</Button></DialogTrigger>
                  <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader><DialogTitle>Pré-visualização do Encaminhamento</DialogTitle></DialogHeader>
                    <div ref={printRef} className="bg-white text-black p-4 rounded text-sm">
                        <div className="whitespace-pre-wrap">{getInterpolatedContent()}</div>
                         <div className="signature"><div className="signature-line"></div><div className="text-xs">{doctorProfile?.stampText || "Dr(a). ________________________"}<br />CRM: {doctorProfile?.crm || "____________"}/{doctorProfile?.crmState || "__"}</div><div className="mt-2 text-xs text-gray-500">[Carimbo]</div></div>
                    </div>
                    <div className="flex justify-end gap-2 mt-4"><Button onClick={handlePrint}><Printer className="w-4 h-4 mr-2" /> Imprimir</Button></div>
                  </DialogContent>
                </Dialog>
                <Button onClick={() => createMutation.mutate(form)} disabled={!form.patientName || createMutation.isPending}><Plus className="w-4 h-4 mr-2" /> Salvar</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Encaminhamentos Recentes</CardTitle></CardHeader>
          <CardContent>
            {referrals.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Nenhum encaminhamento gerado.</p>
            ) : (
              <div className="space-y-2">
                {referrals.slice(0, 10).map((ref: Referral) => (
                  <div key={ref.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{ref.patientName}</p>
                      <p className="text-xs text-muted-foreground">{ref.destination}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(ref.createdAt), "dd/MM/yyyy")}</p>
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(ref.id)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
