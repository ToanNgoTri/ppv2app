import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Image,
  Alert,
  Keyboard,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { supabase } from './lib.js';
import { decode } from 'base64-arraybuffer';
import * as RNFS from '@dr.pogodin/react-native-fs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Clipboard from '@react-native-clipboard/clipboard';
import { useNetInfo } from '@react-native-community/netinfo';

const FIELD_LABELS = {
  HOTEN: 'Họ và tên',
  TENKHAC: 'Tên khác',
  NAMSINH: 'Ngày sinh',
  CCCD: 'Số định danh cá nhân',
  TENCHA: 'Tên cha',
  TENME: 'Tên mẹ',
  TENVO: 'Tên vợ/chồng',
  DANTOC: 'Dân tộc',
  TONGIAO: 'Tôn giáo',
  NOITHTRU: 'Địa chỉ',
  CHARGE: 'Tội danh',
  JUDGMENT: 'Thời hạn',
  DAYARRES: 'Ngày bắt',
  FREEDAY: 'Ngày chấp hành xong',
  DETENTION: 'Nơi chấp hành',
};

const NUMERIC_FIELDS = ['NAMSINH', 'CCCD'];

const FLAG_LABELS = {
  ANNINH: 'An ninh',
  MATUY: 'Ma túy',
  TUTHA: 'Tù tha',
  THACD: 'THA CĐ',
  TREHU: 'Trẻ em hư',
};

