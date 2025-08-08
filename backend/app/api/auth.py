"""
认证相关API路由
"""
from datetime import datetime, timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from ..core.deps import get_db, get_current_active_user, get_current_user
from ..core.security import verify_password, get_password_hash, create_access_token
from ..models.user import User
from ..schemas.auth import (
    UserCreate, UserResponse, UserLogin, Token, PasswordChange, UserUpdate, UserStats
)
from ..config import settings

router = APIRouter()


@router.post("/register", response_model=UserResponse, summary="用户注册")
def register(
    user_data: UserCreate,
    db: Session = Depends(get_db)
) -> Any:
    """
    用户注册
    """
    # 检查用户名是否已存在
    if db.query(User).filter(User.username == user_data.username).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="用户名已存在"
        )
    
    # 检查邮箱是否已存在
    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="邮箱已被注册"
        )
    
    # 创建新用户
    user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=get_password_hash(user_data.password),
        full_name=user_data.full_name,
        credits=settings.default_user_credits
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return user


@router.post("/login", response_model=Token, summary="用户登录")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
) -> Any:
    """
    用户登录
    """
    # 查找用户（支持用户名或邮箱登录）
    user = db.query(User).filter(
        (User.username == form_data.username) | (User.email == form_data.username)
    ).first()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="用户账户已被禁用"
        )
    
    # 更新最后登录时间
    user.last_login = datetime.utcnow()
    db.commit()
    
    # 创建访问令牌
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": settings.access_token_expire_minutes * 60,
        "user": user
    }


@router.post("/login-json", response_model=Token, summary="JSON格式登录")
def login_json(
    login_data: UserLogin,
    db: Session = Depends(get_db)
) -> Any:
    """
    JSON格式用户登录
    """
    # 查找用户（支持用户名或邮箱登录）
    user = db.query(User).filter(
        (User.username == login_data.username) | (User.email == login_data.username)
    ).first()
    
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="用户账户已被禁用"
        )
    
    # 更新最后登录时间
    user.last_login = datetime.utcnow()
    db.commit()
    
    # 创建访问令牌
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": settings.access_token_expire_minutes * 60,
        "user": user
    }


@router.get("/me", response_model=UserResponse, summary="获取当前用户信息")
def get_current_user_info(
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    获取当前用户信息
    """
    return current_user


@router.put("/me", response_model=UserResponse, summary="更新当前用户信息")
def update_current_user(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    更新当前用户信息
    """
    if user_update.full_name is not None:
        current_user.full_name = user_update.full_name
    if user_update.avatar_url is not None:
        current_user.avatar_url = user_update.avatar_url
    if user_update.bio is not None:
        current_user.bio = user_update.bio
    
    db.commit()
    db.refresh(current_user)
    
    return current_user


@router.post("/change-password", summary="修改密码")
def change_password(
    password_data: PasswordChange,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    修改密码
    """
    # 验证旧密码
    if not verify_password(password_data.old_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="旧密码错误"
        )
    
    # 更新密码
    current_user.hashed_password = get_password_hash(password_data.new_password)
    db.commit()
    
    return {"message": "密码修改成功"}


@router.get("/stats", response_model=UserStats, summary="获取用户游戏统计")
def get_user_stats(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    获取用户游戏统计信息
    """
    from ..models.game import GameRecord
    from sqlalchemy import func
    
    # 查询用户游戏记录统计
    total_games = db.query(GameRecord).filter(GameRecord.user_id == current_user.id).count()
    games_won = db.query(GameRecord).filter(
        GameRecord.user_id == current_user.id,
        GameRecord.is_winner == True
    ).count()
    
    win_rate = (games_won / total_games * 100) if total_games > 0 else 0
    
    # 金额统计
    total_spent = db.query(func.sum(GameRecord.game_cost)).filter(
        GameRecord.user_id == current_user.id
    ).scalar() or 0

    total_won = db.query(func.sum(GameRecord.prize_credits)).filter(
        GameRecord.user_id == current_user.id
    ).scalar() or 0
    
    # 最喜欢的游戏
    favorite_game_result = db.query(
        GameRecord.game_type,
        func.count(GameRecord.id).label('count')
    ).filter(
        GameRecord.user_id == current_user.id
    ).group_by(GameRecord.game_type).order_by(func.count(GameRecord.id).desc()).first()
    
    favorite_game = favorite_game_result.game_type if favorite_game_result else None
    
    return UserStats(
        total_games=total_games,
        games_won=games_won,
        win_rate=round(win_rate, 2),
        total_credits_spent=total_spent,
        total_credits_won=total_won,
        net_credits=total_won - total_spent,
        favorite_game=favorite_game
    )
