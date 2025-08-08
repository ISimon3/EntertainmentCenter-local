/**
 * 后台管理系统JavaScript
 */

// 全局变量
let currentSection = 'dashboard';
let sidebarOpen = true;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initializeAdmin();
    loadDashboardData();
});

/**
 * 初始化后台管理系统
 */
function initializeAdmin() {
    // 检查管理员权限
    checkAdminAuth();
    
    // 设置默认页面
    showAdminSection('dashboard');
    
    // 绑定事件监听器
    bindEventListeners();
}

/**
 * 检查管理员权限
 */
function checkAdminAuth() {
    let currentUser = localStorage.getItem('currentUser');

    // 如果没有用户信息，创建一个临时的管理员用户（用于测试）
    if (!currentUser) {
        console.log('未找到用户信息，创建临时管理员用户');
        const tempAdmin = {
            username: 'admin',
            email: 'admin@entertainment.com',
            is_admin: true,
            role: 'admin',
            credits: 999999,
            full_name: '系统管理员'
        };
        localStorage.setItem('currentUser', JSON.stringify(tempAdmin));
        currentUser = JSON.stringify(tempAdmin);
        showAdminMessage('使用临时管理员账户访问', 'info');
    }

    const user = JSON.parse(currentUser);
    console.log('当前用户信息:', user);

    // 检查管理员权限 - 支持多种格式
    const isAdmin = user.is_admin === true || user.role === 'admin' || user.username === 'admin';

    if (!isAdmin) {
        console.log('用户不是管理员，跳转到管理员登录页面');
        showAdminMessage('您没有管理员权限！正在跳转到登录页面...', 'error');
        setTimeout(() => {
            window.location.href = 'admin-login.html';
        }, 2000);
        return;
    }

    console.log('管理员权限验证通过');
}

/**
 * 绑定事件监听器
 */
function bindEventListeners() {
    // 响应式侧边栏
    window.addEventListener('resize', function() {
        if (window.innerWidth <= 768) {
            sidebarOpen = false;
            document.querySelector('.sidebar').classList.remove('open');
        } else {
            sidebarOpen = true;
            document.querySelector('.sidebar').classList.add('open');
        }
    });
}

/**
 * 显示管理页面部分
 */
function showAdminSection(sectionName) {
    // 隐藏所有部分
    document.querySelectorAll('.admin-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // 显示选中的部分
    document.getElementById(sectionName + '-section').classList.add('active');
    
    // 更新导航状态
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    document.querySelector(`[onclick="showAdminSection('${sectionName}')"]`).parentElement.classList.add('active');
    
    // 更新页面标题
    const titles = {
        'dashboard': '仪表盘',
        'users': '用户管理',
        'games': '游戏管理',
        'transactions': '交易记录',
        'settings': '系统设置'
    };
    
    document.getElementById('page-title').textContent = titles[sectionName];
    currentSection = sectionName;
    
    // 加载对应数据
    loadSectionData(sectionName);
}

/**
 * 切换侧边栏
 */
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    sidebarOpen = !sidebarOpen;
    
    if (sidebarOpen) {
        sidebar.classList.add('open');
    } else {
        sidebar.classList.remove('open');
    }
}

/**
 * 加载部分数据
 */
function loadSectionData(sectionName) {
    switch(sectionName) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'users':
            loadUsersData();
            break;
        case 'games':
            loadGamesData();
            break;
        case 'transactions':
            loadTransactionsData();
            break;
        case 'settings':
            loadSettingsData();
            break;
    }
}

/**
 * 加载仪表盘数据
 */
