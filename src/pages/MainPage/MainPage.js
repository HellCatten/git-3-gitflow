import React from 'react';
import { Link } from 'react-router-dom';
import './MainPage.css';

function MainPage() {
  return (
    <div className="main-page">
      <h1>GitLab Admin Tools</h1>
      <p className="intro">
        A powerful extension to streamline GitLab administration tasks.
      </p>

      <h2>Features</h2>
      <div className="feature-grid">
        <div className="feature-block">
          <h3>User Creation</h3>
          <p>
            Create single or multiple GitLab users effortlessly with automated
            password generation.
          </p>
        </div>
        <div className="feature-block">
          <h3>Group Assignment</h3>
          <p>
            Optionally assign users to a group during creation with a single
            input.
          </p>
        </div>
        <div className="feature-block">
          <h3>Settings Management</h3>
          <p>
            Store your GitLab URL and Personal Access Token securely in local
            storage.
          </p>
        </div>
      </div>

      <h2>Get Started</h2>
      <p className="guide">
        Configure your <Link to="/settings">Settings</Link>, then head to the{' '}
        <Link to="/tools">Tools</Link> page to start managing users with ease.
      </p>
    </div>
  );
}

export default MainPage;
