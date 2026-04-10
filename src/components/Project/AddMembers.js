import React, { useState, useContext } from 'react';
import { useForm } from '../../hooks/useForm';
import {
  addMembersToGroup,
  addMembersToProject,
} from '../../services/gitlabApi';
import { fetchJsonFromServer } from '../../services/externalApi';
import { AppContext } from '../../utils/AppContext';
import AccessLevelSelect from '../Shared/AccessLevelSelect';
import './Project.css';

function AddMembers() {
  // eslint-disable-next-line no-unused-vars
  const { settingsState } = useContext(AppContext);
  const [isGroup, setIsGroup] = useState(true);
  const { formData, errors, handleChange, setErrors } = useForm({
    id: '',
    usernames: '',
    fetchUrl: '',
    accessLevel: '30', // Default to Developer
  });
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target.result;
        const usernames = text
          .split(/[\n,]+/)
          .map((u) => u.trim())
          .filter((u) => u);
        handleChange({
          target: { name: 'usernames', value: usernames.join(', ') },
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
      const usernames =
        jsonData.usernames || (Array.isArray(jsonData) ? jsonData : []);
      if (!usernames.length) throw new Error('No usernames found in JSON');
      handleChange({
        target: { name: 'usernames', value: usernames.join(', ') },
      });
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
    if (!formData.id)
      newErrors.id = `${isGroup ? 'Group' : 'Project'} ID or path is required`;
    if (!formData.usernames)
      newErrors.usernames = 'At least one username is required';
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
    const usernames = formData.usernames
      .split(',')
      .map((u) => u.trim())
      .filter((u) => u);
    const selectedAccessLevel = formData.accessLevel;
    const newResults = [];

    for (const username of usernames) {
      try {
        if (isGroup) {
          await addMembersToGroup(
            url,
            token,
            formData.id,
            username,
            selectedAccessLevel
          );
          newResults.push(
            `Success: Added "${username}" to group "${formData.id}" with access level ${selectedAccessLevel}`
          );
        } else {
          await addMembersToProject(
            url,
            token,
            formData.id,
            username,
            selectedAccessLevel
          );
          newResults.push(
            `Success: Added "${username}" to project "${formData.id}" with access level ${selectedAccessLevel}`
          );
        }
      } catch (error) {
        newResults.push(
          `Error: Failed to add "${username}" - ${error.message}`
        );
      }
    }

    setResults(newResults);
    setIsLoading(false);
  };

  const resetForm = () => {
    handleChange({ target: { name: 'id', value: '' } });
    handleChange({ target: { name: 'usernames', value: '' } });
    handleChange({ target: { name: 'fetchUrl', value: '' } });
    handleChange({ target: { name: 'accessLevel', value: '30' } });
    setErrors({});
    setResults([]);
  };

  return (
    <div className="section-card">
      <h2>Add Members</h2>
      <p className="help-text">
        Add members to a group or project by specifying their usernames.
      </p>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Type:</label>
          <p className="help-text">
            Choose whether to add members to a group or a project.
          </p>
          <div className="switch-container">
            <span className={isGroup ? 'active-option' : ''}>Group</span>
            <label className="switch">
              <input
                type="checkbox"
                checked={!isGroup}
                onChange={() => setIsGroup(!isGroup)}
                disabled={isLoading}
              />
              <span className="slider"></span>
            </label>
            <span className={!isGroup ? 'active-option' : ''}>Project</span>
          </div>
        </div>
        <div>
          <label>{isGroup ? 'Group ID or Path' : 'Project ID or Path'}:</label>
          <p className="help-text">
            Enter the ID or path of the {isGroup ? 'group' : 'project'} (e.g.,
            "my-group" or "123").
          </p>
          <input
            type="text"
            name="id"
            value={formData.id}
            onChange={handleChange}
            placeholder={isGroup ? 'group-id or path' : 'project-id or path'}
            disabled={isLoading}
          />
          {errors.id && <span className="error">{errors.id}</span>}
        </div>
        <AccessLevelSelect
          value={formData.accessLevel}
          onChange={handleChange}
          disabled={isLoading}
        />
        <div>
          <label>Usernames:</label>
          <p className="help-text">
            Enter usernames separated by commas (e.g., "user1, user2") or
            fetch/upload them.
          </p>
          <textarea
            name="usernames"
            value={formData.usernames}
            onChange={handleChange}
            rows="5"
            placeholder="user1, user2, user3"
            disabled={isLoading}
          />
          {errors.usernames && (
            <span className="error">{errors.usernames}</span>
          )}
        </div>
        <div className="fetch-json-container">
          <label>Fetch Usernames from Server:</label>
          <p className="help-text">
            Enter a URL to fetch a JSON list of usernames.
          </p>
          <input
            type="text"
            name="fetchUrl"
            value={formData.fetchUrl}
            onChange={handleChange}
            placeholder="https://your-server.com/usernames.json"
            disabled={isLoading}
          />
          <button type="button" onClick={handleFetchJson} disabled={isLoading}>
            {isLoading ? 'Fetching...' : 'Fetch Usernames'}
          </button>
          {errors.fetchUrl && <span className="error">{errors.fetchUrl}</span>}
        </div>
        <div>
          <label>Upload Usernames File:</label>
          <p className="help-text">
            Upload a text file with usernames (comma or newline separated).
          </p>
          <input
            type="file"
            accept=".txt"
            onChange={handleFileUpload}
            disabled={isLoading}
          />
        </div>
        {errors.token && <span className="error">{errors.token}</span>}
        {errors.url && <span className="error">{errors.url}</span>}
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Adding...' : 'Add Members'}
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

export default AddMembers;
