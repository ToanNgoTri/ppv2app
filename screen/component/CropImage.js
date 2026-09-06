import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useNavigation, useRoute } from '@react-navigation/native';
import ImageResizer from '@bam.tech/react-native-image-resizer';
import * as RNFS from '@dr.pogodin/react-native-fs';

// Kích thước tối đa của ảnh nạp vào trình cắt (giảm cho nhẹ WebView)
const MAX_INPUT = 1600;
// Kích thước tối đa của ảnh sau khi cắt
const MAX_OUTPUT = 1000;

/**
 * Màn hình cắt ảnh (crop).
 * Tham số điều hướng:
 *   - uri:    đường dẫn ảnh cần cắt (file:// hoặc content://)
 *   - onDone: callback nhận lại đường dẫn ảnh đã cắt
 *
 * Giao diện cắt chạy trong WebView (canvas) nên không cần thư viện native mới.
 */
export function CropImage() {
  const navigation = useNavigation();
  const route = useRoute();

  const sourceUri = route.params?.uri;
  const onDone = route.params?.onDone;

  const [html, setHtml] = useState(null);
  const [saving, setSaving] = useState(false);
  const finished = useRef(false);

  // Chuẩn bị ảnh: thu nhỏ bớt rồi chuyển sang base64 để nạp vào WebView
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        if (!sourceUri) throw new Error('Thiếu ảnh cần cắt');

        const resized = await ImageResizer.createResizedImage(
          sourceUri,
          MAX_INPUT,
          MAX_INPUT,
          'JPEG',
          92,
          0,
          undefined,
          false,
          { mode: 'contain', onlyScaleDown: true },
        );

        const base64 = await RNFS.readFile(resized.uri, 'base64');
        if (!mounted) return;
        setHtml(buildHtml('data:image/jpeg;base64,' + base64));
      } catch (e) {
        console.log('Lỗi mở ảnh để cắt:', e?.message);
        Alert.alert('Lỗi', 'Không mở được ảnh để cắt');
        navigation.goBack();
      }
    })();

    return () => {
      mounted = false;
    };
  }, [sourceUri]);

  // Nhận ảnh đã cắt từ WebView -> ghi ra file -> trả về màn trước
  const onMessage = async event => {
    let msg;
    try {
      msg = JSON.parse(event.nativeEvent.data);
    } catch {
      return;
    }

    if (msg.type === 'cancel') {
      navigation.goBack();
      return;
    }
    if (msg.type !== 'crop' || !msg.data || finished.current) return;

    finished.current = true;
    setSaving(true);
    try {
      const path = RNFS.CachesDirectoryPath + '/crop_' + Date.now() + '.jpg';
      await RNFS.writeFile(path, msg.data, 'base64');

      // Nén lại lần cuối cho nhẹ file upload
      const out = await ImageResizer.createResizedImage(
        'file://' + path,
        MAX_OUTPUT,
        MAX_OUTPUT,
        'JPEG',
        85,
        0,
        undefined,
        false,
        { mode: 'contain', onlyScaleDown: true },
      );

      onDone && onDone(out.uri);
      navigation.goBack();
    } catch (e) {
      finished.current = false;
      console.log('Lỗi lưu ảnh đã cắt:', e?.message);
      Alert.alert('Lỗi', 'Không lưu được ảnh đã cắt');
    } finally {
      setSaving(false);
    }
  };

  if (!html) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0EA5E9" />
        <Text style={styles.text}>Đang mở ảnh...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        originWhitelist={['*']}
        source={{ html }}
        onMessage={onMessage}
        javaScriptEnabled
        scrollEnabled={false}
        bounces={false}
        style={{ flex: 1, backgroundColor: '#000' }}
        androidLayerType="hardware"
      />

      {saving && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="white" />
          <Text style={[styles.text, { marginTop: 10 }]}>Đang xử lý ảnh...</Text>
        </View>
      )}

      {/* Nút thoát dự phòng (phòng khi WebView lỗi) */}
      <TouchableOpacity
        style={styles.escape}
        onPress={() => navigation.goBack()}
      >
        <Text style={{ color: '#fff', fontSize: 12 }}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

