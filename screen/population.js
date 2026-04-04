import SelectDropdown from 'react-native-select-dropdown';
import { useState, useEffect } from 'react';
import {
  Text,
  TextInput,
  View,
  TouchableOpacity,
  FlatList,
  Keyboard,
  StyleSheet,
  Alert,
  PermissionsAndroid,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from './lib.js';
import { useNetInfo } from '@react-native-community/netinfo';

import VoiceToText, {
  VoiceToTextEvents,
} from '@appcitor/react-native-voice-to-text';

export function Population() {
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

  const [isListening, setIsListening] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  const insets = useSafeAreaInsets(); // lất chiều cao để manu top iphone

  const netInfo = useNetInfo();
  let internetConnected = netInfo.isConnected;

  useEffect(() => {
    async function getUser() {
      const { data: user } = await supabase.auth.getUser();
      // console.log('auth.uid():', user.user?.id);
    }
    getUser();

    const resultsListener = VoiceToText.addEventListener(
      VoiceToTextEvents.RESULTS,
      event => {
        setInput1(event.value.toUpperCase());
      },
    );

    const startListener = VoiceToText.addEventListener(
      VoiceToTextEvents.START,
      () => setIsListening(true),
    );

    const endListener = VoiceToText.addEventListener(
      VoiceToTextEvents.END,
      () => setIsListening(false),
    );

    // Clean up
    return () => {
      VoiceToText.destroy();
      resultsListener.remove();
      startListener.remove();
      endListener.remove();
      setIsListening(false);
    };
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
          backgroundColor: item['VANGNHA']
            ? '#ffcccc'
            : isEven
            ? '#F8F9FA'
            : '#E9ECEF',
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
          <Text style={styles.infoText}>Nơi ở hiện tại: {item['NOIOHIENTAI']}</Text>
          <Text style={styles.infoText}>
            VẮNG NHÀ: {item['VANGNHA'] ? 'VẮNG' : 'KHÔNG'}
          </Text>
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
      !['GIOITINH', 'VANGNHA'].includes(titleFilter1)
        ? titleFilter1 == 'NAMSINH'
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
        !['GIOITINH','VANGNHA'].includes(titleFilter2)
        ? titleFilter2 == 'NAMSINH'
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
      !['GIOITINH','VANGNHA'].includes(titleFilter3)
        ? titleFilter3 == 'NAMSINH'
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
            titleFilter3 === 'GIOITINH' ? input3 === 'NAM' : input3  === 'VẮNG',
          ));
    }

    const { data, error } = await query;

    console.log('data', data);
    console.log('error', error);

    setSearchResult(data || []);

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
    'VANGNHA',
  ];

  async function requestMicrophonePermission() {
    if (Platform.OS !== 'android') return true;

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'Microphone Permission',
          message:
            'This app needs access to your microphone for speech recognition',
          buttonPositive: 'OK',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn(err);
      return false;
    }
  }
  const toggleListening = async () => {
    const ok = await requestMicrophonePermission();
    if (!ok) return;

    try {
      if (isListening) {
        await VoiceToText.stopListening();
        setIsListening(false);
      } else {
        await VoiceToText.startListening();
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
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

            // console.log('currentTitle:',currentTitle);

            const currentInput =
              num === 1 ? input1 : num === 2 ? input2 : input3;
            const setCurrentInput =
              num === 1 ? setInput1 : num === 2 ? setInput2 : setInput3;

            const keyboardType = ['NAMSINH', 'CCCD'].includes(currentTitle)
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
                  marginTop: num == 1 ? 8 : 0,
                }}
              >
                <SelectDropdown
                  key={resetKey + num}
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
                    marginLeft: 8,
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
                    autoCapitalize={CapitalBool}
                    keyboardType={keyboardType} // ✅ tự đổi theo titleFilter
                    placeholder={
                      currentTitle === 'VANGNHA'
                        ? 'Nhập VẮNG hoặc KHÔNG'
                        : currentTitle !== 'NAMSINH'
                        ? 'Nhập từ khóa...'
                        : "Dùng . , - hoặc viết liền để thay '/'"
                    }
                    placeholderTextColor="#999"
                    selectTextOnFocus={true}
                    onSubmitEditing={() => pushToSearch()}
                  />
                  {num == 1 && (
                    <TouchableOpacity
                      onPress={toggleListening}
                      style={{ marginLeft: 8 }}
                    >
                      <Image
                        source={
                          !isListening
                            ? require('../asset/micro-on.png')
                            : require('../asset/micro-off.png')
                        }
                        style={{
                          width: 24,
                          height: 24,
                        }}
                      />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
              // </View>
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
              marginRight: 10,
            }}
            onPress={() => {
              setInput1('');
              setInput2('');
              setInput3('');
              setTitleFilter1('HOTEN');
              setTitleFilter2('HOTEN');
              setTitleFilter3('HOTEN');
              setResetKey(prev => prev + 1);
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
          marginBottom: 128 + (visibleFilters - 1) * 48 + insets.top,
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
