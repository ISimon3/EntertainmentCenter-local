"""
数据统计相关API接口
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta

from ..database import get_db
from ..core.deps import get_current_user
from ..models.user import User
from ..models.game import GameRecord
from ..schemas.game import (
    GameStatsResponse,
    UserGameStatsResponse,
    LeaderboardEntry,
    LeaderboardResponse,
    GameAnalysisRequest,
    GameAnalysisResponse,
    LiveGameStatus,
    GameEvent,
    GameEventsResponse
)

router = APIRouter()


@router.get("/user/stats", response_model=UserGameStatsResponse)
async def get_user_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取用户游戏统计"""
    # 获取用户所有游戏记录
    records = db.query(GameRecord).filter(GameRecord.user_id == current_user.id).all()

    if not records:
        return UserGameStatsResponse(
            user_id=current_user.id,
            username=current_user.username,
            overall_stats=GameStatsResponse(
                total_games=0,
                total_bet=0,
                total_win=0,
                net_result=0,
                win_rate=0.0,
                favorite_game=None
            ),
            game_type_stats={}
        )

    # 计算总体统计
    total_games = len(records)
    total_bet = sum(record.game_cost for record in records)
    total_win = sum(record.prize_credits for record in records)
    net_result = total_win - total_bet
    winning_games = len([r for r in records if r.prize_credits > r.game_cost])
    win_rate = winning_games / total_games if total_games > 0 else 0.0
    
    # 找出最喜欢的游戏
    game_counts = {}
    for record in records:
        game_counts[record.game_type] = game_counts.get(record.game_type, 0) + 1
    favorite_game = max(game_counts, key=game_counts.get) if game_counts else None
    
    overall_stats = GameStatsResponse(
        total_games=total_games,
        total_bet=total_bet,
        total_win=total_win,
        net_result=net_result,
        win_rate=win_rate,
        favorite_game=favorite_game
    )
    
    # 按游戏类型分组统计
    game_type_stats = {}
    for game_type in set(record.game_type for record in records):
        type_records = [r for r in records if r.game_type == game_type]
        type_total_games = len(type_records)
        type_total_bet = sum(r.game_cost for r in type_records)
        type_total_win = sum(r.prize_credits for r in type_records)
        type_net_result = type_total_win - type_total_bet
        type_winning_games = len([r for r in type_records if r.prize_credits > r.game_cost])
        type_win_rate = type_winning_games / type_total_games if type_total_games > 0 else 0.0
        
        game_type_stats[game_type] = GameStatsResponse(
            total_games=type_total_games,
            total_bet=type_total_bet,
            total_win=type_total_win,
            net_result=type_net_result,
            win_rate=type_win_rate,
            favorite_game=game_type
        )
    
    return UserGameStatsResponse(
        user_id=current_user.id,
        username=current_user.username,
        overall_stats=overall_stats,
        game_type_stats=game_type_stats
    )


