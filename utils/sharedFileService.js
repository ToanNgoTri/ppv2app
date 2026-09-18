/**
 * Lớp mỏng bọc module nhận tệp chia sẻ native.
 *
 * Module sống trong chính app (android/app/.../sharedfile, ios/ppv2/
 * SharedFile.mm) nên bản JS chạy trên một bản build cũ sẽ không có nó. Vì vậy
 * mọi thứ ở đây phải chịu được trường hợp không có native: `isSupported()` trả
 * về false và màn hình Lịch trực chỉ việc báo là bản cài đặt này chưa nhận được
 * tệp từ Zalo.
 */
let Native = null;
try {
  Native = require('../specs/NativeSharedFile').default;
} catch (e) {
  Native = null;
}

/** Bản build hiện tại có module native không. */
export function isSupported() {
  return Native != null;
}

/**
 * Lấy tệp đang chờ (nếu app vừa được mở bằng một tệp chia sẻ) và đánh dấu đã
 * nhận. Trả về null khi không có gì — đây là trường hợp thường gặp nhất, mỗi
 * lần mở app đều gọi một lần.
 */
export async function takePendingFile() {
  if (!Native) {
    return null;
  }
  try {
    return await Native.takePendingFile();
  } catch (e) {
    console.log('Không đọc được tệp chia sẻ:', e.message);
    return null;
  }
}

/** Nhờ hệ điều hành mở tệp. Ném lỗi nếu máy không có ứng dụng nào mở được. */
export async function openWithSystemViewer(path, mimeType) {
  if (!Native) {
    throw new Error('Bản cài đặt này chưa mở được tệp');
  }
  await Native.openWithSystemViewer(path, mimeType || '');
}

/**
 * Nghe sự kiện "vừa có tệp mới chia sẻ sang" (app đang chạy sẵn). Trả về hàm gỡ
 * listener — gọi trong cleanup của useEffect.
 */
export function addFileSharedListener(handler) {
  if (!Native || !Native.onFileShared) {
    return () => {};
  }
  const subscription = Native.onFileShared(handler);
  return () => subscription.remove();
}
