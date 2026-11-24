document.addEventListener("DOMContentLoaded", () => {
  /* =========================================================
1. MOBILE NAV & CRISIS MODAL
     ========================================================= */
  const menuToggle = document.getElementById("menuToggle");
  const navLinks = document.getElementById("navLinks");

  menuToggle?.addEventListener("click", () => {
    navLinks?.classList.toggle("open");
  });

  navLinks?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => navLinks.classList.remove("open"));
  });

  const crisisModal = document.getElementById("crisisModal");
  const openCrisisButtons = [
    document.getElementById("openCrisisModal"),
    document.getElementById("openCrisisFromClosing"),
  ];
  const closeCrisisButtons = [
    document.getElementById("closeCrisisModal"),
    document.getElementById("closeCrisisBtn"),
  ];

  openCrisisButtons.forEach((btn) =>
    btn?.addEventListener("click", () => crisisModal?.classList.remove("hidden"))
  );

  closeCrisisButtons.forEach((btn) =>
    btn?.addEventListener("click", () => crisisModal?.classList.add("hidden"))
  );

  crisisModal?.addEventListener("click", (e) => {
    if (e.target === crisisModal) crisisModal.classList.add("hidden");
  });

  /* =========================================================
2. ASESMEN 3 MENIT — 10 PERTANYAAN REFLEKTIF + UNDUH PDF
     ========================================================= */
  const assessmentQuestions = [
    // Reaksi Kognitif (4 soal -> max 12)
    { pillar: "kognitif", text: "Pikiran terasa berputar-putar atau sulit berhenti saat sedang beristirahat?" },
    { pillar: "kognitif", text: "Sulit memusatkan perhatian pada pekerjaan, bacaan, atau hal sederhana?" },
    { pillar: "kognitif", text: "Cenderung langsung membayangkan skenario terburuk ketika ada masalah?" },
    { pillar: "kognitif", text: "Merasa terbebani saat harus mengambil keputusan kecil sehari-hari?" },

    // Skala Emosi (3 soal -> max 9)
    { pillar: "emosi", text: "Merasa mudah tegang, cemas, atau gelisah tanpa alasan yang jelas?" },
    { pillar: "emosi", text: "Suasana hati naik-turun dengan cepat dalam beberapa hari terakhir?" },
    { pillar: "emosi", text: "Energi emosional terasa cepat habis atau kehilangan minat pada hal biasa?" },

    // Gaya Coping (3 soal -> max 9)
    { pillar: "coping", text: "Kesulitan memberi jeda istirahat ketika tanggung jawab menumpuk?" },
    { pillar: "coping", text: "Cenderung memendam beban sendirian meski sebenarnya butuh didengarkan?" },
    { pillar: "coping", text: "Rutinitas dasar seperti tidur, makan, atau menenangkan diri terasa berantakan?" },
  ];

  const startAssessmentBtn = document.getElementById("startAssessmentBtn");
  const assessmentPlaceholder = document.getElementById("assessmentPlaceholder");
  const assessmentForm = document.getElementById("assessmentForm");
  const assessmentResult = document.getElementById("assessmentResult");
  const questionCounter = document.getElementById("questionCounter");
  const questionText = document.getElementById("questionText");
  const assessmentProgress = document.getElementById("assessmentProgress");
  const resetAssessmentBtn = document.getElementById("resetAssessmentBtn");
  const retakeAssessmentBtn = document.getElementById("retakeAssessmentBtn");
  const downloadPdfBtn = document.getElementById("downloadPdfBtn");

  let qIndex = 0;
  let scores = { kognitif: 0, emosi: 0, coping: 0 };
  let userAnswersLog = [];
  let latestAssessmentReport = null;

  function renderQuestion() {
    const item = assessmentQuestions[qIndex];
    questionCounter.textContent = `Pertanyaan ${qIndex + 1} dari ${assessmentQuestions.length}`;
    questionText.textContent = item.text;
    assessmentProgress.style.width = `${((qIndex + 1) / assessmentQuestions.length) * 100}%`;
  }

  function showAssessmentResult() {
    assessmentForm.classList.add("hidden");
    assessmentResult.classList.remove("hidden");

    const pctKognitif = Math.round((scores.kognitif / 12) * 100);
    const pctEmosi = Math.round((scores.emosi / 9) * 100);
    const pctCoping = Math.round((scores.coping / 9) * 100);
    const total = scores.kognitif + scores.emosi + scores.coping; // max 30

    const titleEl = document.getElementById("resultTitle");
    const summaryEl = document.getElementById("resultSummary");
    const barsEl = document.getElementById("resultBars");

    let statusTitle = "";
    let statusSummary = "";

    if (total <= 9) {
      statusTitle = "Ritme Relatif Tenang";
      statusSummary =
        "Saat ini kamu tampak cukup mampu menjaga keseimbangan. Pertahankan kebiasaan kecil yang menenangkan dirimu.";
    } else if (total <= 19) {
      statusTitle = "Ada Beban yang Perlu Diperhatikan";
      statusSummary =
        "Beberapa bagian pikiran atau emosimu sedang bekerja lebih keras. Coba beri jeda napas singkat dan luangkan waktu pulih.";
    } else {
      statusTitle = "Kamu Sedang Memikul Banyak Hal";
      statusSummary =
        "Tekanan terasa cukup tinggi akhir-akhir ini. Kamu tidak harus menanggungnya sendirian — pertimbangkan untuk bercerita dengan orang terpercaya atau profesional.";
    }

    titleEl.textContent = statusTitle;
    summaryEl.textContent = statusSummary;

    latestAssessmentReport = {
      date: new Date().toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }),
      statusTitle,
      statusSummary,
      total,
      pctKognitif,
      pctEmosi,
      pctCoping,
      answers: [...userAnswersLog],
    };

    barsEl.innerHTML = `
      <div class="bar-row">
        <label><span>Reaksi Kognitif</span><span>${pctKognitif}%</span></label>
        <div class="bar-track"><div class="bar-fill" style="width:${pctKognitif}%"></div></div>
      </div>
      <div class="bar-row">
        <label><span>Skala Emosi</span><span>${pctEmosi}%</span></label>
        <div class="bar-track"><div class="bar-fill" style="width:${pctEmosi}%"></div></div>
      </div>
      <div class="bar-row">
        <label><span>Gaya Coping (Kebutuhan Jeda)</span><span>${pctCoping}%</span></label>
        <div class="bar-track"><div class="bar-fill" style="width:${pctCoping}%"></div></div>
      </div>
    `;
  }

  function downloadAssessmentPDF() {
    if (!latestAssessmentReport) return;

    if (!window.jspdf || !window.jspdf.jsPDF) {
      window.print();
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const r = latestAssessmentReport;
    const scaleLabels = [
      "0 - Tidak pernah",
      "1 - Beberapa hari",
      "2 - > separuh waktu",
      "3 - Hampir setiap hari",
    ];

    // Header hijau hutan
    doc.setFillColor(19, 68, 44);
    doc.rect(0, 0, 210, 34, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Ruang Dengar — Ringkasan Asesmen Diri", 16, 16);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Tanggal Refleksi: ${r.date}  |  Skor Total: ${r.total} / 30`, 16, 25);

    // Status utama
    let y = 46;
    doc.setTextColor(20, 38, 28);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(r.statusTitle, 16, y);

    y += 7;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(63, 87, 74);
    const wrappedSummary = doc.splitTextToSize(r.statusSummary, 178);
    doc.text(wrappedSummary, 16, y);
    y += wrappedSummary.length * 5.5 + 6;

    // Rincian Tiga Pilar
    doc.setDrawColor(200, 220, 208);
    doc.line(16, y, 194, y);
    y += 8;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11.5);
    doc.setTextColor(19, 68, 44);
    doc.text("Rincian Tiga Pilar Ruang Dengar", 16, y);
    y += 7;

    const pillars = [
      { name: "01. Reaksi Kognitif", val: r.pctKognitif },
      { name: "02. Skala Emosi", val: r.pctEmosi },
      { name: "03. Gaya Coping (Kebutuhan Jeda)", val: r.pctCoping },
    ];

    pillars.forEach((p) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(20, 38, 28);
      doc.text(`${p.name}: ${p.val}%`, 16, y);

      doc.setFillColor(228, 239, 231);
      doc.rect(90, y - 3.5, 104, 4.5, "F");
      doc.setFillColor(30, 102, 66);
      doc.rect(90, y - 3.5, (104 * p.val) / 100, 4.5, "F");
      y += 9;
    });

    // Ringkasan 10 Jawaban
    y += 3;
    doc.line(16, y, 194, y);
    y += 8;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11.5);
    doc.setTextColor(19, 68, 44);
    doc.text("Catatan 10 Pertanyaan Reflektif", 16, y);
    y += 7;

    r.answers.forEach((ans, idx) => {
      if (y > 265) {
        doc.addPage();
        y = 20;
      }
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(20, 38, 28);
      const qLine = doc.splitTextToSize(`${idx + 1}. ${ans.question}`, 176);
      doc.text(qLine, 16, y);
      y += qLine.length * 4.5;

      doc.setTextColor(101, 127, 113);
      doc.text(`Jawaban: ${scaleLabels[ans.score]}`, 20, y);
      y += 6;
    });

    // Catatan Disclaimer
    if (y > 268) {
      doc.addPage();
      y = 20;
    }
    y += 4;
    doc.setFontSize(8.5);
    doc.setTextColor(120, 120, 120);
    doc.text(
      "Catatan: Dokumen ini adalah alat refleksi pribadi dan bukan diagnosis klinis. Jika butuh bantuan segera, hubungi 119.",
      16,
      y
    );

    doc.save("Hasil-Asesmen-Ruang-Dengar.pdf");
  }

  function resetAssessment() {
    qIndex = 0;
    scores = { kognitif: 0, emosi: 0, coping: 0 };
    userAnswersLog = [];
    assessmentForm.classList.add("hidden");
    assessmentResult.classList.add("hidden");
    assessmentPlaceholder.classList.remove("hidden");
  }

  startAssessmentBtn?.addEventListener("click", () => {
    qIndex = 0;
    scores = { kognitif: 0, emosi: 0, coping: 0 };
    userAnswersLog = [];
    assessmentPlaceholder.classList.add("hidden");
    assessmentResult.classList.add("hidden");
    assessmentForm.classList.remove("hidden");
    renderQuestion();
  });

  document.querySelectorAll(".scale-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const val = Number(btn.dataset.val || 0);
      const item = assessmentQuestions[qIndex];
      scores[item.pillar] += val;
      userAnswersLog.push({ question: item.text, score: val });
      qIndex += 1;

      if (qIndex < assessmentQuestions.length) {
        renderQuestion();
      } else {
        showAssessmentResult();
      }
    });
  });

  downloadPdfBtn?.addEventListener("click", downloadAssessmentPDF);
  resetAssessmentBtn?.addEventListener("click", resetAssessment);
  retakeAssessmentBtn?.addEventListener("click", () => {
    qIndex = 0;
    scores = { kognitif: 0, emosi: 0, coping: 0 };
    userAnswersLog = [];
    assessmentResult.classList.add("hidden");
    assessmentForm.classList.remove("hidden");
    renderQuestion();
  });

  /* =========================================================
3. RUANG TENANG — BOX BREATHING (4-4-4-4, 5 SIKLUS)
     ========================================================= */
  const phases = [
    { name: "Tarik napas", hint: "Hirup perlahan lewat hidung", mode: "expand" },
    { name: "Tahan napas", hint: "Jaga udara tetap tenang di dalam", mode: "expand" },
    { name: "Hembuskan", hint: "Buang napas perlahan dan lembut", mode: "contract" },
    { name: "Jeda kosong", hint: "Diam sejenak sebelum siklus berikutnya", mode: "contract" },
  ];

  const breathCircle = document.getElementById("breathCircle");
  const breathCount = document.getElementById("breathCount");
  const breathPhase = document.getElementById("breathPhase");
  const breathInstruction = document.getElementById("breathInstruction");
  const cycleDots = Array.from(document.querySelectorAll("#cycleDots .dot"));
  const cycleLabel = document.getElementById("cycleLabel");
  const breathToggleBtn = document.getElementById("breathToggleBtn");
  const breathResetBtn = document.getElementById("breathResetBtn");

  let breathTimer = null;
  let isBreathing = false;
  let phaseIdx = 0;
  let secLeft = 4;
  let completedCycles = 0;
  const targetCycles = 5;

  function updateCycleUI() {
    cycleDots.forEach((dot, i) => dot.classList.toggle("filled", i < completedCycles));
    cycleLabel.textContent = `${completedCycles}/${targetCycles} siklus`;
  }

  function stepBreath() {
    const current = phases[phaseIdx];
    breathPhase.textContent = current.name;
    breathInstruction.textContent = current.hint;
    breathCount.textContent = String(secLeft);

    breathCircle.classList.remove("expand", "contract");
    if (current.mode) breathCircle.classList.add(current.mode);

    secLeft -= 1;

    if (secLeft < 0) {
      secLeft = 3;
      phaseIdx += 1;

      if (phaseIdx >= phases.length) {
        phaseIdx = 0;
        completedCycles += 1;
        updateCycleUI();

        if (completedCycles >= targetCycles) {
          stopBreath();
          breathPhase.textContent = "Selesai";
          breathInstruction.textContent = "5 siklus napas selesai. Rasakan perbedaan di tubuhmu.";
          breathCount.textContent = "✓";
          breathCircle.classList.remove("expand", "contract");
        }
      }
    }
  }

  function startBreath() {
    if (completedCycles >= targetCycles) {
      completedCycles = 0;
      updateCycleUI();
    }
    isBreathing = true;
    breathToggleBtn.textContent = "❚❚ Jeda";
    phaseIdx = 0;
    secLeft = 4;
    stepBreath();
    breathTimer = setInterval(stepBreath, 1000);
  }

  function stopBreath() {
    isBreathing = false;
    clearInterval(breathTimer);
    breathTimer = null;
    breathToggleBtn.textContent = "▶ Mulai";
  }

  function resetBreath() {
    stopBreath();
    phaseIdx = 0;
    secLeft = 4;
    completedCycles = 0;
    updateCycleUI();
    breathCount.textContent = "4";
    breathPhase.textContent = "Siap?";
    breathInstruction.textContent = "Tekan mulai dan ikuti 5 siklus penuh";
    breathCircle.classList.remove("expand", "contract");
  }

  breathToggleBtn?.addEventListener("click", () => {
    if (isBreathing) stopBreath();
    else startBreath();
  });

  breathResetBtn?.addEventListener("click", resetBreath);

  /* =========================================================
4. CHECK-IN HARIAN (3 LANGKAH)
     ========================================================= */
  const steps = Array.from(document.querySelectorAll(".checkin-step"));
  const stepLabel = document.getElementById("checkinStepLabel");
  const checkinSummary = document.getElementById("checkinSummary");
  const checkinSummaryList = document.getElementById("checkinSummaryList");
  const restartCheckinBtn = document.getElementById("restartCheckinBtn");

  let currentStep = 0;
  const checkinAnswers = [];

  document.querySelectorAll(".choice-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      checkinAnswers[currentStep] = btn.dataset.value;
      currentStep += 1;

      if (currentStep < steps.length) {
        steps.forEach((s, idx) => s.classList.toggle("active", idx === currentStep));
        stepLabel.textContent = `0${currentStep + 1} DARI 03`;
      } else {
        steps.forEach((s) => s.classList.remove("active"));
        stepLabel.textContent = "SELESAI";
        checkinSummaryList.innerHTML = `
          <li><strong>Kondisi hari-hari:</strong> ${checkinAnswers[0]}</li>
          <li><strong>Fokus energi:</strong> ${checkinAnswers[1]}</li>
          <li><strong>Langkah ramah diri:</strong> ${checkinAnswers[2]}</li>
        `;
        checkinSummary.classList.remove("hidden");
      }
    });
  });

  restartCheckinBtn?.addEventListener("click", () => {
    currentStep = 0;
    checkinAnswers.length = 0;
    checkinSummary.classList.add("hidden");
    stepLabel.textContent = "01 DARI 03";
    steps.forEach((s, idx) => s.classList.toggle("active", idx === 0));
  });

  /* =========================================================
5. ULAR TANGGA REFLEKSI (TAHAPAN LOMPAT SERAGAM TIAP KOTAK)
     ========================================================= */
  const boardEl = document.getElementById("snakeBoard");
  const boardOverlay = document.getElementById("boardOverlay");
  const playerPosEl = document.getElementById("playerPos");
  const rollCountEl = document.getElementById("rollCount");
  const diceDisplay = document.getElementById("diceDisplay");
  const boardMessage = document.getElementById("boardMessage");
  const rollDiceBtn = document.getElementById("rollDiceBtn");
  const resetBoardBtn = document.getElementById("resetBoardBtn");
  const toggleSoundBtn = document.getElementById("toggleSoundBtn");

  const ladders = { 4: 12, 11: 20, 19: 29 };
  const snakes = { 16: 9, 26: 17, 33: 24 };

  const STEP_WALK_NOTES = [
    "Satu langkah kecil sudah cukup untuk memulai.",
    "Pelan-pelan saja, kamu sedang bergerak maju.",
    "Setiap kotak yang dilalui tetap berarti.",
    "Tetap bernapas dan nikmati prosesnya.",
    "Kamu terus melangkah dengan ritmemu sendiri.",
    "Teruskan langkahnya, satu demi satu.",
  ];

  const SNAKE_ENCOURAGEMENT_NOTES = {
    16: "🐍 Kena ular ke 9: Turun sebentar bukan berarti kalah. Tarik napas dalam—kamu masih punya banyak waktu dan tenaga untuk naik lagi!",
    26: "🐍 Kena ular ke 17: Semangat! Mundur sejenak untuk menata napas itu wajar. Pelan-pelan kita bangun lagi langkahnya ya!",
    33: "🐍 Kena ular ke 24: Hampir sampai puncak lalu turun dulu? Jangan berkecil hati—pengalamanmu sudah jauh lebih matang, ayo melangkah lagi!",
  };

  const tileNotes = {
    4: "🪜 Tangga ke 12: Menemukan satu hal kecil yang patut disyukuri hari ini.",
    11: "🪜 Tangga ke 20: Berani meminta bantuan bukan tanda lemah.",
    19: "🪜 Tangga ke 29: Istirahat sejenak membantu pikiran kembali jernih.",
    16: SNAKE_ENCOURAGEMENT_NOTES[16],
    26: SNAKE_ENCOURAGEMENT_NOTES[26],
    33: SNAKE_ENCOURAGEMENT_NOTES[33],
    36: "Selamat! Kamu sudah menuntaskan perjalanan refleksi dari bawah hingga puncak.",
  };

  const HOP_MS = 380;

  let position = 0;
  let rolls = 0;
  let soundOn = true;
  let isAnimatingMove = false;
  let flyingPionEl = null;

  if (!document.getElementById("pionHopStyle")) {
    const style = document.createElement("style");
    style.id = "pionHopStyle";
    style.textContent = `
      #snakeBoard {
        position: relative;
      }
      .flying-pion {
        position: absolute;
        z-index: 25;
        pointer-events: none;
        transform: translate(-50%, -50%);
        transition: left ${HOP_MS - 30}ms ease-in-out, top ${HOP_MS - 30}ms ease-in-out;
      }
      @keyframes pionHopStep {
        0%   { transform: translate(-50%, -50%) scale(1); }
        45%  { transform: translate(-50%, calc(-50% - 22px)) scale(1.16); }
        80%  { transform: translate(-50%, calc(-50% + 2px)) scale(0.96); }
        100% { transform: translate(-50%, -50%) scale(1); }
      }
      .flying-pion.hopping {
        animation: pionHopStep ${HOP_MS}ms cubic-bezier(0.34, 1.56, 0.64, 1);
      }
      @keyframes tileHopHighlight {
        0%   { box-shadow: inset 0 0 0 0 rgba(30, 102, 66, 0); }
        45%  { box-shadow: inset 0 0 0 3px rgba(30, 102, 66, 0.5); }
        100% { box-shadow: inset 0 0 0 0 rgba(30, 102, 66, 0); }
      }
      .tile.hop-landed {
        animation: tileHopHighlight ${HOP_MS}ms ease-out;
      }
    `;
    document.head.appendChild(style);
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function setControlsDisabled(disabled) {
    if (rollDiceBtn) rollDiceBtn.disabled = disabled;
    if (resetBoardBtn) resetBoardBtn.disabled = disabled;
  }

  function playTone(freq = 520) {
    if (!soundOn) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.value = 0.05;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch {
      // Ignore audio restrictions
    }
  }

  // Konversi nomor petak (1..36) ke posisi baris & kolom visual (bawah ke atas, zigzag)
  function getTileCoords(tileNum) {
    const zeroIdx = tileNum - 1;
    const rowFromBottom = Math.floor(zeroIdx / 6);
    const visualRow = 5 - rowFromBottom;
    const colInRow = zeroIdx % 6;
    const visualCol = rowFromBottom % 2 === 0 ? colInRow : 5 - colInRow;
    return {
      row: visualRow,
      col: visualCol,
      cx: visualCol * 100 + 50,
      cy: visualRow * 100 + 50,
    };
  }

  function getTileCenterInBoard(tileNum) {
    if (!boardEl) return { x: 0, y: 0 };
    const tileEl = boardEl.querySelector(`.tile[data-tile="${tileNum}"]`);
    if (tileEl) {
      const boardRect = boardEl.getBoundingClientRect();
      const tileRect = tileEl.getBoundingClientRect();
      return {
        x: tileRect.left - boardRect.left + tileRect.width / 2,
        y: tileRect.top - boardRect.top + tileRect.height / 2,
      };
    }
    const coords = getTileCoords(tileNum);
    const w = boardEl.clientWidth || 600;
    const h = boardEl.clientHeight || 600;
    return {
      x: (coords.cx / 600) * w,
      y: (coords.cy / 600) * h,
    };
  }

  function ensureFlyingPion() {
    if (!boardEl) return null;
    if (!flyingPionEl || !flyingPionEl.isConnected) {
      flyingPionEl = document.createElement("span");
      flyingPionEl.className = "player-token flying-pion";
      flyingPionEl.textContent = "Kamu";
      boardEl.appendChild(flyingPionEl);
    }
    return flyingPionEl;
  }

  function syncPosLabel(pos) {
    if (playerPosEl) {
      playerPosEl.textContent = pos <= 0 ? "0 / 36" : `${pos} / 36`;
    }
  }

  async function hopToTile(nextTile, toneFreq = 500, snapBeforeHop = false) {
    const pion = ensureFlyingPion();
    if (!pion || !boardEl) {
      position = nextTile;
      syncPosLabel(position);
      return;
    }

    if (nextTile <= 0) {
      position = 0;
      pion.style.opacity = "0";
      syncPosLabel(0);
      return;
    }

    const pt = getTileCenterInBoard(nextTile);
    pion.style.opacity = "1";

    if (snapBeforeHop) {
      pion.style.transition = "none";
      pion.style.left = `${pt.x}px`;
      pion.style.top = `${pt.y}px`;
      void pion.offsetWidth;
    }

    pion.style.transition = `left ${HOP_MS - 30}ms ease-in-out, top ${HOP_MS - 30}ms ease-in-out`;
    pion.style.left = `${pt.x}px`;
    pion.style.top = `${pt.y}px`;

    pion.classList.remove("hopping");
    void pion.offsetWidth;
    pion.classList.add("hopping");

    const tileEl = boardEl.querySelector(`.tile[data-tile="${nextTile}"]`);
    if (tileEl) {
      tileEl.classList.remove("hop-landed");
      void tileEl.offsetWidth;
      tileEl.classList.add("hop-landed");
    }

    position = nextTile;
    syncPosLabel(position);
    playTone(toneFreq);

    await sleep(HOP_MS);
  }

  function drawSnakesAndLaddersSVG() {
    if (!boardOverlay) return;
    let svgContent = "";

    Object.entries(ladders).forEach(([startStr, endStr]) => {
      const start = getTileCoords(Number(startStr));
      const end = getTileCoords(Number(endStr));
      const dx = end.cx - start.cx;
      const dy = end.cy - start.cy;
      const len = Math.hypot(dx, dy);
      const nx = (-dy / len) * 9;
      const ny = (dx / len) * 9;

      svgContent += `
        <line x1="${start.cx + nx}" y1="${start.cy + ny}" x2="${end.cx + nx}" y2="${end.cy + ny}"
              stroke="#1e6642" stroke-width="4.5" stroke-linecap="round" opacity="0.82" />
        <line x1="${start.cx - nx}" y1="${start.cy - ny}" x2="${end.cx - nx}" y2="${end.cy - ny}"
              stroke="#1e6642" stroke-width="4.5" stroke-linecap="round" opacity="0.82" />
      `;

      const rungs = Math.max(4, Math.floor(len / 28));
      for (let i = 1; i < rungs; i++) {
        const t = i / rungs;
        const rx = start.cx + dx * t;
        const ry = start.cy + dy * t;
        svgContent += `
          <line x1="${rx + nx}" y1="${ry + ny}" x2="${rx - nx}" y2="${ry - ny}"
                stroke="#2e8b57" stroke-width="3.2" stroke-linecap="round" opacity="0.88" />
        `;
      }
    });

    Object.entries(snakes).forEach(([headStr, tailStr]) => {
      const head = getTileCoords(Number(headStr));
      const tail = getTileCoords(Number(tailStr));
      const midX = (head.cx + tail.cx) / 2;
      const midY = (head.cy + tail.cy) / 2;
      const ctrl1X = head.cx + 38;
      const ctrl1Y = (head.cy + midY) / 2;
      const ctrl2X = tail.cx - 38;
      const ctrl2Y = (midY + tail.cy) / 2;

      const pathD = `M ${head.cx} ${head.cy} C ${ctrl1X} ${ctrl1Y}, ${ctrl2X} ${ctrl2Y}, ${tail.cx} ${tail.cy}`;

      svgContent += `
        <path d="${pathD}" fill="none" stroke="#b94832" stroke-width="9" stroke-linecap="round" opacity="0.78" />
        <path d="${pathD}" fill="none" stroke="#f3b7aa" stroke-width="2.5" stroke-dasharray="6 8" stroke-linecap="round" opacity="0.85" />
        <circle cx="${head.cx}" cy="${head.cy}" r="10" fill="#9e3b28" />
        <circle cx="${head.cx - 3}" cy="${head.cy - 2}" r="1.8" fill="#ffffff" />
        <circle cx="${head.cx + 3}" cy="${head.cy - 2}" r="1.8" fill="#ffffff" />
      `;
    });

    boardOverlay.innerHTML = svgContent;
  }

  function renderBoard() {
    if (!boardEl) return;
    boardEl.innerHTML = "";

    for (let visualRow = 0; visualRow < 6; visualRow++) {
      const rowFromBottom = 5 - visualRow;
      for (let visualCol = 0; visualCol < 6; visualCol++) {
        const colInRow = rowFromBottom % 2 === 0 ? visualCol : 5 - visualCol;
        const tileNum = rowFromBottom * 6 + colInRow + 1;

        const tile = document.createElement("div");
        tile.className = "tile";
        tile.dataset.tile = String(tileNum);
        if (tileNum === 1) tile.classList.add("start-tile");
        if (ladders[tileNum]) tile.classList.add("ladder");
        if (snakes[tileNum]) tile.classList.add("slide");
        if (tileNum === 36) tile.classList.add("finish");

        let hint = "";
        if (tileNum === 1) hint = "START";
        else if (ladders[tileNum]) hint = `↑${ladders[tileNum]}`;
        else if (snakes[tileNum]) hint = `↓${snakes[tileNum]}`;
        else if (tileNum === 36) hint = "FINISH";

        tile.innerHTML = `<span class="tile-num">${tileNum}</span><span class="tile-hint">${hint}</span>`;
        boardEl.appendChild(tile);
      }
    }

    drawSnakesAndLaddersSVG();
    const pion = ensureFlyingPion();
    if (pion) {
      if (position <= 0) {
        pion.style.opacity = "0";
      } else {
        const pt = getTileCenterInBoard(position);
        pion.style.opacity = "1";
        pion.style.transition = "none";
        pion.style.left = `${pt.x}px`;
        pion.style.top = `${pt.y}px`;
      }
    }
    syncPosLabel(position);
    if (rollCountEl) {
      rollCountEl.textContent = String(rolls);
    }
  }

  rollDiceBtn?.addEventListener("click", async () => {
    if (isAnimatingMove) return;

    if (position >= 36) {
      boardMessage.textContent = "Putaran ini sudah selesai. Tekan 'Mulai Ulang' jika ingin berjalan lagi.";
      return;
    }

    isAnimatingMove = true;
    setControlsDisabled(true);

    const dice = Math.floor(Math.random() * 6) + 1;
    const faces = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
    if (diceDisplay) diceDisplay.textContent = faces[dice - 1];
    rolls += 1;
    if (rollCountEl) rollCountEl.textContent = String(rolls);

    const startPos = position;
    const targetStep = Math.min(36, startPos + dice);

    if (startPos === 0 && targetStep >= 1) {
      const walkNote = STEP_WALK_NOTES[0];
      boardMessage.textContent = `Dadu ${dice} (1/${dice}) → Kotak 1: ${walkNote}`;
      await hopToTile(1, 460, true);
    }

    while (position < targetStep) {
      const nextTile = position + 1;
      const stepIdx = nextTile - startPos;
      const walkNote = STEP_WALK_NOTES[(stepIdx - 1) % STEP_WALK_NOTES.length];
      boardMessage.textContent = `Dadu ${dice} (${stepIdx}/${dice}) → Kotak ${nextTile}: ${walkNote}`;
      await hopToTile(nextTile, 450 + stepIdx * 32, false);
    }

    if (ladders[position]) {
      const next = ladders[position];
      boardMessage.textContent = tileNotes[position] || `Naik tangga ke petak ${next}!`;
      await sleep(220);
      await hopToTile(next, 680, false);
    } else if (snakes[position]) {
      const next = snakes[position];
      boardMessage.textContent =
        SNAKE_ENCOURAGEMENT_NOTES[position] ||
        `🐍 Kena ular ke ${next}: Tidak apa-apa melambat sejenak, kamu tetap kuat untuk terus melangkah!`;
      await sleep(260);
      await hopToTile(next, 340, false);
    } else if (tileNotes[position]) {
      boardMessage.textContent = tileNotes[position];
    } else {
      const endNote = STEP_WALK_NOTES[(dice - 1) % STEP_WALK_NOTES.length];
      boardMessage.textContent = `Sampai di kotak ${position} (${dice} langkah). ${endNote}`;
    }

    isAnimatingMove = false;
    setControlsDisabled(false);
  });

  resetBoardBtn?.addEventListener("click", () => {
    if (isAnimatingMove) return;
    position = 0;
    rolls = 0;
    if (diceDisplay) diceDisplay.textContent = "🎲";
    boardMessage.textContent =
      "Kamu sudah memulai. Mengambil langkah pertama juga merupakan sebuah keberanian.";
    if (flyingPionEl) {
      flyingPionEl.style.opacity = "0";
      flyingPionEl.classList.remove("hopping");
    }
    syncPosLabel(0);
    if (rollCountEl) rollCountEl.textContent = "0";
  });

  toggleSoundBtn?.addEventListener("click", () => {
    soundOn = !soundOn;
    toggleSoundBtn.textContent = soundOn ? "Sound On" : "Sound Off";
  });

  renderBoard();

  /* =========================================================
6. TEMAN DENGAR (PEMETAAN INTENT + ANTI-PENGULANGAN)
     ========================================================= */
  const chatMessages = document.getElementById("chatMessages");
  const chatForm = document.getElementById("chatForm");
  const chatInput = document.getElementById("chatInput");
  const clearChatBtn = document.getElementById("clearChatBtn");

  const INITIAL_BOT_MSG =
    "Hai, aku di sini untuk mendengarkan. Kamu bisa cerita apa saja — tidak ada penilaian di ruang ini. Apa yang sedang kamu rasakan hari ini?";

  const CRISIS_KEYWORDS = [
    "bunuh diri",
    "ingin mati",
    "mau mati",
    "mengakhiri hidup",
    "menyakiti diri",
    "self harm",
    "tidak kuat hidup",
    "ga kuat hidup",
  ];

  const CRISIS_REPLIES = [
    "Aku sangat peduli dengan keselamatanmu, dan kedengarannya kamu sedang membawa beban yang sangat berat. Tolong pertimbangkan untuk segera menghubungi orang terdekat yang kamu percaya, tenaga profesional, atau layanan darurat/bantuan krisis terdekat (seperti nomor darurat 119 di Indonesia). Kamu tidak harus menghadapi ini sendirian.",
  ];

  const INTENT_BANK = [
    {
      id: "lelah_burnout",
      keywords: ["lelah", "capek", "burnout", "letih", "habis energi", "penat", "lemes", "kewalahan"],
      replies: [
        "Kedengarannya kamu sudah menahan banyak hal belakangan ini. Wajar kalau tubuh dan pikiranmu terasa lelah.",
        "Tidak apa-apa kalau hari ini energimu sedang tipis. Bagian mana yang paling menguras tenagamu akhir-akhir ini?",
        "Menahan rasa lelah sendirian itu berat. Kalau boleh tahu, sejak kapan rasa capek ini mulai terasa?",
      ],
    },
    {
      id: "cemas_overthinking",
      keywords: ["cemas", "khawatir", "takut", "overthinking", "gelisah", "was-was", "panik", "pikiran"],
      replies: [
        "Pikiran yang berputar terus memang bisa bikin dada terasa sesak. Coba tarik napas pelan—apa satu hal kecil yang paling mengganggu kepalamu sekarang?",
        "Aku mendengarmu. Saat cemas muncul, kadang membantu untuk membedakan mana yang bisa kita kendalikan dan mana yang belum.",
        "Wajar kalau pikiranmu lagi ramai. Mau coba tulis satu kalimat saja tentang hal yang paling bikin kamu khawatir?",
      ],
    },
    {
      id: "sedih_kecewa",
      keywords: ["sedih", "kecewa", "sakit hati", "nangis", "menangis", "patah hati", "hampa"],
      replies: [
        "Aku turut merasakan betapa tidak nyamannya berada di titik itu. Kamu tidak harus buru-buru memaksakan diri untuk langsung ceria.",
        "Rasa sedih dan kecewa itu valid. Mau bercerita sedikit tentang kejadian yang membuat hatimu terasa berat?",
        "Kalau ingin meluapkan rasa sedihnya pelan-pelan di sini, aku siap mendengarkan tanpa menghakimi.",
      ],
    },
    {
      id: "kesepian_sendiri",
      keywords: ["kesepian", "sendiri", "sepi", "terasing", "tidak ada teman", "ga ada teman"],
      replies: [
        "Merasa sendirian di tengah keramaian atau rutinitas bisa terasa sangat sunyi. Terima kasih sudah datang ke sini untuk bercerita.",
        "Kamu tidak sendirian saat mengetik pesan ini. Apa yang biasanya membuat rasa sepi itu paling terasa?",
      ],
    },
    {
      id: "butuh_jeda_napas",
      keywords: ["napas", "jeda", "tenang", "rileks", "menenangkan", "istirahat"],
      replies: [
        "Mari ambil jeda singkat dulu: tarik napas pelan selama 4 detik, tahan 4 detik, lalu hembuskan 4 detik. Ulangi 2–3 kali sesuai nyamanmu.",
        "Kadang berhenti sejenak sudah cukup untuk memberi ruang bernapas. Setelah jeda sebentar, apa yang paling kamu butuhkan?",
      ],
    },
    {
      id: "sulit_tidur",
      keywords: ["susah tidur", "sulit tidur", "insomnia", "begadang", "tidak bisa tidur", "ga bisa tidur", "terbangun malam"],
      replies: [
        "Sulit tidur saat kepala masih penuh itu melelahkan sekali. Kalau belum bisa terlelap, coba jauhkan layar sebentar dan biarkan tubuh beristirahat meski pelan.",
        "Malam hari sering membuat perasaan terasa lebih tajam. Mau ceritakan apa yang sedang memenuhi pikiranmu menjelang tidur?",
      ],
    },
    {
      id: "tekanan_studi_kerja",
      keywords: ["kuliah", "skripsi", "tugas", "ujian", "kerja", "kantor", "deadline", "target", "nilai", "atasan"],
      replies: [
        "Tuntutan tugas dan ekspektasi memang sering datang bertubi-tubi. Wajar kalau kamu merasa kewalahan di tengah semua itu.",
        "Saat semuanya terasa menumpuk, kita tidak harus menyelesaikan semuanya sekaligus. Satu langkah kecil mana yang paling realistis untuk hari ini?",
      ],
    },
    {
      id: "keluarga_relasi",
      keywords: ["keluarga", "orang tua", "ayah", "ibu", "adik", "kakak", "pasangan", "pacar", "teman", "pertengkaran", "berantem"],
      replies: [
        "Dinamika dengan orang-orang terdekat bisa menguras emosi karena kita peduli pada mereka. Bagaimana perasaanmu setelah kejadian itu?",
        "Tidak mudah ketika hubungan yang berarti terasa tegang atau tidak dipahami. Ceritakan saja bagian yang paling ingin kamu sampaikan.",
      ],
    },
    {
      id: "merasa_gagal_tidak_cukup",
      keywords: ["gagal", "tidak berguna", "ga berguna", "tidak cukup", "minder", "insecure", "kalah", "bodoh", "beban"],
      replies: [
        "Suara di kepala yang bilang kita kurang atau gagal sering terdengar sangat keras, padahal itu bukan ukuran penuh dari nilaimu.",
        "Kamu sedang melalui proses yang tidak mudah. Satu hal kecil apa yang tetap berhasil kamu jalani hari ini, sekecil apa pun?",
      ],
    },
    {
      id: "marah_kesal",
      keywords: ["marah", "kesal", "jengkel", "emosi", "muak", "benci", "gregetan", "tidak adil"],
      replies: [
        "Rasa marah dan kesal sering muncul ketika ada batas yang dilanggar atau hal yang terasa tidak adil. Wajar kalau kamu merasa begitu.",
        "Ambil napas sebentar sebelum bertindak juga tidak apa-apa. Apa pemicu utama yang paling membuatmu kesal?",
      ],
    },
    {
      id: "lega_terima_kasih",
      keywords: ["terima kasih", "makasih", "lebih baik", "lega", "tenangan", "terbantu", "senang", "bersyukur"],
      replies: [
        "Senang mendengarnya. Pelan-pelan saja ya, kamu boleh kembali kapan pun butuh ruang untuk bercerita.",
        "Sama-sama. Semoga jeda dan cerita hari ini memberi sedikit kelegaan untuk langkahmu berikutnya.",
      ],
    },
  ];

  const FALLBACK_REPLIES = [
    "Terima kasih sudah mau berbagi di sini. Mau pelan-pelan ceritakan apa yang sedang kamu rasakan?",
    "Aku mendengarkan. Kalau belum ketemu kata yang pas, tidak apa-apa mulai dari hal paling kecil hari ini.",
    "Ceritamu penting di ruang ini. Bagian mana yang paling ingin kamu keluarkan sekarang?",
  ];

  let lastReplyText = "";
  let isReplying = false;

  function normalizeText(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function pickNonRepeating(list) {
    if (!Array.isArray(list) || list.length === 0) return "";
    if (list.length === 1) {
      lastReplyText = list[0];
      return list[0];
    }

    const candidates = list.filter((item) => item !== lastReplyText);
    const pool = candidates.length > 0 ? candidates : list;
    const chosen = pool[Math.floor(Math.random() * pool.length)];
    lastReplyText = chosen;
    return chosen;
  }

  function getReplyByIntentId(intentId) {
    const found = INTENT_BANK.find((item) => item.id === intentId);
    return found ? pickNonRepeating(found.replies) : pickNonRepeating(FALLBACK_REPLIES);
  }

  function generateEmpatheticReply(userText) {
    const clean = normalizeText(userText);
    if (!clean) {
      return pickNonRepeating(FALLBACK_REPLIES);
    }

    const hasCrisisSignal = CRISIS_KEYWORDS.some((phrase) =>
      clean.includes(normalizeText(phrase))
    );
    if (hasCrisisSignal) {
      return pickNonRepeating(CRISIS_REPLIES);
    }

    let bestMatch = null;
    let highestScore = 0;

    for (const item of INTENT_BANK) {
      let score = 0;
      for (const kw of item.keywords) {
        const cleanKw = normalizeText(kw);
        if (cleanKw && clean.includes(cleanKw)) {
          score += cleanKw.split(" ").length + 1;
        }
      }

      if (score > highestScore) {
        highestScore = score;
        bestMatch = item;
      }
    }

    return bestMatch
      ? pickNonRepeating(bestMatch.replies)
      : pickNonRepeating(FALLBACK_REPLIES);
  }

  function appendMessage(text, sender = "bot") {
    const div = document.createElement("div");
    div.className = `msg ${sender === "user" ? "msg-user" : "msg-bot"}`;
    div.textContent = text;
    chatMessages?.appendChild(div);
    if (chatMessages) {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  }

  function triggerTemanDengarReply(userText, intentId = "") {
    const trimmed = String(userText || "").trim();
    if (!trimmed || isReplying) return;

    isReplying = true;
    appendMessage(trimmed, "user");

    setTimeout(() => {
      const reply = intentId
        ? getReplyByIntentId(intentId)
        : generateEmpatheticReply(trimmed);
      appendMessage(reply, "bot");
      isReplying = false;
    }, 350);
  }

  chatForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const val = chatInput.value.trim();
    if (!val) return;
    chatInput.value = "";
    triggerTemanDengarReply(val);
  });

  document.querySelectorAll(".chip-btn").forEach((chip) => {
    chip.addEventListener("click", () => {
      const userLabel = (chip.dataset.prompt || chip.textContent || "").trim();
      const intentId = (chip.dataset.intent || "").trim();
      triggerTemanDengarReply(userLabel, intentId);
    });
  });

  clearChatBtn?.addEventListener("click", () => {
    lastReplyText = "";
    if (chatMessages) {
      chatMessages.innerHTML = `<div class="msg msg-bot">${INITIAL_BOT_MSG}</div>`;
    }
  });

  /* =========================================================
7. RUANG BERBAGI (DINDING ANONIM — SUPABASE BERSAMA)
     ========================================================= */
  const wallForm = document.getElementById("wallForm");
  const wallName = document.getElementById("wallName");
  const wallText = document.getElementById("wallText");
  const wallFeed = document.getElementById("wallFeed");

  const SUPABASE_URL = "https://heyfdgnauvyqpaopyxfm.supabase.co";
  const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhleWZkZ25hdXZ5cXBhb3B5eGZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTU1MjEzOTAsImV4cCI6MjExMTA5NzM5MH0.XcIkzpN4jFePnUdJUTvOoTGHuBaio2BzMa_4znbQ-mo";
  const WALL_ENDPOINT = `${SUPABASE_URL}/rest/v1/wall_posts`;

  function escapeHtml(str) {
    return String(str || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  async function renderWallPosts() {
    if (!wallFeed) return;

    try {
      const res = await fetch(`${WALL_ENDPOINT}?select=*&order=created_at.desc&limit=30`, {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      });

      if (!res.ok) throw new Error("Gagal memuat cerita");
      const posts = await res.json();

      if (!posts.length) {
        wallFeed.innerHTML = `<p class="empty-wall">Belum ada cerita. Jadilah yang pertama berbagi — ruang ini menunggumu.</p>`;
        return;
      }

      wallFeed.innerHTML = posts
        .map(
          (p) => `
        <article class="wall-post">
          <div class="wall-post-head">
            <strong>${escapeHtml(p.name || "Anonim")}</strong>
            <span>${escapeHtml(p.time)}</span>
          </div>
          <p>${escapeHtml(p.text)}</p>
        </article>
      `
        )
        .join("");
    } catch {
      wallFeed.innerHTML = `<p class="empty-wall">Tidak dapat memuat cerita saat ini. Coba muat ulang halaman.</p>`;
    }
  }

  wallForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = wallText.value.trim();
    if (!text) return;

    const submitBtn = wallForm.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    const name = wallName.value.trim() || "Anonim";
    const time = new Date().toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });

    try {
      const res = await fetch(WALL_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          Prefer: "return=minimal",
        },
        body: JSON.stringify({ name, text, time }),
      });

      if (!res.ok) throw new Error("Gagal mengirim cerita");

      wallText.value = "";
      await renderWallPosts();
    } catch {
      alert("Gagal membagikan cerita. Periksa koneksi internet atau konfigurasi Supabase.");
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });

  renderWallPosts();
});