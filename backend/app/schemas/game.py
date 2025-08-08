"""
游戏相关的数据模式
"""
from pydantic import BaseModel, Field
from typing import Dict, List, Any, Optional
from datetime import datetime


class GameTemplateResponse(BaseModel):
    """游戏模板响应"""
    id: str
    name: str
    game_type: str
    cost: int
    theme: str
    description: str
    features: Dict[str, Any]


# 刮刮乐相关模式
class ScratchCardPlayRequest(BaseModel):
    """刮刮乐游戏请求"""
    template_id: str = Field(..., description="模板ID")


class ScratchCardPlayResponse(BaseModel):
    """刮刮乐游戏响应"""
    success: bool
    card_data: Dict[str, Any]
    user_credits: int
    game_record_id: int


# 老虎机相关模式
class SlotMachinePlayRequest(BaseModel):
    """老虎机游戏请求"""
    template_id: str = Field(..., description="模板ID")
    bet_lines: Optional[int] = Field(None, description="下注线数，不指定则使用全部支付线")


class SlotMachinePlayResponse(BaseModel):
    """老虎机游戏响应"""
    success: bool
    result: Dict[str, Any]
    user_credits: int
    game_record_id: int


# 幸运大转盘相关模式
class WheelFortunePlayRequest(BaseModel):
    """幸运大转盘游戏请求"""
    template_id: str = Field(..., description="模板ID")


class WheelFortunePlayResponse(BaseModel):
    """幸运大转盘游戏响应"""
    success: bool
    result: Dict[str, Any]
    user_credits: int
    game_record_id: int


# 游戏历史记录模式
class GameHistoryResponse(BaseModel):
    """游戏历史记录响应"""
    id: int
    game_type: str
    template_id: str
    bet_amount: int
    win_amount: int
    net_win: int
    created_at: datetime
    result_data: Dict[str, Any]

    class Config:
        from_attributes = True


# 游戏统计模式
class GameStatsResponse(BaseModel):
    """游戏统计响应"""
    total_games: int
    total_bet: int
    total_win: int
    net_result: int
    win_rate: float
    favorite_game: Optional[str]


class UserGameStatsResponse(BaseModel):
    """用户游戏统计响应"""
    user_id: int
    username: str
    overall_stats: GameStatsResponse
    game_type_stats: Dict[str, GameStatsResponse]


# 排行榜模式
class LeaderboardEntry(BaseModel):
    """排行榜条目"""
    rank: int
    user_id: int
    username: str
    value: int
    game_count: int


class LeaderboardResponse(BaseModel):
    """排行榜响应"""
    leaderboard_type: str  # "credits", "total_win", "win_rate"
    entries: List[LeaderboardEntry]
    user_rank: Optional[int] = None
    user_value: Optional[int] = None


# 游戏配置模式
class GameConfigRequest(BaseModel):
    """游戏配置请求"""
    template_id: str
    config_data: Dict[str, Any]


class GameConfigResponse(BaseModel):
    """游戏配置响应"""
    template_id: str
    config_data: Dict[str, Any]
    updated_at: datetime


# 奖品模式
class PrizeInfo(BaseModel):
    """奖品信息"""
    name: str
    credits: int
    probability: float
    description: Optional[str] = None


class GamePrizesResponse(BaseModel):
    """游戏奖品响应"""
    template_id: str
    template_name: str
    prizes: List[PrizeInfo]
    expected_value: float


# 游戏分析模式
class GameAnalysisRequest(BaseModel):
    """游戏分析请求"""
    game_type: Optional[str] = None
    template_id: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class GameAnalysisResponse(BaseModel):
    """游戏分析响应"""
    period: str
    total_players: int
    total_games: int
    total_revenue: int
    total_payout: int
    profit_margin: float
    popular_games: List[Dict[str, Any]]
    hourly_distribution: Dict[str, int]
    daily_distribution: Dict[str, int]


# 实时游戏状态模式
class LiveGameStatus(BaseModel):
    """实时游戏状态"""
    online_players: int
    active_games: int
    recent_big_wins: List[Dict[str, Any]]
    hot_games: List[str]


# 游戏事件模式
class GameEvent(BaseModel):
    """游戏事件"""
    event_type: str  # "big_win", "jackpot", "new_player", etc.
    user_id: int
    username: str
    game_type: str
    template_id: str
    amount: int
    timestamp: datetime
    details: Dict[str, Any]


class GameEventsResponse(BaseModel):
    """游戏事件响应"""
    events: List[GameEvent]
    total_count: int