/* ================= HTML trình cắt ảnh ================= */
function buildHtml(dataUri) {
  return `
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<style>
  html, body {
    margin: 0; padding: 0; height: 100%; background: #000; overflow: hidden;
    -webkit-user-select: none; user-select: none; -webkit-touch-callout: none;
    font-family: -apple-system, Roboto, Arial, sans-serif;
  }
  #stage { position: absolute; top: 0; left: 0; right: 0; bottom: 118px;
           display: flex; align-items: center; justify-content: center; padding: 12px; }
  #wrap { position: relative; line-height: 0; }
  #img { display: block; }
  #box { position: absolute; box-sizing: border-box; border: 2px solid #fff;
         box-shadow: 0 0 0 9999px rgba(0,0,0,0.55); }
  #box .grid { position: absolute; background: rgba(255,255,255,0.35); }
  #box .gv { top: 0; bottom: 0; width: 1px; }
  #box .gh { left: 0; right: 0; height: 1px; }
  .hd { position: absolute; width: 20px; height: 20px; border: 3px solid #00c853; }
  .nw { top: -2px; left: -2px; border-right: none; border-bottom: none; }
  .ne { top: -2px; right: -2px; border-left: none; border-bottom: none; }
  .sw { bottom: -2px; left: -2px; border-right: none; border-top: none; }
  .se { bottom: -2px; right: -2px; border-left: none; border-top: none; }
  #bar { position: absolute; left: 0; right: 0; bottom: 0; height: 118px;
         background: #111; border-top: 1px solid #2c2c2c; padding: 8px 12px; box-sizing: border-box; }
  #ratios { display: flex; gap: 8px; justify-content: center; margin-bottom: 10px; flex-wrap: wrap; }
  .chip { color: #ddd; background: #222; border: 1px solid #444; border-radius: 16px;
          padding: 6px 14px; font-size: 13px; }
  .chip.on { background: #00c853; border-color: #00c853; color: #fff; font-weight: 700; }
  #acts { display: flex; gap: 10px; }
  .btn { flex: 1; text-align: center; padding: 12px 0; border-radius: 8px;
         font-size: 15px; font-weight: 700; color: #fff; }
  #cancel { background: #FF3B30; }
  #reset { background: #6c757d; flex: 0 0 84px; }
  #ok { background: #0ACC00; }
</style>

<div id="stage">
  <div id="wrap">
    <img id="img" src="${dataUri}" />
    <div id="box">
      <div class="grid gv" style="left:33.33%"></div>
      <div class="grid gv" style="left:66.66%"></div>
      <div class="grid gh" style="top:33.33%"></div>
      <div class="grid gh" style="top:66.66%"></div>
      <div class="hd nw"></div><div class="hd ne"></div>
      <div class="hd sw"></div><div class="hd se"></div>
    </div>
  </div>
</div>

<div id="bar">
  <div id="ratios">
    <div class="chip on" data-r="0">Tự do</div>
    <div class="chip" data-r="1">1:1</div>
    <div class="chip" data-r="0.75">3:4</div>
    <div class="chip" data-r="1.3333">4:3</div>
  </div>
  <div id="acts">
    <div class="btn" id="cancel">Huỷ</div>
    <div class="btn" id="reset">Đặt lại</div>
    <div class="btn" id="ok">Cắt ảnh</div>
  </div>
</div>

<script>
(function () {
  var img = document.getElementById('img');
  var wrap = document.getElementById('wrap');
  var boxEl = document.getElementById('box');
  var MIN = 40;
  var ratio = 0;              // 0 = tu do
  var dw = 0, dh = 0;         // kich thuoc anh dang hien thi
  var box = { x: 0, y: 0, w: 0, h: 0 };
  var mode = null, startPt = null, startBox = null;

  function send(obj) {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify(obj));
    }
  }

  function draw() {
    boxEl.style.left = box.x + 'px';
    boxEl.style.top = box.y + 'px';
    boxEl.style.width = box.w + 'px';
    boxEl.style.height = box.h + 'px';
  }

  function resetBox() {
    var w = dw, h = dh;
    if (ratio > 0) {
      if (w / h > ratio) { w = h * ratio; } else { h = w / ratio; }
    }
    box = { x: (dw - w) / 2, y: (dh - h) / 2, w: w, h: h };
    draw();
  }

  function ready() {
    // Tu tinh kich thuoc hien thi cho vua khung (khong dua vao max-height cua flexbox)
    var stage = document.getElementById('stage');
    var availW = Math.max(1, stage.clientWidth - 24);
    var availH = Math.max(1, stage.clientHeight - 24);
    var nw = img.naturalWidth || 1;
    var nh = img.naturalHeight || 1;
    var k = Math.min(availW / nw, availH / nh);

    dw = Math.max(1, Math.floor(nw * k));
    dh = Math.max(1, Math.floor(nh * k));

    img.style.width = dw + 'px';
    img.style.height = dh + 'px';
    wrap.style.width = dw + 'px';
    wrap.style.height = dh + 'px';
    resetBox();
  }

  if (img.complete && img.naturalWidth) { setTimeout(ready, 30); }
  else { img.onload = function () { setTimeout(ready, 30); }; }
  window.addEventListener('resize', function () { setTimeout(ready, 60); });

  function pointIn(px, py) {
    var t = 28;
    var near = function (ax, ay) {
      return Math.abs(px - ax) < t && Math.abs(py - ay) < t;
    };
    if (near(box.x, box.y)) return 'nw';
    if (near(box.x + box.w, box.y)) return 'ne';
    if (near(box.x, box.y + box.h)) return 'sw';
    if (near(box.x + box.w, box.y + box.h)) return 'se';
    if (px > box.x && px < box.x + box.w && py > box.y && py < box.y + box.h) {
      return 'move';
    }
    return null;
  }

  function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }

  function applyResize(dx, dy) {
    var l = startBox.x, t = startBox.y;
    var r = startBox.x + startBox.w, b = startBox.y + startBox.h;

    if (mode === 'nw') { l = clamp(startBox.x + dx, 0, r - MIN); t = clamp(startBox.y + dy, 0, b - MIN); }
    if (mode === 'ne') { r = clamp(r + dx, l + MIN, dw); t = clamp(startBox.y + dy, 0, b - MIN); }
    if (mode === 'sw') { l = clamp(startBox.x + dx, 0, r - MIN); b = clamp(b + dy, t + MIN, dh); }
    if (mode === 'se') { r = clamp(r + dx, l + MIN, dw); b = clamp(b + dy, t + MIN, dh); }

    var w = r - l, h = b - t;

    if (ratio > 0) {
      // Giu dung ti le, neo theo goc doi dien
      h = w / ratio;
      if (mode === 'nw' || mode === 'ne') {
        if (b - h < 0) { h = b; w = h * ratio; }
        t = b - h;
      } else {
        if (t + h > dh) { h = dh - t; w = h * ratio; }
      }
      if (mode === 'nw' || mode === 'sw') {
        l = r - w;
        if (l < 0) { l = 0; w = r; h = w / ratio; if (mode === 'nw') { t = b - h; } }
      } else {
        if (l + w > dw) { w = dw - l; h = w / ratio; if (mode === 'ne') { t = b - h; } }
      }
    }

    box = { x: l, y: t, w: w, h: h };
    draw();
  }

  function onStart(e) {
    var p = e.touches ? e.touches[0] : e;
    var rect = wrap.getBoundingClientRect();
    var px = p.clientX - rect.left, py = p.clientY - rect.top;
    mode = pointIn(px, py);
    if (!mode) return;
    startPt = { x: px, y: py };
    startBox = { x: box.x, y: box.y, w: box.w, h: box.h };
    e.preventDefault();
  }

  function onMove(e) {
    if (!mode) return;
    var p = e.touches ? e.touches[0] : e;
    var rect = wrap.getBoundingClientRect();
    var dx = (p.clientX - rect.left) - startPt.x;
    var dy = (p.clientY - rect.top) - startPt.y;

    if (mode === 'move') {
      box.x = clamp(startBox.x + dx, 0, dw - startBox.w);
      box.y = clamp(startBox.y + dy, 0, dh - startBox.h);
      draw();
    } else {
      applyResize(dx, dy);
    }
    e.preventDefault();
  }

  function onEnd() { mode = null; }

  document.addEventListener('touchstart', onStart, { passive: false });
  document.addEventListener('touchmove', onMove, { passive: false });
  document.addEventListener('touchend', onEnd);
  document.addEventListener('mousedown', onStart);
  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onEnd);

  // Ti le khung
  var chips = document.querySelectorAll('.chip');
  for (var i = 0; i < chips.length; i++) {
    (function (c) {
      c.addEventListener('click', function () {
        for (var j = 0; j < chips.length; j++) chips[j].className = 'chip';
        c.className = 'chip on';
        ratio = parseFloat(c.getAttribute('data-r'));
        resetBox();
      });
    })(chips[i]);
  }

  document.getElementById('reset').addEventListener('click', resetBox);
  document.getElementById('cancel').addEventListener('click', function () {
    send({ type: 'cancel' });
  });

  document.getElementById('ok').addEventListener('click', function () {
    try {
      var sx = img.naturalWidth / dw;
      var sy = img.naturalHeight / dh;
      var cw = Math.max(1, Math.round(box.w * sx));
      var ch = Math.max(1, Math.round(box.h * sy));

      // Gioi han kich thuoc anh xuat ra cho nhe
      var MAXO = 1200;
      var outW = cw, outH = ch;
      if (outW > MAXO || outH > MAXO) {
        var k = Math.min(MAXO / outW, MAXO / outH);
        outW = Math.round(outW * k);
        outH = Math.round(outH * k);
      }

      var cv = document.createElement('canvas');
      cv.width = outW; cv.height = outH;
      var ctx = cv.getContext('2d');
      ctx.drawImage(
        img,
        Math.round(box.x * sx), Math.round(box.y * sy), cw, ch,
        0, 0, outW, outH
      );
      var d = cv.toDataURL('image/jpeg', 0.9);
      send({ type: 'crop', data: d.substring(d.indexOf(',') + 1) });
    } catch (err) {
      send({ type: 'cancel' });
    }
  });
})();
</script>
`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  text: { color: '#fff', marginTop: 10 },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  escape: {
    position: 'absolute',
    top: 40,
    right: 14,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CropImage;
