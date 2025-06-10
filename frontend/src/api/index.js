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

// リクエスト/レスポンスインターセプター
apiClient.interceptors.request.use(
  (config) => {
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    if (config.data) {
      console.log('📋 Request Data:', config.data);
    }
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

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

// ルート最適化API（修正版）
export const optimizeRoute = async (data) => {
  try {
    // データの検証と前処理
    const processedData = {
      // 必須フィールドの設定
      date: data.date || new Date().toISOString().split('T')[0],
      activity_type: data.activityType || 'snorkeling',
      planned_start_time: data.startTime || data.planned_start_time || '10:00',
      
      // 場所情報
      activity_lat: parseFloat(data.activityLocation?.lat || data.activity_lat || 24.4041),
      activity_lng: parseFloat(data.activityLocation?.lng || data.activity_lng || 124.1611),
      departure_lat: parseFloat(data.departureLocation?.lat || 24.3336),
      departure_lng: parseFloat(data.departureLocation?.lng || 124.1543),
      
      // ゲスト情報の処理
      guests: (data.guests || []).map(guest => ({
        name: guest.name || 'ゲスト',
        hotel_name: guest.hotel || guest.hotel_name || 'ホテル未設定',
        pickup_lat: parseFloat(guest.location?.lat || guest.pickup_lat || 24.3336),
        pickup_lng: parseFloat(guest.location?.lng || guest.pickup_lng || 124.1543),
        num_people: parseInt(guest.people || guest.num_people || 1),
        preferred_pickup_start: guest.preferredTime?.start || guest.preferred_pickup_start || '08:00',
        preferred_pickup_end: guest.preferredTime?.end || guest.preferred_pickup_end || '09:00'
      })),
      
      // 車両情報の処理
      vehicles: (data.vehicles || []).map((vehicle, index) => ({
        id: vehicle.id || `vehicle_${Date.now()}_${index}`,
        name: vehicle.name || `車両${index + 1}`,
        capacity: parseInt(vehicle.capacity || 8),
        vehicle_type: vehicle.vehicleType || vehicle.vehicle_type || 'mini_van',
        driver_name: vehicle.driver || vehicle.driver_name || 'ドライバー',
        equipment: Array.isArray(vehicle.equipment) ? vehicle.equipment : [],
        speed_factor: parseFloat(vehicle.speedFactor || vehicle.speed_factor || 1.0)
      })),
      
      // オプション設定
      weather_priority: data.weather_priority !== false,
      tide_priority: data.tide_priority !== false
    };

    console.log('📋 処理済みリクエストデータ:', JSON.stringify(processedData, null, 2));

    // 基本検証
    if (!processedData.guests || processedData.guests.length === 0) {
      throw new Error('ゲスト情報が必要です');
    }

    if (!processedData.vehicles || processedData.vehicles.length === 0) {
      throw new Error('車両情報が必要です');
    }

    // API呼び出し
    const response = await apiClient.post('/api/ishigaki/optimize', processedData);
    
    if (response.data && response.data.success) {
      console.log('✅ 最適化成功:', response.data);
      return response.data;
    } else {
      throw new Error('最適化に失敗しました');
    }
  } catch (error) {
    console.error('🚨 Route optimization error:', error);
    
    // エラーの詳細な処理
    if (error.response?.status === 422) {
      const detail = error.response.data?.detail;
      let errorMessage = '入力データにエラーがあります:\n';
      
      if (Array.isArray(detail)) {
        detail.forEach(err => {
          const field = err.loc ? err.loc.join('.') : 'unknown';
          errorMessage += `• ${field}: ${err.msg}\n`;
        });
      } else {
        errorMessage += detail || 'データ形式が正しくありません';
      }
      
      throw new Error(errorMessage);
    } else if (error.response?.status === 500) {
      throw new Error('サーバーエラーが発生しました。しばらく時間をおいて再試行してください。');
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('リクエストがタイムアウトしました。ネットワーク接続を確認してください。');
    } else if (error.code === 'ERR_NETWORK') {
      throw new Error('ネットワークエラーが発生しました。サーバーが起動しているか確認してください。');
    } else {
      throw new Error(error.message || '予期しないエラーが発生しました');
    }
  }
};

// 環境データ取得
export const getEnvironmentalData = async (date) => {
  try {
    const response = await apiClient.get(`/api/ishigaki/environmental_data/${date}`);
    return response.data;
  } catch (error) {
    console.error('🌊 Environmental data error:', error);
    
    // フォールバックデータを返す
    return {
      date: date,
      location: '石垣島',
      weather: {
        condition: 'sunny',
        temperature: 26,
        wind_speed: 4.0,
        wind_direction: 'NE',
        typhoon_risk: 0,
        precipitation: 0,
        humidity: 70,
        uv_index: 8
      },
      tide: {
        current_level: 150,
        state: 'rising',
        high_times: [
          { time: '08:30', level: 210 },
          { time: '20:45', level: 205 }
        ],
        low_times: [
          { time: '02:15', level: 45 },
          { time: '14:30', level: 50 }
        ]
      },
      sea: {
        wave_height: 0.5,
        water_temperature: 25,
        visibility: 'good',
        current_strength: 'weak'
      }
    };
  }
};

// システムステータス取得
export const getSystemStatus = async () => {
  try {
    const response = await apiClient.get('/');
    return {
      status: 'online',
      message: response.data.message,
      version: response.data.version,
      features: response.data.features || []
    };
  } catch (error) {
    console.error('🔧 System status error:', error);
    return { 
      status: 'offline', 
      message: 'API接続エラー',
      version: 'unknown',
      features: []
    };
  }
};

// 統計情報取得
export const getStatistics = async (date) => {
  try {
    const response = await apiClient.get(`/api/ishigaki/statistics`);
    return response.data;
  } catch (error) {
    console.error('📊 Statistics error:', error);
    
    // フォールバックデータ
    return {
      location: '石垣島',
      total_records: 0,
      average_delay: 0,
      prediction_accuracy: 85,
      area_statistics: [
        { area: '川平湾', pickup_count: 45, avg_delay: 2.3 },
        { area: '市街地', pickup_count: 67, avg_delay: 1.8 },
        { area: 'フサキエリア', pickup_count: 32, avg_delay: 3.1 }
      ],
      vehicle_efficiency: [
        { vehicle_type: 'mini_van', avg_efficiency: 87.5 },
        { vehicle_type: 'sedan', avg_efficiency: 82.1 }
      ]
    };
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
    console.error('📄 Export error:', error);
    throw new Error('スケジュールのエクスポートに失敗しました');
  }
};

// 記録保存
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
      activity_type: record.activityType || record.activity_type || 'snorkeling'
    };

    const response = await apiClient.post('/api/ishigaki/save_record', processedRecord);
    return response.data;
  } catch (error) {
    console.error('💾 Save record error:', error);
    throw new Error('記録の保存に失敗しました');
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
          .catch(err => { 
            console.error('Environmental data fetch error:', err);
            results.errors.push('環境データ取得失敗'); 
          })
      );
    }
    
    if (requests.statistics) {
      promises.push(
        getStatistics(requests.statistics.date)
          .then(data => { results.statistics = data; })
          .catch(err => { 
            console.error('Statistics fetch error:', err);
            results.errors.push('統計情報取得失敗'); 
          })
      );
    }
    
    if (requests.systemStatus) {
      promises.push(
        getSystemStatus()
          .then(data => { results.system = data; })
          .catch(err => { 
            console.error('System status fetch error:', err);
            results.errors.push('システムステータス取得失敗'); 
          })
      );
    }
    
    await Promise.all(promises);
  } catch (error) {
    console.error('📦 Batch fetch error:', error);
    results.errors.push('バッチ処理エラー');
  }
  
  return results;
};

