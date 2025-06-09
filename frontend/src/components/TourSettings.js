import React, { useState, useEffect } from 'react';
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
  FormControlLabel,
  Checkbox,
  Paper,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  WbSunny as SunnyIcon,
  Waves as WavesIcon,
  Schedule as ScheduleIcon,
  DirectionsCar as DirectionsCarIcon,
  AccessTime as AccessTimeIcon,
  Info as InfoIcon
} from '@mui/icons-material';

// 石垣島の活動タイプ（コンポーネント外で定義）
const ishigakiActivityTypes = {
  'snorkeling': {
    label: 'シュノーケリング',
    icon: '🤿',
    description: '川平湾、白保海岸での体験',
    optimalTide: 'high',
    duration: 180,
    locations: {
      'kabira_bay': '川平湾',
      'yonehara_beach': '米原ビーチ',
      'ishizaki_beach': '石崎ビーチ'
    }
  },
  'diving': {
    label: 'ダイビング',
    icon: '🏊',
    description: 'マンタポイント、石西礁湖',
    optimalTide: 'any',
    duration: 240,
    locations: {
      'manta_scramble': 'マンタスクランブル',
      'kabira_ishizaki': '川平石崎',
      'osaki_hanagoi': '大崎ハナゴイリーフ'
    }
  },
  'kayak': {
    label: 'カヤック',
    icon: '🛶',
    description: 'マングローブツアー',
    optimalTide: 'mid',
    duration: 120,
    locations: {
      'miyara_river': '宮良川',
      'nagura_amparu': '名蔵アンパル',
      'fukido_river': '吹通川'
    }
  },
  'sup': {
    label: 'SUP',
    icon: '🏄',
    description: 'スタンドアップパドル',
    optimalTide: 'calm',
    duration: 90,
    locations: {
      'kabira_bay': '川平湾',
      'nagura_bay': '名蔵湾',
      'sunset_beach': 'サンセットビーチ'
    }
  },
  'glass_boat': {
    label: 'グラスボート',
    icon: '🚤',
    description: '川平湾グラスボート遊覧',
    optimalTide: 'high',
    duration: 45,
    locations: {
      'kabira_bay': '川平湾'
    }
  },
  'sunset': {
    label: 'サンセット観賞',
    icon: '🌅',
    description: 'サンセットビーチ',
    optimalTide: 'any',
    duration: 60,
    locations: {
      'fusaki_beach': 'フサキビーチ',
      'sunset_beach': 'サンセットビーチ'
    }
  },
  'sightseeing': {
    label: '観光ツアー',
    icon: '🗺️',
    description: '島内観光地巡り',
    optimalTide: 'any',
    duration: 300,
    locations: {
      'tamatorizaki': '玉取崎展望台',
      'yaeyama_museum': '八重山博物館',
      'banna_park': 'バンナ公園'
    }
  }
};

// デフォルトロケーションの座標
const defaultLocations = {
  'kabira_bay': { lat: 24.4219, lng: 124.1542, name: '川平湾' },
  'yonehara_beach': { lat: 24.4856, lng: 124.2456, name: '米原ビーチ' },
  'ishizaki_beach': { lat: 24.3789, lng: 124.1356, name: '石崎ビーチ' },
  'manta_scramble': { lat: 24.3754, lng: 124.1726, name: 'マンタスクランブル' },
  'kabira_ishizaki': { lat: 24.3856, lng: 124.1456, name: '川平石崎' },
  'osaki_hanagoi': { lat: 24.2789, lng: 124.0856, name: '大崎ハナゴイリーフ' },
  'miyara_river': { lat: 24.3456, lng: 124.1789, name: '宮良川' },
  'nagura_amparu': { lat: 24.3956, lng: 124.1389, name: '名蔵アンパル' },
  'fukido_river': { lat: 24.4678, lng: 124.2234, name: '吹通川' },
  'nagura_bay': { lat: 24.3889, lng: 124.1234, name: '名蔵湾' },
  'sunset_beach': { lat: 24.4567, lng: 124.1289, name: 'サンセットビーチ' },
  'fusaki_beach': { lat: 24.3678, lng: 124.1123, name: 'フサキビーチ' },
  'tamatorizaki': { lat: 24.4445, lng: 124.2134, name: '玉取崎展望台' },
  'yaeyama_museum': { lat: 24.3345, lng: 124.1556, name: '八重山博物館' },
  'banna_park': { lat: 24.3756, lng: 124.1889, name: 'バンナ公園' }
};

