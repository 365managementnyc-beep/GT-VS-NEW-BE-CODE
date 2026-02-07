# Fixed: MongoDB "$expr can only be applied to the top-level document" Error

## 🐛 Problem

**Error Message:**
```
MongoServerError: $expr can only be applied to the top-level document
```

**Root Cause:**
The error occurred when trying to use `$expr` inside an `$elemMatch` operator in the initial `$match` stage. MongoDB doesn't allow `$expr` with field references (like `$startTime`) inside `$elemMatch` at the document level because those fields are nested inside array elements and aren't accessible in that context.

**Problematic Code:**
```javascript
matchStage.serviceDays = {
  $elemMatch: {
    $expr: {  // ❌ Can't use $expr here with nested field references
      $and: [
        {
          $lte: [
            {
              $add: [
                {
                  $multiply: [
                    { $toInt: { $arrayElemAt: [{ $split: ['$startTime', ':'] }, 0] } },
                    60
                  ]
                },
                { $toInt: { $arrayElemAt: [{ $split: ['$startTime', ':'] }, 1] } }
              ]
            },
            checkInMinutes
          ]
        },
        // ... more conditions
      ]
    }
  }
};
```

---

## ✅ Solution

### Approach:
Instead of using `$expr` in the initial `$match` stage with `$elemMatch`, we:
1. Store the time filter parameters as internal flags in the query object
2. Create a separate aggregation stage that applies the time filter using `$expr` at the top level
3. Use `$filter` to find matching days in the `serviceDays` array

### Implementation:

**1. Modified `getfilterquery` function:**
```javascript
if (checkInTime && checkOutTime) {
  const [inH, inM] = checkInTime.split(':').map(Number);
  const [outH, outM] = checkOutTime.split(':').map(Number);
  checkInMinutes = inH * 60 + inM;
  checkOutMinutes = outH * 60 + outM;

  // Store time filter parameters as internal flags
  matchStage._hasTimeFilter = true;
  matchStage._checkInMinutes = checkInMinutes;
  matchStage._checkOutMinutes = checkOutMinutes;
}
```

**2. Created `getTimeFilterStage` helper function:**
```javascript
const getTimeFilterStage = (query) => {
  if (!query._hasTimeFilter) {
    return [];
  }

  const checkInMinutes = query._checkInMinutes;
  const checkOutMinutes = query._checkOutMinutes;

  // Remove the internal flags from the query
  delete query._hasTimeFilter;
  delete query._checkInMinutes;
  delete query._checkOutMinutes;

  return [
    {
      $match: {
        $expr: {  // ✅ Now $expr is at top level
          $gt: [
            {
              $size: {
                $filter: {
                  input: { $ifNull: ['$serviceDays', []] },
                  as: 'day',
                  cond: {
                    $and: [
                      {
                        $lte: [
                          {
                            $add: [
                              {
                                $multiply: [
                                  { $toInt: { $arrayElemAt: [{ $split: ['$$day.startTime', ':'] }, 0] } },
                                  60
                                ]
                              },
                              { $toInt: { $arrayElemAt: [{ $split: ['$$day.startTime', ':'] }, 1] } }
                            ]
                          },
                          checkInMinutes
                        ]
                      },
                      {
                        $gte: [
                          {
                            $add: [
                              {
                                $multiply: [
                                  { $toInt: { $arrayElemAt: [{ $split: ['$$day.endTime', ':'] }, 0] } },
                                  60
                                ]
                              },
                              { $toInt: { $arrayElemAt: [{ $split: ['$$day.endTime', ':'] }, 1] } }
                            ]
                          },
                          checkOutMinutes
                        ]
                      }
                    ]
                  }
                }
              }
            },
            0
          ]
        }
      }
    }
  ];
};
```

**3. Updated pipeline construction:**
```javascript
const getServiceListingsforLandingPage = catchAsync(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const queryOriginal = getfilterquery(req.query);

  // Create a copy of query for time filter extraction
  const query = { ...queryOriginal };
  const timeFilterStages = getTimeFilterStage(query);

  const pipeline = [
    // ... lookup stages
    { $match: { ...query, status: 'Available', VerificationStatus: 'verified', completed: true } },
    ...timeFilterStages,  // ✅ Apply time filter as separate stage
    ...filterForServiceAvailabilities(req.query),
    ...servicelistingFormat
  ];

  // ... rest of code
});
```

---

## 🔍 Why This Works

### Key Concepts:

1. **Top-Level $expr:**
   - `$expr` must be at the document root level in a `$match` stage
   - It can access document fields directly (like `$serviceDays`)
   - It cannot be nested inside operators like `$elemMatch`

2. **$filter Instead of $elemMatch:**
   - `$filter` can iterate through array elements
   - Variables like `$$day` reference the current element
   - Returns an array of matching elements

3. **Size Check:**
   - `$size` counts matching elements from `$filter`
   - `$gt: [{ $size: ... }, 0]` means "has at least one match"
   - This effectively checks if any day meets the time criteria

### Example:

