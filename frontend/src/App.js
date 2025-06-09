import React, { useState, useCallback, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Box,
  Typography,
  Button,
  CircularProgress,
} from '@mui/material';
import MapView from './components/MapView';
import GuestList from './components/GuestList';
import VehicleManager from './components/VehicleManager';
import TourSettings from './components/TourSettings';
import FinalSchedule from './components/FinalSchedule';
import PredictionCard from './components/PredictionCard';
import { optimizeRoute } from './services/api';

function App() {
  const [tourData, setTourData] = useState({
    date: new Date().toISOString().split('T')[0],
    startTime: '10:00',
    activityType: 'シュノーケリング',
    activityLocation: { lat: 24.3800, lng: 124.1700 }, // 川平湾
    departureLocation: { lat: 24.3408, lng: 124.1551 }, // 〒907-0023 沖縄県石垣市石垣１４４−１
    departureTime: '07:00',
    isStartTimeFixed: false,
    isDepartureTimeFixed: false,
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

  // デフォルトの車両設定：7人乗り3台、4人乗り5台
  const vehicleColors = ['#1a73e8', '#34a853', '#ea4335', '#fbbc04', '#673ab7', '#ff6d00', '#00acc1', '#ab47bc'];
  
  const [vehicles, setVehicles] = useState([
    // 7人乗り車両（3台）
    {
      id: 1,
      name: '車両1（大型）',
      capacity: 7,
      driver: '山田ドライバー',
      color: vehicleColors[0], // 青
    },
    {
      id: 2,
      name: '車両2（大型）',
      capacity: 7,
      driver: '鈴木ドライバー',
      color: vehicleColors[1], // 緑
    },
    {
      id: 3,
      name: '車両3（大型）',
      capacity: 7,
      driver: '佐藤ドライバー',
      color: vehicleColors[2], // 赤
    },
    // 4人乗り車両（5台）
    {
      id: 4,
      name: '車両4（小型）',
      capacity: 4,
      driver: '高橋ドライバー',
      color: vehicleColors[3], // 黄
    },
    {
      id: 5,
      name: '車両5（小型）',
      capacity: 4,
      driver: '伊藤ドライバー',
      color: vehicleColors[4], // 紫
    },
    {
      id: 6,
      name: '車両6（小型）',
      capacity: 4,
      driver: '渡辺ドライバー',
      color: vehicleColors[5], // オレンジ
    },
    {
      id: 7,
      name: '車両7（小型）',
      capacity: 4,
      driver: '中村ドライバー',
      color: vehicleColors[6], // 水色
    },
    {
      id: 8,
      name: '車両8（小型）',
      capacity: 4,
      driver: '小林ドライバー',
      color: vehicleColors[7], // ピンク
    },
  ]);

  const [optimizedRoutes, setOptimizedRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);

  // 環境データ（動的に更新可能）
  const [environmentalData, setEnvironmentalData] = useState({
    tide: { 
      level: 150, 
      state: 'rising',
      nextHigh: '14:30',
      nextLow: '08:15'
    },
    weather: { 
      condition: 'sunny', 
      temp: 28, 
      windSpeed: 3.5,
      windDirection: 'NE'
    },
  });

  // 環境データを更新する関数
  const updateEnvironmentalData = () => {
    // 潮位のシミュレーション（簡易的な正弦波）
    const currentHour = new Date().getHours();
    const tideLevel = Math.round(150 + 100 * Math.sin((currentHour / 12) * Math.PI));
    const tideState = tideLevel > environmentalData.tide.level ? 'rising' : 'falling';
    
    // 風速のランダムな変動
    const windSpeed = Math.max(0, environmentalData.weather.windSpeed + (Math.random() - 0.5) * 2);
    
    setEnvironmentalData({
      tide: {
        level: tideLevel,
        state: tideState,
        nextHigh: '14:30',
        nextLow: '08:15'
      },
      weather: {
        ...environmentalData.weather,
        windSpeed: Math.round(windSpeed * 10) / 10
      }
    });
  };

  // 定期的な環境データ更新（オプション）
  useEffect(() => {
    const interval = setInterval(() => {
      updateEnvironmentalData();
    }, 60000); // 1分ごとに更新

    return () => clearInterval(interval);
  }, []);

  // ゲストを車両に振り分ける関数（改良版）
  const distributeGuestsToVehicles = (route, vehicles) => {
    if (!route || route.length === 0) return [];
    
    // 車両を容量でソート（大きい順）して効率的に割り当て
    const sortedVehicles = [...vehicles].sort((a, b) => b.capacity - a.capacity);
    
    const vehicleRoutes = sortedVehicles.map((vehicle, index) => ({
      vehicleId: vehicle.id,
      vehicleIndex: vehicles.findIndex(v => v.id === vehicle.id), // 元の順序を保持
      route: [],
      total_distance: 0,
      estimated_duration: '0分',
      departure_time: '07:00',
      currentCapacity: 0,
    }));

    const unassignedGuests = [];

    // ゲストを人数の多い順にソートして、大型車両から割り当て
    const sortedGuests = [...route].sort((a, b) => b.num_people - a.num_people);

    sortedGuests.forEach(guest => {
      let assigned = false;
      
      // 最適な車両を探す（余裕が最も少ない車両を優先）
      let bestFitIndex = -1;
      let bestFitSpace = Infinity;
      
      for (let i = 0; i < vehicleRoutes.length; i++) {
        const vehicle = sortedVehicles[i];
        const remainingSpace = vehicle.capacity - vehicleRoutes[i].currentCapacity;
        
        if (remainingSpace >= guest.num_people && remainingSpace < bestFitSpace) {
          bestFitIndex = i;
          bestFitSpace = remainingSpace;
        }
      }
      
      if (bestFitIndex !== -1) {
        vehicleRoutes[bestFitIndex].route.push(guest);
        vehicleRoutes[bestFitIndex].currentCapacity += guest.num_people;
        assigned = true;
      }
      
      if (!assigned) {
        unassignedGuests.push(guest);
        console.error(`警告: ${guest.name}様（${guest.num_people}名）を車両に割り当てできません。全車両が満員です。`);
      }
    });

    // 未割り当てゲストの処理
    if (unassignedGuests.length > 0) {
      console.warn(`${unassignedGuests.length}組のゲストが定員オーバーで割り当てられています。車両の追加を検討してください。`);
      
      unassignedGuests.forEach(guest => {
        let minOccupancyIndex = 0;
        let minOccupancyRate = (vehicleRoutes[0].currentCapacity + guest.num_people) / sortedVehicles[0].capacity;
        
        for (let i = 1; i < vehicleRoutes.length; i++) {
          const occupancyRate = (vehicleRoutes[i].currentCapacity + guest.num_people) / sortedVehicles[i].capacity;
          if (occupancyRate < minOccupancyRate) {
            minOccupancyRate = occupancyRate;
            minOccupancyIndex = i;
          }
        }
        
        vehicleRoutes[minOccupancyIndex].route.push(guest);
        vehicleRoutes[minOccupancyIndex].currentCapacity += guest.num_people;
      });
    }

    // 距離と時間の計算
    vehicleRoutes.forEach(vr => {
      if (vr.route.length > 0) {
        const baseDistance = 5;
        const perStopDistance = 3;
        vr.total_distance = (baseDistance + vr.route.length * perStopDistance + Math.random() * 5).toFixed(1);
        
        const baseTime = 20;
        const perStopTime = 8;
        const totalMinutes = baseTime + vr.route.length * perStopTime;
        vr.estimated_duration = `${totalMinutes}分`;
      }
    });

    // 元の車両順序に戻してフィルタリング
    const finalRoutes = vehicles.map(vehicle => {
      const routeData = vehicleRoutes.find(vr => vr.vehicleId === vehicle.id);
      return routeData ? {
        vehicleId: routeData.vehicleId,
        route: routeData.route,
        total_distance: routeData.total_distance,
        estimated_duration: routeData.estimated_duration,
        departure_time: routeData.departure_time,
        currentCapacity: routeData.currentCapacity
      } : null;
    }).filter(vr => vr && vr.route.length > 0);

    return finalRoutes;
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

      const vehicleRoutes = distributeGuestsToVehicles(result.route, vehicles);
      
      // 時間の自動計算
      let calculatedDepartureTime = tourData.departureTime;
      let calculatedStartTime = tourData.startTime;
      
      if (!tourData.isDepartureTimeFixed && guests.length > 0) {
        // 最も早い希望時間から送迎開始時間を計算
        const earliestPreferredTime = guests.reduce((earliest, guest) => {
          return guest.preferredTime.start < earliest ? guest.preferredTime.start : earliest;
        }, guests[0].preferredTime.start);
        
        // 最初のピックアップの30分前を送迎開始時間とする
        const [hours, minutes] = earliestPreferredTime.split(':').map(Number);
        let depHour = hours;
        let depMinute = minutes - 30;
        
        if (depMinute < 0) {
          depHour -= 1;
          depMinute += 60;
        }
        
        calculatedDepartureTime = `${String(depHour).padStart(2, '0')}:${String(depMinute).padStart(2, '0')}`;
      }
      
      if (!tourData.isStartTimeFixed && vehicleRoutes.length > 0) {
        // 最後のピックアップ時間からアクティビティ開始時間を計算
        let latestPickupTime = null;
        
        vehicleRoutes.forEach(vr => {
          vr.route.forEach(item => {
            if (!latestPickupTime || item.pickup_time > latestPickupTime) {
              latestPickupTime = item.pickup_time;
            }
          });
        });
        
        if (latestPickupTime) {
          const [hours, minutes] = latestPickupTime.split(':').map(Number);
          let startHour = hours;
          let startMinute = minutes + 30; // 移動時間30分
          
          // 環境条件による調整
          if (environmentalData.tide.level > 200) {
            startMinute += 30; // 満潮時
          } else if (environmentalData.tide.level < 100) {
            startMinute -= 15; // 干潮時
          }
          
          if (environmentalData.weather.windSpeed > 5) {
            startMinute += 20; // 強風時
          }
          
          // 時間の正規化
          if (startMinute >= 60) {
            startHour += Math.floor(startMinute / 60);
            startMinute = startMinute % 60;
          }
          
          calculatedStartTime = `${String(startHour).padStart(2, '0')}:${String(startMinute).padStart(2, '0')}`;
        }
      }
      
      // 計算された時間でtourDataを更新
      setTourData(prev => ({
        ...prev,
        departureTime: calculatedDepartureTime,
        startTime: calculatedStartTime,
      }));
      
      // 各車両ルートに送迎開始時間を設定
      vehicleRoutes.forEach(vr => {
        vr.departure_time = calculatedDepartureTime;
      });
      
      setOptimizedRoutes(vehicleRoutes);
      setPrediction(result.prediction);

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
          pickup_time: `0${7 + Math.floor(index / 2)}:${index % 2 === 0 ? '00' : '30'}`,
          time_compliance: index === 0 ? 'optimal' : (index === 1 ? 'acceptable' : 'warning'),
          preferred_pickup_start: guest.preferredTime.start,
          preferred_pickup_end: guest.preferredTime.end,
        })),
        total_distance: 25.5,
        estimated_duration: '45分',
      };
      
      // デモデータでも時間を自動計算
      let calculatedDepartureTime = tourData.departureTime;
      let calculatedStartTime = tourData.startTime;
      
      if (!tourData.isDepartureTimeFixed) {
        calculatedDepartureTime = '06:30'; // デモ用のデフォルト
      }
      
      if (!tourData.isStartTimeFixed) {
        // 最後のピックアップ時間 + 30分
        const lastPickup = dummyRoute.route[dummyRoute.route.length - 1].pickup_time;
        const [hours, minutes] = lastPickup.split(':').map(Number);
        let startHour = hours;
        let startMinute = minutes + 30;
        
        if (startMinute >= 60) {
          startHour += 1;
          startMinute -= 60;
        }
        
        calculatedStartTime = `${String(startHour).padStart(2, '0')}:${String(startMinute).padStart(2, '0')}`;
      }
      
      setTourData(prev => ({
        ...prev,
        departureTime: calculatedDepartureTime,
        startTime: calculatedStartTime,
      }));
      
      const vehicleRoutes = distributeGuestsToVehicles(dummyRoute.route, vehicles);
      vehicleRoutes.forEach(vr => {
        vr.departure_time = calculatedDepartureTime;
      });
      
      setOptimizedRoutes(vehicleRoutes);
      setPrediction({
        accuracy: 92,
        expected_delays: guests.map(g => ({
          guest_name: g.name,
          predicted_delay: Math.floor(Math.random() * 5),
        })),
        recommendations: ['交通量が少ない早朝の送迎をお勧めします'],
      });

      const updatedGuests = guests.map((guest, index) => ({
        ...guest,
        pickupTime: `0${7 + Math.floor(index / 2)}:${index % 2 === 0 ? '00' : '30'}`,
      }));
      setGuests(updatedGuests);
    } finally {
      setLoading(false);
    }
  }, [tourData, guests, vehicles, environmentalData]);

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

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      {/* ヘッダー */}
      <Box sx={{ bgcolor: 'primary.main', color: 'white', py: 2 }}>
        <Container maxWidth="xl">
          <Grid container alignItems="center" justifyContent="space-between">
            <Grid item>
              <Typography variant="h4" fontWeight="bold">
                🌊 石垣島ツアー最適化システム
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                環境予測と機械学習による最適送迎ルート
              </Typography>
            </Grid>
            <Grid item>
              <Box sx={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                    {environmentalData.tide.level}cm
                  </Typography>
                  <Typography variant="caption">
                    潮位 ({environmentalData.tide.state})
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                    {environmentalData.weather.windSpeed}m/s
                  </Typography>
                  <Typography variant="caption">風速</Typography>
                </Box>
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
                {/* 環境データ更新ボタン */}
                <Button
                  variant="outlined"
                  size="small"
                  onClick={updateEnvironmentalData}
                  sx={{ 
                    color: 'white', 
                    borderColor: 'white',
                    '&:hover': { 
                      borderColor: 'white',
                      bgcolor: 'rgba(255,255,255,0.1)'
                    }
                  }}
                >
                  🔄 更新
                </Button>
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
                <Box sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  bgcolor: 'rgba(255,255,255,0.9)',
                  p: 3,
                  borderRadius: 2,
                  boxShadow: 3,
                }}>
                  <CircularProgress />
                  <Typography sx={{ mt: 2 }}>ルートを最適化中...</Typography>
                </Box>
              )}
            </Paper>
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="contained"
                size="large"
                onClick={handleOptimize}
                disabled={loading || guests.length === 0}
                sx={{ px: 4, py: 1.5 }}
              >
                🚀 ルートを最適化
              </Button>
            </Box>
          </Grid>

          {/* 右サイドパネル */}
          <Grid item xs={12} md={3}>
            {optimizedRoutes.length > 0 ? (
              <Paper sx={{ p: 2 }}>
                <FinalSchedule
                  vehicles={vehicles}
                  optimizedRoutes={optimizedRoutes}
                  tourData={tourData}
                  onUpdateTourData={setTourData}
                  environmentalData={environmentalData}
                />
              </Paper>
            ) : (
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  ルートを最適化すると、ここに結果が表示されます
                </Typography>
              </Paper>
            )}
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

export default App;