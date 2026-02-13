// ─── Global state ────────────────────────────────────────────────────────────
let currentData = {
    short: "",
    initials: "",
    tutor: "",
    events: [],
};

let currentEditIndex = -1;
let presets = [];

const dayNames = [
    "Mon1","Tue1","Wed1","Thu1","Fri1",
    "Mon2","Tue2","Wed2","Thu2","Fri2",
];
const periodNames = [
    "AM","P1","P2","Break","P3","PM","Lunch","P4","P5","After",
];
const periodHeights = [
    false,true,true,false,true,false,false,true,true,true,
];

let selectedDays    = Array(10).fill(true);
// "After" (index 9) is hidden by default
let selectedPeriods = [true,true,true,true,true,true,true,true,true,false];
let customPeriodHeights = [...periodHeights];

// ─── Subject mapping configuration ───────────────────────────────────────────
// Each entry: { keywords: [...], subject: "...", color: "#rrggbb" }
// Keywords are lowercase substrings; first match wins.
//
// TUTOR NOTE: tutor group entries in the PDF appear as e.g. "Year 10: G4" or
// "Year 12: GB".  The keywords below match the ": XX" suffix forms so they
// don't collide with room codes (G1, G2 etc.) which appear as standalone words
// at the END of cell text.  Single-letter+digit keywords (" g1" etc.) have been
// removed for this reason — use the colon-prefixed forms instead.
let subjectMappings = [
    { keywords: ["computing"],              subject: "Comp",  color: "#7b68ee" },
    { keywords: ["maths"],                  subject: "Maths", color: "#87ceeb" },
    { keywords: ["music"],                  subject: "Music", color: "#3cb371" },
    { keywords: ["6th form study"],         subject: "Study", color: "#ff4500" },
    { keywords: [
        ": gb",": pp",": vf",": de",": bw",": nr",
        "7: a1","7: a2","7: a3","7: w1","7: w2","7: w3",
        "7: g1","7: g2","7: g3","7: f1","7: f2","7: f3",
        "7: n1","7: n2","7: n3",
        "8: a1","8: a2","8: a3","8: w1","8: w2","8: w3",
        "8: g1","8: g2","8: g3","8: f1","8: f2","8: f3",
        "8: n1","8: n2","8: n3",
        "9: a1","9: a2","9: a3","9: w1","9: w2","9: w3",
        "9: g1","9: g2","9: g3","9: f1","9: f2","9: f3",
        "9: n1","9: n2","9: n3",
        "10: a4","10: w4","10: f4","10: g4","10: n4",
        "11: a5","11: w5","11: f5","11: g5","11: n5",
        "year 12:","year 7:","year 8:","year 9:","year 10:","year 11:",
    ], subject: "Tutor", color: "#d3d3d3" },
    { keywords: ["citizenship"],            subject: "CR",    color: "#f08080" },
    { keywords: [" pe ","physical education"], subject: "PE", color: "#4169e1" },
    { keywords: ["science"],                subject: "Sci",   color: "#32cd32" },
    { keywords: ["physics"],                subject: "Phys",  color: "#32cd32" },
    { keywords: ["chemistry"],              subject: "Chem",  color: "#32cd32" },
    { keywords: ["biology"],                subject: "Bio",   color: "#32cd32" },
    { keywords: ["english"],                subject: "Eng",   color: "#ff6347" },
    { keywords: ["history"],                subject: "Hist",  color: "#ffd700" },
    { keywords: ["geography"],              subject: "Geog",  color: "#66cdaa" },
    { keywords: ["religious"],              subject: "RE",    color: "#ff69b4" },
    { keywords: ["french"],                 subject: "Fr",    color: "#f08080" },
    { keywords: ["spanish"],                subject: "Sp",    color: "#f08080" },
    { keywords: ["drama"],                  subject: "Drama", color: "#ffb6c1" },
    { keywords: ["dance"],                  subject: "Dance", color: "#db7093" },
    { keywords: ["art"],                    subject: "Art",   color: "#dc143c" },
    { keywords: ["media"],                  subject: "Media", color: "#ff69b4" },
];

// ─── Init ─────────────────────────────────────────────────────────────────────

function init() {
    setupDaysCheckboxes();
    setupPeriodsCheckboxes();
    updateEventsList();
    updateModalSelects();
    updatePresetsList();
    updatePresetSelect();
}

