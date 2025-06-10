#!/usr/bin/env python3
"""
石垣島ツアー管理システム - 統合サーバー起動スクリプト v2.0 SQLite3対応版
"""

import asyncio
import subprocess
import sys
import os
import json
import platform
import shutil
from pathlib import Path
from typing import Optional, Dict, List
import signal
import atexit

# バージョン情報
VERSION = "2.0.0"
SYSTEM_NAME = "石垣島ツアー管理システム"

def print_banner():
    """起動バナー表示"""
    banner = f"""
╔══════════════════════════════════════════════════════════════╗
║  🏝️  {SYSTEM_NAME} v{VERSION}                    ║
║                                                              ║
║  AI搭載の効率的なツアー送迎・ルート最適化システム              ║
║  Powered by FastAPI + React + SQLite                        ║
╚══════════════════════════════════════════════════════════════╝
"""
    print(banner)

def check_system_requirements():
    """システム要件チェック"""
    print("🔍 システム要件をチェックしています...")
    
    # Python バージョンチェック
    python_version = sys.version_info
    if python_version < (3, 8):
        print(f"❌ Python 3.8以上が必要です (現在: {python_version.major}.{python_version.minor})")
        return False
    print(f"✅ Python {python_version.major}.{python_version.minor}.{python_version.micro}")
    
    # OS情報表示
    print(f"✅ OS: {platform.system()} {platform.release()}")
    
    # SQLite3チェック
    sqlite_status = check_sqlite3()
    if not sqlite_status:
        print("⚠️ SQLite3に問題がありますが、代替手段で続行します")
    
    # 必要なディレクトリ存在確認
    required_dirs = ['static', 'templates', 'logs']
    for dir_name in required_dirs:
        dir_path = Path(dir_name)
        if not dir_path.exists():
            dir_path.mkdir(parents=True, exist_ok=True)
            print(f"📁 ディレクトリを作成: {dir_name}")
    
    return True

def check_sqlite3():
    """SQLite3の動作確認"""
    try:
        import sqlite3
        # テスト用データベース作成
        test_db = ":memory:"
        conn = sqlite3.connect(test_db)
        cursor = conn.cursor()
        cursor.execute("CREATE TABLE test (id INTEGER)")
        cursor.execute("INSERT INTO test (id) VALUES (1)")
        cursor.execute("SELECT * FROM test")
        result = cursor.fetchone()
        conn.close()
        
        if result:
            print("✅ SQLite3 動作確認完了")
            return True
        else:
            print("⚠️ SQLite3テストに失敗")
            return False
            
    except Exception as e:
        print(f"⚠️ SQLite3エラー: {e}")
        return False

def install_requirements_windows_safe() -> bool:
    """Windows対応の安全な依存関係インストール"""
    print("📦 依存関係をインストールしています（Windows対応版）...")
    
    # 基本パッケージを段階的にインストール
    basic_packages = [
        "fastapi==0.104.1",
        "pydantic==2.5.0", 
        "python-dotenv==1.0.0",
        "python-multipart==0.0.6",
        "aiofiles==23.2.1"
    ]
    
    optional_packages = [
        "uvicorn[standard]==0.24.0",
        "pandas==2.1.3",
        "numpy==1.26.2",
        "httpx==0.25.2",
        "requests==2.31.0"
    ]
    
    # 基本パッケージのインストール
    print("Step 1: 基本パッケージをインストール...")
    for package in basic_packages:
        if install_single_package(package):
            print(f"✅ {package}")
        else:
            print(f"⚠️ {package} のインストールに失敗")
    
    # オプションパッケージのインストール
    print("Step 2: オプションパッケージをインストール...")
    for package in optional_packages:
        if install_single_package(package):
            print(f"✅ {package}")
        else:
            print(f"⚠️ {package} のインストールに失敗（続行）")
    
    return True

