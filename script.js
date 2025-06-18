// Global state
let currentData = {
    short: "",
    initials: "",
    tutor: "",
    events: [],
};

let currentEditIndex = -1;
let presets = [];

const dayNames = [
    "Mon1",
    "Tue1",
    "Wed1",
    "Thu1",
    "Fri1",
    "Mon2",
    "Tue2",
    "Wed2",
    "Thu2",
    "Fri2",
];
const periodNames = [
    "AM",
    "P1",
    "P2",
    "Break",
    "P3",
    "PM",
    "Lunch",
    "P4",
    "P5",
    "After",
];
const periodHeights = [
    false,
    true,
    true,
    false,
    true,
    false,
    false,
    true,
    true,
    true,
];

let selectedDays = Array(10).fill(true);
let selectedPeriods = Array(10).fill(true);
let customPeriodHeights = [...periodHeights];

// Initialize the application
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

    // Create the grid structure
    container.innerHTML = `
<div class="days-grid">
<div class="week-column">
<div class="week-header">
<button class="week-button" onclick="toggleWeek(1)">Week 1</button>
</div>
<div id="week1Days"></div>
</div>
<div class="week-column">
<div class="week-header">
<button class="week-button" onclick="toggleWeek(2)">Week 2</button>
</div>
<div id="week2Days"></div>
</div>
</div>
`;

    const week1Container = document.getElementById("week1Days");
    const week2Container = document.getElementById("week2Days");

    // Add Week 1 days (Mon1-Fri1, indices 0-4)
    for (let i = 0; i < 5; i++) {
        const div = document.createElement("div");
        div.className = "checkbox-item";
        div.innerHTML = `
<input type="checkbox" id="day${i}" ${selectedDays[i] ? "checked" : ""} 
onchange="toggleDay(${i})">
<label for="day${i}">${dayNames[i]}</label>
`;
        week1Container.appendChild(div);
    }

    // Add Week 2 days (Mon2-Fri2, indices 5-9)
    for (let i = 5; i < 10; i++) {
        const div = document.createElement("div");
        div.className = "checkbox-item";
        div.innerHTML = `
<input type="checkbox" id="day${i}" ${selectedDays[i] ? "checked" : ""} 
onchange="toggleDay(${i})">
<label for="day${i}">${dayNames[i]}</label>
`;
        week2Container.appendChild(div);
    }
}

// JSON Modal Functions
function openJSONModal() {
    document.getElementById("jsonModal").style.display = "block";
}

function closeJSONModal() {
    document.getElementById("jsonModal").style.display = "none";
}

function downloadJSON() {
    // Update current data from form
    currentData.short = document.getElementById("shortName").value.trim();
    currentData.initials = document.getElementById("initials").value.trim();
    currentData.tutor = document.getElementById("tutorGroup").value.trim();

    const exportData = { ...currentData };
    exportData.events = [...currentData.events];

    const jsonText = JSON.stringify(exportData, null, 2);

    // Create download
    const blob = new Blob([jsonText], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    const now = new Date();
    const timestamp =
        now.getFullYear().toString() +
        (now.getMonth() + 1).toString().padStart(2, "0") +
        now.getDate().toString().padStart(2, "0") +
        "-" +
        now.getHours().toString().padStart(2, "0") +
        now.getMinutes().toString().padStart(2, "0");

    link.download = `timetable_${
        currentData.short || "unnamed"
    }_${timestamp}.json`;
    link.href = url;
    link.click();

    URL.revokeObjectURL(url);

    const messageEl = document.getElementById("jsonModalMessage");
    messageEl.innerHTML =
        '<div class="success">JSON file downloaded successfully!</div>';
    setTimeout(() => (messageEl.innerHTML = ""), 3000);
}

function handleJSONFileUpload(event) {
    const file = event.target.files[0];
    const statusEl = document.getElementById("fileUploadStatus");

    if (!file) {
        statusEl.textContent = "";
        return;
    }

    if (file.type !== "application/json" && !file.name.endsWith(".json")) {
        statusEl.innerHTML =
            '<span style="color: #ff6b6b;">Please select a valid JSON file</span>';
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const jsonText = e.target.result;
            document.getElementById("jsonTextarea").value = jsonText;
            statusEl.innerHTML = `<span style="color: #51cf66;">File loaded: ${file.name}</span>`;

            // Automatically import the JSON
            importJSON();
        } catch (error) {
            statusEl.innerHTML =
                '<span style="color: #ff6b6b;">Error reading file</span>';
        }
    };
    reader.readAsText(file);
}

