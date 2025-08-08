/**
 * 增强的刮奖视觉效果模块
 * 提供粒子系统、光影效果、音效等高级功能
 */

class EnhancedScratchEffects {
    constructor(engine) {
        this.engine = engine;
        this.audioContext = null;
        this.sounds = {};
        this.glowAnimations = [];

        // 效果和声音模式设置
        this.effectMode = 'normal'; // normal, sparkle, fire, ice
        this.soundMode = 'default'; // default, coin, paper, metal

        this.initAudio();
    }
    
    /**
     * 初始化音频系统
     */
    initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.createScratchSounds();
        } catch (error) {
            console.warn('音频系统初始化失败:', error);
        }
    }
    
    /**
     * 创建刮奖音效
     */
    createScratchSounds() {
        // 创建刮奖音效
        this.sounds.scratch = this.createScratchSound();
        this.sounds.win = this.createWinSound();
        this.sounds.complete = this.createCompleteSound();
    }
    
    /**
     * 创建刮奖音效
     */
    createScratchSound() {
        const duration = 0.1;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);
        
        // 生成白噪声模拟刮奖声音
        for (let i = 0; i < data.length; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.1;
        }
        
        return buffer;
    }
    
    /**
     * 创建中奖音效
     */
    createWinSound() {
        const duration = 0.5;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);
        
        // 生成上升音调
        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            const frequency = 440 + t * 220; // 从440Hz上升到660Hz
            data[i] = Math.sin(2 * Math.PI * frequency * t) * 0.3 * (1 - t);
        }
        
        return buffer;
    }
    
    /**
     * 创建完成音效
     */
    createCompleteSound() {
        const duration = 1.0;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);
        
        // 生成和弦音效
        const frequencies = [261.63, 329.63, 392.00]; // C大调和弦
        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            let sample = 0;
            frequencies.forEach(freq => {
                sample += Math.sin(2 * Math.PI * freq * t) * 0.1;
            });
            data[i] = sample * (1 - t * 0.5);
        }
        
        return buffer;
    }
    
    /**
     * 播放音效
     */
    playSound(soundName) {
        if (!this.audioContext || !this.sounds[soundName]) return;

        try {
            const source = this.audioContext.createBufferSource();
            const gainNode = this.audioContext.createGain();

            source.buffer = this.sounds[soundName];
            source.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            // 根据声音模式调整音量和音调
            switch (this.soundMode) {
                case 'coin':
                    gainNode.gain.setValueAtTime(0.4, this.audioContext.currentTime);
                    source.playbackRate.value = 1.2;
                    break;
                case 'paper':
                    gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
                    source.playbackRate.value = 0.8;
                    break;
                case 'metal':
                    gainNode.gain.setValueAtTime(0.5, this.audioContext.currentTime);
                    source.playbackRate.value = 1.5;
                    break;
                default:
                    gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
                    source.playbackRate.value = 1.0;
            }

            source.start();
        } catch (error) {
            console.warn('音效播放失败:', error);
        }
    }
    
    /**
     * 高级粒子系统
     */
    createAdvancedParticles(x, y, type = 'scratch') {
        // 禁用粒子效果以节省内存
        return [];
    }
    
    /**
     * 绘制高级粒子
     */
    drawAdvancedParticle(ctx, particle) {
        ctx.save();
        
        // 设置透明度
        ctx.globalAlpha = particle.life / particle.maxLife;
        
        // 移动到粒子位置
        ctx.translate(particle.x, particle.y);
        ctx.rotate(particle.rotation);
        
        // 绘制粒子
        if (particle.color.includes('#')) {
            // 实心圆形粒子
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(0, 0, particle.size, 0, 2 * Math.PI);
            ctx.fill();
        } else {
            // 渐变粒子
            const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, particle.size);
            gradient.addColorStop(0, particle.color);
            gradient.addColorStop(1, 'transparent');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(0, 0, particle.size, 0, 2 * Math.PI);
            ctx.fill();
        }
        
        ctx.restore();
    }
    
    /**
     * 创建光晕效果
     */
    createGlowEffect(x, y, radius, color, intensity = 1.0) {
        this.glowAnimations.push({
            x: x,
            y: y,
            radius: radius,
            maxRadius: radius * 3,
            color: color,
            intensity: intensity,
            life: 1.0,
            decay: 0.02
        });
    }
    
    /**
     * 绘制光晕效果
     */
    drawGlowEffects(ctx) {
        this.glowAnimations = this.glowAnimations.filter(glow => {
            if (glow.life <= 0) return false;
            
            ctx.save();
            ctx.globalAlpha = glow.life * glow.intensity;
            
            // 创建径向渐变
            const gradient = ctx.createRadialGradient(
                glow.x, glow.y, 0,
                glow.x, glow.y, glow.radius
            );
            gradient.addColorStop(0, glow.color);
            gradient.addColorStop(0.5, glow.color.replace('1)', '0.5)'));
            gradient.addColorStop(1, 'transparent');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(glow.x, glow.y, glow.radius, 0, 2 * Math.PI);
            ctx.fill();
            
            ctx.restore();
            
            // 更新光晕
            glow.radius += (glow.maxRadius - glow.radius) * 0.1;
            glow.life -= glow.decay;
            
            return true;
        });
    }
    
    /**
     * 创建中奖庆祝效果（已禁用以节省内存）
     */
    createWinCelebration(centerX, centerY) {
        // 只播放音效，禁用视觉效果以节省内存
        this.playSound('win');
        console.log('中奖庆祝效果（简化版）');
    }
    
    /**
     * 创建闪烁效果（已禁用以节省内存）
     */
    createSparkleEffect(x, y) {
        // 禁用闪烁效果以节省内存
        console.log('闪烁效果（已禁用）');
    }
    
    /**
     * 创建刮奖轨迹效果
     */
    createScratchTrail(x, y, lastX, lastY) {
        if (lastX !== undefined && lastY !== undefined) {
            const distance = Math.sqrt((x - lastX) ** 2 + (y - lastY) ** 2);
            const steps = Math.floor(distance / 5);
            
            for (let i = 0; i < steps; i++) {
                const t = i / steps;
                const trailX = lastX + (x - lastX) * t;
                const trailY = lastY + (y - lastY) * t;
                
                if (Math.random() < 0.3) {
                    this.createSparkleEffect(
                        trailX + (Math.random() - 0.5) * 10,
                        trailY + (Math.random() - 0.5) * 10
                    );
                }
            }
        }
    }
    
    /**
     * 创建涂层纹理
     */
    createScratchTexture(ctx, width, height, style = 'silver') {
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        
        const textures = {
            silver: () => {
                for (let i = 0; i < data.length; i += 4) {
                    const noise = Math.random() * 40 - 20;
                    const base = 180 + noise;
                    data[i] = base;     // R
                    data[i + 1] = base; // G
                    data[i + 2] = base; // B
                    data[i + 3] = 255;  // A
                }
            },
            gold: () => {
                for (let i = 0; i < data.length; i += 4) {
                    const noise = Math.random() * 30 - 15;
                    data[i] = 255 + noise;     // R
                    data[i + 1] = 215 + noise; // G
                    data[i + 2] = 0 + noise;   // B
                    data[i + 3] = 255;         // A
                }
            },
            rainbow: () => {
                for (let i = 0; i < data.length; i += 4) {
                    const x = (i / 4) % width;
                    const y = Math.floor((i / 4) / width);
                    const hue = (x + y) % 360;
                    const [r, g, b] = this.hslToRgb(hue / 360, 0.7, 0.6);
                    data[i] = r;
                    data[i + 1] = g;
                    data[i + 2] = b;
                    data[i + 3] = 255;
                }
            }
        };
        
        if (textures[style]) {
            textures[style]();
            ctx.putImageData(imageData, 0, 0);
        }
    }
    
    /**
     * HSL转RGB
     */
    hslToRgb(h, s, l) {
        let r, g, b;
        
        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };
            
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }
        
        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    }
    
    /**
     * 创建完成庆祝动画
     */
    createCompletionAnimation() {
        this.playSound('complete');
        
        // 创建彩虹粒子爆炸
        const centerX = this.engine.options.width / 2;
        const centerY = this.engine.options.height / 2;
        
        for (let i = 0; i < 50; i++) {
            setTimeout(() => {
                const angle = (Math.PI * 2 * i) / 50;
                const distance = 50 + Math.random() * 100;
                const x = centerX + Math.cos(angle) * distance;
                const y = centerY + Math.sin(angle) * distance;
                
                this.createGlowEffect(x, y, 15, `hsl(${i * 7}, 70%, 60%)`, 1.0);
                this.engine.particles.push(...this.createAdvancedParticles(x, y, 'win'));
            }, i * 20);
        }
    }
    
    /**
     * 设置特效模式
     */
    setEffectMode(mode) {
        this.effectMode = mode;
        console.log(`特效模式设置为: ${mode}`);
    }

    /**
     * 设置声音模式
     */
    setSoundMode(mode) {
        this.soundMode = mode;
        console.log(`声音模式设置为: ${mode}`);
    }



    /**
     * 根据特效模式创建粒子
     */
    createAdvancedParticles(x, y, type = 'scratch') {
        const particles = [];
        let config = this.getParticleConfig(type);

        // 根据特效模式调整粒子配置
        switch (this.effectMode) {
            case 'sparkle':
                config.colors = ['#ffffff', '#ffffcc', '#ffccff', '#ccffff'];
                config.count *= 1.5;
                break;
            case 'fire':
                config.colors = ['#ff4500', '#ff6347', '#ffd700', '#ff8c00'];
                config.velocity.min *= 1.2;
                config.velocity.max *= 1.2;
                break;
            case 'ice':
                config.colors = ['#87ceeb', '#b0e0e6', '#e0ffff', '#f0f8ff'];
                config.life.min *= 1.5;
                config.life.max *= 1.5;
                break;
            default:
                // 保持原始配置
                break;
        }

        for (let i = 0; i < config.count; i++) {
            particles.push({
                x: x + (Math.random() - 0.5) * 20,
                y: y + (Math.random() - 0.5) * 20,
                vx: (Math.random() - 0.5) * (config.velocity.max - config.velocity.min) + config.velocity.min,
                vy: (Math.random() - 0.5) * (config.velocity.max - config.velocity.min) + config.velocity.min,
                life: Math.random() * (config.life.max - config.life.min) + config.life.min,
                decay: 0.02,
                size: Math.random() * (config.size.max - config.size.min) + config.size.min,
                color: config.colors[Math.floor(Math.random() * config.colors.length)]
            });
        }

        return particles;
    }

    /**
     * 获取粒子配置
     */
    getParticleConfig(type) {
        const configs = {
            scratch: {
                count: 8,
                colors: ['#c0c0c0', '#e0e0e0', '#a0a0a0'],
                size: { min: 1, max: 3 },
                velocity: { min: 2, max: 6 },
                life: { min: 0.5, max: 1.0 }
            },
            win: {
                count: 20,
                colors: ['#ffd700', '#ffed4e', '#ff6b35'],
                size: { min: 2, max: 5 },
                velocity: { min: 3, max: 8 },
                life: { min: 1.0, max: 2.0 }
            },
            sparkle: {
                count: 15,
                colors: ['#ffffff', '#ffffcc', '#ffccff'],
                size: { min: 1, max: 4 },
                velocity: { min: 1, max: 4 },
                life: { min: 0.8, max: 1.5 }
            }
        };

        return configs[type] || configs.scratch;
    }

    /**
     * 销毁效果系统
     */
    destroy() {
        if (this.audioContext) {
            this.audioContext.close();
        }
        this.glowAnimations = [];
    }
}

// 导出效果类
window.EnhancedScratchEffects = EnhancedScratchEffects;

console.log('增强刮奖效果模块已加载');
