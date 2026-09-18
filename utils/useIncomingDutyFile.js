import { useEffect, useRef } from 'react';
import { Alert, AppState } from 'react-native';
import { addFileSharedListener, takePendingFile } from './sharedFileService';
import { loadSchedule, saveSharedFile } from './dutySchedule';

/**
 * Nhận tệp lịch trực người dùng chia sẻ từ Zalo, bất kể lúc đó app đang ở màn
 * hình nào.
 *
 * Có ba đường tệp đi vào, nên phải bắt cả ba:
 *  - App mở từ đầu bằng chính tệp đó  -> hỏi native ngay lúc gắn hook.
 *  - App đang chạy, người dùng chia sẻ thêm  -> sự kiện `onFileShared`.
 *  - App bị treo ở nền lúc tệp tới  -> kiểm tra lại mỗi khi quay ra tiền cảnh.
 *
 * Cả ba đều gọi cùng một hàm và native chỉ trả tệp đúng một lần, nên trùng
 * nhau cũng không nhận lại hai lần.
 */
export function useIncomingDutyFile(onImported) {
  const onImportedRef = useRef(onImported);
  onImportedRef.current = onImported;

  useEffect(() => {
    let alive = true;
    let busy = false;

    const importPending = async () => {
      if (busy) {
        return;
      }
      busy = true;
      try {
        const file = await takePendingFile();
        if (file && alive) {
          await saveSharedFile(file);
          onImportedRef.current?.();
        }
      } catch (e) {
        console.log('Không nhận được tệp lịch trực:', e.message);
        Alert.alert('Lỗi', 'Không nhận được tệp vừa chia sẻ. Vui lòng thử lại.');
      } finally {
        busy = false;
      }
    };

    // Đọc bản đang giữ trước, rồi mới nhận tệp mới: làm song song thì bản cũ
    // đọc xong sau có thể đè lên bản vừa nhận.
    loadSchedule().then(importPending);

    const removeListener = addFileSharedListener(importPending);
    const appStateSub = AppState.addEventListener('change', state => {
      if (state === 'active') {
        importPending();
      }
    });

    return () => {
      alive = false;
      removeListener();
      appStateSub.remove();
    };
  }, []);
}