def install_single_package(package: str, retries: int = 2) -> bool:
    """単一パッケージのインストール（リトライ付き）"""
    for attempt in range(retries):
        try:
            result = subprocess.run([
                sys.executable, "-m", "pip", "install", 
                package, "--no-cache-dir"
            ], check=True, capture_output=True, text=True, timeout=120)
            return True
        except subprocess.CalledProcessError as e:
            if attempt < retries - 1:
                print(f"  リトライ {attempt + 1}/{retries}: {package}")
                continue
            else:
                print(f"  最終的に失敗: {package} - {e.stderr[:100] if e.stderr else ''}")
                return False
        except subprocess.TimeoutExpired:
            if attempt < retries - 1:
                print(f"  タイムアウト、リトライ {attempt + 1}/{retries}: {package}")
                continue
            else:
                print(f"  タイムアウトで失敗: {package}")
                return False
    return False

def create_env_file():
    """環境設定ファイルを作成"""
    env_file = Path(".env")
    if env_file.exists():
        print("📝 .env ファイルは既に存在します")
        return
    
    print("📝 環境設定ファイルを作成しています...")
    env_content = f"""# {SYSTEM_NAME} v{VERSION} 環境設定
API_VERSION={VERSION}
ENVIRONMENT=development
DEBUG=True

# データベース設定
DATABASE_URL=sqlite:///tour_data.db

# API設定
API_HOST=0.0.0.0
API_PORT=8000

# CORS設定
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# ログレベル
LOG_LEVEL=INFO

# 石垣島固有設定
LOCATION=石垣島
TIMEZONE=Asia/Tokyo
DEFAULT_COORDS_LAT=24.3336
DEFAULT_COORDS_LNG=124.1543

# Google Maps API（フロントエンド用）
REACT_APP_GOOGLE_MAPS_API_KEY=AIzaSyAbBU446Ui31SlBiuJpUKFx_BpQvRLLb5M
REACT_APP_API_URL=http://localhost:8000

# セキュリティ設定
SECRET_KEY=ishigaki_tour_management_secret_key_2024
ALGORITHM=HS256

# パフォーマンス設定
MAX_WORKERS=4
REQUEST_TIMEOUT=30
"""
    
    try:
        with open(env_file, "w", encoding="utf-8") as f:
            f.write(env_content)
        print("✅ 環境設定ファイルを作成しました")
    except Exception as e:
        print(f"❌ 環境設定ファイルの作成に失敗: {e}")

