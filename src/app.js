/**
 * @file 前后端分离计算器 —— 前端交互逻辑
 * @description
 *   本文件只负责界面交互与网络请求，绝不做任何本地计算。
 *   表达式一律发送给后端 /api/calculate，结果、历史数据均来自后端 API。
 * @see Google JavaScript Style Guide
 */

(function () {
  'use strict';

  /**
   * 后端 API 根地址。
   * 部署或联调时修改此常量即可指向不同的后端服务。
   * @const {string}
   */
  var API_BASE = 'http://127.0.0.1:5000';

  /**
   * 计算器按键配置。
   * type 取值：input（直接写入表达式）/ function（触发动作）
   * @const {!Array<!Object>}
   */
  var KEYPAD = [
    { label: 'C', value: 'clear', type: 'function', className: 'key--fn' },
    { label: '⌫', value: 'backspace', type: 'function', className: 'key--fn' },
    { label: '(', value: '(', type: 'input' },
    { label: ')', value: ')', type: 'input' },
    { label: '7', value: '7', type: 'input', className: 'key--num' },
    { label: '8', value: '8', type: 'input', className: 'key--num' },
    { label: '9', value: '9', type: 'input', className: 'key--num' },
    { label: '÷', value: '/', type: 'input', className: 'key--op' },
    { label: '4', value: '4', type: 'input', className: 'key--num' },
    { label: '5', value: '5', type: 'input', className: 'key--num' },
    { label: '6', value: '6', type: 'input', className: 'key--num' },
    { label: '×', value: '*', type: 'input', className: 'key--op' },
    { label: '1', value: '1', type: 'input', className: 'key--num' },
    { label: '2', value: '2', type: 'input', className: 'key--num' },
    { label: '3', value: '3', type: 'input', className: 'key--num' },
    { label: '−', value: '-', type: 'input', className: 'key--op' },
    { label: '±', value: 'sign', type: 'function', className: 'key--fn' },
    { label: '0', value: '0', type: 'input', className: 'key--num' },
    { label: '.', value: '.', type: 'input', className: 'key--num' },
    { label: '+', value: '+', type: 'input', className: 'key--op' }
  ];

  /** 运行期状态。 */
  var state = {
    expression: '',
    loading: false
  };

  /** 常用 DOM 节点缓存。 */
  var els = {};

  /**
   * 初始化：缓存 DOM、渲染按键、绑定事件、检查后端、加载历史。
   */
  function init() {
    els.expressionDisplay = document.getElementById('expressionDisplay');
    els.resultDisplay = document.getElementById('resultDisplay');
    els.messageArea = document.getElementById('messageArea');
    els.keypad = document.getElementById('keypad');
    els.historyList = document.getElementById('historyList');
    els.historyEmpty = document.getElementById('historyEmpty');
    els.refreshHistoryBtn = document.getElementById('refreshHistoryBtn');
    els.clearHistoryBtn = document.getElementById('clearHistoryBtn');
    els.apiBadge = document.getElementById('apiBadge');
    els.apiBaseLabel = document.getElementById('apiBaseLabel');

    els.apiBaseLabel.textContent = API_BASE;

    renderKeypad();
    bindEvents();
    renderDisplay();
    checkHealth();
    loadHistory();
  }

  /**
   * 根据 KEYPAD 配置渲染虚拟按键。
   */
  function renderKeypad() {
    var fragment = document.createDocumentFragment();

    KEYPAD.forEach(function (key) {
      var button = document.createElement('button');
      button.type = 'button';
      button.textContent = key.label;
      button.className = 'key' + (key.className ? ' ' + key.className : '');
      button.dataset.value = key.value;
      button.dataset.kind = key.type;
      fragment.appendChild(button);
    });

    var equals = document.createElement('button');
    equals.type = 'button';
    equals.id = 'equalsBtn';
    equals.textContent = '=';
    equals.className = 'key key--equals';
    fragment.appendChild(equals);

    els.keypad.appendChild(fragment);
  }

  /**
   * 绑定按钮与键盘事件。
   */
  function bindEvents() {
    els.keypad.addEventListener('click', onKeypadClick);
    els.refreshHistoryBtn.addEventListener('click', loadHistory);
    els.clearHistoryBtn.addEventListener('click', clearHistory);
    els.historyList.addEventListener('click', onHistoryClick);
    document.addEventListener('keydown', onKeyDown);
  }

  /**
   * 按键点击处理。
   * @param {!Event} event
   */
  function onKeypadClick(event) {
    var button = event.target.closest('button');
    if (!button) {
      return;
    }
    if (button.id === 'equalsBtn') {
      submitCalculation();
      return;
    }
    var value = button.dataset.value;
    var kind = button.dataset.kind;
    if (kind === 'function') {
      handleFunction(value);
    } else {
      inputValue(value);
    }
  }

  /**
   * 物理键盘支持。
   * @param {!KeyboardEvent} event
   */
  function onKeyDown(event) {
    var key = event.key;
    if (/^[0-9]$/.test(key) || '+-*/.()'.indexOf(key) !== -1) {
      inputValue(key);
      event.preventDefault();
      return;
    }
    if (key === 'Enter' || key === '=') {
      submitCalculation();
      event.preventDefault();
      return;
    }
    if (key === 'Backspace') {
      handleFunction('backspace');
      event.preventDefault();
      return;
    }
    if (key === 'Escape' || key === 'c' || key === 'C') {
      handleFunction('clear');
      event.preventDefault();
    }
  }

  /**
   * 功能键处理。
   * @param {string} action
   */
  function handleFunction(action) {
    if (action === 'clear') {
      state.expression = '';
      els.resultDisplay.textContent = '= 0';
    } else if (action === 'backspace') {
      state.expression = state.expression.slice(0, -1);
    } else if (action === 'sign') {
      state.expression = toggleSign(state.expression);
    }
    hideMessage();
    renderDisplay();
  }

  /**
   * 向表达式追加一个记号。
   * @param {string} value
   */
  function inputValue(value) {
    state.expression += value;
    hideMessage();
    renderDisplay();
  }

  /**
   * 切换表达式末尾数字的正负号（一元正负号）。
   * @param {string} expression
   * @return {string}
   */
  function toggleSign(expression) {
    var numberMatch = expression.match(/(\d+\.?\d*|\.\d+)$/);
    if (numberMatch) {
      var start = expression.length - numberMatch[0].length;
      var before = expression.slice(0, start);
      if (before.charAt(before.length - 1) === '-') {
        var beforeMinus = before.slice(0, -1);
        var prev = beforeMinus.charAt(beforeMinus.length - 1);
        if (prev === '' || prev === '(' || '+-*/'.indexOf(prev) !== -1) {
          return beforeMinus + numberMatch[0];
        }
      }
      return before + '-' + numberMatch[0];
    }
    if (expression.charAt(expression.length - 1) === '-') {
      return expression.slice(0, -1);
    }
    return expression + '-';
  }

  /**
   * 刷新显示区（表达式中 * / 以 × ÷ 展示）。
   */
  function renderDisplay() {
    var shown = state.expression || '0';
    els.expressionDisplay.textContent = shown.replace(/\*/g, '×').replace(/\//g, '÷');
  }

  /**
   * 提交计算请求到后端。
   */
  function submitCalculation() {
    if (state.loading) {
      return;
    }
    var expression = state.expression.trim();
    if (!expression) {
      showMessage('请先输入表达式', false);
      return;
    }

    state.loading = true;
    els.resultDisplay.textContent = '计算中…';

    fetch(API_BASE + '/api/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ expression: expression })
    })
      .then(function (response) {
        return response.json().then(function (body) {
          return { ok: response.ok, body: body };
        });
      })
      .then(function (result) {
        var body = result.body || {};
        if (result.ok && body.success) {
          els.resultDisplay.textContent = '= ' + body.result;
          showMessage('计算成功', true);
          loadHistory();
        } else {
          els.resultDisplay.textContent = '= 错误';
          showMessage(body.message || '计算失败', false);
        }
      })
      .catch(function () {
        els.resultDisplay.textContent = '= 错误';
        setBadge(false);
        showMessage('无法连接后端服务，请确认后端已启动', false);
      })
      .then(function () {
        state.loading = false;
      });
  }

  /**
   * 从后端加载历史记录并渲染。
   */
  function loadHistory() {
    fetch(API_BASE + '/api/history', { method: 'GET' })
      .then(function (response) {
        return response.json();
      })
      .then(function (body) {
        setBadge(true);
        renderHistory((body && body.data) || []);
      })
      .catch(function () {
        setBadge(false);
        renderHistory([]);
        showMessage('无法连接后端服务，历史记录加载失败', false);
      });
  }

  /**
   * 渲染历史记录列表。
   * @param {!Array<!Object>} records
   */
  function renderHistory(records) {
    els.historyList.innerHTML = '';
    if (!records.length) {
      els.historyEmpty.hidden = false;
      return;
    }
    els.historyEmpty.hidden = true;

    var fragment = document.createDocumentFragment();
    records.forEach(function (record) {
      var item = document.createElement('li');
      item.className = 'history__item';

      var content = document.createElement('div');
      content.className = 'history__content';

      var expr = document.createElement('div');
      expr.className = 'history__expression';
      expr.textContent = record.expression.replace(/\*/g, '×').replace(/\//g, '÷');

      var res = document.createElement('div');
      res.className = 'history__result';
      res.textContent = '= ' + record.result;

      var time = document.createElement('div');
      time.className = 'history__time';
      time.textContent = record.created_at;

      content.appendChild(expr);
      content.appendChild(res);
      content.appendChild(time);

      var del = document.createElement('button');
      del.type = 'button';
      del.className = 'history__delete';
      del.textContent = '删除';
      del.dataset.id = String(record.id);

      item.appendChild(content);
      item.appendChild(del);
      fragment.appendChild(item);
    });
    els.historyList.appendChild(fragment);
  }

  /**
   * 历史记录区域事件委托（删除单条）。
   * @param {!Event} event
   */
  function onHistoryClick(event) {
    var button = event.target.closest('.history__delete');
    if (!button) {
      return;
    }
    deleteRecord(button.dataset.id);
  }

  /**
   * 删除指定历史记录，完成后重新拉取历史。
   * @param {string} id
   */
  function deleteRecord(id) {
    fetch(API_BASE + '/api/history/' + encodeURIComponent(id), { method: 'DELETE' })
      .then(function (response) {
        return response.json().then(function (body) {
          return { ok: response.ok, body: body };
        });
      })
      .then(function (result) {
        if (result.ok && result.body && result.body.success) {
          showMessage('已删除该条记录', true);
        } else {
          showMessage((result.body && result.body.message) || '删除失败', false);
        }
        loadHistory();
      })
      .catch(function () {
        showMessage('删除失败：无法连接后端服务', false);
      });
  }

  /**
   * 清空全部历史记录。
   */
  function clearHistory() {
    if (!window.confirm('确定要清空全部计算历史吗？该操作会删除后端数据库中的记录。')) {
      return;
    }
    fetch(API_BASE + '/api/history', { method: 'DELETE' })
      .then(function (response) {
        return response.json();
      })
      .then(function (body) {
        if (body && body.success) {
          showMessage('已清空全部历史记录', true);
        } else {
          showMessage((body && body.message) || '清空失败', false);
        }
        loadHistory();
      })
      .catch(function () {
        showMessage('清空失败：无法连接后端服务', false);
      });
  }

  /**
   * 后端健康检查，用于更新连接状态徽标。
   */
  function checkHealth() {
    fetch(API_BASE + '/api/health', { method: 'GET' })
      .then(function (response) {
        setBadge(response.ok);
      })
      .catch(function () {
        setBadge(false);
      });
  }

  /**
   * 更新后端连接状态徽标。
   * @param {boolean} online
   */
  function setBadge(online) {
    if (online) {
      els.apiBadge.textContent = '后端已连接';
      els.apiBadge.className = 'badge badge--ok';
    } else {
      els.apiBadge.textContent = '后端未连接';
      els.apiBadge.className = 'badge badge--error';
    }
  }

  /**
   * 展示提示信息。
   * @param {string} text
   * @param {boolean} success
   */
  function showMessage(text, success) {
    els.messageArea.textContent = text;
    els.messageArea.hidden = false;
    els.messageArea.className = 'message' + (success ? ' message--ok' : '');
  }

  /** 隐藏提示信息。 */
  function hideMessage() {
    els.messageArea.hidden = true;
    els.messageArea.textContent = '';
  }

  document.addEventListener('DOMContentLoaded', init);
})();
