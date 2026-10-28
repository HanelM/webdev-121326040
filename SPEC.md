# Study Groups Platform

<!-- Exercise 2. Write the non-goals first. Every acceptance criterion must be checkable in under a minute.
     Keep these headings exactly as they are: the self-checks look for them by name.
     The full target is on the course site under Resources → The course project. -->

## Project option
<!-- One line: lab booking, study groups, club events, or the own project the lecturer approved. -->
Study groups.

## Goals
- Students can create a study group for a specific course, invite peers, or join an open group.
- Owners can schedule study meetings with a specific time and location, and members can view upcoming meetings for all groups they belong to.

## Non-goals
- No real-time video or audio calling features inside the platform.
- No push notifications or email alerts; members check upcoming meetings directly on the site.
- No native mobile application; the web interface works responsively on mobile browsers.

## Constraints
- Node.js with Express for the backend, SQLite for the relational database.
- Plain HTML and CSS/JavaScript for the frontend UI.
- Passwords must be securely hashed using bcrypt, never stored in plain text.

## The model feature
<!-- Which model, which modality, and what it does for a user.
     Name three things or the check fails: the input it receives, the output it produces,
     and what happens when the model is slow, rate-limited or wrong. -->
- Model: OpenAI GPT-4o-mini
- Input: A description of topics a student wants to study or review.
- Output: A suggested structured 3-week study plan with weekly milestones.
- When it fails: If the model API is slow, rate-limited, or fails, the system catches the error, displays a friendly warning banner ("AI study plan generator is currently unavailable"), and lets the user create a manual study plan instead.

## Auth
<!-- Local sign-in plus at least one provider. Say how an account signing in both ways stays one account. -->
- Local: Users sign in with email and a securely hashed password.
- Provider: Google OAuth login is supported.
- Linking: If a user signs in via Google using the same email address as their existing local account, the system automatically links both login methods to the single user profile.

## MCP tools
<!-- At least three tools your own MCP server exposes over this project's data.
     Each tool calls the same service functions the HTTP API calls, so the same rules apply.
     A description shorter than 20 characters is not a description. -->
| Tool | What it does | Who may call it |
| --- | --- | --- |
| `find_group` | Return the details, member count, and topics of a specific study group by its unique ID. Use it when looking up group information. | `{"type": "object", "properties": {"id": {"type": "integer"}}, "required": ["id"]}` |
| `list_group_meetings` | List all upcoming scheduled study meetings for a given group ID, including time and location details. | `{"type": "object", "properties": {"groupId": {"type": "integer"}}, "required": ["groupId"]}` |
| `search_study_material` | Search through shared notes and resources uploaded within study groups based on keywords. | `{"type": "object", "properties": {"query": {"type": "string"}}, "required": ["query"]}` |

## UI
<!-- Stack, and the three or more screens. The graded checklist lives in docs/UI.md. -->
**Stack:** Express views / Server-side rendered HTML with vanilla JavaScript.
- **Screens:**
  1. `/login` - Sign-in and registration screen (local & Google OAuth).
  2. `/groups` - Dashboard showing groups the user joined and open groups to join.
  3. `/groups/:id` - Detailed view of a specific study group showing members, chat/notes, and scheduled meetings.

## Architecture
<!-- Exercise 3. One request traced through every layer, naming the file for each one,
     plus one place where your own code does not match this layering. -->

## Acceptance criteria
<!-- Every criterion carries an id. A test proves it by naming that id in its title, for example
     test('AC-3 a booking that overlaps another is refused with 409', ...).
     Say who acts, what they see, and what must be true in the database. -->
- [AC-1] A visitor who opens `/groups` without being signed in is automatically redirected to `/login`.
- [AC-2] A student who creates a new study group becomes its owner and sees themselves in the members list.
- [AC-3] A student who attempts to join a group that has reached its maximum member limit sees the message "This group is full" and cannot join.
- [AC-4] An owner who schedules a meeting with past dates sees a validation error and the meeting is not saved.
- [AC-5] A member who leaves a study group no longer sees that group's upcoming meetings on their dashboard.
- [AC-6] A user signing in with incorrect password credentials sees an invalid credentials error message and is not authenticated.
- [AC-7] A user who links their Google account to an existing local account via matching email successfully logs into the same profile.
- [AC-8] An unauthenticated user cannot access group creation endpoints via direct API calls and receives a 401 Unauthorized response.

### Slice 1: sign-in and the study groups list

## Traceability
<!-- Filled in from Exercise 3 onward: each AC id, and the test that names it. -->
| Criterion | Test |
| --- | --- |
| AC-1 |  |

## Spec vs result
<!-- After the agent builds the slice: which criteria passed, which it missed or reinterpreted, and what you changed in this spec because of it. -->
- Passed: Local sign-in, session creation, and the redirect guard for protected routes.
- Missed: Initial implementation of the meeting scheduler allowed past dates before validation was added.
- Changed: Added [AC-4] explicitly to validate meeting dates against the present time.
