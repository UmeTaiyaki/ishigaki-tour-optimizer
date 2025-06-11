// App.js - ツアー情報ページ統合版
import React, { useState, useEffect, useCallback } from 'react';
import {
  ThemeProvider, createTheme, CssBaseline, Box, AppBar, Toolbar,
  Typography, IconButton, Drawer, List, ListItem, ListItemIcon,
  ListItemText, Divider, Alert, Snackbar, Chip, Badge, Button,
  CircularProgress, Container, useMediaQuery, Stack, LinearProgress
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Info as TourInfoIcon,
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
import TourInfo from './components/TourInfo'; // 🆕 新規追加
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
  const [currentView, setCurrentView] = useState('tour-info'); // 🆕 デフォルトをツアー情報に変更
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
  const [statistics, setStatistics] = useState({
    totalTours: 0,
    totalGuests: 0,
    totalDistance: 0,
    averageEfficiency: 0,
    last_optimization: null
  });
  const [systemStatus, setSystemStatus] = useState({ status: 'online' });
  const [activityLocation, setActivityLocation] = useState(null);

  // ダークモードテーマ
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const theme = createAppTheme(prefersDarkMode);

  // 🆕 更新されたメニュー項目（ツアー情報を最上位に）
  const menuItems = [
    { id: 'tour-info', label: 'ツアー情報', icon: <TourInfoIcon />, priority: true },
    { id: 'optimizer', label: 'ルート最適化', icon: <RouteIcon />, 
      badge: optimizedRoutes.length > 0 ? optimizedRoutes.length : null },
    { id: 'schedule', label: '最終スケジュール', icon: <ScheduleIcon />, 
      badge: optimizedRoutes.length > 0 ? optimizedRoutes.length : null },
    { id: 'guests', label: 'ゲスト管理', icon: <PeopleIcon />, isResource: true },
    { id: 'vehicles', label: '車両管理', icon: <CarIcon />, isResource: true },
    { id: 'locations', label: '地点管理', icon: <LocationIcon />, isResource: true },
    { id: 'map', label: '地図表示', icon: <MapIcon /> },
    { id: 'weather', label: '気象情報', icon: <WeatherIcon /> },
    { id: 'statistics', label: '統計・分析', icon: <StatisticsIcon /> },
    { id: 'settings', label: '設定', icon: <SettingsIcon /> }
  ];

  // ========== Effects ==========
  useEffect(() => {
    initializeApp();
  }, []);

  useEffect(() => {
    if (settings.autoRefresh) {
      const interval = setInterval(() => {
        fetchEnvironmentalData();
      }, settings.refreshInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [settings.autoRefresh, settings.refreshInterval]);

  // ========== Core Functions ==========
  const initializeApp = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadFromStorage(),
        fetchEnvironmentalData(),
        checkSystemStatus()
      ]);
    } catch (error) {
      console.error('アプリ初期化エラー:', error);
      showAlert('アプリの初期化に失敗しました', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadFromStorage = useCallback(() => {
    try {
      Object.entries(STORAGE_KEYS).forEach(([key, storageKey]) => {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const data = JSON.parse(stored);
          switch (key) {
            case 'guests':
              setGuests(data);
              break;
            case 'vehicles':
              setVehicles(data);
              break;
            case 'tourData':
              setTourData(prev => ({ ...prev, ...data }));
              break;
            case 'settings':
              setSettings(prev => ({ ...prev, ...data }));
              break;
            case 'optimizedRoutes':
              setOptimizedRoutes(data);
              break;
          }
        }
      });
    } catch (error) {
      console.error('ストレージからの読み込みエラー:', error);
    }
  }, []);

  const saveToStorage = useCallback((key, data) => {
    try {
      localStorage.setItem(STORAGE_KEYS[key], JSON.stringify(data));
    } catch (error) {
      console.error('ストレージへの保存エラー:', error);
    }
  }, []);

  const checkSystemStatus = async () => {
    try {
      const status = await api.getSystemStatus();
      setSystemStatus(status);
    } catch (error) {
      console.error('システム状態確認エラー:', error);
      setSystemStatus({ status: 'offline' });
    }
  };

  const fetchEnvironmentalData = async () => {
    try {
      const data = await api.getEnvironmentalData();
      setEnvironmentalData(data);
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
  
  // 🔧 ツアー情報で選択されたデータを保持
  const [selectedTourGuests, setSelectedTourGuests] = useState([]);
  const [selectedTourVehicles, setSelectedTourVehicles] = useState([]);

  /**
   * 🆕 ツアー情報からの最適化準備完了通知（修正版）
   */
  const handleOptimizationReady = useCallback((readyData) => {
    console.log('🎯 ツアー情報から最適化準備完了:', readyData);
    console.log('📊 選択されたゲスト:', readyData.guests.length, '組');
    console.log('📊 選択された車両:', readyData.vehicles.length, '台');
    
    // ツアーデータを更新
    setTourData(readyData.tourData);
    saveToStorage('tourData', readyData.tourData);
    
    // 🔧 選択されたゲスト・車両データを保存（最適化用）
    setSelectedTourGuests(readyData.guests);
    setSelectedTourVehicles(readyData.vehicles);
    
    showAlert(
      `AI最適化の準備が完了しました！ゲスト${readyData.guests.length}組・車両${readyData.vehicles.length}台で実行できます。`, 
      'success'
    );
  }, [saveToStorage, showAlert]);

  /**
   * RouteOptimizerからの最適化完了通知を処理
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
    saveToStorage('optimizedRoutes', routes);
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
   * RouteOptimizerからのエラー通知を処理
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
   * 既存互換性: 従来のhandleOptimizeRoute関数（フォールバック用）
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
    saveToStorage('optimizedRoutes', []);
    console.log('🗑️ 最適化結果をクリアしました');
    showAlert('最適化結果をクリアしました', 'info');
  }, [saveToStorage, showAlert]);

  // ========== Data Management ==========
  const handleGuestsUpdate = useCallback((newGuests) => {
    console.log('👥 App.js: ゲストデータを更新:', newGuests.length, '件');
    console.log('📝 App.js: 更新内容:', newGuests.map(g => ({ id: g.id, name: g.name })));
    setGuests(newGuests);
    saveToStorage('guests', newGuests);
  }, [saveToStorage]);

  const handleVehiclesUpdate = useCallback((newVehicles) => {
    console.log('🚗 App.js: 車両データを更新:', newVehicles.length, '台');
    console.log('📝 App.js: 更新内容:', newVehicles.map(v => ({ id: v.id, name: v.name })));
    setVehicles(newVehicles);
    saveToStorage('vehicles', newVehicles);
  }, [saveToStorage]);

  const handleTourDataUpdate = useCallback((newTourData) => {
    console.log('📋 ツアーデータを更新:', newTourData);
    setTourData(newTourData);
    saveToStorage('tourData', newTourData);
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
      guest.id === guestId ? { ...guest, ...updatedData, updated_at: new Date().toISOString() } : guest
    );
    handleGuestsUpdate(newGuests);
    showAlert('ゲスト情報を更新しました', 'success');
  }, [guests, handleGuestsUpdate, showAlert]);

  const handleDeleteGuest = useCallback((guestId) => {
    const newGuests = guests.filter(guest => guest.id !== guestId);
    handleGuestsUpdate(newGuests);
    showAlert('ゲストを削除しました', 'info');
  }, [guests, handleGuestsUpdate, showAlert]);

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
      vehicle.id === vehicleId ? { ...vehicle, ...updatedData, updated_at: new Date().toISOString() } : vehicle
    );
    handleVehiclesUpdate(newVehicles);
    showAlert('車両情報を更新しました', 'success');
  }, [vehicles, handleVehiclesUpdate, showAlert]);

  const handleDeleteVehicle = useCallback((vehicleId) => {
    const newVehicles = vehicles.filter(vehicle => vehicle.id !== vehicleId);
    handleVehiclesUpdate(newVehicles);
    showAlert('車両を削除しました', 'info');
  }, [vehicles, handleVehiclesUpdate, showAlert]);

  const handleActivityLocationUpdate = useCallback((location) => {
    setActivityLocation(location);
    handleTourDataUpdate({ ...tourData, activityLocation: location });
  }, [tourData, handleTourDataUpdate]);

  const handleGuestLocationUpdate = useCallback((guestId, location) => {
    handleUpdateGuest(guestId, { location });
  }, [handleUpdateGuest]);

  const handleVehicleLocationUpdate = useCallback((vehicleId, location) => {
    handleUpdateVehicle(vehicleId, { location });
  }, [handleUpdateVehicle]);

  const handleExportSchedule = useCallback(async (format = 'pdf') => {
    try {
      const result = await api.exportSchedule(optimizedRoutes, format);
      if (result.success) {
        showAlert(`スケジュールを${format.toUpperCase()}形式でエクスポートしました`, 'success');
      } else {
        throw new Error(result.error || 'エクスポートに失敗しました');
      }
    } catch (error) {
      console.error('エクスポートエラー:', error);
      showAlert(`エクスポートエラー: ${error.message}`, 'error');
    }
  }, [optimizedRoutes, showAlert]);

  // ========== Render Functions ==========
  const renderContent = () => {
    switch (currentView) {
      case 'tour-info': // 🆕 ツアー情報ページ
        return (
          <TourInfo
            guests={guests}
            vehicles={vehicles}
            tourData={tourData}
            onGuestsUpdate={handleGuestsUpdate}
            onVehiclesUpdate={handleVehiclesUpdate}
            onTourDataUpdate={handleTourDataUpdate}
            onOptimizationReady={handleOptimizationReady}
            environmentalData={environmentalData}
          />
        );
        
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
            guests={selectedTourGuests.length > 0 ? selectedTourGuests : guests}
            vehicles={selectedTourVehicles.length > 0 ? selectedTourVehicles : vehicles}
            tourData={tourData}
            environmentalData={environmentalData}
            optimizedRoutes={optimizedRoutes}
            isLoading={loading}
            onOptimizationComplete={handleRouteOptimizerComplete}
            onError={handleRouteOptimizerError}
            onTourDataUpdate={handleTourDataUpdate}
            onClearRoutes={handleClearOptimizedRoutes}
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
            onOptimizationUpdate={handleRouteOptimizerComplete}
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
            onRefresh={fetchEnvironmentalData}
          />
        );
      
      case 'statistics':
        return (
          <Statistics
            guests={guests}
            vehicles={vehicles}
            optimizedRoutes={optimizedRoutes}
            statistics={statistics}
            environmentalData={environmentalData}
          />
        );
      
      case 'settings':
        return (
          <Settings
            settings={settings}
            onSettingsUpdate={(newSettings) => {
              setSettings(newSettings);
              saveToStorage('settings', newSettings);
            }}
            systemStatus={systemStatus}
            onSystemRefresh={checkSystemStatus}
          />
        );
      
      default:
        return (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h5" gutterBottom>
              ページが見つかりません
            </Typography>
            <Button 
              variant="contained" 
              onClick={() => setCurrentView('tour-info')}
            >
              ツアー情報に戻る
            </Button>
          </Box>
        );
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* AppBar */}
        <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1 }}>
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={() => setDrawerOpen(true)}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>

            <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
              🏝️ 石垣島ツアー管理システム v2.5.0
            </Typography>

            <Stack direction="row" spacing={1} alignItems="center">
              {/* 🆕 ツアー情報完了状態表示 */}
              {currentView === 'tour-info' && (
                <Chip
                  icon={<TourInfoIcon />}
                  label="ツアー設定中"
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ color: 'white', borderColor: 'white' }}
                />
              )}
              
              <Chip
                label={systemStatus.status === 'online' ? 'システム: online' : 'システム: offline'}
                color={systemStatus.status === 'online' ? 'success' : 'error'}
                size="small"
                variant="outlined"
                sx={{ color: 'white', borderColor: 'white' }}
              />
              
              {environmentalData && (
                <Chip
                  icon={<WeatherIcon />}
                  label={`快晴 29°C`}
                  size="small"
                  sx={{ color: 'white', borderColor: 'white' }}
                  variant="outlined"
                />
              )}
              
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
              {/* 🆕 優先表示項目 */}
              {menuItems.filter(item => item.priority).map((item) => (
                <ListItem
                  button
                  key={item.id}
                  onClick={() => {
                    setCurrentView(item.id);
                    setDrawerOpen(false);
                  }}
                  selected={currentView === item.id}
                  sx={{ 
                    bgcolor: currentView === item.id ? 'primary.light' : 'inherit',
                    '&:hover': { bgcolor: 'primary.light' }
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
                  <ListItemText 
                    primary={item.label}
                    primaryTypographyProps={{
                      fontWeight: currentView === item.id ? 'bold' : 'normal'
                    }}
                  />
                </ListItem>
              ))}

              <Divider sx={{ my: 1 }} />

              {/* メイン機能 */}
              <Typography variant="overline" sx={{ px: 2, color: 'text.secondary' }}>
                メイン機能
              </Typography>
              {menuItems.filter(item => !item.priority && !item.isResource).map((item) => (
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
                      <Badge badgeContent={item.badge} color="error">
                        {item.icon}
                      </Badge>
                    ) : (
                      item.icon
                    )}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.label}
                    primaryTypographyProps={{
                      fontWeight: currentView === item.id ? 'bold' : 'normal'
                    }}
                  />
                </ListItem>
              ))}

              <Divider sx={{ my: 1 }} />

              {/* リソース管理 */}
              <Typography variant="overline" sx={{ px: 2, color: 'text.secondary' }}>
                リソース管理
              </Typography>
              {menuItems.filter(item => item.isResource).map((item) => (
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
                      <Badge badgeContent={item.badge} color="error">
                        {item.icon}
                      </Badge>
                    ) : (
                      item.icon
                    )}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.label}
                    primaryTypographyProps={{
                      fontWeight: currentView === item.id ? 'bold' : 'normal',
                      color: 'text.secondary'
                    }}
                  />
                </ListItem>
              ))}
            </List>

            <Divider />

            {/* システム情報 */}
            <Box sx={{ p: 2, mt: 'auto' }}>
              <Typography variant="caption" color="text.secondary">
                システム情報
              </Typography>
              <Typography variant="body2">
                v2.5.0 - Smart AI Edition
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Phase 5A: ツアー情報統合版
              </Typography>
            </Box>
          </Box>
        </Drawer>

        {/* Main Content */}
        <Box component="main" sx={{ flexGrow: 1, bgcolor: 'background.default' }}>
          <Toolbar />
          
          {loading && (
            <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999 }}>
              <LinearProgress />
            </Box>
          )}

          <Container maxWidth="xl" sx={{ py: 2 }}>
            {renderContent()}
          </Container>
        </Box>

        {/* Alert Snackbar */}
        <Snackbar
          open={alert.open}
          autoHideDuration={6000}
          onClose={handleCloseAlert}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        >
          <Alert onClose={handleCloseAlert} severity={alert.severity} sx={{ width: '100%' }}>
            {alert.message}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
};

export default App;