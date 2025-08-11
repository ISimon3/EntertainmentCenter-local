/**
 * Canvas刮奖系统集成模块 - 修复版
 */

console.log('🚀 Canvas集成模块(修复版)开始加载');

class CanvasScratchIntegration {
    constructor() {
        console.log('=== CanvasScratchIntegration构造函数被调用 ===');
        this.engine = null;
        this.effects = null;
        this.currentCardData = null;
        this.scratchAllButtonShown = false;
        this.lastProgress = 0;
        this.dataProtectionInterval = null;

        this.init();
        console.log('=== CanvasScratchIntegration构造完成 ===');
    }

    init() {
        console.log('Canvas刮奖集成系统已初始化');

        // 替换渲染函数为Canvas版本
        window.renderScratchCard = this.renderCanvasScratchCard.bind(this);

        // 替换刮奖函数
        window.scratchArea = () => {
            console.log('旧版刮奖函数已被Canvas引擎替代');
        };

        // 替换原始的游戏结果显示函数
        window.showScratchGameResult = () => {
            console.log('原始showScratchGameResult被调用，重定向到Canvas集成模块结算');
            this.handleRewardSettlement();
        };

        window.canvasIntegrationActive = true;
    }

    /**
     * 渲染Canvas刮刮乐卡片 - 关键入口函数
     */
    renderCanvasScratchCard(cardData) {
        console.log('🎨 Canvas渲染函数被调用', cardData);

        // 确保数据存在
        if (!cardData) {
            console.error('❌ 没有卡片数据传入renderCanvasScratchCard');
            return;
        }

        // 存储当前卡片数据
        this.currentCardData = cardData;
        window.currentScratchCard = cardData;

        console.log('✅ 卡片数据已存储到集成模块:', cardData);
        console.log('卡片是否中奖:', cardData.is_winner);
        console.log('奖品信息:', cardData.prize_info);

        // 获取游戏容器
        const gameContainer = document.getElementById('scratch-card-container');
        if (!gameContainer) {
            console.error('❌ 找不到游戏容器 #scratch-card-container');
            return;
        }

        // 初始化Canvas引擎
        this.initCanvasEngine(gameContainer, cardData);

        // 显示游戏控制按钮
        this.updateScratchGameControls();
    }

    /**
     * 初始化Canvas引擎
     */
    initCanvasEngine(container, cardData) {
        console.log('=== 初始化Canvas引擎 ===');
        console.log('传入的卡片数据:', cardData);

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

        // 清理数据保护定时器
        if (this.dataProtectionInterval) {
            clearInterval(this.dataProtectionInterval);
        }

        // 检查所有必要的依赖
        const dependencies = [
            { name: 'CompatibilityHandler', class: window.CompatibilityHandler },
            { name: 'CanvasScratchEngine', class: window.CanvasScratchEngine },
            { name: 'PerformanceOptimizer', class: window.PerformanceOptimizer }
        ];

        const missingDeps = dependencies.filter(dep => !dep.class);
        if (missingDeps.length > 0) {
            const missing = missingDeps.map(dep => dep.name).join(', ');
            console.error(`❌ 缺少必要的依赖: ${missing}`);
            return;
        }

        console.log('✅ 所有依赖检查通过');

        // 创建新引擎
        try {
            this.engine = new CanvasScratchEngine(container, {
                width: 580,
                height: 380,
                scratchRadius: 25,
                scratchThreshold: 0.6,
                enableParticles: true,
                enableGlow: true,
                enableSound: true
            });
            console.log('✅ Canvas引擎创建成功');
        } catch (error) {
            console.error('❌ Canvas引擎创建失败:', error);
            return;
        }

        // 创建增强效果系统
        if (window.EnhancedScratchEffects) {
            try {
                this.effects = new EnhancedScratchEffects(this.engine);
                this.engine.setEffects(this.effects);
                console.log('✅ 增强效果系统初始化成功');
            } catch (error) {
                console.warn('⚠️ 增强效果系统初始化失败，将跳过:', error);
                this.effects = null;
            }
        } else {
            console.warn('⚠️ EnhancedScratchEffects未加载，将跳过效果系统');
            this.effects = null;
        }

        // 设置事件回调
        this.setupEngineCallbacks();

        // 加载刮刮乐卡片
        const template = window.currentScratchTemplate || {
            id: 'default',
            name: '默认刮刮乐',
            layout: { cols: 6, rows: 5 }
        };

        console.log('使用的模板:', template);
        console.log('传递给引擎的卡片数据:', cardData);

        // 确保卡片数据被正确保存到所有位置
        this.currentCardData = cardData;
        window.currentScratchCard = cardData;

        // 定期检查并恢复全局数据（防止被其他代码覆盖）
        this.dataProtectionInterval = setInterval(() => {
            if (!window.currentScratchCard && this.currentCardData) {
                console.log('🔧 检测到全局数据丢失，正在恢复...');
                window.currentScratchCard = this.currentCardData;
            }
        }, 500);

        // 加载卡片到引擎
        this.engine.loadScratchCard(cardData, template);

        console.log('✅ Canvas引擎初始化完成');
    }