function setupDaysCheckboxes() {
    const container = document.getElementById("daysCheckboxes");
    container.innerHTML = `
<div class="days-grid">
<div class="week-column">
<div class="week-header"><button class="week-button" onclick="toggleWeek(1)">Week 1</button></div>
<div id="week1Days"></div>
</div>
<div class="week-column">
<div class="week-header"><button class="week-button" onclick="toggleWeek(2)">Week 2</button></div>
<div id="week2Days"></div>
</div>
</div>`;
    const w1 = document.getElementById("week1Days");
    const w2 = document.getElementById("week2Days");
    for (let i = 0; i < 5; i++) {
        const div = document.createElement("div"); div.className = "checkbox-item";
        div.innerHTML = `<input type="checkbox" id="day${i}" ${selectedDays[i]?"checked":""} onchange="toggleDay(${i})"><label for="day${i}">${dayNames[i]}</label>`;
        w1.appendChild(div);
    }
    for (let i = 5; i < 10; i++) {
        const div = document.createElement("div"); div.className = "checkbox-item";
        div.innerHTML = `<input type="checkbox" id="day${i}" ${selectedDays[i]?"checked":""} onchange="toggleDay(${i})"><label for="day${i}">${dayNames[i]}</label>`;
        w2.appendChild(div);
    }
}

function setupPeriodsCheckboxes() {
    const container = document.getElementById("periodsCheckboxes");
    periodNames.forEach((period, index) => {
        const div = document.createElement("div"); div.className = "checkbox-item";
        div.innerHTML = `
<input type="checkbox" id="period${index}" ${selectedPeriods[index]?"checked":""} onchange="togglePeriod(${index})">
<label for="period${index}">${period}</label>
<select onchange="changePeriodHeight(${index}, this.value)" style="width:60px;padding:2px;margin-left:5px;">
<option value="false" ${!customPeriodHeights[index]?"selected":""}>Half</option>
<option value="true" ${customPeriodHeights[index]?"selected":""}>Full</option>
</select>`;
        container.appendChild(div);
    });
}

function toggleDay(index) { selectedDays[index] = document.getElementById(`day${index}`).checked; updateModalSelects(); }
function togglePeriod(index) { selectedPeriods[index] = document.getElementById(`period${index}`).checked; updateModalSelects(); }
function changePeriodHeight(index, value) { customPeriodHeights[index] = value === "true"; }

function toggleWeek(weekNumber) {
    const s = weekNumber === 1 ? 0 : 5, e = weekNumber === 1 ? 5 : 10;
    const allSelected = selectedDays.slice(s, e).every(d => d);
    for (let i = s; i < e; i++) {
        selectedDays[i] = !allSelected;
        const cb = document.getElementById(`day${i}`); if (cb) cb.checked = selectedDays[i];
    }
    updateModalSelects();
}

function updateModalSelects() {
    const daySelect = document.getElementById("eventDay");
    const periodSelect = document.getElementById("eventPeriod");
    daySelect.innerHTML = "";
    dayNames.forEach((day, index) => {
        if (selectedDays[index]) {
            const opt = document.createElement("option"); opt.value = index; opt.textContent = day; daySelect.appendChild(opt);
        }
    });
    periodNames.forEach((period, index) => {
        if (selectedPeriods[index]) {
            const opt = document.createElement("option");
            if (index === 6) opt.value = 7; else if (index === 7) opt.value = 8;
            else if (index === 8) opt.value = 9; else if (index === 9) opt.value = 10; else opt.value = index;
            opt.textContent = period; periodSelect.appendChild(opt);
            if (index === 5 && selectedPeriods[5] && selectedPeriods[6]) {
                const span = document.createElement("option"); span.value = 6; span.textContent = "PM/Lunch Span"; periodSelect.appendChild(span);
            }
        }
    });
}

// ─── JSON modal ───────────────────────────────────────────────────────────────

function openJSONModal() { document.getElementById("jsonModal").style.display = "block"; }
function closeJSONModal() { document.getElementById("jsonModal").style.display = "none"; }

function downloadJSON() {
    currentData.short   = document.getElementById("shortName").value.trim();
    currentData.initials= document.getElementById("initials").value.trim();
    currentData.tutor   = document.getElementById("tutorGroup").value.trim();
    const exportData = { ...currentData, events: [...currentData.events] };
    const jsonText = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonText], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const now = new Date();
    const ts = now.getFullYear()+(now.getMonth()+1).toString().padStart(2,"0")+now.getDate().toString().padStart(2,"0")+"-"+now.getHours().toString().padStart(2,"0")+now.getMinutes().toString().padStart(2,"0");
    link.download = `timetable_${currentData.short||"unnamed"}_${ts}.json`;
    link.href = url; link.click(); URL.revokeObjectURL(url);
    const m = document.getElementById("jsonModalMessage"); m.innerHTML = '<div class="success">JSON file downloaded!</div>'; setTimeout(()=>m.innerHTML="",3000);
}

