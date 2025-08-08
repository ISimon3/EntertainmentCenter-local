"""
幸运大转盘游戏逻辑模块
"""
import random
import math
from typing import Dict, List, Any, Optional, Tuple
from enum import Enum
from dataclasses import dataclass
from ..config import settings


class WheelType(Enum):
    """转盘类型枚举"""
    CLASSIC_WHEEL = "classic_wheel"      # 经典转盘
    FORTUNE_WHEEL = "fortune_wheel"      # 财富转盘
    LUCKY_WHEEL = "lucky_wheel"          # 幸运转盘
    MEGA_WHEEL = "mega_wheel"            # 超级转盘


@dataclass
class WheelSegment:
    """转盘扇形区域"""
    id: int
    name: str
    icon: str
    credits: int  # 奖励积分
    probability: float  # 中奖概率
    color: str  # 扇形颜色
    angle_start: float  # 起始角度
    angle_end: float    # 结束角度
    is_special: bool = False  # 是否为特殊奖品


@dataclass
class WheelTemplate:
    """转盘模板"""
    id: str
    name: str
    wheel_type: WheelType
    cost: int  # 游戏成本
    theme: str  # 主题风格
    segments: List[WheelSegment]  # 转盘扇形区域
    animation_duration: float  # 动画持续时间（秒）
    min_spins: int  # 最小转动圈数
    max_spins: int  # 最大转动圈数
    special_features: Dict[str, Any]  # 特殊功能


