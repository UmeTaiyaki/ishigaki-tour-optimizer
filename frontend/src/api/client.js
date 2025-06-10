// api/client.js - エクスポート関数統一版
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// APIクライアント設定
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// リクエスト/レスポンスインターセプター
apiClient.interceptors.request.use(
  (config) => {
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.status, error.response?.data);
    return Promise.reject(error);
  }
);

// ===== システムAPI =====

/**
 * 🌐 システムステータス取得
 */
export const checkSystemStatus = async () => {
  try {
    const response = await apiClient.get('/');
    return {
      status: 'online',
      version: response.data.version || '2.0.0',
      message: response.data.message,
      features: response.data.features || []
    };
  } catch (error) {
    console.error('❌ システムステータス取得エラー:', error);
    return {
      status: 'offline',
      version: 'unknown',
      message: 'システムに接続できません',
      features: [],
      error: error.message,
      last_checked: new Date().toISOString()
    };
  }
};

/**
 * ⚙️ 設定データ取得
 */
export const getSettings = async () => {
  try {
    const savedSettings = localStorage.getItem('ishigaki_tour_settings');
    
    if (savedSettings) {
      return JSON.parse(savedSettings);
    }

    const defaultSettings = {
      weatherIntegration: true,
      autoRefresh: true,
      refreshInterval: 30,
      language: 'ja',
      notifications: true,
      mapProvider: 'google'
    };

    return defaultSettings;
  } catch (error) {
    console.error('❌ 設定取得エラー:', error);
    return {};
  }
};

/**
 * ⚙️ 設定保存
 */
export const saveSettings = async (settings) => {
  try {
    localStorage.setItem('ishigaki_tour_settings', JSON.stringify(settings));
    return { success: true };
  } catch (error) {
    console.error('❌ 設定保存エラー:', error);
    return { success: false, error: error.message };
  }
};

/**
 * ⚙️ 設定更新（App.jsで使用される関数）
 */
export const updateSettings = async (newSettings) => {
  return await saveSettings(newSettings);
};

// ===== 環境データAPI =====

/**
 * 🌤️ 環境データ取得
 */