```javascript
// Service document
{
  _id: "service123",
  serviceDays: [
    { day: "monday", startTime: "09:00", endTime: "17:00" },
    { day: "tuesday", startTime: "08:00", endTime: "16:00" }
  ]
}

// Filter: checkInTime = "10:00", checkOutTime = "15:00"
// Converts to: checkInMinutes = 600, checkOutMinutes = 900

// $filter checks each day:
// - Monday: startTime (540 min) <= 600 ✓ AND endTime (1020 min) >= 900 ✓ → Match!
// - Tuesday: startTime (480 min) <= 600 ✓ AND endTime (960 min) >= 900 ✓ → Match!

// $size returns 2 (two matching days)
// $gt: [2, 0] is true → Service included in results
```

---

## 📊 Before vs After

### Before (Broken):
```javascript
// In getfilterquery - trying to use $expr in $elemMatch
matchStage.serviceDays = {
  $elemMatch: {
    $expr: {  // ❌ Error: can only be applied to top-level
      $and: [
        { $lte: [/* convert $startTime to minutes */, checkInMinutes] },
        { $gte: [/* convert $endTime to minutes */, checkOutMinutes] }
      ]
    }
  }
};

// In pipeline - directly use the query
const pipeline = [
  { $match: query },  // ❌ Fails here
  // ...
];
```

### After (Fixed):
```javascript
// In getfilterquery - store filter parameters
matchStage._hasTimeFilter = true;
matchStage._checkInMinutes = checkInMinutes;
matchStage._checkOutMinutes = checkOutMinutes;

// In pipeline - apply time filter as separate stage
const query = { ...queryOriginal };
const timeFilterStages = getTimeFilterStage(query);  // Extracts and removes flags

const pipeline = [
  { $match: query },  // ✅ No $expr here
  ...timeFilterStages,  // ✅ $expr at top level in separate stage
  // ...
];
```

---

## 🎯 Technical Details

### Time Conversion Logic:

**Converting "HH:MM" to minutes:**
```javascript
// Example: "10:30" → 630 minutes
const time = "10:30";
const [hours, minutes] = time.split(':').map(Number);  // [10, 30]
const totalMinutes = hours * 60 + minutes;  // 630
```

**In MongoDB aggregation:**
```javascript
{
  $add: [
    {
      $multiply: [
        { $toInt: { $arrayElemAt: [{ $split: ['$$day.startTime', ':'] }, 0] } },  // hours
        60
      ]
    },
    { $toInt: { $arrayElemAt: [{ $split: ['$$day.startTime', ':'] }, 1] } }  // minutes
  ]
}
```

### Filter Logic:

**Checking if service hours cover requested time:**
```
Service Hours:    [===09:00================17:00===]
Requested:           [===10:00======15:00===]

Check:
1. Service starts (09:00 = 540 min) <= Requested start (10:00 = 600 min) ✓
2. Service ends (17:00 = 1020 min) >= Requested end (15:00 = 900 min) ✓
```

---

## 🧪 Testing

### Test Case 1: Service with Matching Hours
```javascript
// Input
checkInTime = "10:00"
checkOutTime = "15:00"

// Service
serviceDays: [
  { day: "monday", startTime: "09:00", endTime: "17:00" }
]

// Expected: Service included (09:00-17:00 covers 10:00-15:00)
```

### Test Case 2: Service with Non-Matching Hours
```javascript
// Input
checkInTime = "10:00"
checkOutTime = "15:00"

// Service
serviceDays: [
  { day: "monday", startTime: "11:00", endTime: "14:00" }
]

// Expected: Service excluded (11:00-14:00 doesn't cover 10:00-15:00)
```

### Test Case 3: Multiple Days
```javascript
// Input
checkInTime = "10:00"
checkOutTime = "15:00"

// Service
serviceDays: [
  { day: "monday", startTime: "08:00", endTime: "12:00" },  // ❌ Ends too early
  { day: "tuesday", startTime: "09:00", endTime: "17:00" }  // ✓ Covers time
]

// Expected: Service included (at least one day matches)
```

---

## 📝 Files Modified

1. ✅ `src/controllers/servicelistingController.js`
   - Modified `getfilterquery` - Store time filter as internal flags
   - Added `getTimeFilterStage` - Create time filter aggregation stage
   - Updated `getServiceListingsforLandingPage` - Use time filter stage in pipeline

---

## ⚠️ Important Notes

### Query Object Mutation:
The `getTimeFilterStage` function **modifies** the query object by deleting internal flags. That's why we create copies:

```javascript
// Create copies to avoid issues
const query = { ...queryOriginal };
const timeFilterStages = getTimeFilterStage(query);  // Modifies query

// Use another copy for count pipeline
const queryForCount = { ...queryOriginal };
const timeFilterStagesForCount = getTimeFilterStage(queryForCount);
```

### Performance Considerations:
- Time filter now runs in a separate aggregation stage
- MongoDB can still use indexes for the initial $match
- The time filter is applied after initial filtering, which is efficient

---

## 🎉 Benefits

✅ **Fixes MongoDB Error** - No more "$expr can only be applied to top-level" errors

✅ **Flexible Time Filtering** - Services with ANY matching day are included

✅ **Accurate Calculations** - Converts time strings to minutes for precise comparison

✅ **Maintains Performance** - Initial $match uses indexes, time filter applied after

✅ **Clean Architecture** - Separation of concerns (filter extraction vs application)

---

**Fixed Date:** October 18, 2025  
**Status:** ✅ Resolved and Tested  
**Impact:** Service listings with time-based filtering now work correctly
