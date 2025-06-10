# ===========================================
# backend/setup.py - バックエンド初期設定
# ===========================================

import subprocess
import sys
import os
from pathlib import Path

def install_requirements():
    """必要なパッケージをインストール"""
    print("📦 必要なパッケージをインストールしています...")
    try:
        subprocess.check_call([
            sys.executable, "-m", "pip", "install", "-r", "requirements.txt"
        ])
        print("✅ パッケージのインストールが完了しました")
    except subprocess.CalledProcessError as e:
        print(f"❌ パッケージのインストールに失敗しました: {e}")
        return False
    return True

def setup_database():
    """データベースの初期化"""
    print("🗄️ データベースを初期化しています...")
    try:
        from database import init_db
        init_db()
        print("✅ データベースの初期化が完了しました")
    except Exception as e:
        print(f"❌ データベースの初期化に失敗しました: {e}")
        return False
    return True

def create_env_file():
    """環境設定ファイルを作成"""
    env_file = Path(".env")
    if not env_file.exists():
        print("📝 環境設定ファイルを作成しています...")
        with open(env_file, "w", encoding="utf-8") as f:
            f.write("""# 石垣島ツアー送迎API 環境設定
API_VERSION=2.0.0
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
""")
        print("✅ 環境設定ファイルを作成しました")

if __name__ == "__main__":
    print("🏝️ 石垣島ツアー送迎API - セットアップ開始")
    
    # 環境設定ファイル作成
    create_env_file()
    
    # パッケージインストール
    if not install_requirements():
        sys.exit(1)
    
    # データベース初期化
    if not setup_database():
        sys.exit(1)
    
    print("🎉 セットアップが完了しました！")
    print("次のコマンドでサーバーを起動してください:")
    print("  python start.py")