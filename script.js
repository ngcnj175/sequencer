const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

const notes = ['C4', 'C#4', 'D4', 'D#4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'A4', 'A#4', 'B4', 'C5'];
const frequencies = {
    'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63,
    'F4': 349.23, 'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'A4': 440.00,
    'A#4': 466.16, 'B4': 493.88, 'C5': 523.25
};

const numTracks = 4;
const numSteps = 16;

let tracks = Array.from({length: numTracks}, () => Array(numSteps).fill(null));
let currentStep = 0;
let intervalId = null;
let isLooping = true;
let isRecording = false;
let bpm = 120;
let trackVolumes = Array(numTracks).fill(1.0);

function createOscillator(freq, volume = 1.0) {
    const osc = audioCtx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = freq;
    const gain = audioCtx.createGain();
    gain.gain.value = volume * 0.5;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    return {osc, gain};
}

function playNote(note, duration = 0.1, volume = 1.0) {
    const freq = frequencies[note];
    const {osc, gain} = createOscillator(freq, volume);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

// Build Keyboard
const keyboard = document.getElementById('keyboard');
notes.forEach((note, index) => {
    const key = document.createElement('div');
    key.classList.add('key');
    if (note.includes('#')) key.classList.add('black');
    key.textContent = note;
    key.dataset.note = note;
    key.addEventListener('click', () => {
        playNote(note, 0.2);
        if (isRecording) {
            const selectedTrack = 0; // Default to Track 1 (index 0); 拡張で選択可能に
            const stepToRecord = findNextEmptyStep(selectedTrack);
            if (stepToRecord !== -1) {
                tracks[selectedTrack][stepToRecord] = note;
                updateSequencerUI();
            }
        }
    });
    keyboard.appendChild(key);
});

function findNextEmptyStep(trackIndex) {
    return tracks[trackIndex].findIndex(note => note === null);
}

// Build Sequencer
const tracksDiv = document.getElementById('tracks');
for (let t = 0; t < numTracks; t++) {
    const trackDiv = document.createElement('div');
    trackDiv.classList.add('track');
    const label = document.createElement('span');
    label.classList.add('track-label');
    label.textContent = `Track ${t+1}`;
    trackDiv.appendChild(label);
    const stepsDiv = document.createElement('div');
    stepsDiv.classList.add('steps');
    for (let s = 0; s < numSteps; s++) {
        const step = document.createElement('div');
        step.classList.add('step');
        step.dataset.track = t;
        step.dataset.step = s;
        step.addEventListener('click', () => {
            tracks[t][s] = tracks[t][s] ? null : 'C4'; // Toggle with default note
            updateSequencerUI();
        });
        stepsDiv.appendChild(step);
    }
    trackDiv.appendChild(stepsDiv);
    tracksDiv.appendChild(trackDiv);
}

function updateSequencerUI() {
    document.querySelectorAll('.step').forEach(step => {
        const t = step.dataset.track;
        const s = step.dataset.step;
        step.classList.toggle('active', tracks[t][s] !== null);
        step.textContent = tracks[t][s] || '';
    });
}

updateSequencerUI();

// Player Controls
document.getElementById('play').addEventListener('click', () => {
    if (intervalId) return;
    intervalId = setInterval(() => {
        for (let t = 0; t < numTracks; t++) {
            const note = tracks[t][currentStep];
            if (note) playNote(note, 0.1, trackVolumes[t]);
        }
        currentStep = (currentStep + 1) % numSteps;
        if (!isLooping && currentStep === 0) stop();
    }, (60 / bpm) * 1000 / (numSteps / 4)); // Assuming 4 beats per loop
});

document.getElementById('stop').addEventListener('click', () => {
    clearInterval(intervalId);
    intervalId = null;
    currentStep = 0;
});

document.getElementById('loop').addEventListener('click', (e) => {
    isLooping = !isLooping;
    e.target.textContent = `Loop: ${isLooping ? 'On' : 'Off'}`;
});

document.getElementById('record').addEventListener('click', (e) => {
    isRecording = !isRecording;
    e.target.textContent = `Record: ${isRecording ? 'On' : 'Off'}`;
});

document.getElementById('bpm').addEventListener('change', (e) => {
    bpm = parseInt(e.target.value);
    if (intervalId) {
        clearInterval(intervalId);
        document.getElementById('play').click();
    }
});

// Mixer
const mixer = document.getElementById('mixer');
for (let t = 0; t < numTracks; t++) {
    const mixerTrack = document.createElement('div');
    mixerTrack.classList.add('mixer-track');
    const label = document.createElement('label');
    label.textContent = `Track ${t+1}`;
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = 0;
    slider.max = 1;
    slider.step = 0.01;
    slider.value = 1;
    slider.addEventListener('input', (e) => {
        trackVolumes[t] = parseFloat(e.target.value);
    });
    mixerTrack.appendChild(label);
    mixerTrack.appendChild(slider);
    mixer.appendChild(mixerTrack);
}
