"""
老虎机游戏逻辑模块
"""
import random
import json
from typing import Dict, List, Any, Optional, Tuple
from enum import Enum
from dataclasses import dataclass
from ..config import settings


class SlotMachineType(Enum):
    """老虎机类型枚举"""
    CLASSIC_3_REEL = "classic_3_reel"  # 经典3轮老虎机
    MODERN_5_REEL = "modern_5_reel"    # 现代5轮老虎机
    FRUIT_MACHINE = "fruit_machine"    # 水果机


@dataclass
class SlotSymbol:
    """老虎机符号"""
    id: str
    name: str
    icon: str
    value: int  # 符号价值
    rarity: float  # 稀有度（出现概率的倒数）


@dataclass
class PayLine:
    """支付线"""
    id: int
    positions: List[Tuple[int, int]]  # (轮数, 位置) 的列表
    name: str


@dataclass
class SlotMachineTemplate:
    """老虎机模板"""
    id: str
    name: str
    machine_type: SlotMachineType
    cost: int  # 游戏成本
    theme: str  # 主题风格
    reels_count: int  # 转轮数量
    positions_per_reel: int  # 每个转轮的位置数
    symbols: List[SlotSymbol]  # 可用符号
    paylines: List[PayLine]  # 支付线
    paytable: Dict[str, List[Dict[str, Any]]]  # 支付表
    special_features: Dict[str, Any]  # 特殊功能