function setupPeriodsCheckboxes() {
    const container = document.getElementById("periodsCheckboxes");
    periodNames.forEach((period, index) => {
        const div = document.createElement("div");
        div.className = "checkbox-item";
        div.innerHTML = `
<input type="checkbox" id="period${index}" ${
            selectedPeriods[index] ? "checked" : ""
        } 
onchange="togglePeriod(${index})">
<label for="period${index}">${period}</label>
<select onchange="changePeriodHeight(${index}, this.value)" style="width: 60px; padding: 2px; margin-left: 5px;">
<option value="false" ${
            !customPeriodHeights[index] ? "selected" : ""
        }>Half</option>
<option value="true" ${
            customPeriodHeights[index] ? "selected" : ""
        }>Full</option>
</select>
`;
        container.appendChild(div);
    });
}

function toggleDay(index) {
    selectedDays[index] = document.getElementById(`day${index}`).checked;
    updateModalSelects();
}

function togglePeriod(index) {
    selectedPeriods[index] = document.getElementById(`period${index}`).checked;
    updateModalSelects();
}

function toggleWeek(weekNumber) {
    const startIndex = weekNumber === 1 ? 0 : 5;
    const endIndex = weekNumber === 1 ? 5 : 10;

    // Check if all days in the week are currently selected
    const allSelected = selectedDays
        .slice(startIndex, endIndex)
        .every((day) => day);

    // Toggle all days in the week (if all selected, unselect all; otherwise select all)
    for (let i = startIndex; i < endIndex; i++) {
        selectedDays[i] = !allSelected;
        const checkbox = document.getElementById(`day${i}`);
        if (checkbox) {
            checkbox.checked = selectedDays[i];
        }
    }

    updateModalSelects();
}

function changePeriodHeight(index, value) {
    customPeriodHeights[index] = value === "true";
}

function updateModalSelects() {
    const daySelect = document.getElementById("eventDay");
    const periodSelect = document.getElementById("eventPeriod");

    // Update day options
    daySelect.innerHTML = "";
    dayNames.forEach((day, index) => {
        if (selectedDays[index]) {
            const option = document.createElement("option");
            option.value = index;
            option.textContent = day;
            daySelect.appendChild(option);
        }
    });

    periodNames.forEach((period, index) => {
        if (selectedPeriods[index]) {
            const option = document.createElement("option");

            // Map display indices to correct JSON values
            if (index === 6) {
                option.value = 7; // Lunch maps to JSON 7
            } else if (index === 7) {
                option.value = 8; // P4 maps to JSON 8
            } else if (index === 8) {
                option.value = 9; // P5 maps to JSON 9
            } else if (index === 9) {
                option.value = 10; // After maps to JSON 10
            } else {
                option.value = index; // Direct mapping for 0-5
            }

            option.textContent = period;
            periodSelect.appendChild(option);

            // Add PM/Lunch Span option after PM if both PM and Lunch are visible
            if (index === 5 && selectedPeriods[5] && selectedPeriods[6]) {
                const spanOption = document.createElement("option");
                spanOption.value = 6;
                spanOption.textContent = "PM/Lunch Span";
                periodSelect.appendChild(spanOption);
            }
        }
    });
}

function editPreset(index) {
    const preset = presets[index];
    const newSubject = prompt("Enter new subject:", preset.subject);
    if (newSubject === null) return; // User cancelled

    const newStaff = prompt("Enter new staff:", preset.staff);
    if (newStaff === null) return; // User cancelled

    const newColor = prompt("Enter new color (hex):", preset.color);
    if (newColor === null) return; // User cancelled

    // Update all matching events
    currentData.events.forEach((event) => {
        if (event[2] === preset.subject && event[4] === preset.staff) {
            event[2] = newSubject.trim();
            event[4] = newStaff.trim();
            event[5] = newColor;
        }
    });

    // Update the preset
    presets[index] = {
        subject: newSubject.trim(),
        staff: newStaff.trim(),
        color: newColor,
    };

    updatePresetsList();
    updatePresetSelect();
    updateEventsList();
}

