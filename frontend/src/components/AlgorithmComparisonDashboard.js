// AlgorithmComparisonDashboard.js - AI最適化アルゴリズム比較コンポーネント
import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Button, Stack,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, Divider, Avatar, CircularProgress, Tooltip,
  LinearProgress, Alert, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, Badge, Accordion, AccordionSummary,
  AccordionDetails, List, ListItem, ListItemIcon, ListItemText
} from '@mui/material';
import {
  Science as GeneticIcon,
  Memory as AnnealingIcon,
  Route as NearestIcon,
  TrendingUp as EfficiencyIcon,
  Speed as SpeedIcon,
  CompareArrows as CompareIcon,
  EmojiEvents as TrophyIcon,
  Timeline as TimelineIcon,
  Assessment as AssessmentIcon,
  PlayArrow as PlayIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Star as StarIcon,
  Psychology as AiIcon
} from '@mui/icons-material';

// アルゴリズム詳細情報
const ALGORITHM_DETAILS = {
  genetic: {
    name: '遺伝的アルゴリズム',
    shortName: 'GA',
    icon: <GeneticIcon />,
    color: '#4caf50',
    description: '進化的計算による高精度最適化',
    characteristics: [
      '生物進化を模倣した最適化手法',
      '複雑な問題空間での探索能力',
      '局所最適解を回避',
      '高い精度を期待できる'
    ],
    processingTime: '1-3秒',
    expectedEfficiency: '90%+',
    strengths: ['高精度', '複雑問題対応', '大域的探索'],
    weaknesses: ['計算時間', 'パラメータ調整']
  },
  simulated_annealing: {
    name: 'シミュレーテッドアニーリング',
    shortName: 'SA',
    icon: <AnnealingIcon />,
    color: '#ff9800',
    description: '焼きなまし法によるバランス型最適化',
    characteristics: [
      '物理の焼きなまし過程を模倣',
      '確率的な解空間探索',
      '適度な計算時間で良解を発見',
      '温度パラメータによる制御'
    ],
    processingTime: '0.5-1秒',
    expectedEfficiency: '80-90%',
    strengths: ['バランス', '安定性', '実用的速度'],
    weaknesses: ['温度調整', '収束の不安定性']
  },
  nearest_neighbor: {
    name: '最近傍法',
    shortName: 'NN',
    icon: <NearestIcon />,
    color: '#2196f3',
    description: '高速基本最適化アルゴリズム',
    characteristics: [
      'シンプルな貪欲法ベース',
      '非常に高速な処理',
      '理解しやすいロジック',
      '基本的な最適化を保証'
    ],
    processingTime: '0.1秒',
    expectedEfficiency: '75-85%',
    strengths: ['高速', 'シンプル', '安定'],
    weaknesses: ['局所最適', '精度限界']
  }
};

