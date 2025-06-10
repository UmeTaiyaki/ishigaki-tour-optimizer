// RouteOptimizer.js - ルート最適化コンポーネント（エラー修正版）
import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Button,
  Alert, CircularProgress, Divider, Chip, Paper,
  List, ListItem, ListItemText, ListItemIcon,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Accordion, AccordionSummary, AccordionDetails, LinearProgress
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
  CheckCircle as CheckCircleIcon,
  ExpandMore as ExpandMoreIcon,
  Hotel as HotelIcon,
  Navigation as NavigationIcon
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
  const [expandedRoute, setExpandedRoute] = useState(false);

  // 安全な配列操作のためのヘルパー関数
  const safeReduce = (array, reducer, initialValue) => {
    if (!Array.isArray(array) || array.length === 0) {
      return initialValue;
    }
    return array.reduce(reducer, initialValue);
  };

  const safeFilter = (array, predicate) => {
    if (!Array.isArray(array)) {
      return [];
    }
    return array.filter(predicate);
  };

  const safeMap = (array, mapper) => {
    if (!Array.isArray(array)) {
      return [];
    }
    return array.map(mapper);
  };

  // 統計計算（安全版）
  const totalGuests = safeReduce(guests, (sum, guest) => sum + (guest?.people || 0), 0);
  const totalCapacity = safeReduce(vehicles, (sum, vehicle) => sum + (vehicle?.capacity || 0), 0);
  const availableVehicles = safeFilter(vehicles, v => v?.status === 'available' || !v?.status);

  const canOptimize = guests.length > 0 && availableVehicles.length > 0;
  const hasResults = Array.isArray(optimizedRoutes) && optimizedRoutes.length > 0;

  const handleOptimize = () => {
    if (onOptimize && canOptimize) {
      onOptimize();
    }
  };

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

  const getStatusIcon = () => {
    const color = getOptimizationStatusColor();
    if (color === 'success') return <CheckCircleIcon />;
    if (color === 'error') return <WarningIcon />;
    return <WarningIcon />;
  };

  // ルート詳細の表示
  const renderRouteDetails = (route, index) => {
    if (!route || typeof route !== 'object') {
      return null;
    }

    const pickupDetails = route.pickup_details || [];
    const vehicle = route.vehicle || {};
    
    return (
      <Accordion 
        key={route.route_id || index}
        expanded={expandedRoute === index}
        onChange={() => setExpandedRoute(expandedRoute === index ? false : index)}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            <CarIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="subtitle1">
                {vehicle.name || `車両${index + 1}`} ({vehicle.driver_name || 'ドライバー未設定'})
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {pickupDetails.length}箇所 • {route.total_distance || 0}km • {route.total_people || 0}名
              </Typography>
            </Box>
            <Chip 
              label={`効率: ${route.efficiency_score || 0}%`}
              color={route.efficiency_score > 80 ? 'success' : route.efficiency_score > 60 ? 'warning' : 'error'}
              size="small"
            />
          </Box>
        </AccordionSummary>
        
        <AccordionDetails>
          <Box sx={{ width: '100%' }}>
            {/* 車両情報 */}
            <Card variant="outlined" sx={{ mb: 2 }}>
              <CardContent sx={{ pb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  車両情報
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2">
                      <strong>車両:</strong> {vehicle.name || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2">
                      <strong>ドライバー:</strong> {vehicle.driver_name || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2">
                      <strong>定員:</strong> {vehicle.capacity || 0}名
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2">
                      <strong>乗車人数:</strong> {route.total_people || 0}名
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* ピックアップ詳細 */}
            <Typography variant="subtitle2" gutterBottom>
              ピックアップ詳細
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>順序</TableCell>
                    <TableCell>ゲスト</TableCell>
                    <TableCell>ホテル</TableCell>
                    <TableCell>人数</TableCell>
                    <TableCell>時刻</TableCell>
                    <TableCell>ステータス</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {safeMap(pickupDetails, (pickup, pickupIndex) => (
                    <TableRow key={pickupIndex}>
                      <TableCell>{pickup.order || pickupIndex + 1}</TableCell>
                      <TableCell>{pickup.guest_name || 'N/A'}</TableCell>
                      <TableCell>{pickup.hotel_name || 'N/A'}</TableCell>
                      <TableCell>{pickup.people_count || 0}名</TableCell>
                      <TableCell>{pickup.pickup_time || 'N/A'}</TableCell>
                      <TableCell>
                        <Chip
                          label={pickup.status || 'unknown'}
                          color={
                            pickup.status === 'optimal' ? 'success' :
                            pickup.status === 'early' ? 'warning' :
                            pickup.status === 'late' ? 'error' : 'default'
                          }
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* ルート統計 */}
            <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Chip icon={<NavigationIcon />} label={`${route.total_distance || 0}km`} variant="outlined" />
              <Chip icon={<TimeIcon />} label={`${route.total_time || 0}分`} variant="outlined" />
              <Chip icon={<PersonIcon />} label={`${route.total_people || 0}名`} variant="outlined" />
              {route.activity_arrival_time && (
                <Chip icon={<CheckCircleIcon />} label={`到着: ${route.activity_arrival_time}`} variant="outlined" />
              )}
            </Box>
          </Box>
        </AccordionDetails>
      </Accordion>
    );
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
        icon={getStatusIcon()}
      >
        {getOptimizationStatusMessage()}
      </Alert>

      {/* 環境情報 */}
      {environmentalData && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              環境情報
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Chip label={`天候: ${environmentalData.weather || '不明'}`} />
              <Chip label={`気温: ${environmentalData.temperature || '--'}°C`} />
              <Chip label={`風速: ${environmentalData.wind_speed || '--'}m/s`} />
              <Chip label={`潮汐: ${environmentalData.tide_level || '--'}m`} />
            </Box>
          </CardContent>
        </Card>
      )}

      {/* 統計サマリー */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                総ゲスト数
              </Typography>
              <Typography variant="h4">
                {guests.length}組
              </Typography>
              <Typography variant="caption">
                ({totalGuests}名)
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                利用可能車両
              </Typography>
              <Typography variant="h4">
                {availableVehicles.length}台
              </Typography>
              <Typography variant="caption">
                (総定員: {totalCapacity}名)
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                座席利用率
              </Typography>
              <Typography variant="h4">
                {totalCapacity > 0 ? Math.round((totalGuests / totalCapacity) * 100) : 0}%
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={totalCapacity > 0 ? Math.min((totalGuests / totalCapacity) * 100, 100) : 0}
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                最適化状態
              </Typography>
              <Typography variant="h4">
                {hasResults ? '完了' : '待機中'}
              </Typography>
              <Typography variant="caption">
                {hasResults ? `${optimizedRoutes.length}ルート` : 'ルートなし'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 最適化結果 */}
      {hasResults ? (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              最適化結果
            </Typography>
            
            {/* 結果サマリー */}
            <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <Typography variant="body2" color="textSecondary">総ルート数</Typography>
                  <Typography variant="h6">{optimizedRoutes.length}</Typography>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Typography variant="body2" color="textSecondary">総移動距離</Typography>
                  <Typography variant="h6">
                    {safeReduce(optimizedRoutes, (sum, route) => sum + (route?.total_distance || 0), 0).toFixed(1)}km
                  </Typography>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Typography variant="body2" color="textSecondary">総所要時間</Typography>
                  <Typography variant="h6">
                    {safeReduce(optimizedRoutes, (sum, route) => sum + (route?.total_time || 0), 0)}分
                  </Typography>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Typography variant="body2" color="textSecondary">平均効率</Typography>
                  <Typography variant="h6">
                    {optimizedRoutes.length > 0 
                      ? Math.round(safeReduce(optimizedRoutes, (sum, route) => sum + (route?.efficiency_score || 0), 0) / optimizedRoutes.length)
                      : 0}%
                  </Typography>
                </Grid>
              </Grid>
            </Box>

            {/* ルート詳細リスト */}
            <Box>
              {safeMap(optimizedRoutes, (route, index) => renderRouteDetails(route, index))}
            </Box>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <RouteIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="textSecondary" gutterBottom>
              ルート最適化を実行してください
            </Typography>
            <Typography variant="body2" color="textSecondary">
              ゲストと車両を登録後、「ルート最適化実行」ボタンをクリックしてください
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default RouteOptimizer;