function updatePresetsList() {
    const container = document.getElementById("presetsList");
    container.innerHTML = "";

    presets.forEach((preset, index) => {
        const div = document.createElement("div");
        div.className = "preset-section";
        div.style.backgroundColor = preset.color;
        div.style.color = "#000";

        div.innerHTML = `
<div style="display: flex; justify-content: space-between; align-items: center;">
<span>${preset.subject} - ${preset.staff}</span>
<div>
<button onclick="editPreset(${index})" style="margin: 0; padding: 4px 8px; font-size: 11px; margin-right: 5px;">Edit</button>
<button class="danger" onclick="deletePreset(${index})" style="margin: 0; padding: 4px 8px; font-size: 11px;">Delete</button>
</div>
</div>
`;
        container.appendChild(div);
    });

    if (presets.length === 0) {
        container.innerHTML =
            '<div style="text-align: center; color: #aaa; padding: 10px; font-size: 12px;">No presets saved yet</div>';
    }
}

function updatePresetSelect() {
    const select = document.getElementById("presetSelect");
    const currentValue = select.value;

    select.innerHTML = '<option value="">Select a preset...</option>';

    presets.forEach((preset, index) => {
        const option = document.createElement("option");
        option.value = index;
        option.textContent = `${preset.subject} - ${preset.staff}`;
        select.appendChild(option);
    });

    select.value = currentValue;
}

function applyPreset() {
    const selectIndex = document.getElementById("presetSelect").value;
    if (selectIndex === "") return;

    const preset = presets[parseInt(selectIndex)];
    document.getElementById("eventSubject").value = preset.subject;
    document.getElementById("eventStaff").value = preset.staff;
    document.getElementById("eventColor").value = preset.color;
}

function deletePreset(index) {
    const preset = presets[index];
    const matchingEvents = currentData.events.filter(
        (event) => event[2] === preset.subject && event[4] === preset.staff
    );

    let confirmMessage = "Are you sure you want to delete this preset?";
    if (matchingEvents.length > 0) {
        confirmMessage += `\n\nThis will also delete ${matchingEvents.length} matching event(s).`;
    }

    if (confirm(confirmMessage)) {
        // Remove the preset
        presets.splice(index, 1);

        // Remove matching events
        currentData.events = currentData.events.filter(
            (event) =>
                !(event[2] === preset.subject && event[4] === preset.staff)
        );

        updatePresetsList();
        updatePresetSelect();
        updateEventsList();
    }
}

function addEvent() {
    currentEditIndex = -1;
    document.getElementById("modalTitle").textContent = "Add New Event";
    clearEventForm();
    document.getElementById("eventModal").style.display = "block";
}

function editEvent(index) {
    currentEditIndex = index;
    document.getElementById("modalTitle").textContent = "Edit Event";
    const event = currentData.events[index];

    document.getElementById("eventDay").value = event[0];

    // Handle combined events
    document.getElementById("eventPeriod").value = event[1];

    document.getElementById("eventSubject").value = event[2];
    document.getElementById("eventRoom").value = event[3];
    document.getElementById("eventStaff").value = event[4];
    document.getElementById("eventColor").value = event[5];

    document.getElementById("eventModal").style.display = "block";
}

function clearEventForm() {
    document.getElementById("eventSubject").value = "";
    document.getElementById("eventRoom").value = "";
    document.getElementById("eventStaff").value = "";
    document.getElementById("eventColor").value = "#e3f2fd";
    document.getElementById("presetSelect").value = "";
}

function saveEvent() {
    const day = parseInt(document.getElementById("eventDay").value);
    const periodValue = document.getElementById("eventPeriod").value;
    const subject = document.getElementById("eventSubject").value.trim();
    const room = document.getElementById("eventRoom").value.trim();
    const staff = document.getElementById("eventStaff").value.trim();
    const color = document.getElementById("eventColor").value;

    if (!subject && !room && !staff) {
        alert("Please fill in at least one of Subject, Room, or Staff");
        return;
    }

    // Create or update preset (including when editing existing events)
    if (subject && staff) {
        const existingPresetIndex = presets.findIndex(
            (p) => p.subject === subject && p.staff === staff
        );

        if (existingPresetIndex === -1) {
            // New preset - create it
            presets.push({ subject, staff, color });
            updatePresetsList();
            updatePresetSelect();
        } else if (presets[existingPresetIndex].color !== color) {
            // Existing preset with different color - update it
            presets[existingPresetIndex].color = color;
            updatePresetsList();
            updatePresetSelect();
        }
    }

    const period = parseInt(periodValue);
    const event = [day, period, subject, room, staff, color];

    if (currentEditIndex >= 0) {
        currentData.events[currentEditIndex] = event;
    } else {
        currentData.events.push(event);
    }

    updateEventsList();
    closeModal();
}

function deleteEvent(index) {
    if (confirm("Are you sure you want to delete this event?")) {
        currentData.events.splice(index, 1);
        updateEventsList();
    }
}

