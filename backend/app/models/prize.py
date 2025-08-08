"""
奖品模型
"""
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, Float
from sqlalchemy.sql import func
from ..database import Base


class Prize(Base):
    """奖品表"""
    __tablename__ = "prizes"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)  # 奖品名称
    game_type = Column(String(50), nullable=False)  # 适用的游戏类型
    
    # 奖品信息
    credits_value = Column(Integer, default=0)  # 奖品金额价值
    probability = Column(Float, nullable=False)  # 中奖概率 (0.0-1.0)
    
    # 奖品状态
    is_active = Column(Boolean, default=True)  # 是否启用
    stock_quantity = Column(Integer, default=-1)  # 库存数量 (-1表示无限)
    used_quantity = Column(Integer, default=0)  # 已使用数量
    
    # 显示信息
    description = Column(Text, nullable=True)  # 奖品描述
    image_url = Column(String(255), nullable=True)  # 奖品图片
    display_order = Column(Integer, default=0)  # 显示顺序
    
    # 时间戳
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    @property
    def is_available(self):
        """检查奖品是否可用"""
        if not self.is_active:
            return False
        if self.stock_quantity == -1:  # 无限库存
            return True
        return self.used_quantity < self.stock_quantity
    
    def __repr__(self):
        return f"<Prize(id={self.id}, name='{self.name}', game_type='{self.game_type}', probability={self.probability})>"


class PrizeHistory(Base):
    """奖品发放历史表"""
    __tablename__ = "prize_histories"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)  # 获奖用户ID
    prize_id = Column(Integer, nullable=False)  # 奖品ID
    game_record_id = Column(Integer, nullable=False)  # 关联的游戏记录ID
    
    # 奖品信息快照
    prize_name = Column(String(100), nullable=False)
    prize_credits = Column(Integer, default=0)
    game_type = Column(String(50), nullable=False)
    
    # 发放状态
    is_claimed = Column(Boolean, default=True)  # 是否已领取
    claimed_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # 时间戳
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    def __repr__(self):
        return f"<PrizeHistory(id={self.id}, user_id={self.user_id}, prize_name='{self.prize_name}')>"
