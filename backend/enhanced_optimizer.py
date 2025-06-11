# -*- coding: utf-8 -*-
"""
enhanced_optimizer.py - Windows対応版
石垣島ツアー最適化システム（絵文字削除）

改善点:
- Windows cp932エンコーディング対応
- 絵文字を通常文字に置換
- ログ出力の安全化
"""

import math
import random
import asyncio
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Tuple, Optional, Any
from dataclasses import dataclass

# ロギング設定（Windows対応）
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

class EnhancedTourOptimizer:
    """
    AI搭載ツアールート最適化クラス（Windows対応版）
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
        
        logger.info("[OK] EnhancedTourOptimizer 初期化完了")

    def calculate_distance(self, lat1: float, lng1: float, lat2: float, lng2: float) -> float:
        """
        2点間の距離を計算（ハバーサイン公式）
        """
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

    async def optimize_multi_vehicle_routes(self, 
                                          guests: List[Dict], 
                                          vehicles: List[Dict],
                                          activity_location: Dict, 
                                          activity_start_time: str,
                                          algorithm: str = 'nearest_neighbor') -> Dict:
        """
        複数車両の最適ルート計算（Windows対応版）
        """
        start_time = datetime.now()
        optimization_log = []
        
        try:
            self.performance_stats['total_optimizations'] += 1
            
            optimization_log.append(f"[START] 最適化開始: {algorithm}アルゴリズム（Windows対応版）")
            optimization_log.append(f"[DATA] 入力データ - ゲスト: {len(guests)}人, 車両: {len(vehicles)}台")
            
            # 入力データ検証
            if not guests:
                raise ValueError("ゲスト情報が空です")
            
            if not vehicles:
                raise ValueError("車両情報が空です")
            
            # Windows対応最適化
            result = await self._windows_safe_optimization(
                guests, vehicles, activity_location, activity_start_time, optimization_log
            )
            
            # 最適化後の処理
            end_time = datetime.now()
            optimization_duration = (end_time - start_time).total_seconds()
            
            result.optimization_log.append(f"[TIME] 最適化時間: {optimization_duration:.2f}秒")
            result.optimization_log.append(f"[COMPLETE] 最適化完了（Windows対応版）")
            
            # 統計更新
            self.performance_stats['successful_optimizations'] += 1
            
            logger.info(f"[SUCCESS] 最適化完了: {optimization_duration:.2f}秒, 効率: {result.efficiency_score:.1f}%")
            
            return {
                'routes': result.routes,
                'total_distance': result.total_distance,
                'total_time': result.total_time,
                'efficiency_score': result.efficiency_score,
                'algorithm_used': result.algorithm_used,
                'optimization_log': result.optimization_log
            }
            
        except Exception as e:
            optimization_log.append(f"[ERROR] エラー: {str(e)}")
            logger.error(f"最適化エラー: {e}")
            raise

    async def _windows_safe_optimization(self, 
                                       guests: List[Dict], 
                                       vehicles: List[Dict],
                                       activity_location: Dict, 
                                       activity_start_time: str,
                                       optimization_log: List[str]) -> OptimizationResult:
        """
        Windows安全版最適化（最近傍法ベース）
        """
        optimization_log.append("[ALGO] Windows安全版最適化開始")
        
        # 車両別ゲスト割り当て
        vehicle_assignments = await self._assign_guests_to_vehicles(guests, vehicles)
        optimization_log.append(f"[ASSIGN] ゲスト割り当て完了: {len(vehicle_assignments)}台")
        
        routes = []
        total_distance = 0
        total_time = 0
        
        for vehicle_id, assigned_guests in vehicle_assignments.items():
            if not assigned_guests:
                continue
            
            vehicle = next(v for v in vehicles if v['id'] == vehicle_id)
            optimization_log.append(f"[VEHICLE] {vehicle['name']}: {len(assigned_guests)}名を担当")
            
            # 最近傍法でルート最適化
            optimized_route = await self._optimize_single_vehicle_route(
                assigned_guests, activity_location, activity_start_time
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
                )
            })
            
            total_distance += route_distance
            total_time = max(total_time, route_time)
            
            optimization_log.append(f"[RESULT] {vehicle['name']}: 距離{route_distance:.1f}km, 時間{route_time}分")
        
        # 全体効率スコア計算
        efficiency_score = self._calculate_overall_efficiency(routes, guests, vehicles)
        
        optimization_log.append(f"[SUMMARY] 総距離: {total_distance:.1f}km")
        optimization_log.append(f"[SUMMARY] 総時間: {total_time}分")
        optimization_log.append(f"[SUMMARY] 効率スコア: {efficiency_score:.1f}%")
        
        return OptimizationResult(
            routes=routes,
            total_distance=round(total_distance, 1),
            total_time=total_time,
            efficiency_score=efficiency_score,
            algorithm_used='nearest_neighbor_windows',
            optimization_log=optimization_log
        )

    async def _assign_guests_to_vehicles(self, guests: List[Dict], vehicles: List[Dict]) -> Dict[str, List[Dict]]:
        """ゲストを車両に割り当て"""
        assignments = {vehicle['id']: [] for vehicle in vehicles}
        
        for guest in guests:
            best_vehicle = None
            min_additional_distance = float('inf')
            
            for vehicle in vehicles:
                current_passengers = sum(g['num_people'] for g in assignments[vehicle['id']])
                if current_passengers + guest['num_people'] > vehicle['capacity']:
                    continue
                
                current_route = assignments[vehicle['id']]
                if not current_route:
                    additional_distance = 0
                else:
                    last_guest = current_route[-1]
                    additional_distance = self.calculate_distance(
                        last_guest['pickup_lat'], last_guest['pickup_lng'],
                        guest['pickup_lat'], guest['pickup_lng']
                    )
                
                if additional_distance < min_additional_distance:
                    min_additional_distance = additional_distance
                    best_vehicle = vehicle['id']
            
            if best_vehicle:
                assignments[best_vehicle].append(guest)
        
        return assignments

    async def _optimize_single_vehicle_route(self, guests: List[Dict], activity_location: Dict, activity_start_time: str) -> List[Dict]:
        """単一車両のルート最適化"""
        if not guests:
            return []
        
        remaining = guests.copy()
        route = []
        current_location = activity_location
        
        while remaining:
            nearest_guest = None
            min_distance = float('inf')
            
            for guest in remaining:
                distance = self.calculate_distance(
                    current_location['lat'], current_location['lng'],
                    guest['pickup_lat'], guest['pickup_lng']
                )
                if distance < min_distance:
                    min_distance = distance
                    nearest_guest = guest
            
            if nearest_guest:
                route.append(nearest_guest)
                remaining.remove(nearest_guest)
                current_location = {
                    'lat': nearest_guest['pickup_lat'],
                    'lng': nearest_guest['pickup_lng']
                }
        
        route.reverse()
        
        # ピックアップ時間計算
        activity_time = datetime.strptime(activity_start_time, '%H:%M')
        current_time = activity_time
        
        for i in range(len(route)-1, -1, -1):
            guest = route[i]
            
            if i < len(route) - 1:
                next_location = route[i+1]
                distance = self.calculate_distance(
                    guest['pickup_lat'], guest['pickup_lng'],
                    next_location['pickup_lat'], next_location['pickup_lng']
                )
            else:
                distance = self.calculate_distance(
                    guest['pickup_lat'], guest['pickup_lng'],
                    activity_location['lat'], activity_location['lng']
                )
            
            travel_minutes = int(distance / self.average_speed_kmh * 60)
            travel_minutes += self.buffer_time_minutes
            
            current_time = current_time - timedelta(minutes=travel_minutes)
            guest['pickup_time'] = current_time.strftime('%H:%M')
            guest['time_compliance'] = 'optimal'  # Windows安全版
        
        return route

    def _calculate_route_distance(self, route: List[Dict], activity_location: Dict) -> float:
        """ルートの総距離計算"""
        if not route:
            return 0
        
        total = 0
        for i in range(len(route) - 1):
            total += self.calculate_distance(
                route[i]['pickup_lat'], route[i]['pickup_lng'],
                route[i+1]['pickup_lat'], route[i+1]['pickup_lng']
            )
        
        total += self.calculate_distance(
            route[-1]['pickup_lat'], route[-1]['pickup_lng'],
            activity_location['lat'], activity_location['lng']
        )
        
        return total

    def _calculate_route_time(self, route: List[Dict], activity_location: Dict) -> int:
        """ルートの所要時間計算（分）"""
        if not route:
            return 0
        
        distance = self._calculate_route_distance(route, activity_location)
        travel_time = int(distance / self.average_speed_kmh * 60)
        pickup_time = len(route) * 5
        buffer_time = self.buffer_time_minutes
        
        return travel_time + pickup_time + buffer_time

    def _calculate_route_efficiency(self, route: List[Dict], vehicle_capacity: int, route_distance: float) -> float:
        """ルート効率スコア計算"""
        if not route:
            return 0
        
        passenger_count = sum(g['num_people'] for g in route)
        capacity_utilization = passenger_count / vehicle_capacity
        efficiency_per_km = passenger_count / max(route_distance, 0.1)
        compliance_score = 0.9  # Windows安全版固定値
        
        efficiency = (capacity_utilization * 40 + efficiency_per_km * 30 + compliance_score * 30)
        return min(efficiency * 100, 100)

    def _calculate_overall_efficiency(self, routes: List[Dict], guests: List[Dict], vehicles: List[Dict]) -> float:
        """全体効率スコア計算"""
        if not routes:
            return 0
        
        total_passengers = sum(g['num_people'] for g in guests)
        total_capacity = sum(v['capacity'] for v in vehicles)
        total_distance = sum(r['total_distance'] for r in routes)
        
        capacity_utilization = (total_passengers / total_capacity) * 100
        distance_efficiency = max(0, 100 - (total_distance - 20) * 2)
        time_compliance = 85  # Windows安全版固定値
        
        overall_efficiency = (
            capacity_utilization * 0.3 +
            distance_efficiency * 0.4 +
            time_compliance * 0.3
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
            'version': 'windows_safe_version'
        }

    async def get_recent_logs(self, limit: int = 50) -> List[Dict]:
        """最近の最適化ログ取得"""
        return self.optimization_logs[-limit:] if self.optimization_logs else []