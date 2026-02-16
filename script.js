// ─── Global state ────────────────────────────────────────────────────────────
let currentData = {
    short: "",
    initials: "",
    tutor: "",
    events: [],
};

let currentEditIndex = -1;
let presets = [];
let includeStudyPeriods = true;  // Default: include study periods from PDF import
let pdfDaysAsRows = true;  // Default: staff view (days as rows, periods as columns)

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
    { keywords: ["ks4 ict", "ict wjec"],    subject: "IT",    color: "#4682b4" },
    { keywords: ["construction"],           subject: "Const", color: "#cd853f" },
    { keywords: ["core pe"],                subject: "PE",    color: "#4169e1" },
    { keywords: ["enterprise"],             subject: "Ent",   color: "#ff8c00" },
    { keywords: ["design technology"],      subject: "DT",    color: "#9370db" },
    { keywords: ["sociology"],              subject: "Soci",  color: "#ff69b4" },
    // Tutor cells always BEGIN with "Year N:" — the startsWithKeywords list is
    // checked with startsWith() rather than includes(), so "Year 10:" in the
    // middle of a lesson description (e.g. English Language) won't match.
    // The suffix keywords (": gb" etc.) are safe to keep as includes() matches
    // because they only ever appear in actual tutor cell text.
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
      ],
      // These are checked with startsWith() to avoid matching lesson descriptions
      // that contain "Year 10:" mid-string (e.g. "KS4 English Language: Year 10: G1")
      startsWithKeywords: [
        "year 7:","year 8:","year 9:","year 10:","year 11:","year 12:","year 13:",
      ],
      subject: "Tutor", color: "#d3d3d3" },
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
    { keywords: ["dance"],              subject: "Dance", color: "#db7093" },
    { keywords: ["art"],                    subject: "Art",   color: "#dc143c" },
    { keywords: ["photography"],            subject: "Photo", color: "#9370db" },
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

let currentPresetEditIndex = -1;

function addPreset() {
    currentPresetEditIndex = -1;
    document.getElementById("presetModalTitle").textContent = "Add Preset";
    document.getElementById("presetSubject").value = "";
    document.getElementById("presetStaff").value = "";
    document.getElementById("presetColor").value = "#e3f2fd";
    document.getElementById("presetModal").style.display = "block";
}

function editPreset(index) {
    currentPresetEditIndex = index;
    const p = presets[index];
    document.getElementById("presetModalTitle").textContent = "Edit Preset";
    document.getElementById("presetSubject").value = p.subject;
    document.getElementById("presetStaff").value = p.staff;
    document.getElementById("presetColor").value = p.color;
    document.getElementById("presetModal").style.display = "block";
}

function savePreset() {
    const subject = document.getElementById("presetSubject").value.trim();
    const staff = document.getElementById("presetStaff").value.trim();
    const color = document.getElementById("presetColor").value;
    
    if (!subject) {
        alert("Please enter a subject name");
        return;
    }
    
    if (currentPresetEditIndex >= 0) {
        // Editing existing preset - update all events that use this preset
        const oldPreset = presets[currentPresetEditIndex];
        currentData.events.forEach(ev => {
            if (ev[2] === oldPreset.subject && ev[4] === oldPreset.staff) {
                ev[2] = subject;
                ev[4] = staff;
                ev[5] = color;
            }
        });
        presets[currentPresetEditIndex] = { subject, staff, color };
    } else {
        // Adding new preset
        presets.push({ subject, staff, color });
    }
    
    updatePresetsList();
    updatePresetSelect();
    updateEventsList();
    closePresetModal();
}

function deletePreset(index) {
    if (confirm("Delete this preset?")) {
        presets.splice(index, 1);
        updatePresetsList();
        updatePresetSelect();
    }
}

function closePresetModal() {
    document.getElementById("presetModal").style.display = "none";
}

