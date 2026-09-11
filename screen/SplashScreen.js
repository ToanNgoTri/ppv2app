import {
  View,
  ActivityIndicator,
  ImageBackground,
  Text,
  Animated,
  StyleSheet,
} from 'react-native';
import { useEffect, useRef } from 'react';

export function SplashScreen() {
  const fadeAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: false,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);

  return (
    <ImageBackground
      source={require('../asset/BG.jpg')}
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Animated.Text style={[styles.title, { opacity: fadeAnim }]}>
            Đang tải...
          </Animated.Text>
          <ActivityIndicator
            size="large"
            color="#00c853"
            style={styles.loader}
          />
          <Text style={styles.subtitle}>Kiểm tra phiên đăng nhập</Text>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  content: {
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 20,
    textAlign: 'center',
  },
  loader: {
    marginVertical: 24,
  },
  subtitle: {
    fontSize: 13,
    color: '#999',
    marginTop: 16,
    textAlign: 'center',
  },
});
