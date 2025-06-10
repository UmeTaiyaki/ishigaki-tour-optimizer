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

// デバッグ用：修正版 frontend/src/services/api.js の optimizeIshigakiTour 関数

export const optimizeIshigakiTour = async (tourData) => {
  try {
    console.log('🔍 DEBUG: 受信したtourData:', tourData);
    
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

    // startTimeのデフォルト値設定
    const startTime = tourData.startTime || '10:00';

    // ゲストデータの詳細変換
    const convertedGuests = tourData.guests.map((guest, index) => {
      console.log(`🔍 DEBUG: ゲスト ${index + 1} 変換前:`, guest);
      
      const converted = {
        id: guest.id || `guest_${index}`,
        name: guest.name || `ゲスト${index + 1}`,
        hotel_name: guest.hotel_name || guest.hotel || `ホテル${index + 1}`,
        pickup_lat: Number(guest.pickup_lat || guest.location?.lat || 24.3336),
        pickup_lng: Number(guest.pickup_lng || guest.location?.lng || 124.1543),
        num_people: Number(guest.num_people || guest.people || 1),
        preferred_pickup_start: guest.preferred_pickup_start || guest.preferredTime?.start || '09:00',
        preferred_pickup_end: guest.preferred_pickup_end || guest.preferredTime?.end || '10:00',
        special_needs: guest.special_needs || guest.specialNeeds || null,
        guest_type: guest.guest_type || guest.guestType || 'general'
      };
      
      console.log(`🔍 DEBUG: ゲスト ${index + 1} 変換後:`, converted);
      return converted;
    });

    // 車両データの詳細変換
    const convertedVehicles = tourData.vehicles.map((vehicle, index) => {
      console.log(`🔍 DEBUG: 車両 ${index + 1} 変換前:`, vehicle);
      
      const converted = {
        id: vehicle.id || `vehicle_${index}`,
        name: vehicle.name || `車両${index + 1}`,
        capacity: Number(vehicle.capacity || 8),
        driver: vehicle.driver || `ドライバー${index + 1}`,
        location: {
          lat: Number(vehicle.location?.lat || 24.3336),
          lng: Number(vehicle.location?.lng || 124.1543)
        },
        vehicle_type: vehicle.vehicle_type || vehicle.vehicleType || 'mini_van',
        equipment: vehicle.equipment || [],
        speed_factor: Number(vehicle.speed_factor || vehicle.speedFactor || 1.0)
      };
      
      console.log(`🔍 DEBUG: 車両 ${index + 1} 変換後:`, converted);
      return converted;
    });

    // 最終リクエストデータ
    const requestData = {
      date: tourData.date || new Date().toISOString().split('T')[0],
      activity_type: tourData.activityType || 'シュノーケリング',
      start_time: startTime,
      guests: convertedGuests,
      vehicles: convertedVehicles,
      
      // 追加フィールド
      activity_lat: Number(tourData.activityLocation.lat),
      activity_lng: Number(tourData.activityLocation.lng),
      planned_start_time: startTime,
      departure_lat: Number(tourData.departureLocation?.lat || 24.3336),
      departure_lng: Number(tourData.departureLocation?.lng || 124.1543),
      weather_priority: Boolean(tourData.weatherPriority !== false),
      tide_priority: Boolean(tourData.tidePriority !== false)
    };

    console.log('🔍 DEBUG: 最終リクエストデータ:', JSON.stringify(requestData, null, 2));

    // バリデーションチェック
    const validationErrors = [];
    
    // 必須フィールドチェック
    if (!requestData.date) validationErrors.push('date が未設定');
    if (!requestData.activity_type) validationErrors.push('activity_type が未設定');
    if (!requestData.start_time) validationErrors.push('start_time が未設定');
    
    // ゲストバリデーション
    requestData.guests.forEach((guest, i) => {
      if (!guest.name) validationErrors.push(`guests[${i}].name が未設定`);
      if (!guest.hotel_name) validationErrors.push(`guests[${i}].hotel_name が未設定`);
      if (isNaN(guest.pickup_lat)) validationErrors.push(`guests[${i}].pickup_lat が無効`);
      if (isNaN(guest.pickup_lng)) validationErrors.push(`guests[${i}].pickup_lng が無効`);
      if (isNaN(guest.num_people) || guest.num_people < 1) validationErrors.push(`guests[${i}].num_people が無効`);
    });
    
    // 車両バリデーション
    requestData.vehicles.forEach((vehicle, i) => {
      if (!vehicle.name) validationErrors.push(`vehicles[${i}].name が未設定`);
      if (isNaN(vehicle.capacity) || vehicle.capacity < 1) validationErrors.push(`vehicles[${i}].capacity が無効`);
      if (!vehicle.driver) validationErrors.push(`vehicles[${i}].driver が未設定`);
      if (isNaN(vehicle.location.lat)) validationErrors.push(`vehicles[${i}].location.lat が無効`);
      if (isNaN(vehicle.location.lng)) validationErrors.push(`vehicles[${i}].location.lng が無効`);
    });
    
    if (validationErrors.length > 0) {
      console.error('🔍 DEBUG: バリデーションエラー:', validationErrors);
      throw new Error(`バリデーションエラー: ${validationErrors.join(', ')}`);
    }

    console.log('🚀 DEBUG: APIリクエスト送信中...');
    const response = await api.post('/api/ishigaki/optimize', requestData);
    
    console.log('✅ DEBUG: APIレスポンス:', response.data);
    return response.data;
    
  } catch (error) {
    console.error('❌ DEBUG: API エラー詳細:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      headers: error.response?.headers
    });
    
    // 422エラーの詳細解析
    if (error.response?.status === 422) {
      const detail = error.response.data?.detail;
      console.error('🔍 DEBUG: 422エラーの詳細:', detail);
      
      if (Array.isArray(detail)) {
        const fieldErrors = detail.map(err => {
          console.error(`🔍 DEBUG: フィールドエラー:`, {
            location: err.loc,
            message: err.msg,
            type: err.type,
            input: err.input
          });
          return `${err.loc.join('.')}: ${err.msg}`;
        });
        throw new Error(`入力データエラー: ${fieldErrors.join(', ')}`);
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
    const response = await api.get('/api/ishigaki/statistics');
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

// バッチデータ取得（個別取得版）
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
  console.log('🔄 ルート最適化開始 - 修正版API使用');
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