import { supabase } from '../lib.js';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Pressable,
  Linking,
  ScrollView,
  Alert,
  Platform,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Table, Row } from 'react-native-table-component';
import { useState, useEffect, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
import Clipboard from '@react-native-clipboard/clipboard';

import { getCurrentLocation } from '../../utils/getCurrentLocation.js';

const FLAG_LABELS = {
  ANNINH: 'AN',
  MATUY: 'MT',
  TUTHA: 'TUTHA',
  THACD: 'THACĐ',
  TREHU: 'TEH',
};
const FLAG_KEYS = Object.keys(FLAG_LABELS);

/* ================= TÁCH TOẠ ĐỘ TỪ LINK MAP ================= */
// Thứ tự ưu tiên: toạ độ của địa điểm (!3d!4d, coordinate=, ll=, q=) rồi mới tới
// toạ độ tâm khung nhìn (@lat,lng) vì @ chỉ là vị trí camera, lệch so với điểm ghim.
const COORD_PATTERNS = [
  /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/,
  /coordinate=(-?\d+(?:\.\d+)?)(?:%2C|,)\s*(-?\d+(?:\.\d+)?)/i,
  /[?&](?:ll|sll|center)=(-?\d+(?:\.\d+)?)(?:%2C|,)\s*(-?\d+(?:\.\d+)?)/i,
  /[?&](?:q|daddr|saddr|destination|query)=(-?\d+(?:\.\d+)?)(?:%2C|,)\s*(-?\d+(?:\.\d+)?)/i,
  /\/(?:search|dir|place)\/(-?\d+(?:\.\d+)?),\+?\s*(-?\d+(?:\.\d+)?)/,
  /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
  /(-?\d{1,3}\.\d{3,})\s*,\s*(-?\d{1,3}\.\d{3,})/,
];

// Trong HTML trả về chỉ nhận 2 mẫu chắc chắn là toạ độ, tránh bắt nhầm số linh tinh.
const BODY_PATTERNS = [
  /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/,
  /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
];

const toLocation = (latStr, lngStr) => {
  const lat = parseFloat(latStr);
  const lng = parseFloat(lngStr);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  if (lat === 0 && lng === 0) return null;
  return `${lat}, ${lng}`;
};

const matchCoords = (text, patterns = COORD_PATTERNS) => {
  if (!text) return null;
  let decoded = text;
  try {
    decoded = decodeURIComponent(text);
  } catch {}
  for (const re of patterns) {
    for (const source of decoded === text ? [text] : [text, decoded]) {
      const m = source.match(re);
      const loc = m && toLocation(m[1], m[2]);
      if (loc) return loc;
    }
  }
  return null;
};

// Link rút gọn (maps.app.goo.gl, goo.gl/maps, share.google...) không chứa toạ độ,
// phải gọi mạng để đi theo redirect rồi mới đọc được URL đầy đủ.
const resolveShortLink = async url => {
  const res = await fetch(url, {
    redirect: 'follow',
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
    },
  });
  const finalUrl = res.url || url;
  let body = '';
  try {
    body = (await res.text()).slice(0, 500000);
  } catch {}
  return { finalUrl, body };
};

/**
 * Nhận nội dung vừa copy (link Google/Apple Map, hoặc dán thẳng "lat, lng")
 * và trả về chuỗi "lat, lng" đúng format cột LOCATION.
 */
const extractLocationFromText = async raw => {
  const text = (raw || '').trim();
  if (!text) return null;

  const urlMatch = text.match(/https?:\/\/\S+/i);
  if (!urlMatch) return matchCoords(text); // dán thẳng toạ độ

  const url = urlMatch[0].replace(/[).,]+$/, '');
  const fromUrl = matchCoords(url);
  if (fromUrl) return fromUrl; // link dài đã có sẵn toạ độ, khỏi gọi mạng

  const { finalUrl, body } = await resolveShortLink(url);
  return matchCoords(finalUrl) || matchCoords(body, BODY_PATTERNS);
};

