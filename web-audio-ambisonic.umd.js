(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.webAudioAmbisonic = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
/* B_FORMAT INTENSITY ANALYZER */
/////////////////////////////////

var Bformat_analyser = function () {
    function Bformat_analyser(audioCtx) {
        (0, _classCallCheck3.default)(this, Bformat_analyser);

        this.initialized = false;

        this.ctx = audioCtx;
        this.fftSize = 2048;
        this.analysers = new Array(4);
        this.analBuffers = new Array(4);
        // Input and output nodes
        this.in = this.ctx.createChannelSplitter(4);
        this.out = this.ctx.createChannelMerger(4);
        // Initialize analyzer buffers
        for (var i = 0; i < 4; i++) {
            this.analysers[i] = this.ctx.createAnalyser();
            this.analysers[i].fftSize = this.fftSize;
            this.analysers[i].smoothingTimeConstant = 0;
            this.analBuffers[i] = new Float32Array(this.fftSize);
        }
        // Create connections
        for (var _i = 0; _i < 4; _i++) {
            this.in.connect(this.out, _i, _i);
            this.in.connect(this.analysers[_i], _i, 0);
        }

        this.initialized = true;
    }

    (0, _createClass3.default)(Bformat_analyser, [{
        key: "updateBuffers",
        value: function updateBuffers() {
            // Get latest time-domain data
            for (var i = 0; i < 4; i++) {
                this.analysers[i].getFloatTimeDomainData(this.analBuffers[i]);
            }
        }
    }, {
        key: "computeIntensity",
        value: function computeIntensity() {
            // Compute correlations and energies of channels
            var iX = 0;
            var iY = 0;
            var iZ = 0;
            var WW = 0;
            var XX = 0;
            var YY = 0;
            var ZZ = 0;
            var I, I_norm, E, Psi, azi, elev;
            // Accumulators for correlations and energies
            for (var i = 0; i < this.fftSize; i++) {

                iX = iX + Math.sqrt(2) * this.analBuffers[0][i] * this.analBuffers[1][i];
                iY = iY + Math.sqrt(2) * this.analBuffers[0][i] * this.analBuffers[2][i];
                iZ = iZ + Math.sqrt(2) * this.analBuffers[0][i] * this.analBuffers[3][i];
                WW = WW + 2 * this.analBuffers[0][i] * this.analBuffers[0][i];
                XX = XX + this.analBuffers[1][i] * this.analBuffers[1][i];
                YY = YY + this.analBuffers[2][i] * this.analBuffers[2][i];
                ZZ = ZZ + this.analBuffers[3][i] * this.analBuffers[3][i];
            }
            I = [iX, iY, iZ]; // intensity
            I_norm = Math.sqrt(I[0] * I[0] + I[1] * I[1] + I[2] * I[2]); // intensity magnitude
            E = (WW + XX + YY + ZZ) / 2; // energy
            Psi = 1 - I_norm / (E + 10e-8); // diffuseness
            azi = Math.atan2(iY, iX) * 180 / Math.PI;
            elev = Math.atan2(I[2], Math.sqrt(I[0] * I[0] + I[1] * I[1])) * 180 / Math.PI;

            var params = [azi, elev, Psi, E];
            return params;
        }
    }]);
    return Bformat_analyser;
}();

exports.default = Bformat_analyser;

},{"babel-runtime/helpers/classCallCheck":20,"babel-runtime/helpers/createClass":21}],2:[function(require,module,exports){
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

///////////////////////////////
/* B_FORMAT BINAURAL DECODER */
///////////////////////////////

var Bformat_binDecoder = function () {
    function Bformat_binDecoder(audioCtx) {
        (0, _classCallCheck3.default)(this, Bformat_binDecoder);

        this.initialized = false;

        this.ctx = audioCtx;
        this.decFilters = new Array(4);
        this.decFilterNodes = new Array(4);
        // input and output nodes
        this.in = this.ctx.createChannelSplitter(4);
        this.out = this.ctx.createChannelMerger(2);
        // downmixing gains for left and right ears
        this.gainMid = this.ctx.createGain();
        this.gainSide = this.ctx.createGain();
        this.invertSide = this.ctx.createGain();
        this.gainMid.gain.value = 1;
        this.gainSide.gain.value = 1;
        this.invertSide.gain.value = -1;
        // initialize convolvers
        for (var i = 0; i < 4; i++) {
            this.decFilterNodes[i] = this.ctx.createConvolver();
            this.decFilterNodes[i].normalize = false;
        }
        // initialize filters to plain opposing cardioids
        this.resetFilters();

        // Create connections
        for (var i = 0; i < 4; i++) {
            this.in.connect(this.decFilterNodes[i], i, 0);

            if (i == 2) this.decFilterNodes[i].connect(this.gainSide, 0, 0);else this.decFilterNodes[i].connect(this.gainMid, 0, 0);
        }
        this.gainMid.connect(this.out, 0, 0);
        this.gainSide.connect(this.out, 0, 0);

        this.gainMid.connect(this.out, 0, 1);
        this.gainSide.connect(this.invertSide, 0, 0);
        this.invertSide.connect(this.out, 0, 1);

        this.initialized = true;
    }

    (0, _createClass3.default)(Bformat_binDecoder, [{
        key: "updateFilters",
        value: function updateFilters(audioBuffer) {
            // assign filters to convolvers
            for (var i = 0; i < 4; i++) {
                this.decFilters[i] = this.ctx.createBuffer(1, audioBuffer.length, audioBuffer.sampleRate);
                this.decFilters[i].getChannelData(0).set(audioBuffer.getChannelData(i));

                this.decFilterNodes[i].buffer = this.decFilters[i];
            }
        }
    }, {
        key: "resetFilters",
        value: function resetFilters() {
            // overwrite decoding filters with plain opposing cardioids
            var cardGains = [0.5 * Math.SQRT2, 0, 0.5, 0];
            for (var i = 0; i < 4; i++) {
                this.decFilters[i] = this.ctx.createBuffer(1, 1, this.ctx.sampleRate);
                this.decFilters[i].getChannelData(0).set([cardGains[i]]);

                this.decFilterNodes[i].buffer = this.decFilters[i];
            }
        }
    }]);
    return Bformat_binDecoder;
}();

exports.default = Bformat_binDecoder;

},{"babel-runtime/helpers/classCallCheck":20,"babel-runtime/helpers/createClass":21}],3:[function(require,module,exports){
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

//////////////////////
/* B_FORMAT ENCODER */
//////////////////////

var Bformat_encoder = function () {
    function Bformat_encoder(audioCtx) {
        (0, _classCallCheck3.default)(this, Bformat_encoder);


        this.initialized = false;

        this.ctx = audioCtx;
        this.azi = 0;
        this.elev = 0;
        this.gainNodes = new Array(4);
        this.in = this.ctx.createGain();
        //    this.in.channelCountMode = 'explicit';
        //    this.in.channelCount = 1;
        this.out = this.ctx.createChannelMerger(4);
        // initialize gains to front direction
        this.gains = [Math.SQRT1_2, 1, 0, 0];
        for (var i = 0; i < 4; i++) {
            this.gainNodes[i] = this.ctx.createGain();
            //        this.gainNodes[i].channelCountMode = 'explicit';
            //        this.gainNodes[i].channelCount = 1;
            this.gainNodes[i].gain.value = this.gains[i];
        }

        // Create connections
        for (var _i = 0; _i < 4; _i++) {
            this.in.connect(this.gainNodes[_i]);
            this.gainNodes[_i].connect(this.out, 0, _i);
        }

        this.initialized = true;
    }

    (0, _createClass3.default)(Bformat_encoder, [{
        key: "updateGains",
        value: function updateGains() {
            var azi = this.azi * Math.PI / 180;
            var elev = this.elev * Math.PI / 180;

            this.gains[1] = Math.cos(azi) * Math.cos(elev);
            this.gains[2] = Math.sin(azi) * Math.cos(elev);
            this.gains[3] = Math.sin(elev);

            for (var i = 1; i < 4; i++) {
                this.gainNodes[i].gain.value = this.gains[i];
            }
        }
    }]);
    return Bformat_encoder;
}();

exports.default = Bformat_encoder;

},{"babel-runtime/helpers/classCallCheck":20,"babel-runtime/helpers/createClass":21}],4:[function(require,module,exports){
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

//////////////////////
/* B_FORMAT ROTATOR */
//////////////////////

var Bformat_rotator = function () {
    function Bformat_rotator(audioCtx) {
        (0, _classCallCheck3.default)(this, Bformat_rotator);

        this.initialized = false;

        this.ctx = audioCtx;
        this.yaw = 0;
        this.pitch = 0;
        this.roll = 0;
        this.rotMtx = [[], [], []];
        this.rotMtxNodes = [[], [], []];

        // Input and output nodes
        this.in = this.ctx.createChannelSplitter(4);
        this.out = this.ctx.createChannelMerger(4);
        // Initialize rotation gains to identity matrix
        for (var i = 0; i < 3; i++) {
            for (var j = 0; j < 3; j++) {
                this.rotMtxNodes[i][j] = context.createGain();
                if (i == j) this.rotMtxNodes[i][j].gain.value = 1;else this.rotMtxNodes[i][j].gain.value = 0;
            }
        }
        // Create connections
        this.in.connect(this.out, 0, 0);

        for (var _i = 0; _i < 3; _i++) {
            for (var _j = 0; _j < 3; _j++) {
                this.in.connect(this.rotMtxNodes[_i][_j], _j + 1, 0);
                this.rotMtxNodes[_i][_j].connect(this.out, 0, _i + 1);
            }
        }

        this.initialized = true;
    }

    (0, _createClass3.default)(Bformat_rotator, [{
        key: "updateRotMtx",
        value: function updateRotMtx() {
            var yaw = this.yaw * Math.PI / 180;
            var pitch = this.pitch * Math.PI / 180;
            var roll = this.roll * Math.PI / 180;
            var Rxx, Rxy, Rxz, Ryx, Ryy, Ryz, Rzx, Rzy, Rzz;

            Rxx = Math.cos(pitch) * Math.cos(yaw);
            Rxy = Math.cos(pitch) * Math.sin(yaw);
            Rxz = -Math.sin(pitch);
            Ryx = Math.cos(yaw) * Math.sin(pitch) * Math.sin(roll) - Math.cos(roll) * Math.sin(yaw);
            Ryy = Math.cos(roll) * Math.cos(yaw) + Math.sin(pitch) * Math.sin(roll) * Math.sin(yaw);
            Ryz = Math.cos(pitch) * Math.sin(roll);
            Rzx = Math.sin(roll) * Math.sin(yaw) + Math.cos(roll) * Math.cos(yaw) * Math.sin(pitch);
            Rzy = Math.cos(roll) * Math.sin(pitch) * Math.sin(yaw) - Math.cos(yaw) * Math.sin(roll);
            Rzz = Math.cos(pitch) * Math.cos(roll);

            this.rotMtx = [[Rxx, Rxy, Rxz], [Ryx, Ryy, Ryz], [Rzx, Rzy, Rzz]];

            for (var i = 0; i < 3; i++) {
                for (var j = 0; j < 3; j++) {
                    this.rotMtxNodes[i][j].gain.value = this.rotMtx[i][j];
                }
            }
        }
    }]);
    return Bformat_rotator;
}();

exports.default = Bformat_rotator;

},{"babel-runtime/helpers/classCallCheck":20,"babel-runtime/helpers/createClass":21}],5:[function(require,module,exports){
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
/* B_FORMAT VIRTUAL MICROPHONE */
/////////////////////////////////

var Bformat_vmic = function () {
    function Bformat_vmic(audioCtx) {
        (0, _classCallCheck3.default)(this, Bformat_vmic);

        this.initialized = false;

        this.ctx = audioCtx;
        this.azi = 0;
        this.elev = 0;
        this.vmicGainNodes = new Array(4);
        this.vmicCoeff = 0.5;
        this.vmicPattern = "cardioid";
        this.in = this.ctx.createChannelSplitter(4);
        this.out = this.ctx.createGain();
        // Initialize vmic to forward facing cardioid
        this.vmicGains = [0.5 * Math.SQRT2, 0.5, 0, 0];
        for (var i = 0; i < 4; i++) {
            this.vmicGainNodes[i] = this.ctx.createGain();
            this.vmicGainNodes[i].gain.value = this.vmicGains[i];
        }
        // Initialize orientation
        this.xyz = [1, 0, 0];
        // Create connections
        for (i = 0; i < 4; i++) {
            this.in.connect(this.vmicGainNodes[i], i, 0);
            this.vmicGainNodes[i].connect(this.out);
        }

        this.initialized = true;
    }

    (0, _createClass3.default)(Bformat_vmic, [{
        key: "updatePattern",
        value: function updatePattern() {
            switch (this.vmicPattern) {
                case "subcardioid":
                    this.vmicCoeff = 2 / 3;
                    break;
                case "cardioid":
                    this.vmicCoeff = 1 / 2;
                    break;
                case "supercardioid":
                    this.vmicCoeff = (Math.sqrt(3) - 1) / 2;
                    break;
                case "hypercardioid":
                    this.vmicCoeff = 1 / 4;
                    break;
                case "dipole":
                    this.vmicCoeff = 0;
                    break;
                default:
                    this.vmicPattern = "cardioid";
                    this.vmicCoeff = 1 / 2;
            }
            this.updateGains();
        }
    }, {
        key: "updateOrientation",
        value: function updateOrientation() {
            var azi = this.azi * Math.PI / 180;
            var elev = this.elev * Math.PI / 180;

            this.xyz[0] = Math.cos(azi) * Math.cos(elev);
            this.xyz[1] = Math.sin(azi) * Math.cos(elev);
            this.xyz[2] = Math.sin(elev);

            this.updateGains();
        }
    }, {
        key: "updateGains",
        value: function updateGains() {
            var a = this.vmicCoeff;
            var xyz = this.xyz;
            this.vmicGains[0] = a * Math.SQRT2;
            this.vmicGains[1] = (1 - a) * xyz[0];
            this.vmicGains[2] = (1 - a) * xyz[1];
            this.vmicGains[3] = (1 - a) * xyz[2];

            for (var i = 0; i < 4; i++) {
                this.vmicGainNodes[i].gain.value = this.vmicGains[i];
            }
        }
    }]);
    return Bformat_vmic;
}();

exports.default = Bformat_vmic;

},{"babel-runtime/helpers/classCallCheck":20,"babel-runtime/helpers/createClass":21}],6:[function(require,module,exports){
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
/* HOA INTENSITY ANALYZER */
/////////////////////////////////

var HOA_analyser = function () {
    function HOA_analyser(audioCtx, order) {
        (0, _classCallCheck3.default)(this, HOA_analyser);

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

    (0, _createClass3.default)(HOA_analyser, [{
        key: "updateBuffers",
        value: function updateBuffers() {
            // Get latest time-domain data
            for (var i = 0; i < this.nCh; i++) {
                this.analysers[i].getFloatTimeDomainData(this.analBuffers[i]);
            }
        }
    }, {
        key: "computeIntensity",
        value: function computeIntensity() {
            // Compute correlations and energies of channels
            var iCh = new Array(this.nCh).fill(0); // intensity
            var corrCh = new Array(this.nCh).fill(0); // correlation
            var I_norm, E, Psi, azi, elev;
            // Accumulators for correlations and energies
            for (var i = 0; i < this.fftSize; i++) {
                for (var j = 0; j < this.nCh; j++) {

                    if (j == 0) {
                        corrCh[j] += 2 * this.analBuffers[j][i] * this.analBuffers[j][i];
                    } else {
                        corrCh[j] += this.analBuffers[j][i] * this.analBuffers[j][i];
                        iCh[j] += Math.sqrt(2) * this.analBuffers[0][i] * this.analBuffers[j][i];
                    }
                }
            }

            var summedInt = 0;
            var summedCorr = 0;
            for (var _i2 = 0; _i2 < iCh.length; _i2++) {
                if (_i2 != 0) summedInt += iCh[_i2] * iCh[_i2];
                summedCorr += corrCh[_i2];
            }

            // TO UPGRADE: for now the analyser only considers the first 4 channels
            // of the Ambisonic stream
            I_norm = Math.sqrt(summedInt); // intensity magnitude
            E = summedCorr / 2; // energy
            Psi = 1 - I_norm / (E + 10e-8); // diffuseness
            azi = Math.atan2(iCh[1], iCh[3]) * 180 / Math.PI;
            elev = Math.atan2(iCh[2], Math.sqrt(iCh[1] * iCh[1] + iCh[3] * iCh[3])) * 180 / Math.PI;
            var params = [azi, elev, Psi, E];
            return params;
        }
    }]);
    return HOA_analyser;
}();

exports.default = HOA_analyser;

},{"babel-runtime/helpers/classCallCheck":20,"babel-runtime/helpers/createClass":21}],7:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.HOA_fuma2acn = exports.HOA_acn2bf = exports.HOA_bf2acn = undefined;

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
/* B-FORMAT TO ACN/N3D CONVERTER */
///////////////////////////////////

var HOA_bf2acn = exports.HOA_bf2acn = function HOA_bf2acn(audioCtx) {
    (0, _classCallCheck3.default)(this, HOA_bf2acn);


    this.ctx = audioCtx;
    this.in = this.ctx.createChannelSplitter(4);
    this.out = this.ctx.createChannelMerger(4);
    this.gains = [];

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
/* ACN/N3D TO B-FORMAT CONVERTER */
///////////////////////////////////


var HOA_acn2bf = exports.HOA_acn2bf = function HOA_acn2bf(audioCtx) {
    (0, _classCallCheck3.default)(this, HOA_acn2bf);


    this.ctx = audioCtx;
    this.in = this.ctx.createChannelSplitter(4);
    this.out = this.ctx.createChannelMerger(4);
    this.gains = [];

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
/* ACN/N3D TO B-FORMAT CONVERTER */
///////////////////////////////////


var HOA_fuma2acn = exports.HOA_fuma2acn = function HOA_fuma2acn(audioCtx, order) {
    (0, _classCallCheck3.default)(this, HOA_fuma2acn);


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

    // connect inputs/outputs (kept separated for clarity's sake)
    for (var i = 0; i < this.nCh; i++) {
        this.gains[i] = this.ctx.createGain();
        this.in.connect(this.gains[i], this.remapArray[i], 0);
        this.gains[i].connect(this.out, 0, i);
    }
};

},{"babel-runtime/helpers/classCallCheck":20}],8:[function(require,module,exports){
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

//////////////////////////
/* HOA BINAURAL DECODER */
//////////////////////////

var HOA_binDecoder = function () {
    function HOA_binDecoder(audioCtx, order) {
        (0, _classCallCheck3.default)(this, HOA_binDecoder);


        this.initialized = false;

        this.ctx = audioCtx;
        this.order = order;
        this.nCh = (order + 1) * (order + 1);
        this.decFilters = new Array(this.nCh);
        this.decFilterNodes = new Array(this.nCh);
        // input and output nodes
        this.in = this.ctx.createChannelSplitter(this.nCh);
        this.out = this.ctx.createChannelMerger(2);
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

    (0, _createClass3.default)(HOA_binDecoder, [{
        key: "updateFilters",
        value: function updateFilters(audioBuffer) {
            // assign filters to convolvers
            for (var i = 0; i < this.nCh; i++) {
                this.decFilters[i] = this.ctx.createBuffer(1, audioBuffer.length, audioBuffer.sampleRate);
                this.decFilters[i].getChannelData(0).set(audioBuffer.getChannelData(i));

                this.decFilterNodes[i].buffer = this.decFilters[i];
            }
        }
    }, {
        key: "resetFilters",
        value: function resetFilters() {
            // overwrite decoding filters (plain cardioid virtual microphones)
            var cardGains = new Array(this.nCh);
            cardGains.fill(0);
            cardGains[0] = 0.5;
            cardGains[1] = 0.5 / Math.sqrt(3);
            for (var i = 0; i < this.nCh; i++) {
                this.decFilters[i] = this.ctx.createBuffer(1, 1, this.ctx.sampleRate);
                this.decFilters[i].getChannelData(0).set([cardGains[i]]);
                this.decFilterNodes[i].buffer = this.decFilters[i];
            }
        }
    }]);
    return HOA_binDecoder;
}();

exports.default = HOA_binDecoder;

},{"babel-runtime/helpers/classCallCheck":20,"babel-runtime/helpers/createClass":21}],9:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _jshLib = require('./jsh-lib');

var jshlib = _interopRequireWildcard(_jshLib);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var HOA_encoder = function () {
    function HOA_encoder(audioCtx, order) {
        (0, _classCallCheck3.default)(this, HOA_encoder);


        this.initialized = false;

        this.ctx = audioCtx;
        this.order = order;
        this.nCh = (order + 1) * (order + 1);
        this.azi = 0;
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

    (0, _createClass3.default)(HOA_encoder, [{
        key: 'updateGains',
        value: function updateGains() {
            var N = this.order;
            var g_enc = jshlib.computeRealSH(N, [[this.azi * Math.PI / 180, this.elev * Math.PI / 180]]);

            for (var i = 0; i < this.nCh; i++) {
                this.gains[i] = g_enc[i][0];
                this.gainNodes[i].gain.value = this.gains[i];
            }
        }
    }]);
    return HOA_encoder;
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

exports.default = HOA_encoder;

},{"./jsh-lib":15,"babel-runtime/helpers/classCallCheck":20,"babel-runtime/helpers/createClass":21}],10:[function(require,module,exports){
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

var HOA_orderLimiter = function () {
    function HOA_orderLimiter(audioCtx, orderIn, orderOut) {
        (0, _classCallCheck3.default)(this, HOA_orderLimiter);


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

    (0, _createClass3.default)(HOA_orderLimiter, [{
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
    return HOA_orderLimiter;
}();

exports.default = HOA_orderLimiter;

},{"babel-runtime/helpers/classCallCheck":20,"babel-runtime/helpers/createClass":21}],11:[function(require,module,exports){
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

            this.concatBuffer = this.context.createBuffer(nCh, length, srate);
            for (var i = 0; i < nChGroups; i++) {
                for (var j = 0; j < this.buffers[i].numberOfChannels; j++) {
                    this.concatBuffer.getChannelData(i * 8 + j).set(this.buffers[i].getChannelData(j));
                }
            }
        }
    }]);
    return HOAloader;
}();

exports.default = HOAloader;

},{"babel-runtime/helpers/classCallCheck":20,"babel-runtime/helpers/createClass":21}],12:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _jshLib = require('./jsh-lib');

var jshlib = _interopRequireWildcard(_jshLib);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var HOA_rotator = function () {
    function HOA_rotator(audioCtx, order) {
        (0, _classCallCheck3.default)(this, HOA_rotator);


        this.ctx = audioCtx;
        this.order = order;
        this.nCh = (order + 1) * (order + 1);
        this.yaw = 0;
        this.pitch = 0;
        this.roll = 0;
        this.rotMtx = numeric.identity(this.nCh);
        this.rotMtxNodes = new Array(this.order);
        this.in = null;
        this.out = null;

        this.initialized = false;
    }

    (0, _createClass3.default)(HOA_rotator, [{
        key: 'updateRotMtx',
        value: function updateRotMtx() {

            if (!this.initialized) return;

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
    }, {
        key: 'init',
        value: function init() {
            if (this.initialized) return;

            // Input and output nodes
            this.in = this.ctx.createChannelSplitter(this.nCh);
            this.out = this.ctx.createChannelMerger(this.nCh);

            // Initialize rotation gains to identity matrix
            for (var n = 1; n < this.order + 1; n++) {

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
            for (var _n = 1; _n < this.order + 1; _n++) {
                for (var _i = 0; _i < 2 * _n + 1; _i++) {
                    for (var _j = 0; _j < 2 * _n + 1; _j++) {
                        this.in.connect(this.rotMtxNodes[_n - 1][_i][_j], band_idx + _j, 0);
                        this.rotMtxNodes[_n - 1][_i][_j].connect(this.out, 0, band_idx + _i);
                    }
                }
                band_idx = band_idx + 2 * _n + 1;
            }

            this.initialized = true;
        }
    }]);
    return HOA_rotator;
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

exports.default = HOA_rotator;

},{"./jsh-lib":15,"babel-runtime/helpers/classCallCheck":20,"babel-runtime/helpers/createClass":21}],13:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

var _jshLib = require("./jsh-lib");

var jshlib = _interopRequireWildcard(_jshLib);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var HOA_vmic = function () {
    function HOA_vmic(audioCtx, order) {
        (0, _classCallCheck3.default)(this, HOA_vmic);


        this.initialized = false;

        this.ctx = audioCtx;
        this.order = order;
        this.nCh = (order + 1) * (order + 1);
        this.azi = 0;
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

    (0, _createClass3.default)(HOA_vmic, [{
        key: "updatePattern",
        value: function updatePattern() {

            function computeCardioidCoeffs(N) {
                var coeffs = new Array(N + 1);
                for (var n = 0; n < N + 1; n++) {
                    coeffs[n] = Math.sqrt(2 * n + 1) * jshlib.factorial(N) * jshlib.factorial(N + 1) / (jshlib.factorial(N + n + 1) * jshlib.factorial(N - n)) / (N + 1);
                }
                return coeffs;
            }

            function computeHypercardCoeffs(N) {
                var coeffs = new Array(N + 1);
                coeffs.fill(1);
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
                return coeffs;
            }

            switch (this.vmicPattern) {
                case "cardioid":
                    // higher-order cardioid given by: (1/2)^N * ( 1+cos(theta) )^N
                    this.vmicCoeffs = computeCardioidCoeffs(this.order);
                    break;
                case "supercardioid":
                    // maximum front-back energy ratio
                    // TBD
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

            var azi = this.azi * Math.PI / 180;
            var elev = this.elev * Math.PI / 180;

            var tempSH = jshlib.computeRealSH(this.order, [[azi, elev]]);

            for (var i = 1; i < this.nCh; i++) {
                this.SHxyz[i] = tempSH[i][0];
            }

            this.updateGains();
        }
    }, {
        key: "updateGains",
        value: function updateGains() {

            var q;
            for (var n = 0; n < this.order + 1; n++) {
                for (var m = -this.order; m < this.order + 1; m++) {
                    q = n * n + n + m;
                    this.vmicGains[q] = 1 / Math.sqrt(2 * n + 1) * this.vmicCoeffs[n] * this.SHxyz[q];
                }
            }

            for (var i = 1; i < this.nCh; i++) {
                this.vmicGainNodes[i].gain.value = this.vmicGains[i];
            }
        }
    }]);
    return HOA_vmic;
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

exports.default = HOA_vmic;

},{"./jsh-lib":15,"babel-runtime/helpers/classCallCheck":20,"babel-runtime/helpers/createClass":21}],14:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Bformat_analyser = exports.Bformat_binDecoder = exports.Bformat_vmic = exports.Bformat_rotator = exports.Bformat_encoder = exports.hoa_converters = exports.HOAloader = exports.HOA_analyser = exports.HOA_vmic = exports.HOA_binDecoder = exports.HOA_rotator = exports.HOA_orderLimiter = exports.HOA_encoder = exports.jshlib = undefined;

var _hoaEncoder = require('./hoa-encoder');

Object.defineProperty(exports, 'HOA_encoder', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_hoaEncoder).default;
  }
});

var _hoaLimiter = require('./hoa-limiter');

Object.defineProperty(exports, 'HOA_orderLimiter', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_hoaLimiter).default;
  }
});

var _hoaRotator = require('./hoa-rotator');

Object.defineProperty(exports, 'HOA_rotator', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_hoaRotator).default;
  }
});

var _hoaDecoderBin = require('./hoa-decoderBin');

Object.defineProperty(exports, 'HOA_binDecoder', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_hoaDecoderBin).default;
  }
});

var _hoaVirtualMic = require('./hoa-virtualMic');

Object.defineProperty(exports, 'HOA_vmic', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_hoaVirtualMic).default;
  }
});

var _hoaAnalyser = require('./hoa-analyser');

Object.defineProperty(exports, 'HOA_analyser', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_hoaAnalyser).default;
  }
});

var _hoaLoader = require('./hoa-loader');

Object.defineProperty(exports, 'HOAloader', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_hoaLoader).default;
  }
});

var _foaEncoder = require('./foa-encoder');

Object.defineProperty(exports, 'Bformat_encoder', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_foaEncoder).default;
  }
});

var _foaRotator = require('./foa-rotator');

Object.defineProperty(exports, 'Bformat_rotator', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_foaRotator).default;
  }
});

var _foaVirtualMic = require('./foa-virtualMic');

Object.defineProperty(exports, 'Bformat_vmic', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_foaVirtualMic).default;
  }
});

var _foaDecoderBin = require('./foa-decoderBin');

Object.defineProperty(exports, 'Bformat_binDecoder', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_foaDecoderBin).default;
  }
});

var _foaAnalyser = require('./foa-analyser');

Object.defineProperty(exports, 'Bformat_analyser', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_foaAnalyser).default;
  }
});

var _jshLib = require('./jsh-lib');

var _jshlib = _interopRequireWildcard(_jshLib);

var _hoaConverters = require('./hoa-converters');

var _hoa_converters = _interopRequireWildcard(_hoaConverters);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var jshlib = exports.jshlib = _jshlib;

// expose for plugins
var hoa_converters = exports.hoa_converters = _hoa_converters;

},{"./foa-analyser":1,"./foa-decoderBin":2,"./foa-encoder":3,"./foa-rotator":4,"./foa-virtualMic":5,"./hoa-analyser":6,"./hoa-converters":7,"./hoa-decoderBin":8,"./hoa-encoder":9,"./hoa-limiter":10,"./hoa-loader":11,"./hoa-rotator":12,"./hoa-virtualMic":13,"./jsh-lib":15}],15:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.forwardSHT = forwardSHT;
exports.inverseSHT = inverseSHT;
exports.print2Darray = print2Darray;
exports.convertCart2Sph = convertCart2Sph;
exports.convertSph2Cart = convertSph2Cart;
exports.computeRealSH = computeRealSH;
exports.factorial = factorial;
exports.recurseLegendrePoly = recurseLegendrePoly;
exports.pinv_svd = pinv_svd;
exports.pinv_direct = pinv_direct;
exports.getSHrotMtx = getSHrotMtx;
exports.U = U;
exports.V = V;
exports.W = W;
exports.P = P;
exports.yawPitchRoll2Rzyx = yawPitchRoll2Rzyx;

var _numeric = require("./numeric-1.2.6.min");

var numeric = _interopRequireWildcard(_numeric);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

// forwardSHT implements the forward SHT on data defined over the sphere
function forwardSHT(N, data, CART_OR_SPH, DIRECT_OR_PINV) {

    var Ndirs = data.length,
        Nsh = (N + 1) * (N + 1);
    var invY_N;
    var mag = [,];
    if (Nsh > Ndirs) {
        console.log("The SHT degree is too high for the number of data points");
    }

    // Convert cartesian to spherical if needed
    if (CART_OR_SPH == 0) data = convertCart2Sph(data);
    for (var i = 0; i < data.length; i++) {
        mag[i] = data[i][0];
    }
    // SH sampling matrix
    Y_N = computeRealSH(N, data);
    // Direct SHT
    if (DIRECT_OR_PINV == 0) {
        invY_N = numeric.mul(1 / Ndirs, Y_N);
    } else {
        invY_N = pinv_direct(numeric.transpose(Y_N));
    }
    // Perform SHT
    var coeffs = numeric.dotMV(invY_N, mag);
    return coeffs;
}

// inverseSHT implements the inverse SHT from SH coefficients
////////////////////////////////////////////////////////////////////
//  Archontis Politis
//  archontis.politis@aalto.fi
////////////////////////////////////////////////////////////////////
//
//  JSHlib a JavaScript library that implements
//  the spherical harmonic transform for real spherical harmonics
//  and some useful transformations in the spherical harmonic domain
//
//  The library uses the numeric.js library for matrix operations
//  http://www.numericjs.com/
//
////////////////////////////////////////////////////////////////////

function inverseSHT(coeffs, aziElev) {

    var aziElevR = aziElev;
    var N = Math.sqrt(coeffs.length) - 1;
    // SH sampling matrix
    var Y_N = computeRealSH(N, aziElev);
    // reconstruction
    var data = numeric.dotVM(coeffs, Y_N);
    // gather in data matrix
    for (var i = 0; i < aziElev.length; i++) {
        aziElevR[i][2] = data[i];
    }
    return aziElevR;
}

// xxxxxxxxxxxxxxxxxx
function print2Darray(array2D) {
    for (var q = 0; q < array2D.length; q++) {
        console.log(array2D[q]);
    }
}

// convertCart2Sph converts arrays of cartesian vectors to spherical coordinates
function convertCart2Sph(xyz, OMIT_MAG) {

    var azi, elev, r;
    var aziElevR = new Array(xyz.length);

    for (var i = 0; i < xyz.length; i++) {
        azi = Math.atan2(xyz[i][1], xyz[i][0]);
        elev = Math.atan2(xyz[i][2], Math.sqrt(xyz[i][0] * xyz[i][0] + xyz[i][1] * xyz[i][1]));
        if (OMIT_MAG == 1) {
            aziElevR[i] = [azi, elev];
        } else {
            r = Math.sqrt(xyz[i][0] * xyz[i][0] + xyz[i][1] * xyz[i][1] + xyz[i][2] * xyz[i][2]);
            aziElevR[i] = [azi, elev, r];
        }
    }
    return aziElevR;
}

// convertSph2Cart converts arrays of spherical coordinates to cartesian
function convertSph2Cart(aziElevR) {

    var x, y, z;
    var xyz = new Array(aziElevR.length);

    for (var i = 0; i < aziElevR.length; i++) {
        x = Math.cos(aziElevR[i][0]) * Math.cos(aziElevR[i][1]);
        y = Math.sin(aziElevR[i][0]) * Math.cos(aziElevR[i][1]);
        z = Math.sin(aziElevR[i][1]);
        if (aziElevR[0].length == 2) xyz[i] = [x, y, z];else if (aziElevR[0].length == 3) xyz[i] = [aziElevR[i][2] * x, aziElevR[i][2] * y, aziElevR[i][2] * z];
    }
    return xyz;
}

// computeRealSH computes real spherical harmonics up to order N
function computeRealSH(N, data) {

    var azi = new Array(data.length);
    var elev = new Array(data.length);

    for (var i = 0; i < data.length; i++) {
        azi[i] = data[i][0];
        elev[i] = data[i][1];
    }

    var factorials = new Array(2 * N + 1);
    var Ndirs = azi.length;
    var Nsh = (N + 1) * (N + 1);
    var leg_n_minus1 = 0;
    var leg_n_minus2 = 0;
    var leg_n;
    var sinel = numeric.sin(elev);
    var index_n = 0;
    var Y_N = new Array(Nsh);
    var Nn0, Nnm;
    var cosmazi, sinmazi;

    // precompute factorials
    for (var i = 0; i < 2 * N + 1; i++) {
        factorials[i] = factorial(i);
    }for (var n = 0; n < N + 1; n++) {
        if (n == 0) {
            var temp0 = new Array(azi.length);
            temp0.fill(1);
            Y_N[n] = temp0;
            index_n = 1;
        } else {
            leg_n = recurseLegendrePoly(n, sinel, leg_n_minus1, leg_n_minus2);
            Nn0 = Math.sqrt(2 * n + 1);
            for (var m = 0; m < n + 1; m++) {
                if (m == 0) Y_N[index_n + n] = numeric.mul(Nn0, leg_n[m]);else {
                    Nnm = Nn0 * Math.sqrt(2 * factorials[n - m] / factorials[n + m]);
                    cosmazi = numeric.cos(numeric.mul(m, azi));
                    sinmazi = numeric.sin(numeric.mul(m, azi));
                    Y_N[index_n + n - m] = numeric.mul(Nnm, numeric.mul(leg_n[m], sinmazi));
                    Y_N[index_n + n + m] = numeric.mul(Nnm, numeric.mul(leg_n[m], cosmazi));
                }
            }
            index_n = index_n + 2 * n + 1;
        }
        leg_n_minus2 = leg_n_minus1;
        leg_n_minus1 = leg_n;
    }

    return Y_N;
}

// factorial compute factorial
function factorial(n) {
    if (n === 0) return 1;
    return n * factorial(n - 1);
}

// recurseLegendrePoly computes associated Legendre functions recursively
function recurseLegendrePoly(n, x, Pnm_minus1, Pnm_minus2) {

    var Pnm = new Array(n + 1);
    switch (n) {
        case 1:
            var x2 = numeric.mul(x, x);
            var P10 = x;
            var P11 = numeric.sqrt(numeric.sub(1, x2));
            Pnm[0] = P10;
            Pnm[1] = P11;
            break;
        case 2:
            var x2 = numeric.mul(x, x);
            var P20 = numeric.mul(3, x2);
            P20 = numeric.sub(P20, 1);
            P20 = numeric.div(P20, 2);
            var P21 = numeric.sub(1, x2);
            P21 = numeric.sqrt(P21);
            P21 = numeric.mul(3, P21);
            P21 = numeric.mul(P21, x);
            var P22 = numeric.sub(1, x2);
            P22 = numeric.mul(3, P22);
            Pnm[0] = P20;
            Pnm[1] = P21;
            Pnm[2] = P22;
            break;
        default:
            var x2 = numeric.mul(x, x);
            var one_min_x2 = numeric.sub(1, x2);
            // last term m=n
            var k = 2 * n - 1;
            var dfact_k = 1;
            if (k % 2 == 0) {
                for (var kk = 1; kk < k / 2 + 1; kk++) {
                    dfact_k = dfact_k * 2 * kk;
                }
            } else {
                for (var kk = 1; kk < (k + 1) / 2 + 1; kk++) {
                    dfact_k = dfact_k * (2 * kk - 1);
                }
            }
            Pnm[n] = numeric.mul(dfact_k, numeric.pow(one_min_x2, n / 2));
            // before last term
            Pnm[n - 1] = numeric.mul(2 * n - 1, numeric.mul(x, Pnm_minus1[n - 1])); // P_{n(n-1)} = (2*n-1)*x*P_{(n-1)(n-1)}
            // three term recursence for the rest
            for (var m = 0; m < n - 1; m++) {
                var temp1 = numeric.mul(2 * n - 1, numeric.mul(x, Pnm_minus1[m]));
                var temp2 = numeric.mul(n + m - 1, Pnm_minus2[m]);
                Pnm[m] = numeric.div(numeric.sub(temp1, temp2), n - m); // P_l = ( (2l-1)xP_(l-1) - (l+m-1)P_(l-2) )/(l-m)
            }
    }
    return Pnm;
}

// pinv_svd computes the pseudo-inverse using SVD
function pinv_svd(A) {
    var z = numeric.svd(A),
        foo = z.S[0];
    var U = z.U,
        S = z.S,
        V = z.V;
    var m = A.length,
        n = A[0].length,
        tol = Math.max(m, n) * numeric.epsilon * foo,
        M = S.length;
    var Sinv = new Array(M);
    for (var i = M - 1; i !== -1; i--) {
        if (S[i] > tol) Sinv[i] = 1 / S[i];else Sinv[i] = 0;
    }
    return numeric.dot(numeric.dot(V, numeric.diag(Sinv)), numeric.transpose(U));
}

// pinv_svd computes the left pseudo-inverse
function pinv_direct(A) {
    var AT = numeric.transpose(A);
    return numeric.dot(numeric.inv(numeric.dot(AT, A)), AT);
}

// computes rotation matrices for real spherical harmonics
function getSHrotMtx(Rxyz, L) {

    var Nsh = (L + 1) * (L + 1);
    // allocate total rotation matrix
    var R = numeric.rep([Nsh, Nsh], 0);

    // initialize zeroth and first band rotation matrices for recursion
    // Rxyz = [Rxx Rxy Rxz
    //         Ryx Ryy Ryz
    //         Rzx Rzy Rzz]
    //
    // zeroth-band (l=0) is invariant to rotation
    R[0][0] = 1;

    // the first band (l=1) is directly related to the rotation matrix
    var R_1 = numeric.rep([3, 3], 0);
    R_1[0][0] = Rxyz[1][1];
    R_1[0][1] = Rxyz[1][2];
    R_1[0][2] = Rxyz[1][0];
    R_1[1][0] = Rxyz[2][1];
    R_1[1][1] = Rxyz[2][2];
    R_1[1][2] = Rxyz[2][0];
    R_1[2][0] = Rxyz[0][1];
    R_1[2][1] = Rxyz[0][2];
    R_1[2][2] = Rxyz[0][0];

    R = numeric.setBlock(R, [1, 1], [3, 3], R_1);
    var R_lm1 = R_1;

    // compute rotation matrix of each subsequent band recursively
    var band_idx = 3;
    for (var l = 2; l < L + 1; l++) {

        var R_l = numeric.rep([2 * l + 1, 2 * l + 1], 0);
        for (var m = -l; m < l + 1; m++) {
            for (var n = -l; n < l + 1; n++) {
                // compute u,v,w terms of Eq.8.1 (Table I)
                var d, denom, u, v, w;
                if (m == 0) d = 1;else d = 0; // the delta function d_m0
                if (Math.abs(n) == l) denom = 2 * l * (2 * l - 1);else denom = l * l - n * n;

                u = Math.sqrt((l * l - m * m) / denom);
                v = Math.sqrt((1 + d) * (l + Math.abs(m) - 1) * (l + Math.abs(m)) / denom) * (1 - 2 * d) * 0.5;
                w = Math.sqrt((l - Math.abs(m) - 1) * (l - Math.abs(m)) / denom) * (1 - d) * -0.5;

                // computes Eq.8.1
                if (u != 0) u = u * U(l, m, n, R_1, R_lm1);
                if (v != 0) v = v * V(l, m, n, R_1, R_lm1);
                if (w != 0) w = w * W(l, m, n, R_1, R_lm1);
                R_l[m + l][n + l] = u + v + w;
            }
        }
        R = numeric.setBlock(R, [band_idx + 1, band_idx + 1], [band_idx + 2 * l + 1, band_idx + 2 * l + 1], R_l);
        R_lm1 = R_l;
        band_idx = band_idx + 2 * l + 1;
    }
    return R;
}

// functions to compute terms U, V, W of Eq.8.1 (Table II)
function U(l, m, n, R_1, R_lm1) {

    return P(0, l, m, n, R_1, R_lm1);
}

function V(l, m, n, R_1, R_lm1) {

    var p0, p1, ret, d;
    if (m == 0) {
        p0 = P(1, l, 1, n, R_1, R_lm1);
        p1 = P(-1, l, -1, n, R_1, R_lm1);
        ret = p0 + p1;
    } else if (m > 0) {
        if (m == 1) d = 1;else d = 0;
        p0 = P(1, l, m - 1, n, R_1, R_lm1);
        p1 = P(-1, l, -m + 1, n, R_1, R_lm1);
        ret = p0 * Math.sqrt(1 + d) - p1 * (1 - d);
    } else {
        if (m == -1) d = 1;else d = 0;
        p0 = P(1, l, m + 1, n, R_1, R_lm1);
        p1 = P(-1, l, -m - 1, n, R_1, R_lm1);
        ret = p0 * (1 - d) + p1 * Math.sqrt(1 + d);
    }
    return ret;
}

function W(l, m, n, R_1, R_lm1) {

    var p0, p1, ret;
    if (m == 0) {
        console.error("should not be called");
    } else {
        if (m > 0) {
            p0 = P(1, l, m + 1, n, R_1, R_lm1);
            p1 = P(-1, l, -m - 1, n, R_1, R_lm1);
            ret = p0 + p1;
        } else {
            p0 = P(1, l, m - 1, n, R_1, R_lm1);
            p1 = P(-1, l, -m + 1, n, R_1, R_lm1);
            ret = p0 - p1;
        }
    }
    return ret;
}

// function to compute term P of U,V,W (Table II)
function P(i, l, a, b, R_1, R_lm1) {

    var ri1, rim1, ri0, ret;
    ri1 = R_1[i + 1][1 + 1];
    rim1 = R_1[i + 1][-1 + 1];
    ri0 = R_1[i + 1][0 + 1];

    if (b == -l) {
        ret = ri1 * R_lm1[a + l - 1][0] + rim1 * R_lm1[a + l - 1][2 * l - 2];
    } else {
        if (b == l) ret = ri1 * R_lm1[a + l - 1][2 * l - 2] - rim1 * R_lm1[a + l - 1][0];else ret = ri0 * R_lm1[a + l - 1][b + l - 1];
    }
    return ret;
}

// yawPitchRoll2Rzyx computes the rotation matrix from ZY'X'' rotation angles
function yawPitchRoll2Rzyx(yaw, pitch, roll) {

    var Rx = void 0,
        Ry = void 0,
        Rz = void 0;
    if (roll == 0) Rx = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];else Rx = [[1, 0, 0], [0, Math.cos(roll), Math.sin(roll)], [0, -Math.sin(roll), Math.cos(roll)]];
    if (pitch == 0) Ry = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];else Ry = [[Math.cos(pitch), 0, -Math.sin(pitch)], [0, 1, 0], [Math.sin(pitch), 0, Math.cos(pitch)]];
    if (yaw == 0) Rz = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];else Rz = [[Math.cos(yaw), Math.sin(yaw), 0], [-Math.sin(yaw), Math.cos(yaw), 0], [0, 0, 1]];

    var R = numeric.dotMMsmall(Ry, Rz);
    R = numeric.dotMMsmall(Rx, R);
    return R;
}

},{"./numeric-1.2.6.min":16}],16:[function(require,module,exports){
(function (global){
"use strict";

var _typeof2 = require("babel-runtime/helpers/typeof");

var _typeof3 = _interopRequireDefault(_typeof2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var numeric = typeof exports == "undefined" ? function () {} : exports;typeof global != "undefined" && (global.numeric = numeric), numeric.version = "1.2.6", numeric.bench = function (t, n) {
  var r, i, s, o;typeof n == "undefined" && (n = 15), s = .5, r = new Date();for (;;) {
    s *= 2;for (o = s; o > 3; o -= 4) {
      t(), t(), t(), t();
    }while (o > 0) {
      t(), o--;
    }i = new Date();if (i - r > n) break;
  }for (o = s; o > 3; o -= 4) {
    t(), t(), t(), t();
  }while (o > 0) {
    t(), o--;
  }return i = new Date(), 1e3 * (3 * s - 1) / (i - r);
}, numeric._myIndexOf = function (t) {
  var n = this.length,
      r;for (r = 0; r < n; ++r) {
    if (this[r] === t) return r;
  }return -1;
}, numeric.myIndexOf = Array.prototype.indexOf ? Array.prototype.indexOf : numeric._myIndexOf, numeric.Function = Function, numeric.precision = 4, numeric.largeArray = 50, numeric.prettyPrint = function (t) {
  function n(e) {
    if (e === 0) return "0";if (isNaN(e)) return "NaN";if (e < 0) return "-" + n(-e);if (isFinite(e)) {
      var t = Math.floor(Math.log(e) / Math.log(10)),
          r = e / Math.pow(10, t),
          i = r.toPrecision(numeric.precision);return parseFloat(i) === 10 && (t++, r = 1, i = r.toPrecision(numeric.precision)), parseFloat(i).toString() + "e" + t.toString();
    }return "Infinity";
  }function i(e) {
    var t;if (typeof e == "undefined") return r.push(Array(numeric.precision + 8).join(" ")), !1;if (typeof e == "string") return r.push('"' + e + '"'), !1;if (typeof e == "boolean") return r.push(e.toString()), !1;if (typeof e == "number") {
      var s = n(e),
          o = e.toPrecision(numeric.precision),
          u = parseFloat(e.toString()).toString(),
          a = [s, o, u, parseFloat(o).toString(), parseFloat(u).toString()];for (t = 1; t < a.length; t++) {
        a[t].length < s.length && (s = a[t]);
      }return r.push(Array(numeric.precision + 8 - s.length).join(" ") + s), !1;
    }if (e === null) return r.push("null"), !1;if (typeof e == "function") {
      r.push(e.toString());var f = !1;for (t in e) {
        e.hasOwnProperty(t) && (f ? r.push(",\n") : r.push("\n{"), f = !0, r.push(t), r.push(": \n"), i(e[t]));
      }return f && r.push("}\n"), !0;
    }if (e instanceof Array) {
      if (e.length > numeric.largeArray) return r.push("...Large Array..."), !0;var f = !1;r.push("[");for (t = 0; t < e.length; t++) {
        t > 0 && (r.push(","), f && r.push("\n ")), f = i(e[t]);
      }return r.push("]"), !0;
    }r.push("{");var f = !1;for (t in e) {
      e.hasOwnProperty(t) && (f && r.push(",\n"), f = !0, r.push(t), r.push(": \n"), i(e[t]));
    }return r.push("}"), !0;
  }var r = [];return i(t), r.join("");
}, numeric.parseDate = function (t) {
  function n(e) {
    if (typeof e == "string") return Date.parse(e.replace(/-/g, "/"));if (e instanceof Array) {
      var t = [],
          r;for (r = 0; r < e.length; r++) {
        t[r] = n(e[r]);
      }return t;
    }throw new Error("parseDate: parameter must be arrays of strings");
  }return n(t);
}, numeric.parseFloat = function (t) {
  function n(e) {
    if (typeof e == "string") return parseFloat(e);if (e instanceof Array) {
      var t = [],
          r;for (r = 0; r < e.length; r++) {
        t[r] = n(e[r]);
      }return t;
    }throw new Error("parseFloat: parameter must be arrays of strings");
  }return n(t);
}, numeric.parseCSV = function (t) {
  var n = t.split("\n"),
      r,
      i,
      s = [],
      o = /(([^'",]*)|('[^']*')|("[^"]*")),/g,
      u = /^\s*(([+-]?[0-9]+(\.[0-9]*)?(e[+-]?[0-9]+)?)|([+-]?[0-9]*(\.[0-9]+)?(e[+-]?[0-9]+)?))\s*$/,
      a = function a(e) {
    return e.substr(0, e.length - 1);
  },
      f = 0;for (i = 0; i < n.length; i++) {
    var l = (n[i] + ",").match(o),
        c;if (l.length > 0) {
      s[f] = [];for (r = 0; r < l.length; r++) {
        c = a(l[r]), u.test(c) ? s[f][r] = parseFloat(c) : s[f][r] = c;
      }f++;
    }
  }return s;
}, numeric.toCSV = function (t) {
  var n = numeric.dim(t),
      r,
      i,
      s,
      o,
      u,
      a;s = n[0], o = n[1], a = [];for (r = 0; r < s; r++) {
    u = [];for (i = 0; i < s; i++) {
      u[i] = t[r][i].toString();
    }a[r] = u.join(", ");
  }return a.join("\n") + "\n";
}, numeric.getURL = function (t) {
  var n = new XMLHttpRequest();return n.open("GET", t, !1), n.send(), n;
}, numeric.imageURL = function (t) {
  function n(e) {
    var t = e.length,
        n,
        r,
        i,
        s,
        o,
        u,
        a,
        f,
        l = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
        c = "";for (n = 0; n < t; n += 3) {
      r = e[n], i = e[n + 1], s = e[n + 2], o = r >> 2, u = ((r & 3) << 4) + (i >> 4), a = ((i & 15) << 2) + (s >> 6), f = s & 63, n + 1 >= t ? a = f = 64 : n + 2 >= t && (f = 64), c += l.charAt(o) + l.charAt(u) + l.charAt(a) + l.charAt(f);
    }return c;
  }function r(e, t, n) {
    typeof t == "undefined" && (t = 0), typeof n == "undefined" && (n = e.length);var r = [0, 1996959894, 3993919788, 2567524794, 124634137, 1886057615, 3915621685, 2657392035, 249268274, 2044508324, 3772115230, 2547177864, 162941995, 2125561021, 3887607047, 2428444049, 498536548, 1789927666, 4089016648, 2227061214, 450548861, 1843258603, 4107580753, 2211677639, 325883990, 1684777152, 4251122042, 2321926636, 335633487, 1661365465, 4195302755, 2366115317, 997073096, 1281953886, 3579855332, 2724688242, 1006888145, 1258607687, 3524101629, 2768942443, 901097722, 1119000684, 3686517206, 2898065728, 853044451, 1172266101, 3705015759, 2882616665, 651767980, 1373503546, 3369554304, 3218104598, 565507253, 1454621731, 3485111705, 3099436303, 671266974, 1594198024, 3322730930, 2970347812, 795835527, 1483230225, 3244367275, 3060149565, 1994146192, 31158534, 2563907772, 4023717930, 1907459465, 112637215, 2680153253, 3904427059, 2013776290, 251722036, 2517215374, 3775830040, 2137656763, 141376813, 2439277719, 3865271297, 1802195444, 476864866, 2238001368, 4066508878, 1812370925, 453092731, 2181625025, 4111451223, 1706088902, 314042704, 2344532202, 4240017532, 1658658271, 366619977, 2362670323, 4224994405, 1303535960, 984961486, 2747007092, 3569037538, 1256170817, 1037604311, 2765210733, 3554079995, 1131014506, 879679996, 2909243462, 3663771856, 1141124467, 855842277, 2852801631, 3708648649, 1342533948, 654459306, 3188396048, 3373015174, 1466479909, 544179635, 3110523913, 3462522015, 1591671054, 702138776, 2966460450, 3352799412, 1504918807, 783551873, 3082640443, 3233442989, 3988292384, 2596254646, 62317068, 1957810842, 3939845945, 2647816111, 81470997, 1943803523, 3814918930, 2489596804, 225274430, 2053790376, 3826175755, 2466906013, 167816743, 2097651377, 4027552580, 2265490386, 503444072, 1762050814, 4150417245, 2154129355, 426522225, 1852507879, 4275313526, 2312317920, 282753626, 1742555852, 4189708143, 2394877945, 397917763, 1622183637, 3604390888, 2714866558, 953729732, 1340076626, 3518719985, 2797360999, 1068828381, 1219638859, 3624741850, 2936675148, 906185462, 1090812512, 3747672003, 2825379669, 829329135, 1181335161, 3412177804, 3160834842, 628085408, 1382605366, 3423369109, 3138078467, 570562233, 1426400815, 3317316542, 2998733608, 733239954, 1555261956, 3268935591, 3050360625, 752459403, 1541320221, 2607071920, 3965973030, 1969922972, 40735498, 2617837225, 3943577151, 1913087877, 83908371, 2512341634, 3803740692, 2075208622, 213261112, 2463272603, 3855990285, 2094854071, 198958881, 2262029012, 4057260610, 1759359992, 534414190, 2176718541, 4139329115, 1873836001, 414664567, 2282248934, 4279200368, 1711684554, 285281116, 2405801727, 4167216745, 1634467795, 376229701, 2685067896, 3608007406, 1308918612, 956543938, 2808555105, 3495958263, 1231636301, 1047427035, 2932959818, 3654703836, 1088359270, 936918e3, 2847714899, 3736837829, 1202900863, 817233897, 3183342108, 3401237130, 1404277552, 615818150, 3134207493, 3453421203, 1423857449, 601450431, 3009837614, 3294710456, 1567103746, 711928724, 3020668471, 3272380065, 1510334235, 755167117],
        i = -1,
        s = 0,
        o = e.length,
        u;for (u = t; u < n; u++) {
      s = (i ^ e[u]) & 255, i = i >>> 8 ^ r[s];
    }return i ^ -1;
  }var i = t[0].length,
      s = t[0][0].length,
      o,
      u,
      a,
      f,
      l,
      c,
      h,
      p,
      d,
      v,
      m,
      g = [137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, s >> 24 & 255, s >> 16 & 255, s >> 8 & 255, s & 255, i >> 24 & 255, i >> 16 & 255, i >> 8 & 255, i & 255, 8, 2, 0, 0, 0, -1, -2, -3, -4, -5, -6, -7, -8, 73, 68, 65, 84, 8, 29];m = r(g, 12, 29), g[29] = m >> 24 & 255, g[30] = m >> 16 & 255, g[31] = m >> 8 & 255, g[32] = m & 255, o = 1, u = 0;for (p = 0; p < i; p++) {
    p < i - 1 ? g.push(0) : g.push(1), c = 3 * s + 1 + (p === 0) & 255, h = 3 * s + 1 + (p === 0) >> 8 & 255, g.push(c), g.push(h), g.push(~c & 255), g.push(~h & 255), p === 0 && g.push(0);for (d = 0; d < s; d++) {
      for (f = 0; f < 3; f++) {
        c = t[f][p][d], c > 255 ? c = 255 : c < 0 ? c = 0 : c = Math.round(c), o = (o + c) % 65521, u = (u + o) % 65521, g.push(c);
      }
    }g.push(0);
  }return v = (u << 16) + o, g.push(v >> 24 & 255), g.push(v >> 16 & 255), g.push(v >> 8 & 255), g.push(v & 255), l = g.length - 41, g[33] = l >> 24 & 255, g[34] = l >> 16 & 255, g[35] = l >> 8 & 255, g[36] = l & 255, m = r(g, 37), g.push(m >> 24 & 255), g.push(m >> 16 & 255), g.push(m >> 8 & 255), g.push(m & 255), g.push(0), g.push(0), g.push(0), g.push(0), g.push(73), g.push(69), g.push(78), g.push(68), g.push(174), g.push(66), g.push(96), g.push(130), "data:image/png;base64," + n(g);
}, numeric._dim = function (t) {
  var n = [];while ((typeof t === "undefined" ? "undefined" : (0, _typeof3.default)(t)) == "object") {
    n.push(t.length), t = t[0];
  }return n;
}, numeric.dim = function (t) {
  var n, r;if ((typeof t === "undefined" ? "undefined" : (0, _typeof3.default)(t)) == "object") return n = t[0], (typeof n === "undefined" ? "undefined" : (0, _typeof3.default)(n)) == "object" ? (r = n[0], (typeof r === "undefined" ? "undefined" : (0, _typeof3.default)(r)) == "object" ? numeric._dim(t) : [t.length, n.length]) : [t.length];return [];
}, numeric.mapreduce = function (t, n) {
  return Function("x", "accum", "_s", "_k", 'if(typeof accum === "undefined") accum = ' + n + ";\n" + 'if(typeof x === "number") { var xi = x; ' + t + "; return accum; }\n" + 'if(typeof _s === "undefined") _s = numeric.dim(x);\n' + 'if(typeof _k === "undefined") _k = 0;\n' + "var _n = _s[_k];\n" + "var i,xi;\n" + "if(_k < _s.length-1) {\n" + "    for(i=_n-1;i>=0;i--) {\n" + "        accum = arguments.callee(x[i],accum,_s,_k+1);\n" + "    }" + "    return accum;\n" + "}\n" + "for(i=_n-1;i>=1;i-=2) { \n" + "    xi = x[i];\n" + "    " + t + ";\n" + "    xi = x[i-1];\n" + "    " + t + ";\n" + "}\n" + "if(i === 0) {\n" + "    xi = x[i];\n" + "    " + t + "\n" + "}\n" + "return accum;");
}, numeric.mapreduce2 = function (t, n) {
  return Function("x", "var n = x.length;\nvar i,xi;\n" + n + ";\n" + "for(i=n-1;i!==-1;--i) { \n" + "    xi = x[i];\n" + "    " + t + ";\n" + "}\n" + "return accum;");
}, numeric.same = function same(e, t) {
  var n, r;if (e instanceof Array && t instanceof Array) {
    r = e.length;if (r !== t.length) return !1;for (n = 0; n < r; n++) {
      if (e[n] === t[n]) continue;if ((0, _typeof3.default)(e[n]) != "object") return !1;if (!same(e[n], t[n])) return !1;
    }return !0;
  }return !1;
}, numeric.rep = function (t, n, r) {
  typeof r == "undefined" && (r = 0);var i = t[r],
      s = Array(i),
      o;if (r === t.length - 1) {
    for (o = i - 2; o >= 0; o -= 2) {
      s[o + 1] = n, s[o] = n;
    }return o === -1 && (s[0] = n), s;
  }for (o = i - 1; o >= 0; o--) {
    s[o] = numeric.rep(t, n, r + 1);
  }return s;
}, numeric.dotMMsmall = function (t, n) {
  var r, i, s, o, u, a, f, l, c, h, p, d, v, m;o = t.length, u = n.length, a = n[0].length, f = Array(o);for (r = o - 1; r >= 0; r--) {
    l = Array(a), c = t[r];for (s = a - 1; s >= 0; s--) {
      h = c[u - 1] * n[u - 1][s];for (i = u - 2; i >= 1; i -= 2) {
        p = i - 1, h += c[i] * n[i][s] + c[p] * n[p][s];
      }i === 0 && (h += c[0] * n[0][s]), l[s] = h;
    }f[r] = l;
  }return f;
}, numeric._getCol = function (t, n, r) {
  var i = t.length,
      s;for (s = i - 1; s > 0; --s) {
    r[s] = t[s][n], --s, r[s] = t[s][n];
  }s === 0 && (r[0] = t[0][n]);
}, numeric.dotMMbig = function (t, n) {
  var r = numeric._getCol,
      i = n.length,
      s = Array(i),
      o = t.length,
      u = n[0].length,
      a = new Array(o),
      f,
      l = numeric.dotVV,
      c,
      h,
      p,
      d;--i, --o;for (c = o; c !== -1; --c) {
    a[c] = Array(u);
  }--u;for (c = u; c !== -1; --c) {
    r(n, c, s);for (h = o; h !== -1; --h) {
      d = 0, f = t[h], a[h][c] = l(f, s);
    }
  }return a;
}, numeric.dotMV = function (t, n) {
  var r = t.length,
      i = n.length,
      s,
      o = Array(r),
      u = numeric.dotVV;for (s = r - 1; s >= 0; s--) {
    o[s] = u(t[s], n);
  }return o;
}, numeric.dotVM = function (t, n) {
  var r, i, s, o, u, a, f, l, c, h, p, d, v, m, g, y, b, w, E;o = t.length, u = n[0].length, f = Array(u);for (s = u - 1; s >= 0; s--) {
    h = t[o - 1] * n[o - 1][s];for (i = o - 2; i >= 1; i -= 2) {
      p = i - 1, h += t[i] * n[i][s] + t[p] * n[p][s];
    }i === 0 && (h += t[0] * n[0][s]), f[s] = h;
  }return f;
}, numeric.dotVV = function (t, n) {
  var r,
      i = t.length,
      s,
      o = t[i - 1] * n[i - 1];for (r = i - 2; r >= 1; r -= 2) {
    s = r - 1, o += t[r] * n[r] + t[s] * n[s];
  }return r === 0 && (o += t[0] * n[0]), o;
}, numeric.dot = function (t, n) {
  var r = numeric.dim;switch (r(t).length * 1e3 + r(n).length) {case 2002:
      return n.length < 10 ? numeric.dotMMsmall(t, n) : numeric.dotMMbig(t, n);case 2001:
      return numeric.dotMV(t, n);case 1002:
      return numeric.dotVM(t, n);case 1001:
      return numeric.dotVV(t, n);case 1e3:
      return numeric.mulVS(t, n);case 1:
      return numeric.mulSV(t, n);case 0:
      return t * n;default:
      throw new Error("numeric.dot only works on vectors and matrices");}
}, numeric.diag = function (t) {
  var n,
      r,
      i,
      s = t.length,
      o = Array(s),
      u;for (n = s - 1; n >= 0; n--) {
    u = Array(s), r = n + 2;for (i = s - 1; i >= r; i -= 2) {
      u[i] = 0, u[i - 1] = 0;
    }i > n && (u[i] = 0), u[n] = t[n];for (i = n - 1; i >= 1; i -= 2) {
      u[i] = 0, u[i - 1] = 0;
    }i === 0 && (u[0] = 0), o[n] = u;
  }return o;
}, numeric.getDiag = function (e) {
  var t = Math.min(e.length, e[0].length),
      n,
      r = Array(t);for (n = t - 1; n >= 1; --n) {
    r[n] = e[n][n], --n, r[n] = e[n][n];
  }return n === 0 && (r[0] = e[0][0]), r;
}, numeric.identity = function (t) {
  return numeric.diag(numeric.rep([t], 1));
}, numeric.pointwise = function (t, n, r) {
  typeof r == "undefined" && (r = "");var i = [],
      s,
      o = /\[i\]$/,
      u,
      a = "",
      f = !1;for (s = 0; s < t.length; s++) {
    o.test(t[s]) ? (u = t[s].substring(0, t[s].length - 3), a = u) : u = t[s], u === "ret" && (f = !0), i.push(u);
  }return i[t.length] = "_s", i[t.length + 1] = "_k", i[t.length + 2] = 'if(typeof _s === "undefined") _s = numeric.dim(' + a + ");\n" + 'if(typeof _k === "undefined") _k = 0;\n' + "var _n = _s[_k];\n" + "var i" + (f ? "" : ", ret = Array(_n)") + ";\n" + "if(_k < _s.length-1) {\n" + "    for(i=_n-1;i>=0;i--) ret[i] = arguments.callee(" + t.join(",") + ",_s,_k+1);\n" + "    return ret;\n" + "}\n" + r + "\n" + "for(i=_n-1;i!==-1;--i) {\n" + "    " + n + "\n" + "}\n" + "return ret;", Function.apply(null, i);
}, numeric.pointwise2 = function (t, n, r) {
  typeof r == "undefined" && (r = "");var i = [],
      s,
      o = /\[i\]$/,
      u,
      a = "",
      f = !1;for (s = 0; s < t.length; s++) {
    o.test(t[s]) ? (u = t[s].substring(0, t[s].length - 3), a = u) : u = t[s], u === "ret" && (f = !0), i.push(u);
  }return i[t.length] = "var _n = " + a + ".length;\n" + "var i" + (f ? "" : ", ret = Array(_n)") + ";\n" + r + "\n" + "for(i=_n-1;i!==-1;--i) {\n" + n + "\n" + "}\n" + "return ret;", Function.apply(null, i);
}, numeric._biforeach = function _biforeach(e, t, n, r, i) {
  if (r === n.length - 1) {
    i(e, t);return;
  }var s,
      o = n[r];for (s = o - 1; s >= 0; s--) {
    _biforeach((typeof e === "undefined" ? "undefined" : (0, _typeof3.default)(e)) == "object" ? e[s] : e, (typeof t === "undefined" ? "undefined" : (0, _typeof3.default)(t)) == "object" ? t[s] : t, n, r + 1, i);
  }
}, numeric._biforeach2 = function _biforeach2(e, t, n, r, i) {
  if (r === n.length - 1) return i(e, t);var s,
      o = n[r],
      u = Array(o);for (s = o - 1; s >= 0; --s) {
    u[s] = _biforeach2((typeof e === "undefined" ? "undefined" : (0, _typeof3.default)(e)) == "object" ? e[s] : e, (typeof t === "undefined" ? "undefined" : (0, _typeof3.default)(t)) == "object" ? t[s] : t, n, r + 1, i);
  }return u;
}, numeric._foreach = function _foreach(e, t, n, r) {
  if (n === t.length - 1) {
    r(e);return;
  }var i,
      s = t[n];for (i = s - 1; i >= 0; i--) {
    _foreach(e[i], t, n + 1, r);
  }
}, numeric._foreach2 = function _foreach2(e, t, n, r) {
  if (n === t.length - 1) return r(e);var i,
      s = t[n],
      o = Array(s);for (i = s - 1; i >= 0; i--) {
    o[i] = _foreach2(e[i], t, n + 1, r);
  }return o;
}, numeric.ops2 = { add: "+", sub: "-", mul: "*", div: "/", mod: "%", and: "&&", or: "||", eq: "===", neq: "!==", lt: "<", gt: ">", leq: "<=", geq: ">=", band: "&", bor: "|", bxor: "^", lshift: "<<", rshift: ">>", rrshift: ">>>" }, numeric.opseq = { addeq: "+=", subeq: "-=", muleq: "*=", diveq: "/=", modeq: "%=", lshifteq: "<<=", rshifteq: ">>=", rrshifteq: ">>>=", bandeq: "&=", boreq: "|=", bxoreq: "^=" }, numeric.mathfuns = ["abs", "acos", "asin", "atan", "ceil", "cos", "exp", "floor", "log", "round", "sin", "sqrt", "tan", "isNaN", "isFinite"], numeric.mathfuns2 = ["atan2", "pow", "max", "min"], numeric.ops1 = { neg: "-", not: "!", bnot: "~", clone: "" }, numeric.mapreducers = { any: ["if(xi) return true;", "var accum = false;"], all: ["if(!xi) return false;", "var accum = true;"], sum: ["accum += xi;", "var accum = 0;"], prod: ["accum *= xi;", "var accum = 1;"], norm2Squared: ["accum += xi*xi;", "var accum = 0;"], norminf: ["accum = max(accum,abs(xi));", "var accum = 0, max = Math.max, abs = Math.abs;"], norm1: ["accum += abs(xi)", "var accum = 0, abs = Math.abs;"], sup: ["accum = max(accum,xi);", "var accum = -Infinity, max = Math.max;"], inf: ["accum = min(accum,xi);", "var accum = Infinity, min = Math.min;"] }, function () {
  var e, t;for (e = 0; e < numeric.mathfuns2.length; ++e) {
    t = numeric.mathfuns2[e], numeric.ops2[t] = t;
  }for (e in numeric.ops2) {
    if (numeric.ops2.hasOwnProperty(e)) {
      t = numeric.ops2[e];var n,
          r,
          i = "";numeric.myIndexOf.call(numeric.mathfuns2, e) !== -1 ? (i = "var " + t + " = Math." + t + ";\n", n = function n(e, _n, r) {
        return e + " = " + t + "(" + _n + "," + r + ")";
      }, r = function r(e, n) {
        return e + " = " + t + "(" + e + "," + n + ")";
      }) : (n = function n(e, _n2, r) {
        return e + " = " + _n2 + " " + t + " " + r;
      }, numeric.opseq.hasOwnProperty(e + "eq") ? r = function r(e, n) {
        return e + " " + t + "= " + n;
      } : r = function r(e, n) {
        return e + " = " + e + " " + t + " " + n;
      }), numeric[e + "VV"] = numeric.pointwise2(["x[i]", "y[i]"], n("ret[i]", "x[i]", "y[i]"), i), numeric[e + "SV"] = numeric.pointwise2(["x", "y[i]"], n("ret[i]", "x", "y[i]"), i), numeric[e + "VS"] = numeric.pointwise2(["x[i]", "y"], n("ret[i]", "x[i]", "y"), i), numeric[e] = Function("var n = arguments.length, i, x = arguments[0], y;\nvar VV = numeric." + e + "VV, VS = numeric." + e + "VS, SV = numeric." + e + "SV;\n" + "var dim = numeric.dim;\n" + "for(i=1;i!==n;++i) { \n" + "  y = arguments[i];\n" + '  if(typeof x === "object") {\n' + '      if(typeof y === "object") x = numeric._biforeach2(x,y,dim(x),0,VV);\n' + "      else x = numeric._biforeach2(x,y,dim(x),0,VS);\n" + '  } else if(typeof y === "object") x = numeric._biforeach2(x,y,dim(y),0,SV);\n' + "  else " + r("x", "y") + "\n" + "}\nreturn x;\n"), numeric[t] = numeric[e], numeric[e + "eqV"] = numeric.pointwise2(["ret[i]", "x[i]"], r("ret[i]", "x[i]"), i), numeric[e + "eqS"] = numeric.pointwise2(["ret[i]", "x"], r("ret[i]", "x"), i), numeric[e + "eq"] = Function("var n = arguments.length, i, x = arguments[0], y;\nvar V = numeric." + e + "eqV, S = numeric." + e + "eqS\n" + "var s = numeric.dim(x);\n" + "for(i=1;i!==n;++i) { \n" + "  y = arguments[i];\n" + '  if(typeof y === "object") numeric._biforeach(x,y,s,0,V);\n' + "  else numeric._biforeach(x,y,s,0,S);\n" + "}\nreturn x;\n");
    }
  }for (e = 0; e < numeric.mathfuns2.length; ++e) {
    t = numeric.mathfuns2[e], delete numeric.ops2[t];
  }for (e = 0; e < numeric.mathfuns.length; ++e) {
    t = numeric.mathfuns[e], numeric.ops1[t] = t;
  }for (e in numeric.ops1) {
    numeric.ops1.hasOwnProperty(e) && (i = "", t = numeric.ops1[e], numeric.myIndexOf.call(numeric.mathfuns, e) !== -1 && Math.hasOwnProperty(t) && (i = "var " + t + " = Math." + t + ";\n"), numeric[e + "eqV"] = numeric.pointwise2(["ret[i]"], "ret[i] = " + t + "(ret[i]);", i), numeric[e + "eq"] = Function("x", 'if(typeof x !== "object") return ' + t + "x\n" + "var i;\n" + "var V = numeric." + e + "eqV;\n" + "var s = numeric.dim(x);\n" + "numeric._foreach(x,s,0,V);\n" + "return x;\n"), numeric[e + "V"] = numeric.pointwise2(["x[i]"], "ret[i] = " + t + "(x[i]);", i), numeric[e] = Function("x", 'if(typeof x !== "object") return ' + t + "(x)\n" + "var i;\n" + "var V = numeric." + e + "V;\n" + "var s = numeric.dim(x);\n" + "return numeric._foreach2(x,s,0,V);\n"));
  }for (e = 0; e < numeric.mathfuns.length; ++e) {
    t = numeric.mathfuns[e], delete numeric.ops1[t];
  }for (e in numeric.mapreducers) {
    numeric.mapreducers.hasOwnProperty(e) && (t = numeric.mapreducers[e], numeric[e + "V"] = numeric.mapreduce2(t[0], t[1]), numeric[e] = Function("x", "s", "k", t[1] + 'if(typeof x !== "object") {' + "    xi = x;\n" + t[0] + ";\n" + "    return accum;\n" + "}" + 'if(typeof s === "undefined") s = numeric.dim(x);\n' + 'if(typeof k === "undefined") k = 0;\n' + "if(k === s.length-1) return numeric." + e + "V(x);\n" + "var xi;\n" + "var n = x.length, i;\n" + "for(i=n-1;i!==-1;--i) {\n" + "   xi = arguments.callee(x[i]);\n" + t[0] + ";\n" + "}\n" + "return accum;\n"));
  }
}(), numeric.truncVV = numeric.pointwise(["x[i]", "y[i]"], "ret[i] = round(x[i]/y[i])*y[i];", "var round = Math.round;"), numeric.truncVS = numeric.pointwise(["x[i]", "y"], "ret[i] = round(x[i]/y)*y;", "var round = Math.round;"), numeric.truncSV = numeric.pointwise(["x", "y[i]"], "ret[i] = round(x/y[i])*y[i];", "var round = Math.round;"), numeric.trunc = function (t, n) {
  return (typeof t === "undefined" ? "undefined" : (0, _typeof3.default)(t)) == "object" ? (typeof n === "undefined" ? "undefined" : (0, _typeof3.default)(n)) == "object" ? numeric.truncVV(t, n) : numeric.truncVS(t, n) : (typeof n === "undefined" ? "undefined" : (0, _typeof3.default)(n)) == "object" ? numeric.truncSV(t, n) : Math.round(t / n) * n;
}, numeric.inv = function (t) {
  var n = numeric.dim(t),
      r = Math.abs,
      i = n[0],
      s = n[1],
      o = numeric.clone(t),
      u,
      a,
      f = numeric.identity(i),
      l,
      c,
      h,
      p,
      d,
      t;for (p = 0; p < s; ++p) {
    var v = -1,
        m = -1;for (h = p; h !== i; ++h) {
      d = r(o[h][p]), d > m && (v = h, m = d);
    }a = o[v], o[v] = o[p], o[p] = a, c = f[v], f[v] = f[p], f[p] = c, t = a[p];for (d = p; d !== s; ++d) {
      a[d] /= t;
    }for (d = s - 1; d !== -1; --d) {
      c[d] /= t;
    }for (h = i - 1; h !== -1; --h) {
      if (h !== p) {
        u = o[h], l = f[h], t = u[p];for (d = p + 1; d !== s; ++d) {
          u[d] -= a[d] * t;
        }for (d = s - 1; d > 0; --d) {
          l[d] -= c[d] * t, --d, l[d] -= c[d] * t;
        }d === 0 && (l[0] -= c[0] * t);
      }
    }
  }return f;
}, numeric.det = function (t) {
  var n = numeric.dim(t);if (n.length !== 2 || n[0] !== n[1]) throw new Error("numeric: det() only works on square matrices");var r = n[0],
      i = 1,
      s,
      o,
      u,
      a = numeric.clone(t),
      f,
      l,
      c,
      h,
      p,
      d,
      v;for (o = 0; o < r - 1; o++) {
    u = o;for (s = o + 1; s < r; s++) {
      Math.abs(a[s][o]) > Math.abs(a[u][o]) && (u = s);
    }u !== o && (h = a[u], a[u] = a[o], a[o] = h, i *= -1), f = a[o];for (s = o + 1; s < r; s++) {
      l = a[s], c = l[o] / f[o];for (u = o + 1; u < r - 1; u += 2) {
        p = u + 1, l[u] -= f[u] * c, l[p] -= f[p] * c;
      }u !== r && (l[u] -= f[u] * c);
    }if (f[o] === 0) return 0;i *= f[o];
  }return i * a[o][o];
}, numeric.transpose = function (t) {
  var n,
      r,
      i = t.length,
      s = t[0].length,
      o = Array(s),
      u,
      a,
      f;for (r = 0; r < s; r++) {
    o[r] = Array(i);
  }for (n = i - 1; n >= 1; n -= 2) {
    a = t[n], u = t[n - 1];for (r = s - 1; r >= 1; --r) {
      f = o[r], f[n] = a[r], f[n - 1] = u[r], --r, f = o[r], f[n] = a[r], f[n - 1] = u[r];
    }r === 0 && (f = o[0], f[n] = a[0], f[n - 1] = u[0]);
  }if (n === 0) {
    u = t[0];for (r = s - 1; r >= 1; --r) {
      o[r][0] = u[r], --r, o[r][0] = u[r];
    }r === 0 && (o[0][0] = u[0]);
  }return o;
}, numeric.negtranspose = function (t) {
  var n,
      r,
      i = t.length,
      s = t[0].length,
      o = Array(s),
      u,
      a,
      f;for (r = 0; r < s; r++) {
    o[r] = Array(i);
  }for (n = i - 1; n >= 1; n -= 2) {
    a = t[n], u = t[n - 1];for (r = s - 1; r >= 1; --r) {
      f = o[r], f[n] = -a[r], f[n - 1] = -u[r], --r, f = o[r], f[n] = -a[r], f[n - 1] = -u[r];
    }r === 0 && (f = o[0], f[n] = -a[0], f[n - 1] = -u[0]);
  }if (n === 0) {
    u = t[0];for (r = s - 1; r >= 1; --r) {
      o[r][0] = -u[r], --r, o[r][0] = -u[r];
    }r === 0 && (o[0][0] = -u[0]);
  }return o;
}, numeric._random = function _random(e, t) {
  var n,
      r = e[t],
      i = Array(r),
      s;if (t === e.length - 1) {
    s = Math.random;for (n = r - 1; n >= 1; n -= 2) {
      i[n] = s(), i[n - 1] = s();
    }return n === 0 && (i[0] = s()), i;
  }for (n = r - 1; n >= 0; n--) {
    i[n] = _random(e, t + 1);
  }return i;
}, numeric.random = function (t) {
  return numeric._random(t, 0);
}, numeric.norm2 = function (t) {
  return Math.sqrt(numeric.norm2Squared(t));
}, numeric.linspace = function (t, n, r) {
  typeof r == "undefined" && (r = Math.max(Math.round(n - t) + 1, 1));if (r < 2) return r === 1 ? [t] : [];var i,
      s = Array(r);r--;for (i = r; i >= 0; i--) {
    s[i] = (i * n + (r - i) * t) / r;
  }return s;
}, numeric.getBlock = function (t, n, r) {
  function s(e, t) {
    var o,
        u = n[t],
        a = r[t] - u,
        f = Array(a);if (t === i.length - 1) {
      for (o = a; o >= 0; o--) {
        f[o] = e[o + u];
      }return f;
    }for (o = a; o >= 0; o--) {
      f[o] = s(e[o + u], t + 1);
    }return f;
  }var i = numeric.dim(t);return s(t, 0);
}, numeric.setBlock = function (t, n, r, i) {
  function o(e, t, i) {
    var u,
        a = n[i],
        f = r[i] - a;if (i === s.length - 1) for (u = f; u >= 0; u--) {
      e[u + a] = t[u];
    }for (u = f; u >= 0; u--) {
      o(e[u + a], t[u], i + 1);
    }
  }var s = numeric.dim(t);return o(t, i, 0), t;
}, numeric.getRange = function (t, n, r) {
  var i = n.length,
      s = r.length,
      o,
      u,
      a = Array(i),
      f,
      l;for (o = i - 1; o !== -1; --o) {
    a[o] = Array(s), f = a[o], l = t[n[o]];for (u = s - 1; u !== -1; --u) {
      f[u] = l[r[u]];
    }
  }return a;
}, numeric.blockMatrix = function (t) {
  var n = numeric.dim(t);if (n.length < 4) return numeric.blockMatrix([t]);var r = n[0],
      i = n[1],
      s,
      o,
      u,
      a,
      f;s = 0, o = 0;for (u = 0; u < r; ++u) {
    s += t[u][0].length;
  }for (a = 0; a < i; ++a) {
    o += t[0][a][0].length;
  }var l = Array(s);for (u = 0; u < s; ++u) {
    l[u] = Array(o);
  }var c = 0,
      h,
      p,
      d,
      v,
      m;for (u = 0; u < r; ++u) {
    h = o;for (a = i - 1; a !== -1; --a) {
      f = t[u][a], h -= f[0].length;for (d = f.length - 1; d !== -1; --d) {
        m = f[d], p = l[c + d];for (v = m.length - 1; v !== -1; --v) {
          p[h + v] = m[v];
        }
      }
    }c += t[u][0].length;
  }return l;
}, numeric.tensor = function (t, n) {
  if (typeof t == "number" || typeof n == "number") return numeric.mul(t, n);var r = numeric.dim(t),
      i = numeric.dim(n);if (r.length !== 1 || i.length !== 1) throw new Error("numeric: tensor product is only defined for vectors");var s = r[0],
      o = i[0],
      u = Array(s),
      a,
      f,
      l,
      c;for (f = s - 1; f >= 0; f--) {
    a = Array(o), c = t[f];for (l = o - 1; l >= 3; --l) {
      a[l] = c * n[l], --l, a[l] = c * n[l], --l, a[l] = c * n[l], --l, a[l] = c * n[l];
    }while (l >= 0) {
      a[l] = c * n[l], --l;
    }u[f] = a;
  }return u;
}, numeric.T = function (t, n) {
  this.x = t, this.y = n;
}, numeric.t = function (t, n) {
  return new numeric.T(t, n);
}, numeric.Tbinop = function (t, n, r, i, s) {
  var o = numeric.indexOf;if (typeof s != "string") {
    var u;s = "";for (u in numeric) {
      numeric.hasOwnProperty(u) && (t.indexOf(u) >= 0 || n.indexOf(u) >= 0 || r.indexOf(u) >= 0 || i.indexOf(u) >= 0) && u.length > 1 && (s += "var " + u + " = numeric." + u + ";\n");
    }
  }return Function(["y"], "var x = this;\nif(!(y instanceof numeric.T)) { y = new numeric.T(y); }\n" + s + "\n" + "if(x.y) {" + "  if(y.y) {" + "    return new numeric.T(" + i + ");\n" + "  }\n" + "  return new numeric.T(" + r + ");\n" + "}\n" + "if(y.y) {\n" + "  return new numeric.T(" + n + ");\n" + "}\n" + "return new numeric.T(" + t + ");\n");
}, numeric.T.prototype.add = numeric.Tbinop("add(x.x,y.x)", "add(x.x,y.x),y.y", "add(x.x,y.x),x.y", "add(x.x,y.x),add(x.y,y.y)"), numeric.T.prototype.sub = numeric.Tbinop("sub(x.x,y.x)", "sub(x.x,y.x),neg(y.y)", "sub(x.x,y.x),x.y", "sub(x.x,y.x),sub(x.y,y.y)"), numeric.T.prototype.mul = numeric.Tbinop("mul(x.x,y.x)", "mul(x.x,y.x),mul(x.x,y.y)", "mul(x.x,y.x),mul(x.y,y.x)", "sub(mul(x.x,y.x),mul(x.y,y.y)),add(mul(x.x,y.y),mul(x.y,y.x))"), numeric.T.prototype.reciprocal = function () {
  var t = numeric.mul,
      n = numeric.div;if (this.y) {
    var r = numeric.add(t(this.x, this.x), t(this.y, this.y));return new numeric.T(n(this.x, r), n(numeric.neg(this.y), r));
  }return new T(n(1, this.x));
}, numeric.T.prototype.div = function div(e) {
  e instanceof numeric.T || (e = new numeric.T(e));if (e.y) return this.mul(e.reciprocal());var div = numeric.div;return this.y ? new numeric.T(div(this.x, e.x), div(this.y, e.x)) : new numeric.T(div(this.x, e.x));
}, numeric.T.prototype.dot = numeric.Tbinop("dot(x.x,y.x)", "dot(x.x,y.x),dot(x.x,y.y)", "dot(x.x,y.x),dot(x.y,y.x)", "sub(dot(x.x,y.x),dot(x.y,y.y)),add(dot(x.x,y.y),dot(x.y,y.x))"), numeric.T.prototype.transpose = function () {
  var t = numeric.transpose,
      n = this.x,
      r = this.y;return r ? new numeric.T(t(n), t(r)) : new numeric.T(t(n));
}, numeric.T.prototype.transjugate = function () {
  var t = numeric.transpose,
      n = this.x,
      r = this.y;return r ? new numeric.T(t(n), numeric.negtranspose(r)) : new numeric.T(t(n));
}, numeric.Tunop = function (t, n, r) {
  return typeof r != "string" && (r = ""), Function("var x = this;\n" + r + "\n" + "if(x.y) {" + "  " + n + ";\n" + "}\n" + t + ";\n");
}, numeric.T.prototype.exp = numeric.Tunop("return new numeric.T(ex)", "return new numeric.T(mul(cos(x.y),ex),mul(sin(x.y),ex))", "var ex = numeric.exp(x.x), cos = numeric.cos, sin = numeric.sin, mul = numeric.mul;"), numeric.T.prototype.conj = numeric.Tunop("return new numeric.T(x.x);", "return new numeric.T(x.x,numeric.neg(x.y));"), numeric.T.prototype.neg = numeric.Tunop("return new numeric.T(neg(x.x));", "return new numeric.T(neg(x.x),neg(x.y));", "var neg = numeric.neg;"), numeric.T.prototype.sin = numeric.Tunop("return new numeric.T(numeric.sin(x.x))", "return x.exp().sub(x.neg().exp()).div(new numeric.T(0,2));"), numeric.T.prototype.cos = numeric.Tunop("return new numeric.T(numeric.cos(x.x))", "return x.exp().add(x.neg().exp()).div(2);"), numeric.T.prototype.abs = numeric.Tunop("return new numeric.T(numeric.abs(x.x));", "return new numeric.T(numeric.sqrt(numeric.add(mul(x.x,x.x),mul(x.y,x.y))));", "var mul = numeric.mul;"), numeric.T.prototype.log = numeric.Tunop("return new numeric.T(numeric.log(x.x));", "var theta = new numeric.T(numeric.atan2(x.y,x.x)), r = x.abs();\nreturn new numeric.T(numeric.log(r.x),theta.x);"), numeric.T.prototype.norm2 = numeric.Tunop("return numeric.norm2(x.x);", "var f = numeric.norm2Squared;\nreturn Math.sqrt(f(x.x)+f(x.y));"), numeric.T.prototype.inv = function () {
  var t = this;if (typeof t.y == "undefined") return new numeric.T(numeric.inv(t.x));var n = t.x.length,
      r,
      i,
      s,
      o = numeric.identity(n),
      u = numeric.rep([n, n], 0),
      a = numeric.clone(t.x),
      f = numeric.clone(t.y),
      l,
      c,
      h,
      p,
      d,
      v,
      m,
      g,
      r,
      i,
      s,
      y,
      b,
      w,
      E,
      S,
      x,
      T;for (r = 0; r < n; r++) {
    w = a[r][r], E = f[r][r], y = w * w + E * E, s = r;for (i = r + 1; i < n; i++) {
      w = a[i][r], E = f[i][r], b = w * w + E * E, b > y && (s = i, y = b);
    }s !== r && (T = a[r], a[r] = a[s], a[s] = T, T = f[r], f[r] = f[s], f[s] = T, T = o[r], o[r] = o[s], o[s] = T, T = u[r], u[r] = u[s], u[s] = T), l = a[r], c = f[r], d = o[r], v = u[r], w = l[r], E = c[r];for (i = r + 1; i < n; i++) {
      S = l[i], x = c[i], l[i] = (S * w + x * E) / y, c[i] = (x * w - S * E) / y;
    }for (i = 0; i < n; i++) {
      S = d[i], x = v[i], d[i] = (S * w + x * E) / y, v[i] = (x * w - S * E) / y;
    }for (i = r + 1; i < n; i++) {
      h = a[i], p = f[i], m = o[i], g = u[i], w = h[r], E = p[r];for (s = r + 1; s < n; s++) {
        S = l[s], x = c[s], h[s] -= S * w - x * E, p[s] -= x * w + S * E;
      }for (s = 0; s < n; s++) {
        S = d[s], x = v[s], m[s] -= S * w - x * E, g[s] -= x * w + S * E;
      }
    }
  }for (r = n - 1; r > 0; r--) {
    d = o[r], v = u[r];for (i = r - 1; i >= 0; i--) {
      m = o[i], g = u[i], w = a[i][r], E = f[i][r];for (s = n - 1; s >= 0; s--) {
        S = d[s], x = v[s], m[s] -= w * S - E * x, g[s] -= w * x + E * S;
      }
    }
  }return new numeric.T(o, u);
}, numeric.T.prototype.get = function (t) {
  var n = this.x,
      r = this.y,
      i = 0,
      s,
      o = t.length;if (r) {
    while (i < o) {
      s = t[i], n = n[s], r = r[s], i++;
    }return new numeric.T(n, r);
  }while (i < o) {
    s = t[i], n = n[s], i++;
  }return new numeric.T(n);
}, numeric.T.prototype.set = function (t, n) {
  var r = this.x,
      i = this.y,
      s = 0,
      o,
      u = t.length,
      a = n.x,
      f = n.y;if (u === 0) return f ? this.y = f : i && (this.y = undefined), this.x = r, this;if (f) {
    i || (i = numeric.rep(numeric.dim(r), 0), this.y = i);while (s < u - 1) {
      o = t[s], r = r[o], i = i[o], s++;
    }return o = t[s], r[o] = a, i[o] = f, this;
  }if (i) {
    while (s < u - 1) {
      o = t[s], r = r[o], i = i[o], s++;
    }return o = t[s], r[o] = a, a instanceof Array ? i[o] = numeric.rep(numeric.dim(a), 0) : i[o] = 0, this;
  }while (s < u - 1) {
    o = t[s], r = r[o], s++;
  }return o = t[s], r[o] = a, this;
}, numeric.T.prototype.getRows = function (t, n) {
  var r = n - t + 1,
      i,
      s = Array(r),
      o,
      u = this.x,
      a = this.y;for (i = t; i <= n; i++) {
    s[i - t] = u[i];
  }if (a) {
    o = Array(r);for (i = t; i <= n; i++) {
      o[i - t] = a[i];
    }return new numeric.T(s, o);
  }return new numeric.T(s);
}, numeric.T.prototype.setRows = function (t, n, r) {
  var i,
      s = this.x,
      o = this.y,
      u = r.x,
      a = r.y;for (i = t; i <= n; i++) {
    s[i] = u[i - t];
  }if (a) {
    o || (o = numeric.rep(numeric.dim(s), 0), this.y = o);for (i = t; i <= n; i++) {
      o[i] = a[i - t];
    }
  } else if (o) for (i = t; i <= n; i++) {
    o[i] = numeric.rep([u[i - t].length], 0);
  }return this;
}, numeric.T.prototype.getRow = function (t) {
  var n = this.x,
      r = this.y;return r ? new numeric.T(n[t], r[t]) : new numeric.T(n[t]);
}, numeric.T.prototype.setRow = function (t, n) {
  var r = this.x,
      i = this.y,
      s = n.x,
      o = n.y;return r[t] = s, o ? (i || (i = numeric.rep(numeric.dim(r), 0), this.y = i), i[t] = o) : i && (i = numeric.rep([s.length], 0)), this;
}, numeric.T.prototype.getBlock = function (t, n) {
  var r = this.x,
      i = this.y,
      s = numeric.getBlock;return i ? new numeric.T(s(r, t, n), s(i, t, n)) : new numeric.T(s(r, t, n));
}, numeric.T.prototype.setBlock = function (t, n, r) {
  r instanceof numeric.T || (r = new numeric.T(r));var i = this.x,
      s = this.y,
      o = numeric.setBlock,
      u = r.x,
      a = r.y;if (a) return s || (this.y = numeric.rep(numeric.dim(this), 0), s = this.y), o(i, t, n, u), o(s, t, n, a), this;o(i, t, n, u), s && o(s, t, n, numeric.rep(numeric.dim(u), 0));
}, numeric.T.rep = function (t, n) {
  var r = numeric.T;n instanceof r || (n = new r(n));var i = n.x,
      s = n.y,
      o = numeric.rep;return s ? new r(o(t, i), o(t, s)) : new r(o(t, i));
}, numeric.T.diag = function diag(e) {
  e instanceof numeric.T || (e = new numeric.T(e));var t = e.x,
      n = e.y,
      diag = numeric.diag;return n ? new numeric.T(diag(t), diag(n)) : new numeric.T(diag(t));
}, numeric.T.eig = function () {
  if (this.y) throw new Error("eig: not implemented for complex matrices.");return numeric.eig(this.x);
}, numeric.T.identity = function (t) {
  return new numeric.T(numeric.identity(t));
}, numeric.T.prototype.getDiag = function () {
  var t = numeric,
      n = this.x,
      r = this.y;return r ? new t.T(t.getDiag(n), t.getDiag(r)) : new t.T(t.getDiag(n));
}, numeric.house = function (t) {
  var n = numeric.clone(t),
      r = t[0] >= 0 ? 1 : -1,
      i = r * numeric.norm2(t);n[0] += i;var s = numeric.norm2(n);if (s === 0) throw new Error("eig: internal error");return numeric.div(n, s);
}, numeric.toUpperHessenberg = function (t) {
  var n = numeric.dim(t);if (n.length !== 2 || n[0] !== n[1]) throw new Error("numeric: toUpperHessenberg() only works on square matrices");var r = n[0],
      i,
      s,
      o,
      u,
      a,
      f = numeric.clone(t),
      l,
      c,
      h,
      p,
      d = numeric.identity(r),
      v;for (s = 0; s < r - 2; s++) {
    u = Array(r - s - 1);for (i = s + 1; i < r; i++) {
      u[i - s - 1] = f[i][s];
    }if (numeric.norm2(u) > 0) {
      a = numeric.house(u), l = numeric.getBlock(f, [s + 1, s], [r - 1, r - 1]), c = numeric.tensor(a, numeric.dot(a, l));for (i = s + 1; i < r; i++) {
        h = f[i], p = c[i - s - 1];for (o = s; o < r; o++) {
          h[o] -= 2 * p[o - s];
        }
      }l = numeric.getBlock(f, [0, s + 1], [r - 1, r - 1]), c = numeric.tensor(numeric.dot(l, a), a);for (i = 0; i < r; i++) {
        h = f[i], p = c[i];for (o = s + 1; o < r; o++) {
          h[o] -= 2 * p[o - s - 1];
        }
      }l = Array(r - s - 1);for (i = s + 1; i < r; i++) {
        l[i - s - 1] = d[i];
      }c = numeric.tensor(a, numeric.dot(a, l));for (i = s + 1; i < r; i++) {
        v = d[i], p = c[i - s - 1];for (o = 0; o < r; o++) {
          v[o] -= 2 * p[o];
        }
      }
    }
  }return { H: f, Q: d };
}, numeric.epsilon = 2.220446049250313e-16, numeric.QRFrancis = function (e, t) {
  typeof t == "undefined" && (t = 1e4), e = numeric.clone(e);var n = numeric.clone(e),
      r = numeric.dim(e),
      i = r[0],
      s,
      o,
      u,
      a,
      f,
      l,
      c,
      h,
      p,
      d = numeric.identity(i),
      v,
      m,
      g,
      y,
      b,
      w,
      E,
      S,
      x;if (i < 3) return { Q: d, B: [[0, i - 1]] };var T = numeric.epsilon;for (x = 0; x < t; x++) {
    for (E = 0; E < i - 1; E++) {
      if (Math.abs(e[E + 1][E]) < T * (Math.abs(e[E][E]) + Math.abs(e[E + 1][E + 1]))) {
        var N = numeric.QRFrancis(numeric.getBlock(e, [0, 0], [E, E]), t),
            C = numeric.QRFrancis(numeric.getBlock(e, [E + 1, E + 1], [i - 1, i - 1]), t);g = Array(E + 1);for (w = 0; w <= E; w++) {
          g[w] = d[w];
        }y = numeric.dot(N.Q, g);for (w = 0; w <= E; w++) {
          d[w] = y[w];
        }g = Array(i - E - 1);for (w = E + 1; w < i; w++) {
          g[w - E - 1] = d[w];
        }y = numeric.dot(C.Q, g);for (w = E + 1; w < i; w++) {
          d[w] = y[w - E - 1];
        }return { Q: d, B: N.B.concat(numeric.add(C.B, E + 1)) };
      }
    }u = e[i - 2][i - 2], a = e[i - 2][i - 1], f = e[i - 1][i - 2], l = e[i - 1][i - 1], h = u + l, c = u * l - a * f, p = numeric.getBlock(e, [0, 0], [2, 2]);if (h * h >= 4 * c) {
      var k, L;k = .5 * (h + Math.sqrt(h * h - 4 * c)), L = .5 * (h - Math.sqrt(h * h - 4 * c)), p = numeric.add(numeric.sub(numeric.dot(p, p), numeric.mul(p, k + L)), numeric.diag(numeric.rep([3], k * L)));
    } else p = numeric.add(numeric.sub(numeric.dot(p, p), numeric.mul(p, h)), numeric.diag(numeric.rep([3], c)));s = [p[0][0], p[1][0], p[2][0]], o = numeric.house(s), g = [e[0], e[1], e[2]], y = numeric.tensor(o, numeric.dot(o, g));for (w = 0; w < 3; w++) {
      m = e[w], b = y[w];for (S = 0; S < i; S++) {
        m[S] -= 2 * b[S];
      }
    }g = numeric.getBlock(e, [0, 0], [i - 1, 2]), y = numeric.tensor(numeric.dot(g, o), o);for (w = 0; w < i; w++) {
      m = e[w], b = y[w];for (S = 0; S < 3; S++) {
        m[S] -= 2 * b[S];
      }
    }g = [d[0], d[1], d[2]], y = numeric.tensor(o, numeric.dot(o, g));for (w = 0; w < 3; w++) {
      v = d[w], b = y[w];for (S = 0; S < i; S++) {
        v[S] -= 2 * b[S];
      }
    }var A;for (E = 0; E < i - 2; E++) {
      for (S = E; S <= E + 1; S++) {
        if (Math.abs(e[S + 1][S]) < T * (Math.abs(e[S][S]) + Math.abs(e[S + 1][S + 1]))) {
          var N = numeric.QRFrancis(numeric.getBlock(e, [0, 0], [S, S]), t),
              C = numeric.QRFrancis(numeric.getBlock(e, [S + 1, S + 1], [i - 1, i - 1]), t);g = Array(S + 1);for (w = 0; w <= S; w++) {
            g[w] = d[w];
          }y = numeric.dot(N.Q, g);for (w = 0; w <= S; w++) {
            d[w] = y[w];
          }g = Array(i - S - 1);for (w = S + 1; w < i; w++) {
            g[w - S - 1] = d[w];
          }y = numeric.dot(C.Q, g);for (w = S + 1; w < i; w++) {
            d[w] = y[w - S - 1];
          }return { Q: d, B: N.B.concat(numeric.add(C.B, S + 1)) };
        }
      }A = Math.min(i - 1, E + 3), s = Array(A - E);for (w = E + 1; w <= A; w++) {
        s[w - E - 1] = e[w][E];
      }o = numeric.house(s), g = numeric.getBlock(e, [E + 1, E], [A, i - 1]), y = numeric.tensor(o, numeric.dot(o, g));for (w = E + 1; w <= A; w++) {
        m = e[w], b = y[w - E - 1];for (S = E; S < i; S++) {
          m[S] -= 2 * b[S - E];
        }
      }g = numeric.getBlock(e, [0, E + 1], [i - 1, A]), y = numeric.tensor(numeric.dot(g, o), o);for (w = 0; w < i; w++) {
        m = e[w], b = y[w];for (S = E + 1; S <= A; S++) {
          m[S] -= 2 * b[S - E - 1];
        }
      }g = Array(A - E);for (w = E + 1; w <= A; w++) {
        g[w - E - 1] = d[w];
      }y = numeric.tensor(o, numeric.dot(o, g));for (w = E + 1; w <= A; w++) {
        v = d[w], b = y[w - E - 1];for (S = 0; S < i; S++) {
          v[S] -= 2 * b[S];
        }
      }
    }
  }throw new Error("numeric: eigenvalue iteration does not converge -- increase maxiter?");
}, numeric.eig = function (t, n) {
  var r = numeric.toUpperHessenberg(t),
      i = numeric.QRFrancis(r.H, n),
      s = numeric.T,
      o = t.length,
      u,
      a,
      f = !1,
      l = i.B,
      c = numeric.dot(i.Q, numeric.dot(r.H, numeric.transpose(i.Q))),
      h = new s(numeric.dot(i.Q, r.Q)),
      p,
      d = l.length,
      v,
      m,
      g,
      y,
      b,
      w,
      E,
      S,
      x,
      T,
      N,
      C,
      k,
      L,
      A = Math.sqrt;for (a = 0; a < d; a++) {
    u = l[a][0];if (u !== l[a][1]) {
      v = u + 1, m = c[u][u], g = c[u][v], y = c[v][u], b = c[v][v];if (g === 0 && y === 0) continue;w = -m - b, E = m * b - g * y, S = w * w - 4 * E, S >= 0 ? (w < 0 ? x = -0.5 * (w - A(S)) : x = -0.5 * (w + A(S)), k = (m - x) * (m - x) + g * g, L = y * y + (b - x) * (b - x), k > L ? (k = A(k), N = (m - x) / k, C = g / k) : (L = A(L), N = y / L, C = (b - x) / L), p = new s([[C, -N], [N, C]]), h.setRows(u, v, p.dot(h.getRows(u, v)))) : (x = -0.5 * w, T = .5 * A(-S), k = (m - x) * (m - x) + g * g, L = y * y + (b - x) * (b - x), k > L ? (k = A(k + T * T), N = (m - x) / k, C = g / k, x = 0, T /= k) : (L = A(L + T * T), N = y / L, C = (b - x) / L, x = T / L, T = 0), p = new s([[C, -N], [N, C]], [[x, T], [T, -x]]), h.setRows(u, v, p.dot(h.getRows(u, v))));
    }
  }var O = h.dot(t).dot(h.transjugate()),
      o = t.length,
      M = numeric.T.identity(o);for (v = 0; v < o; v++) {
    if (v > 0) for (a = v - 1; a >= 0; a--) {
      var _ = O.get([a, a]),
          D = O.get([v, v]);if (!numeric.neq(_.x, D.x) && !numeric.neq(_.y, D.y)) {
        M.setRow(v, M.getRow(a));continue;
      }x = O.getRow(a).getBlock([a], [v - 1]), T = M.getRow(v).getBlock([a], [v - 1]), M.set([v, a], O.get([a, v]).neg().sub(x.dot(T)).div(_.sub(D)));
    }
  }for (v = 0; v < o; v++) {
    x = M.getRow(v), M.setRow(v, x.div(x.norm2()));
  }return M = M.transpose(), M = h.transjugate().dot(M), { lambda: O.getDiag(), E: M };
}, numeric.ccsSparse = function (t) {
  var n = t.length,
      r,
      i,
      s,
      o,
      u = [];for (s = n - 1; s !== -1; --s) {
    i = t[s];for (o in i) {
      o = parseInt(o);while (o >= u.length) {
        u[u.length] = 0;
      }i[o] !== 0 && u[o]++;
    }
  }var r = u.length,
      a = Array(r + 1);a[0] = 0;for (s = 0; s < r; ++s) {
    a[s + 1] = a[s] + u[s];
  }var f = Array(a[r]),
      l = Array(a[r]);for (s = n - 1; s !== -1; --s) {
    i = t[s];for (o in i) {
      i[o] !== 0 && (u[o]--, f[a[o] + u[o]] = s, l[a[o] + u[o]] = i[o]);
    }
  }return [a, f, l];
}, numeric.ccsFull = function (t) {
  var n = t[0],
      r = t[1],
      i = t[2],
      s = numeric.ccsDim(t),
      o = s[0],
      u = s[1],
      a,
      f,
      l,
      c,
      h,
      p = numeric.rep([o, u], 0);for (a = 0; a < u; a++) {
    l = n[a], c = n[a + 1];for (f = l; f < c; ++f) {
      p[r[f]][a] = i[f];
    }
  }return p;
}, numeric.ccsTSolve = function (t, n, r, i, s) {
  function h(e) {
    var t;if (r[e] !== 0) return;r[e] = 1;for (t = o[e]; t < o[e + 1]; ++t) {
      h(u[t]);
    }s[c] = e, ++c;
  }var o = t[0],
      u = t[1],
      a = t[2],
      f = o.length - 1,
      l = Math.max,
      c = 0;typeof i == "undefined" && (r = numeric.rep([f], 0)), typeof i == "undefined" && (i = numeric.linspace(0, r.length - 1)), typeof s == "undefined" && (s = []);var p, d, v, m, g, y, b, w, E;for (p = i.length - 1; p !== -1; --p) {
    h(i[p]);
  }s.length = c;for (p = s.length - 1; p !== -1; --p) {
    r[s[p]] = 0;
  }for (p = i.length - 1; p !== -1; --p) {
    d = i[p], r[d] = n[d];
  }for (p = s.length - 1; p !== -1; --p) {
    d = s[p], v = o[d], m = l(o[d + 1], v);for (g = v; g !== m; ++g) {
      if (u[g] === d) {
        r[d] /= a[g];break;
      }
    }E = r[d];for (g = v; g !== m; ++g) {
      y = u[g], y !== d && (r[y] -= E * a[g]);
    }
  }return r;
}, numeric.ccsDFS = function (t) {
  this.k = Array(t), this.k1 = Array(t), this.j = Array(t);
}, numeric.ccsDFS.prototype.dfs = function (t, n, r, i, s, o) {
  var u = 0,
      a,
      f = s.length,
      l = this.k,
      c = this.k1,
      h = this.j,
      p,
      d;if (i[t] !== 0) return;i[t] = 1, h[0] = t, l[0] = p = n[t], c[0] = d = n[t + 1];for (;;) {
    if (p >= d) {
      s[f] = h[u];if (u === 0) return;++f, --u, p = l[u], d = c[u];
    } else a = o[r[p]], i[a] === 0 ? (i[a] = 1, l[u] = p, ++u, h[u] = a, p = n[a], c[u] = d = n[a + 1]) : ++p;
  }
}, numeric.ccsLPSolve = function (t, n, r, i, s, o, u) {
  var a = t[0],
      f = t[1],
      l = t[2],
      c = a.length - 1,
      h = 0,
      p = n[0],
      d = n[1],
      v = n[2],
      m,
      g,
      y,
      b,
      w,
      E,
      S,
      x,
      T,
      N,
      C,
      k;g = p[s], y = p[s + 1], i.length = 0;for (m = g; m < y; ++m) {
    u.dfs(o[d[m]], a, f, r, i, o);
  }for (m = i.length - 1; m !== -1; --m) {
    r[i[m]] = 0;
  }for (m = g; m !== y; ++m) {
    b = o[d[m]], r[b] = v[m];
  }for (m = i.length - 1; m !== -1; --m) {
    b = i[m], E = a[b], S = a[b + 1];for (x = E; x < S; ++x) {
      if (o[f[x]] === b) {
        r[b] /= l[x];break;
      }
    }k = r[b];for (x = E; x < S; ++x) {
      T = o[f[x]], T !== b && (r[T] -= k * l[x]);
    }
  }return r;
}, numeric.ccsLUP1 = function (t, n) {
  var r = t[0].length - 1,
      i = [numeric.rep([r + 1], 0), [], []],
      s = [numeric.rep([r + 1], 0), [], []],
      o = i[0],
      u = i[1],
      a = i[2],
      f = s[0],
      l = s[1],
      c = s[2],
      h = numeric.rep([r], 0),
      p = numeric.rep([r], 0),
      d,
      v,
      m,
      g,
      y,
      b,
      w,
      E,
      S,
      x,
      T = numeric.ccsLPSolve,
      N = Math.max,
      C = Math.abs,
      k = numeric.linspace(0, r - 1),
      L = numeric.linspace(0, r - 1),
      A = new numeric.ccsDFS(r);typeof n == "undefined" && (n = 1);for (d = 0; d < r; ++d) {
    T(i, t, h, p, d, L, A), b = -1, w = -1;for (v = p.length - 1; v !== -1; --v) {
      m = p[v];if (m <= d) continue;E = C(h[m]), E > b && (w = m, b = E);
    }C(h[d]) < n * b && (v = k[d], b = k[w], k[d] = b, L[b] = d, k[w] = v, L[v] = w, b = h[d], h[d] = h[w], h[w] = b), b = o[d], w = f[d], S = h[d], u[b] = k[d], a[b] = 1, ++b;for (v = p.length - 1; v !== -1; --v) {
      m = p[v], E = h[m], p[v] = 0, h[m] = 0, m <= d ? (l[w] = m, c[w] = E, ++w) : (u[b] = k[m], a[b] = E / S, ++b);
    }o[d + 1] = b, f[d + 1] = w;
  }for (v = u.length - 1; v !== -1; --v) {
    u[v] = L[u[v]];
  }return { L: i, U: s, P: k, Pinv: L };
}, numeric.ccsDFS0 = function (t) {
  this.k = Array(t), this.k1 = Array(t), this.j = Array(t);
}, numeric.ccsDFS0.prototype.dfs = function (t, n, r, i, s, o, u) {
  var a = 0,
      f,
      l = s.length,
      c = this.k,
      h = this.k1,
      p = this.j,
      d,
      v;if (i[t] !== 0) return;i[t] = 1, p[0] = t, c[0] = d = n[o[t]], h[0] = v = n[o[t] + 1];for (;;) {
    if (isNaN(d)) throw new Error("Ow!");if (d >= v) {
      s[l] = o[p[a]];if (a === 0) return;++l, --a, d = c[a], v = h[a];
    } else f = r[d], i[f] === 0 ? (i[f] = 1, c[a] = d, ++a, p[a] = f, f = o[f], d = n[f], h[a] = v = n[f + 1]) : ++d;
  }
}, numeric.ccsLPSolve0 = function (t, n, r, i, s, o, u, a) {
  var f = t[0],
      l = t[1],
      c = t[2],
      h = f.length - 1,
      p = 0,
      d = n[0],
      v = n[1],
      m = n[2],
      g,
      y,
      b,
      w,
      E,
      S,
      x,
      T,
      N,
      C,
      k,
      L;y = d[s], b = d[s + 1], i.length = 0;for (g = y; g < b; ++g) {
    a.dfs(v[g], f, l, r, i, o, u);
  }for (g = i.length - 1; g !== -1; --g) {
    w = i[g], r[u[w]] = 0;
  }for (g = y; g !== b; ++g) {
    w = v[g], r[w] = m[g];
  }for (g = i.length - 1; g !== -1; --g) {
    w = i[g], N = u[w], S = f[w], x = f[w + 1];for (T = S; T < x; ++T) {
      if (l[T] === N) {
        r[N] /= c[T];break;
      }
    }L = r[N];for (T = S; T < x; ++T) {
      r[l[T]] -= L * c[T];
    }r[N] = L;
  }
}, numeric.ccsLUP0 = function (t, n) {
  var r = t[0].length - 1,
      i = [numeric.rep([r + 1], 0), [], []],
      s = [numeric.rep([r + 1], 0), [], []],
      o = i[0],
      u = i[1],
      a = i[2],
      f = s[0],
      l = s[1],
      c = s[2],
      h = numeric.rep([r], 0),
      p = numeric.rep([r], 0),
      d,
      v,
      m,
      g,
      y,
      b,
      w,
      E,
      S,
      x,
      T = numeric.ccsLPSolve0,
      N = Math.max,
      C = Math.abs,
      k = numeric.linspace(0, r - 1),
      L = numeric.linspace(0, r - 1),
      A = new numeric.ccsDFS0(r);typeof n == "undefined" && (n = 1);for (d = 0; d < r; ++d) {
    T(i, t, h, p, d, L, k, A), b = -1, w = -1;for (v = p.length - 1; v !== -1; --v) {
      m = p[v];if (m <= d) continue;E = C(h[k[m]]), E > b && (w = m, b = E);
    }C(h[k[d]]) < n * b && (v = k[d], b = k[w], k[d] = b, L[b] = d, k[w] = v, L[v] = w), b = o[d], w = f[d], S = h[k[d]], u[b] = k[d], a[b] = 1, ++b;for (v = p.length - 1; v !== -1; --v) {
      m = p[v], E = h[k[m]], p[v] = 0, h[k[m]] = 0, m <= d ? (l[w] = m, c[w] = E, ++w) : (u[b] = k[m], a[b] = E / S, ++b);
    }o[d + 1] = b, f[d + 1] = w;
  }for (v = u.length - 1; v !== -1; --v) {
    u[v] = L[u[v]];
  }return { L: i, U: s, P: k, Pinv: L };
}, numeric.ccsLUP = numeric.ccsLUP0, numeric.ccsDim = function (t) {
  return [numeric.sup(t[1]) + 1, t[0].length - 1];
}, numeric.ccsGetBlock = function (t, n, r) {
  var i = numeric.ccsDim(t),
      s = i[0],
      o = i[1];typeof n == "undefined" ? n = numeric.linspace(0, s - 1) : typeof n == "number" && (n = [n]), typeof r == "undefined" ? r = numeric.linspace(0, o - 1) : typeof r == "number" && (r = [r]);var u,
      a,
      f,
      l = n.length,
      c,
      h = r.length,
      p,
      d,
      v,
      m = numeric.rep([o], 0),
      g = [],
      y = [],
      b = [m, g, y],
      w = t[0],
      E = t[1],
      S = t[2],
      x = numeric.rep([s], 0),
      T = 0,
      N = numeric.rep([s], 0);for (c = 0; c < h; ++c) {
    d = r[c];var C = w[d],
        k = w[d + 1];for (u = C; u < k; ++u) {
      p = E[u], N[p] = 1, x[p] = S[u];
    }for (u = 0; u < l; ++u) {
      v = n[u], N[v] && (g[T] = u, y[T] = x[n[u]], ++T);
    }for (u = C; u < k; ++u) {
      p = E[u], N[p] = 0;
    }m[c + 1] = T;
  }return b;
}, numeric.ccsDot = function (t, n) {
  var r = t[0],
      i = t[1],
      s = t[2],
      o = n[0],
      u = n[1],
      a = n[2],
      f = numeric.ccsDim(t),
      l = numeric.ccsDim(n),
      c = f[0],
      h = f[1],
      p = l[1],
      d = numeric.rep([c], 0),
      v = numeric.rep([c], 0),
      m = Array(c),
      g = numeric.rep([p], 0),
      y = [],
      b = [],
      w = [g, y, b],
      E,
      S,
      x,
      T,
      N,
      C,
      k,
      L,
      A,
      O,
      M;for (x = 0; x !== p; ++x) {
    T = o[x], N = o[x + 1], A = 0;for (S = T; S < N; ++S) {
      O = u[S], M = a[S], C = r[O], k = r[O + 1];for (E = C; E < k; ++E) {
        L = i[E], v[L] === 0 && (m[A] = L, v[L] = 1, A += 1), d[L] = d[L] + s[E] * M;
      }
    }T = g[x], N = T + A, g[x + 1] = N;for (S = A - 1; S !== -1; --S) {
      M = T + S, E = m[S], y[M] = E, b[M] = d[E], v[E] = 0, d[E] = 0;
    }g[x + 1] = g[x] + A;
  }return w;
}, numeric.ccsLUPSolve = function (t, n) {
  var r = t.L,
      i = t.U,
      s = t.P,
      o = n[0],
      u = !1;(typeof o === "undefined" ? "undefined" : (0, _typeof3.default)(o)) != "object" && (n = [[0, n.length], numeric.linspace(0, n.length - 1), n], o = n[0], u = !0);var a = n[1],
      f = n[2],
      l = r[0].length - 1,
      c = o.length - 1,
      h = numeric.rep([l], 0),
      p = Array(l),
      d = numeric.rep([l], 0),
      v = Array(l),
      m = numeric.rep([c + 1], 0),
      g = [],
      y = [],
      b = numeric.ccsTSolve,
      w,
      E,
      S,
      x,
      T,
      N,
      C = 0;for (w = 0; w < c; ++w) {
    T = 0, S = o[w], x = o[w + 1];for (E = S; E < x; ++E) {
      N = t.Pinv[a[E]], v[T] = N, d[N] = f[E], ++T;
    }v.length = T, b(r, d, h, v, p);for (E = v.length - 1; E !== -1; --E) {
      d[v[E]] = 0;
    }b(i, h, d, p, v);if (u) return d;for (E = p.length - 1; E !== -1; --E) {
      h[p[E]] = 0;
    }for (E = v.length - 1; E !== -1; --E) {
      N = v[E], g[C] = N, y[C] = d[N], d[N] = 0, ++C;
    }m[w + 1] = C;
  }return [m, g, y];
}, numeric.ccsbinop = function (t, n) {
  return typeof n == "undefined" && (n = ""), Function("X", "Y", "var Xi = X[0], Xj = X[1], Xv = X[2];\nvar Yi = Y[0], Yj = Y[1], Yv = Y[2];\nvar n = Xi.length-1,m = Math.max(numeric.sup(Xj),numeric.sup(Yj))+1;\nvar Zi = numeric.rep([n+1],0), Zj = [], Zv = [];\nvar x = numeric.rep([m],0),y = numeric.rep([m],0);\nvar xk,yk,zk;\nvar i,j,j0,j1,k,p=0;\n" + n + "for(i=0;i<n;++i) {\n" + "  j0 = Xi[i]; j1 = Xi[i+1];\n" + "  for(j=j0;j!==j1;++j) {\n" + "    k = Xj[j];\n" + "    x[k] = 1;\n" + "    Zj[p] = k;\n" + "    ++p;\n" + "  }\n" + "  j0 = Yi[i]; j1 = Yi[i+1];\n" + "  for(j=j0;j!==j1;++j) {\n" + "    k = Yj[j];\n" + "    y[k] = Yv[j];\n" + "    if(x[k] === 0) {\n" + "      Zj[p] = k;\n" + "      ++p;\n" + "    }\n" + "  }\n" + "  Zi[i+1] = p;\n" + "  j0 = Xi[i]; j1 = Xi[i+1];\n" + "  for(j=j0;j!==j1;++j) x[Xj[j]] = Xv[j];\n" + "  j0 = Zi[i]; j1 = Zi[i+1];\n" + "  for(j=j0;j!==j1;++j) {\n" + "    k = Zj[j];\n" + "    xk = x[k];\n" + "    yk = y[k];\n" + t + "\n" + "    Zv[j] = zk;\n" + "  }\n" + "  j0 = Xi[i]; j1 = Xi[i+1];\n" + "  for(j=j0;j!==j1;++j) x[Xj[j]] = 0;\n" + "  j0 = Yi[i]; j1 = Yi[i+1];\n" + "  for(j=j0;j!==j1;++j) y[Yj[j]] = 0;\n" + "}\n" + "return [Zi,Zj,Zv];");
}, function () {
  var k, A, B, C;for (k in numeric.ops2) {
    isFinite(eval("1" + numeric.ops2[k] + "0")) ? A = "[Y[0],Y[1],numeric." + k + "(X,Y[2])]" : A = "NaN", isFinite(eval("0" + numeric.ops2[k] + "1")) ? B = "[X[0],X[1],numeric." + k + "(X[2],Y)]" : B = "NaN", isFinite(eval("1" + numeric.ops2[k] + "0")) && isFinite(eval("0" + numeric.ops2[k] + "1")) ? C = "numeric.ccs" + k + "MM(X,Y)" : C = "NaN", numeric["ccs" + k + "MM"] = numeric.ccsbinop("zk = xk " + numeric.ops2[k] + "yk;"), numeric["ccs" + k] = Function("X", "Y", 'if(typeof X === "number") return ' + A + ";\n" + 'if(typeof Y === "number") return ' + B + ";\n" + "return " + C + ";\n");
  }
}(), numeric.ccsScatter = function (t) {
  var n = t[0],
      r = t[1],
      i = t[2],
      s = numeric.sup(r) + 1,
      o = n.length,
      u = numeric.rep([s], 0),
      a = Array(o),
      f = Array(o),
      l = numeric.rep([s], 0),
      c;for (c = 0; c < o; ++c) {
    l[r[c]]++;
  }for (c = 0; c < s; ++c) {
    u[c + 1] = u[c] + l[c];
  }var h = u.slice(0),
      p,
      d;for (c = 0; c < o; ++c) {
    d = r[c], p = h[d], a[p] = n[c], f[p] = i[c], h[d] = h[d] + 1;
  }return [u, a, f];
}, numeric.ccsGather = function (t) {
  var n = t[0],
      r = t[1],
      i = t[2],
      s = n.length - 1,
      o = r.length,
      u = Array(o),
      a = Array(o),
      f = Array(o),
      l,
      c,
      h,
      p,
      d;d = 0;for (l = 0; l < s; ++l) {
    h = n[l], p = n[l + 1];for (c = h; c !== p; ++c) {
      a[d] = l, u[d] = r[c], f[d] = i[c], ++d;
    }
  }return [u, a, f];
}, numeric.sdim = function dim(e, t, n) {
  typeof t == "undefined" && (t = []);if ((typeof e === "undefined" ? "undefined" : (0, _typeof3.default)(e)) != "object") return t;typeof n == "undefined" && (n = 0), n in t || (t[n] = 0), e.length > t[n] && (t[n] = e.length);var r;for (r in e) {
    e.hasOwnProperty(r) && dim(e[r], t, n + 1);
  }return t;
}, numeric.sclone = function clone(e, t, n) {
  typeof t == "undefined" && (t = 0), typeof n == "undefined" && (n = numeric.sdim(e).length);var r,
      i = Array(e.length);if (t === n - 1) {
    for (r in e) {
      e.hasOwnProperty(r) && (i[r] = e[r]);
    }return i;
  }for (r in e) {
    e.hasOwnProperty(r) && (i[r] = clone(e[r], t + 1, n));
  }return i;
}, numeric.sdiag = function (t) {
  var n = t.length,
      r,
      i = Array(n),
      s,
      o,
      u;for (r = n - 1; r >= 1; r -= 2) {
    s = r - 1, i[r] = [], i[r][r] = t[r], i[s] = [], i[s][s] = t[s];
  }return r === 0 && (i[0] = [], i[0][0] = t[r]), i;
}, numeric.sidentity = function (t) {
  return numeric.sdiag(numeric.rep([t], 1));
}, numeric.stranspose = function (t) {
  var n = [],
      r = t.length,
      i,
      s,
      o;for (i in t) {
    if (!t.hasOwnProperty(i)) continue;o = t[i];for (s in o) {
      if (!o.hasOwnProperty(s)) continue;(0, _typeof3.default)(n[s]) != "object" && (n[s] = []), n[s][i] = o[s];
    }
  }return n;
}, numeric.sLUP = function (t, n) {
  throw new Error("The function numeric.sLUP had a bug in it and has been removed. Please use the new numeric.ccsLUP function instead.");
}, numeric.sdotMM = function (t, n) {
  var r = t.length,
      i = n.length,
      s = numeric.stranspose(n),
      o = s.length,
      u,
      a,
      f,
      l,
      c,
      h,
      p = Array(r),
      d;for (f = r - 1; f >= 0; f--) {
    d = [], u = t[f];for (c = o - 1; c >= 0; c--) {
      h = 0, a = s[c];for (l in u) {
        if (!u.hasOwnProperty(l)) continue;l in a && (h += u[l] * a[l]);
      }h && (d[c] = h);
    }p[f] = d;
  }return p;
}, numeric.sdotMV = function (t, n) {
  var r = t.length,
      i,
      s,
      o,
      u = Array(r),
      a;for (s = r - 1; s >= 0; s--) {
    i = t[s], a = 0;for (o in i) {
      if (!i.hasOwnProperty(o)) continue;n[o] && (a += i[o] * n[o]);
    }a && (u[s] = a);
  }return u;
}, numeric.sdotVM = function (t, n) {
  var r,
      i,
      s,
      o,
      u = [],
      a;for (r in t) {
    if (!t.hasOwnProperty(r)) continue;s = n[r], o = t[r];for (i in s) {
      if (!s.hasOwnProperty(i)) continue;u[i] || (u[i] = 0), u[i] += o * s[i];
    }
  }return u;
}, numeric.sdotVV = function (t, n) {
  var r,
      i = 0;for (r in t) {
    t[r] && n[r] && (i += t[r] * n[r]);
  }return i;
}, numeric.sdot = function (t, n) {
  var r = numeric.sdim(t).length,
      i = numeric.sdim(n).length,
      s = r * 1e3 + i;switch (s) {case 0:
      return t * n;case 1001:
      return numeric.sdotVV(t, n);case 2001:
      return numeric.sdotMV(t, n);case 1002:
      return numeric.sdotVM(t, n);case 2002:
      return numeric.sdotMM(t, n);default:
      throw new Error("numeric.sdot not implemented for tensors of order " + r + " and " + i);}
}, numeric.sscatter = function (t) {
  var n = t[0].length,
      r,
      i,
      s,
      o = t.length,
      u = [],
      a;for (i = n - 1; i >= 0; --i) {
    if (!t[o - 1][i]) continue;a = u;for (s = 0; s < o - 2; s++) {
      r = t[s][i], a[r] || (a[r] = []), a = a[r];
    }a[t[s][i]] = t[s + 1][i];
  }return u;
}, numeric.sgather = function gather(e, t, n) {
  typeof t == "undefined" && (t = []), typeof n == "undefined" && (n = []);var r, i, s;r = n.length;for (i in e) {
    if (e.hasOwnProperty(i)) {
      n[r] = parseInt(i), s = e[i];if (typeof s == "number") {
        if (s) {
          if (t.length === 0) for (i = r + 1; i >= 0; --i) {
            t[i] = [];
          }for (i = r; i >= 0; --i) {
            t[i].push(n[i]);
          }t[r + 1].push(s);
        }
      } else gather(s, t, n);
    }
  }return n.length > r && n.pop(), t;
}, numeric.cLU = function (t) {
  var n = t[0],
      r = t[1],
      i = t[2],
      s = n.length,
      o = 0,
      u,
      a,
      f,
      l,
      c,
      h;for (u = 0; u < s; u++) {
    n[u] > o && (o = n[u]);
  }o++;var p = Array(o),
      d = Array(o),
      v = numeric.rep([o], Infinity),
      m = numeric.rep([o], -Infinity),
      g,
      y,
      b;for (f = 0; f < s; f++) {
    u = n[f], a = r[f], a < v[u] && (v[u] = a), a > m[u] && (m[u] = a);
  }for (u = 0; u < o - 1; u++) {
    m[u] > m[u + 1] && (m[u + 1] = m[u]);
  }for (u = o - 1; u >= 1; u--) {
    v[u] < v[u - 1] && (v[u - 1] = v[u]);
  }var w = 0,
      E = 0;for (u = 0; u < o; u++) {
    d[u] = numeric.rep([m[u] - v[u] + 1], 0), p[u] = numeric.rep([u - v[u]], 0), w += u - v[u] + 1, E += m[u] - u + 1;
  }for (f = 0; f < s; f++) {
    u = n[f], d[u][r[f] - v[u]] = i[f];
  }for (u = 0; u < o - 1; u++) {
    l = u - v[u], g = d[u];for (a = u + 1; v[a] <= u && a < o; a++) {
      c = u - v[a], h = m[u] - u, y = d[a], b = y[c] / g[l];if (b) {
        for (f = 1; f <= h; f++) {
          y[f + c] -= b * g[f + l];
        }p[a][u - v[a]] = b;
      }
    }
  }var g = [],
      y = [],
      S = [],
      x = [],
      T = [],
      N = [],
      s,
      C,
      k;s = 0, C = 0;for (u = 0; u < o; u++) {
    l = v[u], c = m[u], k = d[u];for (a = u; a <= c; a++) {
      k[a - l] && (g[s] = u, y[s] = a, S[s] = k[a - l], s++);
    }k = p[u];for (a = l; a < u; a++) {
      k[a - l] && (x[C] = u, T[C] = a, N[C] = k[a - l], C++);
    }x[C] = u, T[C] = u, N[C] = 1, C++;
  }return { U: [g, y, S], L: [x, T, N] };
}, numeric.cLUsolve = function (t, n) {
  var r = t.L,
      i = t.U,
      s = numeric.clone(n),
      o = r[0],
      u = r[1],
      a = r[2],
      f = i[0],
      l = i[1],
      c = i[2],
      h = f.length,
      p = o.length,
      d = s.length,
      v,
      m,
      g;g = 0;for (v = 0; v < d; v++) {
    while (u[g] < v) {
      s[v] -= a[g] * s[u[g]], g++;
    }g++;
  }g = h - 1;for (v = d - 1; v >= 0; v--) {
    while (l[g] > v) {
      s[v] -= c[g] * s[l[g]], g--;
    }s[v] /= c[g], g--;
  }return s;
}, numeric.cgrid = function (t, n) {
  typeof t == "number" && (t = [t, t]);var r = numeric.rep(t, -1),
      i,
      s,
      o;if (typeof n != "function") switch (n) {case "L":
      n = function n(e, _n3) {
        return e >= t[0] / 2 || _n3 < t[1] / 2;
      };break;default:
      n = function n(e, t) {
        return !0;
      };}o = 0;for (i = 1; i < t[0] - 1; i++) {
    for (s = 1; s < t[1] - 1; s++) {
      n(i, s) && (r[i][s] = o, o++);
    }
  }return r;
}, numeric.cdelsq = function (t) {
  var n = [[-1, 0], [0, -1], [0, 1], [1, 0]],
      r = numeric.dim(t),
      i = r[0],
      s = r[1],
      o,
      u,
      a,
      f,
      l,
      c = [],
      h = [],
      p = [];for (o = 1; o < i - 1; o++) {
    for (u = 1; u < s - 1; u++) {
      if (t[o][u] < 0) continue;for (a = 0; a < 4; a++) {
        f = o + n[a][0], l = u + n[a][1];if (t[f][l] < 0) continue;c.push(t[o][u]), h.push(t[f][l]), p.push(-1);
      }c.push(t[o][u]), h.push(t[o][u]), p.push(4);
    }
  }return [c, h, p];
}, numeric.cdotMV = function (t, n) {
  var r,
      i = t[0],
      s = t[1],
      o = t[2],
      u,
      a = i.length,
      f;f = 0;for (u = 0; u < a; u++) {
    i[u] > f && (f = i[u]);
  }f++, r = numeric.rep([f], 0);for (u = 0; u < a; u++) {
    r[i[u]] += o[u] * n[s[u]];
  }return r;
}, numeric.Spline = function (t, n, r, i, s) {
  this.x = t, this.yl = n, this.yr = r, this.kl = i, this.kr = s;
}, numeric.Spline.prototype._at = function (t, n) {
  var r = this.x,
      i = this.yl,
      s = this.yr,
      o = this.kl,
      u = this.kr,
      t,
      a,
      f,
      l,
      c = numeric.add,
      h = numeric.sub,
      p = numeric.mul;a = h(p(o[n], r[n + 1] - r[n]), h(s[n + 1], i[n])), f = c(p(u[n + 1], r[n] - r[n + 1]), h(s[n + 1], i[n])), l = (t - r[n]) / (r[n + 1] - r[n]);var d = l * (1 - l);return c(c(c(p(1 - l, i[n]), p(l, s[n + 1])), p(a, d * (1 - l))), p(f, d * l));
}, numeric.Spline.prototype.at = function (t) {
  if (typeof t == "number") {
    var n = this.x,
        r = n.length,
        i,
        s,
        o,
        u = Math.floor,
        a,
        f,
        l;i = 0, s = r - 1;while (s - i > 1) {
      o = u((i + s) / 2), n[o] <= t ? i = o : s = o;
    }return this._at(t, i);
  }var r = t.length,
      c,
      h = Array(r);for (c = r - 1; c !== -1; --c) {
    h[c] = this.at(t[c]);
  }return h;
}, numeric.Spline.prototype.diff = function () {
  var t = this.x,
      n = this.yl,
      r = this.yr,
      i = this.kl,
      s = this.kr,
      o = n.length,
      u,
      a,
      f,
      l = i,
      c = s,
      h = Array(o),
      p = Array(o),
      d = numeric.add,
      v = numeric.mul,
      m = numeric.div,
      g = numeric.sub;for (u = o - 1; u !== -1; --u) {
    a = t[u + 1] - t[u], f = g(r[u + 1], n[u]), h[u] = m(d(v(f, 6), v(i[u], -4 * a), v(s[u + 1], -2 * a)), a * a), p[u + 1] = m(d(v(f, -6), v(i[u], 2 * a), v(s[u + 1], 4 * a)), a * a);
  }return new numeric.Spline(t, l, c, h, p);
}, numeric.Spline.prototype.roots = function () {
  function t(e) {
    return e * e;
  }function n(e, t, n, r, i) {
    var s = n * 2 - (t - e),
        o = -r * 2 + (t - e),
        u = (i + 1) * .5,
        a = u * (1 - u);return (1 - u) * e + u * t + s * a * (1 - u) + o * a * u;
  }var r = [],
      i = this.x,
      s = this.yl,
      o = this.yr,
      u = this.kl,
      a = this.kr;typeof s[0] == "number" && (s = [s], o = [o], u = [u], a = [a]);var f = s.length,
      l = i.length - 1,
      c,
      h,
      p,
      d,
      v,
      m,
      g,
      y,
      b,
      w,
      r = Array(f),
      E,
      S,
      x,
      T,
      N,
      C,
      k,
      L,
      A,
      O,
      M,
      _,
      D,
      P,
      H,
      B,
      j,
      F = Math.sqrt;for (c = 0; c !== f; ++c) {
    g = s[c], y = o[c], b = u[c], w = a[c], E = [];for (h = 0; h !== l; h++) {
      h > 0 && y[h] * g[h] < 0 && E.push(i[h]), A = i[h + 1] - i[h], O = i[h], T = g[h], N = y[h + 1], S = b[h] / A, x = w[h + 1] / A, L = t(S - x + 3 * (T - N)) + 12 * x * T, C = x + 3 * T + 2 * S - 3 * N, k = 3 * (x + S + 2 * (T - N)), L <= 0 ? (_ = C / k, _ > i[h] && _ < i[h + 1] ? M = [i[h], _, i[h + 1]] : M = [i[h], i[h + 1]]) : (_ = (C - F(L)) / k, D = (C + F(L)) / k, M = [i[h]], _ > i[h] && _ < i[h + 1] && M.push(_), D > i[h] && D < i[h + 1] && M.push(D), M.push(i[h + 1])), H = M[0], _ = this._at(H, h);for (p = 0; p < M.length - 1; p++) {
        B = M[p + 1], D = this._at(B, h);if (_ === 0) {
          E.push(H), H = B, _ = D;continue;
        }if (D === 0 || _ * D > 0) {
          H = B, _ = D;continue;
        }var I = 0;for (;;) {
          j = (_ * B - D * H) / (_ - D);if (j <= H || j >= B) break;P = this._at(j, h);if (P * D > 0) B = j, D = P, I === -1 && (_ *= .5), I = -1;else {
            if (!(P * _ > 0)) break;H = j, _ = P, I === 1 && (D *= .5), I = 1;
          }
        }E.push(j), H = M[p + 1], _ = this._at(H, h);
      }D === 0 && E.push(B);
    }r[c] = E;
  }return typeof this.yl[0] == "number" ? r[0] : r;
}, numeric.spline = function (t, n, r, i) {
  var s = t.length,
      o = [],
      u = [],
      a = [],
      f,
      l = numeric.sub,
      c = numeric.mul,
      h = numeric.add;for (f = s - 2; f >= 0; f--) {
    u[f] = t[f + 1] - t[f], a[f] = l(n[f + 1], n[f]);
  }if (typeof r == "string" || typeof i == "string") r = i = "periodic";var p = [[], [], []];switch (typeof r === "undefined" ? "undefined" : (0, _typeof3.default)(r)) {case "undefined":
      o[0] = c(3 / (u[0] * u[0]), a[0]), p[0].push(0, 0), p[1].push(0, 1), p[2].push(2 / u[0], 1 / u[0]);break;case "string":
      o[0] = h(c(3 / (u[s - 2] * u[s - 2]), a[s - 2]), c(3 / (u[0] * u[0]), a[0])), p[0].push(0, 0, 0), p[1].push(s - 2, 0, 1), p[2].push(1 / u[s - 2], 2 / u[s - 2] + 2 / u[0], 1 / u[0]);break;default:
      o[0] = r, p[0].push(0), p[1].push(0), p[2].push(1);}for (f = 1; f < s - 1; f++) {
    o[f] = h(c(3 / (u[f - 1] * u[f - 1]), a[f - 1]), c(3 / (u[f] * u[f]), a[f])), p[0].push(f, f, f), p[1].push(f - 1, f, f + 1), p[2].push(1 / u[f - 1], 2 / u[f - 1] + 2 / u[f], 1 / u[f]);
  }switch (typeof i === "undefined" ? "undefined" : (0, _typeof3.default)(i)) {case "undefined":
      o[s - 1] = c(3 / (u[s - 2] * u[s - 2]), a[s - 2]), p[0].push(s - 1, s - 1), p[1].push(s - 2, s - 1), p[2].push(1 / u[s - 2], 2 / u[s - 2]);break;case "string":
      p[1][p[1].length - 1] = 0;break;default:
      o[s - 1] = i, p[0].push(s - 1), p[1].push(s - 1), p[2].push(1);}typeof o[0] != "number" ? o = numeric.transpose(o) : o = [o];var d = Array(o.length);if (typeof r == "string") for (f = d.length - 1; f !== -1; --f) {
    d[f] = numeric.ccsLUPSolve(numeric.ccsLUP(numeric.ccsScatter(p)), o[f]), d[f][s - 1] = d[f][0];
  } else for (f = d.length - 1; f !== -1; --f) {
    d[f] = numeric.cLUsolve(numeric.cLU(p), o[f]);
  }return typeof n[0] == "number" ? d = d[0] : d = numeric.transpose(d), new numeric.Spline(t, n, n, d, d);
}, numeric.fftpow2 = function fftpow2(e, t) {
  var n = e.length;if (n === 1) return;var r = Math.cos,
      i = Math.sin,
      s,
      o,
      u = Array(n / 2),
      a = Array(n / 2),
      f = Array(n / 2),
      l = Array(n / 2);o = n / 2;for (s = n - 1; s !== -1; --s) {
    --o, f[o] = e[s], l[o] = t[s], --s, u[o] = e[s], a[o] = t[s];
  }fftpow2(u, a), fftpow2(f, l), o = n / 2;var c,
      h = -6.283185307179586 / n,
      p,
      d;for (s = n - 1; s !== -1; --s) {
    --o, o === -1 && (o = n / 2 - 1), c = h * s, p = r(c), d = i(c), e[s] = u[o] + p * f[o] - d * l[o], t[s] = a[o] + p * l[o] + d * f[o];
  }
}, numeric._ifftpow2 = function _ifftpow2(e, t) {
  var n = e.length;if (n === 1) return;var r = Math.cos,
      i = Math.sin,
      s,
      o,
      u = Array(n / 2),
      a = Array(n / 2),
      f = Array(n / 2),
      l = Array(n / 2);o = n / 2;for (s = n - 1; s !== -1; --s) {
    --o, f[o] = e[s], l[o] = t[s], --s, u[o] = e[s], a[o] = t[s];
  }_ifftpow2(u, a), _ifftpow2(f, l), o = n / 2;var c,
      h = 6.283185307179586 / n,
      p,
      d;for (s = n - 1; s !== -1; --s) {
    --o, o === -1 && (o = n / 2 - 1), c = h * s, p = r(c), d = i(c), e[s] = u[o] + p * f[o] - d * l[o], t[s] = a[o] + p * l[o] + d * f[o];
  }
}, numeric.ifftpow2 = function (t, n) {
  numeric._ifftpow2(t, n), numeric.diveq(t, t.length), numeric.diveq(n, n.length);
}, numeric.convpow2 = function (t, n, r, i) {
  numeric.fftpow2(t, n), numeric.fftpow2(r, i);var s,
      o = t.length,
      u,
      a,
      f,
      l;for (s = o - 1; s !== -1; --s) {
    u = t[s], f = n[s], a = r[s], l = i[s], t[s] = u * a - f * l, n[s] = u * l + f * a;
  }numeric.ifftpow2(t, n);
}, numeric.T.prototype.fft = function () {
  var t = this.x,
      n = this.y,
      r = t.length,
      i = Math.log,
      s = i(2),
      o = Math.ceil(i(2 * r - 1) / s),
      u = Math.pow(2, o),
      a = numeric.rep([u], 0),
      f = numeric.rep([u], 0),
      l = Math.cos,
      c = Math.sin,
      h,
      p = -3.141592653589793 / r,
      d,
      v = numeric.rep([u], 0),
      m = numeric.rep([u], 0),
      g = Math.floor(r / 2);for (h = 0; h < r; h++) {
    v[h] = t[h];
  }if (typeof n != "undefined") for (h = 0; h < r; h++) {
    m[h] = n[h];
  }a[0] = 1;for (h = 1; h <= u / 2; h++) {
    d = p * h * h, a[h] = l(d), f[h] = c(d), a[u - h] = l(d), f[u - h] = c(d);
  }var y = new numeric.T(v, m),
      b = new numeric.T(a, f);return y = y.mul(b), numeric.convpow2(y.x, y.y, numeric.clone(b.x), numeric.neg(b.y)), y = y.mul(b), y.x.length = r, y.y.length = r, y;
}, numeric.T.prototype.ifft = function () {
  var t = this.x,
      n = this.y,
      r = t.length,
      i = Math.log,
      s = i(2),
      o = Math.ceil(i(2 * r - 1) / s),
      u = Math.pow(2, o),
      a = numeric.rep([u], 0),
      f = numeric.rep([u], 0),
      l = Math.cos,
      c = Math.sin,
      h,
      p = 3.141592653589793 / r,
      d,
      v = numeric.rep([u], 0),
      m = numeric.rep([u], 0),
      g = Math.floor(r / 2);for (h = 0; h < r; h++) {
    v[h] = t[h];
  }if (typeof n != "undefined") for (h = 0; h < r; h++) {
    m[h] = n[h];
  }a[0] = 1;for (h = 1; h <= u / 2; h++) {
    d = p * h * h, a[h] = l(d), f[h] = c(d), a[u - h] = l(d), f[u - h] = c(d);
  }var y = new numeric.T(v, m),
      b = new numeric.T(a, f);return y = y.mul(b), numeric.convpow2(y.x, y.y, numeric.clone(b.x), numeric.neg(b.y)), y = y.mul(b), y.x.length = r, y.y.length = r, y.div(r);
}, numeric.gradient = function (t, n) {
  var r = n.length,
      i = t(n);if (isNaN(i)) throw new Error("gradient: f(x) is a NaN!");var s = Math.max,
      o,
      u = numeric.clone(n),
      a,
      f,
      l = Array(r),
      c = numeric.div,
      h = numeric.sub,
      p,
      d,
      s = Math.max,
      v = .001,
      m = Math.abs,
      g = Math.min,
      y,
      b,
      w,
      E = 0,
      S,
      x,
      T;for (o = 0; o < r; o++) {
    var N = s(1e-6 * i, 1e-8);for (;;) {
      ++E;if (E > 20) throw new Error("Numerical gradient fails");u[o] = n[o] + N, a = t(u), u[o] = n[o] - N, f = t(u), u[o] = n[o];if (isNaN(a) || isNaN(f)) {
        N /= 16;continue;
      }l[o] = (a - f) / (2 * N), y = n[o] - N, b = n[o], w = n[o] + N, S = (a - i) / N, x = (i - f) / N, T = s(m(l[o]), m(i), m(a), m(f), m(y), m(b), m(w), 1e-8), p = g(s(m(S - l[o]), m(x - l[o]), m(S - x)) / T, N / T);if (!(p > v)) break;N /= 16;
    }
  }return l;
}, numeric.uncmin = function (t, n, r, i, s, o, u) {
  var a = numeric.gradient;typeof u == "undefined" && (u = {}), typeof r == "undefined" && (r = 1e-8), typeof i == "undefined" && (i = function i(e) {
    return a(t, e);
  }), typeof s == "undefined" && (s = 1e3), n = numeric.clone(n);var f = n.length,
      l = t(n),
      c,
      h;if (isNaN(l)) throw new Error("uncmin: f(x0) is a NaN!");var p = Math.max,
      d = numeric.norm2;r = p(r, numeric.epsilon);var v,
      m,
      g,
      y = u.Hinv || numeric.identity(f),
      b = numeric.dot,
      w = numeric.inv,
      E = numeric.sub,
      S = numeric.add,
      x = numeric.tensor,
      T = numeric.div,
      N = numeric.mul,
      C = numeric.all,
      k = numeric.isFinite,
      L = numeric.neg,
      A = 0,
      O,
      M,
      _,
      D,
      P,
      H,
      B,
      j,
      F,
      I,
      q,
      R,
      U = "";m = i(n);while (A < s) {
    if (typeof o == "function" && o(A, n, l, m, y)) {
      U = "Callback returned true";break;
    }if (!C(k(m))) {
      U = "Gradient has Infinity or NaN";break;
    }v = L(b(y, m));if (!C(k(v))) {
      U = "Search direction has Infinity or NaN";break;
    }I = d(v);if (I < r) {
      U = "Newton step smaller than tol";break;
    }F = 1, h = b(m, v), _ = n;while (A < s) {
      if (F * I < r) break;M = N(v, F), _ = S(n, M), c = t(_);if (c - l >= .1 * F * h || isNaN(c)) {
        F *= .5, ++A;continue;
      }break;
    }if (F * I < r) {
      U = "Line search step size smaller than tol";break;
    }if (A === s) {
      U = "maxit reached during line search";break;
    }g = i(_), D = E(g, m), B = b(D, M), P = b(y, D), y = E(S(y, N((B + b(D, P)) / (B * B), x(M, M))), T(S(x(P, M), x(M, P)), B)), n = _, l = c, m = g, ++A;
  }return { solution: n, f: l, gradient: m, invHessian: y, iterations: A, message: U };
}, numeric.Dopri = function (t, n, r, i, s, o, u) {
  this.x = t, this.y = n, this.f = r, this.ymid = i, this.iterations = s, this.events = u, this.message = o;
}, numeric.Dopri.prototype._at = function (t, n) {
  function r(e) {
    return e * e;
  }var i = this,
      s = i.x,
      o = i.y,
      u = i.f,
      a = i.ymid,
      f = s.length,
      l,
      c,
      h,
      p,
      d,
      v,
      t,
      m = Math.floor,
      g,
      y = .5,
      b = numeric.add,
      w = numeric.mul,
      E = numeric.sub,
      S,
      x,
      T;return l = s[n], c = s[n + 1], p = o[n], d = o[n + 1], g = c - l, h = l + y * g, v = a[n], S = E(u[n], w(p, 1 / (l - h) + 2 / (l - c))), x = E(u[n + 1], w(d, 1 / (c - h) + 2 / (c - l))), T = [r(t - c) * (t - h) / r(l - c) / (l - h), r(t - l) * r(t - c) / r(l - h) / r(c - h), r(t - l) * (t - h) / r(c - l) / (c - h), (t - l) * r(t - c) * (t - h) / r(l - c) / (l - h), (t - c) * r(t - l) * (t - h) / r(l - c) / (c - h)], b(b(b(b(w(p, T[0]), w(v, T[1])), w(d, T[2])), w(S, T[3])), w(x, T[4]));
}, numeric.Dopri.prototype.at = function (t) {
  var n,
      r,
      i,
      s = Math.floor;if (typeof t != "number") {
    var o = t.length,
        u = Array(o);for (n = o - 1; n !== -1; --n) {
      u[n] = this.at(t[n]);
    }return u;
  }var a = this.x;n = 0, r = a.length - 1;while (r - n > 1) {
    i = s(.5 * (n + r)), a[i] <= t ? n = i : r = i;
  }return this._at(t, n);
}, numeric.dopri = function (t, n, r, i, s, o, u) {
  typeof s == "undefined" && (s = 1e-6), typeof o == "undefined" && (o = 1e3);var a = [t],
      f = [r],
      l = [i(t, r)],
      c,
      h,
      p,
      d,
      v,
      m,
      g = [],
      y = .2,
      b = [.075, .225],
      w = [44 / 45, -56 / 15, 32 / 9],
      E = [19372 / 6561, -25360 / 2187, 64448 / 6561, -212 / 729],
      S = [9017 / 3168, -355 / 33, 46732 / 5247, 49 / 176, -5103 / 18656],
      x = [35 / 384, 0, 500 / 1113, 125 / 192, -2187 / 6784, 11 / 84],
      T = [.10013431883002395, 0, .3918321794184259, -0.02982460176594817, .05893268337240795, -0.04497888809104361, .023904308236133973],
      N = [.2, .3, .8, 8 / 9, 1, 1],
      C = [-71 / 57600, 0, 71 / 16695, -71 / 1920, 17253 / 339200, -22 / 525, .025],
      k = 0,
      L,
      A,
      O = (n - t) / 10,
      M = 0,
      _ = numeric.add,
      D = numeric.mul,
      P,
      H,
      B = Math.max,
      j = Math.min,
      F = Math.abs,
      I = numeric.norminf,
      q = Math.pow,
      R = numeric.any,
      U = numeric.lt,
      z = numeric.and,
      W = numeric.sub,
      X,
      V,
      $,
      J = new numeric.Dopri(a, f, l, g, -1, "");typeof u == "function" && (X = u(t, r));while (t < n && M < o) {
    ++M, t + O > n && (O = n - t), c = i(t + N[0] * O, _(r, D(y * O, l[k]))), h = i(t + N[1] * O, _(_(r, D(b[0] * O, l[k])), D(b[1] * O, c))), p = i(t + N[2] * O, _(_(_(r, D(w[0] * O, l[k])), D(w[1] * O, c)), D(w[2] * O, h))), d = i(t + N[3] * O, _(_(_(_(r, D(E[0] * O, l[k])), D(E[1] * O, c)), D(E[2] * O, h)), D(E[3] * O, p))), v = i(t + N[4] * O, _(_(_(_(_(r, D(S[0] * O, l[k])), D(S[1] * O, c)), D(S[2] * O, h)), D(S[3] * O, p)), D(S[4] * O, d))), P = _(_(_(_(_(r, D(l[k], O * x[0])), D(h, O * x[2])), D(p, O * x[3])), D(d, O * x[4])), D(v, O * x[5])), m = i(t + O, P), L = _(_(_(_(_(D(l[k], O * C[0]), D(h, O * C[2])), D(p, O * C[3])), D(d, O * C[4])), D(v, O * C[5])), D(m, O * C[6])), typeof L == "number" ? H = F(L) : H = I(L);if (H > s) {
      O = .2 * O * q(s / H, .25);if (t + O === t) {
        J.msg = "Step size became too small";break;
      }continue;
    }g[k] = _(_(_(_(_(_(r, D(l[k], O * T[0])), D(h, O * T[2])), D(p, O * T[3])), D(d, O * T[4])), D(v, O * T[5])), D(m, O * T[6])), ++k, a[k] = t + O, f[k] = P, l[k] = m;if (typeof u == "function") {
      var K,
          Q = t,
          G = t + .5 * O,
          Y;V = u(G, g[k - 1]), $ = z(U(X, 0), U(0, V)), R($) || (Q = G, G = t + O, X = V, V = u(G, P), $ = z(U(X, 0), U(0, V)));if (R($)) {
        var Z,
            et,
            tt,
            nt,
            rt = 0,
            it = 1,
            st = 1;for (;;) {
          if (typeof X == "number") Y = (st * V * Q - it * X * G) / (st * V - it * X);else {
            Y = G;for (A = X.length - 1; A !== -1; --A) {
              X[A] < 0 && V[A] > 0 && (Y = j(Y, (st * V[A] * Q - it * X[A] * G) / (st * V[A] - it * X[A])));
            }
          }if (Y <= Q || Y >= G) break;K = J._at(Y, k - 1), nt = u(Y, K), tt = z(U(X, 0), U(0, nt)), R(tt) ? (G = Y, V = nt, $ = tt, st = 1, rt === -1 ? it *= .5 : it = 1, rt = -1) : (Q = Y, X = nt, it = 1, rt === 1 ? st *= .5 : st = 1, rt = 1);
        }return P = J._at(.5 * (t + Y), k - 1), J.f[k] = i(Y, K), J.x[k] = Y, J.y[k] = K, J.ymid[k - 1] = P, J.events = $, J.iterations = M, J;
      }
    }t += O, r = P, X = V, O = j(.8 * O * q(s / H, .25), 4 * O);
  }return J.iterations = M, J;
}, numeric.LU = function (e, t) {
  t = t || !1;var n = Math.abs,
      r,
      i,
      s,
      o,
      u,
      a,
      f,
      l,
      c,
      h = e.length,
      p = h - 1,
      d = new Array(h);t || (e = numeric.clone(e));for (s = 0; s < h; ++s) {
    f = s, a = e[s], c = n(a[s]);for (i = s + 1; i < h; ++i) {
      o = n(e[i][s]), c < o && (c = o, f = i);
    }d[s] = f, f != s && (e[s] = e[f], e[f] = a, a = e[s]), u = a[s];for (r = s + 1; r < h; ++r) {
      e[r][s] /= u;
    }for (r = s + 1; r < h; ++r) {
      l = e[r];for (i = s + 1; i < p; ++i) {
        l[i] -= l[s] * a[i], ++i, l[i] -= l[s] * a[i];
      }i === p && (l[i] -= l[s] * a[i]);
    }
  }return { LU: e, P: d };
}, numeric.LUsolve = function (t, n) {
  var r,
      i,
      s = t.LU,
      o = s.length,
      u = numeric.clone(n),
      a = t.P,
      f,
      l,
      c,
      h;for (r = o - 1; r !== -1; --r) {
    u[r] = n[r];
  }for (r = 0; r < o; ++r) {
    f = a[r], a[r] !== r && (h = u[r], u[r] = u[f], u[f] = h), l = s[r];for (i = 0; i < r; ++i) {
      u[r] -= u[i] * l[i];
    }
  }for (r = o - 1; r >= 0; --r) {
    l = s[r];for (i = r + 1; i < o; ++i) {
      u[r] -= u[i] * l[i];
    }u[r] /= l[r];
  }return u;
}, numeric.solve = function (t, n, r) {
  return numeric.LUsolve(numeric.LU(t, r), n);
}, numeric.echelonize = function (t) {
  var n = numeric.dim(t),
      r = n[0],
      i = n[1],
      s = numeric.identity(r),
      o = Array(r),
      u,
      a,
      f,
      l,
      c,
      h,
      p,
      d,
      v = Math.abs,
      m = numeric.diveq;t = numeric.clone(t);for (u = 0; u < r; ++u) {
    f = 0, c = t[u], h = s[u];for (a = 1; a < i; ++a) {
      v(c[f]) < v(c[a]) && (f = a);
    }o[u] = f, m(h, c[f]), m(c, c[f]);for (a = 0; a < r; ++a) {
      if (a !== u) {
        p = t[a], d = p[f];for (l = i - 1; l !== -1; --l) {
          p[l] -= c[l] * d;
        }p = s[a];for (l = r - 1; l !== -1; --l) {
          p[l] -= h[l] * d;
        }
      }
    }
  }return { I: s, A: t, P: o };
}, numeric.__solveLP = function (t, n, r, i, s, o, u) {
  var a = numeric.sum,
      f = numeric.log,
      l = numeric.mul,
      c = numeric.sub,
      h = numeric.dot,
      p = numeric.div,
      d = numeric.add,
      v = t.length,
      m = r.length,
      g,
      y = !1,
      b,
      w = 0,
      E = 1,
      S,
      x,
      T = numeric.transpose(n),
      N = numeric.svd,
      C = numeric.transpose,
      k = numeric.leq,
      L = Math.sqrt,
      A = Math.abs,
      O = numeric.muleq,
      M = numeric.norminf,
      _ = numeric.any,
      D = Math.min,
      P = numeric.all,
      H = numeric.gt,
      B = Array(v),
      j = Array(m),
      F = numeric.rep([m], 1),
      I,
      q = numeric.solve,
      R = c(r, h(n, o)),
      U,
      z = h(t, t),
      W;for (U = w; U < s; ++U) {
    var X, V, $;for (X = m - 1; X !== -1; --X) {
      j[X] = p(n[X], R[X]);
    }var J = C(j);for (X = v - 1; X !== -1; --X) {
      B[X] = a(J[X]);
    }E = .25 * A(z / h(t, B));var K = 100 * L(z / h(B, B));if (!isFinite(E) || E > K) E = K;W = d(t, l(E, B)), I = h(J, j);for (X = v - 1; X !== -1; --X) {
      I[X][X] += 1;
    }$ = q(I, p(W, E), !0);var Q = p(R, h(n, $)),
        G = 1;for (X = m - 1; X !== -1; --X) {
      Q[X] < 0 && (G = D(G, -0.999 * Q[X]));
    }g = c(o, l($, G)), R = c(r, h(n, g));if (!P(H(R, 0))) return { solution: o, message: "", iterations: U };o = g;if (E < i) return { solution: g, message: "", iterations: U };if (u) {
      var Y = h(t, W),
          Z = h(n, W);y = !0;for (X = m - 1; X !== -1; --X) {
        if (Y * Z[X] < 0) {
          y = !1;break;
        }
      }
    } else o[v - 1] >= 0 ? y = !1 : y = !0;if (y) return { solution: g, message: "Unbounded", iterations: U };
  }return { solution: o, message: "maximum iteration count exceeded", iterations: U };
}, numeric._solveLP = function (t, n, r, i, s) {
  var o = t.length,
      u = r.length,
      a,
      f = numeric.sum,
      l = numeric.log,
      c = numeric.mul,
      h = numeric.sub,
      p = numeric.dot,
      d = numeric.div,
      v = numeric.add,
      m = numeric.rep([o], 0).concat([1]),
      g = numeric.rep([u, 1], -1),
      y = numeric.blockMatrix([[n, g]]),
      b = r,
      a = numeric.rep([o], 0).concat(Math.max(0, numeric.sup(numeric.neg(r))) + 1),
      w = numeric.__solveLP(m, y, b, i, s, a, !1),
      E = numeric.clone(w.solution);E.length = o;var S = numeric.inf(h(r, p(n, E)));if (S < 0) return { solution: NaN, message: "Infeasible", iterations: w.iterations };var x = numeric.__solveLP(t, n, r, i, s - w.iterations, E, !0);return x.iterations += w.iterations, x;
}, numeric.solveLP = function (t, n, r, i, s, o, u) {
  typeof u == "undefined" && (u = 1e3), typeof o == "undefined" && (o = numeric.epsilon);if (typeof i == "undefined") return numeric._solveLP(t, n, r, o, u);var a = i.length,
      f = i[0].length,
      l = n.length,
      c = numeric.echelonize(i),
      h = numeric.rep([f], 0),
      p = c.P,
      d = [],
      v;for (v = p.length - 1; v !== -1; --v) {
    h[p[v]] = 1;
  }for (v = f - 1; v !== -1; --v) {
    h[v] === 0 && d.push(v);
  }var m = numeric.getRange,
      g = numeric.linspace(0, a - 1),
      y = numeric.linspace(0, l - 1),
      b = m(i, g, d),
      w = m(n, y, p),
      E = m(n, y, d),
      S = numeric.dot,
      x = numeric.sub,
      T = S(w, c.I),
      N = x(E, S(T, b)),
      C = x(r, S(T, s)),
      k = Array(p.length),
      L = Array(d.length);for (v = p.length - 1; v !== -1; --v) {
    k[v] = t[p[v]];
  }for (v = d.length - 1; v !== -1; --v) {
    L[v] = t[d[v]];
  }var A = x(L, S(k, S(c.I, b))),
      O = numeric._solveLP(A, N, C, o, u),
      M = O.solution;if (M !== M) return O;var _ = S(c.I, x(s, S(b, M))),
      D = Array(t.length);for (v = p.length - 1; v !== -1; --v) {
    D[p[v]] = _[v];
  }for (v = d.length - 1; v !== -1; --v) {
    D[d[v]] = M[v];
  }return { solution: D, message: O.message, iterations: O.iterations };
}, numeric.MPStoLP = function (t) {
  function y(e) {
    throw new Error("MPStoLP: " + e + "\nLine " + s + ": " + t[s] + "\nCurrent state: " + r[n] + "\n");
  }t instanceof String && t.split("\n");var n = 0,
      r = ["Initial state", "NAME", "ROWS", "COLUMNS", "RHS", "BOUNDS", "ENDATA"],
      i = t.length,
      s,
      o,
      u,
      a = 0,
      f = {},
      l = [],
      c = 0,
      h = {},
      p = 0,
      d,
      v = [],
      m = [],
      g = [];for (s = 0; s < i; ++s) {
    u = t[s];var b = u.match(/\S*/g),
        w = [];for (o = 0; o < b.length; ++o) {
      b[o] !== "" && w.push(b[o]);
    }if (w.length === 0) continue;for (o = 0; o < r.length; ++o) {
      if (u.substr(0, r[o].length) === r[o]) break;
    }if (o < r.length) {
      n = o, o === 1 && (d = w[1]);if (o === 6) return { name: d, c: v, A: numeric.transpose(m), b: g, rows: f, vars: h };continue;
    }switch (n) {case 0:case 1:
        y("Unexpected line");case 2:
        switch (w[0]) {case "N":
            a === 0 ? a = w[1] : y("Two or more N rows");break;case "L":
            f[w[1]] = c, l[c] = 1, g[c] = 0, ++c;break;case "G":
            f[w[1]] = c, l[c] = -1, g[c] = 0, ++c;break;case "E":
            f[w[1]] = c, l[c] = 0, g[c] = 0, ++c;break;default:
            y("Parse error " + numeric.prettyPrint(w));}break;case 3:
        h.hasOwnProperty(w[0]) || (h[w[0]] = p, v[p] = 0, m[p] = numeric.rep([c], 0), ++p);var E = h[w[0]];for (o = 1; o < w.length; o += 2) {
          if (w[o] === a) {
            v[E] = parseFloat(w[o + 1]);continue;
          }var S = f[w[o]];m[E][S] = (l[S] < 0 ? -1 : 1) * parseFloat(w[o + 1]);
        }break;case 4:
        for (o = 1; o < w.length; o += 2) {
          g[f[w[o]]] = (l[f[w[o]]] < 0 ? -1 : 1) * parseFloat(w[o + 1]);
        }break;case 5:
        break;case 6:
        y("Internal error");}
  }y("Reached end of file without ENDATA");
}, numeric.seedrandom = { pow: Math.pow, random: Math.random }, function (e, t, n, r, i, s, o) {
  function u(e) {
    var t,
        r,
        i = this,
        s = e.length,
        o = 0,
        u = i.i = i.j = i.m = 0;i.S = [], i.c = [], s || (e = [s++]);while (o < n) {
      i.S[o] = o++;
    }for (o = 0; o < n; o++) {
      t = i.S[o], u = l(u + t + e[o % s]), r = i.S[u], i.S[o] = r, i.S[u] = t;
    }i.g = function (t) {
      var r = i.S,
          s = l(i.i + 1),
          o = r[s],
          u = l(i.j + o),
          a = r[u];r[s] = a, r[u] = o;var f = r[l(o + a)];while (--t) {
        s = l(s + 1), o = r[s], u = l(u + o), a = r[u], r[s] = a, r[u] = o, f = f * n + r[l(o + a)];
      }return i.i = s, i.j = u, f;
    }, i.g(n);
  }function a(e, t, n, r, i) {
    n = [], i = typeof e === "undefined" ? "undefined" : (0, _typeof3.default)(e);if (t && i == "object") for (r in e) {
      if (r.indexOf("S") < 5) try {
        n.push(a(e[r], t - 1));
      } catch (s) {}
    }return n.length ? n : e + (i != "string" ? "\0" : "");
  }function f(e, t, n, r) {
    e += "", n = 0;for (r = 0; r < e.length; r++) {
      t[l(r)] = l((n ^= t[l(r)] * 19) + e.charCodeAt(r));
    }e = "";for (r in t) {
      e += String.fromCharCode(t[r]);
    }return e;
  }function l(e) {
    return e & n - 1;
  }t.seedrandom = function (c, h) {
    var p = [],
        d;return c = f(a(h ? [c, e] : arguments.length ? c : [new Date().getTime(), e, window], 3), p), d = new u(p), f(d.S, e), t.random = function () {
      var t = d.g(r),
          u = o,
          a = 0;while (t < i) {
        t = (t + a) * n, u *= n, a = d.g(1);
      }while (t >= s) {
        t /= 2, u /= 2, a >>>= 1;
      }return (t + a) / u;
    }, c;
  }, o = t.pow(n, r), i = t.pow(2, i), s = i * 2, f(t.random(), e);
}([], numeric.seedrandom, 256, 6, 52), function (e) {
  function t(e) {
    if ((typeof e === "undefined" ? "undefined" : (0, _typeof3.default)(e)) != "object") return e;var n = [],
        r,
        i = e.length;for (r = 0; r < i; r++) {
      n[r + 1] = t(e[r]);
    }return n;
  }function n(e) {
    if ((typeof e === "undefined" ? "undefined" : (0, _typeof3.default)(e)) != "object") return e;var t = [],
        r,
        i = e.length;for (r = 1; r < i; r++) {
      t[r - 1] = n(e[r]);
    }return t;
  }function r(e, t, n) {
    var r, i, s, o, u;for (s = 1; s <= n; s += 1) {
      e[s][s] = 1 / e[s][s], u = -e[s][s];for (r = 1; r < s; r += 1) {
        e[r][s] = u * e[r][s];
      }o = s + 1;if (n < o) break;for (i = o; i <= n; i += 1) {
        u = e[s][i], e[s][i] = 0;for (r = 1; r <= s; r += 1) {
          e[r][i] = e[r][i] + u * e[r][s];
        }
      }
    }
  }function i(e, t, n, r) {
    var i, s, o, u;for (s = 1; s <= n; s += 1) {
      u = 0;for (i = 1; i < s; i += 1) {
        u += e[i][s] * r[i];
      }r[s] = (r[s] - u) / e[s][s];
    }for (o = 1; o <= n; o += 1) {
      s = n + 1 - o, r[s] = r[s] / e[s][s], u = -r[s];for (i = 1; i < s; i += 1) {
        r[i] = r[i] + u * e[i][s];
      }
    }
  }function s(e, t, n, r) {
    var i, s, o, u, a, f;for (s = 1; s <= n; s += 1) {
      r[1] = s, f = 0, o = s - 1;if (o < 1) {
        f = e[s][s] - f;if (f <= 0) break;e[s][s] = Math.sqrt(f);
      } else {
        for (u = 1; u <= o; u += 1) {
          a = e[u][s];for (i = 1; i < u; i += 1) {
            a -= e[i][s] * e[i][u];
          }a /= e[u][u], e[u][s] = a, f += a * a;
        }f = e[s][s] - f;if (f <= 0) break;e[s][s] = Math.sqrt(f);
      }r[1] = 0;
    }
  }function o(e, t, n, o, u, a, f, l, c, h, p, d, v, m, g, y) {
    function V() {
      m[1] = m[1] + 1, E = L;for (b = 1; b <= h; b += 1) {
        E += 1, P = -l[b];for (w = 1; w <= o; w += 1) {
          P += f[w][b] * u[w];
        }Math.abs(P) < U && (P = 0);if (b > p) g[E] = P;else {
          g[E] = -Math.abs(P);if (P > 0) {
            for (w = 1; w <= o; w += 1) {
              f[w][b] = -f[w][b];
            }l[b] = -l[b];
          }
        }
      }for (b = 1; b <= v; b += 1) {
        g[L + d[b]] = 0;
      }O = 0, D = 0;for (b = 1; b <= h; b += 1) {
        g[L + b] < D * g[_ + b] && (O = b, D = g[L + b] / g[_ + b]);
      }return O === 0 ? 999 : 0;
    }function $() {
      for (b = 1; b <= o; b += 1) {
        P = 0;for (w = 1; w <= o; w += 1) {
          P += e[w][b] * f[w][O];
        }g[b] = P;
      }S = N;for (b = 1; b <= o; b += 1) {
        g[S + b] = 0;
      }for (w = v + 1; w <= o; w += 1) {
        for (b = 1; b <= o; b += 1) {
          g[S + b] = g[S + b] + e[b][w] * g[w];
        }
      }q = !0;for (b = v; b >= 1; b -= 1) {
        P = g[b], E = k + b * (b + 3) / 2, S = E - b;for (w = b + 1; w <= v; w += 1) {
          P -= g[E] * g[C + w], E += w;
        }P /= g[S], g[C + b] = P;if (d[b] < p) break;if (P < 0) break;q = !1, T = b;
      }if (!q) {
        H = g[A + T] / g[C + T];for (b = 1; b <= v; b += 1) {
          if (d[b] < p) break;if (g[C + b] < 0) break;D = g[A + b] / g[C + b], D < H && (H = D, T = b);
        }
      }P = 0;for (b = N + 1; b <= N + o; b += 1) {
        P += g[b] * g[b];
      }if (Math.abs(P) <= U) {
        if (q) return y[1] = 1, 999;for (b = 1; b <= v; b += 1) {
          g[A + b] = g[A + b] - H * g[C + b];
        }return g[A + v + 1] = g[A + v + 1] + H, 700;
      }P = 0;for (b = 1; b <= o; b += 1) {
        P += g[N + b] * f[b][O];
      }B = -g[L + O] / P, R = !0, q || H < B && (B = H, R = !1);for (b = 1; b <= o; b += 1) {
        u[b] = u[b] + B * g[N + b], Math.abs(u[b]) < U && (u[b] = 0);
      }a[1] = a[1] + B * P * (B / 2 + g[A + v + 1]);for (b = 1; b <= v; b += 1) {
        g[A + b] = g[A + b] - B * g[C + b];
      }g[A + v + 1] = g[A + v + 1] + B;if (!R) {
        P = -l[O];for (w = 1; w <= o; w += 1) {
          P += u[w] * f[w][O];
        }if (O > p) g[L + O] = P;else {
          g[L + O] = -Math.abs(P);if (P > 0) {
            for (w = 1; w <= o; w += 1) {
              f[w][O] = -f[w][O];
            }l[O] = -l[O];
          }
        }return 700;
      }v += 1, d[v] = O, E = k + (v - 1) * v / 2 + 1;for (b = 1; b <= v - 1; b += 1) {
        g[E] = g[b], E += 1;
      }if (v === o) g[E] = g[o];else {
        for (b = o; b >= v + 1; b -= 1) {
          if (g[b] === 0) break;j = Math.max(Math.abs(g[b - 1]), Math.abs(g[b])), F = Math.min(Math.abs(g[b - 1]), Math.abs(g[b])), g[b - 1] >= 0 ? D = Math.abs(j * Math.sqrt(1 + F * F / (j * j))) : D = -Math.abs(j * Math.sqrt(1 + F * F / (j * j))), j = g[b - 1] / D, F = g[b] / D;if (j === 1) break;if (j === 0) {
            g[b - 1] = F * D;for (w = 1; w <= o; w += 1) {
              D = e[w][b - 1], e[w][b - 1] = e[w][b], e[w][b] = D;
            }
          } else {
            g[b - 1] = D, I = F / (1 + j);for (w = 1; w <= o; w += 1) {
              D = j * e[w][b - 1] + F * e[w][b], e[w][b] = I * (e[w][b - 1] + D) - e[w][b], e[w][b - 1] = D;
            }
          }
        }g[E] = g[v];
      }return 0;
    }function J() {
      E = k + T * (T + 1) / 2 + 1, S = E + T;if (g[S] === 0) return 798;j = Math.max(Math.abs(g[S - 1]), Math.abs(g[S])), F = Math.min(Math.abs(g[S - 1]), Math.abs(g[S])), g[S - 1] >= 0 ? D = Math.abs(j * Math.sqrt(1 + F * F / (j * j))) : D = -Math.abs(j * Math.sqrt(1 + F * F / (j * j))), j = g[S - 1] / D, F = g[S] / D;if (j === 1) return 798;if (j === 0) {
        for (b = T + 1; b <= v; b += 1) {
          D = g[S - 1], g[S - 1] = g[S], g[S] = D, S += b;
        }for (b = 1; b <= o; b += 1) {
          D = e[b][T], e[b][T] = e[b][T + 1], e[b][T + 1] = D;
        }
      } else {
        I = F / (1 + j);for (b = T + 1; b <= v; b += 1) {
          D = j * g[S - 1] + F * g[S], g[S] = I * (g[S - 1] + D) - g[S], g[S - 1] = D, S += b;
        }for (b = 1; b <= o; b += 1) {
          D = j * e[b][T] + F * e[b][T + 1], e[b][T + 1] = I * (e[b][T] + D) - e[b][T + 1], e[b][T] = D;
        }
      }return 0;
    }function K() {
      S = E - T;for (b = 1; b <= T; b += 1) {
        g[S] = g[E], E += 1, S += 1;
      }return g[A + T] = g[A + T + 1], d[T] = d[T + 1], T += 1, T < v ? 797 : 0;
    }function Q() {
      return g[A + v] = g[A + v + 1], g[A + v + 1] = 0, d[v] = 0, v -= 1, m[2] = m[2] + 1, 0;
    }var b, w, E, S, x, T, N, C, k, L, A, O, M, _, D, P, H, B, j, F, I, q, R, U, z, W, X;M = Math.min(o, h), E = 2 * o + M * (M + 5) / 2 + 2 * h + 1, U = 1e-60;do {
      U += U, z = 1 + .1 * U, W = 1 + .2 * U;
    } while (z <= 1 || W <= 1);for (b = 1; b <= o; b += 1) {
      g[b] = t[b];
    }for (b = o + 1; b <= E; b += 1) {
      g[b] = 0;
    }for (b = 1; b <= h; b += 1) {
      d[b] = 0;
    }x = [];if (y[1] === 0) {
      s(e, n, o, x);if (x[1] !== 0) {
        y[1] = 2;return;
      }i(e, n, o, t), r(e, n, o);
    } else {
      for (w = 1; w <= o; w += 1) {
        u[w] = 0;for (b = 1; b <= w; b += 1) {
          u[w] = u[w] + e[b][w] * t[b];
        }
      }for (w = 1; w <= o; w += 1) {
        t[w] = 0;for (b = w; b <= o; b += 1) {
          t[w] = t[w] + e[w][b] * u[b];
        }
      }
    }a[1] = 0;for (w = 1; w <= o; w += 1) {
      u[w] = t[w], a[1] = a[1] + g[w] * u[w], g[w] = 0;for (b = w + 1; b <= o; b += 1) {
        e[b][w] = 0;
      }
    }a[1] = -a[1] / 2, y[1] = 0, N = o, C = N + o, A = C + M, k = A + M + 1, L = k + M * (M + 1) / 2, _ = L + h;for (b = 1; b <= h; b += 1) {
      P = 0;for (w = 1; w <= o; w += 1) {
        P += f[w][b] * f[w][b];
      }g[_ + b] = Math.sqrt(P);
    }v = 0, m[1] = 0, m[2] = 0, X = 0;for (;;) {
      X = V();if (X === 999) return;for (;;) {
        X = $();if (X === 0) break;if (X === 999) return;if (X === 700) if (T === v) Q();else {
          for (;;) {
            J(), X = K();if (X !== 797) break;
          }Q();
        }
      }
    }
  }function u(e, r, i, s, u, a) {
    e = t(e), r = t(r), i = t(i);var f,
        l,
        c,
        h,
        p,
        d = [],
        v = [],
        m = [],
        g = [],
        y = [],
        b;u = u || 0, a = a ? t(a) : [undefined, 0], s = s ? t(s) : [], l = e.length - 1, c = i[1].length - 1;if (!s) for (f = 1; f <= c; f += 1) {
      s[f] = 0;
    }for (f = 1; f <= c; f += 1) {
      v[f] = 0;
    }h = 0, p = Math.min(l, c);for (f = 1; f <= l; f += 1) {
      m[f] = 0;
    }d[1] = 0;for (f = 1; f <= 2 * l + p * (p + 5) / 2 + 2 * c + 1; f += 1) {
      g[f] = 0;
    }for (f = 1; f <= 2; f += 1) {
      y[f] = 0;
    }return o(e, r, l, l, m, d, i, s, l, c, u, v, h, y, g, a), b = "", a[1] === 1 && (b = "constraints are inconsistent, no solution!"), a[1] === 2 && (b = "matrix D in quadratic function is not positive definite!"), { solution: n(m), value: n(d), unconstrained_solution: n(r), iterations: n(y), iact: n(v), message: b };
  }e.solveQP = u;
}(numeric), numeric.svd = function (t) {
  function g(e, t) {
    return e = Math.abs(e), t = Math.abs(t), e > t ? e * Math.sqrt(1 + t * t / e / e) : t == 0 ? e : t * Math.sqrt(1 + e * e / t / t);
  }var n,
      r = numeric.epsilon,
      i = 1e-64 / r,
      s = 50,
      o = 0,
      u = 0,
      a = 0,
      f = 0,
      l = 0,
      c = numeric.clone(t),
      h = c.length,
      p = c[0].length;if (h < p) throw "Need more rows than columns";var d = new Array(p),
      v = new Array(p);for (u = 0; u < p; u++) {
    d[u] = v[u] = 0;
  }var m = numeric.rep([p, p], 0),
      y = 0,
      b = 0,
      w = 0,
      E = 0,
      S = 0,
      x = 0,
      T = 0;for (u = 0; u < p; u++) {
    d[u] = b, T = 0, l = u + 1;for (a = u; a < h; a++) {
      T += c[a][u] * c[a][u];
    }if (T <= i) b = 0;else {
      y = c[u][u], b = Math.sqrt(T), y >= 0 && (b = -b), w = y * b - T, c[u][u] = y - b;for (a = l; a < p; a++) {
        T = 0;for (f = u; f < h; f++) {
          T += c[f][u] * c[f][a];
        }y = T / w;for (f = u; f < h; f++) {
          c[f][a] += y * c[f][u];
        }
      }
    }v[u] = b, T = 0;for (a = l; a < p; a++) {
      T += c[u][a] * c[u][a];
    }if (T <= i) b = 0;else {
      y = c[u][u + 1], b = Math.sqrt(T), y >= 0 && (b = -b), w = y * b - T, c[u][u + 1] = y - b;for (a = l; a < p; a++) {
        d[a] = c[u][a] / w;
      }for (a = l; a < h; a++) {
        T = 0;for (f = l; f < p; f++) {
          T += c[a][f] * c[u][f];
        }for (f = l; f < p; f++) {
          c[a][f] += T * d[f];
        }
      }
    }S = Math.abs(v[u]) + Math.abs(d[u]), S > E && (E = S);
  }for (u = p - 1; u != -1; u += -1) {
    if (b != 0) {
      w = b * c[u][u + 1];for (a = l; a < p; a++) {
        m[a][u] = c[u][a] / w;
      }for (a = l; a < p; a++) {
        T = 0;for (f = l; f < p; f++) {
          T += c[u][f] * m[f][a];
        }for (f = l; f < p; f++) {
          m[f][a] += T * m[f][u];
        }
      }
    }for (a = l; a < p; a++) {
      m[u][a] = 0, m[a][u] = 0;
    }m[u][u] = 1, b = d[u], l = u;
  }for (u = p - 1; u != -1; u += -1) {
    l = u + 1, b = v[u];for (a = l; a < p; a++) {
      c[u][a] = 0;
    }if (b != 0) {
      w = c[u][u] * b;for (a = l; a < p; a++) {
        T = 0;for (f = l; f < h; f++) {
          T += c[f][u] * c[f][a];
        }y = T / w;for (f = u; f < h; f++) {
          c[f][a] += y * c[f][u];
        }
      }for (a = u; a < h; a++) {
        c[a][u] = c[a][u] / b;
      }
    } else for (a = u; a < h; a++) {
      c[a][u] = 0;
    }c[u][u] += 1;
  }r *= E;for (f = p - 1; f != -1; f += -1) {
    for (var N = 0; N < s; N++) {
      var C = !1;for (l = f; l != -1; l += -1) {
        if (Math.abs(d[l]) <= r) {
          C = !0;break;
        }if (Math.abs(v[l - 1]) <= r) break;
      }if (!C) {
        o = 0, T = 1;var k = l - 1;for (u = l; u < f + 1; u++) {
          y = T * d[u], d[u] = o * d[u];if (Math.abs(y) <= r) break;b = v[u], w = g(y, b), v[u] = w, o = b / w, T = -y / w;for (a = 0; a < h; a++) {
            S = c[a][k], x = c[a][u], c[a][k] = S * o + x * T, c[a][u] = -S * T + x * o;
          }
        }
      }x = v[f];if (l == f) {
        if (x < 0) {
          v[f] = -x;for (a = 0; a < p; a++) {
            m[a][f] = -m[a][f];
          }
        }break;
      }if (N >= s - 1) throw "Error: no convergence.";E = v[l], S = v[f - 1], b = d[f - 1], w = d[f], y = ((S - x) * (S + x) + (b - w) * (b + w)) / (2 * w * S), b = g(y, 1), y < 0 ? y = ((E - x) * (E + x) + w * (S / (y - b) - w)) / E : y = ((E - x) * (E + x) + w * (S / (y + b) - w)) / E, o = 1, T = 1;for (u = l + 1; u < f + 1; u++) {
        b = d[u], S = v[u], w = T * b, b = o * b, x = g(y, w), d[u - 1] = x, o = y / x, T = w / x, y = E * o + b * T, b = -E * T + b * o, w = S * T, S *= o;for (a = 0; a < p; a++) {
          E = m[a][u - 1], x = m[a][u], m[a][u - 1] = E * o + x * T, m[a][u] = -E * T + x * o;
        }x = g(y, w), v[u - 1] = x, o = y / x, T = w / x, y = o * b + T * S, E = -T * b + o * S;for (a = 0; a < h; a++) {
          S = c[a][u - 1], x = c[a][u], c[a][u - 1] = S * o + x * T, c[a][u] = -S * T + x * o;
        }
      }d[l] = 0, d[f] = y, v[f] = E;
    }
  }for (u = 0; u < v.length; u++) {
    v[u] < r && (v[u] = 0);
  }for (u = 0; u < p; u++) {
    for (a = u - 1; a >= 0; a--) {
      if (v[a] < v[u]) {
        o = v[a], v[a] = v[u], v[u] = o;for (f = 0; f < c.length; f++) {
          n = c[f][u], c[f][u] = c[f][a], c[f][a] = n;
        }for (f = 0; f < m.length; f++) {
          n = m[f][u], m[f][u] = m[f][a], m[f][a] = n;
        }u = a;
      }
    }
  }return { U: c, S: v, V: m };
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"babel-runtime/helpers/typeof":22}],17:[function(require,module,exports){
module.exports = { "default": require("core-js/library/fn/object/define-property"), __esModule: true };
},{"core-js/library/fn/object/define-property":23}],18:[function(require,module,exports){
module.exports = { "default": require("core-js/library/fn/symbol"), __esModule: true };
},{"core-js/library/fn/symbol":24}],19:[function(require,module,exports){
module.exports = { "default": require("core-js/library/fn/symbol/iterator"), __esModule: true };
},{"core-js/library/fn/symbol/iterator":25}],20:[function(require,module,exports){
"use strict";

exports.__esModule = true;

exports.default = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};
},{}],21:[function(require,module,exports){
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
},{"../core-js/object/define-property":17}],22:[function(require,module,exports){
"use strict";

exports.__esModule = true;

var _iterator = require("../core-js/symbol/iterator");

var _iterator2 = _interopRequireDefault(_iterator);

var _symbol = require("../core-js/symbol");

var _symbol2 = _interopRequireDefault(_symbol);

var _typeof = typeof _symbol2.default === "function" && typeof _iterator2.default === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof _symbol2.default === "function" && obj.constructor === _symbol2.default ? "symbol" : typeof obj; };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = typeof _symbol2.default === "function" && _typeof(_iterator2.default) === "symbol" ? function (obj) {
  return typeof obj === "undefined" ? "undefined" : _typeof(obj);
} : function (obj) {
  return obj && typeof _symbol2.default === "function" && obj.constructor === _symbol2.default ? "symbol" : typeof obj === "undefined" ? "undefined" : _typeof(obj);
};
},{"../core-js/symbol":18,"../core-js/symbol/iterator":19}],23:[function(require,module,exports){
require('../../modules/es6.object.define-property');
var $Object = require('../../modules/_core').Object;
module.exports = function defineProperty(it, key, desc){
  return $Object.defineProperty(it, key, desc);
};
},{"../../modules/_core":31,"../../modules/es6.object.define-property":83}],24:[function(require,module,exports){
require('../../modules/es6.symbol');
require('../../modules/es6.object.to-string');
require('../../modules/es7.symbol.async-iterator');
require('../../modules/es7.symbol.observable');
module.exports = require('../../modules/_core').Symbol;
},{"../../modules/_core":31,"../../modules/es6.object.to-string":84,"../../modules/es6.symbol":86,"../../modules/es7.symbol.async-iterator":87,"../../modules/es7.symbol.observable":88}],25:[function(require,module,exports){
require('../../modules/es6.string.iterator');
require('../../modules/web.dom.iterable');
module.exports = require('../../modules/_wks-ext').f('iterator');
},{"../../modules/_wks-ext":80,"../../modules/es6.string.iterator":85,"../../modules/web.dom.iterable":89}],26:[function(require,module,exports){
module.exports = function(it){
  if(typeof it != 'function')throw TypeError(it + ' is not a function!');
  return it;
};
},{}],27:[function(require,module,exports){
module.exports = function(){ /* empty */ };
},{}],28:[function(require,module,exports){
var isObject = require('./_is-object');
module.exports = function(it){
  if(!isObject(it))throw TypeError(it + ' is not an object!');
  return it;
};
},{"./_is-object":47}],29:[function(require,module,exports){
// false -> Array#indexOf
// true  -> Array#includes
var toIObject = require('./_to-iobject')
  , toLength  = require('./_to-length')
  , toIndex   = require('./_to-index');
module.exports = function(IS_INCLUDES){
  return function($this, el, fromIndex){
    var O      = toIObject($this)
      , length = toLength(O.length)
      , index  = toIndex(fromIndex, length)
      , value;
    // Array#includes uses SameValueZero equality algorithm
    if(IS_INCLUDES && el != el)while(length > index){
      value = O[index++];
      if(value != value)return true;
    // Array#toIndex ignores holes, Array#includes - not
    } else for(;length > index; index++)if(IS_INCLUDES || index in O){
      if(O[index] === el)return IS_INCLUDES || index || 0;
    } return !IS_INCLUDES && -1;
  };
};
},{"./_to-index":72,"./_to-iobject":74,"./_to-length":75}],30:[function(require,module,exports){
var toString = {}.toString;

module.exports = function(it){
  return toString.call(it).slice(8, -1);
};
},{}],31:[function(require,module,exports){
var core = module.exports = {version: '2.4.0'};
if(typeof __e == 'number')__e = core; // eslint-disable-line no-undef
},{}],32:[function(require,module,exports){
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
},{"./_a-function":26}],33:[function(require,module,exports){
// 7.2.1 RequireObjectCoercible(argument)
module.exports = function(it){
  if(it == undefined)throw TypeError("Can't call method on  " + it);
  return it;
};
},{}],34:[function(require,module,exports){
// Thank's IE8 for his funny defineProperty
module.exports = !require('./_fails')(function(){
  return Object.defineProperty({}, 'a', {get: function(){ return 7; }}).a != 7;
});
},{"./_fails":39}],35:[function(require,module,exports){
var isObject = require('./_is-object')
  , document = require('./_global').document
  // in old IE typeof document.createElement is 'object'
  , is = isObject(document) && isObject(document.createElement);
module.exports = function(it){
  return is ? document.createElement(it) : {};
};
},{"./_global":40,"./_is-object":47}],36:[function(require,module,exports){
// IE 8- don't enum bug keys
module.exports = (
  'constructor,hasOwnProperty,isPrototypeOf,propertyIsEnumerable,toLocaleString,toString,valueOf'
).split(',');
},{}],37:[function(require,module,exports){
// all enumerable object keys, includes symbols
var getKeys = require('./_object-keys')
  , gOPS    = require('./_object-gops')
  , pIE     = require('./_object-pie');
module.exports = function(it){
  var result     = getKeys(it)
    , getSymbols = gOPS.f;
  if(getSymbols){
    var symbols = getSymbols(it)
      , isEnum  = pIE.f
      , i       = 0
      , key;
    while(symbols.length > i)if(isEnum.call(it, key = symbols[i++]))result.push(key);
  } return result;
};
},{"./_object-gops":61,"./_object-keys":64,"./_object-pie":65}],38:[function(require,module,exports){
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
},{"./_core":31,"./_ctx":32,"./_global":40,"./_hide":42}],39:[function(require,module,exports){
module.exports = function(exec){
  try {
    return !!exec();
  } catch(e){
    return true;
  }
};
},{}],40:[function(require,module,exports){
// https://github.com/zloirock/core-js/issues/86#issuecomment-115759028
var global = module.exports = typeof window != 'undefined' && window.Math == Math
  ? window : typeof self != 'undefined' && self.Math == Math ? self : Function('return this')();
if(typeof __g == 'number')__g = global; // eslint-disable-line no-undef
},{}],41:[function(require,module,exports){
var hasOwnProperty = {}.hasOwnProperty;
module.exports = function(it, key){
  return hasOwnProperty.call(it, key);
};
},{}],42:[function(require,module,exports){
var dP         = require('./_object-dp')
  , createDesc = require('./_property-desc');
module.exports = require('./_descriptors') ? function(object, key, value){
  return dP.f(object, key, createDesc(1, value));
} : function(object, key, value){
  object[key] = value;
  return object;
};
},{"./_descriptors":34,"./_object-dp":56,"./_property-desc":66}],43:[function(require,module,exports){
module.exports = require('./_global').document && document.documentElement;
},{"./_global":40}],44:[function(require,module,exports){
module.exports = !require('./_descriptors') && !require('./_fails')(function(){
  return Object.defineProperty(require('./_dom-create')('div'), 'a', {get: function(){ return 7; }}).a != 7;
});
},{"./_descriptors":34,"./_dom-create":35,"./_fails":39}],45:[function(require,module,exports){
// fallback for non-array-like ES3 and non-enumerable old V8 strings
var cof = require('./_cof');
module.exports = Object('z').propertyIsEnumerable(0) ? Object : function(it){
  return cof(it) == 'String' ? it.split('') : Object(it);
};
},{"./_cof":30}],46:[function(require,module,exports){
// 7.2.2 IsArray(argument)
var cof = require('./_cof');
module.exports = Array.isArray || function isArray(arg){
  return cof(arg) == 'Array';
};
},{"./_cof":30}],47:[function(require,module,exports){
module.exports = function(it){
  return typeof it === 'object' ? it !== null : typeof it === 'function';
};
},{}],48:[function(require,module,exports){
'use strict';
var create         = require('./_object-create')
  , descriptor     = require('./_property-desc')
  , setToStringTag = require('./_set-to-string-tag')
  , IteratorPrototype = {};

// 25.1.2.1.1 %IteratorPrototype%[@@iterator]()
require('./_hide')(IteratorPrototype, require('./_wks')('iterator'), function(){ return this; });

module.exports = function(Constructor, NAME, next){
  Constructor.prototype = create(IteratorPrototype, {next: descriptor(1, next)});
  setToStringTag(Constructor, NAME + ' Iterator');
};
},{"./_hide":42,"./_object-create":55,"./_property-desc":66,"./_set-to-string-tag":68,"./_wks":81}],49:[function(require,module,exports){
'use strict';
var LIBRARY        = require('./_library')
  , $export        = require('./_export')
  , redefine       = require('./_redefine')
  , hide           = require('./_hide')
  , has            = require('./_has')
  , Iterators      = require('./_iterators')
  , $iterCreate    = require('./_iter-create')
  , setToStringTag = require('./_set-to-string-tag')
  , getPrototypeOf = require('./_object-gpo')
  , ITERATOR       = require('./_wks')('iterator')
  , BUGGY          = !([].keys && 'next' in [].keys()) // Safari has buggy iterators w/o `next`
  , FF_ITERATOR    = '@@iterator'
  , KEYS           = 'keys'
  , VALUES         = 'values';

var returnThis = function(){ return this; };

module.exports = function(Base, NAME, Constructor, next, DEFAULT, IS_SET, FORCED){
  $iterCreate(Constructor, NAME, next);
  var getMethod = function(kind){
    if(!BUGGY && kind in proto)return proto[kind];
    switch(kind){
      case KEYS: return function keys(){ return new Constructor(this, kind); };
      case VALUES: return function values(){ return new Constructor(this, kind); };
    } return function entries(){ return new Constructor(this, kind); };
  };
  var TAG        = NAME + ' Iterator'
    , DEF_VALUES = DEFAULT == VALUES
    , VALUES_BUG = false
    , proto      = Base.prototype
    , $native    = proto[ITERATOR] || proto[FF_ITERATOR] || DEFAULT && proto[DEFAULT]
    , $default   = $native || getMethod(DEFAULT)
    , $entries   = DEFAULT ? !DEF_VALUES ? $default : getMethod('entries') : undefined
    , $anyNative = NAME == 'Array' ? proto.entries || $native : $native
    , methods, key, IteratorPrototype;
  // Fix native
  if($anyNative){
    IteratorPrototype = getPrototypeOf($anyNative.call(new Base));
    if(IteratorPrototype !== Object.prototype){
      // Set @@toStringTag to native iterators
      setToStringTag(IteratorPrototype, TAG, true);
      // fix for some old engines
      if(!LIBRARY && !has(IteratorPrototype, ITERATOR))hide(IteratorPrototype, ITERATOR, returnThis);
    }
  }
  // fix Array#{values, @@iterator}.name in V8 / FF
  if(DEF_VALUES && $native && $native.name !== VALUES){
    VALUES_BUG = true;
    $default = function values(){ return $native.call(this); };
  }
  // Define iterator
  if((!LIBRARY || FORCED) && (BUGGY || VALUES_BUG || !proto[ITERATOR])){
    hide(proto, ITERATOR, $default);
  }
  // Plug for library
  Iterators[NAME] = $default;
  Iterators[TAG]  = returnThis;
  if(DEFAULT){
    methods = {
      values:  DEF_VALUES ? $default : getMethod(VALUES),
      keys:    IS_SET     ? $default : getMethod(KEYS),
      entries: $entries
    };
    if(FORCED)for(key in methods){
      if(!(key in proto))redefine(proto, key, methods[key]);
    } else $export($export.P + $export.F * (BUGGY || VALUES_BUG), NAME, methods);
  }
  return methods;
};
},{"./_export":38,"./_has":41,"./_hide":42,"./_iter-create":48,"./_iterators":51,"./_library":53,"./_object-gpo":62,"./_redefine":67,"./_set-to-string-tag":68,"./_wks":81}],50:[function(require,module,exports){
module.exports = function(done, value){
  return {value: value, done: !!done};
};
},{}],51:[function(require,module,exports){
module.exports = {};
},{}],52:[function(require,module,exports){
var getKeys   = require('./_object-keys')
  , toIObject = require('./_to-iobject');
module.exports = function(object, el){
  var O      = toIObject(object)
    , keys   = getKeys(O)
    , length = keys.length
    , index  = 0
    , key;
  while(length > index)if(O[key = keys[index++]] === el)return key;
};
},{"./_object-keys":64,"./_to-iobject":74}],53:[function(require,module,exports){
module.exports = true;
},{}],54:[function(require,module,exports){
var META     = require('./_uid')('meta')
  , isObject = require('./_is-object')
  , has      = require('./_has')
  , setDesc  = require('./_object-dp').f
  , id       = 0;
var isExtensible = Object.isExtensible || function(){
  return true;
};
var FREEZE = !require('./_fails')(function(){
  return isExtensible(Object.preventExtensions({}));
});
var setMeta = function(it){
  setDesc(it, META, {value: {
    i: 'O' + ++id, // object ID
    w: {}          // weak collections IDs
  }});
};
var fastKey = function(it, create){
  // return primitive with prefix
  if(!isObject(it))return typeof it == 'symbol' ? it : (typeof it == 'string' ? 'S' : 'P') + it;
  if(!has(it, META)){
    // can't set metadata to uncaught frozen object
    if(!isExtensible(it))return 'F';
    // not necessary to add metadata
    if(!create)return 'E';
    // add missing metadata
    setMeta(it);
  // return object ID
  } return it[META].i;
};
var getWeak = function(it, create){
  if(!has(it, META)){
    // can't set metadata to uncaught frozen object
    if(!isExtensible(it))return true;
    // not necessary to add metadata
    if(!create)return false;
    // add missing metadata
    setMeta(it);
  // return hash weak collections IDs
  } return it[META].w;
};
// add metadata on freeze-family methods calling
var onFreeze = function(it){
  if(FREEZE && meta.NEED && isExtensible(it) && !has(it, META))setMeta(it);
  return it;
};
var meta = module.exports = {
  KEY:      META,
  NEED:     false,
  fastKey:  fastKey,
  getWeak:  getWeak,
  onFreeze: onFreeze
};
},{"./_fails":39,"./_has":41,"./_is-object":47,"./_object-dp":56,"./_uid":78}],55:[function(require,module,exports){
// 19.1.2.2 / 15.2.3.5 Object.create(O [, Properties])
var anObject    = require('./_an-object')
  , dPs         = require('./_object-dps')
  , enumBugKeys = require('./_enum-bug-keys')
  , IE_PROTO    = require('./_shared-key')('IE_PROTO')
  , Empty       = function(){ /* empty */ }
  , PROTOTYPE   = 'prototype';

// Create object with fake `null` prototype: use iframe Object with cleared prototype
var createDict = function(){
  // Thrash, waste and sodomy: IE GC bug
  var iframe = require('./_dom-create')('iframe')
    , i      = enumBugKeys.length
    , gt     = '>'
    , iframeDocument;
  iframe.style.display = 'none';
  require('./_html').appendChild(iframe);
  iframe.src = 'javascript:'; // eslint-disable-line no-script-url
  // createDict = iframe.contentWindow.Object;
  // html.removeChild(iframe);
  iframeDocument = iframe.contentWindow.document;
  iframeDocument.open();
  iframeDocument.write('<script>document.F=Object</script' + gt);
  iframeDocument.close();
  createDict = iframeDocument.F;
  while(i--)delete createDict[PROTOTYPE][enumBugKeys[i]];
  return createDict();
};

module.exports = Object.create || function create(O, Properties){
  var result;
  if(O !== null){
    Empty[PROTOTYPE] = anObject(O);
    result = new Empty;
    Empty[PROTOTYPE] = null;
    // add "__proto__" for Object.getPrototypeOf polyfill
    result[IE_PROTO] = O;
  } else result = createDict();
  return Properties === undefined ? result : dPs(result, Properties);
};
},{"./_an-object":28,"./_dom-create":35,"./_enum-bug-keys":36,"./_html":43,"./_object-dps":57,"./_shared-key":69}],56:[function(require,module,exports){
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
},{"./_an-object":28,"./_descriptors":34,"./_ie8-dom-define":44,"./_to-primitive":77}],57:[function(require,module,exports){
var dP       = require('./_object-dp')
  , anObject = require('./_an-object')
  , getKeys  = require('./_object-keys');

module.exports = require('./_descriptors') ? Object.defineProperties : function defineProperties(O, Properties){
  anObject(O);
  var keys   = getKeys(Properties)
    , length = keys.length
    , i = 0
    , P;
  while(length > i)dP.f(O, P = keys[i++], Properties[P]);
  return O;
};
},{"./_an-object":28,"./_descriptors":34,"./_object-dp":56,"./_object-keys":64}],58:[function(require,module,exports){
var pIE            = require('./_object-pie')
  , createDesc     = require('./_property-desc')
  , toIObject      = require('./_to-iobject')
  , toPrimitive    = require('./_to-primitive')
  , has            = require('./_has')
  , IE8_DOM_DEFINE = require('./_ie8-dom-define')
  , gOPD           = Object.getOwnPropertyDescriptor;

exports.f = require('./_descriptors') ? gOPD : function getOwnPropertyDescriptor(O, P){
  O = toIObject(O);
  P = toPrimitive(P, true);
  if(IE8_DOM_DEFINE)try {
    return gOPD(O, P);
  } catch(e){ /* empty */ }
  if(has(O, P))return createDesc(!pIE.f.call(O, P), O[P]);
};
},{"./_descriptors":34,"./_has":41,"./_ie8-dom-define":44,"./_object-pie":65,"./_property-desc":66,"./_to-iobject":74,"./_to-primitive":77}],59:[function(require,module,exports){
// fallback for IE11 buggy Object.getOwnPropertyNames with iframe and window
var toIObject = require('./_to-iobject')
  , gOPN      = require('./_object-gopn').f
  , toString  = {}.toString;

var windowNames = typeof window == 'object' && window && Object.getOwnPropertyNames
  ? Object.getOwnPropertyNames(window) : [];

var getWindowNames = function(it){
  try {
    return gOPN(it);
  } catch(e){
    return windowNames.slice();
  }
};

module.exports.f = function getOwnPropertyNames(it){
  return windowNames && toString.call(it) == '[object Window]' ? getWindowNames(it) : gOPN(toIObject(it));
};

},{"./_object-gopn":60,"./_to-iobject":74}],60:[function(require,module,exports){
// 19.1.2.7 / 15.2.3.4 Object.getOwnPropertyNames(O)
var $keys      = require('./_object-keys-internal')
  , hiddenKeys = require('./_enum-bug-keys').concat('length', 'prototype');

exports.f = Object.getOwnPropertyNames || function getOwnPropertyNames(O){
  return $keys(O, hiddenKeys);
};
},{"./_enum-bug-keys":36,"./_object-keys-internal":63}],61:[function(require,module,exports){
exports.f = Object.getOwnPropertySymbols;
},{}],62:[function(require,module,exports){
// 19.1.2.9 / 15.2.3.2 Object.getPrototypeOf(O)
var has         = require('./_has')
  , toObject    = require('./_to-object')
  , IE_PROTO    = require('./_shared-key')('IE_PROTO')
  , ObjectProto = Object.prototype;

module.exports = Object.getPrototypeOf || function(O){
  O = toObject(O);
  if(has(O, IE_PROTO))return O[IE_PROTO];
  if(typeof O.constructor == 'function' && O instanceof O.constructor){
    return O.constructor.prototype;
  } return O instanceof Object ? ObjectProto : null;
};
},{"./_has":41,"./_shared-key":69,"./_to-object":76}],63:[function(require,module,exports){
var has          = require('./_has')
  , toIObject    = require('./_to-iobject')
  , arrayIndexOf = require('./_array-includes')(false)
  , IE_PROTO     = require('./_shared-key')('IE_PROTO');

module.exports = function(object, names){
  var O      = toIObject(object)
    , i      = 0
    , result = []
    , key;
  for(key in O)if(key != IE_PROTO)has(O, key) && result.push(key);
  // Don't enum bug & hidden keys
  while(names.length > i)if(has(O, key = names[i++])){
    ~arrayIndexOf(result, key) || result.push(key);
  }
  return result;
};
},{"./_array-includes":29,"./_has":41,"./_shared-key":69,"./_to-iobject":74}],64:[function(require,module,exports){
// 19.1.2.14 / 15.2.3.14 Object.keys(O)
var $keys       = require('./_object-keys-internal')
  , enumBugKeys = require('./_enum-bug-keys');

module.exports = Object.keys || function keys(O){
  return $keys(O, enumBugKeys);
};
},{"./_enum-bug-keys":36,"./_object-keys-internal":63}],65:[function(require,module,exports){
exports.f = {}.propertyIsEnumerable;
},{}],66:[function(require,module,exports){
module.exports = function(bitmap, value){
  return {
    enumerable  : !(bitmap & 1),
    configurable: !(bitmap & 2),
    writable    : !(bitmap & 4),
    value       : value
  };
};
},{}],67:[function(require,module,exports){
module.exports = require('./_hide');
},{"./_hide":42}],68:[function(require,module,exports){
var def = require('./_object-dp').f
  , has = require('./_has')
  , TAG = require('./_wks')('toStringTag');

module.exports = function(it, tag, stat){
  if(it && !has(it = stat ? it : it.prototype, TAG))def(it, TAG, {configurable: true, value: tag});
};
},{"./_has":41,"./_object-dp":56,"./_wks":81}],69:[function(require,module,exports){
var shared = require('./_shared')('keys')
  , uid    = require('./_uid');
module.exports = function(key){
  return shared[key] || (shared[key] = uid(key));
};
},{"./_shared":70,"./_uid":78}],70:[function(require,module,exports){
var global = require('./_global')
  , SHARED = '__core-js_shared__'
  , store  = global[SHARED] || (global[SHARED] = {});
module.exports = function(key){
  return store[key] || (store[key] = {});
};
},{"./_global":40}],71:[function(require,module,exports){
var toInteger = require('./_to-integer')
  , defined   = require('./_defined');
// true  -> String#at
// false -> String#codePointAt
module.exports = function(TO_STRING){
  return function(that, pos){
    var s = String(defined(that))
      , i = toInteger(pos)
      , l = s.length
      , a, b;
    if(i < 0 || i >= l)return TO_STRING ? '' : undefined;
    a = s.charCodeAt(i);
    return a < 0xd800 || a > 0xdbff || i + 1 === l || (b = s.charCodeAt(i + 1)) < 0xdc00 || b > 0xdfff
      ? TO_STRING ? s.charAt(i) : a
      : TO_STRING ? s.slice(i, i + 2) : (a - 0xd800 << 10) + (b - 0xdc00) + 0x10000;
  };
};
},{"./_defined":33,"./_to-integer":73}],72:[function(require,module,exports){
var toInteger = require('./_to-integer')
  , max       = Math.max
  , min       = Math.min;
module.exports = function(index, length){
  index = toInteger(index);
  return index < 0 ? max(index + length, 0) : min(index, length);
};
},{"./_to-integer":73}],73:[function(require,module,exports){
// 7.1.4 ToInteger
var ceil  = Math.ceil
  , floor = Math.floor;
module.exports = function(it){
  return isNaN(it = +it) ? 0 : (it > 0 ? floor : ceil)(it);
};
},{}],74:[function(require,module,exports){
// to indexed object, toObject with fallback for non-array-like ES3 strings
var IObject = require('./_iobject')
  , defined = require('./_defined');
module.exports = function(it){
  return IObject(defined(it));
};
},{"./_defined":33,"./_iobject":45}],75:[function(require,module,exports){
// 7.1.15 ToLength
var toInteger = require('./_to-integer')
  , min       = Math.min;
module.exports = function(it){
  return it > 0 ? min(toInteger(it), 0x1fffffffffffff) : 0; // pow(2, 53) - 1 == 9007199254740991
};
},{"./_to-integer":73}],76:[function(require,module,exports){
// 7.1.13 ToObject(argument)
var defined = require('./_defined');
module.exports = function(it){
  return Object(defined(it));
};
},{"./_defined":33}],77:[function(require,module,exports){
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
},{"./_is-object":47}],78:[function(require,module,exports){
var id = 0
  , px = Math.random();
module.exports = function(key){
  return 'Symbol('.concat(key === undefined ? '' : key, ')_', (++id + px).toString(36));
};
},{}],79:[function(require,module,exports){
var global         = require('./_global')
  , core           = require('./_core')
  , LIBRARY        = require('./_library')
  , wksExt         = require('./_wks-ext')
  , defineProperty = require('./_object-dp').f;
module.exports = function(name){
  var $Symbol = core.Symbol || (core.Symbol = LIBRARY ? {} : global.Symbol || {});
  if(name.charAt(0) != '_' && !(name in $Symbol))defineProperty($Symbol, name, {value: wksExt.f(name)});
};
},{"./_core":31,"./_global":40,"./_library":53,"./_object-dp":56,"./_wks-ext":80}],80:[function(require,module,exports){
exports.f = require('./_wks');
},{"./_wks":81}],81:[function(require,module,exports){
var store      = require('./_shared')('wks')
  , uid        = require('./_uid')
  , Symbol     = require('./_global').Symbol
  , USE_SYMBOL = typeof Symbol == 'function';

var $exports = module.exports = function(name){
  return store[name] || (store[name] =
    USE_SYMBOL && Symbol[name] || (USE_SYMBOL ? Symbol : uid)('Symbol.' + name));
};

$exports.store = store;
},{"./_global":40,"./_shared":70,"./_uid":78}],82:[function(require,module,exports){
'use strict';
var addToUnscopables = require('./_add-to-unscopables')
  , step             = require('./_iter-step')
  , Iterators        = require('./_iterators')
  , toIObject        = require('./_to-iobject');

// 22.1.3.4 Array.prototype.entries()
// 22.1.3.13 Array.prototype.keys()
// 22.1.3.29 Array.prototype.values()
// 22.1.3.30 Array.prototype[@@iterator]()
module.exports = require('./_iter-define')(Array, 'Array', function(iterated, kind){
  this._t = toIObject(iterated); // target
  this._i = 0;                   // next index
  this._k = kind;                // kind
// 22.1.5.2.1 %ArrayIteratorPrototype%.next()
}, function(){
  var O     = this._t
    , kind  = this._k
    , index = this._i++;
  if(!O || index >= O.length){
    this._t = undefined;
    return step(1);
  }
  if(kind == 'keys'  )return step(0, index);
  if(kind == 'values')return step(0, O[index]);
  return step(0, [index, O[index]]);
}, 'values');

// argumentsList[@@iterator] is %ArrayProto_values% (9.4.4.6, 9.4.4.7)
Iterators.Arguments = Iterators.Array;

addToUnscopables('keys');
addToUnscopables('values');
addToUnscopables('entries');
},{"./_add-to-unscopables":27,"./_iter-define":49,"./_iter-step":50,"./_iterators":51,"./_to-iobject":74}],83:[function(require,module,exports){
var $export = require('./_export');
// 19.1.2.4 / 15.2.3.6 Object.defineProperty(O, P, Attributes)
$export($export.S + $export.F * !require('./_descriptors'), 'Object', {defineProperty: require('./_object-dp').f});
},{"./_descriptors":34,"./_export":38,"./_object-dp":56}],84:[function(require,module,exports){

},{}],85:[function(require,module,exports){
'use strict';
var $at  = require('./_string-at')(true);

// 21.1.3.27 String.prototype[@@iterator]()
require('./_iter-define')(String, 'String', function(iterated){
  this._t = String(iterated); // target
  this._i = 0;                // next index
// 21.1.5.2.1 %StringIteratorPrototype%.next()
}, function(){
  var O     = this._t
    , index = this._i
    , point;
  if(index >= O.length)return {value: undefined, done: true};
  point = $at(O, index);
  this._i += point.length;
  return {value: point, done: false};
});
},{"./_iter-define":49,"./_string-at":71}],86:[function(require,module,exports){
'use strict';
// ECMAScript 6 symbols shim
var global         = require('./_global')
  , has            = require('./_has')
  , DESCRIPTORS    = require('./_descriptors')
  , $export        = require('./_export')
  , redefine       = require('./_redefine')
  , META           = require('./_meta').KEY
  , $fails         = require('./_fails')
  , shared         = require('./_shared')
  , setToStringTag = require('./_set-to-string-tag')
  , uid            = require('./_uid')
  , wks            = require('./_wks')
  , wksExt         = require('./_wks-ext')
  , wksDefine      = require('./_wks-define')
  , keyOf          = require('./_keyof')
  , enumKeys       = require('./_enum-keys')
  , isArray        = require('./_is-array')
  , anObject       = require('./_an-object')
  , toIObject      = require('./_to-iobject')
  , toPrimitive    = require('./_to-primitive')
  , createDesc     = require('./_property-desc')
  , _create        = require('./_object-create')
  , gOPNExt        = require('./_object-gopn-ext')
  , $GOPD          = require('./_object-gopd')
  , $DP            = require('./_object-dp')
  , $keys          = require('./_object-keys')
  , gOPD           = $GOPD.f
  , dP             = $DP.f
  , gOPN           = gOPNExt.f
  , $Symbol        = global.Symbol
  , $JSON          = global.JSON
  , _stringify     = $JSON && $JSON.stringify
  , PROTOTYPE      = 'prototype'
  , HIDDEN         = wks('_hidden')
  , TO_PRIMITIVE   = wks('toPrimitive')
  , isEnum         = {}.propertyIsEnumerable
  , SymbolRegistry = shared('symbol-registry')
  , AllSymbols     = shared('symbols')
  , OPSymbols      = shared('op-symbols')
  , ObjectProto    = Object[PROTOTYPE]
  , USE_NATIVE     = typeof $Symbol == 'function'
  , QObject        = global.QObject;
// Don't use setters in Qt Script, https://github.com/zloirock/core-js/issues/173
var setter = !QObject || !QObject[PROTOTYPE] || !QObject[PROTOTYPE].findChild;

// fallback for old Android, https://code.google.com/p/v8/issues/detail?id=687
var setSymbolDesc = DESCRIPTORS && $fails(function(){
  return _create(dP({}, 'a', {
    get: function(){ return dP(this, 'a', {value: 7}).a; }
  })).a != 7;
}) ? function(it, key, D){
  var protoDesc = gOPD(ObjectProto, key);
  if(protoDesc)delete ObjectProto[key];
  dP(it, key, D);
  if(protoDesc && it !== ObjectProto)dP(ObjectProto, key, protoDesc);
} : dP;

var wrap = function(tag){
  var sym = AllSymbols[tag] = _create($Symbol[PROTOTYPE]);
  sym._k = tag;
  return sym;
};

var isSymbol = USE_NATIVE && typeof $Symbol.iterator == 'symbol' ? function(it){
  return typeof it == 'symbol';
} : function(it){
  return it instanceof $Symbol;
};

var $defineProperty = function defineProperty(it, key, D){
  if(it === ObjectProto)$defineProperty(OPSymbols, key, D);
  anObject(it);
  key = toPrimitive(key, true);
  anObject(D);
  if(has(AllSymbols, key)){
    if(!D.enumerable){
      if(!has(it, HIDDEN))dP(it, HIDDEN, createDesc(1, {}));
      it[HIDDEN][key] = true;
    } else {
      if(has(it, HIDDEN) && it[HIDDEN][key])it[HIDDEN][key] = false;
      D = _create(D, {enumerable: createDesc(0, false)});
    } return setSymbolDesc(it, key, D);
  } return dP(it, key, D);
};
var $defineProperties = function defineProperties(it, P){
  anObject(it);
  var keys = enumKeys(P = toIObject(P))
    , i    = 0
    , l = keys.length
    , key;
  while(l > i)$defineProperty(it, key = keys[i++], P[key]);
  return it;
};
var $create = function create(it, P){
  return P === undefined ? _create(it) : $defineProperties(_create(it), P);
};
var $propertyIsEnumerable = function propertyIsEnumerable(key){
  var E = isEnum.call(this, key = toPrimitive(key, true));
  if(this === ObjectProto && has(AllSymbols, key) && !has(OPSymbols, key))return false;
  return E || !has(this, key) || !has(AllSymbols, key) || has(this, HIDDEN) && this[HIDDEN][key] ? E : true;
};
var $getOwnPropertyDescriptor = function getOwnPropertyDescriptor(it, key){
  it  = toIObject(it);
  key = toPrimitive(key, true);
  if(it === ObjectProto && has(AllSymbols, key) && !has(OPSymbols, key))return;
  var D = gOPD(it, key);
  if(D && has(AllSymbols, key) && !(has(it, HIDDEN) && it[HIDDEN][key]))D.enumerable = true;
  return D;
};
var $getOwnPropertyNames = function getOwnPropertyNames(it){
  var names  = gOPN(toIObject(it))
    , result = []
    , i      = 0
    , key;
  while(names.length > i){
    if(!has(AllSymbols, key = names[i++]) && key != HIDDEN && key != META)result.push(key);
  } return result;
};
var $getOwnPropertySymbols = function getOwnPropertySymbols(it){
  var IS_OP  = it === ObjectProto
    , names  = gOPN(IS_OP ? OPSymbols : toIObject(it))
    , result = []
    , i      = 0
    , key;
  while(names.length > i){
    if(has(AllSymbols, key = names[i++]) && (IS_OP ? has(ObjectProto, key) : true))result.push(AllSymbols[key]);
  } return result;
};

// 19.4.1.1 Symbol([description])
if(!USE_NATIVE){
  $Symbol = function Symbol(){
    if(this instanceof $Symbol)throw TypeError('Symbol is not a constructor!');
    var tag = uid(arguments.length > 0 ? arguments[0] : undefined);
    var $set = function(value){
      if(this === ObjectProto)$set.call(OPSymbols, value);
      if(has(this, HIDDEN) && has(this[HIDDEN], tag))this[HIDDEN][tag] = false;
      setSymbolDesc(this, tag, createDesc(1, value));
    };
    if(DESCRIPTORS && setter)setSymbolDesc(ObjectProto, tag, {configurable: true, set: $set});
    return wrap(tag);
  };
  redefine($Symbol[PROTOTYPE], 'toString', function toString(){
    return this._k;
  });

  $GOPD.f = $getOwnPropertyDescriptor;
  $DP.f   = $defineProperty;
  require('./_object-gopn').f = gOPNExt.f = $getOwnPropertyNames;
  require('./_object-pie').f  = $propertyIsEnumerable;
  require('./_object-gops').f = $getOwnPropertySymbols;

  if(DESCRIPTORS && !require('./_library')){
    redefine(ObjectProto, 'propertyIsEnumerable', $propertyIsEnumerable, true);
  }

  wksExt.f = function(name){
    return wrap(wks(name));
  }
}

$export($export.G + $export.W + $export.F * !USE_NATIVE, {Symbol: $Symbol});

for(var symbols = (
  // 19.4.2.2, 19.4.2.3, 19.4.2.4, 19.4.2.6, 19.4.2.8, 19.4.2.9, 19.4.2.10, 19.4.2.11, 19.4.2.12, 19.4.2.13, 19.4.2.14
  'hasInstance,isConcatSpreadable,iterator,match,replace,search,species,split,toPrimitive,toStringTag,unscopables'
).split(','), i = 0; symbols.length > i; )wks(symbols[i++]);

for(var symbols = $keys(wks.store), i = 0; symbols.length > i; )wksDefine(symbols[i++]);

$export($export.S + $export.F * !USE_NATIVE, 'Symbol', {
  // 19.4.2.1 Symbol.for(key)
  'for': function(key){
    return has(SymbolRegistry, key += '')
      ? SymbolRegistry[key]
      : SymbolRegistry[key] = $Symbol(key);
  },
  // 19.4.2.5 Symbol.keyFor(sym)
  keyFor: function keyFor(key){
    if(isSymbol(key))return keyOf(SymbolRegistry, key);
    throw TypeError(key + ' is not a symbol!');
  },
  useSetter: function(){ setter = true; },
  useSimple: function(){ setter = false; }
});

$export($export.S + $export.F * !USE_NATIVE, 'Object', {
  // 19.1.2.2 Object.create(O [, Properties])
  create: $create,
  // 19.1.2.4 Object.defineProperty(O, P, Attributes)
  defineProperty: $defineProperty,
  // 19.1.2.3 Object.defineProperties(O, Properties)
  defineProperties: $defineProperties,
  // 19.1.2.6 Object.getOwnPropertyDescriptor(O, P)
  getOwnPropertyDescriptor: $getOwnPropertyDescriptor,
  // 19.1.2.7 Object.getOwnPropertyNames(O)
  getOwnPropertyNames: $getOwnPropertyNames,
  // 19.1.2.8 Object.getOwnPropertySymbols(O)
  getOwnPropertySymbols: $getOwnPropertySymbols
});

// 24.3.2 JSON.stringify(value [, replacer [, space]])
$JSON && $export($export.S + $export.F * (!USE_NATIVE || $fails(function(){
  var S = $Symbol();
  // MS Edge converts symbol values to JSON as {}
  // WebKit converts symbol values to JSON as null
  // V8 throws on boxed symbols
  return _stringify([S]) != '[null]' || _stringify({a: S}) != '{}' || _stringify(Object(S)) != '{}';
})), 'JSON', {
  stringify: function stringify(it){
    if(it === undefined || isSymbol(it))return; // IE8 returns string on undefined
    var args = [it]
      , i    = 1
      , replacer, $replacer;
    while(arguments.length > i)args.push(arguments[i++]);
    replacer = args[1];
    if(typeof replacer == 'function')$replacer = replacer;
    if($replacer || !isArray(replacer))replacer = function(key, value){
      if($replacer)value = $replacer.call(this, key, value);
      if(!isSymbol(value))return value;
    };
    args[1] = replacer;
    return _stringify.apply($JSON, args);
  }
});

// 19.4.3.4 Symbol.prototype[@@toPrimitive](hint)
$Symbol[PROTOTYPE][TO_PRIMITIVE] || require('./_hide')($Symbol[PROTOTYPE], TO_PRIMITIVE, $Symbol[PROTOTYPE].valueOf);
// 19.4.3.5 Symbol.prototype[@@toStringTag]
setToStringTag($Symbol, 'Symbol');
// 20.2.1.9 Math[@@toStringTag]
setToStringTag(Math, 'Math', true);
// 24.3.3 JSON[@@toStringTag]
setToStringTag(global.JSON, 'JSON', true);
},{"./_an-object":28,"./_descriptors":34,"./_enum-keys":37,"./_export":38,"./_fails":39,"./_global":40,"./_has":41,"./_hide":42,"./_is-array":46,"./_keyof":52,"./_library":53,"./_meta":54,"./_object-create":55,"./_object-dp":56,"./_object-gopd":58,"./_object-gopn":60,"./_object-gopn-ext":59,"./_object-gops":61,"./_object-keys":64,"./_object-pie":65,"./_property-desc":66,"./_redefine":67,"./_set-to-string-tag":68,"./_shared":70,"./_to-iobject":74,"./_to-primitive":77,"./_uid":78,"./_wks":81,"./_wks-define":79,"./_wks-ext":80}],87:[function(require,module,exports){
require('./_wks-define')('asyncIterator');
},{"./_wks-define":79}],88:[function(require,module,exports){
require('./_wks-define')('observable');
},{"./_wks-define":79}],89:[function(require,module,exports){
require('./es6.array.iterator');
var global        = require('./_global')
  , hide          = require('./_hide')
  , Iterators     = require('./_iterators')
  , TO_STRING_TAG = require('./_wks')('toStringTag');

for(var collections = ['NodeList', 'DOMTokenList', 'MediaList', 'StyleSheetList', 'CSSRuleList'], i = 0; i < 5; i++){
  var NAME       = collections[i]
    , Collection = global[NAME]
    , proto      = Collection && Collection.prototype;
  if(proto && !proto[TO_STRING_TAG])hide(proto, TO_STRING_TAG, NAME);
  Iterators[NAME] = Iterators.Array;
}
},{"./_global":40,"./_hide":42,"./_iterators":51,"./_wks":81,"./es6.array.iterator":82}]},{},[14])(14)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJkaXN0L2ZvYS1hbmFseXNlci5qcyIsImRpc3QvZm9hLWRlY29kZXJCaW4uanMiLCJkaXN0L2ZvYS1lbmNvZGVyLmpzIiwiZGlzdC9mb2Etcm90YXRvci5qcyIsImRpc3QvZm9hLXZpcnR1YWxNaWMuanMiLCJkaXN0L2hvYS1hbmFseXNlci5qcyIsImRpc3QvaG9hLWNvbnZlcnRlcnMuanMiLCJkaXN0L2hvYS1kZWNvZGVyQmluLmpzIiwiZGlzdC9ob2EtZW5jb2Rlci5qcyIsImRpc3QvaG9hLWxpbWl0ZXIuanMiLCJkaXN0L2hvYS1sb2FkZXIuanMiLCJkaXN0L2hvYS1yb3RhdG9yLmpzIiwiZGlzdC9ob2EtdmlydHVhbE1pYy5qcyIsImRpc3QvaW5kZXguanMiLCJkaXN0L2pzaC1saWIuanMiLCJkaXN0L251bWVyaWMtMS4yLjYubWluLmpzIiwibm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvY29yZS1qcy9vYmplY3QvZGVmaW5lLXByb3BlcnR5LmpzIiwibm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvY29yZS1qcy9zeW1ib2wuanMiLCJub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9jb3JlLWpzL3N5bWJvbC9pdGVyYXRvci5qcyIsIm5vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL2hlbHBlcnMvY2xhc3NDYWxsQ2hlY2suanMiLCJub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9oZWxwZXJzL2NyZWF0ZUNsYXNzLmpzIiwibm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvaGVscGVycy90eXBlb2YuanMiLCJub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9ub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L2ZuL29iamVjdC9kZWZpbmUtcHJvcGVydHkuanMiLCJub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9ub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L2ZuL3N5bWJvbC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL25vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvZm4vc3ltYm9sL2l0ZXJhdG9yLmpzIiwibm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvbm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzL19hLWZ1bmN0aW9uLmpzIiwibm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvbm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzL19hZGQtdG8tdW5zY29wYWJsZXMuanMiLCJub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9ub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvX2FuLW9iamVjdC5qcyIsIm5vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL25vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy9fYXJyYXktaW5jbHVkZXMuanMiLCJub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9ub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvX2NvZi5qcyIsIm5vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL25vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy9fY29yZS5qcyIsIm5vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL25vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy9fY3R4LmpzIiwibm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvbm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzL19kZWZpbmVkLmpzIiwibm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvbm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzL19kZXNjcmlwdG9ycy5qcyIsIm5vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL25vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy9fZG9tLWNyZWF0ZS5qcyIsIm5vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL25vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy9fZW51bS1idWcta2V5cy5qcyIsIm5vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL25vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy9fZW51bS1rZXlzLmpzIiwibm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvbm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzL19leHBvcnQuanMiLCJub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9ub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvX2ZhaWxzLmpzIiwibm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvbm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzL19nbG9iYWwuanMiLCJub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9ub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvX2hhcy5qcyIsIm5vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL25vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy9faGlkZS5qcyIsIm5vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL25vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy9faHRtbC5qcyIsIm5vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL25vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy9faWU4LWRvbS1kZWZpbmUuanMiLCJub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9ub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvX2lvYmplY3QuanMiLCJub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9ub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvX2lzLWFycmF5LmpzIiwibm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvbm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzL19pcy1vYmplY3QuanMiLCJub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9ub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvX2l0ZXItY3JlYXRlLmpzIiwibm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvbm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzL19pdGVyLWRlZmluZS5qcyIsIm5vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL25vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy9faXRlci1zdGVwLmpzIiwibm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvbm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzL19pdGVyYXRvcnMuanMiLCJub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9ub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvX2tleW9mLmpzIiwibm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvbm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzL19saWJyYXJ5LmpzIiwibm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvbm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzL19tZXRhLmpzIiwibm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvbm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzL19vYmplY3QtY3JlYXRlLmpzIiwibm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvbm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzL19vYmplY3QtZHAuanMiLCJub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9ub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvX29iamVjdC1kcHMuanMiLCJub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9ub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvX29iamVjdC1nb3BkLmpzIiwibm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvbm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzL19vYmplY3QtZ29wbi1leHQuanMiLCJub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9ub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvX29iamVjdC1nb3BuLmpzIiwibm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvbm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzL19vYmplY3QtZ29wcy5qcyIsIm5vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL25vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy9fb2JqZWN0LWdwby5qcyIsIm5vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL25vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy9fb2JqZWN0LWtleXMtaW50ZXJuYWwuanMiLCJub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9ub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvX29iamVjdC1rZXlzLmpzIiwibm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvbm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzL19vYmplY3QtcGllLmpzIiwibm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvbm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzL19wcm9wZXJ0eS1kZXNjLmpzIiwibm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvbm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzL19yZWRlZmluZS5qcyIsIm5vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL25vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy9fc2V0LXRvLXN0cmluZy10YWcuanMiLCJub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9ub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvX3NoYXJlZC1rZXkuanMiLCJub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9ub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvX3NoYXJlZC5qcyIsIm5vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL25vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy9fc3RyaW5nLWF0LmpzIiwibm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvbm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzL190by1pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL25vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy9fdG8taW50ZWdlci5qcyIsIm5vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL25vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy9fdG8taW9iamVjdC5qcyIsIm5vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL25vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy9fdG8tbGVuZ3RoLmpzIiwibm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvbm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzL190by1vYmplY3QuanMiLCJub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9ub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvX3RvLXByaW1pdGl2ZS5qcyIsIm5vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL25vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy9fdWlkLmpzIiwibm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvbm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzL193a3MtZGVmaW5lLmpzIiwibm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvbm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzL193a3MtZXh0LmpzIiwibm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvbm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzL193a3MuanMiLCJub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9ub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvZXM2LmFycmF5Lml0ZXJhdG9yLmpzIiwibm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvbm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzL2VzNi5vYmplY3QuZGVmaW5lLXByb3BlcnR5LmpzIiwibm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvbm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzL2VzNi5vYmplY3QudG8tc3RyaW5nLmpzIiwibm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvbm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzL2VzNi5zdHJpbmcuaXRlcmF0b3IuanMiLCJub2RlX21vZHVsZXMvYmFiZWwtcnVudGltZS9ub2RlX21vZHVsZXMvY29yZS1qcy9saWJyYXJ5L21vZHVsZXMvZXM2LnN5bWJvbC5qcyIsIm5vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL25vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy9lczcuc3ltYm9sLmFzeW5jLWl0ZXJhdG9yLmpzIiwibm9kZV9tb2R1bGVzL2JhYmVsLXJ1bnRpbWUvbm9kZV9tb2R1bGVzL2NvcmUtanMvbGlicmFyeS9tb2R1bGVzL2VzNy5zeW1ib2wub2JzZXJ2YWJsZS5qcyIsIm5vZGVfbW9kdWxlcy9iYWJlbC1ydW50aW1lL25vZGVfbW9kdWxlcy9jb3JlLWpzL2xpYnJhcnkvbW9kdWxlcy93ZWIuZG9tLml0ZXJhYmxlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lDaUJxQixnQjtBQUNqQiw4QkFBWSxR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QUFTLEdBQUUsQ0FBWCxFQUFOO0FBQW9CLENBRnZ0TDs7Ozs7QUNBMUU7O0FDQUE7O0FDQUE7O0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDSkE7QUFDQTtBQUNBOztBQ0ZBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBOztBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0pBO0FBQ0E7O0FDREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNKQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNOQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ05BO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7O0FDQUE7QUFDQTtBQUNBOztBQ0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNKQTtBQUNBO0FBQ0E7O0FDRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckVBO0FBQ0E7QUFDQTs7QUNGQTs7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTs7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTkE7O0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTkE7O0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNQQTs7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNSQTs7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pDQTtBQUNBO0FBQ0E7O0FDRkE7O0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMU9BOztBQ0FBOztBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyAgQXJjaG9udGlzIFBvbGl0aXNcbi8vICBhcmNob250aXMucG9saXRpc0BhYWx0by5maVxuLy8gIERhdmlkIFBvaXJpZXItUXVpbm90XG4vLyAgZGF2aXBvaXJAaXJjYW0uZnJcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vL1xuLy8gIFdlYkF1ZGlvX0hPQSBhIEphdmFTY3JpcHQgbGlicmFyeSBmb3IgaGlnaGVyLW9yZGVyIEFtYmlzb25pY3Ncbi8vICBUaGUgbGlicmFyeSBpbXBsZW1lbnRzIFdlYiBBdWRpbyBibG9ja3MgdGhhdCBwZXJmb3JtXG4vLyAgdHlwaWNhbCBhbWJpc29uaWMgcHJvY2Vzc2luZyBvcGVyYXRpb25zIG9uIGF1ZGlvIHNpZ25hbHMuXG4vL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vKiBCX0ZPUk1BVCBJTlRFTlNJVFkgQU5BTFlaRVIgKi9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBCZm9ybWF0X2FuYWx5c2VyIHtcbiAgICBjb25zdHJ1Y3RvcihhdWRpb0N0eCkge1xuICAgICAgICB0aGlzLmluaXRpYWxpemVkID0gZmFsc2U7XG5cbiAgICAgICAgdGhpcy5jdHggPSBhdWRpb0N0eDtcbiAgICAgICAgdGhpcy5mZnRTaXplID0gMjA0ODtcbiAgICAgICAgdGhpcy5hbmFseXNlcnMgPSBuZXcgQXJyYXkoNCk7XG4gICAgICAgIHRoaXMuYW5hbEJ1ZmZlcnMgPSBuZXcgQXJyYXkoNCk7XG4gICAgICAgIC8vIElucHV0IGFuZCBvdXRwdXQgbm9kZXNcbiAgICAgICAgdGhpcy5pbiA9IHRoaXMuY3R4LmNyZWF0ZUNoYW5uZWxTcGxpdHRlcig0KTtcbiAgICAgICAgdGhpcy5vdXQgPSB0aGlzLmN0eC5jcmVhdGVDaGFubmVsTWVyZ2VyKDQpO1xuICAgICAgICAvLyBJbml0aWFsaXplIGFuYWx5emVyIGJ1ZmZlcnNcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCA0OyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMuYW5hbHlzZXJzW2ldID0gdGhpcy5jdHguY3JlYXRlQW5hbHlzZXIoKTtcbiAgICAgICAgICAgIHRoaXMuYW5hbHlzZXJzW2ldLmZmdFNpemUgPSB0aGlzLmZmdFNpemU7XG4gICAgICAgICAgICB0aGlzLmFuYWx5c2Vyc1tpXS5zbW9vdGhpbmdUaW1lQ29uc3RhbnQgPSAwO1xuICAgICAgICAgICAgdGhpcy5hbmFsQnVmZmVyc1tpXSA9IG5ldyBGbG9hdDMyQXJyYXkodGhpcy5mZnRTaXplKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBDcmVhdGUgY29ubmVjdGlvbnNcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCA0OyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMuaW4uY29ubmVjdCh0aGlzLm91dCwgaSwgaSk7XG4gICAgICAgICAgICB0aGlzLmluLmNvbm5lY3QodGhpcy5hbmFseXNlcnNbaV0sIGksIDApO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5pbml0aWFsaXplZCA9IHRydWU7XG4gICAgfVxuXG4gICAgdXBkYXRlQnVmZmVycygpIHtcbiAgICAgICAgLy8gR2V0IGxhdGVzdCB0aW1lLWRvbWFpbiBkYXRhXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgNDsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLmFuYWx5c2Vyc1tpXS5nZXRGbG9hdFRpbWVEb21haW5EYXRhKHRoaXMuYW5hbEJ1ZmZlcnNbaV0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgY29tcHV0ZUludGVuc2l0eSgpIHtcbiAgICAgICAgLy8gQ29tcHV0ZSBjb3JyZWxhdGlvbnMgYW5kIGVuZXJnaWVzIG9mIGNoYW5uZWxzXG4gICAgICAgIHZhciBpWCA9IDA7XG4gICAgICAgIHZhciBpWSA9IDA7XG4gICAgICAgIHZhciBpWiA9IDA7XG4gICAgICAgIHZhciBXVyA9IDA7XG4gICAgICAgIHZhciBYWCA9IDA7XG4gICAgICAgIHZhciBZWSA9IDA7XG4gICAgICAgIHZhciBaWiA9IDA7XG4gICAgICAgIHZhciBJLCBJX25vcm0sIEUsIFBzaSwgYXppLCBlbGV2O1xuICAgICAgICAvLyBBY2N1bXVsYXRvcnMgZm9yIGNvcnJlbGF0aW9ucyBhbmQgZW5lcmdpZXNcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmZmdFNpemU7IGkrKykge1xuXG4gICAgICAgICAgICBpWCA9IGlYICsgTWF0aC5zcXJ0KDIpICogdGhpcy5hbmFsQnVmZmVyc1swXVtpXSAqIHRoaXMuYW5hbEJ1ZmZlcnNbMV1baV07XG4gICAgICAgICAgICBpWSA9IGlZICsgTWF0aC5zcXJ0KDIpICogdGhpcy5hbmFsQnVmZmVyc1swXVtpXSAqIHRoaXMuYW5hbEJ1ZmZlcnNbMl1baV07XG4gICAgICAgICAgICBpWiA9IGlaICsgTWF0aC5zcXJ0KDIpICogdGhpcy5hbmFsQnVmZmVyc1swXVtpXSAqIHRoaXMuYW5hbEJ1ZmZlcnNbM11baV07XG4gICAgICAgICAgICBXVyA9IFdXICsgMiAqIHRoaXMuYW5hbEJ1ZmZlcnNbMF1baV0gKiB0aGlzLmFuYWxCdWZmZXJzWzBdW2ldO1xuICAgICAgICAgICAgWFggPSBYWCArIHRoaXMuYW5hbEJ1ZmZlcnNbMV1baV0gKiB0aGlzLmFuYWxCdWZmZXJzWzFdW2ldO1xuICAgICAgICAgICAgWVkgPSBZWSArIHRoaXMuYW5hbEJ1ZmZlcnNbMl1baV0gKiB0aGlzLmFuYWxCdWZmZXJzWzJdW2ldO1xuICAgICAgICAgICAgWlogPSBaWiArIHRoaXMuYW5hbEJ1ZmZlcnNbM11baV0gKiB0aGlzLmFuYWxCdWZmZXJzWzNdW2ldO1xuICAgICAgICB9XG4gICAgICAgIEkgPSBbaVgsIGlZLCBpWl07IC8vIGludGVuc2l0eVxuICAgICAgICBJX25vcm0gPSBNYXRoLnNxcnQoSVswXSAqIElbMF0gKyBJWzFdICogSVsxXSArIElbMl0gKiBJWzJdKTsgLy8gaW50ZW5zaXR5IG1hZ25pdHVkZVxuICAgICAgICBFID0gKFdXICsgWFggKyBZWSArIFpaKSAvIDI7IC8vIGVuZXJneVxuICAgICAgICBQc2kgPSAxIC0gSV9ub3JtIC8gKEUgKyAxMGUtOCk7IC8vIGRpZmZ1c2VuZXNzXG4gICAgICAgIGF6aSA9IE1hdGguYXRhbjIoaVksIGlYKSAqIDE4MCAvIE1hdGguUEk7XG4gICAgICAgIGVsZXYgPSBNYXRoLmF0YW4yKElbMl0sIE1hdGguc3FydChJWzBdICogSVswXSArIElbMV0gKiBJWzFdKSkgKiAxODAgLyBNYXRoLlBJO1xuXG4gICAgICAgIHZhciBwYXJhbXMgPSBbYXppLCBlbGV2LCBQc2ksIEVdO1xuICAgICAgICByZXR1cm4gcGFyYW1zO1xuICAgIH1cbn1cbiIsIi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyAgQXJjaG9udGlzIFBvbGl0aXNcbi8vICBhcmNob250aXMucG9saXRpc0BhYWx0by5maVxuLy8gIERhdmlkIFBvaXJpZXItUXVpbm90XG4vLyAgZGF2aXBvaXJAaXJjYW0uZnJcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vL1xuLy8gIFdlYkF1ZGlvX0hPQSBhIEphdmFTY3JpcHQgbGlicmFyeSBmb3IgaGlnaGVyLW9yZGVyIEFtYmlzb25pY3Ncbi8vICBUaGUgbGlicmFyeSBpbXBsZW1lbnRzIFdlYiBBdWRpbyBibG9ja3MgdGhhdCBwZXJmb3JtXG4vLyAgdHlwaWNhbCBhbWJpc29uaWMgcHJvY2Vzc2luZyBvcGVyYXRpb25zIG9uIGF1ZGlvIHNpZ25hbHMuXG4vL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLyogQl9GT1JNQVQgQklOQVVSQUwgREVDT0RFUiAqL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQmZvcm1hdF9iaW5EZWNvZGVyIHtcblxuICAgIGNvbnN0cnVjdG9yKGF1ZGlvQ3R4KSB7XG4gICAgICAgIHRoaXMuaW5pdGlhbGl6ZWQgPSBmYWxzZTtcblxuICAgICAgICB0aGlzLmN0eCA9IGF1ZGlvQ3R4O1xuICAgICAgICB0aGlzLmRlY0ZpbHRlcnMgPSBuZXcgQXJyYXkoNCk7XG4gICAgICAgIHRoaXMuZGVjRmlsdGVyTm9kZXMgPSBuZXcgQXJyYXkoNCk7XG4gICAgICAgIC8vIGlucHV0IGFuZCBvdXRwdXQgbm9kZXNcbiAgICAgICAgdGhpcy5pbiA9IHRoaXMuY3R4LmNyZWF0ZUNoYW5uZWxTcGxpdHRlcig0KTtcbiAgICAgICAgdGhpcy5vdXQgPSB0aGlzLmN0eC5jcmVhdGVDaGFubmVsTWVyZ2VyKDIpO1xuICAgICAgICAvLyBkb3dubWl4aW5nIGdhaW5zIGZvciBsZWZ0IGFuZCByaWdodCBlYXJzXG4gICAgICAgIHRoaXMuZ2Fpbk1pZCA9IHRoaXMuY3R4LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgdGhpcy5nYWluU2lkZSA9IHRoaXMuY3R4LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgdGhpcy5pbnZlcnRTaWRlID0gdGhpcy5jdHguY3JlYXRlR2FpbigpO1xuICAgICAgICB0aGlzLmdhaW5NaWQuZ2Fpbi52YWx1ZSA9IDE7XG4gICAgICAgIHRoaXMuZ2FpblNpZGUuZ2Fpbi52YWx1ZSA9IDE7XG4gICAgICAgIHRoaXMuaW52ZXJ0U2lkZS5nYWluLnZhbHVlID0gLTE7XG4gICAgICAgIC8vIGluaXRpYWxpemUgY29udm9sdmVyc1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IDQ7IGkrKykge1xuICAgICAgICAgICAgdGhpcy5kZWNGaWx0ZXJOb2Rlc1tpXSA9IHRoaXMuY3R4LmNyZWF0ZUNvbnZvbHZlcigpO1xuICAgICAgICAgICAgdGhpcy5kZWNGaWx0ZXJOb2Rlc1tpXS5ub3JtYWxpemUgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICAvLyBpbml0aWFsaXplIGZpbHRlcnMgdG8gcGxhaW4gb3Bwb3NpbmcgY2FyZGlvaWRzXG4gICAgICAgIHRoaXMucmVzZXRGaWx0ZXJzKCk7XG5cbiAgICAgICAgLy8gQ3JlYXRlIGNvbm5lY3Rpb25zXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgNDsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLmluLmNvbm5lY3QodGhpcy5kZWNGaWx0ZXJOb2Rlc1tpXSwgaSwgMCk7XG5cbiAgICAgICAgICAgIGlmIChpID09IDIpIHRoaXMuZGVjRmlsdGVyTm9kZXNbaV0uY29ubmVjdCh0aGlzLmdhaW5TaWRlLCAwLCAwKTtcbiAgICAgICAgICAgIGVsc2UgdGhpcy5kZWNGaWx0ZXJOb2Rlc1tpXS5jb25uZWN0KHRoaXMuZ2Fpbk1pZCwgMCwgMCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5nYWluTWlkLmNvbm5lY3QodGhpcy5vdXQsIDAsIDApO1xuICAgICAgICB0aGlzLmdhaW5TaWRlLmNvbm5lY3QodGhpcy5vdXQsIDAsIDApO1xuXG4gICAgICAgIHRoaXMuZ2Fpbk1pZC5jb25uZWN0KHRoaXMub3V0LCAwLCAxKTtcbiAgICAgICAgdGhpcy5nYWluU2lkZS5jb25uZWN0KHRoaXMuaW52ZXJ0U2lkZSwgMCwgMCk7XG4gICAgICAgIHRoaXMuaW52ZXJ0U2lkZS5jb25uZWN0KHRoaXMub3V0LCAwLCAxKTtcblxuICAgICAgICB0aGlzLmluaXRpYWxpemVkID0gdHJ1ZTtcbiAgICB9XG5cblxuICAgIHVwZGF0ZUZpbHRlcnMoYXVkaW9CdWZmZXIpIHtcbiAgICAgICAgLy8gYXNzaWduIGZpbHRlcnMgdG8gY29udm9sdmVyc1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IDQ7IGkrKykge1xuICAgICAgICAgICAgdGhpcy5kZWNGaWx0ZXJzW2ldID0gdGhpcy5jdHguY3JlYXRlQnVmZmVyKDEsIGF1ZGlvQnVmZmVyLmxlbmd0aCwgYXVkaW9CdWZmZXIuc2FtcGxlUmF0ZSk7XG4gICAgICAgICAgICB0aGlzLmRlY0ZpbHRlcnNbaV0uZ2V0Q2hhbm5lbERhdGEoMCkuc2V0KGF1ZGlvQnVmZmVyLmdldENoYW5uZWxEYXRhKGkpKTtcblxuICAgICAgICAgICAgdGhpcy5kZWNGaWx0ZXJOb2Rlc1tpXS5idWZmZXIgPSB0aGlzLmRlY0ZpbHRlcnNbaV07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXNldEZpbHRlcnMoKSB7XG4gICAgICAgIC8vIG92ZXJ3cml0ZSBkZWNvZGluZyBmaWx0ZXJzIHdpdGggcGxhaW4gb3Bwb3NpbmcgY2FyZGlvaWRzXG4gICAgICAgIHZhciBjYXJkR2FpbnMgPSBbMC41ICogTWF0aC5TUVJUMiwgMCwgMC41LCAwXTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCA0OyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMuZGVjRmlsdGVyc1tpXSA9IHRoaXMuY3R4LmNyZWF0ZUJ1ZmZlcigxLCAxLCB0aGlzLmN0eC5zYW1wbGVSYXRlKTtcbiAgICAgICAgICAgIHRoaXMuZGVjRmlsdGVyc1tpXS5nZXRDaGFubmVsRGF0YSgwKS5zZXQoW2NhcmRHYWluc1tpXV0pO1xuXG4gICAgICAgICAgICB0aGlzLmRlY0ZpbHRlck5vZGVzW2ldLmJ1ZmZlciA9IHRoaXMuZGVjRmlsdGVyc1tpXTtcbiAgICAgICAgfVxuICAgIH1cbn1cbiIsIi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyAgQXJjaG9udGlzIFBvbGl0aXNcbi8vICBhcmNob250aXMucG9saXRpc0BhYWx0by5maVxuLy8gIERhdmlkIFBvaXJpZXItUXVpbm90XG4vLyAgZGF2aXBvaXJAaXJjYW0uZnJcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vL1xuLy8gIFdlYkF1ZGlvX0hPQSBhIEphdmFTY3JpcHQgbGlicmFyeSBmb3IgaGlnaGVyLW9yZGVyIEFtYmlzb25pY3Ncbi8vICBUaGUgbGlicmFyeSBpbXBsZW1lbnRzIFdlYiBBdWRpbyBibG9ja3MgdGhhdCBwZXJmb3JtXG4vLyAgdHlwaWNhbCBhbWJpc29uaWMgcHJvY2Vzc2luZyBvcGVyYXRpb25zIG9uIGF1ZGlvIHNpZ25hbHMuXG4vL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLyogQl9GT1JNQVQgRU5DT0RFUiAqL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBCZm9ybWF0X2VuY29kZXIge1xuXG4gICAgY29uc3RydWN0b3IoYXVkaW9DdHgpIHtcblxuICAgICAgICB0aGlzLmluaXRpYWxpemVkID0gZmFsc2U7XG5cbiAgICAgICAgdGhpcy5jdHggPSBhdWRpb0N0eDtcbiAgICAgICAgdGhpcy5hemkgPSAwO1xuICAgICAgICB0aGlzLmVsZXYgPSAwO1xuICAgICAgICB0aGlzLmdhaW5Ob2RlcyA9IG5ldyBBcnJheSg0KTtcbiAgICAgICAgdGhpcy5pbiA9IHRoaXMuY3R4LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgLy8gICAgdGhpcy5pbi5jaGFubmVsQ291bnRNb2RlID0gJ2V4cGxpY2l0JztcbiAgICAgICAgLy8gICAgdGhpcy5pbi5jaGFubmVsQ291bnQgPSAxO1xuICAgICAgICB0aGlzLm91dCA9IHRoaXMuY3R4LmNyZWF0ZUNoYW5uZWxNZXJnZXIoNCk7XG4gICAgICAgIC8vIGluaXRpYWxpemUgZ2FpbnMgdG8gZnJvbnQgZGlyZWN0aW9uXG4gICAgICAgIHRoaXMuZ2FpbnMgPSBbTWF0aC5TUVJUMV8yLCAxLCAwLCAwXTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCA0OyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMuZ2Fpbk5vZGVzW2ldID0gdGhpcy5jdHguY3JlYXRlR2FpbigpO1xuICAgICAgICAgICAgLy8gICAgICAgIHRoaXMuZ2Fpbk5vZGVzW2ldLmNoYW5uZWxDb3VudE1vZGUgPSAnZXhwbGljaXQnO1xuICAgICAgICAgICAgLy8gICAgICAgIHRoaXMuZ2Fpbk5vZGVzW2ldLmNoYW5uZWxDb3VudCA9IDE7XG4gICAgICAgICAgICB0aGlzLmdhaW5Ob2Rlc1tpXS5nYWluLnZhbHVlID0gdGhpcy5nYWluc1tpXTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENyZWF0ZSBjb25uZWN0aW9uc1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IDQ7IGkrKykge1xuICAgICAgICAgICAgdGhpcy5pbi5jb25uZWN0KHRoaXMuZ2Fpbk5vZGVzW2ldKTtcbiAgICAgICAgICAgIHRoaXMuZ2Fpbk5vZGVzW2ldLmNvbm5lY3QodGhpcy5vdXQsIDAsIGkpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5pbml0aWFsaXplZCA9IHRydWU7XG4gICAgfVxuXG4gICAgdXBkYXRlR2FpbnMoKSB7XG4gICAgICAgIGxldCBhemkgPSB0aGlzLmF6aSAqIE1hdGguUEkgLyAxODA7XG4gICAgICAgIGxldCBlbGV2ID0gdGhpcy5lbGV2ICogTWF0aC5QSSAvIDE4MDtcblxuICAgICAgICB0aGlzLmdhaW5zWzFdID0gTWF0aC5jb3MoYXppKSAqIE1hdGguY29zKGVsZXYpO1xuICAgICAgICB0aGlzLmdhaW5zWzJdID0gTWF0aC5zaW4oYXppKSAqIE1hdGguY29zKGVsZXYpO1xuICAgICAgICB0aGlzLmdhaW5zWzNdID0gTWF0aC5zaW4oZWxldik7XG5cbiAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPCA0OyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMuZ2Fpbk5vZGVzW2ldLmdhaW4udmFsdWUgPSB0aGlzLmdhaW5zW2ldO1xuICAgICAgICB9XG4gICAgfVxufVxuIiwiLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vICBBcmNob250aXMgUG9saXRpc1xuLy8gIGFyY2hvbnRpcy5wb2xpdGlzQGFhbHRvLmZpXG4vLyAgRGF2aWQgUG9pcmllci1RdWlub3Rcbi8vICBkYXZpcG9pckBpcmNhbS5mclxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vXG4vLyAgV2ViQXVkaW9fSE9BIGEgSmF2YVNjcmlwdCBsaWJyYXJ5IGZvciBoaWdoZXItb3JkZXIgQW1iaXNvbmljc1xuLy8gIFRoZSBsaWJyYXJ5IGltcGxlbWVudHMgV2ViIEF1ZGlvIGJsb2NrcyB0aGF0IHBlcmZvcm1cbi8vICB0eXBpY2FsIGFtYmlzb25pYyBwcm9jZXNzaW5nIG9wZXJhdGlvbnMgb24gYXVkaW8gc2lnbmFscy5cbi8vXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vKiBCX0ZPUk1BVCBST1RBVE9SICovXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEJmb3JtYXRfcm90YXRvciB7XG5cbiAgICBjb25zdHJ1Y3RvcihhdWRpb0N0eCkge1xuICAgICAgICB0aGlzLmluaXRpYWxpemVkID0gZmFsc2U7XG5cbiAgICAgICAgdGhpcy5jdHggPSBhdWRpb0N0eDtcbiAgICAgICAgdGhpcy55YXcgPSAwO1xuICAgICAgICB0aGlzLnBpdGNoID0gMDtcbiAgICAgICAgdGhpcy5yb2xsID0gMDtcbiAgICAgICAgdGhpcy5yb3RNdHggPSBbIFtdLCBbXSwgW10gXTtcbiAgICAgICAgdGhpcy5yb3RNdHhOb2RlcyA9IFsgW10sIFtdLCBbXSBdO1xuXG4gICAgICAgIC8vIElucHV0IGFuZCBvdXRwdXQgbm9kZXNcbiAgICAgICAgdGhpcy5pbiA9IHRoaXMuY3R4LmNyZWF0ZUNoYW5uZWxTcGxpdHRlcig0KTtcbiAgICAgICAgdGhpcy5vdXQgPSB0aGlzLmN0eC5jcmVhdGVDaGFubmVsTWVyZ2VyKDQpO1xuICAgICAgICAvLyBJbml0aWFsaXplIHJvdGF0aW9uIGdhaW5zIHRvIGlkZW50aXR5IG1hdHJpeFxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IDM7IGkrKykge1xuICAgICAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCAzOyBqKyspIHtcbiAgICAgICAgICAgICAgICB0aGlzLnJvdE10eE5vZGVzW2ldW2pdID0gY29udGV4dC5jcmVhdGVHYWluKCk7XG4gICAgICAgICAgICAgICAgaWYgKGkgPT0gaikgdGhpcy5yb3RNdHhOb2Rlc1tpXVtqXS5nYWluLnZhbHVlID0gMTtcbiAgICAgICAgICAgICAgICBlbHNlIHRoaXMucm90TXR4Tm9kZXNbaV1bal0uZ2Fpbi52YWx1ZSA9IDA7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gQ3JlYXRlIGNvbm5lY3Rpb25zXG4gICAgICAgIHRoaXMuaW4uY29ubmVjdCh0aGlzLm91dCwgMCwgMCk7XG5cbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCAzOyBpKyspIHtcbiAgICAgICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgMzsgaisrKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5pbi5jb25uZWN0KHRoaXMucm90TXR4Tm9kZXNbaV1bal0sIGogKyAxLCAwKTtcbiAgICAgICAgICAgICAgICB0aGlzLnJvdE10eE5vZGVzW2ldW2pdLmNvbm5lY3QodGhpcy5vdXQsIDAsIGkgKyAxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuaW5pdGlhbGl6ZWQgPSB0cnVlO1xuICAgIH1cblxuICAgIHVwZGF0ZVJvdE10eCgpIHtcbiAgICAgICAgdmFyIHlhdyA9IHRoaXMueWF3ICogTWF0aC5QSSAvIDE4MDtcbiAgICAgICAgdmFyIHBpdGNoID0gdGhpcy5waXRjaCAqIE1hdGguUEkgLyAxODA7XG4gICAgICAgIHZhciByb2xsID0gdGhpcy5yb2xsICogTWF0aC5QSSAvIDE4MDtcbiAgICAgICAgdmFyIFJ4eCwgUnh5LCBSeHosIFJ5eCwgUnl5LCBSeXosIFJ6eCwgUnp5LCBSeno7XG5cbiAgICAgICAgUnh4ID0gTWF0aC5jb3MocGl0Y2gpICogTWF0aC5jb3MoeWF3KTtcbiAgICAgICAgUnh5ID0gTWF0aC5jb3MocGl0Y2gpICogTWF0aC5zaW4oeWF3KTtcbiAgICAgICAgUnh6ID0gLU1hdGguc2luKHBpdGNoKTtcbiAgICAgICAgUnl4ID0gTWF0aC5jb3MoeWF3KSAqIE1hdGguc2luKHBpdGNoKSAqIE1hdGguc2luKHJvbGwpIC0gTWF0aC5jb3Mocm9sbCkgKiBNYXRoLnNpbih5YXcpO1xuICAgICAgICBSeXkgPSBNYXRoLmNvcyhyb2xsKSAqIE1hdGguY29zKHlhdykgKyBNYXRoLnNpbihwaXRjaCkgKiBNYXRoLnNpbihyb2xsKSAqIE1hdGguc2luKHlhdyk7XG4gICAgICAgIFJ5eiA9IE1hdGguY29zKHBpdGNoKSAqIE1hdGguc2luKHJvbGwpO1xuICAgICAgICBSenggPSBNYXRoLnNpbihyb2xsKSAqIE1hdGguc2luKHlhdykgKyBNYXRoLmNvcyhyb2xsKSAqIE1hdGguY29zKHlhdykgKiBNYXRoLnNpbihwaXRjaCk7XG4gICAgICAgIFJ6eSA9IE1hdGguY29zKHJvbGwpICogTWF0aC5zaW4ocGl0Y2gpICogTWF0aC5zaW4oeWF3KSAtIE1hdGguY29zKHlhdykgKiBNYXRoLnNpbihyb2xsKTtcbiAgICAgICAgUnp6ID0gTWF0aC5jb3MocGl0Y2gpICogTWF0aC5jb3Mocm9sbCk7XG5cbiAgICAgICAgdGhpcy5yb3RNdHggPSBbXG4gICAgICAgICAgICBbUnh4LCBSeHksIFJ4el0sXG4gICAgICAgICAgICBbUnl4LCBSeXksIFJ5el0sXG4gICAgICAgICAgICBbUnp4LCBSenksIFJ6el1cbiAgICAgICAgXTtcblxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IDM7IGkrKykge1xuICAgICAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCAzOyBqKyspIHtcbiAgICAgICAgICAgICAgICB0aGlzLnJvdE10eE5vZGVzW2ldW2pdLmdhaW4udmFsdWUgPSB0aGlzLnJvdE10eFtpXVtqXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cbiIsIi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyAgQXJjaG9udGlzIFBvbGl0aXNcbi8vICBhcmNob250aXMucG9saXRpc0BhYWx0by5maVxuLy8gIERhdmlkIFBvaXJpZXItUXVpbm90XG4vLyAgZGF2aXBvaXJAaXJjYW0uZnJcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vL1xuLy8gIFdlYkF1ZGlvX0hPQSBhIEphdmFTY3JpcHQgbGlicmFyeSBmb3IgaGlnaGVyLW9yZGVyIEFtYmlzb25pY3Ncbi8vICBUaGUgbGlicmFyeSBpbXBsZW1lbnRzIFdlYiBBdWRpbyBibG9ja3MgdGhhdCBwZXJmb3JtXG4vLyAgdHlwaWNhbCBhbWJpc29uaWMgcHJvY2Vzc2luZyBvcGVyYXRpb25zIG9uIGF1ZGlvIHNpZ25hbHMuXG4vL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vKiBCX0ZPUk1BVCBWSVJUVUFMIE1JQ1JPUEhPTkUgKi9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBCZm9ybWF0X3ZtaWMge1xuXG4gICAgY29uc3RydWN0b3IoYXVkaW9DdHgpIHtcbiAgICAgICAgdGhpcy5pbml0aWFsaXplZCA9IGZhbHNlO1xuXG4gICAgICAgIHRoaXMuY3R4ID0gYXVkaW9DdHg7XG4gICAgICAgIHRoaXMuYXppID0gMDtcbiAgICAgICAgdGhpcy5lbGV2ID0gMDtcbiAgICAgICAgdGhpcy52bWljR2Fpbk5vZGVzID0gbmV3IEFycmF5KDQpO1xuICAgICAgICB0aGlzLnZtaWNDb2VmZiA9IDAuNTtcbiAgICAgICAgdGhpcy52bWljUGF0dGVybiA9IFwiY2FyZGlvaWRcIjtcbiAgICAgICAgdGhpcy5pbiA9IHRoaXMuY3R4LmNyZWF0ZUNoYW5uZWxTcGxpdHRlcig0KTtcbiAgICAgICAgdGhpcy5vdXQgPSB0aGlzLmN0eC5jcmVhdGVHYWluKCk7XG4gICAgICAgIC8vIEluaXRpYWxpemUgdm1pYyB0byBmb3J3YXJkIGZhY2luZyBjYXJkaW9pZFxuICAgICAgICB0aGlzLnZtaWNHYWlucyA9IFswLjUgKiBNYXRoLlNRUlQyLCAwLjUsIDAsIDBdO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IDQ7IGkrKykge1xuICAgICAgICAgICAgdGhpcy52bWljR2Fpbk5vZGVzW2ldID0gdGhpcy5jdHguY3JlYXRlR2FpbigpO1xuICAgICAgICAgICAgdGhpcy52bWljR2Fpbk5vZGVzW2ldLmdhaW4udmFsdWUgPSB0aGlzLnZtaWNHYWluc1tpXTtcbiAgICAgICAgfVxuICAgICAgICAvLyBJbml0aWFsaXplIG9yaWVudGF0aW9uXG4gICAgICAgIHRoaXMueHl6ID0gWzEsIDAsIDBdO1xuICAgICAgICAvLyBDcmVhdGUgY29ubmVjdGlvbnNcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IDQ7IGkrKykge1xuICAgICAgICAgICAgdGhpcy5pbi5jb25uZWN0KHRoaXMudm1pY0dhaW5Ob2Rlc1tpXSwgaSwgMCk7XG4gICAgICAgICAgICB0aGlzLnZtaWNHYWluTm9kZXNbaV0uY29ubmVjdCh0aGlzLm91dCk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmluaXRpYWxpemVkID0gdHJ1ZTtcbiAgICB9XG5cbiAgICB1cGRhdGVQYXR0ZXJuKCkge1xuICAgICAgICBzd2l0Y2ggKHRoaXMudm1pY1BhdHRlcm4pIHtcbiAgICAgICAgICAgIGNhc2UgXCJzdWJjYXJkaW9pZFwiOlxuICAgICAgICAgICAgICAgIHRoaXMudm1pY0NvZWZmID0gMiAvIDM7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwiY2FyZGlvaWRcIjpcbiAgICAgICAgICAgICAgICB0aGlzLnZtaWNDb2VmZiA9IDEgLyAyO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcInN1cGVyY2FyZGlvaWRcIjpcbiAgICAgICAgICAgICAgICB0aGlzLnZtaWNDb2VmZiA9IChNYXRoLnNxcnQoMykgLSAxKSAvIDI7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwiaHlwZXJjYXJkaW9pZFwiOlxuICAgICAgICAgICAgICAgIHRoaXMudm1pY0NvZWZmID0gMSAvIDQ7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwiZGlwb2xlXCI6XG4gICAgICAgICAgICAgICAgdGhpcy52bWljQ29lZmYgPSAwO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICB0aGlzLnZtaWNQYXR0ZXJuID0gXCJjYXJkaW9pZFwiO1xuICAgICAgICAgICAgICAgIHRoaXMudm1pY0NvZWZmID0gMSAvIDI7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy51cGRhdGVHYWlucygpO1xuICAgIH1cblxuICAgIHVwZGF0ZU9yaWVudGF0aW9uKCkge1xuICAgICAgICB2YXIgYXppID0gdGhpcy5hemkgKiBNYXRoLlBJIC8gMTgwO1xuICAgICAgICB2YXIgZWxldiA9IHRoaXMuZWxldiAqIE1hdGguUEkgLyAxODA7XG5cbiAgICAgICAgdGhpcy54eXpbMF0gPSBNYXRoLmNvcyhhemkpICogTWF0aC5jb3MoZWxldik7XG4gICAgICAgIHRoaXMueHl6WzFdID0gTWF0aC5zaW4oYXppKSAqIE1hdGguY29zKGVsZXYpO1xuICAgICAgICB0aGlzLnh5elsyXSA9IE1hdGguc2luKGVsZXYpO1xuXG4gICAgICAgIHRoaXMudXBkYXRlR2FpbnMoKTtcbiAgICB9XG5cbiAgICB1cGRhdGVHYWlucygpIHtcbiAgICAgICAgdmFyIGEgPSB0aGlzLnZtaWNDb2VmZjtcbiAgICAgICAgdmFyIHh5eiA9IHRoaXMueHl6O1xuICAgICAgICB0aGlzLnZtaWNHYWluc1swXSA9IGEgKiBNYXRoLlNRUlQyO1xuICAgICAgICB0aGlzLnZtaWNHYWluc1sxXSA9ICgxIC0gYSkgKiB4eXpbMF07XG4gICAgICAgIHRoaXMudm1pY0dhaW5zWzJdID0gKDEgLSBhKSAqIHh5elsxXTtcbiAgICAgICAgdGhpcy52bWljR2FpbnNbM10gPSAoMSAtIGEpICogeHl6WzJdO1xuXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgNDsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLnZtaWNHYWluTm9kZXNbaV0uZ2Fpbi52YWx1ZSA9IHRoaXMudm1pY0dhaW5zW2ldO1xuICAgICAgICB9XG4gICAgfVxufVxuIiwiLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vICBBcmNob250aXMgUG9saXRpc1xuLy8gIGFyY2hvbnRpcy5wb2xpdGlzQGFhbHRvLmZpXG4vLyAgRGF2aWQgUG9pcmllci1RdWlub3Rcbi8vICBkYXZpcG9pckBpcmNhbS5mclxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vXG4vLyAgV2ViQXVkaW9fSE9BIGEgSmF2YVNjcmlwdCBsaWJyYXJ5IGZvciBoaWdoZXItb3JkZXIgQW1iaXNvbmljc1xuLy8gIFRoZSBsaWJyYXJ5IGltcGxlbWVudHMgV2ViIEF1ZGlvIGJsb2NrcyB0aGF0IHBlcmZvcm1cbi8vICB0eXBpY2FsIGFtYmlzb25pYyBwcm9jZXNzaW5nIG9wZXJhdGlvbnMgb24gYXVkaW8gc2lnbmFscy5cbi8vXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8qIEhPQSBJTlRFTlNJVFkgQU5BTFlaRVIgKi9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBIT0FfYW5hbHlzZXIge1xuICAgIGNvbnN0cnVjdG9yKGF1ZGlvQ3R4LCBvcmRlcikge1xuICAgICAgICB0aGlzLmluaXRpYWxpemVkID0gZmFsc2U7XG5cbiAgICAgICAgdGhpcy5jdHggPSBhdWRpb0N0eDtcbiAgICAgICAgdGhpcy5vcmRlciA9IG9yZGVyO1xuICAgICAgICB0aGlzLm5DaCA9IChvcmRlciArIDEpICogKG9yZGVyICsgMSk7XG4gICAgICAgIHRoaXMuZmZ0U2l6ZSA9IDIwNDg7XG4gICAgICAgIHRoaXMuYW5hbHlzZXJzID0gbmV3IEFycmF5KHRoaXMubkNoKTtcbiAgICAgICAgdGhpcy5hbmFsQnVmZmVycyA9IG5ldyBBcnJheSh0aGlzLm5DaCk7XG4gICAgICAgIC8vIElucHV0IGFuZCBvdXRwdXQgbm9kZXNcbiAgICAgICAgdGhpcy5pbiA9IHRoaXMuY3R4LmNyZWF0ZUNoYW5uZWxTcGxpdHRlcih0aGlzLm5DaCk7XG4gICAgICAgIHRoaXMub3V0ID0gdGhpcy5jdHguY3JlYXRlQ2hhbm5lbE1lcmdlcih0aGlzLm5DaCk7XG4gICAgICAgIC8vIEluaXRpYWxpemUgYW5hbHl6ZXIgYnVmZmVyc1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMubkNoOyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMuYW5hbHlzZXJzW2ldID0gdGhpcy5jdHguY3JlYXRlQW5hbHlzZXIoKTtcbiAgICAgICAgICAgIHRoaXMuYW5hbHlzZXJzW2ldLmZmdFNpemUgPSB0aGlzLmZmdFNpemU7XG4gICAgICAgICAgICB0aGlzLmFuYWx5c2Vyc1tpXS5zbW9vdGhpbmdUaW1lQ29uc3RhbnQgPSAwO1xuICAgICAgICAgICAgdGhpcy5hbmFsQnVmZmVyc1tpXSA9IG5ldyBGbG9hdDMyQXJyYXkodGhpcy5mZnRTaXplKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBDcmVhdGUgY29ubmVjdGlvbnNcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLm5DaDsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLmluLmNvbm5lY3QodGhpcy5vdXQsIGksIGkpO1xuICAgICAgICAgICAgdGhpcy5pbi5jb25uZWN0KHRoaXMuYW5hbHlzZXJzW2ldLCBpLCAwKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuaW5pdGlhbGl6ZWQgPSB0cnVlO1xuICAgIH1cblxuICAgIHVwZGF0ZUJ1ZmZlcnMoKSB7XG4gICAgICAgIC8vIEdldCBsYXRlc3QgdGltZS1kb21haW4gZGF0YVxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMubkNoOyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMuYW5hbHlzZXJzW2ldLmdldEZsb2F0VGltZURvbWFpbkRhdGEodGhpcy5hbmFsQnVmZmVyc1tpXSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBjb21wdXRlSW50ZW5zaXR5KCkge1xuICAgICAgICAvLyBDb21wdXRlIGNvcnJlbGF0aW9ucyBhbmQgZW5lcmdpZXMgb2YgY2hhbm5lbHNcbiAgICAgICAgdmFyIGlDaCA9IG5ldyBBcnJheSh0aGlzLm5DaCkuZmlsbCgwKTsgLy8gaW50ZW5zaXR5XG4gICAgICAgIHZhciBjb3JyQ2ggPSBuZXcgQXJyYXkodGhpcy5uQ2gpLmZpbGwoMCk7IC8vIGNvcnJlbGF0aW9uXG4gICAgICAgIHZhciBJX25vcm0sIEUsIFBzaSwgYXppLCBlbGV2O1xuICAgICAgICAvLyBBY2N1bXVsYXRvcnMgZm9yIGNvcnJlbGF0aW9ucyBhbmQgZW5lcmdpZXNcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmZmdFNpemU7IGkrKykge1xuICAgICAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCB0aGlzLm5DaDsgaisrKSB7XG5cbiAgICAgICAgICAgICAgICBpZiAoaj09MCkge1xuICAgICAgICAgICAgICAgICAgICBjb3JyQ2hbal0gKz0gMiAqIHRoaXMuYW5hbEJ1ZmZlcnNbal1baV0gKiB0aGlzLmFuYWxCdWZmZXJzW2pdW2ldO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY29yckNoW2pdICs9IHRoaXMuYW5hbEJ1ZmZlcnNbal1baV0gKiB0aGlzLmFuYWxCdWZmZXJzW2pdW2ldO1xuICAgICAgICAgICAgICAgICAgICBpQ2hbal0gKz0gTWF0aC5zcXJ0KDIpICogdGhpcy5hbmFsQnVmZmVyc1swXVtpXSAqIHRoaXMuYW5hbEJ1ZmZlcnNbal1baV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgbGV0IHN1bW1lZEludCA9IDA7XG4gICAgICAgIGxldCBzdW1tZWRDb3JyID0gMDtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBpQ2gubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmIChpICE9IDApIHN1bW1lZEludCArPSBpQ2hbaV0gKiBpQ2hbaV07XG4gICAgICAgICAgICBzdW1tZWRDb3JyICs9IGNvcnJDaFtpXTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFRPIFVQR1JBREU6IGZvciBub3cgdGhlIGFuYWx5c2VyIG9ubHkgY29uc2lkZXJzIHRoZSBmaXJzdCA0IGNoYW5uZWxzXG4gICAgICAgIC8vIG9mIHRoZSBBbWJpc29uaWMgc3RyZWFtXG4gICAgICAgIElfbm9ybSA9IE1hdGguc3FydChzdW1tZWRJbnQpOyAvLyBpbnRlbnNpdHkgbWFnbml0dWRlXG4gICAgICAgIEUgPSBzdW1tZWRDb3JyIC8gMjsgLy8gZW5lcmd5XG4gICAgICAgIFBzaSA9IDEgLSBJX25vcm0gLyAoRSArIDEwZS04KTsgLy8gZGlmZnVzZW5lc3NcbiAgICAgICAgYXppID0gTWF0aC5hdGFuMihpQ2hbMV0sIGlDaFszXSkgKiAxODAgLyBNYXRoLlBJO1xuICAgICAgICBlbGV2ID0gTWF0aC5hdGFuMihpQ2hbMl0sIE1hdGguc3FydChpQ2hbMV0gKiBpQ2hbMV0gKyBpQ2hbM10gKiBpQ2hbM10pKSAqIDE4MCAvIE1hdGguUEk7XG4gICAgICAgIHZhciBwYXJhbXMgPSBbYXppLCBlbGV2LCBQc2ksIEVdO1xuICAgICAgICByZXR1cm4gcGFyYW1zO1xuICAgIH1cbn1cbiIsIi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyAgQXJjaG9udGlzIFBvbGl0aXNcbi8vICBhcmNob250aXMucG9saXRpc0BhYWx0by5maVxuLy8gIERhdmlkIFBvaXJpZXItUXVpbm90XG4vLyAgZGF2aXBvaXJAaXJjYW0uZnJcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vL1xuLy8gIFdlYkF1ZGlvX0hPQSBhIEphdmFTY3JpcHQgbGlicmFyeSBmb3IgaGlnaGVyLW9yZGVyIEFtYmlzb25pY3Ncbi8vICBUaGUgbGlicmFyeSBpbXBsZW1lbnRzIFdlYiBBdWRpbyBibG9ja3MgdGhhdCBwZXJmb3JtXG4vLyAgdHlwaWNhbCBhbWJpc29uaWMgcHJvY2Vzc2luZyBvcGVyYXRpb25zIG9uIGF1ZGlvIHNpZ25hbHMuXG4vL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8qIEItRk9STUFUIFRPIEFDTi9OM0QgQ09OVkVSVEVSICovXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuZXhwb3J0IGNsYXNzIEhPQV9iZjJhY24ge1xuXG4gICAgY29uc3RydWN0b3IoYXVkaW9DdHgpIHtcblxuICAgICAgICB0aGlzLmN0eCA9IGF1ZGlvQ3R4O1xuICAgICAgICB0aGlzLmluID0gdGhpcy5jdHguY3JlYXRlQ2hhbm5lbFNwbGl0dGVyKDQpO1xuICAgICAgICB0aGlzLm91dCA9IHRoaXMuY3R4LmNyZWF0ZUNoYW5uZWxNZXJnZXIoNCk7XG4gICAgICAgIHRoaXMuZ2FpbnMgPSBbXTtcblxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IDQ7IGkrKykge1xuICAgICAgICAgICAgdGhpcy5nYWluc1tpXSA9IHRoaXMuY3R4LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgICAgIGlmIChpID09IDApIHRoaXMuZ2FpbnNbaV0uZ2Fpbi52YWx1ZSA9IE1hdGguU1FSVDI7XG4gICAgICAgICAgICBlbHNlIHRoaXMuZ2FpbnNbaV0uZ2Fpbi52YWx1ZSA9IE1hdGguc3FydCgzKTtcblxuICAgICAgICAgICAgdGhpcy5nYWluc1tpXS5jb25uZWN0KHRoaXMub3V0LCAwLCBpKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmluLmNvbm5lY3QodGhpcy5nYWluc1swXSwgMCwgMCk7XG4gICAgICAgIHRoaXMuaW4uY29ubmVjdCh0aGlzLmdhaW5zWzNdLCAxLCAwKTtcbiAgICAgICAgdGhpcy5pbi5jb25uZWN0KHRoaXMuZ2FpbnNbMV0sIDIsIDApO1xuICAgICAgICB0aGlzLmluLmNvbm5lY3QodGhpcy5nYWluc1syXSwgMywgMCk7XG4gICAgfVxufVxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLyogQUNOL04zRCBUTyBCLUZPUk1BVCBDT05WRVJURVIgKi9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5leHBvcnQgY2xhc3MgSE9BX2FjbjJiZiB7XG5cbiAgICBjb25zdHJ1Y3RvcihhdWRpb0N0eCkge1xuXG4gICAgICAgIHRoaXMuY3R4ID0gYXVkaW9DdHg7XG4gICAgICAgIHRoaXMuaW4gPSB0aGlzLmN0eC5jcmVhdGVDaGFubmVsU3BsaXR0ZXIoNCk7XG4gICAgICAgIHRoaXMub3V0ID0gdGhpcy5jdHguY3JlYXRlQ2hhbm5lbE1lcmdlcig0KTtcbiAgICAgICAgdGhpcy5nYWlucyA9IFtdO1xuXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgNDsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLmdhaW5zW2ldID0gdGhpcy5jdHguY3JlYXRlR2FpbigpO1xuICAgICAgICAgICAgaWYgKGkgPT0gMCkgdGhpcy5nYWluc1tpXS5nYWluLnZhbHVlID0gTWF0aC5TUVJUMV8yO1xuICAgICAgICAgICAgZWxzZSB0aGlzLmdhaW5zW2ldLmdhaW4udmFsdWUgPSAxIC8gTWF0aC5zcXJ0KDMpO1xuXG4gICAgICAgICAgICB0aGlzLmdhaW5zW2ldLmNvbm5lY3QodGhpcy5vdXQsIDAsIGkpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuaW4uY29ubmVjdCh0aGlzLmdhaW5zWzBdLCAwLCAwKTtcbiAgICAgICAgdGhpcy5pbi5jb25uZWN0KHRoaXMuZ2FpbnNbMl0sIDEsIDApO1xuICAgICAgICB0aGlzLmluLmNvbm5lY3QodGhpcy5nYWluc1szXSwgMiwgMCk7XG4gICAgICAgIHRoaXMuaW4uY29ubmVjdCh0aGlzLmdhaW5zWzFdLCAzLCAwKTtcbiAgICB9XG59XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vKiBBQ04vTjNEIFRPIEItRk9STUFUIENPTlZFUlRFUiAqL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbmV4cG9ydCBjbGFzcyBIT0FfZnVtYTJhY24ge1xuXG4gICAgY29uc3RydWN0b3IoYXVkaW9DdHgsIG9yZGVyKSB7XG5cbiAgICAgICAgdGhpcy5jdHggPSBhdWRpb0N0eDtcbiAgICAgICAgdGhpcy5vcmRlciA9IG9yZGVyO1xuICAgICAgICB0aGlzLm5DaCA9IChvcmRlciArIDEpICogKG9yZGVyICsgMSk7XG4gICAgICAgIHRoaXMuaW4gPSB0aGlzLmN0eC5jcmVhdGVDaGFubmVsU3BsaXR0ZXIodGhpcy5uQ2gpO1xuICAgICAgICB0aGlzLm91dCA9IHRoaXMuY3R4LmNyZWF0ZUNoYW5uZWxNZXJnZXIodGhpcy5uQ2gpO1xuICAgICAgICB0aGlzLmdhaW5zID0gW107XG4gICAgICAgIHRoaXMucmVtYXBBcnJheSA9IFtdO1xuXG4gICAgICAgIC8vIGdldCBjaGFubmVsIHJlbWFwcGluZyB2YWx1ZXMgb3JkZXIgMC0xXG4gICAgICAgIHRoaXMucmVtYXBBcnJheS5wdXNoKDAsIDIsIDMsIDEpOyAvLyBtYW51YWxseSBoYW5kbGUgdW50aWwgb3JkZXIgMVxuXG4gICAgICAgIC8vIGdldCBjaGFubmVsIHJlbWFwcGluZyB2YWx1ZXMgb3JkZXIgMi1OXG4gICAgICAgIHZhciBvID0gMDtcbiAgICAgICAgdmFyIG07XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5uQ2g7IGkrKykge1xuICAgICAgICAgICAgbSA9IFtdO1xuICAgICAgICAgICAgaWYgKGkgPj0gKG8gKyAxKSAqIChvICsgMSkpIHtcbiAgICAgICAgICAgICAgICBvICs9IDE7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IChvICsgMSkgKiAobyArIDEpOyBqIDwgKG8gKyAyKSAqIChvICsgMik7IGorKykge1xuICAgICAgICAgICAgICAgICAgICBpZiAoKChqICsgbyAlIDIpICUgMikgPT0gMCkgeyBtLnB1c2goaikgfSBlbHNlIHsgbS51bnNoaWZ0KGopIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5yZW1hcEFycmF5ID0gdGhpcy5yZW1hcEFycmF5LmNvbmNhdChtKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGNvbm5lY3QgaW5wdXRzL291dHB1dHMgKGtlcHQgc2VwYXJhdGVkIGZvciBjbGFyaXR5J3Mgc2FrZSlcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm5DaDsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLmdhaW5zW2ldID0gdGhpcy5jdHguY3JlYXRlR2FpbigpO1xuICAgICAgICAgICAgdGhpcy5pbi5jb25uZWN0KHRoaXMuZ2FpbnNbaV0sIHRoaXMucmVtYXBBcnJheVtpXSwgMCk7XG4gICAgICAgICAgICB0aGlzLmdhaW5zW2ldLmNvbm5lY3QodGhpcy5vdXQsIDAsIGkpO1xuICAgICAgICB9XG4gICAgfVxufVxuIiwiLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vICBBcmNob250aXMgUG9saXRpc1xuLy8gIGFyY2hvbnRpcy5wb2xpdGlzQGFhbHRvLmZpXG4vLyAgRGF2aWQgUG9pcmllci1RdWlub3Rcbi8vICBkYXZpcG9pckBpcmNhbS5mclxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vXG4vLyAgV2ViQXVkaW9fSE9BIGEgSmF2YVNjcmlwdCBsaWJyYXJ5IGZvciBoaWdoZXItb3JkZXIgQW1iaXNvbmljc1xuLy8gIFRoZSBsaWJyYXJ5IGltcGxlbWVudHMgV2ViIEF1ZGlvIGJsb2NrcyB0aGF0IHBlcmZvcm1cbi8vICB0eXBpY2FsIGFtYmlzb25pYyBwcm9jZXNzaW5nIG9wZXJhdGlvbnMgb24gYXVkaW8gc2lnbmFscy5cbi8vXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLyogSE9BIEJJTkFVUkFMIERFQ09ERVIgKi9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEhPQV9iaW5EZWNvZGVyIHtcblxuICAgIGNvbnN0cnVjdG9yKGF1ZGlvQ3R4LCBvcmRlcikge1xuXG4gICAgICAgIHRoaXMuaW5pdGlhbGl6ZWQgPSBmYWxzZTtcblxuICAgICAgICB0aGlzLmN0eCA9IGF1ZGlvQ3R4O1xuICAgICAgICB0aGlzLm9yZGVyID0gb3JkZXI7XG4gICAgICAgIHRoaXMubkNoID0gKG9yZGVyICsgMSkgKiAob3JkZXIgKyAxKTtcbiAgICAgICAgdGhpcy5kZWNGaWx0ZXJzID0gbmV3IEFycmF5KHRoaXMubkNoKTtcbiAgICAgICAgdGhpcy5kZWNGaWx0ZXJOb2RlcyA9IG5ldyBBcnJheSh0aGlzLm5DaCk7XG4gICAgICAgIC8vIGlucHV0IGFuZCBvdXRwdXQgbm9kZXNcbiAgICAgICAgdGhpcy5pbiA9IHRoaXMuY3R4LmNyZWF0ZUNoYW5uZWxTcGxpdHRlcih0aGlzLm5DaCk7XG4gICAgICAgIHRoaXMub3V0ID0gdGhpcy5jdHguY3JlYXRlQ2hhbm5lbE1lcmdlcigyKTtcbiAgICAgICAgLy8gZG93bm1peGluZyBnYWlucyBmb3IgbGVmdCBhbmQgcmlnaHQgZWFyc1xuICAgICAgICB0aGlzLmdhaW5NaWQgPSB0aGlzLmN0eC5jcmVhdGVHYWluKCk7XG4gICAgICAgIHRoaXMuZ2FpblNpZGUgPSB0aGlzLmN0eC5jcmVhdGVHYWluKCk7XG4gICAgICAgIHRoaXMuaW52ZXJ0U2lkZSA9IHRoaXMuY3R4LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgdGhpcy5nYWluTWlkLmdhaW4udmFsdWUgPSAxO1xuICAgICAgICB0aGlzLmdhaW5TaWRlLmdhaW4udmFsdWUgPSAxO1xuICAgICAgICB0aGlzLmludmVydFNpZGUuZ2Fpbi52YWx1ZSA9IC0xO1xuICAgICAgICAvLyBjb252b2x2ZXIgbm9kZXNcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm5DaDsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLmRlY0ZpbHRlck5vZGVzW2ldID0gdGhpcy5jdHguY3JlYXRlQ29udm9sdmVyKCk7XG4gICAgICAgICAgICB0aGlzLmRlY0ZpbHRlck5vZGVzW2ldLm5vcm1hbGl6ZSA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIC8vIGluaXRpYWxpemUgY29udm9sdmVycyB0byBwbGFpbiBjYXJkaW9pZHNcbiAgICAgICAgdGhpcy5yZXNldEZpbHRlcnMoKTtcbiAgICAgICAgLy8gY3JlYXRlIGF1ZGlvIGNvbm5lY3Rpb25zXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5uQ2g7IGkrKykge1xuICAgICAgICAgICAgdGhpcy5pbi5jb25uZWN0KHRoaXMuZGVjRmlsdGVyTm9kZXNbaV0sIGksIDApO1xuICAgICAgICAgICAgdmFyIG4gPSBNYXRoLmZsb29yKE1hdGguc3FydChpKSk7XG4gICAgICAgICAgICB2YXIgbSA9IGkgLSBuICogbiAtIG47XG4gICAgICAgICAgICBpZiAobSA+PSAwKSB0aGlzLmRlY0ZpbHRlck5vZGVzW2ldLmNvbm5lY3QodGhpcy5nYWluTWlkKTtcbiAgICAgICAgICAgIGVsc2UgdGhpcy5kZWNGaWx0ZXJOb2Rlc1tpXS5jb25uZWN0KHRoaXMuZ2FpblNpZGUpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZ2Fpbk1pZC5jb25uZWN0KHRoaXMub3V0LCAwLCAwKTtcbiAgICAgICAgdGhpcy5nYWluU2lkZS5jb25uZWN0KHRoaXMub3V0LCAwLCAwKTtcblxuICAgICAgICB0aGlzLmdhaW5NaWQuY29ubmVjdCh0aGlzLm91dCwgMCwgMSk7XG4gICAgICAgIHRoaXMuZ2FpblNpZGUuY29ubmVjdCh0aGlzLmludmVydFNpZGUsIDAsIDApO1xuICAgICAgICB0aGlzLmludmVydFNpZGUuY29ubmVjdCh0aGlzLm91dCwgMCwgMSk7XG5cbiAgICAgICAgdGhpcy5pbml0aWFsaXplZCA9IHRydWU7XG4gICAgfVxuXG4gICAgdXBkYXRlRmlsdGVycyhhdWRpb0J1ZmZlcikge1xuICAgICAgICAvLyBhc3NpZ24gZmlsdGVycyB0byBjb252b2x2ZXJzXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5uQ2g7IGkrKykge1xuICAgICAgICAgICAgdGhpcy5kZWNGaWx0ZXJzW2ldID0gdGhpcy5jdHguY3JlYXRlQnVmZmVyKDEsIGF1ZGlvQnVmZmVyLmxlbmd0aCwgYXVkaW9CdWZmZXIuc2FtcGxlUmF0ZSk7XG4gICAgICAgICAgICB0aGlzLmRlY0ZpbHRlcnNbaV0uZ2V0Q2hhbm5lbERhdGEoMCkuc2V0KGF1ZGlvQnVmZmVyLmdldENoYW5uZWxEYXRhKGkpKTtcblxuICAgICAgICAgICAgdGhpcy5kZWNGaWx0ZXJOb2Rlc1tpXS5idWZmZXIgPSB0aGlzLmRlY0ZpbHRlcnNbaV07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXNldEZpbHRlcnMoKSB7XG4gICAgICAgIC8vIG92ZXJ3cml0ZSBkZWNvZGluZyBmaWx0ZXJzIChwbGFpbiBjYXJkaW9pZCB2aXJ0dWFsIG1pY3JvcGhvbmVzKVxuICAgICAgICB2YXIgY2FyZEdhaW5zID0gbmV3IEFycmF5KHRoaXMubkNoKTtcbiAgICAgICAgY2FyZEdhaW5zLmZpbGwoMCk7XG4gICAgICAgIGNhcmRHYWluc1swXSA9IDAuNTtcbiAgICAgICAgY2FyZEdhaW5zWzFdID0gMC41IC8gTWF0aC5zcXJ0KDMpO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubkNoOyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMuZGVjRmlsdGVyc1tpXSA9IHRoaXMuY3R4LmNyZWF0ZUJ1ZmZlcigxLCAxLCB0aGlzLmN0eC5zYW1wbGVSYXRlKTtcbiAgICAgICAgICAgIHRoaXMuZGVjRmlsdGVyc1tpXS5nZXRDaGFubmVsRGF0YSgwKS5zZXQoW2NhcmRHYWluc1tpXV0pO1xuICAgICAgICAgICAgdGhpcy5kZWNGaWx0ZXJOb2Rlc1tpXS5idWZmZXIgPSB0aGlzLmRlY0ZpbHRlcnNbaV07XG4gICAgICAgIH1cbiAgICB9XG59XG4iLCIvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gIEFyY2hvbnRpcyBQb2xpdGlzXG4vLyAgYXJjaG9udGlzLnBvbGl0aXNAYWFsdG8uZmlcbi8vICBEYXZpZCBQb2lyaWVyLVF1aW5vdFxuLy8gIGRhdmlwb2lyQGlyY2FtLmZyXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy9cbi8vICBXZWJBdWRpb19IT0EgYSBKYXZhU2NyaXB0IGxpYnJhcnkgZm9yIGhpZ2hlci1vcmRlciBBbWJpc29uaWNzXG4vLyAgVGhlIGxpYnJhcnkgaW1wbGVtZW50cyBXZWIgQXVkaW8gYmxvY2tzIHRoYXQgcGVyZm9ybVxuLy8gIHR5cGljYWwgYW1iaXNvbmljIHByb2Nlc3Npbmcgb3BlcmF0aW9ucyBvbiBhdWRpbyBzaWduYWxzLlxuLy9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbi8vLy8vLy8vLy8vLy8vLy8vXG4vKiBIT0EgRU5DT0RFUiAqL1xuLy8vLy8vLy8vLy8vLy8vLy9cblxuaW1wb3J0ICogYXMganNobGliIGZyb20gJy4vanNoLWxpYic7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEhPQV9lbmNvZGVyIHtcblxuICAgIGNvbnN0cnVjdG9yKGF1ZGlvQ3R4LCBvcmRlcikge1xuXG4gICAgICAgIHRoaXMuaW5pdGlhbGl6ZWQgPSBmYWxzZTtcblxuICAgICAgICB0aGlzLmN0eCA9IGF1ZGlvQ3R4O1xuICAgICAgICB0aGlzLm9yZGVyID0gb3JkZXI7XG4gICAgICAgIHRoaXMubkNoID0gKG9yZGVyICsgMSkgKiAob3JkZXIgKyAxKTtcbiAgICAgICAgdGhpcy5hemkgPSAwO1xuICAgICAgICB0aGlzLmVsZXYgPSAwO1xuICAgICAgICB0aGlzLmdhaW5zID0gbmV3IEFycmF5KHRoaXMubkNoKTtcbiAgICAgICAgdGhpcy5nYWluTm9kZXMgPSBuZXcgQXJyYXkodGhpcy5uQ2gpO1xuICAgICAgICB0aGlzLmluID0gdGhpcy5jdHguY3JlYXRlR2FpbigpO1xuICAgICAgICB0aGlzLmluLmNoYW5uZWxDb3VudE1vZGUgPSAnZXhwbGljaXQnO1xuICAgICAgICB0aGlzLmluLmNoYW5uZWxDb3VudCA9IDE7XG4gICAgICAgIHRoaXMub3V0ID0gdGhpcy5jdHguY3JlYXRlQ2hhbm5lbE1lcmdlcih0aGlzLm5DaCk7XG4gICAgICAgIC8vIEluaXRpYWxpemUgZW5jb2RpbmcgZ2FpbnNcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm5DaDsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLmdhaW5Ob2Rlc1tpXSA9IHRoaXMuY3R4LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgICAgIHRoaXMuZ2Fpbk5vZGVzW2ldLmNoYW5uZWxDb3VudE1vZGUgPSAnZXhwbGljaXQnO1xuICAgICAgICAgICAgdGhpcy5nYWluTm9kZXNbaV0uY2hhbm5lbENvdW50ID0gMTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnVwZGF0ZUdhaW5zKCk7XG4gICAgICAgIC8vIE1ha2UgYXVkaW8gY29ubmVjdGlvbnNcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm5DaDsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLmluLmNvbm5lY3QodGhpcy5nYWluTm9kZXNbaV0pO1xuICAgICAgICAgICAgdGhpcy5nYWluTm9kZXNbaV0uY29ubmVjdCh0aGlzLm91dCwgMCwgaSk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmluaXRpYWxpemVkID0gdHJ1ZTtcbiAgICB9XG5cbiAgICB1cGRhdGVHYWlucygpIHtcbiAgICAgICAgdmFyIE4gPSB0aGlzLm9yZGVyO1xuICAgICAgICB2YXIgZ19lbmMgPSBqc2hsaWIuY29tcHV0ZVJlYWxTSChOLCBbXG4gICAgICAgICAgICBbdGhpcy5hemkgKiBNYXRoLlBJIC8gMTgwLCB0aGlzLmVsZXYgKiBNYXRoLlBJIC8gMTgwXVxuICAgICAgICBdKTtcblxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubkNoOyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMuZ2FpbnNbaV0gPSBnX2VuY1tpXVswXTtcbiAgICAgICAgICAgIHRoaXMuZ2Fpbk5vZGVzW2ldLmdhaW4udmFsdWUgPSB0aGlzLmdhaW5zW2ldO1xuICAgICAgICB9XG4gICAgfVxufVxuIiwiLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vICBBcmNob250aXMgUG9saXRpc1xuLy8gIGFyY2hvbnRpcy5wb2xpdGlzQGFhbHRvLmZpXG4vLyAgRGF2aWQgUG9pcmllci1RdWlub3Rcbi8vICBkYXZpcG9pckBpcmNhbS5mclxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vXG4vLyAgV2ViQXVkaW9fSE9BIGEgSmF2YVNjcmlwdCBsaWJyYXJ5IGZvciBoaWdoZXItb3JkZXIgQW1iaXNvbmljc1xuLy8gIFRoZSBsaWJyYXJ5IGltcGxlbWVudHMgV2ViIEF1ZGlvIGJsb2NrcyB0aGF0IHBlcmZvcm1cbi8vICB0eXBpY2FsIGFtYmlzb25pYyBwcm9jZXNzaW5nIG9wZXJhdGlvbnMgb24gYXVkaW8gc2lnbmFscy5cbi8vXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLyogSE9BIE9SREVSIExJTUlURVIgKi9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEhPQV9vcmRlckxpbWl0ZXIge1xuXG4gICAgY29uc3RydWN0b3IoYXVkaW9DdHgsIG9yZGVySW4sIG9yZGVyT3V0KSB7XG5cbiAgICAgICAgdGhpcy5jdHggPSBhdWRpb0N0eDtcbiAgICAgICAgdGhpcy5vcmRlckluID0gb3JkZXJJbjtcbiAgICAgICAgaWYgKG9yZGVyT3V0IDwgb3JkZXJJbikgdGhpcy5vcmRlck91dCA9IG9yZGVyT3V0O1xuICAgICAgICBlbHNlIHRoaXMub3JkZXJPdXQgPSBvcmRlckluO1xuXG4gICAgICAgIHRoaXMubkNoSW4gPSAodGhpcy5vcmRlckluICsgMSkgKiAodGhpcy5vcmRlckluICsgMSk7XG4gICAgICAgIHRoaXMubkNoT3V0ID0gKHRoaXMub3JkZXJPdXQgKyAxKSAqICh0aGlzLm9yZGVyT3V0ICsgMSk7XG4gICAgICAgIHRoaXMuaW4gPSB0aGlzLmN0eC5jcmVhdGVDaGFubmVsU3BsaXR0ZXIodGhpcy5uQ2hJbik7XG4gICAgICAgIHRoaXMub3V0ID0gdGhpcy5jdHguY3JlYXRlQ2hhbm5lbE1lcmdlcih0aGlzLm5DaE91dCk7XG5cbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLm5DaE91dDsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLmluLmNvbm5lY3QodGhpcy5vdXQsIGksIGkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgdXBkYXRlT3JkZXIob3JkZXJPdXQpIHtcblxuICAgICAgICBpZiAob3JkZXJPdXQgPD0gdGhpcy5vcmRlckluKSB7XG4gICAgICAgICAgICB0aGlzLm9yZGVyT3V0ID0gb3JkZXJPdXQ7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSByZXR1cm47XG5cbiAgICAgICAgdGhpcy5uQ2hPdXQgPSAodGhpcy5vcmRlck91dCArIDEpICogKHRoaXMub3JkZXJPdXQgKyAxKTtcbiAgICAgICAgdGhpcy5vdXQuZGlzY29ubmVjdCgpO1xuICAgICAgICB0aGlzLm91dCA9IHRoaXMuY3R4LmNyZWF0ZUNoYW5uZWxNZXJnZXIodGhpcy5uQ2hPdXQpO1xuXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5uQ2hPdXQ7IGkrKykge1xuICAgICAgICAgICAgdGhpcy5pbi5jb25uZWN0KHRoaXMub3V0LCBpLCBpKTtcbiAgICAgICAgfVxuICAgIH1cbn1cbiIsIi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyAgQXJjaG9udGlzIFBvbGl0aXNcbi8vICBhcmNob250aXMucG9saXRpc0BhYWx0by5maVxuLy8gIERhdmlkIFBvaXJpZXItUXVpbm90XG4vLyAgZGF2aXBvaXJAaXJjYW0uZnJcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vL1xuLy8gIFdlYkF1ZGlvX0hPQSBhIEphdmFTY3JpcHQgbGlicmFyeSBmb3IgaGlnaGVyLW9yZGVyIEFtYmlzb25pY3Ncbi8vICBUaGUgbGlicmFyeSBpbXBsZW1lbnRzIFdlYiBBdWRpbyBibG9ja3MgdGhhdCBwZXJmb3JtXG4vLyAgdHlwaWNhbCBhbWJpc29uaWMgcHJvY2Vzc2luZyBvcGVyYXRpb25zIG9uIGF1ZGlvIHNpZ25hbHMuXG4vL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLy8vLy8vLy8vLy8vLy8vL1xuLyogSE9BIExPQURFUiAqL1xuLy8vLy8vLy8vLy8vLy8vL1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBIT0Fsb2FkZXIge1xuICAgIGNvbnN0cnVjdG9yKGNvbnRleHQsIG9yZGVyLCB1cmwsIGNhbGxiYWNrKSB7XG4gICAgICAgIHRoaXMuY29udGV4dCA9IGNvbnRleHQ7XG4gICAgICAgIHRoaXMub3JkZXIgPSBvcmRlcjtcbiAgICAgICAgdGhpcy5uQ2ggPSAob3JkZXIgKyAxKSAqIChvcmRlciArIDEpO1xuICAgICAgICB0aGlzLm5DaEdyb3VwcyA9IE1hdGguY2VpbCh0aGlzLm5DaCAvIDgpO1xuICAgICAgICB0aGlzLmJ1ZmZlcnMgPSBuZXcgQXJyYXkoKTtcbiAgICAgICAgdGhpcy5sb2FkQ291bnQgPSAwO1xuICAgICAgICB0aGlzLmxvYWRlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLm9uTG9hZCA9IGNhbGxiYWNrO1xuICAgICAgICB0aGlzLnVybHMgPSBuZXcgQXJyYXkodGhpcy5uQ2hHcm91cHMpO1xuXG4gICAgICAgIHZhciBmaWxlRXh0ID0gdXJsLnNsaWNlKHVybC5sZW5ndGggLSAzLCB1cmwubGVuZ3RoKTtcblxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubkNoR3JvdXBzOyBpKyspIHtcblxuICAgICAgICAgICAgaWYgKGkgPT0gdGhpcy5uQ2hHcm91cHMgLSAxKSB7XG4gICAgICAgICAgICAgICAgdGhpcy51cmxzW2ldID0gdXJsLnNsaWNlKDAsIHVybC5sZW5ndGggLSA0KSArIFwiX1wiICsgcGFkKGkgKiA4ICsgMSwgMikgKyBcIi1cIiArIHBhZCh0aGlzLm5DaCwgMikgKyBcImNoLlwiICsgZmlsZUV4dDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy51cmxzW2ldID0gdXJsLnNsaWNlKDAsIHVybC5sZW5ndGggLSA0KSArIFwiX1wiICsgcGFkKGkgKiA4ICsgMSwgMikgKyBcIi1cIiArIHBhZChpICogOCArIDgsIDIpICsgXCJjaC5cIiArIGZpbGVFeHQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBwYWQobnVtLCBzaXplKSB7XG4gICAgICAgICAgICByZXR1cm4gKCcwMDAwMDAwMDAnICsgbnVtKS5zdWJzdHIoLXNpemUpO1xuICAgICAgICB9XG5cbiAgICB9XG5cbiAgICBsb2FkQnVmZmVycyh1cmwsIGluZGV4KSB7XG4gICAgICAgIC8vIExvYWQgYnVmZmVyIGFzeW5jaHJvbm91c2x5XG4gICAgICAgIHZhciByZXF1ZXN0ID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG4gICAgICAgIHJlcXVlc3Qub3BlbihcIkdFVFwiLCB1cmwsIHRydWUpO1xuICAgICAgICByZXF1ZXN0LnJlc3BvbnNlVHlwZSA9IFwiYXJyYXlidWZmZXJcIjtcblxuICAgICAgICB2YXIgc2NvcGUgPSB0aGlzO1xuXG4gICAgICAgIHJlcXVlc3Qub25sb2FkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAvLyBBc3luY2hyb25vdXNseSBkZWNvZGUgdGhlIGF1ZGlvIGZpbGUgZGF0YSBpbiByZXF1ZXN0LnJlc3BvbnNlXG4gICAgICAgICAgICBzY29wZS5jb250ZXh0LmRlY29kZUF1ZGlvRGF0YShcbiAgICAgICAgICAgICAgICByZXF1ZXN0LnJlc3BvbnNlLFxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uKGJ1ZmZlcikge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWJ1ZmZlcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgYWxlcnQoJ2Vycm9yIGRlY29kaW5nIGZpbGUgZGF0YTogJyArIHVybCk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgc2NvcGUuYnVmZmVyc1tpbmRleF0gPSBidWZmZXI7XG4gICAgICAgICAgICAgICAgICAgIHNjb3BlLmxvYWRDb3VudCsrO1xuICAgICAgICAgICAgICAgICAgICBpZiAoc2NvcGUubG9hZENvdW50ID09IHNjb3BlLm5DaEdyb3Vwcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2NvcGUubG9hZGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNjb3BlLmNvbmNhdEJ1ZmZlcnMoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiSE9BbG9hZGVyOiBhbGwgYnVmZmVycyBsb2FkZWQgYW5kIGNvbmNhdGVuYXRlZFwiKVxuICAgICAgICAgICAgICAgICAgICAgICAgc2NvcGUub25Mb2FkKHNjb3BlLmNvbmNhdEJ1ZmZlcik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ2RlY29kZUF1ZGlvRGF0YSBlcnJvcicsIGVycm9yKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgcmVxdWVzdC5vbmVycm9yID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBhbGVydCgnSE9BbG9hZGVyOiBYSFIgZXJyb3InKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJlcXVlc3Quc2VuZCgpO1xuICAgIH1cblxuICAgIGxvYWQoKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5uQ2hHcm91cHM7ICsraSkgdGhpcy5sb2FkQnVmZmVycyh0aGlzLnVybHNbaV0sIGkpO1xuICAgIH1cblxuICAgIGNvbmNhdEJ1ZmZlcnMoKSB7XG5cbiAgICAgICAgaWYgKCF0aGlzLmxvYWRlZCkgcmV0dXJuO1xuXG4gICAgICAgIHZhciBuQ2ggPSB0aGlzLm5DaDtcbiAgICAgICAgdmFyIG5DaEdyb3VwcyA9IHRoaXMubkNoR3JvdXBzO1xuXG4gICAgICAgIHZhciBsZW5ndGggPSB0aGlzLmJ1ZmZlcnNbMF0ubGVuZ3RoO1xuICAgICAgICB2YXIgc3JhdGUgPSB0aGlzLmJ1ZmZlcnNbMF0uc2FtcGxlUmF0ZTtcblxuICAgICAgICB0aGlzLmNvbmNhdEJ1ZmZlciA9IHRoaXMuY29udGV4dC5jcmVhdGVCdWZmZXIobkNoLCBsZW5ndGgsIHNyYXRlKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBuQ2hHcm91cHM7IGkrKykge1xuICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCB0aGlzLmJ1ZmZlcnNbaV0ubnVtYmVyT2ZDaGFubmVsczsgaisrKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jb25jYXRCdWZmZXIuZ2V0Q2hhbm5lbERhdGEoaSAqIDggKyBqKS5zZXQodGhpcy5idWZmZXJzW2ldLmdldENoYW5uZWxEYXRhKGopKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cbiIsIi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyAgQXJjaG9udGlzIFBvbGl0aXNcbi8vICBhcmNob250aXMucG9saXRpc0BhYWx0by5maVxuLy8gIERhdmlkIFBvaXJpZXItUXVpbm90XG4vLyAgZGF2aXBvaXJAaXJjYW0uZnJcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vL1xuLy8gIFdlYkF1ZGlvX0hPQSBhIEphdmFTY3JpcHQgbGlicmFyeSBmb3IgaGlnaGVyLW9yZGVyIEFtYmlzb25pY3Ncbi8vICBUaGUgbGlicmFyeSBpbXBsZW1lbnRzIFdlYiBBdWRpbyBibG9ja3MgdGhhdCBwZXJmb3JtXG4vLyAgdHlwaWNhbCBhbWJpc29uaWMgcHJvY2Vzc2luZyBvcGVyYXRpb25zIG9uIGF1ZGlvIHNpZ25hbHMuXG4vL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLy8vLy8vLy8vLy8vLy8vLy9cbi8qIEhPQSBST1RBVE9SICovXG4vLy8vLy8vLy8vLy8vLy8vL1xuXG5pbXBvcnQgKiBhcyBqc2hsaWIgZnJvbSAnLi9qc2gtbGliJztcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgSE9BX3JvdGF0b3Ige1xuXG4gICAgY29uc3RydWN0b3IoYXVkaW9DdHgsIG9yZGVyKSB7XG5cbiAgICAgICAgdGhpcy5jdHggPSBhdWRpb0N0eDtcbiAgICAgICAgdGhpcy5vcmRlciA9IG9yZGVyO1xuICAgICAgICB0aGlzLm5DaCA9IChvcmRlciArIDEpICogKG9yZGVyICsgMSk7XG4gICAgICAgIHRoaXMueWF3ID0gMDtcbiAgICAgICAgdGhpcy5waXRjaCA9IDA7XG4gICAgICAgIHRoaXMucm9sbCA9IDA7XG4gICAgICAgIHRoaXMucm90TXR4ID0gbnVtZXJpYy5pZGVudGl0eSh0aGlzLm5DaCk7XG4gICAgICAgIHRoaXMucm90TXR4Tm9kZXMgPSBuZXcgQXJyYXkodGhpcy5vcmRlcik7XG4gICAgICAgIHRoaXMuaW4gPSBudWxsO1xuICAgICAgICB0aGlzLm91dCA9IG51bGw7XG5cbiAgICAgICAgdGhpcy5pbml0aWFsaXplZCA9IGZhbHNlO1xuICAgIH1cblxuICAgIHVwZGF0ZVJvdE10eCgpIHtcblxuICAgICAgICBpZiAoIXRoaXMuaW5pdGlhbGl6ZWQpIHJldHVybjtcblxuICAgICAgICB2YXIgeWF3ID0gdGhpcy55YXcgKiBNYXRoLlBJIC8gMTgwO1xuICAgICAgICB2YXIgcGl0Y2ggPSB0aGlzLnBpdGNoICogTWF0aC5QSSAvIDE4MDtcbiAgICAgICAgdmFyIHJvbGwgPSB0aGlzLnJvbGwgKiBNYXRoLlBJIC8gMTgwO1xuXG4gICAgICAgIHRoaXMucm90TXR4ID0ganNobGliLmdldFNIcm90TXR4KGpzaGxpYi55YXdQaXRjaFJvbGwyUnp5eCh5YXcsIHBpdGNoLCByb2xsKSwgdGhpcy5vcmRlcik7XG5cbiAgICAgICAgdmFyIGJhbmRfaWR4ID0gMTtcbiAgICAgICAgZm9yIChsZXQgbiA9IDE7IG4gPCB0aGlzLm9yZGVyICsgMTsgbisrKSB7XG5cbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgMiAqIG4gKyAxOyBpKyspIHtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IDIgKiBuICsgMTsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucm90TXR4Tm9kZXNbbiAtIDFdW2ldW2pdLmdhaW4udmFsdWUgPSB0aGlzLnJvdE10eFtiYW5kX2lkeCArIGldW2JhbmRfaWR4ICsgal07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYmFuZF9pZHggPSBiYW5kX2lkeCArIDIgKiBuICsgMTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGluaXQoKSB7XG4gICAgICAgIGlmICh0aGlzLmluaXRpYWxpemVkKSByZXR1cm47XG5cbiAgICAgICAgLy8gSW5wdXQgYW5kIG91dHB1dCBub2Rlc1xuICAgICAgICB0aGlzLmluID0gdGhpcy5jdHguY3JlYXRlQ2hhbm5lbFNwbGl0dGVyKHRoaXMubkNoKTtcbiAgICAgICAgdGhpcy5vdXQgPSB0aGlzLmN0eC5jcmVhdGVDaGFubmVsTWVyZ2VyKHRoaXMubkNoKTtcblxuICAgICAgICAvLyBJbml0aWFsaXplIHJvdGF0aW9uIGdhaW5zIHRvIGlkZW50aXR5IG1hdHJpeFxuICAgICAgICBmb3IgKHZhciBuID0gMTsgbiA8IHRoaXMub3JkZXIgKyAxOyBuKyspIHtcblxuICAgICAgICAgICAgdmFyIGdhaW5zX24gPSBuZXcgQXJyYXkoMiAqIG4gKyAxKTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgMiAqIG4gKyAxOyBpKyspIHtcbiAgICAgICAgICAgICAgICBnYWluc19uW2ldID0gbmV3IEFycmF5KDIgKiBuICsgMSk7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCAyICogbiArIDE7IGorKykge1xuICAgICAgICAgICAgICAgICAgICBnYWluc19uW2ldW2pdID0gdGhpcy5jdHguY3JlYXRlR2FpbigpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoaSA9PSBqKSBnYWluc19uW2ldW2pdLmdhaW4udmFsdWUgPSAxO1xuICAgICAgICAgICAgICAgICAgICBlbHNlIGdhaW5zX25baV1bal0uZ2Fpbi52YWx1ZSA9IDA7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5yb3RNdHhOb2Rlc1tuIC0gMV0gPSBnYWluc19uO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ3JlYXRlIGNvbm5lY3Rpb25zXG4gICAgICAgIHRoaXMuaW4uY29ubmVjdCh0aGlzLm91dCwgMCwgMCk7IC8vIHplcm90aCBvcmRlciBjaC4gZG9lcyBub3Qgcm90YXRlXG5cbiAgICAgICAgdmFyIGJhbmRfaWR4ID0gMTtcbiAgICAgICAgZm9yIChsZXQgbiA9IDE7IG4gPCB0aGlzLm9yZGVyICsgMTsgbisrKSB7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IDIgKiBuICsgMTsgaSsrKSB7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCAyICogbiArIDE7IGorKykge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmluLmNvbm5lY3QodGhpcy5yb3RNdHhOb2Rlc1tuIC0gMV1baV1bal0sIGJhbmRfaWR4ICsgaiwgMCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucm90TXR4Tm9kZXNbbiAtIDFdW2ldW2pdLmNvbm5lY3QodGhpcy5vdXQsIDAsIGJhbmRfaWR4ICsgaSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYmFuZF9pZHggPSBiYW5kX2lkeCArIDIgKiBuICsgMTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuaW5pdGlhbGl6ZWQgPSB0cnVlO1xuICAgIH1cbn1cbiIsIi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyAgQXJjaG9udGlzIFBvbGl0aXNcbi8vICBhcmNob250aXMucG9saXRpc0BhYWx0by5maVxuLy8gIERhdmlkIFBvaXJpZXItUXVpbm90XG4vLyAgZGF2aXBvaXJAaXJjYW0uZnJcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vL1xuLy8gIFdlYkF1ZGlvX0hPQSBhIEphdmFTY3JpcHQgbGlicmFyeSBmb3IgaGlnaGVyLW9yZGVyIEFtYmlzb25pY3Ncbi8vICBUaGUgbGlicmFyeSBpbXBsZW1lbnRzIFdlYiBBdWRpbyBibG9ja3MgdGhhdCBwZXJmb3JtXG4vLyAgdHlwaWNhbCBhbWJpc29uaWMgcHJvY2Vzc2luZyBvcGVyYXRpb25zIG9uIGF1ZGlvIHNpZ25hbHMuXG4vL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vKiBIT0EgVklSVFVBTCBNSUNST1BIT05FICovXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuaW1wb3J0ICogYXMganNobGliIGZyb20gJy4vanNoLWxpYic7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEhPQV92bWljIHtcblxuICAgIGNvbnN0cnVjdG9yKGF1ZGlvQ3R4LCBvcmRlcikge1xuXG4gICAgICAgIHRoaXMuaW5pdGlhbGl6ZWQgPSBmYWxzZTtcblxuICAgICAgICB0aGlzLmN0eCA9IGF1ZGlvQ3R4O1xuICAgICAgICB0aGlzLm9yZGVyID0gb3JkZXI7XG4gICAgICAgIHRoaXMubkNoID0gKG9yZGVyICsgMSkgKiAob3JkZXIgKyAxKTtcbiAgICAgICAgdGhpcy5hemkgPSAwO1xuICAgICAgICB0aGlzLmVsZXYgPSAwO1xuICAgICAgICB0aGlzLnZtaWNHYWlucyA9IG5ldyBBcnJheSh0aGlzLm5DaCk7XG4gICAgICAgIHRoaXMudm1pY0dhaW5Ob2RlcyA9IG5ldyBBcnJheSh0aGlzLm5DaCk7XG4gICAgICAgIHRoaXMudm1pY0NvZWZmcyA9IG5ldyBBcnJheSh0aGlzLm9yZGVyICsgMSk7XG4gICAgICAgIHRoaXMudm1pY1BhdHRlcm4gPSBcImh5cGVyY2FyZGlvaWRcIjtcbiAgICAgICAgdGhpcy5pbiA9IHRoaXMuY3R4LmNyZWF0ZUNoYW5uZWxTcGxpdHRlcih0aGlzLm5DaCk7XG4gICAgICAgIHRoaXMub3V0ID0gdGhpcy5jdHguY3JlYXRlR2FpbigpO1xuXG4gICAgICAgIC8vIEluaXRpYWxpemUgdm1pYyB0byBmb3J3YXJkIGZhY2luZyBoeXBlcmNhcmRpb2lkXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5uQ2g7IGkrKykge1xuICAgICAgICAgICAgdGhpcy52bWljR2Fpbk5vZGVzW2ldID0gdGhpcy5jdHguY3JlYXRlR2FpbigpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuU0h4eXogPSBuZXcgQXJyYXkodGhpcy5uQ2gpO1xuICAgICAgICB0aGlzLlNIeHl6LmZpbGwoMCk7XG4gICAgICAgIHRoaXMudXBkYXRlUGF0dGVybigpO1xuICAgICAgICB0aGlzLnVwZGF0ZU9yaWVudGF0aW9uKCk7XG5cbiAgICAgICAgLy8gQ3JlYXRlIGNvbm5lY3Rpb25zXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCB0aGlzLm5DaDsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLmluLmNvbm5lY3QodGhpcy52bWljR2Fpbk5vZGVzW2ldLCBpLCAwKTtcbiAgICAgICAgICAgIHRoaXMudm1pY0dhaW5Ob2Rlc1tpXS5jb25uZWN0KHRoaXMub3V0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuaW5pdGlhbGl6ZWQgPSB0cnVlO1xuICAgIH1cblxuXG4gICAgdXBkYXRlUGF0dGVybigpIHtcblxuICAgICAgICBmdW5jdGlvbiBjb21wdXRlQ2FyZGlvaWRDb2VmZnMoTikge1xuICAgICAgICAgICAgdmFyIGNvZWZmcyA9IG5ldyBBcnJheShOICsgMSk7XG4gICAgICAgICAgICBmb3IgKHZhciBuID0gMDsgbiA8IE4gKyAxOyBuKyspIHtcbiAgICAgICAgICAgICAgICBjb2VmZnNbbl0gPSBNYXRoLnNxcnQoMiAqIG4gKyAxKSAqIGpzaGxpYi5mYWN0b3JpYWwoTikgKiBqc2hsaWIuZmFjdG9yaWFsKE4gKyAxKSAvIChqc2hsaWIuZmFjdG9yaWFsKE4gKyBuICsgMSkgKiBqc2hsaWIuZmFjdG9yaWFsKE4gLSBuKSkgLyAoTiArIDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGNvZWZmcztcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGNvbXB1dGVIeXBlcmNhcmRDb2VmZnMoTikge1xuICAgICAgICAgICAgdmFyIGNvZWZmcyA9IG5ldyBBcnJheShOICsgMSk7XG4gICAgICAgICAgICBjb2VmZnMuZmlsbCgxKTtcbiAgICAgICAgICAgIHJldHVybiBjb2VmZnM7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBjb21wdXRlTWF4UkVDb2VmZnMoTikge1xuICAgICAgICAgICAgdmFyIGNvZWZmcyA9IG5ldyBBcnJheShOICsgMSk7XG4gICAgICAgICAgICBjb2VmZnNbMF0gPSAxO1xuICAgICAgICAgICAgdmFyIGxlZ19uX21pbnVzMSA9IDA7XG4gICAgICAgICAgICB2YXIgbGVnX25fbWludXMyID0gMDtcbiAgICAgICAgICAgIHZhciBsZWdfbiA9IDA7XG4gICAgICAgICAgICBmb3IgKHZhciBuID0gMTsgbiA8IE4gKyAxOyBuKyspIHtcbiAgICAgICAgICAgICAgICBsZWdfbiA9IGpzaGxpYi5yZWN1cnNlTGVnZW5kcmVQb2x5KG4sIFtNYXRoLmNvcygyLjQwNjgwOSAvIChOICsgMS41MSkpXSwgbGVnX25fbWludXMxLCBsZWdfbl9taW51czIpO1xuICAgICAgICAgICAgICAgIGNvZWZmc1tuXSA9IGxlZ19uWzBdWzBdO1xuXG4gICAgICAgICAgICAgICAgbGVnX25fbWludXMyID0gbGVnX25fbWludXMxO1xuICAgICAgICAgICAgICAgIGxlZ19uX21pbnVzMSA9IGxlZ19uO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGNvZWZmcztcbiAgICAgICAgfVxuXG4gICAgICAgIHN3aXRjaCAodGhpcy52bWljUGF0dGVybikge1xuICAgICAgICAgICAgY2FzZSBcImNhcmRpb2lkXCI6XG4gICAgICAgICAgICAgICAgLy8gaGlnaGVyLW9yZGVyIGNhcmRpb2lkIGdpdmVuIGJ5OiAoMS8yKV5OICogKCAxK2Nvcyh0aGV0YSkgKV5OXG4gICAgICAgICAgICAgICAgdGhpcy52bWljQ29lZmZzID0gY29tcHV0ZUNhcmRpb2lkQ29lZmZzKHRoaXMub3JkZXIpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcInN1cGVyY2FyZGlvaWRcIjpcbiAgICAgICAgICAgICAgICAvLyBtYXhpbXVtIGZyb250LWJhY2sgZW5lcmd5IHJhdGlvXG4gICAgICAgICAgICAgICAgLy8gVEJEXG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwiaHlwZXJjYXJkaW9pZFwiOlxuICAgICAgICAgICAgICAgIC8vIG1heGltdW0gZGlyZWN0aXZpdHkgZmFjdG9yXG4gICAgICAgICAgICAgICAgLy8gKHRoaXMgaXMgdGhlIGNsYXNzaWMgcGxhbmUvd2F2ZSBkZWNvbXBvc2l0aW9uIGJlYW1mb3JtZXIsXG4gICAgICAgICAgICAgICAgLy8gYWxzbyB0ZXJtZWQgXCJyZWd1bGFyXCIgaW4gc3BoZXJpY2FsIGJlYW1mb3JtaW5nIGxpdGVyYXR1cmUpXG4gICAgICAgICAgICAgICAgdGhpcy52bWljQ29lZmZzID0gY29tcHV0ZUh5cGVyY2FyZENvZWZmcyh0aGlzLm9yZGVyKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCJtYXhfckVcIjpcbiAgICAgICAgICAgICAgICAvLyBxdWl0ZSBzaW1pbGFyIHRvIG1heGltdW0gZnJvbnQtYmFjayByZWplY3Rpb25cbiAgICAgICAgICAgICAgICB0aGlzLnZtaWNDb2VmZnMgPSBjb21wdXRlTWF4UkVDb2VmZnModGhpcy5vcmRlcik7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIHRoaXMudm1pY1BhdHRlcm4gPSBcImh5cGVyY2FyZGlvaWRcIjtcbiAgICAgICAgICAgICAgICB0aGlzLnZtaWNDb2VmZnMgPSBjb21wdXRlSHlwZXJjYXJkQ29lZmZzKHRoaXMub3JkZXIpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy51cGRhdGVHYWlucygpO1xuICAgIH1cblxuICAgIHVwZGF0ZU9yaWVudGF0aW9uKCkge1xuXG4gICAgICAgIHZhciBhemkgPSB0aGlzLmF6aSAqIE1hdGguUEkgLyAxODA7XG4gICAgICAgIHZhciBlbGV2ID0gdGhpcy5lbGV2ICogTWF0aC5QSSAvIDE4MDtcblxuICAgICAgICB2YXIgdGVtcFNIID0ganNobGliLmNvbXB1dGVSZWFsU0godGhpcy5vcmRlciwgW1xuICAgICAgICAgICAgW2F6aSwgZWxldl1cbiAgICAgICAgXSk7XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCB0aGlzLm5DaDsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLlNIeHl6W2ldID0gdGVtcFNIW2ldWzBdO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy51cGRhdGVHYWlucygpO1xuICAgIH1cblxuICAgIHVwZGF0ZUdhaW5zKCkge1xuXG4gICAgICAgIHZhciBxO1xuICAgICAgICBmb3IgKHZhciBuID0gMDsgbiA8IHRoaXMub3JkZXIgKyAxOyBuKyspIHtcbiAgICAgICAgICAgIGZvciAodmFyIG0gPSAtdGhpcy5vcmRlcjsgbSA8IHRoaXMub3JkZXIgKyAxOyBtKyspIHtcbiAgICAgICAgICAgICAgICBxID0gbiAqIG4gKyBuICsgbTtcbiAgICAgICAgICAgICAgICB0aGlzLnZtaWNHYWluc1txXSA9ICgxIC8gTWF0aC5zcXJ0KDIgKiBuICsgMSkpICogdGhpcy52bWljQ29lZmZzW25dICogdGhpcy5TSHh5eltxXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgdGhpcy5uQ2g7IGkrKykge1xuICAgICAgICAgICAgdGhpcy52bWljR2Fpbk5vZGVzW2ldLmdhaW4udmFsdWUgPSB0aGlzLnZtaWNHYWluc1tpXTtcbiAgICAgICAgfVxuICAgIH1cbn1cbiIsImltcG9ydCAqIGFzIF9qc2hsaWIgZnJvbSAnLi9qc2gtbGliJztcbmV4cG9ydCBjb25zdCBqc2hsaWIgPSBfanNobGliO1xuXG4vLyBleHBvc2UgZm9yIHBsdWdpbnNcbmV4cG9ydCB7IGRlZmF1bHQgYXMgSE9BX2VuY29kZXIgfSBmcm9tICcuL2hvYS1lbmNvZGVyJztcbmV4cG9ydCB7IGRlZmF1bHQgYXMgSE9BX29yZGVyTGltaXRlciB9IGZyb20gJy4vaG9hLWxpbWl0ZXInO1xuZXhwb3J0IHsgZGVmYXVsdCBhcyBIT0Ffcm90YXRvciB9IGZyb20gJy4vaG9hLXJvdGF0b3InO1xuZXhwb3J0IHsgZGVmYXVsdCBhcyBIT0FfYmluRGVjb2Rlcn0gZnJvbSAnLi9ob2EtZGVjb2RlckJpbic7XG5leHBvcnQgeyBkZWZhdWx0IGFzIEhPQV92bWljIH0gZnJvbSAnLi9ob2EtdmlydHVhbE1pYyc7XG5leHBvcnQgeyBkZWZhdWx0IGFzIEhPQV9hbmFseXNlciB9IGZyb20gJy4vaG9hLWFuYWx5c2VyJztcblxuZXhwb3J0IHsgZGVmYXVsdCBhcyBIT0Fsb2FkZXIgfSBmcm9tICcuL2hvYS1sb2FkZXInO1xuXG5pbXBvcnQgKiBhcyBfaG9hX2NvbnZlcnRlcnMgZnJvbSAnLi9ob2EtY29udmVydGVycyc7XG5leHBvcnQgY29uc3QgaG9hX2NvbnZlcnRlcnMgPSBfaG9hX2NvbnZlcnRlcnM7XG5cbmV4cG9ydCB7IGRlZmF1bHQgYXMgQmZvcm1hdF9lbmNvZGVyIH0gZnJvbSAnLi9mb2EtZW5jb2Rlcic7XG5leHBvcnQgeyBkZWZhdWx0IGFzIEJmb3JtYXRfcm90YXRvciB9IGZyb20gJy4vZm9hLXJvdGF0b3InO1xuZXhwb3J0IHsgZGVmYXVsdCBhcyBCZm9ybWF0X3ZtaWMgfSBmcm9tICcuL2ZvYS12aXJ0dWFsTWljJztcbmV4cG9ydCB7IGRlZmF1bHQgYXMgQmZvcm1hdF9iaW5EZWNvZGVyfSBmcm9tICcuL2ZvYS1kZWNvZGVyQmluJztcbmV4cG9ydCB7IGRlZmF1bHQgYXMgQmZvcm1hdF9hbmFseXNlcn0gZnJvbSAnLi9mb2EtYW5hbHlzZXInO1xuIiwiLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vICBBcmNob250aXMgUG9saXRpc1xuLy8gIGFyY2hvbnRpcy5wb2xpdGlzQGFhbHRvLmZpXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy9cbi8vICBKU0hsaWIgYSBKYXZhU2NyaXB0IGxpYnJhcnkgdGhhdCBpbXBsZW1lbnRzXG4vLyAgdGhlIHNwaGVyaWNhbCBoYXJtb25pYyB0cmFuc2Zvcm0gZm9yIHJlYWwgc3BoZXJpY2FsIGhhcm1vbmljc1xuLy8gIGFuZCBzb21lIHVzZWZ1bCB0cmFuc2Zvcm1hdGlvbnMgaW4gdGhlIHNwaGVyaWNhbCBoYXJtb25pYyBkb21haW5cbi8vXG4vLyAgVGhlIGxpYnJhcnkgdXNlcyB0aGUgbnVtZXJpYy5qcyBsaWJyYXJ5IGZvciBtYXRyaXggb3BlcmF0aW9uc1xuLy8gIGh0dHA6Ly93d3cubnVtZXJpY2pzLmNvbS9cbi8vXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG5pbXBvcnQgKiBhcyBudW1lcmljIGZyb20gJy4vbnVtZXJpYy0xLjIuNi5taW4nXG5cbi8vIGZvcndhcmRTSFQgaW1wbGVtZW50cyB0aGUgZm9yd2FyZCBTSFQgb24gZGF0YSBkZWZpbmVkIG92ZXIgdGhlIHNwaGVyZVxuZXhwb3J0IGZ1bmN0aW9uIGZvcndhcmRTSFQoTiwgZGF0YSwgQ0FSVF9PUl9TUEgsIERJUkVDVF9PUl9QSU5WKSB7XG5cbiAgICB2YXIgTmRpcnMgPSBkYXRhLmxlbmd0aCwgTnNoID0gKE4rMSkqKE4rMSk7XG4gICAgdmFyIGludllfTjtcbiAgICB2YXIgbWFnID0gWyxdO1xuICAgIGlmIChOc2g+TmRpcnMpICB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiVGhlIFNIVCBkZWdyZWUgaXMgdG9vIGhpZ2ggZm9yIHRoZSBudW1iZXIgb2YgZGF0YSBwb2ludHNcIilcbiAgICB9XG5cbiAgICAvLyBDb252ZXJ0IGNhcnRlc2lhbiB0byBzcGhlcmljYWwgaWYgbmVlZGVkXG4gICAgaWYgKENBUlRfT1JfU1BIPT0wKSBkYXRhID0gY29udmVydENhcnQyU3BoKGRhdGEpO1xuICAgIGZvciAodmFyICBpPTA7IGk8ZGF0YS5sZW5ndGg7IGkrKykge1xuICAgICAgICBtYWdbaV0gPSBkYXRhW2ldWzBdO1xuICAgIH1cbiAgICAvLyBTSCBzYW1wbGluZyBtYXRyaXhcbiAgICBZX04gPSBjb21wdXRlUmVhbFNIKE4sIGRhdGEpO1xuICAgIC8vIERpcmVjdCBTSFRcbiAgICBpZiAoRElSRUNUX09SX1BJTlY9PTApIHtcbiAgICAgICAgaW52WV9OID0gbnVtZXJpYy5tdWwoMS9OZGlycyxZX04pO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgaW52WV9OID0gcGludl9kaXJlY3QobnVtZXJpYy50cmFuc3Bvc2UoWV9OKSk7XG4gICAgfVxuICAgIC8vIFBlcmZvcm0gU0hUXG4gICAgdmFyIGNvZWZmcyA9IG51bWVyaWMuZG90TVYoaW52WV9OLCBtYWcpO1xuICAgIHJldHVybiBjb2VmZnM7XG59XG5cbi8vIGludmVyc2VTSFQgaW1wbGVtZW50cyB0aGUgaW52ZXJzZSBTSFQgZnJvbSBTSCBjb2VmZmljaWVudHNcbmV4cG9ydCBmdW5jdGlvbiBpbnZlcnNlU0hUKGNvZWZmcywgYXppRWxldikge1xuXG4gICAgdmFyIGF6aUVsZXZSID0gYXppRWxldjtcbiAgICB2YXIgTiA9IE1hdGguc3FydChjb2VmZnMubGVuZ3RoKS0xO1xuICAgIC8vIFNIIHNhbXBsaW5nIG1hdHJpeFxuICAgIHZhciBZX04gPSBjb21wdXRlUmVhbFNIKE4sIGF6aUVsZXYpO1xuICAgIC8vIHJlY29uc3RydWN0aW9uXG4gICAgdmFyIGRhdGEgPSBudW1lcmljLmRvdFZNKGNvZWZmcywgWV9OKTtcbiAgICAvLyBnYXRoZXIgaW4gZGF0YSBtYXRyaXhcbiAgICBmb3IgKHZhciBpPTA7IGk8YXppRWxldi5sZW5ndGg7IGkrKykge1xuICAgICAgICBhemlFbGV2UltpXVsyXSA9IGRhdGFbaV07XG4gICAgfVxuICAgIHJldHVybiBhemlFbGV2Ujtcbn1cblxuLy8geHh4eHh4eHh4eHh4eHh4eHh4XG5leHBvcnQgZnVuY3Rpb24gcHJpbnQyRGFycmF5KGFycmF5MkQpIHtcbiAgICBmb3IgKHZhciBxPTA7IHE8YXJyYXkyRC5sZW5ndGg7IHErKykgY29uc29sZS5sb2coYXJyYXkyRFtxXSk7XG59XG5cbi8vIGNvbnZlcnRDYXJ0MlNwaCBjb252ZXJ0cyBhcnJheXMgb2YgY2FydGVzaWFuIHZlY3RvcnMgdG8gc3BoZXJpY2FsIGNvb3JkaW5hdGVzXG5leHBvcnQgZnVuY3Rpb24gY29udmVydENhcnQyU3BoKHh5eiwgT01JVF9NQUcpIHtcblxuICAgIHZhciBhemksIGVsZXYsIHI7XG4gICAgdmFyIGF6aUVsZXZSID0gbmV3IEFycmF5KHh5ei5sZW5ndGgpO1xuXG4gICAgZm9yICh2YXIgaT0wOyBpPHh5ei5sZW5ndGg7IGkrKykge1xuICAgICAgICBhemkgPSBNYXRoLmF0YW4yKCB4eXpbaV1bMV0sIHh5eltpXVswXSApO1xuICAgICAgICBlbGV2ID0gTWF0aC5hdGFuMiggeHl6W2ldWzJdLCBNYXRoLnNxcnQoeHl6W2ldWzBdKnh5eltpXVswXSArIHh5eltpXVsxXSp4eXpbaV1bMV0pICk7XG4gICAgICAgIGlmIChPTUlUX01BRz09MSkge1xuICAgICAgICAgICAgYXppRWxldlJbaV0gPSBbYXppLGVsZXZdO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgciA9IE1hdGguc3FydCh4eXpbaV1bMF0qeHl6W2ldWzBdICsgeHl6W2ldWzFdKnh5eltpXVsxXSArIHh5eltpXVsyXSp4eXpbaV1bMl0pO1xuICAgICAgICAgICAgYXppRWxldlJbaV0gPSBbYXppLGVsZXYscl07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGF6aUVsZXZSO1xufVxuXG4vLyBjb252ZXJ0U3BoMkNhcnQgY29udmVydHMgYXJyYXlzIG9mIHNwaGVyaWNhbCBjb29yZGluYXRlcyB0byBjYXJ0ZXNpYW5cbmV4cG9ydCBmdW5jdGlvbiBjb252ZXJ0U3BoMkNhcnQoYXppRWxldlIpIHtcblxuICAgIHZhciB4LHksejtcbiAgICB2YXIgeHl6ID0gbmV3IEFycmF5KGF6aUVsZXZSLmxlbmd0aCk7XG5cbiAgICBmb3IgKHZhciBpPTA7IGk8YXppRWxldlIubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgeCA9IE1hdGguY29zKGF6aUVsZXZSW2ldWzBdKSpNYXRoLmNvcyhhemlFbGV2UltpXVsxXSk7XG4gICAgICAgIHkgPSBNYXRoLnNpbihhemlFbGV2UltpXVswXSkqTWF0aC5jb3MoYXppRWxldlJbaV1bMV0pO1xuICAgICAgICB6ID0gTWF0aC5zaW4oYXppRWxldlJbaV1bMV0pO1xuICAgICAgICBpZiAoYXppRWxldlJbMF0ubGVuZ3RoPT0yKSB4eXpbaV0gPSBbeCx5LHpdO1xuICAgICAgICBlbHNlIGlmIChhemlFbGV2UlswXS5sZW5ndGg9PTMpIHh5eltpXSA9IFthemlFbGV2UltpXVsyXSp4LGF6aUVsZXZSW2ldWzJdKnksYXppRWxldlJbaV1bMl0qel07XG4gICAgfVxuICAgIHJldHVybiB4eXo7XG59XG5cbi8vIGNvbXB1dGVSZWFsU0ggY29tcHV0ZXMgcmVhbCBzcGhlcmljYWwgaGFybW9uaWNzIHVwIHRvIG9yZGVyIE5cbmV4cG9ydCBmdW5jdGlvbiBjb21wdXRlUmVhbFNIKE4sIGRhdGEpIHtcblxuICAgIHZhciBhemkgPSBuZXcgQXJyYXkoZGF0YS5sZW5ndGgpO1xuICAgIHZhciBlbGV2ID0gbmV3IEFycmF5KGRhdGEubGVuZ3RoKTtcblxuICAgIGZvciAodmFyIGk9MDsgaTxkYXRhLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGF6aVtpXSA9IGRhdGFbaV1bMF07XG4gICAgICAgIGVsZXZbaV0gPSBkYXRhW2ldWzFdO1xuICAgIH1cblxuICAgIHZhciBmYWN0b3JpYWxzID0gbmV3IEFycmF5KDIqTisxKTtcbiAgICB2YXIgTmRpcnMgPSBhemkubGVuZ3RoO1xuICAgIHZhciBOc2ggPSAoTisxKSooTisxKTtcbiAgICB2YXIgbGVnX25fbWludXMxID0gMDtcbiAgICB2YXIgbGVnX25fbWludXMyID0gMDtcbiAgICB2YXIgbGVnX247XG4gICAgdmFyIHNpbmVsID0gbnVtZXJpYy5zaW4oZWxldik7XG4gICAgdmFyIGluZGV4X24gPSAwO1xuICAgIHZhciBZX04gPSBuZXcgQXJyYXkoTnNoKTtcbiAgICB2YXIgTm4wLCBObm07XG4gICAgdmFyIGNvc21hemksIHNpbm1hemk7XG5cbiAgICAvLyBwcmVjb21wdXRlIGZhY3RvcmlhbHNcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IDIqTisxOyBpKyspIGZhY3RvcmlhbHNbaV0gPSBmYWN0b3JpYWwoaSk7XG5cbiAgICBmb3IgKHZhciBuID0gMDsgbjxOKzE7IG4rKykge1xuICAgICAgICBpZiAobj09MCkge1xuICAgICAgICAgICAgdmFyIHRlbXAwID0gbmV3IEFycmF5KGF6aS5sZW5ndGgpO1xuICAgICAgICAgICAgdGVtcDAuZmlsbCgxKTtcbiAgICAgICAgICAgIFlfTltuXSA9IHRlbXAwO1xuICAgICAgICAgICAgaW5kZXhfbiA9IDE7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBsZWdfbiA9IHJlY3Vyc2VMZWdlbmRyZVBvbHkobiwgc2luZWwsIGxlZ19uX21pbnVzMSwgbGVnX25fbWludXMyKTtcbiAgICAgICAgICAgIE5uMCA9IE1hdGguc3FydCgyKm4rMSk7XG4gICAgICAgICAgICBmb3IgKHZhciBtID0gMDsgbTxuKzE7IG0rKykge1xuICAgICAgICAgICAgICAgIGlmIChtPT0wKSBZX05baW5kZXhfbituXSA9IG51bWVyaWMubXVsKE5uMCxsZWdfblttXSk7XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIE5ubSA9IE5uMCpNYXRoLnNxcnQoIDIgKiBmYWN0b3JpYWxzW24tbV0vZmFjdG9yaWFsc1tuK21dICk7XG4gICAgICAgICAgICAgICAgICAgIGNvc21hemkgPSBudW1lcmljLmNvcyhudW1lcmljLm11bChtLGF6aSkpO1xuICAgICAgICAgICAgICAgICAgICBzaW5tYXppID0gbnVtZXJpYy5zaW4obnVtZXJpYy5tdWwobSxhemkpKTtcbiAgICAgICAgICAgICAgICAgICAgWV9OW2luZGV4X24rbi1tXSA9IG51bWVyaWMubXVsKE5ubSwgbnVtZXJpYy5tdWwobGVnX25bbV0sIHNpbm1hemkpKTtcbiAgICAgICAgICAgICAgICAgICAgWV9OW2luZGV4X24rbittXSA9IG51bWVyaWMubXVsKE5ubSwgbnVtZXJpYy5tdWwobGVnX25bbV0sIGNvc21hemkpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpbmRleF9uID0gaW5kZXhfbisyKm4rMTtcbiAgICAgICAgfVxuICAgICAgICBsZWdfbl9taW51czIgPSBsZWdfbl9taW51czE7XG4gICAgICAgIGxlZ19uX21pbnVzMSA9IGxlZ19uO1xuICAgIH1cblxuICAgIHJldHVybiBZX047XG59XG5cbi8vIGZhY3RvcmlhbCBjb21wdXRlIGZhY3RvcmlhbFxuZXhwb3J0IGZ1bmN0aW9uIGZhY3RvcmlhbChuKSB7XG4gICAgaWYgKG4gPT09IDApIHJldHVybiAxO1xuICAgIHJldHVybiBuICogZmFjdG9yaWFsKG4gLSAxKTtcbn1cblxuLy8gcmVjdXJzZUxlZ2VuZHJlUG9seSBjb21wdXRlcyBhc3NvY2lhdGVkIExlZ2VuZHJlIGZ1bmN0aW9ucyByZWN1cnNpdmVseVxuZXhwb3J0IGZ1bmN0aW9uIHJlY3Vyc2VMZWdlbmRyZVBvbHkobiwgeCwgUG5tX21pbnVzMSwgUG5tX21pbnVzMikge1xuXG4gICAgdmFyIFBubSA9IG5ldyBBcnJheShuKzEpO1xuICAgIHN3aXRjaChuKSB7XG4gICAgICAgIGNhc2UgMTpcbiAgICAgICAgICAgIHZhciB4MiA9IG51bWVyaWMubXVsKHgseCk7XG4gICAgICAgICAgICB2YXIgUDEwID0geDtcbiAgICAgICAgICAgIHZhciBQMTEgPSBudW1lcmljLnNxcnQobnVtZXJpYy5zdWIoMSx4MikpO1xuICAgICAgICAgICAgUG5tWzBdID0gUDEwO1xuICAgICAgICAgICAgUG5tWzFdID0gUDExO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgMjpcbiAgICAgICAgICAgIHZhciB4MiA9IG51bWVyaWMubXVsKHgseCk7XG4gICAgICAgICAgICB2YXIgUDIwID0gbnVtZXJpYy5tdWwoMyx4Mik7XG4gICAgICAgICAgICBQMjAgPSBudW1lcmljLnN1YihQMjAsMSk7XG4gICAgICAgICAgICBQMjAgPSBudW1lcmljLmRpdihQMjAsMik7XG4gICAgICAgICAgICB2YXIgUDIxID0gbnVtZXJpYy5zdWIoMSx4Mik7XG4gICAgICAgICAgICBQMjEgPSBudW1lcmljLnNxcnQoUDIxKTtcbiAgICAgICAgICAgIFAyMSA9IG51bWVyaWMubXVsKDMsUDIxKTtcbiAgICAgICAgICAgIFAyMSA9IG51bWVyaWMubXVsKFAyMSx4KTtcbiAgICAgICAgICAgIHZhciBQMjIgPSBudW1lcmljLnN1YigxLHgyKTtcbiAgICAgICAgICAgIFAyMiA9IG51bWVyaWMubXVsKDMsUDIyKTtcbiAgICAgICAgICAgIFBubVswXSA9IFAyMDtcbiAgICAgICAgICAgIFBubVsxXSA9IFAyMTtcbiAgICAgICAgICAgIFBubVsyXSA9IFAyMjtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgdmFyIHgyID0gbnVtZXJpYy5tdWwoeCx4KTtcbiAgICAgICAgICAgIHZhciBvbmVfbWluX3gyID0gbnVtZXJpYy5zdWIoMSx4Mik7XG4gICAgICAgICAgICAvLyBsYXN0IHRlcm0gbT1uXG4gICAgICAgICAgICB2YXIgayA9IDIqbi0xO1xuICAgICAgICAgICAgdmFyIGRmYWN0X2sgPSAxO1xuICAgICAgICAgICAgaWYgKChrICUgMikgPT0gMCkge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGtrPTE7IGtrPGsvMisxOyBraysrKSBkZmFjdF9rID0gZGZhY3RfayoyKmtrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIga2s9MTsga2s8KGsrMSkvMisxOyBraysrKSBkZmFjdF9rID0gZGZhY3RfayooMipray0xKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFBubVtuXSA9IG51bWVyaWMubXVsKGRmYWN0X2ssIG51bWVyaWMucG93KG9uZV9taW5feDIsIG4vMikpO1xuICAgICAgICAgICAgLy8gYmVmb3JlIGxhc3QgdGVybVxuICAgICAgICAgICAgUG5tW24tMV0gPSBudW1lcmljLm11bCgyKm4tMSwgbnVtZXJpYy5tdWwoeCwgUG5tX21pbnVzMVtuLTFdKSk7IC8vIFBfe24obi0xKX0gPSAoMipuLTEpKngqUF97KG4tMSkobi0xKX1cbiAgICAgICAgICAgIC8vIHRocmVlIHRlcm0gcmVjdXJzZW5jZSBmb3IgdGhlIHJlc3RcbiAgICAgICAgICAgIGZvciAodmFyIG09MDsgbTxuLTE7IG0rKykge1xuICAgICAgICAgICAgICAgIHZhciB0ZW1wMSA9IG51bWVyaWMubXVsKCAyKm4tMSwgbnVtZXJpYy5tdWwoeCwgUG5tX21pbnVzMVttXSkgKTtcbiAgICAgICAgICAgICAgICB2YXIgdGVtcDIgPSBudW1lcmljLm11bCggbittLTEsIFBubV9taW51czJbbV0gKTtcbiAgICAgICAgICAgICAgICBQbm1bbV0gPSBudW1lcmljLmRpdiggbnVtZXJpYy5zdWIodGVtcDEsIHRlbXAyKSwgbi1tKTsgLy8gUF9sID0gKCAoMmwtMSl4UF8obC0xKSAtIChsK20tMSlQXyhsLTIpICkvKGwtbSlcbiAgICAgICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIFBubTtcbn1cblxuLy8gcGludl9zdmQgY29tcHV0ZXMgdGhlIHBzZXVkby1pbnZlcnNlIHVzaW5nIFNWRFxuZXhwb3J0IGZ1bmN0aW9uIHBpbnZfc3ZkKEEpIHtcbiAgICB2YXIgeiA9IG51bWVyaWMuc3ZkKEEpLCBmb28gPSB6LlNbMF07XG4gICAgdmFyIFUgPSB6LlUsIFMgPSB6LlMsIFYgPSB6LlY7XG4gICAgdmFyIG0gPSBBLmxlbmd0aCwgbiA9IEFbMF0ubGVuZ3RoLCB0b2wgPSBNYXRoLm1heChtLG4pKm51bWVyaWMuZXBzaWxvbipmb28sTSA9IFMubGVuZ3RoO1xuICAgIHZhciBTaW52ID0gbmV3IEFycmF5KE0pO1xuICAgIGZvcih2YXIgaT1NLTE7aSE9PS0xO2ktLSkgeyBpZihTW2ldPnRvbCkgU2ludltpXSA9IDEvU1tpXTsgZWxzZSBTaW52W2ldID0gMDsgfVxuICAgIHJldHVybiBudW1lcmljLmRvdChudW1lcmljLmRvdChWLG51bWVyaWMuZGlhZyhTaW52KSksbnVtZXJpYy50cmFuc3Bvc2UoVSkpXG59XG5cbi8vIHBpbnZfc3ZkIGNvbXB1dGVzIHRoZSBsZWZ0IHBzZXVkby1pbnZlcnNlXG5leHBvcnQgZnVuY3Rpb24gcGludl9kaXJlY3QoQSkge1xuICAgIHZhciBBVCA9IG51bWVyaWMudHJhbnNwb3NlKEEpO1xuICAgIHJldHVybiBudW1lcmljLmRvdChudW1lcmljLmludihudW1lcmljLmRvdChBVCxBKSksQVQpO1xufVxuXG4vLyBjb21wdXRlcyByb3RhdGlvbiBtYXRyaWNlcyBmb3IgcmVhbCBzcGhlcmljYWwgaGFybW9uaWNzXG5leHBvcnQgZnVuY3Rpb24gZ2V0U0hyb3RNdHgoUnh5eiwgTCkge1xuXG4gICAgdmFyIE5zaCA9IChMKzEpKihMKzEpO1xuICAgIC8vIGFsbG9jYXRlIHRvdGFsIHJvdGF0aW9uIG1hdHJpeFxuICAgIHZhciBSID0gbnVtZXJpYy5yZXAoW05zaCxOc2hdLDApO1xuXG4gICAgLy8gaW5pdGlhbGl6ZSB6ZXJvdGggYW5kIGZpcnN0IGJhbmQgcm90YXRpb24gbWF0cmljZXMgZm9yIHJlY3Vyc2lvblxuICAgIC8vIFJ4eXogPSBbUnh4IFJ4eSBSeHpcbiAgICAvLyAgICAgICAgIFJ5eCBSeXkgUnl6XG4gICAgLy8gICAgICAgICBSenggUnp5IFJ6el1cbiAgICAvL1xuICAgIC8vIHplcm90aC1iYW5kIChsPTApIGlzIGludmFyaWFudCB0byByb3RhdGlvblxuICAgIFJbMF1bMF0gPSAxO1xuXG4gICAgLy8gdGhlIGZpcnN0IGJhbmQgKGw9MSkgaXMgZGlyZWN0bHkgcmVsYXRlZCB0byB0aGUgcm90YXRpb24gbWF0cml4XG4gICAgdmFyIFJfMSA9IG51bWVyaWMucmVwKFszLDNdLDApO1xuICAgIFJfMVswXVswXSA9IFJ4eXpbMV1bMV07XG4gICAgUl8xWzBdWzFdID0gUnh5elsxXVsyXTtcbiAgICBSXzFbMF1bMl0gPSBSeHl6WzFdWzBdO1xuICAgIFJfMVsxXVswXSA9IFJ4eXpbMl1bMV07XG4gICAgUl8xWzFdWzFdID0gUnh5elsyXVsyXTtcbiAgICBSXzFbMV1bMl0gPSBSeHl6WzJdWzBdO1xuICAgIFJfMVsyXVswXSA9IFJ4eXpbMF1bMV07XG4gICAgUl8xWzJdWzFdID0gUnh5elswXVsyXTtcbiAgICBSXzFbMl1bMl0gPSBSeHl6WzBdWzBdO1xuXG4gICAgUiA9IG51bWVyaWMuc2V0QmxvY2soUiwgWzEsMV0sIFszLDNdLCBSXzEpO1xuICAgIHZhciBSX2xtMSA9IFJfMTtcblxuICAgIC8vIGNvbXB1dGUgcm90YXRpb24gbWF0cml4IG9mIGVhY2ggc3Vic2VxdWVudCBiYW5kIHJlY3Vyc2l2ZWx5XG4gICAgdmFyIGJhbmRfaWR4ID0gMztcbiAgICBmb3IgKHZhciBsPTI7IGw8TCsxOyBsKyspIHtcblxuICAgICAgICB2YXIgUl9sID0gbnVtZXJpYy5yZXAoWygyKmwrMSksKDIqbCsxKV0sMCk7XG4gICAgICAgIGZvciAodmFyIG09LWw7IG08bCsxOyBtKyspIHtcbiAgICAgICAgICAgIGZvciAodmFyIG49LWw7IG48bCsxOyBuKyspIHtcbiAgICAgICAgICAgICAgICAvLyBjb21wdXRlIHUsdix3IHRlcm1zIG9mIEVxLjguMSAoVGFibGUgSSlcbiAgICAgICAgICAgICAgICB2YXIgZCwgZGVub20sIHUsIHYsIHc7XG4gICAgICAgICAgICAgICAgaWYgKG09PTApIGQgPSAxO1xuICAgICAgICAgICAgICAgIGVsc2UgZCA9IDA7IC8vIHRoZSBkZWx0YSBmdW5jdGlvbiBkX20wXG4gICAgICAgICAgICAgICAgaWYgKE1hdGguYWJzKG4pPT1sKSBkZW5vbSA9ICgyKmwpKigyKmwtMSk7XG4gICAgICAgICAgICAgICAgZWxzZSBkZW5vbSA9IChsKmwtbipuKTtcblxuICAgICAgICAgICAgICAgIHUgPSBNYXRoLnNxcnQoKGwqbC1tKm0pL2Rlbm9tKTtcbiAgICAgICAgICAgICAgICB2ID0gTWF0aC5zcXJ0KCgxK2QpKihsK01hdGguYWJzKG0pLTEpKihsK01hdGguYWJzKG0pKS9kZW5vbSkqKDEtMipkKSowLjU7XG4gICAgICAgICAgICAgICAgdyA9IE1hdGguc3FydCgobC1NYXRoLmFicyhtKS0xKSoobC1NYXRoLmFicyhtKSkvZGVub20pKigxLWQpKigtMC41KTtcblxuICAgICAgICAgICAgICAgIC8vIGNvbXB1dGVzIEVxLjguMVxuICAgICAgICAgICAgICAgIGlmICh1IT0wKSB1ID0gdSpVKGwsbSxuLFJfMSxSX2xtMSk7XG4gICAgICAgICAgICAgICAgaWYgKHYhPTApIHYgPSB2KlYobCxtLG4sUl8xLFJfbG0xKTtcbiAgICAgICAgICAgICAgICBpZiAodyE9MCkgdyA9IHcqVyhsLG0sbixSXzEsUl9sbTEpO1xuICAgICAgICAgICAgICAgIFJfbFttK2xdW24rbF0gPSB1ICsgdiArIHc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgUiA9IG51bWVyaWMuc2V0QmxvY2soUiwgW2JhbmRfaWR4KzEsYmFuZF9pZHgrMV0sIFtiYW5kX2lkeCsyKmwrMSxiYW5kX2lkeCsyKmwrMV0sIFJfbCk7XG4gICAgICAgIFJfbG0xID0gUl9sO1xuICAgICAgICBiYW5kX2lkeCA9IGJhbmRfaWR4ICsgMipsKzE7XG4gICAgfVxuICAgIHJldHVybiBSO1xufVxuXG4vLyBmdW5jdGlvbnMgdG8gY29tcHV0ZSB0ZXJtcyBVLCBWLCBXIG9mIEVxLjguMSAoVGFibGUgSUkpXG5leHBvcnQgZnVuY3Rpb24gVShsLG0sbixSXzEsUl9sbTEpIHtcblxuICAgIHJldHVybiBQKDAsbCxtLG4sUl8xLFJfbG0xKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIFYobCxtLG4sUl8xLFJfbG0xKSB7XG5cbiAgICB2YXIgcDAsIHAxLCByZXQsIGQ7XG4gICAgaWYgKG09PTApIHtcbiAgICAgICAgcDAgPSBQKDEsbCwxLG4sUl8xLFJfbG0xKTtcbiAgICAgICAgcDEgPSBQKC0xLGwsLTEsbixSXzEsUl9sbTEpO1xuICAgICAgICByZXQgPSBwMCtwMTtcbiAgICB9XG4gICAgZWxzZSBpZiAobT4wKSB7XG4gICAgICAgIGlmIChtPT0xKSBkID0gMTtcbiAgICAgICAgZWxzZSBkID0gMDtcbiAgICAgICAgcDAgPSBQKDEsbCxtLTEsbixSXzEsUl9sbTEpO1xuICAgICAgICBwMSA9IFAoLTEsbCwtbSsxLG4sUl8xLFJfbG0xKTtcbiAgICAgICAgcmV0ID0gcDAqTWF0aC5zcXJ0KDErZCkgLSBwMSooMS1kKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGlmIChtPT0tMSkgZCA9IDE7XG4gICAgICAgIGVsc2UgZCA9IDA7XG4gICAgICAgIHAwID0gUCgxLGwsbSsxLG4sUl8xLFJfbG0xKTtcbiAgICAgICAgcDEgPSBQKC0xLGwsLW0tMSxuLFJfMSxSX2xtMSk7XG4gICAgICAgIHJldCA9IHAwKigxLWQpICsgcDEqTWF0aC5zcXJ0KDErZCk7XG4gICAgfVxuICAgIHJldHVybiByZXQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBXKGwsbSxuLFJfMSxSX2xtMSkge1xuXG4gICAgdmFyIHAwLCBwMSwgcmV0O1xuICAgIGlmIChtPT0wKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJzaG91bGQgbm90IGJlIGNhbGxlZFwiKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGlmIChtPjApIHtcbiAgICAgICAgICAgIHAwID0gUCgxLGwsbSsxLG4sUl8xLFJfbG0xKTtcbiAgICAgICAgICAgIHAxID0gUCgtMSxsLC1tLTEsbixSXzEsUl9sbTEpO1xuICAgICAgICAgICAgcmV0ID0gcDAgKyBwMTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHAwID0gUCgxLGwsbS0xLG4sUl8xLFJfbG0xKTtcbiAgICAgICAgICAgIHAxID0gUCgtMSxsLC1tKzEsbixSXzEsUl9sbTEpO1xuICAgICAgICAgICAgcmV0ID0gcDAgLSBwMTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmV0O1xufVxuXG4vLyBmdW5jdGlvbiB0byBjb21wdXRlIHRlcm0gUCBvZiBVLFYsVyAoVGFibGUgSUkpXG5leHBvcnQgZnVuY3Rpb24gUChpLGwsYSxiLFJfMSxSX2xtMSkge1xuXG4gICAgdmFyIHJpMSwgcmltMSwgcmkwLCByZXQ7XG4gICAgcmkxID0gUl8xW2krMV1bMSsxXTtcbiAgICByaW0xID0gUl8xW2krMV1bLTErMV07XG4gICAgcmkwID0gUl8xW2krMV1bMCsxXTtcblxuICAgIGlmIChiPT0tbCkge1xuICAgICAgICByZXQgPSByaTEqUl9sbTFbYStsLTFdWzBdICsgcmltMSpSX2xtMVthK2wtMV1bMipsLTJdO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgaWYgKGI9PWwpIHJldCA9IHJpMSpSX2xtMVthK2wtMV1bMipsLTJdIC0gcmltMSpSX2xtMVthK2wtMV1bMF07XG4gICAgICAgIGVsc2UgcmV0ID0gcmkwKlJfbG0xW2ErbC0xXVtiK2wtMV07XG4gICAgfVxuICAgIHJldHVybiByZXQ7XG59XG5cbi8vIHlhd1BpdGNoUm9sbDJSenl4IGNvbXB1dGVzIHRoZSByb3RhdGlvbiBtYXRyaXggZnJvbSBaWSdYJycgcm90YXRpb24gYW5nbGVzXG5leHBvcnQgZnVuY3Rpb24geWF3UGl0Y2hSb2xsMlJ6eXgoeWF3LCBwaXRjaCwgcm9sbCkge1xuXG4gICAgbGV0IFJ4LCBSeSwgUno7XG4gICAgaWYgKHJvbGwgPT0gMCkgUnggPSBbWzEsMCwwXSxbMCwxLDBdLFswLDAsMV1dO1xuICAgIGVsc2UgUnggPSBbWzEsIDAsIDBdLCBbMCwgTWF0aC5jb3Mocm9sbCksIE1hdGguc2luKHJvbGwpXSwgWzAsIC1NYXRoLnNpbihyb2xsKSwgTWF0aC5jb3Mocm9sbCldXTtcbiAgICBpZiAocGl0Y2ggPT0gMCkgUnkgPSBbWzEsMCwwXSxbMCwxLDBdLFswLDAsMV1dO1xuICAgIGVsc2UgUnkgPSBbW01hdGguY29zKHBpdGNoKSwgMCwgLU1hdGguc2luKHBpdGNoKV0sIFswLCAxLCAwXSwgW01hdGguc2luKHBpdGNoKSwgMCwgTWF0aC5jb3MocGl0Y2gpXV07XG4gICAgaWYgKHlhdyA9PSAwKSBSeiA9IFtbMSwwLDBdLFswLDEsMF0sWzAsMCwxXV07XG4gICAgZWxzZSBSeiA9IFtbTWF0aC5jb3MoeWF3KSwgTWF0aC5zaW4oeWF3KSwgMF0sIFstTWF0aC5zaW4oeWF3KSwgTWF0aC5jb3MoeWF3KSwgMF0sIFswLCAwLCAxXV07XG5cbiAgICBsZXQgUiA9IG51bWVyaWMuZG90TU1zbWFsbChSeSxSeik7XG4gICAgUiA9IG51bWVyaWMuZG90TU1zbWFsbChSeCxSKTtcbiAgICByZXR1cm4gUjtcbn1cbiIsIlwidXNlIHN0cmljdFwiO3ZhciBudW1lcmljPXR5cGVvZiBleHBvcnRzPT1cInVuZGVmaW5lZFwiP2Z1bmN0aW9uKCl7fTpleHBvcnRzO3R5cGVvZiBnbG9iYWwhPVwidW5kZWZpbmVkXCImJihnbG9iYWwubnVtZXJpYz1udW1lcmljKSxudW1lcmljLnZlcnNpb249XCIxLjIuNlwiLG51bWVyaWMuYmVuY2g9ZnVuY3Rpb24odCxuKXt2YXIgcixpLHMsbzt0eXBlb2Ygbj09XCJ1bmRlZmluZWRcIiYmKG49MTUpLHM9LjUscj1uZXcgRGF0ZTtmb3IoOzspe3MqPTI7Zm9yKG89cztvPjM7by09NCl0KCksdCgpLHQoKSx0KCk7d2hpbGUobz4wKXQoKSxvLS07aT1uZXcgRGF0ZTtpZihpLXI+bilicmVha31mb3Iobz1zO28+MztvLT00KXQoKSx0KCksdCgpLHQoKTt3aGlsZShvPjApdCgpLG8tLTtyZXR1cm4gaT1uZXcgRGF0ZSwxZTMqKDMqcy0xKS8oaS1yKX0sbnVtZXJpYy5fbXlJbmRleE9mPWZ1bmN0aW9uKHQpe3ZhciBuPXRoaXMubGVuZ3RoLHI7Zm9yKHI9MDtyPG47KytyKWlmKHRoaXNbcl09PT10KXJldHVybiByO3JldHVybi0xfSxudW1lcmljLm15SW5kZXhPZj1BcnJheS5wcm90b3R5cGUuaW5kZXhPZj9BcnJheS5wcm90b3R5cGUuaW5kZXhPZjpudW1lcmljLl9teUluZGV4T2YsbnVtZXJpYy5GdW5jdGlvbj1GdW5jdGlvbixudW1lcmljLnByZWNpc2lvbj00LG51bWVyaWMubGFyZ2VBcnJheT01MCxudW1lcmljLnByZXR0eVByaW50PWZ1bmN0aW9uKHQpe2Z1bmN0aW9uIG4oZSl7aWYoZT09PTApcmV0dXJuXCIwXCI7aWYoaXNOYU4oZSkpcmV0dXJuXCJOYU5cIjtpZihlPDApcmV0dXJuXCItXCIrbigtZSk7aWYoaXNGaW5pdGUoZSkpe3ZhciB0PU1hdGguZmxvb3IoTWF0aC5sb2coZSkvTWF0aC5sb2coMTApKSxyPWUvTWF0aC5wb3coMTAsdCksaT1yLnRvUHJlY2lzaW9uKG51bWVyaWMucHJlY2lzaW9uKTtyZXR1cm4gcGFyc2VGbG9hdChpKT09PTEwJiYodCsrLHI9MSxpPXIudG9QcmVjaXNpb24obnVtZXJpYy5wcmVjaXNpb24pKSxwYXJzZUZsb2F0KGkpLnRvU3RyaW5nKCkrXCJlXCIrdC50b1N0cmluZygpfXJldHVyblwiSW5maW5pdHlcIn1mdW5jdGlvbiBpKGUpe3ZhciB0O2lmKHR5cGVvZiBlPT1cInVuZGVmaW5lZFwiKXJldHVybiByLnB1c2goQXJyYXkobnVtZXJpYy5wcmVjaXNpb24rOCkuam9pbihcIiBcIikpLCExO2lmKHR5cGVvZiBlPT1cInN0cmluZ1wiKXJldHVybiByLnB1c2goJ1wiJytlKydcIicpLCExO2lmKHR5cGVvZiBlPT1cImJvb2xlYW5cIilyZXR1cm4gci5wdXNoKGUudG9TdHJpbmcoKSksITE7aWYodHlwZW9mIGU9PVwibnVtYmVyXCIpe3ZhciBzPW4oZSksbz1lLnRvUHJlY2lzaW9uKG51bWVyaWMucHJlY2lzaW9uKSx1PXBhcnNlRmxvYXQoZS50b1N0cmluZygpKS50b1N0cmluZygpLGE9W3Msbyx1LHBhcnNlRmxvYXQobykudG9TdHJpbmcoKSxwYXJzZUZsb2F0KHUpLnRvU3RyaW5nKCldO2Zvcih0PTE7dDxhLmxlbmd0aDt0KyspYVt0XS5sZW5ndGg8cy5sZW5ndGgmJihzPWFbdF0pO3JldHVybiByLnB1c2goQXJyYXkobnVtZXJpYy5wcmVjaXNpb24rOC1zLmxlbmd0aCkuam9pbihcIiBcIikrcyksITF9aWYoZT09PW51bGwpcmV0dXJuIHIucHVzaChcIm51bGxcIiksITE7aWYodHlwZW9mIGU9PVwiZnVuY3Rpb25cIil7ci5wdXNoKGUudG9TdHJpbmcoKSk7dmFyIGY9ITE7Zm9yKHQgaW4gZSllLmhhc093blByb3BlcnR5KHQpJiYoZj9yLnB1c2goXCIsXFxuXCIpOnIucHVzaChcIlxcbntcIiksZj0hMCxyLnB1c2godCksci5wdXNoKFwiOiBcXG5cIiksaShlW3RdKSk7cmV0dXJuIGYmJnIucHVzaChcIn1cXG5cIiksITB9aWYoZSBpbnN0YW5jZW9mIEFycmF5KXtpZihlLmxlbmd0aD5udW1lcmljLmxhcmdlQXJyYXkpcmV0dXJuIHIucHVzaChcIi4uLkxhcmdlIEFycmF5Li4uXCIpLCEwO3ZhciBmPSExO3IucHVzaChcIltcIik7Zm9yKHQ9MDt0PGUubGVuZ3RoO3QrKyl0PjAmJihyLnB1c2goXCIsXCIpLGYmJnIucHVzaChcIlxcbiBcIikpLGY9aShlW3RdKTtyZXR1cm4gci5wdXNoKFwiXVwiKSwhMH1yLnB1c2goXCJ7XCIpO3ZhciBmPSExO2Zvcih0IGluIGUpZS5oYXNPd25Qcm9wZXJ0eSh0KSYmKGYmJnIucHVzaChcIixcXG5cIiksZj0hMCxyLnB1c2godCksci5wdXNoKFwiOiBcXG5cIiksaShlW3RdKSk7cmV0dXJuIHIucHVzaChcIn1cIiksITB9dmFyIHI9W107cmV0dXJuIGkodCksci5qb2luKFwiXCIpfSxudW1lcmljLnBhcnNlRGF0ZT1mdW5jdGlvbih0KXtmdW5jdGlvbiBuKGUpe2lmKHR5cGVvZiBlPT1cInN0cmluZ1wiKXJldHVybiBEYXRlLnBhcnNlKGUucmVwbGFjZSgvLS9nLFwiL1wiKSk7aWYoZSBpbnN0YW5jZW9mIEFycmF5KXt2YXIgdD1bXSxyO2ZvcihyPTA7cjxlLmxlbmd0aDtyKyspdFtyXT1uKGVbcl0pO3JldHVybiB0fXRocm93IG5ldyBFcnJvcihcInBhcnNlRGF0ZTogcGFyYW1ldGVyIG11c3QgYmUgYXJyYXlzIG9mIHN0cmluZ3NcIil9cmV0dXJuIG4odCl9LG51bWVyaWMucGFyc2VGbG9hdD1mdW5jdGlvbih0KXtmdW5jdGlvbiBuKGUpe2lmKHR5cGVvZiBlPT1cInN0cmluZ1wiKXJldHVybiBwYXJzZUZsb2F0KGUpO2lmKGUgaW5zdGFuY2VvZiBBcnJheSl7dmFyIHQ9W10scjtmb3Iocj0wO3I8ZS5sZW5ndGg7cisrKXRbcl09bihlW3JdKTtyZXR1cm4gdH10aHJvdyBuZXcgRXJyb3IoXCJwYXJzZUZsb2F0OiBwYXJhbWV0ZXIgbXVzdCBiZSBhcnJheXMgb2Ygc3RyaW5nc1wiKX1yZXR1cm4gbih0KX0sbnVtZXJpYy5wYXJzZUNTVj1mdW5jdGlvbih0KXt2YXIgbj10LnNwbGl0KFwiXFxuXCIpLHIsaSxzPVtdLG89LygoW14nXCIsXSopfCgnW14nXSonKXwoXCJbXlwiXSpcIikpLC9nLHU9L15cXHMqKChbKy1dP1swLTldKyhcXC5bMC05XSopPyhlWystXT9bMC05XSspPyl8KFsrLV0/WzAtOV0qKFxcLlswLTldKyk/KGVbKy1dP1swLTldKyk/KSlcXHMqJC8sYT1mdW5jdGlvbihlKXtyZXR1cm4gZS5zdWJzdHIoMCxlLmxlbmd0aC0xKX0sZj0wO2ZvcihpPTA7aTxuLmxlbmd0aDtpKyspe3ZhciBsPShuW2ldK1wiLFwiKS5tYXRjaChvKSxjO2lmKGwubGVuZ3RoPjApe3NbZl09W107Zm9yKHI9MDtyPGwubGVuZ3RoO3IrKyljPWEobFtyXSksdS50ZXN0KGMpP3NbZl1bcl09cGFyc2VGbG9hdChjKTpzW2ZdW3JdPWM7ZisrfX1yZXR1cm4gc30sbnVtZXJpYy50b0NTVj1mdW5jdGlvbih0KXt2YXIgbj1udW1lcmljLmRpbSh0KSxyLGkscyxvLHUsYTtzPW5bMF0sbz1uWzFdLGE9W107Zm9yKHI9MDtyPHM7cisrKXt1PVtdO2ZvcihpPTA7aTxzO2krKyl1W2ldPXRbcl1baV0udG9TdHJpbmcoKTthW3JdPXUuam9pbihcIiwgXCIpfXJldHVybiBhLmpvaW4oXCJcXG5cIikrXCJcXG5cIn0sbnVtZXJpYy5nZXRVUkw9ZnVuY3Rpb24odCl7dmFyIG49bmV3IFhNTEh0dHBSZXF1ZXN0O3JldHVybiBuLm9wZW4oXCJHRVRcIix0LCExKSxuLnNlbmQoKSxufSxudW1lcmljLmltYWdlVVJMPWZ1bmN0aW9uKHQpe2Z1bmN0aW9uIG4oZSl7dmFyIHQ9ZS5sZW5ndGgsbixyLGkscyxvLHUsYSxmLGw9XCJBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWmFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6MDEyMzQ1Njc4OSsvPVwiLGM9XCJcIjtmb3Iobj0wO248dDtuKz0zKXI9ZVtuXSxpPWVbbisxXSxzPWVbbisyXSxvPXI+PjIsdT0oKHImMyk8PDQpKyhpPj40KSxhPSgoaSYxNSk8PDIpKyhzPj42KSxmPXMmNjMsbisxPj10P2E9Zj02NDpuKzI+PXQmJihmPTY0KSxjKz1sLmNoYXJBdChvKStsLmNoYXJBdCh1KStsLmNoYXJBdChhKStsLmNoYXJBdChmKTtyZXR1cm4gY31mdW5jdGlvbiByKGUsdCxuKXt0eXBlb2YgdD09XCJ1bmRlZmluZWRcIiYmKHQ9MCksdHlwZW9mIG49PVwidW5kZWZpbmVkXCImJihuPWUubGVuZ3RoKTt2YXIgcj1bMCwxOTk2OTU5ODk0LDM5OTM5MTk3ODgsMjU2NzUyNDc5NCwxMjQ2MzQxMzcsMTg4NjA1NzYxNSwzOTE1NjIxNjg1LDI2NTczOTIwMzUsMjQ5MjY4Mjc0LDIwNDQ1MDgzMjQsMzc3MjExNTIzMCwyNTQ3MTc3ODY0LDE2Mjk0MTk5NSwyMTI1NTYxMDIxLDM4ODc2MDcwNDcsMjQyODQ0NDA0OSw0OTg1MzY1NDgsMTc4OTkyNzY2Niw0MDg5MDE2NjQ4LDIyMjcwNjEyMTQsNDUwNTQ4ODYxLDE4NDMyNTg2MDMsNDEwNzU4MDc1MywyMjExNjc3NjM5LDMyNTg4Mzk5MCwxNjg0Nzc3MTUyLDQyNTExMjIwNDIsMjMyMTkyNjYzNiwzMzU2MzM0ODcsMTY2MTM2NTQ2NSw0MTk1MzAyNzU1LDIzNjYxMTUzMTcsOTk3MDczMDk2LDEyODE5NTM4ODYsMzU3OTg1NTMzMiwyNzI0Njg4MjQyLDEwMDY4ODgxNDUsMTI1ODYwNzY4NywzNTI0MTAxNjI5LDI3Njg5NDI0NDMsOTAxMDk3NzIyLDExMTkwMDA2ODQsMzY4NjUxNzIwNiwyODk4MDY1NzI4LDg1MzA0NDQ1MSwxMTcyMjY2MTAxLDM3MDUwMTU3NTksMjg4MjYxNjY2NSw2NTE3Njc5ODAsMTM3MzUwMzU0NiwzMzY5NTU0MzA0LDMyMTgxMDQ1OTgsNTY1NTA3MjUzLDE0NTQ2MjE3MzEsMzQ4NTExMTcwNSwzMDk5NDM2MzAzLDY3MTI2Njk3NCwxNTk0MTk4MDI0LDMzMjI3MzA5MzAsMjk3MDM0NzgxMiw3OTU4MzU1MjcsMTQ4MzIzMDIyNSwzMjQ0MzY3Mjc1LDMwNjAxNDk1NjUsMTk5NDE0NjE5MiwzMTE1ODUzNCwyNTYzOTA3NzcyLDQwMjM3MTc5MzAsMTkwNzQ1OTQ2NSwxMTI2MzcyMTUsMjY4MDE1MzI1MywzOTA0NDI3MDU5LDIwMTM3NzYyOTAsMjUxNzIyMDM2LDI1MTcyMTUzNzQsMzc3NTgzMDA0MCwyMTM3NjU2NzYzLDE0MTM3NjgxMywyNDM5Mjc3NzE5LDM4NjUyNzEyOTcsMTgwMjE5NTQ0NCw0NzY4NjQ4NjYsMjIzODAwMTM2OCw0MDY2NTA4ODc4LDE4MTIzNzA5MjUsNDUzMDkyNzMxLDIxODE2MjUwMjUsNDExMTQ1MTIyMywxNzA2MDg4OTAyLDMxNDA0MjcwNCwyMzQ0NTMyMjAyLDQyNDAwMTc1MzIsMTY1ODY1ODI3MSwzNjY2MTk5NzcsMjM2MjY3MDMyMyw0MjI0OTk0NDA1LDEzMDM1MzU5NjAsOTg0OTYxNDg2LDI3NDcwMDcwOTIsMzU2OTAzNzUzOCwxMjU2MTcwODE3LDEwMzc2MDQzMTEsMjc2NTIxMDczMywzNTU0MDc5OTk1LDExMzEwMTQ1MDYsODc5Njc5OTk2LDI5MDkyNDM0NjIsMzY2Mzc3MTg1NiwxMTQxMTI0NDY3LDg1NTg0MjI3NywyODUyODAxNjMxLDM3MDg2NDg2NDksMTM0MjUzMzk0OCw2NTQ0NTkzMDYsMzE4ODM5NjA0OCwzMzczMDE1MTc0LDE0NjY0Nzk5MDksNTQ0MTc5NjM1LDMxMTA1MjM5MTMsMzQ2MjUyMjAxNSwxNTkxNjcxMDU0LDcwMjEzODc3NiwyOTY2NDYwNDUwLDMzNTI3OTk0MTIsMTUwNDkxODgwNyw3ODM1NTE4NzMsMzA4MjY0MDQ0MywzMjMzNDQyOTg5LDM5ODgyOTIzODQsMjU5NjI1NDY0Niw2MjMxNzA2OCwxOTU3ODEwODQyLDM5Mzk4NDU5NDUsMjY0NzgxNjExMSw4MTQ3MDk5NywxOTQzODAzNTIzLDM4MTQ5MTg5MzAsMjQ4OTU5NjgwNCwyMjUyNzQ0MzAsMjA1Mzc5MDM3NiwzODI2MTc1NzU1LDI0NjY5MDYwMTMsMTY3ODE2NzQzLDIwOTc2NTEzNzcsNDAyNzU1MjU4MCwyMjY1NDkwMzg2LDUwMzQ0NDA3MiwxNzYyMDUwODE0LDQxNTA0MTcyNDUsMjE1NDEyOTM1NSw0MjY1MjIyMjUsMTg1MjUwNzg3OSw0Mjc1MzEzNTI2LDIzMTIzMTc5MjAsMjgyNzUzNjI2LDE3NDI1NTU4NTIsNDE4OTcwODE0MywyMzk0ODc3OTQ1LDM5NzkxNzc2MywxNjIyMTgzNjM3LDM2MDQzOTA4ODgsMjcxNDg2NjU1OCw5NTM3Mjk3MzIsMTM0MDA3NjYyNiwzNTE4NzE5OTg1LDI3OTczNjA5OTksMTA2ODgyODM4MSwxMjE5NjM4ODU5LDM2MjQ3NDE4NTAsMjkzNjY3NTE0OCw5MDYxODU0NjIsMTA5MDgxMjUxMiwzNzQ3NjcyMDAzLDI4MjUzNzk2NjksODI5MzI5MTM1LDExODEzMzUxNjEsMzQxMjE3NzgwNCwzMTYwODM0ODQyLDYyODA4NTQwOCwxMzgyNjA1MzY2LDM0MjMzNjkxMDksMzEzODA3ODQ2Nyw1NzA1NjIyMzMsMTQyNjQwMDgxNSwzMzE3MzE2NTQyLDI5OTg3MzM2MDgsNzMzMjM5OTU0LDE1NTUyNjE5NTYsMzI2ODkzNTU5MSwzMDUwMzYwNjI1LDc1MjQ1OTQwMywxNTQxMzIwMjIxLDI2MDcwNzE5MjAsMzk2NTk3MzAzMCwxOTY5OTIyOTcyLDQwNzM1NDk4LDI2MTc4MzcyMjUsMzk0MzU3NzE1MSwxOTEzMDg3ODc3LDgzOTA4MzcxLDI1MTIzNDE2MzQsMzgwMzc0MDY5MiwyMDc1MjA4NjIyLDIxMzI2MTExMiwyNDYzMjcyNjAzLDM4NTU5OTAyODUsMjA5NDg1NDA3MSwxOTg5NTg4ODEsMjI2MjAyOTAxMiw0MDU3MjYwNjEwLDE3NTkzNTk5OTIsNTM0NDE0MTkwLDIxNzY3MTg1NDEsNDEzOTMyOTExNSwxODczODM2MDAxLDQxNDY2NDU2NywyMjgyMjQ4OTM0LDQyNzkyMDAzNjgsMTcxMTY4NDU1NCwyODUyODExMTYsMjQwNTgwMTcyNyw0MTY3MjE2NzQ1LDE2MzQ0Njc3OTUsMzc2MjI5NzAxLDI2ODUwNjc4OTYsMzYwODAwNzQwNiwxMzA4OTE4NjEyLDk1NjU0MzkzOCwyODA4NTU1MTA1LDM0OTU5NTgyNjMsMTIzMTYzNjMwMSwxMDQ3NDI3MDM1LDI5MzI5NTk4MTgsMzY1NDcwMzgzNiwxMDg4MzU5MjcwLDkzNjkxOGUzLDI4NDc3MTQ4OTksMzczNjgzNzgyOSwxMjAyOTAwODYzLDgxNzIzMzg5NywzMTgzMzQyMTA4LDM0MDEyMzcxMzAsMTQwNDI3NzU1Miw2MTU4MTgxNTAsMzEzNDIwNzQ5MywzNDUzNDIxMjAzLDE0MjM4NTc0NDksNjAxNDUwNDMxLDMwMDk4Mzc2MTQsMzI5NDcxMDQ1NiwxNTY3MTAzNzQ2LDcxMTkyODcyNCwzMDIwNjY4NDcxLDMyNzIzODAwNjUsMTUxMDMzNDIzNSw3NTUxNjcxMTddLGk9LTEscz0wLG89ZS5sZW5ndGgsdTtmb3IodT10O3U8bjt1Kyspcz0oaV5lW3VdKSYyNTUsaT1pPj4+OF5yW3NdO3JldHVybiBpXi0xfXZhciBpPXRbMF0ubGVuZ3RoLHM9dFswXVswXS5sZW5ndGgsbyx1LGEsZixsLGMsaCxwLGQsdixtLGc9WzEzNyw4MCw3OCw3MSwxMywxMCwyNiwxMCwwLDAsMCwxMyw3Myw3Miw2OCw4MixzPj4yNCYyNTUscz4+MTYmMjU1LHM+PjgmMjU1LHMmMjU1LGk+PjI0JjI1NSxpPj4xNiYyNTUsaT4+OCYyNTUsaSYyNTUsOCwyLDAsMCwwLC0xLC0yLC0zLC00LC01LC02LC03LC04LDczLDY4LDY1LDg0LDgsMjldO209cihnLDEyLDI5KSxnWzI5XT1tPj4yNCYyNTUsZ1szMF09bT4+MTYmMjU1LGdbMzFdPW0+PjgmMjU1LGdbMzJdPW0mMjU1LG89MSx1PTA7Zm9yKHA9MDtwPGk7cCsrKXtwPGktMT9nLnB1c2goMCk6Zy5wdXNoKDEpLGM9MypzKzErKHA9PT0wKSYyNTUsaD0zKnMrMSsocD09PTApPj44JjI1NSxnLnB1c2goYyksZy5wdXNoKGgpLGcucHVzaCh+YyYyNTUpLGcucHVzaCh+aCYyNTUpLHA9PT0wJiZnLnB1c2goMCk7Zm9yKGQ9MDtkPHM7ZCsrKWZvcihmPTA7ZjwzO2YrKyljPXRbZl1bcF1bZF0sYz4yNTU/Yz0yNTU6YzwwP2M9MDpjPU1hdGgucm91bmQoYyksbz0obytjKSU2NTUyMSx1PSh1K28pJTY1NTIxLGcucHVzaChjKTtnLnB1c2goMCl9cmV0dXJuIHY9KHU8PDE2KStvLGcucHVzaCh2Pj4yNCYyNTUpLGcucHVzaCh2Pj4xNiYyNTUpLGcucHVzaCh2Pj44JjI1NSksZy5wdXNoKHYmMjU1KSxsPWcubGVuZ3RoLTQxLGdbMzNdPWw+PjI0JjI1NSxnWzM0XT1sPj4xNiYyNTUsZ1szNV09bD4+OCYyNTUsZ1szNl09bCYyNTUsbT1yKGcsMzcpLGcucHVzaChtPj4yNCYyNTUpLGcucHVzaChtPj4xNiYyNTUpLGcucHVzaChtPj44JjI1NSksZy5wdXNoKG0mMjU1KSxnLnB1c2goMCksZy5wdXNoKDApLGcucHVzaCgwKSxnLnB1c2goMCksZy5wdXNoKDczKSxnLnB1c2goNjkpLGcucHVzaCg3OCksZy5wdXNoKDY4KSxnLnB1c2goMTc0KSxnLnB1c2goNjYpLGcucHVzaCg5NiksZy5wdXNoKDEzMCksXCJkYXRhOmltYWdlL3BuZztiYXNlNjQsXCIrbihnKX0sbnVtZXJpYy5fZGltPWZ1bmN0aW9uKHQpe3ZhciBuPVtdO3doaWxlKHR5cGVvZiB0PT1cIm9iamVjdFwiKW4ucHVzaCh0Lmxlbmd0aCksdD10WzBdO3JldHVybiBufSxudW1lcmljLmRpbT1mdW5jdGlvbih0KXt2YXIgbixyO2lmKHR5cGVvZiB0PT1cIm9iamVjdFwiKXJldHVybiBuPXRbMF0sdHlwZW9mIG49PVwib2JqZWN0XCI/KHI9blswXSx0eXBlb2Ygcj09XCJvYmplY3RcIj9udW1lcmljLl9kaW0odCk6W3QubGVuZ3RoLG4ubGVuZ3RoXSk6W3QubGVuZ3RoXTtyZXR1cm5bXX0sbnVtZXJpYy5tYXByZWR1Y2U9ZnVuY3Rpb24odCxuKXtyZXR1cm4gRnVuY3Rpb24oXCJ4XCIsXCJhY2N1bVwiLFwiX3NcIixcIl9rXCIsJ2lmKHR5cGVvZiBhY2N1bSA9PT0gXCJ1bmRlZmluZWRcIikgYWNjdW0gPSAnK24rXCI7XFxuXCIrJ2lmKHR5cGVvZiB4ID09PSBcIm51bWJlclwiKSB7IHZhciB4aSA9IHg7ICcrdCtcIjsgcmV0dXJuIGFjY3VtOyB9XFxuXCIrJ2lmKHR5cGVvZiBfcyA9PT0gXCJ1bmRlZmluZWRcIikgX3MgPSBudW1lcmljLmRpbSh4KTtcXG4nKydpZih0eXBlb2YgX2sgPT09IFwidW5kZWZpbmVkXCIpIF9rID0gMDtcXG4nK1widmFyIF9uID0gX3NbX2tdO1xcblwiK1widmFyIGkseGk7XFxuXCIrXCJpZihfayA8IF9zLmxlbmd0aC0xKSB7XFxuXCIrXCIgICAgZm9yKGk9X24tMTtpPj0wO2ktLSkge1xcblwiK1wiICAgICAgICBhY2N1bSA9IGFyZ3VtZW50cy5jYWxsZWUoeFtpXSxhY2N1bSxfcyxfaysxKTtcXG5cIitcIiAgICB9XCIrXCIgICAgcmV0dXJuIGFjY3VtO1xcblwiK1wifVxcblwiK1wiZm9yKGk9X24tMTtpPj0xO2ktPTIpIHsgXFxuXCIrXCIgICAgeGkgPSB4W2ldO1xcblwiK1wiICAgIFwiK3QrXCI7XFxuXCIrXCIgICAgeGkgPSB4W2ktMV07XFxuXCIrXCIgICAgXCIrdCtcIjtcXG5cIitcIn1cXG5cIitcImlmKGkgPT09IDApIHtcXG5cIitcIiAgICB4aSA9IHhbaV07XFxuXCIrXCIgICAgXCIrdCtcIlxcblwiK1wifVxcblwiK1wicmV0dXJuIGFjY3VtO1wiKX0sbnVtZXJpYy5tYXByZWR1Y2UyPWZ1bmN0aW9uKHQsbil7cmV0dXJuIEZ1bmN0aW9uKFwieFwiLFwidmFyIG4gPSB4Lmxlbmd0aDtcXG52YXIgaSx4aTtcXG5cIituK1wiO1xcblwiK1wiZm9yKGk9bi0xO2khPT0tMTstLWkpIHsgXFxuXCIrXCIgICAgeGkgPSB4W2ldO1xcblwiK1wiICAgIFwiK3QrXCI7XFxuXCIrXCJ9XFxuXCIrXCJyZXR1cm4gYWNjdW07XCIpfSxudW1lcmljLnNhbWU9ZnVuY3Rpb24gc2FtZShlLHQpe3ZhciBuLHI7aWYoZSBpbnN0YW5jZW9mIEFycmF5JiZ0IGluc3RhbmNlb2YgQXJyYXkpe3I9ZS5sZW5ndGg7aWYociE9PXQubGVuZ3RoKXJldHVybiExO2ZvcihuPTA7bjxyO24rKyl7aWYoZVtuXT09PXRbbl0pY29udGludWU7aWYodHlwZW9mIGVbbl0hPVwib2JqZWN0XCIpcmV0dXJuITE7aWYoIXNhbWUoZVtuXSx0W25dKSlyZXR1cm4hMX1yZXR1cm4hMH1yZXR1cm4hMX0sbnVtZXJpYy5yZXA9ZnVuY3Rpb24odCxuLHIpe3R5cGVvZiByPT1cInVuZGVmaW5lZFwiJiYocj0wKTt2YXIgaT10W3JdLHM9QXJyYXkoaSksbztpZihyPT09dC5sZW5ndGgtMSl7Zm9yKG89aS0yO28+PTA7by09MilzW28rMV09bixzW29dPW47cmV0dXJuIG89PT0tMSYmKHNbMF09biksc31mb3Iobz1pLTE7bz49MDtvLS0pc1tvXT1udW1lcmljLnJlcCh0LG4scisxKTtyZXR1cm4gc30sbnVtZXJpYy5kb3RNTXNtYWxsPWZ1bmN0aW9uKHQsbil7dmFyIHIsaSxzLG8sdSxhLGYsbCxjLGgscCxkLHYsbTtvPXQubGVuZ3RoLHU9bi5sZW5ndGgsYT1uWzBdLmxlbmd0aCxmPUFycmF5KG8pO2ZvcihyPW8tMTtyPj0wO3ItLSl7bD1BcnJheShhKSxjPXRbcl07Zm9yKHM9YS0xO3M+PTA7cy0tKXtoPWNbdS0xXSpuW3UtMV1bc107Zm9yKGk9dS0yO2k+PTE7aS09MilwPWktMSxoKz1jW2ldKm5baV1bc10rY1twXSpuW3BdW3NdO2k9PT0wJiYoaCs9Y1swXSpuWzBdW3NdKSxsW3NdPWh9ZltyXT1sfXJldHVybiBmfSxudW1lcmljLl9nZXRDb2w9ZnVuY3Rpb24odCxuLHIpe3ZhciBpPXQubGVuZ3RoLHM7Zm9yKHM9aS0xO3M+MDstLXMpcltzXT10W3NdW25dLC0tcyxyW3NdPXRbc11bbl07cz09PTAmJihyWzBdPXRbMF1bbl0pfSxudW1lcmljLmRvdE1NYmlnPWZ1bmN0aW9uKHQsbil7dmFyIHI9bnVtZXJpYy5fZ2V0Q29sLGk9bi5sZW5ndGgscz1BcnJheShpKSxvPXQubGVuZ3RoLHU9blswXS5sZW5ndGgsYT1uZXcgQXJyYXkobyksZixsPW51bWVyaWMuZG90VlYsYyxoLHAsZDstLWksLS1vO2ZvcihjPW87YyE9PS0xOy0tYylhW2NdPUFycmF5KHUpOy0tdTtmb3IoYz11O2MhPT0tMTstLWMpe3IobixjLHMpO2ZvcihoPW87aCE9PS0xOy0taClkPTAsZj10W2hdLGFbaF1bY109bChmLHMpfXJldHVybiBhfSxudW1lcmljLmRvdE1WPWZ1bmN0aW9uKHQsbil7dmFyIHI9dC5sZW5ndGgsaT1uLmxlbmd0aCxzLG89QXJyYXkociksdT1udW1lcmljLmRvdFZWO2ZvcihzPXItMTtzPj0wO3MtLSlvW3NdPXUodFtzXSxuKTtyZXR1cm4gb30sbnVtZXJpYy5kb3RWTT1mdW5jdGlvbih0LG4pe3ZhciByLGkscyxvLHUsYSxmLGwsYyxoLHAsZCx2LG0sZyx5LGIsdyxFO289dC5sZW5ndGgsdT1uWzBdLmxlbmd0aCxmPUFycmF5KHUpO2ZvcihzPXUtMTtzPj0wO3MtLSl7aD10W28tMV0qbltvLTFdW3NdO2ZvcihpPW8tMjtpPj0xO2ktPTIpcD1pLTEsaCs9dFtpXSpuW2ldW3NdK3RbcF0qbltwXVtzXTtpPT09MCYmKGgrPXRbMF0qblswXVtzXSksZltzXT1ofXJldHVybiBmfSxudW1lcmljLmRvdFZWPWZ1bmN0aW9uKHQsbil7dmFyIHIsaT10Lmxlbmd0aCxzLG89dFtpLTFdKm5baS0xXTtmb3Iocj1pLTI7cj49MTtyLT0yKXM9ci0xLG8rPXRbcl0qbltyXSt0W3NdKm5bc107cmV0dXJuIHI9PT0wJiYobys9dFswXSpuWzBdKSxvfSxudW1lcmljLmRvdD1mdW5jdGlvbih0LG4pe3ZhciByPW51bWVyaWMuZGltO3N3aXRjaChyKHQpLmxlbmd0aCoxZTMrcihuKS5sZW5ndGgpe2Nhc2UgMjAwMjpyZXR1cm4gbi5sZW5ndGg8MTA/bnVtZXJpYy5kb3RNTXNtYWxsKHQsbik6bnVtZXJpYy5kb3RNTWJpZyh0LG4pO2Nhc2UgMjAwMTpyZXR1cm4gbnVtZXJpYy5kb3RNVih0LG4pO2Nhc2UgMTAwMjpyZXR1cm4gbnVtZXJpYy5kb3RWTSh0LG4pO2Nhc2UgMTAwMTpyZXR1cm4gbnVtZXJpYy5kb3RWVih0LG4pO2Nhc2UgMWUzOnJldHVybiBudW1lcmljLm11bFZTKHQsbik7Y2FzZSAxOnJldHVybiBudW1lcmljLm11bFNWKHQsbik7Y2FzZSAwOnJldHVybiB0Km47ZGVmYXVsdDp0aHJvdyBuZXcgRXJyb3IoXCJudW1lcmljLmRvdCBvbmx5IHdvcmtzIG9uIHZlY3RvcnMgYW5kIG1hdHJpY2VzXCIpfX0sbnVtZXJpYy5kaWFnPWZ1bmN0aW9uKHQpe3ZhciBuLHIsaSxzPXQubGVuZ3RoLG89QXJyYXkocyksdTtmb3Iobj1zLTE7bj49MDtuLS0pe3U9QXJyYXkocykscj1uKzI7Zm9yKGk9cy0xO2k+PXI7aS09Mil1W2ldPTAsdVtpLTFdPTA7aT5uJiYodVtpXT0wKSx1W25dPXRbbl07Zm9yKGk9bi0xO2k+PTE7aS09Mil1W2ldPTAsdVtpLTFdPTA7aT09PTAmJih1WzBdPTApLG9bbl09dX1yZXR1cm4gb30sbnVtZXJpYy5nZXREaWFnPWZ1bmN0aW9uKGUpe3ZhciB0PU1hdGgubWluKGUubGVuZ3RoLGVbMF0ubGVuZ3RoKSxuLHI9QXJyYXkodCk7Zm9yKG49dC0xO24+PTE7LS1uKXJbbl09ZVtuXVtuXSwtLW4scltuXT1lW25dW25dO3JldHVybiBuPT09MCYmKHJbMF09ZVswXVswXSkscn0sbnVtZXJpYy5pZGVudGl0eT1mdW5jdGlvbih0KXtyZXR1cm4gbnVtZXJpYy5kaWFnKG51bWVyaWMucmVwKFt0XSwxKSl9LG51bWVyaWMucG9pbnR3aXNlPWZ1bmN0aW9uKHQsbixyKXt0eXBlb2Ygcj09XCJ1bmRlZmluZWRcIiYmKHI9XCJcIik7dmFyIGk9W10scyxvPS9cXFtpXFxdJC8sdSxhPVwiXCIsZj0hMTtmb3Iocz0wO3M8dC5sZW5ndGg7cysrKW8udGVzdCh0W3NdKT8odT10W3NdLnN1YnN0cmluZygwLHRbc10ubGVuZ3RoLTMpLGE9dSk6dT10W3NdLHU9PT1cInJldFwiJiYoZj0hMCksaS5wdXNoKHUpO3JldHVybiBpW3QubGVuZ3RoXT1cIl9zXCIsaVt0Lmxlbmd0aCsxXT1cIl9rXCIsaVt0Lmxlbmd0aCsyXT0naWYodHlwZW9mIF9zID09PSBcInVuZGVmaW5lZFwiKSBfcyA9IG51bWVyaWMuZGltKCcrYStcIik7XFxuXCIrJ2lmKHR5cGVvZiBfayA9PT0gXCJ1bmRlZmluZWRcIikgX2sgPSAwO1xcbicrXCJ2YXIgX24gPSBfc1tfa107XFxuXCIrXCJ2YXIgaVwiKyhmP1wiXCI6XCIsIHJldCA9IEFycmF5KF9uKVwiKStcIjtcXG5cIitcImlmKF9rIDwgX3MubGVuZ3RoLTEpIHtcXG5cIitcIiAgICBmb3IoaT1fbi0xO2k+PTA7aS0tKSByZXRbaV0gPSBhcmd1bWVudHMuY2FsbGVlKFwiK3Quam9pbihcIixcIikrXCIsX3MsX2srMSk7XFxuXCIrXCIgICAgcmV0dXJuIHJldDtcXG5cIitcIn1cXG5cIityK1wiXFxuXCIrXCJmb3IoaT1fbi0xO2khPT0tMTstLWkpIHtcXG5cIitcIiAgICBcIituK1wiXFxuXCIrXCJ9XFxuXCIrXCJyZXR1cm4gcmV0O1wiLEZ1bmN0aW9uLmFwcGx5KG51bGwsaSl9LG51bWVyaWMucG9pbnR3aXNlMj1mdW5jdGlvbih0LG4scil7dHlwZW9mIHI9PVwidW5kZWZpbmVkXCImJihyPVwiXCIpO3ZhciBpPVtdLHMsbz0vXFxbaVxcXSQvLHUsYT1cIlwiLGY9ITE7Zm9yKHM9MDtzPHQubGVuZ3RoO3MrKylvLnRlc3QodFtzXSk/KHU9dFtzXS5zdWJzdHJpbmcoMCx0W3NdLmxlbmd0aC0zKSxhPXUpOnU9dFtzXSx1PT09XCJyZXRcIiYmKGY9ITApLGkucHVzaCh1KTtyZXR1cm4gaVt0Lmxlbmd0aF09XCJ2YXIgX24gPSBcIithK1wiLmxlbmd0aDtcXG5cIitcInZhciBpXCIrKGY/XCJcIjpcIiwgcmV0ID0gQXJyYXkoX24pXCIpK1wiO1xcblwiK3IrXCJcXG5cIitcImZvcihpPV9uLTE7aSE9PS0xOy0taSkge1xcblwiK24rXCJcXG5cIitcIn1cXG5cIitcInJldHVybiByZXQ7XCIsRnVuY3Rpb24uYXBwbHkobnVsbCxpKX0sbnVtZXJpYy5fYmlmb3JlYWNoPWZ1bmN0aW9uIF9iaWZvcmVhY2goZSx0LG4scixpKXtpZihyPT09bi5sZW5ndGgtMSl7aShlLHQpO3JldHVybn12YXIgcyxvPW5bcl07Zm9yKHM9by0xO3M+PTA7cy0tKV9iaWZvcmVhY2godHlwZW9mIGU9PVwib2JqZWN0XCI/ZVtzXTplLHR5cGVvZiB0PT1cIm9iamVjdFwiP3Rbc106dCxuLHIrMSxpKX0sbnVtZXJpYy5fYmlmb3JlYWNoMj1mdW5jdGlvbiBfYmlmb3JlYWNoMihlLHQsbixyLGkpe2lmKHI9PT1uLmxlbmd0aC0xKXJldHVybiBpKGUsdCk7dmFyIHMsbz1uW3JdLHU9QXJyYXkobyk7Zm9yKHM9by0xO3M+PTA7LS1zKXVbc109X2JpZm9yZWFjaDIodHlwZW9mIGU9PVwib2JqZWN0XCI/ZVtzXTplLHR5cGVvZiB0PT1cIm9iamVjdFwiP3Rbc106dCxuLHIrMSxpKTtyZXR1cm4gdX0sbnVtZXJpYy5fZm9yZWFjaD1mdW5jdGlvbiBfZm9yZWFjaChlLHQsbixyKXtpZihuPT09dC5sZW5ndGgtMSl7cihlKTtyZXR1cm59dmFyIGkscz10W25dO2ZvcihpPXMtMTtpPj0wO2ktLSlfZm9yZWFjaChlW2ldLHQsbisxLHIpfSxudW1lcmljLl9mb3JlYWNoMj1mdW5jdGlvbiBfZm9yZWFjaDIoZSx0LG4scil7aWYobj09PXQubGVuZ3RoLTEpcmV0dXJuIHIoZSk7dmFyIGkscz10W25dLG89QXJyYXkocyk7Zm9yKGk9cy0xO2k+PTA7aS0tKW9baV09X2ZvcmVhY2gyKGVbaV0sdCxuKzEscik7cmV0dXJuIG99LG51bWVyaWMub3BzMj17YWRkOlwiK1wiLHN1YjpcIi1cIixtdWw6XCIqXCIsZGl2OlwiL1wiLG1vZDpcIiVcIixhbmQ6XCImJlwiLG9yOlwifHxcIixlcTpcIj09PVwiLG5lcTpcIiE9PVwiLGx0OlwiPFwiLGd0OlwiPlwiLGxlcTpcIjw9XCIsZ2VxOlwiPj1cIixiYW5kOlwiJlwiLGJvcjpcInxcIixieG9yOlwiXlwiLGxzaGlmdDpcIjw8XCIscnNoaWZ0OlwiPj5cIixycnNoaWZ0OlwiPj4+XCJ9LG51bWVyaWMub3BzZXE9e2FkZGVxOlwiKz1cIixzdWJlcTpcIi09XCIsbXVsZXE6XCIqPVwiLGRpdmVxOlwiLz1cIixtb2RlcTpcIiU9XCIsbHNoaWZ0ZXE6XCI8PD1cIixyc2hpZnRlcTpcIj4+PVwiLHJyc2hpZnRlcTpcIj4+Pj1cIixiYW5kZXE6XCImPVwiLGJvcmVxOlwifD1cIixieG9yZXE6XCJePVwifSxudW1lcmljLm1hdGhmdW5zPVtcImFic1wiLFwiYWNvc1wiLFwiYXNpblwiLFwiYXRhblwiLFwiY2VpbFwiLFwiY29zXCIsXCJleHBcIixcImZsb29yXCIsXCJsb2dcIixcInJvdW5kXCIsXCJzaW5cIixcInNxcnRcIixcInRhblwiLFwiaXNOYU5cIixcImlzRmluaXRlXCJdLG51bWVyaWMubWF0aGZ1bnMyPVtcImF0YW4yXCIsXCJwb3dcIixcIm1heFwiLFwibWluXCJdLG51bWVyaWMub3BzMT17bmVnOlwiLVwiLG5vdDpcIiFcIixibm90OlwiflwiLGNsb25lOlwiXCJ9LG51bWVyaWMubWFwcmVkdWNlcnM9e2FueTpbXCJpZih4aSkgcmV0dXJuIHRydWU7XCIsXCJ2YXIgYWNjdW0gPSBmYWxzZTtcIl0sYWxsOltcImlmKCF4aSkgcmV0dXJuIGZhbHNlO1wiLFwidmFyIGFjY3VtID0gdHJ1ZTtcIl0sc3VtOltcImFjY3VtICs9IHhpO1wiLFwidmFyIGFjY3VtID0gMDtcIl0scHJvZDpbXCJhY2N1bSAqPSB4aTtcIixcInZhciBhY2N1bSA9IDE7XCJdLG5vcm0yU3F1YXJlZDpbXCJhY2N1bSArPSB4aSp4aTtcIixcInZhciBhY2N1bSA9IDA7XCJdLG5vcm1pbmY6W1wiYWNjdW0gPSBtYXgoYWNjdW0sYWJzKHhpKSk7XCIsXCJ2YXIgYWNjdW0gPSAwLCBtYXggPSBNYXRoLm1heCwgYWJzID0gTWF0aC5hYnM7XCJdLG5vcm0xOltcImFjY3VtICs9IGFicyh4aSlcIixcInZhciBhY2N1bSA9IDAsIGFicyA9IE1hdGguYWJzO1wiXSxzdXA6W1wiYWNjdW0gPSBtYXgoYWNjdW0seGkpO1wiLFwidmFyIGFjY3VtID0gLUluZmluaXR5LCBtYXggPSBNYXRoLm1heDtcIl0saW5mOltcImFjY3VtID0gbWluKGFjY3VtLHhpKTtcIixcInZhciBhY2N1bSA9IEluZmluaXR5LCBtaW4gPSBNYXRoLm1pbjtcIl19LGZ1bmN0aW9uKCl7dmFyIGUsdDtmb3IoZT0wO2U8bnVtZXJpYy5tYXRoZnVuczIubGVuZ3RoOysrZSl0PW51bWVyaWMubWF0aGZ1bnMyW2VdLG51bWVyaWMub3BzMlt0XT10O2ZvcihlIGluIG51bWVyaWMub3BzMilpZihudW1lcmljLm9wczIuaGFzT3duUHJvcGVydHkoZSkpe3Q9bnVtZXJpYy5vcHMyW2VdO3ZhciBuLHIsaT1cIlwiO251bWVyaWMubXlJbmRleE9mLmNhbGwobnVtZXJpYy5tYXRoZnVuczIsZSkhPT0tMT8oaT1cInZhciBcIit0K1wiID0gTWF0aC5cIit0K1wiO1xcblwiLG49ZnVuY3Rpb24oZSxuLHIpe3JldHVybiBlK1wiID0gXCIrdCtcIihcIituK1wiLFwiK3IrXCIpXCJ9LHI9ZnVuY3Rpb24oZSxuKXtyZXR1cm4gZStcIiA9IFwiK3QrXCIoXCIrZStcIixcIituK1wiKVwifSk6KG49ZnVuY3Rpb24oZSxuLHIpe3JldHVybiBlK1wiID0gXCIrbitcIiBcIit0K1wiIFwiK3J9LG51bWVyaWMub3BzZXEuaGFzT3duUHJvcGVydHkoZStcImVxXCIpP3I9ZnVuY3Rpb24oZSxuKXtyZXR1cm4gZStcIiBcIit0K1wiPSBcIitufTpyPWZ1bmN0aW9uKGUsbil7cmV0dXJuIGUrXCIgPSBcIitlK1wiIFwiK3QrXCIgXCIrbn0pLG51bWVyaWNbZStcIlZWXCJdPW51bWVyaWMucG9pbnR3aXNlMihbXCJ4W2ldXCIsXCJ5W2ldXCJdLG4oXCJyZXRbaV1cIixcInhbaV1cIixcInlbaV1cIiksaSksbnVtZXJpY1tlK1wiU1ZcIl09bnVtZXJpYy5wb2ludHdpc2UyKFtcInhcIixcInlbaV1cIl0sbihcInJldFtpXVwiLFwieFwiLFwieVtpXVwiKSxpKSxudW1lcmljW2UrXCJWU1wiXT1udW1lcmljLnBvaW50d2lzZTIoW1wieFtpXVwiLFwieVwiXSxuKFwicmV0W2ldXCIsXCJ4W2ldXCIsXCJ5XCIpLGkpLG51bWVyaWNbZV09RnVuY3Rpb24oXCJ2YXIgbiA9IGFyZ3VtZW50cy5sZW5ndGgsIGksIHggPSBhcmd1bWVudHNbMF0sIHk7XFxudmFyIFZWID0gbnVtZXJpYy5cIitlK1wiVlYsIFZTID0gbnVtZXJpYy5cIitlK1wiVlMsIFNWID0gbnVtZXJpYy5cIitlK1wiU1Y7XFxuXCIrXCJ2YXIgZGltID0gbnVtZXJpYy5kaW07XFxuXCIrXCJmb3IoaT0xO2khPT1uOysraSkgeyBcXG5cIitcIiAgeSA9IGFyZ3VtZW50c1tpXTtcXG5cIisnICBpZih0eXBlb2YgeCA9PT0gXCJvYmplY3RcIikge1xcbicrJyAgICAgIGlmKHR5cGVvZiB5ID09PSBcIm9iamVjdFwiKSB4ID0gbnVtZXJpYy5fYmlmb3JlYWNoMih4LHksZGltKHgpLDAsVlYpO1xcbicrXCIgICAgICBlbHNlIHggPSBudW1lcmljLl9iaWZvcmVhY2gyKHgseSxkaW0oeCksMCxWUyk7XFxuXCIrJyAgfSBlbHNlIGlmKHR5cGVvZiB5ID09PSBcIm9iamVjdFwiKSB4ID0gbnVtZXJpYy5fYmlmb3JlYWNoMih4LHksZGltKHkpLDAsU1YpO1xcbicrXCIgIGVsc2UgXCIrcihcInhcIixcInlcIikrXCJcXG5cIitcIn1cXG5yZXR1cm4geDtcXG5cIiksbnVtZXJpY1t0XT1udW1lcmljW2VdLG51bWVyaWNbZStcImVxVlwiXT1udW1lcmljLnBvaW50d2lzZTIoW1wicmV0W2ldXCIsXCJ4W2ldXCJdLHIoXCJyZXRbaV1cIixcInhbaV1cIiksaSksbnVtZXJpY1tlK1wiZXFTXCJdPW51bWVyaWMucG9pbnR3aXNlMihbXCJyZXRbaV1cIixcInhcIl0scihcInJldFtpXVwiLFwieFwiKSxpKSxudW1lcmljW2UrXCJlcVwiXT1GdW5jdGlvbihcInZhciBuID0gYXJndW1lbnRzLmxlbmd0aCwgaSwgeCA9IGFyZ3VtZW50c1swXSwgeTtcXG52YXIgViA9IG51bWVyaWMuXCIrZStcImVxViwgUyA9IG51bWVyaWMuXCIrZStcImVxU1xcblwiK1widmFyIHMgPSBudW1lcmljLmRpbSh4KTtcXG5cIitcImZvcihpPTE7aSE9PW47KytpKSB7IFxcblwiK1wiICB5ID0gYXJndW1lbnRzW2ldO1xcblwiKycgIGlmKHR5cGVvZiB5ID09PSBcIm9iamVjdFwiKSBudW1lcmljLl9iaWZvcmVhY2goeCx5LHMsMCxWKTtcXG4nK1wiICBlbHNlIG51bWVyaWMuX2JpZm9yZWFjaCh4LHkscywwLFMpO1xcblwiK1wifVxcbnJldHVybiB4O1xcblwiKX1mb3IoZT0wO2U8bnVtZXJpYy5tYXRoZnVuczIubGVuZ3RoOysrZSl0PW51bWVyaWMubWF0aGZ1bnMyW2VdLGRlbGV0ZSBudW1lcmljLm9wczJbdF07Zm9yKGU9MDtlPG51bWVyaWMubWF0aGZ1bnMubGVuZ3RoOysrZSl0PW51bWVyaWMubWF0aGZ1bnNbZV0sbnVtZXJpYy5vcHMxW3RdPXQ7Zm9yKGUgaW4gbnVtZXJpYy5vcHMxKW51bWVyaWMub3BzMS5oYXNPd25Qcm9wZXJ0eShlKSYmKGk9XCJcIix0PW51bWVyaWMub3BzMVtlXSxudW1lcmljLm15SW5kZXhPZi5jYWxsKG51bWVyaWMubWF0aGZ1bnMsZSkhPT0tMSYmTWF0aC5oYXNPd25Qcm9wZXJ0eSh0KSYmKGk9XCJ2YXIgXCIrdCtcIiA9IE1hdGguXCIrdCtcIjtcXG5cIiksbnVtZXJpY1tlK1wiZXFWXCJdPW51bWVyaWMucG9pbnR3aXNlMihbXCJyZXRbaV1cIl0sXCJyZXRbaV0gPSBcIit0K1wiKHJldFtpXSk7XCIsaSksbnVtZXJpY1tlK1wiZXFcIl09RnVuY3Rpb24oXCJ4XCIsJ2lmKHR5cGVvZiB4ICE9PSBcIm9iamVjdFwiKSByZXR1cm4gJyt0K1wieFxcblwiK1widmFyIGk7XFxuXCIrXCJ2YXIgViA9IG51bWVyaWMuXCIrZStcImVxVjtcXG5cIitcInZhciBzID0gbnVtZXJpYy5kaW0oeCk7XFxuXCIrXCJudW1lcmljLl9mb3JlYWNoKHgscywwLFYpO1xcblwiK1wicmV0dXJuIHg7XFxuXCIpLG51bWVyaWNbZStcIlZcIl09bnVtZXJpYy5wb2ludHdpc2UyKFtcInhbaV1cIl0sXCJyZXRbaV0gPSBcIit0K1wiKHhbaV0pO1wiLGkpLG51bWVyaWNbZV09RnVuY3Rpb24oXCJ4XCIsJ2lmKHR5cGVvZiB4ICE9PSBcIm9iamVjdFwiKSByZXR1cm4gJyt0K1wiKHgpXFxuXCIrXCJ2YXIgaTtcXG5cIitcInZhciBWID0gbnVtZXJpYy5cIitlK1wiVjtcXG5cIitcInZhciBzID0gbnVtZXJpYy5kaW0oeCk7XFxuXCIrXCJyZXR1cm4gbnVtZXJpYy5fZm9yZWFjaDIoeCxzLDAsVik7XFxuXCIpKTtmb3IoZT0wO2U8bnVtZXJpYy5tYXRoZnVucy5sZW5ndGg7KytlKXQ9bnVtZXJpYy5tYXRoZnVuc1tlXSxkZWxldGUgbnVtZXJpYy5vcHMxW3RdO2ZvcihlIGluIG51bWVyaWMubWFwcmVkdWNlcnMpbnVtZXJpYy5tYXByZWR1Y2Vycy5oYXNPd25Qcm9wZXJ0eShlKSYmKHQ9bnVtZXJpYy5tYXByZWR1Y2Vyc1tlXSxudW1lcmljW2UrXCJWXCJdPW51bWVyaWMubWFwcmVkdWNlMih0WzBdLHRbMV0pLG51bWVyaWNbZV09RnVuY3Rpb24oXCJ4XCIsXCJzXCIsXCJrXCIsdFsxXSsnaWYodHlwZW9mIHggIT09IFwib2JqZWN0XCIpIHsnK1wiICAgIHhpID0geDtcXG5cIit0WzBdK1wiO1xcblwiK1wiICAgIHJldHVybiBhY2N1bTtcXG5cIitcIn1cIisnaWYodHlwZW9mIHMgPT09IFwidW5kZWZpbmVkXCIpIHMgPSBudW1lcmljLmRpbSh4KTtcXG4nKydpZih0eXBlb2YgayA9PT0gXCJ1bmRlZmluZWRcIikgayA9IDA7XFxuJytcImlmKGsgPT09IHMubGVuZ3RoLTEpIHJldHVybiBudW1lcmljLlwiK2UrXCJWKHgpO1xcblwiK1widmFyIHhpO1xcblwiK1widmFyIG4gPSB4Lmxlbmd0aCwgaTtcXG5cIitcImZvcihpPW4tMTtpIT09LTE7LS1pKSB7XFxuXCIrXCIgICB4aSA9IGFyZ3VtZW50cy5jYWxsZWUoeFtpXSk7XFxuXCIrdFswXStcIjtcXG5cIitcIn1cXG5cIitcInJldHVybiBhY2N1bTtcXG5cIikpfSgpLG51bWVyaWMudHJ1bmNWVj1udW1lcmljLnBvaW50d2lzZShbXCJ4W2ldXCIsXCJ5W2ldXCJdLFwicmV0W2ldID0gcm91bmQoeFtpXS95W2ldKSp5W2ldO1wiLFwidmFyIHJvdW5kID0gTWF0aC5yb3VuZDtcIiksbnVtZXJpYy50cnVuY1ZTPW51bWVyaWMucG9pbnR3aXNlKFtcInhbaV1cIixcInlcIl0sXCJyZXRbaV0gPSByb3VuZCh4W2ldL3kpKnk7XCIsXCJ2YXIgcm91bmQgPSBNYXRoLnJvdW5kO1wiKSxudW1lcmljLnRydW5jU1Y9bnVtZXJpYy5wb2ludHdpc2UoW1wieFwiLFwieVtpXVwiXSxcInJldFtpXSA9IHJvdW5kKHgveVtpXSkqeVtpXTtcIixcInZhciByb3VuZCA9IE1hdGgucm91bmQ7XCIpLG51bWVyaWMudHJ1bmM9ZnVuY3Rpb24odCxuKXtyZXR1cm4gdHlwZW9mIHQ9PVwib2JqZWN0XCI/dHlwZW9mIG49PVwib2JqZWN0XCI/bnVtZXJpYy50cnVuY1ZWKHQsbik6bnVtZXJpYy50cnVuY1ZTKHQsbik6dHlwZW9mIG49PVwib2JqZWN0XCI/bnVtZXJpYy50cnVuY1NWKHQsbik6TWF0aC5yb3VuZCh0L24pKm59LG51bWVyaWMuaW52PWZ1bmN0aW9uKHQpe3ZhciBuPW51bWVyaWMuZGltKHQpLHI9TWF0aC5hYnMsaT1uWzBdLHM9blsxXSxvPW51bWVyaWMuY2xvbmUodCksdSxhLGY9bnVtZXJpYy5pZGVudGl0eShpKSxsLGMsaCxwLGQsdDtmb3IocD0wO3A8czsrK3Ape3ZhciB2PS0xLG09LTE7Zm9yKGg9cDtoIT09aTsrK2gpZD1yKG9baF1bcF0pLGQ+bSYmKHY9aCxtPWQpO2E9b1t2XSxvW3ZdPW9bcF0sb1twXT1hLGM9Zlt2XSxmW3ZdPWZbcF0sZltwXT1jLHQ9YVtwXTtmb3IoZD1wO2QhPT1zOysrZClhW2RdLz10O2ZvcihkPXMtMTtkIT09LTE7LS1kKWNbZF0vPXQ7Zm9yKGg9aS0xO2ghPT0tMTstLWgpaWYoaCE9PXApe3U9b1toXSxsPWZbaF0sdD11W3BdO2ZvcihkPXArMTtkIT09czsrK2QpdVtkXS09YVtkXSp0O2ZvcihkPXMtMTtkPjA7LS1kKWxbZF0tPWNbZF0qdCwtLWQsbFtkXS09Y1tkXSp0O2Q9PT0wJiYobFswXS09Y1swXSp0KX19cmV0dXJuIGZ9LG51bWVyaWMuZGV0PWZ1bmN0aW9uKHQpe3ZhciBuPW51bWVyaWMuZGltKHQpO2lmKG4ubGVuZ3RoIT09Mnx8blswXSE9PW5bMV0pdGhyb3cgbmV3IEVycm9yKFwibnVtZXJpYzogZGV0KCkgb25seSB3b3JrcyBvbiBzcXVhcmUgbWF0cmljZXNcIik7dmFyIHI9blswXSxpPTEscyxvLHUsYT1udW1lcmljLmNsb25lKHQpLGYsbCxjLGgscCxkLHY7Zm9yKG89MDtvPHItMTtvKyspe3U9bztmb3Iocz1vKzE7czxyO3MrKylNYXRoLmFicyhhW3NdW29dKT5NYXRoLmFicyhhW3VdW29dKSYmKHU9cyk7dSE9PW8mJihoPWFbdV0sYVt1XT1hW29dLGFbb109aCxpKj0tMSksZj1hW29dO2ZvcihzPW8rMTtzPHI7cysrKXtsPWFbc10sYz1sW29dL2Zbb107Zm9yKHU9bysxO3U8ci0xO3UrPTIpcD11KzEsbFt1XS09Zlt1XSpjLGxbcF0tPWZbcF0qYzt1IT09ciYmKGxbdV0tPWZbdV0qYyl9aWYoZltvXT09PTApcmV0dXJuIDA7aSo9ZltvXX1yZXR1cm4gaSphW29dW29dfSxudW1lcmljLnRyYW5zcG9zZT1mdW5jdGlvbih0KXt2YXIgbixyLGk9dC5sZW5ndGgscz10WzBdLmxlbmd0aCxvPUFycmF5KHMpLHUsYSxmO2ZvcihyPTA7cjxzO3IrKylvW3JdPUFycmF5KGkpO2ZvcihuPWktMTtuPj0xO24tPTIpe2E9dFtuXSx1PXRbbi0xXTtmb3Iocj1zLTE7cj49MTstLXIpZj1vW3JdLGZbbl09YVtyXSxmW24tMV09dVtyXSwtLXIsZj1vW3JdLGZbbl09YVtyXSxmW24tMV09dVtyXTtyPT09MCYmKGY9b1swXSxmW25dPWFbMF0sZltuLTFdPXVbMF0pfWlmKG49PT0wKXt1PXRbMF07Zm9yKHI9cy0xO3I+PTE7LS1yKW9bcl1bMF09dVtyXSwtLXIsb1tyXVswXT11W3JdO3I9PT0wJiYob1swXVswXT11WzBdKX1yZXR1cm4gb30sbnVtZXJpYy5uZWd0cmFuc3Bvc2U9ZnVuY3Rpb24odCl7dmFyIG4scixpPXQubGVuZ3RoLHM9dFswXS5sZW5ndGgsbz1BcnJheShzKSx1LGEsZjtmb3Iocj0wO3I8cztyKyspb1tyXT1BcnJheShpKTtmb3Iobj1pLTE7bj49MTtuLT0yKXthPXRbbl0sdT10W24tMV07Zm9yKHI9cy0xO3I+PTE7LS1yKWY9b1tyXSxmW25dPS1hW3JdLGZbbi0xXT0tdVtyXSwtLXIsZj1vW3JdLGZbbl09LWFbcl0sZltuLTFdPS11W3JdO3I9PT0wJiYoZj1vWzBdLGZbbl09LWFbMF0sZltuLTFdPS11WzBdKX1pZihuPT09MCl7dT10WzBdO2ZvcihyPXMtMTtyPj0xOy0tcilvW3JdWzBdPS11W3JdLC0tcixvW3JdWzBdPS11W3JdO3I9PT0wJiYob1swXVswXT0tdVswXSl9cmV0dXJuIG99LG51bWVyaWMuX3JhbmRvbT1mdW5jdGlvbiBfcmFuZG9tKGUsdCl7dmFyIG4scj1lW3RdLGk9QXJyYXkocikscztpZih0PT09ZS5sZW5ndGgtMSl7cz1NYXRoLnJhbmRvbTtmb3Iobj1yLTE7bj49MTtuLT0yKWlbbl09cygpLGlbbi0xXT1zKCk7cmV0dXJuIG49PT0wJiYoaVswXT1zKCkpLGl9Zm9yKG49ci0xO24+PTA7bi0tKWlbbl09X3JhbmRvbShlLHQrMSk7cmV0dXJuIGl9LG51bWVyaWMucmFuZG9tPWZ1bmN0aW9uKHQpe3JldHVybiBudW1lcmljLl9yYW5kb20odCwwKX0sbnVtZXJpYy5ub3JtMj1mdW5jdGlvbih0KXtyZXR1cm4gTWF0aC5zcXJ0KG51bWVyaWMubm9ybTJTcXVhcmVkKHQpKX0sbnVtZXJpYy5saW5zcGFjZT1mdW5jdGlvbih0LG4scil7dHlwZW9mIHI9PVwidW5kZWZpbmVkXCImJihyPU1hdGgubWF4KE1hdGgucm91bmQobi10KSsxLDEpKTtpZihyPDIpcmV0dXJuIHI9PT0xP1t0XTpbXTt2YXIgaSxzPUFycmF5KHIpO3ItLTtmb3IoaT1yO2k+PTA7aS0tKXNbaV09KGkqbisoci1pKSp0KS9yO3JldHVybiBzfSxudW1lcmljLmdldEJsb2NrPWZ1bmN0aW9uKHQsbixyKXtmdW5jdGlvbiBzKGUsdCl7dmFyIG8sdT1uW3RdLGE9clt0XS11LGY9QXJyYXkoYSk7aWYodD09PWkubGVuZ3RoLTEpe2ZvcihvPWE7bz49MDtvLS0pZltvXT1lW28rdV07cmV0dXJuIGZ9Zm9yKG89YTtvPj0wO28tLSlmW29dPXMoZVtvK3VdLHQrMSk7cmV0dXJuIGZ9dmFyIGk9bnVtZXJpYy5kaW0odCk7cmV0dXJuIHModCwwKX0sbnVtZXJpYy5zZXRCbG9jaz1mdW5jdGlvbih0LG4scixpKXtmdW5jdGlvbiBvKGUsdCxpKXt2YXIgdSxhPW5baV0sZj1yW2ldLWE7aWYoaT09PXMubGVuZ3RoLTEpZm9yKHU9Zjt1Pj0wO3UtLSllW3UrYV09dFt1XTtmb3IodT1mO3U+PTA7dS0tKW8oZVt1K2FdLHRbdV0saSsxKX12YXIgcz1udW1lcmljLmRpbSh0KTtyZXR1cm4gbyh0LGksMCksdH0sbnVtZXJpYy5nZXRSYW5nZT1mdW5jdGlvbih0LG4scil7dmFyIGk9bi5sZW5ndGgscz1yLmxlbmd0aCxvLHUsYT1BcnJheShpKSxmLGw7Zm9yKG89aS0xO28hPT0tMTstLW8pe2Fbb109QXJyYXkocyksZj1hW29dLGw9dFtuW29dXTtmb3IodT1zLTE7dSE9PS0xOy0tdSlmW3VdPWxbclt1XV19cmV0dXJuIGF9LG51bWVyaWMuYmxvY2tNYXRyaXg9ZnVuY3Rpb24odCl7dmFyIG49bnVtZXJpYy5kaW0odCk7aWYobi5sZW5ndGg8NClyZXR1cm4gbnVtZXJpYy5ibG9ja01hdHJpeChbdF0pO3ZhciByPW5bMF0saT1uWzFdLHMsbyx1LGEsZjtzPTAsbz0wO2Zvcih1PTA7dTxyOysrdSlzKz10W3VdWzBdLmxlbmd0aDtmb3IoYT0wO2E8aTsrK2Epbys9dFswXVthXVswXS5sZW5ndGg7dmFyIGw9QXJyYXkocyk7Zm9yKHU9MDt1PHM7Kyt1KWxbdV09QXJyYXkobyk7dmFyIGM9MCxoLHAsZCx2LG07Zm9yKHU9MDt1PHI7Kyt1KXtoPW87Zm9yKGE9aS0xO2EhPT0tMTstLWEpe2Y9dFt1XVthXSxoLT1mWzBdLmxlbmd0aDtmb3IoZD1mLmxlbmd0aC0xO2QhPT0tMTstLWQpe209ZltkXSxwPWxbYytkXTtmb3Iodj1tLmxlbmd0aC0xO3YhPT0tMTstLXYpcFtoK3ZdPW1bdl19fWMrPXRbdV1bMF0ubGVuZ3RofXJldHVybiBsfSxudW1lcmljLnRlbnNvcj1mdW5jdGlvbih0LG4pe2lmKHR5cGVvZiB0PT1cIm51bWJlclwifHx0eXBlb2Ygbj09XCJudW1iZXJcIilyZXR1cm4gbnVtZXJpYy5tdWwodCxuKTt2YXIgcj1udW1lcmljLmRpbSh0KSxpPW51bWVyaWMuZGltKG4pO2lmKHIubGVuZ3RoIT09MXx8aS5sZW5ndGghPT0xKXRocm93IG5ldyBFcnJvcihcIm51bWVyaWM6IHRlbnNvciBwcm9kdWN0IGlzIG9ubHkgZGVmaW5lZCBmb3IgdmVjdG9yc1wiKTt2YXIgcz1yWzBdLG89aVswXSx1PUFycmF5KHMpLGEsZixsLGM7Zm9yKGY9cy0xO2Y+PTA7Zi0tKXthPUFycmF5KG8pLGM9dFtmXTtmb3IobD1vLTE7bD49MzstLWwpYVtsXT1jKm5bbF0sLS1sLGFbbF09YypuW2xdLC0tbCxhW2xdPWMqbltsXSwtLWwsYVtsXT1jKm5bbF07d2hpbGUobD49MClhW2xdPWMqbltsXSwtLWw7dVtmXT1hfXJldHVybiB1fSxudW1lcmljLlQ9ZnVuY3Rpb24odCxuKXt0aGlzLng9dCx0aGlzLnk9bn0sbnVtZXJpYy50PWZ1bmN0aW9uKHQsbil7cmV0dXJuIG5ldyBudW1lcmljLlQodCxuKX0sbnVtZXJpYy5UYmlub3A9ZnVuY3Rpb24odCxuLHIsaSxzKXt2YXIgbz1udW1lcmljLmluZGV4T2Y7aWYodHlwZW9mIHMhPVwic3RyaW5nXCIpe3ZhciB1O3M9XCJcIjtmb3IodSBpbiBudW1lcmljKW51bWVyaWMuaGFzT3duUHJvcGVydHkodSkmJih0LmluZGV4T2YodSk+PTB8fG4uaW5kZXhPZih1KT49MHx8ci5pbmRleE9mKHUpPj0wfHxpLmluZGV4T2YodSk+PTApJiZ1Lmxlbmd0aD4xJiYocys9XCJ2YXIgXCIrdStcIiA9IG51bWVyaWMuXCIrdStcIjtcXG5cIil9cmV0dXJuIEZ1bmN0aW9uKFtcInlcIl0sXCJ2YXIgeCA9IHRoaXM7XFxuaWYoISh5IGluc3RhbmNlb2YgbnVtZXJpYy5UKSkgeyB5ID0gbmV3IG51bWVyaWMuVCh5KTsgfVxcblwiK3MrXCJcXG5cIitcImlmKHgueSkge1wiK1wiICBpZih5LnkpIHtcIitcIiAgICByZXR1cm4gbmV3IG51bWVyaWMuVChcIitpK1wiKTtcXG5cIitcIiAgfVxcblwiK1wiICByZXR1cm4gbmV3IG51bWVyaWMuVChcIityK1wiKTtcXG5cIitcIn1cXG5cIitcImlmKHkueSkge1xcblwiK1wiICByZXR1cm4gbmV3IG51bWVyaWMuVChcIituK1wiKTtcXG5cIitcIn1cXG5cIitcInJldHVybiBuZXcgbnVtZXJpYy5UKFwiK3QrXCIpO1xcblwiKX0sbnVtZXJpYy5ULnByb3RvdHlwZS5hZGQ9bnVtZXJpYy5UYmlub3AoXCJhZGQoeC54LHkueClcIixcImFkZCh4LngseS54KSx5LnlcIixcImFkZCh4LngseS54KSx4LnlcIixcImFkZCh4LngseS54KSxhZGQoeC55LHkueSlcIiksbnVtZXJpYy5ULnByb3RvdHlwZS5zdWI9bnVtZXJpYy5UYmlub3AoXCJzdWIoeC54LHkueClcIixcInN1Yih4LngseS54KSxuZWcoeS55KVwiLFwic3ViKHgueCx5LngpLHgueVwiLFwic3ViKHgueCx5LngpLHN1Yih4LnkseS55KVwiKSxudW1lcmljLlQucHJvdG90eXBlLm11bD1udW1lcmljLlRiaW5vcChcIm11bCh4LngseS54KVwiLFwibXVsKHgueCx5LngpLG11bCh4LngseS55KVwiLFwibXVsKHgueCx5LngpLG11bCh4LnkseS54KVwiLFwic3ViKG11bCh4LngseS54KSxtdWwoeC55LHkueSkpLGFkZChtdWwoeC54LHkueSksbXVsKHgueSx5LngpKVwiKSxudW1lcmljLlQucHJvdG90eXBlLnJlY2lwcm9jYWw9ZnVuY3Rpb24oKXt2YXIgdD1udW1lcmljLm11bCxuPW51bWVyaWMuZGl2O2lmKHRoaXMueSl7dmFyIHI9bnVtZXJpYy5hZGQodCh0aGlzLngsdGhpcy54KSx0KHRoaXMueSx0aGlzLnkpKTtyZXR1cm4gbmV3IG51bWVyaWMuVChuKHRoaXMueCxyKSxuKG51bWVyaWMubmVnKHRoaXMueSkscikpfXJldHVybiBuZXcgVChuKDEsdGhpcy54KSl9LG51bWVyaWMuVC5wcm90b3R5cGUuZGl2PWZ1bmN0aW9uIGRpdihlKXtlIGluc3RhbmNlb2YgbnVtZXJpYy5UfHwoZT1uZXcgbnVtZXJpYy5UKGUpKTtpZihlLnkpcmV0dXJuIHRoaXMubXVsKGUucmVjaXByb2NhbCgpKTt2YXIgZGl2PW51bWVyaWMuZGl2O3JldHVybiB0aGlzLnk/bmV3IG51bWVyaWMuVChkaXYodGhpcy54LGUueCksZGl2KHRoaXMueSxlLngpKTpuZXcgbnVtZXJpYy5UKGRpdih0aGlzLngsZS54KSl9LG51bWVyaWMuVC5wcm90b3R5cGUuZG90PW51bWVyaWMuVGJpbm9wKFwiZG90KHgueCx5LngpXCIsXCJkb3QoeC54LHkueCksZG90KHgueCx5LnkpXCIsXCJkb3QoeC54LHkueCksZG90KHgueSx5LngpXCIsXCJzdWIoZG90KHgueCx5LngpLGRvdCh4LnkseS55KSksYWRkKGRvdCh4LngseS55KSxkb3QoeC55LHkueCkpXCIpLG51bWVyaWMuVC5wcm90b3R5cGUudHJhbnNwb3NlPWZ1bmN0aW9uKCl7dmFyIHQ9bnVtZXJpYy50cmFuc3Bvc2Usbj10aGlzLngscj10aGlzLnk7cmV0dXJuIHI/bmV3IG51bWVyaWMuVCh0KG4pLHQocikpOm5ldyBudW1lcmljLlQodChuKSl9LG51bWVyaWMuVC5wcm90b3R5cGUudHJhbnNqdWdhdGU9ZnVuY3Rpb24oKXt2YXIgdD1udW1lcmljLnRyYW5zcG9zZSxuPXRoaXMueCxyPXRoaXMueTtyZXR1cm4gcj9uZXcgbnVtZXJpYy5UKHQobiksbnVtZXJpYy5uZWd0cmFuc3Bvc2UocikpOm5ldyBudW1lcmljLlQodChuKSl9LG51bWVyaWMuVHVub3A9ZnVuY3Rpb24odCxuLHIpe3JldHVybiB0eXBlb2YgciE9XCJzdHJpbmdcIiYmKHI9XCJcIiksRnVuY3Rpb24oXCJ2YXIgeCA9IHRoaXM7XFxuXCIrcitcIlxcblwiK1wiaWYoeC55KSB7XCIrXCIgIFwiK24rXCI7XFxuXCIrXCJ9XFxuXCIrdCtcIjtcXG5cIil9LG51bWVyaWMuVC5wcm90b3R5cGUuZXhwPW51bWVyaWMuVHVub3AoXCJyZXR1cm4gbmV3IG51bWVyaWMuVChleClcIixcInJldHVybiBuZXcgbnVtZXJpYy5UKG11bChjb3MoeC55KSxleCksbXVsKHNpbih4LnkpLGV4KSlcIixcInZhciBleCA9IG51bWVyaWMuZXhwKHgueCksIGNvcyA9IG51bWVyaWMuY29zLCBzaW4gPSBudW1lcmljLnNpbiwgbXVsID0gbnVtZXJpYy5tdWw7XCIpLG51bWVyaWMuVC5wcm90b3R5cGUuY29uaj1udW1lcmljLlR1bm9wKFwicmV0dXJuIG5ldyBudW1lcmljLlQoeC54KTtcIixcInJldHVybiBuZXcgbnVtZXJpYy5UKHgueCxudW1lcmljLm5lZyh4LnkpKTtcIiksbnVtZXJpYy5ULnByb3RvdHlwZS5uZWc9bnVtZXJpYy5UdW5vcChcInJldHVybiBuZXcgbnVtZXJpYy5UKG5lZyh4LngpKTtcIixcInJldHVybiBuZXcgbnVtZXJpYy5UKG5lZyh4LngpLG5lZyh4LnkpKTtcIixcInZhciBuZWcgPSBudW1lcmljLm5lZztcIiksbnVtZXJpYy5ULnByb3RvdHlwZS5zaW49bnVtZXJpYy5UdW5vcChcInJldHVybiBuZXcgbnVtZXJpYy5UKG51bWVyaWMuc2luKHgueCkpXCIsXCJyZXR1cm4geC5leHAoKS5zdWIoeC5uZWcoKS5leHAoKSkuZGl2KG5ldyBudW1lcmljLlQoMCwyKSk7XCIpLG51bWVyaWMuVC5wcm90b3R5cGUuY29zPW51bWVyaWMuVHVub3AoXCJyZXR1cm4gbmV3IG51bWVyaWMuVChudW1lcmljLmNvcyh4LngpKVwiLFwicmV0dXJuIHguZXhwKCkuYWRkKHgubmVnKCkuZXhwKCkpLmRpdigyKTtcIiksbnVtZXJpYy5ULnByb3RvdHlwZS5hYnM9bnVtZXJpYy5UdW5vcChcInJldHVybiBuZXcgbnVtZXJpYy5UKG51bWVyaWMuYWJzKHgueCkpO1wiLFwicmV0dXJuIG5ldyBudW1lcmljLlQobnVtZXJpYy5zcXJ0KG51bWVyaWMuYWRkKG11bCh4LngseC54KSxtdWwoeC55LHgueSkpKSk7XCIsXCJ2YXIgbXVsID0gbnVtZXJpYy5tdWw7XCIpLG51bWVyaWMuVC5wcm90b3R5cGUubG9nPW51bWVyaWMuVHVub3AoXCJyZXR1cm4gbmV3IG51bWVyaWMuVChudW1lcmljLmxvZyh4LngpKTtcIixcInZhciB0aGV0YSA9IG5ldyBudW1lcmljLlQobnVtZXJpYy5hdGFuMih4LnkseC54KSksIHIgPSB4LmFicygpO1xcbnJldHVybiBuZXcgbnVtZXJpYy5UKG51bWVyaWMubG9nKHIueCksdGhldGEueCk7XCIpLG51bWVyaWMuVC5wcm90b3R5cGUubm9ybTI9bnVtZXJpYy5UdW5vcChcInJldHVybiBudW1lcmljLm5vcm0yKHgueCk7XCIsXCJ2YXIgZiA9IG51bWVyaWMubm9ybTJTcXVhcmVkO1xcbnJldHVybiBNYXRoLnNxcnQoZih4LngpK2YoeC55KSk7XCIpLG51bWVyaWMuVC5wcm90b3R5cGUuaW52PWZ1bmN0aW9uKCl7dmFyIHQ9dGhpcztpZih0eXBlb2YgdC55PT1cInVuZGVmaW5lZFwiKXJldHVybiBuZXcgbnVtZXJpYy5UKG51bWVyaWMuaW52KHQueCkpO3ZhciBuPXQueC5sZW5ndGgscixpLHMsbz1udW1lcmljLmlkZW50aXR5KG4pLHU9bnVtZXJpYy5yZXAoW24sbl0sMCksYT1udW1lcmljLmNsb25lKHQueCksZj1udW1lcmljLmNsb25lKHQueSksbCxjLGgscCxkLHYsbSxnLHIsaSxzLHksYix3LEUsUyx4LFQ7Zm9yKHI9MDtyPG47cisrKXt3PWFbcl1bcl0sRT1mW3JdW3JdLHk9dyp3K0UqRSxzPXI7Zm9yKGk9cisxO2k8bjtpKyspdz1hW2ldW3JdLEU9ZltpXVtyXSxiPXcqdytFKkUsYj55JiYocz1pLHk9Yik7cyE9PXImJihUPWFbcl0sYVtyXT1hW3NdLGFbc109VCxUPWZbcl0sZltyXT1mW3NdLGZbc109VCxUPW9bcl0sb1tyXT1vW3NdLG9bc109VCxUPXVbcl0sdVtyXT11W3NdLHVbc109VCksbD1hW3JdLGM9ZltyXSxkPW9bcl0sdj11W3JdLHc9bFtyXSxFPWNbcl07Zm9yKGk9cisxO2k8bjtpKyspUz1sW2ldLHg9Y1tpXSxsW2ldPShTKncreCpFKS95LGNbaV09KHgqdy1TKkUpL3k7Zm9yKGk9MDtpPG47aSsrKVM9ZFtpXSx4PXZbaV0sZFtpXT0oUyp3K3gqRSkveSx2W2ldPSh4KnctUypFKS95O2ZvcihpPXIrMTtpPG47aSsrKXtoPWFbaV0scD1mW2ldLG09b1tpXSxnPXVbaV0sdz1oW3JdLEU9cFtyXTtmb3Iocz1yKzE7czxuO3MrKylTPWxbc10seD1jW3NdLGhbc10tPVMqdy14KkUscFtzXS09eCp3K1MqRTtmb3Iocz0wO3M8bjtzKyspUz1kW3NdLHg9dltzXSxtW3NdLT1TKncteCpFLGdbc10tPXgqdytTKkV9fWZvcihyPW4tMTtyPjA7ci0tKXtkPW9bcl0sdj11W3JdO2ZvcihpPXItMTtpPj0wO2ktLSl7bT1vW2ldLGc9dVtpXSx3PWFbaV1bcl0sRT1mW2ldW3JdO2ZvcihzPW4tMTtzPj0wO3MtLSlTPWRbc10seD12W3NdLG1bc10tPXcqUy1FKngsZ1tzXS09dyp4K0UqU319cmV0dXJuIG5ldyBudW1lcmljLlQobyx1KX0sbnVtZXJpYy5ULnByb3RvdHlwZS5nZXQ9ZnVuY3Rpb24odCl7dmFyIG49dGhpcy54LHI9dGhpcy55LGk9MCxzLG89dC5sZW5ndGg7aWYocil7d2hpbGUoaTxvKXM9dFtpXSxuPW5bc10scj1yW3NdLGkrKztyZXR1cm4gbmV3IG51bWVyaWMuVChuLHIpfXdoaWxlKGk8bylzPXRbaV0sbj1uW3NdLGkrKztyZXR1cm4gbmV3IG51bWVyaWMuVChuKX0sbnVtZXJpYy5ULnByb3RvdHlwZS5zZXQ9ZnVuY3Rpb24odCxuKXt2YXIgcj10aGlzLngsaT10aGlzLnkscz0wLG8sdT10Lmxlbmd0aCxhPW4ueCxmPW4ueTtpZih1PT09MClyZXR1cm4gZj90aGlzLnk9ZjppJiYodGhpcy55PXVuZGVmaW5lZCksdGhpcy54PXIsdGhpcztpZihmKXtpfHwoaT1udW1lcmljLnJlcChudW1lcmljLmRpbShyKSwwKSx0aGlzLnk9aSk7d2hpbGUoczx1LTEpbz10W3NdLHI9cltvXSxpPWlbb10scysrO3JldHVybiBvPXRbc10scltvXT1hLGlbb109Zix0aGlzfWlmKGkpe3doaWxlKHM8dS0xKW89dFtzXSxyPXJbb10saT1pW29dLHMrKztyZXR1cm4gbz10W3NdLHJbb109YSxhIGluc3RhbmNlb2YgQXJyYXk/aVtvXT1udW1lcmljLnJlcChudW1lcmljLmRpbShhKSwwKTppW29dPTAsdGhpc313aGlsZShzPHUtMSlvPXRbc10scj1yW29dLHMrKztyZXR1cm4gbz10W3NdLHJbb109YSx0aGlzfSxudW1lcmljLlQucHJvdG90eXBlLmdldFJvd3M9ZnVuY3Rpb24odCxuKXt2YXIgcj1uLXQrMSxpLHM9QXJyYXkociksbyx1PXRoaXMueCxhPXRoaXMueTtmb3IoaT10O2k8PW47aSsrKXNbaS10XT11W2ldO2lmKGEpe289QXJyYXkocik7Zm9yKGk9dDtpPD1uO2krKylvW2ktdF09YVtpXTtyZXR1cm4gbmV3IG51bWVyaWMuVChzLG8pfXJldHVybiBuZXcgbnVtZXJpYy5UKHMpfSxudW1lcmljLlQucHJvdG90eXBlLnNldFJvd3M9ZnVuY3Rpb24odCxuLHIpe3ZhciBpLHM9dGhpcy54LG89dGhpcy55LHU9ci54LGE9ci55O2ZvcihpPXQ7aTw9bjtpKyspc1tpXT11W2ktdF07aWYoYSl7b3x8KG89bnVtZXJpYy5yZXAobnVtZXJpYy5kaW0ocyksMCksdGhpcy55PW8pO2ZvcihpPXQ7aTw9bjtpKyspb1tpXT1hW2ktdF19ZWxzZSBpZihvKWZvcihpPXQ7aTw9bjtpKyspb1tpXT1udW1lcmljLnJlcChbdVtpLXRdLmxlbmd0aF0sMCk7cmV0dXJuIHRoaXN9LG51bWVyaWMuVC5wcm90b3R5cGUuZ2V0Um93PWZ1bmN0aW9uKHQpe3ZhciBuPXRoaXMueCxyPXRoaXMueTtyZXR1cm4gcj9uZXcgbnVtZXJpYy5UKG5bdF0sclt0XSk6bmV3IG51bWVyaWMuVChuW3RdKX0sbnVtZXJpYy5ULnByb3RvdHlwZS5zZXRSb3c9ZnVuY3Rpb24odCxuKXt2YXIgcj10aGlzLngsaT10aGlzLnkscz1uLngsbz1uLnk7cmV0dXJuIHJbdF09cyxvPyhpfHwoaT1udW1lcmljLnJlcChudW1lcmljLmRpbShyKSwwKSx0aGlzLnk9aSksaVt0XT1vKTppJiYoaT1udW1lcmljLnJlcChbcy5sZW5ndGhdLDApKSx0aGlzfSxudW1lcmljLlQucHJvdG90eXBlLmdldEJsb2NrPWZ1bmN0aW9uKHQsbil7dmFyIHI9dGhpcy54LGk9dGhpcy55LHM9bnVtZXJpYy5nZXRCbG9jaztyZXR1cm4gaT9uZXcgbnVtZXJpYy5UKHMocix0LG4pLHMoaSx0LG4pKTpuZXcgbnVtZXJpYy5UKHMocix0LG4pKX0sbnVtZXJpYy5ULnByb3RvdHlwZS5zZXRCbG9jaz1mdW5jdGlvbih0LG4scil7ciBpbnN0YW5jZW9mIG51bWVyaWMuVHx8KHI9bmV3IG51bWVyaWMuVChyKSk7dmFyIGk9dGhpcy54LHM9dGhpcy55LG89bnVtZXJpYy5zZXRCbG9jayx1PXIueCxhPXIueTtpZihhKXJldHVybiBzfHwodGhpcy55PW51bWVyaWMucmVwKG51bWVyaWMuZGltKHRoaXMpLDApLHM9dGhpcy55KSxvKGksdCxuLHUpLG8ocyx0LG4sYSksdGhpcztvKGksdCxuLHUpLHMmJm8ocyx0LG4sbnVtZXJpYy5yZXAobnVtZXJpYy5kaW0odSksMCkpfSxudW1lcmljLlQucmVwPWZ1bmN0aW9uKHQsbil7dmFyIHI9bnVtZXJpYy5UO24gaW5zdGFuY2VvZiByfHwobj1uZXcgcihuKSk7dmFyIGk9bi54LHM9bi55LG89bnVtZXJpYy5yZXA7cmV0dXJuIHM/bmV3IHIobyh0LGkpLG8odCxzKSk6bmV3IHIobyh0LGkpKX0sbnVtZXJpYy5ULmRpYWc9ZnVuY3Rpb24gZGlhZyhlKXtlIGluc3RhbmNlb2YgbnVtZXJpYy5UfHwoZT1uZXcgbnVtZXJpYy5UKGUpKTt2YXIgdD1lLngsbj1lLnksZGlhZz1udW1lcmljLmRpYWc7cmV0dXJuIG4/bmV3IG51bWVyaWMuVChkaWFnKHQpLGRpYWcobikpOm5ldyBudW1lcmljLlQoZGlhZyh0KSl9LG51bWVyaWMuVC5laWc9ZnVuY3Rpb24oKXtpZih0aGlzLnkpdGhyb3cgbmV3IEVycm9yKFwiZWlnOiBub3QgaW1wbGVtZW50ZWQgZm9yIGNvbXBsZXggbWF0cmljZXMuXCIpO3JldHVybiBudW1lcmljLmVpZyh0aGlzLngpfSxudW1lcmljLlQuaWRlbnRpdHk9ZnVuY3Rpb24odCl7cmV0dXJuIG5ldyBudW1lcmljLlQobnVtZXJpYy5pZGVudGl0eSh0KSl9LG51bWVyaWMuVC5wcm90b3R5cGUuZ2V0RGlhZz1mdW5jdGlvbigpe3ZhciB0PW51bWVyaWMsbj10aGlzLngscj10aGlzLnk7cmV0dXJuIHI/bmV3IHQuVCh0LmdldERpYWcobiksdC5nZXREaWFnKHIpKTpuZXcgdC5UKHQuZ2V0RGlhZyhuKSl9LG51bWVyaWMuaG91c2U9ZnVuY3Rpb24odCl7dmFyIG49bnVtZXJpYy5jbG9uZSh0KSxyPXRbMF0+PTA/MTotMSxpPXIqbnVtZXJpYy5ub3JtMih0KTtuWzBdKz1pO3ZhciBzPW51bWVyaWMubm9ybTIobik7aWYocz09PTApdGhyb3cgbmV3IEVycm9yKFwiZWlnOiBpbnRlcm5hbCBlcnJvclwiKTtyZXR1cm4gbnVtZXJpYy5kaXYobixzKX0sbnVtZXJpYy50b1VwcGVySGVzc2VuYmVyZz1mdW5jdGlvbih0KXt2YXIgbj1udW1lcmljLmRpbSh0KTtpZihuLmxlbmd0aCE9PTJ8fG5bMF0hPT1uWzFdKXRocm93IG5ldyBFcnJvcihcIm51bWVyaWM6IHRvVXBwZXJIZXNzZW5iZXJnKCkgb25seSB3b3JrcyBvbiBzcXVhcmUgbWF0cmljZXNcIik7dmFyIHI9blswXSxpLHMsbyx1LGEsZj1udW1lcmljLmNsb25lKHQpLGwsYyxoLHAsZD1udW1lcmljLmlkZW50aXR5KHIpLHY7Zm9yKHM9MDtzPHItMjtzKyspe3U9QXJyYXkoci1zLTEpO2ZvcihpPXMrMTtpPHI7aSsrKXVbaS1zLTFdPWZbaV1bc107aWYobnVtZXJpYy5ub3JtMih1KT4wKXthPW51bWVyaWMuaG91c2UodSksbD1udW1lcmljLmdldEJsb2NrKGYsW3MrMSxzXSxbci0xLHItMV0pLGM9bnVtZXJpYy50ZW5zb3IoYSxudW1lcmljLmRvdChhLGwpKTtmb3IoaT1zKzE7aTxyO2krKyl7aD1mW2ldLHA9Y1tpLXMtMV07Zm9yKG89cztvPHI7bysrKWhbb10tPTIqcFtvLXNdfWw9bnVtZXJpYy5nZXRCbG9jayhmLFswLHMrMV0sW3ItMSxyLTFdKSxjPW51bWVyaWMudGVuc29yKG51bWVyaWMuZG90KGwsYSksYSk7Zm9yKGk9MDtpPHI7aSsrKXtoPWZbaV0scD1jW2ldO2ZvcihvPXMrMTtvPHI7bysrKWhbb10tPTIqcFtvLXMtMV19bD1BcnJheShyLXMtMSk7Zm9yKGk9cysxO2k8cjtpKyspbFtpLXMtMV09ZFtpXTtjPW51bWVyaWMudGVuc29yKGEsbnVtZXJpYy5kb3QoYSxsKSk7Zm9yKGk9cysxO2k8cjtpKyspe3Y9ZFtpXSxwPWNbaS1zLTFdO2ZvcihvPTA7bzxyO28rKyl2W29dLT0yKnBbb119fX1yZXR1cm57SDpmLFE6ZH19LG51bWVyaWMuZXBzaWxvbj0yLjIyMDQ0NjA0OTI1MDMxM2UtMTYsbnVtZXJpYy5RUkZyYW5jaXM9ZnVuY3Rpb24oZSx0KXt0eXBlb2YgdD09XCJ1bmRlZmluZWRcIiYmKHQ9MWU0KSxlPW51bWVyaWMuY2xvbmUoZSk7dmFyIG49bnVtZXJpYy5jbG9uZShlKSxyPW51bWVyaWMuZGltKGUpLGk9clswXSxzLG8sdSxhLGYsbCxjLGgscCxkPW51bWVyaWMuaWRlbnRpdHkoaSksdixtLGcseSxiLHcsRSxTLHg7aWYoaTwzKXJldHVybntROmQsQjpbWzAsaS0xXV19O3ZhciBUPW51bWVyaWMuZXBzaWxvbjtmb3IoeD0wO3g8dDt4Kyspe2ZvcihFPTA7RTxpLTE7RSsrKWlmKE1hdGguYWJzKGVbRSsxXVtFXSk8VCooTWF0aC5hYnMoZVtFXVtFXSkrTWF0aC5hYnMoZVtFKzFdW0UrMV0pKSl7dmFyIE49bnVtZXJpYy5RUkZyYW5jaXMobnVtZXJpYy5nZXRCbG9jayhlLFswLDBdLFtFLEVdKSx0KSxDPW51bWVyaWMuUVJGcmFuY2lzKG51bWVyaWMuZ2V0QmxvY2soZSxbRSsxLEUrMV0sW2ktMSxpLTFdKSx0KTtnPUFycmF5KEUrMSk7Zm9yKHc9MDt3PD1FO3crKylnW3ddPWRbd107eT1udW1lcmljLmRvdChOLlEsZyk7Zm9yKHc9MDt3PD1FO3crKylkW3ddPXlbd107Zz1BcnJheShpLUUtMSk7Zm9yKHc9RSsxO3c8aTt3KyspZ1t3LUUtMV09ZFt3XTt5PW51bWVyaWMuZG90KEMuUSxnKTtmb3Iodz1FKzE7dzxpO3crKylkW3ddPXlbdy1FLTFdO3JldHVybntROmQsQjpOLkIuY29uY2F0KG51bWVyaWMuYWRkKEMuQixFKzEpKX19dT1lW2ktMl1baS0yXSxhPWVbaS0yXVtpLTFdLGY9ZVtpLTFdW2ktMl0sbD1lW2ktMV1baS0xXSxoPXUrbCxjPXUqbC1hKmYscD1udW1lcmljLmdldEJsb2NrKGUsWzAsMF0sWzIsMl0pO2lmKGgqaD49NCpjKXt2YXIgayxMO2s9LjUqKGgrTWF0aC5zcXJ0KGgqaC00KmMpKSxMPS41KihoLU1hdGguc3FydChoKmgtNCpjKSkscD1udW1lcmljLmFkZChudW1lcmljLnN1YihudW1lcmljLmRvdChwLHApLG51bWVyaWMubXVsKHAsaytMKSksbnVtZXJpYy5kaWFnKG51bWVyaWMucmVwKFszXSxrKkwpKSl9ZWxzZSBwPW51bWVyaWMuYWRkKG51bWVyaWMuc3ViKG51bWVyaWMuZG90KHAscCksbnVtZXJpYy5tdWwocCxoKSksbnVtZXJpYy5kaWFnKG51bWVyaWMucmVwKFszXSxjKSkpO3M9W3BbMF1bMF0scFsxXVswXSxwWzJdWzBdXSxvPW51bWVyaWMuaG91c2UocyksZz1bZVswXSxlWzFdLGVbMl1dLHk9bnVtZXJpYy50ZW5zb3IobyxudW1lcmljLmRvdChvLGcpKTtmb3Iodz0wO3c8Mzt3Kyspe209ZVt3XSxiPXlbd107Zm9yKFM9MDtTPGk7UysrKW1bU10tPTIqYltTXX1nPW51bWVyaWMuZ2V0QmxvY2soZSxbMCwwXSxbaS0xLDJdKSx5PW51bWVyaWMudGVuc29yKG51bWVyaWMuZG90KGcsbyksbyk7Zm9yKHc9MDt3PGk7dysrKXttPWVbd10sYj15W3ddO2ZvcihTPTA7UzwzO1MrKyltW1NdLT0yKmJbU119Zz1bZFswXSxkWzFdLGRbMl1dLHk9bnVtZXJpYy50ZW5zb3IobyxudW1lcmljLmRvdChvLGcpKTtmb3Iodz0wO3c8Mzt3Kyspe3Y9ZFt3XSxiPXlbd107Zm9yKFM9MDtTPGk7UysrKXZbU10tPTIqYltTXX12YXIgQTtmb3IoRT0wO0U8aS0yO0UrKyl7Zm9yKFM9RTtTPD1FKzE7UysrKWlmKE1hdGguYWJzKGVbUysxXVtTXSk8VCooTWF0aC5hYnMoZVtTXVtTXSkrTWF0aC5hYnMoZVtTKzFdW1MrMV0pKSl7dmFyIE49bnVtZXJpYy5RUkZyYW5jaXMobnVtZXJpYy5nZXRCbG9jayhlLFswLDBdLFtTLFNdKSx0KSxDPW51bWVyaWMuUVJGcmFuY2lzKG51bWVyaWMuZ2V0QmxvY2soZSxbUysxLFMrMV0sW2ktMSxpLTFdKSx0KTtnPUFycmF5KFMrMSk7Zm9yKHc9MDt3PD1TO3crKylnW3ddPWRbd107eT1udW1lcmljLmRvdChOLlEsZyk7Zm9yKHc9MDt3PD1TO3crKylkW3ddPXlbd107Zz1BcnJheShpLVMtMSk7Zm9yKHc9UysxO3c8aTt3KyspZ1t3LVMtMV09ZFt3XTt5PW51bWVyaWMuZG90KEMuUSxnKTtmb3Iodz1TKzE7dzxpO3crKylkW3ddPXlbdy1TLTFdO3JldHVybntROmQsQjpOLkIuY29uY2F0KG51bWVyaWMuYWRkKEMuQixTKzEpKX19QT1NYXRoLm1pbihpLTEsRSszKSxzPUFycmF5KEEtRSk7Zm9yKHc9RSsxO3c8PUE7dysrKXNbdy1FLTFdPWVbd11bRV07bz1udW1lcmljLmhvdXNlKHMpLGc9bnVtZXJpYy5nZXRCbG9jayhlLFtFKzEsRV0sW0EsaS0xXSkseT1udW1lcmljLnRlbnNvcihvLG51bWVyaWMuZG90KG8sZykpO2Zvcih3PUUrMTt3PD1BO3crKyl7bT1lW3ddLGI9eVt3LUUtMV07Zm9yKFM9RTtTPGk7UysrKW1bU10tPTIqYltTLUVdfWc9bnVtZXJpYy5nZXRCbG9jayhlLFswLEUrMV0sW2ktMSxBXSkseT1udW1lcmljLnRlbnNvcihudW1lcmljLmRvdChnLG8pLG8pO2Zvcih3PTA7dzxpO3crKyl7bT1lW3ddLGI9eVt3XTtmb3IoUz1FKzE7Uzw9QTtTKyspbVtTXS09MipiW1MtRS0xXX1nPUFycmF5KEEtRSk7Zm9yKHc9RSsxO3c8PUE7dysrKWdbdy1FLTFdPWRbd107eT1udW1lcmljLnRlbnNvcihvLG51bWVyaWMuZG90KG8sZykpO2Zvcih3PUUrMTt3PD1BO3crKyl7dj1kW3ddLGI9eVt3LUUtMV07Zm9yKFM9MDtTPGk7UysrKXZbU10tPTIqYltTXX19fXRocm93IG5ldyBFcnJvcihcIm51bWVyaWM6IGVpZ2VudmFsdWUgaXRlcmF0aW9uIGRvZXMgbm90IGNvbnZlcmdlIC0tIGluY3JlYXNlIG1heGl0ZXI/XCIpfSxudW1lcmljLmVpZz1mdW5jdGlvbih0LG4pe3ZhciByPW51bWVyaWMudG9VcHBlckhlc3NlbmJlcmcodCksaT1udW1lcmljLlFSRnJhbmNpcyhyLkgsbikscz1udW1lcmljLlQsbz10Lmxlbmd0aCx1LGEsZj0hMSxsPWkuQixjPW51bWVyaWMuZG90KGkuUSxudW1lcmljLmRvdChyLkgsbnVtZXJpYy50cmFuc3Bvc2UoaS5RKSkpLGg9bmV3IHMobnVtZXJpYy5kb3QoaS5RLHIuUSkpLHAsZD1sLmxlbmd0aCx2LG0sZyx5LGIsdyxFLFMseCxULE4sQyxrLEwsQT1NYXRoLnNxcnQ7Zm9yKGE9MDthPGQ7YSsrKXt1PWxbYV1bMF07aWYodSE9PWxbYV1bMV0pe3Y9dSsxLG09Y1t1XVt1XSxnPWNbdV1bdl0seT1jW3ZdW3VdLGI9Y1t2XVt2XTtpZihnPT09MCYmeT09PTApY29udGludWU7dz0tbS1iLEU9bSpiLWcqeSxTPXcqdy00KkUsUz49MD8odzwwP3g9LTAuNSoody1BKFMpKTp4PS0wLjUqKHcrQShTKSksaz0obS14KSoobS14KStnKmcsTD15KnkrKGIteCkqKGIteCksaz5MPyhrPUEoayksTj0obS14KS9rLEM9Zy9rKTooTD1BKEwpLE49eS9MLEM9KGIteCkvTCkscD1uZXcgcyhbW0MsLU5dLFtOLENdXSksaC5zZXRSb3dzKHUsdixwLmRvdChoLmdldFJvd3ModSx2KSkpKTooeD0tMC41KncsVD0uNSpBKC1TKSxrPShtLXgpKihtLXgpK2cqZyxMPXkqeSsoYi14KSooYi14KSxrPkw/KGs9QShrK1QqVCksTj0obS14KS9rLEM9Zy9rLHg9MCxULz1rKTooTD1BKEwrVCpUKSxOPXkvTCxDPShiLXgpL0wseD1UL0wsVD0wKSxwPW5ldyBzKFtbQywtTl0sW04sQ11dLFtbeCxcblRdLFtULC14XV0pLGguc2V0Um93cyh1LHYscC5kb3QoaC5nZXRSb3dzKHUsdikpKSl9fXZhciBPPWguZG90KHQpLmRvdChoLnRyYW5zanVnYXRlKCkpLG89dC5sZW5ndGgsTT1udW1lcmljLlQuaWRlbnRpdHkobyk7Zm9yKHY9MDt2PG87disrKWlmKHY+MClmb3IoYT12LTE7YT49MDthLS0pe3ZhciBfPU8uZ2V0KFthLGFdKSxEPU8uZ2V0KFt2LHZdKTtpZighbnVtZXJpYy5uZXEoXy54LEQueCkmJiFudW1lcmljLm5lcShfLnksRC55KSl7TS5zZXRSb3codixNLmdldFJvdyhhKSk7Y29udGludWV9eD1PLmdldFJvdyhhKS5nZXRCbG9jayhbYV0sW3YtMV0pLFQ9TS5nZXRSb3codikuZ2V0QmxvY2soW2FdLFt2LTFdKSxNLnNldChbdixhXSxPLmdldChbYSx2XSkubmVnKCkuc3ViKHguZG90KFQpKS5kaXYoXy5zdWIoRCkpKX1mb3Iodj0wO3Y8bzt2KyspeD1NLmdldFJvdyh2KSxNLnNldFJvdyh2LHguZGl2KHgubm9ybTIoKSkpO3JldHVybiBNPU0udHJhbnNwb3NlKCksTT1oLnRyYW5zanVnYXRlKCkuZG90KE0pLHtsYW1iZGE6Ty5nZXREaWFnKCksRTpNfX0sbnVtZXJpYy5jY3NTcGFyc2U9ZnVuY3Rpb24odCl7dmFyIG49dC5sZW5ndGgscixpLHMsbyx1PVtdO2ZvcihzPW4tMTtzIT09LTE7LS1zKXtpPXRbc107Zm9yKG8gaW4gaSl7bz1wYXJzZUludChvKTt3aGlsZShvPj11Lmxlbmd0aCl1W3UubGVuZ3RoXT0wO2lbb10hPT0wJiZ1W29dKyt9fXZhciByPXUubGVuZ3RoLGE9QXJyYXkocisxKTthWzBdPTA7Zm9yKHM9MDtzPHI7KytzKWFbcysxXT1hW3NdK3Vbc107dmFyIGY9QXJyYXkoYVtyXSksbD1BcnJheShhW3JdKTtmb3Iocz1uLTE7cyE9PS0xOy0tcyl7aT10W3NdO2ZvcihvIGluIGkpaVtvXSE9PTAmJih1W29dLS0sZlthW29dK3Vbb11dPXMsbFthW29dK3Vbb11dPWlbb10pfXJldHVyblthLGYsbF19LG51bWVyaWMuY2NzRnVsbD1mdW5jdGlvbih0KXt2YXIgbj10WzBdLHI9dFsxXSxpPXRbMl0scz1udW1lcmljLmNjc0RpbSh0KSxvPXNbMF0sdT1zWzFdLGEsZixsLGMsaCxwPW51bWVyaWMucmVwKFtvLHVdLDApO2ZvcihhPTA7YTx1O2ErKyl7bD1uW2FdLGM9blthKzFdO2ZvcihmPWw7ZjxjOysrZilwW3JbZl1dW2FdPWlbZl19cmV0dXJuIHB9LG51bWVyaWMuY2NzVFNvbHZlPWZ1bmN0aW9uKHQsbixyLGkscyl7ZnVuY3Rpb24gaChlKXt2YXIgdDtpZihyW2VdIT09MClyZXR1cm47cltlXT0xO2Zvcih0PW9bZV07dDxvW2UrMV07Kyt0KWgodVt0XSk7c1tjXT1lLCsrY312YXIgbz10WzBdLHU9dFsxXSxhPXRbMl0sZj1vLmxlbmd0aC0xLGw9TWF0aC5tYXgsYz0wO3R5cGVvZiBpPT1cInVuZGVmaW5lZFwiJiYocj1udW1lcmljLnJlcChbZl0sMCkpLHR5cGVvZiBpPT1cInVuZGVmaW5lZFwiJiYoaT1udW1lcmljLmxpbnNwYWNlKDAsci5sZW5ndGgtMSkpLHR5cGVvZiBzPT1cInVuZGVmaW5lZFwiJiYocz1bXSk7dmFyIHAsZCx2LG0sZyx5LGIsdyxFO2ZvcihwPWkubGVuZ3RoLTE7cCE9PS0xOy0tcCloKGlbcF0pO3MubGVuZ3RoPWM7Zm9yKHA9cy5sZW5ndGgtMTtwIT09LTE7LS1wKXJbc1twXV09MDtmb3IocD1pLmxlbmd0aC0xO3AhPT0tMTstLXApZD1pW3BdLHJbZF09bltkXTtmb3IocD1zLmxlbmd0aC0xO3AhPT0tMTstLXApe2Q9c1twXSx2PW9bZF0sbT1sKG9bZCsxXSx2KTtmb3IoZz12O2chPT1tOysrZylpZih1W2ddPT09ZCl7cltkXS89YVtnXTticmVha31FPXJbZF07Zm9yKGc9djtnIT09bTsrK2cpeT11W2ddLHkhPT1kJiYoclt5XS09RSphW2ddKX1yZXR1cm4gcn0sbnVtZXJpYy5jY3NERlM9ZnVuY3Rpb24odCl7dGhpcy5rPUFycmF5KHQpLHRoaXMuazE9QXJyYXkodCksdGhpcy5qPUFycmF5KHQpfSxudW1lcmljLmNjc0RGUy5wcm90b3R5cGUuZGZzPWZ1bmN0aW9uKHQsbixyLGkscyxvKXt2YXIgdT0wLGEsZj1zLmxlbmd0aCxsPXRoaXMuayxjPXRoaXMuazEsaD10aGlzLmoscCxkO2lmKGlbdF0hPT0wKXJldHVybjtpW3RdPTEsaFswXT10LGxbMF09cD1uW3RdLGNbMF09ZD1uW3QrMV07Zm9yKDs7KWlmKHA+PWQpe3NbZl09aFt1XTtpZih1PT09MClyZXR1cm47KytmLC0tdSxwPWxbdV0sZD1jW3VdfWVsc2UgYT1vW3JbcF1dLGlbYV09PT0wPyhpW2FdPTEsbFt1XT1wLCsrdSxoW3VdPWEscD1uW2FdLGNbdV09ZD1uW2ErMV0pOisrcH0sbnVtZXJpYy5jY3NMUFNvbHZlPWZ1bmN0aW9uKHQsbixyLGkscyxvLHUpe3ZhciBhPXRbMF0sZj10WzFdLGw9dFsyXSxjPWEubGVuZ3RoLTEsaD0wLHA9blswXSxkPW5bMV0sdj1uWzJdLG0sZyx5LGIsdyxFLFMseCxULE4sQyxrO2c9cFtzXSx5PXBbcysxXSxpLmxlbmd0aD0wO2ZvcihtPWc7bTx5OysrbSl1LmRmcyhvW2RbbV1dLGEsZixyLGksbyk7Zm9yKG09aS5sZW5ndGgtMTttIT09LTE7LS1tKXJbaVttXV09MDtmb3IobT1nO20hPT15OysrbSliPW9bZFttXV0scltiXT12W21dO2ZvcihtPWkubGVuZ3RoLTE7bSE9PS0xOy0tbSl7Yj1pW21dLEU9YVtiXSxTPWFbYisxXTtmb3IoeD1FO3g8UzsrK3gpaWYob1tmW3hdXT09PWIpe3JbYl0vPWxbeF07YnJlYWt9az1yW2JdO2Zvcih4PUU7eDxTOysreClUPW9bZlt4XV0sVCE9PWImJihyW1RdLT1rKmxbeF0pfXJldHVybiByfSxudW1lcmljLmNjc0xVUDE9ZnVuY3Rpb24odCxuKXt2YXIgcj10WzBdLmxlbmd0aC0xLGk9W251bWVyaWMucmVwKFtyKzFdLDApLFtdLFtdXSxzPVtudW1lcmljLnJlcChbcisxXSwwKSxbXSxbXV0sbz1pWzBdLHU9aVsxXSxhPWlbMl0sZj1zWzBdLGw9c1sxXSxjPXNbMl0saD1udW1lcmljLnJlcChbcl0sMCkscD1udW1lcmljLnJlcChbcl0sMCksZCx2LG0sZyx5LGIsdyxFLFMseCxUPW51bWVyaWMuY2NzTFBTb2x2ZSxOPU1hdGgubWF4LEM9TWF0aC5hYnMsaz1udW1lcmljLmxpbnNwYWNlKDAsci0xKSxMPW51bWVyaWMubGluc3BhY2UoMCxyLTEpLEE9bmV3IG51bWVyaWMuY2NzREZTKHIpO3R5cGVvZiBuPT1cInVuZGVmaW5lZFwiJiYobj0xKTtmb3IoZD0wO2Q8cjsrK2Qpe1QoaSx0LGgscCxkLEwsQSksYj0tMSx3PS0xO2Zvcih2PXAubGVuZ3RoLTE7diE9PS0xOy0tdil7bT1wW3ZdO2lmKG08PWQpY29udGludWU7RT1DKGhbbV0pLEU+YiYmKHc9bSxiPUUpfUMoaFtkXSk8bipiJiYodj1rW2RdLGI9a1t3XSxrW2RdPWIsTFtiXT1kLGtbd109dixMW3ZdPXcsYj1oW2RdLGhbZF09aFt3XSxoW3ddPWIpLGI9b1tkXSx3PWZbZF0sUz1oW2RdLHVbYl09a1tkXSxhW2JdPTEsKytiO2Zvcih2PXAubGVuZ3RoLTE7diE9PS0xOy0tdiltPXBbdl0sRT1oW21dLHBbdl09MCxoW21dPTAsbTw9ZD8obFt3XT1tLGNbd109RSwrK3cpOih1W2JdPWtbbV0sYVtiXT1FL1MsKytiKTtvW2QrMV09YixmW2QrMV09d31mb3Iodj11Lmxlbmd0aC0xO3YhPT0tMTstLXYpdVt2XT1MW3Vbdl1dO3JldHVybntMOmksVTpzLFA6ayxQaW52Okx9fSxudW1lcmljLmNjc0RGUzA9ZnVuY3Rpb24odCl7dGhpcy5rPUFycmF5KHQpLHRoaXMuazE9QXJyYXkodCksdGhpcy5qPUFycmF5KHQpfSxudW1lcmljLmNjc0RGUzAucHJvdG90eXBlLmRmcz1mdW5jdGlvbih0LG4scixpLHMsbyx1KXt2YXIgYT0wLGYsbD1zLmxlbmd0aCxjPXRoaXMuayxoPXRoaXMuazEscD10aGlzLmosZCx2O2lmKGlbdF0hPT0wKXJldHVybjtpW3RdPTEscFswXT10LGNbMF09ZD1uW29bdF1dLGhbMF09dj1uW29bdF0rMV07Zm9yKDs7KXtpZihpc05hTihkKSl0aHJvdyBuZXcgRXJyb3IoXCJPdyFcIik7aWYoZD49dil7c1tsXT1vW3BbYV1dO2lmKGE9PT0wKXJldHVybjsrK2wsLS1hLGQ9Y1thXSx2PWhbYV19ZWxzZSBmPXJbZF0saVtmXT09PTA/KGlbZl09MSxjW2FdPWQsKythLHBbYV09ZixmPW9bZl0sZD1uW2ZdLGhbYV09dj1uW2YrMV0pOisrZH19LG51bWVyaWMuY2NzTFBTb2x2ZTA9ZnVuY3Rpb24odCxuLHIsaSxzLG8sdSxhKXt2YXIgZj10WzBdLGw9dFsxXSxjPXRbMl0saD1mLmxlbmd0aC0xLHA9MCxkPW5bMF0sdj1uWzFdLG09blsyXSxnLHksYix3LEUsUyx4LFQsTixDLGssTDt5PWRbc10sYj1kW3MrMV0saS5sZW5ndGg9MDtmb3IoZz15O2c8YjsrK2cpYS5kZnModltnXSxmLGwscixpLG8sdSk7Zm9yKGc9aS5sZW5ndGgtMTtnIT09LTE7LS1nKXc9aVtnXSxyW3Vbd11dPTA7Zm9yKGc9eTtnIT09YjsrK2cpdz12W2ddLHJbd109bVtnXTtmb3IoZz1pLmxlbmd0aC0xO2chPT0tMTstLWcpe3c9aVtnXSxOPXVbd10sUz1mW3ddLHg9Zlt3KzFdO2ZvcihUPVM7VDx4OysrVClpZihsW1RdPT09Til7cltOXS89Y1tUXTticmVha31MPXJbTl07Zm9yKFQ9UztUPHg7KytUKXJbbFtUXV0tPUwqY1tUXTtyW05dPUx9fSxudW1lcmljLmNjc0xVUDA9ZnVuY3Rpb24odCxuKXt2YXIgcj10WzBdLmxlbmd0aC0xLGk9W251bWVyaWMucmVwKFtyKzFdLDApLFtdLFtdXSxzPVtudW1lcmljLnJlcChbcisxXSwwKSxbXSxbXV0sbz1pWzBdLHU9aVsxXSxhPWlbMl0sZj1zWzBdLGw9c1sxXSxjPXNbMl0saD1udW1lcmljLnJlcChbcl0sMCkscD1udW1lcmljLnJlcChbcl0sMCksZCx2LG0sZyx5LGIsdyxFLFMseCxUPW51bWVyaWMuY2NzTFBTb2x2ZTAsTj1NYXRoLm1heCxDPU1hdGguYWJzLGs9bnVtZXJpYy5saW5zcGFjZSgwLHItMSksTD1udW1lcmljLmxpbnNwYWNlKDAsci0xKSxBPW5ldyBudW1lcmljLmNjc0RGUzAocik7dHlwZW9mIG49PVwidW5kZWZpbmVkXCImJihuPTEpO2ZvcihkPTA7ZDxyOysrZCl7VChpLHQsaCxwLGQsTCxrLEEpLGI9LTEsdz0tMTtmb3Iodj1wLmxlbmd0aC0xO3YhPT0tMTstLXYpe209cFt2XTtpZihtPD1kKWNvbnRpbnVlO0U9QyhoW2tbbV1dKSxFPmImJih3PW0sYj1FKX1DKGhba1tkXV0pPG4qYiYmKHY9a1tkXSxiPWtbd10sa1tkXT1iLExbYl09ZCxrW3ddPXYsTFt2XT13KSxiPW9bZF0sdz1mW2RdLFM9aFtrW2RdXSx1W2JdPWtbZF0sYVtiXT0xLCsrYjtmb3Iodj1wLmxlbmd0aC0xO3YhPT0tMTstLXYpbT1wW3ZdLEU9aFtrW21dXSxwW3ZdPTAsaFtrW21dXT0wLG08PWQ/KGxbd109bSxjW3ddPUUsKyt3KToodVtiXT1rW21dLGFbYl09RS9TLCsrYik7b1tkKzFdPWIsZltkKzFdPXd9Zm9yKHY9dS5sZW5ndGgtMTt2IT09LTE7LS12KXVbdl09TFt1W3ZdXTtyZXR1cm57TDppLFU6cyxQOmssUGludjpMfX0sbnVtZXJpYy5jY3NMVVA9bnVtZXJpYy5jY3NMVVAwLG51bWVyaWMuY2NzRGltPWZ1bmN0aW9uKHQpe3JldHVybltudW1lcmljLnN1cCh0WzFdKSsxLHRbMF0ubGVuZ3RoLTFdfSxudW1lcmljLmNjc0dldEJsb2NrPWZ1bmN0aW9uKHQsbixyKXt2YXIgaT1udW1lcmljLmNjc0RpbSh0KSxzPWlbMF0sbz1pWzFdO3R5cGVvZiBuPT1cInVuZGVmaW5lZFwiP249bnVtZXJpYy5saW5zcGFjZSgwLHMtMSk6dHlwZW9mIG49PVwibnVtYmVyXCImJihuPVtuXSksdHlwZW9mIHI9PVwidW5kZWZpbmVkXCI/cj1udW1lcmljLmxpbnNwYWNlKDAsby0xKTp0eXBlb2Ygcj09XCJudW1iZXJcIiYmKHI9W3JdKTt2YXIgdSxhLGYsbD1uLmxlbmd0aCxjLGg9ci5sZW5ndGgscCxkLHYsbT1udW1lcmljLnJlcChbb10sMCksZz1bXSx5PVtdLGI9W20sZyx5XSx3PXRbMF0sRT10WzFdLFM9dFsyXSx4PW51bWVyaWMucmVwKFtzXSwwKSxUPTAsTj1udW1lcmljLnJlcChbc10sMCk7Zm9yKGM9MDtjPGg7KytjKXtkPXJbY107dmFyIEM9d1tkXSxrPXdbZCsxXTtmb3IodT1DO3U8azsrK3UpcD1FW3VdLE5bcF09MSx4W3BdPVNbdV07Zm9yKHU9MDt1PGw7Kyt1KXY9blt1XSxOW3ZdJiYoZ1tUXT11LHlbVF09eFtuW3VdXSwrK1QpO2Zvcih1PUM7dTxrOysrdSlwPUVbdV0sTltwXT0wO21bYysxXT1UfXJldHVybiBifSxudW1lcmljLmNjc0RvdD1mdW5jdGlvbih0LG4pe3ZhciByPXRbMF0saT10WzFdLHM9dFsyXSxvPW5bMF0sdT1uWzFdLGE9blsyXSxmPW51bWVyaWMuY2NzRGltKHQpLGw9bnVtZXJpYy5jY3NEaW0obiksYz1mWzBdLGg9ZlsxXSxwPWxbMV0sZD1udW1lcmljLnJlcChbY10sMCksdj1udW1lcmljLnJlcChbY10sMCksbT1BcnJheShjKSxnPW51bWVyaWMucmVwKFtwXSwwKSx5PVtdLGI9W10sdz1bZyx5LGJdLEUsUyx4LFQsTixDLGssTCxBLE8sTTtmb3IoeD0wO3ghPT1wOysreCl7VD1vW3hdLE49b1t4KzFdLEE9MDtmb3IoUz1UO1M8TjsrK1Mpe089dVtTXSxNPWFbU10sQz1yW09dLGs9cltPKzFdO2ZvcihFPUM7RTxrOysrRSlMPWlbRV0sdltMXT09PTAmJihtW0FdPUwsdltMXT0xLEErPTEpLGRbTF09ZFtMXStzW0VdKk19VD1nW3hdLE49VCtBLGdbeCsxXT1OO2ZvcihTPUEtMTtTIT09LTE7LS1TKU09VCtTLEU9bVtTXSx5W01dPUUsYltNXT1kW0VdLHZbRV09MCxkW0VdPTA7Z1t4KzFdPWdbeF0rQX1yZXR1cm4gd30sbnVtZXJpYy5jY3NMVVBTb2x2ZT1mdW5jdGlvbih0LG4pe3ZhciByPXQuTCxpPXQuVSxzPXQuUCxvPW5bMF0sdT0hMTt0eXBlb2YgbyE9XCJvYmplY3RcIiYmKG49W1swLG4ubGVuZ3RoXSxudW1lcmljLmxpbnNwYWNlKDAsbi5sZW5ndGgtMSksbl0sbz1uWzBdLHU9ITApO3ZhciBhPW5bMV0sZj1uWzJdLGw9clswXS5sZW5ndGgtMSxjPW8ubGVuZ3RoLTEsaD1udW1lcmljLnJlcChbbF0sMCkscD1BcnJheShsKSxkPW51bWVyaWMucmVwKFtsXSwwKSx2PUFycmF5KGwpLG09bnVtZXJpYy5yZXAoW2MrMV0sMCksZz1bXSx5PVtdLGI9bnVtZXJpYy5jY3NUU29sdmUsdyxFLFMseCxULE4sQz0wO2Zvcih3PTA7dzxjOysrdyl7VD0wLFM9b1t3XSx4PW9bdysxXTtmb3IoRT1TO0U8eDsrK0UpTj10LlBpbnZbYVtFXV0sdltUXT1OLGRbTl09ZltFXSwrK1Q7di5sZW5ndGg9VCxiKHIsZCxoLHYscCk7Zm9yKEU9di5sZW5ndGgtMTtFIT09LTE7LS1FKWRbdltFXV09MDtiKGksaCxkLHAsdik7aWYodSlyZXR1cm4gZDtmb3IoRT1wLmxlbmd0aC0xO0UhPT0tMTstLUUpaFtwW0VdXT0wO2ZvcihFPXYubGVuZ3RoLTE7RSE9PS0xOy0tRSlOPXZbRV0sZ1tDXT1OLHlbQ109ZFtOXSxkW05dPTAsKytDO21bdysxXT1DfXJldHVyblttLGcseV19LG51bWVyaWMuY2NzYmlub3A9ZnVuY3Rpb24odCxuKXtyZXR1cm4gdHlwZW9mIG49PVwidW5kZWZpbmVkXCImJihuPVwiXCIpLEZ1bmN0aW9uKFwiWFwiLFwiWVwiLFwidmFyIFhpID0gWFswXSwgWGogPSBYWzFdLCBYdiA9IFhbMl07XFxudmFyIFlpID0gWVswXSwgWWogPSBZWzFdLCBZdiA9IFlbMl07XFxudmFyIG4gPSBYaS5sZW5ndGgtMSxtID0gTWF0aC5tYXgobnVtZXJpYy5zdXAoWGopLG51bWVyaWMuc3VwKFlqKSkrMTtcXG52YXIgWmkgPSBudW1lcmljLnJlcChbbisxXSwwKSwgWmogPSBbXSwgWnYgPSBbXTtcXG52YXIgeCA9IG51bWVyaWMucmVwKFttXSwwKSx5ID0gbnVtZXJpYy5yZXAoW21dLDApO1xcbnZhciB4ayx5ayx6aztcXG52YXIgaSxqLGowLGoxLGsscD0wO1xcblwiK24rXCJmb3IoaT0wO2k8bjsrK2kpIHtcXG5cIitcIiAgajAgPSBYaVtpXTsgajEgPSBYaVtpKzFdO1xcblwiK1wiICBmb3Ioaj1qMDtqIT09ajE7KytqKSB7XFxuXCIrXCIgICAgayA9IFhqW2pdO1xcblwiK1wiICAgIHhba10gPSAxO1xcblwiK1wiICAgIFpqW3BdID0gaztcXG5cIitcIiAgICArK3A7XFxuXCIrXCIgIH1cXG5cIitcIiAgajAgPSBZaVtpXTsgajEgPSBZaVtpKzFdO1xcblwiK1wiICBmb3Ioaj1qMDtqIT09ajE7KytqKSB7XFxuXCIrXCIgICAgayA9IFlqW2pdO1xcblwiK1wiICAgIHlba10gPSBZdltqXTtcXG5cIitcIiAgICBpZih4W2tdID09PSAwKSB7XFxuXCIrXCIgICAgICBaaltwXSA9IGs7XFxuXCIrXCIgICAgICArK3A7XFxuXCIrXCIgICAgfVxcblwiK1wiICB9XFxuXCIrXCIgIFppW2krMV0gPSBwO1xcblwiK1wiICBqMCA9IFhpW2ldOyBqMSA9IFhpW2krMV07XFxuXCIrXCIgIGZvcihqPWowO2ohPT1qMTsrK2opIHhbWGpbal1dID0gWHZbal07XFxuXCIrXCIgIGowID0gWmlbaV07IGoxID0gWmlbaSsxXTtcXG5cIitcIiAgZm9yKGo9ajA7aiE9PWoxOysraikge1xcblwiK1wiICAgIGsgPSBaaltqXTtcXG5cIitcIiAgICB4ayA9IHhba107XFxuXCIrXCIgICAgeWsgPSB5W2tdO1xcblwiK3QrXCJcXG5cIitcIiAgICBadltqXSA9IHprO1xcblwiK1wiICB9XFxuXCIrXCIgIGowID0gWGlbaV07IGoxID0gWGlbaSsxXTtcXG5cIitcIiAgZm9yKGo9ajA7aiE9PWoxOysraikgeFtYaltqXV0gPSAwO1xcblwiK1wiICBqMCA9IFlpW2ldOyBqMSA9IFlpW2krMV07XFxuXCIrXCIgIGZvcihqPWowO2ohPT1qMTsrK2opIHlbWWpbal1dID0gMDtcXG5cIitcIn1cXG5cIitcInJldHVybiBbWmksWmosWnZdO1wiKX0sZnVuY3Rpb24oKXt2YXIgayxBLEIsQztmb3IoayBpbiBudW1lcmljLm9wczIpaXNGaW5pdGUoZXZhbChcIjFcIitudW1lcmljLm9wczJba10rXCIwXCIpKT9BPVwiW1lbMF0sWVsxXSxudW1lcmljLlwiK2srXCIoWCxZWzJdKV1cIjpBPVwiTmFOXCIsaXNGaW5pdGUoZXZhbChcIjBcIitudW1lcmljLm9wczJba10rXCIxXCIpKT9CPVwiW1hbMF0sWFsxXSxudW1lcmljLlwiK2srXCIoWFsyXSxZKV1cIjpCPVwiTmFOXCIsaXNGaW5pdGUoZXZhbChcIjFcIitudW1lcmljLm9wczJba10rXCIwXCIpKSYmaXNGaW5pdGUoZXZhbChcIjBcIitudW1lcmljLm9wczJba10rXCIxXCIpKT9DPVwibnVtZXJpYy5jY3NcIitrK1wiTU0oWCxZKVwiOkM9XCJOYU5cIixudW1lcmljW1wiY2NzXCIraytcIk1NXCJdPW51bWVyaWMuY2NzYmlub3AoXCJ6ayA9IHhrIFwiK251bWVyaWMub3BzMltrXStcInlrO1wiKSxudW1lcmljW1wiY2NzXCIra109RnVuY3Rpb24oXCJYXCIsXCJZXCIsJ2lmKHR5cGVvZiBYID09PSBcIm51bWJlclwiKSByZXR1cm4gJytBK1wiO1xcblwiKydpZih0eXBlb2YgWSA9PT0gXCJudW1iZXJcIikgcmV0dXJuICcrQitcIjtcXG5cIitcInJldHVybiBcIitDK1wiO1xcblwiKX0oKSxudW1lcmljLmNjc1NjYXR0ZXI9ZnVuY3Rpb24odCl7dmFyIG49dFswXSxyPXRbMV0saT10WzJdLHM9bnVtZXJpYy5zdXAocikrMSxvPW4ubGVuZ3RoLHU9bnVtZXJpYy5yZXAoW3NdLDApLGE9QXJyYXkobyksZj1BcnJheShvKSxsPW51bWVyaWMucmVwKFtzXSwwKSxjO2ZvcihjPTA7YzxvOysrYylsW3JbY11dKys7Zm9yKGM9MDtjPHM7KytjKXVbYysxXT11W2NdK2xbY107dmFyIGg9dS5zbGljZSgwKSxwLGQ7Zm9yKGM9MDtjPG87KytjKWQ9cltjXSxwPWhbZF0sYVtwXT1uW2NdLGZbcF09aVtjXSxoW2RdPWhbZF0rMTtyZXR1cm5bdSxhLGZdfSxudW1lcmljLmNjc0dhdGhlcj1mdW5jdGlvbih0KXt2YXIgbj10WzBdLHI9dFsxXSxpPXRbMl0scz1uLmxlbmd0aC0xLG89ci5sZW5ndGgsdT1BcnJheShvKSxhPUFycmF5KG8pLGY9QXJyYXkobyksbCxjLGgscCxkO2Q9MDtmb3IobD0wO2w8czsrK2wpe2g9bltsXSxwPW5bbCsxXTtmb3IoYz1oO2MhPT1wOysrYylhW2RdPWwsdVtkXT1yW2NdLGZbZF09aVtjXSwrK2R9cmV0dXJuW3UsYSxmXX0sbnVtZXJpYy5zZGltPWZ1bmN0aW9uIGRpbShlLHQsbil7dHlwZW9mIHQ9PVwidW5kZWZpbmVkXCImJih0PVtdKTtpZih0eXBlb2YgZSE9XCJvYmplY3RcIilyZXR1cm4gdDt0eXBlb2Ygbj09XCJ1bmRlZmluZWRcIiYmKG49MCksbiBpbiB0fHwodFtuXT0wKSxlLmxlbmd0aD50W25dJiYodFtuXT1lLmxlbmd0aCk7dmFyIHI7Zm9yKHIgaW4gZSllLmhhc093blByb3BlcnR5KHIpJiZkaW0oZVtyXSx0LG4rMSk7cmV0dXJuIHR9LG51bWVyaWMuc2Nsb25lPWZ1bmN0aW9uIGNsb25lKGUsdCxuKXt0eXBlb2YgdD09XCJ1bmRlZmluZWRcIiYmKHQ9MCksdHlwZW9mIG49PVwidW5kZWZpbmVkXCImJihuPW51bWVyaWMuc2RpbShlKS5sZW5ndGgpO3ZhciByLGk9QXJyYXkoZS5sZW5ndGgpO2lmKHQ9PT1uLTEpe2ZvcihyIGluIGUpZS5oYXNPd25Qcm9wZXJ0eShyKSYmKGlbcl09ZVtyXSk7cmV0dXJuIGl9Zm9yKHIgaW4gZSllLmhhc093blByb3BlcnR5KHIpJiYoaVtyXT1jbG9uZShlW3JdLHQrMSxuKSk7cmV0dXJuIGl9LG51bWVyaWMuc2RpYWc9ZnVuY3Rpb24odCl7dmFyIG49dC5sZW5ndGgscixpPUFycmF5KG4pLHMsbyx1O2ZvcihyPW4tMTtyPj0xO3ItPTIpcz1yLTEsaVtyXT1bXSxpW3JdW3JdPXRbcl0saVtzXT1bXSxpW3NdW3NdPXRbc107cmV0dXJuIHI9PT0wJiYoaVswXT1bXSxpWzBdWzBdPXRbcl0pLGl9LG51bWVyaWMuc2lkZW50aXR5PWZ1bmN0aW9uKHQpe3JldHVybiBudW1lcmljLnNkaWFnKG51bWVyaWMucmVwKFt0XSwxKSl9LG51bWVyaWMuc3RyYW5zcG9zZT1mdW5jdGlvbih0KXt2YXIgbj1bXSxyPXQubGVuZ3RoLGkscyxvO2ZvcihpIGluIHQpe2lmKCF0Lmhhc093blByb3BlcnR5KGkpKWNvbnRpbnVlO289dFtpXTtmb3IocyBpbiBvKXtpZighby5oYXNPd25Qcm9wZXJ0eShzKSljb250aW51ZTt0eXBlb2YgbltzXSE9XCJvYmplY3RcIiYmKG5bc109W10pLG5bc11baV09b1tzXX19cmV0dXJuIG59LG51bWVyaWMuc0xVUD1mdW5jdGlvbih0LG4pe3Rocm93IG5ldyBFcnJvcihcIlRoZSBmdW5jdGlvbiBudW1lcmljLnNMVVAgaGFkIGEgYnVnIGluIGl0IGFuZCBoYXMgYmVlbiByZW1vdmVkLiBQbGVhc2UgdXNlIHRoZSBuZXcgbnVtZXJpYy5jY3NMVVAgZnVuY3Rpb24gaW5zdGVhZC5cIil9LG51bWVyaWMuc2RvdE1NPWZ1bmN0aW9uKHQsbil7dmFyIHI9dC5sZW5ndGgsaT1uLmxlbmd0aCxzPW51bWVyaWMuc3RyYW5zcG9zZShuKSxvPXMubGVuZ3RoLHUsYSxmLGwsYyxoLHA9QXJyYXkociksZDtmb3IoZj1yLTE7Zj49MDtmLS0pe2Q9W10sdT10W2ZdO2ZvcihjPW8tMTtjPj0wO2MtLSl7aD0wLGE9c1tjXTtmb3IobCBpbiB1KXtpZighdS5oYXNPd25Qcm9wZXJ0eShsKSljb250aW51ZTtsIGluIGEmJihoKz11W2xdKmFbbF0pfWgmJihkW2NdPWgpfXBbZl09ZH1yZXR1cm4gcH0sbnVtZXJpYy5zZG90TVY9ZnVuY3Rpb24odCxuKXt2YXIgcj10Lmxlbmd0aCxpLHMsbyx1PUFycmF5KHIpLGE7Zm9yKHM9ci0xO3M+PTA7cy0tKXtpPXRbc10sYT0wO2ZvcihvIGluIGkpe2lmKCFpLmhhc093blByb3BlcnR5KG8pKWNvbnRpbnVlO25bb10mJihhKz1pW29dKm5bb10pfWEmJih1W3NdPWEpfXJldHVybiB1fSxudW1lcmljLnNkb3RWTT1mdW5jdGlvbih0LG4pe3ZhciByLGkscyxvLHU9W10sYTtmb3IociBpbiB0KXtpZighdC5oYXNPd25Qcm9wZXJ0eShyKSljb250aW51ZTtzPW5bcl0sbz10W3JdO2ZvcihpIGluIHMpe2lmKCFzLmhhc093blByb3BlcnR5KGkpKWNvbnRpbnVlO3VbaV18fCh1W2ldPTApLHVbaV0rPW8qc1tpXX19cmV0dXJuIHV9LG51bWVyaWMuc2RvdFZWPWZ1bmN0aW9uKHQsbil7dmFyIHIsaT0wO2ZvcihyIGluIHQpdFtyXSYmbltyXSYmKGkrPXRbcl0qbltyXSk7cmV0dXJuIGl9LG51bWVyaWMuc2RvdD1mdW5jdGlvbih0LG4pe3ZhciByPW51bWVyaWMuc2RpbSh0KS5sZW5ndGgsaT1udW1lcmljLnNkaW0obikubGVuZ3RoLHM9cioxZTMraTtzd2l0Y2gocyl7Y2FzZSAwOnJldHVybiB0Km47Y2FzZSAxMDAxOnJldHVybiBudW1lcmljLnNkb3RWVih0LG4pO2Nhc2UgMjAwMTpyZXR1cm4gbnVtZXJpYy5zZG90TVYodCxuKTtjYXNlIDEwMDI6cmV0dXJuIG51bWVyaWMuc2RvdFZNKHQsbik7Y2FzZSAyMDAyOnJldHVybiBudW1lcmljLnNkb3RNTSh0LG4pO2RlZmF1bHQ6dGhyb3cgbmV3IEVycm9yKFwibnVtZXJpYy5zZG90IG5vdCBpbXBsZW1lbnRlZCBmb3IgdGVuc29ycyBvZiBvcmRlciBcIityK1wiIGFuZCBcIitpKX19LG51bWVyaWMuc3NjYXR0ZXI9ZnVuY3Rpb24odCl7dmFyIG49dFswXS5sZW5ndGgscixpLHMsbz10Lmxlbmd0aCx1PVtdLGE7Zm9yKGk9bi0xO2k+PTA7LS1pKXtpZighdFtvLTFdW2ldKWNvbnRpbnVlO2E9dTtmb3Iocz0wO3M8by0yO3MrKylyPXRbc11baV0sYVtyXXx8KGFbcl09W10pLGE9YVtyXTthW3Rbc11baV1dPXRbcysxXVtpXX1yZXR1cm4gdX0sbnVtZXJpYy5zZ2F0aGVyPWZ1bmN0aW9uIGdhdGhlcihlLHQsbil7dHlwZW9mIHQ9PVwidW5kZWZpbmVkXCImJih0PVtdKSx0eXBlb2Ygbj09XCJ1bmRlZmluZWRcIiYmKG49W10pO3ZhciByLGkscztyPW4ubGVuZ3RoO2ZvcihpIGluIGUpaWYoZS5oYXNPd25Qcm9wZXJ0eShpKSl7bltyXT1wYXJzZUludChpKSxzPWVbaV07aWYodHlwZW9mIHM9PVwibnVtYmVyXCIpe2lmKHMpe2lmKHQubGVuZ3RoPT09MClmb3IoaT1yKzE7aT49MDstLWkpdFtpXT1bXTtmb3IoaT1yO2k+PTA7LS1pKXRbaV0ucHVzaChuW2ldKTt0W3IrMV0ucHVzaChzKX19ZWxzZSBnYXRoZXIocyx0LG4pfXJldHVybiBuLmxlbmd0aD5yJiZuLnBvcCgpLHR9LG51bWVyaWMuY0xVPWZ1bmN0aW9uKHQpe3ZhciBuPXRbMF0scj10WzFdLGk9dFsyXSxzPW4ubGVuZ3RoLG89MCx1LGEsZixsLGMsaDtmb3IodT0wO3U8czt1Kyspblt1XT5vJiYobz1uW3VdKTtvKys7dmFyIHA9QXJyYXkobyksZD1BcnJheShvKSx2PW51bWVyaWMucmVwKFtvXSxJbmZpbml0eSksbT1udW1lcmljLnJlcChbb10sLUluZmluaXR5KSxnLHksYjtmb3IoZj0wO2Y8cztmKyspdT1uW2ZdLGE9cltmXSxhPHZbdV0mJih2W3VdPWEpLGE+bVt1XSYmKG1bdV09YSk7Zm9yKHU9MDt1PG8tMTt1KyspbVt1XT5tW3UrMV0mJihtW3UrMV09bVt1XSk7Zm9yKHU9by0xO3U+PTE7dS0tKXZbdV08dlt1LTFdJiYodlt1LTFdPXZbdV0pO3ZhciB3PTAsRT0wO2Zvcih1PTA7dTxvO3UrKylkW3VdPW51bWVyaWMucmVwKFttW3VdLXZbdV0rMV0sMCkscFt1XT1udW1lcmljLnJlcChbdS12W3VdXSwwKSx3Kz11LXZbdV0rMSxFKz1tW3VdLXUrMTtmb3IoZj0wO2Y8cztmKyspdT1uW2ZdLGRbdV1bcltmXS12W3VdXT1pW2ZdO2Zvcih1PTA7dTxvLTE7dSsrKXtsPXUtdlt1XSxnPWRbdV07Zm9yKGE9dSsxO3ZbYV08PXUmJmE8bzthKyspe2M9dS12W2FdLGg9bVt1XS11LHk9ZFthXSxiPXlbY10vZ1tsXTtpZihiKXtmb3IoZj0xO2Y8PWg7ZisrKXlbZitjXS09YipnW2YrbF07cFthXVt1LXZbYV1dPWJ9fX12YXIgZz1bXSx5PVtdLFM9W10seD1bXSxUPVtdLE49W10scyxDLGs7cz0wLEM9MDtmb3IodT0wO3U8bzt1Kyspe2w9dlt1XSxjPW1bdV0saz1kW3VdO2ZvcihhPXU7YTw9YzthKyspa1thLWxdJiYoZ1tzXT11LHlbc109YSxTW3NdPWtbYS1sXSxzKyspO2s9cFt1XTtmb3IoYT1sO2E8dTthKyspa1thLWxdJiYoeFtDXT11LFRbQ109YSxOW0NdPWtbYS1sXSxDKyspO3hbQ109dSxUW0NdPXUsTltDXT0xLEMrK31yZXR1cm57VTpbZyx5LFNdLEw6W3gsVCxOXX19LG51bWVyaWMuY0xVc29sdmU9ZnVuY3Rpb24odCxuKXt2YXIgcj10LkwsaT10LlUscz1udW1lcmljLmNsb25lKG4pLG89clswXSx1PXJbMV0sYT1yWzJdLGY9aVswXSxsPWlbMV0sYz1pWzJdLGg9Zi5sZW5ndGgscD1vLmxlbmd0aCxkPXMubGVuZ3RoLHYsbSxnO2c9MDtmb3Iodj0wO3Y8ZDt2Kyspe3doaWxlKHVbZ108dilzW3ZdLT1hW2ddKnNbdVtnXV0sZysrO2crK31nPWgtMTtmb3Iodj1kLTE7dj49MDt2LS0pe3doaWxlKGxbZ10+dilzW3ZdLT1jW2ddKnNbbFtnXV0sZy0tO3Nbdl0vPWNbZ10sZy0tfXJldHVybiBzfSxudW1lcmljLmNncmlkPWZ1bmN0aW9uKHQsbil7dHlwZW9mIHQ9PVwibnVtYmVyXCImJih0PVt0LHRdKTt2YXIgcj1udW1lcmljLnJlcCh0LC0xKSxpLHMsbztpZih0eXBlb2YgbiE9XCJmdW5jdGlvblwiKXN3aXRjaChuKXtjYXNlXCJMXCI6bj1mdW5jdGlvbihlLG4pe3JldHVybiBlPj10WzBdLzJ8fG48dFsxXS8yfTticmVhaztkZWZhdWx0Om49ZnVuY3Rpb24oZSx0KXtyZXR1cm4hMH19bz0wO2ZvcihpPTE7aTx0WzBdLTE7aSsrKWZvcihzPTE7czx0WzFdLTE7cysrKW4oaSxzKSYmKHJbaV1bc109byxvKyspO3JldHVybiByfSxudW1lcmljLmNkZWxzcT1mdW5jdGlvbih0KXt2YXIgbj1bWy0xLDBdLFswLC0xXSxbMCwxXSxbMSwwXV0scj1udW1lcmljLmRpbSh0KSxpPXJbMF0scz1yWzFdLG8sdSxhLGYsbCxjPVtdLGg9W10scD1bXTtmb3Iobz0xO288aS0xO28rKylmb3IodT0xO3U8cy0xO3UrKyl7aWYodFtvXVt1XTwwKWNvbnRpbnVlO2ZvcihhPTA7YTw0O2ErKyl7Zj1vK25bYV1bMF0sbD11K25bYV1bMV07aWYodFtmXVtsXTwwKWNvbnRpbnVlO2MucHVzaCh0W29dW3VdKSxoLnB1c2godFtmXVtsXSkscC5wdXNoKC0xKX1jLnB1c2godFtvXVt1XSksaC5wdXNoKHRbb11bdV0pLHAucHVzaCg0KX1yZXR1cm5bYyxoLHBdfSxudW1lcmljLmNkb3RNVj1mdW5jdGlvbih0LG4pe3ZhciByLGk9dFswXSxzPXRbMV0sbz10WzJdLHUsYT1pLmxlbmd0aCxmO2Y9MDtmb3IodT0wO3U8YTt1KyspaVt1XT5mJiYoZj1pW3VdKTtmKysscj1udW1lcmljLnJlcChbZl0sMCk7Zm9yKHU9MDt1PGE7dSsrKXJbaVt1XV0rPW9bdV0qbltzW3VdXTtyZXR1cm4gcn0sbnVtZXJpYy5TcGxpbmU9ZnVuY3Rpb24odCxuLHIsaSxzKXt0aGlzLng9dCx0aGlzLnlsPW4sdGhpcy55cj1yLHRoaXMua2w9aSx0aGlzLmtyPXN9LG51bWVyaWMuU3BsaW5lLnByb3RvdHlwZS5fYXQ9ZnVuY3Rpb24odCxuKXt2YXIgcj10aGlzLngsaT10aGlzLnlsLHM9dGhpcy55cixvPXRoaXMua2wsdT10aGlzLmtyLHQsYSxmLGwsYz1udW1lcmljLmFkZCxoPW51bWVyaWMuc3ViLHA9bnVtZXJpYy5tdWw7YT1oKHAob1tuXSxyW24rMV0tcltuXSksaChzW24rMV0saVtuXSkpLGY9YyhwKHVbbisxXSxyW25dLXJbbisxXSksaChzW24rMV0saVtuXSkpLGw9KHQtcltuXSkvKHJbbisxXS1yW25dKTt2YXIgZD1sKigxLWwpO3JldHVybiBjKGMoYyhwKDEtbCxpW25dKSxwKGwsc1tuKzFdKSkscChhLGQqKDEtbCkpKSxwKGYsZCpsKSl9LG51bWVyaWMuU3BsaW5lLnByb3RvdHlwZS5hdD1mdW5jdGlvbih0KXtpZih0eXBlb2YgdD09XCJudW1iZXJcIil7dmFyIG49dGhpcy54LHI9bi5sZW5ndGgsaSxzLG8sdT1NYXRoLmZsb29yLGEsZixsO2k9MCxzPXItMTt3aGlsZShzLWk+MSlvPXUoKGkrcykvMiksbltvXTw9dD9pPW86cz1vO3JldHVybiB0aGlzLl9hdCh0LGkpfXZhciByPXQubGVuZ3RoLGMsaD1BcnJheShyKTtmb3IoYz1yLTE7YyE9PS0xOy0tYyloW2NdPXRoaXMuYXQodFtjXSk7cmV0dXJuIGh9LG51bWVyaWMuU3BsaW5lLnByb3RvdHlwZS5kaWZmPWZ1bmN0aW9uKCl7dmFyIHQ9dGhpcy54LG49dGhpcy55bCxyPXRoaXMueXIsaT10aGlzLmtsLHM9dGhpcy5rcixvPW4ubGVuZ3RoLHUsYSxmLGw9aSxjPXMsaD1BcnJheShvKSxwPUFycmF5KG8pLGQ9bnVtZXJpYy5hZGQsdj1udW1lcmljLm11bCxtPW51bWVyaWMuZGl2LGc9bnVtZXJpYy5zdWI7Zm9yKHU9by0xO3UhPT0tMTstLXUpYT10W3UrMV0tdFt1XSxmPWcoclt1KzFdLG5bdV0pLGhbdV09bShkKHYoZiw2KSx2KGlbdV0sLTQqYSksdihzW3UrMV0sLTIqYSkpLGEqYSkscFt1KzFdPW0oZCh2KGYsLTYpLHYoaVt1XSwyKmEpLHYoc1t1KzFdLDQqYSkpLGEqYSk7cmV0dXJuIG5ldyBudW1lcmljLlNwbGluZSh0LGwsYyxoLHApfSxudW1lcmljLlNwbGluZS5wcm90b3R5cGUucm9vdHM9ZnVuY3Rpb24oKXtmdW5jdGlvbiB0KGUpe3JldHVybiBlKmV9ZnVuY3Rpb24gbihlLHQsbixyLGkpe3ZhciBzPW4qMi0odC1lKSxvPS1yKjIrKHQtZSksdT0oaSsxKSouNSxhPXUqKDEtdSk7cmV0dXJuKDEtdSkqZSt1KnQrcyphKigxLXUpK28qYSp1fXZhciByPVtdLGk9dGhpcy54LHM9dGhpcy55bCxvPXRoaXMueXIsdT10aGlzLmtsLGE9dGhpcy5rcjt0eXBlb2Ygc1swXT09XCJudW1iZXJcIiYmKHM9W3NdLG89W29dLHU9W3VdLGE9W2FdKTt2YXIgZj1zLmxlbmd0aCxsPWkubGVuZ3RoLTEsYyxoLHAsZCx2LG0sZyx5LGIsdyxyPUFycmF5KGYpLEUsUyx4LFQsTixDLGssTCxBLE8sTSxfLEQsUCxILEIsaixGPU1hdGguc3FydDtmb3IoYz0wO2MhPT1mOysrYyl7Zz1zW2NdLHk9b1tjXSxiPXVbY10sdz1hW2NdLEU9W107Zm9yKGg9MDtoIT09bDtoKyspe2g+MCYmeVtoXSpnW2hdPDAmJkUucHVzaChpW2hdKSxBPWlbaCsxXS1pW2hdLE89aVtoXSxUPWdbaF0sTj15W2grMV0sUz1iW2hdL0EseD13W2grMV0vQSxMPXQoUy14KzMqKFQtTikpKzEyKngqVCxDPXgrMypUKzIqUy0zKk4saz0zKih4K1MrMiooVC1OKSksTDw9MD8oXz1DL2ssXz5pW2hdJiZfPGlbaCsxXT9NPVtpW2hdLF8saVtoKzFdXTpNPVtpW2hdLGlbaCsxXV0pOihfPShDLUYoTCkpL2ssRD0oQytGKEwpKS9rLE09W2lbaF1dLF8+aVtoXSYmXzxpW2grMV0mJk0ucHVzaChfKSxEPmlbaF0mJkQ8aVtoKzFdJiZNLnB1c2goRCksTS5wdXNoKGlbaCsxXSkpLEg9TVswXSxfPXRoaXMuX2F0KEgsaCk7Zm9yKHA9MDtwPE0ubGVuZ3RoLTE7cCsrKXtCPU1bcCsxXSxEPXRoaXMuX2F0KEIsaCk7aWYoXz09PTApe0UucHVzaChIKSxIPUIsXz1EO2NvbnRpbnVlfWlmKEQ9PT0wfHxfKkQ+MCl7SD1CLF89RDtjb250aW51ZX12YXIgST0wO2Zvcig7Oyl7aj0oXypCLUQqSCkvKF8tRCk7aWYoajw9SHx8aj49QilicmVhaztQPXRoaXMuX2F0KGosaCk7aWYoUCpEPjApQj1qLEQ9UCxJPT09LTEmJihfKj0uNSksST0tMTtlbHNle2lmKCEoUCpfPjApKWJyZWFrO0g9aixfPVAsST09PTEmJihEKj0uNSksST0xfX1FLnB1c2goaiksSD1NW3ArMV0sXz10aGlzLl9hdChILGgpfUQ9PT0wJiZFLnB1c2goQil9cltjXT1FfXJldHVybiB0eXBlb2YgdGhpcy55bFswXT09XCJudW1iZXJcIj9yWzBdOnJ9LG51bWVyaWMuc3BsaW5lPWZ1bmN0aW9uKHQsbixyLGkpe3ZhciBzPXQubGVuZ3RoLG89W10sdT1bXSxhPVtdLGYsbD1udW1lcmljLnN1YixjPW51bWVyaWMubXVsLGg9bnVtZXJpYy5hZGQ7Zm9yKGY9cy0yO2Y+PTA7Zi0tKXVbZl09dFtmKzFdLXRbZl0sYVtmXT1sKG5bZisxXSxuW2ZdKTtpZih0eXBlb2Ygcj09XCJzdHJpbmdcInx8dHlwZW9mIGk9PVwic3RyaW5nXCIpcj1pPVwicGVyaW9kaWNcIjt2YXIgcD1bW10sW10sW11dO3N3aXRjaCh0eXBlb2Ygcil7Y2FzZVwidW5kZWZpbmVkXCI6b1swXT1jKDMvKHVbMF0qdVswXSksYVswXSkscFswXS5wdXNoKDAsMCkscFsxXS5wdXNoKDAsMSkscFsyXS5wdXNoKDIvdVswXSwxL3VbMF0pO2JyZWFrO2Nhc2VcInN0cmluZ1wiOm9bMF09aChjKDMvKHVbcy0yXSp1W3MtMl0pLGFbcy0yXSksYygzLyh1WzBdKnVbMF0pLGFbMF0pKSxwWzBdLnB1c2goMCwwLDApLHBbMV0ucHVzaChzLTIsMCwxKSxwWzJdLnB1c2goMS91W3MtMl0sMi91W3MtMl0rMi91WzBdLDEvdVswXSk7YnJlYWs7ZGVmYXVsdDpvWzBdPXIscFswXS5wdXNoKDApLHBbMV0ucHVzaCgwKSxwWzJdLnB1c2goMSl9Zm9yKGY9MTtmPHMtMTtmKyspb1tmXT1oKGMoMy8odVtmLTFdKnVbZi0xXSksYVtmLTFdKSxjKDMvKHVbZl0qdVtmXSksYVtmXSkpLHBbMF0ucHVzaChmLGYsZikscFsxXS5wdXNoKGYtMSxmLGYrMSkscFsyXS5wdXNoKDEvdVtmLTFdLDIvdVtmLTFdKzIvdVtmXSwxL3VbZl0pO3N3aXRjaCh0eXBlb2YgaSl7Y2FzZVwidW5kZWZpbmVkXCI6b1tzLTFdPWMoMy8odVtzLTJdKnVbcy0yXSksYVtzLTJdKSxwWzBdLnB1c2gocy0xLHMtMSkscFsxXS5wdXNoKHMtMixzLTEpLHBbMl0ucHVzaCgxL3Vbcy0yXSwyL3Vbcy0yXSk7YnJlYWs7Y2FzZVwic3RyaW5nXCI6cFsxXVtwWzFdLmxlbmd0aC0xXT0wO2JyZWFrO2RlZmF1bHQ6b1tzLTFdPWkscFswXS5wdXNoKHMtMSkscFsxXS5wdXNoKHMtMSkscFsyXS5wdXNoKDEpfXR5cGVvZiBvWzBdIT1cIm51bWJlclwiP289bnVtZXJpYy50cmFuc3Bvc2Uobyk6bz1bb107dmFyIGQ9QXJyYXkoby5sZW5ndGgpO2lmKHR5cGVvZiByPT1cInN0cmluZ1wiKWZvcihmPWQubGVuZ3RoLTE7ZiE9PS0xOy0tZilkW2ZdPW51bWVyaWMuY2NzTFVQU29sdmUobnVtZXJpYy5jY3NMVVAobnVtZXJpYy5jY3NTY2F0dGVyKHApKSxvW2ZdKSxkW2ZdW3MtMV09ZFtmXVswXTtlbHNlIGZvcihmPWQubGVuZ3RoLTE7ZiE9PS0xOy0tZilkW2ZdPW51bWVyaWMuY0xVc29sdmUobnVtZXJpYy5jTFUocCksb1tmXSk7cmV0dXJuIHR5cGVvZiBuWzBdPT1cIm51bWJlclwiP2Q9ZFswXTpkPW51bWVyaWMudHJhbnNwb3NlKGQpLG5ldyBudW1lcmljLlNwbGluZSh0LG4sbixkLGQpfSxudW1lcmljLmZmdHBvdzI9ZnVuY3Rpb24gZmZ0cG93MihlLHQpe3ZhciBuPWUubGVuZ3RoO2lmKG49PT0xKXJldHVybjt2YXIgcj1NYXRoLmNvcyxpPU1hdGguc2luLHMsbyx1PUFycmF5KG4vMiksYT1BcnJheShuLzIpLGY9QXJyYXkobi8yKSxsPUFycmF5KG4vMik7bz1uLzI7Zm9yKHM9bi0xO3MhPT0tMTstLXMpLS1vLGZbb109ZVtzXSxsW29dPXRbc10sLS1zLHVbb109ZVtzXSxhW29dPXRbc107ZmZ0cG93Mih1LGEpLGZmdHBvdzIoZixsKSxvPW4vMjt2YXIgYyxoPS02LjI4MzE4NTMwNzE3OTU4Ni9uLHAsZDtmb3Iocz1uLTE7cyE9PS0xOy0tcyktLW8sbz09PS0xJiYobz1uLzItMSksYz1oKnMscD1yKGMpLGQ9aShjKSxlW3NdPXVbb10rcCpmW29dLWQqbFtvXSx0W3NdPWFbb10rcCpsW29dK2QqZltvXX0sbnVtZXJpYy5faWZmdHBvdzI9ZnVuY3Rpb24gX2lmZnRwb3cyKGUsdCl7dmFyIG49ZS5sZW5ndGg7aWYobj09PTEpcmV0dXJuO3ZhciByPU1hdGguY29zLGk9TWF0aC5zaW4scyxvLHU9QXJyYXkobi8yKSxhPUFycmF5KG4vMiksZj1BcnJheShuLzIpLGw9QXJyYXkobi8yKTtvPW4vMjtmb3Iocz1uLTE7cyE9PS0xOy0tcyktLW8sZltvXT1lW3NdLGxbb109dFtzXSwtLXMsdVtvXT1lW3NdLGFbb109dFtzXTtfaWZmdHBvdzIodSxhKSxfaWZmdHBvdzIoZixsKSxvPW4vMjt2YXIgYyxoPTYuMjgzMTg1MzA3MTc5NTg2L24scCxkO2ZvcihzPW4tMTtzIT09LTE7LS1zKS0tbyxvPT09LTEmJihvPW4vMi0xKSxjPWgqcyxwPXIoYyksZD1pKGMpLGVbc109dVtvXStwKmZbb10tZCpsW29dLHRbc109YVtvXStwKmxbb10rZCpmW29dfSxudW1lcmljLmlmZnRwb3cyPWZ1bmN0aW9uKHQsbil7bnVtZXJpYy5faWZmdHBvdzIodCxuKSxudW1lcmljLmRpdmVxKHQsdC5sZW5ndGgpLG51bWVyaWMuZGl2ZXEobixuLmxlbmd0aCl9LG51bWVyaWMuY29udnBvdzI9ZnVuY3Rpb24odCxuLHIsaSl7bnVtZXJpYy5mZnRwb3cyKHQsbiksbnVtZXJpYy5mZnRwb3cyKHIsaSk7dmFyIHMsbz10Lmxlbmd0aCx1LGEsZixsO2ZvcihzPW8tMTtzIT09LTE7LS1zKXU9dFtzXSxmPW5bc10sYT1yW3NdLGw9aVtzXSx0W3NdPXUqYS1mKmwsbltzXT11KmwrZiphO251bWVyaWMuaWZmdHBvdzIodCxuKX0sbnVtZXJpYy5ULnByb3RvdHlwZS5mZnQ9ZnVuY3Rpb24oKXt2YXIgdD10aGlzLngsbj10aGlzLnkscj10Lmxlbmd0aCxpPU1hdGgubG9nLHM9aSgyKSxvPU1hdGguY2VpbChpKDIqci0xKS9zKSx1PU1hdGgucG93KDIsbyksYT1udW1lcmljLnJlcChbdV0sMCksZj1udW1lcmljLnJlcChbdV0sMCksbD1NYXRoLmNvcyxjPU1hdGguc2luLGgscD0tMy4xNDE1OTI2NTM1ODk3OTMvcixkLHY9bnVtZXJpYy5yZXAoW3VdLDApLG09bnVtZXJpYy5yZXAoW3VdLDApLGc9TWF0aC5mbG9vcihyLzIpO2ZvcihoPTA7aDxyO2grKyl2W2hdPXRbaF07aWYodHlwZW9mIG4hPVwidW5kZWZpbmVkXCIpZm9yKGg9MDtoPHI7aCsrKW1baF09bltoXTthWzBdPTE7Zm9yKGg9MTtoPD11LzI7aCsrKWQ9cCpoKmgsYVtoXT1sKGQpLGZbaF09YyhkKSxhW3UtaF09bChkKSxmW3UtaF09YyhkKTt2YXIgeT1uZXcgbnVtZXJpYy5UKHYsbSksYj1uZXcgbnVtZXJpYy5UKGEsZik7cmV0dXJuIHk9eS5tdWwoYiksbnVtZXJpYy5jb252cG93Mih5LngseS55LG51bWVyaWMuY2xvbmUoYi54KSxudW1lcmljLm5lZyhiLnkpKSx5PXkubXVsKGIpLHkueC5sZW5ndGg9cix5LnkubGVuZ3RoPXIseX0sbnVtZXJpYy5ULnByb3RvdHlwZS5pZmZ0PWZ1bmN0aW9uKCl7dmFyIHQ9dGhpcy54LG49dGhpcy55LHI9dC5sZW5ndGgsaT1NYXRoLmxvZyxzPWkoMiksbz1NYXRoLmNlaWwoaSgyKnItMSkvcyksdT1NYXRoLnBvdygyLG8pLGE9bnVtZXJpYy5yZXAoW3VdLDApLGY9bnVtZXJpYy5yZXAoW3VdLDApLGw9TWF0aC5jb3MsYz1NYXRoLnNpbixoLHA9My4xNDE1OTI2NTM1ODk3OTMvcixkLHY9bnVtZXJpYy5yZXAoW3VdLDApLG09bnVtZXJpYy5yZXAoW3VdLDApLGc9TWF0aC5mbG9vcihyLzIpO2ZvcihoPTA7aDxyO2grKyl2W2hdPXRbaF07aWYodHlwZW9mIG4hPVwidW5kZWZpbmVkXCIpZm9yKGg9MDtoPHI7aCsrKW1baF09bltoXTthWzBdPTE7Zm9yKGg9MTtoPD11LzI7aCsrKWQ9cCpoKmgsYVtoXT1sKGQpLGZbaF09YyhkKSxhW3UtaF09bChkKSxmW3UtaF09YyhkKTt2YXIgeT1uZXcgbnVtZXJpYy5UKHYsbSksYj1uZXcgbnVtZXJpYy5UKGEsZik7cmV0dXJuIHk9eS5tdWwoYiksbnVtZXJpYy5jb252cG93Mih5LngseS55LG51bWVyaWMuY2xvbmUoYi54KSxudW1lcmljLm5lZyhiLnkpKSx5PXkubXVsKGIpLHkueC5sZW5ndGg9cix5LnkubGVuZ3RoPXIseS5kaXYocil9LG51bWVyaWMuZ3JhZGllbnQ9ZnVuY3Rpb24odCxuKXt2YXIgcj1uLmxlbmd0aCxpPXQobik7aWYoaXNOYU4oaSkpdGhyb3cgbmV3IEVycm9yKFwiZ3JhZGllbnQ6IGYoeCkgaXMgYSBOYU4hXCIpO3ZhciBzPU1hdGgubWF4LG8sdT1udW1lcmljLmNsb25lKG4pLGEsZixsPUFycmF5KHIpLGM9bnVtZXJpYy5kaXYsaD1udW1lcmljLnN1YixwLGQscz1NYXRoLm1heCx2PS4wMDEsbT1NYXRoLmFicyxnPU1hdGgubWluLHksYix3LEU9MCxTLHgsVDtmb3Iobz0wO288cjtvKyspe3ZhciBOPXMoMWUtNippLDFlLTgpO2Zvcig7Oyl7KytFO2lmKEU+MjApdGhyb3cgbmV3IEVycm9yKFwiTnVtZXJpY2FsIGdyYWRpZW50IGZhaWxzXCIpO3Vbb109bltvXStOLGE9dCh1KSx1W29dPW5bb10tTixmPXQodSksdVtvXT1uW29dO2lmKGlzTmFOKGEpfHxpc05hTihmKSl7Ti89MTY7Y29udGludWV9bFtvXT0oYS1mKS8oMipOKSx5PW5bb10tTixiPW5bb10sdz1uW29dK04sUz0oYS1pKS9OLHg9KGktZikvTixUPXMobShsW29dKSxtKGkpLG0oYSksbShmKSxtKHkpLG0oYiksbSh3KSwxZS04KSxwPWcocyhtKFMtbFtvXSksbSh4LWxbb10pLG0oUy14KSkvVCxOL1QpO2lmKCEocD52KSlicmVhaztOLz0xNn19cmV0dXJuIGx9LG51bWVyaWMudW5jbWluPWZ1bmN0aW9uKHQsbixyLGkscyxvLHUpe3ZhciBhPW51bWVyaWMuZ3JhZGllbnQ7dHlwZW9mIHU9PVwidW5kZWZpbmVkXCImJih1PXt9KSx0eXBlb2Ygcj09XCJ1bmRlZmluZWRcIiYmKHI9MWUtOCksdHlwZW9mIGk9PVwidW5kZWZpbmVkXCImJihpPWZ1bmN0aW9uKGUpe3JldHVybiBhKHQsZSl9KSx0eXBlb2Ygcz09XCJ1bmRlZmluZWRcIiYmKHM9MWUzKSxuPW51bWVyaWMuY2xvbmUobik7dmFyIGY9bi5sZW5ndGgsbD10KG4pLGMsaDtpZihpc05hTihsKSl0aHJvdyBuZXcgRXJyb3IoXCJ1bmNtaW46IGYoeDApIGlzIGEgTmFOIVwiKTt2YXIgcD1NYXRoLm1heCxkPW51bWVyaWMubm9ybTI7cj1wKHIsbnVtZXJpYy5lcHNpbG9uKTt2YXIgdixtLGcseT11LkhpbnZ8fG51bWVyaWMuaWRlbnRpdHkoZiksYj1udW1lcmljLmRvdCx3PW51bWVyaWMuaW52LEU9bnVtZXJpYy5zdWIsUz1udW1lcmljLmFkZCx4PW51bWVyaWMudGVuc29yLFQ9bnVtZXJpYy5kaXYsTj1udW1lcmljLm11bCxDPW51bWVyaWMuYWxsLGs9bnVtZXJpYy5pc0Zpbml0ZSxMPW51bWVyaWMubmVnLEE9MCxPLE0sXyxELFAsSCxCLGosRixJLHEsUixVPVwiXCI7bT1pKG4pO3doaWxlKEE8cyl7aWYodHlwZW9mIG89PVwiZnVuY3Rpb25cIiYmbyhBLG4sbCxtLHkpKXtVPVwiQ2FsbGJhY2sgcmV0dXJuZWQgdHJ1ZVwiO2JyZWFrfWlmKCFDKGsobSkpKXtVPVwiR3JhZGllbnQgaGFzIEluZmluaXR5IG9yIE5hTlwiO2JyZWFrfXY9TChiKHksbSkpO2lmKCFDKGsodikpKXtVPVwiU2VhcmNoIGRpcmVjdGlvbiBoYXMgSW5maW5pdHkgb3IgTmFOXCI7YnJlYWt9ST1kKHYpO2lmKEk8cil7VT1cIk5ld3RvbiBzdGVwIHNtYWxsZXIgdGhhbiB0b2xcIjticmVha31GPTEsaD1iKG0sdiksXz1uO3doaWxlKEE8cyl7aWYoRipJPHIpYnJlYWs7TT1OKHYsRiksXz1TKG4sTSksYz10KF8pO2lmKGMtbD49LjEqRipofHxpc05hTihjKSl7Rio9LjUsKytBO2NvbnRpbnVlfWJyZWFrfWlmKEYqSTxyKXtVPVwiTGluZSBzZWFyY2ggc3RlcCBzaXplIHNtYWxsZXIgdGhhbiB0b2xcIjticmVha31pZihBPT09cyl7VT1cIm1heGl0IHJlYWNoZWQgZHVyaW5nIGxpbmUgc2VhcmNoXCI7YnJlYWt9Zz1pKF8pLEQ9RShnLG0pLEI9YihELE0pLFA9Yih5LEQpLHk9RShTKHksTigoQitiKEQsUCkpLyhCKkIpLHgoTSxNKSkpLFQoUyh4KFAsTSkseChNLFApKSxCKSksbj1fLGw9YyxtPWcsKytBfXJldHVybntzb2x1dGlvbjpuLGY6bCxncmFkaWVudDptLGludkhlc3NpYW46eSxpdGVyYXRpb25zOkEsbWVzc2FnZTpVfX0sbnVtZXJpYy5Eb3ByaT1mdW5jdGlvbih0LG4scixpLHMsbyx1KXt0aGlzLng9dCx0aGlzLnk9bix0aGlzLmY9cix0aGlzLnltaWQ9aSx0aGlzLml0ZXJhdGlvbnM9cyx0aGlzLmV2ZW50cz11LHRoaXMubWVzc2FnZT1vfSxudW1lcmljLkRvcHJpLnByb3RvdHlwZS5fYXQ9ZnVuY3Rpb24odCxuKXtmdW5jdGlvbiByKGUpe3JldHVybiBlKmV9dmFyIGk9dGhpcyxzPWkueCxvPWkueSx1PWkuZixhPWkueW1pZCxmPXMubGVuZ3RoLGwsYyxoLHAsZCx2LHQsbT1NYXRoLmZsb29yLGcseT0uNSxiPW51bWVyaWMuYWRkLHc9bnVtZXJpYy5tdWwsRT1udW1lcmljLnN1YixTLHgsVDtyZXR1cm4gbD1zW25dLGM9c1tuKzFdLHA9b1tuXSxkPW9bbisxXSxnPWMtbCxoPWwreSpnLHY9YVtuXSxTPUUodVtuXSx3KHAsMS8obC1oKSsyLyhsLWMpKSkseD1FKHVbbisxXSx3KGQsMS8oYy1oKSsyLyhjLWwpKSksVD1bcih0LWMpKih0LWgpL3IobC1jKS8obC1oKSxyKHQtbCkqcih0LWMpL3IobC1oKS9yKGMtaCkscih0LWwpKih0LWgpL3IoYy1sKS8oYy1oKSwodC1sKSpyKHQtYykqKHQtaCkvcihsLWMpLyhsLWgpLCh0LWMpKnIodC1sKSoodC1oKS9yKGwtYykvKGMtaCldLGIoYihiKGIodyhwLFRbMF0pLHcodixUWzFdKSksdyhkLFRbMl0pKSx3KFMsVFszXSkpLHcoeCxUWzRdKSl9LG51bWVyaWMuRG9wcmkucHJvdG90eXBlLmF0PWZ1bmN0aW9uKHQpe3ZhciBuLHIsaSxzPU1hdGguZmxvb3I7aWYodHlwZW9mIHQhPVwibnVtYmVyXCIpe3ZhciBvPXQubGVuZ3RoLHU9QXJyYXkobyk7Zm9yKG49by0xO24hPT0tMTstLW4pdVtuXT10aGlzLmF0KHRbbl0pO3JldHVybiB1fXZhciBhPXRoaXMueDtuPTAscj1hLmxlbmd0aC0xO3doaWxlKHItbj4xKWk9cyguNSoobityKSksYVtpXTw9dD9uPWk6cj1pO3JldHVybiB0aGlzLl9hdCh0LG4pfSxudW1lcmljLmRvcHJpPWZ1bmN0aW9uKHQsbixyLGkscyxvLHUpe3R5cGVvZiBzPT1cInVuZGVmaW5lZFwiJiYocz0xZS02KSx0eXBlb2Ygbz09XCJ1bmRlZmluZWRcIiYmKG89MWUzKTt2YXIgYT1bdF0sZj1bcl0sbD1baSh0LHIpXSxjLGgscCxkLHYsbSxnPVtdLHk9LjIsYj1bLjA3NSwuMjI1XSx3PVs0NC80NSwtNTYvMTUsMzIvOV0sRT1bMTkzNzIvNjU2MSwtMjUzNjAvMjE4Nyw2NDQ0OC82NTYxLC0yMTIvNzI5XSxTPVs5MDE3LzMxNjgsLTM1NS8zMyw0NjczMi81MjQ3LDQ5LzE3NiwtNTEwMy8xODY1Nl0seD1bMzUvMzg0LDAsNTAwLzExMTMsMTI1LzE5MiwtMjE4Ny82Nzg0LDExLzg0XSxUPVsuMTAwMTM0MzE4ODMwMDIzOTUsMCwuMzkxODMyMTc5NDE4NDI1OSwtMC4wMjk4MjQ2MDE3NjU5NDgxNywuMDU4OTMyNjgzMzcyNDA3OTUsLTAuMDQ0OTc4ODg4MDkxMDQzNjEsLjAyMzkwNDMwODIzNjEzMzk3M10sTj1bLjIsLjMsLjgsOC85LDEsMV0sQz1bLTcxLzU3NjAwLDAsNzEvMTY2OTUsLTcxLzE5MjAsMTcyNTMvMzM5MjAwLC0yMi81MjUsLjAyNV0saz0wLEwsQSxPPShuLXQpLzEwLE09MCxfPW51bWVyaWMuYWRkLEQ9bnVtZXJpYy5tdWwsUCxILEI9TWF0aC5tYXgsaj1NYXRoLm1pbixGPU1hdGguYWJzLEk9bnVtZXJpYy5ub3JtaW5mLHE9TWF0aC5wb3csUj1udW1lcmljLmFueSxVPW51bWVyaWMubHQsej1udW1lcmljLmFuZCxXPW51bWVyaWMuc3ViLFgsViwkLEo9bmV3IG51bWVyaWMuRG9wcmkoYSxmLGwsZywtMSxcIlwiKTt0eXBlb2YgdT09XCJmdW5jdGlvblwiJiYoWD11KHQscikpO3doaWxlKHQ8biYmTTxvKXsrK00sdCtPPm4mJihPPW4tdCksYz1pKHQrTlswXSpPLF8ocixEKHkqTyxsW2tdKSkpLGg9aSh0K05bMV0qTyxfKF8ocixEKGJbMF0qTyxsW2tdKSksRChiWzFdKk8sYykpKSxwPWkodCtOWzJdKk8sXyhfKF8ocixEKHdbMF0qTyxsW2tdKSksRCh3WzFdKk8sYykpLEQod1syXSpPLGgpKSksZD1pKHQrTlszXSpPLF8oXyhfKF8ocixEKEVbMF0qTyxsW2tdKSksRChFWzFdKk8sYykpLEQoRVsyXSpPLGgpKSxEKEVbM10qTyxwKSkpLHY9aSh0K05bNF0qTyxfKF8oXyhfKF8ocixEKFNbMF0qTyxsW2tdKSksRChTWzFdKk8sYykpLEQoU1syXSpPLGgpKSxEKFNbM10qTyxwKSksRChTWzRdKk8sZCkpKSxQPV8oXyhfKF8oXyhyLEQobFtrXSxPKnhbMF0pKSxEKGgsTyp4WzJdKSksRChwLE8qeFszXSkpLEQoZCxPKnhbNF0pKSxEKHYsTyp4WzVdKSksbT1pKHQrTyxQKSxMPV8oXyhfKF8oXyhEKGxba10sTypDWzBdKSxEKGgsTypDWzJdKSksRChwLE8qQ1szXSkpLEQoZCxPKkNbNF0pKSxEKHYsTypDWzVdKSksRChtLE8qQ1s2XSkpLHR5cGVvZiBMPT1cIm51bWJlclwiP0g9RihMKTpIPUkoTCk7aWYoSD5zKXtPPS4yKk8qcShzL0gsLjI1KTtpZih0K089PT10KXtKLm1zZz1cIlN0ZXAgc2l6ZSBiZWNhbWUgdG9vIHNtYWxsXCI7YnJlYWt9Y29udGludWV9Z1trXT1fKF8oXyhfKF8oXyhyLEQobFtrXSxPKlRbMF0pKSxEKGgsTypUWzJdKSksRChwLE8qVFszXSkpLEQoZCxPKlRbNF0pKSxEKHYsTypUWzVdKSksRChtLE8qVFs2XSkpLCsrayxhW2tdPXQrTyxmW2tdPVAsbFtrXT1tO2lmKHR5cGVvZiB1PT1cImZ1bmN0aW9uXCIpe3ZhciBLLFE9dCxHPXQrLjUqTyxZO1Y9dShHLGdbay0xXSksJD16KFUoWCwwKSxVKDAsVikpLFIoJCl8fChRPUcsRz10K08sWD1WLFY9dShHLFApLCQ9eihVKFgsMCksVSgwLFYpKSk7aWYoUigkKSl7dmFyIFosZXQsdHQsbnQscnQ9MCxpdD0xLHN0PTE7Zm9yKDs7KXtpZih0eXBlb2YgWD09XCJudW1iZXJcIilZPShzdCpWKlEtaXQqWCpHKS8oc3QqVi1pdCpYKTtlbHNle1k9Rztmb3IoQT1YLmxlbmd0aC0xO0EhPT0tMTstLUEpWFtBXTwwJiZWW0FdPjAmJihZPWooWSwoc3QqVltBXSpRLWl0KlhbQV0qRykvKHN0KlZbQV0taXQqWFtBXSkpKX1pZihZPD1RfHxZPj1HKWJyZWFrO0s9Si5fYXQoWSxrLTEpLG50PXUoWSxLKSx0dD16KFUoWCwwKSxVKDAsbnQpKSxSKHR0KT8oRz1ZLFY9bnQsJD10dCxzdD0xLHJ0PT09LTE/aXQqPS41Oml0PTEscnQ9LTEpOihRPVksWD1udCxpdD0xLHJ0PT09MT9zdCo9LjU6c3Q9MSxydD0xKX1yZXR1cm4gUD1KLl9hdCguNSoodCtZKSxrLTEpLEouZltrXT1pKFksSyksSi54W2tdPVksSi55W2tdPUssSi55bWlkW2stMV09UCxKLmV2ZW50cz0kLEouaXRlcmF0aW9ucz1NLEp9fXQrPU8scj1QLFg9VixPPWooLjgqTypxKHMvSCwuMjUpLDQqTyl9cmV0dXJuIEouaXRlcmF0aW9ucz1NLEp9LG51bWVyaWMuTFU9ZnVuY3Rpb24oZSx0KXt0PXR8fCExO3ZhciBuPU1hdGguYWJzLHIsaSxzLG8sdSxhLGYsbCxjLGg9ZS5sZW5ndGgscD1oLTEsZD1uZXcgQXJyYXkoaCk7dHx8KGU9bnVtZXJpYy5jbG9uZShlKSk7Zm9yKHM9MDtzPGg7KytzKXtmPXMsYT1lW3NdLGM9bihhW3NdKTtmb3IoaT1zKzE7aTxoOysraSlvPW4oZVtpXVtzXSksYzxvJiYoYz1vLGY9aSk7ZFtzXT1mLGYhPXMmJihlW3NdPWVbZl0sZVtmXT1hLGE9ZVtzXSksdT1hW3NdO2ZvcihyPXMrMTtyPGg7KytyKWVbcl1bc10vPXU7Zm9yKHI9cysxO3I8aDsrK3Ipe2w9ZVtyXTtmb3IoaT1zKzE7aTxwOysraSlsW2ldLT1sW3NdKmFbaV0sKytpLGxbaV0tPWxbc10qYVtpXTtpPT09cCYmKGxbaV0tPWxbc10qYVtpXSl9fXJldHVybntMVTplLFA6ZH19LG51bWVyaWMuTFVzb2x2ZT1mdW5jdGlvbih0LG4pe3ZhciByLGkscz10LkxVLG89cy5sZW5ndGgsdT1udW1lcmljLmNsb25lKG4pLGE9dC5QLGYsbCxjLGg7Zm9yKHI9by0xO3IhPT0tMTstLXIpdVtyXT1uW3JdO2ZvcihyPTA7cjxvOysrcil7Zj1hW3JdLGFbcl0hPT1yJiYoaD11W3JdLHVbcl09dVtmXSx1W2ZdPWgpLGw9c1tyXTtmb3IoaT0wO2k8cjsrK2kpdVtyXS09dVtpXSpsW2ldfWZvcihyPW8tMTtyPj0wOy0tcil7bD1zW3JdO2ZvcihpPXIrMTtpPG87KytpKXVbcl0tPXVbaV0qbFtpXTt1W3JdLz1sW3JdfXJldHVybiB1fSxudW1lcmljLnNvbHZlPWZ1bmN0aW9uKHQsbixyKXtyZXR1cm4gbnVtZXJpYy5MVXNvbHZlKG51bWVyaWMuTFUodCxyKSxuKX0sbnVtZXJpYy5lY2hlbG9uaXplPWZ1bmN0aW9uKHQpe3ZhciBuPW51bWVyaWMuZGltKHQpLHI9blswXSxpPW5bMV0scz1udW1lcmljLmlkZW50aXR5KHIpLG89QXJyYXkociksdSxhLGYsbCxjLGgscCxkLHY9TWF0aC5hYnMsbT1udW1lcmljLmRpdmVxO3Q9bnVtZXJpYy5jbG9uZSh0KTtmb3IodT0wO3U8cjsrK3Upe2Y9MCxjPXRbdV0saD1zW3VdO2ZvcihhPTE7YTxpOysrYSl2KGNbZl0pPHYoY1thXSkmJihmPWEpO29bdV09ZixtKGgsY1tmXSksbShjLGNbZl0pO2ZvcihhPTA7YTxyOysrYSlpZihhIT09dSl7cD10W2FdLGQ9cFtmXTtmb3IobD1pLTE7bCE9PS0xOy0tbClwW2xdLT1jW2xdKmQ7cD1zW2FdO2ZvcihsPXItMTtsIT09LTE7LS1sKXBbbF0tPWhbbF0qZH19cmV0dXJue0k6cyxBOnQsUDpvfX0sbnVtZXJpYy5fX3NvbHZlTFA9ZnVuY3Rpb24odCxuLHIsaSxzLG8sdSl7dmFyIGE9bnVtZXJpYy5zdW0sZj1udW1lcmljLmxvZyxsPW51bWVyaWMubXVsLGM9bnVtZXJpYy5zdWIsaD1udW1lcmljLmRvdCxwPW51bWVyaWMuZGl2LGQ9bnVtZXJpYy5hZGQsdj10Lmxlbmd0aCxtPXIubGVuZ3RoLGcseT0hMSxiLHc9MCxFPTEsUyx4LFQ9bnVtZXJpYy50cmFuc3Bvc2UobiksTj1udW1lcmljLnN2ZCxDPW51bWVyaWMudHJhbnNwb3NlLGs9bnVtZXJpYy5sZXEsTD1NYXRoLnNxcnQsQT1NYXRoLmFicyxPPW51bWVyaWMubXVsZXEsTT1udW1lcmljLm5vcm1pbmYsXz1udW1lcmljLmFueSxEPU1hdGgubWluLFA9bnVtZXJpYy5hbGwsSD1udW1lcmljLmd0LEI9QXJyYXkodiksaj1BcnJheShtKSxGPW51bWVyaWMucmVwKFttXSwxKSxJLHE9bnVtZXJpYy5zb2x2ZSxSPWMocixoKG4sbykpLFUsej1oKHQsdCksVztmb3IoVT13O1U8czsrK1Upe3ZhciBYLFYsJDtmb3IoWD1tLTE7WCE9PS0xOy0tWClqW1hdPXAobltYXSxSW1hdKTt2YXIgSj1DKGopO2ZvcihYPXYtMTtYIT09LTE7LS1YKUJbWF09YShKW1hdKTtFPS4yNSpBKHovaCh0LEIpKTt2YXIgSz0xMDAqTCh6L2goQixCKSk7aWYoIWlzRmluaXRlKEUpfHxFPkspRT1LO1c9ZCh0LGwoRSxCKSksST1oKEosaik7Zm9yKFg9di0xO1ghPT0tMTstLVgpSVtYXVtYXSs9MTskPXEoSSxwKFcsRSksITApO3ZhciBRPXAoUixoKG4sJCkpLEc9MTtmb3IoWD1tLTE7WCE9PS0xOy0tWClRW1hdPDAmJihHPUQoRywtMC45OTkqUVtYXSkpO2c9YyhvLGwoJCxHKSksUj1jKHIsaChuLGcpKTtpZighUChIKFIsMCkpKXJldHVybntzb2x1dGlvbjpvLG1lc3NhZ2U6XCJcIixpdGVyYXRpb25zOlV9O289ZztpZihFPGkpcmV0dXJue3NvbHV0aW9uOmcsbWVzc2FnZTpcIlwiLGl0ZXJhdGlvbnM6VX07aWYodSl7dmFyIFk9aCh0LFcpLFo9aChuLFcpO3k9ITA7Zm9yKFg9bS0xO1ghPT0tMTstLVgpaWYoWSpaW1hdPDApe3k9ITE7YnJlYWt9fWVsc2Ugb1t2LTFdPj0wP3k9ITE6eT0hMDtpZih5KXJldHVybntzb2x1dGlvbjpnLG1lc3NhZ2U6XCJVbmJvdW5kZWRcIixpdGVyYXRpb25zOlV9fXJldHVybntzb2x1dGlvbjpvLG1lc3NhZ2U6XCJtYXhpbXVtIGl0ZXJhdGlvbiBjb3VudCBleGNlZWRlZFwiLGl0ZXJhdGlvbnM6VX19LG51bWVyaWMuX3NvbHZlTFA9ZnVuY3Rpb24odCxuLHIsaSxzKXt2YXIgbz10Lmxlbmd0aCx1PXIubGVuZ3RoLGEsZj1udW1lcmljLnN1bSxsPW51bWVyaWMubG9nLGM9bnVtZXJpYy5tdWwsaD1udW1lcmljLnN1YixwPW51bWVyaWMuZG90LGQ9bnVtZXJpYy5kaXYsdj1udW1lcmljLmFkZCxtPW51bWVyaWMucmVwKFtvXSwwKS5jb25jYXQoWzFdKSxnPW51bWVyaWMucmVwKFt1LDFdLC0xKSx5PW51bWVyaWMuYmxvY2tNYXRyaXgoW1tuLGddXSksYj1yLGE9bnVtZXJpYy5yZXAoW29dLDApLmNvbmNhdChNYXRoLm1heCgwLG51bWVyaWMuc3VwKG51bWVyaWMubmVnKHIpKSkrMSksdz1udW1lcmljLl9fc29sdmVMUChtLHksYixpLHMsYSwhMSksRT1udW1lcmljLmNsb25lKHcuc29sdXRpb24pO0UubGVuZ3RoPW87dmFyIFM9bnVtZXJpYy5pbmYoaChyLHAobixFKSkpO2lmKFM8MClyZXR1cm57c29sdXRpb246TmFOLG1lc3NhZ2U6XCJJbmZlYXNpYmxlXCIsaXRlcmF0aW9uczp3Lml0ZXJhdGlvbnN9O3ZhciB4PW51bWVyaWMuX19zb2x2ZUxQKHQsbixyLGkscy13Lml0ZXJhdGlvbnMsRSwhMCk7cmV0dXJuIHguaXRlcmF0aW9ucys9dy5pdGVyYXRpb25zLHh9LG51bWVyaWMuc29sdmVMUD1mdW5jdGlvbih0LG4scixpLHMsbyx1KXt0eXBlb2YgdT09XCJ1bmRlZmluZWRcIiYmKHU9MWUzKSx0eXBlb2Ygbz09XCJ1bmRlZmluZWRcIiYmKG89bnVtZXJpYy5lcHNpbG9uKTtpZih0eXBlb2YgaT09XCJ1bmRlZmluZWRcIilyZXR1cm4gbnVtZXJpYy5fc29sdmVMUCh0LG4scixvLHUpO3ZhciBhPWkubGVuZ3RoLGY9aVswXS5sZW5ndGgsbD1uLmxlbmd0aCxjPW51bWVyaWMuZWNoZWxvbml6ZShpKSxoPW51bWVyaWMucmVwKFtmXSwwKSxwPWMuUCxkPVtdLHY7Zm9yKHY9cC5sZW5ndGgtMTt2IT09LTE7LS12KWhbcFt2XV09MTtmb3Iodj1mLTE7diE9PS0xOy0tdiloW3ZdPT09MCYmZC5wdXNoKHYpO3ZhciBtPW51bWVyaWMuZ2V0UmFuZ2UsZz1udW1lcmljLmxpbnNwYWNlKDAsYS0xKSx5PW51bWVyaWMubGluc3BhY2UoMCxsLTEpLGI9bShpLGcsZCksdz1tKG4seSxwKSxFPW0obix5LGQpLFM9bnVtZXJpYy5kb3QseD1udW1lcmljLnN1YixUPVModyxjLkkpLE49eChFLFMoVCxiKSksQz14KHIsUyhULHMpKSxrPUFycmF5KHAubGVuZ3RoKSxMPUFycmF5KGQubGVuZ3RoKTtmb3Iodj1wLmxlbmd0aC0xO3YhPT0tMTstLXYpa1t2XT10W3Bbdl1dO2Zvcih2PWQubGVuZ3RoLTE7diE9PS0xOy0tdilMW3ZdPXRbZFt2XV07dmFyIEE9eChMLFMoayxTKGMuSSxiKSkpLE89bnVtZXJpYy5fc29sdmVMUChBLE4sQyxvLHUpLE09Ty5zb2x1dGlvbjtpZihNIT09TSlyZXR1cm4gTzt2YXIgXz1TKGMuSSx4KHMsUyhiLE0pKSksRD1BcnJheSh0Lmxlbmd0aCk7Zm9yKHY9cC5sZW5ndGgtMTt2IT09LTE7LS12KURbcFt2XV09X1t2XTtmb3Iodj1kLmxlbmd0aC0xO3YhPT0tMTstLXYpRFtkW3ZdXT1NW3ZdO3JldHVybntzb2x1dGlvbjpELG1lc3NhZ2U6Ty5tZXNzYWdlLGl0ZXJhdGlvbnM6Ty5pdGVyYXRpb25zfX0sbnVtZXJpYy5NUFN0b0xQPWZ1bmN0aW9uKHQpe2Z1bmN0aW9uIHkoZSl7dGhyb3cgbmV3IEVycm9yKFwiTVBTdG9MUDogXCIrZStcIlxcbkxpbmUgXCIrcytcIjogXCIrdFtzXStcIlxcbkN1cnJlbnQgc3RhdGU6IFwiK3Jbbl0rXCJcXG5cIil9dCBpbnN0YW5jZW9mIFN0cmluZyYmdC5zcGxpdChcIlxcblwiKTt2YXIgbj0wLHI9W1wiSW5pdGlhbCBzdGF0ZVwiLFwiTkFNRVwiLFwiUk9XU1wiLFwiQ09MVU1OU1wiLFwiUkhTXCIsXCJCT1VORFNcIixcIkVOREFUQVwiXSxpPXQubGVuZ3RoLHMsbyx1LGE9MCxmPXt9LGw9W10sYz0wLGg9e30scD0wLGQsdj1bXSxtPVtdLGc9W107Zm9yKHM9MDtzPGk7KytzKXt1PXRbc107dmFyIGI9dS5tYXRjaCgvXFxTKi9nKSx3PVtdO2ZvcihvPTA7bzxiLmxlbmd0aDsrK28pYltvXSE9PVwiXCImJncucHVzaChiW29dKTtpZih3Lmxlbmd0aD09PTApY29udGludWU7Zm9yKG89MDtvPHIubGVuZ3RoOysrbylpZih1LnN1YnN0cigwLHJbb10ubGVuZ3RoKT09PXJbb10pYnJlYWs7aWYobzxyLmxlbmd0aCl7bj1vLG89PT0xJiYoZD13WzFdKTtpZihvPT09NilyZXR1cm57bmFtZTpkLGM6dixBOm51bWVyaWMudHJhbnNwb3NlKG0pLGI6Zyxyb3dzOmYsdmFyczpofTtjb250aW51ZX1zd2l0Y2gobil7Y2FzZSAwOmNhc2UgMTp5KFwiVW5leHBlY3RlZCBsaW5lXCIpO2Nhc2UgMjpzd2l0Y2god1swXSl7Y2FzZVwiTlwiOmE9PT0wP2E9d1sxXTp5KFwiVHdvIG9yIG1vcmUgTiByb3dzXCIpO2JyZWFrO2Nhc2VcIkxcIjpmW3dbMV1dPWMsbFtjXT0xLGdbY109MCwrK2M7YnJlYWs7Y2FzZVwiR1wiOmZbd1sxXV09YyxsW2NdPS0xLGdbY109MCwrK2M7YnJlYWs7Y2FzZVwiRVwiOmZbd1sxXV09YyxsW2NdPTAsZ1tjXT0wLCsrYzticmVhaztkZWZhdWx0OnkoXCJQYXJzZSBlcnJvciBcIitudW1lcmljLnByZXR0eVByaW50KHcpKX1icmVhaztjYXNlIDM6aC5oYXNPd25Qcm9wZXJ0eSh3WzBdKXx8KGhbd1swXV09cCx2W3BdPTAsbVtwXT1udW1lcmljLnJlcChbY10sMCksKytwKTt2YXIgRT1oW3dbMF1dO2ZvcihvPTE7bzx3Lmxlbmd0aDtvKz0yKXtpZih3W29dPT09YSl7dltFXT1wYXJzZUZsb2F0KHdbbysxXSk7Y29udGludWV9dmFyIFM9Zlt3W29dXTttW0VdW1NdPShsW1NdPDA/LTE6MSkqcGFyc2VGbG9hdCh3W28rMV0pfWJyZWFrO2Nhc2UgNDpmb3Iobz0xO288dy5sZW5ndGg7bys9MilnW2Zbd1tvXV1dPShsW2Zbd1tvXV1dPDA/LTE6MSkqcGFyc2VGbG9hdCh3W28rMV0pO2JyZWFrO2Nhc2UgNTpicmVhaztjYXNlIDY6eShcIkludGVybmFsIGVycm9yXCIpfX15KFwiUmVhY2hlZCBlbmQgb2YgZmlsZSB3aXRob3V0IEVOREFUQVwiKX0sbnVtZXJpYy5zZWVkcmFuZG9tPXtwb3c6TWF0aC5wb3cscmFuZG9tOk1hdGgucmFuZG9tfSxmdW5jdGlvbihlLHQsbixyLGkscyxvKXtmdW5jdGlvbiB1KGUpe3ZhciB0LHIsaT10aGlzLHM9ZS5sZW5ndGgsbz0wLHU9aS5pPWkuaj1pLm09MDtpLlM9W10saS5jPVtdLHN8fChlPVtzKytdKTt3aGlsZShvPG4paS5TW29dPW8rKztmb3Iobz0wO288bjtvKyspdD1pLlNbb10sdT1sKHUrdCtlW28lc10pLHI9aS5TW3VdLGkuU1tvXT1yLGkuU1t1XT10O2kuZz1mdW5jdGlvbih0KXt2YXIgcj1pLlMscz1sKGkuaSsxKSxvPXJbc10sdT1sKGkuaitvKSxhPXJbdV07cltzXT1hLHJbdV09bzt2YXIgZj1yW2wobythKV07d2hpbGUoLS10KXM9bChzKzEpLG89cltzXSx1PWwodStvKSxhPXJbdV0scltzXT1hLHJbdV09byxmPWYqbityW2wobythKV07cmV0dXJuIGkuaT1zLGkuaj11LGZ9LGkuZyhuKX1mdW5jdGlvbiBhKGUsdCxuLHIsaSl7bj1bXSxpPXR5cGVvZiBlO2lmKHQmJmk9PVwib2JqZWN0XCIpZm9yKHIgaW4gZSlpZihyLmluZGV4T2YoXCJTXCIpPDUpdHJ5e24ucHVzaChhKGVbcl0sdC0xKSl9Y2F0Y2gocyl7fXJldHVybiBuLmxlbmd0aD9uOmUrKGkhPVwic3RyaW5nXCI/XCJcXDBcIjpcIlwiKX1mdW5jdGlvbiBmKGUsdCxuLHIpe2UrPVwiXCIsbj0wO2ZvcihyPTA7cjxlLmxlbmd0aDtyKyspdFtsKHIpXT1sKChuXj10W2wocildKjE5KStlLmNoYXJDb2RlQXQocikpO2U9XCJcIjtmb3IociBpbiB0KWUrPVN0cmluZy5mcm9tQ2hhckNvZGUodFtyXSk7cmV0dXJuIGV9ZnVuY3Rpb24gbChlKXtyZXR1cm4gZSZuLTF9dC5zZWVkcmFuZG9tPWZ1bmN0aW9uKGMsaCl7dmFyIHA9W10sZDtyZXR1cm4gYz1mKGEoaD9bYyxlXTphcmd1bWVudHMubGVuZ3RoP2M6WyhuZXcgRGF0ZSkuZ2V0VGltZSgpLGUsd2luZG93XSwzKSxwKSxkPW5ldyB1KHApLGYoZC5TLGUpLHQucmFuZG9tPWZ1bmN0aW9uKCl7dmFyIHQ9ZC5nKHIpLHU9byxhPTA7d2hpbGUodDxpKXQ9KHQrYSkqbix1Kj1uLGE9ZC5nKDEpO3doaWxlKHQ+PXMpdC89Mix1Lz0yLGE+Pj49MTtyZXR1cm4odCthKS91fSxjfSxvPXQucG93KG4sciksaT10LnBvdygyLGkpLHM9aSoyLGYodC5yYW5kb20oKSxlKX0oW10sbnVtZXJpYy5zZWVkcmFuZG9tLDI1Niw2LDUyKSxmdW5jdGlvbihlKXtmdW5jdGlvbiB0KGUpe2lmKHR5cGVvZiBlIT1cIm9iamVjdFwiKXJldHVybiBlO3ZhciBuPVtdLHIsaT1lLmxlbmd0aDtmb3Iocj0wO3I8aTtyKyspbltyKzFdPXQoZVtyXSk7cmV0dXJuIG59ZnVuY3Rpb24gbihlKXtpZih0eXBlb2YgZSE9XCJvYmplY3RcIilyZXR1cm4gZTt2YXIgdD1bXSxyLGk9ZS5sZW5ndGg7Zm9yKHI9MTtyPGk7cisrKXRbci0xXT1uKGVbcl0pO3JldHVybiB0fWZ1bmN0aW9uIHIoZSx0LG4pe3ZhciByLGkscyxvLHU7Zm9yKHM9MTtzPD1uO3MrPTEpe2Vbc11bc109MS9lW3NdW3NdLHU9LWVbc11bc107Zm9yKHI9MTtyPHM7cis9MSllW3JdW3NdPXUqZVtyXVtzXTtvPXMrMTtpZihuPG8pYnJlYWs7Zm9yKGk9bztpPD1uO2krPTEpe3U9ZVtzXVtpXSxlW3NdW2ldPTA7Zm9yKHI9MTtyPD1zO3IrPTEpZVtyXVtpXT1lW3JdW2ldK3UqZVtyXVtzXX19fWZ1bmN0aW9uIGkoZSx0LG4scil7dmFyIGkscyxvLHU7Zm9yKHM9MTtzPD1uO3MrPTEpe3U9MDtmb3IoaT0xO2k8cztpKz0xKXUrPWVbaV1bc10qcltpXTtyW3NdPShyW3NdLXUpL2Vbc11bc119Zm9yKG89MTtvPD1uO28rPTEpe3M9bisxLW8scltzXT1yW3NdL2Vbc11bc10sdT0tcltzXTtmb3IoaT0xO2k8cztpKz0xKXJbaV09cltpXSt1KmVbaV1bc119fWZ1bmN0aW9uIHMoZSx0LG4scil7dmFyIGkscyxvLHUsYSxmO2ZvcihzPTE7czw9bjtzKz0xKXtyWzFdPXMsZj0wLG89cy0xO2lmKG88MSl7Zj1lW3NdW3NdLWY7aWYoZjw9MClicmVhaztlW3NdW3NdPU1hdGguc3FydChmKX1lbHNle2Zvcih1PTE7dTw9bzt1Kz0xKXthPWVbdV1bc107Zm9yKGk9MTtpPHU7aSs9MSlhLT1lW2ldW3NdKmVbaV1bdV07YS89ZVt1XVt1XSxlW3VdW3NdPWEsZis9YSphfWY9ZVtzXVtzXS1mO2lmKGY8PTApYnJlYWs7ZVtzXVtzXT1NYXRoLnNxcnQoZil9clsxXT0wfX1mdW5jdGlvbiBvKGUsdCxuLG8sdSxhLGYsbCxjLGgscCxkLHYsbSxnLHkpe2Z1bmN0aW9uIFYoKXttWzFdPW1bMV0rMSxFPUw7Zm9yKGI9MTtiPD1oO2IrPTEpe0UrPTEsUD0tbFtiXTtmb3Iodz0xO3c8PW87dys9MSlQKz1mW3ddW2JdKnVbd107TWF0aC5hYnMoUCk8VSYmKFA9MCk7aWYoYj5wKWdbRV09UDtlbHNle2dbRV09LU1hdGguYWJzKFApO2lmKFA+MCl7Zm9yKHc9MTt3PD1vO3crPTEpZlt3XVtiXT0tZlt3XVtiXTtsW2JdPS1sW2JdfX19Zm9yKGI9MTtiPD12O2IrPTEpZ1tMK2RbYl1dPTA7Tz0wLEQ9MDtmb3IoYj0xO2I8PWg7Yis9MSlnW0wrYl08RCpnW18rYl0mJihPPWIsRD1nW0wrYl0vZ1tfK2JdKTtyZXR1cm4gTz09PTA/OTk5OjB9ZnVuY3Rpb24gJCgpe2ZvcihiPTE7Yjw9bztiKz0xKXtQPTA7Zm9yKHc9MTt3PD1vO3crPTEpUCs9ZVt3XVtiXSpmW3ddW09dO2dbYl09UH1TPU47Zm9yKGI9MTtiPD1vO2IrPTEpZ1tTK2JdPTA7Zm9yKHc9disxO3c8PW87dys9MSlmb3IoYj0xO2I8PW87Yis9MSlnW1MrYl09Z1tTK2JdK2VbYl1bd10qZ1t3XTtxPSEwO2ZvcihiPXY7Yj49MTtiLT0xKXtQPWdbYl0sRT1rK2IqKGIrMykvMixTPUUtYjtmb3Iodz1iKzE7dzw9djt3Kz0xKVAtPWdbRV0qZ1tDK3ddLEUrPXc7UC89Z1tTXSxnW0MrYl09UDtpZihkW2JdPHApYnJlYWs7aWYoUDwwKWJyZWFrO3E9ITEsVD1ifWlmKCFxKXtIPWdbQStUXS9nW0MrVF07Zm9yKGI9MTtiPD12O2IrPTEpe2lmKGRbYl08cClicmVhaztpZihnW0MrYl08MClicmVhaztEPWdbQStiXS9nW0MrYl0sRDxcbkgmJihIPUQsVD1iKX19UD0wO2ZvcihiPU4rMTtiPD1OK287Yis9MSlQKz1nW2JdKmdbYl07aWYoTWF0aC5hYnMoUCk8PVUpe2lmKHEpcmV0dXJuIHlbMV09MSw5OTk7Zm9yKGI9MTtiPD12O2IrPTEpZ1tBK2JdPWdbQStiXS1IKmdbQytiXTtyZXR1cm4gZ1tBK3YrMV09Z1tBK3YrMV0rSCw3MDB9UD0wO2ZvcihiPTE7Yjw9bztiKz0xKVArPWdbTitiXSpmW2JdW09dO0I9LWdbTCtPXS9QLFI9ITAscXx8SDxCJiYoQj1ILFI9ITEpO2ZvcihiPTE7Yjw9bztiKz0xKXVbYl09dVtiXStCKmdbTitiXSxNYXRoLmFicyh1W2JdKTxVJiYodVtiXT0wKTthWzFdPWFbMV0rQipQKihCLzIrZ1tBK3YrMV0pO2ZvcihiPTE7Yjw9djtiKz0xKWdbQStiXT1nW0ErYl0tQipnW0MrYl07Z1tBK3YrMV09Z1tBK3YrMV0rQjtpZighUil7UD0tbFtPXTtmb3Iodz0xO3c8PW87dys9MSlQKz11W3ddKmZbd11bT107aWYoTz5wKWdbTCtPXT1QO2Vsc2V7Z1tMK09dPS1NYXRoLmFicyhQKTtpZihQPjApe2Zvcih3PTE7dzw9bzt3Kz0xKWZbd11bT109LWZbd11bT107bFtPXT0tbFtPXX19cmV0dXJuIDcwMH12Kz0xLGRbdl09TyxFPWsrKHYtMSkqdi8yKzE7Zm9yKGI9MTtiPD12LTE7Yis9MSlnW0VdPWdbYl0sRSs9MTtpZih2PT09bylnW0VdPWdbb107ZWxzZXtmb3IoYj1vO2I+PXYrMTtiLT0xKXtpZihnW2JdPT09MClicmVhaztqPU1hdGgubWF4KE1hdGguYWJzKGdbYi0xXSksTWF0aC5hYnMoZ1tiXSkpLEY9TWF0aC5taW4oTWF0aC5hYnMoZ1tiLTFdKSxNYXRoLmFicyhnW2JdKSksZ1tiLTFdPj0wP0Q9TWF0aC5hYnMoaipNYXRoLnNxcnQoMStGKkYvKGoqaikpKTpEPS1NYXRoLmFicyhqKk1hdGguc3FydCgxK0YqRi8oaipqKSkpLGo9Z1tiLTFdL0QsRj1nW2JdL0Q7aWYoaj09PTEpYnJlYWs7aWYoaj09PTApe2dbYi0xXT1GKkQ7Zm9yKHc9MTt3PD1vO3crPTEpRD1lW3ddW2ItMV0sZVt3XVtiLTFdPWVbd11bYl0sZVt3XVtiXT1EfWVsc2V7Z1tiLTFdPUQsST1GLygxK2opO2Zvcih3PTE7dzw9bzt3Kz0xKUQ9aiplW3ddW2ItMV0rRiplW3ddW2JdLGVbd11bYl09SSooZVt3XVtiLTFdK0QpLWVbd11bYl0sZVt3XVtiLTFdPUR9fWdbRV09Z1t2XX1yZXR1cm4gMH1mdW5jdGlvbiBKKCl7RT1rK1QqKFQrMSkvMisxLFM9RStUO2lmKGdbU109PT0wKXJldHVybiA3OTg7aj1NYXRoLm1heChNYXRoLmFicyhnW1MtMV0pLE1hdGguYWJzKGdbU10pKSxGPU1hdGgubWluKE1hdGguYWJzKGdbUy0xXSksTWF0aC5hYnMoZ1tTXSkpLGdbUy0xXT49MD9EPU1hdGguYWJzKGoqTWF0aC5zcXJ0KDErRipGLyhqKmopKSk6RD0tTWF0aC5hYnMoaipNYXRoLnNxcnQoMStGKkYvKGoqaikpKSxqPWdbUy0xXS9ELEY9Z1tTXS9EO2lmKGo9PT0xKXJldHVybiA3OTg7aWYoaj09PTApe2ZvcihiPVQrMTtiPD12O2IrPTEpRD1nW1MtMV0sZ1tTLTFdPWdbU10sZ1tTXT1ELFMrPWI7Zm9yKGI9MTtiPD1vO2IrPTEpRD1lW2JdW1RdLGVbYl1bVF09ZVtiXVtUKzFdLGVbYl1bVCsxXT1EfWVsc2V7ST1GLygxK2opO2ZvcihiPVQrMTtiPD12O2IrPTEpRD1qKmdbUy0xXStGKmdbU10sZ1tTXT1JKihnW1MtMV0rRCktZ1tTXSxnW1MtMV09RCxTKz1iO2ZvcihiPTE7Yjw9bztiKz0xKUQ9aiplW2JdW1RdK0YqZVtiXVtUKzFdLGVbYl1bVCsxXT1JKihlW2JdW1RdK0QpLWVbYl1bVCsxXSxlW2JdW1RdPUR9cmV0dXJuIDB9ZnVuY3Rpb24gSygpe1M9RS1UO2ZvcihiPTE7Yjw9VDtiKz0xKWdbU109Z1tFXSxFKz0xLFMrPTE7cmV0dXJuIGdbQStUXT1nW0ErVCsxXSxkW1RdPWRbVCsxXSxUKz0xLFQ8dj83OTc6MH1mdW5jdGlvbiBRKCl7cmV0dXJuIGdbQSt2XT1nW0ErdisxXSxnW0ErdisxXT0wLGRbdl09MCx2LT0xLG1bMl09bVsyXSsxLDB9dmFyIGIsdyxFLFMseCxULE4sQyxrLEwsQSxPLE0sXyxELFAsSCxCLGosRixJLHEsUixVLHosVyxYO009TWF0aC5taW4obyxoKSxFPTIqbytNKihNKzUpLzIrMipoKzEsVT0xZS02MDtkbyBVKz1VLHo9MSsuMSpVLFc9MSsuMipVO3doaWxlKHo8PTF8fFc8PTEpO2ZvcihiPTE7Yjw9bztiKz0xKWdbYl09dFtiXTtmb3IoYj1vKzE7Yjw9RTtiKz0xKWdbYl09MDtmb3IoYj0xO2I8PWg7Yis9MSlkW2JdPTA7eD1bXTtpZih5WzFdPT09MCl7cyhlLG4sbyx4KTtpZih4WzFdIT09MCl7eVsxXT0yO3JldHVybn1pKGUsbixvLHQpLHIoZSxuLG8pfWVsc2V7Zm9yKHc9MTt3PD1vO3crPTEpe3Vbd109MDtmb3IoYj0xO2I8PXc7Yis9MSl1W3ddPXVbd10rZVtiXVt3XSp0W2JdfWZvcih3PTE7dzw9bzt3Kz0xKXt0W3ddPTA7Zm9yKGI9dztiPD1vO2IrPTEpdFt3XT10W3ddK2Vbd11bYl0qdVtiXX19YVsxXT0wO2Zvcih3PTE7dzw9bzt3Kz0xKXt1W3ddPXRbd10sYVsxXT1hWzFdK2dbd10qdVt3XSxnW3ddPTA7Zm9yKGI9dysxO2I8PW87Yis9MSllW2JdW3ddPTB9YVsxXT0tYVsxXS8yLHlbMV09MCxOPW8sQz1OK28sQT1DK00saz1BK00rMSxMPWsrTSooTSsxKS8yLF89TCtoO2ZvcihiPTE7Yjw9aDtiKz0xKXtQPTA7Zm9yKHc9MTt3PD1vO3crPTEpUCs9Zlt3XVtiXSpmW3ddW2JdO2dbXytiXT1NYXRoLnNxcnQoUCl9dj0wLG1bMV09MCxtWzJdPTAsWD0wO2Zvcig7Oyl7WD1WKCk7aWYoWD09PTk5OSlyZXR1cm47Zm9yKDs7KXtYPSQoKTtpZihYPT09MClicmVhaztpZihYPT09OTk5KXJldHVybjtpZihYPT09NzAwKWlmKFQ9PT12KVEoKTtlbHNle2Zvcig7Oyl7SigpLFg9SygpO2lmKFghPT03OTcpYnJlYWt9USgpfX19fWZ1bmN0aW9uIHUoZSxyLGkscyx1LGEpe2U9dChlKSxyPXQociksaT10KGkpO3ZhciBmLGwsYyxoLHAsZD1bXSx2PVtdLG09W10sZz1bXSx5PVtdLGI7dT11fHwwLGE9YT90KGEpOlt1bmRlZmluZWQsMF0scz1zP3Qocyk6W10sbD1lLmxlbmd0aC0xLGM9aVsxXS5sZW5ndGgtMTtpZighcylmb3IoZj0xO2Y8PWM7Zis9MSlzW2ZdPTA7Zm9yKGY9MTtmPD1jO2YrPTEpdltmXT0wO2g9MCxwPU1hdGgubWluKGwsYyk7Zm9yKGY9MTtmPD1sO2YrPTEpbVtmXT0wO2RbMV09MDtmb3IoZj0xO2Y8PTIqbCtwKihwKzUpLzIrMipjKzE7Zis9MSlnW2ZdPTA7Zm9yKGY9MTtmPD0yO2YrPTEpeVtmXT0wO3JldHVybiBvKGUscixsLGwsbSxkLGkscyxsLGMsdSx2LGgseSxnLGEpLGI9XCJcIixhWzFdPT09MSYmKGI9XCJjb25zdHJhaW50cyBhcmUgaW5jb25zaXN0ZW50LCBubyBzb2x1dGlvbiFcIiksYVsxXT09PTImJihiPVwibWF0cml4IEQgaW4gcXVhZHJhdGljIGZ1bmN0aW9uIGlzIG5vdCBwb3NpdGl2ZSBkZWZpbml0ZSFcIikse3NvbHV0aW9uOm4obSksdmFsdWU6bihkKSx1bmNvbnN0cmFpbmVkX3NvbHV0aW9uOm4ociksaXRlcmF0aW9uczpuKHkpLGlhY3Q6bih2KSxtZXNzYWdlOmJ9fWUuc29sdmVRUD11fShudW1lcmljKSxudW1lcmljLnN2ZD1mdW5jdGlvbih0KXtmdW5jdGlvbiBnKGUsdCl7cmV0dXJuIGU9TWF0aC5hYnMoZSksdD1NYXRoLmFicyh0KSxlPnQ/ZSpNYXRoLnNxcnQoMSt0KnQvZS9lKTp0PT0wP2U6dCpNYXRoLnNxcnQoMStlKmUvdC90KX12YXIgbixyPW51bWVyaWMuZXBzaWxvbixpPTFlLTY0L3Iscz01MCxvPTAsdT0wLGE9MCxmPTAsbD0wLGM9bnVtZXJpYy5jbG9uZSh0KSxoPWMubGVuZ3RoLHA9Y1swXS5sZW5ndGg7aWYoaDxwKXRocm93XCJOZWVkIG1vcmUgcm93cyB0aGFuIGNvbHVtbnNcIjt2YXIgZD1uZXcgQXJyYXkocCksdj1uZXcgQXJyYXkocCk7Zm9yKHU9MDt1PHA7dSsrKWRbdV09dlt1XT0wO3ZhciBtPW51bWVyaWMucmVwKFtwLHBdLDApLHk9MCxiPTAsdz0wLEU9MCxTPTAseD0wLFQ9MDtmb3IodT0wO3U8cDt1Kyspe2RbdV09YixUPTAsbD11KzE7Zm9yKGE9dTthPGg7YSsrKVQrPWNbYV1bdV0qY1thXVt1XTtpZihUPD1pKWI9MDtlbHNle3k9Y1t1XVt1XSxiPU1hdGguc3FydChUKSx5Pj0wJiYoYj0tYiksdz15KmItVCxjW3VdW3VdPXktYjtmb3IoYT1sO2E8cDthKyspe1Q9MDtmb3IoZj11O2Y8aDtmKyspVCs9Y1tmXVt1XSpjW2ZdW2FdO3k9VC93O2ZvcihmPXU7ZjxoO2YrKyljW2ZdW2FdKz15KmNbZl1bdV19fXZbdV09YixUPTA7Zm9yKGE9bDthPHA7YSsrKVQrPWNbdV1bYV0qY1t1XVthXTtpZihUPD1pKWI9MDtlbHNle3k9Y1t1XVt1KzFdLGI9TWF0aC5zcXJ0KFQpLHk+PTAmJihiPS1iKSx3PXkqYi1ULGNbdV1bdSsxXT15LWI7Zm9yKGE9bDthPHA7YSsrKWRbYV09Y1t1XVthXS93O2ZvcihhPWw7YTxoO2ErKyl7VD0wO2ZvcihmPWw7ZjxwO2YrKylUKz1jW2FdW2ZdKmNbdV1bZl07Zm9yKGY9bDtmPHA7ZisrKWNbYV1bZl0rPVQqZFtmXX19Uz1NYXRoLmFicyh2W3VdKStNYXRoLmFicyhkW3VdKSxTPkUmJihFPVMpfWZvcih1PXAtMTt1IT0tMTt1Kz0tMSl7aWYoYiE9MCl7dz1iKmNbdV1bdSsxXTtmb3IoYT1sO2E8cDthKyspbVthXVt1XT1jW3VdW2FdL3c7Zm9yKGE9bDthPHA7YSsrKXtUPTA7Zm9yKGY9bDtmPHA7ZisrKVQrPWNbdV1bZl0qbVtmXVthXTtmb3IoZj1sO2Y8cDtmKyspbVtmXVthXSs9VCptW2ZdW3VdfX1mb3IoYT1sO2E8cDthKyspbVt1XVthXT0wLG1bYV1bdV09MDttW3VdW3VdPTEsYj1kW3VdLGw9dX1mb3IodT1wLTE7dSE9LTE7dSs9LTEpe2w9dSsxLGI9dlt1XTtmb3IoYT1sO2E8cDthKyspY1t1XVthXT0wO2lmKGIhPTApe3c9Y1t1XVt1XSpiO2ZvcihhPWw7YTxwO2ErKyl7VD0wO2ZvcihmPWw7ZjxoO2YrKylUKz1jW2ZdW3VdKmNbZl1bYV07eT1UL3c7Zm9yKGY9dTtmPGg7ZisrKWNbZl1bYV0rPXkqY1tmXVt1XX1mb3IoYT11O2E8aDthKyspY1thXVt1XT1jW2FdW3VdL2J9ZWxzZSBmb3IoYT11O2E8aDthKyspY1thXVt1XT0wO2NbdV1bdV0rPTF9cio9RTtmb3IoZj1wLTE7ZiE9LTE7Zis9LTEpZm9yKHZhciBOPTA7TjxzO04rKyl7dmFyIEM9ITE7Zm9yKGw9ZjtsIT0tMTtsKz0tMSl7aWYoTWF0aC5hYnMoZFtsXSk8PXIpe0M9ITA7YnJlYWt9aWYoTWF0aC5hYnModltsLTFdKTw9cilicmVha31pZighQyl7bz0wLFQ9MTt2YXIgaz1sLTE7Zm9yKHU9bDt1PGYrMTt1Kyspe3k9VCpkW3VdLGRbdV09bypkW3VdO2lmKE1hdGguYWJzKHkpPD1yKWJyZWFrO2I9dlt1XSx3PWcoeSxiKSx2W3VdPXcsbz1iL3csVD0teS93O2ZvcihhPTA7YTxoO2ErKylTPWNbYV1ba10seD1jW2FdW3VdLGNbYV1ba109UypvK3gqVCxjW2FdW3VdPS1TKlQreCpvfX14PXZbZl07aWYobD09Zil7aWYoeDwwKXt2W2ZdPS14O2ZvcihhPTA7YTxwO2ErKyltW2FdW2ZdPS1tW2FdW2ZdfWJyZWFrfWlmKE4+PXMtMSl0aHJvd1wiRXJyb3I6IG5vIGNvbnZlcmdlbmNlLlwiO0U9dltsXSxTPXZbZi0xXSxiPWRbZi0xXSx3PWRbZl0seT0oKFMteCkqKFMreCkrKGItdykqKGIrdykpLygyKncqUyksYj1nKHksMSkseTwwP3k9KChFLXgpKihFK3gpK3cqKFMvKHktYiktdykpL0U6eT0oKEUteCkqKEUreCkrdyooUy8oeStiKS13KSkvRSxvPTEsVD0xO2Zvcih1PWwrMTt1PGYrMTt1Kyspe2I9ZFt1XSxTPXZbdV0sdz1UKmIsYj1vKmIseD1nKHksdyksZFt1LTFdPXgsbz15L3gsVD13L3gseT1FKm8rYipULGI9LUUqVCtiKm8sdz1TKlQsUyo9bztmb3IoYT0wO2E8cDthKyspRT1tW2FdW3UtMV0seD1tW2FdW3VdLG1bYV1bdS0xXT1FKm8reCpULG1bYV1bdV09LUUqVCt4Km87eD1nKHksdyksdlt1LTFdPXgsbz15L3gsVD13L3gseT1vKmIrVCpTLEU9LVQqYitvKlM7Zm9yKGE9MDthPGg7YSsrKVM9Y1thXVt1LTFdLHg9Y1thXVt1XSxjW2FdW3UtMV09UypvK3gqVCxjW2FdW3VdPS1TKlQreCpvfWRbbF09MCxkW2ZdPXksdltmXT1FfWZvcih1PTA7dTx2Lmxlbmd0aDt1Kyspdlt1XTxyJiYodlt1XT0wKTtmb3IodT0wO3U8cDt1KyspZm9yKGE9dS0xO2E+PTA7YS0tKWlmKHZbYV08dlt1XSl7bz12W2FdLHZbYV09dlt1XSx2W3VdPW87Zm9yKGY9MDtmPGMubGVuZ3RoO2YrKyluPWNbZl1bdV0sY1tmXVt1XT1jW2ZdW2FdLGNbZl1bYV09bjtmb3IoZj0wO2Y8bS5sZW5ndGg7ZisrKW49bVtmXVt1XSxtW2ZdW3VdPW1bZl1bYV0sbVtmXVthXT1uO3U9YX1yZXR1cm57VTpjLFM6dixWOm19fTsiLCJtb2R1bGUuZXhwb3J0cyA9IHsgXCJkZWZhdWx0XCI6IHJlcXVpcmUoXCJjb3JlLWpzL2xpYnJhcnkvZm4vb2JqZWN0L2RlZmluZS1wcm9wZXJ0eVwiKSwgX19lc01vZHVsZTogdHJ1ZSB9OyIsIm1vZHVsZS5leHBvcnRzID0geyBcImRlZmF1bHRcIjogcmVxdWlyZShcImNvcmUtanMvbGlicmFyeS9mbi9zeW1ib2xcIiksIF9fZXNNb2R1bGU6IHRydWUgfTsiLCJtb2R1bGUuZXhwb3J0cyA9IHsgXCJkZWZhdWx0XCI6IHJlcXVpcmUoXCJjb3JlLWpzL2xpYnJhcnkvZm4vc3ltYm9sL2l0ZXJhdG9yXCIpLCBfX2VzTW9kdWxlOiB0cnVlIH07IiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbmV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5cbmV4cG9ydHMuZGVmYXVsdCA9IGZ1bmN0aW9uIChpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHtcbiAgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uXCIpO1xuICB9XG59OyIsIlwidXNlIHN0cmljdFwiO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuXG52YXIgX2RlZmluZVByb3BlcnR5ID0gcmVxdWlyZShcIi4uL2NvcmUtanMvb2JqZWN0L2RlZmluZS1wcm9wZXJ0eVwiKTtcblxudmFyIF9kZWZpbmVQcm9wZXJ0eTIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9kZWZpbmVQcm9wZXJ0eSk7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7IGRlZmF1bHQ6IG9iaiB9OyB9XG5cbmV4cG9ydHMuZGVmYXVsdCA9IGZ1bmN0aW9uICgpIHtcbiAgZnVuY3Rpb24gZGVmaW5lUHJvcGVydGllcyh0YXJnZXQsIHByb3BzKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIGRlc2NyaXB0b3IgPSBwcm9wc1tpXTtcbiAgICAgIGRlc2NyaXB0b3IuZW51bWVyYWJsZSA9IGRlc2NyaXB0b3IuZW51bWVyYWJsZSB8fCBmYWxzZTtcbiAgICAgIGRlc2NyaXB0b3IuY29uZmlndXJhYmxlID0gdHJ1ZTtcbiAgICAgIGlmIChcInZhbHVlXCIgaW4gZGVzY3JpcHRvcikgZGVzY3JpcHRvci53cml0YWJsZSA9IHRydWU7XG4gICAgICAoMCwgX2RlZmluZVByb3BlcnR5Mi5kZWZhdWx0KSh0YXJnZXQsIGRlc2NyaXB0b3Iua2V5LCBkZXNjcmlwdG9yKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gZnVuY3Rpb24gKENvbnN0cnVjdG9yLCBwcm90b1Byb3BzLCBzdGF0aWNQcm9wcykge1xuICAgIGlmIChwcm90b1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLnByb3RvdHlwZSwgcHJvdG9Qcm9wcyk7XG4gICAgaWYgKHN0YXRpY1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLCBzdGF0aWNQcm9wcyk7XG4gICAgcmV0dXJuIENvbnN0cnVjdG9yO1xuICB9O1xufSgpOyIsIlwidXNlIHN0cmljdFwiO1xuXG5leHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuXG52YXIgX2l0ZXJhdG9yID0gcmVxdWlyZShcIi4uL2NvcmUtanMvc3ltYm9sL2l0ZXJhdG9yXCIpO1xuXG52YXIgX2l0ZXJhdG9yMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX2l0ZXJhdG9yKTtcblxudmFyIF9zeW1ib2wgPSByZXF1aXJlKFwiLi4vY29yZS1qcy9zeW1ib2xcIik7XG5cbnZhciBfc3ltYm9sMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3N5bWJvbCk7XG5cbnZhciBfdHlwZW9mID0gdHlwZW9mIF9zeW1ib2wyLmRlZmF1bHQgPT09IFwiZnVuY3Rpb25cIiAmJiB0eXBlb2YgX2l0ZXJhdG9yMi5kZWZhdWx0ID09PSBcInN5bWJvbFwiID8gZnVuY3Rpb24gKG9iaikgeyByZXR1cm4gdHlwZW9mIG9iajsgfSA6IGZ1bmN0aW9uIChvYmopIHsgcmV0dXJuIG9iaiAmJiB0eXBlb2YgX3N5bWJvbDIuZGVmYXVsdCA9PT0gXCJmdW5jdGlvblwiICYmIG9iai5jb25zdHJ1Y3RvciA9PT0gX3N5bWJvbDIuZGVmYXVsdCA/IFwic3ltYm9sXCIgOiB0eXBlb2Ygb2JqOyB9O1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyBkZWZhdWx0OiBvYmogfTsgfVxuXG5leHBvcnRzLmRlZmF1bHQgPSB0eXBlb2YgX3N5bWJvbDIuZGVmYXVsdCA9PT0gXCJmdW5jdGlvblwiICYmIF90eXBlb2YoX2l0ZXJhdG9yMi5kZWZhdWx0KSA9PT0gXCJzeW1ib2xcIiA/IGZ1bmN0aW9uIChvYmopIHtcbiAgcmV0dXJuIHR5cGVvZiBvYmogPT09IFwidW5kZWZpbmVkXCIgPyBcInVuZGVmaW5lZFwiIDogX3R5cGVvZihvYmopO1xufSA6IGZ1bmN0aW9uIChvYmopIHtcbiAgcmV0dXJuIG9iaiAmJiB0eXBlb2YgX3N5bWJvbDIuZGVmYXVsdCA9PT0gXCJmdW5jdGlvblwiICYmIG9iai5jb25zdHJ1Y3RvciA9PT0gX3N5bWJvbDIuZGVmYXVsdCA/IFwic3ltYm9sXCIgOiB0eXBlb2Ygb2JqID09PSBcInVuZGVmaW5lZFwiID8gXCJ1bmRlZmluZWRcIiA6IF90eXBlb2Yob2JqKTtcbn07IiwicmVxdWlyZSgnLi4vLi4vbW9kdWxlcy9lczYub2JqZWN0LmRlZmluZS1wcm9wZXJ0eScpO1xudmFyICRPYmplY3QgPSByZXF1aXJlKCcuLi8uLi9tb2R1bGVzL19jb3JlJykuT2JqZWN0O1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBkZWZpbmVQcm9wZXJ0eShpdCwga2V5LCBkZXNjKXtcbiAgcmV0dXJuICRPYmplY3QuZGVmaW5lUHJvcGVydHkoaXQsIGtleSwgZGVzYyk7XG59OyIsInJlcXVpcmUoJy4uLy4uL21vZHVsZXMvZXM2LnN5bWJvbCcpO1xucmVxdWlyZSgnLi4vLi4vbW9kdWxlcy9lczYub2JqZWN0LnRvLXN0cmluZycpO1xucmVxdWlyZSgnLi4vLi4vbW9kdWxlcy9lczcuc3ltYm9sLmFzeW5jLWl0ZXJhdG9yJyk7XG5yZXF1aXJlKCcuLi8uLi9tb2R1bGVzL2VzNy5zeW1ib2wub2JzZXJ2YWJsZScpO1xubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuLi8uLi9tb2R1bGVzL19jb3JlJykuU3ltYm9sOyIsInJlcXVpcmUoJy4uLy4uL21vZHVsZXMvZXM2LnN0cmluZy5pdGVyYXRvcicpO1xucmVxdWlyZSgnLi4vLi4vbW9kdWxlcy93ZWIuZG9tLml0ZXJhYmxlJyk7XG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4uLy4uL21vZHVsZXMvX3drcy1leHQnKS5mKCdpdGVyYXRvcicpOyIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaXQpe1xuICBpZih0eXBlb2YgaXQgIT0gJ2Z1bmN0aW9uJyl0aHJvdyBUeXBlRXJyb3IoaXQgKyAnIGlzIG5vdCBhIGZ1bmN0aW9uIScpO1xuICByZXR1cm4gaXQ7XG59OyIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKXsgLyogZW1wdHkgKi8gfTsiLCJ2YXIgaXNPYmplY3QgPSByZXF1aXJlKCcuL19pcy1vYmplY3QnKTtcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaXQpe1xuICBpZighaXNPYmplY3QoaXQpKXRocm93IFR5cGVFcnJvcihpdCArICcgaXMgbm90IGFuIG9iamVjdCEnKTtcbiAgcmV0dXJuIGl0O1xufTsiLCIvLyBmYWxzZSAtPiBBcnJheSNpbmRleE9mXG4vLyB0cnVlICAtPiBBcnJheSNpbmNsdWRlc1xudmFyIHRvSU9iamVjdCA9IHJlcXVpcmUoJy4vX3RvLWlvYmplY3QnKVxuICAsIHRvTGVuZ3RoICA9IHJlcXVpcmUoJy4vX3RvLWxlbmd0aCcpXG4gICwgdG9JbmRleCAgID0gcmVxdWlyZSgnLi9fdG8taW5kZXgnKTtcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oSVNfSU5DTFVERVMpe1xuICByZXR1cm4gZnVuY3Rpb24oJHRoaXMsIGVsLCBmcm9tSW5kZXgpe1xuICAgIHZhciBPICAgICAgPSB0b0lPYmplY3QoJHRoaXMpXG4gICAgICAsIGxlbmd0aCA9IHRvTGVuZ3RoKE8ubGVuZ3RoKVxuICAgICAgLCBpbmRleCAgPSB0b0luZGV4KGZyb21JbmRleCwgbGVuZ3RoKVxuICAgICAgLCB2YWx1ZTtcbiAgICAvLyBBcnJheSNpbmNsdWRlcyB1c2VzIFNhbWVWYWx1ZVplcm8gZXF1YWxpdHkgYWxnb3JpdGhtXG4gICAgaWYoSVNfSU5DTFVERVMgJiYgZWwgIT0gZWwpd2hpbGUobGVuZ3RoID4gaW5kZXgpe1xuICAgICAgdmFsdWUgPSBPW2luZGV4KytdO1xuICAgICAgaWYodmFsdWUgIT0gdmFsdWUpcmV0dXJuIHRydWU7XG4gICAgLy8gQXJyYXkjdG9JbmRleCBpZ25vcmVzIGhvbGVzLCBBcnJheSNpbmNsdWRlcyAtIG5vdFxuICAgIH0gZWxzZSBmb3IoO2xlbmd0aCA+IGluZGV4OyBpbmRleCsrKWlmKElTX0lOQ0xVREVTIHx8IGluZGV4IGluIE8pe1xuICAgICAgaWYoT1tpbmRleF0gPT09IGVsKXJldHVybiBJU19JTkNMVURFUyB8fCBpbmRleCB8fCAwO1xuICAgIH0gcmV0dXJuICFJU19JTkNMVURFUyAmJiAtMTtcbiAgfTtcbn07IiwidmFyIHRvU3RyaW5nID0ge30udG9TdHJpbmc7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaXQpe1xuICByZXR1cm4gdG9TdHJpbmcuY2FsbChpdCkuc2xpY2UoOCwgLTEpO1xufTsiLCJ2YXIgY29yZSA9IG1vZHVsZS5leHBvcnRzID0ge3ZlcnNpb246ICcyLjQuMCd9O1xuaWYodHlwZW9mIF9fZSA9PSAnbnVtYmVyJylfX2UgPSBjb3JlOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVuZGVmIiwiLy8gb3B0aW9uYWwgLyBzaW1wbGUgY29udGV4dCBiaW5kaW5nXG52YXIgYUZ1bmN0aW9uID0gcmVxdWlyZSgnLi9fYS1mdW5jdGlvbicpO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihmbiwgdGhhdCwgbGVuZ3RoKXtcbiAgYUZ1bmN0aW9uKGZuKTtcbiAgaWYodGhhdCA9PT0gdW5kZWZpbmVkKXJldHVybiBmbjtcbiAgc3dpdGNoKGxlbmd0aCl7XG4gICAgY2FzZSAxOiByZXR1cm4gZnVuY3Rpb24oYSl7XG4gICAgICByZXR1cm4gZm4uY2FsbCh0aGF0LCBhKTtcbiAgICB9O1xuICAgIGNhc2UgMjogcmV0dXJuIGZ1bmN0aW9uKGEsIGIpe1xuICAgICAgcmV0dXJuIGZuLmNhbGwodGhhdCwgYSwgYik7XG4gICAgfTtcbiAgICBjYXNlIDM6IHJldHVybiBmdW5jdGlvbihhLCBiLCBjKXtcbiAgICAgIHJldHVybiBmbi5jYWxsKHRoYXQsIGEsIGIsIGMpO1xuICAgIH07XG4gIH1cbiAgcmV0dXJuIGZ1bmN0aW9uKC8qIC4uLmFyZ3MgKi8pe1xuICAgIHJldHVybiBmbi5hcHBseSh0aGF0LCBhcmd1bWVudHMpO1xuICB9O1xufTsiLCIvLyA3LjIuMSBSZXF1aXJlT2JqZWN0Q29lcmNpYmxlKGFyZ3VtZW50KVxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpdCl7XG4gIGlmKGl0ID09IHVuZGVmaW5lZCl0aHJvdyBUeXBlRXJyb3IoXCJDYW4ndCBjYWxsIG1ldGhvZCBvbiAgXCIgKyBpdCk7XG4gIHJldHVybiBpdDtcbn07IiwiLy8gVGhhbmsncyBJRTggZm9yIGhpcyBmdW5ueSBkZWZpbmVQcm9wZXJ0eVxubW9kdWxlLmV4cG9ydHMgPSAhcmVxdWlyZSgnLi9fZmFpbHMnKShmdW5jdGlvbigpe1xuICByZXR1cm4gT2JqZWN0LmRlZmluZVByb3BlcnR5KHt9LCAnYScsIHtnZXQ6IGZ1bmN0aW9uKCl7IHJldHVybiA3OyB9fSkuYSAhPSA3O1xufSk7IiwidmFyIGlzT2JqZWN0ID0gcmVxdWlyZSgnLi9faXMtb2JqZWN0JylcbiAgLCBkb2N1bWVudCA9IHJlcXVpcmUoJy4vX2dsb2JhbCcpLmRvY3VtZW50XG4gIC8vIGluIG9sZCBJRSB0eXBlb2YgZG9jdW1lbnQuY3JlYXRlRWxlbWVudCBpcyAnb2JqZWN0J1xuICAsIGlzID0gaXNPYmplY3QoZG9jdW1lbnQpICYmIGlzT2JqZWN0KGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQpO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpdCl7XG4gIHJldHVybiBpcyA/IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoaXQpIDoge307XG59OyIsIi8vIElFIDgtIGRvbid0IGVudW0gYnVnIGtleXNcclxubW9kdWxlLmV4cG9ydHMgPSAoXHJcbiAgJ2NvbnN0cnVjdG9yLGhhc093blByb3BlcnR5LGlzUHJvdG90eXBlT2YscHJvcGVydHlJc0VudW1lcmFibGUsdG9Mb2NhbGVTdHJpbmcsdG9TdHJpbmcsdmFsdWVPZidcclxuKS5zcGxpdCgnLCcpOyIsIi8vIGFsbCBlbnVtZXJhYmxlIG9iamVjdCBrZXlzLCBpbmNsdWRlcyBzeW1ib2xzXG52YXIgZ2V0S2V5cyA9IHJlcXVpcmUoJy4vX29iamVjdC1rZXlzJylcbiAgLCBnT1BTICAgID0gcmVxdWlyZSgnLi9fb2JqZWN0LWdvcHMnKVxuICAsIHBJRSAgICAgPSByZXF1aXJlKCcuL19vYmplY3QtcGllJyk7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGl0KXtcbiAgdmFyIHJlc3VsdCAgICAgPSBnZXRLZXlzKGl0KVxuICAgICwgZ2V0U3ltYm9scyA9IGdPUFMuZjtcbiAgaWYoZ2V0U3ltYm9scyl7XG4gICAgdmFyIHN5bWJvbHMgPSBnZXRTeW1ib2xzKGl0KVxuICAgICAgLCBpc0VudW0gID0gcElFLmZcbiAgICAgICwgaSAgICAgICA9IDBcbiAgICAgICwga2V5O1xuICAgIHdoaWxlKHN5bWJvbHMubGVuZ3RoID4gaSlpZihpc0VudW0uY2FsbChpdCwga2V5ID0gc3ltYm9sc1tpKytdKSlyZXN1bHQucHVzaChrZXkpO1xuICB9IHJldHVybiByZXN1bHQ7XG59OyIsInZhciBnbG9iYWwgICAgPSByZXF1aXJlKCcuL19nbG9iYWwnKVxuICAsIGNvcmUgICAgICA9IHJlcXVpcmUoJy4vX2NvcmUnKVxuICAsIGN0eCAgICAgICA9IHJlcXVpcmUoJy4vX2N0eCcpXG4gICwgaGlkZSAgICAgID0gcmVxdWlyZSgnLi9faGlkZScpXG4gICwgUFJPVE9UWVBFID0gJ3Byb3RvdHlwZSc7XG5cbnZhciAkZXhwb3J0ID0gZnVuY3Rpb24odHlwZSwgbmFtZSwgc291cmNlKXtcbiAgdmFyIElTX0ZPUkNFRCA9IHR5cGUgJiAkZXhwb3J0LkZcbiAgICAsIElTX0dMT0JBTCA9IHR5cGUgJiAkZXhwb3J0LkdcbiAgICAsIElTX1NUQVRJQyA9IHR5cGUgJiAkZXhwb3J0LlNcbiAgICAsIElTX1BST1RPICA9IHR5cGUgJiAkZXhwb3J0LlBcbiAgICAsIElTX0JJTkQgICA9IHR5cGUgJiAkZXhwb3J0LkJcbiAgICAsIElTX1dSQVAgICA9IHR5cGUgJiAkZXhwb3J0LldcbiAgICAsIGV4cG9ydHMgICA9IElTX0dMT0JBTCA/IGNvcmUgOiBjb3JlW25hbWVdIHx8IChjb3JlW25hbWVdID0ge30pXG4gICAgLCBleHBQcm90byAgPSBleHBvcnRzW1BST1RPVFlQRV1cbiAgICAsIHRhcmdldCAgICA9IElTX0dMT0JBTCA/IGdsb2JhbCA6IElTX1NUQVRJQyA/IGdsb2JhbFtuYW1lXSA6IChnbG9iYWxbbmFtZV0gfHwge30pW1BST1RPVFlQRV1cbiAgICAsIGtleSwgb3duLCBvdXQ7XG4gIGlmKElTX0dMT0JBTClzb3VyY2UgPSBuYW1lO1xuICBmb3Ioa2V5IGluIHNvdXJjZSl7XG4gICAgLy8gY29udGFpbnMgaW4gbmF0aXZlXG4gICAgb3duID0gIUlTX0ZPUkNFRCAmJiB0YXJnZXQgJiYgdGFyZ2V0W2tleV0gIT09IHVuZGVmaW5lZDtcbiAgICBpZihvd24gJiYga2V5IGluIGV4cG9ydHMpY29udGludWU7XG4gICAgLy8gZXhwb3J0IG5hdGl2ZSBvciBwYXNzZWRcbiAgICBvdXQgPSBvd24gPyB0YXJnZXRba2V5XSA6IHNvdXJjZVtrZXldO1xuICAgIC8vIHByZXZlbnQgZ2xvYmFsIHBvbGx1dGlvbiBmb3IgbmFtZXNwYWNlc1xuICAgIGV4cG9ydHNba2V5XSA9IElTX0dMT0JBTCAmJiB0eXBlb2YgdGFyZ2V0W2tleV0gIT0gJ2Z1bmN0aW9uJyA/IHNvdXJjZVtrZXldXG4gICAgLy8gYmluZCB0aW1lcnMgdG8gZ2xvYmFsIGZvciBjYWxsIGZyb20gZXhwb3J0IGNvbnRleHRcbiAgICA6IElTX0JJTkQgJiYgb3duID8gY3R4KG91dCwgZ2xvYmFsKVxuICAgIC8vIHdyYXAgZ2xvYmFsIGNvbnN0cnVjdG9ycyBmb3IgcHJldmVudCBjaGFuZ2UgdGhlbSBpbiBsaWJyYXJ5XG4gICAgOiBJU19XUkFQICYmIHRhcmdldFtrZXldID09IG91dCA/IChmdW5jdGlvbihDKXtcbiAgICAgIHZhciBGID0gZnVuY3Rpb24oYSwgYiwgYyl7XG4gICAgICAgIGlmKHRoaXMgaW5zdGFuY2VvZiBDKXtcbiAgICAgICAgICBzd2l0Y2goYXJndW1lbnRzLmxlbmd0aCl7XG4gICAgICAgICAgICBjYXNlIDA6IHJldHVybiBuZXcgQztcbiAgICAgICAgICAgIGNhc2UgMTogcmV0dXJuIG5ldyBDKGEpO1xuICAgICAgICAgICAgY2FzZSAyOiByZXR1cm4gbmV3IEMoYSwgYik7XG4gICAgICAgICAgfSByZXR1cm4gbmV3IEMoYSwgYiwgYyk7XG4gICAgICAgIH0gcmV0dXJuIEMuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgIH07XG4gICAgICBGW1BST1RPVFlQRV0gPSBDW1BST1RPVFlQRV07XG4gICAgICByZXR1cm4gRjtcbiAgICAvLyBtYWtlIHN0YXRpYyB2ZXJzaW9ucyBmb3IgcHJvdG90eXBlIG1ldGhvZHNcbiAgICB9KShvdXQpIDogSVNfUFJPVE8gJiYgdHlwZW9mIG91dCA9PSAnZnVuY3Rpb24nID8gY3R4KEZ1bmN0aW9uLmNhbGwsIG91dCkgOiBvdXQ7XG4gICAgLy8gZXhwb3J0IHByb3RvIG1ldGhvZHMgdG8gY29yZS4lQ09OU1RSVUNUT1IlLm1ldGhvZHMuJU5BTUUlXG4gICAgaWYoSVNfUFJPVE8pe1xuICAgICAgKGV4cG9ydHMudmlydHVhbCB8fCAoZXhwb3J0cy52aXJ0dWFsID0ge30pKVtrZXldID0gb3V0O1xuICAgICAgLy8gZXhwb3J0IHByb3RvIG1ldGhvZHMgdG8gY29yZS4lQ09OU1RSVUNUT1IlLnByb3RvdHlwZS4lTkFNRSVcbiAgICAgIGlmKHR5cGUgJiAkZXhwb3J0LlIgJiYgZXhwUHJvdG8gJiYgIWV4cFByb3RvW2tleV0paGlkZShleHBQcm90bywga2V5LCBvdXQpO1xuICAgIH1cbiAgfVxufTtcbi8vIHR5cGUgYml0bWFwXG4kZXhwb3J0LkYgPSAxOyAgIC8vIGZvcmNlZFxuJGV4cG9ydC5HID0gMjsgICAvLyBnbG9iYWxcbiRleHBvcnQuUyA9IDQ7ICAgLy8gc3RhdGljXG4kZXhwb3J0LlAgPSA4OyAgIC8vIHByb3RvXG4kZXhwb3J0LkIgPSAxNjsgIC8vIGJpbmRcbiRleHBvcnQuVyA9IDMyOyAgLy8gd3JhcFxuJGV4cG9ydC5VID0gNjQ7ICAvLyBzYWZlXG4kZXhwb3J0LlIgPSAxMjg7IC8vIHJlYWwgcHJvdG8gbWV0aG9kIGZvciBgbGlicmFyeWAgXG5tb2R1bGUuZXhwb3J0cyA9ICRleHBvcnQ7IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihleGVjKXtcbiAgdHJ5IHtcbiAgICByZXR1cm4gISFleGVjKCk7XG4gIH0gY2F0Y2goZSl7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbn07IiwiLy8gaHR0cHM6Ly9naXRodWIuY29tL3psb2lyb2NrL2NvcmUtanMvaXNzdWVzLzg2I2lzc3VlY29tbWVudC0xMTU3NTkwMjhcbnZhciBnbG9iYWwgPSBtb2R1bGUuZXhwb3J0cyA9IHR5cGVvZiB3aW5kb3cgIT0gJ3VuZGVmaW5lZCcgJiYgd2luZG93Lk1hdGggPT0gTWF0aFxuICA/IHdpbmRvdyA6IHR5cGVvZiBzZWxmICE9ICd1bmRlZmluZWQnICYmIHNlbGYuTWF0aCA9PSBNYXRoID8gc2VsZiA6IEZ1bmN0aW9uKCdyZXR1cm4gdGhpcycpKCk7XG5pZih0eXBlb2YgX19nID09ICdudW1iZXInKV9fZyA9IGdsb2JhbDsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bmRlZiIsInZhciBoYXNPd25Qcm9wZXJ0eSA9IHt9Lmhhc093blByb3BlcnR5O1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpdCwga2V5KXtcbiAgcmV0dXJuIGhhc093blByb3BlcnR5LmNhbGwoaXQsIGtleSk7XG59OyIsInZhciBkUCAgICAgICAgID0gcmVxdWlyZSgnLi9fb2JqZWN0LWRwJylcbiAgLCBjcmVhdGVEZXNjID0gcmVxdWlyZSgnLi9fcHJvcGVydHktZGVzYycpO1xubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL19kZXNjcmlwdG9ycycpID8gZnVuY3Rpb24ob2JqZWN0LCBrZXksIHZhbHVlKXtcbiAgcmV0dXJuIGRQLmYob2JqZWN0LCBrZXksIGNyZWF0ZURlc2MoMSwgdmFsdWUpKTtcbn0gOiBmdW5jdGlvbihvYmplY3QsIGtleSwgdmFsdWUpe1xuICBvYmplY3Rba2V5XSA9IHZhbHVlO1xuICByZXR1cm4gb2JqZWN0O1xufTsiLCJtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vX2dsb2JhbCcpLmRvY3VtZW50ICYmIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudDsiLCJtb2R1bGUuZXhwb3J0cyA9ICFyZXF1aXJlKCcuL19kZXNjcmlwdG9ycycpICYmICFyZXF1aXJlKCcuL19mYWlscycpKGZ1bmN0aW9uKCl7XHJcbiAgcmV0dXJuIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShyZXF1aXJlKCcuL19kb20tY3JlYXRlJykoJ2RpdicpLCAnYScsIHtnZXQ6IGZ1bmN0aW9uKCl7IHJldHVybiA3OyB9fSkuYSAhPSA3O1xyXG59KTsiLCIvLyBmYWxsYmFjayBmb3Igbm9uLWFycmF5LWxpa2UgRVMzIGFuZCBub24tZW51bWVyYWJsZSBvbGQgVjggc3RyaW5nc1xudmFyIGNvZiA9IHJlcXVpcmUoJy4vX2NvZicpO1xubW9kdWxlLmV4cG9ydHMgPSBPYmplY3QoJ3onKS5wcm9wZXJ0eUlzRW51bWVyYWJsZSgwKSA/IE9iamVjdCA6IGZ1bmN0aW9uKGl0KXtcbiAgcmV0dXJuIGNvZihpdCkgPT0gJ1N0cmluZycgPyBpdC5zcGxpdCgnJykgOiBPYmplY3QoaXQpO1xufTsiLCIvLyA3LjIuMiBJc0FycmF5KGFyZ3VtZW50KVxudmFyIGNvZiA9IHJlcXVpcmUoJy4vX2NvZicpO1xubW9kdWxlLmV4cG9ydHMgPSBBcnJheS5pc0FycmF5IHx8IGZ1bmN0aW9uIGlzQXJyYXkoYXJnKXtcbiAgcmV0dXJuIGNvZihhcmcpID09ICdBcnJheSc7XG59OyIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaXQpe1xuICByZXR1cm4gdHlwZW9mIGl0ID09PSAnb2JqZWN0JyA/IGl0ICE9PSBudWxsIDogdHlwZW9mIGl0ID09PSAnZnVuY3Rpb24nO1xufTsiLCIndXNlIHN0cmljdCc7XG52YXIgY3JlYXRlICAgICAgICAgPSByZXF1aXJlKCcuL19vYmplY3QtY3JlYXRlJylcbiAgLCBkZXNjcmlwdG9yICAgICA9IHJlcXVpcmUoJy4vX3Byb3BlcnR5LWRlc2MnKVxuICAsIHNldFRvU3RyaW5nVGFnID0gcmVxdWlyZSgnLi9fc2V0LXRvLXN0cmluZy10YWcnKVxuICAsIEl0ZXJhdG9yUHJvdG90eXBlID0ge307XG5cbi8vIDI1LjEuMi4xLjEgJUl0ZXJhdG9yUHJvdG90eXBlJVtAQGl0ZXJhdG9yXSgpXG5yZXF1aXJlKCcuL19oaWRlJykoSXRlcmF0b3JQcm90b3R5cGUsIHJlcXVpcmUoJy4vX3drcycpKCdpdGVyYXRvcicpLCBmdW5jdGlvbigpeyByZXR1cm4gdGhpczsgfSk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oQ29uc3RydWN0b3IsIE5BTUUsIG5leHQpe1xuICBDb25zdHJ1Y3Rvci5wcm90b3R5cGUgPSBjcmVhdGUoSXRlcmF0b3JQcm90b3R5cGUsIHtuZXh0OiBkZXNjcmlwdG9yKDEsIG5leHQpfSk7XG4gIHNldFRvU3RyaW5nVGFnKENvbnN0cnVjdG9yLCBOQU1FICsgJyBJdGVyYXRvcicpO1xufTsiLCIndXNlIHN0cmljdCc7XG52YXIgTElCUkFSWSAgICAgICAgPSByZXF1aXJlKCcuL19saWJyYXJ5JylcbiAgLCAkZXhwb3J0ICAgICAgICA9IHJlcXVpcmUoJy4vX2V4cG9ydCcpXG4gICwgcmVkZWZpbmUgICAgICAgPSByZXF1aXJlKCcuL19yZWRlZmluZScpXG4gICwgaGlkZSAgICAgICAgICAgPSByZXF1aXJlKCcuL19oaWRlJylcbiAgLCBoYXMgICAgICAgICAgICA9IHJlcXVpcmUoJy4vX2hhcycpXG4gICwgSXRlcmF0b3JzICAgICAgPSByZXF1aXJlKCcuL19pdGVyYXRvcnMnKVxuICAsICRpdGVyQ3JlYXRlICAgID0gcmVxdWlyZSgnLi9faXRlci1jcmVhdGUnKVxuICAsIHNldFRvU3RyaW5nVGFnID0gcmVxdWlyZSgnLi9fc2V0LXRvLXN0cmluZy10YWcnKVxuICAsIGdldFByb3RvdHlwZU9mID0gcmVxdWlyZSgnLi9fb2JqZWN0LWdwbycpXG4gICwgSVRFUkFUT1IgICAgICAgPSByZXF1aXJlKCcuL193a3MnKSgnaXRlcmF0b3InKVxuICAsIEJVR0dZICAgICAgICAgID0gIShbXS5rZXlzICYmICduZXh0JyBpbiBbXS5rZXlzKCkpIC8vIFNhZmFyaSBoYXMgYnVnZ3kgaXRlcmF0b3JzIHcvbyBgbmV4dGBcbiAgLCBGRl9JVEVSQVRPUiAgICA9ICdAQGl0ZXJhdG9yJ1xuICAsIEtFWVMgICAgICAgICAgID0gJ2tleXMnXG4gICwgVkFMVUVTICAgICAgICAgPSAndmFsdWVzJztcblxudmFyIHJldHVyblRoaXMgPSBmdW5jdGlvbigpeyByZXR1cm4gdGhpczsgfTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihCYXNlLCBOQU1FLCBDb25zdHJ1Y3RvciwgbmV4dCwgREVGQVVMVCwgSVNfU0VULCBGT1JDRUQpe1xuICAkaXRlckNyZWF0ZShDb25zdHJ1Y3RvciwgTkFNRSwgbmV4dCk7XG4gIHZhciBnZXRNZXRob2QgPSBmdW5jdGlvbihraW5kKXtcbiAgICBpZighQlVHR1kgJiYga2luZCBpbiBwcm90bylyZXR1cm4gcHJvdG9ba2luZF07XG4gICAgc3dpdGNoKGtpbmQpe1xuICAgICAgY2FzZSBLRVlTOiByZXR1cm4gZnVuY3Rpb24ga2V5cygpeyByZXR1cm4gbmV3IENvbnN0cnVjdG9yKHRoaXMsIGtpbmQpOyB9O1xuICAgICAgY2FzZSBWQUxVRVM6IHJldHVybiBmdW5jdGlvbiB2YWx1ZXMoKXsgcmV0dXJuIG5ldyBDb25zdHJ1Y3Rvcih0aGlzLCBraW5kKTsgfTtcbiAgICB9IHJldHVybiBmdW5jdGlvbiBlbnRyaWVzKCl7IHJldHVybiBuZXcgQ29uc3RydWN0b3IodGhpcywga2luZCk7IH07XG4gIH07XG4gIHZhciBUQUcgICAgICAgID0gTkFNRSArICcgSXRlcmF0b3InXG4gICAgLCBERUZfVkFMVUVTID0gREVGQVVMVCA9PSBWQUxVRVNcbiAgICAsIFZBTFVFU19CVUcgPSBmYWxzZVxuICAgICwgcHJvdG8gICAgICA9IEJhc2UucHJvdG90eXBlXG4gICAgLCAkbmF0aXZlICAgID0gcHJvdG9bSVRFUkFUT1JdIHx8IHByb3RvW0ZGX0lURVJBVE9SXSB8fCBERUZBVUxUICYmIHByb3RvW0RFRkFVTFRdXG4gICAgLCAkZGVmYXVsdCAgID0gJG5hdGl2ZSB8fCBnZXRNZXRob2QoREVGQVVMVClcbiAgICAsICRlbnRyaWVzICAgPSBERUZBVUxUID8gIURFRl9WQUxVRVMgPyAkZGVmYXVsdCA6IGdldE1ldGhvZCgnZW50cmllcycpIDogdW5kZWZpbmVkXG4gICAgLCAkYW55TmF0aXZlID0gTkFNRSA9PSAnQXJyYXknID8gcHJvdG8uZW50cmllcyB8fCAkbmF0aXZlIDogJG5hdGl2ZVxuICAgICwgbWV0aG9kcywga2V5LCBJdGVyYXRvclByb3RvdHlwZTtcbiAgLy8gRml4IG5hdGl2ZVxuICBpZigkYW55TmF0aXZlKXtcbiAgICBJdGVyYXRvclByb3RvdHlwZSA9IGdldFByb3RvdHlwZU9mKCRhbnlOYXRpdmUuY2FsbChuZXcgQmFzZSkpO1xuICAgIGlmKEl0ZXJhdG9yUHJvdG90eXBlICE9PSBPYmplY3QucHJvdG90eXBlKXtcbiAgICAgIC8vIFNldCBAQHRvU3RyaW5nVGFnIHRvIG5hdGl2ZSBpdGVyYXRvcnNcbiAgICAgIHNldFRvU3RyaW5nVGFnKEl0ZXJhdG9yUHJvdG90eXBlLCBUQUcsIHRydWUpO1xuICAgICAgLy8gZml4IGZvciBzb21lIG9sZCBlbmdpbmVzXG4gICAgICBpZighTElCUkFSWSAmJiAhaGFzKEl0ZXJhdG9yUHJvdG90eXBlLCBJVEVSQVRPUikpaGlkZShJdGVyYXRvclByb3RvdHlwZSwgSVRFUkFUT1IsIHJldHVyblRoaXMpO1xuICAgIH1cbiAgfVxuICAvLyBmaXggQXJyYXkje3ZhbHVlcywgQEBpdGVyYXRvcn0ubmFtZSBpbiBWOCAvIEZGXG4gIGlmKERFRl9WQUxVRVMgJiYgJG5hdGl2ZSAmJiAkbmF0aXZlLm5hbWUgIT09IFZBTFVFUyl7XG4gICAgVkFMVUVTX0JVRyA9IHRydWU7XG4gICAgJGRlZmF1bHQgPSBmdW5jdGlvbiB2YWx1ZXMoKXsgcmV0dXJuICRuYXRpdmUuY2FsbCh0aGlzKTsgfTtcbiAgfVxuICAvLyBEZWZpbmUgaXRlcmF0b3JcbiAgaWYoKCFMSUJSQVJZIHx8IEZPUkNFRCkgJiYgKEJVR0dZIHx8IFZBTFVFU19CVUcgfHwgIXByb3RvW0lURVJBVE9SXSkpe1xuICAgIGhpZGUocHJvdG8sIElURVJBVE9SLCAkZGVmYXVsdCk7XG4gIH1cbiAgLy8gUGx1ZyBmb3IgbGlicmFyeVxuICBJdGVyYXRvcnNbTkFNRV0gPSAkZGVmYXVsdDtcbiAgSXRlcmF0b3JzW1RBR10gID0gcmV0dXJuVGhpcztcbiAgaWYoREVGQVVMVCl7XG4gICAgbWV0aG9kcyA9IHtcbiAgICAgIHZhbHVlczogIERFRl9WQUxVRVMgPyAkZGVmYXVsdCA6IGdldE1ldGhvZChWQUxVRVMpLFxuICAgICAga2V5czogICAgSVNfU0VUICAgICA/ICRkZWZhdWx0IDogZ2V0TWV0aG9kKEtFWVMpLFxuICAgICAgZW50cmllczogJGVudHJpZXNcbiAgICB9O1xuICAgIGlmKEZPUkNFRClmb3Ioa2V5IGluIG1ldGhvZHMpe1xuICAgICAgaWYoIShrZXkgaW4gcHJvdG8pKXJlZGVmaW5lKHByb3RvLCBrZXksIG1ldGhvZHNba2V5XSk7XG4gICAgfSBlbHNlICRleHBvcnQoJGV4cG9ydC5QICsgJGV4cG9ydC5GICogKEJVR0dZIHx8IFZBTFVFU19CVUcpLCBOQU1FLCBtZXRob2RzKTtcbiAgfVxuICByZXR1cm4gbWV0aG9kcztcbn07IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihkb25lLCB2YWx1ZSl7XG4gIHJldHVybiB7dmFsdWU6IHZhbHVlLCBkb25lOiAhIWRvbmV9O1xufTsiLCJtb2R1bGUuZXhwb3J0cyA9IHt9OyIsInZhciBnZXRLZXlzICAgPSByZXF1aXJlKCcuL19vYmplY3Qta2V5cycpXG4gICwgdG9JT2JqZWN0ID0gcmVxdWlyZSgnLi9fdG8taW9iamVjdCcpO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihvYmplY3QsIGVsKXtcbiAgdmFyIE8gICAgICA9IHRvSU9iamVjdChvYmplY3QpXG4gICAgLCBrZXlzICAgPSBnZXRLZXlzKE8pXG4gICAgLCBsZW5ndGggPSBrZXlzLmxlbmd0aFxuICAgICwgaW5kZXggID0gMFxuICAgICwga2V5O1xuICB3aGlsZShsZW5ndGggPiBpbmRleClpZihPW2tleSA9IGtleXNbaW5kZXgrK11dID09PSBlbClyZXR1cm4ga2V5O1xufTsiLCJtb2R1bGUuZXhwb3J0cyA9IHRydWU7IiwidmFyIE1FVEEgICAgID0gcmVxdWlyZSgnLi9fdWlkJykoJ21ldGEnKVxuICAsIGlzT2JqZWN0ID0gcmVxdWlyZSgnLi9faXMtb2JqZWN0JylcbiAgLCBoYXMgICAgICA9IHJlcXVpcmUoJy4vX2hhcycpXG4gICwgc2V0RGVzYyAgPSByZXF1aXJlKCcuL19vYmplY3QtZHAnKS5mXG4gICwgaWQgICAgICAgPSAwO1xudmFyIGlzRXh0ZW5zaWJsZSA9IE9iamVjdC5pc0V4dGVuc2libGUgfHwgZnVuY3Rpb24oKXtcbiAgcmV0dXJuIHRydWU7XG59O1xudmFyIEZSRUVaRSA9ICFyZXF1aXJlKCcuL19mYWlscycpKGZ1bmN0aW9uKCl7XG4gIHJldHVybiBpc0V4dGVuc2libGUoT2JqZWN0LnByZXZlbnRFeHRlbnNpb25zKHt9KSk7XG59KTtcbnZhciBzZXRNZXRhID0gZnVuY3Rpb24oaXQpe1xuICBzZXREZXNjKGl0LCBNRVRBLCB7dmFsdWU6IHtcbiAgICBpOiAnTycgKyArK2lkLCAvLyBvYmplY3QgSURcbiAgICB3OiB7fSAgICAgICAgICAvLyB3ZWFrIGNvbGxlY3Rpb25zIElEc1xuICB9fSk7XG59O1xudmFyIGZhc3RLZXkgPSBmdW5jdGlvbihpdCwgY3JlYXRlKXtcbiAgLy8gcmV0dXJuIHByaW1pdGl2ZSB3aXRoIHByZWZpeFxuICBpZighaXNPYmplY3QoaXQpKXJldHVybiB0eXBlb2YgaXQgPT0gJ3N5bWJvbCcgPyBpdCA6ICh0eXBlb2YgaXQgPT0gJ3N0cmluZycgPyAnUycgOiAnUCcpICsgaXQ7XG4gIGlmKCFoYXMoaXQsIE1FVEEpKXtcbiAgICAvLyBjYW4ndCBzZXQgbWV0YWRhdGEgdG8gdW5jYXVnaHQgZnJvemVuIG9iamVjdFxuICAgIGlmKCFpc0V4dGVuc2libGUoaXQpKXJldHVybiAnRic7XG4gICAgLy8gbm90IG5lY2Vzc2FyeSB0byBhZGQgbWV0YWRhdGFcbiAgICBpZighY3JlYXRlKXJldHVybiAnRSc7XG4gICAgLy8gYWRkIG1pc3NpbmcgbWV0YWRhdGFcbiAgICBzZXRNZXRhKGl0KTtcbiAgLy8gcmV0dXJuIG9iamVjdCBJRFxuICB9IHJldHVybiBpdFtNRVRBXS5pO1xufTtcbnZhciBnZXRXZWFrID0gZnVuY3Rpb24oaXQsIGNyZWF0ZSl7XG4gIGlmKCFoYXMoaXQsIE1FVEEpKXtcbiAgICAvLyBjYW4ndCBzZXQgbWV0YWRhdGEgdG8gdW5jYXVnaHQgZnJvemVuIG9iamVjdFxuICAgIGlmKCFpc0V4dGVuc2libGUoaXQpKXJldHVybiB0cnVlO1xuICAgIC8vIG5vdCBuZWNlc3NhcnkgdG8gYWRkIG1ldGFkYXRhXG4gICAgaWYoIWNyZWF0ZSlyZXR1cm4gZmFsc2U7XG4gICAgLy8gYWRkIG1pc3NpbmcgbWV0YWRhdGFcbiAgICBzZXRNZXRhKGl0KTtcbiAgLy8gcmV0dXJuIGhhc2ggd2VhayBjb2xsZWN0aW9ucyBJRHNcbiAgfSByZXR1cm4gaXRbTUVUQV0udztcbn07XG4vLyBhZGQgbWV0YWRhdGEgb24gZnJlZXplLWZhbWlseSBtZXRob2RzIGNhbGxpbmdcbnZhciBvbkZyZWV6ZSA9IGZ1bmN0aW9uKGl0KXtcbiAgaWYoRlJFRVpFICYmIG1ldGEuTkVFRCAmJiBpc0V4dGVuc2libGUoaXQpICYmICFoYXMoaXQsIE1FVEEpKXNldE1ldGEoaXQpO1xuICByZXR1cm4gaXQ7XG59O1xudmFyIG1ldGEgPSBtb2R1bGUuZXhwb3J0cyA9IHtcbiAgS0VZOiAgICAgIE1FVEEsXG4gIE5FRUQ6ICAgICBmYWxzZSxcbiAgZmFzdEtleTogIGZhc3RLZXksXG4gIGdldFdlYWs6ICBnZXRXZWFrLFxuICBvbkZyZWV6ZTogb25GcmVlemVcbn07IiwiLy8gMTkuMS4yLjIgLyAxNS4yLjMuNSBPYmplY3QuY3JlYXRlKE8gWywgUHJvcGVydGllc10pXHJcbnZhciBhbk9iamVjdCAgICA9IHJlcXVpcmUoJy4vX2FuLW9iamVjdCcpXHJcbiAgLCBkUHMgICAgICAgICA9IHJlcXVpcmUoJy4vX29iamVjdC1kcHMnKVxyXG4gICwgZW51bUJ1Z0tleXMgPSByZXF1aXJlKCcuL19lbnVtLWJ1Zy1rZXlzJylcclxuICAsIElFX1BST1RPICAgID0gcmVxdWlyZSgnLi9fc2hhcmVkLWtleScpKCdJRV9QUk9UTycpXHJcbiAgLCBFbXB0eSAgICAgICA9IGZ1bmN0aW9uKCl7IC8qIGVtcHR5ICovIH1cclxuICAsIFBST1RPVFlQRSAgID0gJ3Byb3RvdHlwZSc7XHJcblxyXG4vLyBDcmVhdGUgb2JqZWN0IHdpdGggZmFrZSBgbnVsbGAgcHJvdG90eXBlOiB1c2UgaWZyYW1lIE9iamVjdCB3aXRoIGNsZWFyZWQgcHJvdG90eXBlXHJcbnZhciBjcmVhdGVEaWN0ID0gZnVuY3Rpb24oKXtcclxuICAvLyBUaHJhc2gsIHdhc3RlIGFuZCBzb2RvbXk6IElFIEdDIGJ1Z1xyXG4gIHZhciBpZnJhbWUgPSByZXF1aXJlKCcuL19kb20tY3JlYXRlJykoJ2lmcmFtZScpXHJcbiAgICAsIGkgICAgICA9IGVudW1CdWdLZXlzLmxlbmd0aFxyXG4gICAgLCBndCAgICAgPSAnPidcclxuICAgICwgaWZyYW1lRG9jdW1lbnQ7XHJcbiAgaWZyYW1lLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XHJcbiAgcmVxdWlyZSgnLi9faHRtbCcpLmFwcGVuZENoaWxkKGlmcmFtZSk7XHJcbiAgaWZyYW1lLnNyYyA9ICdqYXZhc2NyaXB0Oic7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tc2NyaXB0LXVybFxyXG4gIC8vIGNyZWF0ZURpY3QgPSBpZnJhbWUuY29udGVudFdpbmRvdy5PYmplY3Q7XHJcbiAgLy8gaHRtbC5yZW1vdmVDaGlsZChpZnJhbWUpO1xyXG4gIGlmcmFtZURvY3VtZW50ID0gaWZyYW1lLmNvbnRlbnRXaW5kb3cuZG9jdW1lbnQ7XHJcbiAgaWZyYW1lRG9jdW1lbnQub3BlbigpO1xyXG4gIGlmcmFtZURvY3VtZW50LndyaXRlKCc8c2NyaXB0PmRvY3VtZW50LkY9T2JqZWN0PC9zY3JpcHQnICsgZ3QpO1xyXG4gIGlmcmFtZURvY3VtZW50LmNsb3NlKCk7XHJcbiAgY3JlYXRlRGljdCA9IGlmcmFtZURvY3VtZW50LkY7XHJcbiAgd2hpbGUoaS0tKWRlbGV0ZSBjcmVhdGVEaWN0W1BST1RPVFlQRV1bZW51bUJ1Z0tleXNbaV1dO1xyXG4gIHJldHVybiBjcmVhdGVEaWN0KCk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IE9iamVjdC5jcmVhdGUgfHwgZnVuY3Rpb24gY3JlYXRlKE8sIFByb3BlcnRpZXMpe1xyXG4gIHZhciByZXN1bHQ7XHJcbiAgaWYoTyAhPT0gbnVsbCl7XHJcbiAgICBFbXB0eVtQUk9UT1RZUEVdID0gYW5PYmplY3QoTyk7XHJcbiAgICByZXN1bHQgPSBuZXcgRW1wdHk7XHJcbiAgICBFbXB0eVtQUk9UT1RZUEVdID0gbnVsbDtcclxuICAgIC8vIGFkZCBcIl9fcHJvdG9fX1wiIGZvciBPYmplY3QuZ2V0UHJvdG90eXBlT2YgcG9seWZpbGxcclxuICAgIHJlc3VsdFtJRV9QUk9UT10gPSBPO1xyXG4gIH0gZWxzZSByZXN1bHQgPSBjcmVhdGVEaWN0KCk7XHJcbiAgcmV0dXJuIFByb3BlcnRpZXMgPT09IHVuZGVmaW5lZCA/IHJlc3VsdCA6IGRQcyhyZXN1bHQsIFByb3BlcnRpZXMpO1xyXG59OyIsInZhciBhbk9iamVjdCAgICAgICA9IHJlcXVpcmUoJy4vX2FuLW9iamVjdCcpXG4gICwgSUU4X0RPTV9ERUZJTkUgPSByZXF1aXJlKCcuL19pZTgtZG9tLWRlZmluZScpXG4gICwgdG9QcmltaXRpdmUgICAgPSByZXF1aXJlKCcuL190by1wcmltaXRpdmUnKVxuICAsIGRQICAgICAgICAgICAgID0gT2JqZWN0LmRlZmluZVByb3BlcnR5O1xuXG5leHBvcnRzLmYgPSByZXF1aXJlKCcuL19kZXNjcmlwdG9ycycpID8gT2JqZWN0LmRlZmluZVByb3BlcnR5IDogZnVuY3Rpb24gZGVmaW5lUHJvcGVydHkoTywgUCwgQXR0cmlidXRlcyl7XG4gIGFuT2JqZWN0KE8pO1xuICBQID0gdG9QcmltaXRpdmUoUCwgdHJ1ZSk7XG4gIGFuT2JqZWN0KEF0dHJpYnV0ZXMpO1xuICBpZihJRThfRE9NX0RFRklORSl0cnkge1xuICAgIHJldHVybiBkUChPLCBQLCBBdHRyaWJ1dGVzKTtcbiAgfSBjYXRjaChlKXsgLyogZW1wdHkgKi8gfVxuICBpZignZ2V0JyBpbiBBdHRyaWJ1dGVzIHx8ICdzZXQnIGluIEF0dHJpYnV0ZXMpdGhyb3cgVHlwZUVycm9yKCdBY2Nlc3NvcnMgbm90IHN1cHBvcnRlZCEnKTtcbiAgaWYoJ3ZhbHVlJyBpbiBBdHRyaWJ1dGVzKU9bUF0gPSBBdHRyaWJ1dGVzLnZhbHVlO1xuICByZXR1cm4gTztcbn07IiwidmFyIGRQICAgICAgID0gcmVxdWlyZSgnLi9fb2JqZWN0LWRwJylcclxuICAsIGFuT2JqZWN0ID0gcmVxdWlyZSgnLi9fYW4tb2JqZWN0JylcclxuICAsIGdldEtleXMgID0gcmVxdWlyZSgnLi9fb2JqZWN0LWtleXMnKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi9fZGVzY3JpcHRvcnMnKSA/IE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzIDogZnVuY3Rpb24gZGVmaW5lUHJvcGVydGllcyhPLCBQcm9wZXJ0aWVzKXtcclxuICBhbk9iamVjdChPKTtcclxuICB2YXIga2V5cyAgID0gZ2V0S2V5cyhQcm9wZXJ0aWVzKVxyXG4gICAgLCBsZW5ndGggPSBrZXlzLmxlbmd0aFxyXG4gICAgLCBpID0gMFxyXG4gICAgLCBQO1xyXG4gIHdoaWxlKGxlbmd0aCA+IGkpZFAuZihPLCBQID0ga2V5c1tpKytdLCBQcm9wZXJ0aWVzW1BdKTtcclxuICByZXR1cm4gTztcclxufTsiLCJ2YXIgcElFICAgICAgICAgICAgPSByZXF1aXJlKCcuL19vYmplY3QtcGllJylcclxuICAsIGNyZWF0ZURlc2MgICAgID0gcmVxdWlyZSgnLi9fcHJvcGVydHktZGVzYycpXHJcbiAgLCB0b0lPYmplY3QgICAgICA9IHJlcXVpcmUoJy4vX3RvLWlvYmplY3QnKVxyXG4gICwgdG9QcmltaXRpdmUgICAgPSByZXF1aXJlKCcuL190by1wcmltaXRpdmUnKVxyXG4gICwgaGFzICAgICAgICAgICAgPSByZXF1aXJlKCcuL19oYXMnKVxyXG4gICwgSUU4X0RPTV9ERUZJTkUgPSByZXF1aXJlKCcuL19pZTgtZG9tLWRlZmluZScpXHJcbiAgLCBnT1BEICAgICAgICAgICA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3I7XHJcblxyXG5leHBvcnRzLmYgPSByZXF1aXJlKCcuL19kZXNjcmlwdG9ycycpID8gZ09QRCA6IGZ1bmN0aW9uIGdldE93blByb3BlcnR5RGVzY3JpcHRvcihPLCBQKXtcclxuICBPID0gdG9JT2JqZWN0KE8pO1xyXG4gIFAgPSB0b1ByaW1pdGl2ZShQLCB0cnVlKTtcclxuICBpZihJRThfRE9NX0RFRklORSl0cnkge1xyXG4gICAgcmV0dXJuIGdPUEQoTywgUCk7XHJcbiAgfSBjYXRjaChlKXsgLyogZW1wdHkgKi8gfVxyXG4gIGlmKGhhcyhPLCBQKSlyZXR1cm4gY3JlYXRlRGVzYyghcElFLmYuY2FsbChPLCBQKSwgT1tQXSk7XHJcbn07IiwiLy8gZmFsbGJhY2sgZm9yIElFMTEgYnVnZ3kgT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMgd2l0aCBpZnJhbWUgYW5kIHdpbmRvd1xudmFyIHRvSU9iamVjdCA9IHJlcXVpcmUoJy4vX3RvLWlvYmplY3QnKVxuICAsIGdPUE4gICAgICA9IHJlcXVpcmUoJy4vX29iamVjdC1nb3BuJykuZlxuICAsIHRvU3RyaW5nICA9IHt9LnRvU3RyaW5nO1xuXG52YXIgd2luZG93TmFtZXMgPSB0eXBlb2Ygd2luZG93ID09ICdvYmplY3QnICYmIHdpbmRvdyAmJiBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lc1xuICA/IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKHdpbmRvdykgOiBbXTtcblxudmFyIGdldFdpbmRvd05hbWVzID0gZnVuY3Rpb24oaXQpe1xuICB0cnkge1xuICAgIHJldHVybiBnT1BOKGl0KTtcbiAgfSBjYXRjaChlKXtcbiAgICByZXR1cm4gd2luZG93TmFtZXMuc2xpY2UoKTtcbiAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMuZiA9IGZ1bmN0aW9uIGdldE93blByb3BlcnR5TmFtZXMoaXQpe1xuICByZXR1cm4gd2luZG93TmFtZXMgJiYgdG9TdHJpbmcuY2FsbChpdCkgPT0gJ1tvYmplY3QgV2luZG93XScgPyBnZXRXaW5kb3dOYW1lcyhpdCkgOiBnT1BOKHRvSU9iamVjdChpdCkpO1xufTtcbiIsIi8vIDE5LjEuMi43IC8gMTUuMi4zLjQgT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMoTylcclxudmFyICRrZXlzICAgICAgPSByZXF1aXJlKCcuL19vYmplY3Qta2V5cy1pbnRlcm5hbCcpXHJcbiAgLCBoaWRkZW5LZXlzID0gcmVxdWlyZSgnLi9fZW51bS1idWcta2V5cycpLmNvbmNhdCgnbGVuZ3RoJywgJ3Byb3RvdHlwZScpO1xyXG5cclxuZXhwb3J0cy5mID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMgfHwgZnVuY3Rpb24gZ2V0T3duUHJvcGVydHlOYW1lcyhPKXtcclxuICByZXR1cm4gJGtleXMoTywgaGlkZGVuS2V5cyk7XHJcbn07IiwiZXhwb3J0cy5mID0gT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9sczsiLCIvLyAxOS4xLjIuOSAvIDE1LjIuMy4yIE9iamVjdC5nZXRQcm90b3R5cGVPZihPKVxyXG52YXIgaGFzICAgICAgICAgPSByZXF1aXJlKCcuL19oYXMnKVxyXG4gICwgdG9PYmplY3QgICAgPSByZXF1aXJlKCcuL190by1vYmplY3QnKVxyXG4gICwgSUVfUFJPVE8gICAgPSByZXF1aXJlKCcuL19zaGFyZWQta2V5JykoJ0lFX1BST1RPJylcclxuICAsIE9iamVjdFByb3RvID0gT2JqZWN0LnByb3RvdHlwZTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gT2JqZWN0LmdldFByb3RvdHlwZU9mIHx8IGZ1bmN0aW9uKE8pe1xyXG4gIE8gPSB0b09iamVjdChPKTtcclxuICBpZihoYXMoTywgSUVfUFJPVE8pKXJldHVybiBPW0lFX1BST1RPXTtcclxuICBpZih0eXBlb2YgTy5jb25zdHJ1Y3RvciA9PSAnZnVuY3Rpb24nICYmIE8gaW5zdGFuY2VvZiBPLmNvbnN0cnVjdG9yKXtcclxuICAgIHJldHVybiBPLmNvbnN0cnVjdG9yLnByb3RvdHlwZTtcclxuICB9IHJldHVybiBPIGluc3RhbmNlb2YgT2JqZWN0ID8gT2JqZWN0UHJvdG8gOiBudWxsO1xyXG59OyIsInZhciBoYXMgICAgICAgICAgPSByZXF1aXJlKCcuL19oYXMnKVxyXG4gICwgdG9JT2JqZWN0ICAgID0gcmVxdWlyZSgnLi9fdG8taW9iamVjdCcpXHJcbiAgLCBhcnJheUluZGV4T2YgPSByZXF1aXJlKCcuL19hcnJheS1pbmNsdWRlcycpKGZhbHNlKVxyXG4gICwgSUVfUFJPVE8gICAgID0gcmVxdWlyZSgnLi9fc2hhcmVkLWtleScpKCdJRV9QUk9UTycpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihvYmplY3QsIG5hbWVzKXtcclxuICB2YXIgTyAgICAgID0gdG9JT2JqZWN0KG9iamVjdClcclxuICAgICwgaSAgICAgID0gMFxyXG4gICAgLCByZXN1bHQgPSBbXVxyXG4gICAgLCBrZXk7XHJcbiAgZm9yKGtleSBpbiBPKWlmKGtleSAhPSBJRV9QUk9UTyloYXMoTywga2V5KSAmJiByZXN1bHQucHVzaChrZXkpO1xyXG4gIC8vIERvbid0IGVudW0gYnVnICYgaGlkZGVuIGtleXNcclxuICB3aGlsZShuYW1lcy5sZW5ndGggPiBpKWlmKGhhcyhPLCBrZXkgPSBuYW1lc1tpKytdKSl7XHJcbiAgICB+YXJyYXlJbmRleE9mKHJlc3VsdCwga2V5KSB8fCByZXN1bHQucHVzaChrZXkpO1xyXG4gIH1cclxuICByZXR1cm4gcmVzdWx0O1xyXG59OyIsIi8vIDE5LjEuMi4xNCAvIDE1LjIuMy4xNCBPYmplY3Qua2V5cyhPKVxyXG52YXIgJGtleXMgICAgICAgPSByZXF1aXJlKCcuL19vYmplY3Qta2V5cy1pbnRlcm5hbCcpXHJcbiAgLCBlbnVtQnVnS2V5cyA9IHJlcXVpcmUoJy4vX2VudW0tYnVnLWtleXMnKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gT2JqZWN0LmtleXMgfHwgZnVuY3Rpb24ga2V5cyhPKXtcclxuICByZXR1cm4gJGtleXMoTywgZW51bUJ1Z0tleXMpO1xyXG59OyIsImV4cG9ydHMuZiA9IHt9LnByb3BlcnR5SXNFbnVtZXJhYmxlOyIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oYml0bWFwLCB2YWx1ZSl7XG4gIHJldHVybiB7XG4gICAgZW51bWVyYWJsZSAgOiAhKGJpdG1hcCAmIDEpLFxuICAgIGNvbmZpZ3VyYWJsZTogIShiaXRtYXAgJiAyKSxcbiAgICB3cml0YWJsZSAgICA6ICEoYml0bWFwICYgNCksXG4gICAgdmFsdWUgICAgICAgOiB2YWx1ZVxuICB9O1xufTsiLCJtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vX2hpZGUnKTsiLCJ2YXIgZGVmID0gcmVxdWlyZSgnLi9fb2JqZWN0LWRwJykuZlxuICAsIGhhcyA9IHJlcXVpcmUoJy4vX2hhcycpXG4gICwgVEFHID0gcmVxdWlyZSgnLi9fd2tzJykoJ3RvU3RyaW5nVGFnJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaXQsIHRhZywgc3RhdCl7XG4gIGlmKGl0ICYmICFoYXMoaXQgPSBzdGF0ID8gaXQgOiBpdC5wcm90b3R5cGUsIFRBRykpZGVmKGl0LCBUQUcsIHtjb25maWd1cmFibGU6IHRydWUsIHZhbHVlOiB0YWd9KTtcbn07IiwidmFyIHNoYXJlZCA9IHJlcXVpcmUoJy4vX3NoYXJlZCcpKCdrZXlzJylcclxuICAsIHVpZCAgICA9IHJlcXVpcmUoJy4vX3VpZCcpO1xyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGtleSl7XHJcbiAgcmV0dXJuIHNoYXJlZFtrZXldIHx8IChzaGFyZWRba2V5XSA9IHVpZChrZXkpKTtcclxufTsiLCJ2YXIgZ2xvYmFsID0gcmVxdWlyZSgnLi9fZ2xvYmFsJylcbiAgLCBTSEFSRUQgPSAnX19jb3JlLWpzX3NoYXJlZF9fJ1xuICAsIHN0b3JlICA9IGdsb2JhbFtTSEFSRURdIHx8IChnbG9iYWxbU0hBUkVEXSA9IHt9KTtcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oa2V5KXtcbiAgcmV0dXJuIHN0b3JlW2tleV0gfHwgKHN0b3JlW2tleV0gPSB7fSk7XG59OyIsInZhciB0b0ludGVnZXIgPSByZXF1aXJlKCcuL190by1pbnRlZ2VyJylcbiAgLCBkZWZpbmVkICAgPSByZXF1aXJlKCcuL19kZWZpbmVkJyk7XG4vLyB0cnVlICAtPiBTdHJpbmcjYXRcbi8vIGZhbHNlIC0+IFN0cmluZyNjb2RlUG9pbnRBdFxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihUT19TVFJJTkcpe1xuICByZXR1cm4gZnVuY3Rpb24odGhhdCwgcG9zKXtcbiAgICB2YXIgcyA9IFN0cmluZyhkZWZpbmVkKHRoYXQpKVxuICAgICAgLCBpID0gdG9JbnRlZ2VyKHBvcylcbiAgICAgICwgbCA9IHMubGVuZ3RoXG4gICAgICAsIGEsIGI7XG4gICAgaWYoaSA8IDAgfHwgaSA+PSBsKXJldHVybiBUT19TVFJJTkcgPyAnJyA6IHVuZGVmaW5lZDtcbiAgICBhID0gcy5jaGFyQ29kZUF0KGkpO1xuICAgIHJldHVybiBhIDwgMHhkODAwIHx8IGEgPiAweGRiZmYgfHwgaSArIDEgPT09IGwgfHwgKGIgPSBzLmNoYXJDb2RlQXQoaSArIDEpKSA8IDB4ZGMwMCB8fCBiID4gMHhkZmZmXG4gICAgICA/IFRPX1NUUklORyA/IHMuY2hhckF0KGkpIDogYVxuICAgICAgOiBUT19TVFJJTkcgPyBzLnNsaWNlKGksIGkgKyAyKSA6IChhIC0gMHhkODAwIDw8IDEwKSArIChiIC0gMHhkYzAwKSArIDB4MTAwMDA7XG4gIH07XG59OyIsInZhciB0b0ludGVnZXIgPSByZXF1aXJlKCcuL190by1pbnRlZ2VyJylcbiAgLCBtYXggICAgICAgPSBNYXRoLm1heFxuICAsIG1pbiAgICAgICA9IE1hdGgubWluO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbmRleCwgbGVuZ3RoKXtcbiAgaW5kZXggPSB0b0ludGVnZXIoaW5kZXgpO1xuICByZXR1cm4gaW5kZXggPCAwID8gbWF4KGluZGV4ICsgbGVuZ3RoLCAwKSA6IG1pbihpbmRleCwgbGVuZ3RoKTtcbn07IiwiLy8gNy4xLjQgVG9JbnRlZ2VyXG52YXIgY2VpbCAgPSBNYXRoLmNlaWxcbiAgLCBmbG9vciA9IE1hdGguZmxvb3I7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGl0KXtcbiAgcmV0dXJuIGlzTmFOKGl0ID0gK2l0KSA/IDAgOiAoaXQgPiAwID8gZmxvb3IgOiBjZWlsKShpdCk7XG59OyIsIi8vIHRvIGluZGV4ZWQgb2JqZWN0LCB0b09iamVjdCB3aXRoIGZhbGxiYWNrIGZvciBub24tYXJyYXktbGlrZSBFUzMgc3RyaW5nc1xudmFyIElPYmplY3QgPSByZXF1aXJlKCcuL19pb2JqZWN0JylcbiAgLCBkZWZpbmVkID0gcmVxdWlyZSgnLi9fZGVmaW5lZCcpO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpdCl7XG4gIHJldHVybiBJT2JqZWN0KGRlZmluZWQoaXQpKTtcbn07IiwiLy8gNy4xLjE1IFRvTGVuZ3RoXG52YXIgdG9JbnRlZ2VyID0gcmVxdWlyZSgnLi9fdG8taW50ZWdlcicpXG4gICwgbWluICAgICAgID0gTWF0aC5taW47XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGl0KXtcbiAgcmV0dXJuIGl0ID4gMCA/IG1pbih0b0ludGVnZXIoaXQpLCAweDFmZmZmZmZmZmZmZmZmKSA6IDA7IC8vIHBvdygyLCA1MykgLSAxID09IDkwMDcxOTkyNTQ3NDA5OTFcbn07IiwiLy8gNy4xLjEzIFRvT2JqZWN0KGFyZ3VtZW50KVxudmFyIGRlZmluZWQgPSByZXF1aXJlKCcuL19kZWZpbmVkJyk7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGl0KXtcbiAgcmV0dXJuIE9iamVjdChkZWZpbmVkKGl0KSk7XG59OyIsIi8vIDcuMS4xIFRvUHJpbWl0aXZlKGlucHV0IFssIFByZWZlcnJlZFR5cGVdKVxudmFyIGlzT2JqZWN0ID0gcmVxdWlyZSgnLi9faXMtb2JqZWN0Jyk7XG4vLyBpbnN0ZWFkIG9mIHRoZSBFUzYgc3BlYyB2ZXJzaW9uLCB3ZSBkaWRuJ3QgaW1wbGVtZW50IEBAdG9QcmltaXRpdmUgY2FzZVxuLy8gYW5kIHRoZSBzZWNvbmQgYXJndW1lbnQgLSBmbGFnIC0gcHJlZmVycmVkIHR5cGUgaXMgYSBzdHJpbmdcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaXQsIFMpe1xuICBpZighaXNPYmplY3QoaXQpKXJldHVybiBpdDtcbiAgdmFyIGZuLCB2YWw7XG4gIGlmKFMgJiYgdHlwZW9mIChmbiA9IGl0LnRvU3RyaW5nKSA9PSAnZnVuY3Rpb24nICYmICFpc09iamVjdCh2YWwgPSBmbi5jYWxsKGl0KSkpcmV0dXJuIHZhbDtcbiAgaWYodHlwZW9mIChmbiA9IGl0LnZhbHVlT2YpID09ICdmdW5jdGlvbicgJiYgIWlzT2JqZWN0KHZhbCA9IGZuLmNhbGwoaXQpKSlyZXR1cm4gdmFsO1xuICBpZighUyAmJiB0eXBlb2YgKGZuID0gaXQudG9TdHJpbmcpID09ICdmdW5jdGlvbicgJiYgIWlzT2JqZWN0KHZhbCA9IGZuLmNhbGwoaXQpKSlyZXR1cm4gdmFsO1xuICB0aHJvdyBUeXBlRXJyb3IoXCJDYW4ndCBjb252ZXJ0IG9iamVjdCB0byBwcmltaXRpdmUgdmFsdWVcIik7XG59OyIsInZhciBpZCA9IDBcbiAgLCBweCA9IE1hdGgucmFuZG9tKCk7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGtleSl7XG4gIHJldHVybiAnU3ltYm9sKCcuY29uY2F0KGtleSA9PT0gdW5kZWZpbmVkID8gJycgOiBrZXksICcpXycsICgrK2lkICsgcHgpLnRvU3RyaW5nKDM2KSk7XG59OyIsInZhciBnbG9iYWwgICAgICAgICA9IHJlcXVpcmUoJy4vX2dsb2JhbCcpXHJcbiAgLCBjb3JlICAgICAgICAgICA9IHJlcXVpcmUoJy4vX2NvcmUnKVxyXG4gICwgTElCUkFSWSAgICAgICAgPSByZXF1aXJlKCcuL19saWJyYXJ5JylcclxuICAsIHdrc0V4dCAgICAgICAgID0gcmVxdWlyZSgnLi9fd2tzLWV4dCcpXHJcbiAgLCBkZWZpbmVQcm9wZXJ0eSA9IHJlcXVpcmUoJy4vX29iamVjdC1kcCcpLmY7XHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24obmFtZSl7XHJcbiAgdmFyICRTeW1ib2wgPSBjb3JlLlN5bWJvbCB8fCAoY29yZS5TeW1ib2wgPSBMSUJSQVJZID8ge30gOiBnbG9iYWwuU3ltYm9sIHx8IHt9KTtcclxuICBpZihuYW1lLmNoYXJBdCgwKSAhPSAnXycgJiYgIShuYW1lIGluICRTeW1ib2wpKWRlZmluZVByb3BlcnR5KCRTeW1ib2wsIG5hbWUsIHt2YWx1ZTogd2tzRXh0LmYobmFtZSl9KTtcclxufTsiLCJleHBvcnRzLmYgPSByZXF1aXJlKCcuL193a3MnKTsiLCJ2YXIgc3RvcmUgICAgICA9IHJlcXVpcmUoJy4vX3NoYXJlZCcpKCd3a3MnKVxuICAsIHVpZCAgICAgICAgPSByZXF1aXJlKCcuL191aWQnKVxuICAsIFN5bWJvbCAgICAgPSByZXF1aXJlKCcuL19nbG9iYWwnKS5TeW1ib2xcbiAgLCBVU0VfU1lNQk9MID0gdHlwZW9mIFN5bWJvbCA9PSAnZnVuY3Rpb24nO1xuXG52YXIgJGV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKG5hbWUpe1xuICByZXR1cm4gc3RvcmVbbmFtZV0gfHwgKHN0b3JlW25hbWVdID1cbiAgICBVU0VfU1lNQk9MICYmIFN5bWJvbFtuYW1lXSB8fCAoVVNFX1NZTUJPTCA/IFN5bWJvbCA6IHVpZCkoJ1N5bWJvbC4nICsgbmFtZSkpO1xufTtcblxuJGV4cG9ydHMuc3RvcmUgPSBzdG9yZTsiLCIndXNlIHN0cmljdCc7XG52YXIgYWRkVG9VbnNjb3BhYmxlcyA9IHJlcXVpcmUoJy4vX2FkZC10by11bnNjb3BhYmxlcycpXG4gICwgc3RlcCAgICAgICAgICAgICA9IHJlcXVpcmUoJy4vX2l0ZXItc3RlcCcpXG4gICwgSXRlcmF0b3JzICAgICAgICA9IHJlcXVpcmUoJy4vX2l0ZXJhdG9ycycpXG4gICwgdG9JT2JqZWN0ICAgICAgICA9IHJlcXVpcmUoJy4vX3RvLWlvYmplY3QnKTtcblxuLy8gMjIuMS4zLjQgQXJyYXkucHJvdG90eXBlLmVudHJpZXMoKVxuLy8gMjIuMS4zLjEzIEFycmF5LnByb3RvdHlwZS5rZXlzKClcbi8vIDIyLjEuMy4yOSBBcnJheS5wcm90b3R5cGUudmFsdWVzKClcbi8vIDIyLjEuMy4zMCBBcnJheS5wcm90b3R5cGVbQEBpdGVyYXRvcl0oKVxubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL19pdGVyLWRlZmluZScpKEFycmF5LCAnQXJyYXknLCBmdW5jdGlvbihpdGVyYXRlZCwga2luZCl7XG4gIHRoaXMuX3QgPSB0b0lPYmplY3QoaXRlcmF0ZWQpOyAvLyB0YXJnZXRcbiAgdGhpcy5faSA9IDA7ICAgICAgICAgICAgICAgICAgIC8vIG5leHQgaW5kZXhcbiAgdGhpcy5fayA9IGtpbmQ7ICAgICAgICAgICAgICAgIC8vIGtpbmRcbi8vIDIyLjEuNS4yLjEgJUFycmF5SXRlcmF0b3JQcm90b3R5cGUlLm5leHQoKVxufSwgZnVuY3Rpb24oKXtcbiAgdmFyIE8gICAgID0gdGhpcy5fdFxuICAgICwga2luZCAgPSB0aGlzLl9rXG4gICAgLCBpbmRleCA9IHRoaXMuX2krKztcbiAgaWYoIU8gfHwgaW5kZXggPj0gTy5sZW5ndGgpe1xuICAgIHRoaXMuX3QgPSB1bmRlZmluZWQ7XG4gICAgcmV0dXJuIHN0ZXAoMSk7XG4gIH1cbiAgaWYoa2luZCA9PSAna2V5cycgIClyZXR1cm4gc3RlcCgwLCBpbmRleCk7XG4gIGlmKGtpbmQgPT0gJ3ZhbHVlcycpcmV0dXJuIHN0ZXAoMCwgT1tpbmRleF0pO1xuICByZXR1cm4gc3RlcCgwLCBbaW5kZXgsIE9baW5kZXhdXSk7XG59LCAndmFsdWVzJyk7XG5cbi8vIGFyZ3VtZW50c0xpc3RbQEBpdGVyYXRvcl0gaXMgJUFycmF5UHJvdG9fdmFsdWVzJSAoOS40LjQuNiwgOS40LjQuNylcbkl0ZXJhdG9ycy5Bcmd1bWVudHMgPSBJdGVyYXRvcnMuQXJyYXk7XG5cbmFkZFRvVW5zY29wYWJsZXMoJ2tleXMnKTtcbmFkZFRvVW5zY29wYWJsZXMoJ3ZhbHVlcycpO1xuYWRkVG9VbnNjb3BhYmxlcygnZW50cmllcycpOyIsInZhciAkZXhwb3J0ID0gcmVxdWlyZSgnLi9fZXhwb3J0Jyk7XHJcbi8vIDE5LjEuMi40IC8gMTUuMi4zLjYgT2JqZWN0LmRlZmluZVByb3BlcnR5KE8sIFAsIEF0dHJpYnV0ZXMpXHJcbiRleHBvcnQoJGV4cG9ydC5TICsgJGV4cG9ydC5GICogIXJlcXVpcmUoJy4vX2Rlc2NyaXB0b3JzJyksICdPYmplY3QnLCB7ZGVmaW5lUHJvcGVydHk6IHJlcXVpcmUoJy4vX29iamVjdC1kcCcpLmZ9KTsiLCIiLCIndXNlIHN0cmljdCc7XG52YXIgJGF0ICA9IHJlcXVpcmUoJy4vX3N0cmluZy1hdCcpKHRydWUpO1xuXG4vLyAyMS4xLjMuMjcgU3RyaW5nLnByb3RvdHlwZVtAQGl0ZXJhdG9yXSgpXG5yZXF1aXJlKCcuL19pdGVyLWRlZmluZScpKFN0cmluZywgJ1N0cmluZycsIGZ1bmN0aW9uKGl0ZXJhdGVkKXtcbiAgdGhpcy5fdCA9IFN0cmluZyhpdGVyYXRlZCk7IC8vIHRhcmdldFxuICB0aGlzLl9pID0gMDsgICAgICAgICAgICAgICAgLy8gbmV4dCBpbmRleFxuLy8gMjEuMS41LjIuMSAlU3RyaW5nSXRlcmF0b3JQcm90b3R5cGUlLm5leHQoKVxufSwgZnVuY3Rpb24oKXtcbiAgdmFyIE8gICAgID0gdGhpcy5fdFxuICAgICwgaW5kZXggPSB0aGlzLl9pXG4gICAgLCBwb2ludDtcbiAgaWYoaW5kZXggPj0gTy5sZW5ndGgpcmV0dXJuIHt2YWx1ZTogdW5kZWZpbmVkLCBkb25lOiB0cnVlfTtcbiAgcG9pbnQgPSAkYXQoTywgaW5kZXgpO1xuICB0aGlzLl9pICs9IHBvaW50Lmxlbmd0aDtcbiAgcmV0dXJuIHt2YWx1ZTogcG9pbnQsIGRvbmU6IGZhbHNlfTtcbn0pOyIsIid1c2Ugc3RyaWN0Jztcbi8vIEVDTUFTY3JpcHQgNiBzeW1ib2xzIHNoaW1cbnZhciBnbG9iYWwgICAgICAgICA9IHJlcXVpcmUoJy4vX2dsb2JhbCcpXG4gICwgaGFzICAgICAgICAgICAgPSByZXF1aXJlKCcuL19oYXMnKVxuICAsIERFU0NSSVBUT1JTICAgID0gcmVxdWlyZSgnLi9fZGVzY3JpcHRvcnMnKVxuICAsICRleHBvcnQgICAgICAgID0gcmVxdWlyZSgnLi9fZXhwb3J0JylcbiAgLCByZWRlZmluZSAgICAgICA9IHJlcXVpcmUoJy4vX3JlZGVmaW5lJylcbiAgLCBNRVRBICAgICAgICAgICA9IHJlcXVpcmUoJy4vX21ldGEnKS5LRVlcbiAgLCAkZmFpbHMgICAgICAgICA9IHJlcXVpcmUoJy4vX2ZhaWxzJylcbiAgLCBzaGFyZWQgICAgICAgICA9IHJlcXVpcmUoJy4vX3NoYXJlZCcpXG4gICwgc2V0VG9TdHJpbmdUYWcgPSByZXF1aXJlKCcuL19zZXQtdG8tc3RyaW5nLXRhZycpXG4gICwgdWlkICAgICAgICAgICAgPSByZXF1aXJlKCcuL191aWQnKVxuICAsIHdrcyAgICAgICAgICAgID0gcmVxdWlyZSgnLi9fd2tzJylcbiAgLCB3a3NFeHQgICAgICAgICA9IHJlcXVpcmUoJy4vX3drcy1leHQnKVxuICAsIHdrc0RlZmluZSAgICAgID0gcmVxdWlyZSgnLi9fd2tzLWRlZmluZScpXG4gICwga2V5T2YgICAgICAgICAgPSByZXF1aXJlKCcuL19rZXlvZicpXG4gICwgZW51bUtleXMgICAgICAgPSByZXF1aXJlKCcuL19lbnVtLWtleXMnKVxuICAsIGlzQXJyYXkgICAgICAgID0gcmVxdWlyZSgnLi9faXMtYXJyYXknKVxuICAsIGFuT2JqZWN0ICAgICAgID0gcmVxdWlyZSgnLi9fYW4tb2JqZWN0JylcbiAgLCB0b0lPYmplY3QgICAgICA9IHJlcXVpcmUoJy4vX3RvLWlvYmplY3QnKVxuICAsIHRvUHJpbWl0aXZlICAgID0gcmVxdWlyZSgnLi9fdG8tcHJpbWl0aXZlJylcbiAgLCBjcmVhdGVEZXNjICAgICA9IHJlcXVpcmUoJy4vX3Byb3BlcnR5LWRlc2MnKVxuICAsIF9jcmVhdGUgICAgICAgID0gcmVxdWlyZSgnLi9fb2JqZWN0LWNyZWF0ZScpXG4gICwgZ09QTkV4dCAgICAgICAgPSByZXF1aXJlKCcuL19vYmplY3QtZ29wbi1leHQnKVxuICAsICRHT1BEICAgICAgICAgID0gcmVxdWlyZSgnLi9fb2JqZWN0LWdvcGQnKVxuICAsICREUCAgICAgICAgICAgID0gcmVxdWlyZSgnLi9fb2JqZWN0LWRwJylcbiAgLCAka2V5cyAgICAgICAgICA9IHJlcXVpcmUoJy4vX29iamVjdC1rZXlzJylcbiAgLCBnT1BEICAgICAgICAgICA9ICRHT1BELmZcbiAgLCBkUCAgICAgICAgICAgICA9ICREUC5mXG4gICwgZ09QTiAgICAgICAgICAgPSBnT1BORXh0LmZcbiAgLCAkU3ltYm9sICAgICAgICA9IGdsb2JhbC5TeW1ib2xcbiAgLCAkSlNPTiAgICAgICAgICA9IGdsb2JhbC5KU09OXG4gICwgX3N0cmluZ2lmeSAgICAgPSAkSlNPTiAmJiAkSlNPTi5zdHJpbmdpZnlcbiAgLCBQUk9UT1RZUEUgICAgICA9ICdwcm90b3R5cGUnXG4gICwgSElEREVOICAgICAgICAgPSB3a3MoJ19oaWRkZW4nKVxuICAsIFRPX1BSSU1JVElWRSAgID0gd2tzKCd0b1ByaW1pdGl2ZScpXG4gICwgaXNFbnVtICAgICAgICAgPSB7fS5wcm9wZXJ0eUlzRW51bWVyYWJsZVxuICAsIFN5bWJvbFJlZ2lzdHJ5ID0gc2hhcmVkKCdzeW1ib2wtcmVnaXN0cnknKVxuICAsIEFsbFN5bWJvbHMgICAgID0gc2hhcmVkKCdzeW1ib2xzJylcbiAgLCBPUFN5bWJvbHMgICAgICA9IHNoYXJlZCgnb3Atc3ltYm9scycpXG4gICwgT2JqZWN0UHJvdG8gICAgPSBPYmplY3RbUFJPVE9UWVBFXVxuICAsIFVTRV9OQVRJVkUgICAgID0gdHlwZW9mICRTeW1ib2wgPT0gJ2Z1bmN0aW9uJ1xuICAsIFFPYmplY3QgICAgICAgID0gZ2xvYmFsLlFPYmplY3Q7XG4vLyBEb24ndCB1c2Ugc2V0dGVycyBpbiBRdCBTY3JpcHQsIGh0dHBzOi8vZ2l0aHViLmNvbS96bG9pcm9jay9jb3JlLWpzL2lzc3Vlcy8xNzNcbnZhciBzZXR0ZXIgPSAhUU9iamVjdCB8fCAhUU9iamVjdFtQUk9UT1RZUEVdIHx8ICFRT2JqZWN0W1BST1RPVFlQRV0uZmluZENoaWxkO1xuXG4vLyBmYWxsYmFjayBmb3Igb2xkIEFuZHJvaWQsIGh0dHBzOi8vY29kZS5nb29nbGUuY29tL3AvdjgvaXNzdWVzL2RldGFpbD9pZD02ODdcbnZhciBzZXRTeW1ib2xEZXNjID0gREVTQ1JJUFRPUlMgJiYgJGZhaWxzKGZ1bmN0aW9uKCl7XG4gIHJldHVybiBfY3JlYXRlKGRQKHt9LCAnYScsIHtcbiAgICBnZXQ6IGZ1bmN0aW9uKCl7IHJldHVybiBkUCh0aGlzLCAnYScsIHt2YWx1ZTogN30pLmE7IH1cbiAgfSkpLmEgIT0gNztcbn0pID8gZnVuY3Rpb24oaXQsIGtleSwgRCl7XG4gIHZhciBwcm90b0Rlc2MgPSBnT1BEKE9iamVjdFByb3RvLCBrZXkpO1xuICBpZihwcm90b0Rlc2MpZGVsZXRlIE9iamVjdFByb3RvW2tleV07XG4gIGRQKGl0LCBrZXksIEQpO1xuICBpZihwcm90b0Rlc2MgJiYgaXQgIT09IE9iamVjdFByb3RvKWRQKE9iamVjdFByb3RvLCBrZXksIHByb3RvRGVzYyk7XG59IDogZFA7XG5cbnZhciB3cmFwID0gZnVuY3Rpb24odGFnKXtcbiAgdmFyIHN5bSA9IEFsbFN5bWJvbHNbdGFnXSA9IF9jcmVhdGUoJFN5bWJvbFtQUk9UT1RZUEVdKTtcbiAgc3ltLl9rID0gdGFnO1xuICByZXR1cm4gc3ltO1xufTtcblxudmFyIGlzU3ltYm9sID0gVVNFX05BVElWRSAmJiB0eXBlb2YgJFN5bWJvbC5pdGVyYXRvciA9PSAnc3ltYm9sJyA/IGZ1bmN0aW9uKGl0KXtcbiAgcmV0dXJuIHR5cGVvZiBpdCA9PSAnc3ltYm9sJztcbn0gOiBmdW5jdGlvbihpdCl7XG4gIHJldHVybiBpdCBpbnN0YW5jZW9mICRTeW1ib2w7XG59O1xuXG52YXIgJGRlZmluZVByb3BlcnR5ID0gZnVuY3Rpb24gZGVmaW5lUHJvcGVydHkoaXQsIGtleSwgRCl7XG4gIGlmKGl0ID09PSBPYmplY3RQcm90bykkZGVmaW5lUHJvcGVydHkoT1BTeW1ib2xzLCBrZXksIEQpO1xuICBhbk9iamVjdChpdCk7XG4gIGtleSA9IHRvUHJpbWl0aXZlKGtleSwgdHJ1ZSk7XG4gIGFuT2JqZWN0KEQpO1xuICBpZihoYXMoQWxsU3ltYm9scywga2V5KSl7XG4gICAgaWYoIUQuZW51bWVyYWJsZSl7XG4gICAgICBpZighaGFzKGl0LCBISURERU4pKWRQKGl0LCBISURERU4sIGNyZWF0ZURlc2MoMSwge30pKTtcbiAgICAgIGl0W0hJRERFTl1ba2V5XSA9IHRydWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmKGhhcyhpdCwgSElEREVOKSAmJiBpdFtISURERU5dW2tleV0paXRbSElEREVOXVtrZXldID0gZmFsc2U7XG4gICAgICBEID0gX2NyZWF0ZShELCB7ZW51bWVyYWJsZTogY3JlYXRlRGVzYygwLCBmYWxzZSl9KTtcbiAgICB9IHJldHVybiBzZXRTeW1ib2xEZXNjKGl0LCBrZXksIEQpO1xuICB9IHJldHVybiBkUChpdCwga2V5LCBEKTtcbn07XG52YXIgJGRlZmluZVByb3BlcnRpZXMgPSBmdW5jdGlvbiBkZWZpbmVQcm9wZXJ0aWVzKGl0LCBQKXtcbiAgYW5PYmplY3QoaXQpO1xuICB2YXIga2V5cyA9IGVudW1LZXlzKFAgPSB0b0lPYmplY3QoUCkpXG4gICAgLCBpICAgID0gMFxuICAgICwgbCA9IGtleXMubGVuZ3RoXG4gICAgLCBrZXk7XG4gIHdoaWxlKGwgPiBpKSRkZWZpbmVQcm9wZXJ0eShpdCwga2V5ID0ga2V5c1tpKytdLCBQW2tleV0pO1xuICByZXR1cm4gaXQ7XG59O1xudmFyICRjcmVhdGUgPSBmdW5jdGlvbiBjcmVhdGUoaXQsIFApe1xuICByZXR1cm4gUCA9PT0gdW5kZWZpbmVkID8gX2NyZWF0ZShpdCkgOiAkZGVmaW5lUHJvcGVydGllcyhfY3JlYXRlKGl0KSwgUCk7XG59O1xudmFyICRwcm9wZXJ0eUlzRW51bWVyYWJsZSA9IGZ1bmN0aW9uIHByb3BlcnR5SXNFbnVtZXJhYmxlKGtleSl7XG4gIHZhciBFID0gaXNFbnVtLmNhbGwodGhpcywga2V5ID0gdG9QcmltaXRpdmUoa2V5LCB0cnVlKSk7XG4gIGlmKHRoaXMgPT09IE9iamVjdFByb3RvICYmIGhhcyhBbGxTeW1ib2xzLCBrZXkpICYmICFoYXMoT1BTeW1ib2xzLCBrZXkpKXJldHVybiBmYWxzZTtcbiAgcmV0dXJuIEUgfHwgIWhhcyh0aGlzLCBrZXkpIHx8ICFoYXMoQWxsU3ltYm9scywga2V5KSB8fCBoYXModGhpcywgSElEREVOKSAmJiB0aGlzW0hJRERFTl1ba2V5XSA/IEUgOiB0cnVlO1xufTtcbnZhciAkZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yID0gZnVuY3Rpb24gZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKGl0LCBrZXkpe1xuICBpdCAgPSB0b0lPYmplY3QoaXQpO1xuICBrZXkgPSB0b1ByaW1pdGl2ZShrZXksIHRydWUpO1xuICBpZihpdCA9PT0gT2JqZWN0UHJvdG8gJiYgaGFzKEFsbFN5bWJvbHMsIGtleSkgJiYgIWhhcyhPUFN5bWJvbHMsIGtleSkpcmV0dXJuO1xuICB2YXIgRCA9IGdPUEQoaXQsIGtleSk7XG4gIGlmKEQgJiYgaGFzKEFsbFN5bWJvbHMsIGtleSkgJiYgIShoYXMoaXQsIEhJRERFTikgJiYgaXRbSElEREVOXVtrZXldKSlELmVudW1lcmFibGUgPSB0cnVlO1xuICByZXR1cm4gRDtcbn07XG52YXIgJGdldE93blByb3BlcnR5TmFtZXMgPSBmdW5jdGlvbiBnZXRPd25Qcm9wZXJ0eU5hbWVzKGl0KXtcbiAgdmFyIG5hbWVzICA9IGdPUE4odG9JT2JqZWN0KGl0KSlcbiAgICAsIHJlc3VsdCA9IFtdXG4gICAgLCBpICAgICAgPSAwXG4gICAgLCBrZXk7XG4gIHdoaWxlKG5hbWVzLmxlbmd0aCA+IGkpe1xuICAgIGlmKCFoYXMoQWxsU3ltYm9scywga2V5ID0gbmFtZXNbaSsrXSkgJiYga2V5ICE9IEhJRERFTiAmJiBrZXkgIT0gTUVUQSlyZXN1bHQucHVzaChrZXkpO1xuICB9IHJldHVybiByZXN1bHQ7XG59O1xudmFyICRnZXRPd25Qcm9wZXJ0eVN5bWJvbHMgPSBmdW5jdGlvbiBnZXRPd25Qcm9wZXJ0eVN5bWJvbHMoaXQpe1xuICB2YXIgSVNfT1AgID0gaXQgPT09IE9iamVjdFByb3RvXG4gICAgLCBuYW1lcyAgPSBnT1BOKElTX09QID8gT1BTeW1ib2xzIDogdG9JT2JqZWN0KGl0KSlcbiAgICAsIHJlc3VsdCA9IFtdXG4gICAgLCBpICAgICAgPSAwXG4gICAgLCBrZXk7XG4gIHdoaWxlKG5hbWVzLmxlbmd0aCA+IGkpe1xuICAgIGlmKGhhcyhBbGxTeW1ib2xzLCBrZXkgPSBuYW1lc1tpKytdKSAmJiAoSVNfT1AgPyBoYXMoT2JqZWN0UHJvdG8sIGtleSkgOiB0cnVlKSlyZXN1bHQucHVzaChBbGxTeW1ib2xzW2tleV0pO1xuICB9IHJldHVybiByZXN1bHQ7XG59O1xuXG4vLyAxOS40LjEuMSBTeW1ib2woW2Rlc2NyaXB0aW9uXSlcbmlmKCFVU0VfTkFUSVZFKXtcbiAgJFN5bWJvbCA9IGZ1bmN0aW9uIFN5bWJvbCgpe1xuICAgIGlmKHRoaXMgaW5zdGFuY2VvZiAkU3ltYm9sKXRocm93IFR5cGVFcnJvcignU3ltYm9sIGlzIG5vdCBhIGNvbnN0cnVjdG9yIScpO1xuICAgIHZhciB0YWcgPSB1aWQoYXJndW1lbnRzLmxlbmd0aCA+IDAgPyBhcmd1bWVudHNbMF0gOiB1bmRlZmluZWQpO1xuICAgIHZhciAkc2V0ID0gZnVuY3Rpb24odmFsdWUpe1xuICAgICAgaWYodGhpcyA9PT0gT2JqZWN0UHJvdG8pJHNldC5jYWxsKE9QU3ltYm9scywgdmFsdWUpO1xuICAgICAgaWYoaGFzKHRoaXMsIEhJRERFTikgJiYgaGFzKHRoaXNbSElEREVOXSwgdGFnKSl0aGlzW0hJRERFTl1bdGFnXSA9IGZhbHNlO1xuICAgICAgc2V0U3ltYm9sRGVzYyh0aGlzLCB0YWcsIGNyZWF0ZURlc2MoMSwgdmFsdWUpKTtcbiAgICB9O1xuICAgIGlmKERFU0NSSVBUT1JTICYmIHNldHRlcilzZXRTeW1ib2xEZXNjKE9iamVjdFByb3RvLCB0YWcsIHtjb25maWd1cmFibGU6IHRydWUsIHNldDogJHNldH0pO1xuICAgIHJldHVybiB3cmFwKHRhZyk7XG4gIH07XG4gIHJlZGVmaW5lKCRTeW1ib2xbUFJPVE9UWVBFXSwgJ3RvU3RyaW5nJywgZnVuY3Rpb24gdG9TdHJpbmcoKXtcbiAgICByZXR1cm4gdGhpcy5faztcbiAgfSk7XG5cbiAgJEdPUEQuZiA9ICRnZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3I7XG4gICREUC5mICAgPSAkZGVmaW5lUHJvcGVydHk7XG4gIHJlcXVpcmUoJy4vX29iamVjdC1nb3BuJykuZiA9IGdPUE5FeHQuZiA9ICRnZXRPd25Qcm9wZXJ0eU5hbWVzO1xuICByZXF1aXJlKCcuL19vYmplY3QtcGllJykuZiAgPSAkcHJvcGVydHlJc0VudW1lcmFibGU7XG4gIHJlcXVpcmUoJy4vX29iamVjdC1nb3BzJykuZiA9ICRnZXRPd25Qcm9wZXJ0eVN5bWJvbHM7XG5cbiAgaWYoREVTQ1JJUFRPUlMgJiYgIXJlcXVpcmUoJy4vX2xpYnJhcnknKSl7XG4gICAgcmVkZWZpbmUoT2JqZWN0UHJvdG8sICdwcm9wZXJ0eUlzRW51bWVyYWJsZScsICRwcm9wZXJ0eUlzRW51bWVyYWJsZSwgdHJ1ZSk7XG4gIH1cblxuICB3a3NFeHQuZiA9IGZ1bmN0aW9uKG5hbWUpe1xuICAgIHJldHVybiB3cmFwKHdrcyhuYW1lKSk7XG4gIH1cbn1cblxuJGV4cG9ydCgkZXhwb3J0LkcgKyAkZXhwb3J0LlcgKyAkZXhwb3J0LkYgKiAhVVNFX05BVElWRSwge1N5bWJvbDogJFN5bWJvbH0pO1xuXG5mb3IodmFyIHN5bWJvbHMgPSAoXG4gIC8vIDE5LjQuMi4yLCAxOS40LjIuMywgMTkuNC4yLjQsIDE5LjQuMi42LCAxOS40LjIuOCwgMTkuNC4yLjksIDE5LjQuMi4xMCwgMTkuNC4yLjExLCAxOS40LjIuMTIsIDE5LjQuMi4xMywgMTkuNC4yLjE0XG4gICdoYXNJbnN0YW5jZSxpc0NvbmNhdFNwcmVhZGFibGUsaXRlcmF0b3IsbWF0Y2gscmVwbGFjZSxzZWFyY2gsc3BlY2llcyxzcGxpdCx0b1ByaW1pdGl2ZSx0b1N0cmluZ1RhZyx1bnNjb3BhYmxlcydcbikuc3BsaXQoJywnKSwgaSA9IDA7IHN5bWJvbHMubGVuZ3RoID4gaTsgKXdrcyhzeW1ib2xzW2krK10pO1xuXG5mb3IodmFyIHN5bWJvbHMgPSAka2V5cyh3a3Muc3RvcmUpLCBpID0gMDsgc3ltYm9scy5sZW5ndGggPiBpOyApd2tzRGVmaW5lKHN5bWJvbHNbaSsrXSk7XG5cbiRleHBvcnQoJGV4cG9ydC5TICsgJGV4cG9ydC5GICogIVVTRV9OQVRJVkUsICdTeW1ib2wnLCB7XG4gIC8vIDE5LjQuMi4xIFN5bWJvbC5mb3Ioa2V5KVxuICAnZm9yJzogZnVuY3Rpb24oa2V5KXtcbiAgICByZXR1cm4gaGFzKFN5bWJvbFJlZ2lzdHJ5LCBrZXkgKz0gJycpXG4gICAgICA/IFN5bWJvbFJlZ2lzdHJ5W2tleV1cbiAgICAgIDogU3ltYm9sUmVnaXN0cnlba2V5XSA9ICRTeW1ib2woa2V5KTtcbiAgfSxcbiAgLy8gMTkuNC4yLjUgU3ltYm9sLmtleUZvcihzeW0pXG4gIGtleUZvcjogZnVuY3Rpb24ga2V5Rm9yKGtleSl7XG4gICAgaWYoaXNTeW1ib2woa2V5KSlyZXR1cm4ga2V5T2YoU3ltYm9sUmVnaXN0cnksIGtleSk7XG4gICAgdGhyb3cgVHlwZUVycm9yKGtleSArICcgaXMgbm90IGEgc3ltYm9sIScpO1xuICB9LFxuICB1c2VTZXR0ZXI6IGZ1bmN0aW9uKCl7IHNldHRlciA9IHRydWU7IH0sXG4gIHVzZVNpbXBsZTogZnVuY3Rpb24oKXsgc2V0dGVyID0gZmFsc2U7IH1cbn0pO1xuXG4kZXhwb3J0KCRleHBvcnQuUyArICRleHBvcnQuRiAqICFVU0VfTkFUSVZFLCAnT2JqZWN0Jywge1xuICAvLyAxOS4xLjIuMiBPYmplY3QuY3JlYXRlKE8gWywgUHJvcGVydGllc10pXG4gIGNyZWF0ZTogJGNyZWF0ZSxcbiAgLy8gMTkuMS4yLjQgT2JqZWN0LmRlZmluZVByb3BlcnR5KE8sIFAsIEF0dHJpYnV0ZXMpXG4gIGRlZmluZVByb3BlcnR5OiAkZGVmaW5lUHJvcGVydHksXG4gIC8vIDE5LjEuMi4zIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKE8sIFByb3BlcnRpZXMpXG4gIGRlZmluZVByb3BlcnRpZXM6ICRkZWZpbmVQcm9wZXJ0aWVzLFxuICAvLyAxOS4xLjIuNiBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKE8sIFApXG4gIGdldE93blByb3BlcnR5RGVzY3JpcHRvcjogJGdldE93blByb3BlcnR5RGVzY3JpcHRvcixcbiAgLy8gMTkuMS4yLjcgT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMoTylcbiAgZ2V0T3duUHJvcGVydHlOYW1lczogJGdldE93blByb3BlcnR5TmFtZXMsXG4gIC8vIDE5LjEuMi44IE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHMoTylcbiAgZ2V0T3duUHJvcGVydHlTeW1ib2xzOiAkZ2V0T3duUHJvcGVydHlTeW1ib2xzXG59KTtcblxuLy8gMjQuMy4yIEpTT04uc3RyaW5naWZ5KHZhbHVlIFssIHJlcGxhY2VyIFssIHNwYWNlXV0pXG4kSlNPTiAmJiAkZXhwb3J0KCRleHBvcnQuUyArICRleHBvcnQuRiAqICghVVNFX05BVElWRSB8fCAkZmFpbHMoZnVuY3Rpb24oKXtcbiAgdmFyIFMgPSAkU3ltYm9sKCk7XG4gIC8vIE1TIEVkZ2UgY29udmVydHMgc3ltYm9sIHZhbHVlcyB0byBKU09OIGFzIHt9XG4gIC8vIFdlYktpdCBjb252ZXJ0cyBzeW1ib2wgdmFsdWVzIHRvIEpTT04gYXMgbnVsbFxuICAvLyBWOCB0aHJvd3Mgb24gYm94ZWQgc3ltYm9sc1xuICByZXR1cm4gX3N0cmluZ2lmeShbU10pICE9ICdbbnVsbF0nIHx8IF9zdHJpbmdpZnkoe2E6IFN9KSAhPSAne30nIHx8IF9zdHJpbmdpZnkoT2JqZWN0KFMpKSAhPSAne30nO1xufSkpLCAnSlNPTicsIHtcbiAgc3RyaW5naWZ5OiBmdW5jdGlvbiBzdHJpbmdpZnkoaXQpe1xuICAgIGlmKGl0ID09PSB1bmRlZmluZWQgfHwgaXNTeW1ib2woaXQpKXJldHVybjsgLy8gSUU4IHJldHVybnMgc3RyaW5nIG9uIHVuZGVmaW5lZFxuICAgIHZhciBhcmdzID0gW2l0XVxuICAgICAgLCBpICAgID0gMVxuICAgICAgLCByZXBsYWNlciwgJHJlcGxhY2VyO1xuICAgIHdoaWxlKGFyZ3VtZW50cy5sZW5ndGggPiBpKWFyZ3MucHVzaChhcmd1bWVudHNbaSsrXSk7XG4gICAgcmVwbGFjZXIgPSBhcmdzWzFdO1xuICAgIGlmKHR5cGVvZiByZXBsYWNlciA9PSAnZnVuY3Rpb24nKSRyZXBsYWNlciA9IHJlcGxhY2VyO1xuICAgIGlmKCRyZXBsYWNlciB8fCAhaXNBcnJheShyZXBsYWNlcikpcmVwbGFjZXIgPSBmdW5jdGlvbihrZXksIHZhbHVlKXtcbiAgICAgIGlmKCRyZXBsYWNlcil2YWx1ZSA9ICRyZXBsYWNlci5jYWxsKHRoaXMsIGtleSwgdmFsdWUpO1xuICAgICAgaWYoIWlzU3ltYm9sKHZhbHVlKSlyZXR1cm4gdmFsdWU7XG4gICAgfTtcbiAgICBhcmdzWzFdID0gcmVwbGFjZXI7XG4gICAgcmV0dXJuIF9zdHJpbmdpZnkuYXBwbHkoJEpTT04sIGFyZ3MpO1xuICB9XG59KTtcblxuLy8gMTkuNC4zLjQgU3ltYm9sLnByb3RvdHlwZVtAQHRvUHJpbWl0aXZlXShoaW50KVxuJFN5bWJvbFtQUk9UT1RZUEVdW1RPX1BSSU1JVElWRV0gfHwgcmVxdWlyZSgnLi9faGlkZScpKCRTeW1ib2xbUFJPVE9UWVBFXSwgVE9fUFJJTUlUSVZFLCAkU3ltYm9sW1BST1RPVFlQRV0udmFsdWVPZik7XG4vLyAxOS40LjMuNSBTeW1ib2wucHJvdG90eXBlW0BAdG9TdHJpbmdUYWddXG5zZXRUb1N0cmluZ1RhZygkU3ltYm9sLCAnU3ltYm9sJyk7XG4vLyAyMC4yLjEuOSBNYXRoW0BAdG9TdHJpbmdUYWddXG5zZXRUb1N0cmluZ1RhZyhNYXRoLCAnTWF0aCcsIHRydWUpO1xuLy8gMjQuMy4zIEpTT05bQEB0b1N0cmluZ1RhZ11cbnNldFRvU3RyaW5nVGFnKGdsb2JhbC5KU09OLCAnSlNPTicsIHRydWUpOyIsInJlcXVpcmUoJy4vX3drcy1kZWZpbmUnKSgnYXN5bmNJdGVyYXRvcicpOyIsInJlcXVpcmUoJy4vX3drcy1kZWZpbmUnKSgnb2JzZXJ2YWJsZScpOyIsInJlcXVpcmUoJy4vZXM2LmFycmF5Lml0ZXJhdG9yJyk7XG52YXIgZ2xvYmFsICAgICAgICA9IHJlcXVpcmUoJy4vX2dsb2JhbCcpXG4gICwgaGlkZSAgICAgICAgICA9IHJlcXVpcmUoJy4vX2hpZGUnKVxuICAsIEl0ZXJhdG9ycyAgICAgPSByZXF1aXJlKCcuL19pdGVyYXRvcnMnKVxuICAsIFRPX1NUUklOR19UQUcgPSByZXF1aXJlKCcuL193a3MnKSgndG9TdHJpbmdUYWcnKTtcblxuZm9yKHZhciBjb2xsZWN0aW9ucyA9IFsnTm9kZUxpc3QnLCAnRE9NVG9rZW5MaXN0JywgJ01lZGlhTGlzdCcsICdTdHlsZVNoZWV0TGlzdCcsICdDU1NSdWxlTGlzdCddLCBpID0gMDsgaSA8IDU7IGkrKyl7XG4gIHZhciBOQU1FICAgICAgID0gY29sbGVjdGlvbnNbaV1cbiAgICAsIENvbGxlY3Rpb24gPSBnbG9iYWxbTkFNRV1cbiAgICAsIHByb3RvICAgICAgPSBDb2xsZWN0aW9uICYmIENvbGxlY3Rpb24ucHJvdG90eXBlO1xuICBpZihwcm90byAmJiAhcHJvdG9bVE9fU1RSSU5HX1RBR10paGlkZShwcm90bywgVE9fU1RSSU5HX1RBRywgTkFNRSk7XG4gIEl0ZXJhdG9yc1tOQU1FXSA9IEl0ZXJhdG9ycy5BcnJheTtcbn0iXX0=
