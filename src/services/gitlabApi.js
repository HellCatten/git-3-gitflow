import axios from 'axios';
import {
  USERS_ENDPOINT,
  GROUP_MEMBERS_ENDPOINT,
  PROJECT_MEMBERS_ENDPOINT,
  PROJECT_SHARE_ENDPOINT,
  PROJECT_ENDPOINT,
  PROJECT_FORKS_ENDPOINT,
} from '../constants/api';

const getConfig = (token) => ({
  headers: {
    'PRIVATE-TOKEN': token,
    'Content-Type': 'application/json',
  },
});

export async function createUser(url, token, payload) {
  const response = await axios.post(
    `${url}${USERS_ENDPOINT}`,
    payload,
    getConfig(token)
  );
  return response.data;
}

export async function addUserToGroup(
  url,
  token,
  groupId,
  userId,
  accessLevel = '30'
) {
  const endpoint = `${url}${GROUP_MEMBERS_ENDPOINT.replace(':id', encodeURIComponent(groupId))}`;
  try {
    const response = await axios.post(
      endpoint,
      { user_id: userId, access_level: parseInt(accessLevel) },
      getConfig(token)
    );
    return response.data;
  } catch (error) {
    throw new Error(
      `Failed to add user to group "${groupId}": ${error.response?.status} - ${error.response?.data?.message || 'Not Found'}`
    );
  }
}

export async function addMembersToGroup(
  url,
  token,
  groupId,
  username,
  accessLevel = '30'
) {
  const endpoint = `${url}${GROUP_MEMBERS_ENDPOINT.replace(':id', encodeURIComponent(groupId))}`;
  try {
    const response = await axios.post(
      endpoint,
      { username, access_level: parseInt(accessLevel) }, // Use username directly
      getConfig(token)
    );
    return response.data;
  } catch (error) {
    throw new Error(
      `Failed to add user "${username}" to group "${groupId}": ${error.response?.status} - ${error.response?.data?.message || 'Not Found'}`
    );
  }
}

export async function addMembersToProject(
  url,
  token,
  projectId,
  username,
  accessLevel = '30'
) {
  const endpoint = `${url}${PROJECT_MEMBERS_ENDPOINT.replace(':id', encodeURIComponent(projectId))}`;
  try {
    const response = await axios.post(
      endpoint,
      { username, access_level: parseInt(accessLevel) }, // Use username directly
      getConfig(token)
    );
    return response.data;
  } catch (error) {
    throw new Error(
      `Failed to add user "${username}" to project "${projectId}": ${error.response?.status} - ${error.response?.data?.message || 'Not Found'}`
    );
  }
}

export async function shareProjectWithGroup(url, token, projectId, payload) {
  const endpoint = `${url}${PROJECT_SHARE_ENDPOINT.replace(':id', encodeURIComponent(projectId))}`;
  try {
    const response = await axios.post(endpoint, payload, getConfig(token));
    return response.data;
  } catch (error) {
    throw new Error(
      `Failed to share project "${projectId}" with group "${payload.group_id}": ${error.response?.status} - ${error.response?.data?.message || 'Not Found'}`
    );
  }
}

export async function listProjectInvitedGroups(url, token, projectId) {
  const endpoint = `${url}${PROJECT_ENDPOINT.replace(':id', encodeURIComponent(projectId))}`;
  try {
    const response = await axios.get(endpoint, getConfig(token));
    const groups = Array.isArray(response.data.shared_with_groups)
      ? response.data.shared_with_groups
      : [];
    return { groups, projectName: response.data.name || '' };
  } catch (error) {
    throw new Error(
      `Failed to fetch project "${projectId}" details: ${error.response?.status} - ${error.response?.data?.message || 'Not Found'}`
    );
  }
}

export async function listGroupMembers(url, token, groupId) {
  const endpoint = `${url}${GROUP_MEMBERS_ENDPOINT.replace(':id', encodeURIComponent(groupId))}`;
  let allMembers = [];
  let page = 1;
  const perPage = 100;

  try {
    while (true) {
      const response = await axios.get(endpoint, {
        ...getConfig(token),
        params: { page, per_page: perPage },
      });
      const members = response.data;
      if (!members.length) break;
      allMembers = allMembers.concat(members);
      page++;
    }
    return allMembers;
  } catch (error) {
    throw new Error(
      `Failed to fetch members for group "${groupId}": ${error.response?.status} - ${error.response?.data?.message || 'Not Found'}`
    );
  }
}

export async function forkProject(url, token, projectId, payload) {
  const endpoint = `${url}${PROJECT_ENDPOINT.replace(':id', encodeURIComponent(projectId))}/fork`;
  try {
    const response = await axios.post(endpoint, payload, getConfig(token));
    return response.data;
  } catch (error) {
    throw new Error(
      `Failed to fork project "${projectId}" to "${payload.namespace_path}": ${error.response?.status} - ${error.response?.data?.message || 'Not Found'}`
    );
  }
}

export async function listProjectForks(url, token, projectId) {
  const endpoint = `${url}${PROJECT_FORKS_ENDPOINT.replace(':id', encodeURIComponent(projectId))}`;
  let allForks = [];
  let page = 1;
  const perPage = 100;

  try {
    while (true) {
      const response = await axios.get(endpoint, {
        ...getConfig(token),
        params: { page, per_page: perPage },
      });
      const forks = response.data;
      if (!forks.length) break;
      allForks = allForks.concat(forks);
      page++;
    }
    return allForks;
  } catch (error) {
    throw new Error(
      `Failed to fetch forks for project "${projectId}": ${error.response?.status} - ${error.response?.data?.message || 'Not Found'}`
    );
  }
}
