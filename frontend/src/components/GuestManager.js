// GuestManager.js - データ永続化対応版
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Button, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, Chip, Alert, Divider, Stack, FormControl, InputLabel, 
  Select, MenuItem, Autocomplete, Tooltip, Badge, LinearProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Hotel as HotelIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Schedule as TimeIcon,
  Groups as GroupsIcon,
  LocationOn as LocationIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Refresh as RefreshIcon,
  Map as MapIcon,
  Save as SaveIcon
} from '@mui/icons-material';

// 石垣島の主要ホテル・宿泊施設データ
const ISHIGAKI_HOTELS = [
  { name: 'ANAインターコンチネンタル石垣リゾート', area: '真栄里', lat: 24.3362, lng: 124.1641 },
  { name: 'フサキビーチリゾート', area: 'フサキ', lat: 24.3264, lng: 124.1275 },
  { name: 'グランヴィリオリゾート石垣島', area: '新川', lat: 24.3289, lng: 124.1456 },
  { name: 'アートホテル石垣島', area: '大川', lat: 24.3412, lng: 124.1589 },
  { name: 'ホテルミヤヒラ', area: '美崎町', lat: 24.3398, lng: 124.1534 },
  { name: 'ベッセルホテル石垣島', area: '美崎町', lat: 24.3387, lng: 124.1523 },
  { name: '川平湾周辺民宿', area: '川平', lat: 24.4567, lng: 124.0123 },
  { name: '白保集落民宿', area: '白保', lat: 24.3089, lng: 124.1892 },
  { name: '米原海岸周辺宿泊施設', area: '米原', lat: 24.4234, lng: 124.0789 },
  { name: '石垣港周辺ビジネスホテル', area: '市街地', lat: 24.3336, lng: 124.1543 }
];

// ローカルストレージキー
const STORAGE_KEY = 'ishigaki_tour_guests';

