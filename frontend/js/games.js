// 游戏相关功能

// 游戏模板数据
let gameTemplates = {
    scratchCard: [],
    slotMachine: [],
    wheelFortune: []
};

// 当前刮刮乐游戏状态
let currentScratchCard = null;
let currentScratchTemplate = null;

// 加载所有游戏模板
async function loadGameTemplates() {
    try {
        const [scratchTemplates, slotTemplates, wheelTemplates] = await Promise.all([
            api.getScratchCardTemplates(),
            api.getSlotMachineTemplates(),
            api.getWheelFortuneTemplates()
        ]);
        
        gameTemplates.scratchCard = scratchTemplates;
        gameTemplates.slotMachine = slotTemplates;
        gameTemplates.wheelFortune = wheelTemplates;
        
        renderGameTemplates();
        
    } catch (error) {
        console.error('加载游戏模板失败:', error);
        showMessage('加载游戏失败', 'error');
    }
}

// 渲染游戏模板
function renderGameTemplates() {
    renderScratchCardGames();
    renderSlotMachineGames();
    renderWheelFortuneGames();
}

// 渲染刮刮乐游戏
function renderScratchCardGames() {
    const container = document.getElementById('scratch-games');
    container.innerHTML = '';
    
    gameTemplates.scratchCard.forEach(template => {
        const gameCard = createGameCard(template, 'scratch-card');
        container.appendChild(gameCard);
    });
}

// 渲染老虎机游戏
function renderSlotMachineGames() {
    const container = document.getElementById('slot-games');
    container.innerHTML = '';
    
    gameTemplates.slotMachine.forEach(template => {
        const gameCard = createGameCard(template, 'slot-machine');
        container.appendChild(gameCard);
    });
}

// 渲染转盘游戏
function renderWheelFortuneGames() {
    const container = document.getElementById('wheel-games');
    container.innerHTML = '';
    
    gameTemplates.wheelFortune.forEach(template => {
        const gameCard = createGameCard(template, 'wheel-fortune');
        container.appendChild(gameCard);
    });
}

// 创建游戏卡片
function createGameCard(template, gameType) {
    const card = document.createElement('div');
    card.className = 'game-card';
    card.onclick = () => playGame(gameType, template);
    
    card.innerHTML = `
        <h4>${template.name}</h4>
        <p>${template.description}</p>
        <div class="game-cost">${template.cost} 元</div>
        <div class="btn btn-primary">开始游戏</div>
    `;
    
    return card;
}

// 玩游戏 - 根据游戏类型跳转到对应页面
async function playGame(gameType, template) {
    if (!requireAuth()) return;
    
    try {
        if (gameType === 'scratch-card') {
            // 跳转到刮刮乐游戏页面
            currentScratchTemplate = template;
            // 设置全局变量供Canvas引擎使用
            window.currentScratchTemplate = template;
            document.getElementById('scratch-game-title').textContent = template.name;
            showSection('scratch-card-game');
            await startScratchCardGame();
        } else if (gameType === 'slot-machine') {
            // 老虎机游戏逻辑
            showMessage('老虎机游戏开发中...', 'info');
        } else if (gameType === 'wheel-fortune') {
            // 转盘游戏逻辑
            showMessage('幸运转盘游戏开发中...', 'info');
        }
        
    } catch (error) {
        handleApiError(error);
    }
}

// 开始刮刮乐游戏
async function startScratchCardGame() {
    if (!currentScratchTemplate || !requireAuth()) return;
    
    try {
        showMessage('正在创建刮刮乐...', 'info');
        
        const response = await api.playScratchCard(currentScratchTemplate.id);
        currentScratchCard = response.card_data;
        
        // 更新用户金额
        updateCreditsDisplay(response.user_credits);
        
        // 渲染刮刮乐卡片
        renderScratchCard(currentScratchCard);
        
        // 隐藏结果区域
        document.getElementById('game-result').style.display = 'none';
        
        showMessage('刮刮乐创建成功，开始刮奖吧！', 'success');
        
    } catch (error) {
        console.error('创建刮刮乐失败:', error);
        handleApiError(error);
    }
}

