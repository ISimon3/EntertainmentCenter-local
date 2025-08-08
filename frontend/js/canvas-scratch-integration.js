/**
 * Canvas刮奖系统集成模块
 * 将Canvas刮奖引擎集成到现有的刮刮乐游戏系统中
 */

class CanvasScratchIntegration {
    constructor() {
        this.engine = null;
        this.effects = null;
        this.scratchAllButtonShown = false; // 标记"全部刮开"按钮是否已显示
        this.lastProgress = 0; // 记录上次进度

        this.init();
    }
    
    /**
     * 初始化集成系统
     */
    init() {
        // 完全替换渲染函数为Canvas版本
        window.renderScratchCard = this.renderCanvasScratchCard.bind(this);

        // 替换刮奖函数
        window.scratchArea = () => {
            console.log('旧版刮奖函数已被Canvas引擎替代');
        };

        console.log('Canvas刮奖集成系统已初始化 - 只使用Canvas模式');
    }
    
    /**
     * 添加Canvas控制面板
     */
    addCanvasControls() {
        const gameHeader = document.querySelector('.game-header');
        if (gameHeader) {
            // 创建控制面板容器
            const controlPanel = document.createElement('div');
            controlPanel.className = 'canvas-controls';
            controlPanel.style.cssText = 'display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;';

            // 主题选择器
            const themeSelector = this.createThemeSelector();

            // 特效控制
            const effectsControl = this.createEffectsControl();

            controlPanel.appendChild(themeSelector);
            controlPanel.appendChild(effectsControl);

            gameHeader.appendChild(controlPanel);
        }
    }

    /**
     * 创建主题选择器
     */
    createThemeSelector() {
        const container = document.createElement('div');
        container.className = 'theme-selector';

        const label = document.createElement('span');
        label.textContent = '主题: ';
        label.style.color = 'white';
        label.style.fontSize = '0.9rem';

        const themes = [
            { name: 'silver', title: '银色' },
            { name: 'gold', title: '金色' },
            { name: 'rainbow', title: '彩虹' }
        ];

        themes.forEach(theme => {
            const button = document.createElement('button');
            button.className = `theme-button ${theme.name}`;
            button.title = theme.title;
            button.onclick = () => this.setTheme(theme.name);
            container.appendChild(button);
        });

        container.insertBefore(label, container.firstChild);
        return container;
    }

    /**
     * 创建特效控制
     */
    createEffectsControl() {
        const container = document.createElement('div');
        container.className = 'effects-control';
        container.style.cssText = 'display: flex; gap: 0.5rem; align-items: center;';

        const label = document.createElement('span');
        label.textContent = '特效: ';
        label.style.color = 'white';
        label.style.fontSize = '0.9rem';

        const effects = [
            { name: 'particles', title: '粒子', icon: 'fas fa-sparkles' },
            { name: 'glow', title: '光晕', icon: 'fas fa-sun' },
            { name: 'sound', title: '音效', icon: 'fas fa-volume-up' }
        ];

        effects.forEach(effect => {
            const button = document.createElement('button');
            button.className = 'effect-toggle active';
            button.innerHTML = `<i class="${effect.icon}"></i>`;
            button.title = effect.title;
            button.onclick = () => this.toggleEffect(effect.name, button);
            container.appendChild(button);
        });

        container.insertBefore(label, container.firstChild);
        return container;
    }
    

    
    /**
     * Canvas模式的刮刮乐渲染函数
     */
    renderCanvasScratchCard(cardData) {
        const container = document.getElementById('scratch-card');
        if (!container) return;

        // 完全清空容器
        container.innerHTML = '';

        // 直接创建Canvas引擎容器，不添加额外的装饰层
        const canvasContainer = document.createElement('div');
        canvasContainer.className = 'canvas-scratch-container';
        canvasContainer.style.cssText = `
            width: 580px;
            height: 380px;
            margin: 0 auto;
            position: relative;
        `;

        container.appendChild(canvasContainer);

        // 初始化Canvas引擎
        this.initCanvasEngine(canvasContainer, cardData);

        // 更新控制按钮
        if (window.updateScratchGameControls) {
            window.updateScratchGameControls();
        }
    }
    
