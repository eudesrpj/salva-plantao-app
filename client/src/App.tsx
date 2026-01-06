import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";

// Page Imports
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import Shifts from "@/pages/Shifts";
import Prescriptions from "@/pages/Prescriptions";
import AIChat from "@/pages/AIChat";

// Placeholder Pages for completeness
function PlaceholderPage({ title }: { title: string }) {
  const { Sidebar, MobileNav } = require("@/components/Sidebar");
  const { FloatingCalculator } = require("@/components/FloatingCalculator");
  return (
    <div className="flex min-h-screen bg-slate-50/50">
      <Sidebar />
      <main className="flex-1 pb-20 md:pb-0 md:pl-64 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-300 mb-2">{title}</h1>
          <p className="text-slate-400">Em desenvolvimento</p>
        </div>
      </main>
      <FloatingCalculator />
      <MobileNav />
    </div>
  );
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  if (!isAuthenticated) return <Redirect to="/welcome" />;
  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/welcome" component={Landing} />
      
      <Route path="/">
        <ProtectedRoute component={Dashboard} />
      </Route>
      
      <Route path="/shifts">
        <ProtectedRoute component={Shifts} />
      </Route>

      <Route path="/prescriptions">
        <ProtectedRoute component={Prescriptions} />
      </Route>

      <Route path="/ai-chat">
        <ProtectedRoute component={AIChat} />
      </Route>

      {/* Placeholders for MVP scope limits */}
      <Route path="/checklists">
        <ProtectedRoute component={() => <PlaceholderPage title="Checklists" />} />
      </Route>
      <Route path="/finance">
        <ProtectedRoute component={() => <PlaceholderPage title="Financeiro" />} />
      </Route>
      <Route path="/library">
        <ProtectedRoute component={() => <PlaceholderPage title="Biblioteca" />} />
      </Route>
      <Route path="/notes">
        <ProtectedRoute component={() => <PlaceholderPage title="Anotações" />} />
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
