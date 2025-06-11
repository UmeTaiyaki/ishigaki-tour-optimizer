// RouteOptimizer.js - 智能自動最適化システム（データ駆動型アルゴリズム選択）
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Button, Stack,
  Alert, Stepper, Step, StepLabel, StepContent, CircularProgress,
  FormControl, InputLabel, Select, MenuItem, Switch, FormControlLabel,
  Dialog, DialogTitle, DialogContent, DialogActions, Chip, Avatar,
  LinearProgress, Accordion, AccordionSummary, AccordionDetails,
  List, ListItem, ListItemIcon, ListItemText, Divider, Tooltip,
  IconButton, Badge, Container, Paper, Tabs, Tab, Skeleton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow
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
  Download as DownloadIcon,
  SmartToy as SmartIcon,
  Analytics as AnalyticsIcon,
  Lightbulb as LightbulbIcon
} from '@mui/icons-material';

// コンポーネントインポート
import AlgorithmComparisonDashboard from './AlgorithmComparisonDashboard';
import * as api from '../api/client';

// アルゴリズム設定
const ALGORITHM_CONFIGS = {
  genetic: {
    name: '遺伝的アルゴリズム',
    iconName: 'ScienceIcon',
    color: '#4caf50',
    description: '進化的計算による高精度最適化',
    expectedTime: '1-3秒',
    expectedEfficiency: '90%+',
    strengths: ['高精度', '複雑問題対応', '大域的探索'],
    bestFor: '複雑で高精度が必要な問題',
    parameters: {
      population_size: 40,
      generations: 75,
      mutation_rate: 0.1,
      crossover_rate: 0.8
    }
  },
  simulated_annealing: {
    name: 'シミュレーテッドアニーリング',
    iconName: 'MemoryIcon',
    color: '#ff9800',
    description: '焼きなまし法によるバランス型最適化',
    expectedTime: '0.5-1秒',
    expectedEfficiency: '80-90%',
    strengths: ['バランス', '安定性', '実用的速度'],
    bestFor: '中規模で安定性重視の問題',
    parameters: {
      initial_temperature: 200,
      cooling_rate: 0.95,
      max_iterations: 800
    }
  },
  nearest_neighbor: {
    name: '最近傍法',
    iconName: 'RouteIcon',
    color: '#2196f3',
    description: '高速基本最適化アルゴリズム',
    expectedTime: '0.1秒',
    expectedEfficiency: '75-85%',
    strengths: ['高速', 'シンプル', '安定'],
    bestFor: '小規模で速度重視の問題',
    parameters: {}
  }
};

// 🧠 智能アルゴリズム選択ロジック
const analyzeOptimalAlgorithm = (guests, vehicles, tourData) => {
  console.log('🧠 智能アルゴリズム分析開始...');
  
  const guestCount = guests.length;
  const vehicleCount = vehicles.length;
  const totalPeople = guests.reduce((sum, guest) => sum + (guest.num_people || 0), 0);
  
  // 複雑度計算
  const complexityFactors = {
    guestCount: guestCount,
    vehicleCount: vehicleCount,
    totalPeople: totalPeople,
    avgPeoplePerGuest: totalPeople / guestCount,
    vehicleUtilization: totalPeople / vehicles.reduce((sum, v) => sum + (v.capacity || 8), 0),
    timeConstraints: guests.filter(g => g.preferred_pickup_start && g.preferred_pickup_end).length,
    geographicSpread: calculateGeographicSpread(guests)
  };
  
  // 複雑度スコア計算（0-100）
  let complexityScore = 0;
  
  // ゲスト数による複雑度
  if (guestCount <= 3) complexityScore += 10;
  else if (guestCount <= 6) complexityScore += 30;
  else if (guestCount <= 10) complexityScore += 60;
  else complexityScore += 90;
  
  // 車両数による複雑度
  if (vehicleCount <= 2) complexityScore += 5;
  else if (vehicleCount <= 4) complexityScore += 15;
  else complexityScore += 25;
  
  // 利用率による複雑度
  if (complexityFactors.vehicleUtilization > 0.8) complexityScore += 20;
  else if (complexityFactors.vehicleUtilization > 0.6) complexityScore += 10;
  
  // 時間制約による複雑度
  if (complexityFactors.timeConstraints > guestCount * 0.7) complexityScore += 15;
  
  // 地理的分散による複雑度
  if (complexityFactors.geographicSpread > 0.05) complexityScore += 10;
  
  // アルゴリズム選択ロジック
  let selectedAlgorithm, reasoning;
  
  if (complexityScore >= 70) {
    // 高複雑度 → 遺伝的アルゴリズム
    selectedAlgorithm = 'genetic';
    reasoning = '高複雑度問題のため、遺伝的アルゴリズムで高精度最適化を実行';
  } else if (complexityScore >= 40) {
    // 中複雑度 → シミュレーテッドアニーリング
    selectedAlgorithm = 'simulated_annealing';
    reasoning = '中程度の複雑度のため、シミュレーテッドアニーリングでバランス最適化';
  } else {
    // 低複雑度 → 最近傍法
    selectedAlgorithm = 'nearest_neighbor';
    reasoning = '低複雑度問題のため、最近傍法で高速最適化';
  }
  
  const analysis = {
    selectedAlgorithm,
    complexityScore,
    complexityFactors,
    reasoning,
    confidence: Math.min(95, 60 + complexityScore * 0.4),
    expectedEfficiency: getExpectedEfficiency(selectedAlgorithm, complexityScore),
    processingTime: ALGORITHM_CONFIGS[selectedAlgorithm].expectedTime
  };
  
  console.log('🧠 智能分析結果:', analysis);
  return analysis;
};