def init_database_safe() -> bool:
    """安全なデータベース初期化"""
    print("🗄️ データベースを初期化しています...")
    try:
        import sqlite3
        
        db_path = "tour_data.db"
        
        # データベース接続テスト
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # テーブル存在確認
        cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='pickup_records'
        """)
        
        if not cursor.fetchone():
            print("📋 新しいデータベーステーブルを作成中...")
            
            # 基本テーブル作成
            cursor.execute("""
                CREATE TABLE pickup_records (
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
            
            # 石垣島ホテルテーブル
            cursor.execute("""
                CREATE TABLE ishigaki_hotels (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    hotel_name TEXT UNIQUE NOT NULL,
                    area TEXT NOT NULL,
                    lat REAL NOT NULL,
                    lng REAL NOT NULL,
                    pickup_difficulty TEXT DEFAULT 'normal',
                    notes TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # サンプルデータ挿入
            sample_hotels = [
                ('ANAインターコンチネンタル石垣リゾート', '真栄里', 24.3362, 124.1641, 'easy'),
                ('フサキビーチリゾート', 'フサキ', 24.3264, 124.1275, 'normal'),
                ('石垣港離島ターミナル周辺ホテル', '市街地', 24.3336, 124.1543, 'easy'),
                ('川平湾周辺民宿', '川平', 24.4567, 124.0123, 'difficult'),
            ]
            
            cursor.executemany("""
                INSERT OR IGNORE INTO ishigaki_hotels 
                (hotel_name, area, lat, lng, pickup_difficulty) 
                VALUES (?, ?, ?, ?, ?)
            """, sample_hotels)
            
            conn.commit()
            print("✅ データベーステーブルを作成しました")
        else:
            print("✅ データベースは既に初期化済みです")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ データベース初期化に失敗: {e}")
        print("📝 ファイルベースのデータ保存を使用します")
        return create_fallback_storage()

def create_fallback_storage() -> bool:
    """SQLiteが使えない場合の代替ストレージ作成"""
    try:
        fallback_dir = Path("data")
        fallback_dir.mkdir(exist_ok=True)
        
        # JSONファイルでデータ保存の準備
        fallback_data = {
            "pickup_records": [],
            "hotels": [
                {"name": "ANAインターコンチネンタル石垣リゾート", "area": "真栄里", "lat": 24.3362, "lng": 124.1641},
                {"name": "フサキビーチリゾート", "area": "フサキ", "lat": 24.3264, "lng": 124.1275},
                {"name": "石垣港離島ターミナル周辺ホテル", "area": "市街地", "lat": 24.3336, "lng": 124.1543}
            ]
        }
        
        with open(fallback_dir / "tour_data.json", "w", encoding="utf-8") as f:
            json.dump(fallback_data, f, ensure_ascii=False, indent=2)
        
        print("✅ 代替データストレージを作成しました")
        return True
        
    except Exception as e:
        print(f"❌ 代替ストレージの作成に失敗: {e}")
        return False

def check_port_available(port: int = 8000) -> bool:
    """ポートの使用状況確認"""
    import socket
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(1)
            result = s.connect_ex(('localhost', port))
            return result != 0
    except Exception:
        return True

async def start_server():
    """FastAPIサーバー起動"""
    print("🚀 APIサーバーを起動しています...")
    
    # ポート確認
    if not check_port_available(8000):
        print("⚠️ ポート8000は既に使用されています")
        print("既存のプロセスを終了するか、別のポートを使用してください")
        return False
    
    try:
        # メインのPythonパスに現在のディレクトリを追加
        current_dir = Path(__file__).parent
        if str(current_dir) not in sys.path:
            sys.path.insert(0, str(current_dir))
        
        # uvicornのインポートと起動
        try:
            import uvicorn
        except ImportError:
            print("❌ uvicorn がインストールされていません")
            print("次のコマンドでインストールしてください:")
            print("pip install uvicorn[standard]")
            return False
        
        print("🌐 サーバー情報:")
        print(f"   📍 URL: http://localhost:8000")
        print(f"   📍 API文書: http://localhost:8000/docs")
        print(f"   📍 ReDoc: http://localhost:8000/redoc")
        print(f"   📍 停止: Ctrl+C")
        print("=" * 60)
        
        # uvicornでサーバー起動
        config = uvicorn.Config(
            "main:app",
            host="0.0.0.0",
            port=8000,
            reload=True,
            log_level="info",
            access_log=True
        )
        
        server = uvicorn.Server(config)
        await server.serve()
        
    except Exception as e:
        print(f"❌ サーバー起動に失敗: {e}")
        return False

def setup_project():
    """プロジェクトの完全セットアップ"""
    print_banner()
    print(f"🔧 {SYSTEM_NAME} v{VERSION} - セットアップ開始")
    print("=" * 60)
    
    # システム要件チェック
    if not check_system_requirements():
        return False
    
    # 環境設定ファイル作成
    create_env_file()
    
    # 依存関係インストール（Windows対応）
    if not install_requirements_windows_safe():
        print("⚠️ 一部の依存関係のインストールに失敗しましたが続行します")
    
    # データベース初期化（安全版）
    if not init_database_safe():
        print("⚠️ データベース初期化に問題がありましたが続行します")
    
    print("🎉 セットアップが完了しました！")
    print("=" * 60)
    return True

async def main():
    """メイン実行関数"""
    # コマンドライン引数チェック
    if len(sys.argv) > 1:
        command = sys.argv[1].lower()
        
        if command == "setup":
            setup_project()
            return
        elif command == "install":
            install_requirements_windows_safe()
            return
        elif command == "init-db":
            init_database_safe()
            return
        elif command == "check":
            check_system_requirements()
            check_sqlite3()
            return
    
    # 通常起動（セットアップ→サーバー起動）
    if setup_project():
        print("🚀 サーバーを起動します...")
        await asyncio.sleep(1)
        await start_server()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n👋 サーバーを停止しました")
        print("お疲れ様でした！")
    except Exception as e:
        print(f"❌ 予期しないエラーが発生しました: {e}")
        print("\n🔧 トラブルシューティング:")
        print("1. python -m pip install --upgrade pip")
        print("2. python server.py check")
        print("3. python server.py install")
        sys.exit(1)