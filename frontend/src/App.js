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
// import IshigakiDashboard from './components/IshigakiDashboard';
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
    activityLocation: { lat: 24.4219, lng: 124.1542 }, // 川平湾
    departureLocation: { lat: 24.3380, lng: 124.1572 }, // 石垣港
    startTime: '10:00',
    weatherPriority: true,
    tidePriority: true
  });

  // ゲスト管理
  const [guests, setGuests] = useState([
    {
      id: 1,
      name: '田中家',
      hotel: 'ANAインターコンチネンタル石垣リゾート',
      location: { lat: 24.3892, lng: 124.1256 },
      people: 4,
      preferredTime: { start: '09:00', end: '09:30' },
      pickupTime: null,
      guestType: 'family',
      specialNeeds: null
    },
    {
      id: 2,
      name: '鈴木カップル',
      hotel: 'フサキビーチリゾート',
      location: { lat: 24.3889, lng: 124.1253 },
      people: 2,
      preferredTime: { start: '09:15', end: '09:45' },
      pickupTime: null,
      guestType: 'couple',
      specialNeeds: null
    }
  ]);

  // 車両管理（石垣島仕様）
  const vehicleColors = ['#1a73e8', '#34a853', '#ea4335', '#fbbc04', '#673ab7', '#ff6d00', '#00acc1', '#ab47bc'];
  const [vehicles, setVehicles] = useState([
    {
      id: 'van_01',
      name: 'ハイエース号',
      capacity: 10,
      driver: '石垣太郎',
      color: vehicleColors[0],
      vehicleType: 'mini_van',
      equipment: ['シュノーケル用具', 'タオル', 'ドリンク'],
      speedFactor: 1.0
    },
    {
      id: 'van_02',
      name: 'セレナ号',
      capacity: 8,
      driver: '島袋花子',
      color: vehicleColors[1],
      vehicleType: 'mini_van',
      equipment: ['シュノーケル用具', 'パラソル'],
      speedFactor: 1.1
    }
  ]);

  // 最適化結果
  const [optimizedRoutes, setOptimizedRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);

  // 石垣島環境データ
  const [environmentalData, setEnvironmentalData] = useState({
    location: "石垣島",
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
        
        if (batchData.environmental) {
          setEnvironmentalData(batchData.environmental);
        }
        
        if (batchData.statistics) {
          setStatistics(batchData.statistics);
        }
        
        if (batchData.system) {
          setSystemStatus(batchData.system);
        }

        if (batchData.errors.length > 0) {
          console.warn('一部データの読み込みに失敗:', batchData.errors);
        }

      } catch (error) {
        console.error('アプリ初期化エラー:', error);
        setErrors([handleApiError(error, 'アプリ初期化')]);
      }
    };

    initializeApp();
  }, [tourData.date]);

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
        route: assignedGuests.map(guest => ({
          name: guest.name,
          hotel_name: guest.hotel,
          pickup_lat: guest.location.lat,
          pickup_lng: guest.location.lng,
          num_people: guest.people,
          pickup_time: `0${8 + index}:${(index * 15) % 60}`,
          time_compliance: 'acceptable'
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
      // 最新の環境データを取得
      const currentEnvData = await getIshigakiEnvironmentalData(tourData.date);
      setEnvironmentalData(currentEnvData);

      // 石垣島専用最適化API呼び出し
      const optimizationData = {
        ...tourData,
        guests: guests,
        vehicles: vehicles
      };

      const result = await optimizeIshigakiTour(optimizationData);

      if (result.success) {
        // 複数車両の結果を処理
        const vehicleRoutes = result.optimization_result.vehicle_routes || [];
        setOptimizedRoutes(vehicleRoutes);
        
        // 予測結果を設定
        setPrediction(result.prediction);

        // ゲストのピックアップ時間を更新
        const updatedGuests = guests.map(guest => {
          for (const vehicleRoute of vehicleRoutes) {
            const routeGuest = vehicleRoute.route.find(r => r.name === guest.name);
            if (routeGuest) {
              return {
                ...guest,
                pickupTime: routeGuest.pickup_time,
                assignedVehicle: vehicleRoute.vehicle_id
              };
            }
          }
          return guest;
        });
        setGuests(updatedGuests);

        // 最適化成功の通知
        addNotification('ルート最適化が完了しました！', 'success');

        // 石垣島特有の推奨事項があれば表示
        if (result.ishigaki_special_notes && result.ishigaki_special_notes.length > 0) {
          result.ishigaki_special_notes.forEach(note => {
            addNotification(note, 'info');
          });
        }

      } else {
        throw new Error(result.message || '最適化に失敗しました');
      }

    } catch (error) {
      const errorMessage = handleApiError(error, 'ルート最適化');
      setErrors([errorMessage]);
      addNotification(errorMessage, 'error');
      
      // フォールバック：簡易的な結果を生成
      generateFallbackRoutes();
    } finally {
      setLoading(false);
    }
  }, [tourData, guests, vehicles, addNotification, generateFallbackRoutes]);

  // コンポーネント更新ハンドラー
  const handleGuestUpdate = useCallback((updatedGuests) => {
    setGuests(updatedGuests);
  }, []);

  const handleVehicleUpdate = useCallback((updatedVehicles) => {
    setVehicles(updatedVehicles);
  }, []);

  const handleLocationUpdate = useCallback((id, location) => {
    setGuests(prevGuests => 
      prevGuests.map(guest =>
        guest.id === id ? { ...guest, location } : guest
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
                      color={systemStatus.status === 'online' ? 'success' : 'error'}
                      size="small"
                    />
                    <Typography variant="caption" sx={{ display: 'block' }}>
                      {systemStatus.version}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Container>
        </Box>

        {/* 通知エリア */}
        {notifications.length > 0 && (
          <Box sx={{ bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
            <Container maxWidth="xl" sx={{ py: 1 }}>
              {notifications.map((notification) => (
                <Alert
                  key={notification.id}
                  severity={notification.severity}
                  onClose={() => dismissNotification(notification.id)}
                  sx={{ mb: 1 }}
                >
                  {notification.message}
                </Alert>
              ))}
            </Container>
          </Box>
        )}

        {/* エラー表示 */}
        {errors.length > 0 && (
          <Box sx={{ bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
            <Container maxWidth="xl" sx={{ py: 1 }}>
              {errors.map((error, index) => (
                <Alert
                  key={index}
                  severity="error"
                  onClose={() => dismissError(index)}
                  sx={{ mb: 1 }}
                >
                  {error}
                </Alert>
              ))}
            </Container>
          </Box>
        )}

        <Container maxWidth="xl" sx={{ py: 3 }}>
          <Grid container spacing={3}>
            {/* 左サイドパネル */}
            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 2, mb: 2 }}>
                <TourSettings
                  tourData={tourData}
                  onUpdate={setTourData}
                  environmentalData={environmentalData}
                />
              </Paper>
              
              <Paper sx={{ p: 2, mb: 2 }}>
                <GuestList
                  guests={guests}
                  onUpdate={handleGuestUpdate}
                  ishigakiMode={true}
                />
              </Paper>
              
              <Paper sx={{ p: 2 }}>
                <VehicleManager
                  vehicles={vehicles}
                  onUpdate={handleVehicleUpdate}
                  ishigakiMode={true}
                />
              </Paper>
            </Grid>

            {/* 中央マップエリア */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 0, height: '70vh', position: 'relative' }}>
                <MapView
                  guests={guests}
                  vehicles={vehicles}
                  activityLocation={tourData.activityLocation}
                  departureLocation={tourData.departureLocation}
                  optimizedRoutes={optimizedRoutes}
                  onGuestLocationUpdate={handleLocationUpdate}
                  onActivityLocationUpdate={handleActivityLocationUpdate}
                  onDepartureLocationUpdate={handleDepartureLocationUpdate}
                  ishigakiMode={true}
                />
                {loading && (
                  <Box sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    bgcolor: 'rgba(255,255,255,0.95)',
                    p: 4,
                    borderRadius: 2,
                    boxShadow: 3,
                    textAlign: 'center'
                  }}>
                    <CircularProgress size={60} />
                    <Typography sx={{ mt: 2, fontWeight: 'bold' }}>
                      石垣島専用AI最適化実行中...
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      複数車両・環境要因・潮位を考慮して計算中
                    </Typography>
                  </Box>
                )}
              </Paper>
              
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: 2 }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleOptimize}
                  disabled={loading || guests.length === 0}
                  sx={{ px: 4, py: 1.5 }}
                  startIcon={loading ? <CircularProgress size={20} /> : null}
                >
                  {loading ? '最適化中...' : '🚀 石垣島専用最適化実行'}
                </Button>
                
                {optimizedRoutes.length > 0 && (
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={() => {
                      // 結果をクリア
                      setOptimizedRoutes([]);
                      setPrediction(null);
                      addNotification('結果をクリアしました', 'info');
                    }}
                    sx={{ px: 3, py: 1.5 }}
                  >
                    結果クリア
                  </Button>
                )}
              </Box>
            </Grid>

            {/* 右サイドパネル */}
            <Grid item xs={12} md={3}>
              {prediction && (
                <Paper sx={{ p: 2, mb: 2 }}>
                  <PredictionCard
                    prediction={prediction}
                    environmentalData={environmentalData}
                    ishigakiMode={true}
                  />
                </Paper>
              )}
              
              {optimizedRoutes.length > 0 ? (
                <Paper sx={{ p: 2 }}>
                  <FinalSchedule
                    vehicles={vehicles}
                    optimizedRoutes={optimizedRoutes}
                    tourData={tourData}
                    environmentalData={environmentalData}
                    onSaveRecord={saveIshigakiRecord}
                    ishigakiMode={true}
                  />
                </Paper>
              ) : (
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    石垣島専用最適化
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    複数車両での最適ルートを計算します
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" display="block">
                      🌊 潮位・天候・観光シーズンを考慮
                    </Typography>
                    <Typography variant="caption" display="block">
                      🚗 車両容量・効率を最適化
                    </Typography>
                    <Typography variant="caption" display="block">
                      🤖 AI学習による遅延予測
                    </Typography>
                  </Box>
                </Paper>
              )}
            </Grid>
          </Grid>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;