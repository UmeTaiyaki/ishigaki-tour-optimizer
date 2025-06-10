import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, Button, Divider, List, ListItem, ListItemText,
  IconButton, Tooltip, Stack
} from '@mui/material';
import {
  Schedule as ScheduleIcon,
  DirectionsCar as CarIcon,
  Person as PersonIcon,
  LocationOn as LocationIcon,
  AccessTime as TimeIcon,
  Print as PrintIcon,
  FileDownload as DownloadIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon
} from '@mui/icons-material';

const FinalSchedule = ({
  optimizedRoutes,
  tourData,
  guests,
  vehicles,
  environmentalData
}) => {
  const [warnings, setWarnings] = useState([]);
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    analyzeSchedule();
  }, [optimizedRoutes, guests, vehicles]);

  const analyzeSchedule = () => {
    const newWarnings = [];
    const newRecommendations = [];

    if (!optimizedRoutes || optimizedRoutes.length === 0) {
      return;
    }

    // 定員オーバーチェック
    optimizedRoutes.forEach((route, index) => {
      const vehicle = vehicles[index];
      const totalPassengers = route.route.reduce((sum, stop) => sum + stop.num_people, 0);
      
      if (totalPassengers > vehicle?.capacity) {
        newWarnings.push({
          type: 'overcapacity',
          message: `${route.vehicle_name}: 定員オーバー (${totalPassengers}名/${vehicle?.capacity}名)`,
          severity: 'error'
        });
      }
    });

    // 時間の妥当性チェック
    optimizedRoutes.forEach((route) => {
      route.route.forEach((stop) => {
        if (stop.time_compliance === 'late') {
          newWarnings.push({
            type: 'time_late',
            message: `${stop.name}: 希望時間より遅い (${stop.pickup_time})`,
            severity: 'warning'
          });
        } else if (stop.time_compliance === 'early') {
          newWarnings.push({
            type: 'time_early',
            message: `${stop.name}: 希望時間より早い (${stop.pickup_time})`,
            severity: 'info'
          });
        }
      });
    });

    // 推奨事項
    if (environmentalData?.weather?.condition === 'rainy') {
      newRecommendations.push('雨天のため、移動時間に余裕を持ってください');
    }

    if (environmentalData?.weather?.wind_speed > 10) {
      newRecommendations.push('強風のため、海上アクティビティにご注意ください');
    }

    const totalDistance = optimizedRoutes.reduce((sum, route) => sum + route.total_distance, 0);
    if (totalDistance > 100) {
      newRecommendations.push('総移動距離が長いため、燃料と時間に余裕を持ってください');
    }

    setWarnings(newWarnings);
    setRecommendations(newRecommendations);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    // 実際の実装ではPDF生成APIを呼び出し
    alert('PDF出力機能は実装中です');
  };

  const getComplianceColor = (compliance) => {
    switch (compliance) {
      case 'acceptable': return 'success';
      case 'early': return 'warning';
      case 'late': return 'error';
      default: return 'default';
    }
  };

  const getComplianceIcon = (compliance) => {
    switch (compliance) {
      case 'acceptable': return <CheckIcon />;
      case 'early': return <WarningIcon />;
      case 'late': return <ErrorIcon />;
      default: return <CheckIcon />;
    }
  };

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
    <Box sx={{ p: 2 }}>
      {/* ヘッダー */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center' }}>
          <ScheduleIcon sx={{ mr: 1 }} />
          最終スケジュール
        </Typography>
        
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={handlePrint}
          >
            印刷
          </Button>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
          >
            PDF出力
          </Button>
        </Stack>
      </Box>

      {/* ツアー概要 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                ツアー概要
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="text.secondary">日付</Typography>
                  <Typography variant="body1">{tourData.date}</Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="text.secondary">アクティビティ</Typography>
                  <Typography variant="body1">{tourData.activityType}</Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="text.secondary">開始時間</Typography>
                  <Typography variant="body1">{tourData.startTime}</Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="text.secondary">総参加者</Typography>
                  <Typography variant="body1">
                    {guests.reduce((sum, guest) => sum + guest.people, 0)}名
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 警告・推奨事項 */}
      {(warnings.length > 0 || recommendations.length > 0) && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {warnings.length > 0 && (
            <Grid item xs={12} md={6}>
              <Alert severity="warning">
                <Typography variant="subtitle2" gutterBottom>
                  注意事項
                </Typography>
                <List dense>
                  {warnings.map((warning, index) => (
                    <ListItem key={index} sx={{ py: 0 }}>
                      <ListItemText primary={warning.message} />
                    </ListItem>
                  ))}
                </List>
              </Alert>
            </Grid>
          )}
          
          {recommendations.length > 0 && (
            <Grid item xs={12} md={6}>
              <Alert severity="info">
                <Typography variant="subtitle2" gutterBottom>
                  推奨事項
                </Typography>
                <List dense>
                  {recommendations.map((rec, index) => (
                    <ListItem key={index} sx={{ py: 0 }}>
                      <ListItemText primary={rec} />
                    </ListItem>
                  ))}
                </List>
              </Alert>
            </Grid>
          )}
        </Grid>
      )}

      {/* 車両別スケジュール */}
      <Grid container spacing={3}>
        {optimizedRoutes.map((route, routeIndex) => (
          <Grid item xs={12} key={routeIndex}>
            <Card>
              <CardContent>
                {/* 車両ヘッダー */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CarIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">
                      {route.vehicle_name}
                    </Typography>
                    <Chip
                      label={`${route.route.length}箇所`}
                      size="small"
                      sx={{ ml: 2 }}
                    />
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Chip
                      label={`総距離: ${route.total_distance}km`}
                      variant="outlined"
                      size="small"
                    />
                    <Chip
                      label={`所要時間: ${route.estimated_duration}`}
                      variant="outlined"
                      size="small"
                    />
                    <Chip
                      label={`効率: ${route.efficiency_score}%`}
                      variant="outlined"
                      size="small"
                      color={route.efficiency_score > 80 ? 'success' : route.efficiency_score > 60 ? 'warning' : 'error'}
                    />
                  </Box>
                </Box>

                {/* ピックアップスケジュール */}
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell width="60">順番</TableCell>
                        <TableCell>時間</TableCell>
                        <TableCell>ゲスト名</TableCell>
                        <TableCell>ホテル</TableCell>
                        <TableCell align="center">人数</TableCell>
                        <TableCell>希望時間</TableCell>
                        <TableCell align="center">時間適合</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {route.route.map((stop, stopIndex) => (
                        <TableRow key={stopIndex} hover>
                          <TableCell>
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center'
                            }}>
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  bgcolor: 'primary.main', 
                                  color: 'white', 
                                  borderRadius: '50%', 
                                  width: 24, 
                                  height: 24, 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  justifyContent: 'center',
                                  fontSize: '0.875rem',
                                  fontWeight: 'bold'
                                }}
                              >
                                {stopIndex + 1}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <TimeIcon sx={{ mr: 1, fontSize: 18, color: 'text.secondary' }} />
                              <Typography variant="body2" fontWeight="bold">
                                {stop.pickup_time}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <PersonIcon sx={{ mr: 1, fontSize: 18, color: 'text.secondary' }} />
                              {stop.name}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <LocationIcon sx={{ mr: 1, fontSize: 18, color: 'text.secondary' }} />
                              {stop.hotel_name}
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={`${stop.num_people}名`}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {stop.preferred_pickup_start} - {stop.preferred_pickup_end}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title={
                              stop.time_compliance === 'acceptable' ? '時間内' :
                              stop.time_compliance === 'early' ? '希望時間より早い' :
                              stop.time_compliance === 'late' ? '希望時間より遅い' : '不明'
                            }>
                              <Chip
                                icon={getComplianceIcon(stop.time_compliance)}
                                label={
                                  stop.time_compliance === 'acceptable' ? 'OK' :
                                  stop.time_compliance === 'early' ? '早' :
                                  stop.time_compliance === 'late' ? '遅' : '?'
                                }
                                size="small"
                                color={getComplianceColor(stop.time_compliance)}
                                variant="outlined"
                              />
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* 車両サマリー */}
                <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="body2" color="text.secondary">総乗客数</Typography>
                      <Typography variant="body1">
                        {route.route.reduce((sum, stop) => sum + stop.num_people, 0)}名 / {route.capacity}名
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="body2" color="text.secondary">ピックアップ時間</Typography>
                      <Typography variant="body1">
                        {route.route.length > 0 ? route.route[0].pickup_time : '-'} 開始
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="body2" color="text.secondary">到着予定時間</Typography>
                      <Typography variant="body1">
                        {tourData.startTime} 到着予定
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="body2" color="text.secondary">ドライバー</Typography>
                      <Typography variant="body1">
                        {vehicles[routeIndex]?.driver || 'ドライバー'}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* 全体サマリー */}
      <Grid container spacing={2} sx={{ mt: 3 }}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                全体サマリー
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="text.secondary">総車両数</Typography>
                  <Typography variant="h6">{optimizedRoutes.length}台</Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="text.secondary">総移動距離</Typography>
                  <Typography variant="h6">
                    {optimizedRoutes.reduce((sum, route) => sum + route.total_distance, 0).toFixed(1)}km
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="text.secondary">平均効率スコア</Typography>
                  <Typography variant="h6">
                    {optimizedRoutes.length > 0 ? 
                      (optimizedRoutes.reduce((sum, route) => sum + route.efficiency_score, 0) / optimizedRoutes.length).toFixed(1) + '%' :
                      '0%'
                    }
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="text.secondary">総ピックアップ箇所</Typography>
                  <Typography variant="h6">
                    {optimizedRoutes.reduce((sum, route) => sum + route.route.length, 0)}箇所
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default FinalSchedule;