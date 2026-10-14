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
