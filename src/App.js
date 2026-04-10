import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar/Navbar'; //Adjust path if needed
import MainPage from './pages/MainPage/MainPage';
import ToolsPage from './pages/ToolsPage/ToolsPage';
import SettingsPage from './pages/SettingsPage/SettingsPage';
import './App.css';

function App() {
  return (
    <div>
      <Navbar />
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/tools/*" element={<ToolsPage />} />{' '}
        {/* Use element, add /* for nested routes */}
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<div>404 - Page Not Found</div>} />
      </Routes>
    </div>
  );
}

export default App;
