Bhasha Quest frontend (integrated API version)
===============================================

Copy this src/ directory over your existing frontend/src/ directory.

Environment (.env at frontend root):
  VITE_API_BASE_URL=http://127.0.0.1:8000

The backend Google login response must include the database user ID in
`user.id` or directly in `id`; the frontend reads it from localStorage.
Restart Vite after editing .env.

Connected user-facing backend endpoints:
  GET  /api/challenges/today?language=en|hi|kn|te|mr
  GET  /api/progress/today?user_id=<UUID>
  POST /api/submissions (multipart: challenge_id, language, user_id, audio)

API call minimization:
- GETs are deduplicated while in flight and cached in memory for 60 seconds
  (progress cache: 15 seconds).
- Dashboard requests challenge + progress concurrently.
- Challenge page reuses the cached challenge response where possible.
- One POST is made for each audio submission.
- Results page refreshes progress once after evaluation.
- Submitting audio invalidates the GET cache.

Language/translation handling:
- Word rendering normalizes common snake_case/camelCase fields and looks up
  translations by the selected language code in either an array or object.
- If your backend uses a different response schema, update
  src/services/normalizers.js after checking the actual JSON in /docs.

Notes:
- Browser microphone access requires localhost or HTTPS and user permission.
- The backend must accept the recorded MediaRecorder format. This code prefers
  WebM/Opus, then WebM, then MP4. If your backend only accepts WAV, add client-side
  transcoding or change the backend's accepted formats.
- Results are passed through React Router state; refreshing the result URL loses
  that in-memory result. For persistent/shareable results, add a GET submission
  detail endpoint in the backend.
- Google login remains a demo button; it does not authenticate against Google.
- Scheduler/admin endpoints are intentionally not called from the browser. Keep
  those server-side/admin-only.
