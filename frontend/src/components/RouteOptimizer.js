// RouteOptimizer.js - AI最適化統合版（Phase 4B完成）
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Button, Stack,
  Alert, Stepper, Step, StepLabel, StepContent, CircularProgress,
  FormControl, InputLabel, Select, MenuItem, Switch, FormControlLabel,
  Dialog, DialogTitle, DialogContent, DialogActions, Chip, Avatar,
  LinearProgress, Accordion, AccordionSummary, AccordionDetails,
  List, ListItem, ListItemIcon, ListItemText, Divider, Tooltip,
  IconButton, Badge, Container, Paper, Tabs, Tab, Skeleton
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Assessment as AssessmentIcon,
  Science as ScienceIcon,
  Memory as MemoryIcon,
  Route as RouteIcon,
  CompareArrows as CompareIcon,
  Psychology as AiIcon,
  AutoFixHigh as AutoFixIcon,
  Timeline as TimelineIcon,
  TrendingUp as TrendingUpIcon,
  Speed as SpeedIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  ExpandMore as ExpandMoreIcon,
  LocationOn as LocationIcon,
  DirectionsCar as CarIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  EmojiEvents as TrophyIcon,
  Visibility as VisibilityIcon,
  Download as DownloadIcon
} from '@mui/icons-material';

// コンポーネントインポート
import AlgorithmComparisonDashboard from './AlgorithmComparisonDashboard';
import * as api from '../api/client';

// アルゴリズム設定
const ALGORITHM_CONFIGS = {
  genetic: {
    name: '遺伝的アルゴリズム',
    icon: <ScienceIcon />,
    color: '#4caf50',
    description: '進化的計算による高精度最適化',
    expectedTime: '1-3秒',
    expectedEfficiency: '90%+',
    parameters: {
      population_size: 40,
      generations: 75,
      mutation_rate: 0.1,
      crossover_rate: 0.8
    }
  },
  simulated_annealing: {
    name: 'シミュレーテッドアニーリング',
    icon: <MemoryIcon />,
    color: '#ff9800',
    description: '焼きなまし法によるバランス型最適化',
    expectedTime: '0.5-1秒',
    expectedEfficiency: '80-90%',
    parameters: {
      initial_temperature: 200,
      cooling_rate: 0.95,
      max_iterations: 800
    }
  },
  nearest_neighbor: {
    name: '最近傍法',
    icon: <RouteIcon />,
    color: '#2196f3',
    description: '高速基本最適化アルゴリズム',
    expectedTime: '0.1秒',
    expectedEfficiency: '75-85%',
    parameters: {}
  }
};

