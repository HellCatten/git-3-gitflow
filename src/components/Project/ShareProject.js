import React, { useState, useContext } from 'react';
import { useForm } from '../../hooks/useForm';
import { shareProjectWithGroup } from '../../services/gitlabApi';
import { AppContext } from '../../utils/AppContext';
import AccessLevelSelect from '../Shared/AccessLevelSelect';
import './Project.css';

function ShareProject() {
  const { settingsState } = useContext(AppContext);
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { formData, errors, handleChange, setErrors } = useForm({
    projectId: '',
    groupId: '',
    accessLevel: '30', // Default to Developer
    expiresAt: '',
  });

  const validateForm = () => {
    const newErrors = {};
    const token = localStorage.getItem('gitlabToken');
    const url = localStorage.getItem('gitlabUrl');
    if (!token)
      newErrors.token = 'Personal Access Token is required (set in Settings)';
    if (!url) newErrors.url = 'GitLab URL is required (set in Settings)';
    if (!formData.projectId)
      newErrors.projectId = 'Project ID or path is required';
    if (!formData.groupId) newErrors.groupId = 'Group ID is required';
    else if (!/^\d+$/.test(formData.groupId))
      newErrors.groupId = 'Group ID must be a numeric value';
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
    const payload = {
      group_id: parseInt(formData.groupId), // Ensure numeric ID
      group_access: parseInt(formData.accessLevel),
      ...(formData.expiresAt && { expires_at: formData.expiresAt }),
    };

    try {
      await shareProjectWithGroup(url, token, formData.projectId, payload);
      setResults([
        `Success: Project "${formData.projectId}" shared with group ID "${formData.groupId}" at access level ${formData.accessLevel}${formData.expiresAt ? ` until ${formData.expiresAt}` : ''}.`,
      ]);
    } catch (error) {
      setResults([`Error: Failed to share project - ${error.message}`]);
    }
    setIsLoading(false);
  };

  const resetForm = () => {
    handleChange({ target: { name: 'projectId', value: '' } });
    handleChange({ target: { name: 'groupId', value: '' } });
    handleChange({ target: { name: 'accessLevel', value: '30' } });
    handleChange({ target: { name: 'expiresAt', value: '' } });
    setErrors({});
    setResults([]);
  };

  return (
    <div className="section-card">
      <h2>Share Project with Group</h2>
      <p className="help-text">
        Share a project with a group by specifying the project ID, numeric group
        ID, access level, and optional expiration date.
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
          <label>Group ID:</label>
          <p className="help-text">
            Enter the numeric ID of the group (e.g., "456"). Paths are not
            supported.
          </p>
          <input
            type="number" // Changed to number input
            name="groupId"
            value={formData.groupId}
            onChange={handleChange}
            placeholder="group-id (numeric)"
            disabled={isLoading}
            min="1" // Prevent negative or zero IDs
          />
          {errors.groupId && <span className="error">{errors.groupId}</span>}
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

export default ShareProject;