function loadDashboardData() {
    // 模拟数据加载
    setTimeout(() => {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const gameHistory = JSON.parse(localStorage.getItem('gameHistory') || '[]');
        
        // 更新统计数据
        document.getElementById('total-users').textContent = users.length;
        document.getElementById('total-games').textContent = gameHistory.length;
        
        // 计算总收入
        const totalRevenue = gameHistory.reduce((sum, game) => {
            return sum + (game.cost || 0);
        }, 0);
        document.getElementById('total-revenue').textContent = `¥${totalRevenue}`;
        
        // 计算活跃用户（最近7天有游戏记录的用户）
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const activeUsers = new Set();
        gameHistory.forEach(game => {
            const gameDate = new Date(game.timestamp);
            if (gameDate > sevenDaysAgo) {
                activeUsers.add(game.username);
            }
        });
        
        document.getElementById('active-users').textContent = activeUsers.size;
    }, 500);
}

/**
 * 加载用户数据
 */
function loadUsersData() {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const tbody = document.getElementById('users-table-body');
    
    tbody.innerHTML = '';
    
    users.forEach((user, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${user.username}</td>
            <td>${user.email}</td>
            <td>¥${user.credits || 0}</td>
            <td>${new Date(user.registeredAt || Date.now()).toLocaleDateString()}</td>
            <td><span class="status-badge status-active">正常</span></td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="editUser('${user.username}')">编辑</button>
                <button class="btn btn-sm btn-danger" onclick="deleteUser('${user.username}')">删除</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

/**
 * 加载游戏数据
 */
function loadGamesData() {
    const gamesList = document.getElementById('games-list');
    
    // 模拟游戏数据
    const games = [
        { id: 1, name: '福利彩票', type: 'scratch', cost: 10, status: 'active' },
        { id: 2, name: '新年特别版', type: 'scratch', cost: 20, status: 'active' },
        { id: 3, name: '幸运符号', type: 'scratch', cost: 5, status: 'active' }
    ];
    
    gamesList.innerHTML = '';
    
    games.forEach(game => {
        const gameCard = document.createElement('div');
        gameCard.className = 'game-admin-card';
        gameCard.innerHTML = `
            <h4>${game.name}</h4>
            <p>类型: ${game.type}</p>
            <p>价格: ¥${game.cost}</p>
            <p>状态: <span class="status-badge status-${game.status}">${game.status === 'active' ? '启用' : '禁用'}</span></p>
            <div class="game-actions">
                <button class="btn btn-sm btn-primary" onclick="editGame(${game.id})">编辑</button>
                <button class="btn btn-sm btn-warning" onclick="toggleGameStatus(${game.id})">
                    ${game.status === 'active' ? '禁用' : '启用'}
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteGame(${game.id})">删除</button>
            </div>
        `;
        gamesList.appendChild(gameCard);
    });
}

/**
 * 加载交易数据
 */
function loadTransactionsData() {
    const gameHistory = JSON.parse(localStorage.getItem('gameHistory') || '[]');
    const tbody = document.getElementById('transactions-table-body');
    
    tbody.innerHTML = '';
    
    gameHistory.forEach((transaction, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>T${String(index + 1).padStart(6, '0')}</td>
            <td>${transaction.username}</td>
            <td>游戏消费</td>
            <td>-¥${transaction.cost || 0}</td>
            <td>${transaction.gameType || '刮刮乐'}</td>
            <td>${new Date(transaction.timestamp).toLocaleString()}</td>
            <td><span class="status-badge status-success">完成</span></td>
        `;
        tbody.appendChild(row);
    });
}

/**
 * 加载设置数据
 */
function loadSettingsData() {
    // 从localStorage加载设置
    const settings = JSON.parse(localStorage.getItem('systemSettings') || '{}');
    
    document.getElementById('default-credits').value = settings.defaultCredits || 100;
    document.getElementById('max-bet').value = settings.maxBet || 1000;
    document.getElementById('maintenance-mode').checked = settings.maintenanceMode || false;
    document.getElementById('maintenance-notice').value = settings.maintenanceNotice || '';
}

/**
 * 刷新用户数据
 */
function refreshUsers() {
    showAdminMessage('正在刷新用户数据...', 'info');
    setTimeout(() => {
        loadUsersData();
        showAdminMessage('用户数据已刷新', 'success');
    }, 1000);
}

/**
 * 编辑用户
 */
function editUser(username) {
    showAdminMessage(`编辑用户: ${username}`, 'info');
    // TODO: 实现用户编辑功能
}

/**
 * 删除用户
 */
function deleteUser(username) {
    if (confirm(`确定要删除用户 ${username} 吗？`)) {
        let users = JSON.parse(localStorage.getItem('users') || '[]');
        users = users.filter(user => user.username !== username);
        localStorage.setItem('users', JSON.stringify(users));
        
        loadUsersData();
        showAdminMessage(`用户 ${username} 已删除`, 'success');
    }
}

/**
 * 添加游戏
 */
function addGame() {
    showAdminMessage('添加游戏功能开发中...', 'info');
    // TODO: 实现添加游戏功能
}

/**
 * 编辑游戏
 */
function editGame(gameId) {
    showAdminMessage(`编辑游戏 ID: ${gameId}`, 'info');
    // TODO: 实现游戏编辑功能
}

/**
 * 切换游戏状态
 */
function toggleGameStatus(gameId) {
    showAdminMessage(`切换游戏 ${gameId} 状态`, 'info');
    // TODO: 实现游戏状态切换
}

/**
 * 删除游戏
 */
function deleteGame(gameId) {
    if (confirm(`确定要删除游戏 ID: ${gameId} 吗？`)) {
        showAdminMessage(`游戏 ${gameId} 已删除`, 'success');
        // TODO: 实现游戏删除功能
    }
}

/**
 * 过滤交易记录
 */
function filterTransactions(type) {
    showAdminMessage(`过滤交易类型: ${type}`, 'info');
    // TODO: 实现交易过滤功能
}

/**
 * 保存游戏设置
 */
function saveGameSettings() {
    const settings = JSON.parse(localStorage.getItem('systemSettings') || '{}');
    
    settings.defaultCredits = parseInt(document.getElementById('default-credits').value);
    settings.maxBet = parseInt(document.getElementById('max-bet').value);
    
    localStorage.setItem('systemSettings', JSON.stringify(settings));
    showAdminMessage('游戏设置已保存', 'success');
}

/**
 * 保存维护设置
 */
function saveMaintenanceSettings() {
    const settings = JSON.parse(localStorage.getItem('systemSettings') || '{}');
    
    settings.maintenanceMode = document.getElementById('maintenance-mode').checked;
    settings.maintenanceNotice = document.getElementById('maintenance-notice').value;
    
    localStorage.setItem('systemSettings', JSON.stringify(settings));
    showAdminMessage('维护设置已保存', 'success');
}

/**
 * 退出登录
 */
function logout() {
    if (confirm('确定要退出登录吗？')) {
        // 清除用户信息和token
        localStorage.removeItem('currentUser');
        localStorage.removeItem('token');

        // 显示退出消息
        showAdminMessage('已退出登录，正在跳转到管理员登录页面...', 'info');

        // 延迟跳转到管理员登录页面
        setTimeout(() => {
            window.location.href = 'admin-login.html';
        }, 1500);
    }
}

/**
 * 显示管理员消息
 */
function showAdminMessage(message, type = 'info') {
    const messageEl = document.getElementById('admin-message');
    messageEl.textContent = message;
    messageEl.className = `admin-message ${type} show`;
    
    setTimeout(() => {
        messageEl.classList.remove('show');
    }, 3000);
}

// 添加状态徽章样式
const style = document.createElement('style');
style.textContent = `
    .status-badge {
        padding: 0.25rem 0.5rem;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 500;
    }
    
    .status-active, .status-success {
        background: #d4edda;
        color: #155724;
    }
    
    .status-inactive, .status-danger {
        background: #f8d7da;
        color: #721c24;
    }
    
    .btn-sm {
        padding: 0.375rem 0.75rem;
        font-size: 0.75rem;
    }
    
    .game-actions {
        margin-top: 1rem;
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
    }
`;
document.head.appendChild(style);
