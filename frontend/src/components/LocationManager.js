// LocationManager.js - 地点登録・管理コンポーネント
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Button, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, Chip, Alert, Divider, Stack, FormControl, InputLabel, 
  Select, MenuItem, Tooltip, Badge, LinearProgress, Autocomplete
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  LocationOn as LocationIcon,
  Map as MapIcon,
  Flight as FlightIcon,
  DirectionsCar as CarIcon,
  Hotel as HotelIcon,
  Camera as CameraIcon,
  LocalActivity as ActivityIcon,
  Business as BusinessIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Save as SaveIcon,
  MyLocation as MyLocationIcon,
  Search as SearchIcon
} from '@mui/icons-material';

// ローカルストレージキー
const STORAGE_KEY = 'ishigaki_tour_locations';

// 地点タイプ定義
const LOCATION_TYPES = [
  { value: 'departure', label: '出発地点', icon: <CarIcon />, color: 'primary' },
  { value: 'destination', label: '目的地', icon: <LocationIcon />, color: 'secondary' },
  { value: 'activity', label: 'アクティビティ地点', icon: <ActivityIcon />, color: 'success' },
  { value: 'hotel', label: 'ホテル・宿泊施設', icon: <HotelIcon />, color: 'info' },
  { value: 'airport', label: '空港・港湾', icon: <FlightIcon />, color: 'warning' },
  { value: 'sightseeing', label: '観光地', icon: <CameraIcon />, color: 'error' },
  { value: 'office', label: '事業所・店舗', icon: <BusinessIcon />, color: 'default' }
];

// プリセット地点（石垣島の主要地点）
const PRESET_LOCATIONS = [
  // 出発地点
  { name: '石垣港離島ターミナル', type: 'departure', lat: 24.3380, lng: 124.1570, address: '沖縄県石垣市美崎町1' },
  { name: '新石垣空港', type: 'airport', lat: 24.3968, lng: 124.2451, address: '沖縄県石垣市白保1960-104-1' },
  { name: '石垣市役所', type: 'departure', lat: 24.3336, lng: 124.1543, address: '沖縄県石垣市美崎町14' },
  
  // アクティビティ地点
  { name: '川平湾', type: 'activity', lat: 24.4167, lng: 124.1556, address: '沖縄県石垣市川平' },
  { name: '米原海岸', type: 'activity', lat: 24.4500, lng: 124.1667, address: '沖縄県石垣市桴海' },
  { name: '白保海岸', type: 'activity', lat: 24.3333, lng: 124.2333, address: '沖縄県石垣市白保' },
  { name: '玉取崎展望台', type: 'sightseeing', lat: 24.4556, lng: 124.2167, address: '沖縄県石垣市伊原間' },
  { name: '平久保崎灯台', type: 'sightseeing', lat: 24.4889, lng: 124.2833, address: '沖縄県石垣市平久保' },
  
  // ホテル
  { name: 'ANAインターコンチネンタル石垣リゾート', type: 'hotel', lat: 24.3362, lng: 124.1641, address: '沖縄県石垣市真栄里354-1' },
  { name: 'フサキビーチリゾート', type: 'hotel', lat: 24.3264, lng: 124.1275, address: '沖縄県石垣市新川1625' },
  { name: 'グランヴィリオリゾート石垣島', type: 'hotel', lat: 24.3289, lng: 124.1456, address: '沖縄県石垣市新川舟蔵2481-1' }
];

