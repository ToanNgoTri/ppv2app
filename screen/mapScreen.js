import React, { useState, useEffect, use } from 'react';
import {
  StyleSheet,
  Alert,
  Modal,
  View,
  TouchableOpacity,
  Text,
  StatusBar,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LeafletView } from 'react-native-leaflet-view';
import { supabase } from './lib.js';
import { Item } from './component/itemCrime.js';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Marker kèm tên.
 *
 * react-native-leaflet-view nhét thẳng chuỗi `icon` vào html của L.divIcon
 * (xem hàm dựng icon trong node_modules/react-native-leaflet-view/android/src/
 * main/assets/leaflet.html), nên truyền HTML vào đây là được. Lưu ý lib đoán
 * kiểu icon bằng cách dò chuỗi: nếu html chứa "http" + "//" hoặc "base64" nó sẽ
 * hiểu nhầm là ảnh và bọc trong <img>, vì vậy tuyệt đối không dùng url trong
 * đoạn html này.
 *
 * Trường `title` của marker thì lib render thành <Tooltip> của react-leaflet —
 * chỉ hiện khi hover nên trên điện thoại không bao giờ thấy.
 */
const escapeHtml = str =>
  String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

function markerWithName(name) {
  const label = escapeHtml(name).trim();
  const pin = `<div style="font-size:24px;line-height:24px">📍</div>`;
  if (!label) return `<div style="display:flex;justify-content:center">${pin}</div>`;

  // Nhãn đặt absolute để cái ghim vẫn nằm đúng chỗ cũ, thêm chữ không làm
  // marker bị đẩy lệch khỏi toạ độ.
  return (
    `<div style="position:relative;display:flex;justify-content:center">` +
    pin +
    `<div style="position:absolute;top:24px;left:50%;transform:translateX(-50%);` +
    `max-width:110px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;` +
    `font-family:sans-serif;font-size:11px;line-height:14px;font-weight:600;` +
    `color:#212529;background:rgba(255,255,255,0.9);border:1px solid rgba(0,0,0,0.2);` +
    `border-radius:6px;padding:1px 5px">${label}</div>` +
    `</div>`
  );
}

export function MapScreen() {
  const [mapMarkers, setMapMarkers] = useState([
    {
      id: '1',
      position: { lat: 10.8926975, lng: 107.2258088 },
      icon: markerWithName('HÀNG GÒN'),
      size: [32, 32],
      title: 'HÀNG GÒN',
    },
  ]);

  const [mapCenterPosition, setMapCenterPosition] = useState({
  lat: 10.883,
  lng: 107.217,
});
  // const [selectedMarker, setSelectedMarker] = useState(null);

  const [showModal, setShowModal] = useState(false);

  const [subjectSelect, setSubjectSelect] = useState({});

  const insets = useSafeAreaInsets(); // lất chiều cao để manu top iphone

  // Hàm xử lý sự kiện trả về từ LeafletView
  async function handleMapEvent(event) {
    console.log('Sự kiện:', event);

    if (event.event === 'onMapMarkerClicked') {
      const markerId = event.payload?.mapMarkerID;

      const { data, error } = await supabase
        .from('crime') // Tên bảng trong Supabase
        .select('*')
        .eq('CCCD', markerId);
      console.log('data', data);

      setSubjectSelect(data[0] || {});
      // setSelectedMarker(markerId);
      setShowModal(true);
      // Alert.alert('Marker được bấm!', `ID: ${markerId}`);
    }
  }

  async function fetchMarkers() {
    // Lấy dữ liệu từ Supabase
    const { data, error } = await supabase
      .from('crime') // Tên bảng trong Supabase
      .select('LOCATION, CCCD, HOTEN');
    // console.log('data', data);

    if (error) {
      console.error('Lỗi khi lấy dữ liệu:', error);
    }
    if (data) {
      // Chuyển đổi dữ liệu thành định dạng phù hợp cho mapMarkers
      let dataMarkers = [];
      console.log(data.length);
      data.map(item => {
        if (!item.LOCATION) return;
        // let objectLacation = {};
        // console.log('item.LOCATION', item.HOTEN);

        function convertCoordinates(coordString) {
          const [latStr, lonStr] = coordString.split(', ').map(s => s.trim());
          return { lat: latStr, lng: lonStr };
        }

        dataMarkers.push({
          id: item.CCCD,
          position: convertCoordinates(item.LOCATION),
          icon: markerWithName(item.HOTEN),
          size: [25, 25],
          title: item.HOTEN,
        });
      });
      setMapMarkers(dataMarkers);
      // console.log('Dữ liệu chuyển đổi thành markers:', dataMarkers);
      // console.log('Dữ liệu lấy từ Supabase:', data);
    }
  }

  useEffect(() => {
    fetchMarkers();
  }, []);

  return (
    <SafeAreaView style={{ ...styles.container }}>
      <StatusBar
        translucent // 🔹 cho phép nội dung nằm dưới status bar
        // backgroundColor="#1E1E1E" // 🔹 trong suốt
        barStyle='dark-content'
      />
      <LeafletView
        mapMarkers={mapMarkers}
        mapCenterPosition={mapCenterPosition}
        zoom={13}
        zoo
        onMessageReceived={handleMapEvent}
      />
      <Modal
        presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'}
        animationType="slide"
        visible={showModal}
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={() => setShowModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: '#f0f4f4' }}>
          {/* Header.
              Android bật edge-to-edge (targetSdk >= 35) nên Modal vẽ tràn dưới
              status bar -> phải chừa insets.top. iOS dùng pageSheet, card đã nằm
              dưới status bar nên không cộng thêm. */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              height: 60 + (Platform.OS === 'android' ? insets.top : 0),
              paddingTop: Platform.OS === 'android' ? insets.top : 0,
              paddingHorizontal: 12,
              backgroundColor: 'rgba(140, 184, 184, 1)',
              // borderBottomWidth: 1,
              // borderBottomColor: '#2F4F4F',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 3,
              elevation: 2,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#000' }}>
              Thông tin công dân
            </Text>
            <TouchableOpacity
              onPress={() => setShowModal(false)}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: 'rgba(187, 203, 203, 1)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 20, fontWeight: 'bold' }}>X</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              paddingHorizontal: 12,
              paddingBottom: insets.bottom + 16,
            }}
            keyboardShouldPersistTaps="handled"
          >
            <Item item={subjectSelect} index={1} />
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
