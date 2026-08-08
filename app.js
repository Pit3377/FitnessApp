console.log("Die App.js wurde erfolgreich geladen!");

// ======================================================
// Fitness App
// Version 2.0
// Teil 1A – Grundstruktur
// ======================================================

"use strict";

// ======================================================
// Konstanten
// ======================================================

const STORAGE_KEY = "fitnessAppExercises";
const THEME_KEY = "fitnessTheme";
const DATE_KEY = "fitnessAppLastDate";
const STATS_KEY = "fitnessAppStatistics";

// ======================================================
// Globale Variablen
// ======================================================

let exercises = [];
let editIndex = null;

// ======================================================
// Start der App
// ======================================================

document.addEventListener("DOMContentLoaded", init);

function init() {

    showToday();

    loadTheme();

    loadExercises();

    checkNewDay();

    renderExercises();

    bindEvents();

}

// ======================================================
// Hilfsfunktion
// Liefert ein HTML-Element oder wirft einen Fehler
// ======================================================

function $(id) {

    const element = document.getElementById(id);

    if (!element) {
        throw new Error(`Element mit ID "${id}" wurde nicht gefunden.`);
    }

    return element;

}

// ======================================================
// Datum anzeigen
// ======================================================

function showToday() {

    const today = new Date();

    $("today").textContent =
        today.toLocaleDateString("de-DE", {
            weekday: "long",
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        });

}

// ======================================================
// Dark Mode
// ======================================================

function toggleTheme() {

    document.body.classList.toggle("dark");

    localStorage.setItem(
        THEME_KEY,
        document.body.classList.contains("dark")
    );

}

function loadTheme() {

    const darkMode =
        localStorage.getItem(THEME_KEY) === "true";

    document.body.classList.toggle("dark", darkMode);

}

// ======================================================
// LocalStorage
// ======================================================

function saveExercises() {

console.log("Speichere", exercises);

    try {

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(exercises)
        );

    } catch (error) {

        console.error("Fehler beim Speichern:", error);

    }

}

function loadExercises() {

console.log("Geladen", exercises);

    try {

        const data = localStorage.getItem(STORAGE_KEY);

        exercises = data
            ? JSON.parse(data)
            : [];

        if (!Array.isArray(exercises)) {
            exercises = [];
        }

    } catch (error) {

        console.error("Fehler beim Laden:", error);

        exercises = [];

    }

}

// ======================================================
// Allgemeine Hilfsfunktionen
// ======================================================

function clearForm() {

    $("name").value = "";
    $("description").value = "";
    $("category").selectedIndex = 0;

    $("sets").value = "";
    $("reps").value = "";
    $("weight").value = "";
    $("time").value = "";
    $("rest").value = "";

    $("image").value = "";

}

function resetEditMode() {

    editIndex = null;

    $("modalTitle").textContent = "Neue Übung";

}

function createId() {

    return Date.now();

}
// ======================================================
// Teil 1B
// Events, Modal, Dashboard und Render-Grundgerüst
// ======================================================


// ======================================================
// Events registrieren
// ======================================================

function bindEvents() {

    $("themeBtn").addEventListener("click", toggleTheme);

    $("newExerciseBtn").addEventListener("click", () => {

        resetEditMode();
        clearForm();
        openModal();

    });

    $("closeModal").addEventListener("click", closeModal);

    $("saveExercise").addEventListener("click", saveExercise);

}


// ======================================================
// Modal
// ======================================================

function openModal() {

    $("exerciseModal").classList.remove("hidden");

}

function closeModal() {

    resetEditMode();

    clearForm();

    $("exerciseModal").classList.add("hidden");

}


// ======================================================
// Dashboard
// ======================================================

function checkNewDay() {

    const today = new Date().toISOString().split("T")[0];

    const lastDate = localStorage.getItem(DATE_KEY);

    // Erster Start der App
    if (!lastDate) {

        localStorage.setItem(DATE_KEY, today);

        return;
    }

    // Neuer Tag
    if (lastDate !== today) {

        // Alle Übungen wieder auf "offen" setzen
        exercises.forEach(exercise => {

            exercise.done = false;

        });

        saveExercises();

        // Neues Datum speichern
        localStorage.setItem(DATE_KEY, today);

    }

}

function updateDashboard() {

    const total = exercises.length;

    const done = exercises.filter(e => e.done).length;

    $("exerciseCount").textContent = total;

    $("doneCount").textContent = done;

    const percent =
        total === 0
            ? 0
            : Math.round(done / total * 100);

    $("progressBar").style.width = percent + "%";

    $("progressText").textContent =
        percent + " % erledigt";

    updateStreak();

}


// ======================================================
// Trainingsserie (Streak)
// ======================================================

function updateStreak() {

    // Platzhalter
    // Im späteren Teil wird daraus
    // eine echte Tagesserie.

    $("streak").textContent = "0";

}


// ======================================================
// Übungen darstellen
// ======================================================

