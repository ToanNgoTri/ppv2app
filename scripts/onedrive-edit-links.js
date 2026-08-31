/**
 * Tạo link CHỈNH SỬA (edit) cho từng thư mục con trong OneDrive rồi sinh file SQL
 * để cập nhật cột LINKFOLDER của bảng `crime` trên Supabase.
 *
 *   node scripts/onedrive-edit-links.js                 # thư mục mặc định: HINH
 *   node scripts/onedrive-edit-links.js --folder HINH   # chỉ định thư mục khác
 *   node scripts/onedrive-edit-links.js --scope organization
 *
 * Đăng nhập bằng device code: script in ra 1 đường dẫn + 1 mã, mở trên trình duyệt,
 * nhập mã và đăng nhập tài khoản OneDrive đang chứa thư mục ảnh.
 * Token được lưu ở scripts/.onedrive-token.json để lần sau không phải đăng nhập lại.
 */

const fs = require('fs');
const path = require('path');

/* ================= CẤU HÌNH ================= */
// Client ID công khai của "Microsoft Graph Command Line Tools" (app first-party của Microsoft,
// hỗ trợ device code + tài khoản cá nhân). Không cần đăng ký app riêng.
const CLIENT_ID = '14d82eec-204b-4c2f-b7e8-296a70dab67e';
const TENANT = 'consumers'; // OneDrive Personal (tài khoản @gmail/@outlook)
const SCOPE = 'Files.ReadWrite offline_access openid profile';
const GRAPH = 'https://graph.microsoft.com/v1.0';
const AUTH = `https://login.microsoftonline.com/${TENANT}/oauth2/v2.0`;

const TOKEN_FILE = path.join(__dirname, '.onedrive-token.json');
const OUT_DIR = path.join(__dirname, 'out');

const args = process.argv.slice(2);
const argOf = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : def;
};
const ROOT_FOLDER = argOf('folder', 'HINH');
// 'anonymous' = ai có link đều sửa được | 'organization' = phải đăng nhập tài khoản trong tổ chức
const LINK_SCOPE = argOf('scope', 'anonymous');
const CONCURRENCY = Number(argOf('concurrency', '4'));

/* ================= ĐĂNG NHẬP ================= */
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function deviceCodeLogin() {
  const res = await fetch(`${AUTH}/devicecode`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: CLIENT_ID, scope: SCOPE }),
  });
  const dc = await res.json();
  if (!dc.device_code) throw new Error(`Không lấy được device code: ${JSON.stringify(dc)}`);

  console.log('\n==================================================');
  console.log(' MỞ TRÌNH DUYỆT:', dc.verification_uri);
  console.log(' NHẬP MÃ       :', dc.user_code);
  console.log(' (đăng nhập tài khoản OneDrive chứa thư mục ảnh)');
  console.log('==================================================\n');

  const deadline = Date.now() + (dc.expires_in || 900) * 1000;
  let interval = (dc.interval || 5) * 1000;

  while (Date.now() < deadline) {
    await sleep(interval);
    const r = await fetch(`${AUTH}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
        client_id: CLIENT_ID,
        device_code: dc.device_code,
      }),
    });
    const tok = await r.json();
    if (tok.access_token) return saveToken(tok);
    if (tok.error === 'authorization_pending') continue;
    if (tok.error === 'slow_down') { interval += 5000; continue; }
    throw new Error(`Đăng nhập thất bại: ${tok.error_description || tok.error}`);
  }
  throw new Error('Hết thời gian chờ đăng nhập.');
}

function saveToken(tok) {
  const data = { ...tok, expires_at: Date.now() + (tok.expires_in - 120) * 1000 };
  fs.writeFileSync(TOKEN_FILE, JSON.stringify(data, null, 2));
  return data;
}

async function refreshToken(refresh_token) {
  const r = await fetch(`${AUTH}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: CLIENT_ID,
      refresh_token,
      scope: SCOPE,
    }),
  });
  const tok = await r.json();
  return tok.access_token ? saveToken(tok) : null;
}

async function getAccessToken() {
  if (fs.existsSync(TOKEN_FILE)) {
    const cached = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf8'));
    if (cached.expires_at > Date.now()) return cached.access_token;
    if (cached.refresh_token) {
      const t = await refreshToken(cached.refresh_token);
      if (t) return t.access_token;
    }
  }
  const t = await deviceCodeLogin();
  return t.access_token;
}

