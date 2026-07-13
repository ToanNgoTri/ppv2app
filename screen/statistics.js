import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Keyboard,
  Alert,
} from 'react-native';
import { supabase } from './lib.js';

const FLAG_LABELS = {
  ANNINH: 'An ninh',
  MATUY: 'Ma túy',
  TUTHA: 'Tù tha',
  THACD: 'THA CĐ',
};

/**
 * Màn hình thống kê theo điều kiện, dùng chung cho 2 bảng:
 *  - population (dân số): giới tính, khoảng năm sinh, vắng nhà
 *  - crime (đối tượng): thêm các phân loại ANNINH / MATUY / TUTHA / THACD
 * Chỉ thống kê khi người dùng chọn ít nhất một điều kiện và bấm "Thống kê".
 */
export function Statistics({ route }) {
  const table = route?.params?.table || 'population';
  const isCrime = table === 'crime';
  const accent = isCrime ? '#aaaf07ff' : '#008080';

  // ===== Điều kiện lọc =====
  const [gender, setGender] = useState('all'); // all | nam | nu
  const [vang, setVang] = useState('all'); // all | vang | khong
  const [fromYear, setFromYear] = useState('');
  const [toYear, setToYear] = useState('');
  const [flags, setFlags] = useState({
    ANNINH: false,
    MATUY: false,
    TUTHA: false,
    THACD: false,
  });

  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);

  const activeFlags = () =>
    Object.entries(flags)
      .filter(([, on]) => on)
      .map(([k]) => k);

  const hasCondition = () =>
    gender !== 'all' ||
    vang !== 'all' ||
    fromYear.trim() !== '' ||
    toYear.trim() !== '' ||
    (isCrime && activeFlags().length > 0);

  const yearOf = namsinh => {
    const m = String(namsinh || '').match(/(\d{4})\s*$/);
    return m ? parseInt(m[1], 10) : null;
  };

  const buildStats = rows => {
    const total = rows.length;
    const nam = rows.filter(r => r.GIOITINH === true).length;
    const nu = total - nam;
    const vangNha = rows.filter(r => r.VANGNHA === true).length;

    const soHo = new Set(
      rows
        .map(r => r.SOHOK)
        .filter(v => v !== null && v !== undefined && v !== ''),
    ).size;

    const groupBy = key => {
      const map = {};
      rows.forEach(r => {
        const raw = r[key];
        const label =
          raw === null || raw === undefined || raw === '' ? 'Không rõ' : String(raw);
        map[label] = (map[label] || 0) + 1;
      });
      return Object.entries(map).sort((a, b) => b[1] - a[1]);
    };

    // Thống kê theo phân loại (chỉ bảng crime)
    const byLoai = isCrime
      ? Object.keys(FLAG_LABELS).map(field => [
          FLAG_LABELS[field],
          rows.filter(r => r[field] === true).length,
        ])
      : [];

    return {
      total,
      nam,
      nu,
      vangNha,
      soHo,
      byDanToc: groupBy('DANTOC'),
      byTonGiao: groupBy('TONGIAO'),
      byLoai,
    };
  };

  const compute = async () => {
    Keyboard.dismiss();
    if (!hasCondition()) {
      setStats(null);
      Alert.alert('Thông báo', 'Vui lòng chọn ít nhất một điều kiện thống kê');
      return;
    }

    setLoading(true);
    try {
      const columns = isCrime
        ? 'GIOITINH,VANGNHA,DANTOC,TONGIAO,NAMSINH,SOHOK,ANNINH,MATUY,TUTHA,THACD'
        : 'GIOITINH,VANGNHA,DANTOC,TONGIAO,NAMSINH,SOHOK';

      const from = fromYear.trim() ? parseInt(fromYear, 10) : null;
      const to = toYear.trim() ? parseInt(toYear, 10) : null;
      // Nếu chọn đúng 1 năm -> lọc luôn phía server cho nhẹ
      const exactYear = from !== null && to !== null && from === to ? from : null;

      const buildQuery = () => {
        let q = supabase.from(table).select(columns);
        if (gender !== 'all') q = q.eq('GIOITINH', gender === 'nam');
        if (vang !== 'all') q = q.eq('VANGNHA', vang === 'vang');
        if (isCrime) {
          activeFlags().forEach(field => {
            q = q.eq(field, true);
          });
        }
        if (exactYear !== null) q = q.like('NAMSINH', `%${exactYear}`);
        return q;
      };

      // PostgREST giới hạn 1000 dòng/lần -> phải phân trang để lấy đủ dữ liệu
      const PAGE = 1000;
      let all = [];
      for (let offset = 0; offset < 500000; offset += PAGE) {
        const { data, error } = await buildQuery().range(offset, offset + PAGE - 1);
        if (error) throw error;
        const batch = data || [];
        all = all.concat(batch);
        if (batch.length < PAGE) break; // hết dữ liệu
      }

      // Lọc khoảng năm sinh phía client (NAMSINH dạng dd/mm/yyyy; xử lý cả khoảng nhiều năm)
      let rows = all;
      if (from !== null || to !== null) {
        rows = rows.filter(r => {
          const y = yearOf(r.NAMSINH);
          if (y === null) return false;
          if (from !== null && y < from) return false;
          if (to !== null && y > to) return false;
          return true;
        });
      }

      setStats(buildStats(rows));
    } catch (e) {
      console.log('Lỗi thống kê:', e.message);
      Alert.alert('Lỗi', e.message || 'Đã có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setGender('all');
    setVang('all');
    setFromYear('');
    setToYear('');
    setFlags({ ANNINH: false, MATUY: false, TUTHA: false, THACD: false });
    setStats(null);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#F1F3F5' }}
      contentContainerStyle={{ padding: 14 }}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>
        {isCrime ? '📊 Thống kê đối tượng' : '📊 Thống kê dân số'}
      </Text>

      {/* ===== Bảng điều kiện ===== */}
      <View style={styles.filterCard}>
        {/* Giới tính */}
        <Text style={styles.filterLabel}>Giới tính</Text>
        <SegRow
          value={gender}
          onChange={setGender}
          accent={accent}
          options={[
            { key: 'all', label: 'Tất cả' },
            { key: 'nam', label: 'Nam' },
            { key: 'nu', label: 'Nữ' },
          ]}
        />

        {/* Khoảng năm sinh */}
        <Text style={styles.filterLabel}>Khoảng năm sinh</Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TextInput
            value={fromYear}
            onChangeText={t => setFromYear(t.replace(/\D/g, '').slice(0, 4))}
            placeholder="Từ năm"
            placeholderTextColor="#adb5bd"
            keyboardType="numeric"
            style={styles.yearInput}
          />
          <TextInput
            value={toYear}
            onChangeText={t => setToYear(t.replace(/\D/g, '').slice(0, 4))}
            placeholder="Đến năm"
            placeholderTextColor="#adb5bd"
            keyboardType="numeric"
            style={styles.yearInput}
          />
        </View>

        {/* Vắng nhà */}
        <Text style={styles.filterLabel}>Vắng nhà</Text>
        <SegRow
          value={vang}
          onChange={setVang}
          accent={accent}
          options={[
            { key: 'all', label: 'Tất cả' },
            { key: 'vang', label: 'Vắng' },
            { key: 'khong', label: 'Không' },
          ]}
        />

        {/* Phân loại đối tượng (chỉ crime) */}
        {isCrime && (
          <>
            <Text style={styles.filterLabel}>Phân loại đối tượng</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {Object.keys(FLAG_LABELS).map(field => {
                const on = flags[field];
                return (
                  <TouchableOpacity
                    key={field}
                    onPress={() => setFlags(prev => ({ ...prev, [field]: !prev[field] }))}
                    style={[
                      styles.chip,
                      { borderColor: on ? accent : '#ccc', backgroundColor: on ? accent : '#fafafa' },
                    ]}
                  >
                    <Text style={[styles.chipText, { color: on ? '#fff' : '#495057' }]}>
                      {on ? '✓ ' : ''}
                      {FLAG_LABELS[field]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {/* Nút */}
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: accent, flex: 1 }]}
            onPress={compute}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>📊 Thống kê</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, { backgroundColor: '#6C757D' }]} onPress={reset}>
            <Text style={styles.btnText}>Xoá điều kiện</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ===== Kết quả ===== */}
      {stats === null ? (
        <Text style={styles.hint}>
          Chọn điều kiện phía trên rồi bấm "Thống kê" để xem kết quả.
        </Text>
      ) : stats.total === 0 ? (
        <Text style={styles.hint}>Không có dữ liệu phù hợp điều kiện.</Text>
      ) : (
        <>
          <View style={styles.cardRow}>
            <StatCard label="Tổng số" value={stats.total} color={accent} />
            {!isCrime && <StatCard label="Số hộ" value={stats.soHo} color="#0D6EFD" />}
            <StatCard label="Vắng nhà" value={stats.vangNha} color="#dc3545" />
          </View>

          <View style={styles.cardRow}>
            <StatCard label="Nam" value={stats.nam} color="#0D6EFD" />
            <StatCard label="Nữ" value={stats.nu} color="#d63384" />
          </View>

          {isCrime && (
            <Breakdown title="Theo phân loại" data={stats.byLoai} total={stats.total} accent={accent} />
          )}
          <Breakdown title="Theo dân tộc" data={stats.byDanToc} total={stats.total} accent={accent} />
          <Breakdown title="Theo tôn giáo" data={stats.byTonGiao} total={stats.total} accent={accent} />
        </>
      )}
    </ScrollView>
  );
}

function SegRow({ value, onChange, options, accent }) {
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {options.map(opt => {
        const active = value === opt.key;
        return (
          <TouchableOpacity
            key={opt.key}
            onPress={() => onChange(opt.key)}
            style={[
              styles.seg,
              { borderColor: active ? accent : '#ccc', backgroundColor: active ? accent : '#fafafa' },
            ]}
          >
            <Text style={[styles.segText, { color: active ? '#fff' : '#495057' }]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function StatCard({ label, value, color }) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Breakdown({ title, data, total, accent }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {data.length === 0 ? (
        <Text style={styles.empty}>Không có dữ liệu</Text>
      ) : (
        data.map(([label, count]) => {
          const percent = total ? Math.round((count / total) * 100) : 0;
          return (
            <View key={label} style={styles.breakRow}>
              <View style={styles.breakHeader}>
                <Text style={styles.breakLabel} numberOfLines={1}>
                  {label}
                </Text>
                <Text style={styles.breakCount}>
                  {count} ({percent}%)
                </Text>
              </View>
              <View style={styles.barBg}>
                <View style={[styles.barFill, { width: `${percent}%`, backgroundColor: accent }]} />
              </View>
            </View>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 20, fontWeight: '700', color: '#212529', marginBottom: 14 },
  filterCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  filterLabel: { fontWeight: '600', color: '#334155', marginBottom: 6, marginTop: 12 },
  yearInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    backgroundColor: '#F8FAFC',
  },
  seg: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  segText: { fontWeight: '600', fontSize: 13 },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  chipText: { fontSize: 12, fontWeight: '600' },
  btn: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  hint: {
    textAlign: 'center',
    color: '#868e96',
    marginTop: 24,
    fontStyle: 'italic',
    paddingHorizontal: 20,
  },
  cardRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  statValue: { fontSize: 24, fontWeight: '800' },
  statLabel: { fontSize: 13, color: '#6C757D', marginTop: 2 },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#343A40', marginBottom: 10 },
  empty: { color: '#adb5bd', fontStyle: 'italic' },
  breakRow: { marginBottom: 10 },
  breakHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  breakLabel: { fontSize: 13, color: '#495057', flex: 1, marginRight: 8 },
  breakCount: { fontSize: 13, fontWeight: '600', color: '#212529' },
  barBg: { height: 8, borderRadius: 4, backgroundColor: '#E9ECEF', overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4 },
});
