console.log(ambisonics);

// Setup audio context and variables
var AudioContext = window.AudioContext // Default
    || window.webkitAudioContext; // Safari and old versions of Chrome
var context = new AudioContext; // Create and Initialize the Audio Context

// added resume context to handle Firefox suspension of it when new IR loaded
// see: http://stackoverflow.com/questions/32955594/web-audio-scriptnode-not-called-after-button-onclick
context.onstatechange = function() {
    if (context.state === "suspended") { context.resume(); }
}

var soundUrl = "sounds/HOA3_rec1.ogg";
var soundBuffer, sound;
var maxOrder = 3;

// initialize virtual micorphone block
var vmic = new ambisonics.virtualMic(context, maxOrder);
console.log(vmic);
// HOA analyser
var analyser = new ambisonics.intensityAnalyser(context, maxOrder);
console.log(analyser);
// output gain
var gainOut = context.createGain();

// connect HOA blocks
vmic.out.connect(gainOut);
gainOut.connect(context.destination);

// load samples and assign to buffers
var assignSoundBufferOnLoad = function(buffer) {
    soundBuffer = buffer;
    document.getElementById('play').disabled = false;
}

var loader_sound = new ambisonics.HOAloader(context, maxOrder, soundUrl, assignSoundBufferOnLoad);
loader_sound.load();

// function to change sample from select box
function changeSample() {
    document.getElementById('play').disabled = true;
    document.getElementById('stop').disabled = true;
    soundUrl = document.getElementById("sample_no").value;
    if (typeof sound != 'undefined' && sound.isPlaying) {
        sound.stop(0);
        sound.isPlaying = false;
    }
    loader_sound = new ambisonics.HOAloader(context, maxOrder, soundUrl, assignSoundBufferOnLoad);
    loader_sound.load();
}

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
    document.getElementById("div-decoder").outerHTML = '';
    document.getElementById("div-order").outerHTML = '';
    document.getElementById("div-mirror").outerHTML = '';
    document.getElementById("move-map-instructions").outerHTML = 'Click on the map to rotate the microphone:';

    // update sample list for selection
    var sampleList = {  "orchestral 1": "sounds/HOA3_rec1.ogg",
                        "orchestral 2": "sounds/HOA3_rec2.ogg",
                        "orchestral 3": "sounds/HOA3_rec3.ogg",
                        "theatrical": "sounds/HOA3_rec4.ogg"
    };
    var $el = $("#sample_no");
    $el.empty(); // remove old options
    $.each(sampleList, function(key,value) {
         $el.append($("<option></option>")
                    .attr("value", value).text(key));
         });
                  
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

});
