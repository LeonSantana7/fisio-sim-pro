import { useState, useEffect, useRef } from 'react';
// @ts-ignore
import { Accessibility } from 'accessibility';
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
  const accessibilityInit = useRef(false);

  useEffect(() => {
    const initAccessibility = () => {
      if (accessibilityInit.current) return;
      accessibilityInit.current = true;

      if (!document.querySelector('.accessibility-menu')) {
        const instance = new Accessibility({
          icon: {
            // @ts-ignore
            position: {
              top: { size: -9999, type: 'px' },
              left: { size: -9999, type: 'px' },
            },
            // @ts-ignore
            circular: false,
          },
          labels: {
            resetTitle: 'Resetar',
            closeTitle: 'Fechar',
            menuTitle: 'Acessibilidade',
            increaseText: 'Aumentar Texto',
            decreaseText: 'Diminuir Texto',
            increaseTextSpacing: 'Aumentar Espaçamento',
            decreaseTextSpacing: 'Diminuir Espaçamento',
            increaseLineHeight: 'Aumentar Altura da Linha',
            decreaseLineHeight: 'Diminuir Altura da Linha',
            invertColors: 'Cores Invertidas',
            grayHues: 'Tons de Cinza',
            underlineLinks: 'Sublinhar Links',
            bigCursor: 'Cursor Grande',
            readingGuide: 'Guia de Leitura',
            textToSpeech: 'Texto para Voz',
            speechToText: 'Voz para Texto',
            disableAnimations: 'Desativar Animações',
            hotkeyPrefix: 'Atalho: '
          }
        });
        // @ts-ignore
        window.accessibilityInstance = instance;
      }
    };

    if (document.readyState === 'complete') {
      initAccessibility();
    } else {
      window.addEventListener('load', initAccessibility, false);
    }
  }, []);

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
