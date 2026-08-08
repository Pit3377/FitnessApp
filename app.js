console.log("Die App.js wurde erfolgreich geladen!");

// ======================================================
// Fitness App
// Version 2.1
// Bildspeicherung über IndexedDB
// ======================================================

"use strict";

// ======================================================
// Konstanten
// ======================================================

const STORAGE_KEY = "fitnessAppExercises";
const THEME_KEY = "fitnessTheme";
const DATE_KEY = "fitnessAppLastDate";
const STATS_KEY = "fitnessAppStatistics";

const DB_NAME = "fitnessAppDatabase";
const DB_VERSION = 1;
const IMAGE_STORE = "images";

// ======================================================
// Globale Variablen
// ======================================================

let exercises = [];
let editIndex = null;
let db = null;

// ======================================================
// Start der App
// ======================================================

document.addEventListener("DOMContentLoaded", init);

async function init() {

    showToday();

    loadTheme();

    await initDatabase();

    loadExercises();

    checkNewDay();

    await migrateOldImages();

    await renderExercises();

    bindEvents();
}

// ======================================================
// Hilfsfunktion
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
// IndexedDB
// ======================================================

function initDatabase() {

    return new Promise((resolve, reject) => {

        const request =
            indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = function (event) {

            const database = event.target.result;

            if (!database.objectStoreNames.contains(IMAGE_STORE)) {

                database.createObjectStore(
                    IMAGE_STORE,
                    { keyPath: "id" }
                );

            }
        };

        request.onsuccess = function (event) {

            db = event.target.result;

            console.log("IndexedDB erfolgreich geöffnet.");

            resolve();
        };

        request.onerror = function () {

            console.error(
                "IndexedDB Fehler:",
                request.error
            );

            reject(request.error);
        };
    });
}

// ======================================================
// Bild in IndexedDB speichern
// ======================================================

function saveImage(imageId, imageData) {

    return new Promise((resolve, reject) => {

        if (!db) {

            reject(
                new Error("IndexedDB ist nicht geöffnet.")
            );

            return;
        }

        const transaction =
            db.transaction(
                IMAGE_STORE,
                "readwrite"
            );

        const store =
            transaction.objectStore(IMAGE_STORE);

        store.put({
            id: imageId,
            data: imageData
        });

        transaction.oncomplete = function () {

            resolve();
        };

        transaction.onerror = function () {

            reject(transaction.error);
        };
    });
}

// ======================================================
// Bild aus IndexedDB laden
// ======================================================

function loadImage(imageId) {

    return new Promise((resolve, reject) => {

        if (!db) {

            resolve("");

            return;
        }

        const transaction =
            db.transaction(
                IMAGE_STORE,
                "readonly"
            );

        const store =
            transaction.objectStore(IMAGE_STORE);

        const request =
            store.get(imageId);

        request.onsuccess = function () {

            if (request.result) {

                resolve(request.result.data);

            } else {

                resolve("");
            }
        };

        request.onerror = function () {

            reject(request.error);
        };
    });
}

// ======================================================
// Bild aus IndexedDB löschen
// ======================================================

function deleteImage(imageId) {

    return new Promise((resolve, reject) => {

        if (!db || !imageId) {

            resolve();

            return;
        }

        const transaction =
            db.transaction(
                IMAGE_STORE,
                "readwrite"
            );

        const store =
            transaction.objectStore(IMAGE_STORE);

        store.delete(imageId);

        transaction.oncomplete = function () {

            resolve();
        };

        transaction.onerror = function () {

            reject(transaction.error);
        };
    });
}

// ======================================================
// Alte Base64-Bilder übernehmen
// ======================================================

async function migrateOldImages() {

    let changed = false;

    for (const exercise of exercises) {

        // Bereits auf IndexedDB umgestellt
        if (exercise.imageId) {
            continue;
        }

        // Altes Base64-Bild vorhanden
        if (
            exercise.image &&
            exercise.image.startsWith("data:image/")
        ) {

            const imageId =
                "image_" +
                exercise.id;

            try {

                await saveImage(
                    imageId,
                    exercise.image
                );

                exercise.imageId = imageId;

                // Altes großes Base64-Feld entfernen
                exercise.image = "";

                changed = true;

                console.log(
                    "Altes Bild übernommen:",
                    exercise.name
                );

            } catch (error) {

                console.error(
                    "Fehler bei Bildübernahme:",
                    error
                );
            }
        }
    }

    if (changed) {

        saveExercises();
    }
}

