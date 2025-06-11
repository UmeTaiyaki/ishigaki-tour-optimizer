// FinalSchedule.js - AI最適化ダッシュボード統合版（Phase 4B）
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Alert, Button, Stack,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, Divider, List, ListItem, ListItemText, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, Tabs, Tab,
  IconButton, Tooltip, Badge, LinearProgress, Stepper, Step, StepLabel,
  Accordion, AccordionSummary, AccordionDetails, FormControlLabel, Switch, 
  Select, MenuItem, FormControl, InputLabel, Fab, Zoom, Collapse, 
  ListItemIcon, ListItemSecondaryAction, CircularProgress, Avatar,
  Container, Skeleton, CardHeader, CardActions
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
  TableChart as ExcelIcon,
  Psychology as AiIcon,
  CompareArrows as CompareIcon,
  Memory as MemoryIcon,
  Science as ScienceIcon,
  BarChart as ChartIcon,
  AutoFixHigh as AutoFixIcon
} from '@mui/icons-material';

// 🤖 新機能：AI最適化APIクライアント
import * as api from '../api/client';

// 🎨 アルゴリズム情報マッピング
const ALGORITHM_INFO = {
  'genetic': {
    name: '遺伝的アルゴリズム',
    icon: <ScienceIcon />,
    color: 'success',
    description: '高精度最適化（効率90%+期待）',
    processingTime: '1-3秒',
    recommendedFor: '高精度要求時'
  },
  'simulated_annealing': {
    name: 'シミュレーテッドアニーリング',
    icon: <MemoryIcon />,
    color: 'warning',
    description: 'バランス型最適化（効率80-90%）',
    processingTime: '0.5-1秒',
    recommendedFor: '中規模問題'
  },
  'nearest_neighbor': {
    name: '最近傍法',
    icon: <RouteIcon />,
    color: 'primary',
    description: '高速基本最適化（効率75-85%）',
    processingTime: '0.1秒',
    recommendedFor: '基本・緊急時'
  }
};

