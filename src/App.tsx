import { Routes, Route, Navigate } from "react-router-dom";
import { LanguageForm } from "./components/LanguageForm";
import { ChainChecker } from "./components/ChainChecker";
import { ResultsPage } from "./components/ResultsPage";
import { useLanguageStore } from "./stores/languageStore";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const language = useLanguageStore((state) => state.language);
  return language ? <>{children}</> : <Navigate to="/" replace />;
}

function ProtectedResultsRoute({ children }: { children: React.ReactNode }) {
  const language = useLanguageStore((state) => state.language);
  const chain = useLanguageStore((state) => state.chain);
  return language && chain ? <>{children}</> : <Navigate to="/check" replace />;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<LanguageForm />} />
      <Route
        path="/check"
        element={
          <ProtectedRoute>
            <ChainChecker />
          </ProtectedRoute>
        }
      />
      <Route
        path="/results"
        element={
          <ProtectedResultsRoute>
            <ResultsPage />
          </ProtectedResultsRoute>
        }
      />
    </Routes>
  );
}

export default App;
