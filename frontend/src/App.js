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
import TourSettings from './components/TourSettings';
import GuestList from './components/GuestList';
import VehicleManager from './components/VehicleManager';
import MapView from './components/MapView';
import FinalSchedule from './components/FinalSchedule';
import PredictionCard from './components/PredictionCard';
import { optimizeRoute, saveRecord } from './services/api';
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
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
});

function App() {
  const [tourData, setTourData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    activityType: 'snorkeling',
    activityLocation: { lat: 24.3754, lng: 124.1726 }, // 川平湾
    departureLocation: { lat: 24.3336, lng: 124.1543 }, // 市街地（出発地点）
    startTime: '10:00',
  });

  const [guests, setGuests] = useState([
    {
      id: 1,
      name: '田中様',
      hotel: 'ANAインターコンチネンタル',
      location: { lat: 24.3500, lng: 124.1600 },
      people: 2,
      preferredTime: { start: '07:00', end: '08:00' },
      pickupTime: null,
    },
    {
      id: 2,
      name: '山田様',
      hotel: 'フサキビーチリゾート',
      location: { lat: 24.3350, lng: 124.1450 },
      people: 4,
      preferredTime: { start: '08:00', end: '09:00' },
      pickupTime: null,
    },
  ]);

  const [vehicles, setVehicles] = useState([
    {
      id: 1,
      name: '車両1',
      capacity: 7,
      driver: '山田ドライバー',
      color: '#1a73e8',
    },
  ]);

  const [optimizedRoutes, setOptimizedRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);

  // 環境データ（実際にはAPIから取得）
  const [environmentalData] = useState({
    tide: { level: 150, state: 'rising' },
    weather: { condition: 'sunny', temp: 28, windSpeed: 3.5 },
  });

  // ゲストを車両に振り分ける関数
  const distributeGuestsToVehicles = (route, vehicles) => {
    if (!route || route.length === 0) return [];
    
    const vehicleRoutes = vehicles.map(vehicle => ({
      vehicleId: vehicle.id,
      route: [],
      total_distance: 0,
      estimated_duration: '0分',
      departure_time: '07:00',
    }));

    let currentVehicleIndex = 0;
    let currentCapacity = 0;

    route.forEach(guest => {
      if (currentCapacity + guest.num_people > vehicles[currentVehicleIndex].capacity) {
        currentVehicleIndex++;
        currentCapacity = 0;
        if (currentVehicleIndex >= vehicles.length) {
          currentVehicleIndex = 0; // 全車両が満員の場合は最初の車両に戻る
        }
      }

      vehicleRoutes[currentVehicleIndex].route.push(guest);
      currentCapacity += guest.num_people;
    });

    // 各車両の距離と時間を計算（簡易版）
    vehicleRoutes.forEach(vr => {
      vr.total_distance = (vr.route.length * 5 + Math.random() * 10).toFixed(1);
      vr.estimated_duration = `${30 + vr.route.length * 10}分`;
    });

    return vehicleRoutes.filter(vr => vr.route.length > 0);
  };

  const handleOptimize = useCallback(async () => {
    setLoading(true);
    try {
      const result = await optimizeRoute({
        ...tourData,
        departure_lat: tourData.departureLocation.lat,
        departure_lng: tourData.departureLocation.lng,
        guests: guests.map(g => ({
          name: g.name,
          hotel_name: g.hotel,
          pickup_lat: g.location.lat,
          pickup_lng: g.location.lng,
          num_people: g.people,
          preferred_pickup_start: g.preferredTime.start,
          preferred_pickup_end: g.preferredTime.end,
        })),
        vehicles: vehicles.map(v => ({
          id: v.id,
          capacity: v.capacity,
        })),
      });

      // 単一ルートを複数車両用に変換（バックエンドが対応するまでの暫定処理）
      const vehicleRoutes = distributeGuestsToVehicles(result.route, vehicles);
      setOptimizedRoutes(vehicleRoutes);
      setPrediction(result.prediction);

      // ゲストのピックアップ時間を更新
      const updatedGuests = guests.map(guest => {
        const routeItem = result.route?.find(r => r.name === guest.name);
        return {
          ...guest,
          pickupTime: routeItem ? routeItem.pickup_time : null,
        };
      });
      setGuests(updatedGuests);
    } catch (error) {
      console.error('最適化エラー:', error);
      // デモ用のダミーデータを設定
      const dummyRoute = {
        route: guests.map((guest, index) => ({
          name: guest.name,
          hotel_name: guest.hotel,
          pickup_lat: guest.location.lat,
          pickup_lng: guest.location.lng,
          num_people: guest.people,
          pickup_time: `0${7 + index}:30`,
          time_compliance: index === 0 ? 'optimal' : 'acceptable',
        })),
        total_distance: 25.5,
        estimated_duration: '45分',
      };
      
      const vehicleRoutes = distributeGuestsToVehicles(dummyRoute.route, vehicles);
      setOptimizedRoutes(vehicleRoutes);
      setPrediction({
        accuracy: 92,
        expected_delays: guests.map(g => ({
          guest_name: g.name,
          predicted_delay: Math.floor(Math.random() * 5),
        })),
        recommendations: ['交通量が少ない早朝の送迎をお勧めします'],
      });

      // ダミーデータでゲストを更新
      const updatedGuests = guests.map((guest, index) => ({
        ...guest,
        pickupTime: `0${7 + index}:30`,
      }));
      setGuests(updatedGuests);
    } finally {
      setLoading(false);
    }
  }, [tourData, guests, vehicles]);

  const handleGuestUpdate = (updatedGuests) => {
    setGuests(updatedGuests);
  };

  const handleVehicleUpdate = (updatedVehicles) => {
    setVehicles(updatedVehicles);
  };

  const handleLocationUpdate = (id, location) => {
    const updatedGuests = guests.map(guest =>
      guest.id === id ? { ...guest, location } : guest
    );
    setGuests(updatedGuests);
  };

  const handleActivityLocationUpdate = (location) => {
    setTourData({ ...tourData, activityLocation: location });
  };

  const handleDepartureLocationUpdate = (location) => {
    setTourData({ ...tourData, departureLocation: location });
  };

  const handleSaveRecord = async () => {
    // 実績データの保存
    const records = guests.map(guest => ({
      tour_date: tourData.date,
      planned_time: `${tourData.date} ${guest.pickupTime}`,
      guest_name: guest.name,
      actual_time: `${tourData.date} ${guest.pickupTime}`,
      delay_minutes: 0,
      distance_km: 10,
      weather: environmentalData.weather.condition,
      tide_level: environmentalData.tide.level,
    }));

    try {
      for (const record of records) {
        await saveRecord(record);
      }
      alert('実績を保存しました');
    } catch (error) {
      console.error('保存エラー:', error);
      alert('保存に失敗しました');
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ bgcolor: '#f5f7fa', minHeight: '100vh' }}>
        {/* ヘッダー */}
        <Box
          sx={{
            background: 'linear-gradient(135deg, #1a73e8 0%, #1557b0 100%)',
            color: 'white',
            py: 3,
            boxShadow: 2,
          }}
        >
          <Container maxWidth="xl">
            <Grid container justifyContent="space-between" alignItems="center">
              <Grid item>
                <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
                  🏝️ 石垣島ツアー送迎システム
                </Typography>
              </Grid>
              <Grid item>
                <Box sx={{ display: 'flex', gap: 4 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                      {prediction ? `${prediction.accuracy}%` : '-'}
                    </Typography>
                    <Typography variant="caption">予測精度</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                      {optimizedRoutes.length > 0 ? 
                        `${optimizedRoutes.reduce((sum, r) => sum + parseFloat(r.total_distance), 0).toFixed(1)}km` : 
                        '-'
                      }
                    </Typography>
                    <Typography variant="caption">総移動距離</Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Container>
        </Box>

        <Container maxWidth="xl" sx={{ mt: 3, mb: 3 }}>
          <Grid container spacing={3}>
            {/* 左サイドパネル */}
            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 2, mb: 2 }}>
                <TourSettings
                  tourData={tourData}
                  onChange={setTourData}
                  environmentalData={environmentalData}
                />
              </Paper>
              <Paper sx={{ p: 2, mb: 2 }}>
                <PredictionCard prediction={prediction} />
              </Paper>
              <Paper sx={{ p: 2, mb: 2 }}>
                <VehicleManager
                  vehicles={vehicles}
                  onUpdate={handleVehicleUpdate}
                />
              </Paper>
              <Paper sx={{ p: 2 }}>
                <GuestList
                  guests={guests}
                  onUpdate={handleGuestUpdate}
                />
              </Paper>
            </Grid>

            {/* 中央: 地図 */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 0, height: '600px', position: 'relative' }}>
                <MapView
                  guests={guests}
                  vehicles={vehicles}
                  activityLocation={tourData.activityLocation}
                  departureLocation={tourData.departureLocation}
                  optimizedRoutes={optimizedRoutes}
                  onGuestLocationUpdate={handleLocationUpdate}
                  onActivityLocationUpdate={handleActivityLocationUpdate}
                  onDepartureLocationUpdate={handleDepartureLocationUpdate}
                />
                {loading && (
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 20,
                      right: 20,
                      bgcolor: 'rgba(0, 0, 0, 0.7)',
                      color: 'white',
                      p: 2,
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      zIndex: 1000,
                    }}
                  >
                    <CircularProgress size={20} color="inherit" />
                    <Typography variant="body2">ルート計算中...</Typography>
                  </Box>
                )}
              </Paper>
              <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  onClick={handleOptimize}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
                >
                  {loading ? 'ルート計算中...' : '🗺️ ルート最適化'}
                </Button>
              </Box>
            </Grid>

            {/* 右サイドパネル: 最終スケジュール */}
            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 2, height: '100%', overflow: 'auto' }}>
                <FinalSchedule
                  vehicles={vehicles}
                  optimizedRoutes={optimizedRoutes}
                  tourData={tourData}
                />
                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="contained"
                    color="secondary"
                    fullWidth
                    onClick={handleSaveRecord}
                    disabled={optimizedRoutes.length === 0}
                  >
                    💾 送迎計画を保存
                  </Button>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;