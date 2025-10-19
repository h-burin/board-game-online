# แก้ปัญหา ITO Game - รอบ 2 ไม่แสดงช่องกรอก

## ปัญหาที่พบ

### 1. รอบ 2 ไม่มีช่องกรอกคำใบ้
**สาเหตุ**: `myAnswers` มีข้อมูลแต่ UI condition ไม่ตรง

**วิธีแก้**:
- เปิด Browser Console ดู error
- ตรวจสอบว่า `gameState.phase === 'writing'`
- ตรวจสอบว่า `myAnswers.length > 0`

### 2. หมดเวลาบังคับส่งคำตอบว่าง
**ปัญหา**: ไม่มี logic จัดการ timeout

**วิธีแก้**: ลบ auto-submit เมื่อหมดเวลา หรือส่งเฉพาะที่กรอกแล้ว

### 3. Code ซับซ้อน
**ปัญหา**: Component ใหญ่เกินไป

**วิธีแก้**: แยกเป็น subcomponents

---

## วิธีแก้ไขเร่งด่วน

### ขั้นตอนที่ 1: สร้างห้องใหม่
1. ไปที่ Firebase Console
2. ลบ game_sessions เก่า (ที่ไม่มี currentLevel)
3. สร้างห้องใหม่ทดสอบ

### ขั้นตอนที่ 2: ตรวจสอบ Browser Console
เปิด DevTools และดู:
```
🎮 ItoGame render: { phase: 'writing', myAnswersCount: 2, ... }
```

ถ้า `myAnswersCount = 0` แสดงว่า Firestore ยังไม่ส่งข้อมูลมา

### ขั้นตอนที่ 3: Hard Reload
กด `Cmd + Shift + R` (Mac) หรือ `Ctrl + Shift + R` (Windows) เพื่อ clear cache

---

## การ Refactor (ทำหลังแก้ bug)

### แยก Components:
1. `ItoGameHeader` - แสดง hearts, timer, level
2. `ItoWritingPhase` - ช่องกรอกคำใบ้
3. `ItoVotingPhase` - โหวต
4. `ItoRevealPhase` - แสดงผล
5. `ItoLevelComplete` - ระหว่างรอบ

### ใช้ Custom Hooks:
1. `useItoGamePhase` - จัดการ phase transitions
2. `useItoAnswers` - จัดการคำตอบ
3. `useItoTimer` - จัดการเวลา