// 地理的分散計算
const calculateGeographicSpread = (guests) => {
  if (guests.length < 2) return 0;
  
  const distances = [];
  for (let i = 0; i < guests.length; i++) {
    for (let j = i + 1; j < guests.length; j++) {
      const lat1 = guests[i].pickup_lat || 24.3336;
      const lng1 = guests[i].pickup_lng || 124.1543;
      const lat2 = guests[j].pickup_lat || 24.3336;
      const lng2 = guests[j].pickup_lng || 124.1543;
      
      const distance = Math.sqrt(Math.pow(lat2 - lat1, 2) + Math.pow(lng2 - lng1, 2));
      distances.push(distance);
    }
  }
  
  return distances.reduce((sum, d) => sum + d, 0) / distances.length;
};

// 期待効率計算
const getExpectedEfficiency = (algorithm, complexityScore) => {
  const baseEfficiency = {
    genetic: 85,
    simulated_annealing: 80,
    nearest_neighbor: 75
  };
  
  // 複雑度に応じた効率調整
  const complexityBonus = algorithm === 'genetic' ? Math.min(10, complexityScore * 0.1) :
                         algorithm === 'simulated_annealing' ? Math.min(8, complexityScore * 0.08) :
                         Math.max(-5, -complexityScore * 0.05);
  
  return Math.round(baseEfficiency[algorithm] + complexityBonus);
};

// アイコン取得関数
const getAlgorithmIcon = (algorithmKey) => {
  const config = ALGORITHM_CONFIGS[algorithmKey];
  if (!config) return <RouteIcon />;
  
  switch (config.iconName) {
    case 'ScienceIcon': return <ScienceIcon />;
    case 'MemoryIcon': return <MemoryIcon />;
    case 'RouteIcon': return <RouteIcon />;
    default: return <RouteIcon />;
  }
};

