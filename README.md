# AI提示词管理器

一个功能强大的Chrome扩展，用于管理和快速使用AI提示词，支持多平台AI网站的提示词注入和WebDAV云端备份。

## ✨ 功能特性

### 🎯 核心功能
- **提示词管理**：添加、编辑、删除AI提示词
- **快速注入**：一键将提示词复制到剪贴板并填充到网页表单
- **网站控制**：精确控制在哪些网站启用提示词功能
- **浮动窗口**：在支持的网站显示提示词选择器

### 📁 数据管理
- **配置导入导出**：支持JSON格式的配置备份和恢复
- **配置合并**：智能合并多个配置文件
- **WebDAV备份**：自动备份到云端WebDAV服务器
- **自动备份**：每24小时自动备份到WebDAV

### 🔒 安全特性
- **数据同步**：使用Chrome同步存储，多设备数据同步
- **权限最小化**：仅请求必要的浏览器权限

## 📦 安装使用

### 从Release安装（推荐）
1. 从[Releases页面](../../releases)下载最新版本
2. **CRX文件**：拖拽到Chrome扩展管理页面安装
3. **ZIP文件**：解压后在Chrome中"加载已解压的扩展程序"

### 从源码安装
```bash
git clone https://github.com/idev-sig/prompt-manager.git
cd prompt-manager
just build  # 完整构建
```
然后在Chrome中加载 `build/` 目录

## 🚀 快速开始

### 1. 添加提示词
1. 点击扩展图标 → "设置提示词"
2. 在"提示词管理"标签页添加新提示词
3. 填写名称和内容

### 2. 配置网站
1. 切换到"网站设置"标签页
2. 添加要启用的网站域名
3. 启用相应网站开关

### 3. 使用提示词
1. 访问已启用的网站（如ChatGPT）
2. 页面右下角出现提示词选择器
3. 选择提示词并点击复制
4. 自动填充到表单并复制到剪贴板

## ⚙️ 配置管理

### 导入导出
- **导出配置**：备份所有提示词和网站设置
- **导入配置**：完全替换当前配置
- **合并配置**：智能合并新配置与现有配置

### WebDAV备份
支持主流WebDAV服务：Nextcloud、ownCloud、坚果云等

配置步骤：
1. "配置管理"标签页 → WebDAV设置
2. 填写服务器信息并测试连接
3. 启用自动备份（可选）

## 🛠️ 开发

### 环境要求
- Node.js 12+
- Chrome浏览器
- just 命令行工具

### 快速开始
```bash
# 克隆项目
git clone https://github.com/idev-sig/prompt-manager.git
cd prompt-manager

# 安装依赖
just install

# 完整构建
just build
```

### 常用命令
```bash
just                # 查看所有命令
just status         # 检查项目状态
just quick          # 快速构建ZIP
just build          # 完整构建CRX+ZIP
just clean          # 清理构建文件
just release        # 完整发布流程
```

### 项目结构
```
src/
├── manifest.json          # 扩展清单
├── html/                  # 页面文件
│   ├── popup.html         # 弹出窗口
│   └── options.html       # 设置页面
├── js/                    # 脚本文件
│   ├── popup.js           # 弹出窗口逻辑
│   ├── options.js         # 设置页面逻辑
│   ├── content.js         # 内容脚本
│   └── background.js      # 后台脚本
├── css/                   # 样式文件
│   ├── popup.css          # 弹出窗口样式
│   ├── options.css        # 设置页面样式
│   └── float-window.css   # 浮动窗口样式
└── icons/                 # 图标文件
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## 🌐 支持的网站

默认支持以下AI平台（可自定义添加）：
- ChatGPT (chatgpt.com)
- 其他AI平台（通过网站设置添加）

## 🔐 权限说明

| 权限 | 用途 |
|------|------|
| `storage` | 存储提示词和设置 |
| `activeTab` | 获取当前标签页信息 |
| `tabs` | 管理标签页 |
| `clipboardWrite` | 复制提示词到剪贴板 |
| `https://*/*`, `http://*/*` | 在网站注入内容脚本 |

## ❓ 常见问题

**Q: 为什么在某些网站看不到提示词选择器？**
A: 请检查该网站是否在"网站设置"中添加并启用。

**Q: WebDAV备份失败怎么办？**
A: 检查网络连接、服务器地址、用户名密码，确保WebDAV服务器支持CORS。

**Q: 如何迁移到新设备？**
A: 使用配置导出功能备份数据，在新设备导入；或使用WebDAV自动同步。

## 🤝 贡献

欢迎提交Issue和Pull Request！

1. Fork此仓库
2. 创建功能分支：`git checkout -b feature/new-feature`
3. 提交更改：`git commit -am 'Add new feature'`
4. 推送分支：`git push origin feature/new-feature`
5. 创建Pull Request

## 🔗 相关项目

- https://github.com/f/awesome-chatgpt-prompts
- https://github.com/PlexPt/awesome-chatgpt-prompts-zh
- https://github.com/x1xhlol/system-prompts-and-models-of-ai-tools

## 📄 许可证

Apache License 2.0 - 详见 [LICENSE](LICENSE) 文件

## 📝 更新日志

### v0.1.0 (当前版本)
- ✨ 初始版本发布
- 🎯 基础提示词管理功能
- ⚙️ 网站设置和配置导入导出
- ☁️ WebDAV备份支持
- 🔄 自动备份功能

---

**⭐ 如果这个项目对你有帮助，请给个Star支持一下！**

## 仓库镜像

- https://git.jetsung.com/idev/prompt-manager
- https://framagit.org/idev/prompt-manager
- https://github.com/idev-sig/prompt-manager

