import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Download, FileText, Pill, FileCheck, BookOpen, ClipboardList, Stethoscope } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const IMPORT_TEMPLATES = {
  pathologies: {
    title: "Patologias",
    description: "Importar patologias para organizar prescrições e protocolos.",
    icon: Stethoscope,
    csv: {
      header: "nome;descricao;faixa_etaria;especialidade;tags",
      example: `Pneumonia Adquirida na Comunidade;Infecção pulmonar comum;adulto;Pneumologia;infecciosa,pulmonar
Insuficiência Cardíaca Descompensada;IC com edema agudo;adulto;Cardiologia;cardiaca,emergencia
Bronquiolite Viral Aguda;Infecção viral em lactentes;pediatrico;Pediatria;viral,respiratoria`,
      columns: [
        { name: "nome", required: true, description: "Nome da patologia" },
        { name: "descricao", required: false, description: "Descrição breve" },
        { name: "faixa_etaria", required: false, description: "adulto ou pediatrico (padrão: adulto)" },
        { name: "especialidade", required: false, description: "Especialidade médica" },
        { name: "tags", required: false, description: "Tags separadas por vírgula" },
      ],
    },
    json: {
      example: `{
  "pathologies": [
    {
      "name": "Pneumonia Adquirida na Comunidade",
      "description": "Infecção pulmonar comum",
      "ageGroup": "adulto",
      "specialty": "Pneumologia",
      "tags": ["infecciosa", "pulmonar"]
    },
    {
      "name": "Bronquiolite Viral Aguda",
      "description": "Infecção viral em lactentes",
      "ageGroup": "pediatrico",
      "specialty": "Pediatria",
      "tags": ["viral", "respiratoria"]
    }
  ]
}`,
    },
  },
  medications: {
    title: "Medicações",
    description: "Importar medicamentos para a biblioteca de referência.",
    icon: Pill,
    csv: {
      header: "nome;dose;dose_por_kg;dose_maxima;intervalo;via;forma_farmaceutica;faixa_etaria;categoria",
      example: `Amoxicilina;500mg;50mg/kg/dia;3g/dia;8/8h;VO;Comprimido;ambos;Antibióticos
Dipirona;1g;25mg/kg/dose;4g/dia;6/6h;VO;Comprimido;adulto;Analgésicos
Ibuprofeno;400mg;10mg/kg/dose;40mg/kg/dia;8/8h;VO;Suspensão;pediatrico;Anti-inflamatórios`,
      columns: [
        { name: "nome", required: true, description: "Nome do medicamento" },
        { name: "dose", required: false, description: "Dose padrão (ex: 500mg)" },
        { name: "dose_por_kg", required: false, description: "Dose por kg para pediatria" },
        { name: "dose_maxima", required: false, description: "Dose máxima diária" },
        { name: "intervalo", required: false, description: "Intervalo (ex: 8/8h)" },
        { name: "via", required: false, description: "Via de administração (VO, IV, IM)" },
        { name: "forma_farmaceutica", required: false, description: "Forma farmacêutica" },
        { name: "faixa_etaria", required: false, description: "adulto, pediatrico ou ambos" },
        { name: "categoria", required: false, description: "Categoria terapêutica" },
      ],
    },
    json: {
      example: `{
  "medications": [
    {
      "name": "Amoxicilina",
      "dose": "500mg",
      "dosePerKg": "50mg/kg/dia",
      "maxDose": "3g/dia",
      "interval": "8/8h",
      "route": "VO",
      "pharmaceuticalForm": "Comprimido",
      "ageGroup": "ambos",
      "category": "Antibióticos"
    }
  ]
}`,
    },
  },
  protocols: {
    title: "Protocolos",
    description: "Importar protocolos clínicos e condutas.",
    icon: FileText,
    csv: {
      header: "titulo;conteudo;descricao;faixa_etaria;especialidade;categoria;tags",
      example: `Protocolo de Sepse;Identificar sinais de sepse...;Manejo inicial de sepse grave;adulto;Emergência;urgencia;sepse,emergencia
PCR - Suporte Básico;Verificar responsividade...;Protocolo de parada cardiorrespiratória;adulto;Emergência;emergencia;pcr,rcp`,
      columns: [
        { name: "titulo", required: true, description: "Título do protocolo" },
        { name: "conteudo", required: true, description: "Conteúdo/passos do protocolo" },
        { name: "descricao", required: false, description: "Descrição breve" },
        { name: "faixa_etaria", required: false, description: "adulto ou pediatrico" },
        { name: "especialidade", required: false, description: "Especialidade médica" },
        { name: "categoria", required: false, description: "Categoria (urgencia, ambulatorio)" },
        { name: "tags", required: false, description: "Tags separadas por vírgula" },
      ],
    },
    json: {
      example: `{
  "protocols": [
    {
      "title": "Protocolo de Sepse",
      "content": { "text": "1. Identificar sinais de sepse\\n2. Coletar lactato e hemoculturas\\n3. Iniciar antibiótico em 1h" },
      "description": "Manejo inicial de sepse grave",
      "ageGroup": "adulto",
      "specialty": "Emergência",
      "category": "urgencia",
      "tags": ["sepse", "emergencia"]
    }
  ]
}`,
    },
  },
  checklists: {
    title: "Checklists",
    description: "Importar checklists e listas de verificação.",
    icon: ClipboardList,
    csv: {
      header: "titulo;itens;descricao;faixa_etaria;especialidade;categoria;patologia;tags",
      example: `Checklist de Admissão;Verificar sinais vitais\\nSolicitar exames\\nPrescever dieta;Lista de admissão hospitalar;adulto;Clínica Médica;geral;;admissao
Checklist de Alta;Orientar medicações\\nAgendar retorno\\nEntregar atestado;Lista para alta hospitalar;adulto;Clínica Médica;geral;;alta`,
      columns: [
        { name: "titulo", required: true, description: "Título do checklist" },
        { name: "itens", required: true, description: "Itens separados por \\n" },
        { name: "descricao", required: false, description: "Descrição breve" },
        { name: "faixa_etaria", required: false, description: "adulto ou pediatrico" },
        { name: "especialidade", required: false, description: "Especialidade médica" },
        { name: "categoria", required: false, description: "Categoria" },
        { name: "patologia", required: false, description: "Nome da patologia associada" },
        { name: "tags", required: false, description: "Tags separadas por vírgula" },
      ],
    },
    json: {
      example: `{
  "checklists": [
    {
      "title": "Checklist de Admissão",
      "content": { "items": ["Verificar sinais vitais", "Solicitar exames", "Prescrever dieta"] },
      "description": "Lista de admissão hospitalar",
      "ageGroup": "adulto",
      "specialty": "Clínica Médica",
      "category": "geral",
      "pathologyName": null,
      "tags": ["admissao"]
    }
  ]
}`,
    },
  },
  flashcards: {
    title: "Memorização (Cards)",
    description: "Importar flashcards para o sistema de memorização.",
    icon: BookOpen,
    csv: {
      header: "frente;verso;dica;tags",
      example: `Qual a dose de adrenalina na PCR?;1mg IV/IO a cada 3-5 minutos;Mesma dose para adultos e crianças;pcr,emergencia
Sinais de choque hipovolêmico?;Taquicardia, hipotensão, pele fria, oligúria;Lembrar dos 4 sinais cardinais;choque,emergencia`,
      columns: [
        { name: "frente", required: true, description: "Pergunta ou termo (frente do card)" },
        { name: "verso", required: true, description: "Resposta ou explicação (verso)" },
        { name: "dica", required: false, description: "Dica opcional" },
        { name: "tags", required: false, description: "Tags separadas por vírgula" },
      ],
    },
    json: {
      example: `{
  "cards": [
    {
      "front": "Qual a dose de adrenalina na PCR?",
      "back": "1mg IV/IO a cada 3-5 minutos",
      "hint": "Mesma dose para adultos e crianças",
      "tags": ["pcr", "emergencia"]
    }
  ]
}`,
    },
  },
  prescriptions: {
    title: "Prescrições",
    description: "Importar modelos de prescrição.",
    icon: FileCheck,
    csv: {
      header: "titulo;medicacao;dose;intervalo;duracao;via;forma;quantidade;orientacoes;faixa_etaria;categoria",
      example: `Amoxicilina - Infecção Respiratória;Amoxicilina;500mg;8/8h;7 dias;VO;Comprimido;21 comprimidos;Tomar com água, longe das refeições;adulto;Antibióticos
Dipirona - Febre;Dipirona;1g;6/6h;3 dias;VO;Comprimido;12 comprimidos;Tomar se temperatura > 37.8°C;adulto;Analgésicos`,
      columns: [
        { name: "titulo", required: true, description: "Título da prescrição" },
        { name: "medicacao", required: true, description: "Nome do medicamento" },
        { name: "dose", required: false, description: "Dose" },
        { name: "intervalo", required: false, description: "Intervalo de administração" },
        { name: "duracao", required: false, description: "Duração do tratamento" },
        { name: "via", required: false, description: "Via de administração" },
        { name: "forma", required: false, description: "Forma farmacêutica" },
        { name: "quantidade", required: false, description: "Quantidade a dispensar" },
        { name: "orientacoes", required: false, description: "Orientações ao paciente" },
        { name: "faixa_etaria", required: false, description: "adulto ou pediatrico" },
        { name: "categoria", required: false, description: "Categoria terapêutica" },
      ],
    },
    json: {
      example: `{
  "prescriptions": [
    {
      "title": "Amoxicilina - Infecção Respiratória",
      "medication": "Amoxicilina",
      "dose": "500mg",
      "interval": "8/8h",
      "duration": "7 dias",
      "route": "VO",
      "pharmaceuticalForm": "Comprimido",
      "quantity": "21 comprimidos",
      "orientations": "Tomar com água, longe das refeições",
      "ageGroup": "adulto",
      "category": "Antibióticos"
    }
  ]
}`,
    },
  },
};

