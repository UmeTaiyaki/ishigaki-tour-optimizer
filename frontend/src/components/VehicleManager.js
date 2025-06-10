import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, TextField,
  Button, IconButton, FormControl, InputLabel, Select, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  Stack, Alert, Tooltip, FormControlLabel, Checkbox, Autocomplete,
  List, ListItem, ListItemText, ListItemIcon, Collapse, Divider,
  Badge, LinearProgress, Tab, Tabs, Avatar, Rating
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  DirectionsCar as CarIcon,
  Person as PersonIcon,
  Speed as SpeedIcon,
  Build as BuildIcon,
  LocalGasStation as FuelIcon,
  Assignment as LicenseIcon,
  Star as StarIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  LocationOn as LocationIcon,
  Timeline as TimelineIcon,
  Assessment as AssessmentIcon,
  Eco as EcoIcon,
  Security as SecurityIcon
} from '@mui/icons-material';

const VehicleManager = ({ vehicles, onVehiclesUpdate }) => {
  const [open, setOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(-1);
  const [expandedCard, setExpandedCard] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [filterBy, setFilterBy] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [tabValue, setTabValue] = useState(0);
  const [currentVehicle, setCurrentVehicle] = useState({
    id: '',
    name: '',
    capacity: 8,
    vehicleType: 'mini_van',
    driver: '',
    driverPhone: '',
    driverEmail: '',
    equipment: [],
    speedFactor: 1.0,
    fuelType: 'gasoline',
    plateNumber: '',
    notes: '',
    status: 'available', // available, in_use, maintenance, out_of_service
    year: new Date().getFullYear(),
    model: '',
    manufacturer: '',
    color: '',
    insurance: {
      company: '',
      policyNumber: '',
      expiryDate: ''
    },
    maintenance: {
      lastService: '',
      nextService: '',
      mileage: 0,
      condition: 'good' // excellent, good, fair, poor
    },
    rating: 5,
    totalTrips: 0,
    fuelEfficiency: 0, // km/L
    averageSpeed: 35, // km/h
    isActive: true
  });

  // 車両タイプの選択肢（石垣島特化）
  const vehicleTypes = [
    { value: 'mini_van', label: 'ミニバン', capacity: 8, icon: '🚐' },
    { value: 'sedan', label: 'セダン', capacity: 4, icon: '🚗' },
    { value: 'wagon', label: 'ワゴン', capacity: 6, icon: '🚙' },
    { value: 'suv', label: 'SUV', capacity: 7, icon: '🚙' },
    { value: 'compact', label: 'コンパクトカー', capacity: 4, icon: '🚗' },
    { value: 'bus', label: 'マイクロバス', capacity: 20, icon: '🚌' },
    { value: 'convertible', label: 'オープンカー', capacity: 4, icon: '🏎️' },
    { value: 'electric', label: '電気自動車', capacity: 4, icon: '⚡' },
    { value: 'other', label: 'その他', capacity: 8, icon: '🚐' }
  ];

  // 石垣島向け装備オプション
  const equipmentOptions = [
    'チャイルドシート',
    'ベビーシート',
    'ジュニアシート',
    '車椅子対応',
    'Wi-Fi',
    'USB充電器',
    'クーラーボックス',
    'シュノーケル用品',
    'タオル',
    '日除けパラソル',
    '防水バッグ',
    'ビーチチェア',
    'ゴザ・レジャーシート',
    '救急箱',
    'ライフジャケット',
    'シャワー設備',
    'ドライブレコーダー',
    'カーナビ',
    'ETC',
    'バックカメラ',
    'サイドカメラ',
    'ドアバイザー',
    'サンシェード',
    'スマートフォンホルダー',
    'ドリンクホルダー'
  ];

  // 燃料タイプ
  const fuelTypes = [
    { value: 'gasoline', label: 'ガソリン', icon: '⛽' },
    { value: 'hybrid', label: 'ハイブリッド', icon: '🔋' },
    { value: 'electric', label: '電気', icon: '⚡' },
    { value: 'diesel', label: 'ディーゼル', icon: '🛢️' }
  ];

  // 車両状態
  const statusOptions = [
    { value: 'available', label: '利用可能', color: 'success' },
    { value: 'in_use', label: '使用中', color: 'info' },
    { value: 'maintenance', label: 'メンテナンス中', color: 'warning' },
    { value: 'out_of_service', label: '故障・修理中', color: 'error' }
  ];

  // 車両コンディション
  const conditionOptions = [
    { value: 'excellent', label: '優秀', color: 'success', score: 5 },
    { value: 'good', label: '良好', color: 'info', score: 4 },
    { value: 'fair', label: '普通', color: 'warning', score: 3 },
    { value: 'poor', label: '要注意', color: 'error', score: 2 }
  ];

  // 日本の自動車メーカー
  const manufacturers = [
    'トヨタ', 'ホンダ', '日産', 'マツダ', 'スバル', 'スズキ', 'ダイハツ', 'いすゞ',
    'メルセデス・ベンツ', 'BMW', 'アウディ', 'フォルクスワーゲン', 'フォード', 'その他'
  ];

  // ダイアログを開く
  const handleOpenDialog = (index = -1) => {
    if (index >= 0) {
      setCurrentVehicle({ ...vehicles[index] });
      setEditingIndex(index);
    } else {
      const newId = `vehicle_${Date.now()}`;
      setCurrentVehicle({
        id: newId,
        name: '',
        capacity: 8,
        vehicleType: 'mini_van',
        driver: '',
        driverPhone: '',
        driverEmail: '',
        equipment: [],
        speedFactor: 1.0,
        fuelType: 'gasoline',
        plateNumber: '',
        notes: '',
        status: 'available',
        year: new Date().getFullYear(),
        model: '',
        manufacturer: '',
        color: '',
        insurance: {
          company: '',
          policyNumber: '',
          expiryDate: ''
        },
        maintenance: {
          lastService: '',
          nextService: '',
          mileage: 0,
          condition: 'good'
        },
        rating: 5,
        totalTrips: 0,
        fuelEfficiency: 0,
        averageSpeed: 35,
        isActive: true
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
    setCurrentVehicle({
      id: '',
      name: '',
      capacity: 8,
      vehicleType: 'mini_van',
      driver: '',
      driverPhone: '',
      driverEmail: '',
      equipment: [],
      speedFactor: 1.0,
      fuelType: 'gasoline',
      plateNumber: '',
      notes: '',
      status: 'available',
      year: new Date().getFullYear(),
      model: '',
      manufacturer: '',
      color: '',
      insurance: {
        company: '',
        policyNumber: '',
        expiryDate: ''
      },
      maintenance: {
        lastService: '',
        nextService: '',
        mileage: 0,
        condition: 'good'
      },
      rating: 5,
      totalTrips: 0,
      fuelEfficiency: 0,
      averageSpeed: 35,
      isActive: true
    });
    setEditingIndex(-1);
    setValidationErrors({});
  };

  // バリデーション
  const validateVehicle = (vehicle) => {
    const errors = {};
    
    if (!vehicle.name.trim()) {
      errors.name = '車両名は必須です';
    }
    
    if (!vehicle.driver.trim()) {
      errors.driver = 'ドライバー名は必須です';
    }
    
    if (vehicle.capacity < 1 || vehicle.capacity > 50) {
      errors.capacity = '定員は1〜50名で入力してください';
    }
    
    if (vehicle.speedFactor < 0.5 || vehicle.speedFactor > 2.0) {
      errors.speedFactor = '速度係数は0.5〜2.0で入力してください';
    }
    
    if (vehicle.driverPhone && !/^[\d-\s\+\(\)]+$/.test(vehicle.driverPhone)) {
      errors.driverPhone = '正しい電話番号を入力してください';
    }
    
    if (vehicle.driverEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(vehicle.driverEmail)) {
      errors.driverEmail = '正しいメールアドレスを入力してください';
    }
    
    if (vehicle.plateNumber && !/^[\w\d\-\s]+$/.test(vehicle.plateNumber)) {
      errors.plateNumber = '正しいナンバープレートを入力してください';
    }
    
    return errors;
  };

  // 車両保存
  const handleSaveVehicle = () => {
    const errors = validateVehicle(currentVehicle);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    const newVehicles = [...vehicles];
    if (editingIndex >= 0) {
      newVehicles[editingIndex] = { ...currentVehicle };
    } else {
      newVehicles.push({ ...currentVehicle });
    }
    
    onVehiclesUpdate(newVehicles);
    handleCloseDialog();
  };

  // 車両削除
  const handleDeleteVehicle = (index) => {
    if (window.confirm('この車両を削除しますか？')) {
      const newVehicles = vehicles.filter((_, i) => i !== index);
      onVehiclesUpdate(newVehicles);
    }
  };

  // 入力フィールドの変更
  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setCurrentVehicle(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setCurrentVehicle(prev => ({
        ...prev,
        [field]: value
      }));
    }
    
    // エラーをクリア
    if (validationErrors[field]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  // 車両タイプ変更時に定員を自動更新
  const handleVehicleTypeChange = (value) => {
    const selectedType = vehicleTypes.find(type => type.value === value);
    setCurrentVehicle(prev => ({
      ...prev,
      vehicleType: value,
      capacity: selectedType ? selectedType.capacity : prev.capacity
    }));
  };

  // 装備のチェック変更
  const handleEquipmentChange = (equipment) => {
    setCurrentVehicle(prev => {
      const newEquipment = prev.equipment.includes(equipment)
        ? prev.equipment.filter(item => item !== equipment)
        : [...prev.equipment, equipment];
      
      return {
        ...prev,
        equipment: newEquipment
      };
    });
  };

  // 車両状態切り替え
  const handleToggleStatus = (index, newStatus) => {
    const newVehicles = [...vehicles];
    newVehicles[index] = {
      ...newVehicles[index],
      status: newStatus
    };
    onVehiclesUpdate(newVehicles);
  };

  // フィルタリング
  const getFilteredVehicles = () => {
    let filtered = [...vehicles];
    
    switch (filterBy) {
      case 'available':
        filtered = filtered.filter(vehicle => vehicle.status === 'available');
        break;
      case 'in_use':
        filtered = filtered.filter(vehicle => vehicle.status === 'in_use');
        break;
      case 'maintenance':
        filtered = filtered.filter(vehicle => vehicle.status === 'maintenance' || vehicle.status === 'out_of_service');
        break;
      case 'high_capacity':
        filtered = filtered.filter(vehicle => vehicle.capacity >= 8);
        break;
      case 'eco_friendly':
        filtered = filtered.filter(vehicle => vehicle.fuelType === 'hybrid' || vehicle.fuelType === 'electric');
        break;
      default:
        break;
    }
    
    // ソート
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'capacity':
          return b.capacity - a.capacity;
        case 'driver':
          return a.driver.localeCompare(b.driver);
        case 'status':
          return a.status.localeCompare(b.status);
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'trips':
          return (b.totalTrips || 0) - (a.totalTrips || 0);
        default:
          return 0;
      }
    });
    
    return filtered;
  };

  // 統計情報の計算
  const getStatistics = () => {
    const totalVehicles = vehicles.length;
    const availableVehicles = vehicles.filter(v => v.status === 'available').length;
    const totalCapacity = vehicles.reduce((sum, vehicle) => sum + vehicle.capacity, 0);
    const averageRating = vehicles.length > 0 
      ? vehicles.reduce((sum, vehicle) => sum + (vehicle.rating || 0), 0) / vehicles.length 
      : 0;
    const maintenanceVehicles = vehicles.filter(v => 
      v.status === 'maintenance' || v.status === 'out_of_service').length;
    const ecoFriendlyVehicles = vehicles.filter(v => 
      v.fuelType === 'hybrid' || v.fuelType === 'electric').length;
    
    return {
      totalVehicles,
      availableVehicles,
      totalCapacity,
      averageRating,
      maintenanceVehicles,
      ecoFriendlyVehicles,
      utilizationRate: totalVehicles > 0 ? Math.round((availableVehicles / totalVehicles) * 100) : 0
    };
  };

  const statistics = getStatistics();
  const filteredVehicles = getFilteredVehicles();

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <CarIcon sx={{ mr: 1 }} />
        車両管理
      </Typography>

      {/* 統計カード */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="primary">
                {statistics.totalVehicles}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                総車両数
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="success.main">
                {statistics.availableVehicles}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                利用可能
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="info.main">
                {statistics.totalCapacity}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                総定員
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                <Rating value={statistics.averageRating} readOnly precision={0.1} />
              </Box>
              <Typography variant="body2" color="text.secondary">
                平均評価
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
                車両追加
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
                  <MenuItem value="available">利用可能</MenuItem>
                  <MenuItem value="in_use">使用中</MenuItem>
                  <MenuItem value="maintenance">メンテナンス</MenuItem>
                  <MenuItem value="high_capacity">大型車両</MenuItem>
                  <MenuItem value="eco_friendly">エコカー</MenuItem>
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
                  <MenuItem value="capacity">定員順</MenuItem>
                  <MenuItem value="driver">ドライバー順</MenuItem>
                  <MenuItem value="status">状態順</MenuItem>
                  <MenuItem value="rating">評価順</MenuItem>
                  <MenuItem value="trips">使用回数順</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary">
                表示中: {filteredVehicles.length} / {vehicles.length} 台
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* 車両リスト */}
      {filteredVehicles.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <CarIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {vehicles.length === 0 ? '車両が登録されていません' : 'フィルター条件に一致する車両がありません'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {vehicles.length === 0 
                ? '新しい車両を追加してツアーサービスを開始しましょう' 
                : 'フィルター条件を変更してください'
              }
            </Typography>
            {vehicles.length === 0 && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
              >
                最初の車両を追加
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
                <TableCell>車両名</TableCell>
                <TableCell>タイプ</TableCell>
                <TableCell>ドライバー</TableCell>
                <TableCell align="center">定員</TableCell>
                <TableCell>装備</TableCell>
                <TableCell align="center">評価</TableCell>
                <TableCell align="center">詳細</TableCell>
                <TableCell align="center">操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredVehicles.map((vehicle, index) => (
                <React.Fragment key={vehicle.id}>
                  <TableRow hover>
                    <TableCell>
                      <Tooltip title={statusOptions.find(s => s.value === vehicle.status)?.label}>
                        <Chip
                          size="small"
                          label={statusOptions.find(s => s.value === vehicle.status)?.label}
                          color={statusOptions.find(s => s.value === vehicle.status)?.color}
                          variant="filled"
                        />
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ mr: 1, bgcolor: 'primary.main', width: 32, height: 32 }}>
                          {vehicleTypes.find(t => t.value === vehicle.vehicleType)?.icon || '🚗'}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {vehicle.name}
                          </Typography>
                          {vehicle.plateNumber && (
                            <Typography variant="caption" color="text.secondary">
                              {vehicle.plateNumber}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={vehicleTypes.find(t => t.value === vehicle.vehicleType)?.label || vehicle.vehicleType}
                        size="small"
                        variant="outlined"
                        icon={<span>{vehicleTypes.find(t => t.value === vehicle.vehicleType)?.icon}</span>}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <PersonIcon sx={{ mr: 1, fontSize: 18, color: 'text.secondary' }} />
                        <Box>
                          <Typography variant="body2">
                            {vehicle.driver}
                          </Typography>
                          {vehicle.driverPhone && (
                            <Typography variant="caption" color="text.secondary">
                              📞 {vehicle.driverPhone}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Chip 
                        label={`${vehicle.capacity}名`} 
                        size="small" 
                        color="primary" 
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {vehicle.equipment?.slice(0, 2).map((item, itemIndex) => (
                          <Chip
                            key={itemIndex}
                            label={item}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                        {vehicle.equipment?.length > 2 && (
                          <Chip
                            label={`+${vehicle.equipment.length - 2}`}
                            size="small"
                            variant="outlined"
                            color="info"
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Rating value={vehicle.rating || 0} readOnly size="small" />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={() => setExpandedCard(expandedCard === vehicle.id ? null : vehicle.id)}
                      >
                        {expandedCard === vehicle.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
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
                          onClick={() => handleDeleteVehicle(index)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                  
                  {/* 詳細情報の展開パネル */}
                  <TableRow>
                    <TableCell sx={{ py: 0 }} colSpan={9}>
                      <Collapse in={expandedCard === vehicle.id}>
                        <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
                          <Grid container spacing={2}>
                            <Grid item xs={12} sm={6} md={3}>
                              <Typography variant="caption" color="text.secondary">車両情報</Typography>
                              <Box>
                                <Typography variant="body2">
                                  {vehicle.manufacturer} {vehicle.model} ({vehicle.year}年)
                                </Typography>
                                <Typography variant="body2">
                                  燃料: {fuelTypes.find(f => f.value === vehicle.fuelType)?.label}
                                </Typography>
                                <Typography variant="body2">
                                  速度係数: {vehicle.speedFactor}x
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                              <Typography variant="caption" color="text.secondary">使用実績</Typography>
                              <Box>
                                <Typography variant="body2">
                                  総利用回数: {vehicle.totalTrips || 0}回
                                </Typography>
                                <Typography variant="body2">
                                  燃費: {vehicle.fuelEfficiency || 0} km/L
                                </Typography>
                                <Typography variant="body2">
                                  平均速度: {vehicle.averageSpeed || 0} km/h
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                              <Typography variant="caption" color="text.secondary">メンテナンス</Typography>
                              <Box>
                                <Typography variant="body2">
                                  走行距離: {vehicle.maintenance?.mileage || 0} km
                                </Typography>
                                <Typography variant="body2">
                                  コンディション: {conditionOptions.find(c => c.value === vehicle.maintenance?.condition)?.label}
                                </Typography>
                                {vehicle.maintenance?.nextService && (
                                  <Typography variant="body2" color="warning.main">
                                    次回点検: {vehicle.maintenance.nextService}
                                  </Typography>
                                )}
                              </Box>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                              <Typography variant="caption" color="text.secondary">連絡先</Typography>
                              <Box>
                                {vehicle.driverEmail && (
                                  <Typography variant="body2">
                                    📧 {vehicle.driverEmail}
                                  </Typography>
                                )}
                                {vehicle.insurance?.company && (
                                  <Typography variant="body2">
                                    保険: {vehicle.insurance.company}
                                  </Typography>
                                )}
                              </Box>
                            </Grid>
                            {vehicle.notes && (
                              <Grid item xs={12}>
                                <Typography variant="caption" color="text.secondary">備考</Typography>
                                <Typography variant="body2">{vehicle.notes}</Typography>
                              </Grid>
                            )}
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

      {/* 車両追加・編集ダイアログ */}
      <Dialog open={open} onClose={handleCloseDialog} maxWidth="lg" fullWidth>
        <DialogTitle>
          {editingIndex >= 0 ? '車両情報編集' : '車両追加'}
        </DialogTitle>
        <DialogContent>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} sx={{ mb: 3 }}>
            <Tab label="基本情報" icon={<CarIcon />} />
            <Tab label="ドライバー・連絡先" icon={<PersonIcon />} />
            <Tab label="メンテナンス" icon={<BuildIcon />} />
            <Tab label="保険・その他" icon={<SecurityIcon />} />
          </Tabs>

          {/* タブ1: 基本情報 */}
          {tabValue === 0 && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={8}>
                <TextField
                  fullWidth
                  label="車両名"
                  value={currentVehicle.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  error={!!validationErrors.name}
                  helperText={validationErrors.name}
                  required
                  placeholder="例: ミニバン1号車"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>状態</InputLabel>
                  <Select
                    value={currentVehicle.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    label="状態"
                  >
                    {statusOptions.map((status) => (
                      <MenuItem key={status.value} value={status.value}>
                        {status.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>車両タイプ</InputLabel>
                  <Select
                    value={currentVehicle.vehicleType}
                    onChange={(e) => handleVehicleTypeChange(e.target.value)}
                    label="車両タイプ"
                  >
                    {vehicleTypes.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.icon} {type.label} (標準定員: {type.capacity}名)
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="定員"
                  type="number"
                  value={currentVehicle.capacity}
                  onChange={(e) => handleInputChange('capacity', parseInt(e.target.value) || 1)}
                  error={!!validationErrors.capacity}
                  helperText={validationErrors.capacity}
                  inputProps={{ min: 1, max: 50 }}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <Autocomplete
                  options={manufacturers}
                  value={currentVehicle.manufacturer}
                  onChange={(event, newValue) => handleInputChange('manufacturer', newValue || '')}
                  renderInput={(params) => (
                    <TextField {...params} label="メーカー" />
                  )}
                  freeSolo
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="車種・モデル"
                  value={currentVehicle.model}
                  onChange={(e) => handleInputChange('model', e.target.value)}
                  placeholder="例: ヴォクシー、ハイエース"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="年式"
                  type="number"
                  value={currentVehicle.year}
                  onChange={(e) => handleInputChange('year', parseInt(e.target.value) || new Date().getFullYear())}
                  inputProps={{ min: 1990, max: new Date().getFullYear() + 1 }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="ナンバープレート"
                  value={currentVehicle.plateNumber}
                  onChange={(e) => handleInputChange('plateNumber', e.target.value)}
                  error={!!validationErrors.plateNumber}
                  helperText={validationErrors.plateNumber}
                  placeholder="例: 沖縄 500 あ 1234"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="車体色"
                  value={currentVehicle.color}
                  onChange={(e) => handleInputChange('color', e.target.value)}
                  placeholder="例: ホワイト、ブラック"
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>燃料タイプ</InputLabel>
                  <Select
                    value={currentVehicle.fuelType}
                    onChange={(e) => handleInputChange('fuelType', e.target.value)}
                    label="燃料タイプ"
                  >
                    {fuelTypes.map((fuel) => (
                      <MenuItem key={fuel.value} value={fuel.value}>
                        {fuel.icon} {fuel.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="速度係数"
                  type="number"
                  value={currentVehicle.speedFactor}
                  onChange={(e) => handleInputChange('speedFactor', parseFloat(e.target.value) || 1.0)}
                  error={!!validationErrors.speedFactor}
                  helperText={validationErrors.speedFactor || "1.0が標準速度"}
                  inputProps={{ min: 0.5, max: 2.0, step: 0.1 }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box>
                  <Typography variant="body2" gutterBottom>車両評価</Typography>
                  <Rating
                    value={currentVehicle.rating}
                    onChange={(event, newValue) => handleInputChange('rating', newValue)}
                  />
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  装備・設備
                </Typography>
                <Grid container spacing={1}>
                  {equipmentOptions.map((equipment) => (
                    <Grid item xs={6} sm={4} md={3} key={equipment}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={currentVehicle.equipment.includes(equipment)}
                            onChange={() => handleEquipmentChange(equipment)}
                          />
                        }
                        label={equipment}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            </Grid>
          )}

          {/* タブ2: ドライバー・連絡先 */}
          {tabValue === 1 && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="ドライバー名"
                  value={currentVehicle.driver}
                  onChange={(e) => handleInputChange('driver', e.target.value)}
                  error={!!validationErrors.driver}
                  helperText={validationErrors.driver}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="ドライバー電話番号"
                  value={currentVehicle.driverPhone}
                  onChange={(e) => handleInputChange('driverPhone', e.target.value)}
                  error={!!validationErrors.driverPhone}
                  helperText={validationErrors.driverPhone}
                  placeholder="例: 090-1234-5678"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="ドライバーメールアドレス"
                  value={currentVehicle.driverEmail}
                  onChange={(e) => handleInputChange('driverEmail', e.target.value)}
                  error={!!validationErrors.driverEmail}
                  helperText={validationErrors.driverEmail}
                  placeholder="例: driver@example.com"
                />
              </Grid>
            </Grid>
          )}

          {/* タブ3: メンテナンス */}
          {tabValue === 2 && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="走行距離 (km)"
                  type="number"
                  value={currentVehicle.maintenance?.mileage || 0}
                  onChange={(e) => handleInputChange('maintenance.mileage', parseInt(e.target.value) || 0)}
                  inputProps={{ min: 0 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>コンディション</InputLabel>
                  <Select
                    value={currentVehicle.maintenance?.condition || 'good'}
                    onChange={(e) => handleInputChange('maintenance.condition', e.target.value)}
                    label="コンディション"
                  >
                    {conditionOptions.map((condition) => (
                      <MenuItem key={condition.value} value={condition.value}>
                        {condition.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="最終点検日"
                  type="date"
                  value={currentVehicle.maintenance?.lastService || ''}
                  onChange={(e) => handleInputChange('maintenance.lastService', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="次回点検予定日"
                  type="date"
                  value={currentVehicle.maintenance?.nextService || ''}
                  onChange={(e) => handleInputChange('maintenance.nextService', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="燃費 (km/L)"
                  type="number"
                  value={currentVehicle.fuelEfficiency}
                  onChange={(e) => handleInputChange('fuelEfficiency', parseFloat(e.target.value) || 0)}
                  inputProps={{ min: 0, step: 0.1 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="総利用回数"
                  type="number"
                  value={currentVehicle.totalTrips}
                  onChange={(e) => handleInputChange('totalTrips', parseInt(e.target.value) || 0)}
                  inputProps={{ min: 0 }}
                />
              </Grid>
            </Grid>
          )}

          {/* タブ4: 保険・その他 */}
          {tabValue === 3 && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="保険会社"
                  value={currentVehicle.insurance?.company || ''}
                  onChange={(e) => handleInputChange('insurance.company', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="保険証券番号"
                  value={currentVehicle.insurance?.policyNumber || ''}
                  onChange={(e) => handleInputChange('insurance.policyNumber', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="保険期限"
                  type="date"
                  value={currentVehicle.insurance?.expiryDate || ''}
                  onChange={(e) => handleInputChange('insurance.expiryDate', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={currentVehicle.isActive}
                      onChange={(e) => handleInputChange('isActive', e.target.checked)}
                    />
                  }
                  label="車両をアクティブにする"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="備考・注意事項"
                  multiline
                  rows={4}
                  value={currentVehicle.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="車両の特徴、注意事項、メンテナンス履歴など"
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>キャンセル</Button>
          <Button onClick={handleSaveVehicle} variant="contained">
            {editingIndex >= 0 ? '更新' : '追加'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VehicleManager;