class WheelFortuneGame:
    """幸运大转盘游戏核心类"""
    
    def __init__(self):
        self.templates = self._load_templates()
    
    def _load_templates(self) -> Dict[str, WheelTemplate]:
        """加载转盘模板"""
        templates = {}
        
        # 经典转盘模板
        classic_segments = [
            WheelSegment(1, "谢谢参与", "😊", 0, 0.3, "#FF6B6B", 0, 54),
            WheelSegment(2, "10积分", "🪙", 10, 0.25, "#4ECDC4", 54, 108),
            WheelSegment(3, "谢谢参与", "😊", 0, 0.2, "#FF6B6B", 108, 162),
            WheelSegment(4, "20积分", "🪙", 20, 0.15, "#45B7D1", 162, 216),
            WheelSegment(5, "谢谢参与", "😊", 0, 0.05, "#FF6B6B", 216, 270),
            WheelSegment(6, "50积分", "💰", 50, 0.04, "#F39C12", 270, 324),
            WheelSegment(7, "100积分", "💎", 100, 0.01, "#9B59B6", 324, 360),
        ]
        
        templates["classic_wheel"] = WheelTemplate(
            id="classic_wheel",
            name="经典幸运转盘",
            wheel_type=WheelType.CLASSIC_WHEEL,
            cost=5,
            theme="classic",
            segments=classic_segments,
            animation_duration=3.0,
            min_spins=3,
            max_spins=5,
            special_features={
                "double_chance": False,
                "bonus_spin": False
            }
        )
        
        # 财富转盘模板
        fortune_segments = [
            WheelSegment(1, "破产", "💸", -50, 0.1, "#E74C3C", 0, 36),
            WheelSegment(2, "5元", "🪙", 5, 0.2, "#3498DB", 36, 72),
            WheelSegment(3, "10元", "🪙", 10, 0.18, "#2ECC71", 72, 108),
            WheelSegment(4, "20元", "💰", 20, 0.15, "#F39C12", 108, 144),
            WheelSegment(5, "50元", "💰", 50, 0.12, "#9B59B6", 144, 180),
            WheelSegment(6, "100元", "💎", 100, 0.1, "#E67E22", 180, 216),
            WheelSegment(7, "200元", "💎", 200, 0.08, "#8E44AD", 216, 252),
            WheelSegment(8, "500元", "👑", 500, 0.05, "#C0392B", 252, 288),
            WheelSegment(9, "1000元", "🏆", 1000, 0.02, "#D4AF37", 288, 324, True),
            WheelSegment(10, "大奖", "🎊", 2000, 0.001, "#FF1493", 324, 360, True),
        ]
        
        templates["fortune_wheel"] = WheelTemplate(
            id="fortune_wheel",
            name="财富转盘",
            wheel_type=WheelType.FORTUNE_WHEEL,
            cost=20,
            theme="fortune",
            segments=fortune_segments,
            animation_duration=4.0,
            min_spins=4,
            max_spins=6,
            special_features={
                "double_chance": True,
                "bonus_spin": False,
                "bankruptcy_protection": True  # 破产保护
            }
        )
        
        # 幸运转盘模板
        lucky_segments = [
            WheelSegment(1, "再来一次", "🔄", 0, 0.15, "#3498DB", 0, 30),
            WheelSegment(2, "15积分", "🪙", 15, 0.2, "#2ECC71", 30, 60),
            WheelSegment(3, "30积分", "💰", 30, 0.18, "#F39C12", 60, 90),
            WheelSegment(4, "谢谢参与", "😊", 0, 0.15, "#E74C3C", 90, 120),
            WheelSegment(5, "60积分", "💰", 60, 0.12, "#9B59B6", 120, 150),
            WheelSegment(6, "120积分", "💎", 120, 0.1, "#E67E22", 150, 180),
            WheelSegment(7, "谢谢参与", "😊", 0, 0.05, "#E74C3C", 180, 210),
            WheelSegment(8, "250积分", "💎", 250, 0.03, "#8E44AD", 210, 240),
            WheelSegment(9, "500积分", "👑", 500, 0.015, "#C0392B", 240, 270),
            WheelSegment(10, "幸运奖", "🍀", 1000, 0.005, "#27AE60", 270, 300, True),
            WheelSegment(11, "超级奖", "⭐", 1500, 0.003, "#D4AF37", 300, 330, True),
            WheelSegment(12, "终极大奖", "🎆", 3000, 0.001, "#FF1493", 330, 360, True),
        ]
        
        templates["lucky_wheel"] = WheelTemplate(
            id="lucky_wheel",
            name="幸运大转盘",
            wheel_type=WheelType.LUCKY_WHEEL,
            cost=15,
            theme="lucky",
            segments=lucky_segments,
            animation_duration=5.0,
            min_spins=5,
            max_spins=8,
            special_features={
                "double_chance": False,
                "bonus_spin": True,  # 再来一次功能
                "lucky_multiplier": True  # 幸运倍数
            }
        )
        
        # 超级转盘模板
        mega_segments = [
            WheelSegment(1, "小奖", "🎁", 25, 0.25, "#3498DB", 0, 45),
            WheelSegment(2, "中奖", "🎊", 100, 0.2, "#2ECC71", 45, 90),
            WheelSegment(3, "大奖", "💰", 300, 0.15, "#F39C12", 90, 135),
            WheelSegment(4, "超级奖", "💎", 800, 0.1, "#9B59B6", 135, 180),
            WheelSegment(5, "巨奖", "👑", 2000, 0.08, "#E67E22", 180, 225),
            WheelSegment(6, "传奇奖", "🏆", 5000, 0.05, "#8E44AD", 225, 270),
            WheelSegment(7, "史诗奖", "⭐", 10000, 0.02, "#C0392B", 270, 315),
            WheelSegment(8, "终极奖", "🎆", 50000, 0.001, "#D4AF37", 315, 360, True),
        ]
        
        templates["mega_wheel"] = WheelTemplate(
            id="mega_wheel",
            name="超级大转盘",
            wheel_type=WheelType.MEGA_WHEEL,
            cost=50,
            theme="mega",
            segments=mega_segments,
            animation_duration=6.0,
            min_spins=6,
            max_spins=10,
            special_features={
                "double_chance": True,
                "bonus_spin": False,
                "progressive_jackpot": True  # 累进奖池
            }
        )
        
        return templates
    
    def spin(self, template_id: str, user_id: int) -> Dict[str, Any]:
        """转动转盘"""
        if template_id not in self.templates:
            raise ValueError(f"未知的模板ID: {template_id}")
        
        template = self.templates[template_id]
        
        # 根据概率选择中奖扇形
        winning_segment = self._select_segment_by_probability(template.segments)
        
        # 计算转盘停止角度
        stop_angle = self._calculate_stop_angle(winning_segment)
        
        # 计算转动圈数和总角度
        spin_rounds = random.randint(template.min_spins, template.max_spins)
        total_angle = spin_rounds * 360 + stop_angle
        
        # 检查特殊功能
        special_effects = self._check_special_effects(template, winning_segment)
        
        result = {
            "template_id": template_id,
            "template_name": template.name,
            "wheel_type": template.wheel_type.value,
            "theme": template.theme,
            "cost": template.cost,
            "winning_segment": {
                "id": winning_segment.id,
                "name": winning_segment.name,
                "icon": winning_segment.icon,
                "credits": winning_segment.credits,
                "color": winning_segment.color,
                "is_special": winning_segment.is_special
            },
            "stop_angle": stop_angle,
            "spin_rounds": spin_rounds,
            "total_angle": total_angle,
            "animation_duration": template.animation_duration,
            "special_effects": special_effects,
            "net_win": winning_segment.credits - template.cost,
            "is_winner": winning_segment.credits > 0,
            "user_id": user_id
        }
        
        return result
    
    def _select_segment_by_probability(self, segments: List[WheelSegment]) -> WheelSegment:
        """根据概率选择扇形"""
        rand = random.random()
        cumulative_prob = 0
        
        for segment in segments:
            cumulative_prob += segment.probability
            if rand <= cumulative_prob:
                return segment
        
        # 如果没有选中任何扇形，返回最后一个
        return segments[-1]
    
    def _calculate_stop_angle(self, segment: WheelSegment) -> float:
        """计算转盘停止角度"""
        # 在扇形范围内随机选择一个角度
        angle_range = segment.angle_end - segment.angle_start
        random_offset = random.random() * angle_range
        stop_angle = segment.angle_start + random_offset
        
        # 转换为指针指向的角度（转盘顺时针转动，指针在顶部）
        pointer_angle = (360 - stop_angle) % 360
        
        return pointer_angle
    
    def _check_special_effects(self, template: WheelTemplate, segment: WheelSegment) -> Dict[str, Any]:
        """检查特殊效果"""
        effects = {}
        
        # 双倍机会
        if template.special_features.get("double_chance") and segment.is_special:
            if random.random() < 0.1:  # 10%概率触发双倍
                effects["double_reward"] = True
        
        # 再来一次
        if template.special_features.get("bonus_spin") and segment.name == "再来一次":
            effects["bonus_spin"] = True
        
        # 破产保护
        if template.special_features.get("bankruptcy_protection") and segment.credits < 0:
            if random.random() < 0.3:  # 30%概率触发保护
                effects["bankruptcy_protection"] = True
        
        # 幸运倍数
        if template.special_features.get("lucky_multiplier") and segment.is_special:
            multiplier = random.choice([2, 3, 5])
            if random.random() < 0.05:  # 5%概率触发倍数
                effects["lucky_multiplier"] = multiplier
        
        return effects

    def get_templates(self) -> List[Dict[str, Any]]:
        """获取所有模板信息"""
        return [
            {
                "id": template.id,
                "name": template.name,
                "wheel_type": template.wheel_type.value,
                "cost": template.cost,
                "theme": template.theme,
                "animation_duration": template.animation_duration,
                "segments": [
                    {
                        "id": segment.id,
                        "name": segment.name,
                        "icon": segment.icon,
                        "credits": segment.credits,
                        "probability": segment.probability,
                        "color": segment.color,
                        "angle_start": segment.angle_start,
                        "angle_end": segment.angle_end,
                        "is_special": segment.is_special
                    }
                    for segment in template.segments
                ],
                "special_features": template.special_features
            }
            for template in self.templates.values()
        ]

    def get_segment_info(self, template_id: str, segment_id: int) -> Optional[Dict[str, Any]]:
        """获取扇形信息"""
        if template_id not in self.templates:
            return None

        template = self.templates[template_id]
        for segment in template.segments:
            if segment.id == segment_id:
                return {
                    "id": segment.id,
                    "name": segment.name,
                    "icon": segment.icon,
                    "credits": segment.credits,
                    "probability": segment.probability,
                    "color": segment.color,
                    "angle_start": segment.angle_start,
                    "angle_end": segment.angle_end,
                    "is_special": segment.is_special
                }

        return None

    def calculate_expected_value(self, template_id: str) -> float:
        """计算期望值"""
        if template_id not in self.templates:
            return 0.0

        template = self.templates[template_id]
        expected_value = 0.0

        for segment in template.segments:
            expected_value += segment.credits * segment.probability

        # 减去游戏成本
        return expected_value - template.cost

    def get_win_statistics(self, template_id: str) -> Dict[str, Any]:
        """获取中奖统计信息"""
        if template_id not in self.templates:
            return {}

        template = self.templates[template_id]

        total_segments = len(template.segments)
        winning_segments = len([s for s in template.segments if s.credits > 0])
        losing_segments = total_segments - winning_segments

        win_probability = sum(s.probability for s in template.segments if s.credits > 0)
        lose_probability = 1.0 - win_probability

        max_win = max(s.credits for s in template.segments)
        min_win = min(s.credits for s in template.segments if s.credits > 0) if winning_segments > 0 else 0

        return {
            "total_segments": total_segments,
            "winning_segments": winning_segments,
            "losing_segments": losing_segments,
            "win_probability": win_probability,
            "lose_probability": lose_probability,
            "max_win": max_win,
            "min_win": min_win,
            "expected_value": self.calculate_expected_value(template_id)
        }


# 全局游戏实例
wheel_fortune_game = WheelFortuneGame()
