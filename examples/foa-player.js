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

var soundUrl = "sounds/BF_rec1.wav";
var irUrl = "IRs/HOA1_filters_virtual.wav";

var soundBuffer, sound;

// initialize B-format rotator
var rotator = new webAudioAmbisonic.sceneRotator(context, 1);
rotator.init();
console.log(rotator);
// initialize B-format decoder
var decoder = new webAudioAmbisonic.binDecoder(context, 1);
console.log(decoder);
// initialize B-format analyser
var analyser = new webAudioAmbisonic.intensityAnalyser(context);
console.log(analyser);
// FuMa to ACN converter, and the opposite
var converterF2A = new webAudioAmbisonic.converters.bf2acn(context);
var converterA2F = new webAudioAmbisonic.converters.acn2bf(context);
console.log(converterF2A);
console.log(converterA2F);
// output gain
var gainOut = context.createGain();

// connect graph
converterF2A.out.connect(rotator.in);
rotator.out.connect(decoder.in);
decoder.out.connect(gainOut);
gainOut.connect(context.destination);

rotator.out.connect(converterA2F.in);
converterA2F.out.connect(analyser.in);

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

$.holdReady( true ); // to force awaiting on common.html loading

$(document).ready(function() {

    // adapt common html elements to specific example
    document.getElementById("div-reverb").outerHTML='';
    document.getElementById("div-order").outerHTML='';
    document.getElementById("move-map-instructions").outerHTML='Click on the map to rotate the scene:';

    // Init event listeners
    document.getElementById('play').addEventListener('click', function() {
        sound = context.createBufferSource();
        sound.buffer = soundBuffer;
        sound.loop = true;
        sound.connect(converterF2A.in);
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
