# 数据库设计文档

## 📊 数据库概述

娱乐中心系统使用SQLite数据库，位于项目根目录的 `database/entertainment.db`。

### 数据库位置说明
```
EntertainmentCenter-local/
├── database/               # ✅ 正确的数据库位置
│   └── entertainment.db   # 系统使用的唯一数据库文件
└── backend/
    └── app/
        └── config.py      # 配置: sqlite:///./database/entertainment.db
```

## 🗃️ 数据表结构

### 1. users - 用户表
存储用户基本信息和积分。

```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    is_active BOOLEAN DEFAULT 1,
    is_admin BOOLEAN DEFAULT 0,
    credits INTEGER DEFAULT 1000,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**字段说明：**
- `id`: 用户唯一标识
- `username`: 用户名（唯一）
- `email`: 邮箱地址（唯一）
- `hashed_password`: 加密后的密码
- `full_name`: 用户全名
- `is_active`: 账户是否激活
- `is_admin`: 是否为管理员
- `credits`: 用户积分余额
- `created_at`: 创建时间
- `updated_at`: 更新时间

### 2. game_records - 游戏记录表
存储所有游戏的详细记录。

```sql
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
```

**字段说明：**
- `id`: 记录唯一标识
- `user_id`: 用户ID（外键）
- `game_type`: 游戏类型（scratch_card, slot_machine, wheel_fortune）
- `template_id`: 游戏模板ID
- `game_cost`: 游戏消耗的积分
- `game_result`: 游戏结果详情（JSON格式）
- `prize_name`: 奖品名称
- `prize_credits`: 获得的积分
- `is_winner`: 是否中奖
- `credits_before`: 游戏前积分
- `credits_after`: 游戏后积分
- `created_at`: 游戏时间

### 3. prizes - 奖品配置表
存储各种游戏的奖品配置。

```sql
CREATE TABLE prizes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    game_type VARCHAR(50) NOT NULL,
    credits_value INTEGER NOT NULL,
    probability REAL NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    display_order INTEGER DEFAULT 0,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**字段说明：**
- `id`: 奖品唯一标识
- `name`: 奖品名称
- `game_type`: 适用的游戏类型
- `credits_value`: 奖品积分价值
- `probability`: 中奖概率（0-1之间）
- `is_active`: 是否启用
- `display_order`: 显示顺序
- `description`: 奖品描述
- `created_at`: 创建时间

### 4. prize_histories - 奖品历史表
记录用户获得奖品的历史。

```sql
CREATE TABLE prize_histories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    prize_id INTEGER NOT NULL,
    game_record_id INTEGER NOT NULL,
    claimed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (prize_id) REFERENCES prizes (id),
    FOREIGN KEY (game_record_id) REFERENCES game_records (id)
);
```

### 5. game_configs - 游戏配置表
存储各种游戏的配置参数。

```sql
CREATE TABLE game_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_type VARCHAR(50) UNIQUE NOT NULL,
    config_data JSON NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    description TEXT
);
```

**字段说明：**
- `id`: 配置唯一标识
- `game_type`: 游戏类型
- `config_data`: 配置数据（JSON格式）
- `is_active`: 是否启用
- `description`: 配置描述

### 6. admin_logs - 管理日志表
记录管理员操作日志。

```sql
CREATE TABLE admin_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_id INTEGER NOT NULL,
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50),
    target_id INTEGER,
    details JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES users (id)
);
```

### 7. system_stats - 系统统计表
存储系统运行统计数据。

