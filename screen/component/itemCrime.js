import { supabase } from '../lib.js';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Linking,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { Table, Row } from 'react-native-table-component';
import { useState, useEffect } from 'react';
import Clipboard from '@react-native-clipboard/clipboard';

export function Item({ item, index, location }) {
  const [imageExists, setImageExists] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);
  const [LocationGG, setLocationGG] = useState('');

  const tableHead = [
    '#',
    'Tội danh',
    'Thời hạn',
    'Ngày bắt',
    'Ngày CH xong',
    'Nơi CH',
  ];
  const widthArr = [40, 150, 80, 80, 100, 100];

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
        } else setImageExists(false);
      } catch {
        setImageExists(false);
      }
    }
    checkImage();
  }, [item['CCCD']]);

  // Chuyển chuỗi tội danh thành mảng dữ liệu
  const chargeArr = item['CHARGE']?.split(';') || [];
  const fullInfoCrime = chargeArr.map((_, i) => [
    i + 1,
    item['CHARGE']?.split(';')[i] || '',
    item['JUDGMENT']?.split(';')[i] || '',
    item['DAYARRES']?.split(';')[i] || '',
    item['FREEDAY']?.split(';')[i] || '',
    item['DETENTION']?.split(';')[i] || '',
  ]);

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
    const lat = parseFloat(latStr);
    const lon = parseFloat(lonStr);
    return `${convertToDMS(lat, true)},${convertToDMS(lon, false)}`;
  };

  const getCoordsFromShortLink = async shortUrl => {
    console.log('getCoordsFromShortLink');

    const response = await fetch(shortUrl, { redirect: 'follow' });
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

  const extractLatLngFromGoogleMapsUrl = async url => {
    let result = await getCoordsFromShortLink(url);
    console.log('result1', result);

    // console.log('result.finalUrl', result.finalUrl);

    const match = result.finalUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);

    if (match) return `${parseFloat(match[1])}, ${parseFloat(match[2])}`;
    return result.location;
  };

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

  const getCopiedText = async () => {
    const text = await Clipboard.getString();
    setLocationGG(text);
  };

  async function deleteLocation() {
    const { data, error } = await supabase
      .from('crime')
      .update({ LOCATION: null }) // giá trị mới
      .eq('CCCD', item['CCCD']); // điều kiện cập nhật

    if (error) {
      Alert.alert('Cập nhật thất bại', 'Vui lòng thử lại');
    } else {
      Alert.alert('Cập nhật thành công', 'Vui lòng đợi đồng bộ thông tin');
    }
  }

  return (
    <View
      style={{
        backgroundColor: 'white',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#DEE2E6',
        marginVertical: 8,
        padding: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
      }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: 8,
          // backgroundColor:'red'
        }}
      >
        <Text style={{ fontWeight: 'bold', color: '#0D6EFD' }}>
          {index}. {item['HOTEN']}
        </Text>
        <Text style={{ color: '#6C757D', fontSize: 12 }}>{item['CCCD']}</Text>
      </View>

      {/* Thông tin + ảnh */}
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
          <Text style={styles.infoText}>{item['GIOITINH'] ? 'Vợ:':'Chồng:'} {item['TENVO']}</Text>
          <Text style={styles.infoText}>Địa chỉ: {item['NOITHTRU']}</Text>
          {/* <Text style={styles.infoText}>CCCD: {item['CCCD']}</Text> */}
          {item['LOCATION'] ? (
            <TouchableOpacity
              style={{ marginTop: 6 }}
              onPress={() =>
                Linking.openURL(
                  `https://www.google.com/maps/place/${convertCoordinates(
                    item['LOCATION'],
                  )}`,
                )
              }
              onLongPress={() => {
                Alert.alert('Thông báo', 'Bạn có muốn xóa vị trí không?', [
                  {
                    text: 'Thoát',
                    style: 'cancel',
                  },
                  {
                    text: 'Xoá',
                    onPress: () => {
                      deleteLocation();
                    },
                  },
                ]);
              }}
            >
              <Text style={{ color: '#0D6EFD', fontWeight: '600' }}>
                📍 Xem vị trí trên bản đồ
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

        <View style={{ flex: 1, alignItems: 'center' }}>
          <Image
            source={
              imageExists
                ? { uri: imageUrl }
                : require('../../asset/unknow.jpg')
            }
            style={{
              width: '100%',
              height: 210,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: '#CED4DA',
            }}
            resizeMode="cover"
          />
        </View>
      </View>

      {/* Bảng tội danh */}
      <View style={{ marginTop: 12 }}>
        <ScrollView horizontal>
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
            {fullInfoCrime.map((rowData, i) => (
              <Row
                key={i}
                data={rowData}
                widthArr={widthArr}
                style={{
                  backgroundColor:
                    rowData[1].includes('?') || rowData[4].includes('?')
                      ? '#FFF3CD'
                      : i % 2
                      ? '#F8F9FA'
                      : 'white',
                }}
                textStyle={{ fontSize: 11, textAlign: 'center' }}
              />
            ))}
          </Table>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = {
  infoText: {
    fontSize: 13,
    color: '#495057',
    marginBottom: 3,
  },
  // input: {
  //   marginTop: 6,
  //   height: 38,
  //   width: '100%',
  //   borderWidth: 1,
  //   borderColor: '#CED4DA',
  //   borderRadius: 8,
  //   paddingHorizontal: 8,
  //   fontSize: 12,
  //   backgroundColor: '#F8F9FA',
  // },
};
