import { useState } from "react";
import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import { DesktopSidebar, MobileNav } from "@/components/Sidebar";
import { FloatingCalculator } from "@/components/FloatingCalculator";
import { PediatricCalculator, PediatricCalculatorButton } from "@/components/PediatricCalculator";
import { CreatorFooter } from "@/components/CreatorFooter";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { PreviewBanner } from "@/components/PreviewGate";

// Page Imports
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import Prescriptions from "@/pages/Prescriptions";
import Protocols from "@/pages/Protocols";
import Flashcards from "@/pages/Flashcards";
import Checklists from "@/pages/Checklists";
import Shifts from "@/pages/Shifts";
import Notes from "@/pages/Notes";
import Handovers from "@/pages/Handovers";
import Library from "@/pages/Library";
import Finance from "@/pages/Finance";
import AIChat from "@/pages/AIChat";
import AiSettings from "@/pages/AiSettings";
import AiInterconsult from "@/pages/AiInterconsult";
import Profile from "@/pages/Profile";
import PaymentRequired from "@/pages/PaymentRequired";
import Admin from "@/pages/Admin";
import Settings from "@/pages/Settings";
import DrugInteractions from "@/pages/DrugInteractions";
import AiAssistant from "@/pages/AiAssistant";

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const [isPedCalcOpen, setIsPedCalcOpen] = useState(false);
  
  return (
    <div className="flex min-h-screen bg-background">
      <DesktopSidebar />
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen">
        <PreviewBanner />
        <main className="flex-1 pb-20 md:pb-0">
          {children}
        </main>
        <CreatorFooter />
      </div>
      <FloatingCalculator />
      <PediatricCalculatorButton onClick={() => setIsPedCalcOpen(true)} />
      <PediatricCalculator isOpen={isPedCalcOpen} onClose={() => setIsPedCalcOpen(false)} />
      <MobileNav />
    </div>
  );
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"/></div>;
  if (!isAuthenticated) return <Redirect to="/welcome" />;

  // Block only users with 'blocked' status
  if (user?.status === 'blocked') {
    return <PaymentRequired />;
  }

  // Allow preview access for pending users (limited content shown via PreviewGate)
  return (
    <ProtectedLayout>
      <Component />
    </ProtectedLayout>
  );
}

function AdminRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"/></div>;
  if (!isAuthenticated) return <Redirect to="/welcome" />;
  
  if (user?.role !== 'admin') {
    return <Redirect to="/" />;
  }

  return (
    <ProtectedLayout>
      <Component />
    </ProtectedLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/welcome" component={Landing} />
      
      <Route path="/admin">
        <AdminRoute component={Admin} />
      </Route>

      <Route path="/">
        <ProtectedRoute component={Dashboard} />
      </Route>
      
      <Route path="/prescriptions">
        <ProtectedRoute component={Prescriptions} />
      </Route>

      <Route path="/protocols">
        <ProtectedRoute component={Protocols} />
      </Route>

      <Route path="/flashcards">
        <ProtectedRoute component={Flashcards} />
      </Route>

      <Route path="/checklists">
        <ProtectedRoute component={Checklists} />
      </Route>

      <Route path="/shifts">
        <ProtectedRoute component={Shifts} />
      </Route>

      <Route path="/handovers">
        <ProtectedRoute component={Handovers} />
      </Route>

      <Route path="/notes">
        <ProtectedRoute component={Notes} />
      </Route>

      <Route path="/library">
        <ProtectedRoute component={Library} />
      </Route>

      <Route path="/finance">
        <ProtectedRoute component={Finance} />
      </Route>

      <Route path="/ai-chat">
        <ProtectedRoute component={AiInterconsult} />
      </Route>

      <Route path="/ai-settings">
        <ProtectedRoute component={AiSettings} />
      </Route>

      <Route path="/profile">
        <ProtectedRoute component={Profile} />
      </Route>

      <Route path="/settings">
        <ProtectedRoute component={Settings} />
      </Route>

      <Route path="/drug-interactions">
        <ProtectedRoute component={DrugInteractions} />
      </Route>

      <Route path="/ai-assistant">
        <ProtectedRoute component={AiAssistant} />
      </Route>

      {/* Redirect chat alias to ai-chat for now as we merged functionality or placeholder */}
      <Route path="/chat">
        <Redirect to="/ai-chat" />
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
