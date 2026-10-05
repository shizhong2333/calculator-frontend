# 前后端分离计算器 —— 前端（Frontend）

基于**原生 HTML / CSS / JavaScript** 实现的计算器前端界面。负责用户交互与
信息展示，所有计算与历史数据均通过 HTTP 调用后端 API 获取。

> 本仓库为「前后端分离计算器系统」的**前端仓库**。
> 后端仓库单独维护，二者仅通过 HTTP/JSON API 通信。
> **前端不做任何本地计算**，不缓存历史数据。

## 1. 项目简介

- 提供计算器交互界面：数字、四则运算、括号、小数点、正负号、退格、清空、等号；
- 展示表达式与计算结果；
- 展示后端存储的计算历史，支持删除单条与清空全部；
- 展示后端返回的错误信息（非法表达式、除零等）。

## 2. 技术栈

| 项目 | 说明 |
| --- | --- |
| 界面 | 原生 HTML5 + CSS3（BEM 命名） |
| 逻辑 | 原生 JavaScript（ES5+，无框架、无构建） |
| 通信 | 浏览器 `fetch` 调用后端 REST API（JSON） |
| 代码规范 | Google JavaScript Style Guide（详见 [codestyle.md](./codestyle.md)） |

## 3. 运行环境

- 任意现代浏览器（Chrome / Edge / Firefox）。
- 无需 Node.js、无需构建工具，直接打开页面即可运行。

## 4. 安装方法

本仓库为纯静态项目，无需安装依赖。克隆或下载代码即可。

## 5. 启动方法

**方式一：直接打开**

双击 `src/index.html`，用浏览器打开。

**方式二：本地静态服务器（推荐，避免部分浏览器对 file:// 的限制）**

```bash
cd src
python -m http.server 8080
```

然后访问 `http://127.0.0.1:8080/index.html`。

## 6. 配置说明

前端会按运行环境自动选择后端地址，无需手动改配置，配置位置在 `src/app.js` 顶部：

```javascript
// 本地开发：file:// 直接打开，或通过 localhost / 127.0.0.1 访问
var LOCAL_API_BASE = 'http://127.0.0.1:5000';

// 公网访问：GitHub Pages、PythonAnywhere 等非本机回环地址
var REMOTE_API_BASE = 'https://shizhong2333.pythonanywhere.com';
```

- 以 `file://` 直接打开页面，或通过 `localhost` / `127.0.0.1` / `0.0.0.0` / `[::1]` 访问时，
  自动使用本地后端 `http://127.0.0.1:5000`；
- 部署到公网后（访问域名不是本机回环地址），自动使用已上线后端
  `https://shizhong2333.pythonanywhere.com`；
- 如需更换后端地址，只需修改上述两个常量；
- 页面底部会展示当前实际使用的后端地址以及连接状态徽标。

## 7. 后端连接方式

1. 先启动后端服务（参见后端仓库 README），确认 `GET /api/health` 可访问；
2. 启动前端页面；
3. 页面底部徽标显示「后端已连接」即表示联调成功。

> **分离性验证**：停止后端服务后，前端界面仍可点击、可输入，但点等号会提示
> 「无法连接后端服务」，且历史区无法加载——说明核心计算与数据持久化均在后端，
> 前端没有本地计算能力。

## 8. 目录结构

```
frontend/
├── src/
│   ├── index.html      # 页面结构
│   ├── style.css       # 样式
│   └── app.js          # 交互逻辑与 API 调用
├── index.html          # 根目录入口页（GitHub Pages 使用，自动跳转到 src/index.html）
├── README.md
└── codestyle.md
```

## 9. 调用的后端接口

| 方法 | 路径 | 用途 |
| --- | --- | --- |
| POST | `/api/calculate` | 提交表达式，获取计算结果 |
| GET | `/api/history` | 获取计算历史列表 |
| DELETE | `/api/history/{id}` | 删除指定历史记录 |
| DELETE | `/api/history` | 清空全部历史记录 |
| GET | `/api/health` | 后端健康检查 |

## 10. 键盘快捷键（扩展功能）

| 按键 | 功能 |
| --- | --- |
| `0-9` `.` `+` `-` `*` `/` `(` `)` | 输入 |
| `Enter` / `=` | 计算 |
| `Backspace` | 退格 |
| `Esc` / `C` | 清空 |