export default function ImportTemplates() {
  const { toast } = useToast();
  const [activeType, setActiveType] = useState<keyof typeof IMPORT_TEMPLATES>("pathologies");
  const [activeFormat, setActiveFormat] = useState<"csv" | "json">("csv");

  const template = IMPORT_TEMPLATES[activeType];

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} copiado!` });
  };

  const downloadTemplate = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Arquivo baixado!" });
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-import-title">Prompts de Importação</h1>
        <p className="text-muted-foreground">
          Use estes modelos para importar dados em massa. Copie o formato e preencha com seus dados.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
        {Object.entries(IMPORT_TEMPLATES).map(([key, tmpl]) => {
          const Icon = tmpl.icon;
          const isActive = activeType === key;
          return (
            <Button
              key={key}
              variant={isActive ? "default" : "outline"}
              className="flex flex-col h-auto py-3 gap-1"
              onClick={() => setActiveType(key as keyof typeof IMPORT_TEMPLATES)}
              data-testid={`button-template-${key}`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs">{tmpl.title}</span>
            </Button>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            {(() => {
              const Icon = template.icon;
              return <Icon className="h-5 w-5" />;
            })()}
            <CardTitle>{template.title}</CardTitle>
          </div>
          <CardDescription>{template.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={activeFormat} onValueChange={(v) => setActiveFormat(v as "csv" | "json")}>
            <TabsList>
              <TabsTrigger value="csv">CSV</TabsTrigger>
              <TabsTrigger value="json">JSON</TabsTrigger>
            </TabsList>

            <TabsContent value="csv" className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Colunas</h4>
                <div className="flex flex-wrap gap-2">
                  {template.csv.columns.map((col) => (
                    <Badge
                      key={col.name}
                      variant={col.required ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {col.name}{col.required && "*"}
                    </Badge>
                  ))}
                </div>
                <div className="mt-3 text-sm space-y-1">
                  {template.csv.columns.map((col) => (
                    <p key={col.name} className="text-muted-foreground">
                      <span className="font-medium text-foreground">{col.name}</span>: {col.description}
                    </p>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">Cabeçalho</h4>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(template.csv.header, "Cabeçalho")}
                    data-testid="button-copy-header"
                  >
                    <Copy className="h-4 w-4 mr-1" /> Copiar
                  </Button>
                </div>
                <pre className="bg-muted p-3 rounded-md text-sm overflow-x-auto">
                  {template.csv.header}
                </pre>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">Exemplo</h4>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(template.csv.header + "\n" + template.csv.example, "Exemplo")}
                      data-testid="button-copy-example-csv"
                    >
                      <Copy className="h-4 w-4 mr-1" /> Copiar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        downloadTemplate(
                          template.csv.header + "\n" + template.csv.example,
                          `${activeType}_exemplo.csv`
                        )
                      }
                      data-testid="button-download-csv"
                    >
                      <Download className="h-4 w-4 mr-1" /> Baixar
                    </Button>
                  </div>
                </div>
                <pre className="bg-muted p-3 rounded-md text-sm overflow-x-auto whitespace-pre-wrap">
                  {template.csv.example}
                </pre>
              </div>
            </TabsContent>

            <TabsContent value="json" className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">Formato JSON</h4>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(template.json.example, "JSON")}
                      data-testid="button-copy-example-json"
                    >
                      <Copy className="h-4 w-4 mr-1" /> Copiar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        downloadTemplate(template.json.example, `${activeType}_exemplo.json`)
                      }
                      data-testid="button-download-json"
                    >
                      <Download className="h-4 w-4 mr-1" /> Baixar
                    </Button>
                  </div>
                </div>
                <pre className="bg-muted p-3 rounded-md text-sm overflow-x-auto whitespace-pre-wrap">
                  {template.json.example}
                </pre>
              </div>
            </TabsContent>
          </Tabs>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-2">Como usar</h4>
            <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1">
              <li>Copie o modelo acima ou baixe o arquivo de exemplo</li>
              <li>Preencha com seus dados mantendo o formato (use ; como separador no CSV)</li>
              <li>No painel Admin, vá até a seção correspondente</li>
              <li>Clique em "Importar em massa" e cole seus dados</li>
              <li>Visualize o preview e confirme a importação</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
