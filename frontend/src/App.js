// App.js - 石垣島ツアー管理システム v2.0 エラーハンドリング強化版
import React, { useState, useEffect, useCallback } from 'react';
import {
  ThemeProvider, createTheme, CssBaseline, Box, AppBar, Toolbar,
  Typography, IconButton, Drawer, List, ListItem, ListItemIcon,
  ListItemText, Divider, Alert, Snackbar, Chip, Badge, Button,
  CircularProgress, Container, useMediaQuery
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  DirectionsCar as CarIcon,
  Schedule as ScheduleIcon,
  Assessment as StatisticsIcon,
  Settings as SettingsIcon,
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
    },
    success: { main: '#4caf50' },
    warning: { main: '#ff9800' },
    error: { main: '#f44336' }
  },
  typography: {
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 500 },
    fontFamily: '"Roboto", "Helvetica", "Arial", "Noto Sans JP", sans-serif'
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500
        }
      }
    }
  }
});

const App = () => {
  // テーマ設定
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const theme = createAppTheme(prefersDarkMode);

  // ステート管理
  const [currentView, setCurrentView] = useState('dashboard');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [guests, setGuests] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [optimizedRoutes, setOptimizedRoutes] = useState([]);
  const [tourData, setTourData] = useState({
    date: new Date().toISOString().split('T')[0],
    activityType: 'シュノーケリング',
    startTime: '09:00',
    activityLocation: '川平湾'
  });
  const [environmentalData, setEnvironmentalData] = useState(null);
  const [systemStatus, setSystemStatus] = useState({ status: 'checking' });
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [notification, setNotification] = useState({ 
    open: false, 
    message: '', 
    severity: 'info' 
  });
  const [loading, setLoading] = useState(true);
  const [lastDataUpdate, setLastDataUpdate] = useState(null);

  // 安全な配列操作のためのヘルパー関数
  const safeArray = (value) => Array.isArray(value) ? value : [];
  const safeObject = (value) => (value && typeof value === 'object') ? value : {};

  // 初期化
  useEffect(() => {
    initializeApp();
  }, []);

  // 定期的なデータ更新
  useEffect(() => {
    const interval = setInterval(() => {
      if (currentView === 'dashboard') {
        loadEnvironmentalData();
      }
    }, 300000); // 5分ごと

    return () => clearInterval(interval);
  }, [currentView]);

  const initializeApp = async () => {
    setLoading(true);
    try {
      await loadInitialData();
      showNotification('システムが正常に起動しました', 'success');
    } catch (error) {
      console.error('Initialization error:', error);
      showNotification('初期化中にエラーが発生しました', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadInitialData = async () => {
    try {
      const [envData, status, batchData] = await Promise.allSettled([
        api.getEnvironmentalData(tourData.date),
        api.getSystemStatus(),
        api.getBatchData(tourData.date)
      ]);

      if (envData.status === 'fulfilled' && envData.value) {
        setEnvironmentalData(safeObject(envData.value));
      }

      if (status.status === 'fulfilled' && status.value) {
        setSystemStatus(safeObject(status.value));
      }

      setLastDataUpdate(new Date());
    } catch (error) {
      console.error('Initial data loading error:', error);
    }
  };

  const loadEnvironmentalData = useCallback(async () => {
    try {
      const data = await api.getEnvironmentalData(tourData.date);
      setEnvironmentalData(safeObject(data));
      setLastDataUpdate(new Date());
    } catch (error) {
      console.error('Environmental data loading error:', error);
    }
  }, [tourData.date]);

  // ルート最適化（エラーハンドリング強化）
  const handleOptimize = async () => {
    // 入力検証
    if (!Array.isArray(guests) || guests.length === 0) {
      showNotification('ゲストを追加してください', 'warning');
      return;
    }

    if (!Array.isArray(vehicles) || vehicles.length === 0) {
      showNotification('車両を追加してください', 'warning');
      return;
    }

    // ゲストデータの検証
    const invalidGuests = guests.filter(guest => 
      !guest || !guest.name || !guest.hotel_name || !guest.people
    );
    
    if (invalidGuests.length > 0) {
      showNotification('一部のゲスト情報が不完全です', 'warning');
      return;
    }

    // 車両データの検証
    const invalidVehicles = vehicles.filter(vehicle => 
      !vehicle || !vehicle.name || !vehicle.capacity
    );
    
    if (invalidVehicles.length > 0) {
      showNotification('一部の車両情報が不完全です', 'warning');
      return;
    }

    setIsOptimizing(true);
    try {
      const optimizationData = {
        ...safeObject(tourData),
        guests: safeArray(guests),
        vehicles: safeArray(vehicles)
      };

      console.log('Optimization request:', optimizationData);

      const result = await api.optimizeRoute(optimizationData);
      
      console.log('Optimization result:', result);

      if (result && result.success) {
        const routes = safeArray(result.routes);
        setOptimizedRoutes(routes);
        showNotification(`${routes.length}件のルートを最適化しました`, 'success');
      } else {
        const errorMessage = result?.message || '最適化に失敗しました';
        showNotification(errorMessage, 'error');
        setOptimizedRoutes([]);
      }
    } catch (error) {
      console.error('Optimization error:', error);
      showNotification(`最適化中にエラーが発生しました: ${error.message}`, 'error');
      setOptimizedRoutes([]);
    } finally {
      setIsOptimizing(false);
    }
  };

  // 通知表示
  const showNotification = (message, severity = 'info') => {
    setNotification({ open: true, message, severity });
  };

  // 通知クローズ
  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  // ゲスト更新（エラーハンドリング付き）
  const handleGuestsUpdate = useCallback((newGuests) => {
    try {
      const safeGuests = safeArray(newGuests);
      setGuests(safeGuests);
      
      // 最適化結果をクリア
      if (Array.isArray(optimizedRoutes) && optimizedRoutes.length > 0) {
        setOptimizedRoutes([]);
        showNotification('ゲスト情報が更新されました。再最適化してください。', 'info');
      }
    } catch (error) {
      console.error('Guest update error:', error);
      showNotification('ゲスト情報の更新に失敗しました', 'error');
    }
  }, [optimizedRoutes]);

  // 車両更新（エラーハンドリング付き）
  const handleVehiclesUpdate = useCallback((newVehicles) => {
    try {
      const safeVehicles = safeArray(newVehicles);
      setVehicles(safeVehicles);
      
      // 最適化結果をクリア
      if (Array.isArray(optimizedRoutes) && optimizedRoutes.length > 0) {
        setOptimizedRoutes([]);
        showNotification('車両情報が更新されました。再最適化してください。', 'info');
      }
    } catch (error) {
      console.error('Vehicle update error:', error);
      showNotification('車両情報の更新に失敗しました', 'error');
    }
  }, [optimizedRoutes]);

  // ツアーデータ更新（エラーハンドリング付き）
  const handleTourDataUpdate = useCallback((newTourData) => {
    try {
      const safeTourData = safeObject(newTourData);
      setTourData(safeTourData);
      
      // 日付が変更された場合は環境データを再取得
      if (safeTourData.date !== tourData.date) {
        loadEnvironmentalData();
      }
    } catch (error) {
      console.error('Tour data update error:', error);
      showNotification('ツアー情報の更新に失敗しました', 'error');
    }
  }, [tourData.date, loadEnvironmentalData]);

  // メニュー項目
  const menuItems = [
    { id: 'dashboard', label: 'ダッシュボード', icon: <DashboardIcon /> },
    { id: 'guests', label: 'ゲスト管理', icon: <PeopleIcon />, badge: guests.length },
    { id: 'vehicles', label: '車両管理', icon: <CarIcon />, badge: vehicles.length },
    { id: 'optimizer', label: 'ルート最適化', icon: <ScheduleIcon /> },
    { id: 'schedule', label: '最終スケジュール', icon: <ScheduleIcon />, badge: optimizedRoutes.length },
    { id: 'statistics', label: '統計・分析', icon: <StatisticsIcon /> },
    { id: 'settings', label: '設定', icon: <SettingsIcon /> }
  ];

  // システムステータス色取得
  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return 'success';
      case 'offline': return 'error';
      case 'checking': return 'warning';
      default: return 'default';
    }
  };

  // メインコンテンツ表示
  const renderMainContent = () => {
    const commonProps = {
      guests: safeArray(guests),
      vehicles: safeArray(vehicles),
      tourData: safeObject(tourData),
      environmentalData: safeObject(environmentalData),
      onGuestsUpdate: handleGuestsUpdate,
      onVehiclesUpdate: handleVehiclesUpdate,
      onTourDataUpdate: handleTourDataUpdate
    };

    try {
      switch (currentView) {
        case 'guests':
          return <GuestManager {...commonProps} />;
        case 'vehicles':
          return <VehicleManager {...commonProps} />;
        case 'optimizer':
          return (
            <RouteOptimizer
              {...commonProps}
              optimizedRoutes={safeArray(optimizedRoutes)}
              isLoading={isOptimizing}
              onOptimize={handleOptimize}
            />
          );
        case 'schedule':
          return (
            <FinalSchedule 
              routes={safeArray(optimizedRoutes)} 
              tourData={safeObject(tourData)}
              guests={safeArray(guests)}
              vehicles={safeArray(vehicles)}
            />
          );
        case 'statistics':
          return <Statistics />;
        case 'settings':
          return <Settings onSystemUpdate={setSystemStatus} />;
        default:
          return (
            <Container maxWidth="lg">
              <Box sx={{ py: 4 }}>
                <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
                  🏝️ 石垣島ツアー管理システム v2.0
                </Typography>
                
                {/* ステータスカード */}
                <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap' }}>
                  <Chip 
                    label={`ゲスト: ${guests.length}組 (${guests.reduce((sum, g) => sum + (g?.people || 0), 0)}名)`} 
                    color="primary" 
                    variant="outlined"
                    icon={<PeopleIcon />}
                  />
                  <Chip 
                    label={`車両: ${vehicles.length}台 (定員${vehicles.reduce((sum, v) => sum + (v?.capacity || 0), 0)}名)`} 
                    color="secondary" 
                    variant="outlined"
                    icon={<CarIcon />}
                  />
                  <Chip 
                    label={`システム: ${systemStatus?.status || 'unknown'}`} 
                    color={getStatusColor(systemStatus?.status)}
                    icon={systemStatus?.status === 'checking' ? <CircularProgress size={16} /> : undefined}
                  />
                  {optimizedRoutes.length > 0 && (
                    <Chip 
                      label={`最適化済み: ${optimizedRoutes.length}ルート`} 
                      color="success"
                      icon={<ScheduleIcon />}
                    />
                  )}
                </Box>

                {/* 環境情報 */}
                {environmentalData && (
                  <Alert 
                    severity="info" 
                    sx={{ mb: 3 }}
                    action={
                      <Button 
                        color="inherit" 
                        size="small" 
                        onClick={loadEnvironmentalData}
                        startIcon={<RefreshIcon />}
                      >
                        更新
                      </Button>
                    }
                  >
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                      <span>📅 {tourData?.date || 'N/A'}</span>
                      <span>🌤️ {environmentalData?.weather || '不明'}</span>
                      <span>🌡️ {environmentalData?.temperature || '--'}°C</span>
                      <span>🌊 潮汐: {environmentalData?.tide_level || '--'}m</span>
                      <span>💨 風速: {environmentalData?.wind_speed || '--'}m/s</span>
                      {lastDataUpdate && (
                        <span style={{ fontSize: '0.8em', opacity: 0.7 }}>
                          (更新: {lastDataUpdate.toLocaleTimeString()})
                        </span>
                      )}
                    </Box>
                  </Alert>
                )}

                {/* クイックアクション */}
                <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                  <Button
                    variant="outlined"
                    size="large"
                    startIcon={<PeopleIcon />}
                    onClick={() => setCurrentView('guests')}
                    sx={{ p: 2 }}
                  >
                    ゲスト管理
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    startIcon={<CarIcon />}
                    onClick={() => setCurrentView('vehicles')}
                    sx={{ p: 2 }}
                  >
                    車両管理
                  </Button>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={isOptimizing ? <CircularProgress size={20} /> : <ScheduleIcon />}
                    onClick={() => setCurrentView('optimizer')}
                    disabled={guests.length === 0 || vehicles.length === 0}
                    sx={{ p: 2 }}
                  >
                    ルート最適化
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    startIcon={<StatisticsIcon />}
                    onClick={() => setCurrentView('statistics')}
                    sx={{ p: 2 }}
                  >
                    統計・分析
                  </Button>
                </Box>

                {/* 使用開始のヒント */}
                {guests.length === 0 && vehicles.length === 0 && (
                  <Alert severity="info" sx={{ mt: 4 }}>
                    <Typography variant="h6" gutterBottom>
                      🚀 使用を開始するには
                    </Typography>
                    <Typography variant="body2">
                      1. まず「ゲスト管理」でお客様情報を登録してください<br/>
                      2. 次に「車両管理」で利用可能な車両を登録してください<br/>
                      3. 「ルート最適化」で効率的な送迎ルートを計算できます
                    </Typography>
                  </Alert>
                )}
              </Box>
            </Container>
          );
      }
    } catch (error) {
      console.error('Render error:', error);
      return (
        <Container maxWidth="lg">
          <Alert severity="error" sx={{ mt: 4 }}>
            <Typography variant="h6">表示エラー</Typography>
            <Typography>コンポーネントの表示中にエラーが発生しました。ページをリロードしてください。</Typography>
          </Alert>
        </Container>
      );
    }
  };

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '100vh',
          flexDirection: 'column'
        }}>
          <CircularProgress size={60} sx={{ mb: 2 }} />
          <Typography variant="h6">システムを初期化しています...</Typography>
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        {/* ヘッダー */}
        <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1 }}>
          <Toolbar>
            <IconButton
              color="inherit"
              onClick={() => setDrawerOpen(true)}
              edge="start"
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              石垣島ツアー管理 v2.0
            </Typography>
            <IconButton color="inherit" onClick={() => setCurrentView('statistics')}>
              <Badge 
                badgeContent={optimizedRoutes.length > 0 ? optimizedRoutes.length : null} 
                color="secondary"
              >
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Toolbar>
        </AppBar>

        {/* サイドメニュー */}
        <Drawer
          anchor="left"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          sx={{
            '& .MuiDrawer-paper': {
              width: 280,
              boxSizing: 'border-box'
            }
          }}
        >
          <Toolbar />
          <Box sx={{ overflow: 'auto', pt: 1 }}>
            <Typography variant="h6" sx={{ px: 2, pb: 1, color: 'text.secondary' }}>
              メニュー
            </Typography>
            <Divider />
            <List>
              {menuItems.map((item) => (
                <ListItem
                  key={item.id}
                  button
                  selected={currentView === item.id}
                  onClick={() => {
                    setCurrentView(item.id);
                    setDrawerOpen(false);
                  }}
                  sx={{
                    '&.Mui-selected': {
                      backgroundColor: theme.palette.primary.main + '20',
                      borderRight: `3px solid ${theme.palette.primary.main}`
                    }
                  }}
                >
                  <ListItemIcon 
                    sx={{ 
                      color: currentView === item.id ? theme.palette.primary.main : 'inherit' 
                    }}
                  >
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
                    sx={{
                      '& .MuiListItemText-primary': {
                        fontWeight: currentView === item.id ? 600 : 400
                      }
                    }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        </Drawer>

        {/* メインコンテンツ */}
        <Box 
          component="main" 
          sx={{ 
            flexGrow: 1, 
            bgcolor: 'background.default',
            minHeight: '100vh',
            pt: 8
          }}
        >
          {renderMainContent()}
        </Box>

        {/* 通知 */}
        <Snackbar
          open={notification.open}
          autoHideDuration={6000}
          onClose={handleCloseNotification}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            onClose={handleCloseNotification}
            severity={notification.severity}
            sx={{ width: '100%' }}
            action={
              <IconButton
                size="small"
                aria-label="close"
                color="inherit"
                onClick={handleCloseNotification}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            }
          >
            {notification.message}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
};

export default App;