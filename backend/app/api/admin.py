"""
管理后台API接口
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_, or_
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta

from ..database import get_db
from ..core.deps import get_current_admin_user
from ..models.user import User
from ..models.game import GameRecord
from ..models.admin import AdminLog
from ..schemas.game import (
    GameAnalysisResponse,
    GameConfigRequest,
    GameConfigResponse,
    LiveGameStatus
)
from ..schemas.auth import UserResponse

router = APIRouter()


@router.get("/users", response_model=List[UserResponse])
async def get_all_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
    current_admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """获取所有用户列表"""
    query = db.query(User)
    
    if search:
        query = query.filter(
            or_(
                User.username.contains(search),
                User.email.contains(search)
            )
        )
    
    if is_active is not None:
        query = query.filter(User.is_active == is_active)
    
    users = query.offset(skip).limit(limit).all()
    
    return [
        UserResponse(
            id=user.id,
            username=user.username,
            email=user.email,
            credits=user.credits,
            is_active=user.is_active,
            is_admin=user.is_admin,
            created_at=user.created_at,
            last_login=user.last_login
        )
        for user in users
    ]


@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user_detail(
    user_id: int,
    current_admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """获取用户详细信息"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在"
        )
    
    return UserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        credits=user.credits,
        is_active=user.is_active,
        is_admin=user.is_admin,
        created_at=user.created_at,
        last_login=user.last_login
    )


@router.put("/users/{user_id}/credits")
async def update_user_credits(
    user_id: int,
    credits: int,
    reason: str,
    current_admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """更新用户金额"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在"
        )
    
    old_credits = user.credits
    user.credits = credits
    
    # 记录管理员操作日志
    admin_log = AdminLog(
        admin_id=current_admin.id,
        action="update_user_credits",
        target_type="user",
        target_id=user_id,
        details={
            "old_credits": old_credits,
            "new_credits": credits,
            "reason": reason
        }
    )
    db.add(admin_log)
    db.commit()
    
    return {
        "success": True,
        "message": f"用户 {user.username} 的积分已更新为 {credits}",
        "old_credits": old_credits,
        "new_credits": credits
    }


@router.put("/users/{user_id}/status")
async def update_user_status(
    user_id: int,
    is_active: bool,
    reason: str,
    current_admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """更新用户状态（启用/禁用）"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在"
        )
    
    old_status = user.is_active
    user.is_active = is_active
    
    # 记录管理员操作日志
    admin_log = AdminLog(
        admin_id=current_admin.id,
        action="update_user_status",
        target_type="user",
        target_id=user_id,
        details={
            "old_status": old_status,
            "new_status": is_active,
            "reason": reason
        }
    )
    db.add(admin_log)
    db.commit()
    
    status_text = "启用" if is_active else "禁用"
    return {
        "success": True,
        "message": f"用户 {user.username} 已{status_text}",
        "old_status": old_status,
        "new_status": is_active
    }


