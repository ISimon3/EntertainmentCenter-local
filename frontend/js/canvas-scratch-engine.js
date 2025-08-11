/**
 * Canvas刮奖引擎 - 核心架构
 * 提供真实的刮奖体验，支持多种视觉效果和动画
 */

class CanvasScratchEngine {
    constructor(container, options = {}) {
        this.container = container;

        // 初始化兼容性处理器
        this.compatibilityHandler = new CompatibilityHandler();

        // 获取推荐配置
        const recommendedConfig = this.compatibilityHandler.getRecommendedConfig();

        this.options = {
            width: options.width || 600,
            height: options.height || 400,
            scratchRadius: options.scratchRadius || recommendedConfig.scratchRadius,
            scratchThreshold: options.scratchThreshold || 0.98, // 刮开阈值（提高到98%避免自动触发）
            enableParticles: false, // 禁用粒子效果以节省内存
            enableGlow: false, // 禁用光晕效果
            enableSound: options.enableSound !== undefined ? options.enableSound : false,
            maxParticles: 0, // 最大粒子数设为0
            ...options
        };

        this.isInitialized = false;
        this.isScratching = false;
        this.scratchedPixels = 0;
        this.totalPixels = 0;
        this.scratchProgress = 0;

        // 性能优化器
        this.performanceOptimizer = null;
        
        // Canvas图层
        this.layers = {
            background: null,    // 背景层（奖品内容）
            scratch: null,       // 刮奖层（涂层）
            particles: null,     // 粒子效果层
            ui: null            // UI层（按钮、文字等）
        };
        
        // 事件回调
        this.callbacks = {
            onScratchStart: null,
            onScratchProgress: null,
            onScratchComplete: null,
            onAreaRevealed: null
        };
        
        // 粒子系统
        this.particles = [];
        this.animationFrame = null;
        
        this.init();
    }
    
    /**
     * 初始化Canvas引擎
     */
    init() {
        // 检查兼容性
        if (!this.compatibilityHandler.supportedFeatures.canvas) {
            this.initFallback();
            return;
        }

        this.createCanvasLayers();
        this.setupEventListeners();

        // 初始化性能优化器
        if (window.PerformanceOptimizer) {
            this.performanceOptimizer = new PerformanceOptimizer(this);
        }

        // 应用兼容性修复
        this.compatibilityHandler.applyCompatibilityFixes(this);

        this.isInitialized = true;
        console.log('Canvas刮奖引擎初始化完成');
    }

    /**
     * 初始化回退方案
     */
    initFallback() {
        if (window.CanvasFallback) {
            window.CanvasFallback.create(this.container, this.options);
        } else {
            this.container.innerHTML = '<div style="text-align: center; padding: 50px; color: #666;">您的浏览器不支持Canvas，请升级浏览器</div>';
        }
        console.warn('使用Canvas回退方案');
    }
    
    /**
     * 创建Canvas图层
     */
    createCanvasLayers() {
        console.log('=== 开始创建Canvas图层 ===');
        const { width, height } = this.options;
        console.log('Canvas尺寸:', width, 'x', height);
        console.log('容器存在:', !!this.container);

        // 创建主容器
        this.container.style.position = 'relative';
        this.container.style.width = `${width}px`;
        this.container.style.height = `${height}px`;
        this.container.innerHTML = '';

        // 创建各个图层
        const layerNames = ['background', 'scratch', 'particles', 'ui'];
        layerNames.forEach((name, index) => {
            console.log(`创建${name}图层...`);
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            canvas.style.position = 'absolute';
            canvas.style.left = '0';
            canvas.style.top = '0';
            canvas.style.zIndex = index;
            canvas.style.pointerEvents = name === 'scratch' ? 'auto' : 'none';

            this.container.appendChild(canvas);
            const ctx = canvas.getContext('2d');
            this.layers[name] = {
                canvas: canvas,
                ctx: ctx
            };
            console.log(`${name}图层创建完成:`, !!this.layers[name], !!this.layers[name].ctx);
        });

        // 设置刮奖层为可交互
        this.layers.scratch.canvas.style.pointerEvents = 'auto';

        // 设置自定义刮刀光标
        this.setScratchCursor('default');

        console.log('✅ 所有Canvas图层创建完成');
        console.log('最终layers状态:', Object.keys(this.layers));
    }
    
    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        const scratchCanvas = this.layers.scratch.canvas;
        
