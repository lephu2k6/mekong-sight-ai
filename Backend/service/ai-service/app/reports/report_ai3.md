# Bao cao AI3: He thong goi y quyet dinh van hanh

## 1. Muc tieu

AI3 duoc su dung de dua ra quyet dinh van hanh cho mo hinh lua, tom, hoac tom-lua dua tren:

- du bao do man 7 ngay tu AI1
- muc do rui ro hien tai tu AI2
- thong tin mua vu va giai doan canh tac/nuoi

Khac voi AI1 va AI2, AI3 khong phai la mo hinh hoc may duoc train bang nhan du lieu. AI3 la `rule-based decision engine`, tuc he thong quy tac dua ra khuyen nghi hanh dong.

## 2. Dau vao va dau ra

### Dau vao

AI3 nhan cac thong tin sau:

- `crop_mode`: che do canh tac hien tai (`rice` hoac `shrimp`)
- `stage`: giai doan mua vu (`early`, `mid`, `late`)
- `forecast_points`: chuoi du bao do man 7 ngay tu AI1
- `risk_label`: muc rui ro tu AI2 (`Low`, `Medium`, `High`)
- `risk_score`: diem tin cay/muc rui ro cua AI2
- `current_date`: ngay hien tai de xac dinh mua kho hay mua mua

### Dau ra

AI3 tra ve:

- `decision`: quyet dinh chinh
- `urgency`: muc do khan cap (`normal`, `warning`, `critical`)
- `reason`: ly do giai thich
- `actions`: danh sach hanh dong de nghi
- `signals`: cac tin hieu tong hop dung de dua ra quyet dinh

## 3. Logic xu ly cua AI3

Logic AI3 hien tai duoc xay dung trong ham `_build_ai3_decision(...)`.

### Nhom quy tac cho lua

- Neu lua giai doan cuoi vu va co tu `3/7` ngay du bao do man `> 4‰`:
  - quyet dinh: `Thu hoạch khẩn cấp`
- Neu do man du bao thap hon `1‰` va rui ro AI2 o muc `Low/Medium`:
  - quyet dinh: `Tiếp tục vụ lúa`
- Neu do man du bao nam trong khoang `1-4‰` va dang mua kho:
  - quyet dinh: `Chuẩn bị chuyển vụ tôm`
- Neu AI2 danh gia `High`:
  - quyet dinh: `Thu hoạch khẩn cấp`

### Nhom quy tac cho tom

- Neu AI2 la `High` va `risk_score >= 0.75`:
  - quyet dinh: `Điều tiết nước khẩn cấp`
- Neu co nhieu ngay du bao do man `< 5‰` hoac muc man toi thieu `< 3‰`:
  - quyet dinh: `Chuẩn bị chuyển vụ lúa`
- Neu khong roi vao cac truong hop tren:
  - quyet dinh: `Tiếp tục vụ tôm`

## 4. Thang do danh gia

Do AI3 la he thong quy tac, khong phu hop danh gia bang MAE/RMSE.

Thay vao do, AI3 duoc danh gia bang:

- `Decision Accuracy`: ty le case ma quyet dinh thuc te trung voi quyet dinh mong doi
- `Urgency Accuracy`: ty le case ma muc do khan cap trung voi muc mong doi
- `Rule Test Pass Rate`: ty le case dat dong thoi ca decision va urgency

Cong thuc:

- `Decision Accuracy = so case co actual_decision = expected_decision / tong so case`
- `Urgency Accuracy = so case co actual_urgency = expected_urgency / tong so case`

## 5. Bo du lieu test

AI3 hien duoc kiem thu bang bo `scenario validation`, gom `7` tinh huong mo phong dai dien cho cac nhanh quyet dinh chinh.

So luong case test:

- `7` test case

Loai tinh huong gom:

- lua cuoi vu, man cao
- lua an toan, man thap
- lua chuan bi chuyen vu tom
- lua gap rui ro cao
- tom gap rui ro cao
- tom chuan bi chuyen vu lua
- tom van hanh binh thuong

## 6. Ket qua danh gia

