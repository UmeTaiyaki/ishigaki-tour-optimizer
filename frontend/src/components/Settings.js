import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Grid,
  Divider,
  Switch,
  FormControlLabel,
  Chip,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  InputAdornment
} from '@mui/material';
import {
  Save as SaveIcon,
  RestartAlt as ResetIcon,
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  LocationOn as LocationIcon,
  DirectionsCar as CarIcon,
  AccessTime as TimeIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';

const Settings = ({ settings, onUpdate }) => {
  const [localSettings, setLocalSettings] = useState({
    // 基本設定
    companyName: '石垣島ツアー会社',
    defaultTourTime: '09:00',
    defaultActivityDuration: 180, // 分
    
    // 車両管理のデフォルト設定
    vehicleDefaults: {
      defaultCapacity: 8,
      defaultVehicleType: 'mini_van',
      defaultSpeedFactor: 1.0,
      bufferTimeMinutes: 10,
      averageSpeedKmh: 35,
    },
    
    // 出発地点・目的地点の設定
    locations: {
      defaultDeparture: {
        name: '石垣港離島ターミナル',
        lat: 24.3448,
        lng: 124.1551
      },
      commonDestinations: [
        {
          id: 'kawahira',
          name: '川平湾',
          lat: 24.4525,
          lng: 124.1447,
          estimatedDuration: 120
        },
        {
          id: 'kabira',
          name: 'かびらビーチ',
          lat: 24.4505,
          lng: 124.1422,
          estimatedDuration: 90
        },
        {
          id: 'taketomi',
          name: '竹富島行き桟橋',
          lat: 24.3341,
          lng: 124.1551,
          estimatedDuration: 240
        }
      ]
    },
    
    // ルート最適化設定
    optimization: {
      priorityMode: 'balanced', // balanced, time, distance, capacity
      allowOverCapacity: false,
      maxPickupDelay: 30, // 分
      groupNearbyGuests: true,
      nearbyRadiusKm: 2,
      considerTraffic: true,
      considerWeather: true,
      preferredRouteType: 'scenic' // fastest, shortest, scenic
    },
    
    // 環境設定
    environmental: {
      enableTideInfo: true,
      enableWeatherAlert: true,
      lowTideThreshold: 0.5,
      highWindSpeedThreshold: 15,
      rainProbabilityThreshold: 70
    },
    
    // 通知設定
    notifications: {
      enableEmailNotifications: false,
      enableSMSNotifications: false,
      notifyDriversBeforeDeparture: 60, // 分前
      notifyGuestsBeforePickup: 30 // 分前
    }
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');

  useEffect(() => {
    if (settings) {
      setLocalSettings(prevSettings => ({
        ...prevSettings,
        ...settings
      }));
    }
  }, [settings]);

  useEffect(() => {
    // 設定をローカルストレージから読み込む
    const savedSettings = localStorage.getItem('tourAppSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setLocalSettings(parsed);
      } catch (error) {
        console.error('設定の読み込みエラー:', error);
      }
    }
  }, []);

  const handleChange = (section, field, value) => {
    setLocalSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
    setHasChanges(true);
  };

  const handleSimpleChange = (field, value) => {
    setLocalSettings(prev => ({
      ...prev,
      [field]: value
    }));
    setHasChanges(true);
  };

  const handleLocationChange = (type, field, value) => {
    if (type === 'departure') {
      setLocalSettings(prev => ({
        ...prev,
        locations: {
          ...prev.locations,
          defaultDeparture: {
            ...prev.locations.defaultDeparture,
            [field]: value
          }
        }
      }));
    }
    setHasChanges(true);
  };

  const handleDestinationChange = (index, field, value) => {
    const newDestinations = [...localSettings.locations.commonDestinations];
    newDestinations[index] = {
      ...newDestinations[index],
      [field]: value
    };
    setLocalSettings(prev => ({
      ...prev,
      locations: {
        ...prev.locations,
        commonDestinations: newDestinations
      }
    }));
    setHasChanges(true);
  };

  const addDestination = () => {
    const newDestination = {
      id: `dest_${Date.now()}`,
      name: '',
      lat: 24.3448,
      lng: 124.1551,
      estimatedDuration: 60
    };
    setLocalSettings(prev => ({
      ...prev,
      locations: {
        ...prev.locations,
        commonDestinations: [...prev.locations.commonDestinations, newDestination]
      }
    }));
    setHasChanges(true);
  };

  const removeDestination = (index) => {
    const newDestinations = localSettings.locations.commonDestinations.filter(
      (_, i) => i !== index
    );
    setLocalSettings(prev => ({
      ...prev,
      locations: {
        ...prev.locations,
        commonDestinations: newDestinations
      }
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    // ローカルストレージに保存
    localStorage.setItem('tourAppSettings', JSON.stringify(localSettings));
    
    // 親コンポーネントに通知
    if (onUpdate) {
      onUpdate(localSettings);
    }
    
    setHasChanges(false);
    setSaveStatus('success');
    setTimeout(() => setSaveStatus(''), 3000);
  };

  const handleReset = () => {
    const defaultSettings = {
      companyName: '石垣島ツアー会社',
      defaultTourTime: '09:00',
      defaultActivityDuration: 180,
      vehicleDefaults: {
        defaultCapacity: 8,
        defaultVehicleType: 'mini_van',
        defaultSpeedFactor: 1.0,
        bufferTimeMinutes: 10,
        averageSpeedKmh: 35,
      },
      locations: {
        defaultDeparture: {
          name: '石垣港離島ターミナル',
          lat: 24.3448,
          lng: 124.1551
        },
        commonDestinations: []
      },
      optimization: {
        priorityMode: 'balanced',
        allowOverCapacity: false,
        maxPickupDelay: 30,
        groupNearbyGuests: true,
        nearbyRadiusKm: 2,
        considerTraffic: true,
        considerWeather: true,
        preferredRouteType: 'scenic'
      },
      environmental: {
        enableTideInfo: true,
        enableWeatherAlert: true,
        lowTideThreshold: 0.5,
        highWindSpeedThreshold: 15,
        rainProbabilityThreshold: 70
      },
      notifications: {
        enableEmailNotifications: false,
        enableSMSNotifications: false,
        notifyDriversBeforeDeparture: 60,
        notifyGuestsBeforePickup: 30
      }
    };
    
    setLocalSettings(defaultSettings);
    setHasChanges(true);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SettingsIcon /> アプリケーション設定
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<ResetIcon />}
            onClick={handleReset}
            size="small"
          >
            初期値に戻す
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={!hasChanges}
            size="small"
          >
            設定を保存
          </Button>
        </Box>
      </Box>

      {saveStatus === 'success' && (
        <Alert severity="success" sx={{ mb: 2 }}>
          設定を保存しました
        </Alert>
      )}

      {/* 基本設定 */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">基本設定</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="会社名"
                value={localSettings.companyName}
                onChange={(e) => handleSimpleChange('companyName', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="デフォルト開始時刻"
                type="time"
                value={localSettings.defaultTourTime}
                onChange={(e) => handleSimpleChange('defaultTourTime', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="デフォルト活動時間"
                type="number"
                value={localSettings.defaultActivityDuration}
                onChange={(e) => handleSimpleChange('defaultActivityDuration', parseInt(e.target.value))}
                InputProps={{
                  endAdornment: <InputAdornment position="end">分</InputAdornment>
                }}
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* 車両デフォルト設定 */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">車両デフォルト設定</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="デフォルト定員"
                type="number"
                value={localSettings.vehicleDefaults.defaultCapacity}
                onChange={(e) => handleChange('vehicleDefaults', 'defaultCapacity', parseInt(e.target.value))}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>デフォルト車両タイプ</InputLabel>
                <Select
                  value={localSettings.vehicleDefaults.defaultVehicleType}
                  onChange={(e) => handleChange('vehicleDefaults', 'defaultVehicleType', e.target.value)}
                  label="デフォルト車両タイプ"
                >
                  <MenuItem value="sedan">セダン</MenuItem>
                  <MenuItem value="mini_van">ミニバン</MenuItem>
                  <MenuItem value="micro_bus">マイクロバス</MenuItem>
                  <MenuItem value="large_bus">大型バス</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="速度係数"
                type="number"
                value={localSettings.vehicleDefaults.defaultSpeedFactor}
                onChange={(e) => handleChange('vehicleDefaults', 'defaultSpeedFactor', parseFloat(e.target.value))}
                inputProps={{ step: 0.1, min: 0.5, max: 2.0 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="バッファ時間"
                type="number"
                value={localSettings.vehicleDefaults.bufferTimeMinutes}
                onChange={(e) => handleChange('vehicleDefaults', 'bufferTimeMinutes', parseInt(e.target.value))}
                InputProps={{
                  endAdornment: <InputAdornment position="end">分</InputAdornment>
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="平均速度"
                type="number"
                value={localSettings.vehicleDefaults.averageSpeedKmh}
                onChange={(e) => handleChange('vehicleDefaults', 'averageSpeedKmh', parseInt(e.target.value))}
                InputProps={{
                  endAdornment: <InputAdornment position="end">km/h</InputAdornment>
                }}
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* 場所設定 */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">場所設定</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              デフォルト出発地点
            </Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="場所名"
                  value={localSettings.locations.defaultDeparture.name}
                  onChange={(e) => handleLocationChange('departure', 'name', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="緯度"
                  type="number"
                  value={localSettings.locations.defaultDeparture.lat}
                  onChange={(e) => handleLocationChange('departure', 'lat', parseFloat(e.target.value))}
                  inputProps={{ step: 0.0001 }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="経度"
                  type="number"
                  value={localSettings.locations.defaultDeparture.lng}
                  onChange={(e) => handleLocationChange('departure', 'lng', parseFloat(e.target.value))}
                  inputProps={{ step: 0.0001 }}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1">
                よく使う目的地
              </Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={addDestination}
                size="small"
              >
                目的地を追加
              </Button>
            </Box>

            {localSettings.locations.commonDestinations.map((dest, index) => (
              <Paper key={dest.id} sx={{ p: 2, mb: 2 }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      label="場所名"
                      value={dest.name}
                      onChange={(e) => handleDestinationChange(index, 'name', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      label="緯度"
                      type="number"
                      value={dest.lat}
                      onChange={(e) => handleDestinationChange(index, 'lat', parseFloat(e.target.value))}
                      inputProps={{ step: 0.0001 }}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      label="経度"
                      type="number"
                      value={dest.lng}
                      onChange={(e) => handleDestinationChange(index, 'lng', parseFloat(e.target.value))}
                      inputProps={{ step: 0.0001 }}
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <TextField
                      fullWidth
                      label="所要時間"
                      type="number"
                      value={dest.estimatedDuration}
                      onChange={(e) => handleDestinationChange(index, 'estimatedDuration', parseInt(e.target.value))}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">分</InputAdornment>
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={1}>
                    <IconButton
                      color="error"
                      onClick={() => removeDestination(index)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Grid>
                </Grid>
              </Paper>
            ))}
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* ルート最適化設定 */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">ルート最適化設定</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>優先モード</InputLabel>
                <Select
                  value={localSettings.optimization.priorityMode}
                  onChange={(e) => handleChange('optimization', 'priorityMode', e.target.value)}
                  label="優先モード"
                >
                  <MenuItem value="balanced">バランス重視</MenuItem>
                  <MenuItem value="time">時間優先</MenuItem>
                  <MenuItem value="distance">距離優先</MenuItem>
                  <MenuItem value="capacity">定員効率優先</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>ルートタイプ</InputLabel>
                <Select
                  value={localSettings.optimization.preferredRouteType}
                  onChange={(e) => handleChange('optimization', 'preferredRouteType', e.target.value)}
                  label="ルートタイプ"
                >
                  <MenuItem value="fastest">最速ルート</MenuItem>
                  <MenuItem value="shortest">最短ルート</MenuItem>
                  <MenuItem value="scenic">景観重視ルート</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="最大ピックアップ遅延"
                type="number"
                value={localSettings.optimization.maxPickupDelay}
                onChange={(e) => handleChange('optimization', 'maxPickupDelay', parseInt(e.target.value))}
                InputProps={{
                  endAdornment: <InputAdornment position="end">分</InputAdornment>
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="近隣グループ化半径"
                type="number"
                value={localSettings.optimization.nearbyRadiusKm}
                onChange={(e) => handleChange('optimization', 'nearbyRadiusKm', parseFloat(e.target.value))}
                InputProps={{
                  endAdornment: <InputAdornment position="end">km</InputAdornment>
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={localSettings.optimization.allowOverCapacity}
                    onChange={(e) => handleChange('optimization', 'allowOverCapacity', e.target.checked)}
                  />
                }
                label="定員超過を許可"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={localSettings.optimization.groupNearbyGuests}
                    onChange={(e) => handleChange('optimization', 'groupNearbyGuests', e.target.checked)}
                  />
                }
                label="近隣ゲストをグループ化"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={localSettings.optimization.considerTraffic}
                    onChange={(e) => handleChange('optimization', 'considerTraffic', e.target.checked)}
                  />
                }
                label="交通状況を考慮"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={localSettings.optimization.considerWeather}
                    onChange={(e) => handleChange('optimization', 'considerWeather', e.target.checked)}
                  />
                }
                label="天候を考慮"
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* 環境設定 */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">環境設定</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="干潮しきい値"
                type="number"
                value={localSettings.environmental.lowTideThreshold}
                onChange={(e) => handleChange('environmental', 'lowTideThreshold', parseFloat(e.target.value))}
                inputProps={{ step: 0.1, min: 0, max: 5 }}
                InputProps={{
                  endAdornment: <InputAdornment position="end">m</InputAdornment>
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="強風しきい値"
                type="number"
                value={localSettings.environmental.highWindSpeedThreshold}
                onChange={(e) => handleChange('environmental', 'highWindSpeedThreshold', parseInt(e.target.value))}
                InputProps={{
                  endAdornment: <InputAdornment position="end">m/s</InputAdornment>
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="降水確率しきい値"
                type="number"
                value={localSettings.environmental.rainProbabilityThreshold}
                onChange={(e) => handleChange('environmental', 'rainProbabilityThreshold', parseInt(e.target.value))}
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={localSettings.environmental.enableTideInfo}
                    onChange={(e) => handleChange('environmental', 'enableTideInfo', e.target.checked)}
                  />
                }
                label="潮位情報を有効化"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={localSettings.environmental.enableWeatherAlert}
                    onChange={(e) => handleChange('environmental', 'enableWeatherAlert', e.target.checked)}
                  />
                }
                label="天候アラートを有効化"
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* 通知設定 */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">通知設定</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="ドライバー通知時間"
                type="number"
                value={localSettings.notifications.notifyDriversBeforeDeparture}
                onChange={(e) => handleChange('notifications', 'notifyDriversBeforeDeparture', parseInt(e.target.value))}
                InputProps={{
                  endAdornment: <InputAdornment position="end">分前</InputAdornment>
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="ゲスト通知時間"
                type="number"
                value={localSettings.notifications.notifyGuestsBeforePickup}
                onChange={(e) => handleChange('notifications', 'notifyGuestsBeforePickup', parseInt(e.target.value))}
                InputProps={{
                  endAdornment: <InputAdornment position="end">分前</InputAdornment>
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={localSettings.notifications.enableEmailNotifications}
                    onChange={(e) => handleChange('notifications', 'enableEmailNotifications', e.target.checked)}
                  />
                }
                label="メール通知を有効化"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={localSettings.notifications.enableSMSNotifications}
                    onChange={(e) => handleChange('notifications', 'enableSMSNotifications', e.target.checked)}
                  />
                }
                label="SMS通知を有効化"
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

export default Settings;