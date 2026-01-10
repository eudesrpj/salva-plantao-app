/*
© Salva Plantão
Uso não autorizado é proibido.
Contato oficial: suporte@appsalvaplantao.com
*/

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Info, FileText, Shield, Copyright, Landmark, Mail } from "lucide-react";

export default function About() {
  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2">Sobre o Salva Plantão</h1>
        <p className="text-muted-foreground">Informações institucionais, termos e políticas</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" />
            Sobre o App
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground leading-relaxed">
            Salva Plantão é uma plataforma desenvolvida para apoiar médicos na tomada de decisões durante o plantão, 
            oferecendo organização, agilidade e segurança no dia a dia clínico.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Termo de Compromisso
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground leading-relaxed">
            O Salva Plantão é uma ferramenta de apoio à prática médica. As informações disponibilizadas não substituem 
            o julgamento clínico do profissional, que permanece integralmente responsável pelas decisões tomadas.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Política de Privacidade
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground leading-relaxed">
            A sua privacidade é importante para nós. Esta política descreve como tratamos seus dados:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li><strong>Coleta mínima de dados:</strong> Coletamos apenas as informações necessárias para o funcionamento do serviço.</li>
            <li><strong>Uso restrito:</strong> Seus dados são utilizados exclusivamente para operar e melhorar o serviço.</li>
            <li><strong>Não compartilhamento:</strong> Não compartilhamos seus dados com terceiros, exceto quando exigido por lei.</li>
            <li><strong>Cookies e sessão:</strong> Utilizamos cookies e sessões para manter você autenticado e melhorar sua experiência.</li>
            <li><strong>Conformidade com LGPD:</strong> Operamos em conformidade com a Lei Geral de Proteção de Dados (LGPD).</li>
          </ul>
          <p className="text-muted-foreground">
            Para dúvidas ou solicitações sobre seus dados, entre em contato: <a href="mailto:suporte@appsalvaplantao.com" className="text-primary hover:underline">suporte@appsalvaplantao.com</a>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Copyright className="h-5 w-5 text-primary" />
            Direitos Autorais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground leading-relaxed">
            Todo o conteúdo, design, fluxos, funcionalidades e identidade visual do Salva Plantão são protegidos por direitos autorais.
            É proibida a reprodução, distribuição ou criação de produtos derivados sem autorização expressa.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Landmark className="h-5 w-5 text-primary" />
            Marca e Propriedade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground leading-relaxed">
            Salva Plantão é uma marca protegida. Qualquer uso indevido, cópia ou tentativa de plágio poderá resultar em medidas legais.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Contato Oficial
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground leading-relaxed">
            Para suporte, dúvidas ou solicitações institucionais, entre em contato pelo email:
          </p>
          <a 
            href="mailto:suporte@appsalvaplantao.com" 
            className="inline-block mt-2 text-primary font-medium hover:underline"
            data-testid="link-support-email"
          >
            suporte@appsalvaplantao.com
          </a>
        </CardContent>
      </Card>

      <Separator className="my-8" />

      <div className="text-center text-sm text-muted-foreground space-y-1 pb-8">
        <p className="font-medium">© Salva Plantão</p>
        <p>Acesso institucional</p>
        <p>Criado por <span className="font-medium">ERPJ</span></p>
      </div>
    </div>
  );
}
