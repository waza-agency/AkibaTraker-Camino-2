import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import AuthPage from "@/pages/auth-page";
import ProfilePage from "@/pages/profile";
import { useUser } from "@/hooks/use-user";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { MoodProvider } from "@/hooks/use-mood";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { translations } from "@/lib/translations";

// ScrollToTop component to handle scrolling to top on route changes
function ScrollToTop() {
  const [location] = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);
  
  return null;
}

function Router() {
  const { user, isLoading, error } = useUser();

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4">
        <div className="text-destructive">{translations.general.failedToLoad}</div>
        <Button 
          onClick={() => window.location.reload()}
          variant="outline"
        >
          {translations.general.retry}
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <>
      <ScrollToTop />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/profile" component={ProfilePage} />
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MoodProvider>
        <Router />
        <Toaster />
      </MoodProvider>
    </QueryClientProvider>
  );
}

export default App;