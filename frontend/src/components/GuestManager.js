// src/components/GuestManager.js - 簡易版

import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Button, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, Chip, Alert, Divider, Stack, FormControl, InputLabel, Select, MenuItem
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
  Groups as GroupsIcon
} from '@mui/icons-material';

const GuestManager = ({ 
  guests = [], 
  onGuestsUpdate, 
  tourData = {}, 
  onTourDataUpdate,
  onActivityLocationUpdate 
}) => {
  const [localGuests, setLocalGuests] = useState(guests);
  const [open, setOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(-1);
  const [currentGuest, setCurrentGuest] = useState({
    name: '',
    hotel_name: '',
    pickup_lat: 24.3336,
    pickup_lng: 124.1543,
    people: 1,
    preferred_pickup_start: '08:30',
    preferred_pickup_end: '09:00',
    phone: '',
    email: ''
  });
  const [localTourData, setLocalTourData] = useState({
    date: new Date().toISOString().split('T')[0],
    activityType: 'シュノーケリング',
    startTime: '09:00',
    ...tourData
  });

  useEffect(() => {
    setLocalGuests(guests);
  }, [guests]);

  const handleAddGuest = () => {
    setCurrentGuest({
      name: '',
      hotel_name: '',
      pickup_lat: 24.3336,
      pickup_lng: 124.1543,
      people: 1,
      preferred_pickup_start: '08:30',
      preferred_pickup_end: '09:00',
      phone: '',
      email: ''
    });
    setEditingIndex(-1);
    setOpen(true);
  };

  const handleEditGuest = (index) => {
    setCurrentGuest({ ...localGuests[index] });
    setEditingIndex(index);
    setOpen(true);
  };

  const handleDeleteGuest = (index) => {
    const newGuests = localGuests.filter((_, i) => i !== index);
    setLocalGuests(newGuests);
    onGuestsUpdate?.(newGuests);
  };

  const handleSaveGuest = () => {
    let newGuests;
    
    if (editingIndex >= 0) {
      newGuests = [...localGuests];
      newGuests[editingIndex] = { ...currentGuest, id: editingIndex + 1 };
    } else {
      newGuests = [...localGuests, { ...currentGuest, id: localGuests.length + 1 }];
    }
    
    setLocalGuests(newGuests);
    onGuestsUpdate?.(newGuests);
    setOpen(false);
  };

  const handleTourDataChange = (field, value) => {
    const newTourData = { ...localTourData, [field]: value };
    setLocalTourData(newTourData);
    onTourDataUpdate?.(newTourData);
  };

  const totalGuests = localGuests.reduce((sum, guest) => sum + guest.people, 0);

  const hotelOptions = [
    'ANAインターコンチネンタル石垣リゾート',
    'フサキビーチリゾート',
    'グランヴィリオリゾート石垣島',
    'アートホテル石垣島',
    '石垣シーサイドホテル',
    'ホテルククル',
    '石垣島ビーチホテルサンシャイン',
    'その他'
  ];

  return (
    <Box sx={{ p: 2 }}>
      {/* ヘッダー */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center' }}>
          <PersonIcon sx={{ mr: 1 }} />
          ゲスト管理
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddGuest}
        >
          ゲスト追加
        </Button>
      </Box>

      {/* ツアー基本情報 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            ツアー基本情報
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="ツアー日付"
                type="date"
                value={localTourData.date}
                onChange={(e) => handleTourDataChange('date', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>アクティビティ</InputLabel>
                <Select
                  value={localTourData.activityType}
                  onChange={(e) => handleTourDataChange('activityType', e.target.value)}
                  label="アクティビティ"
                >
                  <MenuItem value="シュノーケリング">シュノーケリング</MenuItem>
                  <MenuItem value="ダイビング">ダイビング</MenuItem>
                  <MenuItem value="観光ツアー">観光ツアー</MenuItem>
                  <MenuItem value="釣りツアー">釣りツアー</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="開始時間"
                type="time"
                value={localTourData.startTime}
                onChange={(e) => handleTourDataChange('startTime', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center', pt: 1 }}>
                <Typography variant="body2" color="text.secondary">総参加者数</Typography>
                <Typography variant="h5" color="primary" fontWeight="bold">
                  {totalGuests}名
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* 統計カード */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <GroupsIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h6">{localGuests.length}</Typography>
              <Typography variant="body2" color="text.secondary">
                ゲスト数
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <PersonIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h6">{totalGuests}</Typography>
              <Typography variant="body2" color="text.secondary">
                総参加者数
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <HotelIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
              <Typography variant="h6">
                {new Set(localGuests.map(g => g.hotel_name)).size}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                ホテル数
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <TimeIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
              <Typography variant="h6">
                {localGuests.length > 0 ? 
                  Math.round(localGuests.reduce((sum, g) => {
                    const start = parseInt(g.preferred_pickup_start.split(':')[0]);
                    const end = parseInt(g.preferred_pickup_end.split(':')[0]);
                    return sum + (end - start);
                  }, 0) / localGuests.length) : 0
                }分
              </Typography>
              <Typography variant="body2" color="text.secondary">
                平均希望時間幅
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ゲストリスト */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            ゲストリスト
          </Typography>
          
          {localGuests.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <PersonIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                ゲストが登録されていません
              </Typography>
              <Typography variant="body2" color="text.secondary">
                「ゲスト追加」ボタンから新しいゲストを登録してください
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>ゲスト名</TableCell>
                    <TableCell>ホテル</TableCell>
                    <TableCell align="center">人数</TableCell>
                    <TableCell>希望ピックアップ時間</TableCell>
                    <TableCell>連絡先</TableCell>
                    <TableCell align="center">アクション</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {localGuests.map((guest, index) => (
                    <TableRow key={index} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2" fontWeight="bold">
                            {guest.name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <HotelIcon sx={{ mr: 1, fontSize: 18, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            {guest.hotel_name}
                          </Typography>
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
                            {guest.preferred_pickup_start} - {guest.preferred_pickup_end}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Stack spacing={0.5}>
                          {guest.phone && (
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <PhoneIcon sx={{ mr: 0.5, fontSize: 14 }} />
                              <Typography variant="caption">{guest.phone}</Typography>
                            </Box>
                          )}
                          {guest.email && (
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <EmailIcon sx={{ mr: 0.5, fontSize: 14 }} />
                              <Typography variant="caption">{guest.email}</Typography>
                            </Box>
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={1}>
                          <IconButton
                            size="small"
                            onClick={() => handleEditGuest(index)}
                            color="primary"
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteGuest(index)}
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

      {/* ゲスト追加/編集ダイアログ */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingIndex >= 0 ? 'ゲスト情報編集' : 'ゲスト追加'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="ゲスト名"
                value={currentGuest.name}
                onChange={(e) => setCurrentGuest(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>ホテル名</InputLabel>
                <Select
                  value={currentGuest.hotel_name}
                  onChange={(e) => setCurrentGuest(prev => ({ ...prev, hotel_name: e.target.value }))}
                  label="ホテル名"
                >
                  {hotelOptions.map((hotel) => (
                    <MenuItem key={hotel} value={hotel}>{hotel}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="参加人数"
                type="number"
                value={currentGuest.people}
                onChange={(e) => setCurrentGuest(prev => ({ 
                  ...prev, 
                  people: parseInt(e.target.value) || 1 
                }))}
                inputProps={{ min: 1, max: 10 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="電話番号"
                value={currentGuest.phone}
                onChange={(e) => setCurrentGuest(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="090-1234-5678"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="メールアドレス"
                type="email"
                value={currentGuest.email}
                onChange={(e) => setCurrentGuest(prev => ({ ...prev, email: e.target.value }))}
                placeholder="example@email.com"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="希望ピックアップ開始時間"
                type="time"
                value={currentGuest.preferred_pickup_start}
                onChange={(e) => setCurrentGuest(prev => ({ 
                  ...prev, 
                  preferred_pickup_start: e.target.value 
                }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="希望ピックアップ終了時間"
                type="time"
                value={currentGuest.preferred_pickup_end}
                onChange={(e) => setCurrentGuest(prev => ({ 
                  ...prev, 
                  preferred_pickup_end: e.target.value 
                }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>
            キャンセル
          </Button>
          <Button 
            onClick={handleSaveGuest} 
            variant="contained"
            disabled={!currentGuest.name || !currentGuest.hotel_name}
          >
            {editingIndex >= 0 ? '更新' : '追加'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GuestManager;