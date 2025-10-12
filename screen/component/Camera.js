import React, { useState, useRef, useEffect } from 'react';
import { Image, View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useCodeScanner,
} from 'react-native-vision-camera';
import { useNavigation, useRoute } from '@react-navigation/native';
import ImageResizer from 'react-native-image-resizer';
import RNFS from 'react-native-fs';

export function CameraComponent() {
  const [qrValue, setQrValue] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(true);

  const { hasPermission, requestPermission } = useCameraPermission();
  const camera = useRef(null);
  const device = useCameraDevice('back');

  const navigation = useNavigation();
  const route = useRoute();

  // ✅ Hook quét mã QR
  const codeScanner = useCodeScanner({
    codeTypes: ['qr', 'ean-13', 'code-128'],
    onCodeScanned: codes => {
      if (codes.length > 0 && !qrValue) {
        const value = codes[0].value;
        console.log('Mã quét được:', value);
        setQrValue(value);
      }
    },
  });

  // ✅ Xin quyền camera
  useEffect(() => {
    (async () => {
      if (!hasPermission) {
        await requestPermission();
      }
      setLoading(false);
    })();
  }, [hasPermission]);

  // ✅ Gửi QR về màn hình trước
  useEffect(() => {
    if (qrValue && route.params?.onGoBack) {
      route.params.onGoBack({ qrValue });
      navigation.goBack();
    }
  }, [qrValue]);

  // ✅ Chụp ảnh và giảm dung lượng
  const capturePhoto = async () => {
    try {
      if (!camera.current) return;
      const photoData = await camera.current.takePhoto({
        qualityPrioritization: 'speed',
        flash: 'off',
        skipMetadata: true,
        enableShutterSound: false,
      });

      const originalPath = 'file://' + photoData.path;
      console.log('Ảnh gốc:', originalPath);

      // ⚙️ Giảm kích thước ảnh
      const resized = await ImageResizer.createResizedImage(
        originalPath,
        800, // Chiều rộng tối đa
        600, // Chiều cao tối đa
        'JPEG',
        80, // Chất lượng
        0, // Xoay ảnh
        undefined,
        false,
        { mode: 'cover', onlyScaleDown: true }
      );

      // Kiểm tra dung lượng (tùy chọn)
      const stat = await RNFS.stat(resized.uri);
      console.log('✅ Ảnh sau nén:', resized.uri, '≈', Math.round(stat.size / 1024), 'KB');

      setPhoto(resized.uri);
    } catch (e) {
      console.error('Lỗi chụp ảnh hoặc nén:', e);
    }
  };

  // ✅ Chọn ảnh và gửi về màn hình trước
  const choseImage = () => {
    if (route.params?.onGoBack && photo) {
      route.params.onGoBack({ photo });
    }
    navigation.goBack();
  };

  // Trạng thái xin quyền
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.text}>Đang kiểm tra quyền camera...</Text>
      </View>
    );
  }

  if (!hasPermission) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>Không có quyền truy cập camera</Text>
        <TouchableOpacity
          onPress={requestPermission}
          style={[styles.retryButton, { backgroundColor: '#007AFF' }]}
        >
          <Text style={{ color: '#fff' }}>Cấp quyền</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>Không tìm thấy camera sau</Text>
      </View>
    );
  }

  // ✅ Giao diện chính
  return (
    <View style={styles.container}>
      {!photo ? (
        <>
          <Camera
            ref={camera}
            style={StyleSheet.absoluteFill}
            device={device}
            isActive={true}
            codeScanner={codeScanner}
            photo={true}
          />

          <TouchableOpacity style={styles.captureButton} onPress={capturePhoto}>
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Chụp</Text>
          </TouchableOpacity>
        </>
      ) : (
        <View style={styles.preview}>
          <Image source={{ uri: photo }} style={styles.imagePreview} />
          <TouchableOpacity onPress={choseImage} style={styles.agreeButton}>
            <Text style={{ color: '#fff' }}>Đồng ý</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setPhoto(null)} style={styles.retryButton}>
            <Text style={{ color: '#fff' }}>Chụp lại</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  text: { color: '#fff', marginTop: 10 },
  captureButton: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: '#007AFF',
    padding: 20,
    borderRadius: 100,
  },
  preview: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  imagePreview: { width: '90%', height: '70%', borderRadius: 10 },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#FF3B30',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  agreeButton: {
    marginTop: 20,
    backgroundColor: '#0ACC00',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
});
