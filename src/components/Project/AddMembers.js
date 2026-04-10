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

/**
 * Компонент AddMembers
 * Позволяет массово добавлять существующих пользователей GitLab в указанную группу или проект.
 */
function AddMembers() {
  // Получаем настройки из контекста (токены, url), если они там есть
  // eslint-disable-next-line no-unused-vars
  const { settingsState } = useContext(AppContext);

  // Состояние переключателя: true — добавляем в группу, false — в проект
  const [isGroup, setIsGroup] = useState(true);

  // Инициализация формы через кастомный хук
  const { formData, errors, handleChange, setErrors } = useForm({
    id: '', // ID или Path группы/проекта
    usernames: '', // Список имен пользователей через запятую
    fetchUrl: '', // URL для подгрузки списка имен
    accessLevel: '30', // Уровень доступа (30 = Developer)
  });

  const [results, setResults] = useState([]); // Лог результатов операций
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Обработка загрузки текстового файла (.txt)
   * Читает файл, разбивает строки по запятым или переносам строк и очищает от пробелов.
   */
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target.result;
        const usernames = text
          .split(/[\n,]+/) // Регулярка: делим по переносу строки ИЛИ запятой
          .map((u) => u.trim()) // Убираем лишние пробелы
          .filter((u) => u); // Удаляем пустые строки

        // Обновляем поле usernames в форме
        handleChange({
          target: { name: 'usernames', value: usernames.join(', ') },
        });
      };
      reader.readAsText(file);
    }
  };

  /**
   * Подгрузка имен пользователей с внешнего сервера (JSON)
   */
  const handleFetchJson = async () => {
    if (!formData.fetchUrl) {
      setErrors({ ...errors, fetchUrl: 'Server URL is required' });
      return;
    }
    setIsLoading(true);
    try {
      const jsonData = await fetchJsonFromServer(formData.fetchUrl);
      // Ожидаем либо объект { usernames: [...] }, либо просто массив строк
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

  /**
   * Валидация перед отправкой запросов в GitLab
   */
  const validateForm = () => {
    const newErrors = {};
    const token = localStorage.getItem('gitlabToken');
    const url = localStorage.getItem('gitlabUrl');

    if (!token) newErrors.token = 'Personal Access Token is required';
    if (!url) newErrors.url = 'GitLab URL is required';
    if (!formData.id)
      newErrors.id = `${isGroup ? 'Group' : 'Project'} ID or path is required`;
    if (!formData.usernames)
      newErrors.usernames = 'At least one username is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Основная логика добавления участников
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      setResults(['Please fix the errors in the form.']);
      return;
    }

    setIsLoading(true);
    setResults([]); // Очищаем лог перед новым запуском

    const token = localStorage.getItem('gitlabToken');
    const url = localStorage.getItem('gitlabUrl');

    // Превращаем строку из textarea в массив чистых имен
    const usernames = formData.usernames
      .split(',')
      .map((u) => u.trim())
      .filter((u) => u);

    const selectedAccessLevel = formData.accessLevel;
    const newResults = [];

    // Итерируемся по списку имен и вызываем API для каждого
    for (const username of usernames) {
      try {
        if (isGroup) {
          // Вызов API для добавления в группу
          await addMembersToGroup(
            url,
            token,
            formData.id,
            username,
            selectedAccessLevel
          );
          newResults.push(
            `Success: Added "${username}" to group "${formData.id}"`
          );
        } else {
          // Вызов API для добавления в проект
          await addMembersToProject(
            url,
            token,
            formData.id,
            username,
            selectedAccessLevel
          );
          newResults.push(
            `Success: Added "${username}" to project "${formData.id}"`
          );
        }
      } catch (error) {
        // Если один пользователь не добавился (например, уже состоит в группе), пишем ошибку и идем дальше
        newResults.push(
          `Error: Failed to add "${username}" - ${error.message}`
        );
      }
    }

    setResults(newResults); // Выводим итоговый лог на экран
    setIsLoading(false);
  };

  /**
   * Очистка всех полей формы
   */
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
        {/* Переключатель Типа (Группа / Проект) */}
        <div>
          <label>Type:</label>
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

        {/* Поле ID (динамический заголовок в зависимости от isGroup) */}
        <div>
          <label>{isGroup ? 'Group ID or Path' : 'Project ID or Path'}:</label>
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

        {/* Компонент выбора уровня доступа */}
        <AccessLevelSelect
          value={formData.accessLevel}
          onChange={handleChange}
          disabled={isLoading}
        />

        {/* Текстовая область для имен */}
        <div>
          <label>Usernames:</label>
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

        {/* Подгрузка по ссылке */}
        <div className="fetch-json-container">
          <label>Fetch Usernames from Server:</label>
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

        {/* Загрузка текстового файла */}
        <div>
          <label>Upload Usernames File:</label>
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

      {/* Список результатов (лог) */}
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
