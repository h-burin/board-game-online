# 🔍 DEBUG: Level 2 Input Fields Issue

## สาเหตุหลัก
คุณกำลังใช้ **game session เก่า** ที่สร้างก่อนมีการอัปเดต code ล่าสุด!

Sessions เก่าเหล่านี้:
- `pQv2kBW6K4BxTWvFdRCb`
- `Xmo78E6vtHSNCUlwjeVq`
- และอื่นๆ

ไม่มีข้อมูล `currentLevel`, `totalLevels`, `answerIndex` ที่ถูกต้องใน Firestore

---

## ✅ วิธีแก้ปัญหา (ทำตามทุกขั้นตอน!)

### 1. ปิด Browser Tab เก่าทั้งหมด

### 2. สร้างห้องใหม่ (ห้ามใช้ห้องเก่า!)
1. เปิด browser ใหม่ (แนะนำ: Incognito/Private mode)
2. ไปที่ `http://localhost:3000`
3. กด **"สร้างห้อง"** เพื่อสร้างห้อง**ใหม่**
4. อย่าใช้ห้องเก่าหรือ join ห้องที่มีอยู่แล้ว!

### 3. เปิด Browser Console (สำคัญมาก!)
- Chrome: กด `Cmd + Option + J` (Mac) หรือ `F12`
- เลือกแท็บ **Console**
- **เก็บ console ไว้เปิดตลอด**

### 4. เริ่มเล่นเกม ITO
1. เลือกเกม **ITO**
2. เริ่มเกม Level 1 ตามปกติ
3. เล่นจนจบ Level 1
4. เมื่อปุ่ม "เริ่ม Level 2" ปรากฏ → กดเริ่ม Level 2

### 5. สังเกต Console Logs
เมื่อเริ่ม Level 2 คุณจะเห็น logs เหล่านี้:

```
✅ Started Level 2: {...}
🔍 [checkAllAnswersSubmitted] { sessionId: '...', totalDocs: 4, isEmpty: false }
📋 [checkAllAnswersSubmitted] Details: [
  { docId: 'xxx_0', playerId: 'xxx', answerIndex: 0, hasAnswer: false, hasSubmittedAt: false, isSubmitted: false },
  { docId: 'xxx_1', playerId: 'xxx', answerIndex: 1, hasAnswer: false, hasSubmittedAt: false, isSubmitted: false },
  ...
]
⚠️ [checkAllAnswersSubmitted] All submitted = FALSE
```

### 6. ถ่ายหน้าจอและส่งมาให้ผม
1. ถ่าย**หน้าจอ UI** (แสดง Level 2)
2. ถ่าย**หน้าจอ Console** (แสดง debug logs)
3. ส่ง**ทั้งสองภาพ**มาให้ผม

---

## 🚨 สิ่งที่ต้องหลีกเลี่ยง

❌ **อย่า**ใช้ห้องเก่า
❌ **อย่า**ใช้ session ID เก่า (`pQv2kBW6K4BxTWvFdRCb` ฯลฯ)
❌ **อย่า**ลืมเปิด Console
❌ **อย่า**ลืมถ่ายหน้าจอ Console logs

✅ **ต้อง**สร้างห้องใหม่ทั้งหมด
✅ **ต้อง**เปิด Browser Console
✅ **ต้อง**ถ่ายหน้าจอทั้ง UI และ Console

---

## 📊 ข้อมูลที่ผมต้องการ

1. Session ID ใหม่ (จะอยู่ใน URL: `http://localhost:3000/games/xxx`)
2. Screenshot ของ UI Level 2
3. Screenshot ของ Console logs ทั้งหมด
4. บอกว่าเห็น input fields หรือไม่

---

## 💡 คาดหวังผลลัพธ์

ถ้าใช้**ห้องใหม่**:
- Level 2 ควรแสดง **2 ช่องให้กรอกคำใบ้**
- แต่ละช่องจะมี**เลขต่างกัน**
- Console จะแสดง `All submitted = FALSE`
- Phase จะอยู่ที่ `'writing'` ไม่ใช่ `'voting'`

---

**กรุณาทำตามขั้นตอนทุกข้อและส่งข้อมูลมาให้ผมด้วยครับ!** 🙏
