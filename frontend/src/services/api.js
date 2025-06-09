import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30秒のタイムアウト（複数車両最適化は時間がかかる場合がある）
});

// リクエスト/レスポンスインターセプター
api.interceptors.request.use(
  (config) => {
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
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
    const response = await api.post('/api/ishigaki/optimize', {
      date: tourData.date,
      activity_type: tourData.activityType,
      activity_lat: tourData.activityLocation.lat,
      activity_lng: tourData.activityLocation.lng,
      planned_start_time: tourData.startTime,
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
    });
    
    return response.data;
  } catch (error) {
    console.error('石垣島最適化API Error:', error);
    throw new Error(`最適化エラー: ${error.response?.data?.detail || error.message}`);
  }
};

// 従来の最適化API（後方互換性のため）
export const optimizeRoute = async (tourData) => {
  console.warn('⚠️ 従来のAPI使用中。石垣島専用APIへの移行をお勧めします。');
  return optimizeIshigakiTour(tourData);
};

// 石垣島専用の実績データ保存
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

// 従来の実績保存API（後方互換性のため）
export const saveRecord = async (record) => {
  return saveIshigakiRecord(record);
};

// 石垣島専用モデル学習
export const trainIshigakiModel = async () => {
  try {
    const response = await api.get('/api/ishigaki/train_model');
    return response.data;
  } catch (error) {
    console.error('石垣島モデル学習API Error:', error);
    throw error;
  }
};

// 従来のモデル学習API（後方互換性のため）
export const trainModel = async () => {
  return trainIshigakiModel();
};

// 石垣島の環境データ取得
export const getIshigakiEnvironmentalData = async (date) => {
  try {
    const response = await api.get(`/api/ishigaki/environmental_data/${date}`);
    return response.data;
  } catch (error) {
    console.error('石垣島環境データAPI Error:', error);
    // フォールバック値を返す
    return {
      date: date,
      location: "石垣島",
      weather: {
        condition: 'sunny',
        temperature: 26,
        wind_speed: 4.0,
        wind_direction: 'NE',
        precipitation: 0,
        typhoon_risk: 0
      },
      tide: {
        high_times: [
          { time: "06:23", level: 198 },
          { time: "18:45", level: 205 }
        ],
        low_times: [
          { time: "00:15", level: 45 },
          { time: "12:30", level: 38 }
        ],
        current_level: 150,
        state: 'rising'
      },
      tourism: {
        season_level: 2,
        cruise_ships: [],
        estimated_tourist_count: 5000
      },
      traffic: {
        congestion_forecast: 'normal',
        special_events: []
      },
      status: 'fallback_data'
    };
  }
};

// 従来の環境データAPI（後方互換性のため）
export const getEnvironmentalData = async (date) => {
  const data = await getIshigakiEnvironmentalData(date);
  // 従来形式に変換
  return {
    tide: {
      level: data.tide.current_level,
      state: data.tide.state
    },
    weather: {
      condition: data.weather.condition,
      temp: data.weather.temperature,
      windSpeed: data.weather.wind_speed
    }
  };
};

// 石垣島の統計情報取得
export const getIshigakiStatistics = async () => {
  try {
    const response = await api.get('/api/ishigaki/stats');
    return response.data;
  } catch (error) {
    console.error('石垣島統計API Error:', error);
    throw error;
  }
};

// 車両最適化提案取得
export const getVehicleOptimizationSuggestions = async (vehicleCount) => {
  try {
    const response = await api.get(`/api/ishigaki/vehicle_optimization/${vehicleCount}`);
    return response.data;
  } catch (error) {
    console.error('車両最適化提案API Error:', error);
    return {
      vehicle_count: vehicleCount,
      location: "石垣島",
      recommendations: ["車両最適化提案を取得できませんでした"],
      ishigaki_specific: []
    };
  }
};

// ホテル情報検索（石垣島専用）
export const searchIshigakiHotel = async (hotelName) => {
  try {
    const response = await api.get(`/api/ishigaki/hotel_search`, {
      params: { name: hotelName }
    });
    return response.data;
  } catch (error) {
    console.warn('ホテル検索API Error:', error);
    return null;
  }
};

// 活動地点情報取得（石垣島専用）
export const getIshigakiActivitySpot = async (spotName) => {
  try {
    const response = await api.get(`/api/ishigaki/activity_spot`, {
      params: { name: spotName }
    });
    return response.data;
  } catch (error) {
    console.warn('活動地点情報API Error:', error);
    return null;
  }
};

