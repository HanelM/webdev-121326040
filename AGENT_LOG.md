# Agent log

One entry per agent session, newest at the bottom. Be honest: what went wrong is the useful part.

<!-- Copy this block for each session:

## YYYY-MM-DD · <short title>
- Goal:
- Delegated:
- Checkpoints:
- Went wrong:
- Changed by hand:

-->
## 2026-10-14 · MCP Server Implementation
- Goal: Изграждане на работещ MCP сървър от нулата без SDK и рамка, и свързване с Gemini CLI.
- Delegated: Помощ при обяснение на JSON-RPC протокола и грешките в тестовете.
- Checkpoints: `node mcp-server/check.mjs -- npm run --silent mcp` (12/12 checks passed).
- Went wrong: Получи се забавяне/блокиране при връзката с Gemini CLI поради липса на изричен нов ред (`\n`) и буфериране на изхода.
- Changed by hand: Написах цялата логика за четене от `readline`, JSON-RPC маршрутизацията и замених `console.log` с `process.stdout.write(JSON.stringify(...) + '\n')`.

## 2026-10-28 · Exercise 2 Specification & Setup
- Goal: Създаване и валидиране на SPEC.md и AGENTS.md за проекта за учебни групи.
- Delegated: Проверка на изискванията чрез скрипта за самопроверка ex2.mjs.
- Checkpoints: Успешно преминати 32/32 проверки (`node checks/ex2.mjs`).
- Went wrong: Няма значителни грешки, следвахме структурата от шаблона стъпка по стъпка.
- Changed by hand: Попълване на целите, ограниченията, критериите за приемане и секциите за модела и инструментите в SPEC.md.

## 2026-11-11 · План за упражнение 3
Цел: писмен план за функционалността за присъединяване към учебна група и насрочване на срещи с проверки за застъпване (409) и права (403/401), без код
Автономност: агентът работи сам в рамките на една стъпка от плана; чета diff-а преди всеки commit
Контролни точки: преглед на плана преди всякакъв код, зелен npm test преди всеки commit, заявка за разрешение за всичко от „Always ask before“


