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
  InputAdornment,
  CircularProgress,
  Alert,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import SearchIcon from '@mui/icons-material/Search';
import LocationOnIcon from '@mui/icons-material/LocationOn';

const GuestList = ({ guests, onUpdate }) => {
  const [editingId, setEditingId] = useState(null);
  const [editingGuest, setEditingGuest] = useState(null);
  const [searchingHotel, setSearchingHotel] = useState(false);
  const [searchMessage, setSearchMessage] = useState(null);

  const handleEdit = (guest) => {
    setEditingId(guest.id);
    setEditingGuest({ ...guest });
    setSearchMessage(null);
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
      hotel: '',
      location: { lat: 24.35, lng: 124.16 },
      people: 1,
      preferredTime: { start: '08:00', end: '09:00' },
      pickupTime: null,
    };
    onUpdate([...guests, newGuest]);
    setEditingId(newGuest.id);
    setEditingGuest(newGuest);
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

  const handleHotelSearch = () => {
    if (!editingGuest.hotel || !window.searchHotelLocation) {
      return;
    }

    setSearchingHotel(true);
    setSearchMessage(null);
    
    window.searchHotelLocation(editingGuest.hotel, (result) => {
      setSearchingHotel(false);
      if (result) {
        setEditingGuest({
          ...editingGuest,
          location: { lat: result.lat, lng: result.lng },
          hotel: result.name || editingGuest.hotel,
        });
        setSearchMessage({ type: 'success', text: '✅ ホテルが見つかりました！地図上にピンが表示されます。' });
      } else {
        setSearchMessage({ type: 'error', text: '❌ ホテルが見つかりませんでした。地図上でピンをドラッグして位置を調整してください。' });
      }
    });
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
              <Box>
                <TextField
                  fullWidth
                  size="small"
                  label="名前"
                  value={editingGuest.name}
                  onChange={handleChange('name')}
                  sx={{ mb: 1 }}
                />
                {searchMessage && (
                  <Alert severity={searchMessage.type} sx={{ mb: 1, py: 0.5 }}>
                    {searchMessage.text}
                  </Alert>
                )}
                <TextField
                  fullWidth
                  size="small"
                  label="ホテル"
                  value={editingGuest.hotel}
                  onChange={handleChange('hotel')}
                  sx={{ mb: 1 }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleHotelSearch();
                    }
                  }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={handleHotelSearch}
                          disabled={searchingHotel || !editingGuest.hotel}
                          color="primary"
                          title="ホテルを検索して地図上に表示"
                        >
                          {searchingHotel ? <CircularProgress size={20} /> : <SearchIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  placeholder="ホテル名を入力して検索"
                  helperText="ホテル名を入力して🔍をクリックまたはEnterキーで検索"
                />
                <TextField
                  fullWidth
                  size="small"
                  label="人数"
                  type="number"
                  value={editingGuest.people}
                  onChange={handleChange('people')}
                  sx={{ mb: 1 }}
                />
                <Grid container spacing={1} sx={{ mb: 1 }}>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="希望開始"
                      type="time"
                      value={editingGuest.preferredTime.start}
                      onChange={handleChange('preferredTimeStart')}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="希望終了"
                      type="time"
                      value={editingGuest.preferredTime.end}
                      onChange={handleChange('preferredTimeEnd')}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                </Grid>
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
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="subtitle2" fontWeight="bold">
                    {guest.name}
                  </Typography>
                  <Chip label={`${guest.people}名`} size="small" color="primary" />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                  <LocationOnIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    {guest.hotel || '未設定'}
                  </Typography>
                </Box>
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