    /**
     * 设置引擎回调
     */
    setupEngineCallbacks() {
        if (!this.engine) return;

        // 刮奖进度回调
        this.engine.setCallback('onScratchProgress', (progress) => {
            console.log(`刮奖进度: ${(progress * 100).toFixed(1)}%`);

            // 当进度达到30%时显示"全部刮开"按钮
            if (progress >= 0.3 && !this.scratchAllButtonShown) {
                this.showScratchAllButton();
                this.scratchAllButtonShown = true;
            }

            this.lastProgress = progress;
        });

        // 刮奖完成回调
        this.engine.setCallback('onScratchComplete', (cardData) => {
            console.log('=== 刮奖完成回调 ===');
            console.log('回调传入的cardData:', cardData);

            // 保存当前卡片数据供奖励计算使用
            this.currentCardData = cardData || this.engine.cardData || window.currentScratchCard;

            console.log('完成回调 - 保存的卡片数据:', this.currentCardData);

            // 隐藏"全部刮开"按钮
            const scratchAllBtn = document.getElementById('scratch-all-btn');
            if (scratchAllBtn) {
                scratchAllBtn.style.display = 'none';
            }

            // 延迟显示奖励结算
            setTimeout(() => {
                this.handleRewardSettlement();
            }, 1000);
        });
    }

    /**
     * 显示"全部刮开"按钮
     */
    showScratchAllButton() {
        const scratchAllBtn = document.getElementById('scratch-all-btn');
        if (scratchAllBtn) {
            scratchAllBtn.style.display = 'block';
            console.log('显示"全部刮开"按钮');
        }
    }

    /**
     * 全部刮开功能
     */
    scratchAll() {
        console.log('=== Canvas集成模块 scratchAll被调用 ===');
        console.log('引擎存在:', !!this.engine);
        console.log('引擎已初始化:', this.engine?.isInitialized);
        console.log('引擎图层状态:', this.engine?.layers);

        if (this.engine) {
            console.log('调用引擎的scratchAll方法');
            try {
                this.engine.scratchAll();
                console.log('引擎scratchAll调用成功');

                // 延迟进行奖励结算
                setTimeout(() => {
                    console.log('开始奖励结算...');
                    this.handleRewardSettlement();
                }, 500);
            } catch (error) {
                console.error('引擎scratchAll调用失败:', error);
                // 如果引擎调用失败，直接进行奖励结算
                this.handleRewardSettlement();
            }
        } else {
            console.log('引擎不存在，直接进行奖励结算');
            this.handleRewardSettlement();
        }
    }

    /**
     * 更新游戏控制按钮
     */
    updateScratchGameControls() {
        // 显示新游戏按钮
        const newGameBtn = document.getElementById('new-game-btn');
        if (newGameBtn) {
            newGameBtn.style.display = 'block';
        }

        // 隐藏全部刮开按钮（等待进度触发显示）
        const scratchAllBtn = document.getElementById('scratch-all-btn');
        if (scratchAllBtn) {
            scratchAllBtn.style.display = 'none';
        }
    }

    /**
     * 计算奖励金额
     */
    calculateRewards() {
        console.log('=== 开始计算奖励 ===');

        // 多重数据源检查，确保获取到正确的卡片数据
        let cardData = null;

        // 强制刷新数据源
        console.log('=== 数据源检查 ===');
        console.log('this.currentCardData:', this.currentCardData);
        console.log('window.currentScratchCard:', window.currentScratchCard);

        // 1. 优先使用保存的当前卡片数据
        if (this.currentCardData) {
            cardData = this.currentCardData;
            console.log('✅ 使用集成模块保存的卡片数据');
        }
        // 2. 使用全局卡片数据
        else if (window.currentScratchCard) {
            cardData = window.currentScratchCard;
            console.log('✅ 使用全局卡片数据');
        }

        console.log('=== 最终使用的卡片数据 ===', cardData);

        if (!cardData) {
            console.error('错误：没有找到任何卡片数据！');
            return { totalPoints: 0, items: [] };
        }

        let totalPoints = 0;
        const items = [];

        console.log('卡片是否中奖:', cardData.is_winner);
        console.log('奖品信息:', cardData.prize_info);

        // 检查是否中奖
        if (cardData.is_winner && cardData.prize_info) {
            const prizeInfo = cardData.prize_info;
            totalPoints = prizeInfo.credits || 0;

            console.log('从prize_info获取的奖励金额:', totalPoints);
            console.log('完整的prize_info:', prizeInfo);

            if (totalPoints > 0) {
                items.push({
                    name: prizeInfo.name || '奖金',
                    points: totalPoints,
                    type: 'points'
                });
            }
        } else {
            console.log('未中奖或没有奖品信息');
        }

        const result = { totalPoints, items };
        console.log('🏆 最终计算结果:', result);
        return result;
    }

