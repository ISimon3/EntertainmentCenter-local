/**
 * 高级视觉效果模块
 * 提供更多炫酷的动画效果和视觉增强
 */

class AdvancedVisualEffects {
    constructor(engine) {
        this.engine = engine;
        this.animations = [];
        this.shaders = {};
        this.textures = {};
        
        this.init();
    }
    
    /**
     * 初始化高级效果
     */
    init() {
        this.createShaderEffects();
        this.createTextures();
        this.setupAnimationLoop();
        
        console.log('高级视觉效果系统已初始化');
    }
    
    /**
     * 创建着色器效果（模拟）
     */
    createShaderEffects() {
        this.shaders = {
            // 波纹效果
            ripple: {
                time: 0,
                center: { x: 0, y: 0 },
                radius: 0,
                maxRadius: 200,
                speed: 5,
                active: false
            },
            
            // 光线扫描效果
            lightSweep: {
                angle: 0,
                speed: 0.02,
                intensity: 0.5,
                active: false
            },
            
            // 粒子场效果
            particleField: {
                particles: [],
                count: 50,
                active: false
            }
        };
    }
    
    /**
     * 创建纹理
     */
    createTextures() {
        this.textures = {
            // 创建噪声纹理
            noise: this.createNoiseTexture(256, 256),
            
            // 创建渐变纹理
            gradient: this.createGradientTexture(256, 256),
            
            // 创建星空纹理
            stars: this.createStarsTexture(512, 512)
        };
    }
    
    /**
     * 创建噪声纹理
     */
    createNoiseTexture(width, height) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        const imageData = ctx.createImageData(width, height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            const noise = Math.random() * 255;
            data[i] = noise;     // R
            data[i + 1] = noise; // G
            data[i + 2] = noise; // B
            data[i + 3] = 255;   // A
        }
        
