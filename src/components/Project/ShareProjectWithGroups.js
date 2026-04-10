import React, { useState, useContext } from 'react';
import { useForm } from '../../hooks/useForm';
import { shareProjectWithGroup } from '../../services/gitlabApi';
import { fetchJsonFromServer } from '../../services/externalApi';
import { AppContext } from '../../utils/AppContext';
import AccessLevelSelect from '../Shared/AccessLevelSelect';
import './Project.css';

/**
 * Компонент ShareProjectWithGroups
 * Позволяет массово предоставить доступ к проекту для списка групп.
 * Поддерживает ручной ввод JSON, загрузку из файла или получение по URL.
 */
function ShareProjectWithGroups() {
  const { settingsState } = useContext(AppContext);
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const { formData, errors, handleChange, setErrors } = useForm({
    projectId: '',
    jsonInput: '',
    fetchUrl: '',
    accessLevel: '30', // По умолчанию уровень Developer
    expiresAt: '',
  });

  /**
   * Обработчик загрузки файла с компьютера пользователя.
   * Читает содержимое JSON файла и помещает его в текстовое поле формы.
   */
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        handleChange({
          target: { name: 'jsonInput', value: event.target.result },
        });
      };
      reader.readAsText(file); // Читаем файл как текст
    }
  };

  /**
   * Запрос JSON-данных со стороннего сервера.
   */
  const handleFetchJson = async () => {
    if (!formData.fetchUrl) {
      setErrors({ ...errors, fetchUrl: 'Server URL is required' });
      return;
    }

    setIsLoading(true);
    try {
      // Получаем JSON и форматируем его с отступами (2 пробела) для красивого отображения
      const jsonData = await fetchJsonFromServer(formData.fetchUrl);
      const jsonString = JSON.stringify(jsonData, null, 2);
      handleChange({ target: { name: 'jsonInput', value: jsonString } });
      setErrors({ ...errors, fetchUrl: '' });
    } catch (error) {
      setErrors({ ...errors, fetchUrl: error.message });
    }
    setIsLoading(false);
  };

  /**
   * Строгая валидация введенного JSON и остальных полей
   */
  const validateForm = () => {
    const newErrors = {};
    const token = localStorage.getItem('gitlabToken');
    const url = localStorage.getItem('gitlabUrl');

    if (!token)
      newErrors.token = 'Personal Access Token is required (set in Settings)';
    if (!url) newErrors.url = 'GitLab URL is required (set in Settings)';
    if (!formData.projectId)
      newErrors.projectId = 'Project ID or path is required';

    // Проверка корректности JSON
    if (!formData.jsonInput) {
      newErrors.jsonInput = 'JSON input is required';
    } else {
      try {
        const parsed = JSON.parse(formData.jsonInput);
        // Проверяем наличие ключа 'groups-id', что это массив и что все элементы - положительные числа
        if (
          !parsed['groups-id'] ||
          !Array.isArray(parsed['groups-id']) ||
          !parsed['groups-id'].every((id) => Number.isInteger(id) && id > 0)
        ) {
          newErrors.jsonInput =
            'JSON must have a "groups-id" array with positive numeric IDs';
        }
      } catch {
        // Ошибка выбросится, если синтаксис JSON нарушен (например, пропущена запятая)
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

  /**
   * Обработчик массовой отправки запросов
   */
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

    // Отправляем запросы последовательно для каждой группы из JSON
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

    // Сохраняем все результаты (и успехи, и ошибки) для вывода на экран
    setResults(newResults);
    setIsLoading(false);
  };

  /**
   * Сброс формы к начальному состоянию
   */
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
        {/* Поле: ID проекта */}
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

        {/* Поле: Ввод JSON вручную */}
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
            placeholder={`{\n  "groups-id": [\n    123,\n    321\n  ]\n}`}
            disabled={isLoading}
          />
          {errors.jsonInput && (
            <span className="error">{errors.jsonInput}</span>
          )}
        </div>

        {/* Выбор уровня доступа */}
        <AccessLevelSelect
          value={formData.accessLevel}
          onChange={handleChange}
          disabled={isLoading}
        />

        {/* Поле: Дата окончания доступа */}
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

        {/* Блок для получения JSON по URL */}
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

        {/* Блок загрузки JSON с компьютера */}
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

        {/* Вывод глобальных ошибок */}
        {errors.token && <span className="error">{errors.token}</span>}
        {errors.url && <span className="error">{errors.url}</span>}

        {/* Кнопки формы */}
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Sharing...' : 'Share Project'}
        </button>
        <button type="button" onClick={resetForm} disabled={isLoading}>
          Reset Form
        </button>
      </form>

      {/* Окно результатов пакетной обработки */}
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