function handleJSONFileUpload(event) {
    const file = event.target.files[0]; const s = document.getElementById("fileUploadStatus");
    if (!file) { s.textContent=""; return; }
    if (file.type !== "application/json" && !file.name.endsWith(".json")) { s.innerHTML='<span style="color:#ff6b6b;">Please select a valid JSON file</span>'; return; }
    const reader = new FileReader();
    reader.onload = e => { try { document.getElementById("jsonTextarea").value = e.target.result; s.innerHTML=`<span style="color:#51cf66;">File loaded: ${file.name}</span>`; importJSON(); } catch { s.innerHTML='<span style="color:#ff6b6b;">Error reading file</span>'; } };
    reader.readAsText(file);
}

function importJSON() {
    const jsonText = document.getElementById("jsonTextarea").value.trim();
    const m = document.getElementById("jsonModalMessage");
    if (!jsonText) { m.innerHTML = '<div class="error">Please paste JSON data or upload a file</div>'; return; }
    try {
        const data = JSON.parse(jsonText);
        if (!data.short || !Array.isArray(data.events)) throw new Error("Invalid JSON structure");
        currentData = data;
        presets = [];
        currentData.events.forEach(ev => {
            if (ev[2] && ev[4] && !presets.find(p => p.subject===ev[2] && p.staff===ev[4]))
                presets.push({ subject: ev[2], staff: ev[4], color: ev[5] });
        });
        document.getElementById("shortName").value  = data.short    || "";
        document.getElementById("initials").value   = data.initials || "";
        document.getElementById("tutorGroup").value = data.tutor    || "";
        updateEventsList(); updatePresetsList(); updatePresetSelect();
        m.innerHTML = '<div class="success">JSON imported successfully!</div>'; setTimeout(()=>m.innerHTML="",3000);
    } catch(err) { m.innerHTML = `<div class="error">Error parsing JSON: ${err.message}</div>`; }
}

function exportJSON() {
    currentData.short   = document.getElementById("shortName").value.trim();
    currentData.initials= document.getElementById("initials").value.trim();
    currentData.tutor   = document.getElementById("tutorGroup").value.trim();
    document.getElementById("jsonTextarea").value = JSON.stringify({ ...currentData, events: [...currentData.events] }, null, 2);
    const m = document.getElementById("jsonModalMessage"); m.innerHTML = '<div class="success">JSON exported to textarea</div>'; setTimeout(()=>m.innerHTML="",3000);
}

// ─── Presets ──────────────────────────────────────────────────────────────────

function editPreset(index) {
    const p = presets[index];
    const ns = prompt("Enter new subject:", p.subject); if (ns===null) return;
    const nst= prompt("Enter new staff:", p.staff); if (nst===null) return;
    const nc = prompt("Enter new color (hex):", p.color); if (nc===null) return;
    currentData.events.forEach(ev => { if (ev[2]===p.subject && ev[4]===p.staff) { ev[2]=ns.trim(); ev[4]=nst.trim(); ev[5]=nc; } });
    presets[index] = { subject: ns.trim(), staff: nst.trim(), color: nc };
    updatePresetsList(); updatePresetSelect(); updateEventsList();
}

function updatePresetsList() {
    const container = document.getElementById("presetsList"); container.innerHTML = "";
    presets.forEach((preset, index) => {
        const div = document.createElement("div"); div.className = "preset-section"; div.style.backgroundColor = preset.color; div.style.color = "#000";
        div.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;"><span>${preset.subject} - ${preset.staff}</span><div><button onclick="editPreset(${index})" style="margin:0;padding:4px 8px;font-size:11px;margin-right:5px;">Edit</button><button class="danger" onclick="deletePreset(${index})" style="margin:0;padding:4px 8px;font-size:11px;">Delete</button></div></div>`;
        container.appendChild(div);
    });
    if (!presets.length) container.innerHTML = '<div style="text-align:center;color:#aaa;padding:10px;font-size:12px;">No presets saved yet</div>';
}

function updatePresetSelect() {
    const select = document.getElementById("presetSelect"); const cur = select.value;
    select.innerHTML = '<option value="">Select a preset...</option>';
    presets.forEach((p,i) => { const opt=document.createElement("option"); opt.value=i; opt.textContent=`${p.subject} - ${p.staff}`; select.appendChild(opt); });
    select.value = cur;
}

function applyPreset() {
    const idx = document.getElementById("presetSelect").value; if (!idx) return;
    const p = presets[parseInt(idx)];
    document.getElementById("eventSubject").value = p.subject;
    document.getElementById("eventStaff").value   = p.staff;
    document.getElementById("eventColor").value   = p.color;
}

function deletePreset(index) {
    const p = presets[index];
    const mc = currentData.events.filter(ev => ev[2]===p.subject && ev[4]===p.staff);
    if (!confirm(`Delete this preset?${mc.length?`\n\nAlso deletes ${mc.length} event(s).`:""}`)) return;
    presets.splice(index, 1);
    currentData.events = currentData.events.filter(ev => !(ev[2]===p.subject && ev[4]===p.staff));
    updatePresetsList(); updatePresetSelect(); updateEventsList();
}

