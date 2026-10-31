import { useState, useEffect, useCallback } from 'react';
import {
  Text,
  View,
  FlatList,
  StyleSheet,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
// import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from './lib.js';
import Item from './component/ItemPopulation.js';
import {
  KeyboardAwareScrollView,
  KeyboardAwareFlatList,
} from 'react-native-keyboard-aware-scroll-view';
// import population from '../asset/population.json';

export function GetOneFamily() {
  const [searchResult, setSearchResult] = useState([]);

  const route = useRoute();

  const navigation = useNavigation();
  // Hộ thường trú (population) hoặc tạm trú (tamtru) — cùng schema
  const table = route.params.table || 'population';
  // const insets = useSafeAreaInsets(); // lất chiều cao để manu top iphone

  // let data = [];
  const receiveLocation = async receive => {
    const { data, error } = await supabase
      .from(table)
      .update({ LOCATION: receive.location }) // giá trị mới
      .eq('CCCD', receive.CCCD); // điều kiện cập nhật
  };

  useEffect(() => {
    navigation.setOptions({
      // Tạm trú không có số HSHK thật (SOHOK chỉ là CCCD chủ hộ dựng ra để gom hộ)
      title:
        table === 'tamtru' ? 'Hộ tạm trú' : `HSHK: ${route.params.screen}`,
    }); //đổi title
    const fetchData = async () => {
      let { data: population, error } = await supabase
        .from(table)
        .select('*')
        .eq('SOHOK', route.params.screen);
      if (error) {
        console.log('Error fetching data:', error);
      } else {
        setSearchResult(population);
        console.log('Fetched data:', population);
      }
    };
    fetchData();
  }, [route.params.screen, table, navigation]);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        route.params ? navigation.pop(2) : navigation.pop();

        return true;
      };
      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress,
      );

      return () => subscription.remove();
    }, [navigation]),
  );

  return (
    <>
      <View
        style={{
          position: 'relative',
          display: 'flex',
          justifyContent: 'space-between',
          flexDirection: 'row',
          backgroundColor: '#33CC00',
          paddingLeft: 20,
          paddingRight: 20,
          // paddingBottom: 30,
          paddingTop: 5,
          paddingBottom: 5,
        }}
      >
        {table !== 'tamtru' && (
          <Text
            style={{
              display: 'flex',
              fontWeight: 'bold',
              marginRight: 10,
            }}
          >
            Số HSHK {route.params.screen}
          </Text>
        )}
        {/* flexShrink để địa chỉ dài xuống dòng thay vì tràn ra ngoài màn hình */}
        <Text style={{ fontWeight: 'bold', flexShrink: 1 }}>
          {/* Hộ tạm trú: địa chỉ là chỗ đang tạm trú, không phải thường trú ở quê */}
          {table === 'tamtru' ? 'Nơi tạm trú' : 'Địa chỉ'}:{' '}
          {searchResult[0] &&
            searchResult[0][table === 'tamtru' ? 'NOITAMTRU' : 'NOITHTRU']}
        </Text>
      </View>
      <View
        style={{
          flex: 1,
          paddingLeft: 20,
          paddingRight: 20,
          // marginBottom: 20,
          // paddingBottom: 10,
        }}
      >
        <KeyboardAwareFlatList
          enableOnAndroid={true}
          extraHeight={100}
          extraScrollHeight={100}
          keyboardShouldPersistTaps="handled"
          data={searchResult}
          renderItem={({ item, index }) => (
            <Item item={item} index={index} location={receiveLocation} />
          )}
        />
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
  },
});
