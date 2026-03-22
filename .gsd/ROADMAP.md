# Phase Roadmap

## Phase 1: Authentication & Firebase Setup
**Status**: IN_PROGRESS

**Tasks**:
- Initialize Firebase app with configuration
- Create AuthProvider and login screen (Google & Email/Password)
- Set up auth store (Zustand) tracking user and roles
- Add logic for default system admin user upon creation

## Phase 2: Firestore Data Layer & Migration
**Status**: PENDING

**Tasks**:
- Implement CRUD operations for canvases and cards in Firestore
- Refactor taskStore to use Firestore subscriptions instead of localStorage
- Migrate existing localStorage data to Firestore on first sign-in

## Phase 3: Multi-Canvas Organization
**Status**: PENDING

**Tasks**:
- Create canvasService and update canvasStore
- Implement CanvasSidebar for navigation
- Bind push/grabbing gestures for hovering and entering folders

## Phase 4: Canvas Image Integration
**Status**: PENDING

**Tasks**:
- Implement Firebase storage service for image uploads
- Create Custom ReactFlow image nodes
- Wire up pinch-to-zoom and grab-and-drag gestures for spatial manipulation

## Phase 5: Social Networking & Sharing
**Status**: PENDING

**Tasks**:
- Implement connection request and management system
- Build share dialog and notification system for notes/cards
