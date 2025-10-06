import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Population } from '../screen/population';
import { Crime } from '../screen/crime';
import { GetOneFamily } from '../screen/getOneFamily';
import { Login } from '../screen/login';
import { Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const Tab = createBottomTabNavigator();

export function AppNavigators() {
  const insets = useSafeAreaInsets(); // lất chiều cao để manu top iphone

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarLabelPosition: 'beside-icon',
        tabBarLabelStyle: {
          fontWeight: '700',
          fontSize: 15,
        },
        tabBarIconStyle: { display: 'none' },
      }}
      tabBar={({ navigation, state }) => {
        return (
          <View
            style={{
              backgroundColor: '#000000ff',
              bottom: 0,
              height: 45 + insets.bottom / 2,
              width: '100%',
              flexDirection: 'row',
              borderTopWidth:1
            }}
          >
            <View
              style={{
                flex: 1,
                // backgroundColor: 'yellow',
                textAlign: 'center',
                alignItems: 'center',
                borderRightWidth: 0.5,
                borderRightColor: 'gray',
              }}
            >
              <TouchableOpacity
                style={{
                  // backgroundColor: 'gray',
                  width: '100%',
                  height: '100%',
                  justifyContent: 'center',
                  textAlign: 'center',
                  alignItems: 'center',
                  display: 'flex',
                }}
                onPress={() => {
                  navigation.navigate('Tìm công dân');
                  if (state.index == 0 && global.SearchPopulationRef) {
                    global.SearchPopulationRef.scrollToOffset({ offset: 0 });
                  }
                }}
              >
                <Text
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    textAlign: 'center',
                    bottom: insets.bottom / 7 + 2,
                    color: state.index == 0 ? '#00a81fff' : '#b1b1b1ff',
                    fontSize: 18,
                    fontWeight: 'bold',
                  }}
                >
                  Tìm công dân
                </Text>
              </TouchableOpacity>
            </View>

            <View
              style={{
                flex: 1,
                textAlign: 'center',
                alignItems: 'center',
                // borderTopWidth: 2,
              }}
            >
              <TouchableOpacity
                style={{
                  width: '100%',
                  height: '100%',
                  justifyContent: 'center',
                  textAlign: 'center',
                  alignItems: 'center',
                  display: 'flex',
                }}
                onPress={() => {
                  navigation.navigate('Tìm đối tượng');
                  if (state.index == 1 && global.SearchCrimeRef) {
                    global.SearchCrimeRef.scrollToOffset({ offset: 0 });
                  }
                }}
              >
                <Text
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    textAlign: 'center',
                    bottom: insets.bottom / 7 + 2,
                    color: state.index == 1 ? '#00a81fff' : '#b1b1b1ff',
                    fontSize: 18,
                    fontWeight: 'bold',
                  }}
                >
                  Tìm đối tượng
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      }}
    >
      <Tab.Screen
        name="Tìm công dân"
        component={Population}
        // options={{
        //   tabBarIcon: ({})=>{

        //     return(
        //       <View
        //       style={{
        //     backgroundColor:'red',
        //     bottom:100,
        //     height:50 + insets.bottom/2,
        //     width:'100%',
        //     flexDirection:'row'
        //   }}>
        //         <Text>

        //           A
        //         </Text>

        //       </View>
        //     )
        //   }

        // }}
      />
      <Tab.Screen name="Tìm đối tượng" component={Crime} />
    </Tab.Navigator>
  );
}

const Stack = createNativeStackNavigator();

const StackNavigator = () => {
  return (
    <>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: 'green',
          },
          headerBlurEffect: 'extraLight',
          headerShadowVisible: false,
        }}
      >

                <Stack.Screen
          name="Login"
          component={Login}
          options={{
            header: () => null,
          }}
        />


        <Stack.Screen
          name="HomeStack"
          component={AppNavigators}
          options={{
            header: () => null,
          }}
        />

        <Stack.Screen
          name={`getOneFamily`}
          component={GetOneFamily}
          options={({ navigation }) => ({
            headerTitleAlign: 'center',
            animation: 'simple_push',
            animationTypeForReplace: 'push',
            headerTitle: () => (
              <>
                <Text style={{ fontWeight: 'bold', fontSize: 20 }}>
                  Thông tin hộ
                </Text>
              </>
            ),
            headerLeft: () => (
              <TouchableOpacity
                onPressIn={() => {
                  navigation.goBack();
                }}
              >
                <Text>Quay lại</Text>
              </TouchableOpacity>
            ),
          })}
        />
      </Stack.Navigator>
    </>
  );
};

export default StackNavigator;
