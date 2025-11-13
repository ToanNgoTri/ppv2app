import SelectDropdown from 'react-native-select-dropdown';
import React, { useState, useRef, useEffect } from 'react';
import {
  Text,
  TextInput,
  View,
  TouchableOpacity,
  FlatList,
  Keyboard,
  StyleSheet,
  PermissionsAndroid,
  Image,
} from 'react-native';
// import crime from '../asset/crime.json';
import { useNavigation } from '@react-navigation/native';
import { Table, Row, Rows } from 'react-native-table-component';
// import RNFS from 'react-native-fs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from './lib.js';
import { Item } from './component/itemCrime.js';

export function Crime() {
  const [input1, setInput1] = useState('');
  const [input2, setInput2] = useState('');
  const [input3, setInput3] = useState('');

  const [titleFilter1, setTitleFilter1] = useState('HOTEN');
  const [titleFilter2, setTitleFilter2] = useState('HOTEN');
  const [titleFilter3, setTitleFilter3] = useState('HOTEN');

  const [loading, setLoading] = useState(false);

  const [visibleFilters, setVisibleFilters] = useState(1);

  const [searchResutl, setSearchResult] = useState([]);


  const insets = useSafeAreaInsets(); // lất chiều cao để manu top iphone

  async function pushToSearch() {
    global.SearchCrimeRef &&
      global.SearchCrimeRef.scrollToOffset({ offset: 0 });
    Keyboard.dismiss();
    setLoading(true);
    let query = supabase.from('crime').select('*');
    if (input1 !== '') {
      titleFilter1 !== 'GIOITINH'
        ? titleFilter1 == 'NAMSINH' ||
          titleFilter1 == 'DAYARRES' ||
          titleFilter1 == 'FREEDAY'
          ? (query = query.ilike(
              titleFilter1,
              input1.match(/\.|,|-/gim)
                ? `%${input1.replace(/\.|,|-/gim, '/')}%`
                : input1.length <= 4
                ? `%${input1}%`
                : input1.length < 8
                ? `%${input1.replace(/^(\d{2})(\d{4})$/, '$1/$2')}%`
                : `%${input1.replace(/^(\d{2})(\d{2})(\d{4})$/, '$1/$2/$3')}%`,
            ))
          : (query = query.ilike(titleFilter1, `%${input1}%`))
        : (query = query.eq(titleFilter1, input1 === 'NAM' ? true : false));
    }
    if (input2 !== '') {
      titleFilter2 !== 'GIOITINH'
        ? titleFilter2 == 'NAMSINH' ||
          titleFilter2 == 'DAYARRES' ||
          titleFilter2 == 'FREEDAY'
          ? (query = query.ilike(
              titleFilter2,
              input2.match(/\.|,|-/gim)
                ? `%${input2.replace(/\.|,|-/gim, '/')}%`
                : input2.length <= 4
                ? `%${input2}%`
                : input2.length < 8
                ? `%${input2.replace(/^(\d{2})(\d{4})$/, '$1/$2')}%`
                : `%${input2.replace(/^(\d{2})(\d{2})(\d{4})$/, '$1/$2/$3')}%`,
            ))
          : (query = query.ilike(titleFilter2, `%${input2}%`))
        : (query = query.eq(titleFilter2, input2 === 'NAM' ? true : false));
    }
    if (input3 !== '') {
      titleFilter3 !== 'GIOITINH'
        ? titleFilter3 == 'NAMSINH' ||
          titleFilter3 == 'DAYARRES' ||
          titleFilter3 == 'FREEDAY'
          ? (query = query.ilike(
              titleFilter3,
              input3.match(/\.|,|-/gim)
                ? `%${input3.replace(/\.|,|-/gim, '/')}%`
                : input3.length <= 4
                ? `%${input3}%`
                : input3.length < 8
                ? `%${input3.replace(/^(\d{2})(\d{4})$/, '$1/$2')}%`
                : `%${input3.replace(/^(\d{2})(\d{2})(\d{4})$/, '$1/$2/$3')}%`,
            ))
          : (query = query.ilike(titleFilter3, `%${input3}%`))
        : (query = query.eq(titleFilter3, input3 === 'NAM' ? true : false));
    }

    const { data, error } = await query;

    setSearchResult(data || []);
    setLoading(false);
    console.log('Search result:', data);
  }

  const title = [
    'HOTEN',
    'SOHOK',
    'TENKHAC',
    'NAMSINH',
    'GIOITINH',
    'DANTOC',
    'TONGIAO',
    'CCCD',
    'NOITHTRU',
    'TENCHA',
    'TENME',
    'CHARGE',
    'JUDGMENT',
    'DETENTION',
    'DAYARRES',
    'FREEDAY',
  ];

  const receiveLocation = async receive => {
    const { data, error } = await supabase
      .from('crime')
      .update({ LOCATION: receive.location }) // giá trị mới
      .eq('CCCD', receive.CCCD); // điều kiện cập nhật
  };


  return (
    <View style={{ flex: 1 }}>
      <View
        style={{
          alignItems: 'center',
          backgroundColor: '#aaaf07ff',
          borderBottomWidth: 1,
          borderBottomColor: '#ddd',
          paddingTop: insets.top + 10,
          paddingBottom: 5,
          paddingHorizontal: 10,
        }}
      >
        {/* Bộ lọc */}
        <View
          style={{
            width: '100%',
            backgroundColor: 'white',
            borderRadius: 12,
            padding: 10,
            paddingBottom: 5,
            shadowColor: '#000',
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
            paddingTop: 0,
          }}
        >
          {[1, 2, 3].slice(0, visibleFilters).map(num => {
            // Lấy giá trị title hiện tại của từng dòng
            const currentTitle =
              num === 1
                ? titleFilter1
                : num === 2
                ? titleFilter2
                : titleFilter3;

            console.log('currentTitle:', currentTitle);

            // Quy định keyboardType tùy theo tiêu chí
            const keyboardType = [
              'NAMSINH',
              'DAYARRES',
              'FREEDAY',
              'CCCD',
            ].includes(currentTitle)
              ? 'numeric'
              : 'default';

            const CapitalBool = [
              'NAMSINH',
              'DAYARRES',
              'FREEDAY',
              'CCCD',
            ].includes(currentTitle)
              ? 'none'
              : 'characters';

            // Lấy input và setter tương ứng
            const currentInput =
              num === 1 ? input1 : num === 2 ? input2 : input3;
            const setCurrentInput =
              num === 1 ? setInput1 : num === 2 ? setInput2 : setInput3;

            return (
              <View
                key={num}
                style={{
                  height: 40,
                  flexDirection: 'row',
                  marginBottom: 7,
                  marginTop: num == 1 ? 7 : 0,
                  // backgroundColor: 'red',
                }}
              >
                <View
                  style={{
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingHorizontal: 5,
                  }}
                >
                  <SelectDropdown
                    data={title}
                    onSelect={(selectedItem, index) => {
                      if (num === 1) setTitleFilter1(selectedItem);
                      else if (num === 2) setTitleFilter2(selectedItem);
                      else setTitleFilter3(selectedItem);
                    }}
                    renderButton={(selectedItem, isOpened) => (
                      <View
                        style={{
                          backgroundColor: '#fafafa',
                          borderRadius: 8,
                          paddingVertical: 6,
                          paddingHorizontal: 8,
                          borderWidth: 1,
                          borderColor: '#ccc',
                        }}
                      >
                        <Text style={{ fontSize: 12, fontWeight: '600' }}>
                          {({
                            HOTEN: 'HỌ TÊN',
                            TENKHAC: 'TÊN KHÁC',
                            GIOITINH: 'GIỚI TÍNH',
                            NAMSINH: 'NĂM SINH',
                            TENCHA: 'TÊN CHA',
                            TENME: 'TÊN MẸ',
                            SOHOK: 'SỐ HSHK',
                            DANTOC: 'DÂN TỘC',
                            TONGIAO: 'TÔN GIÁO',
                            CCCD: 'CCCD',
                            NOITHTRU: 'ĐỊA CHỈ',
                            CHARGE: 'TỘI DANH',
                            JUDGMENT: 'HÌNH PHẠT',
                            DAYARRES: 'NGÀY BẮT',
                            FREEDAY: 'NGÀY TỰ DO',
                            DETENTION: 'TRẠI GIAM',
                          }[currentTitle] || 'CHỌN MỤC') + ' ▼'}
                        </Text>
                      </View>
                    )}
                    renderItem={(item, index, isSelected) => (
                      <View
                        style={{
                          padding: 8,
                          backgroundColor: isSelected ? '#D2D9DF' : 'white',
                        }}
                      >
                        <Text style={{ fontSize: 13 }}>
                          {item == 'CHARGE'
                            ? 'TỘI DANH'
                            : item == 'JUDGMENT'
                            ? 'HÌNH PHẠT'
                            : item == 'DAYARRES'
                            ? 'NGÀY BẮT'
                            : item == 'FREEDAY'
                            ? 'NGÀY TỰ DO'
                            : item == 'DETENTION'
                            ? 'TRẠI GIAM'
                            : item}
                        </Text>
                      </View>
                    )}
                    dropdownStyle={{ borderRadius: 10 }}
                  />
                </View>

                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#f9f9f9',
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: '#ccc',
                    paddingHorizontal: 10,
                    height: 40,
                    flex: 1,
                    // marginLeft: 8,
                  }}
                >
                  <TextInput
                    style={{
                      flex: 1,
                      fontSize: 13,
                      color: '#333',
                    }}
                    value={currentInput}
                    onChangeText={setCurrentInput}
                    placeholder={
                      currentTitle == 'NAMSINH' ||
                      currentTitle == 'DAYARRES' ||
                      currentTitle == 'FREEDAY'
                        ? "Dùng . , - hoặc viết liền để thay '/'"
                        : 'Nhập từ khóa...'
                    }
                    placeholderTextColor={'gray'}
                    selectTextOnFocus={true}
                    autoCapitalize={CapitalBool}
                    keyboardType={keyboardType} // ✅ auto đổi
                    onSubmitEditing={() => pushToSearch()}
                  />

                </View>
              </View>
            );
          })}

          {/* Hàng dưới cùng */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginTop: 0,
              alignItems: 'center',
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                // marginRight: 10,
                alignItems: 'center',
              }}
            >
              <View>
                <Text
                  style={{
                    marginRight: 10,
                    fontSize: 13,
                    textAlign: 'center',
                    textAlignVertical: 'center',
                    justifyContent: 'center',
                  }}
                >
                  Kết quả:{' '}
                  <Text style={{ fontWeight: 'bold' }}>
                    {searchResutl.length}
                  </Text>
                </Text>
              </View>
              {visibleFilters < 3 ? (
                <TouchableOpacity
                  onPress={() =>
                    setVisibleFilters(prev => Math.min(prev + 1, 3))
                  }
                  style={{
                    paddingHorizontal: 15,
                    height: 35,
                    borderRadius: 8,
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: '#198754',
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
                    paddingHorizontal: 15,
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
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                onPress={() => pushToSearch()}
                style={{
                  backgroundColor: '#0d6efd',
                  paddingHorizontal: 15,
                  height: 35,
                  borderRadius: 8,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: 'white', fontWeight: 'bold' }}>
                  Tìm kiếm
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setInput1('');
                  setInput2('');
                  setInput3('');
                  setTitleFilter1('HOTEN');
                  setTitleFilter2('HOTEN');
                  setTitleFilter3('HOTEN');
                }}
                style={{
                  backgroundColor: '#dc3545',
                  width: 35,
                  height: 35,
                  borderRadius: 8,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: 'white', fontWeight: 'bold' }}>X</Text>
              </TouchableOpacity>
            </View>
          </View>
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
          marginBottom: 110 + (visibleFilters - 1) * 47 + insets.top,
        }}
      >
        {searchResutl.length ? (
          <FlatList
            onScrollBeginDrag={() => Keyboard.dismiss()}
            ref={ref => {
              global.SearchCrimeRef = ref;
            }}
            data={searchResutl}
            keyExtractor={item => item.CCCD}
            renderItem={(item, index) => (
              <Item
                item={item.item}
                index={item.index + 1}
                location={receiveLocation}
              />
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
    </View>
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