class SlotMachineGame:
    """老虎机游戏核心类"""
    
    def __init__(self):
        self.templates = self._load_templates()
    
    def _load_templates(self) -> Dict[str, SlotMachineTemplate]:
        """加载老虎机模板"""
        templates = {}
        
        # 经典3轮老虎机模板
        classic_symbols = [
            SlotSymbol("cherry", "樱桃", "🍒", 1, 0.3),
            SlotSymbol("lemon", "柠檬", "🍋", 2, 0.25),
            SlotSymbol("orange", "橙子", "🍊", 3, 0.2),
            SlotSymbol("plum", "李子", "🍇", 4, 0.15),
            SlotSymbol("bell", "铃铛", "🔔", 5, 0.08),
            SlotSymbol("seven", "幸运7", "7️⃣", 10, 0.02),
        ]
        
        classic_paylines = [
            PayLine(1, [(0, 1), (1, 1), (2, 1)], "中线"),
            PayLine(2, [(0, 0), (1, 0), (2, 0)], "上线"),
            PayLine(3, [(0, 2), (1, 2), (2, 2)], "下线"),
            PayLine(4, [(0, 0), (1, 1), (2, 2)], "对角线1"),
            PayLine(5, [(0, 2), (1, 1), (2, 0)], "对角线2"),
        ]
        
        templates["classic_3_reel"] = SlotMachineTemplate(
            id="classic_3_reel",
            name="经典老虎机",
            machine_type=SlotMachineType.CLASSIC_3_REEL,
            cost=5,
            theme="classic",
            reels_count=3,
            positions_per_reel=3,
            symbols=classic_symbols,
            paylines=classic_paylines,
            paytable={
                "cherry": [
                    {"count": 2, "multiplier": 2},
                    {"count": 3, "multiplier": 5}
                ],
                "lemon": [
                    {"count": 2, "multiplier": 3},
                    {"count": 3, "multiplier": 8}
                ],
                "orange": [
                    {"count": 2, "multiplier": 4},
                    {"count": 3, "multiplier": 12}
                ],
                "plum": [
                    {"count": 2, "multiplier": 5},
                    {"count": 3, "multiplier": 15}
                ],
                "bell": [
                    {"count": 2, "multiplier": 8},
                    {"count": 3, "multiplier": 25}
                ],
                "seven": [
                    {"count": 2, "multiplier": 20},
                    {"count": 3, "multiplier": 100}
                ]
            },
            special_features={
                "wild_symbol": None,
                "scatter_symbol": None,
                "bonus_game": False
            }
        )
        
        # 现代5轮老虎机模板
        modern_symbols = [
            SlotSymbol("A", "A", "🅰️", 1, 0.25),
            SlotSymbol("K", "K", "🇰", 2, 0.2),
            SlotSymbol("Q", "Q", "🇶", 3, 0.18),
            SlotSymbol("J", "J", "🇯", 4, 0.15),
            SlotSymbol("diamond", "钻石", "💎", 8, 0.1),
            SlotSymbol("crown", "皇冠", "👑", 12, 0.08),
            SlotSymbol("star", "星星", "⭐", 20, 0.04),
        ]
        
        modern_paylines = []
        # 生成25条支付线（5x5网格的常见配置）
        for i in range(25):
            if i < 5:  # 水平线
                positions = [(j, i) for j in range(5)]
            elif i < 10:  # 对角线和其他模式
                positions = [(j, (i-5+j) % 3 + 1) for j in range(5)]
            else:  # 更复杂的模式
                positions = [(j, (i-10) % 3) for j in range(5)]
            modern_paylines.append(PayLine(i+1, positions, f"支付线{i+1}"))
        
        templates["modern_5_reel"] = SlotMachineTemplate(
            id="modern_5_reel",
            name="现代老虎机",
            machine_type=SlotMachineType.MODERN_5_REEL,
            cost=10,
            theme="modern",
            reels_count=5,
            positions_per_reel=3,
            symbols=modern_symbols,
            paylines=modern_paylines,
            paytable={
                "A": [
                    {"count": 3, "multiplier": 5},
                    {"count": 4, "multiplier": 15},
                    {"count": 5, "multiplier": 50}
                ],
                "K": [
                    {"count": 3, "multiplier": 8},
                    {"count": 4, "multiplier": 25},
                    {"count": 5, "multiplier": 80}
                ],
                "Q": [
                    {"count": 3, "multiplier": 12},
                    {"count": 4, "multiplier": 35},
                    {"count": 5, "multiplier": 120}
                ],
                "J": [
                    {"count": 3, "multiplier": 15},
                    {"count": 4, "multiplier": 45},
                    {"count": 5, "multiplier": 150}
                ],
                "diamond": [
                    {"count": 3, "multiplier": 25},
                    {"count": 4, "multiplier": 80},
                    {"count": 5, "multiplier": 300}
                ],
                "crown": [
                    {"count": 3, "multiplier": 40},
                    {"count": 4, "multiplier": 150},
                    {"count": 5, "multiplier": 500}
                ],
                "star": [
                    {"count": 3, "multiplier": 100},
                    {"count": 4, "multiplier": 400},
                    {"count": 5, "multiplier": 1000}
                ]
            },
            special_features={
                "wild_symbol": "star",
                "scatter_symbol": "crown",
                "bonus_game": True
            }
        )
        
        # 水果机模板
        fruit_symbols = [
            SlotSymbol("watermelon", "西瓜", "🍉", 1, 0.3),
            SlotSymbol("grape", "葡萄", "🍇", 2, 0.25),
            SlotSymbol("apple", "苹果", "🍎", 3, 0.2),
            SlotSymbol("banana", "香蕉", "🍌", 4, 0.15),
            SlotSymbol("pineapple", "菠萝", "🍍", 6, 0.08),
            SlotSymbol("jackpot", "大奖", "💰", 15, 0.02),
        ]
        
        fruit_paylines = [
            PayLine(1, [(0, 1), (1, 1), (2, 1)], "中线"),
            PayLine(2, [(0, 0), (1, 0), (2, 0)], "上线"),
            PayLine(3, [(0, 2), (1, 2), (2, 2)], "下线"),
        ]
        
        templates["fruit_machine"] = SlotMachineTemplate(
            id="fruit_machine",
            name="水果老虎机",
            machine_type=SlotMachineType.FRUIT_MACHINE,
            cost=8,
            theme="fruit",
            reels_count=3,
            positions_per_reel=3,
            symbols=fruit_symbols,
            paylines=fruit_paylines,
            paytable={
                "watermelon": [
                    {"count": 2, "multiplier": 2},
                    {"count": 3, "multiplier": 6}
                ],
                "grape": [
                    {"count": 2, "multiplier": 3},
                    {"count": 3, "multiplier": 10}
                ],
                "apple": [
                    {"count": 2, "multiplier": 4},
                    {"count": 3, "multiplier": 15}
                ],
                "banana": [
                    {"count": 2, "multiplier": 6},
                    {"count": 3, "multiplier": 20}
                ],
                "pineapple": [
                    {"count": 2, "multiplier": 10},
                    {"count": 3, "multiplier": 35}
                ],
                "jackpot": [
                    {"count": 2, "multiplier": 50},
                    {"count": 3, "multiplier": 200}
                ]
            },
            special_features={
                "wild_symbol": "jackpot",
                "scatter_symbol": None,
                "bonus_game": False
            }
        )
        
        return templates
    
    def spin(self, template_id: str, user_id: int, bet_lines: int = None) -> Dict[str, Any]:
        """转动老虎机"""
        if template_id not in self.templates:
            raise ValueError(f"未知的模板ID: {template_id}")
        
        template = self.templates[template_id]
        
        # 如果没有指定下注线数，使用所有支付线
        if bet_lines is None:
            bet_lines = len(template.paylines)
        elif bet_lines > len(template.paylines):
            bet_lines = len(template.paylines)
        
        # 生成转轮结果
        reels_result = self._generate_reels_result(template)
        
        # 检查中奖情况
        winning_lines, total_win = self._check_winning_lines(template, reels_result, bet_lines)
        
        # 计算总成本
        total_cost = template.cost * bet_lines
        
        # 计算净收益
        net_win = total_win - total_cost
        
        result = {
            "template_id": template_id,
            "template_name": template.name,
            "machine_type": template.machine_type.value,
            "theme": template.theme,
            "reels_result": reels_result,
            "bet_lines": bet_lines,
            "total_cost": total_cost,
            "winning_lines": winning_lines,
            "total_win": total_win,
            "net_win": net_win,
            "is_winner": total_win > 0,
            "user_id": user_id
        }
        
        return result
    
    def _generate_reels_result(self, template: SlotMachineTemplate) -> List[List[str]]:
        """生成转轮结果"""
        result = []
        
        for reel in range(template.reels_count):
            reel_result = []
            for position in range(template.positions_per_reel):
                # 根据符号稀有度加权随机选择
                symbol = self._weighted_random_symbol(template.symbols)
                reel_result.append(symbol.id)
            result.append(reel_result)
        
        return result
    
    def _weighted_random_symbol(self, symbols: List[SlotSymbol]) -> SlotSymbol:
        """根据稀有度加权随机选择符号"""
        # 计算权重（稀有度的倒数）
        weights = [1.0 / symbol.rarity for symbol in symbols]
        total_weight = sum(weights)
        
        # 归一化权重
        normalized_weights = [w / total_weight for w in weights]
        
        # 随机选择
        rand = random.random()
        cumulative_weight = 0
        
        for i, weight in enumerate(normalized_weights):
            cumulative_weight += weight
            if rand <= cumulative_weight:
                return symbols[i]
        
        # 如果没有选中，返回最后一个
        return symbols[-1]

    def _check_winning_lines(self, template: SlotMachineTemplate, reels_result: List[List[str]], bet_lines: int) -> Tuple[List[Dict[str, Any]], int]:
        """检查中奖线"""
        winning_lines = []
        total_win = 0

        # 检查前bet_lines条支付线
        for i in range(min(bet_lines, len(template.paylines))):
            payline = template.paylines[i]
            line_symbols = []

            # 获取支付线上的符号
            for reel_idx, position_idx in payline.positions:
                if reel_idx < len(reels_result) and position_idx < len(reels_result[reel_idx]):
                    line_symbols.append(reels_result[reel_idx][position_idx])

            # 检查这条线是否中奖
            win_info = self._check_line_win(template, line_symbols)
            if win_info["win_amount"] > 0:
                winning_line = {
                    "payline_id": payline.id,
                    "payline_name": payline.name,
                    "symbols": line_symbols,
                    "win_symbol": win_info["symbol"],
                    "symbol_count": win_info["count"],
                    "multiplier": win_info["multiplier"],
                    "win_amount": win_info["win_amount"]
                }
                winning_lines.append(winning_line)
                total_win += win_info["win_amount"]

        return winning_lines, total_win

    def _check_line_win(self, template: SlotMachineTemplate, line_symbols: List[str]) -> Dict[str, Any]:
        """检查单条线的中奖情况"""
        if not line_symbols:
            return {"symbol": "", "count": 0, "multiplier": 0, "win_amount": 0}

        # 处理Wild符号（如果有）
        wild_symbol = template.special_features.get("wild_symbol")
        processed_symbols = line_symbols.copy()

        if wild_symbol:
            # 简单的Wild处理：将Wild替换为最常见的符号
            non_wild_symbols = [s for s in line_symbols if s != wild_symbol]
            if non_wild_symbols:
                most_common = max(set(non_wild_symbols), key=non_wild_symbols.count)
                processed_symbols = [most_common if s == wild_symbol else s for s in line_symbols]

        # 从左到右检查连续相同符号
        if not processed_symbols:
            return {"symbol": "", "count": 0, "multiplier": 0, "win_amount": 0}

        first_symbol = processed_symbols[0]
        consecutive_count = 1

        for i in range(1, len(processed_symbols)):
            if processed_symbols[i] == first_symbol:
                consecutive_count += 1
            else:
                break

        # 检查支付表
        if first_symbol in template.paytable and consecutive_count >= 2:
            symbol_payouts = template.paytable[first_symbol]

            # 找到匹配的支付项
            for payout in symbol_payouts:
                if payout["count"] == consecutive_count:
                    win_amount = template.cost * payout["multiplier"]
                    return {
                        "symbol": first_symbol,
                        "count": consecutive_count,
                        "multiplier": payout["multiplier"],
                        "win_amount": win_amount
                    }

        return {"symbol": "", "count": 0, "multiplier": 0, "win_amount": 0}

    def get_templates(self) -> List[Dict[str, Any]]:
        """获取所有模板信息"""
        return [
            {
                "id": template.id,
                "name": template.name,
                "machine_type": template.machine_type.value,
                "cost": template.cost,
                "theme": template.theme,
                "reels_count": template.reels_count,
                "positions_per_reel": template.positions_per_reel,
                "paylines_count": len(template.paylines),
                "symbols": [
                    {
                        "id": symbol.id,
                        "name": symbol.name,
                        "icon": symbol.icon,
                        "value": symbol.value
                    }
                    for symbol in template.symbols
                ],
                "paytable": template.paytable,
                "special_features": template.special_features
            }
            for template in self.templates.values()
        ]

    def get_symbol_info(self, template_id: str, symbol_id: str) -> Optional[Dict[str, Any]]:
        """获取符号信息"""
        if template_id not in self.templates:
            return None

        template = self.templates[template_id]
        for symbol in template.symbols:
            if symbol.id == symbol_id:
                return {
                    "id": symbol.id,
                    "name": symbol.name,
                    "icon": symbol.icon,
                    "value": symbol.value,
                    "rarity": symbol.rarity
                }

        return None


# 全局游戏实例
slot_machine_game = SlotMachineGame()
