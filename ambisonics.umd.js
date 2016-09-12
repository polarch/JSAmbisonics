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
                    console.error('decodeAudioData error', error);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJkaXN0L2FtYmktYmluYXVyYWxEZWNvZGVyLmpzIiwiZGlzdC9hbWJpLWNvbnZlcnRlcnMuanMiLCJkaXN0L2FtYmktaW50ZW5zaXR5QW5hbHlzZXIuanMiLCJkaXN0L2FtYmktbW9ub0VuY29kZXIuanMiLCJkaXN0L2FtYmktb3JkZXJMaW1pdGVyLmpzIiwiZGlzdC9hbWJpLW9yZGVyV2VpZ2h0LmpzIiwiZGlzdC9hbWJpLXBvd2VybWFwQW5hbHlzZXIuanMiLCJkaXN0L2FtYmktc2NlbmVNaXJyb3IuanMiLCJkaXN0L2FtYmktc2NlbmVSb3RhdG9yLmpzIiwiZGlzdC9hbWJpLXZpcnR1YWxNaWMuanMiLCJkaXN0L2hvYS1sb2FkZXIuanMiLCJkaXN0L2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvY29yZS1qcy9vYmplY3QvZGVmaW5lLXByb3BlcnR5LmpzIiwibm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvaGVscGVycy9jbGFzc0NhbGxDaGVjay5qcyIsIm5vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL2hlbHBlcnMvY3JlYXRlQ2xhc3MuanMiLCJub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9ub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L2ZuL29iamVjdC9kZWZpbmUtcHJvcGVydHkuanMiLCJub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9ub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvX2EtZnVuY3Rpb24uanMiLCJub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9ub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvX2FuLW9iamVjdC5qcyIsIm5vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL25vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy9fY29yZS5qcyIsIm5vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL25vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy9fY3R4LmpzIiwibm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvbm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzL19kZXNjcmlwdG9ycy5qcyIsIm5vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL25vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy9fZG9tLWNyZWF0ZS5qcyIsIm5vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL25vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy9fZXhwb3J0LmpzIiwibm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvbm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzL19mYWlscy5qcyIsIm5vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL25vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy9fZ2xvYmFsLmpzIiwibm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvbm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzL19oaWRlLmpzIiwibm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvbm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzL19pZTgtZG9tLWRlZmluZS5qcyIsIm5vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL25vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy9faXMtb2JqZWN0LmpzIiwibm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvbm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzL19vYmplY3QtZHAuanMiLCJub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9ub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvX3Byb3BlcnR5LWRlc2MuanMiLCJub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9ub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvX3RvLXByaW1pdGl2ZS5qcyIsIm5vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL25vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy9lczYub2JqZWN0LmRlZmluZS1wcm9wZXJ0eS5qcyIsIm5vZGVfbW9kdWxlcy9nZXQtZmxvYXQtdGltZS1kb21haW4tZGF0YS9saWIvZ2V0LWZsb2F0LXRpbWUtZG9tYWluLWRhdGEuanMiLCJub2RlX21vZHVsZXMvbnVtZXJpYy9udW1lcmljLTEuMi42LmpzIiwibm9kZV9tb2R1bGVzL3NwaGVyaWNhbC1oYXJtb25pYy10cmFuc2Zvcm0vc3JjL2luZGV4LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lDaUJxQixVO0FBRWpCLHdCQUFZLFFBQVosRUFBc0IsS0FBdEIsRUFBNkI7QUFBQTs7O0FBRXpCLGFBQUssV0FBTCxHQUFtQixLQUFuQjs7QUFFQSxhQUFLLEdBQUwsR0FBVyxRQUFYO0FBQ0EsYUFBSyxLQUFMLEdBQWEsS0FBYjtBQUNBLGFBQUssR0FBTCxHQUFXLENBQUMsUUFBUSxDQUFULEtBQWUsUUFBUSxDQUF2QixDQUFYO0FBQ0EsYUFBSyxVQUFMLEdBQWtCLElBQUksS0FBSixDQUFVLEtBQUssR0FBZixDQUFsQjtBQUNBLGFBQUssY0FBTCxHQUFzQixJQUFJLEtBQUosQ0FBVSxLQUFLLEdBQWYsQ0FBdEI7O0FBRUEsYUFBSyxFQUFMLEdBQVUsS0FBSyxHQUFMLENBQVMscUJBQVQsQ0FBK0IsS0FBSyxHQUFwQyxDQUFWO0FBQ0EsYUFBSyxHQUFMLEdBQVcsS0FBSyxHQUFMLENBQVMsbUJBQVQsQ0FBNkIsQ0FBN0IsQ0FBWDtBQUNBLGFBQUssR0FBTCxDQUFTLGdCQUFULEdBQTRCLFVBQTVCO0FBQ0EsYUFBSyxHQUFMLENBQVMsWUFBVCxHQUF3QixDQUF4Qjs7QUFFQSxhQUFLLE9BQUwsR0FBZSxLQUFL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O0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ05BO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBOztBQ0ZBO0FBQ0E7QUFDQTs7QUNGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNYQTtBQUNBO0FBQ0E7OztBQ0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUN4MElBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vICBBcmNob250aXMgUG9saXRpc1xuLy8gIGFyY2hvbnRpcy5wb2xpdGlzQGFhbHRvLmZpXG4vLyAgRGF2aWQgUG9pcmllci1RdWlub3Rcbi8vICBkYXZpcG9pckBpcmNhbS5mclxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vXG4vLyAgV2ViQXVkaW9fSE9BIGEgSmF2YVNjcmlwdCBsaWJyYXJ5IGZvciBoaWdoZXItb3JkZXIgQW1iaXNvbmljc1xuLy8gIFRoZSBsaWJyYXJ5IGltcGxlbWVudHMgV2ViIEF1ZGlvIGJsb2NrcyB0aGF0IHBlcmZvcm1cbi8vICB0eXBpY2FsIGFtYmlzb25pYyBwcm9jZXNzaW5nIG9wZXJhdGlvbnMgb24gYXVkaW8gc2lnbmFscy5cbi8vXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLyogSE9BIEJJTkFVUkFMIERFQ09ERVIgKi9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIGJpbkRlY29kZXIge1xuXG4gICAgY29uc3RydWN0b3IoYXVkaW9DdHgsIG9yZGVyKSB7XG5cbiAgICAgICAgdGhpcy5pbml0aWFsaXplZCA9IGZhbHNlO1xuXG4gICAgICAgIHRoaXMuY3R4ID0gYXVkaW9DdHg7XG4gICAgICAgIHRoaXMub3JkZXIgPSBvcmRlcjtcbiAgICAgICAgdGhpcy5uQ2ggPSAob3JkZXIgKyAxKSAqIChvcmRlciArIDEpO1xuICAgICAgICB0aGlzLmRlY0ZpbHRlcnMgPSBuZXcgQXJyYXkodGhpcy5uQ2gpO1xuICAgICAgICB0aGlzLmRlY0ZpbHRlck5vZGVzID0gbmV3IEFycmF5KHRoaXMubkNoKTtcbiAgICAgICAgLy8gaW5wdXQgYW5kIG91dHB1dCBub2Rlc1xuICAgICAgICB0aGlzLmluID0gdGhpcy5jdHguY3JlYXRlQ2hhbm5lbFNwbGl0dGVyKHRoaXMubkNoKTtcbiAgICAgICAgdGhpcy5vdXQgPSB0aGlzLmN0eC5jcmVhdGVDaGFubmVsTWVyZ2VyKDIpO1xuICAgICAgICB0aGlzLm91dC5jaGFubmVsQ291bnRNb2RlID0gJ2V4cGxpY2l0JztcbiAgICAgICAgdGhpcy5vdXQuY2hhbm5lbENvdW50ID0gMTtcbiAgICAgICAgLy8gZG93bm1peGluZyBnYWlucyBmb3IgbGVmdCBhbmQgcmlnaHQgZWFyc1xuICAgICAgICB0aGlzLmdhaW5NaWQgPSB0aGlzLmN0eC5jcmVhdGVHYWluKCk7XG4gICAgICAgIHRoaXMuZ2FpblNpZGUgPSB0aGlzLmN0eC5jcmVhdGVHYWluKCk7XG4gICAgICAgIHRoaXMuaW52ZXJ0U2lkZSA9IHRoaXMuY3R4LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgdGhpcy5nYWluTWlkLmdhaW4udmFsdWUgPSAxO1xuICAgICAgICB0aGlzLmdhaW5TaWRlLmdhaW4udmFsdWUgPSAxO1xuICAgICAgICB0aGlzLmludmVydFNpZGUuZ2Fpbi52YWx1ZSA9IC0xO1xuICAgICAgICAvLyBjb252b2x2ZXIgbm9kZXNcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm5DaDsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLmRlY0ZpbHRlck5vZGVzW2ldID0gdGhpcy5jdHguY3JlYXRlQ29udm9sdmVyKCk7XG4gICAgICAgICAgICB0aGlzLmRlY0ZpbHRlck5vZGVzW2ldLm5vcm1hbGl6ZSA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIC8vIGluaXRpYWxpemUgY29udm9sdmVycyB0byBwbGFpbiBjYXJkaW9pZHNcbiAgICAgICAgdGhpcy5yZXNldEZpbHRlcnMoKTtcbiAgICAgICAgLy8gY3JlYXRlIGF1ZGlvIGNvbm5lY3Rpb25zXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5uQ2g7IGkrKykge1xuICAgICAgICAgICAgdGhpcy5pbi5jb25uZWN0KHRoaXMuZGVjRmlsdGVyTm9kZXNbaV0sIGksIDApO1xuICAgICAgICAgICAgdmFyIG4gPSBNYXRoLmZsb29yKE1hdGguc3FydChpKSk7XG4gICAgICAgICAgICB2YXIgbSA9IGkgLSBuICogbiAtIG47XG4gICAgICAgICAgICBpZiAobSA+PSAwKSB0aGlzLmRlY0ZpbHRlck5vZGVzW2ldLmNvbm5lY3QodGhpcy5nYWluTWlkKTtcbiAgICAgICAgICAgIGVsc2UgdGhpcy5kZWNGaWx0ZXJOb2Rlc1tpXS5jb25uZWN0KHRoaXMuZ2FpblNpZGUpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZ2Fpbk1pZC5jb25uZWN0KHRoaXMub3V0LCAwLCAwKTtcbiAgICAgICAgdGhpcy5nYWluU2lkZS5jb25uZWN0KHRoaXMub3V0LCAwLCAwKTtcblxuICAgICAgICB0aGlzLmdhaW5NaWQuY29ubmVjdCh0aGlzLm91dCwgMCwgMSk7XG4gICAgICAgIHRoaXMuZ2FpblNpZGUuY29ubmVjdCh0aGlzLmludmVydFNpZGUsIDAsIDApO1xuICAgICAgICB0aGlzLmludmVydFNpZGUuY29ubmVjdCh0aGlzLm91dCwgMCwgMSk7XG5cbiAgICAgICAgdGhpcy5pbml0aWFsaXplZCA9IHRydWU7XG4gICAgfVxuXG4gICAgdXBkYXRlRmlsdGVycyhhdWRpb0J1ZmZlcikge1xuICAgICAgICAvLyBhc3NpZ24gZmlsdGVycyB0byBjb252b2x2ZXJzXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5uQ2g7IGkrKykge1xuICAgICAgICAgICAgdGhpcy5kZWNGaWx0ZXJzW2ldID0gdGhpcy5jdHguY3JlYXRlQnVmZmVyKDEsIGF1ZGlvQnVmZmVyLmxlbmd0aCwgYXVkaW9CdWZmZXIuc2FtcGxlUmF0ZSk7XG4gICAgICAgICAgICB0aGlzLmRlY0ZpbHRlcnNbaV0uZ2V0Q2hhbm5lbERhdGEoMCkuc2V0KGF1ZGlvQnVmZmVyLmdldENoYW5uZWxEYXRhKGkpKTtcblxuICAgICAgICAgICAgdGhpcy5kZWNGaWx0ZXJOb2Rlc1tpXS5idWZmZXIgPSB0aGlzLmRlY0ZpbHRlcnNbaV07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXNldEZpbHRlcnMoKSB7XG4gICAgICAgIC8vIG92ZXJ3cml0ZSBkZWNvZGluZyBmaWx0ZXJzIChwbGFpbiBjYXJkaW9pZCB2aXJ0dWFsIG1pY3JvcGhvbmVzKVxuICAgICAgICB2YXIgY2FyZEdhaW5zID0gbmV3IEFycmF5KHRoaXMubkNoKTtcbiAgICAgICAgY2FyZEdhaW5zLmZpbGwoMCk7XG4gICAgICAgIGNhcmRHYWluc1swXSA9IDAuNTtcbiAgICAgICAgY2FyZEdhaW5zWzFdID0gMC41IC8gTWF0aC5zcXJ0KDMpO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubkNoOyBpKyspIHtcbiAgICAgICAgICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgICAgICAgLy8gVGhpcyB3b3JrcyBmb3IgQ2hyb21lIGFuZCBGaXJlZm94OlxuICAgICAgICAgICAgLy8gdGhpcy5kZWNGaWx0ZXJzW2ldID0gdGhpcy5jdHguY3JlYXRlQnVmZmVyKDEsIDEsIHRoaXMuY3R4LnNhbXBsZVJhdGUpO1xuICAgICAgICAgICAgLy8gdGhpcy5kZWNGaWx0ZXJzW2ldLmdldENoYW5uZWxEYXRhKDApLnNldChbY2FyZEdhaW5zW2ldXSk7XG4gICAgICAgICAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgICAgICAgIC8vIFNhZmFyaSBmb3JjZXMgdXMgdG8gdXNlIHRoaXM6XG4gICAgICAgICAgICB0aGlzLmRlY0ZpbHRlcnNbaV0gPSB0aGlzLmN0eC5jcmVhdGVCdWZmZXIoMSwgNjQsIHRoaXMuY3R4LnNhbXBsZVJhdGUpO1xuICAgICAgICAgICAgLy8gYW5kIHdpbGwgc2VuZCBnb3JnZW91cyBjcmFuY2t5IG5vaXNlIGJ1cnN0cyBmb3IgYW55IHZhbHVlIGJlbG93IDY0XG4gICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IDY0OyBqKyspIHtcbiAgICAgICAgICAgICAgICB0aGlzLmRlY0ZpbHRlcnNbaV0uZ2V0Q2hhbm5lbERhdGEoMClbal0gPSAwLjA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmRlY0ZpbHRlcnNbaV0uZ2V0Q2hhbm5lbERhdGEoMClbMF0gPSBjYXJkR2FpbnNbaV07XG4gICAgICAgICAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgICAgICAgIHRoaXMuZGVjRmlsdGVyTm9kZXNbaV0uYnVmZmVyID0gdGhpcy5kZWNGaWx0ZXJzW2ldO1xuICAgICAgICB9XG4gICAgfVxufVxuIiwiLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vICBBcmNob250aXMgUG9saXRpc1xuLy8gIGFyY2hvbnRpcy5wb2xpdGlzQGFhbHRvLmZpXG4vLyAgRGF2aWQgUG9pcmllci1RdWlub3Rcbi8vICBkYXZpcG9pckBpcmNhbS5mclxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vXG4vLyAgV2ViQXVkaW9fSE9BIGEgSmF2YVNjcmlwdCBsaWJyYXJ5IGZvciBoaWdoZXItb3JkZXIgQW1iaXNvbmljc1xuLy8gIFRoZSBsaWJyYXJ5IGltcGxlbWVudHMgV2ViIEF1ZGlvIGJsb2NrcyB0aGF0IHBlcmZvcm1cbi8vICB0eXBpY2FsIGFtYmlzb25pYyBwcm9jZXNzaW5nIG9wZXJhdGlvbnMgb24gYXVkaW8gc2lnbmFscy5cbi8vXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLyogRk9BIEItRk9STUFUIFRPIEFDTi9OM0QgQ09OVkVSVEVSICovXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuZXhwb3J0IGNsYXNzIHd4eXoyYWNuIHtcblxuICAgIGNvbnN0cnVjdG9yKGF1ZGlvQ3R4KSB7XG5cbiAgICAgICAgdGhpcy5jdHggPSBhdWRpb0N0eDtcbiAgICAgICAgdGhpcy5pbiA9IHRoaXMuY3R4LmNyZWF0ZUNoYW5uZWxTcGxpdHRlcig0KTtcbiAgICAgICAgdGhpcy5vdXQgPSB0aGlzLmN0eC5jcmVhdGVDaGFubmVsTWVyZ2VyKDQpO1xuICAgICAgICB0aGlzLmdhaW5zID0gbmV3IEFycmF5KDQpO1xuXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgNDsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLmdhaW5zW2ldID0gdGhpcy5jdHguY3JlYXRlR2FpbigpO1xuICAgICAgICAgICAgaWYgKGkgPT0gMCkgdGhpcy5nYWluc1tpXS5nYWluLnZhbHVlID0gTWF0aC5TUVJUMjtcbiAgICAgICAgICAgIGVsc2UgdGhpcy5nYWluc1tpXS5nYWluLnZhbHVlID0gTWF0aC5zcXJ0KDMpO1xuXG4gICAgICAgICAgICB0aGlzLmdhaW5zW2ldLmNvbm5lY3QodGhpcy5vdXQsIDAsIGkpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuaW4uY29ubmVjdCh0aGlzLmdhaW5zWzBdLCAwLCAwKTtcbiAgICAgICAgdGhpcy5pbi5jb25uZWN0KHRoaXMuZ2FpbnNbM10sIDEsIDApO1xuICAgICAgICB0aGlzLmluLmNvbm5lY3QodGhpcy5nYWluc1sxXSwgMiwgMCk7XG4gICAgICAgIHRoaXMuaW4uY29ubmVjdCh0aGlzLmdhaW5zWzJdLCAzLCAwKTtcbiAgICB9XG59XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vKiBBQ04vTjNEIFRPIEZPQSBCLUZPUk1BVCBDT05WRVJURVIgKi9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5leHBvcnQgY2xhc3MgYWNuMnd4eXoge1xuXG4gICAgY29uc3RydWN0b3IoYXVkaW9DdHgpIHtcblxuICAgICAgICB0aGlzLmN0eCA9IGF1ZGlvQ3R4O1xuICAgICAgICB0aGlzLmluID0gdGhpcy5jdHguY3JlYXRlQ2hhbm5lbFNwbGl0dGVyKDQpO1xuICAgICAgICB0aGlzLm91dCA9IHRoaXMuY3R4LmNyZWF0ZUNoYW5uZWxNZXJnZXIoNCk7XG4gICAgICAgIHRoaXMuZ2FpbnMgPSBuZXcgQXJyYXkoNCk7XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCA0OyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMuZ2FpbnNbaV0gPSB0aGlzLmN0eC5jcmVhdGVHYWluKCk7XG4gICAgICAgICAgICBpZiAoaSA9PSAwKSB0aGlzLmdhaW5zW2ldLmdhaW4udmFsdWUgPSBNYXRoLlNRUlQxXzI7XG4gICAgICAgICAgICBlbHNlIHRoaXMuZ2FpbnNbaV0uZ2Fpbi52YWx1ZSA9IDEgLyBNYXRoLnNxcnQoMyk7XG5cbiAgICAgICAgICAgIHRoaXMuZ2FpbnNbaV0uY29ubmVjdCh0aGlzLm91dCwgMCwgaSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5pbi5jb25uZWN0KHRoaXMuZ2FpbnNbMF0sIDAsIDApO1xuICAgICAgICB0aGlzLmluLmNvbm5lY3QodGhpcy5nYWluc1syXSwgMSwgMCk7XG4gICAgICAgIHRoaXMuaW4uY29ubmVjdCh0aGlzLmdhaW5zWzNdLCAyLCAwKTtcbiAgICAgICAgdGhpcy5pbi5jb25uZWN0KHRoaXMuZ2FpbnNbMV0sIDMsIDApO1xuICAgIH1cbn1cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLyogQUNOL1NOM0QgVE8gQUNOL04zRCBDT05WRVJURVIgKi9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5leHBvcnQgY2xhc3Mgc24zZDJuM2Qge1xuICAgIFxuICAgIGNvbnN0cnVjdG9yKGF1ZGlvQ3R4LCBvcmRlcikge1xuICAgICAgICBcbiAgICAgICAgdGhpcy5jdHggPSBhdWRpb0N0eDtcbiAgICAgICAgdGhpcy5vcmRlciA9IG9yZGVyO1xuICAgICAgICB0aGlzLm5DaCA9IChvcmRlciArIDEpICogKG9yZGVyICsgMSk7XG4gICAgICAgIHRoaXMuaW4gPSB0aGlzLmN0eC5jcmVhdGVDaGFubmVsU3BsaXR0ZXIodGhpcy5uQ2gpO1xuICAgICAgICB0aGlzLm91dCA9IHRoaXMuY3R4LmNyZWF0ZUNoYW5uZWxNZXJnZXIodGhpcy5uQ2gpO1xuICAgICAgICB0aGlzLmdhaW5zID0gbmV3IEFycmF5KHRoaXMubkNoKTtcbiAgICAgICAgXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5uQ2g7IGkrKykge1xuICAgICAgICAgICAgdmFyIG4gPSBNYXRoLmZsb29yKE1hdGguc3FydChpKSk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHRoaXMuZ2FpbnNbaV0gPSB0aGlzLmN0eC5jcmVhdGVHYWluKCk7XG4gICAgICAgICAgICB0aGlzLmdhaW5zW2ldLmdhaW4udmFsdWUgPSBNYXRoLnNxcnQoMipuKzEpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICB0aGlzLmluLmNvbm5lY3QodGhpcy5nYWluc1tpXSwgaSwgMCk7XG4gICAgICAgICAgICB0aGlzLmdhaW5zW2ldLmNvbm5lY3QodGhpcy5vdXQsIDAsIGkpO1xuICAgICAgICB9XG4gICAgfVxufVxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLyogQUNOL04zRCBUTyBBQ04vU04zRCBDT05WRVJURVIgKi9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5leHBvcnQgY2xhc3MgbjNkMnNuM2Qge1xuICAgIFxuICAgIGNvbnN0cnVjdG9yKGF1ZGlvQ3R4LCBvcmRlcikge1xuICAgICAgICBcbiAgICAgICAgdGhpcy5jdHggPSBhdWRpb0N0eDtcbiAgICAgICAgdGhpcy5vcmRlciA9IG9yZGVyO1xuICAgICAgICB0aGlzLm5DaCA9IChvcmRlciArIDEpICogKG9yZGVyICsgMSk7XG4gICAgICAgIHRoaXMuaW4gPSB0aGlzLmN0eC5jcmVhdGVDaGFubmVsU3BsaXR0ZXIodGhpcy5uQ2gpO1xuICAgICAgICB0aGlzLm91dCA9IHRoaXMuY3R4LmNyZWF0ZUNoYW5uZWxNZXJnZXIodGhpcy5uQ2gpO1xuICAgICAgICB0aGlzLmdhaW5zID0gbmV3IEFycmF5KHRoaXMubkNoKTtcbiAgICAgICAgXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5uQ2g7IGkrKykge1xuICAgICAgICAgICAgdmFyIG4gPSBNYXRoLmZsb29yKE1hdGguc3FydChpKSk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHRoaXMuZ2FpbnNbaV0gPSB0aGlzLmN0eC5jcmVhdGVHYWluKCk7XG4gICAgICAgICAgICB0aGlzLmdhaW5zW2ldLmdhaW4udmFsdWUgPSAxL01hdGguc3FydCgyKm4rMSk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHRoaXMuaW4uY29ubmVjdCh0aGlzLmdhaW5zW2ldLCBpLCAwKTtcbiAgICAgICAgICAgIHRoaXMuZ2FpbnNbaV0uY29ubmVjdCh0aGlzLm91dCwgMCwgaSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLyogRlVNQSBUTyBBQ04vTjNEIENPTlZFUlRFUiAqL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuZXhwb3J0IGNsYXNzIGZ1bWEyYWNuIHtcblxuICAgIGNvbnN0cnVjdG9yKGF1ZGlvQ3R4LCBvcmRlcikge1xuICAgICAgICBcbiAgICAgICAgaWYgKG9yZGVyPjMpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiRnVNYSBzcGVjaWZpY3Rpb24gaXMgc3VwcG9ydGVkIHVwIHRvIDNyZCBvcmRlclwiKTtcbiAgICAgICAgICAgIG9yZGVyID0gMztcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gcmUtbWFwcGluZyBpbmRpY2VzIGZyb20gRnVNYSBjaGFubmVscyB0byBBQ05cbiAgICAgICAgLy8gdmFyIGluZGV4X2Z1bWEyYWNuID0gWzAsIDIsIDMsIDEsIDgsIDYsIDQsIDUsIDcsIDE1LCAxMywgMTEsIDksIDEwLCAxMiwgMTRdO1xuICAgICAgICAvLyAvLyAgICAgICAgICAgICAgICAgICAgVyAgWSAgWiAgWCAgViAgVCAgUiAgUyAgVSAgUSAgIE8gICBNICAgSyAgTCAgIE4gICBQXG4gICAgICAgIFxuICAgICAgICAvLyBnYWlucyBmb3IgZWFjaCBGdU1hIGNoYW5uZWwgdG8gTjNELCBhZnRlciByZS1tYXBwaW5nIGNoYW5uZWxzXG4gICAgICAgIHZhciBnYWluc19mdW1hMm4zZCA9IFtNYXRoLnNxcnQoMiksICAgICAvLyBXXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBNYXRoLnNxcnQoMyksICAgICAvLyBZXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBNYXRoLnNxcnQoMyksICAgICAvLyBaXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBNYXRoLnNxcnQoMyksICAgICAvLyBYXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBNYXRoLnNxcnQoMTUpLzIsICAvLyBWXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBNYXRoLnNxcnQoMTUpLzIsICAvLyBUXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBNYXRoLnNxcnQoNSksICAgICAvLyBSXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBNYXRoLnNxcnQoMTUpLzIsICAvLyBTXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBNYXRoLnNxcnQoMTUpLzIsICAvLyBVXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBNYXRoLnNxcnQoMzUvOCksICAvLyBRXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBNYXRoLnNxcnQoMzUpLzMsICAvLyBPXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBNYXRoLnNxcnQoMjI0LzQ1KSwvLyBNXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBNYXRoLnNxcnQoNyksICAgICAvLyBLXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBNYXRoLnNxcnQoMjI0LzQ1KSwvLyBMXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBNYXRoLnNxcnQoMzUpLzMsICAvLyBOXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBNYXRoLnNxcnQoMzUvOCldICAvLyBQXG4gICAgICAgIFxuICAgICAgICB0aGlzLmN0eCA9IGF1ZGlvQ3R4O1xuICAgICAgICB0aGlzLm9yZGVyID0gb3JkZXI7XG4gICAgICAgIHRoaXMubkNoID0gKG9yZGVyICsgMSkgKiAob3JkZXIgKyAxKTtcbiAgICAgICAgdGhpcy5pbiA9IHRoaXMuY3R4LmNyZWF0ZUNoYW5uZWxTcGxpdHRlcih0aGlzLm5DaCk7XG4gICAgICAgIHRoaXMub3V0ID0gdGhpcy5jdHguY3JlYXRlQ2hhbm5lbE1lcmdlcih0aGlzLm5DaCk7XG4gICAgICAgIHRoaXMuZ2FpbnMgPSBbXTtcbiAgICAgICAgdGhpcy5yZW1hcEFycmF5ID0gW107XG5cbiAgICAgICAgLy8gZ2V0IGNoYW5uZWwgcmVtYXBwaW5nIHZhbHVlcyBvcmRlciAwLTFcbiAgICAgICAgdGhpcy5yZW1hcEFycmF5LnB1c2goMCwgMiwgMywgMSk7IC8vIG1hbnVhbGx5IGhhbmRsZSB1bnRpbCBvcmRlciAxXG5cbiAgICAgICAgLy8gZ2V0IGNoYW5uZWwgcmVtYXBwaW5nIHZhbHVlcyBvcmRlciAyLU5cbiAgICAgICAgaWYgKG9yZGVyPjEpIHtcbiAgICAgICAgICAgIHZhciBvID0gMDtcbiAgICAgICAgICAgIHZhciBtO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm5DaDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgbSA9IFtdO1xuICAgICAgICAgICAgICAgIGlmIChpID49IChvICsgMSkgKiAobyArIDEpKSB7XG4gICAgICAgICAgICAgICAgICAgIG8gKz0gMTtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IChvICsgMSkgKiAobyArIDEpOyBqIDwgKG8gKyAyKSAqIChvICsgMik7IGorKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCgoaiArIG8gJSAyKSAlIDIpID09IDApIHsgbS5wdXNoKGopIH0gZWxzZSB7IG0udW5zaGlmdChqKSB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5yZW1hcEFycmF5ID0gdGhpcy5yZW1hcEFycmF5LmNvbmNhdChtKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBjb25uZWN0IGlucHV0cy9vdXRwdXRzIChrZXB0IHNlcGFyYXRlZCBmb3IgY2xhcml0eSdzIHNha2UpXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5uQ2g7IGkrKykge1xuICAgICAgICAgICAgdGhpcy5nYWluc1tpXSA9IHRoaXMuY3R4LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgICAgIHRoaXMuZ2FpbnNbaV0uZ2Fpbi52YWx1ZSA9IGdhaW5zX2Z1bWEybjNkW2ldO1xuICAgICAgICAgICAgdGhpcy5pbi5jb25uZWN0KHRoaXMuZ2FpbnNbaV0sIHRoaXMucmVtYXBBcnJheVtpXSwgMCk7XG4gICAgICAgICAgICB0aGlzLmdhaW5zW2ldLmNvbm5lY3QodGhpcy5vdXQsIDAsIGkpO1xuICAgICAgICB9XG4gICAgfVxufVxuIiwiLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vICBBcmNob250aXMgUG9saXRpc1xuLy8gIGFyY2hvbnRpcy5wb2xpdGlzQGFhbHRvLmZpXG4vLyAgRGF2aWQgUG9pcmllci1RdWlub3Rcbi8vICBkYXZpcG9pckBpcmNhbS5mclxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vXG4vLyAgV2ViQXVkaW9fSE9BIGEgSmF2YVNjcmlwdCBsaWJyYXJ5IGZvciBoaWdoZXItb3JkZXIgQW1iaXNvbmljc1xuLy8gIFRoZSBsaWJyYXJ5IGltcGxlbWVudHMgV2ViIEF1ZGlvIGJsb2NrcyB0aGF0IHBlcmZvcm1cbi8vICB0eXBpY2FsIGFtYmlzb25pYyBwcm9jZXNzaW5nIG9wZXJhdGlvbnMgb24gYXVkaW8gc2lnbmFscy5cbi8vXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8qIFBSRVNTVVJFLVZFTE9DSVRZIElOVEVOU0lUWSBBTkFMWVpFUiAqL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbi8vIGZvciBTYWZhcmkgc3VwcG9ydCB3aGVyZSBhdWRpb0NvbnRleHQuQW5hbHlzZXIuZ2V0RmxvYXRUaW1lRG9tYWluRGF0YSBpcyBub3QgZGVmaW5lZCBmb3Igbm93XG5pbXBvcnQgJ2dldC1mbG9hdC10aW1lLWRvbWFpbi1kYXRhJztcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgaW50ZW5zaXR5QW5hbHlzZXIge1xuICAgIGNvbnN0cnVjdG9yKGF1ZGlvQ3R4KSB7XG5cbiAgICAgICAgdGhpcy5jdHggPSBhdWRpb0N0eDtcbiAgICAgICAgdGhpcy5mZnRTaXplID0gMjA0ODtcbiAgICAgICAgLy8gSW5wdXQgYW5kIG91dHB1dCBub2Rlc1xuICAgICAgICB0aGlzLmluID0gdGhpcy5jdHguY3JlYXRlQ2hhbm5lbFNwbGl0dGVyKDQpO1xuICAgICAgICB0aGlzLm91dCA9IHRoaXMuY3R4LmNyZWF0ZUNoYW5uZWxNZXJnZXIoNCk7XG4gICAgICAgIC8vIEdhaW5zIHRvIGdvIGZyb20gQUNOL04zRCB0byBwcmVzc3VyZS12ZWxvY2l0eSAoV1hZWilcbiAgICAgICAgdGhpcy5nYWlucyA9IG5ldyBBcnJheSgzKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCAzOyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMuZ2FpbnNbaV0gPSB0aGlzLmN0eC5jcmVhdGVHYWluKCk7XG4gICAgICAgICAgICB0aGlzLmdhaW5zW2ldLmdhaW4udmFsdWUgPSAxIC8gTWF0aC5zcXJ0KDMpO1xuICAgICAgICB9XG4gICAgICAgIC8vIEluaXRpYWxpemUgYW5hbHl6ZXIgYnVmZmVyc1xuICAgICAgICB0aGlzLmFuYWx5c2VycyA9IG5ldyBBcnJheSg0KTtcbiAgICAgICAgdGhpcy5hbmFsQnVmZmVycyA9IG5ldyBBcnJheSg0KTtcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IDQ7IGkrKykge1xuICAgICAgICAgICAgdGhpcy5hbmFseXNlcnNbaV0gPSB0aGlzLmN0eC5jcmVhdGVBbmFseXNlcigpO1xuICAgICAgICAgICAgdGhpcy5hbmFseXNlcnNbaV0uZmZ0U2l6ZSA9IHRoaXMuZmZ0U2l6ZTtcbiAgICAgICAgICAgIHRoaXMuYW5hbHlzZXJzW2ldLnNtb290aGluZ1RpbWVDb25zdGFudCA9IDA7XG4gICAgICAgICAgICB0aGlzLmFuYWxCdWZmZXJzW2ldID0gbmV3IEZsb2F0MzJBcnJheSh0aGlzLmZmdFNpemUpO1xuICAgICAgICB9XG4gICAgICAgIC8vIENyZWF0ZSBjb25uZWN0aW9uc1xuICAgICAgICB0aGlzLmluLmNvbm5lY3QodGhpcy5vdXQsIDAsIDApO1xuICAgICAgICB0aGlzLmluLmNvbm5lY3QodGhpcy5hbmFseXNlcnNbMF0sIDAsIDApO1xuICAgICAgICBcbiAgICAgICAgdGhpcy5pbi5jb25uZWN0KHRoaXMuZ2FpbnNbMV0sIDEsIDApO1xuICAgICAgICB0aGlzLmluLmNvbm5lY3QodGhpcy5nYWluc1syXSwgMiwgMCk7XG4gICAgICAgIHRoaXMuaW4uY29ubmVjdCh0aGlzLmdhaW5zWzBdLCAzLCAwKTtcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IDM7IGkrKykge1xuICAgICAgICAgICAgdGhpcy5nYWluc1tpXS5jb25uZWN0KHRoaXMuYW5hbHlzZXJzW2krMV0sIDAsIDApO1xuICAgICAgICAgICAgdGhpcy5nYWluc1tpXS5jb25uZWN0KHRoaXMub3V0LCAwLCBpKzEpO1xuICAgICAgICB9XG5cbiAgICB9XG5cbiAgICB1cGRhdGVCdWZmZXJzKCkge1xuICAgICAgICAvLyBHZXQgbGF0ZXN0IHRpbWUtZG9tYWluIGRhdGFcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCA0OyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMuYW5hbHlzZXJzW2ldLmdldEZsb2F0VGltZURvbWFpbkRhdGEodGhpcy5hbmFsQnVmZmVyc1tpXSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBjb21wdXRlSW50ZW5zaXR5KCkge1xuICAgICAgICAvLyBDb21wdXRlIGNvcnJlbGF0aW9ucyBhbmQgZW5lcmdpZXMgb2YgY2hhbm5lbHNcbiAgICAgICAgdmFyIGlYID0gMDtcbiAgICAgICAgdmFyIGlZID0gMDtcbiAgICAgICAgdmFyIGlaID0gMDtcbiAgICAgICAgdmFyIFdXID0gMDtcbiAgICAgICAgdmFyIFhYID0gMDtcbiAgICAgICAgdmFyIFlZID0gMDtcbiAgICAgICAgdmFyIFpaID0gMDtcbiAgICAgICAgdmFyIEksIElfbm9ybSwgRSwgUHNpLCBhemltLCBlbGV2O1xuICAgICAgICAvLyBBY2N1bXVsYXRvcnMgZm9yIGNvcnJlbGF0aW9ucyBhbmQgZW5lcmdpZXNcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmZmdFNpemU7IGkrKykge1xuXG4gICAgICAgICAgICBpWCA9IGlYICsgdGhpcy5hbmFsQnVmZmVyc1swXVtpXSAqIHRoaXMuYW5hbEJ1ZmZlcnNbMV1baV07XG4gICAgICAgICAgICBpWSA9IGlZICsgdGhpcy5hbmFsQnVmZmVyc1swXVtpXSAqIHRoaXMuYW5hbEJ1ZmZlcnNbMl1baV07XG4gICAgICAgICAgICBpWiA9IGlaICsgdGhpcy5hbmFsQnVmZmVyc1swXVtpXSAqIHRoaXMuYW5hbEJ1ZmZlcnNbM11baV07XG4gICAgICAgICAgICBXVyA9IFdXICsgdGhpcy5hbmFsQnVmZmVyc1swXVtpXSAqIHRoaXMuYW5hbEJ1ZmZlcnNbMF1baV07XG4gICAgICAgICAgICBYWCA9IFhYICsgdGhpcy5hbmFsQnVmZmVyc1sxXVtpXSAqIHRoaXMuYW5hbEJ1ZmZlcnNbMV1baV07XG4gICAgICAgICAgICBZWSA9IFlZICsgdGhpcy5hbmFsQnVmZmVyc1syXVtpXSAqIHRoaXMuYW5hbEJ1ZmZlcnNbMl1baV07XG4gICAgICAgICAgICBaWiA9IFpaICsgdGhpcy5hbmFsQnVmZmVyc1szXVtpXSAqIHRoaXMuYW5hbEJ1ZmZlcnNbM11baV07XG4gICAgICAgIH1cbiAgICAgICAgSSA9IFtpWCwgaVksIGlaXTsgLy8gaW50ZW5zaXR5XG4gICAgICAgIElfbm9ybSA9IE1hdGguc3FydChJWzBdKklbMF0gKyBJWzFdKklbMV0gKyBJWzJdKklbMl0pOyAvLyBpbnRlbnNpdHkgbWFnbml0dWRlXG4gICAgICAgIEUgPSAoV1cgKyBYWCArIFlZICsgWlopIC8gMjsgLy8gZW5lcmd5XG4gICAgICAgIFBzaSA9IDEgLSBJX25vcm0gLyAoRSArIDEwZS04KTsgLy8gZGlmZnVzZW5lc3NcbiAgICAgICAgYXppbSA9IE1hdGguYXRhbjIoaVksIGlYKSAqIDE4MCAvIE1hdGguUEk7XG4gICAgICAgIGVsZXYgPSBNYXRoLmF0YW4yKElbMl0sIE1hdGguc3FydChJWzBdICogSVswXSArIElbMV0gKiBJWzFdKSkgKiAxODAgLyBNYXRoLlBJO1xuXG4gICAgICAgIHZhciBwYXJhbXMgPSBbYXppbSwgZWxldiwgUHNpLCBFXTtcbiAgICAgICAgcmV0dXJuIHBhcmFtcztcbiAgICB9XG59XG4iLCIvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gIEFyY2hvbnRpcyBQb2xpdGlzXG4vLyAgYXJjaG9udGlzLnBvbGl0aXNAYWFsdG8uZmlcbi8vICBEYXZpZCBQb2lyaWVyLVF1aW5vdFxuLy8gIGRhdmlwb2lyQGlyY2FtLmZyXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy9cbi8vICBXZWJBdWRpb19IT0EgYSBKYXZhU2NyaXB0IGxpYnJhcnkgZm9yIGhpZ2hlci1vcmRlciBBbWJpc29uaWNzXG4vLyAgVGhlIGxpYnJhcnkgaW1wbGVtZW50cyBXZWIgQXVkaW8gYmxvY2tzIHRoYXQgcGVyZm9ybVxuLy8gIHR5cGljYWwgYW1iaXNvbmljIHByb2Nlc3Npbmcgb3BlcmF0aW9ucyBvbiBhdWRpbyBzaWduYWxzLlxuLy9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbi8vLy8vLy8vLy8vLy8vLy8vXG4vKiBIT0EgRU5DT0RFUiAqL1xuLy8vLy8vLy8vLy8vLy8vLy9cblxuaW1wb3J0ICogYXMganNobGliIGZyb20gJ3NwaGVyaWNhbC1oYXJtb25pYy10cmFuc2Zvcm0nO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBtb25vRW5jb2RlciB7XG5cbiAgICBjb25zdHJ1Y3RvcihhdWRpb0N0eCwgb3JkZXIpIHtcblxuICAgICAgICB0aGlzLmluaXRpYWxpemVkID0gZmFsc2U7XG5cbiAgICAgICAgdGhpcy5jdHggPSBhdWRpb0N0eDtcbiAgICAgICAgdGhpcy5vcmRlciA9IG9yZGVyO1xuICAgICAgICB0aGlzLm5DaCA9IChvcmRlciArIDEpICogKG9yZGVyICsgMSk7XG4gICAgICAgIHRoaXMuYXppbSA9IDA7XG4gICAgICAgIHRoaXMuZWxldiA9IDA7XG4gICAgICAgIHRoaXMuZ2FpbnMgPSBuZXcgQXJyYXkodGhpcy5uQ2gpO1xuICAgICAgICB0aGlzLmdhaW5Ob2RlcyA9IG5ldyBBcnJheSh0aGlzLm5DaCk7XG4gICAgICAgIHRoaXMuaW4gPSB0aGlzLmN0eC5jcmVhdGVHYWluKCk7XG4gICAgICAgIHRoaXMuaW4uY2hhbm5lbENvdW50TW9kZSA9ICdleHBsaWNpdCc7XG4gICAgICAgIHRoaXMuaW4uY2hhbm5lbENvdW50ID0gMTtcbiAgICAgICAgdGhpcy5vdXQgPSB0aGlzLmN0eC5jcmVhdGVDaGFubmVsTWVyZ2VyKHRoaXMubkNoKTtcbiAgICAgICAgLy8gSW5pdGlhbGl6ZSBlbmNvZGluZyBnYWluc1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubkNoOyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMuZ2Fpbk5vZGVzW2ldID0gdGhpcy5jdHguY3JlYXRlR2FpbigpO1xuICAgICAgICAgICAgdGhpcy5nYWluTm9kZXNbaV0uY2hhbm5lbENvdW50TW9kZSA9ICdleHBsaWNpdCc7XG4gICAgICAgICAgICB0aGlzLmdhaW5Ob2Rlc1tpXS5jaGFubmVsQ291bnQgPSAxO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMudXBkYXRlR2FpbnMoKTtcbiAgICAgICAgLy8gTWFrZSBhdWRpbyBjb25uZWN0aW9uc1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubkNoOyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMuaW4uY29ubmVjdCh0aGlzLmdhaW5Ob2Rlc1tpXSk7XG4gICAgICAgICAgICB0aGlzLmdhaW5Ob2Rlc1tpXS5jb25uZWN0KHRoaXMub3V0LCAwLCBpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuaW5pdGlhbGl6ZWQgPSB0cnVlO1xuICAgIH1cblxuICAgIHVwZGF0ZUdhaW5zKCkge1xuICAgICAgICB2YXIgTiA9IHRoaXMub3JkZXI7XG4gICAgICAgIHZhciBnX2VuYyA9IGpzaGxpYi5jb21wdXRlUmVhbFNIKE4sIFtcbiAgICAgICAgICAgIFt0aGlzLmF6aW0gKiBNYXRoLlBJIC8gMTgwLCB0aGlzLmVsZXYgKiBNYXRoLlBJIC8gMTgwXVxuICAgICAgICBdKTtcblxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubkNoOyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMuZ2FpbnNbaV0gPSBnX2VuY1tpXVswXTtcbiAgICAgICAgICAgIHRoaXMuZ2Fpbk5vZGVzW2ldLmdhaW4udmFsdWUgPSB0aGlzLmdhaW5zW2ldO1xuICAgICAgICB9XG4gICAgfVxufVxuIiwiLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vICBBcmNob250aXMgUG9saXRpc1xuLy8gIGFyY2hvbnRpcy5wb2xpdGlzQGFhbHRvLmZpXG4vLyAgRGF2aWQgUG9pcmllci1RdWlub3Rcbi8vICBkYXZpcG9pckBpcmNhbS5mclxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vXG4vLyAgV2ViQXVkaW9fSE9BIGEgSmF2YVNjcmlwdCBsaWJyYXJ5IGZvciBoaWdoZXItb3JkZXIgQW1iaXNvbmljc1xuLy8gIFRoZSBsaWJyYXJ5IGltcGxlbWVudHMgV2ViIEF1ZGlvIGJsb2NrcyB0aGF0IHBlcmZvcm1cbi8vICB0eXBpY2FsIGFtYmlzb25pYyBwcm9jZXNzaW5nIG9wZXJhdGlvbnMgb24gYXVkaW8gc2lnbmFscy5cbi8vXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLyogSE9BIE9SREVSIExJTUlURVIgKi9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIG9yZGVyTGltaXRlciB7XG5cbiAgICBjb25zdHJ1Y3RvcihhdWRpb0N0eCwgb3JkZXJJbiwgb3JkZXJPdXQpIHtcblxuICAgICAgICB0aGlzLmN0eCA9IGF1ZGlvQ3R4O1xuICAgICAgICB0aGlzLm9yZGVySW4gPSBvcmRlckluO1xuICAgICAgICBpZiAob3JkZXJPdXQgPCBvcmRlckluKSB0aGlzLm9yZGVyT3V0ID0gb3JkZXJPdXQ7XG4gICAgICAgIGVsc2UgdGhpcy5vcmRlck91dCA9IG9yZGVySW47XG5cbiAgICAgICAgdGhpcy5uQ2hJbiA9ICh0aGlzLm9yZGVySW4gKyAxKSAqICh0aGlzLm9yZGVySW4gKyAxKTtcbiAgICAgICAgdGhpcy5uQ2hPdXQgPSAodGhpcy5vcmRlck91dCArIDEpICogKHRoaXMub3JkZXJPdXQgKyAxKTtcbiAgICAgICAgdGhpcy5pbiA9IHRoaXMuY3R4LmNyZWF0ZUNoYW5uZWxTcGxpdHRlcih0aGlzLm5DaEluKTtcbiAgICAgICAgdGhpcy5vdXQgPSB0aGlzLmN0eC5jcmVhdGVDaGFubmVsTWVyZ2VyKHRoaXMubkNoT3V0KTtcblxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMubkNoT3V0OyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMuaW4uY29ubmVjdCh0aGlzLm91dCwgaSwgaSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB1cGRhdGVPcmRlcihvcmRlck91dCkge1xuXG4gICAgICAgIGlmIChvcmRlck91dCA8PSB0aGlzLm9yZGVySW4pIHtcbiAgICAgICAgICAgIHRoaXMub3JkZXJPdXQgPSBvcmRlck91dDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHJldHVybjtcblxuICAgICAgICB0aGlzLm5DaE91dCA9ICh0aGlzLm9yZGVyT3V0ICsgMSkgKiAodGhpcy5vcmRlck91dCArIDEpO1xuICAgICAgICB0aGlzLm91dC5kaXNjb25uZWN0KCk7XG4gICAgICAgIHRoaXMub3V0ID0gdGhpcy5jdHguY3JlYXRlQ2hhbm5lbE1lcmdlcih0aGlzLm5DaE91dCk7XG5cbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLm5DaE91dDsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLmluLmNvbm5lY3QodGhpcy5vdXQsIGksIGkpO1xuICAgICAgICB9XG4gICAgfVxufVxuIiwiLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vICBBcmNob250aXMgUG9saXRpc1xuLy8gIGFyY2hvbnRpcy5wb2xpdGlzQGFhbHRvLmZpXG4vLyAgRGF2aWQgUG9pcmllci1RdWlub3Rcbi8vICBkYXZpcG9pckBpcmNhbS5mclxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vXG4vLyAgV2ViQXVkaW9fSE9BIGEgSmF2YVNjcmlwdCBsaWJyYXJ5IGZvciBoaWdoZXItb3JkZXIgQW1iaXNvbmljc1xuLy8gIFRoZSBsaWJyYXJ5IGltcGxlbWVudHMgV2ViIEF1ZGlvIGJsb2NrcyB0aGF0IHBlcmZvcm1cbi8vICB0eXBpY2FsIGFtYmlzb25pYyBwcm9jZXNzaW5nIG9wZXJhdGlvbnMgb24gYXVkaW8gc2lnbmFscy5cbi8vXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vKiBIT0EgT1JERVIgV0VJR0hUSU5HICovXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbmltcG9ydCAqIGFzIGpzaGxpYiBmcm9tICdzcGhlcmljYWwtaGFybW9uaWMtdHJhbnNmb3JtJztcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3Mgb3JkZXJXZWlnaHQge1xuXG4gICAgY29uc3RydWN0b3IoYXVkaW9DdHgsIG9yZGVyKSB7XG5cbiAgICAgICAgdGhpcy5jdHggPSBhdWRpb0N0eDtcbiAgICAgICAgdGhpcy5vcmRlciA9IG9yZGVyO1xuICAgICAgICBcbiAgICAgICAgdGhpcy5uQ2ggPSAodGhpcy5vcmRlciArIDEpICogKHRoaXMub3JkZXIgKyAxKTtcbiAgICAgICAgdGhpcy5pbiA9IHRoaXMuY3R4LmNyZWF0ZUNoYW5uZWxTcGxpdHRlcih0aGlzLm5DaCk7XG4gICAgICAgIHRoaXMub3V0ID0gdGhpcy5jdHguY3JlYXRlQ2hhbm5lbE1lcmdlcih0aGlzLm5DaCk7XG4gICAgICAgIFxuICAgICAgICB0aGlzLmdhaW5zID0gbmV3IEFycmF5KHRoaXMubkNoKTtcbiAgICAgICAgdGhpcy5vcmRlckdhaW5zID0gbmV3IEFycmF5KHRoaXMub3JkZXIrMSlcbiAgICAgICAgdGhpcy5vcmRlckdhaW5zLmZpbGwoMSk7XG5cbiAgICAgICAgLy8gaW5pdGlhbGl6ZSBnYWlucyBhbmQgY29ubmVjdGlvbnNcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLm5DaDsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLmdhaW5zW2ldID0gdGhpcy5jdHguY3JlYXRlR2FpbigpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICB0aGlzLmluLmNvbm5lY3QodGhpcy5nYWluc1tpXSwgaSwgMCk7XG4gICAgICAgICAgICB0aGlzLmdhaW5zW2ldLmNvbm5lY3QodGhpcy5vdXQsMCxpKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHVwZGF0ZU9yZGVyR2FpbnMoKSB7XG5cbiAgICAgICAgdmFyIG47XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5uQ2g7IGkrKykge1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBuID0gTWF0aC5mbG9vcihNYXRoLnNxcnQoaSkpO1xuICAgICAgICAgICAgdGhpcy5nYWluc1tpXS5nYWluLnZhbHVlID0gdGhpcy5vcmRlckdhaW5zW25dO1xuICAgICAgICB9XG4gICAgfVxuICAgIFxuICAgIGNvbXB1dGVNYXhSRUNvZWZmcygpIHtcbiAgICAgICAgXG4gICAgICAgIHZhciBOID0gdGhpcy5vcmRlcjtcbiAgICAgICAgdGhpcy5vcmRlckdhaW5zWzBdID0gMTtcbiAgICAgICAgdmFyIGxlZ19uX21pbnVzMSA9IDA7XG4gICAgICAgIHZhciBsZWdfbl9taW51czIgPSAwO1xuICAgICAgICB2YXIgbGVnX24gPSAwO1xuICAgICAgICBmb3IgKHZhciBuID0gMTsgbiA8PSBOOyBuKyspIHtcbiAgICAgICAgICAgIGxlZ19uID0ganNobGliLnJlY3Vyc2VMZWdlbmRyZVBvbHkobiwgW01hdGguY29zKDIuNDA2ODA5IC8gKE4gKyAxLjUxKSldLCBsZWdfbl9taW51czEsIGxlZ19uX21pbnVzMik7XG4gICAgICAgICAgICB0aGlzLm9yZGVyR2FpbnNbbl0gPSBsZWdfblswXVswXTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgbGVnX25fbWludXMyID0gbGVnX25fbWludXMxO1xuICAgICAgICAgICAgbGVnX25fbWludXMxID0gbGVnX247XG4gICAgICAgIH1cbiAgICB9XG59XG4iLCIvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gIEFyY2hvbnRpcyBQb2xpdGlzXG4vLyAgYXJjaG9udGlzLnBvbGl0aXNAYWFsdG8uZmlcbi8vICBEYXZpZCBQb2lyaWVyLVF1aW5vdFxuLy8gIGRhdmlwb2lyQGlyY2FtLmZyXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy9cbi8vICBXZWJBdWRpb19IT0EgYSBKYXZhU2NyaXB0IGxpYnJhcnkgZm9yIGhpZ2hlci1vcmRlciBBbWJpc29uaWNzXG4vLyAgVGhlIGxpYnJhcnkgaW1wbGVtZW50cyBXZWIgQXVkaW8gYmxvY2tzIHRoYXQgcGVyZm9ybVxuLy8gIHR5cGljYWwgYW1iaXNvbmljIHByb2Nlc3Npbmcgb3BlcmF0aW9ucyBvbiBhdWRpbyBzaWduYWxzLlxuLy9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLyogSE9BIFBPV0VSTUFQIEFOQUxZWkVSICovXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLy8vLy8vIE5PVCBJTVBFTUVOVEVEIFlFVCAhISEgLy8vLy8vL1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBwb3dlcm1hcEFuYWx5c2VyIHtcbiAgICBjb25zdHJ1Y3RvcihhdWRpb0N0eCwgb3JkZXIpIHtcbiAgICAgICAgdGhpcy5pbml0aWFsaXplZCA9IGZhbHNlO1xuXG4gICAgICAgIHRoaXMuY3R4ID0gYXVkaW9DdHg7XG4gICAgICAgIHRoaXMub3JkZXIgPSBvcmRlcjtcbiAgICAgICAgdGhpcy5uQ2ggPSAob3JkZXIgKyAxKSAqIChvcmRlciArIDEpO1xuICAgICAgICB0aGlzLmZmdFNpemUgPSAyMDQ4O1xuICAgICAgICB0aGlzLmFuYWx5c2VycyA9IG5ldyBBcnJheSh0aGlzLm5DaCk7XG4gICAgICAgIHRoaXMuYW5hbEJ1ZmZlcnMgPSBuZXcgQXJyYXkodGhpcy5uQ2gpO1xuICAgICAgICAvLyBJbnB1dCBhbmQgb3V0cHV0IG5vZGVzXG4gICAgICAgIHRoaXMuaW4gPSB0aGlzLmN0eC5jcmVhdGVDaGFubmVsU3BsaXR0ZXIodGhpcy5uQ2gpO1xuICAgICAgICB0aGlzLm91dCA9IHRoaXMuY3R4LmNyZWF0ZUNoYW5uZWxNZXJnZXIodGhpcy5uQ2gpO1xuICAgICAgICAvLyBJbml0aWFsaXplIGFuYWx5emVyIGJ1ZmZlcnNcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLm5DaDsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLmFuYWx5c2Vyc1tpXSA9IHRoaXMuY3R4LmNyZWF0ZUFuYWx5c2VyKCk7XG4gICAgICAgICAgICB0aGlzLmFuYWx5c2Vyc1tpXS5mZnRTaXplID0gdGhpcy5mZnRTaXplO1xuICAgICAgICAgICAgdGhpcy5hbmFseXNlcnNbaV0uc21vb3RoaW5nVGltZUNvbnN0YW50ID0gMDtcbiAgICAgICAgICAgIHRoaXMuYW5hbEJ1ZmZlcnNbaV0gPSBuZXcgRmxvYXQzMkFycmF5KHRoaXMuZmZ0U2l6ZSk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gQ3JlYXRlIGNvbm5lY3Rpb25zXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5uQ2g7IGkrKykge1xuICAgICAgICAgICAgdGhpcy5pbi5jb25uZWN0KHRoaXMub3V0LCBpLCBpKTtcbiAgICAgICAgICAgIHRoaXMuaW4uY29ubmVjdCh0aGlzLmFuYWx5c2Vyc1tpXSwgaSwgMCk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmluaXRpYWxpemVkID0gdHJ1ZTtcbiAgICB9XG5cbiAgICB1cGRhdGVCdWZmZXJzKCkge1xuICAgICAgICAvLyBHZXQgbGF0ZXN0IHRpbWUtZG9tYWluIGRhdGFcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLm5DaDsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLmFuYWx5c2Vyc1tpXS5nZXRGbG9hdFRpbWVEb21haW5EYXRhKHRoaXMuYW5hbEJ1ZmZlcnNbaV0pO1xuICAgICAgICB9XG4gICAgfVxuXG59XG4iLCIvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gIEFyY2hvbnRpcyBQb2xpdGlzXG4vLyAgYXJjaG9udGlzLnBvbGl0aXNAYWFsdG8uZmlcbi8vICBEYXZpZCBQb2lyaWVyLVF1aW5vdFxuLy8gIGRhdmlwb2lyQGlyY2FtLmZyXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy9cbi8vICBXZWJBdWRpb19IT0EgYSBKYXZhU2NyaXB0IGxpYnJhcnkgZm9yIGhpZ2hlci1vcmRlciBBbWJpc29uaWNzXG4vLyAgVGhlIGxpYnJhcnkgaW1wbGVtZW50cyBXZWIgQXVkaW8gYmxvY2tzIHRoYXQgcGVyZm9ybVxuLy8gIHR5cGljYWwgYW1iaXNvbmljIHByb2Nlc3Npbmcgb3BlcmF0aW9ucyBvbiBhdWRpbyBzaWduYWxzLlxuLy9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbi8vLy8vLy8vLy8vLy8vLy8vXG4vKiBIT0EgTUlSUk9SICovXG4vLy8vLy8vLy8vLy8vLy8vL1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBzY2VuZU1pcnJvciB7XG5cbiAgICBjb25zdHJ1Y3RvcihhdWRpb0N0eCwgb3JkZXIpIHtcblxuICAgICAgICB0aGlzLmN0eCA9IGF1ZGlvQ3R4O1xuICAgICAgICB0aGlzLm9yZGVyID0gb3JkZXI7XG4gICAgICAgIHRoaXMubkNoID0gKG9yZGVyICsgMSkgKiAob3JkZXIgKyAxKTtcbiAgICAgICAgdGhpcy5taXJyb3JQbGFuZSA9IDA7XG4gICAgICAgIC8vIElucHV0IGFuZCBvdXRwdXQgbm9kZXNcbiAgICAgICAgdGhpcy5pbiA9IHRoaXMuY3R4LmNyZWF0ZUNoYW5uZWxTcGxpdHRlcih0aGlzLm5DaCk7XG4gICAgICAgIHRoaXMub3V0ID0gdGhpcy5jdHguY3JlYXRlQ2hhbm5lbE1lcmdlcih0aGlzLm5DaCk7XG4gICAgICAgIC8vIEluaXRpYWxpemUgbWlycm9yaW5nIGdhaW5zIHRvIHVuaXR5IChubyByZWZsZWN0aW9uKSBhbmQgY29ubmVjdFxuICAgICAgICB0aGlzLmdhaW5zID0gbmV3IEFycmF5KHRoaXMubkNoKTtcbiAgICAgICAgZm9yICh2YXIgcSA9IDA7IHEgPCB0aGlzLm5DaDsgcSsrKSB7XG4gICAgICAgICAgICB0aGlzLmdhaW5zW3FdID0gdGhpcy5jdHguY3JlYXRlR2FpbigpO1xuICAgICAgICAgICAgdGhpcy5nYWluc1txXS5nYWluLnZhbHVlID0gMTtcbiAgICAgICAgICAgIC8vIENyZWF0ZSBjb25uZWN0aW9uc1xuICAgICAgICAgICAgdGhpcy5pbi5jb25uZWN0KHRoaXMuZ2FpbnNbcV0sIHEsIDApO1xuICAgICAgICAgICAgdGhpcy5nYWluc1txXS5jb25uZWN0KHRoaXMub3V0LCAwLCBxKTtcbiAgICAgICAgfVxuXG4gICAgfVxuICAgIFxuICAgIHJlc2V0KCkge1xuICAgICAgICBcbiAgICAgICAgZm9yICh2YXIgcSA9IDA7IHEgPCB0aGlzLm5DaDsgcSsrKSB7XG4gICAgICAgICAgICB0aGlzLmdhaW5zW3FdLmdhaW4udmFsdWUgPSAxO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgbWlycm9yKHBsYW5lTm8pIHtcbiAgICAgICAgXG4gICAgICAgIHN3aXRjaChwbGFuZU5vKSB7XG4gICAgICAgICAgICBjYXNlIDA6XG4gICAgICAgICAgICAgICAgdGhpcy5taXJyb3JQbGFuZSA9IDA7XG4gICAgICAgICAgICAgICAgdGhpcy5yZXNldCgpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAxOlxuICAgICAgICAgICAgICAgIC8vIG1pcnJvcmluZyBvbiB5ei1wbGFuZSAoZnJvbnQtYmFjaylcbiAgICAgICAgICAgICAgICB0aGlzLnJlc2V0KCk7XG4gICAgICAgICAgICAgICAgdGhpcy5taXJyb3JQbGFuZSA9IDE7XG4gICAgICAgICAgICAgICAgdmFyIHE7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgbiA9IDA7IG4gPD0gdGhpcy5vcmRlcjsgbisrKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIG0gPSAtbjsgbSA8PSBuOyBtKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHEgPSBuKm4rbittO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKChtPDAgJiYgbSUyPT0wKXx8KG0+MCAmJiBtJTI9PTEpKSB0aGlzLmdhaW5zW3FdLmdhaW4udmFsdWUgPSAtMTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgMjpcbiAgICAgICAgICAgICAgICAvLyBtaXJyb3Jpbmcgb24geHotcGxhbmUgKGxlZnQtcmlnaHQpXG4gICAgICAgICAgICAgICAgdGhpcy5yZXNldCgpO1xuICAgICAgICAgICAgICAgIHRoaXMubWlycm9yUGxhbmUgPSAyO1xuICAgICAgICAgICAgICAgIHZhciBxO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIG4gPSAwOyBuIDw9IHRoaXMub3JkZXI7IG4rKykge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBtID0gLW47IG0gPD0gbjsgbSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBxID0gbipuK24rbTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtPDApIHRoaXMuZ2FpbnNbcV0uZ2Fpbi52YWx1ZSA9IC0xO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAzOlxuICAgICAgICAgICAgICAgIC8vIG1pcnJvcmluZyBvbiB4eS1wbGFuZSAodXAtZG93bilcbiAgICAgICAgICAgICAgICB0aGlzLnJlc2V0KCk7XG4gICAgICAgICAgICAgICAgdGhpcy5taXJyb3JQbGFuZSA9IDM7XG4gICAgICAgICAgICAgICAgdmFyIHE7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgbiA9IDA7IG4gPD0gdGhpcy5vcmRlcjsgbisrKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIG0gPSAtbjsgbSA8PSBuOyBtKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHEgPSBuKm4rbittO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKChtK24pJTI9PTEpIHRoaXMuZ2FpbnNbcV0uZ2Fpbi52YWx1ZSA9IC0xO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlRoZSBtaXJyb3JpbmcgcGxhbmVzIGNhbiBiZSBlaXRoZXIgMSAoeXopLCAyICh4eiksIDMgKHh5KSwgb3IgMCAobm8gbWlycm9yaW5nKS4gVmFsdWUgc2V0IHRvIDAuXCIpXG4gICAgICAgICAgICAgICAgdGhpcy5taXJyb3JQbGFuZSA9IDA7XG4gICAgICAgICAgICAgICAgdGhpcy5yZXNldCgpO1xuICAgICAgICB9XG4gICAgICAgIFxuXG4gICAgfVxuXG59XG4iLCIvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gIEFyY2hvbnRpcyBQb2xpdGlzXG4vLyAgYXJjaG9udGlzLnBvbGl0aXNAYWFsdG8uZmlcbi8vICBEYXZpZCBQb2lyaWVyLVF1aW5vdFxuLy8gIGRhdmlwb2lyQGlyY2FtLmZyXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy9cbi8vICBXZWJBdWRpb19IT0EgYSBKYXZhU2NyaXB0IGxpYnJhcnkgZm9yIGhpZ2hlci1vcmRlciBBbWJpc29uaWNzXG4vLyAgVGhlIGxpYnJhcnkgaW1wbGVtZW50cyBXZWIgQXVkaW8gYmxvY2tzIHRoYXQgcGVyZm9ybVxuLy8gIHR5cGljYWwgYW1iaXNvbmljIHByb2Nlc3Npbmcgb3BlcmF0aW9ucyBvbiBhdWRpbyBzaWduYWxzLlxuLy9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbi8vLy8vLy8vLy8vLy8vLy8vXG4vKiBIT0EgUk9UQVRPUiAqL1xuLy8vLy8vLy8vLy8vLy8vLy9cblxuaW1wb3J0ICogYXMganNobGliIGZyb20gJ3NwaGVyaWNhbC1oYXJtb25pYy10cmFuc2Zvcm0nO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBzY2VuZVJvdGF0b3Ige1xuXG4gICAgY29uc3RydWN0b3IoYXVkaW9DdHgsIG9yZGVyKSB7XG5cbiAgICAgICAgdGhpcy5jdHggPSBhdWRpb0N0eDtcbiAgICAgICAgdGhpcy5vcmRlciA9IG9yZGVyO1xuICAgICAgICB0aGlzLm5DaCA9IChvcmRlciArIDEpICogKG9yZGVyICsgMSk7XG4gICAgICAgIHRoaXMueWF3ID0gMDtcbiAgICAgICAgdGhpcy5waXRjaCA9IDA7XG4gICAgICAgIHRoaXMucm9sbCA9IDA7XG4gICAgICAgIHRoaXMucm90TXR4ID0gbnVtZXJpYy5pZGVudGl0eSh0aGlzLm5DaCk7XG4gICAgICAgIHRoaXMucm90TXR4Tm9kZXMgPSBuZXcgQXJyYXkodGhpcy5vcmRlcik7XG4gICAgICAgIC8vIElucHV0IGFuZCBvdXRwdXQgbm9kZXNcbiAgICAgICAgdGhpcy5pbiA9IHRoaXMuY3R4LmNyZWF0ZUNoYW5uZWxTcGxpdHRlcih0aGlzLm5DaCk7XG4gICAgICAgIHRoaXMub3V0ID0gdGhpcy5jdHguY3JlYXRlQ2hhbm5lbE1lcmdlcih0aGlzLm5DaCk7XG4gICAgICAgIFxuICAgICAgICAvLyBJbml0aWFsaXplIHJvdGF0aW9uIGdhaW5zIHRvIGlkZW50aXR5IG1hdHJpeFxuICAgICAgICBmb3IgKHZhciBuID0gMTsgbiA8PSB0aGlzLm9yZGVyOyBuKyspIHtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdmFyIGdhaW5zX24gPSBuZXcgQXJyYXkoMiAqIG4gKyAxKTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgMiAqIG4gKyAxOyBpKyspIHtcbiAgICAgICAgICAgICAgICBnYWluc19uW2ldID0gbmV3IEFycmF5KDIgKiBuICsgMSk7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCAyICogbiArIDE7IGorKykge1xuICAgICAgICAgICAgICAgICAgICBnYWluc19uW2ldW2pdID0gdGhpcy5jdHguY3JlYXRlR2FpbigpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoaSA9PSBqKSBnYWluc19uW2ldW2pdLmdhaW4udmFsdWUgPSAxO1xuICAgICAgICAgICAgICAgICAgICBlbHNlIGdhaW5zX25baV1bal0uZ2Fpbi52YWx1ZSA9IDA7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5yb3RNdHhOb2Rlc1tuIC0gMV0gPSBnYWluc19uO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyBDcmVhdGUgY29ubmVjdGlvbnNcbiAgICAgICAgdGhpcy5pbi5jb25uZWN0KHRoaXMub3V0LCAwLCAwKTsgLy8gemVyb3RoIG9yZGVyIGNoLiBkb2VzIG5vdCByb3RhdGVcbiAgICAgICAgXG4gICAgICAgIHZhciBiYW5kX2lkeCA9IDE7XG4gICAgICAgIGZvciAobiA9IDE7IG4gPD0gdGhpcy5vcmRlcjsgbisrKSB7XG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgMiAqIG4gKyAxOyBpKyspIHtcbiAgICAgICAgICAgICAgICBmb3IgKGogPSAwOyBqIDwgMiAqIG4gKyAxOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pbi5jb25uZWN0KHRoaXMucm90TXR4Tm9kZXNbbiAtIDFdW2ldW2pdLCBiYW5kX2lkeCArIGosIDApO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnJvdE10eE5vZGVzW24gLSAxXVtpXVtqXS5jb25uZWN0KHRoaXMub3V0LCAwLCBiYW5kX2lkeCArIGkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJhbmRfaWR4ID0gYmFuZF9pZHggKyAyICogbiArIDE7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB1cGRhdGVSb3RNdHgoKSB7XG5cbiAgICAgICAgdmFyIHlhdyA9IHRoaXMueWF3ICogTWF0aC5QSSAvIDE4MDtcbiAgICAgICAgdmFyIHBpdGNoID0gdGhpcy5waXRjaCAqIE1hdGguUEkgLyAxODA7XG4gICAgICAgIHZhciByb2xsID0gdGhpcy5yb2xsICogTWF0aC5QSSAvIDE4MDtcblxuICAgICAgICB0aGlzLnJvdE10eCA9IGpzaGxpYi5nZXRTSHJvdE10eChqc2hsaWIueWF3UGl0Y2hSb2xsMlJ6eXgoeWF3LCBwaXRjaCwgcm9sbCksIHRoaXMub3JkZXIpO1xuXG4gICAgICAgIHZhciBiYW5kX2lkeCA9IDE7XG4gICAgICAgIGZvciAobGV0IG4gPSAxOyBuIDwgdGhpcy5vcmRlciArIDE7IG4rKykge1xuXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IDIgKiBuICsgMTsgaSsrKSB7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCAyICogbiArIDE7IGorKykge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnJvdE10eE5vZGVzW24gLSAxXVtpXVtqXS5nYWluLnZhbHVlID0gdGhpcy5yb3RNdHhbYmFuZF9pZHggKyBpXVtiYW5kX2lkeCArIGpdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJhbmRfaWR4ID0gYmFuZF9pZHggKyAyICogbiArIDE7XG4gICAgICAgIH1cbiAgICB9XG59XG4iLCIvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gIEFyY2hvbnRpcyBQb2xpdGlzXG4vLyAgYXJjaG9udGlzLnBvbGl0aXNAYWFsdG8uZmlcbi8vICBEYXZpZCBQb2lyaWVyLVF1aW5vdFxuLy8gIGRhdmlwb2lyQGlyY2FtLmZyXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy9cbi8vICBXZWJBdWRpb19IT0EgYSBKYXZhU2NyaXB0IGxpYnJhcnkgZm9yIGhpZ2hlci1vcmRlciBBbWJpc29uaWNzXG4vLyAgVGhlIGxpYnJhcnkgaW1wbGVtZW50cyBXZWIgQXVkaW8gYmxvY2tzIHRoYXQgcGVyZm9ybVxuLy8gIHR5cGljYWwgYW1iaXNvbmljIHByb2Nlc3Npbmcgb3BlcmF0aW9ucyBvbiBhdWRpbyBzaWduYWxzLlxuLy9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLyogSE9BIFZJUlRVQUwgTUlDUk9QSE9ORSAqL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbmltcG9ydCAqIGFzIGpzaGxpYiBmcm9tICdzcGhlcmljYWwtaGFybW9uaWMtdHJhbnNmb3JtJztcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgdmlydHVhbE1pYyB7XG5cbiAgICBjb25zdHJ1Y3RvcihhdWRpb0N0eCwgb3JkZXIpIHtcblxuICAgICAgICB0aGlzLmluaXRpYWxpemVkID0gZmFsc2U7XG5cbiAgICAgICAgdGhpcy5jdHggPSBhdWRpb0N0eDtcbiAgICAgICAgdGhpcy5vcmRlciA9IG9yZGVyO1xuICAgICAgICB0aGlzLm5DaCA9IChvcmRlciArIDEpICogKG9yZGVyICsgMSk7XG4gICAgICAgIHRoaXMuYXppbSA9IDA7XG4gICAgICAgIHRoaXMuZWxldiA9IDA7XG4gICAgICAgIHRoaXMudm1pY0dhaW5zID0gbmV3IEFycmF5KHRoaXMubkNoKTtcbiAgICAgICAgdGhpcy52bWljR2Fpbk5vZGVzID0gbmV3IEFycmF5KHRoaXMubkNoKTtcbiAgICAgICAgdGhpcy52bWljQ29lZmZzID0gbmV3IEFycmF5KHRoaXMub3JkZXIgKyAxKTtcbiAgICAgICAgdGhpcy52bWljUGF0dGVybiA9IFwiaHlwZXJjYXJkaW9pZFwiO1xuICAgICAgICB0aGlzLmluID0gdGhpcy5jdHguY3JlYXRlQ2hhbm5lbFNwbGl0dGVyKHRoaXMubkNoKTtcbiAgICAgICAgdGhpcy5vdXQgPSB0aGlzLmN0eC5jcmVhdGVHYWluKCk7XG5cbiAgICAgICAgLy8gSW5pdGlhbGl6ZSB2bWljIHRvIGZvcndhcmQgZmFjaW5nIGh5cGVyY2FyZGlvaWRcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm5DaDsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLnZtaWNHYWluTm9kZXNbaV0gPSB0aGlzLmN0eC5jcmVhdGVHYWluKCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5TSHh5eiA9IG5ldyBBcnJheSh0aGlzLm5DaCk7XG4gICAgICAgIHRoaXMuU0h4eXouZmlsbCgwKTtcbiAgICAgICAgdGhpcy51cGRhdGVQYXR0ZXJuKCk7XG4gICAgICAgIHRoaXMudXBkYXRlT3JpZW50YXRpb24oKTtcblxuICAgICAgICAvLyBDcmVhdGUgY29ubmVjdGlvbnNcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IHRoaXMubkNoOyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMuaW4uY29ubmVjdCh0aGlzLnZtaWNHYWluTm9kZXNbaV0sIGksIDApO1xuICAgICAgICAgICAgdGhpcy52bWljR2Fpbk5vZGVzW2ldLmNvbm5lY3QodGhpcy5vdXQpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5pbml0aWFsaXplZCA9IHRydWU7XG4gICAgfVxuXG5cbiAgICB1cGRhdGVQYXR0ZXJuKCkge1xuXG4gICAgICAgIGZ1bmN0aW9uIGNvbXB1dGVDYXJkaW9pZENvZWZmcyhOKSB7XG4gICAgICAgICAgICB2YXIgY29lZmZzID0gbmV3IEFycmF5KE4gKyAxKTtcbiAgICAgICAgICAgIGZvciAodmFyIG4gPSAwOyBuIDw9IE47IG4rKykge1xuICAgICAgICAgICAgICAgIGNvZWZmc1tuXSA9IGpzaGxpYi5mYWN0b3JpYWwoTikgKiBqc2hsaWIuZmFjdG9yaWFsKE4pIC8gKGpzaGxpYi5mYWN0b3JpYWwoTiArIG4gKyAxKSAqIGpzaGxpYi5mYWN0b3JpYWwoTiAtIG4pKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBjb2VmZnM7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBjb21wdXRlSHlwZXJjYXJkQ29lZmZzKE4pIHtcbiAgICAgICAgICAgIHZhciBjb2VmZnMgPSBuZXcgQXJyYXkoTiArIDEpO1xuICAgICAgICAgICAgdmFyIG5TSCA9IChOKzEpKihOKzEpO1xuICAgICAgICAgICAgZm9yICh2YXIgbiA9IDA7IG4gPD0gTjsgbisrKSB7XG4gICAgICAgICAgICAgICAgY29lZmZzW25dID0gMSAvIG5TSDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBjb2VmZnM7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBjb21wdXRlU3VwZXJjYXJkQ29lZmZzKE4pIHtcbiAgICAgICAgICAgIHN3aXRjaCAoTikge1xuICAgICAgICAgICAgICAgIGNhc2UgMTpcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNvZWZmcyA9IFswLjM2NjAsIDAuMjExM107XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgMjpcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNvZWZmcyA9IFswLjIzNjIsIDAuMTU2MiwgMC4wNTkwXTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAzOlxuICAgICAgICAgICAgICAgICAgICB2YXIgY29lZmZzID0gWzAuMTc2OCwgMC4xMjgxLCAwLjA2MzMsIDAuMDE3NV07XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgNDpcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNvZWZmcyA9IFswLjE0MTQsIDAuMTA4NywgMC4wNjIzLCAwLjAyNDcsIDAuMDA1NF07XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJPcmRlcnMgc2hvdWxkIGJlIGluIHRoZSByYW5nZSBvZiAxLTQgYXQgdGhlIG1vbWVudC5cIik7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBjb2VmZnM7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBjb21wdXRlTWF4UkVDb2VmZnMoTikge1xuICAgICAgICAgICAgdmFyIGNvZWZmcyA9IG5ldyBBcnJheShOICsgMSk7XG4gICAgICAgICAgICBjb2VmZnNbMF0gPSAxO1xuICAgICAgICAgICAgdmFyIGxlZ19uX21pbnVzMSA9IDA7XG4gICAgICAgICAgICB2YXIgbGVnX25fbWludXMyID0gMDtcbiAgICAgICAgICAgIHZhciBsZWdfbiA9IDA7XG4gICAgICAgICAgICBmb3IgKHZhciBuID0gMTsgbiA8IE4gKyAxOyBuKyspIHtcbiAgICAgICAgICAgICAgICBsZWdfbiA9IGpzaGxpYi5yZWN1cnNlTGVnZW5kcmVQb2x5KG4sIFtNYXRoLmNvcygyLjQwNjgwOSAvIChOICsgMS41MSkpXSwgbGVnX25fbWludXMxLCBsZWdfbl9taW51czIpO1xuICAgICAgICAgICAgICAgIGNvZWZmc1tuXSA9IGxlZ19uWzBdWzBdO1xuXG4gICAgICAgICAgICAgICAgbGVnX25fbWludXMyID0gbGVnX25fbWludXMxO1xuICAgICAgICAgICAgICAgIGxlZ19uX21pbnVzMSA9IGxlZ19uO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gY29tcHV0ZSBub3JtYWxpemF0aW9uIGZhY3RvclxuICAgICAgICAgICAgdmFyIG5vcm0gPSAwO1xuICAgICAgICAgICAgZm9yICh2YXIgbiA9IDA7IG4gPD0gTjsgbisrKSB7XG4gICAgICAgICAgICAgICAgbm9ybSArPSBjb2VmZnNbbl0gKiAoMipuKzEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZm9yICh2YXIgbiA9IDA7IG4gPD0gTjsgbisrKSB7XG4gICAgICAgICAgICAgICAgY29lZmZzW25dID0gY29lZmZzW25dL25vcm07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gY29lZmZzO1xuICAgICAgICB9XG5cbiAgICAgICAgc3dpdGNoICh0aGlzLnZtaWNQYXR0ZXJuKSB7XG4gICAgICAgICAgICBjYXNlIFwiY2FyZGlvaWRcIjpcbiAgICAgICAgICAgICAgICAvLyBoaWdoZXItb3JkZXIgY2FyZGlvaWQgZ2l2ZW4gYnk6ICgxLzIpXk4gKiAoIDErY29zKHRoZXRhKSApXk5cbiAgICAgICAgICAgICAgICB0aGlzLnZtaWNDb2VmZnMgPSBjb21wdXRlQ2FyZGlvaWRDb2VmZnModGhpcy5vcmRlcik7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwic3VwZXJjYXJkaW9pZFwiOlxuICAgICAgICAgICAgICAgIC8vIG1heGltdW0gZnJvbnQtYmFjayBlbmVyZ3kgcmF0aW9cbiAgICAgICAgICAgICAgICB0aGlzLnZtaWNDb2VmZnMgPSBjb21wdXRlU3VwZXJjYXJkQ29lZmZzKHRoaXMub3JkZXIpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcImh5cGVyY2FyZGlvaWRcIjpcbiAgICAgICAgICAgICAgICAvLyBtYXhpbXVtIGRpcmVjdGl2aXR5IGZhY3RvclxuICAgICAgICAgICAgICAgIC8vICh0aGlzIGlzIHRoZSBjbGFzc2ljIHBsYW5lL3dhdmUgZGVjb21wb3NpdGlvbiBiZWFtZm9ybWVyLFxuICAgICAgICAgICAgICAgIC8vIGFsc28gdGVybWVkIFwicmVndWxhclwiIGluIHNwaGVyaWNhbCBiZWFtZm9ybWluZyBsaXRlcmF0dXJlKVxuICAgICAgICAgICAgICAgIHRoaXMudm1pY0NvZWZmcyA9IGNvbXB1dGVIeXBlcmNhcmRDb2VmZnModGhpcy5vcmRlcik7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwibWF4X3JFXCI6XG4gICAgICAgICAgICAgICAgLy8gcXVpdGUgc2ltaWxhciB0byBtYXhpbXVtIGZyb250LWJhY2sgcmVqZWN0aW9uXG4gICAgICAgICAgICAgICAgdGhpcy52bWljQ29lZmZzID0gY29tcHV0ZU1heFJFQ29lZmZzKHRoaXMub3JkZXIpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICB0aGlzLnZtaWNQYXR0ZXJuID0gXCJoeXBlcmNhcmRpb2lkXCI7XG4gICAgICAgICAgICAgICAgdGhpcy52bWljQ29lZmZzID0gY29tcHV0ZUh5cGVyY2FyZENvZWZmcyh0aGlzLm9yZGVyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMudXBkYXRlR2FpbnMoKTtcbiAgICB9XG5cbiAgICB1cGRhdGVPcmllbnRhdGlvbigpIHtcblxuICAgICAgICB2YXIgYXppbSA9IHRoaXMuYXppbSAqIE1hdGguUEkgLyAxODA7XG4gICAgICAgIHZhciBlbGV2ID0gdGhpcy5lbGV2ICogTWF0aC5QSSAvIDE4MDtcblxuICAgICAgICB2YXIgdGVtcFNIID0ganNobGliLmNvbXB1dGVSZWFsU0godGhpcy5vcmRlciwgWyBbYXppbSwgZWxldl0gXSk7XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm5DaDsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLlNIeHl6W2ldID0gdGVtcFNIW2ldWzBdO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy51cGRhdGVHYWlucygpO1xuICAgIH1cblxuICAgIHVwZGF0ZUdhaW5zKCkge1xuXG4gICAgICAgIHZhciBxO1xuICAgICAgICBmb3IgKHZhciBuID0gMDsgbiA8PSB0aGlzLm9yZGVyOyBuKyspIHtcbiAgICAgICAgICAgIGZvciAodmFyIG0gPSAtbjsgbSA8PSBuOyBtKyspIHtcbiAgICAgICAgICAgICAgICBxID0gbiAqIG4gKyBuICsgbTtcbiAgICAgICAgICAgICAgICB0aGlzLnZtaWNHYWluc1txXSA9IHRoaXMudm1pY0NvZWZmc1tuXSAqIHRoaXMuU0h4eXpbcV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubkNoOyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMudm1pY0dhaW5Ob2Rlc1tpXS5nYWluLnZhbHVlID0gdGhpcy52bWljR2FpbnNbaV07XG4gICAgICAgIH1cbiAgICB9XG59XG4iLCIvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gIEFyY2hvbnRpcyBQb2xpdGlzXG4vLyAgYXJjaG9udGlzLnBvbGl0aXNAYWFsdG8uZmlcbi8vICBEYXZpZCBQb2lyaWVyLVF1aW5vdFxuLy8gIGRhdmlwb2lyQGlyY2FtLmZyXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy9cbi8vICBXZWJBdWRpb19IT0EgYSBKYXZhU2NyaXB0IGxpYnJhcnkgZm9yIGhpZ2hlci1vcmRlciBBbWJpc29uaWNzXG4vLyAgVGhlIGxpYnJhcnkgaW1wbGVtZW50cyBXZWIgQXVkaW8gYmxvY2tzIHRoYXQgcGVyZm9ybVxuLy8gIHR5cGljYWwgYW1iaXNvbmljIHByb2Nlc3Npbmcgb3BlcmF0aW9ucyBvbiBhdWRpbyBzaWduYWxzLlxuLy9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbi8vLy8vLy8vLy8vLy8vLy9cbi8qIEhPQSBMT0FERVIgKi9cbi8vLy8vLy8vLy8vLy8vLy9cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgSE9BbG9hZGVyIHtcbiAgICBjb25zdHJ1Y3Rvcihjb250ZXh0LCBvcmRlciwgdXJsLCBjYWxsYmFjaykge1xuICAgICAgICB0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xuICAgICAgICB0aGlzLm9yZGVyID0gb3JkZXI7XG4gICAgICAgIHRoaXMubkNoID0gKG9yZGVyICsgMSkgKiAob3JkZXIgKyAxKTtcbiAgICAgICAgdGhpcy5uQ2hHcm91cHMgPSBNYXRoLmNlaWwodGhpcy5uQ2ggLyA4KTtcbiAgICAgICAgdGhpcy5idWZmZXJzID0gbmV3IEFycmF5KCk7XG4gICAgICAgIHRoaXMubG9hZENvdW50ID0gMDtcbiAgICAgICAgdGhpcy5sb2FkZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5vbkxvYWQgPSBjYWxsYmFjaztcbiAgICAgICAgdGhpcy51cmxzID0gbmV3IEFycmF5KHRoaXMubkNoR3JvdXBzKTtcblxuICAgICAgICB2YXIgZmlsZUV4dCA9IHVybC5zbGljZSh1cmwubGVuZ3RoIC0gMywgdXJsLmxlbmd0aCk7XG4gICAgICAgIHRoaXMuZmlsZUV4dCA9IGZpbGVFeHQ7XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm5DaEdyb3VwczsgaSsrKSB7XG5cbiAgICAgICAgICAgIGlmIChpID09IHRoaXMubkNoR3JvdXBzIC0gMSkge1xuICAgICAgICAgICAgICAgIHRoaXMudXJsc1tpXSA9IHVybC5zbGljZSgwLCB1cmwubGVuZ3RoIC0gNCkgKyBcIl9cIiArIHBhZChpICogOCArIDEsIDIpICsgXCItXCIgKyBwYWQodGhpcy5uQ2gsIDIpICsgXCJjaC5cIiArIGZpbGVFeHQ7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMudXJsc1tpXSA9IHVybC5zbGljZSgwLCB1cmwubGVuZ3RoIC0gNCkgKyBcIl9cIiArIHBhZChpICogOCArIDEsIDIpICsgXCItXCIgKyBwYWQoaSAqIDggKyA4LCAyKSArIFwiY2guXCIgKyBmaWxlRXh0O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gcGFkKG51bSwgc2l6ZSkge1xuICAgICAgICAgICAgcmV0dXJuICgnMDAwMDAwMDAwJyArIG51bSkuc3Vic3RyKC1zaXplKTtcbiAgICAgICAgfVxuXG4gICAgfVxuXG4gICAgbG9hZEJ1ZmZlcnModXJsLCBpbmRleCkge1xuICAgICAgICAvLyBMb2FkIGJ1ZmZlciBhc3luY2hyb25vdXNseVxuICAgICAgICB2YXIgcmVxdWVzdCA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuICAgICAgICByZXF1ZXN0Lm9wZW4oXCJHRVRcIiwgdXJsLCB0cnVlKTtcbiAgICAgICAgcmVxdWVzdC5yZXNwb25zZVR5cGUgPSBcImFycmF5YnVmZmVyXCI7XG5cbiAgICAgICAgdmFyIHNjb3BlID0gdGhpcztcblxuICAgICAgICByZXF1ZXN0Lm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgLy8gQXN5bmNocm9ub3VzbHkgZGVjb2RlIHRoZSBhdWRpbyBmaWxlIGRhdGEgaW4gcmVxdWVzdC5yZXNwb25zZVxuICAgICAgICAgICAgc2NvcGUuY29udGV4dC5kZWNvZGVBdWRpb0RhdGEoXG4gICAgICAgICAgICAgICAgcmVxdWVzdC5yZXNwb25zZSxcbiAgICAgICAgICAgICAgICBmdW5jdGlvbihidWZmZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFidWZmZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFsZXJ0KCdlcnJvciBkZWNvZGluZyBmaWxlIGRhdGE6ICcgKyB1cmwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHNjb3BlLmJ1ZmZlcnNbaW5kZXhdID0gYnVmZmVyO1xuICAgICAgICAgICAgICAgICAgICBzY29wZS5sb2FkQ291bnQrKztcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNjb3BlLmxvYWRDb3VudCA9PSBzY29wZS5uQ2hHcm91cHMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNjb3BlLmxvYWRlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBzY29wZS5jb25jYXRCdWZmZXJzKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkhPQWxvYWRlcjogYWxsIGJ1ZmZlcnMgbG9hZGVkIGFuZCBjb25jYXRlbmF0ZWRcIilcbiAgICAgICAgICAgICAgICAgICAgICAgIHNjb3BlLm9uTG9hZChzY29wZS5jb25jYXRCdWZmZXIpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBmdW5jdGlvbihlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdkZWNvZGVBdWRpb0RhdGEgZXJyb3InLCBlcnJvcik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJlcXVlc3Qub25lcnJvciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgYWxlcnQoJ0hPQWxvYWRlcjogWEhSIGVycm9yJyk7XG4gICAgICAgIH1cblxuICAgICAgICByZXF1ZXN0LnNlbmQoKTtcbiAgICB9XG5cbiAgICBsb2FkKCkge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubkNoR3JvdXBzOyArK2kpIHRoaXMubG9hZEJ1ZmZlcnModGhpcy51cmxzW2ldLCBpKTtcbiAgICB9XG5cbiAgICBjb25jYXRCdWZmZXJzKCkge1xuXG4gICAgICAgIGlmICghdGhpcy5sb2FkZWQpIHJldHVybjtcblxuICAgICAgICB2YXIgbkNoID0gdGhpcy5uQ2g7XG4gICAgICAgIHZhciBuQ2hHcm91cHMgPSB0aGlzLm5DaEdyb3VwcztcblxuICAgICAgICB2YXIgbGVuZ3RoID0gdGhpcy5idWZmZXJzWzBdLmxlbmd0aDtcbiAgICAgICAgdmFyIHNyYXRlID0gdGhpcy5idWZmZXJzWzBdLnNhbXBsZVJhdGU7XG4gICAgICAgIFxuICAgICAgICAvLyBEZXRlY3QgaWYgdGhlIDgtY2ggYXVkaW8gZmlsZSBpcyBPR0cgYW5kIGlmIHRoZSBicm93c2VyIGlzIENocm9tZSxcbiAgICAgICAgLy8gdGhlbiByZW1hcCA4LWNoYW5uZWwgZmlsZXMgdG8gdGhlIGNvcnJlY3Qgb3JkZXIgY2F1c2UgQ2hyb21lIG1lc3NlIGl0IHVwIHdoZW4gbG9hZGluZ1xuICAgICAgICAvLyBGaXJlZm94IGRvZXMgbm90IGhhdmUgdGhpcyBpc3N1ZS4gOGNoIFdhdmUgZmlsZXMgd29yayBmaW5lIGZvciBib3RoIGJyb3dzZXJzLlxuICAgICAgICB2YXIgcmVtYXA4Q2hhbkZpbGUgPSBbMSwyLDMsNCw1LDYsNyw4XTtcbiAgICAgICAgdmFyIGlzQ2hyb21lID0gISF3aW5kb3cuY2hyb21lXG4gICAgICAgIGlmIChpc0Nocm9tZSAmJiB0aGlzLmZpbGVFeHQudG9Mb3dlckNhc2UoKSA9PSBcIm9nZ1wiKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIkxvYWRpbmcgb2YgOGNoYW4gT0dHIGZpbGVzIHVzaW5nIENocm9tZTogcmVtYXAgY2hhbm5lbHMgdG8gY29ycmVjdCBvcmRlciFcIilcbiAgICAgICAgICAgIHJlbWFwOENoYW5GaWxlID0gWzEsMywyLDcsOCw1LDYsNF07XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmNvbmNhdEJ1ZmZlciA9IHRoaXMuY29udGV4dC5jcmVhdGVCdWZmZXIobkNoLCBsZW5ndGgsIHNyYXRlKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBuQ2hHcm91cHM7IGkrKykge1xuICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCB0aGlzLmJ1ZmZlcnNbaV0ubnVtYmVyT2ZDaGFubmVsczsgaisrKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jb25jYXRCdWZmZXIuZ2V0Q2hhbm5lbERhdGEoaSAqIDggKyBqKS5zZXQodGhpcy5idWZmZXJzW2ldLmdldENoYW5uZWxEYXRhKHJlbWFwOENoYW5GaWxlW2pdLTEpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cbiIsIlxuLy8gZXhwb3NlIGZvciBwbHVnaW5zXG5leHBvcnQgeyBkZWZhdWx0IGFzIG1vbm9FbmNvZGVyIH0gZnJvbSAnLi9hbWJpLW1vbm9FbmNvZGVyJztcbmV4cG9ydCB7IGRlZmF1bHQgYXMgb3JkZXJMaW1pdGVyIH0gZnJvbSAnLi9hbWJpLW9yZGVyTGltaXRlcic7XG5leHBvcnQgeyBkZWZhdWx0IGFzIG9yZGVyV2VpZ2h0IH0gZnJvbSAnLi9hbWJpLW9yZGVyV2VpZ2h0JztcbmV4cG9ydCB7IGRlZmF1bHQgYXMgc2NlbmVSb3RhdG9yIH0gZnJvbSAnLi9hbWJpLXNjZW5lUm90YXRvcic7XG5leHBvcnQgeyBkZWZhdWx0IGFzIHNjZW5lTWlycm9yIH0gZnJvbSAnLi9hbWJpLXNjZW5lTWlycm9yJztcbmV4cG9ydCB7IGRlZmF1bHQgYXMgYmluRGVjb2Rlcn0gZnJvbSAnLi9hbWJpLWJpbmF1cmFsRGVjb2Rlcic7XG5leHBvcnQgeyBkZWZhdWx0IGFzIHZpcnR1YWxNaWMgfSBmcm9tICcuL2FtYmktdmlydHVhbE1pYyc7XG5leHBvcnQgeyBkZWZhdWx0IGFzIHBvd2VybWFwQW5hbHlzZXIgfSBmcm9tICcuL2FtYmktcG93ZXJtYXBBbmFseXNlcic7XG5cbmV4cG9ydCB7IGRlZmF1bHQgYXMgSE9BbG9hZGVyIH0gZnJvbSAnLi9ob2EtbG9hZGVyJztcblxuaW1wb3J0ICogYXMgX2NvbnZlcnRlcnMgZnJvbSAnLi9hbWJpLWNvbnZlcnRlcnMnO1xuZXhwb3J0IGNvbnN0IGNvbnZlcnRlcnMgPSBfY29udmVydGVycztcblxuZXhwb3J0IHsgZGVmYXVsdCBhcyBpbnRlbnNpdHlBbmFseXNlcn0gZnJvbSAnLi9hbWJpLWludGVuc2l0eUFuYWx5c2VyJztcbiIsIm1vZHVsZS5leHBvcnRzID0geyBcImRlZmF1bHRcIjogcmVxdWlyZShcImNvcmUtanMvbGlicmFyeS9mbi9vYmplY3QvZGVmaW5lLXByb3BlcnR5XCIpLCBfX2VzTW9kdWxlOiB0cnVlIH07IiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5cbmV4cG9ydHMuZGVmYXVsdCA9IGZ1bmN0aW9uIChpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHtcbiAgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uXCIpO1xuICB9XG59OyIsIlwidXNlIHN0cmljdFwiO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuXG52YXIgX2RlZmluZVByb3BlcnR5ID0gcmVxdWlyZShcIi4uL2NvcmUtanMvb2JqZWN0L2RlZmluZS1wcm9wZXJ0eVwiKTtcblxudmFyIF9kZWZpbmVQcm9wZXJ0eTIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9kZWZpbmVQcm9wZXJ0eSk7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7IGRlZmF1bHQ6IG9iaiB9OyB9XG5cbmV4cG9ydHMuZGVmYXVsdCA9IGZ1bmN0aW9uICgpIHtcbiAgZnVuY3Rpb24gZGVmaW5lUHJvcGVydGllcyh0YXJnZXQsIHByb3BzKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIGRlc2NyaXB0b3IgPSBwcm9wc1tpXTtcbiAgICAgIGRlc2NyaXB0b3IuZW51bWVyYWJsZSA9IGRlc2NyaXB0b3IuZW51bWVyYWJsZSB8fCBmYWxzZTtcbiAgICAgIGRlc2NyaXB0b3IuY29uZmlndXJhYmxlID0gdHJ1ZTtcbiAgICAgIGlmIChcInZhbHVlXCIgaW4gZGVzY3JpcHRvcikgZGVzY3JpcHRvci53cml0YWJsZSA9IHRydWU7XG4gICAgICAoMCwgX2RlZmluZVByb3BlcnR5Mi5kZWZhdWx0KSh0YXJnZXQsIGRlc2NyaXB0b3Iua2V5LCBkZXNjcmlwdG9yKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gZnVuY3Rpb24gKENvbnN0cnVjdG9yLCBwcm90b1Byb3BzLCBzdGF0aWNQcm9wcykge1xuICAgIGlmIChwcm90b1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLnByb3RvdHlwZSwgcHJvdG9Qcm9wcyk7XG4gICAgaWYgKHN0YXRpY1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLCBzdGF0aWNQcm9wcyk7XG4gICAgcmV0dXJuIENvbnN0cnVjdG9yO1xuICB9O1xufSgpOyIsInJlcXVpcmUoJy4uLy4uL21vZHVsZXMvZXM2Lm9iamVjdC5kZWZpbmUtcHJvcGVydHknKTtcbnZhciAkT2JqZWN0ID0gcmVxdWlyZSgnLi4vLi4vbW9kdWxlcy9fY29yZScpLk9iamVjdDtcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gZGVmaW5lUHJvcGVydHkoaXQsIGtleSwgZGVzYyl7XG4gIHJldHVybiAkT2JqZWN0LmRlZmluZVByb3BlcnR5KGl0LCBrZXksIGRlc2MpO1xufTsiLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGl0KXtcbiAgaWYodHlwZW9mIGl0ICE9ICdmdW5jdGlvbicpdGhyb3cgVHlwZUVycm9yKGl0ICsgJyBpcyBub3QgYSBmdW5jdGlvbiEnKTtcbiAgcmV0dXJuIGl0O1xufTsiLCJ2YXIgaXNPYmplY3QgPSByZXF1aXJlKCcuL19pcy1vYmplY3QnKTtcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaXQpe1xuICBpZighaXNPYmplY3QoaXQpKXRocm93IFR5cGVFcnJvcihpdCArICcgaXMgbm90IGFuIG9iamVjdCEnKTtcbiAgcmV0dXJuIGl0O1xufTsiLCJ2YXIgY29yZSA9IG1vZHVsZS5leHBvcnRzID0ge3ZlcnNpb246ICcyLjQuMCd9O1xuaWYodHlwZW9mIF9fZSA9PSAnbnVtYmVyJylfX2UgPSBjb3JlOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVuZGVmIiwiLy8gb3B0aW9uYWwgLyBzaW1wbGUgY29udGV4dCBiaW5kaW5nXG52YXIgYUZ1bmN0aW9uID0gcmVxdWlyZSgnLi9fYS1mdW5jdGlvbicpO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihmbiwgdGhhdCwgbGVuZ3RoKXtcbiAgYUZ1bmN0aW9uKGZuKTtcbiAgaWYodGhhdCA9PT0gdW5kZWZpbmVkKXJldHVybiBmbjtcbiAgc3dpdGNoKGxlbmd0aCl7XG4gICAgY2FzZSAxOiByZXR1cm4gZnVuY3Rpb24oYSl7XG4gICAgICByZXR1cm4gZm4uY2FsbCh0aGF0LCBhKTtcbiAgICB9O1xuICAgIGNhc2UgMjogcmV0dXJuIGZ1bmN0aW9uKGEsIGIpe1xuICAgICAgcmV0dXJuIGZuLmNhbGwodGhhdCwgYSwgYik7XG4gICAgfTtcbiAgICBjYXNlIDM6IHJldHVybiBmdW5jdGlvbihhLCBiLCBjKXtcbiAgICAgIHJldHVybiBmbi5jYWxsKHRoYXQsIGEsIGIsIGMpO1xuICAgIH07XG4gIH1cbiAgcmV0dXJuIGZ1bmN0aW9uKC8qIC4uLmFyZ3MgKi8pe1xuICAgIHJldHVybiBmbi5hcHBseSh0aGF0LCBhcmd1bWVudHMpO1xuICB9O1xufTsiLCIvLyBUaGFuaydzIElFOCBmb3IgaGlzIGZ1bm55IGRlZmluZVByb3BlcnR5XG5tb2R1bGUuZXhwb3J0cyA9ICFyZXF1aXJlKCcuL19mYWlscycpKGZ1bmN0aW9uKCl7XG4gIHJldHVybiBPYmplY3QuZGVmaW5lUHJvcGVydHkoe30sICdhJywge2dldDogZnVuY3Rpb24oKXsgcmV0dXJuIDc7IH19KS5hICE9IDc7XG59KTsiLCJ2YXIgaXNPYmplY3QgPSByZXF1aXJlKCcuL19pcy1vYmplY3QnKVxuICAsIGRvY3VtZW50ID0gcmVxdWlyZSgnLi9fZ2xvYmFsJykuZG9jdW1lbnRcbiAgLy8gaW4gb2xkIElFIHR5cGVvZiBkb2N1bWVudC5jcmVhdGVFbGVtZW50IGlzICdvYmplY3QnXG4gICwgaXMgPSBpc09iamVjdChkb2N1bWVudCkgJiYgaXNPYmplY3QoZG9jdW1lbnQuY3JlYXRlRWxlbWVudCk7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGl0KXtcbiAgcmV0dXJuIGlzID8gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChpdCkgOiB7fTtcbn07IiwidmFyIGdsb2JhbCAgICA9IHJlcXVpcmUoJy4vX2dsb2JhbCcpXG4gICwgY29yZSAgICAgID0gcmVxdWlyZSgnLi9fY29yZScpXG4gICwgY3R4ICAgICAgID0gcmVxdWlyZSgnLi9fY3R4JylcbiAgLCBoaWRlICAgICAgPSByZXF1aXJlKCcuL19oaWRlJylcbiAgLCBQUk9UT1RZUEUgPSAncHJvdG90eXBlJztcblxudmFyICRleHBvcnQgPSBmdW5jdGlvbih0eXBlLCBuYW1lLCBzb3VyY2Upe1xuICB2YXIgSVNfRk9SQ0VEID0gdHlwZSAmICRleHBvcnQuRlxuICAgICwgSVNfR0xPQkFMID0gdHlwZSAmICRleHBvcnQuR1xuICAgICwgSVNfU1RBVElDID0gdHlwZSAmICRleHBvcnQuU1xuICAgICwgSVNfUFJPVE8gID0gdHlwZSAmICRleHBvcnQuUFxuICAgICwgSVNfQklORCAgID0gdHlwZSAmICRleHBvcnQuQlxuICAgICwgSVNfV1JBUCAgID0gdHlwZSAmICRleHBvcnQuV1xuICAgICwgZXhwb3J0cyAgID0gSVNfR0xPQkFMID8gY29yZSA6IGNvcmVbbmFtZV0gfHwgKGNvcmVbbmFtZV0gPSB7fSlcbiAgICAsIGV4cFByb3RvICA9IGV4cG9ydHNbUFJPVE9UWVBFXVxuICAgICwgdGFyZ2V0ICAgID0gSVNfR0xPQkFMID8gZ2xvYmFsIDogSVNfU1RBVElDID8gZ2xvYmFsW25hbWVdIDogKGdsb2JhbFtuYW1lXSB8fCB7fSlbUFJPVE9UWVBFXVxuICAgICwga2V5LCBvd24sIG91dDtcbiAgaWYoSVNfR0xPQkFMKXNvdXJjZSA9IG5hbWU7XG4gIGZvcihrZXkgaW4gc291cmNlKXtcbiAgICAvLyBjb250YWlucyBpbiBuYXRpdmVcbiAgICBvd24gPSAhSVNfRk9SQ0VEICYmIHRhcmdldCAmJiB0YXJnZXRba2V5XSAhPT0gdW5kZWZpbmVkO1xuICAgIGlmKG93biAmJiBrZXkgaW4gZXhwb3J0cyljb250aW51ZTtcbiAgICAvLyBleHBvcnQgbmF0aXZlIG9yIHBhc3NlZFxuICAgIG91dCA9IG93biA/IHRhcmdldFtrZXldIDogc291cmNlW2tleV07XG4gICAgLy8gcHJldmVudCBnbG9iYWwgcG9sbHV0aW9uIGZvciBuYW1lc3BhY2VzXG4gICAgZXhwb3J0c1trZXldID0gSVNfR0xPQkFMICYmIHR5cGVvZiB0YXJnZXRba2V5XSAhPSAnZnVuY3Rpb24nID8gc291cmNlW2tleV1cbiAgICAvLyBiaW5kIHRpbWVycyB0byBnbG9iYWwgZm9yIGNhbGwgZnJvbSBleHBvcnQgY29udGV4dFxuICAgIDogSVNfQklORCAmJiBvd24gPyBjdHgob3V0LCBnbG9iYWwpXG4gICAgLy8gd3JhcCBnbG9iYWwgY29uc3RydWN0b3JzIGZvciBwcmV2ZW50IGNoYW5nZSB0aGVtIGluIGxpYnJhcnlcbiAgICA6IElTX1dSQVAgJiYgdGFyZ2V0W2tleV0gPT0gb3V0ID8gKGZ1bmN0aW9uKEMpe1xuICAgICAgdmFyIEYgPSBmdW5jdGlvbihhLCBiLCBjKXtcbiAgICAgICAgaWYodGhpcyBpbnN0YW5jZW9mIEMpe1xuICAgICAgICAgIHN3aXRjaChhcmd1bWVudHMubGVuZ3RoKXtcbiAgICAgICAgICAgIGNhc2UgMDogcmV0dXJuIG5ldyBDO1xuICAgICAgICAgICAgY2FzZSAxOiByZXR1cm4gbmV3IEMoYSk7XG4gICAgICAgICAgICBjYXNlIDI6IHJldHVybiBuZXcgQyhhLCBiKTtcbiAgICAgICAgICB9IHJldHVybiBuZXcgQyhhLCBiLCBjKTtcbiAgICAgICAgfSByZXR1cm4gQy5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgfTtcbiAgICAgIEZbUFJPVE9UWVBFXSA9IENbUFJPVE9UWVBFXTtcbiAgICAgIHJldHVybiBGO1xuICAgIC8vIG1ha2Ugc3RhdGljIHZlcnNpb25zIGZvciBwcm90b3R5cGUgbWV0aG9kc1xuICAgIH0pKG91dCkgOiBJU19QUk9UTyAmJiB0eXBlb2Ygb3V0ID09ICdmdW5jdGlvbicgPyBjdHgoRnVuY3Rpb24uY2FsbCwgb3V0KSA6IG91dDtcbiAgICAvLyBleHBvcnQgcHJvdG8gbWV0aG9kcyB0byBjb3JlLiVDT05TVFJVQ1RPUiUubWV0aG9kcy4lTkFNRSVcbiAgICBpZihJU19QUk9UTyl7XG4gICAgICAoZXhwb3J0cy52aXJ0dWFsIHx8IChleHBvcnRzLnZpcnR1YWwgPSB7fSkpW2tleV0gPSBvdXQ7XG4gICAgICAvLyBleHBvcnQgcHJvdG8gbWV0aG9kcyB0byBjb3JlLiVDT05TVFJVQ1RPUiUucHJvdG90eXBlLiVOQU1FJVxuICAgICAgaWYodHlwZSAmICRleHBvcnQuUiAmJiBleHBQcm90byAmJiAhZXhwUHJvdG9ba2V5XSloaWRlKGV4cFByb3RvLCBrZXksIG91dCk7XG4gICAgfVxuICB9XG59O1xuLy8gdHlwZSBiaXRtYXBcbiRleHBvcnQuRiA9IDE7ICAgLy8gZm9yY2VkXG4kZXhwb3J0LkcgPSAyOyAgIC8vIGdsb2JhbFxuJGV4cG9ydC5TID0gNDsgICAvLyBzdGF0aWNcbiRleHBvcnQuUCA9IDg7ICAgLy8gcHJvdG9cbiRleHBvcnQuQiA9IDE2OyAgLy8gYmluZFxuJGV4cG9ydC5XID0gMzI7ICAvLyB3cmFwXG4kZXhwb3J0LlUgPSA2NDsgIC8vIHNhZmVcbiRleHBvcnQuUiA9IDEyODsgLy8gcmVhbCBwcm90byBtZXRob2QgZm9yIGBsaWJyYXJ5YCBcbm1vZHVsZS5leHBvcnRzID0gJGV4cG9ydDsiLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGV4ZWMpe1xuICB0cnkge1xuICAgIHJldHVybiAhIWV4ZWMoKTtcbiAgfSBjYXRjaChlKXtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxufTsiLCIvLyBodHRwczovL2dpdGh1Yi5jb20vemxvaXJvY2svY29yZS1qcy9pc3N1ZXMvODYjaXNzdWVjb21tZW50LTExNTc1OTAyOFxudmFyIGdsb2JhbCA9IG1vZHVsZS5leHBvcnRzID0gdHlwZW9mIHdpbmRvdyAhPSAndW5kZWZpbmVkJyAmJiB3aW5kb3cuTWF0aCA9PSBNYXRoXG4gID8gd2luZG93IDogdHlwZW9mIHNlbGYgIT0gJ3VuZGVmaW5lZCcgJiYgc2VsZi5NYXRoID09IE1hdGggPyBzZWxmIDogRnVuY3Rpb24oJ3JldHVybiB0aGlzJykoKTtcbmlmKHR5cGVvZiBfX2cgPT0gJ251bWJlcicpX19nID0gZ2xvYmFsOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVuZGVmIiwidmFyIGRQICAgICAgICAgPSByZXF1aXJlKCcuL19vYmplY3QtZHAnKVxuICAsIGNyZWF0ZURlc2MgPSByZXF1aXJlKCcuL19wcm9wZXJ0eS1kZXNjJyk7XG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vX2Rlc2NyaXB0b3JzJykgPyBmdW5jdGlvbihvYmplY3QsIGtleSwgdmFsdWUpe1xuICByZXR1cm4gZFAuZihvYmplY3QsIGtleSwgY3JlYXRlRGVzYygxLCB2YWx1ZSkpO1xufSA6IGZ1bmN0aW9uKG9iamVjdCwga2V5LCB2YWx1ZSl7XG4gIG9iamVjdFtrZXldID0gdmFsdWU7XG4gIHJldHVybiBvYmplY3Q7XG59OyIsIm1vZHVsZS5leHBvcnRzID0gIXJlcXVpcmUoJy4vX2Rlc2NyaXB0b3JzJykgJiYgIXJlcXVpcmUoJy4vX2ZhaWxzJykoZnVuY3Rpb24oKXtcclxuICByZXR1cm4gT2JqZWN0LmRlZmluZVByb3BlcnR5KHJlcXVpcmUoJy4vX2RvbS1jcmVhdGUnKSgnZGl2JyksICdhJywge2dldDogZnVuY3Rpb24oKXsgcmV0dXJuIDc7IH19KS5hICE9IDc7XHJcbn0pOyIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaXQpe1xuICByZXR1cm4gdHlwZW9mIGl0ID09PSAnb2JqZWN0JyA/IGl0ICE9PSBudWxsIDogdHlwZW9mIGl0ID09PSAnZnVuY3Rpb24nO1xufTsiLCJ2YXIgYW5PYmplY3QgICAgICAgPSByZXF1aXJlKCcuL19hbi1vYmplY3QnKVxuICAsIElFOF9ET01fREVGSU5FID0gcmVxdWlyZSgnLi9faWU4LWRvbS1kZWZpbmUnKVxuICAsIHRvUHJpbWl0aXZlICAgID0gcmVxdWlyZSgnLi9fdG8tcHJpbWl0aXZlJylcbiAgLCBkUCAgICAgICAgICAgICA9IE9iamVjdC5kZWZpbmVQcm9wZXJ0eTtcblxuZXhwb3J0cy5mID0gcmVxdWlyZSgnLi9fZGVzY3JpcHRvcnMnKSA/IE9iamVjdC5kZWZpbmVQcm9wZXJ0eSA6IGZ1bmN0aW9uIGRlZmluZVByb3BlcnR5KE8sIFAsIEF0dHJpYnV0ZXMpe1xuICBhbk9iamVjdChPKTtcbiAgUCA9IHRvUHJpbWl0aXZlKFAsIHRydWUpO1xuICBhbk9iamVjdChBdHRyaWJ1dGVzKTtcbiAgaWYoSUU4X0RPTV9ERUZJTkUpdHJ5IHtcbiAgICByZXR1cm4gZFAoTywgUCwgQXR0cmlidXRlcyk7XG4gIH0gY2F0Y2goZSl7IC8qIGVtcHR5ICovIH1cbiAgaWYoJ2dldCcgaW4gQXR0cmlidXRlcyB8fCAnc2V0JyBpbiBBdHRyaWJ1dGVzKXRocm93IFR5cGVFcnJvcignQWNjZXNzb3JzIG5vdCBzdXBwb3J0ZWQhJyk7XG4gIGlmKCd2YWx1ZScgaW4gQXR0cmlidXRlcylPW1BdID0gQXR0cmlidXRlcy52YWx1ZTtcbiAgcmV0dXJuIE87XG59OyIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oYml0bWFwLCB2YWx1ZSl7XG4gIHJldHVybiB7XG4gICAgZW51bWVyYWJsZSAgOiAhKGJpdG1hcCAmIDEpLFxuICAgIGNvbmZpZ3VyYWJsZTogIShiaXRtYXAgJiAyKSxcbiAgICB3cml0YWJsZSAgICA6ICEoYml0bWFwICYgNCksXG4gICAgdmFsdWUgICAgICAgOiB2YWx1ZVxuICB9O1xufTsiLCIvLyA3LjEuMSBUb1ByaW1pdGl2ZShpbnB1dCBbLCBQcmVmZXJyZWRUeXBlXSlcbnZhciBpc09iamVjdCA9IHJlcXVpcmUoJy4vX2lzLW9iamVjdCcpO1xuLy8gaW5zdGVhZCBvZiB0aGUgRVM2IHNwZWMgdmVyc2lvbiwgd2UgZGlkbid0IGltcGxlbWVudCBAQHRvUHJpbWl0aXZlIGNhc2Vcbi8vIGFuZCB0aGUgc2Vjb25kIGFyZ3VtZW50IC0gZmxhZyAtIHByZWZlcnJlZCB0eXBlIGlzIGEgc3RyaW5nXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGl0LCBTKXtcbiAgaWYoIWlzT2JqZWN0KGl0KSlyZXR1cm4gaXQ7XG4gIHZhciBmbiwgdmFsO1xuICBpZihTICYmIHR5cGVvZiAoZm4gPSBpdC50b1N0cmluZykgPT0gJ2Z1bmN0aW9uJyAmJiAhaXNPYmplY3QodmFsID0gZm4uY2FsbChpdCkpKXJldHVybiB2YWw7XG4gIGlmKHR5cGVvZiAoZm4gPSBpdC52YWx1ZU9mKSA9PSAnZnVuY3Rpb24nICYmICFpc09iamVjdCh2YWwgPSBmbi5jYWxsKGl0KSkpcmV0dXJuIHZhbDtcbiAgaWYoIVMgJiYgdHlwZW9mIChmbiA9IGl0LnRvU3RyaW5nKSA9PSAnZnVuY3Rpb24nICYmICFpc09iamVjdCh2YWwgPSBmbi5jYWxsKGl0KSkpcmV0dXJuIHZhbDtcbiAgdGhyb3cgVHlwZUVycm9yKFwiQ2FuJ3QgY29udmVydCBvYmplY3QgdG8gcHJpbWl0aXZlIHZhbHVlXCIpO1xufTsiLCJ2YXIgJGV4cG9ydCA9IHJlcXVpcmUoJy4vX2V4cG9ydCcpO1xyXG4vLyAxOS4xLjIuNCAvIDE1LjIuMy42IE9iamVjdC5kZWZpbmVQcm9wZXJ0eShPLCBQLCBBdHRyaWJ1dGVzKVxyXG4kZXhwb3J0KCRleHBvcnQuUyArICRleHBvcnQuRiAqICFyZXF1aXJlKCcuL19kZXNjcmlwdG9ycycpLCAnT2JqZWN0Jywge2RlZmluZVByb3BlcnR5OiByZXF1aXJlKCcuL19vYmplY3QtZHAnKS5mfSk7IiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbmlmIChnbG9iYWwuQW5hbHlzZXJOb2RlICYmICFnbG9iYWwuQW5hbHlzZXJOb2RlLnByb3RvdHlwZS5nZXRGbG9hdFRpbWVEb21haW5EYXRhKSB7XG4gIHZhciB1aW50OCA9IG5ldyBVaW50OEFycmF5KDIwNDgpO1xuICBnbG9iYWwuQW5hbHlzZXJOb2RlLnByb3RvdHlwZS5nZXRGbG9hdFRpbWVEb21haW5EYXRhID0gZnVuY3Rpb24oYXJyYXkpIHtcbiAgICB0aGlzLmdldEJ5dGVUaW1lRG9tYWluRGF0YSh1aW50OCk7XG4gICAgZm9yICh2YXIgaSA9IDAsIGltYXggPSBhcnJheS5sZW5ndGg7IGkgPCBpbWF4OyBpKyspIHtcbiAgICAgIGFycmF5W2ldID0gKHVpbnQ4W2ldIC0gMTI4KSAqIDAuMDA3ODEyNTtcbiAgICB9XG4gIH07XG59XG4iLCJcInVzZSBzdHJpY3RcIjtcblxudmFyIG51bWVyaWMgPSAodHlwZW9mIGV4cG9ydHMgPT09IFwidW5kZWZpbmVkXCIpPyhmdW5jdGlvbiBudW1lcmljKCkge30pOihleHBvcnRzKTtcbmlmKHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIpIHsgZ2xvYmFsLm51bWVyaWMgPSBudW1lcmljOyB9XG5cbm51bWVyaWMudmVyc2lvbiA9IFwiMS4yLjZcIjtcblxuLy8gMS4gVXRpbGl0eSBmdW5jdGlvbnNcbm51bWVyaWMuYmVuY2ggPSBmdW5jdGlvbiBiZW5jaCAoZixpbnRlcnZhbCkge1xuICAgIHZhciB0MSx0MixuLGk7XG4gICAgaWYodHlwZW9mIGludGVydmFsID09PSBcInVuZGVmaW5lZFwiKSB7IGludGVydmFsID0gMTU7IH1cbiAgICBuID0gMC41O1xuICAgIHQxID0gbmV3IERhdGUoKTtcbiAgICB3aGlsZSgxKSB7XG4gICAgICAgIG4qPTI7XG4gICAgICAgIGZvcihpPW47aT4zO2ktPTQpIHsgZigpOyBmKCk7IGYoKTsgZigpOyB9XG4gICAgICAgIHdoaWxlKGk+MCkgeyBmKCk7IGktLTsgfVxuICAgICAgICB0MiA9IG5ldyBEYXRlKCk7XG4gICAgICAgIGlmKHQyLXQxID4gaW50ZXJ2YWwpIGJyZWFrO1xuICAgIH1cbiAgICBmb3IoaT1uO2k+MztpLT00KSB7IGYoKTsgZigpOyBmKCk7IGYoKTsgfVxuICAgIHdoaWxlKGk+MCkgeyBmKCk7IGktLTsgfVxuICAgIHQyID0gbmV3IERhdGUoKTtcbiAgICByZXR1cm4gMTAwMCooMypuLTEpLyh0Mi10MSk7XG59XG5cbm51bWVyaWMuX215SW5kZXhPZiA9IChmdW5jdGlvbiBfbXlJbmRleE9mKHcpIHtcbiAgICB2YXIgbiA9IHRoaXMubGVuZ3RoLGs7XG4gICAgZm9yKGs9MDtrPG47KytrKSBpZih0aGlzW2tdPT09dykgcmV0dXJuIGs7XG4gICAgcmV0dXJuIC0xO1xufSk7XG5udW1lcmljLm15SW5kZXhPZiA9IChBcnJheS5wcm90b3R5cGUuaW5kZXhPZik/QXJyYXkucHJvdG90eXBlLmluZGV4T2Y6bnVtZXJpYy5fbXlJbmRleE9mO1xuXG5udW1lcmljLkZ1bmN0aW9uID0gRnVuY3Rpb247XG5udW1lcmljLnByZWNpc2lvbiA9IDQ7XG5udW1lcmljLmxhcmdlQXJyYXkgPSA1MDtcblxubnVtZXJpYy5wcmV0dHlQcmludCA9IGZ1bmN0aW9uIHByZXR0eVByaW50KHgpIHtcbiAgICBmdW5jdGlvbiBmbXRudW0oeCkge1xuICAgICAgICBpZih4ID09PSAwKSB7IHJldHVybiAnMCc7IH1cbiAgICAgICAgaWYoaXNOYU4oeCkpIHsgcmV0dXJuICdOYU4nOyB9XG4gICAgICAgIGlmKHg8MCkgeyByZXR1cm4gJy0nK2ZtdG51bSgteCk7IH1cbiAgICAgICAgaWYoaXNGaW5pdGUoeCkpIHtcbiAgICAgICAgICAgIHZhciBzY2FsZSA9IE1hdGguZmxvb3IoTWF0aC5sb2coeCkgLyBNYXRoLmxvZygxMCkpO1xuICAgICAgICAgICAgdmFyIG5vcm1hbGl6ZWQgPSB4IC8gTWF0aC5wb3coMTAsc2NhbGUpO1xuICAgICAgICAgICAgdmFyIGJhc2ljID0gbm9ybWFsaXplZC50b1ByZWNpc2lvbihudW1lcmljLnByZWNpc2lvbik7XG4gICAgICAgICAgICBpZihwYXJzZUZsb2F0KGJhc2ljKSA9PT0gMTApIHsgc2NhbGUrKzsgbm9ybWFsaXplZCA9IDE7IGJhc2ljID0gbm9ybWFsaXplZC50b1ByZWNpc2lvbihudW1lcmljLnByZWNpc2lvbik7IH1cbiAgICAgICAgICAgIHJldHVybiBwYXJzZUZsb2F0KGJhc2ljKS50b1N0cmluZygpKydlJytzY2FsZS50b1N0cmluZygpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAnSW5maW5pdHknO1xuICAgIH1cbiAgICB2YXIgcmV0ID0gW107XG4gICAgZnVuY3Rpb24gZm9vKHgpIHtcbiAgICAgICAgdmFyIGs7XG4gICAgICAgIGlmKHR5cGVvZiB4ID09PSBcInVuZGVmaW5lZFwiKSB7IHJldC5wdXNoKEFycmF5KG51bWVyaWMucHJlY2lzaW9uKzgpLmpvaW4oJyAnKSk7IHJldHVybiBmYWxzZTsgfVxuICAgICAgICBpZih0eXBlb2YgeCA9PT0gXCJzdHJpbmdcIikgeyByZXQucHVzaCgnXCInK3grJ1wiJyk7IHJldHVybiBmYWxzZTsgfVxuICAgICAgICBpZih0eXBlb2YgeCA9PT0gXCJib29sZWFuXCIpIHsgcmV0LnB1c2goeC50b1N0cmluZygpKTsgcmV0dXJuIGZhbHNlOyB9XG4gICAgICAgIGlmKHR5cGVvZiB4ID09PSBcIm51bWJlclwiKSB7XG4gICAgICAgICAgICB2YXIgYSA9IGZtdG51bSh4KTtcbiAgICAgICAgICAgIHZhciBiID0geC50b1ByZWNpc2lvbihudW1lcmljLnByZWNpc2lvbik7XG4gICAgICAgICAgICB2YXIgYyA9IHBhcnNlRmxvYXQoeC50b1N0cmluZygpKS50b1N0cmluZygpO1xuICAgICAgICAgICAgdmFyIGQgPSBbYSxiLGMscGFyc2VGbG9hdChiKS50b1N0cmluZygpLHBhcnNlRmxvYXQoYykudG9TdHJpbmcoKV07XG4gICAgICAgICAgICBmb3Ioaz0xO2s8ZC5sZW5ndGg7aysrKSB7IGlmKGRba10ubGVuZ3RoIDwgYS5sZW5ndGgpIGEgPSBkW2tdOyB9XG4gICAgICAgICAgICByZXQucHVzaChBcnJheShudW1lcmljLnByZWNpc2lvbis4LWEubGVuZ3RoKS5qb2luKCcgJykrYSk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgaWYoeCA9PT0gbnVsbCkgeyByZXQucHVzaChcIm51bGxcIik7IHJldHVybiBmYWxzZTsgfVxuICAgICAgICBpZih0eXBlb2YgeCA9PT0gXCJmdW5jdGlvblwiKSB7IFxuICAgICAgICAgICAgcmV0LnB1c2goeC50b1N0cmluZygpKTtcbiAgICAgICAgICAgIHZhciBmbGFnID0gZmFsc2U7XG4gICAgICAgICAgICBmb3IoayBpbiB4KSB7IGlmKHguaGFzT3duUHJvcGVydHkoaykpIHsgXG4gICAgICAgICAgICAgICAgaWYoZmxhZykgcmV0LnB1c2goJyxcXG4nKTtcbiAgICAgICAgICAgICAgICBlbHNlIHJldC5wdXNoKCdcXG57Jyk7XG4gICAgICAgICAgICAgICAgZmxhZyA9IHRydWU7IFxuICAgICAgICAgICAgICAgIHJldC5wdXNoKGspOyBcbiAgICAgICAgICAgICAgICByZXQucHVzaCgnOiBcXG4nKTsgXG4gICAgICAgICAgICAgICAgZm9vKHhba10pOyBcbiAgICAgICAgICAgIH0gfVxuICAgICAgICAgICAgaWYoZmxhZykgcmV0LnB1c2goJ31cXG4nKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGlmKHggaW5zdGFuY2VvZiBBcnJheSkge1xuICAgICAgICAgICAgaWYoeC5sZW5ndGggPiBudW1lcmljLmxhcmdlQXJyYXkpIHsgcmV0LnB1c2goJy4uLkxhcmdlIEFycmF5Li4uJyk7IHJldHVybiB0cnVlOyB9XG4gICAgICAgICAgICB2YXIgZmxhZyA9IGZhbHNlO1xuICAgICAgICAgICAgcmV0LnB1c2goJ1snKTtcbiAgICAgICAgICAgIGZvcihrPTA7azx4Lmxlbmd0aDtrKyspIHsgaWYoaz4wKSB7IHJldC5wdXNoKCcsJyk7IGlmKGZsYWcpIHJldC5wdXNoKCdcXG4gJyk7IH0gZmxhZyA9IGZvbyh4W2tdKTsgfVxuICAgICAgICAgICAgcmV0LnB1c2goJ10nKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHJldC5wdXNoKCd7Jyk7XG4gICAgICAgIHZhciBmbGFnID0gZmFsc2U7XG4gICAgICAgIGZvcihrIGluIHgpIHsgaWYoeC5oYXNPd25Qcm9wZXJ0eShrKSkgeyBpZihmbGFnKSByZXQucHVzaCgnLFxcbicpOyBmbGFnID0gdHJ1ZTsgcmV0LnB1c2goayk7IHJldC5wdXNoKCc6IFxcbicpOyBmb28oeFtrXSk7IH0gfVxuICAgICAgICByZXQucHVzaCgnfScpO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgZm9vKHgpO1xuICAgIHJldHVybiByZXQuam9pbignJyk7XG59XG5cbm51bWVyaWMucGFyc2VEYXRlID0gZnVuY3Rpb24gcGFyc2VEYXRlKGQpIHtcbiAgICBmdW5jdGlvbiBmb28oZCkge1xuICAgICAgICBpZih0eXBlb2YgZCA9PT0gJ3N0cmluZycpIHsgcmV0dXJuIERhdGUucGFyc2UoZC5yZXBsYWNlKC8tL2csJy8nKSk7IH1cbiAgICAgICAgaWYoIShkIGluc3RhbmNlb2YgQXJyYXkpKSB7IHRocm93IG5ldyBFcnJvcihcInBhcnNlRGF0ZTogcGFyYW1ldGVyIG11c3QgYmUgYXJyYXlzIG9mIHN0cmluZ3NcIik7IH1cbiAgICAgICAgdmFyIHJldCA9IFtdLGs7XG4gICAgICAgIGZvcihrPTA7azxkLmxlbmd0aDtrKyspIHsgcmV0W2tdID0gZm9vKGRba10pOyB9XG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfVxuICAgIHJldHVybiBmb28oZCk7XG59XG5cbm51bWVyaWMucGFyc2VGbG9hdCA9IGZ1bmN0aW9uIHBhcnNlRmxvYXRfKGQpIHtcbiAgICBmdW5jdGlvbiBmb28oZCkge1xuICAgICAgICBpZih0eXBlb2YgZCA9PT0gJ3N0cmluZycpIHsgcmV0dXJuIHBhcnNlRmxvYXQoZCk7IH1cbiAgICAgICAgaWYoIShkIGluc3RhbmNlb2YgQXJyYXkpKSB7IHRocm93IG5ldyBFcnJvcihcInBhcnNlRmxvYXQ6IHBhcmFtZXRlciBtdXN0IGJlIGFycmF5cyBvZiBzdHJpbmdzXCIpOyB9XG4gICAgICAgIHZhciByZXQgPSBbXSxrO1xuICAgICAgICBmb3Ioaz0wO2s8ZC5sZW5ndGg7aysrKSB7IHJldFtrXSA9IGZvbyhkW2tdKTsgfVxuICAgICAgICByZXR1cm4gcmV0O1xuICAgIH1cbiAgICByZXR1cm4gZm9vKGQpO1xufVxuXG5udW1lcmljLnBhcnNlQ1NWID0gZnVuY3Rpb24gcGFyc2VDU1YodCkge1xuICAgIHZhciBmb28gPSB0LnNwbGl0KCdcXG4nKTtcbiAgICB2YXIgaixrO1xuICAgIHZhciByZXQgPSBbXTtcbiAgICB2YXIgcGF0ID0gLygoW14nXCIsXSopfCgnW14nXSonKXwoXCJbXlwiXSpcIikpLC9nO1xuICAgIHZhciBwYXRudW0gPSAvXlxccyooKFsrLV0/WzAtOV0rKFxcLlswLTldKik/KGVbKy1dP1swLTldKyk/KXwoWystXT9bMC05XSooXFwuWzAtOV0rKT8oZVsrLV0/WzAtOV0rKT8pKVxccyokLztcbiAgICB2YXIgc3RyaXBwZXIgPSBmdW5jdGlvbihuKSB7IHJldHVybiBuLnN1YnN0cigwLG4ubGVuZ3RoLTEpOyB9XG4gICAgdmFyIGNvdW50ID0gMDtcbiAgICBmb3Ioaz0wO2s8Zm9vLmxlbmd0aDtrKyspIHtcbiAgICAgIHZhciBiYXIgPSAoZm9vW2tdK1wiLFwiKS5tYXRjaChwYXQpLGJhejtcbiAgICAgIGlmKGJhci5sZW5ndGg+MCkge1xuICAgICAgICAgIHJldFtjb3VudF0gPSBbXTtcbiAgICAgICAgICBmb3Ioaj0wO2o8YmFyLmxlbmd0aDtqKyspIHtcbiAgICAgICAgICAgICAgYmF6ID0gc3RyaXBwZXIoYmFyW2pdKTtcbiAgICAgICAgICAgICAgaWYocGF0bnVtLnRlc3QoYmF6KSkgeyByZXRbY291bnRdW2pdID0gcGFyc2VGbG9hdChiYXopOyB9XG4gICAgICAgICAgICAgIGVsc2UgcmV0W2NvdW50XVtqXSA9IGJhejtcbiAgICAgICAgICB9XG4gICAgICAgICAgY291bnQrKztcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJldDtcbn1cblxubnVtZXJpYy50b0NTViA9IGZ1bmN0aW9uIHRvQ1NWKEEpIHtcbiAgICB2YXIgcyA9IG51bWVyaWMuZGltKEEpO1xuICAgIHZhciBpLGosbSxuLHJvdyxyZXQ7XG4gICAgbSA9IHNbMF07XG4gICAgbiA9IHNbMV07XG4gICAgcmV0ID0gW107XG4gICAgZm9yKGk9MDtpPG07aSsrKSB7XG4gICAgICAgIHJvdyA9IFtdO1xuICAgICAgICBmb3Ioaj0wO2o8bTtqKyspIHsgcm93W2pdID0gQVtpXVtqXS50b1N0cmluZygpOyB9XG4gICAgICAgIHJldFtpXSA9IHJvdy5qb2luKCcsICcpO1xuICAgIH1cbiAgICByZXR1cm4gcmV0LmpvaW4oJ1xcbicpKydcXG4nO1xufVxuXG5udW1lcmljLmdldFVSTCA9IGZ1bmN0aW9uIGdldFVSTCh1cmwpIHtcbiAgICB2YXIgY2xpZW50ID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG4gICAgY2xpZW50Lm9wZW4oXCJHRVRcIix1cmwsZmFsc2UpO1xuICAgIGNsaWVudC5zZW5kKCk7XG4gICAgcmV0dXJuIGNsaWVudDtcbn1cblxubnVtZXJpYy5pbWFnZVVSTCA9IGZ1bmN0aW9uIGltYWdlVVJMKGltZykge1xuICAgIGZ1bmN0aW9uIGJhc2U2NChBKSB7XG4gICAgICAgIHZhciBuID0gQS5sZW5ndGgsIGkseCx5LHoscCxxLHIscztcbiAgICAgICAgdmFyIGtleSA9IFwiQUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVphYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ejAxMjM0NTY3ODkrLz1cIjtcbiAgICAgICAgdmFyIHJldCA9IFwiXCI7XG4gICAgICAgIGZvcihpPTA7aTxuO2krPTMpIHtcbiAgICAgICAgICAgIHggPSBBW2ldO1xuICAgICAgICAgICAgeSA9IEFbaSsxXTtcbiAgICAgICAgICAgIHogPSBBW2krMl07XG4gICAgICAgICAgICBwID0geCA+PiAyO1xuICAgICAgICAgICAgcSA9ICgoeCAmIDMpIDw8IDQpICsgKHkgPj4gNCk7XG4gICAgICAgICAgICByID0gKCh5ICYgMTUpIDw8IDIpICsgKHogPj4gNik7XG4gICAgICAgICAgICBzID0geiAmIDYzO1xuICAgICAgICAgICAgaWYoaSsxPj1uKSB7IHIgPSBzID0gNjQ7IH1cbiAgICAgICAgICAgIGVsc2UgaWYoaSsyPj1uKSB7IHMgPSA2NDsgfVxuICAgICAgICAgICAgcmV0ICs9IGtleS5jaGFyQXQocCkgKyBrZXkuY2hhckF0KHEpICsga2V5LmNoYXJBdChyKSArIGtleS5jaGFyQXQocyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGNyYzMyQXJyYXkgKGEsZnJvbSx0bykge1xuICAgICAgICBpZih0eXBlb2YgZnJvbSA9PT0gXCJ1bmRlZmluZWRcIikgeyBmcm9tID0gMDsgfVxuICAgICAgICBpZih0eXBlb2YgdG8gPT09IFwidW5kZWZpbmVkXCIpIHsgdG8gPSBhLmxlbmd0aDsgfVxuICAgICAgICB2YXIgdGFibGUgPSBbMHgwMDAwMDAwMCwgMHg3NzA3MzA5NiwgMHhFRTBFNjEyQywgMHg5OTA5NTFCQSwgMHgwNzZEQzQxOSwgMHg3MDZBRjQ4RiwgMHhFOTYzQTUzNSwgMHg5RTY0OTVBMyxcbiAgICAgICAgICAgICAgICAgICAgIDB4MEVEQjg4MzIsIDB4NzlEQ0I4QTQsIDB4RTBENUU5MUUsIDB4OTdEMkQ5ODgsIDB4MDlCNjRDMkIsIDB4N0VCMTdDQkQsIDB4RTdCODJEMDcsIDB4OTBCRjFEOTEsIFxuICAgICAgICAgICAgICAgICAgICAgMHgxREI3MTA2NCwgMHg2QUIwMjBGMiwgMHhGM0I5NzE0OCwgMHg4NEJFNDFERSwgMHgxQURBRDQ3RCwgMHg2RERERTRFQiwgMHhGNEQ0QjU1MSwgMHg4M0QzODVDNyxcbiAgICAgICAgICAgICAgICAgICAgIDB4MTM2Qzk4NTYsIDB4NjQ2QkE4QzAsIDB4RkQ2MkY5N0EsIDB4OEE2NUM5RUMsIDB4MTQwMTVDNEYsIDB4NjMwNjZDRDksIDB4RkEwRjNENjMsIDB4OEQwODBERjUsIFxuICAgICAgICAgICAgICAgICAgICAgMHgzQjZFMjBDOCwgMHg0QzY5MTA1RSwgMHhENTYwNDFFNCwgMHhBMjY3NzE3MiwgMHgzQzAzRTREMSwgMHg0QjA0RDQ0NywgMHhEMjBEODVGRCwgMHhBNTBBQjU2QiwgXG4gICAgICAgICAgICAgICAgICAgICAweDM1QjVBOEZBLCAweDQyQjI5ODZDLCAweERCQkJDOUQ2LCAweEFDQkNGOTQwLCAweDMyRDg2Q0UzLCAweDQ1REY1Qzc1LCAweERDRDYwRENGLCAweEFCRDEzRDU5LCBcbiAgICAgICAgICAgICAgICAgICAgIDB4MjZEOTMwQUMsIDB4NTFERTAwM0EsIDB4QzhENzUxODAsIDB4QkZEMDYxMTYsIDB4MjFCNEY0QjUsIDB4NTZCM0M0MjMsIDB4Q0ZCQTk1OTksIDB4QjhCREE1MEYsXG4gICAgICAgICAgICAgICAgICAgICAweDI4MDJCODlFLCAweDVGMDU4ODA4LCAweEM2MENEOUIyLCAweEIxMEJFOTI0LCAweDJGNkY3Qzg3LCAweDU4Njg0QzExLCAweEMxNjExREFCLCAweEI2NjYyRDNELFxuICAgICAgICAgICAgICAgICAgICAgMHg3NkRDNDE5MCwgMHgwMURCNzEwNiwgMHg5OEQyMjBCQywgMHhFRkQ1MTAyQSwgMHg3MUIxODU4OSwgMHgwNkI2QjUxRiwgMHg5RkJGRTRBNSwgMHhFOEI4RDQzMyxcbiAgICAgICAgICAgICAgICAgICAgIDB4NzgwN0M5QTIsIDB4MEYwMEY5MzQsIDB4OTYwOUE4OEUsIDB4RTEwRTk4MTgsIDB4N0Y2QTBEQkIsIDB4MDg2RDNEMkQsIDB4OTE2NDZDOTcsIDB4RTY2MzVDMDEsIFxuICAgICAgICAgICAgICAgICAgICAgMHg2QjZCNTFGNCwgMHgxQzZDNjE2MiwgMHg4NTY1MzBEOCwgMHhGMjYyMDA0RSwgMHg2QzA2OTVFRCwgMHgxQjAxQTU3QiwgMHg4MjA4RjRDMSwgMHhGNTBGQzQ1NywgXG4gICAgICAgICAgICAgICAgICAgICAweDY1QjBEOUM2LCAweDEyQjdFOTUwLCAweDhCQkVCOEVBLCAweEZDQjk4ODdDLCAweDYyREQxRERGLCAweDE1REEyRDQ5LCAweDhDRDM3Q0YzLCAweEZCRDQ0QzY1LCBcbiAgICAgICAgICAgICAgICAgICAgIDB4NERCMjYxNTgsIDB4M0FCNTUxQ0UsIDB4QTNCQzAwNzQsIDB4RDRCQjMwRTIsIDB4NEFERkE1NDEsIDB4M0REODk1RDcsIDB4QTREMUM0NkQsIDB4RDNENkY0RkIsIFxuICAgICAgICAgICAgICAgICAgICAgMHg0MzY5RTk2QSwgMHgzNDZFRDlGQywgMHhBRDY3ODg0NiwgMHhEQTYwQjhEMCwgMHg0NDA0MkQ3MywgMHgzMzAzMURFNSwgMHhBQTBBNEM1RiwgMHhERDBEN0NDOSwgXG4gICAgICAgICAgICAgICAgICAgICAweDUwMDU3MTNDLCAweDI3MDI0MUFBLCAweEJFMEIxMDEwLCAweEM5MEMyMDg2LCAweDU3NjhCNTI1LCAweDIwNkY4NUIzLCAweEI5NjZENDA5LCAweENFNjFFNDlGLCBcbiAgICAgICAgICAgICAgICAgICAgIDB4NUVERUY5MEUsIDB4MjlEOUM5OTgsIDB4QjBEMDk4MjIsIDB4QzdEN0E4QjQsIDB4NTlCMzNEMTcsIDB4MkVCNDBEODEsIDB4QjdCRDVDM0IsIDB4QzBCQTZDQUQsIFxuICAgICAgICAgICAgICAgICAgICAgMHhFREI4ODMyMCwgMHg5QUJGQjNCNiwgMHgwM0I2RTIwQywgMHg3NEIxRDI5QSwgMHhFQUQ1NDczOSwgMHg5REQyNzdBRiwgMHgwNERCMjYxNSwgMHg3M0RDMTY4MywgXG4gICAgICAgICAgICAgICAgICAgICAweEUzNjMwQjEyLCAweDk0NjQzQjg0LCAweDBENkQ2QTNFLCAweDdBNkE1QUE4LCAweEU0MEVDRjBCLCAweDkzMDlGRjlELCAweDBBMDBBRTI3LCAweDdEMDc5RUIxLCBcbiAgICAgICAgICAgICAgICAgICAgIDB4RjAwRjkzNDQsIDB4ODcwOEEzRDIsIDB4MUUwMUYyNjgsIDB4NjkwNkMyRkUsIDB4Rjc2MjU3NUQsIDB4ODA2NTY3Q0IsIDB4MTk2QzM2NzEsIDB4NkU2QjA2RTcsIFxuICAgICAgICAgICAgICAgICAgICAgMHhGRUQ0MUI3NiwgMHg4OUQzMkJFMCwgMHgxMERBN0E1QSwgMHg2N0RENEFDQywgMHhGOUI5REY2RiwgMHg4RUJFRUZGOSwgMHgxN0I3QkU0MywgMHg2MEIwOEVENSwgXG4gICAgICAgICAgICAgICAgICAgICAweEQ2RDZBM0U4LCAweEExRDE5MzdFLCAweDM4RDhDMkM0LCAweDRGREZGMjUyLCAweEQxQkI2N0YxLCAweEE2QkM1NzY3LCAweDNGQjUwNkRELCAweDQ4QjIzNjRCLCBcbiAgICAgICAgICAgICAgICAgICAgIDB4RDgwRDJCREEsIDB4QUYwQTFCNEMsIDB4MzYwMzRBRjYsIDB4NDEwNDdBNjAsIDB4REY2MEVGQzMsIDB4QTg2N0RGNTUsIDB4MzE2RThFRUYsIDB4NDY2OUJFNzksIFxuICAgICAgICAgICAgICAgICAgICAgMHhDQjYxQjM4QywgMHhCQzY2ODMxQSwgMHgyNTZGRDJBMCwgMHg1MjY4RTIzNiwgMHhDQzBDNzc5NSwgMHhCQjBCNDcwMywgMHgyMjAyMTZCOSwgMHg1NTA1MjYyRiwgXG4gICAgICAgICAgICAgICAgICAgICAweEM1QkEzQkJFLCAweEIyQkQwQjI4LCAweDJCQjQ1QTkyLCAweDVDQjM2QTA0LCAweEMyRDdGRkE3LCAweEI1RDBDRjMxLCAweDJDRDk5RThCLCAweDVCREVBRTFELCBcbiAgICAgICAgICAgICAgICAgICAgIDB4OUI2NEMyQjAsIDB4RUM2M0YyMjYsIDB4NzU2QUEzOUMsIDB4MDI2RDkzMEEsIDB4OUMwOTA2QTksIDB4RUIwRTM2M0YsIDB4NzIwNzY3ODUsIDB4MDUwMDU3MTMsIFxuICAgICAgICAgICAgICAgICAgICAgMHg5NUJGNEE4MiwgMHhFMkI4N0ExNCwgMHg3QkIxMkJBRSwgMHgwQ0I2MUIzOCwgMHg5MkQyOEU5QiwgMHhFNUQ1QkUwRCwgMHg3Q0RDRUZCNywgMHgwQkRCREYyMSwgXG4gICAgICAgICAgICAgICAgICAgICAweDg2RDNEMkQ0LCAweEYxRDRFMjQyLCAweDY4RERCM0Y4LCAweDFGREE4MzZFLCAweDgxQkUxNkNELCAweEY2QjkyNjVCLCAweDZGQjA3N0UxLCAweDE4Qjc0Nzc3LCBcbiAgICAgICAgICAgICAgICAgICAgIDB4ODgwODVBRTYsIDB4RkYwRjZBNzAsIDB4NjYwNjNCQ0EsIDB4MTEwMTBCNUMsIDB4OEY2NTlFRkYsIDB4Rjg2MkFFNjksIDB4NjE2QkZGRDMsIDB4MTY2Q0NGNDUsIFxuICAgICAgICAgICAgICAgICAgICAgMHhBMDBBRTI3OCwgMHhENzBERDJFRSwgMHg0RTA0ODM1NCwgMHgzOTAzQjNDMiwgMHhBNzY3MjY2MSwgMHhEMDYwMTZGNywgMHg0OTY5NDc0RCwgMHgzRTZFNzdEQiwgXG4gICAgICAgICAgICAgICAgICAgICAweEFFRDE2QTRBLCAweEQ5RDY1QURDLCAweDQwREYwQjY2LCAweDM3RDgzQkYwLCAweEE5QkNBRTUzLCAweERFQkI5RUM1LCAweDQ3QjJDRjdGLCAweDMwQjVGRkU5LCBcbiAgICAgICAgICAgICAgICAgICAgIDB4QkRCREYyMUMsIDB4Q0FCQUMyOEEsIDB4NTNCMzkzMzAsIDB4MjRCNEEzQTYsIDB4QkFEMDM2MDUsIDB4Q0RENzA2OTMsIDB4NTRERTU3MjksIDB4MjNEOTY3QkYsIFxuICAgICAgICAgICAgICAgICAgICAgMHhCMzY2N0EyRSwgMHhDNDYxNEFCOCwgMHg1RDY4MUIwMiwgMHgyQTZGMkI5NCwgMHhCNDBCQkUzNywgMHhDMzBDOEVBMSwgMHg1QTA1REYxQiwgMHgyRDAyRUY4RF07XG4gICAgIFxuICAgICAgICB2YXIgY3JjID0gLTEsIHkgPSAwLCBuID0gYS5sZW5ndGgsaTtcblxuICAgICAgICBmb3IgKGkgPSBmcm9tOyBpIDwgdG87IGkrKykge1xuICAgICAgICAgICAgeSA9IChjcmMgXiBhW2ldKSAmIDB4RkY7XG4gICAgICAgICAgICBjcmMgPSAoY3JjID4+PiA4KSBeIHRhYmxlW3ldO1xuICAgICAgICB9XG4gICAgIFxuICAgICAgICByZXR1cm4gY3JjIF4gKC0xKTtcbiAgICB9XG5cbiAgICB2YXIgaCA9IGltZ1swXS5sZW5ndGgsIHcgPSBpbWdbMF1bMF0ubGVuZ3RoLCBzMSwgczIsIG5leHQsayxsZW5ndGgsYSxiLGksaixhZGxlcjMyLGNyYzMyO1xuICAgIHZhciBzdHJlYW0gPSBbXG4gICAgICAgICAgICAgICAgICAxMzcsIDgwLCA3OCwgNzEsIDEzLCAxMCwgMjYsIDEwLCAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICAwOiBQTkcgc2lnbmF0dXJlXG4gICAgICAgICAgICAgICAgICAwLDAsMCwxMywgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICA4OiBJSERSIENodW5rIGxlbmd0aFxuICAgICAgICAgICAgICAgICAgNzMsIDcyLCA2OCwgODIsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAxMjogXCJJSERSXCIgXG4gICAgICAgICAgICAgICAgICAodyA+PiAyNCkgJiAyNTUsICh3ID4+IDE2KSAmIDI1NSwgKHcgPj4gOCkgJiAyNTUsIHcmMjU1LCAgIC8vIDE2OiBXaWR0aFxuICAgICAgICAgICAgICAgICAgKGggPj4gMjQpICYgMjU1LCAoaCA+PiAxNikgJiAyNTUsIChoID4+IDgpICYgMjU1LCBoJjI1NSwgICAvLyAyMDogSGVpZ2h0XG4gICAgICAgICAgICAgICAgICA4LCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIDI0OiBiaXQgZGVwdGhcbiAgICAgICAgICAgICAgICAgIDIsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gMjU6IFJHQlxuICAgICAgICAgICAgICAgICAgMCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAyNjogZGVmbGF0ZVxuICAgICAgICAgICAgICAgICAgMCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAyNzogbm8gZmlsdGVyXG4gICAgICAgICAgICAgICAgICAwLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIDI4OiBubyBpbnRlcmxhY2VcbiAgICAgICAgICAgICAgICAgIC0xLC0yLC0zLC00LCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gMjk6IENSQ1xuICAgICAgICAgICAgICAgICAgLTUsLTYsLTcsLTgsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAzMzogSURBVCBDaHVuayBsZW5ndGhcbiAgICAgICAgICAgICAgICAgIDczLCA2OCwgNjUsIDg0LCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gMzc6IFwiSURBVFwiXG4gICAgICAgICAgICAgICAgICAvLyBSRkMgMTk1MCBoZWFkZXIgc3RhcnRzIGhlcmVcbiAgICAgICAgICAgICAgICAgIDgsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gNDE6IFJGQzE5NTAgQ01GXG4gICAgICAgICAgICAgICAgICAyOSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIDQyOiBSRkMxOTUwIEZMR1xuICAgICAgICAgICAgICAgICAgXTtcbiAgICBjcmMzMiA9IGNyYzMyQXJyYXkoc3RyZWFtLDEyLDI5KTtcbiAgICBzdHJlYW1bMjldID0gKGNyYzMyPj4yNCkmMjU1O1xuICAgIHN0cmVhbVszMF0gPSAoY3JjMzI+PjE2KSYyNTU7XG4gICAgc3RyZWFtWzMxXSA9IChjcmMzMj4+OCkmMjU1O1xuICAgIHN0cmVhbVszMl0gPSAoY3JjMzIpJjI1NTtcbiAgICBzMSA9IDE7XG4gICAgczIgPSAwO1xuICAgIGZvcihpPTA7aTxoO2krKykge1xuICAgICAgICBpZihpPGgtMSkgeyBzdHJlYW0ucHVzaCgwKTsgfVxuICAgICAgICBlbHNlIHsgc3RyZWFtLnB1c2goMSk7IH1cbiAgICAgICAgYSA9ICgzKncrMSsoaT09PTApKSYyNTU7IGIgPSAoKDMqdysxKyhpPT09MCkpPj44KSYyNTU7XG4gICAgICAgIHN0cmVhbS5wdXNoKGEpOyBzdHJlYW0ucHVzaChiKTtcbiAgICAgICAgc3RyZWFtLnB1c2goKH5hKSYyNTUpOyBzdHJlYW0ucHVzaCgofmIpJjI1NSk7XG4gICAgICAgIGlmKGk9PT0wKSBzdHJlYW0ucHVzaCgwKTtcbiAgICAgICAgZm9yKGo9MDtqPHc7aisrKSB7XG4gICAgICAgICAgICBmb3Ioaz0wO2s8MztrKyspIHtcbiAgICAgICAgICAgICAgICBhID0gaW1nW2tdW2ldW2pdO1xuICAgICAgICAgICAgICAgIGlmKGE+MjU1KSBhID0gMjU1O1xuICAgICAgICAgICAgICAgIGVsc2UgaWYoYTwwKSBhPTA7XG4gICAgICAgICAgICAgICAgZWxzZSBhID0gTWF0aC5yb3VuZChhKTtcbiAgICAgICAgICAgICAgICBzMSA9IChzMSArIGEgKSU2NTUyMTtcbiAgICAgICAgICAgICAgICBzMiA9IChzMiArIHMxKSU2NTUyMTtcbiAgICAgICAgICAgICAgICBzdHJlYW0ucHVzaChhKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBzdHJlYW0ucHVzaCgwKTtcbiAgICB9XG4gICAgYWRsZXIzMiA9IChzMjw8MTYpK3MxO1xuICAgIHN0cmVhbS5wdXNoKChhZGxlcjMyPj4yNCkmMjU1KTtcbiAgICBzdHJlYW0ucHVzaCgoYWRsZXIzMj4+MTYpJjI1NSk7XG4gICAgc3RyZWFtLnB1c2goKGFkbGVyMzI+PjgpJjI1NSk7XG4gICAgc3RyZWFtLnB1c2goKGFkbGVyMzIpJjI1NSk7XG4gICAgbGVuZ3RoID0gc3RyZWFtLmxlbmd0aCAtIDQxO1xuICAgIHN0cmVhbVszM10gPSAobGVuZ3RoPj4yNCkmMjU1O1xuICAgIHN0cmVhbVszNF0gPSAobGVuZ3RoPj4xNikmMjU1O1xuICAgIHN0cmVhbVszNV0gPSAobGVuZ3RoPj44KSYyNTU7XG4gICAgc3RyZWFtWzM2XSA9IChsZW5ndGgpJjI1NTtcbiAgICBjcmMzMiA9IGNyYzMyQXJyYXkoc3RyZWFtLDM3KTtcbiAgICBzdHJlYW0ucHVzaCgoY3JjMzI+PjI0KSYyNTUpO1xuICAgIHN0cmVhbS5wdXNoKChjcmMzMj4+MTYpJjI1NSk7XG4gICAgc3RyZWFtLnB1c2goKGNyYzMyPj44KSYyNTUpO1xuICAgIHN0cmVhbS5wdXNoKChjcmMzMikmMjU1KTtcbiAgICBzdHJlYW0ucHVzaCgwKTtcbiAgICBzdHJlYW0ucHVzaCgwKTtcbiAgICBzdHJlYW0ucHVzaCgwKTtcbiAgICBzdHJlYW0ucHVzaCgwKTtcbi8vICAgIGEgPSBzdHJlYW0ubGVuZ3RoO1xuICAgIHN0cmVhbS5wdXNoKDczKTsgIC8vIElcbiAgICBzdHJlYW0ucHVzaCg2OSk7ICAvLyBFXG4gICAgc3RyZWFtLnB1c2goNzgpOyAgLy8gTlxuICAgIHN0cmVhbS5wdXNoKDY4KTsgIC8vIERcbiAgICBzdHJlYW0ucHVzaCgxNzQpOyAvLyBDUkMxXG4gICAgc3RyZWFtLnB1c2goNjYpOyAgLy8gQ1JDMlxuICAgIHN0cmVhbS5wdXNoKDk2KTsgIC8vIENSQzNcbiAgICBzdHJlYW0ucHVzaCgxMzApOyAvLyBDUkM0XG4gICAgcmV0dXJuICdkYXRhOmltYWdlL3BuZztiYXNlNjQsJytiYXNlNjQoc3RyZWFtKTtcbn1cblxuLy8gMi4gTGluZWFyIGFsZ2VicmEgd2l0aCBBcnJheXMuXG5udW1lcmljLl9kaW0gPSBmdW5jdGlvbiBfZGltKHgpIHtcbiAgICB2YXIgcmV0ID0gW107XG4gICAgd2hpbGUodHlwZW9mIHggPT09IFwib2JqZWN0XCIpIHsgcmV0LnB1c2goeC5sZW5ndGgpOyB4ID0geFswXTsgfVxuICAgIHJldHVybiByZXQ7XG59XG5cbm51bWVyaWMuZGltID0gZnVuY3Rpb24gZGltKHgpIHtcbiAgICB2YXIgeSx6O1xuICAgIGlmKHR5cGVvZiB4ID09PSBcIm9iamVjdFwiKSB7XG4gICAgICAgIHkgPSB4WzBdO1xuICAgICAgICBpZih0eXBlb2YgeSA9PT0gXCJvYmplY3RcIikge1xuICAgICAgICAgICAgeiA9IHlbMF07XG4gICAgICAgICAgICBpZih0eXBlb2YgeiA9PT0gXCJvYmplY3RcIikge1xuICAgICAgICAgICAgICAgIHJldHVybiBudW1lcmljLl9kaW0oeCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gW3gubGVuZ3RoLHkubGVuZ3RoXTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gW3gubGVuZ3RoXTtcbiAgICB9XG4gICAgcmV0dXJuIFtdO1xufVxuXG5udW1lcmljLm1hcHJlZHVjZSA9IGZ1bmN0aW9uIG1hcHJlZHVjZShib2R5LGluaXQpIHtcbiAgICByZXR1cm4gRnVuY3Rpb24oJ3gnLCdhY2N1bScsJ19zJywnX2snLFxuICAgICAgICAgICAgJ2lmKHR5cGVvZiBhY2N1bSA9PT0gXCJ1bmRlZmluZWRcIikgYWNjdW0gPSAnK2luaXQrJztcXG4nK1xuICAgICAgICAgICAgJ2lmKHR5cGVvZiB4ID09PSBcIm51bWJlclwiKSB7IHZhciB4aSA9IHg7ICcrYm9keSsnOyByZXR1cm4gYWNjdW07IH1cXG4nK1xuICAgICAgICAgICAgJ2lmKHR5cGVvZiBfcyA9PT0gXCJ1bmRlZmluZWRcIikgX3MgPSBudW1lcmljLmRpbSh4KTtcXG4nK1xuICAgICAgICAgICAgJ2lmKHR5cGVvZiBfayA9PT0gXCJ1bmRlZmluZWRcIikgX2sgPSAwO1xcbicrXG4gICAgICAgICAgICAndmFyIF9uID0gX3NbX2tdO1xcbicrXG4gICAgICAgICAgICAndmFyIGkseGk7XFxuJytcbiAgICAgICAgICAgICdpZihfayA8IF9zLmxlbmd0aC0xKSB7XFxuJytcbiAgICAgICAgICAgICcgICAgZm9yKGk9X24tMTtpPj0wO2ktLSkge1xcbicrXG4gICAgICAgICAgICAnICAgICAgICBhY2N1bSA9IGFyZ3VtZW50cy5jYWxsZWUoeFtpXSxhY2N1bSxfcyxfaysxKTtcXG4nK1xuICAgICAgICAgICAgJyAgICB9JytcbiAgICAgICAgICAgICcgICAgcmV0dXJuIGFjY3VtO1xcbicrXG4gICAgICAgICAgICAnfVxcbicrXG4gICAgICAgICAgICAnZm9yKGk9X24tMTtpPj0xO2ktPTIpIHsgXFxuJytcbiAgICAgICAgICAgICcgICAgeGkgPSB4W2ldO1xcbicrXG4gICAgICAgICAgICAnICAgICcrYm9keSsnO1xcbicrXG4gICAgICAgICAgICAnICAgIHhpID0geFtpLTFdO1xcbicrXG4gICAgICAgICAgICAnICAgICcrYm9keSsnO1xcbicrXG4gICAgICAgICAgICAnfVxcbicrXG4gICAgICAgICAgICAnaWYoaSA9PT0gMCkge1xcbicrXG4gICAgICAgICAgICAnICAgIHhpID0geFtpXTtcXG4nK1xuICAgICAgICAgICAgJyAgICAnK2JvZHkrJ1xcbicrXG4gICAgICAgICAgICAnfVxcbicrXG4gICAgICAgICAgICAncmV0dXJuIGFjY3VtOydcbiAgICAgICAgICAgICk7XG59XG5udW1lcmljLm1hcHJlZHVjZTIgPSBmdW5jdGlvbiBtYXByZWR1Y2UyKGJvZHksc2V0dXApIHtcbiAgICByZXR1cm4gRnVuY3Rpb24oJ3gnLFxuICAgICAgICAgICAgJ3ZhciBuID0geC5sZW5ndGg7XFxuJytcbiAgICAgICAgICAgICd2YXIgaSx4aTtcXG4nK3NldHVwKyc7XFxuJytcbiAgICAgICAgICAgICdmb3IoaT1uLTE7aSE9PS0xOy0taSkgeyBcXG4nK1xuICAgICAgICAgICAgJyAgICB4aSA9IHhbaV07XFxuJytcbiAgICAgICAgICAgICcgICAgJytib2R5Kyc7XFxuJytcbiAgICAgICAgICAgICd9XFxuJytcbiAgICAgICAgICAgICdyZXR1cm4gYWNjdW07J1xuICAgICAgICAgICAgKTtcbn1cblxuXG5udW1lcmljLnNhbWUgPSBmdW5jdGlvbiBzYW1lKHgseSkge1xuICAgIHZhciBpLG47XG4gICAgaWYoISh4IGluc3RhbmNlb2YgQXJyYXkpIHx8ICEoeSBpbnN0YW5jZW9mIEFycmF5KSkgeyByZXR1cm4gZmFsc2U7IH1cbiAgICBuID0geC5sZW5ndGg7XG4gICAgaWYobiAhPT0geS5sZW5ndGgpIHsgcmV0dXJuIGZhbHNlOyB9XG4gICAgZm9yKGk9MDtpPG47aSsrKSB7XG4gICAgICAgIGlmKHhbaV0gPT09IHlbaV0pIHsgY29udGludWU7IH1cbiAgICAgICAgaWYodHlwZW9mIHhbaV0gPT09IFwib2JqZWN0XCIpIHsgaWYoIXNhbWUoeFtpXSx5W2ldKSkgcmV0dXJuIGZhbHNlOyB9XG4gICAgICAgIGVsc2UgeyByZXR1cm4gZmFsc2U7IH1cbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG59XG5cbm51bWVyaWMucmVwID0gZnVuY3Rpb24gcmVwKHMsdixrKSB7XG4gICAgaWYodHlwZW9mIGsgPT09IFwidW5kZWZpbmVkXCIpIHsgaz0wOyB9XG4gICAgdmFyIG4gPSBzW2tdLCByZXQgPSBBcnJheShuKSwgaTtcbiAgICBpZihrID09PSBzLmxlbmd0aC0xKSB7XG4gICAgICAgIGZvcihpPW4tMjtpPj0wO2ktPTIpIHsgcmV0W2krMV0gPSB2OyByZXRbaV0gPSB2OyB9XG4gICAgICAgIGlmKGk9PT0tMSkgeyByZXRbMF0gPSB2OyB9XG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfVxuICAgIGZvcihpPW4tMTtpPj0wO2ktLSkgeyByZXRbaV0gPSBudW1lcmljLnJlcChzLHYsaysxKTsgfVxuICAgIHJldHVybiByZXQ7XG59XG5cblxubnVtZXJpYy5kb3RNTXNtYWxsID0gZnVuY3Rpb24gZG90TU1zbWFsbCh4LHkpIHtcbiAgICB2YXIgaSxqLGsscCxxLHIscmV0LGZvbyxiYXIsd29vLGkwLGswLHAwLHIwO1xuICAgIHAgPSB4Lmxlbmd0aDsgcSA9IHkubGVuZ3RoOyByID0geVswXS5sZW5ndGg7XG4gICAgcmV0ID0gQXJyYXkocCk7XG4gICAgZm9yKGk9cC0xO2k+PTA7aS0tKSB7XG4gICAgICAgIGZvbyA9IEFycmF5KHIpO1xuICAgICAgICBiYXIgPSB4W2ldO1xuICAgICAgICBmb3Ioaz1yLTE7az49MDtrLS0pIHtcbiAgICAgICAgICAgIHdvbyA9IGJhcltxLTFdKnlbcS0xXVtrXTtcbiAgICAgICAgICAgIGZvcihqPXEtMjtqPj0xO2otPTIpIHtcbiAgICAgICAgICAgICAgICBpMCA9IGotMTtcbiAgICAgICAgICAgICAgICB3b28gKz0gYmFyW2pdKnlbal1ba10gKyBiYXJbaTBdKnlbaTBdW2tdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYoaj09PTApIHsgd29vICs9IGJhclswXSp5WzBdW2tdOyB9XG4gICAgICAgICAgICBmb29ba10gPSB3b287XG4gICAgICAgIH1cbiAgICAgICAgcmV0W2ldID0gZm9vO1xuICAgIH1cbiAgICByZXR1cm4gcmV0O1xufVxubnVtZXJpYy5fZ2V0Q29sID0gZnVuY3Rpb24gX2dldENvbChBLGoseCkge1xuICAgIHZhciBuID0gQS5sZW5ndGgsIGk7XG4gICAgZm9yKGk9bi0xO2k+MDstLWkpIHtcbiAgICAgICAgeFtpXSA9IEFbaV1bal07XG4gICAgICAgIC0taTtcbiAgICAgICAgeFtpXSA9IEFbaV1bal07XG4gICAgfVxuICAgIGlmKGk9PT0wKSB4WzBdID0gQVswXVtqXTtcbn1cbm51bWVyaWMuZG90TU1iaWcgPSBmdW5jdGlvbiBkb3RNTWJpZyh4LHkpe1xuICAgIHZhciBnYyA9IG51bWVyaWMuX2dldENvbCwgcCA9IHkubGVuZ3RoLCB2ID0gQXJyYXkocCk7XG4gICAgdmFyIG0gPSB4Lmxlbmd0aCwgbiA9IHlbMF0ubGVuZ3RoLCBBID0gbmV3IEFycmF5KG0pLCB4ajtcbiAgICB2YXIgVlYgPSBudW1lcmljLmRvdFZWO1xuICAgIHZhciBpLGosayx6O1xuICAgIC0tcDtcbiAgICAtLW07XG4gICAgZm9yKGk9bTtpIT09LTE7LS1pKSBBW2ldID0gQXJyYXkobik7XG4gICAgLS1uO1xuICAgIGZvcihpPW47aSE9PS0xOy0taSkge1xuICAgICAgICBnYyh5LGksdik7XG4gICAgICAgIGZvcihqPW07aiE9PS0xOy0taikge1xuICAgICAgICAgICAgej0wO1xuICAgICAgICAgICAgeGogPSB4W2pdO1xuICAgICAgICAgICAgQVtqXVtpXSA9IFZWKHhqLHYpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBBO1xufVxuXG5udW1lcmljLmRvdE1WID0gZnVuY3Rpb24gZG90TVYoeCx5KSB7XG4gICAgdmFyIHAgPSB4Lmxlbmd0aCwgcSA9IHkubGVuZ3RoLGk7XG4gICAgdmFyIHJldCA9IEFycmF5KHApLCBkb3RWViA9IG51bWVyaWMuZG90VlY7XG4gICAgZm9yKGk9cC0xO2k+PTA7aS0tKSB7IHJldFtpXSA9IGRvdFZWKHhbaV0seSk7IH1cbiAgICByZXR1cm4gcmV0O1xufVxuXG5udW1lcmljLmRvdFZNID0gZnVuY3Rpb24gZG90Vk0oeCx5KSB7XG4gICAgdmFyIGksaixrLHAscSxyLHJldCxmb28sYmFyLHdvbyxpMCxrMCxwMCxyMCxzMSxzMixzMyxiYXosYWNjdW07XG4gICAgcCA9IHgubGVuZ3RoOyBxID0geVswXS5sZW5ndGg7XG4gICAgcmV0ID0gQXJyYXkocSk7XG4gICAgZm9yKGs9cS0xO2s+PTA7ay0tKSB7XG4gICAgICAgIHdvbyA9IHhbcC0xXSp5W3AtMV1ba107XG4gICAgICAgIGZvcihqPXAtMjtqPj0xO2otPTIpIHtcbiAgICAgICAgICAgIGkwID0gai0xO1xuICAgICAgICAgICAgd29vICs9IHhbal0qeVtqXVtrXSArIHhbaTBdKnlbaTBdW2tdO1xuICAgICAgICB9XG4gICAgICAgIGlmKGo9PT0wKSB7IHdvbyArPSB4WzBdKnlbMF1ba107IH1cbiAgICAgICAgcmV0W2tdID0gd29vO1xuICAgIH1cbiAgICByZXR1cm4gcmV0O1xufVxuXG5udW1lcmljLmRvdFZWID0gZnVuY3Rpb24gZG90VlYoeCx5KSB7XG4gICAgdmFyIGksbj14Lmxlbmd0aCxpMSxyZXQgPSB4W24tMV0qeVtuLTFdO1xuICAgIGZvcihpPW4tMjtpPj0xO2ktPTIpIHtcbiAgICAgICAgaTEgPSBpLTE7XG4gICAgICAgIHJldCArPSB4W2ldKnlbaV0gKyB4W2kxXSp5W2kxXTtcbiAgICB9XG4gICAgaWYoaT09PTApIHsgcmV0ICs9IHhbMF0qeVswXTsgfVxuICAgIHJldHVybiByZXQ7XG59XG5cbm51bWVyaWMuZG90ID0gZnVuY3Rpb24gZG90KHgseSkge1xuICAgIHZhciBkID0gbnVtZXJpYy5kaW07XG4gICAgc3dpdGNoKGQoeCkubGVuZ3RoKjEwMDArZCh5KS5sZW5ndGgpIHtcbiAgICBjYXNlIDIwMDI6XG4gICAgICAgIGlmKHkubGVuZ3RoIDwgMTApIHJldHVybiBudW1lcmljLmRvdE1Nc21hbGwoeCx5KTtcbiAgICAgICAgZWxzZSByZXR1cm4gbnVtZXJpYy5kb3RNTWJpZyh4LHkpO1xuICAgIGNhc2UgMjAwMTogcmV0dXJuIG51bWVyaWMuZG90TVYoeCx5KTtcbiAgICBjYXNlIDEwMDI6IHJldHVybiBudW1lcmljLmRvdFZNKHgseSk7XG4gICAgY2FzZSAxMDAxOiByZXR1cm4gbnVtZXJpYy5kb3RWVih4LHkpO1xuICAgIGNhc2UgMTAwMDogcmV0dXJuIG51bWVyaWMubXVsVlMoeCx5KTtcbiAgICBjYXNlIDE6IHJldHVybiBudW1lcmljLm11bFNWKHgseSk7XG4gICAgY2FzZSAwOiByZXR1cm4geCp5O1xuICAgIGRlZmF1bHQ6IHRocm93IG5ldyBFcnJvcignbnVtZXJpYy5kb3Qgb25seSB3b3JrcyBvbiB2ZWN0b3JzIGFuZCBtYXRyaWNlcycpO1xuICAgIH1cbn1cblxubnVtZXJpYy5kaWFnID0gZnVuY3Rpb24gZGlhZyhkKSB7XG4gICAgdmFyIGksaTEsaixuID0gZC5sZW5ndGgsIEEgPSBBcnJheShuKSwgQWk7XG4gICAgZm9yKGk9bi0xO2k+PTA7aS0tKSB7XG4gICAgICAgIEFpID0gQXJyYXkobik7XG4gICAgICAgIGkxID0gaSsyO1xuICAgICAgICBmb3Ioaj1uLTE7aj49aTE7ai09Mikge1xuICAgICAgICAgICAgQWlbal0gPSAwO1xuICAgICAgICAgICAgQWlbai0xXSA9IDA7XG4gICAgICAgIH1cbiAgICAgICAgaWYoaj5pKSB7IEFpW2pdID0gMDsgfVxuICAgICAgICBBaVtpXSA9IGRbaV07XG4gICAgICAgIGZvcihqPWktMTtqPj0xO2otPTIpIHtcbiAgICAgICAgICAgIEFpW2pdID0gMDtcbiAgICAgICAgICAgIEFpW2otMV0gPSAwO1xuICAgICAgICB9XG4gICAgICAgIGlmKGo9PT0wKSB7IEFpWzBdID0gMDsgfVxuICAgICAgICBBW2ldID0gQWk7XG4gICAgfVxuICAgIHJldHVybiBBO1xufVxubnVtZXJpYy5nZXREaWFnID0gZnVuY3Rpb24oQSkge1xuICAgIHZhciBuID0gTWF0aC5taW4oQS5sZW5ndGgsQVswXS5sZW5ndGgpLGkscmV0ID0gQXJyYXkobik7XG4gICAgZm9yKGk9bi0xO2k+PTE7LS1pKSB7XG4gICAgICAgIHJldFtpXSA9IEFbaV1baV07XG4gICAgICAgIC0taTtcbiAgICAgICAgcmV0W2ldID0gQVtpXVtpXTtcbiAgICB9XG4gICAgaWYoaT09PTApIHtcbiAgICAgICAgcmV0WzBdID0gQVswXVswXTtcbiAgICB9XG4gICAgcmV0dXJuIHJldDtcbn1cblxubnVtZXJpYy5pZGVudGl0eSA9IGZ1bmN0aW9uIGlkZW50aXR5KG4pIHsgcmV0dXJuIG51bWVyaWMuZGlhZyhudW1lcmljLnJlcChbbl0sMSkpOyB9XG5udW1lcmljLnBvaW50d2lzZSA9IGZ1bmN0aW9uIHBvaW50d2lzZShwYXJhbXMsYm9keSxzZXR1cCkge1xuICAgIGlmKHR5cGVvZiBzZXR1cCA9PT0gXCJ1bmRlZmluZWRcIikgeyBzZXR1cCA9IFwiXCI7IH1cbiAgICB2YXIgZnVuID0gW107XG4gICAgdmFyIGs7XG4gICAgdmFyIGF2ZWMgPSAvXFxbaVxcXSQvLHAsdGhldmVjID0gJyc7XG4gICAgdmFyIGhhdmVyZXQgPSBmYWxzZTtcbiAgICBmb3Ioaz0wO2s8cGFyYW1zLmxlbmd0aDtrKyspIHtcbiAgICAgICAgaWYoYXZlYy50ZXN0KHBhcmFtc1trXSkpIHtcbiAgICAgICAgICAgIHAgPSBwYXJhbXNba10uc3Vic3RyaW5nKDAscGFyYW1zW2tdLmxlbmd0aC0zKTtcbiAgICAgICAgICAgIHRoZXZlYyA9IHA7XG4gICAgICAgIH0gZWxzZSB7IHAgPSBwYXJhbXNba107IH1cbiAgICAgICAgaWYocD09PSdyZXQnKSBoYXZlcmV0ID0gdHJ1ZTtcbiAgICAgICAgZnVuLnB1c2gocCk7XG4gICAgfVxuICAgIGZ1bltwYXJhbXMubGVuZ3RoXSA9ICdfcyc7XG4gICAgZnVuW3BhcmFtcy5sZW5ndGgrMV0gPSAnX2snO1xuICAgIGZ1bltwYXJhbXMubGVuZ3RoKzJdID0gKFxuICAgICAgICAgICAgJ2lmKHR5cGVvZiBfcyA9PT0gXCJ1bmRlZmluZWRcIikgX3MgPSBudW1lcmljLmRpbSgnK3RoZXZlYysnKTtcXG4nK1xuICAgICAgICAgICAgJ2lmKHR5cGVvZiBfayA9PT0gXCJ1bmRlZmluZWRcIikgX2sgPSAwO1xcbicrXG4gICAgICAgICAgICAndmFyIF9uID0gX3NbX2tdO1xcbicrXG4gICAgICAgICAgICAndmFyIGknKyhoYXZlcmV0PycnOicsIHJldCA9IEFycmF5KF9uKScpKyc7XFxuJytcbiAgICAgICAgICAgICdpZihfayA8IF9zLmxlbmd0aC0xKSB7XFxuJytcbiAgICAgICAgICAgICcgICAgZm9yKGk9X24tMTtpPj0wO2ktLSkgcmV0W2ldID0gYXJndW1lbnRzLmNhbGxlZSgnK3BhcmFtcy5qb2luKCcsJykrJyxfcyxfaysxKTtcXG4nK1xuICAgICAgICAgICAgJyAgICByZXR1cm4gcmV0O1xcbicrXG4gICAgICAgICAgICAnfVxcbicrXG4gICAgICAgICAgICBzZXR1cCsnXFxuJytcbiAgICAgICAgICAgICdmb3IoaT1fbi0xO2khPT0tMTstLWkpIHtcXG4nK1xuICAgICAgICAgICAgJyAgICAnK2JvZHkrJ1xcbicrXG4gICAgICAgICAgICAnfVxcbicrXG4gICAgICAgICAgICAncmV0dXJuIHJldDsnXG4gICAgICAgICAgICApO1xuICAgIHJldHVybiBGdW5jdGlvbi5hcHBseShudWxsLGZ1bik7XG59XG5udW1lcmljLnBvaW50d2lzZTIgPSBmdW5jdGlvbiBwb2ludHdpc2UyKHBhcmFtcyxib2R5LHNldHVwKSB7XG4gICAgaWYodHlwZW9mIHNldHVwID09PSBcInVuZGVmaW5lZFwiKSB7IHNldHVwID0gXCJcIjsgfVxuICAgIHZhciBmdW4gPSBbXTtcbiAgICB2YXIgaztcbiAgICB2YXIgYXZlYyA9IC9cXFtpXFxdJC8scCx0aGV2ZWMgPSAnJztcbiAgICB2YXIgaGF2ZXJldCA9IGZhbHNlO1xuICAgIGZvcihrPTA7azxwYXJhbXMubGVuZ3RoO2srKykge1xuICAgICAgICBpZihhdmVjLnRlc3QocGFyYW1zW2tdKSkge1xuICAgICAgICAgICAgcCA9IHBhcmFtc1trXS5zdWJzdHJpbmcoMCxwYXJhbXNba10ubGVuZ3RoLTMpO1xuICAgICAgICAgICAgdGhldmVjID0gcDtcbiAgICAgICAgfSBlbHNlIHsgcCA9IHBhcmFtc1trXTsgfVxuICAgICAgICBpZihwPT09J3JldCcpIGhhdmVyZXQgPSB0cnVlO1xuICAgICAgICBmdW4ucHVzaChwKTtcbiAgICB9XG4gICAgZnVuW3BhcmFtcy5sZW5ndGhdID0gKFxuICAgICAgICAgICAgJ3ZhciBfbiA9ICcrdGhldmVjKycubGVuZ3RoO1xcbicrXG4gICAgICAgICAgICAndmFyIGknKyhoYXZlcmV0PycnOicsIHJldCA9IEFycmF5KF9uKScpKyc7XFxuJytcbiAgICAgICAgICAgIHNldHVwKydcXG4nK1xuICAgICAgICAgICAgJ2ZvcihpPV9uLTE7aSE9PS0xOy0taSkge1xcbicrXG4gICAgICAgICAgICBib2R5KydcXG4nK1xuICAgICAgICAgICAgJ31cXG4nK1xuICAgICAgICAgICAgJ3JldHVybiByZXQ7J1xuICAgICAgICAgICAgKTtcbiAgICByZXR1cm4gRnVuY3Rpb24uYXBwbHkobnVsbCxmdW4pO1xufVxubnVtZXJpYy5fYmlmb3JlYWNoID0gKGZ1bmN0aW9uIF9iaWZvcmVhY2goeCx5LHMsayxmKSB7XG4gICAgaWYoayA9PT0gcy5sZW5ndGgtMSkgeyBmKHgseSk7IHJldHVybjsgfVxuICAgIHZhciBpLG49c1trXTtcbiAgICBmb3IoaT1uLTE7aT49MDtpLS0pIHsgX2JpZm9yZWFjaCh0eXBlb2YgeD09PVwib2JqZWN0XCI/eFtpXTp4LHR5cGVvZiB5PT09XCJvYmplY3RcIj95W2ldOnkscyxrKzEsZik7IH1cbn0pO1xubnVtZXJpYy5fYmlmb3JlYWNoMiA9IChmdW5jdGlvbiBfYmlmb3JlYWNoMih4LHkscyxrLGYpIHtcbiAgICBpZihrID09PSBzLmxlbmd0aC0xKSB7IHJldHVybiBmKHgseSk7IH1cbiAgICB2YXIgaSxuPXNba10scmV0ID0gQXJyYXkobik7XG4gICAgZm9yKGk9bi0xO2k+PTA7LS1pKSB7IHJldFtpXSA9IF9iaWZvcmVhY2gyKHR5cGVvZiB4PT09XCJvYmplY3RcIj94W2ldOngsdHlwZW9mIHk9PT1cIm9iamVjdFwiP3lbaV06eSxzLGsrMSxmKTsgfVxuICAgIHJldHVybiByZXQ7XG59KTtcbm51bWVyaWMuX2ZvcmVhY2ggPSAoZnVuY3Rpb24gX2ZvcmVhY2goeCxzLGssZikge1xuICAgIGlmKGsgPT09IHMubGVuZ3RoLTEpIHsgZih4KTsgcmV0dXJuOyB9XG4gICAgdmFyIGksbj1zW2tdO1xuICAgIGZvcihpPW4tMTtpPj0wO2ktLSkgeyBfZm9yZWFjaCh4W2ldLHMsaysxLGYpOyB9XG59KTtcbm51bWVyaWMuX2ZvcmVhY2gyID0gKGZ1bmN0aW9uIF9mb3JlYWNoMih4LHMsayxmKSB7XG4gICAgaWYoayA9PT0gcy5sZW5ndGgtMSkgeyByZXR1cm4gZih4KTsgfVxuICAgIHZhciBpLG49c1trXSwgcmV0ID0gQXJyYXkobik7XG4gICAgZm9yKGk9bi0xO2k+PTA7aS0tKSB7IHJldFtpXSA9IF9mb3JlYWNoMih4W2ldLHMsaysxLGYpOyB9XG4gICAgcmV0dXJuIHJldDtcbn0pO1xuXG4vKm51bWVyaWMuYW55ViA9IG51bWVyaWMubWFwcmVkdWNlKCdpZih4aSkgcmV0dXJuIHRydWU7JywnZmFsc2UnKTtcbm51bWVyaWMuYWxsViA9IG51bWVyaWMubWFwcmVkdWNlKCdpZigheGkpIHJldHVybiBmYWxzZTsnLCd0cnVlJyk7XG5udW1lcmljLmFueSA9IGZ1bmN0aW9uKHgpIHsgaWYodHlwZW9mIHgubGVuZ3RoID09PSBcInVuZGVmaW5lZFwiKSByZXR1cm4geDsgcmV0dXJuIG51bWVyaWMuYW55Vih4KTsgfVxubnVtZXJpYy5hbGwgPSBmdW5jdGlvbih4KSB7IGlmKHR5cGVvZiB4Lmxlbmd0aCA9PT0gXCJ1bmRlZmluZWRcIikgcmV0dXJuIHg7IHJldHVybiBudW1lcmljLmFsbFYoeCk7IH0qL1xuXG5udW1lcmljLm9wczIgPSB7XG4gICAgICAgIGFkZDogJysnLFxuICAgICAgICBzdWI6ICctJyxcbiAgICAgICAgbXVsOiAnKicsXG4gICAgICAgIGRpdjogJy8nLFxuICAgICAgICBtb2Q6ICclJyxcbiAgICAgICAgYW5kOiAnJiYnLFxuICAgICAgICBvcjogICd8fCcsXG4gICAgICAgIGVxOiAgJz09PScsXG4gICAgICAgIG5lcTogJyE9PScsXG4gICAgICAgIGx0OiAgJzwnLFxuICAgICAgICBndDogICc+JyxcbiAgICAgICAgbGVxOiAnPD0nLFxuICAgICAgICBnZXE6ICc+PScsXG4gICAgICAgIGJhbmQ6ICcmJyxcbiAgICAgICAgYm9yOiAnfCcsXG4gICAgICAgIGJ4b3I6ICdeJyxcbiAgICAgICAgbHNoaWZ0OiAnPDwnLFxuICAgICAgICByc2hpZnQ6ICc+PicsXG4gICAgICAgIHJyc2hpZnQ6ICc+Pj4nXG59O1xubnVtZXJpYy5vcHNlcSA9IHtcbiAgICAgICAgYWRkZXE6ICcrPScsXG4gICAgICAgIHN1YmVxOiAnLT0nLFxuICAgICAgICBtdWxlcTogJyo9JyxcbiAgICAgICAgZGl2ZXE6ICcvPScsXG4gICAgICAgIG1vZGVxOiAnJT0nLFxuICAgICAgICBsc2hpZnRlcTogJzw8PScsXG4gICAgICAgIHJzaGlmdGVxOiAnPj49JyxcbiAgICAgICAgcnJzaGlmdGVxOiAnPj4+PScsXG4gICAgICAgIGJhbmRlcTogJyY9JyxcbiAgICAgICAgYm9yZXE6ICd8PScsXG4gICAgICAgIGJ4b3JlcTogJ149J1xufTtcbm51bWVyaWMubWF0aGZ1bnMgPSBbJ2FicycsJ2Fjb3MnLCdhc2luJywnYXRhbicsJ2NlaWwnLCdjb3MnLFxuICAgICAgICAgICAgICAgICAgICAnZXhwJywnZmxvb3InLCdsb2cnLCdyb3VuZCcsJ3NpbicsJ3NxcnQnLCd0YW4nLFxuICAgICAgICAgICAgICAgICAgICAnaXNOYU4nLCdpc0Zpbml0ZSddO1xubnVtZXJpYy5tYXRoZnVuczIgPSBbJ2F0YW4yJywncG93JywnbWF4JywnbWluJ107XG5udW1lcmljLm9wczEgPSB7XG4gICAgICAgIG5lZzogJy0nLFxuICAgICAgICBub3Q6ICchJyxcbiAgICAgICAgYm5vdDogJ34nLFxuICAgICAgICBjbG9uZTogJydcbn07XG5udW1lcmljLm1hcHJlZHVjZXJzID0ge1xuICAgICAgICBhbnk6IFsnaWYoeGkpIHJldHVybiB0cnVlOycsJ3ZhciBhY2N1bSA9IGZhbHNlOyddLFxuICAgICAgICBhbGw6IFsnaWYoIXhpKSByZXR1cm4gZmFsc2U7JywndmFyIGFjY3VtID0gdHJ1ZTsnXSxcbiAgICAgICAgc3VtOiBbJ2FjY3VtICs9IHhpOycsJ3ZhciBhY2N1bSA9IDA7J10sXG4gICAgICAgIHByb2Q6IFsnYWNjdW0gKj0geGk7JywndmFyIGFjY3VtID0gMTsnXSxcbiAgICAgICAgbm9ybTJTcXVhcmVkOiBbJ2FjY3VtICs9IHhpKnhpOycsJ3ZhciBhY2N1bSA9IDA7J10sXG4gICAgICAgIG5vcm1pbmY6IFsnYWNjdW0gPSBtYXgoYWNjdW0sYWJzKHhpKSk7JywndmFyIGFjY3VtID0gMCwgbWF4ID0gTWF0aC5tYXgsIGFicyA9IE1hdGguYWJzOyddLFxuICAgICAgICBub3JtMTogWydhY2N1bSArPSBhYnMoeGkpJywndmFyIGFjY3VtID0gMCwgYWJzID0gTWF0aC5hYnM7J10sXG4gICAgICAgIHN1cDogWydhY2N1bSA9IG1heChhY2N1bSx4aSk7JywndmFyIGFjY3VtID0gLUluZmluaXR5LCBtYXggPSBNYXRoLm1heDsnXSxcbiAgICAgICAgaW5mOiBbJ2FjY3VtID0gbWluKGFjY3VtLHhpKTsnLCd2YXIgYWNjdW0gPSBJbmZpbml0eSwgbWluID0gTWF0aC5taW47J11cbn07XG5cbihmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGksbztcbiAgICBmb3IoaT0wO2k8bnVtZXJpYy5tYXRoZnVuczIubGVuZ3RoOysraSkge1xuICAgICAgICBvID0gbnVtZXJpYy5tYXRoZnVuczJbaV07XG4gICAgICAgIG51bWVyaWMub3BzMltvXSA9IG87XG4gICAgfVxuICAgIGZvcihpIGluIG51bWVyaWMub3BzMikge1xuICAgICAgICBpZihudW1lcmljLm9wczIuaGFzT3duUHJvcGVydHkoaSkpIHtcbiAgICAgICAgICAgIG8gPSBudW1lcmljLm9wczJbaV07XG4gICAgICAgICAgICB2YXIgY29kZSwgY29kZWVxLCBzZXR1cCA9ICcnO1xuICAgICAgICAgICAgaWYobnVtZXJpYy5teUluZGV4T2YuY2FsbChudW1lcmljLm1hdGhmdW5zMixpKSE9PS0xKSB7XG4gICAgICAgICAgICAgICAgc2V0dXAgPSAndmFyICcrbysnID0gTWF0aC4nK28rJztcXG4nO1xuICAgICAgICAgICAgICAgIGNvZGUgPSBmdW5jdGlvbihyLHgseSkgeyByZXR1cm4gcisnID0gJytvKycoJyt4KycsJyt5KycpJzsgfTtcbiAgICAgICAgICAgICAgICBjb2RlZXEgPSBmdW5jdGlvbih4LHkpIHsgcmV0dXJuIHgrJyA9ICcrbysnKCcreCsnLCcreSsnKSc7IH07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvZGUgPSBmdW5jdGlvbihyLHgseSkgeyByZXR1cm4gcisnID0gJyt4KycgJytvKycgJyt5OyB9O1xuICAgICAgICAgICAgICAgIGlmKG51bWVyaWMub3BzZXEuaGFzT3duUHJvcGVydHkoaSsnZXEnKSkge1xuICAgICAgICAgICAgICAgICAgICBjb2RlZXEgPSBmdW5jdGlvbih4LHkpIHsgcmV0dXJuIHgrJyAnK28rJz0gJyt5OyB9O1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNvZGVlcSA9IGZ1bmN0aW9uKHgseSkgeyByZXR1cm4geCsnID0gJyt4KycgJytvKycgJyt5OyB9OyAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbnVtZXJpY1tpKydWViddID0gbnVtZXJpYy5wb2ludHdpc2UyKFsneFtpXScsJ3lbaV0nXSxjb2RlKCdyZXRbaV0nLCd4W2ldJywneVtpXScpLHNldHVwKTtcbiAgICAgICAgICAgIG51bWVyaWNbaSsnU1YnXSA9IG51bWVyaWMucG9pbnR3aXNlMihbJ3gnLCd5W2ldJ10sY29kZSgncmV0W2ldJywneCcsJ3lbaV0nKSxzZXR1cCk7XG4gICAgICAgICAgICBudW1lcmljW2krJ1ZTJ10gPSBudW1lcmljLnBvaW50d2lzZTIoWyd4W2ldJywneSddLGNvZGUoJ3JldFtpXScsJ3hbaV0nLCd5Jyksc2V0dXApO1xuICAgICAgICAgICAgbnVtZXJpY1tpXSA9IEZ1bmN0aW9uKFxuICAgICAgICAgICAgICAgICAgICAndmFyIG4gPSBhcmd1bWVudHMubGVuZ3RoLCBpLCB4ID0gYXJndW1lbnRzWzBdLCB5O1xcbicrXG4gICAgICAgICAgICAgICAgICAgICd2YXIgVlYgPSBudW1lcmljLicraSsnVlYsIFZTID0gbnVtZXJpYy4nK2krJ1ZTLCBTViA9IG51bWVyaWMuJytpKydTVjtcXG4nK1xuICAgICAgICAgICAgICAgICAgICAndmFyIGRpbSA9IG51bWVyaWMuZGltO1xcbicrXG4gICAgICAgICAgICAgICAgICAgICdmb3IoaT0xO2khPT1uOysraSkgeyBcXG4nK1xuICAgICAgICAgICAgICAgICAgICAnICB5ID0gYXJndW1lbnRzW2ldO1xcbicrXG4gICAgICAgICAgICAgICAgICAgICcgIGlmKHR5cGVvZiB4ID09PSBcIm9iamVjdFwiKSB7XFxuJytcbiAgICAgICAgICAgICAgICAgICAgJyAgICAgIGlmKHR5cGVvZiB5ID09PSBcIm9iamVjdFwiKSB4ID0gbnVtZXJpYy5fYmlmb3JlYWNoMih4LHksZGltKHgpLDAsVlYpO1xcbicrXG4gICAgICAgICAgICAgICAgICAgICcgICAgICBlbHNlIHggPSBudW1lcmljLl9iaWZvcmVhY2gyKHgseSxkaW0oeCksMCxWUyk7XFxuJytcbiAgICAgICAgICAgICAgICAgICAgJyAgfSBlbHNlIGlmKHR5cGVvZiB5ID09PSBcIm9iamVjdFwiKSB4ID0gbnVtZXJpYy5fYmlmb3JlYWNoMih4LHksZGltKHkpLDAsU1YpO1xcbicrXG4gICAgICAgICAgICAgICAgICAgICcgIGVsc2UgJytjb2RlZXEoJ3gnLCd5JykrJ1xcbicrXG4gICAgICAgICAgICAgICAgICAgICd9XFxucmV0dXJuIHg7XFxuJyk7XG4gICAgICAgICAgICBudW1lcmljW29dID0gbnVtZXJpY1tpXTtcbiAgICAgICAgICAgIG51bWVyaWNbaSsnZXFWJ10gPSBudW1lcmljLnBvaW50d2lzZTIoWydyZXRbaV0nLCd4W2ldJ10sIGNvZGVlcSgncmV0W2ldJywneFtpXScpLHNldHVwKTtcbiAgICAgICAgICAgIG51bWVyaWNbaSsnZXFTJ10gPSBudW1lcmljLnBvaW50d2lzZTIoWydyZXRbaV0nLCd4J10sIGNvZGVlcSgncmV0W2ldJywneCcpLHNldHVwKTtcbiAgICAgICAgICAgIG51bWVyaWNbaSsnZXEnXSA9IEZ1bmN0aW9uKFxuICAgICAgICAgICAgICAgICAgICAndmFyIG4gPSBhcmd1bWVudHMubGVuZ3RoLCBpLCB4ID0gYXJndW1lbnRzWzBdLCB5O1xcbicrXG4gICAgICAgICAgICAgICAgICAgICd2YXIgViA9IG51bWVyaWMuJytpKydlcVYsIFMgPSBudW1lcmljLicraSsnZXFTXFxuJytcbiAgICAgICAgICAgICAgICAgICAgJ3ZhciBzID0gbnVtZXJpYy5kaW0oeCk7XFxuJytcbiAgICAgICAgICAgICAgICAgICAgJ2ZvcihpPTE7aSE9PW47KytpKSB7IFxcbicrXG4gICAgICAgICAgICAgICAgICAgICcgIHkgPSBhcmd1bWVudHNbaV07XFxuJytcbiAgICAgICAgICAgICAgICAgICAgJyAgaWYodHlwZW9mIHkgPT09IFwib2JqZWN0XCIpIG51bWVyaWMuX2JpZm9yZWFjaCh4LHkscywwLFYpO1xcbicrXG4gICAgICAgICAgICAgICAgICAgICcgIGVsc2UgbnVtZXJpYy5fYmlmb3JlYWNoKHgseSxzLDAsUyk7XFxuJytcbiAgICAgICAgICAgICAgICAgICAgJ31cXG5yZXR1cm4geDtcXG4nKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBmb3IoaT0wO2k8bnVtZXJpYy5tYXRoZnVuczIubGVuZ3RoOysraSkge1xuICAgICAgICBvID0gbnVtZXJpYy5tYXRoZnVuczJbaV07XG4gICAgICAgIGRlbGV0ZSBudW1lcmljLm9wczJbb107XG4gICAgfVxuICAgIGZvcihpPTA7aTxudW1lcmljLm1hdGhmdW5zLmxlbmd0aDsrK2kpIHtcbiAgICAgICAgbyA9IG51bWVyaWMubWF0aGZ1bnNbaV07XG4gICAgICAgIG51bWVyaWMub3BzMVtvXSA9IG87XG4gICAgfVxuICAgIGZvcihpIGluIG51bWVyaWMub3BzMSkge1xuICAgICAgICBpZihudW1lcmljLm9wczEuaGFzT3duUHJvcGVydHkoaSkpIHtcbiAgICAgICAgICAgIHNldHVwID0gJyc7XG4gICAgICAgICAgICBvID0gbnVtZXJpYy5vcHMxW2ldO1xuICAgICAgICAgICAgaWYobnVtZXJpYy5teUluZGV4T2YuY2FsbChudW1lcmljLm1hdGhmdW5zLGkpIT09LTEpIHtcbiAgICAgICAgICAgICAgICBpZihNYXRoLmhhc093blByb3BlcnR5KG8pKSBzZXR1cCA9ICd2YXIgJytvKycgPSBNYXRoLicrbysnO1xcbic7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBudW1lcmljW2krJ2VxViddID0gbnVtZXJpYy5wb2ludHdpc2UyKFsncmV0W2ldJ10sJ3JldFtpXSA9ICcrbysnKHJldFtpXSk7JyxzZXR1cCk7XG4gICAgICAgICAgICBudW1lcmljW2krJ2VxJ10gPSBGdW5jdGlvbigneCcsXG4gICAgICAgICAgICAgICAgICAgICdpZih0eXBlb2YgeCAhPT0gXCJvYmplY3RcIikgcmV0dXJuICcrbysneFxcbicrXG4gICAgICAgICAgICAgICAgICAgICd2YXIgaTtcXG4nK1xuICAgICAgICAgICAgICAgICAgICAndmFyIFYgPSBudW1lcmljLicraSsnZXFWO1xcbicrXG4gICAgICAgICAgICAgICAgICAgICd2YXIgcyA9IG51bWVyaWMuZGltKHgpO1xcbicrXG4gICAgICAgICAgICAgICAgICAgICdudW1lcmljLl9mb3JlYWNoKHgscywwLFYpO1xcbicrXG4gICAgICAgICAgICAgICAgICAgICdyZXR1cm4geDtcXG4nKTtcbiAgICAgICAgICAgIG51bWVyaWNbaSsnViddID0gbnVtZXJpYy5wb2ludHdpc2UyKFsneFtpXSddLCdyZXRbaV0gPSAnK28rJyh4W2ldKTsnLHNldHVwKTtcbiAgICAgICAgICAgIG51bWVyaWNbaV0gPSBGdW5jdGlvbigneCcsXG4gICAgICAgICAgICAgICAgICAgICdpZih0eXBlb2YgeCAhPT0gXCJvYmplY3RcIikgcmV0dXJuICcrbysnKHgpXFxuJytcbiAgICAgICAgICAgICAgICAgICAgJ3ZhciBpO1xcbicrXG4gICAgICAgICAgICAgICAgICAgICd2YXIgViA9IG51bWVyaWMuJytpKydWO1xcbicrXG4gICAgICAgICAgICAgICAgICAgICd2YXIgcyA9IG51bWVyaWMuZGltKHgpO1xcbicrXG4gICAgICAgICAgICAgICAgICAgICdyZXR1cm4gbnVtZXJpYy5fZm9yZWFjaDIoeCxzLDAsVik7XFxuJyk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZm9yKGk9MDtpPG51bWVyaWMubWF0aGZ1bnMubGVuZ3RoOysraSkge1xuICAgICAgICBvID0gbnVtZXJpYy5tYXRoZnVuc1tpXTtcbiAgICAgICAgZGVsZXRlIG51bWVyaWMub3BzMVtvXTtcbiAgICB9XG4gICAgZm9yKGkgaW4gbnVtZXJpYy5tYXByZWR1Y2Vycykge1xuICAgICAgICBpZihudW1lcmljLm1hcHJlZHVjZXJzLmhhc093blByb3BlcnR5KGkpKSB7XG4gICAgICAgICAgICBvID0gbnVtZXJpYy5tYXByZWR1Y2Vyc1tpXTtcbiAgICAgICAgICAgIG51bWVyaWNbaSsnViddID0gbnVtZXJpYy5tYXByZWR1Y2UyKG9bMF0sb1sxXSk7XG4gICAgICAgICAgICBudW1lcmljW2ldID0gRnVuY3Rpb24oJ3gnLCdzJywnaycsXG4gICAgICAgICAgICAgICAgICAgIG9bMV0rXG4gICAgICAgICAgICAgICAgICAgICdpZih0eXBlb2YgeCAhPT0gXCJvYmplY3RcIikgeycrXG4gICAgICAgICAgICAgICAgICAgICcgICAgeGkgPSB4O1xcbicrXG4gICAgICAgICAgICAgICAgICAgIG9bMF0rJztcXG4nK1xuICAgICAgICAgICAgICAgICAgICAnICAgIHJldHVybiBhY2N1bTtcXG4nK1xuICAgICAgICAgICAgICAgICAgICAnfScrXG4gICAgICAgICAgICAgICAgICAgICdpZih0eXBlb2YgcyA9PT0gXCJ1bmRlZmluZWRcIikgcyA9IG51bWVyaWMuZGltKHgpO1xcbicrXG4gICAgICAgICAgICAgICAgICAgICdpZih0eXBlb2YgayA9PT0gXCJ1bmRlZmluZWRcIikgayA9IDA7XFxuJytcbiAgICAgICAgICAgICAgICAgICAgJ2lmKGsgPT09IHMubGVuZ3RoLTEpIHJldHVybiBudW1lcmljLicraSsnVih4KTtcXG4nK1xuICAgICAgICAgICAgICAgICAgICAndmFyIHhpO1xcbicrXG4gICAgICAgICAgICAgICAgICAgICd2YXIgbiA9IHgubGVuZ3RoLCBpO1xcbicrXG4gICAgICAgICAgICAgICAgICAgICdmb3IoaT1uLTE7aSE9PS0xOy0taSkge1xcbicrXG4gICAgICAgICAgICAgICAgICAgICcgICB4aSA9IGFyZ3VtZW50cy5jYWxsZWUoeFtpXSk7XFxuJytcbiAgICAgICAgICAgICAgICAgICAgb1swXSsnO1xcbicrXG4gICAgICAgICAgICAgICAgICAgICd9XFxuJytcbiAgICAgICAgICAgICAgICAgICAgJ3JldHVybiBhY2N1bTtcXG4nKTtcbiAgICAgICAgfVxuICAgIH1cbn0oKSk7XG5cbm51bWVyaWMudHJ1bmNWViA9IG51bWVyaWMucG9pbnR3aXNlKFsneFtpXScsJ3lbaV0nXSwncmV0W2ldID0gcm91bmQoeFtpXS95W2ldKSp5W2ldOycsJ3ZhciByb3VuZCA9IE1hdGgucm91bmQ7Jyk7XG5udW1lcmljLnRydW5jVlMgPSBudW1lcmljLnBvaW50d2lzZShbJ3hbaV0nLCd5J10sJ3JldFtpXSA9IHJvdW5kKHhbaV0veSkqeTsnLCd2YXIgcm91bmQgPSBNYXRoLnJvdW5kOycpO1xubnVtZXJpYy50cnVuY1NWID0gbnVtZXJpYy5wb2ludHdpc2UoWyd4JywneVtpXSddLCdyZXRbaV0gPSByb3VuZCh4L3lbaV0pKnlbaV07JywndmFyIHJvdW5kID0gTWF0aC5yb3VuZDsnKTtcbm51bWVyaWMudHJ1bmMgPSBmdW5jdGlvbiB0cnVuYyh4LHkpIHtcbiAgICBpZih0eXBlb2YgeCA9PT0gXCJvYmplY3RcIikge1xuICAgICAgICBpZih0eXBlb2YgeSA9PT0gXCJvYmplY3RcIikgcmV0dXJuIG51bWVyaWMudHJ1bmNWVih4LHkpO1xuICAgICAgICByZXR1cm4gbnVtZXJpYy50cnVuY1ZTKHgseSk7XG4gICAgfVxuICAgIGlmICh0eXBlb2YgeSA9PT0gXCJvYmplY3RcIikgcmV0dXJuIG51bWVyaWMudHJ1bmNTVih4LHkpO1xuICAgIHJldHVybiBNYXRoLnJvdW5kKHgveSkqeTtcbn1cblxubnVtZXJpYy5pbnYgPSBmdW5jdGlvbiBpbnYoeCkge1xuICAgIHZhciBzID0gbnVtZXJpYy5kaW0oeCksIGFicyA9IE1hdGguYWJzLCBtID0gc1swXSwgbiA9IHNbMV07XG4gICAgdmFyIEEgPSBudW1lcmljLmNsb25lKHgpLCBBaSwgQWo7XG4gICAgdmFyIEkgPSBudW1lcmljLmlkZW50aXR5KG0pLCBJaSwgSWo7XG4gICAgdmFyIGksaixrLHg7XG4gICAgZm9yKGo9MDtqPG47KytqKSB7XG4gICAgICAgIHZhciBpMCA9IC0xO1xuICAgICAgICB2YXIgdjAgPSAtMTtcbiAgICAgICAgZm9yKGk9ajtpIT09bTsrK2kpIHsgayA9IGFicyhBW2ldW2pdKTsgaWYoaz52MCkgeyBpMCA9IGk7IHYwID0gazsgfSB9XG4gICAgICAgIEFqID0gQVtpMF07IEFbaTBdID0gQVtqXTsgQVtqXSA9IEFqO1xuICAgICAgICBJaiA9IElbaTBdOyBJW2kwXSA9IElbal07IElbal0gPSBJajtcbiAgICAgICAgeCA9IEFqW2pdO1xuICAgICAgICBmb3Ioaz1qO2shPT1uOysraykgICAgQWpba10gLz0geDsgXG4gICAgICAgIGZvcihrPW4tMTtrIT09LTE7LS1rKSBJaltrXSAvPSB4O1xuICAgICAgICBmb3IoaT1tLTE7aSE9PS0xOy0taSkge1xuICAgICAgICAgICAgaWYoaSE9PWopIHtcbiAgICAgICAgICAgICAgICBBaSA9IEFbaV07XG4gICAgICAgICAgICAgICAgSWkgPSBJW2ldO1xuICAgICAgICAgICAgICAgIHggPSBBaVtqXTtcbiAgICAgICAgICAgICAgICBmb3Ioaz1qKzE7ayE9PW47KytrKSAgQWlba10gLT0gQWpba10qeDtcbiAgICAgICAgICAgICAgICBmb3Ioaz1uLTE7az4wOy0taykgeyBJaVtrXSAtPSBJaltrXSp4OyAtLWs7IElpW2tdIC09IElqW2tdKng7IH1cbiAgICAgICAgICAgICAgICBpZihrPT09MCkgSWlbMF0gLT0gSWpbMF0qeDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gSTtcbn1cblxubnVtZXJpYy5kZXQgPSBmdW5jdGlvbiBkZXQoeCkge1xuICAgIHZhciBzID0gbnVtZXJpYy5kaW0oeCk7XG4gICAgaWYocy5sZW5ndGggIT09IDIgfHwgc1swXSAhPT0gc1sxXSkgeyB0aHJvdyBuZXcgRXJyb3IoJ251bWVyaWM6IGRldCgpIG9ubHkgd29ya3Mgb24gc3F1YXJlIG1hdHJpY2VzJyk7IH1cbiAgICB2YXIgbiA9IHNbMF0sIHJldCA9IDEsaSxqLGssQSA9IG51bWVyaWMuY2xvbmUoeCksQWosQWksYWxwaGEsdGVtcCxrMSxrMixrMztcbiAgICBmb3Ioaj0wO2o8bi0xO2orKykge1xuICAgICAgICBrPWo7XG4gICAgICAgIGZvcihpPWorMTtpPG47aSsrKSB7IGlmKE1hdGguYWJzKEFbaV1bal0pID4gTWF0aC5hYnMoQVtrXVtqXSkpIHsgayA9IGk7IH0gfVxuICAgICAgICBpZihrICE9PSBqKSB7XG4gICAgICAgICAgICB0ZW1wID0gQVtrXTsgQVtrXSA9IEFbal07IEFbal0gPSB0ZW1wO1xuICAgICAgICAgICAgcmV0ICo9IC0xO1xuICAgICAgICB9XG4gICAgICAgIEFqID0gQVtqXTtcbiAgICAgICAgZm9yKGk9aisxO2k8bjtpKyspIHtcbiAgICAgICAgICAgIEFpID0gQVtpXTtcbiAgICAgICAgICAgIGFscGhhID0gQWlbal0vQWpbal07XG4gICAgICAgICAgICBmb3Ioaz1qKzE7azxuLTE7ays9Mikge1xuICAgICAgICAgICAgICAgIGsxID0gaysxO1xuICAgICAgICAgICAgICAgIEFpW2tdIC09IEFqW2tdKmFscGhhO1xuICAgICAgICAgICAgICAgIEFpW2sxXSAtPSBBaltrMV0qYWxwaGE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZihrIT09bikgeyBBaVtrXSAtPSBBaltrXSphbHBoYTsgfVxuICAgICAgICB9XG4gICAgICAgIGlmKEFqW2pdID09PSAwKSB7IHJldHVybiAwOyB9XG4gICAgICAgIHJldCAqPSBBaltqXTtcbiAgICB9XG4gICAgcmV0dXJuIHJldCpBW2pdW2pdO1xufVxuXG5udW1lcmljLnRyYW5zcG9zZSA9IGZ1bmN0aW9uIHRyYW5zcG9zZSh4KSB7XG4gICAgdmFyIGksaixtID0geC5sZW5ndGgsbiA9IHhbMF0ubGVuZ3RoLCByZXQ9QXJyYXkobiksQTAsQTEsQmo7XG4gICAgZm9yKGo9MDtqPG47aisrKSByZXRbal0gPSBBcnJheShtKTtcbiAgICBmb3IoaT1tLTE7aT49MTtpLT0yKSB7XG4gICAgICAgIEExID0geFtpXTtcbiAgICAgICAgQTAgPSB4W2ktMV07XG4gICAgICAgIGZvcihqPW4tMTtqPj0xOy0taikge1xuICAgICAgICAgICAgQmogPSByZXRbal07IEJqW2ldID0gQTFbal07IEJqW2ktMV0gPSBBMFtqXTtcbiAgICAgICAgICAgIC0tajtcbiAgICAgICAgICAgIEJqID0gcmV0W2pdOyBCaltpXSA9IEExW2pdOyBCaltpLTFdID0gQTBbal07XG4gICAgICAgIH1cbiAgICAgICAgaWYoaj09PTApIHtcbiAgICAgICAgICAgIEJqID0gcmV0WzBdOyBCaltpXSA9IEExWzBdOyBCaltpLTFdID0gQTBbMF07XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYoaT09PTApIHtcbiAgICAgICAgQTAgPSB4WzBdO1xuICAgICAgICBmb3Ioaj1uLTE7aj49MTstLWopIHtcbiAgICAgICAgICAgIHJldFtqXVswXSA9IEEwW2pdO1xuICAgICAgICAgICAgLS1qO1xuICAgICAgICAgICAgcmV0W2pdWzBdID0gQTBbal07XG4gICAgICAgIH1cbiAgICAgICAgaWYoaj09PTApIHsgcmV0WzBdWzBdID0gQTBbMF07IH1cbiAgICB9XG4gICAgcmV0dXJuIHJldDtcbn1cbm51bWVyaWMubmVndHJhbnNwb3NlID0gZnVuY3Rpb24gbmVndHJhbnNwb3NlKHgpIHtcbiAgICB2YXIgaSxqLG0gPSB4Lmxlbmd0aCxuID0geFswXS5sZW5ndGgsIHJldD1BcnJheShuKSxBMCxBMSxCajtcbiAgICBmb3Ioaj0wO2o8bjtqKyspIHJldFtqXSA9IEFycmF5KG0pO1xuICAgIGZvcihpPW0tMTtpPj0xO2ktPTIpIHtcbiAgICAgICAgQTEgPSB4W2ldO1xuICAgICAgICBBMCA9IHhbaS0xXTtcbiAgICAgICAgZm9yKGo9bi0xO2o+PTE7LS1qKSB7XG4gICAgICAgICAgICBCaiA9IHJldFtqXTsgQmpbaV0gPSAtQTFbal07IEJqW2ktMV0gPSAtQTBbal07XG4gICAgICAgICAgICAtLWo7XG4gICAgICAgICAgICBCaiA9IHJldFtqXTsgQmpbaV0gPSAtQTFbal07IEJqW2ktMV0gPSAtQTBbal07XG4gICAgICAgIH1cbiAgICAgICAgaWYoaj09PTApIHtcbiAgICAgICAgICAgIEJqID0gcmV0WzBdOyBCaltpXSA9IC1BMVswXTsgQmpbaS0xXSA9IC1BMFswXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZihpPT09MCkge1xuICAgICAgICBBMCA9IHhbMF07XG4gICAgICAgIGZvcihqPW4tMTtqPj0xOy0taikge1xuICAgICAgICAgICAgcmV0W2pdWzBdID0gLUEwW2pdO1xuICAgICAgICAgICAgLS1qO1xuICAgICAgICAgICAgcmV0W2pdWzBdID0gLUEwW2pdO1xuICAgICAgICB9XG4gICAgICAgIGlmKGo9PT0wKSB7IHJldFswXVswXSA9IC1BMFswXTsgfVxuICAgIH1cbiAgICByZXR1cm4gcmV0O1xufVxuXG5udW1lcmljLl9yYW5kb20gPSBmdW5jdGlvbiBfcmFuZG9tKHMsaykge1xuICAgIHZhciBpLG49c1trXSxyZXQ9QXJyYXkobiksIHJuZDtcbiAgICBpZihrID09PSBzLmxlbmd0aC0xKSB7XG4gICAgICAgIHJuZCA9IE1hdGgucmFuZG9tO1xuICAgICAgICBmb3IoaT1uLTE7aT49MTtpLT0yKSB7XG4gICAgICAgICAgICByZXRbaV0gPSBybmQoKTtcbiAgICAgICAgICAgIHJldFtpLTFdID0gcm5kKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYoaT09PTApIHsgcmV0WzBdID0gcm5kKCk7IH1cbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9XG4gICAgZm9yKGk9bi0xO2k+PTA7aS0tKSByZXRbaV0gPSBfcmFuZG9tKHMsaysxKTtcbiAgICByZXR1cm4gcmV0O1xufVxubnVtZXJpYy5yYW5kb20gPSBmdW5jdGlvbiByYW5kb20ocykgeyByZXR1cm4gbnVtZXJpYy5fcmFuZG9tKHMsMCk7IH1cblxubnVtZXJpYy5ub3JtMiA9IGZ1bmN0aW9uIG5vcm0yKHgpIHsgcmV0dXJuIE1hdGguc3FydChudW1lcmljLm5vcm0yU3F1YXJlZCh4KSk7IH1cblxubnVtZXJpYy5saW5zcGFjZSA9IGZ1bmN0aW9uIGxpbnNwYWNlKGEsYixuKSB7XG4gICAgaWYodHlwZW9mIG4gPT09IFwidW5kZWZpbmVkXCIpIG4gPSBNYXRoLm1heChNYXRoLnJvdW5kKGItYSkrMSwxKTtcbiAgICBpZihuPDIpIHsgcmV0dXJuIG49PT0xP1thXTpbXTsgfVxuICAgIHZhciBpLHJldCA9IEFycmF5KG4pO1xuICAgIG4tLTtcbiAgICBmb3IoaT1uO2k+PTA7aS0tKSB7IHJldFtpXSA9IChpKmIrKG4taSkqYSkvbjsgfVxuICAgIHJldHVybiByZXQ7XG59XG5cbm51bWVyaWMuZ2V0QmxvY2sgPSBmdW5jdGlvbiBnZXRCbG9jayh4LGZyb20sdG8pIHtcbiAgICB2YXIgcyA9IG51bWVyaWMuZGltKHgpO1xuICAgIGZ1bmN0aW9uIGZvbyh4LGspIHtcbiAgICAgICAgdmFyIGksYSA9IGZyb21ba10sIG4gPSB0b1trXS1hLCByZXQgPSBBcnJheShuKTtcbiAgICAgICAgaWYoayA9PT0gcy5sZW5ndGgtMSkge1xuICAgICAgICAgICAgZm9yKGk9bjtpPj0wO2ktLSkgeyByZXRbaV0gPSB4W2krYV07IH1cbiAgICAgICAgICAgIHJldHVybiByZXQ7XG4gICAgICAgIH1cbiAgICAgICAgZm9yKGk9bjtpPj0wO2ktLSkgeyByZXRbaV0gPSBmb28oeFtpK2FdLGsrMSk7IH1cbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9XG4gICAgcmV0dXJuIGZvbyh4LDApO1xufVxuXG5udW1lcmljLnNldEJsb2NrID0gZnVuY3Rpb24gc2V0QmxvY2soeCxmcm9tLHRvLEIpIHtcbiAgICB2YXIgcyA9IG51bWVyaWMuZGltKHgpO1xuICAgIGZ1bmN0aW9uIGZvbyh4LHksaykge1xuICAgICAgICB2YXIgaSxhID0gZnJvbVtrXSwgbiA9IHRvW2tdLWE7XG4gICAgICAgIGlmKGsgPT09IHMubGVuZ3RoLTEpIHsgZm9yKGk9bjtpPj0wO2ktLSkgeyB4W2krYV0gPSB5W2ldOyB9IH1cbiAgICAgICAgZm9yKGk9bjtpPj0wO2ktLSkgeyBmb28oeFtpK2FdLHlbaV0saysxKTsgfVxuICAgIH1cbiAgICBmb28oeCxCLDApO1xuICAgIHJldHVybiB4O1xufVxuXG5udW1lcmljLmdldFJhbmdlID0gZnVuY3Rpb24gZ2V0UmFuZ2UoQSxJLEopIHtcbiAgICB2YXIgbSA9IEkubGVuZ3RoLCBuID0gSi5sZW5ndGg7XG4gICAgdmFyIGksajtcbiAgICB2YXIgQiA9IEFycmF5KG0pLCBCaSwgQUk7XG4gICAgZm9yKGk9bS0xO2khPT0tMTstLWkpIHtcbiAgICAgICAgQltpXSA9IEFycmF5KG4pO1xuICAgICAgICBCaSA9IEJbaV07XG4gICAgICAgIEFJID0gQVtJW2ldXTtcbiAgICAgICAgZm9yKGo9bi0xO2ohPT0tMTstLWopIEJpW2pdID0gQUlbSltqXV07XG4gICAgfVxuICAgIHJldHVybiBCO1xufVxuXG5udW1lcmljLmJsb2NrTWF0cml4ID0gZnVuY3Rpb24gYmxvY2tNYXRyaXgoWCkge1xuICAgIHZhciBzID0gbnVtZXJpYy5kaW0oWCk7XG4gICAgaWYocy5sZW5ndGg8NCkgcmV0dXJuIG51bWVyaWMuYmxvY2tNYXRyaXgoW1hdKTtcbiAgICB2YXIgbT1zWzBdLG49c1sxXSxNLE4saSxqLFhpajtcbiAgICBNID0gMDsgTiA9IDA7XG4gICAgZm9yKGk9MDtpPG07KytpKSBNKz1YW2ldWzBdLmxlbmd0aDtcbiAgICBmb3Ioaj0wO2o8bjsrK2opIE4rPVhbMF1bal1bMF0ubGVuZ3RoO1xuICAgIHZhciBaID0gQXJyYXkoTSk7XG4gICAgZm9yKGk9MDtpPE07KytpKSBaW2ldID0gQXJyYXkoTik7XG4gICAgdmFyIEk9MCxKLFpJLGssbCxYaWprO1xuICAgIGZvcihpPTA7aTxtOysraSkge1xuICAgICAgICBKPU47XG4gICAgICAgIGZvcihqPW4tMTtqIT09LTE7LS1qKSB7XG4gICAgICAgICAgICBYaWogPSBYW2ldW2pdO1xuICAgICAgICAgICAgSiAtPSBYaWpbMF0ubGVuZ3RoO1xuICAgICAgICAgICAgZm9yKGs9WGlqLmxlbmd0aC0xO2shPT0tMTstLWspIHtcbiAgICAgICAgICAgICAgICBYaWprID0gWGlqW2tdO1xuICAgICAgICAgICAgICAgIFpJID0gWltJK2tdO1xuICAgICAgICAgICAgICAgIGZvcihsID0gWGlqay5sZW5ndGgtMTtsIT09LTE7LS1sKSBaSVtKK2xdID0gWGlqa1tsXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBJICs9IFhbaV1bMF0ubGVuZ3RoO1xuICAgIH1cbiAgICByZXR1cm4gWjtcbn1cblxubnVtZXJpYy50ZW5zb3IgPSBmdW5jdGlvbiB0ZW5zb3IoeCx5KSB7XG4gICAgaWYodHlwZW9mIHggPT09IFwibnVtYmVyXCIgfHwgdHlwZW9mIHkgPT09IFwibnVtYmVyXCIpIHJldHVybiBudW1lcmljLm11bCh4LHkpO1xuICAgIHZhciBzMSA9IG51bWVyaWMuZGltKHgpLCBzMiA9IG51bWVyaWMuZGltKHkpO1xuICAgIGlmKHMxLmxlbmd0aCAhPT0gMSB8fCBzMi5sZW5ndGggIT09IDEpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdudW1lcmljOiB0ZW5zb3IgcHJvZHVjdCBpcyBvbmx5IGRlZmluZWQgZm9yIHZlY3RvcnMnKTtcbiAgICB9XG4gICAgdmFyIG0gPSBzMVswXSwgbiA9IHMyWzBdLCBBID0gQXJyYXkobSksIEFpLCBpLGoseGk7XG4gICAgZm9yKGk9bS0xO2k+PTA7aS0tKSB7XG4gICAgICAgIEFpID0gQXJyYXkobik7XG4gICAgICAgIHhpID0geFtpXTtcbiAgICAgICAgZm9yKGo9bi0xO2o+PTM7LS1qKSB7XG4gICAgICAgICAgICBBaVtqXSA9IHhpICogeVtqXTtcbiAgICAgICAgICAgIC0tajtcbiAgICAgICAgICAgIEFpW2pdID0geGkgKiB5W2pdO1xuICAgICAgICAgICAgLS1qO1xuICAgICAgICAgICAgQWlbal0gPSB4aSAqIHlbal07XG4gICAgICAgICAgICAtLWo7XG4gICAgICAgICAgICBBaVtqXSA9IHhpICogeVtqXTtcbiAgICAgICAgfVxuICAgICAgICB3aGlsZShqPj0wKSB7IEFpW2pdID0geGkgKiB5W2pdOyAtLWo7IH1cbiAgICAgICAgQVtpXSA9IEFpO1xuICAgIH1cbiAgICByZXR1cm4gQTtcbn1cblxuLy8gMy4gVGhlIFRlbnNvciB0eXBlIFRcbm51bWVyaWMuVCA9IGZ1bmN0aW9uIFQoeCx5KSB7IHRoaXMueCA9IHg7IHRoaXMueSA9IHk7IH1cbm51bWVyaWMudCA9IGZ1bmN0aW9uIHQoeCx5KSB7IHJldHVybiBuZXcgbnVtZXJpYy5UKHgseSk7IH1cblxubnVtZXJpYy5UYmlub3AgPSBmdW5jdGlvbiBUYmlub3AocnIscmMsY3IsY2Msc2V0dXApIHtcbiAgICB2YXIgaW8gPSBudW1lcmljLmluZGV4T2Y7XG4gICAgaWYodHlwZW9mIHNldHVwICE9PSBcInN0cmluZ1wiKSB7XG4gICAgICAgIHZhciBrO1xuICAgICAgICBzZXR1cCA9ICcnO1xuICAgICAgICBmb3IoayBpbiBudW1lcmljKSB7XG4gICAgICAgICAgICBpZihudW1lcmljLmhhc093blByb3BlcnR5KGspICYmIChyci5pbmRleE9mKGspPj0wIHx8IHJjLmluZGV4T2Yoayk+PTAgfHwgY3IuaW5kZXhPZihrKT49MCB8fCBjYy5pbmRleE9mKGspPj0wKSAmJiBrLmxlbmd0aD4xKSB7XG4gICAgICAgICAgICAgICAgc2V0dXAgKz0gJ3ZhciAnK2srJyA9IG51bWVyaWMuJytrKyc7XFxuJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gRnVuY3Rpb24oWyd5J10sXG4gICAgICAgICAgICAndmFyIHggPSB0aGlzO1xcbicrXG4gICAgICAgICAgICAnaWYoISh5IGluc3RhbmNlb2YgbnVtZXJpYy5UKSkgeyB5ID0gbmV3IG51bWVyaWMuVCh5KTsgfVxcbicrXG4gICAgICAgICAgICBzZXR1cCsnXFxuJytcbiAgICAgICAgICAgICdpZih4LnkpIHsnK1xuICAgICAgICAgICAgJyAgaWYoeS55KSB7JytcbiAgICAgICAgICAgICcgICAgcmV0dXJuIG5ldyBudW1lcmljLlQoJytjYysnKTtcXG4nK1xuICAgICAgICAgICAgJyAgfVxcbicrXG4gICAgICAgICAgICAnICByZXR1cm4gbmV3IG51bWVyaWMuVCgnK2NyKycpO1xcbicrXG4gICAgICAgICAgICAnfVxcbicrXG4gICAgICAgICAgICAnaWYoeS55KSB7XFxuJytcbiAgICAgICAgICAgICcgIHJldHVybiBuZXcgbnVtZXJpYy5UKCcrcmMrJyk7XFxuJytcbiAgICAgICAgICAgICd9XFxuJytcbiAgICAgICAgICAgICdyZXR1cm4gbmV3IG51bWVyaWMuVCgnK3JyKycpO1xcbidcbiAgICApO1xufVxuXG5udW1lcmljLlQucHJvdG90eXBlLmFkZCA9IG51bWVyaWMuVGJpbm9wKFxuICAgICAgICAnYWRkKHgueCx5LngpJyxcbiAgICAgICAgJ2FkZCh4LngseS54KSx5LnknLFxuICAgICAgICAnYWRkKHgueCx5LngpLHgueScsXG4gICAgICAgICdhZGQoeC54LHkueCksYWRkKHgueSx5LnkpJyk7XG5udW1lcmljLlQucHJvdG90eXBlLnN1YiA9IG51bWVyaWMuVGJpbm9wKFxuICAgICAgICAnc3ViKHgueCx5LngpJyxcbiAgICAgICAgJ3N1Yih4LngseS54KSxuZWcoeS55KScsXG4gICAgICAgICdzdWIoeC54LHkueCkseC55JyxcbiAgICAgICAgJ3N1Yih4LngseS54KSxzdWIoeC55LHkueSknKTtcbm51bWVyaWMuVC5wcm90b3R5cGUubXVsID0gbnVtZXJpYy5UYmlub3AoXG4gICAgICAgICdtdWwoeC54LHkueCknLFxuICAgICAgICAnbXVsKHgueCx5LngpLG11bCh4LngseS55KScsXG4gICAgICAgICdtdWwoeC54LHkueCksbXVsKHgueSx5LngpJyxcbiAgICAgICAgJ3N1YihtdWwoeC54LHkueCksbXVsKHgueSx5LnkpKSxhZGQobXVsKHgueCx5LnkpLG11bCh4LnkseS54KSknKTtcblxubnVtZXJpYy5ULnByb3RvdHlwZS5yZWNpcHJvY2FsID0gZnVuY3Rpb24gcmVjaXByb2NhbCgpIHtcbiAgICB2YXIgbXVsID0gbnVtZXJpYy5tdWwsIGRpdiA9IG51bWVyaWMuZGl2O1xuICAgIGlmKHRoaXMueSkge1xuICAgICAgICB2YXIgZCA9IG51bWVyaWMuYWRkKG11bCh0aGlzLngsdGhpcy54KSxtdWwodGhpcy55LHRoaXMueSkpO1xuICAgICAgICByZXR1cm4gbmV3IG51bWVyaWMuVChkaXYodGhpcy54LGQpLGRpdihudW1lcmljLm5lZyh0aGlzLnkpLGQpKTtcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBUKGRpdigxLHRoaXMueCkpO1xufVxubnVtZXJpYy5ULnByb3RvdHlwZS5kaXYgPSBmdW5jdGlvbiBkaXYoeSkge1xuICAgIGlmKCEoeSBpbnN0YW5jZW9mIG51bWVyaWMuVCkpIHkgPSBuZXcgbnVtZXJpYy5UKHkpO1xuICAgIGlmKHkueSkgeyByZXR1cm4gdGhpcy5tdWwoeS5yZWNpcHJvY2FsKCkpOyB9XG4gICAgdmFyIGRpdiA9IG51bWVyaWMuZGl2O1xuICAgIGlmKHRoaXMueSkgeyByZXR1cm4gbmV3IG51bWVyaWMuVChkaXYodGhpcy54LHkueCksZGl2KHRoaXMueSx5LngpKTsgfVxuICAgIHJldHVybiBuZXcgbnVtZXJpYy5UKGRpdih0aGlzLngseS54KSk7XG59XG5udW1lcmljLlQucHJvdG90eXBlLmRvdCA9IG51bWVyaWMuVGJpbm9wKFxuICAgICAgICAnZG90KHgueCx5LngpJyxcbiAgICAgICAgJ2RvdCh4LngseS54KSxkb3QoeC54LHkueSknLFxuICAgICAgICAnZG90KHgueCx5LngpLGRvdCh4LnkseS54KScsXG4gICAgICAgICdzdWIoZG90KHgueCx5LngpLGRvdCh4LnkseS55KSksYWRkKGRvdCh4LngseS55KSxkb3QoeC55LHkueCkpJ1xuICAgICAgICApO1xubnVtZXJpYy5ULnByb3RvdHlwZS50cmFuc3Bvc2UgPSBmdW5jdGlvbiB0cmFuc3Bvc2UoKSB7XG4gICAgdmFyIHQgPSBudW1lcmljLnRyYW5zcG9zZSwgeCA9IHRoaXMueCwgeSA9IHRoaXMueTtcbiAgICBpZih5KSB7IHJldHVybiBuZXcgbnVtZXJpYy5UKHQoeCksdCh5KSk7IH1cbiAgICByZXR1cm4gbmV3IG51bWVyaWMuVCh0KHgpKTtcbn1cbm51bWVyaWMuVC5wcm90b3R5cGUudHJhbnNqdWdhdGUgPSBmdW5jdGlvbiB0cmFuc2p1Z2F0ZSgpIHtcbiAgICB2YXIgdCA9IG51bWVyaWMudHJhbnNwb3NlLCB4ID0gdGhpcy54LCB5ID0gdGhpcy55O1xuICAgIGlmKHkpIHsgcmV0dXJuIG5ldyBudW1lcmljLlQodCh4KSxudW1lcmljLm5lZ3RyYW5zcG9zZSh5KSk7IH1cbiAgICByZXR1cm4gbmV3IG51bWVyaWMuVCh0KHgpKTtcbn1cbm51bWVyaWMuVHVub3AgPSBmdW5jdGlvbiBUdW5vcChyLGMscykge1xuICAgIGlmKHR5cGVvZiBzICE9PSBcInN0cmluZ1wiKSB7IHMgPSAnJzsgfVxuICAgIHJldHVybiBGdW5jdGlvbihcbiAgICAgICAgICAgICd2YXIgeCA9IHRoaXM7XFxuJytcbiAgICAgICAgICAgIHMrJ1xcbicrXG4gICAgICAgICAgICAnaWYoeC55KSB7JytcbiAgICAgICAgICAgICcgICcrYysnO1xcbicrXG4gICAgICAgICAgICAnfVxcbicrXG4gICAgICAgICAgICByKyc7XFxuJ1xuICAgICk7XG59XG5cbm51bWVyaWMuVC5wcm90b3R5cGUuZXhwID0gbnVtZXJpYy5UdW5vcChcbiAgICAgICAgJ3JldHVybiBuZXcgbnVtZXJpYy5UKGV4KScsXG4gICAgICAgICdyZXR1cm4gbmV3IG51bWVyaWMuVChtdWwoY29zKHgueSksZXgpLG11bChzaW4oeC55KSxleCkpJyxcbiAgICAgICAgJ3ZhciBleCA9IG51bWVyaWMuZXhwKHgueCksIGNvcyA9IG51bWVyaWMuY29zLCBzaW4gPSBudW1lcmljLnNpbiwgbXVsID0gbnVtZXJpYy5tdWw7Jyk7XG5udW1lcmljLlQucHJvdG90eXBlLmNvbmogPSBudW1lcmljLlR1bm9wKFxuICAgICAgICAncmV0dXJuIG5ldyBudW1lcmljLlQoeC54KTsnLFxuICAgICAgICAncmV0dXJuIG5ldyBudW1lcmljLlQoeC54LG51bWVyaWMubmVnKHgueSkpOycpO1xubnVtZXJpYy5ULnByb3RvdHlwZS5uZWcgPSBudW1lcmljLlR1bm9wKFxuICAgICAgICAncmV0dXJuIG5ldyBudW1lcmljLlQobmVnKHgueCkpOycsXG4gICAgICAgICdyZXR1cm4gbmV3IG51bWVyaWMuVChuZWcoeC54KSxuZWcoeC55KSk7JyxcbiAgICAgICAgJ3ZhciBuZWcgPSBudW1lcmljLm5lZzsnKTtcbm51bWVyaWMuVC5wcm90b3R5cGUuc2luID0gbnVtZXJpYy5UdW5vcChcbiAgICAgICAgJ3JldHVybiBuZXcgbnVtZXJpYy5UKG51bWVyaWMuc2luKHgueCkpJyxcbiAgICAgICAgJ3JldHVybiB4LmV4cCgpLnN1Yih4Lm5lZygpLmV4cCgpKS5kaXYobmV3IG51bWVyaWMuVCgwLDIpKTsnKTtcbm51bWVyaWMuVC5wcm90b3R5cGUuY29zID0gbnVtZXJpYy5UdW5vcChcbiAgICAgICAgJ3JldHVybiBuZXcgbnVtZXJpYy5UKG51bWVyaWMuY29zKHgueCkpJyxcbiAgICAgICAgJ3JldHVybiB4LmV4cCgpLmFkZCh4Lm5lZygpLmV4cCgpKS5kaXYoMik7Jyk7XG5udW1lcmljLlQucHJvdG90eXBlLmFicyA9IG51bWVyaWMuVHVub3AoXG4gICAgICAgICdyZXR1cm4gbmV3IG51bWVyaWMuVChudW1lcmljLmFicyh4LngpKTsnLFxuICAgICAgICAncmV0dXJuIG5ldyBudW1lcmljLlQobnVtZXJpYy5zcXJ0KG51bWVyaWMuYWRkKG11bCh4LngseC54KSxtdWwoeC55LHgueSkpKSk7JyxcbiAgICAgICAgJ3ZhciBtdWwgPSBudW1lcmljLm11bDsnKTtcbm51bWVyaWMuVC5wcm90b3R5cGUubG9nID0gbnVtZXJpYy5UdW5vcChcbiAgICAgICAgJ3JldHVybiBuZXcgbnVtZXJpYy5UKG51bWVyaWMubG9nKHgueCkpOycsXG4gICAgICAgICd2YXIgdGhldGEgPSBuZXcgbnVtZXJpYy5UKG51bWVyaWMuYXRhbjIoeC55LHgueCkpLCByID0geC5hYnMoKTtcXG4nK1xuICAgICAgICAncmV0dXJuIG5ldyBudW1lcmljLlQobnVtZXJpYy5sb2coci54KSx0aGV0YS54KTsnKTtcbm51bWVyaWMuVC5wcm90b3R5cGUubm9ybTIgPSBudW1lcmljLlR1bm9wKFxuICAgICAgICAncmV0dXJuIG51bWVyaWMubm9ybTIoeC54KTsnLFxuICAgICAgICAndmFyIGYgPSBudW1lcmljLm5vcm0yU3F1YXJlZDtcXG4nK1xuICAgICAgICAncmV0dXJuIE1hdGguc3FydChmKHgueCkrZih4LnkpKTsnKTtcbm51bWVyaWMuVC5wcm90b3R5cGUuaW52ID0gZnVuY3Rpb24gaW52KCkge1xuICAgIHZhciBBID0gdGhpcztcbiAgICBpZih0eXBlb2YgQS55ID09PSBcInVuZGVmaW5lZFwiKSB7IHJldHVybiBuZXcgbnVtZXJpYy5UKG51bWVyaWMuaW52KEEueCkpOyB9XG4gICAgdmFyIG4gPSBBLngubGVuZ3RoLCBpLCBqLCBrO1xuICAgIHZhciBSeCA9IG51bWVyaWMuaWRlbnRpdHkobiksUnkgPSBudW1lcmljLnJlcChbbixuXSwwKTtcbiAgICB2YXIgQXggPSBudW1lcmljLmNsb25lKEEueCksIEF5ID0gbnVtZXJpYy5jbG9uZShBLnkpO1xuICAgIHZhciBBaXgsIEFpeSwgQWp4LCBBanksIFJpeCwgUml5LCBSangsIFJqeTtcbiAgICB2YXIgaSxqLGssZCxkMSxheCxheSxieCxieSx0ZW1wO1xuICAgIGZvcihpPTA7aTxuO2krKykge1xuICAgICAgICBheCA9IEF4W2ldW2ldOyBheSA9IEF5W2ldW2ldO1xuICAgICAgICBkID0gYXgqYXgrYXkqYXk7XG4gICAgICAgIGsgPSBpO1xuICAgICAgICBmb3Ioaj1pKzE7ajxuO2orKykge1xuICAgICAgICAgICAgYXggPSBBeFtqXVtpXTsgYXkgPSBBeVtqXVtpXTtcbiAgICAgICAgICAgIGQxID0gYXgqYXgrYXkqYXk7XG4gICAgICAgICAgICBpZihkMSA+IGQpIHsgaz1qOyBkID0gZDE7IH1cbiAgICAgICAgfVxuICAgICAgICBpZihrIT09aSkge1xuICAgICAgICAgICAgdGVtcCA9IEF4W2ldOyBBeFtpXSA9IEF4W2tdOyBBeFtrXSA9IHRlbXA7XG4gICAgICAgICAgICB0ZW1wID0gQXlbaV07IEF5W2ldID0gQXlba107IEF5W2tdID0gdGVtcDtcbiAgICAgICAgICAgIHRlbXAgPSBSeFtpXTsgUnhbaV0gPSBSeFtrXTsgUnhba10gPSB0ZW1wO1xuICAgICAgICAgICAgdGVtcCA9IFJ5W2ldOyBSeVtpXSA9IFJ5W2tdOyBSeVtrXSA9IHRlbXA7XG4gICAgICAgIH1cbiAgICAgICAgQWl4ID0gQXhbaV07IEFpeSA9IEF5W2ldO1xuICAgICAgICBSaXggPSBSeFtpXTsgUml5ID0gUnlbaV07XG4gICAgICAgIGF4ID0gQWl4W2ldOyBheSA9IEFpeVtpXTtcbiAgICAgICAgZm9yKGo9aSsxO2o8bjtqKyspIHtcbiAgICAgICAgICAgIGJ4ID0gQWl4W2pdOyBieSA9IEFpeVtqXTtcbiAgICAgICAgICAgIEFpeFtqXSA9IChieCpheCtieSpheSkvZDtcbiAgICAgICAgICAgIEFpeVtqXSA9IChieSpheC1ieCpheSkvZDtcbiAgICAgICAgfVxuICAgICAgICBmb3Ioaj0wO2o8bjtqKyspIHtcbiAgICAgICAgICAgIGJ4ID0gUml4W2pdOyBieSA9IFJpeVtqXTtcbiAgICAgICAgICAgIFJpeFtqXSA9IChieCpheCtieSpheSkvZDtcbiAgICAgICAgICAgIFJpeVtqXSA9IChieSpheC1ieCpheSkvZDtcbiAgICAgICAgfVxuICAgICAgICBmb3Ioaj1pKzE7ajxuO2orKykge1xuICAgICAgICAgICAgQWp4ID0gQXhbal07IEFqeSA9IEF5W2pdO1xuICAgICAgICAgICAgUmp4ID0gUnhbal07IFJqeSA9IFJ5W2pdO1xuICAgICAgICAgICAgYXggPSBBanhbaV07IGF5ID0gQWp5W2ldO1xuICAgICAgICAgICAgZm9yKGs9aSsxO2s8bjtrKyspIHtcbiAgICAgICAgICAgICAgICBieCA9IEFpeFtrXTsgYnkgPSBBaXlba107XG4gICAgICAgICAgICAgICAgQWp4W2tdIC09IGJ4KmF4LWJ5KmF5O1xuICAgICAgICAgICAgICAgIEFqeVtrXSAtPSBieSpheCtieCpheTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZvcihrPTA7azxuO2srKykge1xuICAgICAgICAgICAgICAgIGJ4ID0gUml4W2tdOyBieSA9IFJpeVtrXTtcbiAgICAgICAgICAgICAgICBSanhba10gLT0gYngqYXgtYnkqYXk7XG4gICAgICAgICAgICAgICAgUmp5W2tdIC09IGJ5KmF4K2J4KmF5O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGZvcihpPW4tMTtpPjA7aS0tKSB7XG4gICAgICAgIFJpeCA9IFJ4W2ldOyBSaXkgPSBSeVtpXTtcbiAgICAgICAgZm9yKGo9aS0xO2o+PTA7ai0tKSB7XG4gICAgICAgICAgICBSanggPSBSeFtqXTsgUmp5ID0gUnlbal07XG4gICAgICAgICAgICBheCA9IEF4W2pdW2ldOyBheSA9IEF5W2pdW2ldO1xuICAgICAgICAgICAgZm9yKGs9bi0xO2s+PTA7ay0tKSB7XG4gICAgICAgICAgICAgICAgYnggPSBSaXhba107IGJ5ID0gUml5W2tdO1xuICAgICAgICAgICAgICAgIFJqeFtrXSAtPSBheCpieCAtIGF5KmJ5O1xuICAgICAgICAgICAgICAgIFJqeVtrXSAtPSBheCpieSArIGF5KmJ4O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBuZXcgbnVtZXJpYy5UKFJ4LFJ5KTtcbn1cbm51bWVyaWMuVC5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24gZ2V0KGkpIHtcbiAgICB2YXIgeCA9IHRoaXMueCwgeSA9IHRoaXMueSwgayA9IDAsIGlrLCBuID0gaS5sZW5ndGg7XG4gICAgaWYoeSkge1xuICAgICAgICB3aGlsZShrPG4pIHtcbiAgICAgICAgICAgIGlrID0gaVtrXTtcbiAgICAgICAgICAgIHggPSB4W2lrXTtcbiAgICAgICAgICAgIHkgPSB5W2lrXTtcbiAgICAgICAgICAgIGsrKztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbmV3IG51bWVyaWMuVCh4LHkpO1xuICAgIH1cbiAgICB3aGlsZShrPG4pIHtcbiAgICAgICAgaWsgPSBpW2tdO1xuICAgICAgICB4ID0geFtpa107XG4gICAgICAgIGsrKztcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBudW1lcmljLlQoeCk7XG59XG5udW1lcmljLlQucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uIHNldChpLHYpIHtcbiAgICB2YXIgeCA9IHRoaXMueCwgeSA9IHRoaXMueSwgayA9IDAsIGlrLCBuID0gaS5sZW5ndGgsIHZ4ID0gdi54LCB2eSA9IHYueTtcbiAgICBpZihuPT09MCkge1xuICAgICAgICBpZih2eSkgeyB0aGlzLnkgPSB2eTsgfVxuICAgICAgICBlbHNlIGlmKHkpIHsgdGhpcy55ID0gdW5kZWZpbmVkOyB9XG4gICAgICAgIHRoaXMueCA9IHg7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBpZih2eSkge1xuICAgICAgICBpZih5KSB7IC8qIG9rICovIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB5ID0gbnVtZXJpYy5yZXAobnVtZXJpYy5kaW0oeCksMCk7XG4gICAgICAgICAgICB0aGlzLnkgPSB5O1xuICAgICAgICB9XG4gICAgICAgIHdoaWxlKGs8bi0xKSB7XG4gICAgICAgICAgICBpayA9IGlba107XG4gICAgICAgICAgICB4ID0geFtpa107XG4gICAgICAgICAgICB5ID0geVtpa107XG4gICAgICAgICAgICBrKys7XG4gICAgICAgIH1cbiAgICAgICAgaWsgPSBpW2tdO1xuICAgICAgICB4W2lrXSA9IHZ4O1xuICAgICAgICB5W2lrXSA9IHZ5O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgaWYoeSkge1xuICAgICAgICB3aGlsZShrPG4tMSkge1xuICAgICAgICAgICAgaWsgPSBpW2tdO1xuICAgICAgICAgICAgeCA9IHhbaWtdO1xuICAgICAgICAgICAgeSA9IHlbaWtdO1xuICAgICAgICAgICAgaysrO1xuICAgICAgICB9XG4gICAgICAgIGlrID0gaVtrXTtcbiAgICAgICAgeFtpa10gPSB2eDtcbiAgICAgICAgaWYodnggaW5zdGFuY2VvZiBBcnJheSkgeVtpa10gPSBudW1lcmljLnJlcChudW1lcmljLmRpbSh2eCksMCk7XG4gICAgICAgIGVsc2UgeVtpa10gPSAwO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgd2hpbGUoazxuLTEpIHtcbiAgICAgICAgaWsgPSBpW2tdO1xuICAgICAgICB4ID0geFtpa107XG4gICAgICAgIGsrKztcbiAgICB9XG4gICAgaWsgPSBpW2tdO1xuICAgIHhbaWtdID0gdng7XG4gICAgcmV0dXJuIHRoaXM7XG59XG5udW1lcmljLlQucHJvdG90eXBlLmdldFJvd3MgPSBmdW5jdGlvbiBnZXRSb3dzKGkwLGkxKSB7XG4gICAgdmFyIG4gPSBpMS1pMCsxLCBqO1xuICAgIHZhciByeCA9IEFycmF5KG4pLCByeSwgeCA9IHRoaXMueCwgeSA9IHRoaXMueTtcbiAgICBmb3Ioaj1pMDtqPD1pMTtqKyspIHsgcnhbai1pMF0gPSB4W2pdOyB9XG4gICAgaWYoeSkge1xuICAgICAgICByeSA9IEFycmF5KG4pO1xuICAgICAgICBmb3Ioaj1pMDtqPD1pMTtqKyspIHsgcnlbai1pMF0gPSB5W2pdOyB9XG4gICAgICAgIHJldHVybiBuZXcgbnVtZXJpYy5UKHJ4LHJ5KTtcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBudW1lcmljLlQocngpO1xufVxubnVtZXJpYy5ULnByb3RvdHlwZS5zZXRSb3dzID0gZnVuY3Rpb24gc2V0Um93cyhpMCxpMSxBKSB7XG4gICAgdmFyIGo7XG4gICAgdmFyIHJ4ID0gdGhpcy54LCByeSA9IHRoaXMueSwgeCA9IEEueCwgeSA9IEEueTtcbiAgICBmb3Ioaj1pMDtqPD1pMTtqKyspIHsgcnhbal0gPSB4W2otaTBdOyB9XG4gICAgaWYoeSkge1xuICAgICAgICBpZighcnkpIHsgcnkgPSBudW1lcmljLnJlcChudW1lcmljLmRpbShyeCksMCk7IHRoaXMueSA9IHJ5OyB9XG4gICAgICAgIGZvcihqPWkwO2o8PWkxO2orKykgeyByeVtqXSA9IHlbai1pMF07IH1cbiAgICB9IGVsc2UgaWYocnkpIHtcbiAgICAgICAgZm9yKGo9aTA7ajw9aTE7aisrKSB7IHJ5W2pdID0gbnVtZXJpYy5yZXAoW3hbai1pMF0ubGVuZ3RoXSwwKTsgfVxuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbn1cbm51bWVyaWMuVC5wcm90b3R5cGUuZ2V0Um93ID0gZnVuY3Rpb24gZ2V0Um93KGspIHtcbiAgICB2YXIgeCA9IHRoaXMueCwgeSA9IHRoaXMueTtcbiAgICBpZih5KSB7IHJldHVybiBuZXcgbnVtZXJpYy5UKHhba10seVtrXSk7IH1cbiAgICByZXR1cm4gbmV3IG51bWVyaWMuVCh4W2tdKTtcbn1cbm51bWVyaWMuVC5wcm90b3R5cGUuc2V0Um93ID0gZnVuY3Rpb24gc2V0Um93KGksdikge1xuICAgIHZhciByeCA9IHRoaXMueCwgcnkgPSB0aGlzLnksIHggPSB2LngsIHkgPSB2Lnk7XG4gICAgcnhbaV0gPSB4O1xuICAgIGlmKHkpIHtcbiAgICAgICAgaWYoIXJ5KSB7IHJ5ID0gbnVtZXJpYy5yZXAobnVtZXJpYy5kaW0ocngpLDApOyB0aGlzLnkgPSByeTsgfVxuICAgICAgICByeVtpXSA9IHk7XG4gICAgfSBlbHNlIGlmKHJ5KSB7XG4gICAgICAgIHJ5ID0gbnVtZXJpYy5yZXAoW3gubGVuZ3RoXSwwKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG59XG5cbm51bWVyaWMuVC5wcm90b3R5cGUuZ2V0QmxvY2sgPSBmdW5jdGlvbiBnZXRCbG9jayhmcm9tLHRvKSB7XG4gICAgdmFyIHggPSB0aGlzLngsIHkgPSB0aGlzLnksIGIgPSBudW1lcmljLmdldEJsb2NrO1xuICAgIGlmKHkpIHsgcmV0dXJuIG5ldyBudW1lcmljLlQoYih4LGZyb20sdG8pLGIoeSxmcm9tLHRvKSk7IH1cbiAgICByZXR1cm4gbmV3IG51bWVyaWMuVChiKHgsZnJvbSx0bykpO1xufVxubnVtZXJpYy5ULnByb3RvdHlwZS5zZXRCbG9jayA9IGZ1bmN0aW9uIHNldEJsb2NrKGZyb20sdG8sQSkge1xuICAgIGlmKCEoQSBpbnN0YW5jZW9mIG51bWVyaWMuVCkpIEEgPSBuZXcgbnVtZXJpYy5UKEEpO1xuICAgIHZhciB4ID0gdGhpcy54LCB5ID0gdGhpcy55LCBiID0gbnVtZXJpYy5zZXRCbG9jaywgQXggPSBBLngsIEF5ID0gQS55O1xuICAgIGlmKEF5KSB7XG4gICAgICAgIGlmKCF5KSB7IHRoaXMueSA9IG51bWVyaWMucmVwKG51bWVyaWMuZGltKHRoaXMpLDApOyB5ID0gdGhpcy55OyB9XG4gICAgICAgIGIoeCxmcm9tLHRvLEF4KTtcbiAgICAgICAgYih5LGZyb20sdG8sQXkpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgYih4LGZyb20sdG8sQXgpO1xuICAgIGlmKHkpIGIoeSxmcm9tLHRvLG51bWVyaWMucmVwKG51bWVyaWMuZGltKEF4KSwwKSk7XG59XG5udW1lcmljLlQucmVwID0gZnVuY3Rpb24gcmVwKHMsdikge1xuICAgIHZhciBUID0gbnVtZXJpYy5UO1xuICAgIGlmKCEodiBpbnN0YW5jZW9mIFQpKSB2ID0gbmV3IFQodik7XG4gICAgdmFyIHggPSB2LngsIHkgPSB2LnksIHIgPSBudW1lcmljLnJlcDtcbiAgICBpZih5KSByZXR1cm4gbmV3IFQocihzLHgpLHIocyx5KSk7XG4gICAgcmV0dXJuIG5ldyBUKHIocyx4KSk7XG59XG5udW1lcmljLlQuZGlhZyA9IGZ1bmN0aW9uIGRpYWcoZCkge1xuICAgIGlmKCEoZCBpbnN0YW5jZW9mIG51bWVyaWMuVCkpIGQgPSBuZXcgbnVtZXJpYy5UKGQpO1xuICAgIHZhciB4ID0gZC54LCB5ID0gZC55LCBkaWFnID0gbnVtZXJpYy5kaWFnO1xuICAgIGlmKHkpIHJldHVybiBuZXcgbnVtZXJpYy5UKGRpYWcoeCksZGlhZyh5KSk7XG4gICAgcmV0dXJuIG5ldyBudW1lcmljLlQoZGlhZyh4KSk7XG59XG5udW1lcmljLlQuZWlnID0gZnVuY3Rpb24gZWlnKCkge1xuICAgIGlmKHRoaXMueSkgeyB0aHJvdyBuZXcgRXJyb3IoJ2VpZzogbm90IGltcGxlbWVudGVkIGZvciBjb21wbGV4IG1hdHJpY2VzLicpOyB9XG4gICAgcmV0dXJuIG51bWVyaWMuZWlnKHRoaXMueCk7XG59XG5udW1lcmljLlQuaWRlbnRpdHkgPSBmdW5jdGlvbiBpZGVudGl0eShuKSB7IHJldHVybiBuZXcgbnVtZXJpYy5UKG51bWVyaWMuaWRlbnRpdHkobikpOyB9XG5udW1lcmljLlQucHJvdG90eXBlLmdldERpYWcgPSBmdW5jdGlvbiBnZXREaWFnKCkge1xuICAgIHZhciBuID0gbnVtZXJpYztcbiAgICB2YXIgeCA9IHRoaXMueCwgeSA9IHRoaXMueTtcbiAgICBpZih5KSB7IHJldHVybiBuZXcgbi5UKG4uZ2V0RGlhZyh4KSxuLmdldERpYWcoeSkpOyB9XG4gICAgcmV0dXJuIG5ldyBuLlQobi5nZXREaWFnKHgpKTtcbn1cblxuLy8gNC4gRWlnZW52YWx1ZXMgb2YgcmVhbCBtYXRyaWNlc1xuXG5udW1lcmljLmhvdXNlID0gZnVuY3Rpb24gaG91c2UoeCkge1xuICAgIHZhciB2ID0gbnVtZXJpYy5jbG9uZSh4KTtcbiAgICB2YXIgcyA9IHhbMF0gPj0gMCA/IDEgOiAtMTtcbiAgICB2YXIgYWxwaGEgPSBzKm51bWVyaWMubm9ybTIoeCk7XG4gICAgdlswXSArPSBhbHBoYTtcbiAgICB2YXIgZm9vID0gbnVtZXJpYy5ub3JtMih2KTtcbiAgICBpZihmb28gPT09IDApIHsgLyogdGhpcyBzaG91bGQgbm90IGhhcHBlbiAqLyB0aHJvdyBuZXcgRXJyb3IoJ2VpZzogaW50ZXJuYWwgZXJyb3InKTsgfVxuICAgIHJldHVybiBudW1lcmljLmRpdih2LGZvbyk7XG59XG5cbm51bWVyaWMudG9VcHBlckhlc3NlbmJlcmcgPSBmdW5jdGlvbiB0b1VwcGVySGVzc2VuYmVyZyhtZSkge1xuICAgIHZhciBzID0gbnVtZXJpYy5kaW0obWUpO1xuICAgIGlmKHMubGVuZ3RoICE9PSAyIHx8IHNbMF0gIT09IHNbMV0pIHsgdGhyb3cgbmV3IEVycm9yKCdudW1lcmljOiB0b1VwcGVySGVzc2VuYmVyZygpIG9ubHkgd29ya3Mgb24gc3F1YXJlIG1hdHJpY2VzJyk7IH1cbiAgICB2YXIgbSA9IHNbMF0sIGksaixrLHgsdixBID0gbnVtZXJpYy5jbG9uZShtZSksQixDLEFpLENpLFEgPSBudW1lcmljLmlkZW50aXR5KG0pLFFpO1xuICAgIGZvcihqPTA7ajxtLTI7aisrKSB7XG4gICAgICAgIHggPSBBcnJheShtLWotMSk7XG4gICAgICAgIGZvcihpPWorMTtpPG07aSsrKSB7IHhbaS1qLTFdID0gQVtpXVtqXTsgfVxuICAgICAgICBpZihudW1lcmljLm5vcm0yKHgpPjApIHtcbiAgICAgICAgICAgIHYgPSBudW1lcmljLmhvdXNlKHgpO1xuICAgICAgICAgICAgQiA9IG51bWVyaWMuZ2V0QmxvY2soQSxbaisxLGpdLFttLTEsbS0xXSk7XG4gICAgICAgICAgICBDID0gbnVtZXJpYy50ZW5zb3IodixudW1lcmljLmRvdCh2LEIpKTtcbiAgICAgICAgICAgIGZvcihpPWorMTtpPG07aSsrKSB7IEFpID0gQVtpXTsgQ2kgPSBDW2ktai0xXTsgZm9yKGs9ajtrPG07aysrKSBBaVtrXSAtPSAyKkNpW2stal07IH1cbiAgICAgICAgICAgIEIgPSBudW1lcmljLmdldEJsb2NrKEEsWzAsaisxXSxbbS0xLG0tMV0pO1xuICAgICAgICAgICAgQyA9IG51bWVyaWMudGVuc29yKG51bWVyaWMuZG90KEIsdiksdik7XG4gICAgICAgICAgICBmb3IoaT0wO2k8bTtpKyspIHsgQWkgPSBBW2ldOyBDaSA9IENbaV07IGZvcihrPWorMTtrPG07aysrKSBBaVtrXSAtPSAyKkNpW2stai0xXTsgfVxuICAgICAgICAgICAgQiA9IEFycmF5KG0tai0xKTtcbiAgICAgICAgICAgIGZvcihpPWorMTtpPG07aSsrKSBCW2ktai0xXSA9IFFbaV07XG4gICAgICAgICAgICBDID0gbnVtZXJpYy50ZW5zb3IodixudW1lcmljLmRvdCh2LEIpKTtcbiAgICAgICAgICAgIGZvcihpPWorMTtpPG07aSsrKSB7IFFpID0gUVtpXTsgQ2kgPSBDW2ktai0xXTsgZm9yKGs9MDtrPG07aysrKSBRaVtrXSAtPSAyKkNpW2tdOyB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHtIOkEsIFE6UX07XG59XG5cbm51bWVyaWMuZXBzaWxvbiA9IDIuMjIwNDQ2MDQ5MjUwMzEzZS0xNjtcblxubnVtZXJpYy5RUkZyYW5jaXMgPSBmdW5jdGlvbihILG1heGl0ZXIpIHtcbiAgICBpZih0eXBlb2YgbWF4aXRlciA9PT0gXCJ1bmRlZmluZWRcIikgeyBtYXhpdGVyID0gMTAwMDA7IH1cbiAgICBIID0gbnVtZXJpYy5jbG9uZShIKTtcbiAgICB2YXIgSDAgPSBudW1lcmljLmNsb25lKEgpO1xuICAgIHZhciBzID0gbnVtZXJpYy5kaW0oSCksbT1zWzBdLHgsdixhLGIsYyxkLGRldCx0ciwgSGxvYywgUSA9IG51bWVyaWMuaWRlbnRpdHkobSksIFFpLCBIaSwgQiwgQywgQ2ksaSxqLGssaXRlcjtcbiAgICBpZihtPDMpIHsgcmV0dXJuIHtROlEsIEI6WyBbMCxtLTFdIF19OyB9XG4gICAgdmFyIGVwc2lsb24gPSBudW1lcmljLmVwc2lsb247XG4gICAgZm9yKGl0ZXI9MDtpdGVyPG1heGl0ZXI7aXRlcisrKSB7XG4gICAgICAgIGZvcihqPTA7ajxtLTE7aisrKSB7XG4gICAgICAgICAgICBpZihNYXRoLmFicyhIW2orMV1bal0pIDwgZXBzaWxvbiooTWF0aC5hYnMoSFtqXVtqXSkrTWF0aC5hYnMoSFtqKzFdW2orMV0pKSkge1xuICAgICAgICAgICAgICAgIHZhciBRSDEgPSBudW1lcmljLlFSRnJhbmNpcyhudW1lcmljLmdldEJsb2NrKEgsWzAsMF0sW2osal0pLG1heGl0ZXIpO1xuICAgICAgICAgICAgICAgIHZhciBRSDIgPSBudW1lcmljLlFSRnJhbmNpcyhudW1lcmljLmdldEJsb2NrKEgsW2orMSxqKzFdLFttLTEsbS0xXSksbWF4aXRlcik7XG4gICAgICAgICAgICAgICAgQiA9IEFycmF5KGorMSk7XG4gICAgICAgICAgICAgICAgZm9yKGk9MDtpPD1qO2krKykgeyBCW2ldID0gUVtpXTsgfVxuICAgICAgICAgICAgICAgIEMgPSBudW1lcmljLmRvdChRSDEuUSxCKTtcbiAgICAgICAgICAgICAgICBmb3IoaT0wO2k8PWo7aSsrKSB7IFFbaV0gPSBDW2ldOyB9XG4gICAgICAgICAgICAgICAgQiA9IEFycmF5KG0tai0xKTtcbiAgICAgICAgICAgICAgICBmb3IoaT1qKzE7aTxtO2krKykgeyBCW2ktai0xXSA9IFFbaV07IH1cbiAgICAgICAgICAgICAgICBDID0gbnVtZXJpYy5kb3QoUUgyLlEsQik7XG4gICAgICAgICAgICAgICAgZm9yKGk9aisxO2k8bTtpKyspIHsgUVtpXSA9IENbaS1qLTFdOyB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtROlEsQjpRSDEuQi5jb25jYXQobnVtZXJpYy5hZGQoUUgyLkIsaisxKSl9O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGEgPSBIW20tMl1bbS0yXTsgYiA9IEhbbS0yXVttLTFdO1xuICAgICAgICBjID0gSFttLTFdW20tMl07IGQgPSBIW20tMV1bbS0xXTtcbiAgICAgICAgdHIgPSBhK2Q7XG4gICAgICAgIGRldCA9IChhKmQtYipjKTtcbiAgICAgICAgSGxvYyA9IG51bWVyaWMuZ2V0QmxvY2soSCwgWzAsMF0sIFsyLDJdKTtcbiAgICAgICAgaWYodHIqdHI+PTQqZGV0KSB7XG4gICAgICAgICAgICB2YXIgczEsczI7XG4gICAgICAgICAgICBzMSA9IDAuNSoodHIrTWF0aC5zcXJ0KHRyKnRyLTQqZGV0KSk7XG4gICAgICAgICAgICBzMiA9IDAuNSoodHItTWF0aC5zcXJ0KHRyKnRyLTQqZGV0KSk7XG4gICAgICAgICAgICBIbG9jID0gbnVtZXJpYy5hZGQobnVtZXJpYy5zdWIobnVtZXJpYy5kb3QoSGxvYyxIbG9jKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBudW1lcmljLm11bChIbG9jLHMxK3MyKSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbnVtZXJpYy5kaWFnKG51bWVyaWMucmVwKFszXSxzMSpzMikpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIEhsb2MgPSBudW1lcmljLmFkZChudW1lcmljLnN1YihudW1lcmljLmRvdChIbG9jLEhsb2MpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG51bWVyaWMubXVsKEhsb2MsdHIpKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBudW1lcmljLmRpYWcobnVtZXJpYy5yZXAoWzNdLGRldCkpKTtcbiAgICAgICAgfVxuICAgICAgICB4ID0gW0hsb2NbMF1bMF0sSGxvY1sxXVswXSxIbG9jWzJdWzBdXTtcbiAgICAgICAgdiA9IG51bWVyaWMuaG91c2UoeCk7XG4gICAgICAgIEIgPSBbSFswXSxIWzFdLEhbMl1dO1xuICAgICAgICBDID0gbnVtZXJpYy50ZW5zb3IodixudW1lcmljLmRvdCh2LEIpKTtcbiAgICAgICAgZm9yKGk9MDtpPDM7aSsrKSB7IEhpID0gSFtpXTsgQ2kgPSBDW2ldOyBmb3Ioaz0wO2s8bTtrKyspIEhpW2tdIC09IDIqQ2lba107IH1cbiAgICAgICAgQiA9IG51bWVyaWMuZ2V0QmxvY2soSCwgWzAsMF0sW20tMSwyXSk7XG4gICAgICAgIEMgPSBudW1lcmljLnRlbnNvcihudW1lcmljLmRvdChCLHYpLHYpO1xuICAgICAgICBmb3IoaT0wO2k8bTtpKyspIHsgSGkgPSBIW2ldOyBDaSA9IENbaV07IGZvcihrPTA7azwzO2srKykgSGlba10gLT0gMipDaVtrXTsgfVxuICAgICAgICBCID0gW1FbMF0sUVsxXSxRWzJdXTtcbiAgICAgICAgQyA9IG51bWVyaWMudGVuc29yKHYsbnVtZXJpYy5kb3QodixCKSk7XG4gICAgICAgIGZvcihpPTA7aTwzO2krKykgeyBRaSA9IFFbaV07IENpID0gQ1tpXTsgZm9yKGs9MDtrPG07aysrKSBRaVtrXSAtPSAyKkNpW2tdOyB9XG4gICAgICAgIHZhciBKO1xuICAgICAgICBmb3Ioaj0wO2o8bS0yO2orKykge1xuICAgICAgICAgICAgZm9yKGs9ajtrPD1qKzE7aysrKSB7XG4gICAgICAgICAgICAgICAgaWYoTWF0aC5hYnMoSFtrKzFdW2tdKSA8IGVwc2lsb24qKE1hdGguYWJzKEhba11ba10pK01hdGguYWJzKEhbaysxXVtrKzFdKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIFFIMSA9IG51bWVyaWMuUVJGcmFuY2lzKG51bWVyaWMuZ2V0QmxvY2soSCxbMCwwXSxbayxrXSksbWF4aXRlcik7XG4gICAgICAgICAgICAgICAgICAgIHZhciBRSDIgPSBudW1lcmljLlFSRnJhbmNpcyhudW1lcmljLmdldEJsb2NrKEgsW2srMSxrKzFdLFttLTEsbS0xXSksbWF4aXRlcik7XG4gICAgICAgICAgICAgICAgICAgIEIgPSBBcnJheShrKzEpO1xuICAgICAgICAgICAgICAgICAgICBmb3IoaT0wO2k8PWs7aSsrKSB7IEJbaV0gPSBRW2ldOyB9XG4gICAgICAgICAgICAgICAgICAgIEMgPSBudW1lcmljLmRvdChRSDEuUSxCKTtcbiAgICAgICAgICAgICAgICAgICAgZm9yKGk9MDtpPD1rO2krKykgeyBRW2ldID0gQ1tpXTsgfVxuICAgICAgICAgICAgICAgICAgICBCID0gQXJyYXkobS1rLTEpO1xuICAgICAgICAgICAgICAgICAgICBmb3IoaT1rKzE7aTxtO2krKykgeyBCW2ktay0xXSA9IFFbaV07IH1cbiAgICAgICAgICAgICAgICAgICAgQyA9IG51bWVyaWMuZG90KFFIMi5RLEIpO1xuICAgICAgICAgICAgICAgICAgICBmb3IoaT1rKzE7aTxtO2krKykgeyBRW2ldID0gQ1tpLWstMV07IH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtROlEsQjpRSDEuQi5jb25jYXQobnVtZXJpYy5hZGQoUUgyLkIsaysxKSl9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIEogPSBNYXRoLm1pbihtLTEsaiszKTtcbiAgICAgICAgICAgIHggPSBBcnJheShKLWopO1xuICAgICAgICAgICAgZm9yKGk9aisxO2k8PUo7aSsrKSB7IHhbaS1qLTFdID0gSFtpXVtqXTsgfVxuICAgICAgICAgICAgdiA9IG51bWVyaWMuaG91c2UoeCk7XG4gICAgICAgICAgICBCID0gbnVtZXJpYy5nZXRCbG9jayhILCBbaisxLGpdLFtKLG0tMV0pO1xuICAgICAgICAgICAgQyA9IG51bWVyaWMudGVuc29yKHYsbnVtZXJpYy5kb3QodixCKSk7XG4gICAgICAgICAgICBmb3IoaT1qKzE7aTw9SjtpKyspIHsgSGkgPSBIW2ldOyBDaSA9IENbaS1qLTFdOyBmb3Ioaz1qO2s8bTtrKyspIEhpW2tdIC09IDIqQ2lbay1qXTsgfVxuICAgICAgICAgICAgQiA9IG51bWVyaWMuZ2V0QmxvY2soSCwgWzAsaisxXSxbbS0xLEpdKTtcbiAgICAgICAgICAgIEMgPSBudW1lcmljLnRlbnNvcihudW1lcmljLmRvdChCLHYpLHYpO1xuICAgICAgICAgICAgZm9yKGk9MDtpPG07aSsrKSB7IEhpID0gSFtpXTsgQ2kgPSBDW2ldOyBmb3Ioaz1qKzE7azw9SjtrKyspIEhpW2tdIC09IDIqQ2lbay1qLTFdOyB9XG4gICAgICAgICAgICBCID0gQXJyYXkoSi1qKTtcbiAgICAgICAgICAgIGZvcihpPWorMTtpPD1KO2krKykgQltpLWotMV0gPSBRW2ldO1xuICAgICAgICAgICAgQyA9IG51bWVyaWMudGVuc29yKHYsbnVtZXJpYy5kb3QodixCKSk7XG4gICAgICAgICAgICBmb3IoaT1qKzE7aTw9SjtpKyspIHsgUWkgPSBRW2ldOyBDaSA9IENbaS1qLTFdOyBmb3Ioaz0wO2s8bTtrKyspIFFpW2tdIC09IDIqQ2lba107IH1cbiAgICAgICAgfVxuICAgIH1cbiAgICB0aHJvdyBuZXcgRXJyb3IoJ251bWVyaWM6IGVpZ2VudmFsdWUgaXRlcmF0aW9uIGRvZXMgbm90IGNvbnZlcmdlIC0tIGluY3JlYXNlIG1heGl0ZXI/Jyk7XG59XG5cbm51bWVyaWMuZWlnID0gZnVuY3Rpb24gZWlnKEEsbWF4aXRlcikge1xuICAgIHZhciBRSCA9IG51bWVyaWMudG9VcHBlckhlc3NlbmJlcmcoQSk7XG4gICAgdmFyIFFCID0gbnVtZXJpYy5RUkZyYW5jaXMoUUguSCxtYXhpdGVyKTtcbiAgICB2YXIgVCA9IG51bWVyaWMuVDtcbiAgICB2YXIgbiA9IEEubGVuZ3RoLGksayxmbGFnID0gZmFsc2UsQiA9IFFCLkIsSCA9IG51bWVyaWMuZG90KFFCLlEsbnVtZXJpYy5kb3QoUUguSCxudW1lcmljLnRyYW5zcG9zZShRQi5RKSkpO1xuICAgIHZhciBRID0gbmV3IFQobnVtZXJpYy5kb3QoUUIuUSxRSC5RKSksUTA7XG4gICAgdmFyIG0gPSBCLmxlbmd0aCxqO1xuICAgIHZhciBhLGIsYyxkLHAxLHAyLGRpc2MseCx5LHAscSxuMSxuMjtcbiAgICB2YXIgc3FydCA9IE1hdGguc3FydDtcbiAgICBmb3Ioaz0wO2s8bTtrKyspIHtcbiAgICAgICAgaSA9IEJba11bMF07XG4gICAgICAgIGlmKGkgPT09IEJba11bMV0pIHtcbiAgICAgICAgICAgIC8vIG5vdGhpbmdcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGogPSBpKzE7XG4gICAgICAgICAgICBhID0gSFtpXVtpXTtcbiAgICAgICAgICAgIGIgPSBIW2ldW2pdO1xuICAgICAgICAgICAgYyA9IEhbal1baV07XG4gICAgICAgICAgICBkID0gSFtqXVtqXTtcbiAgICAgICAgICAgIGlmKGIgPT09IDAgJiYgYyA9PT0gMCkgY29udGludWU7XG4gICAgICAgICAgICBwMSA9IC1hLWQ7XG4gICAgICAgICAgICBwMiA9IGEqZC1iKmM7XG4gICAgICAgICAgICBkaXNjID0gcDEqcDEtNCpwMjtcbiAgICAgICAgICAgIGlmKGRpc2M+PTApIHtcbiAgICAgICAgICAgICAgICBpZihwMTwwKSB4ID0gLTAuNSoocDEtc3FydChkaXNjKSk7XG4gICAgICAgICAgICAgICAgZWxzZSAgICAgeCA9IC0wLjUqKHAxK3NxcnQoZGlzYykpO1xuICAgICAgICAgICAgICAgIG4xID0gKGEteCkqKGEteCkrYipiO1xuICAgICAgICAgICAgICAgIG4yID0gYypjKyhkLXgpKihkLXgpO1xuICAgICAgICAgICAgICAgIGlmKG4xPm4yKSB7XG4gICAgICAgICAgICAgICAgICAgIG4xID0gc3FydChuMSk7XG4gICAgICAgICAgICAgICAgICAgIHAgPSAoYS14KS9uMTtcbiAgICAgICAgICAgICAgICAgICAgcSA9IGIvbjE7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgbjIgPSBzcXJ0KG4yKTtcbiAgICAgICAgICAgICAgICAgICAgcCA9IGMvbjI7XG4gICAgICAgICAgICAgICAgICAgIHEgPSAoZC14KS9uMjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgUTAgPSBuZXcgVChbW3EsLXBdLFtwLHFdXSk7XG4gICAgICAgICAgICAgICAgUS5zZXRSb3dzKGksaixRMC5kb3QoUS5nZXRSb3dzKGksaikpKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgeCA9IC0wLjUqcDE7XG4gICAgICAgICAgICAgICAgeSA9IDAuNSpzcXJ0KC1kaXNjKTtcbiAgICAgICAgICAgICAgICBuMSA9IChhLXgpKihhLXgpK2IqYjtcbiAgICAgICAgICAgICAgICBuMiA9IGMqYysoZC14KSooZC14KTtcbiAgICAgICAgICAgICAgICBpZihuMT5uMikge1xuICAgICAgICAgICAgICAgICAgICBuMSA9IHNxcnQobjEreSp5KTtcbiAgICAgICAgICAgICAgICAgICAgcCA9IChhLXgpL24xO1xuICAgICAgICAgICAgICAgICAgICBxID0gYi9uMTtcbiAgICAgICAgICAgICAgICAgICAgeCA9IDA7XG4gICAgICAgICAgICAgICAgICAgIHkgLz0gbjE7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgbjIgPSBzcXJ0KG4yK3kqeSk7XG4gICAgICAgICAgICAgICAgICAgIHAgPSBjL24yO1xuICAgICAgICAgICAgICAgICAgICBxID0gKGQteCkvbjI7XG4gICAgICAgICAgICAgICAgICAgIHggPSB5L24yO1xuICAgICAgICAgICAgICAgICAgICB5ID0gMDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgUTAgPSBuZXcgVChbW3EsLXBdLFtwLHFdXSxbW3gseV0sW3ksLXhdXSk7XG4gICAgICAgICAgICAgICAgUS5zZXRSb3dzKGksaixRMC5kb3QoUS5nZXRSb3dzKGksaikpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICB2YXIgUiA9IFEuZG90KEEpLmRvdChRLnRyYW5zanVnYXRlKCkpLCBuID0gQS5sZW5ndGgsIEUgPSBudW1lcmljLlQuaWRlbnRpdHkobik7XG4gICAgZm9yKGo9MDtqPG47aisrKSB7XG4gICAgICAgIGlmKGo+MCkge1xuICAgICAgICAgICAgZm9yKGs9ai0xO2s+PTA7ay0tKSB7XG4gICAgICAgICAgICAgICAgdmFyIFJrID0gUi5nZXQoW2ssa10pLCBSaiA9IFIuZ2V0KFtqLGpdKTtcbiAgICAgICAgICAgICAgICBpZihudW1lcmljLm5lcShSay54LFJqLngpIHx8IG51bWVyaWMubmVxKFJrLnksUmoueSkpIHtcbiAgICAgICAgICAgICAgICAgICAgeCA9IFIuZ2V0Um93KGspLmdldEJsb2NrKFtrXSxbai0xXSk7XG4gICAgICAgICAgICAgICAgICAgIHkgPSBFLmdldFJvdyhqKS5nZXRCbG9jayhba10sW2otMV0pO1xuICAgICAgICAgICAgICAgICAgICBFLnNldChbaixrXSwoUi5nZXQoW2ssal0pLm5lZygpLnN1Yih4LmRvdCh5KSkpLmRpdihSay5zdWIoUmopKSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgRS5zZXRSb3coaixFLmdldFJvdyhrKSk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBmb3Ioaj0wO2o8bjtqKyspIHtcbiAgICAgICAgeCA9IEUuZ2V0Um93KGopO1xuICAgICAgICBFLnNldFJvdyhqLHguZGl2KHgubm9ybTIoKSkpO1xuICAgIH1cbiAgICBFID0gRS50cmFuc3Bvc2UoKTtcbiAgICBFID0gUS50cmFuc2p1Z2F0ZSgpLmRvdChFKTtcbiAgICByZXR1cm4geyBsYW1iZGE6Ui5nZXREaWFnKCksIEU6RSB9O1xufTtcblxuLy8gNS4gQ29tcHJlc3NlZCBDb2x1bW4gU3RvcmFnZSBtYXRyaWNlc1xubnVtZXJpYy5jY3NTcGFyc2UgPSBmdW5jdGlvbiBjY3NTcGFyc2UoQSkge1xuICAgIHZhciBtID0gQS5sZW5ndGgsbixmb28sIGksaiwgY291bnRzID0gW107XG4gICAgZm9yKGk9bS0xO2khPT0tMTstLWkpIHtcbiAgICAgICAgZm9vID0gQVtpXTtcbiAgICAgICAgZm9yKGogaW4gZm9vKSB7XG4gICAgICAgICAgICBqID0gcGFyc2VJbnQoaik7XG4gICAgICAgICAgICB3aGlsZShqPj1jb3VudHMubGVuZ3RoKSBjb3VudHNbY291bnRzLmxlbmd0aF0gPSAwO1xuICAgICAgICAgICAgaWYoZm9vW2pdIT09MCkgY291bnRzW2pdKys7XG4gICAgICAgIH1cbiAgICB9XG4gICAgdmFyIG4gPSBjb3VudHMubGVuZ3RoO1xuICAgIHZhciBBaSA9IEFycmF5KG4rMSk7XG4gICAgQWlbMF0gPSAwO1xuICAgIGZvcihpPTA7aTxuOysraSkgQWlbaSsxXSA9IEFpW2ldICsgY291bnRzW2ldO1xuICAgIHZhciBBaiA9IEFycmF5KEFpW25dKSwgQXYgPSBBcnJheShBaVtuXSk7XG4gICAgZm9yKGk9bS0xO2khPT0tMTstLWkpIHtcbiAgICAgICAgZm9vID0gQVtpXTtcbiAgICAgICAgZm9yKGogaW4gZm9vKSB7XG4gICAgICAgICAgICBpZihmb29bal0hPT0wKSB7XG4gICAgICAgICAgICAgICAgY291bnRzW2pdLS07XG4gICAgICAgICAgICAgICAgQWpbQWlbal0rY291bnRzW2pdXSA9IGk7XG4gICAgICAgICAgICAgICAgQXZbQWlbal0rY291bnRzW2pdXSA9IGZvb1tqXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gW0FpLEFqLEF2XTtcbn1cbm51bWVyaWMuY2NzRnVsbCA9IGZ1bmN0aW9uIGNjc0Z1bGwoQSkge1xuICAgIHZhciBBaSA9IEFbMF0sIEFqID0gQVsxXSwgQXYgPSBBWzJdLCBzID0gbnVtZXJpYy5jY3NEaW0oQSksIG0gPSBzWzBdLCBuID0gc1sxXSwgaSxqLGowLGoxLGs7XG4gICAgdmFyIEIgPSBudW1lcmljLnJlcChbbSxuXSwwKTtcbiAgICBmb3IoaT0wO2k8bjtpKyspIHtcbiAgICAgICAgajAgPSBBaVtpXTtcbiAgICAgICAgajEgPSBBaVtpKzFdO1xuICAgICAgICBmb3Ioaj1qMDtqPGoxOysraikgeyBCW0FqW2pdXVtpXSA9IEF2W2pdOyB9XG4gICAgfVxuICAgIHJldHVybiBCO1xufVxubnVtZXJpYy5jY3NUU29sdmUgPSBmdW5jdGlvbiBjY3NUU29sdmUoQSxiLHgsYmoseGopIHtcbiAgICB2YXIgQWkgPSBBWzBdLCBBaiA9IEFbMV0sIEF2ID0gQVsyXSxtID0gQWkubGVuZ3RoLTEsIG1heCA9IE1hdGgubWF4LG49MDtcbiAgICBpZih0eXBlb2YgYmogPT09IFwidW5kZWZpbmVkXCIpIHggPSBudW1lcmljLnJlcChbbV0sMCk7XG4gICAgaWYodHlwZW9mIGJqID09PSBcInVuZGVmaW5lZFwiKSBiaiA9IG51bWVyaWMubGluc3BhY2UoMCx4Lmxlbmd0aC0xKTtcbiAgICBpZih0eXBlb2YgeGogPT09IFwidW5kZWZpbmVkXCIpIHhqID0gW107XG4gICAgZnVuY3Rpb24gZGZzKGopIHtcbiAgICAgICAgdmFyIGs7XG4gICAgICAgIGlmKHhbal0gIT09IDApIHJldHVybjtcbiAgICAgICAgeFtqXSA9IDE7XG4gICAgICAgIGZvcihrPUFpW2pdO2s8QWlbaisxXTsrK2spIGRmcyhBaltrXSk7XG4gICAgICAgIHhqW25dID0gajtcbiAgICAgICAgKytuO1xuICAgIH1cbiAgICB2YXIgaSxqLGowLGoxLGssbCxsMCxsMSxhO1xuICAgIGZvcihpPWJqLmxlbmd0aC0xO2khPT0tMTstLWkpIHsgZGZzKGJqW2ldKTsgfVxuICAgIHhqLmxlbmd0aCA9IG47XG4gICAgZm9yKGk9eGoubGVuZ3RoLTE7aSE9PS0xOy0taSkgeyB4W3hqW2ldXSA9IDA7IH1cbiAgICBmb3IoaT1iai5sZW5ndGgtMTtpIT09LTE7LS1pKSB7IGogPSBialtpXTsgeFtqXSA9IGJbal07IH1cbiAgICBmb3IoaT14ai5sZW5ndGgtMTtpIT09LTE7LS1pKSB7XG4gICAgICAgIGogPSB4altpXTtcbiAgICAgICAgajAgPSBBaVtqXTtcbiAgICAgICAgajEgPSBtYXgoQWlbaisxXSxqMCk7XG4gICAgICAgIGZvcihrPWowO2shPT1qMTsrK2spIHsgaWYoQWpba10gPT09IGopIHsgeFtqXSAvPSBBdltrXTsgYnJlYWs7IH0gfVxuICAgICAgICBhID0geFtqXTtcbiAgICAgICAgZm9yKGs9ajA7ayE9PWoxOysraykge1xuICAgICAgICAgICAgbCA9IEFqW2tdO1xuICAgICAgICAgICAgaWYobCAhPT0gaikgeFtsXSAtPSBhKkF2W2tdO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB4O1xufVxubnVtZXJpYy5jY3NERlMgPSBmdW5jdGlvbiBjY3NERlMobikge1xuICAgIHRoaXMuayA9IEFycmF5KG4pO1xuICAgIHRoaXMuazEgPSBBcnJheShuKTtcbiAgICB0aGlzLmogPSBBcnJheShuKTtcbn1cbm51bWVyaWMuY2NzREZTLnByb3RvdHlwZS5kZnMgPSBmdW5jdGlvbiBkZnMoSixBaSxBaix4LHhqLFBpbnYpIHtcbiAgICB2YXIgbSA9IDAsZm9vLG49eGoubGVuZ3RoO1xuICAgIHZhciBrID0gdGhpcy5rLCBrMSA9IHRoaXMuazEsIGogPSB0aGlzLmosa20sazExO1xuICAgIGlmKHhbSl0hPT0wKSByZXR1cm47XG4gICAgeFtKXSA9IDE7XG4gICAgalswXSA9IEo7XG4gICAga1swXSA9IGttID0gQWlbSl07XG4gICAgazFbMF0gPSBrMTEgPSBBaVtKKzFdO1xuICAgIHdoaWxlKDEpIHtcbiAgICAgICAgaWYoa20gPj0gazExKSB7XG4gICAgICAgICAgICB4altuXSA9IGpbbV07XG4gICAgICAgICAgICBpZihtPT09MCkgcmV0dXJuO1xuICAgICAgICAgICAgKytuO1xuICAgICAgICAgICAgLS1tO1xuICAgICAgICAgICAga20gPSBrW21dO1xuICAgICAgICAgICAgazExID0gazFbbV07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBmb28gPSBQaW52W0FqW2ttXV07XG4gICAgICAgICAgICBpZih4W2Zvb10gPT09IDApIHtcbiAgICAgICAgICAgICAgICB4W2Zvb10gPSAxO1xuICAgICAgICAgICAgICAgIGtbbV0gPSBrbTtcbiAgICAgICAgICAgICAgICArK207XG4gICAgICAgICAgICAgICAgalttXSA9IGZvbztcbiAgICAgICAgICAgICAgICBrbSA9IEFpW2Zvb107XG4gICAgICAgICAgICAgICAgazFbbV0gPSBrMTEgPSBBaVtmb28rMV07XG4gICAgICAgICAgICB9IGVsc2UgKytrbTtcbiAgICAgICAgfVxuICAgIH1cbn1cbm51bWVyaWMuY2NzTFBTb2x2ZSA9IGZ1bmN0aW9uIGNjc0xQU29sdmUoQSxCLHgseGosSSxQaW52LGRmcykge1xuICAgIHZhciBBaSA9IEFbMF0sIEFqID0gQVsxXSwgQXYgPSBBWzJdLG0gPSBBaS5sZW5ndGgtMSwgbj0wO1xuICAgIHZhciBCaSA9IEJbMF0sIEJqID0gQlsxXSwgQnYgPSBCWzJdO1xuICAgIFxuICAgIHZhciBpLGkwLGkxLGosSixqMCxqMSxrLGwsbDAsbDEsYTtcbiAgICBpMCA9IEJpW0ldO1xuICAgIGkxID0gQmlbSSsxXTtcbiAgICB4ai5sZW5ndGggPSAwO1xuICAgIGZvcihpPWkwO2k8aTE7KytpKSB7IGRmcy5kZnMoUGludltCaltpXV0sQWksQWoseCx4aixQaW52KTsgfVxuICAgIGZvcihpPXhqLmxlbmd0aC0xO2khPT0tMTstLWkpIHsgeFt4altpXV0gPSAwOyB9XG4gICAgZm9yKGk9aTA7aSE9PWkxOysraSkgeyBqID0gUGludltCaltpXV07IHhbal0gPSBCdltpXTsgfVxuICAgIGZvcihpPXhqLmxlbmd0aC0xO2khPT0tMTstLWkpIHtcbiAgICAgICAgaiA9IHhqW2ldO1xuICAgICAgICBqMCA9IEFpW2pdO1xuICAgICAgICBqMSA9IEFpW2orMV07XG4gICAgICAgIGZvcihrPWowO2s8ajE7KytrKSB7IGlmKFBpbnZbQWpba11dID09PSBqKSB7IHhbal0gLz0gQXZba107IGJyZWFrOyB9IH1cbiAgICAgICAgYSA9IHhbal07XG4gICAgICAgIGZvcihrPWowO2s8ajE7KytrKSB7XG4gICAgICAgICAgICBsID0gUGludltBaltrXV07XG4gICAgICAgICAgICBpZihsICE9PSBqKSB4W2xdIC09IGEqQXZba107XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHg7XG59XG5udW1lcmljLmNjc0xVUDEgPSBmdW5jdGlvbiBjY3NMVVAxKEEsdGhyZXNob2xkKSB7XG4gICAgdmFyIG0gPSBBWzBdLmxlbmd0aC0xO1xuICAgIHZhciBMID0gW251bWVyaWMucmVwKFttKzFdLDApLFtdLFtdXSwgVSA9IFtudW1lcmljLnJlcChbbSsxXSwgMCksW10sW11dO1xuICAgIHZhciBMaSA9IExbMF0sIExqID0gTFsxXSwgTHYgPSBMWzJdLCBVaSA9IFVbMF0sIFVqID0gVVsxXSwgVXYgPSBVWzJdO1xuICAgIHZhciB4ID0gbnVtZXJpYy5yZXAoW21dLDApLCB4aiA9IG51bWVyaWMucmVwKFttXSwwKTtcbiAgICB2YXIgaSxqLGssajAsajEsYSxlLGMsZCxLO1xuICAgIHZhciBzb2wgPSBudW1lcmljLmNjc0xQU29sdmUsIG1heCA9IE1hdGgubWF4LCBhYnMgPSBNYXRoLmFicztcbiAgICB2YXIgUCA9IG51bWVyaWMubGluc3BhY2UoMCxtLTEpLFBpbnYgPSBudW1lcmljLmxpbnNwYWNlKDAsbS0xKTtcbiAgICB2YXIgZGZzID0gbmV3IG51bWVyaWMuY2NzREZTKG0pO1xuICAgIGlmKHR5cGVvZiB0aHJlc2hvbGQgPT09IFwidW5kZWZpbmVkXCIpIHsgdGhyZXNob2xkID0gMTsgfVxuICAgIGZvcihpPTA7aTxtOysraSkge1xuICAgICAgICBzb2woTCxBLHgseGosaSxQaW52LGRmcyk7XG4gICAgICAgIGEgPSAtMTtcbiAgICAgICAgZSA9IC0xO1xuICAgICAgICBmb3Ioaj14ai5sZW5ndGgtMTtqIT09LTE7LS1qKSB7XG4gICAgICAgICAgICBrID0geGpbal07XG4gICAgICAgICAgICBpZihrIDw9IGkpIGNvbnRpbnVlO1xuICAgICAgICAgICAgYyA9IGFicyh4W2tdKTtcbiAgICAgICAgICAgIGlmKGMgPiBhKSB7IGUgPSBrOyBhID0gYzsgfVxuICAgICAgICB9XG4gICAgICAgIGlmKGFicyh4W2ldKTx0aHJlc2hvbGQqYSkge1xuICAgICAgICAgICAgaiA9IFBbaV07XG4gICAgICAgICAgICBhID0gUFtlXTtcbiAgICAgICAgICAgIFBbaV0gPSBhOyBQaW52W2FdID0gaTtcbiAgICAgICAgICAgIFBbZV0gPSBqOyBQaW52W2pdID0gZTtcbiAgICAgICAgICAgIGEgPSB4W2ldOyB4W2ldID0geFtlXTsgeFtlXSA9IGE7XG4gICAgICAgIH1cbiAgICAgICAgYSA9IExpW2ldO1xuICAgICAgICBlID0gVWlbaV07XG4gICAgICAgIGQgPSB4W2ldO1xuICAgICAgICBMalthXSA9IFBbaV07XG4gICAgICAgIEx2W2FdID0gMTtcbiAgICAgICAgKythO1xuICAgICAgICBmb3Ioaj14ai5sZW5ndGgtMTtqIT09LTE7LS1qKSB7XG4gICAgICAgICAgICBrID0geGpbal07XG4gICAgICAgICAgICBjID0geFtrXTtcbiAgICAgICAgICAgIHhqW2pdID0gMDtcbiAgICAgICAgICAgIHhba10gPSAwO1xuICAgICAgICAgICAgaWYoazw9aSkgeyBValtlXSA9IGs7IFV2W2VdID0gYzsgICArK2U7IH1cbiAgICAgICAgICAgIGVsc2UgICAgIHsgTGpbYV0gPSBQW2tdOyBMdlthXSA9IGMvZDsgKythOyB9XG4gICAgICAgIH1cbiAgICAgICAgTGlbaSsxXSA9IGE7XG4gICAgICAgIFVpW2krMV0gPSBlO1xuICAgIH1cbiAgICBmb3Ioaj1Mai5sZW5ndGgtMTtqIT09LTE7LS1qKSB7IExqW2pdID0gUGludltMaltqXV07IH1cbiAgICByZXR1cm4ge0w6TCwgVTpVLCBQOlAsIFBpbnY6UGludn07XG59XG5udW1lcmljLmNjc0RGUzAgPSBmdW5jdGlvbiBjY3NERlMwKG4pIHtcbiAgICB0aGlzLmsgPSBBcnJheShuKTtcbiAgICB0aGlzLmsxID0gQXJyYXkobik7XG4gICAgdGhpcy5qID0gQXJyYXkobik7XG59XG5udW1lcmljLmNjc0RGUzAucHJvdG90eXBlLmRmcyA9IGZ1bmN0aW9uIGRmcyhKLEFpLEFqLHgseGosUGludixQKSB7XG4gICAgdmFyIG0gPSAwLGZvbyxuPXhqLmxlbmd0aDtcbiAgICB2YXIgayA9IHRoaXMuaywgazEgPSB0aGlzLmsxLCBqID0gdGhpcy5qLGttLGsxMTtcbiAgICBpZih4W0pdIT09MCkgcmV0dXJuO1xuICAgIHhbSl0gPSAxO1xuICAgIGpbMF0gPSBKO1xuICAgIGtbMF0gPSBrbSA9IEFpW1BpbnZbSl1dO1xuICAgIGsxWzBdID0gazExID0gQWlbUGludltKXSsxXTtcbiAgICB3aGlsZSgxKSB7XG4gICAgICAgIGlmKGlzTmFOKGttKSkgdGhyb3cgbmV3IEVycm9yKFwiT3chXCIpO1xuICAgICAgICBpZihrbSA+PSBrMTEpIHtcbiAgICAgICAgICAgIHhqW25dID0gUGludltqW21dXTtcbiAgICAgICAgICAgIGlmKG09PT0wKSByZXR1cm47XG4gICAgICAgICAgICArK247XG4gICAgICAgICAgICAtLW07XG4gICAgICAgICAgICBrbSA9IGtbbV07XG4gICAgICAgICAgICBrMTEgPSBrMVttXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGZvbyA9IEFqW2ttXTtcbiAgICAgICAgICAgIGlmKHhbZm9vXSA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHhbZm9vXSA9IDE7XG4gICAgICAgICAgICAgICAga1ttXSA9IGttO1xuICAgICAgICAgICAgICAgICsrbTtcbiAgICAgICAgICAgICAgICBqW21dID0gZm9vO1xuICAgICAgICAgICAgICAgIGZvbyA9IFBpbnZbZm9vXTtcbiAgICAgICAgICAgICAgICBrbSA9IEFpW2Zvb107XG4gICAgICAgICAgICAgICAgazFbbV0gPSBrMTEgPSBBaVtmb28rMV07XG4gICAgICAgICAgICB9IGVsc2UgKytrbTtcbiAgICAgICAgfVxuICAgIH1cbn1cbm51bWVyaWMuY2NzTFBTb2x2ZTAgPSBmdW5jdGlvbiBjY3NMUFNvbHZlMChBLEIseSx4aixJLFBpbnYsUCxkZnMpIHtcbiAgICB2YXIgQWkgPSBBWzBdLCBBaiA9IEFbMV0sIEF2ID0gQVsyXSxtID0gQWkubGVuZ3RoLTEsIG49MDtcbiAgICB2YXIgQmkgPSBCWzBdLCBCaiA9IEJbMV0sIEJ2ID0gQlsyXTtcbiAgICBcbiAgICB2YXIgaSxpMCxpMSxqLEosajAsajEsayxsLGwwLGwxLGE7XG4gICAgaTAgPSBCaVtJXTtcbiAgICBpMSA9IEJpW0krMV07XG4gICAgeGoubGVuZ3RoID0gMDtcbiAgICBmb3IoaT1pMDtpPGkxOysraSkgeyBkZnMuZGZzKEJqW2ldLEFpLEFqLHkseGosUGludixQKTsgfVxuICAgIGZvcihpPXhqLmxlbmd0aC0xO2khPT0tMTstLWkpIHsgaiA9IHhqW2ldOyB5W1Bbal1dID0gMDsgfVxuICAgIGZvcihpPWkwO2khPT1pMTsrK2kpIHsgaiA9IEJqW2ldOyB5W2pdID0gQnZbaV07IH1cbiAgICBmb3IoaT14ai5sZW5ndGgtMTtpIT09LTE7LS1pKSB7XG4gICAgICAgIGogPSB4altpXTtcbiAgICAgICAgbCA9IFBbal07XG4gICAgICAgIGowID0gQWlbal07XG4gICAgICAgIGoxID0gQWlbaisxXTtcbiAgICAgICAgZm9yKGs9ajA7azxqMTsrK2spIHsgaWYoQWpba10gPT09IGwpIHsgeVtsXSAvPSBBdltrXTsgYnJlYWs7IH0gfVxuICAgICAgICBhID0geVtsXTtcbiAgICAgICAgZm9yKGs9ajA7azxqMTsrK2spIHlbQWpba11dIC09IGEqQXZba107XG4gICAgICAgIHlbbF0gPSBhO1xuICAgIH1cbn1cbm51bWVyaWMuY2NzTFVQMCA9IGZ1bmN0aW9uIGNjc0xVUDAoQSx0aHJlc2hvbGQpIHtcbiAgICB2YXIgbSA9IEFbMF0ubGVuZ3RoLTE7XG4gICAgdmFyIEwgPSBbbnVtZXJpYy5yZXAoW20rMV0sMCksW10sW11dLCBVID0gW251bWVyaWMucmVwKFttKzFdLCAwKSxbXSxbXV07XG4gICAgdmFyIExpID0gTFswXSwgTGogPSBMWzFdLCBMdiA9IExbMl0sIFVpID0gVVswXSwgVWogPSBVWzFdLCBVdiA9IFVbMl07XG4gICAgdmFyIHkgPSBudW1lcmljLnJlcChbbV0sMCksIHhqID0gbnVtZXJpYy5yZXAoW21dLDApO1xuICAgIHZhciBpLGosayxqMCxqMSxhLGUsYyxkLEs7XG4gICAgdmFyIHNvbCA9IG51bWVyaWMuY2NzTFBTb2x2ZTAsIG1heCA9IE1hdGgubWF4LCBhYnMgPSBNYXRoLmFicztcbiAgICB2YXIgUCA9IG51bWVyaWMubGluc3BhY2UoMCxtLTEpLFBpbnYgPSBudW1lcmljLmxpbnNwYWNlKDAsbS0xKTtcbiAgICB2YXIgZGZzID0gbmV3IG51bWVyaWMuY2NzREZTMChtKTtcbiAgICBpZih0eXBlb2YgdGhyZXNob2xkID09PSBcInVuZGVmaW5lZFwiKSB7IHRocmVzaG9sZCA9IDE7IH1cbiAgICBmb3IoaT0wO2k8bTsrK2kpIHtcbiAgICAgICAgc29sKEwsQSx5LHhqLGksUGludixQLGRmcyk7XG4gICAgICAgIGEgPSAtMTtcbiAgICAgICAgZSA9IC0xO1xuICAgICAgICBmb3Ioaj14ai5sZW5ndGgtMTtqIT09LTE7LS1qKSB7XG4gICAgICAgICAgICBrID0geGpbal07XG4gICAgICAgICAgICBpZihrIDw9IGkpIGNvbnRpbnVlO1xuICAgICAgICAgICAgYyA9IGFicyh5W1Bba11dKTtcbiAgICAgICAgICAgIGlmKGMgPiBhKSB7IGUgPSBrOyBhID0gYzsgfVxuICAgICAgICB9XG4gICAgICAgIGlmKGFicyh5W1BbaV1dKTx0aHJlc2hvbGQqYSkge1xuICAgICAgICAgICAgaiA9IFBbaV07XG4gICAgICAgICAgICBhID0gUFtlXTtcbiAgICAgICAgICAgIFBbaV0gPSBhOyBQaW52W2FdID0gaTtcbiAgICAgICAgICAgIFBbZV0gPSBqOyBQaW52W2pdID0gZTtcbiAgICAgICAgfVxuICAgICAgICBhID0gTGlbaV07XG4gICAgICAgIGUgPSBVaVtpXTtcbiAgICAgICAgZCA9IHlbUFtpXV07XG4gICAgICAgIExqW2FdID0gUFtpXTtcbiAgICAgICAgTHZbYV0gPSAxO1xuICAgICAgICArK2E7XG4gICAgICAgIGZvcihqPXhqLmxlbmd0aC0xO2ohPT0tMTstLWopIHtcbiAgICAgICAgICAgIGsgPSB4altqXTtcbiAgICAgICAgICAgIGMgPSB5W1Bba11dO1xuICAgICAgICAgICAgeGpbal0gPSAwO1xuICAgICAgICAgICAgeVtQW2tdXSA9IDA7XG4gICAgICAgICAgICBpZihrPD1pKSB7IFVqW2VdID0gazsgVXZbZV0gPSBjOyAgICsrZTsgfVxuICAgICAgICAgICAgZWxzZSAgICAgeyBMalthXSA9IFBba107IEx2W2FdID0gYy9kOyArK2E7IH1cbiAgICAgICAgfVxuICAgICAgICBMaVtpKzFdID0gYTtcbiAgICAgICAgVWlbaSsxXSA9IGU7XG4gICAgfVxuICAgIGZvcihqPUxqLmxlbmd0aC0xO2ohPT0tMTstLWopIHsgTGpbal0gPSBQaW52W0xqW2pdXTsgfVxuICAgIHJldHVybiB7TDpMLCBVOlUsIFA6UCwgUGludjpQaW52fTtcbn1cbm51bWVyaWMuY2NzTFVQID0gbnVtZXJpYy5jY3NMVVAwO1xuXG5udW1lcmljLmNjc0RpbSA9IGZ1bmN0aW9uIGNjc0RpbShBKSB7IHJldHVybiBbbnVtZXJpYy5zdXAoQVsxXSkrMSxBWzBdLmxlbmd0aC0xXTsgfVxubnVtZXJpYy5jY3NHZXRCbG9jayA9IGZ1bmN0aW9uIGNjc0dldEJsb2NrKEEsaSxqKSB7XG4gICAgdmFyIHMgPSBudW1lcmljLmNjc0RpbShBKSxtPXNbMF0sbj1zWzFdO1xuICAgIGlmKHR5cGVvZiBpID09PSBcInVuZGVmaW5lZFwiKSB7IGkgPSBudW1lcmljLmxpbnNwYWNlKDAsbS0xKTsgfVxuICAgIGVsc2UgaWYodHlwZW9mIGkgPT09IFwibnVtYmVyXCIpIHsgaSA9IFtpXTsgfVxuICAgIGlmKHR5cGVvZiBqID09PSBcInVuZGVmaW5lZFwiKSB7IGogPSBudW1lcmljLmxpbnNwYWNlKDAsbi0xKTsgfVxuICAgIGVsc2UgaWYodHlwZW9mIGogPT09IFwibnVtYmVyXCIpIHsgaiA9IFtqXTsgfVxuICAgIHZhciBwLHAwLHAxLFAgPSBpLmxlbmd0aCxxLFEgPSBqLmxlbmd0aCxyLGpxLGlwO1xuICAgIHZhciBCaSA9IG51bWVyaWMucmVwKFtuXSwwKSwgQmo9W10sIEJ2PVtdLCBCID0gW0JpLEJqLEJ2XTtcbiAgICB2YXIgQWkgPSBBWzBdLCBBaiA9IEFbMV0sIEF2ID0gQVsyXTtcbiAgICB2YXIgeCA9IG51bWVyaWMucmVwKFttXSwwKSxjb3VudD0wLGZsYWdzID0gbnVtZXJpYy5yZXAoW21dLDApO1xuICAgIGZvcihxPTA7cTxROysrcSkge1xuICAgICAgICBqcSA9IGpbcV07XG4gICAgICAgIHZhciBxMCA9IEFpW2pxXTtcbiAgICAgICAgdmFyIHExID0gQWlbanErMV07XG4gICAgICAgIGZvcihwPXEwO3A8cTE7KytwKSB7XG4gICAgICAgICAgICByID0gQWpbcF07XG4gICAgICAgICAgICBmbGFnc1tyXSA9IDE7XG4gICAgICAgICAgICB4W3JdID0gQXZbcF07XG4gICAgICAgIH1cbiAgICAgICAgZm9yKHA9MDtwPFA7KytwKSB7XG4gICAgICAgICAgICBpcCA9IGlbcF07XG4gICAgICAgICAgICBpZihmbGFnc1tpcF0pIHtcbiAgICAgICAgICAgICAgICBCaltjb3VudF0gPSBwO1xuICAgICAgICAgICAgICAgIEJ2W2NvdW50XSA9IHhbaVtwXV07XG4gICAgICAgICAgICAgICAgKytjb3VudDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBmb3IocD1xMDtwPHExOysrcCkge1xuICAgICAgICAgICAgciA9IEFqW3BdO1xuICAgICAgICAgICAgZmxhZ3Nbcl0gPSAwO1xuICAgICAgICB9XG4gICAgICAgIEJpW3ErMV0gPSBjb3VudDtcbiAgICB9XG4gICAgcmV0dXJuIEI7XG59XG5cbm51bWVyaWMuY2NzRG90ID0gZnVuY3Rpb24gY2NzRG90KEEsQikge1xuICAgIHZhciBBaSA9IEFbMF0sIEFqID0gQVsxXSwgQXYgPSBBWzJdO1xuICAgIHZhciBCaSA9IEJbMF0sIEJqID0gQlsxXSwgQnYgPSBCWzJdO1xuICAgIHZhciBzQSA9IG51bWVyaWMuY2NzRGltKEEpLCBzQiA9IG51bWVyaWMuY2NzRGltKEIpO1xuICAgIHZhciBtID0gc0FbMF0sIG4gPSBzQVsxXSwgbyA9IHNCWzFdO1xuICAgIHZhciB4ID0gbnVtZXJpYy5yZXAoW21dLDApLCBmbGFncyA9IG51bWVyaWMucmVwKFttXSwwKSwgeGogPSBBcnJheShtKTtcbiAgICB2YXIgQ2kgPSBudW1lcmljLnJlcChbb10sMCksIENqID0gW10sIEN2ID0gW10sIEMgPSBbQ2ksQ2osQ3ZdO1xuICAgIHZhciBpLGosayxqMCxqMSxpMCxpMSxsLHAsYSxiO1xuICAgIGZvcihrPTA7ayE9PW87KytrKSB7XG4gICAgICAgIGowID0gQmlba107XG4gICAgICAgIGoxID0gQmlbaysxXTtcbiAgICAgICAgcCA9IDA7XG4gICAgICAgIGZvcihqPWowO2o8ajE7KytqKSB7XG4gICAgICAgICAgICBhID0gQmpbal07XG4gICAgICAgICAgICBiID0gQnZbal07XG4gICAgICAgICAgICBpMCA9IEFpW2FdO1xuICAgICAgICAgICAgaTEgPSBBaVthKzFdO1xuICAgICAgICAgICAgZm9yKGk9aTA7aTxpMTsrK2kpIHtcbiAgICAgICAgICAgICAgICBsID0gQWpbaV07XG4gICAgICAgICAgICAgICAgaWYoZmxhZ3NbbF09PT0wKSB7XG4gICAgICAgICAgICAgICAgICAgIHhqW3BdID0gbDtcbiAgICAgICAgICAgICAgICAgICAgZmxhZ3NbbF0gPSAxO1xuICAgICAgICAgICAgICAgICAgICBwID0gcCsxO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB4W2xdID0geFtsXSArIEF2W2ldKmI7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgajAgPSBDaVtrXTtcbiAgICAgICAgajEgPSBqMCtwO1xuICAgICAgICBDaVtrKzFdID0gajE7XG4gICAgICAgIGZvcihqPXAtMTtqIT09LTE7LS1qKSB7XG4gICAgICAgICAgICBiID0gajArajtcbiAgICAgICAgICAgIGkgPSB4altqXTtcbiAgICAgICAgICAgIENqW2JdID0gaTtcbiAgICAgICAgICAgIEN2W2JdID0geFtpXTtcbiAgICAgICAgICAgIGZsYWdzW2ldID0gMDtcbiAgICAgICAgICAgIHhbaV0gPSAwO1xuICAgICAgICB9XG4gICAgICAgIENpW2srMV0gPSBDaVtrXStwO1xuICAgIH1cbiAgICByZXR1cm4gQztcbn1cblxubnVtZXJpYy5jY3NMVVBTb2x2ZSA9IGZ1bmN0aW9uIGNjc0xVUFNvbHZlKExVUCxCKSB7XG4gICAgdmFyIEwgPSBMVVAuTCwgVSA9IExVUC5VLCBQID0gTFVQLlA7XG4gICAgdmFyIEJpID0gQlswXTtcbiAgICB2YXIgZmxhZyA9IGZhbHNlO1xuICAgIGlmKHR5cGVvZiBCaSAhPT0gXCJvYmplY3RcIikgeyBCID0gW1swLEIubGVuZ3RoXSxudW1lcmljLmxpbnNwYWNlKDAsQi5sZW5ndGgtMSksQl07IEJpID0gQlswXTsgZmxhZyA9IHRydWU7IH1cbiAgICB2YXIgQmogPSBCWzFdLCBCdiA9IEJbMl07XG4gICAgdmFyIG4gPSBMWzBdLmxlbmd0aC0xLCBtID0gQmkubGVuZ3RoLTE7XG4gICAgdmFyIHggPSBudW1lcmljLnJlcChbbl0sMCksIHhqID0gQXJyYXkobik7XG4gICAgdmFyIGIgPSBudW1lcmljLnJlcChbbl0sMCksIGJqID0gQXJyYXkobik7XG4gICAgdmFyIFhpID0gbnVtZXJpYy5yZXAoW20rMV0sMCksIFhqID0gW10sIFh2ID0gW107XG4gICAgdmFyIHNvbCA9IG51bWVyaWMuY2NzVFNvbHZlO1xuICAgIHZhciBpLGosajAsajEsayxKLE49MDtcbiAgICBmb3IoaT0wO2k8bTsrK2kpIHtcbiAgICAgICAgayA9IDA7XG4gICAgICAgIGowID0gQmlbaV07XG4gICAgICAgIGoxID0gQmlbaSsxXTtcbiAgICAgICAgZm9yKGo9ajA7ajxqMTsrK2opIHsgXG4gICAgICAgICAgICBKID0gTFVQLlBpbnZbQmpbal1dO1xuICAgICAgICAgICAgYmpba10gPSBKO1xuICAgICAgICAgICAgYltKXSA9IEJ2W2pdO1xuICAgICAgICAgICAgKytrO1xuICAgICAgICB9XG4gICAgICAgIGJqLmxlbmd0aCA9IGs7XG4gICAgICAgIHNvbChMLGIseCxiaix4aik7XG4gICAgICAgIGZvcihqPWJqLmxlbmd0aC0xO2ohPT0tMTstLWopIGJbYmpbal1dID0gMDtcbiAgICAgICAgc29sKFUseCxiLHhqLGJqKTtcbiAgICAgICAgaWYoZmxhZykgcmV0dXJuIGI7XG4gICAgICAgIGZvcihqPXhqLmxlbmd0aC0xO2ohPT0tMTstLWopIHhbeGpbal1dID0gMDtcbiAgICAgICAgZm9yKGo9YmoubGVuZ3RoLTE7aiE9PS0xOy0taikge1xuICAgICAgICAgICAgSiA9IGJqW2pdO1xuICAgICAgICAgICAgWGpbTl0gPSBKO1xuICAgICAgICAgICAgWHZbTl0gPSBiW0pdO1xuICAgICAgICAgICAgYltKXSA9IDA7XG4gICAgICAgICAgICArK047XG4gICAgICAgIH1cbiAgICAgICAgWGlbaSsxXSA9IE47XG4gICAgfVxuICAgIHJldHVybiBbWGksWGosWHZdO1xufVxuXG5udW1lcmljLmNjc2Jpbm9wID0gZnVuY3Rpb24gY2NzYmlub3AoYm9keSxzZXR1cCkge1xuICAgIGlmKHR5cGVvZiBzZXR1cCA9PT0gXCJ1bmRlZmluZWRcIikgc2V0dXA9Jyc7XG4gICAgcmV0dXJuIEZ1bmN0aW9uKCdYJywnWScsXG4gICAgICAgICAgICAndmFyIFhpID0gWFswXSwgWGogPSBYWzFdLCBYdiA9IFhbMl07XFxuJytcbiAgICAgICAgICAgICd2YXIgWWkgPSBZWzBdLCBZaiA9IFlbMV0sIFl2ID0gWVsyXTtcXG4nK1xuICAgICAgICAgICAgJ3ZhciBuID0gWGkubGVuZ3RoLTEsbSA9IE1hdGgubWF4KG51bWVyaWMuc3VwKFhqKSxudW1lcmljLnN1cChZaikpKzE7XFxuJytcbiAgICAgICAgICAgICd2YXIgWmkgPSBudW1lcmljLnJlcChbbisxXSwwKSwgWmogPSBbXSwgWnYgPSBbXTtcXG4nK1xuICAgICAgICAgICAgJ3ZhciB4ID0gbnVtZXJpYy5yZXAoW21dLDApLHkgPSBudW1lcmljLnJlcChbbV0sMCk7XFxuJytcbiAgICAgICAgICAgICd2YXIgeGsseWssems7XFxuJytcbiAgICAgICAgICAgICd2YXIgaSxqLGowLGoxLGsscD0wO1xcbicrXG4gICAgICAgICAgICBzZXR1cCtcbiAgICAgICAgICAgICdmb3IoaT0wO2k8bjsrK2kpIHtcXG4nK1xuICAgICAgICAgICAgJyAgajAgPSBYaVtpXTsgajEgPSBYaVtpKzFdO1xcbicrXG4gICAgICAgICAgICAnICBmb3Ioaj1qMDtqIT09ajE7KytqKSB7XFxuJytcbiAgICAgICAgICAgICcgICAgayA9IFhqW2pdO1xcbicrXG4gICAgICAgICAgICAnICAgIHhba10gPSAxO1xcbicrXG4gICAgICAgICAgICAnICAgIFpqW3BdID0gaztcXG4nK1xuICAgICAgICAgICAgJyAgICArK3A7XFxuJytcbiAgICAgICAgICAgICcgIH1cXG4nK1xuICAgICAgICAgICAgJyAgajAgPSBZaVtpXTsgajEgPSBZaVtpKzFdO1xcbicrXG4gICAgICAgICAgICAnICBmb3Ioaj1qMDtqIT09ajE7KytqKSB7XFxuJytcbiAgICAgICAgICAgICcgICAgayA9IFlqW2pdO1xcbicrXG4gICAgICAgICAgICAnICAgIHlba10gPSBZdltqXTtcXG4nK1xuICAgICAgICAgICAgJyAgICBpZih4W2tdID09PSAwKSB7XFxuJytcbiAgICAgICAgICAgICcgICAgICBaaltwXSA9IGs7XFxuJytcbiAgICAgICAgICAgICcgICAgICArK3A7XFxuJytcbiAgICAgICAgICAgICcgICAgfVxcbicrXG4gICAgICAgICAgICAnICB9XFxuJytcbiAgICAgICAgICAgICcgIFppW2krMV0gPSBwO1xcbicrXG4gICAgICAgICAgICAnICBqMCA9IFhpW2ldOyBqMSA9IFhpW2krMV07XFxuJytcbiAgICAgICAgICAgICcgIGZvcihqPWowO2ohPT1qMTsrK2opIHhbWGpbal1dID0gWHZbal07XFxuJytcbiAgICAgICAgICAgICcgIGowID0gWmlbaV07IGoxID0gWmlbaSsxXTtcXG4nK1xuICAgICAgICAgICAgJyAgZm9yKGo9ajA7aiE9PWoxOysraikge1xcbicrXG4gICAgICAgICAgICAnICAgIGsgPSBaaltqXTtcXG4nK1xuICAgICAgICAgICAgJyAgICB4ayA9IHhba107XFxuJytcbiAgICAgICAgICAgICcgICAgeWsgPSB5W2tdO1xcbicrXG4gICAgICAgICAgICBib2R5KydcXG4nK1xuICAgICAgICAgICAgJyAgICBadltqXSA9IHprO1xcbicrXG4gICAgICAgICAgICAnICB9XFxuJytcbiAgICAgICAgICAgICcgIGowID0gWGlbaV07IGoxID0gWGlbaSsxXTtcXG4nK1xuICAgICAgICAgICAgJyAgZm9yKGo9ajA7aiE9PWoxOysraikgeFtYaltqXV0gPSAwO1xcbicrXG4gICAgICAgICAgICAnICBqMCA9IFlpW2ldOyBqMSA9IFlpW2krMV07XFxuJytcbiAgICAgICAgICAgICcgIGZvcihqPWowO2ohPT1qMTsrK2opIHlbWWpbal1dID0gMDtcXG4nK1xuICAgICAgICAgICAgJ31cXG4nK1xuICAgICAgICAgICAgJ3JldHVybiBbWmksWmosWnZdOydcbiAgICAgICAgICAgICk7XG59O1xuXG4oZnVuY3Rpb24oKSB7XG4gICAgdmFyIGssQSxCLEM7XG4gICAgZm9yKGsgaW4gbnVtZXJpYy5vcHMyKSB7XG4gICAgICAgIGlmKGlzRmluaXRlKGV2YWwoJzEnK251bWVyaWMub3BzMltrXSsnMCcpKSkgQSA9ICdbWVswXSxZWzFdLG51bWVyaWMuJytrKycoWCxZWzJdKV0nO1xuICAgICAgICBlbHNlIEEgPSAnTmFOJztcbiAgICAgICAgaWYoaXNGaW5pdGUoZXZhbCgnMCcrbnVtZXJpYy5vcHMyW2tdKycxJykpKSBCID0gJ1tYWzBdLFhbMV0sbnVtZXJpYy4nK2srJyhYWzJdLFkpXSc7XG4gICAgICAgIGVsc2UgQiA9ICdOYU4nO1xuICAgICAgICBpZihpc0Zpbml0ZShldmFsKCcxJytudW1lcmljLm9wczJba10rJzAnKSkgJiYgaXNGaW5pdGUoZXZhbCgnMCcrbnVtZXJpYy5vcHMyW2tdKycxJykpKSBDID0gJ251bWVyaWMuY2NzJytrKydNTShYLFkpJztcbiAgICAgICAgZWxzZSBDID0gJ05hTic7XG4gICAgICAgIG51bWVyaWNbJ2NjcycraysnTU0nXSA9IG51bWVyaWMuY2NzYmlub3AoJ3prID0geGsgJytudW1lcmljLm9wczJba10rJ3lrOycpO1xuICAgICAgICBudW1lcmljWydjY3MnK2tdID0gRnVuY3Rpb24oJ1gnLCdZJyxcbiAgICAgICAgICAgICAgICAnaWYodHlwZW9mIFggPT09IFwibnVtYmVyXCIpIHJldHVybiAnK0ErJztcXG4nK1xuICAgICAgICAgICAgICAgICdpZih0eXBlb2YgWSA9PT0gXCJudW1iZXJcIikgcmV0dXJuICcrQisnO1xcbicrXG4gICAgICAgICAgICAgICAgJ3JldHVybiAnK0MrJztcXG4nXG4gICAgICAgICAgICAgICAgKTtcbiAgICB9XG59KCkpO1xuXG5udW1lcmljLmNjc1NjYXR0ZXIgPSBmdW5jdGlvbiBjY3NTY2F0dGVyKEEpIHtcbiAgICB2YXIgQWkgPSBBWzBdLCBBaiA9IEFbMV0sIEF2ID0gQVsyXTtcbiAgICB2YXIgbiA9IG51bWVyaWMuc3VwKEFqKSsxLG09QWkubGVuZ3RoO1xuICAgIHZhciBSaSA9IG51bWVyaWMucmVwKFtuXSwwKSxSaj1BcnJheShtKSwgUnYgPSBBcnJheShtKTtcbiAgICB2YXIgY291bnRzID0gbnVtZXJpYy5yZXAoW25dLDApLGk7XG4gICAgZm9yKGk9MDtpPG07KytpKSBjb3VudHNbQWpbaV1dKys7XG4gICAgZm9yKGk9MDtpPG47KytpKSBSaVtpKzFdID0gUmlbaV0gKyBjb3VudHNbaV07XG4gICAgdmFyIHB0ciA9IFJpLnNsaWNlKDApLGssQWlpO1xuICAgIGZvcihpPTA7aTxtOysraSkge1xuICAgICAgICBBaWkgPSBBaltpXTtcbiAgICAgICAgayA9IHB0cltBaWldO1xuICAgICAgICBSaltrXSA9IEFpW2ldO1xuICAgICAgICBSdltrXSA9IEF2W2ldO1xuICAgICAgICBwdHJbQWlpXT1wdHJbQWlpXSsxO1xuICAgIH1cbiAgICByZXR1cm4gW1JpLFJqLFJ2XTtcbn1cblxubnVtZXJpYy5jY3NHYXRoZXIgPSBmdW5jdGlvbiBjY3NHYXRoZXIoQSkge1xuICAgIHZhciBBaSA9IEFbMF0sIEFqID0gQVsxXSwgQXYgPSBBWzJdO1xuICAgIHZhciBuID0gQWkubGVuZ3RoLTEsbSA9IEFqLmxlbmd0aDtcbiAgICB2YXIgUmkgPSBBcnJheShtKSwgUmogPSBBcnJheShtKSwgUnYgPSBBcnJheShtKTtcbiAgICB2YXIgaSxqLGowLGoxLHA7XG4gICAgcD0wO1xuICAgIGZvcihpPTA7aTxuOysraSkge1xuICAgICAgICBqMCA9IEFpW2ldO1xuICAgICAgICBqMSA9IEFpW2krMV07XG4gICAgICAgIGZvcihqPWowO2ohPT1qMTsrK2opIHtcbiAgICAgICAgICAgIFJqW3BdID0gaTtcbiAgICAgICAgICAgIFJpW3BdID0gQWpbal07XG4gICAgICAgICAgICBSdltwXSA9IEF2W2pdO1xuICAgICAgICAgICAgKytwO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBbUmksUmosUnZdO1xufVxuXG4vLyBUaGUgZm9sbG93aW5nIHNwYXJzZSBsaW5lYXIgYWxnZWJyYSByb3V0aW5lcyBhcmUgZGVwcmVjYXRlZC5cblxubnVtZXJpYy5zZGltID0gZnVuY3Rpb24gZGltKEEscmV0LGspIHtcbiAgICBpZih0eXBlb2YgcmV0ID09PSBcInVuZGVmaW5lZFwiKSB7IHJldCA9IFtdOyB9XG4gICAgaWYodHlwZW9mIEEgIT09IFwib2JqZWN0XCIpIHJldHVybiByZXQ7XG4gICAgaWYodHlwZW9mIGsgPT09IFwidW5kZWZpbmVkXCIpIHsgaz0wOyB9XG4gICAgaWYoIShrIGluIHJldCkpIHsgcmV0W2tdID0gMDsgfVxuICAgIGlmKEEubGVuZ3RoID4gcmV0W2tdKSByZXRba10gPSBBLmxlbmd0aDtcbiAgICB2YXIgaTtcbiAgICBmb3IoaSBpbiBBKSB7XG4gICAgICAgIGlmKEEuaGFzT3duUHJvcGVydHkoaSkpIGRpbShBW2ldLHJldCxrKzEpO1xuICAgIH1cbiAgICByZXR1cm4gcmV0O1xufTtcblxubnVtZXJpYy5zY2xvbmUgPSBmdW5jdGlvbiBjbG9uZShBLGssbikge1xuICAgIGlmKHR5cGVvZiBrID09PSBcInVuZGVmaW5lZFwiKSB7IGs9MDsgfVxuICAgIGlmKHR5cGVvZiBuID09PSBcInVuZGVmaW5lZFwiKSB7IG4gPSBudW1lcmljLnNkaW0oQSkubGVuZ3RoOyB9XG4gICAgdmFyIGkscmV0ID0gQXJyYXkoQS5sZW5ndGgpO1xuICAgIGlmKGsgPT09IG4tMSkge1xuICAgICAgICBmb3IoaSBpbiBBKSB7IGlmKEEuaGFzT3duUHJvcGVydHkoaSkpIHJldFtpXSA9IEFbaV07IH1cbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9XG4gICAgZm9yKGkgaW4gQSkge1xuICAgICAgICBpZihBLmhhc093blByb3BlcnR5KGkpKSByZXRbaV0gPSBjbG9uZShBW2ldLGsrMSxuKTtcbiAgICB9XG4gICAgcmV0dXJuIHJldDtcbn1cblxubnVtZXJpYy5zZGlhZyA9IGZ1bmN0aW9uIGRpYWcoZCkge1xuICAgIHZhciBuID0gZC5sZW5ndGgsaSxyZXQgPSBBcnJheShuKSxpMSxpMixpMztcbiAgICBmb3IoaT1uLTE7aT49MTtpLT0yKSB7XG4gICAgICAgIGkxID0gaS0xO1xuICAgICAgICByZXRbaV0gPSBbXTsgcmV0W2ldW2ldID0gZFtpXTtcbiAgICAgICAgcmV0W2kxXSA9IFtdOyByZXRbaTFdW2kxXSA9IGRbaTFdO1xuICAgIH1cbiAgICBpZihpPT09MCkgeyByZXRbMF0gPSBbXTsgcmV0WzBdWzBdID0gZFtpXTsgfVxuICAgIHJldHVybiByZXQ7XG59XG5cbm51bWVyaWMuc2lkZW50aXR5ID0gZnVuY3Rpb24gaWRlbnRpdHkobikgeyByZXR1cm4gbnVtZXJpYy5zZGlhZyhudW1lcmljLnJlcChbbl0sMSkpOyB9XG5cbm51bWVyaWMuc3RyYW5zcG9zZSA9IGZ1bmN0aW9uIHRyYW5zcG9zZShBKSB7XG4gICAgdmFyIHJldCA9IFtdLCBuID0gQS5sZW5ndGgsIGksaixBaTtcbiAgICBmb3IoaSBpbiBBKSB7XG4gICAgICAgIGlmKCEoQS5oYXNPd25Qcm9wZXJ0eShpKSkpIGNvbnRpbnVlO1xuICAgICAgICBBaSA9IEFbaV07XG4gICAgICAgIGZvcihqIGluIEFpKSB7XG4gICAgICAgICAgICBpZighKEFpLmhhc093blByb3BlcnR5KGopKSkgY29udGludWU7XG4gICAgICAgICAgICBpZih0eXBlb2YgcmV0W2pdICE9PSBcIm9iamVjdFwiKSB7IHJldFtqXSA9IFtdOyB9XG4gICAgICAgICAgICByZXRbal1baV0gPSBBaVtqXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmV0O1xufVxuXG5udW1lcmljLnNMVVAgPSBmdW5jdGlvbiBMVVAoQSx0b2wpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJUaGUgZnVuY3Rpb24gbnVtZXJpYy5zTFVQIGhhZCBhIGJ1ZyBpbiBpdCBhbmQgaGFzIGJlZW4gcmVtb3ZlZC4gUGxlYXNlIHVzZSB0aGUgbmV3IG51bWVyaWMuY2NzTFVQIGZ1bmN0aW9uIGluc3RlYWQuXCIpO1xufTtcblxubnVtZXJpYy5zZG90TU0gPSBmdW5jdGlvbiBkb3RNTShBLEIpIHtcbiAgICB2YXIgcCA9IEEubGVuZ3RoLCBxID0gQi5sZW5ndGgsIEJUID0gbnVtZXJpYy5zdHJhbnNwb3NlKEIpLCByID0gQlQubGVuZ3RoLCBBaSwgQlRrO1xuICAgIHZhciBpLGosayxhY2N1bTtcbiAgICB2YXIgcmV0ID0gQXJyYXkocCkscmV0aTtcbiAgICBmb3IoaT1wLTE7aT49MDtpLS0pIHtcbiAgICAgICAgcmV0aSA9IFtdO1xuICAgICAgICBBaSA9IEFbaV07XG4gICAgICAgIGZvcihrPXItMTtrPj0wO2stLSkge1xuICAgICAgICAgICAgYWNjdW0gPSAwO1xuICAgICAgICAgICAgQlRrID0gQlRba107XG4gICAgICAgICAgICBmb3IoaiBpbiBBaSkge1xuICAgICAgICAgICAgICAgIGlmKCEoQWkuaGFzT3duUHJvcGVydHkoaikpKSBjb250aW51ZTtcbiAgICAgICAgICAgICAgICBpZihqIGluIEJUaykgeyBhY2N1bSArPSBBaVtqXSpCVGtbal07IH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmKGFjY3VtKSByZXRpW2tdID0gYWNjdW07XG4gICAgICAgIH1cbiAgICAgICAgcmV0W2ldID0gcmV0aTtcbiAgICB9XG4gICAgcmV0dXJuIHJldDtcbn1cblxubnVtZXJpYy5zZG90TVYgPSBmdW5jdGlvbiBkb3RNVihBLHgpIHtcbiAgICB2YXIgcCA9IEEubGVuZ3RoLCBBaSwgaSxqO1xuICAgIHZhciByZXQgPSBBcnJheShwKSwgYWNjdW07XG4gICAgZm9yKGk9cC0xO2k+PTA7aS0tKSB7XG4gICAgICAgIEFpID0gQVtpXTtcbiAgICAgICAgYWNjdW0gPSAwO1xuICAgICAgICBmb3IoaiBpbiBBaSkge1xuICAgICAgICAgICAgaWYoIShBaS5oYXNPd25Qcm9wZXJ0eShqKSkpIGNvbnRpbnVlO1xuICAgICAgICAgICAgaWYoeFtqXSkgYWNjdW0gKz0gQWlbal0qeFtqXTtcbiAgICAgICAgfVxuICAgICAgICBpZihhY2N1bSkgcmV0W2ldID0gYWNjdW07XG4gICAgfVxuICAgIHJldHVybiByZXQ7XG59XG5cbm51bWVyaWMuc2RvdFZNID0gZnVuY3Rpb24gZG90TVYoeCxBKSB7XG4gICAgdmFyIGksaixBaSxhbHBoYTtcbiAgICB2YXIgcmV0ID0gW10sIGFjY3VtO1xuICAgIGZvcihpIGluIHgpIHtcbiAgICAgICAgaWYoIXguaGFzT3duUHJvcGVydHkoaSkpIGNvbnRpbnVlO1xuICAgICAgICBBaSA9IEFbaV07XG4gICAgICAgIGFscGhhID0geFtpXTtcbiAgICAgICAgZm9yKGogaW4gQWkpIHtcbiAgICAgICAgICAgIGlmKCFBaS5oYXNPd25Qcm9wZXJ0eShqKSkgY29udGludWU7XG4gICAgICAgICAgICBpZighcmV0W2pdKSB7IHJldFtqXSA9IDA7IH1cbiAgICAgICAgICAgIHJldFtqXSArPSBhbHBoYSpBaVtqXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmV0O1xufVxuXG5udW1lcmljLnNkb3RWViA9IGZ1bmN0aW9uIGRvdFZWKHgseSkge1xuICAgIHZhciBpLHJldD0wO1xuICAgIGZvcihpIGluIHgpIHsgaWYoeFtpXSAmJiB5W2ldKSByZXQrPSB4W2ldKnlbaV07IH1cbiAgICByZXR1cm4gcmV0O1xufVxuXG5udW1lcmljLnNkb3QgPSBmdW5jdGlvbiBkb3QoQSxCKSB7XG4gICAgdmFyIG0gPSBudW1lcmljLnNkaW0oQSkubGVuZ3RoLCBuID0gbnVtZXJpYy5zZGltKEIpLmxlbmd0aDtcbiAgICB2YXIgayA9IG0qMTAwMCtuO1xuICAgIHN3aXRjaChrKSB7XG4gICAgY2FzZSAwOiByZXR1cm4gQSpCO1xuICAgIGNhc2UgMTAwMTogcmV0dXJuIG51bWVyaWMuc2RvdFZWKEEsQik7XG4gICAgY2FzZSAyMDAxOiByZXR1cm4gbnVtZXJpYy5zZG90TVYoQSxCKTtcbiAgICBjYXNlIDEwMDI6IHJldHVybiBudW1lcmljLnNkb3RWTShBLEIpO1xuICAgIGNhc2UgMjAwMjogcmV0dXJuIG51bWVyaWMuc2RvdE1NKEEsQik7XG4gICAgZGVmYXVsdDogdGhyb3cgbmV3IEVycm9yKCdudW1lcmljLnNkb3Qgbm90IGltcGxlbWVudGVkIGZvciB0ZW5zb3JzIG9mIG9yZGVyICcrbSsnIGFuZCAnK24pO1xuICAgIH1cbn1cblxubnVtZXJpYy5zc2NhdHRlciA9IGZ1bmN0aW9uIHNjYXR0ZXIoVikge1xuICAgIHZhciBuID0gVlswXS5sZW5ndGgsIFZpaiwgaSwgaiwgbSA9IFYubGVuZ3RoLCBBID0gW10sIEFqO1xuICAgIGZvcihpPW4tMTtpPj0wOy0taSkge1xuICAgICAgICBpZighVlttLTFdW2ldKSBjb250aW51ZTtcbiAgICAgICAgQWogPSBBO1xuICAgICAgICBmb3Ioaj0wO2o8bS0yO2orKykge1xuICAgICAgICAgICAgVmlqID0gVltqXVtpXTtcbiAgICAgICAgICAgIGlmKCFBaltWaWpdKSBBaltWaWpdID0gW107XG4gICAgICAgICAgICBBaiA9IEFqW1Zpal07XG4gICAgICAgIH1cbiAgICAgICAgQWpbVltqXVtpXV0gPSBWW2orMV1baV07XG4gICAgfVxuICAgIHJldHVybiBBO1xufVxuXG5udW1lcmljLnNnYXRoZXIgPSBmdW5jdGlvbiBnYXRoZXIoQSxyZXQsaykge1xuICAgIGlmKHR5cGVvZiByZXQgPT09IFwidW5kZWZpbmVkXCIpIHJldCA9IFtdO1xuICAgIGlmKHR5cGVvZiBrID09PSBcInVuZGVmaW5lZFwiKSBrID0gW107XG4gICAgdmFyIG4saSxBaTtcbiAgICBuID0gay5sZW5ndGg7XG4gICAgZm9yKGkgaW4gQSkge1xuICAgICAgICBpZihBLmhhc093blByb3BlcnR5KGkpKSB7XG4gICAgICAgICAgICBrW25dID0gcGFyc2VJbnQoaSk7XG4gICAgICAgICAgICBBaSA9IEFbaV07XG4gICAgICAgICAgICBpZih0eXBlb2YgQWkgPT09IFwibnVtYmVyXCIpIHtcbiAgICAgICAgICAgICAgICBpZihBaSkge1xuICAgICAgICAgICAgICAgICAgICBpZihyZXQubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IoaT1uKzE7aT49MDstLWkpIHJldFtpXSA9IFtdO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGZvcihpPW47aT49MDstLWkpIHJldFtpXS5wdXNoKGtbaV0pO1xuICAgICAgICAgICAgICAgICAgICByZXRbbisxXS5wdXNoKEFpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgZ2F0aGVyKEFpLHJldCxrKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZihrLmxlbmd0aD5uKSBrLnBvcCgpO1xuICAgIHJldHVybiByZXQ7XG59XG5cbi8vIDYuIENvb3JkaW5hdGUgbWF0cmljZXNcbm51bWVyaWMuY0xVID0gZnVuY3Rpb24gTFUoQSkge1xuICAgIHZhciBJID0gQVswXSwgSiA9IEFbMV0sIFYgPSBBWzJdO1xuICAgIHZhciBwID0gSS5sZW5ndGgsIG09MCwgaSxqLGssYSxiLGM7XG4gICAgZm9yKGk9MDtpPHA7aSsrKSBpZihJW2ldPm0pIG09SVtpXTtcbiAgICBtKys7XG4gICAgdmFyIEwgPSBBcnJheShtKSwgVSA9IEFycmF5KG0pLCBsZWZ0ID0gbnVtZXJpYy5yZXAoW21dLEluZmluaXR5KSwgcmlnaHQgPSBudW1lcmljLnJlcChbbV0sLUluZmluaXR5KTtcbiAgICB2YXIgVWksIFVqLGFscGhhO1xuICAgIGZvcihrPTA7azxwO2srKykge1xuICAgICAgICBpID0gSVtrXTtcbiAgICAgICAgaiA9IEpba107XG4gICAgICAgIGlmKGo8bGVmdFtpXSkgbGVmdFtpXSA9IGo7XG4gICAgICAgIGlmKGo+cmlnaHRbaV0pIHJpZ2h0W2ldID0gajtcbiAgICB9XG4gICAgZm9yKGk9MDtpPG0tMTtpKyspIHsgaWYocmlnaHRbaV0gPiByaWdodFtpKzFdKSByaWdodFtpKzFdID0gcmlnaHRbaV07IH1cbiAgICBmb3IoaT1tLTE7aT49MTtpLS0pIHsgaWYobGVmdFtpXTxsZWZ0W2ktMV0pIGxlZnRbaS0xXSA9IGxlZnRbaV07IH1cbiAgICB2YXIgY291bnRMID0gMCwgY291bnRVID0gMDtcbiAgICBmb3IoaT0wO2k8bTtpKyspIHtcbiAgICAgICAgVVtpXSA9IG51bWVyaWMucmVwKFtyaWdodFtpXS1sZWZ0W2ldKzFdLDApO1xuICAgICAgICBMW2ldID0gbnVtZXJpYy5yZXAoW2ktbGVmdFtpXV0sMCk7XG4gICAgICAgIGNvdW50TCArPSBpLWxlZnRbaV0rMTtcbiAgICAgICAgY291bnRVICs9IHJpZ2h0W2ldLWkrMTtcbiAgICB9XG4gICAgZm9yKGs9MDtrPHA7aysrKSB7IGkgPSBJW2tdOyBVW2ldW0pba10tbGVmdFtpXV0gPSBWW2tdOyB9XG4gICAgZm9yKGk9MDtpPG0tMTtpKyspIHtcbiAgICAgICAgYSA9IGktbGVmdFtpXTtcbiAgICAgICAgVWkgPSBVW2ldO1xuICAgICAgICBmb3Ioaj1pKzE7bGVmdFtqXTw9aSAmJiBqPG07aisrKSB7XG4gICAgICAgICAgICBiID0gaS1sZWZ0W2pdO1xuICAgICAgICAgICAgYyA9IHJpZ2h0W2ldLWk7XG4gICAgICAgICAgICBVaiA9IFVbal07XG4gICAgICAgICAgICBhbHBoYSA9IFVqW2JdL1VpW2FdO1xuICAgICAgICAgICAgaWYoYWxwaGEpIHtcbiAgICAgICAgICAgICAgICBmb3Ioaz0xO2s8PWM7aysrKSB7IFVqW2srYl0gLT0gYWxwaGEqVWlbaythXTsgfVxuICAgICAgICAgICAgICAgIExbal1baS1sZWZ0W2pdXSA9IGFscGhhO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIHZhciBVaSA9IFtdLCBVaiA9IFtdLCBVdiA9IFtdLCBMaSA9IFtdLCBMaiA9IFtdLCBMdiA9IFtdO1xuICAgIHZhciBwLHEsZm9vO1xuICAgIHA9MDsgcT0wO1xuICAgIGZvcihpPTA7aTxtO2krKykge1xuICAgICAgICBhID0gbGVmdFtpXTtcbiAgICAgICAgYiA9IHJpZ2h0W2ldO1xuICAgICAgICBmb28gPSBVW2ldO1xuICAgICAgICBmb3Ioaj1pO2o8PWI7aisrKSB7XG4gICAgICAgICAgICBpZihmb29bai1hXSkge1xuICAgICAgICAgICAgICAgIFVpW3BdID0gaTtcbiAgICAgICAgICAgICAgICBValtwXSA9IGo7XG4gICAgICAgICAgICAgICAgVXZbcF0gPSBmb29bai1hXTtcbiAgICAgICAgICAgICAgICBwKys7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZm9vID0gTFtpXTtcbiAgICAgICAgZm9yKGo9YTtqPGk7aisrKSB7XG4gICAgICAgICAgICBpZihmb29bai1hXSkge1xuICAgICAgICAgICAgICAgIExpW3FdID0gaTtcbiAgICAgICAgICAgICAgICBMaltxXSA9IGo7XG4gICAgICAgICAgICAgICAgTHZbcV0gPSBmb29bai1hXTtcbiAgICAgICAgICAgICAgICBxKys7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgTGlbcV0gPSBpO1xuICAgICAgICBMaltxXSA9IGk7XG4gICAgICAgIEx2W3FdID0gMTtcbiAgICAgICAgcSsrO1xuICAgIH1cbiAgICByZXR1cm4ge1U6W1VpLFVqLFV2XSwgTDpbTGksTGosTHZdfTtcbn07XG5cbm51bWVyaWMuY0xVc29sdmUgPSBmdW5jdGlvbiBMVXNvbHZlKGx1LGIpIHtcbiAgICB2YXIgTCA9IGx1LkwsIFUgPSBsdS5VLCByZXQgPSBudW1lcmljLmNsb25lKGIpO1xuICAgIHZhciBMaSA9IExbMF0sIExqID0gTFsxXSwgTHYgPSBMWzJdO1xuICAgIHZhciBVaSA9IFVbMF0sIFVqID0gVVsxXSwgVXYgPSBVWzJdO1xuICAgIHZhciBwID0gVWkubGVuZ3RoLCBxID0gTGkubGVuZ3RoO1xuICAgIHZhciBtID0gcmV0Lmxlbmd0aCxpLGosaztcbiAgICBrID0gMDtcbiAgICBmb3IoaT0wO2k8bTtpKyspIHtcbiAgICAgICAgd2hpbGUoTGpba10gPCBpKSB7XG4gICAgICAgICAgICByZXRbaV0gLT0gTHZba10qcmV0W0xqW2tdXTtcbiAgICAgICAgICAgIGsrKztcbiAgICAgICAgfVxuICAgICAgICBrKys7XG4gICAgfVxuICAgIGsgPSBwLTE7XG4gICAgZm9yKGk9bS0xO2k+PTA7aS0tKSB7XG4gICAgICAgIHdoaWxlKFVqW2tdID4gaSkge1xuICAgICAgICAgICAgcmV0W2ldIC09IFV2W2tdKnJldFtValtrXV07XG4gICAgICAgICAgICBrLS07XG4gICAgICAgIH1cbiAgICAgICAgcmV0W2ldIC89IFV2W2tdO1xuICAgICAgICBrLS07XG4gICAgfVxuICAgIHJldHVybiByZXQ7XG59O1xuXG5udW1lcmljLmNncmlkID0gZnVuY3Rpb24gZ3JpZChuLHNoYXBlKSB7XG4gICAgaWYodHlwZW9mIG4gPT09IFwibnVtYmVyXCIpIG4gPSBbbixuXTtcbiAgICB2YXIgcmV0ID0gbnVtZXJpYy5yZXAobiwtMSk7XG4gICAgdmFyIGksaixjb3VudDtcbiAgICBpZih0eXBlb2Ygc2hhcGUgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICBzd2l0Y2goc2hhcGUpIHtcbiAgICAgICAgY2FzZSAnTCc6XG4gICAgICAgICAgICBzaGFwZSA9IGZ1bmN0aW9uKGksaikgeyByZXR1cm4gKGk+PW5bMF0vMiB8fCBqPG5bMV0vMik7IH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgc2hhcGUgPSBmdW5jdGlvbihpLGopIHsgcmV0dXJuIHRydWU7IH07XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cbiAgICBjb3VudD0wO1xuICAgIGZvcihpPTE7aTxuWzBdLTE7aSsrKSBmb3Ioaj0xO2o8blsxXS0xO2orKykgXG4gICAgICAgIGlmKHNoYXBlKGksaikpIHtcbiAgICAgICAgICAgIHJldFtpXVtqXSA9IGNvdW50O1xuICAgICAgICAgICAgY291bnQrKztcbiAgICAgICAgfVxuICAgIHJldHVybiByZXQ7XG59XG5cbm51bWVyaWMuY2RlbHNxID0gZnVuY3Rpb24gZGVsc3EoZykge1xuICAgIHZhciBkaXIgPSBbWy0xLDBdLFswLC0xXSxbMCwxXSxbMSwwXV07XG4gICAgdmFyIHMgPSBudW1lcmljLmRpbShnKSwgbSA9IHNbMF0sIG4gPSBzWzFdLCBpLGosayxwLHE7XG4gICAgdmFyIExpID0gW10sIExqID0gW10sIEx2ID0gW107XG4gICAgZm9yKGk9MTtpPG0tMTtpKyspIGZvcihqPTE7ajxuLTE7aisrKSB7XG4gICAgICAgIGlmKGdbaV1bal08MCkgY29udGludWU7XG4gICAgICAgIGZvcihrPTA7azw0O2srKykge1xuICAgICAgICAgICAgcCA9IGkrZGlyW2tdWzBdO1xuICAgICAgICAgICAgcSA9IGorZGlyW2tdWzFdO1xuICAgICAgICAgICAgaWYoZ1twXVtxXTwwKSBjb250aW51ZTtcbiAgICAgICAgICAgIExpLnB1c2goZ1tpXVtqXSk7XG4gICAgICAgICAgICBMai5wdXNoKGdbcF1bcV0pO1xuICAgICAgICAgICAgTHYucHVzaCgtMSk7XG4gICAgICAgIH1cbiAgICAgICAgTGkucHVzaChnW2ldW2pdKTtcbiAgICAgICAgTGoucHVzaChnW2ldW2pdKTtcbiAgICAgICAgTHYucHVzaCg0KTtcbiAgICB9XG4gICAgcmV0dXJuIFtMaSxMaixMdl07XG59XG5cbm51bWVyaWMuY2RvdE1WID0gZnVuY3Rpb24gZG90TVYoQSx4KSB7XG4gICAgdmFyIHJldCwgQWkgPSBBWzBdLCBBaiA9IEFbMV0sIEF2ID0gQVsyXSxrLHA9QWkubGVuZ3RoLE47XG4gICAgTj0wO1xuICAgIGZvcihrPTA7azxwO2srKykgeyBpZihBaVtrXT5OKSBOID0gQWlba107IH1cbiAgICBOKys7XG4gICAgcmV0ID0gbnVtZXJpYy5yZXAoW05dLDApO1xuICAgIGZvcihrPTA7azxwO2srKykgeyByZXRbQWlba11dKz1BdltrXSp4W0FqW2tdXTsgfVxuICAgIHJldHVybiByZXQ7XG59XG5cbi8vIDcuIFNwbGluZXNcblxubnVtZXJpYy5TcGxpbmUgPSBmdW5jdGlvbiBTcGxpbmUoeCx5bCx5cixrbCxrcikgeyB0aGlzLnggPSB4OyB0aGlzLnlsID0geWw7IHRoaXMueXIgPSB5cjsgdGhpcy5rbCA9IGtsOyB0aGlzLmtyID0ga3I7IH1cbm51bWVyaWMuU3BsaW5lLnByb3RvdHlwZS5fYXQgPSBmdW5jdGlvbiBfYXQoeDEscCkge1xuICAgIHZhciB4ID0gdGhpcy54O1xuICAgIHZhciB5bCA9IHRoaXMueWw7XG4gICAgdmFyIHlyID0gdGhpcy55cjtcbiAgICB2YXIga2wgPSB0aGlzLmtsO1xuICAgIHZhciBrciA9IHRoaXMua3I7XG4gICAgdmFyIHgxLGEsYix0O1xuICAgIHZhciBhZGQgPSBudW1lcmljLmFkZCwgc3ViID0gbnVtZXJpYy5zdWIsIG11bCA9IG51bWVyaWMubXVsO1xuICAgIGEgPSBzdWIobXVsKGtsW3BdLHhbcCsxXS14W3BdKSxzdWIoeXJbcCsxXSx5bFtwXSkpO1xuICAgIGIgPSBhZGQobXVsKGtyW3ArMV0seFtwXS14W3ArMV0pLHN1Yih5cltwKzFdLHlsW3BdKSk7XG4gICAgdCA9ICh4MS14W3BdKS8oeFtwKzFdLXhbcF0pO1xuICAgIHZhciBzID0gdCooMS10KTtcbiAgICByZXR1cm4gYWRkKGFkZChhZGQobXVsKDEtdCx5bFtwXSksbXVsKHQseXJbcCsxXSkpLG11bChhLHMqKDEtdCkpKSxtdWwoYixzKnQpKTtcbn1cbm51bWVyaWMuU3BsaW5lLnByb3RvdHlwZS5hdCA9IGZ1bmN0aW9uIGF0KHgwKSB7XG4gICAgaWYodHlwZW9mIHgwID09PSBcIm51bWJlclwiKSB7XG4gICAgICAgIHZhciB4ID0gdGhpcy54O1xuICAgICAgICB2YXIgbiA9IHgubGVuZ3RoO1xuICAgICAgICB2YXIgcCxxLG1pZCxmbG9vciA9IE1hdGguZmxvb3IsYSxiLHQ7XG4gICAgICAgIHAgPSAwO1xuICAgICAgICBxID0gbi0xO1xuICAgICAgICB3aGlsZShxLXA+MSkge1xuICAgICAgICAgICAgbWlkID0gZmxvb3IoKHArcSkvMik7XG4gICAgICAgICAgICBpZih4W21pZF0gPD0geDApIHAgPSBtaWQ7XG4gICAgICAgICAgICBlbHNlIHEgPSBtaWQ7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuX2F0KHgwLHApO1xuICAgIH1cbiAgICB2YXIgbiA9IHgwLmxlbmd0aCwgaSwgcmV0ID0gQXJyYXkobik7XG4gICAgZm9yKGk9bi0xO2khPT0tMTstLWkpIHJldFtpXSA9IHRoaXMuYXQoeDBbaV0pO1xuICAgIHJldHVybiByZXQ7XG59XG5udW1lcmljLlNwbGluZS5wcm90b3R5cGUuZGlmZiA9IGZ1bmN0aW9uIGRpZmYoKSB7XG4gICAgdmFyIHggPSB0aGlzLng7XG4gICAgdmFyIHlsID0gdGhpcy55bDtcbiAgICB2YXIgeXIgPSB0aGlzLnlyO1xuICAgIHZhciBrbCA9IHRoaXMua2w7XG4gICAgdmFyIGtyID0gdGhpcy5rcjtcbiAgICB2YXIgbiA9IHlsLmxlbmd0aDtcbiAgICB2YXIgaSxkeCxkeTtcbiAgICB2YXIgemwgPSBrbCwgenIgPSBrciwgcGwgPSBBcnJheShuKSwgcHIgPSBBcnJheShuKTtcbiAgICB2YXIgYWRkID0gbnVtZXJpYy5hZGQsIG11bCA9IG51bWVyaWMubXVsLCBkaXYgPSBudW1lcmljLmRpdiwgc3ViID0gbnVtZXJpYy5zdWI7XG4gICAgZm9yKGk9bi0xO2khPT0tMTstLWkpIHtcbiAgICAgICAgZHggPSB4W2krMV0teFtpXTtcbiAgICAgICAgZHkgPSBzdWIoeXJbaSsxXSx5bFtpXSk7XG4gICAgICAgIHBsW2ldID0gZGl2KGFkZChtdWwoZHksIDYpLG11bChrbFtpXSwtNCpkeCksbXVsKGtyW2krMV0sLTIqZHgpKSxkeCpkeCk7XG4gICAgICAgIHByW2krMV0gPSBkaXYoYWRkKG11bChkeSwtNiksbXVsKGtsW2ldLCAyKmR4KSxtdWwoa3JbaSsxXSwgNCpkeCkpLGR4KmR4KTtcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBudW1lcmljLlNwbGluZSh4LHpsLHpyLHBsLHByKTtcbn1cbm51bWVyaWMuU3BsaW5lLnByb3RvdHlwZS5yb290cyA9IGZ1bmN0aW9uIHJvb3RzKCkge1xuICAgIGZ1bmN0aW9uIHNxcih4KSB7IHJldHVybiB4Kng7IH1cbiAgICBmdW5jdGlvbiBoZXZhbCh5MCx5MSxrMCxrMSx4KSB7XG4gICAgICAgIHZhciBBID0gazAqMi0oeTEteTApO1xuICAgICAgICB2YXIgQiA9IC1rMSoyKyh5MS15MCk7XG4gICAgICAgIHZhciB0ID0gKHgrMSkqMC41O1xuICAgICAgICB2YXIgcyA9IHQqKDEtdCk7XG4gICAgICAgIHJldHVybiAoMS10KSp5MCt0KnkxK0EqcyooMS10KStCKnMqdDtcbiAgICB9XG4gICAgdmFyIHJldCA9IFtdO1xuICAgIHZhciB4ID0gdGhpcy54LCB5bCA9IHRoaXMueWwsIHlyID0gdGhpcy55ciwga2wgPSB0aGlzLmtsLCBrciA9IHRoaXMua3I7XG4gICAgaWYodHlwZW9mIHlsWzBdID09PSBcIm51bWJlclwiKSB7XG4gICAgICAgIHlsID0gW3lsXTtcbiAgICAgICAgeXIgPSBbeXJdO1xuICAgICAgICBrbCA9IFtrbF07XG4gICAgICAgIGtyID0gW2tyXTtcbiAgICB9XG4gICAgdmFyIG0gPSB5bC5sZW5ndGgsbj14Lmxlbmd0aC0xLGksaixrLHkscyx0O1xuICAgIHZhciBhaSxiaSxjaSxkaSwgcmV0ID0gQXJyYXkobSkscmksazAsazEseTAseTEsQSxCLEQsZHgsY3gsc3RvcHMsejAsejEsem0sdDAsdDEsdG07XG4gICAgdmFyIHNxcnQgPSBNYXRoLnNxcnQ7XG4gICAgZm9yKGk9MDtpIT09bTsrK2kpIHtcbiAgICAgICAgYWkgPSB5bFtpXTtcbiAgICAgICAgYmkgPSB5cltpXTtcbiAgICAgICAgY2kgPSBrbFtpXTtcbiAgICAgICAgZGkgPSBrcltpXTtcbiAgICAgICAgcmkgPSBbXTtcbiAgICAgICAgZm9yKGo9MDtqIT09bjtqKyspIHtcbiAgICAgICAgICAgIGlmKGo+MCAmJiBiaVtqXSphaVtqXTwwKSByaS5wdXNoKHhbal0pO1xuICAgICAgICAgICAgZHggPSAoeFtqKzFdLXhbal0pO1xuICAgICAgICAgICAgY3ggPSB4W2pdO1xuICAgICAgICAgICAgeTAgPSBhaVtqXTtcbiAgICAgICAgICAgIHkxID0gYmlbaisxXTtcbiAgICAgICAgICAgIGswID0gY2lbal0vZHg7XG4gICAgICAgICAgICBrMSA9IGRpW2orMV0vZHg7XG4gICAgICAgICAgICBEID0gc3FyKGswLWsxKzMqKHkwLXkxKSkgKyAxMiprMSp5MDtcbiAgICAgICAgICAgIEEgPSBrMSszKnkwKzIqazAtMyp5MTtcbiAgICAgICAgICAgIEIgPSAzKihrMStrMCsyKih5MC15MSkpO1xuICAgICAgICAgICAgaWYoRDw9MCkge1xuICAgICAgICAgICAgICAgIHowID0gQS9CO1xuICAgICAgICAgICAgICAgIGlmKHowPnhbal0gJiYgejA8eFtqKzFdKSBzdG9wcyA9IFt4W2pdLHowLHhbaisxXV07XG4gICAgICAgICAgICAgICAgZWxzZSBzdG9wcyA9IFt4W2pdLHhbaisxXV07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHowID0gKEEtc3FydChEKSkvQjtcbiAgICAgICAgICAgICAgICB6MSA9IChBK3NxcnQoRCkpL0I7XG4gICAgICAgICAgICAgICAgc3RvcHMgPSBbeFtqXV07XG4gICAgICAgICAgICAgICAgaWYoejA+eFtqXSAmJiB6MDx4W2orMV0pIHN0b3BzLnB1c2goejApO1xuICAgICAgICAgICAgICAgIGlmKHoxPnhbal0gJiYgejE8eFtqKzFdKSBzdG9wcy5wdXNoKHoxKTtcbiAgICAgICAgICAgICAgICBzdG9wcy5wdXNoKHhbaisxXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0MCA9IHN0b3BzWzBdO1xuICAgICAgICAgICAgejAgPSB0aGlzLl9hdCh0MCxqKTtcbiAgICAgICAgICAgIGZvcihrPTA7azxzdG9wcy5sZW5ndGgtMTtrKyspIHtcbiAgICAgICAgICAgICAgICB0MSA9IHN0b3BzW2srMV07XG4gICAgICAgICAgICAgICAgejEgPSB0aGlzLl9hdCh0MSxqKTtcbiAgICAgICAgICAgICAgICBpZih6MCA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICByaS5wdXNoKHQwKTsgXG4gICAgICAgICAgICAgICAgICAgIHQwID0gdDE7XG4gICAgICAgICAgICAgICAgICAgIHowID0gejE7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZih6MSA9PT0gMCB8fCB6MCp6MT4wKSB7XG4gICAgICAgICAgICAgICAgICAgIHQwID0gdDE7XG4gICAgICAgICAgICAgICAgICAgIHowID0gejE7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgc2lkZSA9IDA7XG4gICAgICAgICAgICAgICAgd2hpbGUoMSkge1xuICAgICAgICAgICAgICAgICAgICB0bSA9ICh6MCp0MS16MSp0MCkvKHowLXoxKTtcbiAgICAgICAgICAgICAgICAgICAgaWYodG0gPD0gdDAgfHwgdG0gPj0gdDEpIHsgYnJlYWs7IH1cbiAgICAgICAgICAgICAgICAgICAgem0gPSB0aGlzLl9hdCh0bSxqKTtcbiAgICAgICAgICAgICAgICAgICAgaWYoem0qejE+MCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdDEgPSB0bTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHoxID0gem07XG4gICAgICAgICAgICAgICAgICAgICAgICBpZihzaWRlID09PSAtMSkgejAqPTAuNTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNpZGUgPSAtMTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmKHptKnowPjApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHQwID0gdG07XG4gICAgICAgICAgICAgICAgICAgICAgICB6MCA9IHptO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYoc2lkZSA9PT0gMSkgejEqPTAuNTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNpZGUgPSAxO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJpLnB1c2godG0pO1xuICAgICAgICAgICAgICAgIHQwID0gc3RvcHNbaysxXTtcbiAgICAgICAgICAgICAgICB6MCA9IHRoaXMuX2F0KHQwLCBqKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmKHoxID09PSAwKSByaS5wdXNoKHQxKTtcbiAgICAgICAgfVxuICAgICAgICByZXRbaV0gPSByaTtcbiAgICB9XG4gICAgaWYodHlwZW9mIHRoaXMueWxbMF0gPT09IFwibnVtYmVyXCIpIHJldHVybiByZXRbMF07XG4gICAgcmV0dXJuIHJldDtcbn1cbm51bWVyaWMuc3BsaW5lID0gZnVuY3Rpb24gc3BsaW5lKHgseSxrMSxrbikge1xuICAgIHZhciBuID0geC5sZW5ndGgsIGIgPSBbXSwgZHggPSBbXSwgZHkgPSBbXTtcbiAgICB2YXIgaTtcbiAgICB2YXIgc3ViID0gbnVtZXJpYy5zdWIsbXVsID0gbnVtZXJpYy5tdWwsYWRkID0gbnVtZXJpYy5hZGQ7XG4gICAgZm9yKGk9bi0yO2k+PTA7aS0tKSB7IGR4W2ldID0geFtpKzFdLXhbaV07IGR5W2ldID0gc3ViKHlbaSsxXSx5W2ldKTsgfVxuICAgIGlmKHR5cGVvZiBrMSA9PT0gXCJzdHJpbmdcIiB8fCB0eXBlb2Yga24gPT09IFwic3RyaW5nXCIpIHsgXG4gICAgICAgIGsxID0ga24gPSBcInBlcmlvZGljXCI7XG4gICAgfVxuICAgIC8vIEJ1aWxkIHNwYXJzZSB0cmlkaWFnb25hbCBzeXN0ZW1cbiAgICB2YXIgVCA9IFtbXSxbXSxbXV07XG4gICAgc3dpdGNoKHR5cGVvZiBrMSkge1xuICAgIGNhc2UgXCJ1bmRlZmluZWRcIjpcbiAgICAgICAgYlswXSA9IG11bCgzLyhkeFswXSpkeFswXSksZHlbMF0pO1xuICAgICAgICBUWzBdLnB1c2goMCwwKTtcbiAgICAgICAgVFsxXS5wdXNoKDAsMSk7XG4gICAgICAgIFRbMl0ucHVzaCgyL2R4WzBdLDEvZHhbMF0pO1xuICAgICAgICBicmVhaztcbiAgICBjYXNlIFwic3RyaW5nXCI6XG4gICAgICAgIGJbMF0gPSBhZGQobXVsKDMvKGR4W24tMl0qZHhbbi0yXSksZHlbbi0yXSksbXVsKDMvKGR4WzBdKmR4WzBdKSxkeVswXSkpO1xuICAgICAgICBUWzBdLnB1c2goMCwwLDApO1xuICAgICAgICBUWzFdLnB1c2gobi0yLDAsMSk7XG4gICAgICAgIFRbMl0ucHVzaCgxL2R4W24tMl0sMi9keFtuLTJdKzIvZHhbMF0sMS9keFswXSk7XG4gICAgICAgIGJyZWFrO1xuICAgIGRlZmF1bHQ6XG4gICAgICAgIGJbMF0gPSBrMTtcbiAgICAgICAgVFswXS5wdXNoKDApO1xuICAgICAgICBUWzFdLnB1c2goMCk7XG4gICAgICAgIFRbMl0ucHVzaCgxKTtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGZvcihpPTE7aTxuLTE7aSsrKSB7XG4gICAgICAgIGJbaV0gPSBhZGQobXVsKDMvKGR4W2ktMV0qZHhbaS0xXSksZHlbaS0xXSksbXVsKDMvKGR4W2ldKmR4W2ldKSxkeVtpXSkpO1xuICAgICAgICBUWzBdLnB1c2goaSxpLGkpO1xuICAgICAgICBUWzFdLnB1c2goaS0xLGksaSsxKTtcbiAgICAgICAgVFsyXS5wdXNoKDEvZHhbaS0xXSwyL2R4W2ktMV0rMi9keFtpXSwxL2R4W2ldKTtcbiAgICB9XG4gICAgc3dpdGNoKHR5cGVvZiBrbikge1xuICAgIGNhc2UgXCJ1bmRlZmluZWRcIjpcbiAgICAgICAgYltuLTFdID0gbXVsKDMvKGR4W24tMl0qZHhbbi0yXSksZHlbbi0yXSk7XG4gICAgICAgIFRbMF0ucHVzaChuLTEsbi0xKTtcbiAgICAgICAgVFsxXS5wdXNoKG4tMixuLTEpO1xuICAgICAgICBUWzJdLnB1c2goMS9keFtuLTJdLDIvZHhbbi0yXSk7XG4gICAgICAgIGJyZWFrO1xuICAgIGNhc2UgXCJzdHJpbmdcIjpcbiAgICAgICAgVFsxXVtUWzFdLmxlbmd0aC0xXSA9IDA7XG4gICAgICAgIGJyZWFrO1xuICAgIGRlZmF1bHQ6XG4gICAgICAgIGJbbi0xXSA9IGtuO1xuICAgICAgICBUWzBdLnB1c2gobi0xKTtcbiAgICAgICAgVFsxXS5wdXNoKG4tMSk7XG4gICAgICAgIFRbMl0ucHVzaCgxKTtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGlmKHR5cGVvZiBiWzBdICE9PSBcIm51bWJlclwiKSBiID0gbnVtZXJpYy50cmFuc3Bvc2UoYik7XG4gICAgZWxzZSBiID0gW2JdO1xuICAgIHZhciBrID0gQXJyYXkoYi5sZW5ndGgpO1xuICAgIGlmKHR5cGVvZiBrMSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICBmb3IoaT1rLmxlbmd0aC0xO2khPT0tMTstLWkpIHtcbiAgICAgICAgICAgIGtbaV0gPSBudW1lcmljLmNjc0xVUFNvbHZlKG51bWVyaWMuY2NzTFVQKG51bWVyaWMuY2NzU2NhdHRlcihUKSksYltpXSk7XG4gICAgICAgICAgICBrW2ldW24tMV0gPSBrW2ldWzBdO1xuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgZm9yKGk9ay5sZW5ndGgtMTtpIT09LTE7LS1pKSB7XG4gICAgICAgICAgICBrW2ldID0gbnVtZXJpYy5jTFVzb2x2ZShudW1lcmljLmNMVShUKSxiW2ldKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZih0eXBlb2YgeVswXSA9PT0gXCJudW1iZXJcIikgayA9IGtbMF07XG4gICAgZWxzZSBrID0gbnVtZXJpYy50cmFuc3Bvc2Uoayk7XG4gICAgcmV0dXJuIG5ldyBudW1lcmljLlNwbGluZSh4LHkseSxrLGspO1xufVxuXG4vLyA4LiBGRlRcbm51bWVyaWMuZmZ0cG93MiA9IGZ1bmN0aW9uIGZmdHBvdzIoeCx5KSB7XG4gICAgdmFyIG4gPSB4Lmxlbmd0aDtcbiAgICBpZihuID09PSAxKSByZXR1cm47XG4gICAgdmFyIGNvcyA9IE1hdGguY29zLCBzaW4gPSBNYXRoLnNpbiwgaSxqO1xuICAgIHZhciB4ZSA9IEFycmF5KG4vMiksIHllID0gQXJyYXkobi8yKSwgeG8gPSBBcnJheShuLzIpLCB5byA9IEFycmF5KG4vMik7XG4gICAgaiA9IG4vMjtcbiAgICBmb3IoaT1uLTE7aSE9PS0xOy0taSkge1xuICAgICAgICAtLWo7XG4gICAgICAgIHhvW2pdID0geFtpXTtcbiAgICAgICAgeW9bal0gPSB5W2ldO1xuICAgICAgICAtLWk7XG4gICAgICAgIHhlW2pdID0geFtpXTtcbiAgICAgICAgeWVbal0gPSB5W2ldO1xuICAgIH1cbiAgICBmZnRwb3cyKHhlLHllKTtcbiAgICBmZnRwb3cyKHhvLHlvKTtcbiAgICBqID0gbi8yO1xuICAgIHZhciB0LGsgPSAoLTYuMjgzMTg1MzA3MTc5NTg2NDc2OTI1Mjg2NzY2NTU5MDA1NzY4Mzk0MzM4Nzk4NzUwMjExNjQxOS9uKSxjaSxzaTtcbiAgICBmb3IoaT1uLTE7aSE9PS0xOy0taSkge1xuICAgICAgICAtLWo7XG4gICAgICAgIGlmKGogPT09IC0xKSBqID0gbi8yLTE7XG4gICAgICAgIHQgPSBrKmk7XG4gICAgICAgIGNpID0gY29zKHQpO1xuICAgICAgICBzaSA9IHNpbih0KTtcbiAgICAgICAgeFtpXSA9IHhlW2pdICsgY2kqeG9bal0gLSBzaSp5b1tqXTtcbiAgICAgICAgeVtpXSA9IHllW2pdICsgY2kqeW9bal0gKyBzaSp4b1tqXTtcbiAgICB9XG59XG5udW1lcmljLl9pZmZ0cG93MiA9IGZ1bmN0aW9uIF9pZmZ0cG93Mih4LHkpIHtcbiAgICB2YXIgbiA9IHgubGVuZ3RoO1xuICAgIGlmKG4gPT09IDEpIHJldHVybjtcbiAgICB2YXIgY29zID0gTWF0aC5jb3MsIHNpbiA9IE1hdGguc2luLCBpLGo7XG4gICAgdmFyIHhlID0gQXJyYXkobi8yKSwgeWUgPSBBcnJheShuLzIpLCB4byA9IEFycmF5KG4vMiksIHlvID0gQXJyYXkobi8yKTtcbiAgICBqID0gbi8yO1xuICAgIGZvcihpPW4tMTtpIT09LTE7LS1pKSB7XG4gICAgICAgIC0tajtcbiAgICAgICAgeG9bal0gPSB4W2ldO1xuICAgICAgICB5b1tqXSA9IHlbaV07XG4gICAgICAgIC0taTtcbiAgICAgICAgeGVbal0gPSB4W2ldO1xuICAgICAgICB5ZVtqXSA9IHlbaV07XG4gICAgfVxuICAgIF9pZmZ0cG93Mih4ZSx5ZSk7XG4gICAgX2lmZnRwb3cyKHhvLHlvKTtcbiAgICBqID0gbi8yO1xuICAgIHZhciB0LGsgPSAoNi4yODMxODUzMDcxNzk1ODY0NzY5MjUyODY3NjY1NTkwMDU3NjgzOTQzMzg3OTg3NTAyMTE2NDE5L24pLGNpLHNpO1xuICAgIGZvcihpPW4tMTtpIT09LTE7LS1pKSB7XG4gICAgICAgIC0tajtcbiAgICAgICAgaWYoaiA9PT0gLTEpIGogPSBuLzItMTtcbiAgICAgICAgdCA9IGsqaTtcbiAgICAgICAgY2kgPSBjb3ModCk7XG4gICAgICAgIHNpID0gc2luKHQpO1xuICAgICAgICB4W2ldID0geGVbal0gKyBjaSp4b1tqXSAtIHNpKnlvW2pdO1xuICAgICAgICB5W2ldID0geWVbal0gKyBjaSp5b1tqXSArIHNpKnhvW2pdO1xuICAgIH1cbn1cbm51bWVyaWMuaWZmdHBvdzIgPSBmdW5jdGlvbiBpZmZ0cG93Mih4LHkpIHtcbiAgICBudW1lcmljLl9pZmZ0cG93Mih4LHkpO1xuICAgIG51bWVyaWMuZGl2ZXEoeCx4Lmxlbmd0aCk7XG4gICAgbnVtZXJpYy5kaXZlcSh5LHkubGVuZ3RoKTtcbn1cbm51bWVyaWMuY29udnBvdzIgPSBmdW5jdGlvbiBjb252cG93MihheCxheSxieCxieSkge1xuICAgIG51bWVyaWMuZmZ0cG93MihheCxheSk7XG4gICAgbnVtZXJpYy5mZnRwb3cyKGJ4LGJ5KTtcbiAgICB2YXIgaSxuID0gYXgubGVuZ3RoLGF4aSxieGksYXlpLGJ5aTtcbiAgICBmb3IoaT1uLTE7aSE9PS0xOy0taSkge1xuICAgICAgICBheGkgPSBheFtpXTsgYXlpID0gYXlbaV07IGJ4aSA9IGJ4W2ldOyBieWkgPSBieVtpXTtcbiAgICAgICAgYXhbaV0gPSBheGkqYnhpLWF5aSpieWk7XG4gICAgICAgIGF5W2ldID0gYXhpKmJ5aStheWkqYnhpO1xuICAgIH1cbiAgICBudW1lcmljLmlmZnRwb3cyKGF4LGF5KTtcbn1cbm51bWVyaWMuVC5wcm90b3R5cGUuZmZ0ID0gZnVuY3Rpb24gZmZ0KCkge1xuICAgIHZhciB4ID0gdGhpcy54LCB5ID0gdGhpcy55O1xuICAgIHZhciBuID0geC5sZW5ndGgsIGxvZyA9IE1hdGgubG9nLCBsb2cyID0gbG9nKDIpLFxuICAgICAgICBwID0gTWF0aC5jZWlsKGxvZygyKm4tMSkvbG9nMiksIG0gPSBNYXRoLnBvdygyLHApO1xuICAgIHZhciBjeCA9IG51bWVyaWMucmVwKFttXSwwKSwgY3kgPSBudW1lcmljLnJlcChbbV0sMCksIGNvcyA9IE1hdGguY29zLCBzaW4gPSBNYXRoLnNpbjtcbiAgICB2YXIgaywgYyA9ICgtMy4xNDE1OTI2NTM1ODk3OTMyMzg0NjI2NDMzODMyNzk1MDI4ODQxOTcxNjkzOTkzNzUxMDU4MjAvbiksdDtcbiAgICB2YXIgYSA9IG51bWVyaWMucmVwKFttXSwwKSwgYiA9IG51bWVyaWMucmVwKFttXSwwKSxuaGFsZiA9IE1hdGguZmxvb3Iobi8yKTtcbiAgICBmb3Ioaz0wO2s8bjtrKyspIGFba10gPSB4W2tdO1xuICAgIGlmKHR5cGVvZiB5ICE9PSBcInVuZGVmaW5lZFwiKSBmb3Ioaz0wO2s8bjtrKyspIGJba10gPSB5W2tdO1xuICAgIGN4WzBdID0gMTtcbiAgICBmb3Ioaz0xO2s8PW0vMjtrKyspIHtcbiAgICAgICAgdCA9IGMqayprO1xuICAgICAgICBjeFtrXSA9IGNvcyh0KTtcbiAgICAgICAgY3lba10gPSBzaW4odCk7XG4gICAgICAgIGN4W20ta10gPSBjb3ModCk7XG4gICAgICAgIGN5W20ta10gPSBzaW4odClcbiAgICB9XG4gICAgdmFyIFggPSBuZXcgbnVtZXJpYy5UKGEsYiksIFkgPSBuZXcgbnVtZXJpYy5UKGN4LGN5KTtcbiAgICBYID0gWC5tdWwoWSk7XG4gICAgbnVtZXJpYy5jb252cG93MihYLngsWC55LG51bWVyaWMuY2xvbmUoWS54KSxudW1lcmljLm5lZyhZLnkpKTtcbiAgICBYID0gWC5tdWwoWSk7XG4gICAgWC54Lmxlbmd0aCA9IG47XG4gICAgWC55Lmxlbmd0aCA9IG47XG4gICAgcmV0dXJuIFg7XG59XG5udW1lcmljLlQucHJvdG90eXBlLmlmZnQgPSBmdW5jdGlvbiBpZmZ0KCkge1xuICAgIHZhciB4ID0gdGhpcy54LCB5ID0gdGhpcy55O1xuICAgIHZhciBuID0geC5sZW5ndGgsIGxvZyA9IE1hdGgubG9nLCBsb2cyID0gbG9nKDIpLFxuICAgICAgICBwID0gTWF0aC5jZWlsKGxvZygyKm4tMSkvbG9nMiksIG0gPSBNYXRoLnBvdygyLHApO1xuICAgIHZhciBjeCA9IG51bWVyaWMucmVwKFttXSwwKSwgY3kgPSBudW1lcmljLnJlcChbbV0sMCksIGNvcyA9IE1hdGguY29zLCBzaW4gPSBNYXRoLnNpbjtcbiAgICB2YXIgaywgYyA9ICgzLjE0MTU5MjY1MzU4OTc5MzIzODQ2MjY0MzM4MzI3OTUwMjg4NDE5NzE2OTM5OTM3NTEwNTgyMC9uKSx0O1xuICAgIHZhciBhID0gbnVtZXJpYy5yZXAoW21dLDApLCBiID0gbnVtZXJpYy5yZXAoW21dLDApLG5oYWxmID0gTWF0aC5mbG9vcihuLzIpO1xuICAgIGZvcihrPTA7azxuO2srKykgYVtrXSA9IHhba107XG4gICAgaWYodHlwZW9mIHkgIT09IFwidW5kZWZpbmVkXCIpIGZvcihrPTA7azxuO2srKykgYltrXSA9IHlba107XG4gICAgY3hbMF0gPSAxO1xuICAgIGZvcihrPTE7azw9bS8yO2srKykge1xuICAgICAgICB0ID0gYyprKms7XG4gICAgICAgIGN4W2tdID0gY29zKHQpO1xuICAgICAgICBjeVtrXSA9IHNpbih0KTtcbiAgICAgICAgY3hbbS1rXSA9IGNvcyh0KTtcbiAgICAgICAgY3lbbS1rXSA9IHNpbih0KVxuICAgIH1cbiAgICB2YXIgWCA9IG5ldyBudW1lcmljLlQoYSxiKSwgWSA9IG5ldyBudW1lcmljLlQoY3gsY3kpO1xuICAgIFggPSBYLm11bChZKTtcbiAgICBudW1lcmljLmNvbnZwb3cyKFgueCxYLnksbnVtZXJpYy5jbG9uZShZLngpLG51bWVyaWMubmVnKFkueSkpO1xuICAgIFggPSBYLm11bChZKTtcbiAgICBYLngubGVuZ3RoID0gbjtcbiAgICBYLnkubGVuZ3RoID0gbjtcbiAgICByZXR1cm4gWC5kaXYobik7XG59XG5cbi8vOS4gVW5jb25zdHJhaW5lZCBvcHRpbWl6YXRpb25cbm51bWVyaWMuZ3JhZGllbnQgPSBmdW5jdGlvbiBncmFkaWVudChmLHgpIHtcbiAgICB2YXIgbiA9IHgubGVuZ3RoO1xuICAgIHZhciBmMCA9IGYoeCk7XG4gICAgaWYoaXNOYU4oZjApKSB0aHJvdyBuZXcgRXJyb3IoJ2dyYWRpZW50OiBmKHgpIGlzIGEgTmFOIScpO1xuICAgIHZhciBtYXggPSBNYXRoLm1heDtcbiAgICB2YXIgaSx4MCA9IG51bWVyaWMuY2xvbmUoeCksZjEsZjIsIEogPSBBcnJheShuKTtcbiAgICB2YXIgZGl2ID0gbnVtZXJpYy5kaXYsIHN1YiA9IG51bWVyaWMuc3ViLGVycmVzdCxyb3VuZG9mZixtYXggPSBNYXRoLm1heCxlcHMgPSAxZS0zLGFicyA9IE1hdGguYWJzLCBtaW4gPSBNYXRoLm1pbjtcbiAgICB2YXIgdDAsdDEsdDIsaXQ9MCxkMSxkMixOO1xuICAgIGZvcihpPTA7aTxuO2krKykge1xuICAgICAgICB2YXIgaCA9IG1heCgxZS02KmYwLDFlLTgpO1xuICAgICAgICB3aGlsZSgxKSB7XG4gICAgICAgICAgICArK2l0O1xuICAgICAgICAgICAgaWYoaXQ+MjApIHsgdGhyb3cgbmV3IEVycm9yKFwiTnVtZXJpY2FsIGdyYWRpZW50IGZhaWxzXCIpOyB9XG4gICAgICAgICAgICB4MFtpXSA9IHhbaV0raDtcbiAgICAgICAgICAgIGYxID0gZih4MCk7XG4gICAgICAgICAgICB4MFtpXSA9IHhbaV0taDtcbiAgICAgICAgICAgIGYyID0gZih4MCk7XG4gICAgICAgICAgICB4MFtpXSA9IHhbaV07XG4gICAgICAgICAgICBpZihpc05hTihmMSkgfHwgaXNOYU4oZjIpKSB7IGgvPTE2OyBjb250aW51ZTsgfVxuICAgICAgICAgICAgSltpXSA9IChmMS1mMikvKDIqaCk7XG4gICAgICAgICAgICB0MCA9IHhbaV0taDtcbiAgICAgICAgICAgIHQxID0geFtpXTtcbiAgICAgICAgICAgIHQyID0geFtpXStoO1xuICAgICAgICAgICAgZDEgPSAoZjEtZjApL2g7XG4gICAgICAgICAgICBkMiA9IChmMC1mMikvaDtcbiAgICAgICAgICAgIE4gPSBtYXgoYWJzKEpbaV0pLGFicyhmMCksYWJzKGYxKSxhYnMoZjIpLGFicyh0MCksYWJzKHQxKSxhYnModDIpLDFlLTgpO1xuICAgICAgICAgICAgZXJyZXN0ID0gbWluKG1heChhYnMoZDEtSltpXSksYWJzKGQyLUpbaV0pLGFicyhkMS1kMikpL04saC9OKTtcbiAgICAgICAgICAgIGlmKGVycmVzdD5lcHMpIHsgaC89MTY7IH1cbiAgICAgICAgICAgIGVsc2UgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBKO1xufVxuXG5udW1lcmljLnVuY21pbiA9IGZ1bmN0aW9uIHVuY21pbihmLHgwLHRvbCxncmFkaWVudCxtYXhpdCxjYWxsYmFjayxvcHRpb25zKSB7XG4gICAgdmFyIGdyYWQgPSBudW1lcmljLmdyYWRpZW50O1xuICAgIGlmKHR5cGVvZiBvcHRpb25zID09PSBcInVuZGVmaW5lZFwiKSB7IG9wdGlvbnMgPSB7fTsgfVxuICAgIGlmKHR5cGVvZiB0b2wgPT09IFwidW5kZWZpbmVkXCIpIHsgdG9sID0gMWUtODsgfVxuICAgIGlmKHR5cGVvZiBncmFkaWVudCA9PT0gXCJ1bmRlZmluZWRcIikgeyBncmFkaWVudCA9IGZ1bmN0aW9uKHgpIHsgcmV0dXJuIGdyYWQoZix4KTsgfTsgfVxuICAgIGlmKHR5cGVvZiBtYXhpdCA9PT0gXCJ1bmRlZmluZWRcIikgbWF4aXQgPSAxMDAwO1xuICAgIHgwID0gbnVtZXJpYy5jbG9uZSh4MCk7XG4gICAgdmFyIG4gPSB4MC5sZW5ndGg7XG4gICAgdmFyIGYwID0gZih4MCksZjEsZGYwO1xuICAgIGlmKGlzTmFOKGYwKSkgdGhyb3cgbmV3IEVycm9yKCd1bmNtaW46IGYoeDApIGlzIGEgTmFOIScpO1xuICAgIHZhciBtYXggPSBNYXRoLm1heCwgbm9ybTIgPSBudW1lcmljLm5vcm0yO1xuICAgIHRvbCA9IG1heCh0b2wsbnVtZXJpYy5lcHNpbG9uKTtcbiAgICB2YXIgc3RlcCxnMCxnMSxIMSA9IG9wdGlvbnMuSGludiB8fCBudW1lcmljLmlkZW50aXR5KG4pO1xuICAgIHZhciBkb3QgPSBudW1lcmljLmRvdCwgaW52ID0gbnVtZXJpYy5pbnYsIHN1YiA9IG51bWVyaWMuc3ViLCBhZGQgPSBudW1lcmljLmFkZCwgdGVuID0gbnVtZXJpYy50ZW5zb3IsIGRpdiA9IG51bWVyaWMuZGl2LCBtdWwgPSBudW1lcmljLm11bDtcbiAgICB2YXIgYWxsID0gbnVtZXJpYy5hbGwsIGlzZmluaXRlID0gbnVtZXJpYy5pc0Zpbml0ZSwgbmVnID0gbnVtZXJpYy5uZWc7XG4gICAgdmFyIGl0PTAsaSxzLHgxLHksSHksSHMseXMsaTAsdCxuc3RlcCx0MSx0MjtcbiAgICB2YXIgbXNnID0gXCJcIjtcbiAgICBnMCA9IGdyYWRpZW50KHgwKTtcbiAgICB3aGlsZShpdDxtYXhpdCkge1xuICAgICAgICBpZih0eXBlb2YgY2FsbGJhY2sgPT09IFwiZnVuY3Rpb25cIikgeyBpZihjYWxsYmFjayhpdCx4MCxmMCxnMCxIMSkpIHsgbXNnID0gXCJDYWxsYmFjayByZXR1cm5lZCB0cnVlXCI7IGJyZWFrOyB9IH1cbiAgICAgICAgaWYoIWFsbChpc2Zpbml0ZShnMCkpKSB7IG1zZyA9IFwiR3JhZGllbnQgaGFzIEluZmluaXR5IG9yIE5hTlwiOyBicmVhazsgfVxuICAgICAgICBzdGVwID0gbmVnKGRvdChIMSxnMCkpO1xuICAgICAgICBpZighYWxsKGlzZmluaXRlKHN0ZXApKSkgeyBtc2cgPSBcIlNlYXJjaCBkaXJlY3Rpb24gaGFzIEluZmluaXR5IG9yIE5hTlwiOyBicmVhazsgfVxuICAgICAgICBuc3RlcCA9IG5vcm0yKHN0ZXApO1xuICAgICAgICBpZihuc3RlcCA8IHRvbCkgeyBtc2c9XCJOZXd0b24gc3RlcCBzbWFsbGVyIHRoYW4gdG9sXCI7IGJyZWFrOyB9XG4gICAgICAgIHQgPSAxO1xuICAgICAgICBkZjAgPSBkb3QoZzAsc3RlcCk7XG4gICAgICAgIC8vIGxpbmUgc2VhcmNoXG4gICAgICAgIHgxID0geDA7XG4gICAgICAgIHdoaWxlKGl0IDwgbWF4aXQpIHtcbiAgICAgICAgICAgIGlmKHQqbnN0ZXAgPCB0b2wpIHsgYnJlYWs7IH1cbiAgICAgICAgICAgIHMgPSBtdWwoc3RlcCx0KTtcbiAgICAgICAgICAgIHgxID0gYWRkKHgwLHMpO1xuICAgICAgICAgICAgZjEgPSBmKHgxKTtcbiAgICAgICAgICAgIGlmKGYxLWYwID49IDAuMSp0KmRmMCB8fCBpc05hTihmMSkpIHtcbiAgICAgICAgICAgICAgICB0ICo9IDAuNTtcbiAgICAgICAgICAgICAgICArK2l0O1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgaWYodCpuc3RlcCA8IHRvbCkgeyBtc2cgPSBcIkxpbmUgc2VhcmNoIHN0ZXAgc2l6ZSBzbWFsbGVyIHRoYW4gdG9sXCI7IGJyZWFrOyB9XG4gICAgICAgIGlmKGl0ID09PSBtYXhpdCkgeyBtc2cgPSBcIm1heGl0IHJlYWNoZWQgZHVyaW5nIGxpbmUgc2VhcmNoXCI7IGJyZWFrOyB9XG4gICAgICAgIGcxID0gZ3JhZGllbnQoeDEpO1xuICAgICAgICB5ID0gc3ViKGcxLGcwKTtcbiAgICAgICAgeXMgPSBkb3QoeSxzKTtcbiAgICAgICAgSHkgPSBkb3QoSDEseSk7XG4gICAgICAgIEgxID0gc3ViKGFkZChIMSxcbiAgICAgICAgICAgICAgICBtdWwoXG4gICAgICAgICAgICAgICAgICAgICAgICAoeXMrZG90KHksSHkpKS8oeXMqeXMpLFxuICAgICAgICAgICAgICAgICAgICAgICAgdGVuKHMscykgICAgKSksXG4gICAgICAgICAgICAgICAgZGl2KGFkZCh0ZW4oSHkscyksdGVuKHMsSHkpKSx5cykpO1xuICAgICAgICB4MCA9IHgxO1xuICAgICAgICBmMCA9IGYxO1xuICAgICAgICBnMCA9IGcxO1xuICAgICAgICArK2l0O1xuICAgIH1cbiAgICByZXR1cm4ge3NvbHV0aW9uOiB4MCwgZjogZjAsIGdyYWRpZW50OiBnMCwgaW52SGVzc2lhbjogSDEsIGl0ZXJhdGlvbnM6aXQsIG1lc3NhZ2U6IG1zZ307XG59XG5cbi8vIDEwLiBPZGUgc29sdmVyIChEb3JtYW5kLVByaW5jZSlcbm51bWVyaWMuRG9wcmkgPSBmdW5jdGlvbiBEb3ByaSh4LHksZix5bWlkLGl0ZXJhdGlvbnMsbXNnLGV2ZW50cykge1xuICAgIHRoaXMueCA9IHg7XG4gICAgdGhpcy55ID0geTtcbiAgICB0aGlzLmYgPSBmO1xuICAgIHRoaXMueW1pZCA9IHltaWQ7XG4gICAgdGhpcy5pdGVyYXRpb25zID0gaXRlcmF0aW9ucztcbiAgICB0aGlzLmV2ZW50cyA9IGV2ZW50cztcbiAgICB0aGlzLm1lc3NhZ2UgPSBtc2c7XG59XG5udW1lcmljLkRvcHJpLnByb3RvdHlwZS5fYXQgPSBmdW5jdGlvbiBfYXQoeGksaikge1xuICAgIGZ1bmN0aW9uIHNxcih4KSB7IHJldHVybiB4Kng7IH1cbiAgICB2YXIgc29sID0gdGhpcztcbiAgICB2YXIgeHMgPSBzb2wueDtcbiAgICB2YXIgeXMgPSBzb2wueTtcbiAgICB2YXIgazEgPSBzb2wuZjtcbiAgICB2YXIgeW1pZCA9IHNvbC55bWlkO1xuICAgIHZhciBuID0geHMubGVuZ3RoO1xuICAgIHZhciB4MCx4MSx4aCx5MCx5MSx5aCx4aTtcbiAgICB2YXIgZmxvb3IgPSBNYXRoLmZsb29yLGg7XG4gICAgdmFyIGMgPSAwLjU7XG4gICAgdmFyIGFkZCA9IG51bWVyaWMuYWRkLCBtdWwgPSBudW1lcmljLm11bCxzdWIgPSBudW1lcmljLnN1YiwgcCxxLHc7XG4gICAgeDAgPSB4c1tqXTtcbiAgICB4MSA9IHhzW2orMV07XG4gICAgeTAgPSB5c1tqXTtcbiAgICB5MSA9IHlzW2orMV07XG4gICAgaCAgPSB4MS14MDtcbiAgICB4aCA9IHgwK2MqaDtcbiAgICB5aCA9IHltaWRbal07XG4gICAgcCA9IHN1YihrMVtqICBdLG11bCh5MCwxLyh4MC14aCkrMi8oeDAteDEpKSk7XG4gICAgcSA9IHN1YihrMVtqKzFdLG11bCh5MSwxLyh4MS14aCkrMi8oeDEteDApKSk7XG4gICAgdyA9IFtzcXIoeGkgLSB4MSkgKiAoeGkgLSB4aCkgLyBzcXIoeDAgLSB4MSkgLyAoeDAgLSB4aCksXG4gICAgICAgICBzcXIoeGkgLSB4MCkgKiBzcXIoeGkgLSB4MSkgLyBzcXIoeDAgLSB4aCkgLyBzcXIoeDEgLSB4aCksXG4gICAgICAgICBzcXIoeGkgLSB4MCkgKiAoeGkgLSB4aCkgLyBzcXIoeDEgLSB4MCkgLyAoeDEgLSB4aCksXG4gICAgICAgICAoeGkgLSB4MCkgKiBzcXIoeGkgLSB4MSkgKiAoeGkgLSB4aCkgLyBzcXIoeDAteDEpIC8gKHgwIC0geGgpLFxuICAgICAgICAgKHhpIC0geDEpICogc3FyKHhpIC0geDApICogKHhpIC0geGgpIC8gc3FyKHgwLXgxKSAvICh4MSAtIHhoKV07XG4gICAgcmV0dXJuIGFkZChhZGQoYWRkKGFkZChtdWwoeTAsd1swXSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBtdWwoeWgsd1sxXSkpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgbXVsKHkxLHdbMl0pKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIG11bCggcCx3WzNdKSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBtdWwoIHEsd1s0XSkpO1xufVxubnVtZXJpYy5Eb3ByaS5wcm90b3R5cGUuYXQgPSBmdW5jdGlvbiBhdCh4KSB7XG4gICAgdmFyIGksaixrLGZsb29yID0gTWF0aC5mbG9vcjtcbiAgICBpZih0eXBlb2YgeCAhPT0gXCJudW1iZXJcIikge1xuICAgICAgICB2YXIgbiA9IHgubGVuZ3RoLCByZXQgPSBBcnJheShuKTtcbiAgICAgICAgZm9yKGk9bi0xO2khPT0tMTstLWkpIHtcbiAgICAgICAgICAgIHJldFtpXSA9IHRoaXMuYXQoeFtpXSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9XG4gICAgdmFyIHgwID0gdGhpcy54O1xuICAgIGkgPSAwOyBqID0geDAubGVuZ3RoLTE7XG4gICAgd2hpbGUoai1pPjEpIHtcbiAgICAgICAgayA9IGZsb29yKDAuNSooaStqKSk7XG4gICAgICAgIGlmKHgwW2tdIDw9IHgpIGkgPSBrO1xuICAgICAgICBlbHNlIGogPSBrO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fYXQoeCxpKTtcbn1cblxubnVtZXJpYy5kb3ByaSA9IGZ1bmN0aW9uIGRvcHJpKHgwLHgxLHkwLGYsdG9sLG1heGl0LGV2ZW50KSB7XG4gICAgaWYodHlwZW9mIHRvbCA9PT0gXCJ1bmRlZmluZWRcIikgeyB0b2wgPSAxZS02OyB9XG4gICAgaWYodHlwZW9mIG1heGl0ID09PSBcInVuZGVmaW5lZFwiKSB7IG1heGl0ID0gMTAwMDsgfVxuICAgIHZhciB4cyA9IFt4MF0sIHlzID0gW3kwXSwgazEgPSBbZih4MCx5MCldLCBrMixrMyxrNCxrNSxrNixrNywgeW1pZCA9IFtdO1xuICAgIHZhciBBMiA9IDEvNTtcbiAgICB2YXIgQTMgPSBbMy80MCw5LzQwXTtcbiAgICB2YXIgQTQgPSBbNDQvNDUsLTU2LzE1LDMyLzldO1xuICAgIHZhciBBNSA9IFsxOTM3Mi82NTYxLC0yNTM2MC8yMTg3LDY0NDQ4LzY1NjEsLTIxMi83MjldO1xuICAgIHZhciBBNiA9IFs5MDE3LzMxNjgsLTM1NS8zMyw0NjczMi81MjQ3LDQ5LzE3NiwtNTEwMy8xODY1Nl07XG4gICAgdmFyIGIgPSBbMzUvMzg0LDAsNTAwLzExMTMsMTI1LzE5MiwtMjE4Ny82Nzg0LDExLzg0XTtcbiAgICB2YXIgYm0gPSBbMC41KjYwMjUxOTI3NDMvMzAwODU1NTMxNTIsXG4gICAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAgIDAuNSo1MTI1MjI5MjkyNS82NTQwMDgyMTU5OCxcbiAgICAgICAgICAgICAgMC41Ki0yNjkxODY4OTI1LzQ1MTI4MzI5NzI4LFxuICAgICAgICAgICAgICAwLjUqMTg3OTQwMzcyMDY3LzE1OTQ1MzQzMTcwNTYsXG4gICAgICAgICAgICAgIDAuNSotMTc3NjA5NDMzMS8xOTc0MzY0NDI1NixcbiAgICAgICAgICAgICAgMC41KjExMjM3MDk5LzIzNTA0MzM4NF07XG4gICAgdmFyIGMgPSBbMS81LDMvMTAsNC81LDgvOSwxLDFdO1xuICAgIHZhciBlID0gWy03MS81NzYwMCwwLDcxLzE2Njk1LC03MS8xOTIwLDE3MjUzLzMzOTIwMCwtMjIvNTI1LDEvNDBdO1xuICAgIHZhciBpID0gMCxlcixqO1xuICAgIHZhciBoID0gKHgxLXgwKS8xMDtcbiAgICB2YXIgaXQgPSAwO1xuICAgIHZhciBhZGQgPSBudW1lcmljLmFkZCwgbXVsID0gbnVtZXJpYy5tdWwsIHkxLGVyaW5mO1xuICAgIHZhciBtYXggPSBNYXRoLm1heCwgbWluID0gTWF0aC5taW4sIGFicyA9IE1hdGguYWJzLCBub3JtaW5mID0gbnVtZXJpYy5ub3JtaW5mLHBvdyA9IE1hdGgucG93O1xuICAgIHZhciBhbnkgPSBudW1lcmljLmFueSwgbHQgPSBudW1lcmljLmx0LCBhbmQgPSBudW1lcmljLmFuZCwgc3ViID0gbnVtZXJpYy5zdWI7XG4gICAgdmFyIGUwLCBlMSwgZXY7XG4gICAgdmFyIHJldCA9IG5ldyBudW1lcmljLkRvcHJpKHhzLHlzLGsxLHltaWQsLTEsXCJcIik7XG4gICAgaWYodHlwZW9mIGV2ZW50ID09PSBcImZ1bmN0aW9uXCIpIGUwID0gZXZlbnQoeDAseTApO1xuICAgIHdoaWxlKHgwPHgxICYmIGl0PG1heGl0KSB7XG4gICAgICAgICsraXQ7XG4gICAgICAgIGlmKHgwK2g+eDEpIGggPSB4MS14MDtcbiAgICAgICAgazIgPSBmKHgwK2NbMF0qaCwgICAgICAgICAgICAgICAgYWRkKHkwLG11bCggICBBMipoLGsxW2ldKSkpO1xuICAgICAgICBrMyA9IGYoeDArY1sxXSpoLCAgICAgICAgICAgIGFkZChhZGQoeTAsbXVsKEEzWzBdKmgsazFbaV0pKSxtdWwoQTNbMV0qaCxrMikpKTtcbiAgICAgICAgazQgPSBmKHgwK2NbMl0qaCwgICAgICAgIGFkZChhZGQoYWRkKHkwLG11bChBNFswXSpoLGsxW2ldKSksbXVsKEE0WzFdKmgsazIpKSxtdWwoQTRbMl0qaCxrMykpKTtcbiAgICAgICAgazUgPSBmKHgwK2NbM10qaCwgICAgYWRkKGFkZChhZGQoYWRkKHkwLG11bChBNVswXSpoLGsxW2ldKSksbXVsKEE1WzFdKmgsazIpKSxtdWwoQTVbMl0qaCxrMykpLG11bChBNVszXSpoLGs0KSkpO1xuICAgICAgICBrNiA9IGYoeDArY1s0XSpoLGFkZChhZGQoYWRkKGFkZChhZGQoeTAsbXVsKEE2WzBdKmgsazFbaV0pKSxtdWwoQTZbMV0qaCxrMikpLG11bChBNlsyXSpoLGszKSksbXVsKEE2WzNdKmgsazQpKSxtdWwoQTZbNF0qaCxrNSkpKTtcbiAgICAgICAgeTEgPSBhZGQoYWRkKGFkZChhZGQoYWRkKHkwLG11bChrMVtpXSxoKmJbMF0pKSxtdWwoazMsaCpiWzJdKSksbXVsKGs0LGgqYlszXSkpLG11bChrNSxoKmJbNF0pKSxtdWwoazYsaCpiWzVdKSk7XG4gICAgICAgIGs3ID0gZih4MCtoLHkxKTtcbiAgICAgICAgZXIgPSBhZGQoYWRkKGFkZChhZGQoYWRkKG11bChrMVtpXSxoKmVbMF0pLG11bChrMyxoKmVbMl0pKSxtdWwoazQsaCplWzNdKSksbXVsKGs1LGgqZVs0XSkpLG11bChrNixoKmVbNV0pKSxtdWwoazcsaCplWzZdKSk7XG4gICAgICAgIGlmKHR5cGVvZiBlciA9PT0gXCJudW1iZXJcIikgZXJpbmYgPSBhYnMoZXIpO1xuICAgICAgICBlbHNlIGVyaW5mID0gbm9ybWluZihlcik7XG4gICAgICAgIGlmKGVyaW5mID4gdG9sKSB7IC8vIHJlamVjdFxuICAgICAgICAgICAgaCA9IDAuMipoKnBvdyh0b2wvZXJpbmYsMC4yNSk7XG4gICAgICAgICAgICBpZih4MCtoID09PSB4MCkge1xuICAgICAgICAgICAgICAgIHJldC5tc2cgPSBcIlN0ZXAgc2l6ZSBiZWNhbWUgdG9vIHNtYWxsXCI7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICB5bWlkW2ldID0gYWRkKGFkZChhZGQoYWRkKGFkZChhZGQoeTAsXG4gICAgICAgICAgICAgICAgbXVsKGsxW2ldLGgqYm1bMF0pKSxcbiAgICAgICAgICAgICAgICBtdWwoazMgICAsaCpibVsyXSkpLFxuICAgICAgICAgICAgICAgIG11bChrNCAgICxoKmJtWzNdKSksXG4gICAgICAgICAgICAgICAgbXVsKGs1ICAgLGgqYm1bNF0pKSxcbiAgICAgICAgICAgICAgICBtdWwoazYgICAsaCpibVs1XSkpLFxuICAgICAgICAgICAgICAgIG11bChrNyAgICxoKmJtWzZdKSk7XG4gICAgICAgICsraTtcbiAgICAgICAgeHNbaV0gPSB4MCtoO1xuICAgICAgICB5c1tpXSA9IHkxO1xuICAgICAgICBrMVtpXSA9IGs3O1xuICAgICAgICBpZih0eXBlb2YgZXZlbnQgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgdmFyIHlpLHhsID0geDAseHIgPSB4MCswLjUqaCx4aTtcbiAgICAgICAgICAgIGUxID0gZXZlbnQoeHIseW1pZFtpLTFdKTtcbiAgICAgICAgICAgIGV2ID0gYW5kKGx0KGUwLDApLGx0KDAsZTEpKTtcbiAgICAgICAgICAgIGlmKCFhbnkoZXYpKSB7IHhsID0geHI7IHhyID0geDAraDsgZTAgPSBlMTsgZTEgPSBldmVudCh4cix5MSk7IGV2ID0gYW5kKGx0KGUwLDApLGx0KDAsZTEpKTsgfVxuICAgICAgICAgICAgaWYoYW55KGV2KSkge1xuICAgICAgICAgICAgICAgIHZhciB4YywgeWMsIGVuLGVpO1xuICAgICAgICAgICAgICAgIHZhciBzaWRlPTAsIHNsID0gMS4wLCBzciA9IDEuMDtcbiAgICAgICAgICAgICAgICB3aGlsZSgxKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmKHR5cGVvZiBlMCA9PT0gXCJudW1iZXJcIikgeGkgPSAoc3IqZTEqeGwtc2wqZTAqeHIpLyhzciplMS1zbCplMCk7XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgeGkgPSB4cjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvcihqPWUwLmxlbmd0aC0xO2ohPT0tMTstLWopIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZihlMFtqXTwwICYmIGUxW2pdPjApIHhpID0gbWluKHhpLChzciplMVtqXSp4bC1zbCplMFtqXSp4cikvKHNyKmUxW2pdLXNsKmUwW2pdKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYoeGkgPD0geGwgfHwgeGkgPj0geHIpIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB5aSA9IHJldC5fYXQoeGksIGktMSk7XG4gICAgICAgICAgICAgICAgICAgIGVpID0gZXZlbnQoeGkseWkpO1xuICAgICAgICAgICAgICAgICAgICBlbiA9IGFuZChsdChlMCwwKSxsdCgwLGVpKSk7XG4gICAgICAgICAgICAgICAgICAgIGlmKGFueShlbikpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHhyID0geGk7XG4gICAgICAgICAgICAgICAgICAgICAgICBlMSA9IGVpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZXYgPSBlbjtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNyID0gMS4wO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYoc2lkZSA9PT0gLTEpIHNsICo9IDAuNTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Ugc2wgPSAxLjA7XG4gICAgICAgICAgICAgICAgICAgICAgICBzaWRlID0gLTE7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB4bCA9IHhpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZTAgPSBlaTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNsID0gMS4wO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYoc2lkZSA9PT0gMSkgc3IgKj0gMC41O1xuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBzciA9IDEuMDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNpZGUgPSAxO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHkxID0gcmV0Ll9hdCgwLjUqKHgwK3hpKSxpLTEpO1xuICAgICAgICAgICAgICAgIHJldC5mW2ldID0gZih4aSx5aSk7XG4gICAgICAgICAgICAgICAgcmV0LnhbaV0gPSB4aTtcbiAgICAgICAgICAgICAgICByZXQueVtpXSA9IHlpO1xuICAgICAgICAgICAgICAgIHJldC55bWlkW2ktMV0gPSB5MTtcbiAgICAgICAgICAgICAgICByZXQuZXZlbnRzID0gZXY7XG4gICAgICAgICAgICAgICAgcmV0Lml0ZXJhdGlvbnMgPSBpdDtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmV0O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHgwICs9IGg7XG4gICAgICAgIHkwID0geTE7XG4gICAgICAgIGUwID0gZTE7XG4gICAgICAgIGggPSBtaW4oMC44KmgqcG93KHRvbC9lcmluZiwwLjI1KSw0KmgpO1xuICAgIH1cbiAgICByZXQuaXRlcmF0aW9ucyA9IGl0O1xuICAgIHJldHVybiByZXQ7XG59XG5cbi8vIDExLiBBeCA9IGJcbm51bWVyaWMuTFUgPSBmdW5jdGlvbihBLCBmYXN0KSB7XG4gIGZhc3QgPSBmYXN0IHx8IGZhbHNlO1xuXG4gIHZhciBhYnMgPSBNYXRoLmFicztcbiAgdmFyIGksIGosIGssIGFic0FqaywgQWtrLCBBaywgUGssIEFpO1xuICB2YXIgbWF4O1xuICB2YXIgbiA9IEEubGVuZ3RoLCBuMSA9IG4tMTtcbiAgdmFyIFAgPSBuZXcgQXJyYXkobik7XG4gIGlmKCFmYXN0KSBBID0gbnVtZXJpYy5jbG9uZShBKTtcblxuICBmb3IgKGsgPSAwOyBrIDwgbjsgKytrKSB7XG4gICAgUGsgPSBrO1xuICAgIEFrID0gQVtrXTtcbiAgICBtYXggPSBhYnMoQWtba10pO1xuICAgIGZvciAoaiA9IGsgKyAxOyBqIDwgbjsgKytqKSB7XG4gICAgICBhYnNBamsgPSBhYnMoQVtqXVtrXSk7XG4gICAgICBpZiAobWF4IDwgYWJzQWprKSB7XG4gICAgICAgIG1heCA9IGFic0FqaztcbiAgICAgICAgUGsgPSBqO1xuICAgICAgfVxuICAgIH1cbiAgICBQW2tdID0gUGs7XG5cbiAgICBpZiAoUGsgIT0gaykge1xuICAgICAgQVtrXSA9IEFbUGtdO1xuICAgICAgQVtQa10gPSBBaztcbiAgICAgIEFrID0gQVtrXTtcbiAgICB9XG5cbiAgICBBa2sgPSBBa1trXTtcblxuICAgIGZvciAoaSA9IGsgKyAxOyBpIDwgbjsgKytpKSB7XG4gICAgICBBW2ldW2tdIC89IEFraztcbiAgICB9XG5cbiAgICBmb3IgKGkgPSBrICsgMTsgaSA8IG47ICsraSkge1xuICAgICAgQWkgPSBBW2ldO1xuICAgICAgZm9yIChqID0gayArIDE7IGogPCBuMTsgKytqKSB7XG4gICAgICAgIEFpW2pdIC09IEFpW2tdICogQWtbal07XG4gICAgICAgICsrajtcbiAgICAgICAgQWlbal0gLT0gQWlba10gKiBBa1tqXTtcbiAgICAgIH1cbiAgICAgIGlmKGo9PT1uMSkgQWlbal0gLT0gQWlba10gKiBBa1tqXTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4ge1xuICAgIExVOiBBLFxuICAgIFA6ICBQXG4gIH07XG59XG5cbm51bWVyaWMuTFVzb2x2ZSA9IGZ1bmN0aW9uIExVc29sdmUoTFVQLCBiKSB7XG4gIHZhciBpLCBqO1xuICB2YXIgTFUgPSBMVVAuTFU7XG4gIHZhciBuICAgPSBMVS5sZW5ndGg7XG4gIHZhciB4ID0gbnVtZXJpYy5jbG9uZShiKTtcbiAgdmFyIFAgICA9IExVUC5QO1xuICB2YXIgUGksIExVaSwgTFVpaSwgdG1wO1xuXG4gIGZvciAoaT1uLTE7aSE9PS0xOy0taSkgeFtpXSA9IGJbaV07XG4gIGZvciAoaSA9IDA7IGkgPCBuOyArK2kpIHtcbiAgICBQaSA9IFBbaV07XG4gICAgaWYgKFBbaV0gIT09IGkpIHtcbiAgICAgIHRtcCA9IHhbaV07XG4gICAgICB4W2ldID0geFtQaV07XG4gICAgICB4W1BpXSA9IHRtcDtcbiAgICB9XG5cbiAgICBMVWkgPSBMVVtpXTtcbiAgICBmb3IgKGogPSAwOyBqIDwgaTsgKytqKSB7XG4gICAgICB4W2ldIC09IHhbal0gKiBMVWlbal07XG4gICAgfVxuICB9XG5cbiAgZm9yIChpID0gbiAtIDE7IGkgPj0gMDsgLS1pKSB7XG4gICAgTFVpID0gTFVbaV07XG4gICAgZm9yIChqID0gaSArIDE7IGogPCBuOyArK2opIHtcbiAgICAgIHhbaV0gLT0geFtqXSAqIExVaVtqXTtcbiAgICB9XG5cbiAgICB4W2ldIC89IExVaVtpXTtcbiAgfVxuXG4gIHJldHVybiB4O1xufVxuXG5udW1lcmljLnNvbHZlID0gZnVuY3Rpb24gc29sdmUoQSxiLGZhc3QpIHsgcmV0dXJuIG51bWVyaWMuTFVzb2x2ZShudW1lcmljLkxVKEEsZmFzdCksIGIpOyB9XG5cbi8vIDEyLiBMaW5lYXIgcHJvZ3JhbW1pbmdcbm51bWVyaWMuZWNoZWxvbml6ZSA9IGZ1bmN0aW9uIGVjaGVsb25pemUoQSkge1xuICAgIHZhciBzID0gbnVtZXJpYy5kaW0oQSksIG0gPSBzWzBdLCBuID0gc1sxXTtcbiAgICB2YXIgSSA9IG51bWVyaWMuaWRlbnRpdHkobSk7XG4gICAgdmFyIFAgPSBBcnJheShtKTtcbiAgICB2YXIgaSxqLGssbCxBaSxJaSxaLGE7XG4gICAgdmFyIGFicyA9IE1hdGguYWJzO1xuICAgIHZhciBkaXZlcSA9IG51bWVyaWMuZGl2ZXE7XG4gICAgQSA9IG51bWVyaWMuY2xvbmUoQSk7XG4gICAgZm9yKGk9MDtpPG07KytpKSB7XG4gICAgICAgIGsgPSAwO1xuICAgICAgICBBaSA9IEFbaV07XG4gICAgICAgIElpID0gSVtpXTtcbiAgICAgICAgZm9yKGo9MTtqPG47KytqKSBpZihhYnMoQWlba10pPGFicyhBaVtqXSkpIGs9ajtcbiAgICAgICAgUFtpXSA9IGs7XG4gICAgICAgIGRpdmVxKElpLEFpW2tdKTtcbiAgICAgICAgZGl2ZXEoQWksQWlba10pO1xuICAgICAgICBmb3Ioaj0wO2o8bTsrK2opIGlmKGohPT1pKSB7XG4gICAgICAgICAgICBaID0gQVtqXTsgYSA9IFpba107XG4gICAgICAgICAgICBmb3IobD1uLTE7bCE9PS0xOy0tbCkgWltsXSAtPSBBaVtsXSphO1xuICAgICAgICAgICAgWiA9IElbal07XG4gICAgICAgICAgICBmb3IobD1tLTE7bCE9PS0xOy0tbCkgWltsXSAtPSBJaVtsXSphO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB7STpJLCBBOkEsIFA6UH07XG59XG5cbm51bWVyaWMuX19zb2x2ZUxQID0gZnVuY3Rpb24gX19zb2x2ZUxQKGMsQSxiLHRvbCxtYXhpdCx4LGZsYWcpIHtcbiAgICB2YXIgc3VtID0gbnVtZXJpYy5zdW0sIGxvZyA9IG51bWVyaWMubG9nLCBtdWwgPSBudW1lcmljLm11bCwgc3ViID0gbnVtZXJpYy5zdWIsIGRvdCA9IG51bWVyaWMuZG90LCBkaXYgPSBudW1lcmljLmRpdiwgYWRkID0gbnVtZXJpYy5hZGQ7XG4gICAgdmFyIG0gPSBjLmxlbmd0aCwgbiA9IGIubGVuZ3RoLHk7XG4gICAgdmFyIHVuYm91bmRlZCA9IGZhbHNlLCBjYixpMD0wO1xuICAgIHZhciBhbHBoYSA9IDEuMDtcbiAgICB2YXIgZjAsZGYwLEFUID0gbnVtZXJpYy50cmFuc3Bvc2UoQSksIHN2ZCA9IG51bWVyaWMuc3ZkLHRyYW5zcG9zZSA9IG51bWVyaWMudHJhbnNwb3NlLGxlcSA9IG51bWVyaWMubGVxLCBzcXJ0ID0gTWF0aC5zcXJ0LCBhYnMgPSBNYXRoLmFicztcbiAgICB2YXIgbXVsZXEgPSBudW1lcmljLm11bGVxO1xuICAgIHZhciBub3JtID0gbnVtZXJpYy5ub3JtaW5mLCBhbnkgPSBudW1lcmljLmFueSxtaW4gPSBNYXRoLm1pbjtcbiAgICB2YXIgYWxsID0gbnVtZXJpYy5hbGwsIGd0ID0gbnVtZXJpYy5ndDtcbiAgICB2YXIgcCA9IEFycmF5KG0pLCBBMCA9IEFycmF5KG4pLGU9bnVtZXJpYy5yZXAoW25dLDEpLCBIO1xuICAgIHZhciBzb2x2ZSA9IG51bWVyaWMuc29sdmUsIHogPSBzdWIoYixkb3QoQSx4KSksY291bnQ7XG4gICAgdmFyIGRvdGNjID0gZG90KGMsYyk7XG4gICAgdmFyIGc7XG4gICAgZm9yKGNvdW50PWkwO2NvdW50PG1heGl0OysrY291bnQpIHtcbiAgICAgICAgdmFyIGksaixkO1xuICAgICAgICBmb3IoaT1uLTE7aSE9PS0xOy0taSkgQTBbaV0gPSBkaXYoQVtpXSx6W2ldKTtcbiAgICAgICAgdmFyIEExID0gdHJhbnNwb3NlKEEwKTtcbiAgICAgICAgZm9yKGk9bS0xO2khPT0tMTstLWkpIHBbaV0gPSAoLyp4W2ldKyovc3VtKEExW2ldKSk7XG4gICAgICAgIGFscGhhID0gMC4yNSphYnMoZG90Y2MvZG90KGMscCkpO1xuICAgICAgICB2YXIgYTEgPSAxMDAqc3FydChkb3RjYy9kb3QocCxwKSk7XG4gICAgICAgIGlmKCFpc0Zpbml0ZShhbHBoYSkgfHwgYWxwaGE+YTEpIGFscGhhID0gYTE7XG4gICAgICAgIGcgPSBhZGQoYyxtdWwoYWxwaGEscCkpO1xuICAgICAgICBIID0gZG90KEExLEEwKTtcbiAgICAgICAgZm9yKGk9bS0xO2khPT0tMTstLWkpIEhbaV1baV0gKz0gMTtcbiAgICAgICAgZCA9IHNvbHZlKEgsZGl2KGcsYWxwaGEpLHRydWUpO1xuICAgICAgICB2YXIgdDAgPSBkaXYoeixkb3QoQSxkKSk7XG4gICAgICAgIHZhciB0ID0gMS4wO1xuICAgICAgICBmb3IoaT1uLTE7aSE9PS0xOy0taSkgaWYodDBbaV08MCkgdCA9IG1pbih0LC0wLjk5OSp0MFtpXSk7XG4gICAgICAgIHkgPSBzdWIoeCxtdWwoZCx0KSk7XG4gICAgICAgIHogPSBzdWIoYixkb3QoQSx5KSk7XG4gICAgICAgIGlmKCFhbGwoZ3QoeiwwKSkpIHJldHVybiB7IHNvbHV0aW9uOiB4LCBtZXNzYWdlOiBcIlwiLCBpdGVyYXRpb25zOiBjb3VudCB9O1xuICAgICAgICB4ID0geTtcbiAgICAgICAgaWYoYWxwaGE8dG9sKSByZXR1cm4geyBzb2x1dGlvbjogeSwgbWVzc2FnZTogXCJcIiwgaXRlcmF0aW9uczogY291bnQgfTtcbiAgICAgICAgaWYoZmxhZykge1xuICAgICAgICAgICAgdmFyIHMgPSBkb3QoYyxnKSwgQWcgPSBkb3QoQSxnKTtcbiAgICAgICAgICAgIHVuYm91bmRlZCA9IHRydWU7XG4gICAgICAgICAgICBmb3IoaT1uLTE7aSE9PS0xOy0taSkgaWYocypBZ1tpXTwwKSB7IHVuYm91bmRlZCA9IGZhbHNlOyBicmVhazsgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYoeFttLTFdPj0wKSB1bmJvdW5kZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIGVsc2UgdW5ib3VuZGVkID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBpZih1bmJvdW5kZWQpIHJldHVybiB7IHNvbHV0aW9uOiB5LCBtZXNzYWdlOiBcIlVuYm91bmRlZFwiLCBpdGVyYXRpb25zOiBjb3VudCB9O1xuICAgIH1cbiAgICByZXR1cm4geyBzb2x1dGlvbjogeCwgbWVzc2FnZTogXCJtYXhpbXVtIGl0ZXJhdGlvbiBjb3VudCBleGNlZWRlZFwiLCBpdGVyYXRpb25zOmNvdW50IH07XG59XG5cbm51bWVyaWMuX3NvbHZlTFAgPSBmdW5jdGlvbiBfc29sdmVMUChjLEEsYix0b2wsbWF4aXQpIHtcbiAgICB2YXIgbSA9IGMubGVuZ3RoLCBuID0gYi5sZW5ndGgseTtcbiAgICB2YXIgc3VtID0gbnVtZXJpYy5zdW0sIGxvZyA9IG51bWVyaWMubG9nLCBtdWwgPSBudW1lcmljLm11bCwgc3ViID0gbnVtZXJpYy5zdWIsIGRvdCA9IG51bWVyaWMuZG90LCBkaXYgPSBudW1lcmljLmRpdiwgYWRkID0gbnVtZXJpYy5hZGQ7XG4gICAgdmFyIGMwID0gbnVtZXJpYy5yZXAoW21dLDApLmNvbmNhdChbMV0pO1xuICAgIHZhciBKID0gbnVtZXJpYy5yZXAoW24sMV0sLTEpO1xuICAgIHZhciBBMCA9IG51bWVyaWMuYmxvY2tNYXRyaXgoW1tBICAgICAgICAgICAgICAgICAgICwgICBKICBdXSk7XG4gICAgdmFyIGIwID0gYjtcbiAgICB2YXIgeSA9IG51bWVyaWMucmVwKFttXSwwKS5jb25jYXQoTWF0aC5tYXgoMCxudW1lcmljLnN1cChudW1lcmljLm5lZyhiKSkpKzEpO1xuICAgIHZhciB4MCA9IG51bWVyaWMuX19zb2x2ZUxQKGMwLEEwLGIwLHRvbCxtYXhpdCx5LGZhbHNlKTtcbiAgICB2YXIgeCA9IG51bWVyaWMuY2xvbmUoeDAuc29sdXRpb24pO1xuICAgIHgubGVuZ3RoID0gbTtcbiAgICB2YXIgZm9vID0gbnVtZXJpYy5pbmYoc3ViKGIsZG90KEEseCkpKTtcbiAgICBpZihmb288MCkgeyByZXR1cm4geyBzb2x1dGlvbjogTmFOLCBtZXNzYWdlOiBcIkluZmVhc2libGVcIiwgaXRlcmF0aW9uczogeDAuaXRlcmF0aW9ucyB9OyB9XG4gICAgdmFyIHJldCA9IG51bWVyaWMuX19zb2x2ZUxQKGMsIEEsIGIsIHRvbCwgbWF4aXQteDAuaXRlcmF0aW9ucywgeCwgdHJ1ZSk7XG4gICAgcmV0Lml0ZXJhdGlvbnMgKz0geDAuaXRlcmF0aW9ucztcbiAgICByZXR1cm4gcmV0O1xufTtcblxubnVtZXJpYy5zb2x2ZUxQID0gZnVuY3Rpb24gc29sdmVMUChjLEEsYixBZXEsYmVxLHRvbCxtYXhpdCkge1xuICAgIGlmKHR5cGVvZiBtYXhpdCA9PT0gXCJ1bmRlZmluZWRcIikgbWF4aXQgPSAxMDAwO1xuICAgIGlmKHR5cGVvZiB0b2wgPT09IFwidW5kZWZpbmVkXCIpIHRvbCA9IG51bWVyaWMuZXBzaWxvbjtcbiAgICBpZih0eXBlb2YgQWVxID09PSBcInVuZGVmaW5lZFwiKSByZXR1cm4gbnVtZXJpYy5fc29sdmVMUChjLEEsYix0b2wsbWF4aXQpO1xuICAgIHZhciBtID0gQWVxLmxlbmd0aCwgbiA9IEFlcVswXS5sZW5ndGgsIG8gPSBBLmxlbmd0aDtcbiAgICB2YXIgQiA9IG51bWVyaWMuZWNoZWxvbml6ZShBZXEpO1xuICAgIHZhciBmbGFncyA9IG51bWVyaWMucmVwKFtuXSwwKTtcbiAgICB2YXIgUCA9IEIuUDtcbiAgICB2YXIgUSA9IFtdO1xuICAgIHZhciBpO1xuICAgIGZvcihpPVAubGVuZ3RoLTE7aSE9PS0xOy0taSkgZmxhZ3NbUFtpXV0gPSAxO1xuICAgIGZvcihpPW4tMTtpIT09LTE7LS1pKSBpZihmbGFnc1tpXT09PTApIFEucHVzaChpKTtcbiAgICB2YXIgZyA9IG51bWVyaWMuZ2V0UmFuZ2U7XG4gICAgdmFyIEkgPSBudW1lcmljLmxpbnNwYWNlKDAsbS0xKSwgSiA9IG51bWVyaWMubGluc3BhY2UoMCxvLTEpO1xuICAgIHZhciBBZXEyID0gZyhBZXEsSSxRKSwgQTEgPSBnKEEsSixQKSwgQTIgPSBnKEEsSixRKSwgZG90ID0gbnVtZXJpYy5kb3QsIHN1YiA9IG51bWVyaWMuc3ViO1xuICAgIHZhciBBMyA9IGRvdChBMSxCLkkpO1xuICAgIHZhciBBNCA9IHN1YihBMixkb3QoQTMsQWVxMikpLCBiNCA9IHN1YihiLGRvdChBMyxiZXEpKTtcbiAgICB2YXIgYzEgPSBBcnJheShQLmxlbmd0aCksIGMyID0gQXJyYXkoUS5sZW5ndGgpO1xuICAgIGZvcihpPVAubGVuZ3RoLTE7aSE9PS0xOy0taSkgYzFbaV0gPSBjW1BbaV1dO1xuICAgIGZvcihpPVEubGVuZ3RoLTE7aSE9PS0xOy0taSkgYzJbaV0gPSBjW1FbaV1dO1xuICAgIHZhciBjNCA9IHN1YihjMixkb3QoYzEsZG90KEIuSSxBZXEyKSkpO1xuICAgIHZhciBTID0gbnVtZXJpYy5fc29sdmVMUChjNCxBNCxiNCx0b2wsbWF4aXQpO1xuICAgIHZhciB4MiA9IFMuc29sdXRpb247XG4gICAgaWYoeDIhPT14MikgcmV0dXJuIFM7XG4gICAgdmFyIHgxID0gZG90KEIuSSxzdWIoYmVxLGRvdChBZXEyLHgyKSkpO1xuICAgIHZhciB4ID0gQXJyYXkoYy5sZW5ndGgpO1xuICAgIGZvcihpPVAubGVuZ3RoLTE7aSE9PS0xOy0taSkgeFtQW2ldXSA9IHgxW2ldO1xuICAgIGZvcihpPVEubGVuZ3RoLTE7aSE9PS0xOy0taSkgeFtRW2ldXSA9IHgyW2ldO1xuICAgIHJldHVybiB7IHNvbHV0aW9uOiB4LCBtZXNzYWdlOlMubWVzc2FnZSwgaXRlcmF0aW9uczogUy5pdGVyYXRpb25zIH07XG59XG5cbm51bWVyaWMuTVBTdG9MUCA9IGZ1bmN0aW9uIE1QU3RvTFAoTVBTKSB7XG4gICAgaWYoTVBTIGluc3RhbmNlb2YgU3RyaW5nKSB7IE1QUy5zcGxpdCgnXFxuJyk7IH1cbiAgICB2YXIgc3RhdGUgPSAwO1xuICAgIHZhciBzdGF0ZXMgPSBbJ0luaXRpYWwgc3RhdGUnLCdOQU1FJywnUk9XUycsJ0NPTFVNTlMnLCdSSFMnLCdCT1VORFMnLCdFTkRBVEEnXTtcbiAgICB2YXIgbiA9IE1QUy5sZW5ndGg7XG4gICAgdmFyIGksaix6LE49MCxyb3dzID0ge30sIHNpZ24gPSBbXSwgcmwgPSAwLCB2YXJzID0ge30sIG52ID0gMDtcbiAgICB2YXIgbmFtZTtcbiAgICB2YXIgYyA9IFtdLCBBID0gW10sIGIgPSBbXTtcbiAgICBmdW5jdGlvbiBlcnIoZSkgeyB0aHJvdyBuZXcgRXJyb3IoJ01QU3RvTFA6ICcrZSsnXFxuTGluZSAnK2krJzogJytNUFNbaV0rJ1xcbkN1cnJlbnQgc3RhdGU6ICcrc3RhdGVzW3N0YXRlXSsnXFxuJyk7IH1cbiAgICBmb3IoaT0wO2k8bjsrK2kpIHtcbiAgICAgICAgeiA9IE1QU1tpXTtcbiAgICAgICAgdmFyIHcwID0gei5tYXRjaCgvXFxTKi9nKTtcbiAgICAgICAgdmFyIHcgPSBbXTtcbiAgICAgICAgZm9yKGo9MDtqPHcwLmxlbmd0aDsrK2opIGlmKHcwW2pdIT09XCJcIikgdy5wdXNoKHcwW2pdKTtcbiAgICAgICAgaWYody5sZW5ndGggPT09IDApIGNvbnRpbnVlO1xuICAgICAgICBmb3Ioaj0wO2o8c3RhdGVzLmxlbmd0aDsrK2opIGlmKHouc3Vic3RyKDAsc3RhdGVzW2pdLmxlbmd0aCkgPT09IHN0YXRlc1tqXSkgYnJlYWs7XG4gICAgICAgIGlmKGo8c3RhdGVzLmxlbmd0aCkge1xuICAgICAgICAgICAgc3RhdGUgPSBqO1xuICAgICAgICAgICAgaWYoaj09PTEpIHsgbmFtZSA9IHdbMV07IH1cbiAgICAgICAgICAgIGlmKGo9PT02KSByZXR1cm4geyBuYW1lOm5hbWUsIGM6YywgQTpudW1lcmljLnRyYW5zcG9zZShBKSwgYjpiLCByb3dzOnJvd3MsIHZhcnM6dmFycyB9O1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgc3dpdGNoKHN0YXRlKSB7XG4gICAgICAgIGNhc2UgMDogY2FzZSAxOiBlcnIoJ1VuZXhwZWN0ZWQgbGluZScpO1xuICAgICAgICBjYXNlIDI6IFxuICAgICAgICAgICAgc3dpdGNoKHdbMF0pIHtcbiAgICAgICAgICAgIGNhc2UgJ04nOiBpZihOPT09MCkgTiA9IHdbMV07IGVsc2UgZXJyKCdUd28gb3IgbW9yZSBOIHJvd3MnKTsgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdMJzogcm93c1t3WzFdXSA9IHJsOyBzaWduW3JsXSA9IDE7IGJbcmxdID0gMDsgKytybDsgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdHJzogcm93c1t3WzFdXSA9IHJsOyBzaWduW3JsXSA9IC0xO2JbcmxdID0gMDsgKytybDsgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdFJzogcm93c1t3WzFdXSA9IHJsOyBzaWduW3JsXSA9IDA7YltybF0gPSAwOyArK3JsOyBicmVhaztcbiAgICAgICAgICAgIGRlZmF1bHQ6IGVycignUGFyc2UgZXJyb3IgJytudW1lcmljLnByZXR0eVByaW50KHcpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIDM6XG4gICAgICAgICAgICBpZighdmFycy5oYXNPd25Qcm9wZXJ0eSh3WzBdKSkgeyB2YXJzW3dbMF1dID0gbnY7IGNbbnZdID0gMDsgQVtudl0gPSBudW1lcmljLnJlcChbcmxdLDApOyArK252OyB9XG4gICAgICAgICAgICB2YXIgcCA9IHZhcnNbd1swXV07XG4gICAgICAgICAgICBmb3Ioaj0xO2o8dy5sZW5ndGg7ais9Mikge1xuICAgICAgICAgICAgICAgIGlmKHdbal0gPT09IE4pIHsgY1twXSA9IHBhcnNlRmxvYXQod1tqKzFdKTsgY29udGludWU7IH1cbiAgICAgICAgICAgICAgICB2YXIgcSA9IHJvd3Nbd1tqXV07XG4gICAgICAgICAgICAgICAgQVtwXVtxXSA9IChzaWduW3FdPDA/LTE6MSkqcGFyc2VGbG9hdCh3W2orMV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgNDpcbiAgICAgICAgICAgIGZvcihqPTE7ajx3Lmxlbmd0aDtqKz0yKSBiW3Jvd3Nbd1tqXV1dID0gKHNpZ25bcm93c1t3W2pdXV08MD8tMToxKSpwYXJzZUZsb2F0KHdbaisxXSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSA1OiAvKkZJWE1FKi8gYnJlYWs7XG4gICAgICAgIGNhc2UgNjogZXJyKCdJbnRlcm5hbCBlcnJvcicpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGVycignUmVhY2hlZCBlbmQgb2YgZmlsZSB3aXRob3V0IEVOREFUQScpO1xufVxuLy8gc2VlZHJhbmRvbS5qcyB2ZXJzaW9uIDIuMC5cbi8vIEF1dGhvcjogRGF2aWQgQmF1IDQvMi8yMDExXG4vL1xuLy8gRGVmaW5lcyBhIG1ldGhvZCBNYXRoLnNlZWRyYW5kb20oKSB0aGF0LCB3aGVuIGNhbGxlZCwgc3Vic3RpdHV0ZXNcbi8vIGFuIGV4cGxpY2l0bHkgc2VlZGVkIFJDNC1iYXNlZCBhbGdvcml0aG0gZm9yIE1hdGgucmFuZG9tKCkuICBBbHNvXG4vLyBzdXBwb3J0cyBhdXRvbWF0aWMgc2VlZGluZyBmcm9tIGxvY2FsIG9yIG5ldHdvcmsgc291cmNlcyBvZiBlbnRyb3B5LlxuLy9cbi8vIFVzYWdlOlxuLy9cbi8vICAgPHNjcmlwdCBzcmM9aHR0cDovL2RhdmlkYmF1LmNvbS9lbmNvZGUvc2VlZHJhbmRvbS1taW4uanM+PC9zY3JpcHQ+XG4vL1xuLy8gICBNYXRoLnNlZWRyYW5kb20oJ3lpcGVlJyk7IFNldHMgTWF0aC5yYW5kb20gdG8gYSBmdW5jdGlvbiB0aGF0IGlzXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5pdGlhbGl6ZWQgdXNpbmcgdGhlIGdpdmVuIGV4cGxpY2l0IHNlZWQuXG4vL1xuLy8gICBNYXRoLnNlZWRyYW5kb20oKTsgICAgICAgIFNldHMgTWF0aC5yYW5kb20gdG8gYSBmdW5jdGlvbiB0aGF0IGlzXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VlZGVkIHVzaW5nIHRoZSBjdXJyZW50IHRpbWUsIGRvbSBzdGF0ZSxcbi8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbmQgb3RoZXIgYWNjdW11bGF0ZWQgbG9jYWwgZW50cm9weS5cbi8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICBUaGUgZ2VuZXJhdGVkIHNlZWQgc3RyaW5nIGlzIHJldHVybmVkLlxuLy9cbi8vICAgTWF0aC5zZWVkcmFuZG9tKCd5b3d6YScsIHRydWUpO1xuLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgIFNlZWRzIHVzaW5nIHRoZSBnaXZlbiBleHBsaWNpdCBzZWVkIG1peGVkXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdG9nZXRoZXIgd2l0aCBhY2N1bXVsYXRlZCBlbnRyb3B5LlxuLy9cbi8vICAgPHNjcmlwdCBzcmM9XCJodHRwOi8vYml0Lmx5L3NyYW5kb20tNTEyXCI+PC9zY3JpcHQ+XG4vLyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgU2VlZHMgdXNpbmcgcGh5c2ljYWwgcmFuZG9tIGJpdHMgZG93bmxvYWRlZFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZyb20gcmFuZG9tLm9yZy5cbi8vXG4vLyAgIDxzY3JpcHQgc3JjPVwiaHR0cHM6Ly9qc29ubGliLmFwcHNwb3QuY29tL3VyYW5kb20/Y2FsbGJhY2s9TWF0aC5zZWVkcmFuZG9tXCI+XG4vLyAgIDwvc2NyaXB0PiAgICAgICAgICAgICAgICAgU2VlZHMgdXNpbmcgdXJhbmRvbSBiaXRzIGZyb20gY2FsbC5qc29ubGliLmNvbSxcbi8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aGljaCBpcyBmYXN0ZXIgdGhhbiByYW5kb20ub3JnLlxuLy9cbi8vIEV4YW1wbGVzOlxuLy9cbi8vICAgTWF0aC5zZWVkcmFuZG9tKFwiaGVsbG9cIik7ICAgICAgICAgICAgLy8gVXNlIFwiaGVsbG9cIiBhcyB0aGUgc2VlZC5cbi8vICAgZG9jdW1lbnQud3JpdGUoTWF0aC5yYW5kb20oKSk7ICAgICAgIC8vIEFsd2F5cyAwLjU0NjM2NjM3NjgxNDA3MzRcbi8vICAgZG9jdW1lbnQud3JpdGUoTWF0aC5yYW5kb20oKSk7ICAgICAgIC8vIEFsd2F5cyAwLjQzOTczNzkzNzcwNTkyMjM0XG4vLyAgIHZhciBybmcxID0gTWF0aC5yYW5kb207ICAgICAgICAgICAgICAvLyBSZW1lbWJlciB0aGUgY3VycmVudCBwcm5nLlxuLy9cbi8vICAgdmFyIGF1dG9zZWVkID0gTWF0aC5zZWVkcmFuZG9tKCk7ICAgIC8vIE5ldyBwcm5nIHdpdGggYW4gYXV0b21hdGljIHNlZWQuXG4vLyAgIGRvY3VtZW50LndyaXRlKE1hdGgucmFuZG9tKCkpOyAgICAgICAvLyBQcmV0dHkgbXVjaCB1bnByZWRpY3RhYmxlLlxuLy9cbi8vICAgTWF0aC5yYW5kb20gPSBybmcxOyAgICAgICAgICAgICAgICAgIC8vIENvbnRpbnVlIFwiaGVsbG9cIiBwcm5nIHNlcXVlbmNlLlxuLy8gICBkb2N1bWVudC53cml0ZShNYXRoLnJhbmRvbSgpKTsgICAgICAgLy8gQWx3YXlzIDAuNTU0NzY5NDMyNDczNDU1XG4vL1xuLy8gICBNYXRoLnNlZWRyYW5kb20oYXV0b3NlZWQpOyAgICAgICAgICAgLy8gUmVzdGFydCBhdCB0aGUgcHJldmlvdXMgc2VlZC5cbi8vICAgZG9jdW1lbnQud3JpdGUoTWF0aC5yYW5kb20oKSk7ICAgICAgIC8vIFJlcGVhdCB0aGUgJ3VucHJlZGljdGFibGUnIHZhbHVlLlxuLy9cbi8vIE5vdGVzOlxuLy9cbi8vIEVhY2ggdGltZSBzZWVkcmFuZG9tKCdhcmcnKSBpcyBjYWxsZWQsIGVudHJvcHkgZnJvbSB0aGUgcGFzc2VkIHNlZWRcbi8vIGlzIGFjY3VtdWxhdGVkIGluIGEgcG9vbCB0byBoZWxwIGdlbmVyYXRlIGZ1dHVyZSBzZWVkcyBmb3IgdGhlXG4vLyB6ZXJvLWFyZ3VtZW50IGZvcm0gb2YgTWF0aC5zZWVkcmFuZG9tLCBzbyBlbnRyb3B5IGNhbiBiZSBpbmplY3RlZCBvdmVyXG4vLyB0aW1lIGJ5IGNhbGxpbmcgc2VlZHJhbmRvbSB3aXRoIGV4cGxpY2l0IGRhdGEgcmVwZWF0ZWRseS5cbi8vXG4vLyBPbiBzcGVlZCAtIFRoaXMgamF2YXNjcmlwdCBpbXBsZW1lbnRhdGlvbiBvZiBNYXRoLnJhbmRvbSgpIGlzIGFib3V0XG4vLyAzLTEweCBzbG93ZXIgdGhhbiB0aGUgYnVpbHQtaW4gTWF0aC5yYW5kb20oKSBiZWNhdXNlIGl0IGlzIG5vdCBuYXRpdmVcbi8vIGNvZGUsIGJ1dCB0aGlzIGlzIHR5cGljYWxseSBmYXN0IGVub3VnaCBhbnl3YXkuICBTZWVkaW5nIGlzIG1vcmUgZXhwZW5zaXZlLFxuLy8gZXNwZWNpYWxseSBpZiB5b3UgdXNlIGF1dG8tc2VlZGluZy4gIFNvbWUgZGV0YWlscyAodGltaW5ncyBvbiBDaHJvbWUgNCk6XG4vL1xuLy8gT3VyIE1hdGgucmFuZG9tKCkgICAgICAgICAgICAtIGF2ZyBsZXNzIHRoYW4gMC4wMDIgbWlsbGlzZWNvbmRzIHBlciBjYWxsXG4vLyBzZWVkcmFuZG9tKCdleHBsaWNpdCcpICAgICAgIC0gYXZnIGxlc3MgdGhhbiAwLjUgbWlsbGlzZWNvbmRzIHBlciBjYWxsXG4vLyBzZWVkcmFuZG9tKCdleHBsaWNpdCcsIHRydWUpIC0gYXZnIGxlc3MgdGhhbiAyIG1pbGxpc2Vjb25kcyBwZXIgY2FsbFxuLy8gc2VlZHJhbmRvbSgpICAgICAgICAgICAgICAgICAtIGF2ZyBhYm91dCAzOCBtaWxsaXNlY29uZHMgcGVyIGNhbGxcbi8vXG4vLyBMSUNFTlNFIChCU0QpOlxuLy9cbi8vIENvcHlyaWdodCAyMDEwIERhdmlkIEJhdSwgYWxsIHJpZ2h0cyByZXNlcnZlZC5cbi8vXG4vLyBSZWRpc3RyaWJ1dGlvbiBhbmQgdXNlIGluIHNvdXJjZSBhbmQgYmluYXJ5IGZvcm1zLCB3aXRoIG9yIHdpdGhvdXRcbi8vIG1vZGlmaWNhdGlvbiwgYXJlIHBlcm1pdHRlZCBwcm92aWRlZCB0aGF0IHRoZSBmb2xsb3dpbmcgY29uZGl0aW9ucyBhcmUgbWV0OlxuLy8gXG4vLyAgIDEuIFJlZGlzdHJpYnV0aW9ucyBvZiBzb3VyY2UgY29kZSBtdXN0IHJldGFpbiB0aGUgYWJvdmUgY29weXJpZ2h0XG4vLyAgICAgIG5vdGljZSwgdGhpcyBsaXN0IG9mIGNvbmRpdGlvbnMgYW5kIHRoZSBmb2xsb3dpbmcgZGlzY2xhaW1lci5cbi8vXG4vLyAgIDIuIFJlZGlzdHJpYnV0aW9ucyBpbiBiaW5hcnkgZm9ybSBtdXN0IHJlcHJvZHVjZSB0aGUgYWJvdmUgY29weXJpZ2h0XG4vLyAgICAgIG5vdGljZSwgdGhpcyBsaXN0IG9mIGNvbmRpdGlvbnMgYW5kIHRoZSBmb2xsb3dpbmcgZGlzY2xhaW1lciBpbiB0aGVcbi8vICAgICAgZG9jdW1lbnRhdGlvbiBhbmQvb3Igb3RoZXIgbWF0ZXJpYWxzIHByb3ZpZGVkIHdpdGggdGhlIGRpc3RyaWJ1dGlvbi5cbi8vIFxuLy8gICAzLiBOZWl0aGVyIHRoZSBuYW1lIG9mIHRoaXMgbW9kdWxlIG5vciB0aGUgbmFtZXMgb2YgaXRzIGNvbnRyaWJ1dG9ycyBtYXlcbi8vICAgICAgYmUgdXNlZCB0byBlbmRvcnNlIG9yIHByb21vdGUgcHJvZHVjdHMgZGVyaXZlZCBmcm9tIHRoaXMgc29mdHdhcmVcbi8vICAgICAgd2l0aG91dCBzcGVjaWZpYyBwcmlvciB3cml0dGVuIHBlcm1pc3Npb24uXG4vLyBcbi8vIFRISVMgU09GVFdBUkUgSVMgUFJPVklERUQgQlkgVEhFIENPUFlSSUdIVCBIT0xERVJTIEFORCBDT05UUklCVVRPUlNcbi8vIFwiQVMgSVNcIiBBTkQgQU5ZIEVYUFJFU1MgT1IgSU1QTElFRCBXQVJSQU5USUVTLCBJTkNMVURJTkcsIEJVVCBOT1Rcbi8vIExJTUlURUQgVE8sIFRIRSBJTVBMSUVEIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZIEFORCBGSVRORVNTIEZPUlxuLy8gQSBQQVJUSUNVTEFSIFBVUlBPU0UgQVJFIERJU0NMQUlNRUQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRSBDT1BZUklHSFRcbi8vIE9XTkVSIE9SIENPTlRSSUJVVE9SUyBCRSBMSUFCTEUgRk9SIEFOWSBESVJFQ1QsIElORElSRUNULCBJTkNJREVOVEFMLFxuLy8gU1BFQ0lBTCwgRVhFTVBMQVJZLCBPUiBDT05TRVFVRU5USUFMIERBTUFHRVMgKElOQ0xVRElORywgQlVUIE5PVFxuLy8gTElNSVRFRCBUTywgUFJPQ1VSRU1FTlQgT0YgU1VCU1RJVFVURSBHT09EUyBPUiBTRVJWSUNFUzsgTE9TUyBPRiBVU0UsXG4vLyBEQVRBLCBPUiBQUk9GSVRTOyBPUiBCVVNJTkVTUyBJTlRFUlJVUFRJT04pIEhPV0VWRVIgQ0FVU0VEIEFORCBPTiBBTllcbi8vIFRIRU9SWSBPRiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQ09OVFJBQ1QsIFNUUklDVCBMSUFCSUxJVFksIE9SIFRPUlRcbi8vIChJTkNMVURJTkcgTkVHTElHRU5DRSBPUiBPVEhFUldJU0UpIEFSSVNJTkcgSU4gQU5ZIFdBWSBPVVQgT0YgVEhFIFVTRVxuLy8gT0YgVEhJUyBTT0ZUV0FSRSwgRVZFTiBJRiBBRFZJU0VEIE9GIFRIRSBQT1NTSUJJTElUWSBPRiBTVUNIIERBTUFHRS5cbi8vXG4vKipcbiAqIEFsbCBjb2RlIGlzIGluIGFuIGFub255bW91cyBjbG9zdXJlIHRvIGtlZXAgdGhlIGdsb2JhbCBuYW1lc3BhY2UgY2xlYW4uXG4gKlxuICogQHBhcmFtIHtudW1iZXI9fSBvdmVyZmxvdyBcbiAqIEBwYXJhbSB7bnVtYmVyPX0gc3RhcnRkZW5vbVxuICovXG5cbi8vIFBhdGNoZWQgYnkgU2ViIHNvIHRoYXQgc2VlZHJhbmRvbS5qcyBkb2VzIG5vdCBwb2xsdXRlIHRoZSBNYXRoIG9iamVjdC5cbi8vIE15IHRlc3RzIHN1Z2dlc3QgdGhhdCBkb2luZyBNYXRoLnRyb3VibGUgPSAxIG1ha2VzIE1hdGggbG9va3VwcyBhYm91dCA1JVxuLy8gc2xvd2VyLlxubnVtZXJpYy5zZWVkcmFuZG9tID0geyBwb3c6TWF0aC5wb3csIHJhbmRvbTpNYXRoLnJhbmRvbSB9O1xuXG4oZnVuY3Rpb24gKHBvb2wsIG1hdGgsIHdpZHRoLCBjaHVua3MsIHNpZ25pZmljYW5jZSwgb3ZlcmZsb3csIHN0YXJ0ZGVub20pIHtcblxuXG4vL1xuLy8gc2VlZHJhbmRvbSgpXG4vLyBUaGlzIGlzIHRoZSBzZWVkcmFuZG9tIGZ1bmN0aW9uIGRlc2NyaWJlZCBhYm92ZS5cbi8vXG5tYXRoWydzZWVkcmFuZG9tJ10gPSBmdW5jdGlvbiBzZWVkcmFuZG9tKHNlZWQsIHVzZV9lbnRyb3B5KSB7XG4gIHZhciBrZXkgPSBbXTtcbiAgdmFyIGFyYzQ7XG5cbiAgLy8gRmxhdHRlbiB0aGUgc2VlZCBzdHJpbmcgb3IgYnVpbGQgb25lIGZyb20gbG9jYWwgZW50cm9weSBpZiBuZWVkZWQuXG4gIHNlZWQgPSBtaXhrZXkoZmxhdHRlbihcbiAgICB1c2VfZW50cm9weSA/IFtzZWVkLCBwb29sXSA6XG4gICAgYXJndW1lbnRzLmxlbmd0aCA/IHNlZWQgOlxuICAgIFtuZXcgRGF0ZSgpLmdldFRpbWUoKSwgcG9vbCwgd2luZG93XSwgMyksIGtleSk7XG5cbiAgLy8gVXNlIHRoZSBzZWVkIHRvIGluaXRpYWxpemUgYW4gQVJDNCBnZW5lcmF0b3IuXG4gIGFyYzQgPSBuZXcgQVJDNChrZXkpO1xuXG4gIC8vIE1peCB0aGUgcmFuZG9tbmVzcyBpbnRvIGFjY3VtdWxhdGVkIGVudHJvcHkuXG4gIG1peGtleShhcmM0LlMsIHBvb2wpO1xuXG4gIC8vIE92ZXJyaWRlIE1hdGgucmFuZG9tXG5cbiAgLy8gVGhpcyBmdW5jdGlvbiByZXR1cm5zIGEgcmFuZG9tIGRvdWJsZSBpbiBbMCwgMSkgdGhhdCBjb250YWluc1xuICAvLyByYW5kb21uZXNzIGluIGV2ZXJ5IGJpdCBvZiB0aGUgbWFudGlzc2Egb2YgdGhlIElFRUUgNzU0IHZhbHVlLlxuXG4gIG1hdGhbJ3JhbmRvbSddID0gZnVuY3Rpb24gcmFuZG9tKCkgeyAgLy8gQ2xvc3VyZSB0byByZXR1cm4gYSByYW5kb20gZG91YmxlOlxuICAgIHZhciBuID0gYXJjNC5nKGNodW5rcyk7ICAgICAgICAgICAgIC8vIFN0YXJ0IHdpdGggYSBudW1lcmF0b3IgbiA8IDIgXiA0OFxuICAgIHZhciBkID0gc3RhcnRkZW5vbTsgICAgICAgICAgICAgICAgIC8vICAgYW5kIGRlbm9taW5hdG9yIGQgPSAyIF4gNDguXG4gICAgdmFyIHggPSAwOyAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gICBhbmQgbm8gJ2V4dHJhIGxhc3QgYnl0ZScuXG4gICAgd2hpbGUgKG4gPCBzaWduaWZpY2FuY2UpIHsgICAgICAgICAgLy8gRmlsbCB1cCBhbGwgc2lnbmlmaWNhbnQgZGlnaXRzIGJ5XG4gICAgICBuID0gKG4gKyB4KSAqIHdpZHRoOyAgICAgICAgICAgICAgLy8gICBzaGlmdGluZyBudW1lcmF0b3IgYW5kXG4gICAgICBkICo9IHdpZHRoOyAgICAgICAgICAgICAgICAgICAgICAgLy8gICBkZW5vbWluYXRvciBhbmQgZ2VuZXJhdGluZyBhXG4gICAgICB4ID0gYXJjNC5nKDEpOyAgICAgICAgICAgICAgICAgICAgLy8gICBuZXcgbGVhc3Qtc2lnbmlmaWNhbnQtYnl0ZS5cbiAgICB9XG4gICAgd2hpbGUgKG4gPj0gb3ZlcmZsb3cpIHsgICAgICAgICAgICAgLy8gVG8gYXZvaWQgcm91bmRpbmcgdXAsIGJlZm9yZSBhZGRpbmdcbiAgICAgIG4gLz0gMjsgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAgIGxhc3QgYnl0ZSwgc2hpZnQgZXZlcnl0aGluZ1xuICAgICAgZCAvPSAyOyAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgcmlnaHQgdXNpbmcgaW50ZWdlciBtYXRoIHVudGlsXG4gICAgICB4ID4+Pj0gMTsgICAgICAgICAgICAgICAgICAgICAgICAgLy8gICB3ZSBoYXZlIGV4YWN0bHkgdGhlIGRlc2lyZWQgYml0cy5cbiAgICB9XG4gICAgcmV0dXJuIChuICsgeCkgLyBkOyAgICAgICAgICAgICAgICAgLy8gRm9ybSB0aGUgbnVtYmVyIHdpdGhpbiBbMCwgMSkuXG4gIH07XG5cbiAgLy8gUmV0dXJuIHRoZSBzZWVkIHRoYXQgd2FzIHVzZWRcbiAgcmV0dXJuIHNlZWQ7XG59O1xuXG4vL1xuLy8gQVJDNFxuLy9cbi8vIEFuIEFSQzQgaW1wbGVtZW50YXRpb24uICBUaGUgY29uc3RydWN0b3IgdGFrZXMgYSBrZXkgaW4gdGhlIGZvcm0gb2Zcbi8vIGFuIGFycmF5IG9mIGF0IG1vc3QgKHdpZHRoKSBpbnRlZ2VycyB0aGF0IHNob3VsZCBiZSAwIDw9IHggPCAod2lkdGgpLlxuLy9cbi8vIFRoZSBnKGNvdW50KSBtZXRob2QgcmV0dXJucyBhIHBzZXVkb3JhbmRvbSBpbnRlZ2VyIHRoYXQgY29uY2F0ZW5hdGVzXG4vLyB0aGUgbmV4dCAoY291bnQpIG91dHB1dHMgZnJvbSBBUkM0LiAgSXRzIHJldHVybiB2YWx1ZSBpcyBhIG51bWJlciB4XG4vLyB0aGF0IGlzIGluIHRoZSByYW5nZSAwIDw9IHggPCAod2lkdGggXiBjb3VudCkuXG4vL1xuLyoqIEBjb25zdHJ1Y3RvciAqL1xuZnVuY3Rpb24gQVJDNChrZXkpIHtcbiAgdmFyIHQsIHUsIG1lID0gdGhpcywga2V5bGVuID0ga2V5Lmxlbmd0aDtcbiAgdmFyIGkgPSAwLCBqID0gbWUuaSA9IG1lLmogPSBtZS5tID0gMDtcbiAgbWUuUyA9IFtdO1xuICBtZS5jID0gW107XG5cbiAgLy8gVGhlIGVtcHR5IGtleSBbXSBpcyB0cmVhdGVkIGFzIFswXS5cbiAgaWYgKCFrZXlsZW4pIHsga2V5ID0gW2tleWxlbisrXTsgfVxuXG4gIC8vIFNldCB1cCBTIHVzaW5nIHRoZSBzdGFuZGFyZCBrZXkgc2NoZWR1bGluZyBhbGdvcml0aG0uXG4gIHdoaWxlIChpIDwgd2lkdGgpIHsgbWUuU1tpXSA9IGkrKzsgfVxuICBmb3IgKGkgPSAwOyBpIDwgd2lkdGg7IGkrKykge1xuICAgIHQgPSBtZS5TW2ldO1xuICAgIGogPSBsb3diaXRzKGogKyB0ICsga2V5W2kgJSBrZXlsZW5dKTtcbiAgICB1ID0gbWUuU1tqXTtcbiAgICBtZS5TW2ldID0gdTtcbiAgICBtZS5TW2pdID0gdDtcbiAgfVxuXG4gIC8vIFRoZSBcImdcIiBtZXRob2QgcmV0dXJucyB0aGUgbmV4dCAoY291bnQpIG91dHB1dHMgYXMgb25lIG51bWJlci5cbiAgbWUuZyA9IGZ1bmN0aW9uIGdldG5leHQoY291bnQpIHtcbiAgICB2YXIgcyA9IG1lLlM7XG4gICAgdmFyIGkgPSBsb3diaXRzKG1lLmkgKyAxKTsgdmFyIHQgPSBzW2ldO1xuICAgIHZhciBqID0gbG93Yml0cyhtZS5qICsgdCk7IHZhciB1ID0gc1tqXTtcbiAgICBzW2ldID0gdTtcbiAgICBzW2pdID0gdDtcbiAgICB2YXIgciA9IHNbbG93Yml0cyh0ICsgdSldO1xuICAgIHdoaWxlICgtLWNvdW50KSB7XG4gICAgICBpID0gbG93Yml0cyhpICsgMSk7IHQgPSBzW2ldO1xuICAgICAgaiA9IGxvd2JpdHMoaiArIHQpOyB1ID0gc1tqXTtcbiAgICAgIHNbaV0gPSB1O1xuICAgICAgc1tqXSA9IHQ7XG4gICAgICByID0gciAqIHdpZHRoICsgc1tsb3diaXRzKHQgKyB1KV07XG4gICAgfVxuICAgIG1lLmkgPSBpO1xuICAgIG1lLmogPSBqO1xuICAgIHJldHVybiByO1xuICB9O1xuICAvLyBGb3Igcm9idXN0IHVucHJlZGljdGFiaWxpdHkgZGlzY2FyZCBhbiBpbml0aWFsIGJhdGNoIG9mIHZhbHVlcy5cbiAgLy8gU2VlIGh0dHA6Ly93d3cucnNhLmNvbS9yc2FsYWJzL25vZGUuYXNwP2lkPTIwMDlcbiAgbWUuZyh3aWR0aCk7XG59XG5cbi8vXG4vLyBmbGF0dGVuKClcbi8vIENvbnZlcnRzIGFuIG9iamVjdCB0cmVlIHRvIG5lc3RlZCBhcnJheXMgb2Ygc3RyaW5ncy5cbi8vXG4vKiogQHBhcmFtIHtPYmplY3Q9fSByZXN1bHQgXG4gICogQHBhcmFtIHtzdHJpbmc9fSBwcm9wXG4gICogQHBhcmFtIHtzdHJpbmc9fSB0eXAgKi9cbmZ1bmN0aW9uIGZsYXR0ZW4ob2JqLCBkZXB0aCwgcmVzdWx0LCBwcm9wLCB0eXApIHtcbiAgcmVzdWx0ID0gW107XG4gIHR5cCA9IHR5cGVvZihvYmopO1xuICBpZiAoZGVwdGggJiYgdHlwID09ICdvYmplY3QnKSB7XG4gICAgZm9yIChwcm9wIGluIG9iaikge1xuICAgICAgaWYgKHByb3AuaW5kZXhPZignUycpIDwgNSkgeyAgICAvLyBBdm9pZCBGRjMgYnVnIChsb2NhbC9zZXNzaW9uU3RvcmFnZSlcbiAgICAgICAgdHJ5IHsgcmVzdWx0LnB1c2goZmxhdHRlbihvYmpbcHJvcF0sIGRlcHRoIC0gMSkpOyB9IGNhdGNoIChlKSB7fVxuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gKHJlc3VsdC5sZW5ndGggPyByZXN1bHQgOiBvYmogKyAodHlwICE9ICdzdHJpbmcnID8gJ1xcMCcgOiAnJykpO1xufVxuXG4vL1xuLy8gbWl4a2V5KClcbi8vIE1peGVzIGEgc3RyaW5nIHNlZWQgaW50byBhIGtleSB0aGF0IGlzIGFuIGFycmF5IG9mIGludGVnZXJzLCBhbmRcbi8vIHJldHVybnMgYSBzaG9ydGVuZWQgc3RyaW5nIHNlZWQgdGhhdCBpcyBlcXVpdmFsZW50IHRvIHRoZSByZXN1bHQga2V5LlxuLy9cbi8qKiBAcGFyYW0ge251bWJlcj19IHNtZWFyIFxuICAqIEBwYXJhbSB7bnVtYmVyPX0gaiAqL1xuZnVuY3Rpb24gbWl4a2V5KHNlZWQsIGtleSwgc21lYXIsIGopIHtcbiAgc2VlZCArPSAnJzsgICAgICAgICAgICAgICAgICAgICAgICAgLy8gRW5zdXJlIHRoZSBzZWVkIGlzIGEgc3RyaW5nXG4gIHNtZWFyID0gMDtcbiAgZm9yIChqID0gMDsgaiA8IHNlZWQubGVuZ3RoOyBqKyspIHtcbiAgICBrZXlbbG93Yml0cyhqKV0gPVxuICAgICAgbG93Yml0cygoc21lYXIgXj0ga2V5W2xvd2JpdHMoaildICogMTkpICsgc2VlZC5jaGFyQ29kZUF0KGopKTtcbiAgfVxuICBzZWVkID0gJyc7XG4gIGZvciAoaiBpbiBrZXkpIHsgc2VlZCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGtleVtqXSk7IH1cbiAgcmV0dXJuIHNlZWQ7XG59XG5cbi8vXG4vLyBsb3diaXRzKClcbi8vIEEgcXVpY2sgXCJuIG1vZCB3aWR0aFwiIGZvciB3aWR0aCBhIHBvd2VyIG9mIDIuXG4vL1xuZnVuY3Rpb24gbG93Yml0cyhuKSB7IHJldHVybiBuICYgKHdpZHRoIC0gMSk7IH1cblxuLy9cbi8vIFRoZSBmb2xsb3dpbmcgY29uc3RhbnRzIGFyZSByZWxhdGVkIHRvIElFRUUgNzU0IGxpbWl0cy5cbi8vXG5zdGFydGRlbm9tID0gbWF0aC5wb3cod2lkdGgsIGNodW5rcyk7XG5zaWduaWZpY2FuY2UgPSBtYXRoLnBvdygyLCBzaWduaWZpY2FuY2UpO1xub3ZlcmZsb3cgPSBzaWduaWZpY2FuY2UgKiAyO1xuXG4vL1xuLy8gV2hlbiBzZWVkcmFuZG9tLmpzIGlzIGxvYWRlZCwgd2UgaW1tZWRpYXRlbHkgbWl4IGEgZmV3IGJpdHNcbi8vIGZyb20gdGhlIGJ1aWx0LWluIFJORyBpbnRvIHRoZSBlbnRyb3B5IHBvb2wuICBCZWNhdXNlIHdlIGRvXG4vLyBub3Qgd2FudCB0byBpbnRlZmVyZSB3aXRoIGRldGVybWluc3RpYyBQUk5HIHN0YXRlIGxhdGVyLFxuLy8gc2VlZHJhbmRvbSB3aWxsIG5vdCBjYWxsIG1hdGgucmFuZG9tIG9uIGl0cyBvd24gYWdhaW4gYWZ0ZXJcbi8vIGluaXRpYWxpemF0aW9uLlxuLy9cbm1peGtleShtYXRoLnJhbmRvbSgpLCBwb29sKTtcblxuLy8gRW5kIGFub255bW91cyBzY29wZSwgYW5kIHBhc3MgaW5pdGlhbCB2YWx1ZXMuXG59KFxuICBbXSwgICAvLyBwb29sOiBlbnRyb3B5IHBvb2wgc3RhcnRzIGVtcHR5XG4gIG51bWVyaWMuc2VlZHJhbmRvbSwgLy8gbWF0aDogcGFja2FnZSBjb250YWluaW5nIHJhbmRvbSwgcG93LCBhbmQgc2VlZHJhbmRvbVxuICAyNTYsICAvLyB3aWR0aDogZWFjaCBSQzQgb3V0cHV0IGlzIDAgPD0geCA8IDI1NlxuICA2LCAgICAvLyBjaHVua3M6IGF0IGxlYXN0IHNpeCBSQzQgb3V0cHV0cyBmb3IgZWFjaCBkb3VibGVcbiAgNTIgICAgLy8gc2lnbmlmaWNhbmNlOiB0aGVyZSBhcmUgNTIgc2lnbmlmaWNhbnQgZGlnaXRzIGluIGEgZG91YmxlXG4gICkpO1xuLyogVGhpcyBmaWxlIGlzIGEgc2xpZ2h0bHkgbW9kaWZpZWQgdmVyc2lvbiBvZiBxdWFkcHJvZy5qcyBmcm9tIEFsYmVydG8gU2FudGluaS5cbiAqIEl0IGhhcyBiZWVuIHNsaWdodGx5IG1vZGlmaWVkIGJ5IFPDqWJhc3RpZW4gTG9pc2VsIHRvIG1ha2Ugc3VyZSB0aGF0IGl0IGhhbmRsZXNcbiAqIDAtYmFzZWQgQXJyYXlzIGluc3RlYWQgb2YgMS1iYXNlZCBBcnJheXMuXG4gKiBMaWNlbnNlIGlzIGluIHJlc291cmNlcy9MSUNFTlNFLnF1YWRwcm9nICovXG4oZnVuY3Rpb24oZXhwb3J0cykge1xuXG5mdW5jdGlvbiBiYXNlMHRvMShBKSB7XG4gICAgaWYodHlwZW9mIEEgIT09IFwib2JqZWN0XCIpIHsgcmV0dXJuIEE7IH1cbiAgICB2YXIgcmV0ID0gW10sIGksbj1BLmxlbmd0aDtcbiAgICBmb3IoaT0wO2k8bjtpKyspIHJldFtpKzFdID0gYmFzZTB0bzEoQVtpXSk7XG4gICAgcmV0dXJuIHJldDtcbn1cbmZ1bmN0aW9uIGJhc2UxdG8wKEEpIHtcbiAgICBpZih0eXBlb2YgQSAhPT0gXCJvYmplY3RcIikgeyByZXR1cm4gQTsgfVxuICAgIHZhciByZXQgPSBbXSwgaSxuPUEubGVuZ3RoO1xuICAgIGZvcihpPTE7aTxuO2krKykgcmV0W2ktMV0gPSBiYXNlMXRvMChBW2ldKTtcbiAgICByZXR1cm4gcmV0O1xufVxuXG5mdW5jdGlvbiBkcG9yaShhLCBsZGEsIG4pIHtcbiAgICB2YXIgaSwgaiwgaywga3AxLCB0O1xuXG4gICAgZm9yIChrID0gMTsgayA8PSBuOyBrID0gayArIDEpIHtcbiAgICAgICAgYVtrXVtrXSA9IDEgLyBhW2tdW2tdO1xuICAgICAgICB0ID0gLWFba11ba107XG4gICAgICAgIC8vfiBkc2NhbChrIC0gMSwgdCwgYVsxXVtrXSwgMSk7XG4gICAgICAgIGZvciAoaSA9IDE7IGkgPCBrOyBpID0gaSArIDEpIHtcbiAgICAgICAgICAgIGFbaV1ba10gPSB0ICogYVtpXVtrXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGtwMSA9IGsgKyAxO1xuICAgICAgICBpZiAobiA8IGtwMSkge1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgZm9yIChqID0ga3AxOyBqIDw9IG47IGogPSBqICsgMSkge1xuICAgICAgICAgICAgdCA9IGFba11bal07XG4gICAgICAgICAgICBhW2tdW2pdID0gMDtcbiAgICAgICAgICAgIC8vfiBkYXhweShrLCB0LCBhWzFdW2tdLCAxLCBhWzFdW2pdLCAxKTtcbiAgICAgICAgICAgIGZvciAoaSA9IDE7IGkgPD0gazsgaSA9IGkgKyAxKSB7XG4gICAgICAgICAgICAgICAgYVtpXVtqXSA9IGFbaV1bal0gKyAodCAqIGFbaV1ba10pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG59XG5cbmZ1bmN0aW9uIGRwb3NsKGEsIGxkYSwgbiwgYikge1xuICAgIHZhciBpLCBrLCBrYiwgdDtcblxuICAgIGZvciAoayA9IDE7IGsgPD0gbjsgayA9IGsgKyAxKSB7XG4gICAgICAgIC8vfiB0ID0gZGRvdChrIC0gMSwgYVsxXVtrXSwgMSwgYlsxXSwgMSk7XG4gICAgICAgIHQgPSAwO1xuICAgICAgICBmb3IgKGkgPSAxOyBpIDwgazsgaSA9IGkgKyAxKSB7XG4gICAgICAgICAgICB0ID0gdCArIChhW2ldW2tdICogYltpXSk7XG4gICAgICAgIH1cblxuICAgICAgICBiW2tdID0gKGJba10gLSB0KSAvIGFba11ba107XG4gICAgfVxuXG4gICAgZm9yIChrYiA9IDE7IGtiIDw9IG47IGtiID0ga2IgKyAxKSB7XG4gICAgICAgIGsgPSBuICsgMSAtIGtiO1xuICAgICAgICBiW2tdID0gYltrXSAvIGFba11ba107XG4gICAgICAgIHQgPSAtYltrXTtcbiAgICAgICAgLy9+IGRheHB5KGsgLSAxLCB0LCBhWzFdW2tdLCAxLCBiWzFdLCAxKTtcbiAgICAgICAgZm9yIChpID0gMTsgaSA8IGs7IGkgPSBpICsgMSkge1xuICAgICAgICAgICAgYltpXSA9IGJbaV0gKyAodCAqIGFbaV1ba10pO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBkcG9mYShhLCBsZGEsIG4sIGluZm8pIHtcbiAgICB2YXIgaSwgaiwgam0xLCBrLCB0LCBzO1xuXG4gICAgZm9yIChqID0gMTsgaiA8PSBuOyBqID0gaiArIDEpIHtcbiAgICAgICAgaW5mb1sxXSA9IGo7XG4gICAgICAgIHMgPSAwO1xuICAgICAgICBqbTEgPSBqIC0gMTtcbiAgICAgICAgaWYgKGptMSA8IDEpIHtcbiAgICAgICAgICAgIHMgPSBhW2pdW2pdIC0gcztcbiAgICAgICAgICAgIGlmIChzIDw9IDApIHtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGFbal1bal0gPSBNYXRoLnNxcnQocyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBmb3IgKGsgPSAxOyBrIDw9IGptMTsgayA9IGsgKyAxKSB7XG4gICAgICAgICAgICAgICAgLy9+IHQgPSBhW2tdW2pdIC0gZGRvdChrIC0gMSwgYVsxXVtrXSwgMSwgYVsxXVtqXSwgMSk7XG4gICAgICAgICAgICAgICAgdCA9IGFba11bal07XG4gICAgICAgICAgICAgICAgZm9yIChpID0gMTsgaSA8IGs7IGkgPSBpICsgMSkge1xuICAgICAgICAgICAgICAgICAgICB0ID0gdCAtIChhW2ldW2pdICogYVtpXVtrXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHQgPSB0IC8gYVtrXVtrXTtcbiAgICAgICAgICAgICAgICBhW2tdW2pdID0gdDtcbiAgICAgICAgICAgICAgICBzID0gcyArIHQgKiB0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcyA9IGFbal1bal0gLSBzO1xuICAgICAgICAgICAgaWYgKHMgPD0gMCkge1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYVtqXVtqXSA9IE1hdGguc3FydChzKTtcbiAgICAgICAgfVxuICAgICAgICBpbmZvWzFdID0gMDtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHFwZ2VuMihkbWF0LCBkdmVjLCBmZGRtYXQsIG4sIHNvbCwgY3J2YWwsIGFtYXQsXG4gICAgYnZlYywgZmRhbWF0LCBxLCBtZXEsIGlhY3QsIG5hY3QsIGl0ZXIsIHdvcmssIGllcnIpIHtcblxuICAgIHZhciBpLCBqLCBsLCBsMSwgaW5mbywgaXQxLCBpd3p2LCBpd3J2LCBpd3JtLCBpd3N2LCBpd3V2LCBudmwsIHIsIGl3bmJ2LFxuICAgICAgICB0ZW1wLCBzdW0sIHQxLCB0dCwgZ2MsIGdzLCBudSxcbiAgICAgICAgdDFpbmYsIHQybWluLFxuICAgICAgICB2c21hbGwsIHRtcGEsIHRtcGIsXG4gICAgICAgIGdvO1xuXG4gICAgciA9IE1hdGgubWluKG4sIHEpO1xuICAgIGwgPSAyICogbiArIChyICogKHIgKyA1KSkgLyAyICsgMiAqIHEgKyAxO1xuXG4gICAgdnNtYWxsID0gMS4wZS02MDtcbiAgICBkbyB7XG4gICAgICAgIHZzbWFsbCA9IHZzbWFsbCArIHZzbWFsbDtcbiAgICAgICAgdG1wYSA9IDEgKyAwLjEgKiB2c21hbGw7XG4gICAgICAgIHRtcGIgPSAxICsgMC4yICogdnNtYWxsO1xuICAgIH0gd2hpbGUgKHRtcGEgPD0gMSB8fCB0bXBiIDw9IDEpO1xuXG4gICAgZm9yIChpID0gMTsgaSA8PSBuOyBpID0gaSArIDEpIHtcbiAgICAgICAgd29ya1tpXSA9IGR2ZWNbaV07XG4gICAgfVxuICAgIGZvciAoaSA9IG4gKyAxOyBpIDw9IGw7IGkgPSBpICsgMSkge1xuICAgICAgICB3b3JrW2ldID0gMDtcbiAgICB9XG4gICAgZm9yIChpID0gMTsgaSA8PSBxOyBpID0gaSArIDEpIHtcbiAgICAgICAgaWFjdFtpXSA9IDA7XG4gICAgfVxuXG4gICAgaW5mbyA9IFtdO1xuXG4gICAgaWYgKGllcnJbMV0gPT09IDApIHtcbiAgICAgICAgZHBvZmEoZG1hdCwgZmRkbWF0LCBuLCBpbmZvKTtcbiAgICAgICAgaWYgKGluZm9bMV0gIT09IDApIHtcbiAgICAgICAgICAgIGllcnJbMV0gPSAyO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGRwb3NsKGRtYXQsIGZkZG1hdCwgbiwgZHZlYyk7XG4gICAgICAgIGRwb3JpKGRtYXQsIGZkZG1hdCwgbik7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgZm9yIChqID0gMTsgaiA8PSBuOyBqID0gaiArIDEpIHtcbiAgICAgICAgICAgIHNvbFtqXSA9IDA7XG4gICAgICAgICAgICBmb3IgKGkgPSAxOyBpIDw9IGo7IGkgPSBpICsgMSkge1xuICAgICAgICAgICAgICAgIHNvbFtqXSA9IHNvbFtqXSArIGRtYXRbaV1bal0gKiBkdmVjW2ldO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGZvciAoaiA9IDE7IGogPD0gbjsgaiA9IGogKyAxKSB7XG4gICAgICAgICAgICBkdmVjW2pdID0gMDtcbiAgICAgICAgICAgIGZvciAoaSA9IGo7IGkgPD0gbjsgaSA9IGkgKyAxKSB7XG4gICAgICAgICAgICAgICAgZHZlY1tqXSA9IGR2ZWNbal0gKyBkbWF0W2pdW2ldICogc29sW2ldO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgY3J2YWxbMV0gPSAwO1xuICAgIGZvciAoaiA9IDE7IGogPD0gbjsgaiA9IGogKyAxKSB7XG4gICAgICAgIHNvbFtqXSA9IGR2ZWNbal07XG4gICAgICAgIGNydmFsWzFdID0gY3J2YWxbMV0gKyB3b3JrW2pdICogc29sW2pdO1xuICAgICAgICB3b3JrW2pdID0gMDtcbiAgICAgICAgZm9yIChpID0gaiArIDE7IGkgPD0gbjsgaSA9IGkgKyAxKSB7XG4gICAgICAgICAgICBkbWF0W2ldW2pdID0gMDtcbiAgICAgICAgfVxuICAgIH1cbiAgICBjcnZhbFsxXSA9IC1jcnZhbFsxXSAvIDI7XG4gICAgaWVyclsxXSA9IDA7XG5cbiAgICBpd3p2ID0gbjtcbiAgICBpd3J2ID0gaXd6diArIG47XG4gICAgaXd1diA9IGl3cnYgKyByO1xuICAgIGl3cm0gPSBpd3V2ICsgciArIDE7XG4gICAgaXdzdiA9IGl3cm0gKyAociAqIChyICsgMSkpIC8gMjtcbiAgICBpd25idiA9IGl3c3YgKyBxO1xuXG4gICAgZm9yIChpID0gMTsgaSA8PSBxOyBpID0gaSArIDEpIHtcbiAgICAgICAgc3VtID0gMDtcbiAgICAgICAgZm9yIChqID0gMTsgaiA8PSBuOyBqID0gaiArIDEpIHtcbiAgICAgICAgICAgIHN1bSA9IHN1bSArIGFtYXRbal1baV0gKiBhbWF0W2pdW2ldO1xuICAgICAgICB9XG4gICAgICAgIHdvcmtbaXduYnYgKyBpXSA9IE1hdGguc3FydChzdW0pO1xuICAgIH1cbiAgICBuYWN0ID0gMDtcbiAgICBpdGVyWzFdID0gMDtcbiAgICBpdGVyWzJdID0gMDtcblxuICAgIGZ1bmN0aW9uIGZuX2dvdG9fNTAoKSB7XG4gICAgICAgIGl0ZXJbMV0gPSBpdGVyWzFdICsgMTtcblxuICAgICAgICBsID0gaXdzdjtcbiAgICAgICAgZm9yIChpID0gMTsgaSA8PSBxOyBpID0gaSArIDEpIHtcbiAgICAgICAgICAgIGwgPSBsICsgMTtcbiAgICAgICAgICAgIHN1bSA9IC1idmVjW2ldO1xuICAgICAgICAgICAgZm9yIChqID0gMTsgaiA8PSBuOyBqID0gaiArIDEpIHtcbiAgICAgICAgICAgICAgICBzdW0gPSBzdW0gKyBhbWF0W2pdW2ldICogc29sW2pdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKE1hdGguYWJzKHN1bSkgPCB2c21hbGwpIHtcbiAgICAgICAgICAgICAgICBzdW0gPSAwO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGkgPiBtZXEpIHtcbiAgICAgICAgICAgICAgICB3b3JrW2xdID0gc3VtO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB3b3JrW2xdID0gLU1hdGguYWJzKHN1bSk7XG4gICAgICAgICAgICAgICAgaWYgKHN1bSA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChqID0gMTsgaiA8PSBuOyBqID0gaiArIDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFtYXRbal1baV0gPSAtYW1hdFtqXVtpXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBidmVjW2ldID0gLWJ2ZWNbaV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZm9yIChpID0gMTsgaSA8PSBuYWN0OyBpID0gaSArIDEpIHtcbiAgICAgICAgICAgIHdvcmtbaXdzdiArIGlhY3RbaV1dID0gMDtcbiAgICAgICAgfVxuXG4gICAgICAgIG52bCA9IDA7XG4gICAgICAgIHRlbXAgPSAwO1xuICAgICAgICBmb3IgKGkgPSAxOyBpIDw9IHE7IGkgPSBpICsgMSkge1xuICAgICAgICAgICAgaWYgKHdvcmtbaXdzdiArIGldIDwgdGVtcCAqIHdvcmtbaXduYnYgKyBpXSkge1xuICAgICAgICAgICAgICAgIG52bCA9IGk7XG4gICAgICAgICAgICAgICAgdGVtcCA9IHdvcmtbaXdzdiArIGldIC8gd29ya1tpd25idiArIGldO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChudmwgPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiA5OTk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gMDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBmbl9nb3RvXzU1KCkge1xuICAgICAgICBmb3IgKGkgPSAxOyBpIDw9IG47IGkgPSBpICsgMSkge1xuICAgICAgICAgICAgc3VtID0gMDtcbiAgICAgICAgICAgIGZvciAoaiA9IDE7IGogPD0gbjsgaiA9IGogKyAxKSB7XG4gICAgICAgICAgICAgICAgc3VtID0gc3VtICsgZG1hdFtqXVtpXSAqIGFtYXRbal1bbnZsXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHdvcmtbaV0gPSBzdW07XG4gICAgICAgIH1cblxuICAgICAgICBsMSA9IGl3enY7XG4gICAgICAgIGZvciAoaSA9IDE7IGkgPD0gbjsgaSA9IGkgKyAxKSB7XG4gICAgICAgICAgICB3b3JrW2wxICsgaV0gPSAwO1xuICAgICAgICB9XG4gICAgICAgIGZvciAoaiA9IG5hY3QgKyAxOyBqIDw9IG47IGogPSBqICsgMSkge1xuICAgICAgICAgICAgZm9yIChpID0gMTsgaSA8PSBuOyBpID0gaSArIDEpIHtcbiAgICAgICAgICAgICAgICB3b3JrW2wxICsgaV0gPSB3b3JrW2wxICsgaV0gKyBkbWF0W2ldW2pdICogd29ya1tqXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHQxaW5mID0gdHJ1ZTtcbiAgICAgICAgZm9yIChpID0gbmFjdDsgaSA+PSAxOyBpID0gaSAtIDEpIHtcbiAgICAgICAgICAgIHN1bSA9IHdvcmtbaV07XG4gICAgICAgICAgICBsID0gaXdybSArIChpICogKGkgKyAzKSkgLyAyO1xuICAgICAgICAgICAgbDEgPSBsIC0gaTtcbiAgICAgICAgICAgIGZvciAoaiA9IGkgKyAxOyBqIDw9IG5hY3Q7IGogPSBqICsgMSkge1xuICAgICAgICAgICAgICAgIHN1bSA9IHN1bSAtIHdvcmtbbF0gKiB3b3JrW2l3cnYgKyBqXTtcbiAgICAgICAgICAgICAgICBsID0gbCArIGo7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzdW0gPSBzdW0gLyB3b3JrW2wxXTtcbiAgICAgICAgICAgIHdvcmtbaXdydiArIGldID0gc3VtO1xuICAgICAgICAgICAgaWYgKGlhY3RbaV0gPCBtZXEpIHtcbiAgICAgICAgICAgICAgICAvLyBjb250aW51ZTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChzdW0gPCAwKSB7XG4gICAgICAgICAgICAgICAgLy8gY29udGludWU7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0MWluZiA9IGZhbHNlO1xuICAgICAgICAgICAgaXQxID0gaTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghdDFpbmYpIHtcbiAgICAgICAgICAgIHQxID0gd29ya1tpd3V2ICsgaXQxXSAvIHdvcmtbaXdydiArIGl0MV07XG4gICAgICAgICAgICBmb3IgKGkgPSAxOyBpIDw9IG5hY3Q7IGkgPSBpICsgMSkge1xuICAgICAgICAgICAgICAgIGlmIChpYWN0W2ldIDwgbWVxKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHdvcmtbaXdydiArIGldIDwgMCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRlbXAgPSB3b3JrW2l3dXYgKyBpXSAvIHdvcmtbaXdydiArIGldO1xuICAgICAgICAgICAgICAgIGlmICh0ZW1wIDwgdDEpIHtcbiAgICAgICAgICAgICAgICAgICAgdDEgPSB0ZW1wO1xuICAgICAgICAgICAgICAgICAgICBpdDEgPSBpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHN1bSA9IDA7XG4gICAgICAgIGZvciAoaSA9IGl3enYgKyAxOyBpIDw9IGl3enYgKyBuOyBpID0gaSArIDEpIHtcbiAgICAgICAgICAgIHN1bSA9IHN1bSArIHdvcmtbaV0gKiB3b3JrW2ldO1xuICAgICAgICB9XG4gICAgICAgIGlmIChNYXRoLmFicyhzdW0pIDw9IHZzbWFsbCkge1xuICAgICAgICAgICAgaWYgKHQxaW5mKSB7XG4gICAgICAgICAgICAgICAgaWVyclsxXSA9IDE7XG4gICAgICAgICAgICAgICAgLy8gR09UTyA5OTlcbiAgICAgICAgICAgICAgICByZXR1cm4gOTk5O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBmb3IgKGkgPSAxOyBpIDw9IG5hY3Q7IGkgPSBpICsgMSkge1xuICAgICAgICAgICAgICAgICAgICB3b3JrW2l3dXYgKyBpXSA9IHdvcmtbaXd1diArIGldIC0gdDEgKiB3b3JrW2l3cnYgKyBpXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgd29ya1tpd3V2ICsgbmFjdCArIDFdID0gd29ya1tpd3V2ICsgbmFjdCArIDFdICsgdDE7XG4gICAgICAgICAgICAgICAgLy8gR09UTyA3MDBcbiAgICAgICAgICAgICAgICByZXR1cm4gNzAwO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc3VtID0gMDtcbiAgICAgICAgICAgIGZvciAoaSA9IDE7IGkgPD0gbjsgaSA9IGkgKyAxKSB7XG4gICAgICAgICAgICAgICAgc3VtID0gc3VtICsgd29ya1tpd3p2ICsgaV0gKiBhbWF0W2ldW252bF07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0dCA9IC13b3JrW2l3c3YgKyBudmxdIC8gc3VtO1xuICAgICAgICAgICAgdDJtaW4gPSB0cnVlO1xuICAgICAgICAgICAgaWYgKCF0MWluZikge1xuICAgICAgICAgICAgICAgIGlmICh0MSA8IHR0KSB7XG4gICAgICAgICAgICAgICAgICAgIHR0ID0gdDE7XG4gICAgICAgICAgICAgICAgICAgIHQybWluID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmb3IgKGkgPSAxOyBpIDw9IG47IGkgPSBpICsgMSkge1xuICAgICAgICAgICAgICAgIHNvbFtpXSA9IHNvbFtpXSArIHR0ICogd29ya1tpd3p2ICsgaV07XG4gICAgICAgICAgICAgICAgaWYgKE1hdGguYWJzKHNvbFtpXSkgPCB2c21hbGwpIHtcbiAgICAgICAgICAgICAgICAgICAgc29sW2ldID0gMDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNydmFsWzFdID0gY3J2YWxbMV0gKyB0dCAqIHN1bSAqICh0dCAvIDIgKyB3b3JrW2l3dXYgKyBuYWN0ICsgMV0pO1xuICAgICAgICAgICAgZm9yIChpID0gMTsgaSA8PSBuYWN0OyBpID0gaSArIDEpIHtcbiAgICAgICAgICAgICAgICB3b3JrW2l3dXYgKyBpXSA9IHdvcmtbaXd1diArIGldIC0gdHQgKiB3b3JrW2l3cnYgKyBpXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHdvcmtbaXd1diArIG5hY3QgKyAxXSA9IHdvcmtbaXd1diArIG5hY3QgKyAxXSArIHR0O1xuXG4gICAgICAgICAgICBpZiAodDJtaW4pIHtcbiAgICAgICAgICAgICAgICBuYWN0ID0gbmFjdCArIDE7XG4gICAgICAgICAgICAgICAgaWFjdFtuYWN0XSA9IG52bDtcblxuICAgICAgICAgICAgICAgIGwgPSBpd3JtICsgKChuYWN0IC0gMSkgKiBuYWN0KSAvIDIgKyAxO1xuICAgICAgICAgICAgICAgIGZvciAoaSA9IDE7IGkgPD0gbmFjdCAtIDE7IGkgPSBpICsgMSkge1xuICAgICAgICAgICAgICAgICAgICB3b3JrW2xdID0gd29ya1tpXTtcbiAgICAgICAgICAgICAgICAgICAgbCA9IGwgKyAxO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChuYWN0ID09PSBuKSB7XG4gICAgICAgICAgICAgICAgICAgIHdvcmtbbF0gPSB3b3JrW25dO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAoaSA9IG47IGkgPj0gbmFjdCArIDE7IGkgPSBpIC0gMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHdvcmtbaV0gPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGdjID0gTWF0aC5tYXgoTWF0aC5hYnMod29ya1tpIC0gMV0pLCBNYXRoLmFicyh3b3JrW2ldKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBncyA9IE1hdGgubWluKE1hdGguYWJzKHdvcmtbaSAtIDFdKSwgTWF0aC5hYnMod29ya1tpXSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHdvcmtbaSAtIDFdID49IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZW1wID0gTWF0aC5hYnMoZ2MgKiBNYXRoLnNxcnQoMSArIGdzICogZ3MgLyAoZ2MgKiBnYykpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGVtcCA9IC1NYXRoLmFicyhnYyAqIE1hdGguc3FydCgxICsgZ3MgKiBncyAvIChnYyAqIGdjKSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZ2MgPSB3b3JrW2kgLSAxXSAvIHRlbXA7XG4gICAgICAgICAgICAgICAgICAgICAgICBncyA9IHdvcmtbaV0gLyB0ZW1wO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZ2MgPT09IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChnYyA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdvcmtbaSAtIDFdID0gZ3MgKiB0ZW1wO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoaiA9IDE7IGogPD0gbjsgaiA9IGogKyAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRlbXAgPSBkbWF0W2pdW2kgLSAxXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZG1hdFtqXVtpIC0gMV0gPSBkbWF0W2pdW2ldO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkbWF0W2pdW2ldID0gdGVtcDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdvcmtbaSAtIDFdID0gdGVtcDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBudSA9IGdzIC8gKDEgKyBnYyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChqID0gMTsgaiA8PSBuOyBqID0gaiArIDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGVtcCA9IGdjICogZG1hdFtqXVtpIC0gMV0gKyBncyAqIGRtYXRbal1baV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRtYXRbal1baV0gPSBudSAqIChkbWF0W2pdW2kgLSAxXSArIHRlbXApIC0gZG1hdFtqXVtpXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZG1hdFtqXVtpIC0gMV0gPSB0ZW1wO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHdvcmtbbF0gPSB3b3JrW25hY3RdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgc3VtID0gLWJ2ZWNbbnZsXTtcbiAgICAgICAgICAgICAgICBmb3IgKGogPSAxOyBqIDw9IG47IGogPSBqICsgMSkge1xuICAgICAgICAgICAgICAgICAgICBzdW0gPSBzdW0gKyBzb2xbal0gKiBhbWF0W2pdW252bF07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChudmwgPiBtZXEpIHtcbiAgICAgICAgICAgICAgICAgICAgd29ya1tpd3N2ICsgbnZsXSA9IHN1bTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB3b3JrW2l3c3YgKyBudmxdID0gLU1hdGguYWJzKHN1bSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzdW0gPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGogPSAxOyBqIDw9IG47IGogPSBqICsgMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFtYXRbal1bbnZsXSA9IC1hbWF0W2pdW252bF07XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBidmVjW252bF0gPSAtYnZlY1tudmxdO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIEdPVE8gNzAwXG4gICAgICAgICAgICAgICAgcmV0dXJuIDcwMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiAwO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGZuX2dvdG9fNzk3KCkge1xuICAgICAgICBsID0gaXdybSArIChpdDEgKiAoaXQxICsgMSkpIC8gMiArIDE7XG4gICAgICAgIGwxID0gbCArIGl0MTtcbiAgICAgICAgaWYgKHdvcmtbbDFdID09PSAwKSB7XG4gICAgICAgICAgICAvLyBHT1RPIDc5OFxuICAgICAgICAgICAgcmV0dXJuIDc5ODtcbiAgICAgICAgfVxuICAgICAgICBnYyA9IE1hdGgubWF4KE1hdGguYWJzKHdvcmtbbDEgLSAxXSksIE1hdGguYWJzKHdvcmtbbDFdKSk7XG4gICAgICAgIGdzID0gTWF0aC5taW4oTWF0aC5hYnMod29ya1tsMSAtIDFdKSwgTWF0aC5hYnMod29ya1tsMV0pKTtcbiAgICAgICAgaWYgKHdvcmtbbDEgLSAxXSA+PSAwKSB7XG4gICAgICAgICAgICB0ZW1wID0gTWF0aC5hYnMoZ2MgKiBNYXRoLnNxcnQoMSArIGdzICogZ3MgLyAoZ2MgKiBnYykpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRlbXAgPSAtTWF0aC5hYnMoZ2MgKiBNYXRoLnNxcnQoMSArIGdzICogZ3MgLyAoZ2MgKiBnYykpKTtcbiAgICAgICAgfVxuICAgICAgICBnYyA9IHdvcmtbbDEgLSAxXSAvIHRlbXA7XG4gICAgICAgIGdzID0gd29ya1tsMV0gLyB0ZW1wO1xuXG4gICAgICAgIGlmIChnYyA9PT0gMSkge1xuICAgICAgICAgICAgLy8gR09UTyA3OThcbiAgICAgICAgICAgIHJldHVybiA3OTg7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGdjID09PSAwKSB7XG4gICAgICAgICAgICBmb3IgKGkgPSBpdDEgKyAxOyBpIDw9IG5hY3Q7IGkgPSBpICsgMSkge1xuICAgICAgICAgICAgICAgIHRlbXAgPSB3b3JrW2wxIC0gMV07XG4gICAgICAgICAgICAgICAgd29ya1tsMSAtIDFdID0gd29ya1tsMV07XG4gICAgICAgICAgICAgICAgd29ya1tsMV0gPSB0ZW1wO1xuICAgICAgICAgICAgICAgIGwxID0gbDEgKyBpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZm9yIChpID0gMTsgaSA8PSBuOyBpID0gaSArIDEpIHtcbiAgICAgICAgICAgICAgICB0ZW1wID0gZG1hdFtpXVtpdDFdO1xuICAgICAgICAgICAgICAgIGRtYXRbaV1baXQxXSA9IGRtYXRbaV1baXQxICsgMV07XG4gICAgICAgICAgICAgICAgZG1hdFtpXVtpdDEgKyAxXSA9IHRlbXA7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBudSA9IGdzIC8gKDEgKyBnYyk7XG4gICAgICAgICAgICBmb3IgKGkgPSBpdDEgKyAxOyBpIDw9IG5hY3Q7IGkgPSBpICsgMSkge1xuICAgICAgICAgICAgICAgIHRlbXAgPSBnYyAqIHdvcmtbbDEgLSAxXSArIGdzICogd29ya1tsMV07XG4gICAgICAgICAgICAgICAgd29ya1tsMV0gPSBudSAqICh3b3JrW2wxIC0gMV0gKyB0ZW1wKSAtIHdvcmtbbDFdO1xuICAgICAgICAgICAgICAgIHdvcmtbbDEgLSAxXSA9IHRlbXA7XG4gICAgICAgICAgICAgICAgbDEgPSBsMSArIGk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmb3IgKGkgPSAxOyBpIDw9IG47IGkgPSBpICsgMSkge1xuICAgICAgICAgICAgICAgIHRlbXAgPSBnYyAqIGRtYXRbaV1baXQxXSArIGdzICogZG1hdFtpXVtpdDEgKyAxXTtcbiAgICAgICAgICAgICAgICBkbWF0W2ldW2l0MSArIDFdID0gbnUgKiAoZG1hdFtpXVtpdDFdICsgdGVtcCkgLSBkbWF0W2ldW2l0MSArIDFdO1xuICAgICAgICAgICAgICAgIGRtYXRbaV1baXQxXSA9IHRlbXA7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gMDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBmbl9nb3RvXzc5OCgpIHtcbiAgICAgICAgbDEgPSBsIC0gaXQxO1xuICAgICAgICBmb3IgKGkgPSAxOyBpIDw9IGl0MTsgaSA9IGkgKyAxKSB7XG4gICAgICAgICAgICB3b3JrW2wxXSA9IHdvcmtbbF07XG4gICAgICAgICAgICBsID0gbCArIDE7XG4gICAgICAgICAgICBsMSA9IGwxICsgMTtcbiAgICAgICAgfVxuXG4gICAgICAgIHdvcmtbaXd1diArIGl0MV0gPSB3b3JrW2l3dXYgKyBpdDEgKyAxXTtcbiAgICAgICAgaWFjdFtpdDFdID0gaWFjdFtpdDEgKyAxXTtcbiAgICAgICAgaXQxID0gaXQxICsgMTtcbiAgICAgICAgaWYgKGl0MSA8IG5hY3QpIHtcbiAgICAgICAgICAgIC8vIEdPVE8gNzk3XG4gICAgICAgICAgICByZXR1cm4gNzk3O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIDA7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZm5fZ290b183OTkoKSB7XG4gICAgICAgIHdvcmtbaXd1diArIG5hY3RdID0gd29ya1tpd3V2ICsgbmFjdCArIDFdO1xuICAgICAgICB3b3JrW2l3dXYgKyBuYWN0ICsgMV0gPSAwO1xuICAgICAgICBpYWN0W25hY3RdID0gMDtcbiAgICAgICAgbmFjdCA9IG5hY3QgLSAxO1xuICAgICAgICBpdGVyWzJdID0gaXRlclsyXSArIDE7XG5cbiAgICAgICAgcmV0dXJuIDA7XG4gICAgfVxuXG4gICAgZ28gPSAwO1xuICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICAgIGdvID0gZm5fZ290b181MCgpO1xuICAgICAgICBpZiAoZ28gPT09IDk5OSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICAgICAgICBnbyA9IGZuX2dvdG9fNTUoKTtcbiAgICAgICAgICAgIGlmIChnbyA9PT0gMCkge1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGdvID09PSA5OTkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZ28gPT09IDcwMCkge1xuICAgICAgICAgICAgICAgIGlmIChpdDEgPT09IG5hY3QpIHtcbiAgICAgICAgICAgICAgICAgICAgZm5fZ290b183OTkoKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZm5fZ290b183OTcoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGdvID0gZm5fZ290b183OTgoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChnbyAhPT0gNzk3KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZm5fZ290b183OTkoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbn1cblxuZnVuY3Rpb24gc29sdmVRUChEbWF0LCBkdmVjLCBBbWF0LCBidmVjLCBtZXEsIGZhY3Rvcml6ZWQpIHtcbiAgICBEbWF0ID0gYmFzZTB0bzEoRG1hdCk7XG4gICAgZHZlYyA9IGJhc2UwdG8xKGR2ZWMpO1xuICAgIEFtYXQgPSBiYXNlMHRvMShBbWF0KTtcbiAgICB2YXIgaSwgbiwgcSxcbiAgICAgICAgbmFjdCwgcixcbiAgICAgICAgY3J2YWwgPSBbXSwgaWFjdCA9IFtdLCBzb2wgPSBbXSwgd29yayA9IFtdLCBpdGVyID0gW10sXG4gICAgICAgIG1lc3NhZ2U7XG5cbiAgICBtZXEgPSBtZXEgfHwgMDtcbiAgICBmYWN0b3JpemVkID0gZmFjdG9yaXplZCA/IGJhc2UwdG8xKGZhY3Rvcml6ZWQpIDogW3VuZGVmaW5lZCwgMF07XG4gICAgYnZlYyA9IGJ2ZWMgPyBiYXNlMHRvMShidmVjKSA6IFtdO1xuXG4gICAgLy8gSW4gRm9ydHJhbiB0aGUgYXJyYXkgaW5kZXggc3RhcnRzIGZyb20gMVxuICAgIG4gPSBEbWF0Lmxlbmd0aCAtIDE7XG4gICAgcSA9IEFtYXRbMV0ubGVuZ3RoIC0gMTtcblxuICAgIGlmICghYnZlYykge1xuICAgICAgICBmb3IgKGkgPSAxOyBpIDw9IHE7IGkgPSBpICsgMSkge1xuICAgICAgICAgICAgYnZlY1tpXSA9IDA7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZm9yIChpID0gMTsgaSA8PSBxOyBpID0gaSArIDEpIHtcbiAgICAgICAgaWFjdFtpXSA9IDA7XG4gICAgfVxuICAgIG5hY3QgPSAwO1xuICAgIHIgPSBNYXRoLm1pbihuLCBxKTtcbiAgICBmb3IgKGkgPSAxOyBpIDw9IG47IGkgPSBpICsgMSkge1xuICAgICAgICBzb2xbaV0gPSAwO1xuICAgIH1cbiAgICBjcnZhbFsxXSA9IDA7XG4gICAgZm9yIChpID0gMTsgaSA8PSAoMiAqIG4gKyAociAqIChyICsgNSkpIC8gMiArIDIgKiBxICsgMSk7IGkgPSBpICsgMSkge1xuICAgICAgICB3b3JrW2ldID0gMDtcbiAgICB9XG4gICAgZm9yIChpID0gMTsgaSA8PSAyOyBpID0gaSArIDEpIHtcbiAgICAgICAgaXRlcltpXSA9IDA7XG4gICAgfVxuXG4gICAgcXBnZW4yKERtYXQsIGR2ZWMsIG4sIG4sIHNvbCwgY3J2YWwsIEFtYXQsXG4gICAgICAgIGJ2ZWMsIG4sIHEsIG1lcSwgaWFjdCwgbmFjdCwgaXRlciwgd29yaywgZmFjdG9yaXplZCk7XG5cbiAgICBtZXNzYWdlID0gXCJcIjtcbiAgICBpZiAoZmFjdG9yaXplZFsxXSA9PT0gMSkge1xuICAgICAgICBtZXNzYWdlID0gXCJjb25zdHJhaW50cyBhcmUgaW5jb25zaXN0ZW50LCBubyBzb2x1dGlvbiFcIjtcbiAgICB9XG4gICAgaWYgKGZhY3Rvcml6ZWRbMV0gPT09IDIpIHtcbiAgICAgICAgbWVzc2FnZSA9IFwibWF0cml4IEQgaW4gcXVhZHJhdGljIGZ1bmN0aW9uIGlzIG5vdCBwb3NpdGl2ZSBkZWZpbml0ZSFcIjtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBzb2x1dGlvbjogYmFzZTF0bzAoc29sKSxcbiAgICAgICAgdmFsdWU6IGJhc2UxdG8wKGNydmFsKSxcbiAgICAgICAgdW5jb25zdHJhaW5lZF9zb2x1dGlvbjogYmFzZTF0bzAoZHZlYyksXG4gICAgICAgIGl0ZXJhdGlvbnM6IGJhc2UxdG8wKGl0ZXIpLFxuICAgICAgICBpYWN0OiBiYXNlMXRvMChpYWN0KSxcbiAgICAgICAgbWVzc2FnZTogbWVzc2FnZVxuICAgIH07XG59XG5leHBvcnRzLnNvbHZlUVAgPSBzb2x2ZVFQO1xufShudW1lcmljKSk7XG4vKlxyXG5TaGFudGkgUmFvIHNlbnQgbWUgdGhpcyByb3V0aW5lIGJ5IHByaXZhdGUgZW1haWwuIEkgaGFkIHRvIG1vZGlmeSBpdFxyXG5zbGlnaHRseSB0byB3b3JrIG9uIEFycmF5cyBpbnN0ZWFkIG9mIHVzaW5nIGEgTWF0cml4IG9iamVjdC5cclxuSXQgaXMgYXBwYXJlbnRseSB0cmFuc2xhdGVkIGZyb20gaHR0cDovL3N0aXRjaHBhbm9yYW1hLnNvdXJjZWZvcmdlLm5ldC9QeXRob24vc3ZkLnB5XHJcbiovXHJcblxyXG5udW1lcmljLnN2ZD0gZnVuY3Rpb24gc3ZkKEEpIHtcclxuICAgIHZhciB0ZW1wO1xyXG4vL0NvbXB1dGUgdGhlIHRoaW4gU1ZEIGZyb20gRy4gSC4gR29sdWIgYW5kIEMuIFJlaW5zY2gsIE51bWVyLiBNYXRoLiAxNCwgNDAzLTQyMCAoMTk3MClcclxuXHR2YXIgcHJlYz0gbnVtZXJpYy5lcHNpbG9uOyAvL01hdGgucG93KDIsLTUyKSAvLyBhc3N1bWVzIGRvdWJsZSBwcmVjXHJcblx0dmFyIHRvbGVyYW5jZT0gMS5lLTY0L3ByZWM7XHJcblx0dmFyIGl0bWF4PSA1MDtcclxuXHR2YXIgYz0wO1xyXG5cdHZhciBpPTA7XHJcblx0dmFyIGo9MDtcclxuXHR2YXIgaz0wO1xyXG5cdHZhciBsPTA7XHJcblx0XHJcblx0dmFyIHU9IG51bWVyaWMuY2xvbmUoQSk7XHJcblx0dmFyIG09IHUubGVuZ3RoO1xyXG5cdFxyXG5cdHZhciBuPSB1WzBdLmxlbmd0aDtcclxuXHRcclxuXHRpZiAobSA8IG4pIHRocm93IFwiTmVlZCBtb3JlIHJvd3MgdGhhbiBjb2x1bW5zXCJcclxuXHRcclxuXHR2YXIgZSA9IG5ldyBBcnJheShuKTtcclxuXHR2YXIgcSA9IG5ldyBBcnJheShuKTtcclxuXHRmb3IgKGk9MDsgaTxuOyBpKyspIGVbaV0gPSBxW2ldID0gMC4wO1xyXG5cdHZhciB2ID0gbnVtZXJpYy5yZXAoW24sbl0sMCk7XHJcbi8vXHR2Lnplcm8oKTtcclxuXHRcclxuIFx0ZnVuY3Rpb24gcHl0aGFnKGEsYilcclxuIFx0e1xyXG5cdFx0YSA9IE1hdGguYWJzKGEpXHJcblx0XHRiID0gTWF0aC5hYnMoYilcclxuXHRcdGlmIChhID4gYilcclxuXHRcdFx0cmV0dXJuIGEqTWF0aC5zcXJ0KDEuMCsoYipiL2EvYSkpXHJcblx0XHRlbHNlIGlmIChiID09IDAuMCkgXHJcblx0XHRcdHJldHVybiBhXHJcblx0XHRyZXR1cm4gYipNYXRoLnNxcnQoMS4wKyhhKmEvYi9iKSlcclxuXHR9XHJcblxyXG5cdC8vSG91c2Vob2xkZXIncyByZWR1Y3Rpb24gdG8gYmlkaWFnb25hbCBmb3JtXHJcblxyXG5cdHZhciBmPSAwLjA7XHJcblx0dmFyIGc9IDAuMDtcclxuXHR2YXIgaD0gMC4wO1xyXG5cdHZhciB4PSAwLjA7XHJcblx0dmFyIHk9IDAuMDtcclxuXHR2YXIgej0gMC4wO1xyXG5cdHZhciBzPSAwLjA7XHJcblx0XHJcblx0Zm9yIChpPTA7IGkgPCBuOyBpKyspXHJcblx0e1x0XHJcblx0XHRlW2ldPSBnO1xyXG5cdFx0cz0gMC4wO1xyXG5cdFx0bD0gaSsxO1xyXG5cdFx0Zm9yIChqPWk7IGogPCBtOyBqKyspIFxyXG5cdFx0XHRzICs9ICh1W2pdW2ldKnVbal1baV0pO1xyXG5cdFx0aWYgKHMgPD0gdG9sZXJhbmNlKVxyXG5cdFx0XHRnPSAwLjA7XHJcblx0XHRlbHNlXHJcblx0XHR7XHRcclxuXHRcdFx0Zj0gdVtpXVtpXTtcclxuXHRcdFx0Zz0gTWF0aC5zcXJ0KHMpO1xyXG5cdFx0XHRpZiAoZiA+PSAwLjApIGc9IC1nO1xyXG5cdFx0XHRoPSBmKmctc1xyXG5cdFx0XHR1W2ldW2ldPWYtZztcclxuXHRcdFx0Zm9yIChqPWw7IGogPCBuOyBqKyspXHJcblx0XHRcdHtcclxuXHRcdFx0XHRzPSAwLjBcclxuXHRcdFx0XHRmb3IgKGs9aTsgayA8IG07IGsrKykgXHJcblx0XHRcdFx0XHRzICs9IHVba11baV0qdVtrXVtqXVxyXG5cdFx0XHRcdGY9IHMvaFxyXG5cdFx0XHRcdGZvciAoaz1pOyBrIDwgbTsgaysrKSBcclxuXHRcdFx0XHRcdHVba11bal0rPWYqdVtrXVtpXVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0XHRxW2ldPSBnXHJcblx0XHRzPSAwLjBcclxuXHRcdGZvciAoaj1sOyBqIDwgbjsgaisrKSBcclxuXHRcdFx0cz0gcyArIHVbaV1bal0qdVtpXVtqXVxyXG5cdFx0aWYgKHMgPD0gdG9sZXJhbmNlKVxyXG5cdFx0XHRnPSAwLjBcclxuXHRcdGVsc2VcclxuXHRcdHtcdFxyXG5cdFx0XHRmPSB1W2ldW2krMV1cclxuXHRcdFx0Zz0gTWF0aC5zcXJ0KHMpXHJcblx0XHRcdGlmIChmID49IDAuMCkgZz0gLWdcclxuXHRcdFx0aD0gZipnIC0gc1xyXG5cdFx0XHR1W2ldW2krMV0gPSBmLWc7XHJcblx0XHRcdGZvciAoaj1sOyBqIDwgbjsgaisrKSBlW2pdPSB1W2ldW2pdL2hcclxuXHRcdFx0Zm9yIChqPWw7IGogPCBtOyBqKyspXHJcblx0XHRcdHtcdFxyXG5cdFx0XHRcdHM9MC4wXHJcblx0XHRcdFx0Zm9yIChrPWw7IGsgPCBuOyBrKyspIFxyXG5cdFx0XHRcdFx0cyArPSAodVtqXVtrXSp1W2ldW2tdKVxyXG5cdFx0XHRcdGZvciAoaz1sOyBrIDwgbjsgaysrKSBcclxuXHRcdFx0XHRcdHVbal1ba10rPXMqZVtrXVxyXG5cdFx0XHR9XHRcclxuXHRcdH1cclxuXHRcdHk9IE1hdGguYWJzKHFbaV0pK01hdGguYWJzKGVbaV0pXHJcblx0XHRpZiAoeT54KSBcclxuXHRcdFx0eD15XHJcblx0fVxyXG5cdFxyXG5cdC8vIGFjY3VtdWxhdGlvbiBvZiByaWdodCBoYW5kIGd0cmFuc2Zvcm1hdGlvbnNcclxuXHRmb3IgKGk9bi0xOyBpICE9IC0xOyBpKz0gLTEpXHJcblx0e1x0XHJcblx0XHRpZiAoZyAhPSAwLjApXHJcblx0XHR7XHJcblx0XHQgXHRoPSBnKnVbaV1baSsxXVxyXG5cdFx0XHRmb3IgKGo9bDsgaiA8IG47IGorKykgXHJcblx0XHRcdFx0dltqXVtpXT11W2ldW2pdL2hcclxuXHRcdFx0Zm9yIChqPWw7IGogPCBuOyBqKyspXHJcblx0XHRcdHtcdFxyXG5cdFx0XHRcdHM9MC4wXHJcblx0XHRcdFx0Zm9yIChrPWw7IGsgPCBuOyBrKyspIFxyXG5cdFx0XHRcdFx0cyArPSB1W2ldW2tdKnZba11bal1cclxuXHRcdFx0XHRmb3IgKGs9bDsgayA8IG47IGsrKykgXHJcblx0XHRcdFx0XHR2W2tdW2pdKz0ocyp2W2tdW2ldKVxyXG5cdFx0XHR9XHRcclxuXHRcdH1cclxuXHRcdGZvciAoaj1sOyBqIDwgbjsgaisrKVxyXG5cdFx0e1xyXG5cdFx0XHR2W2ldW2pdID0gMDtcclxuXHRcdFx0dltqXVtpXSA9IDA7XHJcblx0XHR9XHJcblx0XHR2W2ldW2ldID0gMTtcclxuXHRcdGc9IGVbaV1cclxuXHRcdGw9IGlcclxuXHR9XHJcblx0XHJcblx0Ly8gYWNjdW11bGF0aW9uIG9mIGxlZnQgaGFuZCB0cmFuc2Zvcm1hdGlvbnNcclxuXHRmb3IgKGk9bi0xOyBpICE9IC0xOyBpKz0gLTEpXHJcblx0e1x0XHJcblx0XHRsPSBpKzFcclxuXHRcdGc9IHFbaV1cclxuXHRcdGZvciAoaj1sOyBqIDwgbjsgaisrKSBcclxuXHRcdFx0dVtpXVtqXSA9IDA7XHJcblx0XHRpZiAoZyAhPSAwLjApXHJcblx0XHR7XHJcblx0XHRcdGg9IHVbaV1baV0qZ1xyXG5cdFx0XHRmb3IgKGo9bDsgaiA8IG47IGorKylcclxuXHRcdFx0e1xyXG5cdFx0XHRcdHM9MC4wXHJcblx0XHRcdFx0Zm9yIChrPWw7IGsgPCBtOyBrKyspIHMgKz0gdVtrXVtpXSp1W2tdW2pdO1xyXG5cdFx0XHRcdGY9IHMvaFxyXG5cdFx0XHRcdGZvciAoaz1pOyBrIDwgbTsgaysrKSB1W2tdW2pdKz1mKnVba11baV07XHJcblx0XHRcdH1cclxuXHRcdFx0Zm9yIChqPWk7IGogPCBtOyBqKyspIHVbal1baV0gPSB1W2pdW2ldL2c7XHJcblx0XHR9XHJcblx0XHRlbHNlXHJcblx0XHRcdGZvciAoaj1pOyBqIDwgbTsgaisrKSB1W2pdW2ldID0gMDtcclxuXHRcdHVbaV1baV0gKz0gMTtcclxuXHR9XHJcblx0XHJcblx0Ly8gZGlhZ29uYWxpemF0aW9uIG9mIHRoZSBiaWRpYWdvbmFsIGZvcm1cclxuXHRwcmVjPSBwcmVjKnhcclxuXHRmb3IgKGs9bi0xOyBrICE9IC0xOyBrKz0gLTEpXHJcblx0e1xyXG5cdFx0Zm9yICh2YXIgaXRlcmF0aW9uPTA7IGl0ZXJhdGlvbiA8IGl0bWF4OyBpdGVyYXRpb24rKylcclxuXHRcdHtcdC8vIHRlc3QgZiBzcGxpdHRpbmdcclxuXHRcdFx0dmFyIHRlc3RfY29udmVyZ2VuY2UgPSBmYWxzZVxyXG5cdFx0XHRmb3IgKGw9azsgbCAhPSAtMTsgbCs9IC0xKVxyXG5cdFx0XHR7XHRcclxuXHRcdFx0XHRpZiAoTWF0aC5hYnMoZVtsXSkgPD0gcHJlYylcclxuXHRcdFx0XHR7XHR0ZXN0X2NvbnZlcmdlbmNlPSB0cnVlXHJcblx0XHRcdFx0XHRicmVhayBcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aWYgKE1hdGguYWJzKHFbbC0xXSkgPD0gcHJlYylcclxuXHRcdFx0XHRcdGJyZWFrIFxyXG5cdFx0XHR9XHJcblx0XHRcdGlmICghdGVzdF9jb252ZXJnZW5jZSlcclxuXHRcdFx0e1x0Ly8gY2FuY2VsbGF0aW9uIG9mIGVbbF0gaWYgbD4wXHJcblx0XHRcdFx0Yz0gMC4wXHJcblx0XHRcdFx0cz0gMS4wXHJcblx0XHRcdFx0dmFyIGwxPSBsLTFcclxuXHRcdFx0XHRmb3IgKGkgPWw7IGk8aysxOyBpKyspXHJcblx0XHRcdFx0e1x0XHJcblx0XHRcdFx0XHRmPSBzKmVbaV1cclxuXHRcdFx0XHRcdGVbaV09IGMqZVtpXVxyXG5cdFx0XHRcdFx0aWYgKE1hdGguYWJzKGYpIDw9IHByZWMpXHJcblx0XHRcdFx0XHRcdGJyZWFrXHJcblx0XHRcdFx0XHRnPSBxW2ldXHJcblx0XHRcdFx0XHRoPSBweXRoYWcoZixnKVxyXG5cdFx0XHRcdFx0cVtpXT0gaFxyXG5cdFx0XHRcdFx0Yz0gZy9oXHJcblx0XHRcdFx0XHRzPSAtZi9oXHJcblx0XHRcdFx0XHRmb3IgKGo9MDsgaiA8IG07IGorKylcclxuXHRcdFx0XHRcdHtcdFxyXG5cdFx0XHRcdFx0XHR5PSB1W2pdW2wxXVxyXG5cdFx0XHRcdFx0XHR6PSB1W2pdW2ldXHJcblx0XHRcdFx0XHRcdHVbal1bbDFdID0gIHkqYysoeipzKVxyXG5cdFx0XHRcdFx0XHR1W2pdW2ldID0gLXkqcysoeipjKVxyXG5cdFx0XHRcdFx0fSBcclxuXHRcdFx0XHR9XHRcclxuXHRcdFx0fVxyXG5cdFx0XHQvLyB0ZXN0IGYgY29udmVyZ2VuY2VcclxuXHRcdFx0ej0gcVtrXVxyXG5cdFx0XHRpZiAobD09IGspXHJcblx0XHRcdHtcdC8vY29udmVyZ2VuY2VcclxuXHRcdFx0XHRpZiAoejwwLjApXHJcblx0XHRcdFx0e1x0Ly9xW2tdIGlzIG1hZGUgbm9uLW5lZ2F0aXZlXHJcblx0XHRcdFx0XHRxW2tdPSAtelxyXG5cdFx0XHRcdFx0Zm9yIChqPTA7IGogPCBuOyBqKyspXHJcblx0XHRcdFx0XHRcdHZbal1ba10gPSAtdltqXVtrXVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRicmVhayAgLy9icmVhayBvdXQgb2YgaXRlcmF0aW9uIGxvb3AgYW5kIG1vdmUgb24gdG8gbmV4dCBrIHZhbHVlXHJcblx0XHRcdH1cclxuXHRcdFx0aWYgKGl0ZXJhdGlvbiA+PSBpdG1heC0xKVxyXG5cdFx0XHRcdHRocm93ICdFcnJvcjogbm8gY29udmVyZ2VuY2UuJ1xyXG5cdFx0XHQvLyBzaGlmdCBmcm9tIGJvdHRvbSAyeDIgbWlub3JcclxuXHRcdFx0eD0gcVtsXVxyXG5cdFx0XHR5PSBxW2stMV1cclxuXHRcdFx0Zz0gZVtrLTFdXHJcblx0XHRcdGg9IGVba11cclxuXHRcdFx0Zj0gKCh5LXopKih5K3opKyhnLWgpKihnK2gpKS8oMi4wKmgqeSlcclxuXHRcdFx0Zz0gcHl0aGFnKGYsMS4wKVxyXG5cdFx0XHRpZiAoZiA8IDAuMClcclxuXHRcdFx0XHRmPSAoKHgteikqKHgreikraCooeS8oZi1nKS1oKSkveFxyXG5cdFx0XHRlbHNlXHJcblx0XHRcdFx0Zj0gKCh4LXopKih4K3opK2gqKHkvKGYrZyktaCkpL3hcclxuXHRcdFx0Ly8gbmV4dCBRUiB0cmFuc2Zvcm1hdGlvblxyXG5cdFx0XHRjPSAxLjBcclxuXHRcdFx0cz0gMS4wXHJcblx0XHRcdGZvciAoaT1sKzE7IGk8IGsrMTsgaSsrKVxyXG5cdFx0XHR7XHRcclxuXHRcdFx0XHRnPSBlW2ldXHJcblx0XHRcdFx0eT0gcVtpXVxyXG5cdFx0XHRcdGg9IHMqZ1xyXG5cdFx0XHRcdGc9IGMqZ1xyXG5cdFx0XHRcdHo9IHB5dGhhZyhmLGgpXHJcblx0XHRcdFx0ZVtpLTFdPSB6XHJcblx0XHRcdFx0Yz0gZi96XHJcblx0XHRcdFx0cz0gaC96XHJcblx0XHRcdFx0Zj0geCpjK2cqc1xyXG5cdFx0XHRcdGc9IC14KnMrZypjXHJcblx0XHRcdFx0aD0geSpzXHJcblx0XHRcdFx0eT0geSpjXHJcblx0XHRcdFx0Zm9yIChqPTA7IGogPCBuOyBqKyspXHJcblx0XHRcdFx0e1x0XHJcblx0XHRcdFx0XHR4PSB2W2pdW2ktMV1cclxuXHRcdFx0XHRcdHo9IHZbal1baV1cclxuXHRcdFx0XHRcdHZbal1baS0xXSA9IHgqYyt6KnNcclxuXHRcdFx0XHRcdHZbal1baV0gPSAteCpzK3oqY1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHR6PSBweXRoYWcoZixoKVxyXG5cdFx0XHRcdHFbaS0xXT0gelxyXG5cdFx0XHRcdGM9IGYvelxyXG5cdFx0XHRcdHM9IGgvelxyXG5cdFx0XHRcdGY9IGMqZytzKnlcclxuXHRcdFx0XHR4PSAtcypnK2MqeVxyXG5cdFx0XHRcdGZvciAoaj0wOyBqIDwgbTsgaisrKVxyXG5cdFx0XHRcdHtcclxuXHRcdFx0XHRcdHk9IHVbal1baS0xXVxyXG5cdFx0XHRcdFx0ej0gdVtqXVtpXVxyXG5cdFx0XHRcdFx0dVtqXVtpLTFdID0geSpjK3oqc1xyXG5cdFx0XHRcdFx0dVtqXVtpXSA9IC15KnMreipjXHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHRcdGVbbF09IDAuMFxyXG5cdFx0XHRlW2tdPSBmXHJcblx0XHRcdHFba109IHhcclxuXHRcdH0gXHJcblx0fVxyXG5cdFx0XHJcblx0Ly92dD0gdHJhbnNwb3NlKHYpXHJcblx0Ly9yZXR1cm4gKHUscSx2dClcclxuXHRmb3IgKGk9MDtpPHEubGVuZ3RoOyBpKyspIFxyXG5cdCAgaWYgKHFbaV0gPCBwcmVjKSBxW2ldID0gMFxyXG5cdCAgXHJcblx0Ly9zb3J0IGVpZ2VudmFsdWVzXHRcclxuXHRmb3IgKGk9MDsgaTwgbjsgaSsrKVxyXG5cdHtcdCBcclxuXHQvL3dyaXRlbG4ocSlcclxuXHQgZm9yIChqPWktMTsgaiA+PSAwOyBqLS0pXHJcblx0IHtcclxuXHQgIGlmIChxW2pdIDwgcVtpXSlcclxuXHQgIHtcclxuXHQvLyAgd3JpdGVsbihpLCctJyxqKVxyXG5cdCAgIGMgPSBxW2pdXHJcblx0ICAgcVtqXSA9IHFbaV1cclxuXHQgICBxW2ldID0gY1xyXG5cdCAgIGZvcihrPTA7azx1Lmxlbmd0aDtrKyspIHsgdGVtcCA9IHVba11baV07IHVba11baV0gPSB1W2tdW2pdOyB1W2tdW2pdID0gdGVtcDsgfVxyXG5cdCAgIGZvcihrPTA7azx2Lmxlbmd0aDtrKyspIHsgdGVtcCA9IHZba11baV07IHZba11baV0gPSB2W2tdW2pdOyB2W2tdW2pdID0gdGVtcDsgfVxyXG4vL1x0ICAgdS5zd2FwQ29scyhpLGopXHJcbi8vXHQgICB2LnN3YXBDb2xzKGksailcclxuXHQgICBpID0galx0ICAgXHJcblx0ICB9XHJcblx0IH1cdFxyXG5cdH1cclxuXHRcclxuXHRyZXR1cm4ge1U6dSxTOnEsVjp2fVxyXG59O1xyXG5cclxuIiwiLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vICBBcmNob250aXMgUG9saXRpc1xuLy8gIGFyY2hvbnRpcy5wb2xpdGlzQGFhbHRvLmZpXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy9cbi8vICBBIEphdmFTY3JpcHQgbGlicmFyeSB0aGF0IGltcGxlbWVudHMgXG4vLyAgdGhlIHNwaGVyaWNhbCBoYXJtb25pYyB0cmFuc2Zvcm0gZm9yIHJlYWwgc3BoZXJpY2FsIGhhcm1vbmljc1xuLy8gIGFuZCBzb21lIHVzZWZ1bCB0cmFuc2Zvcm1hdGlvbnMgaW4gdGhlIHNwaGVyaWNhbCBoYXJtb25pYyBkb21haW5cbi8vXG4vLyAgVGhlIGxpYnJhcnkgdXNlcyB0aGUgbnVtZXJpYy5qcyBsaWJyYXJ5IGZvciBtYXRyaXggb3BlcmF0aW9uc1xuLy8gIGh0dHA6Ly93d3cubnVtZXJpY2pzLmNvbS9cbi8vXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG52YXIgbnVtZXJpYyA9IHJlcXVpcmUoJ251bWVyaWMnKTtcblxuXG4vLyBmb3J3YXJkU0hUIGltcGxlbWVudHMgdGhlIGZvcndhcmQgU0hUIG9uIGRhdGEgZGVmaW5lZCBvdmVyIHRoZSBzcGhlcmVcbnZhciBmb3J3YXJkU0hUID0gZnVuY3Rpb24gKE4sIGRhdGEsIENBUlRfT1JfU1BILCBESVJFQ1RfT1JfUElOVikge1xuICAgIFxuICAgIHZhciBOZGlycyA9IGRhdGEubGVuZ3RoLCBOc2ggPSAoTisxKSooTisxKTtcbiAgICB2YXIgaW52WV9OO1xuICAgIHZhciBtYWcgPSBbLF07XG4gICAgaWYgKE5zaD5OZGlycykgIHtcbiAgICAgICAgY29uc29sZS5sb2coXCJUaGUgU0hUIGRlZ3JlZSBpcyB0b28gaGlnaCBmb3IgdGhlIG51bWJlciBvZiBkYXRhIHBvaW50c1wiKVxuICAgIH1cbiAgICBcbiAgICAvLyBDb252ZXJ0IGNhcnRlc2lhbiB0byBzcGhlcmljYWwgaWYgbmVlZGVkXG4gICAgaWYgKENBUlRfT1JfU1BIPT0wKSBkYXRhID0gY29udmVydENhcnQyU3BoKGRhdGEpO1xuICAgIGZvciAodmFyICBpPTA7IGk8ZGF0YS5sZW5ndGg7IGkrKykge1xuICAgICAgICBtYWdbaV0gPSBkYXRhW2ldWzJdO1xuICAgIH1cbiAgICAvLyBTSCBzYW1wbGluZyBtYXRyaXhcbiAgICBZX04gPSBjb21wdXRlUmVhbFNIKE4sIGRhdGEpO1xuICAgIC8vIERpcmVjdCBTSFRcbiAgICBpZiAoRElSRUNUX09SX1BJTlY9PTApIHtcbiAgICAgICAgaW52WV9OID0gbnVtZXJpYy5tdWwoMS9OZGlycyxZX04pO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgaW52WV9OID0gcGludl9kaXJlY3QobnVtZXJpYy50cmFuc3Bvc2UoWV9OKSk7XG4gICAgfVxuICAgIC8vIFBlcmZvcm0gU0hUXG4gICAgdmFyIGNvZWZmcyA9IG51bWVyaWMuZG90TVYoaW52WV9OLCBtYWcpO1xuICAgIHJldHVybiBjb2VmZnM7XG59XG5cbi8vIGludmVyc2VTSFQgaW1wbGVtZW50cyB0aGUgaW52ZXJzZSBTSFQgZnJvbSBTSCBjb2VmZmljaWVudHNcbnZhciBpbnZlcnNlU0hUID0gZnVuY3Rpb24gKGNvZWZmcywgYXppRWxldikge1xuICAgIFxuICAgIHZhciBhemlFbGV2UiA9IGF6aUVsZXY7XG4gICAgdmFyIE4gPSBNYXRoLnNxcnQoY29lZmZzLmxlbmd0aCktMTtcbiAgICAvLyBTSCBzYW1wbGluZyBtYXRyaXhcbiAgICB2YXIgWV9OID0gY29tcHV0ZVJlYWxTSChOLCBhemlFbGV2KTtcbiAgICAvLyByZWNvbnN0cnVjdGlvblxuICAgIHZhciBkYXRhID0gbnVtZXJpYy5kb3RWTShjb2VmZnMsIFlfTik7XG4gICAgLy8gZ2F0aGVyIGluIGRhdGEgbWF0cml4XG4gICAgZm9yICh2YXIgaT0wOyBpPGF6aUVsZXYubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgYXppRWxldlJbaV1bMl0gPSBkYXRhW2ldO1xuICAgIH1cbiAgICByZXR1cm4gYXppRWxldlI7XG59XG5cbi8vIHh4eHh4eHh4eHh4eHh4eHh4eFxudmFyIHByaW50MkRhcnJheSA9IGZ1bmN0aW9uIChhcnJheTJEKSB7XG4gICAgZm9yICh2YXIgcT0wOyBxPGFycmF5MkQubGVuZ3RoOyBxKyspIGNvbnNvbGUubG9nKGFycmF5MkRbcV0pO1xufVxuXG4vLyBjb252ZXJ0Q2FydDJTcGggY29udmVydHMgYXJyYXlzIG9mIGNhcnRlc2lhbiB2ZWN0b3JzIHRvIHNwaGVyaWNhbCBjb29yZGluYXRlc1xudmFyIGNvbnZlcnRDYXJ0MlNwaCA9IGZ1bmN0aW9uICh4eXosIE9NSVRfTUFHKSB7XG4gICAgXG4gICAgdmFyIGF6aSwgZWxldiwgcjtcbiAgICB2YXIgYXppRWxldlIgPSBuZXcgQXJyYXkoeHl6Lmxlbmd0aCk7XG4gICAgXG4gICAgZm9yICh2YXIgaT0wOyBpPHh5ei5sZW5ndGg7IGkrKykge1xuICAgICAgICBhemkgPSBNYXRoLmF0YW4yKCB4eXpbaV1bMV0sIHh5eltpXVswXSApO1xuICAgICAgICBlbGV2ID0gTWF0aC5hdGFuMiggeHl6W2ldWzJdLCBNYXRoLnNxcnQoeHl6W2ldWzBdKnh5eltpXVswXSArIHh5eltpXVsxXSp4eXpbaV1bMV0pICk7XG4gICAgICAgIGlmIChPTUlUX01BRz09MSkge1xuICAgICAgICAgICAgYXppRWxldlJbaV0gPSBbYXppLGVsZXZdO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgciA9IE1hdGguc3FydCh4eXpbaV1bMF0qeHl6W2ldWzBdICsgeHl6W2ldWzFdKnh5eltpXVsxXSArIHh5eltpXVsyXSp4eXpbaV1bMl0pO1xuICAgICAgICAgICAgYXppRWxldlJbaV0gPSBbYXppLGVsZXYscl07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGF6aUVsZXZSO1xufVxuXG4vLyBjb252ZXJ0U3BoMkNhcnQgY29udmVydHMgYXJyYXlzIG9mIHNwaGVyaWNhbCBjb29yZGluYXRlcyB0byBjYXJ0ZXNpYW5cbnZhciBjb252ZXJ0U3BoMkNhcnQgPSBmdW5jdGlvbiAoYXppRWxldlIpIHtcbiAgICBcbiAgICB2YXIgeCx5LHo7XG4gICAgdmFyIHh5eiA9IG5ldyBBcnJheShhemlFbGV2Ui5sZW5ndGgpO1xuICAgIFxuICAgIGZvciAodmFyIGk9MDsgaTxhemlFbGV2Ui5sZW5ndGg7IGkrKykge1xuICAgICAgICB4ID0gTWF0aC5jb3MoYXppRWxldlJbaV1bMF0pKk1hdGguY29zKGF6aUVsZXZSW2ldWzFdKTtcbiAgICAgICAgeSA9IE1hdGguc2luKGF6aUVsZXZSW2ldWzBdKSpNYXRoLmNvcyhhemlFbGV2UltpXVsxXSk7XG4gICAgICAgIHogPSBNYXRoLnNpbihhemlFbGV2UltpXVsxXSk7XG4gICAgICAgIGlmIChhemlFbGV2UlswXS5sZW5ndGg9PTIpIHh5eltpXSA9IFt4LHksel07XG4gICAgICAgIGVsc2UgaWYgKGF6aUVsZXZSWzBdLmxlbmd0aD09MykgeHl6W2ldID0gW2F6aUVsZXZSW2ldWzJdKngsYXppRWxldlJbaV1bMl0qeSxhemlFbGV2UltpXVsyXSp6XTtcbiAgICB9XG4gICAgcmV0dXJuIHh5ejtcbn1cblxuLy8gY29tcHV0ZVJlYWxTSCBjb21wdXRlcyByZWFsIHNwaGVyaWNhbCBoYXJtb25pY3MgdXAgdG8gb3JkZXIgTlxudmFyIGNvbXB1dGVSZWFsU0ggPSBmdW5jdGlvbiAoTiwgZGF0YSkge1xuICAgIFxuICAgIHZhciBhemkgPSBuZXcgQXJyYXkoZGF0YS5sZW5ndGgpO1xuICAgIHZhciBlbGV2ID0gbmV3IEFycmF5KGRhdGEubGVuZ3RoKTtcbiAgICBcbiAgICBmb3IgKHZhciBpPTA7IGk8ZGF0YS5sZW5ndGg7IGkrKykge1xuICAgICAgICBhemlbaV0gPSBkYXRhW2ldWzBdO1xuICAgICAgICBlbGV2W2ldID0gZGF0YVtpXVsxXTtcbiAgICB9XG4gICAgXG4gICAgdmFyIGZhY3RvcmlhbHMgPSBuZXcgQXJyYXkoMipOKzEpO1xuICAgIHZhciBOZGlycyA9IGF6aS5sZW5ndGg7XG4gICAgdmFyIE5zaCA9IChOKzEpKihOKzEpO1xuICAgIHZhciBsZWdfbl9taW51czEgPSAwO1xuICAgIHZhciBsZWdfbl9taW51czIgPSAwO1xuICAgIHZhciBsZWdfbjtcbiAgICB2YXIgc2luZWwgPSBudW1lcmljLnNpbihlbGV2KTtcbiAgICB2YXIgaW5kZXhfbiA9IDA7XG4gICAgdmFyIFlfTiA9IG5ldyBBcnJheShOc2gpO1xuICAgIHZhciBObjAsIE5ubTtcbiAgICB2YXIgY29zbWF6aSwgc2lubWF6aTtcbiAgICBcbiAgICAvLyBwcmVjb21wdXRlIGZhY3RvcmlhbHNcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IDIqTisxOyBpKyspIGZhY3RvcmlhbHNbaV0gPSBmYWN0b3JpYWwoaSk7XG4gICAgXG4gICAgZm9yICh2YXIgbiA9IDA7IG48TisxOyBuKyspIHtcbiAgICAgICAgaWYgKG49PTApIHtcbiAgICAgICAgICAgIHZhciB0ZW1wMCA9IG5ldyBBcnJheShhemkubGVuZ3RoKTtcbiAgICAgICAgICAgIHRlbXAwLmZpbGwoMSk7XG4gICAgICAgICAgICBZX05bbl0gPSB0ZW1wMDtcbiAgICAgICAgICAgIGluZGV4X24gPSAxO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgbGVnX24gPSByZWN1cnNlTGVnZW5kcmVQb2x5KG4sIHNpbmVsLCBsZWdfbl9taW51czEsIGxlZ19uX21pbnVzMik7XG4gICAgICAgICAgICBObjAgPSBNYXRoLnNxcnQoMipuKzEpO1xuICAgICAgICAgICAgZm9yICh2YXIgbSA9IDA7IG08bisxOyBtKyspIHtcbiAgICAgICAgICAgICAgICBpZiAobT09MCkgWV9OW2luZGV4X24rbl0gPSBudW1lcmljLm11bChObjAsbGVnX25bbV0pO1xuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBObm0gPSBObjAqTWF0aC5zcXJ0KCAyICogZmFjdG9yaWFsc1tuLW1dL2ZhY3RvcmlhbHNbbittXSApO1xuICAgICAgICAgICAgICAgICAgICBjb3NtYXppID0gbnVtZXJpYy5jb3MobnVtZXJpYy5tdWwobSxhemkpKTtcbiAgICAgICAgICAgICAgICAgICAgc2lubWF6aSA9IG51bWVyaWMuc2luKG51bWVyaWMubXVsKG0sYXppKSk7XG4gICAgICAgICAgICAgICAgICAgIFlfTltpbmRleF9uK24tbV0gPSBudW1lcmljLm11bChObm0sIG51bWVyaWMubXVsKGxlZ19uW21dLCBzaW5tYXppKSk7XG4gICAgICAgICAgICAgICAgICAgIFlfTltpbmRleF9uK24rbV0gPSBudW1lcmljLm11bChObm0sIG51bWVyaWMubXVsKGxlZ19uW21dLCBjb3NtYXppKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaW5kZXhfbiA9IGluZGV4X24rMipuKzE7XG4gICAgICAgIH1cbiAgICAgICAgbGVnX25fbWludXMyID0gbGVnX25fbWludXMxO1xuICAgICAgICBsZWdfbl9taW51czEgPSBsZWdfbjtcbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIFlfTjtcbn1cblxuLy8gZmFjdG9yaWFsIGNvbXB1dGUgZmFjdG9yaWFsXG52YXIgZmFjdG9yaWFsID0gZnVuY3Rpb24gKG4pIHtcbiAgICBpZiAobiA9PT0gMCkgcmV0dXJuIDE7XG4gICAgcmV0dXJuIG4gKiBmYWN0b3JpYWwobiAtIDEpO1xufVxuXG4vLyByZWN1cnNlTGVnZW5kcmVQb2x5IGNvbXB1dGVzIGFzc29jaWF0ZWQgTGVnZW5kcmUgZnVuY3Rpb25zIHJlY3Vyc2l2ZWx5XG52YXIgcmVjdXJzZUxlZ2VuZHJlUG9seSA9IGZ1bmN0aW9uIChuLCB4LCBQbm1fbWludXMxLCBQbm1fbWludXMyKSB7XG4gICAgXG4gICAgdmFyIFBubSA9IG5ldyBBcnJheShuKzEpO1xuICAgIHN3aXRjaChuKSB7XG4gICAgICAgIGNhc2UgMTpcbiAgICAgICAgICAgIHZhciB4MiA9IG51bWVyaWMubXVsKHgseCk7XG4gICAgICAgICAgICB2YXIgUDEwID0geDtcbiAgICAgICAgICAgIHZhciBQMTEgPSBudW1lcmljLnNxcnQobnVtZXJpYy5zdWIoMSx4MikpO1xuICAgICAgICAgICAgUG5tWzBdID0gUDEwO1xuICAgICAgICAgICAgUG5tWzFdID0gUDExO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgMjpcbiAgICAgICAgICAgIHZhciB4MiA9IG51bWVyaWMubXVsKHgseCk7XG4gICAgICAgICAgICB2YXIgUDIwID0gbnVtZXJpYy5tdWwoMyx4Mik7XG4gICAgICAgICAgICBQMjAgPSBudW1lcmljLnN1YihQMjAsMSk7XG4gICAgICAgICAgICBQMjAgPSBudW1lcmljLmRpdihQMjAsMik7XG4gICAgICAgICAgICB2YXIgUDIxID0gbnVtZXJpYy5zdWIoMSx4Mik7XG4gICAgICAgICAgICBQMjEgPSBudW1lcmljLnNxcnQoUDIxKTtcbiAgICAgICAgICAgIFAyMSA9IG51bWVyaWMubXVsKDMsUDIxKTtcbiAgICAgICAgICAgIFAyMSA9IG51bWVyaWMubXVsKFAyMSx4KTtcbiAgICAgICAgICAgIHZhciBQMjIgPSBudW1lcmljLnN1YigxLHgyKTtcbiAgICAgICAgICAgIFAyMiA9IG51bWVyaWMubXVsKDMsUDIyKTtcbiAgICAgICAgICAgIFBubVswXSA9IFAyMDtcbiAgICAgICAgICAgIFBubVsxXSA9IFAyMTtcbiAgICAgICAgICAgIFBubVsyXSA9IFAyMjtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgdmFyIHgyID0gbnVtZXJpYy5tdWwoeCx4KTtcbiAgICAgICAgICAgIHZhciBvbmVfbWluX3gyID0gbnVtZXJpYy5zdWIoMSx4Mik7XG4gICAgICAgICAgICAvLyBsYXN0IHRlcm0gbT1uXG4gICAgICAgICAgICB2YXIgayA9IDIqbi0xO1xuICAgICAgICAgICAgdmFyIGRmYWN0X2sgPSAxO1xuICAgICAgICAgICAgaWYgKChrICUgMikgPT0gMCkge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGtrPTE7IGtrPGsvMisxOyBraysrKSBkZmFjdF9rID0gZGZhY3RfayoyKmtrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIga2s9MTsga2s8KGsrMSkvMisxOyBraysrKSBkZmFjdF9rID0gZGZhY3RfayooMipray0xKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFBubVtuXSA9IG51bWVyaWMubXVsKGRmYWN0X2ssIG51bWVyaWMucG93KG9uZV9taW5feDIsIG4vMikpO1xuICAgICAgICAgICAgLy8gYmVmb3JlIGxhc3QgdGVybVxuICAgICAgICAgICAgUG5tW24tMV0gPSBudW1lcmljLm11bCgyKm4tMSwgbnVtZXJpYy5tdWwoeCwgUG5tX21pbnVzMVtuLTFdKSk7IC8vIFBfe24obi0xKX0gPSAoMipuLTEpKngqUF97KG4tMSkobi0xKX1cbiAgICAgICAgICAgIC8vIHRocmVlIHRlcm0gcmVjdXJzZW5jZSBmb3IgdGhlIHJlc3RcbiAgICAgICAgICAgIGZvciAodmFyIG09MDsgbTxuLTE7IG0rKykge1xuICAgICAgICAgICAgICAgIHZhciB0ZW1wMSA9IG51bWVyaWMubXVsKCAyKm4tMSwgbnVtZXJpYy5tdWwoeCwgUG5tX21pbnVzMVttXSkgKTtcbiAgICAgICAgICAgICAgICB2YXIgdGVtcDIgPSBudW1lcmljLm11bCggbittLTEsIFBubV9taW51czJbbV0gKTtcbiAgICAgICAgICAgICAgICBQbm1bbV0gPSBudW1lcmljLmRpdiggbnVtZXJpYy5zdWIodGVtcDEsIHRlbXAyKSwgbi1tKTsgLy8gUF9sID0gKCAoMmwtMSl4UF8obC0xKSAtIChsK20tMSlQXyhsLTIpICkvKGwtbSlcbiAgICAgICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIFBubTtcbn1cblxuLy8gcGludl9zdmQgY29tcHV0ZXMgdGhlIHBzZXVkby1pbnZlcnNlIHVzaW5nIFNWRFxudmFyIHBpbnZfc3ZkID0gZnVuY3Rpb24gKEEpIHtcbiAgICB2YXIgeiA9IG51bWVyaWMuc3ZkKEEpLCBmb28gPSB6LlNbMF07XG4gICAgdmFyIFUgPSB6LlUsIFMgPSB6LlMsIFYgPSB6LlY7XG4gICAgdmFyIG0gPSBBLmxlbmd0aCwgbiA9IEFbMF0ubGVuZ3RoLCB0b2wgPSBNYXRoLm1heChtLG4pKm51bWVyaWMuZXBzaWxvbipmb28sTSA9IFMubGVuZ3RoO1xuICAgIHZhciBTaW52ID0gbmV3IEFycmF5KE0pO1xuICAgIGZvcih2YXIgaT1NLTE7aSE9PS0xO2ktLSkgeyBpZihTW2ldPnRvbCkgU2ludltpXSA9IDEvU1tpXTsgZWxzZSBTaW52W2ldID0gMDsgfVxuICAgIHJldHVybiBudW1lcmljLmRvdChudW1lcmljLmRvdChWLG51bWVyaWMuZGlhZyhTaW52KSksbnVtZXJpYy50cmFuc3Bvc2UoVSkpXG59XG5cbi8vIHBpbnZfZGlyZWN0IGNvbXB1dGVzIHRoZSBsZWZ0IHBzZXVkby1pbnZlcnNlXG52YXIgcGludl9kaXJlY3QgPSBmdW5jdGlvbiAoQSkge1xuICAgIHZhciBBVCA9IG51bWVyaWMudHJhbnNwb3NlKEEpO1xuICAgIHJldHVybiBudW1lcmljLmRvdChudW1lcmljLmludihudW1lcmljLmRvdChBVCxBKSksQVQpO1xufVxuXG4vLyBjb21wdXRlcyByb3RhdGlvbiBtYXRyaWNlcyBmb3IgcmVhbCBzcGhlcmljYWwgaGFybW9uaWNzXG52YXIgZ2V0U0hyb3RNdHggPSBmdW5jdGlvbiAoUnh5eiwgTCkge1xuICAgIFxuICAgIHZhciBOc2ggPSAoTCsxKSooTCsxKTtcbiAgICAvLyBhbGxvY2F0ZSB0b3RhbCByb3RhdGlvbiBtYXRyaXhcbiAgICB2YXIgUiA9IG51bWVyaWMucmVwKFtOc2gsTnNoXSwwKTtcbiAgICBcbiAgICAvLyBpbml0aWFsaXplIHplcm90aCBhbmQgZmlyc3QgYmFuZCByb3RhdGlvbiBtYXRyaWNlcyBmb3IgcmVjdXJzaW9uXG4gICAgLy8gUnh5eiA9IFtSeHggUnh5IFJ4elxuICAgIC8vICAgICAgICAgUnl4IFJ5eSBSeXpcbiAgICAvLyAgICAgICAgIFJ6eCBSenkgUnp6XVxuICAgIC8vXG4gICAgLy8gemVyb3RoLWJhbmQgKGw9MCkgaXMgaW52YXJpYW50IHRvIHJvdGF0aW9uXG4gICAgUlswXVswXSA9IDE7XG4gICAgXG4gICAgLy8gdGhlIGZpcnN0IGJhbmQgKGw9MSkgaXMgZGlyZWN0bHkgcmVsYXRlZCB0byB0aGUgcm90YXRpb24gbWF0cml4XG4gICAgdmFyIFJfMSA9IG51bWVyaWMucmVwKFszLDNdLDApO1xuICAgIFJfMVswXVswXSA9IFJ4eXpbMV1bMV07XG4gICAgUl8xWzBdWzFdID0gUnh5elsxXVsyXTtcbiAgICBSXzFbMF1bMl0gPSBSeHl6WzFdWzBdO1xuICAgIFJfMVsxXVswXSA9IFJ4eXpbMl1bMV07XG4gICAgUl8xWzFdWzFdID0gUnh5elsyXVsyXTtcbiAgICBSXzFbMV1bMl0gPSBSeHl6WzJdWzBdO1xuICAgIFJfMVsyXVswXSA9IFJ4eXpbMF1bMV07XG4gICAgUl8xWzJdWzFdID0gUnh5elswXVsyXTtcbiAgICBSXzFbMl1bMl0gPSBSeHl6WzBdWzBdO1xuICAgIFxuICAgIFIgPSBudW1lcmljLnNldEJsb2NrKFIsIFsxLDFdLCBbMywzXSwgUl8xKTtcbiAgICB2YXIgUl9sbTEgPSBSXzE7XG4gICAgXG4gICAgLy8gY29tcHV0ZSByb3RhdGlvbiBtYXRyaXggb2YgZWFjaCBzdWJzZXF1ZW50IGJhbmQgcmVjdXJzaXZlbHlcbiAgICB2YXIgYmFuZF9pZHggPSAzO1xuICAgIGZvciAodmFyIGw9MjsgbDxMKzE7IGwrKykge1xuICAgICAgICBcbiAgICAgICAgdmFyIFJfbCA9IG51bWVyaWMucmVwKFsoMipsKzEpLCgyKmwrMSldLDApO1xuICAgICAgICBmb3IgKHZhciBtPS1sOyBtPGwrMTsgbSsrKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBuPS1sOyBuPGwrMTsgbisrKSB7XG4gICAgICAgICAgICAgICAgLy8gY29tcHV0ZSB1LHYsdyB0ZXJtcyBvZiBFcS44LjEgKFRhYmxlIEkpXG4gICAgICAgICAgICAgICAgdmFyIGQsIGRlbm9tLCB1LCB2LCB3O1xuICAgICAgICAgICAgICAgIGlmIChtPT0wKSBkID0gMTtcbiAgICAgICAgICAgICAgICBlbHNlIGQgPSAwOyAvLyB0aGUgZGVsdGEgZnVuY3Rpb24gZF9tMFxuICAgICAgICAgICAgICAgIGlmIChNYXRoLmFicyhuKT09bCkgZGVub20gPSAoMipsKSooMipsLTEpO1xuICAgICAgICAgICAgICAgIGVsc2UgZGVub20gPSAobCpsLW4qbik7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgdSA9IE1hdGguc3FydCgobCpsLW0qbSkvZGVub20pO1xuICAgICAgICAgICAgICAgIHYgPSBNYXRoLnNxcnQoKDErZCkqKGwrTWF0aC5hYnMobSktMSkqKGwrTWF0aC5hYnMobSkpL2Rlbm9tKSooMS0yKmQpKjAuNTtcbiAgICAgICAgICAgICAgICB3ID0gTWF0aC5zcXJ0KChsLU1hdGguYWJzKG0pLTEpKihsLU1hdGguYWJzKG0pKS9kZW5vbSkqKDEtZCkqKC0wLjUpO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIC8vIGNvbXB1dGVzIEVxLjguMVxuICAgICAgICAgICAgICAgIGlmICh1IT0wKSB1ID0gdSpVKGwsbSxuLFJfMSxSX2xtMSk7XG4gICAgICAgICAgICAgICAgaWYgKHYhPTApIHYgPSB2KlYobCxtLG4sUl8xLFJfbG0xKTtcbiAgICAgICAgICAgICAgICBpZiAodyE9MCkgdyA9IHcqVyhsLG0sbixSXzEsUl9sbTEpO1xuICAgICAgICAgICAgICAgIFJfbFttK2xdW24rbF0gPSB1ICsgdiArIHc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgUiA9IG51bWVyaWMuc2V0QmxvY2soUiwgW2JhbmRfaWR4KzEsYmFuZF9pZHgrMV0sIFtiYW5kX2lkeCsyKmwrMSxiYW5kX2lkeCsyKmwrMV0sIFJfbCk7XG4gICAgICAgIFJfbG0xID0gUl9sO1xuICAgICAgICBiYW5kX2lkeCA9IGJhbmRfaWR4ICsgMipsKzE7XG4gICAgfVxuICAgIHJldHVybiBSO1xufVxuXG4vLyBmdW5jdGlvbnMgdG8gY29tcHV0ZSB0ZXJtcyBVLCBWLCBXIG9mIEVxLjguMSAoVGFibGUgSUkpXG5mdW5jdGlvbiBVKGwsbSxuLFJfMSxSX2xtMSkge1xuICAgIFxuICAgIHJldHVybiBQKDAsbCxtLG4sUl8xLFJfbG0xKTtcbn1cblxuZnVuY3Rpb24gVihsLG0sbixSXzEsUl9sbTEpIHtcbiAgICBcbiAgICB2YXIgcDAsIHAxLCByZXQsIGQ7XG4gICAgaWYgKG09PTApIHtcbiAgICAgICAgcDAgPSBQKDEsbCwxLG4sUl8xLFJfbG0xKTtcbiAgICAgICAgcDEgPSBQKC0xLGwsLTEsbixSXzEsUl9sbTEpO1xuICAgICAgICByZXQgPSBwMCtwMTtcbiAgICB9XG4gICAgZWxzZSBpZiAobT4wKSB7XG4gICAgICAgIGlmIChtPT0xKSBkID0gMTtcbiAgICAgICAgZWxzZSBkID0gMDtcbiAgICAgICAgcDAgPSBQKDEsbCxtLTEsbixSXzEsUl9sbTEpO1xuICAgICAgICBwMSA9IFAoLTEsbCwtbSsxLG4sUl8xLFJfbG0xKTtcbiAgICAgICAgcmV0ID0gcDAqTWF0aC5zcXJ0KDErZCkgLSBwMSooMS1kKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGlmIChtPT0tMSkgZCA9IDE7XG4gICAgICAgIGVsc2UgZCA9IDA7XG4gICAgICAgIHAwID0gUCgxLGwsbSsxLG4sUl8xLFJfbG0xKTtcbiAgICAgICAgcDEgPSBQKC0xLGwsLW0tMSxuLFJfMSxSX2xtMSk7XG4gICAgICAgIHJldCA9IHAwKigxLWQpICsgcDEqTWF0aC5zcXJ0KDErZCk7XG4gICAgfVxuICAgIHJldHVybiByZXQ7XG59XG5cbmZ1bmN0aW9uIFcobCxtLG4sUl8xLFJfbG0xKSB7XG4gICAgXG4gICAgdmFyIHAwLCBwMSwgcmV0O1xuICAgIGlmIChtPT0wKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJzaG91bGQgbm90IGJlIGNhbGxlZFwiKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGlmIChtPjApIHtcbiAgICAgICAgICAgIHAwID0gUCgxLGwsbSsxLG4sUl8xLFJfbG0xKTtcbiAgICAgICAgICAgIHAxID0gUCgtMSxsLC1tLTEsbixSXzEsUl9sbTEpO1xuICAgICAgICAgICAgcmV0ID0gcDAgKyBwMTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHAwID0gUCgxLGwsbS0xLG4sUl8xLFJfbG0xKTtcbiAgICAgICAgICAgIHAxID0gUCgtMSxsLC1tKzEsbixSXzEsUl9sbTEpO1xuICAgICAgICAgICAgcmV0ID0gcDAgLSBwMTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmV0O1xufVxuXG4vLyBmdW5jdGlvbiB0byBjb21wdXRlIHRlcm0gUCBvZiBVLFYsVyAoVGFibGUgSUkpXG5mdW5jdGlvbiBQKGksbCxhLGIsUl8xLFJfbG0xKSB7XG4gICAgXG4gICAgdmFyIHJpMSwgcmltMSwgcmkwLCByZXQ7XG4gICAgcmkxID0gUl8xW2krMV1bMSsxXTtcbiAgICByaW0xID0gUl8xW2krMV1bLTErMV07XG4gICAgcmkwID0gUl8xW2krMV1bMCsxXTtcbiAgICBcbiAgICBpZiAoYj09LWwpIHtcbiAgICAgICAgcmV0ID0gcmkxKlJfbG0xW2ErbC0xXVswXSArIHJpbTEqUl9sbTFbYStsLTFdWzIqbC0yXTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGlmIChiPT1sKSByZXQgPSByaTEqUl9sbTFbYStsLTFdWzIqbC0yXSAtIHJpbTEqUl9sbTFbYStsLTFdWzBdO1xuICAgICAgICBlbHNlIHJldCA9IHJpMCpSX2xtMVthK2wtMV1bYitsLTFdO1xuICAgIH1cbiAgICByZXR1cm4gcmV0O1xufVxuXG4vLyB5YXdQaXRjaFJvbGwyUnp5eCBjb21wdXRlcyB0aGUgcm90YXRpb24gbWF0cml4IGZyb20gWlknWCcnIHJvdGF0aW9uIGFuZ2xlc1xudmFyIHlhd1BpdGNoUm9sbDJSenl4ID0gZnVuY3Rpb24gKHlhdywgcGl0Y2gsIHJvbGwpIHtcbiAgICBcbiAgICB2YXIgUngsIFJ5LCBSejtcbiAgICBpZiAocm9sbCA9PSAwKSBSeCA9IFtbMSwwLDBdLFswLDEsMF0sWzAsMCwxXV07XG4gICAgZWxzZSBSeCA9IFtbMSwgMCwgMF0sIFswLCBNYXRoLmNvcyhyb2xsKSwgTWF0aC5zaW4ocm9sbCldLCBbMCwgLU1hdGguc2luKHJvbGwpLCBNYXRoLmNvcyhyb2xsKV1dO1xuICAgIGlmIChwaXRjaCA9PSAwKSBSeSA9IFtbMSwwLDBdLFswLDEsMF0sWzAsMCwxXV07XG4gICAgZWxzZSBSeSA9IFtbTWF0aC5jb3MocGl0Y2gpLCAwLCAtTWF0aC5zaW4ocGl0Y2gpXSwgWzAsIDEsIDBdLCBbTWF0aC5zaW4ocGl0Y2gpLCAwLCBNYXRoLmNvcyhwaXRjaCldXTtcbiAgICBpZiAoeWF3ID09IDApIFJ6ID0gW1sxLDAsMF0sWzAsMSwwXSxbMCwwLDFdXTtcbiAgICBlbHNlIFJ6ID0gW1tNYXRoLmNvcyh5YXcpLCBNYXRoLnNpbih5YXcpLCAwXSwgWy1NYXRoLnNpbih5YXcpLCBNYXRoLmNvcyh5YXcpLCAwXSwgWzAsIDAsIDFdXTtcbiAgICBcbiAgICB2YXIgUiA9IG51bWVyaWMuZG90TU1zbWFsbChSeSxSeik7XG4gICAgUiA9IG51bWVyaWMuZG90TU1zbWFsbChSeCxSKTtcbiAgICByZXR1cm4gUjtcbn1cblxuXG4vLyBleHBvcnRzXG5tb2R1bGUuZXhwb3J0cy5mb3J3YXJkU0hUID0gZm9yd2FyZFNIVDtcbm1vZHVsZS5leHBvcnRzLmludmVyc2VTSFQgPSBpbnZlcnNlU0hUO1xubW9kdWxlLmV4cG9ydHMucHJpbnQyRGFycmF5ID0gcHJpbnQyRGFycmF5O1xubW9kdWxlLmV4cG9ydHMuY29udmVydENhcnQyU3BoID0gY29udmVydENhcnQyU3BoO1xubW9kdWxlLmV4cG9ydHMuY29udmVydFNwaDJDYXJ0ID0gY29udmVydFNwaDJDYXJ0O1xubW9kdWxlLmV4cG9ydHMuY29tcHV0ZVJlYWxTSCA9IGNvbXB1dGVSZWFsU0g7XG5tb2R1bGUuZXhwb3J0cy5mYWN0b3JpYWwgPSBmYWN0b3JpYWw7XG5tb2R1bGUuZXhwb3J0cy5yZWN1cnNlTGVnZW5kcmVQb2x5ID0gcmVjdXJzZUxlZ2VuZHJlUG9seTtcbm1vZHVsZS5leHBvcnRzLnBpbnZfc3ZkID0gcGludl9zdmQ7XG5tb2R1bGUuZXhwb3J0cy5waW52X2RpcmVjdCA9IHBpbnZfZGlyZWN0O1xubW9kdWxlLmV4cG9ydHMuZ2V0U0hyb3RNdHggPSBnZXRTSHJvdE10eDtcbm1vZHVsZS5leHBvcnRzLnlhd1BpdGNoUm9sbDJSenl4ID0geWF3UGl0Y2hSb2xsMlJ6eXg7XG4iXX0=
