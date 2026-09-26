# M2 Task Evidence

**Task:** Implement Job and Candidate CRUD, search, filters and CV upload using React and Flask REST.

**Input:** Existing working Jinja M2 behavior and revised React REST requirement.

**Expected Result:** Validated CRUD with backend role enforcement, safe uploads, REST APIs and React pages.

**Actual Result:** Job and Candidate list/detail/create/edit routes are active in React. Flask APIs enforce validation and roles, use parameterized database functions, preserve CV on edits, protect referenced records and serve authenticated uploads. Legacy Jinja assets are archived.

**Evidence:** Backend suite reports 47 passed; MySQL integration exercised CRUD, search/filter, DOCX extraction, file access, delete conflicts and MANAGER denial; frontend lint/build and manual browser checks passed.

**Human Decision:** M3 remains out of scope. Formal Human Gate 2 awaits student review.
