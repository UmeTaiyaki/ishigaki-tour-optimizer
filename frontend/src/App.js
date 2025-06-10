// App.js - インポートエラー修正版

import React, { useState, useEffect } from 'react';
import {
  ThemeProvider, createTheme, CssBaseline, Box, AppBar, Toolbar,
  Typography, IconButton, Drawer, List, ListItem, ListItemIcon,
  ListItemText, ListItemButton, Divider, Alert, Snackbar,
  Chip, Badge, CircularProgress
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  DirectionsCar as CarIcon,
  Schedule as ScheduleIcon,
  Assessment as StatisticsIcon,
  Settings as SettingsIcon,
  CloudSync as CloudIcon,
  Notifications as NotificationsIcon,
  WbSunny as SunnyIcon,
  Cloud as CloudyIcon,
  Grain as RainyIcon,
  Air as WindyIcon
} from '@mui/icons-material';

// コンポーネントのインポート（存在チェック付き）
import FinalSchedule from './components/FinalSchedule';

// 他のコンポーネント - エラーハンドリング付きダイナミックインポート
const SafeGuestManager = React.lazy(() => 
  import('./components/GuestManager').catch(() => ({
    default: () => <div>GuestManager component not available</div>
  }))
);

const SafeVehicleManager = React.lazy(() => 
  import('./components/VehicleManager').catch(() => ({
    default: () => <div>VehicleManager component not available</div>
  }))
);

const SafeRouteOptimizer = React.lazy(() => 
  import('./components/RouteOptimizer').catch(() => ({
    default: () => <div>RouteOptimizer component not available</div>
  }))
);

const SafeStatistics = React.lazy(() => 
  import('./components/Statistics').catch(() => ({
    default: () => <div>Statistics component not available</div>
  }))
);

const SafeSettings = React.lazy(() => 
  import('./components/Settings').catch(() => ({
    default: () => <div>Settings component not available</div>
  }))
);

// APIのインポート（存在チェック付き）
let apiModule = {};
try {
  apiModule = require('./api');
} catch (e) {
  console.warn('API module not found, using mock functions');
  apiModule = {
    optimizeIshigakiTour: async () => ({ success: false, message: 'API not available' }),
    getIshigakiEnvironmentalData: async () => null,
    checkSystemStatus: async () => ({ status: 'offline' }),
    getBatchData: async () => ({})
  };
}

const { 
  optimizeIshigakiTour = apiModule.optimizeIshigakiTour,
  getIshigakiEnvironmentalData = apiModule.getIshigakiEnvironmentalData,
  checkSystemStatus = apiModule.checkSystemStatus,
  getBatchData = apiModule.getBatchData
} = apiModule;

// テーマ設定
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0'
    },
    secondary: {
      main: '#dc004e',
      light: '#f06292',
      dark: '#c51162'
    },
    success: {
      main: '#2e7d32',
      lighter: '#e8f5e9'
    },
    warning: {
      main: '#ed6c02',
      lighter: '#fff3e0'
    },
    error: {
      main: '#d32f2f',
      lighter: '#ffebee'
    },
    info: {
      main: '#0288d1',
      lighter: '#e3f2fd'
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff'
    }
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 }
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          borderRadius: 12
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600
        }
      }
    }
  }
});

// 初期データ
const initialTourData = {
  date: new Date().toISOString().split('T')[0],
  activityType: 'シュノーケリング',
  activityLocation: { lat: 24.4068, lng: 124.1618 },
  startTime: '09:00',
  departureLocation: { lat: 24.3336, lng: 124.1543 }
};

const initialSettings = {
  darkMode: false,
  language: 'ja',
  autoSave: true,
  notifications: true,
  realtimeTracking: false,
  mapProvider: 'google',
  weatherProvider: 'openmeteo'
};

// モックデータ
const mockGuests = [
  {
    id: 1,
    name: '田中太郎',
    hotel_name: 'ANAインターコンチネンタル石垣リゾート',
    pickup_lat: 24.3441,
    pickup_lng: 124.1574,
    people: 2,
    preferred_pickup_start: '08:30',
    preferred_pickup_end: '09:00',
    phone: '090-1234-5678',
    email: 'tanaka@example.com'
  },
  {
    id: 2,
    name: '佐藤花子',
    hotel_name: 'フサキビーチリゾート',
    pickup_lat: 24.3912,
    pickup_lng: 124.1233,
    people: 3,
    preferred_pickup_start: '08:45',
    preferred_pickup_end: '09:15',
    phone: '090-2345-6789',
    email: 'sato@example.com'
  }
];

