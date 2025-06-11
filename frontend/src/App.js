// App.js - データ永続化対応版
import React, { useState, useEffect, useCallback } from 'react';
import {
  ThemeProvider, createTheme, CssBaseline, Box, AppBar, Toolbar,
  Typography, IconButton, Drawer, List, ListItem, ListItemIcon,
  ListItemText, Divider, Alert, Snackbar, Chip, Badge, Button,
  CircularProgress, Container, useMediaQuery, Stack
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  DirectionsCar as CarIcon,
  Schedule as ScheduleIcon,
  Assessment as StatisticsIcon,
  Settings as SettingsIcon,
  Map as MapIcon,
  WbSunny as WeatherIcon,
  Notifications as NotificationsIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  RouteOutlined as RouteIcon,
  LocationOn as LocationIcon
} from '@mui/icons-material';

// コンポーネントインポート
import GuestManager from './components/GuestManager';
import VehicleManager from './components/VehicleManager';
import LocationManager from './components/LocationManager';
import RouteOptimizer from './components/RouteOptimizer';
import FinalSchedule from './components/FinalSchedule';
import Statistics from './components/Statistics';
import Settings from './components/Settings';
import GoogleMapIntegration from './components/GoogleMapIntegration';
import EnvironmentalDataDisplay from './components/EnvironmentalDataDisplay';

// APIクライアント
import * as api from './api/client';

// ローカルストレージキー
const STORAGE_KEYS = {
  guests: 'ishigaki_tour_guests',
  vehicles: 'ishigaki_tour_vehicles',
  tourData: 'ishigaki_tour_data',
  settings: 'ishigaki_tour_settings',
  optimizedRoutes: 'ishigaki_tour_optimized_routes'
};

// テーマ設定
const createAppTheme = (prefersDarkMode) => createTheme({
  palette: {
    mode: prefersDarkMode ? 'dark' : 'light',
    primary: { 
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0'
    },
    secondary: { 
      main: '#dc004e',
      light: '#ff5983',
      dark: '#9a0036'
    },
    background: { 
      default: prefersDarkMode ? '#121212' : '#f5f5f5',
      paper: prefersDarkMode ? '#1e1e1e' : '#ffffff'
    }
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 600 },
    h6: { fontWeight: 500 }
  },
  shape: { borderRadius: 8 },
  components: {
    MuiCard: {
      styleOverrides: {
        root: { boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }
      }
    }
  }
});