// ─── Events ───────────────────────────────────────────────────────────────────

function addEvent() {
    currentEditIndex = -1; document.getElementById("modalTitle").textContent = "Add New Event";
    clearEventForm(); document.getElementById("eventModal").style.display = "block";
}

function editEvent(index) {
    currentEditIndex = index; document.getElementById("modalTitle").textContent = "Edit Event";
    const ev = currentData.events[index];
    document.getElementById("eventDay").value     = ev[0];
    document.getElementById("eventPeriod").value  = ev[1];
    document.getElementById("eventSubject").value = ev[2];
    document.getElementById("eventRoom").value    = ev[3];
    document.getElementById("eventStaff").value   = ev[4];
    document.getElementById("eventColor").value   = ev[5];
    document.getElementById("eventModal").style.display = "block";
}

function clearEventForm() {
    document.getElementById("eventSubject").value = "";
    document.getElementById("eventRoom").value    = "";
    document.getElementById("eventStaff").value   = "";
    document.getElementById("eventColor").value   = "#e3f2fd";
    document.getElementById("presetSelect").value = "";
}

function saveEvent() {
    const day     = parseInt(document.getElementById("eventDay").value);
    const period  = parseInt(document.getElementById("eventPeriod").value);
    const subject = document.getElementById("eventSubject").value.trim();
    const room    = document.getElementById("eventRoom").value.trim();
    const staff   = document.getElementById("eventStaff").value.trim();
    const color   = document.getElementById("eventColor").value;
    if (!subject && !room && !staff) { alert("Please fill in at least one of Subject, Room, or Staff"); return; }
    if (subject && staff) {
        const ep = presets.findIndex(p => p.subject===subject && p.staff===staff);
        if (ep===-1) { presets.push({subject,staff,color}); updatePresetsList(); updatePresetSelect(); }
        else if (presets[ep].color !== color) { presets[ep].color = color; updatePresetsList(); updatePresetSelect(); }
    }
    const ev = [day, period, subject, room, staff, color];
    if (currentEditIndex >= 0) currentData.events[currentEditIndex] = ev; else currentData.events.push(ev);
    updateEventsList(); closeModal();
}

function deleteEvent(index) {
    if (confirm("Delete this event?")) { currentData.events.splice(index, 1); updateEventsList(); }
}

function closeModal() { document.getElementById("eventModal").style.display = "none"; }

function openUploadModal() { document.getElementById("uploadModal").style.display = "block"; renderSubjectMappingsUI(); }
function closeUploadModal() { document.getElementById("uploadModal").style.display = "none"; document.getElementById("pdfUpload").value = ""; }

function updateEventsList() {
    const container = document.getElementById("eventsList"); container.innerHTML = "";
    currentData.events.forEach((ev, index) => {
        const div = document.createElement("div"); div.className = "event-item"; div.style.borderColor = ev[5];
        const dayName = dayNames[ev[0]] || `Day ${ev[0]}`;
        const pname = {6:"PM/Lunch Span",7:"Lunch",8:"P4",9:"P5",10:"After"}[ev[1]] ?? (periodNames[ev[1]] || `Period ${ev[1]}`);
        const details = [ev[2],ev[3],ev[4]].filter(x=>x).join(" ");
        div.innerHTML = `<div>${dayName} - ${pname}</div><div>${details}</div><div class="event-actions"><button onclick="editEvent(${index})">Edit</button><button class="danger" onclick="deleteEvent(${index})">Delete</button></div>`;
        container.appendChild(div);
    });
    if (!currentData.events.length) container.innerHTML = '<div style="text-align:center;color:#aaa;padding:20px;">No events added yet</div>';
}

// ─── PDF Import ───────────────────────────────────────────────────────────────
//
// Layout of the MIS-generated timetable PDF (landscape A4, ~841.9 × 595.3 pts):
//
//   Row 1  y≈544  Title: "Timetable for Name , Tutor , Week A, ..."
//   Row 2  y≈512  Period column headers: AM | P1 | P2 | Break | P3 | PM | Lunch | P4 | P5
//   Rows 3-7      One band per day (Mon–Fri), each ~85 pts tall.
//                 Day labels ("Monday A") appear at the BOTTOM of each band.
//
// Period column x-boundaries (left edge of each column's content area):
//   AM=107, P1=183, P2=260, Break=336, P3=414, PM=490, Lunch=562, P4=644, P5=720, end=841.9
//
// Day band y-boundaries:
//   Monday  label y≈458  → content roughly y∈(header_y, Monday_y+half_gap)
//   Tuesday label y≈372  → etc.
//   ...
// Midpoints between consecutive day labels form the horizontal dividers.

