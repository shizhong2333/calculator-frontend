# 代码规范（前端 / JavaScript & CSS）

> 本文档用于约束本仓库（前端计算器界面）的代码风格。
>
> **规范来源**：
> - JavaScript 主要依据 [Google JavaScript Style Guide](https://google.github.io/styleguide/jsguide.html)，
>   并参考 [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)；
> - HTML / CSS 参考 [Google HTML/CSS Style Guide](https://google.github.io/styleguide/htmlcssguide.html)；
> - 命名采用 BEM（Block Element Modifier）约定。
> 凡本文件未特别说明之处，一律以上述官方规范为准。

## 1. 文件组织

| 文件 | 职责 |
| --- | --- |
| `index.html` | 仅负责页面结构，不写内联样式与内联脚本 |
| `style.css` | 仅负责样式，统一在 `:root` 中定义颜色等设计令牌 |
| `app.js` | 仅负责交互逻辑与网络请求，使用 IIFE 包裹避免污染全局 |

- HTML 中通过 `<link>` 引样式、`<script src>` 引脚本，禁止内联 `style` / `onclick`。

## 2. JavaScript 命名

| 对象 | 规则 | 示例 |
| --- | --- | --- |
| 常量 | 全大写，单词间下划线 | `API_BASE`、`KEYPAD` |
| 变量 / 函数 | 小驼峰 | `loadHistory`、`renderDisplay` |
| 类 / 构造函数 | 大驼峰 | `CalculatorView` |
| 私有（约定） | 无（本项目通过 IIFE 闭包隔离） | — |
| 布尔变量 | 以 `is` / `has` / `can` 开头 | `isLoading` |

## 3. 格式

- 缩进 **2 个空格**，禁止 Tab。
- 语句末尾**必须**加分号。
- 每行不超过 **80 个字符**，超长需换行并对齐。
- 使用单引号表示字符串。
- 对象字面量末尾保留尾随逗号（多行时）。
- 注释使用 `//`（行内）与 `/** ... */`（JSDoc），文件头必须有 `@file` 说明。

## 4. 语言特性

- 严格模式：文件顶层统一 `'use strict';`。
- 变量声明使用 `var` / `const` / `let`，禁止隐式全局变量。
- 优先使用 `===` / `!==`，禁止 `==` / `!=`（除非显式类型转换场景）。
- 禁止使用 `eval`、`Function` 构造器等动态执行手段。
- 异步统一使用 `fetch` + `Promise`，并对 `catch` 做兜底提示。

## 5. DOM 与事件

- 通过 `getElementById` / `querySelector` 获取节点，并缓存到变量，避免重复查询。
- 列表事件使用**事件委托**（绑定在父容器），不在每个子项上重复绑定。
- 渲染列表时使用 `DocumentFragment` 批量插入，减少重排。
- 拼接 HTML 时禁止直接 `innerHTML += 用户输入`，须使用 `textContent` 或创建节点，防止 XSS。

## 6. CSS 规范

- 类名使用 BEM：`block__element--modifier`，如 `history__item`、`key--equals`。
- 颜色、圆角、阴影等统一使用 `:root` 中的 CSS 变量，禁止散落硬编码色值。
- 选择器保持扁平，避免超过 3 层嵌套选择器。
- 属性书写建议按「定位 → 盒模型 → 排版 → 视觉」顺序分组。
- 禁止使用 `!important`，除非覆盖第三方样式且有注释说明。

## 7. API 调用约定

- `API_BASE` 由 `resolveApiBase()` 依据当前访问地址得出（本机回环地址用本地后端、
  公网访问用线上后端），全部请求统一基于该常量拼接地址，禁止在业务代码中散落硬编码域名。
- 请求体统一为 JSON，`Content-Type: application/json`。
- 必须同时处理「网络异常」与「业务失败（success=false）」，并给出用户可见提示。

## 8. 提交前自检

- [ ] 页面在 Chrome / Edge 中打开无控制台报错。
- [ ] 断开后端时，界面仍可交互且给出友好错误提示。
- [ ] 无未使用的变量与函数。
- [ ] 关键函数均有 JSDoc 注释。
