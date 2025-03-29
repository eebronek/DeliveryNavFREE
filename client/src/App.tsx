import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import PlanRoute from "@/pages/plan-route";
import NavigationPage from "@/pages/navigation";
import SummaryPage from "@/pages/summary";

function Router() {
  return (
    <Switch>
      <Route path="/" component={PlanRoute} />
      <Route path="/navigation" component={NavigationPage} />
      <Route path="/summary" component={SummaryPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
