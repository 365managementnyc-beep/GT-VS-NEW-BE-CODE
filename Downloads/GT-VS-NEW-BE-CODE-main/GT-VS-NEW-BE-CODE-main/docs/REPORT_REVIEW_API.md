# Report Review API Documentation

## Overview
The Report Review API allows users to report inappropriate reviews and admins to manage these reports. This system includes status tracking, notifications, and comprehensive statistics.

---

## Base URL
```
/api/report-review
```

---

## Authentication
All endpoints require authentication via Bearer token:
```
Authorization: Bearer <token>
```

---

## Report Types
Valid report types for reviews:
- `Off_topic` - Review is not relevant to the service
- `Spam` - Review contains spam or advertising
- `Conflict` - Review shows conflict of interest
- `Profanity` - Review contains offensive language
- `Harassment` - Review contains harassment
- `Hate_speech` - Review contains hate speech
- `Personal_information` - Review exposes personal information
- `Not_helpful` - Review is not helpful
- `Other` - Other reasons

---

## Report Status
Valid status values:
- `pending` - Report submitted, awaiting review (default)
- `under_review` - Admin is reviewing the report
- `resolved` - Report has been resolved
- `rejected` - Report has been rejected

---

## Endpoints

### 1. Create Report (User)
**POST** `/api/report-review`

**Access:** Customer, Vendor

**Description:** Create a new report for a review. Users cannot report the same review twice.

**Request Body:**
```json
{
  "reviewId": "670123456789abcdef012345",
  "reportType": "Spam"
}
```

**Response:** `201 Created`
```json
{
  "status": "success",
  "message": "Review reported successfully",
  "data": {
    "report": {
      "_id": "670123456789abcdef012346",
      "reviewId": "670123456789abcdef012345",
      "reportedBy": "670123456789abcdef012344",
      "reportType": "Spam",
      "status": "pending",
      "adminNote": "",
      "isDeleted": false,
      "createdAt": "2025-10-11T10:30:00.000Z",
      "updatedAt": "2025-10-11T10:30:00.000Z"
    }
  }
}
```

**Notifications:**
- Admin receives notification: "New Review Report - [User Name] has reported a review for [Report Type]"

**Validation Errors:**
- Review not found
- User has already reported this review
- Invalid report type

---

### 2. Get All Reported Reviews (Admin)
**GET** `/api/report-review`

**Access:** Admin only

**Description:** Get all reported reviews with pagination and filters.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 10 | Items per page |
| status | string | - | Filter by status (pending, under_review, resolved, rejected) |
| reportType | string | - | Filter by report type |
| isDeleted | boolean | false | Include deleted reports |

**Example Request:**
```
GET /api/report-review?page=1&limit=10&status=pending&reportType=Spam
```

**Response:** `200 OK`
```json
{
  "status": "success",
  "results": 10,
  "total": 45,
  "page": 1,
  "totalPages": 5,
  "data": {
    "reports": [
      {
        "_id": "670123456789abcdef012346",
        "reviewId": {
          "_id": "670123456789abcdef012345",
          "rating": 5,
          "comment": "Great service!",
          "reviewer": {
            "_id": "670123456789abcdef012343",
            "firstName": "John",
            "lastName": "Doe",
            "email": "john@example.com"
          }
        },
        "reportedBy": {
          "_id": "670123456789abcdef012344",
          "firstName": "Jane",
          "lastName": "Smith",
          "email": "jane@example.com"
        },
        "reportType": "Spam",
        "status": "pending",
        "adminNote": "",
        "reviewedBy": null,
        "reviewedAt": null,
        "isDeleted": false,
        "createdAt": "2025-10-11T10:30:00.000Z",
        "updatedAt": "2025-10-11T10:30:00.000Z"
      }
    ]
  }
}
```

---

### 3. Get Report Statistics (Admin)
**GET** `/api/report-review/statistics`

**Access:** Admin only

**Description:** Get comprehensive statistics about reported reviews.

