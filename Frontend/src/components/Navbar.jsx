import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

// Inline SVG shield logo with "S" — no external file dependency
function ShieldLogo({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="shieldGrad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1d4ed8" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      {/* Shield shape */}
      <path
        d="M50 6 L88 22 L88 54 C88 72 70 88 50 95 C30 88 12 72 12 54 L12 22 Z"
        fill="url(#shieldGrad)"
        opacity="0.15"
        stroke="url(#shieldGrad)"
        strokeWidth="2.5"
      />
      {/* S letterform */}
      <text
        x="50" y="66"
        textAnchor="middle"
        fontSize="44"
        fontWeight="800"
        fontFamily="'Arial', sans-serif"
        fill="url(#shieldGrad)"
        filter="url(#glow)"
        letterSpacing="-2"
      >
        S
      </text>
    </svg>
  );
}

export default function Navbar() {
  const { isLoggedIn, user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navBg = dark
    ? 'bg-[#030712]/95 border-gray-800'
    : 'bg-white/95 border-gray-200';
  const textColor = dark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900';
  const logoText = dark ? 'text-white' : 'text-gray-900';

  return (
    <nav className={`${navBg} border-b backdrop-blur-md px-6 py-3 flex items-center justify-between sticky top-0 z-50 transition-colors duration-300`}>
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2.5">
        <ShieldLogo size={28} />
        <span className={`font-bold text-lg tracking-tight ${logoText}`}>
          <span className="text-blue-500">Satya</span>Scan
        </span>
      </Link>

      {/* Nav links + actions */}
      <div className="flex items-center gap-4 text-sm">
        <Link to="/analyze" className={`${textColor} transition font-medium`}>Analyze</Link>
        {isLoggedIn && (
          <Link to="/history" className={`${textColor} transition font-medium`}>History</Link>
        )}

        {/* Theme toggle */}
        <button
          onClick={toggle}
          title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          className={`w-8 h-8 rounded-full flex items-center justify-center border transition-colors text-sm
            ${dark ? 'border-gray-700 text-gray-400 hover:border-gray-500' : 'border-gray-300 text-gray-500 hover:border-gray-500'}`}
        >
          {dark ? '☀️' : '🌙'}
        </button>

        {/* Auth — no user avatar icon */}
        {isLoggedIn ? (
          <>
            <span className={`${dark ? 'text-gray-400' : 'text-gray-600'} text-sm`}>
              {user?.name}
            </span>
            <button
              onClick={handleLogout}
              className="text-sm border border-red-700 text-red-400 hover:bg-red-700 hover:text-white px-3 py-1 rounded-lg transition"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className={`${textColor} transition font-medium`}>Login</Link>
            <Link
              to="/signup"
              className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-1.5 rounded-lg transition"
            >
              Sign Up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
