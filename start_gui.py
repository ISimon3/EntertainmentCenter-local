#!/usr/bin/env python3
"""
娱乐中心系统 - GUI启动器
"""
import os
import sys
import subprocess
import webbrowser
import threading
import time
from pathlib import Path
import tkinter as tk
from tkinter import ttk, messagebox, scrolledtext
from datetime import datetime

class EntertainmentCenterGUI:
    def __init__(self, root):
        self.root = root
        self.root.title("🎮 娱乐中心系统 - 控制面板")
        self.root.geometry("600x600")
        self.root.resizable(True, True)
        
        # 设置图标和样式
        self.setup_style()
        
        # 进程管理
        self.backend_process = None
        self.frontend_process = None
        
        # 创建界面
        self.create_widgets()
        
        # 检查环境
        self.check_environment()
    
    def setup_style(self):
        """设置界面样式"""
        style = ttk.Style()
        style.theme_use('clam')
        
        # 配置颜色
        style.configure('Title.TLabel', font=('Arial', 16, 'bold'), foreground='#2c3e50')
        style.configure('Status.TLabel', font=('Arial', 10), foreground='#27ae60')
        style.configure('Error.TLabel', font=('Arial', 10), foreground='#e74c3c')
        style.configure('Success.TButton', background='#27ae60')
        style.configure('Warning.TButton', background='#f39c12')
        style.configure('Danger.TButton', background='#e74c3c')
    
    def create_widgets(self):
        """创建界面组件"""
        # 主框架
        main_frame = ttk.Frame(self.root, padding="10")
        main_frame.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        # 标题
        title_label = ttk.Label(main_frame, text="🎮 娱乐中心系统控制面板", style='Title.TLabel')
        title_label.grid(row=0, column=0, columnspan=3, pady=(0, 20))
        
        # 服务控制区域
        self.create_service_control(main_frame)
        
        # 快捷操作区域
        self.create_quick_actions(main_frame)
        
        # 状态显示区域
        self.create_status_display(main_frame)
        
        # 日志显示区域
        self.create_log_display(main_frame)
        
        # 配置网格权重
        self.root.columnconfigure(0, weight=1)
        self.root.rowconfigure(0, weight=1)
        main_frame.columnconfigure(1, weight=1)
        main_frame.rowconfigure(4, weight=1)
    
    def create_service_control(self, parent):
        """创建服务控制区域"""
        # 后端服务控制
        backend_frame = ttk.LabelFrame(parent, text="🔧 后端服务 (端口 8000)", padding="10")
        backend_frame.grid(row=1, column=0, columnspan=3, sticky=(tk.W, tk.E), pady=(0, 10))
        
        self.backend_status = ttk.Label(backend_frame, text="● 未启动", style='Error.TLabel')
        self.backend_status.grid(row=0, column=0, sticky=tk.W)
        
        ttk.Button(backend_frame, text="🚀 启动后端", command=self.start_backend).grid(row=0, column=1, padx=5)
        ttk.Button(backend_frame, text="🔄 重启后端", command=self.restart_backend).grid(row=0, column=2, padx=5)
        ttk.Button(backend_frame, text="🛑 停止后端", command=self.stop_backend).grid(row=0, column=3, padx=5)
        
        # 前端服务控制
        frontend_frame = ttk.LabelFrame(parent, text="🌐 前端服务 (端口 8080)", padding="10")
        frontend_frame.grid(row=2, column=0, columnspan=3, sticky=(tk.W, tk.E), pady=(0, 10))
        
        self.frontend_status = ttk.Label(frontend_frame, text="● 未启动", style='Error.TLabel')
        self.frontend_status.grid(row=0, column=0, sticky=tk.W)
        
        ttk.Button(frontend_frame, text="🌐 启动前端", command=self.start_frontend).grid(row=0, column=1, padx=5)
        ttk.Button(frontend_frame, text="🔄 重启前端", command=self.restart_frontend).grid(row=0, column=2, padx=5)
        ttk.Button(frontend_frame, text="🛑 停止前端", command=self.stop_frontend).grid(row=0, column=3, padx=5)
    
    def create_quick_actions(self, parent):
        """创建快捷操作区域"""
        actions_frame = ttk.LabelFrame(parent, text="⚡ 快捷操作", padding="10")
        actions_frame.grid(row=3, column=0, columnspan=3, sticky=(tk.W, tk.E), pady=(0, 10))
        
        # 第一行按钮
        ttk.Button(actions_frame, text="🎮 游戏界面", command=self.open_game_interface).grid(row=0, column=0, padx=5, pady=2)
        ttk.Button(actions_frame, text="🛠️ 管理后台", command=self.open_admin_interface).grid(row=0, column=1, padx=5, pady=2)
        ttk.Button(actions_frame, text="📚 API文档", command=self.open_api_docs).grid(row=0, column=2, padx=5, pady=2)
        
        # 第二行按钮
        ttk.Button(actions_frame, text="🔧 创建管理员", command=self.create_admin).grid(row=1, column=0, padx=5, pady=2)
        ttk.Button(actions_frame, text="🗄️ 重置数据库", command=self.reset_database).grid(row=1, column=1, padx=5, pady=2)
        ttk.Button(actions_frame, text="📊 功能测试", command=self.open_test_page).grid(row=1, column=2, padx=5, pady=2)
    
    def create_status_display(self, parent):
        """创建状态显示区域"""
        status_frame = ttk.LabelFrame(parent, text="📊 系统状态", padding="10")
        status_frame.grid(row=4, column=0, columnspan=3, sticky=(tk.W, tk.E, tk.N, tk.S), pady=(0, 10))
        
        # 状态信息
        self.status_text = scrolledtext.ScrolledText(status_frame, height=8, width=70)
        self.status_text.grid(row=0, column=0, columnspan=3, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        status_frame.columnconfigure(0, weight=1)
        status_frame.rowconfigure(0, weight=1)
        
        # 添加初始状态信息
        self.log_message("🎮 娱乐中心系统控制面板已启动")
        self.log_message("📍 后端API地址: http://localhost:8000")
        self.log_message("🌐 前端界面地址: http://localhost:8080")
        self.log_message("🛠️ 管理后台地址: http://localhost:8080/admin.html")
    
    def create_log_display(self, parent):
        """创建日志显示区域"""
        log_frame = ttk.Frame(parent)
        log_frame.grid(row=5, column=0, columnspan=3, sticky=(tk.W, tk.E), pady=(10, 0))
        
        ttk.Button(log_frame, text="🗑️ 清空日志", command=self.clear_log).grid(row=0, column=0)
        ttk.Button(log_frame, text="💾 保存日志", command=self.save_log).grid(row=0, column=1, padx=(5, 0))
        ttk.Button(log_frame, text="🔄 刷新状态", command=self.refresh_status).grid(row=0, column=2, padx=(5, 0))
    
    def log_message(self, message):
        """添加日志消息"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        log_entry = f"[{timestamp}] {message}\n"
        self.status_text.insert(tk.END, log_entry)
        self.status_text.see(tk.END)
        self.root.update_idletasks()
    
    def check_environment(self):
        """检查运行环境"""
        self.log_message("🔍 检查运行环境...")
        
        # 检查Python版本
        if sys.version_info >= (3, 8):
            self.log_message(f"✅ Python版本: {sys.version.split()[0]}")
        else:
            self.log_message(f"❌ Python版本过低: {sys.version.split()[0]} (需要3.8+)")
        
        # 检查目录结构
        if Path("backend").exists():
            self.log_message("✅ 后端目录存在")
        else:
            self.log_message("❌ 后端目录不存在")
        
        if Path("frontend").exists():
            self.log_message("✅ 前端目录存在")
        else:
            self.log_message("❌ 前端目录不存在")
    
    def start_backend(self):
        """启动后端服务"""
        if self.backend_process and self.backend_process.poll() is None:
            self.log_message("⚠️ 后端服务已在运行")
            return
        
        self.log_message("🚀 启动后端服务...")
        
        def run_backend():
            try:
                self.backend_process = subprocess.Popen(
                    [sys.executable, "run.py"],
                    cwd="backend",
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True
                )
                
                # 等待启动
                time.sleep(3)
                
                if self.backend_process.poll() is None:
                    self.root.after(0, lambda: self.log_message("✅ 后端服务启动成功 (端口 8000)"))
                    self.root.after(0, lambda: self.update_backend_status("● 运行中", 'Status.TLabel'))
                else:
                    stdout, stderr = self.backend_process.communicate()
                    self.root.after(0, lambda: self.log_message(f"❌ 后端服务启动失败: {stderr}"))
                    
            except Exception as e:
                self.root.after(0, lambda: self.log_message(f"❌ 启动后端服务时出错: {e}"))
        
        threading.Thread(target=run_backend, daemon=True).start()
    
    def stop_backend(self):
        """停止后端服务"""
        if self.backend_process and self.backend_process.poll() is None:
            self.log_message("🛑 停止后端服务...")
            self.backend_process.terminate()
            try:
                self.backend_process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self.backend_process.kill()
            self.log_message("✅ 后端服务已停止")
            self.update_backend_status("● 未启动", 'Error.TLabel')
        else:
            self.log_message("⚠️ 后端服务未运行")
    
    def restart_backend(self):
        """重启后端服务"""
        self.log_message("🔄 重启后端服务...")
        self.stop_backend()
        time.sleep(1)
        self.start_backend()
    
    def start_frontend(self):
        """启动前端服务"""
        if self.frontend_process and self.frontend_process.poll() is None:
            self.log_message("⚠️ 前端服务已在运行")
            return
        
        self.log_message("🌐 启动前端服务...")
        
        def run_frontend():
            try:
                self.frontend_process = subprocess.Popen(
                    [sys.executable, "-m", "http.server", "8080"],
                    cwd="frontend",
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True
                )
                
                # 等待启动
                time.sleep(2)
                
                if self.frontend_process.poll() is None:
                    self.root.after(0, lambda: self.log_message("✅ 前端服务启动成功 (端口 8080)"))
                    self.root.after(0, lambda: self.update_frontend_status("● 运行中", 'Status.TLabel'))
                else:
                    stdout, stderr = self.frontend_process.communicate()
                    self.root.after(0, lambda: self.log_message(f"❌ 前端服务启动失败: {stderr}"))
                    
            except Exception as e:
                self.root.after(0, lambda: self.log_message(f"❌ 启动前端服务时出错: {e}"))
        
        threading.Thread(target=run_frontend, daemon=True).start()
    
    def stop_frontend(self):
        """停止前端服务"""
        if self.frontend_process and self.frontend_process.poll() is None:
            self.log_message("🛑 停止前端服务...")
            self.frontend_process.terminate()
            try:
                self.frontend_process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self.frontend_process.kill()
            self.log_message("✅ 前端服务已停止")
            self.update_frontend_status("● 未启动", 'Error.TLabel')
        else:
            self.log_message("⚠️ 前端服务未运行")
    
    def restart_frontend(self):
        """重启前端服务"""
        self.log_message("🔄 重启前端服务...")
        self.stop_frontend()
        time.sleep(1)
        self.start_frontend()
    
    def update_backend_status(self, text, style):
        """更新后端状态"""
        self.backend_status.config(text=text, style=style)
    
    def update_frontend_status(self, text, style):
        """更新前端状态"""
        self.frontend_status.config(text=text, style=style)
    
    def open_game_interface(self):
        """打开游戏界面"""
        url = "http://localhost:8080/index.html"
        self.log_message(f"🎮 打开游戏界面: {url}")
        webbrowser.open(url)
    
    def open_admin_interface(self):
        """打开管理后台"""
        url = "http://localhost:8080/admin-login.html"
        self.log_message(f"🛠️ 打开管理员登录页面: {url}")
        webbrowser.open(url)
    
    def open_api_docs(self):
        """打开API文档"""
        url = "http://localhost:8000/docs"
        self.log_message(f"📚 打开API文档: {url}")
        webbrowser.open(url)
    
    def open_test_page(self):
        """打开测试页面"""
        url = "http://localhost:8080/test.html"
        self.log_message(f"📊 打开功能测试页面: {url}")
        webbrowser.open(url)
    
    def create_admin(self):
        """创建管理员账户"""
        self.log_message("🔧 创建管理员账户...")
        
        def run_create_admin():
            try:
                result = subprocess.run(
                    [sys.executable, "create_admin.py"],
                    cwd="backend",
                    capture_output=True,
                    text=True
                )
                
                if result.returncode == 0:
                    self.root.after(0, lambda: self.log_message("✅ 管理员账户创建/检查完成"))
                    self.root.after(0, lambda: self.log_message("👤 用户名: admin, 密码: admin123"))
                else:
                    self.root.after(0, lambda: self.log_message(f"❌ 创建管理员失败: {result.stderr}"))
                    
            except Exception as e:
                self.root.after(0, lambda: self.log_message(f"❌ 创建管理员时出错: {e}"))
        
        threading.Thread(target=run_create_admin, daemon=True).start()
    
    def reset_database(self):
        """重置数据库"""
        if messagebox.askyesno("确认重置", "确定要重置数据库吗？这将删除所有数据！"):
            self.log_message("🗄️ 重置数据库...")
            
            def run_reset():
                try:
                    result = subprocess.run(
                        [sys.executable, "reset_db.py"],
                        cwd="backend",
                        capture_output=True,
                        text=True
                    )
                    
                    if result.returncode == 0:
                        self.root.after(0, lambda: self.log_message("✅ 数据库重置完成"))
                    else:
                        self.root.after(0, lambda: self.log_message(f"❌ 数据库重置失败: {result.stderr}"))
                        
                except Exception as e:
                    self.root.after(0, lambda: self.log_message(f"❌ 重置数据库时出错: {e}"))
            
            threading.Thread(target=run_reset, daemon=True).start()
    
    def clear_log(self):
        """清空日志"""
        self.status_text.delete(1.0, tk.END)
        self.log_message("🗑️ 日志已清空")
    
    def save_log(self):
        """保存日志"""
        try:
            log_content = self.status_text.get(1.0, tk.END)
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"logs/system_log_{timestamp}.txt"
            
            os.makedirs("logs", exist_ok=True)
            with open(filename, 'w', encoding='utf-8') as f:
                f.write(log_content)
            
            self.log_message(f"💾 日志已保存到: {filename}")
        except Exception as e:
            self.log_message(f"❌ 保存日志失败: {e}")
    
    def refresh_status(self):
        """刷新状态"""
        self.log_message("🔄 刷新系统状态...")
        
        # 检查后端状态
        if self.backend_process and self.backend_process.poll() is None:
            self.update_backend_status("● 运行中", 'Status.TLabel')
        else:
            self.update_backend_status("● 未启动", 'Error.TLabel')
        
        # 检查前端状态
        if self.frontend_process and self.frontend_process.poll() is None:
            self.update_frontend_status("● 运行中", 'Status.TLabel')
        else:
            self.update_frontend_status("● 未启动", 'Error.TLabel')
        
        self.log_message("✅ 状态刷新完成")
    
    def on_closing(self):
        """关闭程序时的处理"""
        if messagebox.askokcancel("退出", "确定要退出吗？这将停止所有服务。"):
            self.log_message("🛑 正在停止所有服务...")
            
            if self.backend_process and self.backend_process.poll() is None:
                self.backend_process.terminate()
            
            if self.frontend_process and self.frontend_process.poll() is None:
                self.frontend_process.terminate()
            
            self.root.destroy()

def main():
    """主函数"""
    root = tk.Tk()
    app = EntertainmentCenterGUI(root)
    
    # 设置关闭事件
    root.protocol("WM_DELETE_WINDOW", app.on_closing)
    
    # 启动GUI
    root.mainloop()

if __name__ == "__main__":
    main()
