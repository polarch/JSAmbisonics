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

var soundUrl = "sounds/HOA3_rec4.wav";
var soundBuffer, sound;
var maxOrder = 3;

// initialize virtual micorphone block
var vmic = new webAudioAmbisonic.virtualMic(context, maxOrder);
console.log(vmic);
// HOA analyser
var analyser = new webAudioAmbisonic.intensityAnalyser(context, maxOrder);
console.log(analyser);
// ACN to Fuma converter
var converterA2F = new webAudioAmbisonic.converters.acn2bf(context);
console.log(converterA2F);
// output gain
var gainOut = context.createGain();

// connect HOA blocks
vmic.out.connect(gainOut);
gainOut.connect(context.destination);
converterA2F.out.connect(analyser.in);

// load samples and assign to buffers
var assignSoundBufferOnLoad = function(buffer) {
    soundBuffer = buffer;
    document.getElementById('play').disabled = false;
}

var loader_sound = new webAudioAmbisonic.HOAloader(context, maxOrder, soundUrl, assignSoundBufferOnLoad);
loader_sound.load();

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
        sound.connect(vmic.in);
        sound.connect(converterA2F.in);
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
