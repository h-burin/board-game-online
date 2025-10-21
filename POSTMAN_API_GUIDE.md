# 📮 ITO Questions API - Postman Guide

## Base URL
```
Development: http://localhost:3001
Production: https://your-domain.com
```

---

## 🔑 Authentication
Currently **no authentication** required.

**⚠️ TODO**: Add authentication middleware for production use!

---

## 📚 API Endpoints

### 1. GET All Questions
**Endpoint**: `GET /api/admin/ito/questions`

**Description**: ดึงคำถาม ITO ทั้งหมด

**Request**:
```http
GET http://localhost:3001/api/admin/ito/questions
```

**Response** (200 OK):
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "id": "abc123",
      "questionsTH": "สิ่งที่คุณชอบทำในวันหยุด",
      "createdAt": { "_seconds": 1697800000, "_nanoseconds": 0 },
      "updatedAt": { "_seconds": 1697800000, "_nanoseconds": 0 }
    },
    {
      "id": "def456",
      "questionsTH": "อาหารที่คุณชอบกิน",
      "createdAt": { "_seconds": 1697810000, "_nanoseconds": 0 },
      "updatedAt": { "_seconds": 1697810000, "_nanoseconds": 0 }
    }
  ]
}
```

---

### 2. GET Single Question
**Endpoint**: `GET /api/admin/ito/questions/{questionId}`

**Description**: ดึงคำถามเฉพาะ ID

**Request**:
```http
GET http://localhost:3001/api/admin/ito/questions/abc123
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "abc123",
    "questionsTH": "สิ่งที่คุณชอบทำในวันหยุด",
    "createdAt": { "_seconds": 1697800000, "_nanoseconds": 0 },
    "updatedAt": { "_seconds": 1697800000, "_nanoseconds": 0 }
  }
}
```

**Response** (404 Not Found):
```json
{
  "success": false,
  "error": "Not found",
  "message": "Question with ID abc123 not found"
}
```

---

### 3. POST Create New Question
**Endpoint**: `POST /api/admin/ito/questions`

**Description**: สร้างคำถามใหม่

**Request**:
```http
POST http://localhost:3001/api/admin/ito/questions
Content-Type: application/json

{
  "questionsTH": "สิ่งที่คุณชอบทำในวันหยุด"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "message": "Question created successfully",
  "data": {
    "id": "xyz789",
    "questionsTH": "สิ่งที่คุณชอบทำในวันหยุด"
  }
}
```

**Response** (400 Bad Request) - Missing field:
```json
{
  "success": false,
  "error": "Validation failed",
  "message": "questionsTH is required and must be a string"
}
```

**Response** (400 Bad Request) - Empty string:
```json
{
  "success": false,
  "error": "Validation failed",
  "message": "questionsTH cannot be empty"
}
```

---

### 4. PUT Update Question
**Endpoint**: `PUT /api/admin/ito/questions/{questionId}`

**Description**: แก้ไขคำถาม

**Request**:
```http
PUT http://localhost:3001/api/admin/ito/questions/abc123
Content-Type: application/json

{
  "questionsTH": "สิ่งที่คุณชอบทำในวันหยุด (แก้ไขแล้ว)"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Question updated successfully",
  "data": {
    "id": "abc123",
    "questionsTH": "สิ่งที่คุณชอบทำในวันหยุด (แก้ไขแล้ว)"
  }
}
```

**Response** (404 Not Found):
```json
{
  "success": false,
  "error": "Not found",
  "message": "Question with ID abc123 not found"
}
```

**Response** (400 Bad Request):
```json
{
  "success": false,
  "error": "Validation failed",
  "message": "questionsTH is required and must be a string"
}
```

---

### 5. DELETE Question
**Endpoint**: `DELETE /api/admin/ito/questions/{questionId}`

**Description**: ลบคำถาม

**Request**:
```http
DELETE http://localhost:3001/api/admin/ito/questions/abc123
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Question deleted successfully",
  "data": {
    "id": "abc123"
  }
}
```

**Response** (404 Not Found):
```json
{
  "success": false,
  "error": "Not found",
  "message": "Question with ID abc123 not found"
}
```

---

## 🧪 Testing with Postman

### Setup

1. **Create New Collection**: "ITO Questions API"
2. **Set Base URL Variable**:
   - Variable: `baseUrl`
   - Initial Value: `http://localhost:3001`
   - Current Value: `http://localhost:3001`

