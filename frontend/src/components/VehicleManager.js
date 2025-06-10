import React, { useState } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, TextField,
  Button, IconButton, FormControl, InputLabel, Select, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  Stack, Alert, Tooltip, FormControlLabel, Checkbox
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  DirectionsCar as CarIcon,
  Person as PersonIcon,
  Speed as SpeedIcon,
  Build as BuildIcon
} from '@mui/icons-material';

const VehicleManager = ({ vehicles, onVehiclesUpdate }) => {
  const [open, setOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(-1);
  const [currentVehicle, setCurrentVehicle] = useState({
    id: '',
    name: '',
    capacity: 8,
    vehicleType: 'mini_van',
    driver: '',
    equipment: [],
    speedFactor: 1.0,
    fuelType: 'gasoline',
    plateNumber: '',
    notes: ''
  });

  // 車両タイプの選択肢
  const vehicleTypes = [
    { value: 'mini_van', label: 'ミニバン', capacity: 8 },
    { value: 'sedan', label: 'セダン', capacity: 4 },
    { value: 'wagon', label: 'ワゴン', capacity: 6 },
    { value: 'suv', label: 'SUV', capacity: 7 },
    { value: 'bus', label: 'マイクロバス', capacity: 20 },
    { value: 'other', label: 'その他', capacity: 8 }
  ];

  // 装備オプション
  const equipmentOptions = [
    'チャイルドシート',
    'ベビーシート',
    '車椅子対応',
    'Wi-Fi',
    'USB充電器',
    'クーラーボックス',
    'シュノーケル用品',
    'タオル',
    '日除けパラソル',
    '防水バッグ'
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
        equipment: [],
        speedFactor: 1.0,
        fuelType: 'gasoline',
        plateNumber: '',
        notes: ''
      });
      setEditingIndex(-1);
    }
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
      equipment: [],
      speedFactor: 1.0,
      fuelType: 'gasoline',
      plateNumber: '',
      notes: ''
    });
    setEditingIndex(-1);
  };

  // 車両保存
  const handleSaveVehicle = () => {
    // バリデーション
    if (!currentVehicle.name.trim()) {
      alert('車両名を入力してください');
      return;
    }
    if (!currentVehicle.driver.trim()) {
      alert('ドライバー名を入力してください');
      return;
    }
    if (currentVehicle.capacity < 1) {
      alert('定員は1以上で入力してください');
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
    setCurrentVehicle(prev => ({
      ...prev,
      [field]: value
    }));
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

  // 総定員計算
  const totalCapacity = vehicles.reduce((sum, vehicle) => sum + vehicle.capacity, 0);

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center' }}>
          <CarIcon sx={{ mr: 1 }} />
          車両管理
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ ml: 'auto' }}
        >
          車両追加
        </Button>
      </Box>

      {/* サマリーカード */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <CarIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4">{vehicles.length}</Typography>
              <Typography variant="body2" color="text.secondary">
                登録車両
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <PersonIcon color="secondary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4">{totalCapacity}</Typography>
              <Typography variant="body2" color="text.secondary">
                総定員
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <SpeedIcon color="info" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4">
                {vehicles.length > 0 ? 
                  (vehicles.reduce((sum, v) => sum + v.speedFactor, 0) / vehicles.length).toFixed(1) : 
                  '0'
                }
              </Typography>
              <Typography variant="body2" color="text.secondary">
                平均速度係数
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <BuildIcon color="warning" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4">
                {vehicles.reduce((sum, v) => sum + v.equipment.length, 0)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                総装備数
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 車両リスト */}
      {vehicles.length === 0 ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          車両が登録されていません。「車両追加」ボタンから車両を追加してください。
        </Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>車両名</TableCell>
                <TableCell>タイプ</TableCell>
                <TableCell>ドライバー</TableCell>
                <TableCell align="center">定員</TableCell>
                <TableCell>装備</TableCell>
                <TableCell align="center">速度係数</TableCell>
                <TableCell align="center">操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {vehicles.map((vehicle, index) => (
                <TableRow key={vehicle.id || index} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CarIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      {vehicle.name}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={vehicleTypes.find(t => t.value === vehicle.vehicleType)?.label || vehicle.vehicleType}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      {vehicle.driver}
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={`${vehicle.capacity}名`}
                      size="small"
                      color="primary"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {vehicle.equipment.slice(0, 2).map((item, itemIndex) => (
                        <Chip
                          key={itemIndex}
                          label={item}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                      {vehicle.equipment.length > 2 && (
                        <Chip
                          label={`+${vehicle.equipment.length - 2}`}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={vehicle.speedFactor}
                      size="small"
                      color={vehicle.speedFactor > 1 ? 'success' : vehicle.speedFactor < 1 ? 'warning' : 'default'}
                    />
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
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* 車両追加・編集ダイアログ */}
      <Dialog open={open} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingIndex >= 0 ? '車両情報編集' : '車両追加'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* 基本情報 */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="車両名"
                value={currentVehicle.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
                placeholder="例: レンタカー1号車"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="ドライバー名"
                value={currentVehicle.driver}
                onChange={(e) => handleInputChange('driver', e.target.value)}
                required
              />
            </Grid>

            {/* 車両タイプと定員 */}
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
                      {type.label} (標準定員: {type.capacity}名)
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
                inputProps={{ min: 1, max: 50 }}
                required
              />
            </Grid>

            {/* 速度係数 */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="速度係数"
                type="number"
                value={currentVehicle.speedFactor}
                onChange={(e) => handleInputChange('speedFactor', parseFloat(e.target.value) || 1.0)}
                inputProps={{ min: 0.5, max: 2.0, step: 0.1 }}
                helperText="1.0が標準速度、1.2で20%高速、0.8で20%低速"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="ナンバープレート（任意）"
                value={currentVehicle.plateNumber}
                onChange={(e) => handleInputChange('plateNumber', e.target.value)}
              />
            </Grid>

            {/* 装備選択 */}
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

            {/* 備考 */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="備考・注意事項"
                multiline
                rows={2}
                value={currentVehicle.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="車両の特徴、注意事項など"
              />
            </Grid>
          </Grid>
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