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

  const [visibleFilters, setVisibleFilters] = useState(1);

  // const externalDirectoryPath = `${RNFS.ExternalDirectoryPath}`;
  const insets = useSafeAreaInsets(); // lất chiều cao để manu top iphone

  // const HomeScreen = useContext(RefOfHome);

  let data = population;
  useEffect(() => {
    async function getUser() {
      const { data: user } = await supabase.auth.getUser();
      console.log('auth.uid():', user.user?.id);
    }
    getUser();
  }, []);

  function Item({ item, index }) {
    const isEven = index % 2 === 0;

    return (
      <TouchableOpacity
        onPress={() =>
          navigation.push('getOneFamily', {
            screen: item['SOHOK'],
            CCCD: item['CCCD'],
          })
        }
        style={{
          backgroundColor: isEven ? '#F8F9FA' : '#E9ECEF',
          marginVertical: 6,
          padding: 12,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: '#DEE2E6',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
          elevation: 2,
        }}
      >
        {/* STT và số hồ sơ */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 6,
          }}
        >
          <Text style={{ fontSize: 12, color: '#6C757D' }}>STT: {index}</Text>
          <Text style={{ fontSize: 12, color: '#6C757D' }}>
            Số HSHK: {item['SOHOK']}
          </Text>
        </View>

        {/* Họ tên nổi bật */}
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

        {/* Thông tin chi tiết */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          <Text style={styles.infoText}>Ngày sinh: {item['NAMSINH']}</Text>
          <Text style={styles.infoText}>
            Giới tính: {item['GIOITINH'] ? 'Nam' : 'Nữ'}
          </Text>
          <Text style={styles.infoText}>Cha: {item['TENCHA']}</Text>
          <Text style={styles.infoText}>Mẹ: {item['TENME']}</Text>
          <Text style={styles.infoText}>Dân tộc: {item['DANTOC']}</Text>
          <Text style={styles.infoText}>Tôn giáo: {item['TONGIAO']}</Text>
          <Text style={styles.infoText}>CCCD: {item['CCCD']}</Text>
          <Text style={styles.infoText}>Địa chỉ: {item['NOITHTRU']}</Text>
        </View>
      </TouchableOpacity>
    );
  }
  async function pushToSearch() {
    global.SearchPopulationRef &&
      global.SearchPopulationRef.scrollToOffset({ offset: 0 });
    Keyboard.dismiss();
    setLoading(true);
    let query = supabase.from('population').select('*');
    if (input1 !== '') {
      titleFilter1 !== 'GIOITINH'
        ? (query = query.ilike(titleFilter1, `%${input1}%`))
        : (query = query.eq(titleFilter1, input1 === 'NAM' ? true : false));
    }
    if (input2 !== '') {
      titleFilter2 !== 'GIOITINH'
        ? (query = query.ilike(titleFilter2, `%${input2}%`))
        : (query = query.eq(titleFilter2, input2 === 'NAM' ? true : false));
    }
    if (input3 !== '') {
      titleFilter3 !== 'GIOITINH'
        ? (query = query.ilike(titleFilter3, `%${input3}%`))
        : (query = query.eq(titleFilter3, input3 === 'NAM' ? true : false));
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
          backgroundColor: '#008080',
          paddingTop: insets.top + 10,
          paddingBottom: 6,
          borderBottomWidth: 1,
          borderBottomColor: '#004d4d',
        }}
      >
        {/* 🔍 Bộ lọc 3 dòng */}
        <View
          style={{
            width: '95%',
            backgroundColor: '#fff',
            borderRadius: 12,
            // paddingVertical: 10,
            paddingHorizontal: 10,
            shadowColor: '#000',
            shadowOpacity: 0.1,
            shadowRadius: 5,
            elevation: 3,
          }}
        >
          {[1, 2, 3].slice(0, visibleFilters).map(num => {
            const currentTitle =
              num === 1
                ? titleFilter1
                : num === 2
                ? titleFilter2
                : titleFilter3;
            const currentInput =
              num === 1 ? input1 : num === 2 ? input2 : input3;
            const setCurrentInput =
              num === 1 ? setInput1 : num === 2 ? setInput2 : setInput3;

            const keyboardType = ['NAMSINH'].includes(currentTitle)
              ? 'numeric'
              : 'default';

            const CapitalBool = ['NAMSINH'].includes(currentTitle)
              ? 'none'
              : 'characters';

            return (
              <View
                key={num}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: 8,
                  height: 40,
                  marginTop: num == 1 ? 8 :0
                }}
              >
                <SelectDropdown
                  data={title}
                  onSelect={selectedItem => {
                    if (num === 1) setTitleFilter1(selectedItem);
                    if (num === 2) setTitleFilter2(selectedItem);
                    if (num === 3) setTitleFilter3(selectedItem);
                  }}
                  renderButton={selectedItem => (
                    <View
                      style={{
                        backgroundColor: '#e0f2f1',
                        borderRadius: 8,
                        paddingVertical: 6,
                        paddingHorizontal: 8,
                        borderWidth: 1,
                        borderColor: '#ccc',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          color: '#006666',
                          fontWeight: '600',
                        }}
                      >
                        {currentTitle} ▼
                      </Text>
                    </View>
                  )}
                  renderItem={(item, index, isSelected) => (
                    <View
                      style={{
                        paddingVertical: 6,
                        paddingHorizontal: 10,
                        backgroundColor: isSelected ? '#d0f0ef' : '#fff',
                      }}
                    >
                      <Text style={{ fontSize: 13, color: '#004d4d' }}>
                        {item}
                      </Text>
                    </View>
                  )}
                  dropdownStyle={{
                    borderRadius: 8,
                    backgroundColor: '#fff',
                    borderWidth: 1,
                    borderColor: '#ccc',
                  }}
                />

                <TextInput
                  style={{
                    flex: 1,
                    backgroundColor: '#f9f9f9',
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: '#ccc',
                    marginLeft: 8,
                    paddingHorizontal: 10,
                    fontSize: 13,
                    color: '#333',
                    height: 38,
                  }}
                  value={currentInput}
                  onChangeText={setCurrentInput}
                  autoCapitalize={CapitalBool}
                  keyboardType={keyboardType} // ✅ tự đổi theo titleFilter
                  placeholder="Nhập từ khóa..."
                  placeholderTextColor="#999"
                  selectTextOnFocus={true}
                  onSubmitEditing={() => pushToSearch()}
                />
              </View>
            );
          })}
        </View>

        {/* 🔘 Nút X và Search */}
        <View
          style={{
            width: '95%',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 10,
          }}
        >
          <TouchableOpacity
            style={{
              backgroundColor: '#e74c3c',
              width: 35,
              height: 35,
              borderRadius: 22.5,
              alignItems: 'center',
              justifyContent: 'center',
              elevation: 3,
              marginRight:10
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
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>
              X
            </Text>
          </TouchableOpacity>
          {visibleFilters < 3 ? (
            <TouchableOpacity
              onPress={() => setVisibleFilters(prev => Math.min(prev + 1, 3))}
              style={{
                paddingHorizontal: 10,
                height: 35,
                borderRadius: 8,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: '#04c9dfff',
              }}
            >
              <Text
                style={{ color: 'white', fontSize: 13, fontWeight: 'bold' }}
              >
                + Thêm
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => setVisibleFilters(prev => Math.min(prev - 2))}
              style={{
                paddingHorizontal: 10,
                height: 35,
                borderRadius: 8,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: '#b79902ff',
              }}
            >
              <Text
                style={{ color: 'white', fontSize: 13, fontWeight: 'bold' }}
              >
                Đóng
              </Text>
            </TouchableOpacity>
          )}

          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 14 }}>
              Số lượng kết quả:{' '}
              <Text style={{ fontWeight: 'bold' }}>{searchResult.length}</Text>
            </Text>
          </View>

          <TouchableOpacity
            style={{
              backgroundColor: '#00b894',
              borderRadius: 22.5,
              paddingHorizontal: 10,
              height: 45,
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: 1,
              borderColor: '#00695c',
              elevation: 3,
            }}
            onPress={() => pushToSearch()}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>
              Search
            </Text>
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
          marginBottom: 128 + (visibleFilters - 1) * 48    + insets.top,
        }}
      >
        {searchResult.length ? (
          <FlatList
            onScrollBeginDrag={() => Keyboard.dismiss()}
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
  infoText: {
    fontSize: 13,
    color: '#495057',
    width: '50%', // chia 2 cột
    marginBottom: 2,
  },
});
