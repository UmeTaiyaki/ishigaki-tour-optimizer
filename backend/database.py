import sqlite3
import os
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional

# データベースファイルのパス
DB_PATH = 'tour_data.db'

def get_db_connection():
    """データベース接続を取得"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # 列名でアクセス可能にする
    return conn

def init_db():
    """データベースの初期化"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 既存のテーブルを削除（開発時のみ）
    # cursor.execute("DROP TABLE IF EXISTS pickup_records")
    # cursor.execute("DROP TABLE IF EXISTS vehicle_performance")
    # cursor.execute("DROP TABLE IF EXISTS ishigaki_hotels")
    # cursor.execute("DROP TABLE IF EXISTS ishigaki_traffic_patterns")
    # cursor.execute("DROP TABLE IF EXISTS ishigaki_prediction_accuracy")
    
    # pickup_recordsテーブル
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS pickup_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tour_date TEXT NOT NULL,
            planned_time TEXT NOT NULL,
            actual_time TEXT NOT NULL,
            guest_name TEXT NOT NULL,
            hotel_name TEXT NOT NULL,
            delay_minutes INTEGER DEFAULT 0,
            distance_km REAL NOT NULL,
            weather TEXT,
            tide_level REAL,
            vehicle_id TEXT,
            driver_name TEXT,
            activity_type TEXT,
            guest_satisfaction INTEGER,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # 車両パフォーマンステーブル
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS vehicle_performance (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            vehicle_id TEXT NOT NULL,
            vehicle_name TEXT NOT NULL,
            date TEXT NOT NULL,
            total_distance REAL,
            total_time_minutes INTEGER,
            fuel_consumption REAL,
            driver_name TEXT,
            driver_rating REAL,
            route_efficiency_score REAL,
            guest_count INTEGER,
            on_time_percentage REAL,
            maintenance_notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # 石垣島ホテル情報テーブル
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS ishigaki_hotels (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            hotel_name TEXT NOT NULL UNIQUE,
            area TEXT NOT NULL,
            latitude REAL NOT NULL,
            longitude REAL NOT NULL,
            hotel_type TEXT,
            capacity INTEGER,
            pickup_difficulty_level INTEGER DEFAULT 1,
            parking_availability BOOLEAN DEFAULT 0,
            access_road_quality TEXT DEFAULT 'good',
            popular_activities TEXT,
            contact_phone TEXT,
            special_instructions TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # 石垣島交通パターンテーブル
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS ishigaki_traffic_patterns (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            hour INTEGER NOT NULL,
            area TEXT NOT NULL,
            congestion_level INTEGER DEFAULT 1,
            average_speed_kmh REAL,
            weather_condition TEXT,
            event_impact TEXT,
            tourist_season_factor REAL DEFAULT 1.0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # 石垣島予測精度テーブル
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS ishigaki_prediction_accuracy (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            prediction_date TEXT NOT NULL,
            actual_date TEXT NOT NULL,
            guest_name TEXT NOT NULL,
            predicted_delay INTEGER,
            actual_delay INTEGER,
            accuracy_score REAL,
            model_version TEXT,
            environmental_factors TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # 石垣島環境データテーブル
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS ishigaki_environmental_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            weather_condition TEXT,
            temperature REAL,
            wind_speed REAL,
            wind_direction TEXT,
            precipitation REAL DEFAULT 0,
            humidity REAL,
            uv_index INTEGER,
            tide_high_1_time TEXT,
            tide_high_1_level REAL,
            tide_high_2_time TEXT,
            tide_high_2_level REAL,
            tide_low_1_time TEXT,
            tide_low_1_level REAL,
            tide_low_2_time TEXT,
            tide_low_2_level REAL,
            wave_height REAL,
            water_temperature REAL,
            visibility TEXT DEFAULT 'good',
            typhoon_risk INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # インデックスの作成
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_pickup_records_date ON pickup_records(tour_date)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_vehicle_performance_date ON vehicle_performance(date)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_hotels_area ON ishigaki_hotels(area)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_traffic_date_hour ON ishigaki_traffic_patterns(date, hour)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_prediction_date ON ishigaki_prediction_accuracy(prediction_date)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_environmental_date ON ishigaki_environmental_data(date)")
    
    conn.commit()
    
    # 初期データの投入
    insert_initial_data(cursor)
    
    conn.commit()
    conn.close()
    
    print("🏝️ 石垣島専用データベースを初期化しました")

def insert_initial_data(cursor):
    """石垣島の基本データを初期投入"""
    
    # 主要ホテルデータ
    hotels_data = [
        ('ANAインターコンチネンタル石垣リゾート', 'fusaki', 24.3892, 124.1256, 'resort', 458, 2, True, 'excellent', 'snorkeling,diving,kayak', '0980-88-7111', '大型バス駐車場あり'),
        ('フサキビーチリゾート ホテル＆ヴィラズ', 'fusaki', 24.3889, 124.1253, 'resort', 600, 2, True, 'excellent', 'beach,snorkeling', '0980-88-7000', 'ビーチフロント、送迎バス運行'),
        ('グランヴィリオ リゾート石垣島', 'city_center', 24.3380, 124.1572, 'hotel', 330, 3, False, 'good', 'sightseeing,diving', '0980-88-0101', '市街地中心部、駐車場限定的'),
        ('アートホテル石垣島', 'city_center', 24.3360, 124.1580, 'hotel', 245, 3, False, 'good', 'sightseeing', '0980-83-3311', '離島ターミナル近く'),
        ('川平湾グラスボート', 'kabira_bay', 24.4219, 124.1542, 'guesthouse', 30, 1, True, 'excellent', 'glass_boat,snorkeling', '0980-88-2335', '川平湾展望台近く'),
        ('白保ペンション', 'shiraho', 24.3065, 124.2158, 'pension', 20, 1, True, 'good', 'snorkeling,diving', '0980-86-7654', '白保サンゴ礁至近'),
        ('米原ビーチハウス', 'yonehara', 24.4542, 124.1628, 'guesthouse', 25, 1, True, 'good', 'snorkeling,beach', '0980-88-9876', '米原ビーチ目の前'),
        ('石垣島ホテルククル', 'city_center', 24.3370, 124.1585, 'hotel', 80, 2, False, 'good', 'sightseeing', '0980-88-5555', '繁華街中心部'),
        ('ザ・ビーチタワー沖縄', 'north_coast', 24.4567, 124.1289, 'resort', 403, 2, True, 'excellent', 'sunset,beach', '0980-88-9999', '夕日スポット近く')
    ]
    
    for hotel_data in hotels_data:
        cursor.execute("""
            INSERT OR IGNORE INTO ishigaki_hotels 
            (hotel_name, area, latitude, longitude, hotel_type, capacity, 
             pickup_difficulty_level, parking_availability, access_road_quality, 
             popular_activities, contact_phone, special_instructions)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, hotel_data)
    
    # 石垣島の主要エリア交通パターン（サンプルデータ）
    traffic_patterns = [
        # 市街地エリア（朝のラッシュ）
        ('2025-06-10', 8, 'city_center', 3, 25.0, 'sunny', 'morning_rush', 1.2),
        ('2025-06-10', 9, 'city_center', 2, 35.0, 'sunny', 'normal', 1.1),
        ('2025-06-10', 17, 'city_center', 3, 20.0, 'sunny', 'evening_rush', 1.3),
        
        # 川平湾エリア（観光ピーク）
        ('2025-06-10', 10, 'kabira_bay', 2, 30.0, 'sunny', 'tourist_peak', 1.5),
        ('2025-06-10', 11, 'kabira_bay', 3, 20.0, 'sunny', 'tourist_peak', 1.8),
        ('2025-06-10', 14, 'kabira_bay', 2, 35.0, 'sunny', 'normal', 1.2),
        
        # フサキエリア
        ('2025-06-10', 9, 'fusaki', 1, 45.0, 'sunny', 'normal', 1.0),
        ('2025-06-10', 15, 'fusaki', 2, 40.0, 'sunny', 'hotel_checkout', 1.1),
    ]
    
    for pattern in traffic_patterns:
        cursor.execute("""
            INSERT OR IGNORE INTO ishigaki_traffic_patterns 
            (date, hour, area, congestion_level, average_speed_kmh, 
             weather_condition, event_impact, tourist_season_factor)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, pattern)
    
    # 環境データのサンプル
    environmental_data = [
        ('2025-06-10', 'sunny', 26.5, 4.2, 'NE', 0.0, 72, 8, 
         '08:30', 210, '20:45', 205, '02:15', 45, '14:30', 50,
         0.5, 25.0, 'good', 0),
        ('2025-06-11', 'cloudy', 25.8, 5.1, 'E', 2.0, 78, 6,
         '09:15', 195, '21:30', 190, '03:00', 50, '15:15', 55,
         0.8, 24.5, 'good', 0)
    ]
    
    for env_data in environmental_data:
        cursor.execute("""
            INSERT OR IGNORE INTO ishigaki_environmental_data 
            (date, weather_condition, temperature, wind_speed, wind_direction,
             precipitation, humidity, uv_index, tide_high_1_time, tide_high_1_level,
             tide_high_2_time, tide_high_2_level, tide_low_1_time, tide_low_1_level,
             tide_low_2_time, tide_low_2_level, wave_height, water_temperature,
             visibility, typhoon_risk)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, env_data)

def save_pickup_record(record_data: Dict):
    """ピックアップ記録を保存"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        INSERT INTO pickup_records 
        (tour_date, planned_time, actual_time, guest_name, hotel_name,
         delay_minutes, distance_km, weather, tide_level, vehicle_id, 
         driver_name, activity_type, guest_satisfaction, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        record_data['tour_date'],
        record_data['planned_time'],
        record_data['actual_time'],
        record_data['guest_name'],
        record_data['hotel_name'],
        record_data['delay_minutes'],
        record_data['distance_km'],
        record_data.get('weather'),
        record_data.get('tide_level'),
        record_data.get('vehicle_id'),
        record_data.get('driver_name'),
        record_data.get('activity_type'),
        record_data.get('guest_satisfaction'),
        record_data.get('notes')
    ))
    
    conn.commit()
    conn.close()

def save_vehicle_performance(performance_data: Dict):
    """車両パフォーマンスデータを保存"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        INSERT INTO vehicle_performance 
        (vehicle_id, vehicle_name, date, total_distance, total_time_minutes,
         fuel_consumption, driver_name, driver_rating, route_efficiency_score,
         guest_count, on_time_percentage, maintenance_notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        performance_data['vehicle_id'],
        performance_data['vehicle_name'],
        performance_data['date'],
        performance_data['total_distance'],
        performance_data['total_time_minutes'],
        performance_data.get('fuel_consumption'),
        performance_data['driver_name'],
        performance_data.get('driver_rating'),
        performance_data.get('route_efficiency_score'),
        performance_data['guest_count'],
        performance_data.get('on_time_percentage'),
        performance_data.get('maintenance_notes')
    ))
    
    conn.commit()
    conn.close()

def get_traffic_pattern(date: str, hour: int) -> List[Dict]:
    """交通パターンデータを取得"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT * FROM ishigaki_traffic_patterns 
        WHERE date = ? AND hour = ?
    """, (date, hour))
    
    results = cursor.fetchall()
    conn.close()
    
    return [dict(row) for row in results]

def get_area_traffic_patterns(date: str, area: str) -> List[Dict]:
    """特定エリアの交通パターンを取得"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT * FROM ishigaki_traffic_patterns 
        WHERE date = ? AND area = ?
        ORDER BY hour
    """, (date, area))
    
    results = cursor.fetchall()
    conn.close()
    
    return [dict(row) for row in results]

def save_prediction_accuracy(prediction_data: Dict):
    """予測精度データを保存"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 精度スコアの計算
    predicted_delay = prediction_data['predicted_delay']
    actual_delay = prediction_data['actual_delay']
    accuracy_score = 1.0 - abs(predicted_delay - actual_delay) / max(actual_delay, 1)
    accuracy_score = max(0, min(1, accuracy_score))  # 0-1の範囲に正規化
    
    cursor.execute("""
        INSERT INTO ishigaki_prediction_accuracy 
        (prediction_date, actual_date, guest_name, predicted_delay, 
         actual_delay, accuracy_score, model_version, environmental_factors)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        prediction_data['prediction_date'],
        prediction_data['actual_date'],
        prediction_data['guest_name'],
        predicted_delay,
        actual_delay,
        accuracy_score,
        prediction_data.get('model_version', '1.0'),
        json.dumps(prediction_data.get('environmental_factors', {}))
    ))
    
    conn.commit()
    conn.close()

def get_hotel_info(hotel_name: str) -> Optional[Dict]:
    """ホテル情報を取得"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT * FROM ishigaki_hotels 
        WHERE hotel_name LIKE ?
    """, (f'%{hotel_name}%',))
    
    result = cursor.fetchone()
    conn.close()
    
    return dict(result) if result else None

def get_area_hotels(area: str) -> List[Dict]:
    """エリア別のホテル一覧を取得"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT * FROM ishigaki_hotels 
        WHERE area = ?
        ORDER BY hotel_name
    """, (area,))
    
    results = cursor.fetchall()
    conn.close()
    
    return [dict(row) for row in results]

def get_pickup_statistics(start_date: str, end_date: str) -> Dict:
    """ピックアップ統計を取得"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 基本統計
    cursor.execute("""
        SELECT 
            COUNT(*) as total_pickups,
            AVG(delay_minutes) as avg_delay,
            MIN(delay_minutes) as min_delay,
            MAX(delay_minutes) as max_delay,
            AVG(distance_km) as avg_distance,
            AVG(guest_satisfaction) as avg_satisfaction
        FROM pickup_records 
        WHERE tour_date BETWEEN ? AND ?
    """, (start_date, end_date))
    
    basic_stats = dict(cursor.fetchone())
    
    # エリア別統計
    cursor.execute("""
        SELECT 
            h.area,
            COUNT(*) as pickup_count,
            AVG(p.delay_minutes) as avg_delay,
            AVG(p.distance_km) as avg_distance
        FROM pickup_records p
        LEFT JOIN ishigaki_hotels h ON p.hotel_name = h.hotel_name
        WHERE p.tour_date BETWEEN ? AND ?
        GROUP BY h.area
        ORDER BY pickup_count DESC
    """, (start_date, end_date))
    
    area_stats = [dict(row) for row in cursor.fetchall()]
    
    # 時間帯別統計
    cursor.execute("""
        SELECT 
            strftime('%H', planned_time) as hour,
            COUNT(*) as pickup_count,
            AVG(delay_minutes) as avg_delay
        FROM pickup_records 
        WHERE tour_date BETWEEN ? AND ?
        GROUP BY strftime('%H', planned_time)
        ORDER BY hour
    """, (start_date, end_date))
    
    hourly_stats = [dict(row) for row in cursor.fetchall()]
    
    conn.close()
    
    return {
        'basic_statistics': basic_stats,
        'area_statistics': area_stats,
        'hourly_statistics': hourly_stats,
        'period': {'start_date': start_date, 'end_date': end_date}
    }

def get_environmental_data(date: str) -> Optional[Dict]:
    """環境データを取得"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT * FROM ishigaki_environmental_data 
        WHERE date = ?
    """, (date,))
    
    result = cursor.fetchone()
    conn.close()
    
    if result:
        data = dict(result)
        # データ構造を整形
        return {
            'date': data['date'],
            'location': '石垣島',
            'weather': {
                'condition': data['weather_condition'],
                'temperature': data['temperature'],
                'wind_speed': data['wind_speed'],
                'wind_direction': data['wind_direction'],
                'precipitation': data['precipitation'],
                'humidity': data['humidity'],
                'uv_index': data['uv_index'],
                'typhoon_risk': data['typhoon_risk']
            },
            'tide': {
                'high_times': [
                    {'time': data['tide_high_1_time'], 'level': data['tide_high_1_level']},
                    {'time': data['tide_high_2_time'], 'level': data['tide_high_2_level']}
                ],
                'low_times': [
                    {'time': data['tide_low_1_time'], 'level': data['tide_low_1_level']},
                    {'time': data['tide_low_2_time'], 'level': data['tide_low_2_level']}
                ]
            },
            'sea': {
                'wave_height': data['wave_height'],
                'water_temperature': data['water_temperature'],
                'visibility': data['visibility']
            }
        }
    
    return None

def cleanup_old_data(days_to_keep: int = 365):
    """古いデータのクリーンアップ"""
    cutoff_date = (datetime.now() - timedelta(days=days_to_keep)).strftime('%Y-%m-%d')
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 古いレコードを削除
    tables_to_cleanup = [
        'pickup_records',
        'vehicle_performance', 
        'ishigaki_traffic_patterns',
        'ishigaki_prediction_accuracy',
        'ishigaki_environmental_data'
    ]
    
    deleted_counts = {}
    
    for table in tables_to_cleanup:
        cursor.execute(f"""
            DELETE FROM {table} 
            WHERE created_at < ?
        """, (cutoff_date,))
        
        deleted_counts[table] = cursor.rowcount
    
    conn.commit()
    conn.close()
    
    print(f"🧹 データクリーンアップ完了: {deleted_counts}")
    return deleted_counts

if __name__ == "__main__":
    # データベース初期化のテスト
    init_db()
    print("✅ データベース初期化完了")