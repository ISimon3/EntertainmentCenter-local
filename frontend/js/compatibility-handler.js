/**
 * 兼容性处理模块
 * 处理不同浏览器和设备的兼容性问题
 */

class CompatibilityHandler {
    constructor() {
        this.browserInfo = {};
        this.supportedFeatures = {};
        this.polyfills = {};
        
        this.init();
    }
    
    /**
     * 初始化兼容性处理
     */
    init() {
        this.detectBrowser();
        this.checkFeatureSupport();
        this.loadPolyfills();
        this.setupFallbacks();
        
        console.log('兼容性处理器已初始化', {
            browser: this.browserInfo,
            features: this.supportedFeatures
        });
    }
    
    /**
     * 检测浏览器信息
     */
    detectBrowser() {
        const ua = navigator.userAgent;
        
        this.browserInfo = {
            isChrome: /Chrome/.test(ua) && !/Edge/.test(ua),
            isFirefox: /Firefox/.test(ua),
            isSafari: /Safari/.test(ua) && !/Chrome/.test(ua),
            isEdge: /Edge/.test(ua) || /Edg/.test(ua),
            isIE: /MSIE|Trident/.test(ua),
            isMobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua),
            isIOS: /iPad|iPhone|iPod/.test(ua),
            isAndroid: /Android/.test(ua),
            version: this.getBrowserVersion(ua)
        };
    }
    
    /**
     * 获取浏览器版本
     */
    getBrowserVersion(ua) {
        let version = 'unknown';
        
        if (this.browserInfo.isChrome) {
            const match = ua.match(/Chrome\/(\d+)/);
            version = match ? parseInt(match[1]) : 'unknown';
        } else if (this.browserInfo.isFirefox) {
            const match = ua.match(/Firefox\/(\d+)/);
            version = match ? parseInt(match[1]) : 'unknown';
        } else if (this.browserInfo.isSafari) {
            const match = ua.match(/Version\/(\d+)/);
            version = match ? parseInt(match[1]) : 'unknown';
        } else if (this.browserInfo.isEdge) {
            const match = ua.match(/(?:Edge|Edg)\/(\d+)/);
            version = match ? parseInt(match[1]) : 'unknown';
        }
        
        return version;
    }
    
    /**
     * 检查功能支持
     */
    checkFeatureSupport() {
        this.supportedFeatures = {
            // Canvas支持
            canvas: this.checkCanvasSupport(),
            
            // Canvas 2D Context支持
            canvas2d: this.checkCanvas2DSupport(),
            
            // WebGL支持
            webgl: this.checkWebGLSupport(),
            
            // 音频支持
            audioContext: this.checkAudioContextSupport(),
            
            // 触摸事件支持
            touchEvents: this.checkTouchEventsSupport(),
            
            // 指针事件支持
            pointerEvents: this.checkPointerEventsSupport(),
            
            // requestAnimationFrame支持
            requestAnimationFrame: this.checkRequestAnimationFrameSupport(),
            
            // 性能API支持
            performance: this.checkPerformanceAPISupport(),
            
            // 设备内存API支持
            deviceMemory: 'deviceMemory' in navigator,
            
            // 硬件并发API支持
            hardwareConcurrency: 'hardwareConcurrency' in navigator
        };
    }
    
    /**
     * 检查Canvas支持
     */
    checkCanvasSupport() {
        try {
            const canvas = document.createElement('canvas');
            return !!(canvas.getContext && canvas.getContext('2d'));
        } catch (e) {
            return false;
        }
    }
    
    /**
     * 检查Canvas 2D Context支持
     */
    checkCanvas2DSupport() {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            return !!(ctx && typeof ctx.fillRect === 'function');
        } catch (e) {
            return false;
        }
    }
    
    /**
     * 检查WebGL支持
     */
    checkWebGLSupport() {
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            return !!gl;
        } catch (e) {
            return false;
        }
    }
    
    /**
     * 检查AudioContext支持
     */
    checkAudioContextSupport() {
        return !!(window.AudioContext || window.webkitAudioContext);
    }
    
    /**
     * 检查触摸事件支持
     */
    checkTouchEventsSupport() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }
    
    /**
     * 检查指针事件支持
     */
    checkPointerEventsSupport() {
        return 'onpointerdown' in window;
    }
    
    /**
     * 检查requestAnimationFrame支持
     */
    checkRequestAnimationFrameSupport() {
        return !!(window.requestAnimationFrame || 
                 window.webkitRequestAnimationFrame || 
                 window.mozRequestAnimationFrame || 
                 window.msRequestAnimationFrame);
    }
    
    /**
     * 检查性能API支持
     */
    checkPerformanceAPISupport() {
        return !!(window.performance && window.performance.now);
    }
    
    /**
     * 加载Polyfills
     */
    loadPolyfills() {
        // requestAnimationFrame polyfill
        if (!this.supportedFeatures.requestAnimationFrame) {
            this.polyfills.requestAnimationFrame = this.createRequestAnimationFramePolyfill();
        }
        
        // performance.now polyfill
        if (!this.supportedFeatures.performance) {
            this.polyfills.performanceNow = this.createPerformanceNowPolyfill();
        }
        
        // AudioContext polyfill
        if (!this.supportedFeatures.audioContext && window.webkitAudioContext) {
            window.AudioContext = window.webkitAudioContext;
        }
    }
    
    /**
     * 创建requestAnimationFrame polyfill
     */
    createRequestAnimationFramePolyfill() {
        let lastTime = 0;
        
        window.requestAnimationFrame = function(callback) {
            const currTime = new Date().getTime();
            const timeToCall = Math.max(0, 16 - (currTime - lastTime));
            const id = window.setTimeout(function() {
                callback(currTime + timeToCall);
            }, timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
        
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
        
        return true;
    }
    
    /**
     * 创建performance.now polyfill
     */
    createPerformanceNowPolyfill() {
        if (!window.performance) {
            window.performance = {};
        }
        
        if (!window.performance.now) {
            const startTime = Date.now();
            window.performance.now = function() {
                return Date.now() - startTime;
            };
        }
        
        return true;
    }
    
    /**
     * 设置回退方案
     */
    setupFallbacks() {
        // Canvas不支持时的回退
        if (!this.supportedFeatures.canvas) {
            this.setupCanvasFallback();
        }
        
        // 音频不支持时的回退
        if (!this.supportedFeatures.audioContext) {
            this.setupAudioFallback();
        }
        
        // 触摸事件不支持时的回退
        if (!this.supportedFeatures.touchEvents && this.browserInfo.isMobile) {
            this.setupTouchFallback();
        }
    }
    
    /**
     * 设置Canvas回退方案
     */
    setupCanvasFallback() {
        console.warn('Canvas不支持，将使用DOM回退方案');
        
        // 创建一个模拟Canvas的DOM实现
        window.CanvasFallback = {
            create: function(container, options) {
                const fallbackDiv = document.createElement('div');
                fallbackDiv.className = 'canvas-fallback';
                fallbackDiv.style.cssText = `
                    width: ${options.width}px;
                    height: ${options.height}px;
                    background: linear-gradient(45deg, #c0c0c0, #e0e0e0);
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #333;
                    font-size: 18px;
                    text-align: center;
                `;
                fallbackDiv.innerHTML = '您的浏览器不支持Canvas<br>请升级浏览器以获得最佳体验';
                container.appendChild(fallbackDiv);
                return fallbackDiv;
            }
        };
    }
    
    /**
     * 设置音频回退方案
     */
    setupAudioFallback() {
        console.warn('AudioContext不支持，音效将被禁用');
        
        // 创建一个空的音频接口
        window.AudioFallback = {
            createContext: function() {
                return {
                    createBuffer: function() { return null; },
                    createBufferSource: function() { 
                        return {
                            connect: function() {},
                            start: function() {}
                        };
                    },
                    createGain: function() {
                        return {
                            connect: function() {},
                            gain: { setValueAtTime: function() {} }
                        };
                    },
                    destination: {},
                    close: function() {}
                };
            }
        };
    }
    
    /**
     * 设置触摸回退方案
     */
    setupTouchFallback() {
        console.warn('触摸事件不支持，将使用鼠标事件模拟');
        
        // 为移动设备添加鼠标事件支持
        this.polyfills.touchEvents = true;
    }
    
    /**
     * 获取推荐配置
     */
    getRecommendedConfig() {
        const config = {
            enableParticles: true,
            enableGlow: true,
            enableSound: true,
            scratchRadius: 25,
            maxParticles: 200
        };
        
        // 根据浏览器调整配置
        if (this.browserInfo.isIE) {
            config.enableParticles = false;
            config.enableGlow = false;
            config.maxParticles = 50;
        } else if (this.browserInfo.isMobile) {
            config.enableGlow = false;
            config.maxParticles = 100;
            config.scratchRadius = 20;
        } else if (this.browserInfo.isSafari && this.browserInfo.version < 14) {
            config.enableGlow = false;
        }
        
        // 根据功能支持调整配置
        if (!this.supportedFeatures.audioContext) {
            config.enableSound = false;
        }
        
        if (!this.supportedFeatures.canvas) {
            config.enableParticles = false;
            config.enableGlow = false;
        }
        
        return config;
    }
    
    /**
     * 检查是否需要降级
     */
    shouldDowngrade() {
        return this.browserInfo.isIE || 
               (!this.supportedFeatures.canvas) ||
               (this.browserInfo.isMobile && this.browserInfo.isAndroid);
    }
    
    /**
     * 获取兼容性报告
     */
    getCompatibilityReport() {
        return {
            browser: this.browserInfo,
            features: this.supportedFeatures,
            polyfills: Object.keys(this.polyfills),
            recommendedConfig: this.getRecommendedConfig(),
            shouldDowngrade: this.shouldDowngrade()
        };
    }
    
    /**
     * 应用兼容性修复
     */
    applyCompatibilityFixes(engine) {
        if (!engine) return;
        
        const config = this.getRecommendedConfig();
        
        // 应用推荐配置
        Object.assign(engine.options, config);
        
        // 特殊修复
        if (this.browserInfo.isSafari) {
            // Safari的Canvas性能优化
            engine.options.scratchThreshold = 0.8; // 提高阈值减少计算
        }
        
        if (this.browserInfo.isFirefox) {
            // Firefox的内存优化
            engine.options.maxParticles = Math.min(engine.options.maxParticles, 150);
        }
        
        console.log('已应用兼容性修复:', config);
    }
}

// 导出类
window.CompatibilityHandler = CompatibilityHandler;

console.log('兼容性处理模块已加载');
