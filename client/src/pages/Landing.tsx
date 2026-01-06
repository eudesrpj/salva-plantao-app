import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Activity, ShieldCheck, Zap } from "lucide-react";
import { Redirect } from "wouter";

export default function Landing() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <div className="flex h-screen items-center justify-center"><Activity className="animate-spin h-8 w-8 text-primary" /></div>;
  if (isAuthenticated) return <Redirect to="/" />;

  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-white/50">
        <div className="bg-primary p-12 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/medical-icons.png')] opacity-10"></div>
          <div className="relative z-10">
            <div className="bg-white/20 p-4 rounded-2xl inline-flex mb-4 backdrop-blur-sm">
              <Activity className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-3xl font-display font-bold text-white mb-2">Salva Plantão</h1>
            <p className="text-blue-100">Sua central médica de confiança</p>
          </div>
        </div>
        
        <div className="p-8 space-y-6">
          <div className="space-y-4">
            <Feature icon={ShieldCheck} title="Acesso Seguro" desc="Seus dados protegidos com criptografia de ponta." />
            <Feature icon={Zap} title="Rápido e Prático" desc="Acesse calculadoras e prescrições em segundos." />
          </div>

          <div className="pt-4">
            <Button 
              onClick={handleLogin}
              className="w-full h-12 text-lg font-semibold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 transition-all"
            >
              Entrar com Replit
            </Button>
            <p className="text-center text-xs text-slate-400 mt-4">
              Ao entrar, você concorda com nossos Termos de Uso.
            </p>
          </div>
        </div>
      </div>
      
      <p className="mt-8 text-slate-400 text-sm font-medium">
        Criado por: Dr. Eudes Rodrigues
      </p>
    </div>
  );
}

function Feature({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <div className="flex items-start gap-4">
      <div className="bg-blue-50 p-2.5 rounded-xl">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <h3 className="font-semibold text-slate-900">{title}</h3>
        <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