const PDF_COL_BOUNDS = [
    107.0,   // AM
    183.0,   // P1
    260.0,   // P2
    336.0,   // Break
    414.0,   // P3
    490.0,   // PM
    562.0,   // Lunch
    644.0,   // P4
    720.0,   // P5
    841.9,   // right edge
];

// y0 of each day label (from empirical measurement of the PDF).
// These are used to compute row mid-point boundaries.
const DAY_LABEL_Y = [458.3, 372.8, 287.3, 201.8, 116.3];
const HEADER_Y    = 512.3;

function getDayBounds() {
    // Returns [topBound, ...midpoints, bottomBound] so that
    // day i owns items where midpoints[i+1] <= y0 < midpoints[i]
    const mp = [HEADER_Y];
    for (let i = 0; i < DAY_LABEL_Y.length - 1; i++) {
        mp.push((DAY_LABEL_Y[i] + DAY_LABEL_Y[i + 1]) / 2);
    }
    mp.push(0);
    return mp;
}

function getPeriodForX(x) {
    for (let i = 0; i < PDF_COL_BOUNDS.length - 1; i++) {
        if (x >= PDF_COL_BOUNDS[i] && x < PDF_COL_BOUNDS[i + 1]) return i;
    }
    return null;
}

function getDayForY(y, midpoints) {
    for (let i = 0; i < 5; i++) {
        if (y < midpoints[i] && y >= midpoints[i + 1]) return i;
    }
    return null;
}

// Load PDF.js from CDN lazily
function loadPDFJS() {
    return new Promise((resolve, reject) => {
        if (window.pdfjsLib) { resolve(); return; }
        const script = document.createElement("script");
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
        script.onload = () => {
            pdfjsLib.GlobalWorkerOptions.workerSrc =
                "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
            resolve();
        };
        script.onerror = () => reject(new Error("Failed to load PDF.js — check your internet connection"));
        document.head.appendChild(script);
    });
}

