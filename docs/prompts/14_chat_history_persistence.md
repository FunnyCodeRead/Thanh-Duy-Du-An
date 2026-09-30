# CHAT HISTORY PERSISTENCE FIX

## Problem
Chat history is stored only in React state.

F5 → chat history disappears.

## Solution
Use `sessionStorage`.

Do NOT create MySQL chat tables.

Storage key per user:
`ai_chat_history_<user_id>`

Persist only:
- role
- content
- sources
- retrievalType

Do NOT store:
- raw RAG context
- API keys
- session cookie
- embedding vectors
- hidden prompts

On page load: restore from `sessionStorage`.

On messages change: save.

Keep max 50 messages.

Clear Chat: remove current user storage key.

Logout: remove current user's chat history.

## Tests
ask questions → F5 → history remains  
navigate away/back → history remains  
Clear Chat → F5 → history does not return  
logout HR → login ADMIN → HR history must not appear