function closeModal() {
    document.getElementById("eventModal").style.display = "none";
}

function openUploadModal() {
    document.getElementById("uploadModal").style.display = "block";
}

function closeUploadModal() {
    document.getElementById("uploadModal").style.display = "none";
    // Clear the file input
    document.getElementById("pdfUpload").value = "";
}

function processPDF() {
    const fileInput = document.getElementById("pdfUpload");
    const file = fileInput.files[0];

    if (!file) {
        alert("Please select a PDF file");
        return;
    }

    if (file.type !== "application/pdf") {
        alert("Please select a valid PDF file");
        return;
    }

    // TODO: Add PDF processing logic here
    console.log("PDF file selected:", file.name);
    alert("PDF processing functionality coming soon!");

    closeUploadModal();
}

function updateEventsList() {
    const container = document.getElementById("eventsList");
    container.innerHTML = "";

    currentData.events.forEach((event, index) => {
        const div = document.createElement("div");
        div.className = "event-item";
        div.style.borderColor = event[5];

        const dayName = dayNames[event[0]] || `Day ${event[0]}`;
        let periodName;
        if (event[1] === 6) {
            periodName = "PM/Lunch Span";
        } else if (event[1] === 7) {
            periodName = "Lunch";
        } else if (event[1] === 8) {
            periodName = "P4";
        } else if (event[1] === 9) {
            periodName = "P5";
        } else if (event[1] === 10) {
            periodName = "After";
        } else {
            periodName = periodNames[event[1]] || `Period ${event[1]}`;
        }

        // Handle combined events

        const details = [event[2], event[3], event[4]]
            .filter((x) => x)
            .join(" ");

        div.innerHTML = `
<div>${dayName} - ${periodName}</div>
<div>${details}</div>
<div class="event-actions">
<button onclick="editEvent(${index})">Edit</button>
<button class="danger" onclick="deleteEvent(${index})">Delete</button>
</div>
`;
        container.appendChild(div);
    });

    if (currentData.events.length === 0) {
        container.innerHTML =
            '<div style="text-align: center; color: #aaa; padding: 20px;">No events added yet</div>';
    }
}

