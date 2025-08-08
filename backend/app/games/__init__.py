"""
游戏模块
包含所有游戏逻辑的实现
"""

from .scratch_card import scratch_card_game, ScratchCardGame, ScratchCardType
from .slot_machine import slot_machine_game, SlotMachineGame, SlotMachineType
from .wheel_fortune import wheel_fortune_game, WheelFortuneGame, WheelType

__all__ = [
    "scratch_card_game",
    "ScratchCardGame",
    "ScratchCardType",
    "slot_machine_game",
    "SlotMachineGame",
    "SlotMachineType",
    "wheel_fortune_game",
    "WheelFortuneGame",
    "WheelType"
]
