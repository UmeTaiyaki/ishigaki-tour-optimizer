import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Container, 
  Grid, 
  Paper, 
  Button, 
  Typography, 
  Alert, 
  CircularProgress,
  Chip,
  AppBar,
  Toolbar,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Badge,
  Divider,
  TextField
} from '@mui/material';
import axios from 'axios';
import {
  Menu as MenuIcon,
  Settings as SettingsIcon,
  Dashboard as DashboardIcon,
  Navigation as NavigationIcon,
  FileDownload as FileDownloadIcon,
  Group as GroupIcon,
  DirectionsCar as CarIcon,
  LocationOn as LocationIcon,
  WbSunny as SunnyIcon,
  Cloud as CloudIcon,
  BeachAccess as RainIcon,
  Waves as WavesIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

// コンポーネントのインポート
import TourSettings from './components/TourSettings';
import VehicleManager from './components/VehicleManager';
import GuestList from './components/GuestList';
import FinalSchedule from './components/FinalSchedule';

// MapViewコンポーネントのインポート試行
let MapView = null;
try {
  MapView = require('./components/MapView').default;
} catch (e) {
  console.log('MapView not found, using SimpleMapView');
  try {
    MapView = require('./components/SimpleMapView').default;
  } catch (e2) {
    console.log('SimpleMapView not found either');
  }
}

// Settings関連のインポートを条件付きに
let Settings = null;
let SettingsProvider = null;
let useSettings = null;

try {
  const SettingsModule = require('./components/Settings');
  Settings = SettingsModule.default;
} catch (e) {
  console.log('Settings component not found');
}

try {
  const ContextModule = require('./contexts/SettingsContext');
  SettingsProvider = ContextModule.SettingsProvider;
  useSettings = ContextModule.useSettings;
} catch (e) {
  console.log('SettingsContext not found, using fallback');
  // フォールバック実装
  useSettings = () => ({
    settings: {
      companyName: '石垣島ツアー会社',
      defaultTourTime: '09:00',
      defaultActivityDuration: 180,
      locations: {
        defaultDeparture: {
          name: '石垣港離島ターミナル',
          lat: 24.3448,
          lng: 124.1551
        },
        commonDestinations: []
      }
    },
    getDefaultDeparture: () => ({
      name: '石垣港離島ターミナル',
      lat: 24.3448,
      lng: 124.1551
    }),
    getOptimizationSettings: () => ({
      priorityMode: 'balanced',
      allowOverCapacity: false,
      maxPickupDelay: 30,
      groupNearbyGuests: true,
      nearbyRadiusKm: 2,
      considerTraffic: true,
      considerWeather: true,
      preferredRouteType: 'scenic'
    }),
    getVehicleDefaults: () => ({
      defaultCapacity: 8,
      defaultVehicleType: 'mini_van',
      defaultSpeedFactor: 1.0,
      bufferTimeMinutes: 10,
      averageSpeedKmh: 35
    })
  });
}

// API関数の定義
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// API関数をオブジェクトとして定義
const api = {
  optimizeRoute: async (data) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/ishigaki/optimize`, data);
      return response.data;
    } catch (error) {
      console.error('API call failed:', error);
      if (error.response?.status === 422) {
        throw error;
      }
      
      console.log('Falling back to mock data');
      const mockRoutes = data.vehicles.map((vehicle, index) => {
        const assignedGuests = data.guests.filter((_, guestIndex) => 
          guestIndex % data.vehicles.length === index
        );
        
        return {
          vehicle_id: vehicle.id,
          vehicle_name: vehicle.name,
          capacity: vehicle.capacity,
          route: assignedGuests.map((guest, gIndex) => ({
            name: guest.name,
            hotel_name: guest.hotel_name,
            pickup_lat: guest.pickup_lat,
            pickup_lng: guest.pickup_lng,
            num_people: guest.num_people,
            pickup_time: `0${8 + Math.floor(gIndex / 2)}:${(gIndex % 2) * 30}0`,
            time_compliance: 'acceptable',
            preferred_pickup_start: guest.preferred_pickup_start,
            preferred_pickup_end: guest.preferred_pickup_end
          })),
          total_distance: Math.round((15 + Math.random() * 10) * 10) / 10,
          estimated_duration: `${35 + index * 10}分`,
          efficiency_score: Math.round((75 + Math.random() * 20) * 10) / 10
        };
      }).filter(route => route.route.length > 0);

      return { 
        vehicle_routes: mockRoutes,
        ishigaki_recommendations: ['オフラインモードで最適化しました', '実際のルートとは異なる場合があります']
      };
    }
  },

  getEnvironmentalData: async (date) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/ishigaki/environmental_data/${date}`);
      return response.data;
    } catch (error) {
      console.log('Using mock environmental data');
      return {
        weather: { 
          temperature: 25, 
          condition: 'sunny',
          wind_speed: 4.0,
          wind_direction: 'NE'
        },
        tide: { 
          current_level: 150,
          high_times: [
            { time: '06:23', level: 198 },
            { time: '18:45', level: 205 }
          ],
          low_times: [
            { time: '00:15', level: 45 },
            { time: '12:30', level: 38 }
          ]
        }
      };
    }
  },

  exportSchedule: async (routes, format) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/ishigaki/export`, { routes, format });
      return response.data;
    } catch (error) {
      console.log('Export failed:', error);
      return { success: false };
    }
  },

  saveRecord: async (record) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/ishigaki/save_record`, record);
      return response.data;
    } catch (error) {
      console.log('Save failed:', error);
      return { success: false };
    }
  },

  getStatistics: async (date) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/ishigaki/statistics/${date}`);
      return response.data;
    } catch (error) {
      console.log('Using mock statistics');
      return {
        todayTours: 3,
        totalGuests: 15,
        averagePickupTime: 25
      };
    }
  },

  getSystemStatus: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/system/status`);
      return response.data;
    } catch (error) {
      console.log('Using mock system status');
      return { status: 'online', message: 'API接続エラー（オフラインモード）' };
    }
  }
};

