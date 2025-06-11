// TourInfo.js - 統合ツアー情報管理ページ
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Button, TextField,
  Stack, FormControl, InputLabel, Select, MenuItem, Chip, Alert,
  Stepper, Step, StepLabel, StepContent, Divider, Avatar, IconButton,
  Accordion, AccordionSummary, AccordionDetails, List, ListItem, 
  ListItemIcon, ListItemText, ListItemSecondaryAction, Checkbox,
  Dialog, DialogTitle, DialogContent, DialogActions, Tooltip,
  Badge, LinearProgress, Switch, FormControlLabel, Paper
} from '@mui/material';
import {
  Event as EventIcon,
  Schedule as ScheduleIcon,
  LocationOn as LocationIcon,
  Groups as GroupsIcon,
  DirectionsCar as CarIcon,
  Person as PersonIcon,
  Hotel as HotelIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Check as CheckIcon,
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Assessment as AssessmentIcon,
  Map as MapIcon,
  PlayArrow as PlayIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

// 石垣島主要スポット
const ACTIVITY_LOCATIONS = [
  { name: '川平湾', lat: 24.4167, lng: 124.1556, type: 'シュノーケリング' },
  { name: '青の洞窟', lat: 24.3234, lng: 124.0567, type: 'シュノーケリング' },
  { name: '石垣島鍾乳洞', lat: 24.4012, lng: 124.1123, type: '観光' },
  { name: '平久保崎灯台', lat: 24.5167, lng: 124.2833, type: '観光' },
  { name: '玉取崎展望台', lat: 24.4234, lng: 124.2167, type: '観光' },
  { name: '白保海岸', lat: 24.3089, lng: 124.1892, type: 'ダイビング' },
  { name: '米原海岸', lat: 24.4234, lng: 124.0789, type: 'シュノーケリング' }
];

// アクティビティタイプ
const ACTIVITY_TYPES = [
  { value: 'シュノーケリング', label: 'シュノーケリング', icon: '🤿', color: '#2196f3' },
  { value: 'ダイビング', label: 'ダイビング', icon: '🤿', color: '#1976d2' },
  { value: '観光ドライブ', label: '観光ドライブ', icon: '🚗', color: '#ff9800' },
  { value: '川平湾クルーズ', label: '川平湾クルーズ', icon: '⛵', color: '#4caf50' }
];

// 石垣島主要ホテル
const ISHIGAKI_HOTELS = [
  { name: 'ANAインターコンチネンタル石垣リゾート', area: '真栄里', lat: 24.3362, lng: 124.1641 },
  { name: 'フサキビーチリゾート', area: 'フサキ', lat: 24.3264, lng: 124.1275 },
  { name: 'グランヴィリオリゾート石垣島', area: '新川', lat: 24.3289, lng: 124.1456 },
  { name: 'アートホテル石垣島', area: '大川', lat: 24.3412, lng: 124.1589 },
  { name: 'ホテルミヤヒラ', area: '美崎町', lat: 24.3398, lng: 124.1534 },
  { name: 'ベッセルホテル石垣島', area: '美崎町', lat: 24.3387, lng: 124.1523 },
  { name: '川平湾周辺民宿', area: '川平', lat: 24.4567, lng: 124.0123 },
  { name: '白保集落民宿', area: '白保', lat: 24.3089, lng: 124.1892 },
  { name: '石垣港周辺ビジネスホテル', area: '市街地', lat: 24.3336, lng: 124.1543 }
];

const TourInfo = ({
  guests = [],
  vehicles = [],
  tourData = {},
  onGuestsUpdate,
  onVehiclesUpdate,
  onTourDataUpdate,
  onOptimizationReady,
  environmentalData
}) => {
  // ========== State Management ==========
  const [activeStep, setActiveStep] = useState(0);
  const [localTourData, setLocalTourData] = useState({
    date: new Date().toISOString().split('T')[0],
    activityType: 'シュノーケリング',
    startTime: '10:00',
    activityLocation: null,
    departureLocation: null,
    ...tourData
  });
  
  const [selectedGuests, setSelectedGuests] = useState([]);
  const [selectedVehicles, setSelectedVehicles] = useState([]);
  const [tourValidation, setTourValidation] = useState({
    basic: false,
    location: false,
    guests: false,
    vehicles: false,
    ready: false
  });
  
  const [showGuestDialog, setShowGuestDialog] = useState(false);
  const [showVehicleDialog, setShowVehicleDialog] = useState(false);
  const [currentGuest, setCurrentGuest] = useState({
    name: '',
    hotel_name: '',
    num_people: 1,
    preferred_pickup_start: '08:30',
    preferred_pickup_end: '09:00',
    phone: '',
    email: ''
  });
  const [currentVehicle, setCurrentVehicle] = useState({
    name: '',
    capacity: 8,
    driver: '',
    location: { lat: 24.3336, lng: 124.1543 }
  });

  // ========== Effects ==========
  useEffect(() => {
    setLocalTourData(prev => ({ ...prev, ...tourData }));
  }, [tourData]);

  useEffect(() => {
    validateTourSetup();
  }, [localTourData, selectedGuests, selectedVehicles]);

  // ========== Validation ==========
  const validateTourSetup = useCallback(() => {
    const validation = {
      basic: !!(localTourData.date && localTourData.activityType && localTourData.startTime),
      location: !!(localTourData.activityLocation),
      guests: selectedGuests.length > 0,
      vehicles: selectedVehicles.length > 0,
      ready: false
    };

    validation.ready = validation.basic && validation.location && validation.guests && validation.vehicles;
    setTourValidation(validation);

    // 最適化準備完了通知
    if (validation.ready && onOptimizationReady) {
      onOptimizationReady({
        tourData: localTourData,
        guests: selectedGuests,
        vehicles: selectedVehicles
      });
    }
  }, [localTourData, selectedGuests, selectedVehicles, onOptimizationReady]);

  // ========== Event Handlers ==========
  const handleTourDataChange = (field, value) => {
    const newTourData = { ...localTourData, [field]: value };
    setLocalTourData(newTourData);
    
    if (onTourDataUpdate) {
      onTourDataUpdate(newTourData);
    }
  };

  const handleActivityLocationSelect = (location) => {
    handleTourDataChange('activityLocation', location);
  };

  // 🔧 完全修正: ゲスト選択（マスタデータに影響しない）
  const handleGuestSelection = (guestId, selected) => {
    const guest = guests.find(g => g.id === guestId);
    if (!guest) {
      console.error('🚨 ゲストが見つかりません:', guestId);
      return;
    }

    if (selected) {
      // 追加：重複チェックしてから追加（マスタデータは変更しない）
      if (!selectedGuests.some(g => g.id === guestId)) {
        setSelectedGuests(prev => {
          console.log('✅ ゲスト選択追加:', guest.name, 'ID:', guestId);
          return [...prev, guest];
        });
      }
    } else {
      // 削除：該当IDのみ削除（マスタデータは変更しない）
      setSelectedGuests(prev => {
        const filtered = prev.filter(g => g.id !== guestId);
        console.log('❌ ゲスト選択解除:', guest.name, 'ID:', guestId);
        console.log('🔍 残りの選択ゲスト:', filtered.map(g => g.name));
        return filtered;
      });
    }
  };

  // 🔧 完全修正: 車両選択（マスタデータに影響しない）
  const handleVehicleSelection = (vehicleId, selected) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (!vehicle) {
      console.error('🚨 車両が見つかりません:', vehicleId);
      return;
    }

    if (selected) {
      // 追加：重複チェックしてから追加（マスタデータは変更しない）
      if (!selectedVehicles.some(v => v.id === vehicleId)) {
        setSelectedVehicles(prev => {
          console.log('✅ 車両選択追加:', vehicle.name, 'ID:', vehicleId);
          return [...prev, vehicle];
        });
      }
    } else {
      // 削除：該当IDのみ削除（マスタデータは変更しない）
      setSelectedVehicles(prev => {
        const filtered = prev.filter(v => v.id !== vehicleId);
        console.log('❌ 車両選択解除:', vehicle.name, 'ID:', vehicleId);
        console.log('🔍 残りの選択車両:', filtered.map(v => v.name));
        return filtered;
      });
    }
  };

  const handleAddGuest = () => {
    const newGuest = {
      ...currentGuest,
      id: Date.now().toString(),
      pickup_lat: 24.3336,
      pickup_lng: 124.1543
    };

    // 🔧 修正: マスタデータを破壊せず、ローカルコピーのみ更新
    const updatedGuests = [...guests, newGuest];
    
    // 🔧 修正: 新規追加したゲストを自動選択
    setSelectedGuests(prev => [...prev, newGuest]);
    
    // 🔧 修正: マスタデータも更新（正しい方法）
    if (onGuestsUpdate) {
      onGuestsUpdate(updatedGuests);
    }
    
    setShowGuestDialog(false);
    setCurrentGuest({
      name: '',
      hotel_name: '',
      num_people: 1,
      preferred_pickup_start: '08:30',
      preferred_pickup_end: '09:00',
      phone: '',
      email: ''
    });
  };

  const handleAddVehicle = () => {
    const newVehicle = {
      ...currentVehicle,
      id: Date.now().toString()
    };

    // 🔧 修正: マスタデータを破壊せず、ローカルコピーのみ更新
    const updatedVehicles = [...vehicles, newVehicle];
    
    // 🔧 修正: 新規追加した車両を自動選択
    setSelectedVehicles(prev => [...prev, newVehicle]);
    
    // 🔧 修正: マスタデータも更新（正しい方法）
    if (onVehiclesUpdate) {
      onVehiclesUpdate(updatedVehicles);
    }
    
    setShowVehicleDialog(false);
    setCurrentVehicle({
      name: '',
      capacity: 8,
      driver: '',
      location: { lat: 24.3336, lng: 124.1543 }
    });
  };

  // ========== Utility Functions ==========
  const getTotalPeople = () => {
    return selectedGuests.reduce((sum, guest) => {
      // num_people, people両方をサポート（互換性）
      const people = guest.num_people || guest.people || 1;
      return sum + people;
    }, 0);
  };

  const getTotalCapacity = () => {
    return selectedVehicles.reduce((sum, vehicle) => sum + (vehicle.capacity || 0), 0);
  };

  const getUtilizationRate = () => {
    const total = getTotalPeople();
    const capacity = getTotalCapacity();
    return capacity > 0 ? (total / capacity * 100).toFixed(1) : 0;
  };

  // ========== Render Functions ==========
  const renderTourBasicInfo = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <EventIcon sx={{ mr: 1, color: 'primary.main' }} />
          ツアー基本情報
          {tourValidation.basic && (
            <CheckIcon sx={{ ml: 1, color: 'success.main' }} />
          )}
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="ツアー日付"
              type="date"
              value={localTourData.date}
              onChange={(e) => handleTourDataChange('date', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>アクティビティ</InputLabel>
              <Select
                value={localTourData.activityType}
                onChange={(e) => handleTourDataChange('activityType', e.target.value)}
                label="アクティビティ"
              >
                {ACTIVITY_TYPES.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography sx={{ mr: 1 }}>{type.icon}</Typography>
                      {type.label}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="集合時刻"
              type="time"
              value={localTourData.startTime}
              onChange={(e) => handleTourDataChange('startTime', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          
          <Grid item xs={12} md={2}>
            <Box sx={{ textAlign: 'center', pt: 1 }}>
              <Typography variant="h6" color="primary">
                {new Date(localTourData.date).toLocaleDateString('ja-JP', { 
                  month: 'short', 
                  day: 'numeric',
                  weekday: 'short'
                })}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {localTourData.startTime}開始
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {environmentalData && (
          <Alert severity="info" sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="body2">
                🌤️ 当日の天気: 晴れ 29°C | 風速: 微風 | 波高: 1m
              </Typography>
            </Box>
          </Alert>
        )}
      </CardContent>
    </Card>
  );

  const renderLocationSelection = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <LocationIcon sx={{ mr: 1, color: 'primary.main' }} />
          目的地選択
          {tourValidation.location && (
            <CheckIcon sx={{ ml: 1, color: 'success.main' }} />
          )}
        </Typography>

        <Grid container spacing={2}>
          {ACTIVITY_LOCATIONS
            .filter(loc => loc.type === localTourData.activityType || loc.type === '観光')
            .map((location, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card 
                sx={{ 
                  cursor: 'pointer',
                  border: localTourData.activityLocation?.name === location.name ? 2 : 1,
                  borderColor: localTourData.activityLocation?.name === location.name ? 'primary.main' : 'divider',
                  '&:hover': { boxShadow: 3 }
                }}
                onClick={() => handleActivityLocationSelect(location)}
              >
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="h6" color="primary">
                    {location.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {location.type}向け
                  </Typography>
                  {localTourData.activityLocation?.name === location.name && (
                    <CheckIcon sx={{ color: 'primary.main', mt: 1 }} />
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {localTourData.activityLocation && (
          <Alert severity="success" sx={{ mt: 2 }}>
            目的地: {localTourData.activityLocation.name} が選択されました
          </Alert>
        )}
      </CardContent>
    </Card>
  );

  const renderGuestSelection = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
            <GroupsIcon sx={{ mr: 1, color: 'primary.main' }} />
            参加ゲスト選択
            {tourValidation.guests && (
              <CheckIcon sx={{ ml: 1, color: 'success.main' }} />
            )}
          </Typography>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setShowGuestDialog(true)}
          >
            新規ゲスト追加
          </Button>
        </Box>

        {guests.length === 0 ? (
          <Alert severity="info">
            ゲストデータがありません。新規追加または「ゲスト管理」ページでマスタデータを登録してください。
          </Alert>
        ) : (
          <List>
            {guests.map((guest) => {
              const isSelected = selectedGuests.some(g => g.id === guest.id);
              return (
                <ListItem key={guest.id} divider>
                  <ListItemIcon>
                    <Checkbox
                      checked={isSelected}
                      onChange={(e) => handleGuestSelection(guest.id, e.target.checked)}
                    />
                  </ListItemIcon>
                  <ListItemIcon>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      <PersonIcon />
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary={guest.name}
                    secondary={
                      <Box>
                        <Typography variant="body2">
                          🏨 {guest.hotel_name || guest.hotel} | 👥 {guest.num_people || guest.people || 1}名
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          希望時間: {guest.preferred_pickup_start} - {guest.preferred_pickup_end}
                        </Typography>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Chip 
                      label={`${guest.num_people || guest.people || 1}名`} 
                      size="small" 
                      color={isSelected ? "primary" : "default"}
                      variant={isSelected ? "filled" : "outlined"}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              );
            })}
          </List>
        )}

        {selectedGuests.length > 0 && (
          <Alert severity="success" sx={{ mt: 2 }}>
            選択済み: {selectedGuests.length}組 ({getTotalPeople()}名)
          </Alert>
        )}
      </CardContent>
    </Card>
  );

  const renderVehicleSelection = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
            <CarIcon sx={{ mr: 1, color: 'primary.main' }} />
            使用車両選択
            {tourValidation.vehicles && (
              <CheckIcon sx={{ ml: 1, color: 'success.main' }} />
            )}
          </Typography>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setShowVehicleDialog(true)}
          >
            新規車両追加
          </Button>
        </Box>

        {vehicles.length === 0 ? (
          <Alert severity="info">
            車両データがありません。新規追加または「車両管理」ページでマスタデータを登録してください。
          </Alert>
        ) : (
          <List>
            {vehicles.map((vehicle) => {
              const isSelected = selectedVehicles.some(v => v.id === vehicle.id);
              return (
                <ListItem key={vehicle.id} divider>
                  <ListItemIcon>
                    <Checkbox
                      checked={isSelected}
                      onChange={(e) => handleVehicleSelection(vehicle.id, e.target.checked)}
                    />
                  </ListItemIcon>
                  <ListItemIcon>
                    <Avatar sx={{ bgcolor: 'secondary.main' }}>
                      <CarIcon />
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary={vehicle.name}
                    secondary={`ドライバー: ${vehicle.driver} | 定員: ${vehicle.capacity}名`}
                  />
                  <ListItemSecondaryAction>
                    <Chip 
                      label={`${vehicle.capacity}名`} 
                      size="small" 
                      color={isSelected ? "secondary" : "default"}
                      variant={isSelected ? "filled" : "outlined"}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              );
            })}
          </List>
        )}

        {selectedVehicles.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Alert severity="success">
              選択済み: {selectedVehicles.length}台 (総定員: {getTotalCapacity()}名)
            </Alert>
            
            <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                車両利用率
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ width: '100%', mr: 1 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={Math.min(100, getUtilizationRate())} 
                    color={getUtilizationRate() > 90 ? 'error' : getUtilizationRate() > 70 ? 'warning' : 'primary'}
                  />
                </Box>
                <Box sx={{ minWidth: 35 }}>
                  <Typography variant="body2" color="text.secondary">
                    {getUtilizationRate()}%
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  const renderTourSummary = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <AssessmentIcon sx={{ mr: 1, color: 'primary.main' }} />
          ツアー概要
          {tourValidation.ready && (
            <CheckIcon sx={{ ml: 1, color: 'success.main' }} />
          )}
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">基本情報</Typography>
                <Typography variant="body1">
                  📅 {localTourData.date} ({new Date(localTourData.date).toLocaleDateString('ja-JP', { weekday: 'long' })})
                </Typography>
                <Typography variant="body1">
                  🎯 {localTourData.activityType} @ {localTourData.activityLocation?.name || '未選択'}
                </Typography>
                <Typography variant="body1">
                  ⏰ {localTourData.startTime}集合
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary">参加者情報</Typography>
                <Typography variant="body1">
                  👥 {selectedGuests.length}組 {getTotalPeople()}名
                </Typography>
                <Typography variant="body1">
                  🚗 {selectedVehicles.length}台 (定員{getTotalCapacity()}名)
                </Typography>
                <Typography variant="body1">
                  📊 利用率 {getUtilizationRate()}%
                </Typography>
              </Box>
            </Stack>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box sx={{ textAlign: 'center', p: 3, bgcolor: 'primary.light', borderRadius: 2, color: 'white' }}>
              <Typography variant="h4" gutterBottom>
                {tourValidation.ready ? '🎉' : '⚠️'}
              </Typography>
              <Typography variant="h6" gutterBottom>
                {tourValidation.ready ? 'AI最適化準備完了' : 'セットアップ未完了'}
              </Typography>
              <Typography variant="body2">
                {tourValidation.ready 
                  ? 'AI最適化を実行できます' 
                  : '必要な情報を入力してください'
                }
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {!tourValidation.ready && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            未完了項目: 
            {!tourValidation.basic && ' 基本情報'}
            {!tourValidation.location && ' 目的地'}
            {!tourValidation.guests && ' ゲスト選択'}
            {!tourValidation.vehicles && ' 車両選択'}
          </Alert>
        )}
      </CardContent>
    </Card>
  );

  // ========== Main Render ==========
  return (
    <Box sx={{ p: 3 }}>
      {/* ヘッダー */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          🏝️ ツアー情報
        </Typography>
        <Typography variant="body1" color="text.secondary">
          当日実行するツアーの詳細情報を設定し、AI最適化の準備を行います
        </Typography>
      </Box>

      {/* ステップ表示 */}
      <Paper sx={{ mb: 3, p: 2 }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          <Step completed={tourValidation.basic}>
            <StepLabel>基本情報</StepLabel>
          </Step>
          <Step completed={tourValidation.location}>
            <StepLabel>目的地選択</StepLabel>
          </Step>
          <Step completed={tourValidation.guests}>
            <StepLabel>ゲスト選択</StepLabel>
          </Step>
          <Step completed={tourValidation.vehicles}>
            <StepLabel>車両選択</StepLabel>
          </Step>
          <Step completed={tourValidation.ready}>
            <StepLabel>最適化準備</StepLabel>
          </Step>
        </Stepper>
      </Paper>

      {/* メインコンテンツ */}
      {renderTourBasicInfo()}
      {renderLocationSelection()}
      {renderGuestSelection()}
      {renderVehicleSelection()}
      {renderTourSummary()}

      {/* ゲスト追加ダイアログ */}
      <Dialog open={showGuestDialog} onClose={() => setShowGuestDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>新規ゲスト追加</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="ゲスト名"
              value={currentGuest.name}
              onChange={(e) => setCurrentGuest(prev => ({ ...prev, name: e.target.value }))}
            />
            <TextField
              fullWidth
              label="ホテル名"
              value={currentGuest.hotel_name}
              onChange={(e) => setCurrentGuest(prev => ({ ...prev, hotel_name: e.target.value }))}
            />
            <TextField
              fullWidth
              label="人数"
              type="number"
              value={currentGuest.num_people}
              onChange={(e) => setCurrentGuest(prev => ({ ...prev, num_people: parseInt(e.target.value) || 1 }))}
              inputProps={{ min: 1, max: 20 }}
            />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="希望開始時刻"
                  type="time"
                  value={currentGuest.preferred_pickup_start}
                  onChange={(e) => setCurrentGuest(prev => ({ ...prev, preferred_pickup_start: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="希望終了時刻"
                  type="time"
                  value={currentGuest.preferred_pickup_end}
                  onChange={(e) => setCurrentGuest(prev => ({ ...prev, preferred_pickup_end: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowGuestDialog(false)}>キャンセル</Button>
          <Button onClick={handleAddGuest} variant="contained">追加</Button>
        </DialogActions>
      </Dialog>

      {/* 車両追加ダイアログ */}
      <Dialog open={showVehicleDialog} onClose={() => setShowVehicleDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>新規車両追加</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="車両名"
              value={currentVehicle.name}
              onChange={(e) => setCurrentVehicle(prev => ({ ...prev, name: e.target.value }))}
            />
            <TextField
              fullWidth
              label="ドライバー名"
              value={currentVehicle.driver}
              onChange={(e) => setCurrentVehicle(prev => ({ ...prev, driver: e.target.value }))}
            />
            <TextField
              fullWidth
              label="定員"
              type="number"
              value={currentVehicle.capacity}
              onChange={(e) => setCurrentVehicle(prev => ({ ...prev, capacity: parseInt(e.target.value) || 8 }))}
              inputProps={{ min: 1, max: 20 }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowVehicleDialog(false)}>キャンセル</Button>
          <Button onClick={handleAddVehicle} variant="contained">追加</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TourInfo;