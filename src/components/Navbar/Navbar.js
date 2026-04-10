import React from 'react';
import { Link } from 'react-router-dom';
import gitlabLogo from '../../assets/gitlab-logo.png'; // Adjust path if needed
import './Navbar.css';

function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-left">
        <Link to="/">
          <img src={gitlabLogo} alt="GitLab Logo" className="navbar-logo" />
        </Link>
        <Link to="/tools" className="nav-link">
          Tools
        </Link>
      </div>
      <div className="navbar-right">
        <Link to="/settings" className="nav-link">
          Settings
        </Link>
      </div>
    </nav>
  );
}

export default Navbar;
