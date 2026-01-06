import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import { DesktopSidebar, MobileNav } from "@/components/Sidebar";
import { FloatingCalculator } from "@/components/FloatingCalculator";

// Page Imports
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import Prescriptions from "@/pages/Prescriptions";
import Checklists from "@/pages/Checklists";
import Shifts from "@/pages/Shifts";
import Notes from "@/pages/Notes";
import Handovers from "@/pages/Handovers";
import Library from "@/pages/Library";
import Finance from "@/pages/Finance";
import AIChat from "@/pages/AIChat";

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50/50">
      <DesktopSidebar />
      <main className="flex-1 md:pl-64 pb-20 md:pb-0">
        {children}
      </main>
      <FloatingCalculator />
      <MobileNav />
    </div>
  );
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"/></div>;
  if (!isAuthenticated) return <Redirect to="/welcome" />;

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
      
      <Route path="/">
        <ProtectedRoute component={Dashboard} />
      </Route>
      
      <Route path="/prescriptions">
        <ProtectedRoute component={Prescriptions} />
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
        <ProtectedRoute component={AIChat} />
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
      <TooltipProvider>
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
