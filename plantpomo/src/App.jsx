import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AuthCallback from "./pages/AuthCallback";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <Routes>
        {/* Both / and /garden render Index — the garden is an overlay INSIDE Index.
            This prevents Index from ever unmounting, preserving the YouTube iframe,
            FocusCard timer state, and all session settings. */}
        <Route path="/" element={<Index />} />
        <Route path="/garden" element={<Index />} />
        {/* Supabase OAuth redirect lands here */}
        <Route path="/auth/callback" element={<AuthCallback />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
