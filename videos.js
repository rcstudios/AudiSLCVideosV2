/*
  Audi Showcase TV — video catalog
  --------------------------------
  Audi MediaTV entries need durationSeconds because Audi's public embed does not
  expose a documented end-of-video callback. YouTube entries advance using the
  official YouTube IFrame API ENDED event.

  To add a new Audi MediaTV video:
  { number: 35, title: "Title", type: "audi", id: "1234", durationSeconds: 60, source: "Audi Media Center" }

  To add a YouTube video:
  { number: 36, title: "Title", type: "youtube", id: "VIDEO_ID", source: "Audi USA" }
*/

window.AUDI_SHOWCASE_VIDEOS = [
  { number: 1,  title: "Audi Q7 SUV – Trailer (on location)", type: "audi", id: "8422", durationSeconds: 42,  source: "Audi Media Center" },
  { number: 2,  title: "Ski Jump", type: "audi", id: "2371", durationSeconds: 66,  source: "Audi Media Center" },
  { number: 3,  title: "GP Ice Race", type: "audi", id: "4465", durationSeconds: 66,  source: "Audi Media Center" },
  { number: 4,  title: "A new era in the DTM: The turbo is back", type: "audi", id: "4443", durationSeconds: 146, source: "Audi Media Center" },
  { number: 5,  title: "Audi RS 4 Avant (until 2024) – Footage", type: "audi", id: "4839", durationSeconds: 613, source: "Audi Media Center" },
  { number: 6,  title: "Audi RS 5 Avant, Audi RS 5 Sedan – Trailer (dynamic)", type: "audi", id: "8141", durationSeconds: 39, source: "Audi Media Center" },
  { number: 7,  title: "Audi RS 5 Sedan Bedford green – Footage (on location)", type: "audi", id: "8301", durationSeconds: 176, source: "Audi Media Center" },
  { number: 8,  title: "Audi RS 5 – Integrated brake control system with ABS 2.0 – Animation", type: "audi", id: "8115", durationSeconds: 119, source: "Audi Media Center" },
  { number: 9,  title: "Audi A6 e-tron Family – Trailer (Studio)", type: "audi", id: "7504", durationSeconds: 56, source: "Audi Media Center" },
  { number: 10, title: "The Audi S8, the Audi A8 L and the Audi A8 TFSI e on location", type: "audi", id: "5942", durationSeconds: 48, source: "Audi Media Center" },
  { number: 11, title: "24h Nürburgring 2018 – Intermediate result after eight hours of racing", type: "audi", id: "4098", durationSeconds: 73, source: "Audi Media Center" },
  { number: 12, title: "Audi Q3 Family – Trailer (on location)", type: "audi", id: "8045", durationSeconds: 69, source: "Audi Media Center" },
  { number: 13, title: "Audi Q5 Family – Trailer (on location)", type: "audi", id: "7772", durationSeconds: 66, source: "Audi Media Center" },
  { number: 14, title: "Audi Q6 SUV e-tron – Trailer (on location)", type: "audi", id: "7579", durationSeconds: 51, source: "Audi Media Center" },
  { number: 15, title: "Audi RS Q8, RS Q8 performance – Trailer (dynamic)", type: "audi", id: "7577", durationSeconds: 48, source: "Audi Media Center" },
  { number: 16, title: "Audi Q9 SUV – Trailer (dynamic)", type: "audi", id: "8484", durationSeconds: 56, source: "Audi Media Center" },
  { number: 17, title: "Audi R8 green hell – Tribute to the successful R8 LMS", type: "audi", id: "5227", durationSeconds: 57, source: "Audi Media Center" },
  { number: 18, title: "Audi R8 V10 GT RWD – Trailer (until 2024)", type: "audi", id: "6229", durationSeconds: 63, source: "Audi Media Center" },
  { number: 19, title: "Audi quattro story part 3 – The quattro on ice and snow", type: "audi", id: "3031", durationSeconds: 180, source: "Audi Media Center" },
  { number: 20, title: "20 years Audi RS 6 road trip – Trailer", type: "audi", id: "6117", durationSeconds: 58, source: "Audi Media Center" },

  { number: 21, title: "Audi RS 6 Avant: An Avant Story", type: "youtube", id: "PSTIu0u4h90", source: "Audi Hong Kong" },
  { number: 22, title: "Audi R8 V10 Plus: Introduction", type: "youtube", id: "s5VfpM-vSgg", source: "Audi USA" },
  { number: 23, title: "Audi R8: The Last Lap", type: "youtube", id: "3wiuFnTdq8Y", source: "Audi USA" },
  { number: 24, title: "Audi & Ducati #ComeTogether: Pikes Peak", type: "youtube", id: "x_Mk3IwEBiY", source: "Audi USA" },
  { number: 25, title: "Audi Films: Audi Sport - Defined", type: "youtube", id: "HVyAy7A4jOc", source: "Audi USA" },
  { number: 26, title: "Group B - The Golden Era of Rallying", type: "youtube", id: "tiTtgq2Pcow", source: "daveboy25" },
  { number: 27, title: "Audi Sport: A Legacy Story in Five Cylinders", type: "youtube", id: "ICPgFXcFuRU", source: "Audi USA" },
  { number: 28, title: "Audi R8: The Slowest Art We've Ever Built", type: "youtube", id: "4PYXYI6NtfI", source: "Audi USA" },
  { number: 29, title: "Audi Mission to the Moon: Audi Apollo", type: "youtube", id: "rE8-hhI79ik", source: "Audi USA" },
  { number: 30, title: "What does it take for a car to become an Audi?", type: "youtube", id: "Jxn2sdZTLH0", source: "Audi Belgium" },
  { number: 31, title: "2011 Audi A8: Pure Aesthetics", type: "youtube", id: "eMAR5OnG4ro", source: "Audi USA" },
  { number: 32, title: "Audi R: What it Takes", type: "youtube", id: "ltwtYi6ZjuY", source: "Audi USA" },
  { number: 33, title: "The Driven", type: "youtube", id: "9dDS5OJMzBc", source: "Audi USA" },
  { number: 34, title: "Four Things. Four Rings. Sedona in an Audi e-tron SUV", type: "youtube", id: "9DboAwxJmhA", source: "Audi USA" }
];