### Example Requests

#### 1. Get All Questions
```
Method: GET
URL: {{baseUrl}}/api/admin/ito/questions
```

#### 2. Get Single Question
```
Method: GET
URL: {{baseUrl}}/api/admin/ito/questions/YOUR_QUESTION_ID
```

#### 3. Create Question
```
Method: POST
URL: {{baseUrl}}/api/admin/ito/questions
Headers:
  Content-Type: application/json
Body (raw JSON):
{
  "questionsTH": "สิ่งที่คุณชอบทำในวันหยุด"
}
```

#### 4. Update Question
```
Method: PUT
URL: {{baseUrl}}/api/admin/ito/questions/YOUR_QUESTION_ID
Headers:
  Content-Type: application/json
Body (raw JSON):
{
  "questionsTH": "สิ่งที่คุณชอบทำในวันหยุด (แก้ไข)"
}
```

#### 5. Delete Question
```
Method: DELETE
URL: {{baseUrl}}/api/admin/ito/questions/YOUR_QUESTION_ID
```

---

## 🔍 Testing Flow

### Complete CRUD Test Flow:

1. **GET All** → เช็คว่ามีคำถามอะไรบ้าง
2. **POST** → สร้างคำถามใหม่ → เก็บ `id` ที่ได้
3. **GET Single** → ดึงคำถามที่สร้างมา (ใช้ `id` จากขั้นที่ 2)
4. **PUT** → แก้ไขคำถาม
5. **GET Single** → เช็คว่าแก้ไขสำเร็จ
6. **DELETE** → ลบคำถาม
7. **GET All** → เช็คว่าลบสำเร็จ

---

## 📊 Status Codes

| Code | Description |
|------|-------------|
| 200  | OK - Request successful |
| 201  | Created - Resource created successfully |
| 400  | Bad Request - Invalid input |
| 404  | Not Found - Resource not found |
| 500  | Internal Server Error - Server error |

---

## ⚠️ Error Handling

All errors follow this format:
```json
{
  "success": false,
  "error": "Error type",
  "message": "Detailed error message"
}
```

---

## 🔐 Security Notes

**Current State**: No authentication ⚠️

**TODO for Production**:
1. Add authentication middleware
2. Validate admin permissions
3. Add rate limiting
4. Add CORS configuration
5. Add request validation
6. Add logging

---

## 📝 Example curl Commands

### GET All Questions
```bash
curl http://localhost:3001/api/admin/ito/questions
```

### POST Create Question
```bash
curl -X POST http://localhost:3001/api/admin/ito/questions \
  -H "Content-Type: application/json" \
  -d '{"questionsTH":"สิ่งที่คุณชอบทำในวันหยุด"}'
```

### PUT Update Question
```bash
curl -X PUT http://localhost:3001/api/admin/ito/questions/YOUR_ID \
  -H "Content-Type: application/json" \
  -d '{"questionsTH":"คำถามที่แก้ไขแล้ว"}'
```

### DELETE Question
```bash
curl -X DELETE http://localhost:3001/api/admin/ito/questions/YOUR_ID
```

---

## 🎯 Quick Start

1. เปิด Postman
2. Create new request
3. เลือก method (GET/POST/PUT/DELETE)
4. ใส่ URL: `http://localhost:3001/api/admin/ito/questions`
5. ถ้าเป็น POST/PUT: เพิ่ม Body → raw → JSON
6. กด Send
7. ดูผลลัพธ์

---

**Created**: 2025-10-21
**Last Updated**: 2025-10-21
**API Version**: 1.0.0
