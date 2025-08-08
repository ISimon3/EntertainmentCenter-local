"""
数据库初始化工具
"""
from sqlalchemy.orm import Session
from ..database import engine, SessionLocal, create_tables
from ..models import User, Prize, GameConfig
from ..core.security import get_password_hash
from ..config import settings
import logging

logger = logging.getLogger(__name__)


def init_database():
    """初始化数据库"""
    try:
        # 先修复数据库表结构
        fix_database_schema()

        # 创建所有表
        create_tables()
        logger.info("数据库表创建成功")

        # 创建初始数据
        db = SessionLocal()
        try:
            create_admin_user(db)
            create_default_prizes(db)
            create_game_configs(db)
            logger.info("初始数据创建成功")
        finally:
            db.close()

    except Exception as e:
        logger.error(f"数据库初始化失败: {e}")
        raise


def fix_database_schema():
    """修复数据库表结构"""
    import sqlite3
    from pathlib import Path

    # 数据库文件路径 - 项目根目录的database文件夹
    db_path = Path(__file__).parent.parent.parent.parent / "database" / "entertainment.db"

    try:
        conn = sqlite3.connect(str(db_path))
        cursor = conn.cursor()

        logger.info("检查并修复数据库表结构...")

        # 检查 game_records 表是否存在
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='game_records';")
        table_exists = cursor.fetchone()

        if table_exists:
            # 检查 game_records 表字段
            cursor.execute("PRAGMA table_info(game_records);")
            columns = cursor.fetchall()
            column_names = [col[1] for col in columns]

            # 检查必需字段是否存在
            required_fields = ['template_id', 'game_result', 'prize_name']
            missing_fields = [field for field in required_fields if field not in column_names]

            if missing_fields:
                logger.info(f"发现缺失字段: {missing_fields}，重新创建表...")

                # 备份现有数据
                cursor.execute("SELECT * FROM game_records;")
                existing_data = cursor.fetchall()

                # 删除旧表
                cursor.execute("DROP TABLE IF EXISTS game_records_old;")
                cursor.execute("ALTER TABLE game_records RENAME TO game_records_old;")

                # 创建新表
                cursor.execute("""
                CREATE TABLE game_records (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    game_type VARCHAR(50) NOT NULL,
                    template_id VARCHAR(50) NOT NULL,
                    game_cost INTEGER NOT NULL,
                    game_result JSON NOT NULL,
                    prize_name VARCHAR(100),
                    prize_credits INTEGER DEFAULT 0,
                    is_winner BOOLEAN DEFAULT 0,
                    credits_before INTEGER NOT NULL,
                    credits_after INTEGER NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id)
                );
                """)

                # 迁移数据（如果有的话）
                if existing_data:
                    for row in existing_data:
                        values = list(row)
                        if len(values) < 12:
                            while len(values) < 12:
                                values.append(None)

                        if values[3] is None:  # template_id
                            values[3] = 'default_template'
                        if values[5] is None:  # game_result
                            values[5] = '{}'

                        cursor.execute("""
                        INSERT INTO game_records
                        (id, user_id, game_type, template_id, game_cost, game_result,
                         prize_name, prize_credits, is_winner, credits_before, credits_after, created_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """, values)

                # 删除备份表
                cursor.execute("DROP TABLE IF EXISTS game_records_old;")
                logger.info("表结构修复完成")
            else:
                logger.info("表结构正常，无需修复")

        conn.commit()
        conn.close()

    except Exception as e:
        logger.error(f"修复数据库表结构失败: {e}")
        # 不抛出异常，让应用继续启动


def create_admin_user(db: Session):
    """创建默认管理员用户"""
    admin_user = db.query(User).filter(User.username == "admin").first()
    if not admin_user:
        admin_user = User(
            username="admin",
            email="admin@entertainment.com",
            hashed_password=get_password_hash("admin123"),
            full_name="系统管理员",
            is_admin=True,
            credits=10000
        )
        db.add(admin_user)
        db.commit()
        logger.info("默认管理员用户创建成功")