    /**
     * 显示奖励弹窗
     */
    showRewardModal(rewards) {
        console.log('🎉 显示奖励弹窗:', rewards);

        // 移除已存在的弹窗
        const existingModal = document.getElementById('reward-modal');
        if (existingModal) {
            existingModal.remove();
        }

        const modal = document.createElement('div');
        modal.id = 'reward-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `;

        const content = document.createElement('div');
        content.style.cssText = `
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px;
            border-radius: 20px;
            text-align: center;
            color: white;
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
            max-width: 400px;
            width: 90%;
        `;

        let itemsHtml = '';
        if (rewards.items && rewards.items.length > 0) {
            itemsHtml = rewards.items.map(item => 
                `<div style="margin: 10px 0; font-size: 18px;">${item.name}: ${item.points} 元</div>`
            ).join('');
        }

        content.innerHTML = `
            <h2 style="margin: 0 0 20px 0; font-size: 24px;">🎉 恭喜中奖</h2>
            ${itemsHtml}
            <div style="font-size: 32px; font-weight: bold; margin: 20px 0; color: #FFD700;">
                总金额: ${rewards.totalPoints} 元
            </div>
            <button onclick="document.getElementById('reward-modal').remove()" style="
                background: #4CAF50;
                color: white;
                border: none;
                padding: 12px 30px;
                border-radius: 25px;
                font-size: 16px;
                cursor: pointer;
                margin-top: 20px;
            ">确定</button>
        `;

        modal.appendChild(content);
        document.body.appendChild(modal);
    }

    /**
     * 处理奖励结算
     */
    handleRewardSettlement() {
        console.log('🎯 开始奖励结算...');
        
        const rewards = this.calculateRewards();
        
        if (rewards.totalPoints > 0) {
            this.showRewardModal(rewards);
        } else {
            console.log('没有奖励，不显示弹窗');
        }
    }

    /**
     * 销毁集成系统
     */
    destroy() {
        console.log('Canvas刮奖集成系统已销毁');
    }
}

// 导出到全局
console.log('✅ CanvasScratchIntegration类定义完成');
window.CanvasScratchIntegration = CanvasScratchIntegration;
console.log('🧪 类已设置为全局变量:', !!window.CanvasScratchIntegration);

// 全局集成实例
let canvasScratchIntegration = null;

// 初始化函数
window.initializeCanvasIntegration = function() {
    console.log('=== 尝试初始化Canvas集成模块 ===');
    
    if (!canvasScratchIntegration) {
        console.log('=== 开始初始化Canvas集成模块 ===');
        try {
            canvasScratchIntegration = new CanvasScratchIntegration();
            window.canvasScratchIntegration = canvasScratchIntegration;
            console.log('✅ Canvas集成模块初始化成功');
            return true;
        } catch (error) {
            console.error('❌ Canvas集成模块初始化失败:', error);
            return false;
        }
    } else {
        console.log('ℹ️ Canvas集成模块已存在');
        return true;
    }
};

// 注意：不要在这里重新定义 startScratchCardGame 函数
// 该函数应该由 games.js 提供，以确保正确的API调用和数据流程

console.log('✅ Canvas刮奖集成模块(修复版)加载完成');

// 立即尝试初始化
setTimeout(() => {
    console.log('=== 文件加载完成后立即尝试初始化 ===');
    window.initializeCanvasIntegration();

    // 设置全局函数
    setupGlobalFunctions();
}, 100);

