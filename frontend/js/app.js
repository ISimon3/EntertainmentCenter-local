// 主应用逻辑

// 当前活动的页面
let currentSection = 'home';

// 页面初始化
document.addEventListener('DOMContentLoaded', async function() {
    console.log('娱乐中心系统启动...');
    
    // 检查API连接
    const apiConnected = await checkApiConnection();
    if (!apiConnected) {
        return;
    }
    
    // 检查登录状态
    await checkAuthStatus();
    
    // 加载游戏模板
    await loadGameTemplates();
    
    // 如果用户已登录，加载用户数据
    if (currentUser) {
        await loadUserData();
    }
    
    console.log('系统初始化完成');
});

// 显示页面部分
function showSection(sectionName) {
    // 隐藏所有部分
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        section.classList.remove('active');
    });
    
    // 显示指定部分
    const targetSection = document.getElementById(`${sectionName}-section`);
    if (targetSection) {
        targetSection.classList.add('active');
        currentSection = sectionName;
        
        // 根据页面加载相应数据
        switch (sectionName) {
            case 'stats':
                if (currentUser) {
                    loadStatsData();
                }
                break;
            case 'profile':
                if (currentUser) {
                    loadProfileData();
                }
                break;
        }
    } else {
        // 处理特殊页面（如刮刮乐游戏页面）
        const specialSection = document.getElementById(sectionName);
        if (specialSection) {
            specialSection.classList.add('active');
            currentSection = sectionName;
        }
    }
}

// 加载用户数据
async function loadUserData() {
    if (!currentUser) return;
    
    try {
        // 可以在这里加载用户相关的数据
        console.log('用户数据加载完成');
    } catch (error) {
        console.error('加载用户数据失败:', error);
    }
}

// 加载统计数据
async function loadStatsData() {
    if (!currentUser) return;
    
    try {
        // 加载用户统计
        const userStats = await api.getUserStats();
        displayUserStats(userStats);
        
        // 加载排行榜
        const leaderboard = await api.getCreditsLeaderboard();
        displayLeaderboard(leaderboard);
        
    } catch (error) {
        console.error('加载统计数据失败:', error);
        handleApiError(error);
    }
}

// 显示用户统计
function displayUserStats(stats) {
    const overallStats = stats.overall_stats;
    
    document.getElementById('total-games').textContent = overallStats.total_games;
    document.getElementById('total-bet').textContent = formatNumber(overallStats.total_bet);
    document.getElementById('total-win').textContent = formatNumber(overallStats.total_win);
    document.getElementById('win-rate').textContent = `${(overallStats.win_rate * 100).toFixed(1)}%`;
}

// 显示排行榜
function displayLeaderboard(leaderboard) {
    const container = document.getElementById('credits-leaderboard');
    container.innerHTML = '';
    
    leaderboard.entries.forEach((entry, index) => {
        const item = document.createElement('div');
        item.className = 'leaderboard-item';
        
        // 高亮当前用户
        if (currentUser && entry.user_id === currentUser.id) {
            item.style.background = '#e3f2fd';
            item.style.border = '2px solid #2196f3';
        }
        
        item.innerHTML = `
            <div class="rank">#${entry.rank}</div>
            <div class="username">${entry.username}</div>
            <div class="credits">${formatNumber(entry.value)} 元</div>
        `;
        
        container.appendChild(item);
    });
}

// 加载个人中心数据
async function loadProfileData() {
    if (!currentUser) return;
    
    try {
        // 显示个人信息
        displayProfileInfo();
        
        // 加载游戏历史
        const gameHistory = await api.getGameHistory(10);
        displayGameHistory(gameHistory);
        
    } catch (error) {
        console.error('加载个人数据失败:', error);
        handleApiError(error);
    }
}

