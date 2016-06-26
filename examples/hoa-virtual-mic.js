console.log(webAudioAmbisonic);

// adapt common html elements to specific example
document.getElementById("div-reverb").outerHTML='';
document.getElementById("div-analyser").outerHTML='';
document.getElementById("move-map-instructions").outerHTML='Click on the map to rotate the microphone:';


// Setup audio context and variables
var AudioContext = window.AudioContext // Default
    || window.webkitAudioContext; // Safari and old versions of Chrome
var context = new AudioContext; // Create and Initialize the Audio Context

var soundUrl = "sounds/HOA3_rec4.wav";
var soundBuffer, sound;
var maxOrder = 3;

// initialize virtual micorphone block
var vmic = new webAudioAmbisonic.HOA_vmic(context, maxOrder);

// connect HOA blocks
vmic.out.connect(context.destination);

// load samples and assign to buffers
var assignSoundBufferOnLoad = function(buffer) {
    soundBuffer = buffer;
    document.getElementById('play').disabled = false;
}

var loader_sound = new webAudioAmbisonic.HOAloader(context, maxOrder, soundUrl, assignSoundBufferOnLoad);
loader_sound.load();


// Init GUI
document.getElementById('play').disabled = true;
document.getElementById('stop').disabled = true;

// Define mouse drag on spatial map .png local impact
function mouseActionLocal(angleXY) {
    vmic.azi = angleXY[0];
    vmic.elev = angleXY[1];
    vmic.updateOrientation();
}

function changePattern() {
 vmic.vmicPattern = document.getElementById("pattern_id").value;
 vmic.updatePattern();
}

// handle buttons
document.getElementById('play').addEventListener('click', function() {
    sound = context.createBufferSource();
    sound.buffer = soundBuffer;
    sound.loop = true;
    sound.connect(vmic.in);
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
