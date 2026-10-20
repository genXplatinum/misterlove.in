# Mobile layout and navigation audit

Checked on 20 October 2026, starting from release `751b43d`.

## Fixes

- White press: the large heading set the grid's minimum width wider than a 320px screen. Constrain the grid and its children, scale the mobile heading, and remove the extra top clearance inherited from Original's fixed header. Restore readable signature and publisher-band colours on White.
- White press cards: scale titles for their available width. The long word in “Cybersecurity and entrepreneurship” clipped at the 701px breakpoint before the fix.
- White footer: put edition switching on its own row, followed by copyright and the back-to-top link. Keep mobile search controls at 16px and edition links at least 44px tall.
- White navigation: close on same-page links, Escape, outside taps, keyboard focus leaving the menu, and a resize to desktop navigation. Escape returns focus to the menu summary.
- Original navigation: include the visible close button in the menu's keyboard focus cycle.
- Both book-study readers: close the mobile contents before measuring the destination heading. Previously, selecting the first section in *The Happiness Ledger* landed more than 4,000px beyond that heading. Both editions now place it 100px below the viewport top, clear of the header.

## Browser verification

95 rendered layout checks passed:

- 29 representative routes at each of 320×720, 390×844 and 430×932.
- Eight routes in 667×375 landscape.
- Home, writing archive, collection, books, study, press index, press detail, White about, and English, Hindi and Punjabi readers.
- Extra-long English and Hindi titles from *Forgotten Gods*.
- Six additional press-layout checks at 701px, 768px and 1440px cover the menu breakpoint, tablet and desktop.

No unintended horizontal overflow or clipped content was found in the final matrix. Wide article tables retain their own horizontal scroll containers. The moving publisher ribbon, decorative hero shape and screen-reader-only headings are intentional exceptions to geometric overflow detection.

Interaction checks covered both study contents menus, Original focus wrapping and closing, White menu dismissal and rotation, landscape menu scrolling, search and clearing an empty result, press filters, the image viewer and focus restoration, and Original light/dark switching. The saved theme preference was restored.

These were Chromium browser viewport checks, not physical iPhone/Android or Safari device tests. The audit samples shared page templates; it does not claim a separate manual visual review of every article.

The full build and preservation checks remain required before release. Article manuscripts, source records, PDFs, covers and the two editions' route structure are preserved.