| Chi so | Gia tri |
| --- | ---: |
| Tong so case test | 7 |
| Decision Accuracy | 100.00% |
| Urgency Accuracy | 100.00% |
| So case dat | 7/7 |
| Trung binh so hanh dong moi case | 3.14 |

Ket luan theo nguong `tren 80% la tam on`:

- AI3 dat yeu cau, vi decision accuracy va urgency accuracy deu dat `100%`

## 7. Chi tiet bo test

| Case | Dau vao chinh | Ket qua mong doi | Ket qua thuc te | Trang thai |
| --- | --- | --- | --- | --- |
| `rice_late_high_salinity` | lua cuoi vu, do man toi da `4.8‰` | `Thu hoạch khẩn cấp` | `Thu hoạch khẩn cấp` | Dat |
| `rice_safe_low_salinity` | lua, man toi da `0.6‰`, rui ro `Low` | `Tiếp tục vụ lúa` | `Tiếp tục vụ lúa` | Dat |
| `rice_prepare_shrimp_dry_season` | lua, mua kho, man `1-4‰` | `Chuẩn bị chuyển vụ tôm` | `Chuẩn bị chuyển vụ tôm` | Dat |
| `rice_high_risk_override` | lua, AI2 = `High` | `Thu hoạch khẩn cấp` | `Thu hoạch khẩn cấp` | Dat |
| `shrimp_high_risk_emergency` | tom, AI2 = `High`, score `0.88` | `Điều tiết nước khẩn cấp` | `Điều tiết nước khẩn cấp` | Dat |
| `shrimp_prepare_rice_low_salinity` | tom, nhieu ngay man thap | `Chuẩn bị chuyển vụ lúa` | `Chuẩn bị chuyển vụ lúa` | Dat |
| `shrimp_continue_normal` | tom, man on dinh, rui ro trung binh | `Tiếp tục vụ tôm` | `Tiếp tục vụ tôm` | Dat |

## 8. So sanh voi mo hinh truoc do

AI3 hien khong co `model ML` truoc do de so sanh truc tiep theo kieu baseline.

Vi vay, thay vi so sanh voi mo hinh cu, AI3 duoc danh gia theo:

- muc do bao phu logic
- ket qua dung/sai tren bo test case mong doi
- kha nang phan tach ro cac tinh huong `normal`, `warning`, `critical`

Ket luan:

- AI3 dat yeu cau hoat dong tren bo kịch bản hiện tại
- nhung chua co baseline hoc may tuong duong de phat bieu la “tot hon mo hinh truoc do”

## 9. Bo test co su dung so lieu cua minh hay khong

- Co su dung logic va quy tac cua chinh he thong.
- Dau vao cua AI3 dua tren ket qua cua AI1 va AI2 trong du an.
- Tuy nhien bo test hien tai la `scenario test`, chu chua phai du lieu ket qua van hanh thuc dia cua nong ho.

Do do, AI3 hien dat muc danh gia tot ve mat logic, nhung de danh gia manh hon trong thuc te can co:

- phan hoi cua nguoi dung
- lich su override quyet dinh
- ket qua mua vu sau khi ap dung khuyen nghi

## 10. De xuat cai thien

- Tang so luong test case tu `7` len `20-30` truong hop.
- Bo sung cac tinh huong bien nhu:
  - man tang rat nhanh
  - AI2 `High` nhung AI1 du bao giam man
  - lua giua vu gap bien dong man ngat quang
- Ghi log cac truong hop nguoi dung khong dong y voi AI3 de cai tien rule.
- Neu sau nay co du lieu thuc dia, co the phat trien AI3 tu rule-based sang hybrid rule + learning.

## 11. Ket luan cuoi cung

AI3 la he thong goi y quyet dinh van hanh dua tren quy tac, su dung thong tin tong hop tu AI1 va AI2. Tren bo `7` test case dai dien, AI3 dat `Decision Accuracy = 100%` va `Urgency Accuracy = 100%`, cho thay logic hien tai hoat dong dung theo muc tieu thiet ke. Vi vay, AI3 duoc ket luan la `dat` o giai doan hien tai, phu hop de tich hop vao he thong ho tro ra quyet dinh, nhung van can mo rong bo test va bo sung du lieu thuc dia de danh gia sau hon.
