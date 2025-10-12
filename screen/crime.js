import SelectDropdown from 'react-native-select-dropdown';
import React, { useState, useRef, useEffect } from 'react';
import {
  Text,
  TextInput,
  View,
  TouchableOpacity,
  FlatList,
  Keyboard,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
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

  const [locationInput, setLocationInput] = useState('');

  const [searchResutl, setSearchResult] = useState([]);
  const navigation = useNavigation();

  const insets = useSafeAreaInsets(); // lất chiều cao để manu top iphone

  // let data = crime;

  //   function Item({ item, index }) {

  //     const { data, error } = supabase
  //       .storage
  //       .from("imageCrime")
  //       .getPublicUrl('subject/'+item['CCCD']+".jpg");

  //       // console.log("Public URL:", data);
  //       // console.log("Error:", error)

  // async function checkImageExists(url) {
  //   try {
  //     const response = await fetch(url, { method: "HEAD" });
  //     return response.ok; // true nếu tồn tại, false nếu 404
  //   } catch (err) {
  //     return false;
  //   }
  // }

  // let imageExists = false

  // checkImageExists(data.publicUrl).then(value => {
  //   imageExists = (value); // đây là giá trị thật
  // });

  //   console.log('Image exists:', imageExists);

  //     let chargeArr = item['CHARGE']?.split(';');
  //     let fullInfoCrime = [];

  //     for (let a = 0; a < chargeArr?.length; a++) {
  //       fullInfoCrime.push([
  //         [a + 1],
  //         item['CHARGE']?.split(';')[a] ? item['CHARGE']?.split(';')[a] : '',
  //         item['JUDGMENT']?.split(';')[a] ? item['JUDGMENT']?.split(';')[a] : '',
  //         item['DAYARRES']?.split(';')[a] ? item['DAYARRES']?.split(';')[a] : '',
  //         item['FREEDAY']?.split(';')[a] ? item['FREEDAY']?.split(';')[a] : '',
  //         item['DETENTION']?.split(';')[a]
  //           ? item['DETENTION']?.split(';')[a]
  //           : '',
  //       ]);
  //     }

  //     return (
  //       <View
  //         style={{
  //           flexDirection: 'collumn',
  //           backgroundColor: index % 2 ? '#CCCCCC' : 'white',
  //           marginTop: 10,
  //           flexWrap: 'wrap',
  //           padding: 10,
  //           borderWidth: 2,
  //           borderColor: 'black',
  //           borderRadius: 5,
  //           justifyContent: 'space-between',
  //         }}
  //       >
  //         <View style={{ flexDirection: 'row' }}>
  //           <Text style={{ fontWeight: 'bold' }}>
  //             Số thứ tự: <Text style={{ fontWeight: '400' }}>{index}</Text>
  //           </Text>
  //         </View>
  //         <View
  //           style={{
  //             flexDirection: 'row',
  //             width: '100%',
  //             justifyContent: 'space-between',
  //             marginBottom: 10,
  //           }}
  //         >
  //           <View style={{ flex: 1 }}>
  //             <Text style={{ marginRight: 10, fontWeight: 'bold' }}>
  //               Họ và tên: <Text style={{ color: 'red' }}>{item['HOTEN']}</Text>
  //             </Text>
  //             <Text style={{ marginRight: 10, fontWeight: 'bold' }}>
  //               Tên khác:{' '}
  //               <Text style={{ fontWeight: '400' }}>{item['TENKHAC']}</Text>
  //             </Text>
  //             <Text style={{ marginRight: 10, fontWeight: 'bold' }}>
  //               Ngày sinh:{' '}
  //               <Text style={{ fontWeight: '400' }}>{item['NAMSINH']}</Text>
  //             </Text>

  //             <Text style={{ marginRight: 10, fontWeight: 'bold' }}>
  //               Giới tính:{' '}
  //               <Text style={{ fontWeight: '400' }}>{item['GIOITINH'] ? 'NAM' : 'NỮ'}</Text>
  //             </Text>
  //             <Text style={{ marginRight: 10, fontWeight: 'bold' }}>
  //               Số ĐDCN: <Text style={{ fontWeight: '400' }}>{item['CCCD']}</Text>
  //             </Text>
  //             <Text style={{ marginRight: 10, fontWeight: 'bold' }}>
  //               Tên cha:{' '}
  //               <Text style={{ fontWeight: '400' }}>{item['TENCHA']}</Text>
  //             </Text>
  //             <Text style={{ marginRight: 10, fontWeight: 'bold' }}>
  //               Tên mẹ: <Text style={{ fontWeight: '400' }}>{item['TENME']}</Text>
  //             </Text>
  //             <Text style={{ marginRight: 10, fontWeight: 'bold' }}>
  //               Dân tộc:{' '}
  //               <Text style={{ fontWeight: '400' }}>{item['DANTOC']}</Text>
  //             </Text>
  //             <Text style={{ marginRight: 10, fontWeight: 'bold' }}>
  //               Tôn giáo:{' '}
  //               <Text style={{ fontWeight: '400' }}>{item['TONGIAO']}</Text>
  //             </Text>
  //             <Text style={{ marginRight: 10, fontWeight: 'bold' }}>
  //               Địa chỉ:{' '}
  //               <Text style={{ fontWeight: '400' }}>{item['NOITHTRU']}</Text>
  //             </Text>
  //           </View>
  //           <View
  //             style={{
  //               flex: 1,
  //               justifyContent: 'center',
  //               alignItems: 'center',
  //               // backgroundColor: 'yellow',
  //             }}
  //           >
  //             <Image
  //               style={{ width: '100%', height: 200 }}
  //               source={
  //                   imageExists ? {uri:data.publicUrl} : require('../asset/unknow.jpg')
  //               }
  //             />
  //           </View>
  //         </View>
  //         <View>
  //           <Table borderStyle={{ borderWidth: 2, borderColor: '#c8e1ff' }}>
  //             <Row
  //               data={tableHead}
  //               widthArr={widthArr}
  //               style={{ backgroundColor: '#f1f8ff' }}
  //               textStyle={{
  //                 margin: 6,
  //                 fontWeight: 'bold',
  //                 textAlign: 'center',
  //                 fontSize: 12,
  //               }}
  //             />
  //           </Table>
  //           <Table borderStyle={{ borderWidth: 1, borderColor: '#C1C0B9' }}>
  //             {fullInfoCrime.map((rowData, index) => {
  //               return (
  //                 <Row
  //                   key={index}
  //                   data={rowData}
  //                   widthArr={widthArr}
  //                   style={
  //                     rowData &&
  //                     (rowData[1].includes('?') || rowData[4].includes('?'))
  //                       ? { backgroundColor: '#c48207ff' }
  //                       : { backgroundColor: '#f1f8ff' }
  //                   }
  //                   textStyle={{ margin: 4, fontSize: 10, textAlign: 'center' }}
  //                 />
  //               );
  //             })}
  //           </Table>
  //         </View>
  //       </View>
  //     );
  //   }

  async function pushToSearch() {
    global.SearchCrimeRef &&
      global.SearchCrimeRef.scrollToOffset({ offset: 0 });
    Keyboard.dismiss();
    setLoading(true);
    let query = supabase.from('crime').select('*');
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
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 5} // Điều chỉnh offset cho iOS
    >
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
          }}
        >
          {[1, 2, 3].map(num => (
            <View
              key={num}
              style={{
                flexDirection: 'row',
                marginBottom: num === 3 ? 0 : 6,
              }}
            >
              <View
                style={{
                  // width: '30%',
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
                        }[
                          num === 1
                            ? titleFilter1
                            : num === 2
                            ? titleFilter2
                            : titleFilter3
                        ] || 'CHỌN MỤC') + ' ▼'}
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

              <TextInput
                style={{
                  backgroundColor: '#fff',
                  borderRadius: 8,
                  borderColor: '#ccc',
                  borderWidth: 1,
                  paddingLeft: 10,
                  flex: 1,
                  height: 40,
                  fontSize: 13,
                }}
                autoCapitalize="characters"
                value={num === 1 ? input1 : num === 2 ? input2 : input3}
                selectTextOnFocus={true}
                onChangeText={text =>
                  num === 1
                    ? setInput1(text)
                    : num === 2
                    ? setInput2(text)
                    : setInput3(text)
                }
                placeholder="Nhập từ khóa..."
                placeholderTextColor={'gray'}
                onSubmitEditing={() => pushToSearch()}
              />
            </View>
          ))}

          {/* Hàng dưới cùng */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginTop: 8,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 13 }}>
              Kết quả:{' '}
              <Text style={{ fontWeight: 'bold' }}>{searchResutl.length}</Text>
            </Text>

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
          marginBottom: 210 + insets.top,
          // backgroundColor:'black'
        }}
      >
        {searchResutl.length ? (
          <FlatList
            onScrollBeginDrag={() => Keyboard.dismiss()}
            ref={ref => {
              global.SearchCrimeRef = ref;
            }}
            data={searchResutl}
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
    </KeyboardAvoidingView>
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
