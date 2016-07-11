console.log(webAudioAmbisonic);

// Setup audio context and variables
var AudioContext = window.AudioContext // Default
    || window.webkitAudioContext; // Safari and old versions of Chrome
var context = new AudioContext; // Create and Initialize the Audio Context

// added resume context to handle Firefox suspension of it when new IR loaded
// see: http://stackoverflow.com/questions/32955594/web-audio-scriptnode-not-called-after-button-onclick
context.onstatechange = function() {
    if (context.state === "suspended") { context.resume(); }
}

var soundUrl = "./sounds/BF_rec1.wav";
var soundBuffer, sound;

// initialize virtual micorphone block
var vmic = new webAudioAmbisonic.virtualMic(context, 1);
console.log(vmic);
// initialize B-format analyser
var analyser = new webAudioAmbisonic.intensityAnalyser(context);
console.log(analyser);
// converter from FuMa to ACN
var converterF2A = new webAudioAmbisonic.converters.bf2acn(context);
// output gain
var gainOut = context.createGain();

// connect HOA blocks
converterF2A.out.connect(vmic.in);
vmic.out.connect(gainOut);
gainOut.connect(context.destination);

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

// Define mouse drag on spatial map .png local impact
function mouseActionLocal(angleXY) {
    vmic.azim = angleXY[0];
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

$.holdReady( true ); // to force awaiting on common.html loading

$(document).ready(function() {

    // adapt common html elements to specific example
    document.getElementById("div-reverb").outerHTML = '';
    document.getElementById("div-order").outerHTML = '';
    document.getElementById("move-map-instructions").outerHTML = 'Click on the map to rotate the microphone:';

    // handle buttons
    document.getElementById('play').addEventListener('click', function() {
        sound = context.createBufferSource();
        sound.buffer = soundBuffer;
        sound.loop = true;
        sound.connect(converterF2A.in);
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

});
