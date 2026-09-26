# Customer Requirement

Build a recruitment management system for three user roles: ADMIN, HR, and MANAGER.

The system manages recruitment positions, candidates, CV files, job applications, application statuses, interviews, and candidate evaluations. AI may summarize CV information, suggest interview questions, and draft interview or result emails. AI only provides supporting information and must not make hiring decisions.

The frontend uses React with Vite, JavaScript, React Router, Bootstrap, and Fetch API. The backend uses a Flask REST API with Flask Session authentication. MySQL stores project data in the `ai_recruitment` database. Gemini is the AI engine and is called only by the Flask backend.

The project must remain suitable for a university assignment: simple to run, demonstrate, test, and explain. It must not introduce enterprise architecture or expand beyond the approved seven database tables.

