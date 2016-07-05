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
//# sourceMappingURL=data:application/json;base64,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bkI7QUFDSDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7a0JBN0VnQixXIiwiZmlsZSI6ImhvYS1yb3RhdG9yLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vICBBcmNob250aXMgUG9saXRpc1xuLy8gIGFyY2hvbnRpcy5wb2xpdGlzQGFhbHRvLmZpXG4vLyAgRGF2aWQgUG9pcmllci1RdWlub3Rcbi8vICBkYXZpcG9pckBpcmNhbS5mclxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vXG4vLyAgV2ViQXVkaW9fSE9BIGEgSmF2YVNjcmlwdCBsaWJyYXJ5IGZvciBoaWdoZXItb3JkZXIgQW1iaXNvbmljc1xuLy8gIFRoZSBsaWJyYXJ5IGltcGxlbWVudHMgV2ViIEF1ZGlvIGJsb2NrcyB0aGF0IHBlcmZvcm1cbi8vICB0eXBpY2FsIGFtYmlzb25pYyBwcm9jZXNzaW5nIG9wZXJhdGlvbnMgb24gYXVkaW8gc2lnbmFscy5cbi8vXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4vLy8vLy8vLy8vLy8vLy8vL1xuLyogSE9BIFJPVEFUT1IgKi9cbi8vLy8vLy8vLy8vLy8vLy8vXG5cbmltcG9ydCAqIGFzIGpzaGxpYiBmcm9tICcuL2pzaC1saWInO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBIT0Ffcm90YXRvciB7XG5cbiAgICBjb25zdHJ1Y3RvcihhdWRpb0N0eCwgb3JkZXIpIHtcblxuICAgICAgICB0aGlzLmN0eCA9IGF1ZGlvQ3R4O1xuICAgICAgICB0aGlzLm9yZGVyID0gb3JkZXI7XG4gICAgICAgIHRoaXMubkNoID0gKG9yZGVyICsgMSkgKiAob3JkZXIgKyAxKTtcbiAgICAgICAgdGhpcy55YXcgPSAwO1xuICAgICAgICB0aGlzLnBpdGNoID0gMDtcbiAgICAgICAgdGhpcy5yb2xsID0gMDtcbiAgICAgICAgdGhpcy5yb3RNdHggPSBudW1lcmljLmlkZW50aXR5KHRoaXMubkNoKTtcbiAgICAgICAgdGhpcy5yb3RNdHhOb2RlcyA9IG5ldyBBcnJheSh0aGlzLm9yZGVyKTtcbiAgICAgICAgdGhpcy5pbiA9IG51bGw7XG4gICAgICAgIHRoaXMub3V0ID0gbnVsbDtcblxuICAgICAgICB0aGlzLmluaXRpYWxpemVkID0gZmFsc2U7XG4gICAgfVxuXG4gICAgdXBkYXRlUm90TXR4KCkge1xuXG4gICAgICAgIGlmICghdGhpcy5pbml0aWFsaXplZCkgcmV0dXJuO1xuXG4gICAgICAgIHZhciB5YXcgPSB0aGlzLnlhdyAqIE1hdGguUEkgLyAxODA7XG4gICAgICAgIHZhciBwaXRjaCA9IHRoaXMucGl0Y2ggKiBNYXRoLlBJIC8gMTgwO1xuICAgICAgICB2YXIgcm9sbCA9IHRoaXMucm9sbCAqIE1hdGguUEkgLyAxODA7XG5cbiAgICAgICAgdGhpcy5yb3RNdHggPSBqc2hsaWIuZ2V0U0hyb3RNdHgoanNobGliLnlhd1BpdGNoUm9sbDJSenl4KHlhdywgcGl0Y2gsIHJvbGwpLCB0aGlzLm9yZGVyKTtcblxuICAgICAgICB2YXIgYmFuZF9pZHggPSAxO1xuICAgICAgICBmb3IgKGxldCBuID0gMTsgbiA8IHRoaXMub3JkZXIgKyAxOyBuKyspIHtcblxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCAyICogbiArIDE7IGkrKykge1xuICAgICAgICAgICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgMiAqIG4gKyAxOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5yb3RNdHhOb2Rlc1tuIC0gMV1baV1bal0uZ2Fpbi52YWx1ZSA9IHRoaXMucm90TXR4W2JhbmRfaWR4ICsgaV1bYmFuZF9pZHggKyBqXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBiYW5kX2lkeCA9IGJhbmRfaWR4ICsgMiAqIG4gKyAxO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaW5pdCgpIHtcbiAgICAgICAgaWYgKHRoaXMuaW5pdGlhbGl6ZWQpIHJldHVybjtcblxuICAgICAgICAvLyBJbnB1dCBhbmQgb3V0cHV0IG5vZGVzXG4gICAgICAgIHRoaXMuaW4gPSB0aGlzLmN0eC5jcmVhdGVDaGFubmVsU3BsaXR0ZXIodGhpcy5uQ2gpO1xuICAgICAgICB0aGlzLm91dCA9IHRoaXMuY3R4LmNyZWF0ZUNoYW5uZWxNZXJnZXIodGhpcy5uQ2gpO1xuXG4gICAgICAgIC8vIEluaXRpYWxpemUgcm90YXRpb24gZ2FpbnMgdG8gaWRlbnRpdHkgbWF0cml4XG4gICAgICAgIGZvciAodmFyIG4gPSAxOyBuIDwgdGhpcy5vcmRlciArIDE7IG4rKykge1xuXG4gICAgICAgICAgICB2YXIgZ2FpbnNfbiA9IG5ldyBBcnJheSgyICogbiArIDEpO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCAyICogbiArIDE7IGkrKykge1xuICAgICAgICAgICAgICAgIGdhaW5zX25baV0gPSBuZXcgQXJyYXkoMiAqIG4gKyAxKTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IDIgKiBuICsgMTsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgIGdhaW5zX25baV1bal0gPSB0aGlzLmN0eC5jcmVhdGVHYWluKCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpID09IGopIGdhaW5zX25baV1bal0uZ2Fpbi52YWx1ZSA9IDE7XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgZ2FpbnNfbltpXVtqXS5nYWluLnZhbHVlID0gMDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLnJvdE10eE5vZGVzW24gLSAxXSA9IGdhaW5zX247XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDcmVhdGUgY29ubmVjdGlvbnNcbiAgICAgICAgdGhpcy5pbi5jb25uZWN0KHRoaXMub3V0LCAwLCAwKTsgLy8gemVyb3RoIG9yZGVyIGNoLiBkb2VzIG5vdCByb3RhdGVcblxuICAgICAgICB2YXIgYmFuZF9pZHggPSAxO1xuICAgICAgICBmb3IgKGxldCBuID0gMTsgbiA8IHRoaXMub3JkZXIgKyAxOyBuKyspIHtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgMiAqIG4gKyAxOyBpKyspIHtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IDIgKiBuICsgMTsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaW4uY29ubmVjdCh0aGlzLnJvdE10eE5vZGVzW24gLSAxXVtpXVtqXSwgYmFuZF9pZHggKyBqLCAwKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5yb3RNdHhOb2Rlc1tuIC0gMV1baV1bal0uY29ubmVjdCh0aGlzLm91dCwgMCwgYmFuZF9pZHggKyBpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBiYW5kX2lkeCA9IGJhbmRfaWR4ICsgMiAqIG4gKyAxO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5pbml0aWFsaXplZCA9IHRydWU7XG4gICAgfVxufVxuIl19