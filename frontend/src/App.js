// App.js - 石垣島ツアー管理システム v2.0 気象情報統合版
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
  Refresh as RefreshIcon
} from '@mui/icons-material';

// コンポーネントインポート
import GuestManager from './components/GuestManager';
import VehicleManager from './components/VehicleManager';
import RouteOptimizer from './components/RouteOptimizer';
import FinalSchedule from './components/FinalSchedule';
import Statistics from './components/Statistics';
import Settings from './components/Settings';
import GoogleMapIntegration from './components/GoogleMapIntegration';
import EnvironmentalDataDisplay from './components/EnvironmentalDataDisplay';

// APIクライアント
import * as api from './api/client';

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
  const [currentView, setCurrentView] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'info' });

  // データ状態管理
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
    weatherIntegration: true // 気象統合設定
  });

  // ツアーデータ
  const [tourData, setTourData] = useState({
    date: new Date().toISOString().split('T')[0],
    activityType: 'シュノーケリング',
    startTime: '10:00',
    activityLocation: null,
    departureLocation: { lat: 24.3336, lng: 124.1543 } // 石垣市役所
  });

  // サイドバーメニュー項目
  const menuItems = [
    { id: 'dashboard', label: 'ダッシュボード', icon: DashboardIcon },
    { id: 'weather', label: '気象情報', icon: WeatherIcon }, // 気象情報追加
    { id: 'guests', label: 'ゲスト管理', icon: PeopleIcon },
    { id: 'vehicles', label: '車両管理', icon: CarIcon },
    { id: 'map', label: '地図表示', icon: MapIcon },
    { id: 'optimizer', label: 'ルート最適化', icon: ScheduleIcon },
    { id: 'schedule', label: '最終スケジュール', icon: ScheduleIcon },
    { id: 'statistics', label: '統計・分析', icon: StatisticsIcon },
    { id: 'settings', label: '設定', icon: SettingsIcon }
  ];

  // 初期化
  useEffect(() => {
    initializeApp();
  }, []);

  // 気象データ定期更新（30分ごと）
  useEffect(() => {
    if (settings.weatherIntegration) {
      const interval = setInterval(() => {
        loadEnvironmentalData(false); // サイレント更新
      }, 30 * 60 * 1000);

      return () => clearInterval(interval);
    }
  }, [settings.weatherIntegration, tourData.date]);

  const initializeApp = async () => {
    setLoading(true);
    try {
      // システムステータス確認
      const status = await api.getSystemStatus();
      setSystemStatus(status);

      // 設定読み込み
      await loadSettings();

      // サンプルデータ初期化
      initializeSampleData();

      // 環境データ読み込み
      if (settings.weatherIntegration) {
        await loadEnvironmentalData();
      }

      showAlert('アプリケーションが正常に初期化されました', 'success');
    } catch (error) {
      console.error('初期化エラー:', error);
      showAlert('初期化中にエラーが発生しました', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      const settingsData = await api.getSettings();
      setSettings(prev => ({ ...prev, ...settingsData }));
    } catch (error) {
      console.error('設定読み込みエラー:', error);
    }
  };

  const loadEnvironmentalData = async (showLoadingState = true) => {
    try {
      if (showLoadingState) setLoading(true);
      
      console.log('🌤️ 環境データを読み込み中...');
      const envData = await api.getEnvironmentalData(tourData.date);
      setEnvironmentalData(envData);
      
      console.log('✅ 環境データ読み込み完了:', envData);
      
      if (showLoadingState) {
        showAlert(`気象データを更新しました (${envData.weather}, ${envData.temperature}°C)`, 'info');
      }
    } catch (error) {
      console.error('❌ 環境データ読み込みエラー:', error);
      if (showLoadingState) {
        showAlert('気象データの取得に失敗しました', 'warning');
      }
    } finally {
      if (showLoadingState) setLoading(false);
    }
  };

  const initializeSampleData = () => {
    // サンプルゲストデータ
    const sampleGuests = [
      {
        id: '1',
        name: '田中太郎',
        hotel: 'ANAインターコンチネンタル石垣リゾート',
        people: 2,
        location: { lat: 24.3214, lng: 124.1397 },
        preferredTime: { start: '09:00', end: '10:00' }
      },
      {
        id: '2',
        name: '佐藤花子',
        hotel: 'フサキビーチリゾート',
        people: 3,
        location: { lat: 24.3431, lng: 124.1142 },
        preferredTime: { start: '09:30', end: '10:30' }
      }
    ];

    // サンプル車両データ
    const sampleVehicles = [
      {
        id: '1',
        name: 'ワゴン1号',
        capacity: 8,
        driver: '山田ドライバー',
        status: 'available',
        location: { lat: 24.3336, lng: 124.1543 }
      },
      {
        id: '2',
        name: 'ワゴン2号',
        capacity: 10,
        driver: '鈴木ドライバー',
        status: 'available',
        location: { lat: 24.3380, lng: 124.1570 }
      }
    ];

    setGuests(sampleGuests);
    setVehicles(sampleVehicles);
    
    // 初期アクティビティ地点（川平湾）
    setActivityLocation({ lat: 24.4167, lng: 124.1556 });
    setTourData(prev => ({
      ...prev,
      activityLocation: { lat: 24.4167, lng: 124.1556 }
    }));
  };

  // アラート表示
  const showAlert = (message, severity = 'info') => {
    setAlert({ open: true, message, severity });
  };

  const handleCloseAlert = () => {
    setAlert(prev => ({ ...prev, open: false }));
  };

  // ルート最適化実行
  const handleOptimizeRoute = async () => {
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
      const optimizationData = {
        ...tourData,
        activityLocation,
        guests,
        vehicles
      };

      const result = await api.optimizeRoute(optimizationData);
      setOptimizedRoutes(result.routes || []);
      
      // 統計データも更新
      const stats = await api.getStatistics();
      setStatistics(stats);

      showAlert('ルート最適化が完了しました！', 'success');
      setCurrentView('schedule');
    } catch (error) {
      console.error('最適化エラー:', error);
      showAlert('ルート最適化に失敗しました', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ゲスト管理関数
  const handleAddGuest = (guestData) => {
    const newGuest = {
      ...guestData,
      id: Date.now().toString(),
      location: guestData.location || { lat: 24.3336, lng: 124.1543 }
    };
    setGuests(prev => [...prev, newGuest]);
    showAlert(`${guestData.name}さんを追加しました`, 'success');
  };

  const handleUpdateGuest = (guestId, updatedData) => {
    setGuests(prev => prev.map(guest => 
      guest.id === guestId ? { ...guest, ...updatedData } : guest
    ));
    showAlert('ゲスト情報を更新しました', 'success');
  };

  const handleDeleteGuest = (guestId) => {
    setGuests(prev => prev.filter(guest => guest.id !== guestId));
    showAlert('ゲストを削除しました', 'info');
  };

  // 車両管理関数
  const handleAddVehicle = (vehicleData) => {
    const newVehicle = {
      ...vehicleData,
      id: Date.now().toString(),
      status: 'available',
      location: vehicleData.location || { lat: 24.3336, lng: 124.1543 }
    };
    setVehicles(prev => [...prev, newVehicle]);
    showAlert(`${vehicleData.name}を追加しました`, 'success');
  };

  const handleUpdateVehicle = (vehicleId, updatedData) => {
    setVehicles(prev => prev.map(vehicle => 
      vehicle.id === vehicleId ? { ...vehicle, ...updatedData } : vehicle
    ));
    showAlert('車両情報を更新しました', 'success');
  };

  const handleDeleteVehicle = (vehicleId) => {
    setVehicles(prev => prev.filter(vehicle => vehicle.id !== vehicleId));
    showAlert('車両を削除しました', 'info');
  };

  // 地図関連のハンドラー
  const handleActivityLocationUpdate = (location) => {
    setActivityLocation(location);
    setTourData(prev => ({ ...prev, activityLocation: location }));
    showAlert('アクティビティ地点を更新しました', 'success');
  };

  const handleGuestLocationUpdate = (guestId, location) => {
    handleUpdateGuest(guestId, { location });
  };

  const handleVehicleLocationUpdate = (vehicleId, location) => {
    handleUpdateVehicle(vehicleId, { location });
  };

  // 環境データ更新ハンドラー
  const handleEnvironmentalDataUpdate = (data) => {
    setEnvironmentalData(data);
  };

  // 設定更新
  const handleSettingsUpdate = async (newSettings) => {
    try {
      await api.updateSettings(newSettings);
      setSettings(prev => ({ ...prev, ...newSettings }));
      showAlert('設定を保存しました', 'success');
      
      // 気象統合設定が変更された場合
      if (newSettings.weatherIntegration !== settings.weatherIntegration) {
        if (newSettings.weatherIntegration) {
          loadEnvironmentalData();
        }
      }
    } catch (error) {
      console.error('設定保存エラー:', error);
      showAlert('設定の保存に失敗しました', 'error');
    }
  };

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
        environmentalData // 気象データも含める
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

  // システム状態確認
  const refreshSystemStatus = async () => {
    try {
      const status = await api.getSystemStatus();
      setSystemStatus(status);
      showAlert('システム状態を更新しました', 'info');
    } catch (error) {
      console.error('ステータス更新エラー:', error);
      showAlert('システム状態の更新に失敗しました', 'error');
    }
  };

  // 日付変更ハンドラー
  const handleDateChange = (newDate) => {
    setTourData(prev => ({ ...prev, date: newDate }));
    if (settings.weatherIntegration) {
      loadEnvironmentalData();
    }
  };

  // 気象データ手動更新
  const handleWeatherRefresh = () => {
    loadEnvironmentalData(true);
  };

  // ビューレンダリング
  const renderCurrentView = () => {
    const commonProps = {
      loading,
      onAlert: showAlert,
      environmentalData
    };

    switch (currentView) {
      case 'dashboard':
        return (
          <Box>
            <Typography variant="h4" gutterBottom>
              🏝️ 石垣島ツアー管理ダッシュボード
            </Typography>
            
            <Stack spacing={3}>
              {/* システム状態カード */}
              <Alert 
                severity={systemStatus.status === 'online' ? 'success' : 'error'}
                action={
                  <IconButton onClick={refreshSystemStatus} size="small">
                    <RefreshIcon />
                  </IconButton>
                }
              >
                システム状態: {systemStatus.status === 'online' ? 'オンライン' : 'オフライン'}
                {systemStatus.last_checked && (
                  <Typography variant="caption" display="block">
                    最終確認: {new Date(systemStatus.last_checked).toLocaleString()}
                  </Typography>
                )}
              </Alert>

              {/* 気象情報サマリー */}
              {environmentalData && (
                <Alert 
                  severity="info"
                  action={
                    <IconButton onClick={handleWeatherRefresh} size="small">
                      <RefreshIcon />
                    </IconButton>
                  }
                >
                  🌤️ {environmentalData.weather} {environmentalData.temperature}°C | 
                  風速: {environmentalData.wind_speed}km/h | 
                  視界: {environmentalData.visibility === 'excellent' ? '最良' : '良好'}
                  <Typography variant="caption" display="block">
                    データソース: {environmentalData.source} | 
                    更新: {new Date(environmentalData.last_updated).toLocaleTimeString()}
                  </Typography>
                </Alert>
              )}

              {/* 統計サマリー */}
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Chip 
                  icon={<PeopleIcon />} 
                  label={`ゲスト: ${guests.length}組 (${guests.reduce((sum, g) => sum + g.people, 0)}名)`} 
                  color="primary" 
                />
                <Chip 
                  icon={<CarIcon />} 
                  label={`車両: ${vehicles.length}台`} 
                  color="secondary" 
                />
                <Chip 
                  icon={<ScheduleIcon />} 
                  label={`最適化済み: ${optimizedRoutes.length}ルート`} 
                  color={optimizedRoutes.length > 0 ? 'success' : 'default'}
                />
                {environmentalData && (
                  <Chip 
                    icon={<WeatherIcon />} 
                    label={`気象: ${environmentalData.weather}`} 
                    color="info"
                    variant="outlined"
                  />
                )}
              </Box>

              {/* クイックアクション */}
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button 
                  variant="contained" 
                  onClick={() => setCurrentView('optimizer')}
                  disabled={guests.length === 0 || vehicles.length === 0}
                >
                  ルート最適化実行
                </Button>
                <Button 
                  variant="outlined" 
                  onClick={() => setCurrentView('map')}
                >
                  地図で確認
                </Button>
                <Button 
                  variant="outlined" 
                  onClick={() => setCurrentView('weather')}
                >
                  気象情報詳細
                </Button>
                <Button 
                  variant="outlined" 
                  onClick={handleExportSchedule}
                  disabled={optimizedRoutes.length === 0}
                >
                  スケジュールエクスポート
                </Button>
              </Box>
            </Stack>
          </Box>
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

      case 'guests':
        return (
          <GuestManager
            guests={guests}
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
            onAddVehicle={handleAddVehicle}
            onUpdateVehicle={handleUpdateVehicle}
            onDeleteVehicle={handleDeleteVehicle}
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
              backgroundColor: theme.palette.background.paper,
              borderRight: `1px solid ${theme.palette.divider}`
            }
          }}
        >
          <Box sx={{ overflow: 'auto', height: '100%' }}>
            {/* ヘッダー */}
            <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
              <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
                🏝️ 石垣島ツアー
              </Typography>
              <Typography variant="caption" color="text.secondary">
                v2.0 気象統合版
              </Typography>
            </Box>

            {/* ナビゲーションメニュー */}
            <List>
              {menuItems.map((item) => (
                <ListItem
                  button
                  key={item.id}
                  selected={currentView === item.id}
                  onClick={() => {
                    setCurrentView(item.id);
                    if (isMobile) setDrawerOpen(false);
                  }}
                  sx={{
                    '&.Mui-selected': {
                      backgroundColor: theme.palette.primary.main + '20',
                      borderRight: `3px solid ${theme.palette.primary.main}`
                    }
                  }}
                >
                  <ListItemIcon>
                    <item.icon color={currentView === item.id ? 'primary' : 'inherit'} />
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.label}
                    primaryTypographyProps={{
                      fontWeight: currentView === item.id ? 600 : 400
                    }}
                  />
                </ListItem>
              ))}
            </List>

            <Divider />

            {/* システム情報 */}
            <Box sx={{ p: 2 }}>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                システム状態
              </Typography>
              <Chip
                size="small"
                label={systemStatus.status === 'online' ? 'オンライン' : 'オフライン'}
                color={systemStatus.status === 'online' ? 'success' : 'error'}
                sx={{ mb: 1 }}
              />
              
              <Typography variant="caption" color="text.secondary" display="block">
                ゲスト: {guests.length}組 | 車両: {vehicles.length}台
              </Typography>
              
              {optimizedRoutes.length > 0 && (
                <Typography variant="caption" color="success.main" display="block">
                  最適化済み: {optimizedRoutes.length}ルート
                </Typography>
              )}

              {environmentalData && (
                <Typography variant="caption" color="info.main" display="block">
                  気象: {environmentalData.weather} {environmentalData.temperature}°C
                </Typography>
              )}
            </Box>
          </Box>
        </Drawer>

        {/* メインコンテンツエリア */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            width: { sm: `calc(100% - ${drawerOpen ? 280 : 0}px)` },
            minHeight: '100vh',
            backgroundColor: theme.palette.background.default
          }}
        >
          {/* トップバー */}
          <AppBar 
            position="sticky" 
            sx={{ 
              backgroundColor: theme.palette.background.paper,
              color: theme.palette.text.primary,
              boxShadow: 1,
              borderBottom: `1px solid ${theme.palette.divider}`
            }}
          >
            <Toolbar>
              <IconButton
                edge="start"
                onClick={() => setDrawerOpen(!drawerOpen)}
                sx={{ mr: 2 }}
              >
                <MenuIcon />
              </IconButton>
              
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                {menuItems.find(item => item.id === currentView)?.label || 'ダッシュボード'}
              </Typography>

              {/* ヘッダー統計 */}
              <Stack direction="row" spacing={1} sx={{ mr: 2, display: { xs: 'none', md: 'flex' } }}>
                <Chip 
                  size="small" 
                  label={`${guests.reduce((sum, g) => sum + g.people, 0)}名`}
                  color="primary"
                  variant="outlined"
                />
                <Chip 
                  size="small" 
                  label={`${vehicles.filter(v => v.status === 'available').length}台稼働`}
                  color="secondary"
                  variant="outlined"
                />
                {environmentalData && (
                  <Chip 
                    size="small" 
                    label={`${environmentalData.temperature}°C`}
                    color="info"
                    variant="outlined"
                  />
                )}
              </Stack>

              {/* 通知アイコン */}
              <IconButton>
                <Badge badgeContent={optimizedRoutes.length} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>

              {/* ローディングインジケーター */}
              {loading && (
                <Box sx={{ ml: 2 }}>
                  <CircularProgress size={20} />
                </Box>
              )}
            </Toolbar>
          </AppBar>

          {/* メインコンテンツ */}
          <Container 
            maxWidth="xl" 
            sx={{ 
              py: 3,
              px: { xs: 2, sm: 3 }
            }}
          >
            {renderCurrentView()}
          </Container>
        </Box>
      </Box>

      {/* アラート・スナックバー */}
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
          sx={{ width: '100%' }}
        >
          {alert.message}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
};

export default App;