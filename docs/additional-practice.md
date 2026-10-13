# Additional practice question bank

The original 120 assignment records in `questions.js` are unchanged. `practice-questions.js` adds 120 new exercises, ten for each of the twelve course weeks, based on the supplied summaries of all 27 lectures and the weekly recaps. These are source-derived practice exercises, not an official answer key or a forecast of an examination paper.

## Coverage

| Week | Lectures | Main areas |
| --- | --- | --- |
| 1 | 1 | Customer evidence, stakeholders, value, MVP learning, viability |
| 2 | 2 | Support ecosystem, interview purpose, early adoption, founder decisions |
| 3 | 3–5 | Seven Concerns, team roles, precise requirements, problem framing, prior art |
| 4 | 6–8 | Pre-incubation discovery, problem recognition, segment motivations, channels |
| 5 | 9–11 | Market pull, innovation transitions, 4D stages, immersion, ecosystem, Ikigai |
| 6 | 12–13 | Design lenses, innovation myths, interviews, enterprise UX, DaaS, break-even |
| 7 | 14–15 | Humanizing technology, creative analogies, BMC blocks, business-model choices |
| 8 | 16–18 | Lean Canvas, competitive advantage, funding fit, team arrangements, Atomberg |
| 9 | 19–21 | Incubators, venture stages, need prioritisation, complements, coopetition |
| 10 | 22–25 | Design philosophy, ideation, material choices, fabrication, network entrepreneurship |
| 11 | 26 | Accessibility services, employee well-being, wearable quality, educational games |
| 12 | 27 | Feeding products, modular backpacks, VR learning, traditional toys, communication |

## Editorial checks

All unique summaries were reviewed. The exact duplicate of Lecture 1 was identified. The combined `summary-notes (39).md` repeats the standalone recaps of Weeks 2–12 exactly; its separate Week 1 section was reviewed too. The later re-uploads of files 20–39 were byte-identical to the previously reviewed batch.

Questions use four concise options, brief conceptual or practical stems, and the original assignments' general difficulty. There are 114 questions with one accepted option and six with multiple accepted options, dispersed across weeks and question positions. The initial accepted positions of the single-key items are balanced: A=29, B=28, C=28, D=29. Optional runtime shuffling preserves answer identity. Every item includes a short explanation and a named lecture/section reference, displayed only after submission. No stem is copied directly from the assignment bank.

Source inconsistencies were excluded from new answer keys: toddler age ranges; conflicting design-sprint durations; mismatched institutional names for CfHE; inconsistent BETIC acronym expansions; simplified medical risk classes; confusion between BMC and Lean Canvas blocks; lecture-era company statistics and funding amounts. The distinction between market evidence and untested product claims is maintained. Clinical efficacy claims and legal filing instructions are not tested.

The author records remain in the JS source. A fixed editorial permutation establishes a consistent option order and remaps the accepted indices together. It does not change on a reload. Future edits should preserve published IDs and meanings; add new records without rearranging the existing bank.

## App integration

Original quizzes and Additional practice have separate tabs and bank identities (`assignments` and `additional`). Each supports single-week and combined-week attempts. Saved home selections and best-score/count statistics belong to their bank. History entries are labelled with the bank. One unfinished attempt remains resumable, including when the user switches banks; starting a replacement still requires the existing confirmation.

The `weekwise-nptel-v1` localStorage key is preserved. Old original attempts without a bank identifier are treated as assignments. The full-quiz snapshot records its bank, weeks, IDs, question order, and option settings. Missed-question practice and nested retakes retain this snapshot; a full retake cannot include records from the other bank.

The three navigation buttons adapt to small screens, and the existing question picker, scroll-position preservation, independent checkboxes, and mobile quiz dock remain in place. New answer explanations are laid out below the answer review.

## Validation

Run `npm test` (Node.js, no package dependencies). It includes the original regression suite, original-source hash comparison, additional-bank integrity, shuffled answer identity, exact-set grading, cross-bank isolation, legacy migration, reloading saved state, and the full-retake flow after a perfect missed-question attempt. Browser visual verification requires an available browser-control surface; automated DOM-harness checks do not substitute for visual layout verification.
