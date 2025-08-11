// API配置
const API_BASE_URL = 'http://localhost:8000';

// API工具类
class API {
    constructor() {
        this.baseURL = API_BASE_URL;
        this.token = localStorage.getItem('token');
    }

    // 设置认证token
    setToken(token) {
        this.token = token;
        localStorage.setItem('token', token);
    }

    // 清除token
    clearToken() {
        this.token = null;
        localStorage.removeItem('token');
    }

    // 获取请求头
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json',
        };
        
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        return headers;
    }

    // 通用请求方法
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: this.getHeaders(),
            ...options
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || data.detail || '请求失败');
            }

            return data;
        } catch (error) {
            console.error('API请求错误:', error);
            throw error;
        }
    }

    // GET请求
    async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    }

    // POST请求
    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    // PUT请求
    async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    // DELETE请求
    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }

    // 认证相关API
    async login(username, password) {
        try {
            const formData = new FormData();
            formData.append('username', username);
            formData.append('password', password);

            const response = await fetch(`${this.baseURL}/api/auth/login`, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || data.detail || '登录失败');
            }

            return data;
        } catch (error) {
            console.error('登录请求失败:', error);
            throw error;
        }
    }

    async register(username, email, password) {
        return this.post('/api/auth/register', {
            username,
            email,
            password
        });
    }

    async getCurrentUser() {
        return this.get('/api/auth/me');
    }

    // 游戏相关API
    async getScratchCardTemplates() {
        return this.get('/api/games/scratch-card/templates');
    }

    async getSlotMachineTemplates() {
        return this.get('/api/games/slot-machine/templates');
    }

    async getWheelFortuneTemplates() {
        return this.get('/api/games/wheel-fortune/templates');
    }

    async playScratchCard(templateId) {
        return this.post('/api/games/scratch-card/play', {
            template_id: templateId
        });
    }

    async playSlotMachine(templateId, betLines = null) {
        return this.post('/api/games/slot-machine/play', {
            template_id: templateId,
            bet_lines: betLines
        });
    }

    async playWheelFortune(templateId) {
        return this.post('/api/games/wheel-fortune/play', {
            template_id: templateId
        });
    }

    async scratchArea(cardData, areaId) {
        return this.post('/api/games/scratch-card/scratch', {
            card_data: cardData,
            area_id: areaId
        });
    }

    async getGameHistory(limit = 20, offset = 0, gameType = null) {
        let endpoint = `/api/games/history?limit=${limit}&offset=${offset}`;
        if (gameType) {
            endpoint += `&game_type=${gameType}`;
        }
        return this.get(endpoint);
    }

    // 统计相关API
    async getUserStats() {
        return this.get('/api/stats/user/stats');
    }

    async getCreditsLeaderboard(limit = 10) {
        return this.get(`/api/stats/leaderboard/credits?limit=${limit}`);
    }

    async getTotalWinLeaderboard(limit = 10) {
        return this.get(`/api/stats/leaderboard/total-win?limit=${limit}`);
    }

    async getWinRateLeaderboard(limit = 10, minGames = 10) {
        return this.get(`/api/stats/leaderboard/win-rate?limit=${limit}&min_games=${minGames}`);
    }

    async getGameAnalysis(gameType = null, days = 7) {
        let endpoint = `/api/stats/analysis?days=${days}`;
        if (gameType) {
            endpoint += `&game_type=${gameType}`;
        }
        return this.get(endpoint);
    }

    async getLiveStatus() {
        return this.get('/api/stats/live-status');
    }

    // 健康检查
    async healthCheck() {
        try {
            const response = await fetch(`${this.baseURL}/health`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('健康检查失败:', error);
            throw error;
        }
    }
}

// 创建全局API实例
const api = new API();

// 错误处理工具
function handleApiError(error) {
    console.error('API错误:', error);

    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        // 未授权，清除token和用户信息并跳转到登录
        api.clearToken();
        localStorage.removeItem('currentUser');
        window.currentUser = null;
        updateAuthUI();
        showMessage('登录已过期，请重新登录', 'error');
        showLogin();
    } else {
        showMessage(error.message || '操作失败', 'error');
    }
}

// 格式化数字
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

// 格式化日期
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN');
}

// 格式化游戏类型
function formatGameType(gameType) {
    const gameTypeMap = {
        'scratch_card': '刮刮乐',
        'slot_machine': '老虎机',
        'wheel_fortune': '幸运转盘'
    };
    return gameTypeMap[gameType] || gameType;
}

// 检查API连接
async function checkApiConnection() {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        if (response.ok) {
            console.log('API连接正常');
            return true;
        } else {
            throw new Error(`HTTP ${response.status}`);
        }
    } catch (error) {
        console.error('API连接失败:', error);
        showMessage('无法连接到服务器，请检查后端服务是否启动', 'error');
        return false;
    }
}

// 创建全局API实例
const api = new API();
window.api = api;

console.log('API模块已加载，全局实例已创建');
