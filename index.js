(function () {

  'use strict';

  // 配置契约

  const VERSION = '2.1.1';

  const LOG_TAG = `[胎光食录·TGL v${VERSION}]`;

  const KEYS = {

    CIRCUIT:'tglCircuitBroken', ERROR:'tglErrorLog', SNAP:'tglSnapshots_v2',

    SNAP_LEGACY:'tglSnapshots_v1', ALERT:'tglAlerted_v1', BTN_POS:'tglBtn_position',

  };

  const DOM_ID = { BTN:'tglBtn', PANEL:'tglPanel', DETAIL:'tglDetail', STYLE:'tglStyle', DEAD:'tglDead' };

  const CONFIG = {

    IMG_URL:'https://i.ibb.co/h1T1vxCq/image.png',

    MAIN_LIST_SIZE:8, DETAIL_PAGE:10, HISTORY_WARN:100, SNAP_MAX:8, DROP_RATIO:0.2,

    ERROR_LIMIT:50, RENDER_ERROR_LIMIT:10, ERROR_WINDOW:300000,

    GUARD_WARN_THROTTLE:30000, MANUAL_EDIT_SIGNAL:'胎光食录_manual_edit',

  };

  const QUALITIES = ['普通','优良','稀有','史诗','传说','神话'];

  const REGIONS = ['长养密林','噤寒雪原','育沃孢林','嶙峋荒漠','潮涌汪洋','吞藏草海','渊心'];

  const RATINGS = ['损耗','持平','升华'];

  const STYLES = ['战斗','体感','私隐'];

  const BRANCHES = ['纯净升格','完美同化','胎光侵染','互食异化'];

  const COST_TYPES = ['删除','负面buff','叙事'];

  const COST_KEYS = ['代价','代价详情','负面效果'];

  const LIST_KEY = { food:'食单', flesh:'进化特征', devour:'吞噬录' };

  const LEGACY_KEY = { food:'食单历史', flesh:'进化特征历史' };

  const STYLE_BADGE = { 战斗:'战', 体感:'感', 私隐:'私' };

  const STYLE_COLOR = { 战斗:'#c97a6a', 体感:'#6fae94', 私隐:'#b87a9a' };

  const RANK_COLORS = {

    普通:'#8b8b80', 优良:'#6f9d74', 稀有:'#5f8fb8', 史诗:'#9b6fb8', 传说:'#c78a45', 神话:'#c9553f',

  };

  const BRANCH_COLOR = { 纯净升格:'#6fae94', 完美同化:'#7fc4a8', 胎光侵染:'#c9a860', 互食异化:'#a03a30' };

  const COST_COLOR = { 删除:'#a03a30', 负面buff:'#c9a860', 叙事:'#7a8a86' };

  const COST_LABEL = { 删除:'删', 负面buff:'负', 叙事:'叙' };

  const STAGE_NAMES = ['原初人形','潜伏期','轻度侵染','中度侵染','重度侵染','馐兽'];

  const STAGE_COLORS = ['#8ba888','#a8b878','#6fae94','#4a8b8b','#3a6b6b','#2a4b4b'];

  const ANCHOR_PCT = {

    头部:{x:49.8,y:7.2}, 胸部:{x:56.3,y:25.4}, 主躯干:{x:50.1,y:31.4},

    左侧肢体:{x:88.1,y:21.5}, 右侧肢体:{x:12.2,y:21.6}, 内脏:{x:50.3,y:38.1}, 性征:{x:50.1,y:40.2},

  };

  const ABYSS_KEYS = ['喰沃拉戈','地渊','旋臂','普尔莫','维涅尼','赫帕尔','奥西斯','桑吉斯','文特里斯','血盟关',...REGIONS];

  const FIELDS = {

    food:[

      ['名'],['品质','select',QUALITIES],['等级','number'],['产地','select',REGIONS],

      ['部位'],['料理'],['厨师'],['评定','select',RATINGS],['增益'],['风味'],['分享'],

      ['代价','select',COST_TYPES],['代价详情'],['负面效果'],

    ],

    flesh:[

      ['名'],['部位'],['描述'],['风格','select',STYLES],['代价','checkbox'],['代价详情'],['负面效果'],

    ],

  };

  const ERROR_HINTS = {

    render:'渲染面板时被替身攻击了', renderDetail:'渲染弹窗时被替身攻击了',

    renderSnaps:'渲染快照库时被替身攻击了', renderGains:'渲染增益汇总时被替身攻击了',

    takeSnapshot:'存快照时遭遇了败者食尘', restoreSnapshot:'恢复快照时遭遇了败者食尘',

    saveList:'保存时被廉价把戏阴了', write:'写回变量时被天堂之门改写了',

    'panel-click':'点击面板时被紫烟误伤', 'detail-click':'点击弹窗时被紫烟误伤',

    drag:'拖拽时被航空史密斯扫射', computeGains:'计算增益时大脑过载', init:'初始化时被箭刺中',

  };

  // 纯函数

  // SYNC: 档位、味觉、逐项取整及收益分桶须与世界书一致。

  const stageOf = p => p >= 180 ? 5 : p >= 140 ? 4 : p >= 100 ? 3 : p >= 60 ? 2 : p >= 20 ? 1 : 0;

  const deriveTaste = p => [100,85,60,35,15,0][stageOf(p)];

  const GAIN_SPLIT = /[,，、;；]/;

  const RES_RE = /^(HP|MP|SP)/i;

  const CHK_RE = /^(力量|敏捷|体质|智力|精神)检定/;

  const VALUE_RE = /^([+-]?(?:\d+(?:\.\d+)?|\.\d+))(.*)$/;

  const own = (o,k) => Object.prototype.hasOwnProperty.call(o,k);

  const isObj = v => v !== null && typeof v === 'object' && !Array.isArray(v);

  const obj = v => isObj(v) ? v : {};

  const arr = v => Array.isArray(v) ? v.slice() : [];

  const str = v => String(v ?? '').trim();

  const num = v => Number.isFinite(Number(v)) ? Number(v) : 0;

  const clamp = (v,lo,hi) => Math.max(lo,Math.min(hi,v));

  const clone = v => JSON.parse(JSON.stringify(v));

  const fp = v => JSON.stringify(v);

  const nameOf = v => typeof v === 'string' ? v : str(obj(v)['名']);

  const esc = v => str(v).replace(/[&<>"']/g,c => ({

    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;',

  })[c]);

  const put = (o,k,v) => Object.defineProperty(o,k,{

    value:v, enumerable:true, writable:true, configurable:true,

  });

  // C4: 空输入不代表显式零。

  function intize(value) {

    if (value === undefined || value === null || str(value) === '') return null;

    const n = Number(value);

    if (!Number.isFinite(n)) return null;

    if (n === 0) return 0;

    return Math.sign(n) * Math.max(1,Math.floor(Math.abs(n) + 0.5));

  }

  function fmtTime(value) {

    const d = new Date(value);

    if (!Number.isFinite(d.getTime())) return '未知时间';

    const p = n => String(n).padStart(2,'0');

    return `${d.getMonth()+1}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;

  }

  function zoneOf(value) {

    const s = str(value);

    if (s.startsWith('头') || /脑|眼/.test(s)) return '头部';

    if (/胸|乳/.test(s)) return '胸部';

    if (s.includes('左')) return '左侧肢体';

    if (s.includes('右')) return '右侧肢体';

    if (/内|脏|胃|肠/.test(s)) return '内脏';

    if (/性|臀|阴|肛|后庭/.test(s)) return '性征';

    return '主躯干';

  }

  function parseCost(item) {

    const o = obj(item), raw = o['代价'];

    if (raw === true) return {

      type:'叙事', detail:str(o['代价详情']) || '此项存在代价，由叙事裁定', negGain:str(o['负面效果']),

    };

    if (raw === false || raw == null || ['','false','无'].includes(raw)) return null;

    const source = isObj(raw) ? raw : o;

    const type = isObj(raw) ? str(raw['类型']) : str(raw);

    if (!COST_TYPES.includes(type)) return null;

    return {

      type, detail:str(source['代价详情']),

      negGain:type === '负面buff' ? str(source['负面效果']) : '',

    };

  }

  function normalizeForForm(item,type) {

    const o = typeof item === 'string' ? {名:item} : {...obj(item)};

    const cost = parseCost(item);

    if (cost) {

      o['代价'] = type === 'flesh' ? true : cost.type;

      o['代价详情'] = cost.detail;

      o['负面效果'] = cost.negGain;

    } else if (['false','无'].includes(o['代价']) || o['代价'] === false) delete o['代价'];

    return o;

  }

  function gainParts(text) {

    const result = [];

    for (const part of str(text).split(GAIN_SPLIT)) {

      const m = part.match(/^([^:：]+)[:：]\s*(.+)$/);

      if (!m) continue;

      const name = str(m[1]), value = str(m[2]);

      if (!name || !value) continue;

      const n = value.match(VALUE_RE);

      result.push({name,value,number:n ? intize(n[1]) : null,unit:n ? str(n[2]) : ''});

    }

    return result;

  }

  function computeGains(root) {

    const groups = {gains:new Map(),checks:new Map()};

    function feed(text,negative) {

      for (const p of gainParts(text)) {

        if (RES_RE.test(p.name)) continue;

        const group = CHK_RE.test(p.name) ? groups.checks : groups.gains;

        if (!group.has(p.name)) group.set(p.name,{units:new Map(),texts:new Set()});

        const e = group.get(p.name);

        if (p.number === null) e.texts.add(p.value);

        else {

          const n = negative ? -Math.abs(p.number) : p.number;

          e.units.set(p.unit,(e.units.get(p.unit) || 0) + n);

        }

      }

    }

    for (const item of [...arr(obj(root)['食单']),...arr(obj(root)['吞噬录'])]) {

      feed(obj(item)['增益'],false);

      const cost = parseCost(item);

      if (cost?.type === '负面buff') feed(cost.negGain,true);

    }

    const result = {gains:Object.create(null),checks:Object.create(null)};

    for (const key of ['gains','checks']) {

      for (const [name,e] of groups[key]) {

        const parts = [...e.units].filter(([,n]) => n !== 0)

          .map(([unit,n]) => `${n > 0 ? '+' : ''}${n}${unit}`);

        parts.push(...e.texts);

        if (parts.length) result[key][name] = parts.join(' / ');

      }

    }

    return result;

  }

  function checkDevourBalance(item) {

    const o = obj(item);

    if (o['分支'] !== '互食异化') return '';

    const cost = parseCost(o);

    if (cost?.type !== '负面buff' || !cost.negGain) return '缺负面buff';

    const totals = text => {

      const m = new Map();

      for (const p of gainParts(text)) {

        if (p.number === null || RES_RE.test(p.name)) continue;

        const key = fp([p.name,p.unit]);

        m.set(key,(m.get(key) || 0) + Math.abs(p.number));

      }

      return m;

    };

    const positive = totals(o['增益']), negative = totals(cost.negGain);

    // C2: 只有存在数值型增益时才比较，纯文本不判失衡。

    for (const [key,n] of positive) {

      if ((negative.get(key) || 0) <= n) return '负面须大于同项增益';

    }

    return '';

  }

  // 生命周期

  function registryHost() {

    try {

      if (window.parent !== window && window.parent.document) return window.parent;

    } catch (e) {}

    return window;

  }

  const INSTANCE_ID = `tgl_${Date.now()}_${Math.random().toString(36).slice(2,9)}`;

  const EVENT_NS = `.tgl${INSTANCE_ID}`;

  let destroyed = false, breaking = false, jqRef = null, targetDoc = null;

  let mvuHandle = null, pollTimer = null, jqueryTries = 0;

  let $btn = null, $panel = null, $detail = null;

  let busy = false;

  function currentInstance() {

    try {

      return registryHost().__TGL_INSTANCE__?.id === INSTANCE_ID;

    } catch (e) {

      return false;

    }

  }

  function alive() {

    return !destroyed && !breaking && currentInstance();

  }

  function destroy() {

    if (destroyed) return;

    destroyed = true;

    clearTimeout(pollTimer);

    try {

      if (typeof mvuHandle === 'function') mvuHandle();

      else mvuHandle?.stop?.();

    } catch (e) {}

    mvuHandle = null;

    try {

      if (jqRef && targetDoc) {

        jqRef(targetDoc).off(EVENT_NS);

        const _win = targetDoc.defaultView;

        if (_win) jqRef(_win).off(EVENT_NS);

      }

    } catch (e) {}

    for (const node of [$btn,$panel,$detail]) {

      try {

        node?.off().remove();

      } catch (e) {}

    }

    for (const doc of new Set([document,targetDoc].filter(Boolean))) {

      for (const id of Object.values(DOM_ID)) {

        try {

          doc.querySelectorAll(`#${id}[data-instance="${INSTANCE_ID}"]`).forEach(el => el.remove());

        } catch (e) {}

      }

    }

    window.removeEventListener('beforeunload',destroy);

    window.removeEventListener('pagehide',destroy);

    try {

      const h = registryHost();

      if (h.__TGL_INSTANCE__?.id === INSTANCE_ID) h.__TGL_INSTANCE__ = null;

    } catch (e) {}

  }

  try {

    const h = registryHost();

    h.__TGL_INSTANCE__?.destroy?.();

    h.__TGL_INSTANCE__ = {id:INSTANCE_ID,destroy};

  } catch (e) {

    console.error(`${LOG_TAG} 无法登记实例，已中止启动`,e);

    return;

  }

  window.addEventListener('beforeunload',destroy);

  window.addEventListener('pagehide',destroy);

  // 错误保护

  function circuitBreak(reason) {

    if (breaking) return;

    breaking = true;

    try {

      localStorage.setItem(KEYS.CIRCUIT,fp({time:Date.now(),reason}));

    } catch (e) {}

    const doc = targetDoc || document;

    destroy();

    try {

      doc.getElementById(DOM_ID.DEAD)?.remove();

      const el = doc.createElement('div');

      el.id = DOM_ID.DEAD;

      el.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:99999;max-width:340px;padding:16px 20px;background:linear-gradient(135deg,#1a1a2e,#16213e);color:#ffd700;border:2px solid #ffd700;border-radius:8px;font-size:12px;line-height:1.7;font-family:sans-serif;box-shadow:0 4px 20px rgba(0,0,0,.6)';

      el.innerHTML = '<b style="font-size:14px">⚜️ [胎光食录] 本插件已魂归黄金王座</b><br><br>'

        + '错误次数过多，帝皇的塔罗牌显示此插件不宜继续运行。<br>为了守护你的内存，它选择了自我了断。<br><br>'

        + '<b>复活仪式：</b><br>1. F12控制台咏唱：<code style="background:rgba(255,215,0,.2);padding:2px 6px;border-radius:3px;color:#ffe">localStorage.removeItem("tglCircuitBroken")</code><br>'

        + '2. 刷新页面，插件将从王座归来<br><br>'

        + '<i style="opacity:.7">若反复魂归王座，请携带F12红色报错截图，<br>前往作者处报告——就像发现迪奥弱点那样详细。</i>';

      doc.body.appendChild(el);

    } catch (e) {}

    console.error(`${LOG_TAG} ⚜️ 已魂归黄金王座`);

    console.error(`${LOG_TAG} 阵亡原因：`,reason);

  }

  function recordError(context,error) {

    if (breaking || destroyed) return;

    const hint = ERROR_HINTS[context] || '遭遇了未知替身攻击';

    try {

      const now = Date.now();

      let log;

      try {

        log = JSON.parse(localStorage.getItem(KEYS.ERROR) || 'null');

      } catch (e) {}

      if (!isObj(log) || !Array.isArray(log.contexts) || now - num(log.first) > CONFIG.ERROR_WINDOW) {

        log = {first:now,count:0,renderCount:0,contexts:[]};

      }

      log.count = num(log.count) + 1;

      log.renderCount = num(log.renderCount) + (context.startsWith('render') ? 1 : 0);

      log.contexts.push({time:now,ctx:context,msg:str(error?.message || error).slice(0,180)});

      log.contexts = log.contexts.slice(-20);

      console.error(`${LOG_TAG} 木大木大！错误#${log.count} @${context}：${hint}`,error);

      localStorage.setItem(KEYS.ERROR,fp(log));

      if (log.count >= CONFIG.ERROR_LIMIT || log.renderCount >= CONFIG.RENDER_ERROR_LIMIT) {

        circuitBreak(`错误 ${log.count} 次，渲染错误 ${log.renderCount} 次`);

      }

    } catch (e) {

      console.error(`${LOG_TAG} ${hint}`,error);

      console.warn(`${LOG_TAG} 错误日志无法保存`);

    }

  }

  function safe(context,fn) {

    return function (...args) {

      if (!alive()) return;

      try {

        return fn.apply(this,args);

      } catch (e) {

        recordError(context,e);

      }

    };

  }

  try {

    const raw = localStorage.getItem(KEYS.CIRCUIT);

    if (raw) {

      let info = {};

      try {

        info = obj(JSON.parse(raw));

      } catch (e) {}

      console.error(`${LOG_TAG} ⚜️ 插件仍在黄金王座上沉睡 @${new Date(num(info.time)).toLocaleString()}｜复活：localStorage.removeItem("tglCircuitBroken") 后刷新`);

      destroy();

      return;

    }

  } catch (e) {}

  // 运行入口

  (function pollJQuery() {

    if (!alive()) return;

    let jq = null;

    try {

      jq = window.jQuery || window.parent?.jQuery || window.parent?.$;

    } catch (e) {

      jq = window.jQuery;

    }

    if (typeof jq === 'function' && jq.fn?.jquery) {

      jqRef = jq;

      start(jq);

    } else {

      if (++jqueryTries === 100) console.warn(`${LOG_TAG} jQuery失踪了，是不是被DIO时停了？`);

      pollTimer = setTimeout(pollJQuery,100);

    }

  })();

  function start($) {

    if (!alive()) return;

    if (typeof getVariables !== 'function' || typeof replaceVariables !== 'function') {

      console.error(`${LOG_TAG} 酒馆助手API不可用，插件无法启动`);

      destroy();

      return;

    }

    targetDoc = document;

    try {

      if (window.parent !== window && window.parent.document?.body) targetDoc = window.parent.document;

    } catch (e) {}

    const state = {

      tab:'food', target:'user', readOnly:false, showGains:false,

      editor:null, deleteConfirm:null, detail:null, snapConfirm:null, pendingAction:null,

      alertInfo:null, notice:'', detailNotice:'', peek:{}, drag:null,

    };

    let suppressSnapshot = 0, expectedWriteDataFp = '', expectedWriteMessageId = null;

    let repairingShape = false, lastGuardWarn = 0;

    // 变量访问

    // D2: 一个入口计算位置，API 使用负下标，快照楼层使用正下标。

    function messageLocation() {

      const st = window.SillyTavern || window.parent?.SillyTavern;

      const chat = st?.getContext?.().chat;

      if (!Array.isArray(chat)) throw new Error('无法读取聊天消息列表');

      for (let i = chat.length - 1; i >= 0; i--) {

        if (chat[i] && !chat[i].is_system) return {messageId:i-chat.length,floor:i};

      }

      throw new Error('没有可读写的非 system 消息');

    }

    // E3: 原始读取只验证消息位置，不将坏结构转换成空结构。

    function readAllRaw(messageId = messageLocation().messageId) {

      if (!Number.isInteger(messageId)) throw new Error('消息落点无效');

      const value = getVariables({type:'message',message_id:messageId});

      const all = value === undefined ? undefined : clone(value);

      return {all,messageId};

    }

    function readAll(messageId = messageLocation().messageId) {

      const raw = readAllRaw(messageId);

      const value = raw.all;

      if (!isObj(value)) throw new Error('变量表读取失败或返回值无效');

      if (own(value,'stat_data') && !isObj(value.stat_data)) {

        throw new Error('stat_data 结构无效，已停止操作');

      }

      const all = value;

      const stat = own(all,'stat_data') ? all.stat_data : {};

      if (own(stat,'事件') && !isObj(stat['事件'])) throw new Error('事件字段结构无效');

      const events = obj(stat['事件']);

      if (own(events,'胎光食录') && !isObj(events['胎光食录'])) {

        throw new Error('胎光食录根节点结构无效');

      }

      const root = obj(events['胎光食录']);

      if (own(root,'同伴记录') && !isObj(root['同伴记录'])) throw new Error('同伴记录结构无效');

      return {all,stat,root,messageId};

    }

    function targetData(root,target,required) {

      if (target === 'user') return root;

      const peers = obj(root['同伴记录']);

      if (!own(peers,target) || !isObj(peers[target])) {

        if (required) throw new Error('目标同伴已消失或结构无效');

        return {};

      }

      return peers[target];

    }

    function getList(td,type) {

      const key = LIST_KEY[type], legacy = LEGACY_KEY[type];

      if (!key) throw new Error('未知列表类型');

      for (const k of [key,legacy].filter(Boolean)) {

        if (own(td,k) && !Array.isArray(td[k])) throw new Error(`${k} 不是数组`);

      }

      return [...(legacy ? arr(td[legacy]) : []),...arr(td[key])];

    }

    function ensureRoot(stat) {

      if (!own(stat,'事件')) put(stat,'事件',{});

      if (!own(stat['事件'],'胎光食录')) put(stat['事件'],'胎光食录',{});

      return stat['事件']['胎光食录'];

    }

    // 结构检查修复

    const rootPath = ['stat_data','事件','胎光食录'];

    function pathText(path) {

      return path.reduce((s,k) => `${s}[${JSON.stringify(k)}]`,'$');

    }

    function valueAt(all,path) {

      let value = all;

      for (const key of path) {

        if (!isObj(value) && !Array.isArray(value)) return undefined;

        if (!own(value,key)) return undefined;

        value = value[key];

      }

      return value;

    }

    function typeName(value) {

      if (value === null) return 'null';

      if (Array.isArray(value)) return '数组';

      if (isObj(value)) return '对象';

      if (value === undefined) return 'undefined';

      return typeof value;

    }

    function listFault(td,path,types = ['food','devour','flesh']) {

      for (const type of types) {

        for (const key of [LIST_KEY[type],LEGACY_KEY[type]].filter(Boolean)) {

          if (own(td,key) && !Array.isArray(td[key])) {

            return {path:[...path,key],label:key,kind:'array'};

          }

        }

      }

      return null;

    }

    // E3: 纯检查，返回第一个问题，不改变输入。

    function shapeFault(read) {

      const all = read?.all;

      if (!isObj(all)) return {path:[],label:'变量表',kind:'unrepairable'};

      if (own(all,'stat_data') && !isObj(all.stat_data)) {

        return {path:['stat_data'],label:'stat_data',kind:'object'};

      }

      const stat = obj(all.stat_data);

      if (own(stat,'事件') && !isObj(stat['事件'])) {

        return {path:['stat_data','事件'],label:'事件',kind:'object'};

      }

      const events = obj(stat['事件']);

      if (own(events,'胎光食录') && !isObj(events['胎光食录'])) {

        return {path:rootPath.slice(),label:'胎光食录',kind:'object'};

      }

      const root = obj(events['胎光食录']);

      if (own(root,'同伴记录') && !isObj(root['同伴记录'])) {

        return {path:[...rootPath,'同伴记录'],label:'同伴记录',kind:'object'};

      }

      const mainFault = listFault(root,rootPath);

      if (mainFault) return mainFault;

      for (const name of Object.keys(obj(root['同伴记录'])).sort()) {

        const peer = root['同伴记录'][name], path = [...rootPath,'同伴记录',name];

        if (!isObj(peer)) return {path,label:`同伴·${name}`,kind:'object'};

        const fault = listFault(peer,path);

        if (fault) return fault;

      }

      return null;

    }

    function currentListFault(read,type,target = state.target) {

      const main = shapeFault(read);

      if (main && main.kind !== 'array') {

        const isOtherPeer = main.path.length >= 5 && main.path[3] === '同伴记录' && main.path[4] !== target;

        if (!isOtherPeer) return main;

      }

      const root = obj(obj(obj(read.all).stat_data)['事件'])['胎光食录'];

      const r = obj(root);

      if (target !== 'user') {

        const peers = obj(r['同伴记录']);

        if (!own(peers,target)) return null;

        if (!isObj(peers[target])) {

          return {path:[...rootPath,'同伴记录',target],label:`同伴·${target}`,kind:'object'};

        }

        return listFault(peers[target],[...rootPath,'同伴记录',target],[type]);

      }

      return listFault(r,rootPath,[type]);

    }

    function shapeCard(read,fault,detail = false) {

      const value = valueAt(read.all,fault.path);

      const canRepair = fault.kind !== 'unrepairable' && !state.readOnly;

      const attr = detail ? 'data-dact' : 'data-act';

      const initialFp = fp({value});

      return `<div class="${detail ? 'detail-flash' : 'amber-bar'} shape-card">

      <b>字段结构异常：${esc(fault.label)}</b><div>${esc(pathText(fault.path))}</div>

      <div>当前类型：${esc(typeName(value))}</div><div>AI 写入可能破坏了该字段结构</div>

      ${canRepair ? `<div class="edit-actions"><button class="btn btn-del" ${attr}="shape-repair"

      data-path="${esc(fp(fault.path))}" data-fault-fp="${esc(initialFp)}"

      data-message-id="${read.messageId}">修复该字段</button></div>` : ''}</div>`;

    }

    function applyShapeRepair(all,fault) {

      if (!fault.path.length || fault.kind === 'unrepairable') throw new Error('变量表无法自动重置');

      const parent = valueAt(all,fault.path.slice(0,-1));

      if (!isObj(parent)) throw new Error('修复路径的父节点已变化');

      const key = fault.path[fault.path.length - 1];

      put(parent,key,fault.kind === 'array' ? [] : {});

      if (fault.kind === 'array') {

        const type = Object.keys(LIST_KEY).find(t => LIST_KEY[t] === key);

        if (type && LEGACY_KEY[type]) delete parent[LEGACY_KEY[type]];

      }

      // 已批准例外：仅为手动信号创建必要容器，不创建食录根或其它列表。

      if (!own(all,'stat_data')) put(all,'stat_data',{});

      if (!isObj(all.stat_data)) throw new Error('stat_data 仍损坏，无法写入信号');

      if (!own(all.stat_data,'事件')) put(all.stat_data,'事件',{});

      if (!isObj(all.stat_data['事件'])) throw new Error('事件仍损坏，无法写入信号');

      addManualSignal(all.stat_data);

    }

    async function repairShape(el,detail) {

      try {

        const path = JSON.parse(el.getAttribute('data-path'));

        const messageId = Number(el.getAttribute('data-message-id'));

        if (!Array.isArray(path) || !Number.isInteger(messageId)) throw new Error('修复请求无效');

        const read = readAllRaw(messageId);

        if (!isObj(read.all)) throw new Error('变量表不可读取，未执行修复');

        const value = valueAt(read.all,path);

        if (fp({value}) !== el.getAttribute('data-fault-fp')) {

          throw new Error('坏字段已发生变化，请刷新后重新选择修复');

        }

        let fault = shapeFault(read);

        if (!fault || fp(fault.path) !== fp(path)) {

          const key = path[path.length - 1], parent = valueAt(read.all,path.slice(0,-1));

          const isManagedList = path[0] === 'stat_data' && path[1] === '事件' && path[2] === '胎光食录'

            && (path.length === 4 || (path.length === 6 && path[3] === '同伴记录'))

            && [...Object.values(LIST_KEY),...Object.values(LEGACY_KEY)].includes(key);

          if (!isManagedList || !isObj(parent) || !own(parent,key) || Array.isArray(parent[key])) {

            throw new Error('修复目标已变化，未执行写入');

          }

          fault = {path,label:key,kind:'array'};

        }

        const before = clone(read.all);

        applyShapeRepair(read.all,fault);

        read.stat = read.all.stat_data;

        read.root = obj(obj(obj(read.stat)['事件'])['胎光食录']);

        const plan = {before,fault,expectedAll:clone(read.all)};

        const after = await commit(read,read.root,plan);

        state.editor = null;

        state.deleteConfirm = null;

        state.pendingAction = null;

        state.snapConfirm = null;

        let message = `已修复字段 ${pathText(path)}`;

        const remaining = shapeFault(after);

        if (remaining) message += `；仍有坏字段：${pathText(remaining.path)}`;

        else {

          try {

            appendBaseline(snapshotData(after.root),worldMeta(after.messageId));

            state.alertInfo = null;

          } catch (e) {

            message += `；基线未建立：${e.message}`;

          }

        }

        notify(message,detail);

      } finally {

        // rc5: 成功或失败都刷新实际状态；异常仍交给 runAction 处理。

        render();

      }

    }

    // 快照与差异检查

    function snapshotData(root) {

      const peers = {};

      for (const name of Object.keys(obj(root['同伴记录'])).sort()) {

        const p = targetData(root,name,true);

        put(peers,name,{吞噬录:getList(p,'devour'),进化特征:getList(p,'flesh')});

      }

      return {

        user:{食单:getList(root,'food'),吞噬录:getList(root,'devour'),进化特征:getList(root,'flesh')},

        peers,

      };

    }

    // D2: 仅对已经提取的受管切片定位差异，不扫描外部系统字段。

    function firstManagedDiff(expected,actual,path = '$') {

      if (fp(expected) === fp(actual)) return '';

      const expectedObject = expected !== null && typeof expected === 'object';

      const actualObject = actual !== null && typeof actual === 'object';

      if (!expectedObject || !actualObject || Array.isArray(expected) !== Array.isArray(actual)) return path;

      const keys = [...new Set([...Object.keys(expected),...Object.keys(actual)])];

      for (const key of keys) {

        const nextPath = `${path}[${JSON.stringify(key)}]`;

        if (!own(expected,key) || !own(actual,key)) return nextPath;

        const difference = firstManagedDiff(expected[key],actual[key],nextPath);

        if (difference) return difference;

      }

      if (Array.isArray(expected) && expected.length !== actual.length) return `${path}.length`;

      return `${path}（键顺序）`;

    }

    // rc5: 白名单是环境级联契约，不是放松写前授权校验。

    function firstRepairDiff(expected,actual,path = '$') {

      if (fp(expected) === fp(actual)) return '';

      const statPath = '$["stat_data"]';

      const eventsPath = '$["stat_data"]["事件"]';

      const managedPath = '$["stat_data"]["事件"]["胎光食录"]';

      if (path === managedPath || path.startsWith(`${managedPath}[`)) return path;

      if (path === '$["date"]' || path.startsWith('$["date"][')) return path;

      const cascadePath = (

        path.startsWith(`${statPath}[`) && path !== eventsPath && !path.startsWith(`${eventsPath}[`)

      ) || (

        path.startsWith(`${eventsPath}[`) && path !== managedPath && !path.startsWith(`${managedPath}[`)

      );

      const expectedObject = expected !== null && typeof expected === 'object';

      const actualObject = actual !== null && typeof actual === 'object';

      // 已有容器不能通过类型替换绕过子树删除检查。

      if (expectedObject &&

          (!actualObject || Array.isArray(expected) !== Array.isArray(actual))) {

        return path;

      }

      if (!expectedObject || !actualObject) {

        return cascadePath ? '' : path;

      }

      if (Array.isArray(expected) && expected.length !== actual.length) {

        if (!cascadePath) return `${path}.length`;

        if (actual.length < expected.length) return `${path}[${actual.length}]`;

      }

      const keys = [...new Set([...Object.keys(expected),...Object.keys(actual)])];

      for (const key of keys) {

        const nextPath = `${path}[${JSON.stringify(key)}]`;

        if (!own(actual,key)) return nextPath;

        if (!own(expected,key)) {

          if (path === '$' && key === 'date') continue;

          if (path === statPath && key !== '事件') continue;

          if (path === eventsPath && key !== '胎光食录') continue;

          if (cascadePath) continue;

          return nextPath;

        }

        const difference = firstRepairDiff(expected[key],actual[key],nextPath);

        if (difference) return difference;

      }

      return '';

    }

    function validSnapshot(s) {

      if (!isObj(s) || !isObj(s.data) || !isObj(s.data.user)) return false;

      if (!['食单','吞噬录','进化特征'].every(k => Array.isArray(s.data.user[k]))) return false;

      if (s.data.peers !== undefined && !isObj(s.data.peers)) return false;

      return Object.values(obj(s.data.peers)).every(p =>

        isObj(p) && Array.isArray(p['吞噬录']) && Array.isArray(p['进化特征']));

    }

    function countsOf(data) {

      const u = obj(data?.user), peers = obj(data?.peers);

      const peerItems = Object.values(peers).reduce((n,p) =>

        n + arr(obj(p)['吞噬录']).length + arr(obj(p)['进化特征']).length,0);

      return {

        food:arr(u['食单']).length, devour:arr(u['吞噬录']).length,

        flesh:arr(u['进化特征']).length, peers:Object.keys(peers).length, peerItems,

      };

    }

    function totalOf(data) {

      const c = countsOf(data);

      return c.food + c.devour + c.flesh + c.peerItems;

    }

    function loadSnapshots() {

      const raw = localStorage.getItem(KEYS.SNAP);

      if (!raw) return [];

      const value = JSON.parse(raw);

      if (!Array.isArray(value)) throw new Error('快照库结构无效，未覆盖原存储');

      return value;

    }

    function saveSnapshots(list) {

      localStorage.setItem(KEYS.SNAP,fp(list));

    }

    function latestFloor() {

      try {

        return messageLocation().floor;

      } catch (e) {

        return null;

      }

    }

    // E4: 回退只读取时间地点，绝不提供受管数据或写入落点。

    function worldMeta(anchorMessageId) {

      const empty = {time:'',place:''};

      const extract = all => {

        const w = obj(obj(obj(all).stat_data)['世界']);

        return {time:str(w['时间']),place:str(w['地点'])};

      };

      try {

        const ownMeta = extract(readAllRaw(anchorMessageId).all);

        if (ownMeta.time || ownMeta.place) return ownMeta;

      } catch (e) {}

      try {

        const st = window.SillyTavern || window.parent?.SillyTavern;

        const chat = st?.getContext?.().chat;

        if (!Array.isArray(chat) || !Number.isInteger(anchorMessageId)) return empty;

        const anchorIndex = anchorMessageId < 0 ? chat.length + anchorMessageId : anchorMessageId;

        if (anchorIndex < 0 || anchorIndex >= chat.length) return empty;

        let reads = 0;

        for (let i = anchorIndex - 1; i >= 0 && reads < 20; i--) {

          if (!chat[i] || chat[i].is_system) continue;

          reads++;

          try {

            const meta = extract(readAllRaw(i - chat.length).all);

            if (meta.time || meta.place) return meta;

          } catch (e) {}

        }

      } catch (e) {}

      return empty;

    }

    function makeSnapshot(data,meta) {

      return {

        time:str(meta.time), place:str(meta.place), floor:latestFloor(),

        savedAt:Date.now(), counts:countsOf(data), data:clone(data),

      };

    }

    function appendBaseline(data,meta) {

      const list = loadSnapshots();

      list.push(makeSnapshot(data,meta));

      saveSnapshots(list.slice(-CONFIG.SNAP_MAX));

    }

    function detectDrop(current,previous) {

      const pairs = [];

      for (const key of ['食单','吞噬录','进化特征']) {

        pairs.push([key,previous.user[key].length,current.user[key].length]);

      }

      for (const [name,peer] of Object.entries(obj(previous.peers))) {

        const now = obj(current.peers[name]);

        for (const key of ['吞噬录','进化特征']) {

          pairs.push([`同伴·${name}·${key}`,peer[key].length,arr(now[key]).length]);

        }

      }

      let worst = null;

      for (const [name,before,after] of pairs) {

        const ratio = before > 0 ? (before - after) / before : 0;

        if (ratio > CONFIG.DROP_RATIO && (!worst || ratio > worst.ratio)) {

          worst = {name,before,after,ratio};

        }

      }

      if (totalOf(previous) > 0 && totalOf(current) === 0) {

        return {name:'整组胎光食录',before:totalOf(previous),after:0,ratio:1};

      }

      return worst;

    }

    function notify(message,detail) {

      if (detail) state.detailNotice = message;

      else state.notice = message;

      refreshMessages();

    }

    function alertHTML() {

      if (!state.alertInfo) return '';

      const a = state.alertInfo;

      const pending = state.pendingAction?.kind === 'alert-restore' ? state.pendingAction : null;

      const text = pending ? (pending.phase === 'discard' ? '确认放弃？' : '确认恢复？') : '恢复最佳快照';

      return `<div class="alert-bar"><b>⚠️ 数据异常警告</b><div>${esc(a.name)}：${a.before} → ${a.after}（损失 ${Math.round(a.ratio*100)}%）</div>

      <div class="alert-ops">${state.readOnly ? '' : `<button class="btn btn-save${pending ? ' confirm' : ''}" data-act="alert-restore">${text}</button>`}

      <button class="btn" data-act="alert-dismiss">知道了</button></div></div>`;

    }

    function refreshMessages() {

      if (!$panel) return;

      $panel.find('.alert-area').html(alertHTML());

      $panel.find('.notice-area').html(state.notice

        ? `<div class="amber-bar">${esc(state.notice)} <button class="btn" data-act="notice-clear">关闭提示</button></div>` : '');

      $detail?.find('.detail-notice').html(state.detailNotice

        ? `<div class="detail-flash">${esc(state.detailNotice)}</div>` : '');

    }

    function guardWarn(diffPath = '') {

      const now = Date.now();

      if (now - lastGuardWarn < CONFIG.GUARD_WARN_THROTTLE) return;

      lastGuardWarn = now;

      console.warn(`${LOG_TAG} ⚠️ 禁军守望：检测到身份存疑的写入`,

        diffPath ? `受管切片首个差异：${diffPath}` : '');

    }

    // C0: 只允许显式手动刷新绕过 busy；自身写入计数始终生效。

    function takeSnapshot(fromRefresh = false) {

      if (!alive() || suppressSnapshot || (busy && !fromRefresh)) return;

      try {

        const read = readAll();

        const data = snapshotData(read.root);

        const list = loadSnapshots();

        const last = [...list].reverse().find(validSnapshot);

        if (last && fp(last.data) === fp(data)) state.alertInfo = null;

        else {

          const drop = last ? detectDrop(data,last.data) : null;

          if (drop) {

            state.alertInfo = drop;

            console.warn(`${LOG_TAG} 数据异常：${drop.name} ${drop.before}→${drop.after}，是被绯红之王削去了吗？`);

          } else {

            appendBaseline(data,worldMeta(read.messageId));

            state.alertInfo = null;

          }

        }

        refreshMessages();

      } catch (e) {

        notify(`快照检测未完成：${e.message}`,false);

        console.warn(`${LOG_TAG} 快照检测跳过`,e);

      }

    }

    function bestSnapshot() {

      const list = loadSnapshots();

      let index = -1, score = -1;

      list.forEach((s,i) => {

        if (!validSnapshot(s)) return;

        const n = totalOf(s.data);

        if (n >= score) {

          index = i;

          score = n;

        }

      });

      return index < 0 ? null : {index,snapshot:list[index]};

    }

    // 提交事务

    // C5: 按 PM 提供的已验证前提，replaceVariables 同步写入，

    // MVU 事件在同调用栈派发，suppressSnapshot 计数可压住自身事件。

    // 若未来改为异步派发，自身事件可能额外检测一次；数据相同则去重，

    // 即使重复建立基线也不修改游戏变量，不以该事件执行补偿写入。

    async function commit(read,expectedRoot,repairPlan = null) {

      if (!alive()) throw new Error('实例已停止');

      if (!Number.isInteger(read.messageId)) throw new Error('消息落点无效');

      put(read.all,'stat_data',read.stat);

      let expectedData;

      if (repairPlan) {

        // E3 获批例外：重放唯一授权修复，整表核对不相关字段未被修改。

        const allowed = clone(repairPlan.before);

        applyShapeRepair(allowed,repairPlan.fault);

        if (fp(allowed) !== fp(read.all) || fp(allowed) !== fp(repairPlan.expectedAll)) {

          throw new Error('结构修复超出授权字段范围，已中止写入');

        }

        const fixedValue = valueAt(allowed,repairPlan.fault.path);

        if (repairPlan.fault.kind === 'array' ? !Array.isArray(fixedValue) : !isObj(fixedValue)) {

          throw new Error('结构修复结果类型无效');

        }

        expectedWriteDataFp = '';

      } else {

        expectedData = snapshotData(expectedRoot);

        expectedWriteDataFp = fp(expectedData);

      }

      expectedWriteMessageId = read.messageId;

      repairingShape = !!repairPlan;

      suppressSnapshot++;

      try {

        await replaceVariables(read.all,{type:'message',message_id:read.messageId});

        if (!alive()) throw new Error('写入期间实例已停止，请核对当前变量');

        if (repairPlan) {

          const afterRaw = readAllRaw(read.messageId);

          const repairedValue = valueAt(afterRaw.all,repairPlan.fault.path);

          const pointValid = repairPlan.fault.kind === 'array'

            ? Array.isArray(repairedValue) && repairedValue.length === 0 : isObj(repairedValue);

          if (!pointValid) throw new Error(`授权修复点未生效：${pathText(repairPlan.fault.path)}`);

          const difference = firstRepairDiff(repairPlan.expectedAll,afterRaw.all);

          if (difference) {

            guardWarn(difference);

            throw new Error(`结构修复读回校验不一致：${difference}`);

          }

          const stat = obj(afterRaw.all.stat_data);

          return {all:afterRaw.all,stat,root:obj(obj(stat['事件'])['胎光食录']),messageId:read.messageId};

        }

        const after = readAll(read.messageId);

        const actualData = snapshotData(after.root);

        if (fp(actualData) !== expectedWriteDataFp) {

          const difference = firstManagedDiff(expectedData,actualData);

          guardWarn(difference);

          throw new Error(`写回后校验不一致，结果未确认；未更新快照基线。差异：${difference}`);

        }

        return after;

      } finally {

        suppressSnapshot--;

        if (!suppressSnapshot) {

          expectedWriteDataFp = '';

          expectedWriteMessageId = null;

          repairingShape = false;

        }

      }

    }

    function addManualSignal(stat) {

      const events = stat['事件'];

      if (own(events,'信号') && !Array.isArray(events['信号'])) {

        throw new Error('手动编辑信号字段结构无效');

      }

      if (!own(events,'信号')) put(events,'信号',[]);

      if (!events['信号'].includes(CONFIG.MANUAL_EDIT_SIGNAL)) {

        events['信号'].push(CONFIG.MANUAL_EDIT_SIGNAL);

      }

    }

    async function mutateList(context,transform) {

      const read = readAll();

      const root = ensureRoot(read.stat);

      const td = targetData(root,context.target,true);

      const list = getList(td,context.type);

      const next = transform(list);

      if (!Array.isArray(next)) throw new Error('列表修改结果无效');

      put(td,LIST_KEY[context.type],next);

      if (LEGACY_KEY[context.type]) delete td[LEGACY_KEY[context.type]];

      addManualSignal(read.stat);

      const after = await commit(read,root);

      let warning = '';

      try {

        appendBaseline(snapshotData(after.root),worldMeta(after.messageId));

        state.alertInfo = null;

      } catch (e) {

        warning = `记录已保存，但快照基线保存失败：${e.message}`;

      }

      return {after,warning};

    }

    async function restoreSnapshot(snap) {

      if (!validSnapshot(snap)) throw new Error('快照结构无效，拒绝恢复');

      const read = readAll();

      const root = ensureRoot(read.stat);

      for (const key of ['食单','吞噬录','进化特征']) put(root,key,clone(snap.data.user[key]));

      delete root['食单历史'];

      delete root['进化特征历史'];

      if (!own(root,'同伴记录')) put(root,'同伴记录',{});

      const peers = root['同伴记录'], incoming = obj(snap.data.peers);

      for (const [name,value] of Object.entries(incoming)) {

        if (own(peers,name) && !isObj(peers[name])) throw new Error(`同伴 ${name} 结构无效`);

        if (!own(peers,name)) put(peers,name,{});

        put(peers[name],'吞噬录',clone(value['吞噬录']));

        put(peers[name],'进化特征',clone(value['进化特征']));

        delete peers[name]['进化特征历史'];

      }

      const kept = Object.keys(peers).filter(n => !own(incoming,n));

      const after = await commit(read,root);

      // P3-1/2: 两个恢复入口共用成功收尾，基线失败也不保留旧表单。

      state.editor = null;

      state.peek = {};

      state.deleteConfirm = null;

      state.pendingAction = null;

      state.snapConfirm = null;

      let message = kept.length ? `已恢复；保留快照外同伴：${kept.join('、')}` : '记录已恢复';

      try {

        appendBaseline(snapshotData(after.root),worldMeta(after.messageId));

        state.alertInfo = null;

      } catch (e) {

        message += `。新基线保存失败：${e.message}`;

      }

      return message;

    }

    // 编辑状态

    function captureDraft() {

      const editor = state.editor;

      if (!editor) return;

      const $form = $panel.find('.edit-form');

      if (!$form.length) return;

      const values = {};

      $form.find('[data-field]').each(function () {

        const $el = $(this), key = $el.attr('data-field');

        put(values,key,$el.attr('type') === 'checkbox' ? $el.is(':checked') : $el.val());

      });

      editor.draft = values;

    }

    function editorDirty() {

      captureDraft();

      return state.editor && fp(state.editor.draft) !== fp(state.editor.initial);

    }

    function editorStamp() {

      const e = state.editor;

      return e ? fp([e.target,e.type,e.index,e.itemFp,e.draft]) : '';

    }

    function transitionKey(request) {

      return fp([request.kind,request.target,request.type,request.index,request.itemFp,request.tab]);

    }

    // C1: 确认动作、目的地和草稿身份一起锁定；输入变化后须重新确认。

    function leaveEditor(request) {

      if (editorDirty()) {

        const key = transitionKey(request), stamp = editorStamp(), pending = state.pendingAction;

        if (!pending || pending.key !== key || pending.editorStamp !== stamp) {

          state.pendingAction = {...request,key,editorStamp:stamp,phase:'discard'};

          return false;

        }

      }

      state.editor = null;

      state.deleteConfirm = null;

      state.pendingAction = null;

      return true;

    }

    function initialForm(item,type) {

      const o = normalizeForForm(item,type), result = {};

      for (const [key,kind] of FIELDS[type]) {

        if (kind === 'checkbox') put(result,key,o[key] === true);

        else if (kind === 'number') put(result,key,o[key] == null ? '' : String(o[key]));

        else put(result,key,str(o[key]));

      }

      return result;

    }

    function beginEditor(index) {

      const read = readAll(), type = state.tab, target = state.target;

      const list = getList(targetData(read.root,target,true),type);

      if (target !== 'user' && type === 'food') throw new Error('同伴不支持食单编辑');

      if (index !== null && (!Number.isInteger(index) || index < 0 || index >= list.length)) {

        throw new Error('编辑目标不存在');

      }

      const item = index === null ? {} : list[index];

      const request = {kind:index === null ? 'add' : 'edit',target,type,index,itemFp:index === null ? '' : fp(item)};

      if (!leaveEditor(request)) {

        render();

        return;

      }

      const initial = initialForm(item,type);

      state.editor = {target,type,index,itemFp:index === null ? '' : fp(item),initial,draft:clone(initial)};

      state.notice = '';

      render();

    }

    function formValues(editor) {

      const values = {};

      for (const [key,kind] of FIELDS[editor.type]) {

        const value = editor.draft[key];

        if (kind === 'checkbox') {

          if (value === true) put(values,key,true);

        } else if (kind === 'number') {

          if (str(value)) {

            const n = Number(value);

            if (!Number.isFinite(n)) throw new Error(`${key} 必须是有效数字`);

            put(values,key,n);

          }

        } else if (str(value)) put(values,key,str(value));

      }

      if (!values['名']) throw new Error('名称不能为空');

      if (!values['代价']) {

        for (const key of COST_KEYS) delete values[key];

      } else if (editor.type !== 'flesh' && values['代价'] !== '负面buff') delete values['负面效果'];

      return values;

    }

    async function saveEditor() {

      captureDraft();

      const editor = state.editor;

      if (!editor) throw new Error('没有待保存的表单');

      const values = formValues(editor);

      const result = await mutateList(editor,list => {

        if (editor.index === null) return [...list,values];

        if (fp(list[editor.index]) !== editor.itemFp) {

          throw new Error('条目已发生变化，未覆盖新数据；请保留草稿后重新编辑');

        }

        const merged = {...obj(list[editor.index])};

        for (const [key] of FIELDS[editor.type]) delete merged[key];

        for (const key of COST_KEYS) delete merged[key];

        Object.assign(merged,values);

        const next = list.slice();

        next[editor.index] = merged;

        return next;

      });

      state.editor = null;

      state.deleteConfirm = null;

      state.pendingAction = null;

      state.notice = result.warning || '记录已保存';

      render();

    }

    function closePanel() {

      captureDraft();

      state.deleteConfirm = null;

      state.snapConfirm = null;

      state.pendingAction = null;

      $panel.hide();

      $detail.hide();

      state.peek = {};

    }

    function openPanel() {

      takeSnapshot();

      render();

      $panel.css('display','flex');

    }

    function setBusy(value) {

      busy = value;

      $panel?.attr('aria-busy',String(value));

      $detail?.attr('aria-busy',String(value));

      $panel?.find('input,select,button').prop('disabled',value);

      $detail?.find('button').prop('disabled',value);

    }

    async function runAction(detail,fn) {

      if (!alive() || busy) return;

      captureDraft();

      setBusy(true);

      try {

        await fn();

      } catch (e) {

        recordError(detail ? 'detail-click' : 'panel-click',e);

        if (alive()) notify(e.message || '操作失败',detail);

      } finally {

        if (alive()) {

          setBusy(false);

          refreshMessages();

          if (state.detail && $detail.is(':visible')) renderDetail();

        } else busy = false;

      }

    }

    // 渲染

    function materials(stat) {

      const location = str(obj(stat['世界'])['地点']);

      const abyss = ABYSS_KEYS.some(k => location.includes(k));

      const bag = obj(obj(stat['主角'])['背包']);

      return Object.entries(bag).filter(([,value]) => {

        const o = obj(value);

        return arr(o['标签']).some(t => str(t).includes('馐兽'))

          || str(o['描述']).includes('胎光')

          || (abyss && /材料|食材/.test(str(o['类型'])));

      });

    }

    function costHTML(item) {

      const cost = parseCost(item);

      if (!cost) return '';

      return `<details class="cost-detail"><summary>代价·${COST_LABEL[cost.type]}</summary>

      ${cost.detail ? `<div>${esc(cost.detail)}</div>` : ''}

      ${cost.negGain ? `<div>负面效果：${esc(cost.negGain)}</div>` : ''}</details>`;

    }

    function formHTML(editor) {

      const pendingCancel = state.pendingAction?.kind === 'cancel';

      return `<div class="edit-form">${FIELDS[editor.type].map(([key,kind,options]) => {

        const v = editor.draft[key];

        if (kind === 'checkbox') {

          return `<div class="edit-row"><label><input type="checkbox" data-field="${key}"${v === true ? ' checked' : ''}> ${key}</label></div>`;

        }

        if (kind === 'select') {

          const current = str(v), values = current && !options.includes(current) ? [current,...options] : options;

          return `<div class="edit-row"><label>${key}</label><select data-field="${key}">

          <option value="">（无）</option>${values.map(op => `<option value="${esc(op)}"${current === op ? ' selected' : ''}>${esc(op)}</option>`).join('')}</select></div>`;

        }

        return `<div class="edit-row"><label>${key}</label><input type="${kind === 'number' ? 'number' : 'text'}"

        ${kind === 'number' ? 'step="any"' : ''} data-field="${key}" value="${esc(v)}"></div>`;

      }).join('')}<div class="edit-actions"><button class="btn btn-save" data-act="save">保存</button>

      <button class="btn${pendingCancel ? ' confirm' : ''}" data-act="cancel">${pendingCancel ? '确认放弃？' : '取消'}</button></div></div>`;

    }

    function itemHTML(item,index,type,detail) {

      const o = obj(item), name = nameOf(item) || '未命名', quality = str(o['品质']);

      const editor = !detail && state.editor && state.editor.target === state.target

        && state.editor.type === type && state.editor.index === index ? state.editor : null;

      const confirmState = state.deleteConfirm;

      const confirmed = confirmState && confirmState.target === (detail ? state.detail.target : state.target)

        && confirmState.type === type && confirmState.index === index && confirmState.itemFp === fp(item);

      const pendingEdit = !detail && state.pendingAction?.kind === 'edit'

        && state.pendingAction.target === state.target && state.pendingAction.type === type

        && state.pendingAction.index === index;

      const flesh = !detail && type === 'flesh', hasCost = o['代价'] === true, privateItem = o['风格'] === '私隐';

      let h;

      if (flesh) {

        const classes = ['zi2'];

        if (editor) classes.push('editing');

        if (privateItem) classes.push('private');

        if (hasCost) classes.push('cost');

        h = `<div class="${classes.join(' ')}"><span class="mn">${index+1}</span><span class="mnm">${esc(name)}</span>`

          + (o['部位'] ? `<span class="mz">${esc(o['部位'])}</span>` : '')

          + (o['风格'] ? `<span class="sbadge" style="color:${STYLE_COLOR[o['风格']] || 'inherit'}">${esc(STYLE_BADGE[o['风格']] || o['风格'])}</span>` : '')

          + (hasCost ? '<span class="sbadge cost-badge">代价</span>' : '');

      } else {

        h = `<div class="${detail ? 'detail-item' : 'item'}${editor ? ' editing' : ''}">

        ${detail ? '' : `<span class="seq">#${index+1}</span>`}

        <span class="${detail ? 'detail-in' : 'in'}">${esc(name)}</span>`;

        if (quality) h += `<span class="iq" style="color:${RANK_COLORS[quality] || '#8b8b80'}">${esc(quality)}</span>`;

        if (num(o['等级']) !== 0) h += `<span class="ilv">Lv.${esc(o['等级'])}</span>`;

        if (o['评定']) h += `<span class="ilv">${esc(o['评定'])}</span>`;

        if (o['分支']) h += `<span class="zt" style="color:${BRANCH_COLOR[o['分支']] || '#888'}">${esc(o['分支'])}</span>`;

        if (o['风格']) h += `<span class="zt" style="color:${STYLE_COLOR[o['风格']] || 'inherit'}">${esc(STYLE_BADGE[o['风格']] || o['风格'])}</span>`;

        const meta = ['产地','部位','料理','厨师'].map(k => str(o[k])).filter(Boolean);

        if (meta.length) h += `<div class="${detail ? 'detail-ib' : 'ib'}">${esc(meta.join(' · '))}</div>`;

      }

      if (o['增益']) h += `<div class="ib gain">增益：${esc(o['增益'])}</div>`;

      if (o['特征']) h += `<div class="ib">${esc(o['特征'])}</div>`;

      if (o['描述']) {

        const token = fp([detail ? state.detail.target : state.target,type,index]);

        const hidden = privateItem && !state.peek[token];

        const peekClass = privateItem ? (hidden ? ' peek-blur' : ' peek-open') : '';

        h += `<div class="zdesc${peekClass}"${privateItem

        ? ` data-${detail ? 'dact' : 'act'}="peek" data-index="${index}" title="${hidden ? '点击查看' : '点击收起'}"` : ''}>${esc(o['描述'])}</div>`;

      }

      if (o['风味']) h += `<div class="ib taste-note">${esc(o['风味'])}</div>`;

      if (o['分享']) h += `<div class="ishare">与 ${esc(o['分享'])} 同食</div>`;

      h += costHTML(item);

      if (type === 'devour') {

        const warning = checkDevourBalance(item);

        if (warning) h += `<span class="zt unbalance" title="${esc(warning)}">异化失衡</span>`;

      }

      if (!state.readOnly) {

        const prefix = detail ? 'data-dact' : 'data-act';

        h += `<div class="iops">${!detail

        ? `<button class="btn${pendingEdit ? ' confirm' : ''}" data-act="edit" data-index="${index}">${pendingEdit ? '确认放弃？' : '编辑'}</button>` : ''}

        <button class="btn btn-del${confirmed ? ' confirm' : ''}" ${prefix}="delete" data-index="${index}"

        data-item-fp="${esc(fp(item))}">${confirmed ? '再点确认' : '删除'}</button></div>`;

      }

      if (editor) h += formHTML(editor);

      return h + '</div>';

    }

    function vesselLine(root) {

      if (str(root['法则容器'])) return `法则容器：${esc(root['法则容器'])}`;

      let beast = 0, treasure = 0, pure = false;

      for (const value of [...getList(root,'food'),...getList(root,'devour')]) {

        const o = obj(value);

        if (!str(o['品质']).includes('神话')) continue;

        if (str(o['名']).includes('食宝')) treasure++;

        else beast++;

        if (/纯净|完美/.test(str(o['分支'])) || str(o['评定']).includes('升华')) pure = true;

      }

      return `法则容器：未拓宽（神话兽 ${Math.min(beast,2)}/2 · 食宝 ${Math.min(treasure,2)}/2${pure ? ' · 已含纯净途经' : ''}）`;

    }

    function gainsHTML(td) {

      const result = computeGains({

        食单:state.target === 'user' ? getList(td,'food') : [], 吞噬录:getList(td,'devour'),

      });

      const rows = [];

      for (const group of ['gains','checks']) {

        for (const [name,value] of Object.entries(result[group])) {

          rows.push(`<div class="gr${group === 'checks' ? ' chk' : ''}"><span>${esc(name)}</span><b>${esc(value)}</b></div>`);

        }

      }

      return `<div class="gains-body">${rows.join('') || '<div class="empty">暂无可汇总增益</div>'}</div>`;

    }

    function tabHTML(read,td) {

      const food = state.tab === 'food';

      if (food && state.target !== 'user') {

        return '<div class="empty">同伴无食单——NPC 同桌进食只记入食单条目的「分享」字段</div>';

      }

      const primaryFault = currentListFault(read,state.tab);

      if (primaryFault) return shapeCard(read,primaryFault);

      const list = getList(td,state.tab);

      const start = Math.max(0,list.length - CONFIG.MAIN_LIST_SIZE);

      const devourFault = food ? null : currentListFault(read,'devour');

      const devourCount = devourFault ? '异常' : (food ? 0 : getList(td,'devour').length);

      const deviation = num(td['纯净偏离值']), tasteRaw = td['味觉'];

      const taste = clamp(tasteRaw != null && str(tasteRaw) !== '' && Number.isFinite(Number(tasteRaw))

        ? Number(tasteRaw) : deriveTaste(deviation),0,100);

      let h = `<div class="stats">

      <div class="stat"><span class="sl">${food ? '收录' : '特征'}</span><b class="sv">${list.length}</b></div>

      <div class="stat"><span class="sl">${food ? '历史' : '吞噬'}</span><b class="sv">${food ? start : devourCount}</b></div>

      <div class="stat"><span class="sl">${food ? '味觉' : '纯净偏离'}</span><b class="sv">${food ? taste+'%' : deviation}</b></div></div>`;

      if (devourFault) h += shapeCard(read,devourFault);

      h += `<div class="hist-btns"><button class="hist-btn${start > CONFIG.HISTORY_WARN ? ' warn' : ''}" data-act="history">${food ? '历史食帖' : '特征历史'}（${start}）</button>

      <button class="hist-btn" data-act="${food ? 'materials' : 'devour'}">${food

        ? `馐兽素材（${materials(read.stat).length}）` : `吞噬录（${devourCount}）`}</button></div>`;

      if (!food) {

        const stage = stageOf(deviation), color = STAGE_COLORS[stage];

        let vessel = '';

        if (state.target === 'user') {

          const vf = currentListFault(read,'food') || currentListFault(read,'devour');

          vessel = vf ? shapeCard(read,vf) : `<div class="vessel">${vesselLine(read.root)}</div>`;

        }

        h += `<div class="gauge"><div class="gt"><span>纯净偏离值 ${deviation}/200</span>

        <b style="color:${color}">${esc(td['形态'] || STAGE_NAMES[stage])}</b></div>

        <div class="tk"><i style="width:${clamp(deviation/2,0,100)}%;background:${color}"></i></div>

        <div class="mk"><span>0</span><span>20</span><span>60</span><span>100</span><span>140</span><span>180+</span></div>

        <div class="sgt">第 ${stage} 档 · 纯净升格：${deviation < 60 ? '开放' : '已封'}</div>${vessel}</div>`;

        h += `<div class="figwrap"><img class="body-image" src="${CONFIG.IMG_URL}" alt="躯体图">`;

        const zones = Object.keys(ANCHOR_PCT).map(name => ({

          name,items:list.filter(it => zoneOf(obj(it)['部位']) === name),

        }));

        for (const z of zones) {

          if (!z.items.length) continue;

          const p = ANCHOR_PCT[z.name];

          h += `<span class="anchor" style="left:${p.x}%;top:${p.y}%"></span>

          <span class="anchor-num" style="left:${p.x}%;top:${p.y}%">${z.items.length}</span>`;

        }

        h += '</div><div class="zsum">';

        for (const z of zones) {

          if (z.items.length) {

            const hasCost = z.items.some(parseCost);

            h += `<div class="zrow"><b>${z.name}</b><span class="ztag${hasCost ? ' has-cost' : ''}">${z.items.length} 项${hasCost ? ' · 含代价' : ''}</span></div>`;

          }

        }

        h += '</div>';

      }

      h += `<section class="sect"><h3 class="sect-t">${food ? '食帖' : '进化特征'} · 最近 ${CONFIG.MAIN_LIST_SIZE} 项</h3><div class="${food ? 'list' : 'zlist'}">`;

      list.slice(start).forEach((item,i) => {

        h += itemHTML(item,start+i,state.tab,false);

      });

      if (!list.length) h += `<div class="empty">${food ? '食帖尚空' : '血肉尚未开始歌唱'}</div>`;

      if (state.editor?.index === null && state.editor.target === state.target && state.editor.type === state.tab) {

        h += `<div class="${food ? 'item' : 'zi2'} editing"><span class="${food ? 'in' : 'mnm'}">${food ? '新食帖' : '新特征'}</span>${formHTML(state.editor)}</div>`;

      }

      h += '</div>';

      if (!state.readOnly) {

        const pendingAdd = state.pendingAction?.kind === 'add';

        h += `<button class="btn btn-add${pendingAdd ? ' confirm' : ''}" data-act="add">${pendingAdd ? '确认放弃？' : '＋ 手动记录'}</button>`;

      }

      h += '</section>';

      if (food) {

        const counts = new Map(REGIONS.map(r => [r,0]));

        for (const item of list) {

          const region = REGIONS.find(r => str(obj(item)['产地']).includes(r));

          if (region) counts.set(region,counts.get(region)+1);

        }

        h += '<section class="sect"><h3 class="sect-t">产地分布</h3><div class="reg">';

        for (const [region,count] of counts) {

          h += `<div class="rw${count ? '' : ' z'}"><span class="rl">${region}</span><div class="rb"><i style="width:${list.length ? count/list.length*100 : 0}%"></i></div><b class="rn">${count}</b></div>`;

        }

        const tasteNote = taste >= 100 ? '尚能品尝人间烟火' : taste >= 85 ? '偶尔在梦中舔舐嘴唇'

          : taste >= 60 ? '开始渴望活物的温度' : taste >= 35 ? '寻常食物已如嚼蜡'

          : taste >= 15 ? '舌蕾渐成祭坛' : '味觉全失';

        h += `</div></section><div class="taste"><div class="taste-r"><span>味觉之灵</span><b>${taste}%</b></div>

        <div class="taste-b"><i style="width:${taste}%"></i></div><p class="taste-n">${tasteNote}</p></div>`;

      }

      return h;

    }

    function render() {

      if (!alive()) return;

      captureDraft();

      let read, body = '', hardFault = null;

      try {

        read = readAll();

      } catch (e) {

        try {

          const raw = readAllRaw();

          hardFault = shapeFault(raw);

          if (!hardFault) throw e;

          read = {

            ...raw,stat:obj(obj(raw.all).stat_data),

            root:obj(obj(obj(obj(raw.all).stat_data)['事件'])['胎光食录']),

          };

          body = shapeCard(raw,hardFault);

        } catch (readError) {

          state.notice = `读取失败，原页面及草稿已保留：${readError.message}`;

          refreshMessages();

          if (!$panel.find('.inner').length) {

            $panel.html(`<div class="inner ${state.tab}"><header class="hd"><span class="tt">胎光食录</span>

            <div class="hd-r"><button class="x" data-act="snapshots">快照</button>

            <button class="x" data-act="refresh">刷新</button><button class="x" data-act="close">合上</button></div></header>

            <div class="body"><div class="alert-area"></div><div class="notice-area"></div></div></div>`);

            refreshMessages();

          }

          return;

        }

      }

      const peers = Object.keys(obj(read.root['同伴记录']));

      if (!hardFault) {

        if (state.target !== 'user' && !own(obj(read.root['同伴记录']),state.target)) {

          state.target = 'user';

          state.editor = null;

          state.deleteConfirm = null;

          state.detail = null;

          state.snapConfirm = null;

          state.pendingAction = null;

          state.peek = {};

          $detail.hide();

          state.notice = '原目标同伴已消失，已回到主角；未提交任何修改';

        }

        const td = targetData(read.root,state.target,false), allFault = shapeFault(read);

        if (allFault) body += shapeCard(read,allFault);

        if (state.showGains) {

          const gainFault = (state.target === 'user' ? currentListFault(read,'food') : null)

            || currentListFault(read,'devour');

          if (gainFault) body += shapeCard(read,gainFault);

          else {

            try {

              body += gainsHTML(td);

            } catch (e) {

              body += `<div class="amber-bar">${esc(e.message)}</div>`;

            }

          }

        }

        try {

          body += tabHTML(read,td);

        } catch (e) {

          const fault = currentListFault(read,state.tab) || shapeFault(read);

          body += fault ? shapeCard(read,fault) : `<div class="amber-bar">${esc(e.message)}</div>`;

        }

      }

      const scroll = $panel.find('.inner').scrollTop() || 0, pending = state.pendingAction;

      const tabText = tab => pending?.kind === 'tab' && pending.tab === tab

        ? '确认放弃？' : tab === 'food' ? '食帖' : '血肉';

      const targetNames = state.target !== 'user' && !peers.includes(state.target) ? [state.target,...peers] : peers;

      $panel.html(`<div class="inner ${state.tab}">

      <header class="hd"><span class="tt">胎光食录 · ${state.tab === 'food' ? '食帖' : '血肉'}</span>

      <div class="hd-r"><button class="x" data-act="gains">增益</button><button class="x" data-act="snapshots">快照</button>

      <button class="x ro-btn${state.readOnly ? ' active' : ''}" data-act="readonly">${state.readOnly ? '只读✓' : '只读'}</button>

      <button class="x" data-act="refresh">刷新</button><button class="x" data-act="close">合上</button></div></header>

      <div class="sel"><select id="tglTarget"><option value="user"${state.target === 'user' ? ' selected' : ''}>主角</option>${targetNames.map(n =>

        `<option value="${esc(n)}"${n === state.target ? ' selected' : ''}>${esc(n)}</option>`).join('')}</select>

      ${pending?.kind === 'target' ? `<div class="edit-actions"><span>${esc(pending.target === 'user' ? '主角' : pending.target)}</span><button class="btn confirm" data-act="target-apply">确认放弃？</button><button class="btn" data-act="pending-cancel">取消</button></div>` : ''}

      </div>

      <nav class="tabs"><button class="tab${state.tab === 'food' ? ' on' : ''}${pending?.kind === 'tab' && pending.tab === 'food' ? ' confirm' : ''}" data-act="tab" data-tab="food">${tabText('food')}</button>

      <button class="tab${state.tab === 'flesh' ? ' on' : ''}${pending?.kind === 'tab' && pending.tab === 'flesh' ? ' confirm' : ''}" data-act="tab" data-tab="flesh">${tabText('flesh')}</button></nav>

      <div class="body"><div class="alert-area"></div><div class="notice-area"></div>${body}</div></div>`);

      $panel.find('.inner').scrollTop(scroll);

      $panel.find('.body-image').on('error',function () {

        $(this).parent().addClass('noimg');

        $(this).remove();

      }).each(function () {

        if (this.complete && !this.naturalWidth) $(this).trigger('error');

      });

      refreshMessages();

    }

    function openDetail(kind) {

      state.detail = {kind,target:state.target,type:state.tab,page:0};

      state.snapConfirm = null;

      state.deleteConfirm = null;

      state.pendingAction = null;

      state.detailNotice = '';

      renderDetail();

      $detail.css('display','flex');

    }

    function renderDetail() {

      if (!alive() || !state.detail) return;

      const detail = state.detail;

      let title = '', body = '', footer = '';

      try {

        if (detail.kind === 'snapshots') {

          let list = [], loadErr = '';

          try {

            list = loadSnapshots();

          } catch (e) {

            loadErr = e.message;

          }

          const best = loadErr ? null : bestSnapshot();

          title = `快照库（${list.length}/${CONFIG.SNAP_MAX}）`;

          if (state.snapConfirm && state.snapConfirm.action !== 'snap-reset'

            && fp(list[state.snapConfirm.index]) !== state.snapConfirm.itemFp) {

            state.snapConfirm = null;

            state.pendingAction = null;

            state.detailNotice = '快照已变化，确认已取消';

          }

          if (loadErr) {

            const resetting = state.snapConfirm?.action === 'snap-reset';

            body = `<div class="warn">快照库无法读取：${esc(loadErr)}

            ${state.readOnly ? '' : `<div class="iops"><button class="btn btn-del${resetting ? ' confirm' : ''}"

              data-dact="snap-reset">${resetting ? '确认重置？' : '重置快照库'}</button></div>`}</div>`;

          } else {

            if (state.snapConfirm?.action === 'snap-reset') state.snapConfirm = null;

            body = '<div class="tip">快照记录食单/吞噬录/进化特征/同伴数据。恢复将覆盖当前记录；快照外同伴保留；偏离值/形态不受影响。</div>';

          }

          // rc6: 快照库空标签的"当前世界"补显来源，整次渲染只算一次；取不到就空，绝不影响快照库打开

          let viewMeta = { time:'', place:'' };

          try {

            viewMeta = worldMeta(messageLocation().messageId);

          } catch (e) {

            viewMeta = { time:'', place:'' };

          }

          list.forEach((s,index) => {

            const valid = validSnapshot(s), c = valid ? countsOf(s.data) : {};

            const confirmAction = state.snapConfirm?.index === index ? state.snapConfirm.action : '';

            const pendingDiscard = state.pendingAction?.kind === 'snapshot-restore' && state.pendingAction.index === index;

            // rc6: 档案值优先、空了才用当前世界补、并加补显标记

            const snap = obj(s);

            const storedTime = str(snap.time), storedPlace = str(snap.place);

            const fbTime = !storedTime && !!str(viewMeta.time);

            const fbPlace = !storedPlace && !!str(viewMeta.place);

            const viewTime = storedTime || str(viewMeta.time) || '未知时间';

            const viewPlace = storedPlace || str(viewMeta.place) || '未知地点';

            body += `<div class="detail-item"><span class="detail-in">${

            fbTime ? `<span class="snap-fb" title="拍照时未记录，按当前世界补显">${esc(viewTime)}</span>` : esc(viewTime)

          } @ ${

            fbPlace ? `<span class="snap-fb" title="拍照时未记录，按当前世界补显">${esc(viewPlace)}</span>` : esc(viewPlace)

          }${(fbTime || fbPlace) ? ' <span class="snap-fb-tag">当前补显</span>' : ''}${best?.index === index ? ' ⭐' : ''}</span>

            <div class="detail-ib">${valid ? `食${c.food} 吞${c.devour} 特${c.flesh} 同伴${c.peers}` : '[无效]'}｜${fmtTime(obj(s).savedAt)}</div>`;

            if (!state.readOnly) {

              body += `<div class="iops">${valid

              ? `<button class="btn${confirmAction === 'restore' || pendingDiscard ? ' confirm' : ''}" data-dact="restore" data-index="${index}" data-item-fp="${esc(fp(s))}">${pendingDiscard ? '确认放弃？' : confirmAction === 'restore' ? '确认恢复？' : '恢复'}</button>` : ''}

              <button class="btn btn-del${confirmAction === 'snapshot-delete' ? ' confirm' : ''}" data-dact="snapshot-delete" data-index="${index}" data-item-fp="${esc(fp(s))}">${confirmAction === 'snapshot-delete' ? '再点确认' : '删除'}</button></div>`;

            }

            body += '</div>';

          });

          if (!list.length && !loadErr) body += '<div class="detail-empty">暂无快照</div>';

        } else {

          const read = readAll();

          if (detail.kind === 'materials') {

            const list = materials(read.stat);

            title = `馐兽素材（${list.length}）`;

            body = list.map(([name,value]) => {

              const o = obj(value);

              return `<div class="detail-item mat2"><b>${esc(name)}</b>

              <span class="ilv">×${own(o,'数量') ? esc(o['数量']) : 1}</span>

              <div class="detail-ib">${esc(o['描述'])}</div></div>`;

            }).join('') || '<div class="detail-empty">背包中暂无带「馐兽」标签的素材</div>';

          } else {

            const type = detail.kind === 'devour' ? 'devour' : detail.type;

            const fault = currentListFault(read,type,detail.target);

            if (fault) {

              title = detail.kind === 'devour' ? '吞噬录' : '历史记录';

              body = shapeCard(read,fault,true);

            } else {

              const td = targetData(read.root,detail.target,true), full = getList(td,type);

              const list = detail.kind === 'devour' ? full : full.slice(0,Math.max(0,full.length-CONFIG.MAIN_LIST_SIZE));

              const pages = Math.max(1,Math.ceil(list.length/CONFIG.DETAIL_PAGE));

              detail.page = clamp(detail.page,0,pages-1);

              title = `${detail.kind === 'devour' ? '吞噬录' : type === 'food' ? '历史食帖' : '特征历史'}（${list.length}）`;

              const start = detail.page * CONFIG.DETAIL_PAGE;

              body = list.slice(start,start+CONFIG.DETAIL_PAGE)

                .map((it,i) => itemHTML(it,start+i,type,true)).join('')

                || `<div class="detail-empty">${detail.kind === 'devour' ? '尚无吞噬记录' : '历史为空'}</div>`;

              if (list.length > CONFIG.HISTORY_WARN) {

                body = `<div class="warn">⚠️ 记录已超 ${CONFIG.HISTORY_WARN} 条，建议定期清理</div>` + body;

              }

              footer = `<footer class="detail-footer"><span class="page-info">${detail.page+1} / ${pages}</span>

              <div class="page-btns"><button class="btn page-btn" data-dact="page" data-dir="-1"${detail.page === 0 ? ' disabled' : ''}>上一页</button>

              <button class="btn page-btn" data-dact="page" data-dir="1"${detail.page === pages-1 ? ' disabled' : ''}>下一页</button></div></footer>`;

            }

          }

        }

      } catch (e) {

        title = title || '详情';

        state.detailNotice = e.message;

        body = `<div class="detail-empty">当前数据无法读取，未执行写入：${esc(e.message)}</div>`;

        if (detail.kind !== 'snapshots') {

          try {

            const raw = readAllRaw(), fault = shapeFault(raw);

            if (fault) body += shapeCard(raw,fault,true);

          } catch (readError) {}

        }

      }

      const theme = detail.kind === 'materials' || (detail.kind === 'history' && detail.type === 'food') ? 'food' : 'flesh';

      $detail.html(`<div class="detail-inner ${theme}">

      <header class="detail-hd"><b class="detail-tt">${title}</b><button class="detail-x x" data-dact="close">✕</button></header>

      <div class="detail-body"><div class="detail-notice"></div><div class="detail-list">${body}</div></div>${footer}</div>`);

      refreshMessages();

    }

    // 交互

    async function deleteItem(index,shownFp,detail) {

      const context = {

        target:detail ? state.detail.target : state.target,

        type:detail ? (state.detail.kind === 'devour' ? 'devour' : state.detail.type) : state.tab,

      };

      captureDraft();

      const editor = state.editor;

      const sameList = !!editor &&

        editor.target === context.target &&

        editor.type === context.type;

      if (sameList && editor.index === index && editorDirty()) {

        throw new Error('该条目有未保存修改，请先保存或取消编辑，再删除');

      }

      const old = state.deleteConfirm;

      const same = old && old.target === context.target && old.type === context.type

        && old.index === index && old.itemFp === shownFp;

      if (!same) {

        const read = readAll(), list = getList(targetData(read.root,context.target,true),context.type);

        if (index < 0 || index >= list.length || fp(list[index]) !== shownFp) throw new Error('条目已变化，请刷新');

        state.deleteConfirm = {...context,index,itemFp:shownFp};

      } else {

        const result = await mutateList(context,list => {

          if (index < 0 || index >= list.length || fp(list[index]) !== old.itemFp) throw new Error('删除目标已变化');

          return list.filter((_,i) => i !== index);

        });

        if (sameList && state.editor === editor && editor.index !== null) {

          if (editor.index === index) {

            state.editor = null;

          } else if (editor.index > index) {

            editor.index--;

          }

        }

        state.deleteConfirm = null;

        state.pendingAction = null;

        state.snapConfirm = null;

        notify(result.warning || '记录已删除',detail);

      }

      render();

    }

    function requestTarget(target) {

      if (target !== 'user') {

        const read = readAll();

        targetData(read.root,target,true);

      }

      const request = {kind:'target',target};

      if (!leaveEditor(request)) {

        render();

        return;

      }

      state.target = target;

      state.peek = {};

      state.detail = null;

      state.snapConfirm = null;

      $detail.hide();

      render();

    }

    async function requestBestRestore() {

      let pending = state.pendingAction;

      if (pending?.kind !== 'alert-restore') {

        const best = bestSnapshot();

        if (!best) throw new Error('没有有效快照');

        captureDraft();

        state.pendingAction = {

          kind:'alert-restore',index:best.index,itemFp:fp(best.snapshot),

          phase:editorDirty() ? 'discard' : 'restore',editorStamp:editorStamp(),

        };

        refreshMessages();

        return;

      }

      const list = loadSnapshots(), snap = list[pending.index];

      if (!validSnapshot(snap) || fp(snap) !== pending.itemFp) {

        state.pendingAction = null;

        throw new Error('首次选择的快照已变化，请重新确认');

      }

      captureDraft();

      if (editorDirty() && pending.editorStamp !== editorStamp()) {

        pending.editorStamp = editorStamp();

        pending.phase = 'discard';

        refreshMessages();

        return;

      }

      if (pending.phase === 'discard') {

        state.editor = null;

        state.deleteConfirm = null;

        pending.phase = 'restore';

        pending.editorStamp = '';

        render();

        return;

      }

      state.pendingAction = null;

      state.notice = await restoreSnapshot(snap);

      render();

    }

    async function panelAction(el) {

      const act = el.getAttribute('data-act');

      if (state.readOnly && ['add','edit','save','delete','alert-restore','shape-repair'].includes(act)) {

        throw new Error('只读模式下禁止修改');

      }

      const index = Number(el.getAttribute('data-index'));

      switch (act) {

        case 'close':

          closePanel();

          return;

        case 'notice-clear':

          state.notice = '';

          refreshMessages();

          return;

        case 'pending-cancel':

          state.pendingAction = null;

          break;

        case 'target-apply':

          if (state.pendingAction?.kind === 'target') requestTarget(state.pendingAction.target);

          return;

        case 'gains':

          state.showGains = !state.showGains;

          break;

        case 'readonly':

          state.readOnly = !state.readOnly;

          state.pendingAction = null;

          break;

        case 'refresh':

          takeSnapshot(true);

          break;

        case 'tab': {

          const tab = el.getAttribute('data-tab') === 'flesh' ? 'flesh' : 'food';

          if (tab === state.tab) return;

          if (!leaveEditor({kind:'tab',tab})) {

            render();

            return;

          }

          state.tab = tab;

          state.peek = {};

          break;

        }

        case 'add':

          beginEditor(null);

          return;

        case 'edit':

          beginEditor(index);

          return;

        case 'cancel':

          if (!leaveEditor({kind:'cancel'})) {

            render();

            return;

          }

          break;

        case 'save':

          await saveEditor();

          return;

        case 'shape-repair':

          await repairShape(el,false);

          return;

        case 'delete':

          state.pendingAction = null;

          await deleteItem(index,el.getAttribute('data-item-fp'),false);

          return;

        case 'history':

          openDetail('history');

          return;

        case 'devour':

          openDetail('devour');

          return;

        case 'materials':

          openDetail('materials');

          return;

        case 'snapshots':

          openDetail('snapshots');

          return;

        case 'peek': {

          const token = fp([state.target,state.tab,index]);

          if (own(state.peek,token)) delete state.peek[token];

          else put(state.peek,token,1);

          break;

        }

        case 'alert-dismiss': {

          const read = readAll();

          appendBaseline(snapshotData(read.root),worldMeta(read.messageId));

          state.alertInfo = null;

          state.pendingAction = null;

          state.notice = '当前记录已确认为新基线';

          break;

        }

        case 'alert-restore':

          await requestBestRestore();

          return;

        default:

          return;

      }

      render();

    }

    async function resetSnapshotLibrary() {

      let raw = null, readable = false;

      try {

        raw = localStorage.getItem(KEYS.SNAP);

        readable = true;

      } catch (e) {}

      const stamp = fp({readable,raw}), pending = state.snapConfirm;

      if (!pending || pending.action !== 'snap-reset' || pending.itemFp !== stamp) {

        state.snapConfirm = {action:'snap-reset',itemFp:stamp};

        state.pendingAction = null;

        return;

      }

      if (readable && raw !== null) {

        localStorage.setItem('tglSnapshots_v2_backup',raw);

      }

      localStorage.removeItem(KEYS.SNAP);

      state.snapConfirm = null;

      state.pendingAction = null;

      state.detailNotice = readable && raw !== null

        ? '快照库已重置（原值已备份到 tglSnapshots_v2_backup）'

        : '快照库已重置（原值无法读取或不存在，未生成备份）';

    }

    async function detailAction(el) {

      const act = el.getAttribute('data-dact');

      if (!state.detail) return;

      if (state.readOnly && !['close','page','peek'].includes(act)) throw new Error('只读模式下禁止修改');

      const index = Number(el.getAttribute('data-index'));

      if (act === 'close') {

        state.snapConfirm = null;

        state.deleteConfirm = null;

        state.pendingAction = null;

        $detail.hide();

        return;

      }

      if (act === 'page') {

        state.detail.page += Number(el.getAttribute('data-dir'));

        state.peek = {};

        state.deleteConfirm = null;

        return;

      }

      if (act === 'peek') {

        const type = state.detail.kind === 'devour' ? 'devour' : state.detail.type;

        const token = fp([state.detail.target,type,index]);

        if (own(state.peek,token)) delete state.peek[token];

        else put(state.peek,token,1);

        return;

      }

      if (act === 'shape-repair') {

        await repairShape(el,true);

        return;

      }

      if (act === 'snap-reset') {

        await resetSnapshotLibrary();

        return;

      }

      if (act === 'delete') {

        await deleteItem(index,el.getAttribute('data-item-fp'),true);

        return;

      }

      if (!['restore','snapshot-delete'].includes(act)) return;

      const list = loadSnapshots(), shownFp = el.getAttribute('data-item-fp');

      if (!Number.isInteger(index) || index < 0 || index >= list.length || fp(list[index]) !== shownFp) {

        state.snapConfirm = null;

        state.pendingAction = null;

        throw new Error('快照已变化，确认已取消');

      }

      const confirmState = state.snapConfirm;

      if (!confirmState || confirmState.action !== act || confirmState.index !== index || confirmState.itemFp !== shownFp) {

        state.snapConfirm = {action:act,index,itemFp:shownFp};

        state.pendingAction = null;

        return;

      }

      if (act === 'snapshot-delete') {

        list.splice(index,1);

        saveSnapshots(list);

        state.detailNotice = '快照已删除';

      } else {

        if (!leaveEditor({kind:'snapshot-restore',index,itemFp:shownFp})) return;

        state.detailNotice = await restoreSnapshot(list[index]);

        render();

      }

      state.pendingAction = null;

      state.snapConfirm = null;

    }

    function bindUI() {

      $panel.on('click','[data-act]',function (e) {

        e.stopPropagation();

        runAction(false,() => panelAction(this));

      });

      $detail.on('click','[data-dact]',function (e) {

        e.stopPropagation();

        runAction(true,() => detailAction(this));

      });

      $panel.on('click',function (e) {

        if (e.target === this && !busy) closePanel();

      });

      $detail.on('click',function (e) {

        if (e.target === this && !busy) {

          state.snapConfirm = null;

          state.deleteConfirm = null;

          state.pendingAction = null;

          $detail.hide();

        }

      });

      $panel.on('input change','[data-field]',captureDraft);

      $panel.on('change','#tglTarget',function () {

        if (busy) return;

        const selected = this.value;

        this.value = state.target;

        runAction(false,() => requestTarget(selected));

      });

      $(targetDoc).on(`keydown${EVENT_NS}`,e => {

        if (!alive() || busy || e.key !== 'Escape') return;

        if ($detail.is(':visible')) {

          state.snapConfirm = null;

          state.deleteConfirm = null;

          state.pendingAction = null;

          $detail.hide();

        } else if ($panel.is(':visible')) closePanel();

      });

    }

    function bindDrag() {

      function position() {

        try {

          const value = JSON.parse(localStorage.getItem(KEYS.BTN_POS) || 'null');

          if (isObj(value)) return {right:Number.parseFloat(value.right),bottom:Number.parseFloat(value.bottom)};

        } catch (e) {}

        return {right:20,bottom:72};

      }

      function place(right,bottom) {

        const width = targetDoc.documentElement.clientWidth;

        const height = targetDoc.documentElement.clientHeight;

        if (width <= 0 || height <= 0) return; // 视口尺寸未就绪时不移动，避免误夹到0

        const buttonWidth = $btn.outerWidth() || 52;   // 读真实外尺寸（含1px边框=54），不写死52

        const buttonHeight = $btn.outerHeight() || 52;

        $btn.css({

          right:clamp(Number.isFinite(right) ? right : 20,0,Math.max(0,width-buttonWidth)),

          bottom:clamp(Number.isFinite(bottom) ? bottom : 72,0,Math.max(0,height-buttonHeight)),

        });

      }

      const initial = position();

      place(initial.right,initial.bottom);

      $btn.on('pointerdown',e => {

        if (!alive() || busy || (e.button !== undefined && e.button !== 0)) return;

        state.drag = {

          id:e.pointerId,x:e.clientX,y:e.clientY,

          right:parseFloat($btn.css('right')),bottom:parseFloat($btn.css('bottom')),moved:false,

        };

        try {

          $btn[0].setPointerCapture(e.pointerId);

        } catch (error) {}

      });

      $(targetDoc).on(`pointermove${EVENT_NS}`,safe('drag',e => {

        const drag = state.drag;

        if (!drag || e.pointerId !== drag.id) return;

        const dx = e.clientX-drag.x, dy = e.clientY-drag.y;

        if (!drag.moved && Math.abs(dx)+Math.abs(dy) < 6) return;

        drag.moved = true;

        $btn.addClass('dragging');

        place(drag.right-dx,drag.bottom-dy);

      }));

      $(targetDoc).on(`pointerup${EVENT_NS} pointercancel${EVENT_NS}`,safe('drag',e => {

        const drag = state.drag;

        if (!drag || e.pointerId !== drag.id) return;

        state.drag = null;

        $btn.removeClass('dragging');

        try {

          $btn[0].releasePointerCapture(e.pointerId);

        } catch (error) {}

        if (drag.moved) {

          try {

            localStorage.setItem(KEYS.BTN_POS,fp({right:$btn.css('right'),bottom:$btn.css('bottom')}));

          } catch (error) {}

        } else if (e.type === 'pointerup') {

          if ($panel.is(':visible')) closePanel();

          else openPanel();

        }

      }));

      // ◆v2.1.1：仅在实际挂载窗口监听 resize（旋屏引发真实布局变化时必触发）

      const targetWin = targetDoc.defaultView;

      if (targetWin) {

        $(targetWin).on(`resize${EVENT_NS}`,safe('drag',() => {

          // 视口变化时结束当前手势，避免继续使用旋屏前坐标；松手不会误触开面板

          const drag = state.drag;

          state.drag = null;

          $btn.removeClass('dragging');

          if (drag) { try { $btn[0].releasePointerCapture(drag.id); } catch (e) {} }

          place(Number.parseFloat($btn.css('right')),Number.parseFloat($btn.css('bottom')));

        }));

      }

    }

    // 迁移监听

    async function migrateLegacy() {

      const read = readAll();

      let changed = false;

      for (const td of [read.root,...Object.values(obj(read.root['同伴记录']))]) {

        if (!isObj(td)) throw new Error('同伴记录结构无效');

        for (const type of ['food','flesh']) {

          if (!own(td,LEGACY_KEY[type])) continue;

          put(td,LIST_KEY[type],getList(td,type));

          delete td[LEGACY_KEY[type]];

          changed = true;

        }

      }

      if (changed) {

        await commit(read,read.root);

        console.log(`${LOG_TAG} 旧版历史已合并，记忆值得尊重`);

      }

    }

    async function setupListener() {

      try {

        if (typeof waitGlobalInitialized === 'function') await waitGlobalInitialized('Mvu');

        if (!alive()) return;

        const mvu = typeof Mvu !== 'undefined' ? Mvu : window.Mvu;

        const event = mvu?.events?.VARIABLE_UPDATE_ENDED;

        if (!event || typeof eventOn !== 'function') {

          notify('自动快照事件不可用，打开面板或刷新时仍会检测记录',false);

          return;

        }

        mvuHandle = eventOn(event,safe('takeSnapshot',() => {

          if (suppressSnapshot) {

            // E3: 修复分支由 commit 做整表读回；其余自身事件仍按 D2 校验切片。

            if (repairingShape) return;

            try {

              const read = readAll(expectedWriteMessageId), actualData = snapshotData(read.root);

              if (expectedWriteDataFp && fp(actualData) !== expectedWriteDataFp) {

                guardWarn(firstManagedDiff(JSON.parse(expectedWriteDataFp),actualData));

              }

            } catch (e) {}

            return;

          }

          takeSnapshot();

        }));

        takeSnapshot();

        console.log(`${LOG_TAG} 禁军守望已上岗（${event}）`);

      } catch (e) {

        if (alive()) notify(`自动快照启动失败：${e.message}`,false);

      }

    }

    // 样式

    // C3: 配色、圆角、字号及血肉类族按已提供的 v2.0.9 回填。

    const CSS = `

#tglBtn{position:fixed;z-index:99990;width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,#2a3438,#1a2024);color:#6fae94;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;letter-spacing:.1em;cursor:grab;user-select:none;box-shadow:0 4px 16px rgba(0,0,0,.4);border:1px solid #3a4a48;touch-action:none}

#tglBtn.dragging{cursor:grabbing}#tglBtn span{pointer-events:none}

#tglPanel,#tglDetail{position:fixed;inset:0;z-index:99991;display:none;background:rgba(15,12,8,.88)}

#tglDetail{z-index:99992}

#tglPanel *,#tglDetail *{box-sizing:border-box}

#tglPanel .inner{margin:auto;width:min(94vw,760px);max-height:92vh;overflow-y:auto;border-radius:16px;font-family:"Noto Serif SC","Songti SC",serif;box-shadow:0 32px 80px rgba(0,0,0,.7)}

#tglDetail .detail-inner{margin:auto;width:min(92vw,680px);max-height:88vh;border-radius:14px;font-family:"Noto Serif SC","Songti SC",serif;box-shadow:0 28px 70px rgba(0,0,0,.75);display:flex;flex-direction:column;overflow:hidden}

#tglPanel .food,#tglDetail .food{background:linear-gradient(165deg,#4a3828,#3d2f20 45%,#332618);border:1px solid #5a4a38;color:#c4b8a8}

#tglPanel .flesh,#tglDetail .flesh{background:linear-gradient(180deg,#1e2422,#181d1b 50%,#121514);border:1px solid #3d4a46;color:#c8d2cd}

#tglPanel .hd,#tglDetail .detail-hd{display:flex;justify-content:space-between;align-items:center;padding:18px 26px 12px;flex-shrink:0}

#tglPanel .tt,#tglDetail .detail-tt{font-size:19px;font-weight:700;letter-spacing:.18em}

#tglPanel .food .tt,#tglDetail .food .detail-tt{color:#d4c8b8}#tglPanel .flesh .tt,#tglDetail .flesh .detail-tt{color:#7dbfa5}

#tglPanel .hd-r{display:flex;gap:6px;align-items:center;flex-wrap:wrap;justify-content:flex-end}

#tglPanel .x,#tglDetail .detail-x{cursor:pointer;padding:6px 11px;border-radius:7px;font-size:11px;border:1px solid;transition:all .2s;background:rgba(255,255,255,.08)}

#tglPanel .food .x,#tglDetail .food .detail-x{border-color:#5a4a38;color:#c4b8a8}

#tglPanel .flesh .x,#tglDetail .flesh .detail-x{border-color:#3d4a46;color:#c8d2cd}

#tglPanel .ro-btn.active{background:#6fae94!important;color:#0d1110!important}

#tglPanel .sel{padding:9px 26px 11px}#tglPanel .food .sel{border-bottom:1px solid rgba(90,74,56,.35)}#tglPanel .flesh .sel{border-bottom:1px solid #3d4a46}

#tglPanel .sel select{width:100%;padding:8px 11px;border-radius:7px;font-size:12px;font-family:inherit}

#tglPanel .food .sel select{border:1px solid #5a4a38;background:#3d2f20;color:#c4b8a8}#tglPanel .flesh .sel select{border:1px solid #3d4a46;background:#181d1b;color:#c8d2cd}

#tglPanel .tabs{display:flex}#tglPanel .food .tabs{border-bottom:1px solid rgba(90,74,56,.35)}#tglPanel .flesh .tabs{border-bottom:1px solid #3d4a46}

#tglPanel .tab{flex:1;padding:11px;text-align:center;font-family:inherit;font-size:12px;letter-spacing:.2em;cursor:pointer;user-select:none;font-weight:600;position:relative;border:0;background:transparent}

#tglPanel .food .tab{color:#a89888}#tglPanel .food .tab.on{color:#d4c8b8;background:rgba(255,255,255,.1)}

#tglPanel .flesh .tab{color:#7a8a86}#tglPanel .flesh .tab.on{color:#7dbfa5;background:rgba(111,174,148,.1)}

#tglPanel .tab.on:after{content:"";position:absolute;bottom:-1px;left:22%;right:22%;height:2px;background:currentColor}

#tglPanel .body{padding:16px 26px 22px;font-size:13px;line-height:1.7}#tglDetail .detail-body{padding:14px 24px;font-size:13px;line-height:1.7;overflow-y:auto;flex:1}

#tglPanel .stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px}

#tglPanel .stat{padding:12px 10px 10px;border-radius:9px;text-align:center}

#tglPanel .food .stat{border:1px solid rgba(90,74,56,.4);background:rgba(255,255,255,.06)}#tglPanel .flesh .stat{border:1px solid #3d4a46;background:rgba(0,0,0,.2)}

#tglPanel .sl{display:block;font-size:9px;letter-spacing:.16em;font-weight:600;opacity:.85}#tglPanel .sv{display:block;margin-top:3px;font-size:19px;font-weight:700}

#tglPanel .food .sl{color:#a89888}#tglPanel .flesh .sl{color:#7a8a86}#tglPanel .food .sv{color:#d4c8b8}#tglPanel .flesh .sv{color:#7dbfa5}

#tglPanel .hist-btns{display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap}

#tglPanel .hist-btn{flex:1;min-width:100px;padding:9px;border-radius:7px;font-size:11px;text-align:center;cursor:pointer;border:1px solid;font-weight:600}

#tglPanel .food .hist-btn{border-color:#5a4a38;background:rgba(255,255,255,.08);color:#a89888}#tglPanel .flesh .hist-btn{border-color:#3d4a46;background:rgba(255,255,255,.06);color:#7a8a86}

#tglPanel .hist-btn.warn{border-color:#a03a30!important;color:#c97a6a!important;background:rgba(160,58,48,.12)!important}

#tglPanel .sect{margin-top:16px}

#tglPanel .sect-t{display:flex;align-items:center;gap:9px;margin:0 0 10px;font-size:11px;letter-spacing:.2em;font-weight:700}

#tglPanel .food .sect-t{color:#d4c8b8}#tglPanel .flesh .sect-t{color:#7dbfa5}

#tglPanel .sect-t:before{content:"❧";opacity:.55}#tglPanel .sect-t:after{content:"";flex:1;height:1px;opacity:.28;background:currentColor}

#tglPanel .list{display:grid;grid-template-columns:repeat(2,1fr);gap:9px}#tglDetail .detail-list{display:grid;gap:9px}

#tglDetail .warn,#tglDetail .detail-flash{margin:0 0 12px;padding:10px 14px;border-radius:7px;font-size:11px;line-height:1.6;border:1px solid #a03a30;background:rgba(160,58,48,.12);color:#c97a6a}

#tglDetail .tip{margin:0 0 12px;padding:10px 14px;border-radius:7px;font-size:10px;line-height:1.6;border:1px solid #3d4a46;background:rgba(111,174,148,.06);color:#7a8a86}

#tglPanel .item,#tglDetail .detail-item{padding:10px 12px;border-radius:7px;font-size:11px;line-height:1.6;overflow-wrap:anywhere;position:relative}

#tglPanel .food .item,#tglDetail .food .detail-item{border:1px solid rgba(90,74,56,.35);border-left:3px solid #5a4a38;background:rgba(255,255,255,.07)}

#tglPanel .flesh .item,#tglDetail .flesh .detail-item{border:1px solid #3d4a46;border-left:3px solid #4a6b5c;background:rgba(255,255,255,.03)}

#tglPanel .item.editing{border-left-width:5px}

#tglPanel .seq{position:absolute;top:8px;right:10px;font-size:9px;opacity:.45;font-weight:700}

#tglPanel .in,#tglDetail .detail-in{font-weight:650;font-size:12px}#tglPanel .food .in,#tglDetail .food .detail-in{color:#d4c8b8}#tglPanel .flesh .in,#tglDetail .flesh .detail-in{color:#c8d2cd}

#tglPanel .iq,#tglDetail .iq{font-size:9px;font-weight:700;margin-left:6px;padding:1px 6px;border-radius:3px;border:1px solid currentColor}

#tglPanel .ilv,#tglDetail .ilv{font-size:9px;margin-left:6px;opacity:.6;font-weight:700}

#tglPanel .zt,#tglDetail .zt{font-size:9px;font-weight:700;margin-left:5px;padding:1px 7px;border-radius:3px;border:1px solid currentColor}

#tglPanel .zt.unbalance,#tglDetail .zt.unbalance{border-color:#a03a30!important;color:#c97a6a!important;background:rgba(160,58,48,.2)}

#tglPanel .ib,#tglDetail .ib,#tglDetail .detail-ib{display:block;font-size:10px;margin-top:3px;opacity:.78;line-height:1.5}

#tglPanel .zdesc,#tglDetail .zdesc{display:block;font-size:10px;margin-top:3px;opacity:.78;line-height:1.5}

#tglPanel .ib.gain{opacity:1;color:#9fc4a8}#tglPanel .food .ib.gain{color:#c9b184}

#tglPanel .ib.taste-note{font-style:italic}

#tglPanel .peek-blur,#tglDetail .peek-blur{filter:blur(4px);cursor:pointer;user-select:none}

#tglPanel .peek-blur:hover,#tglDetail .peek-blur:hover{filter:blur(2px)}

#tglPanel .peek-open,#tglDetail .peek-open{cursor:pointer}

#tglPanel .ishare,#tglDetail .ishare{display:block;font-size:10px;font-style:italic;margin-top:3px;opacity:.65}

#tglPanel .cost-detail,#tglDetail .cost-detail{display:block;font-size:10px;margin-top:6px;padding:8px 10px;border-radius:5px;border:1px solid #3d4a46;background:rgba(0,0,0,.15);line-height:1.6}

#tglPanel .cost-detail summary,#tglDetail .cost-detail summary{font-weight:700;color:#c97a6a;cursor:pointer}

#tglPanel .cost-detail div,#tglDetail .cost-detail div{margin-top:4px;padding-left:8px;opacity:.8}

#tglPanel .iops,#tglDetail .iops{margin-top:7px;display:flex;gap:5px;justify-content:flex-end}

#tglPanel .edit-form{margin-top:6px;padding:8px;border-radius:5px;background:rgba(0,0,0,.14)}

#tglPanel .edit-row{margin-bottom:5px}#tglPanel .edit-row label{display:block;font-size:9px;margin-bottom:2px;opacity:.7}

#tglPanel .edit-row input[type=text],#tglPanel .edit-row input[type=number],#tglPanel .edit-row select{width:100%;padding:4px 7px;border-radius:4px;font-size:11px;font-family:inherit}

#tglPanel .food .edit-row input,#tglPanel .food .edit-row select{border:1px solid #5a4a38;background:#3d2f20;color:#c4b8a8}

#tglPanel .flesh .edit-row input,#tglPanel .flesh .edit-row select{border:1px solid #3d4a46;background:#181d1b;color:#c8d2cd}

#tglPanel .edit-row input[type=checkbox]{width:auto;margin-right:5px}

#tglPanel .edit-actions{display:flex;gap:5px;margin-top:6px;align-items:center;flex-wrap:wrap}

#tglPanel .btn,#tglDetail .btn{padding:4px 10px;border-radius:4px;font-size:10px;cursor:pointer;font-weight:600;border:1px solid;display:inline-block;text-align:center}

#tglPanel .food .btn,#tglDetail .food .btn{border-color:#5a4a38;background:rgba(255,255,255,.08);color:#a89888}

#tglPanel .flesh .btn,#tglDetail .flesh .btn{border-color:#3d4a46;background:rgba(255,255,255,.06);color:#7a8a86}

#tglPanel .btn-save{border-color:#6f9d74!important;color:#9fc4a8!important}

#tglPanel .btn-del,#tglDetail .btn-del{border-color:#a03a30!important;color:#c97a6a!important}

#tglDetail .btn-del{margin-top:6px}

#tglPanel .confirm,#tglDetail .confirm{background:#a03a30!important;color:#fff!important}

#tglPanel .btn-add{display:block;width:100%;margin-top:9px;padding:8px;border-style:dashed!important;text-align:center}

#tglPanel .alert-bar{margin:0 0 14px;padding:10px 14px;border-radius:8px;font-size:11px;line-height:1.7;border:1px solid #a03a30;background:rgba(160,58,48,.14);color:#e0a49a;display:flex;flex-direction:column;gap:8px}

#tglPanel .alert-bar b{color:#c9553f}

#tglPanel .alert-ops{display:flex;gap:8px;justify-content:flex-end}

#tglPanel .amber-bar{margin:0 0 14px;padding:10px 14px;border-radius:8px;font-size:11px;line-height:1.7;border:1px solid #c9a860;background:rgba(201,168,96,.12);color:#e0c88a}

#tglDetail .detail-footer{padding:12px 24px;border-top:1px solid;display:flex;justify-content:space-between;align-items:center;flex-shrink:0}

#tglDetail .food .detail-footer{border-top-color:rgba(90,74,56,.35)}#tglDetail .flesh .detail-footer{border-top-color:#3d4a46}

#tglDetail .page-info{font-size:11px;opacity:.8}#tglDetail .page-btns{display:flex;gap:6px}

#tglDetail .page-btn{padding:5px 12px;border-radius:5px;font-size:10px;cursor:pointer;border:1px solid;font-weight:600;font-family:inherit}

#tglDetail .page-btn:disabled{opacity:.35;cursor:not-allowed}

#tglPanel .empty,#tglDetail .detail-empty{padding:18px 12px;text-align:center;font-style:italic;border-radius:8px;font-size:11px;grid-column:1/-1}

#tglPanel .food .empty,#tglDetail .food .detail-empty{border:2px dashed #5a4a38;color:#a89888}#tglPanel .flesh .empty,#tglDetail .flesh .detail-empty{border:2px dashed #3d4a46;color:#7a8a86}

#tglPanel .reg{display:grid;gap:7px}#tglPanel .rw{display:flex;align-items:center;gap:11px;font-size:10px}

#tglPanel .rl{flex:0 0 auto;width:76px;letter-spacing:.08em;font-weight:600;opacity:.85}#tglPanel .rb{flex:1;height:6px;border-radius:3px;overflow:hidden;background:rgba(0,0,0,.25)}

#tglPanel .rb i{display:block;height:100%;border-radius:3px}#tglPanel .food .rb i{background:linear-gradient(90deg,#9a7a58,#8a6a48)}

#tglPanel .rn{flex:0 0 auto;font-weight:700;font-size:11px;min-width:20px;text-align:right}#tglPanel .rw.z{opacity:.3}

#tglPanel .taste{margin-top:16px;padding:13px 15px;border-radius:9px}#tglPanel .food .taste{border:1px solid #5a4a38;background:rgba(255,255,255,.06)}

#tglPanel .taste-r{display:flex;justify-content:space-between;margin-bottom:7px;font-size:10px;letter-spacing:.1em;font-weight:600}

#tglPanel .taste-b{height:6px;border-radius:3px;overflow:hidden;background:rgba(0,0,0,.2)}#tglPanel .taste-b i{display:block;height:100%;background:linear-gradient(90deg,#9a7a58,#8a6a48)}

#tglPanel .taste-n{margin:7px 0 0;font-size:10px;font-style:italic;opacity:.65}

#tglPanel .gauge{padding:14px;border-radius:9px;margin-bottom:14px}#tglPanel .flesh .gauge{border:1px solid #3d4a46;background:rgba(0,0,0,.25)}

#tglPanel .gt{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px;font-size:11px}#tglPanel .gt span{opacity:.75}#tglPanel .gt b{font-size:20px}

#tglPanel .tk{height:10px;border-radius:5px;background:#0d1110;overflow:hidden;border:1px solid #3d4a46}#tglPanel .tk i{display:block;height:100%;border-radius:5px}

#tglPanel .mk{display:flex;justify-content:space-between;margin-top:5px;font-size:8px;opacity:.6}#tglPanel .sgt{margin-top:8px;font-size:11px}

#tglPanel .vessel{margin-top:10px;font-size:10px;opacity:.85}

#tglPanel .figwrap{position:relative;width:100%;max-width:340px;aspect-ratio:340/510;margin:0 auto 14px}

#tglPanel .figwrap img{width:100%;height:100%;object-fit:fill;display:block;border-radius:9px;border:1px solid #3d4a46}

#tglPanel .figwrap.noimg{border:1px dashed #3d4a46;border-radius:9px;background:rgba(255,255,255,.02);display:flex;align-items:center;justify-content:center}

#tglPanel .figwrap.noimg:before{content:"躯体图加载失败";color:#7a8a86;font-size:11px;font-style:italic}

#tglPanel .anchor{position:absolute;width:13px;height:13px;border-radius:50%;background:#6fae94;box-shadow:0 0 10px #6fae94,0 0 0 3px rgba(13,17,16,.9);border:2px solid #c4b8a8;transform:translate(-50%,-50%);z-index:2}

#tglPanel .anchor-num{position:absolute;min-width:20px;height:20px;padding:0 5px;border:1px solid #c4b8a8;border-radius:10px;color:#0d1110;font-size:10px;font-weight:700;text-align:center;line-height:18px;background:#6fae94;transform:translate(-50%,-160%);z-index:3}

#tglPanel .zsum{margin:0 0 14px;padding:10px 14px;border-radius:7px;border:1px solid #3d4a46;background:rgba(0,0,0,.15);font-size:10px}

#tglPanel .zsum .zrow{display:flex;flex-wrap:wrap;gap:5px;align-items:center;padding:4px 0;border-bottom:1px dotted #3d4a46}

#tglPanel .zsum .zrow:last-child{border-bottom:none}

#tglPanel .zsum .zrow b{flex:0 0 60px;color:#7dbfa5;font-weight:600}

#tglPanel .zsum .ztag{padding:1px 7px;border:1px solid #3d4a46;border-radius:8px;color:#7a8a86;font-size:9px}

#tglPanel .zsum .ztag.has-cost{border-color:#a03a30;color:#c97a6a}

#tglPanel .gains-body{margin:0 0 14px;padding:10px 14px;border-radius:7px;border:1px solid #3d4a46;background:rgba(0,0,0,.15);font-size:11px;line-height:1.8}

#tglPanel .gains-body .gr{display:flex;justify-content:space-between;padding:3px 0;gap:10px}

#tglPanel .gains-body .gr span{opacity:.8}#tglPanel .gains-body .gr b{font-weight:700;color:#7dbfa5;text-align:right}

#tglPanel .gains-body .chk{margin-top:6px;padding-top:6px;border-top:1px dotted #3d4a46;color:#c9a860}

#tglPanel .mat2,#tglDetail .mat2{display:flex;flex-wrap:wrap;align-items:baseline;gap:7px;padding:9px 11px;border-radius:7px;font-size:11px;line-height:1.6;border:1px solid rgba(90,74,56,.35);border-left:3px solid #5a4a38;background:rgba(255,255,255,.07)}

#tglPanel .mat2 b,#tglDetail .mat2 b{font-size:12px;color:#d4c8b8}

#tglPanel .zlist{display:grid;gap:8px}

#tglPanel .zi2{display:flex;flex-wrap:wrap;align-items:baseline;gap:7px;padding:10px 13px;border-radius:7px;font-size:11px;line-height:1.6;border:1px solid #3d4a46;border-left:3px solid #4a6b5c;background:rgba(255,255,255,.03);overflow-wrap:anywhere;position:relative}

#tglPanel .zi2.editing{border-left-width:5px}

#tglPanel .zi2.private{border-left-color:#b87a9a}

#tglPanel .zi2.cost{border-left-color:#a03a30}

#tglPanel .zi2 .mn{position:absolute;top:8px;right:10px;width:18px;height:18px;border-radius:50%;background:#4a6b5c;color:#c8d2cd;font-size:9px;font-weight:700;text-align:center;line-height:18px}

#tglPanel .zi2 .mnm{font-weight:650;font-size:12px;color:#c8d2cd}

#tglPanel .zi2 .mz{font-size:9px;opacity:.6;margin-left:4px}

#tglPanel .zi2 .sbadge{font-size:9px;font-weight:700;margin-left:5px;padding:1px 7px;border-radius:3px;border:1px solid currentColor}

#tglPanel .zi2 .cost-badge{border-color:#a03a30;color:#a03a30}

#tglPanel .zi2 .zdesc{flex:1 1 100%;font-size:10px;opacity:.75;font-style:italic}

#tglPanel .zi2 .edit-form,#tglPanel .zi2 .cost-detail{flex:1 1 100%}

#tglDetail .snap-fb{opacity:.72;font-style:italic}

#tglDetail .snap-fb-tag{font-size:9px;opacity:.65;margin-left:4px;border:1px solid currentColor;border-radius:3px;padding:0 4px}

#tglPanel button:disabled,#tglDetail button:disabled,#tglPanel input:disabled,#tglPanel select:disabled{opacity:.35;cursor:not-allowed}

#tglPanel[aria-busy="true"],#tglDetail[aria-busy="true"]{cursor:progress}

@media(max-width:540px){#tglPanel .list{grid-template-columns:1fr}#tglPanel .stats{gap:7px}#tglPanel .sv{font-size:16px}}

`;

    // 初始化

    async function initialize() {

      const style = targetDoc.createElement('style');

      style.id = DOM_ID.STYLE;

      style.dataset.instance = INSTANCE_ID;

      style.textContent = CSS;

      targetDoc.head.appendChild(style);

      $btn = $(`<div id="${DOM_ID.BTN}" data-instance="${INSTANCE_ID}" role="button" aria-label="打开胎光食录"><span>食录</span></div>`);

      $panel = $(`<div id="${DOM_ID.PANEL}" data-instance="${INSTANCE_ID}" role="dialog" aria-label="胎光食录"></div>`);

      $detail = $(`<div id="${DOM_ID.DETAIL}" data-instance="${INSTANCE_ID}" role="dialog" aria-label="记录详情"></div>`);

      $(targetDoc.body).append($btn,$panel,$detail);

      bindUI();

      bindDrag();

      try {

        localStorage.removeItem(KEYS.ALERT);

        const legacy = localStorage.getItem(KEYS.SNAP_LEGACY);

        if (legacy && !localStorage.getItem(KEYS.SNAP)) {

          const parsed = JSON.parse(legacy);

          if (!Array.isArray(parsed)) throw new Error('旧快照库格式无效');

          localStorage.setItem(KEYS.SNAP,legacy);

          localStorage.removeItem(KEYS.SNAP_LEGACY);

        }

      } catch (e) {

        state.notice = `快照迁移未完成：${e.message}`;

      }

      busy = true;

      try {

        await migrateLegacy();

      } catch (e) {

        state.notice = `历史迁移未完成：${e.message}`;

        console.warn(LOG_TAG,e);

      } finally {

        busy = false;

      }

      if (!alive()) return;

      takeSnapshot();

      setupListener();

      console.log(`${LOG_TAG} 胎光食录 v${VERSION} 启动完毕`);

    }

    initialize().catch(e => {

      recordError('init',e);

      destroy();

    });

  }

})();