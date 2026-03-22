---
phase: ui
plan: 01
type: auto
---

# Plan: UI Overhaul — Cards, Login, Dock, Toolbar

## Objective
Transform all UI components to be premium, tight, visually stunning with correct spacing.

## Tasks

<task type="auto" effort="high">
  <name>Overhaul TaskCard — tight padding, premium design</name>
  <files>components/cards/TaskCard.tsx</files>
  <action>Reduce card padding from 32px to 16px/20px. Add icon for type. Better status chip. Tighter action buttons. Add a subtle inner glow on hover.</action>
  <verify>Visual review</verify>
  <done>Card looks tight and premium, all actions visible on hover</done>
</task>

<task type="auto" effort="high">
  <name>Overhaul NoteCard — editable, rich feel</name>
  <files>components/cards/NoteCard.tsx</files>
  <action>Reduce padding, improve typography, add gradient accent, better layout</action>
  <verify>Visual review</verify>
  <done>Note card has premium look with readable text hierarchy</done>
</task>

<task type="auto" effort="high">
  <name>Overhaul ChecklistCard — compact, satisfying UX</name>
  <files>components/cards/ChecklistCard.tsx</files>
  <action>Reduce padding, tighten checklist items, improve progress ring placement</action>
  <verify>Visual review</verify>
  <done>Checklist is compact and items feel satisfying to check off</done>
</task>

<task type="auto" effort="high">
  <name>Overhaul LoginPage — visually stunning auth screen</name>
  <files>components/auth/LoginPage.tsx</files>
  <action>Full redesign with animated gradient background, glassmorphism card, focused form elements, premium branding</action>
  <verify>Visual review</verify>
  <done>Login screen looks stunning and professional</done>
</task>
