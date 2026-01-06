import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50">
      <div className="bg-white p-8 rounded-3xl shadow-xl text-center max-w-md border border-slate-100">
        <div className="bg-orange-100 p-4 rounded-full inline-flex mb-6">
          <FileQuestion className="h-12 w-12 text-orange-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Página não encontrada</h1>
        <p className="text-slate-500 mb-8">
          A página que você está procurando não existe ou foi movida.
        </p>
        <Link href="/">
          <Button className="w-full bg-primary hover:bg-primary/90">
            Voltar ao Início
          </Button>
        </Link>
      </div>
    </div>
  );
}
