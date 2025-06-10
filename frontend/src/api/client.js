/**
 * 🌤️ frontend/src/api/client.js - エラー修正版
 * APIクライアント - エクスポートエラー解決
 */

import axios from 'axios';
import weatherService from '../services/WeatherService';

// APIクライアント設定
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
const API_TIMEOUT = 30000; // 30秒

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// リクエストインターセプター
apiClient.interceptors.request.use(
  (config) => {
    console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// レスポンスインターセプター
apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ API Response Error:', error.response?.status, error.response?.data);
    return Promise.reject(error);
  }
);

/**
 * 🔧 エラーハンドリングヘルパー
 */
const handleApiError = (error, fallbackData = null, silent = false) => {
  const errorInfo = {
    message: error.message || 'APIエラーが発生しました',
    status: error.response?.status || 0,
    data: error.response?.data || null,
    timestamp: new Date().toISOString()
  };

  if (!silent) {
    console.error('🚨 API Error Details:', errorInfo);
  }

  if (fallbackData) {
    console.warn('📝 フォールバックデータを使用します:', fallbackData);
    return {
      success: false,
      error: errorInfo,
      data: fallbackData,
      isFallback: true
    };
  }

  throw errorInfo;
};

// ===== システム関連API =====

/**
 * 🔧 システム状態取得
 */
export const getSystemStatus = async () => {
  try {
    const response = await apiClient.get('/health');
    return {
      success: true,
      status: 'online',
      version: response.data.version || '2.1.0',
      ...response.data
    };
  } catch (error) {
    console.error('❌ システム状態取得エラー:', error);
    return {
      success: false,
      status: 'offline',
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

// ===== 環境データAPI =====

/**
 * 🌤️ 環境データ取得
 */
export const getEnvironmentalData = async (date = null) => {
  try {
    const targetDate = date || new Date().toISOString().split('T')[0];
    console.log(`🌤️ 環境データ取得: ${targetDate}`);
    
    // WeatherServiceから取得
    const weatherData = await weatherService.getWeatherData(targetDate);
    
    return {
      success: true,
      data: weatherData,
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
    const status = await weatherService.checkAPIStatus();
    return {
      success: true,
      api_status: status,
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

    const optimizationRequest = {
      date: tourRequest.date,
      activity_type: tourRequest.activityType,
      start_time: tourRequest.startTime,
      guests: tourRequest.guests.map(guest => ({
        id: guest.id,
        name: guest.name,
        hotel_name: guest.hotelName,
        pickup_lat: guest.location.lat,
        pickup_lng: guest.location.lng,
        num_people: guest.people,
        preferred_pickup_start: guest.timeWindow?.start || '09:00',
        preferred_pickup_end: guest.timeWindow?.end || '10:00'
      })),
      vehicles: tourRequest.vehicles.map(vehicle => ({
        id: vehicle.id,
        name: vehicle.name,
        capacity: vehicle.capacity,
        driver: vehicle.driver,
        location: {
          lat: vehicle.location.lat,
          lng: vehicle.location.lng
        }
      }))
    };

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

// ===== 統計データAPI =====

/**
 * 📊 統計データ取得
 */
export const getStatistics = async () => {
  try {
    const response = await apiClient.get('/api/ishigaki/statistics');
    return {
      success: true,
      statistics: response.data.statistics
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
    const response = await apiClient.get('/api/ishigaki/export', {
      params: { format },
      responseType: 'blob'
    });

    return {
      success: true,
      data: response.data,
      filename: `ishigaki_tour_export_${new Date().toISOString().split('T')[0]}.${format}`
    };
  } catch (error) {
    console.error('❌ データエクスポートエラー:', error);
    throw error;
  }
};

/**
 * 📤 データインポート
 */
export const importData = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post('/api/ishigaki/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    return {
      success: true,
      imported_records: response.data.imported_records || 0
    };
  } catch (error) {
    console.error('❌ データインポートエラー:', error);
    throw error;
  }
};

// ===== 設定更新API =====

/**
 * ⚙️ 設定更新（App.jsで使用される関数）
 */
export const updateSettings = async (newSettings) => {
  return await saveSettings(newSettings);
};

// ===== スケジュールエクスポート =====

/**
 * 📋 スケジュールエクスポート（App.jsで使用される関数）
 */
export const exportSchedule = async (scheduleData, format = 'pdf') => {
  try {
    if (format === 'pdf') {
      // PDF生成は別途処理
      return {
        success: true,
        message: 'PDF生成機能は別途実装してください'
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

// ===== ルート最適化（App.jsで使用される関数名） =====

/**
 * 🚗 ルート最適化（別名エクスポート）
 */
export const optimizeRoute = optimizeRoutes;

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
          const systemStatus = await getSystemStatus();
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

// デフォルトエクスポート
const api = {
  // システム
  getSystemStatus,
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
  testAPIConnection
};

export default api;