console.log(ambisonics);

// Setup audio context and variables
var AudioContext = window.AudioContext // Default
    || window.webkitAudioContext; // Safari and old versions of Chrome
var context = new AudioContext; // Create and Initialize the Audio Context

var maxOrder = 3;
var orderOut = 3;
var soundBuffer, sound;

// test HOA encoder (panner)
var hoa_encoder = new ambisonics.monoEncoder(context, maxOrder);
console.log(hoa_encoder);
hoa_encoder.azim = 90;
hoa_encoder.elev = 45;
hoa_encoder.updateGains();

// test HOA convolver
var hoa_convolver = new ambisonics.convolver(context, maxOrder);
console.log(hoa_convolver);

// test HOA order limiter
var hoa_limiter = new ambisonics.orderLimiter(context, maxOrder, orderOut);
console.log(hoa_limiter);
for (var i = 0; i < maxOrder; i++) hoa_limiter.updateOrder(i);

// test HOA order weighting
var hoa_weight = new ambisonics.orderWeight(context, maxOrder);
console.log(hoa_weight);
hoa_weight.computeMaxRECoeffs();
hoa_weight.updateOrderGains();

// test binaural HOA decoder
var hoa_binDecoder = new ambisonics.binDecoder(context, maxOrder);
hoa_binDecoder.resetFilters();
console.log(hoa_binDecoder);

// test Ambisonic HOA decoder
var hoa_decoder = new ambisonics.decoder(context, maxOrder);
let spkSphPosArray = [ [0, 0, 1], [90, 0, 1], [180, 0, 1], [270, 0, 1], [0, 90, 1], [0, -90, 1] ];
hoa_decoder.speakerPos = spkSphPosArray;
console.log(hoa_decoder);

// let m = hoa_ambiDecoder._decodingMatrix;
// for (let i = 0; i < m.length; i++) {
//     for (let j = 0; j < m[0].length; j++) {
//     	console.log(i, j, m[i][j]);
// 	}
// }
// test HOA loader
var hoa_assignFiltersOnLoad = function(buffer) { hoa_binDecoder.updateFilters(buffer); }
var irUrl = 'IRs/ambisonic2binaural_filters/HOA3_IRC_1008_virtual.wav';
var hoa_loader_filters = new ambisonics.HOAloader(context, maxOrder, irUrl, hoa_assignFiltersOnLoad);
hoa_loader_filters.load();
hoa_binDecoder.resetFilters();
console.log(hoa_loader_filters);

// test SOFA HRIR loader
var irUrl_01 = 'IRs/local_JSON_format/HRIR_CIRC360_NF025.json';
var assignFiltersOnLoad2 = function(buffer) { hoa_binDecoder.updateFilters(buffer); }
var hrir_loader = new ambisonics.HRIRloader_local(context, maxOrder, assignFiltersOnLoad2);
hrir_loader.load(irUrl_01);
console.log(hrir_loader);

// test HOA convolver
var hoa_assignFiltersOnLoad3 = function(buffer) { hoa_convolver.updateFilters(buffer); }
var irUrl = 'IRs/ambisonicRIRs/room_2.wav';
var hoa_loader_conv = new ambisonics.HOAloader(context, maxOrder, irUrl, hoa_assignFiltersOnLoad3);
hoa_loader_conv.load();
console.log(hoa_loader_conv);

// test HOA rotator
var hoa_rotator = new ambisonics.sceneRotator(context, maxOrder);
console.log(hoa_rotator);
hoa_rotator.yaw = 10;
hoa_rotator.pitch = 50;
hoa_rotator.roll = -30;
hoa_rotator.updateRotMtx();

// test HOA mirror
var hoa_mirror = new ambisonics.sceneMirror(context, maxOrder);
console.log(hoa_mirror);
var mirrorPlaneList = [0, 1, 2, 3, 4]
mirrorPlaneList.forEach(function(planeNo) {
                        hoa_mirror.mirror(planeNo);
                    });
hoa_mirror.reset();

// test HOA virtual mic
var hoa_vmic = new ambisonics.virtualMic(context, maxOrder);
console.log(hoa_vmic);
patternList = ['cardioid', 'supercardioid', 'hypercardioid', 'max_rE'];
patternList.forEach(function(pattern) {
    hoa_vmic.vmicPattern = pattern;
    hoa_vmic.updatePattern();
});

// test HOA converters
var hoa_converter_wxyz2acn = new ambisonics.converters.wxyz2acn(context);
console.log(hoa_converter_wxyz2acn);
var hoa_converter_acn2wxyz = new ambisonics.converters.acn2wxyz(context);
console.log(hoa_converter_acn2wxyz);
var hoa_converter_n3d2sn3d = new ambisonics.converters.n3d2sn3d(context, maxOrder);
console.log(hoa_converter_n3d2sn3d);
var hoa_converter_sn3d2n3d = new ambisonics.converters.sn3d2n3d(context, maxOrder);
console.log(hoa_converter_sn3d2n3d);
var hoa_converter_fuma2acn = new ambisonics.converters.fuma2acn(context, maxOrder);
console.log(hoa_converter_fuma2acn);

// test HOA analyser
var hoa_analyser = new ambisonics.intensityAnalyser(context);
console.log(hoa_analyser);
hoa_analyser.updateBuffers();
hoa_analyser.computeIntensity();

// test connect - HOA blocks
hoa_encoder.out.connect(hoa_limiter.in);
hoa_limiter.out.connect(hoa_binDecoder.in);
hoa_binDecoder.out.connect(context.destination);
