(function () {
  'use strict';

  // ================= 熔断器（魂归黄金王座守护协议） =================
  var CIRCUIT_KEY = 'tglCircuitBroken';
  var ERROR_KEY = 'tglErrorLog';
  var ERROR_LIMIT = 50;
  var RENDER_ERROR_LIMIT = 10;
  var ERROR_WINDOW = 300000;
  var _breaking = false; // ◆防递归哨兵

  var ERROR_HINTS = {
    'render': '渲染面板时被替身攻击了', 'renderDetail': '渲染弹窗时被替身攻击了', 'renderSnaps': '渲染快照库时被替身攻击了',
    'renderGains': '渲染增益汇总时被替身攻击了',
    'takeSnapshot': '存快照时遭遇了败者食尘', 'restoreSnapshot': '恢复快照时遭遇了败者食尘',
    'saveList': '保存时被廉价把戏阴了', 'panel-click': '点击面板时被紫烟误伤', 'detail-click': '点击弹窗时被紫烟误伤',
    'drag': '拖拽时被航空史密斯扫射', 'computeGains': '计算增益时大脑过载', 'init': '初始化时被箭刺中'
  };

  function cleanupDOM() {
    ['#tglBtn', '#tglPanel', '#tglDetail', '#tglStyle', '#tglDead'].forEach(function (id) {
      try { var el = document.querySelector(id) || (window.parent && window.parent.document && window.parent.document.querySelector(id)); if (el) el.remove(); } catch (e) {}
    });
  }

  function circuitBreak(log) {
    if (_breaking) return;
    _breaking = true;
    try { localStorage.setItem(CIRCUIT_KEY, JSON.stringify({ time: Date.now(), reason: log ? ('错误' + log.count + '次/渲染' + log.renderCount + '次') : '存储被亚空间吞噬' })); } catch (e) {}
    cleanupDOM();
    try {
      var doc = document;
      try { if (window.parent && window.parent.document) doc = window.parent.document; } catch (e) {}
      var div = doc.createElement('div');
      div.id = 'tglDead';
      div.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:99999;max-width:340px;padding:16px 20px;background:linear-gradient(135deg,#1a1a2e,#16213e);color:#ffd700;border:2px solid #ffd700;border-radius:8px;font-size:12px;line-height:1.7;font-family:sans-serif;box-shadow:0 4px 20px rgba(0,0,0,.6)';
      div.innerHTML = '<b style="font-size:14px">⚜️ [胎光食录] 本插件已魂归黄金王座</b><br><br>' +
        '错误次数过多，帝皇的塔罗牌显示此插件不宜继续运行。<br>为了守护你的内存，它选择了自我了断。<br><br>' +
        '<b>复活仪式：</b><br>1. F12控制台咏唱：<code style="background:rgba(255,215,0,.2);padding:2px 6px;border-radius:3px;color:#ffe">localStorage.removeItem("tglCircuitBroken")</code><br>' +
        '2. 刷新页面，插件将从王座归来<br><br>' +
        '<i style="opacity:.7">若反复魂归王座，请携带F12红色报错截图，<br>前往作者处报告——就像发现迪奥弱点那样详细。</i>';
      doc.body.appendChild(div);
    } catch (e) {}
    console.error('[胎光食录·TGL] ⚜️ 本插件已魂归黄金王座');
    if (log) console.error('[胎光食录·TGL] 阵亡原因：', log);
  }

  function recordError(context, err) {
    if (_breaking) return;
    try {
      var now = Date.now();
      var log = { count: 0, renderCount: 0, first: now, contexts: [] };
      try { var s = localStorage.getItem(ERROR_KEY); if (s) log = JSON.parse(s); } catch (e) {}
      if (now - log.first > ERROR_WINDOW) log = { count: 0, renderCount: 0, first: now, contexts: [] };
      log.count++;
      if (context.indexOf('render') === 0) log.renderCount++;
      log.contexts.push({ time: now, ctx: context, msg: String(err && err.message || err).slice(0, 150) });
      if (log.contexts.length > 20) log.contexts = log.contexts.slice(-20);
      localStorage.setItem(ERROR_KEY, JSON.stringify(log));
      console.error('[胎光食录·TGL] 木大木大！错误#' + log.count + ' @' + context + '：' + (ERROR_HINTS[context] || '遭遇了未知替身攻击'), err);
      if (log.count >= ERROR_LIMIT || log.renderCount >= RENDER_ERROR_LIMIT) circuitBreak(log);
    } catch (e) { circuitBreak(null); }
  }

  function checkCircuit() {
    try {
      var b = localStorage.getItem(CIRCUIT_KEY);
      if (b) {
        var info = JSON.parse(b);
        console.error('[胎光食录·TGL] ⚜️ 插件仍在黄金王座上沉睡 @' + new Date(info.time).toLocaleString());
        console.error('[胎光食录·TGL] 阵亡原因：' + info.reason);
        console.error('[胎光食录·TGL] 复活咒语：localStorage.removeItem("tglCircuitBroken") 然后刷新');
        return true;
      }
    } catch (e) {}
    return false;
  }

  function safeRun(context, fn) {
    return function () { try { return fn.apply(this, arguments); } catch (e) { recordError(context, e); } };
  }

  // 修复①：jQuery 检测
  function waitJQuery(cb) {
    var tries = 0;
    (function poll() {
      var jq = null;
      try { jq = (typeof jQuery !== 'undefined' && jQuery) || (window.parent && window.parent.jQuery) || null; }
      catch (e) { try { jq = (typeof jQuery !== 'undefined' && jQuery) || null; } catch (e2) {} }
      if (jq) return cb(jq);
      if (++tries === 100) console.warn('[胎光食录·TGL] jQuery失踪了，是不是被DIO时停了？');
      setTimeout(poll, 100);
    })();
  }

  waitJQuery(function ($) {
    if (checkCircuit()) return;
    if (typeof getVariables !== 'function') {
      console.error('[胎光食录·TGL] 酒馆助手API不可用，插件无法启动');
      return;
    }

    var BUTTON_ID = 'tglBtn', PANEL_ID = 'tglPanel', DETAIL_ID = 'tglDetail', STYLE_ID = 'tglStyle';
    var IMG_URL = 'https://i.ibb.co/h1T1vxCq/image.png';

    // 修复②：跨域安全回退
    var targetDoc = document;
    try { if (window.parent && window.parent !== window) { var pd = window.parent.document; if (pd && pd.body) targetDoc = pd; } } catch (e) {}

    var $btn = null, $panel = null, $detail = null;

    // 修复③：防重复注入 + ◆事件清理
    function cleanup() {
      cleanupDOM();
      try { if ($btn) $btn.off(); } catch (e) {}
      try { if ($panel) $panel.off(); } catch (e) {}
      try { if ($detail) $detail.off(); } catch (e) {}
      try { $(targetDoc).off('.tgl'); } catch (e) {}
    }
    cleanup();
    window.addEventListener('beforeunload', cleanup);
    window.addEventListener('pagehide', cleanup);

    var state = {
      currentTab: 'food', currentTarget: 'user', readOnly: false,
      editingIdx: -1, adding: false, deleteConfirm: -1,
      detailType: '', detailPage: 0, detailDel: -1,
      snapRestore: -1, snapDel: -1, alertInfo: null,
      showGains: false, justEdited: false,
      drag: { on: false, moved: false, sx: 0, sy: 0, ex: 0, ey: 0 }
    };

    // ◎核心参数
    var MAIN_LIST_SIZE = 8, HISTORY_WARN = 100, DETAIL_PAGE = 10;
    var SNAP_KEY = 'tglSnapshots_v1', SNAP_MAX = 8;
    var DROP_RATIO = 0.2, ALERT_KEY = 'tglAlerted_v1';

    var RANK_COLORS = { '普通': '#8b8b80', '优良': '#6f9d74', '稀有': '#5f8fb8', '史诗': '#9b6fb8', '传说': '#c78a45', '神话': '#c9553f' };
    var STAGE_COLORS = ['#8ba888', '#a8b878', '#6fae94', '#4a8b8b', '#3a6b6b', '#2a4b4b'];
    var STAGE_NAMES = ['原初人形', '潜伏期', '轻度侵染', '中度侵染', '重度侵染', '馐兽'];
    var ANCHOR_PCT = { '头部': { x: 49.8, y: 7.2 }, '胸部': { x: 56.3, y: 25.4 }, '主躯干': { x: 50.1, y: 31.4 }, '左侧肢体': { x: 88.1, y: 21.5 }, '右侧肢体': { x: 12.2, y: 21.6 }, '内脏': { x: 50.3, y: 38.1 }, '性征': { x: 50.1, y: 40.2 } };
    var STYLE_BADGE = { '战斗': '战', '体感': '感', '私隐': '私' };
    var BRANCH_COLOR = { '纯净升格': '#6fae94', '完美同化': '#7fc4a8', '胎光侵染': '#c9a860', '互食异化': '#a03a30' };
    var REGIONS = ['长养密林', '噤寒雪原', '育沃孢林', '嶙峋荒漠', '潮涌汪洋', '吞藏草海', '渊心'];
    var QUALITIES = ['普通', '优良', '稀有', '史诗', '传说', '神话'];
    var RATINGS = ['损耗', '持平', '升华'];
    var STYLES = ['战斗', '体感', '私隐'];
    var LIST_KEY = { food: '食单', flesh: '进化特征' };
    var LEGACY_KEY = { food: '食单历史', flesh: '进化特征历史' };
    var ABYSS_KEYS = ['喰沃拉戈', '地渊', '渊心', '长养密林', '噤寒雪原', '育沃孢林', '嶙峋荒漠', '潮涌汪洋', '吞藏草海'];

    // ================= 纯工具 =================
    function num(v) { var n = Number(v); return isFinite(n) ? n : 0; }
    function str(v) { return String(v == null ? '' : v).trim(); }
    function arr(v) { return Array.isArray(v) ? v : []; }
    function obj(v) { return v && typeof v === 'object' && !Array.isArray(v) ? v : {}; }
    function esc(s) { return str(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
    function nameOf(it) { return typeof it === 'string' ? it : str(obj(it)['名']); }
    function fmtTime(ts) {
      try { var d = new Date(num(ts)); if (isNaN(d.getTime())) return '未知'; function p2(n) { return (n < 10 ? '0' : '') + n; } return (d.getMonth() + 1) + '-' + p2(d.getDate()) + ' ' + p2(d.getHours()) + ':' + p2(d.getMinutes()); } catch (e) { return '未知'; }
    }
    function joinDot(parts) { return parts.filter(Boolean).join(' · '); }

    // ================= 数据层 =================
    function getStat() { try { if (typeof getVariables !== 'function') return {}; return obj((getVariables({ type: 'message' }) || {})['stat_data']); } catch (e) { return {}; } }
    function getRoot() { return obj(obj(getStat()['事件'])['胎光食录']); }
    function getTargetData(t) { var root = getRoot(); if (t === 'user') return root; return obj(obj(root['同伴记录'])[t]); }
    function getPeerNames() { return Object.keys(obj(getRoot()['同伴记录'])).filter(Boolean); }
    function zoneOf(z) {
      var s = str(z);
      if (s.indexOf('头') === 0 || s.indexOf('脑') >= 0 || s.indexOf('眼') >= 0) return '头部';
      if (s.indexOf('胸') >= 0 || s.indexOf('乳') >= 0) return '胸部';
      if (s.indexOf('左') >= 0) return '左侧肢体';
      if (s.indexOf('右') >= 0) return '右侧肢体';
      if (s.indexOf('内') >= 0 || s.indexOf('脏') >= 0 || s.indexOf('胃') >= 0 || s.indexOf('肠') >= 0) return '内脏';
      if (s.indexOf('性') >= 0 || s.indexOf('臀') >= 0 || s.indexOf('阴') >= 0 || s.indexOf('肛') >= 0 || s.indexOf('后庭') >= 0) return '性征';
      return '主躯干';
    }
    function deriveTaste(pol) { return pol >= 180 ? 0 : pol >= 140 ? 15 : pol >= 100 ? 35 : pol >= 60 ? 60 : pol >= 20 ? 85 : 100; }

    // ◎素材三层识别：标签馐兽 / 描述含胎光 / 地渊地理兜底
    function isAbyssLoc() {
      var loc = str(obj(getStat()['世界'])['地点']);
      for (var i = 0; i < ABYSS_KEYS.length; i++) { if (loc.indexOf(ABYSS_KEYS[i]) >= 0) return true; }
      return false;
    }
    function isBeastItem(item) {
      var o = obj(item);
      var tags = arr(o['标签']);
      for (var i = 0; i < tags.length; i++) { if (str(tags[i]).indexOf('馐兽') >= 0) return true; }
      var desc = str(o['描述']);
      if (desc.indexOf('胎光') >= 0) return true;
      if (isAbyssLoc() && (str(o['类型']).indexOf('材料') >= 0 || str(o['类型']).indexOf('食材') >= 0)) return true;
      return false;
    }
    function getBeastMaterials() {
      var hero = obj(getStat()['主角']);
      var bag = obj(hero['背包']);
      var mats = [];
      for (var name in bag) { if (isBeastItem(bag[name])) { var o = obj(bag[name]); o._name = name; mats.push(o); } }
      return mats;
    }

    // ◎需求核心①：单一主数组、末尾追加、只增不减
    function getList(td, type) { var main = arr(td[LIST_KEY[type]]); var legacy = arr(td[LEGACY_KEY[type]]); return legacy.length ? legacy.concat(main) : main; }
    function winView(list) { var s = Math.max(0, list.length - MAIN_LIST_SIZE); return { items: list.slice(s), start: s }; }
    function histView(list) { return list.length > MAIN_LIST_SIZE ? list.slice(0, list.length - MAIN_LIST_SIZE) : []; }

    function writeStat(full) {
      var fn = typeof setVariables === 'function' ? setVariables : typeof replaceVariables === 'function' ? replaceVariables : typeof insertOrAssignVariables === 'function' ? insertOrAssignVariables : null;
      if (!fn) return false; fn({ 'stat_data': full }, { type: 'message' }); return true;
    }
    function ensureTd(full, target) {
      if (!full['事件']) full['事件'] = {};
      if (!full['事件']['胎光食录']) full['事件']['胎光食录'] = {};
      var root = full['事件']['胎光食录'];
      if (target === 'user') return root;
      if (!root['同伴记录']) root['同伴记录'] = {};
      if (!root['同伴记录'][target]) root['同伴记录'][target] = {};
      return root['同伴记录'][target];
    }
    function saveList(target, type, newList) {
      try {
        var full = JSON.parse(JSON.stringify(getStat()));
        var td = ensureTd(full, target);
        td[LIST_KEY[type]] = newList;
        delete td[LEGACY_KEY[type]];
        var ok = writeStat(full);
        if (ok) { state.justEdited = true; markManualEdit(); }
        return ok;
      } catch (e) { recordError('saveList', e); return false; }
    }
    // ◎玩家编辑标记信号（注入条目读后自动清除）
    function markManualEdit() {
      try {
        var full = JSON.parse(JSON.stringify(getStat()));
        if (!full['事件']) full['事件'] = {};
        if (!Array.isArray(full['事件']['信号'])) full['事件']['信号'] = [];
        if (full['事件']['信号'].indexOf('胎光食录_manual_edit') < 0) {
          full['事件']['信号'].push('胎光食录_manual_edit');
          writeStat(full);
        }
      } catch (e) {}
    }

    // ◎旧数据迁移
    function migrateLegacy() {
      try {
        var full = JSON.parse(JSON.stringify(getStat()));
        var root = obj(obj(full['事件'])['胎光食录']);
        if (!Object.keys(root).length) return;
        var dirty = false;
        ['food', 'flesh'].forEach(function (t) { if (root[LEGACY_KEY[t]] !== undefined) { root[LIST_KEY[t]] = arr(root[LEGACY_KEY[t]]).concat(arr(root[LIST_KEY[t]])); delete root[LEGACY_KEY[t]]; dirty = true; } });
        var peers = obj(root['同伴记录']);
        Object.keys(peers).forEach(function (n) { var p = obj(peers[n]); if (p['进化特征历史'] !== undefined) { p['进化特征'] = arr(p['进化特征历史']).concat(arr(p['进化特征'])); delete p['进化特征历史']; dirty = true; } });
        if (dirty) { writeStat(full); console.log('[胎光食录·TGL] 旧版历史已合并，记忆值得尊重'); }
      } catch (e) { recordError('init', e); }
    }
    migrateLegacy();

    function resolveIdx(list, idx, key) {
      if (idx >= 0 && idx < list.length && nameOf(list[idx]) === key) return idx;
      for (var i = list.length - 1; i >= 0; i--) { if (nameOf(list[i]) === key) return i; }
      return -1;
    }

    // ================= 快照系统 =================
    function loadSnapshots() { try { var s = localStorage.getItem(SNAP_KEY); var v = s ? JSON.parse(s) : []; return Array.isArray(v) ? v : []; } catch (e) { return []; } }
    function saveSnapshots(list) { try { localStorage.setItem(SNAP_KEY, JSON.stringify(list)); return true; } catch (e) { recordError('takeSnapshot', e); return false; } }
    function collectSnapshotData() {
      var root = getRoot();
      if (!Object.keys(root).length) return null;
      var data = { user: { '食单': getList(root, 'food'), '吞噬录': arr(root['吞噬录']), '进化特征': getList(root, 'flesh') }, peers: {} };
      var peers = obj(root['同伴记录']);
      Object.keys(peers).forEach(function (n) { var p = obj(peers[n]); data.peers[n] = { '吞噬录': arr(p['吞噬录']), '进化特征': getList(p, 'flesh') }; });
      return data;
    }
    function countsOf(data) {
      var u = obj(data.user);
      return { food: arr(u['食单']).length, devour: arr(u['吞噬录']).length, flesh: arr(u['进化特征']).length, peers: Object.keys(obj(data.peers)).length };
    }
    function currentMeta() {
      var world = obj(getStat()['世界']);
      var floor = null;
      try { if (typeof getCurrentMessageId === 'function') floor = getCurrentMessageId(); } catch (e) {}
      return { time: str(world['时间']), place: str(world['地点']), floor: floor, savedAt: Date.now() };
    }
    function detectDrop(cur, last) {
      if (!last || !last.user) return null;
      var pairs = [['食单', num(last.user['食单']), num(cur.user['食单'])], ['吞噬录', num(last.user['吞噬录']), num(cur.user['吞噬录'])], ['进化特征', num(last.user['进化特征']), num(cur.user['进化特征'])]];
      var worst = null;
      for (var i = 0; i < pairs.length; i++) { var n = pairs[i][0], o = pairs[i][1], c = pairs[i][2]; if (o > 0 && c < o && (o - c) / o > DROP_RATIO) { var pct = Math.round((o - c) / o * 100); if (!worst || pct > worst.pct) worst = { name: n, oldCount: o, newCount: c, pct: pct }; } }
      return worst;
    }
    function alertSig(info) { return info ? info.name + ':' + info.newCount : ''; }
    function wasAlerted(info) { try { return localStorage.getItem(ALERT_KEY) === alertSig(info); } catch (e) { return false; } }
    function markAlerted(info) { try { localStorage.setItem(ALERT_KEY, alertSig(info)); } catch (e) {} }

    var _takeSnapshot = function () {
      var data = collectSnapshotData();
      if (!data) { state.alertInfo = null; return; }
      var snaps = loadSnapshots();
      var last = snaps.length ? snaps[snaps.length - 1].data : null;
      if (last && JSON.stringify(last) === JSON.stringify(data)) { state.alertInfo = null; return; }
      if (state.justEdited) { state.justEdited = false; }
      else {
        var drop = detectDrop(data, last);
        if (drop) { if (wasAlerted(drop)) state.alertInfo = null; else { state.alertInfo = drop; console.warn('[胎光食录·TGL] 数据异常：' + drop.name + ' ' + drop.oldCount + '→' + drop.newCount + '，是被绯红之王削去了吗？'); } return; }
      }
      state.alertInfo = null;
      var meta = currentMeta();
      snaps.push({ time: meta.time, place: meta.place, floor: meta.floor, savedAt: meta.savedAt, counts: countsOf(data), data: data });
      while (snaps.length > SNAP_MAX) snaps.shift();
      saveSnapshots(snaps);
    };
    var takeSnapshot = safeRun('takeSnapshot', _takeSnapshot);

    var _restoreSnapshot = function (snap) {
      var d = obj(snap.data), du = obj(d.user);
      var full = JSON.parse(JSON.stringify(getStat()));
      if (!full['事件']) full['事件'] = {};
      if (!full['事件']['胎光食录']) full['事件']['胎光食录'] = {};
      var root = full['事件']['胎光食录'];
      ['食单', '吞噬录', '进化特征'].forEach(function (k) { root[k] = JSON.parse(JSON.stringify(arr(du[k]))); });
      delete root['食单历史']; delete root['进化特征历史'];
      if (!root['同伴记录']) root['同伴记录'] = {};
      var sp = obj(d.peers);
      Object.keys(sp).forEach(function (n) {
        if (!root['同伴记录'][n]) root['同伴记录'][n] = {};
        root['同伴记录'][n]['吞噬录'] = JSON.parse(JSON.stringify(arr(obj(sp[n])['吞噬录'])));
        root['同伴记录'][n]['进化特征'] = JSON.parse(JSON.stringify(arr(obj(sp[n])['进化特征'])));
        delete root['同伴记录'][n]['进化特征历史'];
      });
      if (!writeStat(full)) return false;
      var snaps = loadSnapshots();
      if (snaps.length) { var data = JSON.parse(JSON.stringify(d)); var meta = currentMeta(); snaps[snaps.length - 1] = { time: meta.time, place: meta.place, floor: meta.floor, savedAt: meta.savedAt, counts: countsOf(data), data: data }; saveSnapshots(snaps); }
      state.alertInfo = null;
      return true;
    };
    var restoreSnapshot = safeRun('restoreSnapshot', _restoreSnapshot);

    function findBestSnapshot() {
      var snaps = loadSnapshots(); var best = -1, bestTotal = -1;
      for (var i = 0; i < snaps.length; i++) { var c = obj(snaps[i].counts); var t = num(c.food) + num(c.devour) + num(c.flesh); if (t > bestTotal) { bestTotal = t; best = i; } }
      return best;
    }

    function loadPosition() { try { var s = localStorage.getItem('tglBtn_position'); if (s) return JSON.parse(s); } catch (e) {} return { right: '20px', bottom: '72px' }; }
    function savePosition(pos) { try { localStorage.setItem('tglBtn_position', JSON.stringify(pos)); } catch (e) {} }

    // ================= 样式 =================
    var CSS = [
      /* 悬浮球 */
      '#tglBtn{position:fixed;z-index:99990;width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,#2a3438,#1a2024);color:#6fae94;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;letter-spacing:.1em;cursor:grab;user-select:none;box-shadow:0 4px 16px rgba(0,0,0,.4);border:1px solid #3a4a48;touch-action:none}',
      '#tglBtn.dragging{cursor:grabbing}#tglBtn span{pointer-events:none}',
      /* 遮罩：纯色遮挡 */
      '#tglPanel,#tglDetail{position:fixed;inset:0;z-index:99991;display:none;background:rgba(15,12,8,.88)}',
      '#tglDetail{z-index:99992}',
      '#tglPanel *,#tglDetail *{box-sizing:border-box}',
      /* 容器骨架与主题 */
      '#tglPanel .inner{margin:auto;width:min(94vw,760px);max-height:92vh;overflow-y:auto;border-radius:16px;font-family:"Noto Serif SC","Songti SC",serif;box-shadow:0 32px 80px rgba(0,0,0,.7)}',
      '#tglDetail .detail-inner{margin:auto;width:min(92vw,680px);max-height:88vh;border-radius:14px;font-family:"Noto Serif SC","Songti SC",serif;box-shadow:0 28px 70px rgba(0,0,0,.75);display:flex;flex-direction:column;overflow:hidden}',
      '#tglPanel .food,#tglDetail .food{background:linear-gradient(165deg,#4a3828,#3d2f20 45%,#332618);border:1px solid #5a4a38;color:#c4b8a8}',
      '#tglPanel .flesh,#tglDetail .flesh{background:linear-gradient(180deg,#1e2422,#181d1b 50%,#121514);border:1px solid #3d4a46;color:#c8d2cd}',
      /* 头部 */
      '#tglPanel .hd,#tglDetail .detail-hd{display:flex;justify-content:space-between;align-items:center;padding:18px 26px 12px;flex-shrink:0}',
      '#tglPanel .tt,#tglDetail .detail-tt{font-size:19px;font-weight:700;letter-spacing:.18em}',
      '#tglPanel .food .tt,#tglDetail .food .detail-tt{color:#d4c8b8}#tglPanel .flesh .tt,#tglDetail .flesh .detail-tt{color:#7dbfa5}',
      '#tglPanel .hd-r{display:flex;gap:8px;align-items:center;flex-wrap:wrap;justify-content:flex-end}',
      '#tglPanel .x,#tglDetail .detail-x{cursor:pointer;padding:6px 12px;border-radius:7px;font-size:11px;border:1px solid;transition:all .2s}',
      '#tglPanel .food .x,#tglDetail .food .detail-x{border-color:#5a4a38;background:rgba(255,255,255,.08);color:#c4b8a8}',
      '#tglPanel .flesh .x,#tglDetail .flesh .detail-x{border-color:#3d4a46;background:rgba(255,255,255,.08);color:#c8d2cd}',
      '#tglPanel .ro-btn{cursor:pointer;padding:6px 12px;border-radius:7px;font-size:10px;border:1px solid;font-weight:600;transition:all .2s}',
      '#tglPanel .food .ro-btn{border-color:#5a4a38;background:rgba(255,255,255,.08);color:#c4b8a8}#tglPanel .food .ro-btn.active{background:#8a6a48;color:#fff}',
      '#tglPanel .flesh .ro-btn{border-color:#3d4a46;background:rgba(255,255,255,.08);color:#c8d2cd}#tglPanel .flesh .ro-btn.active{background:#6fae94;color:#0d1110}',
      /* 同伴选择与页签 */
      '#tglPanel .sel{padding:9px 26px 11px}#tglPanel .food .sel{border-bottom:1px solid rgba(90,74,56,.35)}#tglPanel .flesh .sel{border-bottom:1px solid #3d4a46}',
      '#tglPanel .sel select{width:100%;padding:8px 11px;border-radius:7px;font-size:12px;font-family:inherit}',
      '#tglPanel .food .sel select{border:1px solid #5a4a38;background:#3d2f20;color:#c4b8a8}#tglPanel .flesh .sel select{border:1px solid #3d4a46;background:#181d1b;color:#c8d2cd}',
      '#tglPanel .tabs{display:flex}#tglPanel .food .tabs{border-bottom:1px solid rgba(90,74,56,.35)}#tglPanel .flesh .tabs{border-bottom:1px solid #3d4a46}',
      '#tglPanel .tab{flex:1;padding:11px;text-align:center;font-size:12px;letter-spacing:.2em;cursor:pointer;user-select:none;font-weight:600;position:relative;transition:all .2s}',
      '#tglPanel .food .tab{color:#a89888}#tglPanel .food .tab.on{color:#d4c8b8;background:rgba(255,255,255,.1)}',
      '#tglPanel .flesh .tab{color:#7a8a86}#tglPanel .flesh .tab.on{color:#7dbfa5;background:rgba(111,174,148,.1)}',
      '#tglPanel .tab.on:after{content:"";position:absolute;bottom:-1px;left:22%;right:22%;height:2px;background:currentColor}',
      /* 主体与统计卡 */
      '#tglPanel .body{padding:16px 26px 22px;font-size:13px;line-height:1.7}#tglDetail .detail-body{padding:14px 24px;font-size:13px;line-height:1.7;overflow-y:auto;flex:1}',
      '#tglPanel .stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px}',
      '#tglPanel .stat{padding:12px 10px 10px;border-radius:9px;text-align:center}',
      '#tglPanel .food .stat{border:1px solid rgba(90,74,56,.4);background:rgba(255,255,255,.06)}#tglPanel .flesh .stat{border:1px solid #3d4a46;background:rgba(0,0,0,.2)}',
      '#tglPanel .sl{display:block;font-size:9px;letter-spacing:.16em;font-weight:600;opacity:.85}#tglPanel .sv{display:block;margin-top:3px;font-size:19px;font-weight:700}',
      '#tglPanel .food .sl{color:#a89888}#tglPanel .flesh .sl{color:#7a8a86}#tglPanel .food .sv{color:#d4c8b8}#tglPanel .flesh .sv{color:#7dbfa5}',
      /* 历史按钮与分区标题 */
      '#tglPanel .hist-btns{display:flex;gap:8px;margin-bottom:14px}',
      '#tglPanel .hist-btn{flex:1;padding:9px;border-radius:7px;font-size:11px;text-align:center;cursor:pointer;border:1px solid;font-weight:600;letter-spacing:.06em;transition:all .2s}',
      '#tglPanel .food .hist-btn{border-color:#5a4a38;background:rgba(255,255,255,.08);color:#a89888}#tglPanel .flesh .hist-btn{border-color:#3d4a46;background:rgba(255,255,255,.06);color:#7a8a86}',
      '#tglPanel .hist-btn.warn{border-color:#a03a30!important;color:#c97a6a!important;background:rgba(160,58,48,.12)!important}',
      '#tglPanel .sect{margin-top:16px}',
      '#tglPanel .sect-t{display:flex;align-items:center;gap:9px;margin:0 0 10px;font-size:11px;letter-spacing:.2em;font-weight:700}',
      '#tglPanel .food .sect-t{color:#d4c8b8}#tglPanel .flesh .sect-t{color:#7dbfa5}',
      '#tglPanel .sect-t:before{content:"❧";opacity:.55}#tglPanel .sect-t:after{content:"";flex:1;height:1px;opacity:.28;background:currentColor}',
      /* 列表与条目卡 */
      '#tglPanel .list{display:grid;grid-template-columns:repeat(2,1fr);gap:9px}#tglDetail .detail-list{display:grid;gap:9px}',
      '#tglDetail .warn{margin:0 0 12px;padding:10px 14px;border-radius:7px;font-size:11px;line-height:1.6;border:1px solid #a03a30;background:rgba(160,58,48,.12);color:#c97a6a}',
      '#tglPanel .item,#tglDetail .detail-item{padding:10px 12px;border-radius:7px;font-size:11px;line-height:1.6;overflow-wrap:anywhere;position:relative}',
      '#tglPanel .food .item,#tglDetail .food .detail-item{border:1px solid rgba(90,74,56,.35);border-left:3px solid #5a4a38;background:rgba(255,255,255,.07)}',
      '#tglPanel .flesh .item,#tglDetail .flesh .detail-item{border:1px solid #3d4a46;border-left:3px solid #4a6b5c;background:rgba(255,255,255,.03)}',
      '#tglPanel .item.editing{border-left-width:5px}',
      '#tglPanel .seq{position:absolute;top:8px;right:10px;font-size:9px;opacity:.45;font-weight:700}',
      '#tglPanel .in,#tglDetail .detail-in{font-weight:650;font-size:12px}#tglPanel .food .in,#tglDetail .food .detail-in{color:#d4c8b8}#tglPanel .flesh .in,#tglDetail .flesh .detail-in{color:#c8d2cd}',
      '#tglPanel .iq,#tglDetail .iq{font-size:9px;font-weight:700;margin-left:6px;padding:1px 6px;border-radius:3px;border:1px solid currentColor}',
      '#tglPanel .ilv,#tglDetail .ilv{font-size:9px;margin-left:6px;opacity:.6;font-weight:700}',
      '#tglPanel .ib,#tglDetail .detail-ib{display:block;font-size:10px;margin-top:3px;opacity:.78;line-height:1.5}',
      '#tglPanel .ib.gain{opacity:1;color:#9fc4a8}#tglPanel .food .ib.gain{color:#c9b184}',
      '#tglPanel .ib.taste-note{font-style:italic}#tglPanel .ishare{display:block;font-size:10px;font-style:italic;margin-top:3px;opacity:.65}',
      '#tglPanel .iops{margin-top:7px;display:flex;gap:5px;justify-content:flex-end}',
      /* 编辑表单 */
      '#tglPanel .edit-form{margin-top:6px;padding:8px;border-radius:5px;background:rgba(0,0,0,.14)}',
      '#tglPanel .edit-row{margin-bottom:5px}#tglPanel .edit-row label{display:block;font-size:9px;margin-bottom:2px;opacity:.7}',
      '#tglPanel .edit-row input[type=text],#tglPanel .edit-row select{width:100%;padding:4px 7px;border-radius:4px;font-size:11px;font-family:inherit}',
      '#tglPanel .food .edit-row input,#tglPanel .food .edit-row select{border:1px solid #5a4a38;background:#3d2f20;color:#c4b8a8}',
      '#tglPanel .flesh .edit-row input,#tglPanel .flesh .edit-row select{border:1px solid #3d4a46;background:#181d1b;color:#c8d2cd}',
      '#tglPanel .edit-check label{font-size:11px;opacity:1;display:flex;align-items:center;gap:6px}',
      '#tglPanel .edit-actions{display:flex;gap:5px;margin-top:6px}',
      /* 按钮 */
      '#tglPanel .btn,#tglDetail .detail-btn{padding:4px 10px;border-radius:4px;font-size:10px;cursor:pointer;font-weight:600;letter-spacing:.04em;border:1px solid;display:inline-block;text-align:center;transition:all .15s}',
      '#tglPanel .food .btn{border-color:#5a4a38;background:rgba(255,255,255,.08);color:#a89888}#tglPanel .flesh .btn{border-color:#3d4a46;background:rgba(255,255,255,.06);color:#7a8a86}',
      '#tglPanel .btn-save{border-color:#6f9d74!important;color:#9fc4a8!important}#tglPanel .btn-save:hover{background:#6f9d74!important;color:#fff!important}',
      '#tglPanel .btn-del,#tglDetail .detail-btn-del{border-color:#a03a30!important;color:#c97a6a!important;margin-left:5px}',
      '#tglDetail .detail-btn-del{margin-top:6px}',
      '#tglPanel .btn-del.confirm,#tglDetail .detail-btn-del.confirm{background:#a03a30!important;color:#fff!important}',
      '#tglPanel .btn-add{display:block;width:100%;margin-top:9px;padding:8px;border-style:dashed!important;text-align:center}',
      /* 异常警报条 */
      '#tglPanel .alert-bar{margin:0 0 14px;padding:10px 14px;border-radius:8px;font-size:11px;line-height:1.7;border:1px solid #a03a30;background:rgba(160,58,48,.14);color:#e0a49a;display:flex;flex-direction:column;gap:8px}',
      '#tglPanel .alert-bar b{color:#c9553f}',
      '#tglPanel .alert-ops{display:flex;gap:8px;justify-content:flex-end}',
      '#tglPanel .alert-btn{padding:4px 12px;border-radius:5px;font-size:10px;cursor:pointer;font-weight:700;border:1px solid;transition:all .15s}',
      '#tglPanel .alert-btn.restore{border-color:#6fae94;color:#9fd4bc;background:rgba(111,174,148,.1)}',
      '#tglPanel .alert-btn.restore:hover{background:#6fae94;color:#0d1110}',
      '#tglPanel .alert-btn.dismiss{border-color:#6a5a4a;color:#a89888;background:rgba(255,255,255,.05)}',
      '#tglPanel .alert-btn.dismiss:hover{background:rgba(255,255,255,.12)}',
      /* 弹窗底部分页 */
      '#tglDetail .detail-footer{padding:12px 24px;border-top:1px solid;display:flex;justify-content:space-between;align-items:center;flex-shrink:0}',
      '#tglDetail .food .detail-footer{border-top-color:rgba(90,74,56,.35)}#tglDetail .flesh .detail-footer{border-top-color:#3d4a46}',
      '#tglDetail .page-info{font-size:11px;opacity:.8}#tglDetail .page-btns{display:flex;gap:6px}',
      '#tglDetail .page-btn{padding:5px 12px;border-radius:5px;font-size:10px;cursor:pointer;border:1px solid;font-weight:600;font-family:inherit}',
      '#tglDetail .page-btn:disabled{opacity:.35;cursor:not-allowed}',
      '#tglDetail .food .page-btn{border-color:#5a4a38;background:rgba(255,255,255,.08);color:#a89888}#tglDetail .flesh .page-btn{border-color:#3d4a46;background:rgba(255,255,255,.08);color:#7a8a86}',
      /* 空态 */
      '#tglPanel .empty,#tglDetail .detail-empty{padding:18px 12px;text-align:center;font-style:italic;border-radius:8px;font-size:11px;grid-column:1/-1}',
      '#tglPanel .food .empty,#tglDetail .food .detail-empty{border:2px dashed #5a4a38;color:#a89888}#tglPanel .flesh .empty,#tglDetail .flesh .detail-empty{border:2px dashed #3d4a46;color:#7a8a86}',
      /* 产地分布与味觉槽 */
      '#tglPanel .reg{display:grid;gap:7px}#tglPanel .rw{display:flex;align-items:center;gap:11px;font-size:10px}',
      '#tglPanel .rl{flex:0 0 auto;width:76px;letter-spacing:.08em;font-weight:600;opacity:.85}#tglPanel .rb{flex:1;height:6px;border-radius:3px;overflow:hidden;background:rgba(0,0,0,.25)}',
      '#tglPanel .rb i{display:block;height:100%;border-radius:3px}#tglPanel .food .rb i{background:linear-gradient(90deg,#9a7a58,#8a6a48)}#tglPanel .flesh .rb i{background:linear-gradient(90deg,#4a6b5c,#6fae94)}',
      '#tglPanel .rn{flex:0 0 auto;font-weight:700;font-size:11px;min-width:20px;text-align:right}#tglPanel .rw.z{opacity:.3}',
      '#tglPanel .taste{margin-top:16px;padding:13px 15px;border-radius:9px}#tglPanel .food .taste{border:1px solid #5a4a38;background:rgba(255,255,255,.06)}',
      '#tglPanel .taste-r{display:flex;justify-content:space-between;margin-bottom:7px;font-size:10px;letter-spacing:.1em;font-weight:600}',
      '#tglPanel .taste-b{height:6px;border-radius:3px;overflow:hidden;background:rgba(0,0,0,.2)}#tglPanel .taste-b i{display:block;height:100%;background:linear-gradient(90deg,#9a7a58,#8a6a48)}',
      '#tglPanel .taste-n{margin:7px 0 0;font-size:10px;font-style:italic;opacity:.65}',
      /* 血肉页 */
      '#tglPanel .gauge{padding:14px;border-radius:9px;margin-bottom:14px}#tglPanel .flesh .gauge{border:1px solid #3d4a46;background:rgba(0,0,0,.25)}',
      '#tglPanel .gt{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px;font-size:11px}#tglPanel .gt span{opacity:.75;letter-spacing:.12em}#tglPanel .gt b{font-size:20px}',
      '#tglPanel .tk{height:10px;border-radius:5px;background:#0d1110;overflow:hidden;border:1px solid #3d4a46}#tglPanel .tk i{display:block;height:100%;border-radius:5px;transition:width .4s}',
      '#tglPanel .mk{display:flex;justify-content:space-between;margin-top:5px;font-size:8px;opacity:.6}#tglPanel .sgt{margin-top:8px;font-size:11px;letter-spacing:.12em}',
      '#tglPanel .figwrap{position:relative;max-width:340px;margin:0 auto 14px}#tglPanel .figwrap img{width:100%;display:block;border-radius:9px;border:1px solid #3d4a46;box-shadow:0 10px 26px rgba(0,0,0,.6)}',
      '#tglPanel .anchor{position:absolute;width:13px;height:13px;border-radius:50%;background:#6fae94;box-shadow:0 0 10px #6fae94,0 0 0 3px rgba(13,17,16,.9);border:2px solid #c4b8a8;transform:translate(-50%,-50%);z-index:2}',
      '#tglPanel .anchor-num{position:absolute;min-width:20px;height:20px;padding:0 5px;border:1px solid #c4b8a8;border-radius:10px;color:#0d1110;font-size:10px;font-weight:700;text-align:center;line-height:18px;background:#6fae94;transform:translate(-50%,-160%);z-index:3}',
      '#tglPanel .zsum{margin-bottom:6px}#tglPanel .zrow{display:flex;flex-wrap:wrap;gap:5px;align-items:center;padding:6px 0;border-bottom:1px dotted #3d4a46;font-size:10px}',
      '#tglPanel .zrow b{flex:0 0 64px;color:#7dbfa5}#tglPanel .ztag{padding:1px 7px;border:1px solid #3d4a46;border-radius:8px;color:#7a8a86}#tglPanel .ztag.cost{border-color:#a03a30;color:#c97a6a}',
      '#tglPanel .zlist{display:grid;gap:8px}',
      '#tglPanel .zi2{display:flex;flex-wrap:wrap;align-items:baseline;gap:7px;padding:10px 13px;border-radius:7px;font-size:11px;line-height:1.6;border:1px solid #3d4a46;border-left:3px solid #4a6b5c;background:rgba(255,255,255,.03)}',
      '#tglPanel .zi2.cost{border-left-color:#a03a30;background:rgba(160,58,48,.07)}#tglPanel .zi2.private{border-left-color:#b87a9a}#tglPanel .zi2.editing{border-left-width:5px}',
      '#tglPanel .mn{flex:0 0 auto;width:18px;height:18px;border:1.5px solid currentColor;border-radius:50%;color:#6fae94;font-size:9px;text-align:center;line-height:16px;font-weight:700}#tglPanel .zi2.cost .mn{color:#a03a30}',
      '#tglPanel .sbadge{flex:0 0 auto;padding:1px 6px;border:1px solid currentColor;border-radius:3px;font-size:9px;color:#7a8a86}#tglPanel .zi2.private .sbadge{color:#b87a9a}',
      '#tglPanel .mnm{font-weight:650;font-size:12px;overflow-wrap:anywhere;color:#c8d2cd}#tglPanel .mz{color:#7a8a86;font-size:10px}',
      '#tglPanel .md{flex-basis:100%;color:#7a8a86;font-size:10px;line-height:1.6;padding-top:4px;margin-top:2px;border-top:1px dotted #3d4a46}',
      '#tglPanel .md.blur{filter:blur(4px);opacity:.4;transition:filter .3s,opacity .3s}#tglPanel .md.blur.open{filter:blur(0);opacity:1}',
      '#tglPanel .mag{flex:0 0 auto;cursor:pointer;font-size:13px;opacity:.7;user-select:none;color:#6fae94}#tglPanel .mag:hover{opacity:1}',
      /* 快照库 */
      '#tglDetail .snap-tip{margin:0 0 12px;padding:10px 14px;border-radius:7px;font-size:10px;line-height:1.7;border:1px dashed #3d4a46;color:#7a8a86;background:rgba(255,255,255,.03)}',
      '#tglDetail .snap-hd{display:flex;justify-content:space-between;gap:8px;font-size:11px;font-weight:700;color:#c8d2cd;flex-wrap:wrap}',
      '#tglDetail .snap-meta{font-size:10px;opacity:.75;margin-top:5px;line-height:1.7;color:#7a8a86}',
      '#tglDetail .snap-counts{margin-top:5px;font-size:10px;font-weight:600;color:#7dbfa5}',
      '#tglDetail .snap-ops{margin-top:8px;display:flex;gap:6px;justify-content:flex-end}',
      '#tglDetail .snap-restore{border-color:#6fae94!important;color:#9fd4bc!important;background:rgba(111,174,148,.08)}',
      '#tglDetail .snap-restore:hover{background:#6fae94!important;color:#0d1110!important}',
      '#tglDetail .snap-restore.confirm{background:#6fae94!important;color:#0d1110!important}',
      /* ◎增益汇总面板 */
      '#tglPanel .gains-panel{margin:0 26px 14px;padding:12px 16px;border-radius:9px;font-size:11px;line-height:1.7;display:none}',
      '#tglPanel .food .gains-panel{border:1px solid #5a4a38;background:rgba(255,255,255,.06)}',
      '#tglPanel .flesh .gains-panel{border:1px solid #3d4a46;background:rgba(0,0,0,.15)}',
      '#tglPanel .gains-panel.show{display:block}',
      '#tglPanel .gains-t{font-size:10px;font-weight:700;letter-spacing:.15em;margin-bottom:8px;opacity:.8}',
      '#tglPanel .gains-row{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:6px}',
      '#tglPanel .gains-tag{padding:2px 8px;border-radius:4px;font-size:10px;border:1px solid}',
      '#tglPanel .food .gains-tag{border-color:#5a4a38;background:rgba(255,255,255,.08);color:#c4b8a8}',
      '#tglPanel .flesh .gains-tag{border-color:#4a6b5c;background:rgba(111,174,148,.08);color:#7dbfa5}',
      '#tglPanel .gains-tag.check{border-color:#9b6fb8;color:#b88fd4}',
      '#tglPanel .gains-empty{font-style:italic;opacity:.6}',
      /* 移动端 */
      '@media(max-width:600px){#tglPanel .inner,#tglDetail .detail-inner{width:96vw;max-height:94vh}#tglPanel .stats{grid-template-columns:1fr 1fr}#tglPanel .list{grid-template-columns:1fr}}'
    ].join('\n');

    $('<style id="' + STYLE_ID + '">' + CSS + '<\/style>').appendTo(targetDoc.head);

    // ===== 悬浮球 =====
    $btn = $('<div id="' + BUTTON_ID + '"><span>食录</span></div>').css(loadPosition());
    $(targetDoc.body).append($btn);
    $panel = $('<div id="' + PANEL_ID + '"></div>').appendTo(targetDoc.body);
    $detail = $('<div id="' + DETAIL_ID + '"></div>').appendTo(targetDoc.body);

    // 修复④：初始位置钳制
    function clampBtn() {
      try {
        var win = targetDoc.defaultView || window;
        var r = $btn[0].getBoundingClientRect();
        var nx = Math.max(0, Math.min(r.left, win.innerWidth - $btn.outerWidth()));
        var ny = Math.max(0, Math.min(r.top, win.innerHeight - $btn.outerHeight()));
        if (Math.abs(nx - r.left) > 1 || Math.abs(ny - r.top) > 1) $btn.css({ left: nx + 'px', top: ny + 'px', right: 'auto', bottom: 'auto' });
      } catch (e) {}
    }
    clampBtn();

    // 修复⑤：拖拽 Pointer Events
    $btn.on('pointerdown', safeRun('drag', function (e) {
      var ev = e.originalEvent || e;
      var d = state.drag;
      d.on = true; d.moved = false; d.sx = ev.clientX; d.sy = ev.clientY;
      var r = $btn[0].getBoundingClientRect();
      d.ex = r.left; d.ey = r.top;
      $btn.addClass('dragging');
      try { $btn[0].setPointerCapture(ev.pointerId); } catch (err) {}
      e.preventDefault();
    }));
    $btn.on('pointermove', safeRun('drag', function (e) {
      var d = state.drag;
      if (!d.on) return;
      var ev = e.originalEvent || e;
      var dx = ev.clientX - d.sx, dy = ev.clientY - d.sy;
      if (!d.moved && Math.abs(dx) + Math.abs(dy) < 6) return;
      d.moved = true;
      var win = targetDoc.defaultView || window;
      var nx = Math.max(0, Math.min(d.ex + dx, win.innerWidth - $btn.outerWidth()));
      var ny = Math.max(0, Math.min(d.ey + dy, win.innerHeight - $btn.outerHeight()));
      $btn.css({ left: nx + 'px', top: ny + 'px', right: 'auto', bottom: 'auto' });
    }));
    $btn.on('pointerup pointercancel', safeRun('drag', function () {
      var d = state.drag;
      if (!d.on) return;
      d.on = false;
      $btn.removeClass('dragging');
      if (d.moved) { var r = $btn[0].getBoundingClientRect(); savePosition({ left: r.left + 'px', top: r.top + 'px' }); }
      else togglePanel();
    }));

    // ================= 渲染：共用元件 =================
    function statBox(l, v) { return '<div class="stat"><span class="sl">' + l + '</span><b class="sv">' + v + '</b></div>'; }
    // ◆修复：当前值不在枚举中时动态补一个 option，防止保存时被清空
    function selOpts(val, opts) {
      var s = '';
      var found = false;
      opts.forEach(function (op) { if (op === val) found = true; s += '<option value="' + op + '"' + (op === val ? ' selected' : '') + '>' + op + '</option>'; });
      if (val && !found) s += '<option value="' + esc(val) + '" selected>' + esc(val) + '</option>';
      return s;
    }
    function inp(cls, label, val) { return '<div class="edit-row"><label>' + label + '</label><input type="text" class="' + cls + '" value="' + esc(val) + '"></div>'; }
    function itemMeta(o, fb) { var q = str(o['品质']), h = ''; if (q) h += '<span class="iq" style="color:' + (RANK_COLORS[q] || fb) + '">' + esc(q) + '</span>'; var lv = num(o['等级']); if (lv) h += '<span class="ilv">Lv.' + lv + '</span>'; return h; }
    function actBtns(idx, key, cfm) { return '<div class="iops"><span class="btn btn-edit" data-act="edit" data-idx="' + idx + '" data-key="' + esc(key) + '">编辑</span><span class="btn btn-del' + (cfm ? ' confirm' : '') + '" data-act="del" data-idx="' + idx + '" data-key="' + esc(key) + '">' + (cfm ? '确认？' : '删除') + '</span></div>'; }
    function detailDelBtn(idx, cfm) { return '<span class="detail-btn detail-btn-del' + (cfm ? ' confirm' : '') + '" data-dact="del" data-idx="' + idx + '">' + (cfm ? '确认删除？' : '删除') + '</span>'; }

    // ================= ◎增益汇总（◆修复：接收目标数据，同伴页不串台） =================
    function computeGains(td) {
      var all = arr(td['食单']).concat(arr(td['吞噬录']));
      var muts = getList(td, 'flesh');
      var gains = {}, checks = {};
      var combatMut = 0, senseMut = 0, privMut = 0;

      all.forEach(function (r) {
        var g = str(obj(r)['增益']);
        if (!g) return;
        g.split(/[,，、;；]/).forEach(function (part) {
          var m = part.match(/^([^:：]+)[:：]\s*(.+)$/);
          if (!m) return;
          var name = m[1].trim(), val = m[2].trim();
          if (/^(HP|MP|SP)/i.test(name)) return;
          if (/^(力量|敏捷|体质|智力|精神)检定/.test(name)) {
            var n = parseInt(val) || 0;
            checks[name] = (checks[name] || 0) + n;
          } else {
            if (gains[name]) {
              var oldM = gains[name].match(/([+-]?\d+)/);
              var newM = val.match(/([+-]?\d+)/);
              if (oldM && newM) {
                var sum = parseInt(oldM[1]) + parseInt(newM[1]);
                var unit = val.replace(/[+-]?\d+/, '').trim();
                gains[name] = (sum >= 0 ? '+' : '') + sum + unit;
              }
            } else gains[name] = val;
          }
        });
      });

      muts.forEach(function (m) {
        var s = str(obj(m)['风格']);
        if (s === '战斗') combatMut++;
        else if (s === '私隐') privMut++;
        else senseMut++;
      });

      return { gains: gains, checks: checks, combatMut: combatMut, senseMut: senseMut, privMut: privMut };
    }

    var _renderGains = function (td) {
      var g = computeGains(td);
      var h = '<div class="gains-t">已获得演化增益汇总（实时计算）</div>';
      var gainKeys = Object.keys(g.gains);
      var checkKeys = Object.keys(g.checks);

      if (!gainKeys.length && !checkKeys.length) {
        h += '<div class="gains-empty">尚无增益记录</div>';
      } else {
        if (gainKeys.length) {
          h += '<div class="gains-row">';
          gainKeys.forEach(function (k) { h += '<span class="gains-tag">' + esc(k) + ': ' + esc(g.gains[k]) + '</span>'; });
          h += '</div>';
        }
        if (checkKeys.length) {
          h += '<div class="gains-row">';
          checkKeys.forEach(function (k) { h += '<span class="gains-tag check">' + esc(k) + ' +' + g.checks[k] + '</span>'; });
          h += '</div>';
        }
      }
      h += '<div class="gains-row" style="margin-top:8px;opacity:.7;font-size:10px">特征：战斗 ' + g.combatMut + ' · 体感 ' + g.senseMut + ' · 私隐 ' + g.privMut + '</div>';
      return h;
    };
    var renderGains = safeRun('renderGains', _renderGains);

    // ================= 渲染：食帖页 =================
    function buildRegions(list) {
      var cnt = {}, max = 1;
      REGIONS.forEach(function (k) { cnt[k] = 0; });
      list.forEach(function (r) { var p = str(obj(r)['产地']); REGIONS.forEach(function (k) { if (p.indexOf(k) >= 0) cnt[k]++; }); });
      REGIONS.forEach(function (k) { if (cnt[k] > max) max = cnt[k]; });
      var h = '<div class="sect"><h2 class="sect-t">产地分布</h2><div class="reg">';
      REGIONS.forEach(function (k) { var pct = cnt[k] ? Math.round(cnt[k] / max * 100) : 0; h += '<div class="rw' + (cnt[k] ? '' : ' z') + '"><span class="rl">' + k + '</span><span class="rb"><i style="width:' + pct + '%"></i></span><span class="rn">' + cnt[k] + '</span></div>'; });
      return h + '</div></div>';
    }

    var _buildFood = function (fd) {
      var list = getList(fd, 'food');
      var w = winView(list), hist = histView(list);
      var pol = num(fd['纯净偏离值']);
      var taste = fd['味觉'] !== undefined ? num(fd['味觉']) : deriveTaste(pol);
      var mats = getBeastMaterials();

      var h = '<div class="stats">' + statBox('收录', list.length) + statBox('味觉', taste + '%') + statBox('历史', hist.length) + '</div>';
      h += '<div class="hist-btns"><div class="hist-btn' + (hist.length >= HISTORY_WARN ? ' warn' : '') + '" data-detail="food">食单历史(' + hist.length + (hist.length >= HISTORY_WARN ? '·已满' : '') + ')</div></div>';

      // ◎增益汇总面板（可折叠，传入当前目标数据）
      h += '<div class="gains-panel' + (state.showGains ? ' show' : '') + '">' + renderGains(fd) + '</div>';

      // 未处理素材（从背包读）
      h += '<div class="sect"><h2 class="sect-t">未处理素材(' + mats.length + ')</h2>';
      if (!mats.length) h += '<div class="empty">背包中没有带「馐兽」标签的素材</div>';
      else {
        h += '<div class="list">';
        mats.forEach(function (m) {
          var q = str(m['品质']);
          h += '<div class="item" style="border-left-color:' + (RANK_COLORS[q] || '#5a4a38') + '"><span class="in">' + esc(m._name || nameOf(m)) + '</span>' + itemMeta(m, '#5a4a38');
          if (num(m['数量']) > 1) h += '<span class="ilv">×' + num(m['数量']) + '</span>';
          h += '</div>';
        });
        h += '</div>';
      }
      h += '</div>';

      h += '<div class="sect"><h2 class="sect-t">收录志 · 最新' + MAIN_LIST_SIZE + '条</h2><div class="list">';
      if (!w.items.length) h += '<div class="empty">尚无收录</div>';
      w.items.forEach(function (r, i) { h += buildFoodItem(r, w.start + i, i + 1); });
      h += '</div>';
      if (!state.readOnly && state.editingIdx === -1 && !state.adding) h += '<span class="btn btn-add" data-act="add">+ 新增条目</span>';
      if (state.adding && state.editingIdx === -1) h += buildFoodForm(-1, {});
      h += '</div>';

      h += buildRegions(list);
      h += '<div class="taste"><div class="taste-r"><b>味觉之灵</b><b>' + taste + '%</b></div><div class="taste-b"><i style="width:' + Math.max(0, Math.min(100, taste)) + '%"></i></div><p class="taste-n">舌根记得的每一种滋味，身体都一一记着账</p></div>';
      return h;
    };
    var buildFood = safeRun('render', _buildFood);

    function buildFoodItem(r, idx, seq) {
      var o = typeof r === 'string' ? { '名': r } : obj(r);
      var nm = str(o['名']);
      var qc = RANK_COLORS[str(o['品质'])] || '#5a4a38';
      var isEdit = state.editingIdx === idx;
      var h = '<div class="item' + (isEdit ? ' editing' : '') + '" style="border-left-color:' + qc + '"><span class="seq">' + seq + '</span>';
      if (isEdit) h += buildFoodForm(idx, o);
      else {
        h += '<span class="in">' + esc(nm) + '</span>' + itemMeta(o, qc);
        var meta = joinDot([str(o['产地']), str(o['部位'])]);
        if (meta) h += '<span class="ib">' + esc(meta) + '</span>';
        var sub = joinDot([str(o['料理']), str(o['厨师']) ? '掌勺:' + str(o['厨师']) : '', str(o['评定']) ? '评定:' + str(o['评定']) : '']);
        if (sub) h += '<span class="ib">' + esc(sub) + '</span>';
        if (str(o['增益'])) h += '<span class="ib gain">' + esc(o['增益']) + '</span>';
        if (str(o['风味'])) h += '<span class="ib taste-note">「' + esc(o['风味']) + '」</span>';
        if (str(o['分享'])) h += '<span class="ishare">与' + esc(o['分享']) + '分食</span>';
        if (!state.readOnly) h += actBtns(idx, nm, state.deleteConfirm === idx);
      }
      return h + '</div>';
    }

    function buildFoodForm(idx, o) {
      var h = '<div class="edit-form" data-idx="' + idx + '">';
      h += inp('ef-name', '名称（料理成品名）', o['名']);
      h += '<div class="edit-row"><label>品质</label><select class="ef-quality"><option value="">（无）</option>' + selOpts(str(o['品质']), QUALITIES) + '</select></div>';
      h += inp('ef-level', '等级', o['等级'] !== undefined ? o['等级'] : '');
      h += inp('ef-origin', '产地', o['产地']);
      h += inp('ef-part', '部位', o['部位']);
      h += inp('ef-dish', '料理法', o['料理']);
      h += inp('ef-chef', '掌勺', o['厨师']);
      h += '<div class="edit-row"><label>评定</label><select class="ef-rating"><option value="">（无）</option>' + selOpts(str(o['评定']), RATINGS) + '</select></div>';
      h += inp('ef-gain', '增益（永久，格式「效果名: 效果」）', o['增益']);
      h += inp('ef-flavor', '风味', o['风味']);
      h += inp('ef-share', '分享（独食留空）', o['分享']);
      h += '<div class="edit-actions"><span class="btn btn-save" data-act="save" data-idx="' + idx + '" data-key="' + esc(str(o['名'])) + '">' + (idx === -1 ? '添加' : '保存') + '</span><span class="btn btn-cancel" data-act="cancel">取消</span></div></div>';
      return h;
    }
    function collectFoodForm($f) {
      function v(c) { return str($f.find('.' + c).val()); }
      return { '名': v('ef-name'), '品质': v('ef-quality'), '等级': num(v('ef-level')), '产地': v('ef-origin'), '部位': v('ef-part'), '料理': v('ef-dish'), '厨师': v('ef-chef'), '评定': v('ef-rating'), '增益': v('ef-gain'), '风味': v('ef-flavor'), '分享': v('ef-share') };
    }

    // ================= 渲染：血肉页 =================
    function buildFigure(list) {
      var zones = {};
      list.forEach(function (m) { var z = zoneOf(obj(m)['部位']); if (!zones[z]) zones[z] = []; zones[z].push(m); });
      var keys = Object.keys(zones);
      var h = '<div class="figwrap"><img src="' + IMG_URL + '" alt="">';
      keys.forEach(function (z) { var p = ANCHOR_PCT[z]; if (!p) return; h += '<span class="anchor" style="left:' + p.x + '%;top:' + p.y + '%"></span><span class="anchor-num" style="left:' + p.x + '%;top:' + p.y + '%">' + zones[z].length + '</span>'; });
      h += '</div>';
      if (keys.length) {
        h += '<div class="zsum">';
        keys.forEach(function (z) { h += '<div class="zrow"><b>' + z + '</b>'; zones[z].forEach(function (m) { h += '<span class="ztag' + (obj(m)['代价'] === true ? ' cost' : '') + '">' + esc(nameOf(m)) + '</span>'; }); h += '</div>'; });
        h += '</div>';
      }
      return h;
    }

    var _buildFlesh = function (td, isUser) {
      var pol = num(td['纯净偏离值']);
      var stage = pol >= 180 ? 5 : pol >= 140 ? 4 : pol >= 100 ? 3 : pol >= 60 ? 2 : pol >= 20 ? 1 : 0;
      var form = str(td['形态']) || STAGE_NAMES[stage];
      var log = arr(td['吞噬录']);
      var list = getList(td, 'flesh');
      var w = winView(list), hist = histView(list);
      var vessel = str(td['法则容器']);

      var h = '<div class="gauge"><div class="gt"><span>纯净偏离</span><b>' + pol + '<small> / 200</small></b></div><div class="tk"><i style="width:' + Math.min(100, pol / 2) + '%;background:linear-gradient(90deg,#4a6b5c,' + STAGE_COLORS[stage] + ')"></i></div><div class="mk"><span>0</span><span>20</span><span>60</span><span>100</span><span>140</span><span>180</span><span>200</span></div><div class="sgt" style="color:' + STAGE_COLORS[stage] + '">● ' + esc(form) + ' · 第' + stage + '档 · 纯净升格' + (pol >= 60 ? '已封' : '开放') + '</div>';

      // ◎法则容器常驻显示：未拓宽时显示实时进度
      if (isUser) {
        if (vessel) {
          h += '<div class="sgt" style="color:#c9a860">◆ 法则容器：' + esc(vessel) + '</div>';
        } else {
          var mythAll = arr(td['吞噬录']).concat(getList(td, 'food'));
          var mTreas = 0, mBeast = 0;
          mythAll.forEach(function (r) {
            var o = obj(r);
            if (str(o['品质']).indexOf('神话') < 0) return;
            if (str(o['名']).indexOf('食宝') >= 0) mTreas++; else mBeast++;
          });
          h += '<div class="sgt" style="color:#8a7a5a">◇ 法则容器：未拓宽（神话 ' + Math.min(mBeast, 2) + '/2兽 · ' + Math.min(mTreas, 2) + '/2宝）</div>';
        }
      }
      h += '</div>';

      h += '<div class="stats">' + statBox('吞噬记录', log.length) + statBox('进化特征', list.length) + statBox('特征历史', hist.length) + '</div>';
      h += '<div class="hist-btns"><div class="hist-btn" data-detail="devour">吞噬录(' + log.length + ')</div><div class="hist-btn' + (hist.length >= HISTORY_WARN ? ' warn' : '') + '" data-detail="flesh">特征历史(' + hist.length + (hist.length >= HISTORY_WARN ? '·已满' : '') + ')</div></div>';

      // ◎增益汇总面板（传入当前目标数据）
      h += '<div class="gains-panel' + (state.showGains ? ' show' : '') + '">' + renderGains(td) + '</div>';

      h += buildFigure(list);

      h += '<div class="sect"><h2 class="sect-t">进化特征 · 最新' + MAIN_LIST_SIZE + '条</h2><div class="zlist">';
      if (!w.items.length) h += '<div class="empty">尚无进化特征</div>';
      w.items.forEach(function (m, i) { h += buildFleshItem(m, w.start + i, i + 1); });
      h += '</div>';
      if (!state.readOnly && state.editingIdx === -1 && !state.adding) h += '<span class="btn btn-add" data-act="add">+ 新增特征</span>';
      if (state.adding && state.editingIdx === -1) h += buildFleshForm(-1, {});
      h += '</div>';
      return h;
    };
    var buildFlesh = safeRun('render', _buildFlesh);

    function buildFleshItem(m, idx, seq) {
      var o = typeof m === 'string' ? { '名': m } : obj(m);
      var nm = str(o['名']);
      var cost = o['代价'] === true, priv = str(o['风格']) === '私隐';
      var isEdit = state.editingIdx === idx;
      var h = '<div class="zi2' + (cost ? ' cost' : '') + (priv ? ' private' : '') + (isEdit ? ' editing' : '') + '">';
      if (isEdit) h += buildFleshForm(idx, o);
      else {
        h += '<span class="mn">' + seq + '</span>';
        var badge = STYLE_BADGE[str(o['风格'])];
        if (badge) h += '<span class="sbadge">' + badge + '</span>';
        h += '<span class="mnm">' + esc(nm) + '</span>';
        if (str(o['部位'])) h += '<span class="mz">' + esc(o['部位']) + '</span>';
        if (cost) h += '<span class="sbadge" style="color:#a03a30">代价</span>';
        if (str(o['描述'])) {
          if (priv) h += '<span class="mag" data-act="peek" title="点击查看">👁</span><span class="md blur">' + esc(o['描述']) + '</span>';
          else h += '<span class="md">' + esc(o['描述']) + '</span>';
        }
        if (!state.readOnly) h += actBtns(idx, nm, state.deleteConfirm === idx);
      }
      return h + '</div>';
    }

    function buildFleshForm(idx, o) {
      var h = '<div class="edit-form" data-idx="' + idx + '">';
      h += inp('ef-name', '名称', o['名']);
      h += inp('ef-part', '部位（大区·细分）', o['部位']);
      h += inp('ef-desc', '描述', o['描述']);
      h += '<div class="edit-row"><label>风格</label><select class="ef-style"><option value="">（无）</option>' + selOpts(str(o['风格']), STYLES) + '</select></div>';
      h += '<div class="edit-row edit-check"><label><input type="checkbox" class="ef-cost"' + (o['代价'] === true ? ' checked' : '') + '> 带代价</label></div>';
      h += '<div class="edit-actions"><span class="btn btn-save" data-act="save" data-idx="' + idx + '" data-key="' + esc(str(o['名'])) + '">' + (idx === -1 ? '添加' : '保存') + '</span><span class="btn btn-cancel" data-act="cancel">取消</span></div></div>';
      return h;
    }
    function collectFleshForm($f) { return { '名': str($f.find('.ef-name').val()), '部位': str($f.find('.ef-part').val()), '描述': str($f.find('.ef-desc').val()), '风格': str($f.find('.ef-style').val()), '代价': $f.find('.ef-cost').is(':checked') }; }

    // ================= 渲染：历史/吞噬录弹窗 =================
    function dFood(r, idx, canDel) {
      var o = typeof r === 'string' ? { '名': r } : obj(r);
      var q = str(o['品质']);
      var h = '<div class="detail-item" style="border-left-color:' + (RANK_COLORS[q] || '#5a4a38') + '"><span class="detail-in">' + esc(nameOf(r)) + '</span>' + itemMeta(o, '#5a4a38');
      var meta = joinDot([str(o['产地']), str(o['部位']), str(o['评定']) ? '评定:' + str(o['评定']) : '']);
      if (meta) h += '<span class="detail-ib">' + esc(meta) + '</span>';
      if (str(o['增益'])) h += '<span class="detail-ib">' + esc(o['增益']) + '</span>';
      if (str(o['分享'])) h += '<span class="ishare">与' + esc(o['分享']) + '分食</span>';
      if (canDel) h += detailDelBtn(idx, state.detailDel === idx);
      return h + '</div>';
    }
    function dFlesh(m, idx, canDel) {
      var o = typeof m === 'string' ? { '名': m } : obj(m);
      var cost = o['代价'] === true;
      var h = '<div class="detail-item" style="border-left-color:' + (cost ? '#a03a30' : '#4a6b5c') + '"><span class="detail-in">' + esc(nameOf(m)) + '</span>';
      var badge = STYLE_BADGE[str(o['风格'])];
      if (badge) h += '<span class="sbadge">' + badge + '</span>';
      if (str(o['部位'])) h += '<span class="detail-ib">' + esc(o['部位']) + '</span>';
      if (str(o['描述'])) h += '<span class="detail-ib">' + esc(o['描述']) + '</span>';
      if (cost) h += '<span class="detail-ib" style="color:#c97a6a">带代价</span>';
      if (canDel) h += detailDelBtn(idx, state.detailDel === idx);
      return h + '</div>';
    }
    function dDevour(r) {
      var o = typeof r === 'string' ? { '名': r } : obj(r);
      var br = str(o['分支']);
      var h = '<div class="detail-item" style="border-left-color:' + (BRANCH_COLOR[br] || '#7a8a86') + '"><span class="detail-in">' + esc(nameOf(r)) + '</span>' + itemMeta(o, '#4a6b5c');
      var meta = joinDot([str(o['产地']), str(o['部位'])]);
      if (meta) h += '<span class="detail-ib">' + esc(meta) + '</span>';
      if (br) h += '<span class="detail-ib" style="color:' + (BRANCH_COLOR[br] || '#7a8a86') + '">分支：' + esc(br) + '</span>';
      if (str(o['增益'])) h += '<span class="detail-ib">增益：' + esc(o['增益']) + '</span>';
      if (str(o['特征'])) h += '<span class="detail-ib">特征：' + esc(o['特征']) + '</span>';
      if (str(o['代价'])) h += '<span class="detail-ib" style="color:#c97a6a">代价：' + esc(o['代价']) + '</span>';
      return h + '</div>';
    }

    var _renderDetail = function () {
      if (state.detailType === 'snap') return renderSnaps();
      var type = state.detailType;
      var td = getTargetData(state.currentTarget);
      var theme = type === 'food' ? 'food' : 'flesh';
      var title, full = null, items, canDel = false;

      if (type === 'food') { title = '食单历史'; full = getList(td, 'food'); items = histView(full); canDel = !state.readOnly; }
      else if (type === 'flesh') { title = '进化特征历史'; full = getList(td, 'flesh'); items = histView(full); canDel = !state.readOnly; }
      else { title = '吞噬录'; items = arr(td['吞噬录']); }

      var total = items.length;
      var pages = Math.max(1, Math.ceil(total / DETAIL_PAGE));
      if (state.detailPage >= pages) state.detailPage = pages - 1;
      if (state.detailPage < 0) state.detailPage = 0;
      var page = state.detailPage;

      var h = '<div class="detail-inner ' + theme + '"><div class="detail-hd"><span class="detail-tt">' + title + '(' + total + ')</span><span class="detail-x" data-dact="close">合上</span></div><div class="detail-body">';
      if ((type === 'food' || type === 'flesh') && total >= HISTORY_WARN) h += '<div class="warn">历史已达 ' + total + ' 条（提醒线 ' + HISTORY_WARN + ' 条）。册子太厚会压垮行囊——请挑拣不再需要的记忆，逐条删除。首页最新 ' + MAIN_LIST_SIZE + ' 条不受影响。</div>';
      if (!total) h += '<div class="detail-empty">这里还空着</div>';
      else {
        h += '<div class="detail-list">';
        var start = total - 1 - page * DETAIL_PAGE, end = Math.max(-1, start - DETAIL_PAGE);
        for (var i = start; i > end; i--) { if (type === 'food') h += dFood(items[i], i, canDel); else if (type === 'flesh') h += dFlesh(items[i], i, canDel); else h += dDevour(items[i]); }
        h += '</div>';
      }
      h += '</div><div class="detail-footer"><span class="page-info">第 ' + (page + 1) + ' / ' + pages + ' 页 · 共 ' + total + ' 条</span><div class="page-btns"><button class="page-btn" data-dact="prev"' + (page <= 0 ? ' disabled' : '') + '>上一页</button><button class="page-btn" data-dact="next"' + (page >= pages - 1 ? ' disabled' : '') + '>下一页</button></div></div></div>';
      $detail.html(h);
    };
    var renderDetail = safeRun('renderDetail', _renderDetail);

    function openDetail(type) { state.detailType = type; state.detailPage = 0; state.detailDel = -1; renderDetail(); $detail.css('display', 'flex'); }

    // ================= 渲染：快照库弹窗 =================
    var _renderSnaps = function () {
      var snaps = loadSnapshots();
      var h = '<div class="detail-inner flesh"><div class="detail-hd"><span class="detail-tt">快照库 · ' + snaps.length + '/' + SNAP_MAX + '</span><span class="detail-x" data-sact="close">合上</span></div><div class="detail-body">';
      h += '<div class="snap-tip">每次打开面板自动存档（内容无变化不存），最多 ' + SNAP_MAX + ' 份。检测异常不存档并警报。恢复不额外产生快照。<br>恢复 = 把食单/吞噬录/进化特征写回当前楼层，偏离值与形态不动。</div>';
      if (!snaps.length) h += '<div class="detail-empty">还没有快照</div>';
      else {
        h += '<div class="detail-list">';
        for (var i = snaps.length - 1; i >= 0; i--) {
          var s = snaps[i], c = obj(s.counts);
          h += '<div class="detail-item snap-card"><div class="snap-hd"><span>#' + (i + 1) + (i === snaps.length - 1 ? ' · 最新' : '') + '</span><span>' + esc(s.time || '时间未知') + '</span></div><div class="snap-meta">地点：' + esc(s.place || '未知') + '<br>楼层：' + (s.floor !== null && s.floor !== undefined ? '第 ' + s.floor + ' 楼' : '未知') + ' · 存于 ' + fmtTime(s.savedAt) + '</div><div class="snap-counts">食单 ' + num(c.food) + ' · 吞噬 ' + num(c.devour) + ' · 特征 ' + num(c.flesh) + ' · 同伴 ' + num(c.peers) + '</div>';
          var rc = state.snapRestore === i, dc = state.snapDel === i;
          h += '<div class="snap-ops"><span class="detail-btn snap-restore' + (rc ? ' confirm' : '') + '" data-sact="restore" data-i="' + i + '">' + (rc ? '确认恢复到当前楼层？' : '恢复') + '</span><span class="detail-btn detail-btn-del' + (dc ? ' confirm' : '') + '" data-sact="drop" data-i="' + i + '" style="margin-top:0">' + (dc ? '确认删除？' : '删除') + '</span></div></div>';
        }
        h += '</div>';
      }
      h += '</div></div>';
      $detail.html(h);
    };
    var renderSnaps = safeRun('renderSnaps', _renderSnaps);

    function openSnaps() { state.detailType = 'snap'; state.snapRestore = -1; state.snapDel = -1; renderSnaps(); $detail.css('display', 'flex'); }

    // ================= 渲染：主面板 =================
    var _render = function () {
      var isUser = state.currentTarget === 'user';
      var td = getTargetData(state.currentTarget);
      var theme = state.currentTab;
      var title = theme === 'food' ? '胎光食录 · 食帖' : '胎光食录 · 血肉';
      if (!isUser) title += ' · ' + state.currentTarget;

      var h = '<div class="inner ' + theme + '"><div class="hd"><span class="tt">' + esc(title) + '</span><div class="hd-r">';
      h += '<span class="x" data-act="gains">增益</span>';
      h += '<span class="x" data-act="snaps">快照</span>';
      h += '<span class="ro-btn' + (state.readOnly ? ' active' : '') + '" data-act="ro">' + (state.readOnly ? '只读中' : '可编辑') + '</span>';
      h += '<span class="x" data-act="refresh">刷新</span><span class="x" data-act="close">合上</span></div></div>';

      if (state.alertInfo) {
        h += '<div class="alert-bar"><div><b>⚠ 检测到记录异常</b>：' + esc(state.alertInfo.name) + '从 <b>' + state.alertInfo.oldCount + '</b> 条骤降到 <b>' + state.alertInfo.newCount + '</b> 条（-' + state.alertInfo.pct + '%）。这份异常数据<b>没有</b>存入快照。若这是AI失误，建议立即恢复；若是你自己删的，点"知道了"即可。</div><div class="alert-ops"><span class="alert-btn restore" data-act="alert-restore">立即恢复最佳快照</span><span class="alert-btn dismiss" data-act="alert-dismiss">知道了</span></div></div>';
      }

      var peers = getPeerNames();
      if (peers.length) {
        h += '<div class="sel"><select class="target-sel"><option value="user"' + (isUser ? ' selected' : '') + '>主角</option>';
        peers.forEach(function (n) { h += '<option value="' + esc(n) + '"' + (state.currentTarget === n ? ' selected' : '') + '>' + esc(n) + '</option>'; });
        h += '</select></div>';
      }

      h += '<div class="tabs"><div class="tab' + (theme === 'food' ? ' on' : '') + '" data-tab="food">食帖</div><div class="tab' + (theme === 'flesh' ? ' on' : '') + '" data-tab="flesh">血肉</div></div>';

      h += '<div class="body">';
      if (theme === 'food') h += isUser ? buildFood(td) : '<div class="empty">同伴无食单与味觉——他们只有吞噬一途。切至「血肉」查看。</div>';
      else h += buildFlesh(td, isUser);
      h += '</div></div>';
      $panel.html(h);
    };
    var render = safeRun('render', _render);

    function togglePanel() {
      if ($panel.is(':visible')) { $panel.hide(); return; }
      state.editingIdx = -1; state.adding = false; state.deleteConfirm = -1;
      takeSnapshot();
      render();
      $panel.css('display', 'flex');
    }

    // ================= 事件 =================
    $panel.on('click', '.tab', safeRun('panel-click', function () {
      var t = $(this).data('tab');
      if (t === state.currentTab) return;
      state.currentTab = t; state.editingIdx = -1; state.adding = false; state.deleteConfirm = -1;
      render();
    }));
    $panel.on('change', '.target-sel', safeRun('panel-click', function () {
      state.currentTarget = str($(this).val()) || 'user';
      state.editingIdx = -1; state.adding = false; state.deleteConfirm = -1;
      render();
    }));
    $panel.on('click', '.hist-btn', safeRun('panel-click', function () { openDetail($(this).data('detail')); }));
    $panel.on('click', function (e) { if (e.target === $panel[0]) $panel.hide(); });
    $detail.on('click', function (e) { if (e.target === $detail[0]) $detail.hide(); });

    $panel.on('click', '[data-act]', safeRun('panel-click', function (e) {
      e.stopPropagation();
      var $t = $(this);
      var act = $t.data('act');
      var type = state.currentTab;

      if (act === 'close') { $panel.hide(); return; }
      if (act === 'refresh') { render(); return; }
      if (act === 'snaps') { openSnaps(); return; }
      if (act === 'gains') { state.showGains = !state.showGains; render(); return; }
      if (act === 'ro') { state.readOnly = !state.readOnly; state.editingIdx = -1; state.adding = false; state.deleteConfirm = -1; render(); return; }
      if (act === 'peek') { $t.siblings('.md').toggleClass('open'); return; }
      if (act === 'add') { state.adding = true; state.editingIdx = -1; state.deleteConfirm = -1; render(); return; }
      if (act === 'cancel') { state.adding = false; state.editingIdx = -1; state.deleteConfirm = -1; render(); return; }
      if (act === 'alert-dismiss') { markAlerted(state.alertInfo); state.alertInfo = null; render(); return; }
      if (act === 'alert-restore') {
        var bi = findBestSnapshot(), snaps = loadSnapshots();
        if (bi >= 0 && snaps[bi]) { if (restoreSnapshot(snaps[bi])) { markAlerted(state.alertInfo); render(); } else alert('[胎光食录·TGL] 恢复失败'); }
        else alert('[胎光食录·TGL] 快照库为空');
        return;
      }

      var idx = num($t.data('idx')), key = str($t.data('key'));
      var td = getTargetData(state.currentTarget);
      var list = getList(td, type);
      var real = resolveIdx(list, idx, key);

      if (act === 'edit') { if (real < 0) { render(); return; } state.editingIdx = real; state.adding = false; state.deleteConfirm = -1; render(); return; }
      if (act === 'del') {
        if (real < 0) { render(); return; }
        if (state.deleteConfirm !== real) { state.deleteConfirm = real; render(); return; }
        list.splice(real, 1);
        if (!saveList(state.currentTarget, type, list)) alert('[胎光食录·TGL] 写入失败');
        state.deleteConfirm = -1; state.editingIdx = -1;
        render(); return;
      }
      if (act === 'save') {
        var $form = $t.closest('.edit-form');
        var vals = type === 'food' ? collectFoodForm($form) : collectFleshForm($form);
        if (!vals['名']) { alert('名称不能为空'); return; }
        if (idx === -1) list.push(vals);
        else { if (real < 0) { alert('条目位置已变化'); render(); return; } list[real] = Object.assign({}, obj(list[real]), vals); }
        if (!saveList(state.currentTarget, type, list)) alert('[胎光食录·TGL] 写入失败');
        state.adding = false; state.editingIdx = -1;
        render(); return;
      }
    }));

    $detail.on('click', '[data-dact]', safeRun('detail-click', function () {
      var act = $(this).data('dact');
      if (act === 'close') { $detail.hide(); return; }
      if (act === 'prev') { state.detailPage--; state.detailDel = -1; renderDetail(); return; }
      if (act === 'next') { state.detailPage++; state.detailDel = -1; renderDetail(); return; }
      if (act === 'del') {
        var idx = num($(this).data('idx'));
        if (state.detailDel !== idx) { state.detailDel = idx; renderDetail(); return; }
        var type = state.detailType;
        var td = getTargetData(state.currentTarget);
        var full = getList(td, type);
        if (idx < 0 || idx >= full.length) { state.detailDel = -1; renderDetail(); return; }
        full.splice(idx, 1);
        if (!saveList(state.currentTarget, type, full)) alert('[胎光食录·TGL] 写入失败');
        state.detailDel = -1;
        renderDetail();
        if ($panel.is(':visible')) render();
      }
    }));

    $detail.on('click', '[data-sact]', safeRun('detail-click', function () {
      var act = $(this).data('sact');
      if (act === 'close') { $detail.hide(); return; }
      var i = num($(this).data('i'));
      var snaps = loadSnapshots();
      if (act === 'restore') {
        if (state.snapRestore !== i) { state.snapRestore = i; state.snapDel = -1; renderSnaps(); return; }
        state.snapRestore = -1;
        if (i < 0 || i >= snaps.length) { renderSnaps(); return; }
        if (!restoreSnapshot(snaps[i])) alert('[胎光食录·TGL] 恢复失败');
        else { renderSnaps(); if ($panel.is(':visible')) render(); }
        return;
      }
      if (act === 'drop') {
        if (state.snapDel !== i) { state.snapDel = i; state.snapRestore = -1; renderSnaps(); return; }
        snaps.splice(i, 1); saveSnapshots(snaps);
        state.snapDel = -1; renderSnaps();
      }
    }));

    $(targetDoc).off('keydown.tgl').on('keydown.tgl', safeRun('panel-click', function (e) { if (e.key !== 'Escape') return; if ($detail.is(':visible')) $detail.hide(); else if ($panel.is(':visible')) $panel.hide(); }));
  });
})();