const RouteOptimizer = ({
  guests = [],
  vehicles = [],
  tourData = {},
  onOptimizationComplete,
  onError
}) => {
  // ========== State Management ==========
  const [activeStep, setActiveStep] = useState(0);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('nearest_neighbor');
  const [availableAlgorithms, setAvailableAlgorithms] = useState([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationProgress, setOptimizationProgress] = useState(0);
  const [currentGeneration, setCurrentGeneration] = useState(0);
  const [maxGenerations, setMaxGenerations] = useState(75);
  const [optimizationResult, setOptimizationResult] = useState(null);
  const [optimizationLogs, setOptimizationLogs] = useState([]);
  const [aiSystemStatus, setAiSystemStatus] = useState(null);
  const [isComparing, setIsComparing] = useState(false);
  const [comparisonResults, setComparisonResults] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [autoSelectBest, setAutoSelectBest] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [optimizationHistory, setOptimizationHistory] = useState([]);
  const [preOptimizationCheck, setPreOptimizationCheck] = useState({
    guestsValid: false,
    vehiclesValid: false,
    locationValid: false,
    allValid: false
  });

  // ========== Effects ==========
  useEffect(() => {
    initializeAiSystem();
  }, []);

  useEffect(() => {
    validateOptimizationRequirements();
  }, [guests, vehicles, tourData]);

  // ========== Core Functions ==========
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
    } catch (error) {
      console.error('AI システム初期化エラー:', error);
      if (onError) onError(error);
    }
  };

  const validateOptimizationRequirements = () => {
    const guestsValid = guests && guests.length > 0;
    const vehiclesValid = vehicles && vehicles.length > 0;
    const locationValid = tourData.activityLocation && 
                         tourData.activityLocation.lat && 
                         tourData.activityLocation.lng;
    
    // 車両データの詳細検証
    const vehiclesLocationValid = vehiclesValid && vehicles.every(vehicle => {
      const hasLocation = vehicle.location && 
                         typeof vehicle.location.lat === 'number' && 
                         typeof vehicle.location.lng === 'number';
      
      if (!hasLocation) {
        console.warn('車両のlocation情報が不正:', vehicle);
      }
      
      return hasLocation;
    });
    
    const allValid = guestsValid && vehiclesValid && vehiclesLocationValid && locationValid;
    
    setPreOptimizationCheck({
      guestsValid,
      vehiclesValid: vehiclesValid && vehiclesLocationValid,
      locationValid,
      allValid
    });
    
    // デバッグ情報
    console.log('🔍 最適化要件チェック:', {
      guestsValid,
      vehiclesValid,
      vehiclesLocationValid,
      locationValid,
      allValid,
      guests: guests?.length || 0,
      vehicles: vehicles?.length || 0,
      vehiclesData: vehicles?.map(v => ({ 
        name: v.name, 
        hasLocation: !!v.location,
        location: v.location 
      }))
    });
  };

  const executeOptimization = async (algorithm = selectedAlgorithm) => {
    if (!preOptimizationCheck.allValid) {
      alert('最適化を実行するには、ゲスト、車両、アクティビティ地点の設定が必要です');
      return;
    }

    // 車両データの事前修復
    const repairedVehicles = vehicles.map((vehicle, index) => {
      let safeLocation = vehicle.location;
      
      // locationが存在しない、またはnull/undefinedの場合
      if (!safeLocation) {
        safeLocation = { lat: 24.3336, lng: 124.1543 };
        console.warn(`車両${vehicle.name || index}のlocationがnullです。デフォルト値を設定:`, safeLocation);
      }
      
      // locationが文字列の場合
      if (typeof safeLocation === 'string') {
        safeLocation = { lat: 24.3336, lng: 124.1543 };
        console.warn(`車両${vehicle.name || index}のlocationが文字列です。デフォルト値を設定:`, safeLocation);
      }
      
      // lat/lngが数値でない場合
      if (typeof safeLocation.lat !== 'number' || typeof safeLocation.lng !== 'number') {
        safeLocation = { lat: 24.3336, lng: 124.1543 };
        console.warn(`車両${vehicle.name || index}のlat/lngが数値ではありません。デフォルト値を設定:`, safeLocation);
      }
      
      return {
        ...vehicle,
        location: safeLocation
      };
    });

    const repairedTourData = {
      ...tourData,
      vehicles: repairedVehicles,
      guests: guests || [],
      activityLocation: tourData.activityLocation || { lat: 24.4167, lng: 124.1556 }
    };

    console.log('🔧 修復後のtourData:', repairedTourData);

    setIsOptimizing(true);
    setOptimizationProgress(0);
    setCurrentGeneration(0);
    setActiveStep(1);

    try {
      // 進捗表示（遺伝的アルゴリズムの場合）
      let progressInterval;
      if (algorithm === 'genetic') {
        const config = ALGORITHM_CONFIGS[algorithm];
        setMaxGenerations(config.parameters.generations);
        
        progressInterval = setInterval(() => {
          setOptimizationProgress(prev => {
            const newProgress = prev + (100 / config.parameters.generations);
            setCurrentGeneration(Math.floor((newProgress / 100) * config.parameters.generations));
            return Math.min(newProgress, 95);
          });
        }, 40); // 3秒で完了するように調整
      }

      const result = await api.optimizeWithAlgorithm(repairedTourData, algorithm);
      
      if (progressInterval) clearInterval(progressInterval);
      
      if (result.success) {
        setOptimizationProgress(100);
        setOptimizationResult(result);
        setActiveStep(2);

        // 履歴追加
        const historyEntry = {
          timestamp: new Date().toISOString(),
          algorithm: algorithm,
          efficiency_score: result.efficiency_score,
          optimization_time: result.optimization_time,
          total_distance: result.total_distance,
          success: true
        };
        setOptimizationHistory(prev => [historyEntry, ...prev.slice(0, 9)]);

        // 親コンポーネントに結果通知
        if (onOptimizationComplete) {
          onOptimizationComplete(result.routes, result);
        }

        // 最新ログ取得
        setTimeout(async () => {
          try {
            const logs = await api.getOptimizationLogs(20);
            if (logs.success) {
              setOptimizationLogs(logs.logs);
            }
          } catch (error) {
            console.error('ログ取得エラー:', error);
          }
        }, 1000);

      } else {
        throw new Error(result.error || '最適化に失敗しました');
      }
    } catch (error) {
      console.error('最適化エラー:', error);
      setActiveStep(0);
      if (onError) onError(error);
      alert(`❌ 最適化エラー: ${error.message}`);
    } finally {
      setIsOptimizing(false);
      setTimeout(() => {
        setOptimizationProgress(0);
        setCurrentGeneration(0);
      }, 3000);
    }
  };

  const executeComparison = async () => {
    if (!preOptimizationCheck.allValid) {
      alert('比較を実行するには、ゲスト、車両、アクティビティ地点の設定が必要です');
      return;
    }

    // 🔧 既存App.jsとの互換性チェック
    if (onOptimize && typeof onOptimize === 'function') {
      // 既存のApp.js handleOptimizeRoute関数を使用
      console.log('🔄 既存App.js onOptimize関数を使用');
      try {
        const optimizationData = {
          ...tourData,
          guests: guests || [],
          vehicles: vehicles || [],
          algorithm: 'nearest_neighbor' // デフォルト
        };
        await onOptimize(optimizationData);
        return;
      } catch (error) {
        console.error('既存onOptimizeでエラー:', error);
        // フォールバックで新しい方式を続行
      }
    }

    setIsComparing(true);
    setComparisonResults(null);
    setTabValue(1); // 比較タブに切り替え

    try {
      const result = await api.compareAlgorithms(repairedTourData);
      
      if (result.success) {
        setComparisonResults(result);
        
        // 自動的に最良アルゴリズムを選択
        if (autoSelectBest && result.best_algorithm) {
          setSelectedAlgorithm(result.best_algorithm);
          
          // 最良アルゴリズムで自動最適化
          setTimeout(() => {
            executeOptimization(result.best_algorithm);
          }, 2000);
        }
      } else {
        throw new Error('比較に失敗しました');
      }
    } catch (error) {
      console.error('比較エラー:', error);
      if (onError) onError(error);
      alert(`❌ 比較エラー: ${error.message}`);
    } finally {
      setIsComparing(false);
    }
  };

  const resetOptimization = () => {
    setActiveStep(0);
    setOptimizationResult(null);
    setOptimizationProgress(0);
    setCurrentGeneration(0);
    setComparisonResults(null);
  };

  // ========== Render Functions ==========
  const renderPreOptimizationCheck = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <CheckIcon sx={{ mr: 1, color: preOptimizationCheck.allValid ? 'success.main' : 'text.secondary' }} />
          最適化前チェック
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <PersonIcon sx={{ mr: 1, color: preOptimizationCheck.guestsValid ? 'success.main' : 'error.main' }} />
              <Typography variant="body2">
                ゲスト情報: {guests.length}名
              </Typography>
              {preOptimizationCheck.guestsValid ? (
                <CheckIcon sx={{ ml: 1, color: 'success.main', fontSize: 16 }} />
              ) : (
                <ErrorIcon sx={{ ml: 1, color: 'error.main', fontSize: 16 }} />
              )}
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <CarIcon sx={{ mr: 1, color: preOptimizationCheck.vehiclesValid ? 'success.main' : 'error.main' }} />
              <Typography variant="body2">
                車両情報: {vehicles.length}台
              </Typography>
              {preOptimizationCheck.vehiclesValid ? (
                <CheckIcon sx={{ ml: 1, color: 'success.main', fontSize: 16 }} />
              ) : (
                <ErrorIcon sx={{ ml: 1, color: 'error.main', fontSize: 16 }} />
              )}
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <LocationIcon sx={{ mr: 1, color: preOptimizationCheck.locationValid ? 'success.main' : 'error.main' }} />
              <Typography variant="body2">
                アクティビティ地点
              </Typography>
              {preOptimizationCheck.locationValid ? (
                <CheckIcon sx={{ ml: 1, color: 'success.main', fontSize: 16 }} />
              ) : (
                <ErrorIcon sx={{ ml: 1, color: 'error.main', fontSize: 16 }} />
              )}
            </Box>
          </Grid>
        </Grid>
        
        {!preOptimizationCheck.allValid && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            最適化を実行するには、すべての項目が設定されている必要があります。
          </Alert>
        )}
      </CardContent>
    </Card>
  );

  const renderOptimizationStepper = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Stepper activeStep={activeStep} orientation="vertical">
          <Step>
            <StepLabel>
              アルゴリズム選択・設定
            </StepLabel>
            <StepContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel sx={{ color: 'white' }}>アルゴリズム</InputLabel>
                      <Select
                        value={selectedAlgorithm}
                        onChange={(e) => setSelectedAlgorithm(e.target.value)}
                        disabled={isOptimizing}
                        sx={{ color: 'white', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'white' } }}
                      >
                        {availableAlgorithms.length > 0 ? (
                          availableAlgorithms.map((algo) => (
                            <MenuItem key={algo.name} value={algo.name}>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Avatar
                                  sx={{
                                    bgcolor: ALGORITHM_CONFIGS[algo.name]?.color,
                                    width: 24,
                                    height: 24,
                                    mr: 1,
                                    fontSize: 12
                                  }}
                                >
                                  {ALGORITHM_CONFIGS[algo.name]?.icon}
                                </Avatar>
                                <Box>
                                  <Typography variant="body2">{algo.display_name}</Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {algo.processing_time} | {ALGORITHM_CONFIGS[algo.name]?.expectedEfficiency}
                                  </Typography>
                                </Box>
                              </Box>
                            </MenuItem>
                          ))
                        ) : (
                          <MenuItem value="nearest_neighbor">
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Avatar
                                sx={{
                                  bgcolor: '#2196f3',
                                  width: 24,
                                  height: 24,
                                  mr: 1,
                                  fontSize: 12
                                }}
                              >
                                <RouteIcon />
                              </Avatar>
                              <Box>
                                <Typography variant="body2">最近傍法</Typography>
                                <Typography variant="caption" color="text.secondary">
                                  0.1秒 | 75-85%
                                </Typography>
                              </Box>
                            </Box>
                          </MenuItem>
                        )}
                      </Select>
                    </FormControl>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Stack spacing={1}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={autoSelectBest}
                          onChange={(e) => setAutoSelectBest(e.target.checked)}
                        />
                      }
                      label="比較後に最良アルゴリズムを自動選択"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={showAdvanced}
                          onChange={(e) => setShowAdvanced(e.target.checked)}
                        />
                      }
                      label="詳細設定を表示"
                    />
                  </Stack>
                </Grid>
              </Grid>

              {showAdvanced && selectedAlgorithm && ALGORITHM_CONFIGS[selectedAlgorithm] && (
                <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    {ALGORITHM_CONFIGS[selectedAlgorithm].name} パラメータ
                  </Typography>
                  <Grid container spacing={2}>
                    {Object.entries(ALGORITHM_CONFIGS[selectedAlgorithm].parameters).map(([key, value]) => (
                      <Grid item xs={6} sm={3} key={key}>
                        <Typography variant="caption" color="text.secondary">
                          {key}:
                        </Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {value}
                        </Typography>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}

              <Box sx={{ mt: 2 }}>
                <Stack direction="row" spacing={2}>
                  <Button
                    variant="contained"
                    startIcon={<PlayIcon />}
                    onClick={() => executeOptimization()}
                    disabled={!preOptimizationCheck.allValid || isOptimizing}
                  >
                    最適化実行
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<CompareIcon />}
                    onClick={executeComparison}
                    disabled={!preOptimizationCheck.allValid || isComparing}
                  >
                    3アルゴリズム比較
                  </Button>
                </Stack>
              </Box>
            </StepContent>
          </Step>
          
          <Step>
            <StepLabel>
              最適化実行中
            </StepLabel>
            <StepContent>
              <Box sx={{ py: 2 }}>
                {isOptimizing && (
                  <>
                    <Typography variant="body1" gutterBottom>
                      {ALGORITHM_CONFIGS[selectedAlgorithm]?.name}で最適化中...
                    </Typography>
                    
                    {selectedAlgorithm === 'genetic' && (
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2">
                            世代進化: {currentGeneration}/{maxGenerations}
                          </Typography>
                          <Typography variant="body2">
                            {optimizationProgress.toFixed(1)}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={optimizationProgress}
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                      </Box>
                    )}
                    
                    <CircularProgress size={24} sx={{ mr: 1 }} />
                    <Typography variant="body2" component="span">
                      処理中... (予想時間: {ALGORITHM_CONFIGS[selectedAlgorithm]?.expectedTime})
                    </Typography>
                  </>
                )}
              </Box>
            </StepContent>
          </Step>
          
          <Step>
            <StepLabel>
              最適化完了
            </StepLabel>
            <StepContent>
              {optimizationResult && (
                <Box sx={{ py: 2 }}>
                  <Alert severity="success" sx={{ mb: 2 }}>
                    🎉 最適化が完了しました！
                  </Alert>
                  
                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={6} sm={3}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <TrendingUpIcon color="success" />
                        <Typography variant="h6" color="success.main">
                          {optimizationResult.efficiency_score?.toFixed(1)}%
                        </Typography>
                        <Typography variant="caption">効率スコア</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <RouteIcon color="primary" />
                        <Typography variant="h6">
                          {optimizationResult.total_distance?.toFixed(1)}km
                        </Typography>
                        <Typography variant="caption">総距離</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <SpeedIcon color="info" />
                        <Typography variant="h6">
                          {optimizationResult.optimization_time?.toFixed(2)}s
                        </Typography>
                        <Typography variant="caption">処理時間</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <ScheduleIcon color="warning" />
                        <Typography variant="h6">
                          {optimizationResult.total_time}分
                        </Typography>
                        <Typography variant="caption">所要時間</Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                  
                  <Stack direction="row" spacing={2}>
                    <Button
                      variant="contained"
                      startIcon={<VisibilityIcon />}
                      onClick={() => window.location.hash = '#/schedule'}
                    >
                      スケジュール表示
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<RefreshIcon />}
                      onClick={resetOptimization}
                    >
                      再最適化
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<DownloadIcon />}
                      onClick={() => console.log('Export functionality')}
                    >
                      結果をエクスポート
                    </Button>
                  </Stack>
                </Box>
              )}
            </StepContent>
          </Step>
        </Stepper>
      </CardContent>
    </Card>
  );

  // ========== Main Render ==========
  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* ヘッダー */}
      <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <AiIcon sx={{ fontSize: 32, mr: 2 }} />
              <Box>
                <Typography variant="h4" fontWeight="bold">
                  AI最適化エンジン
                </Typography>
                <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                  3つの高度なアルゴリズムによる石垣島ツアールート最適化
                </Typography>
              </Box>
            </Box>
            
            <Stack direction="row" spacing={1} alignItems="center">
              {aiSystemStatus?.success && (
                <Tooltip title="AI最適化エンジン稼働中">
                  <Chip
                    icon={<CheckIcon />}
                    label={`AI Ready v${aiSystemStatus.system_status?.api_version}`}
                    color="success"
                    variant="outlined"
                    sx={{ color: 'white', borderColor: 'white' }}
                  />
                </Tooltip>
              )}
              <Badge badgeContent={optimizationHistory.length} color="error">
                <Button
                  variant="outlined"
                  startIcon={<TimelineIcon />}
                  sx={{ color: 'white', borderColor: 'white' }}
                  onClick={() => setTabValue(2)}
                >
                  履歴
                </Button>
              </Badge>
            </Stack>
          </Box>
        </CardContent>
      </Card>

      {/* システムステータス */}
      {aiSystemStatus && !aiSystemStatus.success && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          AI最適化エンジンに接続できません。フォールバックモードで動作します。
        </Alert>
      )}

      {/* 事前チェック */}
      {renderPreOptimizationCheck()}

      {/* タブ */}
      <Card sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab label="最適化実行" icon={<AutoFixIcon />} />
          <Tab label="アルゴリズム比較" icon={<CompareIcon />} />
          <Tab label="最適化履歴" icon={<TimelineIcon />} />
        </Tabs>
      </Card>

      {/* タブコンテンツ */}
      {tabValue === 0 && renderOptimizationStepper()}
      
      {tabValue === 1 && (
        <AlgorithmComparisonDashboard
          comparisonResults={comparisonResults}
          isComparing={isComparing}
          onCompare={executeComparison}
          onSelectAlgorithm={(algorithm) => {
            setSelectedAlgorithm(algorithm);
            setTabValue(0);
          }}
        />
      )}
      
      {tabValue === 2 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              最適化履歴
            </Typography>
            {optimizationHistory.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                まだ最適化を実行していません
              </Typography>
            ) : (
              <List>
                {optimizationHistory.map((entry, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <Avatar sx={{ bgcolor: ALGORITHM_CONFIGS[entry.algorithm]?.color }}>
                        {ALGORITHM_CONFIGS[entry.algorithm]?.icon}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="body1">
                            {ALGORITHM_CONFIGS[entry.algorithm]?.name}
                          </Typography>
                          <Chip
                            label={`${entry.efficiency_score?.toFixed(1)}%`}
                            color="success"
                            size="small"
                            sx={{ ml: 1 }}
                          />
                        </Box>
                      }
                      secondary={
                        <Typography variant="body2" color="text.secondary">
                          {new Date(entry.timestamp).toLocaleString()} | 
                          処理時間: {entry.optimization_time?.toFixed(2)}秒 | 
                          距離: {entry.total_distance?.toFixed(1)}km
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      )}

      {/* 最適化ログ（デバッグ用） */}
      {optimizationLogs.length > 0 && showAdvanced && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              最適化ログ（直近10件）
            </Typography>
            <Box sx={{ maxHeight: 200, overflow: 'auto', bgcolor: 'grey.50', p: 2, borderRadius: 1 }}>
              {optimizationLogs.slice(0, 10).map((log, index) => (
                <Typography key={index} variant="body2" sx={{ mb: 0.5, fontFamily: 'monospace' }}>
                  [{new Date(log.timestamp).toLocaleTimeString()}] {log.message}
                </Typography>
              ))}
            </Box>
          </CardContent>
        </Card>
      )}
    </Container>
  );
};

export default RouteOptimizer;