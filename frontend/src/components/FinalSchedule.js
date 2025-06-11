// FinalSchedule.js - 完全版（地点管理対応・データ永続化対応）
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Alert, Button, Stack,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, Divider, List, ListItem, ListItemText, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, Tabs, Tab,
  IconButton, Tooltip, Badge, LinearProgress, Stepper, Step, StepLabel,
  Accordion, AccordionSummary, AccordionDetails, FormControlLabel, Switch, 
  Select, MenuItem, FormControl, InputLabel, Fab, Zoom, Collapse, 
  ListItemIcon, ListItemSecondaryAction, CircularProgress, Avatar
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
  LocalShipping as ShippingIcon,
  CloudDownload as CloudDownloadIcon,
  Visibility as VisibilityIcon,
  WhatsApp as WhatsAppIcon,
  Send as SendIcon,
  GetApp as GetAppIcon,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon
} from '@mui/icons-material';

// 車両と効率スコアのマッピング
const getVehicleInfo = (routes, vehicles, index) => {
  if (routes && routes[index]) {
    return {
      ...routes[index],
      driver: routes[index].driver || vehicles[index]?.driver || 'ドライバー'
    };
  }
  return null;
};

// 統計計算ユーティリティ
const calculateStatistics = (optimizedRoutes, guests) => {
  if (!optimizedRoutes?.length) return { totalVehicles: 0, totalDistance: 0, averageEfficiency: 0 };

  return {
    totalVehicles: optimizedRoutes.length,
    totalDistance: optimizedRoutes.reduce((sum, route) => sum + (route.total_distance || 0), 0).toFixed(1),
    averageEfficiency: (optimizedRoutes.reduce((sum, route) => sum + (route.efficiency_score || 0), 0) / optimizedRoutes.length).toFixed(1),
    totalGuests: guests.reduce((sum, guest) => sum + (guest.people || guest.num_people || 0), 0),
    totalStops: optimizedRoutes.reduce((sum, route) => sum + (route.route?.length || 0), 0)
  };
};

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
    doc.text(`開始時間: ${data.tourData.startTime} | 総参加者: ${data.guests.reduce((sum, guest) => sum + (guest.people || guest.num_people || 0), 0)}名`, 20, yPos);
    yPos += 10;
    doc.text(`出発地: ${data.tourData.departureLocation?.name || '未設定'} → 目的地: ${data.tourData.activityLocation?.name || '未設定'}`, 20, yPos);
    yPos += 20;
    
    // 車両別詳細
    data.optimizedRoutes.forEach((route, index) => {
      if (yPos > 250) {
        doc.addPage();
        yPos = 30;
      }
      
      doc.setFontSize(16);
      doc.text(`車両${index + 1}: ${route.vehicle_name} (${route.driver})`, 20, yPos);
      yPos += 10;
      
      doc.setFontSize(10);
      doc.text(`定員: ${route.capacity}名 | 効率スコア: ${route.efficiency_score}%`, 20, yPos);
      yPos += 10;
      
      // ルート詳細
      if (route.route) {
        route.route.forEach((stop, stopIndex) => {
          if (yPos > 270) {
            doc.addPage();
            yPos = 30;
          }
          
          const stopText = stop.guest_name ? 
            `${stopIndex + 1}. ${stop.pickup_time} - ${stop.guest_name} (${stop.hotel_name}) ${stop.num_people}名` :
            `${stopIndex + 1}. ${stop.arrival_time} - ${stop.name}`;
          
          doc.text(stopText, 25, yPos);
          yPos += 7;
        });
      }
      
      yPos += 10;
    });
    
    return doc;
    
  } catch (error) {
    console.error('PDF生成エラー:', error);
    alert('PDF生成中にエラーが発生しました。ブラウザがPDF生成に対応していない可能性があります。');
    return null;
  }
};

