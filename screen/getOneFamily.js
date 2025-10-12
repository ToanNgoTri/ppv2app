import React, { useState, useEffect, useRef } from 'react';
import { Text, View, FlatList,StyleSheet } from 'react-native';
import { useRoute } from '@react-navigation/native';
// import RNFS from 'react-native-fs';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from './lib.js';

// import population from '../asset/population.json';

export function GetOneFamily() {
  const [searchResult, setSearchResult] = useState([]);

  const route = useRoute();
  // const externalDirectoryPath = `${RNFS.ExternalDirectoryPath}`;
  const navigation = useNavigation();
  const insets = useSafeAreaInsets(); // lất chiều cao để manu top iphone

  let data = [];

  // function Filter() {
  //   // let data = population;
  //   let dataDemoSearch = [];
  //   for (let a = 0; a <= data.length; a++) {
  //     // console.log('shk',data[a]['SOHOK']);

  //     if (data[a] && data[a]['SOHOK'] == route.params.screen) {
  //       dataDemoSearch.push(data[a]);
  //     }
  //   }
  //   console.log('dataDemoSearch', dataDemoSearch);
  //   setSearchResult(dataDemoSearch);
  // }

  useEffect(() => {
    navigation.setOptions({ title: `HSHK: ${route.params.screen}` }); //đổi title
    const fetchData = async () => {
      let { data: population, error } = await supabase
        .from('population')
        .select('*')
        .eq('SOHOK', route.params.screen);
      if (error) {
        console.log('Error fetching data:', error);}
      else {
        setSearchResult(population);
        console.log('Fetched data:', population);
      }
    };
    fetchData();
  }, [route.params.screen, navigation]);

function Item({ item, index }) {
  const isSelected = route.params.CCCD === item['CCCD'];
  const isEven = index % 2 === 0;

  return (
    <View
      style={{
        backgroundColor: isSelected
          ? '#FFD580' // màu vàng nhạt nổi bật khi trùng CCCD
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
            backgroundColor: item['QUANHE'] === 'CH' ? '#FFF176' : 'transparent',
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
          Giới tính: {item['GIOITINH'] === 'TRUE' ? 'Nam' : 'Nữ'}
        </Text>
        <Text style={styles.infoText}>Cha: {item['TENCHA']}</Text>
        <Text style={styles.infoText}>Mẹ: {item['TENME']}</Text>
        <Text style={styles.infoText}>Dân tộc: {item['DANTOC']}</Text>
        <Text style={styles.infoText}>Tôn giáo: {item['TONGIAO']}</Text>
        <Text style={styles.infoText}>CCCD: {item['CCCD']}</Text>
      </View>
    </View>
  );
}

  return (
    <>
      <View>
        <View
          style={{
            justifyContent: 'space-between',
            flexDirection: 'row',
            backgroundColor: '#33CC00',
            paddingLeft: 20,
            paddingRight: 20,
            paddingBottom: 10,
            paddingTop: 10,
          }}
        >
          <Text style={{ fontWeight: 'bold' }}>
            Số HSHK {route.params.screen}
          </Text>
          <Text style={{ fontWeight: 'bold' }}>
            Địa chỉ: {searchResult[0] && searchResult[0]['NOITHTRU']}
          </Text>
        </View>
        <View
          style={{
            paddingLeft: 20,
            paddingRight: 20,
            marginBottom: 20,
            paddingBottom: 60
            // marginTop: 10,
          }}
        >
          <FlatList
            data={searchResult}
            renderItem={item => <Item item={item.item} index={item.index} />}
          ></FlatList>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  infoText: {
    fontSize: 13,
    color: '#495057',
    width: '50%', // chia 2 cột
    marginBottom: 4,
  }
})
