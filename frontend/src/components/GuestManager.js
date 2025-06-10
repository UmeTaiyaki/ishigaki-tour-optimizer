import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, TextField,
  Button, IconButton, FormControl, InputLabel, Select, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  Stack, Alert, Tooltip, FormControlLabel, Checkbox, Autocomplete,
  InputAdornment, List, ListItem, ListItemText, ListItemIcon,
  Collapse, Divider, Badge, CircularProgress, Tab, Tabs
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Hotel as HotelIcon,
  AccessTime as TimeIcon,
  LocationOn as LocationIcon,
  Group as GroupIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Search as SearchIcon,
  MyLocation as MyLocationIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Info as InfoIcon,
  Map as MapIcon
} from '@mui/icons-material';

// 簡易地図コンポーネント（地図表示機能付き）
const SimpleLocationMap = ({ 
  location, 
  onLocationChange, 
  guests = [], 
  selectedGuestId = null 
}) => {
  const [mapCenter, setMapCenter] = useState(location || { lat: 24.3388, lng: 124.1572 });
  
  // 石垣島の有名なホテルの位置情報
  const hotelLocations = {
    'ANAインターコンチネンタル石垣リゾート': { lat: 24.3892, lng: 124.1256 },
    'フサキビーチリゾート ホテル＆ヴィラズ': { lat: 24.3889, lng: 124.1253 },
    'グランヴィリオ リゾート石垣島': { lat: 24.3380, lng: 124.1572 },
    'アートホテル石垣島': { lat: 24.3360, lng: 124.1580 },
    'ホテル日航八重山': { lat: 24.3370, lng: 124.1585 },
    'ベッセルホテル石垣島': { lat: 24.3375, lng: 124.1565 },
    'ホテルミヤヒラ': { lat: 24.3365, lng: 124.1575 },
    '川平湾グラスボート乗り場': { lat: 24.4041, lng: 124.1611 },
    '白保ペンション': { lat: 24.3065, lng: 124.2158 },
    '米原ビーチハウス': { lat: 24.4542, lng: 124.1628 }
  };
  
  // クリックで位置を変更
  const handleMapClick = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // 地図サイズに対する相対位置から緯度経度を計算（簡易版）
    const lat = 24.4 - (y / rect.height) * 0.3; // 石垣島の緯度範囲
    const lng = 124.0 + (x / rect.width) * 0.4; // 石垣島の経度範囲
    
    const newLocation = { lat, lng };
    setMapCenter(newLocation);
    onLocationChange(newLocation);
  };
  
  // ホテル位置マーカーのスタイル計算
  const getMarkerPosition = (hotelLocation) => {
    const mapBounds = {
      north: 24.4,
      south: 24.1,
      east: 124.4,
      west: 124.0
    };
    
    const x = ((hotelLocation.lng - mapBounds.west) / (mapBounds.east - mapBounds.west)) * 100;
    const y = ((mapBounds.north - hotelLocation.lat) / (mapBounds.north - mapBounds.south)) * 100;
    
    return { left: `${Math.max(0, Math.min(95, x))}%`, top: `${Math.max(0, Math.min(95, y))}%` };
  };
  
  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
        <MapIcon sx={{ mr: 1 }} />
        位置選択マップ
      </Typography>
      
      {/* 地図エリア */}
      <Box
        sx={{
          position: 'relative',
          height: 400,
          bgcolor: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 50%, #90caf9 100%)',
          border: '2px solid #ddd',
          borderRadius: 1,
          cursor: 'crosshair',
          backgroundImage: `
            radial-gradient(circle at 30% 60%, rgba(76, 175, 80, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 70% 20%, rgba(33, 150, 243, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(255, 193, 7, 0.1) 0%, transparent 50%)
          `,
          overflow: 'hidden'
        }}
        onClick={handleMapClick}
      >
        {/* 島の輪郭（簡易版） */}
        <Box
          sx={{
            position: 'absolute',
            top: '20%',
            left: '20%',
            width: '60%',
            height: '60%',
            borderRadius: '40% 60% 60% 40%',
            bgcolor: 'rgba(76, 175, 80, 0.2)',
            border: '2px solid rgba(76, 175, 80, 0.4)'
          }}
        />
        
        {/* 現在選択中の位置マーカー */}
        {location && (
          <Box
            sx={{
              position: 'absolute',
              ...getMarkerPosition(location),
              transform: 'translate(-50%, -50%)',
              zIndex: 10
            }}
          >
            <Box
              sx={{
                width: 20,
                height: 20,
                bgcolor: 'error.main',
                borderRadius: '50%',
                border: '3px solid white',
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                animation: 'pulse 2s infinite'
              }}
            />
          </Box>
        )}
        
        {/* ホテルマーカー */}
        {Object.entries(hotelLocations).map(([hotelName, hotelLocation]) => (
          <Box
            key={hotelName}
            sx={{
              position: 'absolute',
              ...getMarkerPosition(hotelLocation),
              transform: 'translate(-50%, -50%)',
              zIndex: 5
            }}
          >
            <Tooltip title={hotelName}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  bgcolor: 'primary.main',
                  borderRadius: '50%',
                  border: '2px solid white',
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'scale(1.5)',
                    zIndex: 15
                  }
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onLocationChange(hotelLocation);
                  setMapCenter(hotelLocation);
                }}
              />
            </Tooltip>
          </Box>
        ))}
        
        {/* 他のゲストマーカー */}
        {guests.map((guest, index) => {
          if (!guest.location || guest.id === selectedGuestId) return null;
          
          return (
            <Box
              key={guest.id}
              sx={{
                position: 'absolute',
                ...getMarkerPosition(guest.location),
                transform: 'translate(-50%, -50%)',
                zIndex: 3
              }}
            >
              <Tooltip title={`${guest.name} (${guest.hotel})`}>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    bgcolor: 'info.main',
                    borderRadius: '50%',
                    border: '1px solid white',
                    opacity: 0.7
                  }}
                />
              </Tooltip>
            </Box>
          );
        })}
        
        {/* 地図凡例 */}
        <Paper
          sx={{
            position: 'absolute',
            bottom: 10,
            left: 10,
            p: 1,
            bgcolor: 'rgba(255, 255, 255, 0.9)'
          }}
        >
          <Typography variant="caption" sx={{ display: 'block', fontWeight: 'bold', mb: 0.5 }}>
            凡例
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 8, height: 8, bgcolor: 'error.main', borderRadius: '50%' }} />
              <Typography variant="caption">選択中の位置</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 8, height: 8, bgcolor: 'primary.main', borderRadius: '50%' }} />
              <Typography variant="caption">ホテル</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 8, height: 8, bgcolor: 'info.main', borderRadius: '50%' }} />
              <Typography variant="caption">他のゲスト</Typography>
            </Box>
          </Box>
        </Paper>
        
        {/* 操作説明 */}
        <Paper
          sx={{
            position: 'absolute',
            top: 10,
            right: 10,
            p: 1,
            bgcolor: 'rgba(255, 255, 255, 0.9)'
          }}
        >
          <Typography variant="caption">
            💡 地図をクリックして位置を設定
          </Typography>
        </Paper>
      </Box>
      
      {/* 位置情報表示 */}
      <Alert severity="info" sx={{ mt: 1 }}>
        <Typography variant="body2">
          現在の位置: 緯度 {location?.lat?.toFixed(4) || '未設定'}, 
          経度 {location?.lng?.toFixed(4) || '未設定'}
        </Typography>
        <Typography variant="caption">
          青いマーカーをクリックして有名ホテルの位置を素早く設定できます
        </Typography>
      </Alert>
      
      {/* CSS for animation */}
      <style>
        {`
          @keyframes pulse {
            0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
            50% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.7; }
            100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          }
        `}
      </style>
    </Box>
  );
};

