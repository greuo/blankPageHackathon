# Hackathon slideshow creation prompt

Prepared for the Care companion patient-only prototype on October 17, 2026. Copy the text between **BEGIN PROMPT** and **END PROMPT** into your presentation tool. Attach current screenshots or a short recording from the actual app. This requests a deck, speaker notes and rehearsal materials; it does not claim a deck has already been created.

Confirmed format: exactly five slides total and a five-minute presentation, including a 60-second product demonstration. The user requested fewer than six slides. The complete judging rubric has not been supplied. Presentation quality is reported to be 25% of the grade. Replace the four speaker-name fields before presenting. Product capabilities and screenshots must be checked against the build used on stage.

---

## BEGIN PROMPT

You are a presentation designer, concise product storyteller and hackathon pitch coach. Create a polished, editable slideshow for **Care companion**, a patient-only recovery prototype. The hackathon theme is **META**. The presentation is worth **25% of our grade**, so the deck must make our idea understandable, visually distinctive and easy to demonstrate. We are a team of four presenting to four judges. Do not infer the judges' expertise, schools, companies or preferences. Our goal is to demonstrate a thoughtful working prototype, explain its relationship to META, and show sound judgment about the remaining work.

Create exactly **five slides total**, including the cover and closing slide, in 16:9 landscape. The confirmed presentation limit is **five minutes including a 60-second live demonstration**. Keep ten seconds available for slide changes and handoffs. Provide speaker notes with natural spoken sentences, a timed demo script, a rehearsal plan, a fallback for technical failure and concise anticipated judge questions. Put all Q&A preparation in a separate handout, not appendix slides. Do not add a sixth slide, a separate cover, an agenda or a separate thank-you slide.

### 1. The single message to communicate

Care companion helps a patient organize the instructions they were given and use them in a simple daily recovery workspace. The patient supplies their own care text and contact details, records their own activity, and can ask a companion to help find the relevant provided guidance. Our META connection is the **tool for organizing and using a patient's own care information**. The reusable workspace and behavior rules are the product. Each patient's supplied instructions give it their context.

Explain this plainly. Avoid presenting the project as a generic chatbot, a medical expert, a clinician replacement, an autonomous doctor or an agent that can create other autonomous agents. Do not claim that uploading a document automatically creates a clinically verified plan. The current prototype stores exact pasted text and makes it available to the prepared companion; its example task and dose schedules remain preconfigured. Show the mechanism that exists, then explain which configuration steps still need a backend contract.

Use the product name **Care companion** consistently. A source document calls it Discharge Companion; do not alternate names in the audience-facing deck. Use **To-Do** as the dashboard heading. Use the actual build's spelling for controls that viewers will click.

### 2. Product truth: these facts govern every slide

The working prototype is a React and TypeScript frontend. It uses fictional Alex Morgan and Dr. Maya Chen. It stores demo data in the browser. It has a patient dashboard, an Add instructions page and a care assistant with an expanded full-screen view. There is no reachable doctor, nurse, family or administrator portal. The doctor does not need to operate a large dashboard in our intended experience.

Currently implemented browser-local behavior includes:

- An automatic short opening animation with Skip, reduced-motion support and a friendly blue, mint and off-white interface.
- A dashboard with To-Do, important provided instructions, elapsed plan time, reminders and a persistent companion. The revised mobile layout has Home, My plan and Companion navigation, plus an inline next-milestone summary. These are presentation and navigation improvements; they do not add clinical functions or alter the roadmap rules.
- Add instructions fields for a doctor's name, doctor's email, exact care text and optional supported attachments. Pasted text is preserved. Adding an attachment does not mean its contents were extracted or understood.
- Daily task reports, correction, two prepared dose-reporting slots and due, upcoming or missing-report states. A report records what the patient entered. It cannot verify ingestion or treatment completion.
- A fixed daily check-in with pain scale, optional temperature, feeling and free text. An entry is editable on the same local date. The personal trend needs actual check-ins on at least two dates; there is no invented historical trend.
- A read-only roadmap with estimated milestones and acknowledgment. A milestone does not grant medical clearance.
- Deterministic prepared companion responses, relevant excerpts from the provided text, progress summaries and an explicit fallback when the supplied guidance does not answer a question. There is no live language model connected.
- Full-screen companion mode that preserves the same conversation and unsent draft when moving between views.
- A progress report preview and plain-text download based on actual local reports. Unknown or missing information stays visible.
- A literal emergency-word demonstration, an emergency-help screen, a call animation that never dials and an acknowledgment action. This is not validated clinical triage. No emergency email is sent, and the removed emergency-email preview must not appear in the deck or demonstration. The separate patient progress-report preview and TXT download remain available.

