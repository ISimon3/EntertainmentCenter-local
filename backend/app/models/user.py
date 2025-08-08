"""
用户模型
"""
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text
from sqlalchemy.sql import func
from ..database import Base


class User(Base):
    """用户表"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=True)
    
    # 用户状态
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    
    # 游戏相关
    credits = Column(Integer, default=1000)  # 用户金额
    total_games_played = Column(Integer, default=0)  # 总游戏次数
    total_winnings = Column(Integer, default=0)  # 总赢得金额
    
    # 时间戳
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_login = Column(DateTime(timezone=True), nullable=True)
    
    # 用户偏好设置
    avatar_url = Column(String(255), nullable=True)
    bio = Column(Text, nullable=True)
    
    def __repr__(self):
        return f"<User(id={self.id}, username='{self.username}', credits={self.credits})>"
