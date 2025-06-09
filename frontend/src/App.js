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
import TourSettings from './components/TourSettings';
import GuestList from './components/GuestList';
import VehicleManager from './components/VehicleManager';
import MapView from './components/MapView';
import FinalSchedule from './components/FinalSchedule';
import PredictionCard from './components/PredictionCard';
import { 
  optimizeIshigakiTour, 
  saveIshigakiRecord, 
  getIshigakiEnvironmentalData,
  getIshigakiStatistics,
  checkSystemStatus,
  getBatchData,
  handleApiError
} from './services/api';
import { format } from 'date-fns';
import './App.css';

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

function App() {
  // 基本ツアーデータ（石垣島特化）
  const [tourData, setTourData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    activityType: 'snorkeling',
    activityLocation: { lat: 24.4219, lng: 124.1542, name: '川平湾' },  // デフォルトのロケーションを設定
    startTime: '10:00',
    departureLocation: { lat: 24.3336, lng: 124.1543, name: '石垣島出発地点' }
  });

  // 石垣島モードのゲスト情報
  const [guests, setGuests] = useState([]);
  
  // 複数車両対応
  const [vehicles, setVehicles] = useState([
    {
      id: 'vehicle_001',
      name: '車両1',
      capacity: 8,
      driver: '田中ドライバー',
      vehicleType: 'mini_van',
      color: '#1a73e8'
    }
  ]);

  // 石垣島最適化結果
  const [optimizedRoutes, setOptimizedRoutes] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);

  // 石垣島環境データ
  const [environmentalData, setEnvironmentalData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    location: '石垣島',
    weather: {
      condition: 'sunny',
      temperature: 26,
      wind_speed: 4.0,
      wind_direction: 'NE',
      typhoon_risk: 0
    },
    tide: {
      current_level: 150,
      state: 'rising',
      high_times: [],
      low_times: []
    },
    tourism: {
      season_level: 2,
      cruise_ships: [],
      estimated_tourist_count: 5000
    },
    traffic: {
      congestion_forecast: 'normal',
      special_events: []
    }
  });

  // システム状態
  const [systemStatus, setSystemStatus] = useState({
    status: 'unknown',
    version: '不明',
    features: []
  });

  // 統計情報
  const [statistics, setStatistics] = useState({
    total_records: 0,
    average_delay: 0,
    prediction_accuracy: 85,
    area_statistics: [],
    vehicle_efficiency: []
  });

  // エラー状態
  const [errors, setErrors] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // 通知管理
  const addNotification = useCallback((message, severity = 'info') => {
    const notification = {
      id: Date.now(),
      message,
      severity,
      timestamp: new Date()
    };
    setNotifications(prev => [notification, ...prev.slice(0, 4)]); // 最新5件まで
    
    // 5秒後に自動削除
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  }, []);

  // 初期データ読み込み
  useEffect(() => {
    const initializeApp = async () => {
      try {
        const batchData = await getBatchData(tourData.date);
        
        // データが取得できた場合のみ更新
        if (batchData.environmental) {
          setEnvironmentalData(batchData.environmental);
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
          // エラーが全てのデータ取得で発生した場合のみ通知
          if (batchData.errors.length === 3) {
            addNotification('オフラインモードで動作中', 'warning');
          }
        }

      } catch (error) {
        console.error('アプリ初期化エラー:', error);
        // エラーが発生してもアプリは継続動作
        addNotification('初期化中にエラーが発生しましたが、継続して使用できます', 'warning');
      }
    };

    initializeApp();
  }, [tourData.date, addNotification]);

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

  // 石垣島専用最適化処理
  const handleOptimize = useCallback(async () => {
    setLoading(true);
    setErrors([]);
    
    try {
      // アクティビティロケーションの検証
      if (!tourData.activityLocation) {
        throw new Error('アクティビティの場所を設定してください');
      }

      // ゲストの検証
      if (guests.length === 0) {
        throw new Error('ゲストを追加してください');
      }

      // 最新の環境データを取得（エラーが発生してもデフォルト値を使用）
      try {
        const currentEnvData = await getIshigakiEnvironmentalData(tourData.date);
        setEnvironmentalData(currentEnvData);
      } catch (envError) {
        console.warn('環境データ取得エラー:', envError);
      }

      // 石垣島専用最適化API呼び出し
      const optimizationData = {
        ...tourData,
        guests: guests,
        vehicles: vehicles
      };

      const result = await optimizeIshigakiTour(optimizationData);

      if (result.success) {
        // 複数車両の結果を処理
        const vehicleRoutes = result.optimization_result?.vehicle_routes || [];
        setOptimizedRoutes(vehicleRoutes);
        
        // 予測結果を設定
        if (result.prediction) {
          setPrediction(result.prediction);
        }

        addNotification('ルート最適化が完了しました', 'success');
        
        // 統計情報の更新
        if (result.summary) {
          setStatistics(prev => ({
            ...prev,
            ...result.summary
          }));
        }
      } else {
        throw new Error('最適化に失敗しました');
      }
      
    } catch (error) {
      console.error('最適化エラー:', error);
      setErrors([error.message]);
      
      // APIエラーの場合はフォールバックルートを生成
      if (guests.length > 0 && vehicles.length > 0) {
        generateFallbackRoutes();
      }
    } finally {
      setLoading(false);
    }
  }, [tourData, guests, vehicles, addNotification, generateFallbackRoutes]);

  // ツアーデータ更新
  const handleTourDataUpdate = useCallback((newData) => {
    setTourData(newData);
  }, []);

  // ゲスト更新（石垣島特化）
  const handleGuestsUpdate = useCallback((newGuests) => {
    setGuests(newGuests);
  }, []);

  // 車両更新
  const handleVehiclesUpdate = useCallback((newVehicles) => {
    setVehicles(newVehicles);
  }, []);

  // ゲストのホテル位置更新
  const handleGuestLocationUpdate = useCallback((guestIndex, location) => {
    setGuests(prevGuests => 
      prevGuests.map((guest, index) => 
        index === guestIndex ? { ...guest, location } : guest
      )
    );
  }, []);

  const handleActivityLocationUpdate = useCallback((location) => {
    setTourData(prevData => ({ ...prevData, activityLocation: location }));
  }, []);

  const handleDepartureLocationUpdate = useCallback((location) => {
    setTourData(prevData => ({ ...prevData, departureLocation: location }));
  }, []);

  // エラー解除
  const dismissError = useCallback((index) => {
    setErrors(prevErrors => prevErrors.filter((_, i) => i !== index));
  }, []);

  // 通知解除
  const dismissNotification = useCallback((id) => {
    setNotifications(prevNotifications => 
      prevNotifications.filter(n => n.id !== id)
    );
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
        
        {/* ヘッダー */}
        <Box sx={{ bgcolor: 'primary.main', color: 'white', py: 2 }}>
          <Container maxWidth="xl">
            <Grid container alignItems="center" justifyContent="space-between">
              <Grid item>
                <Typography variant="h4" fontWeight="bold">
                  🏝️ 石垣島ツアー最適化システム v2.0
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  複数車両対応・AI予測・リアルタイム環境データ統合
                </Typography>
              </Grid>
              <Grid item>
                <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {environmentalData.tide.current_level}cm
                    </Typography>
                    <Typography variant="caption">
                      潮位 ({environmentalData.tide.state})
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {environmentalData.weather.wind_speed}m/s
                    </Typography>
                    <Typography variant="caption">風速</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {statistics.prediction_accuracy}%
                    </Typography>
                    <Typography variant="caption">予測精度</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Chip 
                      label={systemStatus.status === 'online' ? 'オンライン' : 'オフライン'}
                      color={systemStatus.status === 'online' ? 'success' : 'default'}
                      size="small"
                    />
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Container>
        </Box>

        <Container maxWidth="xl" sx={{ mt: 3, mb: 3 }}>
          {/* エラー表示 */}
          {errors.length > 0 && (
            <Box sx={{ mb: 2 }}>
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
            </Box>
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
                  startIcon={loading ? <CircularProgress size={20} /> : null}
                  fullWidth
                  sx={{ py: 1.5 }}
                >
                  {loading ? '最適化中...' : '🚀 石垣島モード最適化'}
                </Button>
              </Box>
            </Grid>

            {/* 中央：地図 */}
            <Grid item xs={12} lg={4}>
              <Paper sx={{ height: '85vh', position: 'sticky', top: 20 }}>
                <MapView
                  guests={guests}
                  activityLocation={tourData.activityLocation}
                  departureLocation={tourData.departureLocation}
                  onActivityLocationUpdate={handleActivityLocationUpdate}
                  onDepartureLocationUpdate={handleDepartureLocationUpdate}
                  optimizedRoutes={optimizedRoutes}
                  vehicles={vehicles}
                  ishigakiMode={true}
                />
              </Paper>
            </Grid>

            {/* 右側：結果表示 */}
            <Grid item xs={12} lg={4}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* AI予測カード */}
                {prediction && (
                  <Paper sx={{ p: 2 }}>
                    <PredictionCard prediction={prediction} />
                  </Paper>
                )}

                {/* 最終スケジュール */}
                {optimizedRoutes.length > 0 && (
                  <Paper sx={{ p: 2 }}>
                    <FinalSchedule
                      vehicles={vehicles}
                      optimizedRoutes={optimizedRoutes}
                      tourData={tourData}
                      onUpdateTourData={handleTourDataUpdate}
                      environmentalData={environmentalData}
                    />
                  </Paper>
                )}
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;