import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CheckBox from '@react-native-community/checkbox';

export default function ScreenA({ route }) {
  const type = route?.params?.type || 'default';
  const STORAGE_KEY = `@checklist_${type}`;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const inputRefs = useRef({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const value = await AsyncStorage.getItem(STORAGE_KEY);
      if (value) setItems(JSON.parse(value));
      else addNewItem(); // 👈 luôn có 1 dòng đầu
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const saveData = async () => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  };

  /* ================= CRUD ================= */

  const addNewItem = () => {
    const id = Date.now().toString();
    setItems(prev => [
      ...prev,
      { id, text: '', checked: false },
    ]);

    // focus dòng mới
    setTimeout(() => {
      inputRefs.current[id]?.focus();
    }, 50);
  };

  const updateText = (id, text) => {
    setItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, text } : item,
      ),
    );
  };

  const toggleCheck = id => {
    setItems(prev =>
      prev.map(item =>
        item.id === id
          ? { ...item, checked: !item.checked }
          : item,
      ),
    );
  };

  useEffect(() => {
  const t = setTimeout(() => {
    AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(items),
    );
  }, 300);

  return () => clearTimeout(t);
}, [items]);

  if (loading) return null;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Checklist</Text>

        {items.map((item, index) => (
          <View key={item.id} style={styles.row}>
            <CheckBox
              value={item.checked}
              onValueChange={() => toggleCheck(item.id)}
            />

            <TextInput
              ref={ref => (inputRefs.current[item.id] = ref)}
              style={[
                styles.input,
              ]}
              value={item.text}
              placeholder="Nhập nội dung..."
              onChangeText={text => updateText(item.id, text)}
              onSubmitEditing={() => {
                if (index === items.length - 1) {
                  addNewItem(); // 👈 Enter = dòng mới
                }
              }}
              blurOnSubmit={false}
              returnKeyType="done"
            />
          </View>
        ))}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  input: {
    flex: 1,
    fontSize: 18,          // 👈 TO RÕ
    paddingVertical: 8,    // 👈 CAO DÒNG
    borderBottomWidth: 1,
    borderColor: '#E0E0E0',
  },
  checkedText: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
});