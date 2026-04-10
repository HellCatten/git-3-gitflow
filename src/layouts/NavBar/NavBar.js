import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gitlabLogo from '../../assets/images/gitlab-logo.png'; // Adjust path
import { useAppContext } from '../../utils/AppContext';
import './Navbar.css';

function Navbar() {
  const { searchQuery, setSearchQuery, searchResults, setSearchResults } =
    useAppContext();
  const searchRef = useRef(null);

  // Sample content items (to be replaced with dynamic data from ToolsPage)
  const contentItems = [
    { id: 'single-user', text: 'Single User', path: '/tools/user#single-user' },
    { id: 'bulk-user', text: 'Bulk User', path: '/tools/user#bulk-user' },
    {
      id: 'bulk-user-groups',
      text: 'Bulk User With Groups',
      path: '/tools/user#bulk-user-groups',
    },
    {
      id: 'add-members',
      text: 'Add Members',
      path: '/tools/project#add-members',
    },
    {
      id: 'share-project',
      text: 'Share Project',
      path: '/tools/project#share-project',
    },
    {
      id: 'share-project-groups',
      text: 'Share Project With Groups',
      path: '/tools/project#share-project-groups',
    },
  ];

  useEffect(() => {
    if (searchQuery) {
      const filteredResults = contentItems.filter((item) =>
        item.text.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSearchResults(filteredResults);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, setSearchResults]);

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <Link to="/">
          <img src={gitlabLogo} alt="GitLab Logo" className="navbar-logo" />
        </Link>
        <div className="search-bar" ref={searchRef}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search modules..."
            onBlur={() => setTimeout(() => setSearchResults([]), 200)} // Hide results when focus leaves
            onFocus={() =>
              searchQuery &&
              setSearchResults(
                contentItems.filter((item) =>
                  item.text.toLowerCase().includes(searchQuery.toLowerCase())
                )
              )
            }
          />
          {searchResults.length > 0 && (
            <ul className="search-results">
              {searchResults.map((result) => (
                <li key={result.id}>
                  <Link to={result.path} onClick={() => setSearchQuery('')}>
                    {result.text}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
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