function renderExercises() {

    const list = $("exerciseList");

    list.innerHTML = "";

    if (exercises.length === 0) {

        list.innerHTML =
            "<p>Noch keine Übungen vorhanden.</p>";

        updateDashboard();

        return;

    }

    let html = "";

    exercises.forEach((exercise, index) => {

        html += createExerciseCard(exercise, index);

    });

    list.innerHTML = html;

    updateDashboard();

}


// ======================================================
// Karte einer Übung erzeugen
// ======================================================

function createExerciseCard(exercise, index) {

    const image =
        exercise.image || "images/placeholder.png";

    return `

<div class="exercise-card ${exercise.done ? "completed" : ""}">

    <img
        src="${image}"
        alt="${exercise.name}"
        onerror="this.src='images/placeholder.png'">

    <div class="exercise-body">

        <h3>${escapeHtml(exercise.name)}</h3>

        <span class="badge">

            ${escapeHtml(exercise.category)}

        </span>

        <p>

            ${escapeHtml(exercise.description)}

        </p>

        <div class="exercise-info">

            <p>💪 ${exercise.sets} Sätze</p>

            <p>🔁 ${exercise.reps} Wiederholungen</p>

            <p>🏋️ ${exercise.weight} kg</p>

            <p>⏱️ ${exercise.time} Sekunden</p>

            <p>☕ ${exercise.rest} Sekunden Pause</p>

        </div>

		<div class="exercise-buttons">

			<button onclick="toggleDone(${index})">
				${exercise.done ? "✅ Erledigt" : "☑️ Offen"}
			</button>

			<div class="button-right">

				<button onclick="editExercise(${index})">
					✏️ Bearbeiten
				</button>

				<button class="danger" onclick="deleteExercise(${index})">
					🗑️ Löschen
				</button>

			</div>

		</div>

    </div>

</div>

`;

}


// ======================================================
// HTML absichern
// ======================================================

function escapeHtml(text) {

    if (text === null || text === undefined) {

        return "";

    }

    return String(text)

        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}
// ======================================================
// Teil 2
// Übungen speichern, bearbeiten und löschen
// ======================================================


// ======================================================
// Bild lesen
// ======================================================

function readImage(file) {

    return new Promise((resolve, reject) => {

        if (!file) {

            resolve("");

            return;

        }

        const reader = new FileReader();

        reader.onload = () => resolve(reader.result);

        reader.onerror = reject;

        reader.readAsDataURL(file);

    });

}


// ======================================================
// Übung speichern
// ======================================================

async function saveExercise() {

    const file = $("image").files[0];

    const exercise = {

        id: editIndex === null
            ? createId()
            : exercises[editIndex].id,

        name: $("name").value.trim(),

        description: $("description").value.trim(),

        category: $("category").value,

        sets: Number($("sets").value) || 0,

        reps: Number($("reps").value) || 0,

        weight: Number($("weight").value) || 0,

        time: Number($("time").value) || 0,

        rest: Number($("rest").value) || 0,

        done: editIndex === null
            ? false
            : exercises[editIndex].done,

        image: ""

    };

    if (exercise.name === "") {

        alert("Bitte einen Übungsnamen eingeben.");

        $("name").focus();

        return;

    }

    if (file) {

        exercise.image = await readImage(file);

    } else if (editIndex !== null) {

        exercise.image = exercises[editIndex].image;

    }

    if (editIndex === null) {

        exercises.push(exercise);

    } else {

        exercises[editIndex] = exercise;

    }

    finishSave();

}


// ======================================================
// Speichern abschließen
// ======================================================

function finishSave() {

    saveExercises();

    renderExercises();

    closeModal();

}


// ======================================================
// Bearbeiten
// ======================================================

function editExercise(index) {

    const exercise = exercises[index];

    editIndex = index;

    $("modalTitle").textContent = "Übung bearbeiten";

    $("name").value = exercise.name;

    $("description").value = exercise.description;

    $("category").value = exercise.category;

    $("sets").value = exercise.sets;

    $("reps").value = exercise.reps;

    $("weight").value = exercise.weight;

    $("time").value = exercise.time;

    $("rest").value = exercise.rest;

    $("image").value = "";

    openModal();

}


// ======================================================
// Erledigt / Offen
// ======================================================

function toggleDone(index) {

    exercises[index].done = !exercises[index].done;

    saveExercises();

    renderExercises();

}


// ======================================================
// Löschen
// ======================================================

function deleteExercise(index) {

    if (!confirm("Übung wirklich löschen?")) {

        return;

    }

    exercises.splice(index, 1);

    saveExercises();

    renderExercises();

}
// ======================================================
// Service Worker registrieren
// ======================================================

if ("serviceWorker" in navigator) {

    window.addEventListener("load", async () => {

        try {

            const registration =
                await navigator.serviceWorker.register("./sw.js");

            console.log("Service Worker registriert.", registration);

        } catch (error) {

            console.error("Service Worker Fehler:", error);

        }

    });

}