Still planned or deferred: Supabase integration, real authentication and authorization, clinician input verification, robust model integration, PDF/OCR extraction, real email delivery, hosted report links, server privacy controls and production monitoring. Do not put a green completion mark next to any of these. Avoid the labels “secure,” “HIPAA compliant,” “clinically validated,” “production ready” or “AI-powered” as claims about the present build.

The intended future doctor update is an email with a patient-reviewed summary and a limited report link. The clinician should be able to read that single report without signing into a new portal. This needs an unguessable, short-lived, revocable link to one report snapshot. It must not be a public patient page. Present this as a future workflow, with patient review and consent, never as a delivered or proven feature.

Never invent statistics, survey results, patient interviews, clinical outcomes, partnerships, user counts, revenue, traction, market size or testimonials. We have not established that this app improves adherence, reduces readmissions, saves a measured number of hours or makes recovery safer. Those are potential research questions. An attractive interface and working demo do not prove clinical impact. If outside facts are introduced, verify them with primary sources and give the exact source and date in notes; omit the claim if it cannot be verified. The deck can be strong without a market statistic.

### 3. Art direction and exact visual rules

The deck should look like it belongs to the redesigned app. Use the supplied current screenshots as the primary visual source. The final-build asset targets are `frontend/output/playwright/revamp-desktop.jpg` and `frontend/output/playwright/revamp-mobile.jpg`. Load the files only after confirming they exist and show the final build. Use the actual Add instructions screenshot from the same build, replacing an older capture when the form has changed. Never treat a proposed asset path as proof the image has already been captured. The older healthcare inspiration images communicate simplicity and lightness; they are not screenshots of our product and must never be presented as our work. Do not use fake hospital imagery, stock portraits of smiling doctors, generated product screens or invented screenshots.

Use **Nunito** with soft letterforms. Self-hosted Nunito Variable is the app's typeface. Use a static Nunito family if the presentation tool cannot embed a variable font. Keep headings bold and readable rather than decorative. Use approximately 42–56 pt for cover type, 34–40 pt for slide headings, 22–26 pt for main copy, 18–20 pt for captions and at least 14–16 pt for indispensable disclosure text. Cut copy before reducing the font. Keep heading measures short enough for one or two deliberate lines.

Match the finalized patient-app palette exactly: cool off-white canvas **#F2F7FA**, near-white surface **#F9FCFE**, light blue **#DCEFFF**, mint **#D9F3E9**, action blue **#246DBB**, supportive green **#167660**, deep ink **#183A4B**, secondary text **#4F6878** and divider line **#CDDFE8**. Reserve a muted warm caution color for the safety discussion. Keep text contrast readable; pale blue and mint are surfaces, not body-text colors. The palette should feel light and composed with a clear blue presence. Do not put palette names or hex codes on audience-facing slides.

No pure-white canvas, gradients, drop shadows, glass, neon, rainbow categories, purple-and-black technology styling, glowing orbs, dot grids, sparkle icons, emojis, fake terminal windows, excessive pills, colored left stripes or repeated three-card feature grids. Do not add invented testimonials, pricing tiers, decorative checkmark bullets, animated arrows, fake loading bars or generic “revolutionizing healthcare” language. Avoid the writing construction “It's not X, it's Y” and similar contrast slogans. Do not use em dashes.