const App = () => {
  // テーマ設定
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const theme = createAppTheme(prefersDarkMode);
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // UI状態管理
  const [drawerOpen, setDrawerOpen] = useState(!isMobile);
  const [currentView, setCurrentView] = useState('guests'); // デフォルトをguestsに変更
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'info' });

  // データ状態管理（ローカルストレージから初期化）
  const [guests, setGuests] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [optimizedRoutes, setOptimizedRoutes] = useState([]);
  const [environmentalData, setEnvironmentalData] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [systemStatus, setSystemStatus] = useState({ status: 'unknown', last_checked: null });
  const [activityLocation, setActivityLocation] = useState(null);
  const [settings, setSettings] = useState({
    notifications: true,
    autoOptimize: false,
    mapProvider: 'Google Maps',
    updateInterval: 30,
    weatherIntegration: true
  });

  // ツアーデータ
  const [tourData, setTourData] = useState({
    date: new Date().toISOString().split('T')[0],
    activityType: 'シュノーケリング',
    startTime: '10:00',
    activityLocation: null,
    departureLocation: { lat: 24.3336, lng: 124.1543 }
  });

  // ローカルストレージ管理
  const saveToStorage = useCallback((key, data) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      console.log(`💾 ${key} をローカルストレージに保存:`, data);
    } catch (error) {
      console.error(`ローカルストレージ保存エラー (${key}):`, error);
    }
  }, []);

  const loadFromStorage = useCallback((key, defaultValue = null) => {
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        console.log(`💾 ${key} をローカルストレージから復元:`, parsed);
        return parsed;
      }
    } catch (error) {
      console.error(`ローカルストレージ読み込みエラー (${key}):`, error);
    }
    return defaultValue;
  }, []);

  // 初期化処理
  useEffect(() => {
    const initializeApp = async () => {
      console.log('🚀 アプリケーションを初期化中...');
      
      // ローカルストレージからデータを復元
      const savedGuests = loadFromStorage(STORAGE_KEYS.guests, []);
      const savedVehicles = loadFromStorage(STORAGE_KEYS.vehicles, []);
      const savedTourData = loadFromStorage(STORAGE_KEYS.tourData, {});
      const savedSettings = loadFromStorage(STORAGE_KEYS.settings, {});
      const savedOptimizedRoutes = loadFromStorage(STORAGE_KEYS.optimizedRoutes, []);
      
      if (savedGuests.length > 0) {
        setGuests(savedGuests);
      }
      
      if (savedVehicles.length > 0) {
        setVehicles(savedVehicles);
      }
      
      if (Object.keys(savedTourData).length > 0) {
        setTourData(prev => ({ ...prev, ...savedTourData }));
      }
      
      if (Object.keys(savedSettings).length > 0) {
        setSettings(prev => ({ ...prev, ...savedSettings }));
      }

      if (savedOptimizedRoutes.length > 0) {
        setOptimizedRoutes(savedOptimizedRoutes);
        console.log('📋 最適化結果を復元:', savedOptimizedRoutes);
      }

      // 初期アクティビティ地点（川平湾）
      const initialActivityLocation = savedTourData.activityLocation || { lat: 24.4167, lng: 124.1556 };
      setActivityLocation(initialActivityLocation);
      
      // システムステータスチェック
      await refreshSystemStatus();
      
      // 環境データ読み込み
      if (savedSettings.weatherIntegration !== false) {
        await loadEnvironmentalData();
      }

      console.log('✅ アプリケーション初期化完了');
    };

    initializeApp();
  }, [loadFromStorage]);

  // システムステータス更新
  const refreshSystemStatus = async () => {
    try {
      const status = await api.checkSystemStatus();
      setSystemStatus({
        ...status,
        last_checked: new Date().toISOString()
      });
    } catch (error) {
      console.error('システムステータス取得エラー:', error);
      setSystemStatus({
        status: 'offline',
        last_checked: new Date().toISOString(),
        error: error.message
      });
    }
  };

  // 環境データ読み込み
  const loadEnvironmentalData = async (date = null) => {
    if (!settings.weatherIntegration) return;
    
    try {
      const targetDate = date || tourData.date;
      const envData = await api.getEnvironmentalData(targetDate);
      setEnvironmentalData(envData.data || envData);
      console.log('🌤️ 環境データを取得:', envData);
    } catch (error) {
      console.error('環境データ取得エラー:', error);
    }
  };

  // アラート表示
  const showAlert = useCallback((message, severity = 'info') => {
    setAlert({ open: true, message, severity });
  }, []);

  const handleCloseAlert = () => {
    setAlert(prev => ({ ...prev, open: false }));
  };

  // ルート最適化結果をクリア
  const handleClearOptimizedRoutes = useCallback(() => {
    setOptimizedRoutes([]);
    saveToStorage(STORAGE_KEYS.optimizedRoutes, []);
    console.log('🗑️ 最適化結果をクリアしました');
    showAlert('最適化結果をクリアしました', 'info');
  }, [saveToStorage, showAlert]);

  // ルート最適化実行
  const handleOptimizeRoute = async () => {
    console.log('🚀 ルート最適化を開始します');
    
    if (guests.length === 0 || vehicles.length === 0) {
      showAlert('ゲストと車両を登録してください', 'warning');
      return;
    }

    if (!activityLocation) {
      showAlert('アクティビティ地点を設定してください', 'warning');
      return;
    }

    setLoading(true);
    
    try {
      console.log('📤 送信データを準備中...');
      
      const optimizationData = {
        ...tourData,
        activityLocation,
        guests,
        vehicles
      };
      
      console.log('📋 最適化データ:', {
        guests: guests.length,
        vehicles: vehicles.length,
        activityLocation,
        tourData
      });

      const result = await api.optimizeRoute(optimizationData);
      
      console.log('✅ 最適化結果:', result);
      
      // 結果の検証
      if (!result || !result.routes || result.routes.length === 0) {
        console.error('❌ 無効な最適化結果:', result);
        throw new Error('最適化結果が無効です: ルートデータが空です');
      }

      // 正常な結果の場合のみ設定
      setOptimizedRoutes(result.routes);
      saveToStorage(STORAGE_KEYS.optimizedRoutes, result.routes);
      console.log('💾 最適化結果を保存:', result.routes);
      
      // 統計データも更新
      try {
        const stats = await api.getStatistics();
        setStatistics(stats);
      } catch (statsError) {
        console.warn('統計データ取得エラー:', statsError);
      }

      showAlert(`ルート最適化が完了しました！ ${result.routes.length}台の車両ルートを生成`, 'success');
      setCurrentView('schedule');
      
    } catch (error) {
      console.error('❌ 最適化エラー:', error);
      
      let errorMessage = 'ルート最適化に失敗しました';
      
      if (error.response?.status === 422) {
        console.error('422エラーの詳細:', error.response.data);
        errorMessage = `データエラー: ${error.message}`;
      } else if (error.response?.status === 500) {
        errorMessage = 'サーバーエラーが発生しました';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      showAlert(errorMessage, 'error');
      setOptimizedRoutes([]);
      
    } finally {
      setLoading(false);
    }
  };

  // ゲスト管理関数
  const handleGuestsUpdate = useCallback((newGuests) => {
    console.log('👥 ゲストデータを更新:', newGuests);
    setGuests(newGuests);
    saveToStorage(STORAGE_KEYS.guests, newGuests);
    
    // 最適化結果は保持（データ変更時のみクリア）
    console.log('ℹ️ 最適化結果を保持します。再最適化が必要な場合は手動で実行してください。');
  }, [saveToStorage]);

  const handleAddGuest = useCallback((guestData) => {
    const newGuest = {
      ...guestData,
      id: Date.now().toString(),
      location: guestData.location || { lat: 24.3336, lng: 124.1543 }
    };
    const newGuests = [...guests, newGuest];
    handleGuestsUpdate(newGuests);
    showAlert(`${guestData.name}さんを追加しました`, 'success');
  }, [guests, handleGuestsUpdate, showAlert]);

  const handleUpdateGuest = useCallback((guestId, updatedData) => {
    const newGuests = guests.map(guest => 
      guest.id === guestId ? { ...guest, ...updatedData } : guest
    );
    handleGuestsUpdate(newGuests);
    showAlert('ゲスト情報を更新しました', 'success');
  }, [guests, handleGuestsUpdate, showAlert]);

  const handleDeleteGuest = useCallback((guestId) => {
    const newGuests = guests.filter(guest => guest.id !== guestId);
    handleGuestsUpdate(newGuests);
    showAlert('ゲストを削除しました', 'info');
  }, [guests, handleGuestsUpdate, showAlert]);

  // 車両管理関数
  const handleVehiclesUpdate = useCallback((newVehicles) => {
    console.log('🚗 車両データを更新:', newVehicles);
    setVehicles(newVehicles);
    saveToStorage(STORAGE_KEYS.vehicles, newVehicles);
    
    // 最適化結果は保持（データ変更時のみクリア）
    console.log('ℹ️ 最適化結果を保持します。再最適化が必要な場合は手動で実行してください。');
  }, [saveToStorage]);

  const handleAddVehicle = useCallback((vehicleData) => {
    const newVehicle = {
      ...vehicleData,
      id: Date.now().toString(),
      status: 'available',
      location: vehicleData.location || { lat: 24.3336, lng: 124.1543 }
    };
    const newVehicles = [...vehicles, newVehicle];
    handleVehiclesUpdate(newVehicles);
    showAlert(`${vehicleData.name}を追加しました`, 'success');
  }, [vehicles, handleVehiclesUpdate, showAlert]);

  const handleUpdateVehicle = useCallback((vehicleId, updatedData) => {
    const newVehicles = vehicles.map(vehicle => 
      vehicle.id === vehicleId ? { ...vehicle, ...updatedData } : vehicle
    );
    handleVehiclesUpdate(newVehicles);
    showAlert('車両情報を更新しました', 'success');
  }, [vehicles, handleVehiclesUpdate, showAlert]);

  const handleDeleteVehicle = useCallback((vehicleId) => {
    const newVehicles = vehicles.filter(vehicle => vehicle.id !== vehicleId);
    handleVehiclesUpdate(newVehicles);
    showAlert('車両を削除しました', 'info');
  }, [vehicles, handleVehiclesUpdate, showAlert]);

  // ツアーデータ更新
  const handleTourDataUpdate = useCallback((newTourData) => {
    console.log('📅 ツアーデータを更新:', newTourData);
    setTourData(newTourData);
    saveToStorage(STORAGE_KEYS.tourData, newTourData);
    
    // 日付が変わった場合は環境データを更新
    if (newTourData.date !== tourData.date && settings.weatherIntegration) {
      loadEnvironmentalData(newTourData.date);
    }
  }, [saveToStorage, tourData.date, settings.weatherIntegration, loadEnvironmentalData]);

  // 地図関連のハンドラー
  const handleActivityLocationUpdate = useCallback((location) => {
    setActivityLocation(location);
    const newTourData = { ...tourData, activityLocation: location };
    handleTourDataUpdate(newTourData);
    showAlert('アクティビティ地点を更新しました', 'success');
  }, [tourData, handleTourDataUpdate, showAlert]);

  const handleGuestLocationUpdate = useCallback((guestId, location) => {
    handleUpdateGuest(guestId, { location });
  }, [handleUpdateGuest]);

  const handleVehicleLocationUpdate = useCallback((vehicleId, location) => {
    handleUpdateVehicle(vehicleId, { location });
  }, [handleUpdateVehicle]);

  // 環境データ更新ハンドラー
  const handleEnvironmentalDataUpdate = useCallback((data) => {
    setEnvironmentalData(data);
  }, []);

  // 設定更新
  const handleSettingsUpdate = useCallback(async (newSettings) => {
    try {
      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);
      saveToStorage(STORAGE_KEYS.settings, updatedSettings);
      showAlert('設定を保存しました', 'success');
      
      // 気象統合設定が変更された場合
      if (newSettings.weatherIntegration !== settings.weatherIntegration) {
        if (newSettings.weatherIntegration) {
          await loadEnvironmentalData();
        }
      }
    } catch (error) {
      console.error('設定保存エラー:', error);
      showAlert('設定の保存に失敗しました', 'error');
    }
  }, [settings, saveToStorage, showAlert, loadEnvironmentalData]);

  // データエクスポート
  const handleExportSchedule = async () => {
    if (optimizedRoutes.length === 0) {
      showAlert('エクスポートするスケジュールがありません', 'warning');
      return;
    }

    try {
      setLoading(true);
      const exportData = {
        date: tourData.date,
        routes: optimizedRoutes,
        guests,
        vehicles,
        environmentalData
      };
      
      await api.exportSchedule(exportData);
      showAlert('スケジュールをエクスポートしました', 'success');
    } catch (error) {
      console.error('エクスポートエラー:', error);
      showAlert('エクスポートに失敗しました', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ナビゲーションメニュー
  const navigationItems = [
    { id: 'guests', label: 'ゲスト管理', icon: <PeopleIcon />, badge: guests.length },
    { id: 'vehicles', label: '車両管理', icon: <CarIcon />, badge: vehicles.length },
    { id: 'locations', label: '地点管理', icon: <LocationIcon /> },
    { id: 'map', label: '地図表示', icon: <MapIcon /> },
    { id: 'optimizer', label: 'ルート最適化', icon: <RouteIcon /> },
    { id: 'schedule', label: '最終スケジュール', icon: <ScheduleIcon />, badge: optimizedRoutes.length || null },
    { id: 'weather', label: '気象情報', icon: <WeatherIcon /> },
    { id: 'statistics', label: '統計・分析', icon: <StatisticsIcon /> },
    { id: 'settings', label: '設定', icon: <SettingsIcon /> }
  ];

  // コンテンツレンダリング
  const renderContent = () => {
    const commonProps = {
      tourData,
      environmentalData,
      onTourDataUpdate: handleTourDataUpdate
    };

    switch (currentView) {
      case 'guests':
        return (
          <GuestManager
            guests={guests}
            onGuestsUpdate={handleGuestsUpdate}
            onAddGuest={handleAddGuest}
            onUpdateGuest={handleUpdateGuest}
            onDeleteGuest={handleDeleteGuest}
            {...commonProps}
          />
        );

      case 'vehicles':
        return (
          <VehicleManager
            vehicles={vehicles}
            onVehiclesUpdate={handleVehiclesUpdate}
            onAddVehicle={handleAddVehicle}
            onUpdateVehicle={handleUpdateVehicle}
            onDeleteVehicle={handleDeleteVehicle}
            {...commonProps}
          />
        );

      case 'locations':
        return (
          <LocationManager
            tourData={tourData}
            onTourDataUpdate={handleTourDataUpdate}
            {...commonProps}
          />
        );

      case 'map':
        return (
          <GoogleMapIntegration
            guests={guests}
            vehicles={vehicles}
            optimizedRoutes={optimizedRoutes}
            activityLocation={activityLocation}
            onActivityLocationUpdate={handleActivityLocationUpdate}
            onGuestLocationUpdate={handleGuestLocationUpdate}
            onVehicleLocationUpdate={handleVehicleLocationUpdate}
            {...commonProps}
          />
        );

      case 'optimizer':
        return (
          <RouteOptimizer
            guests={guests}
            vehicles={vehicles}
            tourData={tourData}
            environmentalData={environmentalData}
            onOptimize={handleOptimizeRoute}
            onClearRoutes={handleClearOptimizedRoutes}
            optimizedRoutes={optimizedRoutes}
            isLoading={loading}
            {...commonProps}
          />
        );

      case 'schedule':
        return (
          <FinalSchedule
            optimizedRoutes={optimizedRoutes}
            guests={guests}
            vehicles={vehicles}
            tourData={tourData}
            environmentalData={environmentalData}
            onExport={handleExportSchedule}
            {...commonProps}
          />
        );

      case 'weather':
        return (
          <Box>
            <Typography variant="h4" gutterBottom>
              🌤️ 石垣島 気象情報
            </Typography>
            <EnvironmentalDataDisplay
              date={tourData.date}
              onDataUpdate={handleEnvironmentalDataUpdate}
              showDetails={true}
              compact={false}
            />
          </Box>
        );

      case 'statistics':
        return (
          <Statistics
            optimizedRoutes={optimizedRoutes}
            guests={guests}
            vehicles={vehicles}
            statistics={statistics}
            environmentalData={environmentalData}
            {...commonProps}
          />
        );

      case 'settings':
        return (
          <Settings
            settings={settings}
            onUpdateSettings={handleSettingsUpdate}
            systemStatus={systemStatus}
            environmentalData={environmentalData}
            {...commonProps}
          />
        );

      default:
        return <Typography>ページが見つかりません</Typography>;
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        {/* サイドバー */}
        <Drawer
          variant={isMobile ? 'temporary' : 'persistent'}
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          sx={{
            width: 280,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: 280,
              boxSizing: 'border-box',
            },
          }}
        >
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" color="primary" fontWeight="bold">
              🏝️ 石垣島ツアー
            </Typography>
            <Typography variant="body2" color="text.secondary">
              v2.0 送迎管理システム
            </Typography>
          </Box>
          <Divider />
          <List>
            {navigationItems.map((item) => (
              <ListItem
                key={item.id}
                button
                selected={currentView === item.id}
                onClick={() => setCurrentView(item.id)}
                sx={{
                  '&.Mui-selected': {
                    backgroundColor: 'primary.main',
                    color: 'primary.contrastText',
                    '& .MuiListItemIcon-root': {
                      color: 'inherit',
                    },
                  },
                }}
              >
                <ListItemIcon>
                  {item.badge ? (
                    <Badge badgeContent={item.badge} color="secondary">
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
          <Divider />
          <Box sx={{ p: 2 }}>
            <Stack spacing={1}>
              <Chip
                icon={<CircularProgress size={16} />}
                label={`システム: ${systemStatus.status}`}
                color={systemStatus.status === 'online' ? 'success' : 'error'}
                size="small"
              />
              {environmentalData && (
                <Chip
                  icon={<WeatherIcon />}
                  label={`${environmentalData.weather} ${environmentalData.temperature}°C`}
                  size="small"
                  variant="outlined"
                />
              )}
            </Stack>
          </Box>
        </Drawer>

        {/* メインコンテンツ */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            width: { sm: `calc(100% - 280px)` },
            ml: { sm: drawerOpen ? 0 : '-280px' },
            transition: 'margin 0.3s',
          }}
        >
          <AppBar
            position="fixed"
            sx={{
              width: { sm: `calc(100% - ${drawerOpen ? 280 : 0}px)` },
              ml: { sm: `${drawerOpen ? 280 : 0}px` },
              transition: 'width 0.3s, margin 0.3s',
            }}
          >
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
                {navigationItems.find(item => item.id === currentView)?.label || 'ダッシュボード'}
              </Typography>
              <Button
                color="inherit"
                startIcon={<RefreshIcon />}
                onClick={refreshSystemStatus}
              >
                更新
              </Button>
            </Toolbar>
          </AppBar>

          <Container maxWidth="xl" sx={{ mt: 8, py: 2 }}>
            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                <CircularProgress />
              </Box>
            )}
            {renderContent()}
          </Container>
        </Box>
      </Box>

      {/* アラート表示 */}
      <Snackbar
        open={alert.open}
        autoHideDuration={6000}
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseAlert}
          severity={alert.severity}
          variant="filled"
          action={
            <IconButton
              size="small"
              aria-label="close"
              color="inherit"
              onClick={handleCloseAlert}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          }
        >
          {alert.message}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
};

export default App;