// リアルタイム交通情報取得
export const getIshigakiTrafficInfo = async () => {
  try {
    const response = await api.get('/api/ishigaki/traffic_info');
    return response.data;
  } catch (error) {
    console.warn('交通情報API Error:', error);
    return {
      status: 'normal',
      alerts: [],
      congestion_areas: []
    };
  }
};

// 予測精度追跡
export const trackPredictionAccuracy = async (predictionData) => {
  try {
    const response = await api.post('/api/ishigaki/track_accuracy', predictionData);
    return response.data;
  } catch (error) {
    console.warn('予測精度追跡API Error:', error);
    return { success: false };
  }
};

// システム状態確認
export const checkSystemStatus = async () => {
  try {
    const response = await api.get('/');
    return {
      status: 'online',
      version: response.data.version,
      location: response.data.location || '石垣島',
      features: response.data.features || []
    };
  } catch (error) {
    console.error('システム状態確認Error:', error);
    return {
      status: 'offline',
      error: error.message
    };
  }
};

// バッチ処理（複数リクエストの並列実行）
export const getBatchData = async (date) => {
  try {
    const [environmentalData, statistics, systemStatus] = await Promise.allSettled([
      getIshigakiEnvironmentalData(date),
      getIshigakiStatistics(),
      checkSystemStatus()
    ]);

    return {
      environmental: environmentalData.status === 'fulfilled' ? environmentalData.value : null,
      statistics: statistics.status === 'fulfilled' ? statistics.value : null,
      system: systemStatus.status === 'fulfilled' ? systemStatus.value : null,
      errors: [
        ...(environmentalData.status === 'rejected' ? ['environmental'] : []),
        ...(statistics.status === 'rejected' ? ['statistics'] : []),
        ...(systemStatus.status === 'rejected' ? ['system'] : [])
      ]
    };
  } catch (error) {
    console.error('バッチデータ取得Error:', error);
    throw error;
  }
};

// WebSocket接続（リアルタイム更新用）
export class IshigakiWebSocketClient {
  constructor() {
    this.ws = null;
    this.reconnectInterval = 5000;
    this.maxReconnectAttempts = 10;
    this.reconnectAttempts = 0;
  }

  connect(onMessage, onError) {
    try {
      const wsUrl = API_BASE_URL.replace('http', 'ws') + '/ws/ishigaki';
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('🔗 石垣島WebSocket接続成功');
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage(data);
        } catch (error) {
          console.error('WebSocketメッセージパースエラー:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocketエラー:', error);
        if (onError) onError(error);
      };

      this.ws.onclose = () => {
        console.log('WebSocket接続終了');
        this.reconnect(onMessage, onError);
      };

    } catch (error) {
      console.error('WebSocket接続失敗:', error);
      if (onError) onError(error);
    }
  }

  reconnect(onMessage, onError) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`WebSocket再接続試行 ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      
      setTimeout(() => {
        this.connect(onMessage, onError);
      }, this.reconnectInterval);
    } else {
      console.error('WebSocket再接続試行回数を超過しました');
    }
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket未接続のため送信できません');
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// APIエラーハンドリング用のヘルパー
export const handleApiError = (error, context = '') => {
  const message = error.response?.data?.detail || error.message || '不明なエラー';
  const status = error.response?.status;
  
  console.error(`API Error [${context}]:`, {
    status,
    message,
    url: error.config?.url
  });

  // ユーザーフレンドリーなエラーメッセージ
  if (status === 404) {
    return '要求されたリソースが見つかりません';
  } else if (status === 500) {
    return 'サーバー内部エラーが発生しました';
  } else if (status === 503) {
    return 'サービスが一時的に利用できません';
  } else if (error.code === 'ECONNABORTED') {
    return 'リクエストがタイムアウトしました';
  } else if (error.code === 'NETWORK_ERROR') {
    return 'ネットワークエラーが発生しました';
  }
  
  return message;
};

// デバッグ用の詳細ログ
export const enableDebugMode = () => {
  api.interceptors.request.use((config) => {
    console.group(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    console.log('Headers:', config.headers);
    console.log('Data:', config.data);
    console.groupEnd();
    return config;
  });

  api.interceptors.response.use(
    (response) => {
      console.group(`✅ API Response: ${response.status} ${response.config.url}`);
      console.log('Data:', response.data);
      console.groupEnd();
      return response;
    },
    (error) => {
      console.group(`❌ API Error: ${error.response?.status || 'Network'} ${error.config?.url}`);
      console.log('Error:', error.response?.data || error.message);
      console.groupEnd();
      return Promise.reject(error);
    }
  );
};

export default api;