function updatePresetsList() {
    const container = document.getElementById("presetsList"); container.innerHTML = "";
    presets.forEach((preset, index) => {
        const div = document.createElement("div");
        div.className = "event-item";
        div.style.borderColor = preset.color;
        div.style.backgroundColor = preset.color + "20";
        div.innerHTML = `
            <div class="event-item-content" style="flex:1;">
                <strong>${preset.subject}</strong>
                ${preset.staff ? `<div class="event-item-details">${preset.staff}</div>` : ''}
            </div>
            <div class="event-actions">
                <button onclick="editPreset(${index})">Edit</button>
                <button class="danger" onclick="deletePreset(${index})">×</button>
            </div>`;
        container.appendChild(div);
    });
    if (!presets.length) container.innerHTML = '<div style="text-align:center;color:var(--text-secondary);padding:10px;font-size:12px;">No presets saved yet</div>';
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
    const container = document.getElementById("eventsList"); 
    container.innerHTML = "";
    
    if (!currentData.events.length) {
        container.innerHTML = '<div style="text-align:center;color:var(--text-secondary);padding:20px;font-size:12px;">No events added yet</div>';
        return;
    }
    
    // Sort events by day, then by period
    const sortedEvents = currentData.events
        .map((ev, originalIndex) => ({ev, originalIndex}))
        .sort((a, b) => {
            if (a.ev[0] !== b.ev[0]) return a.ev[0] - b.ev[0]; // Sort by day
            return a.ev[1] - b.ev[1]; // Then by period
        });
    
    // Group by day
    const eventsByDay = {};
    sortedEvents.forEach(({ev, originalIndex}) => {
        const dayIndex = ev[0];
        if (!eventsByDay[dayIndex]) eventsByDay[dayIndex] = [];
        eventsByDay[dayIndex].push({ev, originalIndex});
    });
    
    // Render each day group
    Object.keys(eventsByDay).sort((a, b) => parseInt(a) - parseInt(b)).forEach(dayIndex => {
        const dayName = dayNames[parseInt(dayIndex)] || `Day ${dayIndex}`;
        
        // Day header
        const dayHeader = document.createElement("div");
        dayHeader.className = "day-header";
        dayHeader.textContent = dayName;
        container.appendChild(dayHeader);
        
        // Events for this day
        eventsByDay[dayIndex].forEach(({ev, originalIndex}) => {
            const div = document.createElement("div");
            div.className = "event-item";
            div.style.borderColor = ev[5];
            
            const pname = {6:"PM/Lunch",7:"Lunch",8:"P4",9:"P5",10:"After"}[ev[1]] ?? (periodNames[ev[1]] || `P${ev[1]}`);
            const details = [ev[3], ev[4]].filter(x=>x).join(" • ");
            
            div.innerHTML = `
                <div class="event-item-label">${pname}</div>
                <div class="event-item-content">
                    ${ev[2] ? `<strong>${ev[2]}</strong>` : '<strong>—</strong>'}
                    ${details ? `<div class="event-item-details">${details}</div>` : ''}
                </div>
                <div class="event-actions">
                    <button onclick="editEvent(${originalIndex})">Edit</button>
                    <button class="danger" onclick="deleteEvent(${originalIndex})">×</button>
                </div>`;
            container.appendChild(div);
        });
    });
}

// ─── PDF Import ───────────────────────────────────────────────────────────────
//
// STAFF VIEW Layout (days as rows, periods as columns):
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

// PARENT VIEW Layout (days as columns, periods as rows):
// Transposed layout where days go across and periods go down
// Day column x-boundaries (left edge of each day column):
const PDF_DAY_COL_BOUNDS = [
    107.0,   // Monday
    245.0,   // Tuesday
    383.0,   // Wednesday  
    521.0,   // Thursday
    660.0,   // Friday
    800.0,   // right edge
];

