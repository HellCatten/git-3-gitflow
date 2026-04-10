import React, { useEffect, useState, useRef } from 'react';
import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import UserManagement from '../../components/User/UserManagement';
import ProjectManagement from '../../components/Project/ProjectManagement';
import './ToolsPage.css';

function ToolsPage() {
  const [tocItems, setTocItems] = useState([]);
  const location = useLocation();
  const contentRef = useRef(null); // Ref to the content area to query headers

  useEffect(() => {
    const updateToc = () => {
      if (contentRef.current) {
        const headers = contentRef.current.querySelectorAll('.section-card h2');
        const items = Array.from(headers).map((header) => ({
          id:
            header.id || header.textContent.replace(/\s+/g, '-').toLowerCase(),
          text: header.textContent,
        }));
        setTocItems(items);

        headers.forEach((header) => {
          if (!header.id)
            header.id = header.textContent.replace(/\s+/g, '-').toLowerCase();
        });
      }
    };

    // Debounce the update to ensure DOM is ready
    const timer = setTimeout(updateToc, 0);
    return () => clearTimeout(timer); // Cleanup timer
  }, [location]); // Re-run when location changes

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="tools-page">
      <div className="tools-layout">
        <aside className="tools-submenu">
          <nav>
            <NavLink
              to="/tools/user"
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              User
            </NavLink>
            <NavLink
              to="/tools/project"
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              Project
            </NavLink>
          </nav>
        </aside>
        <main className="tools-content" ref={contentRef}>
          <h1>Tools</h1>
          <Routes>
            <Route path="/" element={<UserManagement />} />
            <Route path="user" element={<UserManagement />} />
            <Route path="project" element={<ProjectManagement />} />
          </Routes>
        </main>
        <aside className="tools-toc">
          <h3>On this page</h3>
          <ul>
            {tocItems.map((item) => (
              <li key={item.id}>
                <button onClick={() => scrollToSection(item.id)}>
                  {item.text}
                </button>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}

export default ToolsPage;
