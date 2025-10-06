// ALTER TABLE crime ADD COLUMN GIOITINH_bool boolean;

// UPDATE crime
// SET GIOITINH_bool = ("GIOITINH" ILIKE 'Nam');

// update population
// set province = upper(province);

import SelectDropdown from 'react-native-select-dropdown';
import React, { useState, useRef, useEffect, useContext } from 'react';
import {
  Text,
  TextInput,
  View,
  TouchableOpacity,
  FlatList,
  Keyboard,
  StyleSheet,
} from 'react-native';
import population from '../asset/population.json';
import { useNavigation } from '@react-navigation/native';
// import RNFS from 'react-native-fs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from './lib.js';
// import { createClient } from '@supabase/supabase-js'
// import 'react-native-url-polyfill/auto' // nếu bạn dùng React Native CLI
// import AsyncStorage from '@react-native-async-storage/async-storage';


export function Population() {
// const supabase = createClient('https://feuakoaglemujpwsspie.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZldWFrb2FnbGVtdWpwd3NzcGllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1Njg5NjYsImV4cCI6MjA3NTE0NDk2Nn0.kduWT_6GWnSyXKNCLPzGn1zcUaYO24Rtnx7fN9wtoO0', {
//   auth: { storage: AsyncStorage },
// });

  const [input1, setInput1] = useState('');
  const [input2, setInput2] = useState('');
  const [input3, setInput3] = useState('');

  const [titleFilter1, setTitleFilter1] = useState('HOTEN');
  const [titleFilter2, setTitleFilter2] = useState('HOTEN');
  const [titleFilter3, setTitleFilter3] = useState('HOTEN');

  const [loading, setLoading] = useState(false);
  const [searchResult, setSearchResult] = useState([]);
  const navigation = useNavigation();

  // const FlatListToScroll = useRef(null);

  // const externalDirectoryPath = `${RNFS.ExternalDirectoryPath}`;
  const insets = useSafeAreaInsets(); // lất chiều cao để manu top iphone

  // const HomeScreen = useContext(RefOfHome);

  let data = population;
  useEffect(() => {

  async function getUser() {
    const { data: user } = await supabase.auth.getUser();
    console.log('auth.uid():', user.user?.id);
  }  
  getUser()
}, []);

  function Item({ item, index }) {
    return (
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: index % 2 ? '#CCCCCC' : '#white',
          marginTop: 10,
          flexWrap: 'wrap',
          padding: 10,
          borderWidth: 2,
          borderColor: 'black',
          borderRadius: 5,
        }}
      >
        <View>
          <Text>STT: {index}</Text>
        </View>
        <TouchableOpacity
          onPress={() =>
            navigation.push(`getOneFamily`, {
              screen: item['SOHOK'],
              CCCD: item['CCCD'],
              // data:data
            })
          }
          style={{ width: '100%' }}
        >
          <Text style={{ marginRight: 10 }}>Số HSHK: {item['SOHOK']}</Text>
          <Text style={{ marginRight: 10 }}>
            Họ và tên:{' '}
            <Text style={{ fontWeight: 'bold' }}>{item['HOTEN']}</Text>
          </Text>

          <Text style={{ marginRight: 10 }}>Ngày sinh: {item['NAMSINH']}</Text>

          <Text style={{ marginRight: 10 }}>
            Giới tính: {item['GIOITINH'] ? 'NAM' : 'NỮ'}
          </Text>
          <Text style={{ marginRight: 10 }}>Tên cha: {item['TENCHA']}</Text>
          <Text style={{ marginRight: 10 }}>Tên mẹ: {item['TENME']}</Text>
          <Text style={{ marginRight: 10 }}>Dân tộc: {item['DANTOC']}</Text>
          <Text style={{ marginRight: 10 }}>Tôn giáo: {item['TONGIAO']}</Text>
          <Text style={{ marginRight: 10 }}>Số ĐDCN: {item['CCCD']}</Text>
          <Text style={{ marginRight: 10 }}>Địa chỉ: {item['NOITHTRU']}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  async function pushToSearch() {
    global.SearchPopulationRef && global.SearchPopulationRef.scrollToOffset({ offset: 0 });
    Keyboard.dismiss();
    setLoading(true);
    let query = supabase.from('population').select('*');
    if (input1 !== '') {
      titleFilter1 !== 'GIOITINH' ?  query = query.ilike(titleFilter1, `%${input1}%`) : query = query.eq(titleFilter1, input1 === 'NAM' ? true : false);
    }
    if (input2 !== '') {
      titleFilter2 !== 'GIOITINH' ?  query = query.ilike(titleFilter2, `%${input2}%`) : query = query.eq(titleFilter2, input2 === 'NAM' ? true : false);
    }
    if (input3 !== '') {
      titleFilter3 !== 'GIOITINH' ?  query = query.ilike(titleFilter3, `%${input3}%`) : query = query.eq(titleFilter3, input3 === 'NAM' ? true : false);
    }

    const { data, error } = await query;

    console.log('data', data);
    console.log('error', error);

    // console.log('filters', filters);

    setSearchResult(data || []);

    // let dataDemoSearch = [];
    // if (data) {
    //   for (let a = 0; a <= data.length; a++) {
    //     if (
    //       data[a] &&
    //       data[a][titleFilter1].match(new RegExp(input1, 'img')) &&
    //       data[a][titleFilter2].match(new RegExp(input2, 'img')) &&
    //       data[a][titleFilter3].match(new RegExp(input3, 'img'))
    //     ) {
    //       dataDemoSearch.push(data[a]);
    //     }
    //   }
    //   setSearchResult(dataDemoSearch);
    // }

    setLoading(false);
  }

  const title = [
    'HOTEN',
    'SOHOK',
    'QUANHE',
    'NAMSINH',
    'GIOITINH',
    'DANTOC',
    'TONGIAO',
    'CCCD',
    'NOITHTRU',
    'TENCHA',
    'TENME',
  ];


  return (
    <>
      <View
        style={{
          alignItems: 'center',
          marginBottom: 0,
          backgroundColor: '#008080',
          borderBottomWidth: 1,
          borderBottomColor: 'black',
          height: 170 + insets.top,
          paddingTop: insets.top,
        }}
      >
        <View
          style={{
            marginTop: 10,
            marginBottom: 5,
            width: '100%',
            borderRadius: 10,
            flexDirection: 'row',
            // backgroundColor:'red',
            justifyContent: 'space-between',
            paddingLeft: 10,
            paddingRight: 10,
          }}
        >
          <View
            style={{
              flexDirection: 'column',
              // backgroundColor:'green',
              width: '90%',
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                // backgroundColor: 'blue',
                display: 'flex',
              }}
            >
              <View
                style={{
                  position: 'relative',
                  width: '25%',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingLeft: 5,
                  paddingRight: 5,
                }}
              >
                <SelectDropdown
                  data={title}
                  onSelect={(selectedItem, index) => {
                    console.log(selectedItem, index);

                    setTitleFilter1(selectedItem);
                  }}
                  renderButton={(selectedItem, isOpened) => {
                    return (
                      <View style={styles.dropdownButtonStyle}>
                        <Text style={styles.dropdownButtonTxtStyle}>
                          {titleFilter1 + '\u25BC'}
                        </Text>
                      </View>
                    );
                  }}
                  renderItem={(item, index, isSelected) => {
                    return (
                      <View
                        style={{
                          ...styles.dropdownItemStyle,
                          ...(isSelected && { backgroundColor: '#D2D9DF' }),
                        }}
                      >
                        {/* <Icon name={item.icon} style={styles.dropdownItemIconStyle} /> */}
                        <Text style={styles.dropdownItemTxtStyle}>{item}</Text>
                      </View>
                    );
                  }}
                  showsVerticalScrollIndicator={false}
                  dropdownStyle={styles.dropdownMenuStyle}
                />
              </View>

              <TextInput
                style={{
                  backgroundColor: 'white',
                  borderRadius: 10,
                  paddingLeft: 10,
                  borderColor: 'black',
                  borderWidth: 2,
                  // paddingTop: 10,
                  // paddingBottom: 10,
                  display: 'flex',
                  flex: 1,
                  height: 39,
                  fontSize: 13,
                  lineHeight: 11,
                }}
                value={input1}
                autoCapitalize="characters"
                selectTextOnFocus={true}
                onChangeText={text => setInput1(text)}
                placeholder="Nhập từ khóa..."
                placeholderTextColor={'gray'}
                onSubmitEditing={() => pushToSearch()}
              ></TextInput>
            </View>

            <View
              style={{
                flexDirection: 'row',
                // backgroundColor: 'blue',
                display: 'flex',
              }}
            >
              <View
                style={{
                  position: 'relative',
                  width: '25%',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingLeft: 5,
                  paddingRight: 5,
                }}
              >
                <SelectDropdown
                  data={title}
                  onSelect={(selectedItem, index) => {
                    console.log(selectedItem, index);

                    setTitleFilter2(selectedItem);
                  }}
                  renderButton={(selectedItem, isOpened) => {
                    return (
                      <View style={styles.dropdownButtonStyle}>
                        <Text style={styles.dropdownButtonTxtStyle}>
                          {titleFilter2 + '\u25BC'}
                        </Text>
                      </View>
                    );
                  }}
                  renderItem={(item, index, isSelected) => {
                    return (
                      <View
                        style={{
                          ...styles.dropdownItemStyle,
                          ...(isSelected && { backgroundColor: '#D2D9DF' }),
                        }}
                      >
                        {/* <Icon name={item.icon} style={styles.dropdownItemIconStyle} /> */}
                        <Text style={styles.dropdownItemTxtStyle}>{item}</Text>
                      </View>
                    );
                  }}
                  showsVerticalScrollIndicator={false}
                  dropdownStyle={styles.dropdownMenuStyle}
                />
              </View>

              <TextInput
                style={{
                  backgroundColor: 'white',
                  borderRadius: 10,
                  paddingLeft: 10,
                  borderColor: 'black',
                  borderWidth: 2,
                  // paddingTop: 10,
                  // paddingBottom: 10,
                  display: 'flex',
                  flex: 1,
                  height: 39,
                  fontSize: 13,
                  lineHeight: 11,
                }}
                autoCapitalize="characters"
                value={input2}
                selectTextOnFocus={true}
                onChangeText={text => setInput2(text)}
                placeholder="Nhập từ khóa..."
                placeholderTextColor={'gray'}
                onSubmitEditing={() => pushToSearch()}
              ></TextInput>
            </View>

            <View
              style={{
                flexDirection: 'row',
                // backgroundColor: 'blue',
                display: 'flex',
              }}
            >
              <View
                style={{
                  position: 'relative',
                  width: '25%',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingLeft: 5,
                  paddingRight: 5,
                }}
              >
                <SelectDropdown
                  data={title}
                  onSelect={(selectedItem, index) => {
                    console.log(selectedItem, index);

                    setTitleFilter3(selectedItem);
                  }}
                  renderButton={(selectedItem, isOpened) => {
                    return (
                      <View style={styles.dropdownButtonStyle}>
                        <Text style={styles.dropdownButtonTxtStyle}>
                          {titleFilter3 + '\u25BC'}
                        </Text>
                      </View>
                    );
                  }}
                  renderItem={(item, index, isSelected) => {
                    return (
                      <View
                        style={{
                          ...styles.dropdownItemStyle,
                          ...(isSelected && { backgroundColor: '#D2D9DF' }),
                        }}
                      >
                        {/* <Icon name={item.icon} style={styles.dropdownItemIconStyle} /> */}
                        <Text style={styles.dropdownItemTxtStyle}>{item}</Text>
                      </View>
                    );
                  }}
                  showsVerticalScrollIndicator={false}
                  dropdownStyle={styles.dropdownMenuStyle}
                />
              </View>

              <TextInput
                style={{
                  backgroundColor: 'white',
                  borderRadius: 10,
                  paddingLeft: 10,
                  borderColor: 'black',
                  borderWidth: 2,
                  // paddingTop: 10,
                  // paddingBottom: 10,
                  display: 'flex',
                  flex: 1,
                  height: 39,
                  fontSize: 13,
                  lineHeight: 11,
                }}
                autoCapitalize="characters"
                value={input3}
                selectTextOnFocus={true}
                onChangeText={text => setInput3(text)}
                placeholder="Nhập từ khóa..."
                placeholderTextColor={'gray'}
                onSubmitEditing={() => pushToSearch()}
              ></TextInput>
            </View>
          </View>
          <View
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              // backgroundColor: 'blue',
              width: '10%',
              position: 'relative',
            }}
          >
            <TouchableOpacity
              style={{
                padding: 5,
                width: 30,
                height: 39 * 3,
                backgroundColor: 'red',
                borderRadius: 4,
                borderWidth: 2,
                justifyContent: 'center',
                borderRadius: 10,
              }}
              onPress={() => {
                setInput1('');
                setInput2('');
                setInput3('');
                setTitleFilter1('HOTEN');
                setTitleFilter2('HOTEN');
                setTitleFilter3('HOTEN');
              }}
            >
              <Text
                style={{
                  textAlign: 'center',
                  color: 'white',
                  fontWeight: 'bold',
                }}
              >
                X
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <View
          style={{
            flexDirection: 'row',
            display: 'flex',
            justifyContent: 'space-evenly',
            width: '100%',
          }}
        >
          <Text style={{ lineHeight: 30, color: 'white', fontSize: 14 }}>
            Số lượng kết quả:
            <Text style={{ fontWeight: 'bold' }}> {searchResult.length}</Text>
          </Text>

          <TouchableOpacity
            onPress={() => pushToSearch()}
            style={{
              width: 80,
              height: 30,
              backgroundColor: 'gray',
              justifyContent: 'center',
              alignItems: 'center',
              borderRadius: 10,
              borderColor: 'black',
              borderWidth: 2,
              color: 'black',
            }}
          >
            <Text style={{ color: 'white', fontWeight: 'bold' }}>Search</Text>
          </TouchableOpacity>
        </View>
      </View>
      {loading && (
        <Text
          style={{
            textAlign: 'center',
            fontWeight: 'bold',
            fontSize: 16,
            backgroundColor: 'black',
            color: 'white',
            padding: 5,
          }}
        >
          Đang tải ...
        </Text>
      )}

      <View
        style={{
          paddingLeft: 20,
          paddingRight: 20,
          marginBottom: 170 + insets.top,
        }}
      >
        {searchResult.length ? (
          <FlatList
            // ref={()=>{FlatListToScroll}}
            ref={ref => {
              global.SearchPopulationRef = ref;
            }}
            data={searchResult}
            renderItem={(item, index) => (
              <Item item={item.item} index={item.index + 1} />
            )}
          />
        ) : (
          <TouchableOpacity
            style={{
              height: '100%',
              width: '100%',
              // backgroundColor:'red'
            }}
            onPress={() => Keyboard.dismiss()}
          ></TouchableOpacity>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  dropdownButtonStyle: {
    width: '100%',
    height: 20,
    backgroundColor: '#E9ECEF',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    textAlign: 'center',
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  dropdownButtonTxtStyle: {
    flex: 1,
    fontSize: 9,
    fontWeight: '500',
    color: '#151E26',
    textAlign: 'center',
    // backgroundColor:'red',
    // display:'flex',
    // flex:1,
    // width:'120%',
  },
  dropdownMenuStyle: {
    backgroundColor: '#E9ECEF',
    borderRadius: 8,
  },
  dropdownItemStyle: {
    width: '100%',
    flexDirection: 'row',
    paddingHorizontal: 3,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 5,
    borderBottomColor: 'black',
    borderBottomWidth: 1,
  },
  dropdownItemTxtStyle: {
    flex: 1,
    fontSize: 11,
    fontWeight: '500',
    color: '#151E26',
  },
});