// Period row y-boundaries (PDF.js uses bottom-up coordinates, y increases upward)
// Page height is ~595pt for A4 landscape
// Based on pdfplumber table extraction showing actual row structure:
// Row 1 (AM Tutor 08:55-09:10): y=95-~110 → PDF.js: 500-485
// Row 2 (P1 09:10-10:10): y=~110-~183 → PDF.js: 485-412
// Row 3 (P2 10:10-11:10): y=~183-~250 → PDF.js: 412-345  
// Row 4 (Break 11:10-11:30): y=~250-~270 → PDF.js: 345-325
// Row 5 (P3 11:30-12:30): y=~270-~330 → PDF.js: 325-265
// Row 6 (PM Tutor 12:30-12:45): y=~330-~365 → PDF.js: 265-230
// Row 7 (Lunch 12:45-13:30): y=~365-~405 → PDF.js: 230-190
// Row 8 (P4 13:30-14:30): y=~405-~465 → PDF.js: 190-130
// Row 9 (P5 14:30-15:30): y=~465-~492 → PDF.js: 130-103
const PDF_PERIOD_ROW_Y = [
    530.0,  // Above table
    500.0,  // Top of AM Tutor (595 - 95)
    473.0,  // Bottom of AM Tutor - extended to 483 to ensure staff codes at y=485 are captured
    412.0,  // Bottom of P1 / Top of P2 (595 - 183)
    345.0,  // Bottom of P2 / Top of Break (595 - 250)
    325.0,  // Bottom of Break / Top of P3 (595 - 270)
    265.0,  // Bottom of P3 / Top of PM Tutor (595 - 330)
    243.0,  // Bottom of PM Tutor / Top of Lunch (split at y=352, just above spillover at 241.7)
    190.0,  // Bottom of Lunch / Top of P4 (595 - 405)
    130.0,  // Bottom of P4 / Top of P5 (595 - 465)
    103.0,  // Bottom of P5 (595 - 492, extended to capture staff codes at y=486)
];
const PARENT_HEADER_Y = 520.0;  // Day headers

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

// Parent view helper functions (days as columns, periods as rows)
function getDayForX_ParentView(x) {
    for (let i = 0; i < PDF_DAY_COL_BOUNDS.length - 1; i++) {
        if (x >= PDF_DAY_COL_BOUNDS[i] && x < PDF_DAY_COL_BOUNDS[i + 1]) return i;
    }
    return null;
}

function getPeriodBounds_ParentView() {
    // Simply return the boundaries as-is
    return PDF_PERIOD_ROW_Y;
}

