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
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
// import crime from '../asset/crime.json';
import { useNetInfo } from '@react-native-community/netinfo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from './lib.js';
import { Item } from './component/itemCrime.js';
import {
  KeyboardAwareScrollView,
  KeyboardAwareFlatList,
} from 'react-native-keyboard-aware-scroll-view';

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

  const [resetDropdownKey, setResetDropdownKey] = useState(0);

  // Bộ lọc phân loại đối tượng (boolean)
  const [flags, setFlags] = useState({
    ANNINH: false,
    MATUY: false,
    TUTHA: false,
    THACD: false,
    TREHU: false,
  });

  const netInfo = useNetInfo();
  let internetConnected = netInfo.isConnected;

  const insets = useSafeAreaInsets(); // lất chiều cao để manu top iphone

  async function pushToSearch() {
    global.SearchCrimeRef &&  global.SearchCrimeRef.scrollToPosition(0, 0);
    console.log('search');
    
    Keyboard.dismiss();
    setLoading(true);
    const buildQuery = () => {
    let query = supabase.from('crime').select('*');
    if (input1 !== '') {
      !['GIOITINH', 'VANGNHA'].includes(titleFilter1)
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
        : (query = query.eq(
            titleFilter1,
            titleFilter1 === 'GIOITINH' ? input1 === 'NAM' : input1 === 'VẮNG',
          ));
    }
    if (input2 !== '') {
      !['GIOITINH', 'VANGNHA'].includes(titleFilter2)
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
        : (query = query.eq(
            titleFilter2,
            titleFilter2 === 'GIOITINH' ? input2 === 'NAM' : input2 === 'VẮNG',
          ));
    }
    if (input3 !== '') {
      !['GIOITINH', 'VANGNHA'].includes(titleFilter3)
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
        : (query = query.eq(
            titleFilter3,
            titleFilter3 === 'GIOITINH' ? input3 === 'NAM' : input3 === 'VẮNG',
          ));
    }

    // Lọc theo phân loại đối tượng (chỉ áp dụng khi được bật)
    Object.entries(flags).forEach(([field, on]) => {
      if (on) query = query.eq(field, true);
    });

    return query;
    };

    // PostgREST giới hạn 1000 dòng/lần -> phân trang để lấy đủ kết quả
    const PAGE = 1000;
    let all = [];
    for (let offset = 0; offset < 500000; offset += PAGE) {
      const { data, error } = await buildQuery().range(offset, offset + PAGE - 1);
      if (error) {
        console.log('Search error:', error);
        break;
      }
      const batch = data || [];
      all = all.concat(batch);
      if (batch.length < PAGE) break; // hết dữ liệu
    }

    setSearchResult(all);
    setLoading(false);
    console.log('Search result:', all.length);
  }

  const FLAG_LABELS = {
    ANNINH: 'An ninh',
    MATUY: 'Ma túy',
    TUTHA: 'Tù tha',
    THACD: 'THA CĐ',
    TREHU: 'Trẻ em hư',
  };

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
    'VANGNHA',
    'GHICHU',
  ];

  const receiveLocation = async receive => {
    const { data, error } = await supabase
      .from('crime')
      .update({ LOCATION: receive.location }) // giá trị mới
      .eq('CCCD', receive.CCCD); // điều kiện cập nhật
  };

  return (
    <>
      <View style={{ flex: 1 }}>
        {!internetConnected && (
          <View
            style={{
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
            }}
          >
            <Text
              style={{
                color: 'white',
                marginBottom: 15,
                fontWeight: 'bold',
              }}
            >
              Vui lòng kiểm tra kết nối mạng ...
            </Text>
            <ActivityIndicator size="large" color="white"></ActivityIndicator>
          </View>
        )}

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
                      key={resetDropdownKey + num}
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
                              VANGNHA: 'VẮNG NHÀ',
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
                          : currentTitle === 'VANGNHA'
                          ? 'Nhập VẮNG hoặc KHÔNG'
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

            {/* Phân loại đối tượng */}
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: 6,
                marginBottom: 7,
              }}
            >
              {Object.keys(FLAG_LABELS).map(field => {
                const on = flags[field];
                return (
                  <TouchableOpacity
                    key={field}
                    onPress={() =>
                      setFlags(prev => ({ ...prev, [field]: !prev[field] }))
                    }
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: 5,
                      paddingHorizontal: 10,
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: on ? '#198754' : '#ccc',
                      backgroundColor: on ? '#198754' : '#fafafa',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: '600',
                        color: on ? 'white' : '#495057',
                      }}
                    >
                      {on ? '✓ ' : ''}
                      {FLAG_LABELS[field]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

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
                      style={{
                        color: 'white',
                        fontSize: 13,
                        fontWeight: 'bold',
                      }}
                    >
                      + Thêm
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={() =>
                      setVisibleFilters(prev => Math.min(prev - 2))
                    }
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
                      style={{
                        color: 'white',
                        fontSize: 13,
                        fontWeight: 'bold',
                      }}
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
                    setFlags({
                      ANNINH: false,
                      MATUY: false,
                      TUTHA: false,
                      THACD: false,
                      TREHU: false,
                    });
                    setResetDropdownKey(prev => prev + 1);
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
            flex: 1,
            paddingLeft: 20,
            paddingRight: 20,
          }}
        >
          {searchResutl.length ? (
            <KeyboardAwareFlatList
              enableOnAndroid={true}
              extraScrollHeight={170}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={{ paddingBottom:  insets.bottom }}
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