        ctx.putImageData(imageData, 0, 0);
        return canvas;
    }
    
    /**
     * 创建渐变纹理
     */
    createGradientTexture(width, height) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        const gradient = ctx.createRadialGradient(
            width / 2, height / 2, 0,
            width / 2, height / 2, width / 2
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.5)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        return canvas;
    }
    
    /**
     * 创建星空纹理
     */
    createStarsTexture(width, height) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        // 黑色背景
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, width, height);
        
        // 随机星星
        for (let i = 0; i < 200; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const size = Math.random() * 2 + 0.5;
            const brightness = Math.random() * 0.8 + 0.2;
            
            ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, 2 * Math.PI);
            ctx.fill();
        }
        
        return canvas;
    }
    
    /**
     * 设置动画循环
     */
    setupAnimationLoop() {
        const animate = () => {
            this.updateAnimations();
            this.renderEffects();
            requestAnimationFrame(animate);
        };
        animate();
    }
    
    /**
     * 更新动画
     */
    updateAnimations() {
        // 更新波纹效果
        if (this.shaders.ripple.active) {
            this.shaders.ripple.radius += this.shaders.ripple.speed;
            if (this.shaders.ripple.radius > this.shaders.ripple.maxRadius) {
                this.shaders.ripple.active = false;
                this.shaders.ripple.radius = 0;
            }
        }
        
        // 更新光线扫描
        if (this.shaders.lightSweep.active) {
            this.shaders.lightSweep.angle += this.shaders.lightSweep.speed;
            if (this.shaders.lightSweep.angle > Math.PI * 2) {
                this.shaders.lightSweep.angle = 0;
            }
        }
        
        // 更新粒子场
        if (this.shaders.particleField.active) {
            this.updateParticleField();
        }
    }
    
    /**
     * 更新粒子场
     */
    updateParticleField() {
        const field = this.shaders.particleField;
        
        // 初始化粒子
        if (field.particles.length < field.count) {
            for (let i = field.particles.length; i < field.count; i++) {
                field.particles.push({
                    x: Math.random() * this.engine.options.width,
                    y: Math.random() * this.engine.options.height,
                    vx: (Math.random() - 0.5) * 2,
                    vy: (Math.random() - 0.5) * 2,
                    size: Math.random() * 3 + 1,
                    life: Math.random(),
                    color: `hsl(${Math.random() * 360}, 70%, 60%)`
                });
            }
        }
        
        // 更新粒子
        field.particles.forEach(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life -= 0.01;
            
            // 边界检查
            if (particle.x < 0 || particle.x > this.engine.options.width) {
                particle.vx *= -1;
            }
            if (particle.y < 0 || particle.y > this.engine.options.height) {
                particle.vy *= -1;
            }
            
            // 重生粒子
            if (particle.life <= 0) {
                particle.x = Math.random() * this.engine.options.width;
                particle.y = Math.random() * this.engine.options.height;
                particle.life = 1;
            }
        });
    }
    
    /**
     * 渲染效果
     */
    renderEffects() {
        if (!this.engine || !this.engine.layers.particles) return;
        
        const ctx = this.engine.layers.particles.ctx;
        const { width, height } = this.engine.options;
        
        // 渲染波纹效果
        if (this.shaders.ripple.active) {
            this.renderRippleEffect(ctx);
        }
        
        // 渲染光线扫描
        if (this.shaders.lightSweep.active) {
            this.renderLightSweepEffect(ctx);
        }
        
        // 渲染粒子场
        if (this.shaders.particleField.active) {
            this.renderParticleField(ctx);
        }
    }
    
    /**
     * 渲染波纹效果
     */
    renderRippleEffect(ctx) {
        const ripple = this.shaders.ripple;
        const { width, height } = this.engine.options;
        
        ctx.save();
        ctx.globalAlpha = 1 - (ripple.radius / ripple.maxRadius);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 3;
        
        ctx.beginPath();
        ctx.arc(ripple.center.x, ripple.center.y, ripple.radius, 0, 2 * Math.PI);
        ctx.stroke();
        
        // 内圈波纹
        if (ripple.radius > 20) {
            ctx.globalAlpha = 0.5 - (ripple.radius / ripple.maxRadius);
            ctx.beginPath();
            ctx.arc(ripple.center.x, ripple.center.y, ripple.radius - 20, 0, 2 * Math.PI);
            ctx.stroke();
        }
        
        ctx.restore();
    }
    
    /**
     * 渲染光线扫描效果
     */
    renderLightSweepEffect(ctx) {
        const sweep = this.shaders.lightSweep;
        const { width, height } = this.engine.options;
        const centerX = width / 2;
        const centerY = height / 2;
        
        ctx.save();
        ctx.globalAlpha = sweep.intensity;
        
        // 创建扇形渐变
        const gradient = ctx.createLinearGradient(
            centerX, centerY,
            centerX + Math.cos(sweep.angle) * width,
            centerY + Math.sin(sweep.angle) * height
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, Math.max(width, height), sweep.angle - 0.2, sweep.angle + 0.2);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }
    
    /**
     * 渲染粒子场
     */
    renderParticleField(ctx) {
        const field = this.shaders.particleField;
        
        ctx.save();
        field.particles.forEach(particle => {
            ctx.globalAlpha = particle.life;
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, 2 * Math.PI);
            ctx.fill();
        });
        ctx.restore();
    }
    
    /**
     * 触发波纹效果
     */
    triggerRipple(x, y) {
        this.shaders.ripple.center = { x, y };
        this.shaders.ripple.radius = 0;
        this.shaders.ripple.active = true;
    }
    
    /**
     * 启动光线扫描
     */
    startLightSweep() {
        this.shaders.lightSweep.active = true;
        this.shaders.lightSweep.angle = 0;
    }
    
    /**
     * 停止光线扫描
     */
    stopLightSweep() {
        this.shaders.lightSweep.active = false;
    }
    
    /**
     * 启动粒子场
     */
    startParticleField() {
        this.shaders.particleField.active = true;
    }
    
    /**
     * 停止粒子场
     */
    stopParticleField() {
        this.shaders.particleField.active = false;
        this.shaders.particleField.particles = [];
    }
    
    /**
     * 创建爆炸效果
     */
    createExplosion(x, y, intensity = 1.0) {
        // 触发波纹
        this.triggerRipple(x, y);
        
        // 创建爆炸粒子
        const particleCount = Math.floor(30 * intensity);
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            const velocity = 5 + Math.random() * 10;
            
            this.engine.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * velocity,
                vy: Math.sin(angle) * velocity,
                size: 2 + Math.random() * 4,
                color: `hsl(${Math.random() * 60 + 15}, 100%, 60%)`,
                life: 1.0,
                maxLife: 1.0,
                decay: 0.02,
                gravity: 0.1,
                rotation: 0,
                rotationSpeed: (Math.random() - 0.5) * 0.3
            });
        }
    }
    
    /**
     * 创建彩虹效果
     */
    createRainbowEffect() {
        const { width, height } = this.engine.options;
        const ctx = this.engine.layers.particles.ctx;
        
        // 创建彩虹渐变
        const gradient = ctx.createLinearGradient(0, 0, width, 0);
        gradient.addColorStop(0, 'red');
        gradient.addColorStop(0.17, 'orange');
        gradient.addColorStop(0.33, 'yellow');
        gradient.addColorStop(0.5, 'green');
        gradient.addColorStop(0.67, 'blue');
        gradient.addColorStop(0.83, 'indigo');
        gradient.addColorStop(1, 'violet');
        
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = gradient;
        ctx.fillRect(0, height * 0.4, width, height * 0.2);
        ctx.restore();
        
        // 添加闪烁效果
        setTimeout(() => {
            ctx.clearRect(0, height * 0.4, width, height * 0.2);
        }, 2000);
    }
    
    /**
     * 销毁效果系统
     */
    destroy() {
        this.animations = [];
        this.shaders = {};
        this.textures = {};
        console.log('高级视觉效果系统已销毁');
    }
}

// 导出类
window.AdvancedVisualEffects = AdvancedVisualEffects;

console.log('高级视觉效果模块已加载');