// 设置全局函数
function setupGlobalFunctions() {
    console.log('=== 设置全局函数 ===');

    // 全部刮开函数
    window.scratchAll = function() {
        console.log('=== 全局scratchAll函数被调用 ===');
        if (window.canvasScratchIntegration) {
            console.log('调用Canvas集成模块的scratchAll...');
            window.canvasScratchIntegration.scratchAll();
        } else {
            console.log('Canvas集成模块不存在');
        }
    };

    // 开始新游戏函数
    window.startNewGame = function() {
        console.log('=== 全局startNewGame函数被调用 ===');

        // 检查用户登录状态
        if (!window.currentUser) {
            console.log('❌ 用户未登录');
            if (window.showMessage) {
                window.showMessage('请先登录', 'error');
            }
            if (window.showLogin) {
                window.showLogin();
            }
            return;
        }

        // 检查模板是否存在
        if (!window.currentScratchTemplate) {
            console.log('❌ 当前模板不存在，尝试设置默认模板');
            // 尝试从游戏模板中获取第一个可用的模板
            if (window.gameTemplates && window.gameTemplates.scratchCard && window.gameTemplates.scratchCard.length > 0) {
                window.currentScratchTemplate = window.gameTemplates.scratchCard[0];
                console.log('✅ 使用默认模板:', window.currentScratchTemplate);
            } else {
                console.log('❌ 没有可用的游戏模板');
                if (window.showMessage) {
                    window.showMessage('没有可用的游戏模板，请刷新页面重试', 'error');
                }
                return;
            }
        }

        if (window.startScratchCardGame) {
            console.log('✅ 调用startScratchCardGame函数');
            window.startScratchCardGame();
        } else {
            console.log('❌ startScratchCardGame函数不存在');
            if (window.showMessage) {
                window.showMessage('游戏功能暂时不可用，请刷新页面重试', 'error');
            }
        }
    };

    // 显示刮刀设置函数
    window.showScratchSettings = function() {
        console.log('=== 显示刮刀设置 ===');
        const modal = document.getElementById('scratch-settings-modal');
        if (modal) {
            modal.style.display = 'flex';
        } else {
            console.log('刮刀设置模态框不存在');
            showMessage('刮刀设置功能暂时不可用', 'info');
        }
    };

    // 隐藏刮刀设置函数
    window.hideScratchSettings = function() {
        console.log('=== 隐藏刮刀设置 ===');
        const modal = document.getElementById('scratch-settings-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    };

    // 设置刮刀样式函数
    window.setScratchTool = function(toolType) {
        console.log('=== 设置刮刀样式 ===', toolType);

        // 更新按钮状态
        const buttons = document.querySelectorAll('[data-tool]');
        buttons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-tool') === toolType) {
                btn.classList.add('active');
            }
        });

        // 如果Canvas集成模块存在，设置光标样式
        if (window.canvasScratchIntegration && window.canvasScratchIntegration.engine) {
            window.canvasScratchIntegration.engine.setScratchCursor(toolType);
            console.log(`刮刀样式已设置为: ${toolType}`);
        } else {
            console.log('Canvas集成模块不存在，无法设置刮刀样式');
        }
    };

    // 设置刮刀硬度函数
    window.setScratchHardness = function(hardness) {
        console.log('=== 设置刮刀硬度 ===', hardness);

        // 更新按钮状态
        const buttons = document.querySelectorAll('[data-hardness]');
        buttons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-hardness') === hardness) {
                btn.classList.add('active');
            }
        });

        // 如果Canvas集成模块存在，设置硬度
        if (window.canvasScratchIntegration && window.canvasScratchIntegration.engine) {
            window.canvasScratchIntegration.engine.setScratchHardness(hardness);
            console.log(`刮刀硬度已设置为: ${hardness}`);
        } else {
            console.log('Canvas集成模块不存在，无法设置刮刀硬度');
        }
    };

    // 设置特效模式函数
    window.setScratchEffects = function(effectType) {
        console.log('=== 设置特效模式 ===', effectType);

        // 更新按钮状态
        const buttons = document.querySelectorAll('[data-effect]');
        buttons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-effect') === effectType) {
                btn.classList.add('active');
            }
        });

        // 如果Canvas集成模块存在，设置特效
        if (window.canvasScratchIntegration && window.canvasScratchIntegration.effects) {
            // 这里可以根据需要设置不同的特效模式
            // 目前先记录日志，后续可以扩展特效系统
            console.log(`特效模式已设置为: ${effectType}`);
            showMessage(`特效模式已切换为: ${effectType}`, 'info');
        } else {
            console.log('Canvas特效系统不存在，无法设置特效模式');
            showMessage('特效系统暂时不可用', 'info');
        }
    };

    console.log('✅ 全局函数设置完成');
}
