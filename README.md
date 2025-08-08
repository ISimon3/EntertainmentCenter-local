# 娱乐中心系统

一个基于FastAPI + HTML/CSS/JavaScript的在线娱乐游戏平台，提供刮刮乐、老虎机、幸运大转盘等多种游戏。

## 🎮 功能特性

- **多种游戏类型**：刮刮乐、老虎机、幸运大转盘
- **用户系统**：注册、登录、积分管理
- **游戏记录**：完整的游戏历史和统计
- **管理后台**：游戏配置、用户管理、数据统计
- **响应式设计**：支持桌面和移动设备

## 📁 项目结构

```
EntertainmentCenter-local/
├── backend/                 # 后端API服务
│   ├── app/                # FastAPI应用
│   │   ├── api/           # API路由
│   │   ├── core/          # 核心功能（认证、安全等）
│   │   ├── games/         # 游戏逻辑
│   │   ├── models/        # 数据库模型
│   │   ├── schemas/       # Pydantic模式
│   │   └── utils/         # 工具函数
│   ├── requirements.txt   # Python依赖
│   └── run.py            # 启动脚本
├── frontend/               # 前端界面
│   ├── client/           # 用户端界面
│   ├── admin/            # 管理端界面
│   ├── css/              # 样式文件
│   ├── js/               # JavaScript文件
│   └── index.html        # 主页面
├── database/               # 数据库文件（项目统一使用此目录）
│   └── entertainment.db   # SQLite数据库
└── docs/                  # 项目文档
```

## 🚀 快速启动

### 环境要求
- Python 3.8+
- 现代浏览器（Chrome、Firefox、Safari、Edge）

### 1. 安装依赖
```bash
cd backend
pip install -r requirements.txt
```

### 2. 启动后端服务
```bash
cd backend
python run.py
```
后端服务将在 http://localhost:8000 启动

### 3. 打开前端界面
用浏览器打开 `frontend/index.html`

## 🎯 默认账户

系统会自动创建管理员账户：
- **用户名**: admin
- **密码**: admin123  
- **初始积分**: 10000

## 🎲 游戏介绍

### 刮刮乐游戏
- **福利彩票刮刮乐**：费用10积分，直接奖金玩法
- **新年福运刮刮乐**：费用15积分，符号匹配玩法
- **幸运符号刮刮乐**：费用20积分，幸运符号玩法

### 老虎机游戏
- 多种符号组合
- 支付线系统
- 累积奖池

### 幸运大转盘
- 8个奖励扇区
- 不同概率设置
- 动画转盘效果

## 📊 数据库说明

### 重要：数据库位置统一
项目使用 **项目根目录** 下的 `database/entertainment.db` 作为唯一数据库文件。

```
EntertainmentCenter-local/
├── database/               # ✅ 正确的数据库位置
│   └── entertainment.db   # 系统使用的数据库文件
└── backend/
    └── (不再包含database目录)  # ❌ 已清理
```

### 主要数据表：
- **users**: 用户信息
- **game_records**: 游戏记录
- **prizes**: 奖品配置
- **game_configs**: 游戏配置
- **admin_logs**: 管理日志

### 数据库初始化
首次启动时会自动：
1. 检查并修复数据库表结构
2. 创建所有必需的数据表
3. 插入默认配置数据
4. 创建管理员账户

## 🔧 API文档

启动后端服务后，可以访问：
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### 主要API端点：
- `/api/auth/*` - 用户认证
- `/api/games/*` - 游戏相关
- `/api/users/*` - 用户管理
- `/api/stats/*` - 数据统计
- `/api/admin/*` - 管理功能

## 🛠️ 开发说明

### 后端技术栈
- **FastAPI**: Web框架
- **SQLAlchemy**: ORM
- **SQLite**: 数据库
- **Pydantic**: 数据验证
- **JWT**: 身份认证

### 前端技术栈
- **HTML5/CSS3**: 页面结构和样式
- **JavaScript (ES6+)**: 交互逻辑
- **Canvas API**: 刮刮乐效果
- **CSS动画**: 游戏动效

### 添加新游戏
1. 在 `backend/app/games/` 创建游戏逻辑
2. 在 `backend/app/api/games.py` 添加API端点
3. 在 `frontend/js/` 添加前端逻辑
4. 更新游戏配置和奖品设置

## 🔒 安全特性

- JWT令牌认证
- 密码哈希存储
- CORS跨域保护
- SQL注入防护
- 输入数据验证

## 🧪 测试游戏功能

### 快速测试脚本
```python
# 创建 test_games.py
import requests

BASE_URL = "http://localhost:8000"

# 1. 登录获取token
login_response = requests.post(f"{BASE_URL}/api/auth/login", 
                              data={"username": "admin", "password": "admin123"})
token = login_response.json()["access_token"]

# 2. 测试刮刮乐
headers = {"Authorization": f"Bearer {token}"}
game_response = requests.post(f"{BASE_URL}/api/games/scratch-card/play",
                             json={"template_id": "welfare_lottery"}, 
                             headers=headers)
print("游戏结果:", game_response.json())
```

## 📝 更新日志

### v1.0.0 (2025-08-08)
- ✅ 修复游戏数据库表结构问题
- ✅ 统一数据库文件位置到项目根目录
- ✅ 清理重复和临时文件
- ✅ 完善项目文档和说明
- ✅ 优化数据库初始化逻辑

## 🚨 注意事项

1. **数据库位置**: 确保使用项目根目录的 `database/entertainment.db`
2. **首次启动**: 系统会自动检查和修复数据库表结构
3. **生产环境**: 请修改JWT密钥和数据库配置
4. **CORS设置**: 生产环境请配置具体的允许域名

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情