// 🎯 メインコンポーネント
const FinalSchedule = ({
  optimizedRoutes = [],
  tourData = {},
  guests = [],
  vehicles = [],
  environmentalData = null,
  onExport,
  onOptimizationUpdate // 新機能：最適化結果更新コールバック
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
  
  // 🤖 新機能：AI最適化関連State
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('nearest_neighbor');
  const [availableAlgorithms, setAvailableAlgorithms] = useState([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationLogs, setOptimizationLogs] = useState([]);
  const [aiSystemStatus, setAiSystemStatus] = useState(null);
  const [comparisonResults, setComparisonResults] = useState(null);
  const [isComparing, setIsComparing] = useState(false);
  const [optimizationProgress, setOptimizationProgress] = useState(0);
  const [currentGeneration, setCurrentGeneration] = useState(0);
  const [maxGenerations, setMaxGenerations] = useState(50);
  const [showAiDashboard, setShowAiDashboard] = useState(false);
  const [optimizationHistory, setOptimizationHistory] = useState([]);

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

  // 🤖 新機能：AI システム初期化
  useEffect(() => {
    initializeAiSystem();
  }, []);

  // ========== AI System Functions ==========
  const initializeAiSystem = async () => {
    try {
      // システム状態確認
      const systemStatus = await api.getSystemStatus();
      setAiSystemStatus(systemStatus);

      // 利用可能アルゴリズム取得
      const algorithms = await api.getAvailableAlgorithms();
      if (algorithms.success) {
        setAvailableAlgorithms(algorithms.algorithms);
        setSelectedAlgorithm(algorithms.default_algorithm);
      }

      // 最適化ログ取得
      const logs = await api.getOptimizationLogs(20);
      if (logs.success) {
        setOptimizationLogs(logs.logs);
      }
    } catch (error) {
      console.error('AI システム初期化エラー:', error);
    }
  };

  const executeOptimization = async (algorithm = selectedAlgorithm) => {
    if (!tourData.guests?.length || !tourData.vehicles?.length) {
      alert('ゲストと車両の情報が必要です');
      return;
    }

    setIsOptimizing(true);
    setOptimizationProgress(0);
    setCurrentGeneration(0);

    try {
      // プログレス表示のシミュレーション（遺伝的アルゴリズムの場合）
      if (algorithm === 'genetic') {
        const progressInterval = setInterval(() => {
          setOptimizationProgress(prev => {
            const newProgress = prev + (100 / maxGenerations);
            setCurrentGeneration(Math.floor((newProgress / 100) * maxGenerations));
            return Math.min(newProgress, 95); // 95%で停止、完了時に100%
          });
        }, 60); // 3秒間でプログレス表示

        setTimeout(() => clearInterval(progressInterval), 3000);
      }

      const result = await api.optimizeWithAlgorithm(tourData, algorithm);
      
      if (result.success) {
        // 最適化成功
        setOptimizationProgress(100);
        setCurrentGeneration(maxGenerations);
        
        // 結果を親コンポーネントに通知
        if (onOptimizationUpdate) {
          onOptimizationUpdate(result.routes, result);
        }

        // ログ追加
        const newLog = {
          timestamp: new Date().toISOString(),
          algorithm: algorithm,
          efficiency_score: result.efficiency_score,
          optimization_time: result.optimization_time,
          success: true
        };
        setOptimizationHistory(prev => [newLog, ...prev.slice(0, 9)]);

        // 最新ログ取得
        setTimeout(() => {
          api.getOptimizationLogs(20).then(logs => {
            if (logs.success) {
              setOptimizationLogs(logs.logs);
            }
          });
        }, 1000);

        alert(`🎉 ${ALGORITHM_INFO[algorithm]?.name}最適化完了！\n効率スコア: ${result.efficiency_score.toFixed(1)}%`);
      } else {
        throw new Error(result.error || '最適化に失敗しました');
      }
    } catch (error) {
      console.error('最適化エラー:', error);
      alert(`❌ 最適化エラー: ${error.message}`);
    } finally {
      setIsOptimizing(false);
      setTimeout(() => {
        setOptimizationProgress(0);
        setCurrentGeneration(0);
      }, 2000);
    }
  };

  const executeComparison = async () => {
    if (!tourData.guests?.length || !tourData.vehicles?.length) {
      alert('ゲストと車両の情報が必要です');
      return;
    }

    setIsComparing(true);
    setComparisonResults(null);

    try {
      const result = await api.compareAlgorithms(tourData);
      
      if (result.success) {
        setComparisonResults(result);
        alert(`🏆 比較完了！最良アルゴリズム: ${ALGORITHM_INFO[result.best_algorithm]?.name}`);
      } else {
        throw new Error('比較に失敗しました');
      }
    } catch (error) {
      console.error('比較エラー:', error);
      alert(`❌ 比較エラー: ${error.message}`);
    } finally {
      setIsComparing(false);
    }
  };

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

      // 効率性チェック
      if ((route.efficiency_score || 0) < 70) {
        newRecommendations.push({
          type: 'efficiency',
          message: `${route.vehicle_name}: 効率向上余地あり (${route.efficiency_score?.toFixed(1) || 0}%)`,
          suggestion: 'AI最適化アルゴリズムを試してください',
          action: () => setShowAiDashboard(true)
        });
      }
    });

    setWarnings(newWarnings);
    setRecommendations(newRecommendations);
  }, [optimizedRoutes, vehicles]);

  const initializeProgressData = useCallback(() => {
    const newProgressData = {};
    optimizedRoutes.forEach(route => {
      newProgressData[route.vehicle_id] = {
        currentStop: 0,
        totalStops: route.route?.length || 0,
        status: 'pending'
      };
    });
    setProgressData(newProgressData);
  }, [optimizedRoutes]);

  const startRealtimeTracking = () => {
    intervalRef.current = setInterval(() => {
      // リアルタイム追跡ロジック
      setProgressData(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(vehicleId => {
          if (updated[vehicleId].status === 'in_progress') {
            // 進捗シミュレーション
            updated[vehicleId].currentStop = Math.min(
              updated[vehicleId].currentStop + 0.1,
              updated[vehicleId].totalStops
            );
          }
        });
        return updated;
      });
    }, 5000);
  };

  const stopRealtimeTracking = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // 統計計算
  const calculateStatistics = (routes, guestList) => {
    if (!routes?.length) return { totalVehicles: 0, totalDistance: 0, averageEfficiency: 0 };

    return {
      totalVehicles: routes.length,
      totalDistance: routes.reduce((sum, route) => sum + (route.total_distance || 0), 0).toFixed(1),
      averageEfficiency: (routes.reduce((sum, route) => sum + (route.efficiency_score || 0), 0) / routes.length).toFixed(1),
      totalGuests: guestList.reduce((sum, guest) => sum + (guest.people || guest.num_people || 0), 0),
      totalStops: routes.reduce((sum, route) => sum + (route.route?.length || 0), 0)
    };
  };

  // 空のスケジュール表示
  if (!optimizedRoutes?.length) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <AiIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h5" gutterBottom>
          最適化スケジュールがありません
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          ルート最適化を実行してスケジュールを生成してください
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
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* 🎯 ヘッダー & AI コントロール */}
      <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <ScheduleIcon sx={{ mr: 2, fontSize: 32 }} />
              <Box>
                <Typography variant="h4" fontWeight="bold">
                  AI最適化スケジュール
                </Typography>
                <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                  {tourData.date} | {tourData.activityType} | {stats.totalGuests}名参加
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.5 }}>
                  {tourData.departureLocation?.name || '出発地未設定'} → {tourData.activityLocation?.name || '目的地未設定'}
                </Typography>
              </Box>
            </Box>
            
            <Stack direction="row" spacing={1} alignItems="center">
              {aiSystemStatus?.success && (
                <Tooltip title="AI最適化エンジン稼働中">
                  <Chip
                    icon={<CheckIcon />}
                    label="AI Ready"
                    color="success"
                    variant="outlined"
                    sx={{ color: 'white', borderColor: 'white' }}
                  />
                </Tooltip>
              )}
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
                startIcon={<AiIcon />}
                onClick={() => setShowAiDashboard(!showAiDashboard)}
                sx={{ color: 'white', borderColor: 'white' }}
              >
                AI Dashboard
              </Button>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={() => setExportDialog(true)}
                sx={{ color: 'white', borderColor: 'white' }}
              >
                エクスポート
              </Button>
            </Stack>
          </Box>

          {/* 🤖 AI ダッシュボード */}
          <Collapse in={showAiDashboard}>
            <Card sx={{ mt: 2, bgcolor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: 'white', mb: 2, display: 'flex', alignItems: 'center' }}>
                  <AiIcon sx={{ mr: 1 }} /> AI最適化コントロール
                </Typography>
                
                <Grid container spacing={2}>
                  {/* アルゴリズム選択 */}
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel sx={{ color: 'white' }}>アルゴリズム</InputLabel>
                      <Select
                        value={selectedAlgorithm}
                        onChange={(e) => setSelectedAlgorithm(e.target.value)}
                        sx={{ color: 'white', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'white' } }}
                      >
                        {availableAlgorithms.map((algo) => (
                          <MenuItem key={algo.name} value={algo.name}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              {ALGORITHM_INFO[algo.name]?.icon}
                              <Box sx={{ ml: 1 }}>
                                <Typography variant="body2">{algo.display_name}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {algo.processing_time}
                                </Typography>
                              </Box>
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* 実行ボタン */}
                  <Grid item xs={12} md={3}>
                    <Stack spacing={1}>
                      <Button
                        variant="contained"
                        fullWidth
                        size="small"
                        startIcon={isOptimizing ? <CircularProgress size={16} color="inherit" /> : <AutoFixIcon />}
                        onClick={() => executeOptimization()}
                        disabled={isOptimizing}
                        sx={{ bgcolor: 'white', color: 'primary.main' }}
                      >
                        {isOptimizing ? '最適化中...' : '最適化実行'}
                      </Button>
                      <Button
                        variant="outlined"
                        fullWidth
                        size="small"
                        startIcon={isComparing ? <CircularProgress size={16} color="inherit" /> : <CompareIcon />}
                        onClick={executeComparison}
                        disabled={isComparing}
                        sx={{ color: 'white', borderColor: 'white' }}
                      >
                        {isComparing ? '比較中...' : '3アルゴリズム比較'}
                      </Button>
                    </Stack>
                  </Grid>

                  {/* 進捗表示 */}
                  <Grid item xs={12} md={6}>
                    {isOptimizing && selectedAlgorithm === 'genetic' && (
                      <Box>
                        <Typography variant="body2" sx={{ color: 'white', mb: 1 }}>
                          世代進化: {currentGeneration}/{maxGenerations}
                        </Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={optimizationProgress} 
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                      </Box>
                    )}
                    {comparisonResults && (
                      <Box>
                        <Typography variant="body2" sx={{ color: 'white', mb: 1 }}>
                          🏆 最良: {ALGORITHM_INFO[comparisonResults.best_algorithm]?.name} ({comparisonResults.best_efficiency.toFixed(1)}%)
                        </Typography>
                        <Stack direction="row" spacing={1}>
                          {Object.entries(comparisonResults.comparison_results).map(([algo, result]) => (
                            <Chip
                              key={algo}
                              label={`${ALGORITHM_INFO[algo]?.name}: ${result.efficiency_score?.toFixed(1) || 'Error'}%`}
                              color={algo === comparisonResults.best_algorithm ? 'success' : 'default'}
                              size="small"
                              sx={{ color: 'white' }}
                            />
                          ))}
                        </Stack>
                      </Box>
                    )}
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Collapse>
        </CardContent>
      </Card>

      {/* 📊 統計サマリー */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <CarIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4" fontWeight="bold" color="primary">
                {stats.totalVehicles}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                車両数
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <RouteIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
              <Typography variant="h4" fontWeight="bold" color="info.main">
                {stats.totalDistance}km
              </Typography>
              <Typography variant="body2" color="text.secondary">
                総距離
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <TrendingUpIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h4" fontWeight="bold" color="success.main">
                {stats.averageEfficiency}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                平均効率
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <GroupsIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
              <Typography variant="h4" fontWeight="bold" color="warning.main">
                {stats.totalGuests}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                参加者数
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 🚨 警告・推奨事項 */}
      {(warnings.length > 0 || recommendations.length > 0) && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {warnings.map((warning, index) => (
            <Grid item xs={12} md={6} key={`warning-${index}`}>
              <Alert severity={warning.severity} action={
                warning.action_required && (
                  <Button color="inherit" size="small">
                    修正
                  </Button>
                )
              }>
                {warning.message}
              </Alert>
            </Grid>
          ))}
          {recommendations.map((rec, index) => (
            <Grid item xs={12} md={6} key={`rec-${index}`}>
              <Alert severity="info" action={
                rec.action && (
                  <Button color="inherit" size="small" onClick={rec.action}>
                    試す
                  </Button>
                )
              }>
                {rec.message}
                {rec.suggestion && (
                  <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                    💡 {rec.suggestion}
                  </Typography>
                )}
              </Alert>
            </Grid>
          ))}
        </Grid>
      )}

      {/* 📋 車両別スケジュール */}
      <Card>
        <CardHeader
          title="車両別スケジュール詳細"
          avatar={<DriveEtaIcon />}
          action={
            <Stack direction="row" spacing={1}>
              <IconButton onClick={() => setExpandedVehicle(expandedVehicle ? null : 'all')}>
                <ExpandMoreIcon sx={{ transform: expandedVehicle ? 'rotate(180deg)' : 'none' }} />
              </IconButton>
            </Stack>
          }
        />
        <CardContent>
          {optimizedRoutes.map((route, routeIndex) => (
            <Accordion 
              key={route.vehicle_id || routeIndex}
              expanded={expandedVehicle === 'all' || expandedVehicle === route.vehicle_id}
              onChange={() => setExpandedVehicle(
                expandedVehicle === route.vehicle_id ? null : route.vehicle_id
              )}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                    <CarIcon />
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6">
                      {route.vehicle_name || `車両${routeIndex + 1}`}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      ドライバー: {route.driver} | 距離: {route.total_distance?.toFixed(1) || 0}km
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Chip
                      label={`効率: ${route.efficiency_score?.toFixed(1) || 0}%`}
                      color={route.efficiency_score >= 80 ? 'success' : route.efficiency_score >= 70 ? 'warning' : 'error'}
                      size="small"
                    />
                    {realtimeTracking && (
                      <LinearProgress
                        variant="determinate"
                        value={(progressData[route.vehicle_id]?.currentStop / progressData[route.vehicle_id]?.totalStops * 100) || 0}
                        sx={{ mt: 1, width: 100 }}
                      />
                    )}
                  </Box>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>時間</TableCell>
                        <TableCell>地点</TableCell>
                        <TableCell>ゲスト</TableCell>
                        <TableCell>人数</TableCell>
                        <TableCell>ステータス</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {route.route?.map((stop, stopIndex) => (
                        <TableRow key={stopIndex}>
                          <TableCell>
                            <Typography variant="body2" fontWeight="bold">
                              {stop.pickup_time || stop.arrival_time}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <LocationIcon sx={{ mr: 1, fontSize: 16 }} />
                              {stop.hotel_name || stop.name}
                            </Box>
                          </TableCell>
                          <TableCell>{stop.guest_name || '-'}</TableCell>
                          <TableCell>
                            <Chip 
                              label={`${stop.num_people || 0}名`} 
                              size="small" 
                              color="primary" 
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            {realtimeTracking ? (
                              <Chip
                                label={
                                  stopIndex < (progressData[route.vehicle_id]?.currentStop || 0) ? '完了' :
                                  stopIndex === Math.floor(progressData[route.vehicle_id]?.currentStop || 0) ? '進行中' :
                                  '待機'
                                }
                                color={
                                  stopIndex < (progressData[route.vehicle_id]?.currentStop || 0) ? 'success' :
                                  stopIndex === Math.floor(progressData[route.vehicle_id]?.currentStop || 0) ? 'warning' :
                                  'default'
                                }
                                size="small"
                              />
                            ) : (
                              <Chip label="スケジュール済み" color="info" size="small" />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </AccordionDetails>
            </Accordion>
          ))}
        </CardContent>
      </Card>

      {/* 🤖 AI最適化ログ表示（サイドバー風） */}
      {showAiDashboard && optimizationLogs.length > 0 && (
        <Card sx={{ mt: 3 }}>
          <CardHeader
            title="AI最適化ログ"
            avatar={<MemoryIcon />}
            action={
              <IconButton onClick={() => api.getOptimizationLogs(20).then(logs => logs.success && setOptimizationLogs(logs.logs))}>
                <RefreshIcon />
              </IconButton>
            }
          />
          <CardContent>
            <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
              {optimizationLogs.slice(0, 10).map((log, index) => (
                <Box
                  key={index}
                  sx={{
                    p: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    mb: 1,
                    bgcolor: 'background.paper'
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    {new Date(log.timestamp).toLocaleString()}
                  </Typography>
                  <Typography variant="body1">
                    {log.message || `${log.algorithm} - 効率: ${log.efficiency_score?.toFixed(1)}%`}
                  </Typography>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* エクスポートダイアログは既存のものを使用... */}
    </Container>
  );
};

export default FinalSchedule;