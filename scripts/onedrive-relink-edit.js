/**
 * Đồng bộ cột LINKFOLDER của bảng crime với các thư mục ảnh trên OneDrive.
 *
 *   node scripts/onedrive-relink-edit.js
 *
 * Mỗi lần chạy sinh ra 3 file SQL trong scripts/out/ (dán vào Supabase > SQL Editor):
 *
 *   relink-edit.sql     Dòng ĐÃ CÓ link: đổi link xem -> link sửa, GIỮ NGUYÊN thư mục cũ.
 *                       Tra bằng Graph /shares/{token}/driveItem nên biết chắc link cũ
 *                       trỏ vào thư mục nào, không đoán tên.
 *
 *   link-new.sql        Dòng CHƯA CÓ link (đối tượng mới): tìm thư mục còn trống trùng
 *                       tên với HOTEN rồi gán link sửa. Thư mục có năm sinh ở cuối tên
 *                       được đối chiếu thêm với NAMSINH.
 *
 *   fix-wrong-links.sql Dòng có link trỏ nhầm vào thư mục người khác (phát hiện khi một
 *                       thư mục bị nhiều CCCD dùng chung).
 *
 * Trường hợp không chắc chắn thì KHÔNG tự gán, mà in ra cuối màn hình để xử lý tay.
 * Script chỉ ĐỌC Supabase; việc ghi do bạn chạy file SQL.
 */

const fs = require('fs');
const path = require('path');
const {
  getAccessToken,
  graph,
  mapLimit,
  norm,
  listSubFolders,
} = require('./onedrive-edit-links.js');

/* ================= CẤU HÌNH ================= */
const SUPABASE_URL = 'https://cppilyhbusukcmrwpvfc.supabase.co';
const SUPABASE_KEY = 'sb_publishable_nX03uX-GanUfJf3UCFRfhw_9XyM2vHs';
const OUT_DIR = path.join(__dirname, 'out');
const CACHE_FILE = path.join(OUT_DIR, '.relink-cache.json');

const args = process.argv.slice(2);
const argOf = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : def;
};
const ROOT_FOLDER = argOf('folder', 'HINH');
const LINK_SCOPE = argOf('scope', 'anonymous');
const CONCURRENCY = Number(argOf('concurrency', '4'));

