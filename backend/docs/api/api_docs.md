# 娱乐中心系统API

版本: 1.0.0


        ## 娱乐中心系统API文档
        
        这是一个基于FastAPI的娱乐中心系统，提供以下功能：
        
        ### 🎮 游戏模块
        - **刮刮乐游戏**: 多种主题的刮刮乐游戏
        - **老虎机游戏**: 经典和现代老虎机
        - **幸运大转盘**: 多种类型的转盘游戏
        
        ### 👤 用户管理
        - 用户注册和登录
        - 积分管理
        - 游戏历史记录
        
        ### 📊 数据统计
        - 用户游戏统计
        - 排行榜系统
        - 实时游戏状态
        
        ### 🔧 管理后台
        - 用户管理
        - 游戏配置
        - 数据分析
        
        ### 🔐 认证方式
        使用JWT Bearer Token进行认证。在请求头中添加：
        ```
        Authorization: Bearer <your_token>
        ```
        
        ### 📱 响应格式
        所有API响应都采用JSON格式，错误响应包含以下字段：
        - `error`: 是否为错误
        - `message`: 错误消息
        - `status_code`: HTTP状态码
        

## API接口列表

### 根路由

#### GET /

**描述**: Root

根路由

**响应**:

- `200`: Successful Response

---

### 健康检查

#### GET /health

**描述**: Health Check

健康检查

**响应**:

- `200`: Successful Response

---

### 认证

#### POST /api/auth/register

**描述**: 用户注册

用户注册

**响应**:

- `200`: Successful Response
- `422`: Validation Error

---

#### POST /api/auth/login

**描述**: 用户登录

用户登录

**响应**:

- `200`: Successful Response
- `422`: Validation Error

---

#### POST /api/auth/login-json

**描述**: JSON格式登录

JSON格式用户登录

**响应**:

- `200`: Successful Response
- `422`: Validation Error

---

#### GET /api/auth/me

**描述**: 获取当前用户信息

获取当前用户信息

**响应**:

- `200`: Successful Response

---

#### PUT /api/auth/me

**描述**: 更新当前用户信息

更新当前用户信息

**响应**:

- `200`: Successful Response
- `422`: Validation Error

---

#### POST /api/auth/change-password

**描述**: 修改密码

修改密码

**响应**:

- `200`: Successful Response
- `422`: Validation Error

---

#### GET /api/auth/stats

**描述**: 获取用户游戏统计

获取用户游戏统计信息

**响应**:

- `200`: Successful Response

---

### 用户管理

#### GET /api/users/

**描述**: 获取用户列表

获取用户列表（管理员权限）

**参数**:

- `skip` (query) - 可选: 跳过的记录数
- `limit` (query) - 可选: 返回的记录数
- `search` (query) - 可选: 搜索关键词
- `is_active` (query) - 可选: 是否激活
- `is_admin` (query) - 可选: 是否管理员

**响应**:

- `200`: Successful Response
- `422`: Validation Error

---

#### POST /api/users/

**描述**: 创建用户

创建新用户（管理员权限）

**响应**:

- `200`: Successful Response
- `422`: Validation Error

---

#### GET /api/users/{user_id}

**描述**: 获取用户详情

获取指定用户详情（管理员权限）

**参数**:

- `user_id` (path) - 必需: 

**响应**:

- `200`: Successful Response
- `422`: Validation Error

---

#### PUT /api/users/{user_id}

**描述**: 更新用户信息

更新用户信息（管理员权限）

**参数**:

- `user_id` (path) - 必需: 

**响应**:

- `200`: Successful Response
- `422`: Validation Error

---

#### DELETE /api/users/{user_id}

**描述**: 删除用户

删除用户（管理员权限）

**参数**:

- `user_id` (path) - 必需: 

**响应**:

- `200`: Successful Response
- `422`: Validation Error

---

#### PATCH /api/users/{user_id}/status

**描述**: 更新用户状态

更新用户激活状态（管理员权限）

**参数**:

- `user_id` (path) - 必需: 
- `is_active` (query) - 必需: 

**响应**:

- `200`: Successful Response
- `422`: Validation Error

---

#### PATCH /api/users/{user_id}/admin

**描述**: 更新管理员权限

更新用户管理员权限（管理员权限）

**参数**:

- `user_id` (path) - 必需: 
- `is_admin` (query) - 必需: 

**响应**:

- `200`: Successful Response
- `422`: Validation Error

---

#### PATCH /api/users/{user_id}/credits

**描述**: 调整用户积分

调整用户积分（管理员权限）

**参数**:

- `user_id` (path) - 必需: 
- `credits_change` (query) - 必需: 
- `reason` (query) - 可选: 

**响应**:

- `200`: Successful Response
- `422`: Validation Error

---

### 游戏

#### GET /api/games/scratch-card/templates

**描述**: Get Scratch Card Templates

获取刮刮乐模板列表

**响应**:

- `200`: Successful Response

---

#### POST /api/games/scratch-card/play

**描述**: Play Scratch Card

