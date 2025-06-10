// components/FinalSchedule.js - 🎯 完全版（修正済み）

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Alert, Button, Stack,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, Divider, List, ListItem, ListItemText, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, Tabs, Tab,
  IconButton, Tooltip, Badge, LinearProgress, Stepper, Step, StepLabel,
  Accordion, AccordionSummary, AccordionDetails, FormControlLabel, Switch, 
  Select, MenuItem, FormControl, InputLabel, Fab, Zoom, Collapse, 
  ListItemIcon, ListItemSecondaryAction, CircularProgress
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
  Error as ErrorIcon,
  Phone as PhoneIcon,
  Message as MessageIcon,
  Email as EmailIcon,
  QrCode as QrCodeIcon,
  Navigation as NavigationIcon,
  Speed as SpeedIcon,
  Route as RouteIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  Refresh as RefreshIcon,
  Share as ShareIcon,
  Map as MapIcon,
  Timeline as TimelineChartIcon,
  Assignment as AssignmentIcon,
  Notifications as NotificationsIcon,
  ExpandMore as ExpandMoreIcon,
  DriveEta as DriveEtaIcon,
  Groups as GroupsIcon,
  Hotel as HotelIcon,
  WatchLater as WatchLaterIcon,
  TrendingUp as TrendingUpIcon,
  Warning as EmergencyIcon, // EmergencyIconの代替
  LocalShipping as ShippingIcon,
  CloudDownload as CloudDownloadIcon,
  Visibility as VisibilityIcon,
  WhatsApp as WhatsAppIcon
} from '@mui/icons-material';

// PDF生成ユーティリティ（簡易版）
const generatePDF = async (format, data) => {
  try {
    // 動的インポートでjsPDFを読み込み
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF('p', 'mm', 'a4');
    
    // 基本的なPDF生成
    let yPos = 20;
    
    // ヘッダー
    doc.setFontSize(20);
    doc.text('石垣島ツアー 送迎スケジュール', 20, yPos);
    yPos += 15;
    
    doc.setFontSize(12);
    doc.text(`日付: ${data.tourData.date} | アクティビティ: ${data.tourData.activityType}`, 20, yPos);
    yPos += 10;
    doc.text(`開始時間: ${data.tourData.startTime} | 総参加者: ${data.guests.reduce((sum, guest) => sum + guest.people, 0)}名`, 20, yPos);
    yPos += 20;
    
    // 車両別詳細
    data.optimizedRoutes.forEach((route, index) => {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(14);
      doc.text(`車両 ${index + 1}: ${route.vehicle_name}`, 20, yPos);
      yPos += 10;
      
      doc.setFontSize(10);
      route.route.forEach((stop) => {
        doc.text(`${stop.pickup_time} - ${stop.name} (${stop.hotel_name}) ${stop.num_people}名`, 25, yPos);
        yPos += 6;
      });
      yPos += 10;
    });
    
    // 警告・推奨事項
    if (data.warnings && data.warnings.length > 0) {
      if (yPos > 200) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(14);
      doc.text('注意事項:', 20, yPos);
      yPos += 10;
      
      doc.setFontSize(10);
      data.warnings.forEach((warning) => {
        doc.text(`• ${warning.message}`, 25, yPos);
        yPos += 6;
      });
      yPos += 10;
    }
    
    if (data.recommendations && data.recommendations.length > 0) {
      if (yPos > 200) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(14);
      doc.text('推奨事項:', 20, yPos);
      yPos += 10;
      
      doc.setFontSize(10);
      data.recommendations.forEach((rec) => {
        doc.text(`• ${rec.message}`, 25, yPos);
        yPos += 6;
      });
    }
    
    // QRコード説明
    if (yPos > 230) {
      doc.addPage();
      yPos = 20;
    }
    doc.setFontSize(12);
    doc.text('QRコード: スケジュール確認用', 20, yPos);
    doc.text('https://app.ishigaki-tour.com/schedule/', 20, yPos + 10);
    
    const filename = `schedule_${format}_${data.tourData.date}_${Date.now()}.pdf`;
    doc.save(filename);
    
    return { success: true, filename };
  } catch (error) {
    console.error('PDF生成エラー:', error);
    return { success: false, error: error.message };
  }
};

