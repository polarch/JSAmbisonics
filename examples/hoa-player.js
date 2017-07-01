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
var irUrl_0 = "IRs/ambisonic2binaural_filters/HOA3_IRC_1008_virtual.wav";
var irUrl_1 = "IRs/ambisonic2binaural_filters/aalto2016_N3.wav";
var irUrl_2 = "IRs/ambisonic2binaural_filters/HOA3_BRIRs-medium.wav";

var maxOrder = 3;
var orderOut = 3;
var soundBuffer, sound;

// define HOA mirroring
var mirror = new ambisonics.sceneMirror(context, maxOrder);
console.log(mirror);
// define HOA order limiter (to show the effect of order)
var limiter = new ambisonics.orderLimiter(context, maxOrder, orderOut);
console.log(limiter);
// define HOA rotator
var rotator = new ambisonics.sceneRotator(context, maxOrder);
console.log(rotator);
// binaural HOA decoder
var decoder = new ambisonics.binDecoder(context, maxOrder);
console.log(decoder);
// intensity analyser
var analyser = new ambisonics.intensityAnalyser(context, maxOrder);
console.log(analyser);
// output gain
var gainOut = context.createGain();

// connect HOA blocks
mirror.out.connect(rotator.in);
rotator.out.connect(limiter.in);
rotator.out.connect(analyser.in);
limiter.out.connect(decoder.in);
decoder.out.connect(gainOut);
gainOut.connect(context.destination);

// function to assign sample to the sound buffer for playback (and enable playbutton)
var assignSample2SoundBuffer = function(decodedBuffer) {
    soundBuffer = decodedBuffer;
    document.getElementById('play').disabled = false;
}

// load samples and assign to buffers
var assignSoundBufferOnLoad = function(buffer) {
    soundBuffer = buffer;
    document.getElementById('play').disabled = false;
}
var loader_sound = new ambisonics.HOAloader(context, maxOrder, soundUrl, assignSoundBufferOnLoad);
loader_sound.load();

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
    loader_sound = new ambisonics.HOAloader(context, maxOrder, soundUrl, assignSoundBufferOnLoad);
    loader_sound.load();
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
                  
    // Init event listeners
    document.getElementById('play').addEventListener('click', function() {
        sound = context.createBufferSource();
        sound.buffer = soundBuffer;
        sound.loop = true;
        sound.connect(mirror.in);
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
