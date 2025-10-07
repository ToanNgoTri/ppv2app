 import { supabase } from '../lib.js';
import { View, Text, Image,TouchableOpacity ,Linking} from 'react-native';
import { Table, Row } from 'react-native-table-component';
 import React, { useState, useRef, useEffect } from 'react';

 
 export function Item({ item, index }) {
    

const [imageExists, setImageExists] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);


    let tableHead = [
    'STT',
    'Tội danh',
    'Thời hạn',
    'Ngày bắt',
    'Ngày CH xong:',
    'Nơi CH',
  ];
  let widthArr = ['8%', '30%', '15%', '15%', '15%', '17%'];




  useEffect(() => {
    async function check() {
      const path = `subject/${item['CCCD']}.jpg`;

      // Lấy public URL
      const { data } = supabase.storage
        .from("imageCrime")
        .getPublicUrl(path);

      const url = data.publicUrl;

      // Kiểm tra tồn tại thật bằng HEAD request
      try {
        const response = await fetch(url, { method: "HEAD" });
        if (response.ok) {
          setImageExists(true);
          setImageUrl(url);
        } else {
          setImageExists(false);
        }
      } catch (err) {
        setImageExists(false);
      }
    }

    check();
  }, [item['CCCD']]); // chạy lại khi CCCD thay đổi



    let chargeArr = item['CHARGE']?.split(';');
    let fullInfoCrime = [];

    for (let a = 0; a < chargeArr?.length; a++) {
      fullInfoCrime.push([
        [a + 1],
        item['CHARGE']?.split(';')[a] ? item['CHARGE']?.split(';')[a] : '',
        item['JUDGMENT']?.split(';')[a] ? item['JUDGMENT']?.split(';')[a] : '',
        item['DAYARRES']?.split(';')[a] ? item['DAYARRES']?.split(';')[a] : '',
        item['FREEDAY']?.split(';')[a] ? item['FREEDAY']?.split(';')[a] : '',
        item['DETENTION']?.split(';')[a]
          ? item['DETENTION']?.split(';')[a]
          : '',
      ]);
    }

    function convertToDMS(decimal, isLat) {
      const degrees = Math.floor(Math.abs(decimal));
      const minutesFloat = (Math.abs(decimal) - degrees) * 60;
      const minutes = Math.floor(minutesFloat);
      const seconds = ((minutesFloat - minutes) * 60).toFixed(1);

      const direction = decimal >= 0 ? (isLat ? 'N' : 'E') : isLat ? 'S' : 'W';

      return `${degrees}°${minutes}'${seconds}"${direction}`;
    }


        function convertCoordinates(coordString) {
      const [latStr, lonStr] = coordString.split(', ').map(s => s.trim());
      const lat = parseFloat(latStr);
      const lon = parseFloat(lonStr);

      const latDMS = convertToDMS(lat, true);
      const lonDMS = convertToDMS(lon, false);

      return `${latDMS} ${lonDMS}`;
    }




    return (
      <View
        style={{
          flexDirection: 'collumn',
          backgroundColor: index % 2 ? '#CCCCCC' : 'white',
          marginTop: 10,
          flexWrap: 'wrap',
          padding: 10,
          borderWidth: 2,
          borderColor: 'black',
          borderRadius: 5,
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flexDirection: 'row' }}>
          <Text style={{ fontWeight: 'bold' }}>
            Số thứ tự: <Text style={{ fontWeight: '400' }}>{index}</Text>
          </Text>
        </View>
        <View
          style={{
            flexDirection: 'row',
            width: '100%',
            justifyContent: 'space-between',
            marginBottom: 10,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={{ marginRight: 10, fontWeight: 'bold' }}>
              Họ và tên: <Text style={{ color: 'red' }}>{item['HOTEN']}</Text>
            </Text>
            <Text style={{ marginRight: 10, fontWeight: 'bold' }}>
              Tên khác:{' '}
              <Text style={{ fontWeight: '400' }}>{item['TENKHAC']}</Text>
            </Text>
            <Text style={{ marginRight: 10, fontWeight: 'bold' }}>
              Ngày sinh:{' '}
              <Text style={{ fontWeight: '400' }}>{item['NAMSINH']}</Text>
            </Text>

            <Text style={{ marginRight: 10, fontWeight: 'bold' }}>
              Giới tính:{' '}
              <Text style={{ fontWeight: '400' }}>{item['GIOITINH'] ? 'NAM' : 'NỮ'}</Text>
            </Text>
            <Text style={{ marginRight: 10, fontWeight: 'bold' }}>
              Số ĐDCN: <Text style={{ fontWeight: '400' }}>{item['CCCD']}</Text>
            </Text>
            <Text style={{ marginRight: 10, fontWeight: 'bold' }}>
              Tên cha:{' '}
              <Text style={{ fontWeight: '400' }}>{item['TENCHA']}</Text>
            </Text>
            <Text style={{ marginRight: 10, fontWeight: 'bold' }}>
              Tên mẹ: <Text style={{ fontWeight: '400' }}>{item['TENME']}</Text>
            </Text>
            <Text style={{ marginRight: 10, fontWeight: 'bold' }}>
              Dân tộc:{' '}
              <Text style={{ fontWeight: '400' }}>{item['DANTOC']}</Text>
            </Text>
            <Text style={{ marginRight: 10, fontWeight: 'bold' }}>
              Tôn giáo:{' '}
              <Text style={{ fontWeight: '400' }}>{item['TONGIAO']}</Text>
            </Text>
            <Text style={{ marginRight: 10, fontWeight: 'bold' }}>
              Địa chỉ:{' '}
              <Text style={{ fontWeight: '400' }}>{item['NOITHTRU']}</Text>
            </Text>
          </View>
          <View
            style={{
              flex: 1,
              justifyContent: 'space-around',
              alignItems: 'center',
            //   backgroundColor: 'yellow',
            }}
          >
            <Image
              style={{ width: '100%', height: 200 }}
              source={
                 imageExists
            ? { uri: imageUrl }
            : require('../../asset/unknow.jpg')
              }
            />
            {item['LOCATION'] && <TouchableOpacity
              onPress={() =>
                Linking.openURL(
                  `https://www.google.com/maps/place/${convertCoordinates(item['LOCATION'])}`,
                )
              }>
              <Text selectable={true} style={{fontWeight: 'bold'}}>
                Vị trị nơi ở đối tượng
              </Text>
              </TouchableOpacity>}
            
          </View>
        </View>
        <View>
          <Table borderStyle={{ borderWidth: 2, borderColor: '#c8e1ff' }}>
            <Row
              data={tableHead}
              widthArr={widthArr}
              style={{ backgroundColor: '#f1f8ff' }}
              textStyle={{
                margin: 6,
                fontWeight: 'bold',
                textAlign: 'center',
                fontSize: 12,
              }}
            />
          </Table>
          <Table borderStyle={{ borderWidth: 1, borderColor: '#C1C0B9' }}>
            {fullInfoCrime.map((rowData, index) => {
              return (
                <Row
                  key={index}
                  data={rowData}
                  widthArr={widthArr}
                  style={
                    rowData &&
                    (rowData[1].includes('?') || rowData[4].includes('?'))
                      ? { backgroundColor: '#c48207ff' }
                      : { backgroundColor: '#f1f8ff' }
                  }
                  textStyle={{ margin: 4, fontSize: 10, textAlign: 'center' }}
                />
              );
            })}
          </Table>
        </View>
      </View>
    );
  }
