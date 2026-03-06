i0mport React, { useEffect } from "react";
i0mport { motion, AnimatePresence } from "motion/react";
i0mport {
  LayoutDashboard,
  Sliders,
  LineChart,
  Bell,
  Info,
  Sprout,
  Menu,
  X,
  Moon,
  Sun,
  Languages,
  Users,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  useLocation,
} from "react-router-dom";
import Dashboard from "./components/Dashboard";
import ControlPanel from "./components/ControlPanel";
import Charts from "./components/Charts";
import Alerts from "./components/Alerts";
import CropManagement from "./components/CropManagement";
import Team from "./components/Team";
import About from "./components/About";
import { useAppStore } from "./store";
import { translations } from "./locales/translations";

function AppContent() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const { language, theme, toggleTheme, setLanguage } = useAppStore();
  const t = translations[language];
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  const navItems = [
    {
      path: "/",
      label: t.dashboard,
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      path: "/control",
      label: t.control_panel,
      icon: <Sliders className="w-5 h-5" />,
    },
    {
      path: "/charts",
      label: t.charts,
      icon: <LineChart className="w-5 h-5" />,
    },
    { path: "/crops", label: t.crops, icon: <Sprout className="w-5 h-5" /> },
    { path: "/alerts", label: t.alerts, icon: <Bell className="w-5 h-5" /> },
    { path: "/team", label: t.team, icon: <Users className="w-5 h-5" /> },
    {
      path: "/about",
      label: t.about_system,
      icon: <Info className="w-5 h-5" />,
    },
  ];

  const toggleLanguage = () => {
    setLanguage(language === "ar" ? "en" : "ar");
  };

  const isRTL = language === "ar";

  const handleNavClick = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <div
      className="h-screen flex flex-col font-sans relative overflow-hidden"
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Animated Background */}
      <div className="bg-blobs">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden glass-panel border-b border-slate-200 dark:border-white/20 p-4 flex items-center justify-between sticky top-0 z-40">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-full bg-slate-100 dark:bg-black/20 text-slate-800 dark:text-white"
        >
          {mobileMenuOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>
        <div
          className={`flex items-center space-x-2 ${isRTL ? "space-x-reverse" : ""} text-emerald-600 dark:text-emerald-400`}
        >
          <Sprout className="w-6 h-6" />
          <span className="font-bold text-lg">{t.app_title}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleLanguage}
            className="p-2 rounded-full bg-slate-100 dark:bg-black/20 text-slate-800 dark:text-white font-bold text-xs w-9 h-9 flex items-center justify-center"
          >
            {language === "ar" ? "EN" : "ع"}
          </button>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full bg-slate-100 dark:bg-black/20 text-slate-800 dark:text-white"
          >
            {theme === "dark" ? (
              <Sun className="w-5 h-5 text-yellow-400" />
            ) : (
              <Moon className="w-5 h-5 text-slate-700" />
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile Overlay */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 bg-slate-900/20 dark:bg-black/40 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`
          fixed inset-y-0 ${isRTL ? "right-0" : "left-0"} z-50 w-72 glass-panel !rounded-none !border-y-0 !border-l-0 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static flex flex-col
          ${mobileMenuOpen ? "translate-x-0" : isRTL ? "translate-x-full" : "-translate-x-full"}
        `}
        >
          <div
            className={`p-8 hidden lg:flex items-center space-x-3 ${isRTL ? "space-x-reverse" : ""} text-emerald-600 dark:text-emerald-400`}
          >
            <div className="p-3 bg-emerald-500/20 rounded-2xl backdrop-blur-md shadow-inner border border-emerald-500/30">
              <Sprout className="w-8 h-8" />
            </div>
            <span className="font-bold text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-300">
              {t.app_title}
            </span>
          </div>

          <div className="px-6 pb-4 flex gap-2">
            <button
              onClick={toggleTheme}
              className="flex-1 flex justify-center p-2 rounded-xl bg-white/10 dark:bg-black/20 hover:bg-white/20 transition-colors border border-white/10"
            >
              {theme === "dark" ? (
                <Sun className="w-5 h-5 text-yellow-400" />
              ) : (
                <Moon className="w-5 h-5 text-slate-700" />
              )}
            </button>
            <button
              onClick={toggleLanguage}
              className="flex-1 flex justify-center items-center gap-2 p-2 rounded-xl bg-white/10 dark:bg-black/20 hover:bg-white/20 transition-colors border border-white/10 font-bold"
            >
              <Languages className="w-5 h-5" />
              {language === "ar" ? "EN" : "عربي"}
            </button>
          </div>

          <nav className="mt-2 px-4 space-y-2 overflow-y-auto no-scrollbar flex-1 mb-4">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => handleNavClick(item.path)}
                className={`w-full flex items-center space-x-3 ${isRTL ? "space-x-reverse" : ""} px-5 py-4 rounded-2xl transition-all duration-300 ${
                  location.pathname === item.path
                    ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 font-bold shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-800 dark:hover:text-white"
                }`}
              >
                {item.icon}
                <span className="text-lg">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="p-4 mt-auto border-t border-slate-200 dark:border-white/10 text-center">
            <a 
              href="https://diyaa-sami.neocities.org/Diyaa-Sami" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors font-mono"
              dir="ltr"
            >
              Developed by <span className="font-bold">ENG Diyaa Sami</span>
            </a>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto no-scrollbar p-4 lg:p-10 w-full relative flex flex-col">
          {location.pathname !== "/" && (
            <div className="mb-6 flex">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 px-4 py-2 glass-panel rounded-full hover:bg-white/20 transition-colors font-bold text-slate-700 dark:text-slate-300"
              >
                {isRTL ? (
                  <ArrowRight className="w-5 h-5" />
                ) : (
                  <ArrowLeft className="w-5 h-5" />
                )}
                {t.back}
              </button>
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.98 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="max-w-7xl mx-auto w-full flex-1"
            >
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/control" element={<ControlPanel />} />
                <Route path="/charts" element={<Charts />} />
                <Route path="/crops" element={<CropManagement />} />
                <Route path="/alerts" element={<Alerts />} />
                <Route path="/team" element={<Team />} />
                <Route path="/about" element={<About />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
