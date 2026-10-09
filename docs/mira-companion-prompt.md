# MIRA companion — design prompt

Paste everything below the line into your design tool.

---

## Your role

You are a character and motion designer creating the on-screen companion for **MIRA**, a native Android app. Design one character and its five states: **idle, listening, thinking, responding, and offline**.

## What MIRA is

MIRA is a private assistant that lives on the phone. It reads the messages a person receives in the apps they've allowed, tells them what matters, and drafts replies. It runs entirely on the device and has no internet access, so nothing it reads can leave the phone.

The companion is how MIRA shows it is present and paying attention when the user speaks or types a question. It appears in two places only:

- **Large** (about 160 dp) in the centre of the voice screen.
- **Small** (32 dp) at the left of the question input bar.

## Who the character is

A quiet, attentive helper: the careful friend who keeps your notebook in order. It is calm, competent, and discreet. People trust it with private messages, so it should never feel like a toy.

- **It is:** attentive, steady, warm in a restrained way.
- **It is not:** cute, childish, excitable, sad, sleepy, or comic.

It shows attention and effort, not human emotions. It has no mouth, never winks, and never looks worried or apologetic.

## Form

- One simple rounded shape, like a smooth pebble, slightly wider than tall. No arms, legs, ears, or antennae.
- **Two eyes and nothing else on the face.** The eyes are plain rounded shapes. All expression comes from their size, shape, position, and where they look, plus small movements of the body.
- Flat colour. No gradients, no glow, no glass or shine, no outline stroke, no drop shadow beyond one soft contact shadow beneath it.
- It must read clearly at 32 dp. At that size only the body and two eyes remain; anything finer is dropped.

## Colour

| Part | Light theme | Dark theme |
|---|---|---|
| Body | `#7665E8` violet | `#7665E8` violet, on a near-black surface faintly tinted toward violet |
| Eyes | off-white | off-white |
| Offline mark | `#15803D` green | `#22C55E` green |

Use no other colours. The green is MIRA's colour for "on this device" and appears only in the offline mark.

## The five states

Each state has a pose that reads on its own as a still image, plus a short looping motion.

### 1. Idle

Waiting, relaxed, available.

- **Pose:** body at rest, eyes open at normal size, looking straight at the user.
- **Motion:** a very slow rise and fall of the body, about 2% in height over 4 seconds, like breathing. A single blink every 4 to 6 seconds, at uneven intervals.

### 2. Listening

The user is speaking. MIRA is giving full attention.

- **Pose:** eyes slightly larger and rounder; body leans a few degrees toward the user.
- **Motion:** the body swells gently with the loudness of the user's voice, between 100% and 104% of its size. The eyes stay fixed on the user and do not blink. When the user pauses, the body settles and holds the lean.
- **Supporting element:** a thin row of level bars beneath the character, moving with the voice, in the body's violet.

### 3. Thinking

MIRA is working on an answer. This may last several seconds, so it must be pleasant to watch on a loop.

- **Pose:** body upright; eyes slightly narrowed, looking up and to one side.
- **Motion:** the eyes move slowly from upper left to upper right and back, one full pass about every 1.5 seconds. The body tilts very slightly with the eyes. No spinning, no bouncing, no dots circling the character.

### 4. Responding

MIRA has an answer and is giving it.

- **Pose:** eyes return to the user at normal size; body upright.
- **Motion:** one small nod as the answer begins, about 250 ms, then the character holds still while the answer text appears beside or below it. It blinks normally. It does not move its body in time with the text or speech.

### 5. Offline

The phone has no connection. **MIRA still works fully in this state.** This is the most important state to get right.

- **Pose and motion:** identical to idle. Full colour, same breathing, same blink.
- **The only difference:** a small mark of a house shape at the lower right of the body, in the on-device green, meaning "working from home, on this phone."
- **It must not** be greyed out, faded, asleep, sad, crossed out, or shown with a broken-signal icon. Any of those would tell the user, wrongly, that MIRA has stopped working.
- The offline mark also stays visible if the user starts speaking while offline, so listening, thinking, and responding each have an offline variant that differs only by the mark.

## Moving between states

- Idle to listening: 200 ms. Eyes grow and the body leans in together.
- Listening to thinking: 250 ms. Body straightens as the eyes drift upward.
- Thinking to responding: 200 ms. Eyes return to centre, then the nod.
- Responding to idle: 300 ms. A slow settle.
- Online to offline, and back: the green mark fades in or out over 200 ms. Nothing else changes.

All movements ease out smoothly and start from the current pose. No overshoot, wobble, or squash-and-stretch.

## For people who have turned animations off

Provide a still version of each state. The state changes by switching pose with a short cross-fade, and listening shows the level bars as a static row.

## Avoid

- A mouth, eyebrows, cheeks, hands, or any accessory.
- Glowing orbs, sparkles, halos, pulsing rings, or particle effects.
- Gradients, shine, glass, or 3D shading.
- Robot features: antennae, screens for faces, bolts, visors.
- A speech-bubble or chat-bubble shape for the body.
- Human emotions: happy, sad, embarrassed, surprised, sleepy.
- Constant motion. In every state the character is mostly still.
- Any additional colours.

## What to deliver

1. **A state sheet:** the five states side by side at 160 dp, in light and dark themes.
2. **Small versions:** the five states at 32 dp, in light and dark.
3. **Offline variants** of listening, thinking, and responding.
4. **Motion for each state** as a seamless loop, plus the five transitions.
5. **Still versions** of each state for when animations are off.
6. **A construction sheet:** the body's proportions, eye size and spacing, and the eye shapes used in each state, so the character can be redrawn exactly.

Vector artwork with separate layers for body, each eye, shadow, level bars, and offline mark, so it can be animated in code.

Before finishing, check each state against three questions: Is it recognisable at 32 dp with the others hidden? Would someone trust this character with their private messages? Does the offline state look every bit as capable as idle?
