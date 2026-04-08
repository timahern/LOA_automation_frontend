import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import LOAGeneratorPage from './pages/loaGeneratorPage';
import B1FinderPage from './pages/B1FinderPage';
import BillingMatrixGeneratorPage from './pages/BillingMatrixGeneratorPage';
import './App.css';

function App() {
  return (
    <Router>
      <nav className="navbar">
        <img
          src="/APMToolboxLogo.png"
          alt="APM Toolbox"
          className="navbar-logo"
        />
        <div className="navbar-divider" />
        <ul className="navbar-links">
          <li><NavLink to="/" end>Subcontract Generator</NavLink></li>
          <li><NavLink to="/b1-finder">B.1 Finder</NavLink></li>
          <li><NavLink to="/billing-matrix">Billing Matrix</NavLink></li>
        </ul>
      </nav>

      <div className="page-content">
        <Routes>
          <Route path="/" element={<LOAGeneratorPage />} />
          <Route path="/b1-finder" element={<B1FinderPage />} />
          <Route path="/billing-matrix" element={<BillingMatrixGeneratorPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
