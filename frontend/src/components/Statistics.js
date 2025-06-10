// src/components/Statistics.js - 修正版

import React from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Paper,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Divider
} from '@mui/material';
import {
  Assessment as StatisticsIcon,
  TrendingUp as TrendingUpIcon,
  DirectionsCar as CarIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  Speed as SpeedIcon
} from '@mui/icons-material';

const Statistics = ({ optimizedRoutes = [], tourData = {}, guests = [], vehicles = [] }) => {
  // 統計計算
  const totalVehicles = optimizedRoutes.length;
  const totalGuests = guests.reduce((sum, guest) => sum + guest.people, 0);
  const totalDistance = optimizedRoutes.reduce((sum, route) => sum + route.total_distance, 0);
  const averageEfficiency = optimizedRoutes.length > 0 ? 
    optimizedRoutes.reduce((sum, route) => sum + route.efficiency_score, 0) / optimizedRoutes.length : 0;
  const totalStops = optimizedRoutes.reduce((sum, route) => sum + route.route.length, 0);

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <StatisticsIcon sx={{ mr: 1 }} />
        統計・分析
      </Typography>

      {optimizedRoutes.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <StatisticsIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              統計データがありません
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ルート最適化を実行すると統計情報が表示されます
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* KPI カード */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <CarIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                  <Typography variant="h4" color="primary" fontWeight="bold">
                    {totalVehicles}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    使用車両数
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <PersonIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                  <Typography variant="h4" color="success.main" fontWeight="bold">
                    {totalGuests}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    総参加者数
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <SpeedIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                  <Typography variant="h4" color="warning.main" fontWeight="bold">
                    {totalDistance.toFixed(1)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    総移動距離 (km)
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <TrendingUpIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
                  <Typography variant="h4" color="info.main" fontWeight="bold">
                    {averageEfficiency.toFixed(1)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    平均効率スコア
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* 車両別詳細統計 */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                車両別詳細統計
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>車両名</TableCell>
                      <TableCell align="center">ピックアップ数</TableCell>
                      <TableCell align="center">乗客数</TableCell>
                      <TableCell align="center">移動距離 (km)</TableCell>
                      <TableCell align="center">効率スコア</TableCell>
                      <TableCell align="center">稼働率</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {optimizedRoutes.map((route, index) => {
                      const vehicle = vehicles[index];
                      const passengers = route.route.reduce((sum, stop) => sum + stop.num_people, 0);
                      const utilization = vehicle ? (passengers / vehicle.capacity * 100) : 0;
                      
                      return (
                        <TableRow key={index} hover>
                          <TableCell>{route.vehicle_name}</TableCell>
                          <TableCell align="center">{route.route.length}</TableCell>
                          <TableCell align="center">{passengers}名</TableCell>
                          <TableCell align="center">{route.total_distance.toFixed(1)}</TableCell>
                          <TableCell align="center">
                            <Chip
                              label={`${route.efficiency_score}%`}
                              color={route.efficiency_score > 80 ? 'success' : route.efficiency_score > 60 ? 'warning' : 'error'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={`${utilization.toFixed(1)}%`}
                              color={utilization > 80 ? 'success' : utilization > 60 ? 'warning' : 'default'}
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>

          {/* 運用効率分析 */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    運用効率分析
                  </Typography>
                  <Box sx={{ display: 'grid', gap: 2 }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        車両稼働率
                      </Typography>
                      <Typography variant="h6">
                        {vehicles.length > 0 ? (totalVehicles / vehicles.length * 100).toFixed(1) : 0}%
                      </Typography>
                    </Box>
                    <Divider />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        1台あたり平均ピックアップ数
                      </Typography>
                      <Typography variant="h6">
                        {totalVehicles > 0 ? (totalStops / totalVehicles).toFixed(1) : 0}箇所
                      </Typography>
                    </Box>
                    <Divider />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        1台あたり平均移動距離
                      </Typography>
                      <Typography variant="h6">
                        {totalVehicles > 0 ? (totalDistance / totalVehicles).toFixed(1) : 0}km
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    時間効率分析
                  </Typography>
                  <Box sx={{ display: 'grid', gap: 2 }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        推定総所要時間
                      </Typography>
                      <Typography variant="h6">
                        {Math.round(totalDistance * 2)}分
                      </Typography>
                    </Box>
                    <Divider />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        1名あたり平均所要時間
                      </Typography>
                      <Typography variant="h6">
                        {totalGuests > 0 ? Math.round(totalDistance * 2 / totalGuests) : 0}分
                      </Typography>
                    </Box>
                    <Divider />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        効率性評価
                      </Typography>
                      <Chip
                        label={
                          averageEfficiency > 80 ? '優秀' :
                          averageEfficiency > 60 ? '良好' : '要改善'
                        }
                        color={
                          averageEfficiency > 80 ? 'success' :
                          averageEfficiency > 60 ? 'warning' : 'error'
                        }
                      />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
};

export default Statistics;