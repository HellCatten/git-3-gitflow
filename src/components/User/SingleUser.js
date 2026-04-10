import React, { useState } from 'react';
import { useForm } from '../../hooks/useForm';
import { createUser, addUserToGroup } from '../../services/gitlabApi';
import { generatePassword } from '../../utils/helpers';
import AccessLevelSelect from '../Shared/AccessLevelSelect';
import './User.css';

/**
 * Компонент SingleUser
 * Предназначен для создания одного пользователя в GitLab и опционального добавления его в группу.
 */
function SingleUser() {
  // Начальное состояние для управления UI (загрузка, сообщения об ошибках, пароль)
  const initialState = {
    formData: { name: '', email: '', group: '', accessLevel: '30' }, // 30 — уровень "Developer" по умолчанию
    status: '',
    generatedPassword: '',
    isLoading: false,
    errors: {},
    showStatus: false,
  };

  const [state, setState] = useState(initialState);

  // Использование кастомного хука для управления полями формы
  const { formData, errors, handleChange, setErrors } = useForm({
    name: state.formData.name,
    email: state.formData.email,
    group: state.formData.group,
    accessLevel: state.formData.accessLevel,
  });

  /**
   * Валидация полей формы перед отправкой
   * Проверяет наличие настроек API в localStorage и корректность ввода данных
   */
  const validateForm = () => {
    const newErrors = {};
    const token = localStorage.getItem('gitlabToken');
    const url = localStorage.getItem('gitlabUrl');

    // Проверка настроек подключения
    if (!token)
      newErrors.token = 'Personal Access Token is required (set in Settings)';
    if (!url) {
      newErrors.url = 'GitLab URL is required (set in Settings)';
    } else if (!/^https?:\/\/[^\s/$.?#].[^\s]*$/.test(url)) {
      newErrors.url = 'Invalid URL format';
    }

    // Проверка обязательных полей пользователя
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Обработчик отправки формы
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Если валидация не прошла, прерываем выполнение
    if (!validateForm()) {
      setState({
        ...state,
        status: 'Please fix the errors in the form.',
        showStatus: true,
      });
      return;
    }

    setState({ ...state, isLoading: true });

    // Получаем данные для API
    const token = localStorage.getItem('gitlabToken');
    const url = localStorage.getItem('gitlabUrl');
    const username = formData.email.split('@')[0]; // Генерируем username из email
    const password = generatePassword(); // Генерируем случайный пароль

    // Тело запроса для создания пользователя
    const payload = {
      name: formData.name,
      email: formData.email,
      username,
      password,
      skip_confirmation: true, // Пропустить подтверждение по почте
      reset_password: true, // Потребовать смену пароля при первом входе
    };

    try {
      // 1. Создаем пользователя
      const createdUser = await createUser(url, token, payload);
      let groupStatus = '';

      // 2. Если указана группа, добавляем в неё созданного пользователя
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
          // Ошибка добавления в группу не отменяет успех создания пользователя
          groupStatus = ` ${groupError.message}`;
        }
      }

      // Обновляем состояние при успехе
      setState({
        ...state,
        isLoading: false,
        status: `Success: User "${formData.name}" created.${groupStatus}`,
        generatedPassword: password,
        showStatus: true,
      });
    } catch (error) {
      // Обработка ошибок API (например, пользователь уже существует)
      setState({
        ...state,
        isLoading: false,
        status: error.response?.data?.message || 'Error creating user.',
        generatedPassword: '',
        showStatus: true,
      });
    }
  };

  /**
   * Сброс формы к начальному состоянию
   */
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
        {/* Поле: Имя */}
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

        {/* Поле: Email */}
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

        {/* Выбор уровня доступа (Компонент) */}
        <AccessLevelSelect
          value={formData.accessLevel}
          onChange={handleChange}
          disabled={state.isLoading}
        />

        {/* Поле: Группа (Опционально) */}
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

        {/* Вывод общих ошибок (токен/url) */}
        {errors.token && <span className="error">{errors.token}</span>}
        {errors.url && <span className="error">{errors.url}</span>}

        <button type="submit" disabled={state.isLoading}>
          {state.isLoading ? 'Creating...' : 'Create User'}
        </button>

        <button type="button" onClick={resetForm} disabled={state.isLoading}>
          Reset Form
        </button>
      </form>

      {/* Блок вывода статуса операции */}
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

          {/* Если пароль был сгенерирован, показываем его */}
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
