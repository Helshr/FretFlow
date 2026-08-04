/* chordRenderer.js — 把 frets/fingers 数据渲染为 SVG 和弦图（无库） */

(function () {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';

  // 坐标系统：viewBox 260x330
  var X0 = 42, STRING_GAP = 36;   // 6 条弦竖线
  var Y0 = 48, FRET_GAP = 58;     // 5 条品横线（4 个品格）
  var MARK_Y = 26;                // 空弦/闷音标记高度

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // 把位规则：有空弦（fret 0）→ 开放和弦，画琴枕（pos 1）；
  // 否则为可移动形状 → pos = 最小正品位。
  function position(frets) {
    for (var i = 0; i < frets.length; i++) {
      if (frets[i] === 0) return 1;
    }
    var pos = Math.min.apply(null, frets.filter(function (f) { return f > 0; }));
    return isFinite(pos) ? pos : 1;
  }

  function dotY(fret, pos) {
    return Y0 + (fret - pos + 0.5) * FRET_GAP;
  }

  window.chordRenderer = {
    render: function (chord) {
      var frets = chord.frets;
      var fingers = chord.fingers || [];
      // rootString 用吉他把位号（6=低音 E），转成数组下标
      var rootIndex = chord.rootString ? 6 - chord.rootString : -1;
      var barre = chord.barre || null;
      var pos = position(frets);
      var label = esc(chord.name || '');
      var i, j, s = '';
      var lastX = X0 + 5 * STRING_GAP;
      var lastY = Y0 + 4 * FRET_GAP;

      s += '<svg xmlns="' + NS + '" viewBox="0 0 260 330" role="img" aria-label="' + label + '">';

      if (pos === 1) {
        s += '<line x1="' + X0 + '" y1="' + Y0 + '" x2="' + lastX + '" y2="' + Y0 +
          '" stroke="#d9b98a" stroke-width="7" stroke-linecap="round"/>';
      } else {
        s += '<text x="' + (X0 - 12) + '" y="' + (Y0 + FRET_GAP * 0.7) + '" text-anchor="middle" ' +
          'font-size="18" font-family="sans-serif" fill="#9aa0a8">' + pos + '</text>';
      }

      for (j = 0; j < 5; j++) {
        s += '<line x1="' + X0 + '" y1="' + (Y0 + j * FRET_GAP) + '" x2="' + lastX +
          '" y2="' + (Y0 + j * FRET_GAP) + '" stroke="#454a52" stroke-width="1"/>';
      }

      for (i = 0; i < 6; i++) {
        var w = i === 0 ? 2.2 : 1.2; // 低音 E 弦略粗
        s += '<line x1="' + (X0 + i * STRING_GAP) + '" y1="' + Y0 + '" x2="' + (X0 + i * STRING_GAP) +
          '" y2="' + lastY + '" stroke="#7f8793" stroke-width="' + w + '"/>';
      }

      // 横按线：横跨 barre.from..to 弦，在把位品位上
      if (barre) {
        var barreY = dotY(pos, pos);
        var bx1 = X0 + (6 - barre.to) * STRING_GAP;    // to=1 → 最右（高音弦）
        var bx2 = X0 + (6 - barre.from) * STRING_GAP;  // from=6 → 最左（低音弦）
        s += '<line x1="' + bx1 + '" y1="' + barreY + '" x2="' + bx2 + '" y2="' + barreY +
          '" stroke="#8f96a1" stroke-width="9" stroke-linecap="round" opacity="0.9"/>';
      }

      // 标记 + 圆点
      for (i = 0; i < 6; i++) {
        var f = frets[i];
        var x = X0 + i * STRING_GAP;
        var g = 6 - i; // 吉他弦号
        var onBarre = barre && f === pos &&
          g >= barre.to && g <= barre.from;
        if (f === -1) {
          s += '<text x="' + x + '" y="' + (MARK_Y + 6) + '" text-anchor="middle" font-size="16" ' +
            'font-family="sans-serif" fill="#6b7280">✕</text>';
        } else if (f === 0) {
          s += '<text x="' + x + '" y="' + (MARK_Y + 6) + '" text-anchor="middle" font-size="16" ' +
            'font-family="sans-serif" fill="#9aa0a8">○</text>';
        } else if (onBarre) {
          // 横按覆盖的弦：不画单独圆点；根弦画根音环
          if (i === rootIndex) {
            s += '<circle cx="' + x + '" cy="' + dotY(f, pos) + '" r="16" fill="#2b2e35" ' +
              'stroke="#ff6b6b" stroke-width="3"/>';
          }
        } else {
          var y = dotY(f, pos);
          var isRoot = i === rootIndex;
          s += '<circle cx="' + x + '" cy="' + y + '" r="16" fill="#2b2e35" stroke="' +
            (isRoot ? '#ff6b6b' : '#3a3e46') + '" stroke-width="' + (isRoot ? 3 : 1) + '"/>';
          var fg = fingers[i];
          if (fg > 0) {
            s += '<text x="' + x + '" y="' + (y + 5) + '" text-anchor="middle" font-size="14" ' +
              'font-weight="bold" font-family="sans-serif" fill="#ececf0">' + fg + '</text>';
          }
        }
      }

      s += '</svg>';
      return s;
    }
  };
})();
