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

var maxOrder = 3;
var orderOut = 3;
var soundBuffer, sound;

// define HOA order limiter (to show the effect of order)
var limiter = new ambisonics.orderLimiter(context, maxOrder, orderOut);
console.log(limiter);
// define HOA rotator
var rotator = new ambisonics.sceneRotator(context, maxOrder);
console.log(rotator);
// HOA decoder
var decoder = new ambisonics.decoder(context, maxOrder);
let spkSphPosArray = [ [0, 0, 1], [90, 0, 1], [180, 0, 1], [270, 0, 1], [0, 90, 1], [0, -90, 1] ];
decoder.speakerPos = spkSphPosArray;
console.log(decoder);
// intensity analyser
var analyser = new ambisonics.intensityAnalyser(context, maxOrder);
console.log(analyser);
// output gain
var gainOut = context.createGain();

// connect HOA blocks
rotator.out.connect(limiter.in);
rotator.out.connect(analyser.in);
limiter.out.connect(decoder.in);
decoder.out.connect(gainOut);
gainOut.connect(context.destination);

// setup audio context number of channel 
var maxChannelCount = context.destination.maxChannelCount;
console.log('max channel in AudioContext:', maxChannelCount, 'required:', decoder.nSpk);
context.destination.channelCount = decoder.nSpk;

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
    document.getElementById('div-mirror').outerHTML = '';

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
         
    // set speaker position element
    setSpkPosContainer = document.getElementById('div-decoder');
    setSpkPosContainer.innerHTML = "<p> Set speaker pos (spherical coords: azim1, elev1, dist1, ... azimN, elevN, distN ):<span id='decoder-value'></span> &nbsp; </p>";
    var input = document.createElement("input");
    input.type = "text";
    input.setAttribute("id", 'spkpos');
    input.setAttribute("value", decoder.speakerPos);
    input.setAttribute("size", 100);
    setSpkPosContainer.appendChild(input); // put it into the DOM
    var button = document.createElement("button");
    button.setAttribute("id", 'spkButton');
    button.innerHTML = 'set';
    button.addEventListener('click', () => {
        let str = document.getElementById('spkpos').value;
        let tmp = str.split(",");
        if( tmp.length % 0 > 0 ){
            alert('wrong format (must be multiple of 3, for a, e, d values');
            return;
        }
        let spkPos = []
        for( let i = 0; i<tmp.length / 3; i++ ){
            spkPos.push( [ Number(tmp[3*i]), Number(tmp[3*i+1]), Number(tmp[3*i+2])] );
        }
        decoder.speakerPos = spkPos;
        decoder.out.connect(gainOut);
        document.getElementById('spkpos').value = decoder.speakerPos;
        
    })
    setSpkPosContainer.appendChild(button); // put it into the DOM

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

});