async function processPDF() {
    const fileInput = document.getElementById("pdfUpload");
    const file = fileInput.files[0];
    if (!file) { alert("Please select a PDF file"); return; }
    if (file.type !== "application/pdf") { alert("Please select a valid PDF file"); return; }

    const statusDiv = document.getElementById("pdfStatus");
    statusDiv.textContent = "Loading PDF.js…";

    try {
        await loadPDFJS();
        statusDiv.textContent = "Parsing timetable…";

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

        const allEvents = [];
        let globalName = "", globalShort = "", globalTutor = "";

        const midpoints = getDayBounds();

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();

            // Collect all non-empty text items with their baseline position
            const items = textContent.items
                .filter(it => it.str && it.str.trim().length > 0)
                .map(it => ({
                    text: it.str.trim(),
                    x:   it.transform[4],   // x0 (left edge)
                    y:   it.transform[5],   // y0 (baseline, increasing upward)
                }));

            // ── Parse header line ──────────────────────────────────────────
            if (pageNum === 1) {
                const fullText = items.map(i => i.text).join(" ");
                const m = fullText.match(/Timetable for (.+?)\s*,\s*([A-Z0-9]+)\s*,\s*Week\s+([AB])/i);
                if (m) {
                    globalName  = m[1].trim();
                    globalTutor = m[2].trim();
                    globalShort = globalName.split(" ")[0].substring(0, 6);
                }
            }

            // Week A (page 1) → global day indices 0–4
            // Week B (page 2) → global day indices 5–9
            const dayOffset = (pageNum - 1) * 5;

            // ── Assign each item to a (day, period) cell ──────────────────
            const cells = {};   // key "localDay_periodIdx" → string[]

            for (const item of items) {
                if (item.y >= HEADER_Y - 2) continue;   // skip header / title rows
                if (item.x < PDF_COL_BOUNDS[0] - 2) continue; // skip left label zone

                const periodIdx = getPeriodForX(item.x);
                const dayIdx    = getDayForY(item.y, midpoints);

                if (periodIdx === null || dayIdx === null) continue;

                const key = `${dayIdx}_${periodIdx}`;
                if (!cells[key]) cells[key] = [];
                cells[key].push(item.text);
            }

            // ── Merge fragments and clean up ───────────────────────────────
            const rawCells = {};
            for (const [key, parts] of Object.entries(cells)) {
                let txt = parts.join(" ").replace(/\s+/g, " ").trim();
                // Strip injected time-range strings like "(08:55-09:10)"
                txt = txt.replace(/\(\d{2}:\d{2}-\d{2}:\d{2}\)\s*/g, "").trim();
                if (txt) rawCells[key] = txt;
            }

            // ── PM / Lunch span detection ──────────────────────────────────
            // period 5 = PM, period 6 = Lunch (PDF indices)
            // If the same subject appears in both PM and Lunch for a given day,
            // collapse into a single span event (JS period 6 = PM/Lunch span).
            const suppressedKeys = new Set();

            for (let d = 0; d < 5; d++) {
                const pmKey    = `${d}_5`;
                const lunchKey = `${d}_6`;
                const pmText    = rawCells[pmKey]    || "";
                const lunchText = rawCells[lunchKey] || "";

                if (pmText && lunchText) {
                    const pmSub    = classifySubject(pmText);
                    const lunchSub = classifySubject(lunchText);
                    if (pmSub && lunchSub && pmSub.subject === lunchSub.subject) {
                        // Merge: use the longer text (more detail)
                        rawCells[`${d}_SPAN`] = pmText.length >= lunchText.length ? pmText : lunchText;
                        suppressedKeys.add(pmKey);
                        suppressedKeys.add(lunchKey);
                    }
                }
            }

            // ── Convert cells to events ────────────────────────────────────
            for (const [key, text] of Object.entries(rawCells)) {
                if (suppressedKeys.has(key)) continue;

                let localDay, pdfPeriod, isSpan = false;

                if (key.endsWith("_SPAN")) {
                    localDay  = parseInt(key.split("_")[0]);
                    pdfPeriod = null;
                    isSpan    = true;
                } else {
                    const parts = key.split("_");
                    localDay  = parseInt(parts[0]);
                    pdfPeriod = parseInt(parts[1]);
                }

                const subjectInfo = classifySubject(text);
                if (!subjectInfo) continue;   // unrecognised subject — skip

                const { room, staff } = extractRoomAndStaff(text);
                const globalDay = localDay + dayOffset;

                // Map PDF period index → JS event period value
                // PDF: 0=AM, 1=P1, 2=P2, 3=Break, 4=P3, 5=PM, 6=Lunch, 7=P4, 8=P5
                // JS:  0=AM, 1=P1, 2=P2, 3=Break, 4=P3, 5=PM, 6=PM/LunchSpan, 7=Lunch, 8=P4, 9=P5
                let jsperiod;
                if (isSpan)              jsperiod = 6;
                else if (pdfPeriod===6)  jsperiod = 7;
                else if (pdfPeriod===7)  jsperiod = 8;
                else if (pdfPeriod===8)  jsperiod = 9;
                else                     jsperiod = pdfPeriod;

                allEvents.push([globalDay, jsperiod, subjectInfo.subject, room, staff, subjectInfo.color]);
            }
        }

        // Deduplicate events (same day+period+subject+room+staff+color)
        const seen = new Set();
        const uniqueEvents = allEvents.filter(ev => {
            const k = ev.join("|");
            if (seen.has(k)) return false;
            seen.add(k); return true;
        });

        // Apply to app state
        currentData.events = uniqueEvents;
        if (globalName) {
            currentData.short    = globalShort;
            currentData.initials = globalName.split(" ").map(w => w[0]).join("").toUpperCase();
            currentData.tutor    = globalTutor;
            document.getElementById("shortName").value  = currentData.short;
            document.getElementById("initials").value   = currentData.initials;
            document.getElementById("tutorGroup").value = currentData.tutor;
        }

        // Rebuild presets from imported events
        presets = [];
        currentData.events.forEach(ev => {
            if (ev[2] && ev[4] && !presets.find(p => p.subject===ev[2] && p.staff===ev[4]))
                presets.push({ subject: ev[2], staff: ev[4], color: ev[5] });
        });

        updateEventsList(); updatePresetsList(); updatePresetSelect();
        statusDiv.innerHTML = `<span style="color:#51cf66;">&#10003; Imported ${uniqueEvents.length} events for ${globalName} (${globalTutor})</span>`;

    } catch(err) {
        console.error(err);
        document.getElementById("pdfStatus").innerHTML =
            `<span style="color:#ff6b6b;">Error: ${err.message}</span>`;
    }
}

// ─── Subject classification ───────────────────────────────────────────────────

function classifySubject(text) {
    if (!text || !text.trim()) return null;
    const lower = text.toLowerCase();
    for (const mapping of subjectMappings) {
        for (const kw of mapping.keywords) {
            if (lower.includes(kw.toLowerCase())) {
                return { subject: mapping.subject, color: mapping.color };
            }
        }
    }
    return null;
}

// ─── Room & staff extraction ──────────────────────────────────────────────────
// Mirrors main.py logic: examine the last 1–2 words of the cell text for codes.
// Staff codes: 1–3 uppercase letters (e.g. "VF", "ML", "GF")
// Room codes:  1–3 letters + 1–2 digits, or special strings (6F, LIB, MUS…)

