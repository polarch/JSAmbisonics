console.log(webAudioAmbisonic);

// Setup audio context and variables
var AudioContext = window.AudioContext // Default
    || window.webkitAudioContext; // Safari and old versions of Chrome
var context = new AudioContext; // Create and Initialize the Audio Context

var maxOrder = 3;
var orderOut = 3;
var soundBuffer, sound;

// test HOA encoder (panner)
var hoa_encoder = new webAudioAmbisonic.HOA_encoder(context, maxOrder);
console.log(hoa_encoder);
hoa_encoder.azi = 90;
hoa_encoder.elev = 45;
hoa_encoder.updateGains();

// test HOA order limiter
var hoa_limiter = new webAudioAmbisonic.HOA_orderLimiter(context, maxOrder, orderOut);
console.log(hoa_limiter);
for (var i = 0; i < maxOrder; i++) hoa_limiter.updateOrder(i);

// test binaural HOA decoder
var hoa_decoder = new webAudioAmbisonic.HOA_binDecoder(context, maxOrder);
console.log(hoa_decoder);
var hoa_assignFiltersOnLoad = function(buffer) { hoa_decoder.updateFilters(buffer); }
var irUrl = "IRs/IRC_1008_R_HRIR.wav";
var hoa_loader_filters = new webAudioAmbisonic.HOAloader(context, maxOrder, irUrl, hoa_assignFiltersOnLoad);
hoa_loader_filters.load();
hoa_decoder.resetFilters();

// test HOA rotator
var hoa_rotator = new webAudioAmbisonic.HOA_rotator(context, maxOrder);
console.log(hoa_rotator);
hoa_rotator.init();
hoa_rotator.yaw = 10;
hoa_rotator.pitch = 50;
hoa_rotator.roll = -30;
hoa_rotator.updateRotMtx();

// test HOA virtual mic
var hoa_vmic = new webAudioAmbisonic.HOA_vmic(context, maxOrder);
console.log(hoa_vmic);
patternList = ['cardioid', 'supercardioid', 'hypercardioid', 'max_rE'];
patternList.forEach(function(pattern) {
    hoa_vmic.vmicPattern = pattern;
    hoa_vmic.updatePattern();
});

// test HOA converters
var hoa_converter_bf2acn = new webAudioAmbisonic.hoa_converters.HOA_bf2acn(context);
console.log(hoa_converter_bf2acn);
var hoa_converter_acn2bf = new webAudioAmbisonic.hoa_converters.HOA_acn2bf(context);
console.log(hoa_converter_acn2bf);
var hoa_converter_fuma2acn = new webAudioAmbisonic.hoa_converters.HOA_fuma2acn(context, maxOrder);
console.log(hoa_converter_fuma2acn);

// test HOA analyser
var hoa_analyser = new webAudioAmbisonic.HOA_analyser(context, maxOrder);
console.log(hoa_analyser);
hoa_analyser.updateBuffers();
hoa_analyser.computeIntensity();

// test connect - HOA blocks
hoa_encoder.out.connect(hoa_limiter.in);
hoa_limiter.out.connect(hoa_decoder.in);
hoa_decoder.out.connect(context.destination);

// ------------------------------------------------

// test FOA analyser
var foa_analyser = new webAudioAmbisonic.Bformat_analyser(context);
console.log(foa_analyser);
foa_analyser.updateBuffers();
foa_analyser.computeIntensity();

// test FOA decoder
var foa_decoder = new webAudioAmbisonic.Bformat_binDecoder(context);
var foa_assignFiltersOnLoad = function(buffer) { foa_decoder.updateFilters(buffer); }
var foa_loader_filters = new webAudioAmbisonic.HOAloader(context, maxOrder, irUrl, foa_assignFiltersOnLoad);
foa_loader_filters.load();
foa_decoder.resetFilters();

// test FOA encoder
var foa_encoder = new webAudioAmbisonic.Bformat_encoder(context);
console.log(foa_encoder);
foa_encoder.azi = 90;
foa_encoder.elev = 45;
foa_encoder.updateGains();

// test FOA rotator
var foa_rotator = new webAudioAmbisonic.Bformat_rotator(context);
console.log(foa_rotator);
foa_rotator.yaw = 10;
foa_rotator.pitch = 50;
foa_rotator.roll = -30;
foa_rotator.updateRotMtx();

// test FOA virtual mic
var foa_vmic = new webAudioAmbisonic.Bformat_vmic(context);
console.log(foa_vmic);
patternList = ['subcardioid', 'cardioid', 'supercardioid', 'hypercardioid', 'dipole'];
patternList.forEach(function(pattern) {
    foa_vmic.vmicPattern = pattern;
    foa_vmic.updatePattern();
});
foa_vmic.azi = 90;
foa_vmic.elev = 45;
foa_vmic.updateOrientation();
foa_vmic.updateGains();