// 显示个人信息
function displayProfileInfo() {
    const container = document.getElementById('profile-info');
    container.innerHTML = `
        <div class="profile-item">
            <span class="profile-label">用户名:</span>
            <span class="profile-value">${currentUser.username}</span>
        </div>
        <div class="profile-item">
            <span class="profile-label">邮箱:</span>
            <span class="profile-value">${currentUser.email}</span>
        </div>
        <div class="profile-item">
            <span class="profile-label">当前金额:</span>
            <span class="profile-value">${currentUser.credits} 元</span>
        </div>
        <div class="profile-item">
            <span class="profile-label">注册时间:</span>
            <span class="profile-value">${formatDate(currentUser.created_at)}</span>
        </div>
        <div class="profile-item">
            <span class="profile-label">最后登录:</span>
            <span class="profile-value">${currentUser.last_login ? formatDate(currentUser.last_login) : '首次登录'}</span>
        </div>
    `;
}

// 显示游戏历史
function displayGameHistory(history) {
    const container = document.getElementById('game-history');
    container.innerHTML = '';
    
    if (history.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666;">暂无游戏记录</p>';
        return;
    }
    
    history.forEach(record => {
        const item = document.createElement('div');
        item.className = `history-item ${record.net_win > 0 ? 'win' : 'lose'}`;
        
        item.innerHTML = `
            <div class="history-header">
                <span class="game-type">${formatGameType(record.game_type)}</span>
                <span class="game-time">${formatDate(record.created_at)}</span>
            </div>
            <div class="history-details">
                <span>投入: ${record.bet_amount} 元</span>
                <span>获得: ${record.win_amount} 元</span>
                <span class="${record.net_win > 0 ? 'profit' : 'loss'}">
                    净收益: ${record.net_win > 0 ? '+' : ''}${record.net_win} 元
                </span>
            </div>
        `;
        
        container.appendChild(item);
    });
}

// 显示消息提示
function showMessage(message, type = 'info') {
    const messageEl = document.getElementById('message');
    messageEl.textContent = message;
    messageEl.className = `message ${type}`;
    messageEl.classList.add('show');
    
    // 3秒后自动隐藏
    setTimeout(() => {
        messageEl.classList.remove('show');
    }, 3000);
}

// 添加个人中心相关样式
const profileStyles = `
<style>
.profile-item {
    display: flex;
    justify-content: space-between;
    padding: 0.75rem 0;
    border-bottom: 1px solid #eee;
}

.profile-label {
    color: #666;
    font-weight: 500;
}

.profile-value {
    color: #333;
    font-weight: bold;
}

.history-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.5rem;
}

.game-type {
    font-weight: bold;
    color: #333;
}

.game-time {
    color: #666;
    font-size: 0.9rem;
}

.history-details {
    display: flex;
    justify-content: space-between;
    font-size: 0.9rem;
}

.profit {
    color: #28a745;
    font-weight: bold;
}

.loss {
    color: #dc3545;
    font-weight: bold;
}

.leaderboard-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem;
    margin-bottom: 0.5rem;
    background: #f8f9fa;
    border-radius: 10px;
    transition: all 0.3s;
}

.leaderboard-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.username {
    flex: 1;
    margin: 0 1rem;
    font-weight: 500;
}

.credits {
    color: #667eea;
    font-weight: bold;
}
</style>
`;

// 将样式添加到页面
document.head.insertAdjacentHTML('beforeend', profileStyles);

// 全局错误处理
window.addEventListener('error', function(event) {
    console.error('全局错误:', event.error);
    showMessage('系统出现错误，请刷新页面重试', 'error');
});

// 网络状态监听
window.addEventListener('online', function() {
    showMessage('网络连接已恢复', 'success');
});

window.addEventListener('offline', function() {
    showMessage('网络连接已断开', 'error');
});

// 页面可见性变化处理
document.addEventListener('visibilitychange', function() {
    if (!document.hidden && currentUser) {
        // 页面重新可见时，刷新用户信息
        loadCurrentUser().then(() => {
            updateAuthUI();
        }).catch(error => {
            console.log('刷新用户信息失败:', error);
        });
    }
});

console.log('娱乐中心系统已加载');