const GuestManager = ({ 
  guests = [], 
  onGuestsUpdate, 
  tourData = {}, 
  onTourDataUpdate,
  environmentalData = null
}) => {
  const [localGuests, setLocalGuests] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(-1);
  const [currentGuest, setCurrentGuest] = useState({
    id: '',
    name: '',
    hotel: '', // 互換性のためhotelとhotel_nameの両方をサポート
    hotel_name: '',
    pickup_lat: 24.3336,
    pickup_lng: 124.1543,
    people: 1,
    preferred_pickup_start: '08:30',
    preferred_pickup_end: '09:00',
    phone: '',
    email: '',
    notes: ''
  });
  const [localTourData, setLocalTourData] = useState({
    date: new Date().toISOString().split('T')[0],
    activityType: 'シュノーケリング',
    startTime: '09:00',
    activityLocation: '川平湾',
    ...tourData
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [selectedHotel, setSelectedHotel] = useState(null);

  // 初期化時にローカルストレージからデータを読み込み
  useEffect(() => {
    const savedGuests = localStorage.getItem(STORAGE_KEY);
    if (savedGuests) {
      try {
        const parsedGuests = JSON.parse(savedGuests);
        console.log('💾 ローカルストレージからゲストデータを復元:', parsedGuests);
        setLocalGuests(parsedGuests);
        // 親コンポーネントにも反映
        if (onGuestsUpdate) {
          onGuestsUpdate(parsedGuests);
        }
      } catch (error) {
        console.error('ローカルストレージからのデータ読み込みエラー:', error);
      }
    } else if (guests.length > 0) {
      // 初回読み込み時は親から受け取ったデータを使用
      setLocalGuests(guests);
    }
  }, []);

  // 親コンポーネントからの更新を反映（初回のみ）
  useEffect(() => {
    if (guests.length > 0 && localGuests.length === 0) {
      setLocalGuests(guests);
    }
  }, [guests]);

  // ツアーデータの同期
  useEffect(() => {
    setLocalTourData(prev => ({ ...prev, ...tourData }));
  }, [tourData]);

  // ゲストデータをローカルストレージに保存
  const saveToLocalStorage = useCallback((guestData) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(guestData));
      console.log('💾 ゲストデータをローカルストレージに保存:', guestData);
    } catch (error) {
      console.error('ローカルストレージへの保存エラー:', error);
    }
  }, []);

  // ゲストデータを更新（ローカル + 親 + ストレージ）
  const updateGuestData = useCallback((newGuests) => {
    console.log('🔄 ゲストデータを更新:', newGuests);
    setLocalGuests(newGuests);
    saveToLocalStorage(newGuests);
    if (onGuestsUpdate) {
      onGuestsUpdate(newGuests);
    }
  }, [onGuestsUpdate, saveToLocalStorage]);

  // バリデーション関数
  const validateGuest = useCallback((guest) => {
    const newErrors = {};
    
    if (!guest.name || !guest.name.trim()) {
      newErrors.name = 'ゲスト名は必須です';
    }
    
    // ホテル名のチェック（両方のフィールドをサポート）
    const hotelName = guest.hotel_name || guest.hotel;
    if (!hotelName || !hotelName.trim()) {
      newErrors.hotel = 'ホテル名は必須です';
    }
    
    if (!guest.people || guest.people < 1 || guest.people > 20) {
      newErrors.people = '人数は1-20名で入力してください';
    }
    
    if (guest.phone && !/^[\d\-\+\(\)\s]+$/.test(guest.phone)) {
      newErrors.phone = '有効な電話番号を入力してください';
    }
    
    if (guest.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guest.email)) {
      newErrors.email = '有効なメールアドレスを入力してください';
    }
    
    // 時間検証
    try {
      const startTime = new Date(`2000-01-01T${guest.preferred_pickup_start}:00`);
      const endTime = new Date(`2000-01-01T${guest.preferred_pickup_end}:00`);
      if (startTime >= endTime) {
        newErrors.time = '終了時刻は開始時刻より後にしてください';
      }
    } catch (e) {
      newErrors.time = '有効な時刻を入力してください';
    }
    
    return newErrors;
  }, []);

  // ゲスト追加
  const handleAddGuest = () => {
    const newId = Date.now().toString();
    setCurrentGuest({
      id: newId,
      name: '',
      hotel: '',
      hotel_name: '',
      pickup_lat: 24.3336,
      pickup_lng: 124.1543,
      people: 1,
      preferred_pickup_start: '08:30',
      preferred_pickup_end: '09:00',
      phone: '',
      email: '',
      notes: ''
    });
    setSelectedHotel(null);
    setEditingIndex(-1);
    setErrors({});
    setOpen(true);
  };

  // ゲスト編集
  const handleEditGuest = (index) => {
    const guest = localGuests[index];
    const guestCopy = { ...guest };
    
    // hotel_nameとhotelの互換性を保つ
    if (!guestCopy.hotel_name && guestCopy.hotel) {
      guestCopy.hotel_name = guestCopy.hotel;
    }
    if (!guestCopy.hotel && guestCopy.hotel_name) {
      guestCopy.hotel = guestCopy.hotel_name;
    }
    
    setCurrentGuest(guestCopy);
    
    // ホテル情報の復元
    const hotelName = guest.hotel_name || guest.hotel;
    const hotel = ISHIGAKI_HOTELS.find(h => h.name === hotelName);
    setSelectedHotel(hotel || null);
    
    setEditingIndex(index);
    setErrors({});
    setOpen(true);
  };

  // ゲスト削除
  const handleDeleteGuest = (index) => {
    if (window.confirm('このゲストを削除しますか？')) {
      const newGuests = localGuests.filter((_, i) => i !== index);
      updateGuestData(newGuests);
    }
  };

  // ゲスト保存
  const handleSaveGuest = async () => {
    const validationErrors = validateGuest(currentGuest);
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setLoading(true);
    try {
      // IDの設定
      const guestId = currentGuest.id || Date.now().toString();
      
      // hotel_nameとhotelの統一
      const hotelName = currentGuest.hotel_name || currentGuest.hotel;
      
      const guestWithId = { 
        ...currentGuest, 
        id: guestId,
        hotel: hotelName,
        hotel_name: hotelName,
        created_at: editingIndex >= 0 ? 
          (localGuests[editingIndex]?.created_at || new Date().toISOString()) : 
          new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      let newGuests;
      if (editingIndex >= 0) {
        // 編集の場合
        newGuests = [...localGuests];
        newGuests[editingIndex] = guestWithId;
      } else {
        // 新規追加の場合
        newGuests = [...localGuests, guestWithId];
      }
      
      updateGuestData(newGuests);
      setOpen(false);
      setErrors({});
      
      console.log('✅ ゲスト保存完了:', guestWithId);
      
    } catch (error) {
      console.error('ゲスト保存エラー:', error);
      setErrors({ general: 'ゲスト情報の保存に失敗しました' });
    } finally {
      setLoading(false);
    }
  };

  // ホテル選択時の処理
  const handleHotelChange = (event, value) => {
    setSelectedHotel(value);
    if (value) {
      setCurrentGuest(prev => ({
        ...prev,
        hotel: value.name,
        hotel_name: value.name,
        pickup_lat: value.lat,
        pickup_lng: value.lng
      }));
    }
  };

  // ツアーデータ更新
  const handleTourDataChange = (field, value) => {
    const newTourData = { ...localTourData, [field]: value };
    setLocalTourData(newTourData);
    if (onTourDataUpdate) {
      onTourDataUpdate(newTourData);
    }
  };

  // データリフレッシュ
  const handleRefreshData = () => {
    const savedGuests = localStorage.getItem(STORAGE_KEY);
    if (savedGuests) {
      try {
        const parsedGuests = JSON.parse(savedGuests);
        setLocalGuests(parsedGuests);
        if (onGuestsUpdate) {
          onGuestsUpdate(parsedGuests);
        }
        console.log('🔄 データをリフレッシュしました');
      } catch (error) {
        console.error('データリフレッシュエラー:', error);
      }
    }
  };

  // CSVエクスポート
  const handleExportCSV = () => {
    if (localGuests.length === 0) {
      alert('エクスポートするゲストデータがありません');
      return;
    }

    const headers = ['名前', 'ホテル名', '人数', '希望開始時刻', '希望終了時刻', '電話番号', 'メールアドレス', '備考'];
    const csvContent = [
      headers.join(','),
      ...localGuests.map(guest => [
        guest.name,
        guest.hotel_name || guest.hotel,
        guest.people,
        guest.preferred_pickup_start,
        guest.preferred_pickup_end,
        guest.phone || '',
        guest.email || '',
        guest.notes || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `guests_${localTourData.date}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  // 統計計算
  const totalPeople = localGuests.reduce((sum, guest) => sum + (guest.people || 0), 0);
  const areaDistribution = localGuests.reduce((acc, guest) => {
    const hotelName = guest.hotel_name || guest.hotel;
    const hotel = ISHIGAKI_HOTELS.find(h => h.name === hotelName);
    const area = hotel?.area || 'その他';
    acc[area] = (acc[area] || 0) + 1;
    return acc;
  }, {});

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
      {/* ツアー基本情報 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            ツアー基本情報
          </Typography>
          <Grid container spacing={2}>
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
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>アクティビティ</InputLabel>
                <Select
                  value={localTourData.activityType}
                  onChange={(e) => handleTourDataChange('activityType', e.target.value)}
                  label="アクティビティ"
                >
                  <MenuItem value="シュノーケリング">シュノーケリング</MenuItem>
                  <MenuItem value="ダイビング">ダイビング</MenuItem>
                  <MenuItem value="観光ドライブ">観光ドライブ</MenuItem>
                  <MenuItem value="川平湾クルーズ">川平湾クルーズ</MenuItem>
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
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="集合場所"
                value={localTourData.activityLocation}
                onChange={(e) => handleTourDataChange('activityLocation', e.target.value)}
                placeholder="川平湾"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* 環境情報表示 */}
      {environmentalData && (
        <Alert severity="info" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip icon={<span>☀️</span>} label={environmentalData.weather || '晴れ'} variant="outlined" />
            <Chip icon={<span>🌡️</span>} label={`${environmentalData.temperature || 29}°C`} variant="outlined" />
            <Chip icon={<span>🌊</span>} label={`潮汐: ${environmentalData.tide_level || 21}m`} variant="outlined" />
            <Chip icon={<span>💨</span>} label={`風速: ${environmentalData.wind_speed || 20}m/s`} variant="outlined" />
          </Box>
        </Alert>
      )}

      {/* 統計情報 */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary">{localGuests.length}</Typography>
              <Typography variant="body2" color="text.secondary">総ゲスト数</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary">{totalPeople}名</Typography>
              <Typography variant="body2" color="text.secondary">総人数</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary">{Object.keys(areaDistribution).length}</Typography>
              <Typography variant="body2" color="text.secondary">エリア数</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary">{Math.max(...Object.values(areaDistribution), 0)}名</Typography>
              <Typography variant="body2" color="text.secondary">最大グループ</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* エリア別ゲスト分布 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            エリア別ゲスト分布
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {Object.entries(areaDistribution).map(([area, count]) => (
              <Chip 
                key={area} 
                label={`${area}: ${count}組`} 
                variant="outlined" 
                size="small"
              />
            ))}
            {Object.keys(areaDistribution).length === 0 && (
              <Typography variant="body2" color="text.secondary">
                ゲストが登録されていません
              </Typography>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* コントロールボタン */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddGuest}
        >
          ゲスト追加
        </Button>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={handleExportCSV}
          disabled={localGuests.length === 0}
        >
          エクスポート
        </Button>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={handleRefreshData}
        >
          リフレッシュ
        </Button>
        <Box sx={{ flexGrow: 1 }} />
        <Typography variant="body2" color="text.secondary">
          最終更新: {localGuests.length > 0 ? new Date().toLocaleTimeString() : '未更新'}
        </Typography>
      </Box>

      {/* ゲスト一覧 */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            ゲスト一覧
          </Typography>
          
          {localGuests.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <PersonIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                ゲストが登録されていません
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                「ゲスト追加」ボタンから最初のゲストを登録してください
              </Typography>
              <Button 
                variant="contained" 
                startIcon={<AddIcon />} 
                onClick={handleAddGuest}
                sx={{ mt: 2 }}
              >
                最初のゲストを追加
              </Button>
            </Box>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>名前</TableCell>
                    <TableCell>ホテル</TableCell>
                    <TableCell align="center">人数</TableCell>
                    <TableCell>希望時間</TableCell>
                    <TableCell>連絡先</TableCell>
                    <TableCell align="center">操作</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {localGuests.map((guest, index) => {
                    const hotelName = guest.hotel_name || guest.hotel || '-';
                    const hotel = ISHIGAKI_HOTELS.find(h => h.name === hotelName);
                    
                    return (
                      <TableRow key={guest.id || index}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
                            {guest.name}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2">
                              {hotelName}
                            </Typography>
                            {hotel && (
                              <Typography variant="caption" color="text.secondary">
                                {hotel.area}エリア
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Chip 
                            label={`${guest.people}名`} 
                            size="small" 
                            color="primary" 
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {guest.preferred_pickup_start} - {guest.preferred_pickup_end}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box>
                            {guest.phone && (
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                <PhoneIcon sx={{ fontSize: 16, mr: 0.5 }} />
                                <Typography variant="caption">{guest.phone}</Typography>
                              </Box>
                            )}
                            {guest.email && (
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <EmailIcon sx={{ fontSize: 16, mr: 0.5 }} />
                                <Typography variant="caption">{guest.email}</Typography>
                              </Box>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Stack direction="row" spacing={1}>
                            <Tooltip title="編集">
                              <IconButton
                                size="small"
                                onClick={() => handleEditGuest(index)}
                                color="primary"
                              >
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="削除">
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteGuest(index)}
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

      {/* ゲスト追加・編集ダイアログ */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <PersonIcon sx={{ mr: 1 }} />
            {editingIndex >= 0 ? 'ゲスト情報編集' : 'ゲスト追加'}
          </Box>
        </DialogTitle>
        <DialogContent>
          {errors.general && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errors.general}
            </Alert>
          )}
          
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="ゲスト名 *"
                value={currentGuest.name}
                onChange={(e) => setCurrentGuest(prev => ({ ...prev, name: e.target.value }))}
                error={!!errors.name}
              />
              <ErrorDisplay field="name" />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="人数 *"
                type="number"
                inputProps={{ min: 1, max: 20 }}
                value={currentGuest.people}
                onChange={(e) => setCurrentGuest(prev => ({ ...prev, people: parseInt(e.target.value) || 1 }))}
                error={!!errors.people}
              />
              <ErrorDisplay field="people" />
            </Grid>
            
            <Grid item xs={12}>
              <Autocomplete
                fullWidth
                options={ISHIGAKI_HOTELS}
                getOptionLabel={(option) => `${option.name} (${option.area})`}
                value={selectedHotel}
                onChange={handleHotelChange}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="ホテル・宿泊施設 *"
                    error={!!errors.hotel}
                  />
                )}
                renderOption={(props, option) => (
                  <Box component="li" {...props}>
                    <HotelIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Box>
                      <Typography variant="body2">{option.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{option.area}エリア</Typography>
                    </Box>
                  </Box>
                )}
              />
              <ErrorDisplay field="hotel" />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="希望ピックアップ開始時刻"
                type="time"
                value={currentGuest.preferred_pickup_start}
                onChange={(e) => setCurrentGuest(prev => ({ ...prev, preferred_pickup_start: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                error={!!errors.time}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="希望ピックアップ終了時刻"
                type="time"
                value={currentGuest.preferred_pickup_end}
                onChange={(e) => setCurrentGuest(prev => ({ ...prev, preferred_pickup_end: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                error={!!errors.time}
              />
              <ErrorDisplay field="time" />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="電話番号"
                value={currentGuest.phone}
                onChange={(e) => setCurrentGuest(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="090-1234-5678"
                error={!!errors.phone}
              />
              <ErrorDisplay field="phone" />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="メールアドレス"
                type="email"
                value={currentGuest.email}
                onChange={(e) => setCurrentGuest(prev => ({ ...prev, email: e.target.value }))}
                placeholder="example@email.com"
                error={!!errors.email}
              />
              <ErrorDisplay field="email" />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="備考"
                multiline
                rows={3}
                value={currentGuest.notes}
                onChange={(e) => setCurrentGuest(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="特別な要望や注意事項があれば記入してください"
              />
            </Grid>

            {selectedHotel && (
              <Grid item xs={12}>
                <Alert severity="info">
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <LocationIcon sx={{ mr: 1 }} />
                    選択されたホテル: {selectedHotel.name} ({selectedHotel.area}エリア)
                  </Box>
                </Alert>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setOpen(false)}>
            キャンセル
          </Button>
          <Button
            onClick={handleSaveGuest}
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : <SaveIcon />}
          >
            {loading ? '保存中...' : '保存'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GuestManager;