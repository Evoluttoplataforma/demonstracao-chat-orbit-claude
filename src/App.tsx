import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ABRouter from "@/components/ABRouter";

// Lazy-loaded routes for code splitting
const LandingPage = lazy(() => import("./pages/LandingPage"));
const Index = lazy(() => import("./pages/Index"));
const Login = lazy(() => import("./pages/Login"));
const Admin = lazy(() => import("./pages/Admin"));
const Vendedor = lazy(() => import("./pages/Vendedor"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfUse = lazy(() => import("./pages/TermsOfUse"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Reagendar = lazy(() => import("./pages/Reagendar"));
const Feedback = lazy(() => import("./pages/Feedback"));
const Apresentacao = lazy(() => import("./pages/Apresentacao"));
const Diagnostico = lazy(() => import("./pages/Diagnostico"));
const ApresentacaoCanal = lazy(() => import("./pages/ApresentacaoCanal"));
const Salas = lazy(() => import("./pages/Salas"));
const SalasOnboarding = lazy(() => import("./pages/SalasOnboarding"));
const SalasTiraDuvidas = lazy(() => import("./pages/SalasTiraDuvidas"));
const SalasAtivacaoCanal = lazy(() => import("./pages/SalasAtivacaoCanal"));
const CS = lazy(() => import("./pages/CS"));
const Consultoria = lazy(() => import("./pages/Consultoria"));
const Agencia = lazy(() => import("./pages/Agencia"));
const Contador = lazy(() => import("./pages/Contador"));
const Clinicas = lazy(() => import("./pages/Clinicas"));
const Imobiliaria = lazy(() => import("./pages/Imobiliaria"));
const Engenharia = lazy(() => import("./pages/Engenharia"));
const Advocacia = lazy(() => import("./pages/Advocacia"));
const Franquias = lazy(() => import("./pages/Franquias"));
const Ecommerce = lazy(() => import("./pages/Ecommerce"));
const Educacao = lazy(() => import("./pages/Educacao"));
const Chat2 = lazy(() => import("./pages/Chat2"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <main>
            <Routes>
              <Route path="/" element={<ABRouter LandingPage={LandingPage} />} />
              <Route path="/chat" element={<Index />} />
              <Route path="/chat2" element={<Chat2 />} />
              <Route path="/login" element={<Login />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/vendedor" element={<Vendedor />} />
              <Route path="/reagendar" element={<Reagendar />} />
              <Route path="/feedback" element={<Feedback />} />
              <Route path="/apresentacao" element={<Apresentacao />} />
              <Route path="/apresentacao/canal" element={<ApresentacaoCanal />} />
              <Route path="/diagnostico" element={<Diagnostico />} />
              <Route path="/salas" element={<Salas />} />
              <Route path="/cs" element={<CS />} />
              <Route path="/salas/onboarding" element={<SalasOnboarding />} />
              <Route path="/salas/ativacao-canal" element={<SalasAtivacaoCanal />} />
              <Route path="/salas/tira-duvidas" element={<SalasTiraDuvidas />} />
              <Route path="/consultoria" element={<ABRouter LandingPage={Consultoria} />} />
              <Route path="/agencia" element={<ABRouter LandingPage={Agencia} />} />
              <Route path="/contabilidade" element={<ABRouter LandingPage={Contador} />} />
              <Route path="/clinicas" element={<ABRouter LandingPage={Clinicas} />} />
              <Route path="/imobiliaria" element={<ABRouter LandingPage={Imobiliaria} />} />
              <Route path="/engenharia" element={<ABRouter LandingPage={Engenharia} />} />
              <Route path="/advocacia" element={<ABRouter LandingPage={Advocacia} />} />
              <Route path="/franquias" element={<ABRouter LandingPage={Franquias} />} />
              <Route path="/ecommerce" element={<ABRouter LandingPage={Ecommerce} />} />
              <Route path="/educacao" element={<ABRouter LandingPage={Educacao} />} />
              <Route path="/privacidade" element={<PrivacyPolicy />} />
              <Route path="/termos" element={<TermsOfUse />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