    /**
     * 初始化Canvas引擎
     */
    initCanvasEngine(container, cardData) {
        // 重置标志
        this.scratchAllButtonShown = false;
        this.lastProgress = 0;

        // 隐藏全部刮开按钮
        const scratchAllBtn = document.getElementById('scratch-all-btn');
        if (scratchAllBtn) {
            scratchAllBtn.style.display = 'none';
        }

        // 销毁现有引擎
        if (this.engine) {
            this.engine.destroy();
        }

        // 创建新引擎
        this.engine = new CanvasScratchEngine(container, {
            width: 580,
            height: 380,
            scratchRadius: 25,
            scratchThreshold: 0.6,
            enableParticles: true,
            enableGlow: true,
            enableSound: true
        });

        // 创建增强效果系统
        this.effects = new EnhancedScratchEffects(this.engine);
        this.engine.setEffects(this.effects);

        // 设置事件回调
        this.setupEngineCallbacks();

        // 加载刮刮乐卡片
        const template = window.currentScratchTemplate || {
            id: 'default',
            name: '默认刮刮乐',
            layout: { cols: 6, rows: 5 }
        };
        this.engine.loadScratchCard(cardData, template);
    }
    
    /**
     * 设置引擎事件回调
     */
    setupEngineCallbacks() {
        // 刮奖开始回调
        this.engine.setCallback('onScratchStart', (pos) => {
            console.log('开始刮奖:', pos);
        });
        
        // 刮奖进度回调（检测80%进度）
        this.engine.setCallback('onScratchProgress', (progress) => {
            console.log('刮奖进度:', Math.round(progress * 100) + '%');

            // 当刮开程度达到80%时，显示"全部刮开"按钮
            // 严格条件：进度在0.8-0.95之间，且之前进度小于0.8（确保是递增的）
            if (progress >= 0.8 && progress < 0.95 &&
                !this.scratchAllButtonShown &&
                this.lastProgress < 0.8 &&
                progress > 0.1) {
                this.scratchAllButtonShown = true;
                this.showScratchAllButton();
            }

            // 记录上次进度
            this.lastProgress = progress;
        });
        
        // 刮奖完成回调
        this.engine.setCallback('onScratchComplete', (cardData) => {
            console.log('刮奖完成:', cardData);

            // 显示完成效果
            this.showCompletionEffects();

            // 隐藏"全部刮开"按钮
            const scratchAllBtn = document.getElementById('scratch-all-btn');
            if (scratchAllBtn) {
                scratchAllBtn.style.display = 'none';
            }

            // 直接进行奖励结算
            setTimeout(() => {
                this.handleRewardSettlement();
            }, 1000);

            // 显示游戏结果
            if (window.showScratchGameResult) {
                setTimeout(() => {
                    window.showScratchGameResult();
                }, 2000);
            }
        });
        
        // 区域揭示回调
        this.engine.setCallback('onAreaRevealed', (areaData) => {
            console.log('区域揭示:', areaData);
        });
    }
    

    
    /**
     * 全部刮开功能
     */
    scratchAll() {
        if (this.engine) {
            this.engine.scratchAll();

            // 隐藏"全部刮开"按钮
            const scratchAllBtn = document.getElementById('scratch-all-btn');
            if (scratchAllBtn) {
                scratchAllBtn.style.display = 'none';
            }

            // 直接进行奖励结算，不显示结算按钮
            setTimeout(() => {
                this.handleRewardSettlement();
            }, 500);
        } else if (window.scratchAll) {
            window.scratchAll();
        }
    }
    
    /**
     * 开始新游戏
     */
    startNewGame() {
        // 重置标志
        this.scratchAllButtonShown = false;
        this.lastProgress = 0;

        // 隐藏全部刮开按钮
        const scratchAllBtn = document.getElementById('scratch-all-btn');
        if (scratchAllBtn) {
            scratchAllBtn.style.display = 'none';
        }

        // 隐藏"再来一张"按钮
        const newGameBtn = document.getElementById('new-game-btn');
        if (newGameBtn) {
            newGameBtn.style.display = 'none';
        }

        // 隐藏奖励结算按钮
        const settlementBtn = document.getElementById('reward-settlement-btn');
        if (settlementBtn) {
            settlementBtn.style.display = 'none';
        }

        if (window.startScratchCardGame) {
            window.startScratchCardGame();
        }
    }
    
