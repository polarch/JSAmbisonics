console.log(webAudioAmbisonic);

// adapt common html elements to specific example
document.getElementById("div-reverb").outerHTML='';
document.getElementById("div-order").outerHTML='';
document.getElementById("move-map-instructions").outerHTML='Click on the map to rotate the microphone:';


// Setup audio context and variables
var AudioContext = window.AudioContext // Default
    || window.webkitAudioContext; // Safari and old versions of Chrome
var context = new AudioContext; // Create and Initialize the Audio Context

var soundUrl = "./sounds/BF_rec1.wav";
var soundBuffer, sound;

// initialize virtual micorphone block
var vmic = new webAudioAmbisonic.Bformat_vmic(context);
// initialize B-format analyser
var analyser = new webAudioAmbisonic.Bformat_analyser(context);
console.log(analyser);

// connect HOA blocks
vmic.out.connect(context.destination);

// function to load samples
function loadSample(url, doAfterLoading) {
    var fetchSound = new XMLHttpRequest(); // Load the Sound with XMLHttpRequest
    fetchSound.open("GET", url, true); // Path to Audio File
    fetchSound.responseType = "arraybuffer"; // Read as Binary Data
    fetchSound.onload = function() {
        context.decodeAudioData(fetchSound.response, doAfterLoading);
    }
    fetchSound.send();
}

// function to assign sample to the sound buffer for playback (and enable playbutton)
var assignSample2SoundBuffer = function(decodedBuffer) {
    soundBuffer = decodedBuffer;
    document.getElementById('play').disabled = false;
}

// load and assign samples
loadSample(soundUrl, assignSample2SoundBuffer);

// Init GUI
document.getElementById('play').disabled = true;
document.getElementById('stop').disabled = true;

// Define mouse drag on spatial map .png local impact
function mouseActionLocal(angleXY) {
    vmic.azi = angleXY[0];
    vmic.elev = angleXY[1];
    vmic.updateOrientation();
}

function drawLocal() {
    // Update audio analyser buffers
    analyser.updateBuffers();
    var params = analyser.computeIntensity();
    updateCircles(params, canvas);
}

function changePattern() {
 vmic.vmicPattern = document.getElementById("pattern_id").value;
 vmic.updatePattern();
}

// handle buttons
document.getElementById('play').addEventListener('click', function() {
    sound = context.createBufferSource();
    sound.buffer = soundBuffer;
    sound.loop = true;
    sound.connect(vmic.in);
    sound.connect(analyser.in);
    sound.start(0);
    sound.isPlaying = true;
    document.getElementById('play').disabled = true;
    document.getElementById('stop').disabled = false;
});
document.getElementById('stop').addEventListener('click', function() {
    sound.stop(0);
    sound.isPlaying = false;
    document.getElementById('play').disabled = false;
    document.getElementById('stop').disabled = true;
});
