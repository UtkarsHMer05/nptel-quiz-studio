# Weekwise — NPTEL Quiz Studio

Buildless static HTML, CSS, and ES modules. `dist/` is the deployment directory. No server, package installation, account setup, or external data service is required for quiz behavior.

## Content

Weeks 1–12 contain all 120 supplied questions. Original question numbers are retained. Week 12 selected answers were checked against web sources, with the rationale and verification limits recorded in `docs/week12-answer-verification.md`. These are reasoned answer keys, not an official NPTEL grading result. Week 8 Q8 and Q9 use the exact prompts, options, and displayed accepted answers from the complete replacement screenshot. Week 5 Q6 uses the displayed accepted answer, “Before commercializing the product”, rather than the incorrectly selected “After developing a working prototype”. Week 9 Q5 likewise uses the accepted business-plan answer rather than the selected commercialization answer. Question wording, option wording, and accepted answers are retained, including original punctuation and wording such as “Ignoring customer feedback’s and focusing on company vision”. Overlapping questions appear only once.

Questions 9 and 10 in Week 1, question 9 in Week 2, question 5 in Week 4, and question 3 in Week 9 accept multiple answers. Exact-set grading gives one point only for selecting all and only the accepted options. Blank answers score zero; there is no negative marking.

## Behavior

Select available weeks individually or together. Original mode restores question and option order. Shuffled mode independently reorders questions and optionally options, retaining stable IDs for grading. All question options use independent checkboxes, with no single-answer or multiple-answer hints. No answer feedback appears before submission. Question navigation updates the card and progress in place and preserves the viewport. Title and option heights are measured across the current attempt to keep controls aligned; measurements update when the viewport width or fonts change. Submission preserves the current scroll position. The results screen provides per-question review, original source references, per-week scores for combined attempts, filters, full retakes, and missed-question retakes. Every results screen has a primary Retake full quiz button labeled with the original question count and original week selection. Focus-retake results also offer Repeat missed-question quiz, including after a perfect focus attempt. Generic retake actions always restart the full quiz; subset repetition uses a separate action. The full quiz retains a snapshot of the original question IDs, week selection, and question/option shuffle settings through nested focus retakes, browser reloads, and history review. Home selections are persisted separately. Older saved focus attempts reconstruct the full question set from their saved week selection and retain their available shuffle settings. Versioned entry assets ensure this change is loaded on refresh.

Attempt progress, flags, and completed history are saved in localStorage under `weekwise-nptel-v1`. They are browser-local. An unfinished quiz can be resumed; replacing it requires confirmation. Elapsed time includes time away from the page. There is no time limit.

## Future weeks

Add verified records to `dist/questions.js` with week, number, text, four option strings, and accepted original-option indices. Available weeks and question counts are derived from the question bank. Add a descriptive label to `weekNames` in `dist/app.js` when another week is supplied. All 12 weeks are available, with incomplete weeks labeled. Remaining questions must be supplied before they are added. No questions are invented.

## Mobile layout

Below 760px, a persistent bottom bar provides a quiz start button on the week selection screen and Previous, Questions, and Next/Submit controls during a quiz. Questions opens a modal picker, including progress, flags, submission, and save/leave. Below 680px, labeled navigation tabs remain at the top. Touch controls have at least 44px targets; results, history, dialogs, and typography adapt to narrow screens. The dock accounts for mobile safe areas, and content has bottom clearance.

## Verification

Run `npm test` for content structure, original and shuffled ordering, exact answer scoring, source immutability, combined quizzes, and focus retakes. Browser QA requires the Sites control-browser capability, which was unavailable during initial creation.
