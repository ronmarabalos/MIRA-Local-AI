# Personal Memory — Design Spec

- **Date:** 2026-10-10
- **Status:** Draft for review
- **Owner:** Steve. The Memory screen and the storage schema are in Ronmar's lane and are changed with his knowledge.
- **Related:** [main spec](2026-10-09-mira-design.md) sections 4.5 and 5.1 · [roadmap](../PLAN.md) task 2.5 · visual board [`18-personal-memory`](../design/screens/18-personal-memory.html)

---

## 1. Goal

The "What MIRA Remembers" page lets the user keep short lines about themselves, and MIRA uses them when it writes a reply draft. Today the page says nothing is saved, and nothing is.

**Success:** on the Infinix, the user adds "I'm free after 2 PM on weekdays", asks for a draft to a message proposing a morning meeting, and the draft reflects it. The memory is still there after the app restarts, and can be edited and deleted.

### Decisions made with Steve

1. **The user writes every memory.** MIRA never adds, changes, or removes one. This is the board's "Only what you teach or approve".
2. **Memories are used in reply drafts only.** Not in Ask MIRA, and not when reading messages.
3. **MIRA is given the relevant few**, not all of them and not a search.

### Out of scope

MIRA suggesting memories · using memories in Ask MIRA or in extraction · showing on a draft which memories were used · importing or exporting memories · a "delete all" action.

---

## 2. What a memory is

One line of text with a kind:

| Kind | Shown as | Example |
| :--- | :--- | :--- |
| `preference` | Preferences | "Keep replies short and friendly." |
| `fact` | About me | "I'm free after 2 PM on weekdays." |
| `contact` | People | "Maya is my thesis partner." |

**Limits**

- A memory is 1 to 200 characters after tidying. Tidying trims it and turns any run of spaces or line breaks into one space.
- At most 50 memories are kept. Adding a 51st is refused with "You can keep up to 50. Delete one to add another."
- Saving text that is empty after tidying is refused; the Save button is disabled.
- Saving a memory with exactly the same kind and text as an existing one does not create a second copy.

---

## 3. Storage

A fourth migration in `mobile/src/services/db/schema.ts`:

```sql
CREATE TABLE memory (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('preference', 'fact', 'contact')),
  text TEXT NOT NULL,
  created_at INTEGER NOT NULL
)
```

Store methods in `mobile/src/services/db/store.ts`:

```ts
getMemories(): Promise<Memory[]>          // newest first
saveMemory(memory: Memory): Promise<void> // insert, or replace the kind and text of an existing id
deleteMemory(id: string): Promise<void>
```

Each write tells the store's subscribers, so the page reloads. A hook `useMemories()` in `hooks.ts` wraps `getMemories`.

`Memory` is added to `mobile/src/core/types.ts`:

```ts
type MemoryKind = 'preference' | 'fact' | 'contact';
interface Memory { id: string; kind: MemoryKind; text: string; createdAt: number }
```

---

## 4. Choosing — `mobile/src/core/memory.ts` (new, pure)

```ts
MAX_MEMORY_CHARS = 200; MAX_MEMORIES = 50; MAX_IN_DRAFT = 8;

tidyMemoryText(text: string): string | null        // null when nothing is left
memoriesForDraft(memories: Memory[], message: Message, chat: Chat): Memory[]
```

**`memoriesForDraft`**

- Every `preference` and `fact` is a candidate.
- A `contact` is a candidate only when it is about someone in this conversation: a word of three letters or more from the sender's name, or from the chat's title, appears in the memory's text as a whole word, ignoring case. "Maya is my thesis partner" goes with a message from "Maya Chen" and not with one from "Jun".
- Candidates are ordered contacts first, then preferences, then facts, newest first within each, and the first 8 are returned.

A contact comes first because it is the most specific to the message at hand.

---

## 5. Drafting

### 5.1 The model — `ModelService.draftReply`

The method gains an optional third parameter:

```ts
draftReply(message: Message, context: MessageContext, memories?: string[]): Promise<string>
```

When memories are given, the prompt carries them in their own block, before the message block:

```
<about_the_student>
- I'm free after 2 PM on weekdays.
- Keep replies short and friendly.
</about_the_student>
```

The instructions say: these lines are things the student has said about themselves; use one only when it helps answer this message; never mention that you were told them; never repeat one that has nothing to do with the message.

Each line is made plain before it is placed in the block (angle brackets removed, line breaks turned into spaces), the same treatment message text gets. A memory is written by the user and is trusted more than a message, but it is still text placed into a prompt.

Without memories the prompt is exactly as it is today.

The fake model ignores the parameter, except that tests can see it was passed.

### 5.2 The action runner — `mobile/src/services/actions/index.ts`

Both places that write a draft, the rule path (`runDecision`) and the request path (`draftFor`), do this before calling the model:

1. Load the memories.
2. Pick with `memoriesForDraft`.
3. Pass their text to `draftReply`.
4. Record how many were passed in the action's payload as `memories`, for example `"2"`. Nothing is recorded when none were passed.

