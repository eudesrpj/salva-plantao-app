import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Printer, Eye, ArrowRightLeft, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { DoctorProfile, ReferralDestination, ReferralReason } from "@shared/schema";

export default function Referral() {
  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
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
    clinicalHistory: "",
  });

  const { data: doctorProfile } = useQuery<DoctorProfile>({
    queryKey: ["/api/doctor-profile"],
  });

  const { data: referrals = [] } = useQuery<any[]>({
    queryKey: ["/api/medical-referrals"],
  });

  const { data: destinations = [] } = useQuery<ReferralDestination[]>({
    queryKey: ["/api/referral-destinations"],
  });

  const { data: reasons = [] } = useQuery<ReferralReason[]>({
    queryKey: ["/api/referral-reasons"],
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => apiRequest("POST", "/api/medical-referrals", {
      ...data,
      patientBirthDate: data.patientBirthDate ? new Date(data.patientBirthDate) : null,
    }),
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
            .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
            .title { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
            .section { margin-bottom: 15px; padding: 10px; border: 1px solid #ccc; }
            .section-title { font-weight: bold; margin-bottom: 8px; border-bottom: 1px solid #eee; padding-bottom: 4px; }
            .row { display: flex; gap: 15px; margin-bottom: 5px; }
            .field { flex: 1; }
            .field-label { font-weight: bold; font-size: 10px; color: #666; }
            .field-value { border-bottom: 1px dotted #999; min-height: 18px; }
            .vital-signs { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; }
            .signature { margin-top: 40px; text-align: center; }
            .signature-line { border-top: 1px solid #000; width: 250px; margin: 0 auto 5px; }
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
      <div>
        <h1 className="text-2xl font-bold text-foreground" data-testid="text-page-title">Encaminhamento Médico</h1>
        <p className="text-muted-foreground">Gere encaminhamentos no padrão SUS</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5" />
                Dados do Paciente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="patientName">Nome Completo *</Label>
                <Input
                  id="patientName"
                  value={form.patientName}
                  onChange={(e) => setForm({ ...form, patientName: e.target.value })}
                  placeholder="Nome completo do paciente"
                  data-testid="input-patient-name"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="patientBirthDate">Data de Nascimento</Label>
                  <Input
                    id="patientBirthDate"
                    type="date"
                    value={form.patientBirthDate}
                    onChange={(e) => setForm({ ...form, patientBirthDate: e.target.value })}
                    data-testid="input-birth-date"
                  />
                </div>
                <div>
                  <Label htmlFor="patientAge">Idade</Label>
                  <Input
                    id="patientAge"
                    value={form.patientAge}
                    onChange={(e) => setForm({ ...form, patientAge: e.target.value })}
                    placeholder="Ex: 45 anos"
                    data-testid="input-age"
                  />
                </div>
                <div>
                  <Label htmlFor="patientSex">Sexo</Label>
                  <Select value={form.patientSex} onValueChange={(v) => setForm({ ...form, patientSex: v })}>
                    <SelectTrigger data-testid="select-sex">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="M">Masculino</SelectItem>
                      <SelectItem value="F">Feminino</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="patientDocument">Documento</Label>
                  <Input
                    id="patientDocument"
                    value={form.patientDocument}
                    onChange={(e) => setForm({ ...form, patientDocument: e.target.value })}
                    placeholder="CPF / RG / CNS"
                    data-testid="input-document"
                  />
                </div>
                <div>
                  <Label htmlFor="originUnit">Unidade de Origem</Label>
                  <Input
                    id="originUnit"
                    value={form.originUnit}
                    onChange={(e) => setForm({ ...form, originUnit: e.target.value })}
                    placeholder="Nome da unidade"
                    data-testid="input-origin-unit"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="patientAddress">Endereço</Label>
                <Input
                  id="patientAddress"
                  value={form.patientAddress}
                  onChange={(e) => setForm({ ...form, patientAddress: e.target.value })}
                  placeholder="Endereço completo"
                  data-testid="input-address"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sinais Vitais</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-3">
                <div>
                  <Label htmlFor="pa">PA (mmHg)</Label>
                  <Input
                    id="pa"
                    value={form.vitalSigns.pa}
                    onChange={(e) => setForm({ ...form, vitalSigns: { ...form.vitalSigns, pa: e.target.value } })}
                    placeholder="120x80"
                    data-testid="input-pa"
                  />
                </div>
                <div>
                  <Label htmlFor="fc">FC (bpm)</Label>
                  <Input
                    id="fc"
                    value={form.vitalSigns.fc}
                    onChange={(e) => setForm({ ...form, vitalSigns: { ...form.vitalSigns, fc: e.target.value } })}
                    placeholder="80"
                    data-testid="input-fc"
                  />
                </div>
                <div>
                  <Label htmlFor="fr">FR (irpm)</Label>
                  <Input
                    id="fr"
                    value={form.vitalSigns.fr}
                    onChange={(e) => setForm({ ...form, vitalSigns: { ...form.vitalSigns, fr: e.target.value } })}
                    placeholder="18"
                    data-testid="input-fr"
                  />
                </div>
                <div>
                  <Label htmlFor="spo2">SpO2 (%)</Label>
                  <Input
                    id="spo2"
                    value={form.vitalSigns.spo2}
                    onChange={(e) => setForm({ ...form, vitalSigns: { ...form.vitalSigns, spo2: e.target.value } })}
                    placeholder="98"
                    data-testid="input-spo2"
                  />
                </div>
                <div>
                  <Label htmlFor="temp">Temp (C)</Label>
                  <Input
                    id="temp"
                    value={form.vitalSigns.temp}
                    onChange={(e) => setForm({ ...form, vitalSigns: { ...form.vitalSigns, temp: e.target.value } })}
                    placeholder="36.5"
                    data-testid="input-temp"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Encaminhamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="destination">Serviço de Destino *</Label>
                  {destinations.length > 0 ? (
                    <Select value={form.destination} onValueChange={(v) => setForm({ ...form, destination: v })}>
                      <SelectTrigger data-testid="select-destination">
                        <SelectValue placeholder="Selecione o destino" />
                      </SelectTrigger>
                      <SelectContent>
                        {destinations.map(d => (
                          <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id="destination"
                      value={form.destination}
                      onChange={(e) => setForm({ ...form, destination: e.target.value })}
                      placeholder="Ex: UPA, Hospital, Especialidade"
                      data-testid="input-destination"
                    />
                  )}
                </div>
                <div>
                  <Label htmlFor="referralReason">Motivo do Encaminhamento *</Label>
                  {reasons.length > 0 ? (
                    <Select value={form.referralReason} onValueChange={(v) => setForm({ ...form, referralReason: v })}>
                      <SelectTrigger data-testid="select-reason">
                        <SelectValue placeholder="Selecione o motivo" />
                      </SelectTrigger>
                      <SelectContent>
                        {reasons.map(r => (
                          <SelectItem key={r.id} value={r.description}>{r.description}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id="referralReason"
                      value={form.referralReason}
                      onChange={(e) => setForm({ ...form, referralReason: e.target.value })}
                      placeholder="Motivo do encaminhamento"
                      data-testid="input-reason"
                    />
                  )}
                </div>
              </div>
              <div>
                <Label htmlFor="clinicalHistory">História Clínica e Justificativa</Label>
                <Textarea
                  id="clinicalHistory"
                  value={form.clinicalHistory}
                  onChange={(e) => setForm({ ...form, clinicalHistory: e.target.value })}
                  placeholder="Resumo da história, exames realizados, conduta inicial e justificativa do encaminhamento..."
                  rows={6}
                  data-testid="textarea-clinical-history"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" disabled={!form.patientName || !form.destination || !form.referralReason} data-testid="button-preview">
                      <Eye className="w-4 h-4 mr-2" />
                      Visualizar
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Pré-visualização do Encaminhamento</DialogTitle>
                    </DialogHeader>
                    <div ref={printRef} className="bg-white text-black p-4 rounded text-sm">
                      <div className="header text-center mb-4 border-b-2 border-black pb-2">
                        <div className="title text-lg font-bold">ENCAMINHAMENTO MÉDICO</div>
                        <div className="text-xs text-gray-600">Sistema Único de Saúde - SUS</div>
                      </div>
                      
                      <div className="section border p-2 mb-3">
                        <div className="section-title font-bold border-b pb-1 mb-2">IDENTIFICAÇÃO DO PACIENTE</div>
                        <div className="row flex gap-4 mb-1">
                          <div className="field flex-1">
                            <span className="field-label text-xs text-gray-600">Nome: </span>
                            <span className="field-value">{form.patientName}</span>
                          </div>
                          <div className="field">
                            <span className="field-label text-xs text-gray-600">Idade: </span>
                            <span className="field-value">{form.patientAge}</span>
                          </div>
                          <div className="field">
                            <span className="field-label text-xs text-gray-600">Sexo: </span>
                            <span className="field-value">{form.patientSex === "M" ? "Masculino" : form.patientSex === "F" ? "Feminino" : ""}</span>
                          </div>
                        </div>
                        <div className="row flex gap-4">
                          <div className="field flex-1">
                            <span className="field-label text-xs text-gray-600">Documento: </span>
                            <span className="field-value">{form.patientDocument}</span>
                          </div>
                          <div className="field flex-1">
                            <span className="field-label text-xs text-gray-600">Unidade de Origem: </span>
                            <span className="field-value">{form.originUnit}</span>
                          </div>
                        </div>
                      </div>

                      <div className="section border p-2 mb-3">
                        <div className="section-title font-bold border-b pb-1 mb-2">SINAIS VITAIS</div>
                        <div className="vital-signs grid grid-cols-5 gap-2 text-center">
                          <div><span className="text-xs text-gray-600">PA: </span>{form.vitalSigns.pa || "___"} mmHg</div>
                          <div><span className="text-xs text-gray-600">FC: </span>{form.vitalSigns.fc || "___"} bpm</div>
                          <div><span className="text-xs text-gray-600">FR: </span>{form.vitalSigns.fr || "___"} irpm</div>
                          <div><span className="text-xs text-gray-600">SpO2: </span>{form.vitalSigns.spo2 || "___"}%</div>
                          <div><span className="text-xs text-gray-600">Temp: </span>{form.vitalSigns.temp || "___"}C</div>
                        </div>
                      </div>

                      <div className="section border p-2 mb-3">
                        <div className="section-title font-bold border-b pb-1 mb-2">ENCAMINHAMENTO</div>
                        <div className="mb-2">
                          <span className="font-bold text-xs">Motivo: </span>
                          <span>{form.referralReason}</span>
                        </div>
                        <div className="mb-2">
                          <span className="font-bold text-xs">Destino: </span>
                          <span>{form.destination}</span>
                        </div>
                      </div>

                      {form.clinicalHistory && (
                        <div className="section border p-2 mb-3">
                          <div className="section-title font-bold border-b pb-1 mb-2">HISTÓRIA CLÍNICA E JUSTIFICATIVA</div>
                          <p className="whitespace-pre-wrap">{form.clinicalHistory}</p>
                        </div>
                      )}

                      <div className="text-right text-xs mb-4">
                        Data: {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </div>

                      <div className="signature mt-8 text-center">
                        <div className="signature-line border-t border-black w-64 mx-auto mb-1"></div>
                        <div className="text-xs">
                          {doctorProfile?.stampText || "Dr(a). ________________________"}
                          <br />
                          CRM: {doctorProfile?.crm || "____________"}/{doctorProfile?.crmState || "__"}
                        </div>
                        <div className="mt-2 text-xs text-gray-500">[Carimbo]</div>
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
                  disabled={!form.patientName || !form.destination || !form.referralReason || createMutation.isPending}
                  data-testid="button-save"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Salvar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Encaminhamentos Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            {referrals.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Nenhum encaminhamento gerado ainda.</p>
            ) : (
              <div className="space-y-2">
                {referrals.slice(0, 10).map((ref: any) => (
                  <div key={ref.id} className="flex items-center justify-between p-3 border rounded-lg" data-testid={`card-referral-${ref.id}`}>
                    <div>
                      <p className="font-medium text-sm">{ref.patientName}</p>
                      <p className="text-xs text-muted-foreground">{ref.destination}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(ref.createdAt), "dd/MM/yyyy")}
                      </p>
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(ref.id)} data-testid={`button-delete-${ref.id}`}>
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