Make a slide composition, not a dashboard made of tiny cards. Use open space, a small number of large text groups, flat alignment and strong screenshot crops. A slide may show one authentic product panel at readable scale. Screenshots may have a thin neutral border, with no drop shadow or exaggerated device mockup. Preserve their aspect ratio. Crop navigation chrome when useful, but never crop away a label or disclosure needed to interpret the feature. Avoid reusing the same full screenshot on several slides; use distinct views and intentional detail crops when the same product is the evidence.

Keep titles and essential text editable. A single source-to-workspace process diagram is explicitly requested below; make it editable. If a real report is shown, use actual generated text with fictional data and retain the missing-data caveat. Do not fabricate charts. A screenshot with large text is better than an ornamental graph with no real data.

Use one calm transition language: a short 180–240 ms fade, or a simple reveal of one additional element. No motion behind a presenter, bouncing elements, auto-advancing content, animated arrows or sound effects. The static PDF must communicate the same story. Every slide should pass the three-second test: a judge can identify its subject and primary evidence immediately.

### 4. Slide-by-slide brief

#### Slide 1: Care companion

**Purpose:** Introduce the patient, the real-world problem and our product within one minute.

**Exact headline:** “Care companion”

**Exact supporting line:** “Your care instructions, organized for each day”

**Small secondary label:** “META hackathon · Patient prototype”

**Visual:** A large, sharp crop of the actual patient dashboard showing To-Do and a portion of the companion. Give the image about 60% of the slide. Keep the name and supporting line in the remaining space with generous margins. Under the supporting line place only these three short questions, with enough separation to read as a single thought: “What do I need to do today?” “Where were those instructions?” “What have I already recorded?” Use no other feature list. Add the four real team names in a small single line once supplied. Do not add a second title slide.

**Speaker notes, approximately 105–115 words:** Open with a fictional patient's ordinary problem: they get home with guidance, then need to refer back to it and record a daily routine. State that this is the scenario we designed for, rather than a finding from clinical research. Define Care companion as a simple patient workspace that brings provided instructions, daily records and a companion together. We are demonstrating fictional data. Explain the narrow job: make the information and the patient's own entries easier to return to. A checkbox does not prove medical treatment occurred. End with this handoff: “The META idea is in how the patient gives the workspace its context.”

**Presenter:** Speaker 1. **Time:** 60 seconds, from 0:00 to 1:00.

#### Slide 2: The META connection

**Purpose:** Make the theme connection specific, credible and easy to repeat.

**Exact headline:** “A workspace shaped by your instructions”

**Main copy, maximum 22 words:** “Patients bring their own guidance into a reusable daily workspace, with a companion that refers back to that text.”

**Editable diagram:** Use four large, plainly labeled stages: “Provided instructions,” “Patient context,” “Daily records,” “Reviewable summary.” Use a simple left-to-right reading order without animated arrows. Under the first two stages add one short caption: “Exact pasted text is available to the companion.” Under the daily-record stage add: “Example schedules are preconfigured in this prototype.” These qualifications must remain readable.

**Visual:** The process diagram is the main visual, with one small authentic crop of the saved instruction text if there is room. Do not surround it with three feature cards. No generic AI brain, network orb or agent swarm.

**Speaker notes, approximately 105–115 words:** Explain that the product helps people organize and reuse their own information. The patient supplies context instead of receiving one generic conversation. The repeated system is the workspace: source guidance, patient records and reviewable summaries. Clarify the implemented step: pasted guidance updates the source context used by the prepared companion. Automatically creating and validating schedules is future integration work. The user is not authorizing a bot to invent treatment. Explain that the same workspace structure can hold different provided instructions without claiming the team has tested multiple clinical conditions. End with the exact handoff, “We'll show the patient flow with fictional data.”

**Presenter:** Speaker 2. **Time:** 60 seconds, from 1:00 to 2:00.

#### Slide 3: One patient, one day

**Purpose:** Use the actual product as evidence of usability and working implementation.

**Exact headline:** “One patient, one day”

**Persistent small disclosure:** “Fictional data · Local prototype · Prepared companion replies”

