(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.ambisonics = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

////////////////////////////////////////////////////////////////////
//  Archontis Politis
//  archontis.politis@aalto.fi
//  David Poirier-Quinot
//  davipoir@ircam.fr
////////////////////////////////////////////////////////////////////
//
//  WebAudio_HOA a JavaScript library for higher-order Ambisonics
//  The library implements Web Audio blocks that perform
//  typical ambisonic processing operations on audio signals.
//
////////////////////////////////////////////////////////////////////

//////////////////////////
/* HOA BINAURAL DECODER */
//////////////////////////

var binDecoder = function () {
    function binDecoder(audioCtx, order) {
        (0, _classCallCheck3.default)(this, binDecoder);


        this.initialized = false;

        this.ctx = audioCtx;
        this.order = order;
        this.nCh = (order + 1) * (order + 1);
        this.decFilters = new Array(this.nCh);
        this.decFilterNodes = new Array(this.nCh);
        // input and output nodes
        this.in = this.ctx.createChannelSplitter(this.nCh);
        this.out = this.ctx.createChannelMerger(2);
        this.out.channelCountMode = 'explicit';
        this.out.channelCount = 1;
        // downmixing gains for left and right ears
        this.gainMid = this.ctx.createGain();
        this.gainSide = this.ctx.createGain();
        this.invertSide = this.ctx.createGain();
        this.gainMid.gain.value = 1;
        this.gainSide.gain.value = 1;
        this.invertSide.gain.value = -1;
        // convolver nodes
        for (var i = 0; i < this.nCh; i++) {
            this.decFilterNodes[i] = this.ctx.createConvolver();
            this.decFilterNodes[i].normalize = false;
        }
        // initialize convolvers to plain cardioids
        this.resetFilters();
        // create audio connections
        for (var i = 0; i < this.nCh; i++) {
            this.in.connect(this.decFilterNodes[i], i, 0);
            var n = Math.floor(Math.sqrt(i));
            var m = i - n * n - n;
            if (m >= 0) this.decFilterNodes[i].connect(this.gainMid);else this.decFilterNodes[i].connect(this.gainSide);
        }
        this.gainMid.connect(this.out, 0, 0);
        this.gainSide.connect(this.out, 0, 0);

        this.gainMid.connect(this.out, 0, 1);
        this.gainSide.connect(this.invertSide, 0, 0);
        this.invertSide.connect(this.out, 0, 1);

        this.initialized = true;
    }

    (0, _createClass3.default)(binDecoder, [{
        key: 'updateFilters',
        value: function updateFilters(audioBuffer) {
            // assign filters to convolvers
            for (var i = 0; i < this.nCh; i++) {
                this.decFilters[i] = this.ctx.createBuffer(1, audioBuffer.length, audioBuffer.sampleRate);
                this.decFilters[i].getChannelData(0).set(audioBuffer.getChannelData(i));

                this.decFilterNodes[i].buffer = this.decFilters[i];
            }
        }
    }, {
        key: 'resetFilters',
        value: function resetFilters() {
            // overwrite decoding filters (plain cardioid virtual microphones)
            var cardGains = new Array(this.nCh);
            cardGains.fill(0);
            cardGains[0] = 0.5;
            cardGains[1] = 0.5 / Math.sqrt(3);
            for (var i = 0; i < this.nCh; i++) {
                // ------------------------------------
                // This works for Chrome and Firefox:
                // this.decFilters[i] = this.ctx.createBuffer(1, 1, this.ctx.sampleRate);
                // this.decFilters[i].getChannelData(0).set([cardGains[i]]);
                // ------------------------------------
                // Safari forces us to use this:
                this.decFilters[i] = this.ctx.createBuffer(1, 64, this.ctx.sampleRate);
                // and will send gorgeous crancky noise bursts for any value below 64
                for (var j = 0; j < 64; j++) {
                    this.decFilters[i].getChannelData(0)[j] = 0.0;
                }
                this.decFilters[i].getChannelData(0)[0] = cardGains[i];
                // ------------------------------------
                this.decFilterNodes[i].buffer = this.decFilters[i];
            }
        }
    }]);
    return binDecoder;
}();

exports.default = binDecoder;

},{"babel-runtime/helpers/classCallCheck":14,"babel-runtime/helpers/createClass":15}],2:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.fuma2acn = exports.n3d2sn3d = exports.sn3d2n3d = exports.acn2wxyz = exports.wxyz2acn = undefined;

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

////////////////////////////////////////////////////////////////////
//  Archontis Politis
//  archontis.politis@aalto.fi
//  David Poirier-Quinot
//  davipoir@ircam.fr
////////////////////////////////////////////////////////////////////
//
//  WebAudio_HOA a JavaScript library for higher-order Ambisonics
//  The library implements Web Audio blocks that perform
//  typical ambisonic processing operations on audio signals.
//
////////////////////////////////////////////////////////////////////

///////////////////////////////////
/* FOA B-FORMAT TO ACN/N3D CONVERTER */
///////////////////////////////////

var wxyz2acn = exports.wxyz2acn = function wxyz2acn(audioCtx) {
    (0, _classCallCheck3.default)(this, wxyz2acn);


    this.ctx = audioCtx;
    this.in = this.ctx.createChannelSplitter(4);
    this.out = this.ctx.createChannelMerger(4);
    this.gains = new Array(4);

    for (var i = 0; i < 4; i++) {
        this.gains[i] = this.ctx.createGain();
        if (i == 0) this.gains[i].gain.value = Math.SQRT2;else this.gains[i].gain.value = Math.sqrt(3);

        this.gains[i].connect(this.out, 0, i);
    }
    this.in.connect(this.gains[0], 0, 0);
    this.in.connect(this.gains[3], 1, 0);
    this.in.connect(this.gains[1], 2, 0);
    this.in.connect(this.gains[2], 3, 0);
};

///////////////////////////////////
/* ACN/N3D TO FOA B-FORMAT CONVERTER */
///////////////////////////////////


var acn2wxyz = exports.acn2wxyz = function acn2wxyz(audioCtx) {
    (0, _classCallCheck3.default)(this, acn2wxyz);


    this.ctx = audioCtx;
    this.in = this.ctx.createChannelSplitter(4);
    this.out = this.ctx.createChannelMerger(4);
    this.gains = new Array(4);

    for (var i = 0; i < 4; i++) {
        this.gains[i] = this.ctx.createGain();
        if (i == 0) this.gains[i].gain.value = Math.SQRT1_2;else this.gains[i].gain.value = 1 / Math.sqrt(3);

        this.gains[i].connect(this.out, 0, i);
    }
    this.in.connect(this.gains[0], 0, 0);
    this.in.connect(this.gains[2], 1, 0);
    this.in.connect(this.gains[3], 2, 0);
    this.in.connect(this.gains[1], 3, 0);
};

///////////////////////////////////
/* ACN/SN3D TO ACN/N3D CONVERTER */
///////////////////////////////////


var sn3d2n3d = exports.sn3d2n3d = function sn3d2n3d(audioCtx, order) {
    (0, _classCallCheck3.default)(this, sn3d2n3d);


    this.ctx = audioCtx;
    this.order = order;
    this.nCh = (order + 1) * (order + 1);
    this.in = this.ctx.createChannelSplitter(this.nCh);
    this.out = this.ctx.createChannelMerger(this.nCh);
    this.gains = new Array(this.nCh);

    for (var i = 0; i < this.nCh; i++) {
        var n = Math.floor(Math.sqrt(i));

        this.gains[i] = this.ctx.createGain();
        this.gains[i].gain.value = Math.sqrt(2 * n + 1);

        this.in.connect(this.gains[i], i, 0);
        this.gains[i].connect(this.out, 0, i);
    }
};

///////////////////////////////////
/* ACN/N3D TO ACN/SN3D CONVERTER */
///////////////////////////////////


var n3d2sn3d = exports.n3d2sn3d = function n3d2sn3d(audioCtx, order) {
    (0, _classCallCheck3.default)(this, n3d2sn3d);


    this.ctx = audioCtx;
    this.order = order;
    this.nCh = (order + 1) * (order + 1);
    this.in = this.ctx.createChannelSplitter(this.nCh);
    this.out = this.ctx.createChannelMerger(this.nCh);
    this.gains = new Array(this.nCh);

    for (var i = 0; i < this.nCh; i++) {
        var n = Math.floor(Math.sqrt(i));

        this.gains[i] = this.ctx.createGain();
        this.gains[i].gain.value = 1 / Math.sqrt(2 * n + 1);

        this.in.connect(this.gains[i], i, 0);
        this.gains[i].connect(this.out, 0, i);
    }
};

///////////////////////////////
/* FUMA TO ACN/N3D CONVERTER */
///////////////////////////////


var fuma2acn = exports.fuma2acn = function fuma2acn(audioCtx, order) {
    (0, _classCallCheck3.default)(this, fuma2acn);


    if (order > 3) {
        console.log("FuMa specifiction is supported up to 3rd order");
        order = 3;
    }

    // re-mapping indices from FuMa channels to ACN
    // var index_fuma2acn = [0, 2, 3, 1, 8, 6, 4, 5, 7, 15, 13, 11, 9, 10, 12, 14];
    // //                    W  Y  Z  X  V  T  R  S  U  Q   O   M   K  L   N   P

    // gains for each FuMa channel to N3D, after re-mapping channels
    var gains_fuma2n3d = [Math.sqrt(2), // W
    Math.sqrt(3), // Y
    Math.sqrt(3), // Z
    Math.sqrt(3), // X
    Math.sqrt(15) / 2, // V
    Math.sqrt(15) / 2, // T
    Math.sqrt(5), // R
    Math.sqrt(15) / 2, // S
    Math.sqrt(15) / 2, // U
    Math.sqrt(35 / 8), // Q
    Math.sqrt(35) / 3, // O
    Math.sqrt(224 / 45), // M
    Math.sqrt(7), // K
    Math.sqrt(224 / 45), // L
    Math.sqrt(35) / 3, // N
    Math.sqrt(35 / 8)]; // P

    this.ctx = audioCtx;
    this.order = order;
    this.nCh = (order + 1) * (order + 1);
    this.in = this.ctx.createChannelSplitter(this.nCh);
    this.out = this.ctx.createChannelMerger(this.nCh);
    this.gains = [];
    this.remapArray = [];

    // get channel remapping values order 0-1
    this.remapArray.push(0, 2, 3, 1); // manually handle until order 1

    // get channel remapping values order 2-N
    if (order > 1) {
        var o = 0;
        var m;
        for (var i = 0; i < this.nCh; i++) {
            m = [];
            if (i >= (o + 1) * (o + 1)) {
                o += 1;
                for (var j = (o + 1) * (o + 1); j < (o + 2) * (o + 2); j++) {
                    if ((j + o % 2) % 2 == 0) {
                        m.push(j);
                    } else {
                        m.unshift(j);
                    }
                }
                this.remapArray = this.remapArray.concat(m);
            }
        }
    }

    // connect inputs/outputs (kept separated for clarity's sake)
    for (var i = 0; i < this.nCh; i++) {
        this.gains[i] = this.ctx.createGain();
        this.gains[i].gain.value = gains_fuma2n3d[i];
        this.in.connect(this.gains[i], this.remapArray[i], 0);
        this.gains[i].connect(this.out, 0, i);
    }
};

},{"babel-runtime/helpers/classCallCheck":14}],3:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

require('get-float-time-domain-data');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var intensityAnalyser = function () {
    function intensityAnalyser(audioCtx) {
        (0, _classCallCheck3.default)(this, intensityAnalyser);


        this.ctx = audioCtx;
        this.fftSize = 2048;
        // Input and output nodes
        this.in = this.ctx.createChannelSplitter(4);
        this.out = this.ctx.createChannelMerger(4);
        // Gains to go from ACN/N3D to pressure-velocity (WXYZ)
        this.gains = new Array(3);
        for (var i = 0; i < 3; i++) {
            this.gains[i] = this.ctx.createGain();
            this.gains[i].gain.value = 1 / Math.sqrt(3);
        }
        // Initialize analyzer buffers
        this.analysers = new Array(4);
        this.analBuffers = new Array(4);
        for (i = 0; i < 4; i++) {
            this.analysers[i] = this.ctx.createAnalyser();
            this.analysers[i].fftSize = this.fftSize;
            this.analysers[i].smoothingTimeConstant = 0;
            this.analBuffers[i] = new Float32Array(this.fftSize);
        }
        // Create connections
        this.in.connect(this.out, 0, 0);
        this.in.connect(this.analysers[0], 0, 0);

        this.in.connect(this.gains[1], 1, 0);
        this.in.connect(this.gains[2], 2, 0);
        this.in.connect(this.gains[0], 3, 0);
        for (i = 0; i < 3; i++) {
            this.gains[i].connect(this.analysers[i + 1], 0, 0);
            this.gains[i].connect(this.out, 0, i + 1);
        }
    }

    (0, _createClass3.default)(intensityAnalyser, [{
        key: 'updateBuffers',
        value: function updateBuffers() {
            // Get latest time-domain data
            for (var i = 0; i < 4; i++) {
                this.analysers[i].getFloatTimeDomainData(this.analBuffers[i]);
            }
        }
    }, {
        key: 'computeIntensity',
        value: function computeIntensity() {
            // Compute correlations and energies of channels
            var iX = 0;
            var iY = 0;
            var iZ = 0;
            var WW = 0;
            var XX = 0;
            var YY = 0;
            var ZZ = 0;
            var I, I_norm, E, Psi, azim, elev;
            // Accumulators for correlations and energies
            for (var i = 0; i < this.fftSize; i++) {

                iX = iX + this.analBuffers[0][i] * this.analBuffers[1][i];
                iY = iY + this.analBuffers[0][i] * this.analBuffers[2][i];
                iZ = iZ + this.analBuffers[0][i] * this.analBuffers[3][i];
                WW = WW + this.analBuffers[0][i] * this.analBuffers[0][i];
                XX = XX + this.analBuffers[1][i] * this.analBuffers[1][i];
                YY = YY + this.analBuffers[2][i] * this.analBuffers[2][i];
                ZZ = ZZ + this.analBuffers[3][i] * this.analBuffers[3][i];
            }
            I = [iX, iY, iZ]; // intensity
            I_norm = Math.sqrt(I[0] * I[0] + I[1] * I[1] + I[2] * I[2]); // intensity magnitude
            E = (WW + XX + YY + ZZ) / 2; // energy
            Psi = 1 - I_norm / (E + 10e-8); // diffuseness
            azim = Math.atan2(iY, iX) * 180 / Math.PI;
            elev = Math.atan2(I[2], Math.sqrt(I[0] * I[0] + I[1] * I[1])) * 180 / Math.PI;

            var params = [azim, elev, Psi, E];
            return params;
        }
    }]);
    return intensityAnalyser;
}(); ////////////////////////////////////////////////////////////////////
//  Archontis Politis
//  archontis.politis@aalto.fi
//  David Poirier-Quinot
//  davipoir@ircam.fr
////////////////////////////////////////////////////////////////////
//
//  WebAudio_HOA a JavaScript library for higher-order Ambisonics
//  The library implements Web Audio blocks that perform
//  typical ambisonic processing operations on audio signals.
//
////////////////////////////////////////////////////////////////////

//////////////////////////////////////////
/* PRESSURE-VELOCITY INTENSITY ANALYZER */
//////////////////////////////////////////

// for Safari support where audioContext.Analyser.getFloatTimeDomainData is not defined for now


exports.default = intensityAnalyser;

},{"babel-runtime/helpers/classCallCheck":14,"babel-runtime/helpers/createClass":15,"get-float-time-domain-data":33}],4:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _sphericalHarmonicTransform = require('spherical-harmonic-transform');

var jshlib = _interopRequireWildcard(_sphericalHarmonicTransform);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var monoEncoder = function () {
    function monoEncoder(audioCtx, order) {
        (0, _classCallCheck3.default)(this, monoEncoder);


        this.initialized = false;

        this.ctx = audioCtx;
        this.order = order;
        this.nCh = (order + 1) * (order + 1);
        this.azim = 0;
        this.elev = 0;
        this.gains = new Array(this.nCh);
        this.gainNodes = new Array(this.nCh);
        this.in = this.ctx.createGain();
        this.in.channelCountMode = 'explicit';
        this.in.channelCount = 1;
        this.out = this.ctx.createChannelMerger(this.nCh);
        // Initialize encoding gains
        for (var i = 0; i < this.nCh; i++) {
            this.gainNodes[i] = this.ctx.createGain();
            this.gainNodes[i].channelCountMode = 'explicit';
            this.gainNodes[i].channelCount = 1;
        }
        this.updateGains();
        // Make audio connections
        for (var i = 0; i < this.nCh; i++) {
            this.in.connect(this.gainNodes[i]);
            this.gainNodes[i].connect(this.out, 0, i);
        }

        this.initialized = true;
    }

    (0, _createClass3.default)(monoEncoder, [{
        key: 'updateGains',
        value: function updateGains() {
            var N = this.order;
            var g_enc = jshlib.computeRealSH(N, [[this.azim * Math.PI / 180, this.elev * Math.PI / 180]]);

            for (var i = 0; i < this.nCh; i++) {
                this.gains[i] = g_enc[i][0];
                this.gainNodes[i].gain.value = this.gains[i];
            }
        }
    }]);
    return monoEncoder;
}(); ////////////////////////////////////////////////////////////////////
//  Archontis Politis
//  archontis.politis@aalto.fi
//  David Poirier-Quinot
//  davipoir@ircam.fr
////////////////////////////////////////////////////////////////////
//
//  WebAudio_HOA a JavaScript library for higher-order Ambisonics
//  The library implements Web Audio blocks that perform
//  typical ambisonic processing operations on audio signals.
//
////////////////////////////////////////////////////////////////////

/////////////////
/* HOA ENCODER */
/////////////////

exports.default = monoEncoder;

},{"babel-runtime/helpers/classCallCheck":14,"babel-runtime/helpers/createClass":15,"spherical-harmonic-transform":35}],5:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

////////////////////////////////////////////////////////////////////
//  Archontis Politis
//  archontis.politis@aalto.fi
//  David Poirier-Quinot
//  davipoir@ircam.fr
////////////////////////////////////////////////////////////////////
//
//  WebAudio_HOA a JavaScript library for higher-order Ambisonics
//  The library implements Web Audio blocks that perform
//  typical ambisonic processing operations on audio signals.
//
////////////////////////////////////////////////////////////////////

///////////////////////
/* HOA ORDER LIMITER */
///////////////////////

var orderLimiter = function () {
    function orderLimiter(audioCtx, orderIn, orderOut) {
        (0, _classCallCheck3.default)(this, orderLimiter);


        this.ctx = audioCtx;
        this.orderIn = orderIn;
        if (orderOut < orderIn) this.orderOut = orderOut;else this.orderOut = orderIn;

        this.nChIn = (this.orderIn + 1) * (this.orderIn + 1);
        this.nChOut = (this.orderOut + 1) * (this.orderOut + 1);
        this.in = this.ctx.createChannelSplitter(this.nChIn);
        this.out = this.ctx.createChannelMerger(this.nChOut);

        for (var i = 0; i < this.nChOut; i++) {
            this.in.connect(this.out, i, i);
        }
    }

    (0, _createClass3.default)(orderLimiter, [{
        key: "updateOrder",
        value: function updateOrder(orderOut) {

            if (orderOut <= this.orderIn) {
                this.orderOut = orderOut;
            } else return;

            this.nChOut = (this.orderOut + 1) * (this.orderOut + 1);
            this.out.disconnect();
            this.out = this.ctx.createChannelMerger(this.nChOut);

            for (var i = 0; i < this.nChOut; i++) {
                this.in.connect(this.out, i, i);
            }
        }
    }]);
    return orderLimiter;
}();

exports.default = orderLimiter;

},{"babel-runtime/helpers/classCallCheck":14,"babel-runtime/helpers/createClass":15}],6:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _sphericalHarmonicTransform = require('spherical-harmonic-transform');

var jshlib = _interopRequireWildcard(_sphericalHarmonicTransform);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var orderWeight = function () {
    function orderWeight(audioCtx, order) {
        (0, _classCallCheck3.default)(this, orderWeight);


        this.ctx = audioCtx;
        this.order = order;

        this.nCh = (this.order + 1) * (this.order + 1);
        this.in = this.ctx.createChannelSplitter(this.nCh);
        this.out = this.ctx.createChannelMerger(this.nCh);

        this.gains = new Array(this.nCh);
        this.orderGains = new Array(this.order + 1);
        this.orderGains.fill(1);

        // initialize gains and connections
        for (var i = 0; i < this.nCh; i++) {
            this.gains[i] = this.ctx.createGain();

            this.in.connect(this.gains[i], i, 0);
            this.gains[i].connect(this.out, 0, i);
        }
    }

    (0, _createClass3.default)(orderWeight, [{
        key: 'updateOrderGains',
        value: function updateOrderGains() {

            var n;
            for (var i = 0; i < this.nCh; i++) {

                n = Math.floor(Math.sqrt(i));
                this.gains[i].gain.value = this.orderGains[n];
            }
        }
    }, {
        key: 'computeMaxRECoeffs',
        value: function computeMaxRECoeffs() {

            var N = this.order;
            this.orderGains[0] = 1;
            var leg_n_minus1 = 0;
            var leg_n_minus2 = 0;
            var leg_n = 0;
            for (var n = 1; n <= N; n++) {
                leg_n = jshlib.recurseLegendrePoly(n, [Math.cos(2.406809 / (N + 1.51))], leg_n_minus1, leg_n_minus2);
                this.orderGains[n] = leg_n[0][0];

                leg_n_minus2 = leg_n_minus1;
                leg_n_minus1 = leg_n;
            }
        }
    }]);
    return orderWeight;
}(); ////////////////////////////////////////////////////////////////////
//  Archontis Politis
//  archontis.politis@aalto.fi
//  David Poirier-Quinot
//  davipoir@ircam.fr
////////////////////////////////////////////////////////////////////
//
//  WebAudio_HOA a JavaScript library for higher-order Ambisonics
//  The library implements Web Audio blocks that perform
//  typical ambisonic processing operations on audio signals.
//
////////////////////////////////////////////////////////////////////

/////////////////////////
/* HOA ORDER WEIGHTING */
/////////////////////////

exports.default = orderWeight;

},{"babel-runtime/helpers/classCallCheck":14,"babel-runtime/helpers/createClass":15,"spherical-harmonic-transform":35}],7:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

////////////////////////////////////////////////////////////////////
//  Archontis Politis
//  archontis.politis@aalto.fi
//  David Poirier-Quinot
//  davipoir@ircam.fr
////////////////////////////////////////////////////////////////////
//
//  WebAudio_HOA a JavaScript library for higher-order Ambisonics
//  The library implements Web Audio blocks that perform
//  typical ambisonic processing operations on audio signals.
//
////////////////////////////////////////////////////////////////////

/////////////////////////////////
/* HOA POWERMAP ANALYZER */
/////////////////////////////////

////// NOT IMPEMENTED YET !!! ///////

var powermapAnalyser = function () {
    function powermapAnalyser(audioCtx, order) {
        (0, _classCallCheck3.default)(this, powermapAnalyser);

        this.initialized = false;

        this.ctx = audioCtx;
        this.order = order;
        this.nCh = (order + 1) * (order + 1);
        this.fftSize = 2048;
        this.analysers = new Array(this.nCh);
        this.analBuffers = new Array(this.nCh);
        // Input and output nodes
        this.in = this.ctx.createChannelSplitter(this.nCh);
        this.out = this.ctx.createChannelMerger(this.nCh);
        // Initialize analyzer buffers
        for (var i = 0; i < this.nCh; i++) {
            this.analysers[i] = this.ctx.createAnalyser();
            this.analysers[i].fftSize = this.fftSize;
            this.analysers[i].smoothingTimeConstant = 0;
            this.analBuffers[i] = new Float32Array(this.fftSize);
        }
        // Create connections
        for (var _i = 0; _i < this.nCh; _i++) {
            this.in.connect(this.out, _i, _i);
            this.in.connect(this.analysers[_i], _i, 0);
        }

        this.initialized = true;
    }

    (0, _createClass3.default)(powermapAnalyser, [{
        key: "updateBuffers",
        value: function updateBuffers() {
            // Get latest time-domain data
            for (var i = 0; i < this.nCh; i++) {
                this.analysers[i].getFloatTimeDomainData(this.analBuffers[i]);
            }
        }
    }]);
    return powermapAnalyser;
}();

exports.default = powermapAnalyser;

},{"babel-runtime/helpers/classCallCheck":14,"babel-runtime/helpers/createClass":15}],8:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

////////////////////////////////////////////////////////////////////
//  Archontis Politis
//  archontis.politis@aalto.fi
//  David Poirier-Quinot
//  davipoir@ircam.fr
////////////////////////////////////////////////////////////////////
//
//  WebAudio_HOA a JavaScript library for higher-order Ambisonics
//  The library implements Web Audio blocks that perform
//  typical ambisonic processing operations on audio signals.
//
////////////////////////////////////////////////////////////////////

/////////////////
/* HOA MIRROR */
/////////////////

var sceneMirror = function () {
    function sceneMirror(audioCtx, order) {
        (0, _classCallCheck3.default)(this, sceneMirror);


        this.ctx = audioCtx;
        this.order = order;
        this.nCh = (order + 1) * (order + 1);
        this.mirrorPlane = 0;
        // Input and output nodes
        this.in = this.ctx.createChannelSplitter(this.nCh);
        this.out = this.ctx.createChannelMerger(this.nCh);
        // Initialize mirroring gains to unity (no reflection) and connect
        this.gains = new Array(this.nCh);
        for (var q = 0; q < this.nCh; q++) {
            this.gains[q] = this.ctx.createGain();
            this.gains[q].gain.value = 1;
            // Create connections
            this.in.connect(this.gains[q], q, 0);
            this.gains[q].connect(this.out, 0, q);
        }
    }

    (0, _createClass3.default)(sceneMirror, [{
        key: "reset",
        value: function reset() {

            for (var q = 0; q < this.nCh; q++) {
                this.gains[q].gain.value = 1;
            }
        }
    }, {
        key: "mirror",
        value: function mirror(planeNo) {

            switch (planeNo) {
                case 0:
                    this.mirrorPlane = 0;
                    this.reset();
                    break;
                case 1:
                    // mirroring on yz-plane (front-back)
                    this.reset();
                    this.mirrorPlane = 1;
                    var q;
                    for (var n = 0; n <= this.order; n++) {
                        for (var m = -n; m <= n; m++) {
                            q = n * n + n + m;
                            if (m < 0 && m % 2 == 0 || m > 0 && m % 2 == 1) this.gains[q].gain.value = -1;
                        }
                    }
                    break;
                case 2:
                    // mirroring on xz-plane (left-right)
                    this.reset();
                    this.mirrorPlane = 2;
                    var q;
                    for (var n = 0; n <= this.order; n++) {
                        for (var m = -n; m <= n; m++) {
                            q = n * n + n + m;
                            if (m < 0) this.gains[q].gain.value = -1;
                        }
                    }
                    break;
                case 3:
                    // mirroring on xy-plane (up-down)
                    this.reset();
                    this.mirrorPlane = 3;
                    var q;
                    for (var n = 0; n <= this.order; n++) {
                        for (var m = -n; m <= n; m++) {
                            q = n * n + n + m;
                            if ((m + n) % 2 == 1) this.gains[q].gain.value = -1;
                        }
                    }
                    break;
                default:
                    console.log("The mirroring planes can be either 1 (yz), 2 (xz), 3 (xy), or 0 (no mirroring). Value set to 0.");
                    this.mirrorPlane = 0;
                    this.reset();
            }
        }
    }]);
    return sceneMirror;
}();

exports.default = sceneMirror;

},{"babel-runtime/helpers/classCallCheck":14,"babel-runtime/helpers/createClass":15}],9:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _sphericalHarmonicTransform = require('spherical-harmonic-transform');

var jshlib = _interopRequireWildcard(_sphericalHarmonicTransform);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var sceneRotator = function () {
    function sceneRotator(audioCtx, order) {
        (0, _classCallCheck3.default)(this, sceneRotator);


        this.ctx = audioCtx;
        this.order = order;
        this.nCh = (order + 1) * (order + 1);
        this.yaw = 0;
        this.pitch = 0;
        this.roll = 0;
        this.rotMtx = numeric.identity(this.nCh);
        this.rotMtxNodes = new Array(this.order);
        // Input and output nodes
        this.in = this.ctx.createChannelSplitter(this.nCh);
        this.out = this.ctx.createChannelMerger(this.nCh);

        // Initialize rotation gains to identity matrix
        for (var n = 1; n <= this.order; n++) {

            var gains_n = new Array(2 * n + 1);
            for (var i = 0; i < 2 * n + 1; i++) {
                gains_n[i] = new Array(2 * n + 1);
                for (var j = 0; j < 2 * n + 1; j++) {
                    gains_n[i][j] = this.ctx.createGain();
                    if (i == j) gains_n[i][j].gain.value = 1;else gains_n[i][j].gain.value = 0;
                }
            }
            this.rotMtxNodes[n - 1] = gains_n;
        }

        // Create connections
        this.in.connect(this.out, 0, 0); // zeroth order ch. does not rotate

        var band_idx = 1;
        for (n = 1; n <= this.order; n++) {
            for (i = 0; i < 2 * n + 1; i++) {
                for (j = 0; j < 2 * n + 1; j++) {
                    this.in.connect(this.rotMtxNodes[n - 1][i][j], band_idx + j, 0);
                    this.rotMtxNodes[n - 1][i][j].connect(this.out, 0, band_idx + i);
                }
            }
            band_idx = band_idx + 2 * n + 1;
        }
    }

    (0, _createClass3.default)(sceneRotator, [{
        key: 'updateRotMtx',
        value: function updateRotMtx() {

            var yaw = this.yaw * Math.PI / 180;
            var pitch = this.pitch * Math.PI / 180;
            var roll = this.roll * Math.PI / 180;

            this.rotMtx = jshlib.getSHrotMtx(jshlib.yawPitchRoll2Rzyx(yaw, pitch, roll), this.order);

            var band_idx = 1;
            for (var n = 1; n < this.order + 1; n++) {

                for (var i = 0; i < 2 * n + 1; i++) {
                    for (var j = 0; j < 2 * n + 1; j++) {
                        this.rotMtxNodes[n - 1][i][j].gain.value = this.rotMtx[band_idx + i][band_idx + j];
                    }
                }
                band_idx = band_idx + 2 * n + 1;
            }
        }
    }]);
    return sceneRotator;
}(); ////////////////////////////////////////////////////////////////////
//  Archontis Politis
//  archontis.politis@aalto.fi
//  David Poirier-Quinot
//  davipoir@ircam.fr
////////////////////////////////////////////////////////////////////
//
//  WebAudio_HOA a JavaScript library for higher-order Ambisonics
//  The library implements Web Audio blocks that perform
//  typical ambisonic processing operations on audio signals.
//
////////////////////////////////////////////////////////////////////

/////////////////
/* HOA ROTATOR */
/////////////////

exports.default = sceneRotator;

},{"babel-runtime/helpers/classCallCheck":14,"babel-runtime/helpers/createClass":15,"spherical-harmonic-transform":35}],10:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

var _sphericalHarmonicTransform = require("spherical-harmonic-transform");

var jshlib = _interopRequireWildcard(_sphericalHarmonicTransform);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var virtualMic = function () {
    function virtualMic(audioCtx, order) {
        (0, _classCallCheck3.default)(this, virtualMic);


        this.initialized = false;

        this.ctx = audioCtx;
        this.order = order;
        this.nCh = (order + 1) * (order + 1);
        this.azim = 0;
        this.elev = 0;
        this.vmicGains = new Array(this.nCh);
        this.vmicGainNodes = new Array(this.nCh);
        this.vmicCoeffs = new Array(this.order + 1);
        this.vmicPattern = "hypercardioid";
        this.in = this.ctx.createChannelSplitter(this.nCh);
        this.out = this.ctx.createGain();

        // Initialize vmic to forward facing hypercardioid
        for (var i = 0; i < this.nCh; i++) {
            this.vmicGainNodes[i] = this.ctx.createGain();
        }
        this.SHxyz = new Array(this.nCh);
        this.SHxyz.fill(0);
        this.updatePattern();
        this.updateOrientation();

        // Create connections
        for (i = 0; i < this.nCh; i++) {
            this.in.connect(this.vmicGainNodes[i], i, 0);
            this.vmicGainNodes[i].connect(this.out);
        }

        this.initialized = true;
    }

    (0, _createClass3.default)(virtualMic, [{
        key: "updatePattern",
        value: function updatePattern() {

            function computeCardioidCoeffs(N) {
                var coeffs = new Array(N + 1);
                for (var n = 0; n <= N; n++) {
                    coeffs[n] = jshlib.factorial(N) * jshlib.factorial(N) / (jshlib.factorial(N + n + 1) * jshlib.factorial(N - n));
                }
                return coeffs;
            }

            function computeHypercardCoeffs(N) {
                var coeffs = new Array(N + 1);
                var nSH = (N + 1) * (N + 1);
                for (var n = 0; n <= N; n++) {
                    coeffs[n] = 1 / nSH;
                }
                return coeffs;
            }

            function computeSupercardCoeffs(N) {
                switch (N) {
                    case 1:
                        var coeffs = [0.3660, 0.2113];
                        break;
                    case 2:
                        var coeffs = [0.2362, 0.1562, 0.0590];
                        break;
                    case 3:
                        var coeffs = [0.1768, 0.1281, 0.0633, 0.0175];
                        break;
                    case 4:
                        var coeffs = [0.1414, 0.1087, 0.0623, 0.0247, 0.0054];
                        break;
                    default:
                        console.error("Orders should be in the range of 1-4 at the moment.");
                        return;
                }
                return coeffs;
            }

            function computeMaxRECoeffs(N) {
                var coeffs = new Array(N + 1);
                coeffs[0] = 1;
                var leg_n_minus1 = 0;
                var leg_n_minus2 = 0;
                var leg_n = 0;
                for (var n = 1; n < N + 1; n++) {
                    leg_n = jshlib.recurseLegendrePoly(n, [Math.cos(2.406809 / (N + 1.51))], leg_n_minus1, leg_n_minus2);
                    coeffs[n] = leg_n[0][0];

                    leg_n_minus2 = leg_n_minus1;
                    leg_n_minus1 = leg_n;
                }
                // compute normalization factor
                var norm = 0;
                for (var n = 0; n <= N; n++) {
                    norm += coeffs[n] * (2 * n + 1);
                }
                for (var n = 0; n <= N; n++) {
                    coeffs[n] = coeffs[n] / norm;
                }
                return coeffs;
            }

            switch (this.vmicPattern) {
                case "cardioid":
                    // higher-order cardioid given by: (1/2)^N * ( 1+cos(theta) )^N
                    this.vmicCoeffs = computeCardioidCoeffs(this.order);
                    break;
                case "supercardioid":
                    // maximum front-back energy ratio
                    this.vmicCoeffs = computeSupercardCoeffs(this.order);
                    break;
                case "hypercardioid":
                    // maximum directivity factor
                    // (this is the classic plane/wave decomposition beamformer,
                    // also termed "regular" in spherical beamforming literature)
                    this.vmicCoeffs = computeHypercardCoeffs(this.order);
                    break;
                case "max_rE":
                    // quite similar to maximum front-back rejection
                    this.vmicCoeffs = computeMaxRECoeffs(this.order);
                    break;
                default:
                    this.vmicPattern = "hypercardioid";
                    this.vmicCoeffs = computeHypercardCoeffs(this.order);
            }

            this.updateGains();
        }
    }, {
        key: "updateOrientation",
        value: function updateOrientation() {

            var azim = this.azim * Math.PI / 180;
            var elev = this.elev * Math.PI / 180;

            var tempSH = jshlib.computeRealSH(this.order, [[azim, elev]]);

            for (var i = 0; i < this.nCh; i++) {
                this.SHxyz[i] = tempSH[i][0];
            }

            this.updateGains();
        }
    }, {
        key: "updateGains",
        value: function updateGains() {

            var q;
            for (var n = 0; n <= this.order; n++) {
                for (var m = -n; m <= n; m++) {
                    q = n * n + n + m;
                    this.vmicGains[q] = this.vmicCoeffs[n] * this.SHxyz[q];
                }
            }

            for (var i = 0; i < this.nCh; i++) {
                this.vmicGainNodes[i].gain.value = this.vmicGains[i];
            }
        }
    }]);
    return virtualMic;
}(); ////////////////////////////////////////////////////////////////////
//  Archontis Politis
//  archontis.politis@aalto.fi
//  David Poirier-Quinot
//  davipoir@ircam.fr
////////////////////////////////////////////////////////////////////
//
//  WebAudio_HOA a JavaScript library for higher-order Ambisonics
//  The library implements Web Audio blocks that perform
//  typical ambisonic processing operations on audio signals.
//
////////////////////////////////////////////////////////////////////

/////////////////////////////////
/* HOA VIRTUAL MICROPHONE */
/////////////////////////////////

exports.default = virtualMic;

},{"babel-runtime/helpers/classCallCheck":14,"babel-runtime/helpers/createClass":15,"spherical-harmonic-transform":35}],11:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

////////////////////////////////////////////////////////////////////
//  Archontis Politis
//  archontis.politis@aalto.fi
//  David Poirier-Quinot
//  davipoir@ircam.fr
////////////////////////////////////////////////////////////////////
//
//  WebAudio_HOA a JavaScript library for higher-order Ambisonics
//  The library implements Web Audio blocks that perform
//  typical ambisonic processing operations on audio signals.
//
////////////////////////////////////////////////////////////////////

////////////////
/* HOA LOADER */
////////////////

var HOAloader = function () {
    function HOAloader(context, order, url, callback) {
        (0, _classCallCheck3.default)(this, HOAloader);

        this.context = context;
        this.order = order;
        this.nCh = (order + 1) * (order + 1);
        this.nChGroups = Math.ceil(this.nCh / 8);
        this.buffers = new Array();
        this.loadCount = 0;
        this.loaded = false;
        this.onLoad = callback;
        this.urls = new Array(this.nChGroups);

        var fileExt = url.slice(url.length - 3, url.length);
        this.fileExt = fileExt;

        for (var i = 0; i < this.nChGroups; i++) {

            if (i == this.nChGroups - 1) {
                this.urls[i] = url.slice(0, url.length - 4) + "_" + pad(i * 8 + 1, 2) + "-" + pad(this.nCh, 2) + "ch." + fileExt;
            } else {
                this.urls[i] = url.slice(0, url.length - 4) + "_" + pad(i * 8 + 1, 2) + "-" + pad(i * 8 + 8, 2) + "ch." + fileExt;
            }
        }

        function pad(num, size) {
            return ('000000000' + num).substr(-size);
        }
    }

    (0, _createClass3.default)(HOAloader, [{
        key: "loadBuffers",
        value: function loadBuffers(url, index) {
            // Load buffer asynchronously
            var request = new XMLHttpRequest();
            request.open("GET", url, true);
            request.responseType = "arraybuffer";

            var scope = this;

            request.onload = function () {
                // Asynchronously decode the audio file data in request.response
                scope.context.decodeAudioData(request.response, function (buffer) {
                    if (!buffer) {
                        alert('error decoding file data: ' + url);
                        return;
                    }
                    scope.buffers[index] = buffer;
                    scope.loadCount++;
                    if (scope.loadCount == scope.nChGroups) {
                        scope.loaded = true;
                        scope.concatBuffers();
                        console.log("HOAloader: all buffers loaded and concatenated");
                        scope.onLoad(scope.concatBuffer);
                    }
                }, function (error) {
                    alert("Browser cannot decode audio data:  " + url + "\n\nError: " + error + "\n\n(If you re using Safari and get a null error, this is most likely due to Apple's shady plan going on to stop the .ogg format from easing web developer's life :)");
                });
            };

            request.onerror = function () {
                alert('HOAloader: XHR error');
            };

            request.send();
        }
    }, {
        key: "load",
        value: function load() {
            for (var i = 0; i < this.nChGroups; ++i) {
                this.loadBuffers(this.urls[i], i);
            }
        }
    }, {
        key: "concatBuffers",
        value: function concatBuffers() {

            if (!this.loaded) return;

            var nCh = this.nCh;
            var nChGroups = this.nChGroups;

            var length = this.buffers[0].length;
            this.buffers.forEach(function (b) {
                length = Math.max(length, b.length);
            });
            var srate = this.buffers[0].sampleRate;

            // Detect if the 8-ch audio file is OGG and if the browser is Chrome,
            // then remap 8-channel files to the correct order cause Chrome messe it up when loading
            // Firefox does not have this issue. 8ch Wave files work fine for both browsers.
            var remap8ChanFile = [1, 2, 3, 4, 5, 6, 7, 8];
            var isChrome = !!window.chrome;
            if (isChrome && this.fileExt.toLowerCase() == "ogg") {
                console.log("Loading of 8chan OGG files using Chrome: remap channels to correct order!");
                remap8ChanFile = [1, 3, 2, 7, 8, 5, 6, 4];
            }

            this.concatBuffer = this.context.createBuffer(nCh, length, srate);
            for (var i = 0; i < nChGroups; i++) {
                for (var j = 0; j < this.buffers[i].numberOfChannels; j++) {
                    this.concatBuffer.getChannelData(i * 8 + j).set(this.buffers[i].getChannelData(remap8ChanFile[j] - 1));
                }
            }
        }
    }]);
    return HOAloader;
}();

exports.default = HOAloader;

},{"babel-runtime/helpers/classCallCheck":14,"babel-runtime/helpers/createClass":15}],12:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.intensityAnalyser = exports.converters = exports.HOAloader = exports.powermapAnalyser = exports.virtualMic = exports.binDecoder = exports.sceneMirror = exports.sceneRotator = exports.orderWeight = exports.orderLimiter = exports.monoEncoder = undefined;

var _ambiMonoEncoder = require('./ambi-monoEncoder');

Object.defineProperty(exports, 'monoEncoder', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_ambiMonoEncoder).default;
  }
});

var _ambiOrderLimiter = require('./ambi-orderLimiter');

Object.defineProperty(exports, 'orderLimiter', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_ambiOrderLimiter).default;
  }
});

var _ambiOrderWeight = require('./ambi-orderWeight');

Object.defineProperty(exports, 'orderWeight', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_ambiOrderWeight).default;
  }
});

var _ambiSceneRotator = require('./ambi-sceneRotator');

Object.defineProperty(exports, 'sceneRotator', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_ambiSceneRotator).default;
  }
});

var _ambiSceneMirror = require('./ambi-sceneMirror');

Object.defineProperty(exports, 'sceneMirror', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_ambiSceneMirror).default;
  }
});

var _ambiBinauralDecoder = require('./ambi-binauralDecoder');

Object.defineProperty(exports, 'binDecoder', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_ambiBinauralDecoder).default;
  }
});

var _ambiVirtualMic = require('./ambi-virtualMic');

Object.defineProperty(exports, 'virtualMic', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_ambiVirtualMic).default;
  }
});

var _ambiPowermapAnalyser = require('./ambi-powermapAnalyser');

Object.defineProperty(exports, 'powermapAnalyser', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_ambiPowermapAnalyser).default;
  }
});

var _hoaLoader = require('./hoa-loader');

Object.defineProperty(exports, 'HOAloader', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_hoaLoader).default;
  }
});

var _ambiIntensityAnalyser = require('./ambi-intensityAnalyser');

Object.defineProperty(exports, 'intensityAnalyser', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_ambiIntensityAnalyser).default;
  }
});

var _ambiConverters = require('./ambi-converters');

var _converters = _interopRequireWildcard(_ambiConverters);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var converters = exports.converters = _converters;

},{"./ambi-binauralDecoder":1,"./ambi-converters":2,"./ambi-intensityAnalyser":3,"./ambi-monoEncoder":4,"./ambi-orderLimiter":5,"./ambi-orderWeight":6,"./ambi-powermapAnalyser":7,"./ambi-sceneMirror":8,"./ambi-sceneRotator":9,"./ambi-virtualMic":10,"./hoa-loader":11}],13:[function(require,module,exports){
module.exports = { "default": require("core-js/library/fn/object/define-property"), __esModule: true };
},{"core-js/library/fn/object/define-property":16}],14:[function(require,module,exports){
"use strict";

exports.__esModule = true;

exports.default = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};
},{}],15:[function(require,module,exports){
"use strict";

exports.__esModule = true;

var _defineProperty = require("../core-js/object/define-property");

var _defineProperty2 = _interopRequireDefault(_defineProperty);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      (0, _defineProperty2.default)(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();
},{"../core-js/object/define-property":13}],16:[function(require,module,exports){
require('../../modules/es6.object.define-property');
var $Object = require('../../modules/_core').Object;
module.exports = function defineProperty(it, key, desc){
  return $Object.defineProperty(it, key, desc);
};
},{"../../modules/_core":19,"../../modules/es6.object.define-property":32}],17:[function(require,module,exports){
module.exports = function(it){
  if(typeof it != 'function')throw TypeError(it + ' is not a function!');
  return it;
};
},{}],18:[function(require,module,exports){
var isObject = require('./_is-object');
module.exports = function(it){
  if(!isObject(it))throw TypeError(it + ' is not an object!');
  return it;
};
},{"./_is-object":28}],19:[function(require,module,exports){
var core = module.exports = {version: '2.4.0'};
if(typeof __e == 'number')__e = core; // eslint-disable-line no-undef
},{}],20:[function(require,module,exports){
// optional / simple context binding
var aFunction = require('./_a-function');
module.exports = function(fn, that, length){
  aFunction(fn);
  if(that === undefined)return fn;
  switch(length){
    case 1: return function(a){
      return fn.call(that, a);
    };
    case 2: return function(a, b){
      return fn.call(that, a, b);
    };
    case 3: return function(a, b, c){
      return fn.call(that, a, b, c);
    };
  }
  return function(/* ...args */){
    return fn.apply(that, arguments);
  };
};
},{"./_a-function":17}],21:[function(require,module,exports){
// Thank's IE8 for his funny defineProperty
module.exports = !require('./_fails')(function(){
  return Object.defineProperty({}, 'a', {get: function(){ return 7; }}).a != 7;
});
},{"./_fails":24}],22:[function(require,module,exports){
var isObject = require('./_is-object')
  , document = require('./_global').document
  // in old IE typeof document.createElement is 'object'
  , is = isObject(document) && isObject(document.createElement);
module.exports = function(it){
  return is ? document.createElement(it) : {};
};
},{"./_global":25,"./_is-object":28}],23:[function(require,module,exports){
var global    = require('./_global')
  , core      = require('./_core')
  , ctx       = require('./_ctx')
  , hide      = require('./_hide')
  , PROTOTYPE = 'prototype';

var $export = function(type, name, source){
  var IS_FORCED = type & $export.F
    , IS_GLOBAL = type & $export.G
    , IS_STATIC = type & $export.S
    , IS_PROTO  = type & $export.P
    , IS_BIND   = type & $export.B
    , IS_WRAP   = type & $export.W
    , exports   = IS_GLOBAL ? core : core[name] || (core[name] = {})
    , expProto  = exports[PROTOTYPE]
    , target    = IS_GLOBAL ? global : IS_STATIC ? global[name] : (global[name] || {})[PROTOTYPE]
    , key, own, out;
  if(IS_GLOBAL)source = name;
  for(key in source){
    // contains in native
    own = !IS_FORCED && target && target[key] !== undefined;
    if(own && key in exports)continue;
    // export native or passed
    out = own ? target[key] : source[key];
    // prevent global pollution for namespaces
    exports[key] = IS_GLOBAL && typeof target[key] != 'function' ? source[key]
    // bind timers to global for call from export context
    : IS_BIND && own ? ctx(out, global)
    // wrap global constructors for prevent change them in library
    : IS_WRAP && target[key] == out ? (function(C){
      var F = function(a, b, c){
        if(this instanceof C){
          switch(arguments.length){
            case 0: return new C;
            case 1: return new C(a);
            case 2: return new C(a, b);
          } return new C(a, b, c);
        } return C.apply(this, arguments);
      };
      F[PROTOTYPE] = C[PROTOTYPE];
      return F;
    // make static versions for prototype methods
    })(out) : IS_PROTO && typeof out == 'function' ? ctx(Function.call, out) : out;
    // export proto methods to core.%CONSTRUCTOR%.methods.%NAME%
    if(IS_PROTO){
      (exports.virtual || (exports.virtual = {}))[key] = out;
      // export proto methods to core.%CONSTRUCTOR%.prototype.%NAME%
      if(type & $export.R && expProto && !expProto[key])hide(expProto, key, out);
    }
  }
};
// type bitmap
$export.F = 1;   // forced
$export.G = 2;   // global
$export.S = 4;   // static
$export.P = 8;   // proto
$export.B = 16;  // bind
$export.W = 32;  // wrap
$export.U = 64;  // safe
$export.R = 128; // real proto method for `library` 
module.exports = $export;
},{"./_core":19,"./_ctx":20,"./_global":25,"./_hide":26}],24:[function(require,module,exports){
module.exports = function(exec){
  try {
    return !!exec();
  } catch(e){
    return true;
  }
};
},{}],25:[function(require,module,exports){
// https://github.com/zloirock/core-js/issues/86#issuecomment-115759028
var global = module.exports = typeof window != 'undefined' && window.Math == Math
  ? window : typeof self != 'undefined' && self.Math == Math ? self : Function('return this')();
if(typeof __g == 'number')__g = global; // eslint-disable-line no-undef
},{}],26:[function(require,module,exports){
var dP         = require('./_object-dp')
  , createDesc = require('./_property-desc');
module.exports = require('./_descriptors') ? function(object, key, value){
  return dP.f(object, key, createDesc(1, value));
} : function(object, key, value){
  object[key] = value;
  return object;
};
},{"./_descriptors":21,"./_object-dp":29,"./_property-desc":30}],27:[function(require,module,exports){
module.exports = !require('./_descriptors') && !require('./_fails')(function(){
  return Object.defineProperty(require('./_dom-create')('div'), 'a', {get: function(){ return 7; }}).a != 7;
});
},{"./_descriptors":21,"./_dom-create":22,"./_fails":24}],28:[function(require,module,exports){
module.exports = function(it){
  return typeof it === 'object' ? it !== null : typeof it === 'function';
};
},{}],29:[function(require,module,exports){
var anObject       = require('./_an-object')
  , IE8_DOM_DEFINE = require('./_ie8-dom-define')
  , toPrimitive    = require('./_to-primitive')
  , dP             = Object.defineProperty;

exports.f = require('./_descriptors') ? Object.defineProperty : function defineProperty(O, P, Attributes){
  anObject(O);
  P = toPrimitive(P, true);
  anObject(Attributes);
  if(IE8_DOM_DEFINE)try {
    return dP(O, P, Attributes);
  } catch(e){ /* empty */ }
  if('get' in Attributes || 'set' in Attributes)throw TypeError('Accessors not supported!');
  if('value' in Attributes)O[P] = Attributes.value;
  return O;
};
},{"./_an-object":18,"./_descriptors":21,"./_ie8-dom-define":27,"./_to-primitive":31}],30:[function(require,module,exports){
module.exports = function(bitmap, value){
  return {
    enumerable  : !(bitmap & 1),
    configurable: !(bitmap & 2),
    writable    : !(bitmap & 4),
    value       : value
  };
};
},{}],31:[function(require,module,exports){
// 7.1.1 ToPrimitive(input [, PreferredType])
var isObject = require('./_is-object');
// instead of the ES6 spec version, we didn't implement @@toPrimitive case
// and the second argument - flag - preferred type is a string
module.exports = function(it, S){
  if(!isObject(it))return it;
  var fn, val;
  if(S && typeof (fn = it.toString) == 'function' && !isObject(val = fn.call(it)))return val;
  if(typeof (fn = it.valueOf) == 'function' && !isObject(val = fn.call(it)))return val;
  if(!S && typeof (fn = it.toString) == 'function' && !isObject(val = fn.call(it)))return val;
  throw TypeError("Can't convert object to primitive value");
};
},{"./_is-object":28}],32:[function(require,module,exports){
var $export = require('./_export');
// 19.1.2.4 / 15.2.3.6 Object.defineProperty(O, P, Attributes)
$export($export.S + $export.F * !require('./_descriptors'), 'Object', {defineProperty: require('./_object-dp').f});
},{"./_descriptors":21,"./_export":23,"./_object-dp":29}],33:[function(require,module,exports){
(function (global){
"use strict";

if (global.AnalyserNode && !global.AnalyserNode.prototype.getFloatTimeDomainData) {
  var uint8 = new Uint8Array(2048);
  global.AnalyserNode.prototype.getFloatTimeDomainData = function(array) {
    this.getByteTimeDomainData(uint8);
    for (var i = 0, imax = array.length; i < imax; i++) {
      array[i] = (uint8[i] - 128) * 0.0078125;
    }
  };
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],34:[function(require,module,exports){
(function (global){
"use strict";

var numeric = (typeof exports === "undefined")?(function numeric() {}):(exports);
if(typeof global !== "undefined") { global.numeric = numeric; }

numeric.version = "1.2.6";

// 1. Utility functions
numeric.bench = function bench (f,interval) {
    var t1,t2,n,i;
    if(typeof interval === "undefined") { interval = 15; }
    n = 0.5;
    t1 = new Date();
    while(1) {
        n*=2;
        for(i=n;i>3;i-=4) { f(); f(); f(); f(); }
        while(i>0) { f(); i--; }
        t2 = new Date();
        if(t2-t1 > interval) break;
    }
    for(i=n;i>3;i-=4) { f(); f(); f(); f(); }
    while(i>0) { f(); i--; }
    t2 = new Date();
    return 1000*(3*n-1)/(t2-t1);
}

numeric._myIndexOf = (function _myIndexOf(w) {
    var n = this.length,k;
    for(k=0;k<n;++k) if(this[k]===w) return k;
    return -1;
});
numeric.myIndexOf = (Array.prototype.indexOf)?Array.prototype.indexOf:numeric._myIndexOf;

numeric.Function = Function;
numeric.precision = 4;
numeric.largeArray = 50;

numeric.prettyPrint = function prettyPrint(x) {
    function fmtnum(x) {
        if(x === 0) { return '0'; }
        if(isNaN(x)) { return 'NaN'; }
        if(x<0) { return '-'+fmtnum(-x); }
        if(isFinite(x)) {
            var scale = Math.floor(Math.log(x) / Math.log(10));
            var normalized = x / Math.pow(10,scale);
            var basic = normalized.toPrecision(numeric.precision);
            if(parseFloat(basic) === 10) { scale++; normalized = 1; basic = normalized.toPrecision(numeric.precision); }
            return parseFloat(basic).toString()+'e'+scale.toString();
        }
        return 'Infinity';
    }
    var ret = [];
    function foo(x) {
        var k;
        if(typeof x === "undefined") { ret.push(Array(numeric.precision+8).join(' ')); return false; }
        if(typeof x === "string") { ret.push('"'+x+'"'); return false; }
        if(typeof x === "boolean") { ret.push(x.toString()); return false; }
        if(typeof x === "number") {
            var a = fmtnum(x);
            var b = x.toPrecision(numeric.precision);
            var c = parseFloat(x.toString()).toString();
            var d = [a,b,c,parseFloat(b).toString(),parseFloat(c).toString()];
            for(k=1;k<d.length;k++) { if(d[k].length < a.length) a = d[k]; }
            ret.push(Array(numeric.precision+8-a.length).join(' ')+a);
            return false;
        }
        if(x === null) { ret.push("null"); return false; }
        if(typeof x === "function") { 
            ret.push(x.toString());
            var flag = false;
            for(k in x) { if(x.hasOwnProperty(k)) { 
                if(flag) ret.push(',\n');
                else ret.push('\n{');
                flag = true; 
                ret.push(k); 
                ret.push(': \n'); 
                foo(x[k]); 
            } }
            if(flag) ret.push('}\n');
            return true;
        }
        if(x instanceof Array) {
            if(x.length > numeric.largeArray) { ret.push('...Large Array...'); return true; }
            var flag = false;
            ret.push('[');
            for(k=0;k<x.length;k++) { if(k>0) { ret.push(','); if(flag) ret.push('\n '); } flag = foo(x[k]); }
            ret.push(']');
            return true;
        }
        ret.push('{');
        var flag = false;
        for(k in x) { if(x.hasOwnProperty(k)) { if(flag) ret.push(',\n'); flag = true; ret.push(k); ret.push(': \n'); foo(x[k]); } }
        ret.push('}');
        return true;
    }
    foo(x);
    return ret.join('');
}

numeric.parseDate = function parseDate(d) {
    function foo(d) {
        if(typeof d === 'string') { return Date.parse(d.replace(/-/g,'/')); }
        if(!(d instanceof Array)) { throw new Error("parseDate: parameter must be arrays of strings"); }
        var ret = [],k;
        for(k=0;k<d.length;k++) { ret[k] = foo(d[k]); }
        return ret;
    }
    return foo(d);
}

numeric.parseFloat = function parseFloat_(d) {
    function foo(d) {
        if(typeof d === 'string') { return parseFloat(d); }
        if(!(d instanceof Array)) { throw new Error("parseFloat: parameter must be arrays of strings"); }
        var ret = [],k;
        for(k=0;k<d.length;k++) { ret[k] = foo(d[k]); }
        return ret;
    }
    return foo(d);
}

numeric.parseCSV = function parseCSV(t) {
    var foo = t.split('\n');
    var j,k;
    var ret = [];
    var pat = /(([^'",]*)|('[^']*')|("[^"]*")),/g;
    var patnum = /^\s*(([+-]?[0-9]+(\.[0-9]*)?(e[+-]?[0-9]+)?)|([+-]?[0-9]*(\.[0-9]+)?(e[+-]?[0-9]+)?))\s*$/;
    var stripper = function(n) { return n.substr(0,n.length-1); }
    var count = 0;
    for(k=0;k<foo.length;k++) {
      var bar = (foo[k]+",").match(pat),baz;
      if(bar.length>0) {
          ret[count] = [];
          for(j=0;j<bar.length;j++) {
              baz = stripper(bar[j]);
              if(patnum.test(baz)) { ret[count][j] = parseFloat(baz); }
              else ret[count][j] = baz;
          }
          count++;
      }
    }
    return ret;
}

numeric.toCSV = function toCSV(A) {
    var s = numeric.dim(A);
    var i,j,m,n,row,ret;
    m = s[0];
    n = s[1];
    ret = [];
    for(i=0;i<m;i++) {
        row = [];
        for(j=0;j<m;j++) { row[j] = A[i][j].toString(); }
        ret[i] = row.join(', ');
    }
    return ret.join('\n')+'\n';
}

numeric.getURL = function getURL(url) {
    var client = new XMLHttpRequest();
    client.open("GET",url,false);
    client.send();
    return client;
}

numeric.imageURL = function imageURL(img) {
    function base64(A) {
        var n = A.length, i,x,y,z,p,q,r,s;
        var key = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
        var ret = "";
        for(i=0;i<n;i+=3) {
            x = A[i];
            y = A[i+1];
            z = A[i+2];
            p = x >> 2;
            q = ((x & 3) << 4) + (y >> 4);
            r = ((y & 15) << 2) + (z >> 6);
            s = z & 63;
            if(i+1>=n) { r = s = 64; }
            else if(i+2>=n) { s = 64; }
            ret += key.charAt(p) + key.charAt(q) + key.charAt(r) + key.charAt(s);
            }
        return ret;
    }
    function crc32Array (a,from,to) {
        if(typeof from === "undefined") { from = 0; }
        if(typeof to === "undefined") { to = a.length; }
        var table = [0x00000000, 0x77073096, 0xEE0E612C, 0x990951BA, 0x076DC419, 0x706AF48F, 0xE963A535, 0x9E6495A3,
                     0x0EDB8832, 0x79DCB8A4, 0xE0D5E91E, 0x97D2D988, 0x09B64C2B, 0x7EB17CBD, 0xE7B82D07, 0x90BF1D91, 
                     0x1DB71064, 0x6AB020F2, 0xF3B97148, 0x84BE41DE, 0x1ADAD47D, 0x6DDDE4EB, 0xF4D4B551, 0x83D385C7,
                     0x136C9856, 0x646BA8C0, 0xFD62F97A, 0x8A65C9EC, 0x14015C4F, 0x63066CD9, 0xFA0F3D63, 0x8D080DF5, 
                     0x3B6E20C8, 0x4C69105E, 0xD56041E4, 0xA2677172, 0x3C03E4D1, 0x4B04D447, 0xD20D85FD, 0xA50AB56B, 
                     0x35B5A8FA, 0x42B2986C, 0xDBBBC9D6, 0xACBCF940, 0x32D86CE3, 0x45DF5C75, 0xDCD60DCF, 0xABD13D59, 
                     0x26D930AC, 0x51DE003A, 0xC8D75180, 0xBFD06116, 0x21B4F4B5, 0x56B3C423, 0xCFBA9599, 0xB8BDA50F,
                     0x2802B89E, 0x5F058808, 0xC60CD9B2, 0xB10BE924, 0x2F6F7C87, 0x58684C11, 0xC1611DAB, 0xB6662D3D,
                     0x76DC4190, 0x01DB7106, 0x98D220BC, 0xEFD5102A, 0x71B18589, 0x06B6B51F, 0x9FBFE4A5, 0xE8B8D433,
                     0x7807C9A2, 0x0F00F934, 0x9609A88E, 0xE10E9818, 0x7F6A0DBB, 0x086D3D2D, 0x91646C97, 0xE6635C01, 
                     0x6B6B51F4, 0x1C6C6162, 0x856530D8, 0xF262004E, 0x6C0695ED, 0x1B01A57B, 0x8208F4C1, 0xF50FC457, 
                     0x65B0D9C6, 0x12B7E950, 0x8BBEB8EA, 0xFCB9887C, 0x62DD1DDF, 0x15DA2D49, 0x8CD37CF3, 0xFBD44C65, 
                     0x4DB26158, 0x3AB551CE, 0xA3BC0074, 0xD4BB30E2, 0x4ADFA541, 0x3DD895D7, 0xA4D1C46D, 0xD3D6F4FB, 
                     0x4369E96A, 0x346ED9FC, 0xAD678846, 0xDA60B8D0, 0x44042D73, 0x33031DE5, 0xAA0A4C5F, 0xDD0D7CC9, 
                     0x5005713C, 0x270241AA, 0xBE0B1010, 0xC90C2086, 0x5768B525, 0x206F85B3, 0xB966D409, 0xCE61E49F, 
                     0x5EDEF90E, 0x29D9C998, 0xB0D09822, 0xC7D7A8B4, 0x59B33D17, 0x2EB40D81, 0xB7BD5C3B, 0xC0BA6CAD, 
                     0xEDB88320, 0x9ABFB3B6, 0x03B6E20C, 0x74B1D29A, 0xEAD54739, 0x9DD277AF, 0x04DB2615, 0x73DC1683, 
                     0xE3630B12, 0x94643B84, 0x0D6D6A3E, 0x7A6A5AA8, 0xE40ECF0B, 0x9309FF9D, 0x0A00AE27, 0x7D079EB1, 
                     0xF00F9344, 0x8708A3D2, 0x1E01F268, 0x6906C2FE, 0xF762575D, 0x806567CB, 0x196C3671, 0x6E6B06E7, 
                     0xFED41B76, 0x89D32BE0, 0x10DA7A5A, 0x67DD4ACC, 0xF9B9DF6F, 0x8EBEEFF9, 0x17B7BE43, 0x60B08ED5, 
                     0xD6D6A3E8, 0xA1D1937E, 0x38D8C2C4, 0x4FDFF252, 0xD1BB67F1, 0xA6BC5767, 0x3FB506DD, 0x48B2364B, 
                     0xD80D2BDA, 0xAF0A1B4C, 0x36034AF6, 0x41047A60, 0xDF60EFC3, 0xA867DF55, 0x316E8EEF, 0x4669BE79, 
                     0xCB61B38C, 0xBC66831A, 0x256FD2A0, 0x5268E236, 0xCC0C7795, 0xBB0B4703, 0x220216B9, 0x5505262F, 
                     0xC5BA3BBE, 0xB2BD0B28, 0x2BB45A92, 0x5CB36A04, 0xC2D7FFA7, 0xB5D0CF31, 0x2CD99E8B, 0x5BDEAE1D, 
                     0x9B64C2B0, 0xEC63F226, 0x756AA39C, 0x026D930A, 0x9C0906A9, 0xEB0E363F, 0x72076785, 0x05005713, 
                     0x95BF4A82, 0xE2B87A14, 0x7BB12BAE, 0x0CB61B38, 0x92D28E9B, 0xE5D5BE0D, 0x7CDCEFB7, 0x0BDBDF21, 
                     0x86D3D2D4, 0xF1D4E242, 0x68DDB3F8, 0x1FDA836E, 0x81BE16CD, 0xF6B9265B, 0x6FB077E1, 0x18B74777, 
                     0x88085AE6, 0xFF0F6A70, 0x66063BCA, 0x11010B5C, 0x8F659EFF, 0xF862AE69, 0x616BFFD3, 0x166CCF45, 
                     0xA00AE278, 0xD70DD2EE, 0x4E048354, 0x3903B3C2, 0xA7672661, 0xD06016F7, 0x4969474D, 0x3E6E77DB, 
                     0xAED16A4A, 0xD9D65ADC, 0x40DF0B66, 0x37D83BF0, 0xA9BCAE53, 0xDEBB9EC5, 0x47B2CF7F, 0x30B5FFE9, 
                     0xBDBDF21C, 0xCABAC28A, 0x53B39330, 0x24B4A3A6, 0xBAD03605, 0xCDD70693, 0x54DE5729, 0x23D967BF, 
                     0xB3667A2E, 0xC4614AB8, 0x5D681B02, 0x2A6F2B94, 0xB40BBE37, 0xC30C8EA1, 0x5A05DF1B, 0x2D02EF8D];
     
        var crc = -1, y = 0, n = a.length,i;

        for (i = from; i < to; i++) {
            y = (crc ^ a[i]) & 0xFF;
            crc = (crc >>> 8) ^ table[y];
        }
     
        return crc ^ (-1);
    }

    var h = img[0].length, w = img[0][0].length, s1, s2, next,k,length,a,b,i,j,adler32,crc32;
    var stream = [
                  137, 80, 78, 71, 13, 10, 26, 10,                           //  0: PNG signature
                  0,0,0,13,                                                  //  8: IHDR Chunk length
                  73, 72, 68, 82,                                            // 12: "IHDR" 
                  (w >> 24) & 255, (w >> 16) & 255, (w >> 8) & 255, w&255,   // 16: Width
                  (h >> 24) & 255, (h >> 16) & 255, (h >> 8) & 255, h&255,   // 20: Height
                  8,                                                         // 24: bit depth
                  2,                                                         // 25: RGB
                  0,                                                         // 26: deflate
                  0,                                                         // 27: no filter
                  0,                                                         // 28: no interlace
                  -1,-2,-3,-4,                                               // 29: CRC
                  -5,-6,-7,-8,                                               // 33: IDAT Chunk length
                  73, 68, 65, 84,                                            // 37: "IDAT"
                  // RFC 1950 header starts here
                  8,                                                         // 41: RFC1950 CMF
                  29                                                         // 42: RFC1950 FLG
                  ];
    crc32 = crc32Array(stream,12,29);
    stream[29] = (crc32>>24)&255;
    stream[30] = (crc32>>16)&255;
    stream[31] = (crc32>>8)&255;
    stream[32] = (crc32)&255;
    s1 = 1;
    s2 = 0;
    for(i=0;i<h;i++) {
        if(i<h-1) { stream.push(0); }
        else { stream.push(1); }
        a = (3*w+1+(i===0))&255; b = ((3*w+1+(i===0))>>8)&255;
        stream.push(a); stream.push(b);
        stream.push((~a)&255); stream.push((~b)&255);
        if(i===0) stream.push(0);
        for(j=0;j<w;j++) {
            for(k=0;k<3;k++) {
                a = img[k][i][j];
                if(a>255) a = 255;
                else if(a<0) a=0;
                else a = Math.round(a);
                s1 = (s1 + a )%65521;
                s2 = (s2 + s1)%65521;
                stream.push(a);
            }
        }
        stream.push(0);
    }
    adler32 = (s2<<16)+s1;
    stream.push((adler32>>24)&255);
    stream.push((adler32>>16)&255);
    stream.push((adler32>>8)&255);
    stream.push((adler32)&255);
    length = stream.length - 41;
    stream[33] = (length>>24)&255;
    stream[34] = (length>>16)&255;
    stream[35] = (length>>8)&255;
    stream[36] = (length)&255;
    crc32 = crc32Array(stream,37);
    stream.push((crc32>>24)&255);
    stream.push((crc32>>16)&255);
    stream.push((crc32>>8)&255);
    stream.push((crc32)&255);
    stream.push(0);
    stream.push(0);
    stream.push(0);
    stream.push(0);
//    a = stream.length;
    stream.push(73);  // I
    stream.push(69);  // E
    stream.push(78);  // N
    stream.push(68);  // D
    stream.push(174); // CRC1
    stream.push(66);  // CRC2
    stream.push(96);  // CRC3
    stream.push(130); // CRC4
    return 'data:image/png;base64,'+base64(stream);
}

// 2. Linear algebra with Arrays.
numeric._dim = function _dim(x) {
    var ret = [];
    while(typeof x === "object") { ret.push(x.length); x = x[0]; }
    return ret;
}

numeric.dim = function dim(x) {
    var y,z;
    if(typeof x === "object") {
        y = x[0];
        if(typeof y === "object") {
            z = y[0];
            if(typeof z === "object") {
                return numeric._dim(x);
            }
            return [x.length,y.length];
        }
        return [x.length];
    }
    return [];
}

numeric.mapreduce = function mapreduce(body,init) {
    return Function('x','accum','_s','_k',
            'if(typeof accum === "undefined") accum = '+init+';\n'+
            'if(typeof x === "number") { var xi = x; '+body+'; return accum; }\n'+
            'if(typeof _s === "undefined") _s = numeric.dim(x);\n'+
            'if(typeof _k === "undefined") _k = 0;\n'+
            'var _n = _s[_k];\n'+
            'var i,xi;\n'+
            'if(_k < _s.length-1) {\n'+
            '    for(i=_n-1;i>=0;i--) {\n'+
            '        accum = arguments.callee(x[i],accum,_s,_k+1);\n'+
            '    }'+
            '    return accum;\n'+
            '}\n'+
            'for(i=_n-1;i>=1;i-=2) { \n'+
            '    xi = x[i];\n'+
            '    '+body+';\n'+
            '    xi = x[i-1];\n'+
            '    '+body+';\n'+
            '}\n'+
            'if(i === 0) {\n'+
            '    xi = x[i];\n'+
            '    '+body+'\n'+
            '}\n'+
            'return accum;'
            );
}
numeric.mapreduce2 = function mapreduce2(body,setup) {
    return Function('x',
            'var n = x.length;\n'+
            'var i,xi;\n'+setup+';\n'+
            'for(i=n-1;i!==-1;--i) { \n'+
            '    xi = x[i];\n'+
            '    '+body+';\n'+
            '}\n'+
            'return accum;'
            );
}


numeric.same = function same(x,y) {
    var i,n;
    if(!(x instanceof Array) || !(y instanceof Array)) { return false; }
    n = x.length;
    if(n !== y.length) { return false; }
    for(i=0;i<n;i++) {
        if(x[i] === y[i]) { continue; }
        if(typeof x[i] === "object") { if(!same(x[i],y[i])) return false; }
        else { return false; }
    }
    return true;
}

numeric.rep = function rep(s,v,k) {
    if(typeof k === "undefined") { k=0; }
    var n = s[k], ret = Array(n), i;
    if(k === s.length-1) {
        for(i=n-2;i>=0;i-=2) { ret[i+1] = v; ret[i] = v; }
        if(i===-1) { ret[0] = v; }
        return ret;
    }
    for(i=n-1;i>=0;i--) { ret[i] = numeric.rep(s,v,k+1); }
    return ret;
}


numeric.dotMMsmall = function dotMMsmall(x,y) {
    var i,j,k,p,q,r,ret,foo,bar,woo,i0,k0,p0,r0;
    p = x.length; q = y.length; r = y[0].length;
    ret = Array(p);
    for(i=p-1;i>=0;i--) {
        foo = Array(r);
        bar = x[i];
        for(k=r-1;k>=0;k--) {
            woo = bar[q-1]*y[q-1][k];
            for(j=q-2;j>=1;j-=2) {
                i0 = j-1;
                woo += bar[j]*y[j][k] + bar[i0]*y[i0][k];
            }
            if(j===0) { woo += bar[0]*y[0][k]; }
            foo[k] = woo;
        }
        ret[i] = foo;
    }
    return ret;
}
numeric._getCol = function _getCol(A,j,x) {
    var n = A.length, i;
    for(i=n-1;i>0;--i) {
        x[i] = A[i][j];
        --i;
        x[i] = A[i][j];
    }
    if(i===0) x[0] = A[0][j];
}
numeric.dotMMbig = function dotMMbig(x,y){
    var gc = numeric._getCol, p = y.length, v = Array(p);
    var m = x.length, n = y[0].length, A = new Array(m), xj;
    var VV = numeric.dotVV;
    var i,j,k,z;
    --p;
    --m;
    for(i=m;i!==-1;--i) A[i] = Array(n);
    --n;
    for(i=n;i!==-1;--i) {
        gc(y,i,v);
        for(j=m;j!==-1;--j) {
            z=0;
            xj = x[j];
            A[j][i] = VV(xj,v);
        }
    }
    return A;
}

numeric.dotMV = function dotMV(x,y) {
    var p = x.length, q = y.length,i;
    var ret = Array(p), dotVV = numeric.dotVV;
    for(i=p-1;i>=0;i--) { ret[i] = dotVV(x[i],y); }
    return ret;
}

numeric.dotVM = function dotVM(x,y) {
    var i,j,k,p,q,r,ret,foo,bar,woo,i0,k0,p0,r0,s1,s2,s3,baz,accum;
    p = x.length; q = y[0].length;
    ret = Array(q);
    for(k=q-1;k>=0;k--) {
        woo = x[p-1]*y[p-1][k];
        for(j=p-2;j>=1;j-=2) {
            i0 = j-1;
            woo += x[j]*y[j][k] + x[i0]*y[i0][k];
        }
        if(j===0) { woo += x[0]*y[0][k]; }
        ret[k] = woo;
    }
    return ret;
}

numeric.dotVV = function dotVV(x,y) {
    var i,n=x.length,i1,ret = x[n-1]*y[n-1];
    for(i=n-2;i>=1;i-=2) {
        i1 = i-1;
        ret += x[i]*y[i] + x[i1]*y[i1];
    }
    if(i===0) { ret += x[0]*y[0]; }
    return ret;
}

numeric.dot = function dot(x,y) {
    var d = numeric.dim;
    switch(d(x).length*1000+d(y).length) {
    case 2002:
        if(y.length < 10) return numeric.dotMMsmall(x,y);
        else return numeric.dotMMbig(x,y);
    case 2001: return numeric.dotMV(x,y);
    case 1002: return numeric.dotVM(x,y);
    case 1001: return numeric.dotVV(x,y);
    case 1000: return numeric.mulVS(x,y);
    case 1: return numeric.mulSV(x,y);
    case 0: return x*y;
    default: throw new Error('numeric.dot only works on vectors and matrices');
    }
}

numeric.diag = function diag(d) {
    var i,i1,j,n = d.length, A = Array(n), Ai;
    for(i=n-1;i>=0;i--) {
        Ai = Array(n);
        i1 = i+2;
        for(j=n-1;j>=i1;j-=2) {
            Ai[j] = 0;
            Ai[j-1] = 0;
        }
        if(j>i) { Ai[j] = 0; }
        Ai[i] = d[i];
        for(j=i-1;j>=1;j-=2) {
            Ai[j] = 0;
            Ai[j-1] = 0;
        }
        if(j===0) { Ai[0] = 0; }
        A[i] = Ai;
    }
    return A;
}
numeric.getDiag = function(A) {
    var n = Math.min(A.length,A[0].length),i,ret = Array(n);
    for(i=n-1;i>=1;--i) {
        ret[i] = A[i][i];
        --i;
        ret[i] = A[i][i];
    }
    if(i===0) {
        ret[0] = A[0][0];
    }
    return ret;
}

numeric.identity = function identity(n) { return numeric.diag(numeric.rep([n],1)); }
numeric.pointwise = function pointwise(params,body,setup) {
    if(typeof setup === "undefined") { setup = ""; }
    var fun = [];
    var k;
    var avec = /\[i\]$/,p,thevec = '';
    var haveret = false;
    for(k=0;k<params.length;k++) {
        if(avec.test(params[k])) {
            p = params[k].substring(0,params[k].length-3);
            thevec = p;
        } else { p = params[k]; }
        if(p==='ret') haveret = true;
        fun.push(p);
    }
    fun[params.length] = '_s';
    fun[params.length+1] = '_k';
    fun[params.length+2] = (
            'if(typeof _s === "undefined") _s = numeric.dim('+thevec+');\n'+
            'if(typeof _k === "undefined") _k = 0;\n'+
            'var _n = _s[_k];\n'+
            'var i'+(haveret?'':', ret = Array(_n)')+';\n'+
            'if(_k < _s.length-1) {\n'+
            '    for(i=_n-1;i>=0;i--) ret[i] = arguments.callee('+params.join(',')+',_s,_k+1);\n'+
            '    return ret;\n'+
            '}\n'+
            setup+'\n'+
            'for(i=_n-1;i!==-1;--i) {\n'+
            '    '+body+'\n'+
            '}\n'+
            'return ret;'
            );
    return Function.apply(null,fun);
}
numeric.pointwise2 = function pointwise2(params,body,setup) {
    if(typeof setup === "undefined") { setup = ""; }
    var fun = [];
    var k;
    var avec = /\[i\]$/,p,thevec = '';
    var haveret = false;
    for(k=0;k<params.length;k++) {
        if(avec.test(params[k])) {
            p = params[k].substring(0,params[k].length-3);
            thevec = p;
        } else { p = params[k]; }
        if(p==='ret') haveret = true;
        fun.push(p);
    }
    fun[params.length] = (
            'var _n = '+thevec+'.length;\n'+
            'var i'+(haveret?'':', ret = Array(_n)')+';\n'+
            setup+'\n'+
            'for(i=_n-1;i!==-1;--i) {\n'+
            body+'\n'+
            '}\n'+
            'return ret;'
            );
    return Function.apply(null,fun);
}
numeric._biforeach = (function _biforeach(x,y,s,k,f) {
    if(k === s.length-1) { f(x,y); return; }
    var i,n=s[k];
    for(i=n-1;i>=0;i--) { _biforeach(typeof x==="object"?x[i]:x,typeof y==="object"?y[i]:y,s,k+1,f); }
});
numeric._biforeach2 = (function _biforeach2(x,y,s,k,f) {
    if(k === s.length-1) { return f(x,y); }
    var i,n=s[k],ret = Array(n);
    for(i=n-1;i>=0;--i) { ret[i] = _biforeach2(typeof x==="object"?x[i]:x,typeof y==="object"?y[i]:y,s,k+1,f); }
    return ret;
});
numeric._foreach = (function _foreach(x,s,k,f) {
    if(k === s.length-1) { f(x); return; }
    var i,n=s[k];
    for(i=n-1;i>=0;i--) { _foreach(x[i],s,k+1,f); }
});
numeric._foreach2 = (function _foreach2(x,s,k,f) {
    if(k === s.length-1) { return f(x); }
    var i,n=s[k], ret = Array(n);
    for(i=n-1;i>=0;i--) { ret[i] = _foreach2(x[i],s,k+1,f); }
    return ret;
});

/*numeric.anyV = numeric.mapreduce('if(xi) return true;','false');
numeric.allV = numeric.mapreduce('if(!xi) return false;','true');
numeric.any = function(x) { if(typeof x.length === "undefined") return x; return numeric.anyV(x); }
numeric.all = function(x) { if(typeof x.length === "undefined") return x; return numeric.allV(x); }*/

numeric.ops2 = {
        add: '+',
        sub: '-',
        mul: '*',
        div: '/',
        mod: '%',
        and: '&&',
        or:  '||',
        eq:  '===',
        neq: '!==',
        lt:  '<',
        gt:  '>',
        leq: '<=',
        geq: '>=',
        band: '&',
        bor: '|',
        bxor: '^',
        lshift: '<<',
        rshift: '>>',
        rrshift: '>>>'
};
numeric.opseq = {
        addeq: '+=',
        subeq: '-=',
        muleq: '*=',
        diveq: '/=',
        modeq: '%=',
        lshifteq: '<<=',
        rshifteq: '>>=',
        rrshifteq: '>>>=',
        bandeq: '&=',
        boreq: '|=',
        bxoreq: '^='
};
numeric.mathfuns = ['abs','acos','asin','atan','ceil','cos',
                    'exp','floor','log','round','sin','sqrt','tan',
                    'isNaN','isFinite'];
numeric.mathfuns2 = ['atan2','pow','max','min'];
numeric.ops1 = {
        neg: '-',
        not: '!',
        bnot: '~',
        clone: ''
};
numeric.mapreducers = {
        any: ['if(xi) return true;','var accum = false;'],
        all: ['if(!xi) return false;','var accum = true;'],
        sum: ['accum += xi;','var accum = 0;'],
        prod: ['accum *= xi;','var accum = 1;'],
        norm2Squared: ['accum += xi*xi;','var accum = 0;'],
        norminf: ['accum = max(accum,abs(xi));','var accum = 0, max = Math.max, abs = Math.abs;'],
        norm1: ['accum += abs(xi)','var accum = 0, abs = Math.abs;'],
        sup: ['accum = max(accum,xi);','var accum = -Infinity, max = Math.max;'],
        inf: ['accum = min(accum,xi);','var accum = Infinity, min = Math.min;']
};

(function () {
    var i,o;
    for(i=0;i<numeric.mathfuns2.length;++i) {
        o = numeric.mathfuns2[i];
        numeric.ops2[o] = o;
    }
    for(i in numeric.ops2) {
        if(numeric.ops2.hasOwnProperty(i)) {
            o = numeric.ops2[i];
            var code, codeeq, setup = '';
            if(numeric.myIndexOf.call(numeric.mathfuns2,i)!==-1) {
                setup = 'var '+o+' = Math.'+o+';\n';
                code = function(r,x,y) { return r+' = '+o+'('+x+','+y+')'; };
                codeeq = function(x,y) { return x+' = '+o+'('+x+','+y+')'; };
            } else {
                code = function(r,x,y) { return r+' = '+x+' '+o+' '+y; };
                if(numeric.opseq.hasOwnProperty(i+'eq')) {
                    codeeq = function(x,y) { return x+' '+o+'= '+y; };
                } else {
                    codeeq = function(x,y) { return x+' = '+x+' '+o+' '+y; };                    
                }
            }
            numeric[i+'VV'] = numeric.pointwise2(['x[i]','y[i]'],code('ret[i]','x[i]','y[i]'),setup);
            numeric[i+'SV'] = numeric.pointwise2(['x','y[i]'],code('ret[i]','x','y[i]'),setup);
            numeric[i+'VS'] = numeric.pointwise2(['x[i]','y'],code('ret[i]','x[i]','y'),setup);
            numeric[i] = Function(
                    'var n = arguments.length, i, x = arguments[0], y;\n'+
                    'var VV = numeric.'+i+'VV, VS = numeric.'+i+'VS, SV = numeric.'+i+'SV;\n'+
                    'var dim = numeric.dim;\n'+
                    'for(i=1;i!==n;++i) { \n'+
                    '  y = arguments[i];\n'+
                    '  if(typeof x === "object") {\n'+
                    '      if(typeof y === "object") x = numeric._biforeach2(x,y,dim(x),0,VV);\n'+
                    '      else x = numeric._biforeach2(x,y,dim(x),0,VS);\n'+
                    '  } else if(typeof y === "object") x = numeric._biforeach2(x,y,dim(y),0,SV);\n'+
                    '  else '+codeeq('x','y')+'\n'+
                    '}\nreturn x;\n');
            numeric[o] = numeric[i];
            numeric[i+'eqV'] = numeric.pointwise2(['ret[i]','x[i]'], codeeq('ret[i]','x[i]'),setup);
            numeric[i+'eqS'] = numeric.pointwise2(['ret[i]','x'], codeeq('ret[i]','x'),setup);
            numeric[i+'eq'] = Function(
                    'var n = arguments.length, i, x = arguments[0], y;\n'+
                    'var V = numeric.'+i+'eqV, S = numeric.'+i+'eqS\n'+
                    'var s = numeric.dim(x);\n'+
                    'for(i=1;i!==n;++i) { \n'+
                    '  y = arguments[i];\n'+
                    '  if(typeof y === "object") numeric._biforeach(x,y,s,0,V);\n'+
                    '  else numeric._biforeach(x,y,s,0,S);\n'+
                    '}\nreturn x;\n');
        }
    }
    for(i=0;i<numeric.mathfuns2.length;++i) {
        o = numeric.mathfuns2[i];
        delete numeric.ops2[o];
    }
    for(i=0;i<numeric.mathfuns.length;++i) {
        o = numeric.mathfuns[i];
        numeric.ops1[o] = o;
    }
    for(i in numeric.ops1) {
        if(numeric.ops1.hasOwnProperty(i)) {
            setup = '';
            o = numeric.ops1[i];
            if(numeric.myIndexOf.call(numeric.mathfuns,i)!==-1) {
                if(Math.hasOwnProperty(o)) setup = 'var '+o+' = Math.'+o+';\n';
            }
            numeric[i+'eqV'] = numeric.pointwise2(['ret[i]'],'ret[i] = '+o+'(ret[i]);',setup);
            numeric[i+'eq'] = Function('x',
                    'if(typeof x !== "object") return '+o+'x\n'+
                    'var i;\n'+
                    'var V = numeric.'+i+'eqV;\n'+
                    'var s = numeric.dim(x);\n'+
                    'numeric._foreach(x,s,0,V);\n'+
                    'return x;\n');
            numeric[i+'V'] = numeric.pointwise2(['x[i]'],'ret[i] = '+o+'(x[i]);',setup);
            numeric[i] = Function('x',
                    'if(typeof x !== "object") return '+o+'(x)\n'+
                    'var i;\n'+
                    'var V = numeric.'+i+'V;\n'+
                    'var s = numeric.dim(x);\n'+
                    'return numeric._foreach2(x,s,0,V);\n');
        }
    }
    for(i=0;i<numeric.mathfuns.length;++i) {
        o = numeric.mathfuns[i];
        delete numeric.ops1[o];
    }
    for(i in numeric.mapreducers) {
        if(numeric.mapreducers.hasOwnProperty(i)) {
            o = numeric.mapreducers[i];
            numeric[i+'V'] = numeric.mapreduce2(o[0],o[1]);
            numeric[i] = Function('x','s','k',
                    o[1]+
                    'if(typeof x !== "object") {'+
                    '    xi = x;\n'+
                    o[0]+';\n'+
                    '    return accum;\n'+
                    '}'+
                    'if(typeof s === "undefined") s = numeric.dim(x);\n'+
                    'if(typeof k === "undefined") k = 0;\n'+
                    'if(k === s.length-1) return numeric.'+i+'V(x);\n'+
                    'var xi;\n'+
                    'var n = x.length, i;\n'+
                    'for(i=n-1;i!==-1;--i) {\n'+
                    '   xi = arguments.callee(x[i]);\n'+
                    o[0]+';\n'+
                    '}\n'+
                    'return accum;\n');
        }
    }
}());

numeric.truncVV = numeric.pointwise(['x[i]','y[i]'],'ret[i] = round(x[i]/y[i])*y[i];','var round = Math.round;');
numeric.truncVS = numeric.pointwise(['x[i]','y'],'ret[i] = round(x[i]/y)*y;','var round = Math.round;');
numeric.truncSV = numeric.pointwise(['x','y[i]'],'ret[i] = round(x/y[i])*y[i];','var round = Math.round;');
numeric.trunc = function trunc(x,y) {
    if(typeof x === "object") {
        if(typeof y === "object") return numeric.truncVV(x,y);
        return numeric.truncVS(x,y);
    }
    if (typeof y === "object") return numeric.truncSV(x,y);
    return Math.round(x/y)*y;
}

numeric.inv = function inv(x) {
    var s = numeric.dim(x), abs = Math.abs, m = s[0], n = s[1];
    var A = numeric.clone(x), Ai, Aj;
    var I = numeric.identity(m), Ii, Ij;
    var i,j,k,x;
    for(j=0;j<n;++j) {
        var i0 = -1;
        var v0 = -1;
        for(i=j;i!==m;++i) { k = abs(A[i][j]); if(k>v0) { i0 = i; v0 = k; } }
        Aj = A[i0]; A[i0] = A[j]; A[j] = Aj;
        Ij = I[i0]; I[i0] = I[j]; I[j] = Ij;
        x = Aj[j];
        for(k=j;k!==n;++k)    Aj[k] /= x; 
        for(k=n-1;k!==-1;--k) Ij[k] /= x;
        for(i=m-1;i!==-1;--i) {
            if(i!==j) {
                Ai = A[i];
                Ii = I[i];
                x = Ai[j];
                for(k=j+1;k!==n;++k)  Ai[k] -= Aj[k]*x;
                for(k=n-1;k>0;--k) { Ii[k] -= Ij[k]*x; --k; Ii[k] -= Ij[k]*x; }
                if(k===0) Ii[0] -= Ij[0]*x;
            }
        }
    }
    return I;
}

numeric.det = function det(x) {
    var s = numeric.dim(x);
    if(s.length !== 2 || s[0] !== s[1]) { throw new Error('numeric: det() only works on square matrices'); }
    var n = s[0], ret = 1,i,j,k,A = numeric.clone(x),Aj,Ai,alpha,temp,k1,k2,k3;
    for(j=0;j<n-1;j++) {
        k=j;
        for(i=j+1;i<n;i++) { if(Math.abs(A[i][j]) > Math.abs(A[k][j])) { k = i; } }
        if(k !== j) {
            temp = A[k]; A[k] = A[j]; A[j] = temp;
            ret *= -1;
        }
        Aj = A[j];
        for(i=j+1;i<n;i++) {
            Ai = A[i];
            alpha = Ai[j]/Aj[j];
            for(k=j+1;k<n-1;k+=2) {
                k1 = k+1;
                Ai[k] -= Aj[k]*alpha;
                Ai[k1] -= Aj[k1]*alpha;
            }
            if(k!==n) { Ai[k] -= Aj[k]*alpha; }
        }
        if(Aj[j] === 0) { return 0; }
        ret *= Aj[j];
    }
    return ret*A[j][j];
}

numeric.transpose = function transpose(x) {
    var i,j,m = x.length,n = x[0].length, ret=Array(n),A0,A1,Bj;
    for(j=0;j<n;j++) ret[j] = Array(m);
    for(i=m-1;i>=1;i-=2) {
        A1 = x[i];
        A0 = x[i-1];
        for(j=n-1;j>=1;--j) {
            Bj = ret[j]; Bj[i] = A1[j]; Bj[i-1] = A0[j];
            --j;
            Bj = ret[j]; Bj[i] = A1[j]; Bj[i-1] = A0[j];
        }
        if(j===0) {
            Bj = ret[0]; Bj[i] = A1[0]; Bj[i-1] = A0[0];
        }
    }
    if(i===0) {
        A0 = x[0];
        for(j=n-1;j>=1;--j) {
            ret[j][0] = A0[j];
            --j;
            ret[j][0] = A0[j];
        }
        if(j===0) { ret[0][0] = A0[0]; }
    }
    return ret;
}
numeric.negtranspose = function negtranspose(x) {
    var i,j,m = x.length,n = x[0].length, ret=Array(n),A0,A1,Bj;
    for(j=0;j<n;j++) ret[j] = Array(m);
    for(i=m-1;i>=1;i-=2) {
        A1 = x[i];
        A0 = x[i-1];
        for(j=n-1;j>=1;--j) {
            Bj = ret[j]; Bj[i] = -A1[j]; Bj[i-1] = -A0[j];
            --j;
            Bj = ret[j]; Bj[i] = -A1[j]; Bj[i-1] = -A0[j];
        }
        if(j===0) {
            Bj = ret[0]; Bj[i] = -A1[0]; Bj[i-1] = -A0[0];
        }
    }
    if(i===0) {
        A0 = x[0];
        for(j=n-1;j>=1;--j) {
            ret[j][0] = -A0[j];
            --j;
            ret[j][0] = -A0[j];
        }
        if(j===0) { ret[0][0] = -A0[0]; }
    }
    return ret;
}

numeric._random = function _random(s,k) {
    var i,n=s[k],ret=Array(n), rnd;
    if(k === s.length-1) {
        rnd = Math.random;
        for(i=n-1;i>=1;i-=2) {
            ret[i] = rnd();
            ret[i-1] = rnd();
        }
        if(i===0) { ret[0] = rnd(); }
        return ret;
    }
    for(i=n-1;i>=0;i--) ret[i] = _random(s,k+1);
    return ret;
}
numeric.random = function random(s) { return numeric._random(s,0); }

numeric.norm2 = function norm2(x) { return Math.sqrt(numeric.norm2Squared(x)); }

numeric.linspace = function linspace(a,b,n) {
    if(typeof n === "undefined") n = Math.max(Math.round(b-a)+1,1);
    if(n<2) { return n===1?[a]:[]; }
    var i,ret = Array(n);
    n--;
    for(i=n;i>=0;i--) { ret[i] = (i*b+(n-i)*a)/n; }
    return ret;
}

numeric.getBlock = function getBlock(x,from,to) {
    var s = numeric.dim(x);
    function foo(x,k) {
        var i,a = from[k], n = to[k]-a, ret = Array(n);
        if(k === s.length-1) {
            for(i=n;i>=0;i--) { ret[i] = x[i+a]; }
            return ret;
        }
        for(i=n;i>=0;i--) { ret[i] = foo(x[i+a],k+1); }
        return ret;
    }
    return foo(x,0);
}

numeric.setBlock = function setBlock(x,from,to,B) {
    var s = numeric.dim(x);
    function foo(x,y,k) {
        var i,a = from[k], n = to[k]-a;
        if(k === s.length-1) { for(i=n;i>=0;i--) { x[i+a] = y[i]; } }
        for(i=n;i>=0;i--) { foo(x[i+a],y[i],k+1); }
    }
    foo(x,B,0);
    return x;
}

numeric.getRange = function getRange(A,I,J) {
    var m = I.length, n = J.length;
    var i,j;
    var B = Array(m), Bi, AI;
    for(i=m-1;i!==-1;--i) {
        B[i] = Array(n);
        Bi = B[i];
        AI = A[I[i]];
        for(j=n-1;j!==-1;--j) Bi[j] = AI[J[j]];
    }
    return B;
}

numeric.blockMatrix = function blockMatrix(X) {
    var s = numeric.dim(X);
    if(s.length<4) return numeric.blockMatrix([X]);
    var m=s[0],n=s[1],M,N,i,j,Xij;
    M = 0; N = 0;
    for(i=0;i<m;++i) M+=X[i][0].length;
    for(j=0;j<n;++j) N+=X[0][j][0].length;
    var Z = Array(M);
    for(i=0;i<M;++i) Z[i] = Array(N);
    var I=0,J,ZI,k,l,Xijk;
    for(i=0;i<m;++i) {
        J=N;
        for(j=n-1;j!==-1;--j) {
            Xij = X[i][j];
            J -= Xij[0].length;
            for(k=Xij.length-1;k!==-1;--k) {
                Xijk = Xij[k];
                ZI = Z[I+k];
                for(l = Xijk.length-1;l!==-1;--l) ZI[J+l] = Xijk[l];
            }
        }
        I += X[i][0].length;
    }
    return Z;
}

numeric.tensor = function tensor(x,y) {
    if(typeof x === "number" || typeof y === "number") return numeric.mul(x,y);
    var s1 = numeric.dim(x), s2 = numeric.dim(y);
    if(s1.length !== 1 || s2.length !== 1) {
        throw new Error('numeric: tensor product is only defined for vectors');
    }
    var m = s1[0], n = s2[0], A = Array(m), Ai, i,j,xi;
    for(i=m-1;i>=0;i--) {
        Ai = Array(n);
        xi = x[i];
        for(j=n-1;j>=3;--j) {
            Ai[j] = xi * y[j];
            --j;
            Ai[j] = xi * y[j];
            --j;
            Ai[j] = xi * y[j];
            --j;
            Ai[j] = xi * y[j];
        }
        while(j>=0) { Ai[j] = xi * y[j]; --j; }
        A[i] = Ai;
    }
    return A;
}

// 3. The Tensor type T
numeric.T = function T(x,y) { this.x = x; this.y = y; }
numeric.t = function t(x,y) { return new numeric.T(x,y); }

numeric.Tbinop = function Tbinop(rr,rc,cr,cc,setup) {
    var io = numeric.indexOf;
    if(typeof setup !== "string") {
        var k;
        setup = '';
        for(k in numeric) {
            if(numeric.hasOwnProperty(k) && (rr.indexOf(k)>=0 || rc.indexOf(k)>=0 || cr.indexOf(k)>=0 || cc.indexOf(k)>=0) && k.length>1) {
                setup += 'var '+k+' = numeric.'+k+';\n';
            }
        }
    }
    return Function(['y'],
            'var x = this;\n'+
            'if(!(y instanceof numeric.T)) { y = new numeric.T(y); }\n'+
            setup+'\n'+
            'if(x.y) {'+
            '  if(y.y) {'+
            '    return new numeric.T('+cc+');\n'+
            '  }\n'+
            '  return new numeric.T('+cr+');\n'+
            '}\n'+
            'if(y.y) {\n'+
            '  return new numeric.T('+rc+');\n'+
            '}\n'+
            'return new numeric.T('+rr+');\n'
    );
}

numeric.T.prototype.add = numeric.Tbinop(
        'add(x.x,y.x)',
        'add(x.x,y.x),y.y',
        'add(x.x,y.x),x.y',
        'add(x.x,y.x),add(x.y,y.y)');
numeric.T.prototype.sub = numeric.Tbinop(
        'sub(x.x,y.x)',
        'sub(x.x,y.x),neg(y.y)',
        'sub(x.x,y.x),x.y',
        'sub(x.x,y.x),sub(x.y,y.y)');
numeric.T.prototype.mul = numeric.Tbinop(
        'mul(x.x,y.x)',
        'mul(x.x,y.x),mul(x.x,y.y)',
        'mul(x.x,y.x),mul(x.y,y.x)',
        'sub(mul(x.x,y.x),mul(x.y,y.y)),add(mul(x.x,y.y),mul(x.y,y.x))');

numeric.T.prototype.reciprocal = function reciprocal() {
    var mul = numeric.mul, div = numeric.div;
    if(this.y) {
        var d = numeric.add(mul(this.x,this.x),mul(this.y,this.y));
        return new numeric.T(div(this.x,d),div(numeric.neg(this.y),d));
    }
    return new T(div(1,this.x));
}
numeric.T.prototype.div = function div(y) {
    if(!(y instanceof numeric.T)) y = new numeric.T(y);
    if(y.y) { return this.mul(y.reciprocal()); }
    var div = numeric.div;
    if(this.y) { return new numeric.T(div(this.x,y.x),div(this.y,y.x)); }
    return new numeric.T(div(this.x,y.x));
}
numeric.T.prototype.dot = numeric.Tbinop(
        'dot(x.x,y.x)',
        'dot(x.x,y.x),dot(x.x,y.y)',
        'dot(x.x,y.x),dot(x.y,y.x)',
        'sub(dot(x.x,y.x),dot(x.y,y.y)),add(dot(x.x,y.y),dot(x.y,y.x))'
        );
numeric.T.prototype.transpose = function transpose() {
    var t = numeric.transpose, x = this.x, y = this.y;
    if(y) { return new numeric.T(t(x),t(y)); }
    return new numeric.T(t(x));
}
numeric.T.prototype.transjugate = function transjugate() {
    var t = numeric.transpose, x = this.x, y = this.y;
    if(y) { return new numeric.T(t(x),numeric.negtranspose(y)); }
    return new numeric.T(t(x));
}
numeric.Tunop = function Tunop(r,c,s) {
    if(typeof s !== "string") { s = ''; }
    return Function(
            'var x = this;\n'+
            s+'\n'+
            'if(x.y) {'+
            '  '+c+';\n'+
            '}\n'+
            r+';\n'
    );
}

numeric.T.prototype.exp = numeric.Tunop(
        'return new numeric.T(ex)',
        'return new numeric.T(mul(cos(x.y),ex),mul(sin(x.y),ex))',
        'var ex = numeric.exp(x.x), cos = numeric.cos, sin = numeric.sin, mul = numeric.mul;');
numeric.T.prototype.conj = numeric.Tunop(
        'return new numeric.T(x.x);',
        'return new numeric.T(x.x,numeric.neg(x.y));');
numeric.T.prototype.neg = numeric.Tunop(
        'return new numeric.T(neg(x.x));',
        'return new numeric.T(neg(x.x),neg(x.y));',
        'var neg = numeric.neg;');
numeric.T.prototype.sin = numeric.Tunop(
        'return new numeric.T(numeric.sin(x.x))',
        'return x.exp().sub(x.neg().exp()).div(new numeric.T(0,2));');
numeric.T.prototype.cos = numeric.Tunop(
        'return new numeric.T(numeric.cos(x.x))',
        'return x.exp().add(x.neg().exp()).div(2);');
numeric.T.prototype.abs = numeric.Tunop(
        'return new numeric.T(numeric.abs(x.x));',
        'return new numeric.T(numeric.sqrt(numeric.add(mul(x.x,x.x),mul(x.y,x.y))));',
        'var mul = numeric.mul;');
numeric.T.prototype.log = numeric.Tunop(
        'return new numeric.T(numeric.log(x.x));',
        'var theta = new numeric.T(numeric.atan2(x.y,x.x)), r = x.abs();\n'+
        'return new numeric.T(numeric.log(r.x),theta.x);');
numeric.T.prototype.norm2 = numeric.Tunop(
        'return numeric.norm2(x.x);',
        'var f = numeric.norm2Squared;\n'+
        'return Math.sqrt(f(x.x)+f(x.y));');
numeric.T.prototype.inv = function inv() {
    var A = this;
    if(typeof A.y === "undefined") { return new numeric.T(numeric.inv(A.x)); }
    var n = A.x.length, i, j, k;
    var Rx = numeric.identity(n),Ry = numeric.rep([n,n],0);
    var Ax = numeric.clone(A.x), Ay = numeric.clone(A.y);
    var Aix, Aiy, Ajx, Ajy, Rix, Riy, Rjx, Rjy;
    var i,j,k,d,d1,ax,ay,bx,by,temp;
    for(i=0;i<n;i++) {
        ax = Ax[i][i]; ay = Ay[i][i];
        d = ax*ax+ay*ay;
        k = i;
        for(j=i+1;j<n;j++) {
            ax = Ax[j][i]; ay = Ay[j][i];
            d1 = ax*ax+ay*ay;
            if(d1 > d) { k=j; d = d1; }
        }
        if(k!==i) {
            temp = Ax[i]; Ax[i] = Ax[k]; Ax[k] = temp;
            temp = Ay[i]; Ay[i] = Ay[k]; Ay[k] = temp;
            temp = Rx[i]; Rx[i] = Rx[k]; Rx[k] = temp;
            temp = Ry[i]; Ry[i] = Ry[k]; Ry[k] = temp;
        }
        Aix = Ax[i]; Aiy = Ay[i];
        Rix = Rx[i]; Riy = Ry[i];
        ax = Aix[i]; ay = Aiy[i];
        for(j=i+1;j<n;j++) {
            bx = Aix[j]; by = Aiy[j];
            Aix[j] = (bx*ax+by*ay)/d;
            Aiy[j] = (by*ax-bx*ay)/d;
        }
        for(j=0;j<n;j++) {
            bx = Rix[j]; by = Riy[j];
            Rix[j] = (bx*ax+by*ay)/d;
            Riy[j] = (by*ax-bx*ay)/d;
        }
        for(j=i+1;j<n;j++) {
            Ajx = Ax[j]; Ajy = Ay[j];
            Rjx = Rx[j]; Rjy = Ry[j];
            ax = Ajx[i]; ay = Ajy[i];
            for(k=i+1;k<n;k++) {
                bx = Aix[k]; by = Aiy[k];
                Ajx[k] -= bx*ax-by*ay;
                Ajy[k] -= by*ax+bx*ay;
            }
            for(k=0;k<n;k++) {
                bx = Rix[k]; by = Riy[k];
                Rjx[k] -= bx*ax-by*ay;
                Rjy[k] -= by*ax+bx*ay;
            }
        }
    }
    for(i=n-1;i>0;i--) {
        Rix = Rx[i]; Riy = Ry[i];
        for(j=i-1;j>=0;j--) {
            Rjx = Rx[j]; Rjy = Ry[j];
            ax = Ax[j][i]; ay = Ay[j][i];
            for(k=n-1;k>=0;k--) {
                bx = Rix[k]; by = Riy[k];
                Rjx[k] -= ax*bx - ay*by;
                Rjy[k] -= ax*by + ay*bx;
            }
        }
    }
    return new numeric.T(Rx,Ry);
}
numeric.T.prototype.get = function get(i) {
    var x = this.x, y = this.y, k = 0, ik, n = i.length;
    if(y) {
        while(k<n) {
            ik = i[k];
            x = x[ik];
            y = y[ik];
            k++;
        }
        return new numeric.T(x,y);
    }
    while(k<n) {
        ik = i[k];
        x = x[ik];
        k++;
    }
    return new numeric.T(x);
}
numeric.T.prototype.set = function set(i,v) {
    var x = this.x, y = this.y, k = 0, ik, n = i.length, vx = v.x, vy = v.y;
    if(n===0) {
        if(vy) { this.y = vy; }
        else if(y) { this.y = undefined; }
        this.x = x;
        return this;
    }
    if(vy) {
        if(y) { /* ok */ }
        else {
            y = numeric.rep(numeric.dim(x),0);
            this.y = y;
        }
        while(k<n-1) {
            ik = i[k];
            x = x[ik];
            y = y[ik];
            k++;
        }
        ik = i[k];
        x[ik] = vx;
        y[ik] = vy;
        return this;
    }
    if(y) {
        while(k<n-1) {
            ik = i[k];
            x = x[ik];
            y = y[ik];
            k++;
        }
        ik = i[k];
        x[ik] = vx;
        if(vx instanceof Array) y[ik] = numeric.rep(numeric.dim(vx),0);
        else y[ik] = 0;
        return this;
    }
    while(k<n-1) {
        ik = i[k];
        x = x[ik];
        k++;
    }
    ik = i[k];
    x[ik] = vx;
    return this;
}
numeric.T.prototype.getRows = function getRows(i0,i1) {
    var n = i1-i0+1, j;
    var rx = Array(n), ry, x = this.x, y = this.y;
    for(j=i0;j<=i1;j++) { rx[j-i0] = x[j]; }
    if(y) {
        ry = Array(n);
        for(j=i0;j<=i1;j++) { ry[j-i0] = y[j]; }
        return new numeric.T(rx,ry);
    }
    return new numeric.T(rx);
}
numeric.T.prototype.setRows = function setRows(i0,i1,A) {
    var j;
    var rx = this.x, ry = this.y, x = A.x, y = A.y;
    for(j=i0;j<=i1;j++) { rx[j] = x[j-i0]; }
    if(y) {
        if(!ry) { ry = numeric.rep(numeric.dim(rx),0); this.y = ry; }
        for(j=i0;j<=i1;j++) { ry[j] = y[j-i0]; }
    } else if(ry) {
        for(j=i0;j<=i1;j++) { ry[j] = numeric.rep([x[j-i0].length],0); }
    }
    return this;
}
numeric.T.prototype.getRow = function getRow(k) {
    var x = this.x, y = this.y;
    if(y) { return new numeric.T(x[k],y[k]); }
    return new numeric.T(x[k]);
}
numeric.T.prototype.setRow = function setRow(i,v) {
    var rx = this.x, ry = this.y, x = v.x, y = v.y;
    rx[i] = x;
    if(y) {
        if(!ry) { ry = numeric.rep(numeric.dim(rx),0); this.y = ry; }
        ry[i] = y;
    } else if(ry) {
        ry = numeric.rep([x.length],0);
    }
    return this;
}

numeric.T.prototype.getBlock = function getBlock(from,to) {
    var x = this.x, y = this.y, b = numeric.getBlock;
    if(y) { return new numeric.T(b(x,from,to),b(y,from,to)); }
    return new numeric.T(b(x,from,to));
}
numeric.T.prototype.setBlock = function setBlock(from,to,A) {
    if(!(A instanceof numeric.T)) A = new numeric.T(A);
    var x = this.x, y = this.y, b = numeric.setBlock, Ax = A.x, Ay = A.y;
    if(Ay) {
        if(!y) { this.y = numeric.rep(numeric.dim(this),0); y = this.y; }
        b(x,from,to,Ax);
        b(y,from,to,Ay);
        return this;
    }
    b(x,from,to,Ax);
    if(y) b(y,from,to,numeric.rep(numeric.dim(Ax),0));
}
numeric.T.rep = function rep(s,v) {
    var T = numeric.T;
    if(!(v instanceof T)) v = new T(v);
    var x = v.x, y = v.y, r = numeric.rep;
    if(y) return new T(r(s,x),r(s,y));
    return new T(r(s,x));
}
numeric.T.diag = function diag(d) {
    if(!(d instanceof numeric.T)) d = new numeric.T(d);
    var x = d.x, y = d.y, diag = numeric.diag;
    if(y) return new numeric.T(diag(x),diag(y));
    return new numeric.T(diag(x));
}
numeric.T.eig = function eig() {
    if(this.y) { throw new Error('eig: not implemented for complex matrices.'); }
    return numeric.eig(this.x);
}
numeric.T.identity = function identity(n) { return new numeric.T(numeric.identity(n)); }
numeric.T.prototype.getDiag = function getDiag() {
    var n = numeric;
    var x = this.x, y = this.y;
    if(y) { return new n.T(n.getDiag(x),n.getDiag(y)); }
    return new n.T(n.getDiag(x));
}

// 4. Eigenvalues of real matrices

numeric.house = function house(x) {
    var v = numeric.clone(x);
    var s = x[0] >= 0 ? 1 : -1;
    var alpha = s*numeric.norm2(x);
    v[0] += alpha;
    var foo = numeric.norm2(v);
    if(foo === 0) { /* this should not happen */ throw new Error('eig: internal error'); }
    return numeric.div(v,foo);
}

numeric.toUpperHessenberg = function toUpperHessenberg(me) {
    var s = numeric.dim(me);
    if(s.length !== 2 || s[0] !== s[1]) { throw new Error('numeric: toUpperHessenberg() only works on square matrices'); }
    var m = s[0], i,j,k,x,v,A = numeric.clone(me),B,C,Ai,Ci,Q = numeric.identity(m),Qi;
    for(j=0;j<m-2;j++) {
        x = Array(m-j-1);
        for(i=j+1;i<m;i++) { x[i-j-1] = A[i][j]; }
        if(numeric.norm2(x)>0) {
            v = numeric.house(x);
            B = numeric.getBlock(A,[j+1,j],[m-1,m-1]);
            C = numeric.tensor(v,numeric.dot(v,B));
            for(i=j+1;i<m;i++) { Ai = A[i]; Ci = C[i-j-1]; for(k=j;k<m;k++) Ai[k] -= 2*Ci[k-j]; }
            B = numeric.getBlock(A,[0,j+1],[m-1,m-1]);
            C = numeric.tensor(numeric.dot(B,v),v);
            for(i=0;i<m;i++) { Ai = A[i]; Ci = C[i]; for(k=j+1;k<m;k++) Ai[k] -= 2*Ci[k-j-1]; }
            B = Array(m-j-1);
            for(i=j+1;i<m;i++) B[i-j-1] = Q[i];
            C = numeric.tensor(v,numeric.dot(v,B));
            for(i=j+1;i<m;i++) { Qi = Q[i]; Ci = C[i-j-1]; for(k=0;k<m;k++) Qi[k] -= 2*Ci[k]; }
        }
    }
    return {H:A, Q:Q};
}

numeric.epsilon = 2.220446049250313e-16;

numeric.QRFrancis = function(H,maxiter) {
    if(typeof maxiter === "undefined") { maxiter = 10000; }
    H = numeric.clone(H);
    var H0 = numeric.clone(H);
    var s = numeric.dim(H),m=s[0],x,v,a,b,c,d,det,tr, Hloc, Q = numeric.identity(m), Qi, Hi, B, C, Ci,i,j,k,iter;
    if(m<3) { return {Q:Q, B:[ [0,m-1] ]}; }
    var epsilon = numeric.epsilon;
    for(iter=0;iter<maxiter;iter++) {
        for(j=0;j<m-1;j++) {
            if(Math.abs(H[j+1][j]) < epsilon*(Math.abs(H[j][j])+Math.abs(H[j+1][j+1]))) {
                var QH1 = numeric.QRFrancis(numeric.getBlock(H,[0,0],[j,j]),maxiter);
                var QH2 = numeric.QRFrancis(numeric.getBlock(H,[j+1,j+1],[m-1,m-1]),maxiter);
                B = Array(j+1);
                for(i=0;i<=j;i++) { B[i] = Q[i]; }
                C = numeric.dot(QH1.Q,B);
                for(i=0;i<=j;i++) { Q[i] = C[i]; }
                B = Array(m-j-1);
                for(i=j+1;i<m;i++) { B[i-j-1] = Q[i]; }
                C = numeric.dot(QH2.Q,B);
                for(i=j+1;i<m;i++) { Q[i] = C[i-j-1]; }
                return {Q:Q,B:QH1.B.concat(numeric.add(QH2.B,j+1))};
            }
        }
        a = H[m-2][m-2]; b = H[m-2][m-1];
        c = H[m-1][m-2]; d = H[m-1][m-1];
        tr = a+d;
        det = (a*d-b*c);
        Hloc = numeric.getBlock(H, [0,0], [2,2]);
        if(tr*tr>=4*det) {
            var s1,s2;
            s1 = 0.5*(tr+Math.sqrt(tr*tr-4*det));
            s2 = 0.5*(tr-Math.sqrt(tr*tr-4*det));
            Hloc = numeric.add(numeric.sub(numeric.dot(Hloc,Hloc),
                                           numeric.mul(Hloc,s1+s2)),
                               numeric.diag(numeric.rep([3],s1*s2)));
        } else {
            Hloc = numeric.add(numeric.sub(numeric.dot(Hloc,Hloc),
                                           numeric.mul(Hloc,tr)),
                               numeric.diag(numeric.rep([3],det)));
        }
        x = [Hloc[0][0],Hloc[1][0],Hloc[2][0]];
        v = numeric.house(x);
        B = [H[0],H[1],H[2]];
        C = numeric.tensor(v,numeric.dot(v,B));
        for(i=0;i<3;i++) { Hi = H[i]; Ci = C[i]; for(k=0;k<m;k++) Hi[k] -= 2*Ci[k]; }
        B = numeric.getBlock(H, [0,0],[m-1,2]);
        C = numeric.tensor(numeric.dot(B,v),v);
        for(i=0;i<m;i++) { Hi = H[i]; Ci = C[i]; for(k=0;k<3;k++) Hi[k] -= 2*Ci[k]; }
        B = [Q[0],Q[1],Q[2]];
        C = numeric.tensor(v,numeric.dot(v,B));
        for(i=0;i<3;i++) { Qi = Q[i]; Ci = C[i]; for(k=0;k<m;k++) Qi[k] -= 2*Ci[k]; }
        var J;
        for(j=0;j<m-2;j++) {
            for(k=j;k<=j+1;k++) {
                if(Math.abs(H[k+1][k]) < epsilon*(Math.abs(H[k][k])+Math.abs(H[k+1][k+1]))) {
                    var QH1 = numeric.QRFrancis(numeric.getBlock(H,[0,0],[k,k]),maxiter);
                    var QH2 = numeric.QRFrancis(numeric.getBlock(H,[k+1,k+1],[m-1,m-1]),maxiter);
                    B = Array(k+1);
                    for(i=0;i<=k;i++) { B[i] = Q[i]; }
                    C = numeric.dot(QH1.Q,B);
                    for(i=0;i<=k;i++) { Q[i] = C[i]; }
                    B = Array(m-k-1);
                    for(i=k+1;i<m;i++) { B[i-k-1] = Q[i]; }
                    C = numeric.dot(QH2.Q,B);
                    for(i=k+1;i<m;i++) { Q[i] = C[i-k-1]; }
                    return {Q:Q,B:QH1.B.concat(numeric.add(QH2.B,k+1))};
                }
            }
            J = Math.min(m-1,j+3);
            x = Array(J-j);
            for(i=j+1;i<=J;i++) { x[i-j-1] = H[i][j]; }
            v = numeric.house(x);
            B = numeric.getBlock(H, [j+1,j],[J,m-1]);
            C = numeric.tensor(v,numeric.dot(v,B));
            for(i=j+1;i<=J;i++) { Hi = H[i]; Ci = C[i-j-1]; for(k=j;k<m;k++) Hi[k] -= 2*Ci[k-j]; }
            B = numeric.getBlock(H, [0,j+1],[m-1,J]);
            C = numeric.tensor(numeric.dot(B,v),v);
            for(i=0;i<m;i++) { Hi = H[i]; Ci = C[i]; for(k=j+1;k<=J;k++) Hi[k] -= 2*Ci[k-j-1]; }
            B = Array(J-j);
            for(i=j+1;i<=J;i++) B[i-j-1] = Q[i];
            C = numeric.tensor(v,numeric.dot(v,B));
            for(i=j+1;i<=J;i++) { Qi = Q[i]; Ci = C[i-j-1]; for(k=0;k<m;k++) Qi[k] -= 2*Ci[k]; }
        }
    }
    throw new Error('numeric: eigenvalue iteration does not converge -- increase maxiter?');
}

numeric.eig = function eig(A,maxiter) {
    var QH = numeric.toUpperHessenberg(A);
    var QB = numeric.QRFrancis(QH.H,maxiter);
    var T = numeric.T;
    var n = A.length,i,k,flag = false,B = QB.B,H = numeric.dot(QB.Q,numeric.dot(QH.H,numeric.transpose(QB.Q)));
    var Q = new T(numeric.dot(QB.Q,QH.Q)),Q0;
    var m = B.length,j;
    var a,b,c,d,p1,p2,disc,x,y,p,q,n1,n2;
    var sqrt = Math.sqrt;
    for(k=0;k<m;k++) {
        i = B[k][0];
        if(i === B[k][1]) {
            // nothing
        } else {
            j = i+1;
            a = H[i][i];
            b = H[i][j];
            c = H[j][i];
            d = H[j][j];
            if(b === 0 && c === 0) continue;
            p1 = -a-d;
            p2 = a*d-b*c;
            disc = p1*p1-4*p2;
            if(disc>=0) {
                if(p1<0) x = -0.5*(p1-sqrt(disc));
                else     x = -0.5*(p1+sqrt(disc));
                n1 = (a-x)*(a-x)+b*b;
                n2 = c*c+(d-x)*(d-x);
                if(n1>n2) {
                    n1 = sqrt(n1);
                    p = (a-x)/n1;
                    q = b/n1;
                } else {
                    n2 = sqrt(n2);
                    p = c/n2;
                    q = (d-x)/n2;
                }
                Q0 = new T([[q,-p],[p,q]]);
                Q.setRows(i,j,Q0.dot(Q.getRows(i,j)));
            } else {
                x = -0.5*p1;
                y = 0.5*sqrt(-disc);
                n1 = (a-x)*(a-x)+b*b;
                n2 = c*c+(d-x)*(d-x);
                if(n1>n2) {
                    n1 = sqrt(n1+y*y);
                    p = (a-x)/n1;
                    q = b/n1;
                    x = 0;
                    y /= n1;
                } else {
                    n2 = sqrt(n2+y*y);
                    p = c/n2;
                    q = (d-x)/n2;
                    x = y/n2;
                    y = 0;
                }
                Q0 = new T([[q,-p],[p,q]],[[x,y],[y,-x]]);
                Q.setRows(i,j,Q0.dot(Q.getRows(i,j)));
            }
        }
    }
    var R = Q.dot(A).dot(Q.transjugate()), n = A.length, E = numeric.T.identity(n);
    for(j=0;j<n;j++) {
        if(j>0) {
            for(k=j-1;k>=0;k--) {
                var Rk = R.get([k,k]), Rj = R.get([j,j]);
                if(numeric.neq(Rk.x,Rj.x) || numeric.neq(Rk.y,Rj.y)) {
                    x = R.getRow(k).getBlock([k],[j-1]);
                    y = E.getRow(j).getBlock([k],[j-1]);
                    E.set([j,k],(R.get([k,j]).neg().sub(x.dot(y))).div(Rk.sub(Rj)));
                } else {
                    E.setRow(j,E.getRow(k));
                    continue;
                }
            }
        }
    }
    for(j=0;j<n;j++) {
        x = E.getRow(j);
        E.setRow(j,x.div(x.norm2()));
    }
    E = E.transpose();
    E = Q.transjugate().dot(E);
    return { lambda:R.getDiag(), E:E };
};

// 5. Compressed Column Storage matrices
numeric.ccsSparse = function ccsSparse(A) {
    var m = A.length,n,foo, i,j, counts = [];
    for(i=m-1;i!==-1;--i) {
        foo = A[i];
        for(j in foo) {
            j = parseInt(j);
            while(j>=counts.length) counts[counts.length] = 0;
            if(foo[j]!==0) counts[j]++;
        }
    }
    var n = counts.length;
    var Ai = Array(n+1);
    Ai[0] = 0;
    for(i=0;i<n;++i) Ai[i+1] = Ai[i] + counts[i];
    var Aj = Array(Ai[n]), Av = Array(Ai[n]);
    for(i=m-1;i!==-1;--i) {
        foo = A[i];
        for(j in foo) {
            if(foo[j]!==0) {
                counts[j]--;
                Aj[Ai[j]+counts[j]] = i;
                Av[Ai[j]+counts[j]] = foo[j];
            }
        }
    }
    return [Ai,Aj,Av];
}
numeric.ccsFull = function ccsFull(A) {
    var Ai = A[0], Aj = A[1], Av = A[2], s = numeric.ccsDim(A), m = s[0], n = s[1], i,j,j0,j1,k;
    var B = numeric.rep([m,n],0);
    for(i=0;i<n;i++) {
        j0 = Ai[i];
        j1 = Ai[i+1];
        for(j=j0;j<j1;++j) { B[Aj[j]][i] = Av[j]; }
    }
    return B;
}
numeric.ccsTSolve = function ccsTSolve(A,b,x,bj,xj) {
    var Ai = A[0], Aj = A[1], Av = A[2],m = Ai.length-1, max = Math.max,n=0;
    if(typeof bj === "undefined") x = numeric.rep([m],0);
    if(typeof bj === "undefined") bj = numeric.linspace(0,x.length-1);
    if(typeof xj === "undefined") xj = [];
    function dfs(j) {
        var k;
        if(x[j] !== 0) return;
        x[j] = 1;
        for(k=Ai[j];k<Ai[j+1];++k) dfs(Aj[k]);
        xj[n] = j;
        ++n;
    }
    var i,j,j0,j1,k,l,l0,l1,a;
    for(i=bj.length-1;i!==-1;--i) { dfs(bj[i]); }
    xj.length = n;
    for(i=xj.length-1;i!==-1;--i) { x[xj[i]] = 0; }
    for(i=bj.length-1;i!==-1;--i) { j = bj[i]; x[j] = b[j]; }
    for(i=xj.length-1;i!==-1;--i) {
        j = xj[i];
        j0 = Ai[j];
        j1 = max(Ai[j+1],j0);
        for(k=j0;k!==j1;++k) { if(Aj[k] === j) { x[j] /= Av[k]; break; } }
        a = x[j];
        for(k=j0;k!==j1;++k) {
            l = Aj[k];
            if(l !== j) x[l] -= a*Av[k];
        }
    }
    return x;
}
numeric.ccsDFS = function ccsDFS(n) {
    this.k = Array(n);
    this.k1 = Array(n);
    this.j = Array(n);
}
numeric.ccsDFS.prototype.dfs = function dfs(J,Ai,Aj,x,xj,Pinv) {
    var m = 0,foo,n=xj.length;
    var k = this.k, k1 = this.k1, j = this.j,km,k11;
    if(x[J]!==0) return;
    x[J] = 1;
    j[0] = J;
    k[0] = km = Ai[J];
    k1[0] = k11 = Ai[J+1];
    while(1) {
        if(km >= k11) {
            xj[n] = j[m];
            if(m===0) return;
            ++n;
            --m;
            km = k[m];
            k11 = k1[m];
        } else {
            foo = Pinv[Aj[km]];
            if(x[foo] === 0) {
                x[foo] = 1;
                k[m] = km;
                ++m;
                j[m] = foo;
                km = Ai[foo];
                k1[m] = k11 = Ai[foo+1];
            } else ++km;
        }
    }
}
numeric.ccsLPSolve = function ccsLPSolve(A,B,x,xj,I,Pinv,dfs) {
    var Ai = A[0], Aj = A[1], Av = A[2],m = Ai.length-1, n=0;
    var Bi = B[0], Bj = B[1], Bv = B[2];
    
    var i,i0,i1,j,J,j0,j1,k,l,l0,l1,a;
    i0 = Bi[I];
    i1 = Bi[I+1];
    xj.length = 0;
    for(i=i0;i<i1;++i) { dfs.dfs(Pinv[Bj[i]],Ai,Aj,x,xj,Pinv); }
    for(i=xj.length-1;i!==-1;--i) { x[xj[i]] = 0; }
    for(i=i0;i!==i1;++i) { j = Pinv[Bj[i]]; x[j] = Bv[i]; }
    for(i=xj.length-1;i!==-1;--i) {
        j = xj[i];
        j0 = Ai[j];
        j1 = Ai[j+1];
        for(k=j0;k<j1;++k) { if(Pinv[Aj[k]] === j) { x[j] /= Av[k]; break; } }
        a = x[j];
        for(k=j0;k<j1;++k) {
            l = Pinv[Aj[k]];
            if(l !== j) x[l] -= a*Av[k];
        }
    }
    return x;
}
numeric.ccsLUP1 = function ccsLUP1(A,threshold) {
    var m = A[0].length-1;
    var L = [numeric.rep([m+1],0),[],[]], U = [numeric.rep([m+1], 0),[],[]];
    var Li = L[0], Lj = L[1], Lv = L[2], Ui = U[0], Uj = U[1], Uv = U[2];
    var x = numeric.rep([m],0), xj = numeric.rep([m],0);
    var i,j,k,j0,j1,a,e,c,d,K;
    var sol = numeric.ccsLPSolve, max = Math.max, abs = Math.abs;
    var P = numeric.linspace(0,m-1),Pinv = numeric.linspace(0,m-1);
    var dfs = new numeric.ccsDFS(m);
    if(typeof threshold === "undefined") { threshold = 1; }
    for(i=0;i<m;++i) {
        sol(L,A,x,xj,i,Pinv,dfs);
        a = -1;
        e = -1;
        for(j=xj.length-1;j!==-1;--j) {
            k = xj[j];
            if(k <= i) continue;
            c = abs(x[k]);
            if(c > a) { e = k; a = c; }
        }
        if(abs(x[i])<threshold*a) {
            j = P[i];
            a = P[e];
            P[i] = a; Pinv[a] = i;
            P[e] = j; Pinv[j] = e;
            a = x[i]; x[i] = x[e]; x[e] = a;
        }
        a = Li[i];
        e = Ui[i];
        d = x[i];
        Lj[a] = P[i];
        Lv[a] = 1;
        ++a;
        for(j=xj.length-1;j!==-1;--j) {
            k = xj[j];
            c = x[k];
            xj[j] = 0;
            x[k] = 0;
            if(k<=i) { Uj[e] = k; Uv[e] = c;   ++e; }
            else     { Lj[a] = P[k]; Lv[a] = c/d; ++a; }
        }
        Li[i+1] = a;
        Ui[i+1] = e;
    }
    for(j=Lj.length-1;j!==-1;--j) { Lj[j] = Pinv[Lj[j]]; }
    return {L:L, U:U, P:P, Pinv:Pinv};
}
numeric.ccsDFS0 = function ccsDFS0(n) {
    this.k = Array(n);
    this.k1 = Array(n);
    this.j = Array(n);
}
numeric.ccsDFS0.prototype.dfs = function dfs(J,Ai,Aj,x,xj,Pinv,P) {
    var m = 0,foo,n=xj.length;
    var k = this.k, k1 = this.k1, j = this.j,km,k11;
    if(x[J]!==0) return;
    x[J] = 1;
    j[0] = J;
    k[0] = km = Ai[Pinv[J]];
    k1[0] = k11 = Ai[Pinv[J]+1];
    while(1) {
        if(isNaN(km)) throw new Error("Ow!");
        if(km >= k11) {
            xj[n] = Pinv[j[m]];
            if(m===0) return;
            ++n;
            --m;
            km = k[m];
            k11 = k1[m];
        } else {
            foo = Aj[km];
            if(x[foo] === 0) {
                x[foo] = 1;
                k[m] = km;
                ++m;
                j[m] = foo;
                foo = Pinv[foo];
                km = Ai[foo];
                k1[m] = k11 = Ai[foo+1];
            } else ++km;
        }
    }
}
numeric.ccsLPSolve0 = function ccsLPSolve0(A,B,y,xj,I,Pinv,P,dfs) {
    var Ai = A[0], Aj = A[1], Av = A[2],m = Ai.length-1, n=0;
    var Bi = B[0], Bj = B[1], Bv = B[2];
    
    var i,i0,i1,j,J,j0,j1,k,l,l0,l1,a;
    i0 = Bi[I];
    i1 = Bi[I+1];
    xj.length = 0;
    for(i=i0;i<i1;++i) { dfs.dfs(Bj[i],Ai,Aj,y,xj,Pinv,P); }
    for(i=xj.length-1;i!==-1;--i) { j = xj[i]; y[P[j]] = 0; }
    for(i=i0;i!==i1;++i) { j = Bj[i]; y[j] = Bv[i]; }
    for(i=xj.length-1;i!==-1;--i) {
        j = xj[i];
        l = P[j];
        j0 = Ai[j];
        j1 = Ai[j+1];
        for(k=j0;k<j1;++k) { if(Aj[k] === l) { y[l] /= Av[k]; break; } }
        a = y[l];
        for(k=j0;k<j1;++k) y[Aj[k]] -= a*Av[k];
        y[l] = a;
    }
}
numeric.ccsLUP0 = function ccsLUP0(A,threshold) {
    var m = A[0].length-1;
    var L = [numeric.rep([m+1],0),[],[]], U = [numeric.rep([m+1], 0),[],[]];
    var Li = L[0], Lj = L[1], Lv = L[2], Ui = U[0], Uj = U[1], Uv = U[2];
    var y = numeric.rep([m],0), xj = numeric.rep([m],0);
    var i,j,k,j0,j1,a,e,c,d,K;
    var sol = numeric.ccsLPSolve0, max = Math.max, abs = Math.abs;
    var P = numeric.linspace(0,m-1),Pinv = numeric.linspace(0,m-1);
    var dfs = new numeric.ccsDFS0(m);
    if(typeof threshold === "undefined") { threshold = 1; }
    for(i=0;i<m;++i) {
        sol(L,A,y,xj,i,Pinv,P,dfs);
        a = -1;
        e = -1;
        for(j=xj.length-1;j!==-1;--j) {
            k = xj[j];
            if(k <= i) continue;
            c = abs(y[P[k]]);
            if(c > a) { e = k; a = c; }
        }
        if(abs(y[P[i]])<threshold*a) {
            j = P[i];
            a = P[e];
            P[i] = a; Pinv[a] = i;
            P[e] = j; Pinv[j] = e;
        }
        a = Li[i];
        e = Ui[i];
        d = y[P[i]];
        Lj[a] = P[i];
        Lv[a] = 1;
        ++a;
        for(j=xj.length-1;j!==-1;--j) {
            k = xj[j];
            c = y[P[k]];
            xj[j] = 0;
            y[P[k]] = 0;
            if(k<=i) { Uj[e] = k; Uv[e] = c;   ++e; }
            else     { Lj[a] = P[k]; Lv[a] = c/d; ++a; }
        }
        Li[i+1] = a;
        Ui[i+1] = e;
    }
    for(j=Lj.length-1;j!==-1;--j) { Lj[j] = Pinv[Lj[j]]; }
    return {L:L, U:U, P:P, Pinv:Pinv};
}
numeric.ccsLUP = numeric.ccsLUP0;

numeric.ccsDim = function ccsDim(A) { return [numeric.sup(A[1])+1,A[0].length-1]; }
numeric.ccsGetBlock = function ccsGetBlock(A,i,j) {
    var s = numeric.ccsDim(A),m=s[0],n=s[1];
    if(typeof i === "undefined") { i = numeric.linspace(0,m-1); }
    else if(typeof i === "number") { i = [i]; }
    if(typeof j === "undefined") { j = numeric.linspace(0,n-1); }
    else if(typeof j === "number") { j = [j]; }
    var p,p0,p1,P = i.length,q,Q = j.length,r,jq,ip;
    var Bi = numeric.rep([n],0), Bj=[], Bv=[], B = [Bi,Bj,Bv];
    var Ai = A[0], Aj = A[1], Av = A[2];
    var x = numeric.rep([m],0),count=0,flags = numeric.rep([m],0);
    for(q=0;q<Q;++q) {
        jq = j[q];
        var q0 = Ai[jq];
        var q1 = Ai[jq+1];
        for(p=q0;p<q1;++p) {
            r = Aj[p];
            flags[r] = 1;
            x[r] = Av[p];
        }
        for(p=0;p<P;++p) {
            ip = i[p];
            if(flags[ip]) {
                Bj[count] = p;
                Bv[count] = x[i[p]];
                ++count;
            }
        }
        for(p=q0;p<q1;++p) {
            r = Aj[p];
            flags[r] = 0;
        }
        Bi[q+1] = count;
    }
    return B;
}

numeric.ccsDot = function ccsDot(A,B) {
    var Ai = A[0], Aj = A[1], Av = A[2];
    var Bi = B[0], Bj = B[1], Bv = B[2];
    var sA = numeric.ccsDim(A), sB = numeric.ccsDim(B);
    var m = sA[0], n = sA[1], o = sB[1];
    var x = numeric.rep([m],0), flags = numeric.rep([m],0), xj = Array(m);
    var Ci = numeric.rep([o],0), Cj = [], Cv = [], C = [Ci,Cj,Cv];
    var i,j,k,j0,j1,i0,i1,l,p,a,b;
    for(k=0;k!==o;++k) {
        j0 = Bi[k];
        j1 = Bi[k+1];
        p = 0;
        for(j=j0;j<j1;++j) {
            a = Bj[j];
            b = Bv[j];
            i0 = Ai[a];
            i1 = Ai[a+1];
            for(i=i0;i<i1;++i) {
                l = Aj[i];
                if(flags[l]===0) {
                    xj[p] = l;
                    flags[l] = 1;
                    p = p+1;
                }
                x[l] = x[l] + Av[i]*b;
            }
        }
        j0 = Ci[k];
        j1 = j0+p;
        Ci[k+1] = j1;
        for(j=p-1;j!==-1;--j) {
            b = j0+j;
            i = xj[j];
            Cj[b] = i;
            Cv[b] = x[i];
            flags[i] = 0;
            x[i] = 0;
        }
        Ci[k+1] = Ci[k]+p;
    }
    return C;
}

numeric.ccsLUPSolve = function ccsLUPSolve(LUP,B) {
    var L = LUP.L, U = LUP.U, P = LUP.P;
    var Bi = B[0];
    var flag = false;
    if(typeof Bi !== "object") { B = [[0,B.length],numeric.linspace(0,B.length-1),B]; Bi = B[0]; flag = true; }
    var Bj = B[1], Bv = B[2];
    var n = L[0].length-1, m = Bi.length-1;
    var x = numeric.rep([n],0), xj = Array(n);
    var b = numeric.rep([n],0), bj = Array(n);
    var Xi = numeric.rep([m+1],0), Xj = [], Xv = [];
    var sol = numeric.ccsTSolve;
    var i,j,j0,j1,k,J,N=0;
    for(i=0;i<m;++i) {
        k = 0;
        j0 = Bi[i];
        j1 = Bi[i+1];
        for(j=j0;j<j1;++j) { 
            J = LUP.Pinv[Bj[j]];
            bj[k] = J;
            b[J] = Bv[j];
            ++k;
        }
        bj.length = k;
        sol(L,b,x,bj,xj);
        for(j=bj.length-1;j!==-1;--j) b[bj[j]] = 0;
        sol(U,x,b,xj,bj);
        if(flag) return b;
        for(j=xj.length-1;j!==-1;--j) x[xj[j]] = 0;
        for(j=bj.length-1;j!==-1;--j) {
            J = bj[j];
            Xj[N] = J;
            Xv[N] = b[J];
            b[J] = 0;
            ++N;
        }
        Xi[i+1] = N;
    }
    return [Xi,Xj,Xv];
}

numeric.ccsbinop = function ccsbinop(body,setup) {
    if(typeof setup === "undefined") setup='';
    return Function('X','Y',
            'var Xi = X[0], Xj = X[1], Xv = X[2];\n'+
            'var Yi = Y[0], Yj = Y[1], Yv = Y[2];\n'+
            'var n = Xi.length-1,m = Math.max(numeric.sup(Xj),numeric.sup(Yj))+1;\n'+
            'var Zi = numeric.rep([n+1],0), Zj = [], Zv = [];\n'+
            'var x = numeric.rep([m],0),y = numeric.rep([m],0);\n'+
            'var xk,yk,zk;\n'+
            'var i,j,j0,j1,k,p=0;\n'+
            setup+
            'for(i=0;i<n;++i) {\n'+
            '  j0 = Xi[i]; j1 = Xi[i+1];\n'+
            '  for(j=j0;j!==j1;++j) {\n'+
            '    k = Xj[j];\n'+
            '    x[k] = 1;\n'+
            '    Zj[p] = k;\n'+
            '    ++p;\n'+
            '  }\n'+
            '  j0 = Yi[i]; j1 = Yi[i+1];\n'+
            '  for(j=j0;j!==j1;++j) {\n'+
            '    k = Yj[j];\n'+
            '    y[k] = Yv[j];\n'+
            '    if(x[k] === 0) {\n'+
            '      Zj[p] = k;\n'+
            '      ++p;\n'+
            '    }\n'+
            '  }\n'+
            '  Zi[i+1] = p;\n'+
            '  j0 = Xi[i]; j1 = Xi[i+1];\n'+
            '  for(j=j0;j!==j1;++j) x[Xj[j]] = Xv[j];\n'+
            '  j0 = Zi[i]; j1 = Zi[i+1];\n'+
            '  for(j=j0;j!==j1;++j) {\n'+
            '    k = Zj[j];\n'+
            '    xk = x[k];\n'+
            '    yk = y[k];\n'+
            body+'\n'+
            '    Zv[j] = zk;\n'+
            '  }\n'+
            '  j0 = Xi[i]; j1 = Xi[i+1];\n'+
            '  for(j=j0;j!==j1;++j) x[Xj[j]] = 0;\n'+
            '  j0 = Yi[i]; j1 = Yi[i+1];\n'+
            '  for(j=j0;j!==j1;++j) y[Yj[j]] = 0;\n'+
            '}\n'+
            'return [Zi,Zj,Zv];'
            );
};

(function() {
    var k,A,B,C;
    for(k in numeric.ops2) {
        if(isFinite(eval('1'+numeric.ops2[k]+'0'))) A = '[Y[0],Y[1],numeric.'+k+'(X,Y[2])]';
        else A = 'NaN';
        if(isFinite(eval('0'+numeric.ops2[k]+'1'))) B = '[X[0],X[1],numeric.'+k+'(X[2],Y)]';
        else B = 'NaN';
        if(isFinite(eval('1'+numeric.ops2[k]+'0')) && isFinite(eval('0'+numeric.ops2[k]+'1'))) C = 'numeric.ccs'+k+'MM(X,Y)';
        else C = 'NaN';
        numeric['ccs'+k+'MM'] = numeric.ccsbinop('zk = xk '+numeric.ops2[k]+'yk;');
        numeric['ccs'+k] = Function('X','Y',
                'if(typeof X === "number") return '+A+';\n'+
                'if(typeof Y === "number") return '+B+';\n'+
                'return '+C+';\n'
                );
    }
}());

numeric.ccsScatter = function ccsScatter(A) {
    var Ai = A[0], Aj = A[1], Av = A[2];
    var n = numeric.sup(Aj)+1,m=Ai.length;
    var Ri = numeric.rep([n],0),Rj=Array(m), Rv = Array(m);
    var counts = numeric.rep([n],0),i;
    for(i=0;i<m;++i) counts[Aj[i]]++;
    for(i=0;i<n;++i) Ri[i+1] = Ri[i] + counts[i];
    var ptr = Ri.slice(0),k,Aii;
    for(i=0;i<m;++i) {
        Aii = Aj[i];
        k = ptr[Aii];
        Rj[k] = Ai[i];
        Rv[k] = Av[i];
        ptr[Aii]=ptr[Aii]+1;
    }
    return [Ri,Rj,Rv];
}

numeric.ccsGather = function ccsGather(A) {
    var Ai = A[0], Aj = A[1], Av = A[2];
    var n = Ai.length-1,m = Aj.length;
    var Ri = Array(m), Rj = Array(m), Rv = Array(m);
    var i,j,j0,j1,p;
    p=0;
    for(i=0;i<n;++i) {
        j0 = Ai[i];
        j1 = Ai[i+1];
        for(j=j0;j!==j1;++j) {
            Rj[p] = i;
            Ri[p] = Aj[j];
            Rv[p] = Av[j];
            ++p;
        }
    }
    return [Ri,Rj,Rv];
}

// The following sparse linear algebra routines are deprecated.

numeric.sdim = function dim(A,ret,k) {
    if(typeof ret === "undefined") { ret = []; }
    if(typeof A !== "object") return ret;
    if(typeof k === "undefined") { k=0; }
    if(!(k in ret)) { ret[k] = 0; }
    if(A.length > ret[k]) ret[k] = A.length;
    var i;
    for(i in A) {
        if(A.hasOwnProperty(i)) dim(A[i],ret,k+1);
    }
    return ret;
};

numeric.sclone = function clone(A,k,n) {
    if(typeof k === "undefined") { k=0; }
    if(typeof n === "undefined") { n = numeric.sdim(A).length; }
    var i,ret = Array(A.length);
    if(k === n-1) {
        for(i in A) { if(A.hasOwnProperty(i)) ret[i] = A[i]; }
        return ret;
    }
    for(i in A) {
        if(A.hasOwnProperty(i)) ret[i] = clone(A[i],k+1,n);
    }
    return ret;
}

numeric.sdiag = function diag(d) {
    var n = d.length,i,ret = Array(n),i1,i2,i3;
    for(i=n-1;i>=1;i-=2) {
        i1 = i-1;
        ret[i] = []; ret[i][i] = d[i];
        ret[i1] = []; ret[i1][i1] = d[i1];
    }
    if(i===0) { ret[0] = []; ret[0][0] = d[i]; }
    return ret;
}

numeric.sidentity = function identity(n) { return numeric.sdiag(numeric.rep([n],1)); }

numeric.stranspose = function transpose(A) {
    var ret = [], n = A.length, i,j,Ai;
    for(i in A) {
        if(!(A.hasOwnProperty(i))) continue;
        Ai = A[i];
        for(j in Ai) {
            if(!(Ai.hasOwnProperty(j))) continue;
            if(typeof ret[j] !== "object") { ret[j] = []; }
            ret[j][i] = Ai[j];
        }
    }
    return ret;
}

numeric.sLUP = function LUP(A,tol) {
    throw new Error("The function numeric.sLUP had a bug in it and has been removed. Please use the new numeric.ccsLUP function instead.");
};

numeric.sdotMM = function dotMM(A,B) {
    var p = A.length, q = B.length, BT = numeric.stranspose(B), r = BT.length, Ai, BTk;
    var i,j,k,accum;
    var ret = Array(p),reti;
    for(i=p-1;i>=0;i--) {
        reti = [];
        Ai = A[i];
        for(k=r-1;k>=0;k--) {
            accum = 0;
            BTk = BT[k];
            for(j in Ai) {
                if(!(Ai.hasOwnProperty(j))) continue;
                if(j in BTk) { accum += Ai[j]*BTk[j]; }
            }
            if(accum) reti[k] = accum;
        }
        ret[i] = reti;
    }
    return ret;
}

numeric.sdotMV = function dotMV(A,x) {
    var p = A.length, Ai, i,j;
    var ret = Array(p), accum;
    for(i=p-1;i>=0;i--) {
        Ai = A[i];
        accum = 0;
        for(j in Ai) {
            if(!(Ai.hasOwnProperty(j))) continue;
            if(x[j]) accum += Ai[j]*x[j];
        }
        if(accum) ret[i] = accum;
    }
    return ret;
}

numeric.sdotVM = function dotMV(x,A) {
    var i,j,Ai,alpha;
    var ret = [], accum;
    for(i in x) {
        if(!x.hasOwnProperty(i)) continue;
        Ai = A[i];
        alpha = x[i];
        for(j in Ai) {
            if(!Ai.hasOwnProperty(j)) continue;
            if(!ret[j]) { ret[j] = 0; }
            ret[j] += alpha*Ai[j];
        }
    }
    return ret;
}

numeric.sdotVV = function dotVV(x,y) {
    var i,ret=0;
    for(i in x) { if(x[i] && y[i]) ret+= x[i]*y[i]; }
    return ret;
}

numeric.sdot = function dot(A,B) {
    var m = numeric.sdim(A).length, n = numeric.sdim(B).length;
    var k = m*1000+n;
    switch(k) {
    case 0: return A*B;
    case 1001: return numeric.sdotVV(A,B);
    case 2001: return numeric.sdotMV(A,B);
    case 1002: return numeric.sdotVM(A,B);
    case 2002: return numeric.sdotMM(A,B);
    default: throw new Error('numeric.sdot not implemented for tensors of order '+m+' and '+n);
    }
}

numeric.sscatter = function scatter(V) {
    var n = V[0].length, Vij, i, j, m = V.length, A = [], Aj;
    for(i=n-1;i>=0;--i) {
        if(!V[m-1][i]) continue;
        Aj = A;
        for(j=0;j<m-2;j++) {
            Vij = V[j][i];
            if(!Aj[Vij]) Aj[Vij] = [];
            Aj = Aj[Vij];
        }
        Aj[V[j][i]] = V[j+1][i];
    }
    return A;
}

numeric.sgather = function gather(A,ret,k) {
    if(typeof ret === "undefined") ret = [];
    if(typeof k === "undefined") k = [];
    var n,i,Ai;
    n = k.length;
    for(i in A) {
        if(A.hasOwnProperty(i)) {
            k[n] = parseInt(i);
            Ai = A[i];
            if(typeof Ai === "number") {
                if(Ai) {
                    if(ret.length === 0) {
                        for(i=n+1;i>=0;--i) ret[i] = [];
                    }
                    for(i=n;i>=0;--i) ret[i].push(k[i]);
                    ret[n+1].push(Ai);
                }
            } else gather(Ai,ret,k);
        }
    }
    if(k.length>n) k.pop();
    return ret;
}

// 6. Coordinate matrices
numeric.cLU = function LU(A) {
    var I = A[0], J = A[1], V = A[2];
    var p = I.length, m=0, i,j,k,a,b,c;
    for(i=0;i<p;i++) if(I[i]>m) m=I[i];
    m++;
    var L = Array(m), U = Array(m), left = numeric.rep([m],Infinity), right = numeric.rep([m],-Infinity);
    var Ui, Uj,alpha;
    for(k=0;k<p;k++) {
        i = I[k];
        j = J[k];
        if(j<left[i]) left[i] = j;
        if(j>right[i]) right[i] = j;
    }
    for(i=0;i<m-1;i++) { if(right[i] > right[i+1]) right[i+1] = right[i]; }
    for(i=m-1;i>=1;i--) { if(left[i]<left[i-1]) left[i-1] = left[i]; }
    var countL = 0, countU = 0;
    for(i=0;i<m;i++) {
        U[i] = numeric.rep([right[i]-left[i]+1],0);
        L[i] = numeric.rep([i-left[i]],0);
        countL += i-left[i]+1;
        countU += right[i]-i+1;
    }
    for(k=0;k<p;k++) { i = I[k]; U[i][J[k]-left[i]] = V[k]; }
    for(i=0;i<m-1;i++) {
        a = i-left[i];
        Ui = U[i];
        for(j=i+1;left[j]<=i && j<m;j++) {
            b = i-left[j];
            c = right[i]-i;
            Uj = U[j];
            alpha = Uj[b]/Ui[a];
            if(alpha) {
                for(k=1;k<=c;k++) { Uj[k+b] -= alpha*Ui[k+a]; }
                L[j][i-left[j]] = alpha;
            }
        }
    }
    var Ui = [], Uj = [], Uv = [], Li = [], Lj = [], Lv = [];
    var p,q,foo;
    p=0; q=0;
    for(i=0;i<m;i++) {
        a = left[i];
        b = right[i];
        foo = U[i];
        for(j=i;j<=b;j++) {
            if(foo[j-a]) {
                Ui[p] = i;
                Uj[p] = j;
                Uv[p] = foo[j-a];
                p++;
            }
        }
        foo = L[i];
        for(j=a;j<i;j++) {
            if(foo[j-a]) {
                Li[q] = i;
                Lj[q] = j;
                Lv[q] = foo[j-a];
                q++;
            }
        }
        Li[q] = i;
        Lj[q] = i;
        Lv[q] = 1;
        q++;
    }
    return {U:[Ui,Uj,Uv], L:[Li,Lj,Lv]};
};

numeric.cLUsolve = function LUsolve(lu,b) {
    var L = lu.L, U = lu.U, ret = numeric.clone(b);
    var Li = L[0], Lj = L[1], Lv = L[2];
    var Ui = U[0], Uj = U[1], Uv = U[2];
    var p = Ui.length, q = Li.length;
    var m = ret.length,i,j,k;
    k = 0;
    for(i=0;i<m;i++) {
        while(Lj[k] < i) {
            ret[i] -= Lv[k]*ret[Lj[k]];
            k++;
        }
        k++;
    }
    k = p-1;
    for(i=m-1;i>=0;i--) {
        while(Uj[k] > i) {
            ret[i] -= Uv[k]*ret[Uj[k]];
            k--;
        }
        ret[i] /= Uv[k];
        k--;
    }
    return ret;
};

numeric.cgrid = function grid(n,shape) {
    if(typeof n === "number") n = [n,n];
    var ret = numeric.rep(n,-1);
    var i,j,count;
    if(typeof shape !== "function") {
        switch(shape) {
        case 'L':
            shape = function(i,j) { return (i>=n[0]/2 || j<n[1]/2); }
            break;
        default:
            shape = function(i,j) { return true; };
            break;
        }
    }
    count=0;
    for(i=1;i<n[0]-1;i++) for(j=1;j<n[1]-1;j++) 
        if(shape(i,j)) {
            ret[i][j] = count;
            count++;
        }
    return ret;
}

numeric.cdelsq = function delsq(g) {
    var dir = [[-1,0],[0,-1],[0,1],[1,0]];
    var s = numeric.dim(g), m = s[0], n = s[1], i,j,k,p,q;
    var Li = [], Lj = [], Lv = [];
    for(i=1;i<m-1;i++) for(j=1;j<n-1;j++) {
        if(g[i][j]<0) continue;
        for(k=0;k<4;k++) {
            p = i+dir[k][0];
            q = j+dir[k][1];
            if(g[p][q]<0) continue;
            Li.push(g[i][j]);
            Lj.push(g[p][q]);
            Lv.push(-1);
        }
        Li.push(g[i][j]);
        Lj.push(g[i][j]);
        Lv.push(4);
    }
    return [Li,Lj,Lv];
}

numeric.cdotMV = function dotMV(A,x) {
    var ret, Ai = A[0], Aj = A[1], Av = A[2],k,p=Ai.length,N;
    N=0;
    for(k=0;k<p;k++) { if(Ai[k]>N) N = Ai[k]; }
    N++;
    ret = numeric.rep([N],0);
    for(k=0;k<p;k++) { ret[Ai[k]]+=Av[k]*x[Aj[k]]; }
    return ret;
}

// 7. Splines

numeric.Spline = function Spline(x,yl,yr,kl,kr) { this.x = x; this.yl = yl; this.yr = yr; this.kl = kl; this.kr = kr; }
numeric.Spline.prototype._at = function _at(x1,p) {
    var x = this.x;
    var yl = this.yl;
    var yr = this.yr;
    var kl = this.kl;
    var kr = this.kr;
    var x1,a,b,t;
    var add = numeric.add, sub = numeric.sub, mul = numeric.mul;
    a = sub(mul(kl[p],x[p+1]-x[p]),sub(yr[p+1],yl[p]));
    b = add(mul(kr[p+1],x[p]-x[p+1]),sub(yr[p+1],yl[p]));
    t = (x1-x[p])/(x[p+1]-x[p]);
    var s = t*(1-t);
    return add(add(add(mul(1-t,yl[p]),mul(t,yr[p+1])),mul(a,s*(1-t))),mul(b,s*t));
}
numeric.Spline.prototype.at = function at(x0) {
    if(typeof x0 === "number") {
        var x = this.x;
        var n = x.length;
        var p,q,mid,floor = Math.floor,a,b,t;
        p = 0;
        q = n-1;
        while(q-p>1) {
            mid = floor((p+q)/2);
            if(x[mid] <= x0) p = mid;
            else q = mid;
        }
        return this._at(x0,p);
    }
    var n = x0.length, i, ret = Array(n);
    for(i=n-1;i!==-1;--i) ret[i] = this.at(x0[i]);
    return ret;
}
numeric.Spline.prototype.diff = function diff() {
    var x = this.x;
    var yl = this.yl;
    var yr = this.yr;
    var kl = this.kl;
    var kr = this.kr;
    var n = yl.length;
    var i,dx,dy;
    var zl = kl, zr = kr, pl = Array(n), pr = Array(n);
    var add = numeric.add, mul = numeric.mul, div = numeric.div, sub = numeric.sub;
    for(i=n-1;i!==-1;--i) {
        dx = x[i+1]-x[i];
        dy = sub(yr[i+1],yl[i]);
        pl[i] = div(add(mul(dy, 6),mul(kl[i],-4*dx),mul(kr[i+1],-2*dx)),dx*dx);
        pr[i+1] = div(add(mul(dy,-6),mul(kl[i], 2*dx),mul(kr[i+1], 4*dx)),dx*dx);
    }
    return new numeric.Spline(x,zl,zr,pl,pr);
}
numeric.Spline.prototype.roots = function roots() {
    function sqr(x) { return x*x; }
    function heval(y0,y1,k0,k1,x) {
        var A = k0*2-(y1-y0);
        var B = -k1*2+(y1-y0);
        var t = (x+1)*0.5;
        var s = t*(1-t);
        return (1-t)*y0+t*y1+A*s*(1-t)+B*s*t;
    }
    var ret = [];
    var x = this.x, yl = this.yl, yr = this.yr, kl = this.kl, kr = this.kr;
    if(typeof yl[0] === "number") {
        yl = [yl];
        yr = [yr];
        kl = [kl];
        kr = [kr];
    }
    var m = yl.length,n=x.length-1,i,j,k,y,s,t;
    var ai,bi,ci,di, ret = Array(m),ri,k0,k1,y0,y1,A,B,D,dx,cx,stops,z0,z1,zm,t0,t1,tm;
    var sqrt = Math.sqrt;
    for(i=0;i!==m;++i) {
        ai = yl[i];
        bi = yr[i];
        ci = kl[i];
        di = kr[i];
        ri = [];
        for(j=0;j!==n;j++) {
            if(j>0 && bi[j]*ai[j]<0) ri.push(x[j]);
            dx = (x[j+1]-x[j]);
            cx = x[j];
            y0 = ai[j];
            y1 = bi[j+1];
            k0 = ci[j]/dx;
            k1 = di[j+1]/dx;
            D = sqr(k0-k1+3*(y0-y1)) + 12*k1*y0;
            A = k1+3*y0+2*k0-3*y1;
            B = 3*(k1+k0+2*(y0-y1));
            if(D<=0) {
                z0 = A/B;
                if(z0>x[j] && z0<x[j+1]) stops = [x[j],z0,x[j+1]];
                else stops = [x[j],x[j+1]];
            } else {
                z0 = (A-sqrt(D))/B;
                z1 = (A+sqrt(D))/B;
                stops = [x[j]];
                if(z0>x[j] && z0<x[j+1]) stops.push(z0);
                if(z1>x[j] && z1<x[j+1]) stops.push(z1);
                stops.push(x[j+1]);
            }
            t0 = stops[0];
            z0 = this._at(t0,j);
            for(k=0;k<stops.length-1;k++) {
                t1 = stops[k+1];
                z1 = this._at(t1,j);
                if(z0 === 0) {
                    ri.push(t0); 
                    t0 = t1;
                    z0 = z1;
                    continue;
                }
                if(z1 === 0 || z0*z1>0) {
                    t0 = t1;
                    z0 = z1;
                    continue;
                }
                var side = 0;
                while(1) {
                    tm = (z0*t1-z1*t0)/(z0-z1);
                    if(tm <= t0 || tm >= t1) { break; }
                    zm = this._at(tm,j);
                    if(zm*z1>0) {
                        t1 = tm;
                        z1 = zm;
                        if(side === -1) z0*=0.5;
                        side = -1;
                    } else if(zm*z0>0) {
                        t0 = tm;
                        z0 = zm;
                        if(side === 1) z1*=0.5;
                        side = 1;
                    } else break;
                }
                ri.push(tm);
                t0 = stops[k+1];
                z0 = this._at(t0, j);
            }
            if(z1 === 0) ri.push(t1);
        }
        ret[i] = ri;
    }
    if(typeof this.yl[0] === "number") return ret[0];
    return ret;
}
numeric.spline = function spline(x,y,k1,kn) {
    var n = x.length, b = [], dx = [], dy = [];
    var i;
    var sub = numeric.sub,mul = numeric.mul,add = numeric.add;
    for(i=n-2;i>=0;i--) { dx[i] = x[i+1]-x[i]; dy[i] = sub(y[i+1],y[i]); }
    if(typeof k1 === "string" || typeof kn === "string") { 
        k1 = kn = "periodic";
    }
    // Build sparse tridiagonal system
    var T = [[],[],[]];
    switch(typeof k1) {
    case "undefined":
        b[0] = mul(3/(dx[0]*dx[0]),dy[0]);
        T[0].push(0,0);
        T[1].push(0,1);
        T[2].push(2/dx[0],1/dx[0]);
        break;
    case "string":
        b[0] = add(mul(3/(dx[n-2]*dx[n-2]),dy[n-2]),mul(3/(dx[0]*dx[0]),dy[0]));
        T[0].push(0,0,0);
        T[1].push(n-2,0,1);
        T[2].push(1/dx[n-2],2/dx[n-2]+2/dx[0],1/dx[0]);
        break;
    default:
        b[0] = k1;
        T[0].push(0);
        T[1].push(0);
        T[2].push(1);
        break;
    }
    for(i=1;i<n-1;i++) {
        b[i] = add(mul(3/(dx[i-1]*dx[i-1]),dy[i-1]),mul(3/(dx[i]*dx[i]),dy[i]));
        T[0].push(i,i,i);
        T[1].push(i-1,i,i+1);
        T[2].push(1/dx[i-1],2/dx[i-1]+2/dx[i],1/dx[i]);
    }
    switch(typeof kn) {
    case "undefined":
        b[n-1] = mul(3/(dx[n-2]*dx[n-2]),dy[n-2]);
        T[0].push(n-1,n-1);
        T[1].push(n-2,n-1);
        T[2].push(1/dx[n-2],2/dx[n-2]);
        break;
    case "string":
        T[1][T[1].length-1] = 0;
        break;
    default:
        b[n-1] = kn;
        T[0].push(n-1);
        T[1].push(n-1);
        T[2].push(1);
        break;
    }
    if(typeof b[0] !== "number") b = numeric.transpose(b);
    else b = [b];
    var k = Array(b.length);
    if(typeof k1 === "string") {
        for(i=k.length-1;i!==-1;--i) {
            k[i] = numeric.ccsLUPSolve(numeric.ccsLUP(numeric.ccsScatter(T)),b[i]);
            k[i][n-1] = k[i][0];
        }
    } else {
        for(i=k.length-1;i!==-1;--i) {
            k[i] = numeric.cLUsolve(numeric.cLU(T),b[i]);
        }
    }
    if(typeof y[0] === "number") k = k[0];
    else k = numeric.transpose(k);
    return new numeric.Spline(x,y,y,k,k);
}

// 8. FFT
numeric.fftpow2 = function fftpow2(x,y) {
    var n = x.length;
    if(n === 1) return;
    var cos = Math.cos, sin = Math.sin, i,j;
    var xe = Array(n/2), ye = Array(n/2), xo = Array(n/2), yo = Array(n/2);
    j = n/2;
    for(i=n-1;i!==-1;--i) {
        --j;
        xo[j] = x[i];
        yo[j] = y[i];
        --i;
        xe[j] = x[i];
        ye[j] = y[i];
    }
    fftpow2(xe,ye);
    fftpow2(xo,yo);
    j = n/2;
    var t,k = (-6.2831853071795864769252867665590057683943387987502116419/n),ci,si;
    for(i=n-1;i!==-1;--i) {
        --j;
        if(j === -1) j = n/2-1;
        t = k*i;
        ci = cos(t);
        si = sin(t);
        x[i] = xe[j] + ci*xo[j] - si*yo[j];
        y[i] = ye[j] + ci*yo[j] + si*xo[j];
    }
}
numeric._ifftpow2 = function _ifftpow2(x,y) {
    var n = x.length;
    if(n === 1) return;
    var cos = Math.cos, sin = Math.sin, i,j;
    var xe = Array(n/2), ye = Array(n/2), xo = Array(n/2), yo = Array(n/2);
    j = n/2;
    for(i=n-1;i!==-1;--i) {
        --j;
        xo[j] = x[i];
        yo[j] = y[i];
        --i;
        xe[j] = x[i];
        ye[j] = y[i];
    }
    _ifftpow2(xe,ye);
    _ifftpow2(xo,yo);
    j = n/2;
    var t,k = (6.2831853071795864769252867665590057683943387987502116419/n),ci,si;
    for(i=n-1;i!==-1;--i) {
        --j;
        if(j === -1) j = n/2-1;
        t = k*i;
        ci = cos(t);
        si = sin(t);
        x[i] = xe[j] + ci*xo[j] - si*yo[j];
        y[i] = ye[j] + ci*yo[j] + si*xo[j];
    }
}
numeric.ifftpow2 = function ifftpow2(x,y) {
    numeric._ifftpow2(x,y);
    numeric.diveq(x,x.length);
    numeric.diveq(y,y.length);
}
numeric.convpow2 = function convpow2(ax,ay,bx,by) {
    numeric.fftpow2(ax,ay);
    numeric.fftpow2(bx,by);
    var i,n = ax.length,axi,bxi,ayi,byi;
    for(i=n-1;i!==-1;--i) {
        axi = ax[i]; ayi = ay[i]; bxi = bx[i]; byi = by[i];
        ax[i] = axi*bxi-ayi*byi;
        ay[i] = axi*byi+ayi*bxi;
    }
    numeric.ifftpow2(ax,ay);
}
numeric.T.prototype.fft = function fft() {
    var x = this.x, y = this.y;
    var n = x.length, log = Math.log, log2 = log(2),
        p = Math.ceil(log(2*n-1)/log2), m = Math.pow(2,p);
    var cx = numeric.rep([m],0), cy = numeric.rep([m],0), cos = Math.cos, sin = Math.sin;
    var k, c = (-3.141592653589793238462643383279502884197169399375105820/n),t;
    var a = numeric.rep([m],0), b = numeric.rep([m],0),nhalf = Math.floor(n/2);
    for(k=0;k<n;k++) a[k] = x[k];
    if(typeof y !== "undefined") for(k=0;k<n;k++) b[k] = y[k];
    cx[0] = 1;
    for(k=1;k<=m/2;k++) {
        t = c*k*k;
        cx[k] = cos(t);
        cy[k] = sin(t);
        cx[m-k] = cos(t);
        cy[m-k] = sin(t)
    }
    var X = new numeric.T(a,b), Y = new numeric.T(cx,cy);
    X = X.mul(Y);
    numeric.convpow2(X.x,X.y,numeric.clone(Y.x),numeric.neg(Y.y));
    X = X.mul(Y);
    X.x.length = n;
    X.y.length = n;
    return X;
}
numeric.T.prototype.ifft = function ifft() {
    var x = this.x, y = this.y;
    var n = x.length, log = Math.log, log2 = log(2),
        p = Math.ceil(log(2*n-1)/log2), m = Math.pow(2,p);
    var cx = numeric.rep([m],0), cy = numeric.rep([m],0), cos = Math.cos, sin = Math.sin;
    var k, c = (3.141592653589793238462643383279502884197169399375105820/n),t;
    var a = numeric.rep([m],0), b = numeric.rep([m],0),nhalf = Math.floor(n/2);
    for(k=0;k<n;k++) a[k] = x[k];
    if(typeof y !== "undefined") for(k=0;k<n;k++) b[k] = y[k];
    cx[0] = 1;
    for(k=1;k<=m/2;k++) {
        t = c*k*k;
        cx[k] = cos(t);
        cy[k] = sin(t);
        cx[m-k] = cos(t);
        cy[m-k] = sin(t)
    }
    var X = new numeric.T(a,b), Y = new numeric.T(cx,cy);
    X = X.mul(Y);
    numeric.convpow2(X.x,X.y,numeric.clone(Y.x),numeric.neg(Y.y));
    X = X.mul(Y);
    X.x.length = n;
    X.y.length = n;
    return X.div(n);
}

//9. Unconstrained optimization
numeric.gradient = function gradient(f,x) {
    var n = x.length;
    var f0 = f(x);
    if(isNaN(f0)) throw new Error('gradient: f(x) is a NaN!');
    var max = Math.max;
    var i,x0 = numeric.clone(x),f1,f2, J = Array(n);
    var div = numeric.div, sub = numeric.sub,errest,roundoff,max = Math.max,eps = 1e-3,abs = Math.abs, min = Math.min;
    var t0,t1,t2,it=0,d1,d2,N;
    for(i=0;i<n;i++) {
        var h = max(1e-6*f0,1e-8);
        while(1) {
            ++it;
            if(it>20) { throw new Error("Numerical gradient fails"); }
            x0[i] = x[i]+h;
            f1 = f(x0);
            x0[i] = x[i]-h;
            f2 = f(x0);
            x0[i] = x[i];
            if(isNaN(f1) || isNaN(f2)) { h/=16; continue; }
            J[i] = (f1-f2)/(2*h);
            t0 = x[i]-h;
            t1 = x[i];
            t2 = x[i]+h;
            d1 = (f1-f0)/h;
            d2 = (f0-f2)/h;
            N = max(abs(J[i]),abs(f0),abs(f1),abs(f2),abs(t0),abs(t1),abs(t2),1e-8);
            errest = min(max(abs(d1-J[i]),abs(d2-J[i]),abs(d1-d2))/N,h/N);
            if(errest>eps) { h/=16; }
            else break;
            }
    }
    return J;
}

numeric.uncmin = function uncmin(f,x0,tol,gradient,maxit,callback,options) {
    var grad = numeric.gradient;
    if(typeof options === "undefined") { options = {}; }
    if(typeof tol === "undefined") { tol = 1e-8; }
    if(typeof gradient === "undefined") { gradient = function(x) { return grad(f,x); }; }
    if(typeof maxit === "undefined") maxit = 1000;
    x0 = numeric.clone(x0);
    var n = x0.length;
    var f0 = f(x0),f1,df0;
    if(isNaN(f0)) throw new Error('uncmin: f(x0) is a NaN!');
    var max = Math.max, norm2 = numeric.norm2;
    tol = max(tol,numeric.epsilon);
    var step,g0,g1,H1 = options.Hinv || numeric.identity(n);
    var dot = numeric.dot, inv = numeric.inv, sub = numeric.sub, add = numeric.add, ten = numeric.tensor, div = numeric.div, mul = numeric.mul;
    var all = numeric.all, isfinite = numeric.isFinite, neg = numeric.neg;
    var it=0,i,s,x1,y,Hy,Hs,ys,i0,t,nstep,t1,t2;
    var msg = "";
    g0 = gradient(x0);
    while(it<maxit) {
        if(typeof callback === "function") { if(callback(it,x0,f0,g0,H1)) { msg = "Callback returned true"; break; } }
        if(!all(isfinite(g0))) { msg = "Gradient has Infinity or NaN"; break; }
        step = neg(dot(H1,g0));
        if(!all(isfinite(step))) { msg = "Search direction has Infinity or NaN"; break; }
        nstep = norm2(step);
        if(nstep < tol) { msg="Newton step smaller than tol"; break; }
        t = 1;
        df0 = dot(g0,step);
        // line search
        x1 = x0;
        while(it < maxit) {
            if(t*nstep < tol) { break; }
            s = mul(step,t);
            x1 = add(x0,s);
            f1 = f(x1);
            if(f1-f0 >= 0.1*t*df0 || isNaN(f1)) {
                t *= 0.5;
                ++it;
                continue;
            }
            break;
        }
        if(t*nstep < tol) { msg = "Line search step size smaller than tol"; break; }
        if(it === maxit) { msg = "maxit reached during line search"; break; }
        g1 = gradient(x1);
        y = sub(g1,g0);
        ys = dot(y,s);
        Hy = dot(H1,y);
        H1 = sub(add(H1,
                mul(
                        (ys+dot(y,Hy))/(ys*ys),
                        ten(s,s)    )),
                div(add(ten(Hy,s),ten(s,Hy)),ys));
        x0 = x1;
        f0 = f1;
        g0 = g1;
        ++it;
    }
    return {solution: x0, f: f0, gradient: g0, invHessian: H1, iterations:it, message: msg};
}

// 10. Ode solver (Dormand-Prince)
numeric.Dopri = function Dopri(x,y,f,ymid,iterations,msg,events) {
    this.x = x;
    this.y = y;
    this.f = f;
    this.ymid = ymid;
    this.iterations = iterations;
    this.events = events;
    this.message = msg;
}
numeric.Dopri.prototype._at = function _at(xi,j) {
    function sqr(x) { return x*x; }
    var sol = this;
    var xs = sol.x;
    var ys = sol.y;
    var k1 = sol.f;
    var ymid = sol.ymid;
    var n = xs.length;
    var x0,x1,xh,y0,y1,yh,xi;
    var floor = Math.floor,h;
    var c = 0.5;
    var add = numeric.add, mul = numeric.mul,sub = numeric.sub, p,q,w;
    x0 = xs[j];
    x1 = xs[j+1];
    y0 = ys[j];
    y1 = ys[j+1];
    h  = x1-x0;
    xh = x0+c*h;
    yh = ymid[j];
    p = sub(k1[j  ],mul(y0,1/(x0-xh)+2/(x0-x1)));
    q = sub(k1[j+1],mul(y1,1/(x1-xh)+2/(x1-x0)));
    w = [sqr(xi - x1) * (xi - xh) / sqr(x0 - x1) / (x0 - xh),
         sqr(xi - x0) * sqr(xi - x1) / sqr(x0 - xh) / sqr(x1 - xh),
         sqr(xi - x0) * (xi - xh) / sqr(x1 - x0) / (x1 - xh),
         (xi - x0) * sqr(xi - x1) * (xi - xh) / sqr(x0-x1) / (x0 - xh),
         (xi - x1) * sqr(xi - x0) * (xi - xh) / sqr(x0-x1) / (x1 - xh)];
    return add(add(add(add(mul(y0,w[0]),
                           mul(yh,w[1])),
                           mul(y1,w[2])),
                           mul( p,w[3])),
                           mul( q,w[4]));
}
numeric.Dopri.prototype.at = function at(x) {
    var i,j,k,floor = Math.floor;
    if(typeof x !== "number") {
        var n = x.length, ret = Array(n);
        for(i=n-1;i!==-1;--i) {
            ret[i] = this.at(x[i]);
        }
        return ret;
    }
    var x0 = this.x;
    i = 0; j = x0.length-1;
    while(j-i>1) {
        k = floor(0.5*(i+j));
        if(x0[k] <= x) i = k;
        else j = k;
    }
    return this._at(x,i);
}

numeric.dopri = function dopri(x0,x1,y0,f,tol,maxit,event) {
    if(typeof tol === "undefined") { tol = 1e-6; }
    if(typeof maxit === "undefined") { maxit = 1000; }
    var xs = [x0], ys = [y0], k1 = [f(x0,y0)], k2,k3,k4,k5,k6,k7, ymid = [];
    var A2 = 1/5;
    var A3 = [3/40,9/40];
    var A4 = [44/45,-56/15,32/9];
    var A5 = [19372/6561,-25360/2187,64448/6561,-212/729];
    var A6 = [9017/3168,-355/33,46732/5247,49/176,-5103/18656];
    var b = [35/384,0,500/1113,125/192,-2187/6784,11/84];
    var bm = [0.5*6025192743/30085553152,
              0,
              0.5*51252292925/65400821598,
              0.5*-2691868925/45128329728,
              0.5*187940372067/1594534317056,
              0.5*-1776094331/19743644256,
              0.5*11237099/235043384];
    var c = [1/5,3/10,4/5,8/9,1,1];
    var e = [-71/57600,0,71/16695,-71/1920,17253/339200,-22/525,1/40];
    var i = 0,er,j;
    var h = (x1-x0)/10;
    var it = 0;
    var add = numeric.add, mul = numeric.mul, y1,erinf;
    var max = Math.max, min = Math.min, abs = Math.abs, norminf = numeric.norminf,pow = Math.pow;
    var any = numeric.any, lt = numeric.lt, and = numeric.and, sub = numeric.sub;
    var e0, e1, ev;
    var ret = new numeric.Dopri(xs,ys,k1,ymid,-1,"");
    if(typeof event === "function") e0 = event(x0,y0);
    while(x0<x1 && it<maxit) {
        ++it;
        if(x0+h>x1) h = x1-x0;
        k2 = f(x0+c[0]*h,                add(y0,mul(   A2*h,k1[i])));
        k3 = f(x0+c[1]*h,            add(add(y0,mul(A3[0]*h,k1[i])),mul(A3[1]*h,k2)));
        k4 = f(x0+c[2]*h,        add(add(add(y0,mul(A4[0]*h,k1[i])),mul(A4[1]*h,k2)),mul(A4[2]*h,k3)));
        k5 = f(x0+c[3]*h,    add(add(add(add(y0,mul(A5[0]*h,k1[i])),mul(A5[1]*h,k2)),mul(A5[2]*h,k3)),mul(A5[3]*h,k4)));
        k6 = f(x0+c[4]*h,add(add(add(add(add(y0,mul(A6[0]*h,k1[i])),mul(A6[1]*h,k2)),mul(A6[2]*h,k3)),mul(A6[3]*h,k4)),mul(A6[4]*h,k5)));
        y1 = add(add(add(add(add(y0,mul(k1[i],h*b[0])),mul(k3,h*b[2])),mul(k4,h*b[3])),mul(k5,h*b[4])),mul(k6,h*b[5]));
        k7 = f(x0+h,y1);
        er = add(add(add(add(add(mul(k1[i],h*e[0]),mul(k3,h*e[2])),mul(k4,h*e[3])),mul(k5,h*e[4])),mul(k6,h*e[5])),mul(k7,h*e[6]));
        if(typeof er === "number") erinf = abs(er);
        else erinf = norminf(er);
        if(erinf > tol) { // reject
            h = 0.2*h*pow(tol/erinf,0.25);
            if(x0+h === x0) {
                ret.msg = "Step size became too small";
                break;
            }
            continue;
        }
        ymid[i] = add(add(add(add(add(add(y0,
                mul(k1[i],h*bm[0])),
                mul(k3   ,h*bm[2])),
                mul(k4   ,h*bm[3])),
                mul(k5   ,h*bm[4])),
                mul(k6   ,h*bm[5])),
                mul(k7   ,h*bm[6]));
        ++i;
        xs[i] = x0+h;
        ys[i] = y1;
        k1[i] = k7;
        if(typeof event === "function") {
            var yi,xl = x0,xr = x0+0.5*h,xi;
            e1 = event(xr,ymid[i-1]);
            ev = and(lt(e0,0),lt(0,e1));
            if(!any(ev)) { xl = xr; xr = x0+h; e0 = e1; e1 = event(xr,y1); ev = and(lt(e0,0),lt(0,e1)); }
            if(any(ev)) {
                var xc, yc, en,ei;
                var side=0, sl = 1.0, sr = 1.0;
                while(1) {
                    if(typeof e0 === "number") xi = (sr*e1*xl-sl*e0*xr)/(sr*e1-sl*e0);
                    else {
                        xi = xr;
                        for(j=e0.length-1;j!==-1;--j) {
                            if(e0[j]<0 && e1[j]>0) xi = min(xi,(sr*e1[j]*xl-sl*e0[j]*xr)/(sr*e1[j]-sl*e0[j]));
                        }
                    }
                    if(xi <= xl || xi >= xr) break;
                    yi = ret._at(xi, i-1);
                    ei = event(xi,yi);
                    en = and(lt(e0,0),lt(0,ei));
                    if(any(en)) {
                        xr = xi;
                        e1 = ei;
                        ev = en;
                        sr = 1.0;
                        if(side === -1) sl *= 0.5;
                        else sl = 1.0;
                        side = -1;
                    } else {
                        xl = xi;
                        e0 = ei;
                        sl = 1.0;
                        if(side === 1) sr *= 0.5;
                        else sr = 1.0;
                        side = 1;
                    }
                }
                y1 = ret._at(0.5*(x0+xi),i-1);
                ret.f[i] = f(xi,yi);
                ret.x[i] = xi;
                ret.y[i] = yi;
                ret.ymid[i-1] = y1;
                ret.events = ev;
                ret.iterations = it;
                return ret;
            }
        }
        x0 += h;
        y0 = y1;
        e0 = e1;
        h = min(0.8*h*pow(tol/erinf,0.25),4*h);
    }
    ret.iterations = it;
    return ret;
}

// 11. Ax = b
numeric.LU = function(A, fast) {
  fast = fast || false;

  var abs = Math.abs;
  var i, j, k, absAjk, Akk, Ak, Pk, Ai;
  var max;
  var n = A.length, n1 = n-1;
  var P = new Array(n);
  if(!fast) A = numeric.clone(A);

  for (k = 0; k < n; ++k) {
    Pk = k;
    Ak = A[k];
    max = abs(Ak[k]);
    for (j = k + 1; j < n; ++j) {
      absAjk = abs(A[j][k]);
      if (max < absAjk) {
        max = absAjk;
        Pk = j;
      }
    }
    P[k] = Pk;

    if (Pk != k) {
      A[k] = A[Pk];
      A[Pk] = Ak;
      Ak = A[k];
    }

    Akk = Ak[k];

    for (i = k + 1; i < n; ++i) {
      A[i][k] /= Akk;
    }

    for (i = k + 1; i < n; ++i) {
      Ai = A[i];
      for (j = k + 1; j < n1; ++j) {
        Ai[j] -= Ai[k] * Ak[j];
        ++j;
        Ai[j] -= Ai[k] * Ak[j];
      }
      if(j===n1) Ai[j] -= Ai[k] * Ak[j];
    }
  }

  return {
    LU: A,
    P:  P
  };
}

numeric.LUsolve = function LUsolve(LUP, b) {
  var i, j;
  var LU = LUP.LU;
  var n   = LU.length;
  var x = numeric.clone(b);
  var P   = LUP.P;
  var Pi, LUi, LUii, tmp;

  for (i=n-1;i!==-1;--i) x[i] = b[i];
  for (i = 0; i < n; ++i) {
    Pi = P[i];
    if (P[i] !== i) {
      tmp = x[i];
      x[i] = x[Pi];
      x[Pi] = tmp;
    }

    LUi = LU[i];
    for (j = 0; j < i; ++j) {
      x[i] -= x[j] * LUi[j];
    }
  }

  for (i = n - 1; i >= 0; --i) {
    LUi = LU[i];
    for (j = i + 1; j < n; ++j) {
      x[i] -= x[j] * LUi[j];
    }

    x[i] /= LUi[i];
  }

  return x;
}

numeric.solve = function solve(A,b,fast) { return numeric.LUsolve(numeric.LU(A,fast), b); }

// 12. Linear programming
numeric.echelonize = function echelonize(A) {
    var s = numeric.dim(A), m = s[0], n = s[1];
    var I = numeric.identity(m);
    var P = Array(m);
    var i,j,k,l,Ai,Ii,Z,a;
    var abs = Math.abs;
    var diveq = numeric.diveq;
    A = numeric.clone(A);
    for(i=0;i<m;++i) {
        k = 0;
        Ai = A[i];
        Ii = I[i];
        for(j=1;j<n;++j) if(abs(Ai[k])<abs(Ai[j])) k=j;
        P[i] = k;
        diveq(Ii,Ai[k]);
        diveq(Ai,Ai[k]);
        for(j=0;j<m;++j) if(j!==i) {
            Z = A[j]; a = Z[k];
            for(l=n-1;l!==-1;--l) Z[l] -= Ai[l]*a;
            Z = I[j];
            for(l=m-1;l!==-1;--l) Z[l] -= Ii[l]*a;
        }
    }
    return {I:I, A:A, P:P};
}

numeric.__solveLP = function __solveLP(c,A,b,tol,maxit,x,flag) {
    var sum = numeric.sum, log = numeric.log, mul = numeric.mul, sub = numeric.sub, dot = numeric.dot, div = numeric.div, add = numeric.add;
    var m = c.length, n = b.length,y;
    var unbounded = false, cb,i0=0;
    var alpha = 1.0;
    var f0,df0,AT = numeric.transpose(A), svd = numeric.svd,transpose = numeric.transpose,leq = numeric.leq, sqrt = Math.sqrt, abs = Math.abs;
    var muleq = numeric.muleq;
    var norm = numeric.norminf, any = numeric.any,min = Math.min;
    var all = numeric.all, gt = numeric.gt;
    var p = Array(m), A0 = Array(n),e=numeric.rep([n],1), H;
    var solve = numeric.solve, z = sub(b,dot(A,x)),count;
    var dotcc = dot(c,c);
    var g;
    for(count=i0;count<maxit;++count) {
        var i,j,d;
        for(i=n-1;i!==-1;--i) A0[i] = div(A[i],z[i]);
        var A1 = transpose(A0);
        for(i=m-1;i!==-1;--i) p[i] = (/*x[i]+*/sum(A1[i]));
        alpha = 0.25*abs(dotcc/dot(c,p));
        var a1 = 100*sqrt(dotcc/dot(p,p));
        if(!isFinite(alpha) || alpha>a1) alpha = a1;
        g = add(c,mul(alpha,p));
        H = dot(A1,A0);
        for(i=m-1;i!==-1;--i) H[i][i] += 1;
        d = solve(H,div(g,alpha),true);
        var t0 = div(z,dot(A,d));
        var t = 1.0;
        for(i=n-1;i!==-1;--i) if(t0[i]<0) t = min(t,-0.999*t0[i]);
        y = sub(x,mul(d,t));
        z = sub(b,dot(A,y));
        if(!all(gt(z,0))) return { solution: x, message: "", iterations: count };
        x = y;
        if(alpha<tol) return { solution: y, message: "", iterations: count };
        if(flag) {
            var s = dot(c,g), Ag = dot(A,g);
            unbounded = true;
            for(i=n-1;i!==-1;--i) if(s*Ag[i]<0) { unbounded = false; break; }
        } else {
            if(x[m-1]>=0) unbounded = false;
            else unbounded = true;
        }
        if(unbounded) return { solution: y, message: "Unbounded", iterations: count };
    }
    return { solution: x, message: "maximum iteration count exceeded", iterations:count };
}

numeric._solveLP = function _solveLP(c,A,b,tol,maxit) {
    var m = c.length, n = b.length,y;
    var sum = numeric.sum, log = numeric.log, mul = numeric.mul, sub = numeric.sub, dot = numeric.dot, div = numeric.div, add = numeric.add;
    var c0 = numeric.rep([m],0).concat([1]);
    var J = numeric.rep([n,1],-1);
    var A0 = numeric.blockMatrix([[A                   ,   J  ]]);
    var b0 = b;
    var y = numeric.rep([m],0).concat(Math.max(0,numeric.sup(numeric.neg(b)))+1);
    var x0 = numeric.__solveLP(c0,A0,b0,tol,maxit,y,false);
    var x = numeric.clone(x0.solution);
    x.length = m;
    var foo = numeric.inf(sub(b,dot(A,x)));
    if(foo<0) { return { solution: NaN, message: "Infeasible", iterations: x0.iterations }; }
    var ret = numeric.__solveLP(c, A, b, tol, maxit-x0.iterations, x, true);
    ret.iterations += x0.iterations;
    return ret;
};

numeric.solveLP = function solveLP(c,A,b,Aeq,beq,tol,maxit) {
    if(typeof maxit === "undefined") maxit = 1000;
    if(typeof tol === "undefined") tol = numeric.epsilon;
    if(typeof Aeq === "undefined") return numeric._solveLP(c,A,b,tol,maxit);
    var m = Aeq.length, n = Aeq[0].length, o = A.length;
    var B = numeric.echelonize(Aeq);
    var flags = numeric.rep([n],0);
    var P = B.P;
    var Q = [];
    var i;
    for(i=P.length-1;i!==-1;--i) flags[P[i]] = 1;
    for(i=n-1;i!==-1;--i) if(flags[i]===0) Q.push(i);
    var g = numeric.getRange;
    var I = numeric.linspace(0,m-1), J = numeric.linspace(0,o-1);
    var Aeq2 = g(Aeq,I,Q), A1 = g(A,J,P), A2 = g(A,J,Q), dot = numeric.dot, sub = numeric.sub;
    var A3 = dot(A1,B.I);
    var A4 = sub(A2,dot(A3,Aeq2)), b4 = sub(b,dot(A3,beq));
    var c1 = Array(P.length), c2 = Array(Q.length);
    for(i=P.length-1;i!==-1;--i) c1[i] = c[P[i]];
    for(i=Q.length-1;i!==-1;--i) c2[i] = c[Q[i]];
    var c4 = sub(c2,dot(c1,dot(B.I,Aeq2)));
    var S = numeric._solveLP(c4,A4,b4,tol,maxit);
    var x2 = S.solution;
    if(x2!==x2) return S;
    var x1 = dot(B.I,sub(beq,dot(Aeq2,x2)));
    var x = Array(c.length);
    for(i=P.length-1;i!==-1;--i) x[P[i]] = x1[i];
    for(i=Q.length-1;i!==-1;--i) x[Q[i]] = x2[i];
    return { solution: x, message:S.message, iterations: S.iterations };
}

numeric.MPStoLP = function MPStoLP(MPS) {
    if(MPS instanceof String) { MPS.split('\n'); }
    var state = 0;
    var states = ['Initial state','NAME','ROWS','COLUMNS','RHS','BOUNDS','ENDATA'];
    var n = MPS.length;
    var i,j,z,N=0,rows = {}, sign = [], rl = 0, vars = {}, nv = 0;
    var name;
    var c = [], A = [], b = [];
    function err(e) { throw new Error('MPStoLP: '+e+'\nLine '+i+': '+MPS[i]+'\nCurrent state: '+states[state]+'\n'); }
    for(i=0;i<n;++i) {
        z = MPS[i];
        var w0 = z.match(/\S*/g);
        var w = [];
        for(j=0;j<w0.length;++j) if(w0[j]!=="") w.push(w0[j]);
        if(w.length === 0) continue;
        for(j=0;j<states.length;++j) if(z.substr(0,states[j].length) === states[j]) break;
        if(j<states.length) {
            state = j;
            if(j===1) { name = w[1]; }
            if(j===6) return { name:name, c:c, A:numeric.transpose(A), b:b, rows:rows, vars:vars };
            continue;
        }
        switch(state) {
        case 0: case 1: err('Unexpected line');
        case 2: 
            switch(w[0]) {
            case 'N': if(N===0) N = w[1]; else err('Two or more N rows'); break;
            case 'L': rows[w[1]] = rl; sign[rl] = 1; b[rl] = 0; ++rl; break;
            case 'G': rows[w[1]] = rl; sign[rl] = -1;b[rl] = 0; ++rl; break;
            case 'E': rows[w[1]] = rl; sign[rl] = 0;b[rl] = 0; ++rl; break;
            default: err('Parse error '+numeric.prettyPrint(w));
            }
            break;
        case 3:
            if(!vars.hasOwnProperty(w[0])) { vars[w[0]] = nv; c[nv] = 0; A[nv] = numeric.rep([rl],0); ++nv; }
            var p = vars[w[0]];
            for(j=1;j<w.length;j+=2) {
                if(w[j] === N) { c[p] = parseFloat(w[j+1]); continue; }
                var q = rows[w[j]];
                A[p][q] = (sign[q]<0?-1:1)*parseFloat(w[j+1]);
            }
            break;
        case 4:
            for(j=1;j<w.length;j+=2) b[rows[w[j]]] = (sign[rows[w[j]]]<0?-1:1)*parseFloat(w[j+1]);
            break;
        case 5: /*FIXME*/ break;
        case 6: err('Internal error');
        }
    }
    err('Reached end of file without ENDATA');
}
// seedrandom.js version 2.0.
// Author: David Bau 4/2/2011
//
// Defines a method Math.seedrandom() that, when called, substitutes
// an explicitly seeded RC4-based algorithm for Math.random().  Also
// supports automatic seeding from local or network sources of entropy.
//
// Usage:
//
//   <script src=http://davidbau.com/encode/seedrandom-min.js></script>
//
//   Math.seedrandom('yipee'); Sets Math.random to a function that is
//                             initialized using the given explicit seed.
//
//   Math.seedrandom();        Sets Math.random to a function that is
//                             seeded using the current time, dom state,
//                             and other accumulated local entropy.
//                             The generated seed string is returned.
//
//   Math.seedrandom('yowza', true);
//                             Seeds using the given explicit seed mixed
//                             together with accumulated entropy.
//
//   <script src="http://bit.ly/srandom-512"></script>
//                             Seeds using physical random bits downloaded
//                             from random.org.
//
//   <script src="https://jsonlib.appspot.com/urandom?callback=Math.seedrandom">
//   </script>                 Seeds using urandom bits from call.jsonlib.com,
//                             which is faster than random.org.
//
// Examples:
//
//   Math.seedrandom("hello");            // Use "hello" as the seed.
//   document.write(Math.random());       // Always 0.5463663768140734
//   document.write(Math.random());       // Always 0.43973793770592234
//   var rng1 = Math.random;              // Remember the current prng.
//
//   var autoseed = Math.seedrandom();    // New prng with an automatic seed.
//   document.write(Math.random());       // Pretty much unpredictable.
//
//   Math.random = rng1;                  // Continue "hello" prng sequence.
//   document.write(Math.random());       // Always 0.554769432473455
//
//   Math.seedrandom(autoseed);           // Restart at the previous seed.
//   document.write(Math.random());       // Repeat the 'unpredictable' value.
//
// Notes:
//
// Each time seedrandom('arg') is called, entropy from the passed seed
// is accumulated in a pool to help generate future seeds for the
// zero-argument form of Math.seedrandom, so entropy can be injected over
// time by calling seedrandom with explicit data repeatedly.
//
// On speed - This javascript implementation of Math.random() is about
// 3-10x slower than the built-in Math.random() because it is not native
// code, but this is typically fast enough anyway.  Seeding is more expensive,
// especially if you use auto-seeding.  Some details (timings on Chrome 4):
//
// Our Math.random()            - avg less than 0.002 milliseconds per call
// seedrandom('explicit')       - avg less than 0.5 milliseconds per call
// seedrandom('explicit', true) - avg less than 2 milliseconds per call
// seedrandom()                 - avg about 38 milliseconds per call
//
// LICENSE (BSD):
//
// Copyright 2010 David Bau, all rights reserved.
//
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are met:
// 
//   1. Redistributions of source code must retain the above copyright
//      notice, this list of conditions and the following disclaimer.
//
//   2. Redistributions in binary form must reproduce the above copyright
//      notice, this list of conditions and the following disclaimer in the
//      documentation and/or other materials provided with the distribution.
// 
//   3. Neither the name of this module nor the names of its contributors may
//      be used to endorse or promote products derived from this software
//      without specific prior written permission.
// 
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
// "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
// LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
// A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
// OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
// LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
// DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
// THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
// OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
/**
 * All code is in an anonymous closure to keep the global namespace clean.
 *
 * @param {number=} overflow 
 * @param {number=} startdenom
 */

// Patched by Seb so that seedrandom.js does not pollute the Math object.
// My tests suggest that doing Math.trouble = 1 makes Math lookups about 5%
// slower.
numeric.seedrandom = { pow:Math.pow, random:Math.random };

(function (pool, math, width, chunks, significance, overflow, startdenom) {


//
// seedrandom()
// This is the seedrandom function described above.
//
math['seedrandom'] = function seedrandom(seed, use_entropy) {
  var key = [];
  var arc4;

  // Flatten the seed string or build one from local entropy if needed.
  seed = mixkey(flatten(
    use_entropy ? [seed, pool] :
    arguments.length ? seed :
    [new Date().getTime(), pool, window], 3), key);

  // Use the seed to initialize an ARC4 generator.
  arc4 = new ARC4(key);

  // Mix the randomness into accumulated entropy.
  mixkey(arc4.S, pool);

  // Override Math.random

  // This function returns a random double in [0, 1) that contains
  // randomness in every bit of the mantissa of the IEEE 754 value.

  math['random'] = function random() {  // Closure to return a random double:
    var n = arc4.g(chunks);             // Start with a numerator n < 2 ^ 48
    var d = startdenom;                 //   and denominator d = 2 ^ 48.
    var x = 0;                          //   and no 'extra last byte'.
    while (n < significance) {          // Fill up all significant digits by
      n = (n + x) * width;              //   shifting numerator and
      d *= width;                       //   denominator and generating a
      x = arc4.g(1);                    //   new least-significant-byte.
    }
    while (n >= overflow) {             // To avoid rounding up, before adding
      n /= 2;                           //   last byte, shift everything
      d /= 2;                           //   right using integer math until
      x >>>= 1;                         //   we have exactly the desired bits.
    }
    return (n + x) / d;                 // Form the number within [0, 1).
  };

  // Return the seed that was used
  return seed;
};

//
// ARC4
//
// An ARC4 implementation.  The constructor takes a key in the form of
// an array of at most (width) integers that should be 0 <= x < (width).
//
// The g(count) method returns a pseudorandom integer that concatenates
// the next (count) outputs from ARC4.  Its return value is a number x
// that is in the range 0 <= x < (width ^ count).
//
/** @constructor */
function ARC4(key) {
  var t, u, me = this, keylen = key.length;
  var i = 0, j = me.i = me.j = me.m = 0;
  me.S = [];
  me.c = [];

  // The empty key [] is treated as [0].
  if (!keylen) { key = [keylen++]; }

  // Set up S using the standard key scheduling algorithm.
  while (i < width) { me.S[i] = i++; }
  for (i = 0; i < width; i++) {
    t = me.S[i];
    j = lowbits(j + t + key[i % keylen]);
    u = me.S[j];
    me.S[i] = u;
    me.S[j] = t;
  }

  // The "g" method returns the next (count) outputs as one number.
  me.g = function getnext(count) {
    var s = me.S;
    var i = lowbits(me.i + 1); var t = s[i];
    var j = lowbits(me.j + t); var u = s[j];
    s[i] = u;
    s[j] = t;
    var r = s[lowbits(t + u)];
    while (--count) {
      i = lowbits(i + 1); t = s[i];
      j = lowbits(j + t); u = s[j];
      s[i] = u;
      s[j] = t;
      r = r * width + s[lowbits(t + u)];
    }
    me.i = i;
    me.j = j;
    return r;
  };
  // For robust unpredictability discard an initial batch of values.
  // See http://www.rsa.com/rsalabs/node.asp?id=2009
  me.g(width);
}

//
// flatten()
// Converts an object tree to nested arrays of strings.
//
/** @param {Object=} result 
  * @param {string=} prop
  * @param {string=} typ */
function flatten(obj, depth, result, prop, typ) {
  result = [];
  typ = typeof(obj);
  if (depth && typ == 'object') {
    for (prop in obj) {
      if (prop.indexOf('S') < 5) {    // Avoid FF3 bug (local/sessionStorage)
        try { result.push(flatten(obj[prop], depth - 1)); } catch (e) {}
      }
    }
  }
  return (result.length ? result : obj + (typ != 'string' ? '\0' : ''));
}

//
// mixkey()
// Mixes a string seed into a key that is an array of integers, and
// returns a shortened string seed that is equivalent to the result key.
//
/** @param {number=} smear 
  * @param {number=} j */
function mixkey(seed, key, smear, j) {
  seed += '';                         // Ensure the seed is a string
  smear = 0;
  for (j = 0; j < seed.length; j++) {
    key[lowbits(j)] =
      lowbits((smear ^= key[lowbits(j)] * 19) + seed.charCodeAt(j));
  }
  seed = '';
  for (j in key) { seed += String.fromCharCode(key[j]); }
  return seed;
}

//
// lowbits()
// A quick "n mod width" for width a power of 2.
//
function lowbits(n) { return n & (width - 1); }

//
// The following constants are related to IEEE 754 limits.
//
startdenom = math.pow(width, chunks);
significance = math.pow(2, significance);
overflow = significance * 2;

//
// When seedrandom.js is loaded, we immediately mix a few bits
// from the built-in RNG into the entropy pool.  Because we do
// not want to intefere with determinstic PRNG state later,
// seedrandom will not call math.random on its own again after
// initialization.
//
mixkey(math.random(), pool);

// End anonymous scope, and pass initial values.
}(
  [],   // pool: entropy pool starts empty
  numeric.seedrandom, // math: package containing random, pow, and seedrandom
  256,  // width: each RC4 output is 0 <= x < 256
  6,    // chunks: at least six RC4 outputs for each double
  52    // significance: there are 52 significant digits in a double
  ));
/* This file is a slightly modified version of quadprog.js from Alberto Santini.
 * It has been slightly modified by Sébastien Loisel to make sure that it handles
 * 0-based Arrays instead of 1-based Arrays.
 * License is in resources/LICENSE.quadprog */
(function(exports) {

function base0to1(A) {
    if(typeof A !== "object") { return A; }
    var ret = [], i,n=A.length;
    for(i=0;i<n;i++) ret[i+1] = base0to1(A[i]);
    return ret;
}
function base1to0(A) {
    if(typeof A !== "object") { return A; }
    var ret = [], i,n=A.length;
    for(i=1;i<n;i++) ret[i-1] = base1to0(A[i]);
    return ret;
}

function dpori(a, lda, n) {
    var i, j, k, kp1, t;

    for (k = 1; k <= n; k = k + 1) {
        a[k][k] = 1 / a[k][k];
        t = -a[k][k];
        //~ dscal(k - 1, t, a[1][k], 1);
        for (i = 1; i < k; i = i + 1) {
            a[i][k] = t * a[i][k];
        }

        kp1 = k + 1;
        if (n < kp1) {
            break;
        }
        for (j = kp1; j <= n; j = j + 1) {
            t = a[k][j];
            a[k][j] = 0;
            //~ daxpy(k, t, a[1][k], 1, a[1][j], 1);
            for (i = 1; i <= k; i = i + 1) {
                a[i][j] = a[i][j] + (t * a[i][k]);
            }
        }
    }

}

function dposl(a, lda, n, b) {
    var i, k, kb, t;

    for (k = 1; k <= n; k = k + 1) {
        //~ t = ddot(k - 1, a[1][k], 1, b[1], 1);
        t = 0;
        for (i = 1; i < k; i = i + 1) {
            t = t + (a[i][k] * b[i]);
        }

        b[k] = (b[k] - t) / a[k][k];
    }

    for (kb = 1; kb <= n; kb = kb + 1) {
        k = n + 1 - kb;
        b[k] = b[k] / a[k][k];
        t = -b[k];
        //~ daxpy(k - 1, t, a[1][k], 1, b[1], 1);
        for (i = 1; i < k; i = i + 1) {
            b[i] = b[i] + (t * a[i][k]);
        }
    }
}

function dpofa(a, lda, n, info) {
    var i, j, jm1, k, t, s;

    for (j = 1; j <= n; j = j + 1) {
        info[1] = j;
        s = 0;
        jm1 = j - 1;
        if (jm1 < 1) {
            s = a[j][j] - s;
            if (s <= 0) {
                break;
            }
            a[j][j] = Math.sqrt(s);
        } else {
            for (k = 1; k <= jm1; k = k + 1) {
                //~ t = a[k][j] - ddot(k - 1, a[1][k], 1, a[1][j], 1);
                t = a[k][j];
                for (i = 1; i < k; i = i + 1) {
                    t = t - (a[i][j] * a[i][k]);
                }
                t = t / a[k][k];
                a[k][j] = t;
                s = s + t * t;
            }
            s = a[j][j] - s;
            if (s <= 0) {
                break;
            }
            a[j][j] = Math.sqrt(s);
        }
        info[1] = 0;
    }
}

function qpgen2(dmat, dvec, fddmat, n, sol, crval, amat,
    bvec, fdamat, q, meq, iact, nact, iter, work, ierr) {

    var i, j, l, l1, info, it1, iwzv, iwrv, iwrm, iwsv, iwuv, nvl, r, iwnbv,
        temp, sum, t1, tt, gc, gs, nu,
        t1inf, t2min,
        vsmall, tmpa, tmpb,
        go;

    r = Math.min(n, q);
    l = 2 * n + (r * (r + 5)) / 2 + 2 * q + 1;

    vsmall = 1.0e-60;
    do {
        vsmall = vsmall + vsmall;
        tmpa = 1 + 0.1 * vsmall;
        tmpb = 1 + 0.2 * vsmall;
    } while (tmpa <= 1 || tmpb <= 1);

    for (i = 1; i <= n; i = i + 1) {
        work[i] = dvec[i];
    }
    for (i = n + 1; i <= l; i = i + 1) {
        work[i] = 0;
    }
    for (i = 1; i <= q; i = i + 1) {
        iact[i] = 0;
    }

    info = [];

    if (ierr[1] === 0) {
        dpofa(dmat, fddmat, n, info);
        if (info[1] !== 0) {
            ierr[1] = 2;
            return;
        }
        dposl(dmat, fddmat, n, dvec);
        dpori(dmat, fddmat, n);
    } else {
        for (j = 1; j <= n; j = j + 1) {
            sol[j] = 0;
            for (i = 1; i <= j; i = i + 1) {
                sol[j] = sol[j] + dmat[i][j] * dvec[i];
            }
        }
        for (j = 1; j <= n; j = j + 1) {
            dvec[j] = 0;
            for (i = j; i <= n; i = i + 1) {
                dvec[j] = dvec[j] + dmat[j][i] * sol[i];
            }
        }
    }

    crval[1] = 0;
    for (j = 1; j <= n; j = j + 1) {
        sol[j] = dvec[j];
        crval[1] = crval[1] + work[j] * sol[j];
        work[j] = 0;
        for (i = j + 1; i <= n; i = i + 1) {
            dmat[i][j] = 0;
        }
    }
    crval[1] = -crval[1] / 2;
    ierr[1] = 0;

    iwzv = n;
    iwrv = iwzv + n;
    iwuv = iwrv + r;
    iwrm = iwuv + r + 1;
    iwsv = iwrm + (r * (r + 1)) / 2;
    iwnbv = iwsv + q;

    for (i = 1; i <= q; i = i + 1) {
        sum = 0;
        for (j = 1; j <= n; j = j + 1) {
            sum = sum + amat[j][i] * amat[j][i];
        }
        work[iwnbv + i] = Math.sqrt(sum);
    }
    nact = 0;
    iter[1] = 0;
    iter[2] = 0;

    function fn_goto_50() {
        iter[1] = iter[1] + 1;

        l = iwsv;
        for (i = 1; i <= q; i = i + 1) {
            l = l + 1;
            sum = -bvec[i];
            for (j = 1; j <= n; j = j + 1) {
                sum = sum + amat[j][i] * sol[j];
            }
            if (Math.abs(sum) < vsmall) {
                sum = 0;
            }
            if (i > meq) {
                work[l] = sum;
            } else {
                work[l] = -Math.abs(sum);
                if (sum > 0) {
                    for (j = 1; j <= n; j = j + 1) {
                        amat[j][i] = -amat[j][i];
                    }
                    bvec[i] = -bvec[i];
                }
            }
        }

        for (i = 1; i <= nact; i = i + 1) {
            work[iwsv + iact[i]] = 0;
        }

        nvl = 0;
        temp = 0;
        for (i = 1; i <= q; i = i + 1) {
            if (work[iwsv + i] < temp * work[iwnbv + i]) {
                nvl = i;
                temp = work[iwsv + i] / work[iwnbv + i];
            }
        }
        if (nvl === 0) {
            return 999;
        }

        return 0;
    }

    function fn_goto_55() {
        for (i = 1; i <= n; i = i + 1) {
            sum = 0;
            for (j = 1; j <= n; j = j + 1) {
                sum = sum + dmat[j][i] * amat[j][nvl];
            }
            work[i] = sum;
        }

        l1 = iwzv;
        for (i = 1; i <= n; i = i + 1) {
            work[l1 + i] = 0;
        }
        for (j = nact + 1; j <= n; j = j + 1) {
            for (i = 1; i <= n; i = i + 1) {
                work[l1 + i] = work[l1 + i] + dmat[i][j] * work[j];
            }
        }

        t1inf = true;
        for (i = nact; i >= 1; i = i - 1) {
            sum = work[i];
            l = iwrm + (i * (i + 3)) / 2;
            l1 = l - i;
            for (j = i + 1; j <= nact; j = j + 1) {
                sum = sum - work[l] * work[iwrv + j];
                l = l + j;
            }
            sum = sum / work[l1];
            work[iwrv + i] = sum;
            if (iact[i] < meq) {
                // continue;
                break;
            }
            if (sum < 0) {
                // continue;
                break;
            }
            t1inf = false;
            it1 = i;
        }

        if (!t1inf) {
            t1 = work[iwuv + it1] / work[iwrv + it1];
            for (i = 1; i <= nact; i = i + 1) {
                if (iact[i] < meq) {
                    // continue;
                    break;
                }
                if (work[iwrv + i] < 0) {
                    // continue;
                    break;
                }
                temp = work[iwuv + i] / work[iwrv + i];
                if (temp < t1) {
                    t1 = temp;
                    it1 = i;
                }
            }
        }

        sum = 0;
        for (i = iwzv + 1; i <= iwzv + n; i = i + 1) {
            sum = sum + work[i] * work[i];
        }
        if (Math.abs(sum) <= vsmall) {
            if (t1inf) {
                ierr[1] = 1;
                // GOTO 999
                return 999;
            } else {
                for (i = 1; i <= nact; i = i + 1) {
                    work[iwuv + i] = work[iwuv + i] - t1 * work[iwrv + i];
                }
                work[iwuv + nact + 1] = work[iwuv + nact + 1] + t1;
                // GOTO 700
                return 700;
            }
        } else {
            sum = 0;
            for (i = 1; i <= n; i = i + 1) {
                sum = sum + work[iwzv + i] * amat[i][nvl];
            }
            tt = -work[iwsv + nvl] / sum;
            t2min = true;
            if (!t1inf) {
                if (t1 < tt) {
                    tt = t1;
                    t2min = false;
                }
            }

            for (i = 1; i <= n; i = i + 1) {
                sol[i] = sol[i] + tt * work[iwzv + i];
                if (Math.abs(sol[i]) < vsmall) {
                    sol[i] = 0;
                }
            }

            crval[1] = crval[1] + tt * sum * (tt / 2 + work[iwuv + nact + 1]);
            for (i = 1; i <= nact; i = i + 1) {
                work[iwuv + i] = work[iwuv + i] - tt * work[iwrv + i];
            }
            work[iwuv + nact + 1] = work[iwuv + nact + 1] + tt;

            if (t2min) {
                nact = nact + 1;
                iact[nact] = nvl;

                l = iwrm + ((nact - 1) * nact) / 2 + 1;
                for (i = 1; i <= nact - 1; i = i + 1) {
                    work[l] = work[i];
                    l = l + 1;
                }

                if (nact === n) {
                    work[l] = work[n];
                } else {
                    for (i = n; i >= nact + 1; i = i - 1) {
                        if (work[i] === 0) {
                            // continue;
                            break;
                        }
                        gc = Math.max(Math.abs(work[i - 1]), Math.abs(work[i]));
                        gs = Math.min(Math.abs(work[i - 1]), Math.abs(work[i]));
                        if (work[i - 1] >= 0) {
                            temp = Math.abs(gc * Math.sqrt(1 + gs * gs / (gc * gc)));
                        } else {
                            temp = -Math.abs(gc * Math.sqrt(1 + gs * gs / (gc * gc)));
                        }
                        gc = work[i - 1] / temp;
                        gs = work[i] / temp;

                        if (gc === 1) {
                            // continue;
                            break;
                        }
                        if (gc === 0) {
                            work[i - 1] = gs * temp;
                            for (j = 1; j <= n; j = j + 1) {
                                temp = dmat[j][i - 1];
                                dmat[j][i - 1] = dmat[j][i];
                                dmat[j][i] = temp;
                            }
                        } else {
                            work[i - 1] = temp;
                            nu = gs / (1 + gc);
                            for (j = 1; j <= n; j = j + 1) {
                                temp = gc * dmat[j][i - 1] + gs * dmat[j][i];
                                dmat[j][i] = nu * (dmat[j][i - 1] + temp) - dmat[j][i];
                                dmat[j][i - 1] = temp;

                            }
                        }
                    }
                    work[l] = work[nact];
                }
            } else {
                sum = -bvec[nvl];
                for (j = 1; j <= n; j = j + 1) {
                    sum = sum + sol[j] * amat[j][nvl];
                }
                if (nvl > meq) {
                    work[iwsv + nvl] = sum;
                } else {
                    work[iwsv + nvl] = -Math.abs(sum);
                    if (sum > 0) {
                        for (j = 1; j <= n; j = j + 1) {
                            amat[j][nvl] = -amat[j][nvl];
                        }
                        bvec[nvl] = -bvec[nvl];
                    }
                }
                // GOTO 700
                return 700;
            }
        }

        return 0;
    }

    function fn_goto_797() {
        l = iwrm + (it1 * (it1 + 1)) / 2 + 1;
        l1 = l + it1;
        if (work[l1] === 0) {
            // GOTO 798
            return 798;
        }
        gc = Math.max(Math.abs(work[l1 - 1]), Math.abs(work[l1]));
        gs = Math.min(Math.abs(work[l1 - 1]), Math.abs(work[l1]));
        if (work[l1 - 1] >= 0) {
            temp = Math.abs(gc * Math.sqrt(1 + gs * gs / (gc * gc)));
        } else {
            temp = -Math.abs(gc * Math.sqrt(1 + gs * gs / (gc * gc)));
        }
        gc = work[l1 - 1] / temp;
        gs = work[l1] / temp;

        if (gc === 1) {
            // GOTO 798
            return 798;
        }
        if (gc === 0) {
            for (i = it1 + 1; i <= nact; i = i + 1) {
                temp = work[l1 - 1];
                work[l1 - 1] = work[l1];
                work[l1] = temp;
                l1 = l1 + i;
            }
            for (i = 1; i <= n; i = i + 1) {
                temp = dmat[i][it1];
                dmat[i][it1] = dmat[i][it1 + 1];
                dmat[i][it1 + 1] = temp;
            }
        } else {
            nu = gs / (1 + gc);
            for (i = it1 + 1; i <= nact; i = i + 1) {
                temp = gc * work[l1 - 1] + gs * work[l1];
                work[l1] = nu * (work[l1 - 1] + temp) - work[l1];
                work[l1 - 1] = temp;
                l1 = l1 + i;
            }
            for (i = 1; i <= n; i = i + 1) {
                temp = gc * dmat[i][it1] + gs * dmat[i][it1 + 1];
                dmat[i][it1 + 1] = nu * (dmat[i][it1] + temp) - dmat[i][it1 + 1];
                dmat[i][it1] = temp;
            }
        }

        return 0;
    }

    function fn_goto_798() {
        l1 = l - it1;
        for (i = 1; i <= it1; i = i + 1) {
            work[l1] = work[l];
            l = l + 1;
            l1 = l1 + 1;
        }

        work[iwuv + it1] = work[iwuv + it1 + 1];
        iact[it1] = iact[it1 + 1];
        it1 = it1 + 1;
        if (it1 < nact) {
            // GOTO 797
            return 797;
        }

        return 0;
    }

    function fn_goto_799() {
        work[iwuv + nact] = work[iwuv + nact + 1];
        work[iwuv + nact + 1] = 0;
        iact[nact] = 0;
        nact = nact - 1;
        iter[2] = iter[2] + 1;

        return 0;
    }

    go = 0;
    while (true) {
        go = fn_goto_50();
        if (go === 999) {
            return;
        }
        while (true) {
            go = fn_goto_55();
            if (go === 0) {
                break;
            }
            if (go === 999) {
                return;
            }
            if (go === 700) {
                if (it1 === nact) {
                    fn_goto_799();
                } else {
                    while (true) {
                        fn_goto_797();
                        go = fn_goto_798();
                        if (go !== 797) {
                            break;
                        }
                    }
                    fn_goto_799();
                }
            }
        }
    }

}

function solveQP(Dmat, dvec, Amat, bvec, meq, factorized) {
    Dmat = base0to1(Dmat);
    dvec = base0to1(dvec);
    Amat = base0to1(Amat);
    var i, n, q,
        nact, r,
        crval = [], iact = [], sol = [], work = [], iter = [],
        message;

    meq = meq || 0;
    factorized = factorized ? base0to1(factorized) : [undefined, 0];
    bvec = bvec ? base0to1(bvec) : [];

    // In Fortran the array index starts from 1
    n = Dmat.length - 1;
    q = Amat[1].length - 1;

    if (!bvec) {
        for (i = 1; i <= q; i = i + 1) {
            bvec[i] = 0;
        }
    }
    for (i = 1; i <= q; i = i + 1) {
        iact[i] = 0;
    }
    nact = 0;
    r = Math.min(n, q);
    for (i = 1; i <= n; i = i + 1) {
        sol[i] = 0;
    }
    crval[1] = 0;
    for (i = 1; i <= (2 * n + (r * (r + 5)) / 2 + 2 * q + 1); i = i + 1) {
        work[i] = 0;
    }
    for (i = 1; i <= 2; i = i + 1) {
        iter[i] = 0;
    }

    qpgen2(Dmat, dvec, n, n, sol, crval, Amat,
        bvec, n, q, meq, iact, nact, iter, work, factorized);

    message = "";
    if (factorized[1] === 1) {
        message = "constraints are inconsistent, no solution!";
    }
    if (factorized[1] === 2) {
        message = "matrix D in quadratic function is not positive definite!";
    }

    return {
        solution: base1to0(sol),
        value: base1to0(crval),
        unconstrained_solution: base1to0(dvec),
        iterations: base1to0(iter),
        iact: base1to0(iact),
        message: message
    };
}
exports.solveQP = solveQP;
}(numeric));
/*
Shanti Rao sent me this routine by private email. I had to modify it
slightly to work on Arrays instead of using a Matrix object.
It is apparently translated from http://stitchpanorama.sourceforge.net/Python/svd.py
*/

numeric.svd= function svd(A) {
    var temp;
//Compute the thin SVD from G. H. Golub and C. Reinsch, Numer. Math. 14, 403-420 (1970)
	var prec= numeric.epsilon; //Math.pow(2,-52) // assumes double prec
	var tolerance= 1.e-64/prec;
	var itmax= 50;
	var c=0;
	var i=0;
	var j=0;
	var k=0;
	var l=0;
	
	var u= numeric.clone(A);
	var m= u.length;
	
	var n= u[0].length;
	
	if (m < n) throw "Need more rows than columns"
	
	var e = new Array(n);
	var q = new Array(n);
	for (i=0; i<n; i++) e[i] = q[i] = 0.0;
	var v = numeric.rep([n,n],0);
//	v.zero();
	
 	function pythag(a,b)
 	{
		a = Math.abs(a)
		b = Math.abs(b)
		if (a > b)
			return a*Math.sqrt(1.0+(b*b/a/a))
		else if (b == 0.0) 
			return a
		return b*Math.sqrt(1.0+(a*a/b/b))
	}

	//Householder's reduction to bidiagonal form

	var f= 0.0;
	var g= 0.0;
	var h= 0.0;
	var x= 0.0;
	var y= 0.0;
	var z= 0.0;
	var s= 0.0;
	
	for (i=0; i < n; i++)
	{	
		e[i]= g;
		s= 0.0;
		l= i+1;
		for (j=i; j < m; j++) 
			s += (u[j][i]*u[j][i]);
		if (s <= tolerance)
			g= 0.0;
		else
		{	
			f= u[i][i];
			g= Math.sqrt(s);
			if (f >= 0.0) g= -g;
			h= f*g-s
			u[i][i]=f-g;
			for (j=l; j < n; j++)
			{
				s= 0.0
				for (k=i; k < m; k++) 
					s += u[k][i]*u[k][j]
				f= s/h
				for (k=i; k < m; k++) 
					u[k][j]+=f*u[k][i]
			}
		}
		q[i]= g
		s= 0.0
		for (j=l; j < n; j++) 
			s= s + u[i][j]*u[i][j]
		if (s <= tolerance)
			g= 0.0
		else
		{	
			f= u[i][i+1]
			g= Math.sqrt(s)
			if (f >= 0.0) g= -g
			h= f*g - s
			u[i][i+1] = f-g;
			for (j=l; j < n; j++) e[j]= u[i][j]/h
			for (j=l; j < m; j++)
			{	
				s=0.0
				for (k=l; k < n; k++) 
					s += (u[j][k]*u[i][k])
				for (k=l; k < n; k++) 
					u[j][k]+=s*e[k]
			}	
		}
		y= Math.abs(q[i])+Math.abs(e[i])
		if (y>x) 
			x=y
	}
	
	// accumulation of right hand gtransformations
	for (i=n-1; i != -1; i+= -1)
	{	
		if (g != 0.0)
		{
		 	h= g*u[i][i+1]
			for (j=l; j < n; j++) 
				v[j][i]=u[i][j]/h
			for (j=l; j < n; j++)
			{	
				s=0.0
				for (k=l; k < n; k++) 
					s += u[i][k]*v[k][j]
				for (k=l; k < n; k++) 
					v[k][j]+=(s*v[k][i])
			}	
		}
		for (j=l; j < n; j++)
		{
			v[i][j] = 0;
			v[j][i] = 0;
		}
		v[i][i] = 1;
		g= e[i]
		l= i
	}
	
	// accumulation of left hand transformations
	for (i=n-1; i != -1; i+= -1)
	{	
		l= i+1
		g= q[i]
		for (j=l; j < n; j++) 
			u[i][j] = 0;
		if (g != 0.0)
		{
			h= u[i][i]*g
			for (j=l; j < n; j++)
			{
				s=0.0
				for (k=l; k < m; k++) s += u[k][i]*u[k][j];
				f= s/h
				for (k=i; k < m; k++) u[k][j]+=f*u[k][i];
			}
			for (j=i; j < m; j++) u[j][i] = u[j][i]/g;
		}
		else
			for (j=i; j < m; j++) u[j][i] = 0;
		u[i][i] += 1;
	}
	
	// diagonalization of the bidiagonal form
	prec= prec*x
	for (k=n-1; k != -1; k+= -1)
	{
		for (var iteration=0; iteration < itmax; iteration++)
		{	// test f splitting
			var test_convergence = false
			for (l=k; l != -1; l+= -1)
			{	
				if (Math.abs(e[l]) <= prec)
				{	test_convergence= true
					break 
				}
				if (Math.abs(q[l-1]) <= prec)
					break 
			}
			if (!test_convergence)
			{	// cancellation of e[l] if l>0
				c= 0.0
				s= 1.0
				var l1= l-1
				for (i =l; i<k+1; i++)
				{	
					f= s*e[i]
					e[i]= c*e[i]
					if (Math.abs(f) <= prec)
						break
					g= q[i]
					h= pythag(f,g)
					q[i]= h
					c= g/h
					s= -f/h
					for (j=0; j < m; j++)
					{	
						y= u[j][l1]
						z= u[j][i]
						u[j][l1] =  y*c+(z*s)
						u[j][i] = -y*s+(z*c)
					} 
				}	
			}
			// test f convergence
			z= q[k]
			if (l== k)
			{	//convergence
				if (z<0.0)
				{	//q[k] is made non-negative
					q[k]= -z
					for (j=0; j < n; j++)
						v[j][k] = -v[j][k]
				}
				break  //break out of iteration loop and move on to next k value
			}
			if (iteration >= itmax-1)
				throw 'Error: no convergence.'
			// shift from bottom 2x2 minor
			x= q[l]
			y= q[k-1]
			g= e[k-1]
			h= e[k]
			f= ((y-z)*(y+z)+(g-h)*(g+h))/(2.0*h*y)
			g= pythag(f,1.0)
			if (f < 0.0)
				f= ((x-z)*(x+z)+h*(y/(f-g)-h))/x
			else
				f= ((x-z)*(x+z)+h*(y/(f+g)-h))/x
			// next QR transformation
			c= 1.0
			s= 1.0
			for (i=l+1; i< k+1; i++)
			{	
				g= e[i]
				y= q[i]
				h= s*g
				g= c*g
				z= pythag(f,h)
				e[i-1]= z
				c= f/z
				s= h/z
				f= x*c+g*s
				g= -x*s+g*c
				h= y*s
				y= y*c
				for (j=0; j < n; j++)
				{	
					x= v[j][i-1]
					z= v[j][i]
					v[j][i-1] = x*c+z*s
					v[j][i] = -x*s+z*c
				}
				z= pythag(f,h)
				q[i-1]= z
				c= f/z
				s= h/z
				f= c*g+s*y
				x= -s*g+c*y
				for (j=0; j < m; j++)
				{
					y= u[j][i-1]
					z= u[j][i]
					u[j][i-1] = y*c+z*s
					u[j][i] = -y*s+z*c
				}
			}
			e[l]= 0.0
			e[k]= f
			q[k]= x
		} 
	}
		
	//vt= transpose(v)
	//return (u,q,vt)
	for (i=0;i<q.length; i++) 
	  if (q[i] < prec) q[i] = 0
	  
	//sort eigenvalues	
	for (i=0; i< n; i++)
	{	 
	//writeln(q)
	 for (j=i-1; j >= 0; j--)
	 {
	  if (q[j] < q[i])
	  {
	//  writeln(i,'-',j)
	   c = q[j]
	   q[j] = q[i]
	   q[i] = c
	   for(k=0;k<u.length;k++) { temp = u[k][i]; u[k][i] = u[k][j]; u[k][j] = temp; }
	   for(k=0;k<v.length;k++) { temp = v[k][i]; v[k][i] = v[k][j]; v[k][j] = temp; }
//	   u.swapCols(i,j)
//	   v.swapCols(i,j)
	   i = j	   
	  }
	 }	
	}
	
	return {U:u,S:q,V:v}
};


}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],35:[function(require,module,exports){
////////////////////////////////////////////////////////////////////
//  Archontis Politis
//  archontis.politis@aalto.fi
////////////////////////////////////////////////////////////////////
//
//  A JavaScript library that implements 
//  the spherical harmonic transform for real spherical harmonics
//  and some useful transformations in the spherical harmonic domain
//
//  The library uses the numeric.js library for matrix operations
//  http://www.numericjs.com/
//
////////////////////////////////////////////////////////////////////

var numeric = require('numeric');


// forwardSHT implements the forward SHT on data defined over the sphere
var forwardSHT = function (N, data, CART_OR_SPH, DIRECT_OR_PINV) {
    
    var Ndirs = data.length, Nsh = (N+1)*(N+1);
    var invY_N;
    var mag = [,];
    if (Nsh>Ndirs)  {
        console.log("The SHT degree is too high for the number of data points")
    }
    
    // Convert cartesian to spherical if needed
    if (CART_OR_SPH==0) data = convertCart2Sph(data);
    for (var  i=0; i<data.length; i++) {
        mag[i] = data[i][2];
    }
    // SH sampling matrix
    Y_N = computeRealSH(N, data);
    // Direct SHT
    if (DIRECT_OR_PINV==0) {
        invY_N = numeric.mul(1/Ndirs,Y_N);
    }
    else {
        invY_N = pinv_direct(numeric.transpose(Y_N));
    }
    // Perform SHT
    var coeffs = numeric.dotMV(invY_N, mag);
    return coeffs;
}

// inverseSHT implements the inverse SHT from SH coefficients
var inverseSHT = function (coeffs, aziElev) {
    
    var aziElevR = aziElev;
    var N = Math.sqrt(coeffs.length)-1;
    // SH sampling matrix
    var Y_N = computeRealSH(N, aziElev);
    // reconstruction
    var data = numeric.dotVM(coeffs, Y_N);
    // gather in data matrix
    for (var i=0; i<aziElev.length; i++) {
        aziElevR[i][2] = data[i];
    }
    return aziElevR;
}

// xxxxxxxxxxxxxxxxxx
var print2Darray = function (array2D) {
    for (var q=0; q<array2D.length; q++) console.log(array2D[q]);
}

// convertCart2Sph converts arrays of cartesian vectors to spherical coordinates
var convertCart2Sph = function (xyz, OMIT_MAG) {
    
    var azi, elev, r;
    var aziElevR = new Array(xyz.length);
    
    for (var i=0; i<xyz.length; i++) {
        azi = Math.atan2( xyz[i][1], xyz[i][0] );
        elev = Math.atan2( xyz[i][2], Math.sqrt(xyz[i][0]*xyz[i][0] + xyz[i][1]*xyz[i][1]) );
        if (OMIT_MAG==1) {
            aziElevR[i] = [azi,elev];
        }
        else {
            r = Math.sqrt(xyz[i][0]*xyz[i][0] + xyz[i][1]*xyz[i][1] + xyz[i][2]*xyz[i][2]);
            aziElevR[i] = [azi,elev,r];
        }
    }
    return aziElevR;
}

// convertSph2Cart converts arrays of spherical coordinates to cartesian
var convertSph2Cart = function (aziElevR) {
    
    var x,y,z;
    var xyz = new Array(aziElevR.length);
    
    for (var i=0; i<aziElevR.length; i++) {
        x = Math.cos(aziElevR[i][0])*Math.cos(aziElevR[i][1]);
        y = Math.sin(aziElevR[i][0])*Math.cos(aziElevR[i][1]);
        z = Math.sin(aziElevR[i][1]);
        if (aziElevR[0].length==2) xyz[i] = [x,y,z];
        else if (aziElevR[0].length==3) xyz[i] = [aziElevR[i][2]*x,aziElevR[i][2]*y,aziElevR[i][2]*z];
    }
    return xyz;
}

// computeRealSH computes real spherical harmonics up to order N
var computeRealSH = function (N, data) {
    
    var azi = new Array(data.length);
    var elev = new Array(data.length);
    
    for (var i=0; i<data.length; i++) {
        azi[i] = data[i][0];
        elev[i] = data[i][1];
    }
    
    var factorials = new Array(2*N+1);
    var Ndirs = azi.length;
    var Nsh = (N+1)*(N+1);
    var leg_n_minus1 = 0;
    var leg_n_minus2 = 0;
    var leg_n;
    var sinel = numeric.sin(elev);
    var index_n = 0;
    var Y_N = new Array(Nsh);
    var Nn0, Nnm;
    var cosmazi, sinmazi;
    
    // precompute factorials
    for (var i = 0; i < 2*N+1; i++) factorials[i] = factorial(i);
    
    for (var n = 0; n<N+1; n++) {
        if (n==0) {
            var temp0 = new Array(azi.length);
            temp0.fill(1);
            Y_N[n] = temp0;
            index_n = 1;
        }
        else {
            leg_n = recurseLegendrePoly(n, sinel, leg_n_minus1, leg_n_minus2);
            Nn0 = Math.sqrt(2*n+1);
            for (var m = 0; m<n+1; m++) {
                if (m==0) Y_N[index_n+n] = numeric.mul(Nn0,leg_n[m]);
                else {
                    Nnm = Nn0*Math.sqrt( 2 * factorials[n-m]/factorials[n+m] );
                    cosmazi = numeric.cos(numeric.mul(m,azi));
                    sinmazi = numeric.sin(numeric.mul(m,azi));
                    Y_N[index_n+n-m] = numeric.mul(Nnm, numeric.mul(leg_n[m], sinmazi));
                    Y_N[index_n+n+m] = numeric.mul(Nnm, numeric.mul(leg_n[m], cosmazi));
                }
            }
            index_n = index_n+2*n+1;
        }
        leg_n_minus2 = leg_n_minus1;
        leg_n_minus1 = leg_n;
    }
    
    return Y_N;
}

// factorial compute factorial
var factorial = function (n) {
    if (n === 0) return 1;
    return n * factorial(n - 1);
}

// recurseLegendrePoly computes associated Legendre functions recursively
var recurseLegendrePoly = function (n, x, Pnm_minus1, Pnm_minus2) {
    
    var Pnm = new Array(n+1);
    switch(n) {
        case 1:
            var x2 = numeric.mul(x,x);
            var P10 = x;
            var P11 = numeric.sqrt(numeric.sub(1,x2));
            Pnm[0] = P10;
            Pnm[1] = P11;
            break;
        case 2:
            var x2 = numeric.mul(x,x);
            var P20 = numeric.mul(3,x2);
            P20 = numeric.sub(P20,1);
            P20 = numeric.div(P20,2);
            var P21 = numeric.sub(1,x2);
            P21 = numeric.sqrt(P21);
            P21 = numeric.mul(3,P21);
            P21 = numeric.mul(P21,x);
            var P22 = numeric.sub(1,x2);
            P22 = numeric.mul(3,P22);
            Pnm[0] = P20;
            Pnm[1] = P21;
            Pnm[2] = P22;
            break;
        default:
            var x2 = numeric.mul(x,x);
            var one_min_x2 = numeric.sub(1,x2);
            // last term m=n
            var k = 2*n-1;
            var dfact_k = 1;
            if ((k % 2) == 0) {
                for (var kk=1; kk<k/2+1; kk++) dfact_k = dfact_k*2*kk;
            }
            else {
                for (var kk=1; kk<(k+1)/2+1; kk++) dfact_k = dfact_k*(2*kk-1);
            }
            Pnm[n] = numeric.mul(dfact_k, numeric.pow(one_min_x2, n/2));
            // before last term
            Pnm[n-1] = numeric.mul(2*n-1, numeric.mul(x, Pnm_minus1[n-1])); // P_{n(n-1)} = (2*n-1)*x*P_{(n-1)(n-1)}
            // three term recursence for the rest
            for (var m=0; m<n-1; m++) {
                var temp1 = numeric.mul( 2*n-1, numeric.mul(x, Pnm_minus1[m]) );
                var temp2 = numeric.mul( n+m-1, Pnm_minus2[m] );
                Pnm[m] = numeric.div( numeric.sub(temp1, temp2), n-m); // P_l = ( (2l-1)xP_(l-1) - (l+m-1)P_(l-2) )/(l-m)
            }
    }
    return Pnm;
}

// pinv_svd computes the pseudo-inverse using SVD
var pinv_svd = function (A) {
    var z = numeric.svd(A), foo = z.S[0];
    var U = z.U, S = z.S, V = z.V;
    var m = A.length, n = A[0].length, tol = Math.max(m,n)*numeric.epsilon*foo,M = S.length;
    var Sinv = new Array(M);
    for(var i=M-1;i!==-1;i--) { if(S[i]>tol) Sinv[i] = 1/S[i]; else Sinv[i] = 0; }
    return numeric.dot(numeric.dot(V,numeric.diag(Sinv)),numeric.transpose(U))
}

// pinv_direct computes the left pseudo-inverse
var pinv_direct = function (A) {
    var AT = numeric.transpose(A);
    return numeric.dot(numeric.inv(numeric.dot(AT,A)),AT);
}

// computes rotation matrices for real spherical harmonics
var getSHrotMtx = function (Rxyz, L) {
    
    var Nsh = (L+1)*(L+1);
    // allocate total rotation matrix
    var R = numeric.rep([Nsh,Nsh],0);
    
    // initialize zeroth and first band rotation matrices for recursion
    // Rxyz = [Rxx Rxy Rxz
    //         Ryx Ryy Ryz
    //         Rzx Rzy Rzz]
    //
    // zeroth-band (l=0) is invariant to rotation
    R[0][0] = 1;
    
    // the first band (l=1) is directly related to the rotation matrix
    var R_1 = numeric.rep([3,3],0);
    R_1[0][0] = Rxyz[1][1];
    R_1[0][1] = Rxyz[1][2];
    R_1[0][2] = Rxyz[1][0];
    R_1[1][0] = Rxyz[2][1];
    R_1[1][1] = Rxyz[2][2];
    R_1[1][2] = Rxyz[2][0];
    R_1[2][0] = Rxyz[0][1];
    R_1[2][1] = Rxyz[0][2];
    R_1[2][2] = Rxyz[0][0];
    
    R = numeric.setBlock(R, [1,1], [3,3], R_1);
    var R_lm1 = R_1;
    
    // compute rotation matrix of each subsequent band recursively
    var band_idx = 3;
    for (var l=2; l<L+1; l++) {
        
        var R_l = numeric.rep([(2*l+1),(2*l+1)],0);
        for (var m=-l; m<l+1; m++) {
            for (var n=-l; n<l+1; n++) {
                // compute u,v,w terms of Eq.8.1 (Table I)
                var d, denom, u, v, w;
                if (m==0) d = 1;
                else d = 0; // the delta function d_m0
                if (Math.abs(n)==l) denom = (2*l)*(2*l-1);
                else denom = (l*l-n*n);
                
                u = Math.sqrt((l*l-m*m)/denom);
                v = Math.sqrt((1+d)*(l+Math.abs(m)-1)*(l+Math.abs(m))/denom)*(1-2*d)*0.5;
                w = Math.sqrt((l-Math.abs(m)-1)*(l-Math.abs(m))/denom)*(1-d)*(-0.5);
                
                // computes Eq.8.1
                if (u!=0) u = u*U(l,m,n,R_1,R_lm1);
                if (v!=0) v = v*V(l,m,n,R_1,R_lm1);
                if (w!=0) w = w*W(l,m,n,R_1,R_lm1);
                R_l[m+l][n+l] = u + v + w;
            }
        }
        R = numeric.setBlock(R, [band_idx+1,band_idx+1], [band_idx+2*l+1,band_idx+2*l+1], R_l);
        R_lm1 = R_l;
        band_idx = band_idx + 2*l+1;
    }
    return R;
}

// functions to compute terms U, V, W of Eq.8.1 (Table II)
function U(l,m,n,R_1,R_lm1) {
    
    return P(0,l,m,n,R_1,R_lm1);
}

function V(l,m,n,R_1,R_lm1) {
    
    var p0, p1, ret, d;
    if (m==0) {
        p0 = P(1,l,1,n,R_1,R_lm1);
        p1 = P(-1,l,-1,n,R_1,R_lm1);
        ret = p0+p1;
    }
    else if (m>0) {
        if (m==1) d = 1;
        else d = 0;
        p0 = P(1,l,m-1,n,R_1,R_lm1);
        p1 = P(-1,l,-m+1,n,R_1,R_lm1);
        ret = p0*Math.sqrt(1+d) - p1*(1-d);
    }
    else {
        if (m==-1) d = 1;
        else d = 0;
        p0 = P(1,l,m+1,n,R_1,R_lm1);
        p1 = P(-1,l,-m-1,n,R_1,R_lm1);
        ret = p0*(1-d) + p1*Math.sqrt(1+d);
    }
    return ret;
}

function W(l,m,n,R_1,R_lm1) {
    
    var p0, p1, ret;
    if (m==0) {
        console.error("should not be called");
    }
    else {
        if (m>0) {
            p0 = P(1,l,m+1,n,R_1,R_lm1);
            p1 = P(-1,l,-m-1,n,R_1,R_lm1);
            ret = p0 + p1;
        }
        else {
            p0 = P(1,l,m-1,n,R_1,R_lm1);
            p1 = P(-1,l,-m+1,n,R_1,R_lm1);
            ret = p0 - p1;
        }
    }
    return ret;
}

// function to compute term P of U,V,W (Table II)
function P(i,l,a,b,R_1,R_lm1) {
    
    var ri1, rim1, ri0, ret;
    ri1 = R_1[i+1][1+1];
    rim1 = R_1[i+1][-1+1];
    ri0 = R_1[i+1][0+1];
    
    if (b==-l) {
        ret = ri1*R_lm1[a+l-1][0] + rim1*R_lm1[a+l-1][2*l-2];
    }
    else {
        if (b==l) ret = ri1*R_lm1[a+l-1][2*l-2] - rim1*R_lm1[a+l-1][0];
        else ret = ri0*R_lm1[a+l-1][b+l-1];
    }
    return ret;
}

// yawPitchRoll2Rzyx computes the rotation matrix from ZY'X'' rotation angles
var yawPitchRoll2Rzyx = function (yaw, pitch, roll) {
    
    var Rx, Ry, Rz;
    if (roll == 0) Rx = [[1,0,0],[0,1,0],[0,0,1]];
    else Rx = [[1, 0, 0], [0, Math.cos(roll), Math.sin(roll)], [0, -Math.sin(roll), Math.cos(roll)]];
    if (pitch == 0) Ry = [[1,0,0],[0,1,0],[0,0,1]];
    else Ry = [[Math.cos(pitch), 0, -Math.sin(pitch)], [0, 1, 0], [Math.sin(pitch), 0, Math.cos(pitch)]];
    if (yaw == 0) Rz = [[1,0,0],[0,1,0],[0,0,1]];
    else Rz = [[Math.cos(yaw), Math.sin(yaw), 0], [-Math.sin(yaw), Math.cos(yaw), 0], [0, 0, 1]];
    
    var R = numeric.dotMMsmall(Ry,Rz);
    R = numeric.dotMMsmall(Rx,R);
    return R;
}


// exports
module.exports.forwardSHT = forwardSHT;
module.exports.inverseSHT = inverseSHT;
module.exports.print2Darray = print2Darray;
module.exports.convertCart2Sph = convertCart2Sph;
module.exports.convertSph2Cart = convertSph2Cart;
module.exports.computeRealSH = computeRealSH;
module.exports.factorial = factorial;
module.exports.recurseLegendrePoly = recurseLegendrePoly;
module.exports.pinv_svd = pinv_svd;
module.exports.pinv_direct = pinv_direct;
module.exports.getSHrotMtx = getSHrotMtx;
module.exports.yawPitchRoll2Rzyx = yawPitchRoll2Rzyx;

},{"numeric":34}]},{},[12])(12)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJkaXN0L2FtYmktYmluYXVyYWxEZWNvZGVyLmpzIiwiZGlzdC9hbWJpLWNvbnZlcnRlcnMuanMiLCJkaXN0L2FtYmktaW50ZW5zaXR5QW5hbHlzZXIuanMiLCJkaXN0L2FtYmktbW9ub0VuY29kZXIuanMiLCJkaXN0L2FtYmktb3JkZXJMaW1pdGVyLmpzIiwiZGlzdC9hbWJpLW9yZGVyV2VpZ2h0LmpzIiwiZGlzdC9hbWJpLXBvd2VybWFwQW5hbHlzZXIuanMiLCJkaXN0L2FtYmktc2NlbmVNaXJyb3IuanMiLCJkaXN0L2FtYmktc2NlbmVSb3RhdG9yLmpzIiwiZGlzdC9hbWJpLXZpcnR1YWxNaWMuanMiLCJkaXN0L2hvYS1sb2FkZXIuanMiLCJkaXN0L2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvY29yZS1qcy9vYmplY3QvZGVmaW5lLXByb3BlcnR5LmpzIiwibm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvaGVscGVycy9jbGFzc0NhbGxDaGVjay5qcyIsIm5vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL2hlbHBlcnMvY3JlYXRlQ2xhc3MuanMiLCJub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9ub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L2ZuL29iamVjdC9kZWZpbmUtcHJvcGVydHkuanMiLCJub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9ub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvX2EtZnVuY3Rpb24uanMiLCJub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9ub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvX2FuLW9iamVjdC5qcyIsIm5vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL25vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy9fY29yZS5qcyIsIm5vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL25vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy9fY3R4LmpzIiwibm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvbm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzL19kZXNjcmlwdG9ycy5qcyIsIm5vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL25vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy9fZG9tLWNyZWF0ZS5qcyIsIm5vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL25vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy9fZXhwb3J0LmpzIiwibm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvbm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzL19mYWlscy5qcyIsIm5vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL25vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy9fZ2xvYmFsLmpzIiwibm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvbm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzL19oaWRlLmpzIiwibm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvbm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzL19pZTgtZG9tLWRlZmluZS5qcyIsIm5vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL25vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy9faXMtb2JqZWN0LmpzIiwibm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvbm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzL19vYmplY3QtZHAuanMiLCJub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9ub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvX3Byb3BlcnR5LWRlc2MuanMiLCJub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9ub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvX3RvLXByaW1pdGl2ZS5qcyIsIm5vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL25vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy9lczYub2JqZWN0LmRlZmluZS1wcm9wZXJ0eS5qcyIsIm5vZGVfbW9kdWxlcy9nZXQtZmxvYXQtdGltZS1kb21haW4tZGF0YS9saWIvZ2V0LWZsb2F0LXRpbWUtZG9tYWluLWRhdGEuanMiLCJub2RlX21vZHVsZXMvbnVtZXJpYy9udW1lcmljLTEuMi42LmpzIiwibm9kZV9tb2R1bGVzL3NwaGVyaWNhbC1oYXJtb25pYy10cmFuc2Zvcm0vc3JjL2luZGV4LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lDaUJxQixVO0FBRWpCLHdCQUFZLFFBQVosRUFBc0IsS0FBdEIsRUFBNkI7QUFBQTs7O0FBRXpCLGFBQUssV0FBTCxHQUFtQixLQUFuQjs7QUFFQSxhQUFLLEdBQUwsR0FBVyxRQUFYO0FBQ0EsYUFBSyxLQUFMLEdBQWEsS0FBYjtBQUNBLGFBQUssR0FBTCxHQUFXLENBQUMsUUFBUSxDQUFULEtBQWUsUUFBUSxDQUF2QixDQUFYO0FBQ0EsYUFBSyxVQUFMLEdBQWtCLElBQUksS0FBSixDQUFVLEtBQUssR0FBZixDQUFsQjtBQUNBLGFBQUssY0FBTCxHQUFzQixJQUFJLEtBQUosQ0FBVSxLQUFLLEdBQWYsQ0FBdEI7O0FBRUEsYUFBSyxFQUFMLEdBQVUsS0FBSyxHQUFMLENBQVMscUJBQVQsQ0FBK0IsS0FBSyxHQUFwQyxDQUFWO0FBQ0EsYUFBSyxHQUFMLEdBQVcsS0FBSyxHQUFMLENBQVMsbUJBQVQsQ0FBNkIsQ0FBN0IsQ0FBWDtBQUNBLGFBQUssR0FBTCxDQUFTLGdCQUFULEdBQTRCLFVBQTVCO0FBQ0EsYUFBSyxHQUFMLENBQVMsWUFBVCxHQUF3QixDQUF4Qjs7QUFFQSxhQUFLLE9BQUwsR0FBZSxLQUFL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OztBQ25CQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7O0FDSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNQQTtBQUNBO0FBQ0E7O0FDRkE7QUFDQTtBQUNBOztBQ0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1hBO0FBQ0E7QUFDQTs7O0FDRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ3gwSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gIEFyY2hvbnRpcyBQb2xpdGlzXG4vLyAgYXJjaG9udGlzLnBvbGl0aXNAYWFsdG8uZmlcbi8vICBEYXZpZCBQb2lyaWVyLVF1aW5vdFxuLy8gIGRhdmlwb2lyQGlyY2FtLmZyXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy9cbi8vICBXZWJBdWRpb19IT0EgYSBKYXZhU2NyaXB0IGxpYnJhcnkgZm9yIGhpZ2hlci1vcmRlciBBbWJpc29uaWNzXG4vLyAgVGhlIGxpYnJhcnkgaW1wbGVtZW50cyBXZWIgQXVkaW8gYmxvY2tzIHRoYXQgcGVyZm9ybVxuLy8gIHR5cGljYWwgYW1iaXNvbmljIHByb2Nlc3Npbmcgb3BlcmF0aW9ucyBvbiBhdWRpbyBzaWduYWxzLlxuLy9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vKiBIT0EgQklOQVVSQUwgREVDT0RFUiAqL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgYmluRGVjb2RlciB7XG5cbiAgICBjb25zdHJ1Y3RvcihhdWRpb0N0eCwgb3JkZXIpIHtcblxuICAgICAgICB0aGlzLmluaXRpYWxpemVkID0gZmFsc2U7XG5cbiAgICAgICAgdGhpcy5jdHggPSBhdWRpb0N0eDtcbiAgICAgICAgdGhpcy5vcmRlciA9IG9yZGVyO1xuICAgICAgICB0aGlzLm5DaCA9IChvcmRlciArIDEpICogKG9yZGVyICsgMSk7XG4gICAgICAgIHRoaXMuZGVjRmlsdGVycyA9IG5ldyBBcnJheSh0aGlzLm5DaCk7XG4gICAgICAgIHRoaXMuZGVjRmlsdGVyTm9kZXMgPSBuZXcgQXJyYXkodGhpcy5uQ2gpO1xuICAgICAgICAvLyBpbnB1dCBhbmQgb3V0cHV0IG5vZGVzXG4gICAgICAgIHRoaXMuaW4gPSB0aGlzLmN0eC5jcmVhdGVDaGFubmVsU3BsaXR0ZXIodGhpcy5uQ2gpO1xuICAgICAgICB0aGlzLm91dCA9IHRoaXMuY3R4LmNyZWF0ZUNoYW5uZWxNZXJnZXIoMik7XG4gICAgICAgIHRoaXMub3V0LmNoYW5uZWxDb3VudE1vZGUgPSAnZXhwbGljaXQnO1xuICAgICAgICB0aGlzLm91dC5jaGFubmVsQ291bnQgPSAxO1xuICAgICAgICAvLyBkb3dubWl4aW5nIGdhaW5zIGZvciBsZWZ0IGFuZCByaWdodCBlYXJzXG4gICAgICAgIHRoaXMuZ2Fpbk1pZCA9IHRoaXMuY3R4LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgdGhpcy5nYWluU2lkZSA9IHRoaXMuY3R4LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgdGhpcy5pbnZlcnRTaWRlID0gdGhpcy5jdHguY3JlYXRlR2FpbigpO1xuICAgICAgICB0aGlzLmdhaW5NaWQuZ2Fpbi52YWx1ZSA9IDE7XG4gICAgICAgIHRoaXMuZ2FpblNpZGUuZ2Fpbi52YWx1ZSA9IDE7XG4gICAgICAgIHRoaXMuaW52ZXJ0U2lkZS5nYWluLnZhbHVlID0gLTE7XG4gICAgICAgIC8vIGNvbnZvbHZlciBub2Rlc1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubkNoOyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMuZGVjRmlsdGVyTm9kZXNbaV0gPSB0aGlzLmN0eC5jcmVhdGVDb252b2x2ZXIoKTtcbiAgICAgICAgICAgIHRoaXMuZGVjRmlsdGVyTm9kZXNbaV0ubm9ybWFsaXplID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgLy8gaW5pdGlhbGl6ZSBjb252b2x2ZXJzIHRvIHBsYWluIGNhcmRpb2lkc1xuICAgICAgICB0aGlzLnJlc2V0RmlsdGVycygpO1xuICAgICAgICAvLyBjcmVhdGUgYXVkaW8gY29ubmVjdGlvbnNcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm5DaDsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLmluLmNvbm5lY3QodGhpcy5kZWNGaWx0ZXJOb2Rlc1tpXSwgaSwgMCk7XG4gICAgICAgICAgICB2YXIgbiA9IE1hdGguZmxvb3IoTWF0aC5zcXJ0KGkpKTtcbiAgICAgICAgICAgIHZhciBtID0gaSAtIG4gKiBuIC0gbjtcbiAgICAgICAgICAgIGlmIChtID49IDApIHRoaXMuZGVjRmlsdGVyTm9kZXNbaV0uY29ubmVjdCh0aGlzLmdhaW5NaWQpO1xuICAgICAgICAgICAgZWxzZSB0aGlzLmRlY0ZpbHRlck5vZGVzW2ldLmNvbm5lY3QodGhpcy5nYWluU2lkZSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5nYWluTWlkLmNvbm5lY3QodGhpcy5vdXQsIDAsIDApO1xuICAgICAgICB0aGlzLmdhaW5TaWRlLmNvbm5lY3QodGhpcy5vdXQsIDAsIDApO1xuXG4gICAgICAgIHRoaXMuZ2Fpbk1pZC5jb25uZWN0KHRoaXMub3V0LCAwLCAxKTtcbiAgICAgICAgdGhpcy5nYWluU2lkZS5jb25uZWN0KHRoaXMuaW52ZXJ0U2lkZSwgMCwgMCk7XG4gICAgICAgIHRoaXMuaW52ZXJ0U2lkZS5jb25uZWN0KHRoaXMub3V0LCAwLCAxKTtcblxuICAgICAgICB0aGlzLmluaXRpYWxpemVkID0gdHJ1ZTtcbiAgICB9XG5cbiAgICB1cGRhdGVGaWx0ZXJzKGF1ZGlvQnVmZmVyKSB7XG4gICAgICAgIC8vIGFzc2lnbiBmaWx0ZXJzIHRvIGNvbnZvbHZlcnNcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm5DaDsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLmRlY0ZpbHRlcnNbaV0gPSB0aGlzLmN0eC5jcmVhdGVCdWZmZXIoMSwgYXVkaW9CdWZmZXIubGVuZ3RoLCBhdWRpb0J1ZmZlci5zYW1wbGVSYXRlKTtcbiAgICAgICAgICAgIHRoaXMuZGVjRmlsdGVyc1tpXS5nZXRDaGFubmVsRGF0YSgwKS5zZXQoYXVkaW9CdWZmZXIuZ2V0Q2hhbm5lbERhdGEoaSkpO1xuXG4gICAgICAgICAgICB0aGlzLmRlY0ZpbHRlck5vZGVzW2ldLmJ1ZmZlciA9IHRoaXMuZGVjRmlsdGVyc1tpXTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJlc2V0RmlsdGVycygpIHtcbiAgICAgICAgLy8gb3ZlcndyaXRlIGRlY29kaW5nIGZpbHRlcnMgKHBsYWluIGNhcmRpb2lkIHZpcnR1YWwgbWljcm9waG9uZXMpXG4gICAgICAgIHZhciBjYXJkR2FpbnMgPSBuZXcgQXJyYXkodGhpcy5uQ2gpO1xuICAgICAgICBjYXJkR2FpbnMuZmlsbCgwKTtcbiAgICAgICAgY2FyZEdhaW5zWzBdID0gMC41O1xuICAgICAgICBjYXJkR2FpbnNbMV0gPSAwLjUgLyBNYXRoLnNxcnQoMyk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5uQ2g7IGkrKykge1xuICAgICAgICAgICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICAgICAgICAvLyBUaGlzIHdvcmtzIGZvciBDaHJvbWUgYW5kIEZpcmVmb3g6XG4gICAgICAgICAgICAvLyB0aGlzLmRlY0ZpbHRlcnNbaV0gPSB0aGlzLmN0eC5jcmVhdGVCdWZmZXIoMSwgMSwgdGhpcy5jdHguc2FtcGxlUmF0ZSk7XG4gICAgICAgICAgICAvLyB0aGlzLmRlY0ZpbHRlcnNbaV0uZ2V0Q2hhbm5lbERhdGEoMCkuc2V0KFtjYXJkR2FpbnNbaV1dKTtcbiAgICAgICAgICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgICAgICAgLy8gU2FmYXJpIGZvcmNlcyB1cyB0byB1c2UgdGhpczpcbiAgICAgICAgICAgIHRoaXMuZGVjRmlsdGVyc1tpXSA9IHRoaXMuY3R4LmNyZWF0ZUJ1ZmZlcigxLCA2NCwgdGhpcy5jdHguc2FtcGxlUmF0ZSk7XG4gICAgICAgICAgICAvLyBhbmQgd2lsbCBzZW5kIGdvcmdlb3VzIGNyYW5ja3kgbm9pc2UgYnVyc3RzIGZvciBhbnkgdmFsdWUgYmVsb3cgNjRcbiAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgNjQ7IGorKykge1xuICAgICAgICAgICAgICAgIHRoaXMuZGVjRmlsdGVyc1tpXS5nZXRDaGFubmVsRGF0YSgwKVtqXSA9IDAuMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuZGVjRmlsdGVyc1tpXS5nZXRDaGFubmVsRGF0YSgwKVswXSA9IGNhcmRHYWluc1tpXTtcbiAgICAgICAgICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgICAgICAgdGhpcy5kZWNGaWx0ZXJOb2Rlc1tpXS5idWZmZXIgPSB0aGlzLmRlY0ZpbHRlcnNbaV07XG4gICAgICAgIH1cbiAgICB9XG59XG4iLCIvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gIEFyY2hvbnRpcyBQb2xpdGlzXG4vLyAgYXJjaG9udGlzLnBvbGl0aXNAYWFsdG8uZmlcbi8vICBEYXZpZCBQb2lyaWVyLVF1aW5vdFxuLy8gIGRhdmlwb2lyQGlyY2FtLmZyXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy9cbi8vICBXZWJBdWRpb19IT0EgYSBKYXZhU2NyaXB0IGxpYnJhcnkgZm9yIGhpZ2hlci1vcmRlciBBbWJpc29uaWNzXG4vLyAgVGhlIGxpYnJhcnkgaW1wbGVtZW50cyBXZWIgQXVkaW8gYmxvY2tzIHRoYXQgcGVyZm9ybVxuLy8gIHR5cGljYWwgYW1iaXNvbmljIHByb2Nlc3Npbmcgb3BlcmF0aW9ucyBvbiBhdWRpbyBzaWduYWxzLlxuLy9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vKiBGT0EgQi1GT1JNQVQgVE8gQUNOL04zRCBDT05WRVJURVIgKi9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5leHBvcnQgY2xhc3Mgd3h5ejJhY24ge1xuXG4gICAgY29uc3RydWN0b3IoYXVkaW9DdHgpIHtcblxuICAgICAgICB0aGlzLmN0eCA9IGF1ZGlvQ3R4O1xuICAgICAgICB0aGlzLmluID0gdGhpcy5jdHguY3JlYXRlQ2hhbm5lbFNwbGl0dGVyKDQpO1xuICAgICAgICB0aGlzLm91dCA9IHRoaXMuY3R4LmNyZWF0ZUNoYW5uZWxNZXJnZXIoNCk7XG4gICAgICAgIHRoaXMuZ2FpbnMgPSBuZXcgQXJyYXkoNCk7XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCA0OyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMuZ2FpbnNbaV0gPSB0aGlzLmN0eC5jcmVhdGVHYWluKCk7XG4gICAgICAgICAgICBpZiAoaSA9PSAwKSB0aGlzLmdhaW5zW2ldLmdhaW4udmFsdWUgPSBNYXRoLlNRUlQyO1xuICAgICAgICAgICAgZWxzZSB0aGlzLmdhaW5zW2ldLmdhaW4udmFsdWUgPSBNYXRoLnNxcnQoMyk7XG5cbiAgICAgICAgICAgIHRoaXMuZ2FpbnNbaV0uY29ubmVjdCh0aGlzLm91dCwgMCwgaSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5pbi5jb25uZWN0KHRoaXMuZ2FpbnNbMF0sIDAsIDApO1xuICAgICAgICB0aGlzLmluLmNvbm5lY3QodGhpcy5nYWluc1szXSwgMSwgMCk7XG4gICAgICAgIHRoaXMuaW4uY29ubmVjdCh0aGlzLmdhaW5zWzFdLCAyLCAwKTtcbiAgICAgICAgdGhpcy5pbi5jb25uZWN0KHRoaXMuZ2FpbnNbMl0sIDMsIDApO1xuICAgIH1cbn1cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8qIEFDTi9OM0QgVE8gRk9BIEItRk9STUFUIENPTlZFUlRFUiAqL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbmV4cG9ydCBjbGFzcyBhY24yd3h5eiB7XG5cbiAgICBjb25zdHJ1Y3RvcihhdWRpb0N0eCkge1xuXG4gICAgICAgIHRoaXMuY3R4ID0gYXVkaW9DdHg7XG4gICAgICAgIHRoaXMuaW4gPSB0aGlzLmN0eC5jcmVhdGVDaGFubmVsU3BsaXR0ZXIoNCk7XG4gICAgICAgIHRoaXMub3V0ID0gdGhpcy5jdHguY3JlYXRlQ2hhbm5lbE1lcmdlcig0KTtcbiAgICAgICAgdGhpcy5nYWlucyA9IG5ldyBBcnJheSg0KTtcblxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IDQ7IGkrKykge1xuICAgICAgICAgICAgdGhpcy5nYWluc1tpXSA9IHRoaXMuY3R4LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgICAgIGlmIChpID09IDApIHRoaXMuZ2FpbnNbaV0uZ2Fpbi52YWx1ZSA9IE1hdGguU1FSVDFfMjtcbiAgICAgICAgICAgIGVsc2UgdGhpcy5nYWluc1tpXS5nYWluLnZhbHVlID0gMSAvIE1hdGguc3FydCgzKTtcblxuICAgICAgICAgICAgdGhpcy5nYWluc1tpXS5jb25uZWN0KHRoaXMub3V0LCAwLCBpKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmluLmNvbm5lY3QodGhpcy5nYWluc1swXSwgMCwgMCk7XG4gICAgICAgIHRoaXMuaW4uY29ubmVjdCh0aGlzLmdhaW5zWzJdLCAxLCAwKTtcbiAgICAgICAgdGhpcy5pbi5jb25uZWN0KHRoaXMuZ2FpbnNbM10sIDIsIDApO1xuICAgICAgICB0aGlzLmluLmNvbm5lY3QodGhpcy5nYWluc1sxXSwgMywgMCk7XG4gICAgfVxufVxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vKiBBQ04vU04zRCBUTyBBQ04vTjNEIENPTlZFUlRFUiAqL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbmV4cG9ydCBjbGFzcyBzbjNkMm4zZCB7XG4gICAgXG4gICAgY29uc3RydWN0b3IoYXVkaW9DdHgsIG9yZGVyKSB7XG4gICAgICAgIFxuICAgICAgICB0aGlzLmN0eCA9IGF1ZGlvQ3R4O1xuICAgICAgICB0aGlzLm9yZGVyID0gb3JkZXI7XG4gICAgICAgIHRoaXMubkNoID0gKG9yZGVyICsgMSkgKiAob3JkZXIgKyAxKTtcbiAgICAgICAgdGhpcy5pbiA9IHRoaXMuY3R4LmNyZWF0ZUNoYW5uZWxTcGxpdHRlcih0aGlzLm5DaCk7XG4gICAgICAgIHRoaXMub3V0ID0gdGhpcy5jdHguY3JlYXRlQ2hhbm5lbE1lcmdlcih0aGlzLm5DaCk7XG4gICAgICAgIHRoaXMuZ2FpbnMgPSBuZXcgQXJyYXkodGhpcy5uQ2gpO1xuICAgICAgICBcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm5DaDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgbiA9IE1hdGguZmxvb3IoTWF0aC5zcXJ0KGkpKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdGhpcy5nYWluc1tpXSA9IHRoaXMuY3R4LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgICAgIHRoaXMuZ2FpbnNbaV0uZ2Fpbi52YWx1ZSA9IE1hdGguc3FydCgyKm4rMSk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHRoaXMuaW4uY29ubmVjdCh0aGlzLmdhaW5zW2ldLCBpLCAwKTtcbiAgICAgICAgICAgIHRoaXMuZ2FpbnNbaV0uY29ubmVjdCh0aGlzLm91dCwgMCwgaSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vKiBBQ04vTjNEIFRPIEFDTi9TTjNEIENPTlZFUlRFUiAqL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbmV4cG9ydCBjbGFzcyBuM2Qyc24zZCB7XG4gICAgXG4gICAgY29uc3RydWN0b3IoYXVkaW9DdHgsIG9yZGVyKSB7XG4gICAgICAgIFxuICAgICAgICB0aGlzLmN0eCA9IGF1ZGlvQ3R4O1xuICAgICAgICB0aGlzLm9yZGVyID0gb3JkZXI7XG4gICAgICAgIHRoaXMubkNoID0gKG9yZGVyICsgMSkgKiAob3JkZXIgKyAxKTtcbiAgICAgICAgdGhpcy5pbiA9IHRoaXMuY3R4LmNyZWF0ZUNoYW5uZWxTcGxpdHRlcih0aGlzLm5DaCk7XG4gICAgICAgIHRoaXMub3V0ID0gdGhpcy5jdHguY3JlYXRlQ2hhbm5lbE1lcmdlcih0aGlzLm5DaCk7XG4gICAgICAgIHRoaXMuZ2FpbnMgPSBuZXcgQXJyYXkodGhpcy5uQ2gpO1xuICAgICAgICBcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm5DaDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgbiA9IE1hdGguZmxvb3IoTWF0aC5zcXJ0KGkpKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdGhpcy5nYWluc1tpXSA9IHRoaXMuY3R4LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgICAgIHRoaXMuZ2FpbnNbaV0uZ2Fpbi52YWx1ZSA9IDEvTWF0aC5zcXJ0KDIqbisxKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdGhpcy5pbi5jb25uZWN0KHRoaXMuZ2FpbnNbaV0sIGksIDApO1xuICAgICAgICAgICAgdGhpcy5nYWluc1tpXS5jb25uZWN0KHRoaXMub3V0LCAwLCBpKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vKiBGVU1BIFRPIEFDTi9OM0QgQ09OVkVSVEVSICovXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5leHBvcnQgY2xhc3MgZnVtYTJhY24ge1xuXG4gICAgY29uc3RydWN0b3IoYXVkaW9DdHgsIG9yZGVyKSB7XG4gICAgICAgIFxuICAgICAgICBpZiAob3JkZXI+Mykge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJGdU1hIHNwZWNpZmljdGlvbiBpcyBzdXBwb3J0ZWQgdXAgdG8gM3JkIG9yZGVyXCIpO1xuICAgICAgICAgICAgb3JkZXIgPSAzO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyByZS1tYXBwaW5nIGluZGljZXMgZnJvbSBGdU1hIGNoYW5uZWxzIHRvIEFDTlxuICAgICAgICAvLyB2YXIgaW5kZXhfZnVtYTJhY24gPSBbMCwgMiwgMywgMSwgOCwgNiwgNCwgNSwgNywgMTUsIDEzLCAxMSwgOSwgMTAsIDEyLCAxNF07XG4gICAgICAgIC8vIC8vICAgICAgICAgICAgICAgICAgICBXICBZICBaICBYICBWICBUICBSICBTICBVICBRICAgTyAgIE0gICBLICBMICAgTiAgIFBcbiAgICAgICAgXG4gICAgICAgIC8vIGdhaW5zIGZvciBlYWNoIEZ1TWEgY2hhbm5lbCB0byBOM0QsIGFmdGVyIHJlLW1hcHBpbmcgY2hhbm5lbHNcbiAgICAgICAgdmFyIGdhaW5zX2Z1bWEybjNkID0gW01hdGguc3FydCgyKSwgICAgIC8vIFdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIE1hdGguc3FydCgzKSwgICAgIC8vIFlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIE1hdGguc3FydCgzKSwgICAgIC8vIFpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIE1hdGguc3FydCgzKSwgICAgIC8vIFhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIE1hdGguc3FydCgxNSkvMiwgIC8vIFZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIE1hdGguc3FydCgxNSkvMiwgIC8vIFRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIE1hdGguc3FydCg1KSwgICAgIC8vIFJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIE1hdGguc3FydCgxNSkvMiwgIC8vIFNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIE1hdGguc3FydCgxNSkvMiwgIC8vIFVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIE1hdGguc3FydCgzNS84KSwgIC8vIFFcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIE1hdGguc3FydCgzNSkvMywgIC8vIE9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIE1hdGguc3FydCgyMjQvNDUpLC8vIE1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIE1hdGguc3FydCg3KSwgICAgIC8vIEtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIE1hdGguc3FydCgyMjQvNDUpLC8vIExcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIE1hdGguc3FydCgzNSkvMywgIC8vIE5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIE1hdGguc3FydCgzNS84KV0gIC8vIFBcbiAgICAgICAgXG4gICAgICAgIHRoaXMuY3R4ID0gYXVkaW9DdHg7XG4gICAgICAgIHRoaXMub3JkZXIgPSBvcmRlcjtcbiAgICAgICAgdGhpcy5uQ2ggPSAob3JkZXIgKyAxKSAqIChvcmRlciArIDEpO1xuICAgICAgICB0aGlzLmluID0gdGhpcy5jdHguY3JlYXRlQ2hhbm5lbFNwbGl0dGVyKHRoaXMubkNoKTtcbiAgICAgICAgdGhpcy5vdXQgPSB0aGlzLmN0eC5jcmVhdGVDaGFubmVsTWVyZ2VyKHRoaXMubkNoKTtcbiAgICAgICAgdGhpcy5nYWlucyA9IFtdO1xuICAgICAgICB0aGlzLnJlbWFwQXJyYXkgPSBbXTtcblxuICAgICAgICAvLyBnZXQgY2hhbm5lbCByZW1hcHBpbmcgdmFsdWVzIG9yZGVyIDAtMVxuICAgICAgICB0aGlzLnJlbWFwQXJyYXkucHVzaCgwLCAyLCAzLCAxKTsgLy8gbWFudWFsbHkgaGFuZGxlIHVudGlsIG9yZGVyIDFcblxuICAgICAgICAvLyBnZXQgY2hhbm5lbCByZW1hcHBpbmcgdmFsdWVzIG9yZGVyIDItTlxuICAgICAgICBpZiAob3JkZXI+MSkge1xuICAgICAgICAgICAgdmFyIG8gPSAwO1xuICAgICAgICAgICAgdmFyIG07XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubkNoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBtID0gW107XG4gICAgICAgICAgICAgICAgaWYgKGkgPj0gKG8gKyAxKSAqIChvICsgMSkpIHtcbiAgICAgICAgICAgICAgICAgICAgbyArPSAxO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gKG8gKyAxKSAqIChvICsgMSk7IGogPCAobyArIDIpICogKG8gKyAyKTsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoKChqICsgbyAlIDIpICUgMikgPT0gMCkgeyBtLnB1c2goaikgfSBlbHNlIHsgbS51bnNoaWZ0KGopIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB0aGlzLnJlbWFwQXJyYXkgPSB0aGlzLnJlbWFwQXJyYXkuY29uY2F0KG0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGNvbm5lY3QgaW5wdXRzL291dHB1dHMgKGtlcHQgc2VwYXJhdGVkIGZvciBjbGFyaXR5J3Mgc2FrZSlcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm5DaDsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLmdhaW5zW2ldID0gdGhpcy5jdHguY3JlYXRlR2FpbigpO1xuICAgICAgICAgICAgdGhpcy5nYWluc1tpXS5nYWluLnZhbHVlID0gZ2FpbnNfZnVtYTJuM2RbaV07XG4gICAgICAgICAgICB0aGlzLmluLmNvbm5lY3QodGhpcy5nYWluc1tpXSwgdGhpcy5yZW1hcEFycmF5W2ldLCAwKTtcbiAgICAgICAgICAgIHRoaXMuZ2FpbnNbaV0uY29ubmVjdCh0aGlzLm91dCwgMCwgaSk7XG4gICAgICAgIH1cbiAgICB9XG59XG4iLCIvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gIEFyY2hvbnRpcyBQb2xpdGlzXG4vLyAgYXJjaG9udGlzLnBvbGl0aXNAYWFsdG8uZmlcbi8vICBEYXZpZCBQb2lyaWVyLVF1aW5vdFxuLy8gIGRhdmlwb2lyQGlyY2FtLmZyXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy9cbi8vICBXZWJBdWRpb19IT0EgYSBKYXZhU2NyaXB0IGxpYnJhcnkgZm9yIGhpZ2hlci1vcmRlciBBbWJpc29uaWNzXG4vLyAgVGhlIGxpYnJhcnkgaW1wbGVtZW50cyBXZWIgQXVkaW8gYmxvY2tzIHRoYXQgcGVyZm9ybVxuLy8gIHR5cGljYWwgYW1iaXNvbmljIHByb2Nlc3Npbmcgb3BlcmF0aW9ucyBvbiBhdWRpbyBzaWduYWxzLlxuLy9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLyogUFJFU1NVUkUtVkVMT0NJVFkgSU5URU5TSVRZIEFOQUxZWkVSICovXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLy8gZm9yIFNhZmFyaSBzdXBwb3J0IHdoZXJlIGF1ZGlvQ29udGV4dC5BbmFseXNlci5nZXRGbG9hdFRpbWVEb21haW5EYXRhIGlzIG5vdCBkZWZpbmVkIGZvciBub3dcbmltcG9ydCAnZ2V0LWZsb2F0LXRpbWUtZG9tYWluLWRhdGEnO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBpbnRlbnNpdHlBbmFseXNlciB7XG4gICAgY29uc3RydWN0b3IoYXVkaW9DdHgpIHtcblxuICAgICAgICB0aGlzLmN0eCA9IGF1ZGlvQ3R4O1xuICAgICAgICB0aGlzLmZmdFNpemUgPSAyMDQ4O1xuICAgICAgICAvLyBJbnB1dCBhbmQgb3V0cHV0IG5vZGVzXG4gICAgICAgIHRoaXMuaW4gPSB0aGlzLmN0eC5jcmVhdGVDaGFubmVsU3BsaXR0ZXIoNCk7XG4gICAgICAgIHRoaXMub3V0ID0gdGhpcy5jdHguY3JlYXRlQ2hhbm5lbE1lcmdlcig0KTtcbiAgICAgICAgLy8gR2FpbnMgdG8gZ28gZnJvbSBBQ04vTjNEIHRvIHByZXNzdXJlLXZlbG9jaXR5IChXWFlaKVxuICAgICAgICB0aGlzLmdhaW5zID0gbmV3IEFycmF5KDMpO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IDM7IGkrKykge1xuICAgICAgICAgICAgdGhpcy5nYWluc1tpXSA9IHRoaXMuY3R4LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgICAgIHRoaXMuZ2FpbnNbaV0uZ2Fpbi52YWx1ZSA9IDEgLyBNYXRoLnNxcnQoMyk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gSW5pdGlhbGl6ZSBhbmFseXplciBidWZmZXJzXG4gICAgICAgIHRoaXMuYW5hbHlzZXJzID0gbmV3IEFycmF5KDQpO1xuICAgICAgICB0aGlzLmFuYWxCdWZmZXJzID0gbmV3IEFycmF5KDQpO1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgNDsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLmFuYWx5c2Vyc1tpXSA9IHRoaXMuY3R4LmNyZWF0ZUFuYWx5c2VyKCk7XG4gICAgICAgICAgICB0aGlzLmFuYWx5c2Vyc1tpXS5mZnRTaXplID0gdGhpcy5mZnRTaXplO1xuICAgICAgICAgICAgdGhpcy5hbmFseXNlcnNbaV0uc21vb3RoaW5nVGltZUNvbnN0YW50ID0gMDtcbiAgICAgICAgICAgIHRoaXMuYW5hbEJ1ZmZlcnNbaV0gPSBuZXcgRmxvYXQzMkFycmF5KHRoaXMuZmZ0U2l6ZSk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gQ3JlYXRlIGNvbm5lY3Rpb25zXG4gICAgICAgIHRoaXMuaW4uY29ubmVjdCh0aGlzLm91dCwgMCwgMCk7XG4gICAgICAgIHRoaXMuaW4uY29ubmVjdCh0aGlzLmFuYWx5c2Vyc1swXSwgMCwgMCk7XG4gICAgICAgIFxuICAgICAgICB0aGlzLmluLmNvbm5lY3QodGhpcy5nYWluc1sxXSwgMSwgMCk7XG4gICAgICAgIHRoaXMuaW4uY29ubmVjdCh0aGlzLmdhaW5zWzJdLCAyLCAwKTtcbiAgICAgICAgdGhpcy5pbi5jb25uZWN0KHRoaXMuZ2FpbnNbMF0sIDMsIDApO1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgMzsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLmdhaW5zW2ldLmNvbm5lY3QodGhpcy5hbmFseXNlcnNbaSsxXSwgMCwgMCk7XG4gICAgICAgICAgICB0aGlzLmdhaW5zW2ldLmNvbm5lY3QodGhpcy5vdXQsIDAsIGkrMSk7XG4gICAgICAgIH1cblxuICAgIH1cblxuICAgIHVwZGF0ZUJ1ZmZlcnMoKSB7XG4gICAgICAgIC8vIEdldCBsYXRlc3QgdGltZS1kb21haW4gZGF0YVxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IDQ7IGkrKykge1xuICAgICAgICAgICAgdGhpcy5hbmFseXNlcnNbaV0uZ2V0RmxvYXRUaW1lRG9tYWluRGF0YSh0aGlzLmFuYWxCdWZmZXJzW2ldKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGNvbXB1dGVJbnRlbnNpdHkoKSB7XG4gICAgICAgIC8vIENvbXB1dGUgY29ycmVsYXRpb25zIGFuZCBlbmVyZ2llcyBvZiBjaGFubmVsc1xuICAgICAgICB2YXIgaVggPSAwO1xuICAgICAgICB2YXIgaVkgPSAwO1xuICAgICAgICB2YXIgaVogPSAwO1xuICAgICAgICB2YXIgV1cgPSAwO1xuICAgICAgICB2YXIgWFggPSAwO1xuICAgICAgICB2YXIgWVkgPSAwO1xuICAgICAgICB2YXIgWlogPSAwO1xuICAgICAgICB2YXIgSSwgSV9ub3JtLCBFLCBQc2ksIGF6aW0sIGVsZXY7XG4gICAgICAgIC8vIEFjY3VtdWxhdG9ycyBmb3IgY29ycmVsYXRpb25zIGFuZCBlbmVyZ2llc1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuZmZ0U2l6ZTsgaSsrKSB7XG5cbiAgICAgICAgICAgIGlYID0gaVggKyB0aGlzLmFuYWxCdWZmZXJzWzBdW2ldICogdGhpcy5hbmFsQnVmZmVyc1sxXVtpXTtcbiAgICAgICAgICAgIGlZID0gaVkgKyB0aGlzLmFuYWxCdWZmZXJzWzBdW2ldICogdGhpcy5hbmFsQnVmZmVyc1syXVtpXTtcbiAgICAgICAgICAgIGlaID0gaVogKyB0aGlzLmFuYWxCdWZmZXJzWzBdW2ldICogdGhpcy5hbmFsQnVmZmVyc1szXVtpXTtcbiAgICAgICAgICAgIFdXID0gV1cgKyB0aGlzLmFuYWxCdWZmZXJzWzBdW2ldICogdGhpcy5hbmFsQnVmZmVyc1swXVtpXTtcbiAgICAgICAgICAgIFhYID0gWFggKyB0aGlzLmFuYWxCdWZmZXJzWzFdW2ldICogdGhpcy5hbmFsQnVmZmVyc1sxXVtpXTtcbiAgICAgICAgICAgIFlZID0gWVkgKyB0aGlzLmFuYWxCdWZmZXJzWzJdW2ldICogdGhpcy5hbmFsQnVmZmVyc1syXVtpXTtcbiAgICAgICAgICAgIFpaID0gWlogKyB0aGlzLmFuYWxCdWZmZXJzWzNdW2ldICogdGhpcy5hbmFsQnVmZmVyc1szXVtpXTtcbiAgICAgICAgfVxuICAgICAgICBJID0gW2lYLCBpWSwgaVpdOyAvLyBpbnRlbnNpdHlcbiAgICAgICAgSV9ub3JtID0gTWF0aC5zcXJ0KElbMF0qSVswXSArIElbMV0qSVsxXSArIElbMl0qSVsyXSk7IC8vIGludGVuc2l0eSBtYWduaXR1ZGVcbiAgICAgICAgRSA9IChXVyArIFhYICsgWVkgKyBaWikgLyAyOyAvLyBlbmVyZ3lcbiAgICAgICAgUHNpID0gMSAtIElfbm9ybSAvIChFICsgMTBlLTgpOyAvLyBkaWZmdXNlbmVzc1xuICAgICAgICBhemltID0gTWF0aC5hdGFuMihpWSwgaVgpICogMTgwIC8gTWF0aC5QSTtcbiAgICAgICAgZWxldiA9IE1hdGguYXRhbjIoSVsyXSwgTWF0aC5zcXJ0KElbMF0gKiBJWzBdICsgSVsxXSAqIElbMV0pKSAqIDE4MCAvIE1hdGguUEk7XG5cbiAgICAgICAgdmFyIHBhcmFtcyA9IFthemltLCBlbGV2LCBQc2ksIEVdO1xuICAgICAgICByZXR1cm4gcGFyYW1zO1xuICAgIH1cbn1cbiIsIi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyAgQXJjaG9udGlzIFBvbGl0aXNcbi8vICBhcmNob250aXMucG9saXRpc0BhYWx0by5maVxuLy8gIERhdmlkIFBvaXJpZXItUXVpbm90XG4vLyAgZGF2aXBvaXJAaXJjYW0uZnJcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vL1xuLy8gIFdlYkF1ZGlvX0hPQSBhIEphdmFTY3JpcHQgbGlicmFyeSBmb3IgaGlnaGVyLW9yZGVyIEFtYmlzb25pY3Ncbi8vICBUaGUgbGlicmFyeSBpbXBsZW1lbnRzIFdlYiBBdWRpbyBibG9ja3MgdGhhdCBwZXJmb3JtXG4vLyAgdHlwaWNhbCBhbWJpc29uaWMgcHJvY2Vzc2luZyBvcGVyYXRpb25zIG9uIGF1ZGlvIHNpZ25hbHMuXG4vL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLy8vLy8vLy8vLy8vLy8vLy9cbi8qIEhPQSBFTkNPREVSICovXG4vLy8vLy8vLy8vLy8vLy8vL1xuXG5pbXBvcnQgKiBhcyBqc2hsaWIgZnJvbSAnc3BoZXJpY2FsLWhhcm1vbmljLXRyYW5zZm9ybSc7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIG1vbm9FbmNvZGVyIHtcblxuICAgIGNvbnN0cnVjdG9yKGF1ZGlvQ3R4LCBvcmRlcikge1xuXG4gICAgICAgIHRoaXMuaW5pdGlhbGl6ZWQgPSBmYWxzZTtcblxuICAgICAgICB0aGlzLmN0eCA9IGF1ZGlvQ3R4O1xuICAgICAgICB0aGlzLm9yZGVyID0gb3JkZXI7XG4gICAgICAgIHRoaXMubkNoID0gKG9yZGVyICsgMSkgKiAob3JkZXIgKyAxKTtcbiAgICAgICAgdGhpcy5hemltID0gMDtcbiAgICAgICAgdGhpcy5lbGV2ID0gMDtcbiAgICAgICAgdGhpcy5nYWlucyA9IG5ldyBBcnJheSh0aGlzLm5DaCk7XG4gICAgICAgIHRoaXMuZ2Fpbk5vZGVzID0gbmV3IEFycmF5KHRoaXMubkNoKTtcbiAgICAgICAgdGhpcy5pbiA9IHRoaXMuY3R4LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgdGhpcy5pbi5jaGFubmVsQ291bnRNb2RlID0gJ2V4cGxpY2l0JztcbiAgICAgICAgdGhpcy5pbi5jaGFubmVsQ291bnQgPSAxO1xuICAgICAgICB0aGlzLm91dCA9IHRoaXMuY3R4LmNyZWF0ZUNoYW5uZWxNZXJnZXIodGhpcy5uQ2gpO1xuICAgICAgICAvLyBJbml0aWFsaXplIGVuY29kaW5nIGdhaW5zXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5uQ2g7IGkrKykge1xuICAgICAgICAgICAgdGhpcy5nYWluTm9kZXNbaV0gPSB0aGlzLmN0eC5jcmVhdGVHYWluKCk7XG4gICAgICAgICAgICB0aGlzLmdhaW5Ob2Rlc1tpXS5jaGFubmVsQ291bnRNb2RlID0gJ2V4cGxpY2l0JztcbiAgICAgICAgICAgIHRoaXMuZ2Fpbk5vZGVzW2ldLmNoYW5uZWxDb3VudCA9IDE7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy51cGRhdGVHYWlucygpO1xuICAgICAgICAvLyBNYWtlIGF1ZGlvIGNvbm5lY3Rpb25zXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5uQ2g7IGkrKykge1xuICAgICAgICAgICAgdGhpcy5pbi5jb25uZWN0KHRoaXMuZ2Fpbk5vZGVzW2ldKTtcbiAgICAgICAgICAgIHRoaXMuZ2Fpbk5vZGVzW2ldLmNvbm5lY3QodGhpcy5vdXQsIDAsIGkpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5pbml0aWFsaXplZCA9IHRydWU7XG4gICAgfVxuXG4gICAgdXBkYXRlR2FpbnMoKSB7XG4gICAgICAgIHZhciBOID0gdGhpcy5vcmRlcjtcbiAgICAgICAgdmFyIGdfZW5jID0ganNobGliLmNvbXB1dGVSZWFsU0goTiwgW1xuICAgICAgICAgICAgW3RoaXMuYXppbSAqIE1hdGguUEkgLyAxODAsIHRoaXMuZWxldiAqIE1hdGguUEkgLyAxODBdXG4gICAgICAgIF0pO1xuXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5uQ2g7IGkrKykge1xuICAgICAgICAgICAgdGhpcy5nYWluc1tpXSA9IGdfZW5jW2ldWzBdO1xuICAgICAgICAgICAgdGhpcy5nYWluTm9kZXNbaV0uZ2Fpbi52YWx1ZSA9IHRoaXMuZ2FpbnNbaV07XG4gICAgICAgIH1cbiAgICB9XG59XG4iLCIvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gIEFyY2hvbnRpcyBQb2xpdGlzXG4vLyAgYXJjaG9udGlzLnBvbGl0aXNAYWFsdG8uZmlcbi8vICBEYXZpZCBQb2lyaWVyLVF1aW5vdFxuLy8gIGRhdmlwb2lyQGlyY2FtLmZyXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy9cbi8vICBXZWJBdWRpb19IT0EgYSBKYXZhU2NyaXB0IGxpYnJhcnkgZm9yIGhpZ2hlci1vcmRlciBBbWJpc29uaWNzXG4vLyAgVGhlIGxpYnJhcnkgaW1wbGVtZW50cyBXZWIgQXVkaW8gYmxvY2tzIHRoYXQgcGVyZm9ybVxuLy8gIHR5cGljYWwgYW1iaXNvbmljIHByb2Nlc3Npbmcgb3BlcmF0aW9ucyBvbiBhdWRpbyBzaWduYWxzLlxuLy9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vKiBIT0EgT1JERVIgTElNSVRFUiAqL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3Mgb3JkZXJMaW1pdGVyIHtcblxuICAgIGNvbnN0cnVjdG9yKGF1ZGlvQ3R4LCBvcmRlckluLCBvcmRlck91dCkge1xuXG4gICAgICAgIHRoaXMuY3R4ID0gYXVkaW9DdHg7XG4gICAgICAgIHRoaXMub3JkZXJJbiA9IG9yZGVySW47XG4gICAgICAgIGlmIChvcmRlck91dCA8IG9yZGVySW4pIHRoaXMub3JkZXJPdXQgPSBvcmRlck91dDtcbiAgICAgICAgZWxzZSB0aGlzLm9yZGVyT3V0ID0gb3JkZXJJbjtcblxuICAgICAgICB0aGlzLm5DaEluID0gKHRoaXMub3JkZXJJbiArIDEpICogKHRoaXMub3JkZXJJbiArIDEpO1xuICAgICAgICB0aGlzLm5DaE91dCA9ICh0aGlzLm9yZGVyT3V0ICsgMSkgKiAodGhpcy5vcmRlck91dCArIDEpO1xuICAgICAgICB0aGlzLmluID0gdGhpcy5jdHguY3JlYXRlQ2hhbm5lbFNwbGl0dGVyKHRoaXMubkNoSW4pO1xuICAgICAgICB0aGlzLm91dCA9IHRoaXMuY3R4LmNyZWF0ZUNoYW5uZWxNZXJnZXIodGhpcy5uQ2hPdXQpO1xuXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5uQ2hPdXQ7IGkrKykge1xuICAgICAgICAgICAgdGhpcy5pbi5jb25uZWN0KHRoaXMub3V0LCBpLCBpKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHVwZGF0ZU9yZGVyKG9yZGVyT3V0KSB7XG5cbiAgICAgICAgaWYgKG9yZGVyT3V0IDw9IHRoaXMub3JkZXJJbikge1xuICAgICAgICAgICAgdGhpcy5vcmRlck91dCA9IG9yZGVyT3V0O1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgcmV0dXJuO1xuXG4gICAgICAgIHRoaXMubkNoT3V0ID0gKHRoaXMub3JkZXJPdXQgKyAxKSAqICh0aGlzLm9yZGVyT3V0ICsgMSk7XG4gICAgICAgIHRoaXMub3V0LmRpc2Nvbm5lY3QoKTtcbiAgICAgICAgdGhpcy5vdXQgPSB0aGlzLmN0eC5jcmVhdGVDaGFubmVsTWVyZ2VyKHRoaXMubkNoT3V0KTtcblxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMubkNoT3V0OyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMuaW4uY29ubmVjdCh0aGlzLm91dCwgaSwgaSk7XG4gICAgICAgIH1cbiAgICB9XG59XG4iLCIvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gIEFyY2hvbnRpcyBQb2xpdGlzXG4vLyAgYXJjaG9udGlzLnBvbGl0aXNAYWFsdG8uZmlcbi8vICBEYXZpZCBQb2lyaWVyLVF1aW5vdFxuLy8gIGRhdmlwb2lyQGlyY2FtLmZyXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy9cbi8vICBXZWJBdWRpb19IT0EgYSBKYXZhU2NyaXB0IGxpYnJhcnkgZm9yIGhpZ2hlci1vcmRlciBBbWJpc29uaWNzXG4vLyAgVGhlIGxpYnJhcnkgaW1wbGVtZW50cyBXZWIgQXVkaW8gYmxvY2tzIHRoYXQgcGVyZm9ybVxuLy8gIHR5cGljYWwgYW1iaXNvbmljIHByb2Nlc3Npbmcgb3BlcmF0aW9ucyBvbiBhdWRpbyBzaWduYWxzLlxuLy9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8qIEhPQSBPUkRFUiBXRUlHSFRJTkcgKi9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuaW1wb3J0ICogYXMganNobGliIGZyb20gJ3NwaGVyaWNhbC1oYXJtb25pYy10cmFuc2Zvcm0nO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBvcmRlcldlaWdodCB7XG5cbiAgICBjb25zdHJ1Y3RvcihhdWRpb0N0eCwgb3JkZXIpIHtcblxuICAgICAgICB0aGlzLmN0eCA9IGF1ZGlvQ3R4O1xuICAgICAgICB0aGlzLm9yZGVyID0gb3JkZXI7XG4gICAgICAgIFxuICAgICAgICB0aGlzLm5DaCA9ICh0aGlzLm9yZGVyICsgMSkgKiAodGhpcy5vcmRlciArIDEpO1xuICAgICAgICB0aGlzLmluID0gdGhpcy5jdHguY3JlYXRlQ2hhbm5lbFNwbGl0dGVyKHRoaXMubkNoKTtcbiAgICAgICAgdGhpcy5vdXQgPSB0aGlzLmN0eC5jcmVhdGVDaGFubmVsTWVyZ2VyKHRoaXMubkNoKTtcbiAgICAgICAgXG4gICAgICAgIHRoaXMuZ2FpbnMgPSBuZXcgQXJyYXkodGhpcy5uQ2gpO1xuICAgICAgICB0aGlzLm9yZGVyR2FpbnMgPSBuZXcgQXJyYXkodGhpcy5vcmRlcisxKVxuICAgICAgICB0aGlzLm9yZGVyR2FpbnMuZmlsbCgxKTtcblxuICAgICAgICAvLyBpbml0aWFsaXplIGdhaW5zIGFuZCBjb25uZWN0aW9uc1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMubkNoOyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMuZ2FpbnNbaV0gPSB0aGlzLmN0eC5jcmVhdGVHYWluKCk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHRoaXMuaW4uY29ubmVjdCh0aGlzLmdhaW5zW2ldLCBpLCAwKTtcbiAgICAgICAgICAgIHRoaXMuZ2FpbnNbaV0uY29ubmVjdCh0aGlzLm91dCwwLGkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgdXBkYXRlT3JkZXJHYWlucygpIHtcblxuICAgICAgICB2YXIgbjtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm5DaDsgaSsrKSB7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIG4gPSBNYXRoLmZsb29yKE1hdGguc3FydChpKSk7XG4gICAgICAgICAgICB0aGlzLmdhaW5zW2ldLmdhaW4udmFsdWUgPSB0aGlzLm9yZGVyR2FpbnNbbl07XG4gICAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgY29tcHV0ZU1heFJFQ29lZmZzKCkge1xuICAgICAgICBcbiAgICAgICAgdmFyIE4gPSB0aGlzLm9yZGVyO1xuICAgICAgICB0aGlzLm9yZGVyR2FpbnNbMF0gPSAxO1xuICAgICAgICB2YXIgbGVnX25fbWludXMxID0gMDtcbiAgICAgICAgdmFyIGxlZ19uX21pbnVzMiA9IDA7XG4gICAgICAgIHZhciBsZWdfbiA9IDA7XG4gICAgICAgIGZvciAodmFyIG4gPSAxOyBuIDw9IE47IG4rKykge1xuICAgICAgICAgICAgbGVnX24gPSBqc2hsaWIucmVjdXJzZUxlZ2VuZHJlUG9seShuLCBbTWF0aC5jb3MoMi40MDY4MDkgLyAoTiArIDEuNTEpKV0sIGxlZ19uX21pbnVzMSwgbGVnX25fbWludXMyKTtcbiAgICAgICAgICAgIHRoaXMub3JkZXJHYWluc1tuXSA9IGxlZ19uWzBdWzBdO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBsZWdfbl9taW51czIgPSBsZWdfbl9taW51czE7XG4gICAgICAgICAgICBsZWdfbl9taW51czEgPSBsZWdfbjtcbiAgICAgICAgfVxuICAgIH1cbn1cbiIsIi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyAgQXJjaG9udGlzIFBvbGl0aXNcbi8vICBhcmNob250aXMucG9saXRpc0BhYWx0by5maVxuLy8gIERhdmlkIFBvaXJpZXItUXVpbm90XG4vLyAgZGF2aXBvaXJAaXJjYW0uZnJcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vL1xuLy8gIFdlYkF1ZGlvX0hPQSBhIEphdmFTY3JpcHQgbGlicmFyeSBmb3IgaGlnaGVyLW9yZGVyIEFtYmlzb25pY3Ncbi8vICBUaGUgbGlicmFyeSBpbXBsZW1lbnRzIFdlYiBBdWRpbyBibG9ja3MgdGhhdCBwZXJmb3JtXG4vLyAgdHlwaWNhbCBhbWJpc29uaWMgcHJvY2Vzc2luZyBvcGVyYXRpb25zIG9uIGF1ZGlvIHNpZ25hbHMuXG4vL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vKiBIT0EgUE9XRVJNQVAgQU5BTFlaRVIgKi9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4vLy8vLy8gTk9UIElNUEVNRU5URUQgWUVUICEhISAvLy8vLy8vXG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIHBvd2VybWFwQW5hbHlzZXIge1xuICAgIGNvbnN0cnVjdG9yKGF1ZGlvQ3R4LCBvcmRlcikge1xuICAgICAgICB0aGlzLmluaXRpYWxpemVkID0gZmFsc2U7XG5cbiAgICAgICAgdGhpcy5jdHggPSBhdWRpb0N0eDtcbiAgICAgICAgdGhpcy5vcmRlciA9IG9yZGVyO1xuICAgICAgICB0aGlzLm5DaCA9IChvcmRlciArIDEpICogKG9yZGVyICsgMSk7XG4gICAgICAgIHRoaXMuZmZ0U2l6ZSA9IDIwNDg7XG4gICAgICAgIHRoaXMuYW5hbHlzZXJzID0gbmV3IEFycmF5KHRoaXMubkNoKTtcbiAgICAgICAgdGhpcy5hbmFsQnVmZmVycyA9IG5ldyBBcnJheSh0aGlzLm5DaCk7XG4gICAgICAgIC8vIElucHV0IGFuZCBvdXRwdXQgbm9kZXNcbiAgICAgICAgdGhpcy5pbiA9IHRoaXMuY3R4LmNyZWF0ZUNoYW5uZWxTcGxpdHRlcih0aGlzLm5DaCk7XG4gICAgICAgIHRoaXMub3V0ID0gdGhpcy5jdHguY3JlYXRlQ2hhbm5lbE1lcmdlcih0aGlzLm5DaCk7XG4gICAgICAgIC8vIEluaXRpYWxpemUgYW5hbHl6ZXIgYnVmZmVyc1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMubkNoOyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMuYW5hbHlzZXJzW2ldID0gdGhpcy5jdHguY3JlYXRlQW5hbHlzZXIoKTtcbiAgICAgICAgICAgIHRoaXMuYW5hbHlzZXJzW2ldLmZmdFNpemUgPSB0aGlzLmZmdFNpemU7XG4gICAgICAgICAgICB0aGlzLmFuYWx5c2Vyc1tpXS5zbW9vdGhpbmdUaW1lQ29uc3RhbnQgPSAwO1xuICAgICAgICAgICAgdGhpcy5hbmFsQnVmZmVyc1tpXSA9IG5ldyBGbG9hdDMyQXJyYXkodGhpcy5mZnRTaXplKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBDcmVhdGUgY29ubmVjdGlvbnNcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLm5DaDsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLmluLmNvbm5lY3QodGhpcy5vdXQsIGksIGkpO1xuICAgICAgICAgICAgdGhpcy5pbi5jb25uZWN0KHRoaXMuYW5hbHlzZXJzW2ldLCBpLCAwKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuaW5pdGlhbGl6ZWQgPSB0cnVlO1xuICAgIH1cblxuICAgIHVwZGF0ZUJ1ZmZlcnMoKSB7XG4gICAgICAgIC8vIEdldCBsYXRlc3QgdGltZS1kb21haW4gZGF0YVxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMubkNoOyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMuYW5hbHlzZXJzW2ldLmdldEZsb2F0VGltZURvbWFpbkRhdGEodGhpcy5hbmFsQnVmZmVyc1tpXSk7XG4gICAgICAgIH1cbiAgICB9XG5cbn1cbiIsIi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyAgQXJjaG9udGlzIFBvbGl0aXNcbi8vICBhcmNob250aXMucG9saXRpc0BhYWx0by5maVxuLy8gIERhdmlkIFBvaXJpZXItUXVpbm90XG4vLyAgZGF2aXBvaXJAaXJjYW0uZnJcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vL1xuLy8gIFdlYkF1ZGlvX0hPQSBhIEphdmFTY3JpcHQgbGlicmFyeSBmb3IgaGlnaGVyLW9yZGVyIEFtYmlzb25pY3Ncbi8vICBUaGUgbGlicmFyeSBpbXBsZW1lbnRzIFdlYiBBdWRpbyBibG9ja3MgdGhhdCBwZXJmb3JtXG4vLyAgdHlwaWNhbCBhbWJpc29uaWMgcHJvY2Vzc2luZyBvcGVyYXRpb25zIG9uIGF1ZGlvIHNpZ25hbHMuXG4vL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLy8vLy8vLy8vLy8vLy8vLy9cbi8qIEhPQSBNSVJST1IgKi9cbi8vLy8vLy8vLy8vLy8vLy8vXG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIHNjZW5lTWlycm9yIHtcblxuICAgIGNvbnN0cnVjdG9yKGF1ZGlvQ3R4LCBvcmRlcikge1xuXG4gICAgICAgIHRoaXMuY3R4ID0gYXVkaW9DdHg7XG4gICAgICAgIHRoaXMub3JkZXIgPSBvcmRlcjtcbiAgICAgICAgdGhpcy5uQ2ggPSAob3JkZXIgKyAxKSAqIChvcmRlciArIDEpO1xuICAgICAgICB0aGlzLm1pcnJvclBsYW5lID0gMDtcbiAgICAgICAgLy8gSW5wdXQgYW5kIG91dHB1dCBub2Rlc1xuICAgICAgICB0aGlzLmluID0gdGhpcy5jdHguY3JlYXRlQ2hhbm5lbFNwbGl0dGVyKHRoaXMubkNoKTtcbiAgICAgICAgdGhpcy5vdXQgPSB0aGlzLmN0eC5jcmVhdGVDaGFubmVsTWVyZ2VyKHRoaXMubkNoKTtcbiAgICAgICAgLy8gSW5pdGlhbGl6ZSBtaXJyb3JpbmcgZ2FpbnMgdG8gdW5pdHkgKG5vIHJlZmxlY3Rpb24pIGFuZCBjb25uZWN0XG4gICAgICAgIHRoaXMuZ2FpbnMgPSBuZXcgQXJyYXkodGhpcy5uQ2gpO1xuICAgICAgICBmb3IgKHZhciBxID0gMDsgcSA8IHRoaXMubkNoOyBxKyspIHtcbiAgICAgICAgICAgIHRoaXMuZ2FpbnNbcV0gPSB0aGlzLmN0eC5jcmVhdGVHYWluKCk7XG4gICAgICAgICAgICB0aGlzLmdhaW5zW3FdLmdhaW4udmFsdWUgPSAxO1xuICAgICAgICAgICAgLy8gQ3JlYXRlIGNvbm5lY3Rpb25zXG4gICAgICAgICAgICB0aGlzLmluLmNvbm5lY3QodGhpcy5nYWluc1txXSwgcSwgMCk7XG4gICAgICAgICAgICB0aGlzLmdhaW5zW3FdLmNvbm5lY3QodGhpcy5vdXQsIDAsIHEpO1xuICAgICAgICB9XG5cbiAgICB9XG4gICAgXG4gICAgcmVzZXQoKSB7XG4gICAgICAgIFxuICAgICAgICBmb3IgKHZhciBxID0gMDsgcSA8IHRoaXMubkNoOyBxKyspIHtcbiAgICAgICAgICAgIHRoaXMuZ2FpbnNbcV0uZ2Fpbi52YWx1ZSA9IDE7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBtaXJyb3IocGxhbmVObykge1xuICAgICAgICBcbiAgICAgICAgc3dpdGNoKHBsYW5lTm8pIHtcbiAgICAgICAgICAgIGNhc2UgMDpcbiAgICAgICAgICAgICAgICB0aGlzLm1pcnJvclBsYW5lID0gMDtcbiAgICAgICAgICAgICAgICB0aGlzLnJlc2V0KCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgICAgICAgLy8gbWlycm9yaW5nIG9uIHl6LXBsYW5lIChmcm9udC1iYWNrKVxuICAgICAgICAgICAgICAgIHRoaXMucmVzZXQoKTtcbiAgICAgICAgICAgICAgICB0aGlzLm1pcnJvclBsYW5lID0gMTtcbiAgICAgICAgICAgICAgICB2YXIgcTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBuID0gMDsgbiA8PSB0aGlzLm9yZGVyOyBuKyspIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgbSA9IC1uOyBtIDw9IG47IG0rKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcSA9IG4qbituK207XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoKG08MCAmJiBtJTI9PTApfHwobT4wICYmIG0lMj09MSkpIHRoaXMuZ2FpbnNbcV0uZ2Fpbi52YWx1ZSA9IC0xO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAyOlxuICAgICAgICAgICAgICAgIC8vIG1pcnJvcmluZyBvbiB4ei1wbGFuZSAobGVmdC1yaWdodClcbiAgICAgICAgICAgICAgICB0aGlzLnJlc2V0KCk7XG4gICAgICAgICAgICAgICAgdGhpcy5taXJyb3JQbGFuZSA9IDI7XG4gICAgICAgICAgICAgICAgdmFyIHE7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgbiA9IDA7IG4gPD0gdGhpcy5vcmRlcjsgbisrKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIG0gPSAtbjsgbSA8PSBuOyBtKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHEgPSBuKm4rbittO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG08MCkgdGhpcy5nYWluc1txXS5nYWluLnZhbHVlID0gLTE7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIDM6XG4gICAgICAgICAgICAgICAgLy8gbWlycm9yaW5nIG9uIHh5LXBsYW5lICh1cC1kb3duKVxuICAgICAgICAgICAgICAgIHRoaXMucmVzZXQoKTtcbiAgICAgICAgICAgICAgICB0aGlzLm1pcnJvclBsYW5lID0gMztcbiAgICAgICAgICAgICAgICB2YXIgcTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBuID0gMDsgbiA8PSB0aGlzLm9yZGVyOyBuKyspIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgbSA9IC1uOyBtIDw9IG47IG0rKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcSA9IG4qbituK207XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoKG0rbiklMj09MSkgdGhpcy5nYWluc1txXS5nYWluLnZhbHVlID0gLTE7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiVGhlIG1pcnJvcmluZyBwbGFuZXMgY2FuIGJlIGVpdGhlciAxICh5eiksIDIgKHh6KSwgMyAoeHkpLCBvciAwIChubyBtaXJyb3JpbmcpLiBWYWx1ZSBzZXQgdG8gMC5cIilcbiAgICAgICAgICAgICAgICB0aGlzLm1pcnJvclBsYW5lID0gMDtcbiAgICAgICAgICAgICAgICB0aGlzLnJlc2V0KCk7XG4gICAgICAgIH1cbiAgICAgICAgXG5cbiAgICB9XG5cbn1cbiIsIi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyAgQXJjaG9udGlzIFBvbGl0aXNcbi8vICBhcmNob250aXMucG9saXRpc0BhYWx0by5maVxuLy8gIERhdmlkIFBvaXJpZXItUXVpbm90XG4vLyAgZGF2aXBvaXJAaXJjYW0uZnJcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vL1xuLy8gIFdlYkF1ZGlvX0hPQSBhIEphdmFTY3JpcHQgbGlicmFyeSBmb3IgaGlnaGVyLW9yZGVyIEFtYmlzb25pY3Ncbi8vICBUaGUgbGlicmFyeSBpbXBsZW1lbnRzIFdlYiBBdWRpbyBibG9ja3MgdGhhdCBwZXJmb3JtXG4vLyAgdHlwaWNhbCBhbWJpc29uaWMgcHJvY2Vzc2luZyBvcGVyYXRpb25zIG9uIGF1ZGlvIHNpZ25hbHMuXG4vL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLy8vLy8vLy8vLy8vLy8vLy9cbi8qIEhPQSBST1RBVE9SICovXG4vLy8vLy8vLy8vLy8vLy8vL1xuXG5pbXBvcnQgKiBhcyBqc2hsaWIgZnJvbSAnc3BoZXJpY2FsLWhhcm1vbmljLXRyYW5zZm9ybSc7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIHNjZW5lUm90YXRvciB7XG5cbiAgICBjb25zdHJ1Y3RvcihhdWRpb0N0eCwgb3JkZXIpIHtcblxuICAgICAgICB0aGlzLmN0eCA9IGF1ZGlvQ3R4O1xuICAgICAgICB0aGlzLm9yZGVyID0gb3JkZXI7XG4gICAgICAgIHRoaXMubkNoID0gKG9yZGVyICsgMSkgKiAob3JkZXIgKyAxKTtcbiAgICAgICAgdGhpcy55YXcgPSAwO1xuICAgICAgICB0aGlzLnBpdGNoID0gMDtcbiAgICAgICAgdGhpcy5yb2xsID0gMDtcbiAgICAgICAgdGhpcy5yb3RNdHggPSBudW1lcmljLmlkZW50aXR5KHRoaXMubkNoKTtcbiAgICAgICAgdGhpcy5yb3RNdHhOb2RlcyA9IG5ldyBBcnJheSh0aGlzLm9yZGVyKTtcbiAgICAgICAgLy8gSW5wdXQgYW5kIG91dHB1dCBub2Rlc1xuICAgICAgICB0aGlzLmluID0gdGhpcy5jdHguY3JlYXRlQ2hhbm5lbFNwbGl0dGVyKHRoaXMubkNoKTtcbiAgICAgICAgdGhpcy5vdXQgPSB0aGlzLmN0eC5jcmVhdGVDaGFubmVsTWVyZ2VyKHRoaXMubkNoKTtcbiAgICAgICAgXG4gICAgICAgIC8vIEluaXRpYWxpemUgcm90YXRpb24gZ2FpbnMgdG8gaWRlbnRpdHkgbWF0cml4XG4gICAgICAgIGZvciAodmFyIG4gPSAxOyBuIDw9IHRoaXMub3JkZXI7IG4rKykge1xuICAgICAgICAgICAgXG4gICAgICAgICAgICB2YXIgZ2FpbnNfbiA9IG5ldyBBcnJheSgyICogbiArIDEpO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCAyICogbiArIDE7IGkrKykge1xuICAgICAgICAgICAgICAgIGdhaW5zX25baV0gPSBuZXcgQXJyYXkoMiAqIG4gKyAxKTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IDIgKiBuICsgMTsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgIGdhaW5zX25baV1bal0gPSB0aGlzLmN0eC5jcmVhdGVHYWluKCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpID09IGopIGdhaW5zX25baV1bal0uZ2Fpbi52YWx1ZSA9IDE7XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgZ2FpbnNfbltpXVtqXS5nYWluLnZhbHVlID0gMDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLnJvdE10eE5vZGVzW24gLSAxXSA9IGdhaW5zX247XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIENyZWF0ZSBjb25uZWN0aW9uc1xuICAgICAgICB0aGlzLmluLmNvbm5lY3QodGhpcy5vdXQsIDAsIDApOyAvLyB6ZXJvdGggb3JkZXIgY2guIGRvZXMgbm90IHJvdGF0ZVxuICAgICAgICBcbiAgICAgICAgdmFyIGJhbmRfaWR4ID0gMTtcbiAgICAgICAgZm9yIChuID0gMTsgbiA8PSB0aGlzLm9yZGVyOyBuKyspIHtcbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCAyICogbiArIDE7IGkrKykge1xuICAgICAgICAgICAgICAgIGZvciAoaiA9IDA7IGogPCAyICogbiArIDE7IGorKykge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmluLmNvbm5lY3QodGhpcy5yb3RNdHhOb2Rlc1tuIC0gMV1baV1bal0sIGJhbmRfaWR4ICsgaiwgMCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucm90TXR4Tm9kZXNbbiAtIDFdW2ldW2pdLmNvbm5lY3QodGhpcy5vdXQsIDAsIGJhbmRfaWR4ICsgaSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYmFuZF9pZHggPSBiYW5kX2lkeCArIDIgKiBuICsgMTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHVwZGF0ZVJvdE10eCgpIHtcblxuICAgICAgICB2YXIgeWF3ID0gdGhpcy55YXcgKiBNYXRoLlBJIC8gMTgwO1xuICAgICAgICB2YXIgcGl0Y2ggPSB0aGlzLnBpdGNoICogTWF0aC5QSSAvIDE4MDtcbiAgICAgICAgdmFyIHJvbGwgPSB0aGlzLnJvbGwgKiBNYXRoLlBJIC8gMTgwO1xuXG4gICAgICAgIHRoaXMucm90TXR4ID0ganNobGliLmdldFNIcm90TXR4KGpzaGxpYi55YXdQaXRjaFJvbGwyUnp5eCh5YXcsIHBpdGNoLCByb2xsKSwgdGhpcy5vcmRlcik7XG5cbiAgICAgICAgdmFyIGJhbmRfaWR4ID0gMTtcbiAgICAgICAgZm9yIChsZXQgbiA9IDE7IG4gPCB0aGlzLm9yZGVyICsgMTsgbisrKSB7XG5cbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgMiAqIG4gKyAxOyBpKyspIHtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IDIgKiBuICsgMTsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucm90TXR4Tm9kZXNbbiAtIDFdW2ldW2pdLmdhaW4udmFsdWUgPSB0aGlzLnJvdE10eFtiYW5kX2lkeCArIGldW2JhbmRfaWR4ICsgal07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYmFuZF9pZHggPSBiYW5kX2lkeCArIDIgKiBuICsgMTtcbiAgICAgICAgfVxuICAgIH1cbn1cbiIsIi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyAgQXJjaG9udGlzIFBvbGl0aXNcbi8vICBhcmNob250aXMucG9saXRpc0BhYWx0by5maVxuLy8gIERhdmlkIFBvaXJpZXItUXVpbm90XG4vLyAgZGF2aXBvaXJAaXJjYW0uZnJcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vL1xuLy8gIFdlYkF1ZGlvX0hPQSBhIEphdmFTY3JpcHQgbGlicmFyeSBmb3IgaGlnaGVyLW9yZGVyIEFtYmlzb25pY3Ncbi8vICBUaGUgbGlicmFyeSBpbXBsZW1lbnRzIFdlYiBBdWRpbyBibG9ja3MgdGhhdCBwZXJmb3JtXG4vLyAgdHlwaWNhbCBhbWJpc29uaWMgcHJvY2Vzc2luZyBvcGVyYXRpb25zIG9uIGF1ZGlvIHNpZ25hbHMuXG4vL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vKiBIT0EgVklSVFVBTCBNSUNST1BIT05FICovXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuaW1wb3J0ICogYXMganNobGliIGZyb20gJ3NwaGVyaWNhbC1oYXJtb25pYy10cmFuc2Zvcm0nO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyB2aXJ0dWFsTWljIHtcblxuICAgIGNvbnN0cnVjdG9yKGF1ZGlvQ3R4LCBvcmRlcikge1xuXG4gICAgICAgIHRoaXMuaW5pdGlhbGl6ZWQgPSBmYWxzZTtcblxuICAgICAgICB0aGlzLmN0eCA9IGF1ZGlvQ3R4O1xuICAgICAgICB0aGlzLm9yZGVyID0gb3JkZXI7XG4gICAgICAgIHRoaXMubkNoID0gKG9yZGVyICsgMSkgKiAob3JkZXIgKyAxKTtcbiAgICAgICAgdGhpcy5hemltID0gMDtcbiAgICAgICAgdGhpcy5lbGV2ID0gMDtcbiAgICAgICAgdGhpcy52bWljR2FpbnMgPSBuZXcgQXJyYXkodGhpcy5uQ2gpO1xuICAgICAgICB0aGlzLnZtaWNHYWluTm9kZXMgPSBuZXcgQXJyYXkodGhpcy5uQ2gpO1xuICAgICAgICB0aGlzLnZtaWNDb2VmZnMgPSBuZXcgQXJyYXkodGhpcy5vcmRlciArIDEpO1xuICAgICAgICB0aGlzLnZtaWNQYXR0ZXJuID0gXCJoeXBlcmNhcmRpb2lkXCI7XG4gICAgICAgIHRoaXMuaW4gPSB0aGlzLmN0eC5jcmVhdGVDaGFubmVsU3BsaXR0ZXIodGhpcy5uQ2gpO1xuICAgICAgICB0aGlzLm91dCA9IHRoaXMuY3R4LmNyZWF0ZUdhaW4oKTtcblxuICAgICAgICAvLyBJbml0aWFsaXplIHZtaWMgdG8gZm9yd2FyZCBmYWNpbmcgaHlwZXJjYXJkaW9pZFxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubkNoOyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMudm1pY0dhaW5Ob2Rlc1tpXSA9IHRoaXMuY3R4LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLlNIeHl6ID0gbmV3IEFycmF5KHRoaXMubkNoKTtcbiAgICAgICAgdGhpcy5TSHh5ei5maWxsKDApO1xuICAgICAgICB0aGlzLnVwZGF0ZVBhdHRlcm4oKTtcbiAgICAgICAgdGhpcy51cGRhdGVPcmllbnRhdGlvbigpO1xuXG4gICAgICAgIC8vIENyZWF0ZSBjb25uZWN0aW9uc1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgdGhpcy5uQ2g7IGkrKykge1xuICAgICAgICAgICAgdGhpcy5pbi5jb25uZWN0KHRoaXMudm1pY0dhaW5Ob2Rlc1tpXSwgaSwgMCk7XG4gICAgICAgICAgICB0aGlzLnZtaWNHYWluTm9kZXNbaV0uY29ubmVjdCh0aGlzLm91dCk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmluaXRpYWxpemVkID0gdHJ1ZTtcbiAgICB9XG5cblxuICAgIHVwZGF0ZVBhdHRlcm4oKSB7XG5cbiAgICAgICAgZnVuY3Rpb24gY29tcHV0ZUNhcmRpb2lkQ29lZmZzKE4pIHtcbiAgICAgICAgICAgIHZhciBjb2VmZnMgPSBuZXcgQXJyYXkoTiArIDEpO1xuICAgICAgICAgICAgZm9yICh2YXIgbiA9IDA7IG4gPD0gTjsgbisrKSB7XG4gICAgICAgICAgICAgICAgY29lZmZzW25dID0ganNobGliLmZhY3RvcmlhbChOKSAqIGpzaGxpYi5mYWN0b3JpYWwoTikgLyAoanNobGliLmZhY3RvcmlhbChOICsgbiArIDEpICoganNobGliLmZhY3RvcmlhbChOIC0gbikpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGNvZWZmcztcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGNvbXB1dGVIeXBlcmNhcmRDb2VmZnMoTikge1xuICAgICAgICAgICAgdmFyIGNvZWZmcyA9IG5ldyBBcnJheShOICsgMSk7XG4gICAgICAgICAgICB2YXIgblNIID0gKE4rMSkqKE4rMSk7XG4gICAgICAgICAgICBmb3IgKHZhciBuID0gMDsgbiA8PSBOOyBuKyspIHtcbiAgICAgICAgICAgICAgICBjb2VmZnNbbl0gPSAxIC8gblNIO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGNvZWZmcztcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGNvbXB1dGVTdXBlcmNhcmRDb2VmZnMoTikge1xuICAgICAgICAgICAgc3dpdGNoIChOKSB7XG4gICAgICAgICAgICAgICAgY2FzZSAxOlxuICAgICAgICAgICAgICAgICAgICB2YXIgY29lZmZzID0gWzAuMzY2MCwgMC4yMTEzXTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAyOlxuICAgICAgICAgICAgICAgICAgICB2YXIgY29lZmZzID0gWzAuMjM2MiwgMC4xNTYyLCAwLjA1OTBdO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIDM6XG4gICAgICAgICAgICAgICAgICAgIHZhciBjb2VmZnMgPSBbMC4xNzY4LCAwLjEyODEsIDAuMDYzMywgMC4wMTc1XTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSA0OlxuICAgICAgICAgICAgICAgICAgICB2YXIgY29lZmZzID0gWzAuMTQxNCwgMC4xMDg3LCAwLjA2MjMsIDAuMDI0NywgMC4wMDU0XTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIk9yZGVycyBzaG91bGQgYmUgaW4gdGhlIHJhbmdlIG9mIDEtNCBhdCB0aGUgbW9tZW50LlwiKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGNvZWZmcztcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGNvbXB1dGVNYXhSRUNvZWZmcyhOKSB7XG4gICAgICAgICAgICB2YXIgY29lZmZzID0gbmV3IEFycmF5KE4gKyAxKTtcbiAgICAgICAgICAgIGNvZWZmc1swXSA9IDE7XG4gICAgICAgICAgICB2YXIgbGVnX25fbWludXMxID0gMDtcbiAgICAgICAgICAgIHZhciBsZWdfbl9taW51czIgPSAwO1xuICAgICAgICAgICAgdmFyIGxlZ19uID0gMDtcbiAgICAgICAgICAgIGZvciAodmFyIG4gPSAxOyBuIDwgTiArIDE7IG4rKykge1xuICAgICAgICAgICAgICAgIGxlZ19uID0ganNobGliLnJlY3Vyc2VMZWdlbmRyZVBvbHkobiwgW01hdGguY29zKDIuNDA2ODA5IC8gKE4gKyAxLjUxKSldLCBsZWdfbl9taW51czEsIGxlZ19uX21pbnVzMik7XG4gICAgICAgICAgICAgICAgY29lZmZzW25dID0gbGVnX25bMF1bMF07XG5cbiAgICAgICAgICAgICAgICBsZWdfbl9taW51czIgPSBsZWdfbl9taW51czE7XG4gICAgICAgICAgICAgICAgbGVnX25fbWludXMxID0gbGVnX247XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBjb21wdXRlIG5vcm1hbGl6YXRpb24gZmFjdG9yXG4gICAgICAgICAgICB2YXIgbm9ybSA9IDA7XG4gICAgICAgICAgICBmb3IgKHZhciBuID0gMDsgbiA8PSBOOyBuKyspIHtcbiAgICAgICAgICAgICAgICBub3JtICs9IGNvZWZmc1tuXSAqICgyKm4rMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmb3IgKHZhciBuID0gMDsgbiA8PSBOOyBuKyspIHtcbiAgICAgICAgICAgICAgICBjb2VmZnNbbl0gPSBjb2VmZnNbbl0vbm9ybTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBjb2VmZnM7XG4gICAgICAgIH1cblxuICAgICAgICBzd2l0Y2ggKHRoaXMudm1pY1BhdHRlcm4pIHtcbiAgICAgICAgICAgIGNhc2UgXCJjYXJkaW9pZFwiOlxuICAgICAgICAgICAgICAgIC8vIGhpZ2hlci1vcmRlciBjYXJkaW9pZCBnaXZlbiBieTogKDEvMileTiAqICggMStjb3ModGhldGEpICleTlxuICAgICAgICAgICAgICAgIHRoaXMudm1pY0NvZWZmcyA9IGNvbXB1dGVDYXJkaW9pZENvZWZmcyh0aGlzLm9yZGVyKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCJzdXBlcmNhcmRpb2lkXCI6XG4gICAgICAgICAgICAgICAgLy8gbWF4aW11bSBmcm9udC1iYWNrIGVuZXJneSByYXRpb1xuICAgICAgICAgICAgICAgIHRoaXMudm1pY0NvZWZmcyA9IGNvbXB1dGVTdXBlcmNhcmRDb2VmZnModGhpcy5vcmRlcik7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwiaHlwZXJjYXJkaW9pZFwiOlxuICAgICAgICAgICAgICAgIC8vIG1heGltdW0gZGlyZWN0aXZpdHkgZmFjdG9yXG4gICAgICAgICAgICAgICAgLy8gKHRoaXMgaXMgdGhlIGNsYXNzaWMgcGxhbmUvd2F2ZSBkZWNvbXBvc2l0aW9uIGJlYW1mb3JtZXIsXG4gICAgICAgICAgICAgICAgLy8gYWxzbyB0ZXJtZWQgXCJyZWd1bGFyXCIgaW4gc3BoZXJpY2FsIGJlYW1mb3JtaW5nIGxpdGVyYXR1cmUpXG4gICAgICAgICAgICAgICAgdGhpcy52bWljQ29lZmZzID0gY29tcHV0ZUh5cGVyY2FyZENvZWZmcyh0aGlzLm9yZGVyKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCJtYXhfckVcIjpcbiAgICAgICAgICAgICAgICAvLyBxdWl0ZSBzaW1pbGFyIHRvIG1heGltdW0gZnJvbnQtYmFjayByZWplY3Rpb25cbiAgICAgICAgICAgICAgICB0aGlzLnZtaWNDb2VmZnMgPSBjb21wdXRlTWF4UkVDb2VmZnModGhpcy5vcmRlcik7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIHRoaXMudm1pY1BhdHRlcm4gPSBcImh5cGVyY2FyZGlvaWRcIjtcbiAgICAgICAgICAgICAgICB0aGlzLnZtaWNDb2VmZnMgPSBjb21wdXRlSHlwZXJjYXJkQ29lZmZzKHRoaXMub3JkZXIpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy51cGRhdGVHYWlucygpO1xuICAgIH1cblxuICAgIHVwZGF0ZU9yaWVudGF0aW9uKCkge1xuXG4gICAgICAgIHZhciBhemltID0gdGhpcy5hemltICogTWF0aC5QSSAvIDE4MDtcbiAgICAgICAgdmFyIGVsZXYgPSB0aGlzLmVsZXYgKiBNYXRoLlBJIC8gMTgwO1xuXG4gICAgICAgIHZhciB0ZW1wU0ggPSBqc2hsaWIuY29tcHV0ZVJlYWxTSCh0aGlzLm9yZGVyLCBbIFthemltLCBlbGV2XSBdKTtcblxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubkNoOyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMuU0h4eXpbaV0gPSB0ZW1wU0hbaV1bMF07XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnVwZGF0ZUdhaW5zKCk7XG4gICAgfVxuXG4gICAgdXBkYXRlR2FpbnMoKSB7XG5cbiAgICAgICAgdmFyIHE7XG4gICAgICAgIGZvciAodmFyIG4gPSAwOyBuIDw9IHRoaXMub3JkZXI7IG4rKykge1xuICAgICAgICAgICAgZm9yICh2YXIgbSA9IC1uOyBtIDw9IG47IG0rKykge1xuICAgICAgICAgICAgICAgIHEgPSBuICogbiArIG4gKyBtO1xuICAgICAgICAgICAgICAgIHRoaXMudm1pY0dhaW5zW3FdID0gdGhpcy52bWljQ29lZmZzW25dICogdGhpcy5TSHh5eltxXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5uQ2g7IGkrKykge1xuICAgICAgICAgICAgdGhpcy52bWljR2Fpbk5vZGVzW2ldLmdhaW4udmFsdWUgPSB0aGlzLnZtaWNHYWluc1tpXTtcbiAgICAgICAgfVxuICAgIH1cbn1cbiIsIi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyAgQXJjaG9udGlzIFBvbGl0aXNcbi8vICBhcmNob250aXMucG9saXRpc0BhYWx0by5maVxuLy8gIERhdmlkIFBvaXJpZXItUXVpbm90XG4vLyAgZGF2aXBvaXJAaXJjYW0uZnJcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vL1xuLy8gIFdlYkF1ZGlvX0hPQSBhIEphdmFTY3JpcHQgbGlicmFyeSBmb3IgaGlnaGVyLW9yZGVyIEFtYmlzb25pY3Ncbi8vICBUaGUgbGlicmFyeSBpbXBsZW1lbnRzIFdlYiBBdWRpbyBibG9ja3MgdGhhdCBwZXJmb3JtXG4vLyAgdHlwaWNhbCBhbWJpc29uaWMgcHJvY2Vzc2luZyBvcGVyYXRpb25zIG9uIGF1ZGlvIHNpZ25hbHMuXG4vL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLy8vLy8vLy8vLy8vLy8vL1xuLyogSE9BIExPQURFUiAqL1xuLy8vLy8vLy8vLy8vLy8vL1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBIT0Fsb2FkZXIge1xuICAgIGNvbnN0cnVjdG9yKGNvbnRleHQsIG9yZGVyLCB1cmwsIGNhbGxiYWNrKSB7XG4gICAgICAgIHRoaXMuY29udGV4dCA9IGNvbnRleHQ7XG4gICAgICAgIHRoaXMub3JkZXIgPSBvcmRlcjtcbiAgICAgICAgdGhpcy5uQ2ggPSAob3JkZXIgKyAxKSAqIChvcmRlciArIDEpO1xuICAgICAgICB0aGlzLm5DaEdyb3VwcyA9IE1hdGguY2VpbCh0aGlzLm5DaCAvIDgpO1xuICAgICAgICB0aGlzLmJ1ZmZlcnMgPSBuZXcgQXJyYXkoKTtcbiAgICAgICAgdGhpcy5sb2FkQ291bnQgPSAwO1xuICAgICAgICB0aGlzLmxvYWRlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLm9uTG9hZCA9IGNhbGxiYWNrO1xuICAgICAgICB0aGlzLnVybHMgPSBuZXcgQXJyYXkodGhpcy5uQ2hHcm91cHMpO1xuXG4gICAgICAgIHZhciBmaWxlRXh0ID0gdXJsLnNsaWNlKHVybC5sZW5ndGggLSAzLCB1cmwubGVuZ3RoKTtcbiAgICAgICAgdGhpcy5maWxlRXh0ID0gZmlsZUV4dDtcblxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubkNoR3JvdXBzOyBpKyspIHtcblxuICAgICAgICAgICAgaWYgKGkgPT0gdGhpcy5uQ2hHcm91cHMgLSAxKSB7XG4gICAgICAgICAgICAgICAgdGhpcy51cmxzW2ldID0gdXJsLnNsaWNlKDAsIHVybC5sZW5ndGggLSA0KSArIFwiX1wiICsgcGFkKGkgKiA4ICsgMSwgMikgKyBcIi1cIiArIHBhZCh0aGlzLm5DaCwgMikgKyBcImNoLlwiICsgZmlsZUV4dDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy51cmxzW2ldID0gdXJsLnNsaWNlKDAsIHVybC5sZW5ndGggLSA0KSArIFwiX1wiICsgcGFkKGkgKiA4ICsgMSwgMikgKyBcIi1cIiArIHBhZChpICogOCArIDgsIDIpICsgXCJjaC5cIiArIGZpbGVFeHQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBwYWQobnVtLCBzaXplKSB7XG4gICAgICAgICAgICByZXR1cm4gKCcwMDAwMDAwMDAnICsgbnVtKS5zdWJzdHIoLXNpemUpO1xuICAgICAgICB9XG5cbiAgICB9XG5cbiAgICBsb2FkQnVmZmVycyh1cmwsIGluZGV4KSB7XG4gICAgICAgIC8vIExvYWQgYnVmZmVyIGFzeW5jaHJvbm91c2x5XG4gICAgICAgIHZhciByZXF1ZXN0ID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG4gICAgICAgIHJlcXVlc3Qub3BlbihcIkdFVFwiLCB1cmwsIHRydWUpO1xuICAgICAgICByZXF1ZXN0LnJlc3BvbnNlVHlwZSA9IFwiYXJyYXlidWZmZXJcIjtcblxuICAgICAgICB2YXIgc2NvcGUgPSB0aGlzO1xuXG4gICAgICAgIHJlcXVlc3Qub25sb2FkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAvLyBBc3luY2hyb25vdXNseSBkZWNvZGUgdGhlIGF1ZGlvIGZpbGUgZGF0YSBpbiByZXF1ZXN0LnJlc3BvbnNlXG4gICAgICAgICAgICBzY29wZS5jb250ZXh0LmRlY29kZUF1ZGlvRGF0YShcbiAgICAgICAgICAgICAgICByZXF1ZXN0LnJlc3BvbnNlLFxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uKGJ1ZmZlcikge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWJ1ZmZlcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgYWxlcnQoJ2Vycm9yIGRlY29kaW5nIGZpbGUgZGF0YTogJyArIHVybCk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgc2NvcGUuYnVmZmVyc1tpbmRleF0gPSBidWZmZXI7XG4gICAgICAgICAgICAgICAgICAgIHNjb3BlLmxvYWRDb3VudCsrO1xuICAgICAgICAgICAgICAgICAgICBpZiAoc2NvcGUubG9hZENvdW50ID09IHNjb3BlLm5DaEdyb3Vwcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2NvcGUubG9hZGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNjb3BlLmNvbmNhdEJ1ZmZlcnMoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiSE9BbG9hZGVyOiBhbGwgYnVmZmVycyBsb2FkZWQgYW5kIGNvbmNhdGVuYXRlZFwiKVxuICAgICAgICAgICAgICAgICAgICAgICAgc2NvcGUub25Mb2FkKHNjb3BlLmNvbmNhdEJ1ZmZlcik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIGFsZXJ0KFwiQnJvd3NlciBjYW5ub3QgZGVjb2RlIGF1ZGlvIGRhdGE6ICBcIiArICB1cmwgKyBcIlxcblxcbkVycm9yOiBcIiArIGVycm9yICsgXCJcXG5cXG4oSWYgeW91IHJlIHVzaW5nIFNhZmFyaSBhbmQgZ2V0IGEgbnVsbCBlcnJvciwgdGhpcyBpcyBtb3N0IGxpa2VseSBkdWUgdG8gQXBwbGUncyBzaGFkeSBwbGFuIGdvaW5nIG9uIHRvIHN0b3AgdGhlIC5vZ2cgZm9ybWF0IGZyb20gZWFzaW5nIHdlYiBkZXZlbG9wZXIncyBsaWZlIDopXCIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICByZXF1ZXN0Lm9uZXJyb3IgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGFsZXJ0KCdIT0Fsb2FkZXI6IFhIUiBlcnJvcicpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmVxdWVzdC5zZW5kKCk7XG4gICAgfVxuXG4gICAgbG9hZCgpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm5DaEdyb3VwczsgKytpKSB0aGlzLmxvYWRCdWZmZXJzKHRoaXMudXJsc1tpXSwgaSk7XG4gICAgfVxuXG4gICAgY29uY2F0QnVmZmVycygpIHtcblxuICAgICAgICBpZiAoIXRoaXMubG9hZGVkKSByZXR1cm47XG5cbiAgICAgICAgdmFyIG5DaCA9IHRoaXMubkNoO1xuICAgICAgICB2YXIgbkNoR3JvdXBzID0gdGhpcy5uQ2hHcm91cHM7XG5cbiAgICAgICAgdmFyIGxlbmd0aCA9IHRoaXMuYnVmZmVyc1swXS5sZW5ndGg7XG4gICAgICAgIHRoaXMuYnVmZmVycy5mb3JFYWNoKCAoYikgPT4ge2xlbmd0aCA9IE1hdGgubWF4KGxlbmd0aCwgYi5sZW5ndGgpfSk7XG4gICAgICAgIHZhciBzcmF0ZSA9IHRoaXMuYnVmZmVyc1swXS5zYW1wbGVSYXRlO1xuICAgICAgICBcbiAgICAgICAgLy8gRGV0ZWN0IGlmIHRoZSA4LWNoIGF1ZGlvIGZpbGUgaXMgT0dHIGFuZCBpZiB0aGUgYnJvd3NlciBpcyBDaHJvbWUsXG4gICAgICAgIC8vIHRoZW4gcmVtYXAgOC1jaGFubmVsIGZpbGVzIHRvIHRoZSBjb3JyZWN0IG9yZGVyIGNhdXNlIENocm9tZSBtZXNzZSBpdCB1cCB3aGVuIGxvYWRpbmdcbiAgICAgICAgLy8gRmlyZWZveCBkb2VzIG5vdCBoYXZlIHRoaXMgaXNzdWUuIDhjaCBXYXZlIGZpbGVzIHdvcmsgZmluZSBmb3IgYm90aCBicm93c2Vycy5cbiAgICAgICAgdmFyIHJlbWFwOENoYW5GaWxlID0gWzEsMiwzLDQsNSw2LDcsOF07XG4gICAgICAgIHZhciBpc0Nocm9tZSA9ICEhd2luZG93LmNocm9tZVxuICAgICAgICBpZiAoaXNDaHJvbWUgJiYgdGhpcy5maWxlRXh0LnRvTG93ZXJDYXNlKCkgPT0gXCJvZ2dcIikge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJMb2FkaW5nIG9mIDhjaGFuIE9HRyBmaWxlcyB1c2luZyBDaHJvbWU6IHJlbWFwIGNoYW5uZWxzIHRvIGNvcnJlY3Qgb3JkZXIhXCIpXG4gICAgICAgICAgICByZW1hcDhDaGFuRmlsZSA9IFsxLDMsMiw3LDgsNSw2LDRdO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jb25jYXRCdWZmZXIgPSB0aGlzLmNvbnRleHQuY3JlYXRlQnVmZmVyKG5DaCwgbGVuZ3RoLCBzcmF0ZSk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbkNoR3JvdXBzOyBpKyspIHtcbiAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgdGhpcy5idWZmZXJzW2ldLm51bWJlck9mQ2hhbm5lbHM7IGorKykge1xuICAgICAgICAgICAgICAgIHRoaXMuY29uY2F0QnVmZmVyLmdldENoYW5uZWxEYXRhKGkgKiA4ICsgaikuc2V0KHRoaXMuYnVmZmVyc1tpXS5nZXRDaGFubmVsRGF0YShyZW1hcDhDaGFuRmlsZVtqXS0xKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG4iLCJcbi8vIGV4cG9zZSBmb3IgcGx1Z2luc1xuZXhwb3J0IHsgZGVmYXVsdCBhcyBtb25vRW5jb2RlciB9IGZyb20gJy4vYW1iaS1tb25vRW5jb2Rlcic7XG5leHBvcnQgeyBkZWZhdWx0IGFzIG9yZGVyTGltaXRlciB9IGZyb20gJy4vYW1iaS1vcmRlckxpbWl0ZXInO1xuZXhwb3J0IHsgZGVmYXVsdCBhcyBvcmRlcldlaWdodCB9IGZyb20gJy4vYW1iaS1vcmRlcldlaWdodCc7XG5leHBvcnQgeyBkZWZhdWx0IGFzIHNjZW5lUm90YXRvciB9IGZyb20gJy4vYW1iaS1zY2VuZVJvdGF0b3InO1xuZXhwb3J0IHsgZGVmYXVsdCBhcyBzY2VuZU1pcnJvciB9IGZyb20gJy4vYW1iaS1zY2VuZU1pcnJvcic7XG5leHBvcnQgeyBkZWZhdWx0IGFzIGJpbkRlY29kZXJ9IGZyb20gJy4vYW1iaS1iaW5hdXJhbERlY29kZXInO1xuZXhwb3J0IHsgZGVmYXVsdCBhcyB2aXJ0dWFsTWljIH0gZnJvbSAnLi9hbWJpLXZpcnR1YWxNaWMnO1xuZXhwb3J0IHsgZGVmYXVsdCBhcyBwb3dlcm1hcEFuYWx5c2VyIH0gZnJvbSAnLi9hbWJpLXBvd2VybWFwQW5hbHlzZXInO1xuXG5leHBvcnQgeyBkZWZhdWx0IGFzIEhPQWxvYWRlciB9IGZyb20gJy4vaG9hLWxvYWRlcic7XG5cbmltcG9ydCAqIGFzIF9jb252ZXJ0ZXJzIGZyb20gJy4vYW1iaS1jb252ZXJ0ZXJzJztcbmV4cG9ydCBjb25zdCBjb252ZXJ0ZXJzID0gX2NvbnZlcnRlcnM7XG5cbmV4cG9ydCB7IGRlZmF1bHQgYXMgaW50ZW5zaXR5QW5hbHlzZXJ9IGZyb20gJy4vYW1iaS1pbnRlbnNpdHlBbmFseXNlcic7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHsgXCJkZWZhdWx0XCI6IHJlcXVpcmUoXCJjb3JlLWpzL2xpYnJhcnkvZm4vb2JqZWN0L2RlZmluZS1wcm9wZXJ0eVwiKSwgX19lc01vZHVsZTogdHJ1ZSB9OyIsIlwidXNlIHN0cmljdFwiO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuXG5leHBvcnRzLmRlZmF1bHQgPSBmdW5jdGlvbiAoaW5zdGFuY2UsIENvbnN0cnVjdG9yKSB7XG4gIGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgQ29uc3RydWN0b3IpKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvblwiKTtcbiAgfVxufTsiLCJcInVzZSBzdHJpY3RcIjtcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcblxudmFyIF9kZWZpbmVQcm9wZXJ0eSA9IHJlcXVpcmUoXCIuLi9jb3JlLWpzL29iamVjdC9kZWZpbmUtcHJvcGVydHlcIik7XG5cbnZhciBfZGVmaW5lUHJvcGVydHkyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfZGVmaW5lUHJvcGVydHkpO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyBkZWZhdWx0OiBvYmogfTsgfVxuXG5leHBvcnRzLmRlZmF1bHQgPSBmdW5jdGlvbiAoKSB7XG4gIGZ1bmN0aW9uIGRlZmluZVByb3BlcnRpZXModGFyZ2V0LCBwcm9wcykge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBkZXNjcmlwdG9yID0gcHJvcHNbaV07XG4gICAgICBkZXNjcmlwdG9yLmVudW1lcmFibGUgPSBkZXNjcmlwdG9yLmVudW1lcmFibGUgfHwgZmFsc2U7XG4gICAgICBkZXNjcmlwdG9yLmNvbmZpZ3VyYWJsZSA9IHRydWU7XG4gICAgICBpZiAoXCJ2YWx1ZVwiIGluIGRlc2NyaXB0b3IpIGRlc2NyaXB0b3Iud3JpdGFibGUgPSB0cnVlO1xuICAgICAgKDAsIF9kZWZpbmVQcm9wZXJ0eTIuZGVmYXVsdCkodGFyZ2V0LCBkZXNjcmlwdG9yLmtleSwgZGVzY3JpcHRvcik7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGZ1bmN0aW9uIChDb25zdHJ1Y3RvciwgcHJvdG9Qcm9wcywgc3RhdGljUHJvcHMpIHtcbiAgICBpZiAocHJvdG9Qcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvci5wcm90b3R5cGUsIHByb3RvUHJvcHMpO1xuICAgIGlmIChzdGF0aWNQcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvciwgc3RhdGljUHJvcHMpO1xuICAgIHJldHVybiBDb25zdHJ1Y3RvcjtcbiAgfTtcbn0oKTsiLCJyZXF1aXJlKCcuLi8uLi9tb2R1bGVzL2VzNi5vYmplY3QuZGVmaW5lLXByb3BlcnR5Jyk7XG52YXIgJE9iamVjdCA9IHJlcXVpcmUoJy4uLy4uL21vZHVsZXMvX2NvcmUnKS5PYmplY3Q7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGRlZmluZVByb3BlcnR5KGl0LCBrZXksIGRlc2Mpe1xuICByZXR1cm4gJE9iamVjdC5kZWZpbmVQcm9wZXJ0eShpdCwga2V5LCBkZXNjKTtcbn07IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpdCl7XG4gIGlmKHR5cGVvZiBpdCAhPSAnZnVuY3Rpb24nKXRocm93IFR5cGVFcnJvcihpdCArICcgaXMgbm90IGEgZnVuY3Rpb24hJyk7XG4gIHJldHVybiBpdDtcbn07IiwidmFyIGlzT2JqZWN0ID0gcmVxdWlyZSgnLi9faXMtb2JqZWN0Jyk7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGl0KXtcbiAgaWYoIWlzT2JqZWN0KGl0KSl0aHJvdyBUeXBlRXJyb3IoaXQgKyAnIGlzIG5vdCBhbiBvYmplY3QhJyk7XG4gIHJldHVybiBpdDtcbn07IiwidmFyIGNvcmUgPSBtb2R1bGUuZXhwb3J0cyA9IHt2ZXJzaW9uOiAnMi40LjAnfTtcbmlmKHR5cGVvZiBfX2UgPT0gJ251bWJlcicpX19lID0gY29yZTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bmRlZiIsIi8vIG9wdGlvbmFsIC8gc2ltcGxlIGNvbnRleHQgYmluZGluZ1xudmFyIGFGdW5jdGlvbiA9IHJlcXVpcmUoJy4vX2EtZnVuY3Rpb24nKTtcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oZm4sIHRoYXQsIGxlbmd0aCl7XG4gIGFGdW5jdGlvbihmbik7XG4gIGlmKHRoYXQgPT09IHVuZGVmaW5lZClyZXR1cm4gZm47XG4gIHN3aXRjaChsZW5ndGgpe1xuICAgIGNhc2UgMTogcmV0dXJuIGZ1bmN0aW9uKGEpe1xuICAgICAgcmV0dXJuIGZuLmNhbGwodGhhdCwgYSk7XG4gICAgfTtcbiAgICBjYXNlIDI6IHJldHVybiBmdW5jdGlvbihhLCBiKXtcbiAgICAgIHJldHVybiBmbi5jYWxsKHRoYXQsIGEsIGIpO1xuICAgIH07XG4gICAgY2FzZSAzOiByZXR1cm4gZnVuY3Rpb24oYSwgYiwgYyl7XG4gICAgICByZXR1cm4gZm4uY2FsbCh0aGF0LCBhLCBiLCBjKTtcbiAgICB9O1xuICB9XG4gIHJldHVybiBmdW5jdGlvbigvKiAuLi5hcmdzICovKXtcbiAgICByZXR1cm4gZm4uYXBwbHkodGhhdCwgYXJndW1lbnRzKTtcbiAgfTtcbn07IiwiLy8gVGhhbmsncyBJRTggZm9yIGhpcyBmdW5ueSBkZWZpbmVQcm9wZXJ0eVxubW9kdWxlLmV4cG9ydHMgPSAhcmVxdWlyZSgnLi9fZmFpbHMnKShmdW5jdGlvbigpe1xuICByZXR1cm4gT2JqZWN0LmRlZmluZVByb3BlcnR5KHt9LCAnYScsIHtnZXQ6IGZ1bmN0aW9uKCl7IHJldHVybiA3OyB9fSkuYSAhPSA3O1xufSk7IiwidmFyIGlzT2JqZWN0ID0gcmVxdWlyZSgnLi9faXMtb2JqZWN0JylcbiAgLCBkb2N1bWVudCA9IHJlcXVpcmUoJy4vX2dsb2JhbCcpLmRvY3VtZW50XG4gIC8vIGluIG9sZCBJRSB0eXBlb2YgZG9jdW1lbnQuY3JlYXRlRWxlbWVudCBpcyAnb2JqZWN0J1xuICAsIGlzID0gaXNPYmplY3QoZG9jdW1lbnQpICYmIGlzT2JqZWN0KGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQpO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpdCl7XG4gIHJldHVybiBpcyA/IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoaXQpIDoge307XG59OyIsInZhciBnbG9iYWwgICAgPSByZXF1aXJlKCcuL19nbG9iYWwnKVxuICAsIGNvcmUgICAgICA9IHJlcXVpcmUoJy4vX2NvcmUnKVxuICAsIGN0eCAgICAgICA9IHJlcXVpcmUoJy4vX2N0eCcpXG4gICwgaGlkZSAgICAgID0gcmVxdWlyZSgnLi9faGlkZScpXG4gICwgUFJPVE9UWVBFID0gJ3Byb3RvdHlwZSc7XG5cbnZhciAkZXhwb3J0ID0gZnVuY3Rpb24odHlwZSwgbmFtZSwgc291cmNlKXtcbiAgdmFyIElTX0ZPUkNFRCA9IHR5cGUgJiAkZXhwb3J0LkZcbiAgICAsIElTX0dMT0JBTCA9IHR5cGUgJiAkZXhwb3J0LkdcbiAgICAsIElTX1NUQVRJQyA9IHR5cGUgJiAkZXhwb3J0LlNcbiAgICAsIElTX1BST1RPICA9IHR5cGUgJiAkZXhwb3J0LlBcbiAgICAsIElTX0JJTkQgICA9IHR5cGUgJiAkZXhwb3J0LkJcbiAgICAsIElTX1dSQVAgICA9IHR5cGUgJiAkZXhwb3J0LldcbiAgICAsIGV4cG9ydHMgICA9IElTX0dMT0JBTCA/IGNvcmUgOiBjb3JlW25hbWVdIHx8IChjb3JlW25hbWVdID0ge30pXG4gICAgLCBleHBQcm90byAgPSBleHBvcnRzW1BST1RPVFlQRV1cbiAgICAsIHRhcmdldCAgICA9IElTX0dMT0JBTCA/IGdsb2JhbCA6IElTX1NUQVRJQyA/IGdsb2JhbFtuYW1lXSA6IChnbG9iYWxbbmFtZV0gfHwge30pW1BST1RPVFlQRV1cbiAgICAsIGtleSwgb3duLCBvdXQ7XG4gIGlmKElTX0dMT0JBTClzb3VyY2UgPSBuYW1lO1xuICBmb3Ioa2V5IGluIHNvdXJjZSl7XG4gICAgLy8gY29udGFpbnMgaW4gbmF0aXZlXG4gICAgb3duID0gIUlTX0ZPUkNFRCAmJiB0YXJnZXQgJiYgdGFyZ2V0W2tleV0gIT09IHVuZGVmaW5lZDtcbiAgICBpZihvd24gJiYga2V5IGluIGV4cG9ydHMpY29udGludWU7XG4gICAgLy8gZXhwb3J0IG5hdGl2ZSBvciBwYXNzZWRcbiAgICBvdXQgPSBvd24gPyB0YXJnZXRba2V5XSA6IHNvdXJjZVtrZXldO1xuICAgIC8vIHByZXZlbnQgZ2xvYmFsIHBvbGx1dGlvbiBmb3IgbmFtZXNwYWNlc1xuICAgIGV4cG9ydHNba2V5XSA9IElTX0dMT0JBTCAmJiB0eXBlb2YgdGFyZ2V0W2tleV0gIT0gJ2Z1bmN0aW9uJyA/IHNvdXJjZVtrZXldXG4gICAgLy8gYmluZCB0aW1lcnMgdG8gZ2xvYmFsIGZvciBjYWxsIGZyb20gZXhwb3J0IGNvbnRleHRcbiAgICA6IElTX0JJTkQgJiYgb3duID8gY3R4KG91dCwgZ2xvYmFsKVxuICAgIC8vIHdyYXAgZ2xvYmFsIGNvbnN0cnVjdG9ycyBmb3IgcHJldmVudCBjaGFuZ2UgdGhlbSBpbiBsaWJyYXJ5XG4gICAgOiBJU19XUkFQICYmIHRhcmdldFtrZXldID09IG91dCA/IChmdW5jdGlvbihDKXtcbiAgICAgIHZhciBGID0gZnVuY3Rpb24oYSwgYiwgYyl7XG4gICAgICAgIGlmKHRoaXMgaW5zdGFuY2VvZiBDKXtcbiAgICAgICAgICBzd2l0Y2goYXJndW1lbnRzLmxlbmd0aCl7XG4gICAgICAgICAgICBjYXNlIDA6IHJldHVybiBuZXcgQztcbiAgICAgICAgICAgIGNhc2UgMTogcmV0dXJuIG5ldyBDKGEpO1xuICAgICAgICAgICAgY2FzZSAyOiByZXR1cm4gbmV3IEMoYSwgYik7XG4gICAgICAgICAgfSByZXR1cm4gbmV3IEMoYSwgYiwgYyk7XG4gICAgICAgIH0gcmV0dXJuIEMuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgIH07XG4gICAgICBGW1BST1RPVFlQRV0gPSBDW1BST1RPVFlQRV07XG4gICAgICByZXR1cm4gRjtcbiAgICAvLyBtYWtlIHN0YXRpYyB2ZXJzaW9ucyBmb3IgcHJvdG90eXBlIG1ldGhvZHNcbiAgICB9KShvdXQpIDogSVNfUFJPVE8gJiYgdHlwZW9mIG91dCA9PSAnZnVuY3Rpb24nID8gY3R4KEZ1bmN0aW9uLmNhbGwsIG91dCkgOiBvdXQ7XG4gICAgLy8gZXhwb3J0IHByb3RvIG1ldGhvZHMgdG8gY29yZS4lQ09OU1RSVUNUT1IlLm1ldGhvZHMuJU5BTUUlXG4gICAgaWYoSVNfUFJPVE8pe1xuICAgICAgKGV4cG9ydHMudmlydHVhbCB8fCAoZXhwb3J0cy52aXJ0dWFsID0ge30pKVtrZXldID0gb3V0O1xuICAgICAgLy8gZXhwb3J0IHByb3RvIG1ldGhvZHMgdG8gY29yZS4lQ09OU1RSVUNUT1IlLnByb3RvdHlwZS4lTkFNRSVcbiAgICAgIGlmKHR5cGUgJiAkZXhwb3J0LlIgJiYgZXhwUHJvdG8gJiYgIWV4cFByb3RvW2tleV0paGlkZShleHBQcm90bywga2V5LCBvdXQpO1xuICAgIH1cbiAgfVxufTtcbi8vIHR5cGUgYml0bWFwXG4kZXhwb3J0LkYgPSAxOyAgIC8vIGZvcmNlZFxuJGV4cG9ydC5HID0gMjsgICAvLyBnbG9iYWxcbiRleHBvcnQuUyA9IDQ7ICAgLy8gc3RhdGljXG4kZXhwb3J0LlAgPSA4OyAgIC8vIHByb3RvXG4kZXhwb3J0LkIgPSAxNjsgIC8vIGJpbmRcbiRleHBvcnQuVyA9IDMyOyAgLy8gd3JhcFxuJGV4cG9ydC5VID0gNjQ7ICAvLyBzYWZlXG4kZXhwb3J0LlIgPSAxMjg7IC8vIHJlYWwgcHJvdG8gbWV0aG9kIGZvciBgbGlicmFyeWAgXG5tb2R1bGUuZXhwb3J0cyA9ICRleHBvcnQ7IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihleGVjKXtcbiAgdHJ5IHtcbiAgICByZXR1cm4gISFleGVjKCk7XG4gIH0gY2F0Y2goZSl7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbn07IiwiLy8gaHR0cHM6Ly9naXRodWIuY29tL3psb2lyb2NrL2NvcmUtanMvaXNzdWVzLzg2I2lzc3VlY29tbWVudC0xMTU3NTkwMjhcbnZhciBnbG9iYWwgPSBtb2R1bGUuZXhwb3J0cyA9IHR5cGVvZiB3aW5kb3cgIT0gJ3VuZGVmaW5lZCcgJiYgd2luZG93Lk1hdGggPT0gTWF0aFxuICA/IHdpbmRvdyA6IHR5cGVvZiBzZWxmICE9ICd1bmRlZmluZWQnICYmIHNlbGYuTWF0aCA9PSBNYXRoID8gc2VsZiA6IEZ1bmN0aW9uKCdyZXR1cm4gdGhpcycpKCk7XG5pZih0eXBlb2YgX19nID09ICdudW1iZXInKV9fZyA9IGdsb2JhbDsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bmRlZiIsInZhciBkUCAgICAgICAgID0gcmVxdWlyZSgnLi9fb2JqZWN0LWRwJylcbiAgLCBjcmVhdGVEZXNjID0gcmVxdWlyZSgnLi9fcHJvcGVydHktZGVzYycpO1xubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL19kZXNjcmlwdG9ycycpID8gZnVuY3Rpb24ob2JqZWN0LCBrZXksIHZhbHVlKXtcbiAgcmV0dXJuIGRQLmYob2JqZWN0LCBrZXksIGNyZWF0ZURlc2MoMSwgdmFsdWUpKTtcbn0gOiBmdW5jdGlvbihvYmplY3QsIGtleSwgdmFsdWUpe1xuICBvYmplY3Rba2V5XSA9IHZhbHVlO1xuICByZXR1cm4gb2JqZWN0O1xufTsiLCJtb2R1bGUuZXhwb3J0cyA9ICFyZXF1aXJlKCcuL19kZXNjcmlwdG9ycycpICYmICFyZXF1aXJlKCcuL19mYWlscycpKGZ1bmN0aW9uKCl7XHJcbiAgcmV0dXJuIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShyZXF1aXJlKCcuL19kb20tY3JlYXRlJykoJ2RpdicpLCAnYScsIHtnZXQ6IGZ1bmN0aW9uKCl7IHJldHVybiA3OyB9fSkuYSAhPSA3O1xyXG59KTsiLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGl0KXtcbiAgcmV0dXJuIHR5cGVvZiBpdCA9PT0gJ29iamVjdCcgPyBpdCAhPT0gbnVsbCA6IHR5cGVvZiBpdCA9PT0gJ2Z1bmN0aW9uJztcbn07IiwidmFyIGFuT2JqZWN0ICAgICAgID0gcmVxdWlyZSgnLi9fYW4tb2JqZWN0JylcbiAgLCBJRThfRE9NX0RFRklORSA9IHJlcXVpcmUoJy4vX2llOC1kb20tZGVmaW5lJylcbiAgLCB0b1ByaW1pdGl2ZSAgICA9IHJlcXVpcmUoJy4vX3RvLXByaW1pdGl2ZScpXG4gICwgZFAgICAgICAgICAgICAgPSBPYmplY3QuZGVmaW5lUHJvcGVydHk7XG5cbmV4cG9ydHMuZiA9IHJlcXVpcmUoJy4vX2Rlc2NyaXB0b3JzJykgPyBPYmplY3QuZGVmaW5lUHJvcGVydHkgOiBmdW5jdGlvbiBkZWZpbmVQcm9wZXJ0eShPLCBQLCBBdHRyaWJ1dGVzKXtcbiAgYW5PYmplY3QoTyk7XG4gIFAgPSB0b1ByaW1pdGl2ZShQLCB0cnVlKTtcbiAgYW5PYmplY3QoQXR0cmlidXRlcyk7XG4gIGlmKElFOF9ET01fREVGSU5FKXRyeSB7XG4gICAgcmV0dXJuIGRQKE8sIFAsIEF0dHJpYnV0ZXMpO1xuICB9IGNhdGNoKGUpeyAvKiBlbXB0eSAqLyB9XG4gIGlmKCdnZXQnIGluIEF0dHJpYnV0ZXMgfHwgJ3NldCcgaW4gQXR0cmlidXRlcyl0aHJvdyBUeXBlRXJyb3IoJ0FjY2Vzc29ycyBub3Qgc3VwcG9ydGVkIScpO1xuICBpZigndmFsdWUnIGluIEF0dHJpYnV0ZXMpT1tQXSA9IEF0dHJpYnV0ZXMudmFsdWU7XG4gIHJldHVybiBPO1xufTsiLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGJpdG1hcCwgdmFsdWUpe1xuICByZXR1cm4ge1xuICAgIGVudW1lcmFibGUgIDogIShiaXRtYXAgJiAxKSxcbiAgICBjb25maWd1cmFibGU6ICEoYml0bWFwICYgMiksXG4gICAgd3JpdGFibGUgICAgOiAhKGJpdG1hcCAmIDQpLFxuICAgIHZhbHVlICAgICAgIDogdmFsdWVcbiAgfTtcbn07IiwiLy8gNy4xLjEgVG9QcmltaXRpdmUoaW5wdXQgWywgUHJlZmVycmVkVHlwZV0pXG52YXIgaXNPYmplY3QgPSByZXF1aXJlKCcuL19pcy1vYmplY3QnKTtcbi8vIGluc3RlYWQgb2YgdGhlIEVTNiBzcGVjIHZlcnNpb24sIHdlIGRpZG4ndCBpbXBsZW1lbnQgQEB0b1ByaW1pdGl2ZSBjYXNlXG4vLyBhbmQgdGhlIHNlY29uZCBhcmd1bWVudCAtIGZsYWcgLSBwcmVmZXJyZWQgdHlwZSBpcyBhIHN0cmluZ1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpdCwgUyl7XG4gIGlmKCFpc09iamVjdChpdCkpcmV0dXJuIGl0O1xuICB2YXIgZm4sIHZhbDtcbiAgaWYoUyAmJiB0eXBlb2YgKGZuID0gaXQudG9TdHJpbmcpID09ICdmdW5jdGlvbicgJiYgIWlzT2JqZWN0KHZhbCA9IGZuLmNhbGwoaXQpKSlyZXR1cm4gdmFsO1xuICBpZih0eXBlb2YgKGZuID0gaXQudmFsdWVPZikgPT0gJ2Z1bmN0aW9uJyAmJiAhaXNPYmplY3QodmFsID0gZm4uY2FsbChpdCkpKXJldHVybiB2YWw7XG4gIGlmKCFTICYmIHR5cGVvZiAoZm4gPSBpdC50b1N0cmluZykgPT0gJ2Z1bmN0aW9uJyAmJiAhaXNPYmplY3QodmFsID0gZm4uY2FsbChpdCkpKXJldHVybiB2YWw7XG4gIHRocm93IFR5cGVFcnJvcihcIkNhbid0IGNvbnZlcnQgb2JqZWN0IHRvIHByaW1pdGl2ZSB2YWx1ZVwiKTtcbn07IiwidmFyICRleHBvcnQgPSByZXF1aXJlKCcuL19leHBvcnQnKTtcclxuLy8gMTkuMS4yLjQgLyAxNS4yLjMuNiBPYmplY3QuZGVmaW5lUHJvcGVydHkoTywgUCwgQXR0cmlidXRlcylcclxuJGV4cG9ydCgkZXhwb3J0LlMgKyAkZXhwb3J0LkYgKiAhcmVxdWlyZSgnLi9fZGVzY3JpcHRvcnMnKSwgJ09iamVjdCcsIHtkZWZpbmVQcm9wZXJ0eTogcmVxdWlyZSgnLi9fb2JqZWN0LWRwJykuZn0pOyIsIlwidXNlIHN0cmljdFwiO1xuXG5pZiAoZ2xvYmFsLkFuYWx5c2VyTm9kZSAmJiAhZ2xvYmFsLkFuYWx5c2VyTm9kZS5wcm90b3R5cGUuZ2V0RmxvYXRUaW1lRG9tYWluRGF0YSkge1xuICB2YXIgdWludDggPSBuZXcgVWludDhBcnJheSgyMDQ4KTtcbiAgZ2xvYmFsLkFuYWx5c2VyTm9kZS5wcm90b3R5cGUuZ2V0RmxvYXRUaW1lRG9tYWluRGF0YSA9IGZ1bmN0aW9uKGFycmF5KSB7XG4gICAgdGhpcy5nZXRCeXRlVGltZURvbWFpbkRhdGEodWludDgpO1xuICAgIGZvciAodmFyIGkgPSAwLCBpbWF4ID0gYXJyYXkubGVuZ3RoOyBpIDwgaW1heDsgaSsrKSB7XG4gICAgICBhcnJheVtpXSA9ICh1aW50OFtpXSAtIDEyOCkgKiAwLjAwNzgxMjU7XG4gICAgfVxuICB9O1xufVxuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBudW1lcmljID0gKHR5cGVvZiBleHBvcnRzID09PSBcInVuZGVmaW5lZFwiKT8oZnVuY3Rpb24gbnVtZXJpYygpIHt9KTooZXhwb3J0cyk7XG5pZih0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiKSB7IGdsb2JhbC5udW1lcmljID0gbnVtZXJpYzsgfVxuXG5udW1lcmljLnZlcnNpb24gPSBcIjEuMi42XCI7XG5cbi8vIDEuIFV0aWxpdHkgZnVuY3Rpb25zXG5udW1lcmljLmJlbmNoID0gZnVuY3Rpb24gYmVuY2ggKGYsaW50ZXJ2YWwpIHtcbiAgICB2YXIgdDEsdDIsbixpO1xuICAgIGlmKHR5cGVvZiBpbnRlcnZhbCA9PT0gXCJ1bmRlZmluZWRcIikgeyBpbnRlcnZhbCA9IDE1OyB9XG4gICAgbiA9IDAuNTtcbiAgICB0MSA9IG5ldyBEYXRlKCk7XG4gICAgd2hpbGUoMSkge1xuICAgICAgICBuKj0yO1xuICAgICAgICBmb3IoaT1uO2k+MztpLT00KSB7IGYoKTsgZigpOyBmKCk7IGYoKTsgfVxuICAgICAgICB3aGlsZShpPjApIHsgZigpOyBpLS07IH1cbiAgICAgICAgdDIgPSBuZXcgRGF0ZSgpO1xuICAgICAgICBpZih0Mi10MSA+IGludGVydmFsKSBicmVhaztcbiAgICB9XG4gICAgZm9yKGk9bjtpPjM7aS09NCkgeyBmKCk7IGYoKTsgZigpOyBmKCk7IH1cbiAgICB3aGlsZShpPjApIHsgZigpOyBpLS07IH1cbiAgICB0MiA9IG5ldyBEYXRlKCk7XG4gICAgcmV0dXJuIDEwMDAqKDMqbi0xKS8odDItdDEpO1xufVxuXG5udW1lcmljLl9teUluZGV4T2YgPSAoZnVuY3Rpb24gX215SW5kZXhPZih3KSB7XG4gICAgdmFyIG4gPSB0aGlzLmxlbmd0aCxrO1xuICAgIGZvcihrPTA7azxuOysraykgaWYodGhpc1trXT09PXcpIHJldHVybiBrO1xuICAgIHJldHVybiAtMTtcbn0pO1xubnVtZXJpYy5teUluZGV4T2YgPSAoQXJyYXkucHJvdG90eXBlLmluZGV4T2YpP0FycmF5LnByb3RvdHlwZS5pbmRleE9mOm51bWVyaWMuX215SW5kZXhPZjtcblxubnVtZXJpYy5GdW5jdGlvbiA9IEZ1bmN0aW9uO1xubnVtZXJpYy5wcmVjaXNpb24gPSA0O1xubnVtZXJpYy5sYXJnZUFycmF5ID0gNTA7XG5cbm51bWVyaWMucHJldHR5UHJpbnQgPSBmdW5jdGlvbiBwcmV0dHlQcmludCh4KSB7XG4gICAgZnVuY3Rpb24gZm10bnVtKHgpIHtcbiAgICAgICAgaWYoeCA9PT0gMCkgeyByZXR1cm4gJzAnOyB9XG4gICAgICAgIGlmKGlzTmFOKHgpKSB7IHJldHVybiAnTmFOJzsgfVxuICAgICAgICBpZih4PDApIHsgcmV0dXJuICctJytmbXRudW0oLXgpOyB9XG4gICAgICAgIGlmKGlzRmluaXRlKHgpKSB7XG4gICAgICAgICAgICB2YXIgc2NhbGUgPSBNYXRoLmZsb29yKE1hdGgubG9nKHgpIC8gTWF0aC5sb2coMTApKTtcbiAgICAgICAgICAgIHZhciBub3JtYWxpemVkID0geCAvIE1hdGgucG93KDEwLHNjYWxlKTtcbiAgICAgICAgICAgIHZhciBiYXNpYyA9IG5vcm1hbGl6ZWQudG9QcmVjaXNpb24obnVtZXJpYy5wcmVjaXNpb24pO1xuICAgICAgICAgICAgaWYocGFyc2VGbG9hdChiYXNpYykgPT09IDEwKSB7IHNjYWxlKys7IG5vcm1hbGl6ZWQgPSAxOyBiYXNpYyA9IG5vcm1hbGl6ZWQudG9QcmVjaXNpb24obnVtZXJpYy5wcmVjaXNpb24pOyB9XG4gICAgICAgICAgICByZXR1cm4gcGFyc2VGbG9hdChiYXNpYykudG9TdHJpbmcoKSsnZScrc2NhbGUudG9TdHJpbmcoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gJ0luZmluaXR5JztcbiAgICB9XG4gICAgdmFyIHJldCA9IFtdO1xuICAgIGZ1bmN0aW9uIGZvbyh4KSB7XG4gICAgICAgIHZhciBrO1xuICAgICAgICBpZih0eXBlb2YgeCA9PT0gXCJ1bmRlZmluZWRcIikgeyByZXQucHVzaChBcnJheShudW1lcmljLnByZWNpc2lvbis4KS5qb2luKCcgJykpOyByZXR1cm4gZmFsc2U7IH1cbiAgICAgICAgaWYodHlwZW9mIHggPT09IFwic3RyaW5nXCIpIHsgcmV0LnB1c2goJ1wiJyt4KydcIicpOyByZXR1cm4gZmFsc2U7IH1cbiAgICAgICAgaWYodHlwZW9mIHggPT09IFwiYm9vbGVhblwiKSB7IHJldC5wdXNoKHgudG9TdHJpbmcoKSk7IHJldHVybiBmYWxzZTsgfVxuICAgICAgICBpZih0eXBlb2YgeCA9PT0gXCJudW1iZXJcIikge1xuICAgICAgICAgICAgdmFyIGEgPSBmbXRudW0oeCk7XG4gICAgICAgICAgICB2YXIgYiA9IHgudG9QcmVjaXNpb24obnVtZXJpYy5wcmVjaXNpb24pO1xuICAgICAgICAgICAgdmFyIGMgPSBwYXJzZUZsb2F0KHgudG9TdHJpbmcoKSkudG9TdHJpbmcoKTtcbiAgICAgICAgICAgIHZhciBkID0gW2EsYixjLHBhcnNlRmxvYXQoYikudG9TdHJpbmcoKSxwYXJzZUZsb2F0KGMpLnRvU3RyaW5nKCldO1xuICAgICAgICAgICAgZm9yKGs9MTtrPGQubGVuZ3RoO2srKykgeyBpZihkW2tdLmxlbmd0aCA8IGEubGVuZ3RoKSBhID0gZFtrXTsgfVxuICAgICAgICAgICAgcmV0LnB1c2goQXJyYXkobnVtZXJpYy5wcmVjaXNpb24rOC1hLmxlbmd0aCkuam9pbignICcpK2EpO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGlmKHggPT09IG51bGwpIHsgcmV0LnB1c2goXCJudWxsXCIpOyByZXR1cm4gZmFsc2U7IH1cbiAgICAgICAgaWYodHlwZW9mIHggPT09IFwiZnVuY3Rpb25cIikgeyBcbiAgICAgICAgICAgIHJldC5wdXNoKHgudG9TdHJpbmcoKSk7XG4gICAgICAgICAgICB2YXIgZmxhZyA9IGZhbHNlO1xuICAgICAgICAgICAgZm9yKGsgaW4geCkgeyBpZih4Lmhhc093blByb3BlcnR5KGspKSB7IFxuICAgICAgICAgICAgICAgIGlmKGZsYWcpIHJldC5wdXNoKCcsXFxuJyk7XG4gICAgICAgICAgICAgICAgZWxzZSByZXQucHVzaCgnXFxueycpO1xuICAgICAgICAgICAgICAgIGZsYWcgPSB0cnVlOyBcbiAgICAgICAgICAgICAgICByZXQucHVzaChrKTsgXG4gICAgICAgICAgICAgICAgcmV0LnB1c2goJzogXFxuJyk7IFxuICAgICAgICAgICAgICAgIGZvbyh4W2tdKTsgXG4gICAgICAgICAgICB9IH1cbiAgICAgICAgICAgIGlmKGZsYWcpIHJldC5wdXNoKCd9XFxuJyk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBpZih4IGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgICAgICAgIGlmKHgubGVuZ3RoID4gbnVtZXJpYy5sYXJnZUFycmF5KSB7IHJldC5wdXNoKCcuLi5MYXJnZSBBcnJheS4uLicpOyByZXR1cm4gdHJ1ZTsgfVxuICAgICAgICAgICAgdmFyIGZsYWcgPSBmYWxzZTtcbiAgICAgICAgICAgIHJldC5wdXNoKCdbJyk7XG4gICAgICAgICAgICBmb3Ioaz0wO2s8eC5sZW5ndGg7aysrKSB7IGlmKGs+MCkgeyByZXQucHVzaCgnLCcpOyBpZihmbGFnKSByZXQucHVzaCgnXFxuICcpOyB9IGZsYWcgPSBmb28oeFtrXSk7IH1cbiAgICAgICAgICAgIHJldC5wdXNoKCddJyk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXQucHVzaCgneycpO1xuICAgICAgICB2YXIgZmxhZyA9IGZhbHNlO1xuICAgICAgICBmb3IoayBpbiB4KSB7IGlmKHguaGFzT3duUHJvcGVydHkoaykpIHsgaWYoZmxhZykgcmV0LnB1c2goJyxcXG4nKTsgZmxhZyA9IHRydWU7IHJldC5wdXNoKGspOyByZXQucHVzaCgnOiBcXG4nKTsgZm9vKHhba10pOyB9IH1cbiAgICAgICAgcmV0LnB1c2goJ30nKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIGZvbyh4KTtcbiAgICByZXR1cm4gcmV0LmpvaW4oJycpO1xufVxuXG5udW1lcmljLnBhcnNlRGF0ZSA9IGZ1bmN0aW9uIHBhcnNlRGF0ZShkKSB7XG4gICAgZnVuY3Rpb24gZm9vKGQpIHtcbiAgICAgICAgaWYodHlwZW9mIGQgPT09ICdzdHJpbmcnKSB7IHJldHVybiBEYXRlLnBhcnNlKGQucmVwbGFjZSgvLS9nLCcvJykpOyB9XG4gICAgICAgIGlmKCEoZCBpbnN0YW5jZW9mIEFycmF5KSkgeyB0aHJvdyBuZXcgRXJyb3IoXCJwYXJzZURhdGU6IHBhcmFtZXRlciBtdXN0IGJlIGFycmF5cyBvZiBzdHJpbmdzXCIpOyB9XG4gICAgICAgIHZhciByZXQgPSBbXSxrO1xuICAgICAgICBmb3Ioaz0wO2s8ZC5sZW5ndGg7aysrKSB7IHJldFtrXSA9IGZvbyhkW2tdKTsgfVxuICAgICAgICByZXR1cm4gcmV0O1xuICAgIH1cbiAgICByZXR1cm4gZm9vKGQpO1xufVxuXG5udW1lcmljLnBhcnNlRmxvYXQgPSBmdW5jdGlvbiBwYXJzZUZsb2F0XyhkKSB7XG4gICAgZnVuY3Rpb24gZm9vKGQpIHtcbiAgICAgICAgaWYodHlwZW9mIGQgPT09ICdzdHJpbmcnKSB7IHJldHVybiBwYXJzZUZsb2F0KGQpOyB9XG4gICAgICAgIGlmKCEoZCBpbnN0YW5jZW9mIEFycmF5KSkgeyB0aHJvdyBuZXcgRXJyb3IoXCJwYXJzZUZsb2F0OiBwYXJhbWV0ZXIgbXVzdCBiZSBhcnJheXMgb2Ygc3RyaW5nc1wiKTsgfVxuICAgICAgICB2YXIgcmV0ID0gW10saztcbiAgICAgICAgZm9yKGs9MDtrPGQubGVuZ3RoO2srKykgeyByZXRba10gPSBmb28oZFtrXSk7IH1cbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9XG4gICAgcmV0dXJuIGZvbyhkKTtcbn1cblxubnVtZXJpYy5wYXJzZUNTViA9IGZ1bmN0aW9uIHBhcnNlQ1NWKHQpIHtcbiAgICB2YXIgZm9vID0gdC5zcGxpdCgnXFxuJyk7XG4gICAgdmFyIGosaztcbiAgICB2YXIgcmV0ID0gW107XG4gICAgdmFyIHBhdCA9IC8oKFteJ1wiLF0qKXwoJ1teJ10qJyl8KFwiW15cIl0qXCIpKSwvZztcbiAgICB2YXIgcGF0bnVtID0gL15cXHMqKChbKy1dP1swLTldKyhcXC5bMC05XSopPyhlWystXT9bMC05XSspPyl8KFsrLV0/WzAtOV0qKFxcLlswLTldKyk/KGVbKy1dP1swLTldKyk/KSlcXHMqJC87XG4gICAgdmFyIHN0cmlwcGVyID0gZnVuY3Rpb24obikgeyByZXR1cm4gbi5zdWJzdHIoMCxuLmxlbmd0aC0xKTsgfVxuICAgIHZhciBjb3VudCA9IDA7XG4gICAgZm9yKGs9MDtrPGZvby5sZW5ndGg7aysrKSB7XG4gICAgICB2YXIgYmFyID0gKGZvb1trXStcIixcIikubWF0Y2gocGF0KSxiYXo7XG4gICAgICBpZihiYXIubGVuZ3RoPjApIHtcbiAgICAgICAgICByZXRbY291bnRdID0gW107XG4gICAgICAgICAgZm9yKGo9MDtqPGJhci5sZW5ndGg7aisrKSB7XG4gICAgICAgICAgICAgIGJheiA9IHN0cmlwcGVyKGJhcltqXSk7XG4gICAgICAgICAgICAgIGlmKHBhdG51bS50ZXN0KGJheikpIHsgcmV0W2NvdW50XVtqXSA9IHBhcnNlRmxvYXQoYmF6KTsgfVxuICAgICAgICAgICAgICBlbHNlIHJldFtjb3VudF1bal0gPSBiYXo7XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvdW50Kys7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXQ7XG59XG5cbm51bWVyaWMudG9DU1YgPSBmdW5jdGlvbiB0b0NTVihBKSB7XG4gICAgdmFyIHMgPSBudW1lcmljLmRpbShBKTtcbiAgICB2YXIgaSxqLG0sbixyb3cscmV0O1xuICAgIG0gPSBzWzBdO1xuICAgIG4gPSBzWzFdO1xuICAgIHJldCA9IFtdO1xuICAgIGZvcihpPTA7aTxtO2krKykge1xuICAgICAgICByb3cgPSBbXTtcbiAgICAgICAgZm9yKGo9MDtqPG07aisrKSB7IHJvd1tqXSA9IEFbaV1bal0udG9TdHJpbmcoKTsgfVxuICAgICAgICByZXRbaV0gPSByb3cuam9pbignLCAnKTtcbiAgICB9XG4gICAgcmV0dXJuIHJldC5qb2luKCdcXG4nKSsnXFxuJztcbn1cblxubnVtZXJpYy5nZXRVUkwgPSBmdW5jdGlvbiBnZXRVUkwodXJsKSB7XG4gICAgdmFyIGNsaWVudCA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuICAgIGNsaWVudC5vcGVuKFwiR0VUXCIsdXJsLGZhbHNlKTtcbiAgICBjbGllbnQuc2VuZCgpO1xuICAgIHJldHVybiBjbGllbnQ7XG59XG5cbm51bWVyaWMuaW1hZ2VVUkwgPSBmdW5jdGlvbiBpbWFnZVVSTChpbWcpIHtcbiAgICBmdW5jdGlvbiBiYXNlNjQoQSkge1xuICAgICAgICB2YXIgbiA9IEEubGVuZ3RoLCBpLHgseSx6LHAscSxyLHM7XG4gICAgICAgIHZhciBrZXkgPSBcIkFCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXowMTIzNDU2Nzg5Ky89XCI7XG4gICAgICAgIHZhciByZXQgPSBcIlwiO1xuICAgICAgICBmb3IoaT0wO2k8bjtpKz0zKSB7XG4gICAgICAgICAgICB4ID0gQVtpXTtcbiAgICAgICAgICAgIHkgPSBBW2krMV07XG4gICAgICAgICAgICB6ID0gQVtpKzJdO1xuICAgICAgICAgICAgcCA9IHggPj4gMjtcbiAgICAgICAgICAgIHEgPSAoKHggJiAzKSA8PCA0KSArICh5ID4+IDQpO1xuICAgICAgICAgICAgciA9ICgoeSAmIDE1KSA8PCAyKSArICh6ID4+IDYpO1xuICAgICAgICAgICAgcyA9IHogJiA2MztcbiAgICAgICAgICAgIGlmKGkrMT49bikgeyByID0gcyA9IDY0OyB9XG4gICAgICAgICAgICBlbHNlIGlmKGkrMj49bikgeyBzID0gNjQ7IH1cbiAgICAgICAgICAgIHJldCArPSBrZXkuY2hhckF0KHApICsga2V5LmNoYXJBdChxKSArIGtleS5jaGFyQXQocikgKyBrZXkuY2hhckF0KHMpO1xuICAgICAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmV0O1xuICAgIH1cbiAgICBmdW5jdGlvbiBjcmMzMkFycmF5IChhLGZyb20sdG8pIHtcbiAgICAgICAgaWYodHlwZW9mIGZyb20gPT09IFwidW5kZWZpbmVkXCIpIHsgZnJvbSA9IDA7IH1cbiAgICAgICAgaWYodHlwZW9mIHRvID09PSBcInVuZGVmaW5lZFwiKSB7IHRvID0gYS5sZW5ndGg7IH1cbiAgICAgICAgdmFyIHRhYmxlID0gWzB4MDAwMDAwMDAsIDB4NzcwNzMwOTYsIDB4RUUwRTYxMkMsIDB4OTkwOTUxQkEsIDB4MDc2REM0MTksIDB4NzA2QUY0OEYsIDB4RTk2M0E1MzUsIDB4OUU2NDk1QTMsXG4gICAgICAgICAgICAgICAgICAgICAweDBFREI4ODMyLCAweDc5RENCOEE0LCAweEUwRDVFOTFFLCAweDk3RDJEOTg4LCAweDA5QjY0QzJCLCAweDdFQjE3Q0JELCAweEU3QjgyRDA3LCAweDkwQkYxRDkxLCBcbiAgICAgICAgICAgICAgICAgICAgIDB4MURCNzEwNjQsIDB4NkFCMDIwRjIsIDB4RjNCOTcxNDgsIDB4ODRCRTQxREUsIDB4MUFEQUQ0N0QsIDB4NkREREU0RUIsIDB4RjRENEI1NTEsIDB4ODNEMzg1QzcsXG4gICAgICAgICAgICAgICAgICAgICAweDEzNkM5ODU2LCAweDY0NkJBOEMwLCAweEZENjJGOTdBLCAweDhBNjVDOUVDLCAweDE0MDE1QzRGLCAweDYzMDY2Q0Q5LCAweEZBMEYzRDYzLCAweDhEMDgwREY1LCBcbiAgICAgICAgICAgICAgICAgICAgIDB4M0I2RTIwQzgsIDB4NEM2OTEwNUUsIDB4RDU2MDQxRTQsIDB4QTI2NzcxNzIsIDB4M0MwM0U0RDEsIDB4NEIwNEQ0NDcsIDB4RDIwRDg1RkQsIDB4QTUwQUI1NkIsIFxuICAgICAgICAgICAgICAgICAgICAgMHgzNUI1QThGQSwgMHg0MkIyOTg2QywgMHhEQkJCQzlENiwgMHhBQ0JDRjk0MCwgMHgzMkQ4NkNFMywgMHg0NURGNUM3NSwgMHhEQ0Q2MERDRiwgMHhBQkQxM0Q1OSwgXG4gICAgICAgICAgICAgICAgICAgICAweDI2RDkzMEFDLCAweDUxREUwMDNBLCAweEM4RDc1MTgwLCAweEJGRDA2MTE2LCAweDIxQjRGNEI1LCAweDU2QjNDNDIzLCAweENGQkE5NTk5LCAweEI4QkRBNTBGLFxuICAgICAgICAgICAgICAgICAgICAgMHgyODAyQjg5RSwgMHg1RjA1ODgwOCwgMHhDNjBDRDlCMiwgMHhCMTBCRTkyNCwgMHgyRjZGN0M4NywgMHg1ODY4NEMxMSwgMHhDMTYxMURBQiwgMHhCNjY2MkQzRCxcbiAgICAgICAgICAgICAgICAgICAgIDB4NzZEQzQxOTAsIDB4MDFEQjcxMDYsIDB4OThEMjIwQkMsIDB4RUZENTEwMkEsIDB4NzFCMTg1ODksIDB4MDZCNkI1MUYsIDB4OUZCRkU0QTUsIDB4RThCOEQ0MzMsXG4gICAgICAgICAgICAgICAgICAgICAweDc4MDdDOUEyLCAweDBGMDBGOTM0LCAweDk2MDlBODhFLCAweEUxMEU5ODE4LCAweDdGNkEwREJCLCAweDA4NkQzRDJELCAweDkxNjQ2Qzk3LCAweEU2NjM1QzAxLCBcbiAgICAgICAgICAgICAgICAgICAgIDB4NkI2QjUxRjQsIDB4MUM2QzYxNjIsIDB4ODU2NTMwRDgsIDB4RjI2MjAwNEUsIDB4NkMwNjk1RUQsIDB4MUIwMUE1N0IsIDB4ODIwOEY0QzEsIDB4RjUwRkM0NTcsIFxuICAgICAgICAgICAgICAgICAgICAgMHg2NUIwRDlDNiwgMHgxMkI3RTk1MCwgMHg4QkJFQjhFQSwgMHhGQ0I5ODg3QywgMHg2MkREMURERiwgMHgxNURBMkQ0OSwgMHg4Q0QzN0NGMywgMHhGQkQ0NEM2NSwgXG4gICAgICAgICAgICAgICAgICAgICAweDREQjI2MTU4LCAweDNBQjU1MUNFLCAweEEzQkMwMDc0LCAweEQ0QkIzMEUyLCAweDRBREZBNTQxLCAweDNERDg5NUQ3LCAweEE0RDFDNDZELCAweEQzRDZGNEZCLCBcbiAgICAgICAgICAgICAgICAgICAgIDB4NDM2OUU5NkEsIDB4MzQ2RUQ5RkMsIDB4QUQ2Nzg4NDYsIDB4REE2MEI4RDAsIDB4NDQwNDJENzMsIDB4MzMwMzFERTUsIDB4QUEwQTRDNUYsIDB4REQwRDdDQzksIFxuICAgICAgICAgICAgICAgICAgICAgMHg1MDA1NzEzQywgMHgyNzAyNDFBQSwgMHhCRTBCMTAxMCwgMHhDOTBDMjA4NiwgMHg1NzY4QjUyNSwgMHgyMDZGODVCMywgMHhCOTY2RDQwOSwgMHhDRTYxRTQ5RiwgXG4gICAgICAgICAgICAgICAgICAgICAweDVFREVGOTBFLCAweDI5RDlDOTk4LCAweEIwRDA5ODIyLCAweEM3RDdBOEI0LCAweDU5QjMzRDE3LCAweDJFQjQwRDgxLCAweEI3QkQ1QzNCLCAweEMwQkE2Q0FELCBcbiAgICAgICAgICAgICAgICAgICAgIDB4RURCODgzMjAsIDB4OUFCRkIzQjYsIDB4MDNCNkUyMEMsIDB4NzRCMUQyOUEsIDB4RUFENTQ3MzksIDB4OUREMjc3QUYsIDB4MDREQjI2MTUsIDB4NzNEQzE2ODMsIFxuICAgICAgICAgICAgICAgICAgICAgMHhFMzYzMEIxMiwgMHg5NDY0M0I4NCwgMHgwRDZENkEzRSwgMHg3QTZBNUFBOCwgMHhFNDBFQ0YwQiwgMHg5MzA5RkY5RCwgMHgwQTAwQUUyNywgMHg3RDA3OUVCMSwgXG4gICAgICAgICAgICAgICAgICAgICAweEYwMEY5MzQ0LCAweDg3MDhBM0QyLCAweDFFMDFGMjY4LCAweDY5MDZDMkZFLCAweEY3NjI1NzVELCAweDgwNjU2N0NCLCAweDE5NkMzNjcxLCAweDZFNkIwNkU3LCBcbiAgICAgICAgICAgICAgICAgICAgIDB4RkVENDFCNzYsIDB4ODlEMzJCRTAsIDB4MTBEQTdBNUEsIDB4NjdERDRBQ0MsIDB4RjlCOURGNkYsIDB4OEVCRUVGRjksIDB4MTdCN0JFNDMsIDB4NjBCMDhFRDUsIFxuICAgICAgICAgICAgICAgICAgICAgMHhENkQ2QTNFOCwgMHhBMUQxOTM3RSwgMHgzOEQ4QzJDNCwgMHg0RkRGRjI1MiwgMHhEMUJCNjdGMSwgMHhBNkJDNTc2NywgMHgzRkI1MDZERCwgMHg0OEIyMzY0QiwgXG4gICAgICAgICAgICAgICAgICAgICAweEQ4MEQyQkRBLCAweEFGMEExQjRDLCAweDM2MDM0QUY2LCAweDQxMDQ3QTYwLCAweERGNjBFRkMzLCAweEE4NjdERjU1LCAweDMxNkU4RUVGLCAweDQ2NjlCRTc5LCBcbiAgICAgICAgICAgICAgICAgICAgIDB4Q0I2MUIzOEMsIDB4QkM2NjgzMUEsIDB4MjU2RkQyQTAsIDB4NTI2OEUyMzYsIDB4Q0MwQzc3OTUsIDB4QkIwQjQ3MDMsIDB4MjIwMjE2QjksIDB4NTUwNTI2MkYsIFxuICAgICAgICAgICAgICAgICAgICAgMHhDNUJBM0JCRSwgMHhCMkJEMEIyOCwgMHgyQkI0NUE5MiwgMHg1Q0IzNkEwNCwgMHhDMkQ3RkZBNywgMHhCNUQwQ0YzMSwgMHgyQ0Q5OUU4QiwgMHg1QkRFQUUxRCwgXG4gICAgICAgICAgICAgICAgICAgICAweDlCNjRDMkIwLCAweEVDNjNGMjI2LCAweDc1NkFBMzlDLCAweDAyNkQ5MzBBLCAweDlDMDkwNkE5LCAweEVCMEUzNjNGLCAweDcyMDc2Nzg1LCAweDA1MDA1NzEzLCBcbiAgICAgICAgICAgICAgICAgICAgIDB4OTVCRjRBODIsIDB4RTJCODdBMTQsIDB4N0JCMTJCQUUsIDB4MENCNjFCMzgsIDB4OTJEMjhFOUIsIDB4RTVENUJFMEQsIDB4N0NEQ0VGQjcsIDB4MEJEQkRGMjEsIFxuICAgICAgICAgICAgICAgICAgICAgMHg4NkQzRDJENCwgMHhGMUQ0RTI0MiwgMHg2OEREQjNGOCwgMHgxRkRBODM2RSwgMHg4MUJFMTZDRCwgMHhGNkI5MjY1QiwgMHg2RkIwNzdFMSwgMHgxOEI3NDc3NywgXG4gICAgICAgICAgICAgICAgICAgICAweDg4MDg1QUU2LCAweEZGMEY2QTcwLCAweDY2MDYzQkNBLCAweDExMDEwQjVDLCAweDhGNjU5RUZGLCAweEY4NjJBRTY5LCAweDYxNkJGRkQzLCAweDE2NkNDRjQ1LCBcbiAgICAgICAgICAgICAgICAgICAgIDB4QTAwQUUyNzgsIDB4RDcwREQyRUUsIDB4NEUwNDgzNTQsIDB4MzkwM0IzQzIsIDB4QTc2NzI2NjEsIDB4RDA2MDE2RjcsIDB4NDk2OTQ3NEQsIDB4M0U2RTc3REIsIFxuICAgICAgICAgICAgICAgICAgICAgMHhBRUQxNkE0QSwgMHhEOUQ2NUFEQywgMHg0MERGMEI2NiwgMHgzN0Q4M0JGMCwgMHhBOUJDQUU1MywgMHhERUJCOUVDNSwgMHg0N0IyQ0Y3RiwgMHgzMEI1RkZFOSwgXG4gICAgICAgICAgICAgICAgICAgICAweEJEQkRGMjFDLCAweENBQkFDMjhBLCAweDUzQjM5MzMwLCAweDI0QjRBM0E2LCAweEJBRDAzNjA1LCAweENERDcwNjkzLCAweDU0REU1NzI5LCAweDIzRDk2N0JGLCBcbiAgICAgICAgICAgICAgICAgICAgIDB4QjM2NjdBMkUsIDB4QzQ2MTRBQjgsIDB4NUQ2ODFCMDIsIDB4MkE2RjJCOTQsIDB4QjQwQkJFMzcsIDB4QzMwQzhFQTEsIDB4NUEwNURGMUIsIDB4MkQwMkVGOERdO1xuICAgICBcbiAgICAgICAgdmFyIGNyYyA9IC0xLCB5ID0gMCwgbiA9IGEubGVuZ3RoLGk7XG5cbiAgICAgICAgZm9yIChpID0gZnJvbTsgaSA8IHRvOyBpKyspIHtcbiAgICAgICAgICAgIHkgPSAoY3JjIF4gYVtpXSkgJiAweEZGO1xuICAgICAgICAgICAgY3JjID0gKGNyYyA+Pj4gOCkgXiB0YWJsZVt5XTtcbiAgICAgICAgfVxuICAgICBcbiAgICAgICAgcmV0dXJuIGNyYyBeICgtMSk7XG4gICAgfVxuXG4gICAgdmFyIGggPSBpbWdbMF0ubGVuZ3RoLCB3ID0gaW1nWzBdWzBdLmxlbmd0aCwgczEsIHMyLCBuZXh0LGssbGVuZ3RoLGEsYixpLGosYWRsZXIzMixjcmMzMjtcbiAgICB2YXIgc3RyZWFtID0gW1xuICAgICAgICAgICAgICAgICAgMTM3LCA4MCwgNzgsIDcxLCAxMywgMTAsIDI2LCAxMCwgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAgMDogUE5HIHNpZ25hdHVyZVxuICAgICAgICAgICAgICAgICAgMCwwLDAsMTMsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAgODogSUhEUiBDaHVuayBsZW5ndGhcbiAgICAgICAgICAgICAgICAgIDczLCA3MiwgNjgsIDgyLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gMTI6IFwiSUhEUlwiIFxuICAgICAgICAgICAgICAgICAgKHcgPj4gMjQpICYgMjU1LCAodyA+PiAxNikgJiAyNTUsICh3ID4+IDgpICYgMjU1LCB3JjI1NSwgICAvLyAxNjogV2lkdGhcbiAgICAgICAgICAgICAgICAgIChoID4+IDI0KSAmIDI1NSwgKGggPj4gMTYpICYgMjU1LCAoaCA+PiA4KSAmIDI1NSwgaCYyNTUsICAgLy8gMjA6IEhlaWdodFxuICAgICAgICAgICAgICAgICAgOCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAyNDogYml0IGRlcHRoXG4gICAgICAgICAgICAgICAgICAyLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIDI1OiBSR0JcbiAgICAgICAgICAgICAgICAgIDAsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gMjY6IGRlZmxhdGVcbiAgICAgICAgICAgICAgICAgIDAsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gMjc6IG5vIGZpbHRlclxuICAgICAgICAgICAgICAgICAgMCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAyODogbm8gaW50ZXJsYWNlXG4gICAgICAgICAgICAgICAgICAtMSwtMiwtMywtNCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIDI5OiBDUkNcbiAgICAgICAgICAgICAgICAgIC01LC02LC03LC04LCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gMzM6IElEQVQgQ2h1bmsgbGVuZ3RoXG4gICAgICAgICAgICAgICAgICA3MywgNjgsIDY1LCA4NCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIDM3OiBcIklEQVRcIlxuICAgICAgICAgICAgICAgICAgLy8gUkZDIDE5NTAgaGVhZGVyIHN0YXJ0cyBoZXJlXG4gICAgICAgICAgICAgICAgICA4LCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIDQxOiBSRkMxOTUwIENNRlxuICAgICAgICAgICAgICAgICAgMjkgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyA0MjogUkZDMTk1MCBGTEdcbiAgICAgICAgICAgICAgICAgIF07XG4gICAgY3JjMzIgPSBjcmMzMkFycmF5KHN0cmVhbSwxMiwyOSk7XG4gICAgc3RyZWFtWzI5XSA9IChjcmMzMj4+MjQpJjI1NTtcbiAgICBzdHJlYW1bMzBdID0gKGNyYzMyPj4xNikmMjU1O1xuICAgIHN0cmVhbVszMV0gPSAoY3JjMzI+PjgpJjI1NTtcbiAgICBzdHJlYW1bMzJdID0gKGNyYzMyKSYyNTU7XG4gICAgczEgPSAxO1xuICAgIHMyID0gMDtcbiAgICBmb3IoaT0wO2k8aDtpKyspIHtcbiAgICAgICAgaWYoaTxoLTEpIHsgc3RyZWFtLnB1c2goMCk7IH1cbiAgICAgICAgZWxzZSB7IHN0cmVhbS5wdXNoKDEpOyB9XG4gICAgICAgIGEgPSAoMyp3KzErKGk9PT0wKSkmMjU1OyBiID0gKCgzKncrMSsoaT09PTApKT4+OCkmMjU1O1xuICAgICAgICBzdHJlYW0ucHVzaChhKTsgc3RyZWFtLnB1c2goYik7XG4gICAgICAgIHN0cmVhbS5wdXNoKCh+YSkmMjU1KTsgc3RyZWFtLnB1c2goKH5iKSYyNTUpO1xuICAgICAgICBpZihpPT09MCkgc3RyZWFtLnB1c2goMCk7XG4gICAgICAgIGZvcihqPTA7ajx3O2orKykge1xuICAgICAgICAgICAgZm9yKGs9MDtrPDM7aysrKSB7XG4gICAgICAgICAgICAgICAgYSA9IGltZ1trXVtpXVtqXTtcbiAgICAgICAgICAgICAgICBpZihhPjI1NSkgYSA9IDI1NTtcbiAgICAgICAgICAgICAgICBlbHNlIGlmKGE8MCkgYT0wO1xuICAgICAgICAgICAgICAgIGVsc2UgYSA9IE1hdGgucm91bmQoYSk7XG4gICAgICAgICAgICAgICAgczEgPSAoczEgKyBhICklNjU1MjE7XG4gICAgICAgICAgICAgICAgczIgPSAoczIgKyBzMSklNjU1MjE7XG4gICAgICAgICAgICAgICAgc3RyZWFtLnB1c2goYSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgc3RyZWFtLnB1c2goMCk7XG4gICAgfVxuICAgIGFkbGVyMzIgPSAoczI8PDE2KStzMTtcbiAgICBzdHJlYW0ucHVzaCgoYWRsZXIzMj4+MjQpJjI1NSk7XG4gICAgc3RyZWFtLnB1c2goKGFkbGVyMzI+PjE2KSYyNTUpO1xuICAgIHN0cmVhbS5wdXNoKChhZGxlcjMyPj44KSYyNTUpO1xuICAgIHN0cmVhbS5wdXNoKChhZGxlcjMyKSYyNTUpO1xuICAgIGxlbmd0aCA9IHN0cmVhbS5sZW5ndGggLSA0MTtcbiAgICBzdHJlYW1bMzNdID0gKGxlbmd0aD4+MjQpJjI1NTtcbiAgICBzdHJlYW1bMzRdID0gKGxlbmd0aD4+MTYpJjI1NTtcbiAgICBzdHJlYW1bMzVdID0gKGxlbmd0aD4+OCkmMjU1O1xuICAgIHN0cmVhbVszNl0gPSAobGVuZ3RoKSYyNTU7XG4gICAgY3JjMzIgPSBjcmMzMkFycmF5KHN0cmVhbSwzNyk7XG4gICAgc3RyZWFtLnB1c2goKGNyYzMyPj4yNCkmMjU1KTtcbiAgICBzdHJlYW0ucHVzaCgoY3JjMzI+PjE2KSYyNTUpO1xuICAgIHN0cmVhbS5wdXNoKChjcmMzMj4+OCkmMjU1KTtcbiAgICBzdHJlYW0ucHVzaCgoY3JjMzIpJjI1NSk7XG4gICAgc3RyZWFtLnB1c2goMCk7XG4gICAgc3RyZWFtLnB1c2goMCk7XG4gICAgc3RyZWFtLnB1c2goMCk7XG4gICAgc3RyZWFtLnB1c2goMCk7XG4vLyAgICBhID0gc3RyZWFtLmxlbmd0aDtcbiAgICBzdHJlYW0ucHVzaCg3Myk7ICAvLyBJXG4gICAgc3RyZWFtLnB1c2goNjkpOyAgLy8gRVxuICAgIHN0cmVhbS5wdXNoKDc4KTsgIC8vIE5cbiAgICBzdHJlYW0ucHVzaCg2OCk7ICAvLyBEXG4gICAgc3RyZWFtLnB1c2goMTc0KTsgLy8gQ1JDMVxuICAgIHN0cmVhbS5wdXNoKDY2KTsgIC8vIENSQzJcbiAgICBzdHJlYW0ucHVzaCg5Nik7ICAvLyBDUkMzXG4gICAgc3RyZWFtLnB1c2goMTMwKTsgLy8gQ1JDNFxuICAgIHJldHVybiAnZGF0YTppbWFnZS9wbmc7YmFzZTY0LCcrYmFzZTY0KHN0cmVhbSk7XG59XG5cbi8vIDIuIExpbmVhciBhbGdlYnJhIHdpdGggQXJyYXlzLlxubnVtZXJpYy5fZGltID0gZnVuY3Rpb24gX2RpbSh4KSB7XG4gICAgdmFyIHJldCA9IFtdO1xuICAgIHdoaWxlKHR5cGVvZiB4ID09PSBcIm9iamVjdFwiKSB7IHJldC5wdXNoKHgubGVuZ3RoKTsgeCA9IHhbMF07IH1cbiAgICByZXR1cm4gcmV0O1xufVxuXG5udW1lcmljLmRpbSA9IGZ1bmN0aW9uIGRpbSh4KSB7XG4gICAgdmFyIHksejtcbiAgICBpZih0eXBlb2YgeCA9PT0gXCJvYmplY3RcIikge1xuICAgICAgICB5ID0geFswXTtcbiAgICAgICAgaWYodHlwZW9mIHkgPT09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgICAgIHogPSB5WzBdO1xuICAgICAgICAgICAgaWYodHlwZW9mIHogPT09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVtZXJpYy5fZGltKHgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIFt4Lmxlbmd0aCx5Lmxlbmd0aF07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFt4Lmxlbmd0aF07XG4gICAgfVxuICAgIHJldHVybiBbXTtcbn1cblxubnVtZXJpYy5tYXByZWR1Y2UgPSBmdW5jdGlvbiBtYXByZWR1Y2UoYm9keSxpbml0KSB7XG4gICAgcmV0dXJuIEZ1bmN0aW9uKCd4JywnYWNjdW0nLCdfcycsJ19rJyxcbiAgICAgICAgICAgICdpZih0eXBlb2YgYWNjdW0gPT09IFwidW5kZWZpbmVkXCIpIGFjY3VtID0gJytpbml0Kyc7XFxuJytcbiAgICAgICAgICAgICdpZih0eXBlb2YgeCA9PT0gXCJudW1iZXJcIikgeyB2YXIgeGkgPSB4OyAnK2JvZHkrJzsgcmV0dXJuIGFjY3VtOyB9XFxuJytcbiAgICAgICAgICAgICdpZih0eXBlb2YgX3MgPT09IFwidW5kZWZpbmVkXCIpIF9zID0gbnVtZXJpYy5kaW0oeCk7XFxuJytcbiAgICAgICAgICAgICdpZih0eXBlb2YgX2sgPT09IFwidW5kZWZpbmVkXCIpIF9rID0gMDtcXG4nK1xuICAgICAgICAgICAgJ3ZhciBfbiA9IF9zW19rXTtcXG4nK1xuICAgICAgICAgICAgJ3ZhciBpLHhpO1xcbicrXG4gICAgICAgICAgICAnaWYoX2sgPCBfcy5sZW5ndGgtMSkge1xcbicrXG4gICAgICAgICAgICAnICAgIGZvcihpPV9uLTE7aT49MDtpLS0pIHtcXG4nK1xuICAgICAgICAgICAgJyAgICAgICAgYWNjdW0gPSBhcmd1bWVudHMuY2FsbGVlKHhbaV0sYWNjdW0sX3MsX2srMSk7XFxuJytcbiAgICAgICAgICAgICcgICAgfScrXG4gICAgICAgICAgICAnICAgIHJldHVybiBhY2N1bTtcXG4nK1xuICAgICAgICAgICAgJ31cXG4nK1xuICAgICAgICAgICAgJ2ZvcihpPV9uLTE7aT49MTtpLT0yKSB7IFxcbicrXG4gICAgICAgICAgICAnICAgIHhpID0geFtpXTtcXG4nK1xuICAgICAgICAgICAgJyAgICAnK2JvZHkrJztcXG4nK1xuICAgICAgICAgICAgJyAgICB4aSA9IHhbaS0xXTtcXG4nK1xuICAgICAgICAgICAgJyAgICAnK2JvZHkrJztcXG4nK1xuICAgICAgICAgICAgJ31cXG4nK1xuICAgICAgICAgICAgJ2lmKGkgPT09IDApIHtcXG4nK1xuICAgICAgICAgICAgJyAgICB4aSA9IHhbaV07XFxuJytcbiAgICAgICAgICAgICcgICAgJytib2R5KydcXG4nK1xuICAgICAgICAgICAgJ31cXG4nK1xuICAgICAgICAgICAgJ3JldHVybiBhY2N1bTsnXG4gICAgICAgICAgICApO1xufVxubnVtZXJpYy5tYXByZWR1Y2UyID0gZnVuY3Rpb24gbWFwcmVkdWNlMihib2R5LHNldHVwKSB7XG4gICAgcmV0dXJuIEZ1bmN0aW9uKCd4JyxcbiAgICAgICAgICAgICd2YXIgbiA9IHgubGVuZ3RoO1xcbicrXG4gICAgICAgICAgICAndmFyIGkseGk7XFxuJytzZXR1cCsnO1xcbicrXG4gICAgICAgICAgICAnZm9yKGk9bi0xO2khPT0tMTstLWkpIHsgXFxuJytcbiAgICAgICAgICAgICcgICAgeGkgPSB4W2ldO1xcbicrXG4gICAgICAgICAgICAnICAgICcrYm9keSsnO1xcbicrXG4gICAgICAgICAgICAnfVxcbicrXG4gICAgICAgICAgICAncmV0dXJuIGFjY3VtOydcbiAgICAgICAgICAgICk7XG59XG5cblxubnVtZXJpYy5zYW1lID0gZnVuY3Rpb24gc2FtZSh4LHkpIHtcbiAgICB2YXIgaSxuO1xuICAgIGlmKCEoeCBpbnN0YW5jZW9mIEFycmF5KSB8fCAhKHkgaW5zdGFuY2VvZiBBcnJheSkpIHsgcmV0dXJuIGZhbHNlOyB9XG4gICAgbiA9IHgubGVuZ3RoO1xuICAgIGlmKG4gIT09IHkubGVuZ3RoKSB7IHJldHVybiBmYWxzZTsgfVxuICAgIGZvcihpPTA7aTxuO2krKykge1xuICAgICAgICBpZih4W2ldID09PSB5W2ldKSB7IGNvbnRpbnVlOyB9XG4gICAgICAgIGlmKHR5cGVvZiB4W2ldID09PSBcIm9iamVjdFwiKSB7IGlmKCFzYW1lKHhbaV0seVtpXSkpIHJldHVybiBmYWxzZTsgfVxuICAgICAgICBlbHNlIHsgcmV0dXJuIGZhbHNlOyB9XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xufVxuXG5udW1lcmljLnJlcCA9IGZ1bmN0aW9uIHJlcChzLHYsaykge1xuICAgIGlmKHR5cGVvZiBrID09PSBcInVuZGVmaW5lZFwiKSB7IGs9MDsgfVxuICAgIHZhciBuID0gc1trXSwgcmV0ID0gQXJyYXkobiksIGk7XG4gICAgaWYoayA9PT0gcy5sZW5ndGgtMSkge1xuICAgICAgICBmb3IoaT1uLTI7aT49MDtpLT0yKSB7IHJldFtpKzFdID0gdjsgcmV0W2ldID0gdjsgfVxuICAgICAgICBpZihpPT09LTEpIHsgcmV0WzBdID0gdjsgfVxuICAgICAgICByZXR1cm4gcmV0O1xuICAgIH1cbiAgICBmb3IoaT1uLTE7aT49MDtpLS0pIHsgcmV0W2ldID0gbnVtZXJpYy5yZXAocyx2LGsrMSk7IH1cbiAgICByZXR1cm4gcmV0O1xufVxuXG5cbm51bWVyaWMuZG90TU1zbWFsbCA9IGZ1bmN0aW9uIGRvdE1Nc21hbGwoeCx5KSB7XG4gICAgdmFyIGksaixrLHAscSxyLHJldCxmb28sYmFyLHdvbyxpMCxrMCxwMCxyMDtcbiAgICBwID0geC5sZW5ndGg7IHEgPSB5Lmxlbmd0aDsgciA9IHlbMF0ubGVuZ3RoO1xuICAgIHJldCA9IEFycmF5KHApO1xuICAgIGZvcihpPXAtMTtpPj0wO2ktLSkge1xuICAgICAgICBmb28gPSBBcnJheShyKTtcbiAgICAgICAgYmFyID0geFtpXTtcbiAgICAgICAgZm9yKGs9ci0xO2s+PTA7ay0tKSB7XG4gICAgICAgICAgICB3b28gPSBiYXJbcS0xXSp5W3EtMV1ba107XG4gICAgICAgICAgICBmb3Ioaj1xLTI7aj49MTtqLT0yKSB7XG4gICAgICAgICAgICAgICAgaTAgPSBqLTE7XG4gICAgICAgICAgICAgICAgd29vICs9IGJhcltqXSp5W2pdW2tdICsgYmFyW2kwXSp5W2kwXVtrXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmKGo9PT0wKSB7IHdvbyArPSBiYXJbMF0qeVswXVtrXTsgfVxuICAgICAgICAgICAgZm9vW2tdID0gd29vO1xuICAgICAgICB9XG4gICAgICAgIHJldFtpXSA9IGZvbztcbiAgICB9XG4gICAgcmV0dXJuIHJldDtcbn1cbm51bWVyaWMuX2dldENvbCA9IGZ1bmN0aW9uIF9nZXRDb2woQSxqLHgpIHtcbiAgICB2YXIgbiA9IEEubGVuZ3RoLCBpO1xuICAgIGZvcihpPW4tMTtpPjA7LS1pKSB7XG4gICAgICAgIHhbaV0gPSBBW2ldW2pdO1xuICAgICAgICAtLWk7XG4gICAgICAgIHhbaV0gPSBBW2ldW2pdO1xuICAgIH1cbiAgICBpZihpPT09MCkgeFswXSA9IEFbMF1bal07XG59XG5udW1lcmljLmRvdE1NYmlnID0gZnVuY3Rpb24gZG90TU1iaWcoeCx5KXtcbiAgICB2YXIgZ2MgPSBudW1lcmljLl9nZXRDb2wsIHAgPSB5Lmxlbmd0aCwgdiA9IEFycmF5KHApO1xuICAgIHZhciBtID0geC5sZW5ndGgsIG4gPSB5WzBdLmxlbmd0aCwgQSA9IG5ldyBBcnJheShtKSwgeGo7XG4gICAgdmFyIFZWID0gbnVtZXJpYy5kb3RWVjtcbiAgICB2YXIgaSxqLGssejtcbiAgICAtLXA7XG4gICAgLS1tO1xuICAgIGZvcihpPW07aSE9PS0xOy0taSkgQVtpXSA9IEFycmF5KG4pO1xuICAgIC0tbjtcbiAgICBmb3IoaT1uO2khPT0tMTstLWkpIHtcbiAgICAgICAgZ2MoeSxpLHYpO1xuICAgICAgICBmb3Ioaj1tO2ohPT0tMTstLWopIHtcbiAgICAgICAgICAgIHo9MDtcbiAgICAgICAgICAgIHhqID0geFtqXTtcbiAgICAgICAgICAgIEFbal1baV0gPSBWVih4aix2KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gQTtcbn1cblxubnVtZXJpYy5kb3RNViA9IGZ1bmN0aW9uIGRvdE1WKHgseSkge1xuICAgIHZhciBwID0geC5sZW5ndGgsIHEgPSB5Lmxlbmd0aCxpO1xuICAgIHZhciByZXQgPSBBcnJheShwKSwgZG90VlYgPSBudW1lcmljLmRvdFZWO1xuICAgIGZvcihpPXAtMTtpPj0wO2ktLSkgeyByZXRbaV0gPSBkb3RWVih4W2ldLHkpOyB9XG4gICAgcmV0dXJuIHJldDtcbn1cblxubnVtZXJpYy5kb3RWTSA9IGZ1bmN0aW9uIGRvdFZNKHgseSkge1xuICAgIHZhciBpLGosayxwLHEscixyZXQsZm9vLGJhcix3b28saTAsazAscDAscjAsczEsczIsczMsYmF6LGFjY3VtO1xuICAgIHAgPSB4Lmxlbmd0aDsgcSA9IHlbMF0ubGVuZ3RoO1xuICAgIHJldCA9IEFycmF5KHEpO1xuICAgIGZvcihrPXEtMTtrPj0wO2stLSkge1xuICAgICAgICB3b28gPSB4W3AtMV0qeVtwLTFdW2tdO1xuICAgICAgICBmb3Ioaj1wLTI7aj49MTtqLT0yKSB7XG4gICAgICAgICAgICBpMCA9IGotMTtcbiAgICAgICAgICAgIHdvbyArPSB4W2pdKnlbal1ba10gKyB4W2kwXSp5W2kwXVtrXTtcbiAgICAgICAgfVxuICAgICAgICBpZihqPT09MCkgeyB3b28gKz0geFswXSp5WzBdW2tdOyB9XG4gICAgICAgIHJldFtrXSA9IHdvbztcbiAgICB9XG4gICAgcmV0dXJuIHJldDtcbn1cblxubnVtZXJpYy5kb3RWViA9IGZ1bmN0aW9uIGRvdFZWKHgseSkge1xuICAgIHZhciBpLG49eC5sZW5ndGgsaTEscmV0ID0geFtuLTFdKnlbbi0xXTtcbiAgICBmb3IoaT1uLTI7aT49MTtpLT0yKSB7XG4gICAgICAgIGkxID0gaS0xO1xuICAgICAgICByZXQgKz0geFtpXSp5W2ldICsgeFtpMV0qeVtpMV07XG4gICAgfVxuICAgIGlmKGk9PT0wKSB7IHJldCArPSB4WzBdKnlbMF07IH1cbiAgICByZXR1cm4gcmV0O1xufVxuXG5udW1lcmljLmRvdCA9IGZ1bmN0aW9uIGRvdCh4LHkpIHtcbiAgICB2YXIgZCA9IG51bWVyaWMuZGltO1xuICAgIHN3aXRjaChkKHgpLmxlbmd0aCoxMDAwK2QoeSkubGVuZ3RoKSB7XG4gICAgY2FzZSAyMDAyOlxuICAgICAgICBpZih5Lmxlbmd0aCA8IDEwKSByZXR1cm4gbnVtZXJpYy5kb3RNTXNtYWxsKHgseSk7XG4gICAgICAgIGVsc2UgcmV0dXJuIG51bWVyaWMuZG90TU1iaWcoeCx5KTtcbiAgICBjYXNlIDIwMDE6IHJldHVybiBudW1lcmljLmRvdE1WKHgseSk7XG4gICAgY2FzZSAxMDAyOiByZXR1cm4gbnVtZXJpYy5kb3RWTSh4LHkpO1xuICAgIGNhc2UgMTAwMTogcmV0dXJuIG51bWVyaWMuZG90VlYoeCx5KTtcbiAgICBjYXNlIDEwMDA6IHJldHVybiBudW1lcmljLm11bFZTKHgseSk7XG4gICAgY2FzZSAxOiByZXR1cm4gbnVtZXJpYy5tdWxTVih4LHkpO1xuICAgIGNhc2UgMDogcmV0dXJuIHgqeTtcbiAgICBkZWZhdWx0OiB0aHJvdyBuZXcgRXJyb3IoJ251bWVyaWMuZG90IG9ubHkgd29ya3Mgb24gdmVjdG9ycyBhbmQgbWF0cmljZXMnKTtcbiAgICB9XG59XG5cbm51bWVyaWMuZGlhZyA9IGZ1bmN0aW9uIGRpYWcoZCkge1xuICAgIHZhciBpLGkxLGosbiA9IGQubGVuZ3RoLCBBID0gQXJyYXkobiksIEFpO1xuICAgIGZvcihpPW4tMTtpPj0wO2ktLSkge1xuICAgICAgICBBaSA9IEFycmF5KG4pO1xuICAgICAgICBpMSA9IGkrMjtcbiAgICAgICAgZm9yKGo9bi0xO2o+PWkxO2otPTIpIHtcbiAgICAgICAgICAgIEFpW2pdID0gMDtcbiAgICAgICAgICAgIEFpW2otMV0gPSAwO1xuICAgICAgICB9XG4gICAgICAgIGlmKGo+aSkgeyBBaVtqXSA9IDA7IH1cbiAgICAgICAgQWlbaV0gPSBkW2ldO1xuICAgICAgICBmb3Ioaj1pLTE7aj49MTtqLT0yKSB7XG4gICAgICAgICAgICBBaVtqXSA9IDA7XG4gICAgICAgICAgICBBaVtqLTFdID0gMDtcbiAgICAgICAgfVxuICAgICAgICBpZihqPT09MCkgeyBBaVswXSA9IDA7IH1cbiAgICAgICAgQVtpXSA9IEFpO1xuICAgIH1cbiAgICByZXR1cm4gQTtcbn1cbm51bWVyaWMuZ2V0RGlhZyA9IGZ1bmN0aW9uKEEpIHtcbiAgICB2YXIgbiA9IE1hdGgubWluKEEubGVuZ3RoLEFbMF0ubGVuZ3RoKSxpLHJldCA9IEFycmF5KG4pO1xuICAgIGZvcihpPW4tMTtpPj0xOy0taSkge1xuICAgICAgICByZXRbaV0gPSBBW2ldW2ldO1xuICAgICAgICAtLWk7XG4gICAgICAgIHJldFtpXSA9IEFbaV1baV07XG4gICAgfVxuICAgIGlmKGk9PT0wKSB7XG4gICAgICAgIHJldFswXSA9IEFbMF1bMF07XG4gICAgfVxuICAgIHJldHVybiByZXQ7XG59XG5cbm51bWVyaWMuaWRlbnRpdHkgPSBmdW5jdGlvbiBpZGVudGl0eShuKSB7IHJldHVybiBudW1lcmljLmRpYWcobnVtZXJpYy5yZXAoW25dLDEpKTsgfVxubnVtZXJpYy5wb2ludHdpc2UgPSBmdW5jdGlvbiBwb2ludHdpc2UocGFyYW1zLGJvZHksc2V0dXApIHtcbiAgICBpZih0eXBlb2Ygc2V0dXAgPT09IFwidW5kZWZpbmVkXCIpIHsgc2V0dXAgPSBcIlwiOyB9XG4gICAgdmFyIGZ1biA9IFtdO1xuICAgIHZhciBrO1xuICAgIHZhciBhdmVjID0gL1xcW2lcXF0kLyxwLHRoZXZlYyA9ICcnO1xuICAgIHZhciBoYXZlcmV0ID0gZmFsc2U7XG4gICAgZm9yKGs9MDtrPHBhcmFtcy5sZW5ndGg7aysrKSB7XG4gICAgICAgIGlmKGF2ZWMudGVzdChwYXJhbXNba10pKSB7XG4gICAgICAgICAgICBwID0gcGFyYW1zW2tdLnN1YnN0cmluZygwLHBhcmFtc1trXS5sZW5ndGgtMyk7XG4gICAgICAgICAgICB0aGV2ZWMgPSBwO1xuICAgICAgICB9IGVsc2UgeyBwID0gcGFyYW1zW2tdOyB9XG4gICAgICAgIGlmKHA9PT0ncmV0JykgaGF2ZXJldCA9IHRydWU7XG4gICAgICAgIGZ1bi5wdXNoKHApO1xuICAgIH1cbiAgICBmdW5bcGFyYW1zLmxlbmd0aF0gPSAnX3MnO1xuICAgIGZ1bltwYXJhbXMubGVuZ3RoKzFdID0gJ19rJztcbiAgICBmdW5bcGFyYW1zLmxlbmd0aCsyXSA9IChcbiAgICAgICAgICAgICdpZih0eXBlb2YgX3MgPT09IFwidW5kZWZpbmVkXCIpIF9zID0gbnVtZXJpYy5kaW0oJyt0aGV2ZWMrJyk7XFxuJytcbiAgICAgICAgICAgICdpZih0eXBlb2YgX2sgPT09IFwidW5kZWZpbmVkXCIpIF9rID0gMDtcXG4nK1xuICAgICAgICAgICAgJ3ZhciBfbiA9IF9zW19rXTtcXG4nK1xuICAgICAgICAgICAgJ3ZhciBpJysoaGF2ZXJldD8nJzonLCByZXQgPSBBcnJheShfbiknKSsnO1xcbicrXG4gICAgICAgICAgICAnaWYoX2sgPCBfcy5sZW5ndGgtMSkge1xcbicrXG4gICAgICAgICAgICAnICAgIGZvcihpPV9uLTE7aT49MDtpLS0pIHJldFtpXSA9IGFyZ3VtZW50cy5jYWxsZWUoJytwYXJhbXMuam9pbignLCcpKycsX3MsX2srMSk7XFxuJytcbiAgICAgICAgICAgICcgICAgcmV0dXJuIHJldDtcXG4nK1xuICAgICAgICAgICAgJ31cXG4nK1xuICAgICAgICAgICAgc2V0dXArJ1xcbicrXG4gICAgICAgICAgICAnZm9yKGk9X24tMTtpIT09LTE7LS1pKSB7XFxuJytcbiAgICAgICAgICAgICcgICAgJytib2R5KydcXG4nK1xuICAgICAgICAgICAgJ31cXG4nK1xuICAgICAgICAgICAgJ3JldHVybiByZXQ7J1xuICAgICAgICAgICAgKTtcbiAgICByZXR1cm4gRnVuY3Rpb24uYXBwbHkobnVsbCxmdW4pO1xufVxubnVtZXJpYy5wb2ludHdpc2UyID0gZnVuY3Rpb24gcG9pbnR3aXNlMihwYXJhbXMsYm9keSxzZXR1cCkge1xuICAgIGlmKHR5cGVvZiBzZXR1cCA9PT0gXCJ1bmRlZmluZWRcIikgeyBzZXR1cCA9IFwiXCI7IH1cbiAgICB2YXIgZnVuID0gW107XG4gICAgdmFyIGs7XG4gICAgdmFyIGF2ZWMgPSAvXFxbaVxcXSQvLHAsdGhldmVjID0gJyc7XG4gICAgdmFyIGhhdmVyZXQgPSBmYWxzZTtcbiAgICBmb3Ioaz0wO2s8cGFyYW1zLmxlbmd0aDtrKyspIHtcbiAgICAgICAgaWYoYXZlYy50ZXN0KHBhcmFtc1trXSkpIHtcbiAgICAgICAgICAgIHAgPSBwYXJhbXNba10uc3Vic3RyaW5nKDAscGFyYW1zW2tdLmxlbmd0aC0zKTtcbiAgICAgICAgICAgIHRoZXZlYyA9IHA7XG4gICAgICAgIH0gZWxzZSB7IHAgPSBwYXJhbXNba107IH1cbiAgICAgICAgaWYocD09PSdyZXQnKSBoYXZlcmV0ID0gdHJ1ZTtcbiAgICAgICAgZnVuLnB1c2gocCk7XG4gICAgfVxuICAgIGZ1bltwYXJhbXMubGVuZ3RoXSA9IChcbiAgICAgICAgICAgICd2YXIgX24gPSAnK3RoZXZlYysnLmxlbmd0aDtcXG4nK1xuICAgICAgICAgICAgJ3ZhciBpJysoaGF2ZXJldD8nJzonLCByZXQgPSBBcnJheShfbiknKSsnO1xcbicrXG4gICAgICAgICAgICBzZXR1cCsnXFxuJytcbiAgICAgICAgICAgICdmb3IoaT1fbi0xO2khPT0tMTstLWkpIHtcXG4nK1xuICAgICAgICAgICAgYm9keSsnXFxuJytcbiAgICAgICAgICAgICd9XFxuJytcbiAgICAgICAgICAgICdyZXR1cm4gcmV0OydcbiAgICAgICAgICAgICk7XG4gICAgcmV0dXJuIEZ1bmN0aW9uLmFwcGx5KG51bGwsZnVuKTtcbn1cbm51bWVyaWMuX2JpZm9yZWFjaCA9IChmdW5jdGlvbiBfYmlmb3JlYWNoKHgseSxzLGssZikge1xuICAgIGlmKGsgPT09IHMubGVuZ3RoLTEpIHsgZih4LHkpOyByZXR1cm47IH1cbiAgICB2YXIgaSxuPXNba107XG4gICAgZm9yKGk9bi0xO2k+PTA7aS0tKSB7IF9iaWZvcmVhY2godHlwZW9mIHg9PT1cIm9iamVjdFwiP3hbaV06eCx0eXBlb2YgeT09PVwib2JqZWN0XCI/eVtpXTp5LHMsaysxLGYpOyB9XG59KTtcbm51bWVyaWMuX2JpZm9yZWFjaDIgPSAoZnVuY3Rpb24gX2JpZm9yZWFjaDIoeCx5LHMsayxmKSB7XG4gICAgaWYoayA9PT0gcy5sZW5ndGgtMSkgeyByZXR1cm4gZih4LHkpOyB9XG4gICAgdmFyIGksbj1zW2tdLHJldCA9IEFycmF5KG4pO1xuICAgIGZvcihpPW4tMTtpPj0wOy0taSkgeyByZXRbaV0gPSBfYmlmb3JlYWNoMih0eXBlb2YgeD09PVwib2JqZWN0XCI/eFtpXTp4LHR5cGVvZiB5PT09XCJvYmplY3RcIj95W2ldOnkscyxrKzEsZik7IH1cbiAgICByZXR1cm4gcmV0O1xufSk7XG5udW1lcmljLl9mb3JlYWNoID0gKGZ1bmN0aW9uIF9mb3JlYWNoKHgscyxrLGYpIHtcbiAgICBpZihrID09PSBzLmxlbmd0aC0xKSB7IGYoeCk7IHJldHVybjsgfVxuICAgIHZhciBpLG49c1trXTtcbiAgICBmb3IoaT1uLTE7aT49MDtpLS0pIHsgX2ZvcmVhY2goeFtpXSxzLGsrMSxmKTsgfVxufSk7XG5udW1lcmljLl9mb3JlYWNoMiA9IChmdW5jdGlvbiBfZm9yZWFjaDIoeCxzLGssZikge1xuICAgIGlmKGsgPT09IHMubGVuZ3RoLTEpIHsgcmV0dXJuIGYoeCk7IH1cbiAgICB2YXIgaSxuPXNba10sIHJldCA9IEFycmF5KG4pO1xuICAgIGZvcihpPW4tMTtpPj0wO2ktLSkgeyByZXRbaV0gPSBfZm9yZWFjaDIoeFtpXSxzLGsrMSxmKTsgfVxuICAgIHJldHVybiByZXQ7XG59KTtcblxuLypudW1lcmljLmFueVYgPSBudW1lcmljLm1hcHJlZHVjZSgnaWYoeGkpIHJldHVybiB0cnVlOycsJ2ZhbHNlJyk7XG5udW1lcmljLmFsbFYgPSBudW1lcmljLm1hcHJlZHVjZSgnaWYoIXhpKSByZXR1cm4gZmFsc2U7JywndHJ1ZScpO1xubnVtZXJpYy5hbnkgPSBmdW5jdGlvbih4KSB7IGlmKHR5cGVvZiB4Lmxlbmd0aCA9PT0gXCJ1bmRlZmluZWRcIikgcmV0dXJuIHg7IHJldHVybiBudW1lcmljLmFueVYoeCk7IH1cbm51bWVyaWMuYWxsID0gZnVuY3Rpb24oeCkgeyBpZih0eXBlb2YgeC5sZW5ndGggPT09IFwidW5kZWZpbmVkXCIpIHJldHVybiB4OyByZXR1cm4gbnVtZXJpYy5hbGxWKHgpOyB9Ki9cblxubnVtZXJpYy5vcHMyID0ge1xuICAgICAgICBhZGQ6ICcrJyxcbiAgICAgICAgc3ViOiAnLScsXG4gICAgICAgIG11bDogJyonLFxuICAgICAgICBkaXY6ICcvJyxcbiAgICAgICAgbW9kOiAnJScsXG4gICAgICAgIGFuZDogJyYmJyxcbiAgICAgICAgb3I6ICAnfHwnLFxuICAgICAgICBlcTogICc9PT0nLFxuICAgICAgICBuZXE6ICchPT0nLFxuICAgICAgICBsdDogICc8JyxcbiAgICAgICAgZ3Q6ICAnPicsXG4gICAgICAgIGxlcTogJzw9JyxcbiAgICAgICAgZ2VxOiAnPj0nLFxuICAgICAgICBiYW5kOiAnJicsXG4gICAgICAgIGJvcjogJ3wnLFxuICAgICAgICBieG9yOiAnXicsXG4gICAgICAgIGxzaGlmdDogJzw8JyxcbiAgICAgICAgcnNoaWZ0OiAnPj4nLFxuICAgICAgICBycnNoaWZ0OiAnPj4+J1xufTtcbm51bWVyaWMub3BzZXEgPSB7XG4gICAgICAgIGFkZGVxOiAnKz0nLFxuICAgICAgICBzdWJlcTogJy09JyxcbiAgICAgICAgbXVsZXE6ICcqPScsXG4gICAgICAgIGRpdmVxOiAnLz0nLFxuICAgICAgICBtb2RlcTogJyU9JyxcbiAgICAgICAgbHNoaWZ0ZXE6ICc8PD0nLFxuICAgICAgICByc2hpZnRlcTogJz4+PScsXG4gICAgICAgIHJyc2hpZnRlcTogJz4+Pj0nLFxuICAgICAgICBiYW5kZXE6ICcmPScsXG4gICAgICAgIGJvcmVxOiAnfD0nLFxuICAgICAgICBieG9yZXE6ICdePSdcbn07XG5udW1lcmljLm1hdGhmdW5zID0gWydhYnMnLCdhY29zJywnYXNpbicsJ2F0YW4nLCdjZWlsJywnY29zJyxcbiAgICAgICAgICAgICAgICAgICAgJ2V4cCcsJ2Zsb29yJywnbG9nJywncm91bmQnLCdzaW4nLCdzcXJ0JywndGFuJyxcbiAgICAgICAgICAgICAgICAgICAgJ2lzTmFOJywnaXNGaW5pdGUnXTtcbm51bWVyaWMubWF0aGZ1bnMyID0gWydhdGFuMicsJ3BvdycsJ21heCcsJ21pbiddO1xubnVtZXJpYy5vcHMxID0ge1xuICAgICAgICBuZWc6ICctJyxcbiAgICAgICAgbm90OiAnIScsXG4gICAgICAgIGJub3Q6ICd+JyxcbiAgICAgICAgY2xvbmU6ICcnXG59O1xubnVtZXJpYy5tYXByZWR1Y2VycyA9IHtcbiAgICAgICAgYW55OiBbJ2lmKHhpKSByZXR1cm4gdHJ1ZTsnLCd2YXIgYWNjdW0gPSBmYWxzZTsnXSxcbiAgICAgICAgYWxsOiBbJ2lmKCF4aSkgcmV0dXJuIGZhbHNlOycsJ3ZhciBhY2N1bSA9IHRydWU7J10sXG4gICAgICAgIHN1bTogWydhY2N1bSArPSB4aTsnLCd2YXIgYWNjdW0gPSAwOyddLFxuICAgICAgICBwcm9kOiBbJ2FjY3VtICo9IHhpOycsJ3ZhciBhY2N1bSA9IDE7J10sXG4gICAgICAgIG5vcm0yU3F1YXJlZDogWydhY2N1bSArPSB4aSp4aTsnLCd2YXIgYWNjdW0gPSAwOyddLFxuICAgICAgICBub3JtaW5mOiBbJ2FjY3VtID0gbWF4KGFjY3VtLGFicyh4aSkpOycsJ3ZhciBhY2N1bSA9IDAsIG1heCA9IE1hdGgubWF4LCBhYnMgPSBNYXRoLmFiczsnXSxcbiAgICAgICAgbm9ybTE6IFsnYWNjdW0gKz0gYWJzKHhpKScsJ3ZhciBhY2N1bSA9IDAsIGFicyA9IE1hdGguYWJzOyddLFxuICAgICAgICBzdXA6IFsnYWNjdW0gPSBtYXgoYWNjdW0seGkpOycsJ3ZhciBhY2N1bSA9IC1JbmZpbml0eSwgbWF4ID0gTWF0aC5tYXg7J10sXG4gICAgICAgIGluZjogWydhY2N1bSA9IG1pbihhY2N1bSx4aSk7JywndmFyIGFjY3VtID0gSW5maW5pdHksIG1pbiA9IE1hdGgubWluOyddXG59O1xuXG4oZnVuY3Rpb24gKCkge1xuICAgIHZhciBpLG87XG4gICAgZm9yKGk9MDtpPG51bWVyaWMubWF0aGZ1bnMyLmxlbmd0aDsrK2kpIHtcbiAgICAgICAgbyA9IG51bWVyaWMubWF0aGZ1bnMyW2ldO1xuICAgICAgICBudW1lcmljLm9wczJbb10gPSBvO1xuICAgIH1cbiAgICBmb3IoaSBpbiBudW1lcmljLm9wczIpIHtcbiAgICAgICAgaWYobnVtZXJpYy5vcHMyLmhhc093blByb3BlcnR5KGkpKSB7XG4gICAgICAgICAgICBvID0gbnVtZXJpYy5vcHMyW2ldO1xuICAgICAgICAgICAgdmFyIGNvZGUsIGNvZGVlcSwgc2V0dXAgPSAnJztcbiAgICAgICAgICAgIGlmKG51bWVyaWMubXlJbmRleE9mLmNhbGwobnVtZXJpYy5tYXRoZnVuczIsaSkhPT0tMSkge1xuICAgICAgICAgICAgICAgIHNldHVwID0gJ3ZhciAnK28rJyA9IE1hdGguJytvKyc7XFxuJztcbiAgICAgICAgICAgICAgICBjb2RlID0gZnVuY3Rpb24ocix4LHkpIHsgcmV0dXJuIHIrJyA9ICcrbysnKCcreCsnLCcreSsnKSc7IH07XG4gICAgICAgICAgICAgICAgY29kZWVxID0gZnVuY3Rpb24oeCx5KSB7IHJldHVybiB4KycgPSAnK28rJygnK3grJywnK3krJyknOyB9O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb2RlID0gZnVuY3Rpb24ocix4LHkpIHsgcmV0dXJuIHIrJyA9ICcreCsnICcrbysnICcreTsgfTtcbiAgICAgICAgICAgICAgICBpZihudW1lcmljLm9wc2VxLmhhc093blByb3BlcnR5KGkrJ2VxJykpIHtcbiAgICAgICAgICAgICAgICAgICAgY29kZWVxID0gZnVuY3Rpb24oeCx5KSB7IHJldHVybiB4KycgJytvKyc9ICcreTsgfTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjb2RlZXEgPSBmdW5jdGlvbih4LHkpIHsgcmV0dXJuIHgrJyA9ICcreCsnICcrbysnICcreTsgfTsgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG51bWVyaWNbaSsnVlYnXSA9IG51bWVyaWMucG9pbnR3aXNlMihbJ3hbaV0nLCd5W2ldJ10sY29kZSgncmV0W2ldJywneFtpXScsJ3lbaV0nKSxzZXR1cCk7XG4gICAgICAgICAgICBudW1lcmljW2krJ1NWJ10gPSBudW1lcmljLnBvaW50d2lzZTIoWyd4JywneVtpXSddLGNvZGUoJ3JldFtpXScsJ3gnLCd5W2ldJyksc2V0dXApO1xuICAgICAgICAgICAgbnVtZXJpY1tpKydWUyddID0gbnVtZXJpYy5wb2ludHdpc2UyKFsneFtpXScsJ3knXSxjb2RlKCdyZXRbaV0nLCd4W2ldJywneScpLHNldHVwKTtcbiAgICAgICAgICAgIG51bWVyaWNbaV0gPSBGdW5jdGlvbihcbiAgICAgICAgICAgICAgICAgICAgJ3ZhciBuID0gYXJndW1lbnRzLmxlbmd0aCwgaSwgeCA9IGFyZ3VtZW50c1swXSwgeTtcXG4nK1xuICAgICAgICAgICAgICAgICAgICAndmFyIFZWID0gbnVtZXJpYy4nK2krJ1ZWLCBWUyA9IG51bWVyaWMuJytpKydWUywgU1YgPSBudW1lcmljLicraSsnU1Y7XFxuJytcbiAgICAgICAgICAgICAgICAgICAgJ3ZhciBkaW0gPSBudW1lcmljLmRpbTtcXG4nK1xuICAgICAgICAgICAgICAgICAgICAnZm9yKGk9MTtpIT09bjsrK2kpIHsgXFxuJytcbiAgICAgICAgICAgICAgICAgICAgJyAgeSA9IGFyZ3VtZW50c1tpXTtcXG4nK1xuICAgICAgICAgICAgICAgICAgICAnICBpZih0eXBlb2YgeCA9PT0gXCJvYmplY3RcIikge1xcbicrXG4gICAgICAgICAgICAgICAgICAgICcgICAgICBpZih0eXBlb2YgeSA9PT0gXCJvYmplY3RcIikgeCA9IG51bWVyaWMuX2JpZm9yZWFjaDIoeCx5LGRpbSh4KSwwLFZWKTtcXG4nK1xuICAgICAgICAgICAgICAgICAgICAnICAgICAgZWxzZSB4ID0gbnVtZXJpYy5fYmlmb3JlYWNoMih4LHksZGltKHgpLDAsVlMpO1xcbicrXG4gICAgICAgICAgICAgICAgICAgICcgIH0gZWxzZSBpZih0eXBlb2YgeSA9PT0gXCJvYmplY3RcIikgeCA9IG51bWVyaWMuX2JpZm9yZWFjaDIoeCx5LGRpbSh5KSwwLFNWKTtcXG4nK1xuICAgICAgICAgICAgICAgICAgICAnICBlbHNlICcrY29kZWVxKCd4JywneScpKydcXG4nK1xuICAgICAgICAgICAgICAgICAgICAnfVxcbnJldHVybiB4O1xcbicpO1xuICAgICAgICAgICAgbnVtZXJpY1tvXSA9IG51bWVyaWNbaV07XG4gICAgICAgICAgICBudW1lcmljW2krJ2VxViddID0gbnVtZXJpYy5wb2ludHdpc2UyKFsncmV0W2ldJywneFtpXSddLCBjb2RlZXEoJ3JldFtpXScsJ3hbaV0nKSxzZXR1cCk7XG4gICAgICAgICAgICBudW1lcmljW2krJ2VxUyddID0gbnVtZXJpYy5wb2ludHdpc2UyKFsncmV0W2ldJywneCddLCBjb2RlZXEoJ3JldFtpXScsJ3gnKSxzZXR1cCk7XG4gICAgICAgICAgICBudW1lcmljW2krJ2VxJ10gPSBGdW5jdGlvbihcbiAgICAgICAgICAgICAgICAgICAgJ3ZhciBuID0gYXJndW1lbnRzLmxlbmd0aCwgaSwgeCA9IGFyZ3VtZW50c1swXSwgeTtcXG4nK1xuICAgICAgICAgICAgICAgICAgICAndmFyIFYgPSBudW1lcmljLicraSsnZXFWLCBTID0gbnVtZXJpYy4nK2krJ2VxU1xcbicrXG4gICAgICAgICAgICAgICAgICAgICd2YXIgcyA9IG51bWVyaWMuZGltKHgpO1xcbicrXG4gICAgICAgICAgICAgICAgICAgICdmb3IoaT0xO2khPT1uOysraSkgeyBcXG4nK1xuICAgICAgICAgICAgICAgICAgICAnICB5ID0gYXJndW1lbnRzW2ldO1xcbicrXG4gICAgICAgICAgICAgICAgICAgICcgIGlmKHR5cGVvZiB5ID09PSBcIm9iamVjdFwiKSBudW1lcmljLl9iaWZvcmVhY2goeCx5LHMsMCxWKTtcXG4nK1xuICAgICAgICAgICAgICAgICAgICAnICBlbHNlIG51bWVyaWMuX2JpZm9yZWFjaCh4LHkscywwLFMpO1xcbicrXG4gICAgICAgICAgICAgICAgICAgICd9XFxucmV0dXJuIHg7XFxuJyk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZm9yKGk9MDtpPG51bWVyaWMubWF0aGZ1bnMyLmxlbmd0aDsrK2kpIHtcbiAgICAgICAgbyA9IG51bWVyaWMubWF0aGZ1bnMyW2ldO1xuICAgICAgICBkZWxldGUgbnVtZXJpYy5vcHMyW29dO1xuICAgIH1cbiAgICBmb3IoaT0wO2k8bnVtZXJpYy5tYXRoZnVucy5sZW5ndGg7KytpKSB7XG4gICAgICAgIG8gPSBudW1lcmljLm1hdGhmdW5zW2ldO1xuICAgICAgICBudW1lcmljLm9wczFbb10gPSBvO1xuICAgIH1cbiAgICBmb3IoaSBpbiBudW1lcmljLm9wczEpIHtcbiAgICAgICAgaWYobnVtZXJpYy5vcHMxLmhhc093blByb3BlcnR5KGkpKSB7XG4gICAgICAgICAgICBzZXR1cCA9ICcnO1xuICAgICAgICAgICAgbyA9IG51bWVyaWMub3BzMVtpXTtcbiAgICAgICAgICAgIGlmKG51bWVyaWMubXlJbmRleE9mLmNhbGwobnVtZXJpYy5tYXRoZnVucyxpKSE9PS0xKSB7XG4gICAgICAgICAgICAgICAgaWYoTWF0aC5oYXNPd25Qcm9wZXJ0eShvKSkgc2V0dXAgPSAndmFyICcrbysnID0gTWF0aC4nK28rJztcXG4nO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbnVtZXJpY1tpKydlcVYnXSA9IG51bWVyaWMucG9pbnR3aXNlMihbJ3JldFtpXSddLCdyZXRbaV0gPSAnK28rJyhyZXRbaV0pOycsc2V0dXApO1xuICAgICAgICAgICAgbnVtZXJpY1tpKydlcSddID0gRnVuY3Rpb24oJ3gnLFxuICAgICAgICAgICAgICAgICAgICAnaWYodHlwZW9mIHggIT09IFwib2JqZWN0XCIpIHJldHVybiAnK28rJ3hcXG4nK1xuICAgICAgICAgICAgICAgICAgICAndmFyIGk7XFxuJytcbiAgICAgICAgICAgICAgICAgICAgJ3ZhciBWID0gbnVtZXJpYy4nK2krJ2VxVjtcXG4nK1xuICAgICAgICAgICAgICAgICAgICAndmFyIHMgPSBudW1lcmljLmRpbSh4KTtcXG4nK1xuICAgICAgICAgICAgICAgICAgICAnbnVtZXJpYy5fZm9yZWFjaCh4LHMsMCxWKTtcXG4nK1xuICAgICAgICAgICAgICAgICAgICAncmV0dXJuIHg7XFxuJyk7XG4gICAgICAgICAgICBudW1lcmljW2krJ1YnXSA9IG51bWVyaWMucG9pbnR3aXNlMihbJ3hbaV0nXSwncmV0W2ldID0gJytvKycoeFtpXSk7JyxzZXR1cCk7XG4gICAgICAgICAgICBudW1lcmljW2ldID0gRnVuY3Rpb24oJ3gnLFxuICAgICAgICAgICAgICAgICAgICAnaWYodHlwZW9mIHggIT09IFwib2JqZWN0XCIpIHJldHVybiAnK28rJyh4KVxcbicrXG4gICAgICAgICAgICAgICAgICAgICd2YXIgaTtcXG4nK1xuICAgICAgICAgICAgICAgICAgICAndmFyIFYgPSBudW1lcmljLicraSsnVjtcXG4nK1xuICAgICAgICAgICAgICAgICAgICAndmFyIHMgPSBudW1lcmljLmRpbSh4KTtcXG4nK1xuICAgICAgICAgICAgICAgICAgICAncmV0dXJuIG51bWVyaWMuX2ZvcmVhY2gyKHgscywwLFYpO1xcbicpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGZvcihpPTA7aTxudW1lcmljLm1hdGhmdW5zLmxlbmd0aDsrK2kpIHtcbiAgICAgICAgbyA9IG51bWVyaWMubWF0aGZ1bnNbaV07XG4gICAgICAgIGRlbGV0ZSBudW1lcmljLm9wczFbb107XG4gICAgfVxuICAgIGZvcihpIGluIG51bWVyaWMubWFwcmVkdWNlcnMpIHtcbiAgICAgICAgaWYobnVtZXJpYy5tYXByZWR1Y2Vycy5oYXNPd25Qcm9wZXJ0eShpKSkge1xuICAgICAgICAgICAgbyA9IG51bWVyaWMubWFwcmVkdWNlcnNbaV07XG4gICAgICAgICAgICBudW1lcmljW2krJ1YnXSA9IG51bWVyaWMubWFwcmVkdWNlMihvWzBdLG9bMV0pO1xuICAgICAgICAgICAgbnVtZXJpY1tpXSA9IEZ1bmN0aW9uKCd4JywncycsJ2snLFxuICAgICAgICAgICAgICAgICAgICBvWzFdK1xuICAgICAgICAgICAgICAgICAgICAnaWYodHlwZW9mIHggIT09IFwib2JqZWN0XCIpIHsnK1xuICAgICAgICAgICAgICAgICAgICAnICAgIHhpID0geDtcXG4nK1xuICAgICAgICAgICAgICAgICAgICBvWzBdKyc7XFxuJytcbiAgICAgICAgICAgICAgICAgICAgJyAgICByZXR1cm4gYWNjdW07XFxuJytcbiAgICAgICAgICAgICAgICAgICAgJ30nK1xuICAgICAgICAgICAgICAgICAgICAnaWYodHlwZW9mIHMgPT09IFwidW5kZWZpbmVkXCIpIHMgPSBudW1lcmljLmRpbSh4KTtcXG4nK1xuICAgICAgICAgICAgICAgICAgICAnaWYodHlwZW9mIGsgPT09IFwidW5kZWZpbmVkXCIpIGsgPSAwO1xcbicrXG4gICAgICAgICAgICAgICAgICAgICdpZihrID09PSBzLmxlbmd0aC0xKSByZXR1cm4gbnVtZXJpYy4nK2krJ1YoeCk7XFxuJytcbiAgICAgICAgICAgICAgICAgICAgJ3ZhciB4aTtcXG4nK1xuICAgICAgICAgICAgICAgICAgICAndmFyIG4gPSB4Lmxlbmd0aCwgaTtcXG4nK1xuICAgICAgICAgICAgICAgICAgICAnZm9yKGk9bi0xO2khPT0tMTstLWkpIHtcXG4nK1xuICAgICAgICAgICAgICAgICAgICAnICAgeGkgPSBhcmd1bWVudHMuY2FsbGVlKHhbaV0pO1xcbicrXG4gICAgICAgICAgICAgICAgICAgIG9bMF0rJztcXG4nK1xuICAgICAgICAgICAgICAgICAgICAnfVxcbicrXG4gICAgICAgICAgICAgICAgICAgICdyZXR1cm4gYWNjdW07XFxuJyk7XG4gICAgICAgIH1cbiAgICB9XG59KCkpO1xuXG5udW1lcmljLnRydW5jVlYgPSBudW1lcmljLnBvaW50d2lzZShbJ3hbaV0nLCd5W2ldJ10sJ3JldFtpXSA9IHJvdW5kKHhbaV0veVtpXSkqeVtpXTsnLCd2YXIgcm91bmQgPSBNYXRoLnJvdW5kOycpO1xubnVtZXJpYy50cnVuY1ZTID0gbnVtZXJpYy5wb2ludHdpc2UoWyd4W2ldJywneSddLCdyZXRbaV0gPSByb3VuZCh4W2ldL3kpKnk7JywndmFyIHJvdW5kID0gTWF0aC5yb3VuZDsnKTtcbm51bWVyaWMudHJ1bmNTViA9IG51bWVyaWMucG9pbnR3aXNlKFsneCcsJ3lbaV0nXSwncmV0W2ldID0gcm91bmQoeC95W2ldKSp5W2ldOycsJ3ZhciByb3VuZCA9IE1hdGgucm91bmQ7Jyk7XG5udW1lcmljLnRydW5jID0gZnVuY3Rpb24gdHJ1bmMoeCx5KSB7XG4gICAgaWYodHlwZW9mIHggPT09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgaWYodHlwZW9mIHkgPT09IFwib2JqZWN0XCIpIHJldHVybiBudW1lcmljLnRydW5jVlYoeCx5KTtcbiAgICAgICAgcmV0dXJuIG51bWVyaWMudHJ1bmNWUyh4LHkpO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIHkgPT09IFwib2JqZWN0XCIpIHJldHVybiBudW1lcmljLnRydW5jU1YoeCx5KTtcbiAgICByZXR1cm4gTWF0aC5yb3VuZCh4L3kpKnk7XG59XG5cbm51bWVyaWMuaW52ID0gZnVuY3Rpb24gaW52KHgpIHtcbiAgICB2YXIgcyA9IG51bWVyaWMuZGltKHgpLCBhYnMgPSBNYXRoLmFicywgbSA9IHNbMF0sIG4gPSBzWzFdO1xuICAgIHZhciBBID0gbnVtZXJpYy5jbG9uZSh4KSwgQWksIEFqO1xuICAgIHZhciBJID0gbnVtZXJpYy5pZGVudGl0eShtKSwgSWksIElqO1xuICAgIHZhciBpLGosayx4O1xuICAgIGZvcihqPTA7ajxuOysraikge1xuICAgICAgICB2YXIgaTAgPSAtMTtcbiAgICAgICAgdmFyIHYwID0gLTE7XG4gICAgICAgIGZvcihpPWo7aSE9PW07KytpKSB7IGsgPSBhYnMoQVtpXVtqXSk7IGlmKGs+djApIHsgaTAgPSBpOyB2MCA9IGs7IH0gfVxuICAgICAgICBBaiA9IEFbaTBdOyBBW2kwXSA9IEFbal07IEFbal0gPSBBajtcbiAgICAgICAgSWogPSBJW2kwXTsgSVtpMF0gPSBJW2pdOyBJW2pdID0gSWo7XG4gICAgICAgIHggPSBBaltqXTtcbiAgICAgICAgZm9yKGs9ajtrIT09bjsrK2spICAgIEFqW2tdIC89IHg7IFxuICAgICAgICBmb3Ioaz1uLTE7ayE9PS0xOy0taykgSWpba10gLz0geDtcbiAgICAgICAgZm9yKGk9bS0xO2khPT0tMTstLWkpIHtcbiAgICAgICAgICAgIGlmKGkhPT1qKSB7XG4gICAgICAgICAgICAgICAgQWkgPSBBW2ldO1xuICAgICAgICAgICAgICAgIElpID0gSVtpXTtcbiAgICAgICAgICAgICAgICB4ID0gQWlbal07XG4gICAgICAgICAgICAgICAgZm9yKGs9aisxO2shPT1uOysraykgIEFpW2tdIC09IEFqW2tdKng7XG4gICAgICAgICAgICAgICAgZm9yKGs9bi0xO2s+MDstLWspIHsgSWlba10gLT0gSWpba10qeDsgLS1rOyBJaVtrXSAtPSBJaltrXSp4OyB9XG4gICAgICAgICAgICAgICAgaWYoaz09PTApIElpWzBdIC09IElqWzBdKng7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIEk7XG59XG5cbm51bWVyaWMuZGV0ID0gZnVuY3Rpb24gZGV0KHgpIHtcbiAgICB2YXIgcyA9IG51bWVyaWMuZGltKHgpO1xuICAgIGlmKHMubGVuZ3RoICE9PSAyIHx8IHNbMF0gIT09IHNbMV0pIHsgdGhyb3cgbmV3IEVycm9yKCdudW1lcmljOiBkZXQoKSBvbmx5IHdvcmtzIG9uIHNxdWFyZSBtYXRyaWNlcycpOyB9XG4gICAgdmFyIG4gPSBzWzBdLCByZXQgPSAxLGksaixrLEEgPSBudW1lcmljLmNsb25lKHgpLEFqLEFpLGFscGhhLHRlbXAsazEsazIsazM7XG4gICAgZm9yKGo9MDtqPG4tMTtqKyspIHtcbiAgICAgICAgaz1qO1xuICAgICAgICBmb3IoaT1qKzE7aTxuO2krKykgeyBpZihNYXRoLmFicyhBW2ldW2pdKSA+IE1hdGguYWJzKEFba11bal0pKSB7IGsgPSBpOyB9IH1cbiAgICAgICAgaWYoayAhPT0gaikge1xuICAgICAgICAgICAgdGVtcCA9IEFba107IEFba10gPSBBW2pdOyBBW2pdID0gdGVtcDtcbiAgICAgICAgICAgIHJldCAqPSAtMTtcbiAgICAgICAgfVxuICAgICAgICBBaiA9IEFbal07XG4gICAgICAgIGZvcihpPWorMTtpPG47aSsrKSB7XG4gICAgICAgICAgICBBaSA9IEFbaV07XG4gICAgICAgICAgICBhbHBoYSA9IEFpW2pdL0FqW2pdO1xuICAgICAgICAgICAgZm9yKGs9aisxO2s8bi0xO2srPTIpIHtcbiAgICAgICAgICAgICAgICBrMSA9IGsrMTtcbiAgICAgICAgICAgICAgICBBaVtrXSAtPSBBaltrXSphbHBoYTtcbiAgICAgICAgICAgICAgICBBaVtrMV0gLT0gQWpbazFdKmFscGhhO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYoayE9PW4pIHsgQWlba10gLT0gQWpba10qYWxwaGE7IH1cbiAgICAgICAgfVxuICAgICAgICBpZihBaltqXSA9PT0gMCkgeyByZXR1cm4gMDsgfVxuICAgICAgICByZXQgKj0gQWpbal07XG4gICAgfVxuICAgIHJldHVybiByZXQqQVtqXVtqXTtcbn1cblxubnVtZXJpYy50cmFuc3Bvc2UgPSBmdW5jdGlvbiB0cmFuc3Bvc2UoeCkge1xuICAgIHZhciBpLGosbSA9IHgubGVuZ3RoLG4gPSB4WzBdLmxlbmd0aCwgcmV0PUFycmF5KG4pLEEwLEExLEJqO1xuICAgIGZvcihqPTA7ajxuO2orKykgcmV0W2pdID0gQXJyYXkobSk7XG4gICAgZm9yKGk9bS0xO2k+PTE7aS09Mikge1xuICAgICAgICBBMSA9IHhbaV07XG4gICAgICAgIEEwID0geFtpLTFdO1xuICAgICAgICBmb3Ioaj1uLTE7aj49MTstLWopIHtcbiAgICAgICAgICAgIEJqID0gcmV0W2pdOyBCaltpXSA9IEExW2pdOyBCaltpLTFdID0gQTBbal07XG4gICAgICAgICAgICAtLWo7XG4gICAgICAgICAgICBCaiA9IHJldFtqXTsgQmpbaV0gPSBBMVtqXTsgQmpbaS0xXSA9IEEwW2pdO1xuICAgICAgICB9XG4gICAgICAgIGlmKGo9PT0wKSB7XG4gICAgICAgICAgICBCaiA9IHJldFswXTsgQmpbaV0gPSBBMVswXTsgQmpbaS0xXSA9IEEwWzBdO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmKGk9PT0wKSB7XG4gICAgICAgIEEwID0geFswXTtcbiAgICAgICAgZm9yKGo9bi0xO2o+PTE7LS1qKSB7XG4gICAgICAgICAgICByZXRbal1bMF0gPSBBMFtqXTtcbiAgICAgICAgICAgIC0tajtcbiAgICAgICAgICAgIHJldFtqXVswXSA9IEEwW2pdO1xuICAgICAgICB9XG4gICAgICAgIGlmKGo9PT0wKSB7IHJldFswXVswXSA9IEEwWzBdOyB9XG4gICAgfVxuICAgIHJldHVybiByZXQ7XG59XG5udW1lcmljLm5lZ3RyYW5zcG9zZSA9IGZ1bmN0aW9uIG5lZ3RyYW5zcG9zZSh4KSB7XG4gICAgdmFyIGksaixtID0geC5sZW5ndGgsbiA9IHhbMF0ubGVuZ3RoLCByZXQ9QXJyYXkobiksQTAsQTEsQmo7XG4gICAgZm9yKGo9MDtqPG47aisrKSByZXRbal0gPSBBcnJheShtKTtcbiAgICBmb3IoaT1tLTE7aT49MTtpLT0yKSB7XG4gICAgICAgIEExID0geFtpXTtcbiAgICAgICAgQTAgPSB4W2ktMV07XG4gICAgICAgIGZvcihqPW4tMTtqPj0xOy0taikge1xuICAgICAgICAgICAgQmogPSByZXRbal07IEJqW2ldID0gLUExW2pdOyBCaltpLTFdID0gLUEwW2pdO1xuICAgICAgICAgICAgLS1qO1xuICAgICAgICAgICAgQmogPSByZXRbal07IEJqW2ldID0gLUExW2pdOyBCaltpLTFdID0gLUEwW2pdO1xuICAgICAgICB9XG4gICAgICAgIGlmKGo9PT0wKSB7XG4gICAgICAgICAgICBCaiA9IHJldFswXTsgQmpbaV0gPSAtQTFbMF07IEJqW2ktMV0gPSAtQTBbMF07XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYoaT09PTApIHtcbiAgICAgICAgQTAgPSB4WzBdO1xuICAgICAgICBmb3Ioaj1uLTE7aj49MTstLWopIHtcbiAgICAgICAgICAgIHJldFtqXVswXSA9IC1BMFtqXTtcbiAgICAgICAgICAgIC0tajtcbiAgICAgICAgICAgIHJldFtqXVswXSA9IC1BMFtqXTtcbiAgICAgICAgfVxuICAgICAgICBpZihqPT09MCkgeyByZXRbMF1bMF0gPSAtQTBbMF07IH1cbiAgICB9XG4gICAgcmV0dXJuIHJldDtcbn1cblxubnVtZXJpYy5fcmFuZG9tID0gZnVuY3Rpb24gX3JhbmRvbShzLGspIHtcbiAgICB2YXIgaSxuPXNba10scmV0PUFycmF5KG4pLCBybmQ7XG4gICAgaWYoayA9PT0gcy5sZW5ndGgtMSkge1xuICAgICAgICBybmQgPSBNYXRoLnJhbmRvbTtcbiAgICAgICAgZm9yKGk9bi0xO2k+PTE7aS09Mikge1xuICAgICAgICAgICAgcmV0W2ldID0gcm5kKCk7XG4gICAgICAgICAgICByZXRbaS0xXSA9IHJuZCgpO1xuICAgICAgICB9XG4gICAgICAgIGlmKGk9PT0wKSB7IHJldFswXSA9IHJuZCgpOyB9XG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfVxuICAgIGZvcihpPW4tMTtpPj0wO2ktLSkgcmV0W2ldID0gX3JhbmRvbShzLGsrMSk7XG4gICAgcmV0dXJuIHJldDtcbn1cbm51bWVyaWMucmFuZG9tID0gZnVuY3Rpb24gcmFuZG9tKHMpIHsgcmV0dXJuIG51bWVyaWMuX3JhbmRvbShzLDApOyB9XG5cbm51bWVyaWMubm9ybTIgPSBmdW5jdGlvbiBub3JtMih4KSB7IHJldHVybiBNYXRoLnNxcnQobnVtZXJpYy5ub3JtMlNxdWFyZWQoeCkpOyB9XG5cbm51bWVyaWMubGluc3BhY2UgPSBmdW5jdGlvbiBsaW5zcGFjZShhLGIsbikge1xuICAgIGlmKHR5cGVvZiBuID09PSBcInVuZGVmaW5lZFwiKSBuID0gTWF0aC5tYXgoTWF0aC5yb3VuZChiLWEpKzEsMSk7XG4gICAgaWYobjwyKSB7IHJldHVybiBuPT09MT9bYV06W107IH1cbiAgICB2YXIgaSxyZXQgPSBBcnJheShuKTtcbiAgICBuLS07XG4gICAgZm9yKGk9bjtpPj0wO2ktLSkgeyByZXRbaV0gPSAoaSpiKyhuLWkpKmEpL247IH1cbiAgICByZXR1cm4gcmV0O1xufVxuXG5udW1lcmljLmdldEJsb2NrID0gZnVuY3Rpb24gZ2V0QmxvY2soeCxmcm9tLHRvKSB7XG4gICAgdmFyIHMgPSBudW1lcmljLmRpbSh4KTtcbiAgICBmdW5jdGlvbiBmb28oeCxrKSB7XG4gICAgICAgIHZhciBpLGEgPSBmcm9tW2tdLCBuID0gdG9ba10tYSwgcmV0ID0gQXJyYXkobik7XG4gICAgICAgIGlmKGsgPT09IHMubGVuZ3RoLTEpIHtcbiAgICAgICAgICAgIGZvcihpPW47aT49MDtpLS0pIHsgcmV0W2ldID0geFtpK2FdOyB9XG4gICAgICAgICAgICByZXR1cm4gcmV0O1xuICAgICAgICB9XG4gICAgICAgIGZvcihpPW47aT49MDtpLS0pIHsgcmV0W2ldID0gZm9vKHhbaSthXSxrKzEpOyB9XG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfVxuICAgIHJldHVybiBmb28oeCwwKTtcbn1cblxubnVtZXJpYy5zZXRCbG9jayA9IGZ1bmN0aW9uIHNldEJsb2NrKHgsZnJvbSx0byxCKSB7XG4gICAgdmFyIHMgPSBudW1lcmljLmRpbSh4KTtcbiAgICBmdW5jdGlvbiBmb28oeCx5LGspIHtcbiAgICAgICAgdmFyIGksYSA9IGZyb21ba10sIG4gPSB0b1trXS1hO1xuICAgICAgICBpZihrID09PSBzLmxlbmd0aC0xKSB7IGZvcihpPW47aT49MDtpLS0pIHsgeFtpK2FdID0geVtpXTsgfSB9XG4gICAgICAgIGZvcihpPW47aT49MDtpLS0pIHsgZm9vKHhbaSthXSx5W2ldLGsrMSk7IH1cbiAgICB9XG4gICAgZm9vKHgsQiwwKTtcbiAgICByZXR1cm4geDtcbn1cblxubnVtZXJpYy5nZXRSYW5nZSA9IGZ1bmN0aW9uIGdldFJhbmdlKEEsSSxKKSB7XG4gICAgdmFyIG0gPSBJLmxlbmd0aCwgbiA9IEoubGVuZ3RoO1xuICAgIHZhciBpLGo7XG4gICAgdmFyIEIgPSBBcnJheShtKSwgQmksIEFJO1xuICAgIGZvcihpPW0tMTtpIT09LTE7LS1pKSB7XG4gICAgICAgIEJbaV0gPSBBcnJheShuKTtcbiAgICAgICAgQmkgPSBCW2ldO1xuICAgICAgICBBSSA9IEFbSVtpXV07XG4gICAgICAgIGZvcihqPW4tMTtqIT09LTE7LS1qKSBCaVtqXSA9IEFJW0pbal1dO1xuICAgIH1cbiAgICByZXR1cm4gQjtcbn1cblxubnVtZXJpYy5ibG9ja01hdHJpeCA9IGZ1bmN0aW9uIGJsb2NrTWF0cml4KFgpIHtcbiAgICB2YXIgcyA9IG51bWVyaWMuZGltKFgpO1xuICAgIGlmKHMubGVuZ3RoPDQpIHJldHVybiBudW1lcmljLmJsb2NrTWF0cml4KFtYXSk7XG4gICAgdmFyIG09c1swXSxuPXNbMV0sTSxOLGksaixYaWo7XG4gICAgTSA9IDA7IE4gPSAwO1xuICAgIGZvcihpPTA7aTxtOysraSkgTSs9WFtpXVswXS5sZW5ndGg7XG4gICAgZm9yKGo9MDtqPG47KytqKSBOKz1YWzBdW2pdWzBdLmxlbmd0aDtcbiAgICB2YXIgWiA9IEFycmF5KE0pO1xuICAgIGZvcihpPTA7aTxNOysraSkgWltpXSA9IEFycmF5KE4pO1xuICAgIHZhciBJPTAsSixaSSxrLGwsWGlqaztcbiAgICBmb3IoaT0wO2k8bTsrK2kpIHtcbiAgICAgICAgSj1OO1xuICAgICAgICBmb3Ioaj1uLTE7aiE9PS0xOy0taikge1xuICAgICAgICAgICAgWGlqID0gWFtpXVtqXTtcbiAgICAgICAgICAgIEogLT0gWGlqWzBdLmxlbmd0aDtcbiAgICAgICAgICAgIGZvcihrPVhpai5sZW5ndGgtMTtrIT09LTE7LS1rKSB7XG4gICAgICAgICAgICAgICAgWGlqayA9IFhpaltrXTtcbiAgICAgICAgICAgICAgICBaSSA9IFpbSStrXTtcbiAgICAgICAgICAgICAgICBmb3IobCA9IFhpamsubGVuZ3RoLTE7bCE9PS0xOy0tbCkgWklbSitsXSA9IFhpamtbbF07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgSSArPSBYW2ldWzBdLmxlbmd0aDtcbiAgICB9XG4gICAgcmV0dXJuIFo7XG59XG5cbm51bWVyaWMudGVuc29yID0gZnVuY3Rpb24gdGVuc29yKHgseSkge1xuICAgIGlmKHR5cGVvZiB4ID09PSBcIm51bWJlclwiIHx8IHR5cGVvZiB5ID09PSBcIm51bWJlclwiKSByZXR1cm4gbnVtZXJpYy5tdWwoeCx5KTtcbiAgICB2YXIgczEgPSBudW1lcmljLmRpbSh4KSwgczIgPSBudW1lcmljLmRpbSh5KTtcbiAgICBpZihzMS5sZW5ndGggIT09IDEgfHwgczIubGVuZ3RoICE9PSAxKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignbnVtZXJpYzogdGVuc29yIHByb2R1Y3QgaXMgb25seSBkZWZpbmVkIGZvciB2ZWN0b3JzJyk7XG4gICAgfVxuICAgIHZhciBtID0gczFbMF0sIG4gPSBzMlswXSwgQSA9IEFycmF5KG0pLCBBaSwgaSxqLHhpO1xuICAgIGZvcihpPW0tMTtpPj0wO2ktLSkge1xuICAgICAgICBBaSA9IEFycmF5KG4pO1xuICAgICAgICB4aSA9IHhbaV07XG4gICAgICAgIGZvcihqPW4tMTtqPj0zOy0taikge1xuICAgICAgICAgICAgQWlbal0gPSB4aSAqIHlbal07XG4gICAgICAgICAgICAtLWo7XG4gICAgICAgICAgICBBaVtqXSA9IHhpICogeVtqXTtcbiAgICAgICAgICAgIC0tajtcbiAgICAgICAgICAgIEFpW2pdID0geGkgKiB5W2pdO1xuICAgICAgICAgICAgLS1qO1xuICAgICAgICAgICAgQWlbal0gPSB4aSAqIHlbal07XG4gICAgICAgIH1cbiAgICAgICAgd2hpbGUoaj49MCkgeyBBaVtqXSA9IHhpICogeVtqXTsgLS1qOyB9XG4gICAgICAgIEFbaV0gPSBBaTtcbiAgICB9XG4gICAgcmV0dXJuIEE7XG59XG5cbi8vIDMuIFRoZSBUZW5zb3IgdHlwZSBUXG5udW1lcmljLlQgPSBmdW5jdGlvbiBUKHgseSkgeyB0aGlzLnggPSB4OyB0aGlzLnkgPSB5OyB9XG5udW1lcmljLnQgPSBmdW5jdGlvbiB0KHgseSkgeyByZXR1cm4gbmV3IG51bWVyaWMuVCh4LHkpOyB9XG5cbm51bWVyaWMuVGJpbm9wID0gZnVuY3Rpb24gVGJpbm9wKHJyLHJjLGNyLGNjLHNldHVwKSB7XG4gICAgdmFyIGlvID0gbnVtZXJpYy5pbmRleE9mO1xuICAgIGlmKHR5cGVvZiBzZXR1cCAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgICB2YXIgaztcbiAgICAgICAgc2V0dXAgPSAnJztcbiAgICAgICAgZm9yKGsgaW4gbnVtZXJpYykge1xuICAgICAgICAgICAgaWYobnVtZXJpYy5oYXNPd25Qcm9wZXJ0eShrKSAmJiAocnIuaW5kZXhPZihrKT49MCB8fCByYy5pbmRleE9mKGspPj0wIHx8IGNyLmluZGV4T2Yoayk+PTAgfHwgY2MuaW5kZXhPZihrKT49MCkgJiYgay5sZW5ndGg+MSkge1xuICAgICAgICAgICAgICAgIHNldHVwICs9ICd2YXIgJytrKycgPSBudW1lcmljLicraysnO1xcbic7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIEZ1bmN0aW9uKFsneSddLFxuICAgICAgICAgICAgJ3ZhciB4ID0gdGhpcztcXG4nK1xuICAgICAgICAgICAgJ2lmKCEoeSBpbnN0YW5jZW9mIG51bWVyaWMuVCkpIHsgeSA9IG5ldyBudW1lcmljLlQoeSk7IH1cXG4nK1xuICAgICAgICAgICAgc2V0dXArJ1xcbicrXG4gICAgICAgICAgICAnaWYoeC55KSB7JytcbiAgICAgICAgICAgICcgIGlmKHkueSkgeycrXG4gICAgICAgICAgICAnICAgIHJldHVybiBuZXcgbnVtZXJpYy5UKCcrY2MrJyk7XFxuJytcbiAgICAgICAgICAgICcgIH1cXG4nK1xuICAgICAgICAgICAgJyAgcmV0dXJuIG5ldyBudW1lcmljLlQoJytjcisnKTtcXG4nK1xuICAgICAgICAgICAgJ31cXG4nK1xuICAgICAgICAgICAgJ2lmKHkueSkge1xcbicrXG4gICAgICAgICAgICAnICByZXR1cm4gbmV3IG51bWVyaWMuVCgnK3JjKycpO1xcbicrXG4gICAgICAgICAgICAnfVxcbicrXG4gICAgICAgICAgICAncmV0dXJuIG5ldyBudW1lcmljLlQoJytycisnKTtcXG4nXG4gICAgKTtcbn1cblxubnVtZXJpYy5ULnByb3RvdHlwZS5hZGQgPSBudW1lcmljLlRiaW5vcChcbiAgICAgICAgJ2FkZCh4LngseS54KScsXG4gICAgICAgICdhZGQoeC54LHkueCkseS55JyxcbiAgICAgICAgJ2FkZCh4LngseS54KSx4LnknLFxuICAgICAgICAnYWRkKHgueCx5LngpLGFkZCh4LnkseS55KScpO1xubnVtZXJpYy5ULnByb3RvdHlwZS5zdWIgPSBudW1lcmljLlRiaW5vcChcbiAgICAgICAgJ3N1Yih4LngseS54KScsXG4gICAgICAgICdzdWIoeC54LHkueCksbmVnKHkueSknLFxuICAgICAgICAnc3ViKHgueCx5LngpLHgueScsXG4gICAgICAgICdzdWIoeC54LHkueCksc3ViKHgueSx5LnkpJyk7XG5udW1lcmljLlQucHJvdG90eXBlLm11bCA9IG51bWVyaWMuVGJpbm9wKFxuICAgICAgICAnbXVsKHgueCx5LngpJyxcbiAgICAgICAgJ211bCh4LngseS54KSxtdWwoeC54LHkueSknLFxuICAgICAgICAnbXVsKHgueCx5LngpLG11bCh4LnkseS54KScsXG4gICAgICAgICdzdWIobXVsKHgueCx5LngpLG11bCh4LnkseS55KSksYWRkKG11bCh4LngseS55KSxtdWwoeC55LHkueCkpJyk7XG5cbm51bWVyaWMuVC5wcm90b3R5cGUucmVjaXByb2NhbCA9IGZ1bmN0aW9uIHJlY2lwcm9jYWwoKSB7XG4gICAgdmFyIG11bCA9IG51bWVyaWMubXVsLCBkaXYgPSBudW1lcmljLmRpdjtcbiAgICBpZih0aGlzLnkpIHtcbiAgICAgICAgdmFyIGQgPSBudW1lcmljLmFkZChtdWwodGhpcy54LHRoaXMueCksbXVsKHRoaXMueSx0aGlzLnkpKTtcbiAgICAgICAgcmV0dXJuIG5ldyBudW1lcmljLlQoZGl2KHRoaXMueCxkKSxkaXYobnVtZXJpYy5uZWcodGhpcy55KSxkKSk7XG4gICAgfVxuICAgIHJldHVybiBuZXcgVChkaXYoMSx0aGlzLngpKTtcbn1cbm51bWVyaWMuVC5wcm90b3R5cGUuZGl2ID0gZnVuY3Rpb24gZGl2KHkpIHtcbiAgICBpZighKHkgaW5zdGFuY2VvZiBudW1lcmljLlQpKSB5ID0gbmV3IG51bWVyaWMuVCh5KTtcbiAgICBpZih5LnkpIHsgcmV0dXJuIHRoaXMubXVsKHkucmVjaXByb2NhbCgpKTsgfVxuICAgIHZhciBkaXYgPSBudW1lcmljLmRpdjtcbiAgICBpZih0aGlzLnkpIHsgcmV0dXJuIG5ldyBudW1lcmljLlQoZGl2KHRoaXMueCx5LngpLGRpdih0aGlzLnkseS54KSk7IH1cbiAgICByZXR1cm4gbmV3IG51bWVyaWMuVChkaXYodGhpcy54LHkueCkpO1xufVxubnVtZXJpYy5ULnByb3RvdHlwZS5kb3QgPSBudW1lcmljLlRiaW5vcChcbiAgICAgICAgJ2RvdCh4LngseS54KScsXG4gICAgICAgICdkb3QoeC54LHkueCksZG90KHgueCx5LnkpJyxcbiAgICAgICAgJ2RvdCh4LngseS54KSxkb3QoeC55LHkueCknLFxuICAgICAgICAnc3ViKGRvdCh4LngseS54KSxkb3QoeC55LHkueSkpLGFkZChkb3QoeC54LHkueSksZG90KHgueSx5LngpKSdcbiAgICAgICAgKTtcbm51bWVyaWMuVC5wcm90b3R5cGUudHJhbnNwb3NlID0gZnVuY3Rpb24gdHJhbnNwb3NlKCkge1xuICAgIHZhciB0ID0gbnVtZXJpYy50cmFuc3Bvc2UsIHggPSB0aGlzLngsIHkgPSB0aGlzLnk7XG4gICAgaWYoeSkgeyByZXR1cm4gbmV3IG51bWVyaWMuVCh0KHgpLHQoeSkpOyB9XG4gICAgcmV0dXJuIG5ldyBudW1lcmljLlQodCh4KSk7XG59XG5udW1lcmljLlQucHJvdG90eXBlLnRyYW5zanVnYXRlID0gZnVuY3Rpb24gdHJhbnNqdWdhdGUoKSB7XG4gICAgdmFyIHQgPSBudW1lcmljLnRyYW5zcG9zZSwgeCA9IHRoaXMueCwgeSA9IHRoaXMueTtcbiAgICBpZih5KSB7IHJldHVybiBuZXcgbnVtZXJpYy5UKHQoeCksbnVtZXJpYy5uZWd0cmFuc3Bvc2UoeSkpOyB9XG4gICAgcmV0dXJuIG5ldyBudW1lcmljLlQodCh4KSk7XG59XG5udW1lcmljLlR1bm9wID0gZnVuY3Rpb24gVHVub3AocixjLHMpIHtcbiAgICBpZih0eXBlb2YgcyAhPT0gXCJzdHJpbmdcIikgeyBzID0gJyc7IH1cbiAgICByZXR1cm4gRnVuY3Rpb24oXG4gICAgICAgICAgICAndmFyIHggPSB0aGlzO1xcbicrXG4gICAgICAgICAgICBzKydcXG4nK1xuICAgICAgICAgICAgJ2lmKHgueSkgeycrXG4gICAgICAgICAgICAnICAnK2MrJztcXG4nK1xuICAgICAgICAgICAgJ31cXG4nK1xuICAgICAgICAgICAgcisnO1xcbidcbiAgICApO1xufVxuXG5udW1lcmljLlQucHJvdG90eXBlLmV4cCA9IG51bWVyaWMuVHVub3AoXG4gICAgICAgICdyZXR1cm4gbmV3IG51bWVyaWMuVChleCknLFxuICAgICAgICAncmV0dXJuIG5ldyBudW1lcmljLlQobXVsKGNvcyh4LnkpLGV4KSxtdWwoc2luKHgueSksZXgpKScsXG4gICAgICAgICd2YXIgZXggPSBudW1lcmljLmV4cCh4LngpLCBjb3MgPSBudW1lcmljLmNvcywgc2luID0gbnVtZXJpYy5zaW4sIG11bCA9IG51bWVyaWMubXVsOycpO1xubnVtZXJpYy5ULnByb3RvdHlwZS5jb25qID0gbnVtZXJpYy5UdW5vcChcbiAgICAgICAgJ3JldHVybiBuZXcgbnVtZXJpYy5UKHgueCk7JyxcbiAgICAgICAgJ3JldHVybiBuZXcgbnVtZXJpYy5UKHgueCxudW1lcmljLm5lZyh4LnkpKTsnKTtcbm51bWVyaWMuVC5wcm90b3R5cGUubmVnID0gbnVtZXJpYy5UdW5vcChcbiAgICAgICAgJ3JldHVybiBuZXcgbnVtZXJpYy5UKG5lZyh4LngpKTsnLFxuICAgICAgICAncmV0dXJuIG5ldyBudW1lcmljLlQobmVnKHgueCksbmVnKHgueSkpOycsXG4gICAgICAgICd2YXIgbmVnID0gbnVtZXJpYy5uZWc7Jyk7XG5udW1lcmljLlQucHJvdG90eXBlLnNpbiA9IG51bWVyaWMuVHVub3AoXG4gICAgICAgICdyZXR1cm4gbmV3IG51bWVyaWMuVChudW1lcmljLnNpbih4LngpKScsXG4gICAgICAgICdyZXR1cm4geC5leHAoKS5zdWIoeC5uZWcoKS5leHAoKSkuZGl2KG5ldyBudW1lcmljLlQoMCwyKSk7Jyk7XG5udW1lcmljLlQucHJvdG90eXBlLmNvcyA9IG51bWVyaWMuVHVub3AoXG4gICAgICAgICdyZXR1cm4gbmV3IG51bWVyaWMuVChudW1lcmljLmNvcyh4LngpKScsXG4gICAgICAgICdyZXR1cm4geC5leHAoKS5hZGQoeC5uZWcoKS5leHAoKSkuZGl2KDIpOycpO1xubnVtZXJpYy5ULnByb3RvdHlwZS5hYnMgPSBudW1lcmljLlR1bm9wKFxuICAgICAgICAncmV0dXJuIG5ldyBudW1lcmljLlQobnVtZXJpYy5hYnMoeC54KSk7JyxcbiAgICAgICAgJ3JldHVybiBuZXcgbnVtZXJpYy5UKG51bWVyaWMuc3FydChudW1lcmljLmFkZChtdWwoeC54LHgueCksbXVsKHgueSx4LnkpKSkpOycsXG4gICAgICAgICd2YXIgbXVsID0gbnVtZXJpYy5tdWw7Jyk7XG5udW1lcmljLlQucHJvdG90eXBlLmxvZyA9IG51bWVyaWMuVHVub3AoXG4gICAgICAgICdyZXR1cm4gbmV3IG51bWVyaWMuVChudW1lcmljLmxvZyh4LngpKTsnLFxuICAgICAgICAndmFyIHRoZXRhID0gbmV3IG51bWVyaWMuVChudW1lcmljLmF0YW4yKHgueSx4LngpKSwgciA9IHguYWJzKCk7XFxuJytcbiAgICAgICAgJ3JldHVybiBuZXcgbnVtZXJpYy5UKG51bWVyaWMubG9nKHIueCksdGhldGEueCk7Jyk7XG5udW1lcmljLlQucHJvdG90eXBlLm5vcm0yID0gbnVtZXJpYy5UdW5vcChcbiAgICAgICAgJ3JldHVybiBudW1lcmljLm5vcm0yKHgueCk7JyxcbiAgICAgICAgJ3ZhciBmID0gbnVtZXJpYy5ub3JtMlNxdWFyZWQ7XFxuJytcbiAgICAgICAgJ3JldHVybiBNYXRoLnNxcnQoZih4LngpK2YoeC55KSk7Jyk7XG5udW1lcmljLlQucHJvdG90eXBlLmludiA9IGZ1bmN0aW9uIGludigpIHtcbiAgICB2YXIgQSA9IHRoaXM7XG4gICAgaWYodHlwZW9mIEEueSA9PT0gXCJ1bmRlZmluZWRcIikgeyByZXR1cm4gbmV3IG51bWVyaWMuVChudW1lcmljLmludihBLngpKTsgfVxuICAgIHZhciBuID0gQS54Lmxlbmd0aCwgaSwgaiwgaztcbiAgICB2YXIgUnggPSBudW1lcmljLmlkZW50aXR5KG4pLFJ5ID0gbnVtZXJpYy5yZXAoW24sbl0sMCk7XG4gICAgdmFyIEF4ID0gbnVtZXJpYy5jbG9uZShBLngpLCBBeSA9IG51bWVyaWMuY2xvbmUoQS55KTtcbiAgICB2YXIgQWl4LCBBaXksIEFqeCwgQWp5LCBSaXgsIFJpeSwgUmp4LCBSank7XG4gICAgdmFyIGksaixrLGQsZDEsYXgsYXksYngsYnksdGVtcDtcbiAgICBmb3IoaT0wO2k8bjtpKyspIHtcbiAgICAgICAgYXggPSBBeFtpXVtpXTsgYXkgPSBBeVtpXVtpXTtcbiAgICAgICAgZCA9IGF4KmF4K2F5KmF5O1xuICAgICAgICBrID0gaTtcbiAgICAgICAgZm9yKGo9aSsxO2o8bjtqKyspIHtcbiAgICAgICAgICAgIGF4ID0gQXhbal1baV07IGF5ID0gQXlbal1baV07XG4gICAgICAgICAgICBkMSA9IGF4KmF4K2F5KmF5O1xuICAgICAgICAgICAgaWYoZDEgPiBkKSB7IGs9ajsgZCA9IGQxOyB9XG4gICAgICAgIH1cbiAgICAgICAgaWYoayE9PWkpIHtcbiAgICAgICAgICAgIHRlbXAgPSBBeFtpXTsgQXhbaV0gPSBBeFtrXTsgQXhba10gPSB0ZW1wO1xuICAgICAgICAgICAgdGVtcCA9IEF5W2ldOyBBeVtpXSA9IEF5W2tdOyBBeVtrXSA9IHRlbXA7XG4gICAgICAgICAgICB0ZW1wID0gUnhbaV07IFJ4W2ldID0gUnhba107IFJ4W2tdID0gdGVtcDtcbiAgICAgICAgICAgIHRlbXAgPSBSeVtpXTsgUnlbaV0gPSBSeVtrXTsgUnlba10gPSB0ZW1wO1xuICAgICAgICB9XG4gICAgICAgIEFpeCA9IEF4W2ldOyBBaXkgPSBBeVtpXTtcbiAgICAgICAgUml4ID0gUnhbaV07IFJpeSA9IFJ5W2ldO1xuICAgICAgICBheCA9IEFpeFtpXTsgYXkgPSBBaXlbaV07XG4gICAgICAgIGZvcihqPWkrMTtqPG47aisrKSB7XG4gICAgICAgICAgICBieCA9IEFpeFtqXTsgYnkgPSBBaXlbal07XG4gICAgICAgICAgICBBaXhbal0gPSAoYngqYXgrYnkqYXkpL2Q7XG4gICAgICAgICAgICBBaXlbal0gPSAoYnkqYXgtYngqYXkpL2Q7XG4gICAgICAgIH1cbiAgICAgICAgZm9yKGo9MDtqPG47aisrKSB7XG4gICAgICAgICAgICBieCA9IFJpeFtqXTsgYnkgPSBSaXlbal07XG4gICAgICAgICAgICBSaXhbal0gPSAoYngqYXgrYnkqYXkpL2Q7XG4gICAgICAgICAgICBSaXlbal0gPSAoYnkqYXgtYngqYXkpL2Q7XG4gICAgICAgIH1cbiAgICAgICAgZm9yKGo9aSsxO2o8bjtqKyspIHtcbiAgICAgICAgICAgIEFqeCA9IEF4W2pdOyBBankgPSBBeVtqXTtcbiAgICAgICAgICAgIFJqeCA9IFJ4W2pdOyBSankgPSBSeVtqXTtcbiAgICAgICAgICAgIGF4ID0gQWp4W2ldOyBheSA9IEFqeVtpXTtcbiAgICAgICAgICAgIGZvcihrPWkrMTtrPG47aysrKSB7XG4gICAgICAgICAgICAgICAgYnggPSBBaXhba107IGJ5ID0gQWl5W2tdO1xuICAgICAgICAgICAgICAgIEFqeFtrXSAtPSBieCpheC1ieSpheTtcbiAgICAgICAgICAgICAgICBBanlba10gLT0gYnkqYXgrYngqYXk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmb3Ioaz0wO2s8bjtrKyspIHtcbiAgICAgICAgICAgICAgICBieCA9IFJpeFtrXTsgYnkgPSBSaXlba107XG4gICAgICAgICAgICAgICAgUmp4W2tdIC09IGJ4KmF4LWJ5KmF5O1xuICAgICAgICAgICAgICAgIFJqeVtrXSAtPSBieSpheCtieCpheTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBmb3IoaT1uLTE7aT4wO2ktLSkge1xuICAgICAgICBSaXggPSBSeFtpXTsgUml5ID0gUnlbaV07XG4gICAgICAgIGZvcihqPWktMTtqPj0wO2otLSkge1xuICAgICAgICAgICAgUmp4ID0gUnhbal07IFJqeSA9IFJ5W2pdO1xuICAgICAgICAgICAgYXggPSBBeFtqXVtpXTsgYXkgPSBBeVtqXVtpXTtcbiAgICAgICAgICAgIGZvcihrPW4tMTtrPj0wO2stLSkge1xuICAgICAgICAgICAgICAgIGJ4ID0gUml4W2tdOyBieSA9IFJpeVtrXTtcbiAgICAgICAgICAgICAgICBSanhba10gLT0gYXgqYnggLSBheSpieTtcbiAgICAgICAgICAgICAgICBSanlba10gLT0gYXgqYnkgKyBheSpieDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbmV3IG51bWVyaWMuVChSeCxSeSk7XG59XG5udW1lcmljLlQucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uIGdldChpKSB7XG4gICAgdmFyIHggPSB0aGlzLngsIHkgPSB0aGlzLnksIGsgPSAwLCBpaywgbiA9IGkubGVuZ3RoO1xuICAgIGlmKHkpIHtcbiAgICAgICAgd2hpbGUoazxuKSB7XG4gICAgICAgICAgICBpayA9IGlba107XG4gICAgICAgICAgICB4ID0geFtpa107XG4gICAgICAgICAgICB5ID0geVtpa107XG4gICAgICAgICAgICBrKys7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5ldyBudW1lcmljLlQoeCx5KTtcbiAgICB9XG4gICAgd2hpbGUoazxuKSB7XG4gICAgICAgIGlrID0gaVtrXTtcbiAgICAgICAgeCA9IHhbaWtdO1xuICAgICAgICBrKys7XG4gICAgfVxuICAgIHJldHVybiBuZXcgbnVtZXJpYy5UKHgpO1xufVxubnVtZXJpYy5ULnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbiBzZXQoaSx2KSB7XG4gICAgdmFyIHggPSB0aGlzLngsIHkgPSB0aGlzLnksIGsgPSAwLCBpaywgbiA9IGkubGVuZ3RoLCB2eCA9IHYueCwgdnkgPSB2Lnk7XG4gICAgaWYobj09PTApIHtcbiAgICAgICAgaWYodnkpIHsgdGhpcy55ID0gdnk7IH1cbiAgICAgICAgZWxzZSBpZih5KSB7IHRoaXMueSA9IHVuZGVmaW5lZDsgfVxuICAgICAgICB0aGlzLnggPSB4O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgaWYodnkpIHtcbiAgICAgICAgaWYoeSkgeyAvKiBvayAqLyB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgeSA9IG51bWVyaWMucmVwKG51bWVyaWMuZGltKHgpLDApO1xuICAgICAgICAgICAgdGhpcy55ID0geTtcbiAgICAgICAgfVxuICAgICAgICB3aGlsZShrPG4tMSkge1xuICAgICAgICAgICAgaWsgPSBpW2tdO1xuICAgICAgICAgICAgeCA9IHhbaWtdO1xuICAgICAgICAgICAgeSA9IHlbaWtdO1xuICAgICAgICAgICAgaysrO1xuICAgICAgICB9XG4gICAgICAgIGlrID0gaVtrXTtcbiAgICAgICAgeFtpa10gPSB2eDtcbiAgICAgICAgeVtpa10gPSB2eTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIGlmKHkpIHtcbiAgICAgICAgd2hpbGUoazxuLTEpIHtcbiAgICAgICAgICAgIGlrID0gaVtrXTtcbiAgICAgICAgICAgIHggPSB4W2lrXTtcbiAgICAgICAgICAgIHkgPSB5W2lrXTtcbiAgICAgICAgICAgIGsrKztcbiAgICAgICAgfVxuICAgICAgICBpayA9IGlba107XG4gICAgICAgIHhbaWtdID0gdng7XG4gICAgICAgIGlmKHZ4IGluc3RhbmNlb2YgQXJyYXkpIHlbaWtdID0gbnVtZXJpYy5yZXAobnVtZXJpYy5kaW0odngpLDApO1xuICAgICAgICBlbHNlIHlbaWtdID0gMDtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIHdoaWxlKGs8bi0xKSB7XG4gICAgICAgIGlrID0gaVtrXTtcbiAgICAgICAgeCA9IHhbaWtdO1xuICAgICAgICBrKys7XG4gICAgfVxuICAgIGlrID0gaVtrXTtcbiAgICB4W2lrXSA9IHZ4O1xuICAgIHJldHVybiB0aGlzO1xufVxubnVtZXJpYy5ULnByb3RvdHlwZS5nZXRSb3dzID0gZnVuY3Rpb24gZ2V0Um93cyhpMCxpMSkge1xuICAgIHZhciBuID0gaTEtaTArMSwgajtcbiAgICB2YXIgcnggPSBBcnJheShuKSwgcnksIHggPSB0aGlzLngsIHkgPSB0aGlzLnk7XG4gICAgZm9yKGo9aTA7ajw9aTE7aisrKSB7IHJ4W2otaTBdID0geFtqXTsgfVxuICAgIGlmKHkpIHtcbiAgICAgICAgcnkgPSBBcnJheShuKTtcbiAgICAgICAgZm9yKGo9aTA7ajw9aTE7aisrKSB7IHJ5W2otaTBdID0geVtqXTsgfVxuICAgICAgICByZXR1cm4gbmV3IG51bWVyaWMuVChyeCxyeSk7XG4gICAgfVxuICAgIHJldHVybiBuZXcgbnVtZXJpYy5UKHJ4KTtcbn1cbm51bWVyaWMuVC5wcm90b3R5cGUuc2V0Um93cyA9IGZ1bmN0aW9uIHNldFJvd3MoaTAsaTEsQSkge1xuICAgIHZhciBqO1xuICAgIHZhciByeCA9IHRoaXMueCwgcnkgPSB0aGlzLnksIHggPSBBLngsIHkgPSBBLnk7XG4gICAgZm9yKGo9aTA7ajw9aTE7aisrKSB7IHJ4W2pdID0geFtqLWkwXTsgfVxuICAgIGlmKHkpIHtcbiAgICAgICAgaWYoIXJ5KSB7IHJ5ID0gbnVtZXJpYy5yZXAobnVtZXJpYy5kaW0ocngpLDApOyB0aGlzLnkgPSByeTsgfVxuICAgICAgICBmb3Ioaj1pMDtqPD1pMTtqKyspIHsgcnlbal0gPSB5W2otaTBdOyB9XG4gICAgfSBlbHNlIGlmKHJ5KSB7XG4gICAgICAgIGZvcihqPWkwO2o8PWkxO2orKykgeyByeVtqXSA9IG51bWVyaWMucmVwKFt4W2otaTBdLmxlbmd0aF0sMCk7IH1cbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG59XG5udW1lcmljLlQucHJvdG90eXBlLmdldFJvdyA9IGZ1bmN0aW9uIGdldFJvdyhrKSB7XG4gICAgdmFyIHggPSB0aGlzLngsIHkgPSB0aGlzLnk7XG4gICAgaWYoeSkgeyByZXR1cm4gbmV3IG51bWVyaWMuVCh4W2tdLHlba10pOyB9XG4gICAgcmV0dXJuIG5ldyBudW1lcmljLlQoeFtrXSk7XG59XG5udW1lcmljLlQucHJvdG90eXBlLnNldFJvdyA9IGZ1bmN0aW9uIHNldFJvdyhpLHYpIHtcbiAgICB2YXIgcnggPSB0aGlzLngsIHJ5ID0gdGhpcy55LCB4ID0gdi54LCB5ID0gdi55O1xuICAgIHJ4W2ldID0geDtcbiAgICBpZih5KSB7XG4gICAgICAgIGlmKCFyeSkgeyByeSA9IG51bWVyaWMucmVwKG51bWVyaWMuZGltKHJ4KSwwKTsgdGhpcy55ID0gcnk7IH1cbiAgICAgICAgcnlbaV0gPSB5O1xuICAgIH0gZWxzZSBpZihyeSkge1xuICAgICAgICByeSA9IG51bWVyaWMucmVwKFt4Lmxlbmd0aF0sMCk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xufVxuXG5udW1lcmljLlQucHJvdG90eXBlLmdldEJsb2NrID0gZnVuY3Rpb24gZ2V0QmxvY2soZnJvbSx0bykge1xuICAgIHZhciB4ID0gdGhpcy54LCB5ID0gdGhpcy55LCBiID0gbnVtZXJpYy5nZXRCbG9jaztcbiAgICBpZih5KSB7IHJldHVybiBuZXcgbnVtZXJpYy5UKGIoeCxmcm9tLHRvKSxiKHksZnJvbSx0bykpOyB9XG4gICAgcmV0dXJuIG5ldyBudW1lcmljLlQoYih4LGZyb20sdG8pKTtcbn1cbm51bWVyaWMuVC5wcm90b3R5cGUuc2V0QmxvY2sgPSBmdW5jdGlvbiBzZXRCbG9jayhmcm9tLHRvLEEpIHtcbiAgICBpZighKEEgaW5zdGFuY2VvZiBudW1lcmljLlQpKSBBID0gbmV3IG51bWVyaWMuVChBKTtcbiAgICB2YXIgeCA9IHRoaXMueCwgeSA9IHRoaXMueSwgYiA9IG51bWVyaWMuc2V0QmxvY2ssIEF4ID0gQS54LCBBeSA9IEEueTtcbiAgICBpZihBeSkge1xuICAgICAgICBpZigheSkgeyB0aGlzLnkgPSBudW1lcmljLnJlcChudW1lcmljLmRpbSh0aGlzKSwwKTsgeSA9IHRoaXMueTsgfVxuICAgICAgICBiKHgsZnJvbSx0byxBeCk7XG4gICAgICAgIGIoeSxmcm9tLHRvLEF5KTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIGIoeCxmcm9tLHRvLEF4KTtcbiAgICBpZih5KSBiKHksZnJvbSx0byxudW1lcmljLnJlcChudW1lcmljLmRpbShBeCksMCkpO1xufVxubnVtZXJpYy5ULnJlcCA9IGZ1bmN0aW9uIHJlcChzLHYpIHtcbiAgICB2YXIgVCA9IG51bWVyaWMuVDtcbiAgICBpZighKHYgaW5zdGFuY2VvZiBUKSkgdiA9IG5ldyBUKHYpO1xuICAgIHZhciB4ID0gdi54LCB5ID0gdi55LCByID0gbnVtZXJpYy5yZXA7XG4gICAgaWYoeSkgcmV0dXJuIG5ldyBUKHIocyx4KSxyKHMseSkpO1xuICAgIHJldHVybiBuZXcgVChyKHMseCkpO1xufVxubnVtZXJpYy5ULmRpYWcgPSBmdW5jdGlvbiBkaWFnKGQpIHtcbiAgICBpZighKGQgaW5zdGFuY2VvZiBudW1lcmljLlQpKSBkID0gbmV3IG51bWVyaWMuVChkKTtcbiAgICB2YXIgeCA9IGQueCwgeSA9IGQueSwgZGlhZyA9IG51bWVyaWMuZGlhZztcbiAgICBpZih5KSByZXR1cm4gbmV3IG51bWVyaWMuVChkaWFnKHgpLGRpYWcoeSkpO1xuICAgIHJldHVybiBuZXcgbnVtZXJpYy5UKGRpYWcoeCkpO1xufVxubnVtZXJpYy5ULmVpZyA9IGZ1bmN0aW9uIGVpZygpIHtcbiAgICBpZih0aGlzLnkpIHsgdGhyb3cgbmV3IEVycm9yKCdlaWc6IG5vdCBpbXBsZW1lbnRlZCBmb3IgY29tcGxleCBtYXRyaWNlcy4nKTsgfVxuICAgIHJldHVybiBudW1lcmljLmVpZyh0aGlzLngpO1xufVxubnVtZXJpYy5ULmlkZW50aXR5ID0gZnVuY3Rpb24gaWRlbnRpdHkobikgeyByZXR1cm4gbmV3IG51bWVyaWMuVChudW1lcmljLmlkZW50aXR5KG4pKTsgfVxubnVtZXJpYy5ULnByb3RvdHlwZS5nZXREaWFnID0gZnVuY3Rpb24gZ2V0RGlhZygpIHtcbiAgICB2YXIgbiA9IG51bWVyaWM7XG4gICAgdmFyIHggPSB0aGlzLngsIHkgPSB0aGlzLnk7XG4gICAgaWYoeSkgeyByZXR1cm4gbmV3IG4uVChuLmdldERpYWcoeCksbi5nZXREaWFnKHkpKTsgfVxuICAgIHJldHVybiBuZXcgbi5UKG4uZ2V0RGlhZyh4KSk7XG59XG5cbi8vIDQuIEVpZ2VudmFsdWVzIG9mIHJlYWwgbWF0cmljZXNcblxubnVtZXJpYy5ob3VzZSA9IGZ1bmN0aW9uIGhvdXNlKHgpIHtcbiAgICB2YXIgdiA9IG51bWVyaWMuY2xvbmUoeCk7XG4gICAgdmFyIHMgPSB4WzBdID49IDAgPyAxIDogLTE7XG4gICAgdmFyIGFscGhhID0gcypudW1lcmljLm5vcm0yKHgpO1xuICAgIHZbMF0gKz0gYWxwaGE7XG4gICAgdmFyIGZvbyA9IG51bWVyaWMubm9ybTIodik7XG4gICAgaWYoZm9vID09PSAwKSB7IC8qIHRoaXMgc2hvdWxkIG5vdCBoYXBwZW4gKi8gdGhyb3cgbmV3IEVycm9yKCdlaWc6IGludGVybmFsIGVycm9yJyk7IH1cbiAgICByZXR1cm4gbnVtZXJpYy5kaXYodixmb28pO1xufVxuXG5udW1lcmljLnRvVXBwZXJIZXNzZW5iZXJnID0gZnVuY3Rpb24gdG9VcHBlckhlc3NlbmJlcmcobWUpIHtcbiAgICB2YXIgcyA9IG51bWVyaWMuZGltKG1lKTtcbiAgICBpZihzLmxlbmd0aCAhPT0gMiB8fCBzWzBdICE9PSBzWzFdKSB7IHRocm93IG5ldyBFcnJvcignbnVtZXJpYzogdG9VcHBlckhlc3NlbmJlcmcoKSBvbmx5IHdvcmtzIG9uIHNxdWFyZSBtYXRyaWNlcycpOyB9XG4gICAgdmFyIG0gPSBzWzBdLCBpLGosayx4LHYsQSA9IG51bWVyaWMuY2xvbmUobWUpLEIsQyxBaSxDaSxRID0gbnVtZXJpYy5pZGVudGl0eShtKSxRaTtcbiAgICBmb3Ioaj0wO2o8bS0yO2orKykge1xuICAgICAgICB4ID0gQXJyYXkobS1qLTEpO1xuICAgICAgICBmb3IoaT1qKzE7aTxtO2krKykgeyB4W2ktai0xXSA9IEFbaV1bal07IH1cbiAgICAgICAgaWYobnVtZXJpYy5ub3JtMih4KT4wKSB7XG4gICAgICAgICAgICB2ID0gbnVtZXJpYy5ob3VzZSh4KTtcbiAgICAgICAgICAgIEIgPSBudW1lcmljLmdldEJsb2NrKEEsW2orMSxqXSxbbS0xLG0tMV0pO1xuICAgICAgICAgICAgQyA9IG51bWVyaWMudGVuc29yKHYsbnVtZXJpYy5kb3QodixCKSk7XG4gICAgICAgICAgICBmb3IoaT1qKzE7aTxtO2krKykgeyBBaSA9IEFbaV07IENpID0gQ1tpLWotMV07IGZvcihrPWo7azxtO2srKykgQWlba10gLT0gMipDaVtrLWpdOyB9XG4gICAgICAgICAgICBCID0gbnVtZXJpYy5nZXRCbG9jayhBLFswLGorMV0sW20tMSxtLTFdKTtcbiAgICAgICAgICAgIEMgPSBudW1lcmljLnRlbnNvcihudW1lcmljLmRvdChCLHYpLHYpO1xuICAgICAgICAgICAgZm9yKGk9MDtpPG07aSsrKSB7IEFpID0gQVtpXTsgQ2kgPSBDW2ldOyBmb3Ioaz1qKzE7azxtO2srKykgQWlba10gLT0gMipDaVtrLWotMV07IH1cbiAgICAgICAgICAgIEIgPSBBcnJheShtLWotMSk7XG4gICAgICAgICAgICBmb3IoaT1qKzE7aTxtO2krKykgQltpLWotMV0gPSBRW2ldO1xuICAgICAgICAgICAgQyA9IG51bWVyaWMudGVuc29yKHYsbnVtZXJpYy5kb3QodixCKSk7XG4gICAgICAgICAgICBmb3IoaT1qKzE7aTxtO2krKykgeyBRaSA9IFFbaV07IENpID0gQ1tpLWotMV07IGZvcihrPTA7azxtO2srKykgUWlba10gLT0gMipDaVtrXTsgfVxuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB7SDpBLCBROlF9O1xufVxuXG5udW1lcmljLmVwc2lsb24gPSAyLjIyMDQ0NjA0OTI1MDMxM2UtMTY7XG5cbm51bWVyaWMuUVJGcmFuY2lzID0gZnVuY3Rpb24oSCxtYXhpdGVyKSB7XG4gICAgaWYodHlwZW9mIG1heGl0ZXIgPT09IFwidW5kZWZpbmVkXCIpIHsgbWF4aXRlciA9IDEwMDAwOyB9XG4gICAgSCA9IG51bWVyaWMuY2xvbmUoSCk7XG4gICAgdmFyIEgwID0gbnVtZXJpYy5jbG9uZShIKTtcbiAgICB2YXIgcyA9IG51bWVyaWMuZGltKEgpLG09c1swXSx4LHYsYSxiLGMsZCxkZXQsdHIsIEhsb2MsIFEgPSBudW1lcmljLmlkZW50aXR5KG0pLCBRaSwgSGksIEIsIEMsIENpLGksaixrLGl0ZXI7XG4gICAgaWYobTwzKSB7IHJldHVybiB7UTpRLCBCOlsgWzAsbS0xXSBdfTsgfVxuICAgIHZhciBlcHNpbG9uID0gbnVtZXJpYy5lcHNpbG9uO1xuICAgIGZvcihpdGVyPTA7aXRlcjxtYXhpdGVyO2l0ZXIrKykge1xuICAgICAgICBmb3Ioaj0wO2o8bS0xO2orKykge1xuICAgICAgICAgICAgaWYoTWF0aC5hYnMoSFtqKzFdW2pdKSA8IGVwc2lsb24qKE1hdGguYWJzKEhbal1bal0pK01hdGguYWJzKEhbaisxXVtqKzFdKSkpIHtcbiAgICAgICAgICAgICAgICB2YXIgUUgxID0gbnVtZXJpYy5RUkZyYW5jaXMobnVtZXJpYy5nZXRCbG9jayhILFswLDBdLFtqLGpdKSxtYXhpdGVyKTtcbiAgICAgICAgICAgICAgICB2YXIgUUgyID0gbnVtZXJpYy5RUkZyYW5jaXMobnVtZXJpYy5nZXRCbG9jayhILFtqKzEsaisxXSxbbS0xLG0tMV0pLG1heGl0ZXIpO1xuICAgICAgICAgICAgICAgIEIgPSBBcnJheShqKzEpO1xuICAgICAgICAgICAgICAgIGZvcihpPTA7aTw9ajtpKyspIHsgQltpXSA9IFFbaV07IH1cbiAgICAgICAgICAgICAgICBDID0gbnVtZXJpYy5kb3QoUUgxLlEsQik7XG4gICAgICAgICAgICAgICAgZm9yKGk9MDtpPD1qO2krKykgeyBRW2ldID0gQ1tpXTsgfVxuICAgICAgICAgICAgICAgIEIgPSBBcnJheShtLWotMSk7XG4gICAgICAgICAgICAgICAgZm9yKGk9aisxO2k8bTtpKyspIHsgQltpLWotMV0gPSBRW2ldOyB9XG4gICAgICAgICAgICAgICAgQyA9IG51bWVyaWMuZG90KFFIMi5RLEIpO1xuICAgICAgICAgICAgICAgIGZvcihpPWorMTtpPG07aSsrKSB7IFFbaV0gPSBDW2ktai0xXTsgfVxuICAgICAgICAgICAgICAgIHJldHVybiB7UTpRLEI6UUgxLkIuY29uY2F0KG51bWVyaWMuYWRkKFFIMi5CLGorMSkpfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBhID0gSFttLTJdW20tMl07IGIgPSBIW20tMl1bbS0xXTtcbiAgICAgICAgYyA9IEhbbS0xXVttLTJdOyBkID0gSFttLTFdW20tMV07XG4gICAgICAgIHRyID0gYStkO1xuICAgICAgICBkZXQgPSAoYSpkLWIqYyk7XG4gICAgICAgIEhsb2MgPSBudW1lcmljLmdldEJsb2NrKEgsIFswLDBdLCBbMiwyXSk7XG4gICAgICAgIGlmKHRyKnRyPj00KmRldCkge1xuICAgICAgICAgICAgdmFyIHMxLHMyO1xuICAgICAgICAgICAgczEgPSAwLjUqKHRyK01hdGguc3FydCh0cip0ci00KmRldCkpO1xuICAgICAgICAgICAgczIgPSAwLjUqKHRyLU1hdGguc3FydCh0cip0ci00KmRldCkpO1xuICAgICAgICAgICAgSGxvYyA9IG51bWVyaWMuYWRkKG51bWVyaWMuc3ViKG51bWVyaWMuZG90KEhsb2MsSGxvYyksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbnVtZXJpYy5tdWwoSGxvYyxzMStzMikpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG51bWVyaWMuZGlhZyhudW1lcmljLnJlcChbM10sczEqczIpKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBIbG9jID0gbnVtZXJpYy5hZGQobnVtZXJpYy5zdWIobnVtZXJpYy5kb3QoSGxvYyxIbG9jKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBudW1lcmljLm11bChIbG9jLHRyKSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbnVtZXJpYy5kaWFnKG51bWVyaWMucmVwKFszXSxkZXQpKSk7XG4gICAgICAgIH1cbiAgICAgICAgeCA9IFtIbG9jWzBdWzBdLEhsb2NbMV1bMF0sSGxvY1syXVswXV07XG4gICAgICAgIHYgPSBudW1lcmljLmhvdXNlKHgpO1xuICAgICAgICBCID0gW0hbMF0sSFsxXSxIWzJdXTtcbiAgICAgICAgQyA9IG51bWVyaWMudGVuc29yKHYsbnVtZXJpYy5kb3QodixCKSk7XG4gICAgICAgIGZvcihpPTA7aTwzO2krKykgeyBIaSA9IEhbaV07IENpID0gQ1tpXTsgZm9yKGs9MDtrPG07aysrKSBIaVtrXSAtPSAyKkNpW2tdOyB9XG4gICAgICAgIEIgPSBudW1lcmljLmdldEJsb2NrKEgsIFswLDBdLFttLTEsMl0pO1xuICAgICAgICBDID0gbnVtZXJpYy50ZW5zb3IobnVtZXJpYy5kb3QoQix2KSx2KTtcbiAgICAgICAgZm9yKGk9MDtpPG07aSsrKSB7IEhpID0gSFtpXTsgQ2kgPSBDW2ldOyBmb3Ioaz0wO2s8MztrKyspIEhpW2tdIC09IDIqQ2lba107IH1cbiAgICAgICAgQiA9IFtRWzBdLFFbMV0sUVsyXV07XG4gICAgICAgIEMgPSBudW1lcmljLnRlbnNvcih2LG51bWVyaWMuZG90KHYsQikpO1xuICAgICAgICBmb3IoaT0wO2k8MztpKyspIHsgUWkgPSBRW2ldOyBDaSA9IENbaV07IGZvcihrPTA7azxtO2srKykgUWlba10gLT0gMipDaVtrXTsgfVxuICAgICAgICB2YXIgSjtcbiAgICAgICAgZm9yKGo9MDtqPG0tMjtqKyspIHtcbiAgICAgICAgICAgIGZvcihrPWo7azw9aisxO2srKykge1xuICAgICAgICAgICAgICAgIGlmKE1hdGguYWJzKEhbaysxXVtrXSkgPCBlcHNpbG9uKihNYXRoLmFicyhIW2tdW2tdKStNYXRoLmFicyhIW2srMV1baysxXSkpKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBRSDEgPSBudW1lcmljLlFSRnJhbmNpcyhudW1lcmljLmdldEJsb2NrKEgsWzAsMF0sW2ssa10pLG1heGl0ZXIpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgUUgyID0gbnVtZXJpYy5RUkZyYW5jaXMobnVtZXJpYy5nZXRCbG9jayhILFtrKzEsaysxXSxbbS0xLG0tMV0pLG1heGl0ZXIpO1xuICAgICAgICAgICAgICAgICAgICBCID0gQXJyYXkoaysxKTtcbiAgICAgICAgICAgICAgICAgICAgZm9yKGk9MDtpPD1rO2krKykgeyBCW2ldID0gUVtpXTsgfVxuICAgICAgICAgICAgICAgICAgICBDID0gbnVtZXJpYy5kb3QoUUgxLlEsQik7XG4gICAgICAgICAgICAgICAgICAgIGZvcihpPTA7aTw9aztpKyspIHsgUVtpXSA9IENbaV07IH1cbiAgICAgICAgICAgICAgICAgICAgQiA9IEFycmF5KG0tay0xKTtcbiAgICAgICAgICAgICAgICAgICAgZm9yKGk9aysxO2k8bTtpKyspIHsgQltpLWstMV0gPSBRW2ldOyB9XG4gICAgICAgICAgICAgICAgICAgIEMgPSBudW1lcmljLmRvdChRSDIuUSxCKTtcbiAgICAgICAgICAgICAgICAgICAgZm9yKGk9aysxO2k8bTtpKyspIHsgUVtpXSA9IENbaS1rLTFdOyB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB7UTpRLEI6UUgxLkIuY29uY2F0KG51bWVyaWMuYWRkKFFIMi5CLGsrMSkpfTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBKID0gTWF0aC5taW4obS0xLGorMyk7XG4gICAgICAgICAgICB4ID0gQXJyYXkoSi1qKTtcbiAgICAgICAgICAgIGZvcihpPWorMTtpPD1KO2krKykgeyB4W2ktai0xXSA9IEhbaV1bal07IH1cbiAgICAgICAgICAgIHYgPSBudW1lcmljLmhvdXNlKHgpO1xuICAgICAgICAgICAgQiA9IG51bWVyaWMuZ2V0QmxvY2soSCwgW2orMSxqXSxbSixtLTFdKTtcbiAgICAgICAgICAgIEMgPSBudW1lcmljLnRlbnNvcih2LG51bWVyaWMuZG90KHYsQikpO1xuICAgICAgICAgICAgZm9yKGk9aisxO2k8PUo7aSsrKSB7IEhpID0gSFtpXTsgQ2kgPSBDW2ktai0xXTsgZm9yKGs9ajtrPG07aysrKSBIaVtrXSAtPSAyKkNpW2stal07IH1cbiAgICAgICAgICAgIEIgPSBudW1lcmljLmdldEJsb2NrKEgsIFswLGorMV0sW20tMSxKXSk7XG4gICAgICAgICAgICBDID0gbnVtZXJpYy50ZW5zb3IobnVtZXJpYy5kb3QoQix2KSx2KTtcbiAgICAgICAgICAgIGZvcihpPTA7aTxtO2krKykgeyBIaSA9IEhbaV07IENpID0gQ1tpXTsgZm9yKGs9aisxO2s8PUo7aysrKSBIaVtrXSAtPSAyKkNpW2stai0xXTsgfVxuICAgICAgICAgICAgQiA9IEFycmF5KEotaik7XG4gICAgICAgICAgICBmb3IoaT1qKzE7aTw9SjtpKyspIEJbaS1qLTFdID0gUVtpXTtcbiAgICAgICAgICAgIEMgPSBudW1lcmljLnRlbnNvcih2LG51bWVyaWMuZG90KHYsQikpO1xuICAgICAgICAgICAgZm9yKGk9aisxO2k8PUo7aSsrKSB7IFFpID0gUVtpXTsgQ2kgPSBDW2ktai0xXTsgZm9yKGs9MDtrPG07aysrKSBRaVtrXSAtPSAyKkNpW2tdOyB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgdGhyb3cgbmV3IEVycm9yKCdudW1lcmljOiBlaWdlbnZhbHVlIGl0ZXJhdGlvbiBkb2VzIG5vdCBjb252ZXJnZSAtLSBpbmNyZWFzZSBtYXhpdGVyPycpO1xufVxuXG5udW1lcmljLmVpZyA9IGZ1bmN0aW9uIGVpZyhBLG1heGl0ZXIpIHtcbiAgICB2YXIgUUggPSBudW1lcmljLnRvVXBwZXJIZXNzZW5iZXJnKEEpO1xuICAgIHZhciBRQiA9IG51bWVyaWMuUVJGcmFuY2lzKFFILkgsbWF4aXRlcik7XG4gICAgdmFyIFQgPSBudW1lcmljLlQ7XG4gICAgdmFyIG4gPSBBLmxlbmd0aCxpLGssZmxhZyA9IGZhbHNlLEIgPSBRQi5CLEggPSBudW1lcmljLmRvdChRQi5RLG51bWVyaWMuZG90KFFILkgsbnVtZXJpYy50cmFuc3Bvc2UoUUIuUSkpKTtcbiAgICB2YXIgUSA9IG5ldyBUKG51bWVyaWMuZG90KFFCLlEsUUguUSkpLFEwO1xuICAgIHZhciBtID0gQi5sZW5ndGgsajtcbiAgICB2YXIgYSxiLGMsZCxwMSxwMixkaXNjLHgseSxwLHEsbjEsbjI7XG4gICAgdmFyIHNxcnQgPSBNYXRoLnNxcnQ7XG4gICAgZm9yKGs9MDtrPG07aysrKSB7XG4gICAgICAgIGkgPSBCW2tdWzBdO1xuICAgICAgICBpZihpID09PSBCW2tdWzFdKSB7XG4gICAgICAgICAgICAvLyBub3RoaW5nXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBqID0gaSsxO1xuICAgICAgICAgICAgYSA9IEhbaV1baV07XG4gICAgICAgICAgICBiID0gSFtpXVtqXTtcbiAgICAgICAgICAgIGMgPSBIW2pdW2ldO1xuICAgICAgICAgICAgZCA9IEhbal1bal07XG4gICAgICAgICAgICBpZihiID09PSAwICYmIGMgPT09IDApIGNvbnRpbnVlO1xuICAgICAgICAgICAgcDEgPSAtYS1kO1xuICAgICAgICAgICAgcDIgPSBhKmQtYipjO1xuICAgICAgICAgICAgZGlzYyA9IHAxKnAxLTQqcDI7XG4gICAgICAgICAgICBpZihkaXNjPj0wKSB7XG4gICAgICAgICAgICAgICAgaWYocDE8MCkgeCA9IC0wLjUqKHAxLXNxcnQoZGlzYykpO1xuICAgICAgICAgICAgICAgIGVsc2UgICAgIHggPSAtMC41KihwMStzcXJ0KGRpc2MpKTtcbiAgICAgICAgICAgICAgICBuMSA9IChhLXgpKihhLXgpK2IqYjtcbiAgICAgICAgICAgICAgICBuMiA9IGMqYysoZC14KSooZC14KTtcbiAgICAgICAgICAgICAgICBpZihuMT5uMikge1xuICAgICAgICAgICAgICAgICAgICBuMSA9IHNxcnQobjEpO1xuICAgICAgICAgICAgICAgICAgICBwID0gKGEteCkvbjE7XG4gICAgICAgICAgICAgICAgICAgIHEgPSBiL24xO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIG4yID0gc3FydChuMik7XG4gICAgICAgICAgICAgICAgICAgIHAgPSBjL24yO1xuICAgICAgICAgICAgICAgICAgICBxID0gKGQteCkvbjI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIFEwID0gbmV3IFQoW1txLC1wXSxbcCxxXV0pO1xuICAgICAgICAgICAgICAgIFEuc2V0Um93cyhpLGosUTAuZG90KFEuZ2V0Um93cyhpLGopKSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHggPSAtMC41KnAxO1xuICAgICAgICAgICAgICAgIHkgPSAwLjUqc3FydCgtZGlzYyk7XG4gICAgICAgICAgICAgICAgbjEgPSAoYS14KSooYS14KStiKmI7XG4gICAgICAgICAgICAgICAgbjIgPSBjKmMrKGQteCkqKGQteCk7XG4gICAgICAgICAgICAgICAgaWYobjE+bjIpIHtcbiAgICAgICAgICAgICAgICAgICAgbjEgPSBzcXJ0KG4xK3kqeSk7XG4gICAgICAgICAgICAgICAgICAgIHAgPSAoYS14KS9uMTtcbiAgICAgICAgICAgICAgICAgICAgcSA9IGIvbjE7XG4gICAgICAgICAgICAgICAgICAgIHggPSAwO1xuICAgICAgICAgICAgICAgICAgICB5IC89IG4xO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIG4yID0gc3FydChuMit5KnkpO1xuICAgICAgICAgICAgICAgICAgICBwID0gYy9uMjtcbiAgICAgICAgICAgICAgICAgICAgcSA9IChkLXgpL24yO1xuICAgICAgICAgICAgICAgICAgICB4ID0geS9uMjtcbiAgICAgICAgICAgICAgICAgICAgeSA9IDA7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIFEwID0gbmV3IFQoW1txLC1wXSxbcCxxXV0sW1t4LHldLFt5LC14XV0pO1xuICAgICAgICAgICAgICAgIFEuc2V0Um93cyhpLGosUTAuZG90KFEuZ2V0Um93cyhpLGopKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgdmFyIFIgPSBRLmRvdChBKS5kb3QoUS50cmFuc2p1Z2F0ZSgpKSwgbiA9IEEubGVuZ3RoLCBFID0gbnVtZXJpYy5ULmlkZW50aXR5KG4pO1xuICAgIGZvcihqPTA7ajxuO2orKykge1xuICAgICAgICBpZihqPjApIHtcbiAgICAgICAgICAgIGZvcihrPWotMTtrPj0wO2stLSkge1xuICAgICAgICAgICAgICAgIHZhciBSayA9IFIuZ2V0KFtrLGtdKSwgUmogPSBSLmdldChbaixqXSk7XG4gICAgICAgICAgICAgICAgaWYobnVtZXJpYy5uZXEoUmsueCxSai54KSB8fCBudW1lcmljLm5lcShSay55LFJqLnkpKSB7XG4gICAgICAgICAgICAgICAgICAgIHggPSBSLmdldFJvdyhrKS5nZXRCbG9jayhba10sW2otMV0pO1xuICAgICAgICAgICAgICAgICAgICB5ID0gRS5nZXRSb3coaikuZ2V0QmxvY2soW2tdLFtqLTFdKTtcbiAgICAgICAgICAgICAgICAgICAgRS5zZXQoW2osa10sKFIuZ2V0KFtrLGpdKS5uZWcoKS5zdWIoeC5kb3QoeSkpKS5kaXYoUmsuc3ViKFJqKSkpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIEUuc2V0Um93KGosRS5nZXRSb3coaykpO1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgZm9yKGo9MDtqPG47aisrKSB7XG4gICAgICAgIHggPSBFLmdldFJvdyhqKTtcbiAgICAgICAgRS5zZXRSb3coaix4LmRpdih4Lm5vcm0yKCkpKTtcbiAgICB9XG4gICAgRSA9IEUudHJhbnNwb3NlKCk7XG4gICAgRSA9IFEudHJhbnNqdWdhdGUoKS5kb3QoRSk7XG4gICAgcmV0dXJuIHsgbGFtYmRhOlIuZ2V0RGlhZygpLCBFOkUgfTtcbn07XG5cbi8vIDUuIENvbXByZXNzZWQgQ29sdW1uIFN0b3JhZ2UgbWF0cmljZXNcbm51bWVyaWMuY2NzU3BhcnNlID0gZnVuY3Rpb24gY2NzU3BhcnNlKEEpIHtcbiAgICB2YXIgbSA9IEEubGVuZ3RoLG4sZm9vLCBpLGosIGNvdW50cyA9IFtdO1xuICAgIGZvcihpPW0tMTtpIT09LTE7LS1pKSB7XG4gICAgICAgIGZvbyA9IEFbaV07XG4gICAgICAgIGZvcihqIGluIGZvbykge1xuICAgICAgICAgICAgaiA9IHBhcnNlSW50KGopO1xuICAgICAgICAgICAgd2hpbGUoaj49Y291bnRzLmxlbmd0aCkgY291bnRzW2NvdW50cy5sZW5ndGhdID0gMDtcbiAgICAgICAgICAgIGlmKGZvb1tqXSE9PTApIGNvdW50c1tqXSsrO1xuICAgICAgICB9XG4gICAgfVxuICAgIHZhciBuID0gY291bnRzLmxlbmd0aDtcbiAgICB2YXIgQWkgPSBBcnJheShuKzEpO1xuICAgIEFpWzBdID0gMDtcbiAgICBmb3IoaT0wO2k8bjsrK2kpIEFpW2krMV0gPSBBaVtpXSArIGNvdW50c1tpXTtcbiAgICB2YXIgQWogPSBBcnJheShBaVtuXSksIEF2ID0gQXJyYXkoQWlbbl0pO1xuICAgIGZvcihpPW0tMTtpIT09LTE7LS1pKSB7XG4gICAgICAgIGZvbyA9IEFbaV07XG4gICAgICAgIGZvcihqIGluIGZvbykge1xuICAgICAgICAgICAgaWYoZm9vW2pdIT09MCkge1xuICAgICAgICAgICAgICAgIGNvdW50c1tqXS0tO1xuICAgICAgICAgICAgICAgIEFqW0FpW2pdK2NvdW50c1tqXV0gPSBpO1xuICAgICAgICAgICAgICAgIEF2W0FpW2pdK2NvdW50c1tqXV0gPSBmb29bal07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIFtBaSxBaixBdl07XG59XG5udW1lcmljLmNjc0Z1bGwgPSBmdW5jdGlvbiBjY3NGdWxsKEEpIHtcbiAgICB2YXIgQWkgPSBBWzBdLCBBaiA9IEFbMV0sIEF2ID0gQVsyXSwgcyA9IG51bWVyaWMuY2NzRGltKEEpLCBtID0gc1swXSwgbiA9IHNbMV0sIGksaixqMCxqMSxrO1xuICAgIHZhciBCID0gbnVtZXJpYy5yZXAoW20sbl0sMCk7XG4gICAgZm9yKGk9MDtpPG47aSsrKSB7XG4gICAgICAgIGowID0gQWlbaV07XG4gICAgICAgIGoxID0gQWlbaSsxXTtcbiAgICAgICAgZm9yKGo9ajA7ajxqMTsrK2opIHsgQltBaltqXV1baV0gPSBBdltqXTsgfVxuICAgIH1cbiAgICByZXR1cm4gQjtcbn1cbm51bWVyaWMuY2NzVFNvbHZlID0gZnVuY3Rpb24gY2NzVFNvbHZlKEEsYix4LGJqLHhqKSB7XG4gICAgdmFyIEFpID0gQVswXSwgQWogPSBBWzFdLCBBdiA9IEFbMl0sbSA9IEFpLmxlbmd0aC0xLCBtYXggPSBNYXRoLm1heCxuPTA7XG4gICAgaWYodHlwZW9mIGJqID09PSBcInVuZGVmaW5lZFwiKSB4ID0gbnVtZXJpYy5yZXAoW21dLDApO1xuICAgIGlmKHR5cGVvZiBiaiA9PT0gXCJ1bmRlZmluZWRcIikgYmogPSBudW1lcmljLmxpbnNwYWNlKDAseC5sZW5ndGgtMSk7XG4gICAgaWYodHlwZW9mIHhqID09PSBcInVuZGVmaW5lZFwiKSB4aiA9IFtdO1xuICAgIGZ1bmN0aW9uIGRmcyhqKSB7XG4gICAgICAgIHZhciBrO1xuICAgICAgICBpZih4W2pdICE9PSAwKSByZXR1cm47XG4gICAgICAgIHhbal0gPSAxO1xuICAgICAgICBmb3Ioaz1BaVtqXTtrPEFpW2orMV07KytrKSBkZnMoQWpba10pO1xuICAgICAgICB4altuXSA9IGo7XG4gICAgICAgICsrbjtcbiAgICB9XG4gICAgdmFyIGksaixqMCxqMSxrLGwsbDAsbDEsYTtcbiAgICBmb3IoaT1iai5sZW5ndGgtMTtpIT09LTE7LS1pKSB7IGRmcyhialtpXSk7IH1cbiAgICB4ai5sZW5ndGggPSBuO1xuICAgIGZvcihpPXhqLmxlbmd0aC0xO2khPT0tMTstLWkpIHsgeFt4altpXV0gPSAwOyB9XG4gICAgZm9yKGk9YmoubGVuZ3RoLTE7aSE9PS0xOy0taSkgeyBqID0gYmpbaV07IHhbal0gPSBiW2pdOyB9XG4gICAgZm9yKGk9eGoubGVuZ3RoLTE7aSE9PS0xOy0taSkge1xuICAgICAgICBqID0geGpbaV07XG4gICAgICAgIGowID0gQWlbal07XG4gICAgICAgIGoxID0gbWF4KEFpW2orMV0sajApO1xuICAgICAgICBmb3Ioaz1qMDtrIT09ajE7KytrKSB7IGlmKEFqW2tdID09PSBqKSB7IHhbal0gLz0gQXZba107IGJyZWFrOyB9IH1cbiAgICAgICAgYSA9IHhbal07XG4gICAgICAgIGZvcihrPWowO2shPT1qMTsrK2spIHtcbiAgICAgICAgICAgIGwgPSBBaltrXTtcbiAgICAgICAgICAgIGlmKGwgIT09IGopIHhbbF0gLT0gYSpBdltrXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4geDtcbn1cbm51bWVyaWMuY2NzREZTID0gZnVuY3Rpb24gY2NzREZTKG4pIHtcbiAgICB0aGlzLmsgPSBBcnJheShuKTtcbiAgICB0aGlzLmsxID0gQXJyYXkobik7XG4gICAgdGhpcy5qID0gQXJyYXkobik7XG59XG5udW1lcmljLmNjc0RGUy5wcm90b3R5cGUuZGZzID0gZnVuY3Rpb24gZGZzKEosQWksQWoseCx4aixQaW52KSB7XG4gICAgdmFyIG0gPSAwLGZvbyxuPXhqLmxlbmd0aDtcbiAgICB2YXIgayA9IHRoaXMuaywgazEgPSB0aGlzLmsxLCBqID0gdGhpcy5qLGttLGsxMTtcbiAgICBpZih4W0pdIT09MCkgcmV0dXJuO1xuICAgIHhbSl0gPSAxO1xuICAgIGpbMF0gPSBKO1xuICAgIGtbMF0gPSBrbSA9IEFpW0pdO1xuICAgIGsxWzBdID0gazExID0gQWlbSisxXTtcbiAgICB3aGlsZSgxKSB7XG4gICAgICAgIGlmKGttID49IGsxMSkge1xuICAgICAgICAgICAgeGpbbl0gPSBqW21dO1xuICAgICAgICAgICAgaWYobT09PTApIHJldHVybjtcbiAgICAgICAgICAgICsrbjtcbiAgICAgICAgICAgIC0tbTtcbiAgICAgICAgICAgIGttID0ga1ttXTtcbiAgICAgICAgICAgIGsxMSA9IGsxW21dO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZm9vID0gUGludltBaltrbV1dO1xuICAgICAgICAgICAgaWYoeFtmb29dID09PSAwKSB7XG4gICAgICAgICAgICAgICAgeFtmb29dID0gMTtcbiAgICAgICAgICAgICAgICBrW21dID0ga207XG4gICAgICAgICAgICAgICAgKyttO1xuICAgICAgICAgICAgICAgIGpbbV0gPSBmb287XG4gICAgICAgICAgICAgICAga20gPSBBaVtmb29dO1xuICAgICAgICAgICAgICAgIGsxW21dID0gazExID0gQWlbZm9vKzFdO1xuICAgICAgICAgICAgfSBlbHNlICsra207XG4gICAgICAgIH1cbiAgICB9XG59XG5udW1lcmljLmNjc0xQU29sdmUgPSBmdW5jdGlvbiBjY3NMUFNvbHZlKEEsQix4LHhqLEksUGludixkZnMpIHtcbiAgICB2YXIgQWkgPSBBWzBdLCBBaiA9IEFbMV0sIEF2ID0gQVsyXSxtID0gQWkubGVuZ3RoLTEsIG49MDtcbiAgICB2YXIgQmkgPSBCWzBdLCBCaiA9IEJbMV0sIEJ2ID0gQlsyXTtcbiAgICBcbiAgICB2YXIgaSxpMCxpMSxqLEosajAsajEsayxsLGwwLGwxLGE7XG4gICAgaTAgPSBCaVtJXTtcbiAgICBpMSA9IEJpW0krMV07XG4gICAgeGoubGVuZ3RoID0gMDtcbiAgICBmb3IoaT1pMDtpPGkxOysraSkgeyBkZnMuZGZzKFBpbnZbQmpbaV1dLEFpLEFqLHgseGosUGludik7IH1cbiAgICBmb3IoaT14ai5sZW5ndGgtMTtpIT09LTE7LS1pKSB7IHhbeGpbaV1dID0gMDsgfVxuICAgIGZvcihpPWkwO2khPT1pMTsrK2kpIHsgaiA9IFBpbnZbQmpbaV1dOyB4W2pdID0gQnZbaV07IH1cbiAgICBmb3IoaT14ai5sZW5ndGgtMTtpIT09LTE7LS1pKSB7XG4gICAgICAgIGogPSB4altpXTtcbiAgICAgICAgajAgPSBBaVtqXTtcbiAgICAgICAgajEgPSBBaVtqKzFdO1xuICAgICAgICBmb3Ioaz1qMDtrPGoxOysraykgeyBpZihQaW52W0FqW2tdXSA9PT0gaikgeyB4W2pdIC89IEF2W2tdOyBicmVhazsgfSB9XG4gICAgICAgIGEgPSB4W2pdO1xuICAgICAgICBmb3Ioaz1qMDtrPGoxOysraykge1xuICAgICAgICAgICAgbCA9IFBpbnZbQWpba11dO1xuICAgICAgICAgICAgaWYobCAhPT0gaikgeFtsXSAtPSBhKkF2W2tdO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB4O1xufVxubnVtZXJpYy5jY3NMVVAxID0gZnVuY3Rpb24gY2NzTFVQMShBLHRocmVzaG9sZCkge1xuICAgIHZhciBtID0gQVswXS5sZW5ndGgtMTtcbiAgICB2YXIgTCA9IFtudW1lcmljLnJlcChbbSsxXSwwKSxbXSxbXV0sIFUgPSBbbnVtZXJpYy5yZXAoW20rMV0sIDApLFtdLFtdXTtcbiAgICB2YXIgTGkgPSBMWzBdLCBMaiA9IExbMV0sIEx2ID0gTFsyXSwgVWkgPSBVWzBdLCBVaiA9IFVbMV0sIFV2ID0gVVsyXTtcbiAgICB2YXIgeCA9IG51bWVyaWMucmVwKFttXSwwKSwgeGogPSBudW1lcmljLnJlcChbbV0sMCk7XG4gICAgdmFyIGksaixrLGowLGoxLGEsZSxjLGQsSztcbiAgICB2YXIgc29sID0gbnVtZXJpYy5jY3NMUFNvbHZlLCBtYXggPSBNYXRoLm1heCwgYWJzID0gTWF0aC5hYnM7XG4gICAgdmFyIFAgPSBudW1lcmljLmxpbnNwYWNlKDAsbS0xKSxQaW52ID0gbnVtZXJpYy5saW5zcGFjZSgwLG0tMSk7XG4gICAgdmFyIGRmcyA9IG5ldyBudW1lcmljLmNjc0RGUyhtKTtcbiAgICBpZih0eXBlb2YgdGhyZXNob2xkID09PSBcInVuZGVmaW5lZFwiKSB7IHRocmVzaG9sZCA9IDE7IH1cbiAgICBmb3IoaT0wO2k8bTsrK2kpIHtcbiAgICAgICAgc29sKEwsQSx4LHhqLGksUGludixkZnMpO1xuICAgICAgICBhID0gLTE7XG4gICAgICAgIGUgPSAtMTtcbiAgICAgICAgZm9yKGo9eGoubGVuZ3RoLTE7aiE9PS0xOy0taikge1xuICAgICAgICAgICAgayA9IHhqW2pdO1xuICAgICAgICAgICAgaWYoayA8PSBpKSBjb250aW51ZTtcbiAgICAgICAgICAgIGMgPSBhYnMoeFtrXSk7XG4gICAgICAgICAgICBpZihjID4gYSkgeyBlID0gazsgYSA9IGM7IH1cbiAgICAgICAgfVxuICAgICAgICBpZihhYnMoeFtpXSk8dGhyZXNob2xkKmEpIHtcbiAgICAgICAgICAgIGogPSBQW2ldO1xuICAgICAgICAgICAgYSA9IFBbZV07XG4gICAgICAgICAgICBQW2ldID0gYTsgUGludlthXSA9IGk7XG4gICAgICAgICAgICBQW2VdID0gajsgUGludltqXSA9IGU7XG4gICAgICAgICAgICBhID0geFtpXTsgeFtpXSA9IHhbZV07IHhbZV0gPSBhO1xuICAgICAgICB9XG4gICAgICAgIGEgPSBMaVtpXTtcbiAgICAgICAgZSA9IFVpW2ldO1xuICAgICAgICBkID0geFtpXTtcbiAgICAgICAgTGpbYV0gPSBQW2ldO1xuICAgICAgICBMdlthXSA9IDE7XG4gICAgICAgICsrYTtcbiAgICAgICAgZm9yKGo9eGoubGVuZ3RoLTE7aiE9PS0xOy0taikge1xuICAgICAgICAgICAgayA9IHhqW2pdO1xuICAgICAgICAgICAgYyA9IHhba107XG4gICAgICAgICAgICB4altqXSA9IDA7XG4gICAgICAgICAgICB4W2tdID0gMDtcbiAgICAgICAgICAgIGlmKGs8PWkpIHsgVWpbZV0gPSBrOyBVdltlXSA9IGM7ICAgKytlOyB9XG4gICAgICAgICAgICBlbHNlICAgICB7IExqW2FdID0gUFtrXTsgTHZbYV0gPSBjL2Q7ICsrYTsgfVxuICAgICAgICB9XG4gICAgICAgIExpW2krMV0gPSBhO1xuICAgICAgICBVaVtpKzFdID0gZTtcbiAgICB9XG4gICAgZm9yKGo9TGoubGVuZ3RoLTE7aiE9PS0xOy0taikgeyBMaltqXSA9IFBpbnZbTGpbal1dOyB9XG4gICAgcmV0dXJuIHtMOkwsIFU6VSwgUDpQLCBQaW52OlBpbnZ9O1xufVxubnVtZXJpYy5jY3NERlMwID0gZnVuY3Rpb24gY2NzREZTMChuKSB7XG4gICAgdGhpcy5rID0gQXJyYXkobik7XG4gICAgdGhpcy5rMSA9IEFycmF5KG4pO1xuICAgIHRoaXMuaiA9IEFycmF5KG4pO1xufVxubnVtZXJpYy5jY3NERlMwLnByb3RvdHlwZS5kZnMgPSBmdW5jdGlvbiBkZnMoSixBaSxBaix4LHhqLFBpbnYsUCkge1xuICAgIHZhciBtID0gMCxmb28sbj14ai5sZW5ndGg7XG4gICAgdmFyIGsgPSB0aGlzLmssIGsxID0gdGhpcy5rMSwgaiA9IHRoaXMuaixrbSxrMTE7XG4gICAgaWYoeFtKXSE9PTApIHJldHVybjtcbiAgICB4W0pdID0gMTtcbiAgICBqWzBdID0gSjtcbiAgICBrWzBdID0ga20gPSBBaVtQaW52W0pdXTtcbiAgICBrMVswXSA9IGsxMSA9IEFpW1BpbnZbSl0rMV07XG4gICAgd2hpbGUoMSkge1xuICAgICAgICBpZihpc05hTihrbSkpIHRocm93IG5ldyBFcnJvcihcIk93IVwiKTtcbiAgICAgICAgaWYoa20gPj0gazExKSB7XG4gICAgICAgICAgICB4altuXSA9IFBpbnZbalttXV07XG4gICAgICAgICAgICBpZihtPT09MCkgcmV0dXJuO1xuICAgICAgICAgICAgKytuO1xuICAgICAgICAgICAgLS1tO1xuICAgICAgICAgICAga20gPSBrW21dO1xuICAgICAgICAgICAgazExID0gazFbbV07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBmb28gPSBBaltrbV07XG4gICAgICAgICAgICBpZih4W2Zvb10gPT09IDApIHtcbiAgICAgICAgICAgICAgICB4W2Zvb10gPSAxO1xuICAgICAgICAgICAgICAgIGtbbV0gPSBrbTtcbiAgICAgICAgICAgICAgICArK207XG4gICAgICAgICAgICAgICAgalttXSA9IGZvbztcbiAgICAgICAgICAgICAgICBmb28gPSBQaW52W2Zvb107XG4gICAgICAgICAgICAgICAga20gPSBBaVtmb29dO1xuICAgICAgICAgICAgICAgIGsxW21dID0gazExID0gQWlbZm9vKzFdO1xuICAgICAgICAgICAgfSBlbHNlICsra207XG4gICAgICAgIH1cbiAgICB9XG59XG5udW1lcmljLmNjc0xQU29sdmUwID0gZnVuY3Rpb24gY2NzTFBTb2x2ZTAoQSxCLHkseGosSSxQaW52LFAsZGZzKSB7XG4gICAgdmFyIEFpID0gQVswXSwgQWogPSBBWzFdLCBBdiA9IEFbMl0sbSA9IEFpLmxlbmd0aC0xLCBuPTA7XG4gICAgdmFyIEJpID0gQlswXSwgQmogPSBCWzFdLCBCdiA9IEJbMl07XG4gICAgXG4gICAgdmFyIGksaTAsaTEsaixKLGowLGoxLGssbCxsMCxsMSxhO1xuICAgIGkwID0gQmlbSV07XG4gICAgaTEgPSBCaVtJKzFdO1xuICAgIHhqLmxlbmd0aCA9IDA7XG4gICAgZm9yKGk9aTA7aTxpMTsrK2kpIHsgZGZzLmRmcyhCaltpXSxBaSxBaix5LHhqLFBpbnYsUCk7IH1cbiAgICBmb3IoaT14ai5sZW5ndGgtMTtpIT09LTE7LS1pKSB7IGogPSB4altpXTsgeVtQW2pdXSA9IDA7IH1cbiAgICBmb3IoaT1pMDtpIT09aTE7KytpKSB7IGogPSBCaltpXTsgeVtqXSA9IEJ2W2ldOyB9XG4gICAgZm9yKGk9eGoubGVuZ3RoLTE7aSE9PS0xOy0taSkge1xuICAgICAgICBqID0geGpbaV07XG4gICAgICAgIGwgPSBQW2pdO1xuICAgICAgICBqMCA9IEFpW2pdO1xuICAgICAgICBqMSA9IEFpW2orMV07XG4gICAgICAgIGZvcihrPWowO2s8ajE7KytrKSB7IGlmKEFqW2tdID09PSBsKSB7IHlbbF0gLz0gQXZba107IGJyZWFrOyB9IH1cbiAgICAgICAgYSA9IHlbbF07XG4gICAgICAgIGZvcihrPWowO2s8ajE7KytrKSB5W0FqW2tdXSAtPSBhKkF2W2tdO1xuICAgICAgICB5W2xdID0gYTtcbiAgICB9XG59XG5udW1lcmljLmNjc0xVUDAgPSBmdW5jdGlvbiBjY3NMVVAwKEEsdGhyZXNob2xkKSB7XG4gICAgdmFyIG0gPSBBWzBdLmxlbmd0aC0xO1xuICAgIHZhciBMID0gW251bWVyaWMucmVwKFttKzFdLDApLFtdLFtdXSwgVSA9IFtudW1lcmljLnJlcChbbSsxXSwgMCksW10sW11dO1xuICAgIHZhciBMaSA9IExbMF0sIExqID0gTFsxXSwgTHYgPSBMWzJdLCBVaSA9IFVbMF0sIFVqID0gVVsxXSwgVXYgPSBVWzJdO1xuICAgIHZhciB5ID0gbnVtZXJpYy5yZXAoW21dLDApLCB4aiA9IG51bWVyaWMucmVwKFttXSwwKTtcbiAgICB2YXIgaSxqLGssajAsajEsYSxlLGMsZCxLO1xuICAgIHZhciBzb2wgPSBudW1lcmljLmNjc0xQU29sdmUwLCBtYXggPSBNYXRoLm1heCwgYWJzID0gTWF0aC5hYnM7XG4gICAgdmFyIFAgPSBudW1lcmljLmxpbnNwYWNlKDAsbS0xKSxQaW52ID0gbnVtZXJpYy5saW5zcGFjZSgwLG0tMSk7XG4gICAgdmFyIGRmcyA9IG5ldyBudW1lcmljLmNjc0RGUzAobSk7XG4gICAgaWYodHlwZW9mIHRocmVzaG9sZCA9PT0gXCJ1bmRlZmluZWRcIikgeyB0aHJlc2hvbGQgPSAxOyB9XG4gICAgZm9yKGk9MDtpPG07KytpKSB7XG4gICAgICAgIHNvbChMLEEseSx4aixpLFBpbnYsUCxkZnMpO1xuICAgICAgICBhID0gLTE7XG4gICAgICAgIGUgPSAtMTtcbiAgICAgICAgZm9yKGo9eGoubGVuZ3RoLTE7aiE9PS0xOy0taikge1xuICAgICAgICAgICAgayA9IHhqW2pdO1xuICAgICAgICAgICAgaWYoayA8PSBpKSBjb250aW51ZTtcbiAgICAgICAgICAgIGMgPSBhYnMoeVtQW2tdXSk7XG4gICAgICAgICAgICBpZihjID4gYSkgeyBlID0gazsgYSA9IGM7IH1cbiAgICAgICAgfVxuICAgICAgICBpZihhYnMoeVtQW2ldXSk8dGhyZXNob2xkKmEpIHtcbiAgICAgICAgICAgIGogPSBQW2ldO1xuICAgICAgICAgICAgYSA9IFBbZV07XG4gICAgICAgICAgICBQW2ldID0gYTsgUGludlthXSA9IGk7XG4gICAgICAgICAgICBQW2VdID0gajsgUGludltqXSA9IGU7XG4gICAgICAgIH1cbiAgICAgICAgYSA9IExpW2ldO1xuICAgICAgICBlID0gVWlbaV07XG4gICAgICAgIGQgPSB5W1BbaV1dO1xuICAgICAgICBMalthXSA9IFBbaV07XG4gICAgICAgIEx2W2FdID0gMTtcbiAgICAgICAgKythO1xuICAgICAgICBmb3Ioaj14ai5sZW5ndGgtMTtqIT09LTE7LS1qKSB7XG4gICAgICAgICAgICBrID0geGpbal07XG4gICAgICAgICAgICBjID0geVtQW2tdXTtcbiAgICAgICAgICAgIHhqW2pdID0gMDtcbiAgICAgICAgICAgIHlbUFtrXV0gPSAwO1xuICAgICAgICAgICAgaWYoazw9aSkgeyBValtlXSA9IGs7IFV2W2VdID0gYzsgICArK2U7IH1cbiAgICAgICAgICAgIGVsc2UgICAgIHsgTGpbYV0gPSBQW2tdOyBMdlthXSA9IGMvZDsgKythOyB9XG4gICAgICAgIH1cbiAgICAgICAgTGlbaSsxXSA9IGE7XG4gICAgICAgIFVpW2krMV0gPSBlO1xuICAgIH1cbiAgICBmb3Ioaj1Mai5sZW5ndGgtMTtqIT09LTE7LS1qKSB7IExqW2pdID0gUGludltMaltqXV07IH1cbiAgICByZXR1cm4ge0w6TCwgVTpVLCBQOlAsIFBpbnY6UGludn07XG59XG5udW1lcmljLmNjc0xVUCA9IG51bWVyaWMuY2NzTFVQMDtcblxubnVtZXJpYy5jY3NEaW0gPSBmdW5jdGlvbiBjY3NEaW0oQSkgeyByZXR1cm4gW251bWVyaWMuc3VwKEFbMV0pKzEsQVswXS5sZW5ndGgtMV07IH1cbm51bWVyaWMuY2NzR2V0QmxvY2sgPSBmdW5jdGlvbiBjY3NHZXRCbG9jayhBLGksaikge1xuICAgIHZhciBzID0gbnVtZXJpYy5jY3NEaW0oQSksbT1zWzBdLG49c1sxXTtcbiAgICBpZih0eXBlb2YgaSA9PT0gXCJ1bmRlZmluZWRcIikgeyBpID0gbnVtZXJpYy5saW5zcGFjZSgwLG0tMSk7IH1cbiAgICBlbHNlIGlmKHR5cGVvZiBpID09PSBcIm51bWJlclwiKSB7IGkgPSBbaV07IH1cbiAgICBpZih0eXBlb2YgaiA9PT0gXCJ1bmRlZmluZWRcIikgeyBqID0gbnVtZXJpYy5saW5zcGFjZSgwLG4tMSk7IH1cbiAgICBlbHNlIGlmKHR5cGVvZiBqID09PSBcIm51bWJlclwiKSB7IGogPSBbal07IH1cbiAgICB2YXIgcCxwMCxwMSxQID0gaS5sZW5ndGgscSxRID0gai5sZW5ndGgscixqcSxpcDtcbiAgICB2YXIgQmkgPSBudW1lcmljLnJlcChbbl0sMCksIEJqPVtdLCBCdj1bXSwgQiA9IFtCaSxCaixCdl07XG4gICAgdmFyIEFpID0gQVswXSwgQWogPSBBWzFdLCBBdiA9IEFbMl07XG4gICAgdmFyIHggPSBudW1lcmljLnJlcChbbV0sMCksY291bnQ9MCxmbGFncyA9IG51bWVyaWMucmVwKFttXSwwKTtcbiAgICBmb3IocT0wO3E8UTsrK3EpIHtcbiAgICAgICAganEgPSBqW3FdO1xuICAgICAgICB2YXIgcTAgPSBBaVtqcV07XG4gICAgICAgIHZhciBxMSA9IEFpW2pxKzFdO1xuICAgICAgICBmb3IocD1xMDtwPHExOysrcCkge1xuICAgICAgICAgICAgciA9IEFqW3BdO1xuICAgICAgICAgICAgZmxhZ3Nbcl0gPSAxO1xuICAgICAgICAgICAgeFtyXSA9IEF2W3BdO1xuICAgICAgICB9XG4gICAgICAgIGZvcihwPTA7cDxQOysrcCkge1xuICAgICAgICAgICAgaXAgPSBpW3BdO1xuICAgICAgICAgICAgaWYoZmxhZ3NbaXBdKSB7XG4gICAgICAgICAgICAgICAgQmpbY291bnRdID0gcDtcbiAgICAgICAgICAgICAgICBCdltjb3VudF0gPSB4W2lbcF1dO1xuICAgICAgICAgICAgICAgICsrY291bnQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZm9yKHA9cTA7cDxxMTsrK3ApIHtcbiAgICAgICAgICAgIHIgPSBBaltwXTtcbiAgICAgICAgICAgIGZsYWdzW3JdID0gMDtcbiAgICAgICAgfVxuICAgICAgICBCaVtxKzFdID0gY291bnQ7XG4gICAgfVxuICAgIHJldHVybiBCO1xufVxuXG5udW1lcmljLmNjc0RvdCA9IGZ1bmN0aW9uIGNjc0RvdChBLEIpIHtcbiAgICB2YXIgQWkgPSBBWzBdLCBBaiA9IEFbMV0sIEF2ID0gQVsyXTtcbiAgICB2YXIgQmkgPSBCWzBdLCBCaiA9IEJbMV0sIEJ2ID0gQlsyXTtcbiAgICB2YXIgc0EgPSBudW1lcmljLmNjc0RpbShBKSwgc0IgPSBudW1lcmljLmNjc0RpbShCKTtcbiAgICB2YXIgbSA9IHNBWzBdLCBuID0gc0FbMV0sIG8gPSBzQlsxXTtcbiAgICB2YXIgeCA9IG51bWVyaWMucmVwKFttXSwwKSwgZmxhZ3MgPSBudW1lcmljLnJlcChbbV0sMCksIHhqID0gQXJyYXkobSk7XG4gICAgdmFyIENpID0gbnVtZXJpYy5yZXAoW29dLDApLCBDaiA9IFtdLCBDdiA9IFtdLCBDID0gW0NpLENqLEN2XTtcbiAgICB2YXIgaSxqLGssajAsajEsaTAsaTEsbCxwLGEsYjtcbiAgICBmb3Ioaz0wO2shPT1vOysraykge1xuICAgICAgICBqMCA9IEJpW2tdO1xuICAgICAgICBqMSA9IEJpW2srMV07XG4gICAgICAgIHAgPSAwO1xuICAgICAgICBmb3Ioaj1qMDtqPGoxOysraikge1xuICAgICAgICAgICAgYSA9IEJqW2pdO1xuICAgICAgICAgICAgYiA9IEJ2W2pdO1xuICAgICAgICAgICAgaTAgPSBBaVthXTtcbiAgICAgICAgICAgIGkxID0gQWlbYSsxXTtcbiAgICAgICAgICAgIGZvcihpPWkwO2k8aTE7KytpKSB7XG4gICAgICAgICAgICAgICAgbCA9IEFqW2ldO1xuICAgICAgICAgICAgICAgIGlmKGZsYWdzW2xdPT09MCkge1xuICAgICAgICAgICAgICAgICAgICB4altwXSA9IGw7XG4gICAgICAgICAgICAgICAgICAgIGZsYWdzW2xdID0gMTtcbiAgICAgICAgICAgICAgICAgICAgcCA9IHArMTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgeFtsXSA9IHhbbF0gKyBBdltpXSpiO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGowID0gQ2lba107XG4gICAgICAgIGoxID0gajArcDtcbiAgICAgICAgQ2lbaysxXSA9IGoxO1xuICAgICAgICBmb3Ioaj1wLTE7aiE9PS0xOy0taikge1xuICAgICAgICAgICAgYiA9IGowK2o7XG4gICAgICAgICAgICBpID0geGpbal07XG4gICAgICAgICAgICBDaltiXSA9IGk7XG4gICAgICAgICAgICBDdltiXSA9IHhbaV07XG4gICAgICAgICAgICBmbGFnc1tpXSA9IDA7XG4gICAgICAgICAgICB4W2ldID0gMDtcbiAgICAgICAgfVxuICAgICAgICBDaVtrKzFdID0gQ2lba10rcDtcbiAgICB9XG4gICAgcmV0dXJuIEM7XG59XG5cbm51bWVyaWMuY2NzTFVQU29sdmUgPSBmdW5jdGlvbiBjY3NMVVBTb2x2ZShMVVAsQikge1xuICAgIHZhciBMID0gTFVQLkwsIFUgPSBMVVAuVSwgUCA9IExVUC5QO1xuICAgIHZhciBCaSA9IEJbMF07XG4gICAgdmFyIGZsYWcgPSBmYWxzZTtcbiAgICBpZih0eXBlb2YgQmkgIT09IFwib2JqZWN0XCIpIHsgQiA9IFtbMCxCLmxlbmd0aF0sbnVtZXJpYy5saW5zcGFjZSgwLEIubGVuZ3RoLTEpLEJdOyBCaSA9IEJbMF07IGZsYWcgPSB0cnVlOyB9XG4gICAgdmFyIEJqID0gQlsxXSwgQnYgPSBCWzJdO1xuICAgIHZhciBuID0gTFswXS5sZW5ndGgtMSwgbSA9IEJpLmxlbmd0aC0xO1xuICAgIHZhciB4ID0gbnVtZXJpYy5yZXAoW25dLDApLCB4aiA9IEFycmF5KG4pO1xuICAgIHZhciBiID0gbnVtZXJpYy5yZXAoW25dLDApLCBiaiA9IEFycmF5KG4pO1xuICAgIHZhciBYaSA9IG51bWVyaWMucmVwKFttKzFdLDApLCBYaiA9IFtdLCBYdiA9IFtdO1xuICAgIHZhciBzb2wgPSBudW1lcmljLmNjc1RTb2x2ZTtcbiAgICB2YXIgaSxqLGowLGoxLGssSixOPTA7XG4gICAgZm9yKGk9MDtpPG07KytpKSB7XG4gICAgICAgIGsgPSAwO1xuICAgICAgICBqMCA9IEJpW2ldO1xuICAgICAgICBqMSA9IEJpW2krMV07XG4gICAgICAgIGZvcihqPWowO2o8ajE7KytqKSB7IFxuICAgICAgICAgICAgSiA9IExVUC5QaW52W0JqW2pdXTtcbiAgICAgICAgICAgIGJqW2tdID0gSjtcbiAgICAgICAgICAgIGJbSl0gPSBCdltqXTtcbiAgICAgICAgICAgICsraztcbiAgICAgICAgfVxuICAgICAgICBiai5sZW5ndGggPSBrO1xuICAgICAgICBzb2woTCxiLHgsYmoseGopO1xuICAgICAgICBmb3Ioaj1iai5sZW5ndGgtMTtqIT09LTE7LS1qKSBiW2JqW2pdXSA9IDA7XG4gICAgICAgIHNvbChVLHgsYix4aixiaik7XG4gICAgICAgIGlmKGZsYWcpIHJldHVybiBiO1xuICAgICAgICBmb3Ioaj14ai5sZW5ndGgtMTtqIT09LTE7LS1qKSB4W3hqW2pdXSA9IDA7XG4gICAgICAgIGZvcihqPWJqLmxlbmd0aC0xO2ohPT0tMTstLWopIHtcbiAgICAgICAgICAgIEogPSBialtqXTtcbiAgICAgICAgICAgIFhqW05dID0gSjtcbiAgICAgICAgICAgIFh2W05dID0gYltKXTtcbiAgICAgICAgICAgIGJbSl0gPSAwO1xuICAgICAgICAgICAgKytOO1xuICAgICAgICB9XG4gICAgICAgIFhpW2krMV0gPSBOO1xuICAgIH1cbiAgICByZXR1cm4gW1hpLFhqLFh2XTtcbn1cblxubnVtZXJpYy5jY3NiaW5vcCA9IGZ1bmN0aW9uIGNjc2Jpbm9wKGJvZHksc2V0dXApIHtcbiAgICBpZih0eXBlb2Ygc2V0dXAgPT09IFwidW5kZWZpbmVkXCIpIHNldHVwPScnO1xuICAgIHJldHVybiBGdW5jdGlvbignWCcsJ1knLFxuICAgICAgICAgICAgJ3ZhciBYaSA9IFhbMF0sIFhqID0gWFsxXSwgWHYgPSBYWzJdO1xcbicrXG4gICAgICAgICAgICAndmFyIFlpID0gWVswXSwgWWogPSBZWzFdLCBZdiA9IFlbMl07XFxuJytcbiAgICAgICAgICAgICd2YXIgbiA9IFhpLmxlbmd0aC0xLG0gPSBNYXRoLm1heChudW1lcmljLnN1cChYaiksbnVtZXJpYy5zdXAoWWopKSsxO1xcbicrXG4gICAgICAgICAgICAndmFyIFppID0gbnVtZXJpYy5yZXAoW24rMV0sMCksIFpqID0gW10sIFp2ID0gW107XFxuJytcbiAgICAgICAgICAgICd2YXIgeCA9IG51bWVyaWMucmVwKFttXSwwKSx5ID0gbnVtZXJpYy5yZXAoW21dLDApO1xcbicrXG4gICAgICAgICAgICAndmFyIHhrLHlrLHprO1xcbicrXG4gICAgICAgICAgICAndmFyIGksaixqMCxqMSxrLHA9MDtcXG4nK1xuICAgICAgICAgICAgc2V0dXArXG4gICAgICAgICAgICAnZm9yKGk9MDtpPG47KytpKSB7XFxuJytcbiAgICAgICAgICAgICcgIGowID0gWGlbaV07IGoxID0gWGlbaSsxXTtcXG4nK1xuICAgICAgICAgICAgJyAgZm9yKGo9ajA7aiE9PWoxOysraikge1xcbicrXG4gICAgICAgICAgICAnICAgIGsgPSBYaltqXTtcXG4nK1xuICAgICAgICAgICAgJyAgICB4W2tdID0gMTtcXG4nK1xuICAgICAgICAgICAgJyAgICBaaltwXSA9IGs7XFxuJytcbiAgICAgICAgICAgICcgICAgKytwO1xcbicrXG4gICAgICAgICAgICAnICB9XFxuJytcbiAgICAgICAgICAgICcgIGowID0gWWlbaV07IGoxID0gWWlbaSsxXTtcXG4nK1xuICAgICAgICAgICAgJyAgZm9yKGo9ajA7aiE9PWoxOysraikge1xcbicrXG4gICAgICAgICAgICAnICAgIGsgPSBZaltqXTtcXG4nK1xuICAgICAgICAgICAgJyAgICB5W2tdID0gWXZbal07XFxuJytcbiAgICAgICAgICAgICcgICAgaWYoeFtrXSA9PT0gMCkge1xcbicrXG4gICAgICAgICAgICAnICAgICAgWmpbcF0gPSBrO1xcbicrXG4gICAgICAgICAgICAnICAgICAgKytwO1xcbicrXG4gICAgICAgICAgICAnICAgIH1cXG4nK1xuICAgICAgICAgICAgJyAgfVxcbicrXG4gICAgICAgICAgICAnICBaaVtpKzFdID0gcDtcXG4nK1xuICAgICAgICAgICAgJyAgajAgPSBYaVtpXTsgajEgPSBYaVtpKzFdO1xcbicrXG4gICAgICAgICAgICAnICBmb3Ioaj1qMDtqIT09ajE7KytqKSB4W1hqW2pdXSA9IFh2W2pdO1xcbicrXG4gICAgICAgICAgICAnICBqMCA9IFppW2ldOyBqMSA9IFppW2krMV07XFxuJytcbiAgICAgICAgICAgICcgIGZvcihqPWowO2ohPT1qMTsrK2opIHtcXG4nK1xuICAgICAgICAgICAgJyAgICBrID0gWmpbal07XFxuJytcbiAgICAgICAgICAgICcgICAgeGsgPSB4W2tdO1xcbicrXG4gICAgICAgICAgICAnICAgIHlrID0geVtrXTtcXG4nK1xuICAgICAgICAgICAgYm9keSsnXFxuJytcbiAgICAgICAgICAgICcgICAgWnZbal0gPSB6aztcXG4nK1xuICAgICAgICAgICAgJyAgfVxcbicrXG4gICAgICAgICAgICAnICBqMCA9IFhpW2ldOyBqMSA9IFhpW2krMV07XFxuJytcbiAgICAgICAgICAgICcgIGZvcihqPWowO2ohPT1qMTsrK2opIHhbWGpbal1dID0gMDtcXG4nK1xuICAgICAgICAgICAgJyAgajAgPSBZaVtpXTsgajEgPSBZaVtpKzFdO1xcbicrXG4gICAgICAgICAgICAnICBmb3Ioaj1qMDtqIT09ajE7KytqKSB5W1lqW2pdXSA9IDA7XFxuJytcbiAgICAgICAgICAgICd9XFxuJytcbiAgICAgICAgICAgICdyZXR1cm4gW1ppLFpqLFp2XTsnXG4gICAgICAgICAgICApO1xufTtcblxuKGZ1bmN0aW9uKCkge1xuICAgIHZhciBrLEEsQixDO1xuICAgIGZvcihrIGluIG51bWVyaWMub3BzMikge1xuICAgICAgICBpZihpc0Zpbml0ZShldmFsKCcxJytudW1lcmljLm9wczJba10rJzAnKSkpIEEgPSAnW1lbMF0sWVsxXSxudW1lcmljLicraysnKFgsWVsyXSldJztcbiAgICAgICAgZWxzZSBBID0gJ05hTic7XG4gICAgICAgIGlmKGlzRmluaXRlKGV2YWwoJzAnK251bWVyaWMub3BzMltrXSsnMScpKSkgQiA9ICdbWFswXSxYWzFdLG51bWVyaWMuJytrKycoWFsyXSxZKV0nO1xuICAgICAgICBlbHNlIEIgPSAnTmFOJztcbiAgICAgICAgaWYoaXNGaW5pdGUoZXZhbCgnMScrbnVtZXJpYy5vcHMyW2tdKycwJykpICYmIGlzRmluaXRlKGV2YWwoJzAnK251bWVyaWMub3BzMltrXSsnMScpKSkgQyA9ICdudW1lcmljLmNjcycraysnTU0oWCxZKSc7XG4gICAgICAgIGVsc2UgQyA9ICdOYU4nO1xuICAgICAgICBudW1lcmljWydjY3MnK2srJ01NJ10gPSBudW1lcmljLmNjc2Jpbm9wKCd6ayA9IHhrICcrbnVtZXJpYy5vcHMyW2tdKyd5azsnKTtcbiAgICAgICAgbnVtZXJpY1snY2NzJytrXSA9IEZ1bmN0aW9uKCdYJywnWScsXG4gICAgICAgICAgICAgICAgJ2lmKHR5cGVvZiBYID09PSBcIm51bWJlclwiKSByZXR1cm4gJytBKyc7XFxuJytcbiAgICAgICAgICAgICAgICAnaWYodHlwZW9mIFkgPT09IFwibnVtYmVyXCIpIHJldHVybiAnK0IrJztcXG4nK1xuICAgICAgICAgICAgICAgICdyZXR1cm4gJytDKyc7XFxuJ1xuICAgICAgICAgICAgICAgICk7XG4gICAgfVxufSgpKTtcblxubnVtZXJpYy5jY3NTY2F0dGVyID0gZnVuY3Rpb24gY2NzU2NhdHRlcihBKSB7XG4gICAgdmFyIEFpID0gQVswXSwgQWogPSBBWzFdLCBBdiA9IEFbMl07XG4gICAgdmFyIG4gPSBudW1lcmljLnN1cChBaikrMSxtPUFpLmxlbmd0aDtcbiAgICB2YXIgUmkgPSBudW1lcmljLnJlcChbbl0sMCksUmo9QXJyYXkobSksIFJ2ID0gQXJyYXkobSk7XG4gICAgdmFyIGNvdW50cyA9IG51bWVyaWMucmVwKFtuXSwwKSxpO1xuICAgIGZvcihpPTA7aTxtOysraSkgY291bnRzW0FqW2ldXSsrO1xuICAgIGZvcihpPTA7aTxuOysraSkgUmlbaSsxXSA9IFJpW2ldICsgY291bnRzW2ldO1xuICAgIHZhciBwdHIgPSBSaS5zbGljZSgwKSxrLEFpaTtcbiAgICBmb3IoaT0wO2k8bTsrK2kpIHtcbiAgICAgICAgQWlpID0gQWpbaV07XG4gICAgICAgIGsgPSBwdHJbQWlpXTtcbiAgICAgICAgUmpba10gPSBBaVtpXTtcbiAgICAgICAgUnZba10gPSBBdltpXTtcbiAgICAgICAgcHRyW0FpaV09cHRyW0FpaV0rMTtcbiAgICB9XG4gICAgcmV0dXJuIFtSaSxSaixSdl07XG59XG5cbm51bWVyaWMuY2NzR2F0aGVyID0gZnVuY3Rpb24gY2NzR2F0aGVyKEEpIHtcbiAgICB2YXIgQWkgPSBBWzBdLCBBaiA9IEFbMV0sIEF2ID0gQVsyXTtcbiAgICB2YXIgbiA9IEFpLmxlbmd0aC0xLG0gPSBBai5sZW5ndGg7XG4gICAgdmFyIFJpID0gQXJyYXkobSksIFJqID0gQXJyYXkobSksIFJ2ID0gQXJyYXkobSk7XG4gICAgdmFyIGksaixqMCxqMSxwO1xuICAgIHA9MDtcbiAgICBmb3IoaT0wO2k8bjsrK2kpIHtcbiAgICAgICAgajAgPSBBaVtpXTtcbiAgICAgICAgajEgPSBBaVtpKzFdO1xuICAgICAgICBmb3Ioaj1qMDtqIT09ajE7KytqKSB7XG4gICAgICAgICAgICBSaltwXSA9IGk7XG4gICAgICAgICAgICBSaVtwXSA9IEFqW2pdO1xuICAgICAgICAgICAgUnZbcF0gPSBBdltqXTtcbiAgICAgICAgICAgICsrcDtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gW1JpLFJqLFJ2XTtcbn1cblxuLy8gVGhlIGZvbGxvd2luZyBzcGFyc2UgbGluZWFyIGFsZ2VicmEgcm91dGluZXMgYXJlIGRlcHJlY2F0ZWQuXG5cbm51bWVyaWMuc2RpbSA9IGZ1bmN0aW9uIGRpbShBLHJldCxrKSB7XG4gICAgaWYodHlwZW9mIHJldCA9PT0gXCJ1bmRlZmluZWRcIikgeyByZXQgPSBbXTsgfVxuICAgIGlmKHR5cGVvZiBBICE9PSBcIm9iamVjdFwiKSByZXR1cm4gcmV0O1xuICAgIGlmKHR5cGVvZiBrID09PSBcInVuZGVmaW5lZFwiKSB7IGs9MDsgfVxuICAgIGlmKCEoayBpbiByZXQpKSB7IHJldFtrXSA9IDA7IH1cbiAgICBpZihBLmxlbmd0aCA+IHJldFtrXSkgcmV0W2tdID0gQS5sZW5ndGg7XG4gICAgdmFyIGk7XG4gICAgZm9yKGkgaW4gQSkge1xuICAgICAgICBpZihBLmhhc093blByb3BlcnR5KGkpKSBkaW0oQVtpXSxyZXQsaysxKTtcbiAgICB9XG4gICAgcmV0dXJuIHJldDtcbn07XG5cbm51bWVyaWMuc2Nsb25lID0gZnVuY3Rpb24gY2xvbmUoQSxrLG4pIHtcbiAgICBpZih0eXBlb2YgayA9PT0gXCJ1bmRlZmluZWRcIikgeyBrPTA7IH1cbiAgICBpZih0eXBlb2YgbiA9PT0gXCJ1bmRlZmluZWRcIikgeyBuID0gbnVtZXJpYy5zZGltKEEpLmxlbmd0aDsgfVxuICAgIHZhciBpLHJldCA9IEFycmF5KEEubGVuZ3RoKTtcbiAgICBpZihrID09PSBuLTEpIHtcbiAgICAgICAgZm9yKGkgaW4gQSkgeyBpZihBLmhhc093blByb3BlcnR5KGkpKSByZXRbaV0gPSBBW2ldOyB9XG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfVxuICAgIGZvcihpIGluIEEpIHtcbiAgICAgICAgaWYoQS5oYXNPd25Qcm9wZXJ0eShpKSkgcmV0W2ldID0gY2xvbmUoQVtpXSxrKzEsbik7XG4gICAgfVxuICAgIHJldHVybiByZXQ7XG59XG5cbm51bWVyaWMuc2RpYWcgPSBmdW5jdGlvbiBkaWFnKGQpIHtcbiAgICB2YXIgbiA9IGQubGVuZ3RoLGkscmV0ID0gQXJyYXkobiksaTEsaTIsaTM7XG4gICAgZm9yKGk9bi0xO2k+PTE7aS09Mikge1xuICAgICAgICBpMSA9IGktMTtcbiAgICAgICAgcmV0W2ldID0gW107IHJldFtpXVtpXSA9IGRbaV07XG4gICAgICAgIHJldFtpMV0gPSBbXTsgcmV0W2kxXVtpMV0gPSBkW2kxXTtcbiAgICB9XG4gICAgaWYoaT09PTApIHsgcmV0WzBdID0gW107IHJldFswXVswXSA9IGRbaV07IH1cbiAgICByZXR1cm4gcmV0O1xufVxuXG5udW1lcmljLnNpZGVudGl0eSA9IGZ1bmN0aW9uIGlkZW50aXR5KG4pIHsgcmV0dXJuIG51bWVyaWMuc2RpYWcobnVtZXJpYy5yZXAoW25dLDEpKTsgfVxuXG5udW1lcmljLnN0cmFuc3Bvc2UgPSBmdW5jdGlvbiB0cmFuc3Bvc2UoQSkge1xuICAgIHZhciByZXQgPSBbXSwgbiA9IEEubGVuZ3RoLCBpLGosQWk7XG4gICAgZm9yKGkgaW4gQSkge1xuICAgICAgICBpZighKEEuaGFzT3duUHJvcGVydHkoaSkpKSBjb250aW51ZTtcbiAgICAgICAgQWkgPSBBW2ldO1xuICAgICAgICBmb3IoaiBpbiBBaSkge1xuICAgICAgICAgICAgaWYoIShBaS5oYXNPd25Qcm9wZXJ0eShqKSkpIGNvbnRpbnVlO1xuICAgICAgICAgICAgaWYodHlwZW9mIHJldFtqXSAhPT0gXCJvYmplY3RcIikgeyByZXRbal0gPSBbXTsgfVxuICAgICAgICAgICAgcmV0W2pdW2ldID0gQWlbal07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJldDtcbn1cblxubnVtZXJpYy5zTFVQID0gZnVuY3Rpb24gTFVQKEEsdG9sKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiVGhlIGZ1bmN0aW9uIG51bWVyaWMuc0xVUCBoYWQgYSBidWcgaW4gaXQgYW5kIGhhcyBiZWVuIHJlbW92ZWQuIFBsZWFzZSB1c2UgdGhlIG5ldyBudW1lcmljLmNjc0xVUCBmdW5jdGlvbiBpbnN0ZWFkLlwiKTtcbn07XG5cbm51bWVyaWMuc2RvdE1NID0gZnVuY3Rpb24gZG90TU0oQSxCKSB7XG4gICAgdmFyIHAgPSBBLmxlbmd0aCwgcSA9IEIubGVuZ3RoLCBCVCA9IG51bWVyaWMuc3RyYW5zcG9zZShCKSwgciA9IEJULmxlbmd0aCwgQWksIEJUaztcbiAgICB2YXIgaSxqLGssYWNjdW07XG4gICAgdmFyIHJldCA9IEFycmF5KHApLHJldGk7XG4gICAgZm9yKGk9cC0xO2k+PTA7aS0tKSB7XG4gICAgICAgIHJldGkgPSBbXTtcbiAgICAgICAgQWkgPSBBW2ldO1xuICAgICAgICBmb3Ioaz1yLTE7az49MDtrLS0pIHtcbiAgICAgICAgICAgIGFjY3VtID0gMDtcbiAgICAgICAgICAgIEJUayA9IEJUW2tdO1xuICAgICAgICAgICAgZm9yKGogaW4gQWkpIHtcbiAgICAgICAgICAgICAgICBpZighKEFpLmhhc093blByb3BlcnR5KGopKSkgY29udGludWU7XG4gICAgICAgICAgICAgICAgaWYoaiBpbiBCVGspIHsgYWNjdW0gKz0gQWlbal0qQlRrW2pdOyB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZihhY2N1bSkgcmV0aVtrXSA9IGFjY3VtO1xuICAgICAgICB9XG4gICAgICAgIHJldFtpXSA9IHJldGk7XG4gICAgfVxuICAgIHJldHVybiByZXQ7XG59XG5cbm51bWVyaWMuc2RvdE1WID0gZnVuY3Rpb24gZG90TVYoQSx4KSB7XG4gICAgdmFyIHAgPSBBLmxlbmd0aCwgQWksIGksajtcbiAgICB2YXIgcmV0ID0gQXJyYXkocCksIGFjY3VtO1xuICAgIGZvcihpPXAtMTtpPj0wO2ktLSkge1xuICAgICAgICBBaSA9IEFbaV07XG4gICAgICAgIGFjY3VtID0gMDtcbiAgICAgICAgZm9yKGogaW4gQWkpIHtcbiAgICAgICAgICAgIGlmKCEoQWkuaGFzT3duUHJvcGVydHkoaikpKSBjb250aW51ZTtcbiAgICAgICAgICAgIGlmKHhbal0pIGFjY3VtICs9IEFpW2pdKnhbal07XG4gICAgICAgIH1cbiAgICAgICAgaWYoYWNjdW0pIHJldFtpXSA9IGFjY3VtO1xuICAgIH1cbiAgICByZXR1cm4gcmV0O1xufVxuXG5udW1lcmljLnNkb3RWTSA9IGZ1bmN0aW9uIGRvdE1WKHgsQSkge1xuICAgIHZhciBpLGosQWksYWxwaGE7XG4gICAgdmFyIHJldCA9IFtdLCBhY2N1bTtcbiAgICBmb3IoaSBpbiB4KSB7XG4gICAgICAgIGlmKCF4Lmhhc093blByb3BlcnR5KGkpKSBjb250aW51ZTtcbiAgICAgICAgQWkgPSBBW2ldO1xuICAgICAgICBhbHBoYSA9IHhbaV07XG4gICAgICAgIGZvcihqIGluIEFpKSB7XG4gICAgICAgICAgICBpZighQWkuaGFzT3duUHJvcGVydHkoaikpIGNvbnRpbnVlO1xuICAgICAgICAgICAgaWYoIXJldFtqXSkgeyByZXRbal0gPSAwOyB9XG4gICAgICAgICAgICByZXRbal0gKz0gYWxwaGEqQWlbal07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJldDtcbn1cblxubnVtZXJpYy5zZG90VlYgPSBmdW5jdGlvbiBkb3RWVih4LHkpIHtcbiAgICB2YXIgaSxyZXQ9MDtcbiAgICBmb3IoaSBpbiB4KSB7IGlmKHhbaV0gJiYgeVtpXSkgcmV0Kz0geFtpXSp5W2ldOyB9XG4gICAgcmV0dXJuIHJldDtcbn1cblxubnVtZXJpYy5zZG90ID0gZnVuY3Rpb24gZG90KEEsQikge1xuICAgIHZhciBtID0gbnVtZXJpYy5zZGltKEEpLmxlbmd0aCwgbiA9IG51bWVyaWMuc2RpbShCKS5sZW5ndGg7XG4gICAgdmFyIGsgPSBtKjEwMDArbjtcbiAgICBzd2l0Y2goaykge1xuICAgIGNhc2UgMDogcmV0dXJuIEEqQjtcbiAgICBjYXNlIDEwMDE6IHJldHVybiBudW1lcmljLnNkb3RWVihBLEIpO1xuICAgIGNhc2UgMjAwMTogcmV0dXJuIG51bWVyaWMuc2RvdE1WKEEsQik7XG4gICAgY2FzZSAxMDAyOiByZXR1cm4gbnVtZXJpYy5zZG90Vk0oQSxCKTtcbiAgICBjYXNlIDIwMDI6IHJldHVybiBudW1lcmljLnNkb3RNTShBLEIpO1xuICAgIGRlZmF1bHQ6IHRocm93IG5ldyBFcnJvcignbnVtZXJpYy5zZG90IG5vdCBpbXBsZW1lbnRlZCBmb3IgdGVuc29ycyBvZiBvcmRlciAnK20rJyBhbmQgJytuKTtcbiAgICB9XG59XG5cbm51bWVyaWMuc3NjYXR0ZXIgPSBmdW5jdGlvbiBzY2F0dGVyKFYpIHtcbiAgICB2YXIgbiA9IFZbMF0ubGVuZ3RoLCBWaWosIGksIGosIG0gPSBWLmxlbmd0aCwgQSA9IFtdLCBBajtcbiAgICBmb3IoaT1uLTE7aT49MDstLWkpIHtcbiAgICAgICAgaWYoIVZbbS0xXVtpXSkgY29udGludWU7XG4gICAgICAgIEFqID0gQTtcbiAgICAgICAgZm9yKGo9MDtqPG0tMjtqKyspIHtcbiAgICAgICAgICAgIFZpaiA9IFZbal1baV07XG4gICAgICAgICAgICBpZighQWpbVmlqXSkgQWpbVmlqXSA9IFtdO1xuICAgICAgICAgICAgQWogPSBBaltWaWpdO1xuICAgICAgICB9XG4gICAgICAgIEFqW1Zbal1baV1dID0gVltqKzFdW2ldO1xuICAgIH1cbiAgICByZXR1cm4gQTtcbn1cblxubnVtZXJpYy5zZ2F0aGVyID0gZnVuY3Rpb24gZ2F0aGVyKEEscmV0LGspIHtcbiAgICBpZih0eXBlb2YgcmV0ID09PSBcInVuZGVmaW5lZFwiKSByZXQgPSBbXTtcbiAgICBpZih0eXBlb2YgayA9PT0gXCJ1bmRlZmluZWRcIikgayA9IFtdO1xuICAgIHZhciBuLGksQWk7XG4gICAgbiA9IGsubGVuZ3RoO1xuICAgIGZvcihpIGluIEEpIHtcbiAgICAgICAgaWYoQS5oYXNPd25Qcm9wZXJ0eShpKSkge1xuICAgICAgICAgICAga1tuXSA9IHBhcnNlSW50KGkpO1xuICAgICAgICAgICAgQWkgPSBBW2ldO1xuICAgICAgICAgICAgaWYodHlwZW9mIEFpID09PSBcIm51bWJlclwiKSB7XG4gICAgICAgICAgICAgICAgaWYoQWkpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYocmV0Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yKGk9bisxO2k+PTA7LS1pKSByZXRbaV0gPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBmb3IoaT1uO2k+PTA7LS1pKSByZXRbaV0ucHVzaChrW2ldKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0W24rMV0ucHVzaChBaSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGdhdGhlcihBaSxyZXQsayk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYoay5sZW5ndGg+bikgay5wb3AoKTtcbiAgICByZXR1cm4gcmV0O1xufVxuXG4vLyA2LiBDb29yZGluYXRlIG1hdHJpY2VzXG5udW1lcmljLmNMVSA9IGZ1bmN0aW9uIExVKEEpIHtcbiAgICB2YXIgSSA9IEFbMF0sIEogPSBBWzFdLCBWID0gQVsyXTtcbiAgICB2YXIgcCA9IEkubGVuZ3RoLCBtPTAsIGksaixrLGEsYixjO1xuICAgIGZvcihpPTA7aTxwO2krKykgaWYoSVtpXT5tKSBtPUlbaV07XG4gICAgbSsrO1xuICAgIHZhciBMID0gQXJyYXkobSksIFUgPSBBcnJheShtKSwgbGVmdCA9IG51bWVyaWMucmVwKFttXSxJbmZpbml0eSksIHJpZ2h0ID0gbnVtZXJpYy5yZXAoW21dLC1JbmZpbml0eSk7XG4gICAgdmFyIFVpLCBVaixhbHBoYTtcbiAgICBmb3Ioaz0wO2s8cDtrKyspIHtcbiAgICAgICAgaSA9IElba107XG4gICAgICAgIGogPSBKW2tdO1xuICAgICAgICBpZihqPGxlZnRbaV0pIGxlZnRbaV0gPSBqO1xuICAgICAgICBpZihqPnJpZ2h0W2ldKSByaWdodFtpXSA9IGo7XG4gICAgfVxuICAgIGZvcihpPTA7aTxtLTE7aSsrKSB7IGlmKHJpZ2h0W2ldID4gcmlnaHRbaSsxXSkgcmlnaHRbaSsxXSA9IHJpZ2h0W2ldOyB9XG4gICAgZm9yKGk9bS0xO2k+PTE7aS0tKSB7IGlmKGxlZnRbaV08bGVmdFtpLTFdKSBsZWZ0W2ktMV0gPSBsZWZ0W2ldOyB9XG4gICAgdmFyIGNvdW50TCA9IDAsIGNvdW50VSA9IDA7XG4gICAgZm9yKGk9MDtpPG07aSsrKSB7XG4gICAgICAgIFVbaV0gPSBudW1lcmljLnJlcChbcmlnaHRbaV0tbGVmdFtpXSsxXSwwKTtcbiAgICAgICAgTFtpXSA9IG51bWVyaWMucmVwKFtpLWxlZnRbaV1dLDApO1xuICAgICAgICBjb3VudEwgKz0gaS1sZWZ0W2ldKzE7XG4gICAgICAgIGNvdW50VSArPSByaWdodFtpXS1pKzE7XG4gICAgfVxuICAgIGZvcihrPTA7azxwO2srKykgeyBpID0gSVtrXTsgVVtpXVtKW2tdLWxlZnRbaV1dID0gVltrXTsgfVxuICAgIGZvcihpPTA7aTxtLTE7aSsrKSB7XG4gICAgICAgIGEgPSBpLWxlZnRbaV07XG4gICAgICAgIFVpID0gVVtpXTtcbiAgICAgICAgZm9yKGo9aSsxO2xlZnRbal08PWkgJiYgajxtO2orKykge1xuICAgICAgICAgICAgYiA9IGktbGVmdFtqXTtcbiAgICAgICAgICAgIGMgPSByaWdodFtpXS1pO1xuICAgICAgICAgICAgVWogPSBVW2pdO1xuICAgICAgICAgICAgYWxwaGEgPSBValtiXS9VaVthXTtcbiAgICAgICAgICAgIGlmKGFscGhhKSB7XG4gICAgICAgICAgICAgICAgZm9yKGs9MTtrPD1jO2srKykgeyBValtrK2JdIC09IGFscGhhKlVpW2srYV07IH1cbiAgICAgICAgICAgICAgICBMW2pdW2ktbGVmdFtqXV0gPSBhbHBoYTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICB2YXIgVWkgPSBbXSwgVWogPSBbXSwgVXYgPSBbXSwgTGkgPSBbXSwgTGogPSBbXSwgTHYgPSBbXTtcbiAgICB2YXIgcCxxLGZvbztcbiAgICBwPTA7IHE9MDtcbiAgICBmb3IoaT0wO2k8bTtpKyspIHtcbiAgICAgICAgYSA9IGxlZnRbaV07XG4gICAgICAgIGIgPSByaWdodFtpXTtcbiAgICAgICAgZm9vID0gVVtpXTtcbiAgICAgICAgZm9yKGo9aTtqPD1iO2orKykge1xuICAgICAgICAgICAgaWYoZm9vW2otYV0pIHtcbiAgICAgICAgICAgICAgICBVaVtwXSA9IGk7XG4gICAgICAgICAgICAgICAgVWpbcF0gPSBqO1xuICAgICAgICAgICAgICAgIFV2W3BdID0gZm9vW2otYV07XG4gICAgICAgICAgICAgICAgcCsrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGZvbyA9IExbaV07XG4gICAgICAgIGZvcihqPWE7ajxpO2orKykge1xuICAgICAgICAgICAgaWYoZm9vW2otYV0pIHtcbiAgICAgICAgICAgICAgICBMaVtxXSA9IGk7XG4gICAgICAgICAgICAgICAgTGpbcV0gPSBqO1xuICAgICAgICAgICAgICAgIEx2W3FdID0gZm9vW2otYV07XG4gICAgICAgICAgICAgICAgcSsrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIExpW3FdID0gaTtcbiAgICAgICAgTGpbcV0gPSBpO1xuICAgICAgICBMdltxXSA9IDE7XG4gICAgICAgIHErKztcbiAgICB9XG4gICAgcmV0dXJuIHtVOltVaSxVaixVdl0sIEw6W0xpLExqLEx2XX07XG59O1xuXG5udW1lcmljLmNMVXNvbHZlID0gZnVuY3Rpb24gTFVzb2x2ZShsdSxiKSB7XG4gICAgdmFyIEwgPSBsdS5MLCBVID0gbHUuVSwgcmV0ID0gbnVtZXJpYy5jbG9uZShiKTtcbiAgICB2YXIgTGkgPSBMWzBdLCBMaiA9IExbMV0sIEx2ID0gTFsyXTtcbiAgICB2YXIgVWkgPSBVWzBdLCBVaiA9IFVbMV0sIFV2ID0gVVsyXTtcbiAgICB2YXIgcCA9IFVpLmxlbmd0aCwgcSA9IExpLmxlbmd0aDtcbiAgICB2YXIgbSA9IHJldC5sZW5ndGgsaSxqLGs7XG4gICAgayA9IDA7XG4gICAgZm9yKGk9MDtpPG07aSsrKSB7XG4gICAgICAgIHdoaWxlKExqW2tdIDwgaSkge1xuICAgICAgICAgICAgcmV0W2ldIC09IEx2W2tdKnJldFtMaltrXV07XG4gICAgICAgICAgICBrKys7XG4gICAgICAgIH1cbiAgICAgICAgaysrO1xuICAgIH1cbiAgICBrID0gcC0xO1xuICAgIGZvcihpPW0tMTtpPj0wO2ktLSkge1xuICAgICAgICB3aGlsZShValtrXSA+IGkpIHtcbiAgICAgICAgICAgIHJldFtpXSAtPSBVdltrXSpyZXRbVWpba11dO1xuICAgICAgICAgICAgay0tO1xuICAgICAgICB9XG4gICAgICAgIHJldFtpXSAvPSBVdltrXTtcbiAgICAgICAgay0tO1xuICAgIH1cbiAgICByZXR1cm4gcmV0O1xufTtcblxubnVtZXJpYy5jZ3JpZCA9IGZ1bmN0aW9uIGdyaWQobixzaGFwZSkge1xuICAgIGlmKHR5cGVvZiBuID09PSBcIm51bWJlclwiKSBuID0gW24sbl07XG4gICAgdmFyIHJldCA9IG51bWVyaWMucmVwKG4sLTEpO1xuICAgIHZhciBpLGosY291bnQ7XG4gICAgaWYodHlwZW9mIHNoYXBlICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgc3dpdGNoKHNoYXBlKSB7XG4gICAgICAgIGNhc2UgJ0wnOlxuICAgICAgICAgICAgc2hhcGUgPSBmdW5jdGlvbihpLGopIHsgcmV0dXJuIChpPj1uWzBdLzIgfHwgajxuWzFdLzIpOyB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHNoYXBlID0gZnVuY3Rpb24oaSxqKSB7IHJldHVybiB0cnVlOyB9O1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9XG4gICAgY291bnQ9MDtcbiAgICBmb3IoaT0xO2k8blswXS0xO2krKykgZm9yKGo9MTtqPG5bMV0tMTtqKyspIFxuICAgICAgICBpZihzaGFwZShpLGopKSB7XG4gICAgICAgICAgICByZXRbaV1bal0gPSBjb3VudDtcbiAgICAgICAgICAgIGNvdW50Kys7XG4gICAgICAgIH1cbiAgICByZXR1cm4gcmV0O1xufVxuXG5udW1lcmljLmNkZWxzcSA9IGZ1bmN0aW9uIGRlbHNxKGcpIHtcbiAgICB2YXIgZGlyID0gW1stMSwwXSxbMCwtMV0sWzAsMV0sWzEsMF1dO1xuICAgIHZhciBzID0gbnVtZXJpYy5kaW0oZyksIG0gPSBzWzBdLCBuID0gc1sxXSwgaSxqLGsscCxxO1xuICAgIHZhciBMaSA9IFtdLCBMaiA9IFtdLCBMdiA9IFtdO1xuICAgIGZvcihpPTE7aTxtLTE7aSsrKSBmb3Ioaj0xO2o8bi0xO2orKykge1xuICAgICAgICBpZihnW2ldW2pdPDApIGNvbnRpbnVlO1xuICAgICAgICBmb3Ioaz0wO2s8NDtrKyspIHtcbiAgICAgICAgICAgIHAgPSBpK2RpcltrXVswXTtcbiAgICAgICAgICAgIHEgPSBqK2RpcltrXVsxXTtcbiAgICAgICAgICAgIGlmKGdbcF1bcV08MCkgY29udGludWU7XG4gICAgICAgICAgICBMaS5wdXNoKGdbaV1bal0pO1xuICAgICAgICAgICAgTGoucHVzaChnW3BdW3FdKTtcbiAgICAgICAgICAgIEx2LnB1c2goLTEpO1xuICAgICAgICB9XG4gICAgICAgIExpLnB1c2goZ1tpXVtqXSk7XG4gICAgICAgIExqLnB1c2goZ1tpXVtqXSk7XG4gICAgICAgIEx2LnB1c2goNCk7XG4gICAgfVxuICAgIHJldHVybiBbTGksTGosTHZdO1xufVxuXG5udW1lcmljLmNkb3RNViA9IGZ1bmN0aW9uIGRvdE1WKEEseCkge1xuICAgIHZhciByZXQsIEFpID0gQVswXSwgQWogPSBBWzFdLCBBdiA9IEFbMl0sayxwPUFpLmxlbmd0aCxOO1xuICAgIE49MDtcbiAgICBmb3Ioaz0wO2s8cDtrKyspIHsgaWYoQWlba10+TikgTiA9IEFpW2tdOyB9XG4gICAgTisrO1xuICAgIHJldCA9IG51bWVyaWMucmVwKFtOXSwwKTtcbiAgICBmb3Ioaz0wO2s8cDtrKyspIHsgcmV0W0FpW2tdXSs9QXZba10qeFtBaltrXV07IH1cbiAgICByZXR1cm4gcmV0O1xufVxuXG4vLyA3LiBTcGxpbmVzXG5cbm51bWVyaWMuU3BsaW5lID0gZnVuY3Rpb24gU3BsaW5lKHgseWwseXIsa2wsa3IpIHsgdGhpcy54ID0geDsgdGhpcy55bCA9IHlsOyB0aGlzLnlyID0geXI7IHRoaXMua2wgPSBrbDsgdGhpcy5rciA9IGtyOyB9XG5udW1lcmljLlNwbGluZS5wcm90b3R5cGUuX2F0ID0gZnVuY3Rpb24gX2F0KHgxLHApIHtcbiAgICB2YXIgeCA9IHRoaXMueDtcbiAgICB2YXIgeWwgPSB0aGlzLnlsO1xuICAgIHZhciB5ciA9IHRoaXMueXI7XG4gICAgdmFyIGtsID0gdGhpcy5rbDtcbiAgICB2YXIga3IgPSB0aGlzLmtyO1xuICAgIHZhciB4MSxhLGIsdDtcbiAgICB2YXIgYWRkID0gbnVtZXJpYy5hZGQsIHN1YiA9IG51bWVyaWMuc3ViLCBtdWwgPSBudW1lcmljLm11bDtcbiAgICBhID0gc3ViKG11bChrbFtwXSx4W3ArMV0teFtwXSksc3ViKHlyW3ArMV0seWxbcF0pKTtcbiAgICBiID0gYWRkKG11bChrcltwKzFdLHhbcF0teFtwKzFdKSxzdWIoeXJbcCsxXSx5bFtwXSkpO1xuICAgIHQgPSAoeDEteFtwXSkvKHhbcCsxXS14W3BdKTtcbiAgICB2YXIgcyA9IHQqKDEtdCk7XG4gICAgcmV0dXJuIGFkZChhZGQoYWRkKG11bCgxLXQseWxbcF0pLG11bCh0LHlyW3ArMV0pKSxtdWwoYSxzKigxLXQpKSksbXVsKGIscyp0KSk7XG59XG5udW1lcmljLlNwbGluZS5wcm90b3R5cGUuYXQgPSBmdW5jdGlvbiBhdCh4MCkge1xuICAgIGlmKHR5cGVvZiB4MCA9PT0gXCJudW1iZXJcIikge1xuICAgICAgICB2YXIgeCA9IHRoaXMueDtcbiAgICAgICAgdmFyIG4gPSB4Lmxlbmd0aDtcbiAgICAgICAgdmFyIHAscSxtaWQsZmxvb3IgPSBNYXRoLmZsb29yLGEsYix0O1xuICAgICAgICBwID0gMDtcbiAgICAgICAgcSA9IG4tMTtcbiAgICAgICAgd2hpbGUocS1wPjEpIHtcbiAgICAgICAgICAgIG1pZCA9IGZsb29yKChwK3EpLzIpO1xuICAgICAgICAgICAgaWYoeFttaWRdIDw9IHgwKSBwID0gbWlkO1xuICAgICAgICAgICAgZWxzZSBxID0gbWlkO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLl9hdCh4MCxwKTtcbiAgICB9XG4gICAgdmFyIG4gPSB4MC5sZW5ndGgsIGksIHJldCA9IEFycmF5KG4pO1xuICAgIGZvcihpPW4tMTtpIT09LTE7LS1pKSByZXRbaV0gPSB0aGlzLmF0KHgwW2ldKTtcbiAgICByZXR1cm4gcmV0O1xufVxubnVtZXJpYy5TcGxpbmUucHJvdG90eXBlLmRpZmYgPSBmdW5jdGlvbiBkaWZmKCkge1xuICAgIHZhciB4ID0gdGhpcy54O1xuICAgIHZhciB5bCA9IHRoaXMueWw7XG4gICAgdmFyIHlyID0gdGhpcy55cjtcbiAgICB2YXIga2wgPSB0aGlzLmtsO1xuICAgIHZhciBrciA9IHRoaXMua3I7XG4gICAgdmFyIG4gPSB5bC5sZW5ndGg7XG4gICAgdmFyIGksZHgsZHk7XG4gICAgdmFyIHpsID0ga2wsIHpyID0ga3IsIHBsID0gQXJyYXkobiksIHByID0gQXJyYXkobik7XG4gICAgdmFyIGFkZCA9IG51bWVyaWMuYWRkLCBtdWwgPSBudW1lcmljLm11bCwgZGl2ID0gbnVtZXJpYy5kaXYsIHN1YiA9IG51bWVyaWMuc3ViO1xuICAgIGZvcihpPW4tMTtpIT09LTE7LS1pKSB7XG4gICAgICAgIGR4ID0geFtpKzFdLXhbaV07XG4gICAgICAgIGR5ID0gc3ViKHlyW2krMV0seWxbaV0pO1xuICAgICAgICBwbFtpXSA9IGRpdihhZGQobXVsKGR5LCA2KSxtdWwoa2xbaV0sLTQqZHgpLG11bChrcltpKzFdLC0yKmR4KSksZHgqZHgpO1xuICAgICAgICBwcltpKzFdID0gZGl2KGFkZChtdWwoZHksLTYpLG11bChrbFtpXSwgMipkeCksbXVsKGtyW2krMV0sIDQqZHgpKSxkeCpkeCk7XG4gICAgfVxuICAgIHJldHVybiBuZXcgbnVtZXJpYy5TcGxpbmUoeCx6bCx6cixwbCxwcik7XG59XG5udW1lcmljLlNwbGluZS5wcm90b3R5cGUucm9vdHMgPSBmdW5jdGlvbiByb290cygpIHtcbiAgICBmdW5jdGlvbiBzcXIoeCkgeyByZXR1cm4geCp4OyB9XG4gICAgZnVuY3Rpb24gaGV2YWwoeTAseTEsazAsazEseCkge1xuICAgICAgICB2YXIgQSA9IGswKjItKHkxLXkwKTtcbiAgICAgICAgdmFyIEIgPSAtazEqMisoeTEteTApO1xuICAgICAgICB2YXIgdCA9ICh4KzEpKjAuNTtcbiAgICAgICAgdmFyIHMgPSB0KigxLXQpO1xuICAgICAgICByZXR1cm4gKDEtdCkqeTArdCp5MStBKnMqKDEtdCkrQipzKnQ7XG4gICAgfVxuICAgIHZhciByZXQgPSBbXTtcbiAgICB2YXIgeCA9IHRoaXMueCwgeWwgPSB0aGlzLnlsLCB5ciA9IHRoaXMueXIsIGtsID0gdGhpcy5rbCwga3IgPSB0aGlzLmtyO1xuICAgIGlmKHR5cGVvZiB5bFswXSA9PT0gXCJudW1iZXJcIikge1xuICAgICAgICB5bCA9IFt5bF07XG4gICAgICAgIHlyID0gW3lyXTtcbiAgICAgICAga2wgPSBba2xdO1xuICAgICAgICBrciA9IFtrcl07XG4gICAgfVxuICAgIHZhciBtID0geWwubGVuZ3RoLG49eC5sZW5ndGgtMSxpLGosayx5LHMsdDtcbiAgICB2YXIgYWksYmksY2ksZGksIHJldCA9IEFycmF5KG0pLHJpLGswLGsxLHkwLHkxLEEsQixELGR4LGN4LHN0b3BzLHowLHoxLHptLHQwLHQxLHRtO1xuICAgIHZhciBzcXJ0ID0gTWF0aC5zcXJ0O1xuICAgIGZvcihpPTA7aSE9PW07KytpKSB7XG4gICAgICAgIGFpID0geWxbaV07XG4gICAgICAgIGJpID0geXJbaV07XG4gICAgICAgIGNpID0ga2xbaV07XG4gICAgICAgIGRpID0ga3JbaV07XG4gICAgICAgIHJpID0gW107XG4gICAgICAgIGZvcihqPTA7aiE9PW47aisrKSB7XG4gICAgICAgICAgICBpZihqPjAgJiYgYmlbal0qYWlbal08MCkgcmkucHVzaCh4W2pdKTtcbiAgICAgICAgICAgIGR4ID0gKHhbaisxXS14W2pdKTtcbiAgICAgICAgICAgIGN4ID0geFtqXTtcbiAgICAgICAgICAgIHkwID0gYWlbal07XG4gICAgICAgICAgICB5MSA9IGJpW2orMV07XG4gICAgICAgICAgICBrMCA9IGNpW2pdL2R4O1xuICAgICAgICAgICAgazEgPSBkaVtqKzFdL2R4O1xuICAgICAgICAgICAgRCA9IHNxcihrMC1rMSszKih5MC15MSkpICsgMTIqazEqeTA7XG4gICAgICAgICAgICBBID0gazErMyp5MCsyKmswLTMqeTE7XG4gICAgICAgICAgICBCID0gMyooazErazArMiooeTAteTEpKTtcbiAgICAgICAgICAgIGlmKEQ8PTApIHtcbiAgICAgICAgICAgICAgICB6MCA9IEEvQjtcbiAgICAgICAgICAgICAgICBpZih6MD54W2pdICYmIHowPHhbaisxXSkgc3RvcHMgPSBbeFtqXSx6MCx4W2orMV1dO1xuICAgICAgICAgICAgICAgIGVsc2Ugc3RvcHMgPSBbeFtqXSx4W2orMV1dO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB6MCA9IChBLXNxcnQoRCkpL0I7XG4gICAgICAgICAgICAgICAgejEgPSAoQStzcXJ0KEQpKS9CO1xuICAgICAgICAgICAgICAgIHN0b3BzID0gW3hbal1dO1xuICAgICAgICAgICAgICAgIGlmKHowPnhbal0gJiYgejA8eFtqKzFdKSBzdG9wcy5wdXNoKHowKTtcbiAgICAgICAgICAgICAgICBpZih6MT54W2pdICYmIHoxPHhbaisxXSkgc3RvcHMucHVzaCh6MSk7XG4gICAgICAgICAgICAgICAgc3RvcHMucHVzaCh4W2orMV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdDAgPSBzdG9wc1swXTtcbiAgICAgICAgICAgIHowID0gdGhpcy5fYXQodDAsaik7XG4gICAgICAgICAgICBmb3Ioaz0wO2s8c3RvcHMubGVuZ3RoLTE7aysrKSB7XG4gICAgICAgICAgICAgICAgdDEgPSBzdG9wc1trKzFdO1xuICAgICAgICAgICAgICAgIHoxID0gdGhpcy5fYXQodDEsaik7XG4gICAgICAgICAgICAgICAgaWYoejAgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgcmkucHVzaCh0MCk7IFxuICAgICAgICAgICAgICAgICAgICB0MCA9IHQxO1xuICAgICAgICAgICAgICAgICAgICB6MCA9IHoxO1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYoejEgPT09IDAgfHwgejAqejE+MCkge1xuICAgICAgICAgICAgICAgICAgICB0MCA9IHQxO1xuICAgICAgICAgICAgICAgICAgICB6MCA9IHoxO1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIHNpZGUgPSAwO1xuICAgICAgICAgICAgICAgIHdoaWxlKDEpIHtcbiAgICAgICAgICAgICAgICAgICAgdG0gPSAoejAqdDEtejEqdDApLyh6MC16MSk7XG4gICAgICAgICAgICAgICAgICAgIGlmKHRtIDw9IHQwIHx8IHRtID49IHQxKSB7IGJyZWFrOyB9XG4gICAgICAgICAgICAgICAgICAgIHptID0gdGhpcy5fYXQodG0saik7XG4gICAgICAgICAgICAgICAgICAgIGlmKHptKnoxPjApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHQxID0gdG07XG4gICAgICAgICAgICAgICAgICAgICAgICB6MSA9IHptO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYoc2lkZSA9PT0gLTEpIHowKj0wLjU7XG4gICAgICAgICAgICAgICAgICAgICAgICBzaWRlID0gLTE7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZih6bSp6MD4wKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0MCA9IHRtO1xuICAgICAgICAgICAgICAgICAgICAgICAgejAgPSB6bTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmKHNpZGUgPT09IDEpIHoxKj0wLjU7XG4gICAgICAgICAgICAgICAgICAgICAgICBzaWRlID0gMTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByaS5wdXNoKHRtKTtcbiAgICAgICAgICAgICAgICB0MCA9IHN0b3BzW2srMV07XG4gICAgICAgICAgICAgICAgejAgPSB0aGlzLl9hdCh0MCwgaik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZih6MSA9PT0gMCkgcmkucHVzaCh0MSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0W2ldID0gcmk7XG4gICAgfVxuICAgIGlmKHR5cGVvZiB0aGlzLnlsWzBdID09PSBcIm51bWJlclwiKSByZXR1cm4gcmV0WzBdO1xuICAgIHJldHVybiByZXQ7XG59XG5udW1lcmljLnNwbGluZSA9IGZ1bmN0aW9uIHNwbGluZSh4LHksazEsa24pIHtcbiAgICB2YXIgbiA9IHgubGVuZ3RoLCBiID0gW10sIGR4ID0gW10sIGR5ID0gW107XG4gICAgdmFyIGk7XG4gICAgdmFyIHN1YiA9IG51bWVyaWMuc3ViLG11bCA9IG51bWVyaWMubXVsLGFkZCA9IG51bWVyaWMuYWRkO1xuICAgIGZvcihpPW4tMjtpPj0wO2ktLSkgeyBkeFtpXSA9IHhbaSsxXS14W2ldOyBkeVtpXSA9IHN1Yih5W2krMV0seVtpXSk7IH1cbiAgICBpZih0eXBlb2YgazEgPT09IFwic3RyaW5nXCIgfHwgdHlwZW9mIGtuID09PSBcInN0cmluZ1wiKSB7IFxuICAgICAgICBrMSA9IGtuID0gXCJwZXJpb2RpY1wiO1xuICAgIH1cbiAgICAvLyBCdWlsZCBzcGFyc2UgdHJpZGlhZ29uYWwgc3lzdGVtXG4gICAgdmFyIFQgPSBbW10sW10sW11dO1xuICAgIHN3aXRjaCh0eXBlb2YgazEpIHtcbiAgICBjYXNlIFwidW5kZWZpbmVkXCI6XG4gICAgICAgIGJbMF0gPSBtdWwoMy8oZHhbMF0qZHhbMF0pLGR5WzBdKTtcbiAgICAgICAgVFswXS5wdXNoKDAsMCk7XG4gICAgICAgIFRbMV0ucHVzaCgwLDEpO1xuICAgICAgICBUWzJdLnB1c2goMi9keFswXSwxL2R4WzBdKTtcbiAgICAgICAgYnJlYWs7XG4gICAgY2FzZSBcInN0cmluZ1wiOlxuICAgICAgICBiWzBdID0gYWRkKG11bCgzLyhkeFtuLTJdKmR4W24tMl0pLGR5W24tMl0pLG11bCgzLyhkeFswXSpkeFswXSksZHlbMF0pKTtcbiAgICAgICAgVFswXS5wdXNoKDAsMCwwKTtcbiAgICAgICAgVFsxXS5wdXNoKG4tMiwwLDEpO1xuICAgICAgICBUWzJdLnB1c2goMS9keFtuLTJdLDIvZHhbbi0yXSsyL2R4WzBdLDEvZHhbMF0pO1xuICAgICAgICBicmVhaztcbiAgICBkZWZhdWx0OlxuICAgICAgICBiWzBdID0gazE7XG4gICAgICAgIFRbMF0ucHVzaCgwKTtcbiAgICAgICAgVFsxXS5wdXNoKDApO1xuICAgICAgICBUWzJdLnB1c2goMSk7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBmb3IoaT0xO2k8bi0xO2krKykge1xuICAgICAgICBiW2ldID0gYWRkKG11bCgzLyhkeFtpLTFdKmR4W2ktMV0pLGR5W2ktMV0pLG11bCgzLyhkeFtpXSpkeFtpXSksZHlbaV0pKTtcbiAgICAgICAgVFswXS5wdXNoKGksaSxpKTtcbiAgICAgICAgVFsxXS5wdXNoKGktMSxpLGkrMSk7XG4gICAgICAgIFRbMl0ucHVzaCgxL2R4W2ktMV0sMi9keFtpLTFdKzIvZHhbaV0sMS9keFtpXSk7XG4gICAgfVxuICAgIHN3aXRjaCh0eXBlb2Yga24pIHtcbiAgICBjYXNlIFwidW5kZWZpbmVkXCI6XG4gICAgICAgIGJbbi0xXSA9IG11bCgzLyhkeFtuLTJdKmR4W24tMl0pLGR5W24tMl0pO1xuICAgICAgICBUWzBdLnB1c2gobi0xLG4tMSk7XG4gICAgICAgIFRbMV0ucHVzaChuLTIsbi0xKTtcbiAgICAgICAgVFsyXS5wdXNoKDEvZHhbbi0yXSwyL2R4W24tMl0pO1xuICAgICAgICBicmVhaztcbiAgICBjYXNlIFwic3RyaW5nXCI6XG4gICAgICAgIFRbMV1bVFsxXS5sZW5ndGgtMV0gPSAwO1xuICAgICAgICBicmVhaztcbiAgICBkZWZhdWx0OlxuICAgICAgICBiW24tMV0gPSBrbjtcbiAgICAgICAgVFswXS5wdXNoKG4tMSk7XG4gICAgICAgIFRbMV0ucHVzaChuLTEpO1xuICAgICAgICBUWzJdLnB1c2goMSk7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBpZih0eXBlb2YgYlswXSAhPT0gXCJudW1iZXJcIikgYiA9IG51bWVyaWMudHJhbnNwb3NlKGIpO1xuICAgIGVsc2UgYiA9IFtiXTtcbiAgICB2YXIgayA9IEFycmF5KGIubGVuZ3RoKTtcbiAgICBpZih0eXBlb2YgazEgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgZm9yKGk9ay5sZW5ndGgtMTtpIT09LTE7LS1pKSB7XG4gICAgICAgICAgICBrW2ldID0gbnVtZXJpYy5jY3NMVVBTb2x2ZShudW1lcmljLmNjc0xVUChudW1lcmljLmNjc1NjYXR0ZXIoVCkpLGJbaV0pO1xuICAgICAgICAgICAga1tpXVtuLTFdID0ga1tpXVswXTtcbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIGZvcihpPWsubGVuZ3RoLTE7aSE9PS0xOy0taSkge1xuICAgICAgICAgICAga1tpXSA9IG51bWVyaWMuY0xVc29sdmUobnVtZXJpYy5jTFUoVCksYltpXSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYodHlwZW9mIHlbMF0gPT09IFwibnVtYmVyXCIpIGsgPSBrWzBdO1xuICAgIGVsc2UgayA9IG51bWVyaWMudHJhbnNwb3NlKGspO1xuICAgIHJldHVybiBuZXcgbnVtZXJpYy5TcGxpbmUoeCx5LHksayxrKTtcbn1cblxuLy8gOC4gRkZUXG5udW1lcmljLmZmdHBvdzIgPSBmdW5jdGlvbiBmZnRwb3cyKHgseSkge1xuICAgIHZhciBuID0geC5sZW5ndGg7XG4gICAgaWYobiA9PT0gMSkgcmV0dXJuO1xuICAgIHZhciBjb3MgPSBNYXRoLmNvcywgc2luID0gTWF0aC5zaW4sIGksajtcbiAgICB2YXIgeGUgPSBBcnJheShuLzIpLCB5ZSA9IEFycmF5KG4vMiksIHhvID0gQXJyYXkobi8yKSwgeW8gPSBBcnJheShuLzIpO1xuICAgIGogPSBuLzI7XG4gICAgZm9yKGk9bi0xO2khPT0tMTstLWkpIHtcbiAgICAgICAgLS1qO1xuICAgICAgICB4b1tqXSA9IHhbaV07XG4gICAgICAgIHlvW2pdID0geVtpXTtcbiAgICAgICAgLS1pO1xuICAgICAgICB4ZVtqXSA9IHhbaV07XG4gICAgICAgIHllW2pdID0geVtpXTtcbiAgICB9XG4gICAgZmZ0cG93Mih4ZSx5ZSk7XG4gICAgZmZ0cG93Mih4byx5byk7XG4gICAgaiA9IG4vMjtcbiAgICB2YXIgdCxrID0gKC02LjI4MzE4NTMwNzE3OTU4NjQ3NjkyNTI4Njc2NjU1OTAwNTc2ODM5NDMzODc5ODc1MDIxMTY0MTkvbiksY2ksc2k7XG4gICAgZm9yKGk9bi0xO2khPT0tMTstLWkpIHtcbiAgICAgICAgLS1qO1xuICAgICAgICBpZihqID09PSAtMSkgaiA9IG4vMi0xO1xuICAgICAgICB0ID0gayppO1xuICAgICAgICBjaSA9IGNvcyh0KTtcbiAgICAgICAgc2kgPSBzaW4odCk7XG4gICAgICAgIHhbaV0gPSB4ZVtqXSArIGNpKnhvW2pdIC0gc2kqeW9bal07XG4gICAgICAgIHlbaV0gPSB5ZVtqXSArIGNpKnlvW2pdICsgc2kqeG9bal07XG4gICAgfVxufVxubnVtZXJpYy5faWZmdHBvdzIgPSBmdW5jdGlvbiBfaWZmdHBvdzIoeCx5KSB7XG4gICAgdmFyIG4gPSB4Lmxlbmd0aDtcbiAgICBpZihuID09PSAxKSByZXR1cm47XG4gICAgdmFyIGNvcyA9IE1hdGguY29zLCBzaW4gPSBNYXRoLnNpbiwgaSxqO1xuICAgIHZhciB4ZSA9IEFycmF5KG4vMiksIHllID0gQXJyYXkobi8yKSwgeG8gPSBBcnJheShuLzIpLCB5byA9IEFycmF5KG4vMik7XG4gICAgaiA9IG4vMjtcbiAgICBmb3IoaT1uLTE7aSE9PS0xOy0taSkge1xuICAgICAgICAtLWo7XG4gICAgICAgIHhvW2pdID0geFtpXTtcbiAgICAgICAgeW9bal0gPSB5W2ldO1xuICAgICAgICAtLWk7XG4gICAgICAgIHhlW2pdID0geFtpXTtcbiAgICAgICAgeWVbal0gPSB5W2ldO1xuICAgIH1cbiAgICBfaWZmdHBvdzIoeGUseWUpO1xuICAgIF9pZmZ0cG93Mih4byx5byk7XG4gICAgaiA9IG4vMjtcbiAgICB2YXIgdCxrID0gKDYuMjgzMTg1MzA3MTc5NTg2NDc2OTI1Mjg2NzY2NTU5MDA1NzY4Mzk0MzM4Nzk4NzUwMjExNjQxOS9uKSxjaSxzaTtcbiAgICBmb3IoaT1uLTE7aSE9PS0xOy0taSkge1xuICAgICAgICAtLWo7XG4gICAgICAgIGlmKGogPT09IC0xKSBqID0gbi8yLTE7XG4gICAgICAgIHQgPSBrKmk7XG4gICAgICAgIGNpID0gY29zKHQpO1xuICAgICAgICBzaSA9IHNpbih0KTtcbiAgICAgICAgeFtpXSA9IHhlW2pdICsgY2kqeG9bal0gLSBzaSp5b1tqXTtcbiAgICAgICAgeVtpXSA9IHllW2pdICsgY2kqeW9bal0gKyBzaSp4b1tqXTtcbiAgICB9XG59XG5udW1lcmljLmlmZnRwb3cyID0gZnVuY3Rpb24gaWZmdHBvdzIoeCx5KSB7XG4gICAgbnVtZXJpYy5faWZmdHBvdzIoeCx5KTtcbiAgICBudW1lcmljLmRpdmVxKHgseC5sZW5ndGgpO1xuICAgIG51bWVyaWMuZGl2ZXEoeSx5Lmxlbmd0aCk7XG59XG5udW1lcmljLmNvbnZwb3cyID0gZnVuY3Rpb24gY29udnBvdzIoYXgsYXksYngsYnkpIHtcbiAgICBudW1lcmljLmZmdHBvdzIoYXgsYXkpO1xuICAgIG51bWVyaWMuZmZ0cG93MihieCxieSk7XG4gICAgdmFyIGksbiA9IGF4Lmxlbmd0aCxheGksYnhpLGF5aSxieWk7XG4gICAgZm9yKGk9bi0xO2khPT0tMTstLWkpIHtcbiAgICAgICAgYXhpID0gYXhbaV07IGF5aSA9IGF5W2ldOyBieGkgPSBieFtpXTsgYnlpID0gYnlbaV07XG4gICAgICAgIGF4W2ldID0gYXhpKmJ4aS1heWkqYnlpO1xuICAgICAgICBheVtpXSA9IGF4aSpieWkrYXlpKmJ4aTtcbiAgICB9XG4gICAgbnVtZXJpYy5pZmZ0cG93MihheCxheSk7XG59XG5udW1lcmljLlQucHJvdG90eXBlLmZmdCA9IGZ1bmN0aW9uIGZmdCgpIHtcbiAgICB2YXIgeCA9IHRoaXMueCwgeSA9IHRoaXMueTtcbiAgICB2YXIgbiA9IHgubGVuZ3RoLCBsb2cgPSBNYXRoLmxvZywgbG9nMiA9IGxvZygyKSxcbiAgICAgICAgcCA9IE1hdGguY2VpbChsb2coMipuLTEpL2xvZzIpLCBtID0gTWF0aC5wb3coMixwKTtcbiAgICB2YXIgY3ggPSBudW1lcmljLnJlcChbbV0sMCksIGN5ID0gbnVtZXJpYy5yZXAoW21dLDApLCBjb3MgPSBNYXRoLmNvcywgc2luID0gTWF0aC5zaW47XG4gICAgdmFyIGssIGMgPSAoLTMuMTQxNTkyNjUzNTg5NzkzMjM4NDYyNjQzMzgzMjc5NTAyODg0MTk3MTY5Mzk5Mzc1MTA1ODIwL24pLHQ7XG4gICAgdmFyIGEgPSBudW1lcmljLnJlcChbbV0sMCksIGIgPSBudW1lcmljLnJlcChbbV0sMCksbmhhbGYgPSBNYXRoLmZsb29yKG4vMik7XG4gICAgZm9yKGs9MDtrPG47aysrKSBhW2tdID0geFtrXTtcbiAgICBpZih0eXBlb2YgeSAhPT0gXCJ1bmRlZmluZWRcIikgZm9yKGs9MDtrPG47aysrKSBiW2tdID0geVtrXTtcbiAgICBjeFswXSA9IDE7XG4gICAgZm9yKGs9MTtrPD1tLzI7aysrKSB7XG4gICAgICAgIHQgPSBjKmsqaztcbiAgICAgICAgY3hba10gPSBjb3ModCk7XG4gICAgICAgIGN5W2tdID0gc2luKHQpO1xuICAgICAgICBjeFttLWtdID0gY29zKHQpO1xuICAgICAgICBjeVttLWtdID0gc2luKHQpXG4gICAgfVxuICAgIHZhciBYID0gbmV3IG51bWVyaWMuVChhLGIpLCBZID0gbmV3IG51bWVyaWMuVChjeCxjeSk7XG4gICAgWCA9IFgubXVsKFkpO1xuICAgIG51bWVyaWMuY29udnBvdzIoWC54LFgueSxudW1lcmljLmNsb25lKFkueCksbnVtZXJpYy5uZWcoWS55KSk7XG4gICAgWCA9IFgubXVsKFkpO1xuICAgIFgueC5sZW5ndGggPSBuO1xuICAgIFgueS5sZW5ndGggPSBuO1xuICAgIHJldHVybiBYO1xufVxubnVtZXJpYy5ULnByb3RvdHlwZS5pZmZ0ID0gZnVuY3Rpb24gaWZmdCgpIHtcbiAgICB2YXIgeCA9IHRoaXMueCwgeSA9IHRoaXMueTtcbiAgICB2YXIgbiA9IHgubGVuZ3RoLCBsb2cgPSBNYXRoLmxvZywgbG9nMiA9IGxvZygyKSxcbiAgICAgICAgcCA9IE1hdGguY2VpbChsb2coMipuLTEpL2xvZzIpLCBtID0gTWF0aC5wb3coMixwKTtcbiAgICB2YXIgY3ggPSBudW1lcmljLnJlcChbbV0sMCksIGN5ID0gbnVtZXJpYy5yZXAoW21dLDApLCBjb3MgPSBNYXRoLmNvcywgc2luID0gTWF0aC5zaW47XG4gICAgdmFyIGssIGMgPSAoMy4xNDE1OTI2NTM1ODk3OTMyMzg0NjI2NDMzODMyNzk1MDI4ODQxOTcxNjkzOTkzNzUxMDU4MjAvbiksdDtcbiAgICB2YXIgYSA9IG51bWVyaWMucmVwKFttXSwwKSwgYiA9IG51bWVyaWMucmVwKFttXSwwKSxuaGFsZiA9IE1hdGguZmxvb3Iobi8yKTtcbiAgICBmb3Ioaz0wO2s8bjtrKyspIGFba10gPSB4W2tdO1xuICAgIGlmKHR5cGVvZiB5ICE9PSBcInVuZGVmaW5lZFwiKSBmb3Ioaz0wO2s8bjtrKyspIGJba10gPSB5W2tdO1xuICAgIGN4WzBdID0gMTtcbiAgICBmb3Ioaz0xO2s8PW0vMjtrKyspIHtcbiAgICAgICAgdCA9IGMqayprO1xuICAgICAgICBjeFtrXSA9IGNvcyh0KTtcbiAgICAgICAgY3lba10gPSBzaW4odCk7XG4gICAgICAgIGN4W20ta10gPSBjb3ModCk7XG4gICAgICAgIGN5W20ta10gPSBzaW4odClcbiAgICB9XG4gICAgdmFyIFggPSBuZXcgbnVtZXJpYy5UKGEsYiksIFkgPSBuZXcgbnVtZXJpYy5UKGN4LGN5KTtcbiAgICBYID0gWC5tdWwoWSk7XG4gICAgbnVtZXJpYy5jb252cG93MihYLngsWC55LG51bWVyaWMuY2xvbmUoWS54KSxudW1lcmljLm5lZyhZLnkpKTtcbiAgICBYID0gWC5tdWwoWSk7XG4gICAgWC54Lmxlbmd0aCA9IG47XG4gICAgWC55Lmxlbmd0aCA9IG47XG4gICAgcmV0dXJuIFguZGl2KG4pO1xufVxuXG4vLzkuIFVuY29uc3RyYWluZWQgb3B0aW1pemF0aW9uXG5udW1lcmljLmdyYWRpZW50ID0gZnVuY3Rpb24gZ3JhZGllbnQoZix4KSB7XG4gICAgdmFyIG4gPSB4Lmxlbmd0aDtcbiAgICB2YXIgZjAgPSBmKHgpO1xuICAgIGlmKGlzTmFOKGYwKSkgdGhyb3cgbmV3IEVycm9yKCdncmFkaWVudDogZih4KSBpcyBhIE5hTiEnKTtcbiAgICB2YXIgbWF4ID0gTWF0aC5tYXg7XG4gICAgdmFyIGkseDAgPSBudW1lcmljLmNsb25lKHgpLGYxLGYyLCBKID0gQXJyYXkobik7XG4gICAgdmFyIGRpdiA9IG51bWVyaWMuZGl2LCBzdWIgPSBudW1lcmljLnN1YixlcnJlc3Qscm91bmRvZmYsbWF4ID0gTWF0aC5tYXgsZXBzID0gMWUtMyxhYnMgPSBNYXRoLmFicywgbWluID0gTWF0aC5taW47XG4gICAgdmFyIHQwLHQxLHQyLGl0PTAsZDEsZDIsTjtcbiAgICBmb3IoaT0wO2k8bjtpKyspIHtcbiAgICAgICAgdmFyIGggPSBtYXgoMWUtNipmMCwxZS04KTtcbiAgICAgICAgd2hpbGUoMSkge1xuICAgICAgICAgICAgKytpdDtcbiAgICAgICAgICAgIGlmKGl0PjIwKSB7IHRocm93IG5ldyBFcnJvcihcIk51bWVyaWNhbCBncmFkaWVudCBmYWlsc1wiKTsgfVxuICAgICAgICAgICAgeDBbaV0gPSB4W2ldK2g7XG4gICAgICAgICAgICBmMSA9IGYoeDApO1xuICAgICAgICAgICAgeDBbaV0gPSB4W2ldLWg7XG4gICAgICAgICAgICBmMiA9IGYoeDApO1xuICAgICAgICAgICAgeDBbaV0gPSB4W2ldO1xuICAgICAgICAgICAgaWYoaXNOYU4oZjEpIHx8IGlzTmFOKGYyKSkgeyBoLz0xNjsgY29udGludWU7IH1cbiAgICAgICAgICAgIEpbaV0gPSAoZjEtZjIpLygyKmgpO1xuICAgICAgICAgICAgdDAgPSB4W2ldLWg7XG4gICAgICAgICAgICB0MSA9IHhbaV07XG4gICAgICAgICAgICB0MiA9IHhbaV0raDtcbiAgICAgICAgICAgIGQxID0gKGYxLWYwKS9oO1xuICAgICAgICAgICAgZDIgPSAoZjAtZjIpL2g7XG4gICAgICAgICAgICBOID0gbWF4KGFicyhKW2ldKSxhYnMoZjApLGFicyhmMSksYWJzKGYyKSxhYnModDApLGFicyh0MSksYWJzKHQyKSwxZS04KTtcbiAgICAgICAgICAgIGVycmVzdCA9IG1pbihtYXgoYWJzKGQxLUpbaV0pLGFicyhkMi1KW2ldKSxhYnMoZDEtZDIpKS9OLGgvTik7XG4gICAgICAgICAgICBpZihlcnJlc3Q+ZXBzKSB7IGgvPTE2OyB9XG4gICAgICAgICAgICBlbHNlIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gSjtcbn1cblxubnVtZXJpYy51bmNtaW4gPSBmdW5jdGlvbiB1bmNtaW4oZix4MCx0b2wsZ3JhZGllbnQsbWF4aXQsY2FsbGJhY2ssb3B0aW9ucykge1xuICAgIHZhciBncmFkID0gbnVtZXJpYy5ncmFkaWVudDtcbiAgICBpZih0eXBlb2Ygb3B0aW9ucyA9PT0gXCJ1bmRlZmluZWRcIikgeyBvcHRpb25zID0ge307IH1cbiAgICBpZih0eXBlb2YgdG9sID09PSBcInVuZGVmaW5lZFwiKSB7IHRvbCA9IDFlLTg7IH1cbiAgICBpZih0eXBlb2YgZ3JhZGllbnQgPT09IFwidW5kZWZpbmVkXCIpIHsgZ3JhZGllbnQgPSBmdW5jdGlvbih4KSB7IHJldHVybiBncmFkKGYseCk7IH07IH1cbiAgICBpZih0eXBlb2YgbWF4aXQgPT09IFwidW5kZWZpbmVkXCIpIG1heGl0ID0gMTAwMDtcbiAgICB4MCA9IG51bWVyaWMuY2xvbmUoeDApO1xuICAgIHZhciBuID0geDAubGVuZ3RoO1xuICAgIHZhciBmMCA9IGYoeDApLGYxLGRmMDtcbiAgICBpZihpc05hTihmMCkpIHRocm93IG5ldyBFcnJvcigndW5jbWluOiBmKHgwKSBpcyBhIE5hTiEnKTtcbiAgICB2YXIgbWF4ID0gTWF0aC5tYXgsIG5vcm0yID0gbnVtZXJpYy5ub3JtMjtcbiAgICB0b2wgPSBtYXgodG9sLG51bWVyaWMuZXBzaWxvbik7XG4gICAgdmFyIHN0ZXAsZzAsZzEsSDEgPSBvcHRpb25zLkhpbnYgfHwgbnVtZXJpYy5pZGVudGl0eShuKTtcbiAgICB2YXIgZG90ID0gbnVtZXJpYy5kb3QsIGludiA9IG51bWVyaWMuaW52LCBzdWIgPSBudW1lcmljLnN1YiwgYWRkID0gbnVtZXJpYy5hZGQsIHRlbiA9IG51bWVyaWMudGVuc29yLCBkaXYgPSBudW1lcmljLmRpdiwgbXVsID0gbnVtZXJpYy5tdWw7XG4gICAgdmFyIGFsbCA9IG51bWVyaWMuYWxsLCBpc2Zpbml0ZSA9IG51bWVyaWMuaXNGaW5pdGUsIG5lZyA9IG51bWVyaWMubmVnO1xuICAgIHZhciBpdD0wLGkscyx4MSx5LEh5LEhzLHlzLGkwLHQsbnN0ZXAsdDEsdDI7XG4gICAgdmFyIG1zZyA9IFwiXCI7XG4gICAgZzAgPSBncmFkaWVudCh4MCk7XG4gICAgd2hpbGUoaXQ8bWF4aXQpIHtcbiAgICAgICAgaWYodHlwZW9mIGNhbGxiYWNrID09PSBcImZ1bmN0aW9uXCIpIHsgaWYoY2FsbGJhY2soaXQseDAsZjAsZzAsSDEpKSB7IG1zZyA9IFwiQ2FsbGJhY2sgcmV0dXJuZWQgdHJ1ZVwiOyBicmVhazsgfSB9XG4gICAgICAgIGlmKCFhbGwoaXNmaW5pdGUoZzApKSkgeyBtc2cgPSBcIkdyYWRpZW50IGhhcyBJbmZpbml0eSBvciBOYU5cIjsgYnJlYWs7IH1cbiAgICAgICAgc3RlcCA9IG5lZyhkb3QoSDEsZzApKTtcbiAgICAgICAgaWYoIWFsbChpc2Zpbml0ZShzdGVwKSkpIHsgbXNnID0gXCJTZWFyY2ggZGlyZWN0aW9uIGhhcyBJbmZpbml0eSBvciBOYU5cIjsgYnJlYWs7IH1cbiAgICAgICAgbnN0ZXAgPSBub3JtMihzdGVwKTtcbiAgICAgICAgaWYobnN0ZXAgPCB0b2wpIHsgbXNnPVwiTmV3dG9uIHN0ZXAgc21hbGxlciB0aGFuIHRvbFwiOyBicmVhazsgfVxuICAgICAgICB0ID0gMTtcbiAgICAgICAgZGYwID0gZG90KGcwLHN0ZXApO1xuICAgICAgICAvLyBsaW5lIHNlYXJjaFxuICAgICAgICB4MSA9IHgwO1xuICAgICAgICB3aGlsZShpdCA8IG1heGl0KSB7XG4gICAgICAgICAgICBpZih0Km5zdGVwIDwgdG9sKSB7IGJyZWFrOyB9XG4gICAgICAgICAgICBzID0gbXVsKHN0ZXAsdCk7XG4gICAgICAgICAgICB4MSA9IGFkZCh4MCxzKTtcbiAgICAgICAgICAgIGYxID0gZih4MSk7XG4gICAgICAgICAgICBpZihmMS1mMCA+PSAwLjEqdCpkZjAgfHwgaXNOYU4oZjEpKSB7XG4gICAgICAgICAgICAgICAgdCAqPSAwLjU7XG4gICAgICAgICAgICAgICAgKytpdDtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGlmKHQqbnN0ZXAgPCB0b2wpIHsgbXNnID0gXCJMaW5lIHNlYXJjaCBzdGVwIHNpemUgc21hbGxlciB0aGFuIHRvbFwiOyBicmVhazsgfVxuICAgICAgICBpZihpdCA9PT0gbWF4aXQpIHsgbXNnID0gXCJtYXhpdCByZWFjaGVkIGR1cmluZyBsaW5lIHNlYXJjaFwiOyBicmVhazsgfVxuICAgICAgICBnMSA9IGdyYWRpZW50KHgxKTtcbiAgICAgICAgeSA9IHN1YihnMSxnMCk7XG4gICAgICAgIHlzID0gZG90KHkscyk7XG4gICAgICAgIEh5ID0gZG90KEgxLHkpO1xuICAgICAgICBIMSA9IHN1YihhZGQoSDEsXG4gICAgICAgICAgICAgICAgbXVsKFxuICAgICAgICAgICAgICAgICAgICAgICAgKHlzK2RvdCh5LEh5KSkvKHlzKnlzKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRlbihzLHMpICAgICkpLFxuICAgICAgICAgICAgICAgIGRpdihhZGQodGVuKEh5LHMpLHRlbihzLEh5KSkseXMpKTtcbiAgICAgICAgeDAgPSB4MTtcbiAgICAgICAgZjAgPSBmMTtcbiAgICAgICAgZzAgPSBnMTtcbiAgICAgICAgKytpdDtcbiAgICB9XG4gICAgcmV0dXJuIHtzb2x1dGlvbjogeDAsIGY6IGYwLCBncmFkaWVudDogZzAsIGludkhlc3NpYW46IEgxLCBpdGVyYXRpb25zOml0LCBtZXNzYWdlOiBtc2d9O1xufVxuXG4vLyAxMC4gT2RlIHNvbHZlciAoRG9ybWFuZC1QcmluY2UpXG5udW1lcmljLkRvcHJpID0gZnVuY3Rpb24gRG9wcmkoeCx5LGYseW1pZCxpdGVyYXRpb25zLG1zZyxldmVudHMpIHtcbiAgICB0aGlzLnggPSB4O1xuICAgIHRoaXMueSA9IHk7XG4gICAgdGhpcy5mID0gZjtcbiAgICB0aGlzLnltaWQgPSB5bWlkO1xuICAgIHRoaXMuaXRlcmF0aW9ucyA9IGl0ZXJhdGlvbnM7XG4gICAgdGhpcy5ldmVudHMgPSBldmVudHM7XG4gICAgdGhpcy5tZXNzYWdlID0gbXNnO1xufVxubnVtZXJpYy5Eb3ByaS5wcm90b3R5cGUuX2F0ID0gZnVuY3Rpb24gX2F0KHhpLGopIHtcbiAgICBmdW5jdGlvbiBzcXIoeCkgeyByZXR1cm4geCp4OyB9XG4gICAgdmFyIHNvbCA9IHRoaXM7XG4gICAgdmFyIHhzID0gc29sLng7XG4gICAgdmFyIHlzID0gc29sLnk7XG4gICAgdmFyIGsxID0gc29sLmY7XG4gICAgdmFyIHltaWQgPSBzb2wueW1pZDtcbiAgICB2YXIgbiA9IHhzLmxlbmd0aDtcbiAgICB2YXIgeDAseDEseGgseTAseTEseWgseGk7XG4gICAgdmFyIGZsb29yID0gTWF0aC5mbG9vcixoO1xuICAgIHZhciBjID0gMC41O1xuICAgIHZhciBhZGQgPSBudW1lcmljLmFkZCwgbXVsID0gbnVtZXJpYy5tdWwsc3ViID0gbnVtZXJpYy5zdWIsIHAscSx3O1xuICAgIHgwID0geHNbal07XG4gICAgeDEgPSB4c1tqKzFdO1xuICAgIHkwID0geXNbal07XG4gICAgeTEgPSB5c1tqKzFdO1xuICAgIGggID0geDEteDA7XG4gICAgeGggPSB4MCtjKmg7XG4gICAgeWggPSB5bWlkW2pdO1xuICAgIHAgPSBzdWIoazFbaiAgXSxtdWwoeTAsMS8oeDAteGgpKzIvKHgwLXgxKSkpO1xuICAgIHEgPSBzdWIoazFbaisxXSxtdWwoeTEsMS8oeDEteGgpKzIvKHgxLXgwKSkpO1xuICAgIHcgPSBbc3FyKHhpIC0geDEpICogKHhpIC0geGgpIC8gc3FyKHgwIC0geDEpIC8gKHgwIC0geGgpLFxuICAgICAgICAgc3FyKHhpIC0geDApICogc3FyKHhpIC0geDEpIC8gc3FyKHgwIC0geGgpIC8gc3FyKHgxIC0geGgpLFxuICAgICAgICAgc3FyKHhpIC0geDApICogKHhpIC0geGgpIC8gc3FyKHgxIC0geDApIC8gKHgxIC0geGgpLFxuICAgICAgICAgKHhpIC0geDApICogc3FyKHhpIC0geDEpICogKHhpIC0geGgpIC8gc3FyKHgwLXgxKSAvICh4MCAtIHhoKSxcbiAgICAgICAgICh4aSAtIHgxKSAqIHNxcih4aSAtIHgwKSAqICh4aSAtIHhoKSAvIHNxcih4MC14MSkgLyAoeDEgLSB4aCldO1xuICAgIHJldHVybiBhZGQoYWRkKGFkZChhZGQobXVsKHkwLHdbMF0pLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgbXVsKHloLHdbMV0pKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIG11bCh5MSx3WzJdKSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBtdWwoIHAsd1szXSkpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgbXVsKCBxLHdbNF0pKTtcbn1cbm51bWVyaWMuRG9wcmkucHJvdG90eXBlLmF0ID0gZnVuY3Rpb24gYXQoeCkge1xuICAgIHZhciBpLGosayxmbG9vciA9IE1hdGguZmxvb3I7XG4gICAgaWYodHlwZW9mIHggIT09IFwibnVtYmVyXCIpIHtcbiAgICAgICAgdmFyIG4gPSB4Lmxlbmd0aCwgcmV0ID0gQXJyYXkobik7XG4gICAgICAgIGZvcihpPW4tMTtpIT09LTE7LS1pKSB7XG4gICAgICAgICAgICByZXRbaV0gPSB0aGlzLmF0KHhbaV0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfVxuICAgIHZhciB4MCA9IHRoaXMueDtcbiAgICBpID0gMDsgaiA9IHgwLmxlbmd0aC0xO1xuICAgIHdoaWxlKGotaT4xKSB7XG4gICAgICAgIGsgPSBmbG9vcigwLjUqKGkraikpO1xuICAgICAgICBpZih4MFtrXSA8PSB4KSBpID0gaztcbiAgICAgICAgZWxzZSBqID0gaztcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX2F0KHgsaSk7XG59XG5cbm51bWVyaWMuZG9wcmkgPSBmdW5jdGlvbiBkb3ByaSh4MCx4MSx5MCxmLHRvbCxtYXhpdCxldmVudCkge1xuICAgIGlmKHR5cGVvZiB0b2wgPT09IFwidW5kZWZpbmVkXCIpIHsgdG9sID0gMWUtNjsgfVxuICAgIGlmKHR5cGVvZiBtYXhpdCA9PT0gXCJ1bmRlZmluZWRcIikgeyBtYXhpdCA9IDEwMDA7IH1cbiAgICB2YXIgeHMgPSBbeDBdLCB5cyA9IFt5MF0sIGsxID0gW2YoeDAseTApXSwgazIsazMsazQsazUsazYsazcsIHltaWQgPSBbXTtcbiAgICB2YXIgQTIgPSAxLzU7XG4gICAgdmFyIEEzID0gWzMvNDAsOS80MF07XG4gICAgdmFyIEE0ID0gWzQ0LzQ1LC01Ni8xNSwzMi85XTtcbiAgICB2YXIgQTUgPSBbMTkzNzIvNjU2MSwtMjUzNjAvMjE4Nyw2NDQ0OC82NTYxLC0yMTIvNzI5XTtcbiAgICB2YXIgQTYgPSBbOTAxNy8zMTY4LC0zNTUvMzMsNDY3MzIvNTI0Nyw0OS8xNzYsLTUxMDMvMTg2NTZdO1xuICAgIHZhciBiID0gWzM1LzM4NCwwLDUwMC8xMTEzLDEyNS8xOTIsLTIxODcvNjc4NCwxMS84NF07XG4gICAgdmFyIGJtID0gWzAuNSo2MDI1MTkyNzQzLzMwMDg1NTUzMTUyLFxuICAgICAgICAgICAgICAwLFxuICAgICAgICAgICAgICAwLjUqNTEyNTIyOTI5MjUvNjU0MDA4MjE1OTgsXG4gICAgICAgICAgICAgIDAuNSotMjY5MTg2ODkyNS80NTEyODMyOTcyOCxcbiAgICAgICAgICAgICAgMC41KjE4Nzk0MDM3MjA2Ny8xNTk0NTM0MzE3MDU2LFxuICAgICAgICAgICAgICAwLjUqLTE3NzYwOTQzMzEvMTk3NDM2NDQyNTYsXG4gICAgICAgICAgICAgIDAuNSoxMTIzNzA5OS8yMzUwNDMzODRdO1xuICAgIHZhciBjID0gWzEvNSwzLzEwLDQvNSw4LzksMSwxXTtcbiAgICB2YXIgZSA9IFstNzEvNTc2MDAsMCw3MS8xNjY5NSwtNzEvMTkyMCwxNzI1My8zMzkyMDAsLTIyLzUyNSwxLzQwXTtcbiAgICB2YXIgaSA9IDAsZXIsajtcbiAgICB2YXIgaCA9ICh4MS14MCkvMTA7XG4gICAgdmFyIGl0ID0gMDtcbiAgICB2YXIgYWRkID0gbnVtZXJpYy5hZGQsIG11bCA9IG51bWVyaWMubXVsLCB5MSxlcmluZjtcbiAgICB2YXIgbWF4ID0gTWF0aC5tYXgsIG1pbiA9IE1hdGgubWluLCBhYnMgPSBNYXRoLmFicywgbm9ybWluZiA9IG51bWVyaWMubm9ybWluZixwb3cgPSBNYXRoLnBvdztcbiAgICB2YXIgYW55ID0gbnVtZXJpYy5hbnksIGx0ID0gbnVtZXJpYy5sdCwgYW5kID0gbnVtZXJpYy5hbmQsIHN1YiA9IG51bWVyaWMuc3ViO1xuICAgIHZhciBlMCwgZTEsIGV2O1xuICAgIHZhciByZXQgPSBuZXcgbnVtZXJpYy5Eb3ByaSh4cyx5cyxrMSx5bWlkLC0xLFwiXCIpO1xuICAgIGlmKHR5cGVvZiBldmVudCA9PT0gXCJmdW5jdGlvblwiKSBlMCA9IGV2ZW50KHgwLHkwKTtcbiAgICB3aGlsZSh4MDx4MSAmJiBpdDxtYXhpdCkge1xuICAgICAgICArK2l0O1xuICAgICAgICBpZih4MCtoPngxKSBoID0geDEteDA7XG4gICAgICAgIGsyID0gZih4MCtjWzBdKmgsICAgICAgICAgICAgICAgIGFkZCh5MCxtdWwoICAgQTIqaCxrMVtpXSkpKTtcbiAgICAgICAgazMgPSBmKHgwK2NbMV0qaCwgICAgICAgICAgICBhZGQoYWRkKHkwLG11bChBM1swXSpoLGsxW2ldKSksbXVsKEEzWzFdKmgsazIpKSk7XG4gICAgICAgIGs0ID0gZih4MCtjWzJdKmgsICAgICAgICBhZGQoYWRkKGFkZCh5MCxtdWwoQTRbMF0qaCxrMVtpXSkpLG11bChBNFsxXSpoLGsyKSksbXVsKEE0WzJdKmgsazMpKSk7XG4gICAgICAgIGs1ID0gZih4MCtjWzNdKmgsICAgIGFkZChhZGQoYWRkKGFkZCh5MCxtdWwoQTVbMF0qaCxrMVtpXSkpLG11bChBNVsxXSpoLGsyKSksbXVsKEE1WzJdKmgsazMpKSxtdWwoQTVbM10qaCxrNCkpKTtcbiAgICAgICAgazYgPSBmKHgwK2NbNF0qaCxhZGQoYWRkKGFkZChhZGQoYWRkKHkwLG11bChBNlswXSpoLGsxW2ldKSksbXVsKEE2WzFdKmgsazIpKSxtdWwoQTZbMl0qaCxrMykpLG11bChBNlszXSpoLGs0KSksbXVsKEE2WzRdKmgsazUpKSk7XG4gICAgICAgIHkxID0gYWRkKGFkZChhZGQoYWRkKGFkZCh5MCxtdWwoazFbaV0saCpiWzBdKSksbXVsKGszLGgqYlsyXSkpLG11bChrNCxoKmJbM10pKSxtdWwoazUsaCpiWzRdKSksbXVsKGs2LGgqYls1XSkpO1xuICAgICAgICBrNyA9IGYoeDAraCx5MSk7XG4gICAgICAgIGVyID0gYWRkKGFkZChhZGQoYWRkKGFkZChtdWwoazFbaV0saCplWzBdKSxtdWwoazMsaCplWzJdKSksbXVsKGs0LGgqZVszXSkpLG11bChrNSxoKmVbNF0pKSxtdWwoazYsaCplWzVdKSksbXVsKGs3LGgqZVs2XSkpO1xuICAgICAgICBpZih0eXBlb2YgZXIgPT09IFwibnVtYmVyXCIpIGVyaW5mID0gYWJzKGVyKTtcbiAgICAgICAgZWxzZSBlcmluZiA9IG5vcm1pbmYoZXIpO1xuICAgICAgICBpZihlcmluZiA+IHRvbCkgeyAvLyByZWplY3RcbiAgICAgICAgICAgIGggPSAwLjIqaCpwb3codG9sL2VyaW5mLDAuMjUpO1xuICAgICAgICAgICAgaWYoeDAraCA9PT0geDApIHtcbiAgICAgICAgICAgICAgICByZXQubXNnID0gXCJTdGVwIHNpemUgYmVjYW1lIHRvbyBzbWFsbFwiO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgeW1pZFtpXSA9IGFkZChhZGQoYWRkKGFkZChhZGQoYWRkKHkwLFxuICAgICAgICAgICAgICAgIG11bChrMVtpXSxoKmJtWzBdKSksXG4gICAgICAgICAgICAgICAgbXVsKGszICAgLGgqYm1bMl0pKSxcbiAgICAgICAgICAgICAgICBtdWwoazQgICAsaCpibVszXSkpLFxuICAgICAgICAgICAgICAgIG11bChrNSAgICxoKmJtWzRdKSksXG4gICAgICAgICAgICAgICAgbXVsKGs2ICAgLGgqYm1bNV0pKSxcbiAgICAgICAgICAgICAgICBtdWwoazcgICAsaCpibVs2XSkpO1xuICAgICAgICArK2k7XG4gICAgICAgIHhzW2ldID0geDAraDtcbiAgICAgICAgeXNbaV0gPSB5MTtcbiAgICAgICAgazFbaV0gPSBrNztcbiAgICAgICAgaWYodHlwZW9mIGV2ZW50ID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHZhciB5aSx4bCA9IHgwLHhyID0geDArMC41KmgseGk7XG4gICAgICAgICAgICBlMSA9IGV2ZW50KHhyLHltaWRbaS0xXSk7XG4gICAgICAgICAgICBldiA9IGFuZChsdChlMCwwKSxsdCgwLGUxKSk7XG4gICAgICAgICAgICBpZighYW55KGV2KSkgeyB4bCA9IHhyOyB4ciA9IHgwK2g7IGUwID0gZTE7IGUxID0gZXZlbnQoeHIseTEpOyBldiA9IGFuZChsdChlMCwwKSxsdCgwLGUxKSk7IH1cbiAgICAgICAgICAgIGlmKGFueShldikpIHtcbiAgICAgICAgICAgICAgICB2YXIgeGMsIHljLCBlbixlaTtcbiAgICAgICAgICAgICAgICB2YXIgc2lkZT0wLCBzbCA9IDEuMCwgc3IgPSAxLjA7XG4gICAgICAgICAgICAgICAgd2hpbGUoMSkge1xuICAgICAgICAgICAgICAgICAgICBpZih0eXBlb2YgZTAgPT09IFwibnVtYmVyXCIpIHhpID0gKHNyKmUxKnhsLXNsKmUwKnhyKS8oc3IqZTEtc2wqZTApO1xuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHhpID0geHI7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3Ioaj1lMC5sZW5ndGgtMTtqIT09LTE7LS1qKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYoZTBbal08MCAmJiBlMVtqXT4wKSB4aSA9IG1pbih4aSwoc3IqZTFbal0qeGwtc2wqZTBbal0qeHIpLyhzciplMVtqXS1zbCplMFtqXSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmKHhpIDw9IHhsIHx8IHhpID49IHhyKSBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgeWkgPSByZXQuX2F0KHhpLCBpLTEpO1xuICAgICAgICAgICAgICAgICAgICBlaSA9IGV2ZW50KHhpLHlpKTtcbiAgICAgICAgICAgICAgICAgICAgZW4gPSBhbmQobHQoZTAsMCksbHQoMCxlaSkpO1xuICAgICAgICAgICAgICAgICAgICBpZihhbnkoZW4pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB4ciA9IHhpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZTEgPSBlaTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGV2ID0gZW47XG4gICAgICAgICAgICAgICAgICAgICAgICBzciA9IDEuMDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmKHNpZGUgPT09IC0xKSBzbCAqPSAwLjU7XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHNsID0gMS4wO1xuICAgICAgICAgICAgICAgICAgICAgICAgc2lkZSA9IC0xO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgeGwgPSB4aTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGUwID0gZWk7XG4gICAgICAgICAgICAgICAgICAgICAgICBzbCA9IDEuMDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmKHNpZGUgPT09IDEpIHNyICo9IDAuNTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Ugc3IgPSAxLjA7XG4gICAgICAgICAgICAgICAgICAgICAgICBzaWRlID0gMTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB5MSA9IHJldC5fYXQoMC41Kih4MCt4aSksaS0xKTtcbiAgICAgICAgICAgICAgICByZXQuZltpXSA9IGYoeGkseWkpO1xuICAgICAgICAgICAgICAgIHJldC54W2ldID0geGk7XG4gICAgICAgICAgICAgICAgcmV0LnlbaV0gPSB5aTtcbiAgICAgICAgICAgICAgICByZXQueW1pZFtpLTFdID0geTE7XG4gICAgICAgICAgICAgICAgcmV0LmV2ZW50cyA9IGV2O1xuICAgICAgICAgICAgICAgIHJldC5pdGVyYXRpb25zID0gaXQ7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJldDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB4MCArPSBoO1xuICAgICAgICB5MCA9IHkxO1xuICAgICAgICBlMCA9IGUxO1xuICAgICAgICBoID0gbWluKDAuOCpoKnBvdyh0b2wvZXJpbmYsMC4yNSksNCpoKTtcbiAgICB9XG4gICAgcmV0Lml0ZXJhdGlvbnMgPSBpdDtcbiAgICByZXR1cm4gcmV0O1xufVxuXG4vLyAxMS4gQXggPSBiXG5udW1lcmljLkxVID0gZnVuY3Rpb24oQSwgZmFzdCkge1xuICBmYXN0ID0gZmFzdCB8fCBmYWxzZTtcblxuICB2YXIgYWJzID0gTWF0aC5hYnM7XG4gIHZhciBpLCBqLCBrLCBhYnNBamssIEFraywgQWssIFBrLCBBaTtcbiAgdmFyIG1heDtcbiAgdmFyIG4gPSBBLmxlbmd0aCwgbjEgPSBuLTE7XG4gIHZhciBQID0gbmV3IEFycmF5KG4pO1xuICBpZighZmFzdCkgQSA9IG51bWVyaWMuY2xvbmUoQSk7XG5cbiAgZm9yIChrID0gMDsgayA8IG47ICsraykge1xuICAgIFBrID0gaztcbiAgICBBayA9IEFba107XG4gICAgbWF4ID0gYWJzKEFrW2tdKTtcbiAgICBmb3IgKGogPSBrICsgMTsgaiA8IG47ICsraikge1xuICAgICAgYWJzQWprID0gYWJzKEFbal1ba10pO1xuICAgICAgaWYgKG1heCA8IGFic0Fqaykge1xuICAgICAgICBtYXggPSBhYnNBams7XG4gICAgICAgIFBrID0gajtcbiAgICAgIH1cbiAgICB9XG4gICAgUFtrXSA9IFBrO1xuXG4gICAgaWYgKFBrICE9IGspIHtcbiAgICAgIEFba10gPSBBW1BrXTtcbiAgICAgIEFbUGtdID0gQWs7XG4gICAgICBBayA9IEFba107XG4gICAgfVxuXG4gICAgQWtrID0gQWtba107XG5cbiAgICBmb3IgKGkgPSBrICsgMTsgaSA8IG47ICsraSkge1xuICAgICAgQVtpXVtrXSAvPSBBa2s7XG4gICAgfVxuXG4gICAgZm9yIChpID0gayArIDE7IGkgPCBuOyArK2kpIHtcbiAgICAgIEFpID0gQVtpXTtcbiAgICAgIGZvciAoaiA9IGsgKyAxOyBqIDwgbjE7ICsraikge1xuICAgICAgICBBaVtqXSAtPSBBaVtrXSAqIEFrW2pdO1xuICAgICAgICArK2o7XG4gICAgICAgIEFpW2pdIC09IEFpW2tdICogQWtbal07XG4gICAgICB9XG4gICAgICBpZihqPT09bjEpIEFpW2pdIC09IEFpW2tdICogQWtbal07XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBMVTogQSxcbiAgICBQOiAgUFxuICB9O1xufVxuXG5udW1lcmljLkxVc29sdmUgPSBmdW5jdGlvbiBMVXNvbHZlKExVUCwgYikge1xuICB2YXIgaSwgajtcbiAgdmFyIExVID0gTFVQLkxVO1xuICB2YXIgbiAgID0gTFUubGVuZ3RoO1xuICB2YXIgeCA9IG51bWVyaWMuY2xvbmUoYik7XG4gIHZhciBQICAgPSBMVVAuUDtcbiAgdmFyIFBpLCBMVWksIExVaWksIHRtcDtcblxuICBmb3IgKGk9bi0xO2khPT0tMTstLWkpIHhbaV0gPSBiW2ldO1xuICBmb3IgKGkgPSAwOyBpIDwgbjsgKytpKSB7XG4gICAgUGkgPSBQW2ldO1xuICAgIGlmIChQW2ldICE9PSBpKSB7XG4gICAgICB0bXAgPSB4W2ldO1xuICAgICAgeFtpXSA9IHhbUGldO1xuICAgICAgeFtQaV0gPSB0bXA7XG4gICAgfVxuXG4gICAgTFVpID0gTFVbaV07XG4gICAgZm9yIChqID0gMDsgaiA8IGk7ICsraikge1xuICAgICAgeFtpXSAtPSB4W2pdICogTFVpW2pdO1xuICAgIH1cbiAgfVxuXG4gIGZvciAoaSA9IG4gLSAxOyBpID49IDA7IC0taSkge1xuICAgIExVaSA9IExVW2ldO1xuICAgIGZvciAoaiA9IGkgKyAxOyBqIDwgbjsgKytqKSB7XG4gICAgICB4W2ldIC09IHhbal0gKiBMVWlbal07XG4gICAgfVxuXG4gICAgeFtpXSAvPSBMVWlbaV07XG4gIH1cblxuICByZXR1cm4geDtcbn1cblxubnVtZXJpYy5zb2x2ZSA9IGZ1bmN0aW9uIHNvbHZlKEEsYixmYXN0KSB7IHJldHVybiBudW1lcmljLkxVc29sdmUobnVtZXJpYy5MVShBLGZhc3QpLCBiKTsgfVxuXG4vLyAxMi4gTGluZWFyIHByb2dyYW1taW5nXG5udW1lcmljLmVjaGVsb25pemUgPSBmdW5jdGlvbiBlY2hlbG9uaXplKEEpIHtcbiAgICB2YXIgcyA9IG51bWVyaWMuZGltKEEpLCBtID0gc1swXSwgbiA9IHNbMV07XG4gICAgdmFyIEkgPSBudW1lcmljLmlkZW50aXR5KG0pO1xuICAgIHZhciBQID0gQXJyYXkobSk7XG4gICAgdmFyIGksaixrLGwsQWksSWksWixhO1xuICAgIHZhciBhYnMgPSBNYXRoLmFicztcbiAgICB2YXIgZGl2ZXEgPSBudW1lcmljLmRpdmVxO1xuICAgIEEgPSBudW1lcmljLmNsb25lKEEpO1xuICAgIGZvcihpPTA7aTxtOysraSkge1xuICAgICAgICBrID0gMDtcbiAgICAgICAgQWkgPSBBW2ldO1xuICAgICAgICBJaSA9IElbaV07XG4gICAgICAgIGZvcihqPTE7ajxuOysraikgaWYoYWJzKEFpW2tdKTxhYnMoQWlbal0pKSBrPWo7XG4gICAgICAgIFBbaV0gPSBrO1xuICAgICAgICBkaXZlcShJaSxBaVtrXSk7XG4gICAgICAgIGRpdmVxKEFpLEFpW2tdKTtcbiAgICAgICAgZm9yKGo9MDtqPG07KytqKSBpZihqIT09aSkge1xuICAgICAgICAgICAgWiA9IEFbal07IGEgPSBaW2tdO1xuICAgICAgICAgICAgZm9yKGw9bi0xO2whPT0tMTstLWwpIFpbbF0gLT0gQWlbbF0qYTtcbiAgICAgICAgICAgIFogPSBJW2pdO1xuICAgICAgICAgICAgZm9yKGw9bS0xO2whPT0tMTstLWwpIFpbbF0gLT0gSWlbbF0qYTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4ge0k6SSwgQTpBLCBQOlB9O1xufVxuXG5udW1lcmljLl9fc29sdmVMUCA9IGZ1bmN0aW9uIF9fc29sdmVMUChjLEEsYix0b2wsbWF4aXQseCxmbGFnKSB7XG4gICAgdmFyIHN1bSA9IG51bWVyaWMuc3VtLCBsb2cgPSBudW1lcmljLmxvZywgbXVsID0gbnVtZXJpYy5tdWwsIHN1YiA9IG51bWVyaWMuc3ViLCBkb3QgPSBudW1lcmljLmRvdCwgZGl2ID0gbnVtZXJpYy5kaXYsIGFkZCA9IG51bWVyaWMuYWRkO1xuICAgIHZhciBtID0gYy5sZW5ndGgsIG4gPSBiLmxlbmd0aCx5O1xuICAgIHZhciB1bmJvdW5kZWQgPSBmYWxzZSwgY2IsaTA9MDtcbiAgICB2YXIgYWxwaGEgPSAxLjA7XG4gICAgdmFyIGYwLGRmMCxBVCA9IG51bWVyaWMudHJhbnNwb3NlKEEpLCBzdmQgPSBudW1lcmljLnN2ZCx0cmFuc3Bvc2UgPSBudW1lcmljLnRyYW5zcG9zZSxsZXEgPSBudW1lcmljLmxlcSwgc3FydCA9IE1hdGguc3FydCwgYWJzID0gTWF0aC5hYnM7XG4gICAgdmFyIG11bGVxID0gbnVtZXJpYy5tdWxlcTtcbiAgICB2YXIgbm9ybSA9IG51bWVyaWMubm9ybWluZiwgYW55ID0gbnVtZXJpYy5hbnksbWluID0gTWF0aC5taW47XG4gICAgdmFyIGFsbCA9IG51bWVyaWMuYWxsLCBndCA9IG51bWVyaWMuZ3Q7XG4gICAgdmFyIHAgPSBBcnJheShtKSwgQTAgPSBBcnJheShuKSxlPW51bWVyaWMucmVwKFtuXSwxKSwgSDtcbiAgICB2YXIgc29sdmUgPSBudW1lcmljLnNvbHZlLCB6ID0gc3ViKGIsZG90KEEseCkpLGNvdW50O1xuICAgIHZhciBkb3RjYyA9IGRvdChjLGMpO1xuICAgIHZhciBnO1xuICAgIGZvcihjb3VudD1pMDtjb3VudDxtYXhpdDsrK2NvdW50KSB7XG4gICAgICAgIHZhciBpLGosZDtcbiAgICAgICAgZm9yKGk9bi0xO2khPT0tMTstLWkpIEEwW2ldID0gZGl2KEFbaV0seltpXSk7XG4gICAgICAgIHZhciBBMSA9IHRyYW5zcG9zZShBMCk7XG4gICAgICAgIGZvcihpPW0tMTtpIT09LTE7LS1pKSBwW2ldID0gKC8qeFtpXSsqL3N1bShBMVtpXSkpO1xuICAgICAgICBhbHBoYSA9IDAuMjUqYWJzKGRvdGNjL2RvdChjLHApKTtcbiAgICAgICAgdmFyIGExID0gMTAwKnNxcnQoZG90Y2MvZG90KHAscCkpO1xuICAgICAgICBpZighaXNGaW5pdGUoYWxwaGEpIHx8IGFscGhhPmExKSBhbHBoYSA9IGExO1xuICAgICAgICBnID0gYWRkKGMsbXVsKGFscGhhLHApKTtcbiAgICAgICAgSCA9IGRvdChBMSxBMCk7XG4gICAgICAgIGZvcihpPW0tMTtpIT09LTE7LS1pKSBIW2ldW2ldICs9IDE7XG4gICAgICAgIGQgPSBzb2x2ZShILGRpdihnLGFscGhhKSx0cnVlKTtcbiAgICAgICAgdmFyIHQwID0gZGl2KHosZG90KEEsZCkpO1xuICAgICAgICB2YXIgdCA9IDEuMDtcbiAgICAgICAgZm9yKGk9bi0xO2khPT0tMTstLWkpIGlmKHQwW2ldPDApIHQgPSBtaW4odCwtMC45OTkqdDBbaV0pO1xuICAgICAgICB5ID0gc3ViKHgsbXVsKGQsdCkpO1xuICAgICAgICB6ID0gc3ViKGIsZG90KEEseSkpO1xuICAgICAgICBpZighYWxsKGd0KHosMCkpKSByZXR1cm4geyBzb2x1dGlvbjogeCwgbWVzc2FnZTogXCJcIiwgaXRlcmF0aW9uczogY291bnQgfTtcbiAgICAgICAgeCA9IHk7XG4gICAgICAgIGlmKGFscGhhPHRvbCkgcmV0dXJuIHsgc29sdXRpb246IHksIG1lc3NhZ2U6IFwiXCIsIGl0ZXJhdGlvbnM6IGNvdW50IH07XG4gICAgICAgIGlmKGZsYWcpIHtcbiAgICAgICAgICAgIHZhciBzID0gZG90KGMsZyksIEFnID0gZG90KEEsZyk7XG4gICAgICAgICAgICB1bmJvdW5kZWQgPSB0cnVlO1xuICAgICAgICAgICAgZm9yKGk9bi0xO2khPT0tMTstLWkpIGlmKHMqQWdbaV08MCkgeyB1bmJvdW5kZWQgPSBmYWxzZTsgYnJlYWs7IH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmKHhbbS0xXT49MCkgdW5ib3VuZGVkID0gZmFsc2U7XG4gICAgICAgICAgICBlbHNlIHVuYm91bmRlZCA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYodW5ib3VuZGVkKSByZXR1cm4geyBzb2x1dGlvbjogeSwgbWVzc2FnZTogXCJVbmJvdW5kZWRcIiwgaXRlcmF0aW9uczogY291bnQgfTtcbiAgICB9XG4gICAgcmV0dXJuIHsgc29sdXRpb246IHgsIG1lc3NhZ2U6IFwibWF4aW11bSBpdGVyYXRpb24gY291bnQgZXhjZWVkZWRcIiwgaXRlcmF0aW9uczpjb3VudCB9O1xufVxuXG5udW1lcmljLl9zb2x2ZUxQID0gZnVuY3Rpb24gX3NvbHZlTFAoYyxBLGIsdG9sLG1heGl0KSB7XG4gICAgdmFyIG0gPSBjLmxlbmd0aCwgbiA9IGIubGVuZ3RoLHk7XG4gICAgdmFyIHN1bSA9IG51bWVyaWMuc3VtLCBsb2cgPSBudW1lcmljLmxvZywgbXVsID0gbnVtZXJpYy5tdWwsIHN1YiA9IG51bWVyaWMuc3ViLCBkb3QgPSBudW1lcmljLmRvdCwgZGl2ID0gbnVtZXJpYy5kaXYsIGFkZCA9IG51bWVyaWMuYWRkO1xuICAgIHZhciBjMCA9IG51bWVyaWMucmVwKFttXSwwKS5jb25jYXQoWzFdKTtcbiAgICB2YXIgSiA9IG51bWVyaWMucmVwKFtuLDFdLC0xKTtcbiAgICB2YXIgQTAgPSBudW1lcmljLmJsb2NrTWF0cml4KFtbQSAgICAgICAgICAgICAgICAgICAsICAgSiAgXV0pO1xuICAgIHZhciBiMCA9IGI7XG4gICAgdmFyIHkgPSBudW1lcmljLnJlcChbbV0sMCkuY29uY2F0KE1hdGgubWF4KDAsbnVtZXJpYy5zdXAobnVtZXJpYy5uZWcoYikpKSsxKTtcbiAgICB2YXIgeDAgPSBudW1lcmljLl9fc29sdmVMUChjMCxBMCxiMCx0b2wsbWF4aXQseSxmYWxzZSk7XG4gICAgdmFyIHggPSBudW1lcmljLmNsb25lKHgwLnNvbHV0aW9uKTtcbiAgICB4Lmxlbmd0aCA9IG07XG4gICAgdmFyIGZvbyA9IG51bWVyaWMuaW5mKHN1YihiLGRvdChBLHgpKSk7XG4gICAgaWYoZm9vPDApIHsgcmV0dXJuIHsgc29sdXRpb246IE5hTiwgbWVzc2FnZTogXCJJbmZlYXNpYmxlXCIsIGl0ZXJhdGlvbnM6IHgwLml0ZXJhdGlvbnMgfTsgfVxuICAgIHZhciByZXQgPSBudW1lcmljLl9fc29sdmVMUChjLCBBLCBiLCB0b2wsIG1heGl0LXgwLml0ZXJhdGlvbnMsIHgsIHRydWUpO1xuICAgIHJldC5pdGVyYXRpb25zICs9IHgwLml0ZXJhdGlvbnM7XG4gICAgcmV0dXJuIHJldDtcbn07XG5cbm51bWVyaWMuc29sdmVMUCA9IGZ1bmN0aW9uIHNvbHZlTFAoYyxBLGIsQWVxLGJlcSx0b2wsbWF4aXQpIHtcbiAgICBpZih0eXBlb2YgbWF4aXQgPT09IFwidW5kZWZpbmVkXCIpIG1heGl0ID0gMTAwMDtcbiAgICBpZih0eXBlb2YgdG9sID09PSBcInVuZGVmaW5lZFwiKSB0b2wgPSBudW1lcmljLmVwc2lsb247XG4gICAgaWYodHlwZW9mIEFlcSA9PT0gXCJ1bmRlZmluZWRcIikgcmV0dXJuIG51bWVyaWMuX3NvbHZlTFAoYyxBLGIsdG9sLG1heGl0KTtcbiAgICB2YXIgbSA9IEFlcS5sZW5ndGgsIG4gPSBBZXFbMF0ubGVuZ3RoLCBvID0gQS5sZW5ndGg7XG4gICAgdmFyIEIgPSBudW1lcmljLmVjaGVsb25pemUoQWVxKTtcbiAgICB2YXIgZmxhZ3MgPSBudW1lcmljLnJlcChbbl0sMCk7XG4gICAgdmFyIFAgPSBCLlA7XG4gICAgdmFyIFEgPSBbXTtcbiAgICB2YXIgaTtcbiAgICBmb3IoaT1QLmxlbmd0aC0xO2khPT0tMTstLWkpIGZsYWdzW1BbaV1dID0gMTtcbiAgICBmb3IoaT1uLTE7aSE9PS0xOy0taSkgaWYoZmxhZ3NbaV09PT0wKSBRLnB1c2goaSk7XG4gICAgdmFyIGcgPSBudW1lcmljLmdldFJhbmdlO1xuICAgIHZhciBJID0gbnVtZXJpYy5saW5zcGFjZSgwLG0tMSksIEogPSBudW1lcmljLmxpbnNwYWNlKDAsby0xKTtcbiAgICB2YXIgQWVxMiA9IGcoQWVxLEksUSksIEExID0gZyhBLEosUCksIEEyID0gZyhBLEosUSksIGRvdCA9IG51bWVyaWMuZG90LCBzdWIgPSBudW1lcmljLnN1YjtcbiAgICB2YXIgQTMgPSBkb3QoQTEsQi5JKTtcbiAgICB2YXIgQTQgPSBzdWIoQTIsZG90KEEzLEFlcTIpKSwgYjQgPSBzdWIoYixkb3QoQTMsYmVxKSk7XG4gICAgdmFyIGMxID0gQXJyYXkoUC5sZW5ndGgpLCBjMiA9IEFycmF5KFEubGVuZ3RoKTtcbiAgICBmb3IoaT1QLmxlbmd0aC0xO2khPT0tMTstLWkpIGMxW2ldID0gY1tQW2ldXTtcbiAgICBmb3IoaT1RLmxlbmd0aC0xO2khPT0tMTstLWkpIGMyW2ldID0gY1tRW2ldXTtcbiAgICB2YXIgYzQgPSBzdWIoYzIsZG90KGMxLGRvdChCLkksQWVxMikpKTtcbiAgICB2YXIgUyA9IG51bWVyaWMuX3NvbHZlTFAoYzQsQTQsYjQsdG9sLG1heGl0KTtcbiAgICB2YXIgeDIgPSBTLnNvbHV0aW9uO1xuICAgIGlmKHgyIT09eDIpIHJldHVybiBTO1xuICAgIHZhciB4MSA9IGRvdChCLkksc3ViKGJlcSxkb3QoQWVxMix4MikpKTtcbiAgICB2YXIgeCA9IEFycmF5KGMubGVuZ3RoKTtcbiAgICBmb3IoaT1QLmxlbmd0aC0xO2khPT0tMTstLWkpIHhbUFtpXV0gPSB4MVtpXTtcbiAgICBmb3IoaT1RLmxlbmd0aC0xO2khPT0tMTstLWkpIHhbUVtpXV0gPSB4MltpXTtcbiAgICByZXR1cm4geyBzb2x1dGlvbjogeCwgbWVzc2FnZTpTLm1lc3NhZ2UsIGl0ZXJhdGlvbnM6IFMuaXRlcmF0aW9ucyB9O1xufVxuXG5udW1lcmljLk1QU3RvTFAgPSBmdW5jdGlvbiBNUFN0b0xQKE1QUykge1xuICAgIGlmKE1QUyBpbnN0YW5jZW9mIFN0cmluZykgeyBNUFMuc3BsaXQoJ1xcbicpOyB9XG4gICAgdmFyIHN0YXRlID0gMDtcbiAgICB2YXIgc3RhdGVzID0gWydJbml0aWFsIHN0YXRlJywnTkFNRScsJ1JPV1MnLCdDT0xVTU5TJywnUkhTJywnQk9VTkRTJywnRU5EQVRBJ107XG4gICAgdmFyIG4gPSBNUFMubGVuZ3RoO1xuICAgIHZhciBpLGoseixOPTAscm93cyA9IHt9LCBzaWduID0gW10sIHJsID0gMCwgdmFycyA9IHt9LCBudiA9IDA7XG4gICAgdmFyIG5hbWU7XG4gICAgdmFyIGMgPSBbXSwgQSA9IFtdLCBiID0gW107XG4gICAgZnVuY3Rpb24gZXJyKGUpIHsgdGhyb3cgbmV3IEVycm9yKCdNUFN0b0xQOiAnK2UrJ1xcbkxpbmUgJytpKyc6ICcrTVBTW2ldKydcXG5DdXJyZW50IHN0YXRlOiAnK3N0YXRlc1tzdGF0ZV0rJ1xcbicpOyB9XG4gICAgZm9yKGk9MDtpPG47KytpKSB7XG4gICAgICAgIHogPSBNUFNbaV07XG4gICAgICAgIHZhciB3MCA9IHoubWF0Y2goL1xcUyovZyk7XG4gICAgICAgIHZhciB3ID0gW107XG4gICAgICAgIGZvcihqPTA7ajx3MC5sZW5ndGg7KytqKSBpZih3MFtqXSE9PVwiXCIpIHcucHVzaCh3MFtqXSk7XG4gICAgICAgIGlmKHcubGVuZ3RoID09PSAwKSBjb250aW51ZTtcbiAgICAgICAgZm9yKGo9MDtqPHN0YXRlcy5sZW5ndGg7KytqKSBpZih6LnN1YnN0cigwLHN0YXRlc1tqXS5sZW5ndGgpID09PSBzdGF0ZXNbal0pIGJyZWFrO1xuICAgICAgICBpZihqPHN0YXRlcy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHN0YXRlID0gajtcbiAgICAgICAgICAgIGlmKGo9PT0xKSB7IG5hbWUgPSB3WzFdOyB9XG4gICAgICAgICAgICBpZihqPT09NikgcmV0dXJuIHsgbmFtZTpuYW1lLCBjOmMsIEE6bnVtZXJpYy50cmFuc3Bvc2UoQSksIGI6Yiwgcm93czpyb3dzLCB2YXJzOnZhcnMgfTtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIHN3aXRjaChzdGF0ZSkge1xuICAgICAgICBjYXNlIDA6IGNhc2UgMTogZXJyKCdVbmV4cGVjdGVkIGxpbmUnKTtcbiAgICAgICAgY2FzZSAyOiBcbiAgICAgICAgICAgIHN3aXRjaCh3WzBdKSB7XG4gICAgICAgICAgICBjYXNlICdOJzogaWYoTj09PTApIE4gPSB3WzFdOyBlbHNlIGVycignVHdvIG9yIG1vcmUgTiByb3dzJyk7IGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnTCc6IHJvd3Nbd1sxXV0gPSBybDsgc2lnbltybF0gPSAxOyBiW3JsXSA9IDA7ICsrcmw7IGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnRyc6IHJvd3Nbd1sxXV0gPSBybDsgc2lnbltybF0gPSAtMTtiW3JsXSA9IDA7ICsrcmw7IGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnRSc6IHJvd3Nbd1sxXV0gPSBybDsgc2lnbltybF0gPSAwO2JbcmxdID0gMDsgKytybDsgYnJlYWs7XG4gICAgICAgICAgICBkZWZhdWx0OiBlcnIoJ1BhcnNlIGVycm9yICcrbnVtZXJpYy5wcmV0dHlQcmludCh3KSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAzOlxuICAgICAgICAgICAgaWYoIXZhcnMuaGFzT3duUHJvcGVydHkod1swXSkpIHsgdmFyc1t3WzBdXSA9IG52OyBjW252XSA9IDA7IEFbbnZdID0gbnVtZXJpYy5yZXAoW3JsXSwwKTsgKytudjsgfVxuICAgICAgICAgICAgdmFyIHAgPSB2YXJzW3dbMF1dO1xuICAgICAgICAgICAgZm9yKGo9MTtqPHcubGVuZ3RoO2orPTIpIHtcbiAgICAgICAgICAgICAgICBpZih3W2pdID09PSBOKSB7IGNbcF0gPSBwYXJzZUZsb2F0KHdbaisxXSk7IGNvbnRpbnVlOyB9XG4gICAgICAgICAgICAgICAgdmFyIHEgPSByb3dzW3dbal1dO1xuICAgICAgICAgICAgICAgIEFbcF1bcV0gPSAoc2lnbltxXTwwPy0xOjEpKnBhcnNlRmxvYXQod1tqKzFdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIDQ6XG4gICAgICAgICAgICBmb3Ioaj0xO2o8dy5sZW5ndGg7ais9MikgYltyb3dzW3dbal1dXSA9IChzaWduW3Jvd3Nbd1tqXV1dPDA/LTE6MSkqcGFyc2VGbG9hdCh3W2orMV0pO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgNTogLypGSVhNRSovIGJyZWFrO1xuICAgICAgICBjYXNlIDY6IGVycignSW50ZXJuYWwgZXJyb3InKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBlcnIoJ1JlYWNoZWQgZW5kIG9mIGZpbGUgd2l0aG91dCBFTkRBVEEnKTtcbn1cbi8vIHNlZWRyYW5kb20uanMgdmVyc2lvbiAyLjAuXG4vLyBBdXRob3I6IERhdmlkIEJhdSA0LzIvMjAxMVxuLy9cbi8vIERlZmluZXMgYSBtZXRob2QgTWF0aC5zZWVkcmFuZG9tKCkgdGhhdCwgd2hlbiBjYWxsZWQsIHN1YnN0aXR1dGVzXG4vLyBhbiBleHBsaWNpdGx5IHNlZWRlZCBSQzQtYmFzZWQgYWxnb3JpdGhtIGZvciBNYXRoLnJhbmRvbSgpLiAgQWxzb1xuLy8gc3VwcG9ydHMgYXV0b21hdGljIHNlZWRpbmcgZnJvbSBsb2NhbCBvciBuZXR3b3JrIHNvdXJjZXMgb2YgZW50cm9weS5cbi8vXG4vLyBVc2FnZTpcbi8vXG4vLyAgIDxzY3JpcHQgc3JjPWh0dHA6Ly9kYXZpZGJhdS5jb20vZW5jb2RlL3NlZWRyYW5kb20tbWluLmpzPjwvc2NyaXB0PlxuLy9cbi8vICAgTWF0aC5zZWVkcmFuZG9tKCd5aXBlZScpOyBTZXRzIE1hdGgucmFuZG9tIHRvIGEgZnVuY3Rpb24gdGhhdCBpc1xuLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluaXRpYWxpemVkIHVzaW5nIHRoZSBnaXZlbiBleHBsaWNpdCBzZWVkLlxuLy9cbi8vICAgTWF0aC5zZWVkcmFuZG9tKCk7ICAgICAgICBTZXRzIE1hdGgucmFuZG9tIHRvIGEgZnVuY3Rpb24gdGhhdCBpc1xuLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlZWRlZCB1c2luZyB0aGUgY3VycmVudCB0aW1lLCBkb20gc3RhdGUsXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYW5kIG90aGVyIGFjY3VtdWxhdGVkIGxvY2FsIGVudHJvcHkuXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgVGhlIGdlbmVyYXRlZCBzZWVkIHN0cmluZyBpcyByZXR1cm5lZC5cbi8vXG4vLyAgIE1hdGguc2VlZHJhbmRvbSgneW93emEnLCB0cnVlKTtcbi8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICBTZWVkcyB1c2luZyB0aGUgZ2l2ZW4gZXhwbGljaXQgc2VlZCBtaXhlZFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRvZ2V0aGVyIHdpdGggYWNjdW11bGF0ZWQgZW50cm9weS5cbi8vXG4vLyAgIDxzY3JpcHQgc3JjPVwiaHR0cDovL2JpdC5seS9zcmFuZG9tLTUxMlwiPjwvc2NyaXB0PlxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgIFNlZWRzIHVzaW5nIHBoeXNpY2FsIHJhbmRvbSBiaXRzIGRvd25sb2FkZWRcbi8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmcm9tIHJhbmRvbS5vcmcuXG4vL1xuLy8gICA8c2NyaXB0IHNyYz1cImh0dHBzOi8vanNvbmxpYi5hcHBzcG90LmNvbS91cmFuZG9tP2NhbGxiYWNrPU1hdGguc2VlZHJhbmRvbVwiPlxuLy8gICA8L3NjcmlwdD4gICAgICAgICAgICAgICAgIFNlZWRzIHVzaW5nIHVyYW5kb20gYml0cyBmcm9tIGNhbGwuanNvbmxpYi5jb20sXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2hpY2ggaXMgZmFzdGVyIHRoYW4gcmFuZG9tLm9yZy5cbi8vXG4vLyBFeGFtcGxlczpcbi8vXG4vLyAgIE1hdGguc2VlZHJhbmRvbShcImhlbGxvXCIpOyAgICAgICAgICAgIC8vIFVzZSBcImhlbGxvXCIgYXMgdGhlIHNlZWQuXG4vLyAgIGRvY3VtZW50LndyaXRlKE1hdGgucmFuZG9tKCkpOyAgICAgICAvLyBBbHdheXMgMC41NDYzNjYzNzY4MTQwNzM0XG4vLyAgIGRvY3VtZW50LndyaXRlKE1hdGgucmFuZG9tKCkpOyAgICAgICAvLyBBbHdheXMgMC40Mzk3Mzc5Mzc3MDU5MjIzNFxuLy8gICB2YXIgcm5nMSA9IE1hdGgucmFuZG9tOyAgICAgICAgICAgICAgLy8gUmVtZW1iZXIgdGhlIGN1cnJlbnQgcHJuZy5cbi8vXG4vLyAgIHZhciBhdXRvc2VlZCA9IE1hdGguc2VlZHJhbmRvbSgpOyAgICAvLyBOZXcgcHJuZyB3aXRoIGFuIGF1dG9tYXRpYyBzZWVkLlxuLy8gICBkb2N1bWVudC53cml0ZShNYXRoLnJhbmRvbSgpKTsgICAgICAgLy8gUHJldHR5IG11Y2ggdW5wcmVkaWN0YWJsZS5cbi8vXG4vLyAgIE1hdGgucmFuZG9tID0gcm5nMTsgICAgICAgICAgICAgICAgICAvLyBDb250aW51ZSBcImhlbGxvXCIgcHJuZyBzZXF1ZW5jZS5cbi8vICAgZG9jdW1lbnQud3JpdGUoTWF0aC5yYW5kb20oKSk7ICAgICAgIC8vIEFsd2F5cyAwLjU1NDc2OTQzMjQ3MzQ1NVxuLy9cbi8vICAgTWF0aC5zZWVkcmFuZG9tKGF1dG9zZWVkKTsgICAgICAgICAgIC8vIFJlc3RhcnQgYXQgdGhlIHByZXZpb3VzIHNlZWQuXG4vLyAgIGRvY3VtZW50LndyaXRlKE1hdGgucmFuZG9tKCkpOyAgICAgICAvLyBSZXBlYXQgdGhlICd1bnByZWRpY3RhYmxlJyB2YWx1ZS5cbi8vXG4vLyBOb3Rlczpcbi8vXG4vLyBFYWNoIHRpbWUgc2VlZHJhbmRvbSgnYXJnJykgaXMgY2FsbGVkLCBlbnRyb3B5IGZyb20gdGhlIHBhc3NlZCBzZWVkXG4vLyBpcyBhY2N1bXVsYXRlZCBpbiBhIHBvb2wgdG8gaGVscCBnZW5lcmF0ZSBmdXR1cmUgc2VlZHMgZm9yIHRoZVxuLy8gemVyby1hcmd1bWVudCBmb3JtIG9mIE1hdGguc2VlZHJhbmRvbSwgc28gZW50cm9weSBjYW4gYmUgaW5qZWN0ZWQgb3ZlclxuLy8gdGltZSBieSBjYWxsaW5nIHNlZWRyYW5kb20gd2l0aCBleHBsaWNpdCBkYXRhIHJlcGVhdGVkbHkuXG4vL1xuLy8gT24gc3BlZWQgLSBUaGlzIGphdmFzY3JpcHQgaW1wbGVtZW50YXRpb24gb2YgTWF0aC5yYW5kb20oKSBpcyBhYm91dFxuLy8gMy0xMHggc2xvd2VyIHRoYW4gdGhlIGJ1aWx0LWluIE1hdGgucmFuZG9tKCkgYmVjYXVzZSBpdCBpcyBub3QgbmF0aXZlXG4vLyBjb2RlLCBidXQgdGhpcyBpcyB0eXBpY2FsbHkgZmFzdCBlbm91Z2ggYW55d2F5LiAgU2VlZGluZyBpcyBtb3JlIGV4cGVuc2l2ZSxcbi8vIGVzcGVjaWFsbHkgaWYgeW91IHVzZSBhdXRvLXNlZWRpbmcuICBTb21lIGRldGFpbHMgKHRpbWluZ3Mgb24gQ2hyb21lIDQpOlxuLy9cbi8vIE91ciBNYXRoLnJhbmRvbSgpICAgICAgICAgICAgLSBhdmcgbGVzcyB0aGFuIDAuMDAyIG1pbGxpc2Vjb25kcyBwZXIgY2FsbFxuLy8gc2VlZHJhbmRvbSgnZXhwbGljaXQnKSAgICAgICAtIGF2ZyBsZXNzIHRoYW4gMC41IG1pbGxpc2Vjb25kcyBwZXIgY2FsbFxuLy8gc2VlZHJhbmRvbSgnZXhwbGljaXQnLCB0cnVlKSAtIGF2ZyBsZXNzIHRoYW4gMiBtaWxsaXNlY29uZHMgcGVyIGNhbGxcbi8vIHNlZWRyYW5kb20oKSAgICAgICAgICAgICAgICAgLSBhdmcgYWJvdXQgMzggbWlsbGlzZWNvbmRzIHBlciBjYWxsXG4vL1xuLy8gTElDRU5TRSAoQlNEKTpcbi8vXG4vLyBDb3B5cmlnaHQgMjAxMCBEYXZpZCBCYXUsIGFsbCByaWdodHMgcmVzZXJ2ZWQuXG4vL1xuLy8gUmVkaXN0cmlidXRpb24gYW5kIHVzZSBpbiBzb3VyY2UgYW5kIGJpbmFyeSBmb3Jtcywgd2l0aCBvciB3aXRob3V0XG4vLyBtb2RpZmljYXRpb24sIGFyZSBwZXJtaXR0ZWQgcHJvdmlkZWQgdGhhdCB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnMgYXJlIG1ldDpcbi8vIFxuLy8gICAxLiBSZWRpc3RyaWJ1dGlvbnMgb2Ygc291cmNlIGNvZGUgbXVzdCByZXRhaW4gdGhlIGFib3ZlIGNvcHlyaWdodFxuLy8gICAgICBub3RpY2UsIHRoaXMgbGlzdCBvZiBjb25kaXRpb25zIGFuZCB0aGUgZm9sbG93aW5nIGRpc2NsYWltZXIuXG4vL1xuLy8gICAyLiBSZWRpc3RyaWJ1dGlvbnMgaW4gYmluYXJ5IGZvcm0gbXVzdCByZXByb2R1Y2UgdGhlIGFib3ZlIGNvcHlyaWdodFxuLy8gICAgICBub3RpY2UsIHRoaXMgbGlzdCBvZiBjb25kaXRpb25zIGFuZCB0aGUgZm9sbG93aW5nIGRpc2NsYWltZXIgaW4gdGhlXG4vLyAgICAgIGRvY3VtZW50YXRpb24gYW5kL29yIG90aGVyIG1hdGVyaWFscyBwcm92aWRlZCB3aXRoIHRoZSBkaXN0cmlidXRpb24uXG4vLyBcbi8vICAgMy4gTmVpdGhlciB0aGUgbmFtZSBvZiB0aGlzIG1vZHVsZSBub3IgdGhlIG5hbWVzIG9mIGl0cyBjb250cmlidXRvcnMgbWF5XG4vLyAgICAgIGJlIHVzZWQgdG8gZW5kb3JzZSBvciBwcm9tb3RlIHByb2R1Y3RzIGRlcml2ZWQgZnJvbSB0aGlzIHNvZnR3YXJlXG4vLyAgICAgIHdpdGhvdXQgc3BlY2lmaWMgcHJpb3Igd3JpdHRlbiBwZXJtaXNzaW9uLlxuLy8gXG4vLyBUSElTIFNPRlRXQVJFIElTIFBST1ZJREVEIEJZIFRIRSBDT1BZUklHSFQgSE9MREVSUyBBTkQgQ09OVFJJQlVUT1JTXG4vLyBcIkFTIElTXCIgQU5EIEFOWSBFWFBSRVNTIE9SIElNUExJRUQgV0FSUkFOVElFUywgSU5DTFVESU5HLCBCVVQgTk9UXG4vLyBMSU1JVEVEIFRPLCBUSEUgSU1QTElFRCBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSBBTkQgRklUTkVTUyBGT1Jcbi8vIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFSRSBESVNDTEFJTUVELiBJTiBOTyBFVkVOVCBTSEFMTCBUSEUgQ09QWVJJR0hUXG4vLyBPV05FUiBPUiBDT05UUklCVVRPUlMgQkUgTElBQkxFIEZPUiBBTlkgRElSRUNULCBJTkRJUkVDVCwgSU5DSURFTlRBTCxcbi8vIFNQRUNJQUwsIEVYRU1QTEFSWSwgT1IgQ09OU0VRVUVOVElBTCBEQU1BR0VTIChJTkNMVURJTkcsIEJVVCBOT1Rcbi8vIExJTUlURUQgVE8sIFBST0NVUkVNRU5UIE9GIFNVQlNUSVRVVEUgR09PRFMgT1IgU0VSVklDRVM7IExPU1MgT0YgVVNFLFxuLy8gREFUQSwgT1IgUFJPRklUUzsgT1IgQlVTSU5FU1MgSU5URVJSVVBUSU9OKSBIT1dFVkVSIENBVVNFRCBBTkQgT04gQU5ZXG4vLyBUSEVPUlkgT0YgTElBQklMSVRZLCBXSEVUSEVSIElOIENPTlRSQUNULCBTVFJJQ1QgTElBQklMSVRZLCBPUiBUT1JUXG4vLyAoSU5DTFVESU5HIE5FR0xJR0VOQ0UgT1IgT1RIRVJXSVNFKSBBUklTSU5HIElOIEFOWSBXQVkgT1VUIE9GIFRIRSBVU0Vcbi8vIE9GIFRISVMgU09GVFdBUkUsIEVWRU4gSUYgQURWSVNFRCBPRiBUSEUgUE9TU0lCSUxJVFkgT0YgU1VDSCBEQU1BR0UuXG4vL1xuLyoqXG4gKiBBbGwgY29kZSBpcyBpbiBhbiBhbm9ueW1vdXMgY2xvc3VyZSB0byBrZWVwIHRoZSBnbG9iYWwgbmFtZXNwYWNlIGNsZWFuLlxuICpcbiAqIEBwYXJhbSB7bnVtYmVyPX0gb3ZlcmZsb3cgXG4gKiBAcGFyYW0ge251bWJlcj19IHN0YXJ0ZGVub21cbiAqL1xuXG4vLyBQYXRjaGVkIGJ5IFNlYiBzbyB0aGF0IHNlZWRyYW5kb20uanMgZG9lcyBub3QgcG9sbHV0ZSB0aGUgTWF0aCBvYmplY3QuXG4vLyBNeSB0ZXN0cyBzdWdnZXN0IHRoYXQgZG9pbmcgTWF0aC50cm91YmxlID0gMSBtYWtlcyBNYXRoIGxvb2t1cHMgYWJvdXQgNSVcbi8vIHNsb3dlci5cbm51bWVyaWMuc2VlZHJhbmRvbSA9IHsgcG93Ok1hdGgucG93LCByYW5kb206TWF0aC5yYW5kb20gfTtcblxuKGZ1bmN0aW9uIChwb29sLCBtYXRoLCB3aWR0aCwgY2h1bmtzLCBzaWduaWZpY2FuY2UsIG92ZXJmbG93LCBzdGFydGRlbm9tKSB7XG5cblxuLy9cbi8vIHNlZWRyYW5kb20oKVxuLy8gVGhpcyBpcyB0aGUgc2VlZHJhbmRvbSBmdW5jdGlvbiBkZXNjcmliZWQgYWJvdmUuXG4vL1xubWF0aFsnc2VlZHJhbmRvbSddID0gZnVuY3Rpb24gc2VlZHJhbmRvbShzZWVkLCB1c2VfZW50cm9weSkge1xuICB2YXIga2V5ID0gW107XG4gIHZhciBhcmM0O1xuXG4gIC8vIEZsYXR0ZW4gdGhlIHNlZWQgc3RyaW5nIG9yIGJ1aWxkIG9uZSBmcm9tIGxvY2FsIGVudHJvcHkgaWYgbmVlZGVkLlxuICBzZWVkID0gbWl4a2V5KGZsYXR0ZW4oXG4gICAgdXNlX2VudHJvcHkgPyBbc2VlZCwgcG9vbF0gOlxuICAgIGFyZ3VtZW50cy5sZW5ndGggPyBzZWVkIDpcbiAgICBbbmV3IERhdGUoKS5nZXRUaW1lKCksIHBvb2wsIHdpbmRvd10sIDMpLCBrZXkpO1xuXG4gIC8vIFVzZSB0aGUgc2VlZCB0byBpbml0aWFsaXplIGFuIEFSQzQgZ2VuZXJhdG9yLlxuICBhcmM0ID0gbmV3IEFSQzQoa2V5KTtcblxuICAvLyBNaXggdGhlIHJhbmRvbW5lc3MgaW50byBhY2N1bXVsYXRlZCBlbnRyb3B5LlxuICBtaXhrZXkoYXJjNC5TLCBwb29sKTtcblxuICAvLyBPdmVycmlkZSBNYXRoLnJhbmRvbVxuXG4gIC8vIFRoaXMgZnVuY3Rpb24gcmV0dXJucyBhIHJhbmRvbSBkb3VibGUgaW4gWzAsIDEpIHRoYXQgY29udGFpbnNcbiAgLy8gcmFuZG9tbmVzcyBpbiBldmVyeSBiaXQgb2YgdGhlIG1hbnRpc3NhIG9mIHRoZSBJRUVFIDc1NCB2YWx1ZS5cblxuICBtYXRoWydyYW5kb20nXSA9IGZ1bmN0aW9uIHJhbmRvbSgpIHsgIC8vIENsb3N1cmUgdG8gcmV0dXJuIGEgcmFuZG9tIGRvdWJsZTpcbiAgICB2YXIgbiA9IGFyYzQuZyhjaHVua3MpOyAgICAgICAgICAgICAvLyBTdGFydCB3aXRoIGEgbnVtZXJhdG9yIG4gPCAyIF4gNDhcbiAgICB2YXIgZCA9IHN0YXJ0ZGVub207ICAgICAgICAgICAgICAgICAvLyAgIGFuZCBkZW5vbWluYXRvciBkID0gMiBeIDQ4LlxuICAgIHZhciB4ID0gMDsgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgYW5kIG5vICdleHRyYSBsYXN0IGJ5dGUnLlxuICAgIHdoaWxlIChuIDwgc2lnbmlmaWNhbmNlKSB7ICAgICAgICAgIC8vIEZpbGwgdXAgYWxsIHNpZ25pZmljYW50IGRpZ2l0cyBieVxuICAgICAgbiA9IChuICsgeCkgKiB3aWR0aDsgICAgICAgICAgICAgIC8vICAgc2hpZnRpbmcgbnVtZXJhdG9yIGFuZFxuICAgICAgZCAqPSB3aWR0aDsgICAgICAgICAgICAgICAgICAgICAgIC8vICAgZGVub21pbmF0b3IgYW5kIGdlbmVyYXRpbmcgYVxuICAgICAgeCA9IGFyYzQuZygxKTsgICAgICAgICAgICAgICAgICAgIC8vICAgbmV3IGxlYXN0LXNpZ25pZmljYW50LWJ5dGUuXG4gICAgfVxuICAgIHdoaWxlIChuID49IG92ZXJmbG93KSB7ICAgICAgICAgICAgIC8vIFRvIGF2b2lkIHJvdW5kaW5nIHVwLCBiZWZvcmUgYWRkaW5nXG4gICAgICBuIC89IDI7ICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gICBsYXN0IGJ5dGUsIHNoaWZ0IGV2ZXJ5dGhpbmdcbiAgICAgIGQgLz0gMjsgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAgIHJpZ2h0IHVzaW5nIGludGVnZXIgbWF0aCB1bnRpbFxuICAgICAgeCA+Pj49IDE7ICAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgd2UgaGF2ZSBleGFjdGx5IHRoZSBkZXNpcmVkIGJpdHMuXG4gICAgfVxuICAgIHJldHVybiAobiArIHgpIC8gZDsgICAgICAgICAgICAgICAgIC8vIEZvcm0gdGhlIG51bWJlciB3aXRoaW4gWzAsIDEpLlxuICB9O1xuXG4gIC8vIFJldHVybiB0aGUgc2VlZCB0aGF0IHdhcyB1c2VkXG4gIHJldHVybiBzZWVkO1xufTtcblxuLy9cbi8vIEFSQzRcbi8vXG4vLyBBbiBBUkM0IGltcGxlbWVudGF0aW9uLiAgVGhlIGNvbnN0cnVjdG9yIHRha2VzIGEga2V5IGluIHRoZSBmb3JtIG9mXG4vLyBhbiBhcnJheSBvZiBhdCBtb3N0ICh3aWR0aCkgaW50ZWdlcnMgdGhhdCBzaG91bGQgYmUgMCA8PSB4IDwgKHdpZHRoKS5cbi8vXG4vLyBUaGUgZyhjb3VudCkgbWV0aG9kIHJldHVybnMgYSBwc2V1ZG9yYW5kb20gaW50ZWdlciB0aGF0IGNvbmNhdGVuYXRlc1xuLy8gdGhlIG5leHQgKGNvdW50KSBvdXRwdXRzIGZyb20gQVJDNC4gIEl0cyByZXR1cm4gdmFsdWUgaXMgYSBudW1iZXIgeFxuLy8gdGhhdCBpcyBpbiB0aGUgcmFuZ2UgMCA8PSB4IDwgKHdpZHRoIF4gY291bnQpLlxuLy9cbi8qKiBAY29uc3RydWN0b3IgKi9cbmZ1bmN0aW9uIEFSQzQoa2V5KSB7XG4gIHZhciB0LCB1LCBtZSA9IHRoaXMsIGtleWxlbiA9IGtleS5sZW5ndGg7XG4gIHZhciBpID0gMCwgaiA9IG1lLmkgPSBtZS5qID0gbWUubSA9IDA7XG4gIG1lLlMgPSBbXTtcbiAgbWUuYyA9IFtdO1xuXG4gIC8vIFRoZSBlbXB0eSBrZXkgW10gaXMgdHJlYXRlZCBhcyBbMF0uXG4gIGlmICgha2V5bGVuKSB7IGtleSA9IFtrZXlsZW4rK107IH1cblxuICAvLyBTZXQgdXAgUyB1c2luZyB0aGUgc3RhbmRhcmQga2V5IHNjaGVkdWxpbmcgYWxnb3JpdGhtLlxuICB3aGlsZSAoaSA8IHdpZHRoKSB7IG1lLlNbaV0gPSBpKys7IH1cbiAgZm9yIChpID0gMDsgaSA8IHdpZHRoOyBpKyspIHtcbiAgICB0ID0gbWUuU1tpXTtcbiAgICBqID0gbG93Yml0cyhqICsgdCArIGtleVtpICUga2V5bGVuXSk7XG4gICAgdSA9IG1lLlNbal07XG4gICAgbWUuU1tpXSA9IHU7XG4gICAgbWUuU1tqXSA9IHQ7XG4gIH1cblxuICAvLyBUaGUgXCJnXCIgbWV0aG9kIHJldHVybnMgdGhlIG5leHQgKGNvdW50KSBvdXRwdXRzIGFzIG9uZSBudW1iZXIuXG4gIG1lLmcgPSBmdW5jdGlvbiBnZXRuZXh0KGNvdW50KSB7XG4gICAgdmFyIHMgPSBtZS5TO1xuICAgIHZhciBpID0gbG93Yml0cyhtZS5pICsgMSk7IHZhciB0ID0gc1tpXTtcbiAgICB2YXIgaiA9IGxvd2JpdHMobWUuaiArIHQpOyB2YXIgdSA9IHNbal07XG4gICAgc1tpXSA9IHU7XG4gICAgc1tqXSA9IHQ7XG4gICAgdmFyIHIgPSBzW2xvd2JpdHModCArIHUpXTtcbiAgICB3aGlsZSAoLS1jb3VudCkge1xuICAgICAgaSA9IGxvd2JpdHMoaSArIDEpOyB0ID0gc1tpXTtcbiAgICAgIGogPSBsb3diaXRzKGogKyB0KTsgdSA9IHNbal07XG4gICAgICBzW2ldID0gdTtcbiAgICAgIHNbal0gPSB0O1xuICAgICAgciA9IHIgKiB3aWR0aCArIHNbbG93Yml0cyh0ICsgdSldO1xuICAgIH1cbiAgICBtZS5pID0gaTtcbiAgICBtZS5qID0gajtcbiAgICByZXR1cm4gcjtcbiAgfTtcbiAgLy8gRm9yIHJvYnVzdCB1bnByZWRpY3RhYmlsaXR5IGRpc2NhcmQgYW4gaW5pdGlhbCBiYXRjaCBvZiB2YWx1ZXMuXG4gIC8vIFNlZSBodHRwOi8vd3d3LnJzYS5jb20vcnNhbGFicy9ub2RlLmFzcD9pZD0yMDA5XG4gIG1lLmcod2lkdGgpO1xufVxuXG4vL1xuLy8gZmxhdHRlbigpXG4vLyBDb252ZXJ0cyBhbiBvYmplY3QgdHJlZSB0byBuZXN0ZWQgYXJyYXlzIG9mIHN0cmluZ3MuXG4vL1xuLyoqIEBwYXJhbSB7T2JqZWN0PX0gcmVzdWx0IFxuICAqIEBwYXJhbSB7c3RyaW5nPX0gcHJvcFxuICAqIEBwYXJhbSB7c3RyaW5nPX0gdHlwICovXG5mdW5jdGlvbiBmbGF0dGVuKG9iaiwgZGVwdGgsIHJlc3VsdCwgcHJvcCwgdHlwKSB7XG4gIHJlc3VsdCA9IFtdO1xuICB0eXAgPSB0eXBlb2Yob2JqKTtcbiAgaWYgKGRlcHRoICYmIHR5cCA9PSAnb2JqZWN0Jykge1xuICAgIGZvciAocHJvcCBpbiBvYmopIHtcbiAgICAgIGlmIChwcm9wLmluZGV4T2YoJ1MnKSA8IDUpIHsgICAgLy8gQXZvaWQgRkYzIGJ1ZyAobG9jYWwvc2Vzc2lvblN0b3JhZ2UpXG4gICAgICAgIHRyeSB7IHJlc3VsdC5wdXNoKGZsYXR0ZW4ob2JqW3Byb3BdLCBkZXB0aCAtIDEpKTsgfSBjYXRjaCAoZSkge31cbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIChyZXN1bHQubGVuZ3RoID8gcmVzdWx0IDogb2JqICsgKHR5cCAhPSAnc3RyaW5nJyA/ICdcXDAnIDogJycpKTtcbn1cblxuLy9cbi8vIG1peGtleSgpXG4vLyBNaXhlcyBhIHN0cmluZyBzZWVkIGludG8gYSBrZXkgdGhhdCBpcyBhbiBhcnJheSBvZiBpbnRlZ2VycywgYW5kXG4vLyByZXR1cm5zIGEgc2hvcnRlbmVkIHN0cmluZyBzZWVkIHRoYXQgaXMgZXF1aXZhbGVudCB0byB0aGUgcmVzdWx0IGtleS5cbi8vXG4vKiogQHBhcmFtIHtudW1iZXI9fSBzbWVhciBcbiAgKiBAcGFyYW0ge251bWJlcj19IGogKi9cbmZ1bmN0aW9uIG1peGtleShzZWVkLCBrZXksIHNtZWFyLCBqKSB7XG4gIHNlZWQgKz0gJyc7ICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEVuc3VyZSB0aGUgc2VlZCBpcyBhIHN0cmluZ1xuICBzbWVhciA9IDA7XG4gIGZvciAoaiA9IDA7IGogPCBzZWVkLmxlbmd0aDsgaisrKSB7XG4gICAga2V5W2xvd2JpdHMoaildID1cbiAgICAgIGxvd2JpdHMoKHNtZWFyIF49IGtleVtsb3diaXRzKGopXSAqIDE5KSArIHNlZWQuY2hhckNvZGVBdChqKSk7XG4gIH1cbiAgc2VlZCA9ICcnO1xuICBmb3IgKGogaW4ga2V5KSB7IHNlZWQgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShrZXlbal0pOyB9XG4gIHJldHVybiBzZWVkO1xufVxuXG4vL1xuLy8gbG93Yml0cygpXG4vLyBBIHF1aWNrIFwibiBtb2Qgd2lkdGhcIiBmb3Igd2lkdGggYSBwb3dlciBvZiAyLlxuLy9cbmZ1bmN0aW9uIGxvd2JpdHMobikgeyByZXR1cm4gbiAmICh3aWR0aCAtIDEpOyB9XG5cbi8vXG4vLyBUaGUgZm9sbG93aW5nIGNvbnN0YW50cyBhcmUgcmVsYXRlZCB0byBJRUVFIDc1NCBsaW1pdHMuXG4vL1xuc3RhcnRkZW5vbSA9IG1hdGgucG93KHdpZHRoLCBjaHVua3MpO1xuc2lnbmlmaWNhbmNlID0gbWF0aC5wb3coMiwgc2lnbmlmaWNhbmNlKTtcbm92ZXJmbG93ID0gc2lnbmlmaWNhbmNlICogMjtcblxuLy9cbi8vIFdoZW4gc2VlZHJhbmRvbS5qcyBpcyBsb2FkZWQsIHdlIGltbWVkaWF0ZWx5IG1peCBhIGZldyBiaXRzXG4vLyBmcm9tIHRoZSBidWlsdC1pbiBSTkcgaW50byB0aGUgZW50cm9weSBwb29sLiAgQmVjYXVzZSB3ZSBkb1xuLy8gbm90IHdhbnQgdG8gaW50ZWZlcmUgd2l0aCBkZXRlcm1pbnN0aWMgUFJORyBzdGF0ZSBsYXRlcixcbi8vIHNlZWRyYW5kb20gd2lsbCBub3QgY2FsbCBtYXRoLnJhbmRvbSBvbiBpdHMgb3duIGFnYWluIGFmdGVyXG4vLyBpbml0aWFsaXphdGlvbi5cbi8vXG5taXhrZXkobWF0aC5yYW5kb20oKSwgcG9vbCk7XG5cbi8vIEVuZCBhbm9ueW1vdXMgc2NvcGUsIGFuZCBwYXNzIGluaXRpYWwgdmFsdWVzLlxufShcbiAgW10sICAgLy8gcG9vbDogZW50cm9weSBwb29sIHN0YXJ0cyBlbXB0eVxuICBudW1lcmljLnNlZWRyYW5kb20sIC8vIG1hdGg6IHBhY2thZ2UgY29udGFpbmluZyByYW5kb20sIHBvdywgYW5kIHNlZWRyYW5kb21cbiAgMjU2LCAgLy8gd2lkdGg6IGVhY2ggUkM0IG91dHB1dCBpcyAwIDw9IHggPCAyNTZcbiAgNiwgICAgLy8gY2h1bmtzOiBhdCBsZWFzdCBzaXggUkM0IG91dHB1dHMgZm9yIGVhY2ggZG91YmxlXG4gIDUyICAgIC8vIHNpZ25pZmljYW5jZTogdGhlcmUgYXJlIDUyIHNpZ25pZmljYW50IGRpZ2l0cyBpbiBhIGRvdWJsZVxuICApKTtcbi8qIFRoaXMgZmlsZSBpcyBhIHNsaWdodGx5IG1vZGlmaWVkIHZlcnNpb24gb2YgcXVhZHByb2cuanMgZnJvbSBBbGJlcnRvIFNhbnRpbmkuXG4gKiBJdCBoYXMgYmVlbiBzbGlnaHRseSBtb2RpZmllZCBieSBTw6liYXN0aWVuIExvaXNlbCB0byBtYWtlIHN1cmUgdGhhdCBpdCBoYW5kbGVzXG4gKiAwLWJhc2VkIEFycmF5cyBpbnN0ZWFkIG9mIDEtYmFzZWQgQXJyYXlzLlxuICogTGljZW5zZSBpcyBpbiByZXNvdXJjZXMvTElDRU5TRS5xdWFkcHJvZyAqL1xuKGZ1bmN0aW9uKGV4cG9ydHMpIHtcblxuZnVuY3Rpb24gYmFzZTB0bzEoQSkge1xuICAgIGlmKHR5cGVvZiBBICE9PSBcIm9iamVjdFwiKSB7IHJldHVybiBBOyB9XG4gICAgdmFyIHJldCA9IFtdLCBpLG49QS5sZW5ndGg7XG4gICAgZm9yKGk9MDtpPG47aSsrKSByZXRbaSsxXSA9IGJhc2UwdG8xKEFbaV0pO1xuICAgIHJldHVybiByZXQ7XG59XG5mdW5jdGlvbiBiYXNlMXRvMChBKSB7XG4gICAgaWYodHlwZW9mIEEgIT09IFwib2JqZWN0XCIpIHsgcmV0dXJuIEE7IH1cbiAgICB2YXIgcmV0ID0gW10sIGksbj1BLmxlbmd0aDtcbiAgICBmb3IoaT0xO2k8bjtpKyspIHJldFtpLTFdID0gYmFzZTF0bzAoQVtpXSk7XG4gICAgcmV0dXJuIHJldDtcbn1cblxuZnVuY3Rpb24gZHBvcmkoYSwgbGRhLCBuKSB7XG4gICAgdmFyIGksIGosIGssIGtwMSwgdDtcblxuICAgIGZvciAoayA9IDE7IGsgPD0gbjsgayA9IGsgKyAxKSB7XG4gICAgICAgIGFba11ba10gPSAxIC8gYVtrXVtrXTtcbiAgICAgICAgdCA9IC1hW2tdW2tdO1xuICAgICAgICAvL34gZHNjYWwoayAtIDEsIHQsIGFbMV1ba10sIDEpO1xuICAgICAgICBmb3IgKGkgPSAxOyBpIDwgazsgaSA9IGkgKyAxKSB7XG4gICAgICAgICAgICBhW2ldW2tdID0gdCAqIGFbaV1ba107XG4gICAgICAgIH1cblxuICAgICAgICBrcDEgPSBrICsgMTtcbiAgICAgICAgaWYgKG4gPCBrcDEpIHtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGZvciAoaiA9IGtwMTsgaiA8PSBuOyBqID0gaiArIDEpIHtcbiAgICAgICAgICAgIHQgPSBhW2tdW2pdO1xuICAgICAgICAgICAgYVtrXVtqXSA9IDA7XG4gICAgICAgICAgICAvL34gZGF4cHkoaywgdCwgYVsxXVtrXSwgMSwgYVsxXVtqXSwgMSk7XG4gICAgICAgICAgICBmb3IgKGkgPSAxOyBpIDw9IGs7IGkgPSBpICsgMSkge1xuICAgICAgICAgICAgICAgIGFbaV1bal0gPSBhW2ldW2pdICsgKHQgKiBhW2ldW2tdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxufVxuXG5mdW5jdGlvbiBkcG9zbChhLCBsZGEsIG4sIGIpIHtcbiAgICB2YXIgaSwgaywga2IsIHQ7XG5cbiAgICBmb3IgKGsgPSAxOyBrIDw9IG47IGsgPSBrICsgMSkge1xuICAgICAgICAvL34gdCA9IGRkb3QoayAtIDEsIGFbMV1ba10sIDEsIGJbMV0sIDEpO1xuICAgICAgICB0ID0gMDtcbiAgICAgICAgZm9yIChpID0gMTsgaSA8IGs7IGkgPSBpICsgMSkge1xuICAgICAgICAgICAgdCA9IHQgKyAoYVtpXVtrXSAqIGJbaV0pO1xuICAgICAgICB9XG5cbiAgICAgICAgYltrXSA9IChiW2tdIC0gdCkgLyBhW2tdW2tdO1xuICAgIH1cblxuICAgIGZvciAoa2IgPSAxOyBrYiA8PSBuOyBrYiA9IGtiICsgMSkge1xuICAgICAgICBrID0gbiArIDEgLSBrYjtcbiAgICAgICAgYltrXSA9IGJba10gLyBhW2tdW2tdO1xuICAgICAgICB0ID0gLWJba107XG4gICAgICAgIC8vfiBkYXhweShrIC0gMSwgdCwgYVsxXVtrXSwgMSwgYlsxXSwgMSk7XG4gICAgICAgIGZvciAoaSA9IDE7IGkgPCBrOyBpID0gaSArIDEpIHtcbiAgICAgICAgICAgIGJbaV0gPSBiW2ldICsgKHQgKiBhW2ldW2tdKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gZHBvZmEoYSwgbGRhLCBuLCBpbmZvKSB7XG4gICAgdmFyIGksIGosIGptMSwgaywgdCwgcztcblxuICAgIGZvciAoaiA9IDE7IGogPD0gbjsgaiA9IGogKyAxKSB7XG4gICAgICAgIGluZm9bMV0gPSBqO1xuICAgICAgICBzID0gMDtcbiAgICAgICAgam0xID0gaiAtIDE7XG4gICAgICAgIGlmIChqbTEgPCAxKSB7XG4gICAgICAgICAgICBzID0gYVtqXVtqXSAtIHM7XG4gICAgICAgICAgICBpZiAocyA8PSAwKSB7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBhW2pdW2pdID0gTWF0aC5zcXJ0KHMpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZm9yIChrID0gMTsgayA8PSBqbTE7IGsgPSBrICsgMSkge1xuICAgICAgICAgICAgICAgIC8vfiB0ID0gYVtrXVtqXSAtIGRkb3QoayAtIDEsIGFbMV1ba10sIDEsIGFbMV1bal0sIDEpO1xuICAgICAgICAgICAgICAgIHQgPSBhW2tdW2pdO1xuICAgICAgICAgICAgICAgIGZvciAoaSA9IDE7IGkgPCBrOyBpID0gaSArIDEpIHtcbiAgICAgICAgICAgICAgICAgICAgdCA9IHQgLSAoYVtpXVtqXSAqIGFbaV1ba10pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0ID0gdCAvIGFba11ba107XG4gICAgICAgICAgICAgICAgYVtrXVtqXSA9IHQ7XG4gICAgICAgICAgICAgICAgcyA9IHMgKyB0ICogdDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHMgPSBhW2pdW2pdIC0gcztcbiAgICAgICAgICAgIGlmIChzIDw9IDApIHtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGFbal1bal0gPSBNYXRoLnNxcnQocyk7XG4gICAgICAgIH1cbiAgICAgICAgaW5mb1sxXSA9IDA7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBxcGdlbjIoZG1hdCwgZHZlYywgZmRkbWF0LCBuLCBzb2wsIGNydmFsLCBhbWF0LFxuICAgIGJ2ZWMsIGZkYW1hdCwgcSwgbWVxLCBpYWN0LCBuYWN0LCBpdGVyLCB3b3JrLCBpZXJyKSB7XG5cbiAgICB2YXIgaSwgaiwgbCwgbDEsIGluZm8sIGl0MSwgaXd6diwgaXdydiwgaXdybSwgaXdzdiwgaXd1diwgbnZsLCByLCBpd25idixcbiAgICAgICAgdGVtcCwgc3VtLCB0MSwgdHQsIGdjLCBncywgbnUsXG4gICAgICAgIHQxaW5mLCB0Mm1pbixcbiAgICAgICAgdnNtYWxsLCB0bXBhLCB0bXBiLFxuICAgICAgICBnbztcblxuICAgIHIgPSBNYXRoLm1pbihuLCBxKTtcbiAgICBsID0gMiAqIG4gKyAociAqIChyICsgNSkpIC8gMiArIDIgKiBxICsgMTtcblxuICAgIHZzbWFsbCA9IDEuMGUtNjA7XG4gICAgZG8ge1xuICAgICAgICB2c21hbGwgPSB2c21hbGwgKyB2c21hbGw7XG4gICAgICAgIHRtcGEgPSAxICsgMC4xICogdnNtYWxsO1xuICAgICAgICB0bXBiID0gMSArIDAuMiAqIHZzbWFsbDtcbiAgICB9IHdoaWxlICh0bXBhIDw9IDEgfHwgdG1wYiA8PSAxKTtcblxuICAgIGZvciAoaSA9IDE7IGkgPD0gbjsgaSA9IGkgKyAxKSB7XG4gICAgICAgIHdvcmtbaV0gPSBkdmVjW2ldO1xuICAgIH1cbiAgICBmb3IgKGkgPSBuICsgMTsgaSA8PSBsOyBpID0gaSArIDEpIHtcbiAgICAgICAgd29ya1tpXSA9IDA7XG4gICAgfVxuICAgIGZvciAoaSA9IDE7IGkgPD0gcTsgaSA9IGkgKyAxKSB7XG4gICAgICAgIGlhY3RbaV0gPSAwO1xuICAgIH1cblxuICAgIGluZm8gPSBbXTtcblxuICAgIGlmIChpZXJyWzFdID09PSAwKSB7XG4gICAgICAgIGRwb2ZhKGRtYXQsIGZkZG1hdCwgbiwgaW5mbyk7XG4gICAgICAgIGlmIChpbmZvWzFdICE9PSAwKSB7XG4gICAgICAgICAgICBpZXJyWzFdID0gMjtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBkcG9zbChkbWF0LCBmZGRtYXQsIG4sIGR2ZWMpO1xuICAgICAgICBkcG9yaShkbWF0LCBmZGRtYXQsIG4pO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGZvciAoaiA9IDE7IGogPD0gbjsgaiA9IGogKyAxKSB7XG4gICAgICAgICAgICBzb2xbal0gPSAwO1xuICAgICAgICAgICAgZm9yIChpID0gMTsgaSA8PSBqOyBpID0gaSArIDEpIHtcbiAgICAgICAgICAgICAgICBzb2xbal0gPSBzb2xbal0gKyBkbWF0W2ldW2pdICogZHZlY1tpXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBmb3IgKGogPSAxOyBqIDw9IG47IGogPSBqICsgMSkge1xuICAgICAgICAgICAgZHZlY1tqXSA9IDA7XG4gICAgICAgICAgICBmb3IgKGkgPSBqOyBpIDw9IG47IGkgPSBpICsgMSkge1xuICAgICAgICAgICAgICAgIGR2ZWNbal0gPSBkdmVjW2pdICsgZG1hdFtqXVtpXSAqIHNvbFtpXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGNydmFsWzFdID0gMDtcbiAgICBmb3IgKGogPSAxOyBqIDw9IG47IGogPSBqICsgMSkge1xuICAgICAgICBzb2xbal0gPSBkdmVjW2pdO1xuICAgICAgICBjcnZhbFsxXSA9IGNydmFsWzFdICsgd29ya1tqXSAqIHNvbFtqXTtcbiAgICAgICAgd29ya1tqXSA9IDA7XG4gICAgICAgIGZvciAoaSA9IGogKyAxOyBpIDw9IG47IGkgPSBpICsgMSkge1xuICAgICAgICAgICAgZG1hdFtpXVtqXSA9IDA7XG4gICAgICAgIH1cbiAgICB9XG4gICAgY3J2YWxbMV0gPSAtY3J2YWxbMV0gLyAyO1xuICAgIGllcnJbMV0gPSAwO1xuXG4gICAgaXd6diA9IG47XG4gICAgaXdydiA9IGl3enYgKyBuO1xuICAgIGl3dXYgPSBpd3J2ICsgcjtcbiAgICBpd3JtID0gaXd1diArIHIgKyAxO1xuICAgIGl3c3YgPSBpd3JtICsgKHIgKiAociArIDEpKSAvIDI7XG4gICAgaXduYnYgPSBpd3N2ICsgcTtcblxuICAgIGZvciAoaSA9IDE7IGkgPD0gcTsgaSA9IGkgKyAxKSB7XG4gICAgICAgIHN1bSA9IDA7XG4gICAgICAgIGZvciAoaiA9IDE7IGogPD0gbjsgaiA9IGogKyAxKSB7XG4gICAgICAgICAgICBzdW0gPSBzdW0gKyBhbWF0W2pdW2ldICogYW1hdFtqXVtpXTtcbiAgICAgICAgfVxuICAgICAgICB3b3JrW2l3bmJ2ICsgaV0gPSBNYXRoLnNxcnQoc3VtKTtcbiAgICB9XG4gICAgbmFjdCA9IDA7XG4gICAgaXRlclsxXSA9IDA7XG4gICAgaXRlclsyXSA9IDA7XG5cbiAgICBmdW5jdGlvbiBmbl9nb3RvXzUwKCkge1xuICAgICAgICBpdGVyWzFdID0gaXRlclsxXSArIDE7XG5cbiAgICAgICAgbCA9IGl3c3Y7XG4gICAgICAgIGZvciAoaSA9IDE7IGkgPD0gcTsgaSA9IGkgKyAxKSB7XG4gICAgICAgICAgICBsID0gbCArIDE7XG4gICAgICAgICAgICBzdW0gPSAtYnZlY1tpXTtcbiAgICAgICAgICAgIGZvciAoaiA9IDE7IGogPD0gbjsgaiA9IGogKyAxKSB7XG4gICAgICAgICAgICAgICAgc3VtID0gc3VtICsgYW1hdFtqXVtpXSAqIHNvbFtqXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChNYXRoLmFicyhzdW0pIDwgdnNtYWxsKSB7XG4gICAgICAgICAgICAgICAgc3VtID0gMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChpID4gbWVxKSB7XG4gICAgICAgICAgICAgICAgd29ya1tsXSA9IHN1bTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgd29ya1tsXSA9IC1NYXRoLmFicyhzdW0pO1xuICAgICAgICAgICAgICAgIGlmIChzdW0gPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAoaiA9IDE7IGogPD0gbjsgaiA9IGogKyAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhbWF0W2pdW2ldID0gLWFtYXRbal1baV07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYnZlY1tpXSA9IC1idmVjW2ldO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAoaSA9IDE7IGkgPD0gbmFjdDsgaSA9IGkgKyAxKSB7XG4gICAgICAgICAgICB3b3JrW2l3c3YgKyBpYWN0W2ldXSA9IDA7XG4gICAgICAgIH1cblxuICAgICAgICBudmwgPSAwO1xuICAgICAgICB0ZW1wID0gMDtcbiAgICAgICAgZm9yIChpID0gMTsgaSA8PSBxOyBpID0gaSArIDEpIHtcbiAgICAgICAgICAgIGlmICh3b3JrW2l3c3YgKyBpXSA8IHRlbXAgKiB3b3JrW2l3bmJ2ICsgaV0pIHtcbiAgICAgICAgICAgICAgICBudmwgPSBpO1xuICAgICAgICAgICAgICAgIHRlbXAgPSB3b3JrW2l3c3YgKyBpXSAvIHdvcmtbaXduYnYgKyBpXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAobnZsID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gOTk5O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIDA7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZm5fZ290b181NSgpIHtcbiAgICAgICAgZm9yIChpID0gMTsgaSA8PSBuOyBpID0gaSArIDEpIHtcbiAgICAgICAgICAgIHN1bSA9IDA7XG4gICAgICAgICAgICBmb3IgKGogPSAxOyBqIDw9IG47IGogPSBqICsgMSkge1xuICAgICAgICAgICAgICAgIHN1bSA9IHN1bSArIGRtYXRbal1baV0gKiBhbWF0W2pdW252bF07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB3b3JrW2ldID0gc3VtO1xuICAgICAgICB9XG5cbiAgICAgICAgbDEgPSBpd3p2O1xuICAgICAgICBmb3IgKGkgPSAxOyBpIDw9IG47IGkgPSBpICsgMSkge1xuICAgICAgICAgICAgd29ya1tsMSArIGldID0gMDtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKGogPSBuYWN0ICsgMTsgaiA8PSBuOyBqID0gaiArIDEpIHtcbiAgICAgICAgICAgIGZvciAoaSA9IDE7IGkgPD0gbjsgaSA9IGkgKyAxKSB7XG4gICAgICAgICAgICAgICAgd29ya1tsMSArIGldID0gd29ya1tsMSArIGldICsgZG1hdFtpXVtqXSAqIHdvcmtbal07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB0MWluZiA9IHRydWU7XG4gICAgICAgIGZvciAoaSA9IG5hY3Q7IGkgPj0gMTsgaSA9IGkgLSAxKSB7XG4gICAgICAgICAgICBzdW0gPSB3b3JrW2ldO1xuICAgICAgICAgICAgbCA9IGl3cm0gKyAoaSAqIChpICsgMykpIC8gMjtcbiAgICAgICAgICAgIGwxID0gbCAtIGk7XG4gICAgICAgICAgICBmb3IgKGogPSBpICsgMTsgaiA8PSBuYWN0OyBqID0gaiArIDEpIHtcbiAgICAgICAgICAgICAgICBzdW0gPSBzdW0gLSB3b3JrW2xdICogd29ya1tpd3J2ICsgal07XG4gICAgICAgICAgICAgICAgbCA9IGwgKyBqO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc3VtID0gc3VtIC8gd29ya1tsMV07XG4gICAgICAgICAgICB3b3JrW2l3cnYgKyBpXSA9IHN1bTtcbiAgICAgICAgICAgIGlmIChpYWN0W2ldIDwgbWVxKSB7XG4gICAgICAgICAgICAgICAgLy8gY29udGludWU7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoc3VtIDwgMCkge1xuICAgICAgICAgICAgICAgIC8vIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdDFpbmYgPSBmYWxzZTtcbiAgICAgICAgICAgIGl0MSA9IGk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXQxaW5mKSB7XG4gICAgICAgICAgICB0MSA9IHdvcmtbaXd1diArIGl0MV0gLyB3b3JrW2l3cnYgKyBpdDFdO1xuICAgICAgICAgICAgZm9yIChpID0gMTsgaSA8PSBuYWN0OyBpID0gaSArIDEpIHtcbiAgICAgICAgICAgICAgICBpZiAoaWFjdFtpXSA8IG1lcSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh3b3JrW2l3cnYgKyBpXSA8IDApIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0ZW1wID0gd29ya1tpd3V2ICsgaV0gLyB3b3JrW2l3cnYgKyBpXTtcbiAgICAgICAgICAgICAgICBpZiAodGVtcCA8IHQxKSB7XG4gICAgICAgICAgICAgICAgICAgIHQxID0gdGVtcDtcbiAgICAgICAgICAgICAgICAgICAgaXQxID0gaTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBzdW0gPSAwO1xuICAgICAgICBmb3IgKGkgPSBpd3p2ICsgMTsgaSA8PSBpd3p2ICsgbjsgaSA9IGkgKyAxKSB7XG4gICAgICAgICAgICBzdW0gPSBzdW0gKyB3b3JrW2ldICogd29ya1tpXTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoTWF0aC5hYnMoc3VtKSA8PSB2c21hbGwpIHtcbiAgICAgICAgICAgIGlmICh0MWluZikge1xuICAgICAgICAgICAgICAgIGllcnJbMV0gPSAxO1xuICAgICAgICAgICAgICAgIC8vIEdPVE8gOTk5XG4gICAgICAgICAgICAgICAgcmV0dXJuIDk5OTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZm9yIChpID0gMTsgaSA8PSBuYWN0OyBpID0gaSArIDEpIHtcbiAgICAgICAgICAgICAgICAgICAgd29ya1tpd3V2ICsgaV0gPSB3b3JrW2l3dXYgKyBpXSAtIHQxICogd29ya1tpd3J2ICsgaV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHdvcmtbaXd1diArIG5hY3QgKyAxXSA9IHdvcmtbaXd1diArIG5hY3QgKyAxXSArIHQxO1xuICAgICAgICAgICAgICAgIC8vIEdPVE8gNzAwXG4gICAgICAgICAgICAgICAgcmV0dXJuIDcwMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHN1bSA9IDA7XG4gICAgICAgICAgICBmb3IgKGkgPSAxOyBpIDw9IG47IGkgPSBpICsgMSkge1xuICAgICAgICAgICAgICAgIHN1bSA9IHN1bSArIHdvcmtbaXd6diArIGldICogYW1hdFtpXVtudmxdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdHQgPSAtd29ya1tpd3N2ICsgbnZsXSAvIHN1bTtcbiAgICAgICAgICAgIHQybWluID0gdHJ1ZTtcbiAgICAgICAgICAgIGlmICghdDFpbmYpIHtcbiAgICAgICAgICAgICAgICBpZiAodDEgPCB0dCkge1xuICAgICAgICAgICAgICAgICAgICB0dCA9IHQxO1xuICAgICAgICAgICAgICAgICAgICB0Mm1pbiA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZm9yIChpID0gMTsgaSA8PSBuOyBpID0gaSArIDEpIHtcbiAgICAgICAgICAgICAgICBzb2xbaV0gPSBzb2xbaV0gKyB0dCAqIHdvcmtbaXd6diArIGldO1xuICAgICAgICAgICAgICAgIGlmIChNYXRoLmFicyhzb2xbaV0pIDwgdnNtYWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIHNvbFtpXSA9IDA7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjcnZhbFsxXSA9IGNydmFsWzFdICsgdHQgKiBzdW0gKiAodHQgLyAyICsgd29ya1tpd3V2ICsgbmFjdCArIDFdKTtcbiAgICAgICAgICAgIGZvciAoaSA9IDE7IGkgPD0gbmFjdDsgaSA9IGkgKyAxKSB7XG4gICAgICAgICAgICAgICAgd29ya1tpd3V2ICsgaV0gPSB3b3JrW2l3dXYgKyBpXSAtIHR0ICogd29ya1tpd3J2ICsgaV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB3b3JrW2l3dXYgKyBuYWN0ICsgMV0gPSB3b3JrW2l3dXYgKyBuYWN0ICsgMV0gKyB0dDtcblxuICAgICAgICAgICAgaWYgKHQybWluKSB7XG4gICAgICAgICAgICAgICAgbmFjdCA9IG5hY3QgKyAxO1xuICAgICAgICAgICAgICAgIGlhY3RbbmFjdF0gPSBudmw7XG5cbiAgICAgICAgICAgICAgICBsID0gaXdybSArICgobmFjdCAtIDEpICogbmFjdCkgLyAyICsgMTtcbiAgICAgICAgICAgICAgICBmb3IgKGkgPSAxOyBpIDw9IG5hY3QgLSAxOyBpID0gaSArIDEpIHtcbiAgICAgICAgICAgICAgICAgICAgd29ya1tsXSA9IHdvcmtbaV07XG4gICAgICAgICAgICAgICAgICAgIGwgPSBsICsgMTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAobmFjdCA9PT0gbikge1xuICAgICAgICAgICAgICAgICAgICB3b3JrW2xdID0gd29ya1tuXTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGkgPSBuOyBpID49IG5hY3QgKyAxOyBpID0gaSAtIDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh3b3JrW2ldID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBnYyA9IE1hdGgubWF4KE1hdGguYWJzKHdvcmtbaSAtIDFdKSwgTWF0aC5hYnMod29ya1tpXSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZ3MgPSBNYXRoLm1pbihNYXRoLmFicyh3b3JrW2kgLSAxXSksIE1hdGguYWJzKHdvcmtbaV0pKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh3b3JrW2kgLSAxXSA+PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGVtcCA9IE1hdGguYWJzKGdjICogTWF0aC5zcXJ0KDEgKyBncyAqIGdzIC8gKGdjICogZ2MpKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRlbXAgPSAtTWF0aC5hYnMoZ2MgKiBNYXRoLnNxcnQoMSArIGdzICogZ3MgLyAoZ2MgKiBnYykpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGdjID0gd29ya1tpIC0gMV0gLyB0ZW1wO1xuICAgICAgICAgICAgICAgICAgICAgICAgZ3MgPSB3b3JrW2ldIC8gdGVtcDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGdjID09PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZ2MgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3b3JrW2kgLSAxXSA9IGdzICogdGVtcDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGogPSAxOyBqIDw9IG47IGogPSBqICsgMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZW1wID0gZG1hdFtqXVtpIC0gMV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRtYXRbal1baSAtIDFdID0gZG1hdFtqXVtpXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZG1hdFtqXVtpXSA9IHRlbXA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3b3JrW2kgLSAxXSA9IHRlbXA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbnUgPSBncyAvICgxICsgZ2MpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoaiA9IDE7IGogPD0gbjsgaiA9IGogKyAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRlbXAgPSBnYyAqIGRtYXRbal1baSAtIDFdICsgZ3MgKiBkbWF0W2pdW2ldO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkbWF0W2pdW2ldID0gbnUgKiAoZG1hdFtqXVtpIC0gMV0gKyB0ZW1wKSAtIGRtYXRbal1baV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRtYXRbal1baSAtIDFdID0gdGVtcDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB3b3JrW2xdID0gd29ya1tuYWN0XTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHN1bSA9IC1idmVjW252bF07XG4gICAgICAgICAgICAgICAgZm9yIChqID0gMTsgaiA8PSBuOyBqID0gaiArIDEpIHtcbiAgICAgICAgICAgICAgICAgICAgc3VtID0gc3VtICsgc29sW2pdICogYW1hdFtqXVtudmxdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAobnZsID4gbWVxKSB7XG4gICAgICAgICAgICAgICAgICAgIHdvcmtbaXdzdiArIG52bF0gPSBzdW07XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgd29ya1tpd3N2ICsgbnZsXSA9IC1NYXRoLmFicyhzdW0pO1xuICAgICAgICAgICAgICAgICAgICBpZiAoc3VtID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChqID0gMTsgaiA8PSBuOyBqID0gaiArIDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbWF0W2pdW252bF0gPSAtYW1hdFtqXVtudmxdO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgYnZlY1tudmxdID0gLWJ2ZWNbbnZsXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBHT1RPIDcwMFxuICAgICAgICAgICAgICAgIHJldHVybiA3MDA7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gMDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBmbl9nb3RvXzc5NygpIHtcbiAgICAgICAgbCA9IGl3cm0gKyAoaXQxICogKGl0MSArIDEpKSAvIDIgKyAxO1xuICAgICAgICBsMSA9IGwgKyBpdDE7XG4gICAgICAgIGlmICh3b3JrW2wxXSA9PT0gMCkge1xuICAgICAgICAgICAgLy8gR09UTyA3OThcbiAgICAgICAgICAgIHJldHVybiA3OTg7XG4gICAgICAgIH1cbiAgICAgICAgZ2MgPSBNYXRoLm1heChNYXRoLmFicyh3b3JrW2wxIC0gMV0pLCBNYXRoLmFicyh3b3JrW2wxXSkpO1xuICAgICAgICBncyA9IE1hdGgubWluKE1hdGguYWJzKHdvcmtbbDEgLSAxXSksIE1hdGguYWJzKHdvcmtbbDFdKSk7XG4gICAgICAgIGlmICh3b3JrW2wxIC0gMV0gPj0gMCkge1xuICAgICAgICAgICAgdGVtcCA9IE1hdGguYWJzKGdjICogTWF0aC5zcXJ0KDEgKyBncyAqIGdzIC8gKGdjICogZ2MpKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0ZW1wID0gLU1hdGguYWJzKGdjICogTWF0aC5zcXJ0KDEgKyBncyAqIGdzIC8gKGdjICogZ2MpKSk7XG4gICAgICAgIH1cbiAgICAgICAgZ2MgPSB3b3JrW2wxIC0gMV0gLyB0ZW1wO1xuICAgICAgICBncyA9IHdvcmtbbDFdIC8gdGVtcDtcblxuICAgICAgICBpZiAoZ2MgPT09IDEpIHtcbiAgICAgICAgICAgIC8vIEdPVE8gNzk4XG4gICAgICAgICAgICByZXR1cm4gNzk4O1xuICAgICAgICB9XG4gICAgICAgIGlmIChnYyA9PT0gMCkge1xuICAgICAgICAgICAgZm9yIChpID0gaXQxICsgMTsgaSA8PSBuYWN0OyBpID0gaSArIDEpIHtcbiAgICAgICAgICAgICAgICB0ZW1wID0gd29ya1tsMSAtIDFdO1xuICAgICAgICAgICAgICAgIHdvcmtbbDEgLSAxXSA9IHdvcmtbbDFdO1xuICAgICAgICAgICAgICAgIHdvcmtbbDFdID0gdGVtcDtcbiAgICAgICAgICAgICAgICBsMSA9IGwxICsgaTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZvciAoaSA9IDE7IGkgPD0gbjsgaSA9IGkgKyAxKSB7XG4gICAgICAgICAgICAgICAgdGVtcCA9IGRtYXRbaV1baXQxXTtcbiAgICAgICAgICAgICAgICBkbWF0W2ldW2l0MV0gPSBkbWF0W2ldW2l0MSArIDFdO1xuICAgICAgICAgICAgICAgIGRtYXRbaV1baXQxICsgMV0gPSB0ZW1wO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbnUgPSBncyAvICgxICsgZ2MpO1xuICAgICAgICAgICAgZm9yIChpID0gaXQxICsgMTsgaSA8PSBuYWN0OyBpID0gaSArIDEpIHtcbiAgICAgICAgICAgICAgICB0ZW1wID0gZ2MgKiB3b3JrW2wxIC0gMV0gKyBncyAqIHdvcmtbbDFdO1xuICAgICAgICAgICAgICAgIHdvcmtbbDFdID0gbnUgKiAod29ya1tsMSAtIDFdICsgdGVtcCkgLSB3b3JrW2wxXTtcbiAgICAgICAgICAgICAgICB3b3JrW2wxIC0gMV0gPSB0ZW1wO1xuICAgICAgICAgICAgICAgIGwxID0gbDEgKyBpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZm9yIChpID0gMTsgaSA8PSBuOyBpID0gaSArIDEpIHtcbiAgICAgICAgICAgICAgICB0ZW1wID0gZ2MgKiBkbWF0W2ldW2l0MV0gKyBncyAqIGRtYXRbaV1baXQxICsgMV07XG4gICAgICAgICAgICAgICAgZG1hdFtpXVtpdDEgKyAxXSA9IG51ICogKGRtYXRbaV1baXQxXSArIHRlbXApIC0gZG1hdFtpXVtpdDEgKyAxXTtcbiAgICAgICAgICAgICAgICBkbWF0W2ldW2l0MV0gPSB0ZW1wO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIDA7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZm5fZ290b183OTgoKSB7XG4gICAgICAgIGwxID0gbCAtIGl0MTtcbiAgICAgICAgZm9yIChpID0gMTsgaSA8PSBpdDE7IGkgPSBpICsgMSkge1xuICAgICAgICAgICAgd29ya1tsMV0gPSB3b3JrW2xdO1xuICAgICAgICAgICAgbCA9IGwgKyAxO1xuICAgICAgICAgICAgbDEgPSBsMSArIDE7XG4gICAgICAgIH1cblxuICAgICAgICB3b3JrW2l3dXYgKyBpdDFdID0gd29ya1tpd3V2ICsgaXQxICsgMV07XG4gICAgICAgIGlhY3RbaXQxXSA9IGlhY3RbaXQxICsgMV07XG4gICAgICAgIGl0MSA9IGl0MSArIDE7XG4gICAgICAgIGlmIChpdDEgPCBuYWN0KSB7XG4gICAgICAgICAgICAvLyBHT1RPIDc5N1xuICAgICAgICAgICAgcmV0dXJuIDc5NztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiAwO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGZuX2dvdG9fNzk5KCkge1xuICAgICAgICB3b3JrW2l3dXYgKyBuYWN0XSA9IHdvcmtbaXd1diArIG5hY3QgKyAxXTtcbiAgICAgICAgd29ya1tpd3V2ICsgbmFjdCArIDFdID0gMDtcbiAgICAgICAgaWFjdFtuYWN0XSA9IDA7XG4gICAgICAgIG5hY3QgPSBuYWN0IC0gMTtcbiAgICAgICAgaXRlclsyXSA9IGl0ZXJbMl0gKyAxO1xuXG4gICAgICAgIHJldHVybiAwO1xuICAgIH1cblxuICAgIGdvID0gMDtcbiAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgICBnbyA9IGZuX2dvdG9fNTAoKTtcbiAgICAgICAgaWYgKGdvID09PSA5OTkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgICAgICAgZ28gPSBmbl9nb3RvXzU1KCk7XG4gICAgICAgICAgICBpZiAoZ28gPT09IDApIHtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChnbyA9PT0gOTk5KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGdvID09PSA3MDApIHtcbiAgICAgICAgICAgICAgICBpZiAoaXQxID09PSBuYWN0KSB7XG4gICAgICAgICAgICAgICAgICAgIGZuX2dvdG9fNzk5KCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgd2hpbGUgKHRydWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZuX2dvdG9fNzk3KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBnbyA9IGZuX2dvdG9fNzk4KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZ28gIT09IDc5Nykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGZuX2dvdG9fNzk5KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG59XG5cbmZ1bmN0aW9uIHNvbHZlUVAoRG1hdCwgZHZlYywgQW1hdCwgYnZlYywgbWVxLCBmYWN0b3JpemVkKSB7XG4gICAgRG1hdCA9IGJhc2UwdG8xKERtYXQpO1xuICAgIGR2ZWMgPSBiYXNlMHRvMShkdmVjKTtcbiAgICBBbWF0ID0gYmFzZTB0bzEoQW1hdCk7XG4gICAgdmFyIGksIG4sIHEsXG4gICAgICAgIG5hY3QsIHIsXG4gICAgICAgIGNydmFsID0gW10sIGlhY3QgPSBbXSwgc29sID0gW10sIHdvcmsgPSBbXSwgaXRlciA9IFtdLFxuICAgICAgICBtZXNzYWdlO1xuXG4gICAgbWVxID0gbWVxIHx8IDA7XG4gICAgZmFjdG9yaXplZCA9IGZhY3Rvcml6ZWQgPyBiYXNlMHRvMShmYWN0b3JpemVkKSA6IFt1bmRlZmluZWQsIDBdO1xuICAgIGJ2ZWMgPSBidmVjID8gYmFzZTB0bzEoYnZlYykgOiBbXTtcblxuICAgIC8vIEluIEZvcnRyYW4gdGhlIGFycmF5IGluZGV4IHN0YXJ0cyBmcm9tIDFcbiAgICBuID0gRG1hdC5sZW5ndGggLSAxO1xuICAgIHEgPSBBbWF0WzFdLmxlbmd0aCAtIDE7XG5cbiAgICBpZiAoIWJ2ZWMpIHtcbiAgICAgICAgZm9yIChpID0gMTsgaSA8PSBxOyBpID0gaSArIDEpIHtcbiAgICAgICAgICAgIGJ2ZWNbaV0gPSAwO1xuICAgICAgICB9XG4gICAgfVxuICAgIGZvciAoaSA9IDE7IGkgPD0gcTsgaSA9IGkgKyAxKSB7XG4gICAgICAgIGlhY3RbaV0gPSAwO1xuICAgIH1cbiAgICBuYWN0ID0gMDtcbiAgICByID0gTWF0aC5taW4obiwgcSk7XG4gICAgZm9yIChpID0gMTsgaSA8PSBuOyBpID0gaSArIDEpIHtcbiAgICAgICAgc29sW2ldID0gMDtcbiAgICB9XG4gICAgY3J2YWxbMV0gPSAwO1xuICAgIGZvciAoaSA9IDE7IGkgPD0gKDIgKiBuICsgKHIgKiAociArIDUpKSAvIDIgKyAyICogcSArIDEpOyBpID0gaSArIDEpIHtcbiAgICAgICAgd29ya1tpXSA9IDA7XG4gICAgfVxuICAgIGZvciAoaSA9IDE7IGkgPD0gMjsgaSA9IGkgKyAxKSB7XG4gICAgICAgIGl0ZXJbaV0gPSAwO1xuICAgIH1cblxuICAgIHFwZ2VuMihEbWF0LCBkdmVjLCBuLCBuLCBzb2wsIGNydmFsLCBBbWF0LFxuICAgICAgICBidmVjLCBuLCBxLCBtZXEsIGlhY3QsIG5hY3QsIGl0ZXIsIHdvcmssIGZhY3Rvcml6ZWQpO1xuXG4gICAgbWVzc2FnZSA9IFwiXCI7XG4gICAgaWYgKGZhY3Rvcml6ZWRbMV0gPT09IDEpIHtcbiAgICAgICAgbWVzc2FnZSA9IFwiY29uc3RyYWludHMgYXJlIGluY29uc2lzdGVudCwgbm8gc29sdXRpb24hXCI7XG4gICAgfVxuICAgIGlmIChmYWN0b3JpemVkWzFdID09PSAyKSB7XG4gICAgICAgIG1lc3NhZ2UgPSBcIm1hdHJpeCBEIGluIHF1YWRyYXRpYyBmdW5jdGlvbiBpcyBub3QgcG9zaXRpdmUgZGVmaW5pdGUhXCI7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgc29sdXRpb246IGJhc2UxdG8wKHNvbCksXG4gICAgICAgIHZhbHVlOiBiYXNlMXRvMChjcnZhbCksXG4gICAgICAgIHVuY29uc3RyYWluZWRfc29sdXRpb246IGJhc2UxdG8wKGR2ZWMpLFxuICAgICAgICBpdGVyYXRpb25zOiBiYXNlMXRvMChpdGVyKSxcbiAgICAgICAgaWFjdDogYmFzZTF0bzAoaWFjdCksXG4gICAgICAgIG1lc3NhZ2U6IG1lc3NhZ2VcbiAgICB9O1xufVxuZXhwb3J0cy5zb2x2ZVFQID0gc29sdmVRUDtcbn0obnVtZXJpYykpO1xuLypcclxuU2hhbnRpIFJhbyBzZW50IG1lIHRoaXMgcm91dGluZSBieSBwcml2YXRlIGVtYWlsLiBJIGhhZCB0byBtb2RpZnkgaXRcclxuc2xpZ2h0bHkgdG8gd29yayBvbiBBcnJheXMgaW5zdGVhZCBvZiB1c2luZyBhIE1hdHJpeCBvYmplY3QuXHJcbkl0IGlzIGFwcGFyZW50bHkgdHJhbnNsYXRlZCBmcm9tIGh0dHA6Ly9zdGl0Y2hwYW5vcmFtYS5zb3VyY2Vmb3JnZS5uZXQvUHl0aG9uL3N2ZC5weVxyXG4qL1xyXG5cclxubnVtZXJpYy5zdmQ9IGZ1bmN0aW9uIHN2ZChBKSB7XHJcbiAgICB2YXIgdGVtcDtcclxuLy9Db21wdXRlIHRoZSB0aGluIFNWRCBmcm9tIEcuIEguIEdvbHViIGFuZCBDLiBSZWluc2NoLCBOdW1lci4gTWF0aC4gMTQsIDQwMy00MjAgKDE5NzApXHJcblx0dmFyIHByZWM9IG51bWVyaWMuZXBzaWxvbjsgLy9NYXRoLnBvdygyLC01MikgLy8gYXNzdW1lcyBkb3VibGUgcHJlY1xyXG5cdHZhciB0b2xlcmFuY2U9IDEuZS02NC9wcmVjO1xyXG5cdHZhciBpdG1heD0gNTA7XHJcblx0dmFyIGM9MDtcclxuXHR2YXIgaT0wO1xyXG5cdHZhciBqPTA7XHJcblx0dmFyIGs9MDtcclxuXHR2YXIgbD0wO1xyXG5cdFxyXG5cdHZhciB1PSBudW1lcmljLmNsb25lKEEpO1xyXG5cdHZhciBtPSB1Lmxlbmd0aDtcclxuXHRcclxuXHR2YXIgbj0gdVswXS5sZW5ndGg7XHJcblx0XHJcblx0aWYgKG0gPCBuKSB0aHJvdyBcIk5lZWQgbW9yZSByb3dzIHRoYW4gY29sdW1uc1wiXHJcblx0XHJcblx0dmFyIGUgPSBuZXcgQXJyYXkobik7XHJcblx0dmFyIHEgPSBuZXcgQXJyYXkobik7XHJcblx0Zm9yIChpPTA7IGk8bjsgaSsrKSBlW2ldID0gcVtpXSA9IDAuMDtcclxuXHR2YXIgdiA9IG51bWVyaWMucmVwKFtuLG5dLDApO1xyXG4vL1x0di56ZXJvKCk7XHJcblx0XHJcbiBcdGZ1bmN0aW9uIHB5dGhhZyhhLGIpXHJcbiBcdHtcclxuXHRcdGEgPSBNYXRoLmFicyhhKVxyXG5cdFx0YiA9IE1hdGguYWJzKGIpXHJcblx0XHRpZiAoYSA+IGIpXHJcblx0XHRcdHJldHVybiBhKk1hdGguc3FydCgxLjArKGIqYi9hL2EpKVxyXG5cdFx0ZWxzZSBpZiAoYiA9PSAwLjApIFxyXG5cdFx0XHRyZXR1cm4gYVxyXG5cdFx0cmV0dXJuIGIqTWF0aC5zcXJ0KDEuMCsoYSphL2IvYikpXHJcblx0fVxyXG5cclxuXHQvL0hvdXNlaG9sZGVyJ3MgcmVkdWN0aW9uIHRvIGJpZGlhZ29uYWwgZm9ybVxyXG5cclxuXHR2YXIgZj0gMC4wO1xyXG5cdHZhciBnPSAwLjA7XHJcblx0dmFyIGg9IDAuMDtcclxuXHR2YXIgeD0gMC4wO1xyXG5cdHZhciB5PSAwLjA7XHJcblx0dmFyIHo9IDAuMDtcclxuXHR2YXIgcz0gMC4wO1xyXG5cdFxyXG5cdGZvciAoaT0wOyBpIDwgbjsgaSsrKVxyXG5cdHtcdFxyXG5cdFx0ZVtpXT0gZztcclxuXHRcdHM9IDAuMDtcclxuXHRcdGw9IGkrMTtcclxuXHRcdGZvciAoaj1pOyBqIDwgbTsgaisrKSBcclxuXHRcdFx0cyArPSAodVtqXVtpXSp1W2pdW2ldKTtcclxuXHRcdGlmIChzIDw9IHRvbGVyYW5jZSlcclxuXHRcdFx0Zz0gMC4wO1xyXG5cdFx0ZWxzZVxyXG5cdFx0e1x0XHJcblx0XHRcdGY9IHVbaV1baV07XHJcblx0XHRcdGc9IE1hdGguc3FydChzKTtcclxuXHRcdFx0aWYgKGYgPj0gMC4wKSBnPSAtZztcclxuXHRcdFx0aD0gZipnLXNcclxuXHRcdFx0dVtpXVtpXT1mLWc7XHJcblx0XHRcdGZvciAoaj1sOyBqIDwgbjsgaisrKVxyXG5cdFx0XHR7XHJcblx0XHRcdFx0cz0gMC4wXHJcblx0XHRcdFx0Zm9yIChrPWk7IGsgPCBtOyBrKyspIFxyXG5cdFx0XHRcdFx0cyArPSB1W2tdW2ldKnVba11bal1cclxuXHRcdFx0XHRmPSBzL2hcclxuXHRcdFx0XHRmb3IgKGs9aTsgayA8IG07IGsrKykgXHJcblx0XHRcdFx0XHR1W2tdW2pdKz1mKnVba11baV1cclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0cVtpXT0gZ1xyXG5cdFx0cz0gMC4wXHJcblx0XHRmb3IgKGo9bDsgaiA8IG47IGorKykgXHJcblx0XHRcdHM9IHMgKyB1W2ldW2pdKnVbaV1bal1cclxuXHRcdGlmIChzIDw9IHRvbGVyYW5jZSlcclxuXHRcdFx0Zz0gMC4wXHJcblx0XHRlbHNlXHJcblx0XHR7XHRcclxuXHRcdFx0Zj0gdVtpXVtpKzFdXHJcblx0XHRcdGc9IE1hdGguc3FydChzKVxyXG5cdFx0XHRpZiAoZiA+PSAwLjApIGc9IC1nXHJcblx0XHRcdGg9IGYqZyAtIHNcclxuXHRcdFx0dVtpXVtpKzFdID0gZi1nO1xyXG5cdFx0XHRmb3IgKGo9bDsgaiA8IG47IGorKykgZVtqXT0gdVtpXVtqXS9oXHJcblx0XHRcdGZvciAoaj1sOyBqIDwgbTsgaisrKVxyXG5cdFx0XHR7XHRcclxuXHRcdFx0XHRzPTAuMFxyXG5cdFx0XHRcdGZvciAoaz1sOyBrIDwgbjsgaysrKSBcclxuXHRcdFx0XHRcdHMgKz0gKHVbal1ba10qdVtpXVtrXSlcclxuXHRcdFx0XHRmb3IgKGs9bDsgayA8IG47IGsrKykgXHJcblx0XHRcdFx0XHR1W2pdW2tdKz1zKmVba11cclxuXHRcdFx0fVx0XHJcblx0XHR9XHJcblx0XHR5PSBNYXRoLmFicyhxW2ldKStNYXRoLmFicyhlW2ldKVxyXG5cdFx0aWYgKHk+eCkgXHJcblx0XHRcdHg9eVxyXG5cdH1cclxuXHRcclxuXHQvLyBhY2N1bXVsYXRpb24gb2YgcmlnaHQgaGFuZCBndHJhbnNmb3JtYXRpb25zXHJcblx0Zm9yIChpPW4tMTsgaSAhPSAtMTsgaSs9IC0xKVxyXG5cdHtcdFxyXG5cdFx0aWYgKGcgIT0gMC4wKVxyXG5cdFx0e1xyXG5cdFx0IFx0aD0gZyp1W2ldW2krMV1cclxuXHRcdFx0Zm9yIChqPWw7IGogPCBuOyBqKyspIFxyXG5cdFx0XHRcdHZbal1baV09dVtpXVtqXS9oXHJcblx0XHRcdGZvciAoaj1sOyBqIDwgbjsgaisrKVxyXG5cdFx0XHR7XHRcclxuXHRcdFx0XHRzPTAuMFxyXG5cdFx0XHRcdGZvciAoaz1sOyBrIDwgbjsgaysrKSBcclxuXHRcdFx0XHRcdHMgKz0gdVtpXVtrXSp2W2tdW2pdXHJcblx0XHRcdFx0Zm9yIChrPWw7IGsgPCBuOyBrKyspIFxyXG5cdFx0XHRcdFx0dltrXVtqXSs9KHMqdltrXVtpXSlcclxuXHRcdFx0fVx0XHJcblx0XHR9XHJcblx0XHRmb3IgKGo9bDsgaiA8IG47IGorKylcclxuXHRcdHtcclxuXHRcdFx0dltpXVtqXSA9IDA7XHJcblx0XHRcdHZbal1baV0gPSAwO1xyXG5cdFx0fVxyXG5cdFx0dltpXVtpXSA9IDE7XHJcblx0XHRnPSBlW2ldXHJcblx0XHRsPSBpXHJcblx0fVxyXG5cdFxyXG5cdC8vIGFjY3VtdWxhdGlvbiBvZiBsZWZ0IGhhbmQgdHJhbnNmb3JtYXRpb25zXHJcblx0Zm9yIChpPW4tMTsgaSAhPSAtMTsgaSs9IC0xKVxyXG5cdHtcdFxyXG5cdFx0bD0gaSsxXHJcblx0XHRnPSBxW2ldXHJcblx0XHRmb3IgKGo9bDsgaiA8IG47IGorKykgXHJcblx0XHRcdHVbaV1bal0gPSAwO1xyXG5cdFx0aWYgKGcgIT0gMC4wKVxyXG5cdFx0e1xyXG5cdFx0XHRoPSB1W2ldW2ldKmdcclxuXHRcdFx0Zm9yIChqPWw7IGogPCBuOyBqKyspXHJcblx0XHRcdHtcclxuXHRcdFx0XHRzPTAuMFxyXG5cdFx0XHRcdGZvciAoaz1sOyBrIDwgbTsgaysrKSBzICs9IHVba11baV0qdVtrXVtqXTtcclxuXHRcdFx0XHRmPSBzL2hcclxuXHRcdFx0XHRmb3IgKGs9aTsgayA8IG07IGsrKykgdVtrXVtqXSs9Zip1W2tdW2ldO1xyXG5cdFx0XHR9XHJcblx0XHRcdGZvciAoaj1pOyBqIDwgbTsgaisrKSB1W2pdW2ldID0gdVtqXVtpXS9nO1xyXG5cdFx0fVxyXG5cdFx0ZWxzZVxyXG5cdFx0XHRmb3IgKGo9aTsgaiA8IG07IGorKykgdVtqXVtpXSA9IDA7XHJcblx0XHR1W2ldW2ldICs9IDE7XHJcblx0fVxyXG5cdFxyXG5cdC8vIGRpYWdvbmFsaXphdGlvbiBvZiB0aGUgYmlkaWFnb25hbCBmb3JtXHJcblx0cHJlYz0gcHJlYyp4XHJcblx0Zm9yIChrPW4tMTsgayAhPSAtMTsgays9IC0xKVxyXG5cdHtcclxuXHRcdGZvciAodmFyIGl0ZXJhdGlvbj0wOyBpdGVyYXRpb24gPCBpdG1heDsgaXRlcmF0aW9uKyspXHJcblx0XHR7XHQvLyB0ZXN0IGYgc3BsaXR0aW5nXHJcblx0XHRcdHZhciB0ZXN0X2NvbnZlcmdlbmNlID0gZmFsc2VcclxuXHRcdFx0Zm9yIChsPWs7IGwgIT0gLTE7IGwrPSAtMSlcclxuXHRcdFx0e1x0XHJcblx0XHRcdFx0aWYgKE1hdGguYWJzKGVbbF0pIDw9IHByZWMpXHJcblx0XHRcdFx0e1x0dGVzdF9jb252ZXJnZW5jZT0gdHJ1ZVxyXG5cdFx0XHRcdFx0YnJlYWsgXHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmIChNYXRoLmFicyhxW2wtMV0pIDw9IHByZWMpXHJcblx0XHRcdFx0XHRicmVhayBcclxuXHRcdFx0fVxyXG5cdFx0XHRpZiAoIXRlc3RfY29udmVyZ2VuY2UpXHJcblx0XHRcdHtcdC8vIGNhbmNlbGxhdGlvbiBvZiBlW2xdIGlmIGw+MFxyXG5cdFx0XHRcdGM9IDAuMFxyXG5cdFx0XHRcdHM9IDEuMFxyXG5cdFx0XHRcdHZhciBsMT0gbC0xXHJcblx0XHRcdFx0Zm9yIChpID1sOyBpPGsrMTsgaSsrKVxyXG5cdFx0XHRcdHtcdFxyXG5cdFx0XHRcdFx0Zj0gcyplW2ldXHJcblx0XHRcdFx0XHRlW2ldPSBjKmVbaV1cclxuXHRcdFx0XHRcdGlmIChNYXRoLmFicyhmKSA8PSBwcmVjKVxyXG5cdFx0XHRcdFx0XHRicmVha1xyXG5cdFx0XHRcdFx0Zz0gcVtpXVxyXG5cdFx0XHRcdFx0aD0gcHl0aGFnKGYsZylcclxuXHRcdFx0XHRcdHFbaV09IGhcclxuXHRcdFx0XHRcdGM9IGcvaFxyXG5cdFx0XHRcdFx0cz0gLWYvaFxyXG5cdFx0XHRcdFx0Zm9yIChqPTA7IGogPCBtOyBqKyspXHJcblx0XHRcdFx0XHR7XHRcclxuXHRcdFx0XHRcdFx0eT0gdVtqXVtsMV1cclxuXHRcdFx0XHRcdFx0ej0gdVtqXVtpXVxyXG5cdFx0XHRcdFx0XHR1W2pdW2wxXSA9ICB5KmMrKHoqcylcclxuXHRcdFx0XHRcdFx0dVtqXVtpXSA9IC15KnMrKHoqYylcclxuXHRcdFx0XHRcdH0gXHJcblx0XHRcdFx0fVx0XHJcblx0XHRcdH1cclxuXHRcdFx0Ly8gdGVzdCBmIGNvbnZlcmdlbmNlXHJcblx0XHRcdHo9IHFba11cclxuXHRcdFx0aWYgKGw9PSBrKVxyXG5cdFx0XHR7XHQvL2NvbnZlcmdlbmNlXHJcblx0XHRcdFx0aWYgKHo8MC4wKVxyXG5cdFx0XHRcdHtcdC8vcVtrXSBpcyBtYWRlIG5vbi1uZWdhdGl2ZVxyXG5cdFx0XHRcdFx0cVtrXT0gLXpcclxuXHRcdFx0XHRcdGZvciAoaj0wOyBqIDwgbjsgaisrKVxyXG5cdFx0XHRcdFx0XHR2W2pdW2tdID0gLXZbal1ba11cclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0YnJlYWsgIC8vYnJlYWsgb3V0IG9mIGl0ZXJhdGlvbiBsb29wIGFuZCBtb3ZlIG9uIHRvIG5leHQgayB2YWx1ZVxyXG5cdFx0XHR9XHJcblx0XHRcdGlmIChpdGVyYXRpb24gPj0gaXRtYXgtMSlcclxuXHRcdFx0XHR0aHJvdyAnRXJyb3I6IG5vIGNvbnZlcmdlbmNlLidcclxuXHRcdFx0Ly8gc2hpZnQgZnJvbSBib3R0b20gMngyIG1pbm9yXHJcblx0XHRcdHg9IHFbbF1cclxuXHRcdFx0eT0gcVtrLTFdXHJcblx0XHRcdGc9IGVbay0xXVxyXG5cdFx0XHRoPSBlW2tdXHJcblx0XHRcdGY9ICgoeS16KSooeSt6KSsoZy1oKSooZytoKSkvKDIuMCpoKnkpXHJcblx0XHRcdGc9IHB5dGhhZyhmLDEuMClcclxuXHRcdFx0aWYgKGYgPCAwLjApXHJcblx0XHRcdFx0Zj0gKCh4LXopKih4K3opK2gqKHkvKGYtZyktaCkpL3hcclxuXHRcdFx0ZWxzZVxyXG5cdFx0XHRcdGY9ICgoeC16KSooeCt6KStoKih5LyhmK2cpLWgpKS94XHJcblx0XHRcdC8vIG5leHQgUVIgdHJhbnNmb3JtYXRpb25cclxuXHRcdFx0Yz0gMS4wXHJcblx0XHRcdHM9IDEuMFxyXG5cdFx0XHRmb3IgKGk9bCsxOyBpPCBrKzE7IGkrKylcclxuXHRcdFx0e1x0XHJcblx0XHRcdFx0Zz0gZVtpXVxyXG5cdFx0XHRcdHk9IHFbaV1cclxuXHRcdFx0XHRoPSBzKmdcclxuXHRcdFx0XHRnPSBjKmdcclxuXHRcdFx0XHR6PSBweXRoYWcoZixoKVxyXG5cdFx0XHRcdGVbaS0xXT0gelxyXG5cdFx0XHRcdGM9IGYvelxyXG5cdFx0XHRcdHM9IGgvelxyXG5cdFx0XHRcdGY9IHgqYytnKnNcclxuXHRcdFx0XHRnPSAteCpzK2cqY1xyXG5cdFx0XHRcdGg9IHkqc1xyXG5cdFx0XHRcdHk9IHkqY1xyXG5cdFx0XHRcdGZvciAoaj0wOyBqIDwgbjsgaisrKVxyXG5cdFx0XHRcdHtcdFxyXG5cdFx0XHRcdFx0eD0gdltqXVtpLTFdXHJcblx0XHRcdFx0XHR6PSB2W2pdW2ldXHJcblx0XHRcdFx0XHR2W2pdW2ktMV0gPSB4KmMreipzXHJcblx0XHRcdFx0XHR2W2pdW2ldID0gLXgqcyt6KmNcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0ej0gcHl0aGFnKGYsaClcclxuXHRcdFx0XHRxW2ktMV09IHpcclxuXHRcdFx0XHRjPSBmL3pcclxuXHRcdFx0XHRzPSBoL3pcclxuXHRcdFx0XHRmPSBjKmcrcyp5XHJcblx0XHRcdFx0eD0gLXMqZytjKnlcclxuXHRcdFx0XHRmb3IgKGo9MDsgaiA8IG07IGorKylcclxuXHRcdFx0XHR7XHJcblx0XHRcdFx0XHR5PSB1W2pdW2ktMV1cclxuXHRcdFx0XHRcdHo9IHVbal1baV1cclxuXHRcdFx0XHRcdHVbal1baS0xXSA9IHkqYyt6KnNcclxuXHRcdFx0XHRcdHVbal1baV0gPSAteSpzK3oqY1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0XHRlW2xdPSAwLjBcclxuXHRcdFx0ZVtrXT0gZlxyXG5cdFx0XHRxW2tdPSB4XHJcblx0XHR9IFxyXG5cdH1cclxuXHRcdFxyXG5cdC8vdnQ9IHRyYW5zcG9zZSh2KVxyXG5cdC8vcmV0dXJuICh1LHEsdnQpXHJcblx0Zm9yIChpPTA7aTxxLmxlbmd0aDsgaSsrKSBcclxuXHQgIGlmIChxW2ldIDwgcHJlYykgcVtpXSA9IDBcclxuXHQgIFxyXG5cdC8vc29ydCBlaWdlbnZhbHVlc1x0XHJcblx0Zm9yIChpPTA7IGk8IG47IGkrKylcclxuXHR7XHQgXHJcblx0Ly93cml0ZWxuKHEpXHJcblx0IGZvciAoaj1pLTE7IGogPj0gMDsgai0tKVxyXG5cdCB7XHJcblx0ICBpZiAocVtqXSA8IHFbaV0pXHJcblx0ICB7XHJcblx0Ly8gIHdyaXRlbG4oaSwnLScsailcclxuXHQgICBjID0gcVtqXVxyXG5cdCAgIHFbal0gPSBxW2ldXHJcblx0ICAgcVtpXSA9IGNcclxuXHQgICBmb3Ioaz0wO2s8dS5sZW5ndGg7aysrKSB7IHRlbXAgPSB1W2tdW2ldOyB1W2tdW2ldID0gdVtrXVtqXTsgdVtrXVtqXSA9IHRlbXA7IH1cclxuXHQgICBmb3Ioaz0wO2s8di5sZW5ndGg7aysrKSB7IHRlbXAgPSB2W2tdW2ldOyB2W2tdW2ldID0gdltrXVtqXTsgdltrXVtqXSA9IHRlbXA7IH1cclxuLy9cdCAgIHUuc3dhcENvbHMoaSxqKVxyXG4vL1x0ICAgdi5zd2FwQ29scyhpLGopXHJcblx0ICAgaSA9IGpcdCAgIFxyXG5cdCAgfVxyXG5cdCB9XHRcclxuXHR9XHJcblx0XHJcblx0cmV0dXJuIHtVOnUsUzpxLFY6dn1cclxufTtcclxuXHJcbiIsIi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyAgQXJjaG9udGlzIFBvbGl0aXNcbi8vICBhcmNob250aXMucG9saXRpc0BhYWx0by5maVxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vXG4vLyAgQSBKYXZhU2NyaXB0IGxpYnJhcnkgdGhhdCBpbXBsZW1lbnRzIFxuLy8gIHRoZSBzcGhlcmljYWwgaGFybW9uaWMgdHJhbnNmb3JtIGZvciByZWFsIHNwaGVyaWNhbCBoYXJtb25pY3Ncbi8vICBhbmQgc29tZSB1c2VmdWwgdHJhbnNmb3JtYXRpb25zIGluIHRoZSBzcGhlcmljYWwgaGFybW9uaWMgZG9tYWluXG4vL1xuLy8gIFRoZSBsaWJyYXJ5IHVzZXMgdGhlIG51bWVyaWMuanMgbGlicmFyeSBmb3IgbWF0cml4IG9wZXJhdGlvbnNcbi8vICBodHRwOi8vd3d3Lm51bWVyaWNqcy5jb20vXG4vL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxudmFyIG51bWVyaWMgPSByZXF1aXJlKCdudW1lcmljJyk7XG5cblxuLy8gZm9yd2FyZFNIVCBpbXBsZW1lbnRzIHRoZSBmb3J3YXJkIFNIVCBvbiBkYXRhIGRlZmluZWQgb3ZlciB0aGUgc3BoZXJlXG52YXIgZm9yd2FyZFNIVCA9IGZ1bmN0aW9uIChOLCBkYXRhLCBDQVJUX09SX1NQSCwgRElSRUNUX09SX1BJTlYpIHtcbiAgICBcbiAgICB2YXIgTmRpcnMgPSBkYXRhLmxlbmd0aCwgTnNoID0gKE4rMSkqKE4rMSk7XG4gICAgdmFyIGludllfTjtcbiAgICB2YXIgbWFnID0gWyxdO1xuICAgIGlmIChOc2g+TmRpcnMpICB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiVGhlIFNIVCBkZWdyZWUgaXMgdG9vIGhpZ2ggZm9yIHRoZSBudW1iZXIgb2YgZGF0YSBwb2ludHNcIilcbiAgICB9XG4gICAgXG4gICAgLy8gQ29udmVydCBjYXJ0ZXNpYW4gdG8gc3BoZXJpY2FsIGlmIG5lZWRlZFxuICAgIGlmIChDQVJUX09SX1NQSD09MCkgZGF0YSA9IGNvbnZlcnRDYXJ0MlNwaChkYXRhKTtcbiAgICBmb3IgKHZhciAgaT0wOyBpPGRhdGEubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgbWFnW2ldID0gZGF0YVtpXVsyXTtcbiAgICB9XG4gICAgLy8gU0ggc2FtcGxpbmcgbWF0cml4XG4gICAgWV9OID0gY29tcHV0ZVJlYWxTSChOLCBkYXRhKTtcbiAgICAvLyBEaXJlY3QgU0hUXG4gICAgaWYgKERJUkVDVF9PUl9QSU5WPT0wKSB7XG4gICAgICAgIGludllfTiA9IG51bWVyaWMubXVsKDEvTmRpcnMsWV9OKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGludllfTiA9IHBpbnZfZGlyZWN0KG51bWVyaWMudHJhbnNwb3NlKFlfTikpO1xuICAgIH1cbiAgICAvLyBQZXJmb3JtIFNIVFxuICAgIHZhciBjb2VmZnMgPSBudW1lcmljLmRvdE1WKGludllfTiwgbWFnKTtcbiAgICByZXR1cm4gY29lZmZzO1xufVxuXG4vLyBpbnZlcnNlU0hUIGltcGxlbWVudHMgdGhlIGludmVyc2UgU0hUIGZyb20gU0ggY29lZmZpY2llbnRzXG52YXIgaW52ZXJzZVNIVCA9IGZ1bmN0aW9uIChjb2VmZnMsIGF6aUVsZXYpIHtcbiAgICBcbiAgICB2YXIgYXppRWxldlIgPSBhemlFbGV2O1xuICAgIHZhciBOID0gTWF0aC5zcXJ0KGNvZWZmcy5sZW5ndGgpLTE7XG4gICAgLy8gU0ggc2FtcGxpbmcgbWF0cml4XG4gICAgdmFyIFlfTiA9IGNvbXB1dGVSZWFsU0goTiwgYXppRWxldik7XG4gICAgLy8gcmVjb25zdHJ1Y3Rpb25cbiAgICB2YXIgZGF0YSA9IG51bWVyaWMuZG90Vk0oY29lZmZzLCBZX04pO1xuICAgIC8vIGdhdGhlciBpbiBkYXRhIG1hdHJpeFxuICAgIGZvciAodmFyIGk9MDsgaTxhemlFbGV2Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGF6aUVsZXZSW2ldWzJdID0gZGF0YVtpXTtcbiAgICB9XG4gICAgcmV0dXJuIGF6aUVsZXZSO1xufVxuXG4vLyB4eHh4eHh4eHh4eHh4eHh4eHhcbnZhciBwcmludDJEYXJyYXkgPSBmdW5jdGlvbiAoYXJyYXkyRCkge1xuICAgIGZvciAodmFyIHE9MDsgcTxhcnJheTJELmxlbmd0aDsgcSsrKSBjb25zb2xlLmxvZyhhcnJheTJEW3FdKTtcbn1cblxuLy8gY29udmVydENhcnQyU3BoIGNvbnZlcnRzIGFycmF5cyBvZiBjYXJ0ZXNpYW4gdmVjdG9ycyB0byBzcGhlcmljYWwgY29vcmRpbmF0ZXNcbnZhciBjb252ZXJ0Q2FydDJTcGggPSBmdW5jdGlvbiAoeHl6LCBPTUlUX01BRykge1xuICAgIFxuICAgIHZhciBhemksIGVsZXYsIHI7XG4gICAgdmFyIGF6aUVsZXZSID0gbmV3IEFycmF5KHh5ei5sZW5ndGgpO1xuICAgIFxuICAgIGZvciAodmFyIGk9MDsgaTx4eXoubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgYXppID0gTWF0aC5hdGFuMiggeHl6W2ldWzFdLCB4eXpbaV1bMF0gKTtcbiAgICAgICAgZWxldiA9IE1hdGguYXRhbjIoIHh5eltpXVsyXSwgTWF0aC5zcXJ0KHh5eltpXVswXSp4eXpbaV1bMF0gKyB4eXpbaV1bMV0qeHl6W2ldWzFdKSApO1xuICAgICAgICBpZiAoT01JVF9NQUc9PTEpIHtcbiAgICAgICAgICAgIGF6aUVsZXZSW2ldID0gW2F6aSxlbGV2XTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHIgPSBNYXRoLnNxcnQoeHl6W2ldWzBdKnh5eltpXVswXSArIHh5eltpXVsxXSp4eXpbaV1bMV0gKyB4eXpbaV1bMl0qeHl6W2ldWzJdKTtcbiAgICAgICAgICAgIGF6aUVsZXZSW2ldID0gW2F6aSxlbGV2LHJdO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBhemlFbGV2Ujtcbn1cblxuLy8gY29udmVydFNwaDJDYXJ0IGNvbnZlcnRzIGFycmF5cyBvZiBzcGhlcmljYWwgY29vcmRpbmF0ZXMgdG8gY2FydGVzaWFuXG52YXIgY29udmVydFNwaDJDYXJ0ID0gZnVuY3Rpb24gKGF6aUVsZXZSKSB7XG4gICAgXG4gICAgdmFyIHgseSx6O1xuICAgIHZhciB4eXogPSBuZXcgQXJyYXkoYXppRWxldlIubGVuZ3RoKTtcbiAgICBcbiAgICBmb3IgKHZhciBpPTA7IGk8YXppRWxldlIubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgeCA9IE1hdGguY29zKGF6aUVsZXZSW2ldWzBdKSpNYXRoLmNvcyhhemlFbGV2UltpXVsxXSk7XG4gICAgICAgIHkgPSBNYXRoLnNpbihhemlFbGV2UltpXVswXSkqTWF0aC5jb3MoYXppRWxldlJbaV1bMV0pO1xuICAgICAgICB6ID0gTWF0aC5zaW4oYXppRWxldlJbaV1bMV0pO1xuICAgICAgICBpZiAoYXppRWxldlJbMF0ubGVuZ3RoPT0yKSB4eXpbaV0gPSBbeCx5LHpdO1xuICAgICAgICBlbHNlIGlmIChhemlFbGV2UlswXS5sZW5ndGg9PTMpIHh5eltpXSA9IFthemlFbGV2UltpXVsyXSp4LGF6aUVsZXZSW2ldWzJdKnksYXppRWxldlJbaV1bMl0qel07XG4gICAgfVxuICAgIHJldHVybiB4eXo7XG59XG5cbi8vIGNvbXB1dGVSZWFsU0ggY29tcHV0ZXMgcmVhbCBzcGhlcmljYWwgaGFybW9uaWNzIHVwIHRvIG9yZGVyIE5cbnZhciBjb21wdXRlUmVhbFNIID0gZnVuY3Rpb24gKE4sIGRhdGEpIHtcbiAgICBcbiAgICB2YXIgYXppID0gbmV3IEFycmF5KGRhdGEubGVuZ3RoKTtcbiAgICB2YXIgZWxldiA9IG5ldyBBcnJheShkYXRhLmxlbmd0aCk7XG4gICAgXG4gICAgZm9yICh2YXIgaT0wOyBpPGRhdGEubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgYXppW2ldID0gZGF0YVtpXVswXTtcbiAgICAgICAgZWxldltpXSA9IGRhdGFbaV1bMV07XG4gICAgfVxuICAgIFxuICAgIHZhciBmYWN0b3JpYWxzID0gbmV3IEFycmF5KDIqTisxKTtcbiAgICB2YXIgTmRpcnMgPSBhemkubGVuZ3RoO1xuICAgIHZhciBOc2ggPSAoTisxKSooTisxKTtcbiAgICB2YXIgbGVnX25fbWludXMxID0gMDtcbiAgICB2YXIgbGVnX25fbWludXMyID0gMDtcbiAgICB2YXIgbGVnX247XG4gICAgdmFyIHNpbmVsID0gbnVtZXJpYy5zaW4oZWxldik7XG4gICAgdmFyIGluZGV4X24gPSAwO1xuICAgIHZhciBZX04gPSBuZXcgQXJyYXkoTnNoKTtcbiAgICB2YXIgTm4wLCBObm07XG4gICAgdmFyIGNvc21hemksIHNpbm1hemk7XG4gICAgXG4gICAgLy8gcHJlY29tcHV0ZSBmYWN0b3JpYWxzXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCAyKk4rMTsgaSsrKSBmYWN0b3JpYWxzW2ldID0gZmFjdG9yaWFsKGkpO1xuICAgIFxuICAgIGZvciAodmFyIG4gPSAwOyBuPE4rMTsgbisrKSB7XG4gICAgICAgIGlmIChuPT0wKSB7XG4gICAgICAgICAgICB2YXIgdGVtcDAgPSBuZXcgQXJyYXkoYXppLmxlbmd0aCk7XG4gICAgICAgICAgICB0ZW1wMC5maWxsKDEpO1xuICAgICAgICAgICAgWV9OW25dID0gdGVtcDA7XG4gICAgICAgICAgICBpbmRleF9uID0gMTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGxlZ19uID0gcmVjdXJzZUxlZ2VuZHJlUG9seShuLCBzaW5lbCwgbGVnX25fbWludXMxLCBsZWdfbl9taW51czIpO1xuICAgICAgICAgICAgTm4wID0gTWF0aC5zcXJ0KDIqbisxKTtcbiAgICAgICAgICAgIGZvciAodmFyIG0gPSAwOyBtPG4rMTsgbSsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKG09PTApIFlfTltpbmRleF9uK25dID0gbnVtZXJpYy5tdWwoTm4wLGxlZ19uW21dKTtcbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgTm5tID0gTm4wKk1hdGguc3FydCggMiAqIGZhY3RvcmlhbHNbbi1tXS9mYWN0b3JpYWxzW24rbV0gKTtcbiAgICAgICAgICAgICAgICAgICAgY29zbWF6aSA9IG51bWVyaWMuY29zKG51bWVyaWMubXVsKG0sYXppKSk7XG4gICAgICAgICAgICAgICAgICAgIHNpbm1hemkgPSBudW1lcmljLnNpbihudW1lcmljLm11bChtLGF6aSkpO1xuICAgICAgICAgICAgICAgICAgICBZX05baW5kZXhfbituLW1dID0gbnVtZXJpYy5tdWwoTm5tLCBudW1lcmljLm11bChsZWdfblttXSwgc2lubWF6aSkpO1xuICAgICAgICAgICAgICAgICAgICBZX05baW5kZXhfbituK21dID0gbnVtZXJpYy5tdWwoTm5tLCBudW1lcmljLm11bChsZWdfblttXSwgY29zbWF6aSkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGluZGV4X24gPSBpbmRleF9uKzIqbisxO1xuICAgICAgICB9XG4gICAgICAgIGxlZ19uX21pbnVzMiA9IGxlZ19uX21pbnVzMTtcbiAgICAgICAgbGVnX25fbWludXMxID0gbGVnX247XG4gICAgfVxuICAgIFxuICAgIHJldHVybiBZX047XG59XG5cbi8vIGZhY3RvcmlhbCBjb21wdXRlIGZhY3RvcmlhbFxudmFyIGZhY3RvcmlhbCA9IGZ1bmN0aW9uIChuKSB7XG4gICAgaWYgKG4gPT09IDApIHJldHVybiAxO1xuICAgIHJldHVybiBuICogZmFjdG9yaWFsKG4gLSAxKTtcbn1cblxuLy8gcmVjdXJzZUxlZ2VuZHJlUG9seSBjb21wdXRlcyBhc3NvY2lhdGVkIExlZ2VuZHJlIGZ1bmN0aW9ucyByZWN1cnNpdmVseVxudmFyIHJlY3Vyc2VMZWdlbmRyZVBvbHkgPSBmdW5jdGlvbiAobiwgeCwgUG5tX21pbnVzMSwgUG5tX21pbnVzMikge1xuICAgIFxuICAgIHZhciBQbm0gPSBuZXcgQXJyYXkobisxKTtcbiAgICBzd2l0Y2gobikge1xuICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgICB2YXIgeDIgPSBudW1lcmljLm11bCh4LHgpO1xuICAgICAgICAgICAgdmFyIFAxMCA9IHg7XG4gICAgICAgICAgICB2YXIgUDExID0gbnVtZXJpYy5zcXJ0KG51bWVyaWMuc3ViKDEseDIpKTtcbiAgICAgICAgICAgIFBubVswXSA9IFAxMDtcbiAgICAgICAgICAgIFBubVsxXSA9IFAxMTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgICB2YXIgeDIgPSBudW1lcmljLm11bCh4LHgpO1xuICAgICAgICAgICAgdmFyIFAyMCA9IG51bWVyaWMubXVsKDMseDIpO1xuICAgICAgICAgICAgUDIwID0gbnVtZXJpYy5zdWIoUDIwLDEpO1xuICAgICAgICAgICAgUDIwID0gbnVtZXJpYy5kaXYoUDIwLDIpO1xuICAgICAgICAgICAgdmFyIFAyMSA9IG51bWVyaWMuc3ViKDEseDIpO1xuICAgICAgICAgICAgUDIxID0gbnVtZXJpYy5zcXJ0KFAyMSk7XG4gICAgICAgICAgICBQMjEgPSBudW1lcmljLm11bCgzLFAyMSk7XG4gICAgICAgICAgICBQMjEgPSBudW1lcmljLm11bChQMjEseCk7XG4gICAgICAgICAgICB2YXIgUDIyID0gbnVtZXJpYy5zdWIoMSx4Mik7XG4gICAgICAgICAgICBQMjIgPSBudW1lcmljLm11bCgzLFAyMik7XG4gICAgICAgICAgICBQbm1bMF0gPSBQMjA7XG4gICAgICAgICAgICBQbm1bMV0gPSBQMjE7XG4gICAgICAgICAgICBQbm1bMl0gPSBQMjI7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHZhciB4MiA9IG51bWVyaWMubXVsKHgseCk7XG4gICAgICAgICAgICB2YXIgb25lX21pbl94MiA9IG51bWVyaWMuc3ViKDEseDIpO1xuICAgICAgICAgICAgLy8gbGFzdCB0ZXJtIG09blxuICAgICAgICAgICAgdmFyIGsgPSAyKm4tMTtcbiAgICAgICAgICAgIHZhciBkZmFjdF9rID0gMTtcbiAgICAgICAgICAgIGlmICgoayAlIDIpID09IDApIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBraz0xOyBrazxrLzIrMTsga2srKykgZGZhY3RfayA9IGRmYWN0X2sqMipraztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGtrPTE7IGtrPChrKzEpLzIrMTsga2srKykgZGZhY3RfayA9IGRmYWN0X2sqKDIqa2stMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBQbm1bbl0gPSBudW1lcmljLm11bChkZmFjdF9rLCBudW1lcmljLnBvdyhvbmVfbWluX3gyLCBuLzIpKTtcbiAgICAgICAgICAgIC8vIGJlZm9yZSBsYXN0IHRlcm1cbiAgICAgICAgICAgIFBubVtuLTFdID0gbnVtZXJpYy5tdWwoMipuLTEsIG51bWVyaWMubXVsKHgsIFBubV9taW51czFbbi0xXSkpOyAvLyBQX3tuKG4tMSl9ID0gKDIqbi0xKSp4KlBfeyhuLTEpKG4tMSl9XG4gICAgICAgICAgICAvLyB0aHJlZSB0ZXJtIHJlY3Vyc2VuY2UgZm9yIHRoZSByZXN0XG4gICAgICAgICAgICBmb3IgKHZhciBtPTA7IG08bi0xOyBtKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgdGVtcDEgPSBudW1lcmljLm11bCggMipuLTEsIG51bWVyaWMubXVsKHgsIFBubV9taW51czFbbV0pICk7XG4gICAgICAgICAgICAgICAgdmFyIHRlbXAyID0gbnVtZXJpYy5tdWwoIG4rbS0xLCBQbm1fbWludXMyW21dICk7XG4gICAgICAgICAgICAgICAgUG5tW21dID0gbnVtZXJpYy5kaXYoIG51bWVyaWMuc3ViKHRlbXAxLCB0ZW1wMiksIG4tbSk7IC8vIFBfbCA9ICggKDJsLTEpeFBfKGwtMSkgLSAobCttLTEpUF8obC0yKSApLyhsLW0pXG4gICAgICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBQbm07XG59XG5cbi8vIHBpbnZfc3ZkIGNvbXB1dGVzIHRoZSBwc2V1ZG8taW52ZXJzZSB1c2luZyBTVkRcbnZhciBwaW52X3N2ZCA9IGZ1bmN0aW9uIChBKSB7XG4gICAgdmFyIHogPSBudW1lcmljLnN2ZChBKSwgZm9vID0gei5TWzBdO1xuICAgIHZhciBVID0gei5VLCBTID0gei5TLCBWID0gei5WO1xuICAgIHZhciBtID0gQS5sZW5ndGgsIG4gPSBBWzBdLmxlbmd0aCwgdG9sID0gTWF0aC5tYXgobSxuKSpudW1lcmljLmVwc2lsb24qZm9vLE0gPSBTLmxlbmd0aDtcbiAgICB2YXIgU2ludiA9IG5ldyBBcnJheShNKTtcbiAgICBmb3IodmFyIGk9TS0xO2khPT0tMTtpLS0pIHsgaWYoU1tpXT50b2wpIFNpbnZbaV0gPSAxL1NbaV07IGVsc2UgU2ludltpXSA9IDA7IH1cbiAgICByZXR1cm4gbnVtZXJpYy5kb3QobnVtZXJpYy5kb3QoVixudW1lcmljLmRpYWcoU2ludikpLG51bWVyaWMudHJhbnNwb3NlKFUpKVxufVxuXG4vLyBwaW52X2RpcmVjdCBjb21wdXRlcyB0aGUgbGVmdCBwc2V1ZG8taW52ZXJzZVxudmFyIHBpbnZfZGlyZWN0ID0gZnVuY3Rpb24gKEEpIHtcbiAgICB2YXIgQVQgPSBudW1lcmljLnRyYW5zcG9zZShBKTtcbiAgICByZXR1cm4gbnVtZXJpYy5kb3QobnVtZXJpYy5pbnYobnVtZXJpYy5kb3QoQVQsQSkpLEFUKTtcbn1cblxuLy8gY29tcHV0ZXMgcm90YXRpb24gbWF0cmljZXMgZm9yIHJlYWwgc3BoZXJpY2FsIGhhcm1vbmljc1xudmFyIGdldFNIcm90TXR4ID0gZnVuY3Rpb24gKFJ4eXosIEwpIHtcbiAgICBcbiAgICB2YXIgTnNoID0gKEwrMSkqKEwrMSk7XG4gICAgLy8gYWxsb2NhdGUgdG90YWwgcm90YXRpb24gbWF0cml4XG4gICAgdmFyIFIgPSBudW1lcmljLnJlcChbTnNoLE5zaF0sMCk7XG4gICAgXG4gICAgLy8gaW5pdGlhbGl6ZSB6ZXJvdGggYW5kIGZpcnN0IGJhbmQgcm90YXRpb24gbWF0cmljZXMgZm9yIHJlY3Vyc2lvblxuICAgIC8vIFJ4eXogPSBbUnh4IFJ4eSBSeHpcbiAgICAvLyAgICAgICAgIFJ5eCBSeXkgUnl6XG4gICAgLy8gICAgICAgICBSenggUnp5IFJ6el1cbiAgICAvL1xuICAgIC8vIHplcm90aC1iYW5kIChsPTApIGlzIGludmFyaWFudCB0byByb3RhdGlvblxuICAgIFJbMF1bMF0gPSAxO1xuICAgIFxuICAgIC8vIHRoZSBmaXJzdCBiYW5kIChsPTEpIGlzIGRpcmVjdGx5IHJlbGF0ZWQgdG8gdGhlIHJvdGF0aW9uIG1hdHJpeFxuICAgIHZhciBSXzEgPSBudW1lcmljLnJlcChbMywzXSwwKTtcbiAgICBSXzFbMF1bMF0gPSBSeHl6WzFdWzFdO1xuICAgIFJfMVswXVsxXSA9IFJ4eXpbMV1bMl07XG4gICAgUl8xWzBdWzJdID0gUnh5elsxXVswXTtcbiAgICBSXzFbMV1bMF0gPSBSeHl6WzJdWzFdO1xuICAgIFJfMVsxXVsxXSA9IFJ4eXpbMl1bMl07XG4gICAgUl8xWzFdWzJdID0gUnh5elsyXVswXTtcbiAgICBSXzFbMl1bMF0gPSBSeHl6WzBdWzFdO1xuICAgIFJfMVsyXVsxXSA9IFJ4eXpbMF1bMl07XG4gICAgUl8xWzJdWzJdID0gUnh5elswXVswXTtcbiAgICBcbiAgICBSID0gbnVtZXJpYy5zZXRCbG9jayhSLCBbMSwxXSwgWzMsM10sIFJfMSk7XG4gICAgdmFyIFJfbG0xID0gUl8xO1xuICAgIFxuICAgIC8vIGNvbXB1dGUgcm90YXRpb24gbWF0cml4IG9mIGVhY2ggc3Vic2VxdWVudCBiYW5kIHJlY3Vyc2l2ZWx5XG4gICAgdmFyIGJhbmRfaWR4ID0gMztcbiAgICBmb3IgKHZhciBsPTI7IGw8TCsxOyBsKyspIHtcbiAgICAgICAgXG4gICAgICAgIHZhciBSX2wgPSBudW1lcmljLnJlcChbKDIqbCsxKSwoMipsKzEpXSwwKTtcbiAgICAgICAgZm9yICh2YXIgbT0tbDsgbTxsKzE7IG0rKykge1xuICAgICAgICAgICAgZm9yICh2YXIgbj0tbDsgbjxsKzE7IG4rKykge1xuICAgICAgICAgICAgICAgIC8vIGNvbXB1dGUgdSx2LHcgdGVybXMgb2YgRXEuOC4xIChUYWJsZSBJKVxuICAgICAgICAgICAgICAgIHZhciBkLCBkZW5vbSwgdSwgdiwgdztcbiAgICAgICAgICAgICAgICBpZiAobT09MCkgZCA9IDE7XG4gICAgICAgICAgICAgICAgZWxzZSBkID0gMDsgLy8gdGhlIGRlbHRhIGZ1bmN0aW9uIGRfbTBcbiAgICAgICAgICAgICAgICBpZiAoTWF0aC5hYnMobik9PWwpIGRlbm9tID0gKDIqbCkqKDIqbC0xKTtcbiAgICAgICAgICAgICAgICBlbHNlIGRlbm9tID0gKGwqbC1uKm4pO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHUgPSBNYXRoLnNxcnQoKGwqbC1tKm0pL2Rlbm9tKTtcbiAgICAgICAgICAgICAgICB2ID0gTWF0aC5zcXJ0KCgxK2QpKihsK01hdGguYWJzKG0pLTEpKihsK01hdGguYWJzKG0pKS9kZW5vbSkqKDEtMipkKSowLjU7XG4gICAgICAgICAgICAgICAgdyA9IE1hdGguc3FydCgobC1NYXRoLmFicyhtKS0xKSoobC1NYXRoLmFicyhtKSkvZGVub20pKigxLWQpKigtMC41KTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAvLyBjb21wdXRlcyBFcS44LjFcbiAgICAgICAgICAgICAgICBpZiAodSE9MCkgdSA9IHUqVShsLG0sbixSXzEsUl9sbTEpO1xuICAgICAgICAgICAgICAgIGlmICh2IT0wKSB2ID0gdipWKGwsbSxuLFJfMSxSX2xtMSk7XG4gICAgICAgICAgICAgICAgaWYgKHchPTApIHcgPSB3KlcobCxtLG4sUl8xLFJfbG0xKTtcbiAgICAgICAgICAgICAgICBSX2xbbStsXVtuK2xdID0gdSArIHYgKyB3O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIFIgPSBudW1lcmljLnNldEJsb2NrKFIsIFtiYW5kX2lkeCsxLGJhbmRfaWR4KzFdLCBbYmFuZF9pZHgrMipsKzEsYmFuZF9pZHgrMipsKzFdLCBSX2wpO1xuICAgICAgICBSX2xtMSA9IFJfbDtcbiAgICAgICAgYmFuZF9pZHggPSBiYW5kX2lkeCArIDIqbCsxO1xuICAgIH1cbiAgICByZXR1cm4gUjtcbn1cblxuLy8gZnVuY3Rpb25zIHRvIGNvbXB1dGUgdGVybXMgVSwgViwgVyBvZiBFcS44LjEgKFRhYmxlIElJKVxuZnVuY3Rpb24gVShsLG0sbixSXzEsUl9sbTEpIHtcbiAgICBcbiAgICByZXR1cm4gUCgwLGwsbSxuLFJfMSxSX2xtMSk7XG59XG5cbmZ1bmN0aW9uIFYobCxtLG4sUl8xLFJfbG0xKSB7XG4gICAgXG4gICAgdmFyIHAwLCBwMSwgcmV0LCBkO1xuICAgIGlmIChtPT0wKSB7XG4gICAgICAgIHAwID0gUCgxLGwsMSxuLFJfMSxSX2xtMSk7XG4gICAgICAgIHAxID0gUCgtMSxsLC0xLG4sUl8xLFJfbG0xKTtcbiAgICAgICAgcmV0ID0gcDArcDE7XG4gICAgfVxuICAgIGVsc2UgaWYgKG0+MCkge1xuICAgICAgICBpZiAobT09MSkgZCA9IDE7XG4gICAgICAgIGVsc2UgZCA9IDA7XG4gICAgICAgIHAwID0gUCgxLGwsbS0xLG4sUl8xLFJfbG0xKTtcbiAgICAgICAgcDEgPSBQKC0xLGwsLW0rMSxuLFJfMSxSX2xtMSk7XG4gICAgICAgIHJldCA9IHAwKk1hdGguc3FydCgxK2QpIC0gcDEqKDEtZCk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBpZiAobT09LTEpIGQgPSAxO1xuICAgICAgICBlbHNlIGQgPSAwO1xuICAgICAgICBwMCA9IFAoMSxsLG0rMSxuLFJfMSxSX2xtMSk7XG4gICAgICAgIHAxID0gUCgtMSxsLC1tLTEsbixSXzEsUl9sbTEpO1xuICAgICAgICByZXQgPSBwMCooMS1kKSArIHAxKk1hdGguc3FydCgxK2QpO1xuICAgIH1cbiAgICByZXR1cm4gcmV0O1xufVxuXG5mdW5jdGlvbiBXKGwsbSxuLFJfMSxSX2xtMSkge1xuICAgIFxuICAgIHZhciBwMCwgcDEsIHJldDtcbiAgICBpZiAobT09MCkge1xuICAgICAgICBjb25zb2xlLmVycm9yKFwic2hvdWxkIG5vdCBiZSBjYWxsZWRcIik7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBpZiAobT4wKSB7XG4gICAgICAgICAgICBwMCA9IFAoMSxsLG0rMSxuLFJfMSxSX2xtMSk7XG4gICAgICAgICAgICBwMSA9IFAoLTEsbCwtbS0xLG4sUl8xLFJfbG0xKTtcbiAgICAgICAgICAgIHJldCA9IHAwICsgcDE7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBwMCA9IFAoMSxsLG0tMSxuLFJfMSxSX2xtMSk7XG4gICAgICAgICAgICBwMSA9IFAoLTEsbCwtbSsxLG4sUl8xLFJfbG0xKTtcbiAgICAgICAgICAgIHJldCA9IHAwIC0gcDE7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJldDtcbn1cblxuLy8gZnVuY3Rpb24gdG8gY29tcHV0ZSB0ZXJtIFAgb2YgVSxWLFcgKFRhYmxlIElJKVxuZnVuY3Rpb24gUChpLGwsYSxiLFJfMSxSX2xtMSkge1xuICAgIFxuICAgIHZhciByaTEsIHJpbTEsIHJpMCwgcmV0O1xuICAgIHJpMSA9IFJfMVtpKzFdWzErMV07XG4gICAgcmltMSA9IFJfMVtpKzFdWy0xKzFdO1xuICAgIHJpMCA9IFJfMVtpKzFdWzArMV07XG4gICAgXG4gICAgaWYgKGI9PS1sKSB7XG4gICAgICAgIHJldCA9IHJpMSpSX2xtMVthK2wtMV1bMF0gKyByaW0xKlJfbG0xW2ErbC0xXVsyKmwtMl07XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBpZiAoYj09bCkgcmV0ID0gcmkxKlJfbG0xW2ErbC0xXVsyKmwtMl0gLSByaW0xKlJfbG0xW2ErbC0xXVswXTtcbiAgICAgICAgZWxzZSByZXQgPSByaTAqUl9sbTFbYStsLTFdW2IrbC0xXTtcbiAgICB9XG4gICAgcmV0dXJuIHJldDtcbn1cblxuLy8geWF3UGl0Y2hSb2xsMlJ6eXggY29tcHV0ZXMgdGhlIHJvdGF0aW9uIG1hdHJpeCBmcm9tIFpZJ1gnJyByb3RhdGlvbiBhbmdsZXNcbnZhciB5YXdQaXRjaFJvbGwyUnp5eCA9IGZ1bmN0aW9uICh5YXcsIHBpdGNoLCByb2xsKSB7XG4gICAgXG4gICAgdmFyIFJ4LCBSeSwgUno7XG4gICAgaWYgKHJvbGwgPT0gMCkgUnggPSBbWzEsMCwwXSxbMCwxLDBdLFswLDAsMV1dO1xuICAgIGVsc2UgUnggPSBbWzEsIDAsIDBdLCBbMCwgTWF0aC5jb3Mocm9sbCksIE1hdGguc2luKHJvbGwpXSwgWzAsIC1NYXRoLnNpbihyb2xsKSwgTWF0aC5jb3Mocm9sbCldXTtcbiAgICBpZiAocGl0Y2ggPT0gMCkgUnkgPSBbWzEsMCwwXSxbMCwxLDBdLFswLDAsMV1dO1xuICAgIGVsc2UgUnkgPSBbW01hdGguY29zKHBpdGNoKSwgMCwgLU1hdGguc2luKHBpdGNoKV0sIFswLCAxLCAwXSwgW01hdGguc2luKHBpdGNoKSwgMCwgTWF0aC5jb3MocGl0Y2gpXV07XG4gICAgaWYgKHlhdyA9PSAwKSBSeiA9IFtbMSwwLDBdLFswLDEsMF0sWzAsMCwxXV07XG4gICAgZWxzZSBSeiA9IFtbTWF0aC5jb3MoeWF3KSwgTWF0aC5zaW4oeWF3KSwgMF0sIFstTWF0aC5zaW4oeWF3KSwgTWF0aC5jb3MoeWF3KSwgMF0sIFswLCAwLCAxXV07XG4gICAgXG4gICAgdmFyIFIgPSBudW1lcmljLmRvdE1Nc21hbGwoUnksUnopO1xuICAgIFIgPSBudW1lcmljLmRvdE1Nc21hbGwoUngsUik7XG4gICAgcmV0dXJuIFI7XG59XG5cblxuLy8gZXhwb3J0c1xubW9kdWxlLmV4cG9ydHMuZm9yd2FyZFNIVCA9IGZvcndhcmRTSFQ7XG5tb2R1bGUuZXhwb3J0cy5pbnZlcnNlU0hUID0gaW52ZXJzZVNIVDtcbm1vZHVsZS5leHBvcnRzLnByaW50MkRhcnJheSA9IHByaW50MkRhcnJheTtcbm1vZHVsZS5leHBvcnRzLmNvbnZlcnRDYXJ0MlNwaCA9IGNvbnZlcnRDYXJ0MlNwaDtcbm1vZHVsZS5leHBvcnRzLmNvbnZlcnRTcGgyQ2FydCA9IGNvbnZlcnRTcGgyQ2FydDtcbm1vZHVsZS5leHBvcnRzLmNvbXB1dGVSZWFsU0ggPSBjb21wdXRlUmVhbFNIO1xubW9kdWxlLmV4cG9ydHMuZmFjdG9yaWFsID0gZmFjdG9yaWFsO1xubW9kdWxlLmV4cG9ydHMucmVjdXJzZUxlZ2VuZHJlUG9seSA9IHJlY3Vyc2VMZWdlbmRyZVBvbHk7XG5tb2R1bGUuZXhwb3J0cy5waW52X3N2ZCA9IHBpbnZfc3ZkO1xubW9kdWxlLmV4cG9ydHMucGludl9kaXJlY3QgPSBwaW52X2RpcmVjdDtcbm1vZHVsZS5leHBvcnRzLmdldFNIcm90TXR4ID0gZ2V0U0hyb3RNdHg7XG5tb2R1bGUuZXhwb3J0cy55YXdQaXRjaFJvbGwyUnp5eCA9IHlhd1BpdGNoUm9sbDJSenl4O1xuIl19