@router.get("/games/records")
async def get_game_records(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    game_type: Optional[str] = None,
    user_id: Optional[int] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    current_admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """获取游戏记录"""
    query = db.query(GameRecord).join(User)
    
    if game_type:
        query = query.filter(GameRecord.game_type == game_type)
    
    if user_id:
        query = query.filter(GameRecord.user_id == user_id)
    
    if start_date:
        query = query.filter(GameRecord.created_at >= start_date)
    
    if end_date:
        query = query.filter(GameRecord.created_at <= end_date)
    
    records = query.order_by(desc(GameRecord.created_at)).offset(skip).limit(limit).all()
    
    result = []
    for record in records:
        user = db.query(User).filter(User.id == record.user_id).first()
        result.append({
            "id": record.id,
            "user_id": record.user_id,
            "username": user.username if user else "未知用户",
            "game_type": record.game_type,
            "template_id": record.template_id,
            "bet_amount": record.game_cost,
            "win_amount": record.prize_credits,
            "net_result": record.prize_credits - record.game_cost,
            "created_at": record.created_at,
            "result_data": record.result_data
        })
    
    return {
        "records": result,
        "total": query.count()
    }


@router.get("/dashboard/overview")
async def get_dashboard_overview(
    current_admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """获取管理后台概览数据"""
    # 基本统计
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.is_active == True).count()
    total_games = db.query(GameRecord).count()
    
    # 今日统计
    today = datetime.now().date()
    today_start = datetime.combine(today, datetime.min.time())
    today_end = datetime.combine(today, datetime.max.time())
    
    today_games = db.query(GameRecord).filter(
        GameRecord.created_at >= today_start,
        GameRecord.created_at <= today_end
    ).count()
    
    today_revenue = db.query(func.sum(GameRecord.game_cost)).filter(
        GameRecord.created_at >= today_start,
        GameRecord.created_at <= today_end
    ).scalar() or 0

    today_payout = db.query(func.sum(GameRecord.prize_credits)).filter(
        GameRecord.created_at >= today_start,
        GameRecord.created_at <= today_end
    ).scalar() or 0
    
    # 本周统计
    week_start = today - timedelta(days=today.weekday())
    week_start_dt = datetime.combine(week_start, datetime.min.time())
    
    week_games = db.query(GameRecord).filter(
        GameRecord.created_at >= week_start_dt
    ).count()
    
    week_revenue = db.query(func.sum(GameRecord.game_cost)).filter(
        GameRecord.created_at >= week_start_dt
    ).scalar() or 0

    week_payout = db.query(func.sum(GameRecord.prize_credits)).filter(
        GameRecord.created_at >= week_start_dt
    ).scalar() or 0
    
    # 热门游戏
    popular_games = db.query(
        GameRecord.game_type,
        GameRecord.template_id,
        func.count(GameRecord.id).label('play_count'),
        func.sum(GameRecord.game_cost).label('revenue')
    ).filter(
        GameRecord.created_at >= week_start_dt
    ).group_by(GameRecord.game_type, GameRecord.template_id)\
     .order_by(desc('play_count')).limit(5).all()
    
    # 最近大奖
    recent_big_wins = db.query(GameRecord).join(User).filter(
        GameRecord.prize_credits >= 1000
    ).order_by(desc(GameRecord.created_at)).limit(10).all()
    
    big_wins_data = []
    for record in recent_big_wins:
        user = db.query(User).filter(User.id == record.user_id).first()
        big_wins_data.append({
            "username": user.username if user else "未知用户",
            "game_type": record.game_type,
            "template_id": record.template_id,
            "win_amount": record.prize_credits,
            "created_at": record.created_at
        })
    
    return {
        "basic_stats": {
            "total_users": total_users,
            "active_users": active_users,
            "total_games": total_games
        },
        "today_stats": {
            "games": today_games,
            "revenue": today_revenue,
            "payout": today_payout,
            "profit": today_revenue - today_payout
        },
        "week_stats": {
            "games": week_games,
            "revenue": week_revenue,
            "payout": week_payout,
            "profit": week_revenue - week_payout
        },
        "popular_games": [
            {
                "game": f"{game_type}:{template_id}",
                "play_count": play_count,
                "revenue": revenue
            }
            for game_type, template_id, play_count, revenue in popular_games
        ],
        "recent_big_wins": big_wins_data
    }


@router.get("/logs")
async def get_admin_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    action: Optional[str] = None,
    admin_id: Optional[int] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    current_admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """获取管理员操作日志"""
    query = db.query(AdminLog).join(User, AdminLog.admin_id == User.id)
    
    if action:
        query = query.filter(AdminLog.action == action)
    
    if admin_id:
        query = query.filter(AdminLog.admin_id == admin_id)
    
    if start_date:
        query = query.filter(AdminLog.created_at >= start_date)
    
    if end_date:
        query = query.filter(AdminLog.created_at <= end_date)
    
    logs = query.order_by(desc(AdminLog.created_at)).offset(skip).limit(limit).all()
    
    result = []
    for log in logs:
        admin_user = db.query(User).filter(User.id == log.admin_id).first()
        result.append({
            "id": log.id,
            "admin_id": log.admin_id,
            "admin_username": admin_user.username if admin_user else "未知管理员",
            "action": log.action,
            "target_type": log.target_type,
            "target_id": log.target_id,
            "details": log.details,
            "created_at": log.created_at
        })
    
    return {
        "logs": result,
        "total": query.count()
    }
