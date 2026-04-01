---
name: No auto-push to remote
description: Never push to remote automatically — user tests locally first before pushing
type: feedback
---

Never push changes to the remote repository unless the user explicitly asks. All changes stay local for testing first.

**Why:** User wants to test everything locally before deploying. Vercel auto-deploys from main, so any push goes live immediately.

**How to apply:** After committing (when asked), do NOT run `git push`. Wait for the user to confirm they've tested and want to push.
