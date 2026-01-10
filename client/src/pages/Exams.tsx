import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Printer, Copy, Trash2, FlaskConical, ScanLine, Check, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

const LAB_EXAMS = [
  "Hemograma completo",
  "Glicemia de jejum",
  "Hemoglobina glicada (HbA1c)",
  "Ureia e Creatinina",
  "Sódio e Potássio",
  "TGO/TGP",
  "Bilirrubinas",
  "Fosfatase alcalina e GGT",
  "PCR",
  "EAS (Urina tipo 1)",
  "Lipidograma",
  "TSH e T4 livre",
];

const IMAGING_EXAMS = [
  "RX de tórax (PA e perfil)",
  "Ultrassonografia de abdome total",
  "Ultrassonografia de vias urinárias",
  "Tomografia de crânio sem contraste",
  "Eletrocardiograma",
];

const STORAGE_KEY = "pedido_exames_draft";

interface PatientData {
  name: string;
  age: string;
  cpf: string;
  cns: string;
}

interface ExamDraft {
  patient: PatientData;
  selectedLab: string[];
  selectedImaging: string[];
  otherLab: string;
  otherImaging: string;
  hypothesis: string;
  healthUnit: string;
}

export default function Exams() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const printRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  const [patient, setPatient] = useState<PatientData>({
    name: "",
    age: "",
    cpf: "",
    cns: "",
  });

  const [selectedLab, setSelectedLab] = useState<string[]>([...LAB_EXAMS]);
  const [selectedImaging, setSelectedImaging] = useState<string[]>([...IMAGING_EXAMS]);
  const [otherLab, setOtherLab] = useState("");
  const [otherImaging, setOtherImaging] = useState("");
  const [hypothesis, setHypothesis] = useState("");
  const [healthUnit, setHealthUnit] = useState("");
  const [activeTab, setActiveTab] = useState("lab");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const draft: ExamDraft = JSON.parse(saved);
        setPatient(draft.patient);
        setSelectedLab(draft.selectedLab);
        setSelectedImaging(draft.selectedImaging);
        setOtherLab(draft.otherLab);
        setOtherImaging(draft.otherImaging);
        setHypothesis(draft.hypothesis);
        setHealthUnit(draft.healthUnit);
      } catch {}
    }
  }, []);

  useEffect(() => {
    const draft: ExamDraft = {
      patient,
      selectedLab,
      selectedImaging,
      otherLab,
      otherImaging,
      hypothesis,
      healthUnit,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  }, [patient, selectedLab, selectedImaging, otherLab, otherImaging, hypothesis, healthUnit]);

  const toggleLabExam = (exam: string) => {
    setSelectedLab((prev) =>
      prev.includes(exam) ? prev.filter((e) => e !== exam) : [...prev, exam]
    );
  };

  const toggleImagingExam = (exam: string) => {
    setSelectedImaging((prev) =>
      prev.includes(exam) ? prev.filter((e) => e !== exam) : [...prev, exam]
    );
  };

  const clearAll = () => {
    setPatient({ name: "", age: "", cpf: "", cns: "" });
    setSelectedLab([...LAB_EXAMS]);
    setSelectedImaging([...IMAGING_EXAMS]);
    setOtherLab("");
    setOtherImaging("");
    setHypothesis("");
    setHealthUnit("");
    localStorage.removeItem(STORAGE_KEY);
    toast({ title: "Formulário limpo" });
  };

  const getOtherExams = (text: string): string[] => {
    return text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  };

  const allLabExams = [...selectedLab, ...getOtherExams(otherLab)];
  const allImagingExams = [...selectedImaging, ...getOtherExams(otherImaging)];

  const currentDate = new Date().toLocaleDateString("pt-BR");

  const generateText = (): string => {
    let text = `SOLICITAÇÃO DE EXAMES – SUS\n\n`;
    text += `Data: ${currentDate}\n\n`;
    text += `IDENTIFICAÇÃO DO PACIENTE\n`;
    text += `Nome: ${patient.name || "___________________________"}\n`;
    if (patient.age) text += `Idade: ${patient.age}\n`;
    if (patient.cpf) text += `CPF: ${patient.cpf}\n`;
    if (patient.cns) text += `CNS: ${patient.cns}\n`;
    text += `\n`;

    if (allLabExams.length > 0) {
      text += `EXAMES LABORATORIAIS\n`;
      allLabExams.forEach((exam, i) => {
        text += `${i + 1}. ${exam}\n`;
      });
      text += `\n`;
    }

    if (allImagingExams.length > 0) {
      text += `EXAMES DE IMAGEM\n`;
      allImagingExams.forEach((exam, i) => {
        text += `${i + 1}. ${exam}\n`;
      });
      text += `\n`;
    }

    if (hypothesis) {
      text += `HIPÓTESE DIAGNÓSTICA / JUSTIFICATIVA CLÍNICA\n`;
      text += `${hypothesis}\n\n`;
    }

    if (healthUnit) {
      text += `Unidade de Saúde: ${healthUnit}\n\n`;
    }

    text += `\n\n_______________________________\nAssinatura e Carimbo do Profissional`;

    return text;
  };

  const handleCopy = async () => {
    const text = generateText();
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: "Copiado!" });
    setTimeout(() => setCopied(false), 2000);
  };

  const validateCpf = (cpf: string): boolean => {
    const digits = cpf.replace(/\D/g, "");
    return digits.length === 0 || digits.length === 11;
  };

  const validateCns = (cns: string): boolean => {
    const digits = cns.replace(/\D/g, "");
    return digits.length === 0 || digits.length === 15;
  };

  const handlePrint = () => {
    if (!patient.name.trim()) {
      toast({ title: "Nome do paciente é obrigatório", variant: "destructive" });
      return;
    }
    if (patient.cpf && !validateCpf(patient.cpf)) {
      toast({ title: "CPF deve ter 11 dígitos", variant: "destructive" });
      return;
    }
    if (patient.cns && !validateCns(patient.cns)) {
      toast({ title: "CNS deve ter 15 dígitos", variant: "destructive" });
      return;
    }
    window.print();
  };

  const handleBack = () => {
    navigate("/");
  };

  const labCount = allLabExams.length;
  const imagingCount = allImagingExams.length;

  return (
    <>
      <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6 print:hidden">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold font-display flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            Pedido de Exames
          </h1>
          <Button variant="outline" onClick={clearAll} className="gap-2" data-testid="button-clear-exams">
            <Trash2 className="h-4 w-4" />
            Limpar
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Dados do Paciente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="patient-name">Nome Completo *</Label>
                <Input
                  id="patient-name"
                  value={patient.name}
                  onChange={(e) => setPatient({ ...patient, name: e.target.value })}
                  placeholder="Nome do paciente"
                  data-testid="input-patient-name"
                />
              </div>
              <div>
                <Label htmlFor="patient-age">Idade</Label>
                <Input
                  id="patient-age"
                  value={patient.age}
                  onChange={(e) => setPatient({ ...patient, age: e.target.value })}
                  placeholder="Ex: 45 anos"
                  data-testid="input-patient-age"
                />
              </div>
              <div>
                <Label htmlFor="patient-cpf">CPF</Label>
                <Input
                  id="patient-cpf"
                  value={patient.cpf}
                  onChange={(e) => setPatient({ ...patient, cpf: e.target.value })}
                  placeholder="000.000.000-00"
                  maxLength={14}
                  data-testid="input-patient-cpf"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="patient-cns">Cartão Nacional de Saúde (CNS)</Label>
                <Input
                  id="patient-cns"
                  value={patient.cns}
                  onChange={(e) => setPatient({ ...patient, cns: e.target.value })}
                  placeholder="000 0000 0000 0000"
                  maxLength={18}
                  data-testid="input-patient-cns"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="lab" className="gap-2" data-testid="tab-lab">
              <FlaskConical className="h-4 w-4" />
              Laboratório ({labCount})
            </TabsTrigger>
            <TabsTrigger value="imaging" className="gap-2" data-testid="tab-imaging">
              <ScanLine className="h-4 w-4" />
              Imagem ({imagingCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="lab" className="mt-4">
            <Card>
              <CardContent className="pt-6">
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-3">
                    {LAB_EXAMS.map((exam) => (
                      <div key={exam} className="flex items-center space-x-3">
                        <Checkbox
                          id={`lab-${exam}`}
                          checked={selectedLab.includes(exam)}
                          onCheckedChange={() => toggleLabExam(exam)}
                          data-testid={`checkbox-lab-${exam.replace(/\s/g, "-")}`}
                        />
                        <Label htmlFor={`lab-${exam}`} className="cursor-pointer">
                          {exam}
                        </Label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <div className="mt-4 pt-4 border-t">
                  <Label>Outros exames laboratoriais (um por linha)</Label>
                  <Textarea
                    value={otherLab}
                    onChange={(e) => setOtherLab(e.target.value)}
                    placeholder="Ex: Vitamina D&#10;Ferritina&#10;Ácido úrico"
                    className="mt-2 min-h-[100px]"
                    data-testid="textarea-other-lab"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="imaging" className="mt-4">
            <Card>
              <CardContent className="pt-6">
                <ScrollArea className="h-[200px] pr-4">
                  <div className="space-y-3">
                    {IMAGING_EXAMS.map((exam) => (
                      <div key={exam} className="flex items-center space-x-3">
                        <Checkbox
                          id={`img-${exam}`}
                          checked={selectedImaging.includes(exam)}
                          onCheckedChange={() => toggleImagingExam(exam)}
                          data-testid={`checkbox-img-${exam.replace(/\s/g, "-")}`}
                        />
                        <Label htmlFor={`img-${exam}`} className="cursor-pointer">
                          {exam}
                        </Label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <div className="mt-4 pt-4 border-t">
                  <Label>Outros exames de imagem (um por linha)</Label>
                  <Textarea
                    value={otherImaging}
                    onChange={(e) => setOtherImaging(e.target.value)}
                    placeholder="Ex: Ressonância de coluna lombar&#10;Doppler de carótidas"
                    className="mt-2 min-h-[100px]"
                    data-testid="textarea-other-imaging"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Informações Clínicas (Opcional)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="hypothesis">Hipótese Diagnóstica / Justificativa Clínica</Label>
              <Textarea
                id="hypothesis"
                value={hypothesis}
                onChange={(e) => setHypothesis(e.target.value)}
                placeholder="Descreva a hipótese diagnóstica ou justificativa para os exames..."
                className="mt-2"
                data-testid="textarea-hypothesis"
              />
            </div>
            <div>
              <Label htmlFor="health-unit">Unidade de Saúde</Label>
              <Input
                id="health-unit"
                value={healthUnit}
                onChange={(e) => setHealthUnit(e.target.value)}
                placeholder="Nome da unidade de saúde"
                className="mt-2"
                data-testid="input-health-unit"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-3 sticky bottom-4 bg-background/95 backdrop-blur p-4 -mx-4 border-t">
          <Button onClick={handleBack} variant="ghost" className="gap-2" data-testid="button-back-exams">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <Button onClick={handleCopy} variant="outline" className="flex-1 gap-2" data-testid="button-copy-exams">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copiado!" : "Copiar"}
          </Button>
          <Button onClick={handlePrint} className="flex-1 gap-2" data-testid="button-print-exams">
            <Printer className="h-4 w-4" />
            Imprimir
          </Button>
        </div>
      </div>

      <div ref={printRef} className="hidden print:block">
        <style>{`
          @media print {
            @page { size: A4; margin: 12mm; }
            body { font-family: Arial, sans-serif; font-size: 11pt; color: #000; background: #fff; margin: 0; padding: 0; }
            .print-page { page-break-after: always; page-break-inside: avoid; break-inside: avoid; padding: 0; box-sizing: border-box; }
            .print-page:last-child { page-break-after: auto; }
            .print-header { border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 12px; }
            .print-title { font-size: 14pt; font-weight: bold; text-align: center; margin-bottom: 6px; }
            .print-section { margin-bottom: 12px; page-break-inside: avoid; break-inside: avoid; }
            .print-section-title { font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 4px; margin-bottom: 8px; font-size: 11pt; }
            .print-field { margin-bottom: 4px; }
            .print-field-label { font-weight: bold; }
            .print-list { list-style: none; padding: 0; margin: 0; }
            .print-list li { padding: 2px 0; border-bottom: 1px dotted #ccc; }
            .print-signature { margin-top: 30px; text-align: center; page-break-inside: avoid; break-inside: avoid; }
            .print-signature-line { border-top: 1px solid #000; width: 280px; margin: 0 auto 8px; padding-top: 8px; }
            .print-date { text-align: right; margin-bottom: 12px; font-size: 10pt; }
            * { box-sizing: border-box; }
          }
        `}</style>

        {allLabExams.length > 0 && (
          <div className="print-page">
            <div className="print-header">
              <div className="print-title">SOLICITAÇÃO DE EXAMES LABORATORIAIS – SUS</div>
            </div>
            <div className="print-date">Data: {currentDate}</div>
            
            <div className="print-section">
              <div className="print-section-title">IDENTIFICAÇÃO DO PACIENTE</div>
              <div className="print-field">
                <span className="print-field-label">Nome:</span> {patient.name || "_______________________________"}
              </div>
              {patient.age && (
                <div className="print-field">
                  <span className="print-field-label">Idade:</span> {patient.age}
                </div>
              )}
              {patient.cpf && (
                <div className="print-field">
                  <span className="print-field-label">CPF:</span> {patient.cpf}
                </div>
              )}
              {patient.cns && (
                <div className="print-field">
                  <span className="print-field-label">CNS:</span> {patient.cns}
                </div>
              )}
            </div>

            <div className="print-section">
              <div className="print-section-title">EXAMES LABORATORIAIS SOLICITADOS</div>
              <ul className="print-list">
                {allLabExams.map((exam, i) => (
                  <li key={i}>{i + 1}. {exam}</li>
                ))}
              </ul>
            </div>

            {hypothesis && (
              <div className="print-section">
                <div className="print-section-title">HIPÓTESE DIAGNÓSTICA / JUSTIFICATIVA</div>
                <p>{hypothesis}</p>
              </div>
            )}

            {healthUnit && (
              <div className="print-field">
                <span className="print-field-label">Unidade de Saúde:</span> {healthUnit}
              </div>
            )}

            <div className="print-signature">
              <div className="print-signature-line">Assinatura e Carimbo do Profissional</div>
            </div>
          </div>
        )}

        {allImagingExams.map((exam, index) => (
          <div key={index} className="print-page">
            <div className="print-header">
              <div className="print-title">SOLICITAÇÃO DE EXAME DE IMAGEM – SUS</div>
            </div>
            <div className="print-date">Data: {currentDate}</div>
            
            <div className="print-section">
              <div className="print-section-title">IDENTIFICAÇÃO DO PACIENTE</div>
              <div className="print-field">
                <span className="print-field-label">Nome:</span> {patient.name || "_______________________________"}
              </div>
              {patient.age && (
                <div className="print-field">
                  <span className="print-field-label">Idade:</span> {patient.age}
                </div>
              )}
              {patient.cpf && (
                <div className="print-field">
                  <span className="print-field-label">CPF:</span> {patient.cpf}
                </div>
              )}
              {patient.cns && (
                <div className="print-field">
                  <span className="print-field-label">CNS:</span> {patient.cns}
                </div>
              )}
            </div>

            <div className="print-section">
              <div className="print-section-title">EXAME SOLICITADO</div>
              <p style={{ fontSize: "14pt", fontWeight: "bold", padding: "10px 0" }}>{exam}</p>
            </div>

            {hypothesis && (
              <div className="print-section">
                <div className="print-section-title">HIPÓTESE DIAGNÓSTICA / JUSTIFICATIVA</div>
                <p>{hypothesis}</p>
              </div>
            )}

            {healthUnit && (
              <div className="print-field">
                <span className="print-field-label">Unidade de Saúde:</span> {healthUnit}
              </div>
            )}

            <div className="print-signature">
              <div className="print-signature-line">Assinatura e Carimbo do Profissional</div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
