"""
管理后台相关模型
"""
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, JSON
from sqlalchemy.sql import func
from ..database import Base


class AdminLog(Base):
    """管理员操作日志表"""
    __tablename__ = "admin_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    admin_user_id = Column(Integer, nullable=False)  # 管理员用户ID
    admin_username = Column(String(50), nullable=False)  # 管理员用户名
    
    # 操作信息
    action_type = Column(String(50), nullable=False)  # 操作类型
    action_description = Column(Text, nullable=False)  # 操作描述
    target_type = Column(String(50), nullable=True)  # 操作目标类型
    target_id = Column(Integer, nullable=True)  # 操作目标ID
    
    # 操作详情
    old_data = Column(JSON, nullable=True)  # 操作前数据
    new_data = Column(JSON, nullable=True)  # 操作后数据
    
    # 请求信息
    ip_address = Column(String(45), nullable=True)  # IP地址
    user_agent = Column(Text, nullable=True)  # 用户代理
    
    # 时间戳
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    def __repr__(self):
        return f"<AdminLog(id={self.id}, admin_username='{self.admin_username}', action_type='{self.action_type}')>"


class SystemStats(Base):
    """系统统计表"""
    __tablename__ = "system_stats"
    
    id = Column(Integer, primary_key=True, index=True)
    stat_date = Column(String(10), unique=True, nullable=False)  # 统计日期 YYYY-MM-DD
    
    # 用户统计
    total_users = Column(Integer, default=0)  # 总用户数
    new_users = Column(Integer, default=0)  # 新增用户数
    active_users = Column(Integer, default=0)  # 活跃用户数
    
    # 游戏统计
    total_games = Column(Integer, default=0)  # 总游戏次数
    scratch_card_games = Column(Integer, default=0)  # 刮刮乐游戏次数
    slot_machine_games = Column(Integer, default=0)  # 老虎机游戏次数
    lucky_wheel_games = Column(Integer, default=0)  # 幸运大转盘游戏次数
    
    # 积分统计
    total_credits_consumed = Column(Integer, default=0)  # 总消耗积分
    total_credits_awarded = Column(Integer, default=0)  # 总奖励积分
    
    # 奖品统计
    total_prizes_awarded = Column(Integer, default=0)  # 总发放奖品数
    total_winners = Column(Integer, default=0)  # 总中奖人数
    
    # 时间戳
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def __repr__(self):
        return f"<SystemStats(id={self.id}, stat_date='{self.stat_date}', total_games={self.total_games})>"
