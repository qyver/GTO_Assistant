import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { GTOSpot } from './pages/GTOSpot';
import { AnalyzeHand } from './pages/AnalyzeHand';
import { Training } from './pages/Training';
import { Stats } from './pages/Stats';
import { Equity } from './pages/Equity';
import { Leaderboard } from './pages/Leaderboard';
import { initTelegram } from './lib/telegram';
import { api } from './lib/api';
import { useAppStore } from './store';

function App() {
  useEffect(() => {
    // Initialize Telegram WebApp
    initTelegram();

    // Fetch config
    api.getConfig().then((result) => {
      if (result.success && result.data) {
        useAppStore.getState().setUpgradeUrl(result.data.upgradeUrl);
      }
    });
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="gto" element={<GTOSpot />} />
          <Route path="analyze" element={<AnalyzeHand />} />
          <Route path="training" element={<Training />} />
          <Route path="stats" element={<Stats />} />
          <Route path="equity" element={<Equity />} />
          <Route path="leaderboard" element={<Leaderboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
