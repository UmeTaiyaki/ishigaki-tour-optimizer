import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Grid,
} from '@mui/material';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PersonIcon from '@mui/icons-material/Person';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import FlagIcon from '@mui/icons-material/Flag';
import WavesIcon from '@mui/icons-material/Waves';

const FinalSchedule = ({ vehicles, optimizedRoutes, tourData }) => {
  if (!optimizedRoutes || optimizedRoutes.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body2" color="text.secondary">
          ルートを最適化してください
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        📋 最終スケジュール
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {tourData.date} - {tourData.activityType}
      </Typography>

      {optimizedRoutes.map((vehicleRoute, vehicleIndex) => {
        const vehicle = vehicles[vehicleIndex];
        const totalPassengers = vehicleRoute.route.reduce((sum, item) => sum + item.num_people, 0);
        
        return (
          <Paper key={vehicleIndex} sx={{ mb: 2, overflow: 'hidden' }}>
            {/* 車両ヘッダー */}
            <Box sx={{ 
              p: 2, 
              bgcolor: vehicle.color, 
              color: 'white',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <DirectionsCarIcon />
                <Typography variant="subtitle1" fontWeight="bold">
                  {vehicle.name}
                </Typography>
                {vehicle.driver && (
                  <Typography variant="body2">
                    ({vehicle.driver})
                  </Typography>
                )}
              </Box>
              <Chip 
                label={`${totalPassengers}/${vehicle.capacity}名`}
                size="small"
                sx={{ bgcolor: 'rgba(255,255,255,0.3)', color: 'white' }}
              />
            </Box>

            {/* スケジュール詳細 */}
            <List sx={{ py: 0 }}>
              {/* 出発地点 */}
              <ListItem sx={{ py: 1 }}>
                <ListItemIcon>
                  <FlagIcon color="success" />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" fontWeight="bold">
                        出発地点
                      </Typography>
                      <Typography variant="body2" color="primary">
                        {vehicleRoute.departure_time || '07:00'}
                      </Typography>
                    </Box>
                  }
                  secondary="送迎開始"
                />
              </ListItem>
              
              <Divider />

              {/* 各ゲストのピックアップ */}
              {vehicleRoute.route.map((item, index) => (
                <React.Fragment key={index}>
                  <ListItem sx={{ py: 1 }}>
                    <ListItemIcon>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        bgcolor: vehicle.color,
                        color: 'white',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        {index + 1}
                      </Box>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {item.name}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                              <PersonIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                              <Typography variant="caption" color="text.secondary">
                                {item.num_people}名
                              </Typography>
                              <LocationOnIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                              <Typography variant="caption" color="text.secondary">
                                {item.hotel_name}
                              </Typography>
                            </Box>
                          </Box>
                          <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="body2" color="primary" fontWeight="bold">
                              {item.pickup_time}
                            </Typography>
                            <Chip 
                              label={
                                item.time_compliance === 'optimal' ? '希望通り' :
                                item.time_compliance === 'acceptable' ? '許容範囲' : '要調整'
                              }
                              size="small"
                              color={
                                item.time_compliance === 'optimal' ? 'success' :
                                item.time_compliance === 'acceptable' ? 'warning' : 'error'
                              }
                              sx={{ height: 18, fontSize: '10px' }}
                            />
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < vehicleRoute.route.length - 1 && <Divider />}
                </React.Fragment>
              ))}
              
              <Divider />

              {/* アクティビティ地点 */}
              <ListItem sx={{ py: 1 }}>
                <ListItemIcon>
                  <WavesIcon color="error" />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" fontWeight="bold">
                        アクティビティ開始
                      </Typography>
                      <Typography variant="body2" color="error" fontWeight="bold">
                        {tourData.startTime}
                      </Typography>
                    </Box>
                  }
                  secondary={tourData.activityType}
                />
              </ListItem>
            </List>

            {/* 統計情報 */}
            <Box sx={{ p: 1.5, bgcolor: 'grey.100' }}>
              <Grid container spacing={2} sx={{ textAlign: 'center' }}>
                <Grid item xs={4}>
                  <Typography variant="caption" color="text.secondary">
                    総距離
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {vehicleRoute.total_distance}km
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="caption" color="text.secondary">
                    所要時間
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {vehicleRoute.estimated_duration}
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="caption" color="text.secondary">
                    乗車率
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {Math.round((totalPassengers / vehicle.capacity) * 100)}%
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        );
      })}

      {/* 全体統計 */}
      <Paper sx={{ p: 2, mt: 2, bgcolor: 'primary.main', color: 'white' }}>
        <Typography variant="subtitle2" gutterBottom>
          📊 全体統計
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-around' }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6">
              {vehicles.length}台
            </Typography>
            <Typography variant="caption">
              使用車両
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6">
              {optimizedRoutes.reduce((sum, r) => sum + r.route.length, 0)}名
            </Typography>
            <Typography variant="caption">
              総ゲスト数
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6">
              {optimizedRoutes.reduce((sum, r) => sum + parseFloat(r.total_distance), 0).toFixed(1)}km
            </Typography>
            <Typography variant="caption">
              総走行距離
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default FinalSchedule;