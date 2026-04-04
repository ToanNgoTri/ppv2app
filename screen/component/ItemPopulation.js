import { View, Text, Linking } from 'react-native';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRoute } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { Alert, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { supabase } from '../lib.js';

function ItemPopulation({ item, index }) {
  const route = useRoute();
  const navigation = useNavigation();

  const [ghiChu, setGhiChu] = useState(item?.GHICHU || '');
  const [vangNha, setVangNha] = useState(item?.VANGNHA || false);

  const saveTimeout = useRef(null);

  const isSelected = route?.params?.CCCD === item['CCCD'];
  const isEven = index % 2 === 0;

  console.log();

  useEffect(() => {
    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
  }, []);

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
        backgroundColor: vangNha
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
        Alert.alert('Thông báo', 'Bạn có muốn cập nhật thông tin công dân?', [
          {
            text: 'Thoát',
            style: 'cancel',
          },
          {
            text: 'Thêm đối tượng',
            onPress: () => {
              navigation.push('addCrime', {
                data: item,
              });
            },
          },
          {
            text: 'Vắng nhà',
            onPress: () => {
              toggleVangNha();
            },
          },
        ]);
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
        {item['SDT'] && (
          <Text
            style={{
              ...styles.infoText,
              fontWeight: '600',
              color: '#007AFF', // nhìn giống link
              textDecorationLine: 'underline',
            }}
            onPress={() => callPhone(item['SDT'])}
          >
            SĐT: {item['SDT']}
          </Text>
        )}
      </View>
      <View style={{ marginTop: 10 }}>
        <TextInput
          allowFontScaling={false}
          value={ghiChu}
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
