/**
 * Canvas刮奖性能优化模块
 * 提供性能监控、优化和兼容性处理
 */

class PerformanceOptimizer {
    constructor(engine) {
        this.engine = engine;
        this.performanceMetrics = {
            fps: 0,
            frameTime: 0,
            particleCount: 0,
            memoryUsage: 0,
            renderTime: 0
        };
        
        this.optimizationSettings = {
            maxParticles: 200,
            particlePoolSize: 500,
            enableObjectPooling: true,
            enableFrameSkipping: false,
            targetFPS: 60,
            lowPerformanceMode: false
        };
        
        this.deviceCapabilities = {
            isMobile: false,
            isLowEnd: false,
            supportsWebGL: false,
            maxTextureSize: 0,
            devicePixelRatio: 1
        };
        
        this.frameTimeHistory = [];
        this.lastFrameTime = 0;
        this.frameCount = 0;
        
        this.init();
    }
    
    /**
     * 初始化性能优化器
     */
    init() {
        this.detectDeviceCapabilities();
        this.setupPerformanceMonitoring();
        this.applyOptimizations();
        this.setupAdaptiveQuality();
        
        console.log('性能优化器已初始化', this.deviceCapabilities);
    }
    
    /**
     * 检测设备能力
     */
    detectDeviceCapabilities() {
        // 检测移动设备
        this.deviceCapabilities.isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        // 检测设备像素比
        this.deviceCapabilities.devicePixelRatio = window.devicePixelRatio || 1;
        
        // 检测WebGL支持
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            this.deviceCapabilities.supportsWebGL = !!gl;
            
            if (gl) {
                this.deviceCapabilities.maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
            }
        } catch (e) {
            this.deviceCapabilities.supportsWebGL = false;
        }
        