// 車両最適化提案取得
export const getVehicleOptimizationSuggestions = async (vehicleCount) => {
  try {
    const response = await apiClient.get(`/api/ishigaki/vehicle_suggestions/${vehicleCount}`);
    return response.data;
  } catch (error) {
    console.error('🚗 Vehicle suggestions error:', error);
    
    // フォールバックデータ
    return {
      vehicle_count: vehicleCount,
      location: '石垣島',
      recommendations: [
        `${vehicleCount}台の車両構成での最適化を実行します`,
        'エリア別の効率的な配車を検討します',
        '石垣島の交通事情を考慮したルート設定をお勧めします'
      ],
      ishigaki_specific: [
        '川平湾エリアは観光バスが多いため時間に余裕を持ってください',
        '市街地は一方通行が多いのでルート確認をお勧めします'
      ]
    };
  }
};

// AIルート提案取得
export const getAIRouteSuggestion = async (data) => {
  try {
    const response = await apiClient.post('/api/ishigaki/ai_route_suggestion', data);
    return response.data;
  } catch (error) {
    console.error('🤖 AI route suggestion error:', error);
    
    // フォールバックデータ
    return {
      suggestions: [
        '効率的なピックアップ順序の提案',
        '交通渋滞を避けたルート設定',
        '石垣島の観光スポットを考慮した経路'
      ],
      confidence: 0.75,
      alternative_routes: []
    };
  }
};

