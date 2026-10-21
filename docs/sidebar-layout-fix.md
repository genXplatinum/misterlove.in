# Contents sidebar label spacing

22 October 2026. Baseline: `75dac15aeed79a2771e4443b5e365bce3dbc7c45`.

The article contents grid reserved 1.5rem for each section number. The Atheist vs Believer volumes use labels such as Preface, Chapter 10 and Author’s note in that position. All 35 English labels overflowed the fixed column and ran into the title text.

The shared reader stylesheet now lets that column fit its label while retaining the previous minimum for short numbers. Labels have a bounded maximum width and wrap safely. The title column can shrink and wrap without overflowing. This applies to the desktop rail and mobile contents in both editions; it does not change article prose or the main reading column.

Browser checks cover all four volumes in English and Hindi, in both editions, at 1280px; the 1080px rail breakpoint; the supplied desktop layout at 1905px; mobile contents at 320px and 390px; a short-number article and a book-study reader. Label and title bounds no longer overlap, neither text column overflows, and the page has no horizontal overflow. Collapse/reopen and chapter jumps remain functional.

Production build/postbuild, manuscript/PDF/cover preservation, lint and diff checks pass. Lint retains the pre-existing import-sapiens-reading.mjs warning. These are Chromium viewport checks, not physical-device tests.
