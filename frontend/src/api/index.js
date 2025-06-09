import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// APIクライアントの設定
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// ルート最適化
export const optimizeRoute = async (data) => {
  try {
    const response = await apiClient.post('/api/ishigaki/optimize', data);
    return response.data;
  } catch (error) {
    console.error('Route optimization error:', error);
    throw error;
  }
};

// 環境データ取得
export const getEnvironmentalData = async (date) => {
  try {
    const response = await apiClient.get(`/api/ishigaki/environmental_data/${date}`);
    return response.data;
  } catch (error) {
    console.error('Environmental data error:', error);
    throw error;
  }
};

// スケジュールエクスポート
export const exportSchedule = async (routes, format = 'pdf') => {
  try {
    const response = await apiClient.post('/api/ishigaki/export', {
      routes,
      format
    });
    return response.data;
  } catch (error) {
    console.error('Export error:', error);
    throw error;
  }
};

// 記録保存
export const saveRecord = async (record) => {
  try {
    const response = await apiClient.post('/api/ishigaki/save_record', record);
    return response.data;
  } catch (error) {
    console.error('Save record error:', error);
    throw error;
  }
};

// 統計情報取得
export const getStatistics = async (date) => {
  try {
    const response = await apiClient.get(`/api/ishigaki/statistics/${date}`);
    return response.data;
  } catch (error) {
    console.error('Statistics error:', error);
    throw error;
  }
};

// システムステータス取得
export const getSystemStatus = async () => {
  try {
    const response = await apiClient.get('/api/system/status');
    return response.data;
  } catch (error) {
    console.error('System status error:', error);
    return { status: 'offline', message: 'API接続エラー' };
  }
};

// バッチデータ取得
export const batchDataFetch = async (requests) => {
  const results = {
    environmentalData: null,
    statistics: null,
    system: null,
    errors: []
  };

  try {
    const promises = [];
    
    if (requests.environmentalData) {
      promises.push(
        getEnvironmentalData(requests.environmentalData.date)
          .then(data => { results.environmentalData = data; })
          .catch(err => { results.errors.push('環境データ取得失敗'); })
      );
    }
    
    if (requests.statistics) {
      promises.push(
        getStatistics(requests.statistics.date)
          .then(data => { results.statistics = data; })
          .catch(err => { results.errors.push('統計情報取得失敗'); })
      );
    }
    
    if (requests.systemStatus) {
      promises.push(
        getSystemStatus()
          .then(data => { results.system = data; })
          .catch(err => { results.errors.push('システムステータス取得失敗'); })
      );
    }
    
    await Promise.all(promises);
  } catch (error) {
    console.error('Batch fetch error:', error);
  }
  
  return results;
};

// 車両最適化提案取得
export const getVehicleOptimizationSuggestions = async (vehicleCount) => {
  try {
    const response = await apiClient.get(`/api/ishigaki/vehicle_suggestions/${vehicleCount}`);
    return response.data;
  } catch (error) {
    console.error('Vehicle suggestions error:', error);
    return [];
  }
};

// AIルート提案取得
export const getAIRouteSuggestion = async (data) => {
  try {
    const response = await apiClient.post('/api/ishigaki/ai_route_suggestion', data);
    return response.data;
  } catch (error) {
    console.error('AI route suggestion error:', error);
    throw error;
  }
};