/* ================= SUPABASE ================= */
async function fetchRows() {
  const rows = [];
  const PAGE = 500;
  for (let from = 0; ; from += PAGE) {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/crime?select=CCCD,HOTEN,NAMSINH,LINKFOLDER&order=CCCD`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          Range: `${from}-${from + PAGE - 1}`,
        },
      },
    );
    if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
    const page = await res.json();
    rows.push(...page);
    if (page.length < PAGE) return rows;
  }
}

/* ================= GRAPH ================= */
// Mã hoá link chia sẻ thành sharing token theo chuẩn của Graph.
const shareToken = url =>
  'u!' +
  Buffer.from(url, 'utf8')
    .toString('base64')
    .replace(/=+$/, '')
    .replace(/\//g, '_')
    .replace(/\+/g, '-');

// Link chia sẻ -> đúng thư mục mà nó trỏ tới.
const resolveShare = (token, link) =>
  graph(token, `/shares/${shareToken(link)}/driveItem?$select=id,name,folder,parentReference`);

async function createEditLink(token, itemId) {
  const r = await graph(token, `/me/drive/items/${itemId}/createLink`, {
    method: 'POST',
    body: JSON.stringify({ type: 'edit', scope: LINK_SCOPE }),
  });
  return r.link.webUrl;
}

/* ================= ĐỐI CHIẾU TÊN ================= */
// Tên thư mục hay có thêm năm sinh hoặc ghi chú trong ngoặc: tách ra để so với HOTEN.
function folderParts(name) {
  let base = norm(name)
    .replace(/\s*\([^)]*\)\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const yr = base.match(/\s(\d{4})$/)?.[1] || null;
  if (yr) base = base.slice(0, -5).trim();
  return { base: base.replace(/[^A-Z0-9 ]/g, ''), yr };
}

// Bỏ dấu nháy, dấu chấm... để "K' THANH PHÚ" khớp được thư mục "K THANH PHU".
const nameKey = hoTen => norm(hoTen).replace(/[^A-Z0-9 ]/g, '').replace(/\s+/g, ' ').trim();

const sameName = (folderName, hoTen) => folderParts(folderName).base === nameKey(hoTen);

// NAMSINH dạng "23/06/1984" -> "1984"
const birthYear = namSinh => String(namSinh || '').match(/(\d{4})/)?.[1] || null;

// Một thư mục chỉ thuộc về một người. Nếu nhiều CCCD cùng trỏ vào một thư mục,
// giữ lại người trùng tên; những người còn lại coi như bị gán nhầm.
function splitConflicts(results) {
  const byFolder = {};
  for (const r of results) (byFolder[r.folderName] ||= []).push(r);

  const ok = [];
  const wrong = [];
  for (const [folderName, group] of Object.entries(byFolder)) {
    if (group.length === 1) {
      ok.push(group[0]);
      continue;
    }
    const owners = group.filter(r => sameName(folderName, r.HOTEN));
    // Chỉ dám kết luận khi xác định được đúng 1 người sở hữu thư mục.
    if (owners.length === 1) {
      ok.push(owners[0]);
      for (const r of group) if (r !== owners[0]) wrong.push(r);
    } else {
      ok.push(...group);
    }
  }
  return { ok, wrong };
}

/**
 * Ghép dòng chưa có link với thư mục còn trống.
 * Chỉ nhận khi kết quả là DUY NHẤT; nhập nhằng thì trả về để xử lý tay.
 */
function matchFreeFolders(rows, freeFolders) {
  const byBase = {};
  for (const f of freeFolders) (byBase[folderParts(f.name).base] ||= []).push(f);

  const matched = [];
  const ambiguous = [];
  const taken = new Set();

  for (const row of rows) {
    let cands = (byBase[nameKey(row.HOTEN)] || []).filter(f => !taken.has(f.id));
    if (!cands.length) continue;

    // Nhiều thư mục cùng tên -> tách bằng năm sinh, ví dụ "NGUYEN VAN TAM 1984".
    if (cands.length > 1) {
      const yr = birthYear(row.NAMSINH);
      const byYear = cands.filter(f => folderParts(f.name).yr === yr);
      if (byYear.length === 1) cands = byYear;
    }

    if (cands.length === 1) {
      taken.add(cands[0].id);
      matched.push({ ...row, folder: cands[0] });
    } else {
      ambiguous.push({ ...row, candidates: cands.map(f => f.name) });
    }
  }
  return { matched, ambiguous };
}

/* ================= XUẤT FILE ================= */
const q = s => `'${String(s).replace(/'/g, "''")}'`;
const csvCell = v => `"${String(v).replace(/"/g, '""')}"`;

// Cả 3 file SQL đều cùng một khuôn: bảng tạm -> update -> câu kiểm tra.
// keyCol là cột dùng để tìm đúng dòng trong bảng crime (mặc định là CCCD).
function buildSql({ table, title, note, columns, rows, check, keyCol = 'cccd' }) {
  const cols = columns.map(c => c.name);
  const joinOn = keyCol === 'cccd' ? `c."CCCD" = t.cccd` : `c."LINKFOLDER" = t.old_link`;
  const values = rows
    .map(r => '  (' + columns.map(c => q(c.get(r))).join(', ') + ')')
    .join(',\n');

  return `-- ${title}
-- Sinh bởi scripts/onedrive-relink-edit.js — ${new Date().toISOString()}
-- Số dòng: ${rows.length}  |  Phạm vi link: ${LINK_SCOPE}
--
${note}
${
  keyCol === 'cccd'
    ? '-- Cập nhật theo CCCD (khoá chính) nên không thể gán nhầm người.'
    : '-- Cập nhật theo đúng chuỗi LINKFOLDER cũ, không dựa vào tên.'
}
-- CÁCH DÙNG: dán toàn bộ file vào Supabase > SQL Editor > Run.

begin;

drop table if exists ${table};
create table ${table} (
${columns.map((c, i) => `  ${c.name.padEnd(15)} text${i === 0 ? ' primary key' : ''}`).join(',\n')}
);

insert into ${table} (${cols.join(', ')}) values
${values};

update crime c
set "LINKFOLDER" = t.new_link
from ${table} t
where ${joinOn};

commit;

-- ================= KIỂM TRA =================
${check}

-- drop table ${table};
`;
}

