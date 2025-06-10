import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Alert,
  List, ListItem, ListItemText, ListItemIcon, Chip,
  FormControl, InputLabel, Select, MenuItem, Switch,
  FormControlLabel, Divider, Stack
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  DirectionsCar as CarIcon,
  Person as PersonIcon,
  AccessTime as TimeIcon,
  Route as RouteIcon
} from '@mui/icons-material';

// 簡易地図コンポーネント（Leafletの代替）
const SimpleMap = ({ 
  guests, 
  vehicles, 
  optimizedRoutes, 
  activityLocation,
  onActivityLocationUpdate 
}) => {
  const [selectedRoute, setSelectedRoute] = useState(0);

  return (
    <Box 
      sx={{ 
        height: 400, 
        bgcolor: 'lightblue', 
        border: '2px solid #ccc',
        borderRadius: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative'
      }}
    >
      {/* 地図プレースホルダー */}
      <Typography variant="h6" color="text.secondary">
        🗺️ 石垣島地図エリア
      </Typography>
      
      {/* 地図上のマーカー表示（擬似） */}
      <Box sx={{ position: 'absolute', top: 10, left: 10 }}>
        <Typography variant="caption" sx={{ bgcolor: 'white', p: 0.5, borderRadius: 1 }}>
          📍 ゲスト: {guests.length}件
        </Typography>
      </Box>
      
      <Box sx={{ position: 'absolute', top: 10, right: 10 }}>
        <Typography variant="caption" sx={{ bgcolor: 'white', p: 0.5, borderRadius: 1 }}>
          🚗 車両: {vehicles.length}台
        </Typography>
      </Box>
      
      {activityLocation && (
        <Box sx={{ position: 'absolute', bottom: 10, left: 10 }}>
          <Typography variant="caption" sx={{ bgcolor: 'yellow', p: 0.5, borderRadius: 1 }}>
            🎯 アクティビティ地点
          </Typography>
        </Box>
      )}
      
      {optimizedRoutes.length > 0 && (
        <Box sx={{ position: 'absolute', bottom: 10, right: 10 }}>
          <Typography variant="caption" sx={{ bgcolor: 'lightgreen', p: 0.5, borderRadius: 1 }}>
            ✅ ルート最適化済み
          </Typography>
        </Box>
      )}
    </Box>
  );
};