// ======================================================
// LocalStorage – Übungsdaten
// ======================================================

function saveExercises() {

    console.log("Speichere", exercises);

    try {

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(exercises)
        );

    } catch (error) {

        console.error(
            "Fehler beim Speichern:",
            error
        );

        alert(
            "Die Übungen konnten nicht gespeichert werden."
        );
    }
}

function loadExercises() {

    console.log("Lade Übungen");

    try {

        const data =
            localStorage.getItem(STORAGE_KEY);

        exercises = data
            ? JSON.parse(data)
            : [];

        if (!Array.isArray(exercises)) {

            exercises = [];
        }

    } catch (error) {

        console.error(
            "Fehler beim Laden:",
            error
        );

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

    $("modalTitle").textContent =
        "Neue Übung";
}

function createId() {

    return Date.now();
}

// ======================================================
// Events
// ======================================================

function bindEvents() {

    $("themeBtn").addEventListener(
        "click",
        toggleTheme
    );

    $("newExerciseBtn").addEventListener(
        "click",
        () => {

            resetEditMode();

            clearForm();

            openModal();
        }
    );

    $("closeModal").addEventListener(
        "click",
        closeModal
    );

    $("saveExercise").addEventListener(
        "click",
        saveExercise
    );
}

// ======================================================
// Modal
// ======================================================

function openModal() {

    $("exerciseModal")
        .classList
        .remove("hidden");
}

function closeModal() {

    resetEditMode();

    clearForm();

    $("exerciseModal")
        .classList
        .add("hidden");
}

// ======================================================
// Tageswechsel
// ======================================================

function checkNewDay() {

    const today =
        new Date()
            .toISOString()
            .split("T")[0];

    const lastDate =
        localStorage.getItem(DATE_KEY);

    // Erster Start
    if (!lastDate) {

        localStorage.setItem(
            DATE_KEY,
            today
        );

        return;
    }

    // Neuer Tag
    if (lastDate !== today) {

        // Statistik des vergangenen Tages speichern
        saveDailyStatistic(lastDate);

        // Alle Übungen wieder auf "offen"
        exercises.forEach(
            exercise => {

                exercise.done = false;
            }
        );

        saveExercises();

        // Neues Datum speichern
        localStorage.setItem(
            DATE_KEY,
            today
        );
    }
}

// ======================================================
// Trainingsstatistik
// ======================================================

function loadStatistics() {

    try {

        const data =
            localStorage.getItem(STATS_KEY);

        if (!data) {
            return {};
        }

        const statistics =
            JSON.parse(data);

        if (
            typeof statistics !== "object" ||
            statistics === null ||
            Array.isArray(statistics)
        ) {
            return {};
        }

        return statistics;

    } catch (error) {

        console.error(
            "Fehler beim Laden der Statistik:",
            error
        );

        return {};
    }
}


// ======================================================
// Tageswert speichern
// ======================================================

function saveDailyStatistic(date) {

    const total =
        exercises.length;

    const done =
        exercises.filter(
            exercise => exercise.done
        ).length;

    const percent =
        total === 0
            ? 0
            : Math.round(
                done / total * 100
            );

    const statistics =
        loadStatistics();

    statistics[date] =
        percent;

    // Nur die letzten 7 Tage behalten
    const dates =
        Object.keys(statistics)
            .sort()
            .slice(-7);

    const cleanedStatistics = {};

    dates.forEach(
        dateKey => {

            cleanedStatistics[dateKey] =
                statistics[dateKey];
        }
    );

    localStorage.setItem(
        STATS_KEY,
        JSON.stringify(
            cleanedStatistics
        )
    );
}


// ======================================================
// Statistik anzeigen
// ======================================================

function renderStatistics() {

    const container =
        document.getElementById(
            "trainingStatistics"
        );

    if (!container) {
        return;
    }

    const statistics =
        loadStatistics();

    const today =
        new Date();

    const dayNames = [
        "So",
        "Mo",
        "Di",
        "Mi",
        "Do",
        "Fr",
        "Sa"
    ];

    let html = "";

    // Montag bis Sonntag
    const currentDay =
        today.getDay();

    const mondayOffset =
        currentDay === 0
            ? -6
            : 1 - currentDay;

    for (
        let i = 0;
        i < 7;
        i++
    ) {

        const date =
            new Date(today);

        date.setDate(
            today.getDate() +
            mondayOffset +
            i
        );

        const dateKey =
            date.toISOString()
                .split("T")[0];

        const dayName =
            dayNames[
                date.getDay()
            ];

        const percent =
            statistics[dateKey] !== undefined
                ? statistics[dateKey]
                : 0;

        html += `

            <div class="statistic-row">

                <div class="statistic-day">
                    ${dayName}
                </div>

                <div class="statistic-bar-container">

                    <div
                        class="statistic-bar"
                        style="width:${percent}%">
                    </div>

                </div>

                <div class="statistic-percent">
                    ${percent} %
                </div>

            </div>

        `;
    }

    container.innerHTML = html;
}

// ======================================================
// Dashboard
// ======================================================

function updateDashboard() {

    const total =
        exercises.length;

    const done =
        exercises.filter(
            e => e.done
        ).length;

    $("exerciseCount").textContent =
        total;

    $("doneCount").textContent =
        done;

    const percent =
        total === 0
            ? 0
            : Math.round(
                done / total * 100
            );

    $("progressBar")
        .style
        .width =
        percent + "%";

    $("progressText").textContent =
        percent + " % erledigt";

    updateStreak();
}

// ======================================================
// Trainingsserie
// ======================================================

function updateStreak() {

    $("streak").textContent = "0";
}

// ======================================================
// Übungen darstellen
// ======================================================

async function renderExercises() {

    const list =
        $("exerciseList");

    list.innerHTML = "";

    if (exercises.length === 0) {

        list.innerHTML =
            "<p>Noch keine Übungen vorhanden.</p>";

        updateDashboard();

        return;
    }

    let html = "";

    for (
        let index = 0;
        index < exercises.length;
        index++
    ) {

        html +=
            await createExerciseCard(
                exercises[index],
                index
            );
    }

    list.innerHTML = html;

    updateDashboard();
}

// ======================================================
// Karte einer Übung erzeugen
// ======================================================

async function createExerciseCard(
    exercise,
    index
) {

    let image =
        "images/placeholder.png";

    // Neues IndexedDB-Bild laden
    if (exercise.imageId) {

        try {

            const storedImage =
                await loadImage(
                    exercise.imageId
                );

            if (storedImage) {

                image = storedImage;
            }

        } catch (error) {

            console.error(
                "Bild konnte nicht geladen werden:",
                error
            );
        }
    }

    // Übergangsweise alte Bilder unterstützen
    else if (exercise.image) {

        image = exercise.image;
    }

    return `

        <div class="exercise-card">

            <img
                src="${image}"
                alt="${escapeHtml(exercise.name)}"
                onerror="this.src='images/placeholder.png'">

            <div class="exercise-body">

                <h3>
                    ${escapeHtml(exercise.name)}
                </h3>

                <span class="badge">

                    ${escapeHtml(exercise.category)}

                </span>

                <p>

                    ${escapeHtml(exercise.description)}

                </p>

                <div class="exercise-info">

                    <p>
                        💪 ${exercise.sets} Sätze
                    </p>

                    <p>
                        🔁 ${exercise.reps} Wiederholungen
                    </p>

                    <p>
                        🏋️ ${exercise.weight} kg
                    </p>

                    <p>
                        ⏱️ ${exercise.time} Sekunden
                    </p>

                    <p>
                        ☕ ${exercise.rest} Sekunden Pause
                    </p>

                </div>

                <div class="exercise-buttons">

                    <button
                        onclick="toggleDone(${index})">

                        ${
                            exercise.done
                                ? "✅ Erledigt"
                                : "☑️ Offen"
                        }

                    </button>

                    <div class="button-right">

                        <button
                            onclick="editExercise(${index})">

                            ✏️ Bearbeiten

                        </button>

                        <button
                            class="danger"
                            onclick="deleteExercise(${index})">

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

    if (
        text === null ||
        text === undefined
    ) {

        return "";
    }

    return String(text)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );
}

// ======================================================
// Bild lesen
// ======================================================

function readImage(file) {

    return new Promise(
        (resolve, reject) => {

            if (!file) {

                resolve("");

                return;
            }

            const reader =
                new FileReader();

            reader.onload =
                () => resolve(
                    reader.result
                );

            reader.onerror =
                reject;

            reader.readAsDataURL(file);
        }
    );
}

// ======================================================
// Übung speichern
// ======================================================

async function saveExercise() {

    const file =
        $("image").files[0];

    const oldExercise =
        editIndex !== null
            ? exercises[editIndex]
            : null;

    const exercise = {

        id:
            editIndex === null
                ? createId()
                : oldExercise.id,

        name:
            $("name")
                .value
                .trim(),

        description:
            $("description")
                .value
                .trim(),

        category:
            $("category").value,

        sets:
            Number(
                $("sets").value
            ) || 0,

        reps:
            Number(
                $("reps").value
            ) || 0,

        weight:
            Number(
                $("weight").value
            ) || 0,

        time:
            Number(
                $("time").value
            ) || 0,

        rest:
            Number(
                $("rest").value
            ) || 0,

        done:
            editIndex === null
                ? false
                : oldExercise.done,

        imageId:
            oldExercise
                ? oldExercise.imageId || ""
                : "",

        // Kein Base64 mehr in localStorage
        image: ""
    };

    if (exercise.name === "") {

        alert(
            "Bitte einen Übungsnamen eingeben."
        );

        $("name").focus();

        return;
    }

    // ==================================================
    // Neues Bild speichern
    // ==================================================

    if (file) {

        try {

            const imageId =
                exercise.imageId ||
                "image_" + exercise.id;

            const imageData =
                await readImage(file);

            await saveImage(
                imageId,
                imageData
            );

            exercise.imageId =
                imageId;

            console.log(
                "Bild gespeichert:",
                imageId
            );

        } catch (error) {

            console.error(
                "Fehler beim Speichern des Bildes:",
                error
            );

            alert(
                "Das Bild konnte nicht gespeichert werden."
            );

            return;
        }
    }

    // ==================================================
    // Übung speichern
    // ==================================================

    if (editIndex === null) {

        exercises.push(exercise);

    } else {

        exercises[editIndex] =
            exercise;
    }

    finishSave();
}

// ======================================================
// Speichern abschließen
// ======================================================

async function finishSave() {

    saveExercises();

    await renderExercises();

    renderStatistics();

    closeModal();
}

// ======================================================
// Bearbeiten
// ======================================================

function editExercise(index) {

    const exercise =
        exercises[index];

    editIndex = index;

    $("modalTitle").textContent =
        "Übung bearbeiten";

    $("name").value =
        exercise.name;

    $("description").value =
        exercise.description;

    $("category").value =
        exercise.category;

    $("sets").value =
        exercise.sets;

    $("reps").value =
        exercise.reps;

    $("weight").value =
        exercise.weight;

    $("time").value =
        exercise.time;

    $("rest").value =
        exercise.rest;

    $("image").value = "";

    openModal();
}

// ======================================================
// Erledigt / Offen
// ======================================================

async function toggleDone(index) {

    exercises[index].done =
        !exercises[index].done;

    saveExercises();

    // Statistik des aktuellen Tages
    const today =
        new Date()
            .toISOString()
            .split("T")[0];

    saveDailyStatistic(today);

    await renderExercises();

    renderStatistics();
}

// ======================================================
// Löschen
// ======================================================

async function deleteExercise(index) {

    if (
        !confirm(
            "Übung wirklich löschen?"
        )
    ) {

        return;
    }

    const exercise =
        exercises[index];

    // Zugehöriges Bild löschen
    if (exercise.imageId) {

        try {

            await deleteImage(
                exercise.imageId
            );

        } catch (error) {

            console.error(
                "Fehler beim Löschen des Bildes:",
                error
            );
        }
    }

    exercises.splice(
        index,
        1
    );

    saveExercises();

    await renderExercises();
}

// ======================================================
// Service Worker registrieren
// ======================================================

if (
    "serviceWorker" in navigator
) {

    window.addEventListener(
        "load",
        async () => {

            try {

                const registration =
                    await navigator.serviceWorker.register(
                        "./sw.js"
                    );

                console.log(
                    "Service Worker registriert.",
                    registration
                );

            } catch (error) {

                console.error(
                    "Service Worker Fehler:",
                    error
                );
            }
        }
    );
}