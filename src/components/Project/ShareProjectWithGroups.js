import React, { useState, useContext } from 'react';
import { useForm } from '../../hooks/useForm';
import { shareProjectWithGroup } from '../../services/gitlabApi';
import { fetchJsonFromServer } from '../../services/externalApi';
import { AppContext } from '../../utils/AppContext';
import AccessLevelSelect from '../Shared/AccessLevelSelect';
import './Project.css';

function ShareProjectWithGroups() {
  const { settingsState } = useContext(AppContext);
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { formData, errors, handleChange, setErrors } = useForm({
    projectId: '',
    jsonInput: '',
    fetchUrl: '',
    accessLevel: '30', // Default to Developer
    expiresAt: '',
  });

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        handleChange({
          target: { name: 'jsonInput', value: event.target.result },
        });
      };
      reader.readAsText(file);
    }
  };

  const handleFetchJson = async () => {
    if (!formData.fetchUrl) {
      setErrors({ ...errors, fetchUrl: 'Server URL is required' });
      return;
    }
    setIsLoading(true);
    try {
      const jsonData = await fetchJsonFromServer(formData.fetchUrl);
      const jsonString = JSON.stringify(jsonData, null, 2);
      handleChange({ target: { name: 'jsonInput', value: jsonString } });
      setErrors({ ...errors, fetchUrl: '' });
    } catch (error) {
      setErrors({ ...errors, fetchUrl: error.message });
    }
    setIsLoading(false);
  };

  const validateForm = () => {
    const newErrors = {};
    const token = localStorage.getItem('gitlabToken');
    const url = localStorage.getItem('gitlabUrl');
    if (!token)
      newErrors.token = 'Personal Access Token is required (set in Settings)';
    if (!url) newErrors.url = 'GitLab URL is required (set in Settings)';
    if (!formData.projectId)
      newErrors.projectId = 'Project ID or path is required';
    if (!formData.jsonInput) newErrors.jsonInput = 'JSON input is required';
    else {
      try {
        const parsed = JSON.parse(formData.jsonInput);
        if (
          !parsed['groups-id'] ||
          !Array.isArray(parsed['groups-id']) ||
          !parsed['groups-id'].every((id) => Number.isInteger(id) && id > 0)
        ) {
          newErrors.jsonInput =
            'JSON must have a "groups-id" array with positive numeric IDs';
        }
      } catch {
        newErrors.jsonInput = 'Invalid JSON format';
      }
    }
    if (formData.expiresAt && !/^\d{4}-\d{2}-\d{2}$/.test(formData.expiresAt)) {
      newErrors.expiresAt =
        'Expiration date must be in YYYY-MM-DD format (e.g., 2016-09-26)';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      setResults(['Please fix the errors in the form.']);
      return;
    }

    setIsLoading(true);
    setResults([]);
    const token = localStorage.getItem('gitlabToken');
    const url = localStorage.getItem('gitlabUrl');
    const { 'groups-id': groupIds } = JSON.parse(formData.jsonInput);
    const selectedAccessLevel = formData.accessLevel;
    const newResults = [];

    for (const groupId of groupIds) {
      const payload = {
        group_id: groupId,
        group_access: parseInt(selectedAccessLevel),
        ...(formData.expiresAt && { expires_at: formData.expiresAt }),
      };

      try {
        await shareProjectWithGroup(url, token, formData.projectId, payload);
        newResults.push(
          `Success: Project "${formData.projectId}" shared with group ID "${groupId}" at access level ${selectedAccessLevel}${formData.expiresAt ? ` until ${formData.expiresAt}` : ''}.`
        );
      } catch (error) {
        newResults.push(
          `Error: Failed to share project with group ID "${groupId}" - ${error.message}`
        );
      }
    }

    setResults(newResults);
    setIsLoading(false);
  };

  const resetForm = () => {
    handleChange({ target: { name: 'projectId', value: '' } });
    handleChange({ target: { name: 'jsonInput', value: '' } });
    handleChange({ target: { name: 'fetchUrl', value: '' } });
    handleChange({ target: { name: 'accessLevel', value: '30' } });
    handleChange({ target: { name: 'expiresAt', value: '' } });
    setErrors({});
    setResults([]);
  };

  return (
    <div className="section-card">
      <h2>Share Project with Groups</h2>
      <p className="help-text">
        Share a project with multiple groups by providing a JSON list of numeric
        group IDs.
      </p>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Project ID or Path:</label>
          <p className="help-text">
            Enter the ID or path of the project (e.g., "my-project" or "123").
          </p>
          <input
            type="text"
            name="projectId"
            value={formData.projectId}
            onChange={handleChange}
            placeholder="project-id or path"
            disabled={isLoading}
          />
          {errors.projectId && (
            <span className="error">{errors.projectId}</span>
          )}
        </div>
        <div>
          <label>Groups JSON:</label>
          <p className="help-text">
            Paste or fetch a JSON object with a 'groups-id' array of numeric IDs
            (see placeholder).
          </p>
          <textarea
            name="jsonInput"
            value={formData.jsonInput}
            onChange={handleChange}
            rows="5"
            placeholder={`{
  "groups-id": [
    123,
    321
  ]
}`}
            disabled={isLoading}
          />
          {errors.jsonInput && (
            <span className="error">{errors.jsonInput}</span>
          )}
        </div>
        <AccessLevelSelect
          value={formData.accessLevel}
          onChange={handleChange}
          disabled={isLoading}
        />
        <div>
          <label>Expires At (Optional):</label>
          <p className="help-text">
            Enter an expiration date in YYYY-MM-DD format (e.g., "2016-09-26").
            Leave blank for no expiration.
          </p>
          <input
            type="date"
            name="expiresAt"
            value={formData.expiresAt}
            onChange={handleChange}
            disabled={isLoading}
          />
          {errors.expiresAt && (
            <span className="error">{errors.expiresAt}</span>
          )}
        </div>
        <div className="fetch-json-container">
          <label>Fetch JSON from Server:</label>
          <p className="help-text">
            Enter a URL to fetch a JSON list of group IDs (e.g.,
            "https://your-server.com/groups.json").
          </p>
          <input
            type="text"
            name="fetchUrl"
            value={formData.fetchUrl}
            onChange={handleChange}
            placeholder="https://your-server.com/groups.json"
            disabled={isLoading}
          />
          <button type="button" onClick={handleFetchJson} disabled={isLoading}>
            {isLoading ? 'Fetching...' : 'Fetch JSON'}
          </button>
          {errors.fetchUrl && <span className="error">{errors.fetchUrl}</span>}
        </div>
        <div>
          <label>Upload JSON File:</label>
          <p className="help-text">
            Upload a .json file containing a 'groups-id' array of numeric IDs.
          </p>
          <input
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            disabled={isLoading}
          />
        </div>
        {errors.token && <span className="error">{errors.token}</span>}
        {errors.url && <span className="error">{errors.url}</span>}
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Sharing...' : 'Share Project'}
        </button>
        <button type="button" onClick={resetForm} disabled={isLoading}>
          Reset Form
        </button>
      </form>
      {results.length > 0 && (
        <div className="results">
          <h3>Results</h3>
          {results.map((result, index) => (
            <p
              key={index}
              className={result.includes('Success') ? 'success' : 'error-text'}
            >
              {result}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

export default ShareProjectWithGroups;