const sqlRelink = rows =>
  buildSql({
    table: 'tmp_relink',
    title: 'Đổi LINKFOLDER từ link XEM sang link CHỈNH SỬA, giữ nguyên thư mục cũ.',
    note:
      '-- Mỗi dòng lấy đúng thư mục mà link cũ đang trỏ tới (tra qua Graph API).\n' +
      '-- Các dòng bị phát hiện gán nhầm đã tách sang fix-wrong-links.sql, không có ở đây.',
    columns: [
      { name: 'cccd', get: r => r.CCCD },
      { name: 'new_link', get: r => r.newLink },
      { name: 'folder_name', get: r => r.folderName },
    ],
    rows,
    check: `select c."CCCD", c."HOTEN", t.folder_name,
       (c."LINKFOLDER" = t.new_link) as da_doi
from tmp_relink t join crime c on c."CCCD" = t.cccd
order by da_doi, c."HOTEN";`,
  });

const sqlNew = rows =>
  buildSql({
    table: 'tmp_newlink',
    title: 'Gán link thư mục ảnh cho các dòng CHƯA CÓ LINKFOLDER.',
    note:
      '-- Ghép theo tên thư mục trùng HOTEN, chỉ nhận khi kết quả là duy nhất.\n' +
      '-- Thư mục có năm sinh ở cuối tên được đối chiếu thêm với NAMSINH.\n' +
      '-- ĐỌC cột thu_muc và ho_ten để xác nhận trước khi chạy.',
    columns: [
      { name: 'cccd', get: r => r.CCCD },
      { name: 'new_link', get: r => r.newLink },
      { name: 'ho_ten', get: r => r.HOTEN },
      { name: 'thu_muc', get: r => r.folder.name },
    ],
    rows,
    check: `select c."CCCD", c."HOTEN", c."NAMSINH", t.thu_muc,
       (c."LINKFOLDER" = t.new_link) as da_gan
from tmp_newlink t join crime c on c."CCCD" = t.cccd
order by da_gan, c."HOTEN";`,
  });

const sqlFix = rows =>
  buildSql({
    table: 'tmp_fixlink',
    title: 'SỬA CÁC DÒNG BỊ GÁN NHẦM THƯ MỤC CỦA NGƯỜI KHÁC.',
    note:
      '-- LINKFOLDER cũ của các dòng này trỏ vào thư mục người khác (phát hiện do một\n' +
      '-- thư mục bị nhiều CCCD dùng chung). Link mới trỏ đúng thư mục trùng tên HOTEN.\n' +
      '-- ĐỌC KỸ cột thu_muc_sai_cu và thu_muc_dung trước khi chạy.',
    columns: [
      { name: 'cccd', get: r => r.CCCD },
      { name: 'new_link', get: r => r.newLink },
      { name: 'ho_ten', get: r => r.HOTEN },
      { name: 'thu_muc_dung', get: r => r.folder.name },
      { name: 'thu_muc_sai_cu', get: r => r.folderName },
    ],
    rows,
    check: `select c."CCCD", c."HOTEN", t.thu_muc_sai_cu, t.thu_muc_dung,
       (c."LINKFOLDER" = t.new_link) as da_sua
from tmp_fixlink t join crime c on c."CCCD" = t.cccd
order by da_sua, c."HOTEN";`,
  });

/* ================= CHẠY LẠI TỪ CACHE ================= */
/**
 * Dùng khi không đọc được Supabase (RLS đang bật): dựng lại relink-edit.sql
 * hoàn toàn từ cache, khớp theo đúng chuỗi LINKFOLDER cũ thay vì theo CCCD.
 * Thư mục bị nhiều người dùng chung được xử lý riêng theo CCCD của người sở hữu,
 * đọc từ scripts/out/.conflicts.json (do lần chạy đầy đủ gần nhất ghi ra).
 */