const GuestManager = ({ guests, onGuestsUpdate }) => {
  const [open, setOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(-1);
  const [expandedCard, setExpandedCard] = useState(null);
  const [searchingLocation, setSearchingLocation] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [filterBy, setFilterBy] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [tabValue, setTabValue] = useState(0);
  const [currentGuest, setCurrentGuest] = useState({
    id: '',
    name: '',
    people: 1,
    hotel: '',
    location: { lat: 24.3388, lng: 124.1572 }, // 石垣島中心
    preferredTime: { start: '08:00', end: '09:00' },
    phone: '',
    email: '',
    notes: '',
    specialRequests: [],
    isConfirmed: false,
    priority: 'normal', // low, normal, high
    roomNumber: '',
    contactPerson: '',
    emergencyContact: ''
  });

  // 石垣島の主要ホテル（プリセット）
  const ishigakiHotels = [
    'ANAインターコンチネンタル石垣リゾート',
    'フサキビーチリゾート ホテル＆ヴィラズ',
    'グランヴィリオ リゾート石垣島',
    'アートホテル石垣島',
    'ホテル日航八重山',
    'ベッセルホテル石垣島',
    'ホテルミヤヒラ',
    '石垣島ビーチホテルサンシャイン',
    '川平湾グラスボート乗り場',
    '白保ペンション',
    '米原ビーチハウス',
    'オーシャンビューホテル',
    '石垣リゾートグランヴィリオホテル',
    'ラ・ティーダ石垣島',
    '石垣島ホテルククル'
  ];

  // 特別リクエストオプション
  const specialRequestOptions = [
    'チャイルドシート必要',
    'ベビーシート必要',
    '車椅子対応',
    'ペット同伴',
    '大型荷物あり',
    '早朝ピックアップ',
    '深夜ピックアップ',
    '他言語対応必要',
    '食物アレルギー対応',
    'VIP対応'
  ];

  // 優先度オプション
  const priorityOptions = [
    { value: 'low', label: '低', color: 'default' },
    { value: 'normal', label: '通常', color: 'primary' },
    { value: 'high', label: '高', color: 'warning' }
  ];

  // ダイアログを開く
  const handleOpenDialog = (index = -1) => {
    if (index >= 0) {
      setCurrentGuest({ ...guests[index] });
      setEditingIndex(index);
    } else {
      const newId = `guest_${Date.now()}`;
      setCurrentGuest({
        id: newId,
        name: '',
        people: 1,
        hotel: '',
        location: { lat: 24.3388, lng: 124.1572 },
        preferredTime: { start: '08:00', end: '09:00' },
        phone: '',
        email: '',
        notes: '',
        specialRequests: [],
        isConfirmed: false,
        priority: 'normal',
        roomNumber: '',
        contactPerson: '',
        emergencyContact: ''
      });
      setEditingIndex(-1);
    }
    setValidationErrors({});
    setTabValue(0);
    setOpen(true);
  };

  // ダイアログを閉じる
  const handleCloseDialog = () => {
    setOpen(false);
    setCurrentGuest({
      id: '',
      name: '',
      people: 1,
      hotel: '',
      location: { lat: 24.3388, lng: 124.1572 },
      preferredTime: { start: '08:00', end: '09:00' },
      phone: '',
      email: '',
      notes: '',
      specialRequests: [],
      isConfirmed: false,
      priority: 'normal',
      roomNumber: '',
      contactPerson: '',
      emergencyContact: ''
    });
    setEditingIndex(-1);
    setValidationErrors({});
  };

  // バリデーション
  const validateGuest = (guest) => {
    const errors = {};
    
    if (!guest.name.trim()) {
      errors.name = 'ゲスト名は必須です';
    }
    
    if (!guest.hotel.trim()) {
      errors.hotel = 'ホテル名は必須です';
    }
    
    if (guest.people < 1 || guest.people > 20) {
      errors.people = '人数は1〜20名で入力してください';
    }
    
    if (!guest.preferredTime.start || !guest.preferredTime.end) {
      errors.preferredTime = '希望時間を設定してください';
    } else if (guest.preferredTime.start >= guest.preferredTime.end) {
      errors.preferredTime = '開始時間は終了時間より前に設定してください';
    }
    
    if (guest.phone && !/^[\d-\s\+\(\)]+$/.test(guest.phone)) {
      errors.phone = '正しい電話番号を入力してください';
    }
    
    if (guest.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guest.email)) {
      errors.email = '正しいメールアドレスを入力してください';
    }
    
    return errors;
  };

  // ゲスト保存
  const handleSaveGuest = () => {
    const errors = validateGuest(currentGuest);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    const newGuests = [...guests];
    if (editingIndex >= 0) {
      newGuests[editingIndex] = { ...currentGuest };
    } else {
      newGuests.push({ ...currentGuest });
    }
    
    onGuestsUpdate(newGuests);
    handleCloseDialog();
  };

  // ゲスト削除
  const handleDeleteGuest = (index) => {
    if (window.confirm('このゲストを削除しますか？')) {
      const newGuests = guests.filter((_, i) => i !== index);
      onGuestsUpdate(newGuests);
    }
  };

  // 入力フィールドの変更
  const handleInputChange = (field, value) => {
    setCurrentGuest(prev => ({
      ...prev,
      [field]: value
    }));
    
    // エラーをクリア
    if (validationErrors[field]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  // 希望時間の変更
  const handleTimeChange = (timeType, value) => {
    setCurrentGuest(prev => ({
      ...prev,
      preferredTime: {
        ...prev.preferredTime,
        [timeType]: value
      }
    }));
    
    if (validationErrors.preferredTime) {
      setValidationErrors(prev => ({
        ...prev,
        preferredTime: undefined
      }));
    }
  };

  // 特別リクエストの変更
  const handleSpecialRequestChange = (request) => {
    setCurrentGuest(prev => {
      const newRequests = prev.specialRequests.includes(request)
        ? prev.specialRequests.filter(req => req !== request)
        : [...prev.specialRequests, request];
      
      return {
        ...prev,
        specialRequests: newRequests
      };
    });
  };

  // ホテル位置の自動検索（改善版）
  const handleHotelLocationSearch = async () => {
    if (!currentGuest.hotel) return;
    
    setSearchingLocation(true);
    
    // 石垣島の主要ホテルの座標（実際のデータに基づく）
    const hotelLocations = {
      'ANAインターコンチネンタル石垣リゾート': { lat: 24.3892, lng: 124.1256 },
      'フサキビーチリゾート ホテル＆ヴィラズ': { lat: 24.3889, lng: 124.1253 },
      'グランヴィリオ リゾート石垣島': { lat: 24.3380, lng: 124.1572 },
      'アートホテル石垣島': { lat: 24.3360, lng: 124.1580 },
      'ホテル日航八重山': { lat: 24.3370, lng: 124.1585 },
      'ベッセルホテル石垣島': { lat: 24.3375, lng: 124.1565 },
      '川平湾グラスボート乗り場': { lat: 24.4041, lng: 124.1611 },
      '白保ペンション': { lat: 24.3065, lng: 124.2158 },
      '米原ビーチハウス': { lat: 24.4542, lng: 124.1628 }
    };
    
    setTimeout(() => {
      const location = hotelLocations[currentGuest.hotel];
      if (location) {
        setCurrentGuest(prev => ({
          ...prev,
          location
        }));
      }
      setSearchingLocation(false);
    }, 1000);
  };

  // 地図での位置変更
  const handleLocationChange = (newLocation) => {
    setCurrentGuest(prev => ({
      ...prev,
      location: newLocation
    }));
  };

  // ゲストの確認状態切り替え
  const handleToggleConfirmation = (index) => {
    const newGuests = [...guests];
    newGuests[index] = {
      ...newGuests[index],
      isConfirmed: !newGuests[index].isConfirmed
    };
    onGuestsUpdate(newGuests);
  };

  // フィルタリング
  const getFilteredGuests = () => {
    let filtered = [...guests];
    
    switch (filterBy) {
      case 'confirmed':
        filtered = filtered.filter(guest => guest.isConfirmed);
        break;
      case 'unconfirmed':
        filtered = filtered.filter(guest => !guest.isConfirmed);
        break;
      case 'high_priority':
        filtered = filtered.filter(guest => guest.priority === 'high');
        break;
      case 'special_requests':
        filtered = filtered.filter(guest => guest.specialRequests?.length > 0);
        break;
      default:
        break;
    }
    
    // ソート
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'people':
          return b.people - a.people;
        case 'hotel':
          return a.hotel.localeCompare(b.hotel);
        case 'time':
          return a.preferredTime.start.localeCompare(b.preferredTime.start);
        case 'priority':
          const priorityOrder = { high: 3, normal: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        default:
          return 0;
      }
    });
    
    return filtered;
  };

  // 統計情報の計算
  const getStatistics = () => {
    const totalGuests = guests.length;
    const totalPeople = guests.reduce((sum, guest) => sum + guest.people, 0);
    const confirmedGuests = guests.filter(guest => guest.isConfirmed).length;
    const highPriorityGuests = guests.filter(guest => guest.priority === 'high').length;
    const specialRequestsCount = guests.filter(guest => guest.specialRequests?.length > 0).length;
    
    return {
      totalGuests,
      totalPeople,
      confirmedGuests,
      highPriorityGuests,
      specialRequestsCount,
      confirmationRate: totalGuests > 0 ? Math.round((confirmedGuests / totalGuests) * 100) : 0
    };
  };

  const statistics = getStatistics();
  const filteredGuests = getFilteredGuests();

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <PersonIcon sx={{ mr: 1 }} />
        ゲスト管理
      </Typography>

      {/* 統計カード */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="primary">
                {statistics.totalGuests}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                総ゲスト数
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="success.main">
                {statistics.totalPeople}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                総人数
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="info.main">
                {statistics.confirmationRate}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                確認済み率
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="warning.main">
                {statistics.highPriorityGuests}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                高優先度
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* コントロールパネル */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
                fullWidth
              >
                ゲスト追加
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>フィルター</InputLabel>
                <Select
                  value={filterBy}
                  onChange={(e) => setFilterBy(e.target.value)}
                  label="フィルター"
                >
                  <MenuItem value="all">すべて</MenuItem>
                  <MenuItem value="confirmed">確認済み</MenuItem>
                  <MenuItem value="unconfirmed">未確認</MenuItem>
                  <MenuItem value="high_priority">高優先度</MenuItem>
                  <MenuItem value="special_requests">特別リクエスト</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>並び順</InputLabel>
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  label="並び順"
                >
                  <MenuItem value="name">名前順</MenuItem>
                  <MenuItem value="people">人数順</MenuItem>
                  <MenuItem value="hotel">ホテル順</MenuItem>
                  <MenuItem value="time">希望時間順</MenuItem>
                  <MenuItem value="priority">優先度順</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary">
                表示中: {filteredGuests.length} / {guests.length} 件
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* ゲストリスト */}
      {filteredGuests.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <PersonIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {guests.length === 0 ? 'ゲストが登録されていません' : 'フィルター条件に一致するゲストがいません'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {guests.length === 0 
                ? '新しいゲストを追加してツアーの準備を始めましょう' 
                : 'フィルター条件を変更してください'
              }
            </Typography>
            {guests.length === 0 && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
              >
                最初のゲストを追加
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell width="50">状態</TableCell>
                <TableCell>ゲスト名</TableCell>
                <TableCell>ホテル</TableCell>
                <TableCell align="center">人数</TableCell>
                <TableCell>希望時間</TableCell>
                <TableCell>優先度</TableCell>
                <TableCell align="center">詳細</TableCell>
                <TableCell align="center">操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredGuests.map((guest, index) => (
                <React.Fragment key={guest.id}>
                  <TableRow hover>
                    <TableCell>
                      <Tooltip title={guest.isConfirmed ? "確認済み" : "未確認"}>
                        <IconButton
                          size="small"
                          onClick={() => handleToggleConfirmation(index)}
                          color={guest.isConfirmed ? "success" : "default"}
                        >
                          <CheckCircleIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {guest.name}
                        </Typography>
                        {guest.contactPerson && (
                          <Typography variant="caption" color="text.secondary">
                            連絡者: {guest.contactPerson}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <HotelIcon sx={{ mr: 1, fontSize: 18, color: 'text.secondary' }} />
                        <Box>
                          <Typography variant="body2">
                            {guest.hotel}
                          </Typography>
                          {guest.roomNumber && (
                            <Typography variant="caption" color="text.secondary">
                              部屋: {guest.roomNumber}
                            </Typography>
                          )}
                        </Box>
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
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <TimeIcon sx={{ mr: 1, fontSize: 18, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          {guest.preferredTime.start}〜{guest.preferredTime.end}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={priorityOptions.find(p => p.value === guest.priority)?.label || '通常'}
                        size="small"
                        color={priorityOptions.find(p => p.value === guest.priority)?.color || 'default'}
                        variant={guest.priority === 'high' ? 'filled' : 'outlined'}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={() => setExpandedCard(expandedCard === guest.id ? null : guest.id)}
                      >
                        {expandedCard === guest.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                      {(guest.specialRequests?.length > 0 || guest.phone || guest.email) && (
                        <Badge badgeContent={guest.specialRequests?.length || 0} color="info">
                          <InfoIcon sx={{ fontSize: 18, color: 'info.main' }} />
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="編集">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(index)}
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
                    </TableCell>
                  </TableRow>
                  
                  {/* 詳細情報の展開パネル */}
                  <TableRow>
                    <TableCell sx={{ py: 0 }} colSpan={8}>
                      <Collapse in={expandedCard === guest.id}>
                        <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
                          <Grid container spacing={2}>
                            {guest.phone && (
                              <Grid item xs={12} sm={6}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <PhoneIcon sx={{ mr: 1, fontSize: 18 }} />
                                  <Typography variant="body2">
                                    電話: {guest.phone}
                                  </Typography>
                                </Box>
                              </Grid>
                            )}
                            {guest.email && (
                              <Grid item xs={12} sm={6}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <EmailIcon sx={{ mr: 1, fontSize: 18 }} />
                                  <Typography variant="body2">
                                    メール: {guest.email}
                                  </Typography>
                                </Box>
                              </Grid>
                            )}
                            {guest.emergencyContact && (
                              <Grid item xs={12}>
                                <Typography variant="body2">
                                  <strong>緊急連絡先:</strong> {guest.emergencyContact}
                                </Typography>
                              </Grid>
                            )}
                            {guest.specialRequests?.length > 0 && (
                              <Grid item xs={12}>
                                <Typography variant="body2" sx={{ mb: 1 }}>
                                  <strong>特別リクエスト:</strong>
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                  {guest.specialRequests.map((request, idx) => (
                                    <Chip
                                      key={idx}
                                      label={request}
                                      size="small"
                                      color="warning"
                                      variant="outlined"
                                    />
                                  ))}
                                </Box>
                              </Grid>
                            )}
                            {guest.notes && (
                              <Grid item xs={12}>
                                <Typography variant="body2">
                                  <strong>備考:</strong> {guest.notes}
                                </Typography>
                              </Grid>
                            )}
                            <Grid item xs={12}>
                              <Typography variant="caption" color="text.secondary">
                                位置: {guest.location.lat.toFixed(4)}, {guest.location.lng.toFixed(4)}
                              </Typography>
                            </Grid>
                          </Grid>
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* ゲスト追加・編集ダイアログ */}
      <Dialog open={open} onClose={handleCloseDialog} maxWidth="lg" fullWidth>
        <DialogTitle>
          {editingIndex >= 0 ? 'ゲスト情報編集' : 'ゲスト追加'}
        </DialogTitle>
        <DialogContent>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} sx={{ mb: 3 }}>
            <Tab label="基本情報" icon={<PersonIcon />} />
            <Tab label="位置・地図" icon={<MapIcon />} />
            <Tab label="連絡先・その他" icon={<PhoneIcon />} />
          </Tabs>

          {/* タブ1: 基本情報 */}
          {tabValue === 0 && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={8}>
                <TextField
                  fullWidth
                  label="ゲスト名"
                  value={currentGuest.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  error={!!validationErrors.name}
                  helperText={validationErrors.name}
                  required
                  placeholder="例: 田中太郎"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="人数"
                  type="number"
                  value={currentGuest.people}
                  onChange={(e) => handleInputChange('people', parseInt(e.target.value) || 1)}
                  error={!!validationErrors.people}
                  helperText={validationErrors.people}
                  inputProps={{ min: 1, max: 20 }}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={8}>
                <Autocomplete
                  options={ishigakiHotels}
                  value={currentGuest.hotel}
                  onChange={(event, newValue) => handleInputChange('hotel', newValue || '')}
                  onInputChange={(event, newInputValue) => handleInputChange('hotel', newInputValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="ホテル名"
                      error={!!validationErrors.hotel}
                      helperText={validationErrors.hotel || '石垣島の主要ホテルから選択または直接入力'}
                      required
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              size="small"
                              onClick={handleHotelLocationSearch}
                              disabled={searchingLocation || !currentGuest.hotel}
                              color="primary"
                              title="ホテル位置を検索"
                            >
                              {searchingLocation ? <CircularProgress size={20} /> : <SearchIcon />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  )}
                  freeSolo
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="部屋番号（任意）"
                  value={currentGuest.roomNumber}
                  onChange={(e) => handleInputChange('roomNumber', e.target.value)}
                  placeholder="例: 1205"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="希望開始時間"
                  type="time"
                  value={currentGuest.preferredTime.start}
                  onChange={(e) => handleTimeChange('start', e.target.value)}
                  error={!!validationErrors.preferredTime}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="希望終了時間"
                  type="time"
                  value={currentGuest.preferredTime.end}
                  onChange={(e) => handleTimeChange('end', e.target.value)}
                  error={!!validationErrors.preferredTime}
                  helperText={validationErrors.preferredTime}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>優先度</InputLabel>
                  <Select
                    value={currentGuest.priority}
                    onChange={(e) => handleInputChange('priority', e.target.value)}
                    label="優先度"
                  >
                    {priorityOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="連絡担当者（任意）"
                  value={currentGuest.contactPerson}
                  onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                  placeholder="例: 田中花子（代表者）"
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  特別リクエスト
                </Typography>
                <Grid container spacing={1}>
                  {specialRequestOptions.map((request) => (
                    <Grid item xs={6} sm={4} md={3} key={request}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={currentGuest.specialRequests.includes(request)}
                            onChange={() => handleSpecialRequestChange(request)}
                          />
                        }
                        label={request}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={currentGuest.isConfirmed}
                      onChange={(e) => handleInputChange('isConfirmed', e.target.checked)}
                    />
                  }
                  label="ゲスト情報を確認済み"
                />
              </Grid>
            </Grid>
          )}

          {/* タブ2: 位置・地図 */}
          {tabValue === 1 && (
            <Box>
              <SimpleLocationMap
                location={currentGuest.location}
                onLocationChange={handleLocationChange}
                guests={guests}
                selectedGuestId={currentGuest.id}
              />
            </Box>
          )}

          {/* タブ3: 連絡先・その他 */}
          {tabValue === 2 && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="電話番号（任意）"
                  value={currentGuest.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  error={!!validationErrors.phone}
                  helperText={validationErrors.phone}
                  placeholder="例: 090-1234-5678"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="メールアドレス（任意）"
                  value={currentGuest.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  error={!!validationErrors.email}
                  helperText={validationErrors.email}
                  placeholder="例: guest@example.com"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="緊急連絡先（任意）"
                  value={currentGuest.emergencyContact}
                  onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                  placeholder="緊急時の連絡先（名前と電話番号）"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="備考・注意事項"
                  multiline
                  rows={4}
                  value={currentGuest.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="その他の注意事項や特記事項"
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>キャンセル</Button>
          <Button onClick={handleSaveGuest} variant="contained">
            {editingIndex >= 0 ? '更新' : '追加'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GuestManager;