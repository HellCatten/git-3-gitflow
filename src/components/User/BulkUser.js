import React, { useState } from 'react';
import { useForm } from '../../hooks/useForm';
import { createUser, addUserToGroup } from '../../services/gitlabApi';
import { fetchJsonFromServer } from '../../services/externalApi';
import { generatePassword } from '../../utils/helpers';
import AccessLevelSelect from '../Shared/AccessLevelSelect';
import './User.css';

function BulkUser() {
  const initialState = {
    formData: { jsonInput: '', group: '', fetchUrl: '', accessLevel: '30' }, // Default to Developer
    results: [],
    statusSummary: [],
    isLoading: false,
    errors: {},
    showResults: false,
  };
  const [state, setState] = useState(initialState);

  const { formData, errors, handleChange, setErrors } = useForm({
    jsonInput: state.formData.jsonInput,
    group: state.formData.group,
    fetchUrl: state.formData.fetchUrl,
    accessLevel: state.formData.accessLevel,
  });

  const handleBulkFileUpload = (e) => {
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
    setState({ ...state, isLoading: true });
    try {
      const jsonData = await fetchJsonFromServer(formData.fetchUrl);
      const jsonString = JSON.stringify(jsonData, null, 2);
      handleChange({ target: { name: 'jsonInput', value: jsonString } });
      setState({ ...state, isLoading: false });
      setErrors({ ...errors, fetchUrl: '' });
    } catch (error) {
      setErrors({ ...errors, fetchUrl: error.message });
      setState({ ...state, isLoading: false });
    }
  };

  const validateBulkForm = () => {
    const newErrors = {};
    const token = localStorage.getItem('gitlabToken');
    const url = localStorage.getItem('gitlabUrl');
    if (!token)
      newErrors.token = 'Personal Access Token is required (set in Settings)';
    if (!url) newErrors.url = 'GitLab URL is required (set in Settings)';
    else if (!/^https?:\/\/[^\s/$.?#].[^\s]*$/.test(url))
      newErrors.url = 'Invalid URL format in Settings';
    if (!formData.jsonInput) newErrors.jsonInput = 'JSON input is required';
    else {
      try {
        const parsed = JSON.parse(formData.jsonInput);
        if (
          !parsed.users ||
          !Array.isArray(parsed.users) ||
          !parsed.users.every((u) => u.name && u.email)
        ) {
          newErrors.jsonInput =
            'JSON must have a "users" array with objects containing "name" and "email" fields';
        }
      } catch {
        newErrors.jsonInput = 'Invalid JSON format';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    if (!validateBulkForm()) {
      setState({
        ...state,
        statusSummary: ['Please fix the errors in the form.'],
        showResults: true,
      });
      return;
    }

    setState({
      ...state,
      isLoading: true,
      results: [],
      statusSummary: [],
      showResults: true,
    });

    const token = localStorage.getItem('gitlabToken');
    const url = localStorage.getItem('gitlabUrl');
    const { users } = JSON.parse(formData.jsonInput);
    const selectedAccessLevel = formData.accessLevel;
    const newResults = [];
    const newStatusSummary = [];

    for (const user of users) {
      const username = user.email.split('@')[0];
      const password = generatePassword();
      const payload = {
        name: user.name,
        email: user.email,
        username,
        password,
        skip_confirmation: true,
        reset_password: true,
      };

      try {
        const createdUser = await createUser(url, token, payload);
        let groupStatus = '';
        if (formData.group) {
          try {
            await addUserToGroup(
              url,
              token,
              formData.group,
              createdUser.id,
              selectedAccessLevel
            );
            groupStatus = ` User added to group "${formData.group}" with access level ${selectedAccessLevel}.`;
          } catch (groupError) {
            groupStatus = ` ${groupError.message}`;
          }
        }
        newResults.push({ name: user.name, email: user.email, password });
        newStatusSummary.push(
          `Success: User "${user.name}" created.${groupStatus}`
        );
      } catch (error) {
        newResults.push({ name: user.name, email: user.email, password: null });
        newStatusSummary.push(
          error.message || `Error creating user "${user.name}"`
        );
      }
    }

    setState({
      ...state,
      isLoading: false,
      results: newResults,
      statusSummary: newStatusSummary,
      showResults: true,
    });
  };

  const copyBulkUserList = () => {
    const userListText = state.results
      .map(
        (user) =>
          `Name: ${user.name}\nEmail: ${user.email}\nPassword: ${user.password || 'N/A'}\n`
      )
      .join('\n');
    navigator.clipboard.writeText(userListText);
    alert('User list copied to clipboard!');
  };

  const printBulkResults = () => {
    const printWindow = window.open('', '_blank');
    const content = document.querySelector('.results')?.outerHTML;
    printWindow.document.write(`
      <html>
        <head><title>Print Results</title><style>${document.querySelector('style')?.innerHTML || ''}</style></head>
        <body>${content}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  const saveBulkUserList = () => {
    const userListText = state.results
      .map(
        (user) =>
          `Name: ${user.name}\nEmail: ${user.email}\nPassword: ${user.password || 'N/A'}\n`
      )
      .join('\n');
    const blob = new Blob([userListText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'user_list.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const resetBulkForm = () => {
    setState(initialState);
    handleChange({ target: { name: 'fetchUrl', value: '' } });
    handleChange({ target: { name: 'accessLevel', value: '30' } });
  };

  return (
    <div className="section-card">
      <h2>Create Multiple Users</h2>
      <p className="help-text">
        Create multiple GitLab users at once by providing a JSON list, with
        optional group assignment.
      </p>
      <form onSubmit={handleBulkSubmit}>
        <div>
          <label>Users JSON:</label>
          <p className="help-text">
            Paste or fetch a JSON object with a 'users' array, each having
            'name' and 'email' fields (see placeholder).
          </p>
          <textarea
            name="jsonInput"
            value={formData.jsonInput}
            onChange={handleChange}
            rows="10"
            placeholder={`{
  "users": [
    {"name": "Иван Иванов", "email": "ivanov1@example.com"},
    {"name": "Иван Иванов", "email": "ivanov2@example.com"}
  ]
}`}
            disabled={state.isLoading}
          />
          {errors.jsonInput && (
            <span className="error">{errors.jsonInput}</span>
          )}
        </div>
        <div>
          <label>Add users to a group:</label>
          <p className="help-text">
            Optional: Enter the group ID or path (e.g., "my-group" or "123") to
            assign all users to a group.
          </p>
          <input
            type="text"
            name="group"
            value={formData.group || ''}
            onChange={handleChange}
            placeholder="group-id or path"
            disabled={state.isLoading}
          />
        </div>
        <AccessLevelSelect
          value={formData.accessLevel}
          onChange={handleChange}
          disabled={state.isLoading}
        />
        <div className="fetch-json-container">
          <label>Fetch JSON from Server:</label>
          <p className="help-text">
            Enter a URL to fetch a JSON list of users from your server (e.g.,
            "https://your-server.com/users.json").
          </p>
          <input
            type="text"
            name="fetchUrl"
            value={formData.fetchUrl}
            onChange={handleChange}
            placeholder="https://your-server.com/users.json"
            disabled={state.isLoading}
          />
          <button
            type="button"
            onClick={handleFetchJson}
            disabled={state.isLoading}
          >
            {state.isLoading ? 'Fetching...' : 'Fetch JSON'}
          </button>
          {errors.fetchUrl && <span className="error">{errors.fetchUrl}</span>}
        </div>
        <div>
          <label>Upload JSON File:</label>
          <p className="help-text">
            Upload a .json file containing a 'users' array with 'name' and
            'email' fields.
          </p>
          <input
            type="file"
            accept=".json"
            onChange={handleBulkFileUpload}
            disabled={state.isLoading}
          />
        </div>
        {errors.token && <span className="error">{errors.token}</span>}
        {errors.url && <span className="error">{errors.url}</span>}
        <button type="submit" disabled={state.isLoading}>
          {state.isLoading ? 'Creating...' : 'Create Users'}
        </button>
        <button
          type="button"
          onClick={resetBulkForm}
          disabled={state.isLoading}
        >
          Reset Form
        </button>
      </form>
      {state.showResults && (
        <div className="results">
          <h3>Created Users</h3>
          <div className="user-list">
            {state.results.map((user, index) => (
              <div key={index} className="user-item">
                <p>
                  <strong>Name:</strong> {user.name}
                </p>
                <p>
                  <strong>Email:</strong> {user.email}
                </p>
                <p>
                  <strong>Password:</strong>{' '}
                  <span className="password">{user.password || 'N/A'}</span>
                </p>
                {user.password && (
                  <p className="password-note">
                    (Temporary - User must reset on first login)
                  </p>
                )}
              </div>
            ))}
          </div>
          <div className="button-group">
            <button
              onClick={copyBulkUserList}
              disabled={state.isLoading}
              className="copy-btn"
            >
              Copy List
            </button>
            <button
              onClick={printBulkResults}
              disabled={state.isLoading}
              className="print-btn"
            >
              Print
            </button>
            <button
              onClick={saveBulkUserList}
              disabled={state.isLoading}
              className="save-btn"
            >
              Save to File
            </button>
          </div>
          <div className="status-summary">
            <h3>Status Summary</h3>
            {state.statusSummary.map((status, index) => (
              <p
                key={index}
                className={
                  status.includes('Success') ? 'success' : 'error-text'
                }
              >
                {status}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default BulkUser;