const MapView = ({
  tourData,
  guests,
  vehicles,
  optimizedRoutes,
  activityLocation,
  onActivityLocationUpdate
}) => {
  const [selectedVehicleRoute, setSelectedVehicleRoute] = useState(0);
  const [showAllRoutes, setShowAllRoutes] = useState(true);

  // 石垣島の人気スポット
  const popularSpots = [
    { name: '川平湾', lat: 24.4041, lng: 124.1611, description: 'グラスボート観光の名所' },
    { name: '白保サンゴ礁', lat: 24.3065, lng: 124.2158, description: '世界最大級のアオサンゴ群落' },
    { name: '米原ビーチ', lat: 24.4542, lng: 124.1628, description: 'シュノーケリングスポット' },
    { name: '石垣島鍾乳洞', lat: 24.3892, lng: 124.1256, description: '20万年の歳月が創り上げた鍾乳洞' },
    { name: '平久保崎灯台', lat: 24.5167, lng: 124.2833, description: '石垣島最北端の絶景スポット' }
  ];

  const handleSpotSelection = (spot) => {
    onActivityLocationUpdate({
      lat: spot.lat,
      lng: spot.lng
    });
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <RouteIcon sx={{ mr: 1 }} />
        地図・ルート表示
      </Typography>

      <Grid container spacing={3}>
        {/* 地図表示エリア */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                石垣島マップ
              </Typography>
              
              {/* 地図コントロール */}
              <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                {optimizedRoutes.length > 0 && (
                  <>
                    <FormControl size="small" sx={{ minWidth: 200 }}>
                      <InputLabel>表示する車両ルート</InputLabel>
                      <Select
                        value={selectedVehicleRoute}
                        onChange={(e) => setSelectedVehicleRoute(e.target.value)}
                        label="表示する車両ルート"
                      >
                        <MenuItem value={-1}>すべてのルート</MenuItem>
                        {optimizedRoutes.map((route, index) => (
                          <MenuItem key={index} value={index}>
                            {route.vehicle_name} ({route.route.length}箇所)
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    
                    <FormControlLabel
                      control={
                        <Switch
                          checked={showAllRoutes}
                          onChange={(e) => setShowAllRoutes(e.target.checked)}
                        />
                      }
                      label="全ルート表示"
                    />
                  </>
                )}
              </Box>

              {/* 地図コンポーネント */}
              <SimpleMap
                guests={guests}
                vehicles={vehicles}
                optimizedRoutes={optimizedRoutes}
                activityLocation={activityLocation}
                onActivityLocationUpdate={onActivityLocationUpdate}
              />

              {/* 地図操作説明 */}
              <Alert severity="info" sx={{ mt: 2 }}>
                💡 実際の実装では、ここにLeafletマップが表示され、クリックでアクティビティ地点を設定できます
              </Alert>
            </CardContent>
          </Card>
        </Grid>

        {/* サイドパネル */}
        <Grid item xs={12} lg={4}>
          <Stack spacing={2}>
            {/* 人気スポット選択 */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  人気スポット
                </Typography>
                <List dense>
                  {popularSpots.map((spot, index) => (
                    <ListItem
                      key={index}
                      button
                      onClick={() => handleSpotSelection(spot)}
                      sx={{ 
                        border: '1px solid #e0e0e0', 
                        borderRadius: 1, 
                        mb: 1,
                        '&:hover': { bgcolor: 'action.hover' }
                      }}
                    >
                      <ListItemIcon>
                        <LocationIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={spot.name}
                        secondary={spot.description}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>

            {/* ルート情報 */}
            {optimizedRoutes.length > 0 && (
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    最適化ルート情報
                  </Typography>
                  
                  {optimizedRoutes.map((route, routeIndex) => (
                    <Box key={routeIndex} sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <CarIcon color="primary" sx={{ mr: 1 }} />
                        <Typography variant="subtitle1" fontWeight="bold">
                          {route.vehicle_name}
                        </Typography>
                        <Chip
                          label={`${route.route.length}箇所`}
                          size="small"
                          sx={{ ml: 1 }}
                        />
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        総距離: {route.total_distance}km | 
                        所要時間: {route.estimated_duration} | 
                        効率: {route.efficiency_score}%
                      </Typography>
                      
                      <List dense>
                        {route.route.map((stop, stopIndex) => (
                          <ListItem key={stopIndex} sx={{ py: 0.5 }}>
                            <ListItemIcon sx={{ minWidth: 30 }}>
                              <Typography variant="caption" 
                                sx={{ 
                                  bgcolor: 'primary.main', 
                                  color: 'white', 
                                  borderRadius: '50%', 
                                  width: 20, 
                                  height: 20, 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  justifyContent: 'center',
                                  fontSize: '0.75rem'
                                }}
                              >
                                {stopIndex + 1}
                              </Typography>
                            </ListItemIcon>
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="body2">
                                    {stop.name} ({stop.num_people}名)
                                  </Typography>
                                  <Chip
                                    label={stop.pickup_time}
                                    size="small"
                                    variant="outlined"
                                    color={
                                      stop.time_compliance === 'acceptable' ? 'success' :
                                      stop.time_compliance === 'early' ? 'warning' : 'error'
                                    }
                                  />
                                </Box>
                              }
                              secondary={stop.hotel_name}
                            />
                          </ListItem>
                        ))}
                      </List>
                      
                      {routeIndex < optimizedRoutes.length - 1 && <Divider sx={{ my: 2 }} />}
                    </Box>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* 現在の設定情報 */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  現在の設定
                </Typography>
                
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <PersonIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="ゲスト"
                      secondary={`${guests.length}グループ (${guests.reduce((sum, g) => sum + g.people, 0)}名)`}
                    />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemIcon>
                      <CarIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="車両"
                      secondary={`${vehicles.length}台 (定員${vehicles.reduce((sum, v) => sum + v.capacity, 0)}名)`}
                    />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemIcon>
                      <TimeIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="開始時間"
                      secondary={tourData.startTime || '未設定'}
                    />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemIcon>
                      <LocationIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="アクティビティ場所"
                      secondary={activityLocation ? '設定済み' : '未設定'}
                    />
                  </ListItem>
                </List>
                
                {!activityLocation && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    アクティビティ場所を設定してください
                  </Alert>
                )}
                
                {guests.length === 0 && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    ゲストを追加してください
                  </Alert>
                )}
                
                {vehicles.length === 0 && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    車両を追加してください
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
};

export default MapView;