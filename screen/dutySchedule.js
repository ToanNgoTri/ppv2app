import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  deleteSchedule,
  getSchedule,
  loadSchedule,
  subscribe,
} from '../utils/dutySchedule';
import { isSupported, openWithSystemViewer } from '../utils/sharedFileService';

/**
 * Lịch trực của đơn vị: ảnh chụp bảng lịch hoặc tệp Word/PDF nhận từ nhóm Zalo.
 *
 * Không có nút chọn tệp — lịch trực đi vào app bằng đúng một đường: mở tệp
 * trong Zalo rồi bấm "Chia sẻ" / "Mở bằng" và chọn app này (xem
 * utils/useIncomingDutyFile.js). Tệp mới thay thế tệp cũ, nên màn hình luôn chỉ
 * có một bản là bản mới nhất.
 */
export function DutySchedule() {
  const insets = useSafeAreaInsets(); // chừa chỗ cho tai thỏ / thanh trạng thái
  const [schedule, setSchedule] = useState(getSchedule());
  const [loading, setLoading] = useState(getSchedule() === null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [opening, setOpening] = useState(false);

  useEffect(() => {
    let alive = true;
    const unsubscribe = subscribe(next => {
      setSchedule(next);
      setViewerOpen(false);
    });
    loadSchedule().then(next => {
      if (alive) {
        setSchedule(next);
        setLoading(false);
      }
    });
    return () => {
      alive = false;
      unsubscribe();
    };
  }, []);

  const confirmDelete = () =>
    Alert.alert('Xoá lịch trực', 'Xoá bản lịch trực đang giữ trên máy?', [
      { text: 'Huỷ', style: 'cancel' },
      {
        text: 'Xoá',
        style: 'destructive',
        onPress: () => {
          deleteSchedule().catch(e =>
            Alert.alert('Lỗi', e.message || 'Không xoá được lịch trực'),
          );
        },
      },
    ]);

  /**
   * Word và PDF không hiển thị được trong app, phải nhờ trình xem tài liệu của
   * máy: iOS dùng QuickLook (đọc sẵn .docx, không cần cài Word), Android bắn
   * intent cho ứng dụng đọc văn bản đang có.
   */
  const openDocument = async () => {
    try {
      setOpening(true);
      await openWithSystemViewer(schedule.path, schedule.mimeType);
    } catch (e) {
      Alert.alert(
        'Không mở được tệp',
        'Máy chưa có ứng dụng đọc được tệp này. Hãy cài Word hoặc trình xem PDF rồi thử lại.',
      );
    } finally {
      setOpening(false);
    }
  };

  return (
    <>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 14 }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>🗓️ Lịch trực</Text>

        {loading ? (
          <ActivityIndicator style={styles.spinner} color="#007b55" />
        ) : !schedule ? (
          <EmptyState />
        ) : (
          <View style={styles.card}>
            <Text style={styles.metaTime}>
              Nhận lúc {formatDateTime(schedule.receivedAt)}
            </Text>
            <Text style={styles.metaName} numberOfLines={2}>
              {schedule.name}
            </Text>

            {schedule.kind === 'image' ? (
              <ScheduleImage
                path={schedule.path}
                onPress={() => setViewerOpen(true)}
              />
            ) : (
              <View style={styles.doc}>
                <Text style={styles.docEmoji}>📄</Text>
                {formatBytes(schedule.size) ? (
                  <Text style={styles.docMeta}>{formatBytes(schedule.size)}</Text>
                ) : null}
                <TouchableOpacity
                  style={styles.docBtn}
                  activeOpacity={0.85}
                  onPress={openDocument}
                  disabled={opening}
                >
                  {opening ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.docBtnText}>Xem lịch trực</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {schedule ? (
          <>
            <Text style={styles.replaceHint}>
              Chia sẻ tệp mới từ Zalo sang app để thay bản lịch này.
            </Text>
            <TouchableOpacity
              style={styles.deleteBtn}
              activeOpacity={0.85}
              onPress={confirmDelete}
            >
              <Text style={styles.deleteBtnText}>Xoá lịch trực</Text>
            </TouchableOpacity>
          </>
        ) : null}
      </ScrollView>

      {schedule?.kind === 'image' && schedule.viewerPath ? (
        <ImageViewer
          visible={viewerOpen}
          viewerPath={schedule.viewerPath}
          onClose={() => setViewerOpen(false)}
        />
      ) : null}
    </>
  );
}

/** Hướng dẫn đưa lịch trực từ Zalo sang, hiện khi máy chưa có bản nào. */
function EmptyState() {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyEmoji}>🗂️</Text>
      <Text style={styles.emptyTitle}>Chưa có lịch trực</Text>
      <Text style={styles.emptyText}>
        Mở tệp lịch trực trong Zalo (ảnh chụp bảng lịch, tệp Word hoặc PDF), bấm{' '}
        <Text style={styles.bold}>Chia sẻ</Text> hoặc{' '}
        <Text style={styles.bold}>Mở bằng</Text> rồi chọn ứng dụng này. Lịch trực
        sẽ được giữ lại trên máy, xem được cả khi không có mạng.
      </Text>
      {!isSupported() ? (
        <Text style={styles.emptyWarn}>
          Bản cài đặt này chưa nhận được tệp từ Zalo. Hãy cài lại bản mới nhất.
        </Text>
      ) : null}
    </View>
  );
}

/**
 * Ảnh lịch trực vừa khung, cao đúng theo tỉ lệ thật của ảnh (lấy bằng
 * Image.getSize) để bảng lịch không bị méo hay cắt mất dòng.
 */
function ScheduleImage({ path, onPress }) {
  const [ratio, setRatio] = useState(null);
  const uri = `file://${path}`;

  useEffect(() => {
    let alive = true;
    setRatio(null);
    Image.getSize(
      uri,
      (w, h) => {
        if (alive && h > 0) {
          setRatio(w / h);
        }
      },
      () => {},
    );
    return () => {
      alive = false;
    };
  }, [uri]);

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
      <Image
        source={{ uri }}
        style={[styles.image, { aspectRatio: ratio ?? 0.75 }]}
        resizeMode="contain"
      />
      <Text style={styles.tapHint}>Chạm vào ảnh để xem lớn</Text>
    </TouchableOpacity>
  );
}

/**
 * Xem ảnh toàn màn hình, chụm hai ngón để phóng to.
 *
 * Trang HTML nằm sẵn cạnh tấm ảnh trong thư mục dữ liệu của app (xem
 * utils/dutySchedule.js) — WebView phải mở bằng đường dẫn tệp thì mới được phép
 * đọc tấm ảnh cùng thư mục.
 */
function ImageViewer({ visible, viewerPath, onClose }) {
  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.viewer}>
        <WebView
          source={{ uri: `file://${viewerPath}` }}
          style={styles.viewerWeb}
          originWhitelist={['*']}
          allowFileAccess
          allowFileAccessFromFileURLs
          // Android: chụm-để-phóng-to bật sẵn, nhưng ẩn cặp nút +/- cũ kỹ.
          setBuiltInZoomControls
          setDisplayZoomControls={false}
          // Chỉ hiển thị ảnh tĩnh, không cần chạy script.
          javaScriptEnabled={false}
          scrollEnabled
        />
        <TouchableOpacity
          style={styles.viewerBtn}
          activeOpacity={0.8}
          onPress={onClose}
        >
          <Text style={styles.viewerBtnText}>Đóng</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

function formatDateTime(ms) {
  if (!ms) {
    return '';
  }
  const d = new Date(ms);
  const pad = n => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())} ngày ${pad(
    d.getDate(),
  )}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function formatBytes(bytes) {
  if (!bytes) {
    return '';
  }
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F1F3F5' },
  container: { padding: 14, paddingBottom: 30, gap: 12 },
  title: { fontSize: 20, fontWeight: '700', color: '#212529' },
  spinner: { marginTop: 30 },
  empty: { alignItems: 'center', paddingVertical: 30 },
  emptyEmoji: { fontSize: 40, marginBottom: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#212529' },
  emptyText: {
    fontSize: 14,
    color: '#6C757D',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 16,
    lineHeight: 21,
  },
  emptyWarn: {
    fontSize: 13,
    color: '#dc3545',
    textAlign: 'center',
    marginTop: 14,
    paddingHorizontal: 16,
  },
  bold: { fontWeight: '700', color: '#343A40' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  metaTime: { fontSize: 12, color: '#868e96' },
  metaName: { fontSize: 15, fontWeight: '700', color: '#212529', marginTop: 2 },
  image: {
    width: '100%',
    marginTop: 12,
    borderRadius: 8,
    backgroundColor: '#F1F3F5',
  },
  tapHint: {
    marginTop: 6,
    fontSize: 12,
    color: '#868e96',
    textAlign: 'center',
  },
  doc: {
    marginTop: 12,
    alignItems: 'center',
    backgroundColor: '#F1F3F5',
    borderRadius: 10,
    padding: 14,
  },
  docEmoji: { fontSize: 36 },
  docMeta: { fontSize: 12, color: '#6C757D', marginTop: 2 },
  docBtn: {
    marginTop: 12,
    backgroundColor: '#007b55',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  docBtnText: { color: '#fff', fontWeight: '700' },
  replaceHint: {
    fontSize: 13,
    color: '#868e96',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  deleteBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dc3545',
  },
  deleteBtnText: { color: '#dc3545', fontWeight: '700', fontSize: 15 },
  viewer: { flex: 1, backgroundColor: '#000' },
  viewerWeb: { flex: 1, backgroundColor: '#000' },
  viewerBtn: {
    alignSelf: 'center',
    marginVertical: 18,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fff',
  },
  viewerBtnText: { color: '#fff', fontWeight: '700' },
});
