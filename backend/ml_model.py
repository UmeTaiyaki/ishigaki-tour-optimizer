import os
import json
import sqlite3
import numpy as np
import pandas as pd
from datetime import datetime
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.neural_network import MLPRegressor
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import mean_absolute_error, r2_score
import joblib
from typing import Dict, List, Tuple

class MLPredictor:
    """機械学習による予測モデル"""
    
    def __init__(self):
        self.models = {
            'rf': None,  # Random Forest
            'gb': None,  # Gradient Boosting
            'nn': None   # Neural Network
        }
        self.ensemble_weights = {'rf': 0.4, 'gb': 0.4, 'nn': 0.2}
        self.feature_names = []
        self.last_trained = None
        self.model_dir = 'models'
        
        # モデル保存ディレクトリの作成
        os.makedirs(self.model_dir, exist_ok=True)
    
    def load_model(self):
        """保存済みモデルの読み込み"""
        try:
            for model_name in self.models.keys():
                model_path = os.path.join(self.model_dir, f'{model_name}_model.pkl')
                if os.path.exists(model_path):
                    self.models[model_name] = joblib.load(model_path)
                    print(f"{model_name}モデルを読み込みました")
            
            # メタデータの読み込み
            meta_path = os.path.join(self.model_dir, 'model_metadata.json')
            if os.path.exists(meta_path):
                with open(meta_path, 'r') as f:
                    metadata = json.load(f)
                    self.feature_names = metadata.get('feature_names', [])
                    self.last_trained = metadata.get('last_trained')
        except Exception as e:
            print(f"モデル読み込みエラー: {str(e)}")
    
    def train_from_records(self) -> Dict:
        """データベースの実績データから学習"""
        try:
            # データの取得
            conn = sqlite3.connect('tour_data.db')
            query = """
            SELECT * FROM pickup_records 
            WHERE delay_minutes IS NOT NULL
            ORDER BY created_at DESC
            LIMIT 1000
            """
            df = pd.read_sql_query(query, conn)
            conn.close()
            
            if len(df) < 20:
                return {
                    'success': False,
                    'message': f'データ不足: {len(df)}件（最低20件必要）'
                }
            
            # 特徴量の抽出
            X, y = self._prepare_features(df)
            
            # データ分割
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.2, random_state=42
            )
            
            # 各モデルの学習
            results = {}
            
            # Random Forest
            self.models['rf'] = RandomForestRegressor(
                n_estimators=100,
                max_depth=10,
                random_state=42
            )
            self.models['rf'].fit(X_train, y_train)
            rf_pred = self.models['rf'].predict(X_test)
            results['rf'] = {
                'mae': mean_absolute_error(y_test, rf_pred),
                'r2': r2_score(y_test, rf_pred)
            }
            
            # Gradient Boosting
            self.models['gb'] = GradientBoostingRegressor(
                n_estimators=100,
                learning_rate=0.1,
                max_depth=5,
                random_state=42
            )
            self.models['gb'].fit(X_train, y_train)
            gb_pred = self.models['gb'].predict(X_test)
            results['gb'] = {
                'mae': mean_absolute_error(y_test, gb_pred),
                'r2': r2_score(y_test, gb_pred)
            }
            
            # Neural Network
            self.models['nn'] = MLPRegressor(
                hidden_layer_sizes=(50, 30),
                max_iter=500,
                random_state=42
            )
            self.models['nn'].fit(X_train, y_train)
            nn_pred = self.models['nn'].predict(X_test)
            results['nn'] = {
                'mae': mean_absolute_error(y_test, nn_pred),
                'r2': r2_score(y_test, nn_pred)
            }
            
            # アンサンブル予測の評価
            ensemble_pred = (
                self.ensemble_weights['rf'] * rf_pred +
                self.ensemble_weights['gb'] * gb_pred +
                self.ensemble_weights['nn'] * nn_pred
            )
            results['ensemble'] = {
                'mae': mean_absolute_error(y_test, ensemble_pred),
                'r2': r2_score(y_test, ensemble_pred)
            }
            
            # モデルの保存
            self._save_models()
            
            # 特徴量重要度
            feature_importance = pd.DataFrame({
                'feature': self.feature_names,
                'importance': self.models['rf'].feature_importances_
            }).sort_values('importance', ascending=False)
            
            return {
                'success': True,
                'data_size': len(df),
                'results': results,
                'feature_importance': feature_importance.head(10).to_dict('records')
            }
            
        except Exception as e:
            print(f"学習エラー: {str(e)}")
            return {
                'success': False,
                'message': str(e)
            }
    
    def _prepare_features(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.Series]:
        """特徴量の準備"""
        features = pd.DataFrame()
        
        # 基本特徴量
        features['distance_km'] = df['distance_km']
        
        # 時間関連特徴量
        df['planned_datetime'] = pd.to_datetime(df['planned_time'])
        features['hour'] = df['planned_datetime'].dt.hour
        features['minute'] = df['planned_datetime'].dt.minute
        features['day_of_week'] = df['planned_datetime'].dt.dayofweek
        features['is_weekend'] = (features['day_of_week'] >= 5).astype(int)
        
        # ラッシュアワーフラグ
        features['is_rush_hour'] = features['hour'].apply(
            lambda x: 1 if x in [7, 8, 17, 18] else 0
        )
        
        # 天候エンコーディング
        weather_dummies = pd.get_dummies(df['weather'], prefix='weather')
        features = pd.concat([features, weather_dummies], axis=1)
        
        # 潮位
        features['tide_level'] = df['tide_level']
        features['is_high_tide'] = (features['tide_level'] > 150).astype(int)
        
        # 特徴量名を保存
        self.feature_names = features.columns.tolist()
        
        # ターゲット変数
        y = df['delay_minutes']
        
        return features, y
    
    def predict_tour_performance(self, date: str, activity_type: str,
                                guests: List[Dict], activity_location: Dict) -> Dict:
        """ツアーのパフォーマンス予測"""
        predictions = {
            'confidence_score': 85,  # デフォルト値
            'expected_delays': [],
            'recommendations': []
        }
        
        # モデルが学習済みかチェック
        if not any(model is not None for model in self.models.values()):
            predictions['recommendations'].append(
                "予測モデルが未学習です。実績データを蓄積してください。"
            )
            return predictions
        
        # 各ゲストの遅延予測
        for guest in guests:
            delay_pred = self._predict_delay(
                distance=10,  # 仮の値（実際は計算）
                hour=10,      # 仮の値
                day_of_week=datetime.strptime(date, '%Y-%m-%d').weekday(),
                weather='sunny',
                tide_level=150
            )
            
            predictions['expected_delays'].append({
                'guest_name': guest['name'],
                'predicted_delay': delay_pred['prediction'],
                'confidence_interval': delay_pred['confidence_interval']
            })
        
        # 信頼度スコアの計算
        if self.models['rf'] is not None:
            predictions['confidence_score'] = min(95, 85 + len(guests) * 2)
        
        # 推奨事項の生成
        predictions['recommendations'] = self._generate_recommendations(
            activity_type, predictions['expected_delays']
        )
        
        return predictions
    
    def _predict_delay(self, distance: float, hour: int, day_of_week: int,
                      weather: str, tide_level: float) -> Dict:
        """遅延時間の予測"""
        # 特徴量の準備
        features = pd.DataFrame({
            'distance_km': [distance],
            'hour': [hour],
            'minute': [0],
            'day_of_week': [day_of_week],
            'is_weekend': [1 if day_of_week >= 5 else 0],
            'is_rush_hour': [1 if hour in [7, 8, 17, 18] else 0],
            'tide_level': [tide_level],
            'is_high_tide': [1 if tide_level > 150 else 0]
        })
        
        # 天候のダミー変数を追加
        for weather_type in ['sunny', 'cloudy', 'rainy']:
            features[f'weather_{weather_type}'] = 1 if weather == weather_type else 0
        
        # 欠損している特徴量を0で埋める
        for col in self.feature_names:
            if col not in features.columns:
                features[col] = 0
        
        # 特徴量の順序を合わせる
        features = features[self.feature_names]
        
        # 各モデルの予測
        predictions = {}
        for name, model in self.models.items():
            if model is not None:
                try:
                    predictions[name] = model.predict(features)[0]
                except:
                    predictions[name] = 0
        
        # アンサンブル予測
        if predictions:
            ensemble_pred = sum(
                self.ensemble_weights.get(name, 0) * pred 
                for name, pred in predictions.items()
            )
        else:
            ensemble_pred = 0
        
        # 信頼区間（簡易版）
        std_dev = np.std(list(predictions.values())) if predictions else 5
        
        return {
            'prediction': max(0, int(ensemble_pred)),
            'confidence_interval': (
                max(0, int(ensemble_pred - 1.96 * std_dev)),
                int(ensemble_pred + 1.96 * std_dev)
            ),
            'individual_predictions': predictions
        }
    
    def _generate_recommendations(self, activity_type: str, 
                                 expected_delays: List[Dict]) -> List[str]:
        """推奨事項の生成"""
        recommendations = []
        
        # 活動タイプ別の推奨
        if activity_type == 'snorkeling' or activity_type == 'diving':
            recommendations.append("潮位が高い時間帯が最適です")
        elif activity_type in ['kayak', 'sup']:
            recommendations.append("風速に注意してください（5m/s以下推奨）")
        
        # 遅延予測に基づく推奨
        max_delay = max([d['predicted_delay'] for d in expected_delays], default=0)
        if max_delay > 10:
            recommendations.append(f"最大{max_delay}分の遅延が予想されます。余裕を持った計画を推奨します")
        
        return recommendations
    
    def _save_models(self):
        """モデルの保存"""
        for model_name, model in self.models.items():
            if model is not None:
                model_path = os.path.join(self.model_dir, f'{model_name}_model.pkl')
                joblib.dump(model, model_path)
        
        # メタデータの保存
        metadata = {
            'feature_names': self.feature_names,
            'last_trained': datetime.now().isoformat(),
            'ensemble_weights': self.ensemble_weights
        }
        
        meta_path = os.path.join(self.model_dir, 'model_metadata.json')
        with open(meta_path, 'w') as f:
            json.dump(metadata, f, indent=2)
        
        self.last_trained = metadata['last_trained']