/* ================= GRAPH ================= */
async function graph(token, url, options = {}, tries = 0) {
  const res = await fetch(url.startsWith('http') ? url : GRAPH + url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  if ((res.status === 429 || res.status >= 500) && tries < 5) {
    const wait = Number(res.headers.get('retry-after') || 0) * 1000 || 2000 * (tries + 1);
    console.log(`  ... bị giới hạn tốc độ, chờ ${wait / 1000}s`);
    await sleep(wait);
    return graph(token, url, options, tries + 1);
  }
  if (!res.ok) throw new Error(`${res.status} ${url}\n${await res.text()}`);
  return res.json();
}

async function listSubFolders(token, folder) {
  const encoded = folder.split('/').map(encodeURIComponent).join('/');
  let url = `/me/drive/root:/${encoded}:/children?$select=id,name,folder&$top=200`;
  const out = [];
  while (url) {
    const page = await graph(token, url);
    for (const it of page.value) if (it.folder) out.push({ id: it.id, name: it.name });
    url = page['@odata.nextLink'] || null;
  }
  return out;
}

// createLink là idempotent: gọi lại với cùng type/scope sẽ trả về link đã có sẵn.
async function createEditLink(token, itemId) {
  const r = await graph(token, `/me/drive/items/${itemId}/createLink`, {
    method: 'POST',
    body: JSON.stringify({ type: 'edit', scope: LINK_SCOPE }),
  });
  return r.link.webUrl;
}

async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (i < items.length) {
        const idx = i++;
        out[idx] = await fn(items[idx], idx);
      }
    }),
  );
  return out;
}

/* ================= CHUẨN HOÁ TÊN TIẾNG VIỆT ================= */
const VN_MAP = {
  a: 'áàảãạăắằẳẵặâấầẩẫậ',
  e: 'éèẻẽẹêếềểễệ',
  i: 'íìỉĩị',
  o: 'óòỏõọôốồổỗộơớờởỡợ',
  u: 'úùủũụưứừửữự',
  y: 'ýỳỷỹỵ',
  d: 'đ',
};
// Hai chuỗi dùng cho translate() trong Postgres, luôn khớp độ dài vì sinh từ cùng 1 map.
const VN_FROM = Object.values(VN_MAP).join('');
const VN_TO = Object.entries(VN_MAP)
  .map(([plain, accented]) => plain.repeat(accented.length))
  .join('');

const norm = s =>
  [...s.toLowerCase()]
    .map(c => {
      const hit = Object.entries(VN_MAP).find(([, acc]) => acc.includes(c));
      return hit ? hit[0] : c;
    })
    .join('')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();

// "NGUYEN VAN TAM 1974" -> yr 1974 ; "KIEU CONG TUAN (DA CAT KHAU)" -> bỏ phần trong ngoặc
function splitName(folder) {
  const nm = norm(folder);
  const hasParen = /\(/.test(folder);
  let base = nm.replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s+/g, ' ').trim();
  const yrMatch = base.match(/\s(\d{4})$/);
  const yr = yrMatch ? yrMatch[1] : null;
  if (yr) base = base.slice(0, -5).trim();
  return { nm, base, yr, hasParen };
}

/* ================= XUẤT FILE ================= */
const q = s => `'${String(s).replace(/'/g, "''")}'`;

// Phần dùng chung: hàm bỏ dấu + bảng tạm chứa tên thư mục và link.
function buildTable(rows) {
  const values = rows
    .map(r => {
      const { nm, base, yr, hasParen } = splitName(r.folder);
      return `  (${q(r.folder)}, ${q(r.link)}, ${q(nm)}, ${q(base)}, ${yr ? q(yr) : 'null'}, ${hasParen})`;
    })
    .join(',\n');

  return `-- Cập nhật cột LINKFOLDER (link CHỈNH SỬA OneDrive) cho bảng crime
-- Sinh tự động bởi scripts/onedrive-edit-links.js — ${new Date().toISOString()}
-- Thư mục gốc: ${ROOT_FOLDER}  |  Số thư mục: ${rows.length}  |  Phạm vi link: ${LINK_SCOPE}
--
-- CÁCH DÙNG: dán toàn bộ file này vào Supabase > SQL Editor > Run.
-- Chạy lại nhiều lần được (idempotent). Câu SELECT cuối cùng là BÁO CÁO đối chiếu.

begin;

-- Hàm chuẩn hoá tên: bỏ dấu tiếng Việt, gộp khoảng trắng, viết hoa.
create or replace function pp_norm(txt text) returns text
language sql immutable as $$
  select upper(btrim(regexp_replace(
    translate(lower(coalesce(txt, '')), ${q(VN_FROM)}, ${q(VN_TO)}),
    '\\s+', ' ', 'g')))
$$;

drop table if exists tmp_linkfolder;
create table tmp_linkfolder (
  folder    text,
  link      text,
  nm        text,   -- tên thư mục đã chuẩn hoá
  base      text,   -- bỏ phần trong ngoặc và năm sinh ở cuối
  yr        text,   -- năm sinh tách ra từ tên thư mục (nếu có)
  has_paren boolean
);

insert into tmp_linkfolder (folder, link, nm, base, yr, has_paren) values
${values};

`;
}

// Câu SELECT đối chiếu, dùng cho cả bản xem trước lẫn bản cập nhật.
const REPORT_SQL = `
-- ================= BÁO CÁO ĐỐI CHIẾU =================
-- so_dong_khop = 0  -> không tìm thấy người tương ứng, cần gán tay
-- so_dong_khop > 1  -> trùng tên, KHÔNG được cập nhật tự động, cần kiểm tra
select
  t.folder                                       as thu_muc,
  (select string_agg(c."HOTEN", ' | ') from crime c
     where pp_norm(c."HOTEN") in (t.nm, t.base))  as hoten_trong_db,
  (select count(*) from crime c
     where pp_norm(c."HOTEN") in (t.nm, t.base))  as so_dong_khop,
  (select count(*) from crime c
     where c."LINKFOLDER" = t.link)               as da_gan,
  t.link
from tmp_linkfolder t
order by 3, 4, 1;
`;

