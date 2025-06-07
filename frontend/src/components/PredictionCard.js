import React from 'react';
import { Box, Typography, LinearProgress, Alert, Chip } from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';

const PredictionCard = ({ prediction }) => {
  if (!prediction) {
    return (
      <Box sx={{ p: 2, bgcolor: '#e8f0fe', borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <SmartToyIcon color="primary" />
          <Typography variant="subtitle1" fontWeight="bold" color="primary">
            AI予測結果
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          ルート最適化を実行してください
        </Typography>
      </Box>
    );
  }

  const getAccuracyColor = (accuracy) => {
    if (accuracy >= 90) return '#4caf50';
    if (accuracy >= 80) return '#ff9800';
    return '#f44336';
  };

  return (
    <Box sx={{ p: 2, bgcolor: '#e8f0fe', borderRadius: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <SmartToyIcon color="primary" />
        <Typography variant="subtitle1" fontWeight="bold" color="primary">
          AI予測結果
        </Typography>
      </Box>

      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2">予測精度</Typography>
          <Typography variant="body2" fontWeight="bold">
            {prediction.accuracy}%
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={prediction.accuracy}
          sx={{
            height: 8,
            borderRadius: 4,
            bgcolor: '#e0e0e0',
            '& .MuiLinearProgress-bar': {
              borderRadius: 4,
              bgcolor: getAccuracyColor(prediction.accuracy),
            },
          }}
        />
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
          アンサンブル学習による予測
        </Typography>
      </Box>

      {prediction.expected_delays && prediction.expected_delays.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" gutterBottom>
            予測遅延時間
          </Typography>
          {prediction.expected_delays.map((delay, index) => (
            <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Typography variant="caption" sx={{ flex: 1 }}>
                {delay.guest_name}:
              </Typography>
              <Chip
                label={`${delay.predicted_delay}分`}
                size="small"
                color={delay.predicted_delay > 10 ? 'warning' : 'success'}
              />
            </Box>
          ))}
        </Box>
      )}

      {prediction.recommendations && prediction.recommendations.length > 0 && (
        <Box>
          <Typography variant="body2" gutterBottom>
            推奨事項
          </Typography>
          {prediction.recommendations.map((rec, index) => (
            <Alert key={index} severity="info" sx={{ mb: 1, py: 0 }}>
              <Typography variant="caption">{rec}</Typography>
            </Alert>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default PredictionCard;