import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Printer, Eye, FileCheck, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { DoctorProfile } from "@shared/schema";

const PERIODS = [
  { value: "manha", label: "Manhã" },
  { value: "tarde", label: "Tarde" },
  { value: "noite", label: "Noite" },
  { value: "integral", label: "Período Integral" },
];

export default function AttendanceDeclaration() {
  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  const [form, setForm] = useState({
    patientName: "",
    patientDocument: "",
    attendanceDate: format(new Date(), "yyyy-MM-dd"),
    period: "manha",
    startTime: "",
    endTime: "",
    location: "",
  });

  const { data: doctorProfile } = useQuery<DoctorProfile>({
    queryKey: ["/api/doctor-profile"],
  });

  const { data: declarations = [] } = useQuery<any[]>({
    queryKey: ["/api/attendance-declarations"],
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => apiRequest("POST", "/api/attendance-declarations", { ...data, attendanceDate: new Date(data.attendanceDate) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance-declarations"] });
      toast({ title: "Declaração salva com sucesso" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/attendance-declarations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance-declarations"] });
      toast({ title: "Declaração excluída" });
    },
  });

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;
    
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Declaração de Comparecimento</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #000; padding-bottom: 20px; }
            .title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
            .content { line-height: 2; font-size: 14px; margin-bottom: 40px; }
            .signature { margin-top: 80px; text-align: center; }
            .signature-line { border-top: 1px solid #000; width: 300px; margin: 0 auto 10px; }
            .doctor-info { font-size: 14px; }
            .stamp-area { margin-top: 20px; text-align: center; font-size: 12px; color: #666; }
            @media print { body { padding: 20px; } }
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

  const getPeriodText = () => {
    if (form.startTime && form.endTime) {
      return `das ${form.startTime} às ${form.endTime}`;
    }
    return PERIODS.find(p => p.value === form.period)?.label || form.period;
  };

  const declarationText = `
    Declaro, para os devidos fins, que o(a) Sr(a). ${form.patientName || "[Nome do Paciente]"}${form.patientDocument ? `, portador(a) do documento ${form.patientDocument}` : ""}, 
    compareceu a este serviço de saúde${form.location ? ` (${form.location})` : ""} no dia ${format(new Date(form.attendanceDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}, 
    no período da ${getPeriodText()}, para atendimento médico.
  `.trim();

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground" data-testid="text-page-title">Declaração de Comparecimento</h1>
        <p className="text-muted-foreground">Gere declarações de comparecimento</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="w-5 h-5" />
              Dados da Declaração
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="patientName">Nome do Paciente *</Label>
              <Input
                id="patientName"
                value={form.patientName}
                onChange={(e) => setForm({ ...form, patientName: e.target.value })}
                placeholder="Nome completo"
                data-testid="input-patient-name"
              />
            </div>
            <div>
              <Label htmlFor="patientDocument">Documento (CPF/RG)</Label>
              <Input
                id="patientDocument"
                value={form.patientDocument}
                onChange={(e) => setForm({ ...form, patientDocument: e.target.value })}
                placeholder="Opcional"
                data-testid="input-patient-document"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="attendanceDate">Data do Comparecimento *</Label>
                <Input
                  id="attendanceDate"
                  type="date"
                  value={form.attendanceDate}
                  onChange={(e) => setForm({ ...form, attendanceDate: e.target.value })}
                  data-testid="input-attendance-date"
                />
              </div>
              <div>
                <Label htmlFor="period">Período</Label>
                <Select value={form.period} onValueChange={(v) => setForm({ ...form, period: v })}>
                  <SelectTrigger data-testid="select-period">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PERIODS.map(p => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startTime">Horário Início</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={form.startTime}
                  onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                  placeholder="Opcional"
                  data-testid="input-start-time"
                />
              </div>
              <div>
                <Label htmlFor="endTime">Horário Fim</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={form.endTime}
                  onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                  placeholder="Opcional"
                  data-testid="input-end-time"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="location">Local / Serviço</Label>
              <Input
                id="location"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="Opcional"
                data-testid="input-location"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" disabled={!form.patientName} data-testid="button-preview">
                    <Eye className="w-4 h-4 mr-2" />
                    Visualizar
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Pré-visualização da Declaração</DialogTitle>
                  </DialogHeader>
                  <div ref={printRef} className="bg-white text-black p-6 rounded">
                    <div className="header text-center mb-8 border-b-2 border-black pb-4">
                      <div className="title text-2xl font-bold mb-2">DECLARAÇÃO DE COMPARECIMENTO</div>
                      <div className="text-sm text-gray-600">Sistema Único de Saúde - SUS</div>
                    </div>
                    <div className="content leading-8 text-sm mb-8 whitespace-pre-wrap">
                      {declarationText}
                    </div>
                    <div className="text-right text-sm mb-8">
                      {format(new Date(), "'Local e data:' ______________________, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </div>
                    <div className="signature mt-16 text-center">
                      <div className="signature-line border-t border-black w-72 mx-auto mb-2"></div>
                      <div className="doctor-info text-sm">
                        {doctorProfile?.stampText || "Dr(a). ________________________"}
                        <br />
                        CRM: {doctorProfile?.crm || "____________"}/{doctorProfile?.crmState || "__"}
                      </div>
                      <div className="stamp-area mt-4 text-xs text-gray-500">
                        [Espaço para carimbo]
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <Button onClick={handlePrint} data-testid="button-print">
                      <Printer className="w-4 h-4 mr-2" />
                      Imprimir
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Button 
                onClick={() => createMutation.mutate(form)} 
                disabled={!form.patientName || createMutation.isPending}
                data-testid="button-save"
              >
                <Plus className="w-4 h-4 mr-2" />
                Salvar
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Declarações Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            {declarations.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Nenhuma declaração gerada ainda.</p>
            ) : (
              <div className="space-y-2">
                {declarations.slice(0, 10).map((decl: any) => (
                  <div key={decl.id} className="flex items-center justify-between p-3 border rounded-lg" data-testid={`card-declaration-${decl.id}`}>
                    <div>
                      <p className="font-medium">{decl.patientName}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(decl.attendanceDate), "dd/MM/yyyy")} - {PERIODS.find(p => p.value === decl.period)?.label || decl.period}
                      </p>
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(decl.id)} data-testid={`button-delete-${decl.id}`}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
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