✦ План за имплементация: Учебни групи и срещи (Slice 1 & 2)

  1. Файлове за създаване и промяна
   - Нови файлове:
     - data/migrations/001_create_meetings.sql — миграция за таблицата със срещи.
     - data/groupRepository.js — слой за достъп до данни (само SQL заявки за групи, членства и
       срещи).
     - services/groupService.js — сервизен слой (всички бизнес правила, валидации и проверка на
       права).
     - routes/groups.js — HTTP маршрутизация, мапинг на грешки към статус кодове, EJS рендиране и
       редиректи.
     - views/groups/index.ejs — екран "Табло за групи" (моите групи, отворени групи, предстоящи
       срещи).
     - views/groups/show.ejs — екран "Детайли за група" (членове, срещи, форми за
       присъединяване/насрочване).
     - test/groups.test.js — тестове за всички критерии за приемане.
   - Променени файлове:
     - index.js — свързване на routes/groups.js и замяна на временния плейсхолдър /groups.
     - package.json — дефиниране на тестови и coverage скриптове (node --test).
     - SPEC.md — попълване на таблицата Traceability с имената на тестовете.

  ---

  2. Миграция (data/migrations/001_create_meetings.sql)

    1 CREATE TABLE IF NOT EXISTS meetings (
    2     id INTEGER PRIMARY KEY AUTOINCREMENT,
    3     group_id INTEGER NOT NULL,
    4     title TEXT NOT NULL,
    5     start_time TEXT NOT NULL, -- ISO 8601 низ (YYYY-MM-DDTHH:mm)
    6     end_time TEXT NOT NULL,
    7     location TEXT NOT NULL,
    8     created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    9     FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
   10 );
   11 CREATE INDEX IF NOT EXISTS idx_meetings_group_time ON meetings(group_id, start_time);

  ---

  3. HTTP Endpoints и кодове за състояние
   - GET /groups
     - Кодове: 302 (редирект към /login, ако няма сесия — AC-1), 200 OK (успешно показване на
       таблото).
   - POST /groups
     - Кодове: 401 Unauthorized (при липса на автентикация през API — AC-8), 400 Bad Request
       (невалидни данни/празно име), 302 Found / 201 Created (създаване на група, създателят става
       owner и член — AC-2).
   - GET /groups/:id
     - Кодове: 302 (редирект към /login), 404 Not Found (несъществуваща група), 200 OK (показване на
       детайли и бутон за присъединяване/напускане — AC-9).
   - POST /groups/:id/join
     - Кодове: 401 Unauthorized (неавтентикиран), 404 Not Found (несъществуваща група), 409 Conflict
       (ако вече е член — AC-11; или ако групата е пълна: "This group is full" — AC-3), 302 Found /
       200 OK (успешно добавяне в memberships — AC-10).
   - POST /groups/:id/leave
     - Кодове: 401 Unauthorized (неавтентикиран), 404 Not Found (не е член или групата липсва), 403
       Forbidden (собственикът не може да напусне собствената си група без прехвърляне), 302 Found /
       200 OK (напускане, срещите спират да се показват в таблото — AC-5).
   - POST /groups/:id/meetings
     - Кодове: 401 Unauthorized (неавтентикиран), 403 Forbidden (потребителят не е собственик на
       групата), 404 Not Found (несъществуваща група), 400 Bad Request (дата в миналото — AC-4, или
       start_time >= end_time), 409 Conflict (застъпване с друга съществуваща среща на групата в
       същия интервал), 302 Found / 201 Created (успешно насрочване).

  ---

  4. Сервизен слой и бизнес правила (services/groupService.js)
   - createGroup(userId, data) — валидира името; създава групата и вписва собственика в memberships
     (AC-2).
   - getGroupDetails(groupId, userId) — извлича група, членове, срещи и флаг за статус на текущия
     потребител (AC-9).
   - listUserDashboard(userId) — извлича групите на потребителя, техните предстоящи срещи и
     отворените групи (AC-5).
   - joinGroup(groupId, userId) — бизнес правила:
     - Проверява за вече съществуващо членство → хвърля ConflictError('Already a member') (AC-11).
     - Проверява current_members >= max_members → хвърля ConflictError('This group is full') (AC-3).
     - При успех записва членството (AC-10).
   - leaveGroup(groupId, userId) — бизнес правила:
     - Проверява дали е собственик → хвърля ForbiddenError('Owner cannot leave group').
     - Премахва записа от memberships (AC-5).
   - scheduleMeeting(groupId, userId, data) — бизнес правила:
     - Проверка за права: само собственикът може да насрочва срещи (group.owner_id === userId, иначе
       ForbiddenError).
     - Валидация за минали дати: new Date(startTime) <= new Date() → ValidationError('Past dates not
       allowed') (AC-4).
     - Валидация за застъпване: проверка за срещи в припокриващ се интервал → ConflictError('Meeting
       overlaps with an existing meeting') (409 Conflict).

  ---

  5. Проверка на правата (Authorization)
   - Автентикация: requireAuth middleware за сесия (req.session.user). Връща 401 Unauthorized за JSON
     API заявки (AC-8) или редиректва към /login за HTML заявки (AC-1).
   - Собственост (Owner check): В groupService.scheduleMeeting се валидира group.owner_id === userId;
     ако не съвпада, се хвърля ForbiddenError (HTTP 403). Собственикът е защитен и от случайно
     напускане на групата през leaveGroup.
   - Членство: Проверява се уникалността на членството преди добавяне и валидността му преди
     напускане.

  ---

  6. Състояния на UI (според docs/UI.md)
   - Loading: При натискане на бутоните ("Join Group", "Create Group", "Schedule Meeting") бутонът се
     деактивира и показва индикатор "Зареждане...", за да се предотвратят дублирани кликове.
   - Empty:
     - На таблото: "Все още не членувате в учебни групи. Създайте нова или се присъединете към
       отворена по-долу."
     - В групата: "Няма насрочени предстоящи срещи за тази група."
   - Error: Ясни четими банери за грешки: "Групата е пълна" (AC-3), "Вече сте член на тази група"
     (AC-11), "Не може да насрочвате среща за минала дата" (AC-4), без изтичане на стек или суров
     JSON.
   - Success:
     - Банер "Успешно се присъединихте към групата!" и смяна на бутона на "Напусни групата" (AC-10).
     - Банер "Срещата беше насрочена успешно!" и незабавното ѝ появяване в списъка.

  ---

  7. Тестове (именувани по acceptance criteria)
   1. test('[AC-1] A visitor who opens /groups without being signed in is automatically redirected to
      /login', ...)
   2. test('[AC-2] A student who creates a new study group becomes its owner and sees themselves in
      the members list', ...)
   3. test('[AC-3] A student who attempts to join a group that has reached its maximum member limit
      sees the message "This group is full" and cannot join', ...)
   4. test('[AC-4] An owner who schedules a meeting with past dates sees a validation error and the
      meeting is not saved', ...)
   5. test('[AC-5] A member who leaves a study group no longer sees that group\'s upcoming meetings
      on their dashboard', ...)
   6. test('[AC-8] An unauthenticated user cannot access group creation endpoints via direct API
      calls and receives a 401 Unauthorized response', ...)
   7. test('[AC-9] A student who views an open study group details page sees a "Join Group" button',
      ...)
   8. test('[AC-10] A student who clicks "Join Group" is successfully added to the group members list
      in the database and sees confirmation on the page', ...)
   9. test('[AC-11] A student who attempts to join a group they are already a member of is refused
      with a 409 Conflict status and the message "Already a member"', ...)
   10. test('[Meeting-Overlap] An owner scheduling an overlapping meeting receives a 409 Conflict
       status', ...)
   11. test('[Meeting-Forbidden] A non-owner attempting to schedule a meeting receives a 403
       Forbidden status', ...)

  ---

  8. Малки стъпки за изпълнение (всеки с отделен commit)
   1. Стъпка 1: Миграция и слой за данни (Data Access)
      - Създаване на data/migrations/001_create_meetings.sql и data/groupRepository.js.
      - Commit: feat(db): add meetings migration and group data access layer
   2. Стъпка 2: Сервизен слой и бизнес логика (Service Layer)
      - Създаване на services/groupService.js (валидации за лимит, минали дати, застъпване, роли).
      - Тестване на чистите бизнес правила в изолация.
      - Commit: feat(service): implement study group and meeting business rules
   3. Стъпка 3: HTTP маршрути и права (Routes & Middleware)
      - Добавяне на routes/groups.js с мапинг на грешки (400, 401, 403, 404, 409) и свързване в
        index.js.
      - Commit: feat(api): add study group routes and authorization guards
   4. Стъпка 4: Потребителски интерфейс (UI Views & States)
      - Създаване на views/groups/index.ejs и views/groups/show.ejs с покриване на 4-те състояния
        (Empty, Loading, Error, Success).
      - Commit: feat(ui): add dashboard and group views with comprehensive ui states
   5. Стъпка 5: Интеграционни тестове и трасируемост (E2E Tests & SPEC)
      - Създаване на test/groups.test.js с всички AC тестове, настройка на npm test и попълване на
        Traceability в SPEC.md.
      - Проверка с node checks/ex3.mjs.
      - Commit: test(e2e): add acceptance criteria test suite and link traceability