// Bản CHỈ XEM TRƯỚC: không ghi gì vào bảng crime.
function buildPreviewSql(rows) {
  const table = buildTable(rows).replace(
    '-- CÁCH DÙNG:',
    '-- BẢN XEM TRƯỚC — CHỈ đối chiếu, KHÔNG cập nhật gì vào bảng crime.\n-- CÁCH DÙNG:',
  );
  return `${table}commit;\n${REPORT_SQL}\n-- Dọn dẹp sau khi xem xong:\n-- drop table tmp_linkfolder;\n`;
}

function buildSql(rows) {
  return buildTable(rows) + `
-- BƯỚC 1: khớp chính xác tên thư mục với HOTEN (chỉ nhận tên thư mục không trùng lặp).
update crime c
set "LINKFOLDER" = t.link
from (
  select nm, min(link) as link
  from tmp_linkfolder
  group by nm
  having count(*) = 1
) t
where pp_norm(c."HOTEN") = t.nm;

-- BƯỚC 2: thư mục có năm sinh ở cuối tên -> khớp tên + năm sinh trong NAMSINH.
update crime c
set "LINKFOLDER" = t.link
from tmp_linkfolder t
where t.yr is not null
  and pp_norm(c."HOTEN") = t.base
  and c."NAMSINH"::text like '%' || t.yr || '%';

-- BƯỚC 3: thư mục có ghi chú trong ngoặc, ví dụ "(DA CAT KHAU)".
-- Chỉ cập nhật khi tên gốc là duy nhất ở CẢ hai phía để tránh nhầm người.
update crime c
set "LINKFOLDER" = t.link
from tmp_linkfolder t
where t.has_paren
  and t.yr is null
  and pp_norm(c."HOTEN") = t.base
  and (select count(*) from tmp_linkfolder t2 where t2.base = t.base) = 1
  and (select count(*) from crime c2 where pp_norm(c2."HOTEN") = t.base) = 1;

commit;
${REPORT_SQL}
-- Dọn dẹp sau khi đã kiểm tra báo cáo:
-- drop table tmp_linkfolder;
`;
}

function buildCsv(rows) {
  const esc = s => `"${String(s).replace(/"/g, '""')}"`;
  return (
    '﻿THU_MUC,LINK_EDIT\n' +
    rows.map(r => `${esc(r.folder)},${esc(r.link)}`).join('\n') +
    '\n'
  );
}

/* ================= MAIN ================= */
module.exports = {
  getAccessToken, graph, mapLimit, sleep, listSubFolders,
  norm, splitName, buildSql, buildPreviewSql, buildCsv, VN_FROM, VN_TO,
};
if (require.main !== module) return;

(async () => {
  const token = await getAccessToken();

  const me = await graph(token, '/me/drive?$select=owner');
  console.log('Tài khoản OneDrive:', me.owner?.user?.displayName || '(không rõ)');

  console.log(`Đang đọc thư mục "${ROOT_FOLDER}" ...`);
  const folders = await listSubFolders(token, ROOT_FOLDER);
  console.log(`Tìm thấy ${folders.length} thư mục con.`);
  if (!folders.length) return;

  let done = 0;
  const failed = [];
  const results = await mapLimit(folders, CONCURRENCY, async f => {
    try {
      const link = await createEditLink(token, f.id);
      done++;
      if (done % 20 === 0 || done === folders.length) {
        console.log(`  ${done}/${folders.length}`);
      }
      return { folder: f.name, link };
    } catch (e) {
      failed.push({ folder: f.name, error: e.message });
      return null;
    }
  });

  const rows = results.filter(Boolean).sort((a, b) => a.folder.localeCompare(b.folder, 'vi'));

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const sqlPath = path.join(OUT_DIR, 'update-linkfolder.sql');
  const previewPath = path.join(OUT_DIR, 'preview-linkfolder.sql');
  const csvPath = path.join(OUT_DIR, 'onedrive-edit-links.csv');
  fs.writeFileSync(sqlPath, buildSql(rows), 'utf8');
  fs.writeFileSync(previewPath, buildPreviewSql(rows), 'utf8');
  fs.writeFileSync(csvPath, buildCsv(rows), 'utf8');

  console.log(`\nĐã tạo ${rows.length} link edit.`);
  if (failed.length) {
    console.log(`Lỗi ${failed.length} thư mục:`);
    failed.slice(0, 10).forEach(f => console.log(`  - ${f.folder}: ${f.error.split('\n')[0]}`));
  }
  console.log('SQL xem truoc:', previewPath);
  console.log('SQL cap nhat :', sqlPath);
  console.log('CSV          :', csvPath);
})().catch(e => {
  console.error('\nLỖI:', e.message);
  process.exit(1);
});
