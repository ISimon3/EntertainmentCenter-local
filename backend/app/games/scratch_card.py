"""
刮刮乐游戏逻辑模块
"""
import random
import json
from typing import Dict, List, Any, Optional, Tuple
from enum import Enum
from dataclasses import dataclass
from ..config import settings


class ScratchCardType(Enum):
    """刮刮乐类型枚举"""
    SYMBOL_MATCH = "symbol_match"  # 玩法1: 符号匹配
    DIRECT_PRIZE = "direct_prize"  # 玩法2: 直接奖金
    LUCKY_SYMBOL = "lucky_symbol"  # 玩法3: 幸运符号


@dataclass
class ScratchArea:
    """刮奖区域"""
    id: int
    content: str  # 区域内容（奖金金额、符号等）
    is_scratched: bool = False
    is_winner: bool = False


@dataclass
class ScratchCardTemplate:
    """刮刮乐模板"""
    id: str
    name: str
    card_type: ScratchCardType
    cost: int  # 游戏成本
    theme: str  # 主题风格
    areas_count: int  # 刮奖区域数量
    layout: Dict[str, Any]  # 布局配置
    rules: Dict[str, Any]  # 游戏规则
    prizes: List[Dict[str, Any]]  # 奖品配置


class ScratchCardGame:
    """刮刮乐游戏核心类"""
    
    def __init__(self):
        self.templates = self._load_templates()
    
    def _load_templates(self) -> Dict[str, ScratchCardTemplate]:
        """加载刮刮乐模板"""
        templates = {}
        
        # 模板1: 福利彩票风格 - 直接奖金玩法
        templates["welfare_lottery"] = ScratchCardTemplate(
            id="welfare_lottery",
            name="福利彩票刮刮乐",
            card_type=ScratchCardType.DIRECT_PRIZE,
            cost=10,
            theme="welfare_lottery",
            areas_count=30,  # 6x5 网格
            layout={
                "rows": 5,
                "cols": 6,
                "area_size": "medium",
                "background_color": "#FFD700",
                "border_color": "#FF0000"
            },
            rules={
                "description": "刮开涂层，直接显示中奖金额或'谢谢参与'",
                "win_condition": "任意区域显示奖金即中奖"
            },
            prizes=[
                {"name": "特等奖", "credits": 1000, "probability": 0.001, "display": "1000元"},
                {"name": "一等奖", "credits": 500, "probability": 0.005, "display": "500元"},
                {"name": "二等奖", "credits": 200, "probability": 0.01, "display": "200元"},
                {"name": "三等奖", "credits": 100, "probability": 0.02, "display": "100元"},
                {"name": "四等奖", "credits": 50, "probability": 0.05, "display": "50元"},
                {"name": "五等奖", "credits": 20, "probability": 0.1, "display": "20元"},
                {"name": "六等奖", "credits": 10, "probability": 0.15, "display": "10元"},
                {"name": "谢谢参与", "credits": 0, "probability": 0.664, "display": "谢谢参与"}
            ]
        )
        
        # 模板2: 新年主题 - 符号匹配玩法
        templates["new_year"] = ScratchCardTemplate(
            id="new_year",
            name="新年福运刮刮乐",
            card_type=ScratchCardType.SYMBOL_MATCH,
            cost=15,
            theme="new_year",
            areas_count=9,  # 3x3 网格
            layout={
                "rows": 3,
                "cols": 3,
                "area_size": "large",
                "background_color": "#FF6B6B",
                "border_color": "#FFD700"
            },
            rules={
                "description": "刮开9个区域，如果出现3个相同符号，即为中奖",
                "win_condition": "3个相同符号",
                "symbols": ["🧧", "🎆", "🎊", "🍊", "🎁", "💰", "🐉", "🏮"]
            },
            prizes=[
                {"name": "龙年大奖", "credits": 2000, "probability": 0.002, "symbol": "🐉"},
                {"name": "红包奖", "credits": 888, "probability": 0.005, "symbol": "🧧"},
                {"name": "烟花奖", "credits": 500, "probability": 0.01, "symbol": "🎆"},
                {"name": "礼品奖", "credits": 200, "probability": 0.02, "symbol": "🎁"},
                {"name": "橘子奖", "credits": 100, "probability": 0.05, "symbol": "🍊"},
                {"name": "谢谢参与", "credits": 0, "probability": 0.913, "symbol": ""}
            ]
        )
        
        # 模板3: 幸运符号玩法
        templates["lucky_symbol"] = ScratchCardTemplate(
            id="lucky_symbol",
            name="幸运符号刮刮乐",
            card_type=ScratchCardType.LUCKY_SYMBOL,
            cost=20,
            theme="lucky",
            areas_count=16,  # 4x4 网格
            layout={
                "rows": 4,
                "cols": 4,
                "area_size": "medium",
                "background_color": "#9B59B6",
                "border_color": "#F39C12"
            },
            rules={
                "description": "在16个区域中，只要刮出一个'⭐'幸运符号，就中大奖",
                "win_condition": "刮出幸运符号⭐",
                "lucky_symbol": "⭐",
                "normal_symbols": ["💎", "🔮", "🎯", "🎲", "🃏", "🎪"]
            },
            prizes=[
                {"name": "幸运大奖", "credits": 5000, "probability": 0.01, "symbol": "⭐"},
                {"name": "谢谢参与", "credits": 0, "probability": 0.99, "symbol": ""}
            ]
        )
        
        return templates
    
    def create_card(self, template_id: str, user_id: int) -> Dict[str, Any]:
        """创建刮刮乐卡片"""
        if template_id not in self.templates:
            raise ValueError(f"未知的模板ID: {template_id}")
        
        template = self.templates[template_id]
        
        # 根据不同玩法生成卡片内容
        if template.card_type == ScratchCardType.DIRECT_PRIZE:
            areas = self._generate_direct_prize_areas(template)
        elif template.card_type == ScratchCardType.SYMBOL_MATCH:
            areas = self._generate_symbol_match_areas(template)
        elif template.card_type == ScratchCardType.LUCKY_SYMBOL:
            areas = self._generate_lucky_symbol_areas(template)
        else:
            raise ValueError(f"不支持的卡片类型: {template.card_type}")
        
        # 计算是否中奖和奖金
        is_winner, prize_info = self._calculate_win_result(template, areas)
        
        card_data = {
            "template_id": template_id,
            "template_name": template.name,
            "card_type": template.card_type.value,
            "theme": template.theme,
            "cost": template.cost,
            "layout": template.layout,
            "rules": template.rules,
            "areas": [
                {
                    "id": area.id,
                    "content": area.content,
                    "is_scratched": False,
                    "is_winner": area.is_winner
                }
                for area in areas
            ],
            "is_winner": is_winner,
            "prize_info": prize_info,
            "user_id": user_id
        }
        
        return card_data
    
    def _generate_direct_prize_areas(self, template: ScratchCardTemplate) -> List[ScratchArea]:
        """生成直接奖金玩法的区域"""
        areas = []
        
        # 随机选择一个奖品
        prize = self._select_prize_by_probability(template.prizes)
        
        # 随机选择一个区域放置奖品
        winner_area_id = random.randint(0, template.areas_count - 1)
        
        for i in range(template.areas_count):
            if i == winner_area_id and prize["credits"] > 0:
                # 中奖区域
                area = ScratchArea(
                    id=i,
                    content=prize["display"],
                    is_winner=True
                )
            else:
                # 非中奖区域
                area = ScratchArea(
                    id=i,
                    content="谢谢参与",
                    is_winner=False
                )
            areas.append(area)
        
        return areas
    
    def _generate_symbol_match_areas(self, template: ScratchCardTemplate) -> List[ScratchArea]:
        """生成符号匹配玩法的区域"""
        areas = []
        symbols = template.rules["symbols"]
        
        # 随机决定是否中奖
        prize = self._select_prize_by_probability(template.prizes)
        
        if prize["credits"] > 0 and prize["symbol"]:
            # 中奖情况：放置3个相同符号
            winning_symbol = prize["symbol"]
            winning_positions = random.sample(range(template.areas_count), 3)
            
            for i in range(template.areas_count):
                if i in winning_positions:
                    area = ScratchArea(
                        id=i,
                        content=winning_symbol,
                        is_winner=True
                    )
                else:
                    # 随机选择其他符号
                    other_symbols = [s for s in symbols if s != winning_symbol]
                    area = ScratchArea(
                        id=i,
                        content=random.choice(other_symbols),
                        is_winner=False
                    )
                areas.append(area)
        else:
            # 不中奖情况：确保没有3个相同符号
            for i in range(template.areas_count):
                area = ScratchArea(
                    id=i,
                    content=random.choice(symbols),
                    is_winner=False
                )
                areas.append(area)
            
            # 确保没有3个相同符号
            self._ensure_no_three_match(areas, symbols)
        
        return areas
    
    def _generate_lucky_symbol_areas(self, template: ScratchCardTemplate) -> List[ScratchArea]:
        """生成幸运符号玩法的区域"""
        areas = []
        lucky_symbol = template.rules["lucky_symbol"]
        normal_symbols = template.rules["normal_symbols"]
        
        # 随机决定是否中奖
        prize = self._select_prize_by_probability(template.prizes)
        
        if prize["credits"] > 0:
            # 中奖情况：随机放置一个幸运符号
            lucky_position = random.randint(0, template.areas_count - 1)
            
            for i in range(template.areas_count):
                if i == lucky_position:
                    area = ScratchArea(
                        id=i,
                        content=lucky_symbol,
                        is_winner=True
                    )
                else:
                    area = ScratchArea(
                        id=i,
                        content=random.choice(normal_symbols),
                        is_winner=False
                    )
                areas.append(area)
        else:
            # 不中奖情况：只放置普通符号
            for i in range(template.areas_count):
                area = ScratchArea(
                    id=i,
                    content=random.choice(normal_symbols),
                    is_winner=False
                )
                areas.append(area)
        
        return areas
    
    def _select_prize_by_probability(self, prizes: List[Dict[str, Any]]) -> Dict[str, Any]:
        """根据概率选择奖品"""
        rand = random.random()
        cumulative_prob = 0
        
        for prize in prizes:
            cumulative_prob += prize["probability"]
            if rand <= cumulative_prob:
                return prize
        
        # 如果没有选中任何奖品，返回最后一个（通常是谢谢参与）
        return prizes[-1]
    
    def _ensure_no_three_match(self, areas: List[ScratchArea], symbols: List[str]):
        """确保没有3个相同符号（用于符号匹配玩法的不中奖情况）"""
        symbol_counts = {}
        for area in areas:
            symbol_counts[area.content] = symbol_counts.get(area.content, 0) + 1
        
        # 如果有符号出现3次或以上，随机替换一些
        for symbol, count in symbol_counts.items():
            if count >= 3:
                # 找到该符号的位置
                positions = [i for i, area in enumerate(areas) if area.content == symbol]
                # 随机替换一些位置的符号
                replace_count = count - 2  # 保留最多2个
                replace_positions = random.sample(positions, replace_count)
                
                for pos in replace_positions:
                    # 选择一个不同的符号
                    other_symbols = [s for s in symbols if s != symbol]
                    areas[pos].content = random.choice(other_symbols)
    
    def _calculate_win_result(self, template: ScratchCardTemplate, areas: List[ScratchArea]) -> Tuple[bool, Dict[str, Any]]:
        """计算中奖结果"""
        winner_areas = [area for area in areas if area.is_winner]
        
        if not winner_areas:
            return False, {"name": "谢谢参与", "credits": 0}
        
        # 根据中奖区域确定奖品信息
        if template.card_type == ScratchCardType.DIRECT_PRIZE:
            winner_area = winner_areas[0]
            for prize in template.prizes:
                if prize["display"] == winner_area.content:
                    return True, prize
        
        elif template.card_type == ScratchCardType.SYMBOL_MATCH:
            winner_symbol = winner_areas[0].content
            for prize in template.prizes:
                if prize.get("symbol") == winner_symbol:
                    return True, prize
        
        elif template.card_type == ScratchCardType.LUCKY_SYMBOL:
            for prize in template.prizes:
                if prize["credits"] > 0:
                    return True, prize
        
        return False, {"name": "谢谢参与", "credits": 0}
    
    def scratch_area(self, card_data: Dict[str, Any], area_id: int) -> Dict[str, Any]:
        """刮开指定区域"""
        if area_id < 0 or area_id >= len(card_data["areas"]):
            raise ValueError("无效的区域ID")
        
        area = card_data["areas"][area_id]
        if area["is_scratched"]:
            raise ValueError("该区域已经刮开")
        
        # 标记为已刮开
        area["is_scratched"] = True
        
        # 返回更新后的卡片数据
        return card_data
    
    def get_templates(self) -> List[Dict[str, Any]]:
        """获取所有模板信息"""
        return [
            {
                "id": template.id,
                "name": template.name,
                "card_type": template.card_type.value,
                "cost": template.cost,
                "theme": template.theme,
                "layout": template.layout,
                "rules": template.rules,
                "areas_count": template.areas_count
            }
            for template in self.templates.values()
        ]


# 全局游戏实例
scratch_card_game = ScratchCardGame()
