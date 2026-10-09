# MIRA Visual Design

The visual source of truth for MIRA's screens. Read this file, then the one board that matches the screen you are building.

- [`mira-mobile-app.html`](mira-mobile-app.html): the original design file. Open it in a browser to see every board rendered. It is a 4 MB compressed bundle, so do not read it as text.
- [`screens/`](screens/): the same 27 boards unpacked to plain markup with inline styles, 10 to 30 KB each. Agents read these.

**Scope: visuals only.** The design decides colour, type, surfaces, components, motion, and the companion. The screen list, navigation, features, and wording stay with the [design spec](../specs/2026-10-09-mira-design.md). Where this design and the visual rules in [`docs/rules/frontend.md`](../rules/frontend.md) or the older [design prompt](../mira-design-prompt.md) disagree, this design wins.

---

## Which board for which screen

The app uses the design's screen set (spec section 7). Each board is one screen folder in `mobile/src/screens/`.

| Screen (folder) | Spec function | Board in `screens/` |
| :--- | :--- | :--- |
| Splash, Onboarding, Setup, ModelSetup | Onboarding | `01-splash`, `02-onboarding`, `03-initial-setup`, `04-ai-model-setup` |
| Home | Today report | `05-home`, `05b-home-dark` |
| Assistant | Ask, and the companion | `06-mira-assistant`, `00-orb-styles` |
| Teach, TeachInstruction, TeachExample | Rules stated in words; rule suggestions | `07-teach-mira`, `08-teach-by-instruction`, `09-teach-by-example` |
| AutomationBuilder, AutomationReview, Automations | Rules: new, preview, list | `10-automation-builder`, `11-review-and-approve`, `12-my-automations` |
| Inbox | Report for one app or chat | `13-inbox` |
| EmailDetail | Item detail | `14-email-and-ai-reply` |
| Approvals | Approvals | `15-approval-center` |
| Planner | Dates found and reminders | `16-tasks-and-reminders`, `17-calendar` |
| Memory | What MIRA knows | `18-personal-memory` |
| ConnectedApps | Channels | `19-connected-apps` |
| OfflineSync | Queued replies while offline | `20-offline-and-sync` |
| Activity | Activity log | `21-activity-history` |
| Notifications, Profile | Visual only | `22-notifications`, `23-profile` |
| Settings | Privacy proof and settings | `24-settings-and-privacy` |

Tokens and components: `00-foundations`. The bottom bar is the design's floating tab bar with Home, Inbox, Teach, Planner.

Screens show stored data only. Where a board shows a feature the spec does not have (calendar sync, cloud accounts), leave it out rather than fake it.

Board text such as "AI model setup" or "AI reply" is placeholder copy. The wording rules in [`frontend.md`](../rules/frontend.md) still apply.

---

## Design system

Frosted glass over soft silver silk. Calm, light type and honest states. Light by default, with a complete dark theme.

### Colour, light

| Token | Value | Use |
| :--- | :--- | :--- |
| Silk top / mid / base | `#A7B2CE` / `#C3CBDF` / `#E9ECF3` | Screen background, a vertical gradient: top 0%, mid 30%, `#DCE0EC` 62%, base 100% |
| Glass | `rgba(255,255,255,0.46)` | Cards, bars, sheets |
| Ink | `#1C2140` | Primary text |
| Ink secondary | `#465071` | Secondary text (body on glass also uses `#343B5C`) |
| Navy action | `#2E3A78` | Primary buttons (white text), links; pressed `#232C5E` |
| Periwinkle | `#98A5E4` | Accent |
| Mint sheen | `#68CFC1` | Accent, on-device indicators |
| Success / Warning / Error | `#34A889` / `#E8AD59` / `#DD6B78` | Status fills |
| Success / Warning / Error ink | `#1F7A62` / `#8A5A12` / `#B23A4A` | Status label text |

### Colour, dark

Taken from `05b-home-dark`; read that board for exact usage. Background `#12152A`, raised `#181C38`, text `#EEF0FA`, secondary text `#A5ACC9` / `#C3C8E2`, action `#7C8BE0` / `#5866C2`, accent `#B9C3FA`, mint `#7FDCCF`, success `#6FD3B0`.

### Glass surface

Fill `rgba(255,255,255,0.46)`; backdrop blur 22 px with 150% saturation; border 1 px `rgba(255,255,255,0.78)`; inner top highlight `rgba(255,255,255,0.85)`; shadow `0 10px 30px rgba(40,52,100,0.08)`. Text on glass stays dark ink for 4.5:1 contrast.

### Type

Onest, weights 300 to 700, bundled with the app (the release build has no internet). Body 15 / 400, caption 12 to 13, section heading 20 / 700. Read `00-foundations` for the full scale.

### Shape and components

- Radius 16 to 32 for cards and sheets; pills (`999px`) for buttons, chips, and the tab bar.
- Buttons: primary (navy pill, white text), secondary, tonal, destructive.
- Action status: Suggested, Approved, Queued, Running, Completed, Failed, Offline ready, Connected. Always label plus icon, never colour alone.
- Feedback toasts, floating tab bar, empty state: see `00-foundations`.

### Companion

Five states, each defined in `00-orb-styles` and `00-foundations`: Idle (blinks now and then), Listening (leans in, level bars), Thinking (eyes sweep, slight tilt), Responding (one nod, then still), Offline (idle plus the on-device mark). All motion stops under the system's reduced-motion setting.