**Visual:** A large authentic dashboard crop with one small inset of the Add instructions form, arranged as a simple editorial composition. Keep doctor name, email and the source text recognizable in the inset. At demonstration time switch to the already-open app. Do not put a tiny unreadable screenshot behind six paragraphs, or run a background promotional animation. Prepare a local recording or screenshot sequence from the same final build as fallback.

**First 15 seconds, before the demonstration:** Explain that the patient has one straightforward form for the doctor's name, email and exact guidance, then returns to a daily dashboard with the companion beside it. Say that expanding the companion preserves its draft and conversation. There is no separate doctor portal. Do not describe attachment storage as automatic file comprehension.

**60-second demo choreography:**

1. **0–6 seconds:** Start on Home with the fictional patient. Point to To-Do and the companion. Say, “This is the patient's everyday view.”
2. **6–23 seconds:** Open Add instructions. Use a prepared fictional passage already in the clipboard. The sample doctor name and email should already be present so the operator only needs to paste the passage and save. Say, “The exact source wording is preserved.” Do not imply the example dose schedule was regenerated. Do not upload a file live.
3. **23–36 seconds:** Ask a question answered directly by that passage, such as “What does my guidance say about the dressing?” Rehearse with the actual text. Show the excerpt. Say, “This build uses prepared replies grounded in the provided text.”
4. **36–44 seconds:** Expand the assistant, then return. If useful, retain a short unsent draft to show continuity. Say, “The same conversation and draft stay with the patient.”
5. **44–50 seconds:** Record one appropriate daily task through the normal confirmation. Use a simple task instead of an upcoming dose so clock timing cannot block the demonstration. Say, “This is the patient's report.”
6. **50–58 seconds:** Open Progress report. Point to the recorded activity and any missing data. Say, “The summary uses the entries we actually made.” Show the download control without searching the filesystem.
7. **58–60 seconds:** Return to the slide. Do not add an unrehearsed final click.

**Final 15 seconds, after the demonstration:** Name the other available local interactions: check-in, dose reporting and the read-only roadmap. Keep them in speech rather than cramming them onto the slide. Explain that a personal trend requires actual entries on two dates. End with the handoff, “Those actions are useful only when the companion's boundaries are clear.”

**Demo discipline:** Demonstrate one coherent loop, not every feature. Check-ins, trends and emergency help can be shown during questions if requested. Never trigger a real phone call or send an email on stage. If source wording or control labels change in the final build, update the script. The operator should know a recovery step after each click. The live-demo segment is exactly 60 seconds inside this 90-second slide allocation.

**Presenter:** Speaker 3. **Time:** 90 seconds, from 2:00 to 3:30, including 15 seconds setup, 60 seconds demo and 15 seconds interpretation.

#### Slide 4: Working today, next to validate

**Purpose:** Demonstrate engineering judgment and distinguish the present prototype from the connected product.

**Exact headline:** “Working today, next to validate”

**Layout:** One flat two-column comparison with text headings and a simple ruled separation. It is a status comparison, not pricing or a repeated card grid.

**Left heading:** “Working in this prototype”

**Left copy:** “Patient workspace · Local records · Full-screen companion · TXT report”

**Right heading:** “Next integration work”

**Right copy:** “Verified configuration · Model grounding · Backend privacy · Consented report delivery”

**Single footer sentence:** “Care answers refer to provided text; reports describe the patient's entries.”

**Visual:** Prefer the clear editable comparison over a decorative architecture illustration. If a real report detail is shown, it should replace some text, not create a third column. Do not put a shield or hospital logo beside a security claim.

**Speaker notes, approximately 95–105 words:** Explain that the current build is local and the replies are prepared. It does not diagnose, invent care rules or change doses. Elapsed plan time is not a measure of healing. An entry is not proof of ingestion. The emergency animation never calls or emails. The next connected version needs verified care configuration, storage boundaries and grounded model behavior. The proposed doctor update is a patient-reviewed report with a limited, expiring, revocable link to one snapshot. That link and actual email delivery are not implemented. Real patient use requires appropriate evaluation and review; no clinical certification or launch date is claimed.

