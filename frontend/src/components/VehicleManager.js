import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Card,
  CardContent,
  IconButton,
  Grid,
  Tooltip,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControlLabel,
  Switch,
  Slider
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  DirectionsCar as CarIcon,
  Person as PersonIcon,
  Speed as SpeedIcon,
  Build as EquipmentIcon,
  ExpandMore as ExpandMoreIcon,
  LocalShipping as TruckIcon,
  DriveEta as VanIcon,
  DirectionsRun as MiniIcon
} from '@mui/icons-material';
import { getVehicleOptimizationSuggestions } from '../services/api';

const VehicleManager = ({ vehicles, onUpdate, ishigakiMode = false }) => {
  const [open, setOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [suggestions, setSuggestions] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    capacity: 8,
    driver: '',
    vehicleType: 'mini_van',
    equipment: [],
    speedFactor: 1.0,
    fuelEfficiency: 10.0,
    color: '#1a73e8'
  });

  // 石垣島の車両タイプ定義
  const ishigakiVehicleTypes = {
    'mini_van': {
      label: 'ミニバン',
      icon: <VanIcon />,
      description: '7-10名乗り、最も一般的',
      defaultCapacity: 8,
      speedFactor: 1.0
    },
    'bus': {
      label: 'マイクロバス',
      icon: <TruckIcon />,
      description: '15-25名乗り、大グループ向け',
      defaultCapacity: 20,
      speedFactor: 0.9
    },
    'luxury_car': {
      label: '高級車',
      icon: <CarIcon />,
      description: '4-6名乗り、VIP送迎',
      defaultCapacity: 4,
      speedFactor: 1.2
    },
    'compact': {
      label: '軽自動車',
      icon: <MiniIcon />,
      description: '2-4名乗り、少人数対応',
      defaultCapacity: 4,
      speedFactor: 1.1
    }
  };

  // 石垣島の標準装備品
  const ishigakiEquipment = [
    'シュノーケル用具',
    'フィン・マスク',
    'ライフジャケット',
    'タオル',
    'ドリンク',
    'パラソル',
    'クーラーボックス',
    '応急処置セット',
    'フローティングマット',
    'ウェットスーツ',
    'シャワー設備',
    '更衣室'
  ];

  // 車両色のプリセット
  const colorPresets = [
    '#1a73e8', '#34a853', '#ea4335', '#fbbc04', 
    '#673ab7', '#ff6d00', '#00acc1', '#ab47bc'
  ];

  useEffect(() => {
    if (ishigakiMode && vehicles.length > 0) {
      loadOptimizationSuggestions();
    }
  }, [vehicles.length, ishigakiMode]);

  const loadOptimizationSuggestions = async () => {
    try {
      const suggestions = await getVehicleOptimizationSuggestions(vehicles.length);
      setSuggestions(suggestions);
    } catch (error) {
      console.warn('車両最適化提案の取得に失敗:', error);
    }
  };

  const handleAdd = () => {
    setEditingVehicle(null);
    setFormData({
      name: '',
      capacity: 8,
      driver: '',
      vehicleType: 'mini_van',
      equipment: [],
      speedFactor: 1.0,
      fuelEfficiency: 10.0,
      color: colorPresets[vehicles.length % colorPresets.length]
    });
    setOpen(true);
  };

  const handleEdit = (vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      name: vehicle.name,
      capacity: vehicle.capacity,
      driver: vehicle.driver,
      vehicleType: vehicle.vehicleType || 'mini_van',
      equipment: vehicle.equipment || [],
      speedFactor: vehicle.speedFactor || 1.0,
      fuelEfficiency: vehicle.fuelEfficiency || 10.0,
      color: vehicle.color || '#1a73e8'
    });
    setOpen(true);
  };

  const handleSave = () => {
    const vehicleData = {
      ...formData,
      id: editingVehicle ? editingVehicle.id : `vehicle_${Date.now()}`,
    };

    if (editingVehicle) {
      const updatedVehicles = vehicles.map(v => 
        v.id === editingVehicle.id ? vehicleData : v
      );
      onUpdate(updatedVehicles);
    } else {
      onUpdate([...vehicles, vehicleData]);
    }

    setOpen(false);
    if (ishigakiMode) {
      loadOptimizationSuggestions();
    }
  };

  const handleDelete = (vehicleId) => {
    const updatedVehicles = vehicles.filter(v => v.id !== vehicleId);
    onUpdate(updatedVehicles);
    if (ishigakiMode) {
      loadOptimizationSuggestions();
    }
  };

  const handleVehicleTypeChange = (type) => {
    const typeConfig = ishigakiVehicleTypes[type];
    setFormData({
      ...formData,
      vehicleType: type,
      capacity: typeConfig.defaultCapacity,
      speedFactor: typeConfig.speedFactor
    });
  };

  const handleEquipmentToggle = (equipment) => {
    const currentEquipment = formData.equipment;
    const newEquipment = currentEquipment.includes(equipment)
      ? currentEquipment.filter(e => e !== equipment)
      : [...currentEquipment, equipment];
    
    setFormData({ ...formData, equipment: newEquipment });
  };

  const getVehicleIcon = (type) => {
    return ishigakiVehicleTypes[type]?.icon || <CarIcon />;
  };

  const getTotalCapacity = () => {
    return vehicles.reduce((total, vehicle) => total + vehicle.capacity, 0);
  };

  const getAverageSpeedFactor = () => {
    if (vehicles.length === 0) return 1.0;
    const total = vehicles.reduce((sum, vehicle) => sum + (vehicle.speedFactor || 1.0), 0);
    return (total / vehicles.length).toFixed(2);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          🚗 車両管理 {ishigakiMode && '(石垣島仕様)'}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAdd}
          size="small"
        >
          車両追加
        </Button>
      </Box>

      {/* 統計情報 */}
      <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
        <Grid container spacing={2}>
          <Grid item xs={4}>
            <Typography variant="caption" color="text.secondary">
              総車両数
            </Typography>
            <Typography variant="h6">{vehicles.length}台</Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="caption" color="text.secondary">
              総定員
            </Typography>
            <Typography variant="h6">{getTotalCapacity()}名</Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="caption" color="text.secondary">
              平均速度係数
            </Typography>
            <Typography variant="h6">{getAverageSpeedFactor()}</Typography>
          </Grid>
        </Grid>
      </Box>

      {/* 最適化提案 */}
      {ishigakiMode && suggestions && (
        <Accordion sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle2">
              🎯 石垣島車両最適化提案
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box>
              {suggestions.recommendations.map((rec, index) => (
                <Typography key={index} variant="body2" sx={{ mb: 1 }}>
                  • {rec}
                </Typography>
              ))}
              {suggestions.ishigaki_specific && suggestions.ishigaki_specific.length > 0 && (
                <Box sx={{ mt: 2, p: 1, bgcolor: 'info.light', borderRadius: 1 }}>
                  <Typography variant="caption" color="info.dark" display="block">
                    石垣島特有の推奨事項:
                  </Typography>
                  {suggestions.ishigaki_specific.map((rec, index) => (
                    <Typography key={index} variant="body2" color="info.dark">
                      • {rec}
                    </Typography>
                  ))}
                </Box>
              )}
            </Box>
          </AccordionDetails>
        </Accordion>
      )}

      {/* 車両リスト */}
      <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
        {vehicles.map((vehicle) => (
          <Card key={vehicle.id} sx={{ mb: 1, border: `2px solid ${vehicle.color}` }}>
            <CardContent sx={{ py: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {getVehicleIcon(vehicle.vehicleType)}
                  <Box>
                    <Typography variant="subtitle2">
                      {vehicle.name}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip
                        size="small"
                        icon={<PersonIcon />}
                        label={`${vehicle.capacity}名`}
                        variant="outlined"
                      />
                      <Chip
                        size="small"
                        label={vehicle.driver}
                        variant="outlined"
                      />
                      {ishigakiMode && (
                        <Chip
                          size="small"
                          icon={<SpeedIcon />}
                          label={`${vehicle.speedFactor || 1.0}x`}
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </Box>
                </Box>
                <Box>
                  <IconButton size="small" onClick={() => handleEdit(vehicle)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    onClick={() => handleDelete(vehicle.id)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </Box>
              
              {/* 装備品表示 */}
              {vehicle.equipment && vehicle.equipment.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    装備:
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                    {vehicle.equipment.slice(0, 3).map((eq, index) => (
                      <Chip
                        key={index}
                        size="small"
                        label={eq}
                        variant="outlined"
                        sx={{ fontSize: '0.7rem', height: 20 }}
                      />
                    ))}
                    {vehicle.equipment.length > 3 && (
                      <Chip
                        size="small"
                        label={`+${vehicle.equipment.length - 3}`}
                        variant="outlined"
                        sx={{ fontSize: '0.7rem', height: 20 }}
                      />
                    )}
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        ))}
      </Box>

      {vehicles.length === 0 && (
        <Alert severity="info" sx={{ mt: 2 }}>
          車両を追加してください。石垣島では複数車両での効率的な運用が重要です。
        </Alert>
      )}

      {/* 車両追加・編集ダイアログ */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingVehicle ? '車両編集' : '車両追加'} 
          {ishigakiMode && ' - 石垣島仕様'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            
            {/* 基本情報 */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="車両名"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="例: ハイエース号"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="運転手名"
                value={formData.driver}
                onChange={(e) => setFormData({ ...formData, driver: e.target.value })}
                placeholder="例: 石垣太郎"
              />
            </Grid>

            {/* 車両タイプ */}
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>車両タイプ</InputLabel>
                <Select
                  value={formData.vehicleType}
                  onChange={(e) => handleVehicleTypeChange(e.target.value)}
                  label="車両タイプ"
                >
                  {Object.entries(ishigakiVehicleTypes).map(([key, type]) => (
                    <MenuItem key={key} value={key}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {type.icon}
                        <Box>
                          <Typography variant="body2">{type.label}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {type.description}
                          </Typography>
                        </Box>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* 容量 */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="定員"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                inputProps={{ min: 1, max: 30 }}
              />
            </Grid>

            {/* 車両色選択 */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                車両色
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {colorPresets.map((color) => (
                  <Box
                    key={color}
                    onClick={() => setFormData({ ...formData, color })}
                    sx={{
                      width: 32,
                      height: 32,
                      backgroundColor: color,
                      borderRadius: 1,
                      cursor: 'pointer',
                      border: formData.color === color ? 3 : 1,
                      borderColor: formData.color === color ? 'primary.main' : 'grey.300'
                    }}
                  />
                ))}
              </Box>
            </Grid>

            {/* 詳細設定 */}
            {ishigakiMode && (
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={showAdvanced}
                      onChange={(e) => setShowAdvanced(e.target.checked)}
                    />
                  }
                  label="詳細設定"
                />
              </Grid>
            )}

            {ishigakiMode && showAdvanced && (
              <>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    速度係数: {formData.speedFactor}
                  </Typography>
                  <Slider
                    value={formData.speedFactor}
                    onChange={(e, value) => setFormData({ ...formData, speedFactor: value })}
                    min={0.5}
                    max={1.5}
                    step={0.1}
                    marks={[
                      { value: 0.5, label: '0.5x' },
                      { value: 1.0, label: '1.0x' },
                      { value: 1.5, label: '1.5x' }
                    ]}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="燃費 (km/L)"
                    value={formData.fuelEfficiency}
                    onChange={(e) => setFormData({ ...formData, fuelEfficiency: parseFloat(e.target.value) })}
                    inputProps={{ min: 1, max: 30, step: 0.1 }}
                  />
                </Grid>
              </>
            )}

            {/* 装備品選択 */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                <EquipmentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                装備品 (石垣島標準装備)
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                {ishigakiEquipment.map((equipment) => (
                  <Chip
                    key={equipment}
                    label={equipment}
                    onClick={() => handleEquipmentToggle(equipment)}
                    color={formData.equipment.includes(equipment) ? 'primary' : 'default'}
                    variant={formData.equipment.includes(equipment) ? 'filled' : 'outlined'}
                    size="small"
                    sx={{ mb: 0.5 }}
                  />
                ))}
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setOpen(false)}>
            キャンセル
          </Button>
          <Button 
            onClick={handleSave} 
            variant="contained"
            disabled={!formData.name || !formData.driver}
          >
            {editingVehicle ? '更新' : '追加'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VehicleManager;