import { Platform, PermissionsAndroid, Linking, Alert } from 'react-native';
import Geolocation from '@react-native-community/geolocation';

// Android: bắt buộc 'playServices' -> dùng FusedLocationProvider (gộp GPS + wifi + cell,
// trả toạ độ cache gần như tức thì). Để 'auto' module sẽ rơi về LocationManager thuần,
// chỉ nghe GPS_PROVIDER nên trong nhà/khu đông nhà phải chờ 30-60s mới có fix đầu tiên.
Geolocation.setRNConfiguration({
  skipPermissionRequests: false,
  authorizationLevel: 'whenInUse',
  locationProvider: Platform.OS === 'android' ? 'playServices' : 'auto',
});

// Sai số (m) coi là "đủ tốt" -> trả kết quả ngay, không chờ thêm.
const DESIRED_ACCURACY = 30;
// Thời gian tối đa chờ toạ độ tốt hơn (ms).
const DEFAULT_TIMEOUT = 15000;
// Cho phép dùng lại toạ độ đã có trong vòng 60s -> có kết quả ngay lần bấm đầu.
const DEFAULT_MAX_AGE = 60000;

async function requestLocationPermission() {
  if (Platform.OS !== 'android') return true;

  try {
    // Android 12+ người dùng có thể chỉ cho "vị trí gần đúng" (chỉ COARSE được cấp),
    // lúc đó vẫn định vị được nên chấp nhận 1 trong 2 quyền.
    const res = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
    ]);

    const fine = res[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION];
    const coarse = res[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION];
    const granted = PermissionsAndroid.RESULTS.GRANTED;

    if (fine === granted || coarse === granted) return true;

    if (
      fine === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN ||
      coarse === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN
    ) {
      Alert.alert(
        'Chưa có quyền vị trí',
        'Bạn đã từ chối quyền vị trí. Mở cài đặt để bật lại?',
        [
          { text: 'Huỷ', style: 'cancel' },
          { text: 'Mở cài đặt', onPress: () => Linking.openSettings() },
        ],
      );
    }

    return false;
  } catch (err) {
    console.warn('requestLocationPermission', err);
    return false;
  }
}

const accuracyOf = position => position?.coords?.accuracy ?? Number.MAX_VALUE;

/**
 * Theo dõi vị trí và trả về toạ độ tốt nhất lấy được:
 *  - dừng ngay khi sai số <= desiredAccuracy
 *  - hết timeout thì trả toạ độ tốt nhất đã nhận (thay vì báo lỗi như getCurrentPosition)
 */
function watchBestPosition({ desiredAccuracy, timeout, maximumAge, onProgress }) {
  return new Promise(resolve => {
    let best = null;
    let lastError = null;
    let watchId = null;
    let finished = false;

    const finish = () => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      if (watchId !== null) {
        Geolocation.clearWatch(watchId);
        watchId = null;
      }
      resolve({ position: best, error: best ? null : lastError });
    };

    const timer = setTimeout(finish, timeout);

    watchId = Geolocation.watchPosition(
      position => {
        if (!best || accuracyOf(position) < accuracyOf(best)) best = position;
        onProgress && onProgress(accuracyOf(best));
        if (accuracyOf(best) <= desiredAccuracy) finish();
      },
      error => {
        // Fused hay bắn POSITION_UNAVAILABLE lúc chưa có fix -> chỉ ghi nhận,
        // vẫn chờ tiếp cho tới khi hết timeout.
        console.warn('watchPosition', error);
        lastError = error;
      },
      {
        enableHighAccuracy: true,
        distanceFilter: 0,
        interval: 1000,
        fastestInterval: 1000,
        maximumAge,
        timeout,
      },
    );
  });
}

/**
 * Lấy toạ độ GPS tại vị trí hiện tại (không cần Google Map).
 * @param {{desiredAccuracy?: number, timeout?: number, maximumAge?: number,
 *          onProgress?: (accuracy: number) => void}} [options]
 * @returns {Promise<{location: string, accuracy: number}|null>}
 *          location dạng "lat, lng" - đúng format cột LOCATION trong supabase.
 */
export async function getCurrentLocation(options = {}) {
  const {
    desiredAccuracy = DESIRED_ACCURACY,
    timeout = DEFAULT_TIMEOUT,
    maximumAge = DEFAULT_MAX_AGE,
    onProgress,
  } = options;

  const ok = await requestLocationPermission();
  if (!ok) {
    Alert.alert('Lỗi', 'Không có quyền truy cập vị trí');
    return null;
  }

  const { position, error } = await watchBestPosition({
    desiredAccuracy,
    timeout,
    maximumAge,
    onProgress,
  });

  if (!position) {
    Alert.alert(
      'Không lấy được vị trí',
      error?.code === 3 || !error
        ? 'Quá thời gian chờ tín hiệu GPS. Vui lòng ra chỗ thoáng, bật Định vị (độ chính xác cao) rồi thử lại.'
        : error?.message || 'Vui lòng bật GPS/Định vị rồi thử lại.',
    );
    return null;
  }

  const { latitude, longitude, accuracy } = position.coords;
  return {
    location: `${latitude}, ${longitude}`,
    accuracy: accuracy ?? null,
  };
}

export default getCurrentLocation;