function runFromCache() {
  const cache = fs.existsSync(CACHE_FILE) ? JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8')) : {};
  const entries = Object.entries(cache).map(([oldLink, v]) => ({ oldLink, ...v }));
  if (!entries.length) throw new Error('Cache rỗng, phải chạy đầy đủ ít nhất một lần.');

  const conflictFile = path.join(OUT_DIR, '.conflicts.json');
  const conflicts = fs.existsSync(conflictFile)
    ? JSON.parse(fs.readFileSync(conflictFile, 'utf8'))
    : {};

  // Link dùng chung cho nhiều người: không update theo link được, phải theo CCCD.
  const plain = entries.filter(e => !conflicts[e.folderName]);
  const owners = Object.entries(conflicts)
    .map(([folderName, c]) => {
      const e = entries.find(x => x.folderName === folderName);
      return e && { CCCD: c.ownerCCCD, newLink: e.newLink, folderName };
    })
    .filter(Boolean);

  let sql = buildSql({
    table: 'tmp_relink',
    title: 'Đổi LINKFOLDER từ link XEM sang link CHỈNH SỬA, giữ nguyên thư mục cũ.',
    note:
      '-- Dựng lại từ cache (không cần tắt RLS). Mỗi dòng khớp theo ĐÚNG chuỗi\n' +
      '-- LINKFOLDER cũ, và link mới trỏ vào chính thư mục mà link cũ trỏ tới.',
    keyCol: 'old_link',
    columns: [
      { name: 'old_link', get: r => r.oldLink },
      { name: 'new_link', get: r => r.newLink },
      { name: 'folder_name', get: r => r.folderName },
    ],
    rows: plain,
    check: `select c."CCCD", c."HOTEN", t.folder_name,
       (c."LINKFOLDER" = t.new_link) as da_doi
from tmp_relink t join crime c on c."LINKFOLDER" = t.new_link
order by c."HOTEN";`,
  });

  if (owners.length) {
    sql +=
      `\n-- ================= THƯ MỤC BỊ DÙNG CHUNG =================\n` +
      `-- Các link cũ dưới đây đang bị nhiều CCCD dùng chung nên không thể update\n` +
      `-- theo link. Chỉ cập nhật cho người thật sự sở hữu thư mục; những người còn\n` +
      `-- lại xử lý ở fix-wrong-links.sql.\n` +
      owners
        .map(
          o =>
            `update crime set "LINKFOLDER" = ${q(o.newLink)} where "CCCD" = ${q(o.CCCD)};` +
            `  -- ${o.folderName}`,
        )
        .join('\n') +
      '\n';
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, 'relink-edit.sql'), sql, 'utf8');

  console.log(`Dựng lại relink-edit.sql từ cache:`);
  console.log(`  ${plain.length} dòng khớp theo LINKFOLDER cũ`);
  console.log(`  ${owners.length} dòng khớp theo CCCD (thư mục bị dùng chung)`);
  if (!Object.keys(conflicts).length) {
    console.log('  (không có .conflicts.json — không tách được thư mục dùng chung)');
  }
}

