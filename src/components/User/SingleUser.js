import React, { useState } from 'react';
import { useForm } from '../../hooks/useForm';
import { createUser, addUserToGroup } from '../../services/gitlabApi';
import { generatePassword } from '../../utils/helpers';
import AccessLevelSelect from '../Shared/AccessLevelSelect';
import './User.css';

function SingleUser() {
  const initialState = {
    formData: { name: '', email: '', group: '', accessLevel: '30' }, // Default to Developer
    status: '',
    generatedPassword: '',
    isLoading: false,
    errors: {},
    showStatus: false,
  };
  const [state, setState] = useState(initialState);

  const { formData, errors, handleChange, setErrors } = useForm({
    name: state.formData.name,
    email: state.formData.email,
    group: state.formData.group,
    accessLevel: state.formData.accessLevel,
  });

  const validateForm = () => {
    const newErrors = {};
    const token = localStorage.getItem('gitlabToken');
    const url = localStorage.getItem('gitlabUrl');
    if (!token)
      newErrors.token = 'Personal Access Token is required (set in Settings)';
    if (!url) newErrors.url = 'GitLab URL is required (set in Settings)';
    else if (!/^https?:\/\/[^\s/$.?#].[^\s]*$/.test(url))
      newErrors.url = 'Invalid URL format';
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = 'Invalid email format';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      setState({
        ...state,
        status: 'Please fix the errors in the form.',
        showStatus: true,
      });
      return;
    }

    setState({ ...state, isLoading: true });

    const token = localStorage.getItem('gitlabToken');
    const url = localStorage.getItem('gitlabUrl');
    const username = formData.email.split('@')[0];
    const password = generatePassword();
    const payload = {
      name: formData.name,
      email: formData.email,
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
            formData.accessLevel
          );
          groupStatus = ` User added to group "${formData.group}" with access level ${formData.accessLevel}.`;
        } catch (groupError) {
          groupStatus = ` ${groupError.message}`;
        }
      }
      setState({
        ...state,
        isLoading: false,
        status: `Success: User "${formData.name}" created.${groupStatus}`,
        generatedPassword: password,
        showStatus: true,
      });
    } catch (error) {
      setState({
        ...state,
        isLoading: false,
        status: error.response?.data?.message || 'Error creating user.',
        generatedPassword: '',
        showStatus: true,
      });
    }
  };

  const resetForm = () => {
    setState(initialState);
  };

  return (
    <div className="section-card">
      <h2>Create Single User</h2>
      <p className="help-text">
        Create a single GitLab user with an optional group assignment.
      </p>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Name:</label>
          <p className="help-text">Enter the full name of the user.</p>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="John Doe"
            disabled={state.isLoading}
          />
          {errors.name && <span className="error">{errors.name}</span>}
        </div>
        <div>
          <label>Email:</label>
          <p className="help-text">
            Enter a valid email address (username will be derived from it).
          </p>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="john.doe@example.com"
            disabled={state.isLoading}
          />
          {errors.email && <span className="error">{errors.email}</span>}
        </div>
        <AccessLevelSelect
          value={formData.accessLevel}
          onChange={handleChange}
          disabled={state.isLoading}
        />
        <div>
          <label>Add user to a group:</label>
          <p className="help-text">
            Optional: Enter the group ID or path (e.g., "my-group" or "123").
          </p>
          <input
            type="text"
            name="group"
            value={formData.group}
            onChange={handleChange}
            placeholder="group-id or path"
            disabled={state.isLoading}
          />
        </div>
        {errors.token && <span className="error">{errors.token}</span>}
        {errors.url && <span className="error">{errors.url}</span>}
        <button type="submit" disabled={state.isLoading}>
          {state.isLoading ? 'Creating...' : 'Create User'}
        </button>
        <button type="button" onClick={resetForm} disabled={state.isLoading}>
          Reset Form
        </button>
      </form>
      {state.showStatus && (
        <div className="status">
          <h3>Status</h3>
          <p
            className={
              state.status.includes('Success') ? 'success' : 'error-text'
            }
          >
            {state.status}
          </p>
          {state.generatedPassword && (
            <div className="password-container">
              <p>
                <strong>Generated Password:</strong>{' '}
                <span className="password">{state.generatedPassword}</span>
              </p>
              <p className="password-note">
                (Temporary - User must reset on first login)
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SingleUser;
