import React, { useState, useEffect, use } from 'react';
import {
  StyleSheet,
  Alert,
  Modal,
  View,
  TouchableOpacity,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LeafletView, MapMarker } from 'react-native-leaflet-view';
import { supabase } from './lib.js';
import { Item } from './component/itemCrime.js';

export function MapScreen() {
  const [mapMarkers, setMapMarkers] = useState([
    {
      id: '1',
      position: { lat: 10.8926975, lng: 107.2258088 },
      icon: '📍',
      size: [32, 32],
      title: 'HÀNG GÒN',
    },
  ]);

  const [selectedMarker, setSelectedMarker] = useState(null);

  const [showModal, setShowModal] = useState(false);

  const [subjectSelect, setSubjectSelect] = useState({});

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
      setSelectedMarker(markerId);
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
          icon: '📍',
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
    <SafeAreaView style={styles.container}>
      <LeafletView
        mapMarkers={mapMarkers}
        mapCenterPosition={{ lat: 10.883, lng: 107.217 }}
        zoom={13}
        onMessageReceived={handleMapEvent}
        on
      />
      <Modal
        presentationStyle="pageSheet"
        animationType="slide"
        visible={showModal}
        onRequestClose={() => setShowModal(false)}
      >

<View style={{ flex: 1, backgroundColor: '#f0f4f4' }}>
    {/* Header */}
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 60,
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
        <Item item={subjectSelect} index={1} />
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
