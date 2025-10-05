import React, { useState, useEffect, useRef } from 'react';
import { Text, View, FlatList } from 'react-native';
import { useRoute } from '@react-navigation/native';
// import RNFS from 'react-native-fs';
import { useNavigation, useScrollToTop } from '@react-navigation/native';
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
    return (
      <View
        style={{
          flexDirection: 'collumn',
          backgroundColor:
            route.params.CCCD == item['CCCD']
              ? 'orange'
              : index % 2
              ? '#CCCCCC'
              : '#white',
          marginTop: 10,
          flexWrap: 'wrap',
          padding: 10,
          borderWidth: 2,
          borderColor: 'black',
          borderRadius: 5,
        }}
      >
        <View>
          <Text>STT: {index + 1}</Text>
        </View>

        <Text style={{ marginRight: 10 }}>
          Quan hệ:{' '}
          {item['QUANHE'] == 'CH' ? (
            <Text style={{ fontWeight: 'bold', backgroundColor: 'yellow' }}>
              {item['QUANHE']}
            </Text>
          ) : (
            item['QUANHE']
          )}
        </Text>
        <Text style={{ marginRight: 10 }}>
          Họ và tên: <Text style={{ fontWeight: 'bold' }}>{item['HOTEN']}</Text>
        </Text>

        <Text style={{ marginRight: 10 }}>Ngày sinh: {item['NAMSINH']}</Text>

        <Text style={{ marginRight: 10 }}>
          Giới tính: {item['GIOITINH'] == 'TRUE' ? 'Nam' : 'Nữ'}
        </Text>
        <Text style={{ marginRight: 10 }}>Tên cha: {item['TENCHA']}</Text>
        <Text style={{ marginRight: 10 }}>Tên mẹ: {item['TENME']}</Text>
        <Text style={{ marginRight: 10 }}>Dân tộc: {item['DANTOC']}</Text>
        <Text style={{ marginRight: 10 }}>Tôn giáo: {item['TONGIAO']}</Text>
        <Text style={{ marginRight: 10 }}>Số ĐDCN: {item['CCCD']}</Text>
      </View>
    );
  }

  useEffect(() => {
    // RNFS.exists(`${externalDirectoryPath}/population.json`).then(fileExist => {
    //   console.log('fileExist', fileExist);

    //   if (fileExist) {
    //     RNFS.readFile(`${externalDirectoryPath}/population.json`).then(
    //       dataExternal => {
    //         data = JSON.parse(dataExternal);
    //         console.log('data0', data);
    //         Filter();
    //       },
    //     );
    //   } else {
    //     data = population;
    //     console.log('data1');
    //     Filter();
    //   }
    // });
  }, []);

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
