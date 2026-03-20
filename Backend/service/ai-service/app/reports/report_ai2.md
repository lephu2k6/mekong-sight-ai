# Bao cao AI2: Danh gia mo hinh rui ro

## 1. Muc tieu

AI2 duoc su dung de danh gia muc do rui ro xam nhap man theo 3 nhan:

- `Low`
- `Medium`
- `High`

Muc tieu cua buoc danh gia la kiem tra xem mo hinh `xgboost` co dat muc chap nhan va co tot hon mo hinh baseline `baseline_logistic` hay khong.

## 2. Thang do danh gia

AI2 la bai toan phan loai da lop, vi vay cac chi so danh gia su dung gom:

- `Accuracy`: ty le du doan dung tren tong so mau test.
- `Precision`: do chinh xac cua tung lop duoc mo hinh du doan.
- `Recall`: kha nang tim dung cac mau thuoc tung lop.
- `F1-score`: trung binh dieu hoa giua precision va recall.
- `Confusion matrix`: bang thong ke so luong du doan dung/sai theo tung lop.

## 3. Bo du lieu test

- Nguon du lieu: du lieu local cua du an ket hop voi du lieu weather.
- Kich thuoc tap train: `1430` mau.
- Kich thuoc tap test: `358` mau.
- So feature dau vao: `19`.
- Nhan danh gia: `High`, `Low`, `Medium`.

Phan bo nhan trong bo du lieu:

| Label | So mau |
| --- | ---: |
| `Medium` | 1179 |
| `High` | 411 |
| `Low` | 198 |

## 4. Cong thuc tinh ket qua kiem thu

- `Accuracy = so du doan dung / tong so mau`
- `Precision = TP / (TP + FP)`
- `Recall = TP / (TP + FN)`
- `F1 = 2 x Precision x Recall / (Precision + Recall)`

## 5. Ket qua danh gia

| Model | Test rows | Accuracy | Precision macro | Recall macro | F1 macro | F1 weighted |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `baseline_logistic` | 358 | 68.99% | 71.82% | 81.72% | 68.93% | 72.58% |
| `xgboost` | 358 | 87.43% | 79.43% | 71.39% | 72.94% | 85.45% |

Ket luan theo nguong `tren 80% la tam on`:

- `baseline_logistic`: khong dat, vi accuracy chi `68.99%`
- `xgboost`: dat, vi accuracy `87.43%`

## 6. So sanh voi mo hinh truoc do

Mo hinh cu dung de so sanh la `baseline_logistic`.
Mo hinh moi la `xgboost`.

Bang so sanh:

| Chi so | Baseline | XGBoost | Chenh lech |
| --- | ---: | ---: | ---: |
| Accuracy | 68.99% | 87.43% | +18.44 diem % |
| F1 weighted | 72.58% | 85.45% | +12.87 diem % |

Ket luan:

- `xgboost` tot hon `baseline_logistic`
- neu ap dung quy tac mo hinh moi phai tot hon mo hinh truoc do, thi AI2 dat yeu cau

## 7. Phan tich confusion matrix

### Baseline logistic

| Actual \\ Predicted | High | Low | Medium |
| --- | ---: | ---: | ---: |
| `High` | 80 | 0 | 2 |
| `Low` | 0 | 37 | 3 |
| `Medium` | 7 | 99 | 130 |

### XGBoost

| Actual \\ Predicted | High | Low | Medium |
| --- | ---: | ---: | ---: |
| `High` | 79 | 0 | 3 |
| `Low` | 0 | 9 | 31 |
| `Medium` | 4 | 7 | 225 |

Nhan xet:

- `xgboost` phan loai lop `Medium` rat tot.
- `xgboost` giu duoc kha nang nhan dien lop `High`.
- diem yeu hien tai la lop `Low`, do nhieu mau `Low` bi du doan thanh `Medium`.

## 8. Bo test co su dung so lieu cua minh hay khong

- Co su dung du lieu cua du an.
- Du lieu gom: do man, nhiet do, pH, weather, thong tin thoi gian va tinh.
- Tuy nhien nhan `risk_label` hien tai duoc sinh theo rule trong pipeline, chua phai nhan ground-truth gan tay tu chuyen gia hoac du lieu su co thuc dia.

Vi vay, AI2 hien dat muc danh gia tot tren bo du lieu noi bo, nhung can bo sung nhan thuc dia de tang do tin cay khi trien khai thuc te.

## 9. De xuat cai thien

- Tang du lieu cho lop `Low` de giam mat can bang nhan.
- Bo sung nhan rui ro do chuyen gia xac nhan thay vi chi dua tren rule.
- Tune tiep `xgboost` theo muc tieu tang recall cho lop `Low`.
- Theo doi confusion matrix theo tung dot train de phat hien lop nao dang suy giam.

## 10. Ket luan cuoi cung

Tren bo du lieu test gom `358` mau, mo hinh `xgboost` cua AI2 dat `Accuracy = 87.43%` va `F1 weighted = 85.45%`, cao hon ro ret so voi mo hinh `baseline_logistic`. Do do, AI2 duoc ket luan la `dat`, co the su dung lam mo hinh danh gia rui ro hien tai cua he thong, nhung van nen tiep tuc cai thien cho lop `Low`.
