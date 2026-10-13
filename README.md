# Weekwise — NPTEL Quiz Studio

Buildless static HTML, CSS, and ES modules. The repository root is the deployment directory. No package installation, backend, account setup, or external data service is required for quiz behavior.

## Deploy on Vercel

1. In Vercel, choose **Add New → Project** and import [UtkarsHMer05/nptel-quiz-studio](https://github.com/UtkarsHMer05/nptel-quiz-studio).
2. Keep the **Root Directory** at the repository root. `vercel.json` selects the **Other** framework preset, skips dependency installation and the build step, and serves the root directory (`.`).
3. Click **Deploy**. No environment variables are needed. Use the stable production URL for practice so future deployments keep using the same browser storage.

These settings follow [Vercel's static-site build instructions](https://vercel.com/docs/builds/configure-a-build). The app's screens are rendered within `index.html`, so no client-side routing rewrite is needed.

## Run locally

From this folder, run:

```sh
python3 -m http.server 8000
```

Open `http://localhost:8000`. Serve the files over HTTP instead of opening `index.html` directly, because the app uses JavaScript modules.

## Content

The **Original quizzes** tab retains all 120 assignment questions. The separate **Additional practice** tab contains 120 fresh questions, ten per week, based on the supplied summaries of all 27 lectures. Its answer review includes explanations and lecture references. Both banks support choosing weeks separately or together, shuffled practice, and full or missed-question retakes. They have separate saved selections and statistics; history entries identify the bank. See [additional practice coverage](docs/additional-practice.md) for the source map and editorial checks.

Weeks 1–12 contain all 120 supplied questions. Original question numbers are retained. The included answer keys are for practice, not an official NPTEL grading result. Week 8 Q8 and Q9 use the exact prompts, options, and displayed accepted answers from the complete replacement screenshot. Week 5 Q6 uses the displayed accepted answer, “Before commercializing the product”, rather than the incorrectly selected “After developing a working prototype”. Week 9 Q5 likewise uses the accepted business-plan answer rather than the selected commercialization answer. Question wording, option wording, and accepted answers are retained, including original punctuation and wording such as “Ignoring customer feedback’s and focusing on company vision”. Overlapping questions appear only once.

Questions 9 and 10 in Week 1, question 9 in Week 2, question 5 in Week 4, and question 3 in Week 9 accept multiple answers. Exact-set grading gives one point only for selecting all and only the accepted options. Blank answers score zero; there is no negative marking.

## Behavior

Select available weeks individually or together. Original mode restores question and option order. Shuffled mode independently reorders questions and optionally options, retaining stable IDs for grading. All question options use independent checkboxes, with no single-answer or multiple-answer hints. No answer feedback appears before submission. Question navigation updates the card and progress in place and preserves the viewport. Title and option heights are measured across the current attempt to keep controls aligned; measurements update when the viewport width or fonts change. Submission preserves the current scroll position. The results screen provides per-question review, original source references, per-week scores for combined attempts, filters, full retakes, and missed-question retakes. Every results screen has a primary Retake full quiz button labeled with the original question count and original week selection. Focus-retake results also offer Repeat missed-question quiz, including after a perfect focus attempt. Generic retake actions always restart the full quiz; subset repetition uses a separate action. The full quiz retains a snapshot of the original question IDs, week selection, and question/option shuffle settings through nested focus retakes, browser reloads, and history review. Home selections are persisted separately. Older saved focus attempts reconstruct the full question set from their saved week selection and retain their available shuffle settings. Versioned entry assets ensure this change is loaded on refresh.

## Saved answers and attempt history

The header's **Theme** selector offers **System**, **Light**, and **Dark** on every screen. System is the default and responds immediately when the device's color scheme changes. An explicit selection overrides the system setting and is saved separately under `weekwise-theme-v1`, without changing quiz progress. The preference is applied before the page styles load and synchronizes between tabs of the same site.

Each answer selection or deselection is saved immediately in localStorage under `weekwise-nptel-v1`. Saved data includes the unfinished attempt's selected answers, current question, question and option order, flagged questions, full-quiz retake configuration, and home-screen selections. Reloading or reopening the same site in the same browser shows **Resume quiz**, which restores the saved attempt and its answers. Replacing or discarding an unfinished attempt requires confirmation.

Submitting saves a separate completed attempt, including the answers selected for every question. **Attempt history → Review** restores those selections alongside the answer key and score, even after a reload. A retake starts with blank answers and keeps the earlier completed attempt in history. Elapsed time includes time away from the page. There is no time limit.

Storage belongs to the browser profile and site origin (scheme, hostname, and port). A production domain, a preview deployment URL, and localhost have separate saved data. Redeploying at the same production origin retains existing saved data; moving to another domain does not transfer it. Clearing site data removes saved answers, private browsing may remove them when closed, and browsers that block storage cannot retain progress. If a save fails, the app displays a warning and lets the quiz continue. There is no account or cross-device synchronization.

## Future weeks

Add verified records to `questions.js` with week, number, text, four option strings, and accepted original-option indices. Available weeks and question counts are derived from the question bank. Add a descriptive label to `weekNames` in `app.js` when another week is supplied. All 12 weeks currently contain 10 questions each. No questions are invented.

## Mobile layout

Below 760px, a persistent bottom bar provides a quiz start button on the week selection screen and Previous, Questions, and Next/Submit controls during a quiz. Questions opens a modal picker, including progress, flags, submission, and save/leave. Below 680px, labeled navigation tabs remain at the top. Touch controls have at least 44px targets; results, history, dialogs, and typography adapt to narrow screens. The dock accounts for mobile safe areas, and content has bottom clearance.

## Verification

Run `npm test` to execute the original regression checks and the additional-bank checks. There are no dependencies to install and no build step. To check browser persistence, serve the app locally and:

1. Start a quiz, select answers, flag a question, and navigate to another question.
2. Reload the page, choose **Resume quiz**, and confirm the question position, selected answers, and flag remain.
3. Submit the quiz, reload, then open **Attempt history → Review** and confirm the submitted answers and score remain.
4. Start a retake and confirm it has blank answers while the completed attempt remains in history.

Repeat these checks on the Vercel production URL after deploying.