function generateTimetable() {
    // Update current data from form
    currentData.short = document.getElementById("shortName").value.trim();
    currentData.initials = document.getElementById("initials").value.trim();
    currentData.tutor = document.getElementById("tutorGroup").value.trim();

    const nameDisplay = document.getElementById("nameDisplay").value;

    // Generate HTML table
    const tbody = document.getElementById("timetableBody");
    tbody.innerHTML = "";

    // Get active days and periods
    const activeDays = dayNames.filter((_, i) => selectedDays[i]);
    const activePeriods = periodNames.filter((_, i) => selectedPeriods[i]);
    const activePeriodIndices = periodNames
        .map((_, i) => i)
        .filter((i) => selectedPeriods[i]);

    // Header row
    const headerRow = document.createElement("tr");
    headerRow.className = "header-row";
    const cornerCell = document.createElement("th");

    // Handle name display options
    let displayText = "";
    switch (nameDisplay) {
        case "short":
            displayText =
                currentData.short.length > 8
                    ? currentData.short.substring(0, 8) + "..."
                    : currentData.short;
            break;
        case "initials":
            displayText = currentData.initials;
            break;
        case "tutor":
            displayText = currentData.tutor;
            break;
        case "both":
            displayText =
                currentData.tutor && currentData.initials
                    ? `${currentData.tutor} ${currentData.initials}`
                    : "";
            break;
        case "none":
        default:
            displayText = "";
            break;
    }

    cornerCell.textContent = displayText;
    headerRow.appendChild(cornerCell);

    activeDays.forEach((day) => {
        const th = document.createElement("th");
        th.textContent = day;
        headerRow.appendChild(th);
    });
    tbody.appendChild(headerRow);

    // Period rows
    for (let i = 0; i < activePeriodIndices.length; i++) {
        const periodIndex = activePeriodIndices[i];

        const row = document.createElement("tr");
        const periodHeader = document.createElement("th");
        periodHeader.className = "period-header";
        periodHeader.textContent = periodNames[periodIndex];

        let displayHeight = customPeriodHeights[periodIndex];

        if (!displayHeight) {
            periodHeader.classList.add("half-height");
        }

        row.appendChild(periodHeader);

        // Add day cells
        dayNames.forEach((_, dayIndex) => {
            if (!selectedDays[dayIndex]) return;

            const cell = document.createElement("td");
            cell.className = "timetable-cell";

            if (!displayHeight) {
                cell.classList.add("half-height");
            }

            let event = null;

            // Handle period 6 spanning across PM and Lunch
            const period6Event = currentData.events.find(
                (e) => e[0] === dayIndex && e[1] === 6
            );
            const pmVisible = selectedPeriods[5];
            const lunchVisible = selectedPeriods[6];
            const canSpan = pmVisible && lunchVisible;

            if (period6Event && periodIndex === 5 && canSpan) {
                // PM row with spanning event (both rows visible)
                event = period6Event;
                cell.style.borderBottom = "none";
                cell.style.position = "relative";

                if (!customPeriodHeights[5]) {
                    cell.classList.add("half-height");
                }
            } else if (period6Event && periodIndex === 6 && canSpan) {
                // Lunch row with spanning event (both rows visible)
                event = period6Event;
                cell.style.borderTop = "none";
                cell.style.backgroundColor = period6Event[5];
                cell.style.position = "relative";

                if (!customPeriodHeights[6]) {
                    cell.classList.add("half-height");
                }
            } else if (
                period6Event &&
                periodIndex === 5 &&
                pmVisible &&
                !lunchVisible
            ) {
                // Period 6 event, only PM visible
                event = period6Event;
                if (!customPeriodHeights[5]) {
                    cell.classList.add("half-height");
                }
            } else if (
                period6Event &&
                periodIndex === 6 &&
                lunchVisible &&
                !pmVisible
            ) {
                // Period 6 event, only Lunch visible
                event = period6Event;
                if (!customPeriodHeights[6]) {
                    cell.classList.add("half-height");
                }
            } else {
                // Regular event lookup for all other periods (including 7-10)
                // Regular event lookup with proper JSON period mapping
                let jsonPeriodToCheck;
                if (periodIndex === 6) {
                    // Lunch row - check for JSON period 7 (lunch-only events)
                    jsonPeriodToCheck = 7;
                } else if (periodIndex === 7) {
                    // P4 row - check for JSON period 8
                    jsonPeriodToCheck = 8;
                } else if (periodIndex === 8) {
                    // P5 row - check for JSON period 9
                    jsonPeriodToCheck = 9;
                } else if (periodIndex === 9) {
                    // After row - check for JSON period 10
                    jsonPeriodToCheck = 10;
                } else {
                    // All other periods map directly (0-5)
                    jsonPeriodToCheck = periodIndex;
                }

                event = currentData.events.find(
                    (e) => e[0] === dayIndex && e[1] === jsonPeriodToCheck
                );
                if (!displayHeight) {
                    cell.classList.add("half-height");
                }
            }

            if (event) {
                cell.classList.add("event-cell");
                cell.style.backgroundColor = event[5];

                const isSpanningEvent =
                    event[1] === 6 && pmVisible && lunchVisible;
                const isSpanningPM = isSpanningEvent && periodIndex === 5;
                const isSpanningLunch = isSpanningEvent && periodIndex === 6;

                if (isSpanningPM) {
                    // PM part of spanning event - subject at bottom
                    cell.innerHTML = `<div style="position: absolute; bottom: 1px; left: 50%; transform: translateX(-50%); font-size: 8px;">${event[2]}</div>`;
                } else if (isSpanningLunch) {
                    // Lunch part of spanning event - room/staff at top
                    const details = [event[3], event[4]]
                        .filter((x) => x)
                        .join(" ");
                    cell.innerHTML = `<div style="position: absolute; top: 1px; left: 50%; transform: translateX(-50%); font-size: 8px;">${details}</div>`;
                } else if (displayHeight) {
                    // Regular full height event
                    const details = [event[3], event[4]]
                        .filter((x) => x)
                        .join(" ");
                    cell.innerHTML = `<div>${event[2]}</div><div style="font-size: 8px;">${details}</div>`;
                } else {
                    // Regular half height event
                    const details = [event[3], event[4]]
                        .filter((x) => x)
                        .join(" ");
                    cell.innerHTML = `<div style="font-size: 8px;">${details}</div>`;
                }
            }

            row.appendChild(cell);
        });

        tbody.appendChild(row);
    }
}

