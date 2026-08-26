import {
  View,
  Text,
  Linking,
  Alert,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from 'react-native';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRoute } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import Clipboard from '@react-native-clipboard/clipboard';

import { supabase } from '../lib.js';

function ItemPopulation({ item, index, location }) {
  const route = useRoute();
  const navigation = useNavigation();

  const [LocationGG, setLocationGG] = useState('');

  const [ghiChu, setGhiChu] = useState(item?.GHICHU || '');
  const [vangNha, setVangNha] = useState(item?.VANGNHA || false);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [phone, setPhone] = useState(item?.SDT || '');
  const saveTimeout = useRef(null);

  const isSelected = route?.params?.CCCD === item['CCCD'];
  const isEven = index % 2 === 0;

  useEffect(() => {
    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
  }, []);

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
    console.log('Copied text:', text);
    setLocationGG(text);
  };

  async function deleteLocation() {
    const { error } = await supabase
      .from('population')
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
    console.log('shortUrl', shortUrl);
    const response = await fetch(shortUrl, { redirect: 'follow' });

    const finalUrl = response.url;
    console.log('response', response);

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

  const onChangeGhiChu = text => {
    setGhiChu(text);
    if (saveTimeout.current) clearTimeout(saveTimeout.current);

    saveTimeout.current = setTimeout(async () => {
      const { error } = await supabase
        .from('population')
        .update({ GHICHU: text })
        .eq('CCCD', item['CCCD']);

      if (error) console.log('Lỗi lưu GHICHU:', error.message);
    }, 600);
  };

  const toggleVangNha = async () => {
    const newValue = !vangNha;
    setVangNha(newValue);

    const { error } = await supabase
      .from('population')
      .update({ VANGNHA: newValue })
      .eq('CCCD', item['CCCD']);

    if (error) console.log('Lỗi cập nhật VANGNHA:', error.message);
  };

  const callPhone = phone => {
    if (!phone) return;
    Linking.openURL(`tel:${phone}`);
  };
  return (
    <TouchableOpacity
      style={{
        backgroundColor: item['CRIMINALRECORD']
          ? '#90CAF9'
          : vangNha
          ? '#FFCDD2'
          : isSelected
          ? '#FFD580'
          : isEven
          ? '#F8F9FA'
          : '#E9ECEF',
        marginVertical: 6,
        padding: 14,
        borderRadius: 12,
        borderWidth: isSelected ? 2 : 1,
        borderColor: isSelected ? '#FFA500' : '#CED4DA',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
      }}
      onLongPress={() => {
        Alert.alert(
          'Thông báo',
          'Bạn có muốn cập nhật thông tin công dân?',
          [
            {
              text: 'Thoát',
              style: 'cancel',
            },
            {
              text: 'Thao tác',
              onPress: () => {
                Alert.alert(
                  'Chọn chức năng',
                  '',
                  [
                    {
                      text: 'Thêm đối tượng',
                      onPress: () => {
                        navigation.push('addCrime', { data: item });
                      },
                    },
                    {
                      text: `${item['VANGNHA'] ? 'Bỏ' : 'Đánh dấu'} vắng nhà`,
                      onPress: toggleVangNha,
                    },
                    {
                      text: 'Cập nhật SĐT',
                      onPress: () => {
                        setPhone(item?.SDT || '');
                        setIsEditingPhone(true);
                      },
                    },
                  ],
                  { cancelable: true },
                  { cancelAnimationFrame: true },
                );
              },
            },
          ],
          { cancelable: true },
          { cancelAnimationFrame: true },
        );
      }}
    >
      {/* Dòng trên cùng: STT + Quan hệ */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: 6,
        }}
      >
        <Text style={{ fontSize: 12, color: '#6C757D' }}>STT: {index + 1}</Text>

        <Text
          style={{
            fontSize: 13,
            fontWeight: item['QUANHE'] === 'CH' ? '700' : '500',
            color: item['QUANHE'] === 'CH' ? '#B71C1C' : '#495057',
            backgroundColor:
              item['QUANHE'] === 'CH' ? '#FFF176' : 'transparent',
            paddingHorizontal: 8,
            borderRadius: 6,
          }}
        >
          Quan hệ: {item['QUANHE']}
        </Text>
      </View>

      {/* Họ và tên */}
      <Text
        style={{
          fontSize: 16,
          fontWeight: '700',
          color: '#212529',
          marginBottom: 4,
        }}
      >
        {item['HOTEN']}
      </Text>

      {/* Các thông tin chi tiết */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        <Text style={styles.infoText}>Ngày sinh: {item['NAMSINH']}</Text>
        <Text style={styles.infoText}>
          Giới tính: {item['GIOITINH'] === true ? 'Nam' : 'Nữ'}
        </Text>
        <Text style={styles.infoText}>Cha: {item['TENCHA']}</Text>
        <Text style={styles.infoText}>Mẹ: {item['TENME']}</Text>
        <Text style={styles.infoText}>Dân tộc: {item['DANTOC']}</Text>
        <Text style={styles.infoText}>Tôn giáo: {item['TONGIAO']}</Text>
        <Text style={styles.infoText}>CCCD: {item['CCCD']}</Text>
        <Text style={styles.infoText}>
          Vắng nhà: {item['VANGNHA'] ? 'VẮNG' : 'KHÔNG'}
        </Text>
        <Text style={styles.infoText}>
          Nơi ở hiện tại: {item['NOIOHIENTAI']}
        </Text>

        {isEditingPhone ? (
          <View style={{ width: '100%', marginTop: 8 }}>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="Nhập SĐT"
              keyboardType="phone-pad"
              style={{
                borderWidth: 1,
                borderColor: '#CED4DA',
                borderRadius: 8,
                padding: 8,
                marginBottom: 6,
              }}
            />

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                style={{
                  backgroundColor: '#28A745',
                  padding: 8,
                  borderRadius: 6,
                }}
                onPress={async () => {
                  const { error } = await supabase
                    .from('population')
                    .update({ SDT: phone })
                    .eq('CCCD', item['CCCD']);

                  if (error) {
                    Alert.alert('Lỗi', error.message);
                  } else {
                    setIsEditingPhone(false);
                  }
                }}
              >
                <Text style={{ color: '#fff' }}>Lưu</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  backgroundColor: '#6C757D',
                  padding: 8,
                  borderRadius: 6,
                }}
                onPress={() => setIsEditingPhone(false)}
              >
                <Text style={{ color: '#fff' }}>Huỷ</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          item['SDT'] && (
            <Text
              style={{
                ...styles.infoText,
                fontWeight: '600',
                color: '#007AFF',
                textDecorationLine: 'underline',
              }}
              onPress={() => callPhone(item['SDT'])}
            >
              SĐT: {item['SDT']}
            </Text>
          )
        )}
        <View style={{ width: '100%' }}>
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

      </View>
      <View style={{ marginTop: 10 }}>
        <TextInput
          allowFontScaling={false}
          value={ghiChu}
          autoCapitalize={'characters'}
          onChangeText={onChangeGhiChu}
          placeholder="Nhập ghi chú..."
          multiline
          style={{
            //   minHeight: 30,
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
    </TouchableOpacity>
  );
}

export default ItemPopulation;

const styles = StyleSheet.create({
  infoText: {
    fontSize: 13,
    color: '#495057',
    marginRight: 12,
    marginBottom: 4,
  },
});
