import AsyncStorage from '@react-native-async-storage/async-storage';
import * as RNFS from '@dr.pogodin/react-native-fs';

/**
 * Bản lịch trực đang giữ trên máy.
 *
 * App không tự phát lịch trực: cán bộ nhận tệp trong nhóm Zalo rồi chia sẻ sang
 * app, nên mọi thứ nằm gọn trong máy — không cần mạng, không đụng Supabase.
 *
 * Chỉ giữ ĐÚNG MỘT bản: tệp mới chia sẻ sang sẽ thay thế bản cũ, y như cách
 * nhóm Zalo chỉ dùng bản lịch mới nhất. Tệp nằm ở `Documents/lich-truc/`, còn
 * thông tin mô tả nằm trong AsyncStorage.
 */

const META_KEY = 'dutySchedule.v1';
const DIR = `${RNFS.DocumentDirectoryPath}/lich-truc`;

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif', 'bmp'];

/**
 * Tệp tải từ Zalo rất hay mang kiểu application/octet-stream vì Zalo không đoán
 * được kiểu từ đuôi tên. Giữ nguyên kiểu đó thì lúc mở, hệ điều hành không biết
 * gọi ứng dụng nào, nên đoán lại theo đuôi tệp.
 */
const MIME_BY_EXTENSION = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  heic: 'image/heic',
  heif: 'image/heif',
  bmp: 'image/bmp',
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

function extensionOf(file) {
  return (file.name || '').split('.').pop().toLowerCase();
}

function mimeTypeOf(file) {
  const declared = file.mimeType || '';
  if (declared && declared !== 'application/octet-stream') {
    return declared;
  }
  return MIME_BY_EXTENSION[extensionOf(file)] || declared;
}

let current = null;
let loaded = false;
const listeners = new Set();

function notify() {
  listeners.forEach(listener => listener(current));
}

/** Nghe thay đổi của bản lịch trực. Trả về hàm huỷ đăng ký. */
export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Bản đang giữ trong bộ nhớ, null nếu chưa có (hoặc chưa gọi `loadSchedule`). */
export function getSchedule() {
  return current;
}

/** Ảnh thì xem ngay trong app, còn Word/PDF phải nhờ ứng dụng ngoài mở. */
function kindOf(file) {
  if (mimeTypeOf(file).startsWith('image/')) {
    return 'image';
  }
  return IMAGE_EXTENSIONS.includes(extensionOf(file)) ? 'image' : 'document';
}

/**
 * Trang xem ảnh toàn màn hình, đặt cạnh chính tấm ảnh.
 *
 * Phải là một tệp HTML thật chứ không phải chuỗi html truyền vào WebView: ảnh
 * nằm trên máy nên trang cần cùng thư mục với ảnh thì mới được phép đọc nó.
 * Dùng WebView vì maximumZoomScale của ScrollView CHỈ chạy trên iOS — WebView
 * thì cả hai nền tảng đều có sẵn thao tác chụm và chạm đôi để phóng to.
 */
async function writeViewerPage(imageFileName) {
  const path = `${DIR}/xem.html`;
  const html = `<!doctype html><html><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=6">
<style>
  html,body{margin:0;height:100%;background:#000}
  img{width:100%;height:100%;object-fit:contain;display:block}
</style></head>
<body><img src="${encodeURIComponent(imageFileName)}"></body></html>`;
  await RNFS.writeFile(path, html, 'utf8');
  return path;
}

/**
 * Đọc bản đang giữ từ bộ nhớ máy. Nếu tệp đã bị dọn mất (người dùng xoá dữ liệu
 * app, hệ điều hành dọn chỗ) thì coi như chưa có lịch trực.
 */
export async function loadSchedule() {
  if (loaded) {
    return current;
  }
  loaded = true;
  try {
    const raw = await AsyncStorage.getItem(META_KEY);
    if (!raw) {
      return null;
    }
    const meta = JSON.parse(raw);
    // Trong lúc chờ đọc, app có thể vừa nhận tệp mới từ Zalo. Khi đó bản trong
    // bộ nhớ mới là bản đúng, còn `meta` vừa đọc trỏ vào tệp đã bị thay.
    if (current !== null) {
      return current;
    }
    if (!(await RNFS.exists(meta.path))) {
      await AsyncStorage.removeItem(META_KEY);
      return null;
    }
    current = meta;
  } catch (e) {
    console.log('Không đọc được lịch trực đã lưu:', e.message);
  }
  notify();
  return current;
}

/**
 * Nhận tệp vừa chia sẻ sang làm bản lịch trực hiện hành, THAY THẾ bản cũ.
 *
 * Tệp đang nằm trong cache — nơi hệ điều hành có quyền dọn bất cứ lúc nào — nên
 * phải chuyển sang thư mục dữ liệu của app trước khi ghi nhận.
 */
export async function saveSharedFile(file) {
  if (await RNFS.exists(DIR)) {
    await RNFS.unlink(DIR);
  }
  await RNFS.mkdir(DIR);

  // Tên tệp trong cache đã được phía native bỏ dấu và lọc ký tự lạ; thêm dấu
  // thời gian để không đụng tên nhau khi chưa kịp dọn.
  const fileName = `${Date.now()}-${file.path.split('/').pop()}`;
  const target = `${DIR}/${fileName}`;
  try {
    await RNFS.moveFile(file.path, target);
  } catch (e) {
    // Vài máy không cho di chuyển thẳng giữa cache và thư mục dữ liệu.
    await RNFS.copyFile(file.path, target);
    await RNFS.unlink(file.path).catch(() => {});
  }

  const kind = kindOf(file);
  const meta = {
    path: target,
    name: file.name,
    mimeType: mimeTypeOf(file),
    size: file.size || 0,
    kind,
    viewerPath: kind === 'image' ? await writeViewerPage(fileName) : null,
    receivedAt: Date.now(),
  };
  await AsyncStorage.setItem(META_KEY, JSON.stringify(meta));
  current = meta;
  loaded = true;
  notify();
  return meta;
}

/** Gỡ hẳn bản lịch trực đang giữ. */
export async function deleteSchedule() {
  await AsyncStorage.removeItem(META_KEY);
  if (await RNFS.exists(DIR)) {
    await RNFS.unlink(DIR).catch(() => {});
  }
  current = null;
  notify();
}
