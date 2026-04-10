import React, { useContext } from 'react';
import { useForm } from '../../hooks/useForm';
import { AppContext } from '../../utils/AppContext';
import './SettingsForm.css';

function SettingsForm() {
  const { settingsState, setSettingsState } = useContext(AppContext);
  const { formData, errors, handleChange, setErrors } = useForm({
    url: settingsState.url,
    token: settingsState.token,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!formData.token) newErrors.token = 'Token is required';
    if (!formData.url) newErrors.url = 'URL is required';
    else if (!/^https?:\/\/[^\s/$.?#].[^\s]*$/.test(formData.url))
      newErrors.url = 'Invalid URL';
    if (Object.keys(newErrors).length === 0) {
      localStorage.setItem('gitlabToken', formData.token);
      localStorage.setItem('gitlabUrl', formData.url);
      setSettingsState({
        ...settingsState,
        url: formData.url,
        token: formData.token,
        errors: {},
      });
      alert('Settings saved!');
    } else {
      setErrors(newErrors);
    }
  };

  return (
    <div className="section-card">
      {' '}
      {/* Added section-card */}
      <form onSubmit={handleSubmit} className="settings-form">
        <div>
          <label>GitLab URL:</label>
          <p className="help-text">
            Enter your self-hosted GitLab server URL (e.g.,
            "https://gitlab.example.com").
          </p>
          <input
            type="text"
            name="url"
            value={formData.url}
            onChange={handleChange}
            placeholder="https://gitlab.example.com"
          />
          {errors.url && <span className="error">{errors.url}</span>}
        </div>
        <div>
          <label>Personal Access Token:</label>
          <p className="help-text">
            Enter your GitLab Personal Access Token with API access (generate in
            GitLab settings).
          </p>
          <input
            type="text"
            name="token"
            value={formData.token}
            onChange={handleChange}
            placeholder="Your GitLab token"
          />
          {errors.token && <span className="error">{errors.token}</span>}
        </div>
        <button type="submit">Save Settings</button>
      </form>
    </div>
  );
}

export default SettingsForm;