// QRコード生成ユーティリティ
const generateQRCode = (data) => {
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data)}`;
};

// WhatsApp送信ユーティリティ
const sendWhatsAppMessage = (phoneNumber, message) => {
  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
  window.open(whatsappUrl, '_blank');
};

// ゲストのピックアップ情報検索
const findGuestPickupInfo = (guest, optimizedRoutes, vehicles) => {
  for (const [index, route] of optimizedRoutes.entries()) {
    const stop = route.route.find(s => s.name === guest.name);
    if (stop) {
      return {
        time: stop.pickup_time,
        vehicle: route.vehicle_name,
        driver: vehicles[index]?.driver || 'ドライバー'
      };
    }
  }
  return null;
};

// 統計計算ユーティリティ
const calculateStatistics = (optimizedRoutes, guests) => {
  if (!optimizedRoutes?.length) return { totalVehicles: 0, totalDistance: 0, averageEfficiency: 0 };

  return {
    totalVehicles: optimizedRoutes.length,
    totalDistance: optimizedRoutes.reduce((sum, route) => sum + route.total_distance, 0).toFixed(1),
    averageEfficiency: (optimizedRoutes.reduce((sum, route) => sum + route.efficiency_score, 0) / optimizedRoutes.length).toFixed(1),
    totalGuests: guests.reduce((sum, guest) => sum + guest.people, 0),
    totalStops: optimizedRoutes.reduce((sum, route) => sum + route.route.length, 0)
  };
};

// 🎯 メインコンポーネント
const FinalSchedule = ({
  optimizedRoutes = [],
  tourData = {},
  guests = [],
  vehicles = [],
  environmentalData = null
}) => {
  // ========== State Management ==========
  const [warnings, setWarnings] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [realtimeTracking, setRealtimeTracking] = useState(false);
  const [progressData, setProgressData] = useState({});
  const [exportDialog, setExportDialog] = useState(false);
  const [exportFormat, setExportFormat] = useState('comprehensive');
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [communicationSettings, setCommunicationSettings] = useState({
    whatsapp: true,
    sms: false,
    email: true,
    autoNotify: true
  });
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const intervalRef = useRef(null);

  // ========== Effects ==========
  useEffect(() => {
    if (optimizedRoutes?.length > 0) {
      analyzeSchedule();
      initializeProgressData();
    }
  }, [optimizedRoutes, guests, vehicles]);

  useEffect(() => {
    if (realtimeTracking) {
      startRealtimeTracking();
    } else {
      stopRealtimeTracking();
    }
    return () => stopRealtimeTracking();
  }, [realtimeTracking]);

  // ========== Core Functions ==========
  const analyzeSchedule = useCallback(() => {
    const newWarnings = [];
    const newRecommendations = [];

    if (!optimizedRoutes || optimizedRoutes.length === 0) {
      return;
    }

    // 定員チェック
    optimizedRoutes.forEach((route, index) => {
      const vehicle = vehicles[index];
      const totalPassengers = route.route.reduce((sum, stop) => sum + stop.num_people, 0);
      
      if (totalPassengers > (vehicle?.capacity || 8)) {
        newWarnings.push({
          type: 'overcapacity',
          severity: 'error',
          message: `${route.vehicle_name}: 定員オーバー (${totalPassengers}名/${vehicle?.capacity || 8}名)`,
          vehicle_id: route.vehicle_id,
          action_required: true
        });
      }

      // 時間制約チェック
      route.route.forEach((stop, stopIndex) => {
        if (stop.time_compliance === 'late') {
          newWarnings.push({
            type: 'time_late',
            severity: 'warning',
            message: `${stop.name}: 希望時間より遅い (${stop.pickup_time})`,
            stop_index: stopIndex,
            suggested_action: '出発時間を早める or 順序変更'
          });
        }
      });

      // 効率性チェック
      if (route.efficiency_score < 70) {
        newRecommendations.push({
          type: 'efficiency',
          message: `${route.vehicle_name}: 効率スコア低下 (${route.efficiency_score}%)`,
          suggestion: 'ルート順序の最適化を検討'
        });
      }
    });

    // 環境要因チェック
    if (environmentalData) {
      if (environmentalData.weather?.condition === 'rainy') {
        newRecommendations.push({
          type: 'weather',
          message: '雨天予報のため、移動時間に15-20%の余裕を追加することを推奨'
        });
      }

      if (environmentalData.weather?.wind_speed > 10) {
        newWarnings.push({
          type: 'weather',
          severity: 'warning',
          message: '強風警報: 海上アクティビティの安全性を再確認してください'
        });
      }
    }

    setWarnings(newWarnings);
    setRecommendations(newRecommendations);
  }, [optimizedRoutes, guests, vehicles, environmentalData]);

  const initializeProgressData = useCallback(() => {
    if (!optimizedRoutes?.length) return;
    
    const progress = {};
    optimizedRoutes.forEach((route, index) => {
      const vehicleId = route.vehicle_id || `vehicle_${index}`;
      progress[vehicleId] = {
        current_stop: 0,
        total_stops: route.route.length,
        status: 'ready',
        last_update: new Date(),
        location: { 
          lat: route.departure_lat || 24.3336, 
          lng: route.departure_lng || 124.1543 
        },
        estimated_arrival: route.route[0]?.pickup_time || '07:00'
      };
    });
    setProgressData(progress);
  }, [optimizedRoutes]);

  const startRealtimeTracking = useCallback(() => {
    intervalRef.current = setInterval(() => {
      updateVehicleProgress();
    }, 30000); // 30秒間隔
  }, []);

  const stopRealtimeTracking = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const updateVehicleProgress = useCallback(() => {
    setProgressData(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(vehicleId => {
        const current = updated[vehicleId];
        if (current.status === 'in_progress' && Math.random() > 0.7) {
          if (current.current_stop < current.total_stops) {
            updated[vehicleId] = {
              ...current,
              current_stop: current.current_stop + 1,
              last_update: new Date()
            };
          }
        }
      });
      return updated;
    });
  }, []);

  // ========== PDF Generation ==========
  const handleGeneratePDF = async (format) => {
    setIsGeneratingPDF(true);
    try {
      const data = {
        optimizedRoutes,
        tourData,
        guests,
        vehicles,
        environmentalData,
        warnings,
        recommendations
      };
      
      const result = await generatePDF(format, data);
      
      if (result.success) {
        alert(`PDF生成完了: ${result.filename}`);
      } else {
        alert(`PDF生成エラー: ${result.error}`);
      }
    } catch (error) {
      alert(`PDF生成中にエラーが発生しました: ${error.message}`);
    } finally {
      setIsGeneratingPDF(false);
      setExportDialog(false);
    }
  };

  // ========== Communication Functions ==========
  const sendNotifications = useCallback(async () => {
    if (!communicationSettings.autoNotify) return;

    for (const guest of guests) {
      const pickupInfo = findGuestPickupInfo(guest, optimizedRoutes, vehicles);
      if (!pickupInfo) continue;

      const message = `${guest.name}様、${tourData.date}のピックアップは${pickupInfo.time}です。ホテル: ${guest.hotel_name}`;

      try {
        if (communicationSettings.whatsapp && guest.phone) {
          sendWhatsAppMessage(guest.phone, message);
        }
        
        if (communicationSettings.email && guest.email) {
          console.log('Email sent:', guest.email, message);
        }

        if (communicationSettings.sms && guest.phone) {
          console.log('SMS sent:', guest.phone, message);
        }
      } catch (error) {
        console.error('通知送信エラー:', error);
      }
    }
  }, [guests, optimizedRoutes, vehicles, tourData, communicationSettings]);

  // ========== Helper Functions ==========
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'ready': return 'info';
      case 'in_progress': return 'warning';
      case 'completed': return 'success';
      case 'delayed': return 'error';
      default: return 'default';
    }
  };

  // ========== Render Guards ==========
  if (!optimizedRoutes || optimizedRoutes.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <CarIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          スケジュールが生成されていません
        </Typography>
        <Typography variant="body2" color="text.secondary">
          ゲスト情報と車両情報を入力してルートを最適化してください
        </Typography>
      </Box>
    );
  }

  const stats = calculateStatistics(optimizedRoutes, guests);

  // ========== Main Render ==========
  return (
    <Box sx={{ p: 2 }}>
      {/* 🎯 ヘッダー & コントロール */}
      <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <ScheduleIcon sx={{ mr: 2, fontSize: 32 }} />
              <Box>
                <Typography variant="h4" fontWeight="bold">
                  最終スケジュール
                </Typography>
                <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                  {tourData.date} | {tourData.activityType} | {stats.totalGuests}名参加
                </Typography>
              </Box>
            </Box>
            
            <Stack direction="row" spacing={1}>
              <FormControlLabel
                control={
                  <Switch
                    checked={realtimeTracking}
                    onChange={(e) => setRealtimeTracking(e.target.checked)}
                    color="default"
                  />
                }
                label="リアルタイム追跡"
                sx={{ color: 'white' }}
              />
              <Tooltip title="PDF出力">
                <IconButton 
                  color="inherit" 
                  onClick={() => setExportDialog(true)}
                  sx={{ bgcolor: 'rgba(255,255,255,0.1)' }}
                >
                  <DownloadIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="印刷">
                <IconButton 
                  color="inherit" 
                  onClick={() => window.print()}
                  sx={{ bgcolor: 'rgba(255,255,255,0.1)' }}
                >
                  <PrintIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="通知送信">
                <IconButton 
                  color="inherit" 
                  onClick={sendNotifications}
                  sx={{ bgcolor: 'rgba(255,255,255,0.1)' }}
                >
                  <NotificationsIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          </Box>

          {/* 📊 クイック統計 */}
          <Grid container spacing={3}>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h5" fontWeight="bold">{stats.totalVehicles}</Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>車両</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h5" fontWeight="bold">{stats.totalDistance}km</Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>総距離</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h5" fontWeight="bold">{stats.averageEfficiency}%</Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>平均効率</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h5" fontWeight="bold">{stats.totalStops}</Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>ピックアップ箇所</Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* 🚨 警告・推奨事項 */}
      {(warnings.length > 0 || recommendations.length > 0) && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {warnings.length > 0 && (
            <Grid item xs={12} md={6}>
              <Alert 
                severity="warning" 
                sx={{ height: '100%' }}
                action={
                  <Badge badgeContent={warnings.length} color="error">
                    <WarningIcon />
                  </Badge>
                }
              >
                <Typography variant="subtitle2" gutterBottom>
                  ⚠️ 注意事項 ({warnings.length}件)
                </Typography>
                <List dense sx={{ pt: 0 }}>
                  {warnings.slice(0, 3).map((warning, index) => (
                    <ListItem key={index} sx={{ py: 0, px: 0 }}>
                      <ListItemText 
                        primary={warning.message}
                        primaryTypographyProps={{ variant: 'body2' }}
                      />
                    </ListItem>
                  ))}
                  {warnings.length > 3 && (
                    <ListItem sx={{ py: 0, px: 0 }}>
                      <ListItemText 
                        primary={`その他 ${warnings.length - 3}件...`}
                        primaryTypographyProps={{ variant: 'body2', fontStyle: 'italic' }}
                      />
                    </ListItem>
                  )}
                </List>
              </Alert>
            </Grid>
          )}
          
          {recommendations.length > 0 && (
            <Grid item xs={12} md={6}>
              <Alert 
                severity="info"
                sx={{ height: '100%' }}
                action={
                  <Badge badgeContent={recommendations.length} color="info">
                    <TrendingUpIcon />
                  </Badge>
                }
              >
                <Typography variant="subtitle2" gutterBottom>
                  💡 推奨事項 ({recommendations.length}件)
                </Typography>
                <List dense sx={{ pt: 0 }}>
                  {recommendations.slice(0, 3).map((rec, index) => (
                    <ListItem key={index} sx={{ py: 0, px: 0 }}>
                      <ListItemText 
                        primary={rec.message}
                        primaryTypographyProps={{ variant: 'body2' }}
                      />
                    </ListItem>
                  ))}
                  {recommendations.length > 3 && (
                    <ListItem sx={{ py: 0, px: 0 }}>
                      <ListItemText 
                        primary={`その他 ${recommendations.length - 3}件...`}
                        primaryTypographyProps={{ variant: 'body2', fontStyle: 'italic' }}
                      />
                    </ListItem>
                  )}
                </List>
              </Alert>
            </Grid>
          )}
        </Grid>
      )}

      {/* 📱 タブナビゲーション */}
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={(e, val) => setActiveTab(val)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab icon={<RouteIcon />} label="車両別スケジュール" />
          <Tab icon={<TimelineChartIcon />} label="タイムライン" />
          <Tab icon={<MapIcon />} label="進捗追跡" />
          <Tab icon={<MessageIcon />} label="通信管理" />
        </Tabs>
      </Paper>

      {/* 🚗 Tab 0: 車両別スケジュール */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          {optimizedRoutes.map((route, routeIndex) => {
            const vehicle = vehicles[routeIndex];
            const vehicleId = route.vehicle_id || `vehicle_${routeIndex}`;
            const progress = progressData[vehicleId] || {};
            
            return (
              <Grid item xs={12} lg={6} key={routeIndex}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    {/* 車両ヘッダー */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <CarIcon sx={{ mr: 1, color: 'primary.main' }} />
                        <Box>
                          <Typography variant="h6" fontWeight="bold">
                            {route.vehicle_name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            ドライバー: {vehicle?.driver || 'ドライバー'}
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip
                          label={`${route.efficiency_score}%`}
                          color={route.efficiency_score > 80 ? 'success' : route.efficiency_score > 60 ? 'warning' : 'error'}
                          size="small"
                        />
                        <Chip
                          label={progress.status || 'ready'}
                          color={getStatusColor(progress.status)}
                          size="small"
                        />
                      </Stack>
                    </Box>

                    {/* 進捗バー */}
                    {realtimeTracking && progress.total_stops > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2">
                            進捗: {progress.current_stop || 0}/{progress.total_stops}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {Math.round(((progress.current_stop || 0) / progress.total_stops) * 100)}%
                          </Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={((progress.current_stop || 0) / progress.total_stops) * 100}
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                      </Box>
                    )}

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
                            <TableCell align="center">状態</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {route.route.map((stop, stopIndex) => {
                            const isCompleted = realtimeTracking && (progress.current_stop || 0) > stopIndex;
                            const isCurrent = realtimeTracking && (progress.current_stop || 0) === stopIndex;
                            
                            return (
                              <TableRow 
                                key={stopIndex} 
                                hover
                                sx={{
                                  bgcolor: isCompleted ? 'success.lighter' : isCurrent ? 'warning.lighter' : 'inherit'
                                }}
                              >
                                <TableCell>
                                  <Box sx={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center'
                                  }}>
                                    <Typography 
                                      variant="body2" 
                                      sx={{ 
                                        bgcolor: isCompleted ? 'success.main' : isCurrent ? 'warning.main' : 'primary.main', 
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
                                      {isCompleted ? '✓' : stopIndex + 1}
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
                                    <Typography variant="body2">
                                      {stop.name}
                                    </Typography>
                                  </Box>
                                </TableCell>
                                <TableCell>
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <HotelIcon sx={{ mr: 1, fontSize: 18, color: 'text.secondary' }} />
                                    <Typography variant="body2">
                                      {stop.hotel_name}
                                    </Typography>
                                  </Box>
                                </TableCell>
                                <TableCell align="center">
                                  <Chip
                                    icon={<GroupsIcon />}
                                    label={`${stop.num_people}名`}
                                    size="small"
                                    variant="outlined"
                                  />
                                </TableCell>
                                <TableCell align="center">
                                  <Tooltip title={
                                    stop.time_compliance === 'acceptable' ? '希望時間内' :
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
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>

                    {/* 車両サマリー */}
                    <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Grid container spacing={2}>
                        <Grid item xs={6} sm={3}>
                          <Typography variant="body2" color="text.secondary">総乗客数</Typography>
                          <Typography variant="body1">
                            {route.route.reduce((sum, stop) => sum + stop.num_people, 0)}名 / {vehicle?.capacity || 8}名
                          </Typography>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Typography variant="body2" color="text.secondary">開始時間</Typography>
                          <Typography variant="body1">
                            {route.route.length > 0 ? route.route[0].pickup_time : '-'}
                          </Typography>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Typography variant="body2" color="text.secondary">移動距離</Typography>
                          <Typography variant="body1">
                            {route.total_distance.toFixed(1)}km
                          </Typography>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Typography variant="body2" color="text.secondary">到着予定</Typography>
                          <Typography variant="body1">
                            {tourData.startTime} 到着予定
                          </Typography>
                        </Grid>
                      </Grid>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* ⏱️ Tab 1: タイムライン表示 */}
      {activeTab === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <TimelineChartIcon sx={{ mr: 1 }} />
              全体タイムライン
            </Typography>
            
            <Box sx={{ p: 2 }}>
              {/* 簡易タイムライン */}
              <Stepper orientation="vertical">
                <Step>
                  <StepLabel>
                    <Typography variant="h6" color="primary">
                      {optimizedRoutes[0]?.route[0]?.pickup_time || '07:00'} - 送迎開始
                    </Typography>
                  </StepLabel>
                </Step>
                
                {optimizedRoutes.map((route, routeIndex) => 
                  route.route.map((stop, stopIndex) => (
                    <Step key={`${routeIndex}-${stopIndex}`}>
                      <StepLabel>
                        <Typography variant="body1">
                          {stop.pickup_time} - {stop.name} ({route.vehicle_name})
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {stop.hotel_name} ({stop.num_people}名)
                        </Typography>
                      </StepLabel>
                    </Step>
                  ))
                )}
                
                <Step>
                  <StepLabel>
                    <Typography variant="h6" color="success.main">
                      {tourData.startTime} - {tourData.activityType} 開始
                    </Typography>
                  </StepLabel>
                </Step>
              </Stepper>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* 🗺️ Tab 2: 進捗追跡 */}
      {activeTab === 2 && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                <NavigationIcon sx={{ mr: 1 }} />
                リアルタイム進捗追跡
              </Typography>
              
              <Stack direction="row" spacing={1}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={realtimeTracking}
                      onChange={(e) => setRealtimeTracking(e.target.checked)}
                    />
                  }
                  label="自動更新"
                />
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={updateVehicleProgress}
                  disabled={!realtimeTracking}
                >
                  手動更新
                </Button>
              </Stack>
            </Box>

            {!realtimeTracking && (
              <Alert severity="info" sx={{ mb: 3 }}>
                リアルタイム追跡を有効にすると、車両の現在位置と進捗をモニタリングできます。
              </Alert>
            )}

            <Grid container spacing={3}>
              {optimizedRoutes.map((route, index) => {
                const vehicleId = route.vehicle_id || `vehicle_${index}`;
                const progress = progressData[vehicleId] || {};
                const vehicle = vehicles[index];
                
                return (
                  <Grid item xs={12} md={6} key={index}>
                    <Card>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {route.vehicle_name}
                          </Typography>
                          <Stack direction="row" spacing={1}>
                            <Chip
                              label={progress.status || 'ready'}
                              color={getStatusColor(progress.status)}
                              size="small"
                            />
                            <IconButton size="small">
                              <PhoneIcon />
                            </IconButton>
                          </Stack>
                        </Box>

                        {/* 進捗インジケーター */}
                        <Box sx={{ mb: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2">
                              進捗: {progress.current_stop || 0}/{progress.total_stops || route.route.length}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              最終更新: {progress.last_update ? new Date(progress.last_update).toLocaleTimeString() : '-'}
                            </Typography>
                          </Box>
                          <LinearProgress 
                            variant="determinate" 
                            value={progress.total_stops > 0 ? ((progress.current_stop || 0) / progress.total_stops) * 100 : 0}
                            sx={{ height: 8, borderRadius: 4 }}
                          />
                        </Box>

                        {/* 現在の状態 */}
                        <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, mb: 2 }}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            現在の状態
                          </Typography>
                          {(progress.current_stop || 0) < route.route.length ? (
                            <Box>
                              <Typography variant="body1" fontWeight="bold">
                                次のピックアップ: {route.route[progress.current_stop || 0]?.name}
                              </Typography>
                              <Typography variant="body2">
                                予定時間: {route.route[progress.current_stop || 0]?.pickup_time}
                              </Typography>
                              <Typography variant="body2">
                                場所: {route.route[progress.current_stop || 0]?.hotel_name}
                              </Typography>
                            </Box>
                          ) : (
                            <Typography variant="body1" fontWeight="bold" color="success.main">
                              全ピックアップ完了
                            </Typography>
                          )}
                        </Box>

                        {/* 車両情報 */}
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">ドライバー</Typography>
                            <Typography variant="body2">{vehicle?.driver || 'ドライバー'}</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">車両タイプ</Typography>
                            <Typography variant="body2">{vehicle?.vehicleType || 'mini_van'}</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">乗車率</Typography>
                            <Typography variant="body2">
                              {route.route.reduce((sum, stop) => sum + stop.num_people, 0)}/{vehicle?.capacity || 8}名
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">推定到着</Typography>
                            <Typography variant="body2">{progress.estimated_arrival || tourData.startTime}</Typography>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* 📱 Tab 3: 通信管理 */}
      {activeTab === 3 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <MessageIcon sx={{ mr: 1 }} />
                  通信設定
                </Typography>
                
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <WhatsAppIcon color={communicationSettings.whatsapp ? 'success' : 'disabled'} />
                    </ListItemIcon>
                    <ListItemText 
                      primary="WhatsApp通知" 
                      secondary="ピックアップ情報をWhatsAppで送信"
                    />
                    <ListItemSecondaryAction>
                      <Switch
                        checked={communicationSettings.whatsapp}
                        onChange={(e) => setCommunicationSettings(prev => ({
                          ...prev,
                          whatsapp: e.target.checked
                        }))}
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                  
                  <ListItem>
                    <ListItemIcon>
                      <MessageIcon color={communicationSettings.sms ? 'primary' : 'disabled'} />
                    </ListItemIcon>
                    <ListItemText 
                      primary="SMS通知" 
                      secondary="ピックアップ情報をSMSで送信"
                    />
                    <ListItemSecondaryAction>
                      <Switch
                        checked={communicationSettings.sms}
                        onChange={(e) => setCommunicationSettings(prev => ({
                          ...prev,
                          sms: e.target.checked
                        }))}
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                  
                  <ListItem>
                    <ListItemIcon>
                      <EmailIcon color={communicationSettings.email ? 'info' : 'disabled'} />
                    </ListItemIcon>
                    <ListItemText 
                      primary="メール通知" 
                      secondary="詳細スケジュールをメールで送信"
                    />
                    <ListItemSecondaryAction>
                      <Switch
                        checked={communicationSettings.email}
                        onChange={(e) => setCommunicationSettings(prev => ({
                          ...prev,
                          email: e.target.checked
                        }))}
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                  
                  <ListItem>
                    <ListItemIcon>
                      <NotificationsIcon color={communicationSettings.autoNotify ? 'warning' : 'disabled'} />
                    </ListItemIcon>
                    <ListItemText 
                      primary="自動通知" 
                      secondary="スケジュール生成時に自動送信"
                    />
                    <ListItemSecondaryAction>
                      <Switch
                        checked={communicationSettings.autoNotify}
                        onChange={(e) => setCommunicationSettings(prev => ({
                          ...prev,
                          autoNotify: e.target.checked
                        }))}
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                </List>

                <Box sx={{ mt: 3 }}>
                  <Button
                    variant="contained"
                    fullWidth
                    startIcon={<NotificationsIcon />}
                    onClick={sendNotifications}
                    disabled={!communicationSettings.whatsapp && !communicationSettings.sms && !communicationSettings.email}
                  >
                    全ゲストに通知送信
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <QrCodeIcon sx={{ mr: 1 }} />
                  QRコード生成
                </Typography>
                
                <Typography variant="body2" color="text.secondary" paragraph>
                  ゲストがスマートフォンでスケジュールを確認できるQRコードを生成します。
                </Typography>

                <Box sx={{ textAlign: 'center', p: 3, bgcolor: 'grey.50', borderRadius: 1, mb: 2 }}>
                  <img 
                    src={generateQRCode(`${window.location.origin}/schedule/${tourData.date}`)}
                    alt="Schedule QR Code"
                    style={{ maxWidth: '200px', height: 'auto' }}
                  />
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    スケジュール確認用QRコード
                  </Typography>
                </Box>

                <Stack spacing={2}>
                  <Button
                    variant="outlined"
                    startIcon={<ShareIcon />}
                    fullWidth
                  >
                    QRコードを共有
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    fullWidth
                  >
                    QRコードをダウンロード
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          
          {/* ゲスト別通信履歴 */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  ゲスト別通信履歴
                </Typography>
                
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>ゲスト名</TableCell>
                        <TableCell>ホテル</TableCell>
                        <TableCell>電話番号</TableCell>
                        <TableCell>メールアドレス</TableCell>
                        <TableCell align="center">WhatsApp</TableCell>
                        <TableCell align="center">SMS</TableCell>
                        <TableCell align="center">メール</TableCell>
                        <TableCell align="center">アクション</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {guests.map((guest, index) => (
                        <TableRow key={index} hover>
                          <TableCell>{guest.name}</TableCell>
                          <TableCell>{guest.hotel_name}</TableCell>
                          <TableCell>{guest.phone || '-'}</TableCell>
                          <TableCell>{guest.email || '-'}</TableCell>
                          <TableCell align="center">
                            {guest.phone ? (
                              <IconButton 
                                size="small" 
                                color="success"
                                onClick={() => {
                                  const pickupInfo = findGuestPickupInfo(guest, optimizedRoutes, vehicles);
                                  if (pickupInfo) {
                                    const message = `${guest.name}様、${tourData.date}のピックアップは${pickupInfo.time}です。`;
                                    sendWhatsAppMessage(guest.phone, message);
                                  }
                                }}
                              >
                                <WhatsAppIcon />
                              </IconButton>
                            ) : (
                              <Typography variant="caption" color="text.disabled">-</Typography>
                            )}
                          </TableCell>
                          <TableCell align="center">
                            <IconButton size="small" disabled={!guest.phone}>
                              <MessageIcon />
                            </IconButton>
                          </TableCell>
                          <TableCell align="center">
                            <IconButton size="small" disabled={!guest.email}>
                              <EmailIcon />
                            </IconButton>
                          </TableCell>
                          <TableCell align="center">
                            <Button size="small" variant="outlined">
                              詳細送信
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* 🖨️ PDF出力ダイアログ */}
      <Dialog open={exportDialog} onClose={() => setExportDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          PDF出力
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" paragraph>
            出力形式を選択してください。各形式に適したレイアウトでPDFを生成します。
          </Typography>
          
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>出力形式</InputLabel>
            <Select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value)}
              label="出力形式"
            >
              <MenuItem value="comprehensive">
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <AssignmentIcon sx={{ mr: 1 }} />
                  総合レポート（全情報）
                </Box>
              </MenuItem>
              <MenuItem value="driver_guide">
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <DriveEtaIcon sx={{ mr: 1 }} />
                  ドライバー用運行指示書
                </Box>
              </MenuItem>
              <MenuItem value="guest_info">
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <GroupsIcon sx={{ mr: 1 }} />
                  ゲスト用ピックアップ案内
                </Box>
              </MenuItem>
              <MenuItem value="management_report">
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TrendingUpIcon sx={{ mr: 1 }} />
                  管理者用分析レポート
                </Box>
              </MenuItem>
            </Select>
          </FormControl>

          <Alert severity="info">
            <Typography variant="body2">
              {exportFormat === 'comprehensive' && '全ての情報を含む詳細なレポートを生成します。'}
              {exportFormat === 'driver_guide' && 'ドライバー向けの運行指示書を生成します。'}
              {exportFormat === 'guest_info' && 'ゲスト向けのピックアップ案内を生成します。'}
              {exportFormat === 'management_report' && '管理者向けの分析レポートを生成します。'}
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialog(false)}>
            キャンセル
          </Button>
          <Button 
            variant="contained" 
            onClick={() => handleGeneratePDF(exportFormat)}
            startIcon={isGeneratingPDF ? <CircularProgress size={16} /> : <DownloadIcon />}
            disabled={isGeneratingPDF}
          >
            {isGeneratingPDF ? 'PDF生成中...' : 'PDF生成'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 🚨 緊急連絡FAB */}
      <Zoom in={realtimeTracking}>
        <Fab
          color="error"
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            zIndex: 1000
          }}
          onClick={() => {
            // 緊急連絡機能
            window.open('tel:090-XXXX-XXXX');
          }}
        >
          <EmergencyIcon />
        </Fab>
      </Zoom>
    </Box>
  );
};

export default FinalSchedule;