const RouteOptimizer = ({
  guests = [],
  vehicles = [],
  tourData = {},
  onOptimizationComplete,
  onError,
  onOptimize
}) => {
  // ========== State Management ==========
  const [activeStep, setActiveStep] = useState(0);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationProgress, setOptimizationProgress] = useState(0);
  const [currentGeneration, setCurrentGeneration] = useState(0);
  const [maxGenerations, setMaxGenerations] = useState(75);
  const [optimizationResult, setOptimizationResult] = useState(null);
  const [optimizationLogs, setOptimizationLogs] = useState([]);
  const [aiSystemStatus, setAiSystemStatus] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [algorithmAnalysis, setAlgorithmAnalysis] = useState(null);
  const [showAnalysisDetails, setShowAnalysisDetails] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [optimizationHistory, setOptimizationHistory] = useState([]);
  const [isComparing, setIsComparing] = useState(false);
  const [comparisonResults, setComparisonResults] = useState(null);
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
    if (guests.length > 0 && vehicles.length > 0) {
      performSmartAnalysis();
    }
  }, [guests, vehicles, tourData]);

  // ========== 智能分析実行 ==========
  const performSmartAnalysis = useCallback(async () => {
    setIsAnalyzing(true);
    
    try {
      // 少し遅延を入れて分析感を演出
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const analysis = analyzeOptimalAlgorithm(guests, vehicles, tourData);
      setAlgorithmAnalysis(analysis);
      
      console.log('🎯 智能分析完了:', analysis);
    } catch (error) {
      console.error('分析エラー:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [guests, vehicles, tourData]);

  // ========== 共通データ修復関数 ==========
  const repairVehicleData = useCallback((vehicleList) => {
    return vehicleList.map((vehicle, index) => {
      let safeLocation = vehicle.location;
      
      if (!safeLocation) {
        safeLocation = { lat: 24.3336, lng: 124.1543 };
        console.warn(`車両${vehicle.name || index}のlocationがnullです。デフォルト値を設定:`, safeLocation);
      }
      
      if (typeof safeLocation === 'string') {
        safeLocation = { lat: 24.3336, lng: 124.1543 };
        console.warn(`車両${vehicle.name || index}のlocationが文字列です。デフォルト値を設定:`, safeLocation);
      }
      
      if (typeof safeLocation.lat !== 'number' || typeof safeLocation.lng !== 'number') {
        safeLocation = { lat: 24.3336, lng: 124.1543 };
        console.warn(`車両${vehicle.name || index}のlat/lngが数値ではありません。デフォルト値を設定:`, safeLocation);
      }
      
      return {
        ...vehicle,
        location: safeLocation
      };
    });
  }, []);

  const createRepairedTourData = useCallback(() => {
    const repairedVehicles = repairVehicleData(vehicles);
    
    return {
      ...tourData,
      vehicles: repairedVehicles,
      guests: guests || [],
      activityLocation: tourData.activityLocation || { lat: 24.4167, lng: 124.1556 }
    };
  }, [tourData, vehicles, guests, repairVehicleData]);

  // ========== Core Functions ==========
  const initializeAiSystem = async () => {
    try {
      const systemStatus = await api.getSystemStatus();
      setAiSystemStatus(systemStatus);
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
  };

  // ========== 🧠 智能最適化実行 ==========
  const executeSmartOptimization = async () => {
    if (!preOptimizationCheck.allValid) {
      alert('最適化を実行するには、ゲスト、車両、アクティビティ地点の設定が必要です');
      return;
    }

    if (!algorithmAnalysis) {
      alert('アルゴリズム分析が完了していません。少々お待ちください。');
      return;
    }

    const selectedAlgorithm = algorithmAnalysis.selectedAlgorithm;
    const repairedTourData = createRepairedTourData();
    
    console.log(`🧠 智能最適化開始: ${selectedAlgorithm}`);
    console.log('🔧 修復後のtourData:', repairedTourData);

    setIsOptimizing(true);
    setOptimizationProgress(0);
    setCurrentGeneration(0);
    setActiveStep(1);

    try {
      // 進捗表示
      let progressInterval;
      if (selectedAlgorithm === 'genetic') {
        const config = ALGORITHM_CONFIGS[selectedAlgorithm];
        setMaxGenerations(config.parameters.generations);
        
        progressInterval = setInterval(() => {
          setOptimizationProgress(prev => {
            const newProgress = prev + (100 / config.parameters.generations);
            setCurrentGeneration(Math.floor((newProgress / 100) * config.parameters.generations));
            return Math.min(newProgress, 95);
          });
        }, 40);
      }

      const result = await api.optimizeWithAlgorithm(repairedTourData, selectedAlgorithm);
      
      if (progressInterval) clearInterval(progressInterval);
      
      if (result.success) {
        setOptimizationProgress(100);
        setOptimizationResult(result);
        setActiveStep(2);

        // 履歴追加
        const historyEntry = {
          timestamp: new Date().toISOString(),
          algorithm: selectedAlgorithm,
          efficiency_score: result.efficiency_score,
          optimization_time: result.optimization_time,
          total_distance: result.total_distance,
          success: true,
          isSmartSelection: true,
          analysisConfidence: algorithmAnalysis.confidence
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

  // ========== 比較実行（従来機能） ==========
  const executeComparison = async () => {
    if (!preOptimizationCheck.allValid) {
      alert('比較を実行するには、ゲスト、車両、アクティビティ地点の設定が必要です');
      return;
    }

    setIsComparing(true);
    setComparisonResults(null);
    setTabValue(1);

    try {
      const repairedTourData = createRepairedTourData();
      console.log('🔧 比較用修復データ:', repairedTourData);
      
      const result = await api.compareAlgorithms(repairedTourData);
      
      if (result.success) {
        setComparisonResults(result);
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
    setAlgorithmAnalysis(null);
    performSmartAnalysis();
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
                アクティビティ地点: {preOptimizationCheck.locationValid ? '設定済み' : '未設定'}
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
            最適化を実行するには、すべての項目を設定してください。
          </Alert>
        )}
      </CardContent>
    </Card>
  );

  // 🧠 智能分析結果表示
  const renderSmartAnalysis = () => {
    if (isAnalyzing) {
      return (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <CircularProgress size={24} sx={{ mr: 2 }} />
              <Typography variant="h6">
                🧠 智能アルゴリズム分析中...
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              データの複雑度を分析し、最適なアルゴリズムを選択しています
            </Typography>
          </CardContent>
        </Card>
      );
    }

    if (!algorithmAnalysis) return null;

    const { selectedAlgorithm, reasoning, confidence, expectedEfficiency, complexityScore } = algorithmAnalysis;
    const config = ALGORITHM_CONFIGS[selectedAlgorithm];

    return (
      <Card sx={{ mb: 3, border: 2, borderColor: config.color }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <SmartIcon sx={{ mr: 1, color: config.color }} />
            🧠 AI推奨アルゴリズム
            <Chip
              label={`信頼度 ${confidence.toFixed(0)}%`}
              size="small"
              color="primary"
              sx={{ ml: 2 }}
            />
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Box sx={{ p: 2, bgcolor: `${config.color}15`, borderRadius: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Box sx={{ mr: 2, display: 'flex', alignItems: 'center', color: config.color }}>
                    {getAlgorithmIcon(selectedAlgorithm)}
                  </Box>
                  <Typography variant="h6" sx={{ color: config.color }}>
                    {config.name}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {reasoning}
                </Typography>
                <Stack direction="row" spacing={1}>
                  <Chip 
                    label={`期待効率: ${expectedEfficiency}%`} 
                    size="small" 
                    color="success" 
                    variant="outlined" 
                  />
                  <Chip 
                    label={`処理時間: ${config.expectedTime}`} 
                    size="small" 
                    color="info" 
                    variant="outlined" 
                  />
                  <Chip 
                    label={`複雑度: ${complexityScore}`} 
                    size="small" 
                    color="warning" 
                    variant="outlined" 
                  />
                </Stack>
              </Box>

              <Button
                variant="text"
                size="small"
                startIcon={<AnalyticsIcon />}
                onClick={() => setShowAnalysisDetails(!showAnalysisDetails)}
              >
                {showAnalysisDetails ? '詳細を隠す' : '分析詳細を表示'}
              </Button>
            </Grid>

            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  最適性マッチング
                </Typography>
                <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                  <CircularProgress
                    variant="determinate"
                    value={confidence}
                    size={80}
                    thickness={4}
                    sx={{ color: config.color }}
                  />
                  <Box
                    sx={{
                      top: 0,
                      left: 0,
                      bottom: 0,
                      right: 0,
                      position: 'absolute',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography variant="body2" component="div" color="text.secondary">
                      {`${Math.round(confidence)}%`}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Grid>
          </Grid>

          {/* 分析詳細 */}
          {showAnalysisDetails && (
            <Accordion sx={{ mt: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle2">分析詳細データ</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>分析項目</TableCell>
                        <TableCell align="right">値</TableCell>
                        <TableCell>評価</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell>ゲスト数</TableCell>
                        <TableCell align="right">{algorithmAnalysis.complexityFactors.guestCount}</TableCell>
                        <TableCell>{algorithmAnalysis.complexityFactors.guestCount <= 5 ? '少' : algorithmAnalysis.complexityFactors.guestCount <= 10 ? '中' : '多'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>車両数</TableCell>
                        <TableCell align="right">{algorithmAnalysis.complexityFactors.vehicleCount}</TableCell>
                        <TableCell>{algorithmAnalysis.complexityFactors.vehicleCount <= 2 ? '少' : algorithmAnalysis.complexityFactors.vehicleCount <= 4 ? '中' : '多'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>総人数</TableCell>
                        <TableCell align="right">{algorithmAnalysis.complexityFactors.totalPeople}名</TableCell>
                        <TableCell>{algorithmAnalysis.complexityFactors.totalPeople <= 10 ? '少' : algorithmAnalysis.complexityFactors.totalPeople <= 20 ? '中' : '多'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>車両利用率</TableCell>
                        <TableCell align="right">{(algorithmAnalysis.complexityFactors.vehicleUtilization * 100).toFixed(0)}%</TableCell>
                        <TableCell>{algorithmAnalysis.complexityFactors.vehicleUtilization > 0.8 ? '高' : algorithmAnalysis.complexityFactors.vehicleUtilization > 0.5 ? '中' : '低'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>時間制約</TableCell>
                        <TableCell align="right">{algorithmAnalysis.complexityFactors.timeConstraints}件</TableCell>
                        <TableCell>{algorithmAnalysis.complexityFactors.timeConstraints > guests.length * 0.7 ? '厳格' : '緩い'}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </AccordionDetails>
            </Accordion>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderOptimizationControls = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          智能最適化実行
        </Typography>

        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <Button
            variant="contained"
            size="large"
            startIcon={isOptimizing ? <CircularProgress size={20} /> : <SmartIcon />}
            onClick={executeSmartOptimization}
            disabled={!preOptimizationCheck.allValid || isOptimizing || isComparing || !algorithmAnalysis}
            sx={{ 
              bgcolor: algorithmAnalysis ? ALGORITHM_CONFIGS[algorithmAnalysis.selectedAlgorithm]?.color : 'primary.main',
              '&:hover': {
                bgcolor: algorithmAnalysis ? ALGORITHM_CONFIGS[algorithmAnalysis.selectedAlgorithm]?.color : 'primary.dark',
                filter: 'brightness(0.9)'
              }
            }}
          >
            {isOptimizing ? '智能最適化中...' : 
             algorithmAnalysis ? `${ALGORITHM_CONFIGS[algorithmAnalysis.selectedAlgorithm]?.name}で最適化` : 
             '智能最適化実行'}
          </Button>

          <Button
            variant="outlined"
            startIcon={isComparing ? <CircularProgress size={20} /> : <CompareIcon />}
            onClick={executeComparison}
            disabled={!preOptimizationCheck.allValid || isOptimizing || isComparing}
            color="secondary"
          >
            {isComparing ? '比較中...' : '全アルゴリズム比較'}
          </Button>

          <Button
            variant="text"
            startIcon={<RefreshIcon />}
            onClick={resetOptimization}
            disabled={isOptimizing || isComparing}
          >
            リセット
          </Button>
        </Stack>

        {(isOptimizing || isComparing) && (
          <Box>
            <LinearProgress 
              variant="determinate" 
              value={optimizationProgress} 
              sx={{ mb: 1 }}
            />
            <Typography variant="body2" color="text.secondary">
              {isOptimizing ? 
                `${algorithmAnalysis ? ALGORITHM_CONFIGS[algorithmAnalysis.selectedAlgorithm]?.name : ''}最適化進行中... ${Math.round(optimizationProgress)}% (世代: ${currentGeneration}/${maxGenerations})` :
                '全アルゴリズム比較実行中...'
              }
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  const renderOptimizationStepper = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Stepper activeStep={activeStep} orientation="vertical">
          <Step>
            <StepLabel>智能分析</StepLabel>
            <StepContent>
              <Typography>データ複雑度を分析し、最適アルゴリズムを選択中...</Typography>
            </StepContent>
          </Step>
          <Step>
            <StepLabel>AI最適化処理</StepLabel>
            <StepContent>
              <Typography>
                {algorithmAnalysis ? ALGORITHM_CONFIGS[algorithmAnalysis.selectedAlgorithm]?.name : 'アルゴリズム'}による最適化を実行中...
              </Typography>
            </StepContent>
          </Step>
          <Step>
            <StepLabel>結果生成</StepLabel>
            <StepContent>
              <Typography>最適化結果の生成と検証を完了しました</Typography>
            </StepContent>
          </Step>
        </Stepper>
      </CardContent>
    </Card>
  );

  const renderOptimizationResult = () => {
    if (!optimizationResult || !optimizationResult.success) return null;

    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <TrophyIcon sx={{ mr: 1, color: 'success.main' }} />
            智能最適化結果
            {algorithmAnalysis && (
              <Chip
                icon={getAlgorithmIcon(algorithmAnalysis.selectedAlgorithm)}
                label={ALGORITHM_CONFIGS[algorithmAnalysis.selectedAlgorithm]?.name}
                size="small"
                sx={{ ml: 2, bgcolor: ALGORITHM_CONFIGS[algorithmAnalysis.selectedAlgorithm]?.color }}
              />
            )}
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary">
                  {optimizationResult.efficiency_score?.toFixed(1) || 'N/A'}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  効率スコア
                </Typography>
                {algorithmAnalysis && (
                  <Typography variant="caption" color="text.secondary">
                    (予想: {algorithmAnalysis.expectedEfficiency}%)
                  </Typography>
                )}
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="secondary">
                  {optimizationResult.routes?.length || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  生成ルート数
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="text.primary">
                  {optimizationResult.total_distance?.toFixed(1) || 'N/A'}km
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  総距離
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="text.primary">
                  {optimizationResult.optimization_time?.toFixed(2) || 'N/A'}s
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  処理時間
                </Typography>
              </Box>
            </Grid>
          </Grid>

          {optimizationResult.routes && optimizationResult.routes.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                生成されたルート詳細:
              </Typography>
              <List dense>
                {optimizationResult.routes.map((route, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <CarIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary={`ルート ${index + 1}: ${route.vehicle_name || `車両${index + 1}`}`}
                      secondary={`乗客: ${route.passenger_count || 0}名, 距離: ${route.distance?.toFixed(1) || 'N/A'}km`}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderComparisonResults = () => {
    if (!comparisonResults || !comparisonResults.success) return null;

    return (
      <Box sx={{ mt: 3 }}>
        <AlgorithmComparisonDashboard
          comparisonData={comparisonResults}
          onAlgorithmSelect={() => {}} // 智能システムでは手動選択無効
          onOptimize={() => {}} // 智能システムでは手動実行無効
        />
      </Box>
    );
  };

  const renderOptimizationHistory = () => {
    if (optimizationHistory.length === 0) return null;

    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <TimelineIcon sx={{ mr: 1 }} />
            智能最適化履歴
          </Typography>

          <List dense>
            {optimizationHistory.map((entry, index) => (
              <ListItem key={index}>
                <ListItemIcon>
                  {entry.success ? 
                    <CheckIcon color="success" /> : 
                    <ErrorIcon color="error" />
                  }
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body2">
                        {ALGORITHM_CONFIGS[entry.algorithm]?.name || entry.algorithm} - {entry.efficiency_score?.toFixed(1)}%
                      </Typography>
                      {entry.isSmartSelection && (
                        <Chip
                          label="智能選択"
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={{ ml: 1 }}
                        />
                      )}
                    </Box>
                  }
                  secondary={`${new Date(entry.timestamp).toLocaleString()} (${entry.optimization_time?.toFixed(2)}s)${entry.analysisConfidence ? ` | 信頼度: ${entry.analysisConfidence.toFixed(0)}%` : ''}`}
                />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>
    );
  };

  // ========== Main Render ==========
  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 3 }}>
        {/* ヘッダー */}
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h4" gutterBottom>
            🧠 AI智能最適化システム
          </Typography>
          <Typography variant="body1" color="text.secondary">
            データに基づいて最適なアルゴリズムを自動選択し、最高性能の配車最適化を実現
          </Typography>
          
          {aiSystemStatus && (
            <Box sx={{ mt: 2 }}>
              <Chip
                icon={<SmartIcon />}
                label={`Smart AI v${aiSystemStatus.version || '2.4.0'}`}
                color="primary"
                variant="outlined"
              />
            </Box>
          )}
        </Box>

        {/* タブシステム */}
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={tabValue}
            onChange={(e, newValue) => setTabValue(newValue)}
            variant="fullWidth"
          >
            <Tab
              icon={<SmartIcon />}
              label="智能最適化"
              iconPosition="start"
            />
            <Tab
              icon={<CompareIcon />}
              label="アルゴリズム比較"
              iconPosition="start"
              disabled={!comparisonResults}
            />
            <Tab
              icon={<AssessmentIcon />}
              label="履歴・ログ"
              iconPosition="start"
            />
          </Tabs>
        </Paper>

        {/* タブコンテンツ */}
        {tabValue === 0 && (
          <>
            {renderPreOptimizationCheck()}
            {renderSmartAnalysis()}
            {renderOptimizationControls()}
            {(activeStep > 0 || isOptimizing) && renderOptimizationStepper()}
            {renderOptimizationResult()}
          </>
        )}

        {tabValue === 1 && (
          <>
            {renderComparisonResults()}
          </>
        )}

        {tabValue === 2 && (
          <>
            {renderOptimizationHistory()}
            
            {optimizationLogs.length > 0 && (
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    詳細ログ
                  </Typography>
                  <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                    {optimizationLogs.map((log, index) => (
                      <Typography
                        key={index}
                        variant="body2"
                        component="pre"
                        sx={{ fontFamily: 'monospace', fontSize: '0.8rem', mb: 0.5 }}
                      >
                        {log.timestamp} [{log.level}] {log.message}
                      </Typography>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </Box>
    </Container>
  );
};

export default RouteOptimizer;