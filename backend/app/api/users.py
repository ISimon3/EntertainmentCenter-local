"""
用户管理API路由
"""
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from ..core.deps import get_db, get_current_admin_user
from ..models.user import User
from ..schemas.auth import UserResponse, UserCreate, UserUpdate
from ..core.security import get_password_hash

router = APIRouter()


@router.get("/", response_model=List[UserResponse], summary="获取用户列表")
def get_users(
    skip: int = Query(0, ge=0, description="跳过的记录数"),
    limit: int = Query(100, ge=1, le=1000, description="返回的记录数"),
    search: Optional[str] = Query(None, description="搜索关键词"),
    is_active: Optional[bool] = Query(None, description="是否激活"),
    is_admin: Optional[bool] = Query(None, description="是否管理员"),
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
) -> Any:
    """
    获取用户列表（管理员权限）
    """
    query = db.query(User)
    
    # 搜索过滤
    if search:
        query = query.filter(
            or_(
                User.username.contains(search),
                User.email.contains(search),
                User.full_name.contains(search)
            )
        )
    
    # 状态过滤
    if is_active is not None:
        query = query.filter(User.is_active == is_active)
    
    if is_admin is not None:
        query = query.filter(User.is_admin == is_admin)
    
    # 分页
    users = query.offset(skip).limit(limit).all()
    
    return users


@router.get("/{user_id}", response_model=UserResponse, summary="获取用户详情")
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
) -> Any:
    """
    获取指定用户详情（管理员权限）
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在"
        )
    
    return user


@router.post("/", response_model=UserResponse, summary="创建用户")
def create_user(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
) -> Any:
    """
    创建新用户（管理员权限）
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
        credits=1000  # 默认金额
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return user


@router.put("/{user_id}", response_model=UserResponse, summary="更新用户信息")
def update_user(
    user_id: int,
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
) -> Any:
    """
    更新用户信息（管理员权限）
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在"
        )
    
    # 更新用户信息
    if user_update.full_name is not None:
        user.full_name = user_update.full_name
    if user_update.avatar_url is not None:
        user.avatar_url = user_update.avatar_url
    if user_update.bio is not None:
        user.bio = user_update.bio
    
    db.commit()
    db.refresh(user)
    
    return user


@router.patch("/{user_id}/status", response_model=UserResponse, summary="更新用户状态")
def update_user_status(
    user_id: int,
    is_active: bool,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
) -> Any:
    """
    更新用户激活状态（管理员权限）
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在"
        )
    
    # 不能禁用自己
    if user.id == current_admin.id and not is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="不能禁用自己的账户"
        )
    
    user.is_active = is_active
    db.commit()
    db.refresh(user)
    
    return user


@router.patch("/{user_id}/admin", response_model=UserResponse, summary="更新管理员权限")
def update_user_admin_status(
    user_id: int,
    is_admin: bool,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
) -> Any:
    """
    更新用户管理员权限（管理员权限）
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在"
        )
    
    # 不能取消自己的管理员权限
    if user.id == current_admin.id and not is_admin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="不能取消自己的管理员权限"
        )
    
    user.is_admin = is_admin
    db.commit()
    db.refresh(user)
    
    return user


@router.patch("/{user_id}/credits", response_model=UserResponse, summary="调整用户金额")
def adjust_user_credits(
    user_id: int,
    credits_change: int,
    reason: str = "管理员调整",
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
) -> Any:
    """
    调整用户金额（管理员权限）
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在"
        )
    
    # 检查金额调整后是否为负数
    new_credits = user.credits + credits_change
    if new_credits < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="金额不足，无法扣除"
        )
    
    user.credits = new_credits
    db.commit()
    db.refresh(user)
    
    # TODO: 记录金额变动日志
    
    return user


@router.delete("/{user_id}", summary="删除用户")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
) -> Any:
    """
    删除用户（管理员权限）
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在"
        )
    
    # 不能删除自己
    if user.id == current_admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="不能删除自己的账户"
        )
    
    db.delete(user)
    db.commit()
    
    return {"message": "用户删除成功"}
