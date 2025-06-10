// EnvironmentalDataDisplay.js - 石垣島気象情報表示コンポーネント（Button修正版）
import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Chip, Alert,
  IconButton, CircularProgress, Divider, Stack, Tooltip,
  Accordion, AccordionSummary, AccordionDetails, LinearProgress,
  List, ListItem, ListItemIcon, ListItemText, Button
} from '@mui/material';
import {
  WbSunny as SunnyIcon,
  Cloud as CloudyIcon,
  Umbrella as RainyIcon,
  Air as WindIcon,
  Waves as WavesIcon,
  Visibility as VisibilityIcon,
  Thermostat as TempIcon,
  Water as HumidityIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  Schedule as ScheduleIcon,
  Navigation as NavigationIcon,
  LocalFlorist as FloristIcon
} from '@mui/icons-material';

import weatherService from '../services/WeatherService';

const EnvironmentalDataDisplay = ({ 
  date, 
  onDataUpdate, 
  showDetails = true,
  compact = false 
}) => {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [apiStatus, setApiStatus] = useState({});
  const [expandedSections, setExpandedSections] = useState({
    weather: true,
    sea: false,
    tourism: false,
    api: false
  });

  // 初期データ読み込み
  useEffect(() => {
    loadWeatherData();
  }, [date]);

  // 定期更新（30分ごと）
  useEffect(() => {
    const interval = setInterval(() => {
      loadWeatherData(false); // サイレント更新
    }, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const loadWeatherData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);

    try {
      console.log('🌤️ 気象データを読み込み中...');
      
      const data = await weatherService.getWeatherData(date);
      setWeatherData(data);
      setLastUpdated(new Date());
      
      // 親コンポーネントにデータを通知
      if (onDataUpdate) {
        onDataUpdate(data);
      }
      
      console.log('✅ 気象データ読み込み完了:', data);
      
    } catch (err) {
      console.error('❌ 気象データ読み込みエラー:', err);
      setError(err.message || '気象データの取得に失敗しました');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const checkAPIStatus = async () => {
    try {
      const status = await weatherService.checkAPIStatus();
      setApiStatus(status);
    } catch (error) {
      console.error('API状態確認エラー:', error);
    }
  };

  const handleRefresh = () => {
    loadWeatherData(true);
    checkAPIStatus();
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // 天候アイコン取得
  const getWeatherIcon = (weather) => {
    if (weather.includes('晴')) return <SunnyIcon sx={{ color: '#ff9800', fontSize: 32 }} />;
    if (weather.includes('曇')) return <CloudyIcon sx={{ color: '#607d8b', fontSize: 32 }} />;
    if (weather.includes('雨')) return <RainyIcon sx={{ color: '#2196f3', fontSize: 32 }} />;
    return <SunnyIcon sx={{ color: '#ff9800', fontSize: 32 }} />;
  };

  // 天候状態の色を取得
  const getWeatherColor = (weather) => {
    if (weather.includes('晴')) return 'success';
    if (weather.includes('曇')) return 'default';
    if (weather.includes('雨')) return 'info';
    return 'default';
  };

  // 風速レベル判定
  const getWindLevel = (windSpeed) => {
    if (windSpeed < 10) return { level: '弱風', color: 'success', icon: '🍃' };
    if (windSpeed < 20) return { level: '普通', color: 'primary', icon: '💨' };
    if (windSpeed < 30) return { level: '強風', color: 'warning', icon: '🌬️' };
    return { level: '暴風', color: 'error', icon: '🌪️' };
  };

  // 気温レベル判定
  const getTempLevel = (temp) => {
    if (temp < 18) return { level: '涼しい', color: 'info' };
    if (temp < 25) return { level: '快適', color: 'success' };
    if (temp < 30) return { level: '暖かい', color: 'warning' };
    return { level: '暑い', color: 'error' };
  };

  // 潮位レベル判定
  const getTideLevel = (tideLevel) => {
    if (tideLevel < 100) return { text: '干潮', color: 'info', advice: 'ビーチコーミングに最適' };
    if (tideLevel < 150) return { text: '中潮', color: 'success', advice: '一般的な海洋アクティビティに適しています' };
    if (tideLevel < 200) return { text: '高潮', color: 'warning', advice: 'ダイビング・シュノーケリングに最適' };
    return { text: '大潮', color: 'error', advice: '海岸道路の通行にご注意ください' };
  };

  // データ信頼性の表示
  const getReliabilityBadge = (data) => {
    if (!data.reliability) return null;
    
    const reliabilityColors = {
      'high': 'success',
      'estimated': 'warning',
      'low': 'error'
    };
    
    return (
      <Chip 
        size="small" 
        label={`信頼性: ${data.reliability}`}
        color={reliabilityColors[data.reliability] || 'default'}
        variant="outlined"
      />
    );
  };

  if (loading && !weatherData) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2}>
            <CircularProgress size={24} />
            <Typography>石垣島の気象データを取得中...</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error && !weatherData) {
    return (
      <Card>
        <CardContent>
          <Alert 
            severity="error" 
            action={
              <IconButton onClick={handleRefresh} size="small">
                <RefreshIcon />
              </IconButton>
            }
          >
            {error}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!weatherData) {
    return null;
  }

  const windInfo = getWindLevel(weatherData.wind_speed);
  const tempInfo = getTempLevel(weatherData.temperature);
  const tideInfo = weatherData.tide_level ? getTideLevel(weatherData.tide_level) : null;

  return (
    <Box>
      {/* メイン気象情報カード */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" gutterBottom>
              🌤️ 石垣島 気象情報
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              {getReliabilityBadge(weatherData)}
              <Tooltip title="データを更新">
                <IconButton 
                  onClick={handleRefresh} 
                  size="small"
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={16} /> : <RefreshIcon />}
                </IconButton>
              </Tooltip>
            </Stack>
          </Box>

          {/* 基本気象情報 */}
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <Box display="flex" alignItems="center" gap={1}>
                {getWeatherIcon(weatherData.weather)}
                <Box>
                  <Typography variant="h6">{weatherData.weather}</Typography>
                  <Chip 
                    size="small" 
                    label={weatherData.weather}
                    color={getWeatherColor(weatherData.weather)}
                  />
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <Box display="flex" alignItems="center" gap={1}>
                <TempIcon color="action" />
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {weatherData.temperature}°C
                  </Typography>
                  <Chip 
                    size="small" 
                    label={tempInfo.level}
                    color={tempInfo.color}
                    variant="outlined"
                  />
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <Box display="flex" alignItems="center" gap={1}>
                <WindIcon color="action" />
                <Box>
                  <Typography variant="body1">
                    {windInfo.icon} {weatherData.wind_speed} km/h
                  </Typography>
                  <Chip 
                    size="small" 
                    label={windInfo.level}
                    color={windInfo.color}
                    variant="outlined"
                  />
                </Box>
              </Box>
            </Grid>

            {weatherData.humidity && (
              <Grid item xs={12} sm={6} md={2}>
                <Box display="flex" alignItems="center" gap={1}>
                  <HumidityIcon color="action" />
                  <Box>
                    <Typography variant="body1">
                      湿度 {weatherData.humidity}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {weatherData.humidity > 80 ? '高湿度' : '快適'}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            )}

            <Grid item xs={12} sm={6} md={3}>
              <Box display="flex" alignItems="center" gap={1}>
                <VisibilityIcon color="action" />
                <Box>
                  <Typography variant="body1">
                    視界: {weatherData.visibility === 'excellent' ? '最良' : 
                           weatherData.visibility === 'good' ? '良好' : '普通'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    観光・撮影に{weatherData.visibility === 'excellent' ? '最適' : '適している'}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>

          {/* データソース情報 */}
          <Box mt={2}>
            <Typography variant="caption" color="text.secondary">
              データソース: {weatherData.source} | 
              最終更新: {lastUpdated ? lastUpdated.toLocaleTimeString() : '--'}
              {weatherData.sources && (
                <> | 統合ソース: {weatherData.sources.join(', ')}</>
              )}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* 詳細情報（展開可能） */}
      {showDetails && (
        <>
          {/* 海洋・潮位情報 */}
          {(weatherData.tide_level || weatherData.sea_conditions) && (
            <Accordion 
              expanded={expandedSections.sea} 
              onChange={() => toggleSection('sea')}
              sx={{ mb: 1 }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1">
                  🌊 海洋・潮位情報
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  {weatherData.tide_level && tideInfo && (
                    <Grid item xs={12} md={6}>
                      <Box>
                        <Typography variant="h6" gutterBottom>
                          潮位: {weatherData.tide_level}cm
                        </Typography>
                        <Chip 
                          label={tideInfo.text}
                          color={tideInfo.color}
                          sx={{ mb: 1 }}
                        />
                        <Typography variant="body2" color="text.secondary">
                          💡 {tideInfo.advice}
                        </Typography>
                      </Box>
                    </Grid>
                  )}
                  
                  {weatherData.sea_conditions && (
                    <Grid item xs={12} md={6}>
                      <Box>
                        <Typography variant="h6" gutterBottom>
                          海況
                        </Typography>
                        <Typography variant="body1">
                          状態: {weatherData.sea_conditions.state}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          波高: {weatherData.sea_conditions.wave_height}
                        </Typography>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </AccordionDetails>
            </Accordion>
          )}

          {/* 観光・アクティビティ推奨 */}
          {(weatherData.tourism_advisory || weatherData.activity_recommendations) && (
            <Accordion 
              expanded={expandedSections.tourism} 
              onChange={() => toggleSection('tourism')}
              sx={{ mb: 1 }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1">
                  🏝️ 観光・アクティビティ情報
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  {weatherData.tourism_advisory && weatherData.tourism_advisory.length > 0 && (
                    <Grid item xs={12} md={6}>
                      <Typography variant="h6" gutterBottom>
                        <InfoIcon sx={{ fontSize: 16, mr: 1 }} />
                        観光アドバイス
                      </Typography>
                      <List dense>
                        {weatherData.tourism_advisory.map((advisory, index) => (
                          <ListItem key={index} sx={{ px: 0 }}>
                            <ListItemIcon sx={{ minWidth: 24 }}>
                              <FloristIcon sx={{ fontSize: 16 }} />
                            </ListItemIcon>
                            <ListItemText 
                              primary={advisory}
                              primaryTypographyProps={{ variant: 'body2' }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Grid>
                  )}

                  {weatherData.activity_recommendations && weatherData.activity_recommendations.length > 0 && (
                    <Grid item xs={12} md={6}>
                      <Typography variant="h6" gutterBottom>
                        <NavigationIcon sx={{ fontSize: 16, mr: 1 }} />
                        推奨アクティビティ
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                        {weatherData.activity_recommendations.map((activity, index) => (
                          <Chip 
                            key={index}
                            label={activity}
                            color="primary"
                            variant="outlined"
                            size="small"
                          />
                        ))}
                      </Stack>
                    </Grid>
                  )}
                </Grid>
              </AccordionDetails>
            </Accordion>
          )}

          {/* API状態とデータ品質 */}
          <Accordion 
            expanded={expandedSections.api} 
            onChange={() => toggleSection('api')}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">
                🔧 データ品質・API状態
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    データ品質
                  </Typography>
                  <List dense>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon>
                        <CheckCircleIcon color="success" sx={{ fontSize: 16 }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary={`信頼性: ${weatherData.reliability || '不明'}`}
                        secondary={weatherData.data_quality || '単一ソース'}
                      />
                    </ListItem>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon>
                        <ScheduleIcon sx={{ fontSize: 16 }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary="最終更新"
                        secondary={new Date(weatherData.last_updated).toLocaleString()}
                      />
                    </ListItem>
                  </List>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    利用可能API
                  </Typography>
                  <Box>
                    <Button 
                      variant="outlined" 
                      size="small" 
                      onClick={checkAPIStatus}
                      startIcon={<RefreshIcon />}
                      sx={{ mb: 2 }}
                    >
                      API状態を確認
                    </Button>
                    
                    {Object.keys(apiStatus).length > 0 && (
                      <List dense>
                        {Object.entries(apiStatus).map(([api, status]) => (
                          <ListItem key={api} sx={{ px: 0 }}>
                            <ListItemIcon>
                              {status.status === 'active' ? 
                                <CheckCircleIcon color="success" sx={{ fontSize: 16 }} /> :
                                <WarningIcon color="error" sx={{ fontSize: 16 }} />
                              }
                            </ListItemIcon>
                            <ListItemText 
                              primary={api.toUpperCase()}
                              secondary={status.message || status.status}
                            />
                          </ListItem>
                        ))}
                      </List>
                    )}
                  </Box>
                </Grid>
              </Grid>

              {weatherData.note && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  {weatherData.note}
                </Alert>
              )}
            </AccordionDetails>
          </Accordion>
        </>
      )}
    </Box>
  );
};

export default EnvironmentalDataDisplay;