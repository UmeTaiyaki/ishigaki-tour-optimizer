// RouteOptimizer.js - 地点選択機能付き修正版
import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Button, Alert,
  FormControl, InputLabel, Select, MenuItem, Switch, FormControlLabel,
  Divider, Stack, Chip, LinearProgress, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Autocomplete
} from '@mui/material';
import {
  Route as RouteIcon,
  DirectionsCar as CarIcon,
  Person as PersonIcon,
  LocationOn as LocationIcon,
  PlayArrow as PlayIcon,
  Clear as ClearIcon,
  Settings as SettingsIcon,
  Speed as SpeedIcon,
  Schedule as ScheduleIcon,
  Assessment as AssessmentIcon,
  Map as MapIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

const RouteOptimizer = ({
  guests = [],
  vehicles = [],
  tourData = {},
  environmentalData = null,
  onOptimize,
  onClearRoutes,
  optimizedRoutes = [],
  isLoading = false,
  onTourDataUpdate
}) => {
  const [optimizationSettings, setOptimizationSettings] = useState({
    weatherPriority: true,
    tidePriority: true,
    timeOptimization: true,
    distanceOptimization: true,
    capacityOptimization: true,
    preferenceRespect: true
  });
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [availableLocations, setAvailableLocations] = useState([]);

  // 登録地点を読み込み
  useEffect(() => {
    const savedLocations = localStorage.getItem('ishigaki_tour_locations');
    if (savedLocations) {
      try {
        const locations = JSON.parse(savedLocations);
        setAvailableLocations(locations);
      } catch (error) {
        console.error('地点データ読み込みエラー:', error);
        setAvailableLocations([]);
      }
    }
  }, []);

  // 最適化実行
  const handleOptimize = () => {
    if (!tourData.activityLocation) {
      alert('目的地を設定してください');
      return;
    }

    if (!tourData.departureLocation) {
      alert('出発地を設定してください');
      return;
    }

    if (guests.length === 0) {
      alert('ゲストを登録してください');
      return;
    }

    if (vehicles.length === 0) {
      alert('車両を登録してください');
      return;
    }

    const optimizationData = {
      ...tourData,
      guests,
      vehicles,
      settings: optimizationSettings,
      environmentalData
    };

    onOptimize(optimizationData);
  };

  // 出発地選択
  const handleDepartureChange = (event, value) => {
    if (value && onTourDataUpdate) {
      const newTourData = {
        ...tourData,
        departureLocation: {
          lat: value.lat,
          lng: value.lng,
          name: value.name
        }
      };
      onTourDataUpdate(newTourData);
    }
  };

  // 目的地選択
  const handleDestinationChange = (event, value) => {
    if (value && onTourDataUpdate) {
      const newTourData = {
        ...tourData,
        activityLocation: {
          lat: value.lat,
          lng: value.lng,
          name: value.name
        }
      };
      onTourDataUpdate(newTourData);
    }
  };

  // 最適化設定変更
  const handleSettingChange = (setting, value) => {
    setOptimizationSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  // データ検証
  const canOptimize = guests.length > 0 && 
                     vehicles.length > 0 && 
                     tourData.activityLocation && 
                     tourData.departureLocation &&
                     !isLoading;

  const totalPeople = guests.reduce((sum, guest) => sum + (guest.people || guest.num_people || 0), 0);
  const totalCapacity = vehicles.reduce((sum, vehicle) => sum + vehicle.capacity, 0);
  const utilizationRate = totalCapacity > 0 ? (totalPeople / totalCapacity * 100).toFixed(1) : 0;

  return (
    <Box sx={{ p: 2 }}>
      {/* ヘッダー */}
      <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <RouteIcon sx={{ mr: 2, fontSize: 32 }} />
            <Box>
              <Typography variant="h4" fontWeight="bold">
                ルート最適化
              </Typography>
              <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                効率的な送迎ルートを自動生成します
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* 地点選択 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            📍 地点設定
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Autocomplete
                fullWidth
                options={availableLocations.filter(loc => loc.type === 'departure' || loc.type === 'office')}
                getOptionLabel={(option) => `${option.name} (${option.type === 'departure' ? '出発地' : '事業所'})`}
                value={availableLocations.find(loc => 
                  loc.lat === tourData.departureLocation?.lat && 
                  loc.lng === tourData.departureLocation?.lng
                ) || null}
                onChange={handleDepartureChange}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="出発地点"
                    placeholder="出発地を選択してください"
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: <CarIcon sx={{ mr: 1, color: 'primary.main' }} />
                    }}
                  />
                )}
                renderOption={(props, option) => (
                  <Box component="li" {...props}>
                    <LocationIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Box>
                      <Typography variant="body2">{option.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.address || `${option.lat.toFixed(4)}, ${option.lng.toFixed(4)}`}
                      </Typography>
                    </Box>
                  </Box>
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Autocomplete
                fullWidth
                options={availableLocations.filter(loc => 
                  loc.type === 'activity' || loc.type === 'sightseeing' || loc.type === 'destination'
                )}
                getOptionLabel={(option) => `${option.name} (${
                  option.type === 'activity' ? 'アクティビティ' : 
                  option.type === 'sightseeing' ? '観光地' : '目的地'
                })`}
                value={availableLocations.find(loc => 
                  loc.lat === tourData.activityLocation?.lat && 
                  loc.lng === tourData.activityLocation?.lng
                ) || null}
                onChange={handleDestinationChange}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="目的地"
                    placeholder="目的地を選択してください"
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: <LocationIcon sx={{ mr: 1, color: 'secondary.main' }} />
                    }}
                  />
                )}
                renderOption={(props, option) => (
                  <Box component="li" {...props}>
                    <LocationIcon sx={{ mr: 1, color: 'secondary.main' }} />
                    <Box>
                      <Typography variant="body2">{option.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.address || `${option.lat.toFixed(4)}, ${option.lng.toFixed(4)}`}
                      </Typography>
                    </Box>
                  </Box>
                )}
              />
            </Grid>
          </Grid>
          
          {/* 現在の設定表示 */}
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Alert severity={tourData.departureLocation ? 'success' : 'warning'}>
                  <Typography variant="subtitle2">🚗 出発地点</Typography>
                  <Typography variant="body2">
                    {tourData.departureLocation?.name || '未設定'}
                  </Typography>
                </Alert>
              </Grid>
              <Grid item xs={12} md={6}>
                <Alert severity={tourData.activityLocation ? 'success' : 'warning'}>
                  <Typography variant="subtitle2">🎯 目的地</Typography>
                  <Typography variant="body2">
                    {tourData.activityLocation?.name || '未設定'}
                  </Typography>
                </Alert>
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>

      {/* 統計情報 */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <PersonIcon color="primary" sx={{ fontSize: 32, mb: 1 }} />
              <Typography variant="h6">{guests.length}組</Typography>
              <Typography variant="caption" color="text.secondary">総ゲスト数</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <CarIcon color="primary" sx={{ fontSize: 32, mb: 1 }} />
              <Typography variant="h6">{vehicles.length}台</Typography>
              <Typography variant="caption" color="text.secondary">利用可能車両</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <PersonIcon color="success" sx={{ fontSize: 32, mb: 1 }} />
              <Typography variant="h6">{totalPeople}名</Typography>
              <Typography variant="caption" color="text.secondary">総参加者数</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <AssessmentIcon color="info" sx={{ fontSize: 32, mb: 1 }} />
              <Typography variant="h6">{utilizationRate}%</Typography>
              <Typography variant="caption" color="text.secondary">車両利用率</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 最適化結果 */}
      {optimizedRoutes.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              📋 最適化結果
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary">
                    {optimizedRoutes.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    生成ルート数
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="success.main">
                    {optimizedRoutes.reduce((sum, route) => sum + (route.total_distance || 0), 0).toFixed(1)}km
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    総移動距離
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="info.main">
                    {Math.max(...optimizedRoutes.map(route => route.total_time || 0), 0)}分
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    最大所要時間
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="warning.main">
                    {(optimizedRoutes.reduce((sum, route) => sum + (route.efficiency_score || 0), 0) / optimizedRoutes.length).toFixed(1)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    平均効率スコア
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* 環境情報 */}
      {environmentalData && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              🌤️ 環境情報
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} md={3}>
                <Chip 
                  label={`${environmentalData.weather || '晴れ'}`} 
                  color="primary" 
                  variant="outlined" 
                />
              </Grid>
              <Grid item xs={6} md={3}>
                <Chip 
                  label={`${environmentalData.temperature || 25}°C`} 
                  color="warning" 
                  variant="outlined" 
                />
              </Grid>
              <Grid item xs={6} md={3}>
                <Chip 
                  label={`風速 ${environmentalData.wind_speed || 10}m/s`} 
                  color="info" 
                  variant="outlined" 
                />
              </Grid>
              <Grid item xs={6} md={3}>
                <Chip 
                  label={`潮位 ${environmentalData.tide_level || 150}cm`} 
                  color="success" 
                  variant="outlined" 
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* 最適化設定 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">⚙️ 最適化設定</Typography>
            <Button
              variant="outlined"
              startIcon={<SettingsIcon />}
              onClick={() => setSettingsDialogOpen(true)}
              size="small"
            >
              詳細設定
            </Button>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={6} md={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={optimizationSettings.weatherPriority}
                    onChange={(e) => handleSettingChange('weatherPriority', e.target.checked)}
                  />
                }
                label="気象条件考慮"
              />
            </Grid>
            <Grid item xs={6} md={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={optimizationSettings.tidePriority}
                    onChange={(e) => handleSettingChange('tidePriority', e.target.checked)}
                  />
                }
                label="潮汐情報考慮"
              />
            </Grid>
            <Grid item xs={6} md={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={optimizationSettings.timeOptimization}
                    onChange={(e) => handleSettingChange('timeOptimization', e.target.checked)}
                  />
                }
                label="時間最適化"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* アクションボタン */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
        <Button
          variant="contained"
          size="large"
          startIcon={isLoading ? <LinearProgress sx={{ width: 20, height: 20 }} /> : <PlayIcon />}
          onClick={handleOptimize}
          disabled={!canOptimize}
          sx={{ px: 4, py: 1.5 }}
        >
          {isLoading ? '最適化中...' : 'ルート最適化実行'}
        </Button>
        
        {optimizedRoutes.length > 0 && (
          <Button
            variant="outlined"
            size="large"
            startIcon={<ClearIcon />}
            onClick={onClearRoutes}
            sx={{ px: 4, py: 1.5 }}
          >
            結果をクリア
          </Button>
        )}
      </Box>

      {/* 警告・推奨事項 */}
      {!canOptimize && (
        <Box sx={{ mt: 3 }}>
          <Alert severity="warning">
            <Typography variant="subtitle2">最適化を実行するには以下が必要です：</Typography>
            <Box component="ul" sx={{ mt: 1, mb: 0 }}>
              {guests.length === 0 && <li>ゲストの登録</li>}
              {vehicles.length === 0 && <li>車両の登録</li>}
              {!tourData.departureLocation && <li>出発地点の設定</li>}
              {!tourData.activityLocation && <li>目的地の設定</li>}
            </Box>
          </Alert>
        </Box>
      )}

      {totalCapacity < totalPeople && (
        <Box sx={{ mt: 2 }}>
          <Alert severity="error">
            車両の総定員（{totalCapacity}名）が参加者数（{totalPeople}名）を下回っています。
            車両を追加するか、ゲスト数を調整してください。
          </Alert>
        </Box>
      )}

      {utilizationRate > 90 && totalCapacity >= totalPeople && (
        <Box sx={{ mt: 2 }}>
          <Alert severity="info">
            車両利用率が高いです（{utilizationRate}%）。余裕のあるスケジュールをお勧めします。
          </Alert>
        </Box>
      )}

      {/* 詳細設定ダイアログ */}
      <Dialog
        open={settingsDialogOpen}
        onClose={() => setSettingsDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>詳細最適化設定</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={optimizationSettings.distanceOptimization}
                    onChange={(e) => handleSettingChange('distanceOptimization', e.target.checked)}
                  />
                }
                label="距離最適化 - 総移動距離を最小化"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={optimizationSettings.capacityOptimization}
                    onChange={(e) => handleSettingChange('capacityOptimization', e.target.checked)}
                  />
                }
                label="定員最適化 - 車両の定員を効率的に活用"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={optimizationSettings.preferenceRespect}
                    onChange={(e) => handleSettingChange('preferenceRespect', e.target.checked)}
                  />
                }
                label="希望時間尊重 - ゲストの希望時間を優先"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsDialogOpen(false)}>
            閉じる
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RouteOptimizer;