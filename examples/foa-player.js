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

var soundUrl = "sounds/BF_rec1.ogg";
var irUrl = "IRs/HOA1_IRC_1008_virtual.wav";

var soundBuffer, sound;

// initialize ambisonic mirroring
var mirror = new webAudioAmbisonic.sceneMirror(context, 1);
console.log(mirror);
// initialize ambisonic rotator
var rotator = new webAudioAmbisonic.sceneRotator(context, 1);
console.log(rotator);
// initialize ambisonic decoder
var decoder = new webAudioAmbisonic.binDecoder(context, 1);
console.log(decoder);
// initialize ambisonic analyser
var analyser = new webAudioAmbisonic.intensityAnalyser(context);
console.log(analyser);
// FuMa to ACN converter
var converterF2A = new webAudioAmbisonic.converters.wxyz2acn(context);
console.log(converterF2A);
// output gain
var gainOut = context.createGain();

// connect graph
converterF2A.out.connect(mirror.in);
mirror.out.connect(rotator.in);
rotator.out.connect(decoder.in);
rotator.out.connect(analyser.in);
decoder.out.connect(gainOut);
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
    // function to assign sample to the filter buffers for convolution
var assignSample2Filters = function(decodedBuffer) {
    decoder.updateFilters(decodedBuffer);
}
// function to change sample from select box
function changeSample() {
    document.getElementById('play').disabled = true;
    document.getElementById('stop').disabled = true;
    soundUrl = document.getElementById("sample_no").value;
    if (typeof sound != 'undefined' && sound.isPlaying) {
        sound.stop(0);
        sound.isPlaying = false;
    }
    loadSample(soundUrl, assignSample2SoundBuffer);
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
    document.getElementById("div-decoder").outerHTML='';
    document.getElementById("div-order").outerHTML='';
    document.getElementById("move-map-instructions").outerHTML='Click on the map to rotate the scene:';
                  
    // update sample list for selection
    var sampleList = {  "soundscape": "sounds/BF_rec1.ogg",
                        "big band": "sounds/BF_rec2.ogg",
                        "choir": "sounds/BF_rec3.ogg",
                        "orchestral": "sounds/BF_rec4.ogg",
                        "folk": "sounds/BF_rec5.ogg"
    };
    var $el = $("#sample_no");
    $el.empty(); // remove old options
    $.each(sampleList, function(key,value) {
         $el.append($("<option></option>")
                    .attr("value", value).text(key));
         });

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
                  
    // Mirror Buttons actions
    for (var i=0; i<4; i++) {
        var button = document.getElementById('M'+i);
        button.addEventListener('click', function() {
                                mirrorValue.innerHTML = this.innerHTML;
                                mirror.mirror(parseInt(this.value));
                                });
    }

});
