import React from 'react';
import {
  Box,
  Typography,
  Chip,
  Paper,
} from '@mui/material';
import Timeline from '@mui/lab/Timeline';
import TimelineItem from '@mui/lab/TimelineItem';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineDot from '@mui/lab/TimelineDot';
import TimelineOppositeContent from '@mui/lab/TimelineOppositeContent';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import WavesIcon from '@mui/icons-material/Waves';

const RouteTimeline = ({ route, activityTime, departureTime }) => {
  if (!route || !route.route || route.route.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body2" color="text.secondary">
          ルートを最適化してください
        </Typography>
      </Box>
    );
  }

  const getComplianceColor = (compliance) => {
    switch (compliance) {
      case 'optimal':
        return 'success';
      case 'acceptable':
        return 'warning';
      case 'warning':
        return 'error';
      default:
        return 'grey';
    }
  };

  const getComplianceLabel = (compliance) => {
    switch (compliance) {
      case 'optimal':
        return '希望時間内';
      case 'acceptable':
        return '15分以内の差';
      case 'warning':
        return '要調整';
      default:
        return '';
    }
  };

  return (
    <Box>
      <Timeline position="right" sx={{ p: 0, m: 0 }}>
        {/* 出発地点 */}
        <TimelineItem>
          <TimelineOppositeContent sx={{ flex: 0.3, pr: 2 }}>
            <Typography variant="body2" fontWeight="bold">
              {departureTime || route.departure_time || '07:00'}
            </Typography>
          </TimelineOppositeContent>
          <TimelineSeparator>
            <TimelineDot color="success">
              <DirectionsCarIcon fontSize="small" />
            </TimelineDot>
            <TimelineConnector />
          </TimelineSeparator>
          <TimelineContent sx={{ pb: 3 }}>
            <Paper elevation={0} sx={{ p: 1.5, bgcolor: '#e8f5e9' }}>
              <Typography variant="subtitle2" fontWeight="bold">
                出発地点
              </Typography>
              <Typography variant="caption" color="text.secondary">
                送迎開始
              </Typography>
            </Paper>
          </TimelineContent>
        </TimelineItem>

        {/* 各ゲストのピックアップ */}
        {route.route.map((item, index) => (
          <TimelineItem key={index}>
            <TimelineOppositeContent sx={{ flex: 0.3, pr: 2 }}>
              <Typography variant="body2" fontWeight="bold">
                {item.pickup_time}
              </Typography>
            </TimelineOppositeContent>
            <TimelineSeparator>
              <TimelineDot color="primary">
                <DirectionsCarIcon fontSize="small" />
              </TimelineDot>
              {index < route.route.length - 1 && <TimelineConnector />}
            </TimelineSeparator>
            <TimelineContent sx={{ pb: 3 }}>
              <Paper elevation={0} sx={{ p: 1.5, bgcolor: '#f5f5f5' }}>
                <Typography variant="subtitle2" fontWeight="bold">
                  {item.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {item.hotel_name} ({item.num_people}名)
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip
                    label={getComplianceLabel(item.time_compliance)}
                    color={getComplianceColor(item.time_compliance)}
                    size="small"
                    sx={{ height: 20 }}
                  />
                </Box>
              </Paper>
            </TimelineContent>
          </TimelineItem>
        ))}
        
        {/* アクティビティ開始 */}
        <TimelineItem>
          <TimelineOppositeContent sx={{ flex: 0.3, pr: 2 }}>
            <Typography variant="body2" fontWeight="bold">
              {activityTime}
            </Typography>
          </TimelineOppositeContent>
          <TimelineSeparator>
            <TimelineDot color="error">
              <WavesIcon fontSize="small" />
            </TimelineDot>
          </TimelineSeparator>
          <TimelineContent>
            <Paper elevation={0} sx={{ p: 1.5, bgcolor: '#e3f2fd' }}>
              <Typography variant="subtitle2" fontWeight="bold">
                アクティビティ開始
              </Typography>
              <Typography variant="caption" color="text.secondary">
                川平湾
              </Typography>
            </Paper>
          </TimelineContent>
        </TimelineItem>
      </Timeline>

      <Box sx={{ mt: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
        <Typography variant="subtitle2" gutterBottom>
          📊 詳細統計
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="caption">総移動距離:</Typography>
            <Typography variant="caption" fontWeight="bold">
              {route.total_distance}km
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="caption">予測所要時間:</Typography>
            <Typography variant="caption" fontWeight="bold">
              {route.estimated_duration}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="caption">CO2排出量:</Typography>
            <Typography variant="caption" fontWeight="bold">
              {(route.total_distance * 0.23).toFixed(1)}kg
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default RouteTimeline;