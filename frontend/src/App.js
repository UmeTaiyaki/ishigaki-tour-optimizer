import React, { useState, useEffect, useCallback } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListItemButton from '@mui/material/ListItemButton';
import Divider from '@mui/material/Divider';
import Badge from '@mui/material/Badge';
import TextField from '@mui/material/TextField';

// アイコン
import MenuIcon from '@mui/icons-material/Menu';
import SettingsIcon from '@mui/icons-material/Settings';
import DashboardIcon from '@mui/icons-material/Dashboard';
import NavigationIcon from '@mui/icons-material/Navigation';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import CloudIcon from '@mui/icons-material/Cloud';
import BeachAccessIcon from '@mui/icons-material/BeachAccess';
import WavesIcon from '@mui/icons-material/Waves';

// コンポーネント
import TourSettings from './components/TourSettings';
import GuestList from './components/GuestList';
import VehicleManager from './components/VehicleManager';
import MapView from './components/MapView';
import FinalSchedule from './components/FinalSchedule';

// API
import axios from 'axios';

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

const theme = createTheme({
  palette: {
    primary: {
      main: '#1a73e8',
    },
    secondary: {
      main: '#34a853',
    },
    error: {
      main: '#ea4335',
    },
    warning: {
      main: '#fbbc04',
    },
    success: {
      main: '#0f9d58',
    },
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
});

// API設定
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function AppContent() {
  const { settings, getDefaultDeparture } = useSettings();
  const [currentView, setCurrentView] = useState('dashboard');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // ツアーデータ
  const [tourData, setTourData] = useState({
    date: new Date().toISOString().split('T')[0],
    activityType: 'snorkeling',
    activityLocation: { lat: 24.4219, lng: 124.1542, name: '川平湾' },
    startTime: '10:00',
    departureLocation: getDefaultDeparture(),
    activityDuration: settings.defaultActivityDuration
  });

  // ゲストデータ（テストデータ含む）
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
  
  // 車両データ
  const [vehicles, setVehicles] = useState([
    {
      id: 'vehicle_001',
      name: '車両1',
      capacity: 8,
      driver: '山田太郎',
      color: '#1a73e8',
      vehicleType: 'mini_van',
      equipment: [],
      speedFactor: 1.0
    }
  ]);

  const [optimizedRoutes, setOptimizedRoutes] = useState([]);
  const [environmentalData, setEnvironmentalData] = useState(null);
  const [systemStatus, setSystemStatus] = useState({ status: 'online' });

  // 通知管理
  const addNotification = useCallback((message, severity = 'info') => {
    const notification = {
      id: Date.now(),
      message,
      severity
    };
    setNotifications(prev => [...prev, notification]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  }, []);

  // 初期化
  useEffect(() => {
    const fetchEnvironmentalData = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/ishigaki/environmental_data/${tourData.date}`);
        setEnvironmentalData(response.data);
      } catch (error) {
        console.log('環境データの取得に失敗（モックデータ使用）');
        setEnvironmentalData({
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
            ]
          }
        });
      }
    };

    fetchEnvironmentalData();
  }, [tourData.date]);

  // ハンドラー関数
  const handleTourDataUpdate = (newData) => {
    setTourData(newData);
  };

  const handleGuestsUpdate = (newGuests) => {
    setGuests(newGuests);
  };

  const handleVehiclesUpdate = (newVehicles) => {
    setVehicles(newVehicles);
  };

  const handleActivityLocationUpdate = (location) => {
    setTourData(prev => ({ ...prev, activityLocation: location }));
  };

  const handleDepartureLocationUpdate = (location) => {
    setTourData(prev => ({ ...prev, departureLocation: location }));
  };

  // 最適化処理
  const handleOptimize = async () => {
    setLoading(true);
    setErrors([]);
    
    try {
      // バリデーション
      if (!tourData.activityLocation) {
        throw new Error('アクティビティの場所を設定してください');
      }

      if (guests.length === 0) {
        throw new Error('ゲストを追加してください');
      }

      if (vehicles.length === 0) {
        throw new Error('車両を追加してください');
      }

      // リクエストデータ構築（バックエンドのフォーマットに完全に合わせる）
      const requestData = {
        // ゲスト情報
        guests: guests.map(guest => ({
          name: guest.name || 'ゲスト',
          hotel_name: guest.hotel || 'ホテル未設定',
          pickup_lat: guest.location?.lat || 24.3448,
          pickup_lng: guest.location?.lng || 124.1551,
          num_people: guest.people || 1,
          preferred_pickup_start: guest.preferredTime?.start || '08:00',
          preferred_pickup_end: guest.preferredTime?.end || '09:00'
        })),
        // 車両情報
        vehicles: vehicles.map(vehicle => ({
          id: vehicle.id,
          name: vehicle.name || '車両',
          capacity: vehicle.capacity || 8,
          vehicle_type: vehicle.vehicleType || 'mini_van',
          driver_name: vehicle.driver || 'ドライバー',
          equipment: vehicle.equipment || [],
          speed_factor: vehicle.speedFactor || 1.0
        })),
        // アクティビティ情報
        activity_lat: tourData.activityLocation.lat,
        activity_lng: tourData.activityLocation.lng,
        activity_start_time: tourData.startTime || '10:00',
        tour_date: tourData.date
      };

      console.log('Optimization request:', JSON.stringify(requestData, null, 2));

      // API呼び出し
      const response = await axios.post(`${API_BASE_URL}/api/ishigaki/optimize`, requestData);
      const result = response.data;
      
      if (result.vehicle_routes && result.vehicle_routes.length > 0) {
        setOptimizedRoutes(result.vehicle_routes);
        addNotification(
          `最適化完了: ${result.vehicle_routes.length}台の車両でルートを作成しました`,
          'success'
        );
        
        // 各車両のルート情報を表示
        result.vehicle_routes.forEach((route, index) => {
          const totalPassengers = route.route.reduce((sum, stop) => sum + stop.num_people, 0);
          addNotification(
            `${route.vehicle_name}: ${route.route.length}箇所ピックアップ、${totalPassengers}名、総距離${route.total_distance}km`,
            'info'
          );
        });
        
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
        const errorData = error.response.data;
        console.error('Validation error details:', errorData);
        
        if (errorData.detail) {
          if (Array.isArray(errorData.detail)) {
            const messages = errorData.detail.map(err => {
              const field = err.loc ? err.loc[err.loc.length - 1] : 'unknown';
              return `${field}: ${err.msg}`;
            });
            setErrors(messages);
          } else {
            setErrors([errorData.detail]);
          }
        } else {
          setErrors(['入力データに問題があります。すべての項目を正しく入力してください。']);
        }
      } else if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK') {
        // ネットワークエラー時のフォールバック
        const mockRoutes = generateMockRoutes();
        setOptimizedRoutes(mockRoutes);
        addNotification('オフラインモードで最適化しました', 'warning');
      } else if (error.response?.data?.detail) {
        // その他のAPIエラー
        setErrors([error.response.data.detail]);
      } else {
        setErrors([error.message || '最適化中にエラーが発生しました']);
      }
    } finally {
      setLoading(false);
    }
  };

  // モックルート生成
  const generateMockRoutes = () => {
    return vehicles.map((vehicle, index) => {
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
        total_distance: Math.round((15 + Math.random() * 10) * 10) / 10,
        estimated_duration: `${35 + index * 10}分`,
        efficiency_score: Math.round((75 + Math.random() * 20) * 10) / 10
      };
    }).filter(route => route.route.length > 0);
  };

  // 天候アイコン
  const getWeatherIcon = () => {
    if (!environmentalData?.weather) return <WbSunnyIcon />;
    
    switch (environmentalData.weather.condition) {
      case 'rainy':
        return <BeachAccessIcon />;
      case 'cloudy':
        return <CloudIcon />;
      default:
        return <WbSunnyIcon />;
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'grey.50' }}>
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
                    <>
                      <WavesIcon fontSize="small" />
                      <Typography variant="body2">
                        {environmentalData.tide.current_level}cm
                      </Typography>
                    </>
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
            <ListItem disablePadding>
              <ListItemButton
                selected={currentView === 'dashboard'}
                onClick={() => {
                  setCurrentView('dashboard');
                  setDrawerOpen(false);
                }}
              >
                <ListItemIcon>
                  <DashboardIcon />
                </ListItemIcon>
                <ListItemText primary="ダッシュボード" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton
                selected={currentView === 'settings'}
                onClick={() => {
                  setCurrentView('settings');
                  setDrawerOpen(false);
                }}
              >
                <ListItemIcon>
                  <SettingsIcon />
                </ListItemIcon>
                <ListItemText primary="設定" />
              </ListItemButton>
            </ListItem>
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
        <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}>
          {/* エラー表示 */}
          {errors.length > 0 && (
            <Container maxWidth="xl" sx={{ mb: 2 }}>
              {errors.map((error, index) => (
                <Alert 
                  key={index} 
                  severity="error" 
                  sx={{ mb: 1 }}
                  onClose={() => setErrors(prev => prev.filter((_, i) => i !== index))}
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
                  onClose={() => setNotifications(prev => 
                    prev.filter(n => n.id !== notification.id)
                  )}
                >
                  {notification.message}
                </Alert>
              ))}
            </Box>
          )}

          {/* ダッシュボードビュー */}
          {currentView === 'dashboard' && (
            <Container maxWidth="xl">
              <Grid container spacing={3}>
                {/* 左側：設定とゲスト管理 */}
                <Grid item xs={12} lg={4}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {/* ツアー設定 */}
                    <Paper sx={{ p: 2 }}>
                      <TourSettings
                        tourData={tourData}
                        onUpdate={handleTourDataUpdate}
                        environmentalData={environmentalData}
                      />
                    </Paper>

                    {/* 車両管理 */}
                    <Paper sx={{ p: 2 }}>
                      <VehicleManager
                        vehicles={vehicles}
                        onUpdate={handleVehiclesUpdate}
                        ishigakiMode={true}
                      />
                    </Paper>

                    {/* ゲスト管理 */}
                    <Paper sx={{ p: 2 }}>
                      <GuestList
                        guests={guests}
                        onUpdate={handleGuestsUpdate}
                      />
                    </Paper>

                    {/* 最適化ボタン */}
                    <Button
                      variant="contained"
                      color="primary"
                      size="large"
                      onClick={handleOptimize}
                      disabled={loading || guests.length === 0}
                      startIcon={loading ? <CircularProgress size={20} /> : <NavigationIcon />}
                      fullWidth
                      sx={{ py: 1.5 }}
                    >
                      {loading ? '最適化中...' : '🚀 石垣島モード最適化'}
                    </Button>
                  </Box>
                </Grid>

                {/* 中央：地図 */}
                <Grid item xs={12} lg={4}>
                  <Paper sx={{ height: '85vh', position: 'sticky', top: 80 }}>
                    <MapView
                      guests={guests}
                      vehicles={vehicles}
                      activityLocation={tourData.activityLocation}
                      departureLocation={tourData.departureLocation}
                      optimizedRoutes={optimizedRoutes}
                      onGuestLocationUpdate={(guestId, location) => {
                        setGuests(prev => prev.map(g => 
                          g.id === guestId ? { ...g, location } : g
                        ));
                      }}
                      onActivityLocationUpdate={handleActivityLocationUpdate}
                      onDepartureLocationUpdate={handleDepartureLocationUpdate}
                      ishigakiMode={true}
                    />
                  </Paper>
                </Grid>

                {/* 右側：結果表示 */}
                <Grid item xs={12} lg={4}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {/* 最終スケジュール */}
                    {optimizedRoutes.length > 0 && (
                      <Paper sx={{ p: 2 }}>
                        <FinalSchedule
                          vehicles={vehicles}
                          optimizedRoutes={optimizedRoutes}
                          tourData={tourData}
                          environmentalData={environmentalData}
                        />
                      </Paper>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </Container>
          )}

          {/* 設定ビュー */}
          {currentView === 'settings' && (
            <Container maxWidth="lg">
              <Paper sx={{ p: 3 }}>
                {Settings ? (
                  <Settings 
                    settings={settings} 
                    onUpdate={(newSettings) => {
                      window.location.reload();
                    }} 
                  />
                ) : (
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
    </ThemeProvider>
  );
}

// メインのAppコンポーネント
function App() {
  if (SettingsProvider) {
    return (
      <SettingsProvider>
        <AppContent />
      </SettingsProvider>
    );
  } else {
    return <AppContent />;
  }
}

export default App;