const LocationManager = ({ 
  tourData = {}, 
  onTourDataUpdate,
  environmentalData = null
}) => {
  const [locations, setLocations] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(-1);
  const [currentLocation, setCurrentLocation] = useState({
    id: '',
    name: '',
    type: 'activity',
    lat: 24.3336,
    lng: 124.1543,
    address: '',
    description: '',
    contact: '',
    website: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // 初期化時にローカルストレージからデータを読み込み
  useEffect(() => {
    const savedLocations = localStorage.getItem(STORAGE_KEY);
    if (savedLocations) {
      try {
        const parsedLocations = JSON.parse(savedLocations);
        console.log('💾 ローカルストレージから地点データを復元:', parsedLocations);
        setLocations(parsedLocations);
      } catch (error) {
        console.error('ローカルストレージからのデータ読み込みエラー:', error);
        // エラーの場合はプリセットデータを使用
        initializePresetLocations();
      }
    } else {
      // 初回起動時はプリセットデータを設定
      initializePresetLocations();
    }
  }, []);

  // プリセットデータの初期化
  const initializePresetLocations = () => {
    const locationsWithId = PRESET_LOCATIONS.map((location, index) => ({
      ...location,
      id: Date.now() + index,
      created_at: new Date().toISOString()
    }));
    setLocations(locationsWithId);
    saveToLocalStorage(locationsWithId);
  };

  // ローカルストレージに保存
  const saveToLocalStorage = useCallback((locationData) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(locationData));
      console.log('💾 地点データをローカルストレージに保存:', locationData);
    } catch (error) {
      console.error('ローカルストレージへの保存エラー:', error);
    }
  }, []);

  // 地点データを更新
  const updateLocationData = useCallback((newLocations) => {
    console.log('🔄 地点データを更新:', newLocations);
    setLocations(newLocations);
    saveToLocalStorage(newLocations);
  }, [saveToLocalStorage]);

  // バリデーション関数
  const validateLocation = useCallback((location) => {
    const newErrors = {};
    
    if (!location.name || !location.name.trim()) {
      newErrors.name = '地点名は必須です';
    }
    
    if (!location.type) {
      newErrors.type = '地点タイプは必須です';
    }
    
    if (!location.lat || location.lat < 24.0 || location.lat > 25.0) {
      newErrors.lat = '緯度は24.0-25.0の範囲で入力してください（石垣島周辺）';
    }
    
    if (!location.lng || location.lng < 123.5 || location.lng > 124.5) {
      newErrors.lng = '経度は123.5-124.5の範囲で入力してください（石垣島周辺）';
    }
    
    return newErrors;
  }, []);

  // 地点追加
  const handleAddLocation = () => {
    const newId = Date.now().toString();
    setCurrentLocation({
      id: newId,
      name: '',
      type: 'activity',
      lat: 24.3336,
      lng: 124.1543,
      address: '',
      description: '',
      contact: '',
      website: '',
      notes: ''
    });
    setEditingIndex(-1);
    setErrors({});
    setOpen(true);
  };

  // 地点編集
  const handleEditLocation = (index) => {
    const location = locations[index];
    setCurrentLocation({ ...location });
    setEditingIndex(index);
    setErrors({});
    setOpen(true);
  };

  // 地点削除
  const handleDeleteLocation = (index) => {
    if (window.confirm('この地点を削除しますか？')) {
      const newLocations = locations.filter((_, i) => i !== index);
      updateLocationData(newLocations);
    }
  };

  // 地点保存
  const handleSaveLocation = async () => {
    const validationErrors = validateLocation(currentLocation);
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setLoading(true);
    try {
      const locationId = currentLocation.id || Date.now().toString();
      
      const locationWithId = { 
        ...currentLocation, 
        id: locationId,
        created_at: editingIndex >= 0 ? 
          (locations[editingIndex]?.created_at || new Date().toISOString()) : 
          new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      let newLocations;
      if (editingIndex >= 0) {
        // 編集の場合
        newLocations = [...locations];
        newLocations[editingIndex] = locationWithId;
      } else {
        // 新規追加の場合
        newLocations = [...locations, locationWithId];
      }
      
      updateLocationData(newLocations);
      setOpen(false);
      setErrors({});
      
      console.log('✅ 地点保存完了:', locationWithId);
      
    } catch (error) {
      console.error('地点保存エラー:', error);
      setErrors({ general: '地点情報の保存に失敗しました' });
    } finally {
      setLoading(false);
    }
  };

  // プリセット地点の復元
  const handleRestorePresets = () => {
    if (window.confirm('プリセット地点を復元しますか？既存のカスタム地点は保持されます。')) {
      const existingCustomLocations = locations.filter(loc => 
        !PRESET_LOCATIONS.some(preset => preset.name === loc.name)
      );
      
      const presetsWithId = PRESET_LOCATIONS.map((location, index) => ({
        ...location,
        id: Date.now() + index,
        created_at: new Date().toISOString()
      }));
      
      const mergedLocations = [...existingCustomLocations, ...presetsWithId];
      updateLocationData(mergedLocations);
    }
  };

  // 現在地取得
  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation(prev => ({
            ...prev,
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }));
        },
        (error) => {
          console.error('位置情報取得エラー:', error);
          alert('位置情報の取得に失敗しました');
        }
      );
    } else {
      alert('このブラウザは位置情報に対応していません');
    }
  };

  // ツアーデータに地点を設定
  const handleSetAsDestination = (location) => {
    if (onTourDataUpdate) {
      const newTourData = {
        ...tourData,
        activityLocation: {
          lat: location.lat,
          lng: location.lng,
          name: location.name
        }
      };
      onTourDataUpdate(newTourData);
      console.log('🎯 目的地を設定:', location.name);
    }
  };

  const handleSetAsDeparture = (location) => {
    if (onTourDataUpdate) {
      const newTourData = {
        ...tourData,
        departureLocation: {
          lat: location.lat,
          lng: location.lng,
          name: location.name
        }
      };
      onTourDataUpdate(newTourData);
      console.log('🚗 出発地を設定:', location.name);
    }
  };

  // フィルタリング
  const filteredLocations = locations.filter(location => {
    const matchesType = filterType === 'all' || location.type === filterType;
    const matchesSearch = location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         location.address.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  // 統計計算
  const typeCount = locations.reduce((acc, location) => {
    acc[location.type] = (acc[location.type] || 0) + 1;
    return acc;
  }, {});

  // 地点タイプのアイコンと色を取得
  const getTypeInfo = (type) => {
    return LOCATION_TYPES.find(t => t.value === type) || LOCATION_TYPES[0];
  };

  // エラー表示コンポーネント
  const ErrorDisplay = ({ field }) => {
    return errors[field] ? (
      <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
        {errors[field]}
      </Typography>
    ) : null;
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* 統計情報 */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary">{locations.length}</Typography>
              <Typography variant="body2" color="text.secondary">総地点数</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success.main">{typeCount.activity || 0}</Typography>
              <Typography variant="body2" color="text.secondary">アクティビティ地点</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="info.main">{typeCount.hotel || 0}</Typography>
              <Typography variant="body2" color="text.secondary">ホテル・宿泊施設</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="warning.main">{typeCount.departure || 0}</Typography>
              <Typography variant="body2" color="text.secondary">出発地点</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 現在の設定 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            現在のツアー設定
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Alert severity="info" sx={{ height: '100%' }}>
                <Typography variant="subtitle2">🚗 出発地点</Typography>
                <Typography variant="body2">
                  {tourData.departureLocation?.name || '未設定'}
                </Typography>
              </Alert>
            </Grid>
            <Grid item xs={12} md={4}>
              <Alert severity="success" sx={{ height: '100%' }}>
                <Typography variant="subtitle2">🎯 目的地</Typography>
                <Typography variant="body2">
                  {tourData.activityLocation?.name || '未設定'}
                </Typography>
              </Alert>
            </Grid>
            <Grid item xs={12} md={4}>
              <Alert severity="warning" sx={{ height: '100%' }}>
                <Typography variant="subtitle2">📅 ツアー日程</Typography>
                <Typography variant="body2">
                  {tourData.date} / {tourData.activityType}
                </Typography>
              </Alert>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* コントロールボタン */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddLocation}
        >
          地点追加
        </Button>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={handleRestorePresets}
        >
          プリセット復元
        </Button>
        
        {/* フィルタリング */}
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>地点タイプ</InputLabel>
          <Select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            label="地点タイプ"
          >
            <MenuItem value="all">すべて</MenuItem>
            {LOCATION_TYPES.map(type => (
              <MenuItem key={type.value} value={type.value}>
                {type.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        {/* 検索 */}
        <TextField
          placeholder="地点名・住所で検索"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
          }}
          sx={{ minWidth: 200 }}
        />
        
        <Box sx={{ flexGrow: 1 }} />
        <Typography variant="body2" color="text.secondary">
          最終更新: {locations.length > 0 ? new Date().toLocaleTimeString() : '未更新'}
        </Typography>
      </Box>

      {/* 地点一覧 */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            登録地点一覧
          </Typography>
          
          {filteredLocations.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <LocationIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {searchTerm || filterType !== 'all' ? '条件に一致する地点がありません' : '地点が登録されていません'}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                「地点追加」ボタンから新しい地点を登録してください
              </Typography>
              <Button 
                variant="contained" 
                startIcon={<AddIcon />} 
                onClick={handleAddLocation}
                sx={{ mt: 2 }}
              >
                最初の地点を追加
              </Button>
            </Box>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>地点名</TableCell>
                    <TableCell>タイプ</TableCell>
                    <TableCell>住所</TableCell>
                    <TableCell>座標</TableCell>
                    <TableCell align="center">アクション</TableCell>
                    <TableCell align="center">操作</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredLocations.map((location, index) => {
                    const typeInfo = getTypeInfo(location.type);
                    
                    return (
                      <TableRow key={location.id || index}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {typeInfo.icon}
                            <Box sx={{ ml: 1 }}>
                              <Typography variant="body2" fontWeight="bold">
                                {location.name}
                              </Typography>
                              {location.description && (
                                <Typography variant="caption" color="text.secondary">
                                  {location.description}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={typeInfo.icon}
                            label={typeInfo.label}
                            color={typeInfo.color}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {location.address || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">
                            {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Stack direction="row" spacing={1} justifyContent="center">
                            <Tooltip title="出発地に設定">
                              <Button
                                size="small"
                                variant="outlined"
                                color="primary"
                                onClick={() => handleSetAsDeparture(location)}
                              >
                                出発地
                              </Button>
                            </Tooltip>
                            <Tooltip title="目的地に設定">
                              <Button
                                size="small"
                                variant="outlined"
                                color="success"
                                onClick={() => handleSetAsDestination(location)}
                              >
                                目的地
                              </Button>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                        <TableCell align="center">
                          <Stack direction="row" spacing={1}>
                            <Tooltip title="編集">
                              <IconButton
                                size="small"
                                onClick={() => handleEditLocation(index)}
                                color="primary"
                              >
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="削除">
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteLocation(index)}
                                color="error"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* 地点追加・編集ダイアログ */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <LocationIcon sx={{ mr: 1 }} />
            {editingIndex >= 0 ? '地点情報編集' : '地点追加'}
          </Box>
        </DialogTitle>
        <DialogContent>
          {errors.general && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errors.general}
            </Alert>
          )}
          
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                label="地点名 *"
                value={currentLocation.name}
                onChange={(e) => setCurrentLocation(prev => ({ ...prev, name: e.target.value }))}
                error={!!errors.name}
                placeholder="例: 川平湾グラスボート乗り場"
              />
              <ErrorDisplay field="name" />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>地点タイプ *</InputLabel>
                <Select
                  value={currentLocation.type}
                  onChange={(e) => setCurrentLocation(prev => ({ ...prev, type: e.target.value }))}
                  label="地点タイプ *"
                  error={!!errors.type}
                >
                  {LOCATION_TYPES.map(type => (
                    <MenuItem key={type.value} value={type.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {type.icon}
                        <Typography sx={{ ml: 1 }}>{type.label}</Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <ErrorDisplay field="type" />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="緯度 *"
                type="number"
                inputProps={{ step: 0.0001, min: 24.0, max: 25.0 }}
                value={currentLocation.lat}
                onChange={(e) => setCurrentLocation(prev => ({ ...prev, lat: parseFloat(e.target.value) || 0 }))}
                error={!!errors.lat}
              />
              <ErrorDisplay field="lat" />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="経度 *"
                type="number"
                inputProps={{ step: 0.0001, min: 123.5, max: 124.5 }}
                value={currentLocation.lng}
                onChange={(e) => setCurrentLocation(prev => ({ ...prev, lng: parseFloat(e.target.value) || 0 }))}
                error={!!errors.lng}
              />
              <ErrorDisplay field="lng" />
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<MyLocationIcon />}
                  onClick={handleGetCurrentLocation}
                  size="small"
                >
                  現在地取得
                </Button>
                <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
                  GPS機能を使用して現在地の座標を取得します
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="住所"
                value={currentLocation.address}
                onChange={(e) => setCurrentLocation(prev => ({ ...prev, address: e.target.value }))}
                placeholder="例: 沖縄県石垣市川平1054"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="連絡先"
                value={currentLocation.contact}
                onChange={(e) => setCurrentLocation(prev => ({ ...prev, contact: e.target.value }))}
                placeholder="例: 0980-88-0000"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="ウェブサイト"
                value={currentLocation.website}
                onChange={(e) => setCurrentLocation(prev => ({ ...prev, website: e.target.value }))}
                placeholder="例: https://example.com"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="説明"
                value={currentLocation.description}
                onChange={(e) => setCurrentLocation(prev => ({ ...prev, description: e.target.value }))}
                placeholder="地点の詳細説明や特徴"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="備考"
                multiline
                rows={3}
                value={currentLocation.notes}
                onChange={(e) => setCurrentLocation(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="その他の注意事項や備考"
              />
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setOpen(false)}>
            キャンセル
          </Button>
          <Button
            onClick={handleSaveLocation}
            variant="contained"
            disabled={loading}
            startIcon={loading ? <LinearProgress /> : <SaveIcon />}
          >
            {loading ? '保存中...' : '保存'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LocationManager;