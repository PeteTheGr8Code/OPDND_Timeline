// Entry point. Runs after eras-meta.js, all era-N data files,
// render-cards.js, render-timeline.js, and gate.js have loaded
// (see the <script> order at the bottom of index.html).

buildNav();
buildSpine();
wireCards();
loadAllImages();
initGate();
