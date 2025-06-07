import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  IconButton,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Grid,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';

const GuestList = ({ guests, onUpdate }) => {
  const [editingId, setEditingId] = useState(null);
  const [editingGuest, setEditingGuest] = useState(null);

  const hotels = [
    'ANAインターコンチネンタル',
    'フサキビーチリゾート',
    'グランヴィリオリゾート',
    'アートホテル石垣島',
    '南の美ら花ホテルミヤヒラ',
  ];

  const handleEdit = (guest) => {
    setEditingId(guest.id);
    setEditingGuest({ ...guest });
  };

  const handleSave = () => {
    const updatedGuests = guests.map((g) =>
      g.id === editingId ? editingGuest : g
    );
    onUpdate(updatedGuests);
    setEditingId(null);
    setEditingGuest(null);
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditingGuest(null);
  };

  const handleDelete = (id) => {
    const updatedGuests = guests.filter((g) => g.id !== id);
    onUpdate(updatedGuests);
  };

  const handleAdd = () => {
    const newGuest = {
      id: Math.max(...guests.map((g) => g.id), 0) + 1,
      name: '新規ゲスト',
      hotel: hotels[0],
      location: { lat: 24.35, lng: 124.16 },
      people: 1,
      preferredTime: { start: '08:00', end: '09:00' },
      pickupTime: null,
    };
    onUpdate([...guests, newGuest]);
  };

  const handleChange = (field) => (event) => {
    if (field === 'preferredTimeStart' || field === 'preferredTimeEnd') {
      setEditingGuest({
        ...editingGuest,
        preferredTime: {
          ...editingGuest.preferredTime,
          [field === 'preferredTimeStart' ? 'start' : 'end']: event.target.value,
        },
      });
    } else {
      setEditingGuest({ ...editingGuest, [field]: event.target.value });
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        👥 ゲスト情報
      </Typography>

      {guests.map((guest) => (
        <Card key={guest.id} sx={{ mb: 1.5 }}>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            {editingId === guest.id ? (
              // 編集モード
              <Box>
                <Grid container spacing={1}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      size="small"
                      label="ゲスト名"
                      value={editingGuest.name}
                      onChange={handleChange('name')}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControl fullWidth size="small">
                      <InputLabel>ホテル</InputLabel>
                      <Select
                        value={editingGuest.hotel}
                        label="ホテル"
                        onChange={handleChange('hotel')}
                      >
                        {hotels.map((hotel) => (
                          <MenuItem key={hotel} value={hotel}>
                            {hotel}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="人数"
                      type="number"
                      value={editingGuest.people}
                      onChange={handleChange('people')}
                      inputProps={{ min: 1, max: 10 }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                      <TextField
                        size="small"
                        label="開始"
                        type="time"
                        value={editingGuest.preferredTime.start}
                        onChange={handleChange('preferredTimeStart')}
                        InputLabelProps={{ shrink: true }}
                        sx={{ flex: 1 }}
                      />
                      <Typography>〜</Typography>
                      <TextField
                        size="small"
                        label="終了"
                        type="time"
                        value={editingGuest.preferredTime.end}
                        onChange={handleChange('preferredTimeEnd')}
                        InputLabelProps={{ shrink: true }}
                        sx={{ flex: 1 }}
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                      <IconButton size="small" onClick={handleSave} color="primary">
                        <SaveIcon />
                      </IconButton>
                      <IconButton size="small" onClick={handleCancel}>
                        <CancelIcon />
                      </IconButton>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            ) : (
              // 表示モード
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="subtitle2" fontWeight="bold">
                    {guest.name}
                  </Typography>
                  <Chip label={`${guest.people}名`} size="small" color="primary" />
                </Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {guest.hotel}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  希望: {guest.preferredTime.start}〜{guest.preferredTime.end}
                </Typography>
                {guest.pickupTime && (
                  <Typography variant="body2" color="primary" sx={{ mt: 0.5 }}>
                    ピックアップ: {guest.pickupTime}
                  </Typography>
                )}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                  <IconButton size="small" onClick={() => handleEdit(guest)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDelete(guest.id)} color="error">
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>
      ))}

      <Button fullWidth variant="outlined" onClick={handleAdd} sx={{ mt: 2 }}>
        + ゲストを追加
      </Button>
    </Box>
  );
};

export default GuestList;