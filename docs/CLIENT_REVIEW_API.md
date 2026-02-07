# Client Review API Documentation

## Overview
Simple CRUD API for managing client reviews/testimonials. Admin can create, update, and delete reviews. Public endpoints available for displaying reviews on landing pages.

---

## Base URL
```
/api/client-review
```

---

## Features
✅ **Create, Read, Update, Delete** operations  
✅ **Joi validation** for all inputs  
✅ **Public landing page endpoint** (no pagination)  
✅ **Paginated endpoint** for admin panels  
✅ **Rating system** (1-5 stars)  
✅ **Image support** (imageKey & imageUrl)  
✅ **Active/Inactive status**  
✅ **Hard delete** (permanent removal)  

---

## Endpoints Summary

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/landing-page` | Public | Get all active reviews for landing page |
| GET | `/` | Public | Get all reviews with pagination |
| GET | `/:id` | Public | Get single review by ID |
| POST | `/` | Admin | Create new review |
| PATCH | `/:id` | Admin | Update review |
| DELETE | `/:id` | Admin | Delete review (hard delete) |

---

## Public Endpoints

### 1. Get Landing Page Reviews
**GET** `/api/client-review/landing-page`

**Description:** Returns ALL active client reviews without pagination. Perfect for landing page testimonial sections.

**Access:** Public (no authentication required)

**Response:**
```json
{
  "status": "success",
  "results": 25,
  "averageRating": 4.6,
  "data": {
    "clientReviews": [
      {
        "_id": "670123456789abcdef012345",
        "rating": 5,
        "description": "Excellent service! Highly recommended!",
        "clientName": "John Doe",
        "imageKey": "client-reviews/john-doe.jpg",
        "imageUrl": "https://example.com/images/john-doe.jpg",
        "createdAt": "2025-10-13T12:00:00.000Z"
      }
    ]
  }
}
```

**Key Features:**
- ✅ No pagination - returns all reviews
- ✅ Only active reviews (isActive: true, isDeleted: false)
- ✅ Includes average rating calculation
- ✅ Sorted by newest first
- ✅ Optimized fields only

---

### 2. Get All Client Reviews (Paginated)
**GET** `/api/client-review`

**Description:** Get client reviews with pagination and filtering.

**Access:** Public

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 10 | Items per page |
| rating | number | - | Filter by rating (1-5) |
| isActive | boolean | - | Filter by active status |
| isDeleted | boolean | false | Include deleted reviews |
| search | string | - | Search in client name or description |
| sort | string | -createdAt | Sort field (prefix with - for descending) |

**Example Request:**
```
GET /api/client-review?page=1&limit=10&rating=5&isActive=true&sort=-createdAt
```

**Response:**
```json
{
  "status": "success",
  "results": 10,
  "total": 50,
  "page": 1,
  "totalPages": 5,
  "data": {
    "clientReviews": [...]
  }
}
```

---

### 3. Get Single Client Review
**GET** `/api/client-review/:id`

**Description:** Get a single review by ID.

**Access:** Public

**Response:**
```json
{
  "status": "success",
  "data": {
    "clientReview": {
      "_id": "670123456789abcdef012345",
      "rating": 5,
      "description": "Excellent service!",
      "clientName": "John Doe",
      "imageKey": "client-reviews/john-doe.jpg",
      "imageUrl": "https://example.com/images/john-doe.jpg",
      "isDeleted": false,
      "isActive": true,
      "createdAt": "2025-10-13T12:00:00.000Z",
      "updatedAt": "2025-10-13T12:00:00.000Z"
    }
  }
}
```

---

## Admin Endpoints

### 4. Create Client Review
**POST** `/api/client-review`

**Access:** Admin only

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "rating": 5,
  "description": "Excellent service! The team was professional and delivered beyond our expectations.",
  "clientName": "John Doe",
  "imageKey": "client-reviews/john-doe.jpg",
  "imageUrl": "https://example.com/images/john-doe.jpg"
}
```

**Required Fields:**
- `rating` (Number, 1-5): Client rating
- `description` (String, max 1000 chars): Review description
- `clientName` (String, max 100 chars): Client's name

**Optional Fields:**
- `imageKey` (String): S3 key for client image
- `imageUrl` (String): Full URL to client image

**Response:** `201 Created`
```json
{
  "status": "success",
  "message": "Client review created successfully",
  "data": {
    "clientReview": {...}
  }
}
```

**Validation Errors:** `400 Bad Request`
```json
{
  "status": "fail",
  "message": "Validation failed",
  "errorFields": {
    "rating": "Rating must be between 1 and 5",
    "description": "Description is required",
    "clientName": "Client name is required"
  }
}
```

---

### 5. Update Client Review
**PATCH** `/api/client-review/:id`

**Access:** Admin only

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:** (All fields optional)
```json
{
  "rating": 5,
  "description": "Updated description",
  "clientName": "John Doe",
  "imageKey": "client-reviews/john-updated.jpg",
  "imageUrl": "https://example.com/images/john-updated.jpg",
  "isActive": true
}
```