```sql
CREATE TABLE system_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    stat_date DATE NOT NULL,
    total_users INTEGER DEFAULT 0,
    active_users INTEGER DEFAULT 0,
    total_games INTEGER DEFAULT 0,
    total_revenue INTEGER DEFAULT 0,
    total_payout INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 🔧 数据库初始化

### 自动初始化流程
1. **检查表结构**: 启动时自动检查所有表是否存在必需字段
2. **修复表结构**: 如果发现缺失字段，自动添加或重建表
3. **创建默认数据**: 插入默认的奖品配置和游戏配置
4. **创建管理员**: 自动创建默认管理员账户

### 默认数据

#### 管理员账户
```sql
INSERT INTO users (username, email, hashed_password, full_name, is_admin, credits)
VALUES ('admin', 'admin@entertainment.com', '$hashed_password', '系统管理员', 1, 10000);
```

#### 刮刮乐奖品配置
```sql
INSERT INTO prizes (name, game_type, credits_value, probability) VALUES
('一等奖', 'scratch_card', 1000, 0.01),
('二等奖', 'scratch_card', 500, 0.05),
('三等奖', 'scratch_card', 100, 0.1),
('四等奖', 'scratch_card', 50, 0.2),
('谢谢参与', 'scratch_card', 0, 0.64);
```

#### 游戏配置
```sql
INSERT INTO game_configs (game_type, config_data) VALUES
('scratch_card', '{"cost": 10, "max_plays_per_day": 50}'),
('slot_machine', '{"cost": 20, "max_plays_per_day": 30}'),
('lucky_wheel', '{"cost": 15, "max_plays_per_day": 40}');
```

## 📈 数据库维护

### 备份数据库
```bash
# 复制数据库文件
cp database/entertainment.db database/entertainment_backup_$(date +%Y%m%d).db
```

### 查看数据库信息
```bash
# 使用SQLite命令行工具
sqlite3 database/entertainment.db

# 查看所有表
.tables

# 查看表结构
.schema game_records

# 查看数据
SELECT * FROM users LIMIT 5;
```

### 重置数据库
```bash
# 删除数据库文件（谨慎操作！）
rm database/entertainment.db

# 重新启动应用，会自动创建新的数据库
cd backend
python run.py
```

## 🔍 常用查询

### 用户统计
```sql
-- 查看用户总数
SELECT COUNT(*) as total_users FROM users;

-- 查看活跃用户
SELECT COUNT(*) as active_users FROM users WHERE is_active = 1;

-- 查看金额排行榜
SELECT username, credits FROM users ORDER BY credits DESC LIMIT 10;
```

### 游戏统计
```sql
-- 查看游戏总数
SELECT COUNT(*) as total_games FROM game_records;

-- 查看各游戏类型统计
SELECT game_type, COUNT(*) as game_count, SUM(game_cost) as total_cost
FROM game_records GROUP BY game_type;

-- 查看中奖率
SELECT game_type, 
       COUNT(*) as total_games,
       SUM(CASE WHEN is_winner = 1 THEN 1 ELSE 0 END) as wins,
       ROUND(SUM(CASE WHEN is_winner = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as win_rate
FROM game_records GROUP BY game_type;
```

### 收入统计
```sql
-- 查看总收入和支出
SELECT 
    SUM(game_cost) as total_revenue,
    SUM(prize_credits) as total_payout,
    SUM(game_cost) - SUM(prize_credits) as profit
FROM game_records;

-- 查看每日收入
SELECT 
    DATE(created_at) as game_date,
    COUNT(*) as games_played,
    SUM(game_cost) as daily_revenue,
    SUM(prize_credits) as daily_payout
FROM game_records 
GROUP BY DATE(created_at)
ORDER BY game_date DESC;
```

## ⚠️ 注意事项

1. **数据库位置**: 确保始终使用项目根目录的 `database/entertainment.db`
2. **备份策略**: 定期备份数据库文件，特别是在生产环境
3. **性能优化**: 大量数据时考虑添加索引
4. **数据完整性**: 重要操作前先备份数据
5. **权限控制**: 生产环境中限制数据库文件的访问权限

## 🔄 数据库迁移

如需迁移到其他数据库（如PostgreSQL、MySQL），可以：

1. 导出SQLite数据
2. 修改 `backend/app/config.py` 中的数据库URL
3. 安装相应的数据库驱动
4. 重新运行初始化脚本