@router.get("/leaderboard/credits", response_model=LeaderboardResponse)
async def get_credits_leaderboard(
    limit: int = Query(10, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取金额排行榜"""
    # 获取排行榜数据
    top_users = db.query(User).order_by(desc(User.credits)).limit(limit).all()
    
    entries = []
    for rank, user in enumerate(top_users, 1):
        # 获取用户游戏次数
        game_count = db.query(GameRecord).filter(GameRecord.user_id == user.id).count()
        
        entries.append(LeaderboardEntry(
            rank=rank,
            user_id=user.id,
            username=user.username,
            value=user.credits,
            game_count=game_count
        ))
    
    # 获取当前用户排名
    user_rank = None
    user_value = current_user.credits
    
    higher_users = db.query(User).filter(User.credits > current_user.credits).count()
    user_rank = higher_users + 1
    
    return LeaderboardResponse(
        leaderboard_type="credits",
        entries=entries,
        user_rank=user_rank,
        user_value=user_value
    )


@router.get("/leaderboard/total-win", response_model=LeaderboardResponse)
async def get_total_win_leaderboard(
    limit: int = Query(10, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取总赢取排行榜"""
    # 计算每个用户的总赢取
    user_wins = db.query(
        GameRecord.user_id,
        User.username,
        func.sum(GameRecord.prize_credits).label('total_win'),
        func.count(GameRecord.id).label('game_count')
    ).join(User).group_by(GameRecord.user_id, User.username)\
     .order_by(desc('total_win')).limit(limit).all()
    
    entries = []
    for rank, (user_id, username, total_win, game_count) in enumerate(user_wins, 1):
        entries.append(LeaderboardEntry(
            rank=rank,
            user_id=user_id,
            username=username,
            value=total_win or 0,
            game_count=game_count or 0
        ))
    
    # 获取当前用户的总赢取和排名
    current_user_win = db.query(func.sum(GameRecord.prize_credits))\
                        .filter(GameRecord.user_id == current_user.id).scalar() or 0
    
    higher_users = db.query(func.count(func.distinct(GameRecord.user_id)))\
                    .filter(func.sum(GameRecord.prize_credits) > current_user_win)\
                    .group_by(GameRecord.user_id).count()
    
    user_rank = higher_users + 1 if higher_users is not None else 1
    
    return LeaderboardResponse(
        leaderboard_type="total_win",
        entries=entries,
        user_rank=user_rank,
        user_value=current_user_win
    )


@router.get("/leaderboard/win-rate", response_model=LeaderboardResponse)
async def get_win_rate_leaderboard(
    limit: int = Query(10, ge=1, le=100),
    min_games: int = Query(10, ge=1),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取胜率排行榜（需要最少游戏次数）"""
    # 计算每个用户的胜率
    user_stats = db.query(
        GameRecord.user_id,
        User.username,
        func.count(GameRecord.id).label('total_games'),
        func.sum(func.case([(GameRecord.prize_credits > GameRecord.game_cost, 1)], else_=0)).label('winning_games')
    ).join(User).group_by(GameRecord.user_id, User.username)\
     .having(func.count(GameRecord.id) >= min_games).all()
    
    # 计算胜率并排序
    user_win_rates = []
    for user_id, username, total_games, winning_games in user_stats:
        win_rate = (winning_games / total_games * 100) if total_games > 0 else 0
        user_win_rates.append((user_id, username, win_rate, total_games))
    
    user_win_rates.sort(key=lambda x: x[2], reverse=True)
    
    entries = []
    for rank, (user_id, username, win_rate, game_count) in enumerate(user_win_rates[:limit], 1):
        entries.append(LeaderboardEntry(
            rank=rank,
            user_id=user_id,
            username=username,
            value=int(win_rate),
            game_count=game_count
        ))
    
    # 计算当前用户胜率和排名
    current_user_records = db.query(GameRecord).filter(GameRecord.user_id == current_user.id).all()
    current_user_total = len(current_user_records)
    current_user_wins = len([r for r in current_user_records if r.prize_credits > r.game_cost])
    current_user_win_rate = (current_user_wins / current_user_total * 100) if current_user_total >= min_games else 0
    
    user_rank = None
    if current_user_total >= min_games:
        higher_users = len([x for x in user_win_rates if x[2] > current_user_win_rate])
        user_rank = higher_users + 1
    
    return LeaderboardResponse(
        leaderboard_type="win_rate",
        entries=entries,
        user_rank=user_rank,
        user_value=int(current_user_win_rate)
    )


@router.get("/analysis", response_model=GameAnalysisResponse)
async def get_game_analysis(
    game_type: Optional[str] = None,
    template_id: Optional[str] = None,
    days: int = Query(7, ge=1, le=365),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取游戏分析数据（需要管理员权限或自己的数据）"""
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)
    
    # 构建查询条件
    query = db.query(GameRecord).filter(
        GameRecord.created_at >= start_date,
        GameRecord.created_at <= end_date
    )
    
    # 如果不是管理员，只能查看自己的数据
    if not current_user.is_admin:
        query = query.filter(GameRecord.user_id == current_user.id)
    
    if game_type:
        query = query.filter(GameRecord.game_type == game_type)
    
    if template_id:
        query = query.filter(GameRecord.template_id == template_id)
    
    records = query.all()
    
    if not records:
        return GameAnalysisResponse(
            period=f"{days}天",
            total_players=0,
            total_games=0,
            total_revenue=0,
            total_payout=0,
            profit_margin=0.0,
            popular_games=[],
            hourly_distribution={},
            daily_distribution={}
        )
    
    # 计算基本统计
    total_players = len(set(record.user_id for record in records))
    total_games = len(records)
    total_revenue = sum(record.game_cost for record in records)
    total_payout = sum(record.prize_credits for record in records)
    profit_margin = ((total_revenue - total_payout) / total_revenue * 100) if total_revenue > 0 else 0
    
    # 统计热门游戏
    game_popularity = {}
    for record in records:
        key = f"{record.game_type}:{record.template_id}"
        if key not in game_popularity:
            game_popularity[key] = {"count": 0, "revenue": 0}
        game_popularity[key]["count"] += 1
        game_popularity[key]["revenue"] += record.game_cost
    
    popular_games = [
        {
            "game": key,
            "play_count": data["count"],
            "revenue": data["revenue"]
        }
        for key, data in sorted(game_popularity.items(), key=lambda x: x[1]["count"], reverse=True)[:5]
    ]
    
    # 按小时分布
    hourly_distribution = {}
    for record in records:
        hour = record.created_at.hour
        hourly_distribution[str(hour)] = hourly_distribution.get(str(hour), 0) + 1
    
    # 按日期分布
    daily_distribution = {}
    for record in records:
        date_str = record.created_at.strftime("%Y-%m-%d")
        daily_distribution[date_str] = daily_distribution.get(date_str, 0) + 1
    
    return GameAnalysisResponse(
        period=f"{days}天",
        total_players=total_players,
        total_games=total_games,
        total_revenue=total_revenue,
        total_payout=total_payout,
        profit_margin=profit_margin,
        popular_games=popular_games,
        hourly_distribution=hourly_distribution,
        daily_distribution=daily_distribution
    )


@router.get("/live-status", response_model=LiveGameStatus)
async def get_live_game_status(
    db: Session = Depends(get_db)
):
    """获取实时游戏状态"""
    # 获取最近1小时的活跃用户数（简化实现）
    one_hour_ago = datetime.now() - timedelta(hours=1)
    online_players = db.query(func.count(func.distinct(GameRecord.user_id)))\
                      .filter(GameRecord.created_at >= one_hour_ago).scalar() or 0
    
    # 获取最近10分钟的游戏数
    ten_minutes_ago = datetime.now() - timedelta(minutes=10)
    active_games = db.query(GameRecord)\
                    .filter(GameRecord.created_at >= ten_minutes_ago).count()
    
    # 获取最近的大奖记录
    recent_big_wins = db.query(GameRecord)\
                       .filter(GameRecord.prize_credits >= 1000)\
                       .order_by(desc(GameRecord.created_at))\
                       .limit(5).all()
    
    big_wins_data = []
    for record in recent_big_wins:
        user = db.query(User).filter(User.id == record.user_id).first()
        big_wins_data.append({
            "username": user.username if user else "未知用户",
            "game_type": record.game_type,
            "win_amount": record.prize_credits,
            "timestamp": record.created_at
        })
    
    # 获取热门游戏（最近24小时）
    twenty_four_hours_ago = datetime.now() - timedelta(hours=24)
    hot_games_query = db.query(
        GameRecord.game_type,
        GameRecord.template_id,
        func.count(GameRecord.id).label('play_count')
    ).filter(GameRecord.created_at >= twenty_four_hours_ago)\
     .group_by(GameRecord.game_type, GameRecord.template_id)\
     .order_by(desc('play_count')).limit(3).all()
    
    hot_games = [f"{game_type}:{template_id}" for game_type, template_id, _ in hot_games_query]
    
    return LiveGameStatus(
        online_players=online_players,
        active_games=active_games,
        recent_big_wins=big_wins_data,
        hot_games=hot_games
    )