        // 鼠标事件
        scratchCanvas.addEventListener('mousedown', this.handleScratchStart.bind(this));
        scratchCanvas.addEventListener('mousemove', this.handleScratchMove.bind(this));
        scratchCanvas.addEventListener('mouseup', this.handleScratchEnd.bind(this));
        scratchCanvas.addEventListener('mouseleave', this.handleScratchEnd.bind(this));
        
        // 触摸事件（移动设备支持）
        scratchCanvas.addEventListener('touchstart', this.handleTouchStart.bind(this));
        scratchCanvas.addEventListener('touchmove', this.handleTouchMove.bind(this));
        scratchCanvas.addEventListener('touchend', this.handleScratchEnd.bind(this));
        
        // 防止默认的触摸行为
        scratchCanvas.addEventListener('touchstart', e => e.preventDefault());
        scratchCanvas.addEventListener('touchmove', e => e.preventDefault());
    }
    
    /**
     * 加载刮刮乐卡片
     */
    loadScratchCard(cardData, template) {
        console.log('=== Canvas引擎加载卡片数据 ===');
        console.log('传入的cardData:', cardData);
        console.log('传入的template:', template);

        this.cardData = cardData;
        this.template = template;

        console.log('引擎保存的cardData:', this.cardData);
        console.log('卡片是否中奖:', this.cardData?.is_winner);
        console.log('奖品信息:', this.cardData?.prize_info);

        // 绘制背景层（奖品内容）
        this.drawBackground();

        // 绘制刮奖层（涂层）
        this.drawScratchLayer();

        // 重置统计数据
        this.scratchedPixels = 0;
        this.scratchProgress = 0;
        this.lastReportedProgress = 0; // 记录上次报告的进度
        this.calculateTotalPixels();

        console.log('刮刮乐卡片加载完成，总像素数:', this.totalPixels);
    }
    
    /**
     * 绘制背景层（奖品内容）
     */
    drawBackground() {
        const ctx = this.layers.background.ctx;
        const { width, height } = this.options;
        
        // 清空画布
        ctx.clearRect(0, 0, width, height);
        
        // 绘制卡片背景
        if (width > 0 && height > 0) {
            // 创建更美观的渐变背景
            const gradient = ctx.createLinearGradient(0, 0, width, height);
            gradient.addColorStop(0, '#667eea');
            gradient.addColorStop(0.5, '#764ba2');
            gradient.addColorStop(1, '#667eea');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);

            // 添加内边框效果
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3;
            ctx.strokeRect(5, 5, width - 10, height - 10);
        } else {
            // 如果尺寸无效，使用纯色背景
            ctx.fillStyle = '#667eea';
            ctx.fillRect(0, 0, width, height);
        }
        
        // 绘制奖品区域
        this.drawPrizeAreas();
    }
    
    /**
     * 绘制奖品区域
     */
    drawPrizeAreas() {
        const ctx = this.layers.background.ctx;
        const { areas } = this.cardData;

        // 检查模板是否存在，如果不存在则使用默认值
        const layout = this.template?.layout || { cols: 6, rows: 5 };

        const cols = layout.cols || 6;
        const rows = layout.rows || 5;
        const areaWidth = (this.options.width - 40) / cols;
        const areaHeight = (this.options.height - 40) / rows;
        
        areas.forEach((area, index) => {
            const col = index % cols;
            const row = Math.floor(index / cols);
            const x = 20 + col * areaWidth;
            const y = 20 + row * areaHeight;
            
            // 绘制区域背景（带圆角效果）
            const padding = 3;
            const cornerRadius = 8;
            const rectX = x + padding;
            const rectY = y + padding;
            const rectWidth = areaWidth - padding * 2;
            const rectHeight = areaHeight - padding * 2;

            // 绘制圆角矩形背景
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            // 手动绘制圆角矩形（兼容性更好）
            ctx.moveTo(rectX + cornerRadius, rectY);
            ctx.lineTo(rectX + rectWidth - cornerRadius, rectY);
            ctx.quadraticCurveTo(rectX + rectWidth, rectY, rectX + rectWidth, rectY + cornerRadius);
            ctx.lineTo(rectX + rectWidth, rectY + rectHeight - cornerRadius);
            ctx.quadraticCurveTo(rectX + rectWidth, rectY + rectHeight, rectX + rectWidth - cornerRadius, rectY + rectHeight);
            ctx.lineTo(rectX + cornerRadius, rectY + rectHeight);
            ctx.quadraticCurveTo(rectX, rectY + rectHeight, rectX, rectY + rectHeight - cornerRadius);
            ctx.lineTo(rectX, rectY + cornerRadius);
            ctx.quadraticCurveTo(rectX, rectY, rectX + cornerRadius, rectY);
            ctx.closePath();
            ctx.fill();

            // 绘制边框
            ctx.strokeStyle = '#e0e0e0';
            ctx.lineWidth = 2;
            ctx.stroke();

            // 绘制奖品内容
            const isWinning = area.content !== '谢谢参与';
            ctx.fillStyle = isWinning ? '#ff6b35' : '#6c757d';
            ctx.font = 'bold 12px "Microsoft YaHei", Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(
                area.content,
                x + areaWidth / 2,
                y + areaHeight / 2
            );
        });
    }
    
    /**
     * 绘制刮奖层（涂层）
     */
    drawScratchLayer() {
        const ctx = this.layers.scratch.ctx;
        const { width, height } = this.options;
        
        // 创建银色涂层效果
        if (width > 0 && height > 0) {
            const gradient = ctx.createLinearGradient(0, 0, width, height);
            gradient.addColorStop(0, '#c0c0c0');
            gradient.addColorStop(0.5, '#e0e0e0');
            gradient.addColorStop(1, '#a0a0a0');
            ctx.fillStyle = gradient;
        } else {
            // 如果尺寸无效，使用纯色
            ctx.fillStyle = '#c0c0c0';
        }
        ctx.fillRect(0, 0, width, height);
        
        // 添加纹理效果
        this.addScratchTexture(ctx);
        
        // 添加提示文字
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('刮开涂层查看奖品', width / 2, height / 2);
    }
    
    /**
     * 添加刮奖涂层纹理
     */
    addScratchTexture(ctx) {
        const { width, height } = this.options;
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        
        // 添加随机噪点纹理
        for (let i = 0; i < data.length; i += 4) {
            const noise = Math.random() * 30 - 15;
            data[i] = Math.max(0, Math.min(255, data[i] + noise));     // R
            data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise)); // G
            data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise)); // B
        }
        
        ctx.putImageData(imageData, 0, 0);
    }
    
    /**
     * 计算总像素数
     */
    calculateTotalPixels() {
        const { width, height } = this.options;
        this.totalPixels = width * height;
    }
    
    /**
     * 获取鼠标/触摸位置
     */
    getEventPosition(event) {
        const rect = this.layers.scratch.canvas.getBoundingClientRect();
        const clientX = event.clientX || (event.touches && event.touches[0].clientX);
        const clientY = event.clientY || (event.touches && event.touches[0].clientY);
        
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    }
    
    /**
     * 处理刮奖开始
     */
    handleScratchStart(event) {
        this.isScratching = true;
        const pos = this.getEventPosition(event);
        this.performScratch(pos.x, pos.y);
        
        if (this.callbacks.onScratchStart) {
            this.callbacks.onScratchStart(pos);
        }
    }
    
    /**
     * 处理触摸开始
     */
    handleTouchStart(event) {
        event.preventDefault();
        this.handleScratchStart(event);
    }
    
    /**
     * 处理刮奖移动
     */
    handleScratchMove(event) {
        if (!this.isScratching) return;
        
        const pos = this.getEventPosition(event);
        this.performScratch(pos.x, pos.y);
    }
    
    /**
     * 处理触摸移动
     */
    handleTouchMove(event) {
        event.preventDefault();
        this.handleScratchMove(event);
    }
    
    /**
     * 处理刮奖结束
     */
    handleScratchEnd(event) {
        this.isScratching = false;
    }
    
    /**
     * 执行刮奖操作
     */
    performScratch(x, y) {
        const ctx = this.layers.scratch.ctx;
        const radius = this.options.scratchRadius;
        
        // 设置合成模式为擦除
        ctx.globalCompositeOperation = 'destination-out';
        
        // 绘制圆形擦除区域
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.fill();
        
        // 恢复合成模式
        ctx.globalCompositeOperation = 'source-over';
        
        // 禁用粒子效果以节省内存
        // if (this.options.enableParticles) {
        //     this.generateScratchParticles(x, y);
        // }

        // 更新刮奖进度
        this.updateScratchProgress();
    }
    
    /**
     * 生成刮奖粒子效果
     */
    generateScratchParticles(x, y) {
        // 如果有增强效果系统，使用高级粒子
        if (this.effects) {
            this.particles.push(...this.effects.createAdvancedParticles(x, y, 'scratch'));
            this.effects.createScratchTrail(x, y, this.lastScratchX, this.lastScratchY);
            this.effects.playSound('scratch');
        } else {
            // 基础粒子效果
            const particleCount = 5;
            for (let i = 0; i < particleCount; i++) {
                this.particles.push({
                    x: x + (Math.random() - 0.5) * 20,
                    y: y + (Math.random() - 0.5) * 20,
                    vx: (Math.random() - 0.5) * 4,
                    vy: (Math.random() - 0.5) * 4,
                    life: 1.0,
                    decay: 0.02,
                    size: Math.random() * 3 + 1,
                    color: `hsl(${Math.random() * 60 + 30}, 70%, 60%)`
                });
            }
        }

        // 记录刮奖位置
        this.lastScratchX = x;
        this.lastScratchY = y;

        // 启动粒子动画
        if (!this.animationFrame) {
            this.animateParticles();
        }
    }
    
    /**
     * 粒子动画
     */
    animateParticles() {
        const ctx = this.layers.particles.ctx;
        const { width, height } = this.options;

        // 清空粒子层
        ctx.clearRect(0, 0, width, height);

        // 绘制光晕效果（如果有增强效果系统）
        if (this.effects) {
            this.effects.drawGlowEffects(ctx);
        }

        // 更新和绘制粒子
        this.particles = this.particles.filter(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life -= particle.decay;

            // 应用重力（如果有）
            if (particle.gravity) {
                particle.vy += particle.gravity;
            }

            // 应用旋转（如果有）
            if (particle.rotationSpeed) {
                particle.rotation += particle.rotationSpeed;
            }

            if (particle.life > 0) {
                if (this.effects && particle.maxLife) {
                    // 使用增强粒子绘制
                    this.effects.drawAdvancedParticle(ctx, particle);
                } else {
                    // 基础粒子绘制
                    ctx.save();
                    ctx.globalAlpha = particle.life;
                    ctx.fillStyle = particle.color;
                    ctx.beginPath();
                    ctx.arc(particle.x, particle.y, particle.size, 0, 2 * Math.PI);
                    ctx.fill();
                    ctx.restore();
                }
                return true;
            }
            return false;
        });

        // 继续动画或停止
        if (this.particles.length > 0 || (this.effects && this.effects.glowAnimations.length > 0)) {
            this.animationFrame = requestAnimationFrame(() => this.animateParticles());
        } else {
            this.animationFrame = null;
        }
    }
    
    /**
     * 更新刮奖进度
     */
    updateScratchProgress() {
        // 计算已刮开的像素数
        const ctx = this.layers.scratch.ctx;
        const { width, height } = this.options;
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        let transparentPixels = 0;
        let totalPixels = 0;

        // 采样检测，提高性能并减少误差
        const sampleRate = 4; // 每4个像素检测一次
        for (let i = 3; i < data.length; i += 4 * sampleRate) {
            totalPixels++;
            if (data[i] < 10) { // Alpha通道小于10认为是完全透明
                transparentPixels++;
            }
        }

        this.scratchedPixels = transparentPixels;
        this.scratchProgress = totalPixels > 0 ? transparentPixels / totalPixels : 0;

        console.log(`刮奖进度: ${Math.round(this.scratchProgress * 100)}% (${transparentPixels}/${totalPixels})`);

        // 触发进度回调（只有在进度有显著变化时才触发）
        const progressDiff = Math.abs(this.scratchProgress - this.lastReportedProgress);
        if (this.callbacks.onScratchProgress &&
            this.scratchProgress > 0.01 &&
            progressDiff > 0.02) { // 进度变化超过2%才触发
            this.callbacks.onScratchProgress(this.scratchProgress);
            this.lastReportedProgress = this.scratchProgress;
        }

        // 检查是否完成刮奖（设置更高的阈值，避免自动触发）
        if (this.scratchProgress >= 0.98) { // 提高到98%才自动完成
            this.completeScratch();
        }
    }
    
    /**
     * 完成刮奖
     */
    completeScratch() {
        // 清除刮奖层，完全显示奖品
        const ctx = this.layers.scratch.ctx;
        const { width, height } = this.options;
        ctx.clearRect(0, 0, width, height);

        // 禁用所有特效以节省内存
        // if (this.effects) {
        //     this.effects.createCompletionAnimation();
        //     if (this.cardData.is_winner) {
        //         setTimeout(() => {
        //             this.effects.createWinCelebration(width / 2, height / 2);
        //         }, 500);
        //     }
        // }

        // 触发完成回调
        console.log('=== Canvas引擎刮奖完成 ===');
        console.log('回调函数存在:', !!this.callbacks.onScratchComplete);
        console.log('卡片数据:', this.cardData);

        if (this.callbacks.onScratchComplete) {
            console.log('调用完成回调...');
            this.callbacks.onScratchComplete(this.cardData);
        } else {
            console.log('没有设置完成回调函数');
        }

        console.log('刮奖完成！');
    }
    
    /**
     * 全部刮开（只清除涂层，不触发完成回调）
     */
    scratchAll() {
        console.log('=== Canvas引擎 scratchAll被调用 ===');
        console.log('layers存在:', !!this.layers);
        console.log('scratch层存在:', !!this.layers?.scratch);
        console.log('scratch ctx存在:', !!this.layers?.scratch?.ctx);

        // 安全检查
        if (!this.layers || !this.layers.scratch || !this.layers.scratch.ctx) {
            console.error('❌ Canvas图层未正确初始化，无法执行scratchAll');
            console.log('当前layers状态:', this.layers);
            return;
        }

        // 只清除刮奖层，显示奖品
        const ctx = this.layers.scratch.ctx;
        const { width, height } = this.options;
        ctx.clearRect(0, 0, width, height);

        // 更新进度为100%
        this.scratchProgress = 1.0;
        this.scratchedPixels = this.totalPixels;

        console.log('✅ 全部刮开完成');

        // 注意：这里不调用 completeScratch()，避免触发完成回调
        // 由集成层来处理后续的结算逻辑
    }
    
    /**
     * 设置增强效果系统
     */
    setEffects(effects) {
        this.effects = effects;
    }

    /**
     * 设置刮刀光标样式
     */
    setScratchCursor(cursorType = 'default') {
        const canvas = this.layers.scratch.canvas;

        const cursors = {
            default: 'url("data:image/svg+xml;charset=utf8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'32\' height=\'32\' viewBox=\'0 0 32 32\'%3E%3Ccircle cx=\'16\' cy=\'16\' r=\'12\' fill=\'%23ff6b35\' stroke=\'%23fff\' stroke-width=\'2\'/%3E%3Ccircle cx=\'16\' cy=\'16\' r=\'6\' fill=\'%23fff\' opacity=\'0.8\'/%3E%3C/svg%3E") 16 16, crosshair',

            coin: 'url("data:image/svg+xml;charset=utf8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'32\' height=\'32\' viewBox=\'0 0 32 32\'%3E%3Ccircle cx=\'16\' cy=\'16\' r=\'14\' fill=\'%23ffd700\' stroke=\'%23ffed4e\' stroke-width=\'2\'/%3E%3Ctext x=\'16\' y=\'20\' text-anchor=\'middle\' font-family=\'Arial\' font-size=\'12\' fill=\'%23b8860b\'%3E¥%3C/text%3E%3C/svg%3E") 16 16, crosshair',

            brush: 'url("data:image/svg+xml;charset=utf8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'32\' height=\'32\' viewBox=\'0 0 32 32\'%3E%3Cpath d=\'M8 24 L16 8 L24 24 Z\' fill=\'%23654321\' stroke=\'%238B4513\' stroke-width=\'1\'/%3E%3Cpath d=\'M14 24 L18 24 L18 28 L14 28 Z\' fill=\'%23C0C0C0\'/%3E%3C/svg%3E") 16 16, crosshair',

            diamond: 'url("data:image/svg+xml;charset=utf8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'32\' height=\'32\' viewBox=\'0 0 32 32\'%3E%3Cpath d=\'M16 4 L24 12 L16 28 L8 12 Z\' fill=\'%23e0e0e0\' stroke=\'%23c0c0c0\' stroke-width=\'2\'/%3E%3Cpath d=\'M16 4 L20 8 L16 16 L12 8 Z\' fill=\'%23f0f0f0\'/%3E%3C/svg%3E") 16 16, crosshair',

            finger: 'url("data:image/svg+xml;charset=utf8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'32\' height=\'32\' viewBox=\'0 0 32 32\'%3E%3Cpath d=\'M12 8 Q12 6 14 6 Q16 6 16 8 L16 16 L14 20 L10 20 Q8 20 8 18 L8 14 Q8 12 10 12 L12 12 Z\' fill=\'%23FDBCB4\' stroke=\'%23E1A692\' stroke-width=\'1\'/%3E%3C/svg%3E") 16 16, crosshair'
        };

        canvas.style.cursor = cursors[cursorType] || cursors.default;
    }

    /**
     * 设置刮除半径
     */
    setScratchRadius(radius) {
        this.options.scratchRadius = radius;
        console.log(`刮除半径已更新为: ${radius}px`);
    }

    /**
     * 设置刮刀硬度（影响刮除半径）
     */
    setScratchHardness(hardness = 'medium') {
        const hardnessMap = {
            soft: 35,
            medium: 25,
            hard: 15,
            ultra: 8
        };

        this.options.scratchRadius = hardnessMap[hardness] || hardnessMap.medium;
        console.log(`刮刀硬度设置为: ${hardness} (半径: ${this.options.scratchRadius})`);
    }

    /**
     * 设置事件回调
     */
    setCallback(event, callback) {
        if (this.callbacks.hasOwnProperty(event)) {
            this.callbacks[event] = callback;
        }
    }

    /**
     * 获取刮奖进度
     */
    getScratchProgress() {
        return this.scratchProgress;
    }

    /**
     * 检查指定区域是否已刮开
     */
    isAreaScratched(areaIndex) {
        if (!this.cardData || !this.cardData.areas[areaIndex]) {
            return false;
        }
        return this.cardData.areas[areaIndex].is_scratched;
    }

    /**
     * 销毁引擎
     */
    destroy() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        if (this.effects) {
            this.effects.destroy();
        }
        if (this.performanceOptimizer) {
            this.performanceOptimizer.destroy();
        }
        this.container.innerHTML = '';
        this.isInitialized = false;
        console.log('Canvas刮奖引擎已销毁');
    }
}

// 导出引擎类
window.CanvasScratchEngine = CanvasScratchEngine;

console.log('Canvas刮奖引擎模块已加载');
