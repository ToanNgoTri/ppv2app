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
} from 'react-native';
// import crime from '../asset/crime.json';
import { useNavigation } from '@react-navigation/native';
import { Table, Row, Rows } from 'react-native-table-component';
// import RNFS from 'react-native-fs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from './lib.js';
import {Item} from './component/item.js'

export function Crime() {
  const [input1, setInput1] = useState('');
  const [input2, setInput2] = useState('');
  const [input3, setInput3] = useState('');

  const [titleFilter1, setTitleFilter1] = useState('HOTEN');
  const [titleFilter2, setTitleFilter2] = useState('HOTEN');
  const [titleFilter3, setTitleFilter3] = useState('HOTEN');

  const [loading, setLoading] = useState(false);

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
    global.SearchCrimeRef && global.SearchCrimeRef.scrollToOffset({ offset: 0 });
    Keyboard.dismiss();
    setLoading(true);
    let query = supabase.from('crime').select('*');
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

  let titelForDropdown = [];

  // useEffect(() => {
  //   console.log('titleFilter1', titleFilter1);
  //   console.log('titleFilter2', titleFilter2);
  //   console.log('titleFilter3', titleFilter3);
  // }, [titleFilter1, titleFilter2, titleFilter3]);

  return (
    <>
      <View
        style={{
          alignItems: 'center',
          marginBottom: 0,
          backgroundColor: '#676363ff',
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
                          {titleFilter1 == 'CHARGE'
                            ? 'TOIDANH'
                            : titleFilter1 == 'JUDGMENT'
                            ? 'HINHPHAT'
                            : titleFilter1 == 'DAYARRES'
                            ? 'NGAYBAT'
                            : titleFilter1 == 'FREEDAY'
                            ? 'NGAYTUDO'
                            : titleFilter1 == 'DETENTION'
                            ? 'TRAIGIAM'
                            : titleFilter1 + '\u25BC'}
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
                        <Text style={styles.dropdownItemTxtStyle}>
                          {item == 'CHARGE'
                            ? 'TOIDANH'
                            : item == 'JUDGMENT'
                            ? 'HINHPHAT'
                            : item == 'DAYARRES'
                            ? 'NGAYBAT'
                            : item == 'FREEDAY'
                            ? 'NGAYTUDO'
                            : item == 'DETENTION'
                            ? 'TRAIGIAM'
                            : item}
                        </Text>
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
                value={input1}
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
                          {titleFilter2 == 'CHARGE'
                            ? 'TOIDANH'
                            : titleFilter2 == 'JUDGMENT'
                            ? 'HINHPHAT'
                            : titleFilter2 == 'DAYARRES'
                            ? 'NGAYBAT'
                            : titleFilter2 == 'FREEDAY'
                            ? 'NGAYTUDO'
                            : titleFilter2 == 'DETENTION'
                            ? 'TRAIGIAM'
                            : titleFilter2 + '\u25BC'}
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
                        <Text style={styles.dropdownItemTxtStyle}>
                          {item == 'CHARGE'
                            ? 'TOIDANH'
                            : item == 'JUDGMENT'
                            ? 'HINHPHAT'
                            : item == 'DAYARRES'
                            ? 'NGAYBAT'
                            : item == 'FREEDAY'
                            ? 'NGAYTUDO'
                            : item == 'DETENTION'
                            ? 'TRAIGIAM'
                            : item}
                        </Text>
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
                          {titleFilter3 == 'CHARGE'
                            ? 'TOIDANH'
                            : titleFilter3 == 'JUDGMENT'
                            ? 'HINHPHAT'
                            : titleFilter3 == 'DAYARRES'
                            ? 'NGAYBAT'
                            : titleFilter3 == 'FREEDAY'
                            ? 'NGAYTUDO'
                            : titleFilter3 == 'DETENTION'
                            ? 'TRAIGIAM'
                            : titleFilter3 + '\u25BC'}
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
                        <Text style={styles.dropdownItemTxtStyle}>
                          {item == 'CHARGE'
                            ? 'TOIDANH'
                            : item == 'JUDGMENT'
                            ? 'HINHPHAT'
                            : item == 'DAYARRES'
                            ? 'NGAYBAT'
                            : item == 'FREEDAY'
                            ? 'NGAYTUDO'
                            : item == 'DETENTION'
                            ? 'TRAIGIAM'
                            : item}
                        </Text>
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
              width: '10%',
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
            // height:25
          }}
        >
          <Text style={{ lineHeight: 30, color: 'white', fontSize: 14 }}>
            Số lượng kết quả:
            <Text style={{ fontWeight: 'bold' }}> {searchResutl.length}</Text>
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
      <Text></Text>
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