The Activity screen shows one more line under a drafted reply when the count is present: "Used 2 things you told MIRA." ("Used 1 thing you told MIRA." for one).

`ActionStore` gains `getMemories`.

---

## 6. The page — `mobile/src/screens/Memory/index.tsx`

- **Header:** "What MIRA Remembers", then "Only what you teach. Everything here stays on this phone and is yours to change or delete."
- **Search field**, as on the board. It narrows the list to memories whose text contains what is typed, ignoring case. With no match: "No memories match. Try another word."
- **The list,** in three groups with a count each: Preferences, About me, People. A group with nothing in it is not shown. Newest first within a group.
- **Add** button opens a sheet with one text field (200 characters at most, with a counter), three choices for the kind, and Save and Cancel.
- **Tapping a memory** opens the same sheet filled in, with Save, Cancel, and Delete.
- **Delete** asks first, in a dialog: "Delete this memory?" with "MIRA will stop using it in replies." and Delete and Cancel.
- **Empty state:** "Nothing saved yet", "Tell MIRA things about you and it will use them when it drafts a reply.", and three examples as buttons that open the Add sheet filled in: "I'm free after 2 PM on weekdays." (About me), "Keep replies short and friendly." (Preferences), "Maya is my thesis partner." (People).
- Storage that cannot be read shows "Your memories could not be loaded." with a "Try again" button.

The Profile screen's "Personal memory" row shows the number of memories when there is at least one.

Built from existing components (`Screen`, `Sheet`, `Dialog`, `Field`, `SearchField`, `ChoicePill`, `Tap`, `T`, `EmptyState`) and theme tokens.

---

## 7. Rules it keeps

1. Only the user creates, changes, or removes a memory. No code path writes one from a message, a model answer, or a rule.
2. Nothing leaves the phone. No new permission.
3. Sending is unchanged: a draft written with memories still waits in Approvals for the user's tap and confirmation.
4. Memories are not given to the model when it reads a message or answers a question.
5. No technical terms in the interface.

---

## 8. Failure handling

| Situation | What the user sees |
| :--- | :--- |
| Empty text | Save is disabled |
| More than 200 characters | The field stops at 200 |
| A 51st memory | "You can keep up to 50. Delete one to add another." |
| Save or delete fails | "That could not be saved. Try again." The sheet stays open with the text intact |
| Memories cannot be loaded when drafting | The draft is written without them; drafting does not fail |
| Storage cannot be read on the page | "Your memories could not be loaded." with "Try again" |

---

## 9. Testing

**Unit tests, written first**

- `core/memory.test.ts`: tidying (trim, line breaks, the 200 limit, empty); preferences and facts always candidates; a contact only for a matching sender or chat title, as a whole word and ignoring case, and not for a two-letter name fragment; the order; the cap of 8.
- Store tests: add, list newest first, edit keeps the id, delete, the kind constraint, and the migration applying to a database at version 3.
- Prompt tests: the block appears only when memories are given; each line is made plain; a memory cannot close its block.
- Runner tests: both draft paths pass the picked memories and record the count; a failure loading memories still drafts.
- Screen tests: add, edit, delete with confirmation, search and its no-match line, the empty state and its examples, the 50 limit, and storage failure.

**On the phone**

- Add "I'm free after 2 PM on weekdays." Ask for a draft to a message proposing a morning meeting. The draft should reflect it, and Activity should say one thing was used.
- Restart the app: the memory is still there.
- Delete it and draft again: the draft no longer reflects it.

---

## 10. Files

| File | Change |
| :--- | :--- |
| `mobile/src/core/types.ts` | `Memory`, `MemoryKind` |
| `mobile/src/core/memory.ts`, `memory.test.ts` | New |
| `mobile/src/services/db/schema.ts` | Migration 4 |
| `mobile/src/services/db/store.ts`, `hooks.ts` | Memory methods; `useMemories` |
| `mobile/src/services/contracts.ts` | `draftReply`'s optional third parameter |
| `mobile/src/services/model/prompts.ts`, `index.ts` | Memory block in the draft prompt |
| `mobile/src/services/fakes/model.ts` | Accepts the parameter |
| `mobile/src/services/actions/index.ts` | Loads, picks, passes, records |
| `mobile/src/screens/Activity/index.tsx` | The "Used N things you told MIRA." line |
| `mobile/src/screens/Memory/index.tsx` | Replaces the empty state |
| `mobile/src/screens/Profile/index.tsx` | The count on the row |
| `docs/PLAN.md` | Task entry |

---

## 11. Known limits

- The model on the phone is small. It may ignore a memory, or bring one in where it does not fit. Every draft is reviewed before it is sent.
- A person's memory is matched by name words, so "Maya" matches any sender named Maya, and a nickname the memory does not contain will not match.
- Memories about other people are on the phone because the user typed them. The page says where they are kept.