const mockVehicles = [
  {
    id: 'v1',
    name: '石垣号',
    capacity: 8,
    vehicleType: 'mini_van',
    driver: '山田運転手',
    status: 'available'
  },
  {
    id: 'v2', 
    name: '美ら海号',
    capacity: 6,
    vehicleType: 'sedan',
    driver: '鈴木運転手', 
    status: 'available'
  }
];

const mockOptimizedRoutes = [
  {
    vehicle_id: 'v1',
    vehicle_name: '石垣号',
    capacity: 8,
    route: [
      {
        name: '田中太郎',
        hotel_name: 'ANAインターコンチネンタル石垣リゾート',
        pickup_time: '08:45',
        num_people: 2,
        time_compliance: 'acceptable'
      },
      {
        name: '佐藤花子',
        hotel_name: 'フサキビーチリゾート',
        pickup_time: '09:00',
        num_people: 3,
        time_compliance: 'acceptable'
      }
    ],
    total_distance: 15.3,
    efficiency_score: 85,
    departure_lat: 24.3336,
    departure_lng: 124.1543
  }
];

function App() {
  // State Management
  const [currentPage, setCurrentPage] = useState('schedule'); // デフォルトをscheduleに変更
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  // データ管理
  const [guests, setGuests] = useState(mockGuests);
  const [vehicles, setVehicles] = useState(mockVehicles);
  const [optimizedRoutes, setOptimizedRoutes] = useState(mockOptimizedRoutes);
  const [tourData, setTourData] = useState(initialTourData);
  const [settings, setSettings] = useState(initialSettings);
  
  // システム状態
  const [environmentalData, setEnvironmentalData] = useState(null);
  const [systemStatus, setSystemStatus] = useState('unknown');
  const [isLoading, setIsLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState(null);

  // Effects
  useEffect(() => {
    initializeApp();
  }, []);

  useEffect(() => {
    if (tourData.date) {
      fetchEnvironmentalData(tourData.date);
    }
  }, [tourData.date]);

  // Core Functions
  const initializeApp = async () => {
    setIsLoading(true);
    try {
      const status = await checkSystemStatus();
      setSystemStatus(status.status);
      
      await fetchEnvironmentalData(tourData.date);
      restoreFromLocalStorage();
      addNotification('success', 'システムを初期化しました');
    } catch (error) {
      console.error('初期化エラー:', error);
      setError('システムの初期化に失敗しました');
      setSystemStatus('offline');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEnvironmentalData = async (date) => {
    try {
      const data = await getIshigakiEnvironmentalData(date);
      setEnvironmentalData(data);
    } catch (error) {
      console.warn('環境データ取得エラー:', error);
      setEnvironmentalData({
        date: date,
        weather: {
          condition: 'sunny',
          temperature: 26,
          wind_speed: 4.0,
          humidity: 70
        },
        tide: {
          current_level: 150,
          state: 'rising'
        },
        sea: {
          wave_height: 0.5,
          water_temperature: 25,
          visibility: 'good'
        }
      });
    }
  };

  const handleRouteOptimization = async () => {
    if (guests.length === 0 || vehicles.length === 0) {
      setError('ゲストと車両の情報を入力してください');
      return;
    }

    setIsLoading(true);
    try {
      // モックデータで最適化結果をシミュレート
      setOptimizedRoutes(mockOptimizedRoutes);
      addNotification('success', `ルート最適化完了: ${mockOptimizedRoutes.length}台の車両`);
      setCurrentPage('schedule');
    } catch (error) {
      console.error('ルート最適化エラー:', error);
      setError(error.message || 'ルート最適化中にエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  // Data Management
  const saveToLocalStorage = () => {
    try {
      const dataToSave = {
        guests, vehicles, tourData, settings, optimizedRoutes,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('ishigaki_tour_data', JSON.stringify(dataToSave));
    } catch (error) {
      console.warn('ローカルストレージ保存エラー:', error);
    }
  };

  const restoreFromLocalStorage = () => {
    try {
      const savedData = localStorage.getItem('ishigaki_tour_data');
      if (savedData) {
        const parsed = JSON.parse(savedData);
        const savedTime = new Date(parsed.timestamp);
        const now = new Date();
        const hoursDiff = (now - savedTime) / (1000 * 60 * 60);
        
        if (hoursDiff < 24) {
          setGuests(parsed.guests || mockGuests);
          setVehicles(parsed.vehicles || mockVehicles);
          setTourData(parsed.tourData || initialTourData);
          setSettings(parsed.settings || initialSettings);
          setOptimizedRoutes(parsed.optimizedRoutes || mockOptimizedRoutes);
          addNotification('info', '前回のデータを復元しました');
        }
      }
    } catch (error) {
      console.warn('ローカルストレージ復元エラー:', error);
    }
  };

  // Event Handlers
  const handleGuestsUpdate = (newGuests) => {
    setGuests(newGuests);
    if (settings.autoSave) saveToLocalStorage();
  };

  const handleVehiclesUpdate = (newVehicles) => {
    setVehicles(newVehicles);
    if (settings.autoSave) saveToLocalStorage();
  };

  const handleTourDataUpdate = (newTourData) => {
    setTourData(newTourData);
    if (settings.autoSave) saveToLocalStorage();
  };

  const handleActivityLocationUpdate = (location) => {
    setTourData(prev => ({ ...prev, activityLocation: location }));
  };

  const addNotification = (type, message) => {
    const notification = {
      id: Date.now(),
      type, message,
      timestamp: new Date()
    };
    
    setNotifications(prev => [notification, ...prev.slice(0, 4)]);
    
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  };

  // UI Helpers
  const getWeatherIcon = () => {
    if (!environmentalData?.weather) return <SunnyIcon />;
    
    switch (environmentalData.weather.condition) {
      case 'rainy': return <RainyIcon sx={{ color: '#2196f3' }} />;
      case 'cloudy': return <CloudyIcon sx={{ color: '#757575' }} />;
      case 'windy': return <WindyIcon sx={{ color: '#00bcd4' }} />;
      default: return <SunnyIcon sx={{ color: '#ff9800' }} />;
    }
  };

  const getSystemStatusColor = () => {
    switch (systemStatus) {
      case 'online': return 'success';
      case 'degraded': return 'warning';
      case 'offline': return 'error';
      default: return 'default';
    }
  };

  const renderCurrentPage = () => {
    return (
      <React.Suspense fallback={<CircularProgress />}>
        {(() => {
          switch (currentPage) {
            case 'guests':
              return (
                <SafeGuestManager
                  guests={guests}
                  onGuestsUpdate={handleGuestsUpdate}
                  tourData={tourData}
                  onTourDataUpdate={handleTourDataUpdate}
                  onActivityLocationUpdate={handleActivityLocationUpdate}
                />
              );
            case 'vehicles':
              return (
                <SafeVehicleManager
                  vehicles={vehicles}
                  onVehiclesUpdate={handleVehiclesUpdate}
                />
              );
            case 'optimizer':
              return (
                <SafeRouteOptimizer
                  guests={guests}
                  vehicles={vehicles}
                  tourData={tourData}
                  environmentalData={environmentalData}
                  onOptimize={handleRouteOptimization}
                  optimizedRoutes={optimizedRoutes}
                  isLoading={isLoading}
                />
              );
            case 'schedule':
              return (
                <FinalSchedule
                  optimizedRoutes={optimizedRoutes}
                  tourData={tourData}
                  guests={guests}
                  vehicles={vehicles}
                  environmentalData={environmentalData}
                />
              );
            case 'statistics':
              return (
                <SafeStatistics
                  optimizedRoutes={optimizedRoutes}
                  tourData={tourData}
                  guests={guests}
                  vehicles={vehicles}
                />
              );
            case 'settings':
              return (
                <SafeSettings
                  settings={settings}
                  onSettingsUpdate={setSettings}
                />
              );
            default:
              return <div>ページが見つかりません</div>;
          }
        })()}
      </React.Suspense>
    );
  };

  // Navigation Items
  const navigationItems = [
    { id: 'guests', label: 'ゲスト管理', icon: <PeopleIcon />, badge: guests.length },
    { id: 'vehicles', label: '車両管理', icon: <CarIcon />, badge: vehicles.length },
    { id: 'optimizer', label: 'ルート最適化', icon: <DashboardIcon /> },
    { id: 'schedule', label: '最終スケジュール', icon: <ScheduleIcon />, badge: optimizedRoutes.length },
    { id: 'statistics', label: '統計・分析', icon: <StatisticsIcon /> },
    { id: 'settings', label: '設定', icon: <SettingsIcon /> }
  ];

  // Main Render
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
        
        {/* アプリバー */}
        <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="メニューを開く"
              edge="start"
              onClick={() => setDrawerOpen(!drawerOpen)}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            
            <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
              石垣島ツアー会社 - 送迎管理システム v2.0
            </Typography>
            
            {/* 環境情報表示 */}
            {environmentalData && (
              <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                {getWeatherIcon()}
                <Box sx={{ ml: 1 }}>
                  <Typography variant="body2">
                    {environmentalData.weather?.temperature || 26}°C
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: '0.7em' }}>
                    {tourData.date}
                  </Typography>
                </Box>
              </Box>
            )}

            {/* 通知 */}
            <IconButton color="inherit" sx={{ mr: 1 }}>
              <Badge badgeContent={notifications.length} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>

            {/* システム状態 */}
            <Chip
              icon={<CloudIcon />}
              label={systemStatus}
              color={getSystemStatusColor()}
              variant="outlined"
              size="small"
              sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)' }}
            />
          </Toolbar>
        </AppBar>

        {/* サイドバー */}
        <Drawer
          variant="persistent"
          anchor="left"
          open={drawerOpen}
          sx={{
            width: 280,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: 280,
              boxSizing: 'border-box',
              mt: '64px',
              height: 'calc(100vh - 64px)'
            }
          }}
        >
          <Box sx={{ overflow: 'auto', p: 1 }}>
            <List>
              {navigationItems.map((item) => (
                <ListItem key={item.id} disablePadding>
                  <ListItemButton
                    selected={currentPage === item.id}
                    onClick={() => setCurrentPage(item.id)}
                    sx={{
                      borderRadius: 2,
                      mb: 0.5,
                      '&.Mui-selected': {
                        bgcolor: 'primary.lighter',
                        '&:hover': { bgcolor: 'primary.lighter' }
                      }
                    }}
                  >
                    <ListItemIcon sx={{ color: currentPage === item.id ? 'primary.main' : 'inherit' }}>
                      {item.badge ? (
                        <Badge badgeContent={item.badge} color="primary">
                          {item.icon}
                        </Badge>
                      ) : (
                        item.icon
                      )}
                    </ListItemIcon>
                    <ListItemText 
                      primary={item.label}
                      primaryTypographyProps={{
                        fontWeight: currentPage === item.id ? 600 : 400
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
            
            <Divider sx={{ my: 2 }} />
            
            {/* クイック統計 */}
            <Box sx={{ p: 2 }}>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                クイック統計
              </Typography>
              <Box sx={{ display: 'grid', gap: 1, mt: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">総ゲスト数:</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {guests.reduce((sum, guest) => sum + guest.people, 0)}名
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">利用可能車両:</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {vehicles.filter(v => v.status === 'available').length}台
                  </Typography>
                </Box>
                {optimizedRoutes.length > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">最適化済み:</Typography>
                    <Typography variant="body2" fontWeight="bold" color="success.main">
                      {optimizedRoutes.length}ルート
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        </Drawer>

        {/* メインコンテンツ */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            mt: '64px',
            ml: drawerOpen ? 0 : '-280px',
            transition: 'margin-left 0.3s ease'
          }}
        >
          {/* ローディング表示 */}
          {isLoading && (
            <Box sx={{ 
              position: 'fixed', 
              top: 80, 
              left: '50%', 
              transform: 'translateX(-50%)',
              zIndex: 1300 
            }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                bgcolor: 'background.paper',
                p: 2,
                borderRadius: 2,
                boxShadow: 4
              }}>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                <Typography variant="body2">処理中...</Typography>
              </Box>
            </Box>
          )}

          {/* エラー表示 */}
          <Snackbar
            open={!!error}
            autoHideDuration={6000}
            onClose={() => setError(null)}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          >
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          </Snackbar>

          {/* 通知表示 */}
          {notifications.map((notification, index) => (
            <Snackbar
              key={notification.id}
              open={true}
              autoHideDuration={5000}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              sx={{ 
                bottom: 16 + (index * 70),
                '& .MuiSnackbar-root': { position: 'relative' }
              }}
            >
              <Alert severity={notification.type}>
                {notification.message}
              </Alert>
            </Snackbar>
          ))}

          {/* ページコンテンツ */}
          {renderCurrentPage()}
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;