export function EditCrime() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();

  const netInfo = useNetInfo();
  const internetConnected = netInfo.isConnected;

  const original = route.params?.item || {};
  // CCCD gốc dùng làm điều kiện cập nhật (không đổi kể cả khi sửa CCCD trong form)
  const originalCCCD = useRef(original.CCCD);

  const [form, setForm] = useState({
    HOTEN: original.HOTEN || '',
    TENKHAC: original.TENKHAC || '',
    NAMSINH: original.NAMSINH || '',
    GIOITINH: original.GIOITINH === true,
    CCCD: original.CCCD || '',
    TENCHA: original.TENCHA || '',
    TENME: original.TENME || '',
    TENVO: original.TENVO || '',
    DANTOC: original.DANTOC || '',
    TONGIAO: original.TONGIAO || '',
    NOITHTRU: original.NOITHTRU || '',
    CHARGE: original.CHARGE || '',
    JUDGMENT: original.JUDGMENT || '',
    DAYARRES: original.DAYARRES || '',
    FREEDAY: original.FREEDAY || '',
    DETENTION: original.DETENTION || '',
    LOCATION: original.LOCATION || '',
    SOHOK: original.SOHOK || '',
    ANNINH: original.ANNINH === true,
    MATUY: original.MATUY === true,
    TUTHA: original.TUTHA === true,
    THACD: original.THACD === true,
    TREHU: original.TREHU === true,
  });

  const [imageURL, setImageURL] = useState(null); // ảnh mới (local uri) nếu chụp lại
  const [remoteImage, setRemoteImage] = useState(null); // ảnh hiện có trên server
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  const inputRefs = useRef([]);
  const scrollViewRef = useRef(null);

  useEffect(() => {
    navigation.setOptions({ title: `Sửa: ${original.HOTEN || ''}` });
  }, [navigation, original.HOTEN]);

  // Lấy ảnh hiện có
  useEffect(() => {
    async function checkImage() {
      if (!originalCCCD.current) return;
      const path = `subject/${originalCCCD.current}.jpg`;
      const { data } = supabase.storage.from('imageCrime').getPublicUrl(path);
      const url = data.publicUrl;
      try {
        const res = await fetch(url, { method: 'HEAD' });
        if (res.ok) setRemoteImage(`${url}?t=${res.headers.get('etag') || ''}`);
      } catch {}
    }
    checkImage();
  }, []);

  const handleChange = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  function formatDateInput(value) {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
  }

  function openCamera() {
    navigation.push('Camera', {
      onGoBack: data => {
        if ('photo' in data) setImageURL(data['photo']);
      },
    });
  }

  // Cắt lại ảnh vừa chụp / vừa chọn (chỉ áp dụng cho ảnh mới)
  function openCrop() {
    if (!imageURL) return;
    navigation.push('CropImage', {
      uri: imageURL,
      onDone: cropped => setImageURL(cropped),
    });
  }

  async function fileUriToBase64(fileUri) {
    try {
      return await RNFS.readFile(fileUri, 'base64');
    } catch (err) {
      console.log('Error reading file:', err);
      return null;
    }
  }

  async function uploadImage() {
    if (!imageURL) return;
    try {
      const base64Data = await fileUriToBase64(imageURL);
      if (!base64Data) return;
      const arrayBuffer = decode(base64Data);
      const fileName = `${form.CCCD}.jpg`;

      const { error } = await supabase.storage
        .from('imageCrime')
        .upload(`/subject/${fileName}`, arrayBuffer, {
          contentType: 'image/jpg',
          upsert: true, // ghi đè ảnh cũ khi sửa
        });

      if (error) throw error;
    } catch (err) {
      console.error('Upload failed:', err);
    }
  }

  /* ================= VỊ TRÍ ================= */
  const getCoordsFromShortLink = async shortUrl => {
    const response = await fetch(shortUrl, { redirect: 'follow' });
    const finalUrl = response.url;
    let match = finalUrl.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
    if (!match) match = finalUrl.match(/coordinate=(\d+\.\d+)%2C(-?\d+\.\d+)/);
    if (!match) return { finalUrl };
    return {
      location: `${parseFloat(match[1])}, ${parseFloat(match[2])}`,
      finalUrl,
    };
  };

  const extractLatLngFromGoogleMapsUrl = async url => {
    const result = await getCoordsFromShortLink(url);
    const match = result.finalUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (match) return `${parseFloat(match[1])}, ${parseFloat(match[2])}`;
    return result.location;
  };

  const pushToSetLocation = async () => {
    const text = await Clipboard.getString();
    if (!text || text.trim() === '') {
      Alert.alert('Lỗi', 'Không có nội dung trong clipboard');
      return;
    }
    const toado = await extractLatLngFromGoogleMapsUrl(text);
    if (!toado) {
      Alert.alert(
        'Lỗi',
        'Không tìm thấy tọa độ trong liên kết ' +
          (Platform.OS === 'ios' ? 'Apple' : 'Google') +
          ' Map',
      );
      return;
    }
    setForm(prev => ({ ...prev, LOCATION: toado }));
  };

  const deleteLocation = () => setForm(prev => ({ ...prev, LOCATION: '' }));

  /* ================= LƯU ================= */
  async function saveData() {
    if (!form.CCCD || form.CCCD.trim() === '') {
      Alert.alert('Thông báo', 'Thiếu số Định danh cá nhân');
      return;
    }
    setLoadingSubmit(true);
    try {
      await uploadImage();

      const dataPush = { ...form, LOCATION: form.LOCATION || null };

      const { error } = await supabase
        .from('crime')
        .update(dataPush)
        .eq('CCCD', originalCCCD.current);

      if (error) {
        console.log('Lỗi khi cập nhật:', error);
        Alert.alert('Thất bại', error.message);
        return;
      }

      Alert.alert('Thành công', 'Đã cập nhật thông tin đối tượng', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      console.error('Lỗi khi lưu dữ liệu:', err);
      Alert.alert('Lỗi', 'Đã có lỗi xảy ra khi lưu dữ liệu');
    } finally {
      setLoadingSubmit(false);
    }
  }

  async function confirmDelete() {
    Alert.alert('Xoá đối tượng', `Xoá "${form.HOTEN}" khỏi danh sách?`, [
      { text: 'Huỷ', style: 'cancel' },
      {
        text: 'Xoá',
        style: 'destructive',
        onPress: async () => {
          setLoadingSubmit(true);
          const { error } = await supabase
            .from('crime')
            .delete()
            .eq('CCCD', originalCCCD.current);
          setLoadingSubmit(false);
          if (error) {
            Alert.alert('Thất bại', error.message);
          } else {
            Alert.alert('Đã xoá', 'Đối tượng đã được xoá', [
              { text: 'OK', onPress: () => navigation.goBack() },
            ]);
          }
        },
      },
    ]);
  }

  const fieldEntries = Object.entries(FIELD_LABELS);

  return (
    <>
      {!internetConnected && (
        <View style={styles.offline}>
          <Text style={styles.offlineText}>Vui lòng kiểm tra kết nối mạng ...</Text>
          <ActivityIndicator size="large" color="white" />
        </View>
      )}

      <ScrollView
        contentContainerStyle={{ ...styles.container, padding: 14 }}
        ref={scrollViewRef}
      >
        <Text style={styles.header}>✏️ SỬA THÔNG TIN ĐỐI TƯỢNG</Text>

        <View style={styles.formContainer}>
          {/* Giới tính */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Giới tính</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {[
                { label: 'Nam', value: true },
                { label: 'Nữ', value: false },
              ].map(opt => {
                const active = form.GIOITINH === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.label}
                    onPress={() => handleChange('GIOITINH', opt.value)}
                    style={[styles.genderBtn, active && styles.genderBtnActive]}
                  >
                    <Text style={[styles.genderText, active && styles.genderTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Phân loại đối tượng */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phân loại đối tượng</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {Object.keys(FLAG_LABELS).map(field => {
                const on = form[field];
                return (
                  <TouchableOpacity
                    key={field}
                    onPress={() => handleChange(field, !form[field])}
                    style={[styles.flagChip, on && styles.flagChipActive]}
                  >
                    <Text style={[styles.flagText, on && styles.flagTextActive]}>
                      {on ? '✓ ' : ''}
                      {FLAG_LABELS[field]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {fieldEntries.map(([key, label], index) => (
            <View key={key} style={styles.inputGroup}>
              <Text style={styles.label}>{label}</Text>
              <TextInput
                onFocus={() => {
                  scrollViewRef.current?.scrollTo({ y: index * 80, animated: true });
                }}
                keyboardType={NUMERIC_FIELDS.includes(key) ? 'numeric' : 'default'}
                autoCapitalize={NUMERIC_FIELDS.includes(key) ? 'none' : 'characters'}
                placeholder={`Nhập ${label.toLowerCase()}...`}
                ref={el => (inputRefs.current[index] = el)}
                returnKeyType={index === fieldEntries.length - 1 ? 'done' : 'next'}
                onSubmitEditing={() => {
                  if (index < fieldEntries.length - 1) {
                    inputRefs.current[index + 1]?.focus();
                  } else {
                    Keyboard.dismiss();
                  }
                }}
                submitBehavior="submit"
                style={styles.input}
                value={form[key]}
                onChangeText={v =>
                  handleChange(key, key === 'NAMSINH' ? formatDateInput(v) : v)
                }
              />
            </View>
          ))}

          {/* Vị trí */}
          {!form.LOCATION ? (
            <TouchableOpacity style={styles.locationBtn} onPress={pushToSetLocation}>
              <Text style={styles.locationText}>
                Nhận địa chỉ từ {Platform.OS === 'ios' ? 'Apple' : 'Google'} Map
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.locationBtn, { backgroundColor: 'black' }]}
              onLongPress={() =>
                Alert.alert('Thông báo', 'Bạn có muốn xóa vị trí không?', [
                  { text: 'Thoát', style: 'cancel' },
                  { text: 'Xoá', onPress: deleteLocation },
                ])
              }
            >
              <Text style={styles.locationText}>Đã có vị trí (giữ để xoá)</Text>
            </TouchableOpacity>
          )}

          {/* Ảnh */}
          <View style={[styles.inputGroup, { alignItems: 'center', marginTop: 10 }]}>
            <Image
              source={
                imageURL
                  ? { uri: imageURL }
                  : remoteImage
                  ? { uri: remoteImage }
                  : require('../asset/unknow.jpg')
              }
              style={styles.imagePreview}
            />
          </View>

          <TouchableOpacity style={styles.cameraButton} onPress={openCamera}>
            <Text style={styles.cameraText}>📷 Chụp / đổi ảnh</Text>
          </TouchableOpacity>

          {imageURL && (
            <TouchableOpacity style={styles.cropButton} onPress={openCrop}>
              <Text style={styles.cameraText}>✂️ Cắt ảnh</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.saveButton} onPress={saveData}>
            {loadingSubmit ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveText}>💾 Lưu thay đổi</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteButton} onPress={confirmDelete}>
            <Text style={styles.saveText}>🗑️ Xoá đối tượng</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.exitButton} onPress={() => navigation.goBack()}>
            <Text style={styles.saveText}>🚪 Thoát</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#F8FAFC' },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#1E3A8A',
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  inputGroup: { marginBottom: 14 },
  label: { fontWeight: '600', color: '#334155', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#F8FAFC',
  },
  genderBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  genderBtnActive: { backgroundColor: '#0D6EFD', borderColor: '#0D6EFD' },
  genderText: { fontWeight: '600', color: '#334155' },
  genderTextActive: { color: '#fff' },
  flagChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
  },
  flagChipActive: { backgroundColor: '#16A34A', borderColor: '#16A34A' },
  flagText: { fontWeight: '600', color: '#334155', fontSize: 13 },
  flagTextActive: { color: '#fff' },
  locationBtn: {
    backgroundColor: '#0D6EFD',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationText: { color: 'white', fontWeight: '600', fontSize: 14 },
  cameraButton: {
    backgroundColor: '#0EA5E9',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  cameraText: { color: '#fff', fontSize: 17, fontWeight: '600' },
  cropButton: {
    backgroundColor: '#6366F1',
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 10,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#16A34A',
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 15,
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#e67e22',
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 15,
    alignItems: 'center',
  },
  exitButton: {
    backgroundColor: '#da0606ff',
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 15,
    alignItems: 'center',
  },
  saveText: { color: '#fff', fontSize: 17, fontWeight: '600' },
  imagePreview: {
    width: 150,
    height: 150,
    resizeMode: 'cover',
    borderRadius: 10,
  },
  offline: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    opacity: 0.7,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  offlineText: { color: 'white', marginBottom: 15, fontWeight: 'bold' },
});