**Presenter:** Speaker 4. **Time:** 55 seconds, from 3:30 to 4:25.

#### Slide 5: Care companion

**Purpose:** Close with a memorable product definition, the META mechanism and a clear invitation to questions.

**Exact headline:** “Care companion”

**Exact closing line:** “A reusable daily workspace for the instructions you receive”

**Small line:** “Bring the guidance. Record the day. Review the summary.”

**Visual:** A distinct close-up of the actual full-screen companion, with enough conversation text to recognize the product. Keep the composition spare. Add the actual repository or demo link only if it is verified and suitable for the judges. Never invent a deployment URL or add a QR code to a local-only address. If there is no accessible URL, keep the footer clean. Do not add a sixth thank-you slide.

**Speaker notes, approximately 45–50 words:** Restate the patient job and the META mechanism in one connected thought. End with the exact status: “We've built the patient workflow as a local prototype. The next step is validating the connected version and its care-configuration rules. We're ready to show any part of the flow or talk through our decisions.”

**Presenter:** Speaker 1 returns for the close. **Time:** 25 seconds, from 4:25 to 4:50. Ten seconds remain across the talk for handoffs and slide changes, producing a five-minute limit.

### 5. Four-person delivery and exact timing

Use these editable presenter fields only in the production notes, not as visible placeholders on a polished slide:

- Speaker 1: **[ACTUAL TEAM MEMBER NAME]**, patient problem and introduction on slide 1, then closing on slide 5. Total 85 seconds.
- Speaker 2: **[ACTUAL TEAM MEMBER NAME]**, META mechanism on slide 2. Total 60 seconds.
- Speaker 3: **[ACTUAL TEAM MEMBER NAME]**, interaction design and live product operator on slide 3. Total 90 seconds, including the 60-second demo.
- Speaker 4: **[ACTUAL TEAM MEMBER NAME]**, boundaries and implementation status on slide 4. Total 55 seconds.

Total content time is **290 seconds**. Reserve **10 seconds** for the four handoffs and slide changes. The listed slide time marks are content targets; use the ten-second buffer across transitions rather than adding it after the closing line. The hard finish is **5:00**. Everyone speaks and one speaker returns for the close. No team-member biographies or long introductions are necessary.

Assign Speaker 2 as the backup product operator unless the team confirms another choice. Keep the app open and loaded before the talk. Use these handoffs exactly or lightly adapt them to sound natural: Speaker 1 to 2, “The META idea is in how the patient gives the workspace its context.” Speaker 2 to 3, “We'll show the patient flow with fictional data.” Speaker 3 to 4, “Those actions are useful only when the companion's boundaries are clear.” Speaker 4 to 1, “That leaves us with a working patient flow and a clear next step.” Handoffs should take approximately two seconds each and be included in rehearsal.

If the rehearsal runs long, first remove the spoken list of extra features after the demo, then shorten the problem setup. Preserve the theme explanation, source-preserving action, truthful implementation status and close. Do not speed up the operator, hide the limitations or add another slide. The user confirmed five minutes and fewer than six slides; treat those as hard constraints.

### 6. Demonstration preparation and failure plan

Before the event, reset only fictional demo data. Confirm the prepared doctor's email is fictional. Keep the example instruction passage short and exact. Confirm the source question returns a supported answer in the current build. Verify that the app's real local time makes the intended reporting slot available; use the explicit demo clock control when needed and disclose it as a demo control. Do not alter system time or fake an established history. If a trend is shown, create entries through the app across the demo dates and label the exercise clearly.

Capture four fallback views from the final build: Home, saved instructions, expanded companion with a source answer, and the report after the demonstrated activity. Keep a 60-second local screen recording as the first fallback if available. Keep the still images as the second fallback. The operator should switch within five seconds of a persistent failure.

Use this neutral sentence if something breaks: “This is the recorded version of the same patient flow, captured from our prototype.” Continue explaining the actions and actual state. Do not blame the Wi-Fi when the app is local, pretend a fallback is live, narrate debugging, expose browser storage or spend the allotted time trying to repair the environment.

