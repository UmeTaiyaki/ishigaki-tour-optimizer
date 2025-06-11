# -*- coding: utf-8 -*-
"""
enhanced_optimizer.py - 動的時間決定システム搭載版
石垣島ツアー最適化システム

新機能:
- 気象情報に基づく智能時間決定
- ゲスト希望時間の動的調整
- 海況・風速を考慮した到着時間最適化
- リアルタイム時間調整システム
"""

import math
import random
import asyncio
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Tuple, Optional, Any
from dataclasses import dataclass

# ロギング設定
logger = logging.getLogger(__name__)

@dataclass
class OptimizationResult:
    """最適化結果クラス"""
    routes: List[Dict]
    total_distance: float
    total_time: int
    efficiency_score: float
    algorithm_used: str
    optimization_log: List[str]

@dataclass
class WeatherImpact:
    """気象影響分析クラス"""
    wind_speed_kmh: float
    wave_height_m: float
    visibility_level: str
    temperature_c: float
    travel_delay_factor: float  # 1.0 = 正常, >1.0 = 遅延
    comfort_factor: float       # 0-1.0 = 快適度
    activity_recommendation: str

class EnhancedTourOptimizer:
    """
    AI搭載ツアールート最適化クラス（動的時間決定版）
    """
    
    def __init__(self):
        self.average_speed_kmh = 30
        self.buffer_time_minutes = 10
        self.optimization_logs = []
        self.performance_stats = {
            'total_optimizations': 0,
            'successful_optimizations': 0,
            'average_optimization_time': 0,
            'best_efficiency_score': 0,
            'algorithm_usage': {}
        }
        
        # 🆕 動的時間決定パラメータ
        self.time_adjustment_settings = {
            'guest_preference_weight': 0.7,  # ゲスト希望時間の重要度
            'weather_impact_weight': 0.3,    # 気象影響の重要度
            'comfort_priority': True,        # 快適性を優先するか
            'safety_margin_minutes': 15      # 安全マージン
        }
        
        logger.info("[OK] EnhancedTourOptimizer 動的時間決定版初期化完了")

    def calculate_distance(self, lat1: float, lng1: float, lat2: float, lng2: float) -> float:
        """2点間の距離を計算（ハバーサイン公式）"""
        R = 6371  # 地球の半径（km）
        
        lat1_rad = math.radians(lat1)
        lat2_rad = math.radians(lat2)
        dlat = math.radians(lat2 - lat1)
        dlng = math.radians(lng2 - lng1)
        
        a = (math.sin(dlat/2)**2 + 
             math.cos(lat1_rad) * math.cos(lat2_rad) * 
             math.sin(dlng/2)**2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        
        return R * c

    # 🆕 気象影響分析システム
    def analyze_weather_impact(self, weather_data: Dict) -> WeatherImpact:
        """
        気象データから移動・活動への影響を分析
        """
        try:
            wind_speed = weather_data.get('wind_speed', 15)  # km/h
            wave_height = weather_data.get('wave_height', 1.0)  # m
            visibility = weather_data.get('visibility', '良好')
            temperature = weather_data.get('temperature', 26)  # °C
            
            # 移動遅延係数計算
            travel_delay = 1.0
            if wind_speed > 25:
                travel_delay += 0.1  # 強風で10%遅延
            if wave_height > 1.5:
                travel_delay += 0.15  # 高波で15%遅延
            if visibility in ['悪い', '不良']:
                travel_delay += 0.2  # 視界不良で20%遅延
            
            # 快適度計算
            comfort = 1.0
            if temperature < 20 or temperature > 32:
                comfort -= 0.2  # 気温による快適度低下
            if wind_speed > 20:
                comfort -= 0.15  # 強風による快適度低下
            if wave_height > 2.0:
                comfort -= 0.25  # 高波による快適度低下
            
            comfort = max(0.3, comfort)  # 最低30%の快適度を保証
            
            # アクティビティ推奨時間
            if wave_height < 1.0 and wind_speed < 15:
                recommendation = "早朝推奨"
            elif wave_height < 1.5 and wind_speed < 20:
                recommendation = "午前推奨"
            elif wind_speed > 25 or wave_height > 2.5:
                recommendation = "午後延期推奨"
            else:
                recommendation = "通常時間帯"
            
            return WeatherImpact(
                wind_speed_kmh=wind_speed,
                wave_height_m=wave_height,
                visibility_level=visibility,
                temperature_c=temperature,
                travel_delay_factor=travel_delay,
                comfort_factor=comfort,
                activity_recommendation=recommendation
            )
            
        except Exception as e:
            logger.warning(f"気象影響分析エラー: {e}")
            # デフォルト値を返す
            return WeatherImpact(
                wind_speed_kmh=15,
                wave_height_m=1.0,
                visibility_level='良好',
                temperature_c=26,
                travel_delay_factor=1.0,
                comfort_factor=0.8,
                activity_recommendation='通常時間帯'
            )

    def _parse_time(self, time_str: str) -> tuple:
        """時間文字列を時・分にパース"""
        try:
            hour, minute = map(int, time_str.split(':'))
            return hour, minute
        except:
            return 9, 0  # デフォルト: 09:00

    def _time_to_minutes(self, time_str: str) -> int:
        """時間文字列を分に変換"""
        hour, minute = self._parse_time(time_str)
        return hour * 60 + minute

    def _minutes_to_time(self, minutes: int) -> str:
        """分を時間文字列に変換"""
        hour = minutes // 60
        minute = minutes % 60
        return f"{hour:02d}:{minute:02d}"

    # 🆕 動的出発時間決定システム
    def calculate_optimal_departure_times(self, guests: List[Dict], weather_data: Dict) -> Dict[str, str]:
        """
        ゲストの希望時間と気象情報から最適な出発時間を動的決定
        """
        weather_impact = self.analyze_weather_impact(weather_data)
        
        # ゲストの希望時間を収集・分析
        guest_preferences = []
        for guest in guests:
            start_time = guest.get('preferred_pickup_start', '08:30')
            end_time = guest.get('preferred_pickup_end', '09:00')
            
            start_minutes = self._time_to_minutes(start_time)
            end_minutes = self._time_to_minutes(end_time)
            
            # 希望時間範囲の中央値
            preferred_minutes = (start_minutes + end_minutes) // 2
            guest_preferences.append({
                'guest_id': guest.get('id', ''),
                'guest_name': guest.get('name', ''),
                'preferred_minutes': preferred_minutes,
                'flexibility': end_minutes - start_minutes,  # 時間の柔軟性
                'weight': guest.get('num_people', 1)  # 人数による重み
            })
        
        # 重み付き平均で最適時間を計算
        total_weight = sum(p['weight'] for p in guest_preferences)
        if total_weight == 0:
            base_departure_minutes = 9 * 60  # 09:00
        else:
            weighted_sum = sum(p['preferred_minutes'] * p['weight'] for p in guest_preferences)
            base_departure_minutes = weighted_sum // total_weight
        
        # 気象影響による調整
        weather_adjustment = 0
        
        if weather_impact.travel_delay_factor > 1.1:
            # 移動遅延が予想される場合、早め出発
            weather_adjustment = -30  # 30分早める
        elif weather_impact.comfort_factor < 0.6:
            # 快適度が低い場合、気象条件の良い時間帯に調整
            if weather_impact.activity_recommendation == "早朝推奨":
                weather_adjustment = -45  # 45分早める
            elif weather_impact.activity_recommendation == "午前推奨":
                weather_adjustment = -15  # 15分早める
            elif weather_impact.activity_recommendation == "午後延期推奨":
                weather_adjustment = +120  # 2時間遅らせる
        
        # 最終出発時間決定
        adjusted_departure_minutes = base_departure_minutes + weather_adjustment
        
        # 安全時間帯に調整（06:00-18:00の範囲内）
        adjusted_departure_minutes = max(6 * 60, min(18 * 60, adjusted_departure_minutes))
        
        optimal_departure_time = self._minutes_to_time(adjusted_departure_minutes)
        
        return {
            'optimal_departure_time': optimal_departure_time,
            'base_time': self._minutes_to_time(base_departure_minutes),
            'weather_adjustment_minutes': weather_adjustment,
            'weather_reason': weather_impact.activity_recommendation,
            'guest_preference_average': self._minutes_to_time(base_departure_minutes),
            'flexibility_analysis': {
                'high_flexibility_guests': len([p for p in guest_preferences if p['flexibility'] > 60]),
                'low_flexibility_guests': len([p for p in guest_preferences if p['flexibility'] <= 30]),
                'total_guests': len(guest_preferences)
            }
        }

    # 🆕 動的到着時間決定システム
    def calculate_optimal_arrival_time(self, departure_time: str, distance_km: float, weather_data: Dict) -> Dict[str, Any]:
        """
        出発時間・距離・気象条件から最適な到着時間を動的計算
        """
        weather_impact = self.analyze_weather_impact(weather_data)
        
        # 基本移動時間計算
        base_travel_time_minutes = (distance_km / self.average_speed_kmh) * 60
        
        # 気象による移動時間調整
        weather_adjusted_time = base_travel_time_minutes * weather_impact.travel_delay_factor
        
        # 安全マージン追加
        safety_margin = self.time_adjustment_settings['safety_margin_minutes']
        total_travel_time = weather_adjusted_time + safety_margin
        
        # 到着時間計算
        departure_minutes = self._time_to_minutes(departure_time)
        arrival_minutes = departure_minutes + int(total_travel_time)
        
        # 24時間フォーマット調整
        if arrival_minutes >= 24 * 60:
            arrival_minutes = arrival_minutes % (24 * 60)
        
        arrival_time = self._minutes_to_time(arrival_minutes)
        
        # 快適性に基づく推奨事項
        comfort_recommendations = []
        if weather_impact.comfort_factor < 0.7:
            comfort_recommendations.append("休憩時間を長めに取ることを推奨")
        if weather_impact.wind_speed_kmh > 20:
            comfort_recommendations.append("風が強いため屋内待機時間を考慮")
        if weather_impact.wave_height_m > 1.5:
            comfort_recommendations.append("海況により活動時間を調整する可能性")
        
        return {
            'arrival_time': arrival_time,
            'total_travel_time_minutes': int(total_travel_time),
            'base_travel_time_minutes': int(base_travel_time_minutes),
            'weather_delay_minutes': int(weather_adjusted_time - base_travel_time_minutes),
            'safety_margin_minutes': safety_margin,
            'weather_impact': {
                'travel_delay_factor': weather_impact.travel_delay_factor,
                'comfort_factor': weather_impact.comfort_factor,
                'conditions': {
                    'wind_speed': weather_impact.wind_speed_kmh,
                    'wave_height': weather_impact.wave_height_m,
                    'visibility': weather_impact.visibility_level,
                    'temperature': weather_impact.temperature_c
                }
            },
            'comfort_recommendations': comfort_recommendations,
            'activity_suitability': weather_impact.activity_recommendation
        }

    # 🆕 時間制約を考慮したルート最適化（気象対応版）
    async def _optimize_route_with_dynamic_timing(self, assigned_guests: List[Dict], 
                                                activity_location: Dict, 
                                                weather_data: Dict,
                                                optimization_log: List[str]) -> List[Dict]:
        """
        動的時間決定システムを使用したルート最適化
        """
        optimization_log.append("[TIMING] 動的時間決定システム開始")
        
        # 最適出発時間決定
        departure_analysis = self.calculate_optimal_departure_times(assigned_guests, weather_data)
        optimal_departure = departure_analysis['optimal_departure_time']
        
        optimization_log.append(f"[TIMING] 最適出発時間: {optimal_departure}")
        optimization_log.append(f"[TIMING] 気象調整: {departure_analysis['weather_adjustment_minutes']}分")
        optimization_log.append(f"[TIMING] 気象理由: {departure_analysis['weather_reason']}")
        
        # ルート構築
        route = []
        current_time_minutes = self._time_to_minutes(optimal_departure)
        current_lat = activity_location['lat']
        current_lng = activity_location['lng']
        
        # ゲストを希望時間順にソート（調整版）
        sorted_guests = sorted(assigned_guests, key=lambda g: self._time_to_minutes(g.get('preferred_pickup_start', '08:30')))
        
        for i, guest in enumerate(sorted_guests):
            # 各ゲストへの移動距離計算
            distance_to_guest = self.calculate_distance(
                current_lat, current_lng,
                guest['pickup_lat'], guest['pickup_lng']
            )
            
            # 動的到着時間計算
            arrival_analysis = self.calculate_optimal_arrival_time(
                self._minutes_to_time(current_time_minutes),
                distance_to_guest,
                weather_data
            )
            
            # ピックアップ時間調整
            travel_time = arrival_analysis['total_travel_time_minutes']
            pickup_time_minutes = current_time_minutes + travel_time
            pickup_time = self._minutes_to_time(pickup_time_minutes)
            
            # ゲストの希望時間との適合性チェック
            guest_preferred_start = self._time_to_minutes(guest.get('preferred_pickup_start', '08:30'))
            guest_preferred_end = self._time_to_minutes(guest.get('preferred_pickup_end', '09:00'))
            
            time_compliance = "acceptable"
            if pickup_time_minutes < guest_preferred_start:
                time_compliance = "early"
                if pickup_time_minutes < guest_preferred_start - 30:
                    # 30分以上早い場合は調整
                    pickup_time_minutes = guest_preferred_start
                    pickup_time = self._minutes_to_time(pickup_time_minutes)
            elif pickup_time_minutes > guest_preferred_end:
                time_compliance = "late"
                if pickup_time_minutes > guest_preferred_end + 30:
                    # 30分以上遅い場合は調整
                    pickup_time_minutes = guest_preferred_end
                    pickup_time = self._minutes_to_time(pickup_time_minutes)
            
            # ルートエントリ作成
            route_entry = {
                'guest_id': guest['id'],
                'name': guest['name'],
                'hotel_name': guest['hotel_name'],
                'pickup_lat': guest['pickup_lat'],
                'pickup_lng': guest['pickup_lng'],
                'num_people': guest['num_people'],
                'pickup_time': pickup_time,
                'arrival_analysis': arrival_analysis,
                'time_compliance': time_compliance,
                'distance_from_previous': round(distance_to_guest, 1),
                'travel_time_minutes': travel_time,
                'weather_impact': arrival_analysis['weather_impact'],
                'comfort_recommendations': arrival_analysis['comfort_recommendations']
            }
            
            route.append(route_entry)
            
            # 次の位置と時間を更新
            current_lat = guest['pickup_lat']
            current_lng = guest['pickup_lng']
            current_time_minutes = pickup_time_minutes + 5  # 乗車時間5分
            
            optimization_log.append(
                f"[PICKUP] {guest['name']}: {pickup_time} "
                f"({time_compliance}, 移動{travel_time}分, 距離{distance_to_guest:.1f}km)"
            )
        
        # 最終目的地への移動
        if route:
            final_distance = self.calculate_distance(
                current_lat, current_lng,
                activity_location['lat'], activity_location['lng']
            )
            
            final_arrival_analysis = self.calculate_optimal_arrival_time(
                self._minutes_to_time(current_time_minutes),
                final_distance,
                weather_data
            )
            
            final_arrival_time = final_arrival_analysis['arrival_time']
            
            optimization_log.append(f"[ARRIVAL] 目的地到着: {final_arrival_time}")
            optimization_log.append(f"[WEATHER] 活動適性: {final_arrival_analysis['activity_suitability']}")
            
            # ルートに到着情報を追加
            route[-1]['final_destination'] = {
                'arrival_time': final_arrival_time,
                'arrival_analysis': final_arrival_analysis,
                'activity_location': activity_location
            }
        
        return route

    async def optimize_multi_vehicle_routes(self, 
                                          guests: List[Dict], 
                                          vehicles: List[Dict],
                                          activity_location: Dict, 
                                          activity_start_time: str,
                                          algorithm: str = 'nearest_neighbor',
                                          weather_data: Dict = None) -> Dict:
        """
        複数車両の最適ルート計算（動的時間決定版）
        """
        start_time = datetime.now()
        optimization_log = []
        
        try:
            self.performance_stats['total_optimizations'] += 1
            
            optimization_log.append(f"[START] 動的時間決定最適化開始: {algorithm}アルゴリズム")
            optimization_log.append(f"[DATA] ゲスト: {len(guests)}組, 車両: {len(vehicles)}台")
            
            # デフォルト気象データ
            if weather_data is None:
                weather_data = {
                    'wind_speed': 15,
                    'wave_height': 1.0,
                    'visibility': '良好',
                    'temperature': 26
                }
            
            # 気象影響分析
            weather_impact = self.analyze_weather_impact(weather_data)
            optimization_log.append(f"[WEATHER] 気象条件: 風速{weather_impact.wind_speed_kmh}km/h, 波高{weather_impact.wave_height_m}m")
            optimization_log.append(f"[WEATHER] 移動遅延係数: {weather_impact.travel_delay_factor:.2f}")
            optimization_log.append(f"[WEATHER] 快適度: {weather_impact.comfort_factor:.2f}")
            optimization_log.append(f"[WEATHER] 推奨: {weather_impact.activity_recommendation}")
            
            # 全ゲスト確実配置
            vehicle_assignments = await self._assign_all_guests_guaranteed(guests, vehicles, optimization_log)
            
            routes = []
            total_distance = 0
            total_time = 0
            
            for vehicle_id, assigned_guests in vehicle_assignments.items():
                if not assigned_guests:
                    continue
                
                vehicle = next(v for v in vehicles if v['id'] == vehicle_id)
                optimization_log.append(f"[VEHICLE] {vehicle['name']}: {len(assigned_guests)}組 ({sum(g['num_people'] for g in assigned_guests)}名)")
                
                # 🆕 動的時間決定ルート最適化
                optimized_route = await self._optimize_route_with_dynamic_timing(
                    assigned_guests, activity_location, weather_data, optimization_log
                )
                
                route_distance = self._calculate_route_distance(optimized_route, activity_location)
                route_time = self._calculate_route_time(optimized_route, activity_location)
                
                routes.append({
                    'vehicle_id': vehicle_id,
                    'vehicle_name': vehicle['name'],
                    'driver': vehicle['driver'],
                    'capacity': vehicle['capacity'],
                    'route': optimized_route,
                    'total_distance': round(route_distance, 1),
                    'estimated_time': route_time,
                    'passenger_count': sum(g['num_people'] for g in assigned_guests),
                    'efficiency_score': self._calculate_route_efficiency(
                        optimized_route, vehicle['capacity'], route_distance
                    ),
                    'weather_impact_summary': {
                        'travel_delay_factor': weather_impact.travel_delay_factor,
                        'comfort_factor': weather_impact.comfort_factor,
                        'activity_recommendation': weather_impact.activity_recommendation
                    }
                })
                
                total_distance += route_distance
                total_time = max(total_time, route_time)
                
                optimization_log.append(f"[RESULT] {vehicle['name']}: 距離{route_distance:.1f}km, 時間{route_time}分")
            
            # 全体効率スコア計算
            efficiency_score = self._calculate_overall_efficiency(routes, guests, vehicles)
            
            # 統計情報
            optimization_log.append(f"[SUMMARY] 総距離: {total_distance:.1f}km")
            optimization_log.append(f"[SUMMARY] 総時間: {total_time}分")
            optimization_log.append(f"[SUMMARY] 効率スコア: {efficiency_score:.1f}%")
            optimization_log.append(f"[SUMMARY] 使用車両: {len(routes)}/{len(vehicles)}台")
            optimization_log.append(f"[SUMMARY] 気象影響考慮: 完了")
            
            # 最適化時間計算
            end_time = datetime.now()
            optimization_duration = (end_time - start_time).total_seconds()
            
            optimization_log.append(f"[TIME] 最適化時間: {optimization_duration:.2f}秒")
            optimization_log.append(f"[COMPLETE] 動的時間決定最適化完了")
            
            # 統計更新
            self.performance_stats['successful_optimizations'] += 1
            
            logger.info(f"[SUCCESS] 動的時間決定最適化完了: {optimization_duration:.2f}秒, 効率: {efficiency_score:.1f}%")
            
            return {
                'routes': routes,
                'total_distance': round(total_distance, 1),
                'total_time': total_time,
                'efficiency_score': efficiency_score,
                'algorithm_used': f'{algorithm}_dynamic_timing',
                'optimization_log': optimization_log,
                'weather_summary': {
                    'conditions': weather_data,
                    'impact_analysis': {
                        'travel_delay_factor': weather_impact.travel_delay_factor,
                        'comfort_factor': weather_impact.comfort_factor,
                        'activity_recommendation': weather_impact.activity_recommendation
                    },
                    'timing_adjustments': {
                        'total_routes': len(routes),
                        'weather_adjusted_routes': len([r for r in routes if r.get('weather_impact_summary')])
                    }
                }
            }
            
        except Exception as e:
            optimization_log.append(f"[ERROR] エラー: {str(e)}")
            logger.error(f"最適化エラー: {e}")
            raise

    # 既存のヘルパーメソッド（省略部分は元のコードと同じ）
    async def _assign_all_guests_guaranteed(self, guests: List[Dict], vehicles: List[Dict], optimization_log: List[str]) -> Dict[str, List[Dict]]:
        """全ゲスト確実配置アルゴリズム（既存）"""
        optimization_log.append("[ASSIGN] 全ゲスト確実配置アルゴリズム開始")
        
        assignments = {vehicle['id']: [] for vehicle in vehicles}
        unassigned_guests = guests.copy()
        
        # Phase 1: 通常配置
        for guest in guests.copy():
            best_vehicle = None
            min_total_cost = float('inf')
            
            for vehicle in vehicles:
                current_passengers = sum(g['num_people'] for g in assignments[vehicle['id']])
                
                if current_passengers + guest['num_people'] > vehicle['capacity']:
                    continue
                
                if not assignments[vehicle['id']]:
                    distance_cost = self.calculate_distance(
                        vehicle['location']['lat'], vehicle['location']['lng'],
                        guest['pickup_lat'], guest['pickup_lng']
                    )
                else:
                    last_guest = assignments[vehicle['id']][-1]
                    distance_cost = self.calculate_distance(
                        last_guest['pickup_lat'], last_guest['pickup_lng'],
                        guest['pickup_lat'], guest['pickup_lng']
                    )
                
                if distance_cost < min_total_cost:
                    min_total_cost = distance_cost
                    best_vehicle = vehicle['id']
            
            if best_vehicle:
                assignments[best_vehicle].append(guest)
                unassigned_guests.remove(guest)
                optimization_log.append(f"[ASSIGN] {guest['name']} → 車両{best_vehicle}")
        
        # Phase 2: 未配置ゲストの強制配置
        if unassigned_guests:
            optimization_log.append(f"[ASSIGN] Phase 2: 未配置ゲスト {len(unassigned_guests)}組の強制配置")
            
            for guest in unassigned_guests:
                best_vehicle = None
                min_overflow = float('inf')
                
                for vehicle in vehicles:
                    current_passengers = sum(g['num_people'] for g in assignments[vehicle['id']])
                    overflow = max(0, current_passengers + guest['num_people'] - vehicle['capacity'])
                    
                    if overflow < min_overflow:
                        min_overflow = overflow
                        best_vehicle = vehicle['id']
                
                if best_vehicle:
                    assignments[best_vehicle].append(guest)
                    optimization_log.append(f"[ASSIGN] 強制配置: {guest['name']} → 車両{best_vehicle}")
        
        return assignments

    def _calculate_route_distance(self, route: List[Dict], activity_location: Dict) -> float:
        """ルート総距離計算"""
        if not route:
            return 0
        
        total_distance = 0
        prev_lat = activity_location['lat']
        prev_lng = activity_location['lng']
        
        for stop in route:
            distance = self.calculate_distance(prev_lat, prev_lng, stop['pickup_lat'], stop['pickup_lng'])
            total_distance += distance
            prev_lat = stop['pickup_lat']
            prev_lng = stop['pickup_lng']
        
        # 最終目的地への距離
        final_distance = self.calculate_distance(prev_lat, prev_lng, activity_location['lat'], activity_location['lng'])
        total_distance += final_distance
        
        return total_distance

    def _calculate_route_time(self, route: List[Dict], activity_location: Dict) -> int:
        """ルート総時間計算"""
        if not route:
            return 0
        
        # 最初のピックアップ時間から最後の到着時間まで
        first_pickup = route[0]['pickup_time']
        
        # 最後のゲストの情報または最終目的地情報から到着時間を取得
        if 'final_destination' in route[-1]:
            last_arrival = route[-1]['final_destination']['arrival_time']
        else:
            # フォールバック: 最後のピックアップ時間＋推定移動時間
            last_pickup = route[-1]['pickup_time']
            estimated_travel = 60  # 1時間と仮定
            last_pickup_minutes = self._time_to_minutes(last_pickup)
            last_arrival = self._minutes_to_time(last_pickup_minutes + estimated_travel)
        
        first_minutes = self._time_to_minutes(first_pickup)
        last_minutes = self._time_to_minutes(last_arrival)
        
        return last_minutes - first_minutes

    def _calculate_route_efficiency(self, route: List[Dict], vehicle_capacity: int, route_distance: float) -> float:
        """ルート効率計算"""
        if not route:
            return 0
        
        passenger_count = sum(stop['num_people'] for stop in route)
        capacity_utilization = min(passenger_count / vehicle_capacity, 1.0)
        distance_efficiency = max(0, 1 - (route_distance - 15) / 30)
        time_compliance = 1.0
        
        efficiency = (capacity_utilization * 0.4 + distance_efficiency * 0.3 + time_compliance * 0.3) * 100
        return min(efficiency, 100)

    def _calculate_overall_efficiency(self, routes: List[Dict], guests: List[Dict], vehicles: List[Dict]) -> float:
        """全体効率スコア計算"""
        if not routes:
            return 0
        
        total_passengers = sum(g['num_people'] for g in guests)
        total_capacity = sum(v['capacity'] for v in vehicles)
        total_distance = sum(r['total_distance'] for r in routes)
        used_vehicles = len(routes)
        available_vehicles = len(vehicles)
        
        capacity_utilization = (total_passengers / total_capacity) * 100
        vehicle_utilization = (used_vehicles / available_vehicles) * 100
        distance_efficiency = max(0, 100 - (total_distance - 30) * 1.5)
        guest_coverage = (sum(r['passenger_count'] for r in routes) / total_passengers) * 100
        
        overall_efficiency = (
            capacity_utilization * 0.25 +
            vehicle_utilization * 0.25 +
            distance_efficiency * 0.25 +
            guest_coverage * 0.25
        )
        
        return min(overall_efficiency, 100)

    async def get_performance_statistics(self) -> Dict:
        """パフォーマンス統計取得"""
        return {
            'total_optimizations': self.performance_stats['total_optimizations'],
            'successful_optimizations': self.performance_stats['successful_optimizations'],
            'success_rate': (
                self.performance_stats['successful_optimizations'] / 
                max(self.performance_stats['total_optimizations'], 1)
            ) * 100,
            'average_optimization_time': round(self.performance_stats['average_optimization_time'], 2),
            'best_efficiency_score': self.performance_stats['best_efficiency_score'],
            'algorithm_usage': dict(self.performance_stats['algorithm_usage']),
            'last_updated': datetime.now().isoformat(),
            'version': 'dynamic_timing_v1.0',
            'features': ['dynamic_timing', 'weather_integration', 'guest_preference_optimization']
        }

    async def get_recent_logs(self, limit: int = 50) -> List[Dict]:
        """最近の最適化ログ取得"""
        return self.optimization_logs[-limit:] if self.optimization_logs else []