/* ================= MAIN ================= */
(async () => {
  if (args.includes('--from-cache')) return runFromCache();

  const token = await getAccessToken();

  console.log('Đang đọc bảng crime trên Supabase ...');
  const allRows = await fetchRows();
  if (!allRows.length) {
    throw new Error(
      'Supabase trả về 0 dòng — nhiều khả năng RLS đang bật nên key publishable không đọc được.\n' +
        'Không ghi file để tránh xoá mất kết quả cũ.\n' +
        'Cách xử lý: tắt RLS bảng crime rồi chạy lại, hoặc dùng "node scripts/onedrive-relink-edit.js --from-cache".',
    );
  }
  const withLink = allRows.filter(r => r.LINKFOLDER);
  const noLink = allRows.filter(r => !r.LINKFOLDER);
  console.log(`${allRows.length} dòng: ${withLink.length} đã có link, ${noLink.length} chưa có.`);

  console.log(`Đang đọc thư mục "${ROOT_FOLDER}" trên OneDrive ...`);
  const folders = await listSubFolders(token, ROOT_FOLDER);
  console.log(`Có ${folders.length} thư mục.`);

  /* --- 1. Dòng đã có link: tra ra thư mục thật rồi tạo link edit --- */
  const cache = fs.existsSync(CACHE_FILE) ? JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8')) : {};
  let done = 0;
  let cached = 0;
  const failed = [];

  const resolved = (
    await mapLimit(withLink, CONCURRENCY, async row => {
      try {
        let hit = cache[row.LINKFOLDER];
        if (hit) cached++;
        else {
          const item = await resolveShare(token, row.LINKFOLDER);
          if (!item.folder) throw new Error('Link không trỏ tới một thư mục');
          hit = { folderName: item.name, itemId: item.id, newLink: await createEditLink(token, item.id) };
          cache[row.LINKFOLDER] = hit;
        }
        done++;
        if (done % 25 === 0 || done === withLink.length) console.log(`  ${done}/${withLink.length}`);
        return { ...row, ...hit };
      } catch (e) {
        failed.push({ ...row, error: e.message.split('\n')[0] });
        return null;
      }
    })
  ).filter(Boolean);

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf8');

  const { ok, wrong } = splitConflicts(resolved);

  /* --- 2. Thư mục còn trống = chưa thuộc về dòng nào --- */
  const used = new Set(ok.map(r => r.folderName));
  const free = folders.filter(f => !used.has(f.name));

  /* --- 3. Ghép dòng chưa có link + sửa dòng gán nhầm, đều lấy từ thư mục còn trống --- */
  const { matched, ambiguous } = matchFreeFolders([...wrong, ...noLink], free);
  const fixes = matched.filter(r => r.LINKFOLDER); // vốn đã có link nhưng trỏ nhầm
  const news = matched.filter(r => !r.LINKFOLDER); // đối tượng mới, trước đó chưa có link

  // Tạo link edit cho các thư mục vừa ghép được.
  await mapLimit(matched, CONCURRENCY, async r => {
    r.newLink = await createEditLink(token, r.folder.id);
  });

  const write = (name, content) => fs.writeFileSync(path.join(OUT_DIR, name), content, 'utf8');
  write('relink-edit.sql', sqlRelink(ok));
  if (news.length) write('link-new.sql', sqlNew(news));
  if (fixes.length) write('fix-wrong-links.sql', sqlFix(fixes));
  write(
    'relink-edit.csv',
    '﻿CCCD,HOTEN,THU_MUC_ONEDRIVE,LINK_CU,LINK_MOI\n' +
      resolved
        .map(r => [r.CCCD, r.HOTEN, r.folderName, r.LINKFOLDER, r.newLink].map(csvCell).join(','))
        .join('\n') +
      '\n',
  );

  /* ================= BÁO CÁO ================= */
  console.log(`\nTra cứu xong ${resolved.length}/${withLink.length} dòng (${cached} lấy từ cache).`);
  console.log(`- relink-edit.sql    : ${ok.length} dòng đổi sang link sửa`);
  console.log(`- link-new.sql       : ${news.length} dòng mới được gán link`);
  console.log(`- fix-wrong-links.sql: ${fixes.length} dòng sửa link gán nhầm`);

  if (news.length) {
    console.log(`\nĐỐI TƯỢNG MỚI ĐƯỢC GÁN LINK (${news.length}):`);
    news.forEach(r => console.log(`  ${r.CCCD}  ${r.HOTEN}  ->  ${r.folder.name}`));
  }

  if (wrong.length) {
    console.log(`\nLINK CŨ BỊ GÁN NHẦM (${wrong.length}):`);
    for (const r of wrong) {
      const f = fixes.find(x => x.CCCD === r.CCCD);
      console.log(
        `  ${r.CCCD}  ${r.HOTEN}\n      đang trỏ tới : ${r.folderName}` +
          (f ? `\n      sẽ sửa thành : ${f.folder.name}` : `\n      KHÔNG có thư mục trùng tên -> xử lý tay`),
      );
    }
  }

  const stillEmpty = noLink.filter(r => !news.some(n => n.CCCD === r.CCCD));
  const freeLeft = free.filter(f => !matched.some(m => m.folder.id === f.id));
  console.log(`\nCÒN LẠI: ${stillEmpty.length} dòng chưa có link, ${freeLeft.length} thư mục chưa gán cho ai.`);
  if (freeLeft.length) console.log('  Thư mục trống: ' + freeLeft.map(f => f.name).join(', '));

  if (ambiguous.length) {
    console.log(`\nNHẬP NHẰNG, KHÔNG TỰ GÁN (${ambiguous.length}) — xử lý tay:`);
    ambiguous.forEach(r =>
      console.log(`  ${r.CCCD}  ${r.HOTEN} (${r.NAMSINH})  ->  ${r.candidates.join(' | ')}`),
    );
  }

  if (failed.length) {
    console.log(`\nLỗi ${failed.length} dòng (link hỏng / không truy cập được):`);
    failed.slice(0, 20).forEach(r => console.log(`  ${r.CCCD}  ${r.HOTEN}: ${r.error}`));
  }
})().catch(e => {
  console.error('\nLỖI:', e.message);
  process.exitCode = 1;
});
