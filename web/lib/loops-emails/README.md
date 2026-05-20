# Loops MJML templates

Source MJML for the inactivity drip emails wired in `web/convex/users.ts:scanInactiveAndFireLoops`.

## Compile

```powershell
npx mjml inactive-3d.mjml -o inactive-3d.html
npx mjml inactive-7d.mjml -o inactive-7d.html
npx mjml inactive-14d.mjml -o inactive-14d.html
```

Or compile all at once:

```powershell
npx mjml **/*.mjml -o ./out/
```

## Paste into Loops

1. Loops dashboard → Workflows → pick the matching workflow (`Inactivity 3d`, etc.)
2. Open the email step → top-right view toggle → switch from "Visual" to **"HTML"** / **"Code"**
3. Paste the compiled HTML
4. Save → Send test to yourself → Publish

`{{unsubscribeUrl}}` is auto-replaced by Loops at send time. `{{eventProperties.plan}}` and `{{eventProperties.daysInactive}}` are available if you want per-user personalization — register them under Edit event properties in the trigger node first.

## Event → template map

| Event | MJML source | Workflow trigger |
|-------|-------------|------------------|
| `inactive3d` | inactive-3d.mjml | Inactivity 3d |
| `inactive7d` | inactive-7d.mjml | Inactivity 7d |
| `inactive14d` | inactive-14d.mjml | Inactivity 14d |

Welcome email stays on Resend (`web/lib/welcome-email.ts`) — not Loops.
