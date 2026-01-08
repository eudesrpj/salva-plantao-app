import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Printer, Eye, X, FileText } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/hooks/use-auth";
import type { DoctorProfile } from "@shared/schema";

interface PrescriptionItem {
  medication: string;
  dose: string;
  quantity: string;
  interval: string;
  duration: string;
  route?: string;
  timing?: string;
  orientations?: string;
}

interface SUSPrescriptionPrintProps {
  prescriptions: PrescriptionItem[];
  patientName?: string;
  patientAge?: string;
  trigger?: React.ReactNode;
  warningSigns?: string[];
  onPrintComplete?: () => void;
}

export function SUSPrescriptionPrint({ prescriptions, patientName: initialPatientName, patientAge: initialPatientAge, trigger, warningSigns = [], onPrintComplete }: SUSPrescriptionPrintProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [patientName, setPatientName] = useState(initialPatientName || "");
  const [patientAge, setPatientAge] = useState(initialPatientAge || "");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const printRef = useRef<HTMLDivElement>(null);

  const { user } = useAuth();
  
  const { data: doctorProfile } = useQuery<DoctorProfile>({
    queryKey: ["/api/doctor-profile"],
  });

  const doctorName = user?.firstName ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ''}` : "";
  const today = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receituário SUS</title>
        <style>
          @page { 
            size: A4;
            margin: 10mm;
          }
          * { 
            margin: 0; 
            padding: 0; 
            box-sizing: border-box;
            font-family: Arial, sans-serif;
          }
          body { 
            font-size: 11pt;
            line-height: 1.4;
          }
          .prescription-page {
            page-break-after: always;
            min-height: 140mm;
            padding: 5mm;
            border: 1px dashed #ccc;
            margin-bottom: 2mm;
          }
          .prescription-page:last-child {
            page-break-after: avoid;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 8px;
            margin-bottom: 10px;
          }
          .header h1 {
            font-size: 14pt;
            font-weight: bold;
            margin-bottom: 4px;
          }
          .header p {
            font-size: 9pt;
            color: #333;
          }
          .patient-info {
            display: flex;
            justify-content: space-between;
            border-bottom: 1px solid #000;
            padding-bottom: 6px;
            margin-bottom: 10px;
          }
          .patient-info div {
            font-size: 10pt;
          }
          .patient-info strong {
            font-size: 11pt;
          }
          .prescription-body {
            min-height: 80mm;
          }
          .prescription-item {
            margin-bottom: 12px;
            padding-left: 8px;
          }
          .prescription-item .number {
            font-weight: bold;
            font-size: 12pt;
          }
          .prescription-item .medication {
            font-weight: bold;
            font-size: 11pt;
          }
          .prescription-item .instructions {
            font-size: 10pt;
            margin-left: 20px;
            margin-top: 2px;
          }
          .orientations {
            margin-top: 15px;
            padding: 8px;
            background: #f5f5f5;
            border-radius: 4px;
            font-size: 10pt;
          }
          .orientations-title {
            font-weight: bold;
            margin-bottom: 4px;
          }
          .footer {
            margin-top: 20px;
            border-top: 1px solid #000;
            padding-top: 10px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }
          .footer .date {
            font-size: 10pt;
          }
          .footer .signature {
            text-align: center;
            min-width: 200px;
          }
          .footer .signature .line {
            border-top: 1px solid #000;
            margin-top: 30px;
            padding-top: 4px;
          }
          .footer .signature .name {
            font-weight: bold;
            font-size: 10pt;
          }
          .footer .signature .crm {
            font-size: 9pt;
          }
          .via-label {
            text-align: center;
            font-size: 9pt;
            color: #666;
            margin-bottom: 5px;
            font-style: italic;
          }
          @media print {
            .prescription-page {
              border: none;
            }
          }
        </style>
      </head>
      <body>
        ${printContent.innerHTML}
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
      setIsOpen(false);
      onPrintComplete?.();
    }, 250);
  };

  const PrescriptionVia = ({ viaLabel }: { viaLabel: string }) => (
    <div className="prescription-page">
      <div className="via-label">{viaLabel}</div>
      <div className="header">
        <h1>RECEITUÁRIO</h1>
        <p>Sistema Único de Saúde - SUS</p>
        {doctorProfile?.specialty && <p>{doctorProfile.specialty}</p>}
      </div>
      
      <div className="patient-info">
        <div>
          <strong>Paciente:</strong> {patientName || "_________________________"}
        </div>
        <div>
          <strong>Idade:</strong> {patientAge || "____"} anos
        </div>
        <div>
          <strong>Data:</strong> {today}
        </div>
      </div>

      <div className="prescription-body">
        {prescriptions.map((item, idx) => (
          <div key={idx} className="prescription-item">
            <span className="number">{idx + 1}.</span>{" "}
            <span className="medication">{item.medication}</span>
            <div className="instructions">
              {item.dose && `${item.dose}`}
              {item.route && ` - ${item.route}`}
              {item.interval && ` - ${item.interval}`}
              {item.duration && ` por ${item.duration}`}
              {item.quantity && ` (${item.quantity})`}
              {item.timing && ` - ${item.timing}`}
            </div>
          </div>
        ))}

        {(additionalNotes || prescriptions.some(p => p.orientations) || warningSigns.length > 0) && (
          <div className="orientations">
            <div className="orientations-title">Orientações / Sinais de Alarme:</div>
            {prescriptions.filter(p => p.orientations).map((p, idx) => (
              <div key={idx}>- {p.orientations}</div>
            ))}
            {additionalNotes && <div>- {additionalNotes}</div>}
            {warningSigns.length > 0 && (
              <>
                <div style={{ marginTop: '8px', fontWeight: 'bold' }}>PROCURE ATENDIMENTO MÉDICO SE:</div>
                {warningSigns.map((sign, idx) => (
                  <div key={idx}>• {sign}</div>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      <div className="footer">
        <div className="date">
          Data: {today}
        </div>
        <div className="signature">
          <div className="line">
            <div className="name">
              {doctorName || "____________________"}
            </div>
            <div className="crm">
              CRM: {doctorProfile?.crm || "________"} / {doctorProfile?.crmState || "__"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          {trigger || (
            <Button variant="outline" className="gap-2" data-testid="button-print-prescription">
              <Printer className="h-4 w-4" />
              Imprimir
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Imprimir Receituário SUS
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="patientName">Nome do Paciente</Label>
                <Input
                  id="patientName"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="Nome completo"
                  data-testid="input-patient-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="patientAge">Idade</Label>
                <Input
                  id="patientAge"
                  value={patientAge}
                  onChange={(e) => setPatientAge(e.target.value)}
                  placeholder="Ex: 45"
                  data-testid="input-patient-age"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Medicamentos ({prescriptions.length})</Label>
              <div className="max-h-32 overflow-y-auto border rounded-md p-2 text-sm space-y-1">
                {prescriptions.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="font-medium">{idx + 1}.</span>
                    <span>{item.medication}</span>
                    <span className="text-muted-foreground">- {item.dose} {item.interval}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="additionalNotes">Orientações Adicionais</Label>
              <Textarea
                id="additionalNotes"
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="Sinais de alarme, retorno, etc."
                rows={2}
                data-testid="textarea-additional-notes"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsPreviewOpen(true)} className="gap-2">
              <Eye className="h-4 w-4" />
              Pré-visualizar
            </Button>
            <Button onClick={handlePrint} className="gap-2" data-testid="button-confirm-print">
              <Printer className="h-4 w-4" />
              Imprimir (2 vias)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Pré-visualização do Receituário
              </span>
              <Button size="icon" variant="ghost" onClick={() => setIsPreviewOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div ref={printRef} className="bg-white p-4 text-black">
            <PrescriptionVia viaLabel="1ª Via - Paciente" />
            <Separator className="my-4 border-dashed" />
            <PrescriptionVia viaLabel="2ª Via - Unidade de Saúde" />
          </div>
          <DialogFooter>
            <Button onClick={handlePrint} className="gap-2" data-testid="button-print-from-preview">
              <Printer className="h-4 w-4" />
              Imprimir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function QuickPrintButton({ prescription }: { prescription: { medication?: string | null; dose?: string | null; quantity?: string | null; interval?: string | null; duration?: string | null; route?: string | null; timing?: string | null; orientations?: string | null } }) {
  const item: PrescriptionItem = {
    medication: prescription.medication || "",
    dose: prescription.dose || "",
    quantity: prescription.quantity || "",
    interval: prescription.interval || "",
    duration: prescription.duration || "",
    route: prescription.route || "",
    timing: prescription.timing || "",
    orientations: prescription.orientations || "",
  };

  return (
    <SUSPrescriptionPrint
      prescriptions={[item]}
      trigger={
        <Button size="icon" variant="ghost" title="Imprimir receituário">
          <Printer className="h-4 w-4" />
        </Button>
      }
    />
  );
}
