import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, 
  FormControl, InputLabel, Select, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, LinearProgress, Alert
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
  Speed as SpeedIcon,
  Schedule as ScheduleIcon,
  LocationOn as LocationIcon
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const Statistics = ({ optimizedRoutes, tourData }) => {
  const [timeRange, setTimeRange] = useState('today');
  const [statisticsData, setStatisticsData] = useState(null);

  useEffect(() => {
    generateStatistics();
  }, [optimizedRoutes, timeRange]);

  const generateStatistics = () => {
    if (!optimizedRoutes || optimizedRoutes.length === 0) {
      return;
    }

    // 車両別効率統計
    const vehicleStats = optimizedRoutes.map((route, index) => ({
      vehicleName: route.vehicle_name,
      efficiency: route.efficiency_score,
      distance: route.total_distance,
      guestCount: route.route.reduce((sum, stop) => sum + stop.num_people, 0),
      pickupCount: route.route.length,
      capacityUtilization: (route.route.reduce((sum, stop) => sum + stop.num_people, 0) / route.capacity) * 100
    }));

    // エリア別統計（ホテルの分布）
    const areaStats = {};
    optimizedRoutes.forEach(route => {
      route.route.forEach(stop => {
        const area = getAreaFromHotel(stop.hotel_name);
        if (!areaStats[area]) {
          areaStats[area] = { area, count: 0, totalGuests: 0 };
        }
        areaStats[area].count += 1;
        areaStats[area].totalGuests += stop.num_people;
      });
    });

    // 時間帯別統計
    const timeStats = {};
    optimizedRoutes.forEach(route => {
      route.route.forEach(stop => {
        const hour = stop.pickup_time.split(':')[0];
        if (!timeStats[hour]) {
          timeStats[hour] = { hour: hour + ':00', count: 0, totalGuests: 0 };
        }
        timeStats[hour].count += 1;
        timeStats[hour].totalGuests += stop.num_people;
      });
    });

    // 時間適合性統計
    const complianceStats = {
      acceptable: 0,
      early: 0,
      late: 0
    };

    optimizedRoutes.forEach(route => {
      route.route.forEach(stop => {
        complianceStats[stop.time_compliance] = (complianceStats[stop.time_compliance] || 0) + 1;
      });
    });

    setStatisticsData({
      vehicleStats,
      areaStats: Object.values(areaStats),
      timeStats: Object.values(timeStats),
      complianceStats,
      summary: {
        totalVehicles: optimizedRoutes.length,
        totalGuests: optimizedRoutes.reduce((sum, route) => 
          sum + route.route.reduce((routeSum, stop) => routeSum + stop.num_people, 0), 0),
        totalDistance: optimizedRoutes.reduce((sum, route) => sum + route.total_distance, 0),
        averageEfficiency: optimizedRoutes.reduce((sum, route) => sum + route.efficiency_score, 0) / optimizedRoutes.length,
        totalPickups: optimizedRoutes.reduce((sum, route) => sum + route.route.length, 0)
      }
    });
  };

  const getAreaFromHotel = (hotelName) => {
    if (hotelName.includes('フサキ') || hotelName.includes('ANA')) return 'フサキエリア';
    if (hotelName.includes('川平')) return '川平湾';
    if (hotelName.includes('白保')) return '白保';
    if (hotelName.includes('米原')) return '米原';
    return '市街地';
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (!statisticsData) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body2" color="text.secondary">
          ルートを最適化してから統計情報が表示されます
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center' }}>
          <AssessmentIcon sx={{ mr: 1 }} />
          統計・分析
        </Typography>
        
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>期間</InputLabel>
          <Select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            label="期間"
          >
            <MenuItem value="today">今日</MenuItem>
            <MenuItem value="week">今週</MenuItem>
            <MenuItem value="month">今月</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* サマリーカード */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <AssessmentIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4">{statisticsData.summary.totalVehicles}</Typography>
              <Typography variant="body2" color="text.secondary">車両数</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <LocationIcon color="secondary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4">{statisticsData.summary.totalPickups}</Typography>
              <Typography variant="body2" color="text.secondary">ピックアップ箇所</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <AssessmentIcon color="info" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4">{statisticsData.summary.totalGuests}</Typography>
              <Typography variant="body2" color="text.secondary">総ゲスト数</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <SpeedIcon color="warning" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4">{statisticsData.summary.totalDistance.toFixed(1)}</Typography>
              <Typography variant="body2" color="text.secondary">総距離 (km)</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <TrendingUpIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4">{statisticsData.summary.averageEfficiency.toFixed(1)}%</Typography>
              <Typography variant="body2" color="text.secondary">平均効率</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* 車両別パフォーマンス */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                車両別パフォーマンス
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={statisticsData.vehicleStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="vehicleName" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="efficiency" fill="#8884d8" name="効率スコア (%)" />
                  <Bar dataKey="capacityUtilization" fill="#82ca9d" name="定員使用率 (%)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* 時間適合性 */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                時間適合性
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: '時間内', value: statisticsData.complianceStats.acceptable, color: '#4caf50' },
                      { name: '早め', value: statisticsData.complianceStats.early, color: '#ff9800' },
                      { name: '遅め', value: statisticsData.complianceStats.late, color: '#f44336' }
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {[
                      { name: '時間内', value: statisticsData.complianceStats.acceptable, color: '#4caf50' },
                      { name: '早め', value: statisticsData.complianceStats.early, color: '#ff9800' },
                      { name: '遅め', value: statisticsData.complianceStats.late, color: '#f44336' }
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* エリア別統計 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                エリア別ピックアップ統計
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>エリア</TableCell>
                      <TableCell align="right">件数</TableCell>
                      <TableCell align="right">ゲスト数</TableCell>
                      <TableCell align="right">割合</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {statisticsData.areaStats.map((area, index) => (
                      <TableRow key={area.area}>
                        <TableCell>{area.area}</TableCell>
                        <TableCell align="right">{area.count}</TableCell>
                        <TableCell align="right">{area.totalGuests}</TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box sx={{ width: '100%', mr: 1 }}>
                              <LinearProgress 
                                variant="determinate" 
                                value={(area.count / statisticsData.summary.totalPickups) * 100}
                                sx={{ height: 8, borderRadius: 1 }}
                              />
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                              {((area.count / statisticsData.summary.totalPickups) * 100).toFixed(0)}%
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* 時間帯別統計 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                時間帯別ピックアップ
              </Typography>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={statisticsData.timeStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" name="件数" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* 車両詳細テーブル */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                車両別詳細統計
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>車両名</TableCell>
                      <TableCell align="right">効率スコア</TableCell>
                      <TableCell align="right">総距離 (km)</TableCell>
                      <TableCell align="right">ゲスト数</TableCell>
                      <TableCell align="right">ピックアップ件数</TableCell>
                      <TableCell align="right">定員使用率</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {statisticsData.vehicleStats.map((vehicle, index) => (
                      <TableRow key={index} hover>
                        <TableCell>{vehicle.vehicleName}</TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                            {vehicle.efficiency.toFixed(1)}%
                            <LinearProgress
                              variant="determinate"
                              value={vehicle.efficiency}
                              sx={{ width: 60, ml: 1, height: 6 }}
                              color={vehicle.efficiency > 80 ? 'success' : vehicle.efficiency > 60 ? 'warning' : 'error'}
                            />
                          </Box>
                        </TableCell>
                        <TableCell align="right">{vehicle.distance.toFixed(1)}</TableCell>
                        <TableCell align="right">{vehicle.guestCount}</TableCell>
                        <TableCell align="right">{vehicle.pickupCount}</TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                            {vehicle.capacityUtilization.toFixed(0)}%
                            <LinearProgress
                              variant="determinate"
                              value={vehicle.capacityUtilization}
                              sx={{ width: 60, ml: 1, height: 6 }}
                              color={vehicle.capacityUtilization > 90 ? 'error' : vehicle.capacityUtilization > 70 ? 'warning' : 'success'}
                            />
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* パフォーマンス分析 */}
        <Grid item xs={12}>
          <Alert severity="info">
            <Typography variant="subtitle2" gutterBottom>
              パフォーマンス分析
            </Typography>
            <Typography variant="body2">
              • 平均効率スコア: {statisticsData.summary.averageEfficiency.toFixed(1)}% 
              {statisticsData.summary.averageEfficiency > 80 ? ' (優秀)' : 
               statisticsData.summary.averageEfficiency > 60 ? ' (良好)' : ' (改善の余地あり)'}
            </Typography>
            <Typography variant="body2">
              • 1車両あたり平均距離: {(statisticsData.summary.totalDistance / statisticsData.summary.totalVehicles).toFixed(1)}km
            </Typography>
            <Typography variant="body2">
              • 1車両あたり平均ピックアップ数: {(statisticsData.summary.totalPickups / statisticsData.summary.totalVehicles).toFixed(1)}件
            </Typography>
          </Alert>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Statistics;