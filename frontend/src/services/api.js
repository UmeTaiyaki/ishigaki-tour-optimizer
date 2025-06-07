import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const optimizeRoute = async (tourData) => {
  try {
    const response = await api.post('/api/optimize', {
      date: tourData.date,
      activity_type: tourData.activityType,
      activity_lat: tourData.activityLocation.lat,
      activity_lng: tourData.activityLocation.lng,
      planned_start_time: tourData.startTime,
      guests: tourData.guests,
    });
    return response.data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const saveRecord = async (record) => {
  try {
    const response = await api.post('/api/save_record', record);
    return response.data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const trainModel = async () => {
  try {
    const response = await api.get('/api/train_model');
    return response.data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const getEnvironmentalData = async (date) => {
  try {
    const response = await api.get(`/api/environmental_data/${date}`);
    return response.data;
  } catch (error) {
    console.error('API Error:', error);
    // フォールバック値を返す
    return {
      tide: { level: 150, state: 'rising' },
      weather: { condition: 'sunny', temp: 28, windSpeed: 3.5 },
    };
  }
};

export default api;