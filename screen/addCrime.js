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
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from './lib.js';
import { decode } from 'base64-arraybuffer';
import RNFS from 'react-native-fs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function AddCrime() {
  const [form, setForm] = useState({
    HOTEN: '',
    TENKHAC: '',
    NAMSINH: '',
    GIOITINH: true,
    CCCD: '',
    TENCHA: '',
    TENME: '',
    DANTOC: '',
    TONGIAO: '',
    NOITHTRU: '',
    CHARGE: '',
    JUDGMENT: '',
    DAYARRES: '',
    FREEDAY: '',
    DETENTION: '',
    LOCATION: '',
    SOHOK: '',
  });

  const navigation = useNavigation();
  const route = useRoute();

  const [dataCCCD, setDataCCCD] = useState(null);

  const [imageURL, setImageURL] = useState(null);

  const inputRefs = useRef([]);
  console.log('imageURL', imageURL);
  const scrollViewRef = useRef(null);

  const insets = useSafeAreaInsets(); // lất chiều cao để manu top iphone

  const handleChange = (key, value) => {
    if (key == 'GIOITINH') {
      setForm({
        ...form,
        ['GIOITINH']: value.toLowerCase() == 'nam' ? true : false,
      });
    } else {
      setForm({ ...form, [key]: value });
    }
  };

  function openCamera() {
navigation.push('Camera', {
    onGoBack: data => {
      if ('qrValue' in data) {
        setDataCCCD(data['qrValue']);
         setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      }, 300);
      } else {
        setImageURL(data['photo']);
      }
    }})
  }

  function parseCitizenData(str) {
    const parts = str.split('|');
    // console.log();

    return {
      CCCD: parts[0].toUpperCase() || '',
      MAHS: parts[1].toUpperCase() || '',
      HOTEN: (parts[2] || '').trim().toUpperCase(),
      NAMSINH: formatDate(parts[3]),
      GIOITINH: parts[4]?.toLowerCase() === 'nam',
      DIACHI: (parts[5] || '').trim().toUpperCase(),
      NGAYCAP: formatDate(parts[6]),
      // các phần sau nếu cần có thể thêm
    };
  }

  function formatDate(dateStr) {
    if (!dateStr || dateStr.length !== 8) return '';
    const d = dateStr.slice(0, 2);
    const m = dateStr.slice(2, 4);
    const y = dateStr.slice(4);
    return `${d}/${m}/${y}`;
  }

  async function fileUriToBase64(fileUri) {
    try {
      const base64Data = await RNFS.readFile(fileUri, 'base64');
      return base64Data;
    } catch (err) {
      console.log('Error reading file:', err);
      return null;
    }
  }

  async function uploadImage() {
    try {
      const base64Data = await fileUriToBase64(imageURL);
      if (!base64Data) return;
      const arrayBuffer = decode(base64Data);

      const fileName = `${form.CCCD}.jpg`;
      console.log('form.CCCD', form.CCCD);
      console.log(arrayBuffer);

      const { data, error } = await supabase.storage
        .from('imageCrime')
        .upload(`\/newSubject\/${fileName}`, arrayBuffer, {
          contentType: 'image/jpg',
          upsert: false, // ghi đè nếu file đã tồn tại
        });

      if (error) throw error;

      // Lấy URL public nếu bucket public
      // const url = supabase.storage.from(bucketName).getPublicUrl(fileName);
      // return url;
    } catch (err) {
      console.error('Upload failed:', err);
      return null;
    }
  }

  //  async function uriToArrayBuffer() {
  //       const response = await fetch(imageURL);
  //   const buffer = await response.arrayBuffer();
  //   return buffer;
  //   }

  async function saveData(params) {
    console.log('form.CCCD', form.CCCD.length);

    if (!form.CCCD == '') {
      let uploadIMG = await uploadImage();

      const { data, error } = await supabase.from('addCrime').insert([form]);
      Alert.alert('Thành công', `Thông tin đã được thêm`);

      if (error) {
        console.log('Lỗi khi thêm:', error);
        return null;
      }
      setForm({
        HOTEN: '',
        TENKHAC: '',
        NAMSINH: '',
        GIOITINH: true,
        CCCD: '',
        TENCHA: '',
        TENME: '',
        DANTOC: '',
        TONGIAO: '',
        NOITHTRU: '',
        CHARGE: '',
        JUDGMENT: '',
        DAYARRES: '',
        FREEDAY: '',
        DETENTION: '',
        LOCATION: '',
        SOHOK: '',
      });
      setImageURL(null);
    } else {
      Alert.alert('Thông báo', `Thiếu số Định danh cá nhân`);
    }
    // return data;
  }

  const getCoordsFromShortLink = async shortUrl => {
    console.log('getCoordsFromShortLink');

    const response = await fetch(shortUrl, { redirect: 'follow' });
    const finalUrl = response.url;
    console.log('finalUrl', finalUrl);

    const match = finalUrl.match(/place\/(-?\d+\.\d+),(-?\d+\.\d+)/);
    console.log('match', match);

    if (!match) return null;
    return `${parseFloat(match[1])}, ${parseFloat(match[2])}`;
  };

  const extractLatLngFromGoogleMapsUrl = async url => {
    const match = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (match) return `${parseFloat(match[1])}, ${parseFloat(match[2])}`;
    return await getCoordsFromShortLink(url);
  };

  useEffect(() => {
    if (dataCCCD) {
      let parsed = parseCitizenData(dataCCCD);

      setForm(prev => ({
        ...prev,
        CCCD: parsed.CCCD,
        HOTEN: parsed.HOTEN,
        NAMSINH: parsed.NAMSINH,
        GIOITINH: parsed.GIOITINH ? 'Nam' : 'Nữ',
        NOITHTRU: parsed.DIACHI,
      }));
    }
  }, [dataCCCD]);

  // useEffect(() => {
  //   console.log('dataCCCD', dataCCCD);
  //   console.log('scrollViewRef.current', scrollViewRef.current);

  //   if (dataCCCD) {
  //     setTimeout(() => {
  //       scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  //     }, 300);
  //   }
  // }, [dataCCCD]);



  return (
    <ScrollView
      contentContainerStyle={{ ...styles.container, padding: 10 + insets.top }}
      ref={scrollViewRef}
    >
      <View>
        <Text style={styles.header}>📋 THÔNG TIN CÔNG DÂN</Text>
      </View>
      <View style={styles.formContainer}>
        {Object.entries({
          HOTEN: 'Họ và tên',
          TENKHAC: 'Tên khác',
          NAMSINH: 'Ngày sinh',
          GIOITINH: 'Giới tính',
          CCCD: 'Số định danh cá nhân',
          TENCHA: 'Tên cha',
          TENME: 'Tên mẹ',
          DANTOC: 'Dân tộc',
          TONGIAO: 'Tôn giáo',
          NOITHTRU: 'Địa chỉ',
          TOIDANH: 'Tội danh',
          THOIHAN: 'Thời hạn',
          NGAYBAT: 'Ngày bắt',
          NGAYCHXONG: 'Ngày chấp hành xong',
          NOICH: 'Nơi chấp hành',
          LOCATION: 'Vị trí nơi ở',
        }).map(([key, label], index, arr) => (
          <View key={key} style={styles.inputGroup}>
            <Text style={styles.label}>{label}</Text>
            <TextInput
              autoCapitalize="characters"
              placeholder={`Nhập ${label.toLowerCase()}...`}
              ref={el => (inputRefs.current[index] = el)}
              returnKeyType={index === arr.length - 1 ? 'done' : 'next'}
              onSubmitEditing={() => {
                if (index < arr.length - 1) {
                  inputRefs.current[index + 1]?.focus(); // 👉 nhảy xuống ô tiếp theo
                } else {
                  Keyboard.dismiss(); // nếu là ô cuối thì đóng bàn phím
                }
              }}
              submitBehavior="submit" // giữ focus khi nhấn "Next"
              style={styles.input}
              value={form[key]}
              onChangeText={v => handleChange(key, v)}
            />
          </View>
        ))}

        <View style={[styles.inputGroup, { alignItems: 'center' }]}>
          <Image
            source={
              imageURL ? { uri: imageURL } : require('../asset/unknow.jpg')
            }
            style={styles.imagePreview}
          />
        </View>

        <TouchableOpacity style={styles.cameraButton} onPress={openCamera}>
          <Text style={styles.cameraText}>📷 Mở Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveButton} onPress={() => saveData()}>
          <Text style={styles.saveText}>💾 Lưu thông tin</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { backgroundColor: '#F8FAFC' },
  header: {
    fontSize: 22,
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
  cameraButton: {
    backgroundColor: '#0EA5E9',
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 10,
    alignItems: 'center',
  },
  cameraText: { color: '#fff', fontSize: 17, fontWeight: '600' },
  saveButton: {
    backgroundColor: '#16A34A',
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
    marginBottom: 10,
  },
});
