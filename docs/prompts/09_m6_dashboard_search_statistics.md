# M6 – DASHBOARD SEARCH FINAL TESTING

Implement Dashboard from real MySQL.

## Statistics
- open jobs
- total jobs
- total candidates
- total applications
- upcoming interviews
- application status distribution
- candidate source distribution
- final pass rate

## Search/filter
Jobs: keyword + status  
Candidates: keyword + source  
Applications: keyword + status + job_id  
Interviews: keyword + status

All SQL must be parameterized.

## Time-to-hire
If schema does not contain reliable completion timestamp, DO NOT fabricate.

Return:
```json
{
  "available": false,
  "average_days": null,
  "message": "Chưa đủ dữ liệu thời điểm kết thúc hồ sơ để tính chính xác."
}
```

Do not invent metrics.

Run:
- pytest
- lint
- build
- browser tests