function getPeriodForY_ParentView(y, boundaries) {
    // boundaries represent the edges between table rows
    // boundaries[0] = 530 (above table)
    // boundaries[1] = 500 (top of AM Tutor) 
    // boundaries[2] = 485 (bottom of AM Tutor / top of P1)
    // ... and so on
    // Period indices: 0=AM Tutor, 1=P1, 2=P2, 3=Break, 4=P3, 5=PM Tutor, 6=Lunch, 7=P4, 8=P5
    
    // Period i occupies the space: boundaries[i+1] >= y > boundaries[i+2]
    // Changed to >= to include items exactly at boundaries
    for (let i = 0; i < 9; i++) {  // 9 periods
        if (y <= boundaries[i + 1] && y >= boundaries[i + 2]) {
            return i;
        }
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
    
    // Read the include study periods checkbox
    const includeStudyCheckbox = document.getElementById("includeStudyPeriods");
    if (includeStudyCheckbox) {
        includeStudyPeriods = includeStudyCheckbox.checked;
    }
    
    // Read the layout orientation toggle
    const daysAsRowsCheckbox = document.getElementById("pdfDaysAsRows");
    if (daysAsRowsCheckbox) {
        pdfDaysAsRows = daysAsRowsCheckbox.checked;
    }

    try {
        await loadPDFJS();
        statusDiv.textContent = "Parsing timetable…";

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

        const allEvents = [];
        let globalName = "", globalShort = "", globalTutor = "";

        const midpoints = pdfDaysAsRows ? getDayBounds() : getPeriodBounds_ParentView();

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
                    w:   it.width,          // text item width (used for span detection)
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
            // cells stores { texts: string[], maxX1: number } per key.
            // maxX1 tracks the rightmost edge of any text item in the cell,
            // used to detect physically-spanning PM/Lunch lessons.
            const cells = {};   // key "localDay_periodIdx" → { texts, maxX1 }

            for (const item of items) {
                let periodIdx, dayIdx;
                
                if (pdfDaysAsRows) {
                    // Staff view: days are rows, periods are columns
                    if (item.y >= HEADER_Y - 2) continue;   // skip header / title rows
                    if (item.x < PDF_COL_BOUNDS[0] - 2) continue; // skip left label zone
                    
                    periodIdx = getPeriodForX(item.x);
                    dayIdx    = getDayForY(item.y, midpoints);
                } else {
                    // Parent view: days are columns, periods are rows
                    if (item.y >= PARENT_HEADER_Y - 2) continue;   // skip header / title rows
                    if (item.x < PDF_DAY_COL_BOUNDS[0] - 2) continue; // skip left label zone
                    
                    dayIdx    = getDayForX_ParentView(item.x);
                    periodIdx = getPeriodForY_ParentView(item.y, midpoints);
                }

                if (periodIdx === null || dayIdx === null) continue;

                const key = `${dayIdx}_${periodIdx}`;
                if (!cells[key]) cells[key] = { texts: [], maxX1: 0 };
                cells[key].texts.push(item.text);
                // item.w is the text item width from PDF.js
                const itemX1 = item.x + (item.w || 0);
                if (itemX1 > cells[key].maxX1) cells[key].maxX1 = itemX1;
            }

            // ── Merge fragments and clean up ───────────────────────────────
            const rawCells = {};    // key → string
            const cellMaxX1 = {};   // key → number (rightmost x1 seen in cell)
            for (const [key, cell] of Object.entries(cells)) {
                let txt = cell.texts.join(" ").replace(/\s+/g, " ").trim();
                // Strip injected time-range strings like "(08:55-09:10)"
                txt = txt.replace(/\(\d{2}:\d{2}-\d{2}:\d{2}\)\s*/g, "").trim();
                if (txt) {
                    rawCells[key] = txt;
                    cellMaxX1[key] = cell.maxX1;
                }
            }

            // ── PM / Lunch span detection ──────────────────────────────────
            // period 5 = PM, period 6 = Lunch (PDF indices)
            // Two scenarios produce a PM/Lunch span event (JS period 6):
            //
            // A) DOUBLE-ENTRY: The same lesson appears in BOTH the PM cell and
            //    the Lunch cell (older MIS export style). Detected by matching
            //    subject in both cells.
            //
            // B) PHYSICAL SPAN (staff view only): The lesson appears only in the PM cell but its
            //    text item extends visually into the Lunch column.
            //
            // C) PARENT VIEW SPANNING: PM Tutor has lesson details,
            //    Lunch has just the staff code, room, or very short continuation.
            const suppressedKeys = new Set();
            const LUNCH_COL_LEFT = PDF_COL_BOUNDS[6]; // 562

            for (let d = 0; d < 5; d++) {
                const pmKey    = `${d}_5`;
                const lunchKey = `${d}_6`;
                const pmText    = rawCells[pmKey]    || "";
                const lunchText = rawCells[lunchKey] || "";

                if (pmText && lunchText) {
                    const pmSub    = classifySubject(pmText);
                    const lunchSub = classifySubject(lunchText);
                    
                    // Scenario A: Both cells have same subject (old style)
                    if (pmSub && lunchSub && pmSub.subject === lunchSub.subject) {
                        const combinedText = pmText + " " + lunchText;
                        rawCells[`${d}_SPAN`] = combinedText;
                        suppressedKeys.add(pmKey);
                        suppressedKeys.add(lunchKey);
                    }
                    // Scenario C: PM has subject, Lunch is very short (likely just staff/room)
                    else if (pmSub && !lunchSub && lunchText.length <= 10) {
                        // Lunch has no classifiable subject and is short (≤10 chars)
                        // This is likely a staff code or room spillover
                        const combinedText = pmText + " " + lunchText;
                        rawCells[`${d}_SPAN`] = combinedText;
                        suppressedKeys.add(pmKey);
                        suppressedKeys.add(lunchKey);
                    }
                } else if (pmText && !lunchText && pdfDaysAsRows) {
                    // Scenario B: PM lesson physically spans into Lunch column (staff view only)
                    const pmX1 = cellMaxX1[pmKey] || 0;
                    const physicallySpans = pmX1 >= LUNCH_COL_LEFT;
                    
                    if (physicallySpans) {
                        rawCells[`${d}_SPAN`] = pmText;
                        suppressedKeys.add(pmKey);
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
    
    // Filter out "6th Form Attendance" periods entirely - don't add them to timetable
    if (lower.includes("6th form attendance") || lower.includes("attendance y1")) {
        return null;
    }
    
    // Filter out study periods if the toggle is off
    if (!includeStudyPeriods && lower.includes("6th form study")) {
        return null;
    }
    
    for (const mapping of subjectMappings) {
        // Regular includes() keywords
        for (const kw of (mapping.keywords || [])) {
            if (lower.includes(kw.toLowerCase())) {
                return { subject: mapping.subject, color: mapping.color };
            }
        }
        // startsWith() keywords — used for Tutor to avoid false positives where
        // lesson descriptions contain "Year 10:" mid-string
        // (e.g. "KS4 English Language: Year 10: G1 BM")
        for (const kw of (mapping.startsWithKeywords || [])) {
            if (lower.startsWith(kw.toLowerCase())) {
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
        const kwVal = (mapping.keywords || []).join(", ");
        const swVal = (mapping.startsWithKeywords || []).join(", ");
        // Show startsWith field only for rows that already have one (e.g. Tutor)
        const swField = swVal ? `<input type="text" value="${swVal}" placeholder="startsWith keywords"
    title="These keywords are matched at the START of cell text only (safer for common words)"
    style="flex:1;min-width:0;padding:4px;background:#1e1e30;color:#c0c0e0;border:1px solid #447;border-radius:4px;font-style:italic;"
    onchange="updateMapping(${index},'startsWithKeywords',this.value)">` : "";
        row.innerHTML = `
<input type="text" value="${mapping.subject}" placeholder="Subject"
    style="width:68px;padding:4px;background:#2a2a3e;color:#e0e0e0;border:1px solid #555;border-radius:4px;"
    onchange="updateMapping(${index},'subject',this.value)">
<input type="text" value="${kwVal}" placeholder="keywords, comma separated"
    style="flex:1;min-width:0;padding:4px;background:#2a2a3e;color:#e0e0e0;border:1px solid #555;border-radius:4px;"
    onchange="updateMapping(${index},'keywords',this.value)">
${swField}
<input type="color" value="${mapping.color}"
    style="width:36px;height:28px;border:none;cursor:pointer;background:none;padding:0;"
    onchange="updateMapping(${index},'color',this.value)">
<button class="danger" onclick="deleteMapping(${index})" style="padding:4px 8px;font-size:11px;margin:0;">&#215;</button>
`;
        container.appendChild(row);
    });
}

function updateMapping(index, field, value) {
    if (field === "keywords" || field === "startsWithKeywords") {
        subjectMappings[index][field] = value.split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
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
    else if (event.target === document.getElementById("presetModal")) closePresetModal();
};

// ─── Theme toggle ─────────────────────────────────────────────────────────────

function toggleTheme() {
    const body = document.body;
    const text = document.querySelector('.theme-text');
    
    body.classList.toggle('light-theme');
    
    // Update text
    if (body.classList.contains('light-theme')) {
        text.textContent = 'Light';
        localStorage.setItem('theme', 'light');
    } else {
        text.textContent = 'Dark';
        localStorage.setItem('theme', 'dark');
    }
}

// Load saved theme preference
function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    const text = document.querySelector('.theme-text');
    
    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
        if (text) text.textContent = 'Light';
    } else {
        if (text) text.textContent = 'Dark';
    }
}

document.addEventListener("DOMContentLoaded", () => {
    loadTheme();
    init();
});
