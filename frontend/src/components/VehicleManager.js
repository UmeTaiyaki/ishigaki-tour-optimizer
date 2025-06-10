// src/components/VehicleManager.js - 簡易版

import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Button, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, Chip, FormControl, InputLabel, Select, MenuItem,
  Stack, Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  DirectionsCar as CarIcon,
  Person as PersonIcon,
  LocalGasStation as FuelIcon,
  Build as BuildIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon
} from '@mui/icons-material';

const VehicleManager = ({ vehicles = [], onVehiclesUpdate }) => {
  const [localVehicles, setLocalVehicles] = useState(vehicles);
  const [open, setOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(-1);
  const [currentVehicle, setCurrentVehicle] = useState({
    id: '',
    name: '',
    capacity: 8,
    vehicleType: 'mini_van',
    driver: '',
    status: 'available',
    fuelType: 'gasoline',
    licensePlate: '',
    equipment: []
  });

  useEffect(() => {
    setLocalVehicles(vehicles);
  }, [vehicles]);

  const handleAddVehicle = () => {
    setCurrentVehicle({
      id: `v${localVehicles.length + 1}`,
      name: '',
      capacity: 8,
      vehicleType: 'mini_van',
      driver: '',
      status: 'available',
      fuelType: 'gasoline',
      licensePlate: '',
      equipment: []
    });
    setEditingIndex(-1);
    setOpen(true);
  };

  const handleEditVehicle = (index) => {
    setCurrentVehicle({ ...localVehicles[index] });
    setEditingIndex(index);
    setOpen(true);
  };

  const handleDeleteVehicle = (index) => {
    const newVehicles = localVehicles.filter((_, i) => i !== index);
    setLocalVehicles(newVehicles);
    onVehiclesUpdate?.(newVehicles);
  };

  const handleSaveVehicle = () => {
    let newVehicles;
    
    if (editingIndex >= 0) {
      newVehicles = [...localVehicles];
      newVehicles[editingIndex] = { ...currentVehicle };
    } else {
      newVehicles = [...localVehicles, { ...currentVehicle }];
    }
    
    setLocalVehicles(newVehicles);
    onVehiclesUpdate?.(newVehicles);
    setOpen(false);
  };

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

  const totalCapacity = localVehicles.reduce((sum, vehicle) => sum + vehicle.capacity, 0);
  const availableVehicles = localVehicles.filter(v => v.status === 'available').length;

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

  return (
    <Box sx={{ p: 2 }}>
      {/* ヘッダー */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center' }}>
          <CarIcon sx={{ mr: 1 }} />
          車両管理
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddVehicle}
        >
          車両追加
        </Button>
      </Box>

      {/* 統計カード */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <CarIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h6">{localVehicles.length}</Typography>
              <Typography variant="body2" color="text.secondary">
                総車両数
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <CheckCircleIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h6">{availableVehicles}</Typography>
              <Typography variant="body2" color="text.secondary">
                利用可能車両
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <PersonIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
              <Typography variant="h6">{totalCapacity}</Typography>
              <Typography variant="body2" color="text.secondary">
                総収容人数
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <BuildIcon sx={{ fontSize: 40, color: 'error.main', mb: 1 }} />
              <Typography variant="h6">
                {localVehicles.filter(v => v.status === 'maintenance' || v.status === 'out_of_service').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                メンテナンス中
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 車両リスト */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            車両リスト
          </Typography>
          
          {localVehicles.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CarIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                車両が登録されていません
              </Typography>
              <Typography variant="body2" color="text.secondary">
                「車両追加」ボタンから新しい車両を登録してください
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>車両名</TableCell>
                    <TableCell>タイプ</TableCell>
                    <TableCell align="center">収容人数</TableCell>
                    <TableCell>ドライバー</TableCell>
                    <TableCell>ナンバープレート</TableCell>
                    <TableCell align="center">ステータス</TableCell>
                    <TableCell align="center">アクション</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {localVehicles.map((vehicle, index) => (
                    <TableRow key={index} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <CarIcon sx={{ mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2" fontWeight="bold">
                            {vehicle.name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {vehicleTypeOptions.find(opt => opt.value === vehicle.vehicleType)?.label || vehicle.vehicleType}
                        </Typography>
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
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <PersonIcon sx={{ mr: 1, fontSize: 18, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            {vehicle.driver || '-'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace">
                          {vehicle.licensePlate || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          icon={getStatusIcon(vehicle.status)}
                          label={getStatusLabel(vehicle.status)}
                          size="small"
                          color={getStatusColor(vehicle.status)}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={1}>
                          <IconButton
                            size="small"
                            onClick={() => handleEditVehicle(index)}
                            color="primary"
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteVehicle(index)}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
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

      {/* 車両追加/編集ダイアログ */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingIndex >= 0 ? '車両情報編集' : '車両追加'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="車両名"
                value={currentVehicle.name}
                onChange={(e) => setCurrentVehicle(prev => ({ ...prev, name: e.target.value }))}
                required
                placeholder="例: 石垣号"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>車両タイプ</InputLabel>
                <Select
                  value={currentVehicle.vehicleType}
                  onChange={(e) => setCurrentVehicle(prev => ({ ...prev, vehicleType: e.target.value }))}
                  label="車両タイプ"
                >
                  {vehicleTypeOptions.map((option) => (
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
                label="収容人数"
                type="number"
                value={currentVehicle.capacity}
                onChange={(e) => setCurrentVehicle(prev => ({ 
                  ...prev, 
                  capacity: parseInt(e.target.value) || 8 
                }))}
                inputProps={{ min: 1, max: 50 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="ドライバー名"
                value={currentVehicle.driver}
                onChange={(e) => setCurrentVehicle(prev => ({ ...prev, driver: e.target.value }))}
                placeholder="例: 山田太郎"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="ナンバープレート"
                value={currentVehicle.licensePlate}
                onChange={(e) => setCurrentVehicle(prev => ({ ...prev, licensePlate: e.target.value }))}
                placeholder="例: 沖縄 123 あ 1234"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>燃料タイプ</InputLabel>
                <Select
                  value={currentVehicle.fuelType}
                  onChange={(e) => setCurrentVehicle(prev => ({ ...prev, fuelType: e.target.value }))}
                  label="燃料タイプ"
                >
                  {fuelTypeOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>ステータス</InputLabel>
                <Select
                  value={currentVehicle.status}
                  onChange={(e) => setCurrentVehicle(prev => ({ ...prev, status: e.target.value }))}
                  label="ステータス"
                >
                  {statusOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
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
            disabled={!currentVehicle.name}
          >
            {editingIndex >= 0 ? '更新' : '追加'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VehicleManager;