const TourSettings = ({ tourData, onUpdate, environmentalData }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // 時間設定の手動/自動切り替え用のstate
  const [manualDepartureTime, setManualDepartureTime] = useState(false);
  const [manualActivityTime, setManualActivityTime] = useState(false);
  const [departureTime, setDepartureTime] = useState('07:00');
  const [activityStartTime, setActivityStartTime] = useState('10:00');

  // 安全な更新関数
  const handleUpdate = (field, value) => {
    if (onUpdate && typeof onUpdate === 'function') {
      const updatedData = { ...tourData, [field]: value };
      onUpdate(updatedData);
    } else {
      console.warn('onUpdate関数が提供されていません');
    }
  };

  // 初期化時にactivityLocationを設定
  useEffect(() => {
    if (!tourData.activityLocation && tourData.activityType && ishigakiActivityTypes[tourData.activityType]) {
      const activityConfig = ishigakiActivityTypes[tourData.activityType];
      if (activityConfig && activityConfig.locations) {
        const firstLocationKey = Object.keys(activityConfig.locations)[0];
        
        if (defaultLocations[firstLocationKey]) {
          handleUpdate('activityLocation', defaultLocations[firstLocationKey]);
        }
      }
    }
  }, [tourData.activityType]); // activityTypeが変更されたときに実行

  // 最適な開始時間を計算
  const getOptimalStartTime = (activityType, envData) => {
    const activity = ishigakiActivityTypes[activityType];
    if (!activity) return null;

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

  // 活動タイプ変更時の処理
  const handleActivityTypeChange = (activityType) => {
    const activity = ishigakiActivityTypes[activityType];
    if (!activity) return;

    let newData = { ...tourData, activityType };
    
    // 最初のロケーションを自動設定
    const locations = activity.locations;
    const firstLocationKey = Object.keys(locations)[0];
    
    if (defaultLocations[firstLocationKey]) {
      newData.activityLocation = defaultLocations[firstLocationKey];
    }

    // 推奨開始時間の自動調整（手動設定でない場合）
    if (!manualActivityTime) {
      const optimalStartTime = getOptimalStartTime(activityType, environmentalData);
      if (optimalStartTime) {
        setActivityStartTime(optimalStartTime);
        newData.startTime = optimalStartTime;
      }
    }

    if (onUpdate && typeof onUpdate === 'function') {
      onUpdate(newData);
    }
  };

  // 送迎開始時間の変更
  const handleDepartureTimeChange = (e) => {
    const newTime = e.target.value;
    setDepartureTime(newTime);
    if (manualDepartureTime) {
      handleUpdate('departureTime', newTime);
    }
  };

  // アクティビティ開始時間の変更
  const handleActivityTimeChange = (e) => {
    const newTime = e.target.value;
    setActivityStartTime(newTime);
    if (manualActivityTime) {
      handleUpdate('startTime', newTime);
    }
  };

  // チェックボックスの切り替え
  const handleDepartureCheckChange = (e) => {
    const checked = e.target.checked;
    setManualDepartureTime(checked);
    if (checked) {
      handleUpdate('departureTime', departureTime);
    } else {
      // 自動モードに切り替え時は値をクリア
      handleUpdate('departureTime', null);
    }
  };

  const handleActivityCheckChange = (e) => {
    const checked = e.target.checked;
    setManualActivityTime(checked);
    if (checked) {
      handleUpdate('startTime', activityStartTime);
    } else {
      // 自動モードに切り替え時は、デフォルト値を設定（APIエラー回避）
      handleUpdate('startTime', activityStartTime);
    }
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

        <Grid item xs={12} md={6}>
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

        <Grid item xs={12} md={6}>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>活動場所</InputLabel>
            <Select
              value={tourData.activityLocation?.name || ''}
              onChange={(e) => {
                // 選択された場所名から座標を取得
                const selectedName = e.target.value;
                let selectedLocation = null;
                
                // 全てのアクティビティタイプのロケーションから検索
                if (tourData.activityType && ishigakiActivityTypes[tourData.activityType]) {
                  const locations = ishigakiActivityTypes[tourData.activityType].locations;
                  for (const [key, name] of Object.entries(locations)) {
                    if (name === selectedName) {
                      if (defaultLocations[key]) {
                        selectedLocation = defaultLocations[key];
                        break;
                      }
                    }
                  }
                }
                
                if (selectedLocation) {
                  handleUpdate('activityLocation', selectedLocation);
                }
              }}
              label="活動場所"
            >
              {tourData.activityType && 
                Object.entries(ishigakiActivityTypes[tourData.activityType].locations).map(([key, name]) => (
                  <MenuItem key={key} value={name}>
                    {name}
                  </MenuItem>
                ))
              }
            </Select>
          </FormControl>
        </Grid>

        {/* 送迎開始時間 */}
        <Grid item xs={12}>
          <Paper sx={{ 
            p: 2,
            bgcolor: manualDepartureTime ? 'background.paper' : 'grey.50',
            border: '1px solid',
            borderColor: 'divider'
          }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={manualDepartureTime}
                  onChange={handleDepartureCheckChange}
                  icon={<DirectionsCarIcon />}
                  checkedIcon={<DirectionsCarIcon color="primary" />}
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="subtitle2">送迎開始時間を固定</Typography>
                  <Tooltip title="チェックを外すと、ゲストの希望時間から自動計算されます">
                    <IconButton size="small">
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              }
            />
            <TextField
              fullWidth
              label="送迎開始時間"
              type="time"
              value={departureTime}
              onChange={handleDepartureTimeChange}
              disabled={!manualDepartureTime}
              InputLabelProps={{ shrink: true }}
              sx={{ mt: 2 }}
              helperText={
                manualDepartureTime 
                  ? "送迎開始時間を固定" 
                  : "ゲストの希望時間から自動計算されます"
              }
            />
          </Paper>
        </Grid>

        {/* アクティビティ開始時間 */}
        <Grid item xs={12}>
          <Paper sx={{ 
            p: 2,
            bgcolor: manualActivityTime ? 'background.paper' : 'grey.50',
            border: '1px solid',
            borderColor: 'divider'
          }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={manualActivityTime}
                  onChange={handleActivityCheckChange}
                  icon={<AccessTimeIcon />}
                  checkedIcon={<AccessTimeIcon color="primary" />}
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="subtitle2">アクティビティ開始時間を固定</Typography>
                  <Tooltip title="チェックを外すと、送迎完了時間から自動計算されます">
                    <IconButton size="small">
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              }
            />
            <TextField
              fullWidth
              label="アクティビティ開始時間"
              type="time"
              value={activityStartTime}
              onChange={handleActivityTimeChange}
              disabled={!manualActivityTime}
              InputLabelProps={{ shrink: true }}
              sx={{ mt: 2 }}
              helperText={
                manualActivityTime 
                  ? "アクティビティ開始時間を固定" 
                  : "送迎完了時間から自動計算されます"
              }
            />
          </Paper>
        </Grid>

        {/* 高度な設定 */}
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={showAdvanced}
                onChange={(e) => setShowAdvanced(e.target.checked)}
              />
            }
            label="高度な設定を表示"
          />
        </Grid>

        {showAdvanced && (
          <>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="最大待機時間（分）"
                type="number"
                value={tourData.maxWaitTime || 30}
                onChange={(e) => handleUpdate('maxWaitTime', parseInt(e.target.value))}
                inputProps={{ min: 0, max: 60 }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="バッファー時間（分）"
                type="number"
                value={tourData.bufferTime || 10}
                onChange={(e) => handleUpdate('bufferTime', parseInt(e.target.value))}
                inputProps={{ min: 0, max: 30 }}
              />
            </Grid>
          </>
        )}
      </Grid>

      {/* 環境情報カード */}
      <Card sx={{ mt: 2, bgcolor: 'primary.light', color: 'white' }}>
        <CardContent>
          <Typography variant="subtitle2" gutterBottom>
            🌤️ 現在の環境情報
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip
              icon={<SunnyIcon />}
              label={`気温 ${environmentalData?.weather?.temperature || 26}°C`}
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

      {/* 自動計算の説明 */}
      <Box sx={{ 
        bgcolor: 'info.50', 
        p: 2, 
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'info.200',
        mt: 2
      }}>
        <Typography variant="caption" color="text.secondary">
          <strong>自動計算について：</strong><br />
          • 送迎開始時間：ゲストの希望時間と気象条件から最適な時間を計算<br />
          • アクティビティ開始時間：全ゲストのピックアップ完了予定時刻から算出
        </Typography>
      </Box>
    </Box>
  );
};

export default TourSettings;