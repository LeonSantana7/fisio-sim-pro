import { useState } from 'react';
import './index.css';
import Sidebar from './components/Layout/Sidebar';
import TopBar from './components/Layout/TopBar';
import HomePage from './pages/HomePage';
import SimulatorPage from './pages/SimulatorPage';
import ProtocolsPage from './pages/ProtocolsPage';
import ToolsPage from './pages/ToolsPage';
import HistoryPage from './pages/HistoryPage';

export type Page = 'home' | 'simulator' | 'protocols' | 'tools' | 'history';

const pageConfig: Record<Page, { title: string; subtitle: string; tag: string }> = {
  home: { title: 'FisioSim Pro', subtitle: 'Fisioterapia Intensivista', tag: 'v0.1.0' },
  simulator: { title: 'Simulador de Ventilação', subtitle: 'Módulo 1 · Motor Físico', tag: 'VCV / PCV' },
  protocols: { title: 'Protocolos Clínicos UTI', subtitle: 'Módulo 2 · Decisão Clínica', tag: 'SDRA · Desmame' },
  tools: { title: 'Fisio Tools', subtitle: 'Módulo 3 · Calculadoras', tag: '15 Ferramentas' },
  history: { title: 'Histórico de Cálculos', subtitle: 'Nuvem · Sincronizado', tag: 'Supabase' },
};

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const cfg = pageConfig[currentPage];
  const navigate = (p: string) => setCurrentPage(p as Page);

  return (
    <div className="app-layout">
      <Sidebar activePage={currentPage} onNavigate={navigate} />
      <TopBar title={cfg.title} subtitle={cfg.subtitle} tag={cfg.tag} />
      <main className="main-content">
        {currentPage === 'home' && <HomePage onNavigate={navigate} />}
        {currentPage === 'simulator' && <SimulatorPage />}
        {currentPage === 'protocols' && <ProtocolsPage />}
        {currentPage === 'tools' && <ToolsPage />}
        {currentPage === 'history' && <HistoryPage />}
      </main>
    </div>
  );
}
