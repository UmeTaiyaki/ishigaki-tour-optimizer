# ===========================================
# backend/start.py - バックエンド起動スクリプト
# ===========================================

import uvicorn
import os
import sys
from pathlib import Path

# 現在のディレクトリをPythonパスに追加
current_dir = Path(__file__).parent
sys.path.insert(0, str(current_dir))

# 環境変数の設定
os.environ.setdefault("PYTHONPATH", str(current_dir))

if __name__ == "__main__":
    print("🏝️ 石垣島ツアー送迎API v2.0 を起動しています...")
    print("📍 ポート: 8000")
    print("📍 URL: http://localhost:8000")
    print("📍 API文書: http://localhost:8000/docs")
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
