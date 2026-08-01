/**
 * The Reservation Files, Part 1 — the web edition.
 *
 * The printed Part 1 assumes a reader who already knows what a cut-off is,
 * what a percentile is, and how a government recruitment round works. Readers
 * told us they followed the opening and then lost the thread the moment the
 * numbers started. That is a failure against the book's own first house rule
 * — "Class-8 English, always" — so the web edition rebuilds the part from
 * absolute zero: every term defined where it first appears, every number
 * walked through on a worked example, and a new chapter that teaches marks,
 * percentage, percentile, rank and cut-off before a single real figure is
 * used.
 *
 * Nothing factual is added, removed or softened. Every number, quotation,
 * source, court case and verdict is the printed part's. What changes is the
 * scaffolding around them.
 *
 * This file is hand-written and deliberately NOT produced by
 * scripts/import-reservation-files.mjs, because the importer's source is the
 * print-first HTML that also typesets the PDF, and the PDF is unchanged. The
 * importer may be re-run freely; it writes reservation-files.js, and
 * reservation-files-web.js layers this on top.
 *
 * Illustrative examples use invented candidates and round numbers. Every one
 * of them says so on the page. Real figures are always attributed.
 */

/* Matches the importer: strip markup, count words, 220 words a minute. */
const strip = (markup) => markup
  .replace(/<[^>]+>/g, ' ')
  .replace(/&[a-z0-9#]+;/gi, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const WORDS_PER_MINUTE = 220;

/* A note added to the front matter, because a reader who also downloads the
   book deserves to be told why the two differ. */
const PROLOGUE_NOTE = '<hr class="w-soft" /><div class="w-box w-box--key">'
  + '<span class="w-box-label">ABOUT THIS EDITION</span>'
  + '<span class="w-box-title">This web version is the long, slow, everything-explained one.</span>'
  + '<p>Readers told me the same thing about Part 1: the story at the start was fine, and then the numbers began and it stopped making sense. Cut-offs. Percentages. Percentiles. Rosters. That is my fault, not theirs. Rule one of this book is that a fifteen-year-old who hates reading should be able to follow every page, and Part 1 broke rule one.</p>'
  + '<p>So this web edition assumes you know nothing at all. Every word is explained the first time it is used. There is a whole new chapter — Chapter 3 — that teaches you what marks, percentage, percentile, rank and cut-off actually mean, using small worked examples, before any real number appears. Nothing has been dropped and no fact has been softened. It is simply longer and slower.</p>'
  + '<p>The downloadable book still carries the original, shorter Part 1. If you want the compressed version, it is there. If you want the version that explains itself, you are reading it.</p>'
  + '</div>';

const HTML = `
<h2 class="w-h2" id="rf1-1-five-point-eight-million-people-in-seven-days"><span class="w-num">1</span>Five Point Eight Million People in Seven Days</h2>
<p class="w-lead">A young man stood up on live television and asked a question. Within a week, six million people had joined a movement.</p>
<p class="w-lead"><span class="w-dropcap">P</span>icture a television studio. It is July 2026. India has spent two months in the middle of the largest youth protest in a generation. Exam papers have leaked. Students have died. A movement with a strange name — the Cockroach Janta Party — has filled Jantar Mantar in Delhi and streets in dozens of cities.</p>

<div class="w-box w-box--key">
<span class="w-box-label">IN PLAIN WORDS</span>
<span class="w-box-title">Four things in that paragraph, explained.</span>
<p><strong>NEET</strong> is the single entrance examination for almost every medical college seat in India. If you want to be a doctor here, you sit it. Lakhs of students take it every year, and the great majority do not get a seat. A <em>lakh</em> is one hundred thousand.</p>
<p><strong>An aspirant</strong> is what we call someone preparing for one of these exams. Many spend two, three or four years on it, often paying for private coaching, often having given up everything else.</p>
<p><strong>Jantar Mantar</strong> is a road in central Delhi that is the one place in the capital where protests are officially allowed. When Indians say "Jantar Mantar filled up," they mean a protest got big enough to matter.</p>
<p><strong>A paper leak</strong> is when the question paper escapes before the exam. It has happened repeatedly in Indian public examinations. When it does, the exam is often cancelled and re-held — which means years of preparation land on a date that is then taken away.</p>
</div>

<p>On an NDTV broadcast — NDTV is a national English-language news channel — a NEET aspirant named Harsh Dubey stops being a polite guest. He stands up, points at the anchor, and shouts a question at the whole room:</p>

<div class="w-pullquote">"Why does no one ever talk about reservation? Neither does any news channel talk about it, nor does the opposition talk about it, nor does the ruling party talk about it."<span class="w-attrib">Harsh Dubey, NEET aspirant, on NDTV, July 2026</span></div>

<p>He was, in one narrow sense, completely right. For years, mainstream Indian politics has treated reservation as a subject you do not open. Every major party supports it in public. Nobody wants the fight.</p>
<p>That clip went everywhere.</p>

<h3 class="w-h3">What happened next was faster than anything in Indian internet history</h3>
<p>On <strong>22 July 2026</strong>, an Instagram account appeared: <em>@reservationhataomovement</em>. Its bio read: "backed by citizens discarded by reservation politics, driven by merit."</p>
<p>The name matters, so let us translate it. <em>Reservation Hatao Andolan</em> is Hindi. <em>Hatao</em> means remove. <em>Andolan</em> means movement. So: the Remove Reservation Movement. Through the rest of this book I will shorten it to <strong>RHA</strong>, because it comes up on almost every page.</p>
<p>The account used the Harsh Dubey clip as its founding video.</p>

<div class="w-stats">
<div class="w-stat"><span class="w-stat-big">24 hrs</span><span class="w-stat-cap">Time taken to cross one million followers</span></div>
<div class="w-stat"><span class="w-stat-big">5.6 M</span><span class="w-stat-cap">Followers by 28 July, per Outlook India</span></div>
<div class="w-stat"><span class="w-stat-big">5.8 M</span><span class="w-stat-cap">Followers by 5 p.m. on 29 July, per The Quint</span></div>
</div>

<div class="w-box w-box--fact">
<span class="w-box-label">FACT</span>
<span class="w-box-title">The growth is real and was independently reported.</span>
<p>Outlook India reported 5.6 million followers and 122 posts on 28 July 2026. The Quint independently reported 5.8 million as of 5 p.m. on 29 July 2026, and confirmed the account was created on 22 July. Whatever you think of the movement, this is one of the fastest civic mobilisations India has seen.</p>
<p class="w-srcline">Sources: Outlook India, 28 July 2026 · The Quint, 29 July 2026</p>
</div>

<p>To feel the size of that: 5.8 million is more people than live in Singapore, gathered around one idea, in seven days, without a single meeting hall being booked.</p>

<h3 class="w-h3">It did not call for a march. It called for a flood.</h3>
<p>This is the part that makes 2026 different from 1990. In 1990, when India last exploded over reservation, students blocked trains and burned buses. In 2026, the instruction was different. An RHA video told followers:</p>

<div class="w-pullquote">"You need to flood the comment sections… The algorithm should reflect nothing but the issue of reservation. Since this is a Gen-Z protest, we will conduct it in the Gen-Z way."<span class="w-attrib">RHA account video, quoted by The Quint</span></div>

<div class="w-box w-box--key">
<span class="w-box-label">IN PLAIN WORDS</span>
<span class="w-box-title">What "the algorithm" means, and why flooding it is a protest.</span>
<p>Instagram, YouTube and X do not show you everything. Each one runs a piece of software — the <strong>algorithm</strong> — that decides which posts you see and in what order. It mostly promotes whatever is getting the most comments, likes and shares right now.</p>
<p>So if enough people comment on one subject at the same time, the software concludes that the subject is important and pushes it in front of millions more people who never asked for it. You have not persuaded anyone. You have persuaded the software, and the software does the rest.</p>
<p>That is what "flood the comment sections" means. It is a protest that needs no permission, no venue, and no leader standing at the front where the police can find him.</p>
</div>

<p>No permission needed. No police lathi charge to film. No leaders to arrest. A protest that lives entirely inside the recommendation algorithms of two or three American companies.</p>

<h3 class="w-h3">And then the other side arrived</h3>
<p>Within days, anti-caste creators, scholars, students and cartoonists were producing rebuttals that were getting hundreds of thousands of likes of their own. One post calling the campaign "politically, historically, and statistically illiterate" crossed 52,000 likes. An illustration against manual scavenging crossed 75,000.</p>
<p>One line from that pile-on is worth putting in a box, because it is the sharpest single sentence produced by either side in the whole week:</p>

<div class="w-pullquote">"So many posts are demanding the end of reservation, yet not a single one demands the end of caste or casteism."<span class="w-attrib">Viral post on X, 26 July 2026</span></div>

<h3 class="w-h3">The uncomfortable observation</h3>
<p>I spent several days reading those comment sections. Thousands of them. Here is what I found, and I want to say it plainly because it applies to almost everyone, on every side.</p>
<p><strong>Most people arguing did not know the rules of the thing they were arguing about.</strong></p>
<p>People were confidently wrong about what percentage is reserved. About whether a reserved-category topper takes a general seat. About what the Constitution says. About what a "cut-off" even means. About whether reservation had a ten-year expiry date. About what the creamy layer is.</p>
<p>These are not obscure details. These are the basic operating rules. And they were being got wrong by people writing paragraphs of certainty at three in the morning.</p>
<p>I am not writing that from above. When I started reading properly for this book I found out that several things I had believed my whole life were simply not true — and some of them were things I had believed because they made my side look good.</p>

<div class="w-box w-box--interp">
<span class="w-box-label">INTERPRETATION</span>
<span class="w-box-title">Why did this explode <em>now</em>, and not in 2019 or 2022?</span>
<p><strong>Reading one:</strong> This is real, spontaneous frustration finally finding a voice. Government jobs are shrinking, exams are being leaked, unemployment among graduates is severe, and a generation that did everything right feels cheated. The CJP protests proved to young Indians that online anger can actually force a minister out. RHA was the second wave of the same energy.</p>
<p><strong>Reading two:</strong> This is opportunism. A movement about paper leaks — a failure of the government's own exam agency — was successfully redirected within 48 hours into a fight between students and other students. The people who ran the leaky exams disappear from the story entirely. The anger stays, but the target changes.</p>
<p>Both readings can be true at once. Genuine frustration and convenient redirection are not opposites. That is exactly how political energy usually gets used.</p>
</div>

<div class="w-box w-box--key">
<span class="w-box-label">WHERE WE GO FROM HERE</span>
<p>Before we can judge any of this, we need to know what reservation actually is. Not what it feels like. What it is. That is the next three chapters, and they are the least exciting and most important pages in this book. Chapter 2 tells you what the system does in one page. Chapter 3 teaches you the four number-words that this whole argument runs on. Chapter 4 gives you the real figures, and Chapter 5 shows you the machine working.</p>
</div>

<h2 class="w-h2" id="rf1-2-reservation-in-one-page"><span class="w-num">2</span>Reservation in One Page</h2>
<p class="w-lead">Forget everything you have heard. Here is the plainest possible description of what the system does.</p>

<p>Reservation is a rule that says: <strong>in government jobs, in government-funded colleges, and in elected seats, a fixed share of the places must go to people from listed groups.</strong></p>
<p>That is it. That is the whole mechanism. Everything else in fourteen parts is history, evidence and argument about that one sentence.</p>

<div class="w-box w-box--key">
<span class="w-box-label">IN PLAIN WORDS</span>
<span class="w-box-title">Two words in that sentence do a lot of work.</span>
<p>A <strong>seat</strong> is one place: one spot in a medical college class, one post in a government office, one chair in Parliament. Seats are counted as whole things, and there are never enough of them.</p>
<p>A <strong>share</strong>, or a <strong>quota</strong>, means a fixed fraction of those seats is set aside for a named group. If there are 100 posts and 15 are set aside, that is a 15% quota. Set aside does not mean given away — you still have to earn one of them, in competition with everyone else in that group.</p>
</div>

<p>Three things follow from that one sentence, and each one matters more than most people arguing about it realise:</p>
<ul>
<li><strong>It only applies to government things.</strong> Government jobs, public universities, government-funded college seats, seats in Parliament and state assemblies. It does not apply to private companies. If you work at Infosys, TCS, Reliance, a startup, a shop, or your uncle's business, reservation has never touched your hiring. More on this in a moment, because it is enormous.</li>
<li><strong>The groups are listed, not self-declared.</strong> You cannot simply say you are Scheduled Caste. There are official lists — the Scheduled Castes list, the Scheduled Tribes list, the Other Backward Classes list — maintained by the central government and by each state. Being on the list is a legal status with paperwork. You apply for a certificate, and you can be prosecuted for faking one.</li>
<li><strong>It is a share, not a gift.</strong> Nobody is handed a job. You still have to appear, qualify, and rank. The reservation decides <em>which pool of candidates you are ranked against</em>. Hold on to that phrase. In Chapter 5 it turns out to be the whole game.</li>
</ul>

<div class="w-box w-box--fact">
<span class="w-box-label">FACT</span>
<span class="w-box-title">Reservation does not exist in India's private sector.</span>
<p>There is no caste reservation in private-sector hiring anywhere in India. It has been proposed and debated for decades; it has never been enacted. Since the overwhelming majority of Indian jobs are private or informal, the entire national argument is about a small and shrinking slice of the total job market. Hold on to this. It comes back in Part 13 and it changes how the whole fight looks.</p>
</div>

<h3 class="w-h3">Now: the two analogies</h3>
<p>Here is where honest writing gets hard. Every explanation of reservation smuggles in an argument through its choice of metaphor. So instead of picking one, I am going to give you both — the one each side actually uses — and let you see them side by side.</p>

<div class="w-sides w-sides--pair">
<div class="w-side w-side--b"><span class="w-who">THE "KEEP IT" SIDE'S ANALOGY — THE RACE</span>
<p>Imagine a running race. For a thousand years, one group of runners was allowed to train, wear shoes, and eat properly. Another group was legally forbidden from even entering the track, and was punished for trying.</p>
<p>Then one day someone fires a starting pistol and announces: <em>from now on, everyone competes equally, may the best runner win.</em></p>
<p>That is not fairness. That is freezing an unfair result in place and calling it a fair race. Reservation is the attempt to correct a starting line that was rigged for fifty generations.</p>
</div>
<div class="w-side w-side--a"><span class="w-who">THE "REMOVE IT" SIDE'S ANALOGY — THE HOSPITAL</span>
<p>Imagine you are being wheeled into surgery. You do not ask the surgeon about their grandfather's suffering. You ask whether they are the best surgeon available.</p>
<p>Some jobs — doctor, engineer, pilot, judge — affect other people's lives. Filling them by any rule other than pure ability imposes the cost of historical repair onto random third parties, including poor people who never oppressed anyone.</p>
<p>Justice for the past should not be paid for with the future.</p>
</div>
</div>

<div class="w-box w-box--interp">
<span class="w-box-label">INTERPRETATION</span>
<span class="w-box-title">Notice what each analogy quietly assumes.</span>
<p>The race analogy assumes the starting line is <em>still</em> unequal today — that the disadvantage did not end in 1950. If that is false, the analogy collapses. Part 6 and Part 11 test exactly this.</p>
<p>The hospital analogy assumes that the exam score measures the ability that matters, and that it measures it independently of your background. If a score largely reflects who could afford eight lakh rupees of coaching, then "the best surgeon" and "the highest scorer" are not the same person. Part 11 tests exactly this.</p>
<p>Neither analogy is dishonest. Both are doing the argument's work before the argument starts. That is what analogies do — which is why you should never let one settle anything.</p>
</div>

<h3 class="w-h3">The four words you need</h3>
<p>You will meet these constantly — in this book, in every news report, on every form you will ever fill. Learn them once now and the rest of the series is easy. Right now, just learn what the letters stand for and roughly who is in each group. Where the groups came from is Parts 2 to 5.</p>

<figure class="w-figure">
<figcaption class="w-table-caption">The vocabulary, in plain English</figcaption>
<div class="w-table-scroll">
<table class="w-table">
<thead><tr><th>Word</th><th>What it actually means</th></tr></thead>
<tbody>
<tr><td class="w-hi">SC</td><td><strong>Scheduled Castes.</strong> The communities historically treated as "untouchable" — kept outside villages, barred from temples, wells and schools, and assigned the work nobody else would do. Officially listed in a Presidential Order. Roughly 16.6% of India's population at the 2011 Census.</td></tr>
<tr><td class="w-hi">ST</td><td><strong>Scheduled Tribes.</strong> India's Adivasi or indigenous communities — historically living in forests and hills, largely outside the caste system rather than at the bottom of it, and displaced by mining, dams and forestry. Roughly 8.6% at the 2011 Census.</td></tr>
<tr><td class="w-hi">OBC</td><td><strong>Other Backward Classes.</strong> The huge middle band — communities that were not treated as untouchable, but were socially and educationally held down. Farmers, artisans, herders, weavers, potters, fishermen and many more. The single largest bloc, but we do not have a modern official count. That is why the 2027 Census matters so much.</td></tr>
<tr><td class="w-hi">EWS</td><td><strong>Economically Weaker Sections.</strong> The newest category, created in 2019. This one is not about caste — it is for poor families among the castes that get no other reservation. In effect, a poverty quota for the general category.</td></tr>
</tbody>
</table>
</div>
</figure>

<p class="w-tnote">One more label you will see everywhere: <strong>General</strong>, sometimes written UR for "unreserved". General is not a fifth group with a list of its own. It is simply everybody who is not on the SC, ST or OBC lists. That sounds like a small point. In Chapter 7 it turns out to be one of the most misused words in the whole argument.</p>

<div class="w-box w-box--claim">
<span class="w-box-label">CONTESTED CLAIM</span>
<span class="w-box-title">"OBCs are 52% of India."</span>
<p>You will see this number everywhere. It comes from the Mandal Commission's 1980 report, which arrived at it by taking the last caste census — 1931 — and doing arithmetic on it. It is an estimate built on 95-year-old data. It may be roughly right. It may be badly wrong. Nobody actually knows, and anyone who tells you they know is guessing. India has not counted caste in a full census since 1931. The 2027 Census will be the first that does. Part 10 covers this.</p>
</div>

<h2 class="w-h2" id="rf1-3-four-words-that-cause-half-the-fights"><span class="w-num">3</span>Four Words That Cause Half The Fights</h2>
<p class="w-lead">Marks, percentage, percentile, rank — and the word "cut-off", which means two completely different things. Nothing here is about caste. This is just arithmetic, and it takes ten minutes.</p>

<p>The next two chapters are full of numbers. Before we use a single real one, we are going to learn what the number-words actually mean.</p>
<p>I am putting this chapter in because of a mistake I made in the first edition of this book. I wrote the numbers chapters assuming everyone already knew what a percentile was, and what a cut-off was, and how they differ. Readers told me — politely — that the story at the start made sense and then the numbers began and it turned to fog.</p>
<p>That was my failure. So here is the ground floor. If you already know all of this, skip to Chapter 4. If you are not sure, read it, because <strong>almost every viral claim about reservation is built on confusing two of these five words with each other.</strong></p>

<h3 class="w-h3">Word 1 — Marks</h3>
<p>Marks are the simplest one. Marks are the score you got on the paper.</p>
<p>In NEET there are 180 questions. Each correct answer gives you 4 marks. Each wrong answer takes away 1 mark. A question you leave blank gives you nothing and costs you nothing. So the highest possible score is 180 × 4 = <strong>720</strong>.</p>

<div class="w-box w-box--key">
<span class="w-box-label">WORKED EXAMPLE — INVENTED</span>
<span class="w-box-title">Meet Ravi. He is not a real person. His arithmetic is real.</span>
<p>Ravi answers 130 questions correctly, gets 30 wrong, and leaves 20 blank.</p>
<ul>
<li>130 correct × 4 marks = <strong>+520</strong></li>
<li>30 wrong × 1 mark = <strong>−30</strong></li>
<li>20 blank × 0 = <strong>0</strong></li>
<li>Ravi's total: <strong>490 marks out of 720</strong></li>
</ul>
<p>Notice the minus. Because wrong answers subtract, it is arithmetically possible to finish with a score below zero — if you guess wildly and get most of them wrong. Remember that. It matters in Chapter 5, where one of the most repeated claims of 2026 depends on it.</p>
</div>

<h3 class="w-h3">Word 2 — Percentage</h3>
<p>A percentage compares your marks <em>to the paper</em>. It answers: out of everything that was available, how much did you get?</p>
<p>You calculate it by dividing your marks by the total and multiplying by 100.</p>
<p>Ravi got 490 out of 720. So: 490 ÷ 720 = 0.68. Multiply by 100 and Ravi scored <strong>68%</strong>.</p>
<p>The important property of a percentage is this: <strong>it does not depend on anybody else.</strong> If every other candidate in India had scored zero, or if every one of them had scored 720, Ravi's percentage would still be 68%. It is a fact about Ravi and the question paper, and nothing else.</p>

<h3 class="w-h3">Word 3 — Percentile</h3>
<p>Here is the one that causes the trouble, because it looks like the word "percentage" and means something completely different.</p>
<p>A percentile compares you <em>to the other candidates</em>. It answers: what share of the people who sat this exam did I beat?</p>

<div class="w-box w-box--key">
<span class="w-box-label">IN PLAIN WORDS</span>
<span class="w-box-title">Percentile, in one line.</span>
<p>Your percentile is <strong>the share of candidates who scored below you</strong>, written as a number out of 100.</p>
<p>If you are at the 90th percentile, 90% of the candidates scored less than you and 10% scored more. If you are at the 50th percentile, you are exactly in the middle: half did worse, half did better.</p>
<p>A percentile is a <em>position in a crowd</em>. A percentage is a <em>fraction of a paper</em>. They are not related, they are not interchangeable, and mixing them up is the single most common error in this entire argument.</p>
</div>

<div class="w-box w-box--key">
<span class="w-box-label">WORKED EXAMPLE — INVENTED</span>
<span class="w-box-title">A class of ten, so you can count it on your fingers.</span>
<p>Ten students sit a test. Their marks, lowest to highest:</p>
<p><strong>12, 20, 25, 31, 38, 44, 51, 60, 72, 88</strong></p>
<p>Take the student who scored 51. Six students scored less than her (12, 20, 25, 31, 38, 44). Six out of ten is 60%. So she is at roughly the <strong>60th percentile</strong>.</p>
<p>Her <em>percentage</em>, if the test was out of 100, is 51%. Her <em>percentile</em> is 60. Two different numbers describing two different things about the same student. This is the whole trap.</p>
</div>

<p>And now the part that makes people angry when they first see it: <strong>the same marks can be a brilliant percentile one year and a poor one the next.</strong> Not because the student changed. Because the crowd changed, or the paper did.</p>

<figure class="w-figure">
<figcaption class="w-table-caption">Same student, same marks, two different exams — invented, to show the principle</figcaption>
<div class="w-table-scroll">
<table class="w-table">
<thead><tr><th>&nbsp;</th><th>A very hard paper</th><th>A very easy paper</th></tr></thead>
<tbody>
<tr><td class="w-hi">Ravi's marks</td><td>490 out of 720</td><td>490 out of 720</td></tr>
<tr><td class="w-hi">Ravi's percentage</td><td>68%</td><td>68%</td></tr>
<tr><td class="w-hi">What most others scored</td><td>Most scored under 300</td><td>Most scored over 600</td></tr>
<tr><td class="w-hi">Ravi's percentile</td><td>Very high — he beat almost everyone</td><td>Very low — almost everyone beat him</td></tr>
</tbody>
</table>
</div>
</figure>

<p>This is why exam bodies use percentiles at all. A percentile is stable across years in a way a raw mark is not. "The top half of the candidates" means the same thing whether the paper was brutal or kind. "350 marks" does not.</p>

<h3 class="w-h3">Word 4 — Rank</h3>
<p>Rank is the easiest of the four to picture. Line every candidate up, highest marks at the front. Your rank is your place in that line. Rank 1 is the topper.</p>
<p>In national exams you will see <strong>AIR</strong>, which stands for All India Rank. AIR 19,603 means 19,602 people in the country scored above you.</p>
<p>Rank and percentile are two ways of saying the same kind of thing — where you stand relative to everyone else — but one is a <em>count</em> and the other is a <em>share</em>. If twenty lakh people sit an exam, the person at the 50th percentile is standing at roughly rank ten lakh. Same position, two units.</p>

<h3 class="w-h3">Word 5 — Cut-off, which is really two words</h3>
<p>Now the word that does the most damage.</p>
<p>Most people hear "cut-off" and picture a pass mark — a line the authorities decide in advance, like "you need 40% to pass". For the number that actually decides who becomes a doctor, that picture is <strong>completely wrong</strong>.</p>

<div class="w-box w-box--key">
<span class="w-box-label">IN PLAIN WORDS</span>
<span class="w-box-title">The bus, and where the cut-off comes from.</span>
<p>Imagine a bus with 40 seats and a queue of 500 people. The rule is simple: the highest scorer boards first, then the next, and so on until the bus is full.</p>
<p>The 40th person boards. The bus is full. The 41st person is turned away.</p>
<p>Now ask: what was the cut-off? It was whatever the 40th person happened to score. Nobody decided it. Nobody announced it in advance. It was <em>discovered</em> at the moment the last seat was taken.</p>
<p>And it moves. If a stronger crowd turns up next year, the 40th person will have a higher score, so the cut-off "rises". If the paper is harder, the 40th person scores less, so the cut-off "falls". The bus did not change. The queue did.</p>
</div>

<p>So a cut-off is usually not a standard. It is a <strong>side effect of scarcity</strong> — a record of where the seats ran out. That single idea dissolves an enormous amount of the shouting, because people treat a falling cut-off as proof that standards were lowered for somebody, when it is usually proof that this year's paper was harder or this year's queue was weaker.</p>
<p>But there is a second kind of cut-off, and this is where the confusion becomes industrial.</p>

<figure class="w-figure">
<figcaption class="w-table-caption">The two cut-offs — learn this table and you have defused half the argument</figcaption>
<div class="w-table-scroll">
<table class="w-table">
<thead><tr><th>&nbsp;</th><th>Qualifying cut-off</th><th>Admission cut-off</th></tr></thead>
<tbody>
<tr><td class="w-hi">What it is</td><td>A floor. The minimum needed to be allowed to apply for a seat at all.</td><td>The score of the last person who actually got a seat.</td></tr>
<tr><td class="w-hi">Who sets it</td><td>The exam body, in advance.</td><td>Nobody. It emerges once the seats run out.</td></tr>
<tr><td class="w-hi">Usually written as</td><td>A percentile — "the 50th percentile".</td><td>Marks, and an All India Rank.</td></tr>
<tr><td class="w-hi">What clearing it wins you</td><td>The right to enter the queue. Nothing more.</td><td>A seat. This is the number that makes you a doctor.</td></tr>
<tr><td class="w-hi">How high is it</td><td>Low. It is a floor.</td><td>Very high. It is the last seat in a queue of lakhs.</td></tr>
</tbody>
</table>
</div>
</figure>

<div class="w-box w-box--fact">
<span class="w-box-label">FACT</span>
<span class="w-box-title">These two numbers are hundreds of marks apart, and they are constantly quoted as if they were the same number.</span>
<p>In NEET 2025, the qualifying floor for the SC, ST and OBC categories was the 40th percentile, which came out at 113 marks. The score at which all-India government MBBS seats actually ran out for SC candidates in Round 1 was 575 marks.</p>
<p>113 lets you join the queue. 575 got you the seat. Anyone quoting 113 as though it were an admission standard is off by 462 marks — and that mistake, repeated at volume, is the fuel of a lot of what happened in July 2026.</p>
</div>

<h3 class="w-h3">One last thing: why cut-offs get printed as a range</h3>
<p>When you look up NEET qualifying cut-offs, you do not see one number. You see something like <strong>"General / EWS — 50th percentile — 686–144"</strong>, and it looks like nonsense.</p>
<p>It is not. It is a band, and it is read from the top down:</p>
<ul>
<li><strong>686</strong> is the highest mark anyone in that category scored that year. The top of the band.</li>
<li><strong>144</strong> is the lowest mark that still counted as qualified. The bottom of the band — and this is the actual floor.</li>
<li>Everyone between those two numbers has qualified. That is all the range is saying.</li>
</ul>
<p>So when you see a range, look at the second number. That is the cut-off. The first is just the topper.</p>

<div class="w-box w-box--key">
<span class="w-box-label">CHECK YOURSELF BEFORE CHAPTER 4</span>
<p>If you can answer these four without looking back, the rest of the book will be easy.</p>
<ul>
<li>Which one depends on how everyone else did — percentage or percentile?</li>
<li>Is a cut-off usually decided in advance, or discovered afterwards?</li>
<li>Which cut-off gets you a seat — qualifying or admission?</li>
<li>In "686–144", which number is the floor?</li>
</ul>
<p>Answers, in order: percentile · discovered afterwards · admission · 144.</p>
</div>

<h2 class="w-h2" id="rf1-4-the-actual-numbers"><span class="w-num">4</span>The Actual Numbers</h2>
<p class="w-lead">Who gets how much, why the total is not what you think, and the 50% wall that cracked in 2019.</p>

<p>Almost every argument about reservation contains a number, and a surprising share of those numbers are wrong. So here are the real ones, for central government jobs and central educational institutions.</p>

<p class="w-tnote"><strong>"Central" means run by the national government in Delhi</strong> — the UPSC civil services, the IITs, the AIIMS hospitals, central universities, the national railways. Every Indian state also runs its own jobs and colleges with its own numbers. We will get to the states in a moment; they are very different.</p>

<figure class="w-figure">
<figcaption class="w-table-caption">Central government reservation, as of 2026</figcaption>
<div class="w-table-scroll">
<table class="w-table">
<thead><tr><th>Category</th><th>Share</th><th>Notes</th></tr></thead>
<tbody>
<tr><td class="w-hi">Scheduled Castes (SC)</td><td>15%</td><td>In place since the 1950s</td></tr>
<tr><td class="w-hi">Scheduled Tribes (ST)</td><td>7.5%</td><td>In place since the 1950s</td></tr>
<tr><td class="w-hi">Other Backward Classes (OBC)</td><td>27%</td><td>Since 1990 in jobs, 2008 in central colleges. Non-creamy-layer only.</td></tr>
<tr><td class="w-hi">Economically Weaker Sections (EWS)</td><td>10%</td><td>Added 2019. Not caste-based.</td></tr>
<tr><td class="w-hi">Total reserved</td><td>59.5%</td><td>Leaving 40.5% open to everyone including all of the above</td></tr>
</tbody>
</table>
</div>
</figure>

<p>Because percentages of 100 give you awkward halves, let me show you the same thing as real posts. Imagine a department advertising <strong>1,000 jobs</strong>. Here is exactly how they are labelled:</p>

<div class="w-box w-box--key">
<span class="w-box-label">WORKED EXAMPLE</span>
<span class="w-box-title">1,000 central government posts, split by the rules above.</span>
<ul>
<li>SC — 15% of 1,000 = <strong>150 posts</strong></li>
<li>ST — 7.5% of 1,000 = <strong>75 posts</strong></li>
<li>OBC — 27% of 1,000 = <strong>270 posts</strong></li>
<li>EWS — 10% of 1,000 = <strong>100 posts</strong></li>
<li>Reserved so far: 150 + 75 + 270 + 100 = <strong>595 posts</strong>, which is the 59.5%</li>
<li>Open to everyone: <strong>405 posts</strong></li>
</ul>
<p>Now the single most misunderstood line in that list. Those 405 posts are <strong>not</strong> "general category posts". They are open. An SC, ST, OBC or EWS candidate who scores high enough can take one of them, and every year many do. There is no such thing as a general-only seat in Indian law. We will see exactly how that works in the next chapter.</p>
</div>

<p class="w-tnote">Persons with Disabilities get a further quota — 4% in government jobs under the 2016 Act, 5% in higher-education admissions — but it works differently, and that difference is the subject of the next section.</p>

<h3 class="w-h3">Vertical and horizontal: the distinction that ends a hundred arguments</h3>
<p>Here is something almost nobody outside the system knows, and it clears up an enormous amount of confusion.</p>
<p>There are two kinds of reservation, and they stack differently.</p>

<div class="w-sides w-sides--pair">
<div class="w-side w-side--a"><span class="w-who">VERTICAL RESERVATION — the columns</span>
<p>SC, ST, OBC and EWS are vertical. Think of them as separate columns of seats. If there are 100 posts, 15 are in the SC column, 7.5 in the ST column, 27 in the OBC column, 10 in the EWS column, and 40.5 are open.</p>
<p>You can only stand in one vertical column.</p>
</div>
<div class="w-side w-side--b"><span class="w-who">HORIZONTAL RESERVATION — the slices</span>
<p>Disability, ex-servicemen status, and in many states women, are horizontal. These do not get their own column. They cut across every column.</p>
<p>So a 4% disability quota means 4% of the open seats, 4% of the SC seats, 4% of the OBC seats, and so on. A disabled general-category candidate competes for the disabled slice of the general column.</p>
</div>
</div>

<div class="w-box w-box--key">
<span class="w-box-label">WORKED EXAMPLE</span>
<span class="w-box-title">Back to the 1,000 posts. Now add a 4% disability quota.</span>
<p>The wrong way to think about it — and the way most angry posts do it — is: 595 reserved, plus 4% for disability, so now 635 are reserved and only 365 are left. That is not what happens.</p>
<p>What actually happens is that the 4% is cut <em>out of each column that already exists</em>:</p>
<ul>
<li>Of the 150 SC posts, 4% — that is 6 posts — go to disabled SC candidates.</li>
<li>Of the 270 OBC posts, 4% — about 11 posts — go to disabled OBC candidates.</li>
<li>Of the 405 open posts, 4% — about 16 posts — go to disabled candidates from any background.</li>
<li>And so on through every column.</li>
</ul>
<p>Add it all up and you still have <strong>1,000 posts. Still 595 reserved. Still 405 open.</strong> Nothing was added on top. The disability quota is a horizontal slice through the whole table, not a new column beside it.</p>
</div>

<div class="w-box w-box--fact">
<span class="w-box-label">FACT</span>
<span class="w-box-title">Horizontal quotas do not add to the total.</span>
<p>This is why people who add up "15 + 7.5 + 27 + 10 + 4 + 3 + 33…" and announce that 90% of India is reserved are making a basic arithmetic error. Horizontal quotas are carved out of the existing columns, not added on top of them. The vertical total in central institutions is 59.5%.</p>
</div>

<h3 class="w-h3">Your state is almost certainly different</h3>
<p>The numbers above are for central government jobs and central institutions — the UPSC, the IITs, the AIIMS, central universities. But most Indian government jobs and most college seats are state jobs and state seats. And states set their own percentages.</p>

<figure class="w-figure">
<figcaption class="w-table-caption">How different the states are</figcaption>
<div class="w-table-scroll">
<table class="w-table">
<thead><tr><th>State</th><th>Roughly</th><th>The situation</th></tr></thead>
<tbody>
<tr><td class="w-hi">Tamil Nadu</td><td>69%</td><td>The highest in India. Protected from court challenge by being placed in the Ninth Schedule of the Constitution in 1994. Has run at this level for three decades.</td></tr>
<tr><td class="w-hi">Most large states</td><td>50%</td><td>The ceiling set by the Supreme Court in 1992, plus 10% EWS on top since 2019.</td></tr>
<tr><td class="w-hi">Several states</td><td>Above 50%</td><td>Various states have crossed the line for specific communities. Several such laws have been struck down; others are pending in court.</td></tr>
</tbody>
</table>
</div>
</figure>

<p class="w-tnote"><strong>The Ninth Schedule</strong> is a list inside the Constitution. Laws placed in it were historically shielded from being struck down by the courts on the ground that they violate fundamental rights. It is why Tamil Nadu's 69% has survived when similar laws elsewhere have not.</p>

<div class="w-box w-box--interp">
<span class="w-box-label">INTERPRETATION</span>
<span class="w-box-title">Tamil Nadu is Exhibit A for both sides.</span>
<p><strong>The "keep it" side says:</strong> Tamil Nadu has run 69% reservation for thirty years and is among India's best-performing large states on health, education, industrial output and human development. If heavy reservation destroyed institutions, Tamil Nadu should be a ruin. It is not.</p>
<p><strong>The "remove it" side says:</strong> Tamil Nadu was already ahead of most of India before 1970 for reasons that have nothing to do with quotas — early social reform, higher literacy, better public health, coastal trade. You cannot credit the quota for a lead that predates it, and the state's own general-category families now emigrate at high rates.</p>
<p>Both arguments are real. Neither has been settled. Part 11 goes at this properly with the data.</p>
</div>

<h3 class="w-h3">The 50% wall, and how it broke</h3>
<p>For thirty years, Indian reservation had one hard rule that everybody knew: you cannot go above 50%.</p>

<div class="w-timeline">
<div class="w-tl-item"><div class="w-tl-year">1992</div><div class="w-tl-text"><strong>The wall goes up</strong>In the <em>Indra Sawhney</em> case — the Mandal judgment — a nine-judge Supreme Court bench ruled that reservation must normally stay under 50% of available seats. The logic: Article 16 guarantees equality of opportunity, and if reservation exceeds half of everything, the exception has swallowed the rule.</div></div>
<div class="w-tl-item"><div class="w-tl-year">2019</div><div class="w-tl-text"><strong>The wall cracks</strong>Parliament passes the 103rd Constitutional Amendment, creating a 10% quota for Economically Weaker Sections among people who get no other reservation. Total central reservation goes to 59.5% — above the line.</div></div>
<div class="w-tl-item"><div class="w-tl-year">2022</div><div class="w-tl-text"><strong>The court allows it — narrowly</strong>In <em>Janhit Abhiyan</em>, a five-judge bench upholds EWS by 3 votes to 2. Two judges, including the Chief Justice, dissent. One vote the other way and the entire thing would have collapsed.</div></div>
<div class="w-tl-item"><div class="w-tl-year">2024</div><div class="w-tl-text"><strong>The columns get sub-divided</strong>In <em>State of Punjab v. Davinder Singh</em>, a seven-judge bench rules 6–1 that states may sub-classify Scheduled Castes — splitting the SC quota so the most deprived sub-castes get a protected share within it. The largest structural change in decades.</div></div>
</div>

<p class="w-tnote">A word on <strong>benches</strong>, since the numbers keep appearing. When the Supreme Court decides something important it sits as a panel of several judges — five, seven, nine. The bigger the bench, the harder the ruling is to overturn later. "6–1" means six judges agreed and one did not; the majority wins.</p>

<div class="w-box w-box--fact">
<span class="w-box-label">FACT</span>
<span class="w-box-title">EWS is a caste-blind quota — and it was created by the same Parliament and upheld by the same court.</span>
<p>The 10% EWS quota uses income and property tests, not caste. Which means India has already run the experiment that RHA is proposing, on 10% of seats, since 2019. Anyone arguing about whether an economic quota is possible should start by looking at how the existing one has actually worked. Part 10 does.</p>
</div>

<div class="w-box w-box--key">
<span class="w-box-label">A QUESTION TO HOLD</span>
<p>Why did the same political system that will not touch caste quotas find it easy to break a thirty-year constitutional ceiling within weeks, in order to create a quota for the general category? Whatever your view, the speed is worth thinking about.</p>
</div>

<h2 class="w-h2" id="rf1-5-how-it-actually-works"><span class="w-num">5</span>How It Actually Works</h2>
<p class="w-lead">This is the chapter nobody reads. It is also the reason most of this fight is confused. Please do not skip it.</p>

<p>Everything so far has been the map. This is the machine. If you read only one chapter of this book, read this one — because at least four of the most common claims on both sides fall apart the moment you understand how the mechanism actually operates.</p>
<p>There are four rules. I am going to walk each one through with a worked example.</p>

<h3 class="w-h3">Rule 1: There are two lists, and the good candidates move up</h3>
<p>Here is the single most misunderstood rule in Indian public recruitment.</p>
<p><strong>If a reserved-category candidate scores high enough to make the general cut-off on their own, without using any relaxation, they are counted in the general list — not the reserved list. Their reserved seat then goes to the next reserved candidate.</strong></p>
<p>In official language they are called a Meritorious Reserved Category candidate, or selected "on own merit."</p>

<div class="w-box w-box--key">
<span class="w-box-label">WORKED EXAMPLE — INVENTED CANDIDATES, REAL RULE</span>
<span class="w-box-title">Ten seats, and watch where each person lands.</span>
<p>A department has <strong>10 posts</strong>: 6 open, 4 reserved for one category. Ignore the other categories for a moment; we are testing one rule.</p>
<p>Suppose the six best scores in the whole country are 95, 93, 91, 90, 88 and 87 — and two of those six people, the ones who scored 91 and 88, are from the reserved category.</p>
<p><strong>The wrong picture</strong> — the one in most comment sections — is that the reserved pair are pulled out of the top six and put into the reserved four, so six general-category people fill the open seats and four reserved people fill the reserved seats. Ten people, neatly separated.</p>
<p><strong>What the rule actually does:</strong> the candidates scoring 91 and 88 cleared the open bar on their own marks, using no relaxation of any kind. So they are counted in the <em>open</em> six. They occupy two of the six open posts.</p>
<p>And here is the consequence people miss: <strong>the four reserved posts are still empty.</strong> They now go to the next four reserved-category candidates down the list. So the department ends up appointing more people from that category than the quota alone would have produced — not fewer.</p>
<p>That is the entire purpose of the rule. It exists so that reservation adds representation instead of capping it.</p>
</div>

<div class="w-box w-box--fact">
<span class="w-box-label">FACT</span>
<span class="w-box-title">This is not a technicality. It is settled law, restated by the Supreme Court in 2026.</span>
<p>In <em>Airports Authority of India &amp; Ors v. Sham Krishna B &amp; Ors</em> (2026 INSC 69), the Supreme Court held that where a reserved-category candidate secures marks higher than the general cut-off, that candidate must be treated as qualified against an open or unreserved vacancy — and must be treated that way from the first stage of selection, not adjusted afterwards.</p>
</div>

<p>Now look at what this does to the most repeated sentence of July 2026: <em>"he took a general seat with lower marks."</em></p>
<p>By rule, that describes something that cannot happen. An open seat can only be taken by someone who cleared the open bar — that is what the open bar <em>is</em>. What actually happens is the reverse: a reserved-category topper leaves the reserved pool and frees a seat inside it.</p>

<div class="w-pullquote">Reservation does not lower the general cut-off. It creates additional lists underneath it.</div>

<h3 class="w-h3">Rule 2: A qualifying score is not an admission score</h3>
<p>This confusion, on its own, probably powers half the anger online. You already have the tools for it from Chapter 3 — this is the two-cut-offs table meeting real data.</p>
<p>In an exam like NEET there are two completely different numbers, and people constantly quote the first while meaning the second.</p>

<figure class="w-figure">
<figcaption class="w-table-caption">The two numbers that get mixed up</figcaption>
<div class="w-table-scroll">
<table class="w-table">
<thead><tr><th>Number</th><th>What it is</th></tr></thead>
<tbody>
<tr><td class="w-hi">Qualifying cut-off</td><td>The minimum score to be allowed into the counselling process at all. It is a percentile floor, not a seat. In NEET 2025 this was the 50th percentile for General/EWS (686–144 marks) and the 40th percentile for OBC/SC/ST (143–113 marks). Clearing it wins you nothing except the right to apply.</td></tr>
<tr><td class="w-hi">Admission cut-off</td><td>The score at which seats actually ran out. This is the number that decides who becomes a doctor. It is far, far higher — and for the top categories it is nearly identical across groups.</td></tr>
</tbody>
</table>
</div>
</figure>

<p class="w-tnote"><strong>Counselling</strong> is the allotment process that happens after the exam. Everyone who qualified enters it, lists the colleges they want in order of preference, and seats are handed out by rank over several rounds. The "closing" score of a round is the last score that got a seat in it.</p>

<p>Now look at what the second number actually was.</p>

<figure class="w-figure">
<figcaption class="w-table-caption">NEET 2025 — All India Quota, government MBBS, Round 1 closing</figcaption>
<div class="w-table-scroll">
<table class="w-table">
<thead><tr><th>Category</th><th>Closing marks</th><th>Closing All-India Rank</th></tr></thead>
<tbody>
<tr><td class="w-hi">General</td><td>660</td><td>AIR 19,603</td></tr>
<tr><td class="w-hi">OBC</td><td>658</td><td>AIR 20,281</td></tr>
<tr><td class="w-hi">SC</td><td>575</td><td>AIR 1,05,676</td></tr>
</tbody>
</table>
</div>
</figure>

<p>By the final stray round the same seats closed at roughly 652 (General), 652 (OBC) and 549 (SC).</p>

<div class="w-box w-box--fact">
<span class="w-box-label">FACT</span>
<span class="w-box-title">The General–OBC gap for a government MBBS seat in 2025 was two marks.</span>
<p>Two. Out of 720. In the final stray round it was zero — both closed at 652. The General–SC gap was real and substantial: 85 marks in Round 1. But the picture of vast, casual gaps across all reserved categories does not survive contact with the actual counselling data.</p>
</div>

<p>Put the two numbers side by side one final time, because this is the sentence that should stay with you. For an OBC candidate in 2025, the qualifying floor was <strong>113 marks</strong>. The score that actually got a government MBBS seat was <strong>658 marks</strong>. Those numbers are 545 marks apart, and they are routinely quoted as if they were the same thing.</p>

<div class="w-box w-box--claim">
<span class="w-box-label">CONTESTED CLAIM</span>
<span class="w-box-title">"A student with minus 40 marks got admission while a hard-working student did not."</span>
<p>This claim, made in an RHA video and repeated thousands of times, is the emotional engine of the whole campaign. I tried to verify it and could not.</p>
<p>Remember from Chapter 3 that a negative score is arithmetically possible, because wrong answers subtract a mark. So the claim is not absurd on its face. But what the record shows is this: the lowest qualifying floor for any reserved category in NEET 2025 was 113 marks, not a negative number. And a qualifying floor is not a seat. In the all-India government MBBS pool, the very last SC seat in the final stray round went at 549 marks.</p>
<p>Extremely low scores can pick up seats in some private and deemed colleges in late stray rounds — but that happens across categories, including General, and it happens because those seats cost sums most families cannot pay. That is a story about money, not about caste. Marked contested until someone produces the actual allotment record.</p>
</div>

<h3 class="w-h3">Rule 3: The roster — how 27% becomes an actual list of posts</h3>
<p>You cannot give 27% of one job to someone. A job is a whole thing. So how does a department that is hiring four people this year deliver a 27% quota?</p>
<p>The answer is the <strong>100-point roster</strong>: a numbered list from 1 to 100 where each position is pre-labelled by category, fixed in advance. Vacancies are filled by walking down that list in order, and the department picks up where it left off last time.</p>

<div class="w-box w-box--key">
<span class="w-box-label">WORKED EXAMPLE</span>
<span class="w-box-title">Why a real recruitment round can look nothing like 15/7.5/27.</span>
<p>Picture the roster as 100 numbered chairs standing in a row. Chair 1 is labelled OPEN. Chair 2 is labelled OPEN. Chair 4 might be labelled OBC. Chair 8 might be labelled SC. And so on, so that when you have walked all 100 chairs, you will have passed exactly 15 SC chairs, 7.5 ST, 27 OBC, 10 EWS and 40.5 open.</p>
<p>Now: this year the department has only <strong>4 vacancies</strong>. It walks to where it stopped last time — say chair 31 — and fills chairs 31, 32, 33 and 34.</p>
<p>Whatever those four chairs happen to be labelled is what this year's recruitment looks like. They might be three OBC and one open. They might be four open. They might be two SC and two OBC.</p>
<p>Somebody screenshots that notification and posts it as proof of a conspiracy — and depending on which four chairs came up, the conspiracy is alleged by either side. Usually it is just where the roster happened to be standing.</p>
</div>

<p>Two consequences follow, and each one annoys a different side:</p>
<ul>
<li><strong>The percentages are not per-round, they are per-roster.</strong> In a small recruitment of four posts, you can easily get an outcome that looks nothing like 15/7.5/27. People screenshot such rounds as proof of a conspiracy in both directions.</li>
<li><strong>Unfilled reserved posts create backlog.</strong> If no eligible candidate is found for a reserved point, that post is carried forward as a "backlog vacancy." India has accumulated large backlogs over decades. Which means the reserved share on paper and the reserved share actually working in the building are two different numbers. Part 11 has the data. It surprises people on both sides.</li>
</ul>

<h3 class="w-h3">Rule 4: The creamy layer — the filter most people forget exists</h3>
<p>OBC reservation does not go to all OBCs. Families above an income and status line are excluded from it entirely. This filter is called the <strong>creamy layer</strong> — the cream that has risen to the top of the milk, and is therefore taken off it.</p>
<p>So an OBC family earning above the line gets no OBC benefit at all. The certificate does not help them. They compete in the open pool like anyone else.</p>

<div class="w-box w-box--fact">
<span class="w-box-label">FACT</span>
<span class="w-box-title">The OBC creamy layer line is ₹8 lakh a year — and has not moved since 2017.</span>
<p>The limit was raised from ₹6 lakh to ₹8 lakh by an order of the Department of Personnel and Training dated 13 September 2017. As of 2026 no further revision has been notified, despite repeated demands from state governments and the National Commission for Backward Classes to raise it to ₹12 or ₹15 lakh for inflation. Children of senior government officers and certain professional and constitutional post-holders are excluded regardless of income.</p>
</div>

<p>And the EWS quota has its own filter: family income below ₹8 lakh a year, plus limits on agricultural land, residential flat size and plot size.</p>
<p>Notice that both filters use the same number.</p>

<div class="w-box w-box--interp">
<span class="w-box-label">INTERPRETATION</span>
<span class="w-box-title">The same ₹8 lakh number, read two opposite ways.</span>
<p><strong>Reading one:</strong> ₹8 lakh a year puts a household in roughly the top few per cent of Indian incomes. Calling such a family "economically weaker" is absurd, and it shows EWS was designed to be wide enough to cover almost every general-category family that wanted it.</p>
<p><strong>Reading two:</strong> the identical ₹8 lakh line applies to the OBC creamy layer. If ₹8 lakh is too generous for EWS, it is equally too generous for OBC — and the side that attacks one number while defending the other is not arguing about the number.</p>
<p>This is a good example of a fact that embarrasses whoever picked it up first.</p>
</div>

<div class="w-box w-box--key">
<span class="w-box-label">SUMMARY OF THE MACHINE</span>
<p>Reserved toppers move into the general list, which frees reserved seats rather than consuming open ones. Qualifying floors are not admission scores, and the two are hundreds of marks apart. Percentages are delivered through a roster, so any single small round can look like anything. And large filters — creamy layer, income tests, property tests — sit on top of all of it.</p>
<p>Almost none of this is understood by the people arguing hardest. You now understand all four. That alone puts you ahead of most of the accounts you will read this week.</p>
</div>

<h2 class="w-h2" id="rf1-6-six-things-the-remove-it-side-gets-wrong"><span class="w-num">6</span>Six Things The "Remove It" Side Gets Wrong</h2>
<p class="w-lead">Stated fairly, then tested. The next chapter does exactly the same to the other side. Read both or neither.</p>

<p>A note on how to read these two chapters. Each claim is written the way its supporters actually make it, not a weakened version. Then it is tested against the rules you have just learned. Then it gets a verdict, and the verdict says plainly how much of the claim survives — because almost none of them are simply true or simply false.</p>

<div class="w-myth"><div class="w-myth-head"><span class="w-myth-tag">Claim 1</span><span class="w-myth-title">"Almost everything is reserved. General category is left with scraps."</span></div><div class="w-myth-body">
<p>The central figure is 59.5% reserved and 40.5% unreserved. But "unreserved" does not mean "reserved for general category" — it means open to <em>everyone</em>, including SC, ST, OBC and EWS candidates who make the mark. There is no such thing as a general-only seat in Indian law.</p>
<p>The bigger error is adding horizontal quotas — disability, ex-servicemen, women — on top of the vertical ones to reach frightening totals like 80% or 90%. As Chapter 4 showed with the 1,000 posts, horizontal quotas are carved out of the existing columns. They add nothing to the total.</p>
<p><strong>VERDICT:</strong> The arithmetic is wrong. The underlying frustration about seat scarcity is not — but the cause is the number of seats, not the split.</p>
</div></div>

<div class="w-myth"><div class="w-myth-head"><span class="w-myth-tag">Claim 2</span><span class="w-myth-title">"Reserved candidates with much lower marks are taking general seats."</span></div><div class="w-myth-body">
<p>By rule this is backwards. A reserved candidate who clears the general bar is moved into the general list and vacates their reserved seat — the "own merit" rule, restated by the Supreme Court in 2026. Nobody enters a general seat below the general bar, because clearing that bar is the definition of the seat.</p>
<p>And the real gaps are smaller than the folklore. General and OBC closed two marks apart for all-India government MBBS seats in 2025.</p>
<p><strong>VERDICT:</strong> False as stated. The SC/ST gap is real and worth arguing about honestly — but it is a different argument from this one.</p>
</div></div>

<div class="w-myth"><div class="w-myth-head"><span class="w-myth-tag">Claim 3</span><span class="w-myth-title">"Ambedkar said reservation was only for ten years."</span></div><div class="w-myth-body">
<p>This is the most repeated line in the entire debate, and it comes from a genuine misreading of the Constitution.</p>
<p>Article 334 did put a ten-year clock on one specific thing: reserved <em>seats in the Lok Sabha and state legislatures</em> — political seats, the ones people are elected to. That clock has been extended by Parliament roughly every decade since.</p>
<p>Articles 15(4) and 16(4), which enable reservation in education and government jobs, carry no expiry date at all. They never did. So the ten-year clock was real — it was simply attached to something else.</p>
<p><strong>VERDICT:</strong> A real constitutional provision, applied to the wrong subject. Part 8 goes through the Constituent Assembly record line by line.</p>
</div></div>

<div class="w-myth"><div class="w-myth-head"><span class="w-myth-tag">Claim 4</span><span class="w-myth-title">"Remove reservation and casteism will disappear."</span></div><div class="w-myth-body">
<p>This is RHA's central promise: "Remove Reservation. Remove Casteism."</p>
<p>The problem is chronology — the order in which things happened. Caste is at minimum many centuries old; caste-based reservation in independent India dates from 1950. Whatever caused the first cannot have been the second. Removing a 76-year-old policy cannot remove a phenomenon that predates it by a very long way.</p>
<p>A narrower version of the claim survives and deserves respect: state-issued caste certificates keep caste administratively alive and give people a reason to hold on to the identity. That is arguable, and it is argued properly in Part 12.</p>
<p><strong>VERDICT:</strong> The strong version fails on chronology. The narrow version is a serious argument and gets a full hearing later.</p>
</div></div>

<div class="w-myth"><div class="w-myth-head"><span class="w-myth-tag">Claim 5</span><span class="w-myth-title">"Reservation gives us unqualified doctors and engineers."</span></div><div class="w-myth-body">
<p>Everyone sits the same exam, clears a qualifying floor, passes the same university examinations, and — for doctors — obtains the same registration. Reservation affects entry, not graduation and not licensing. There is no reserved-category version of a medical degree.</p>
<p>The honest version of the concern is about entry-score gaps and whether they persist to the end of the course. That is a measurable question with actual published evidence, and Part 11 puts the numbers on the table. Some of it will not please the side making this claim; some of it will not please the other side either.</p>
<p><strong>VERDICT:</strong> As stated, unsupported. As a question about outcomes, legitimate — and answerable with data rather than adjectives.</p>
</div></div>

<div class="w-myth"><div class="w-myth-head"><span class="w-myth-tag">Claim 6</span><span class="w-myth-title">"Reservation is why I don't have a job."</span></div><div class="w-myth-body">
<p>This is the most emotionally powerful claim and the one I have the most sympathy for, because the underlying pain is completely real.</p>
<p>But look at the scale. Government employment is a small fraction of India's total workforce and it has been shrinking for years, while lakhs of posts sit vacant. When 25 lakh people apply for a few thousand posts, the binding constraint is that there are a few thousand posts. Redistributing them differently changes <em>who</em> is unemployed. It does not change <em>how many</em>.</p>
<p><strong>VERDICT:</strong> Misdirected. The anger is justified; the address on the envelope is wrong. Part 13 argues that this may be the single most important fact in the entire debate.</p>
</div></div>

<h2 class="w-h2" id="rf1-7-six-things-the-keep-it-side-gets-wrong"><span class="w-num">7</span>Six Things The "Keep It" Side Gets Wrong</h2>
<p class="w-lead">Same treatment. Same standard. If the last chapter felt fair to you, this one is going to sting — and that is how you know the last one was honest.</p>

<div class="w-myth"><div class="w-myth-head"><span class="w-myth-tag">Claim 1</span><span class="w-myth-title">"Reservation is a programme for poor people."</span></div><div class="w-myth-body">
<p>It is not, and defenders who say this are handing away their own best argument.</p>
<p>Reservation was designed as a <em>representation</em> measure — to break a monopoly on public power held by a small number of communities. Poverty relief is what scholarships, subsidies and welfare schemes are for.</p>
<p>Why the mistake is costly: once you accept "it is for the poor," you have already conceded that income is the right test, which is exactly the opposition's position. Then the only remaining question is why caste appears in it at all — and you have no answer left.</p>
<p><strong>VERDICT:</strong> Wrong on its own terms, and strategically self-defeating.</p>
</div></div>

<div class="w-myth"><div class="w-myth-head"><span class="w-myth-tag">Claim 2</span><span class="w-myth-title">"Nothing has changed since 1950."</span></div><div class="w-myth-body">
<p>A great deal has changed and it is measurable — in literacy, in urban occupations, in political representation, in inter-caste contact, in who now sits in offices that were once completely closed.</p>
<p>Insisting nothing has changed does two bad things at once. It erases the achievement of the people who actually fought and won these gains. And it makes the argument unfalsifiable — meaning no evidence could ever count against it. If no amount of progress ever counts, the policy can never be reviewed, and a policy that can never be reviewed will eventually lose public consent.</p>
<p><strong>VERDICT:</strong> Overstated. The defensible claim is that change has been real but deeply uneven — which is both true and much stronger.</p>
</div></div>

<div class="w-myth"><div class="w-myth-head"><span class="w-myth-tag">Claim 3</span><span class="w-myth-title">"Anyone who questions reservation is casteist."</span></div><div class="w-myth-body">
<p>Some opponents of reservation are casteist. When a movement's own prominent voices post about "Brahmin genes," or dismiss documented historical atrocities as invented propaganda, that is not a debating position and it should be named.</p>
<p>But a 22-year-old who has failed an exam three times and is angry is not automatically a bigot. Treating every such person as an enemy is how you lose an argument you could have won — and it hands the other side its most effective recruitment line: "they will not even talk to you."</p>
<p><strong>VERDICT:</strong> True of some opponents, false as a general rule, and self-harming as a debating tactic.</p>
</div></div>

<div class="w-myth"><div class="w-myth-head"><span class="w-myth-tag">Claim 4</span><span class="w-myth-title">"Elite capture inside reserved categories is a right-wing invention."</span></div><div class="w-myth-body">
<p>"Elite capture" means the better-off members of a group taking most of a benefit meant for the whole group. The Supreme Court of India has now accepted that it happens here.</p>
<p>In 2024, a seven-judge bench ruled 6–1 that states may sub-classify Scheduled Castes precisely because the benefits had been captured unevenly — some SC sub-castes had advanced substantially while others had barely moved.</p>
<p>That verdict is, in effect, the highest court in the country accepting that elite capture within reserved categories is real. You cannot cite the Court when it suits you and call the same finding propaganda when it does not.</p>
<p><strong>VERDICT:</strong> Contradicted by a 2024 Constitution Bench ruling. This is now a fact to be managed, not a claim to be denied.</p>
</div></div>

<div class="w-myth"><div class="w-myth-head"><span class="w-myth-tag">Claim 5</span><span class="w-myth-title">"All the reserved seats are being filled anyway."</span></div><div class="w-myth-body">
<p>They are not. Backlog vacancies in reserved posts have accumulated for decades — that is Rule 3 from the last chapter, showing up in the real world. Reserved faculty positions in central universities and premier institutes have been notoriously under-filled. And more than 13,500 SC, ST and OBC students dropped out of central universities, IITs and IIMs according to data reported in 2023.</p>
<p>Here is the thing though: this fact is bad for the other side too. If reserved seats sit empty, then the seats are not being taken away from anybody — and the "they took my seat" story loses its object.</p>
<p><strong>VERDICT:</strong> False — and inconvenient for everyone. One of the most useful facts in this book.</p>
</div></div>

<div class="w-myth"><div class="w-myth-head"><span class="w-myth-tag">Claim 6</span><span class="w-myth-title">"General category means privileged."</span></div><div class="w-myth-body">
<p>"General" is not a class. As Chapter 2 said, it is everything left over after four lists. It contains genuinely wealthy families and it contains families in serious poverty — landless Brahmin priests, small Bania shopkeepers ruined by a bad year, Rajput families with a name and no money.</p>
<p>The strongest evidence that these families exist is that Parliament created a 10% EWS quota specifically for them in 2019, and the Supreme Court upheld it.</p>
<p>The serious reply — and it is serious — is that being poor is not the same as being excluded, and reservation was built to address exclusion. That is a real argument. But it has to be made, not assumed.</p>
<p><strong>VERDICT:</strong> The label is being used as if it means something it does not. Poverty and exclusion overlap; they are not identical; and the difference is the whole debate.</p>
</div></div>

<div class="w-box w-box--key">
<span class="w-box-label">A NOTE ON THESE TWO CHAPTERS</span>
<p>If exactly one of the last two chapters made you angry, that is worth sitting with for a minute. Both were written to the same standard, with the same tone, using the same kind of evidence.</p>
</div>

<h2 class="w-h2" id="rf1-8-ninety-seconds-of-history"><span class="w-num">8</span>Ninety Seconds of History</h2>
<p class="w-lead">The whole story on one timeline. Every line here becomes a full chapter later in the series.</p>

<p>You do not need to memorise this. Read it once so that when a date comes up later you have somewhere to put it.</p>

<div class="w-timeline">
<div class="w-tl-item"><div class="w-tl-year">1902</div><div class="w-tl-text"><strong>It starts in an Indian princely state, not in Delhi</strong>Shahu Maharaj of Kolhapur reserves 50% of posts in his administration for backward communities. This is among the earliest formal reservation policies anywhere in the world — and it is Indian, not colonial.</div></div>
<div class="w-tl-item"><div class="w-tl-year">1921</div><div class="w-tl-text"><strong>Madras Communal Government Order</strong>The Madras Presidency introduces communal proportions in government appointments. Reservation as an administrative system begins in British India.</div></div>
<div class="w-tl-item"><div class="w-tl-year">1932</div><div class="w-tl-text"><strong>The Poona Pact</strong>Ambedkar had won separate electorates for the Depressed Classes. Gandhi began a fast unto death against it. The resulting compromise replaced separate electorates with reserved seats in joint electorates. Everything about modern reservation flows from this deal. Part 5 and Part 7 cover it in full.</div></div>
<div class="w-tl-item"><div class="w-tl-year">1950</div><div class="w-tl-text"><strong>The Constitution</strong>Articles 15 and 16 permit special provision for backward classes; Article 46 directs the state to promote their interests; Articles 330 and 332 reserve legislative seats; Article 334 puts a ten-year clock on those seats only.</div></div>
<div class="w-tl-item"><div class="w-tl-year">1953</div><div class="w-tl-text"><strong>The first backward classes commission — and the shelf</strong>The Kaka Kalelkar Commission reports. Its own chairman ends up doubting caste as the criterion. The report is shelved.</div></div>
<div class="w-tl-item"><div class="w-tl-year">1980</div><div class="w-tl-text"><strong>The Mandal Commission reports</strong>It identifies a very large set of Other Backward Classes and recommends 27% reservation. It is then shelved for a decade.</div></div>
<div class="w-tl-item"><div class="w-tl-year">1990</div><div class="w-tl-text"><strong>India burns</strong>Prime Minister V. P. Singh announces implementation of Mandal. Nationwide protests follow, including self-immolations. The political map of north India is permanently redrawn.</div></div>
<div class="w-tl-item"><div class="w-tl-year">1992</div><div class="w-tl-text"><strong>Indra Sawhney</strong>A nine-judge Supreme Court bench upholds 27% OBC reservation, caps total reservation at 50%, and introduces the creamy layer.</div></div>
<div class="w-tl-item"><div class="w-tl-year">2006–08</div><div class="w-tl-text"><strong>OBC quota reaches central universities</strong>27% OBC reservation is extended to central educational institutions, triggering another round of student protests, and is upheld by the Supreme Court in 2008.</div></div>
<div class="w-tl-item"><div class="w-tl-year">2019</div><div class="w-tl-text"><strong>EWS — the ceiling breaks</strong>The 103rd Amendment adds a 10% quota based on economic criteria, taking the central total to 59.5%.</div></div>
<div class="w-tl-item"><div class="w-tl-year">2022</div><div class="w-tl-text"><strong>EWS upheld 3–2</strong>In <em>Janhit Abhiyan</em>, the Supreme Court lets it stand by a single vote.</div></div>
<div class="w-tl-item"><div class="w-tl-year">2024</div><div class="w-tl-text"><strong>Sub-classification allowed</strong><em>State of Punjab v. Davinder Singh</em>, 6–1: states may split the SC quota to protect the most deprived sub-castes within it.</div></div>
<div class="w-tl-item"><div class="w-tl-year">2026</div><div class="w-tl-text"><strong>India starts counting caste again</strong>Census 2027 field work begins in April 2026, with full caste enumeration for the first time since 1931. The Supreme Court declines petitions against it, holding it to be a policy matter. Meanwhile, on the street and on the phone, the argument explodes.</div></div>
</div>

<h2 class="w-h2" id="rf1-9-what-actually-happened-in-2026"><span class="w-num">9</span>What Actually Happened in 2026</h2>
<p class="w-lead">Cockroaches, a leaked paper, a resignation, and an explosion. Seventy-four days, in order.</p>

<p>To understand why the reservation argument detonated in the last week of July 2026, you have to understand what came immediately before it — because the second movement was built directly on the wreckage of the first one's victory.</p>

<div class="w-timeline">
<div class="w-tl-item"><div class="w-tl-year">16 May</div><div class="w-tl-text"><strong>An insult becomes a movement</strong>The Chief Justice of India is reported to have compared unemployed young Indians to "cockroaches" and "parasites of society." Abhijeet Dipke founds the Cockroach Janta Party — taking the insult and wearing it. Satire, at first.</div></div>
<div class="w-tl-item"><div class="w-tl-year">June</div><div class="w-tl-text"><strong>The satire turns into a mass movement</strong>The focus shifts to examination paper leaks, especially NEET, and to students who died by suicide after cancellations and re-tests. Protests spread across cities.</div></div>
<div class="w-tl-item"><div class="w-tl-year">July</div><div class="w-tl-text"><strong>Jantar Mantar</strong>Delhi's designated protest ground fills. Marches in Pune and elsewhere. Crowd-control weapons are used. Al Jazeera describes the demonstrations as the biggest challenge to the Prime Minister since 2014. CJP names three demands: the Education Minister's resignation, no criminal cases against protesters, and compensation for the families of students who died.</div></div>
<div class="w-tl-item"><div class="w-tl-year">22 July</div><div class="w-tl-text"><strong>An account is created</strong>@reservationhataomovement appears on Instagram, built around the viral clip of NEET aspirant Harsh Dubey confronting an NDTV anchor about reservation.</div></div>
<div class="w-tl-item"><div class="w-tl-year">24 July</div><div class="w-tl-text"><strong>The government sits down with the cockroaches</strong>CJP leaders hold talks with ministers.</div></div>
<div class="w-tl-item"><div class="w-tl-year">25 July</div><div class="w-tl-text"><strong>The minister goes</strong>Union Education Minister Dharmendra Pradhan resigns. Dipke announces it to thousands at Jantar Mantar. CJP says its demands have been accepted and asks protesters to go home. A street movement has just forced out a Union minister.</div></div>
<div class="w-tl-item"><div class="w-tl-year">26–27 July</div><div class="w-tl-text"><strong>The second wave</strong>RHA declares its first "protest" — not a march, but an instruction to flood comment sections. On 27 July it posts four demands: Merit over Caste, Equal Fees, Equal Age Limit, Equal Cut-off. Counter-campaigns from anti-caste creators begin the same day.</div></div>
<div class="w-tl-item"><div class="w-tl-year">28–29 July</div><div class="w-tl-text"><strong>Five point eight million</strong>Outlook reports 5.6 million followers on 28 July; The Quint reports 5.8 million on 29 July. A third campaign, the E20 Janata Party, copies the same playbook for fuel policy. The template is now public property.</div></div>
</div>

<div class="w-box w-box--interp">
<span class="w-box-label">INTERPRETATION</span>
<span class="w-box-title">Read that sequence again, because it is the most important thing in this chapter.</span>
<p>A movement about leaked exam papers — an administrative failure by the state's own examination machinery — won. The minister resigned. And within twenty-four hours of that victory, the energy transferred to a movement about reservation.</p>
<p><strong>Reading one:</strong> natural progression. Students who fought about one unfairness in the exam system turned to what they see as the bigger unfairness in it. The first win proved that online pressure works.</p>
<p><strong>Reading two:</strong> a redirection, whether deliberate or accidental. On 24 July the conflict was students versus the state. By 27 July it was students versus other students. The examination agency, the leaks, the vacant posts and the shortage of seats vanish from the conversation entirely. If you were responsible for the exam system, you could not have designed a better outcome.</p>
<p>I do not think anyone needs to have planned reading two for it to be what happened. Anger looks for a target, and a target that is standing next to you is easier to reach than one in a ministry.</p>
</div>

<h2 class="w-h2" id="rf1-10-what-rha-actually-wants"><span class="w-num">10</span>What RHA Actually Wants</h2>
<p class="w-lead">Their demands, in their words — then their case put at its strongest, the way their best advocate would put it.</p>

<p>Before criticising a position it is worth stating it accurately. Here is what the Reservation Hatao Andolan has actually published.</p>

<h3 class="w-h3">The four demands</h3>
<figure class="w-figure">
<figcaption class="w-table-caption">Posted by RHA, 27 July 2026</figcaption>
<div class="w-table-scroll">
<table class="w-table">
<thead><tr><th>Demand</th><th>What it means in practice</th></tr></thead>
<tbody>
<tr><td class="w-hi">Merit over Caste</td><td>Selection to public education and public employment on examination performance alone, with no caste category</td></tr>
<tr><td class="w-hi">Equal Fees</td><td>An end to category-based fee concessions in public institutions</td></tr>
<tr><td class="w-hi">Equal Age Limit</td><td>An end to category-based upper age relaxations in competitive examinations</td></tr>
<tr><td class="w-hi">Equal Cut-off</td><td>One qualifying and admission standard for all candidates</td></tr>
</tbody>
</table>
</div>
</figure>

<p class="w-tnote">Two of those four are about things this book has not covered yet. <strong>Fee concessions</strong> mean reserved-category students pay lower fees at some public institutions. <strong>Age relaxation</strong> means the upper age limit for sitting a government exam is a few years higher for some categories, so they get more attempts. Both are real, both are separate from the seat quota, and both are argued properly in Part 12.</p>

<h3 class="w-h3">The bigger proposal</h3>
<p>Beyond the four demands, RHA has published a broader policy titled "Remove Reservation. Remove Casteism." Its long-term goal is stated as "One Nation. One Identity. Indian."</p>
<p>The proposal argues that if the aim is to end caste discrimination, the state should stop requiring or recording caste at all — no caste column on government forms, admissions or job applications — and has called for the public "showcasing" of caste to be made illegal.</p>
<p>The campaign describes itself as an unorganised, youth-led coalition with no political affiliation, stating that it had hoped a change of government would reform education and that this did not happen: "Our focus is on the policy, not the party."</p>
<p>Its slogan on X is "Educate — Agitate — Organize," alongside the Hindi line "Sari jaati ek samaan, mera bas yeh desh mahaan."</p>

<div class="w-box w-box--fact">
<span class="w-box-label">FACT</span>
<span class="w-box-title">"Educate, Agitate, Organise" is Dr B. R. Ambedkar's slogan.</span>
<p>It is one of the most famous lines in Indian anti-caste history, and Ambedkar is the principal architect of the constitutional provisions that make reservation possible. A campaign to abolish reservation has adopted the slogan of the man who built it. Critics have called this a deliberate co-option; supporters say the words belong to all Indians. Either way, the fact is not in dispute.</p>
</div>

<h3 class="w-h3">Who is driving it</h3>
<p>Two figures have been prominent in RHA's content: Ajeet Bharti, a right-leaning political commentator, and Anuradha Tiwari, who drew wide attention in 2024 for posting a photograph captioned "Brahmin genes."</p>
<p>In RHA videos, Bharti argues that caste quotas create a "creamy layer trap" and that state resources should be redirected into primary public education instead. He has also dismissed historical caste atrocities as "propaganda pushed by leftist historians to induce guilt."</p>

<div class="w-box w-box--claim">
<span class="w-box-label">CONTESTED CLAIM</span>
<span class="w-box-title">"Historical caste atrocities are propaganda invented by leftist historians."</span>
<p>This is the single biggest factual claim being made anywhere in this argument, because if it is true, almost everything else collapses — and if it is false, the movement's foundations shift.</p>
<p>It is also exactly the question you asked me to investigate, and it is too important to answer in a paragraph. Part 6 of this series is devoted entirely to it — court records, land records, temple records, colonial documents, missionary accounts, travellers' accounts, modern survey measurement, and the strongest version of the "it is exaggerated" case, all in one place. No summary here. Just the evidence, later, in full.</p>
</div>

<div class="w-box w-box--answer">
<span class="w-box-label">STEELMAN — THE STRONGEST VERSION OF RHA'S CASE</span>
<span class="w-box-title">Written as their best advocate would write it, not as their worst commenter does.</span>
<p>A policy adopted as a temporary corrective has now run for three generations, and no government has ever specified what success would look like or when it would end. A remedy without an exit condition is not a remedy; it is a permanent structure.</p>
<p>Worse, that structure gives every Indian family a standing financial reason to prove and preserve its caste. We ask people to register caste at birth, declare it at school, prove it at admission, carry it into employment — and then express surprise that caste has not faded. A state that keeps caste on file cannot credibly ask citizens to forget it.</p>
<p>Meanwhile the benefit has concentrated. The Supreme Court itself found in 2024 that some sub-castes captured the gains while others got nothing — which is why sub-classification became necessary. The child of an IAS officer and the child of a landless labourer can hold the same certificate.</p>
<p>And the cost lands on people who did nothing. A poor general-category student in Bihar inherits no land, no capital and no coaching money, only a surname — and pays for a history he did not write.</p>
<p>India already runs a caste-blind quota. EWS has existed since 2019 and the Court upheld it. So the question is not whether a caste-free system is imaginable. It is: why not extend the one we already have?</p>
</div>

<h2 class="w-h2" id="rf1-11-what-the-critics-actually-say"><span class="w-num">11</span>What The Critics Actually Say</h2>
<p class="w-lead">Same treatment. Their objections, then their case at full strength.</p>

<p>The backlash to RHA came from sociologists, educators, anti-caste scholars, student organisers and a very large number of digital creators. Their objections cluster into four arguments.</p>

<h4 class="w-h4">1. It confuses representation with poverty</h4>
<p>Reservation was not built as an anti-poverty scheme. It was built to break a monopoly on public power. Replacing it with an income test answers a question nobody was asking, and abandons the one it was designed for. As critics put it: reservation exists to remedy centuries of denial of education, land, resources and dignity — not to top up a bank balance.</p>

<h4 class="w-h4">2. It reverses the order of operations</h4>
<p>One widely shared post put it as sharply as it can be put: what came first must go first. Caste came first; reservation came in response. Removing the response while leaving the cause in place does not produce equality — it produces the pre-1950 arrangement with better branding.</p>

<h4 class="w-h4">3. It uses Ambedkar's words against Ambedkar's work</h4>
<p>The adoption of "Educate, Agitate, Organise" by a campaign to dismantle constitutional safeguards has been called a cynical use of anti-caste vocabulary against anti-caste protections.</p>

<h4 class="w-h4">4. The evidence that caste still bites is sitting in the same comment sections</h4>
<p>During the same week, a post told Abhijeet Dipke — the man who had just forced a Union minister to resign — to "go back to US and clean toilets," a remark widely read as targeting his Dalit identity.</p>

<div class="w-box w-box--fact">
<span class="w-box-label">FACT</span>
<span class="w-box-title">That exchange is a data point, not just an insult.</span>
<p>Dipke had, by any measure, achieved extraordinary success and mobility. The abuse still reached for caste. Critics used this as evidence for a specific claim: that class mobility does not switch caste discrimination off — which is precisely the claim an income-based replacement depends on being false.</p>
</div>

<h4 class="w-h4">And the inconvenient numbers</h4>
<p>More than 13,500 SC, ST and OBC students dropped out of central universities, IITs and IIMs, according to data reported in 2023. Critics use this to argue that getting in is not the same as being let in — that the system delivers admission without delivering belonging.</p>

<div class="w-box w-box--answer">
<span class="w-box-label">STEELMAN — THE STRONGEST VERSION OF THE CRITICS' CASE</span>
<span class="w-box-title">Written as their best advocate would write it.</span>
<p>Start with what reservation is for. It is not charity and it is not welfare. It is a structural correction to a specific historical fact: for a very long time, a small set of communities held nearly all public authority, and others were excluded by force, law and custom from literacy itself. Wealth transfers do not fix a monopoly on institutions. Presence does.</p>
<p>Now test the replacement. An income-only system assumes money is the barrier. But money does not stop a landlord from blocking a well, a classmate from refusing to share a room, a landlord from refusing a flat, or a comment section from telling a successful Dalit man to go clean toilets. Caste is not a bank balance. It is a door that opens for some names and not others.</p>
<p>Then look at delivery. If reservation were the vast handout it is described as, reserved posts would not sit vacant for decades and thousands of SC, ST and OBC students would not be dropping out of the very institutions they fought into. A system that under-delivers is not evidence that the need has ended.</p>
<p>Finally, look at the timing. This movement did not appear when caste violence made the news. It appeared in the week a general-category exam grievance found a microphone. The demand is not "end caste." Not one viral post asked for that. The demand is "end the remedy" — and a movement that wants the cure gone but is silent about the disease has told you what it is actually about.</p>
</div>

<h2 class="w-h2" id="rf1-12-the-five-real-questions"><span class="w-num">12</span>The Five Real Questions</h2>
<p class="w-lead">Strip away the shouting and this entire argument reduces to five questions. Everything else is decoration.</p>

<p>Almost nobody online is arguing about these. They are arguing about cut-offs and slogans. But every serious position on reservation is really an answer to these five, and the rest of this series is the work of answering them properly.</p>

<div class="w-box w-box--aim">
<span class="w-box-label">QUESTION ONE</span>
<span class="w-box-title">Was the injury real, and how bad was it?</span>
<p>If caste discrimination was systematic, violent and enforced for centuries, one set of conclusions follows. If it was mild, occasional, or largely invented later, a completely different set follows. This is a question of evidence, not opinion — and it has an answer.</p>
<p class="w-srcline">→ Parts 2, 3, 4, 5 and 6</p>
</div>

<div class="w-box w-box--aim">
<span class="w-box-label">QUESTION TWO</span>
<span class="w-box-title">Is the injury still happening today?</span>
<p>Even if the history is as bad as claimed, a remedy is justified by present conditions, not past ones. So: in 2026, does your caste still change your life outcomes after you account for income and education? This is measurable.</p>
<p class="w-srcline">→ Parts 6 and 11</p>
</div>

<div class="w-box w-box--aim">
<span class="w-box-label">QUESTION THREE</span>
<span class="w-box-title">Does this particular medicine actually work?</span>
<p>A real disease does not prove that a specific treatment cures it. Has reservation delivered what it promised? For whom? At what cost? And where has it failed?</p>
<p class="w-srcline">→ Part 11</p>
</div>

<div class="w-box w-box--aim">
<span class="w-box-label">QUESTION FOUR</span>
<span class="w-box-title">Is there something better?</span>
<p>"This is imperfect" is not an argument unless you can name a superior alternative and show what happened when it was tried. Income-based? Sub-classified? Time-limited? Nothing at all? Other countries have run these experiments and the results are on the record.</p>
<p class="w-srcline">→ Parts 12 and 13</p>
</div>

<div class="w-box w-box--aim">
<span class="w-box-label">QUESTION FIVE</span>
<span class="w-box-title">Who decides when it ends — and by what test?</span>
<p>This is the question neither side wants. The abolition side rarely specifies what evidence would make them keep it. The retention side rarely specifies what evidence would make them stop. A policy with no stated finish line and no stated failure condition is not a policy. It is a permanent political settlement pretending to be one.</p>
<p class="w-srcline">→ Part 14</p>
</div>

<div class="w-pullquote">Ask anyone shouting about reservation which of these five they are actually answering. Most cannot say. That is the whole problem.</div>

<h2 class="w-h2" id="rf1-13-the-five-line-nichod"><span class="w-num">13</span>The Five-Line Nichod</h2>
<p class="w-lead">Everything in this book, compressed. If you remember nothing else, remember these.</p>

<p class="w-tnote"><em>Nichod</em> is Hindi for the squeeze — what is left when you wring everything else out.</p>

<div class="w-takeaways">
<h3>PART 1 — GROUND ZERO</h3>
<ol>
<li><strong>Reservation is a share of government seats, not a gift</strong> — 59.5% reserved at the centre, 40.5% open to everyone including reserved candidates, and none of it touches the private sector where almost all Indian jobs actually are.</li>
<li><strong>A reserved candidate who clears the general bar is counted in the general list, not the reserved one</strong> — settled law, restated by the Supreme Court in 2026. In 2025 the General and OBC all-India government MBBS seats closed two marks apart.</li>
<li><strong>A qualifying cut-off is not an admission cut-off, and a percentile is not a percentage.</strong> The OBC qualifying floor in NEET 2025 was 113 marks; the score that actually took a government MBBS seat was 658. Most of the loudest claims online are these numbers wearing each other's clothes.</li>
<li><strong>Both sides are running on bad numbers.</strong> One side inflates the reserved total by adding horizontal quotas that do not add. The other denies elite capture that the Supreme Court itself accepted in 2024.</li>
<li><strong>The real fight is five questions deep</strong> — was the injury real, is it still happening, does the medicine work, is there something better, and who decides when it ends. Nobody wins this argument on Instagram. It is won in Parts 2 to 14.</li>
</ol>
</div>

<h3 class="w-h3">Coming next</h3>

<div class="w-box w-box--key">
<span class="w-box-label">PART 2 — BEFORE CASTE</span>
<span class="w-box-title">Was India always like this?</span>
<p>We go back further than any WhatsApp forward goes. The Indus Valley. The oldest layer of the Rig Veda. The Purusha Sukta — the four-varna hymn — printed in full, translated, and then read line by line the way each side reads it. The Aryan question and what the genetics does and does not settle. And the argument at the centre of everything: was varna originally a description of work that later hardened, or a system of birth from the start?</p>
<p>Both cases. At full strength. No thumb on the scale.</p>
</div>

<p class="w-small">A closing thought before Part 2. Reading this book will not make you neutral, and it is not supposed to. It should make you <em>harder to fool</em> — including by people who agree with you. That is a lower bar than wisdom and a much more useful one. — L.S.</p>
`;

/* Everything the reader needs is derived from the prose above, so the
   contents list, the word count and the reading time can never drift from
   what is actually on the page. */
const toc = [...HTML.matchAll(/<h2 class="w-h2" id="([^"]+)"><span class="w-num">(\d+)<\/span>([^<]+)<\/h2>/g)]
  .map(([, id, num, text]) => ({ id, num, text }));

export default function webPartOne(generated) {
  const prologue = generated.prologue + PROLOGUE_NOTE;
  const words = strip(`${prologue} ${HTML}`).split(/\s+/).filter(Boolean).length;

  return {
    ...generated,
    words,
    minutes: Math.max(1, Math.round(words / WORDS_PER_MINUTE)),
    toc,
    prologue,
    html: HTML,
  };
}
