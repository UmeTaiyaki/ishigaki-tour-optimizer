import math
from datetime import datetime, timedelta
from typing import List, Dict, Tuple

class TourOptimizer:
    """ツアールート最適化クラス"""
    
    def __init__(self):
        self.average_speed_kmh = 30  # 平均移動速度（km/h）
        self.buffer_time_minutes = 10  # バッファ時間（分）
    
    def calculate_distance(self, lat1: float, lng1: float, lat2: float, lng2: float) -> float:
        """
        2点間の距離を計算（ハバースine公式）
        
        Args:
            lat1, lng1: 地点1の緯度経度
            lat2, lng2: 地点2の緯度経度
            
        Returns:
            距離（km）
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
    
    def optimize_route(self, guests: List[Dict], activity_location: Dict, 
                      activity_start_time: str) -> Dict:
        """
        最適なピックアップルートを計算
        
        Args:
            guests: ゲスト情報のリスト
            activity_location: アクティビティ地点の座標
            activity_start_time: アクティビティ開始時刻
            
        Returns:
            最適化されたルート情報
        """
        if not guests:
            return {
                'route': [],
                'total_distance': 0,
                'estimated_duration': '0分'
            }
        
        # 最近傍法でルートを最適化
        optimized_order = self._optimize_pickup_order(guests, activity_location)
        
        # ピックアップ時間を計算
        route_with_times = self._calculate_pickup_times(
            optimized_order, activity_location, activity_start_time
        )
        
        # 総距離を計算
        total_distance = self._calculate_total_distance(
            route_with_times, activity_location
        )
        
        # 推定所要時間
        if route_with_times:
            first_pickup = route_with_times[0]['pickup_time']
            duration_minutes = self._time_difference_minutes(
                first_pickup, activity_start_time
            )
            estimated_duration = f"{duration_minutes}分"
        else:
            estimated_duration = "0分"
        
        return {
            'route': route_with_times,
            'total_distance': round(total_distance, 1),
            'estimated_duration': estimated_duration
        }
    
    def _optimize_pickup_order(self, guests: List[Dict], 
                              activity_location: Dict) -> List[Dict]:
        """
        最近傍法による順序最適化
        """
        remaining = guests.copy()
        route = []
        current_location = activity_location
        
        while remaining:
            # 現在地から最も近いゲストを選択
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
        
        # 遠い順に並べ替え（最初にピックアップ）
        route.reverse()
        
        return route
    
    def _calculate_pickup_times(self, route: List[Dict], 
                               activity_location: Dict, 
                               activity_start_time: str) -> List[Dict]:
        """
        各ゲストのピックアップ時間を計算
        """
        activity_time = datetime.strptime(activity_start_time, '%H:%M')
        current_time = activity_time
        
        # 逆順で計算（アクティビティ地点から逆算）
        for i in range(len(route)-1, -1, -1):
            guest = route[i].copy()
            
            # 次の地点への移動時間を計算
            if i < len(route) - 1:
                next_location = route[i+1]
                distance = self.calculate_distance(
                    guest['pickup_lat'], guest['pickup_lng'],
                    next_location['pickup_lat'], next_location['pickup_lng']
                )
            else:
                # 最後のゲストからアクティビティ地点
                distance = self.calculate_distance(
                    guest['pickup_lat'], guest['pickup_lng'],
                    activity_location['lat'], activity_location['lng']
                )
            
            # 移動時間（分）
            travel_minutes = int(distance / self.average_speed_kmh * 60)
            travel_minutes += self.buffer_time_minutes
            
            # ピックアップ時間を設定
            current_time = current_time - timedelta(minutes=travel_minutes)
            guest['pickup_time'] = current_time.strftime('%H:%M')
            
            # 希望時間との適合性をチェック
            guest['time_compliance'] = self._check_time_compliance(
                guest['pickup_time'],
                guest['preferred_pickup_start'],
                guest['preferred_pickup_end']
            )
            
            route[i] = guest
        
        return route
    
    def _check_time_compliance(self, pickup_time: str, 
                               preferred_start: str, 
                               preferred_end: str) -> str:
        """
        希望時間との適合性をチェック
        """
        pickup = datetime.strptime(pickup_time, '%H:%M')
        start = datetime.strptime(preferred_start, '%H:%M')
        end = datetime.strptime(preferred_end, '%H:%M')
        
        if start <= pickup <= end:
            return 'optimal'
        
        # 差分を計算
        if pickup < start:
            diff = (start - pickup).seconds // 60
        else:
            diff = (pickup - end).seconds // 60
        
        if diff <= 15:
            return 'acceptable'
        else:
            return 'warning'
    
    def _calculate_total_distance(self, route: List[Dict], 
                                 activity_location: Dict) -> float:
        """
        総移動距離を計算
        """
        if not route:
            return 0
        
        total = 0
        
        # ゲスト間の距離
        for i in range(len(route) - 1):
            total += self.calculate_distance(
                route[i]['pickup_lat'], route[i]['pickup_lng'],
                route[i+1]['pickup_lat'], route[i+1]['pickup_lng']
            )
        
        # 最後のゲストからアクティビティ地点
        total += self.calculate_distance(
            route[-1]['pickup_lat'], route[-1]['pickup_lng'],
            activity_location['lat'], activity_location['lng']
        )
        
        return total
    
    def _time_difference_minutes(self, time1: str, time2: str) -> int:
        """
        2つの時刻の差を分で返す
        """
        t1 = datetime.strptime(time1, '%H:%M')
        t2 = datetime.strptime(time2, '%H:%M')
        return int((t2 - t1).seconds / 60)