// エラーハンドリングユーティリティ
export const handleApiError = (error) => {
  let message = '予期しないエラーが発生しました';
  const status = error.response?.status;
  
  if (status === 400) {
    message = '入力データが正しくありません';
  } else if (status === 401) {
    message = '認証が必要です';
  } else if (status === 403) {
    message = 'アクセス権限がありません';
  } else if (status === 404) {
    message = '要求されたリソースが見つかりません';
  } else if (status === 422) {
    const detail = error.response?.data?.detail;
    if (Array.isArray(detail)) {
      message = '入力データエラー: ' + detail.map(err => err.msg).join(', ');
    } else {
      message = detail || '入力データが正しくありません';
    }
  } else if (status === 429) {
    message = 'リクエストが多すぎます。しばらくしてから再試行してください';
  } else if (status === 500) {
    message = 'サーバー内部エラーが発生しました';
  } else if (status === 503) {
    message = 'サービスが一時的に利用できません';
  } else if (error.code === 'ECONNABORTED') {
    message = 'リクエストがタイムアウトしました';
  } else if (error.code === 'NETWORK_ERROR') {
    message = 'ネットワークエラーが発生しました';
  }
  
  return message;
};

// ヘルスチェック
export const healthCheck = async () => {
  try {
    const response = await apiClient.get('/');
    return {
      status: 'healthy',
      message: response.data.message,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

// API設定取得
export const getApiConfig = () => {
  return {
    baseURL: API_BASE_URL,
    timeout: apiClient.defaults.timeout,
    headers: apiClient.defaults.headers
  };
};

// 石垣島専用の最適化API（メイン関数）
export const optimizeIshigakiTour = async (tourData) => {
  try {
    // アクティビティロケーションの検証
    if (!tourData.activityLocation || !tourData.activityLocation.lat || !tourData.activityLocation.lng) {
      throw new Error('アクティビティの場所が設定されていません');
    }

    // ゲストリストの検証
    if (!tourData.guests || tourData.guests.length === 0) {
      throw new Error('ゲストが登録されていません');
    }

    // 車両リストの検証
    if (!tourData.vehicles || tourData.vehicles.length === 0) {
      throw new Error('車両が登録されていません');
    }

    // startTimeのデフォルト値設定（nullの場合）
    const startTime = tourData.startTime || tourData.planned_start_time || '10:00';

    const requestData = {
      date: tourData.date || new Date().toISOString().split('T')[0],
      activity_type: tourData.activityType || 'snorkeling',
      activity_lat: parseFloat(tourData.activityLocation.lat),
      activity_lng: parseFloat(tourData.activityLocation.lng),
      planned_start_time: startTime,
      departure_lat: parseFloat(tourData.departureLocation?.lat || 24.3336),
      departure_lng: parseFloat(tourData.departureLocation?.lng || 124.1543),
      guests: tourData.guests.map(guest => ({
        name: guest.name || 'ゲスト',
        hotel_name: guest.hotel || guest.hotel_name || 'ホテル未設定',
        pickup_lat: parseFloat(guest.location?.lat || guest.pickup_lat || 24.3336),
        pickup_lng: parseFloat(guest.location?.lng || guest.pickup_lng || 124.1543),
        num_people: parseInt(guest.people || guest.num_people || 1),
        preferred_pickup_start: guest.preferredTime?.start || guest.preferred_pickup_start || '08:00',
        preferred_pickup_end: guest.preferredTime?.end || guest.preferred_pickup_end || '09:00'
      })),
      vehicles: tourData.vehicles.map((vehicle, index) => ({
        id: vehicle.id || `vehicle_${Date.now()}_${index}`,
        name: vehicle.name || `車両${index + 1}`,
        capacity: parseInt(vehicle.capacity || 8),
        vehicle_type: vehicle.vehicleType || vehicle.vehicle_type || 'mini_van',
        driver_name: vehicle.driver || vehicle.driver_name || 'ドライバー',
        equipment: Array.isArray(vehicle.equipment) ? vehicle.equipment : [],
        speed_factor: parseFloat(vehicle.speedFactor || vehicle.speed_factor || 1.0)
      })),
      weather_priority: tourData.weatherPriority !== false,
      tide_priority: tourData.tidePriority !== false
    };

    console.log('Sending optimization request:', requestData);

    const response = await apiClient.post('/api/ishigaki/optimize', requestData);
    
    return response.data;
  } catch (error) {
    console.error('石垣島最適化API Error:', error);
    
    // より詳細なエラーメッセージ
    if (error.response?.status === 422) {
      const detail = error.response.data?.detail;
      if (Array.isArray(detail)) {
        const fieldErrors = detail.map(err => `${err.loc.join('.')}: ${err.msg}`).join(', ');
        throw new Error(`入力データエラー: ${fieldErrors}`);
      } else {
        throw new Error(`入力データエラー: ${detail || 'データ形式が正しくありません'}`);
      }
    }
    
    throw new Error(`最適化エラー: ${error.response?.data?.detail || error.message}`);
  }
};

// 石垣島の環境データ取得
export const getIshigakiEnvironmentalData = async (date) => {
  try {
    const response = await apiClient.get(`/api/ishigaki/environmental_data/${date}`);
    return response.data;
  } catch (error) {
    console.error('石垣島環境データAPI Error:', error);
    
    // フォールバックデータ
    return {
      date: date,
      location: '石垣島',
      weather: {
        condition: 'sunny',
        temperature: 26,
        wind_speed: 4.0,
        typhoon_risk: 0,
        precipitation: 0,
        humidity: 70
      },
      tide: {
        current_level: 150,
        state: 'rising',
        high_times: [
          { time: '08:30', level: 210 },
          { time: '20:45', level: 205 }
        ],
        low_times: [
          { time: '02:15', level: 45 },
          { time: '14:30', level: 50 }
        ]
      },
      sea: {
        wave_height: 0.5,
        water_temperature: 25,
        visibility: 'good',
        current_strength: 'weak'
      }
    };
  }
};

// 石垣島の統計データ取得
export const getIshigakiStatistics = async () => {
  try {
    const response = await apiClient.get('/api/ishigaki/statistics');
    return response.data;
  } catch (error) {
    console.error('石垣島統計API Error:', error);
    
    // フォールバックデータ
    return {
      location: '石垣島',
      total_records: 0,
      average_delay: 0,
      prediction_accuracy: 85,
      area_statistics: [],
      vehicle_efficiency: []
    };
  }
};

// システムステータスチェック
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
    console.error('System Status Error:', error);
    return {
      status: 'offline',
      version: 'unknown',
      message: 'システムに接続できません',
      features: []
    };
  }
};

// 実績データ保存
export const saveIshigakiRecord = async (record) => {
  try {
    const response = await apiClient.post('/api/ishigaki/save_record', {
      tour_date: record.tourDate,
      planned_time: record.plannedTime,
      actual_time: record.actualTime,
      guest_name: record.guestName,
      hotel_name: record.hotelName,
      delay_minutes: record.delayMinutes,
      distance_km: record.distanceKm,
      weather: record.weather,
      tide_level: record.tideLevel,
      vehicle_id: record.vehicleId,
      driver_name: record.driverName,
      activity_type: record.activityType,
      guest_satisfaction: record.guestSatisfaction || null,
      notes: record.notes || null
    });
    return response.data;
  } catch (error) {
    console.error('石垣島実績保存API Error:', error);
    throw error;
  }
};

// モデル学習
export const trainIshigakiModel = async () => {
  try {
    const response = await apiClient.get('/api/ishigaki/train_model');
    return response.data;
  } catch (error) {
    console.error('石垣島モデル学習API Error:', error);
    throw error;
  }
};

// バッチデータ取得（改良版）
export const getBatchData = async (date) => {
  try {
    // 個別にAPIを呼び出し、エラーが発生してもデフォルト値を返す
    const [environmental, statistics, system] = await Promise.allSettled([
      getIshigakiEnvironmentalData(date),
      getIshigakiStatistics(),
      checkSystemStatus()
    ]);

    return {
      environmental: environmental.status === 'fulfilled' ? environmental.value : null,
      statistics: statistics.status === 'fulfilled' ? statistics.value : null,
      system: system.status === 'fulfilled' ? system.value : null,
      errors: []
    };
  } catch (error) {
    console.error('バッチデータ取得Error:', error);
    return {
      environmental: null,
      statistics: null,
      system: null,
      errors: ['batch_data_error']
    };
  }
};

// 車両最適化提案の取得
export const getVehicleOptimization = async (tourId, vehicleCount) => {
  return getVehicleOptimizationSuggestions(vehicleCount);
};

// モデル訓練
export const trainModel = async () => {
  return trainIshigakiModel();
};

// デフォルトエクスポート
export default {
  optimizeRoute,
  optimizeIshigakiTour,
  getEnvironmentalData,
  getIshigakiEnvironmentalData,
  getSystemStatus,
  checkSystemStatus,
  getStatistics,
  getIshigakiStatistics,
  exportSchedule,
  saveRecord,
  saveIshigakiRecord,
  batchDataFetch,
  getBatchData,
  getVehicleOptimizationSuggestions,
  getVehicleOptimization,
  getAIRouteSuggestion,
  trainIshigakiModel,
  trainModel,
  handleApiError,
  healthCheck,
  getApiConfig
};

// 従来のAPIとの互換性（廃止予定）
// 警告メッセージと共に従来のAPIを提供
console.warn('⚠️  一部の関数は廃止予定です。新しいAPIの使用をお勧めします。');

// 後方互換性のためのエイリアス
export { optimizeIshigakiTour as optimizeRoute_DEPRECATED };
export { getIshigakiEnvironmentalData as getEnvironmentalData_DEPRECATED };
export { getIshigakiStatistics as getStatistics_DEPRECATED };
export { saveIshigakiRecord as saveRecord_DEPRECATED };