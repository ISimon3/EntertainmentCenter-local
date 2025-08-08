"""
重置数据库脚本
"""
import os
import sys
from pathlib import Path

# 添加项目根目录到Python路径
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from app.database import engine, Base
# 确保所有模型都被导入
from app.models.user import User
from app.models.game import GameRecord, GameConfig
from app.models.prize import Prize
from app.models.admin import AdminLog
from app.utils.init_db import init_database

def reset_database():
    """重置数据库"""
    try:
        print("正在删除所有表...")
        Base.metadata.drop_all(bind=engine)
        print("表删除成功")
        
        print("正在创建新表...")
        Base.metadata.create_all(bind=engine)
        print("表创建成功")
        
        print("正在初始化数据...")
        init_database()
        print("数据初始化成功")
        
        print("数据库重置完成！")
        return True
        
    except Exception as e:
        print(f"数据库重置失败: {e}")
        return False

if __name__ == "__main__":
    success = reset_database()
    if success:
        print("\n✅ 数据库重置成功！现在可以启动应用了。")
    else:
        print("\n❌ 数据库重置失败！请检查错误信息。")
    
    input("按回车键退出...")
