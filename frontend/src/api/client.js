// client.js - 石垣島ツアー管理API クライアント v2.0 完全版
import axios from 'axios';

// API設定
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const API_TIMEOUT = 30000;

// APIクライアントインスタンス作成
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// リクエストインターセプター（送信前処理）
apiClient.interceptors.request.use(
  (config) => {
    // リクエストログ（開発時のみ）
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// レスポンスインターセプター（受信後処理）
apiClient.interceptors.response.use(
  (response) => {
    // レスポンスログ（開発時のみ）
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
    }
    return response;
  },
  (error) => {
    // エラーログ
    const errorMessage = error.response?.data?.detail || error.message || 'Unknown error';
    console.error(`❌ API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`, errorMessage);
    
    // ネットワークエラーの場合
    if (error.code === 'ECONNABORTED') {
      console.error('API Timeout: Request took too long');
    }
    
    return Promise.reject(error);
  }
);

// エラーハンドリング共通関数
const handleApiError = (error, fallbackData = null, showConsoleError = true) => {
  if (showConsoleError) {
    console.error('API Error handled:', error);
  }
  
  const errorInfo = {
    message: error.response?.data?.detail || error.message || 'API通信エラー',
    status: error.response?.status || 0,
    code: error.code || 'UNKNOWN_ERROR'
  };
  
  if (fallbackData !== null) {
    return { ...fallbackData, error: errorInfo };
  }
  
  throw errorInfo;
};

// ===== ヘルスチェック・システム監視 =====

/**
 * システムヘルスチェック
 */
export const healthCheck = async () => {
  try {
    const response = await apiClient.get('/health');
    return {
      status: 'online',
      timestamp: new Date().toISOString(),
      ...response.data
    };
  } catch (error) {
    return handleApiError(error, {
      status: 'offline',
      error: error.message,
      timestamp: new Date().toISOString()
    }, false);
  }
};

/**
 * システムステータス取得
 */
export const getSystemStatus = async () => {
  try {
    const response = await apiClient.get('/api/ishigaki/status');
    return {
      status: 'online',
      ...response.data,
      last_checked: new Date().toISOString()
    };
  } catch (error) {
    return handleApiError(error, {
      status: 'offline',
      database: 'disconnected',
      api_version: '2.0.0',
      last_checked: new Date().toISOString(),
      error: error.message
    }, false);
  }
};

// ===== ルート最適化 =====

/**
 * ルート最適化実行
 * @param {Object} tourRequest - ツアーリクエストデータ
 */
export const optimizeRoute = async (tourRequest) => {
  try {
    // リクエストデータの検証
    if (!tourRequest.guests || tourRequest.guests.length === 0) {
      throw new Error('ゲスト情報が必要です');
    }
    
    if (!tourRequest.vehicles || tourRequest.vehicles.length === 0) {
      throw new Error('車両情報が必要です');
    }

    // APIリクエスト用にデータ変換
    const apiRequest = {
      date: tourRequest.date,
      activity_type: tourRequest.activityType || 'シュノーケリング',
      activity_lat: 24.3336, // 石垣島のデフォルト座標
      activity_lng: 124.1543,
      planned_start_time: tourRequest.startTime || '09:00',
      guests: tourRequest.guests.map(guest => ({
        name: guest.name || '',
        hotel_name: guest.hotel_name || guest.hotelName || '',
        pickup_lat: parseFloat(guest.pickup_lat || guest.lat || 24.3336),
        pickup_lng: parseFloat(guest.pickup_lng || guest.lng || 124.1543),
        num_people: parseInt(guest.people || guest.num_people || 1),
        preferred_pickup_start: guest.preferred_pickup_start || '08:30',
        preferred_pickup_end: guest.preferred_pickup_end || '09:00'
      })),
      vehicles: tourRequest.vehicles.map(vehicle => ({
        id: vehicle.id || `vehicle_${Date.now()}`,
        name: vehicle.name || '',
        capacity: parseInt(vehicle.capacity || 8),
        vehicle_type: vehicle.vehicleType || vehicle.vehicle_type || 'mini_van',
        driver_name: vehicle.driver || vehicle.driver_name || 'Unknown',
        equipment: Array.isArray(vehicle.equipment) ? vehicle.equipment : [],
        speed_factor: parseFloat(vehicle.speed_factor || 1.0)
      })),
      weather_priority: true,
      tide_priority: true
    };

    const response = await apiClient.post('/api/ishigaki/optimize', apiRequest);
    
    return {
      success: true,
      routes: response.data.routes || [],
      summary: response.data.summary || {},
      optimization_time: response.data.optimization_time || 0,
      recommendations: response.data.recommendations || [],
      ...response.data
    };
  } catch (error) {
    return handleApiError(error, {
      success: false,
      routes: [],
      message: 'ルート最適化に失敗しました',
      error: error.message
    });
  }
};

// ===== 環境データ =====

/**
 * 環境データ取得
 * @param {string} date - 対象日付 (YYYY-MM-DD)
 */
export const getEnvironmentalData = async (date = null) => {
  try {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const response = await apiClient.get(`/api/ishigaki/environmental_data?date=${targetDate}`);
    
    return {
      date: targetDate,
      weather: '晴れ',
      temperature: 25,
      wind_speed: 15,
      tide_level: 1.2,
      visibility: 'good',
      conditions: ['normal'],
      ...response.data,
      last_updated: new Date().toISOString()
    };
  } catch (error) {
    // フォールバックデータ（石垣島の一般的な気象条件）
    return handleApiError(error, {
      date: date || new Date().toISOString().split('T')[0],
      weather: '晴れ',
      temperature: 25,
      wind_speed: 15,
      tide_level: 1.2,
      visibility: 'good',
      conditions: ['normal'],
      last_updated: new Date().toISOString(),
      source: 'fallback'
    }, false);
  }
};

// ===== 統計情報 =====

/**
 * 統計情報取得
 */
export const getStatistics = async () => {
  try {
    const response = await apiClient.get('/api/ishigaki/statistics');
    
    return {
      total_records: 0,
      average_delay: 0,
      prediction_accuracy: 85,
      area_statistics: [],
      vehicle_efficiency: [],
      ...response.data,
      generated_at: new Date().toISOString()
    };
  } catch (error) {
    // フォールバック統計データ
    return handleApiError(error, {
      total_records: 0,
      average_delay: 0,
      prediction_accuracy: 85,
      area_statistics: [
        { area: '川平湾', pickup_count: 45, avg_delay: 2.3, avg_distance: 12.5 },
        { area: '市街地', pickup_count: 67, avg_delay: 1.8, avg_distance: 8.2 },
        { area: 'フサキエリア', pickup_count: 32, avg_delay: 3.1, avg_distance: 15.7 },
        { area: 'ANAエリア', pickup_count: 28, avg_delay: 2.0, avg_distance: 10.3 }
      ],
      vehicle_efficiency: [
        { vehicle_type: 'mini_van', avg_efficiency: 87.5, count: 15 },
        { vehicle_type: 'sedan', avg_efficiency: 82.1, count: 8 },
        { vehicle_type: 'bus', avg_efficiency: 91.2, count: 3 }
      ],
      generated_at: new Date().toISOString(),
      source: 'fallback'
    }, false);
  }
};

// ===== 実績記録 =====

/**
 * 実績記録保存
 * @param {Object} record - 実績記録データ
 */
export const saveRecord = async (record) => {
  try {
    // データ検証
    if (!record.tour_date && !record.tourDate) {
      throw new Error('ツアー日付が必要です');
    }
    
    if (!record.guest_name && !record.guestName) {
      throw new Error('ゲスト名が必要です');
    }

    const processedRecord = {
      tour_date: record.tourDate || record.tour_date,
      planned_time: record.plannedTime || record.planned_time,
      actual_time: record.actualTime || record.actual_time,
      guest_name: record.guestName || record.guest_name,
      hotel_name: record.hotelName || record.hotel_name,
      delay_minutes: parseInt(record.delayMinutes || record.delay_minutes || 0),
      distance_km: parseFloat(record.distanceKm || record.distance_km || 0),
      weather: record.weather || 'unknown',
      tide_level: parseFloat(record.tideLevel || record.tide_level || 0),
      vehicle_id: record.vehicleId || record.vehicle_id,
      driver_name: record.driverName || record.driver_name,
      activity_type: record.activityType || record.activity_type || 'snorkeling',
      guest_satisfaction: record.guestSatisfaction || null,
      notes: record.notes || null
    };

    const response = await apiClient.post('/api/ishigaki/save_record', processedRecord);
    
    return {
      success: true,
      record_id: response.data.record_id,
      message: '実績記録を保存しました',
      ...response.data
    };
  } catch (error) {
    throw handleApiError(error);
  }
};

// ===== エクスポート機能 =====

/**
 * スケジュールエクスポート
 * @param {Array} routes - ルートデータ
 * @param {string} format - エクスポート形式 ('pdf', 'excel', 'csv')
 */
export const exportSchedule = async (routes, format = 'pdf') => {
  try {
    const response = await apiClient.post('/api/ishigaki/export', {
      routes: routes || [],
      format,
      timestamp: new Date().toISOString()
    }, {
      responseType: format === 'pdf' ? 'blob' : 'json'
    });

    if (format === 'pdf') {
      // PDFファイルのダウンロード処理
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `schedule_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }

    return {
      success: true,
      format,
      message: `${format.toUpperCase()}ファイルをエクスポートしました`
    };
  } catch (error) {
    throw handleApiError(error);
  }
};

// ===== AI機能 =====

/**
 * AIルート提案取得
 * @param {number} guestCount - ゲスト数
 * @param {number} vehicleCount - 車両数
 */
export const getAIRouteSuggestion = async (guestCount, vehicleCount) => {
  try {
    const response = await apiClient.post('/api/ishigaki/ai_suggestion', {
      guest_count: parseInt(guestCount || 0),
      vehicle_count: parseInt(vehicleCount || 0),
      request_time: new Date().toISOString()
    });
    
    return {
      suggestions: [],
      confidence: 0,
      recommendations: [],
      ...response.data
    };
  } catch (error) {
    return handleApiError(error, {
      suggestions: [
        {
          title: '効率的なルート配置',
          description: 'エリア別にグループ化して移動距離を最小化',
          confidence: 75
        },
        {
          title: '時間帯の最適化',
          description: '交通量を考慮した出発時刻の調整',
          confidence: 80
        }
      ],
      confidence: 75,
      recommendations: ['ゲストをエリア別にグループ化してください'],
      message: 'AI提案を取得できませんでした（フォールバック）'
    }, false);
  }
};

/**
 * 車両最適化提案
 * @param {number} vehicleCount - 必要車両数
 */
export const getVehicleOptimization = async (vehicleCount) => {
  try {
    const response = await apiClient.get(`/api/ishigaki/vehicle_optimization?count=${vehicleCount}`);
    
    return {
      recommended_vehicles: [],
      efficiency_score: 0,
      cost_analysis: {},
      ...response.data
    };
  } catch (error) {
    return handleApiError(error, {
      recommended_vehicles: [
        { type: 'mini_van', count: Math.ceil(vehicleCount * 0.7), reason: '汎用性が高い' },
        { type: 'sedan', count: Math.ceil(vehicleCount * 0.3), reason: '小グループ向け' }
      ],
      efficiency_score: 85,
      cost_analysis: {
        fuel_cost: vehicleCount * 3000,
        time_efficiency: 'good'
      },
      message: '車両最適化提案を取得できませんでした（フォールバック）'
    }, false);
  }
};

/**
 * 機械学習モデル訓練
 */
export const trainModel = async () => {
  try {
    const response = await apiClient.post('/api/ishigaki/train_model', {
      training_request_time: new Date().toISOString()
    });
    
    return {
      success: true,
      training_complete: true,
      accuracy: 0,
      ...response.data
    };
  } catch (error) {
    throw handleApiError(error);
  }
};

// ===== 設定管理 =====

/**
 * 設定取得
 */
export const getSettings = async () => {
  try {
    const response = await apiClient.get('/api/ishigaki/settings');
    return response.data;
  } catch (error) {
    return handleApiError(error, {
      default_pickup_duration: 15,
      default_activity_duration: 180,
      max_delay_tolerance: 30,
      notification_enabled: true,
      auto_optimization: false,
      weather_integration: true
    }, false);
  }
};

/**
 * 設定更新
 * @param {Object} settings - 設定データ
 */
export const updateSettings = async (settings) => {
  try {
    const response = await apiClient.put('/api/ishigaki/settings', settings);
    return {
      success: true,
      message: '設定を更新しました',
      ...response.data
    };
  } catch (error) {
    throw handleApiError(error);
  }
};

// ===== バッチ処理 =====

/**
 * バッチデータ取得（複数APIの一括取得）
 * @param {string} date - 対象日付
 */
export const getBatchData = async (date) => {
  try {
    const [environmental, statistics, system] = await Promise.allSettled([
      getEnvironmentalData(date),
      getStatistics(),
      getSystemStatus()
    ]);

    return {
      environmental: environmental.status === 'fulfilled' ? environmental.value : null,
      statistics: statistics.status === 'fulfilled' ? statistics.value : null,
      system: system.status === 'fulfilled' ? system.value : null,
      timestamp: new Date().toISOString(),
      success_count: [environmental, statistics, system].filter(p => p.status === 'fulfilled').length,
      errors: [environmental, statistics, system]
        .filter(p => p.status === 'rejected')
        .map(p => p.reason?.message || 'Unknown error')
    };
  } catch (error) {
    return handleApiError(error, {
      environmental: null,
      statistics: null,
      system: null,
      timestamp: new Date().toISOString(),
      success_count: 0,
      errors: ['batch_data_error']
    }, false);
  }
};

// ===== API設定情報 =====

/**
 * API設定情報取得
 */
export const getApiConfig = () => {
  return {
    baseURL: API_BASE_URL,
    timeout: API_TIMEOUT,
    version: '2.0.0',
    environment: process.env.NODE_ENV,
    features: {
      optimization: true,
      ai_suggestions: true,
      environmental_data: true,
      statistics: true,
      export: true
    }
  };
};

// デフォルトエクスポート（メイン関数群）
export default {
  // システム
  healthCheck,
  getSystemStatus,
  
  // コア機能
  optimizeRoute,
  getEnvironmentalData,
  getStatistics,
  saveRecord,
  exportSchedule,
  
  // AI機能
  getAIRouteSuggestion,
  getVehicleOptimization,
  trainModel,
  
  // 設定
  getSettings,
  updateSettings,
  
  // バッチ
  getBatchData,
  
  // ユーティリティ
  getApiConfig,
  handleApiError
};

// 名前付きエクスポート（個別関数）
export {
  // 後方互換性のためのエイリアス
  optimizeRoute as optimizeIshigakiTour,
  getEnvironmentalData as getIshigakiEnvironmentalData,
  getStatistics as getIshigakiStatistics,
  saveRecord as saveIshigakiRecord,
  getSystemStatus as checkSystemStatus
};