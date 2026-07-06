import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

// Bắt mọi lỗi render/runtime ở cây con → hiện màn hình lỗi thay vì sập app.
// Đặc biệt hữu ích cho crash "đôi lúc" lúc mới mở app (native module chưa
// sẵn sàng, dữ liệu null, v.v.) — người dùng bấm "Thử lại" thay vì phải
// force-close.
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info?.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Đã xảy ra lỗi</Text>
          <Text style={styles.message}>
            Ứng dụng gặp sự cố khi khởi động. Vui lòng thử lại.
          </Text>
          {!!this.state.error?.message && (
            <Text style={styles.detail}>{String(this.state.error.message)}</Text>
          )}
          <TouchableOpacity style={styles.button} onPress={this.handleRetry}>
            <Text style={styles.buttonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#111',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  message: {
    fontSize: 15,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 12,
  },
  detail: {
    fontSize: 12,
    color: '#e57373',
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#00c853',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
});
