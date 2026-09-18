import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import {
  addListeners,
  cancel,
  isAvailable,
  isSupported,
  start,
  stop,
} from '../../utils/speechService.js';
import { appendDictation } from '../../utils/dictation.js';

/**
 * Bao nhiêu mili-giây mới cập nhật chữ đang bay một lần. Bộ nhận dạng bắn kết
 * quả tạm rất dày; đẩy thẳng vào state sẽ làm ô nhập giật.
 */
const PARTIAL_THROTTLE_MS = 100;

/**
 * Sự kiện của module native là toàn cục, trong khi mỗi màn hình có nhiều nút mic
 * (ba dòng lọc, lại nằm trong tab nên luôn được gắn sẵn). Biến này ghi nhớ nút
 * nào đang giữ micro để những nút còn lại không cùng chép chữ vào ô của mình.
 */
let activeOwner = null;

/**
 * Nối đoạn vừa đọc vào phần chữ đã có mà không đụng tới dấu câu. Dùng cho ô tìm
 * kiếm: ở đó "chấm", "phẩy" là chữ trong tên người chứ không phải dấu.
 */
function appendPlain(existing, spoken) {
  const base = (existing || '').replace(/\s+$/, '');
  const text = (spoken || '').trim();
  if (!text) {
    return base;
  }
  return base ? `${base} ${text}` : text;
}

/**
 * Nút đọc chính tả thời gian thực cho một ô nhập chữ.
 *
 * Chữ hiện dần ngay trong lúc nói (kết quả tạm), và phiên nghe không tự tắt sau
 * vài giây im lặng — nói bao lâu cũng được cho tới khi bấm dừng.
 *
 * Nút tự quản lý phiên nghe rồi gọi `onChangeText` với chữ đã ghép sẵn, nên chỗ
 * dùng chỉ cần đặt nút cạnh TextInput và truyền `value`/`onChangeText` giống hệt
 * cái đang truyền cho TextInput.
 *
 * Máy không có module native (bản build cũ) hoặc không có bộ nhận dạng thì nút
 * tự ẩn — màn hình không cần biết.
 *
 * @param transform          Hàm nắn chữ trước khi đưa ra ô, ví dụ viết hoa hết.
 * @param smartPunctuation   true thì đổi "chấm", "phẩy", "xuống dòng" thành dấu
 *                           câu (dùng cho ô ghi chú dài). Mặc định tắt.
 */