玩刮刮乐游戏

**响应**:

- `200`: Successful Response
- `422`: Validation Error

---

#### POST /api/games/scratch-card/scratch

**描述**: Scratch Area

刮开指定区域

**参数**:

- `area_id` (query) - 必需: 

**响应**:

- `200`: Successful Response
- `422`: Validation Error

---

#### GET /api/games/slot-machine/templates

**描述**: Get Slot Machine Templates

获取老虎机模板列表

**响应**:

- `200`: Successful Response

---

#### POST /api/games/slot-machine/play

**描述**: Play Slot Machine

玩老虎机游戏

**响应**:

- `200`: Successful Response
- `422`: Validation Error

---

#### GET /api/games/wheel-fortune/templates

**描述**: Get Wheel Fortune Templates

获取幸运大转盘模板列表

**响应**:

- `200`: Successful Response

---

#### POST /api/games/wheel-fortune/play

**描述**: Play Wheel Fortune

玩幸运大转盘游戏

**响应**:

- `200`: Successful Response
- `422`: Validation Error

---

#### GET /api/games/history

**描述**: Get Game History

获取游戏历史记录

**参数**:

- `limit` (query) - 可选: 
- `offset` (query) - 可选: 
- `game_type` (query) - 可选: 

**响应**:

- `200`: Successful Response
- `422`: Validation Error

---

### 数据统计

#### GET /api/stats/user/stats

**描述**: Get User Stats

获取用户游戏统计

**响应**:

- `200`: Successful Response

---

#### GET /api/stats/leaderboard/credits

**描述**: Get Credits Leaderboard

获取积分排行榜

**参数**:

- `limit` (query) - 可选: 

**响应**:

- `200`: Successful Response
- `422`: Validation Error

---

#### GET /api/stats/leaderboard/total-win

**描述**: Get Total Win Leaderboard

获取总赢取排行榜

**参数**:

- `limit` (query) - 可选: 

**响应**:

- `200`: Successful Response
- `422`: Validation Error

---

#### GET /api/stats/leaderboard/win-rate

**描述**: Get Win Rate Leaderboard

获取胜率排行榜（需要最少游戏次数）

**参数**:

- `limit` (query) - 可选: 
- `min_games` (query) - 可选: 

**响应**:

- `200`: Successful Response
- `422`: Validation Error

---

#### GET /api/stats/analysis

**描述**: Get Game Analysis

获取游戏分析数据（需要管理员权限或自己的数据）

**参数**:

- `game_type` (query) - 可选: 
- `template_id` (query) - 可选: 
- `days` (query) - 可选: 

**响应**:

- `200`: Successful Response
- `422`: Validation Error

---

#### GET /api/stats/live-status

**描述**: Get Live Game Status

获取实时游戏状态

**响应**:

- `200`: Successful Response

---

### 管理后台

#### GET /api/admin/users

**描述**: Get All Users

获取所有用户列表

**参数**:

- `skip` (query) - 可选: 
- `limit` (query) - 可选: 
- `search` (query) - 可选: 
- `is_active` (query) - 可选: 

**响应**:

- `200`: Successful Response
- `422`: Validation Error

---

#### GET /api/admin/users/{user_id}

**描述**: Get User Detail

获取用户详细信息

**参数**:

- `user_id` (path) - 必需: 

**响应**:

- `200`: Successful Response
- `422`: Validation Error

---

#### PUT /api/admin/users/{user_id}/credits

**描述**: Update User Credits

更新用户积分

**参数**:

- `user_id` (path) - 必需: 
- `credits` (query) - 必需: 
- `reason` (query) - 必需: 

**响应**:

- `200`: Successful Response
- `422`: Validation Error

---

#### PUT /api/admin/users/{user_id}/status

**描述**: Update User Status

更新用户状态（启用/禁用）

**参数**:

- `user_id` (path) - 必需: 
- `is_active` (query) - 必需: 
- `reason` (query) - 必需: 

**响应**:

- `200`: Successful Response
- `422`: Validation Error

---

#### GET /api/admin/games/records

**描述**: Get Game Records

获取游戏记录

**参数**:

- `skip` (query) - 可选: 
- `limit` (query) - 可选: 
- `game_type` (query) - 可选: 
- `user_id` (query) - 可选: 
- `start_date` (query) - 可选: 
- `end_date` (query) - 可选: 

**响应**:

- `200`: Successful Response
- `422`: Validation Error

---

#### GET /api/admin/dashboard/overview

**描述**: Get Dashboard Overview

获取管理后台概览数据

**响应**:

- `200`: Successful Response

---

#### GET /api/admin/logs

**描述**: Get Admin Logs

获取管理员操作日志

**参数**:

- `skip` (query) - 可选: 
- `limit` (query) - 可选: 
- `action` (query) - 可选: 
- `admin_id` (query) - 可选: 
- `start_date` (query) - 可选: 
- `end_date` (query) - 可选: 

**响应**:

- `200`: Successful Response
- `422`: Validation Error

---