const AlgorithmComparisonDashboard = ({
  comparisonResults = null,
  isComparing = false,
  onCompare,
  onSelectAlgorithm
}) => {
  const [selectedAlgorithm, setSelectedAlgorithm] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [expandedAlgorithm, setExpandedAlgorithm] = useState(null);

  // 結果がある場合の効率スコア順ソート
  const getSortedResults = () => {
    if (!comparisonResults?.comparison_results) return [];
    
    return Object.entries(comparisonResults.comparison_results)
      .map(([algorithm, result]) => ({
        algorithm,
        ...result,
        details: ALGORITHM_DETAILS[algorithm]
      }))
      .sort((a, b) => (b.efficiency_score || 0) - (a.efficiency_score || 0));
  };

  const sortedResults = getSortedResults();

  // 効率スコアに基づく色判定
  const getEfficiencyColor = (score) => {
    if (score >= 90) return '#4caf50'; // Green
    if (score >= 80) return '#ff9800'; // Orange
    if (score >= 70) return '#2196f3'; // Blue
    return '#f44336'; // Red
  };

  // 勝者の王冠表示
  const WinnerCrown = ({ isWinner, score }) => (
    isWinner ? (
      <Badge
        badgeContent={<TrophyIcon sx={{ fontSize: 16, color: '#ffd700' }} />}
        color="primary"
        sx={{ '& .MuiBadge-badge': { bgcolor: 'transparent' } }}
      >
        <Chip
          label={`${score?.toFixed(1)}%`}
          sx={{
            bgcolor: '#ffd700',
            color: '#000',
            fontWeight: 'bold',
            fontSize: '1.1rem'
          }}
        />
      </Badge>
    ) : (
      <Chip
        label={`${score?.toFixed(1)}%`}
        sx={{
          bgcolor: getEfficiencyColor(score),
          color: 'white',
          fontWeight: 'bold'
        }}
      />
    )
  );

  return (
    <Box sx={{ width: '100%' }}>
      {/* ヘッダー */}
      <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <CompareIcon sx={{ fontSize: 32, mr: 2 }} />
              <Box>
                <Typography variant="h5" fontWeight="bold">
                  AI最適化アルゴリズム比較
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  3つの最適化手法のパフォーマンス比較とアルゴリズム選択支援
                </Typography>
              </Box>
            </Box>
            <Button
              variant="outlined"
              startIcon={isComparing ? <CircularProgress size={16} color="inherit" /> : <PlayIcon />}
              onClick={onCompare}
              disabled={isComparing}
              sx={{ color: 'white', borderColor: 'white' }}
            >
              {isComparing ? '比較実行中...' : '比較実行'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* 比較実行中の表示 */}
      {isComparing && (
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <CircularProgress size={60} sx={{ mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              3つのAIアルゴリズムで最適化実行中...
            </Typography>
            <Typography variant="body2" color="text.secondary">
              遺伝的アルゴリズム、シミュレーテッドアニーリング、最近傍法
            </Typography>
            <LinearProgress sx={{ mt: 2, maxWidth: 400, mx: 'auto' }} />
          </CardContent>
        </Card>
      )}

      {/* 比較結果表示 */}
      {comparisonResults && !isComparing && (
        <>
          {/* 勝者発表 */}
          <Card sx={{ mb: 3, border: `3px solid #ffd700` }}>
            <CardContent sx={{ textAlign: 'center', bgcolor: '#fff9c4' }}>
              <TrophyIcon sx={{ fontSize: 48, color: '#ffd700', mb: 1 }} />
              <Typography variant="h5" fontWeight="bold" color="primary">
                🏆 最優秀アルゴリズム
              </Typography>
              <Typography variant="h4" fontWeight="bold" sx={{ my: 1 }}>
                {ALGORITHM_DETAILS[comparisonResults.best_algorithm]?.name}
              </Typography>
              <Chip
                label={`効率スコア: ${comparisonResults.best_efficiency?.toFixed(1)}%`}
                sx={{
                  bgcolor: '#ffd700',
                  color: '#000',
                  fontWeight: 'bold',
                  fontSize: '1.2rem',
                  px: 2,
                  py: 1
                }}
              />
              <Typography variant="body1" sx={{ mt: 2 }}>
                {comparisonResults.recommendation}
              </Typography>
            </CardContent>
          </Card>

          {/* 詳細比較結果 */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            {sortedResults.map((result, index) => (
              <Grid item xs={12} md={4} key={result.algorithm}>
                <Card 
                  sx={{ 
                    height: '100%',
                    border: result.algorithm === comparisonResults.best_algorithm ? '2px solid #ffd700' : '1px solid #e0e0e0',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4
                    }
                  }}
                >
                  <CardContent>
                    {/* アルゴリズムヘッダー */}
                    <Box sx={{ textAlign: 'center', mb: 2 }}>
                      <Avatar
                        sx={{
                          bgcolor: result.details.color,
                          mx: 'auto',
                          mb: 1,
                          width: 56,
                          height: 56
                        }}
                      >
                        {result.details.icon}
                      </Avatar>
                      <Typography variant="h6" fontWeight="bold">
                        {result.details.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {result.details.description}
                      </Typography>
                      
                      {/* 順位表示 */}
                      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 1 }}>
                        {index === 0 && <StarIcon sx={{ color: '#ffd700', mr: 0.5 }} />}
                        <Typography variant="h6" color={index === 0 ? '#ffd700' : 'text.secondary'}>
                          #{index + 1}
                        </Typography>
                      </Box>
                    </Box>

                    {/* 結果詳細 */}
                    {result.error ? (
                      <Alert severity="error" sx={{ mb: 2 }}>
                        <Typography variant="body2">
                          {result.error}
                        </Typography>
                      </Alert>
                    ) : (
                      <Box sx={{ mb: 2 }}>
                        {/* 効率スコア */}
                        <Box sx={{ textAlign: 'center', mb: 2 }}>
                          <WinnerCrown 
                            isWinner={result.algorithm === comparisonResults.best_algorithm}
                            score={result.efficiency_score}
                          />
                        </Box>

                        {/* 詳細メトリクス */}
                        <Stack spacing={1}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" color="text.secondary">
                              処理時間:
                            </Typography>
                            <Typography variant="body2" fontWeight="bold">
                              {result.optimization_time?.toFixed(2)}秒
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" color="text.secondary">
                              総距離:
                            </Typography>
                            <Typography variant="body2" fontWeight="bold">
                              {result.total_distance?.toFixed(1)}km
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" color="text.secondary">
                              所要時間:
                            </Typography>
                            <Typography variant="body2" fontWeight="bold">
                              {result.total_time}分
                            </Typography>
                          </Box>
                        </Stack>
                      </Box>
                    )}

                    {/* アクションボタン */}
                    <Stack spacing={1}>
                      <Button
                        variant={result.algorithm === comparisonResults.best_algorithm ? "contained" : "outlined"}
                        fullWidth
                        onClick={() => onSelectAlgorithm && onSelectAlgorithm(result.algorithm)}
                        disabled={!!result.error}
                        sx={{
                          bgcolor: result.algorithm === comparisonResults.best_algorithm ? result.details.color : 'transparent',
                          borderColor: result.details.color,
                          color: result.algorithm === comparisonResults.best_algorithm ? 'white' : result.details.color,
                          '&:hover': {
                            bgcolor: result.details.color,
                            color: 'white'
                          }
                        }}
                      >
                        このアルゴリズムを選択
                      </Button>
                      <Button
                        variant="text"
                        size="small"
                        onClick={() => setExpandedAlgorithm(expandedAlgorithm === result.algorithm ? null : result.algorithm)}
                      >
                        詳細を見る
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* アルゴリズム詳細情報 */}
          {expandedAlgorithm && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  {ALGORITHM_DETAILS[expandedAlgorithm]?.icon}
                  <Box sx={{ ml: 1 }}>
                    {ALGORITHM_DETAILS[expandedAlgorithm]?.name} 詳細情報
                  </Box>
                </Typography>
                
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" gutterBottom>
                      アルゴリズムの特徴
                    </Typography>
                    <List dense>
                      {ALGORITHM_DETAILS[expandedAlgorithm]?.characteristics.map((char, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <InfoIcon fontSize="small" />
                          </ListItemIcon>
                          <ListItemText primary={char} />
                        </ListItem>
                      ))}
                    </List>
                  </Grid>
                  
                  <Grid item xs={12} md={3}>
                    <Typography variant="subtitle2" gutterBottom>
                      強み
                    </Typography>
                    {ALGORITHM_DETAILS[expandedAlgorithm]?.strengths.map((strength, index) => (
                      <Chip
                        key={index}
                        label={strength}
                        color="success"
                        variant="outlined"
                        size="small"
                        sx={{ mr: 0.5, mb: 0.5 }}
                      />
                    ))}
                  </Grid>
                  
                  <Grid item xs={12} md={3}>
                    <Typography variant="subtitle2" gutterBottom>
                      注意点
                    </Typography>
                    {ALGORITHM_DETAILS[expandedAlgorithm]?.weaknesses.map((weakness, index) => (
                      <Chip
                        key={index}
                        label={weakness}
                        color="warning"
                        variant="outlined"
                        size="small"
                        sx={{ mr: 0.5, mb: 0.5 }}
                      />
                    ))}
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}

          {/* 比較サマリーテーブル */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <AssessmentIcon sx={{ mr: 1 }} />
                比較サマリー
              </Typography>
              
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell>アルゴリズム</TableCell>
                      <TableCell align="center">効率スコア</TableCell>
                      <TableCell align="center">処理時間</TableCell>
                      <TableCell align="center">総距離</TableCell>
                      <TableCell align="center">推奨用途</TableCell>
                      <TableCell align="center">ステータス</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sortedResults.map((result, index) => (
                      <TableRow key={result.algorithm}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar
                              sx={{ 
                                bgcolor: result.details.color, 
                                width: 32, 
                                height: 32, 
                                mr: 1,
                                fontSize: 16
                              }}
                            >
                              {result.details.shortName}
                            </Avatar>
                            {result.details.name}
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <WinnerCrown 
                            isWinner={result.algorithm === comparisonResults.best_algorithm}
                            score={result.efficiency_score}
                          />
                        </TableCell>
                        <TableCell align="center">
                          {result.error ? '-' : `${result.optimization_time?.toFixed(2)}秒`}
                        </TableCell>
                        <TableCell align="center">
                          {result.error ? '-' : `${result.total_distance?.toFixed(1)}km`}
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" color="text.secondary">
                            {result.details.expectedEfficiency}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          {result.error ? (
                            <Chip label="エラー" color="error" size="small" />
                          ) : (
                            <Chip 
                              label={index === 0 ? "最優秀" : index === 1 ? "良好" : "基本"}
                              color={index === 0 ? "success" : index === 1 ? "warning" : "default"}
                              size="small"
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </>
      )}

      {/* 比較未実行時のアルゴリズム紹介 */}
      {!comparisonResults && !isComparing && (
        <Grid container spacing={3}>
          {Object.entries(ALGORITHM_DETAILS).map(([key, details]) => (
            <Grid item xs={12} md={4} key={key}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ textAlign: 'center', mb: 2 }}>
                    <Avatar
                      sx={{
                        bgcolor: details.color,
                        mx: 'auto',
                        mb: 1,
                        width: 56,
                        height: 56
                      }}
                    >
                      {details.icon}
                    </Avatar>
                    <Typography variant="h6" fontWeight="bold">
                      {details.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {details.description}
                    </Typography>
                  </Box>

                  <Stack spacing={1} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        処理時間:
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {details.processingTime}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        期待効率:
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {details.expectedEfficiency}
                      </Typography>
                    </Box>
                  </Stack>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    推奨用途: {details.characteristics[0]}
                  </Typography>

                  <Button
                    variant="outlined"
                    fullWidth
                    sx={{
                      borderColor: details.color,
                      color: details.color,
                      '&:hover': {
                        bgcolor: details.color,
                        color: 'white'
                      }
                    }}
                    onClick={() => onSelectAlgorithm && onSelectAlgorithm(key)}
                  >
                    このアルゴリズムを使用
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default AlgorithmComparisonDashboard;