export default function MicButton({
  value,
  onChangeText,
  transform,
  smartPunctuation = false,
  disabled,
  size = 24,
  style,
}) {
  const [available, setAvailable] = useState(false);
  const [recording, setRecording] = useState(false);
  const [starting, setStarting] = useState(false);

  /** Độ lớn âm thanh: vẽ bằng Animated để khỏi render lại mỗi khung. */
  const level = useRef(new Animated.Value(0)).current;

  /** Định danh riêng của nút này, dùng để giành/nhả micro. */
  const id = useRef({}).current;
  /** Chữ đã chốt trước đoạn đang nói — mốc để ghép kết quả tạm vào. */
  const segmentBase = useRef('');
  /** Giá trị mới nhất của ô, để callback native không bắt được value cũ. */
  const latestValue = useRef(value);
  const partialTimer = useRef(null);
  const pendingPartial = useRef(null);
  /**
   * Props do màn hình truyền vào thường là arrow tạo mới mỗi lần render. Giữ
   * qua ref để việc đăng ký listener native chỉ chạy đúng một lần.
   */
  const emit = useRef({ onChangeText, transform, smartPunctuation });

  useEffect(() => {
    latestValue.current = value;
    emit.current = { onChangeText, transform, smartPunctuation };
  }, [onChangeText, smartPunctuation, transform, value]);

  useEffect(() => {
    let cancelled = false;
    if (!isSupported()) {
      return undefined;
    }
    isAvailable().then(ok => {
      if (!cancelled) {
        setAvailable(ok);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const append = useCallback((base, spoken) => {
    const merged = emit.current.smartPunctuation
      ? appendDictation(base, spoken)
      : appendPlain(base, spoken);
    return emit.current.transform ? emit.current.transform(merged) : merged;
  }, []);

  const clearPartialTimer = useCallback(() => {
    if (partialTimer.current) {
      clearTimeout(partialTimer.current);
      partialTimer.current = null;
    }
    pendingPartial.current = null;
  }, []);

  const finish = useCallback(() => {
    clearPartialTimer();
    setRecording(false);
    setStarting(false);
    level.setValue(0);
  }, [clearPartialTimer, level]);

  /** Nhả quyền giữ micro nếu phiên vừa kết thúc là của nút này. */
  const release = useCallback(() => {
    if (activeOwner === id) {
      activeOwner = null;
    }
  }, [id]);

  useEffect(() => {
    if (!isSupported()) {
      return undefined;
    }

    const remove = addListeners({
      onStart: () => {
        setStarting(false);
      },
      onPartial: text => {
        if (activeOwner !== id) {
          return;
        }
        // Gom lại: chỉ vẽ tối đa 10 lần/giây, và luôn vẽ bản mới nhất.
        pendingPartial.current = text;
        if (partialTimer.current) {
          return;
        }
        partialTimer.current = setTimeout(() => {
          partialTimer.current = null;
          const latest = pendingPartial.current;
          pendingPartial.current = null;
          if (latest != null) {
            emit.current.onChangeText(append(segmentBase.current, latest));
          }
        }, PARTIAL_THROTTLE_MS);
      },
      onFinal: text => {
        if (activeOwner !== id) {
          return;
        }
        clearPartialTimer();
        segmentBase.current = append(segmentBase.current, text);
        emit.current.onChangeText(segmentBase.current);
      },
      onVolume: value_ => {
        if (activeOwner === id) {
          level.setValue(Math.min(1, value_ || 0));
        }
      },
      // Phiên nghe là duy nhất nên nút nào cũng phải về trạng thái nghỉ; chỉ chủ
      // phiên mới nhả quyền giữ micro và báo lỗi.
      onEnd: () => {
        release();
        finish();
      },
      onError: message => {
        const mine = activeOwner === id;
        release();
        finish();
        if (mine) {
          Alert.alert('Không nghe được', message);
        }
      },
    });

    return () => {
      remove();
      clearPartialTimer();
      // Rời màn hình trong lúc chính nút này đang nghe thì tắt hẳn micro.
      if (activeOwner === id) {
        activeOwner = null;
        cancel();
      }
    };
  }, [append, clearPartialTimer, finish, id, level, release]);

  const toggle = useCallback(async () => {
    if (recording) {
      setRecording(false);
      await stop();
      return;
    }

    // Mỗi lúc chỉ một ô được nghe: ô khác đang giữ micro thì tắt của nó trước.
    if (activeOwner && activeOwner !== id) {
      await cancel();
      // Nhường một vòng cho sự kiện kết thúc của phiên cũ chạy xong, kẻo nó
      // dọn luôn quyền giữ micro mà nút này vừa giành.
      await new Promise(resolve => setTimeout(resolve, 0));
    }

    segmentBase.current = latestValue.current || '';
    // Giành micro trước khi start: kết quả tạm có thể về ngay sau đó.
    activeOwner = id;
    setStarting(true);
    try {
      const started = await start({ locale: 'vi-VN', punctuate: true });
      if (!started) {
        release();
        setStarting(false);
        Alert.alert(
          'Chưa có quyền micro',
          'Hãy bật quyền micro cho ứng dụng trong Cài đặt để đọc bằng giọng nói.',
        );
        return;
      }
      setRecording(true);
    } catch (e) {
      release();
      setStarting(false);
      Alert.alert('Không mở được micro', e?.message || 'Vui lòng thử lại.');
    }
  }, [id, recording, release]);

  if (!isSupported() || !available) {
    return null;
  }

  const ring = size + 12;

  return (
    <TouchableOpacity
      onPress={toggle}
      disabled={disabled || starting}
      style={[styles.button, { width: ring, height: ring }, style]}
    >
      {recording && (
        // Vòng sáng nở theo tiếng nói: người dùng thấy ngay là máy đang nghe.
        <Animated.View
          style={[
            styles.pulse,
            {
              width: ring,
              height: ring,
              borderRadius: ring / 2,
              opacity: level.interpolate({
                inputRange: [0, 1],
                outputRange: [0.15, 0.55],
              }),
              transform: [
                {
                  scale: level.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.7, 1.15],
                  }),
                },
              ],
            },
          ]}
        />
      )}

      {starting ? (
        <ActivityIndicator size="small" color="#e74c3c" />
      ) : (
        <Image
          source={
            recording
              ? require('../../asset/micro-off.png')
              : require('../../asset/micro-on.png')
          }
          style={{ width: size, height: size }}
        />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    marginLeft: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulse: {
    position: 'absolute',
    backgroundColor: '#e74c3c',
  },
});
