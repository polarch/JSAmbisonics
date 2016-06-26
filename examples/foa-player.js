console.log(webAudioAmbisonic);

// adapt common html elements to specific example
document.getElementById("div-reverb").outerHTML='';
document.getElementById("div-order").outerHTML='';
document.getElementById("move-map-instructions").outerHTML='Click on the map to rotate the scene:';

// Setup audio context and variables
var AudioContext = window.AudioContext // Default
    || window.webkitAudioContext; // Safari and old versions of Chrome
var context = new AudioContext; // Create and Initialize the Audio Context

var soundUrl = "sounds/BF_rec1.wav";
var irUrl = "IRs/BF_filters_direct.wav";

var soundBuffer, sound;

// initialize B-format rotator
var rotator = new webAudioAmbisonic.Bformat_rotator(context);
console.log(rotator);
// initialize B-format decoder
var decoder = new webAudioAmbisonic.Bformat_binDecoder(context);
console.log(decoder);
// initialize B-format analyser
var analyser = new webAudioAmbisonic.Bformat_analyser(context);
console.log(analyser);

// connect graph
rotator.out.connect(analyser.in);
analyser.out.connect(decoder.in);
decoder.out.connect(context.destination);

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
    // function to assign sample to the filter buffers for convolution
var assignSample2Filters = function(decodedBuffer) {
    decoder.updateFilters(decodedBuffer);
}

// load and assign samples
loadSample(soundUrl, assignSample2SoundBuffer);
loadSample(irUrl, assignSample2Filters);

// Init GUI
document.getElementById('play').disabled = true;
document.getElementById('stop').disabled = true;

// Define mouse drag on spatial map .png local impact
function mouseActionLocal(angleXY) {
    rotator.yaw = -angleXY[0];
    rotator.pitch = angleXY[1];
    rotator.updateRotMtx();
}

function drawLocal() {
    // Update audio analyser buffers
    analyser.updateBuffers();
    var params = analyser.computeIntensity();
    updateCircles(params, canvas);
}

// Init event listeners
document.getElementById('play').addEventListener('click', function() {
    sound = context.createBufferSource();
    sound.buffer = soundBuffer;
    sound.loop = true;
    sound.connect(rotator.in);
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