        // 检测低端设备
        this.detectLowEndDevice();
    }
    
    /**
     * 检测低端设备
     */
    detectLowEndDevice() {
        const indicators = {
            // 内存检测
            lowMemory: navigator.deviceMemory && navigator.deviceMemory < 4,
            
            // CPU核心数检测
            lowCPU: navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4,
            
            // 移动设备
            mobile: this.deviceCapabilities.isMobile,
            
            // 低像素密度
            lowDPI: this.deviceCapabilities.devicePixelRatio < 2
        };
        
        // 如果满足多个低端指标，认为是低端设备
        const lowEndScore = Object.values(indicators).filter(Boolean).length;
        this.deviceCapabilities.isLowEnd = lowEndScore >= 2;
        
        console.log('设备性能评估:', indicators, '低端设备:', this.deviceCapabilities.isLowEnd);
    }
    
    /**
     * 设置性能监控
     */
    setupPerformanceMonitoring() {
        // 监控帧率
        this.startFPSMonitoring();
        
        // 监控内存使用
        if (performance.memory) {
            setInterval(() => {
                this.performanceMetrics.memoryUsage = performance.memory.usedJSHeapSize / 1024 / 1024; // MB
            }, 1000);
        }
        
        // 监控渲染时间
        this.setupRenderTimeMonitoring();
    }
    
    /**
     * 开始FPS监控
     */
    startFPSMonitoring() {
        let lastTime = performance.now();
        let frameCount = 0;
        
        const measureFPS = (currentTime) => {
            frameCount++;
            
            if (currentTime - lastTime >= 1000) {
                this.performanceMetrics.fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
                this.performanceMetrics.frameTime = (currentTime - lastTime) / frameCount;
                
                // 记录帧时间历史
                this.frameTimeHistory.push(this.performanceMetrics.frameTime);
                if (this.frameTimeHistory.length > 60) {
                    this.frameTimeHistory.shift();
                }
                
                frameCount = 0;
                lastTime = currentTime;
                
                // 自适应质量调整
                this.adaptiveQualityAdjustment();
            }
            
            requestAnimationFrame(measureFPS);
        };
        
        requestAnimationFrame(measureFPS);
    }
    
    /**
     * 设置渲染时间监控
     */
    setupRenderTimeMonitoring() {
        if (this.engine && this.engine.animateParticles) {
            const originalAnimate = this.engine.animateParticles.bind(this.engine);
            
            this.engine.animateParticles = () => {
                const startTime = performance.now();
                originalAnimate();
                this.performanceMetrics.renderTime = performance.now() - startTime;
                this.performanceMetrics.particleCount = this.engine.particles.length;
            };
        }
    }
    
    /**
     * 应用性能优化
     */
    applyOptimizations() {
        if (this.deviceCapabilities.isLowEnd || this.deviceCapabilities.isMobile) {
            this.enableLowPerformanceMode();
        }
        
        // 对象池优化
        if (this.optimizationSettings.enableObjectPooling) {
            this.setupObjectPooling();
        }
        
        // Canvas优化
        this.optimizeCanvasSettings();
    }
    
    /**
     * 启用低性能模式
     */
    enableLowPerformanceMode() {
        this.optimizationSettings.lowPerformanceMode = true;
        this.optimizationSettings.maxParticles = 50;
        this.optimizationSettings.targetFPS = 30;
        
        if (this.engine) {
            this.engine.options.enableParticles = false;
            this.engine.options.enableGlow = false;
            this.engine.options.scratchRadius = Math.max(15, this.engine.options.scratchRadius * 0.7);
        }
        
        console.log('已启用低性能模式');
    }
    
    /**
     * 设置对象池
     */
    setupObjectPooling() {
        this.particlePool = [];
        
        // 预创建粒子对象
        for (let i = 0; i < this.optimizationSettings.particlePoolSize; i++) {
            this.particlePool.push({
                x: 0, y: 0, vx: 0, vy: 0,
                size: 0, color: '', life: 0,
                decay: 0, active: false
            });
        }
    }
    
    /**
     * 从对象池获取粒子
     */
    getParticleFromPool() {
        for (let particle of this.particlePool) {
            if (!particle.active) {
                particle.active = true;
                return particle;
            }
        }
        
        // 如果池中没有可用对象，创建新的
        return {
            x: 0, y: 0, vx: 0, vy: 0,
            size: 0, color: '', life: 0,
            decay: 0, active: true
        };
    }
    
    /**
     * 回收粒子到对象池
     */
    recycleParticle(particle) {
        particle.active = false;
        particle.life = 0;
    }
    
    /**
     * 优化Canvas设置
     */
    optimizeCanvasSettings() {
        if (!this.engine || !this.engine.layers) return;
        
        Object.values(this.engine.layers).forEach(layer => {
            if (layer.ctx) {
                // 禁用抗锯齿（提高性能）
                if (this.optimizationSettings.lowPerformanceMode) {
                    layer.ctx.imageSmoothingEnabled = false;
                }
                
                // 设置合适的像素比
                const ratio = Math.min(this.deviceCapabilities.devicePixelRatio, 2);
                if (ratio !== 1) {
                    const canvas = layer.canvas;
                    const rect = canvas.getBoundingClientRect();
                    canvas.width = rect.width * ratio;
                    canvas.height = rect.height * ratio;
                    canvas.style.width = rect.width + 'px';
                    canvas.style.height = rect.height + 'px';
                    layer.ctx.scale(ratio, ratio);
                }
            }
        });
    }
    
    /**
     * 设置自适应质量
     */
    setupAdaptiveQuality() {
        this.qualityLevels = {
            high: {
                maxParticles: 200,
                enableGlow: true,
                enableParticles: true,
                scratchRadius: 25
            },
            medium: {
                maxParticles: 100,
                enableGlow: true,
                enableParticles: true,
                scratchRadius: 20
            },
            low: {
                maxParticles: 50,
                enableGlow: false,
                enableParticles: true,
                scratchRadius: 15
            },
            minimal: {
                maxParticles: 20,
                enableGlow: false,
                enableParticles: false,
                scratchRadius: 10
            }
        };
        
        this.currentQuality = this.deviceCapabilities.isLowEnd ? 'low' : 'high';
        this.applyQualitySettings(this.currentQuality);
    }
    
    /**
     * 应用质量设置
     */
    applyQualitySettings(quality) {
        const settings = this.qualityLevels[quality];
        if (!settings || !this.engine) return;
        
        this.optimizationSettings.maxParticles = settings.maxParticles;
        this.engine.options.enableGlow = settings.enableGlow;
        this.engine.options.enableParticles = settings.enableParticles;
        this.engine.options.scratchRadius = settings.scratchRadius;
        
        console.log(`已应用${quality}质量设置:`, settings);
    }
    
    /**
     * 自适应质量调整
     */
    adaptiveQualityAdjustment() {
        if (this.frameTimeHistory.length < 10) return;
        
        const avgFrameTime = this.frameTimeHistory.reduce((a, b) => a + b, 0) / this.frameTimeHistory.length;
        const targetFrameTime = 1000 / this.optimizationSettings.targetFPS;
        
        // 如果帧时间过长，降低质量
        if (avgFrameTime > targetFrameTime * 1.5) {
            this.downgradeQuality();
        }
        // 如果性能良好，可以提升质量
        else if (avgFrameTime < targetFrameTime * 0.7) {
            this.upgradeQuality();
        }
    }
    
    /**
     * 降低质量
     */
    downgradeQuality() {
        const qualities = ['high', 'medium', 'low', 'minimal'];
        const currentIndex = qualities.indexOf(this.currentQuality);
        
        if (currentIndex < qualities.length - 1) {
            this.currentQuality = qualities[currentIndex + 1];
            this.applyQualitySettings(this.currentQuality);
            console.log('性能不足，降低质量至:', this.currentQuality);
        }
    }
    
    /**
     * 提升质量
     */
    upgradeQuality() {
        const qualities = ['minimal', 'low', 'medium', 'high'];
        const currentIndex = qualities.indexOf(this.currentQuality);
        
        if (currentIndex < qualities.length - 1) {
            this.currentQuality = qualities[currentIndex + 1];
            this.applyQualitySettings(this.currentQuality);
            console.log('性能良好，提升质量至:', this.currentQuality);
        }
    }
    
    /**
     * 粒子数量限制
     */
    limitParticles() {
        if (this.engine && this.engine.particles) {
            while (this.engine.particles.length > this.optimizationSettings.maxParticles) {
                const particle = this.engine.particles.shift();
                if (this.optimizationSettings.enableObjectPooling) {
                    this.recycleParticle(particle);
                }
            }
        }
    }
    
    /**
     * 获取性能报告
     */
    getPerformanceReport() {
        return {
            metrics: { ...this.performanceMetrics },
            deviceCapabilities: { ...this.deviceCapabilities },
            currentQuality: this.currentQuality,
            optimizationSettings: { ...this.optimizationSettings }
        };
    }
    
    /**
     * 手动设置质量
     */
    setQuality(quality) {
        if (this.qualityLevels[quality]) {
            this.currentQuality = quality;
            this.applyQualitySettings(quality);
            console.log('手动设置质量为:', quality);
        }
    }
    
    /**
     * 暂停性能监控
     */
    pauseMonitoring() {
        this.monitoringPaused = true;
    }
    
    /**
     * 恢复性能监控
     */
    resumeMonitoring() {
        this.monitoringPaused = false;
    }
    
    /**
     * 销毁优化器
     */
    destroy() {
        this.frameTimeHistory = [];
        this.particlePool = [];
        console.log('性能优化器已销毁');
    }
}

// 导出类
window.PerformanceOptimizer = PerformanceOptimizer;

console.log('性能优化模块已加载');
