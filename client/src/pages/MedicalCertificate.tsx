import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Printer, Eye, FileText, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { DoctorProfile } from "@shared/schema";

export default function MedicalCertificate() {
  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  const [form, setForm] = useState({
    patientName: "",
    patientDocument: "",
    daysOff: 1,
    startDate: format(new Date(), "yyyy-MM-dd"),
    reason: "",
  });

  const { data: doctorProfile } = useQuery<DoctorProfile>({
    queryKey: ["/api/doctor-profile"],
  });

  const { data: certificates = [] } = useQuery<any[]>({
    queryKey: ["/api/medical-certificates"],
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => apiRequest("POST", "/api/medical-certificates", { ...data, startDate: new Date(data.startDate) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/medical-certificates"] });
      toast({ title: "Atestado salvo com sucesso" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/medical-certificates/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/medical-certificates"] });
      toast({ title: "Atestado excluído" });
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
          <title>Atestado Médico</title>
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

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  const getEndDate = () => {
    const start = new Date(form.startDate);
    start.setDate(start.getDate() + form.daysOff - 1);
    return format(start, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  const certificateText = `
    Atesto para os devidos fins que o(a) paciente ${form.patientName || "[Nome do Paciente]"}${form.patientDocument ? `, portador(a) do documento ${form.patientDocument}` : ""}, 
    esteve sob meus cuidados médicos e necessita afastar-se de suas atividades por ${form.daysOff} (${form.daysOff === 1 ? "um" : form.daysOff}) dia(s), 
    a partir de ${formatDate(form.startDate)}${form.daysOff > 1 ? ` até ${getEndDate()}` : ""}.
    ${form.reason ? `\n\nMotivo: ${form.reason}` : ""}
  `.trim();

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground" data-testid="text-page-title">Atestado Médico</h1>
        <p className="text-muted-foreground">Gere atestados médicos no padrão SUS</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Dados do Atestado
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
                <Label htmlFor="daysOff">Dias de Afastamento *</Label>
                <Input
                  id="daysOff"
                  type="number"
                  min={1}
                  value={form.daysOff}
                  onChange={(e) => setForm({ ...form, daysOff: parseInt(e.target.value) || 1 })}
                  data-testid="input-days-off"
                />
              </div>
              <div>
                <Label htmlFor="startDate">Data de Início *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  data-testid="input-start-date"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="reason">Motivo (opcional)</Label>
              <Textarea
                id="reason"
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                placeholder="CID ou descrição"
                rows={2}
                data-testid="textarea-reason"
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
                    <DialogTitle>Pré-visualização do Atestado</DialogTitle>
                  </DialogHeader>
                  <div ref={printRef} className="bg-white text-black p-6 rounded">
                    <div className="header text-center mb-8 border-b-2 border-black pb-4">
                      <div className="title text-2xl font-bold mb-2">ATESTADO MÉDICO</div>
                      <div className="text-sm text-gray-600">Sistema Único de Saúde - SUS</div>
                    </div>
                    <div className="content leading-8 text-sm mb-8 whitespace-pre-wrap">
                      {certificateText}
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
                        {doctorProfile?.specialty && <><br />{doctorProfile.specialty}</>}
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
            <CardTitle>Atestados Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            {certificates.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Nenhum atestado gerado ainda.</p>
            ) : (
              <div className="space-y-2">
                {certificates.slice(0, 10).map((cert: any) => (
                  <div key={cert.id} className="flex items-center justify-between p-3 border rounded-lg" data-testid={`card-certificate-${cert.id}`}>
                    <div>
                      <p className="font-medium">{cert.patientName}</p>
                      <p className="text-sm text-muted-foreground">
                        {cert.daysOff} dia(s) - {format(new Date(cert.startDate), "dd/MM/yyyy")}
                      </p>
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(cert.id)} data-testid={`button-delete-${cert.id}`}>
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
