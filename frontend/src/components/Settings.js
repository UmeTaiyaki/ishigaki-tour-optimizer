import React from 'react';
import {
  Box, Card, CardContent, Typography, Grid, 
  FormControl, InputLabel, Select, MenuItem,
  FormControlLabel, Switch, Slider, TextField,
  Accordion, AccordionSummary, AccordionDetails,
  Button, Alert, Divider
} from '@mui/material';
import {
  Settings as SettingsIcon,
  ExpandMore as ExpandMoreIcon,
  Notifications as NotificationsIcon,
  Tune as TuneIcon,
  Palette as PaletteIcon,
  Save as SaveIcon,
  RestoreFromTrash as ResetIcon
} from '@mui/icons-material';

const Settings = ({ settings, onSettingsUpdate }) => {
  const handleChange = (category, key, value) => {
    onSettingsUpdate({
      ...settings,
      [category]: {
        ...settings[category],
        [key]: value
      }
    });
  };

  const handleReset = () => {
    if (window.confirm('設定をリセットしますか？')) {
      onSettingsUpdate({
        notifications: {
          sound: true,
          desktop: false,
          email: false
        },
        optimization: {
          priorityMode: 'balanced',
          weatherConsideration: true,
          tideConsideration: true,
          preferredRouteType: 'fastest'
        },
        display: {
          theme: 'light',
          mapStyle: 'satellite',
          language: 'ja'
        }
      });
    }
  };

  const handleSave = () => {
    // 実際の実装では設定をローカルストレージまたはAPIに保存
    alert('設定を保存しました');
  };

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center' }}>
          <SettingsIcon sx={{ mr: 1 }} />
          システム設定
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<ResetIcon />}
            onClick={handleReset}
          >
            リセット
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
          >
            保存
          </Button>
        </Box>
      </Box>

      {/* 通知設定 */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <NotificationsIcon sx={{ mr: 1 }} />
            <Typography variant="h6">通知設定</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.notifications.sound}
                    onChange={(e) => handleChange('notifications', 'sound', e.target.checked)}
                  />
                }
                label="サウンド通知"
              />
              <Typography variant="body2" color="text.secondary">
                操作完了時にサウンドを再生します
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.notifications.desktop}
                    onChange={(e) => handleChange('notifications', 'desktop', e.target.checked)}
                  />
                }
                label="デスクトップ通知"
              />
              <Typography variant="body2" color="text.secondary">
                ブラウザのデスクトップ通知を使用します
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.notifications.email}
                    onChange={(e) => handleChange('notifications', 'email', e.target.checked)}
                  />
                }
                label="メール通知"
              />
              <Typography variant="body2" color="text.secondary">
                重要なイベントをメールで通知します
              </Typography>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* ルート最適化設定 */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <TuneIcon sx={{ mr: 1 }} />
            <Typography variant="h6">ルート最適化設定</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>優先モード</InputLabel>
                <Select
                  value={settings.optimization.priorityMode}
                  onChange={(e) => handleChange('optimization', 'priorityMode', e.target.value)}
                  label="優先モード"
                >
                  <MenuItem value="balanced">バランス重視</MenuItem>
                  <MenuItem value="time">時間優先</MenuItem>
                  <MenuItem value="distance">距離優先</MenuItem>
                  <MenuItem value="capacity">定員効率優先</MenuItem>
                </Select>
              </FormControl>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                最適化アルゴリズムの優先項目を選択
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>ルートタイプ</InputLabel>
                <Select
                  value={settings.optimization.preferredRouteType}
                  onChange={(e) => handleChange('optimization', 'preferredRouteType', e.target.value)}
                  label="ルートタイプ"
                >
                  <MenuItem value="fastest">最速ルート</MenuItem>
                  <MenuItem value="shortest">最短ルート</MenuItem>
                  <MenuItem value="scenic">景観重視ルート</MenuItem>
                </Select>
              </FormControl>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                推奨ルートの種類を選択
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.optimization.weatherConsideration}
                    onChange={(e) => handleChange('optimization', 'weatherConsideration', e.target.checked)}
                  />
                }
                label="天候を考慮する"
              />
              <Typography variant="body2" color="text.secondary">
                雨天時は移動時間を調整します
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.optimization.tideConsideration}
                    onChange={(e) => handleChange('optimization', 'tideConsideration', e.target.checked)}
                  />
                }
                label="潮位を考慮する"
              />
              <Typography variant="body2" color="text.secondary">
                潮位によるアクセス道路への影響を考慮します
              </Typography>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* 表示設定 */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <PaletteIcon sx={{ mr: 1 }} />
            <Typography variant="h6">表示設定</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>テーマ</InputLabel>
                <Select
                  value={settings.display.theme}
                  onChange={(e) => handleChange('display', 'theme', e.target.value)}
                  label="テーマ"
                >
                  <MenuItem value="light">ライト</MenuItem>
                  <MenuItem value="dark">ダーク</MenuItem>
                  <MenuItem value="auto">自動</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>地図スタイル</InputLabel>
                <Select
                  value={settings.display.mapStyle}
                  onChange={(e) => handleChange('display', 'mapStyle', e.target.value)}
                  label="地図スタイル"
                >
                  <MenuItem value="satellite">衛星画像</MenuItem>
                  <MenuItem value="street">道路地図</MenuItem>
                  <MenuItem value="terrain">地形図</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>言語</InputLabel>
                <Select
                  value={settings.display.language}
                  onChange={(e) => handleChange('display', 'language', e.target.value)}
                  label="言語"
                >
                  <MenuItem value="ja">日本語</MenuItem>
                  <MenuItem value="en">English</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* 石垣島特有設定 */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">石垣島特有設定</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography gutterBottom>観光シーズン考慮レベル</Typography>
              <Slider
                value={settings.optimization.touristSeasonFactor || 1.0}
                onChange={(e, value) => handleChange('optimization', 'touristSeasonFactor', value)}
                min={0.5}
                max={2.0}
                step={0.1}
                marks={[
                  { value: 0.5, label: '低' },
                  { value: 1.0, label: '標準' },
                  { value: 2.0, label: '高' }
                ]}
                valueLabelDisplay="auto"
              />
              <Typography variant="body2" color="text.secondary">
                観光シーズンによる交通渋滞の影響度
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography gutterBottom>石垣島エリア重み</Typography>
              <Slider
                value={settings.optimization.areaWeight || 1.0}
                onChange={(e, value) => handleChange('optimization', 'areaWeight', value)}
                min={0.5}
                max={2.0}
                step={0.1}
                marks={[
                  { value: 0.5, label: '均等' },
                  { value: 1.0, label: '標準' },
                  { value: 2.0, label: '重視' }
                ]}
                valueLabelDisplay="auto"
              />
              <Typography variant="body2" color="text.secondary">
                川平湾など人気エリアの重み付け
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="デフォルト出発地点"
                value={settings.optimization.defaultDeparture || '石垣港離島ターミナル'}
                onChange={(e) => handleChange('optimization', 'defaultDeparture', e.target.value)}
                helperText="車両の出発地点として使用される場所"
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* システム情報 */}
      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            システム情報
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">バージョン</Typography>
              <Typography variant="body1">v2.0.0</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">対応エリア</Typography>
              <Typography variant="body1">石垣島全域</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">最終更新</Typography>
              <Typography variant="body1">2025-06-10</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">API接続状態</Typography>
              <Typography variant="body1" color="success.main">接続中</Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* 設定のヒント */}
      <Alert severity="info" sx={{ mt: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          💡 設定のヒント
        </Typography>
        <Typography variant="body2">
          • 観光シーズン（7-9月、12-1月）は交通渋滞を考慮して「観光シーズン考慮レベル」を高めに設定することをお勧めします
        </Typography>
        <Typography variant="body2">
          • 悪天候時は「天候を考慮する」をオンにして、移動時間に余裕を持たせてください
        </Typography>
        <Typography variant="body2">
          • 川平湾や白保など人気スポット重視の場合は「石垣島エリア重み」を調整してください
        </Typography>
      </Alert>
    </Box>
  );
};

export default Settings;