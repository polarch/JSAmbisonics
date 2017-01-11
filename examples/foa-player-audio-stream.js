console.log(ambisonics);

// Setup audio context and variables
var AudioContext = window.AudioContext // Default
    || window.webkitAudioContext; // Safari and old versions of Chrome
var context = new AudioContext; // Create and Initialize the Audio Context

var irUrl = "IRs/aalto2016_N1.wav";
var soundBuffer, sound, soundUrl;
var maxOrder = 1;

// define HOA rotator
var rotator = new ambisonics.sceneRotator(context, maxOrder);
console.log(rotator);
// binaural HOA decoder
var decoder = new ambisonics.binDecoder(context, maxOrder);
console.log(decoder);
// intensity analyser
var analyser = new ambisonics.intensityAnalyser(context, maxOrder);
console.log(analyser);
// FuMa to ACN converter
var converterF2A = new ambisonics.converters.wxyz2acn(context);
console.log(converterF2A);

// connect diagram
converterF2A.out.connect(rotator.in);
rotator.out.connect(decoder.in);
rotator.out.connect(analyser.in);
decoder.out.connect(context.destination);

// function to load samples
function loadSample(url, doAfterLoading) {
    var fetchSound = new XMLHttpRequest(); // Load the Sound with XMLHttpRequest
    fetchSound.open("GET", url, true); // Path to Audio File
    fetchSound.responseType = "arraybuffer"; // Read as Binary Data
    fetchSound.onload = function() {
        context.decodeAudioData(fetchSound.response, doAfterLoading, onDecodeAudioDataError);
    }
    fetchSound.send();
}

// function to assign sample to the filter buffers for convolution
var assignSample2Filters = function(decodedBuffer) {
    decoder.updateFilters(decodedBuffer);
}

// load and assign samples
loadSample(irUrl, assignSample2Filters);

// function to change sample from select box
function changeSample() {
    soundUrl = document.getElementById("sample_no").value;
    var audioElmt = document.getElementById("audioElmt")
    audioElmt.src = soundUrl;
    audioElmt.play();
}

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
    document.getElementById("move-map-instructions").outerHTML='Click on the map to rotate the scene:';
    document.getElementById("div-mirror").innerHTML='';
    document.getElementById("div-decoder").outerHTML='';
    document.getElementById("div-order").outerHTML='';
    document.getElementById("volume-slider").disabled=true;

    // create HTML audio element 
    document.getElementById("div-play-stop-buttons").innerHTML = 
    "<div> <audio controls id='audioElmt' >" + 
    " <source src='sounds/BF_rec1.ogg' type='audio/ogg' />" + 
    " <source src='sounds/BF_rec1.wav' type='audio/wav' />" + 
    " </audio> </div>" + 
    "<div> <p> <i> (only the first sample is functional on Safari) </i> </p> </div>";

    var audioElmt = document.getElementById("audioElmt");
    audioElmt.loop = true;

    // define source node streaming audio from HTML audio elmt
    var mediaElmtSource = context.createMediaElementSource(audioElmt);
    console.log(mediaElmtSource);    

    mediaElmtSource.connect(converterF2A.in);

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
});
