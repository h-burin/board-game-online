# 🔥 Firebase Security Rules Setup

## 📋 ขั้นตอนการตั้งค่า Firestore (Production Mode)

### 1. ในหน้า "Configure" ของ Firebase Console

เลือก **"Start in production mode"**

### 2. คัดลอก Rules จากไฟล์

เปิดไฟล์ `firestore.rules` และคัดลอกโค้ดทั้งหมด

### 3. วางใน Firebase Console

หลังจากสร้าง Firestore เสร็จ:
1. ไปที่ **Firestore Database > Rules**
2. วาง rules จาก `firestore.rules`
3. คลิก **Publish**

หรือคัดลอกโค้ดนี้:

\`\`\`javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Rooms
    match /rooms/{roomId} {
      allow read: if true;
      allow create: if request.resource.data.keys().hasAll(['id', 'code', 'hostId', 'status', 'maxPlayers', 'currentPlayers', 'createdAt', 'updatedAt']);
      allow update: if true;
      allow delete: if resource.data.currentPlayers == 0;
    }

    // Players
    match /players/{playerId} {
      allow read: if true;
      allow create: if request.resource.data.name.size() >= 2 && request.resource.data.name.size() <= 20;
      allow update, delete: if true;
    }

    // Chat
    match /chat/{roomId}/messages/{messageId} {
      allow read: if true;
      allow create: if request.resource.data.message.size() > 0 && request.resource.data.message.size() <= 500;
      allow update, delete: if false;
    }

    // Results
    match /results/{resultId} {
      allow read: if true;
      allow create: if true;
      allow update, delete: if false;
    }

    // Test collection
    match /test/{document=**} {
      allow read, write: if true;
    }
  }
}
\`\`\`

---

## 📋 ขั้นตอนการตั้งค่า Realtime Database

### 1. สร้าง Realtime Database

1. ไปที่ **Build > Realtime Database**
2. คลิก **Create Database**
3. เลือก Location: `asia-southeast1`
4. เลือก **"Start in locked mode"** (Production)

### 2. ตั้งค่า Rules

1. ไปที่ **Realtime Database > Rules**
2. คัดลอกโค้ดจากไฟล์ `database.rules.json`
3. วางแทนที่โค้ดเดิม
4. คลิก **Publish**

หรือคัดลอกโค้ดนี้:

\`\`\`json
{
  "rules": {
    "rooms": {
      "$roomId": {
        ".read": true,
        ".write": true
      }
    },
    "gameState": {
      "$roomId": {
        ".read": true,
        ".write": true
      }
    },
    "players": {
      "$roomId": {
        "$playerId": {
          ".read": true,
          ".write": true
        }
      }
    },
    "presence": {
      "$roomId": {
        "$playerId": {
          ".read": true,
          ".write": true
        }
      }
    },
    "test": {
      ".read": true,
      ".write": true
    }
  }
}
\`\`\`

---

## 🔒 อธิบาย Security Rules

### Firestore Rules

#### Rooms Collection
- **Read**: ทุกคนอ่านได้
- **Create**: ต้องมีฟิลด์ครบถ้วน (id, code, hostId, status, etc.)
- **Update**: ทุกคนแก้ไขได้ (สำหรับ join/leave)
- **Delete**: ลบได้เฉพาะห้องที่ไม่มีคน

#### Players Collection
- **Read**: ทุกคนอ่านได้
- **Create**: ชื่อต้องยาว 2-20 ตัวอักษร
- **Update/Delete**: ทุกคนทำได้

#### Chat Collection
- **Read**: ทุกคนอ่านได้
- **Create**: ข้อความยาวไม่เกิน 500 ตัวอักษร
- **Update/Delete**: ห้ามแก้ไขหรือลบ

#### Results Collection
- **Read**: ทุกคนอ่านได้
- **Create**: สร้างได้
- **Update/Delete**: ห้ามแก้ไขหรือลบ

### Realtime Database Rules

- **rooms/$roomId**: อ่าน/เขียนได้ทุกคน (metadata ห้อง)
- **gameState/$roomId**: อ่าน/เขียนได้ทุกคน (สถานะเกมแบบ real-time)
- **players/$roomId/$playerId**: อ่าน/เขียนได้ทุกคน (ข้อมูลผู้เล่นแบบ real-time)
- **presence/$roomId/$playerId**: ติดตามสถานะ online/offline

---

## ⚠️ หมายเหตุ

1. **Test Collection** มีไว้สำหรับทดสอบเท่านั้น - ลบออกก่อน production
2. Rules เหล่านี้เหมาะสำหรับ MVP และการพัฒนา
3. สำหรับ production จริง ควรเพิ่ม:
   - Authentication check
   - Rate limiting
   - Data validation ที่เข้มงวดขึ้น
   - จำกัดสิทธิ์ update เฉพาะ host/players

---

## 🧪 ทดสอบ Rules

หลังจาก publish rules แล้ว ให้ทดสอบด้วย:

\`\`\`typescript
import { testAllConnections } from '@/lib/firebase/test-connection';

// ในหน้า app/page.tsx
useEffect(() => {
  testAllConnections();
}, []);
\`\`\`

เปิด Browser Console จะเห็นผลการทดสอบ ✅
