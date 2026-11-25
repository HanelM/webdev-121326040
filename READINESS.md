# Readiness Report

## 1. Live URL and how to verify it
- Live URL: https://webdev-121326040.onrender.com
- How I checked: Ran `curl -s https://webdev-121326040.onrender.com/health` and verified HTTP 200 response with `{"status":"ok","db":"ok"}`.

## 2. Environment variables
| Variable | Description |
| --- | --- |
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `SESSION_SECRET` | Secret key for session signing |
| `OPENAI_API_KEY` | Optional key for AI features |

- How I checked: Verified variable validation at startup by launching the app with missing variables and observing explicit exit error messages.

## 3. What happens when things fail
- Unhandled errors return a generic 500 JSON message without exposing stack traces.
- Missing routes return a 404 JSON error.
- Database connection failures return a 503 status code on `/health`.
- How I checked: Tested invalid JSON payloads via `curl` and queried non-existent paths.

## 4. Four states of one screen
- **Loading:** Displays skeleton UI while data fetches.
- **Content:** Displays study group list and details.
- **Empty:** Displays "No study groups found" when query returns 0 items.
- **Error:** Displays user-friendly error message when network/server fails.
- How I checked: Simulated network latency and offline state using browser DevTools Network throttling (Slow 4G & Offline).

## 5. Request waterfall
- Page renders static HTML/shell first, followed by API requests for user session and group lists.
- How I checked: Inspected Network tab waterfall diagram with disabled cache.

## 6. Security basics checked
- Sessions are secured with HTTP-only cookies.
- Authorization checks prevent non-owners from modifying groups or scheduling meetings.
- How I checked: Attempted prohibited actions using a secondary authenticated test user account and verified 403 Forbidden responses.

## 7. Known gaps, ranked by risk
1. **High Risk:** Rate limiting is not enforced on public API endpoints.
2. **Medium Risk:** Session storage relies on memory store instead of Redis/database store in production.
3. **Low Risk:** Mobile viewport layout has minor horizontal scroll on smaller screens.
- How I checked: Reviewed production architecture and conducted endpoint load testing.

## 8. Model feature
- **Data leaving the app:** Only the user-submitted study topic description is sent to the AI provider. User passwords, emails, private messages, and group membership data never leave the application.
- **Cost per request:** Approximately $0.0004 per request based on ~900 input tokens and ~60 output tokens using pricing as of September 2026.
- **Provider downtime:** If the AI provider is down, the app catches the error and falls back gracefully to a manual plan message.
- **How I checked:** Tested locally with and without API keys, and verified network payloads.

## 9. MCP
- Tool calls execute under the context of the currently authenticated session user.
- Access permissions match standard user endpoint privileges.
- How I checked: Tested tool execution with authenticated and unauthenticated mock requests.