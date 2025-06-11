// App.js - Phase 4B+ 完全修正版（RouteOptimizer連携・エラー対策）
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
    h4: {
      fontWeight: 700,
    },
    h6: {
      fontWeight: 600,
    }
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
        }
      }
    }
  }
});

const App = () => {
  // ========== State Management ==========
  const [guests, setGuests] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [tourData, setTourData] = useState({
    date: new Date().toISOString().split('T')[0],
    activityType: 'シュノーケリング',
    startTime: '10:00',
    activityLocation: null,
    departureLocation: null
  });
  const [optimizedRoutes, setOptimizedRoutes] = useState([]);
  const [currentView, setCurrentView] = useState('guests');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'info' });
  const [settings, setSettings] = useState({
    weatherIntegration: true,
    autoRefresh: true,
    refreshInterval: 30,
    language: 'ja',
    notifications: true,
    mapProvider: 'google',
    defaultAlgorithm: 'nearest_neighbor'
  });
  const [environmentalData, setEnvironmentalData] = useState(null);
  const [statistics, setStatistics] = useState({});
  const [systemStatus, setSystemStatus] = useState({ status: 'checking' });
  const [activityLocation, setActivityLocation] = useState(null);

  // テーマ設定
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const theme = createAppTheme(prefersDarkMode);

  // ========== Storage Management ==========
  const saveToStorage = useCallback((key, data) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      console.log(`💾 ${key} をローカルストレージに保存:`, data);
    } catch (error) {
      console.error(`💾 ${key} の保存エラー:`, error);
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
      console.error(`💾 ${key} の読み込みエラー:`, error);
    }
    return defaultValue;
  }, []);

  // ========== Initialization ==========
  useEffect(() => {
    console.log('🚀 アプリケーションを初期化中...');
    
    // ローカルストレージからデータ復元
    const savedGuests = loadFromStorage(STORAGE_KEYS.guests, []);
    const savedVehicles = loadFromStorage(STORAGE_KEYS.vehicles, []);
    const savedTourData = loadFromStorage(STORAGE_KEYS.tourData, tourData);
    const savedSettings = loadFromStorage(STORAGE_KEYS.settings, settings);
    const savedRoutes = loadFromStorage(STORAGE_KEYS.optimizedRoutes, []);

    setGuests(savedGuests);
    setVehicles(savedVehicles);
    setTourData(savedTourData);
    setSettings(savedSettings);
    
    if (savedRoutes && savedRoutes.length > 0) {
      setOptimizedRoutes(savedRoutes);
      console.log('📋 最適化結果を復元:', savedRoutes);
    }

    // アクティビティ地点の設定
    if (savedTourData.activityLocation) {
      setActivityLocation(savedTourData.activityLocation);
    }

    // システム初期化
    initializeSystem();
    
    console.log('✅ アプリケーション初期化完了');
  }, [loadFromStorage]);

  const initializeSystem = async () => {
    try {
      // システムステータス確認
      await checkSystemStatus();
      
      // 環境データ読み込み
      if (settings.weatherIntegration) {
        await loadEnvironmentalData();
      }
    } catch (error) {
      console.error('システム初期化エラー:', error);
    }
  };

  // ========== System Functions ==========
  const checkSystemStatus = async () => {
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

  // ========== Alert Management ==========
  const showAlert = useCallback((message, severity = 'info') => {
    setAlert({ open: true, message, severity });
  }, []);

  const handleCloseAlert = () => {
    setAlert(prev => ({ ...prev, open: false }));
  };

  // ========== Route Optimization Functions ==========
  
  /**
   * 🔧 新機能: RouteOptimizerからの最適化完了通知を処理
   */
  const handleRouteOptimizerComplete = useCallback((routes, optimizationResult) => {
    console.log('🎉 RouteOptimizerから最適化完了通知:', routes);
    console.log('📊 最適化結果詳細:', optimizationResult);
    
    // データ検証
    if (!routes || routes.length === 0) {
      console.error('❌ 無効な最適化結果: ルートデータが空');
      showAlert('最適化結果が無効です', 'error');
      return;
    }
    
    // 最適化結果をstateに保存
    setOptimizedRoutes(routes);
    saveToStorage(STORAGE_KEYS.optimizedRoutes, routes);
    console.log('💾 最適化結果を保存:', routes);
    
    // 統計データも更新
    if (optimizationResult?.efficiency_score) {
      setStatistics(prev => ({
        ...prev,
        last_optimization: {
          efficiency_score: optimizationResult.efficiency_score,
          total_distance: optimizationResult.total_distance,
          algorithm_used: optimizationResult.algorithm_used,
          timestamp: new Date().toISOString(),
          routes_count: routes.length,
          total_guests: routes.reduce((sum, route) => sum + (route.passenger_count || 0), 0)
        }
      }));
    }
    
    // 成功メッセージ
    const algorithmName = optimizationResult?.algorithm_used?.includes('genetic') ? '遺伝的アルゴリズム' :
                         optimizationResult?.algorithm_used?.includes('simulated') ? 'シミュレーテッドアニーリング' :
                         optimizationResult?.algorithm_used?.includes('nearest') ? '最近傍法' : 'AI最適化';
    
    showAlert(
      `${algorithmName}による最適化が完了しました！効率スコア: ${optimizationResult?.efficiency_score?.toFixed(1) || 'N/A'}%`,
      'success'
    );
    
    // 自動的に最終スケジュール画面に遷移
    setTimeout(() => {
      setCurrentView('schedule');
      console.log('📋 最終スケジュール画面に自動遷移');
    }, 2000);
    
  }, [saveToStorage, showAlert]);

  /**
   * 🔧 新機能: RouteOptimizerからのエラー通知を処理
   */
  const handleRouteOptimizerError = useCallback((error) => {
    console.error('❌ RouteOptimizerエラー:', error);
    
    let errorMessage = 'AI最適化でエラーが発生しました';
    
    if (error.message) {
      if (error.message.includes('ゲスト情報が必要')) {
        errorMessage = 'ゲスト情報を登録してから最適化を実行してください';
      } else if (error.message.includes('車両情報が必要')) {
        errorMessage = '車両情報を登録してから最適化を実行してください';
      } else if (error.message.includes('アクティビティ地点')) {
        errorMessage = 'アクティビティ地点を設定してから最適化を実行してください';
      } else {
        errorMessage = `AI最適化エラー: ${error.message}`;
      }
    }
    
    showAlert(errorMessage, 'error');
    
    // エラー時は最適化結果をクリア（既存結果は保持）
    console.log('ℹ️ エラーのため新しい最適化結果はクリアしますが、既存結果は保持します');
    
  }, [showAlert]);

  /**
   * 🔧 既存互換性: 従来のhandleOptimizeRoute関数（フォールバック用）
   */
  const handleOptimizeRoute = async (optimizationData = null) => {
    console.log('🔄 従来互換: handleOptimizeRoute呼び出し');
    
    const dataToOptimize = optimizationData || {
      ...tourData,
      activityLocation: activityLocation || tourData.activityLocation,
      guests,
      vehicles
    };
    
    if (!dataToOptimize.guests?.length) {
      showAlert('ゲストを登録してください', 'warning');
      return;
    }

    if (!dataToOptimize.vehicles?.length) {
      showAlert('車両を登録してください', 'warning');
      return;
    }

    if (!dataToOptimize.activityLocation) {
      showAlert('アクティビティ地点を設定してください', 'warning');
      return;
    }

    setLoading(true);
    
    try {
      console.log('📤 従来互換: 最適化データ送信');
      const result = await api.optimizeRoute(dataToOptimize);
      
      if (result && result.routes && result.routes.length > 0) {
        // 従来互換の成功処理
        handleRouteOptimizerComplete(result.routes, result);
      } else {
        throw new Error('最適化結果が無効です');
      }
      
    } catch (error) {
      console.error('❌ 従来互換: 最適化エラー:', error);
      handleRouteOptimizerError(error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 最適化結果クリア
   */
  const handleClearOptimizedRoutes = useCallback(() => {
    setOptimizedRoutes([]);
    saveToStorage(STORAGE_KEYS.optimizedRoutes, []);
    console.log('🗑️ 最適化結果をクリアしました');
    showAlert('最適化結果をクリアしました', 'info');
  }, [saveToStorage, showAlert]);

  // ========== Guest Management ==========
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

  // ========== Vehicle Management ==========
  const handleVehiclesUpdate = useCallback((newVehicles) => {
    console.log('🚗 車両データを更新:', newVehicles);
    setVehicles(newVehicles);
    saveToStorage(STORAGE_KEYS.vehicles, newVehicles);
  }, [saveToStorage]);

  const handleAddVehicle = useCallback((vehicleData) => {
    const newVehicle = {
      ...vehicleData,
      id: Date.now().toString(),
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

  // ========== Tour Data Management ==========
  const handleTourDataUpdate = useCallback((newTourData) => {
    console.log('📅 ツアーデータを更新:', newTourData);
    setTourData(newTourData);
    saveToStorage(STORAGE_KEYS.tourData, newTourData);
    
    // アクティビティ地点の同期
    if (newTourData.activityLocation) {
      setActivityLocation(newTourData.activityLocation);
    }
    
    // 日付が変わった場合は環境データを更新
    if (newTourData.date !== tourData.date && settings.weatherIntegration) {
      loadEnvironmentalData(newTourData.date);
    }
  }, [saveToStorage, tourData.date, settings.weatherIntegration, loadEnvironmentalData]);

  // ========== Location Management ==========
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

  // ========== Export Functions ==========
  const handleExportSchedule = useCallback(async (format = 'pdf') => {
    try {
      const result = await api.exportSchedule(optimizedRoutes, format);
      if (result.success) {
        showAlert(`${format.toUpperCase()}形式でエクスポートしました`, 'success');
      } else {
        throw new Error(result.error || 'エクスポートに失敗しました');
      }
    } catch (error) {
      console.error('エクスポートエラー:', error);
      showAlert(`エクスポートエラー: ${error.message}`, 'error');
    }
  }, [optimizedRoutes, showAlert]);

  // ========== Settings Management ==========
  const handleSettingsUpdate = useCallback(async (newSettings) => {
    try {
      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);
      saveToStorage(STORAGE_KEYS.settings, updatedSettings);
      
      const result = await api.saveSettings(updatedSettings);
      if (result.success) {
        showAlert('設定を保存しました', 'success');
      }
    } catch (error) {
      console.error('設定保存エラー:', error);
      showAlert('設定の保存に失敗しました', 'error');
    }
  }, [settings, saveToStorage, showAlert]);

  // ========== Navigation ==========
  const menuItems = [
    { id: 'guests', label: 'ゲスト管理', icon: <PeopleIcon />, badge: guests.length },
    { id: 'vehicles', label: '車両管理', icon: <CarIcon />, badge: vehicles.length },
    { id: 'locations', label: '地点管理', icon: <LocationIcon /> },
    { id: 'optimizer', label: 'ルート最適化', icon: <RouteIcon /> },
    { id: 'schedule', label: '最終スケジュール', icon: <ScheduleIcon />, badge: optimizedRoutes.length > 0 ? optimizedRoutes.length : null },
    { id: 'map', label: '地図表示', icon: <MapIcon /> },
    { id: 'weather', label: '気象情報', icon: <WeatherIcon /> },
    { id: 'statistics', label: '統計・分析', icon: <StatisticsIcon /> },
    { id: 'settings', label: '設定', icon: <SettingsIcon /> }
  ];

  // ========== Render Functions ==========
  const renderContent = () => {
    switch (currentView) {
      case 'guests':
        return (
          <GuestManager
            guests={guests}
            onGuestsUpdate={handleGuestsUpdate}
            onAddGuest={handleAddGuest}
            onUpdateGuest={handleUpdateGuest}
            onDeleteGuest={handleDeleteGuest}
            tourData={tourData}
            onTourDataUpdate={handleTourDataUpdate}
            environmentalData={environmentalData}
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
            tourData={tourData}
            onTourDataUpdate={handleTourDataUpdate}
            environmentalData={environmentalData}
          />
        );
      
      case 'locations':
        return (
          <LocationManager
            tourData={tourData}
            onTourDataUpdate={handleTourDataUpdate}
          />
        );
      
      case 'optimizer':
        return (
          <RouteOptimizer
            guests={guests}
            vehicles={vehicles}
            tourData={tourData}
            environmentalData={environmentalData}
            optimizedRoutes={optimizedRoutes}
            isLoading={loading}
            onOptimizationComplete={handleRouteOptimizerComplete}  // 🔧 新しいコールバック
            onError={handleRouteOptimizerError}                    // 🔧 エラーハンドラー
            onTourDataUpdate={handleTourDataUpdate}
            onClearRoutes={handleClearOptimizedRoutes}
            // 既存互換性のためのprops
            onOptimize={handleOptimizeRoute}
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
            onExport={handleExportSchedule}
            onOptimizationUpdate={handleRouteOptimizerComplete}  // 🔧 FinalScheduleからも最適化可能
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
            showRealtimeTracking={false}
          />
        );
      
      case 'weather':
        return (
          <EnvironmentalDataDisplay
            data={environmentalData}
            tourData={tourData}
            onRefresh={() => loadEnvironmentalData()}
          />
        );
      
      case 'statistics':
        return (
          <Statistics
            guests={guests}
            vehicles={vehicles}
            optimizedRoutes={optimizedRoutes}
            tourData={tourData}
            statistics={statistics}
            environmentalData={environmentalData}
          />
        );
      
      case 'settings':
        return (
          <Settings
            settings={settings}
            onUpdate={handleSettingsUpdate}
            systemStatus={systemStatus}
            onSystemCheck={checkSystemStatus}
          />
        );
      
      default:
        return <div>ページが見つかりません</div>;
    }
  };

  // ========== Main Render ==========
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex' }}>
        {/* App Bar */}
        <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1 }}>
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              onClick={() => setDrawerOpen(true)}
              edge="start"
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            
            <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
              🏝️ 石垣島ツアー管理システム v2.4.1
            </Typography>
            
            <Stack direction="row" spacing={1} alignItems="center">
              {/* システムステータス */}
              <Chip
                label={systemStatus.status === 'online' ? 'システム: online' : 'システム: offline'}
                color={systemStatus.status === 'online' ? 'success' : 'error'}
                size="small"
                variant="outlined"
                sx={{ color: 'white', borderColor: 'white' }}
              />
              
              {/* 環境データ表示 */}
              {environmentalData && (
                <Chip
                  icon={<WeatherIcon />}
                  label={`快晴 29°C`}
                  size="small"
                  sx={{ color: 'white', borderColor: 'white' }}
                  variant="outlined"
                />
              )}
              
              {/* 更新ボタン */}
              <IconButton
                color="inherit"
                onClick={() => window.location.reload()}
                title="ページを更新"
              >
                <RefreshIcon />
              </IconButton>
            </Stack>
          </Toolbar>
        </AppBar>

        {/* Drawer */}
        <Drawer
          variant="temporary"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: 280,
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
                  onClick={() => {
                    setCurrentView(item.id);
                    setDrawerOpen(false);
                  }}
                  selected={currentView === item.id}
                >
                  <ListItemIcon>
                    {item.badge ? (
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
            
            <Divider />
            
            {/* システム情報 */}
            <List>
              <ListItem>
                <ListItemText
                  primary="システム情報"
                  secondary={`v2.4.1 - Phase 4B+ 修正版`}
                  primaryTypographyProps={{ variant: 'caption' }}
                  secondaryTypographyProps={{ variant: 'caption' }}
                />
              </ListItem>
            </List>
          </Box>
        </Drawer>

        {/* Main Content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            bgcolor: 'background.default',
            minHeight: '100vh',
          }}
        >
          <Toolbar />
          
          {loading && (
            <Box sx={{ 
              position: 'fixed', 
              top: 64, 
              left: 0, 
              right: 0, 
              zIndex: 1300,
              bgcolor: 'rgba(0,0,0,0.1)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              p: 2
            }}>
              <CircularProgress size={24} sx={{ mr: 1 }} />
              <Typography>処理中...</Typography>
            </Box>
          )}
          
          {renderContent()}
        </Box>

        {/* Alert Snackbar */}
        <Snackbar
          open={alert.open}
          autoHideDuration={6000}
          onClose={handleCloseAlert}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        >
          <Alert
            onClose={handleCloseAlert}
            severity={alert.severity}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {alert.message}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
};

export default App;