def create_default_prizes(db: Session):
    """创建默认奖品"""
    # 刮刮乐奖品
    scratch_prizes = [
        {"name": "一等奖", "credits_value": 1000, "probability": 0.01},
        {"name": "二等奖", "credits_value": 500, "probability": 0.05},
        {"name": "三等奖", "credits_value": 100, "probability": 0.1},
        {"name": "四等奖", "credits_value": 50, "probability": 0.2},
        {"name": "谢谢参与", "credits_value": 0, "probability": 0.64}
    ]
    
    for i, prize_data in enumerate(scratch_prizes):
        existing_prize = db.query(Prize).filter(
            Prize.name == prize_data["name"],
            Prize.game_type == "scratch_card"
        ).first()
        
        if not existing_prize:
            prize = Prize(
                name=prize_data["name"],
                game_type="scratch_card",
                credits_value=prize_data["credits_value"],
                probability=prize_data["probability"],
                display_order=i
            )
            db.add(prize)
    
    # 老虎机奖品
    slot_prizes = [
        {"name": "超级大奖", "credits_value": 5000, "probability": 0.001},
        {"name": "大奖", "credits_value": 1000, "probability": 0.01},
        {"name": "中奖", "credits_value": 200, "probability": 0.05},
        {"name": "小奖", "credits_value": 50, "probability": 0.15},
        {"name": "未中奖", "credits_value": 0, "probability": 0.789}
    ]
    
    for i, prize_data in enumerate(slot_prizes):
        existing_prize = db.query(Prize).filter(
            Prize.name == prize_data["name"],
            Prize.game_type == "slot_machine"
        ).first()
        
        if not existing_prize:
            prize = Prize(
                name=prize_data["name"],
                game_type="slot_machine",
                credits_value=prize_data["credits_value"],
                probability=prize_data["probability"],
                display_order=i
            )
            db.add(prize)
    
    # 幸运大转盘奖品
    wheel_prizes = [
        {"name": "特等奖", "credits_value": 2000, "probability": 0.02},
        {"name": "一等奖", "credits_value": 800, "probability": 0.08},
        {"name": "二等奖", "credits_value": 300, "probability": 0.15},
        {"name": "三等奖", "credits_value": 100, "probability": 0.25},
        {"name": "安慰奖", "credits_value": 20, "probability": 0.5}
    ]
    
    for i, prize_data in enumerate(wheel_prizes):
        existing_prize = db.query(Prize).filter(
            Prize.name == prize_data["name"],
            Prize.game_type == "lucky_wheel"
        ).first()
        
        if not existing_prize:
            prize = Prize(
                name=prize_data["name"],
                game_type="lucky_wheel",
                credits_value=prize_data["credits_value"],
                probability=prize_data["probability"],
                display_order=i
            )
            db.add(prize)
    
    db.commit()
    logger.info("默认奖品创建成功")


def create_game_configs(db: Session):
    """创建游戏配置"""
    game_configs = [
        {
            "game_type": "scratch_card",
            "config_data": {
                "cost": settings.scratch_card_cost,
                "max_plays_per_day": 50,
                "description": "刮刮乐游戏"
            }
        },
        {
            "game_type": "slot_machine", 
            "config_data": {
                "cost": settings.slot_machine_cost,
                "symbols": settings.slot_machine_symbols,
                "reels": 3,
                "max_plays_per_day": 30,
                "description": "老虎机游戏"
            }
        },
        {
            "game_type": "lucky_wheel",
            "config_data": {
                "cost": settings.lucky_wheel_cost,
                "sectors": 8,
                "max_plays_per_day": 40,
                "description": "幸运大转盘游戏"
            }
        }
    ]
    
    for config_data in game_configs:
        existing_config = db.query(GameConfig).filter(
            GameConfig.game_type == config_data["game_type"]
        ).first()
        
        if not existing_config:
            config = GameConfig(
                game_type=config_data["game_type"],
                config_data=config_data["config_data"],
                description=config_data["config_data"]["description"]
            )
            db.add(config)
    
    db.commit()
    logger.info("游戏配置创建成功")


if __name__ == "__main__":
    init_database()