**Response:** `200 OK`
```json
{
  "status": "success",
  "message": "Client review updated successfully",
  "data": {
    "clientReview": {...}
  }
}
```

---

### 6. Delete Client Review
**DELETE** `/api/client-review/:id`

**Access:** Admin only

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Description:** Permanently deletes the review from the database (hard delete).

**⚠️ Warning:** This action cannot be undone.

**Response:** `200 OK`
```json
{
  "status": "success",
  "message": "Client review deleted successfully",
  "data": null
}
```

---

## Data Model

### ClientReview Schema
```javascript
{
  rating: Number (required, 1-5),
  description: String (required, max 1000 chars),
  clientName: String (required, max 100 chars),
  imageKey: String (optional),
  imageUrl: String (optional),
  isDeleted: Boolean (default: false),
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `isDeleted, isActive` (compound index)
- `rating` (descending)
- `createdAt` (descending)

---

## Validation Rules

### Rating
- ✅ Must be a number
- ✅ Minimum value: 1
- ✅ Maximum value: 5
- ✅ Required for create

### Description
- ✅ Must be a string
- ✅ Cannot be empty
- ✅ Maximum length: 1000 characters
- ✅ Required for create
- ✅ Trimmed automatically

### Client Name
- ✅ Must be a string
- ✅ Cannot be empty
- ✅ Maximum length: 100 characters
- ✅ Required for create
- ✅ Trimmed automatically

### Image Key
- ✅ Optional
- ✅ Must be a string
- ✅ Can be empty

### Image URL
- ✅ Optional
- ✅ Must be a valid URL format
- ✅ Can be empty

### isActive
- ✅ Optional
- ✅ Must be boolean
- ✅ Default: true

---

## Error Responses

### 400 Bad Request
```json
{
  "status": "fail",
  "message": "Validation failed",
  "errorFields": {
    "rating": "Rating must be between 1 and 5"
  }
}
```

### 401 Unauthorized
```json
{
  "status": "fail",
  "message": "You are not logged in! Please log in to get access."
}
```

### 403 Forbidden
```json
{
  "status": "fail",
  "message": "You do not have permission to perform this action"
}
```

### 404 Not Found
```json
{
  "status": "fail",
  "message": "Client review not found"
}
```

---

## Testing with Postman

1. **Import Collection:**
   - File: `Client_Review_API.postman_collection.json`

2. **Set Environment Variables:**
   ```
   base_url: http://localhost:3000
   admin_token: <your_admin_jwt_token>
   review_id: <review_id_for_testing>
   ```

3. **Test Flow:**
   - ✅ Create review as admin
   - ✅ Get landing page reviews (public)
   - ✅ Get all reviews with pagination (public)
   - ✅ Get single review (public)
   - ✅ Update review as admin
   - ✅ Delete review as admin

---

## Integration Examples

### Landing Page - React Example
```javascript
// Fetch reviews for landing page
const fetchLandingPageReviews = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/client-review/landing-page');
    const data = await response.json();
    
    if (data.status === 'success') {
      setReviews(data.data.clientReviews);
      setAverageRating(data.averageRating);
    }
  } catch (error) {
    console.error('Error fetching reviews:', error);
  }
};
```

### Admin Panel - Create Review
```javascript
const createReview = async (reviewData) => {
  try {
    const response = await fetch('http://localhost:3000/api/client-review', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify(reviewData)
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating review:', error);
  }
};
```

---

## Best Practices

### For Frontend Developers:
1. **Landing Page:** Use `/landing-page` endpoint for testimonials
2. **Caching:** Cache landing page reviews (update every 5-10 minutes)
3. **Images:** Always provide fallback for missing images
4. **Rating Display:** Show average rating prominently
5. **Loading States:** Handle loading and error states gracefully

### For Admins:
1. **Quality:** Ensure reviews are genuine and well-written
2. **Images:** Use high-quality client photos (recommended size: 200x200px)
3. **Length:** Keep descriptions concise (200-300 words ideal)
4. **Active Status:** Toggle isActive to show/hide reviews without deleting
5. **Regular Updates:** Keep reviews fresh and relevant

---

## Files Structure

```
src/
├── controllers/
│   └── clientReviewController.js    # Business logic
├── models/
│   └── ClienReview.js                # Mongoose schema
├── routes/
│   └── clientReviewRoute.js          # API routes
└── utils/
    └── joi/
        └── clientReviewValidation.js # Validation schemas
```

---

## Quick Start

1. **Start Server:**
   ```bash
   npm start
   ```

2. **Test Public Endpoint:**
   ```bash
   curl http://localhost:3000/api/client-review/landing-page
   ```

3. **Test Admin Endpoint:**
   ```bash
   curl -X POST http://localhost:3000/api/client-review \
     -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "rating": 5,
       "description": "Great service!",
       "clientName": "John Doe"
     }'
   ```

---

## Support

For issues or questions about the Client Review API, contact the development team or refer to the main API documentation.

---

**Last Updated:** October 13, 2025  
**Version:** 1.0.0  
**Status:** ✅ Production Ready