export function Item({ item, index, location }) {
  const navigation = useNavigation();
  const [imageExists, setImageExists] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);
  const [LocationGG, setLocationGG] = useState('');
  const [gettingGPS, setGettingGPS] = useState(false);
  const [resolvingLink, setResolvingLink] = useState(false);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const [savedLocation, setSavedLocation] = useState(item?.LOCATION || null);
  const [showGhiChu, setShowGhiChu] = useState(false);
  /* ================= GHI CHÚ ================= */
  const [ghiChu, setGhiChu] = useState(item?.GHICHU || '');

  const [vangNha, setVangNha] = useState(item?.VANGNHA || false);

  const saveTimeout = useRef(null);

  const onChangeGhiChu = text => {
    setGhiChu(text);
    if (saveTimeout.current) clearTimeout(saveTimeout.current);

    saveTimeout.current = setTimeout(async () => {
      const { error } = await supabase
        .from('crime')
        .update({ GHICHU: text })
        .eq('CCCD', item['CCCD']);

      if (error) console.log('Lỗi lưu GHICHU:', error.message);
    }, 600);
  };

  useEffect(() => {
    return () => saveTimeout.current && clearTimeout(saveTimeout.current);
  }, []);

  /* ================= ẢNH ================= */
  useEffect(() => {
    async function checkImage() {
      const path = `subject/${item['CCCD']}.jpg`;
      const { data } = supabase.storage.from('imageCrime').getPublicUrl(path);
      const url = data.publicUrl;
      try {
        const res = await fetch(url, { method: 'HEAD' });
        if (res.ok) {
          setImageExists(true);
          setImageUrl(url);
        }
      } catch {}
    }
    checkImage();
  }, [item['CCCD']]);

  /* ================= BẢNG TỘI DANH ================= */
  const tableHead = [
    '#',
    'Tội danh',
    'Thời hạn',
    'Ngày bắt',
    'Ngày CH xong',
    'Nơi CH',
  ];
  const widthArr = [40, 150, 80, 80, 100, 100];

  const chargeArr = item['CHARGE']?.split(';') || [];
  const fullInfoCrime = chargeArr.map((_, i) => [
    i + 1,
    item['CHARGE']?.split(';')[i] || '',
    item['JUDGMENT']?.split(';')[i] || '',
    item['DAYARRES']?.split(';')[i] || '',
    item['FREEDAY']?.split(';')[i] || '',
    item['DETENTION']?.split(';')[i] || '',
  ]);

  /* ================= MAP ================= */
  const convertToDMS = (decimal, isLat) => {
    const degrees = Math.floor(Math.abs(decimal));
    const minutesFloat = (Math.abs(decimal) - degrees) * 60;
    const minutes = Math.floor(minutesFloat);
    const seconds = ((minutesFloat - minutes) * 60).toFixed(1);
    const direction = decimal >= 0 ? (isLat ? 'N' : 'E') : isLat ? 'S' : 'W';
    return `${degrees}°${minutes}'${seconds}"${direction}`;
  };

  const convertCoordinates = coordString => {
    const [latStr, lonStr] = coordString.split(',').map(s => s.trim());
    return `${convertToDMS(parseFloat(latStr), true)},${convertToDMS(
      parseFloat(lonStr),
      false,
    )}`;
  };

  // Đọc clipboard. Chưa xử lý gì ở đây để bấm nút là có phản hồi ngay.
  const getCopiedText = async () => {
    const text = (await Clipboard.getString())?.trim();
    if (!text) {
      Alert.alert(
        'Clipboard trống',
        'Mở ' +
          (Platform.OS === 'ios' ? 'Apple' : 'Google') +
          ' Map, chọn địa điểm rồi bấm Chia sẻ / Sao chép liên kết, sau đó quay lại bấm nút này.',
      );
      return;
    }
    setLocationGG(text);
  };

  async function deleteLocation() {
    const { error } = await supabase
      .from('crime')
      .update({ LOCATION: null })
      .eq('CCCD', item['CCCD']);

    if (!error) setSavedLocation(null);
    Alert.alert(error ? 'Cập nhật thất bại' : 'Đã xoá vị trí');
  }

  const pushToSetLocation = async () => {
    if (resolvingLink) return;
    setResolvingLink(true);
    try {
      const toado = await extractLocationFromText(LocationGG);

      if (!toado) {
        Alert.alert(
          'Không đọc được toạ độ',
          'Nội dung đã copy không chứa toạ độ:\n\n' +
            LocationGG.slice(0, 120) +
            '\n\nHãy copy lại liên kết địa điểm trong ' +
            (Platform.OS === 'ios' ? 'Apple' : 'Google') +
            ' Map, hoặc dán trực tiếp dạng "16.0678, 108.2208".',
        );
        setLocationGG('');
        return;
      }

      const saveError = await location({
        CCCD: item['CCCD'],
        location: toado,
      });
      if (saveError) {
        Alert.alert('Lưu thất bại', saveError.message || 'Thử lại sau.');
        return;
      }

      setSavedLocation(toado);
      setLocationGG('');
      Alert.alert('Cập nhật thành công', `Toạ độ: ${toado}`);
    } catch (err) {
      console.log('pushToSetLocation error:', err?.message);
      Alert.alert(
        'Lỗi xử lý liên kết',
        'Không mở được liên kết rút gọn (' +
          (err?.message || 'lỗi không xác định') +
          '). Kiểm tra kết nối mạng rồi thử lại.',
      );
    } finally {
      setResolvingLink(false);
    }
  };

  // Lấy toạ độ GPS nơi đang đứng, không cần mở Google/Apple Map
  const pushCurrentLocation = async () => {
    if (gettingGPS) return;
    setGettingGPS(true);
    setGpsAccuracy(null);
    try {
      const result = await getCurrentLocation({
        onProgress: acc => setGpsAccuracy(acc),
      });
      if (!result) return;

      const saveError = await location({
        CCCD: item['CCCD'],
        location: result.location,
      });
      if (saveError) {
        Alert.alert('Lưu thất bại', saveError.message || 'Thử lại sau.');
        return;
      }

      setSavedLocation(result.location);
      setLocationGG('');
      Alert.alert(
        'Đã lấy vị trí hiện tại',
        `Toạ độ: ${result.location}` +
          (result.accuracy
            ? `\nSai số khoảng ${Math.round(result.accuracy)}m`
            : ''),
      );
    } finally {
      setGettingGPS(false);
      setGpsAccuracy(null);
    }
  };

  const toggleVangNha = async () => {
    const newValue = !vangNha;
    setVangNha(newValue);

    const { error } = await supabase
      .from('crime')
      .update({ VANGNHA: newValue })
      .eq('CCCD', item['CCCD']);

    if (error) console.log('Lỗi cập nhật VANGNHA:', error.message);
  };

  const goToEdit = () => {
    Alert.alert('Thông báo', 'Sửa thông tin đối tượng này?', [
      { text: 'Thoát', style: 'cancel' },
      {
        text: 'Sửa',
        onPress: () => navigation.navigate('editCrime', { item }),
      },
    ]);
  };

  /* ================= UI ================= */
  return (
    <View
      style={{ ...styles.card, backgroundColor: vangNha ? '#FFCDD2' : 'white' }}
    >
      {/* Vùng nhấn giữ để sửa (không bao gồm bảng tội danh để bảng vuốt được) */}
      <Pressable onLongPress={goToEdit} delayLongPress={350}>
        {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.name}>
          {index}. {item['HOTEN']}
        </Text>
        <Text style={styles.cccd}>{item['CCCD']}</Text>
      </View>

      {/* INFO + IMAGE */}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Text style={styles.infoText}>Tên khác: {item['TENKHAC']}</Text>
          <Text style={styles.infoText}>Ngày sinh: {item['NAMSINH']}</Text>
          <Text style={styles.infoText}>
            Giới tính: {item['GIOITINH'] ? 'Nam' : 'Nữ'}
          </Text>
          <Text style={styles.infoText}>Dân tộc: {item['DANTOC']}</Text>
          <Text style={styles.infoText}>Tôn giáo: {item['TONGIAO']}</Text>
          <Text style={styles.infoText}>Cha: {item['TENCHA']}</Text>
          <Text style={styles.infoText}>Mẹ: {item['TENME']}</Text>
          <Text style={styles.infoText}>
            {item['GIOITINH'] ? 'Vợ' : 'Chồng'}: {item['TENVO']}
          </Text>
          <Text style={styles.infoText}>Địa chỉ: {item['NOITHTRU']}</Text>
            { item['LINKFOLDER'] && 
             <TouchableOpacity
              onPress={() =>
                Linking.openURL(item['LINKFOLDER'])
              }
            >
              <Text style={{ fontWeight: '600' ,color: '#ff0000', marginBottom: 3 }}>
                📂 Thư mục hồ sơ (thêm/sửa ảnh)
              </Text>
            </TouchableOpacity>
            }
          <TouchableOpacity onPress={toggleVangNha}>
            <Text style={{ ...styles.infoText, fontWeight: 'bold',marginBottom: 3  }}>
              Vắng nhà: {item['VANGNHA'] ? 'VẮNG' : 'KHÔNG'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ flex: 1 }}>
          <TouchableOpacity onPress={() => setShowGhiChu(prev => !prev)}>
            <Image
              source={
                imageExists
                  ? { uri: imageUrl }
                  : require('../../asset/unknow.jpg')
              }
              style={styles.image}
            />
          </TouchableOpacity>

          {/* Phân loại đối tượng */}
          <View style={styles.flagWrap}>
            {FLAG_KEYS.filter(f => item[f]).length === 0 ? (
              <Text style={styles.flagNone}>Chưa phân loại</Text>
            ) : (
              FLAG_KEYS.filter(f => item[f]).map(f => (
                <View key={f} style={styles.flagBadge}>
                  <Text style={styles.flagBadgeText}>{FLAG_LABELS[f]}</Text>
                </View>
              ))
            )}
          </View>
        </View>
      </View>
      </Pressable>

      {/* VỊ TRÍ - hàng ngang phía trên bảng tội danh.
          Đặt ngoài <Pressable> để giữ lâu không bật hộp thoại sửa đối tượng. */}
      <View style={styles.locationRow}>
        {savedLocation ? (
          <TouchableOpacity
            style={[styles.locationBtn, { backgroundColor: '#0D6EFD' }]}
            onPress={() =>
              Linking.openURL(
                `https://www.google.com/maps/place/${convertCoordinates(
                  savedLocation,
                )}`,
              )
            }
            onLongPress={() =>
              Alert.alert('Thông báo', 'Bạn có muốn xoá vị trí không?', [
                { text: 'Thoát', style: 'cancel' },
                { text: 'Xoá', onPress: deleteLocation },
              ])
            }
          >
            <Text style={styles.locationBtnText}>
              📍 Xem vị trí (giữ để xoá)
            </Text>
          </TouchableOpacity>
        ) : (
          <>
            {!LocationGG ? (
              <TouchableOpacity
                style={[styles.locationBtn, { backgroundColor: '#0D6EFD' }]}
                onPress={getCopiedText}
              >
                <Text style={styles.locationBtnText}>
                  🗺️ Lấy từ {Platform.OS === 'ios' ? 'Apple' : 'Google'} Map
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[
                  styles.locationBtn,
                  { backgroundColor: resolvingLink ? '#6C757D' : '#1ed206ff' },
                ]}
                disabled={resolvingLink}
                onPress={pushToSetLocation}
              >
                {resolvingLink ? (
                  <>
                    <ActivityIndicator size="small" color="white" />
                    <Text style={styles.locationBtnText}>Đang đọc link...</Text>
                  </>
                ) : (
                  <Text style={styles.locationBtnText}>
                    ✓ Gửi địa chỉ đã copy
                  </Text>
                )}
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.locationBtn,
                { backgroundColor: gettingGPS ? '#6C757D' : '#FD7E14' },
              ]}
              disabled={gettingGPS}
              onPress={pushCurrentLocation}
            >
              {gettingGPS ? (
                <>
                  <ActivityIndicator size="small" color="white" />
                  <Text style={styles.locationBtnText}>
                    {gpsAccuracy
                      ? `Đang định vị ±${Math.round(gpsAccuracy)}m`
                      : 'Đang định vị...'}
                  </Text>
                </>
              ) : (
                <Text style={styles.locationBtnText}>
                  🎯 Vị trí đang đứng
                </Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* BẢNG TỘI DANH */}
      <View style={{ marginTop: 8 }}>
        <ScrollView
          horizontal
          nestedScrollEnabled={true}
          directionalLockEnabled={true}
          showsHorizontalScrollIndicator={true}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 4 }}
        >
          <Table borderStyle={{ borderWidth: 1, borderColor: '#ADB5BD' }}>
            <Row
              data={tableHead}
              widthArr={widthArr}
              style={{ backgroundColor: '#E9ECEF' }}
              textStyle={{
                fontWeight: 'bold',
                fontSize: 12,
                textAlign: 'center',
              }}
            />
            {fullInfoCrime.map((row, i) => (
              <Row
                key={i}
                data={row}
                widthArr={widthArr}
                textStyle={{ fontSize: 11, textAlign: 'center' }}
              />
            ))}
          </Table>
        </ScrollView>
      </View>

      {/* GHI CHÚ */}
      {showGhiChu && (
        <View style={{ marginTop: 10 }}>
          <TextInput
            value={ghiChu}
            onChangeText={onChangeGhiChu}
            autoCapitalize={'characters'}
            placeholder="Nhập ghi chú..."
            multiline
            style={{
              minHeight: 90,
              borderWidth: 1,
              borderColor: '#CED4DA',
              borderRadius: 8,
              padding: 10,
              fontSize: 13,
              backgroundColor: '#F8F9FA',
              textAlignVertical: 'top',
            }}
          />
        </View>
      )}
    </View>
  );
}

/* ================= STYLE ================= */
const styles = {
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DEE2E6',
    marginVertical: 8,
    padding: 12,
    elevation: 3,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between' },
  name: { fontWeight: 'bold', color: '#0D6EFD' },
  cccd: { fontSize: 12, color: '#6C757D' },
  infoText: { fontSize: 13, color: '#495057', marginBottom: 3 },
  image: {
    width: '100%',
    height: 210,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CED4DA',
  },
  flagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
    justifyContent: 'center',
  },
  flagBadge: {
    backgroundColor: '#DC3545',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  flagBadgeText: { color: 'white', fontSize: 11, fontWeight: '700' },
  flagNone: { color: '#ADB5BD', fontSize: 12, fontStyle: 'italic' },
  noteInput: {
    minHeight: 90,
    borderWidth: 1,
    borderColor: '#CED4DA',
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    backgroundColor: '#F8F9FA',
    textAlignVertical: 'top',
  },
  mapBtn: {
    backgroundColor: '#0D6EFD',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 6,
  },
  mapBtnText: { color: 'white', fontWeight: '600', fontSize: 14 },
  locationRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  locationBtn: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    height: 38,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationBtnText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 13,
    textAlign: 'center',
  },
};
