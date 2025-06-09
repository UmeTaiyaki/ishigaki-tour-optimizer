import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Chip,
  Grid,
  Alert,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  WbSunny as SunnyIcon,
  Waves as WavesIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';

const TourSettings = ({ tourData, onUpdate, environmentalData }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  // 石垣島の活動タイプ
  const ishigakiActivityTypes = {
    'snorkeling': {
      label: 'シュノーケリング',
      icon: '🤿',
      description: '川平湾、白保海岸での体験',
      optimalTide: 'high',
      duration: 180 // 3時間
    },
    'diving': {
      label: 'ダイビング',
      icon: '🏊',
      description: 'マンタポイント、石西礁湖',
      optimalTide: 'any',
      duration: 240 // 4時間
    },
    'kayak': {
      label: 'カヤック',
      icon: '🛶',
      description: 'マングローブツアー',
      optimalTide: 'mid',
      duration: 120 // 2時間
    },
    'sup': {
      label: 'SUP',
      icon: '🏄',
      description: 'スタンドアップパドル',
      optimalTide: 'calm',
      duration: 90 // 1.5時間
    },
    'glass_boat': {
      label: 'グラスボート',
      icon: '🚤',
      description: '川平湾グラスボート遊覧',
      optimalTide: 'high',
      duration: 45 // 45分
    },
    'sunset': {
      label: 'サンセット観賞',
      icon: '🌅',
      description: 'サンセットビーチ',
      optimalTide: 'any',
      duration: 60 // 1時間
    },
    'sightseeing': {
      label: '観光ツアー',
      icon: '🗺️',
      description: '島内観光地巡り',
      optimalTide: 'any',
      duration: 300 // 5時間
    }
  };

  // 安全な更新関数
  const handleUpdate = (field, value) => {
    if (onUpdate && typeof onUpdate === 'function') {
      const updatedData = { ...tourData, [field]: value };
      onUpdate(updatedData);
    } else {
      console.warn('onUpdate関数が提供されていません');
    }
  };

  // 活動タイプ変更時の処理
  const handleActivityTypeChange = (activityType) => {
    const activity = ishigakiActivityTypes[activityType];
    if (!activity) return;

    let newData = { ...tourData, activityType };
    
    // 推奨開始時間の自動調整
    const optimalStartTime = getOptimalStartTime(activityType, environmentalData);
    if (optimalStartTime) {
      newData.startTime = optimalStartTime;
    }

    // 推奨場所の自動設定
    const optimalLocation = getOptimalLocation(activityType);
    if (optimalLocation) {
      newData.activityLocation = optimalLocation;
    }

    if (onUpdate && typeof onUpdate === 'function') {
      onUpdate(newData);
    }
  };

  // 最適な開始時間を計算
  const getOptimalStartTime = (activityType, envData) => {
    const activity = ishigakiActivityTypes[activityType];
    if (!activity) return null;

    const currentHour = new Date().getHours();
    let optimalHour = 10; // デフォルト10時

    switch (activity.optimalTide) {
      case 'high':
        // 高潮時を狙う
        if (envData?.tide?.high_times?.length > 0) {
          const nextHigh = envData.tide.high_times[0];
          if (nextHigh?.time) {
            const highHour = parseInt(nextHigh.time.split(':')[0]);
            optimalHour = Math.max(8, Math.min(16, highHour - 1)); // 1時間前に開始
          }
        }
        break;
      case 'mid':
        optimalHour = 11; // 中潮位狙い
        break;
      case 'calm':
        optimalHour = 9;  // 早朝の穏やかな時間
        break;
      default:
        // 天候に基づく調整
        if (envData?.weather?.condition === 'sunny') {
          optimalHour = activityType === 'sunset' ? 17 : 10;
        }
    }

    return `${optimalHour.toString().padStart(2, '0')}:00`;
  };

  // 推奨場所を取得
  const getOptimalLocation = (activityType) => {
    const locations = {
      'snorkeling': { lat: 24.4219, lng: 124.1542, name: '川平湾' },
      'diving': { lat: 24.3754, lng: 124.1726, name: 'マンタポイント' },
      'kayak': { lat: 24.4198, lng: 124.1489, name: '底地海岸' },
      'sup': { lat: 24.3889, lng: 124.1253, name: 'フサキビーチ' },
      'glass_boat': { lat: 24.4219, lng: 124.1542, name: '川平湾' },
      'sunset': { lat: 24.4567, lng: 124.1289, name: 'サンセットビーチ' },
      'sightseeing': { lat: 24.4445, lng: 124.2134, name: '玉取崎展望台' }
    };
    return locations[activityType] || null;
  };

  // 環境的な推奨事項を取得
  const getEnvironmentalRecommendations = () => {
    const recommendations = [];
    
    if (environmentalData?.weather?.typhoon_risk > 0.3) {
      recommendations.push({
        type: 'warning',
        message: '台風の影響が予想されます。屋内活動をお勧めします。'
      });
    }
    
    if (environmentalData?.tide?.current_level > 180) {
      recommendations.push({
        type: 'info',
        message: '大潮のため、シュノーケリングに最適な条件です。'
      });
    }
    
    if (environmentalData?.weather?.wind_speed > 5) {
      recommendations.push({
        type: 'warning',
        message: '風が強いため、海上活動は注意が必要です。'
      });
    }

    return recommendations;
  };

  const recommendations = getEnvironmentalRecommendations();

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        🏝️ ツアー設定（石垣島）
      </Typography>

      <Grid container spacing={2}>
        {/* 基本設定 */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="ツアー日"
            type="date"
            value={tourData.date}
            onChange={(e) => handleUpdate('date', e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ mb: 2 }}
          />
        </Grid>

        <Grid item xs={12}>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>活動タイプ</InputLabel>
            <Select
              value={tourData.activityType}
              onChange={(e) => handleActivityTypeChange(e.target.value)}
              label="活動タイプ"
            >
              {Object.entries(ishigakiActivityTypes).map(([key, activity]) => (
                <MenuItem key={key} value={key}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span>{activity.icon}</span>
                    <Box>
                      <Typography variant="body2">{activity.label}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {activity.description}
                      </Typography>
                    </Box>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="開始時間"
            type="time"
            value={tourData.startTime}
            onChange={(e) => handleUpdate('startTime', e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ mb: 2 }}
          />
        </Grid>

        {/* 詳細設定 */}
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={showAdvanced}
                onChange={(e) => setShowAdvanced(e.target.checked)}
              />
            }
            label="詳細設定"
          />
        </Grid>

        {showAdvanced && (
          <>
            <Grid item xs={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={tourData.weatherPriority}
                    onChange={(e) => handleUpdate('weatherPriority', e.target.checked)}
                  />
                }
                label="天候考慮"
              />
            </Grid>
            <Grid item xs={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={tourData.tidePriority}
                    onChange={(e) => handleUpdate('tidePriority', e.target.checked)}
                  />
                }
                label="潮位考慮"
              />
            </Grid>
          </>
        )}
      </Grid>

      {/* 現在の環境情報 */}
      <Card sx={{ mt: 2, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
        <CardContent>
          <Typography variant="subtitle2" gutterBottom>
            📊 現在の石垣島状況
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Chip
              icon={<SunnyIcon />}
              label={`${environmentalData?.weather?.temperature || 26}°C`}
              size="small"
              sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'inherit' }}
            />
            <Chip
              icon={<WavesIcon />}
              label={`潮位 ${environmentalData?.tide?.current_level || 150}cm`}
              size="small"
              sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'inherit' }}
            />
            <Chip
              icon={<ScheduleIcon />}
              label={`風速 ${environmentalData?.weather?.wind_speed || 4.0}m/s`}
              size="small"
              sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'inherit' }}
            />
          </Box>
        </CardContent>
      </Card>

      {/* 活動情報表示 */}
      {tourData.activityType && ishigakiActivityTypes[tourData.activityType] && (
        <Card sx={{ mt: 2 }}>
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>
              {ishigakiActivityTypes[tourData.activityType].icon} 
              {ishigakiActivityTypes[tourData.activityType].label}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              所要時間: {Math.floor(ishigakiActivityTypes[tourData.activityType].duration / 60)}時間
              {ishigakiActivityTypes[tourData.activityType].duration % 60 !== 0 && 
                `${ishigakiActivityTypes[tourData.activityType].duration % 60}分`}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              推奨潮位: {ishigakiActivityTypes[tourData.activityType].optimalTide === 'high' ? '高潮' :
                       ishigakiActivityTypes[tourData.activityType].optimalTide === 'mid' ? '中潮' :
                       ishigakiActivityTypes[tourData.activityType].optimalTide === 'calm' ? '穏やか' : '任意'}
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* 環境に基づく推奨事項 */}
      {recommendations.length > 0 && (
        <Box sx={{ mt: 2 }}>
          {recommendations.map((rec, index) => (
            <Alert key={index} severity={rec.type} sx={{ mb: 1 }}>
              {rec.message}
            </Alert>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default TourSettings;