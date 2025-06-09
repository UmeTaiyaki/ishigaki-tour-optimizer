import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// リクエスト/レスポンスインターセプター
api.interceptors.request.use(
  (config) => {
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    if (config.data) {
      console.log('Request Data:', config.data);
    }
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.status, error.response?.data);
    return Promise.reject(error);
  }
);

// 石垣島専用の最適化API
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
    const startTime = tourData.startTime || '10:00';

    const requestData = {
      date: tourData.date,
      activity_type: tourData.activityType,
      activity_lat: tourData.activityLocation.lat,
      activity_lng: tourData.activityLocation.lng,
      planned_start_time: startTime,
      departure_lat: tourData.departureLocation?.lat || 24.3336,
      departure_lng: tourData.departureLocation?.lng || 124.1543,
      guests: tourData.guests.map(guest => ({
        name: guest.name,
        hotel_name: guest.hotel,
        pickup_lat: guest.location.lat,
        pickup_lng: guest.location.lng,
        num_people: guest.people,
        preferred_pickup_start: guest.preferredTime.start,
        preferred_pickup_end: guest.preferredTime.end,
        special_needs: guest.specialNeeds || null,
        guest_type: guest.guestType || 'general'
      })),
      vehicles: tourData.vehicles.map(vehicle => ({
        id: vehicle.id,
        name: vehicle.name,
        capacity: vehicle.capacity,
        vehicle_type: vehicle.vehicleType || 'mini_van',
        driver_name: vehicle.driver,
        equipment: vehicle.equipment || [],
        speed_factor: vehicle.speedFactor || 1.0
      })),
      weather_priority: tourData.weatherPriority !== false,
      tide_priority: tourData.tidePriority !== false
    };

    console.log('Sending optimization request:', requestData);

    const response = await api.post('/api/ishigaki/optimize', requestData);
    
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
    const response = await api.get(`/api/ishigaki/environmental_data/${date}`);
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
    const response = await api.get('/api/ishigaki/stats');
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
    const response = await api.get('/');
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

// 車両最適化提案の取得
export const getVehicleOptimizationSuggestions = async (vehicleCount) => {
  try {
    const response = await api.get(`/api/ishigaki/vehicle_optimization/${vehicleCount}`);
    return response.data;
  } catch (error) {
    console.error('Vehicle Optimization Suggestions API Error:', error);
    // フォールバックデータを返す
    return {
      vehicle_count: vehicleCount,
      location: '石垣島',
      recommendations: [
        '車両数に応じた最適化を実行します',
        'エリア別の効率的な配車を検討します'
      ],
      ishigaki_specific: []
    };
  }
};

// 実績データ保存
export const saveIshigakiRecord = async (record) => {
  try {
    const response = await api.post('/api/ishigaki/save_record', {
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
    const response = await api.get('/api/ishigaki/train_model');
    return response.data;
  } catch (error) {
    console.error('石垣島モデル学習API Error:', error);
    throw error;
  }
};

// バッチデータ取得（存在しないエンドポイントを削除）
// batch_dataエンドポイントは存在しないため、個別に取得する
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

export default api;

// 従来のAPIとの互換性
export const optimizeRoute = async (tourData) => {
  console.warn('⚠️ 従来のAPI使用中。石垣島専用APIへの移行をお勧めします。');
  return optimizeIshigakiTour(tourData);
};

export const saveRecord = async (record) => {
  return saveIshigakiRecord(record);
};

export const trainModel = async () => {
  return trainIshigakiModel();
};

export const getVehicleOptimization = async (tourId, vehicleCount) => {
  return getVehicleOptimizationSuggestions(vehicleCount);
};