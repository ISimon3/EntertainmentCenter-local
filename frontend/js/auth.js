// 认证相关功能 - 刮刮乐专用版本

// 当前用户信息 - 设置为全局变量
let currentUser = null;
window.currentUser = null;

// 显示登录模态框
function showLogin() {
    document.getElementById('login-modal').style.display = 'block';
}

// 显示注册模态框
function showRegister() {
    document.getElementById('register-modal').style.display = 'block';
}

// 关闭模态框
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// 登录处理
async function login(event) {
    event.preventDefault();

    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    try {
        showMessage('正在登录...', 'info');

        const response = await api.login(username, password);

        // 保存token
        api.setToken(response.access_token);

        // 获取用户信息
        await loadCurrentUser();

        // 检查是否为管理员
        console.log('检查管理员权限，当前用户:', currentUser);
        const isAdmin = currentUser && (currentUser.is_admin === true || currentUser.role === 'admin' || currentUser.username === 'admin');

        if (isAdmin) {
            // 管理员跳转到后台管理页面
            showMessage('管理员登录成功，正在跳转到后台管理...', 'success');
            setTimeout(() => {
                window.location.href = 'admin.html';
            }, 1500);
            return;
        }

        // 更新UI
        updateAuthUI();
        closeModal('login-modal');

        showMessage('登录成功！', 'success');

        // 清空表单
        document.getElementById('login-form').reset();

    } catch (error) {
        handleApiError(error);
    }
}

// 注册处理
async function register(event) {
    event.preventDefault();
    
    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    
    try {
        showMessage('正在注册...', 'info');
        
        await api.register(username, email, password);
        
        showMessage('注册成功！请登录', 'success');
        
        // 关闭注册框，打开登录框
        closeModal('register-modal');
        document.getElementById('register-form').reset();
        
        // 自动填入用户名
        document.getElementById('login-username').value = username;
        showLogin();
        
    } catch (error) {
        handleApiError(error);
    }
}

// 退出登录
function logout() {
    api.clearToken();
    localStorage.removeItem('currentUser');
    currentUser = null;
    window.currentUser = null;
    updateAuthUI();
    showMessage('已退出登录', 'info');

    // 跳转到首页
    showSection('home');
}

// 加载当前用户信息
async function loadCurrentUser() {
    try {
        currentUser = await api.getCurrentUser();

        // 同时设置全局变量
        window.currentUser = currentUser;

        // 保存用户信息到localStorage，方便管理后台使用
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        console.log('用户信息已保存:', currentUser);

        return currentUser;
    } catch (error) {
        console.error('获取用户信息失败:', error);
        api.clearToken();
        localStorage.removeItem('currentUser');
        currentUser = null;
        window.currentUser = null;
        throw error;
    }
}

// 更新认证UI
function updateAuthUI() {
    const userInfo = document.getElementById('user-info');
    const authButtons = document.getElementById('auth-buttons');
    
    if (currentUser) {
        // 显示用户信息
        document.getElementById('username').textContent = currentUser.username;
        document.getElementById('credits').textContent = `${currentUser.credits} 元`;
        
        userInfo.style.display = 'flex';
        authButtons.style.display = 'none';
    } else {
        // 显示登录注册按钮
        userInfo.style.display = 'none';
        authButtons.style.display = 'flex';
    }
}

// 检查登录状态
async function checkAuthStatus() {
    console.log('🔍 开始检查登录状态...');

    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('currentUser');

    console.log('Token存在:', !!token);
    console.log('保存的用户信息存在:', !!savedUser);

    // 如果有保存的用户信息，先恢复它
    if (savedUser) {
        try {
            const userObj = JSON.parse(savedUser);
            currentUser = userObj;
            window.currentUser = userObj;
            console.log('✅ 从localStorage恢复用户信息:', userObj.username);
            console.log('✅ 全局变量设置完成 - window.currentUser:', !!window.currentUser);
        } catch (error) {
            console.log('❌ 解析保存的用户信息失败:', error);
            localStorage.removeItem('currentUser');
        }
    }

    if (token) {
        api.setToken(token);
        try {
            await loadCurrentUser();
            console.log('✅ 用户信息加载成功');
            console.log('✅ currentUser:', !!currentUser);
            console.log('✅ window.currentUser:', !!window.currentUser);
            updateAuthUI();
            return true;
        } catch (error) {
            console.log('❌ Token已过期或无效:', error);
            api.clearToken();
            localStorage.removeItem('currentUser');
            currentUser = null;
            window.currentUser = null;
            updateAuthUI();
            return false;
        }
    } else {
        // 没有token但有用户信息，清除用户信息
        if (currentUser || window.currentUser) {
            console.log('🗑️ 没有token，清除用户信息');
            currentUser = null;
            window.currentUser = null;
            localStorage.removeItem('currentUser');
        }
        updateAuthUI();
        return false;
    }
}

// 需要登录的操作检查
function requireAuth() {
    // 检查本地变量和全局变量
    const user = currentUser || window.currentUser;

    if (!user) {
        console.log('requireAuth检查失败 - 用户未登录');
        console.log('currentUser:', currentUser);
        console.log('window.currentUser:', window.currentUser);
        console.log('localStorage token:', localStorage.getItem('token'));

        showMessage('请先登录', 'error');
        showLogin();
        return false;
    }

    // 确保两个变量都同步
    if (!currentUser) currentUser = user;
    if (!window.currentUser) window.currentUser = user;

    console.log('requireAuth检查通过 - 用户已登录:', user.username);
    return true;
}

// 更新用户金额显示
function updateCreditsDisplay(newCredits) {
    if (currentUser) {
        currentUser.credits = newCredits;
        document.getElementById('credits').textContent = `${newCredits} 元`;
    }
}

// 模态框点击外部关闭
window.onclick = function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// 键盘事件处理
document.addEventListener('keydown', function(event) {
    // ESC键关闭模态框
    if (event.key === 'Escape') {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (modal.style.display === 'block') {
                modal.style.display = 'none';
            }
        });
    }
    
    // Enter键提交表单
    if (event.key === 'Enter') {
        const activeModal = document.querySelector('.modal[style*="block"]');
        if (activeModal) {
            const form = activeModal.querySelector('form');
            if (form) {
                form.dispatchEvent(new Event('submit'));
            }
        }
    }
});

// 表单验证
function validateLoginForm() {
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    
    if (!username) {
        showMessage('请输入用户名', 'error');
        return false;
    }
    
    if (!password) {
        showMessage('请输入密码', 'error');
        return false;
    }
    
    return true;
}

function validateRegisterForm() {
    const username = document.getElementById('register-username').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;
    
    if (!username) {
        showMessage('请输入用户名', 'error');
        return false;
    }
    
    if (username.length < 3) {
        showMessage('用户名至少3个字符', 'error');
        return false;
    }
    
    if (!email) {
        showMessage('请输入邮箱', 'error');
        return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showMessage('请输入有效的邮箱地址', 'error');
        return false;
    }
    
    if (!password) {
        showMessage('请输入密码', 'error');
        return false;
    }
    
    if (password.length < 6) {
        showMessage('密码至少6个字符', 'error');
        return false;
    }
    
    return true;
}

// 添加表单验证事件
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    if (loginForm) {
        loginForm.addEventListener('submit', function(event) {
            if (!validateLoginForm()) {
                event.preventDefault();
            }
        });
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', function(event) {
            if (!validateRegisterForm()) {
                event.preventDefault();
            }
        });
    }
});