**Response:** `200 OK`
```json
{
  "status": "success",
  "data": {
    "overview": {
      "total": 45,
      "pending": 15,
      "underReview": 10,
      "resolved": 18,
      "rejected": 2
    },
    "statusBreakdown": [
      {
        "_id": "pending",
        "count": 15
      },
      {
        "_id": "under_review",
        "count": 10
      },
      {
        "_id": "resolved",
        "count": 18
      },
      {
        "_id": "rejected",
        "count": 2
      }
    ],
    "reportTypeBreakdown": [
      {
        "_id": "Spam",
        "count": 20
      },
      {
        "_id": "Harassment",
        "count": 12
      },
      {
        "_id": "Profanity",
        "count": 8
      },
      {
        "_id": "Off_topic",
        "count": 5
      }
    ]
  }
}
```

---

### 4. Get Reports by Status (Admin)
**GET** `/api/report-review/status/:status`

**Access:** Admin only

**Description:** Get all reports filtered by a specific status.

**Path Parameters:**
- `status` - One of: pending, under_review, resolved, rejected

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 10 | Items per page |
| reportType | string | - | Filter by report type |

**Example Request:**
```
GET /api/report-review/status/pending?page=1&limit=10
```

**Response:** `200 OK`
```json
{
  "status": "success",
  "results": 10,
  "total": 15,
  "page": 1,
  "totalPages": 2,
  "data": {
    "reports": [...]
  }
}
```

---

### 5. Get Single Report (Admin)
**GET** `/api/report-review/:id`

**Access:** Admin only

**Description:** Get details of a specific report by ID.

**Path Parameters:**
- `id` - Report ID

**Response:** `200 OK`
```json
{
  "status": "success",
  "data": {
    "report": {
      "_id": "670123456789abcdef012346",
      "reviewId": {
        "_id": "670123456789abcdef012345",
        "rating": 5,
        "comment": "Great service!",
        "reviewer": {...},
        "reviewOn": {...}
      },
      "reportedBy": {...},
      "reportType": "Spam",
      "status": "pending",
      "adminNote": "",
      "reviewedBy": null,
      "reviewedAt": null,
      "isDeleted": false,
      "createdAt": "2025-10-11T10:30:00.000Z",
      "updatedAt": "2025-10-11T10:30:00.000Z"
    }
  }
}
```

**Error Response:** `404 Not Found`
```json
{
  "status": "fail",
  "message": "Report not found"
}
```

---

### 6. Update Report Status (Admin)
**PATCH** `/api/report-review/:id`

**Access:** Admin only

**Description:** Update the status of a report and optionally add admin notes.

**Path Parameters:**
- `id` - Report ID

**Request Body:**
```json
{
  "status": "resolved",
  "adminNote": "Review has been removed due to spam content."
}
```

**Response:** `200 OK`
```json
{
  "status": "success",
  "message": "Report status updated successfully",
  "data": {
    "report": {
      "_id": "670123456789abcdef012346",
      "reviewId": {...},
      "reportedBy": {...},
      "reportType": "Spam",
      "status": "resolved",
      "adminNote": "Review has been removed due to spam content.",
      "reviewedBy": {
        "_id": "670123456789abcdef012340",
        "firstName": "Admin",
        "lastName": "User",
        "email": "admin@example.com"
      },
      "reviewedAt": "2025-10-11T11:00:00.000Z",
      "isDeleted": false,
      "createdAt": "2025-10-11T10:30:00.000Z",
      "updatedAt": "2025-10-11T11:00:00.000Z"
    }
  }
}
```

**Notifications:**
- When status is changed to `resolved` or `rejected`, the reporter receives a notification with the admin note.

**Validation Errors:**
- Invalid status value
- Report not found

---

### 7. Delete Report (Admin)
**DELETE** `/api/report-review/:id`

**Access:** Admin only

**Description:** Soft delete a report. The report is marked as deleted but not removed from the database.

**Path Parameters:**
- `id` - Report ID

**Response:** `204 No Content`

**Error Response:** `404 Not Found`
```json
{
  "status": "fail",
  "message": "Report not found"
}
```

---

## Workflow