// メインのアプリコンテンツ
function AppContent() {
  const { settings, getDefaultDeparture, getOptimizationSettings, getVehicleDefaults } = useSettings();
  const [currentView, setCurrentView] = useState('dashboard');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [systemStatus, setSystemStatus] = useState({
    status: 'online',
    message: ''
  });

  // データ状態
  const [tourData, setTourData] = useState({
    date: new Date().toISOString().split('T')[0].replace(/\//g, '-'), // YYYY-MM-DD形式
    startTime: settings.defaultTourTime,
    activityDuration: settings.defaultActivityDuration,
    activityLocation: { lat: 24.4219, lng: 124.1542, name: '川平湾' }, // デフォルトのアクティビティ場所
    departureLocation: getDefaultDeparture(), // 出発地点
    activityName: '',
    activityType: 'snorkeling',
    notes: ''
  });

  const [vehicles, setVehicles] = useState([
    {
      id: 'vehicle_1',
      name: '車両1',
      capacity: 8,
      driver: '山田太郎',
      vehicleType: 'mini_van',
      equipment: [],
      speedFactor: 1.0,
      color: '#1a73e8'
    }
  ]);
  const [guests, setGuests] = useState([
    {
      id: 1,
      name: 'テストゲスト1',
      hotel: 'ANAインターコンチネンタル石垣',
      location: { lat: 24.3736, lng: 124.1578 },
      people: 2,
      preferredTime: { start: '08:00', end: '09:00' }
    },
    {
      id: 2,
      name: 'テストゲスト2',
      hotel: 'フサキビーチリゾート',
      location: { lat: 24.3678, lng: 124.1123 },
      people: 3,
      preferredTime: { start: '08:00', end: '09:00' }
    }
  ]);
  const [optimizedRoutes, setOptimizedRoutes] = useState([]);
  const [environmentalData, setEnvironmentalData] = useState(null);
  const [statistics, setStatistics] = useState(null);

  // 通知管理
  const addNotification = useCallback((message, severity = 'info') => {
    const notification = {
      id: Date.now(),
      message,
      severity
    };
    setNotifications(prev => [...prev, notification]);
    setTimeout(() => {
      dismissNotification(notification.id);
    }, 5000);
  }, []);

  const dismissNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const dismissError = useCallback((index) => {
    setErrors(prev => prev.filter((_, i) => i !== index));
  }, []);

  // 初期化処理
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // 環境データのみ取得（統計情報とシステムステータスは必要な時だけ）
        const envData = await api.getEnvironmentalData(tourData.date);
        if (envData) {
          setEnvironmentalData(envData);
        }
      } catch (error) {
        console.log('環境データの取得に失敗しました（オフラインモード）');
        // オフラインでも動作を継続
        setEnvironmentalData({
          weather: { temperature: 25, condition: 'sunny' },
          tide: { current_level: 150 }
        });
      }
    };

    initializeApp();
  }, [tourData.date]);

  // 設定から共通目的地を取得
  const getCommonDestinations = () => {
    return settings.locations.commonDestinations;
  };

  // ツアーデータ更新
  const handleTourDataUpdate = (newData) => {
    setTourData(newData);
  };

  // 車両更新（設定のデフォルト値を適用）
  const handleVehiclesUpdate = (newVehicles) => {
    setVehicles(newVehicles);
  };

  // 新規車両追加時のデフォルト値適用
  const createNewVehicle = () => {
    const vehicleDefaults = getVehicleDefaults();
    return {
      id: `vehicle_${Date.now()}`,
      name: '',
      capacity: vehicleDefaults.defaultCapacity,
      vehicleType: vehicleDefaults.defaultVehicleType,
      speedFactor: vehicleDefaults.defaultSpeedFactor,
      driver: '',
      equipment: [],
      fuelEfficiency: 10.0,
      color: '#1a73e8'
    };
  };

  // ゲスト更新
  const handleGuestsUpdate = (newGuests) => {
    setGuests(newGuests);
  };

  // ゲスト位置更新
  const handleGuestLocationUpdate = (guestId, location) => {
    setGuests(prevGuests => 
      prevGuests.map(guest => 
        guest.id === guestId ? { ...guest, location } : guest
      )
    );
  };

  // フォールバック用の簡易ルート生成
  const generateFallbackRoutes = useCallback(() => {
    const fallbackRoutes = vehicles.map((vehicle, index) => {
      const assignedGuests = guests.filter((_, guestIndex) => 
        guestIndex % vehicles.length === index
      );
      
      return {
        vehicle_id: vehicle.id,
        vehicle_name: vehicle.name,
        capacity: vehicle.capacity,
        route: assignedGuests.map((guest, gIndex) => ({
          name: guest.name,
          hotel_name: guest.hotel,
          pickup_lat: guest.location.lat,
          pickup_lng: guest.location.lng,
          num_people: guest.people,
          pickup_time: `0${8 + Math.floor(gIndex / 2)}:${(gIndex % 2) * 30}0`,
          time_compliance: 'acceptable',
          preferred_pickup_start: guest.preferredTime.start,
          preferred_pickup_end: guest.preferredTime.end
        })),
        total_distance: 15 + Math.random() * 10,
        estimated_duration: `${35 + index * 10}分`,
        efficiency_score: 75 + Math.random() * 20
      };
    }).filter(route => route.route.length > 0);

    setOptimizedRoutes(fallbackRoutes);
    addNotification('オフラインモードで簡易最適化を実行しました', 'warning');
  }, [vehicles, guests, addNotification]);

  // 石垣島専用最適化処理（設定を適用）
  const handleOptimize = useCallback(async () => {
    setLoading(true);
    setErrors([]);
    
    try {
      // アクティビティロケーションの検証
      if (!tourData.activityLocation) {
        // デフォルトのアクティビティ場所を設定
        const defaultActivity = { lat: 24.4219, lng: 124.1542, name: '川平湾' };
        setTourData(prev => ({ ...prev, activityLocation: defaultActivity }));
        throw new Error('アクティビティの場所を設定してください');
      }

      if (guests.length === 0) {
        throw new Error('ゲストを追加してください');
      }

      if (vehicles.length === 0) {
        throw new Error('車両を追加してください');
      }

      // ゲストデータの検証と修正
      const validGuests = guests.map(guest => ({
        name: guest.name || 'ゲスト',
        hotel_name: guest.hotel || 'ホテル未設定',
        pickup_lat: guest.location?.lat || 24.3448,
        pickup_lng: guest.location?.lng || 124.1551,
        num_people: guest.people || 1,
        preferred_pickup_start: guest.preferredTime?.start || '08:00',
        preferred_pickup_end: guest.preferredTime?.end || '09:00'
      }));

      // 車両データの検証と修正
      const validVehicles = vehicles.map(vehicle => ({
        id: vehicle.id,
        name: vehicle.name || '車両',
        capacity: vehicle.capacity || 8,
        vehicle_type: vehicle.vehicleType || 'mini_van',
        driver_name: vehicle.driver || 'ドライバー',
        equipment: vehicle.equipment || [],
        speed_factor: vehicle.speedFactor || 1.0
      }));

      // リクエストデータ構築（バックエンドの期待する形式に合わせる）
      const requestData = {
        guests: validGuests,
        vehicles: validVehicles,
        activity_lat: tourData.activityLocation.lat,
        activity_lng: tourData.activityLocation.lng,
        activity_start_time: tourData.startTime || '10:00',
        tour_date: tourData.date ? tourData.date.replace(/\//g, '-') : new Date().toISOString().split('T')[0],
        // バックエンドが期待する追加フィールド
        date: tourData.date ? tourData.date.replace(/\//g, '-') : new Date().toISOString().split('T')[0],
        activity_type: tourData.activityType || 'snorkeling',
        planned_start_time: tourData.startTime || '10:00'
      };

      console.log('Optimization request:', JSON.stringify(requestData, null, 2));

      const result = await api.optimizeRoute(requestData);
      
      if (result.vehicle_routes && result.vehicle_routes.length > 0) {
        setOptimizedRoutes(result.vehicle_routes);
        addNotification(
          `最適化完了: ${result.vehicle_routes.length}台の車両でルートを作成しました`,
          'success'
        );
        
        // 石垣島特有の推奨事項を表示
        if (result.ishigaki_recommendations) {
          result.ishigaki_recommendations.forEach(rec => {
            addNotification(rec, 'info');
          });
        }
      } else {
        throw new Error('ルートの最適化に失敗しました');
      }

    } catch (error) {
      console.error('最適化エラー:', error);
      
      if (error.response?.status === 422) {
        // バリデーションエラーの詳細を確認
        const errorData = error.response.data;
        console.error('Validation error details:', errorData);
        
        // エラーメッセージを詳細に表示
        if (errorData.detail) {
          if (Array.isArray(errorData.detail)) {
            const messages = errorData.detail.map(err => 
              `${err.loc ? err.loc.join('.') : ''}: ${err.msg}`
            );
            setErrors(messages);
          } else {
            setErrors([errorData.detail]);
          }
        } else {
          setErrors(['入力データに問題があります。すべての項目を正しく入力してください。']);
        }
      } else if (error.response?.status === 503 || error.code === 'ECONNABORTED') {
        // オフラインモードでフォールバック
        generateFallbackRoutes();
        addNotification('オフラインモードで最適化しました', 'warning');
      } else {
        setErrors([error.message || '最適化中にエラーが発生しました']);
      }
    } finally {
      setLoading(false);
    }
  }, [tourData, guests, vehicles, addNotification, generateFallbackRoutes, setTourData]);

  // 天候アイコンの取得
  const getWeatherIcon = () => {
    if (!environmentalData?.weather) return <SunnyIcon />;
    
    switch (environmentalData.weather.condition) {
      case 'rainy':
        return <RainIcon />;
      case 'cloudy':
        return <CloudIcon />;
      default:
        return <SunnyIcon />;
    }
  };

  // メニューアイテム
  const menuItems = [
    { 
      id: 'dashboard', 
      label: 'ダッシュボード', 
      icon: <DashboardIcon />,
      badge: null 
    },
    { 
      id: 'settings', 
      label: '設定', 
      icon: <SettingsIcon />,
      badge: null 
    }
  ];

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: 'grey.50' }}>
      {/* アプリバー */}
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setDrawerOpen(!drawerOpen)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {settings.companyName} - ツアー送迎管理システム
          </Typography>
          
          {/* ステータス表示 */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {environmentalData && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {getWeatherIcon()}
                <Typography variant="body2">
                  {environmentalData.weather.temperature}°C
                </Typography>
                {environmentalData.tide && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <WavesIcon fontSize="small" />
                    <Typography variant="body2">
                      {environmentalData.tide.current_level}cm
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
            <Chip 
              label={systemStatus.status === 'online' ? 'オンライン' : 'オフライン'}
              color={systemStatus.status === 'online' ? 'success' : 'default'}
              size="small"
            />
          </Box>
        </Toolbar>
      </AppBar>

      {/* サイドドロワー */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: 240,
            boxSizing: 'border-box',
            mt: 8
          }
        }}
      >
        <List>
          {menuItems.map((item) => (
            <ListItem key={item.id} disablePadding>
              <ListItemButton
                selected={currentView === item.id}
                onClick={() => {
                  setCurrentView(item.id);
                  setDrawerOpen(false);
                }}
              >
                <ListItemIcon>
                  {item.badge ? (
                    <Badge badgeContent={item.badge} color="error">
                      {item.icon}
                    </Badge>
                  ) : (
                    item.icon
                  )}
                </ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        <Divider />
        <Box sx={{ p: 2, mt: 'auto' }}>
          <Typography variant="caption" color="text.secondary">
            Ver 2.0.0<br />
            © 2024 {settings.companyName}
          </Typography>
        </Box>
      </Drawer>

      {/* メインコンテンツ */}
      <Box sx={{ mt: 8 }}>
        {/* エラー表示 */}
        {errors.length > 0 && (
          <Container maxWidth="xl" sx={{ mt: 2 }}>
            {errors.map((error, index) => (
              <Alert 
                key={index} 
                severity="error" 
                sx={{ mb: 1 }}
                onClose={() => dismissError(index)}
              >
                {error}
              </Alert>
            ))}
          </Container>
        )}

        {/* 通知表示 */}
        {notifications.length > 0 && (
          <Box sx={{ position: 'fixed', top: 100, right: 20, zIndex: 1000 }}>
            {notifications.map(notification => (
              <Alert
                key={notification.id}
                severity={notification.severity}
                sx={{ mb: 1, minWidth: 300 }}
                onClose={() => dismissNotification(notification.id)}
              >
                {notification.message}
              </Alert>
            ))}
          </Box>
        )}

        {/* ビューの切り替え */}
        {currentView === 'dashboard' && (
          <Container maxWidth="xl" sx={{ mt: 3, mb: 3 }}>
            <Grid container spacing={3}>
              {/* 左側パネル */}
              <Grid item xs={12} lg={4}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {/* ツアー設定 */}
                  <Paper sx={{ p: 2 }}>
                    <TourSettings 
                      tourData={tourData} 
                      onUpdate={handleTourDataUpdate}
                      environmentalData={environmentalData}
                      commonDestinations={getCommonDestinations()}
                    />
                  </Paper>

                  {/* 車両管理 */}
                  <Paper sx={{ p: 2 }}>
                    <VehicleManager
                      vehicles={vehicles}
                      onUpdate={handleVehiclesUpdate}
                      ishigakiMode={true}
                      createNewVehicle={createNewVehicle}
                    />
                  </Paper>

                  {/* ゲスト管理 */}
                  <Paper sx={{ p: 2 }}>
                    <GuestList
                      guests={guests}
                      onUpdate={handleGuestsUpdate}
                      onLocationUpdate={handleGuestLocationUpdate}
                      ishigakiMode={true}
                    />
                  </Paper>

                  {/* 最適化ボタン */}
                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleOptimize}
                    disabled={loading || guests.length === 0 || !tourData.activityLocation}
                    startIcon={loading ? <CircularProgress size={20} /> : <NavigationIcon />}
                    fullWidth
                    sx={{ py: 1.5 }}
                  >
                    {loading ? '最適化中...' : 'ルートを最適化'}
                  </Button>
                </Box>
              </Grid>

              {/* 右側パネル */}
              <Grid item xs={12} lg={8}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {/* 地図 */}
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      <LocationIcon /> ルートマップ
                    </Typography>
                    {/* MapViewコンポーネント（利用可能な場合） */}
                    {MapView ? (
                      <MapView
                        guests={guests}
                        vehicles={vehicles}
                        activityLocation={tourData.activityLocation}
                        departureLocation={tourData.departureLocation || getDefaultDeparture()}
                        optimizedRoutes={optimizedRoutes}
                        onGuestLocationUpdate={handleGuestLocationUpdate}
                        onActivityLocationUpdate={(location) => {
                          setTourData(prev => ({ ...prev, activityLocation: location }));
                        }}
                        onDepartureLocationUpdate={(location) => {
                          setTourData(prev => ({ ...prev, departureLocation: location }));
                        }}
                        ishigakiMode={true}
                      />
                    ) : (
                      /* 地図コンポーネントが無い場合の代替表示 */
                      <Box sx={{ height: '600px', position: 'relative' }}>
                        <Box sx={{ 
                          height: '100%',
                          bgcolor: '#f5f5f5',
                          borderRadius: 1,
                          overflow: 'auto'
                        }}>
                          {/* ルート情報の表示 */}
                          <Box sx={{ p: 2 }}>
                            <Typography variant="h6" gutterBottom>
                              🗺️ ルート概要
                            </Typography>
                            
                            {/* 出発地点 */}
                            {tourData.departureLocation && (
                              <Box sx={{ mb: 2 }}>
                                <Chip
                                  icon={<CarIcon />}
                                  label={`出発: ${tourData.departureLocation.name || '出発地点'}`}
                                  color="success"
                                  sx={{ mb: 1 }}
                                />
                              </Box>
                            )}

                            {/* 最適化されたルート */}
                            {optimizedRoutes && optimizedRoutes.length > 0 ? (
                              <Box>
                                {optimizedRoutes.map((route, index) => {
                                  const vehicle = vehicles[index];
                                  if (!vehicle || !route.route || route.route.length === 0) return null;
                                  
                                  return (
                                    <Box key={route.vehicle_id} sx={{ mb: 3 }}>
                                      <Typography 
                                        variant="subtitle1" 
                                        sx={{ 
                                          color: vehicle.color || '#1a73e8',
                                          fontWeight: 'bold',
                                          mb: 1
                                        }}
                                      >
                                        🚗 {vehicle.name}
                                      </Typography>
                                      <Box sx={{ pl: 2 }}>
                                        {route.route.map((stop, stopIndex) => (
                                          <Box key={stopIndex} sx={{ mb: 1 }}>
                                            <Typography variant="body2">
                                              {stopIndex + 1}. {stop.pickup_time} - {stop.name}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" sx={{ pl: 2 }}>
                                              {stop.hotel_name} ({stop.num_people}名)
                                            </Typography>
                                          </Box>
                                        ))}
                                      </Box>
                                    </Box>
                                  );
                                })}
                              </Box>
                            ) : (
                              <Box sx={{ textAlign: 'center', py: 4 }}>
                                <Typography color="text.secondary">
                                  ルートを最適化すると、ここに表示されます
                                </Typography>
                              </Box>
                            )}

                            {/* アクティビティ地点 */}
                            {tourData.activityLocation && (
                              <Box sx={{ mt: 2 }}>
                                <Chip
                                  icon={<LocationIcon />}
                                  label={`到着: ${tourData.activityLocation.name || 'アクティビティ地点'}`}
                                  color="error"
                                />
                              </Box>
                            )}
                          </Box>
                        </Box>
                      </Box>
                    )}
                  </Paper>

                  {/* 最終スケジュール */}
                  <Paper sx={{ p: 2 }}>
                    <FinalSchedule
                      optimizedRoutes={optimizedRoutes}
                      vehicles={vehicles}
                      tourData={tourData}
                      environmentalData={environmentalData}
                      onExport={async (format) => {
                        try {
                          const result = await api.exportSchedule(optimizedRoutes, format);
                          addNotification(`スケジュールを${format}形式でエクスポートしました`, 'success');
                        } catch (error) {
                          addNotification('エクスポートに失敗しました', 'error');
                        }
                      }}
                    />
                  </Paper>

                  {/* 統計情報 */}
                  {statistics && Object.keys(statistics).length > 0 && (
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="h6" sx={{ mb: 2 }}>
                        統計情報
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            本日のツアー数
                          </Typography>
                          <Typography variant="h4">
                            {statistics.todayTours || 0}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            総ゲスト数
                          </Typography>
                          <Typography variant="h4">
                            {statistics.totalGuests || 0}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Paper>
                  )}
                </Box>
              </Grid>
            </Grid>
          </Container>
        )}

        {currentView === 'settings' && (
          <Container maxWidth="lg" sx={{ mt: 3, mb: 3 }}>
            <Paper sx={{ p: 3 }}>
              {/* 完全な設定画面を表示 */}
              {Settings ? (
                <Settings 
                  settings={settings} 
                  onUpdate={(newSettings) => {
                    // 設定更新時に再読み込みして反映
                    window.location.reload();
                  }} 
                />
              ) : (
                // Settingsコンポーネントがない場合は、基本的な設定画面を表示
                <Box>
                  <Typography variant="h5" gutterBottom>
                    <SettingsIcon /> 設定
                  </Typography>
                  
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      基本設定
                    </Typography>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="会社名"
                          value={settings.companyName}
                          disabled
                        />
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <TextField
                          fullWidth
                          label="デフォルト開始時刻"
                          type="time"
                          value={settings.defaultTourTime}
                          disabled
                        />
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <TextField
                          fullWidth
                          label="デフォルト活動時間（分）"
                          type="number"
                          value={settings.defaultActivityDuration}
                          disabled
                        />
                      </Grid>
                    </Grid>
                    
                    <Typography sx={{ mt: 3 }} color="text.secondary">
                      設定を変更するには、Settings.jsコンポーネントが必要です。
                    </Typography>
                  </Box>
                </Box>
              )}
            </Paper>
          </Container>
        )}
      </Box>
    </Box>
  );
}

// メインのAppコンポーネント
function App() {
  // SettingsProviderが存在しない場合のフォールバック
  if (SettingsProvider) {
    return (
      <SettingsProvider>
        <AppContent />
      </SettingsProvider>
    );
  } else {
    // SettingsProviderがない場合は直接レンダリング
    return <AppContent />;
  }
}

export default App;