// Login.js
import 'react-native-url-polyfill/auto';
import { useState, useEffect } from 'react';
import {
  TouchableOpacity,
  Text,
  TextInput,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Keyboard,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from './lib.js';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState(null);
  const [loadingLogin, setLoadingLogin] = useState(false);
  const [loadingSignup, setLoadingSignup] = useState(false);

  const navigation = useNavigation();

  useEffect(() => {
    let isMounted = true;

    // onAuthStateChange tự emit INITIAL_SESSION ngay khi mount
    // → không cần gọi getSession() riêng nữa
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      setUser(session?.user ?? null);

      if (session?.user) {
        // requestAnimationFrame đảm bảo navigator đã mount xong trước khi navigate
        requestAnimationFrame(() => {
          navigation.reset({
            index: 0,
            routes: [{ name: 'HomeStack' }],
          });
        });
      }
    });

    return () => {
      isMounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function signIn() {
    try {
      setLoadingLogin(true);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      Alert.alert('Thông báo', 'Đăng nhập thành công');
    } catch (err) {
      Alert.alert(
        'Lỗi đăng nhập',
        err.message === 'Invalid login credentials'
          ? 'Thông tin đăng nhập không đúng'
          : err.message,
      );
    } finally {
      setLoadingLogin(false);
    }
  }

  async function signUp() {
    try {
      setLoadingSignup(true);
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      Alert.alert('Thông báo', 'Kiểm tra email để xác nhận đăng ký');
    } catch (err) {
      Alert.alert(
        'Lỗi đăng ký',
        err.message === 'Password should be at least 6 characters.'
          ? 'Password phải có ít nhất 6 ký tự'
          : err.message,
      );
    } finally {
      setLoadingSignup(false);
      setPassword('');
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableOpacity
        style={{ flex: 1 }}
        activeOpacity={1}
        onPress={() => Keyboard.dismiss()}
      >
        <ImageBackground
          source={require('../asset/BG.jpg')}
          style={styles.container}
          resizeMode="cover"
        >
          <Text style={styles.title}>Đăng nhập</Text>

          <TextInput
            style={styles.input}
            placeholder="Nhập Email"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            placeholderTextColor="gray"
          />

          <TextInput
            style={styles.input}
            placeholder="Nhập Mật khẩu"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            placeholderTextColor="gray"
            textContentType="none"
          />

          <TouchableOpacity
            style={styles.button}
            onPress={signIn}
            disabled={loadingLogin || loadingSignup}
          >
            {loadingLogin ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Đăng nhập</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondary]}
            onPress={signUp}
            disabled={loadingLogin || loadingSignup}
          >
            {loadingSignup ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Đăng ký</Text>
            )}
          </TouchableOpacity>
        </ImageBackground>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
    color: '#ffffff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    color: 'black',
  },
  button: {
    backgroundColor: '#0066FF',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  secondary: { backgroundColor: '#444' },
  buttonText: { color: '#fff', fontWeight: '600' },
});