"""
Pydantic 模式包
包含所有API的请求和响应模式
"""

from .auth import *
from .game import *

__all__ = [
    # 认证相关
    "UserCreate",
    "UserLogin",
    "UserResponse",
    "Token",
    "TokenData",

    # 游戏相关
    "GameTemplateResponse",
    "ScratchCardPlayRequest",
    "ScratchCardPlayResponse",
    "SlotMachinePlayRequest",
    "SlotMachinePlayResponse",
    "WheelFortunePlayRequest",
    "WheelFortunePlayResponse",
    "GameHistoryResponse",
    "GameStatsResponse",
    "UserGameStatsResponse",
    "LeaderboardEntry",
    "LeaderboardResponse",
    "GameConfigRequest",
    "GameConfigResponse",
    "PrizeInfo",
    "GamePrizesResponse",
    "GameAnalysisRequest",
    "GameAnalysisResponse",
    "LiveGameStatus",
    "GameEvent",
    "GameEventsResponse"
]
