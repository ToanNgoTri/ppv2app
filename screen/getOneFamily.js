import React, { useState, useEffect, useRef,useCallback } from 'react';
import {
  Text,
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  BackHandler
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
// import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from './lib.js';
import Item from './component/ItemPopulation.js';

// import population from '../asset/population.json';

export function GetOneFamily() {
  const [searchResult, setSearchResult] = useState([]);

  const route = useRoute();

  const navigation = useNavigation();
  // const insets = useSafeAreaInsets(); // lất chiều cao để manu top iphone


  // let data = [];

  useEffect(() => {
    navigation.setOptions({ title: `HSHK: ${route.params.screen}` }); //đổi title
    const fetchData = async () => {
      let { data: population, error } = await supabase
        .from('population')
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
  }, [route.params.screen, navigation]);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        route.params ? navigation.pop(2) : navigation.pop()
 
  return true;
}
 const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      onBackPress
    );        
        


 return () => subscription.remove();
    }, [navigation])
  );


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
            paddingBottom: 60,
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
  },
});