    /**
     * 获取当前模式
     */
    getCurrentMode() {
        return 'canvas';
    }
    
    /**
     * 设置主题
     */
    setTheme(theme) {
        // 更新主题按钮状态
        document.querySelectorAll('.theme-button').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`.theme-button.${theme}`).classList.add('active');

        // 应用主题
        this.setScratchTheme(theme);
        showMessage(`已切换到${this.getThemeName(theme)}主题`, 'success');
    }

    /**
     * 获取主题名称
     */
    getThemeName(theme) {
        const names = {
            silver: '银色',
            gold: '金色',
            rainbow: '彩虹'
        };
        return names[theme] || theme;
    }

    /**
     * 切换特效
     */
    toggleEffect(effectName, button) {
        const isActive = button.classList.contains('active');

        if (isActive) {
            button.classList.remove('active');
            this.disableEffect(effectName);
        } else {
            button.classList.add('active');
            this.enableEffect(effectName);
        }

        showMessage(`${this.getEffectName(effectName)}${isActive ? '已关闭' : '已开启'}`, 'info');
    }

    /**
     * 获取特效名称
     */
    getEffectName(effect) {
        const names = {
            particles: '粒子效果',
            glow: '光晕效果',
            sound: '音效'
        };
        return names[effect] || effect;
    }

    /**
     * 启用特效
     */
    enableEffect(effectName) {
        if (!this.engine) return;

        switch (effectName) {
            case 'particles':
                this.engine.options.enableParticles = true;
                break;
            case 'glow':
                this.engine.options.enableGlow = true;
                break;
            case 'sound':
                this.engine.options.enableSound = true;
                break;
        }
    }

    /**
     * 禁用特效
     */
    disableEffect(effectName) {
        if (!this.engine) return;

        switch (effectName) {
            case 'particles':
                this.engine.options.enableParticles = false;
                break;
            case 'glow':
                this.engine.options.enableGlow = false;
                break;
            case 'sound':
                this.engine.options.enableSound = false;
                break;
        }
    }

    /**
     * 设置刮奖主题
     */
    setScratchTheme(theme) {
        if (this.effects) {
            // 根据主题设置不同的涂层样式
            const themes = {
                silver: 'silver',
                gold: 'gold',
                rainbow: 'rainbow'
            };

            if (themes[theme] && this.engine) {
                // 重新绘制刮奖层
                const ctx = this.engine.layers.scratch.ctx;
                const { width, height } = this.engine.options;

                ctx.clearRect(0, 0, width, height);
                this.effects.createScratchTexture(ctx, width, height, themes[theme]);

                // 添加提示文字
                ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                ctx.font = 'bold 24px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('刮开涂层查看奖品', width / 2, height / 2);
            }
        }
    }

    /**
     * 设置刮刀样式
     */
    setScratchTool(toolType) {
        if (this.engine) {
            // 根据刮刀类型设置不同的刮除半径
            const radiusMap = {
                'finger': 15,    // 手指 - 小半径
                'coin': 25,      // 硬币 - 中等半径
                'brush': 35      // 刷子 - 大半径
            };

            const radius = radiusMap[toolType] || 25;

            // 更新刮除半径
            this.engine.setScratchRadius(radius);

            // 更新光标样式
            this.engine.setScratchCursor(toolType);

            console.log(`切换刮刀: ${toolType}, 半径: ${radius}px`);
        }
    }

    /**
     * 设置刮刀硬度
     */
    setScratchHardness(hardness) {
        if (this.engine) {
            this.engine.setScratchHardness(hardness);
        }
    }

    /**
     * 设置刮刀特效
     */
    setScratchEffects(effectType) {
        if (this.effects) {
            this.effects.setEffectMode(effectType);
        }
    }

    /**
     * 设置刮刀声音
     */
    setScratchSound(soundType) {
        if (this.effects) {
            this.effects.setSoundMode(soundType);
        }
    }
    
    /**
     * 显示"全部刮开"按钮（80%进度时）
     */
    showScratchAllButton() {
        const scratchAllBtn = document.getElementById('scratch-all-btn');
        if (scratchAllBtn && scratchAllBtn.style.display === 'none') {
            console.log('显示"全部刮开"按钮');
            scratchAllBtn.style.display = 'inline-block';
            scratchAllBtn.classList.add('btn-pulse'); // 添加脉冲动画
        }
    }

    /**
     * 显示奖励结算按钮（完成时）
     */
    showRewardSettlementButton() {
        // 隐藏"全部刮开"按钮
        const scratchAllBtn = document.getElementById('scratch-all-btn');
        if (scratchAllBtn) {
            scratchAllBtn.style.display = 'none';
        }

        // 显示或创建奖励结算按钮
        let settlementBtn = document.getElementById('reward-settlement-btn');
        if (!settlementBtn) {
            settlementBtn = document.createElement('button');
            settlementBtn.id = 'reward-settlement-btn';
            settlementBtn.className = 'btn btn-success btn-pulse';
            settlementBtn.innerHTML = '<i class="fas fa-coins"></i> 奖励结算';
            settlementBtn.onclick = () => this.handleRewardSettlement();

            // 插入到控制区域
            const gameControls = document.querySelector('.game-controls');
            if (gameControls) {
                gameControls.appendChild(settlementBtn);
            }
        }
        settlementBtn.style.display = 'inline-block';
    }

    /**
     * 显示"再来一张"按钮
     */
    showNewGameButton() {
        // 隐藏奖励结算按钮
        const settlementBtn = document.getElementById('reward-settlement-btn');
        if (settlementBtn) {
            settlementBtn.style.display = 'none';
        }

        // 显示"再来一张"按钮
        const newGameBtn = document.getElementById('new-game-btn');
        if (newGameBtn) {
            newGameBtn.style.display = 'inline-block';
        }
    }

    /**
     * 处理奖励结算
     */
    handleRewardSettlement() {
        // 计算奖励金额
        const rewards = this.calculateRewards();

        // 显示结算弹窗
        this.showRewardModal(rewards);

        // 更新用户金额
        this.updateUserPoints(rewards.totalPoints);

        // 显示"再来一张"按钮
        this.showNewGameButton();
    }

    /**
     * 计算奖励金额
     */
    calculateRewards() {
        const template = window.currentScratchTemplate;
        if (!template || !template.prizes) {
            return { totalPoints: 0, items: [] };
        }

        let totalPoints = 0;
        const items = [];

        // 遍历所有奖品区域，计算中奖金额
        template.prizes.forEach((prize, index) => {
            if (prize.type === 'points') {
                totalPoints += prize.value;
                items.push({
                    name: prize.name,
                    points: prize.value,
                    type: 'points'
                });
            } else if (prize.type === 'item') {
                items.push({
                    name: prize.name,
                    type: 'item',
                    description: prize.description
                });
            }
        });

        return { totalPoints, items };
    }

    /**
     * 显示奖励结算弹窗
     */
    showRewardModal(rewards) {
        // 移除已存在的弹窗
        const existingModal = document.getElementById('reward-modal');
        if (existingModal) {
            existingModal.remove();
        }

        // 创建弹窗HTML
        const modalHTML = `
            <div id="reward-modal" class="modal-overlay">
                <div class="modal-content reward-modal">
                    <div class="modal-header">
                        <h3><i class="fas fa-trophy"></i> 奖励结算</h3>
                        <button class="modal-close" onclick="closeRewardModal()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="reward-summary">
                            <div class="total-points">
                                <i class="fas fa-coins"></i>
                                <span>总金额: ${rewards.totalPoints} 元</span>
                            </div>
                        </div>
                        <div class="reward-items">
                            ${rewards.items.map(item => `
                                <div class="reward-item">
                                    <i class="fas fa-${item.type === 'points' ? 'coins' : 'gift'}"></i>
                                    <span>${item.name}</span>
                                    ${item.points ? `<span class="points">+${item.points} 元</span>` : ''}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-primary" onclick="closeRewardModal()">
                            <i class="fas fa-check"></i> 确认收取
                        </button>
                    </div>
                </div>
            </div>
        `;

        // 添加到页面
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // 添加点击外部关闭功能
        const modal = document.getElementById('reward-modal');
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeRewardModal();
            }
        });

        // 添加ESC键关闭功能
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                closeRewardModal();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    }

    /**
     * 更新用户金额
     */
    updateUserPoints(points) {
        if (points > 0) {
            // 这里应该调用后端API更新用户金额
            console.log(`用户获得 ${points} 元`);

            // 临时更新前端显示
            const userPointsElement = document.querySelector('.user-points');
            if (userPointsElement) {
                const currentPoints = parseInt(userPointsElement.textContent) || 0;
                userPointsElement.textContent = currentPoints + points;
            }
        }
    }

    /**
     * 显示完成效果
     */
    showCompletionEffects() {
        if (this.effects) {
            // 播放完成音效
            this.effects.playSound('complete');

            // 显示庆祝粒子效果
            const { width, height } = this.engine.options;
            for (let i = 0; i < 50; i++) {
                setTimeout(() => {
                    this.effects.createAdvancedParticles(
                        Math.random() * width,
                        Math.random() * height,
                        'win'
                    );
                }, i * 50);
            }
        }
    }

    /**
     * 销毁集成系统
     */
    destroy() {
        if (this.engine) {
            this.engine.destroy();
            this.engine = null;
        }
        
        if (this.effects) {
            this.effects.destroy();
            this.effects = null;
        }
        
        // 恢复原始渲染函数
        if (this.originalRenderFunction) {
            window.renderScratchCard = this.originalRenderFunction;
        }
        
        console.log('Canvas刮奖集成系统已销毁');
    }
}

// 全局集成实例
let canvasScratchIntegration = null;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 等待其他脚本加载完成
    setTimeout(() => {
        if (window.CanvasScratchEngine && window.EnhancedScratchEffects) {
            canvasScratchIntegration = new CanvasScratchIntegration();
            
            // 重写全局函数
            window.scratchAll = function() {
                if (canvasScratchIntegration) {
                    canvasScratchIntegration.scratchAll();
                }
            };
            
            window.startNewGame = function() {
                if (canvasScratchIntegration) {
                    canvasScratchIntegration.startNewGame();
                }
            };

            // 刮刀设置相关函数
            window.showScratchSettings = function() {
                document.getElementById('scratch-settings-modal').style.display = 'flex';
            };

            window.hideScratchSettings = function() {
                document.getElementById('scratch-settings-modal').style.display = 'none';
            };

            window.setScratchTool = function(toolType) {
                if (canvasScratchIntegration) {
                    canvasScratchIntegration.setScratchTool(toolType);
                }
                updateSettingButtons('tool', toolType);
            };

            window.setScratchHardness = function(hardness) {
                if (canvasScratchIntegration) {
                    canvasScratchIntegration.setScratchHardness(hardness);
                }
                updateSettingButtons('hardness', hardness);
            };

            window.setScratchEffects = function(effectType) {
                if (canvasScratchIntegration) {
                    canvasScratchIntegration.setScratchEffects(effectType);
                }
                updateSettingButtons('effect', effectType);
            };

            window.setScratchSound = function(soundType) {
                if (canvasScratchIntegration) {
                    canvasScratchIntegration.setScratchSound(soundType);
                }
                updateSettingButtons('sound', soundType);
            };

            // 更新设置按钮状态
            function updateSettingButtons(type, value) {
                const buttons = document.querySelectorAll(`[data-${type}]`);
                buttons.forEach(btn => {
                    btn.classList.remove('active');
                    if (btn.getAttribute(`data-${type}`) === value) {
                        btn.classList.add('active');
                    }
                });
            }
            
            console.log('Canvas刮奖系统集成完成');
        } else {
            console.warn('Canvas刮奖引擎或增强效果模块未加载');
        }
    }, 100);
});

// 全局函数：关闭奖励弹窗
window.closeRewardModal = function() {
    const modal = document.getElementById('reward-modal');
    if (modal) {
        modal.remove();
        console.log('奖励弹窗已关闭');
    }
};

// 页面卸载时清理
window.addEventListener('beforeunload', function() {
    if (canvasScratchIntegration) {
        canvasScratchIntegration.destroy();
    }
});

console.log('Canvas刮奖集成模块已加载');