// 🎯 メインコンポーネント
const FinalSchedule = ({
  optimizedRoutes = [],
  tourData = {},
  guests = [],
  vehicles = [],
  environmentalData = null,
  onExport
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
  const [expandedVehicle, setExpandedVehicle] = useState(null);
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
      const totalPassengers = route.route?.reduce((sum, stop) => sum + (stop.num_people || 0), 0) || 0;
      
      if (totalPassengers > (vehicle?.capacity || route.capacity || 8)) {
        newWarnings.push({
          type: 'overcapacity',
          severity: 'error',
          message: `${route.vehicle_name}: 定員オーバー (${totalPassengers}名/${vehicle?.capacity || route.capacity || 8}名)`,
          vehicle_id: route.vehicle_id,
          action_required: true
        });
      }

      // 時間制約チェック
      if (route.route) {
        route.route.forEach((stop, stopIndex) => {
          if (stop.time_compliance === 'late') {
            newWarnings.push({
              type: 'time_late',
              severity: 'warning',
              message: `${stop.guest_name || stop.name}: 希望時間より遅い (${stop.pickup_time || stop.arrival_time})`,
              stop_index: stopIndex,
              suggested_action: '出発時間を早める or 順序変更'
            });
          }
        });
      }

      // 効率性チェック
      if ((route.efficiency_score || 0) < 70) {
        newRecommendations.push({
          type: 'efficiency',
          message: `${route.vehicle_name}: 効率スコア低下 (${route.efficiency_score || 0}%)`,
          suggestion: 'ルート順序の最適化を検討'
        });
      }
    });

    // 環境要因チェック
    if (environmentalData) {
      if (environmentalData.weather?.condition === 'rainy' || environmentalData.weather === 'rainy') {
        newRecommendations.push({
          type: 'weather',
          message: '雨天予報のため、移動時間に15-20%の余裕を追加することを推奨'
        });
      }

      const windSpeed = environmentalData.weather?.wind_speed || environmentalData.wind_speed || 0;
      if (windSpeed > 10) {
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
        total_stops: route.route?.length || 0,
        status: 'ready',
        last_update: new Date(),
        location: { 
          lat: tourData.departureLocation?.lat || 24.3336, 
          lng: tourData.departureLocation?.lng || 124.1543 
        },
        estimated_arrival: route.route?.[0]?.pickup_time || route.route?.[0]?.arrival_time || '07:00'
      };
    });
    setProgressData(progress);
  }, [optimizedRoutes, tourData.departureLocation]);

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
        // 簡易的な進捗シミュレーション
        if (updated[vehicleId].status === 'in_progress') {
          updated[vehicleId].last_update = new Date();
        }
      });
      return updated;
    });
  }, []);

  // PDF生成
  const handleGeneratePDF = async (format = 'comprehensive') => {
    setIsGeneratingPDF(true);
    try {
      const exportData = {
        optimizedRoutes,
        tourData,
        guests,
        vehicles,
        environmentalData,
        warnings,
        recommendations
      };

      const doc = await generatePDF(format, exportData);
      if (doc) {
        doc.save(`石垣島ツアースケジュール_${tourData.date || new Date().toISOString().split('T')[0]}.pdf`);
      }
    } catch (error) {
      console.error('PDF生成エラー:', error);
      alert('PDF生成に失敗しました');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Excel生成（簡易版）
  const handleGenerateExcel = () => {
    try {
      const csvContent = generateCSVContent();
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `石垣島ツアースケジュール_${tourData.date || new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Excel生成エラー:', error);
      alert('Excel生成に失敗しました');
    }
  };

  const generateCSVContent = () => {
    const headers = ['車両名', 'ドライバー', '順番', '時間', 'ゲスト名', 'ホテル名', '人数', '距離', '備考'];
    const rows = [headers.join(',')];

    optimizedRoutes.forEach((route) => {
      if (route.route) {
        route.route.forEach((stop, index) => {
          const row = [
            route.vehicle_name || '',
            route.driver || '',
            index + 1,
            stop.pickup_time || stop.arrival_time || '',
            stop.guest_name || stop.name || '',
            stop.hotel_name || '',
            stop.num_people || '',
            stop.distance_from_prev || '',
            stop.location_type === 'activity' ? 'アクティビティ地点' : ''
          ];
          rows.push(row.join(','));
        });
      }
    });

    return rows.join('\n');
  };

  // WhatsApp通知送信
  const sendWhatsAppNotification = (phoneNumber, message) => {
    const encodedMessage = encodeURIComponent(message);
    const url = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    window.open(url, '_blank');
  };

  // 通知メッセージ生成
  const generateNotificationMessage = (route, stop) => {
    const vehicleName = route.vehicle_name || '車両';
    const driverName = route.driver || 'ドライバー';
    const pickupTime = stop.pickup_time || stop.arrival_time || '未定';
    const location = stop.hotel_name || stop.name || '指定地点';

    return `【石垣島ツアー】${stop.guest_name || 'お客様'}
ピックアップ時間: ${pickupTime}
場所: ${location}
車両: ${vehicleName}
ドライバー: ${driverName}

ロビーでお待ちください。
ご質問は090-XXXX-XXXXまで。`;
  };

  // ステータス表示用関数
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
        <Typography variant="body2" color="text.secondary" mb={2}>
          ゲスト情報と車両情報を入力してルートを最適化してください
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<RouteIcon />} 
          onClick={() => window.location.hash = '#/optimizer'}
        >
          ルート最適化に移動
        </Button>
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
                <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.5 }}>
                  {tourData.departureLocation?.name || '出発地未設定'} → {tourData.activityLocation?.name || '目的地未設定'}
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
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={() => setExportDialog(true)}
                sx={{ color: 'white', borderColor: 'white' }}
              >
                エクスポート
              </Button>
              <Button
                variant="outlined"
                startIcon={<PrintIcon />}
                onClick={() => handleGeneratePDF('comprehensive')}
                disabled={isGeneratingPDF}
                sx={{ color: 'white', borderColor: 'white' }}
              >
                印刷
              </Button>
            </Stack>
          </Box>
          
          {/* 統計情報サマリー */}
          <Grid container spacing={2}>
            <Grid item xs={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h5" fontWeight="bold">{stats.totalVehicles}</Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>車両数</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h5" fontWeight="bold">{stats.totalDistance}km</Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>総距離</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h5" fontWeight="bold">{stats.averageEfficiency}%</Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>平均効率</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h5" fontWeight="bold">{stats.totalStops}</Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>ピックアップ箇所</Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* 警告・推奨事項 */}
      {(warnings.length > 0 || recommendations.length > 0) && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {warnings.length > 0 && (
            <Grid item xs={12} md={6}>
              <Alert severity="warning" sx={{ height: 'fit-content' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  ⚠️ 注意事項 ({warnings.length}件)
                </Typography>
                <List dense>
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
              <Alert severity="info" sx={{ height: 'fit-content' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  💡 推奨事項 ({recommendations.length}件)
                </Typography>
                <List dense>
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
                        <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                          <CarIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="h6" fontWeight="bold">
                            {route.vehicle_name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            ドライバー: {route.driver || vehicle?.driver || 'ドライバー'}
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip
                          label={`${route.efficiency_score || 0}%`}
                          color={(route.efficiency_score || 0) > 80 ? 'success' : (route.efficiency_score || 0) > 60 ? 'warning' : 'error'}
                          variant="outlined"
                        />
                        <IconButton
                          size="small"
                          onClick={() => setExpandedVehicle(expandedVehicle === routeIndex ? null : routeIndex)}
                        >
                          <ExpandMoreIcon 
                            sx={{ 
                              transform: expandedVehicle === routeIndex ? 'rotate(180deg)' : 'rotate(0deg)',
                              transition: 'transform 0.3s'
                            }} 
                          />
                        </IconButton>
                      </Stack>
                    </Box>

                    {/* ルート詳細テーブル */}
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>順番</TableCell>
                            <TableCell>時間</TableCell>
                            <TableCell>ゲスト名</TableCell>
                            <TableCell>ホテル</TableCell>
                            <TableCell align="center">人数</TableCell>
                            <TableCell align="center">状態</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {route.route && route.route.map((stop, stopIndex) => {
                            const isActivityLocation = stop.location_type === 'activity';
                            
                            return (
                              <TableRow 
                                key={stopIndex}
                                sx={{ 
                                  backgroundColor: isActivityLocation ? 'action.hover' : 'inherit',
                                  '&:hover': { backgroundColor: isActivityLocation ? 'action.selected' : 'action.hover' }
                                }}
                              >
                                <TableCell>
                                  <Chip
                                    label={stopIndex + 1}
                                    size="small"
                                    color={isActivityLocation ? 'secondary' : 'primary'}
                                    variant="outlined"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <TimeIcon sx={{ mr: 0.5, fontSize: 16 }} />
                                    <Typography variant="body2" fontWeight="medium">
                                      {stop.pickup_time || stop.arrival_time || '-'}
                                    </Typography>
                                  </Box>
                                </TableCell>
                                <TableCell>
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    {isActivityLocation ? (
                                      <LocationIcon sx={{ mr: 0.5, fontSize: 16, color: 'secondary.main' }} />
                                    ) : (
                                      <PersonIcon sx={{ mr: 0.5, fontSize: 16 }} />
                                    )}
                                    <Typography variant="body2">
                                      {stop.guest_name || stop.name || '未定'}
                                    </Typography>
                                  </Box>
                                </TableCell>
                                <TableCell>
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <HotelIcon sx={{ mr: 0.5, fontSize: 16 }} />
                                    <Typography variant="body2">
                                      {stop.hotel_name || (isActivityLocation ? 'アクティビティ地点' : '-')}
                                    </Typography>
                                  </Box>
                                </TableCell>
                                <TableCell align="center">
                                  {stop.num_people ? (
                                    <Chip
                                      label={`${stop.num_people}名`}
                                      size="small"
                                      color="primary"
                                      variant="outlined"
                                    />
                                  ) : (
                                    <Typography variant="body2" color="text.secondary">
                                      {isActivityLocation ? '-' : 'undefined名'}
                                    </Typography>
                                  )}
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
                    <Collapse in={expandedVehicle === routeIndex}>
                      <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                        <Grid container spacing={2}>
                          <Grid item xs={6} sm={3}>
                            <Typography variant="body2" color="text.secondary">総乗客数</Typography>
                            <Typography variant="body1">
                              {route.route?.reduce((sum, stop) => sum + (stop.num_people || 0), 0) || 0}名 / {route.capacity || vehicle?.capacity || 8}名
                            </Typography>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Typography variant="body2" color="text.secondary">開始時間</Typography>
                            <Typography variant="body1">
                              {route.route && route.route.length > 0 ? 
                                (route.route[0].pickup_time || route.route[0].arrival_time || '未定') : '未定'}
                            </Typography>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Typography variant="body2" color="text.secondary">移動距離</Typography>
                            <Typography variant="body1">
                              {(route.total_distance || 0).toFixed(1)}km
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
                    </Collapse>
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
                      {optimizedRoutes[0]?.route?.[0]?.pickup_time || optimizedRoutes[0]?.route?.[0]?.arrival_time || '07:00'} - 送迎開始
                    </Typography>
                  </StepLabel>
                </Step>
                
                {optimizedRoutes.map((route, routeIndex) => 
                  route.route?.map((stop, stopIndex) => (
                    <Step key={`${routeIndex}-${stopIndex}`}>
                      <StepLabel>
                        <Typography variant="body1">
                          {stop.pickup_time || stop.arrival_time} - {stop.guest_name || stop.name} 
                          {stop.location_type === 'activity' ? ' (アクティビティ地点)' : ` (${route.vehicle_name})`}
                        </Typography>
                      </StepLabel>
                    </Step>
                  ))
                )}
                
                <Step>
                  <StepLabel>
                    <Typography variant="h6" color="success.main">
                      {tourData.startTime || '10:00'} - アクティビティ開始
                    </Typography>
                  </StepLabel>
                </Step>
              </Stepper>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* 📍 Tab 2: 進捗追跡 */}
      {activeTab === 2 && (
        <Grid container spacing={3}>
          {optimizedRoutes.map((route, routeIndex) => {
            const vehicleId = route.vehicle_id || `vehicle_${routeIndex}`;
            const progress = progressData[vehicleId] || {};
            
            return (
              <Grid item xs={12} md={6} key={routeIndex}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">{route.vehicle_name}</Typography>
                      <Chip
                        label={progress.status || 'ready'}
                        color={getStatusColor(progress.status)}
                        variant="outlined"
                      />
                    </Box>
                    
                    <LinearProgress
                      variant="determinate"
                      value={progress.total_stops ? (progress.current_stop / progress.total_stops) * 100 : 0}
                      sx={{ mb: 2 }}
                    />
                    
                    <Typography variant="body2" color="text.secondary">
                      進捗: {progress.current_stop || 0} / {progress.total_stops || 0} 停車地
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      次の到着予定: {progress.estimated_arrival || '未定'}
                    </Typography>
                    
                    <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                      <Button size="small" variant="outlined" startIcon={<PlayIcon />}>
                        開始
                      </Button>
                      <Button size="small" variant="outlined" startIcon={<PauseIcon />}>
                        一時停止
                      </Button>
                      <Button size="small" variant="outlined" startIcon={<MapIcon />}>
                        地図で表示
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* 📱 Tab 3: 通信管理 */}
      {activeTab === 3 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>通信設定</Typography>
                <Stack spacing={2}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={communicationSettings.whatsapp}
                        onChange={(e) => setCommunicationSettings(prev => ({
                          ...prev,
                          whatsapp: e.target.checked
                        }))}
                      />
                    }
                    label="WhatsApp通知"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={communicationSettings.email}
                        onChange={(e) => setCommunicationSettings(prev => ({
                          ...prev,
                          email: e.target.checked
                        }))}
                      />
                    }
                    label="メール通知"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={communicationSettings.autoNotify}
                        onChange={(e) => setCommunicationSettings(prev => ({
                          ...prev,
                          autoNotify: e.target.checked
                        }))}
                      />
                    }
                    label="自動通知"
                  />
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>ゲスト通知</Typography>
                <Stack spacing={2}>
                  {optimizedRoutes.map((route) =>
                    route.route?.filter(stop => stop.guest_name).map((stop, stopIndex) => (
                      <Box
                        key={`${route.vehicle_id}-${stopIndex}`}
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          p: 2,
                          border: 1,
                          borderColor: 'divider',
                          borderRadius: 1
                        }}
                      >
                        <Box>
                          <Typography variant="subtitle2">{stop.guest_name}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {stop.pickup_time} - {stop.hotel_name}
                          </Typography>
                        </Box>
                        <Stack direction="row" spacing={1}>
                          <Button
                            size="small"
                            startIcon={<WhatsAppIcon />}
                            onClick={() => {
                              const message = generateNotificationMessage(route, stop);
                              // 実際の電話番号が必要
                              alert('WhatsApp通知機能は電話番号設定後に利用可能です');
                            }}
                          >
                            WhatsApp
                          </Button>
                          <Button
                            size="small"
                            startIcon={<EmailIcon />}
                            onClick={() => {
                              alert('メール通知機能は今後実装予定です');
                            }}
                          >
                            メール
                          </Button>
                        </Stack>
                      </Box>
                    ))
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* エクスポートダイアログ */}
      <Dialog
        open={exportDialog}
        onClose={() => setExportDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>スケジュールのエクスポート</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>エクスポート形式</InputLabel>
            <Select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value)}
              label="エクスポート形式"
            >
              <MenuItem value="comprehensive">総合PDF</MenuItem>
              <MenuItem value="driver">ドライバー用PDF</MenuItem>
              <MenuItem value="guest">ゲスト用PDF</MenuItem>
              <MenuItem value="excel">Excel/CSV</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialog(false)}>
            キャンセル
          </Button>
          <Button
            variant="contained"
            startIcon={<GetAppIcon />}
            onClick={() => {
              if (exportFormat === 'excel') {
                handleGenerateExcel();
              } else {
                handleGeneratePDF(exportFormat);
              }
              setExportDialog(false);
            }}
            disabled={isGeneratingPDF}
          >
            エクスポート
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FinalSchedule;