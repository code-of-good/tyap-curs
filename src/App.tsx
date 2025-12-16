import { Routes, Route, Navigate } from "react-router-dom";
import { LanguageForm } from "./components/LanguageForm";
import { ChainChecker } from "./components/ChainChecker";
import { useLanguageStore } from "./stores/languageStore";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const language = useLanguageStore((state) => state.language);
  return language ? <>{children}</> : <Navigate to="/" replace />;
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
    </Routes>
  );
}

export default App;
