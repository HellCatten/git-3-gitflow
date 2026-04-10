import React, { useState } from 'react';
import { useForm } from '../../hooks/useForm';
import { createUser, addUserToGroup } from '../../services/gitlabApi';
import { fetchJsonFromServer } from '../../services/externalApi';
import { generatePassword } from '../../utils/helpers';
import AccessLevelSelect from '../Shared/AccessLevelSelect';
import './User.css';

/**
 * Компонент BulkUser
 * Позволяет массово создавать пользователей GitLab, используя JSON-данные.
 * Поддерживает ручной ввод, загрузку файла или получение данных по URL.
 */
function BulkUser() {
  // Расширенное начальное состояние для хранения результатов массовой операции
  const initialState = {
    formData: { jsonInput: '', group: '', fetchUrl: '', accessLevel: '30' },
    results: [], // Массив созданных пользователей (с именами и паролями)
    statusSummary: [], // Массив текстовых сообщений о статусе каждого запроса
    isLoading: false,
    errors: {},
    showResults: false,
  };

  const [state, setState] = useState(initialState);

  // Использование хука для управления полями формы
  const { formData, errors, handleChange, setErrors } = useForm({
    jsonInput: state.formData.jsonInput,
    group: state.formData.group,
    fetchUrl: state.formData.fetchUrl,
    accessLevel: state.formData.accessLevel,
  });

  /**
   * Обработка загрузки локального JSON-файла
   */
  const handleBulkFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        // Записываем содержимое файла в текстовое поле jsonInput
        handleChange({
          target: { name: 'jsonInput', value: event.target.result },
        });
      };
      reader.readAsText(file);
    }
  };

  /**
   * Получение JSON-данных с удаленного сервера (например, по API ссылке)
   */
  const handleFetchJson = async () => {
    if (!formData.fetchUrl) {
      setErrors({ ...errors, fetchUrl: 'Server URL is required' });
      return;
    }
    setState({ ...state, isLoading: true });
    try {
      const jsonData = await fetchJsonFromServer(formData.fetchUrl);
      // Форматируем полученный JSON в красивую строку для отображения в textarea
      const jsonString = JSON.stringify(jsonData, null, 2);
      handleChange({ target: { name: 'jsonInput', value: jsonString } });
      setState({ ...state, isLoading: false });
      setErrors({ ...errors, fetchUrl: '' });
    } catch (error) {
      setErrors({ ...errors, fetchUrl: error.message });
      setState({ ...state, isLoading: false });
    }
  };

  /**
   * Валидация формы и структуры JSON
   */
  const validateBulkForm = () => {
    const newErrors = {};
    const token = localStorage.getItem('gitlabToken');
    const url = localStorage.getItem('gitlabUrl');

    if (!token) newErrors.token = 'Personal Access Token is required';
    if (!url) newErrors.url = 'GitLab URL is required';

    if (!formData.jsonInput) {
      newErrors.jsonInput = 'JSON input is required';
    } else {
      try {
        const parsed = JSON.parse(formData.jsonInput);
        // Проверка структуры: должен быть объект с ключом "users" (массив)
        // и каждый пользователь должен иметь name и email
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

  /**
   * Основной обработчик массового создания пользователей
   */
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

    // Последовательная обработка каждого пользователя из списка
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
        // Создание в GitLab
        const createdUser = await createUser(url, token, payload);
        let groupStatus = '';

        // Опциональное добавление в группу
        if (formData.group) {
          try {
            await addUserToGroup(
              url,
              token,
              formData.group,
              createdUser.id,
              selectedAccessLevel
            );
            groupStatus = ` User added to group "${formData.group}".`;
          } catch (groupError) {
            groupStatus = ` ${groupError.message}`;
          }
        }

        // Собираем успешный результат
        newResults.push({ name: user.name, email: user.email, password });
        newStatusSummary.push(
          `Success: User "${user.name}" created.${groupStatus}`
        );
      } catch (error) {
        // Если один пользователь не создался, продолжаем цикл, но фиксируем ошибку
        newResults.push({ name: user.name, email: user.email, password: null });
        newStatusSummary.push(
          error.message || `Error creating user "${user.name}"`
        );
      }
    }

    // Обновляем состояние финальными результатами цикла
    setState({
      ...state,
      isLoading: false,
      results: newResults,
      statusSummary: newStatusSummary,
      showResults: true,
    });
  };

  /**
   * Копирование списка созданных пользователей в буфер обмена
   */
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

  /**
   * Печать результатов (открывает новое окно с данными)
   */
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

  /**
   * Сохранение результатов в текстовый файл (.txt)
   */
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
        Create multiple GitLab users at once by providing a JSON list.
      </p>

      <form onSubmit={handleBulkSubmit}>
        {/* Поле для ввода JSON вручную */}
        <div>
          <label>Users JSON:</label>
          <p className="help-text">Paste a JSON object with a 'users' array.</p>
          <textarea
            name="jsonInput"
            value={formData.jsonInput}
            onChange={handleChange}
            rows="10"
            placeholder={`{ "users": [...] }`}
            disabled={state.isLoading}
          />
          {errors.jsonInput && (
            <span className="error">{errors.jsonInput}</span>
          )}
        </div>

        {/* Настройка группы и уровня доступа для всех пользователей */}
        <div>
          <label>Add users to a group:</label>
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

        {/* Блок загрузки JSON по ссылке */}
        <div className="fetch-json-container">
          <label>Fetch JSON from Server:</label>
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

        {/* Блок загрузки файла */}
        <div>
          <label>Upload JSON File:</label>
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

      {/* Отображение результатов после выполнения */}
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
              </div>
            ))}
          </div>

          {/* Группа кнопок для действий с готовым списком */}
          <div className="button-group">
            <button onClick={copyBulkUserList} className="copy-btn">
              Copy List
            </button>
            <button onClick={printBulkResults} className="print-btn">
              Print
            </button>
            <button onClick={saveBulkUserList} className="save-btn">
              Save to File
            </button>
          </div>

          {/* Краткая сводка по каждому пользователю (успех/ошибка) */}
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
