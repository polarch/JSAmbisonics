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
//# sourceMappingURL=data:application/json;base64,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bUIsSUFBbkI7QUFDSDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7a0JBN0VnQixXIiwiZmlsZSI6ImFtYmktc2NlbmVSb3RhdG9yLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vICBBcmNob250aXMgUG9saXRpc1xuLy8gIGFyY2hvbnRpcy5wb2xpdGlzQGFhbHRvLmZpXG4vLyAgRGF2aWQgUG9pcmllci1RdWlub3Rcbi8vICBkYXZpcG9pckBpcmNhbS5mclxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vXG4vLyAgV2ViQXVkaW9fSE9BIGEgSmF2YVNjcmlwdCBsaWJyYXJ5IGZvciBoaWdoZXItb3JkZXIgQW1iaXNvbmljc1xuLy8gIFRoZSBsaWJyYXJ5IGltcGxlbWVudHMgV2ViIEF1ZGlvIGJsb2NrcyB0aGF0IHBlcmZvcm1cbi8vICB0eXBpY2FsIGFtYmlzb25pYyBwcm9jZXNzaW5nIG9wZXJhdGlvbnMgb24gYXVkaW8gc2lnbmFscy5cbi8vXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4vLy8vLy8vLy8vLy8vLy8vL1xuLyogSE9BIFJPVEFUT1IgKi9cbi8vLy8vLy8vLy8vLy8vLy8vXG5cbmltcG9ydCAqIGFzIGpzaGxpYiBmcm9tICdzcGhlcmljYWwtaGFybW9uaWMtdHJhbnNmb3JtJztcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgSE9BX3JvdGF0b3Ige1xuXG4gICAgY29uc3RydWN0b3IoYXVkaW9DdHgsIG9yZGVyKSB7XG5cbiAgICAgICAgdGhpcy5jdHggPSBhdWRpb0N0eDtcbiAgICAgICAgdGhpcy5vcmRlciA9IG9yZGVyO1xuICAgICAgICB0aGlzLm5DaCA9IChvcmRlciArIDEpICogKG9yZGVyICsgMSk7XG4gICAgICAgIHRoaXMueWF3ID0gMDtcbiAgICAgICAgdGhpcy5waXRjaCA9IDA7XG4gICAgICAgIHRoaXMucm9sbCA9IDA7XG4gICAgICAgIHRoaXMucm90TXR4ID0gbnVtZXJpYy5pZGVudGl0eSh0aGlzLm5DaCk7XG4gICAgICAgIHRoaXMucm90TXR4Tm9kZXMgPSBuZXcgQXJyYXkodGhpcy5vcmRlcik7XG4gICAgICAgIHRoaXMuaW4gPSBudWxsO1xuICAgICAgICB0aGlzLm91dCA9IG51bGw7XG5cbiAgICAgICAgdGhpcy5pbml0aWFsaXplZCA9IGZhbHNlO1xuICAgIH1cblxuICAgIHVwZGF0ZVJvdE10eCgpIHtcblxuICAgICAgICBpZiAoIXRoaXMuaW5pdGlhbGl6ZWQpIHJldHVybjtcblxuICAgICAgICB2YXIgeWF3ID0gdGhpcy55YXcgKiBNYXRoLlBJIC8gMTgwO1xuICAgICAgICB2YXIgcGl0Y2ggPSB0aGlzLnBpdGNoICogTWF0aC5QSSAvIDE4MDtcbiAgICAgICAgdmFyIHJvbGwgPSB0aGlzLnJvbGwgKiBNYXRoLlBJIC8gMTgwO1xuXG4gICAgICAgIHRoaXMucm90TXR4ID0ganNobGliLmdldFNIcm90TXR4KGpzaGxpYi55YXdQaXRjaFJvbGwyUnp5eCh5YXcsIHBpdGNoLCByb2xsKSwgdGhpcy5vcmRlcik7XG5cbiAgICAgICAgdmFyIGJhbmRfaWR4ID0gMTtcbiAgICAgICAgZm9yIChsZXQgbiA9IDE7IG4gPCB0aGlzLm9yZGVyICsgMTsgbisrKSB7XG5cbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgMiAqIG4gKyAxOyBpKyspIHtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IDIgKiBuICsgMTsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucm90TXR4Tm9kZXNbbiAtIDFdW2ldW2pdLmdhaW4udmFsdWUgPSB0aGlzLnJvdE10eFtiYW5kX2lkeCArIGldW2JhbmRfaWR4ICsgal07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYmFuZF9pZHggPSBiYW5kX2lkeCArIDIgKiBuICsgMTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGluaXQoKSB7XG4gICAgICAgIGlmICh0aGlzLmluaXRpYWxpemVkKSByZXR1cm47XG5cbiAgICAgICAgLy8gSW5wdXQgYW5kIG91dHB1dCBub2Rlc1xuICAgICAgICB0aGlzLmluID0gdGhpcy5jdHguY3JlYXRlQ2hhbm5lbFNwbGl0dGVyKHRoaXMubkNoKTtcbiAgICAgICAgdGhpcy5vdXQgPSB0aGlzLmN0eC5jcmVhdGVDaGFubmVsTWVyZ2VyKHRoaXMubkNoKTtcblxuICAgICAgICAvLyBJbml0aWFsaXplIHJvdGF0aW9uIGdhaW5zIHRvIGlkZW50aXR5IG1hdHJpeFxuICAgICAgICBmb3IgKHZhciBuID0gMTsgbiA8IHRoaXMub3JkZXIgKyAxOyBuKyspIHtcblxuICAgICAgICAgICAgdmFyIGdhaW5zX24gPSBuZXcgQXJyYXkoMiAqIG4gKyAxKTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgMiAqIG4gKyAxOyBpKyspIHtcbiAgICAgICAgICAgICAgICBnYWluc19uW2ldID0gbmV3IEFycmF5KDIgKiBuICsgMSk7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCAyICogbiArIDE7IGorKykge1xuICAgICAgICAgICAgICAgICAgICBnYWluc19uW2ldW2pdID0gdGhpcy5jdHguY3JlYXRlR2FpbigpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoaSA9PSBqKSBnYWluc19uW2ldW2pdLmdhaW4udmFsdWUgPSAxO1xuICAgICAgICAgICAgICAgICAgICBlbHNlIGdhaW5zX25baV1bal0uZ2Fpbi52YWx1ZSA9IDA7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5yb3RNdHhOb2Rlc1tuIC0gMV0gPSBnYWluc19uO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ3JlYXRlIGNvbm5lY3Rpb25zXG4gICAgICAgIHRoaXMuaW4uY29ubmVjdCh0aGlzLm91dCwgMCwgMCk7IC8vIHplcm90aCBvcmRlciBjaC4gZG9lcyBub3Qgcm90YXRlXG5cbiAgICAgICAgdmFyIGJhbmRfaWR4ID0gMTtcbiAgICAgICAgZm9yIChsZXQgbiA9IDE7IG4gPCB0aGlzLm9yZGVyICsgMTsgbisrKSB7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IDIgKiBuICsgMTsgaSsrKSB7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCAyICogbiArIDE7IGorKykge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmluLmNvbm5lY3QodGhpcy5yb3RNdHhOb2Rlc1tuIC0gMV1baV1bal0sIGJhbmRfaWR4ICsgaiwgMCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucm90TXR4Tm9kZXNbbiAtIDFdW2ldW2pdLmNvbm5lY3QodGhpcy5vdXQsIDAsIGJhbmRfaWR4ICsgaSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYmFuZF9pZHggPSBiYW5kX2lkeCArIDIgKiBuICsgMTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuaW5pdGlhbGl6ZWQgPSB0cnVlO1xuICAgIH1cbn1cbiJdfQ==