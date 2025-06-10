// src/components/Settings.js - 個別ファイル版

import React from 'react';
import {
  Box, Card, CardContent, Typography, Switch, FormControlLabel,
  Divider, List, ListItem, ListItemText, ListItemSecondaryAction,
  Chip, Alert
} from '@mui/material';
import {
  Settings as SettingsIcon,
  DarkMode as DarkModeIcon,
  Language as LanguageIcon,
  Save as SaveIcon,
  Notifications as NotificationsIcon,
  Map as MapIcon,
  Cloud as CloudIcon
} from '@mui/icons-material';

const Settings = ({ settings = {}, onSettingsUpdate }) => {
  const handleSettingChange = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    onSettingsUpdate?.(newSettings);
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <SettingsIcon sx={{ mr: 1 }} />
        設定
      </Typography>

      {/* システム設定 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            システム設定
          </Typography>
          <List>
            <ListItem>
              <ListItemText
                primary="ダークモード"
                secondary="画面表示をダークテーマに変更します"
              />
              <ListItemSecondaryAction>
                <Switch
                  checked={settings.darkMode || false}
                  onChange={(e) => handleSettingChange('darkMode', e.target.checked)}
                  color="primary"
                />
              </ListItemSecondaryAction>
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemText
                primary="自動保存"
                secondary="データの変更を自動的に保存します"
              />
              <ListItemSecondaryAction>
                <Switch
                  checked={settings.autoSave !== false}
                  onChange={(e) => handleSettingChange('autoSave', e.target.checked)}
                  color="primary"
                />
              </ListItemSecondaryAction>
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemText
                primary="通知機能"
                secondary="システム通知を有効にします"
              />
              <ListItemSecondaryAction>
                <Switch
                  checked={settings.notifications !== false}
                  onChange={(e) => handleSettingChange('notifications', e.target.checked)}
                  color="primary"
                />
              </ListItemSecondaryAction>
            </ListItem>
          </List>
        </CardContent>
      </Card>

      {/* 追跡設定 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            追跡・監視設定
          </Typography>
          <List>
            <ListItem>
              <ListItemText
                primary="リアルタイム追跡"
                secondary="車両の位置をリアルタイムで追跡します"
              />
              <ListItemSecondaryAction>
                <Switch
                  checked={settings.realtimeTracking || false}
                  onChange={(e) => handleSettingChange('realtimeTracking', e.target.checked)}
                  color="primary"
                />
              </ListItemSecondaryAction>
            </ListItem>
          </List>
        </CardContent>
      </Card>

      {/* 外部サービス設定 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            外部サービス設定
          </Typography>
          <List>
            <ListItem>
              <ListItemText
                primary="地図プロバイダー"
                secondary={`現在: ${settings.mapProvider || 'Google Maps'}`}
              />
              <ListItemSecondaryAction>
                <Chip
                  label={settings.mapProvider || 'Google Maps'}
                  color="primary"
                  variant="outlined"
                />
              </ListItemSecondaryAction>
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemText
                primary="天気情報プロバイダー"
                secondary={`現在: ${settings.weatherProvider || 'Open-Meteo'}`}
              />
              <ListItemSecondaryAction>
                <Chip
                  label={settings.weatherProvider || 'Open-Meteo'}
                  color="info"
                  variant="outlined"
                />
              </ListItemSecondaryAction>
            </ListItem>
          </List>
        </CardContent>
      </Card>

      {/* システム情報 */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            システム情報
          </Typography>
          <Box sx={{ display: 'grid', gap: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2">バージョン:</Typography>
              <Typography variant="body2" fontWeight="bold">v2.0.0</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2">最終更新:</Typography>
              <Typography variant="body2" fontWeight="bold">
                {new Date().toLocaleDateString('ja-JP')}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2">言語:</Typography>
              <Typography variant="body2" fontWeight="bold">日本語</Typography>
            </Box>
          </Box>
          
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              設定の変更は自動的に保存されます。ページを更新しても設定は保持されます。
            </Typography>
          </Alert>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Settings;