console.log(webAudioAmbisonic);

// Setup audio context and variables
var AudioContext = window.AudioContext // Default
    || window.webkitAudioContext; // Safari and old versions of Chrome
var context = new AudioContext; // Create and Initialize the Audio Context

var soundUrl = "sounds/4-Audio-Track.wav";
var irUrl_0 = "IRs/IRC_1008_R_HRIR_virtual.wav";
var irUrl_1 = "IRs/HOA4_filters_direct.wav";
var irUrl_2 = "IRs/room-medium-1-furnished-src-20-Set1.wav";

var maxOrder = 3;
var orderOut = 3;
var soundBuffer, sound;

// define HOA encoder (panner)
var encoder = new webAudioAmbisonic.HOA_encoder(context, maxOrder);
console.log(encoder);
// define HOA order limiter (to show the effect of order)
var limiter = new webAudioAmbisonic.HOA_orderLimiter(context, maxOrder, orderOut);
console.log(limiter);
// binaural HOA decoder
var decoder = new webAudioAmbisonic.HOA_binDecoder(context, maxOrder);
console.log(decoder);
// HOA analyser
var analyser = new webAudioAmbisonic.HOA_analyser(context, maxOrder);
// var analyser = new webAudioAmbisonic.Bformat_analyser(context);
// var converter = new webAudioAmbisonic.hoa_converters.HOA_acn2bf(context);
console.log(analyser);

// connect HOA blocks
// encoder.out.connect(converter.in);
// converter.out.connect(analyser.in);
encoder.out.connect(analyser.in);
encoder.out.connect(limiter.in);
limiter.out.connect(decoder.in);
decoder.out.connect(context.destination);

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
var loader_filters = new webAudioAmbisonic.HOAloader(context, maxOrder, irUrl_0, assignFiltersOnLoad);
loader_filters.load();


// load and assign samples
document.getElementById('play').disabled = true;
document.getElementById('stop').disabled = true;

// Define mouse drag on spatial map .png local impact
function mouseActionLocal(angleXY) {
    encoder.azi = angleXY[0];
    encoder.elev = angleXY[1];
    encoder.updateGains();
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

document.getElementById('N1').addEventListener('click', function() {
    orderOut = 1;
    orderValue.innerHTML = orderOut;
    limiter.updateOrder(orderOut);
    limiter.out.connect(decoder.in);
});
document.getElementById('N2').addEventListener('click', function() {
    orderOut = 2;
    orderValue.innerHTML = orderOut;
    limiter.updateOrder(orderOut);
    limiter.out.connect(decoder.in);
});
document.getElementById('N3').addEventListener('click', function() {
    orderOut = 3;
    orderValue.innerHTML = orderOut;
    limiter.updateOrder(orderOut);
    limiter.out.connect(decoder.in);
});

document.getElementById('R0').addEventListener('click', function() {
    reverbOut = 0;
    reverbValue.innerHTML = 'None (virtual)';
    loader_filters = new webAudioAmbisonic.HOAloader(context, maxOrder, irUrl_0, assignFiltersOnLoad);
    loader_filters.load();
});
document.getElementById('R1').addEventListener('click', function() {
    reverbOut = 1;
    reverbValue.innerHTML = 'None (direct)';
    loader_filters = new webAudioAmbisonic.HOAloader(context, maxOrder, irUrl_1, assignFiltersOnLoad);
    loader_filters.load();
});
document.getElementById('R2').addEventListener('click', function() {
    reverbOut = 2;
    reverbValue.innerHTML = 'Medium Room';
    loader_filters = new webAudioAmbisonic.HOAloader(context, maxOrder, irUrl_2, assignFiltersOnLoad);
    loader_filters.load();
});

