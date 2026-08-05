/* i18n.js — 共享多语言模块（所有页面在 app.js 之前加载） */

'use strict';

function loadJSON(url, fallback) {
  return fetch(url)
    .then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    })
    .catch(function (err) {
      console.warn('[trainer] fetch 失败（可能以 file:// 打开），使用内嵌数据：', url, err);
      return fallback;
    });
}

/* 内嵌回退（与 data/i18n/*.json 保持一致，file:// 下生效） */
var I18N_FALLBACK = {
  'zh-CN': {
    "app.title": "和弦切换训练器",
    "app.subtitle": "打开网页 → 设置参数 → 点击开始 → 开始练和弦",
    "settings.language": "语言",
    "settings.mode": "模式",
    "settings.modeOpen": "Open Chords",
    "settings.modeCaged": "CAGED",
    "settings.chordCount": "训练和弦数量",
    "settings.bpm": "BPM",
    "settings.measures": "每个和弦持续",
    "settings.measures1": "1 小节",
    "settings.measures2": "2 小节",
    "settings.measures4": "4 小节",
    "settings.time": "训练时长",
    "settings.minutes1": "1 分钟",
    "settings.minutes3": "3 分钟",
    "settings.minutes5": "5 分钟",
    "settings.minutes10": "10 分钟",
    "settings.start": "开始训练",
    "train.current": "当前和弦",
    "train.next": "下一和弦",
    "train.remaining": "剩余时间",
    "train.pause": "暂停",
    "train.resume": "继续",
    "train.stop": "停止",
    "train.done": "训练完成",
    "train.return": "返回设置",
    "chord.majorSuffix": "大调",
    "chord.shapeSuffix": "形",
    "chord.power": "强力和弦",
    "error.emptyPool": "和弦池为空，请检查数据或减少数量",
    "nav.home": "首页",
    "home.title": "吉他训练",
    "home.subtitle": "选择一个功能开始练习",
    "home.section": "功能",
    "home.trainer": "和弦切换训练器",
    "home.trainerDesc": "5 分钟和弦切换训练 · Open Chords 与 CAGED · 全指板移调",
    "home.chordChart": "全量和弦图",
    "home.chordChartDesc": "CAGED 全性质 × 12 根音 · 全指板指形总表",
    "home.enter": "进入",
    "home.comingSoon": "更多功能即将到来"
  },
  'en': {
    "app.title": "Chord Switching Trainer",
    "app.subtitle": "Open page → Set params → Start → Practice chords",
    "settings.language": "Language",
    "settings.mode": "Mode",
    "settings.modeOpen": "Open Chords",
    "settings.modeCaged": "CAGED",
    "settings.chordCount": "Number of Chords",
    "settings.bpm": "BPM",
    "settings.measures": "Hold Each Chord",
    "settings.measures1": "1 measure",
    "settings.measures2": "2 measures",
    "settings.measures4": "4 measures",
    "settings.time": "Session Length",
    "settings.minutes1": "1 minute",
    "settings.minutes3": "3 minutes",
    "settings.minutes5": "5 minutes",
    "settings.minutes10": "10 minutes",
    "settings.start": "Start Training",
    "train.current": "Current Chord",
    "train.next": "Next Chord",
    "train.remaining": "Time Left",
    "train.pause": "Pause",
    "train.resume": "Resume",
    "train.stop": "Stop",
    "train.done": "Training Complete",
    "train.return": "Back to Settings",
    "chord.majorSuffix": "Major",
    "chord.shapeSuffix": "Shape",
    "chord.power": "Power",
    "error.emptyPool": "Chord pool is empty. Check data or lower the count.",
    "nav.home": "Home",
    "home.title": "Guitar Training",
    "home.subtitle": "Pick a feature to start practicing",
    "home.section": "Features",
    "home.trainer": "Chord Switching Trainer",
    "home.trainerDesc": "5-min chord switching · Open Chords & CAGED · movable across the fretboard",
    "home.chordChart": "All Chords",
    "home.chordChartDesc": "All CAGED voicings × 12 roots · full-fretboard reference",
    "home.enter": "Open",
    "home.comingSoon": "More features coming soon"
  }
};

var I18n = {
  locale: 'zh-CN',
  strings: {},

  set: function (locale, strings) {
    this.locale = locale;
    this.strings = strings;
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale;
    }
  },

  t: function (key, vars) {
    var s = this.strings[key] != null ? this.strings[key] : key;
    if (vars) {
      Object.keys(vars).forEach(function (k) {
        s = s.split('{' + k + '}').join(vars[k]);
      });
    }
    return s;
  },

  apply: function () {
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      el.textContent = I18n.t(el.getAttribute('data-i18n'));
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
      el.setAttribute('aria-label', I18n.t(el.getAttribute('data-i18n-aria')));
    });
    var titleEl = document.querySelector('title[data-i18n]');
    if (titleEl) document.title = titleEl.textContent;
  },

  initialLocale: function () {
    try {
      var saved = localStorage.getItem('trainer-lang');
      if (saved) return saved;
    } catch (e) {}
    return 'zh-CN';
  },

  /* 加载指定语言并应用，返回 Promise */
  load: function (locale) {
    return loadJSON('data/i18n/' + locale + '.json', I18N_FALLBACK[locale] || I18N_FALLBACK['zh-CN'])
      .then(function (strings) {
        I18n.set(locale, strings);
        return strings;
      });
  },

  /* 初始化语言选择器；onChange 在切换完成后回调 */
  initSwitcher: function (selectId, onChange) {
    var sel = document.getElementById(selectId);
    if (!sel) return;
    sel.value = this.locale;
    sel.addEventListener('change', function () {
      var locale = sel.value;
      I18n.load(locale).then(function () {
        try { localStorage.setItem('trainer-lang', locale); } catch (e) {}
        I18n.apply();
        if (onChange) onChange(locale);
      });
    });
  }
};
