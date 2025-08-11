"""
游戏相关API接口
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from ..database import get_db
from ..core.deps import get_current_user
from ..models.user import User
from ..models.game import GameRecord
from ..games import (
    scratch_card_game, 
    slot_machine_game, 
    wheel_fortune_game,
    ScratchCardType,
    SlotMachineType,
    WheelType
)
from ..schemas.game import (
    GameTemplateResponse,
    ScratchCardPlayRequest,
    ScratchCardPlayResponse,
    SlotMachinePlayRequest, 
    SlotMachinePlayResponse,
    WheelFortunePlayRequest,
    WheelFortunePlayResponse,
    GameHistoryResponse
)

router = APIRouter()


@router.get("/scratch-card/templates", response_model=List[GameTemplateResponse])
async def get_scratch_card_templates():
    """获取刮刮乐模板列表"""
    templates = scratch_card_game.get_templates()
    return [
        GameTemplateResponse(
            id=template["id"],
            name=template["name"],
            game_type="scratch_card",
            cost=template["cost"],
            theme=template["theme"],
            description=template["rules"]["description"],
            features=template
        )
        for template in templates
    ]


@router.post("/scratch-card/play", response_model=ScratchCardPlayResponse)
async def play_scratch_card(
    request: ScratchCardPlayRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """玩刮刮乐游戏"""
    try:
        # 检查用户积分是否足够
        template_info = next(
            (t for t in scratch_card_game.get_templates() if t["id"] == request.template_id), 
            None
        )
        if not template_info:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="模板不存在"
            )
        
        if current_user.credits < template_info["cost"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="积分不足"
            )
        
        # 创建刮刮乐卡片
        card_data = scratch_card_game.create_card(request.template_id, current_user.id)

        # 添加调试信息
        print(f"=== 后端生成的卡片数据 ===")
        print(f"is_winner: {card_data.get('is_winner')}")
        print(f"prize_info: {card_data.get('prize_info')}")
        print(f"完整card_data: {card_data}")
        
        # 记录游戏前的金额
        credits_before = current_user.credits

        # 计算游戏后的金额
        credits_after = current_user.credits - template_info["cost"]
        if card_data["is_winner"]:
            credits_after += card_data["prize_info"]["credits"]

        # 更新用户金额
        db.query(User).filter(User.id == current_user.id).update({
            "credits": credits_after
        })

        # 记录游戏结果
        game_record = GameRecord(
            user_id=current_user.id,
            game_type="scratch_card",
            template_id=request.template_id,
            game_cost=template_info["cost"],
            game_result=card_data,
            prize_name=card_data["prize_info"]["name"] if card_data["is_winner"] else "谢谢参与",
            prize_credits=card_data["prize_info"]["credits"] if card_data["is_winner"] else 0,
            is_winner=card_data["is_winner"],
            credits_before=credits_before,
            credits_after=credits_after
        )
        db.add(game_record)
        db.commit()

        # 更新当前用户对象的积分
        current_user.credits = credits_after
        
        return ScratchCardPlayResponse(
            success=True,
            card_data=card_data,
            user_credits=current_user.credits,
            game_record_id=game_record.id
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"游戏失败: {str(e)}"
        )


@router.post("/scratch-card/scratch", response_model=Dict[str, Any])
async def scratch_area(
    card_data: Dict[str, Any],
    area_id: int,
    current_user: User = Depends(get_current_user)
):
    """刮开指定区域"""
    try:
        updated_card = scratch_card_game.scratch_area(card_data, area_id)
        return {
            "success": True,
            "card_data": updated_card
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"刮奖失败: {str(e)}"
        )


@router.get("/slot-machine/templates", response_model=List[GameTemplateResponse])
async def get_slot_machine_templates():
    """获取老虎机模板列表"""
    templates = slot_machine_game.get_templates()
    return [
        GameTemplateResponse(
            id=template["id"],
            name=template["name"],
            game_type="slot_machine",
            cost=template["cost"],
            theme=template["theme"],
            description=f"{template['reels_count']}轮老虎机，{template['paylines_count']}条支付线",
            features=template
        )
        for template in templates
    ]


@router.post("/slot-machine/play", response_model=SlotMachinePlayResponse)
async def play_slot_machine(
    request: SlotMachinePlayRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """玩老虎机游戏"""
    try:
        # 检查模板是否存在
        template_info = next(
            (t for t in slot_machine_game.get_templates() if t["id"] == request.template_id), 
            None
        )
        if not template_info:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="模板不存在"
            )
        
        # 计算总成本
        bet_lines = request.bet_lines or template_info["paylines_count"]
        total_cost = template_info["cost"] * bet_lines
        
        if current_user.credits < total_cost:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="积分不足"
            )
        
        # 转动老虎机
        result = slot_machine_game.spin(request.template_id, current_user.id, bet_lines)
        
        # 更新用户积分
        current_user.credits -= total_cost
        if result["total_win"] > 0:
            current_user.credits += result["total_win"]
        
        # 记录游戏结果
        game_record = GameRecord(
            user_id=current_user.id,
            game_type="slot_machine",
            template_id=request.template_id,
            game_cost=total_cost,
            game_result=result,
            prize_name=f"老虎机奖励" if result["is_winner"] else "未中奖",
            prize_credits=result["total_win"],
            is_winner=result["is_winner"],
            credits_before=current_user.credits + total_cost,
            credits_after=current_user.credits
        )
        db.add(game_record)
        db.commit()
        db.refresh(current_user)
        
        return SlotMachinePlayResponse(
            success=True,
            result=result,
            user_credits=current_user.credits,
            game_record_id=game_record.id
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"游戏失败: {str(e)}"
        )


@router.get("/wheel-fortune/templates", response_model=List[GameTemplateResponse])
async def get_wheel_fortune_templates():
    """获取幸运大转盘模板列表"""
    templates = wheel_fortune_game.get_templates()
    return [
        GameTemplateResponse(
            id=template["id"],
            name=template["name"],
            game_type="wheel_fortune",
            cost=template["cost"],
            theme=template["theme"],
            description=f"幸运转盘，{len(template['segments'])}个扇形区域",
            features=template
        )
        for template in templates
    ]


@router.post("/wheel-fortune/play", response_model=WheelFortunePlayResponse)
async def play_wheel_fortune(
    request: WheelFortunePlayRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """玩幸运大转盘游戏"""
    try:
        # 检查模板是否存在
        template_info = next(
            (t for t in wheel_fortune_game.get_templates() if t["id"] == request.template_id), 
            None
        )
        if not template_info:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="模板不存在"
            )
        
        if current_user.credits < template_info["cost"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="积分不足"
            )
        
        # 转动转盘
        result = wheel_fortune_game.spin(request.template_id, current_user.id)
        
        # 处理特殊效果
        final_credits = result["winning_segment"]["credits"]
        if result["special_effects"].get("double_reward"):
            final_credits *= 2
        if result["special_effects"].get("lucky_multiplier"):
            final_credits *= result["special_effects"]["lucky_multiplier"]
        if result["special_effects"].get("bankruptcy_protection") and final_credits < 0:
            final_credits = 0
        
        # 更新用户金额
        current_user.credits -= template_info["cost"]
        if final_credits > 0:
            current_user.credits += final_credits
        
        # 更新结果中的最终奖励
        result["final_credits"] = final_credits
        result["net_win"] = final_credits - template_info["cost"]
        
        # 记录游戏结果
        game_record = GameRecord(
            user_id=current_user.id,
            game_type="wheel_fortune",
            template_id=request.template_id,
            game_cost=template_info["cost"],
            game_result=result,
            prize_name=result["winning_segment"]["name"] if result["is_winner"] else "未中奖",
            prize_credits=final_credits,
            is_winner=result["is_winner"],
            credits_before=current_user.credits + template_info["cost"],
            credits_after=current_user.credits
        )
        db.add(game_record)
        db.commit()
        db.refresh(current_user)
        
        return WheelFortunePlayResponse(
            success=True,
            result=result,
            user_credits=current_user.credits,
            game_record_id=game_record.id
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"游戏失败: {str(e)}"
        )


@router.get("/history", response_model=List[GameHistoryResponse])
async def get_game_history(
    limit: int = 20,
    offset: int = 0,
    game_type: str = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取游戏历史记录"""
    query = db.query(GameRecord).filter(GameRecord.user_id == current_user.id)
    
    if game_type:
        query = query.filter(GameRecord.game_type == game_type)
    
    records = query.order_by(GameRecord.created_at.desc()).offset(offset).limit(limit).all()
    
    return [
        GameHistoryResponse(
            id=record.id,
            game_type=record.game_type,
            template_id=record.template_id,
            bet_amount=record.game_cost,
            win_amount=record.prize_credits,
            net_win=record.prize_credits - record.game_cost,
            created_at=record.created_at,
            result_data=record.game_result
        )
        for record in records
    ]