// 渲染刮刮乐卡片 - 现在由Canvas集成模块处理
// 这个函数已被Canvas刮奖引擎替代

// 刮开区域 - 现在由Canvas引擎处理
// 这个函数已被Canvas刮奖引擎替代

// 全部刮开
function scratchAll() {
    if (!currentScratchCard) return;
    
    currentScratchCard.areas.forEach((area, index) => {
        if (!area.is_scratched) {
            area.is_scratched = true;
            
            const areaElement = document.querySelector(`[data-area-id="${index}"]`);
            areaElement.classList.add('scratched');
            areaElement.textContent = area.content;
            areaElement.onclick = null;
            
            if (currentScratchCard.is_winner && area.content !== '谢谢参与') {
                areaElement.classList.add('winner');
            }
        }
    });
    
    showScratchGameResult();
    updateScratchGameControls();
}

// 显示刮刮乐游戏结果
function showScratchGameResult() {
    const resultContainer = document.getElementById('game-result');
    const resultIcon = document.getElementById('result-icon');
    const resultTitle = document.getElementById('result-title');
    const resultDetails = document.getElementById('result-details');
    
    if (currentScratchCard.is_winner) {
        resultIcon.textContent = '🎉';
        resultTitle.textContent = '恭喜中奖！';
        resultTitle.style.color = '#28a745';
        
        const prizeCredits = currentScratchCard.prize_info.credits;
        resultDetails.innerHTML = `
            <div class="prize-amount">+${prizeCredits} 元</div>
            <p>奖品：${currentScratchCard.prize_info.name}</p>
        `;

        showMessage(`恭喜！获得 ${prizeCredits} 元`, 'success');
        
        // 添加庆祝动画
        setTimeout(() => {
            createCelebrationEffect();
        }, 500);
        
    } else {
        resultIcon.textContent = '😔';
        resultTitle.textContent = '很遗憾，未中奖';
        resultTitle.style.color = '#dc3545';
        resultDetails.innerHTML = '<p>再试一次，好运就在下一张！</p>';
    }
    
    resultContainer.style.display = 'block';
}

// 创建庆祝效果
function createCelebrationEffect() {
    // 创建彩带效果
    for (let i = 0; i < 50; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.style.position = 'fixed';
            confetti.style.left = Math.random() * 100 + 'vw';
            confetti.style.top = '-10px';
            confetti.style.width = '10px';
            confetti.style.height = '10px';
            confetti.style.backgroundColor = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57'][Math.floor(Math.random() * 5)];
            confetti.style.pointerEvents = 'none';
            confetti.style.zIndex = '9999';
            confetti.style.borderRadius = '50%';
            
            document.body.appendChild(confetti);
            
            // 动画
            confetti.animate([
                { transform: 'translateY(0) rotate(0deg)', opacity: 1 },
                { transform: `translateY(100vh) rotate(${Math.random() * 360}deg)`, opacity: 0 }
            ], {
                duration: 3000,
                easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
            }).onfinish = () => {
                confetti.remove();
            };
        }, i * 100);
    }
}

// 更新刮刮乐游戏控制按钮
function updateScratchGameControls() {
    // 注意：按钮控制现在主要由Canvas集成模块处理
    // 这个函数保留用于兼容性，但不应干扰Canvas模式的按钮逻辑

    if (window.canvasScratchIntegration) {
        // Canvas模式下，按钮控制由集成模块处理
        return;
    }

    const scratchAllBtn = document.getElementById('scratch-all-btn');
    const newGameBtn = document.getElementById('new-game-btn');

    if (!currentScratchCard) {
        scratchAllBtn.style.display = 'none';
        newGameBtn.style.display = 'none';
        return;
    }

    const hasUnscratched = currentScratchCard.areas.some(area => !area.is_scratched);
    const allScratched = currentScratchCard.areas.every(area => area.is_scratched);

    scratchAllBtn.style.display = hasUnscratched ? 'inline-flex' : 'none';
    newGameBtn.style.display = allScratched ? 'inline-flex' : 'none';
}

// 开始新的刮刮乐游戏
function startNewGame() {
    startScratchCardGame();
}

console.log('游戏模块已加载');
