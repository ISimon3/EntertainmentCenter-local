#!/usr/bin/env python3
"""
娱乐中心系统 - 一键启动脚本
"""
import os
import sys
import subprocess
import webbrowser
from pathlib import Path

def check_python_version():
    """检查Python版本"""
    if sys.version_info < (3, 8):
        print("❌ 需要Python 3.8或更高版本")
        print(f"当前版本: {sys.version}")
        return False
    print(f"✅ Python版本: {sys.version.split()[0]}")
    return True

def check_dependencies():
    """检查依赖是否安装"""
    requirements_file = Path("backend/requirements.txt")
    if not requirements_file.exists():
        print("❌ 找不到requirements.txt文件")
        return False
    
    print("📦 检查依赖...")
    try:
        # 检查主要依赖
        import fastapi
        import uvicorn
        import sqlalchemy
        print("✅ 主要依赖已安装")
        return True
    except ImportError as e:
        print(f"❌ 缺少依赖: {e}")
        print("正在安装依赖...")
        try:
            subprocess.run([sys.executable, "-m", "pip", "install", "-r", "backend/requirements.txt"], 
                         check=True, capture_output=True)
            print("✅ 依赖安装完成")
            return True
        except subprocess.CalledProcessError:
            print("❌ 依赖安装失败，请手动运行: pip install -r backend/requirements.txt")
            return False

def check_database():
    """检查数据库"""
    db_path = Path("database/entertainment.db")
    if db_path.exists():
        print("✅ 数据库文件存在")
    else:
        print("📊 首次启动，将创建数据库")
    return True

def start_backend():
    """启动后端服务"""
    print("🚀 启动后端服务...")
    backend_dir = Path("backend")
    if not backend_dir.exists():
        print("❌ 找不到backend目录")
        return None
    
    try:
        # 切换到backend目录并启动服务
        process = subprocess.Popen(
            [sys.executable, "run.py"],
            cwd=backend_dir,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        # 等待服务启动
        import time
        time.sleep(3)
        
        if process.poll() is None:
            print("✅ 后端服务启动成功")
            print("📍 API地址: http://localhost:8000")
            print("📚 API文档: http://localhost:8000/docs")
            return process
        else:
            stdout, stderr = process.communicate()
            print("❌ 后端服务启动失败")
            print(f"错误信息: {stderr}")
            return None
            
    except Exception as e:
        print(f"❌ 启动后端服务时出错: {e}")
        return None

def open_frontend():
    """打开前端界面"""
    frontend_file = Path("frontend/index.html")
    if frontend_file.exists():
        print("🌐 打开前端界面...")
        try:
            webbrowser.open(f"file://{frontend_file.absolute()}")
            print("✅ 前端界面已在浏览器中打开")
        except Exception as e:
            print(f"❌ 无法自动打开浏览器: {e}")
            print(f"请手动打开: {frontend_file.absolute()}")
    else:
        print("❌ 找不到前端文件")

def show_info():
    """显示系统信息"""
    print("\n" + "="*50)
    print("🎮 娱乐中心系统已启动")
    print("="*50)
    print("📍 后端API: http://localhost:8000")
    print("📚 API文档: http://localhost:8000/docs")
    print("🌐 前端界面: frontend/index.html")
    print("\n🎯 默认管理员账户:")
    print("   用户名: admin")
    print("   密码: admin123")
    print("   积分: 10000")
    print("\n🎲 可用游戏:")
    print("   🎫 刮刮乐游戏")
    print("   🎰 老虎机游戏")
    print("   🎡 幸运大转盘")
    print("\n⚠️  按 Ctrl+C 停止服务")
    print("="*50)

def main():
    """主函数"""
    print("🎮 娱乐中心系统启动器")
    print("="*30)
    
    # 检查环境
    if not check_python_version():
        return
    
    if not check_dependencies():
        return
    
    if not check_database():
        return
    
    # 启动后端
    backend_process = start_backend()
    if not backend_process:
        return
    
    # 打开前端
    open_frontend()
    
    # 显示信息
    show_info()
    
    # 等待用户中断
    try:
        backend_process.wait()
    except KeyboardInterrupt:
        print("\n\n🛑 正在停止服务...")
        backend_process.terminate()
        try:
            backend_process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            backend_process.kill()
        print("✅ 服务已停止")

if __name__ == "__main__":
    main()
