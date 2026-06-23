import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import AnalyzePage from './pages/AnalyzePage';
import ResultsPage from './pages/ResultsPage';
import HistoryPage from './pages/HistoryPage';
import ReportPage from './pages/ReportPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';

// Pages that have their own built-in top bar — don't show the global Navbar
const PAGES_WITH_OWN_NAV = ['/', '/analyze', '/results'];

function Layout({ children }) {
  const { pathname } = useLocation();
  const showNav = !PAGES_WITH_OWN_NAV.includes(pathname);
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {showNav && <Navbar />}
      <main className="flex-1">{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/analyze" element={<AnalyzePage />} />
              <Route path="/results" element={<ResultsPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/report/:id" element={<ReportPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="*" element={
                <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
                  <h2 className="text-white text-2xl font-bold mb-2">404</h2>
                  <p className="text-gray-400 mb-4">Page not found</p>
                  <a href="/" className="text-blue-400 hover:underline">← Go Home</a>
                </div>
              } />
            </Routes>
          </Layout>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
