import React from 'react';
import { TextField, Select, MenuItem, FormControl, InputLabel, Box, Typography, Grid } from '@mui/material';

const TourSettings = ({ tourData, onChange, environmentalData }) => {
  const handleChange = (field) => (event) => {
    onChange({ ...tourData, [field]: event.target.value });
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        📅 ツアー設定
      </Typography>
      
      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          label="ツアー日付"
          type="date"
          value={tourData.date}
          onChange={handleChange('date')}
          InputLabelProps={{ shrink: true }}
          sx={{ mb: 2 }}
        />
        
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>アクティビティ</InputLabel>
          <Select
            value={tourData.activityType}
            label="アクティビティ"
            onChange={handleChange('activityType')}
          >
            <MenuItem value="snorkeling">シュノーケリング</MenuItem>
            <MenuItem value="diving">ダイビング</MenuItem>
            <MenuItem value="kayak">カヤック</MenuItem>
            <MenuItem value="sup">SUP</MenuItem>
            <MenuItem value="fishing">釣り</MenuItem>
          </Select>
        </FormControl>
        
        <TextField
          fullWidth
          label="開始時間（希望）"
          type="time"
          value={tourData.startTime}
          onChange={handleChange('startTime')}
          InputLabelProps={{ shrink: true }}
        />
      </Box>
      
      <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
        🌊 環境データ
      </Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="h4">🌊</Typography>
            <Typography variant="body2" color="text.secondary">潮位</Typography>
            <Typography variant="h6">{environmentalData.tide.level}cm</Typography>
          </Box>
        </Grid>
        <Grid item xs={6}>
          <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="h4">☀️</Typography>
            <Typography variant="body2" color="text.secondary">天気</Typography>
            <Typography variant="h6">晴れ</Typography>
          </Box>
        </Grid>
        <Grid item xs={6}>
          <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="h4">💨</Typography>
            <Typography variant="body2" color="text.secondary">風速</Typography>
            <Typography variant="h6">{environmentalData.weather.windSpeed}m/s</Typography>
          </Box>
        </Grid>
        <Grid item xs={6}>
          <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="h4">🌡️</Typography>
            <Typography variant="body2" color="text.secondary">気温</Typography>
            <Typography variant="h6">{environmentalData.weather.temp}°C</Typography>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TourSettings;