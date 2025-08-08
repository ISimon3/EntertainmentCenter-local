"""
认证相关的Pydantic模式
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


class UserBase(BaseModel):
    """用户基础模式"""
    username: str = Field(..., min_length=3, max_length=50, description="用户名")
    email: EmailStr = Field(..., description="邮箱地址")
    full_name: Optional[str] = Field(None, max_length=100, description="全名")


class UserCreate(UserBase):
    """用户创建模式"""
    password: str = Field(..., min_length=6, max_length=100, description="密码")


class UserUpdate(BaseModel):
    """用户更新模式"""
    full_name: Optional[str] = Field(None, max_length=100, description="全名")
    avatar_url: Optional[str] = Field(None, max_length=255, description="头像URL")
    bio: Optional[str] = Field(None, max_length=500, description="个人简介")


class UserResponse(UserBase):
    """用户响应模式"""
    id: int
    is_active: bool
    is_admin: bool
    credits: int
    total_games_played: int
    total_winnings: int
    created_at: datetime
    last_login: Optional[datetime]
    avatar_url: Optional[str]
    bio: Optional[str]
    
    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    """用户登录模式"""
    username: str = Field(..., description="用户名或邮箱")
    password: str = Field(..., description="密码")


class Token(BaseModel):
    """令牌模式"""
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse


class TokenData(BaseModel):
    """令牌数据模式"""
    username: Optional[str] = None


class PasswordChange(BaseModel):
    """密码修改模式"""
    old_password: str = Field(..., description="旧密码")
    new_password: str = Field(..., min_length=6, max_length=100, description="新密码")


class PasswordReset(BaseModel):
    """密码重置模式"""
    email: EmailStr = Field(..., description="邮箱地址")


class UserStats(BaseModel):
    """用户统计模式"""
    total_games: int
    games_won: int
    win_rate: float
    total_credits_spent: int
    total_credits_won: int
    net_credits: int
    favorite_game: Optional[str]
    
    class Config:
        from_attributes = True