export const getEnvironmentalData = async (date = null) => {
  try {
    const targetDate = date || new Date().toISOString().split('T')[0];
    console.log(`🌤️ 環境データ取得: ${targetDate}`);
    
    const response = await apiClient.get(`/api/ishigaki/environmental`, {
      params: { date: targetDate }
    });
    
    return {
      success: true,
      data: response.data.data,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ 環境データ取得エラー:', error);
    
    // フォールバックデータ
    const fallbackData = {
      date: date || new Date().toISOString().split('T')[0],
      location: '石垣島',
      weather: '晴れ',
      temperature: 25,
      wind_speed: 12,
      humidity: 75,
      tide_level: 150,
      tide_type: '中潮',
      source: 'fallback'
    };

    return {
      success: false,
      data: fallbackData,
      error: error.message,
      isFallback: true
    };
  }
};

/**
 * 🔧 気象API状態確認
 */
export const checkWeatherAPIStatus = async () => {
  try {
    const response = await apiClient.get('/api/ishigaki/weather/status');
    return {
      success: true,
      api_status: response.data.api_status,
      last_checked: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ 気象API状態確認エラー:', error);
    return {
      success: false,
      error: error.message,
      last_checked: new Date().toISOString()
    };
  }
};

// ===== ルート最適化API =====

/**
 * 🚗 ルート最適化実行
 */
export const optimizeRoutes = async (tourRequest) => {
  try {
    console.log('🚗 ルート最適化開始:', tourRequest);

    if (!tourRequest.guests || tourRequest.guests.length === 0) {
      throw new Error('ゲスト情報が必要です');
    }

    if (!tourRequest.vehicles || tourRequest.vehicles.length === 0) {
      throw new Error('車両情報が必要です');
    }

    // データ形式をバックエンドに合わせて変換
    const optimizationRequest = {
      date: tourRequest.date,
      activity_type: tourRequest.activityType,
      start_time: tourRequest.startTime,
      activity_lat: tourRequest.activityLocation?.lat || 24.4167,
      activity_lng: tourRequest.activityLocation?.lng || 124.1556,
      guests: tourRequest.guests.map(guest => ({
        id: guest.id,
        name: guest.name,
        hotel_name: guest.hotel_name || guest.hotel,
        pickup_lat: guest.pickup_lat || guest.location?.lat || 24.3336,
        pickup_lng: guest.pickup_lng || guest.location?.lng || 124.1543,
        num_people: guest.num_people || guest.people || 1,
        preferred_pickup_start: guest.preferred_pickup_start || '09:00',
        preferred_pickup_end: guest.preferred_pickup_end || '10:00'
      })),
      vehicles: tourRequest.vehicles.map(vehicle => ({
        id: vehicle.id,
        name: vehicle.name,
        capacity: vehicle.capacity,
        driver: vehicle.driver,
        location: {
          lat: vehicle.location?.lat || 24.3336,
          lng: vehicle.location?.lng || 124.1543
        }
      }))
    };

    console.log('📤 最適化リクエスト:', optimizationRequest);
    const response = await apiClient.post('/api/ishigaki/optimize', optimizationRequest);
    
    return {
      success: true,
      routes: response.data.routes || [],
      total_distance: response.data.total_distance || 0,
      total_time: response.data.total_time || 0,
      ...response.data
    };
    
  } catch (error) {
    console.error('❌ ルート最適化エラー:', error);
    return {
      success: false,
      routes: [],
      error: error.message
    };
  }
};

/**
 * 🚗 ルート最適化（App.jsで使用される関数名）
 */
export const optimizeRoute = optimizeRoutes;

// ===== 統計データAPI =====

/**
 * 📊 統計データ取得
 */
export const getStatistics = async () => {
  try {
    const response = await apiClient.get('/api/ishigaki/statistics');
    return {
      success: true,
      statistics: response.data.statistics || {},
      timestamp: response.data.timestamp
    };
  } catch (error) {
    console.error('❌ 統計データ取得エラー:', error);
    
    const fallbackStats = {
      total_tours: 0,
      total_guests: 0,
      total_distance: 0,
      average_efficiency: 0
    };

    return {
      success: false,
      statistics: fallbackStats,
      error: error.message
    };
  }
};

// ===== データ管理API =====

/**
 * 💾 データエクスポート
 */
export const exportData = async (format = 'json') => {
  try {
    // 現在は簡易実装
    return {
      success: true,
      message: `${format}形式でのエクスポート機能は今後実装予定です`,
      filename: `ishigaki_tour_export_${new Date().toISOString().split('T')[0]}.${format}`
    };
  } catch (error) {
    console.error('❌ データエクスポートエラー:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * 📤 データインポート
 */
export const importData = async (file) => {
  try {
    // 現在は簡易実装
    return {
      success: true,
      imported_records: 0,
      message: 'インポート機能は今後実装予定です'
    };
  } catch (error) {
    console.error('❌ データインポートエラー:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * 📋 スケジュールエクスポート（App.jsで使用される関数）
 */
export const exportSchedule = async (scheduleData, format = 'pdf') => {
  try {
    console.log('📋 スケジュールエクスポート:', scheduleData);
    
    if (format === 'pdf') {
      // PDF生成の簡易実装
      return {
        success: true,
        message: 'PDF生成機能は今後実装予定です',
        data: scheduleData
      };
    }
    
    return await exportData(format);
  } catch (error) {
    console.error('❌ スケジュールエクスポートエラー:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// ===== API接続テスト =====

/**
 * 🌐 API接続テスト
 */
export const testAPIConnection = async () => {
  try {
    const startTime = Date.now();
    const response = await apiClient.get('/health');
    const responseTime = Date.now() - startTime;

    return {
      success: true,
      response_time: responseTime,
      status: response.status
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      status: error.response?.status || 0
    };
  }
};

// ===== リアルタイム更新 =====

/**
 * 🔄 リアルタイムデータ取得セットアップ
 */
export const setupRealTimeUpdates = (callbacks = {}) => {
  let intervalId = null;
  
  const startUpdates = (interval = 30000) => {
    if (intervalId) {
      clearInterval(intervalId);
    }

    intervalId = setInterval(async () => {
      try {
        if (callbacks.onEnvironmentalUpdate) {
          const envData = await getEnvironmentalData();
          callbacks.onEnvironmentalUpdate(envData);
        }

        if (callbacks.onSystemStatusUpdate) {
          const systemStatus = await checkSystemStatus();
          callbacks.onSystemStatusUpdate(systemStatus);
        }
      } catch (error) {
        console.error('🔄 リアルタイム更新エラー:', error);
        if (callbacks.onError) {
          callbacks.onError(error);
        }
      }
    }, interval);
  };

  const stopUpdates = () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };

  return {
    start: startUpdates,
    stop: stopUpdates,
    isRunning: () => intervalId !== null
  };
};

// ===== 拡張機能 =====

/**
 * 🚗 車両最適化提案
 */
export const getVehicleOptimizationSuggestions = async (vehicleCount) => {
  try {
    // 簡易実装
    return {
      vehicle_count: vehicleCount,
      location: '石垣島',
      recommendations: [
        '車両数に応じた最適化を実行します',
        'エリア別の効率的な配車を検討します'
      ],
      ishigaki_specific: [
        '川平湾エリアの特別対応',
        '新石垣空港への配車考慮'
      ]
    };
  } catch (error) {
    console.error('Vehicle Optimization Suggestions API Error:', error);
    return {
      vehicle_count: vehicleCount,
      location: '石垣島',
      recommendations: [],
      ishigaki_specific: []
    };
  }
};

// デフォルトエクスポート
const api = {
  // システム
  checkSystemStatus,
  getSettings,
  saveSettings,
  updateSettings,
  
  // 環境データ
  getEnvironmentalData,
  checkWeatherAPIStatus,
  
  // ルート最適化
  optimizeRoutes,
  optimizeRoute, // 別名
  
  // 統計
  getStatistics,
  
  // データ管理
  exportData,
  importData,
  exportSchedule,
  
  // リアルタイム
  setupRealTimeUpdates,
  
  // ユーティリティ
  testAPIConnection,
  getVehicleOptimizationSuggestions
};

export default api;