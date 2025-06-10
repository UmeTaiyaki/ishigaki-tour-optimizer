import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, TextField,
  FormControl, InputLabel, Select, MenuItem, Switch,
  FormControlLabel, Chip, Alert, Stack, Paper,
  Button, ButtonGroup, Tooltip, IconButton, Collapse,
  List, ListItem, ListItemIcon, ListItemText, Divider,
  Avatar, LinearProgress, Badge
} from '@mui/material';
import {
  Schedule as ScheduleIcon,
  Place as PlaceIcon,
  WbSunny as SunnyIcon,
  Cloud as CloudIcon,
  Waves as WavesIcon,
  AccessTime as TimeIcon,
  AutoAwesome as AutoIcon,
  Settings as SettingsIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  Thermostat as ThermostatIcon,
  Air as WindIcon,
  Visibility as VisibilityIcon,
  BeachAccess as UmbrellaIcon,
  DirectionsCar as CarIcon,
  Group as GroupIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';

const TourSetup = ({ 
  tourData, 
  onTourDataUpdate, 
  activityStartTime, 
  onActivityStartTimeUpdate, 
  environmentalData,
  guests = [],
  vehicles = []
}) => {
  const [manualMode, setManualMode] = useState(false);
  const [autoOptimize, setAutoOptimize] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [weatherExpanded, setWeatherExpanded] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [recommendations, setRecommendations] = useState([]);

  // 石垣島のアクティビティタイプ
  const ishigakiActivityTypes = {
    'snorkeling': {
      label: 'シュノーケリング',
      icon: '🤿',
      description: '川平湾、白保海岸での体験',
      optimalTide: 'high',
      duration: 180,
      popularSpots: ['川平湾', '米原ビーチ', '白保海岸'],
      season: 'all',
      difficulty: 'beginner',
      weatherSensitive: true
    },
    'diving': {
      label: 'ダイビング',
      icon: '🏊',
      description: 'マンタポイント、石西礁湖',
      optimalTide: 'any',
      duration: 240,
      popularSpots: ['マンタスクランブル', '川平石崎', 'ハナゴイリーフ'],
      season: 'all',
      difficulty: 'intermediate',
      weatherSensitive: true
    },
    'kayak': {
      label: 'カヤック',
      icon: '🛶',
      description: 'マングローブツアー',
      optimalTide: 'mid',
      duration: 120,
      popularSpots: ['宮良川', '名蔵アンパル', '吹通川'],
      season: 'all',
      difficulty: 'beginner',
      weatherSensitive: false
    },
    'sup': {
      label: 'SUP',
      icon: '🏄',
      description: 'スタンドアップパドル',
      optimalTide: 'calm',
      duration: 90,
      popularSpots: ['川平湾', '名蔵湾', 'サンセットビーチ'],
      season: 'all',
      difficulty: 'beginner',
      weatherSensitive: true
    },
    'glass_boat': {
      label: 'グラスボート',
      icon: '🚤',
      description: '川平湾グラスボート遊覧',
      optimalTide: 'high',
      duration: 45,
      popularSpots: ['川平湾'],
      season: 'all',
      difficulty: 'all',
      weatherSensitive: false
    },
    'sunset': {
      label: 'サンセット観賞',
      icon: '🌅',
      description: 'サンセットビーチ、フサキビーチ',
      optimalTide: 'any',
      duration: 120,
      popularSpots: ['サンセットビーチ', 'フサキビーチ', '御神崎'],
      season: 'all',
      difficulty: 'all',
      weatherSensitive: true
    },
    'stargazing': {
      label: '星空観察',
      icon: '⭐',
      description: '八重山の美しい星空',
      optimalTide: 'any',
      duration: 90,
      popularSpots: ['天文台', '平久保崎', 'バンナ公園'],
      season: 'all',
      difficulty: 'all',
      weatherSensitive: true
    },
    'cultural': {
      label: '文化体験',
      icon: '🏛️',
      description: '石垣島の歴史・文化',
      optimalTide: 'any',
      duration: 150,
      popularSpots: ['八重山博物館', '具志堅用高記念館', '唐人墓'],
      season: 'all',
      difficulty: 'all',
      weatherSensitive: false
    },
    'island_tour': {
      label: '島内観光',
      icon: '🗺️',
      description: '石垣島一周観光',
      optimalTide: 'any',
      duration: 480,
      popularSpots: ['川平湾', '平久保崎', '玉取崎展望台'],
      season: 'all',
      difficulty: 'all',
      weatherSensitive: false
    }
  };

  // 推奨開始時間の計算
  const calculateOptimalStartTime = () => {
    if (!tourData.activityType || !environmentalData) return '09:00';

    const activity = ishigakiActivityTypes[tourData.activityType];
    if (!activity) return '09:00';

    let optimalHour = 9; // デフォルト

    // 活動タイプ別の最適時間
    switch (tourData.activityType) {
      case 'snorkeling':
      case 'diving':
        // 海況と潮位を考慮
        if (environmentalData.tide?.current_level > 170) {
          optimalHour = 10; // 高潮時
        } else {
          optimalHour = 8; // 低潮時は早め
        }
        break;
      case 'sunset':
        optimalHour = 17; // 夕方
        break;
      case 'stargazing':
        optimalHour = 19; // 夜
        break;
      case 'glass_boat':
        optimalHour = 10; // 午前中が人気
        break;
      default:
        optimalHour = 9;
    }

    // 天候を考慮
    if (environmentalData.weather?.condition === 'rainy') {
      if (activity.weatherSensitive) {
        optimalHour = Math.max(10, optimalHour); // 雨天時は遅らせる
      }
    }

    // 観光シーズンを考慮
    const currentMonth = new Date().getMonth() + 1;
    if ([7, 8, 12, 1].includes(currentMonth)) {
      optimalHour = Math.max(optimalHour - 1, 8); // 繁忙期は早め
    }

    return `${optimalHour.toString().padStart(2, '0')}:00`;
  };

  // バリデーション
  const validateTourData = (data) => {
    const errors = {};
    
    if (!data.date) {
      errors.date = 'ツアー日を選択してください';
    } else {
      const selectedDate = new Date(data.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        errors.date = '過去の日付は選択できません';
      }
    }
    
    if (!data.activityType) {
      errors.activityType = 'アクティビティを選択してください';
    }
    
    if (!data.startTime) {
      errors.startTime = '開始時間を設定してください';
    }
    
    return errors;
  };

  // データ更新ハンドラー
  const handleUpdate = (field, value) => {
    const newData = { ...tourData, [field]: value };
    
    // バリデーション
    const errors = validateTourData(newData);
    setValidationErrors(errors);
    
    onTourDataUpdate(newData);
  };

  // アクティビティタイプ変更時の処理
  const handleActivityTypeChange = (activityType) => {
    const activity = ishigakiActivityTypes[activityType];
    if (!activity) return;

    let newData = { ...tourData, activityType };
    
    // 自動最適化モードの場合
    if (autoOptimize) {
      const optimalStartTime = calculateOptimalStartTime();
      newData.startTime = optimalStartTime;
      onActivityStartTimeUpdate(optimalStartTime);
    }

    // アクティビティ期間を設定
    newData.duration = activity.duration;
    
    handleUpdate('activityType', activityType);
    
    // 推奨事項を更新
    updateRecommendations(newData, activity);
  };

  // 推奨事項の更新
  const updateRecommendations = (data, activity) => {
    const newRecommendations = [];
    
    // 天候に基づく推奨
    if (environmentalData?.weather?.condition === 'rainy' && activity.weatherSensitive) {
      newRecommendations.push({
        type: 'warning',
        message: '雨天のため、屋内活動または延期をお勧めします',
        icon: '☔'
      });
    }
    
    // 潮位に基づく推奨
    if (activity.optimalTide === 'high' && environmentalData?.tide?.current_level < 150) {
      newRecommendations.push({
        type: 'info',
        message: '干潮時のため、シュノーケリング体験が制限される可能性があります',
        icon: '🌊'
      });
    }
    
    // 風況に基づく推奨
    if (environmentalData?.weather?.wind_speed > 6 && activity.weatherSensitive) {
      newRecommendations.push({
        type: 'warning',
        message: '風が強いため、海上アクティビティは注意が必要です',
        icon: '💨'
      });
    }
    
    // 参加者数に基づく推奨
    const totalGuests = guests.reduce((sum, guest) => sum + guest.people, 0);
    const totalCapacity = vehicles.reduce((sum, vehicle) => sum + vehicle.capacity, 0);
    
    if (totalGuests > totalCapacity) {
      newRecommendations.push({
        type: 'error',
        message: `参加者数(${totalGuests}名)が車両定員(${totalCapacity}名)を超えています`,
        icon: '🚗'
      });
    }
    
    // 季節に基づく推奨
    const currentMonth = new Date().getMonth() + 1;
    if ([6, 7, 8, 9].includes(currentMonth)) {
      newRecommendations.push({
        type: 'info',
        message: '台風シーズンです。気象情報をこまめにチェックしてください',
        icon: '🌀'
      });
    }
    
    if ([11, 12, 1, 2].includes(currentMonth)) {
      newRecommendations.push({
        type: 'info',
        message: 'ザトウクジラの回遊シーズンです。ホエールウォッチングも検討してください',
        icon: '🐋'
      });
    }
    
    setRecommendations(newRecommendations);
  };

  // 自動最適化
  const handleAutoOptimize = () => {
    if (!tourData.activityType) return;
    
    const optimalTime = calculateOptimalStartTime();
    handleUpdate('startTime', optimalTime);
    onActivityStartTimeUpdate(optimalTime);
  };

  // 天候アイコンの取得
  const getWeatherIcon = (condition) => {
    switch (condition) {
      case 'sunny': return <SunnyIcon sx={{ color: '#FFA726' }} />;
      case 'cloudy': return <CloudIcon sx={{ color: '#78909C' }} />;
      case 'rainy': return <UmbrellaIcon sx={{ color: '#42A5F5' }} />;
      default: return <SunnyIcon sx={{ color: '#FFA726' }} />;
    }
  };

  // 潮位レベルの取得
  const getTideLevel = (level) => {
    if (level > 180) return { text: '大潮', color: 'error' };
    if (level > 150) return { text: '高潮', color: 'warning' };
    if (level > 120) return { text: '中潮', color: 'info' };
    return { text: '干潮', color: 'success' };
  };

  // 効果
  useEffect(() => {
    if (autoOptimize && tourData.activityType) {
      handleAutoOptimize();
    }
  }, [environmentalData, autoOptimize]);

  useEffect(() => {
    if (tourData.activityType) {
      const activity = ishigakiActivityTypes[tourData.activityType];
      updateRecommendations(tourData, activity);
    }
  }, [tourData, environmentalData, guests, vehicles]);

  const selectedActivity = ishigakiActivityTypes[tourData.activityType];

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <ScheduleIcon sx={{ mr: 1 }} />
        ツアー設定
      </Typography>

      {/* ステータス概要 */}
      <Card sx={{ mb: 3, bgcolor: 'primary.50', borderLeft: '4px solid', borderColor: 'primary.main' }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <ScheduleIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">ツアー日</Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {tourData.date || '未設定'}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <PlaceIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">アクティビティ</Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {selectedActivity?.label || '未選択'}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <GroupIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">参加者</Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {guests.reduce((sum, guest) => sum + guest.people, 0)}名
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CarIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">車両</Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {vehicles.length}台
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* メイン設定 */}
        <Grid item xs={12} md={8}>
          <Stack spacing={3}>
            {/* 基本設定 */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  基本設定
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="ツアー日"
                      type="date"
                      value={tourData.date || ''}
                      onChange={(e) => handleUpdate('date', e.target.value)}
                      error={!!validationErrors.date}
                      helperText={validationErrors.date}
                      InputLabelProps={{ shrink: true }}
                      inputProps={{
                        min: new Date().toISOString().split('T')[0]
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth error={!!validationErrors.activityType}>
                      <InputLabel>アクティビティタイプ</InputLabel>
                      <Select
                        value={tourData.activityType || ''}
                        onChange={(e) => handleActivityTypeChange(e.target.value)}
                        label="アクティビティタイプ"
                      >
                        {Object.entries(ishigakiActivityTypes).map(([key, activity]) => (
                          <MenuItem key={key} value={key}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <span style={{ fontSize: '1.2em' }}>{activity.icon}</span>
                              <Box>
                                <Typography variant="body2">{activity.label}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {Math.floor(activity.duration / 60)}時間
                                  {activity.duration % 60 !== 0 && `${activity.duration % 60}分`}
                                </Typography>
                              </Box>
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="開始時間"
                      type="time"
                      value={tourData.startTime || ''}
                      onChange={(e) => handleUpdate('startTime', e.target.value)}
                      error={!!validationErrors.startTime}
                      helperText={validationErrors.startTime}
                      InputLabelProps={{ shrink: true }}
                      disabled={autoOptimize && !manualMode}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Box sx={{ pt: 1 }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={autoOptimize}
                            onChange={(e) => setAutoOptimize(e.target.checked)}
                          />
                        }
                        label="自動最適化"
                      />
                      {autoOptimize && (
                        <Typography variant="caption" display="block" color="text.secondary">
                          環境条件から最適な時間を自動計算
                        </Typography>
                      )}
                    </Box>
                  </Grid>
                </Grid>

                {/* 自動最適化ボタン */}
                {!autoOptimize && (
                  <Box sx={{ mt: 2 }}>
                    <Button
                      variant="outlined"
                      startIcon={<AutoIcon />}
                      onClick={handleAutoOptimize}
                      disabled={!tourData.activityType}
                    >
                      最適時間を提案
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* アクティビティ詳細 */}
            {selectedActivity && (
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ fontSize: '1.5em', marginRight: 8 }}>{selectedActivity.icon}</span>
                    {selectedActivity.label}
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        概要
                      </Typography>
                      <Typography variant="body1">
                        {selectedActivity.description}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        人気スポット
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selectedActivity.popularSpots.map((spot, index) => (
                          <Chip
                            key={index}
                            label={spot}
                            size="small"
                            variant="outlined"
                            color="primary"
                          />
                        ))}
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Grid container spacing={2}>
                        <Grid item xs={6} sm={3}>
                          <Typography variant="body2" color="text.secondary">所要時間</Typography>
                          <Typography variant="body1">
                            {Math.floor(selectedActivity.duration / 60)}時間
                            {selectedActivity.duration % 60 !== 0 && `${selectedActivity.duration % 60}分`}
                          </Typography>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Typography variant="body2" color="text.secondary">難易度</Typography>
                          <Chip
                            label={selectedActivity.difficulty === 'beginner' ? '初心者向け' :
                                   selectedActivity.difficulty === 'intermediate' ? '中級者向け' : 'すべて'}
                            size="small"
                            color={selectedActivity.difficulty === 'beginner' ? 'success' : 'info'}
                          />
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Typography variant="body2" color="text.secondary">推奨潮位</Typography>
                          <Typography variant="body1">
                            {selectedActivity.optimalTide === 'high' ? '高潮' :
                             selectedActivity.optimalTide === 'mid' ? '中潮' :
                             selectedActivity.optimalTide === 'calm' ? '穏やか' : '任意'}
                          </Typography>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Typography variant="body2" color="text.secondary">天候依存</Typography>
                          <Chip
                            label={selectedActivity.weatherSensitive ? 'あり' : 'なし'}
                            size="small"
                            color={selectedActivity.weatherSensitive ? 'warning' : 'success'}
                          />
                        </Grid>
                      </Grid>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            )}

            {/* 高度な設定 */}
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    高度な設定
                  </Typography>
                  <IconButton onClick={() => setShowAdvanced(!showAdvanced)}>
                    {showAdvanced ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </IconButton>
                </Box>
                
                <Collapse in={showAdvanced}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={tourData.weatherPriority !== false}
                            onChange={(e) => handleUpdate('weatherPriority', e.target.checked)}
                          />
                        }
                        label="天候優先"
                      />
                      <Typography variant="caption" display="block" color="text.secondary">
                        天候条件を最適化に含める
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={tourData.tidePriority !== false}
                            onChange={(e) => handleUpdate('tidePriority', e.target.checked)}
                          />
                        }
                        label="潮汐優先"
                      />
                      <Typography variant="caption" display="block" color="text.secondary">
                        潮位情報を最適化に含める
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={manualMode}
                            onChange={(e) => setManualMode(e.target.checked)}
                          />
                        }
                        label="手動モード"
                      />
                      <Typography variant="caption" display="block" color="text.secondary">
                        すべての設定を手動で行う
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="バッファ時間（分）"
                        type="number"
                        value={tourData.bufferTime || 15}
                        onChange={(e) => handleUpdate('bufferTime', parseInt(e.target.value) || 15)}
                        inputProps={{ min: 0, max: 60 }}
                        helperText="移動時間の余裕"
                      />
                    </Grid>
                  </Grid>
                </Collapse>
              </CardContent>
            </Card>
          </Stack>
        </Grid>

        {/* サイドパネル */}
        <Grid item xs={12} md={4}>
          <Stack spacing={3}>
            {/* 環境情報 */}
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    環境情報
                  </Typography>
                  <IconButton onClick={() => setWeatherExpanded(!weatherExpanded)}>
                    {weatherExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </IconButton>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  {getWeatherIcon(environmentalData?.weather?.condition)}
                  <Box>
                    <Typography variant="h5">
                      {environmentalData?.weather?.temperature || 26}°C
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {environmentalData?.weather?.condition === 'sunny' ? '晴れ' :
                       environmentalData?.weather?.condition === 'cloudy' ? '曇り' : '雨'}
                    </Typography>
                  </Box>
                </Box>

                <Collapse in={weatherExpanded}>
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <WavesIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={`潮位 ${environmentalData?.tide?.current_level || 150}cm`}
                        secondary={getTideLevel(environmentalData?.tide?.current_level || 150).text}
                      />
                      <Chip
                        label={getTideLevel(environmentalData?.tide?.current_level || 150).text}
                        size="small"
                        color={getTideLevel(environmentalData?.tide?.current_level || 150).color}
                      />
                    </ListItem>
                    
                    <ListItem>
                      <ListItemIcon>
                        <WindIcon color="info" />
                      </ListItemIcon>
                      <ListItemText
                        primary={`風速 ${environmentalData?.weather?.wind_speed || 4}m/s`}
                        secondary="海上アクティビティへの影響"
                      />
                    </ListItem>
                    
                    <ListItem>
                      <ListItemIcon>
                        <VisibilityIcon color="success" />
                      </ListItemIcon>
                      <ListItemText
                        primary={`視界 ${environmentalData?.weather?.visibility || 10}km`}
                        secondary="海況の視認性"
                      />
                    </ListItem>
                  </List>
                </Collapse>
              </CardContent>
            </Card>

            {/* 推奨事項・警告 */}
            {recommendations.length > 0 && (
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    推奨事項・注意
                  </Typography>
                  <Stack spacing={1}>
                    {recommendations.map((rec, index) => (
                      <Alert
                        key={index}
                        severity={rec.type}
                        icon={<span style={{ fontSize: '1.2em' }}>{rec.icon}</span>}
                      >
                        {rec.message}
                      </Alert>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            )}

            {/* 最適化情報 */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  最適化状況
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'between', mb: 1 }}>
                    <Typography variant="body2">設定完了度</Typography>
                    <Typography variant="body2">
                      {Math.round(((tourData.date ? 1 : 0) + 
                                   (tourData.activityType ? 1 : 0) + 
                                   (tourData.startTime ? 1 : 0)) / 3 * 100)}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={((tourData.date ? 1 : 0) + 
                            (tourData.activityType ? 1 : 0) + 
                            (tourData.startTime ? 1 : 0)) / 3 * 100}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
                
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      {tourData.date ? <CheckCircleIcon color="success" /> : <WarningIcon color="warning" />}
                    </ListItemIcon>
                    <ListItemText primary="ツアー日設定" />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemIcon>
                      {tourData.activityType ? <CheckCircleIcon color="success" /> : <WarningIcon color="warning" />}
                    </ListItemIcon>
                    <ListItemText primary="アクティビティ選択" />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemIcon>
                      {tourData.startTime ? <CheckCircleIcon color="success" /> : <WarningIcon color="warning" />}
                    </ListItemIcon>
                    <ListItemText primary="開始時間設定" />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemIcon>
                      {guests.length > 0 ? <CheckCircleIcon color="success" /> : <InfoIcon color="info" />}
                    </ListItemIcon>
                    <ListItemText primary={`ゲスト登録 (${guests.length}件)`} />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemIcon>
                      {vehicles.length > 0 ? <CheckCircleIcon color="success" /> : <InfoIcon color="info" />}
                    </ListItemIcon>
                    <ListItemText primary={`車両登録 (${vehicles.length}台)`} />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TourSetup;