function extractRoomAndStaff(text) {
    const words = text.trim().split(/\s+/);
    let room = "", staff = "";

    const clean = w => w.toUpperCase().replace(/[^A-Z0-9]/g, "");

    const staffRegex = /^[A-Z]{1,3}$/;
    const roomRegex  = /^([A-Z]{1,3}\d{1,2}|6F|LIBRARY|LIB|MUS|ART\d?|GYM|HALL|SEN|HT|T\d)$/;

    const last       = clean(words[words.length - 1] || "");
    const secondLast = clean(words[words.length - 2] || "");

    // Last word: staff?
    if (staffRegex.test(last) && !roomRegex.test(last)) {
        staff = last;
    }
    // Second-to-last: room?
    if (roomRegex.test(secondLast)) {
        room = secondLast === "LIBRARY" ? "LIB" : secondLast;
    }
    // If no room yet, maybe last word is a room
    if (!room && roomRegex.test(last)) {
        room  = last === "LIBRARY" ? "LIB" : last;
        staff = "";
    }

    return { room, staff };
}

// ─── Subject mapping UI ───────────────────────────────────────────────────────

function renderSubjectMappingsUI() {
    const container = document.getElementById("subjectMappingsContainer");
    if (!container) return;
    container.innerHTML = "";
    subjectMappings.forEach((mapping, index) => {
        const row = document.createElement("div");
        row.style.cssText = "display:flex;gap:6px;align-items:center;margin-bottom:6px;";
        row.innerHTML = `
<input type="text" value="${mapping.subject}" placeholder="Subject"
    style="width:68px;padding:4px;background:#2a2a3e;color:#e0e0e0;border:1px solid #555;border-radius:4px;"
    onchange="updateMapping(${index},'subject',this.value)">
<input type="text" value="${mapping.keywords.join(', ')}" placeholder="keywords, comma separated"
    style="flex:1;min-width:0;padding:4px;background:#2a2a3e;color:#e0e0e0;border:1px solid #555;border-radius:4px;"
    onchange="updateMapping(${index},'keywords',this.value)">
<input type="color" value="${mapping.color}"
    style="width:36px;height:28px;border:none;cursor:pointer;background:none;padding:0;"
    onchange="updateMapping(${index},'color',this.value)">
<button class="danger" onclick="deleteMapping(${index})" style="padding:4px 8px;font-size:11px;margin:0;">&#215;</button>
`;
        container.appendChild(row);
    });
}

function updateMapping(index, field, value) {
    if (field === "keywords") {
        subjectMappings[index].keywords = value.split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
    } else {
        subjectMappings[index][field] = value;
    }
}

function deleteMapping(index) { subjectMappings.splice(index, 1); renderSubjectMappingsUI(); }

function addMapping() {
    subjectMappings.push({ keywords: [], subject: "New", color: "#aaaaaa" });
    renderSubjectMappingsUI();
}

// ─── Timetable generation ─────────────────────────────────────────────────────

