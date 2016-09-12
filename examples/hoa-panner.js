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

var soundUrl = "sounds/sample1.ogg";
var irUrl_0 = "IRs/HOA3_IRC_1008_virtual.wav";
var irUrl_1 = "IRs/aalto2016_N3.wav";
var irUrl_2 = "IRs/HOA3_BRIRs-medium.wav";

var maxOrder = 3;
var orderOut = 3;
var soundBuffer, sound;

// define HOA encoder (panner)
var encoder = new ambisonics.monoEncoder(context, maxOrder);
console.log(encoder);
// define HOA mirroring
var mirror = new ambisonics.sceneMirror(context, maxOrder);
console.log(mirror);
// define HOA order limiter (to show the effect of order)
var limiter = new ambisonics.orderLimiter(context, maxOrder, orderOut);
console.log(limiter);
// binaural HOA decoder
var decoder = new ambisonics.binDecoder(context, maxOrder);
console.log(decoder);
// intensity analyser
var analyser = new ambisonics.intensityAnalyser(context, maxOrder);
console.log(analyser);
// output gain
var gainOut = context.createGain();

// connect HOA blocks
encoder.out.connect(mirror.in);

mirror.out.connect(analyser.in);
mirror.out.connect(limiter.in);
limiter.out.connect(decoder.in);
decoder.out.connect(gainOut);
gainOut.connect(context.destination);

// function to assign sample to the sound buffer for playback (and enable playbutton)
var assignSample2SoundBuffer = function(decodedBuffer) {
    soundBuffer = decodedBuffer;
    document.getElementById('play').disabled = false;
}

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
loadSample(soundUrl, assignSample2SoundBuffer);

// load filters and assign to buffers
var assignFiltersOnLoad = function(buffer) {
    decoder.updateFilters(buffer);
}
var loader_filters = new ambisonics.HOAloader(context, maxOrder, irUrl_0, assignFiltersOnLoad);
loader_filters.load();

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

// Define mouse drag on spatial map .png local impact
function mouseActionLocal(angleXY) {
    encoder.azim = angleXY[0];
    encoder.elev = angleXY[1];
    encoder.updateGains();
}

function drawLocal() {
    // Update audio analyser buffers
    analyser.updateBuffers();
    var params = analyser.computeIntensity();
    updateCircles(params, canvas);
}

$.holdReady( true ); // to force awaiting on common.html loading

$(document).ready(function() {

    // update sample list for selection
    var sampleList = {"drum loop": "sounds/sample1.ogg",
    "speech": "sounds/sample2.ogg"
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
        sound.connect(encoder.in);
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

    // Order control buttons
    orderValue.innerHTML = maxOrder;
    var orderButtons = document.getElementById("div-order");
    for (var i=1; i<=maxOrder; i++) {
        var button = document.createElement("button");
        button.setAttribute("id", 'N'+i);
        button.setAttribute("value", i);
        button.innerHTML = 'N'+i;
        button.addEventListener('click', function() {
            orderOut = parseInt(this.value);
            orderValue.innerHTML = orderOut;
            limiter.updateOrder(orderOut);
            limiter.out.connect(decoder.in);
        });
        orderButtons.appendChild(button);
    }

    // Decoding buttons
    var decoderButtons = document.getElementById("div-decoder");
    var decoderStringList = ['Free-field HRIRs 1','Free-field HRIRs 2','Medium room BRIRs'];
    decoderValue.innerHTML = decoderStringList[0];
    var irUrlList = [irUrl_0, irUrl_1, irUrl_2];
    for (i=0; i<irUrlList.length; i++) {
                  
      var button = document.createElement("button");
      button.setAttribute("id", 'R'+i);
      button.setAttribute("value", irUrlList[i]);
      button.innerHTML = decoderStringList[i];
      button.addEventListener('click', function() {
                              decoderValue.innerHTML = this.innerHTML;
                              loader_filters = new ambisonics.HOAloader(context, maxOrder, this.value, assignFiltersOnLoad);
                              loader_filters.load();
                              });
      decoderButtons.appendChild(button);
    }
    
    // Mirror Buttons actions
    for (var i=0; i<4; i++) {
    var button = document.getElementById('M'+i);
    button.addEventListener('click', function() {
                          mirrorValue.innerHTML = this.innerHTML;
                          mirror.mirror(parseInt(this.value));
                          });
    }

});
