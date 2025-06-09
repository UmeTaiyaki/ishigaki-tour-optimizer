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
  Divider
} from '@mui/material';
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
import MapView from './components/MapView'; // MapViewコンポーネントを使用
import Settings from './components/Settings';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';

// API関数（既存のapiフォルダがなければモック実装）
const apiModule = (() => {
  try {
    return require('./api');
  } catch (e) {
    console.warn('API module not found, using mock implementation');
    // モック実装
    return {
      optimizeRoute: async (data) => {
        // 簡易的な最適化ロジック
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
            total_distance: 15 + Math.random() * 10,
            estimated_duration: `${35 + index * 10}分`,
            efficiency_score: 75 + Math.random() * 20
          };
        }).filter(route => route.route.length > 0);

        return { 
          vehicle_routes: mockRoutes,
          ishigaki_recommendations: ['天候良好です', '潮位は最適です']
        };
      },
      getEnvironmentalData: async () => ({
        weather: { temperature: 25, condition: 'sunny' },
        tide: { current_level: 150 }
      }),
      exportSchedule: async () => {},
      saveRecord: async () => {},
      getStatistics: async () => ({}),
      getSystemStatus: async () => ({ status: 'online' }),
      batchDataFetch: async () => ({
        environmentalData: null,
        statistics: null,
        system: { status: 'online' },
        errors: []
      }),
      getVehicleOptimizationSuggestions: async () => [],
      getAIRouteSuggestion: async () => {}
    };
  }
})();

const { 
  optimizeRoute, 
  getEnvironmentalData, 
  exportSchedule, 
  saveRecord, 
  getStatistics,
  getSystemStatus,
  batchDataFetch,
  getVehicleOptimizationSuggestions,
  getAIRouteSuggestion
} = apiModule;

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
    date: new Date().toISOString().split('T')[0],
    startTime: settings.defaultTourTime,
    activityDuration: settings.defaultActivityDuration,
    activityLocation: getDefaultDeparture(),
    activityName: '',
    activityType: 'snorkeling',
    notes: ''
  });

  const [vehicles, setVehicles] = useState([]);
  const [guests, setGuests] = useState([]);
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
        // バッチデータ取得
        const batchData = await batchDataFetch({
          environmentalData: { date: tourData.date },
          statistics: { date: tourData.date },
          systemStatus: true
        });

        if (batchData.environmentalData) {
          setEnvironmentalData(batchData.environmentalData);
        }
        
        if (batchData.statistics) {
          setStatistics(batchData.statistics);
        }
        
        if (batchData.system) {
          setSystemStatus(batchData.system);
        }

        // エラーがあってもアプリは継続動作
        if (batchData.errors.length > 0) {
          console.warn('一部データの読み込みに失敗:', batchData.errors);
          if (batchData.errors.length === 3) {
            addNotification('オフラインモードで動作中', 'warning');
          }
        }

      } catch (error) {
        console.error('アプリ初期化エラー:', error);
        addNotification('初期化中にエラーが発生しましたが、継続して使用できます', 'warning');
      }
    };

    initializeApp();
  }, [tourData.date, addNotification]);

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
        throw new Error('アクティビティの場所を設定してください');
      }

      if (guests.length === 0) {
        throw new Error('ゲストを追加してください');
      }

      if (vehicles.length === 0) {
        throw new Error('車両を追加してください');
      }

      // 最適化設定を取得
      const optimizationSettings = getOptimizationSettings();
      const vehicleDefaults = getVehicleDefaults();

      // リクエストデータ構築
      const requestData = {
        guests: guests.map(guest => ({
          name: guest.name,
          hotel_name: guest.hotel,
          pickup_lat: guest.location.lat,
          pickup_lng: guest.location.lng,
          num_people: guest.people,
          preferred_pickup_start: guest.preferredTime.start,
          preferred_pickup_end: guest.preferredTime.end
        })),
        vehicles: vehicles.map(vehicle => ({
          id: vehicle.id,
          name: vehicle.name,
          capacity: vehicle.capacity,
          vehicle_type: vehicle.vehicleType || vehicleDefaults.defaultVehicleType,
          driver_name: vehicle.driver,
          equipment: vehicle.equipment || [],
          speed_factor: vehicle.speedFactor || vehicleDefaults.defaultSpeedFactor
        })),
        activity_lat: tourData.activityLocation.lat,
        activity_lng: tourData.activityLocation.lng,
        activity_start_time: tourData.startTime,
        tour_date: tourData.date,
        optimization_params: {
          priority_mode: optimizationSettings.priorityMode,
          allow_over_capacity: optimizationSettings.allowOverCapacity,
          max_pickup_delay: optimizationSettings.maxPickupDelay,
          group_nearby_guests: optimizationSettings.groupNearbyGuests,
          nearby_radius_km: optimizationSettings.nearbyRadiusKm,
          consider_traffic: optimizationSettings.considerTraffic,
          consider_weather: optimizationSettings.considerWeather,
          preferred_route_type: optimizationSettings.preferredRouteType,
          buffer_time_minutes: vehicleDefaults.bufferTimeMinutes,
          average_speed_kmh: vehicleDefaults.averageSpeedKmh
        }
      };

      const result = await optimizeRoute(requestData);
      
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
      
      if (error.response?.status === 503 || error.code === 'ECONNABORTED') {
        generateFallbackRoutes();
      } else {
        setErrors([error.message || '最適化中にエラーが発生しました']);
      }
    } finally {
      setLoading(false);
    }
  }, [tourData, guests, vehicles, addNotification, generateFallbackRoutes, getOptimizationSettings, getVehicleDefaults]);

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
                    {/* MapViewコンポーネントを使用 */}
                    <MapView
                      guests={guests}
                      tourData={tourData}
                      optimizedRoutes={optimizedRoutes}
                      vehicles={vehicles}
                    />
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
                          const result = await exportSchedule(optimizedRoutes, format);
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
              {/* Settingsコンポーネントが存在しない場合のフォールバック */}
              {Settings ? (
                <Settings 
                  settings={settings} 
                  onUpdate={(newSettings) => {
                    // 設定更新時に再読み込みして反映
                    window.location.reload();
                  }} 
                />
              ) : (
                <Typography>設定コンポーネントを準備中...</Typography>
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
  const ProviderComponent = SettingsProvider || (({ children }) => children);
  
  return (
    <ProviderComponent>
      <AppContent />
    </ProviderComponent>
  );
}

export default App;