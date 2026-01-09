import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Button } from "@/components/ui/button";
import { Activity, ShieldCheck, Zap, RefreshCw } from "lucide-react";

export default function Landing() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (user) {
    return <Redirect to="/" />;
  }

  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  const handleSwitchAccount = () => {
    window.location.href = "/api/logout?redirect=/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 font-sans">
      <header className="container mx-auto px-6 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Activity className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold font-display text-slate-900">Salva Plantão</span>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            onClick={handleSwitchAccount} 
            className="rounded-full px-4 gap-2"
            data-testid="button-switch-account"
          >
            <RefreshCw className="h-4 w-4" />
            Mudar de Conta
          </Button>
          <Button onClick={handleLogin} className="rounded-full px-8 shadow-lg hover:shadow-xl transition-all">
            Entrar
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-6 pt-16 pb-24 text-center">
        <h1 className="text-5xl md:text-7xl font-bold font-display text-slate-900 tracking-tight mb-8">
          Sua segurança no <span className="text-primary bg-blue-100 px-2 rounded-lg">plantão</span>
        </h1>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-12 leading-relaxed">
          Ferramentas essenciais para médicos plantonistas: prescrições, condutas, 
          calculadoras e interconsulta com IA em um só lugar.
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-20">
          <Button 
            size="lg" 
            onClick={handleLogin} 
            className="h-14 px-8 text-lg rounded-full shadow-primary/25 shadow-xl hover:-translate-y-1 transition-all"
            data-testid="button-subscribe"
          >
            Assinar
          </Button>
          <Button 
            size="lg" 
            variant="outline"
            onClick={handleLogin} 
            className="h-14 px-8 text-lg rounded-full hover:-translate-y-1 transition-all"
            data-testid="button-login-landing"
          >
            Entrar
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-8 text-left max-w-5xl mx-auto">
          <FeatureCard 
            icon={ShieldCheck}
            title="Protocolos Confiáveis"
            desc="Acesse rapidamente condutas e prescrições padronizadas para emergências."
          />
          <FeatureCard 
            icon={Zap}
            title="Agilidade no Atendimento"
            desc="Calculadoras e ferramentas rápidas para tomadas de decisão críticas."
          />
          <FeatureCard 
            icon={Activity}
            title="IA Especializada"
            desc="Discuta casos clínicos e tire dúvidas em tempo real com nossa IA médica."
          />
        </div>
      </main>

      <footer className="border-t border-slate-200 py-8 text-center text-slate-500">
        <p>© 2024 Salva Plantão • Criado por Dr. Eudes Rodrigues</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <div className="bg-white p-8 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 hover:border-primary/20 transition-all">
      <div className="h-12 w-12 bg-blue-50 rounded-xl flex items-center justify-center mb-6">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <h3 className="text-xl font-bold mb-3 text-slate-900">{title}</h3>
      <p className="text-slate-600 leading-relaxed">{desc}</p>
    </div>
  );
}
