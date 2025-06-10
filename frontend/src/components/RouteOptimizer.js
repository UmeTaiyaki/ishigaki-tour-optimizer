// src/components/RouteOptimizer.js - 簡易版

import React, { useState } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Button,
  Alert, CircularProgress, Divider, Chip, Paper,
  List, ListItem, ListItemText, ListItemIcon
} from '@mui/material';
import {
  Route as RouteIcon,
  DirectionsCar as CarIcon,
  Person as PersonIcon,
  LocationOn as LocationIcon,
  Schedule as TimeIcon,
  Speed as SpeedIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';

const RouteOptimizer = ({ 
  guests = [], 
  vehicles = [], 
  tourData = {}, 
  environmentalData = null,
  onOptimize, 
  optimizedRoutes = [], 
  isLoading = false 
}) => {
  const [optimizationSettings, setOptimizationSettings] = useState({
    prioritizeTime: true,
    prioritizeEfficiency: true,
    considerWeather: true
  });

  const handleOptimize = () => {
    if (onOptimize) {
      onOptimize();
    }
  };

  const totalGuests = guests.reduce((sum, guest) => sum + guest.people, 0);
  const totalCapacity = vehicles.reduce((sum, vehicle) => sum + vehicle.capacity, 0);
  const availableVehicles = vehicles.filter(v => v.status === 'available');

  const canOptimize = guests.length > 0 && availableVehicles.length > 0;
  const hasResults = optimizedRoutes.length > 0;

  const getOptimizationStatusColor = () => {
    if (totalGuests > totalCapacity) return 'error';
    if (totalGuests === 0 || availableVehicles.length === 0) return 'warning';
    return 'success';
  };

  const getOptimizationStatusMessage = () => {
    if (totalGuests > totalCapacity) {
      return `定員不足: ${totalGuests - totalCapacity}名分の座席が不足しています`;
    }
    if (totalGuests === 0) {
      return 'ゲストが登録されていません';
    }
    if (availableVehicles.length === 0) {
      return '利用可能な車両がありません';
    }
    return '最適化準備完了';
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* ヘッダー */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center' }}>
          <RouteIcon sx={{ mr: 1 }} />
          ルート最適化
        </Typography>
        <Button
          variant="contained"
          size="large"
          onClick={handleOptimize}
          disabled={!canOptimize || isLoading}
          startIcon={isLoading ? <CircularProgress size={20} /> : <SpeedIcon />}
        >
          {isLoading ? '最適化中...' : 'ルート最適化実行'}
        </Button>
      </Box>

      {/* ステータス表示 */}
      <Alert 
        severity={getOptimizationStatusColor()} 
        sx={{ mb: 3 }}
        icon={
          getOptimizationStatusColor() === 'success' ? <CheckCircleIcon /> : 
          getOptimizationStatusColor() === 'error' ? <WarningIcon /> : <WarningIcon />
        }
      >
        {getOptimizationStatusMessage()}
      </Alert>

      {/* 概要情報 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                ツアー情報
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon><TimeIcon /></ListItemIcon>
                  <ListItemText 
                    primary="日付" 
                    secondary={tourData.date || '未設定'} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><LocationIcon /></ListItemIcon>
                  <ListItemText 
                    primary="アクティビティ" 
                    secondary={tourData.activityType || '未設定'} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><TimeIcon /></ListItemIcon>
                  <ListItemText 
                    primary="開始時間" 
                    secondary={tourData.startTime || '未設定'} 
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                ゲスト情報
              </Typography>
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h3" color="primary" fontWeight="bold">
                  {totalGuests}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  総参加者数
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Typography variant="h6">
                  {guests.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  ゲストグループ数
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                車両情報
              </Typography>
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h3" color="success.main" fontWeight="bold">
                  {totalCapacity}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  総収容人数
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Typography variant="h6" color={availableVehicles.length > 0 ? 'success.main' : 'error.main'}>
                  {availableVehicles.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  利用可能車両数
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 環境情報 */}
      {environmentalData && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              環境情報
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h6" color="primary">
                    {environmentalData.weather?.temperature || 26}°C
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    気温
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h6" color="info.main">
                    {environmentalData.weather?.wind_speed || 4.0}m/s
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    風速
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h6" color="warning.main">
                    {environmentalData.tide?.current_level || 150}cm
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    潮位
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h6" color="success.main">
                    {environmentalData.sea?.wave_height || 0.5}m
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    波高
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* 最適化結果 */}
      {hasResults && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <TrendingUpIcon sx={{ mr: 1 }} />
              最適化結果
            </Typography>
            
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" color="primary" fontWeight="bold">
                    {optimizedRoutes.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    使用車両数
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" color="success.main" fontWeight="bold">
                    {optimizedRoutes.reduce((sum, route) => sum + route.total_distance, 0).toFixed(1)}km
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    総移動距離
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" color="warning.main" fontWeight="bold">
                    {optimizedRoutes.length > 0 ? 
                      (optimizedRoutes.reduce((sum, route) => sum + route.efficiency_score, 0) / optimizedRoutes.length).toFixed(1) + '%' :
                      '0%'
                    }
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    平均効率スコア
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" color="info.main" fontWeight="bold">
                    {optimizedRoutes.reduce((sum, route) => sum + route.route.length, 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    総ピックアップ箇所
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            {/* 車両別サマリー */}
            <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
              車両別サマリー
            </Typography>
            <Grid container spacing={2}>
              {optimizedRoutes.map((route, index) => (
                <Grid item xs={12} md={6} key={index}>
                  <Paper sx={{ p: 2 }} variant="outlined">
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {route.vehicle_name}
                      </Typography>
                      <Chip
                        label={`効率: ${route.efficiency_score}%`}
                        color={route.efficiency_score > 80 ? 'success' : route.efficiency_score > 60 ? 'warning' : 'error'}
                        size="small"
                      />
                    </Box>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          ピックアップ数
                        </Typography>
                        <Typography variant="body1" fontWeight="bold">
                          {route.route.length}箇所
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          移動距離
                        </Typography>
                        <Typography variant="body1" fontWeight="bold">
                          {route.total_distance.toFixed(1)}km
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          乗客数
                        </Typography>
                        <Typography variant="body1" fontWeight="bold">
                          {route.route.reduce((sum, stop) => sum + stop.num_people, 0)}名
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          開始時間
                        </Typography>
                        <Typography variant="body1" fontWeight="bold">
                          {route.route[0]?.pickup_time || '-'}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              ))}
            </Grid>

            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Button
                variant="outlined"
                size="large"
                onClick={() => window.location.hash = '#schedule'}
                startIcon={<CheckCircleIcon />}
              >
                最終スケジュールを確認
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* 最適化実行前の説明 */}
      {!hasResults && !isLoading && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              最適化について
            </Typography>
            <Typography variant="body2" paragraph>
              ルート最適化では以下の要素を考慮して、最も効率的な送迎ルートを計算します：
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon><TimeIcon /></ListItemIcon>
                <ListItemText primary="ゲストの希望ピックアップ時間" />
              </ListItem>
              <ListItem>
                <ListItemIcon><LocationIcon /></ListItemIcon>
                <ListItemText primary="ホテルの位置と移動距離" />
              </ListItem>
              <ListItem>
                <ListItemIcon><CarIcon /></ListItemIcon>
                <ListItemText primary="車両の収容能力と稼働状況" />
              </ListItem>
              <ListItem>
                <ListItemIcon><SpeedIcon /></ListItemIcon>
                <ListItemText primary="交通状況と環境条件" />
              </ListItem>
            </List>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default RouteOptimizer;