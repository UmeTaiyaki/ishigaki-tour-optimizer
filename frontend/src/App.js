import React, { useState, useEffect, useCallback } from 'react';
import {
  AppBar, Toolbar, Typography, Box, Container, Grid, Paper,
  Drawer, List, ListItem, ListItemIcon, ListItemText, Alert,
  Snackbar, CircularProgress, Button, IconButton, Badge,
  ThemeProvider, createTheme, CssBaseline, Fab, Tooltip
} from '@mui/material';
import {
  DirectionsCar as CarIcon,
  People as PeopleIcon,
  Map as MapIcon,
  Settings as SettingsIcon,
  Assessment as AssessmentIcon,
  Menu as MenuIcon,
  Refresh as RefreshIcon,
  WbSunny as WbSunnyIcon,
  Cloud as CloudIcon,
  BeachAccess as BeachAccessIcon,
  Close as CloseIcon,
  PlayArrow as PlayIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// 簡易コンポーネント（一時的に組み込み）
const TourSetup = ({ tourData, onTourDataUpdate, activityStartTime, onActivityStartTimeUpdate, environmentalData }) => (
  <Box sx={{ p: 2 }}>
    <Typography variant="h5" gutterBottom>ツアー設定</Typography>
    <Alert severity="info">
      ツアー設定機能は実装中です。現在はデモモードで動作しています。
    </Alert>
    <Box sx={{ mt: 2 }}>
      <Typography variant="body2">
        • 日付: {tourData.date}<br/>
        • アクティビティ: {tourData.activityType}<br/>
        • 開始時間: {tourData.startTime}
      </Typography>
    </Box>
  </Box>
);

const GuestManager = ({ guests, onGuestsUpdate }) => (
  <Box sx={{ p: 2 }}>
    <Typography variant="h5" gutterBottom>ゲスト管理</Typography>
    <Alert severity="info">
      ゲスト管理機能は実装中です。現在はデモモードで動作しています。
    </Alert>
    <Button 
      variant="contained" 
      sx={{ mt: 2 }}
      onClick={() => onGuestsUpdate([
        {
          name: 'サンプルゲスト1',
          hotel: 'ANAインターコンチネンタル石垣リゾート',
          people: 2,
          location: { lat: 24.3892, lng: 124.1256 },
          preferredTime: { start: '08:30', end: '09:00' }
        },
        {
          name: 'サンプルゲスト2', 
          hotel: 'フサキビーチリゾート',
          people: 3,
          location: { lat: 24.3889, lng: 124.1253 },
          preferredTime: { start: '08:45', end: '09:15' }
        }
      ])}
    >
      サンプルゲストを追加
    </Button>
    <Typography variant="body2" sx={{ mt: 2 }}>
      現在のゲスト数: {guests.length}
    </Typography>
  </Box>
);

const VehicleManager = ({ vehicles, onVehiclesUpdate }) => (
  <Box sx={{ p: 2 }}>
    <Typography variant="h5" gutterBottom>車両管理</Typography>
    <Alert severity="info">
      車両管理機能は実装中です。現在はデモモードで動作しています。
    </Alert>
    <Button 
      variant="contained" 
      sx={{ mt: 2 }}
      onClick={() => onVehiclesUpdate([
        {
          id: 'vehicle_1',
          name: 'ミニバン1号車',
          capacity: 8,
          vehicleType: 'mini_van',
          driver: '田中ドライバー',
          equipment: ['チャイルドシート', 'Wi-Fi']
        },
        {
          id: 'vehicle_2',
          name: 'ミニバン2号車',
          capacity: 8,
          vehicleType: 'mini_van', 
          driver: '佐藤ドライバー',
          equipment: ['クーラーボックス']
        }
      ])}
    >
      サンプル車両を追加
    </Button>
    <Typography variant="body2" sx={{ mt: 2 }}>
      現在の車両数: {vehicles.length}
    </Typography>
  </Box>
);

const MapView = ({ tourData, guests, vehicles, optimizedRoutes, activityLocation, onActivityLocationUpdate }) => (
  <Box sx={{ p: 2 }}>
    <Typography variant="h5" gutterBottom>地図・ルート</Typography>
    <Alert severity="info">
      地図表示機能は実装中です。現在はデモモードで動作しています。
    </Alert>
    <Box sx={{ 
      height: 400, 
      bgcolor: 'lightblue', 
      border: '2px solid #ccc',
      borderRadius: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      mt: 2
    }}>
      <Typography variant="h6">🗺️ 石垣島地図エリア（デモ）</Typography>
    </Box>
    <Button 
      variant="contained" 
      sx={{ mt: 2 }}
      onClick={() => onActivityLocationUpdate({ lat: 24.4041, lng: 124.1611 })}
    >
      川平湾を設定
    </Button>
  </Box>
);

const FinalSchedule = ({ optimizedRoutes, tourData, guests, vehicles, environmentalData }) => (
  <Box sx={{ p: 2 }}>
    <Typography variant="h5" gutterBottom>最終スケジュール</Typography>
    {optimizedRoutes.length > 0 ? (
      <Alert severity="success">
        最適化されたルートが{optimizedRoutes.length}件あります
      </Alert>
    ) : (
      <Alert severity="warning">
        ルートを最適化してください
      </Alert>
    )}
  </Box>
);

const Statistics = ({ optimizedRoutes, tourData }) => (
  <Box sx={{ p: 2 }}>
    <Typography variant="h5" gutterBottom>統計・分析</Typography>
    <Alert severity="info">
      統計機能は実装中です。現在はデモモードで動作しています。
    </Alert>
  </Box>
);

const Settings = ({ settings, onSettingsUpdate }) => (
  <Box sx={{ p: 2 }}>
    <Typography variant="h5" gutterBottom>設定</Typography>
    <Alert severity="info">
      設定機能は実装中です。現在はデモモードで動作しています。
    </Alert>
  </Box>
);

// Material-UIテーマ
const theme = createTheme({
  palette: {
    primary: {
      main: '#0277bd', // 石垣島の海の色
    },
    secondary: {
      main: '#ff9800', // 夕日の色
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    h4: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 500,
    },
  },
});

function App() {
  // ステート管理
  const [currentView, setCurrentView] = useState('setup');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);
  const [notifications, setNotifications] = useState([]);
  
  // データステート
  const [tourData, setTourData] = useState({
    date: new Date().toISOString().split('T')[0],
    activityType: 'snorkeling',
    startTime: '10:00',
    activityLocation: null,
    departureLocation: { lat: 24.3336, lng: 124.1543 } // 石垣港
  });
  
  const [guests, setGuests] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [optimizedRoutes, setOptimizedRoutes] = useState([]);
  const [environmentalData, setEnvironmentalData] = useState(null);
  const [activityStartTime, setActivityStartTime] = useState('10:00');
  const [activityLocation, setActivityLocation] = useState(null);
  const [settings, setSettings] = useState({
    notifications: {
      sound: true,
      desktop: false,
      email: false
    },
    optimization: {
      priorityMode: 'balanced',
      weatherConsideration: true,
      tideConsideration: true,
      preferredRouteType: 'fastest'
    },
    display: {
      theme: 'light',
      mapStyle: 'satellite',
      language: 'ja'
    }
  });

  // 通知管理
  const addNotification = useCallback((message, type = 'info') => {
    const notification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date()
    };
    setNotifications(prev => [...prev, notification]);
    
    // 自動削除（5秒後）
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  }, []);

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // 環境データの取得
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

  // 最適化処理
  const handleOptimize = async () => {
    // 基本検証
    if (guests.length === 0) {
      setErrors(['ゲストを追加してください']);
      return;
    }

    if (vehicles.length === 0) {
      setErrors(['車両を追加してください']);
      return;
    }

    if (!activityLocation) {
      setErrors(['アクティビティの場所を設定してください']);
      return;
    }

    setLoading(true);
    setErrors([]);

    try {
      // リクエストデータの作成
      const requestData = {
        date: tourData.date,
        activity_type: tourData.activityType,
        planned_start_time: tourData.startTime || activityStartTime || '10:00',
        activity_lat: parseFloat(activityLocation.lat),
        activity_lng: parseFloat(activityLocation.lng),
        departure_lat: 24.3336,
        departure_lng: 124.1543,
        guests: guests.map(guest => ({
          name: guest.name || '未設定',
          hotel_name: guest.hotel || '未設定',
          pickup_lat: parseFloat(guest.location?.lat || 24.3336),
          pickup_lng: parseFloat(guest.location?.lng || 124.1543),
          num_people: parseInt(guest.people || 1),
          preferred_pickup_start: guest.preferredTime?.start || '08:00',
          preferred_pickup_end: guest.preferredTime?.end || '09:00'
        })),
        vehicles: vehicles.map(vehicle => ({
          id: vehicle.id || `vehicle_${Math.random().toString(36).substr(2, 9)}`,
          name: vehicle.name || '車両',
          capacity: parseInt(vehicle.capacity || 8),
          vehicle_type: vehicle.vehicleType || 'mini_van',
          driver_name: vehicle.driver || 'ドライバー',
          equipment: Array.isArray(vehicle.equipment) ? vehicle.equipment : [],
          speed_factor: parseFloat(vehicle.speedFactor || 1.0)
        }))
      };

      console.log('🚀 最適化リクエストデータ:', JSON.stringify(requestData, null, 2));

      // API呼び出し
      const response = await axios.post(`${API_BASE_URL}/api/ishigaki/optimize`, requestData);
      const result = response.data;
      
      if (result.vehicle_routes && result.vehicle_routes.length > 0) {
        setOptimizedRoutes(result.vehicle_routes);
        addNotification(
          `最適化完了: ${result.vehicle_routes.length}台の車両でルートを作成しました`,
          'success'
        );
        
        // 成功時は地図ビューに自動切り替え
        setCurrentView('map');
      } else {
        throw new Error('ルートの最適化に失敗しました');
      }

    } catch (error) {
      console.error('❌ 最適化エラー:', error);
      
      if (error.response?.status === 422) {
        const errorData = error.response.data;
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
        }
      } else if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK') {
        // ネットワークエラー時のフォールバック
        const mockRoutes = generateMockRoutes();
        setOptimizedRoutes(mockRoutes);
        addNotification('オフラインモードで最適化しました', 'warning');
        setCurrentView('map');
      } else {
        setErrors([error.message || '最適化中にエラーが発生しました']);
      }
    } finally {
      setLoading(false);
    }
  };

  // モックルート生成（オフライン用）
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
    setActivityLocation(location);
    setTourData(prev => ({ ...prev, activityLocation: location }));
  };

  // ナビゲーションメニュー
  const menuItems = [
    { id: 'setup', label: 'ツアー設定', icon: <ScheduleIcon />, badge: 0 },
    { id: 'guests', label: 'ゲスト管理', icon: <PeopleIcon />, badge: guests.length },
    { id: 'vehicles', label: '車両管理', icon: <CarIcon />, badge: vehicles.length },
    { id: 'map', label: '地図・ルート', icon: <MapIcon />, badge: optimizedRoutes.length },
    { id: 'schedule', label: '最終スケジュール', icon: <AssessmentIcon />, badge: 0 },
    { id: 'statistics', label: '統計・分析', icon: <AssessmentIcon />, badge: 0 },
    { id: 'settings', label: '設定', icon: <SettingsIcon />, badge: 0 }
  ];

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

  // デフォルト値の設定
  useEffect(() => {
    // アクティビティ場所のデフォルト値（川平湾）
    if (!activityLocation) {
      setActivityLocation({
        lat: 24.4041,
        lng: 124.1611
      });
    }
  }, [activityLocation]);

  // メインコンテンツのレンダリング
  const renderMainContent = () => {
    switch (currentView) {
      case 'setup':
        return (
          <TourSetup
            tourData={tourData}
            onTourDataUpdate={handleTourDataUpdate}
            activityStartTime={activityStartTime}
            onActivityStartTimeUpdate={setActivityStartTime}
            environmentalData={environmentalData}
          />
        );
      case 'guests':
        return (
          <GuestManager
            guests={guests}
            onGuestsUpdate={handleGuestsUpdate}
          />
        );
      case 'vehicles':
        return (
          <VehicleManager
            vehicles={vehicles}
            onVehiclesUpdate={handleVehiclesUpdate}
          />
        );
      case 'map':
        return (
          <MapView
            tourData={tourData}
            guests={guests}
            vehicles={vehicles}
            optimizedRoutes={optimizedRoutes}
            activityLocation={activityLocation}
            onActivityLocationUpdate={handleActivityLocationUpdate}
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
          <Statistics
            optimizedRoutes={optimizedRoutes}
            tourData={tourData}
          />
        );
      case 'settings':
        return (
          <Settings
            settings={settings}
            onSettingsUpdate={setSettings}
          />
        );
      default:
        return <div>ページが見つかりません</div>;
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
              aria-label="open drawer"
              edge="start"
              onClick={() => setDrawerOpen(!drawerOpen)}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            
            <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
              石垣島ツアー会社 - ツアー送迎管理システム
            </Typography>
            
            {/* 天候情報 */}
            {environmentalData && (
              <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                {getWeatherIcon()}
                <Typography variant="body2" sx={{ ml: 1 }}>
                  {environmentalData.weather?.temperature}°C
                </Typography>
              </Box>
            )}
            
            {/* オンライン状態 */}
            <Typography variant="body2" color="inherit">
              オンライン
            </Typography>
          </Toolbar>
        </AppBar>

        {/* サイドドロワー */}
        <Drawer
          variant="temporary"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          sx={{
            width: 240,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: 240,
              boxSizing: 'border-box',
            },
          }}
        >
          <Toolbar />
          <Box sx={{ overflow: 'auto' }}>
            <List>
              {menuItems.map((item) => (
                <ListItem
                  button
                  key={item.id}
                  selected={currentView === item.id}
                  onClick={() => {
                    setCurrentView(item.id);
                    setDrawerOpen(false);
                  }}
                >
                  <ListItemIcon>
                    {item.badge > 0 ? (
                      <Badge badgeContent={item.badge} color="primary">
                        {item.icon}
                      </Badge>
                    ) : (
                      item.icon
                    )}
                  </ListItemIcon>
                  <ListItemText primary={item.label} />
                </ListItem>
              ))}
            </List>
          </Box>
        </Drawer>

        {/* メインコンテンツ */}
        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          <Toolbar />
          
          {/* エラー表示 */}
          {errors.length > 0 && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrors([])}>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </Alert>
          )}
          
          {/* ローディング */}
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
              <Typography sx={{ ml: 2 }}>最適化中...</Typography>
            </Box>
          )}
          
          {/* メインコンテンツ */}
          <Container maxWidth="xl">
            {renderMainContent()}
          </Container>
        </Box>

        {/* 最適化実行ボタン */}
        <Fab
          color="primary"
          aria-label="optimize"
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
          }}
          onClick={handleOptimize}
          disabled={loading || guests.length === 0 || vehicles.length === 0}
        >
          <Tooltip title="ルート最適化を実行">
            {loading ? <CircularProgress size={24} /> : <PlayIcon />}
          </Tooltip>
        </Fab>

        {/* 通知スナックバー */}
        {notifications.map((notification) => (
          <Snackbar
            key={notification.id}
            open={true}
            autoHideDuration={5000}
            onClose={() => removeNotification(notification.id)}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            sx={{ mt: 8 }}
          >
            <Alert
              onClose={() => removeNotification(notification.id)}
              severity={notification.type}
              variant="filled"
            >
              {notification.message}
            </Alert>
          </Snackbar>
        ))}
      </Box>
    </ThemeProvider>
  );
}

export default App;