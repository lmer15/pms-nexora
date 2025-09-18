# TODO: Fix User Profile and Name Display in Comment Section

## Issue
The user profile and name are not displaying in the comment section due to a mismatch in user ID types.

## Root Cause
- Comments store `creatorId` as Firestore user ID (from JWT token)
- Profile fetching logic was expecting Firebase UID instead of Firestore ID
- This caused `findByFirebaseUid` to fail when trying to fetch profiles

## Solution
Update backend controllers to use `findById` instead of `findByFirebaseUid` for profile fetching.

## Steps Completed
- [x] Update `server/src/controllers/taskCommentController.js`:
  - Change `findByFirebaseUid` to `findById` in `getCommentsByTask`
  - Change `findByFirebaseUid` to `findById` in `createComment`
- [x] Update `server/src/controllers/authController.js`:
  - Change `findByFirebaseUid` to `findById` in `getUserProfiles`

## Testing
- [ ] Test comment creation and verify user profile displays
- [ ] Test realtime comment updates and verify profiles load
- [ ] Test existing comments to ensure profiles are fetched correctly

## Followup
- Restart the server to apply changes
- Clear any cached data if necessary
- Monitor for any errors in profile fetching

---

# TODO: Fix Comment Count Display in Tab Header

## Issue
The comment count in the tab header was not updating in real-time when comments were added or removed.

## Root Cause
- The tab count was using `taskDetails.comments.length` which is only updated when the modal loads
- The actual comments are managed by `useRealtimeComments` hook which updates independently
- No mechanism to sync the tab count with the real-time comment count

## Solution
Implement a callback mechanism to update the tab count when comments change.

## Steps Completed
- [x] Update `client/src/components/TaskDetail/TaskDetailComments.tsx`:
  - Add `onCountChange` prop to interface
  - Add `useEffect` to call `onCountChange` when `comments.length` changes
- [x] Update `client/src/components/TaskDetailModal.tsx`:
  - Add `commentCount` state
  - Add `useEffect` to initialize `commentCount` from `taskDetails`
  - Update tabs array to use `commentCount` for comments tab
  - Pass `onCountChange={setCommentCount}` to `TaskDetailComments`

## Testing
- [ ] Test adding comments and verify tab count updates
- [ ] Test deleting comments and verify tab count updates
- [ ] Test realtime comment updates from other users

## Followup
- Test in different browsers and devices
- Monitor for any performance issues with frequent updates
