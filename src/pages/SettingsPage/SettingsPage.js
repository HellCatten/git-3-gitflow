import React from 'react';
import SettingsForm from '../../components/SettingsForm/SettingsForm';
import './SettingsPage.css';

function SettingsPage() {
  return (
    <div className="settings-page">
      <h1>Settings</h1>
      <SettingsForm />
    </div>
  );
}

export default SettingsPage;