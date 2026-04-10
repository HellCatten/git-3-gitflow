import axios from 'axios';

export async function fetchJsonFromServer(url) {
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch JSON from server');
  }
}