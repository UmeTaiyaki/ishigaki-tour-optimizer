import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  IconButton,
  TextField,
  Chip,
  Grid,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';

const VehicleManager = ({ vehicles, onUpdate }) => {
  const [editingId, setEditingId] = useState(null);
  const [editingVehicle, setEditingVehicle] = useState(null);

  const vehicleColors = ['#1a73e8', '#34a853', '#ea4335', '#fbbc04', '#673ab7'];

  const handleEdit = (vehicle) => {
    setEditingId(vehicle.id);
    setEditingVehicle({ ...vehicle });
  };

  const handleSave = () => {
    const updatedVehicles = vehicles.map((v) =>
      v.id === editingId ? editingVehicle : v
    );
    onUpdate(updatedVehicles);
    setEditingId(null);
    setEditingVehicle(null);
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditingVehicle(null);
  };

  const handleDelete = (id) => {
    if (vehicles.length > 1) {
      const updatedVehicles = vehicles.filter((v) => v.id !== id);
      onUpdate(updatedVehicles);
    }
  };

  const handleAdd = () => {
    const newVehicle = {
      id: Math.max(...vehicles.map((v) => v.id), 0) + 1,
      name: `車両${vehicles.length + 1}`,
      capacity: 7,
      driver: '',
      color: vehicleColors[vehicles.length % vehicleColors.length],
    };
    onUpdate([...vehicles, newVehicle]);
  };

  const handleChange = (field) => (event) => {
    setEditingVehicle({ 
      ...editingVehicle, 
      [field]: field === 'capacity' ? parseInt(event.target.value) || 0 : event.target.value 
    });
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        🚗 車両管理
      </Typography>

      {vehicles.map((vehicle, index) => (
        <Card key={vehicle.id} sx={{ mb: 1.5 }}>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            {editingId === vehicle.id ? (
              <Box>
                <TextField
                  fullWidth
                  size="small"
                  label="車両名"
                  value={editingVehicle.name}
                  onChange={handleChange('name')}
                  sx={{ mb: 1 }}
                />
                <TextField
                  fullWidth
                  size="small"
                  label="運転手"
                  value={editingVehicle.driver}
                  onChange={handleChange('driver')}
                  sx={{ mb: 1 }}
                />
                <TextField
                  fullWidth
                  size="small"
                  label="乗車可能人数"
                  type="number"
                  value={editingVehicle.capacity}
                  onChange={handleChange('capacity')}
                  sx={{ mb: 1 }}
                  inputProps={{ min: 1, max: 20 }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                  <IconButton size="small" onClick={handleSave} color="primary">
                    <SaveIcon />
                  </IconButton>
                  <IconButton size="small" onClick={handleCancel}>
                    <CancelIcon />
                  </IconButton>
                </Box>
              </Box>
            ) : (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DirectionsCarIcon sx={{ color: vehicle.color }} />
                    <Typography variant="subtitle2" fontWeight="bold">
                      {vehicle.name}
                    </Typography>
                  </Box>
                  <Chip 
                    label={`定員: ${vehicle.capacity}名`} 
                    size="small" 
                    sx={{ backgroundColor: vehicle.color, color: 'white' }} 
                  />
                </Box>
                {vehicle.driver && (
                  <Typography variant="body2" color="text.secondary">
                    運転手: {vehicle.driver}
                  </Typography>
                )}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                  <IconButton size="small" onClick={() => handleEdit(vehicle)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    onClick={() => handleDelete(vehicle.id)} 
                    color="error"
                    disabled={vehicles.length === 1}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>
      ))}

      <Button 
        fullWidth 
        variant="outlined" 
        onClick={handleAdd} 
        sx={{ mt: 2 }}
        disabled={vehicles.length >= 5}
      >
        + 車両を追加
      </Button>
    </Box>
  );
};

export default VehicleManager;