### 7. Judge questions: prepare concise, accurate answers

Provide a separate Q&A preparation sheet with short answer drafts for these questions. Do not add appendix slides, and keep the answers out of the five-minute talk unless asked:

1. **How is this META?** Explain the reusable workspace for organizing a patient's own guidance and records. Point to the actual input-to-source-context step. Acknowledge that automatic validated schedule creation remains future work.
2. **What is real today?** Name the patient flow, local persistence, prepared source excerpts, full-screen continuity and actual TXT report. Name the unconnected services plainly.
3. **What does the AI do?** State that this build uses deterministic prepared responses. Describe the intended future system contract separately: cite supplied text, preserve unknowns, avoid diagnoses and dose changes, and require explicit actions before counting records.
4. **How does the doctor receive updates?** Today, the patient previews and downloads a report. The proposed email and limited report link need backend implementation and patient consent. No portal is built or required in the intended reading flow.
5. **How do you know someone took medication?** The prototype records a patient's explicit report. It does not verify ingestion and should describe the record accordingly.
6. **How will you protect patient data?** No production privacy claim is made. This demo uses fictional browser-local data. A real version needs authenticated storage boundaries, explicit report permissions, revocation, careful logging and review before handling health information.
7. **Who sets the care plan?** Current sample schedules are preconfigured. Pasted text is unverified source material. A later clinician-configuration contract must establish authorship, validation and permissible updates.
8. **What happens in an emergency?** Demonstrate the clear help state if requested. Explain the literal trigger's limits, the non-dialing animation and the fact that no notification was delivered. Never suggest the app substitutes for emergency services.
9. **What would you test next?** Whether a user can locate the right instruction, distinguish a report from confirmed medical completion, understand the timeline and recover from an error. Also test source retrieval and connected service failures before introducing a live model.
10. **What did the team actually build?** Describe verified ownership using the four real names supplied by the team. Do not assign responsibilities or claim a teammate built a feature without confirmation. Mention React/TypeScript and local state only to the degree they explain the working implementation.

### 8. Quality gates and final output

Optimize for clarity, theme fit, usable evidence, honest technical explanation and delivery. These are our preparation priorities, not an invented official judging rubric. The only reported grading fact is that the slideshow matters for 25% of the grade. Earlier discussion placed UI around 20–25%; do not turn that estimate into a grading pie chart or infer the remaining weights.

Before delivery, inspect every slide at normal presentation size. Check text size, wrapping, crop quality, contrast and alignment. Read the title and screenshot together: they must tell the same story. Remove visual filler and duplicated statements. Keep product screenshots large enough to read from the back of a room. Check that no planned feature is depicted as completed, no timeline says “percent healed,” no report invents adherence history, and no medical guidance was generated for dramatic effect.

Read speaker notes aloud with the click sequence. Aim for approximately 100–125 spoken words per minute during explanation and fewer while operating the app. Count the actual words and rehearse; a rough word target does not replace timing. Make one normal-speed run and one failure-fallback run. Trim the least essential explanation before rushing the final slide. End within the limit.

Return these complete deliverables:

1. An editable five-slide deck with embedded or reliably packaged Nunito fonts and authentic screenshots, plus a static PDF if the tool supports export.
2. Full speaker notes attached to each slide, including the assigned speaker and time. Keep notes accurate and conversational, without generic sales language.
3. A single-page run of show with slide numbers, time marks, handoff lines and demo actions.
4. A fallback plan with the exact switch sentence and the required screenshot or recording list.
5. A separate judge-question answer sheet and a short list of missing inputs that could improve the final deck, such as the full rubric, real team names and final screenshot assets. The five-minute limit and fewer-than-six-slide constraint are already confirmed.

If screenshots or names are unavailable, provide a complete layout and notes with clearly labeled production asset slots in the working file. Do not fabricate images or names. Remove those production labels from the audience-facing version once the real assets are supplied. Explain any remaining missing asset outside the slides. Do not publish, email, share publicly or invent a live demo URL. The deliverable is the deck and its rehearsal materials.

## END PROMPT