### User Workflow
1. User encounters inappropriate review
2. User submits report via POST `/api/report-review`
3. System validates (review exists, no duplicate reports)
4. Report created with status `pending`
5. Admin receives notification
6. User waits for admin action

### Admin Workflow
1. Admin receives notification of new report
2. Admin views all pending reports via GET `/api/report-review?status=pending`
3. Admin reviews specific report via GET `/api/report-review/:id`
4. Admin takes action:
   - PATCH `/api/report-review/:id` with status `under_review`
   - Investigate the reported review
   - PATCH `/api/report-review/:id` with status `resolved` or `rejected`
   - Add admin notes explaining the decision
5. Reporter receives notification of the outcome

---

## Database Schema

### ReportReview Model
```javascript
{
  reviewId: ObjectId (ref: 'Review', required),
  reportedBy: ObjectId (ref: 'User', required),
  reportType: String (enum, required),
  status: String (enum, default: 'pending'),
  adminNote: String (default: ''),
  reviewedBy: ObjectId (ref: 'User'),
  reviewedAt: Date,
  isDeleted: Boolean (default: false),
  timestamps: true
}
```

**Indexes:**
- `isDeleted`
- `status`
- `reportedBy`
- `reviewId`

---

## Error Codes

| Code | Message | Description |
|------|---------|-------------|
| 400 | Validation failed | Invalid input data |
| 400 | You have already reported this review | Duplicate report attempt |
| 400 | Invalid status | Invalid status value provided |
| 401 | Unauthorized | Missing or invalid authentication token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Report not found | Report ID doesn't exist |
| 404 | Review not found | Review ID doesn't exist |

---

## Notification System

### When Report is Created:
- **To:** Admin
- **Title:** "New Review Report"
- **Message:** "[User Name] has reported a review for [Report Type]"
- **Type:** review
- **Permission:** venue_feedback

### When Status is Updated to Resolved/Rejected:
- **To:** Reporter (user who created the report)
- **Title:** "Report Resolved" or "Report Rejected"
- **Message:** "Your report has been [status]. [Admin note if provided]"
- **Type:** review
- **Permission:** venue_feedback

Notifications are sent via:
- Email (if enabled in settings)
- SMS (if enabled in settings)
- In-app notification (Socket.IO)
- Based on NotificationPermission settings

---

## Testing with Postman

1. Import the Postman collection: `Report_Review_API.postman_collection.json`
2. Set environment variables:
   - `base_url`: Your API base URL (e.g., http://localhost:3000)
   - `access_token`: User authentication token
   - `admin_token`: Admin authentication token
3. Test endpoints in order:
   - Create a report as a user
   - View all reports as admin
   - Get statistics as admin
   - Update report status as admin
   - Verify notifications are sent

---

## Security Considerations

1. **Authentication Required:** All endpoints require valid JWT token
2. **Role-Based Access:** 
   - Users (customer/vendor) can only create reports
   - Admins have full access to manage reports
3. **Duplicate Prevention:** Users cannot report same review multiple times
4. **Soft Delete:** Reports are soft-deleted to maintain audit trail
5. **Audit Trail:** Tracks who reviewed, when, and what decision was made

---

## Best Practices

1. **For Users:**
   - Only report reviews that genuinely violate guidelines
   - Provide accurate report type for faster resolution

2. **For Admins:**
   - Review reports promptly (especially pending ones)
   - Always add admin notes when resolving/rejecting
   - Use status progression: pending → under_review → resolved/rejected
   - Check statistics regularly to identify patterns

3. **For Developers:**
   - Monitor notification delivery
   - Set up alerts for high pending report counts
   - Regular backup of report data
   - Index optimization for large datasets

---

## Future Enhancements

- [ ] Bulk status updates for multiple reports
- [ ] Report appeal system
- [ ] Auto-flagging based on report count
- [ ] Integration with review moderation system
- [ ] Email templates for report notifications
- [ ] Report analytics and trends
- [ ] Automated report resolution based on criteria

---

## Support

For issues or questions about the Report Review API, please contact the development team or refer to the main API documentation.
