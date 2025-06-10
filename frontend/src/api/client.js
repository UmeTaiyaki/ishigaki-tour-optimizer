// client.js - 石垣島ツアー管理API クライアント v2.0 エラー修正版
import axios from 'axios';
import weatherService from '../services/WeatherService';

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
    console.log('🔄 ルート最適化開始...', tourRequest);
    
    // バリデーション
    if (!tourRequest.guests || tourRequest.guests.length === 0) {
      throw new Error('ゲスト情報が設定されていません');
    }
    
    if (!tourRequest.vehicles || tourRequest.vehicles.length === 0) {
      throw new Error('車両情報が設定されていません');
    }

    if (!tourRequest.activityLocation) {
      throw new Error('アクティビティ地点が設定されていません');
    }

    // リクエストデータ整形
    const optimizationRequest = {
      date: tourRequest.date || new Date().toISOString().split('T')[0],
      activity_type: tourRequest.activityType || 'シュノーケリング',
      activity_lat: tourRequest.activityLocation.lat,
      activity_lng: tourRequest.activityLocation.lng,
      planned_start_time: tourRequest.startTime || '10:00',
      departure_lat: tourRequest.departureLocation?.lat || 24.3336,
      departure_lng: tourRequest.departureLocation?.lng || 124.1543,
      guests: tourRequest.guests.map(guest => ({
        id: guest.id,
        name: guest.name,
        hotel_name: guest.hotel,
        pickup_lat: guest.location.lat,
        pickup_lng: guest.location.lng,
        num_people: guest.people,
        preferred_pickup_start: guest.preferredTime?.start || '09:00',
        preferred_pickup_end: guest.preferredTime?.end || '10:00',
        contact: guest.contact || null,
        special_needs: guest.notes || null
      })),
      vehicles: tourRequest.vehicles.map(vehicle => ({
        id: vehicle.id,
        name: vehicle.name,
        capacity: vehicle.capacity,
        driver: vehicle.driver,
        location_lat: vehicle.location.lat,
        location_lng: vehicle.location.lng,
        fuel_efficiency: vehicle.fuel_efficiency || 10.0
      })),
      max_detour_time: tourRequest.max_detour_time || 30,
      priority_efficiency: tourRequest.priority_efficiency !== false
    };

    const response = await apiClient.post('/api/ishigaki/optimize', optimizationRequest);
    
    return {
      success: true,
      routes: response.data.routes || [],
      total_distance: response.data.total_distance || 0,
      total_time: response.data.total_time || 0,
      optimization_time: response.data.optimization_time || 0,
      suggestions: response.data.suggestions || [],
      ...response.data
    };
    
  } catch (error) {
    console.error('❌ ルート最適化エラー:', error);
    return handleApiError(error, {
      success: false,
      routes: [],
      total_distance: 0,
      total_time: 0,
      optimization_time: 0,
      suggestions: ['最適化に失敗しました。入力データを確認してください。'],
      error: error.message
    });
  }
};

// ===== 環境データ =====

/**
 * 🌤️ 環境データ取得（WeatherService統合版）
 * @param {string} date - 対象日付 (YYYY-MM-DD)
 */
export const getEnvironmentalData = async (date = null) => {
  try {
    const targetDate = date || new Date().toISOString().split('T')[0];
    console.log(`🌤️ 環境データ取得: ${targetDate}`);
    
    // まずWeatherServiceから詳細な気象データを取得
    const weatherData = await weatherService.getWeatherData(targetDate);
    
    // バックエンドAPIからの追加データも試行
    let backendData = null;
    try {
      const response = await apiClient.get(`/api/ishigaki/environmental?date=${targetDate}`);
      backendData = response.data;
    } catch (error) {
      console.warn('⚠️ バックエンド環境データ取得失敗（WeatherServiceデータを使用）:', error.message);
    }
    
    // データ統合
    const combinedData = {
      date: targetDate,
      location: '石垣島',
      
      // 気象情報（WeatherServiceからの高精度データ）
      weather: weatherData.weather,
      temperature: weatherData.temperature,
      wind_speed: weatherData.wind_speed,
      humidity: weatherData.humidity || 75,
      visibility: weatherData.visibility,
      conditions: weatherData.conditions || ['normal'],
      
      // 海洋情報
      tide_level: weatherData.tide_level || 150,
      sea_conditions: weatherData.sea_conditions || {
        state: '普通',
        wave_height: '0.5-1.0m'
      },
      
      // 観光情報
      tourism_advisory: weatherData.tourism_advisory || [],
      activity_recommendations: weatherData.activity_recommendations || [],
      
      // データ品質情報
      source: weatherData.source || 'weather_service',
      sources: weatherData.sources || [weatherData.source],
      reliability: weatherData.reliability || 'high',
      data_quality: weatherData.data_quality || 'real-time',
      
      // バックエンドからの補足データ（あれば）
      ...(backendData || {}),
      
      last_updated: new Date().toISOString()
    };
    
    console.log('✅ 環境データ統合完了:', combinedData);
    return combinedData;
    
  } catch (error) {
    console.error('❌ 環境データ取得エラー:', error);
    
    // フォールバック：石垣島の典型的な気象条件
    return handleApiError(error, {
      date: date || new Date().toISOString().split('T')[0],
      location: '石垣島',
      weather: '晴れ',
      temperature: 25,
      wind_speed: 15,
      humidity: 75,
      visibility: 'good',
      conditions: ['normal'],
      tide_level: 150,
      sea_conditions: {
        state: '普通',
        wave_height: '0.5-1.0m'
      },
      tourism_advisory: ['石垣島の美しい自然をお楽しみください'],
      activity_recommendations: ['シュノーケリング', '観光ドライブ'],
      source: 'fallback',
      reliability: 'estimated',
      data_quality: 'fallback',
      last_updated: new Date().toISOString(),
      note: 'ネットワークエラーのため推定値を表示しています'
    }, false);
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

// ===== 統計データ =====

/**
 * 統計データ取得
 */
export const getStatistics = async () => {
  try {
    const response = await apiClient.get('/api/ishigaki/statistics');
    return {
      success: true,
      ...response.data,
      last_updated: new Date().toISOString()
    };
  } catch (error) {
    return handleApiError(error, {
      success: true,
      daily_tours: 0,
      total_guests: 0,
      vehicle_utilization: 0,
      average_efficiency: 0,
      total_distance: 0,
      fuel_consumption: 0,
      customer_satisfaction: 0,
      on_time_performance: 0,
      popular_destinations: [],
      last_updated: new Date().toISOString(),
      note: 'データを取得できませんでした'
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
 * @param {string} format - エクスポート形式
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
      weather_integration: true, // 新機能
      google_maps: true, // Google Maps統合
      statistics: true,
      export: true
    },
    weather_apis: {
      jma: { active: true, free: true, name: '気象庁API' },
      open_meteo: { active: true, free: true, name: 'Open-Meteo' },
      weather_api: { 
        active: !!process.env.REACT_APP_WEATHERAPI_KEY, 
        free: true, 
        name: 'WeatherAPI',
        limit: '1M requests/month'
      }
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
  checkWeatherAPIStatus, // 新機能
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