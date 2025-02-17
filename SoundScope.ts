const audioContext = new AudioContext();
const analyser = audioContext.createAnalyser();
analyser.fftSize = 1024; // Adjust for different levels of detail

const canvas = document.getElementById("visualizer") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const audioElement = document.getElementById("audio") as HTMLAudioElement;
const source = audioContext.createMediaElementSource(audioElement);
source.connect(analyser);
analyser.connect(audioContext.destination);

let mode = 0; // 0 = waveform, 1 = frequency bars, 2 = oscilloscope-like

document.getElementById("toggleMode")?.addEventListener("click", () => {
    mode = (mode + 1) % 3; // Cycle through modes
});

function draw() {
    requestAnimationFrame(draw);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (mode === 0) drawWaveform();
    else if (mode === 1) drawFrequencyBars();
    else drawOscilloscope();
}

function drawWaveform() {
    const bufferLength = analyser.fftSize;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteTimeDomainData(dataArray);

    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.beginPath();

    const sliceWidth = canvas.width / bufferLength;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        x += sliceWidth;
    }

    ctx.stroke();
}

function drawFrequencyBars() {
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);

    const barWidth = (canvas.width / bufferLength) * 2.5;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height;
        ctx.fillStyle = `rgb(${dataArray[i]}, 100, 255)`;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
    }
}

function drawOscilloscope() {
    const bufferLength = analyser.fftSize;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteTimeDomainData(dataArray);

    ctx.strokeStyle = "cyan";
    ctx.lineWidth = 2;
    ctx.beginPath();

    const radius = Math.min(canvas.width, canvas.height) / 3;
    for (let i = 0; i < bufferLength; i++) {
        const angle = (i / bufferLength) * Math.PI * 2;
        const v = dataArray[i] / 255;
        const x = canvas.width / 2 + Math.cos(angle) * radius * v;
        const y = canvas.height / 2 + Math.sin(angle) * radius * v;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }

    ctx.closePath();
    ctx.stroke();
}

// Start visualization when audio plays
audioElement.addEventListener("play", () => {
    if (audioContext.state === "suspended") audioContext.resume();
    draw();
});