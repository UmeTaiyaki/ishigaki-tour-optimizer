import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Grid,
  Alert,
  AlertTitle,
  Button,
  Card,
  CardContent,
  Collapse,
} from '@mui/material';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PersonIcon from '@mui/icons-material/Person';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import FlagIcon from '@mui/icons-material/Flag';
import WavesIcon from '@mui/icons-material/Waves';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const FinalSchedule = ({ vehicles, optimizedRoutes, tourData, onUpdateTourData, environmentalData }) => {
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [recommendedStartTime, setRecommendedStartTime] = useState(null);
  const [suggestions, setSuggestions] = useState([]);

  // useEffectをコンポーネントのトップレベルに配置
  useEffect(() => {
    if (!optimizedRoutes || optimizedRoutes.length === 0) return;

    // ピックアップ時間の範囲を計算
    let latestPickupTime = null;
    optimizedRoutes.forEach((vehicleRoute) => {
      vehicleRoute.route.forEach((item) => {
        const pickupTime = item.pickup_time;
        if (!latestPickupTime || pickupTime > latestPickupTime) {
          latestPickupTime = pickupTime;
        }
      });
    });

    if (latestPickupTime && environmentalData) {
      // 推奨時間の計算
      const calculateRecommendedTime = () => {
        const [hours, minutes] = latestPickupTime.split(':').map(Number);
        let recommendedHour = hours;
        let recommendedMinute = minutes + 30; // 移動時間30分を想定

        if (recommendedMinute >= 60) {
          recommendedHour += Math.floor(recommendedMinute / 60);
          recommendedMinute = recommendedMinute % 60;
        }

        // 潮位による調整
        if (environmentalData.tide.level > 200) {
          recommendedMinute += 30;
        } else if (environmentalData.tide.level < 100) {
          recommendedMinute -= 15;
        }

        // 風速による調整
        if (environmentalData.weather.windSpeed > 5) {
          recommendedMinute += 20;
        }

        // 時間の正規化
        if (recommendedMinute >= 60) {
          recommendedHour += Math.floor(recommendedMinute / 60);
          recommendedMinute = recommendedMinute % 60;
        } else if (recommendedMinute < 0) {
          recommendedHour -= 1;
          recommendedMinute = 60 + recommendedMinute;
        }

        return `${String(recommendedHour).padStart(2, '0')}:${String(recommendedMinute).padStart(2, '0')}`;
      };

      const recommended = calculateRecommendedTime();
      setRecommendedStartTime(recommended);
    }
  }, [optimizedRoutes, environmentalData, tourData.startTime]);

  // 早期リターンは全てのHooksの後に配置
  if (!optimizedRoutes || optimizedRoutes.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body2" color="text.secondary">
          ルートを最適化してください
        </Typography>
      </Box>
    );
  }

  // 全体の警告チェック
  const warnings = [];
  const errors = [];
  const dynamicSuggestions = [];
  let totalGuestCount = 0;
  let totalCapacity = 0;
  let earliestPickupTime = null;
  let latestPickupTime = null;

  optimizedRoutes.forEach((vehicleRoute, vehicleIndex) => {
    const vehicle = vehicles[vehicleIndex];
    const passengers = vehicleRoute.route.reduce((sum, item) => sum + item.num_people, 0);
    totalGuestCount += passengers;
    totalCapacity += vehicle.capacity;
    
    if (passengers > vehicle.capacity) {
      errors.push({
        type: 'overcapacity',
        vehicleId: vehicle.id,
        vehicleName: vehicle.name,
        passengers,
        capacity: vehicle.capacity,
        overcapacityRate: Math.round((passengers / vehicle.capacity) * 100)
      });
    }

    // ピックアップ時間の範囲を記録
    vehicleRoute.route.forEach((item) => {
      const pickupTime = item.pickup_time;
      if (!earliestPickupTime || pickupTime < earliestPickupTime) {
        earliestPickupTime = pickupTime;
      }
      if (!latestPickupTime || pickupTime > latestPickupTime) {
        latestPickupTime = pickupTime;
      }
    });
  });

  // 全体の輸送能力チェック
  if (totalGuestCount > totalCapacity) {
    errors.push({
      type: 'insufficient_vehicles',
      totalGuests: totalGuestCount,
      totalCapacity: totalCapacity,
      shortage: totalGuestCount - totalCapacity
    });
  }

  // 時間的な警告チェックと改善提案の生成
  const timeAdjustmentGuests = [];
  optimizedRoutes.forEach((vehicleRoute, vehicleIndex) => {
    vehicleRoute.route.forEach((item) => {
      if (item.time_compliance === 'warning' || item.time_compliance === 'acceptable') {
        warnings.push({
          type: 'time_adjustment',
          guestName: item.name,
          pickupTime: item.pickup_time,
          preferredStart: item.preferred_pickup_start,
          preferredEnd: item.preferred_pickup_end
        });
        timeAdjustmentGuests.push(item);
      }
    });
  });

  // 改善提案の生成
  if (timeAdjustmentGuests.length > 0) {
    dynamicSuggestions.push({
      type: 'schedule_adjustment',
      priority: 'high',
      title: 'スケジュール調整の推奨',
      items: [
        '車両を1台追加して、ゲストを分散させる',
        'ピックアップの順序を最適化し直す',
        'アクティビティ開始時間を遅らせる'
      ]
    });
  }

  // アクティビティ時間の提案
  if (recommendedStartTime && recommendedStartTime !== tourData.startTime) {
    dynamicSuggestions.push({
      type: 'activity_time',
      priority: 'medium',
      title: 'アクティビティ開始時間の最適化',
      items: [
        `現在の設定: ${tourData.startTime} → 推奨: ${recommendedStartTime}`,
        `理由: ${environmentalData.tide.level > 200 ? '満潮' : environmentalData.tide.level < 100 ? '干潮' : '適正潮位'}による調整`,
        `風速${environmentalData.weather.windSpeed}m/sを考慮`
      ]
    });
  }

  // 潮位に基づく推奨事項
  if (environmentalData && environmentalData.tide.level > 250) {
    dynamicSuggestions.push({
      type: 'environmental',
      priority: 'high',
      title: '潮位に関する注意',
      items: [
        '満潮により、一部のアクセスポイントが使用できない可能性があります',
        '代替ルートの確認をお勧めします',
        '安全装備の追加準備を検討してください'
      ]
    });
  }

  const handleApplyRecommendedTime = () => {
    if (recommendedStartTime && onUpdateTourData) {
      onUpdateTourData({
        ...tourData,
        startTime: recommendedStartTime
      });
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        📋 最終スケジュール
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {tourData.date} - {tourData.activityType}
      </Typography>

      {/* エラーメッセージ */}
      {errors.length > 0 && (
        <Box sx={{ mb: 2 }}>
          {errors.map((error, index) => (
            <Alert severity="error" key={index} sx={{ mb: 1 }} icon={<ErrorIcon />}>
              <AlertTitle>輸送不可能</AlertTitle>
              {error.type === 'overcapacity' && (
                <>
                  <strong>{error.vehicleName}</strong>が定員オーバーです！
                  <br />
                  乗車人数: {error.passengers}名 / 定員: {error.capacity}名 
                  （乗車率: <strong>{error.overcapacityRate}%</strong>）
                  <br />
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    推奨: 車両を追加するか、ゲストを他の車両に振り分けてください。
                  </Typography>
                </>
              )}
              {error.type === 'insufficient_vehicles' && (
                <>
                  車両の総定員が不足しています！
                  <br />
                  必要人数: {error.totalGuests}名 / 総定員: {error.totalCapacity}名
                  <br />
                  不足: <strong>{error.shortage}名分</strong>
                  <br />
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    推奨: 最低でも{Math.ceil(error.shortage / 7)}台の追加車両が必要です。
                  </Typography>
                </>
              )}
            </Alert>
          ))}
        </Box>
      )}

      {/* 改善提案セクション */}
      {dynamicSuggestions.length > 0 && (
        <Card sx={{ mb: 2, bgcolor: '#f0f4ff', border: '1px solid #1976d2' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TipsAndUpdatesIcon color="primary" />
                <Typography variant="subtitle1" fontWeight="bold" color="primary">
                  改善提案
                </Typography>
              </Box>
              <Button
                size="small"
                onClick={() => setShowSuggestions(!showSuggestions)}
                endIcon={showSuggestions ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              >
                {showSuggestions ? '折りたたむ' : '展開'}
              </Button>
            </Box>
            
            <Collapse in={showSuggestions}>
              {dynamicSuggestions.map((suggestion, index) => (
                <Box key={index} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Chip
                      size="small"
                      label={
                        suggestion.priority === 'high' ? '優先度: 高' :
                        suggestion.priority === 'medium' ? '優先度: 中' : '優先度: 低'
                      }
                      color={
                        suggestion.priority === 'high' ? 'error' :
                        suggestion.priority === 'medium' ? 'warning' : 'default'
                      }
                    />
                    <Typography variant="subtitle2" fontWeight="bold">
                      {suggestion.title}
                    </Typography>
                  </Box>
                  <List dense sx={{ pl: 2 }}>
                    {suggestion.items.map((item, itemIndex) => (
                      <ListItem key={itemIndex} sx={{ py: 0 }}>
                        <ListItemIcon sx={{ minWidth: 30 }}>
                          <LightbulbIcon fontSize="small" color="action" />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography variant="body2">
                              {item}
                            </Typography>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                  
                  {/* アクティビティ時間変更ボタン */}
                  {suggestion.type === 'activity_time' && recommendedStartTime && onUpdateTourData && (
                    <Box sx={{ mt: 1, pl: 2 }}>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<CheckCircleIcon />}
                        onClick={handleApplyRecommendedTime}
                        sx={{ textTransform: 'none' }}
                      >
                        推奨時間に変更 ({recommendedStartTime})
                      </Button>
                    </Box>
                  )}
                </Box>
              ))}
            </Collapse>
          </CardContent>
        </Card>
      )}

      {/* 警告メッセージ */}
      {warnings.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }} icon={<WarningIcon />}>
          <AlertTitle>調整が必要</AlertTitle>
          {warnings.map((warning, index) => (
            <Box key={index}>
              {warning.type === 'time_adjustment' && (
                <>
                  {warning.guestName}様のピックアップ時間（{warning.pickupTime}）が
                  希望時間（{warning.preferredStart}〜{warning.preferredEnd}）から外れています。
                </>
              )}
            </Box>
          ))}
        </Alert>
      )}

      {/* 各車両のスケジュール */}
      {optimizedRoutes.map((vehicleRoute, vehicleIndex) => {
        const vehicle = vehicles[vehicleIndex];
        const totalPassengers = vehicleRoute.route.reduce((sum, item) => sum + item.num_people, 0);
        const occupancyRate = Math.round((totalPassengers / vehicle.capacity) * 100);
        const isOvercapacity = totalPassengers > vehicle.capacity;
        
        return (
          <Paper 
            key={vehicleIndex} 
            sx={{ 
              mb: 2, 
              overflow: 'hidden',
              border: isOvercapacity ? '2px solid' : 'none',
              borderColor: isOvercapacity ? 'error.main' : 'transparent'
            }}
          >
            {/* 車両ヘッダー */}
            <Box sx={{ 
              p: 2, 
              bgcolor: isOvercapacity ? 'error.main' : vehicle.color, 
              color: 'white',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {isOvercapacity && <ErrorIcon />}
                <DirectionsCarIcon />
                <Typography variant="subtitle1" fontWeight="bold">
                  {vehicle.name}
                </Typography>
                {vehicle.driver && (
                  <Typography variant="body2">
                    ({vehicle.driver})
                  </Typography>
                )}
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip 
                  label={`${totalPassengers}/${vehicle.capacity}名`}
                  size="small"
                  sx={{ 
                    bgcolor: isOvercapacity ? 'white' : 'rgba(255,255,255,0.3)', 
                    color: isOvercapacity ? 'error.main' : 'white',
                    fontWeight: 'bold'
                  }}
                />
                {isOvercapacity && (
                  <Chip 
                    icon={<WarningIcon />}
                    label="定員超過"
                    size="small"
                    color="warning"
                    sx={{ bgcolor: 'white', color: 'warning.main' }}
                  />
                )}
              </Box>
            </Box>

            {/* スケジュール詳細 */}
            <List sx={{ py: 0 }}>
              {/* 出発地点 */}
              <ListItem sx={{ py: 1 }}>
                <ListItemIcon>
                  <FlagIcon color="success" />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" fontWeight="bold">
                        出発地点
                      </Typography>
                      <Typography variant="body2" color="primary">
                        {vehicleRoute.departure_time || '07:00'}
                      </Typography>
                    </Box>
                  }
                  secondary="送迎開始"
                />
              </ListItem>
              
              <Divider />

              {/* 各ゲストのピックアップ */}
              {vehicleRoute.route.map((item, index) => (
                <React.Fragment key={index}>
                  <ListItem sx={{ py: 1 }}>
                    <ListItemIcon>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        bgcolor: vehicle.color,
                        color: 'white',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        {index + 1}
                      </Box>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {item.name}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                              <PersonIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                              <Typography variant="caption" color="text.secondary">
                                {item.num_people}名
                              </Typography>
                              <LocationOnIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                              <Typography variant="caption" color="text.secondary">
                                {item.hotel_name}
                              </Typography>
                            </Box>
                          </Box>
                          <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="body2" color="primary" fontWeight="bold">
                              {item.pickup_time}
                            </Typography>
                            <Chip 
                              label={
                                item.time_compliance === 'optimal' ? '希望通り' :
                                item.time_compliance === 'acceptable' ? '許容範囲' : '要調整'
                              }
                              size="small"
                              color={
                                item.time_compliance === 'optimal' ? 'success' :
                                item.time_compliance === 'acceptable' ? 'warning' : 'error'
                              }
                              sx={{ height: 18, fontSize: '10px' }}
                            />
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < vehicleRoute.route.length - 1 && <Divider />}
                </React.Fragment>
              ))}
              
              <Divider />

              {/* アクティビティ地点 */}
              <ListItem sx={{ py: 1 }}>
                <ListItemIcon>
                  <WavesIcon color="error" />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" fontWeight="bold">
                        アクティビティ開始
                      </Typography>
                      <Typography variant="body2" color="error" fontWeight="bold">
                        {tourData.startTime}
                        {recommendedStartTime && recommendedStartTime !== tourData.startTime && (
                          <Chip
                            label={`推奨: ${recommendedStartTime}`}
                            size="small"
                            color="info"
                            sx={{ ml: 1, height: 18, fontSize: '10px' }}
                          />
                        )}
                      </Typography>
                    </Box>
                  }
                  secondary={tourData.activityType}
                />
              </ListItem>
            </List>

            {/* 統計情報 */}
            <Box sx={{ p: 1.5, bgcolor: isOvercapacity ? 'error.50' : 'grey.100' }}>
              <Grid container spacing={2} sx={{ textAlign: 'center' }}>
                <Grid item xs={4}>
                  <Typography variant="caption" color="text.secondary">
                    総距離
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {vehicleRoute.total_distance}km
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="caption" color="text.secondary">
                    所要時間
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {vehicleRoute.estimated_duration}
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="caption" color={isOvercapacity ? 'error' : 'text.secondary'}>
                    乗車率
                  </Typography>
                  <Typography 
                    variant="body2" 
                    fontWeight="bold"
                    color={isOvercapacity ? 'error' : 'text.primary'}
                  >
                    {occupancyRate}%
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        );
      })}

      {/* 全体統計 */}
      <Paper sx={{ p: 2, mt: 2, bgcolor: 'primary.main', color: 'white' }}>
        <Typography variant="subtitle2" gutterBottom>
          📊 全体統計
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-around' }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6">
              {vehicles.length}台
            </Typography>
            <Typography variant="caption">
              使用車両
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6">
              {optimizedRoutes.reduce((sum, r) => sum + r.route.length, 0)}名
            </Typography>
            <Typography variant="caption">
              総ゲスト数
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6">
              {optimizedRoutes.reduce((sum, r) => sum + parseFloat(r.total_distance), 0).toFixed(1)}km
            </Typography>
            <Typography variant="caption">
              総走行距離
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default FinalSchedule;