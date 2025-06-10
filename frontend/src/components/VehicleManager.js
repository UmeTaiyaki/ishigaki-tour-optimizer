// VehicleManager.js - データ永続化対応版
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Button, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, Chip, Alert, Divider, Stack, FormControl, InputLabel, 
  Select, MenuItem, Tooltip, Badge, LinearProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  DirectionsCar as CarIcon,
  Person as PersonIcon,
  Build as BuildIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  LocationOn as LocationIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Save as SaveIcon
} from '@mui/icons-material';

// ローカルストレージキー
const STORAGE_KEY = 'ishigaki_tour_vehicles';

const VehicleManager = ({ 
  vehicles = [], 
  onVehiclesUpdate, 
  tourData = {}, 
  onTourDataUpdate,
  environmentalData = null
}) => {
  const [localVehicles, setLocalVehicles] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(-1);
  const [currentVehicle, setCurrentVehicle] = useState({
    id: '',
    name: '',
    capacity: 8,
    driver: '',
    location: { lat: 24.3336, lng: 124.1543 },
    vehicle_type: 'mini_van',
    fuel_type: 'gasoline',
    license_plate: '',
    phone: '',
    status: 'available',
    equipment: [],
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // 初期化時にローカルストレージからデータを読み込み
  useEffect(() => {
    const savedVehicles = localStorage.getItem(STORAGE_KEY);
    if (savedVehicles) {
      try {
        const parsedVehicles = JSON.parse(savedVehicles);
        console.log('💾 ローカルストレージから車両データを復元:', parsedVehicles);
        setLocalVehicles(parsedVehicles);
        // 親コンポーネントにも反映
        if (onVehiclesUpdate) {
          onVehiclesUpdate(parsedVehicles);
        }
      } catch (error) {
        console.error('ローカルストレージからのデータ読み込みエラー:', error);
      }
    } else if (vehicles.length > 0) {
      // 初回読み込み時は親から受け取ったデータを使用
      setLocalVehicles(vehicles);
    }
  }, []);

  // 親コンポーネントからの更新を反映（初回のみ）
  useEffect(() => {
    if (vehicles.length > 0 && localVehicles.length === 0) {
      setLocalVehicles(vehicles);
    }
  }, [vehicles]);

  // 車両データをローカルストレージに保存
  const saveToLocalStorage = useCallback((vehicleData) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(vehicleData));
      console.log('💾 車両データをローカルストレージに保存:', vehicleData);
    } catch (error) {
      console.error('ローカルストレージへの保存エラー:', error);
    }
  }, []);

  // 車両データを更新（ローカル + 親 + ストレージ）
  const updateVehicleData = useCallback((newVehicles) => {
    console.log('🔄 車両データを更新:', newVehicles);
    setLocalVehicles(newVehicles);
    saveToLocalStorage(newVehicles);
    if (onVehiclesUpdate) {
      onVehiclesUpdate(newVehicles);
    }
  }, [onVehiclesUpdate, saveToLocalStorage]);

  // バリデーション関数
  const validateVehicle = useCallback((vehicle) => {
    const newErrors = {};
    
    if (!vehicle.name || !vehicle.name.trim()) {
      newErrors.name = '車両名は必須です';
    }
    
    if (!vehicle.capacity || vehicle.capacity < 1 || vehicle.capacity > 50) {
      newErrors.capacity = '定員は1-50名で入力してください';
    }
    
    if (!vehicle.driver || !vehicle.driver.trim()) {
      newErrors.driver = 'ドライバー名は必須です';
    }
    
    if (vehicle.phone && !/^[\d\-\+\(\)\s]+$/.test(vehicle.phone)) {
      newErrors.phone = '有効な電話番号を入力してください';
    }
    
    if (vehicle.license_plate && !/^[A-Za-z0-9\-\s]+$/.test(vehicle.license_plate)) {
      newErrors.license_plate = '有効なナンバープレートを入力してください';
    }
    
    return newErrors;
  }, []);

  // 車両追加
  const handleAddVehicle = () => {
    const newId = Date.now().toString();
    setCurrentVehicle({
      id: newId,
      name: '',
      capacity: 8,
      driver: '',
      location: { lat: 24.3336, lng: 124.1543 },
      vehicle_type: 'mini_van',
      fuel_type: 'gasoline',
      license_plate: '',
      phone: '',
      status: 'available',
      equipment: [],
      notes: ''
    });
    setEditingIndex(-1);
    setErrors({});
    setOpen(true);
  };

  // 車両編集
  const handleEditVehicle = (index) => {
    const vehicle = localVehicles[index];
    setCurrentVehicle({ ...vehicle });
    setEditingIndex(index);
    setErrors({});
    setOpen(true);
  };

  // 車両削除
  const handleDeleteVehicle = (index) => {
    if (window.confirm('この車両を削除しますか？')) {
      const newVehicles = localVehicles.filter((_, i) => i !== index);
      updateVehicleData(newVehicles);
    }
  };

  // 車両保存
  const handleSaveVehicle = async () => {
    const validationErrors = validateVehicle(currentVehicle);
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setLoading(true);
    try {
      // IDの設定
      const vehicleId = currentVehicle.id || Date.now().toString();
      
      const vehicleWithId = { 
        ...currentVehicle, 
        id: vehicleId,
        created_at: editingIndex >= 0 ? 
          (localVehicles[editingIndex]?.created_at || new Date().toISOString()) : 
          new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      let newVehicles;
      if (editingIndex >= 0) {
        // 編集の場合
        newVehicles = [...localVehicles];
        newVehicles[editingIndex] = vehicleWithId;
      } else {
        // 新規追加の場合
        newVehicles = [...localVehicles, vehicleWithId];
      }
      
      updateVehicleData(newVehicles);
      setOpen(false);
      setErrors({});
      
      console.log('✅ 車両保存完了:', vehicleWithId);
      
    } catch (error) {
      console.error('車両保存エラー:', error);
      setErrors({ general: '車両情報の保存に失敗しました' });
    } finally {
      setLoading(false);
    }
  };

  // データリフレッシュ
  const handleRefreshData = () => {
    const savedVehicles = localStorage.getItem(STORAGE_KEY);
    if (savedVehicles) {
      try {
        const parsedVehicles = JSON.parse(savedVehicles);
        setLocalVehicles(parsedVehicles);
        if (onVehiclesUpdate) {
          onVehiclesUpdate(parsedVehicles);
        }
        console.log('🔄 データをリフレッシュしました');
      } catch (error) {
        console.error('データリフレッシュエラー:', error);
      }
    }
  };

  // ステータス表示用関数
  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'success';
      case 'in_use': return 'warning';
      case 'maintenance': return 'error';
      case 'out_of_service': return 'default';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'available': return <CheckCircleIcon />;
      case 'in_use': return <WarningIcon />;
      case 'maintenance': return <BuildIcon />;
      case 'out_of_service': return <ErrorIcon />;
      default: return <CheckCircleIcon />;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'available': return '利用可能';
      case 'in_use': return '使用中';
      case 'maintenance': return 'メンテナンス';
      case 'out_of_service': return '整備中';
      default: return '不明';
    }
  };

  // 統計計算
  const totalCapacity = localVehicles.reduce((sum, vehicle) => sum + (vehicle.capacity || 0), 0);
  const availableVehicles = localVehicles.filter(v => v.status === 'available').length;

  // オプション定義
  const vehicleTypeOptions = [
    { value: 'mini_van', label: 'ミニバン' },
    { value: 'sedan', label: 'セダン' },
    { value: 'suv', label: 'SUV' },
    { value: 'bus', label: 'バス' }
  ];

  const fuelTypeOptions = [
    { value: 'gasoline', label: 'ガソリン' },
    { value: 'diesel', label: 'ディーゼル' },
    { value: 'hybrid', label: 'ハイブリッド' },
    { value: 'electric', label: '電気' }
  ];

  const statusOptions = [
    { value: 'available', label: '利用可能' },
    { value: 'in_use', label: '使用中' },
    { value: 'maintenance', label: 'メンテナンス' },
    { value: 'out_of_service', label: '整備中' }
  ];

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
              <Typography variant="h4" color="primary">{localVehicles.length}</Typography>
              <Typography variant="body2" color="text.secondary">総車両数</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary">{totalCapacity}名</Typography>
              <Typography variant="body2" color="text.secondary">総定員</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success.main">{availableVehicles}</Typography>
              <Typography variant="body2" color="text.secondary">利用可能車両</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary">
                {localVehicles.length > 0 ? Math.round(totalCapacity / localVehicles.length) : 0}名
              </Typography>
              <Typography variant="body2" color="text.secondary">平均定員</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* コントロールボタン */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddVehicle}
        >
          車両追加
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
          最終更新: {localVehicles.length > 0 ? new Date().toLocaleTimeString() : '未更新'}
        </Typography>
      </Box>

      {/* 車両一覧 */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            車両一覧
          </Typography>
          
          {localVehicles.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CarIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                車両が登録されていません
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                「車両追加」ボタンから最初の車両を登録してください
              </Typography>
              <Button 
                variant="contained" 
                startIcon={<AddIcon />} 
                onClick={handleAddVehicle}
                sx={{ mt: 2 }}
              >
                最初の車両を追加
              </Button>
            </Box>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>車両名</TableCell>
                    <TableCell>ドライバー</TableCell>
                    <TableCell align="center">定員</TableCell>
                    <TableCell>ステータス</TableCell>
                    <TableCell>車種</TableCell>
                    <TableCell>連絡先</TableCell>
                    <TableCell align="center">操作</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {localVehicles.map((vehicle, index) => (
                    <TableRow key={vehicle.id || index}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <CarIcon sx={{ mr: 1, color: 'primary.main' }} />
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {vehicle.name}
                            </Typography>
                            {vehicle.license_plate && (
                              <Typography variant="caption" color="text.secondary">
                                {vehicle.license_plate}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <PersonIcon sx={{ mr: 1, fontSize: 16 }} />
                          {vehicle.driver}
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
                        <Chip
                          icon={getStatusIcon(vehicle.status)}
                          label={getStatusLabel(vehicle.status)}
                          color={getStatusColor(vehicle.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {vehicleTypeOptions.find(opt => opt.value === vehicle.vehicle_type)?.label || vehicle.vehicle_type}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {fuelTypeOptions.find(opt => opt.value === vehicle.fuel_type)?.label || vehicle.fuel_type}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {vehicle.phone && (
                          <Typography variant="caption">{vehicle.phone}</Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={1}>
                          <Tooltip title="編集">
                            <IconButton
                              size="small"
                              onClick={() => handleEditVehicle(index)}
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
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* 車両追加・編集ダイアログ */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <CarIcon sx={{ mr: 1 }} />
            {editingIndex >= 0 ? '車両情報編集' : '車両追加'}
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
                label="車両名 *"
                value={currentVehicle.name}
                onChange={(e) => setCurrentVehicle(prev => ({ ...prev, name: e.target.value }))}
                error={!!errors.name}
                placeholder="例: 石垣号1"
              />
              <ErrorDisplay field="name" />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="定員 *"
                type="number"
                inputProps={{ min: 1, max: 50 }}
                value={currentVehicle.capacity}
                onChange={(e) => setCurrentVehicle(prev => ({ ...prev, capacity: parseInt(e.target.value) || 1 }))}
                error={!!errors.capacity}
              />
              <ErrorDisplay field="capacity" />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="ドライバー名 *"
                value={currentVehicle.driver}
                onChange={(e) => setCurrentVehicle(prev => ({ ...prev, driver: e.target.value }))}
                error={!!errors.driver}
                placeholder="例: 田中太郎"
              />
              <ErrorDisplay field="driver" />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="電話番号"
                value={currentVehicle.phone}
                onChange={(e) => setCurrentVehicle(prev => ({ ...prev, phone: e.target.value }))}
                error={!!errors.phone}
                placeholder="090-1234-5678"
              />
              <ErrorDisplay field="phone" />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>車種</InputLabel>
                <Select
                  value={currentVehicle.vehicle_type}
                  onChange={(e) => setCurrentVehicle(prev => ({ ...prev, vehicle_type: e.target.value }))}
                  label="車種"
                >
                  {vehicleTypeOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>燃料タイプ</InputLabel>
                <Select
                  value={currentVehicle.fuel_type}
                  onChange={(e) => setCurrentVehicle(prev => ({ ...prev, fuel_type: e.target.value }))}
                  label="燃料タイプ"
                >
                  {fuelTypeOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>ステータス</InputLabel>
                <Select
                  value={currentVehicle.status}
                  onChange={(e) => setCurrentVehicle(prev => ({ ...prev, status: e.target.value }))}
                  label="ステータス"
                >
                  {statusOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="ナンバープレート"
                value={currentVehicle.license_plate}
                onChange={(e) => setCurrentVehicle(prev => ({ ...prev, license_plate: e.target.value }))}
                error={!!errors.license_plate}
                placeholder="例: 沖縄123あ4567"
              />
              <ErrorDisplay field="license_plate" />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="備考"
                multiline
                rows={3}
                value={currentVehicle.notes}
                onChange={(e) => setCurrentVehicle(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="メンテナンス情報や特記事項があれば記入してください"
              />
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setOpen(false)}>
            キャンセル
          </Button>
          <Button
            onClick={handleSaveVehicle}
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

export default VehicleManager;