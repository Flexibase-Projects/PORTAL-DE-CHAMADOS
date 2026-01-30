import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Home from './pages/Home';
import CreateTicket from './pages/CreateTicket';
import MyTickets from './pages/MyTickets';
import AdminPanel from './pages/AdminPanel';
import KnowledgeBase from './pages/KnowledgeBase';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/criar-chamado" element={<CreateTicket />} />
        <Route path="/meus-chamados" element={<MyTickets />} />
        <Route path="/painel-administrativo" element={<AdminPanel />} />
        <Route path="/base-conhecimento" element={<KnowledgeBase />} />
      </Routes>
    </Layout>
  );
}

export default App;
