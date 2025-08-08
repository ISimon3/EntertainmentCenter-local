"""
应用配置文件
"""
from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    """应用设置"""
    
    # 应用基本信息
    app_name: str = "娱乐中心系统"
    app_version: str = "1.0.0"
    debug: bool = True
    
    # 服务器配置
    host: str = "127.0.0.1"
    port: int = 8000
    
    # 数据库配置 - 使用项目根目录的database文件夹
    database_url: str = "sqlite:///./database/entertainment.db"
    
    # JWT 认证配置
    secret_key: str = "your-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # 游戏配置
    default_user_credits: int = 1000  # 新用户默认金额

    # 刮刮乐配置
    scratch_card_cost: int = 10  # 每次游戏消耗金额
    scratch_card_prizes: dict = {
        "一等奖": {"probability": 0.01, "credits": 1000},
        "二等奖": {"probability": 0.05, "credits": 500},
        "三等奖": {"probability": 0.1, "credits": 100},
        "四等奖": {"probability": 0.2, "credits": 50},
        "谢谢参与": {"probability": 0.64, "credits": 0}
    }
    
    # 老虎机配置
    slot_machine_cost: int = 20  # 每次游戏消耗金额
    slot_machine_symbols: list = ["🍎", "🍊", "🍋", "🍇", "🍒", "⭐", "💎"]
    slot_machine_jackpot: int = 5000  # 大奖金额

    # 幸运大转盘配置
    lucky_wheel_cost: int = 15  # 每次游戏消耗金额
    lucky_wheel_prizes: dict = {
        "特等奖": {"probability": 0.02, "credits": 2000},
        "一等奖": {"probability": 0.08, "credits": 800},
        "二等奖": {"probability": 0.15, "credits": 300},
        "三等奖": {"probability": 0.25, "credits": 100},
        "安慰奖": {"probability": 0.5, "credits": 20}
    }
    
    class Config:
        env_file = ".env"


# 创建全局设置实例
settings = Settings()
