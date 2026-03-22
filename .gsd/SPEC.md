# Product Specification: AirTasks Backend & Features

**Status: FINALIZED**

## Overview
AirTasks is migrating from a `localStorage`-only client application to a multi-user, cloud-backed collaborative spatial workspace. The new system will use Firebase for data storage and authentication.

## Core Features
1. **Authentication**: Users must log in via Google or Email/Password. Built-in `admin` role manages system users.
2. **Data Layer (Firestore)**: Replace local storage with Firestore real-time synchronization.
3. **Multi-Canvas (Folders)**: Users can create multiple canvases, organized like folders, with gestures to drill down.
4. **Image Paste & Resize**: Users can paste images on the canvas, use pinch-to-zoom to resize, and grab-and-drag to reposition them (stored in Firebase Storage).
5. **Social Connections & Sharing**: Users can connect with others, share notes, and collaborate on shared canvases.

## Technical Stack
- Next.js 16, React 19, Tailwind CSS v4
- Zustand for state management
- Firebase (Auth, Firestore, Storage)
- react-firebase-hooks for integration

## Security & Privacy
- Users only have access to their own `canvases`, `images`, and `connections`, except when items are explicitly shared through the `shares` collection.