function downloadImage() {
    const timetableWrapper = document.getElementById("timetableWrapper");

    // Get current date/time for filename
    const now = new Date();
    const dateStr =
        now.getFullYear().toString() +
        (now.getMonth() + 1).toString().padStart(2, "0") +
        now.getDate().toString().padStart(2, "0");
    const timeStr =
        now.getHours().toString().padStart(2, "0") +
        now.getMinutes().toString().padStart(2, "0") +
        now.getSeconds().toString().padStart(2, "0");
    const timestamp = `${dateStr}-${timeStr}`;

    // Take screenshot of just the table wrapper
    html2canvas(timetableWrapper, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
        allowTaint: true,
    })
        .then((originalCanvas) => {
            // Create new canvas with 4px padding on all sides
            const paddedCanvas = document.createElement("canvas");
            const ctx = paddedCanvas.getContext("2d");

            paddedCanvas.width = originalCanvas.width + 16; // 4px * 2 * scale
            paddedCanvas.height = originalCanvas.height + 16; // 4px * 2 * scale

            // Fill with white background
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, paddedCanvas.width, paddedCanvas.height);

            // Draw original canvas centered with 8px padding (4px * scale 2)
            ctx.drawImage(originalCanvas, 8, 8);

            // Draw top and left borders with proper thickness
            ctx.strokeStyle = "#333";
            ctx.lineWidth = 3; // 1.5px * scale 2 = 3px for proper 1.5px border
            
            // Top border
            ctx.beginPath();
            ctx.moveTo(8, 8);
            ctx.lineTo(originalCanvas.width + 8, 8);
            ctx.stroke();

            // Left border
            ctx.beginPath();
            ctx.moveTo(8, 8);
            ctx.lineTo(8, originalCanvas.height + 8);
            ctx.stroke();

            // Download the padded image
            const link = document.createElement("a");
            link.download = `timetable_${
                currentData.short || "unnamed"
            }_${timestamp}.png`;
            link.href = paddedCanvas.toDataURL("image/png");
            link.click();
        })
        .catch((error) => {
            console.error("Error generating image:", error);
            alert("Error generating image. Please try again.");
        });
}

function importJSON() {
    const jsonText = document.getElementById("jsonTextarea").value.trim();
    const messageEl = document.getElementById("jsonModalMessage");

    if (!jsonText) {
        messageEl.innerHTML =
            '<div class="error">Please paste JSON data or upload a file</div>';
        return;
    }

    try {
        const data = JSON.parse(jsonText);

        // Validate structure
        if (!data.short || !Array.isArray(data.events)) {
            throw new Error("Invalid JSON structure");
        }

        // Update current data
        currentData = data;

        // Extract presets from events
        presets = []; // Clear existing presets
        currentData.events.forEach((event) => {
            if (event[2] && event[4]) {
                const existingPreset = presets.find(
                    (p) => p.subject === event[2] && p.staff === event[4]
                );
                if (!existingPreset) {
                    presets.push({
                        subject: event[2],
                        staff: event[4],
                        color: event[5],
                    });
                }
            }
        });

        // Update form fields
        document.getElementById("shortName").value = data.short || "";
        document.getElementById("initials").value = data.initials || "";
        document.getElementById("tutorGroup").value = data.tutor || "";

        updateEventsList();
        updatePresetsList();
        updatePresetSelect();
        messageEl.innerHTML =
            '<div class="success">JSON imported successfully!</div>';

        setTimeout(() => (messageEl.innerHTML = ""), 3000);
    } catch (error) {
        messageEl.innerHTML = `<div class="error">Error parsing JSON: ${error.message}</div>`;
    }
}

function exportJSON() {
    // Update current data from form
    currentData.short = document.getElementById("shortName").value.trim();
    currentData.initials = document.getElementById("initials").value.trim();
    currentData.tutor = document.getElementById("tutorGroup").value.trim();

    const exportData = { ...currentData };
    exportData.events = [...currentData.events];

    const jsonText = JSON.stringify(exportData, null, 2);
    document.getElementById("jsonTextarea").value = jsonText;

    const messageEl = document.getElementById("jsonModalMessage");
    messageEl.innerHTML =
        '<div class="success">JSON exported to textarea</div>';

    setTimeout(() => (messageEl.innerHTML = ""), 3000);
}

// Event listeners
window.onclick = function (event) {
    const eventModal = document.getElementById("eventModal");
    const uploadModal = document.getElementById("uploadModal");
    const jsonModal = document.getElementById("jsonModal");

    if (event.target === eventModal) {
        closeModal();
    } else if (event.target === uploadModal) {
        closeUploadModal();
    } else if (event.target === jsonModal) {
        closeJSONModal();
    }
};

// Initialize app when page loads
document.addEventListener("DOMContentLoaded", init);
