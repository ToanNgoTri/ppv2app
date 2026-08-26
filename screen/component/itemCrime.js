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
} from 'react-native';
import { Table, Row } from 'react-native-table-component';
import { useState, useEffect, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
import Clipboard from '@react-native-clipboard/clipboard';

const FLAG_LABELS = {
  ANNINH: 'An ninh',
  MATUY: 'Ma túy',
  TUTHA: 'Tù tha',
  THACD: 'THA CĐ',
};
const FLAG_KEYS = Object.keys(FLAG_LABELS);

export function Item({ item, index, location }) {
  const navigation = useNavigation();
  const [imageExists, setImageExists] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);
  const [LocationGG, setLocationGG] = useState('');
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

  const getCopiedText = async () => {
    const text = await Clipboard.getString();
    setLocationGG(text);
  };

  async function deleteLocation() {
    const { error } = await supabase
      .from('crime')
      .update({ LOCATION: null })
      .eq('CCCD', item['CCCD']);

    Alert.alert(error ? 'Cập nhật thất bại' : 'Đã xoá vị trí');
  }

  const pushToSetLocation = async () => {
    const toado = await extractLatLngFromGoogleMapsUrl(LocationGG);
    // console.log('toado', toado);

    if (!toado) {
      Alert.alert(
        'Lỗi',
        'Không tìm thấy tọa độ trong liên kết ' +
          (Platform.OS === 'ios' ? 'Apple' : 'Google') +
          ' Map',
      );
      setLocationGG('');
      return;
    }

    location({ CCCD: item['CCCD'], location: toado });
    setLocationGG('');
    Alert.alert('Cập nhật thành công', 'Vui lòng đợi đồng bộ thông tin');
  };

  const extractLatLngFromGoogleMapsUrl = async url => {
    let result = await getCoordsFromShortLink(url);
    console.log('result1', result);

    // console.log('result.finalUrl', result.finalUrl);

    const match = result.finalUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);

    if (match) return `${parseFloat(match[1])}, ${parseFloat(match[2])}`;
    return result.location;
  };

  const getCoordsFromShortLink = async shortUrl => {
    console.log('getCoordsFromShortLink');

try {
  const response = await fetch(shortUrl, { redirect: 'follow' });
  console.log('finalUrl', response.url);
} catch (err) {
  console.log('fetch error:', err.message); // sẽ thấy CORS error ở đây
  return { finalUrl: shortUrl }; // trả về URL gốc nếu có lỗi
}
    const finalUrl = response.url;
    console.log('finalUrl', finalUrl);

    let match = finalUrl.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
    if (!match) {
      match = finalUrl.match(/coordinate=(\d+\.\d+)%2C(-?\d+\.\d+)/);
    }
    console.log('match1', match);

    if (!match) return { finalUrl };
    return {
      location: `${parseFloat(match[1])}, ${parseFloat(match[2])}`,
      finalUrl,
    };
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
                Xem thư mục hồ sơ
              </Text>
            </TouchableOpacity>
            }
          <TouchableOpacity onPress={toggleVangNha}>
            <Text style={{ ...styles.infoText, fontWeight: 'bold',marginBottom: 3  }}>
              Vắng nhà: {item['VANGNHA'] ? 'VẮNG' : 'KHÔNG'}
            </Text>
          </TouchableOpacity>
          {item['LOCATION'] ? (
            <TouchableOpacity
              onPress={() =>
                Linking.openURL(
                  `https://www.google.com/maps/place/${convertCoordinates(
                    item['LOCATION'],
                  )}`,
                )
              }
              onLongPress={deleteLocation}
            >
              <Text style={{ color: '#0D6EFD', fontWeight: '600' }}>
                📍 Xem vị trí
              </Text>
            </TouchableOpacity>
          ) : !LocationGG ? (
            <TouchableOpacity
              style={{
                backgroundColor: '#0D6EFD',
                paddingVertical: 8,
                paddingHorizontal: 16,
                borderRadius: 8,
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onPress={getCopiedText}
            >
              <Text style={{ color: 'white', fontWeight: '600', fontSize: 14 }}>
                Nhận địa chỉ từ {Platform.OS === 'ios' ? 'Apple' : 'Google'} Map
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={{
                backgroundColor: '#1ed206ff',
                paddingVertical: 8,
                paddingHorizontal: 16,
                borderRadius: 8,
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onPress={pushToSetLocation}
            >
              <Text style={{ color: 'white', fontWeight: '600', fontSize: 14 }}>
                Gửi
              </Text>
            </TouchableOpacity>
          )}
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

      {/* BẢNG TỘI DANH */}
      <View style={{ marginTop: 12 }}>
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
};
