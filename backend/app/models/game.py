"""
游戏记录模型
"""
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..database import Base


class GameRecord(Base):
    """游戏记录表"""
    __tablename__ = "game_records"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # 游戏信息
    game_type = Column(String(50), nullable=False)  # scratch_card, slot_machine, lucky_wheel
    template_id = Column(String(50), nullable=False)  # 游戏模板ID
    game_cost = Column(Integer, nullable=False)  # 游戏消耗的积分
    game_result = Column(JSON, nullable=False)  # 游戏结果详情（JSON格式）
    
    # 奖励信息
    prize_name = Column(String(100), nullable=True)  # 奖品名称
    prize_credits = Column(Integer, default=0)  # 获得的积分
    is_winner = Column(Boolean, default=False)  # 是否中奖
    
    # 用户余额变化
    credits_before = Column(Integer, nullable=False)  # 游戏前积分
    credits_after = Column(Integer, nullable=False)  # 游戏后积分
    
    # 时间戳
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # 关联关系
    user = relationship("User", backref="game_records")
    
    def __repr__(self):
        return f"<GameRecord(id={self.id}, user_id={self.user_id}, game_type='{self.game_type}', is_winner={self.is_winner})>"


class GameConfig(Base):
    """游戏配置表"""
    __tablename__ = "game_configs"
    
    id = Column(Integer, primary_key=True, index=True)
    game_type = Column(String(50), unique=True, nullable=False)
    
    # 游戏配置（JSON格式存储）
    config_data = Column(JSON, nullable=False)
    
    # 状态
    is_active = Column(Boolean, default=True)
    
    # 时间戳
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # 备注
    description = Column(Text, nullable=True)
    
    def __repr__(self):
        return f"<GameConfig(id={self.id}, game_type='{self.game_type}', is_active={self.is_active})>"
