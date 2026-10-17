# App plan

The plan both sides build towards. Either side can edit it; post a note in `overlap.md` when you change something the other side relies on.

**Status:** agreed by the whole team on 2026-10-17.

## The idea

One app, for patients only. There is no doctor app and no hospital setup, so anyone can start using it today.

- At a visit, the doctor uses the patient's app to enter their contact details and what the patient needs to know.
- A chatbot in the app answers the patient's questions from what the doctor entered.
- At the next visit, the doctor updates the same notes, so the chatbot stays current.
- When the doctor needs to know something, the app emails them a secure link to the message.

## Who uses it

| Who | Account | How they use it |
| --- | --- | --- |
| Patient | Guest or signed in (email + password) | Owns everything: care notes, chat, doctor contacts |
| Doctor | None | Enters notes in **Doctor mode** on the patient's phone, or (optional) scans a QR code from the patient's app and types on their own phone; reads patient messages through emailed links |

## Main flows

1. **Start.** The patient opens the app and picks **Continue as guest** or **Sign in**. A guest can create an account later and keep all their data.
2. **Doctor visit.** The patient taps **Doctor visit** and hands over the phone. The doctor enters:
   - name, email, clinic, clinic phone
   - diagnosis or reason for the visit, in plain words
   - medications (what, how much, when, for how long)
   - instructions (activity, diet, wound care, …)
   - warning signs, and what to do about each one
   - when to contact them, and the next follow-up date

   **Optional:** instead of typing on the patient's phone, the doctor taps **Use my own phone**, scans the QR code, and fills in the same form in their browser. The link expires after 30 minutes and works once.
3. **Chat.** The patient asks questions. The chatbot answers only from the doctor's notes plus general safety. It says when the notes don't cover something, and it sends emergencies to 911 or the clinic phone, never to email.
4. **Notify the doctor.** The patient taps **Send to my doctor**, or the chatbot suggests it (e.g. a warning sign comes up). The app saves the message in Supabase and emails the doctor a link. The email holds no medical details, only "Your patient <first name> sent you a message" and the link. The link opens a page showing the message and the current care notes.
5. **Next visit.** The doctor opens Doctor mode again and edits the notes. Each save becomes a new version; the patient can see what changed and when.

## Decisions

- **Patient-only.** No doctor, nurse or admin accounts, no hospitals, no care teams.
- **We trust the patient.** Doctor notes aren't locked against the patient editing them. A dishonest patient defeats the app's purpose anyway. The app still labels which notes came from the doctor and when, so the chatbot and the patient know where they came from.
- **Email = link only.** The message stays in Supabase. The link carries a long random token, expires after 7 days, and is checked by an edge function (the doctor never logs in).
- **Not for emergencies.** The app says so on the chat screen and in every email.

## Backend shape (draft)

Supabase, as before. The patient is the only signed-in user; guests use Supabase anonymous sign-in, so RLS works the same for both.

| Table | What's in it | Who can access |
| --- | --- | --- |
| `patients` | `id` (= auth user), `display_name`, `created_at` | own row |
| `doctors` | `id`, `patient_id`, `name`, `email`, `clinic`, `clinic_phone` | owning patient |
| `care_notes` | `id`, `patient_id`, `doctor_id`, `version`, `content` (JSON: reason, meds, instructions, warning signs, contact rules, follow-up), `entered_via` (`patient_phone` \| `qr`), `created_at` | owning patient; latest version = current |
| `messages` | `id`, `patient_id`, `sender` (`patient` \| `bot`), `content`, `created_at` | owning patient |
| `doctor_messages` | `id`, `patient_id`, `doctor_id`, `content`, `token_hash`, `expires_at`, `opened_at`, `created_at` | owning patient; doctor reads through `view-doctor-message` |
| `entry_links` | `id`, `patient_id`, `token_hash`, `expires_at`, `used_at` | owning patient; doctor writes through `doctor-entry` |

Edge functions:

| Function | Who calls it | What it does |
| --- | --- | --- |
| `chat` | patient | Sends the message + current care notes to Claude, stores and returns the bot reply, flags "should notify doctor" |
| `notify-doctor` | patient | Creates a `doctor_messages` row and emails the doctor the link |
| `view-doctor-message` | anyone with the link | Checks the token and returns the message, patient first name and current care notes |
| `entry-link` | patient | Creates a QR token |
| `doctor-entry` | anyone with a QR token | Returns the current notes, saves a new version, marks the token used |

## What changes from current code

- **Backend:** the hospital / admin / nurse / care-team / escalation model gets replaced by a new migration. The `admin-create-user` and `escalate` functions go away; `escalate`'s logic becomes `notify-doctor`.
- **Frontend:** the clinician builder (draft, preview, publish) maps onto Doctor mode; the role switcher becomes "patient app + Doctor mode". Frontend decides what happens to family access.

## Open questions

- Email provider and sending address (Resend is the quickest from an edge function).
- Can the doctor reply from the link page, with the reply showing in the patient's chat? (Nice to have.)
- Keep family sharing, or drop it for the demo? (Frontend's call.)
- A guest who clears app storage loses their data unless they've signed up. Fine for the demo?