function generateTimetable() {
    currentData.short   = document.getElementById("shortName").value.trim();
    currentData.initials= document.getElementById("initials").value.trim();
    currentData.tutor   = document.getElementById("tutorGroup").value.trim();

    const nameDisplay = document.getElementById("nameDisplay").value;
    const tbody = document.getElementById("timetableBody"); tbody.innerHTML = "";

    const activeDays          = dayNames.filter((_,i) => selectedDays[i]);
    const activePeriodIndices = periodNames.map((_,i) => i).filter(i => selectedPeriods[i]);

    const headerRow = document.createElement("tr"); headerRow.className = "header-row";
    const cornerCell = document.createElement("th");

    let displayText = "";
    switch(nameDisplay) {
        case "short":    displayText = currentData.short.length>8 ? currentData.short.substring(0,8)+"…" : currentData.short; break;
        case "initials": displayText = currentData.initials; break;
        case "tutor":    displayText = currentData.tutor; break;
        case "both":     displayText = (currentData.tutor && currentData.initials) ? `${currentData.tutor} ${currentData.initials}` : ""; break;
        default:         displayText = ""; break;
    }
    cornerCell.textContent = displayText; headerRow.appendChild(cornerCell);
    activeDays.forEach(day => { const th=document.createElement("th"); th.textContent=day; headerRow.appendChild(th); });
    tbody.appendChild(headerRow);

    for (let i = 0; i < activePeriodIndices.length; i++) {
        const periodIndex = activePeriodIndices[i];
        const row = document.createElement("tr");
        const ph  = document.createElement("th"); ph.className = "period-header"; ph.textContent = periodNames[periodIndex];
        let displayHeight = customPeriodHeights[periodIndex];
        if (!displayHeight) ph.classList.add("half-height");
        row.appendChild(ph);

        dayNames.forEach((_,dayIndex) => {
            if (!selectedDays[dayIndex]) return;
            const cell = document.createElement("td"); cell.className = "timetable-cell";
            if (!displayHeight) cell.classList.add("half-height");

            let event = null;
            const period6Event = currentData.events.find(e => e[0]===dayIndex && e[1]===6);
            const pmVisible    = selectedPeriods[5];
            const lunchVisible = selectedPeriods[6];
            const canSpan      = pmVisible && lunchVisible;

            if (period6Event && periodIndex===5 && canSpan) {
                event = period6Event; cell.style.borderBottom="none"; cell.style.position="relative";
                if (!customPeriodHeights[5]) cell.classList.add("half-height");
            } else if (period6Event && periodIndex===6 && canSpan) {
                event = period6Event; cell.style.borderTop="none"; cell.style.backgroundColor=period6Event[5]; cell.style.position="relative";
                if (!customPeriodHeights[6]) cell.classList.add("half-height");
            } else if (period6Event && periodIndex===5 && pmVisible && !lunchVisible) {
                event = period6Event; if (!customPeriodHeights[5]) cell.classList.add("half-height");
            } else if (period6Event && periodIndex===6 && lunchVisible && !pmVisible) {
                event = period6Event; if (!customPeriodHeights[6]) cell.classList.add("half-height");
            } else {
                let jsPeriod;
                if (periodIndex===6) jsPeriod=7; else if (periodIndex===7) jsPeriod=8;
                else if (periodIndex===8) jsPeriod=9; else if (periodIndex===9) jsPeriod=10;
                else jsPeriod=periodIndex;
                event = currentData.events.find(e => e[0]===dayIndex && e[1]===jsPeriod);
                if (!displayHeight) cell.classList.add("half-height");
            }

            if (event) {
                cell.classList.add("event-cell"); cell.style.backgroundColor = event[5];
                const isSpanningEvent = event[1]===6 && pmVisible && lunchVisible;
                if (isSpanningEvent && periodIndex===5) {
                    cell.innerHTML = `<div style="position:absolute;bottom:1px;left:50%;transform:translateX(-50%);font-size:8px;">${event[2]}</div>`;
                } else if (isSpanningEvent && periodIndex===6) {
                    const details = [event[3],event[4]].filter(x=>x).join(" ");
                    cell.innerHTML = `<div style="position:absolute;top:1px;left:50%;transform:translateX(-50%);font-size:8px;">${details}</div>`;
                } else if (displayHeight) {
                    const details = [event[3],event[4]].filter(x=>x).join(" ");
                    cell.innerHTML = `<div>${event[2]}</div><div style="font-size:8px;">${details}</div>`;
                } else {
                    const details = [event[3],event[4]].filter(x=>x).join(" ");
                    cell.innerHTML = `<div style="font-size:8px;">${details}</div>`;
                }
            }
            row.appendChild(cell);
        });
        tbody.appendChild(row);
    }
}

function downloadImage() {
    const wrapper = document.getElementById("timetableWrapper");
    const now = new Date();
    const ts = now.getFullYear()+(now.getMonth()+1).toString().padStart(2,"0")+now.getDate().toString().padStart(2,"0")+"-"+now.getHours().toString().padStart(2,"0")+now.getMinutes().toString().padStart(2,"0")+now.getSeconds().toString().padStart(2,"0");
    html2canvas(wrapper, { backgroundColor: "#ffffff", scale: 2, useCORS: true, allowTaint: true }).then(orig => {
        const padded = document.createElement("canvas"); const ctx = padded.getContext("2d");
        padded.width = orig.width+16; padded.height = orig.height+16;
        ctx.fillStyle = "#ffffff"; ctx.fillRect(0,0,padded.width,padded.height);
        ctx.drawImage(orig,8,8);
        ctx.strokeStyle="#333"; ctx.lineWidth=3;
        ctx.beginPath(); ctx.moveTo(8,8); ctx.lineTo(orig.width+8,8); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(8,8); ctx.lineTo(8,orig.height+8); ctx.stroke();
        const link = document.createElement("a"); link.download=`timetable_${currentData.short||"unnamed"}_${ts}.png`; link.href=padded.toDataURL("image/png"); link.click();
    }).catch(err => { console.error(err); alert("Error generating image."); });
}

// ─── Window events ────────────────────────────────────────────────────────────

window.onclick = function(event) {
    if (event.target === document.getElementById("eventModal"))       closeModal();
    else if (event.target === document.getElementById("uploadModal")) closeUploadModal();
    else if (event.target === document.getElementById("jsonModal"))   closeJSONModal();
};

document.addEventListener("DOMContentLoaded", init);
