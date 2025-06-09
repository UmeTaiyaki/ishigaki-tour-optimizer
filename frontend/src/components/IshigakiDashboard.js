import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  LinearProgress,
  Alert,
  IconButton,
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider
} from '@mui/material';
import {
  WbSunny as SunnyIcon,
  Cloud as CloudyIcon,
  Umbrella as RainyIcon,
  Cyclone as TyphoonIcon,
  Waves as WavesIcon,
  Traffic as TrafficIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  DirectionsCar as CarIcon,
  Groups as GroupsIcon
} from '@mui/icons-material';

const IshigakiDashboard = ({ 
  environmentalData, 
  statistics, 
  systemStatus, 
  onRefresh 
}) => {
  const [expandedSections, setExpandedSections] = useState({
    weather: false,
    traffic: false,
    statistics: false
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // 天候アイコンの取得
  const getWeatherIcon = (condition) => {
    switch (condition) {
      case 'sunny':
        return <SunnyIcon sx={{ color: '#ff9800' }} />;
      case 'cloudy':
        return <CloudyIcon sx={{ color: '#607d8b' }} />;
      case 'rainy':
        return <RainyIcon sx={{ color: '#2196f3' }} />;
      case 'typhoon':
        return <TyphoonIcon sx={{ color: '#f44336' }} />;
      default:
        return <SunnyIcon sx={{ color: '#ff9800' }} />;
    }
  };

  // 天候状態の日本語変換
  const getWeatherText = (condition) => {
    const weatherMap = {
      'sunny': '晴れ',
      'cloudy': '曇り',
      'rainy': '雨',
      'typhoon': '台風'
    };
    return weatherMap[condition] || condition;
  };

  // 潮位状態の判定
  const getTideStatus = (level) => {
    if (level > 180) return { text: '大潮', color: 'error' };
    if (level > 150) return { text: '高潮', color: 'warning' };
    if (level < 100) return { text: '干潮', color: 'info' };
    return { text: '中潮', color: 'success' };
  };

  // 観光シーズンレベルの表示
  const getTourismSeasonText = (level) => {
    switch (level) {
      case 3: return { text: 'ピーク', color: 'error' };
      case 2: return { text: '繁忙', color: 'warning' };
      case 1: return { text: '通常', color: 'success' };
      default: return { text: '不明', color: 'default' };
    }
  };

  // 台風リスクレベルの表示
  const getTyphoonRisk = (risk) => {
    if (risk > 0.5) return { text: '高リスク', color: 'error', severity: 'error' };
    if (risk > 0.3) return { text: '中リスク', color: 'warning', severity: 'warning' };
    if (risk > 0.1) return { text: '低リスク', color: 'info', severity: 'info' };
    return { text: 'リスクなし', color: 'success', severity: 'success' };
  };

  // 予測精度のレベル判定
  const getAccuracyLevel = (accuracy) => {
    if (accuracy >= 90) return { text: '非常に高い', color: 'success' };
    if (accuracy >= 80) return { text: '高い', color: 'info' };
    if (accuracy >= 70) return { text: '中程度', color: 'warning' };
    return { text: '要改善', color: 'error' };
  };

  return (
    <Box>
      <Grid container spacing={2}>
        
        {/* 天候・環境情報 */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="h6" component="div">
                  🌤️ 石垣島 環境情報
                </Typography>
                <IconButton size="small" onClick={() => toggleSection('weather')}>
                  {expandedSections.weather ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                {getWeatherIcon(environmentalData.weather?.condition)}
                <Box>
                  <Typography variant="h5">
                    {environmentalData.weather?.temperature || 26}°C
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {getWeatherText(environmentalData.weather?.condition)}
                  </Typography>
                </Box>
              </Box>

              <Collapse in={expandedSections.weather}>
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <WavesIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={`潮位 ${environmentalData.tide?.current_level || 150}cm`}
                      secondary={
                        <Chip 
                          size="small" 
                          label={getTideStatus(environmentalData.tide?.current_level || 150).text}
                          color={getTideStatus(environmentalData.tide?.current_level || 150).color}
                        />
                      }
                    />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemIcon>
                      <TrendingUpIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary={`風速 ${environmentalData.weather?.wind_speed || 4.0}m/s`}
                      secondary={`${environmentalData.weather?.wind_direction || 'NE'}方向`}
                    />
                  </ListItem>

                  {environmentalData.weather?.typhoon_risk > 0 && (
                    <ListItem>
                      <ListItemIcon>
                        <TyphoonIcon color="error" />
                      </ListItemIcon>
                      <ListItemText
                        primary="台風情報"
                        secondary={
                          <Chip 
                            size="small"
                            label={getTyphoonRisk(environmentalData.weather.typhoon_risk).text}
                            color={getTyphoonRisk(environmentalData.weather.typhoon_risk).color}
                          />
                        }
                      />
                    </ListItem>
                  )}
                </List>
              </Collapse>
            </CardContent>
          </Card>
        </Grid>

        {/* 交通・観光情報 */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="h6" component="div">
                  🚗 交通・観光状況
                </Typography>
                <IconButton size="small" onClick={() => toggleSection('traffic')}>
                  {expandedSections.traffic ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  観光シーズン
                </Typography>
                <Chip 
                  label={getTourismSeasonText(environmentalData.tourism?.season_level || 1).text}
                  color={getTourismSeasonText(environmentalData.tourism?.season_level || 1).color}
                  size="small"
                />
              </Box>

              <Collapse in={expandedSections.traffic}>
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <TrafficIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="交通状況"
                      secondary={environmentalData.traffic?.congestion_forecast || '通常'}
                    />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemIcon>
                      <GroupsIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="観光客数(推定)"
                      secondary={`${environmentalData.tourism?.estimated_tourist_count || 5000}名`}
                    />
                  </ListItem>

                  {environmentalData.tourism?.cruise_ships?.length > 0 && (
                    <ListItem>
                      <ListItemIcon>
                        <WarningIcon color="warning" />
                      </ListItemIcon>
                      <ListItemText
                        primary="クルーズ船寄港"
                        secondary={`${environmentalData.tourism.cruise_ships.length}隻`}
                      />
                    </ListItem>
                  )}
                </List>
              </Collapse>
            </CardContent>
          </Card>
        </Grid>

        {/* システム・統計情報 */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="h6" component="div">
                  📊 システム状況
                </Typography>
                <Box>
                  <IconButton size="small" onClick={onRefresh} title="更新">
                    <RefreshIcon />
                  </IconButton>
                  <IconButton size="small" onClick={() => toggleSection('statistics')}>
                    {expandedSections.statistics ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </IconButton>
                </Box>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Chip 
                    icon={systemStatus.status === 'online' ? <CheckCircleIcon /> : <WarningIcon />}
                    label={systemStatus.status === 'online' ? 'オンライン' : 'オフライン'}
                    color={systemStatus.status === 'online' ? 'success' : 'error'}
                    size="small"
                  />
                  <Typography variant="caption">
                    v{systemStatus.version}
                  </Typography>
                </Box>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  予測精度
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={statistics.prediction_accuracy || 0}
                    sx={{ flexGrow: 1, height: 8, borderRadius: 1 }}
                    color={getAccuracyLevel(statistics.prediction_accuracy || 0).color}
                  />
                  <Typography variant="body2">
                    {statistics.prediction_accuracy || 0}%
                  </Typography>
                </Box>
              </Box>

              <Collapse in={expandedSections.statistics}>
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <InfoIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="総レコード数"
                      secondary={`${statistics.total_records || 0}件`}
                    />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemIcon>
                      <TrendingUpIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="平均遅延時間"
                      secondary={`${statistics.average_delay || 0}分`}
                    />
                  </ListItem>

                  {statistics.area_statistics?.length > 0 && (
                    <>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="caption" sx={{ px: 2 }}>
                        エリア別統計
                      </Typography>
                      {statistics.area_statistics.slice(0, 3).map((area, index) => (
                        <ListItem key={index}>
                          <ListItemText
                            primary={area.area}
                            secondary={`${area.count}件 | 平均${area.avg_delay}分`}
                            sx={{ pl: 2 }}
                          />
                        </ListItem>
                      ))}
                    </>
                  )}
                </List>
              </Collapse>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* アラート情報 */}
      {environmentalData.weather?.typhoon_risk > 0.3 && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          <strong>台風警報</strong> - 
          台風の影響が予想されます。最新の気象情報を確認してください。
        </Alert>
      )}

      {environmentalData.tourism?.cruise_ships?.length > 0 && (
        <Alert severity="info" sx={{ mt: 1 }}>
          <strong>クルーズ船寄港情報</strong> - 
          {environmentalData.tourism.cruise_ships.length}隻のクルーズ船が寄港予定です。
          市街地の混雑にご注意ください。
        </Alert>
      )}

      {statistics.prediction_accuracy < 70 && statistics.total_records > 0 && (
        <Alert severity="warning" sx={{ mt: 1 }}>
          <strong>予測精度低下</strong> - 
          予測精度が{statistics.prediction_accuracy}%に低下しています。
          モデルの再学習を推奨します。
        </Alert>
      )}

      {systemStatus.status !== 'online' && (
        <Alert severity="error" sx={{ mt: 1 }}>
          <strong>システム障害</strong> - 
          一部機能が利用できません。管理者にお問い合わせください。
        </Alert>
      )}
    </Box>
  );
};

export default IshigakiDashboard;