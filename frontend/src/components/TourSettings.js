import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Checkbox,
  FormControlLabel,
} from '@mui/material';

const TourSettings = ({ tourData, onChange, environmentalData }) => {
  const [isStartTimeFixed, setIsStartTimeFixed] = useState(false);
  const [isDepartureTimeFixed, setIsDepartureTimeFixed] = useState(false);
  const [departureTime, setDepartureTime] = useState('07:00');

  // 親コンポーネントから送迎開始時間を受け取る
  useEffect(() => {
    if (tourData.departureTime) {
      setDepartureTime(tourData.departureTime);
    }
  }, [tourData.departureTime]);

  const handleDateChange = (e) => {
    onChange({
      ...tourData,
      date: e.target.value,
    });
  };

  const handleActivityChange = (e) => {
    onChange({
      ...tourData,
      activityType: e.target.value,
    });
  };

  const handleStartTimeChange = (e) => {
    onChange({
      ...tourData,
      startTime: e.target.value,
      isStartTimeFixed: isStartTimeFixed,
    });
  };

  const handleDepartureTimeChange = (e) => {
    const newTime = e.target.value;
    setDepartureTime(newTime);
    onChange({
      ...tourData,
      departureTime: newTime,
      isDepartureTimeFixed: isDepartureTimeFixed,
    });
  };

  const handleStartTimeFixedChange = (e) => {
    const fixed = e.target.checked;
    setIsStartTimeFixed(fixed);
    onChange({
      ...tourData,
      isStartTimeFixed: fixed,
    });
  };

  const handleDepartureTimeFixedChange = (e) => {
    const fixed = e.target.checked;
    setIsDepartureTimeFixed(fixed);
    onChange({
      ...tourData,
      isDepartureTimeFixed: fixed,
    });
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        ⚙️ ツアー設定
      </Typography>

      <TextField
        fullWidth
        size="small"
        label="ツアー日"
        type="date"
        value={tourData.date}
        onChange={handleDateChange}
        InputLabelProps={{ shrink: true }}
        sx={{ mb: 2 }}
      />

      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
        <InputLabel>アクティビティ</InputLabel>
        <Select
          value={tourData.activityType}
          label="アクティビティ"
          onChange={handleActivityChange}
        >
          <MenuItem value="シュノーケリング">🏊 シュノーケリング</MenuItem>
          <MenuItem value="ダイビング">🤿 ダイビング</MenuItem>
          <MenuItem value="カヤック">🚣 カヤック</MenuItem>
          <MenuItem value="SUP">🏄 SUP</MenuItem>
        </Select>
      </FormControl>

      {/* 送迎開始時間 */}
      <Box sx={{ mb: 2 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={isDepartureTimeFixed}
              onChange={handleDepartureTimeFixedChange}
              size="small"
            />
          }
          label={
            <Typography variant="body2">
              送迎開始時間を固定
            </Typography>
          }
          sx={{ mb: 1 }}
        />
        <TextField
          fullWidth
          size="small"
          label="送迎開始時間"
          type="time"
          value={departureTime}
          onChange={handleDepartureTimeChange}
          disabled={!isDepartureTimeFixed}
          InputLabelProps={{ shrink: true }}
          helperText={
            isDepartureTimeFixed 
              ? "固定された時間で計画されます" 
              : "ゲストの希望時間から自動計算されます"
          }
        />
      </Box>

      {/* アクティビティ開始時間 */}
      <Box sx={{ mb: 2 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={isStartTimeFixed}
              onChange={handleStartTimeFixedChange}
              size="small"
            />
          }
          label={
            <Typography variant="body2">
              アクティビティ開始時間を固定
            </Typography>
          }
          sx={{ mb: 1 }}
        />
        <TextField
          fullWidth
          size="small"
          label="アクティビティ開始時間"
          type="time"
          value={tourData.startTime}
          onChange={handleStartTimeChange}
          disabled={!isStartTimeFixed}
          InputLabelProps={{ shrink: true }}
          helperText={
            isStartTimeFixed 
              ? "固定された時間で計画されます" 
              : "送迎完了時間から自動計算されます"
          }
        />
      </Box>

      {/* 環境情報表示 */}
      {environmentalData && (
        <Box sx={{ mt: 2, p: 1.5, bgcolor: 'grey.100', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            🌊 現在の環境情報
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption">潮位:</Typography>
            <Typography variant="caption" fontWeight="bold">
              {environmentalData.tide.level}cm ({environmentalData.tide.state})
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="caption">風速:</Typography>
            <Typography variant="caption" fontWeight="bold">
              {environmentalData.weather.windSpeed}m/s
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default TourSettings;