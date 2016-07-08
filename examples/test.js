console.log(webAudioAmbisonic);

// Setup audio context and variables
var AudioContext = window.AudioContext // Default
    || window.webkitAudioContext; // Safari and old versions of Chrome
var context = new AudioContext; // Create and Initialize the Audio Context

var maxOrder = 3;
var orderOut = 3;
var soundBuffer, sound;

// test HOA encoder (panner)
var hoa_encoder = new webAudioAmbisonic.monoEncoder(context, maxOrder);
console.log(hoa_encoder);
hoa_encoder.azim = 90;
hoa_encoder.elev = 45;
hoa_encoder.updateGains();

// test HOA order limiter
var hoa_limiter = new webAudioAmbisonic.orderLimiter(context, maxOrder, orderOut);
console.log(hoa_limiter);
for (var i = 0; i < maxOrder; i++) hoa_limiter.updateOrder(i);

// test binaural HOA decoder
var hoa_decoder = new webAudioAmbisonic.binDecoder(context, maxOrder);
console.log(hoa_decoder);
var hoa_assignFiltersOnLoad = function(buffer) { hoa_decoder.updateFilters(buffer); }
var irUrl = "IRs/IRC_1008_R_HRIR_virtual.wav";
var hoa_loader_filters = new webAudioAmbisonic.HOAloader(context, maxOrder, irUrl, hoa_assignFiltersOnLoad);
hoa_loader_filters.load();
hoa_decoder.resetFilters();

// test HOA rotator
var hoa_rotator = new webAudioAmbisonic.sceneRotator(context, maxOrder);
console.log(hoa_rotator);
hoa_rotator.init();
hoa_rotator.yaw = 10;
hoa_rotator.pitch = 50;
hoa_rotator.roll = -30;
hoa_rotator.updateRotMtx();

// test HOA virtual mic
var hoa_vmic = new webAudioAmbisonic.virtualMic(context, maxOrder);
console.log(hoa_vmic);
patternList = ['cardioid', 'supercardioid', 'hypercardioid', 'max_rE'];
patternList.forEach(function(pattern) {
    hoa_vmic.vmicPattern = pattern;
    hoa_vmic.updatePattern();
});

// test HOA converters
var hoa_converter_bf2acn = new webAudioAmbisonic.converters.bf2acn(context);
console.log(hoa_converter_bf2acn);
var hoa_converter_acn2bf = new webAudioAmbisonic.converters.acn2bf(context);
console.log(hoa_converter_acn2bf);
var hoa_converter_fuma2acn = new webAudioAmbisonic.converters.fuma2acn(context, maxOrder);
console.log(hoa_converter_fuma2acn);

// test HOA analyser
var hoa_analyser = new webAudioAmbisonic.intensityAnalyser(context, maxOrder);
console.log(hoa_analyser);
hoa_analyser.updateBuffers();
hoa_analyser.computeIntensity();

// test connect - HOA blocks
hoa_encoder.out.connect(hoa_limiter.in);
hoa_limiter.out.connect(hoa_decoder.in);
hoa_decoder.out.connect(context.destination);

