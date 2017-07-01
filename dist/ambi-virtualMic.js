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
//  JSAmbisonics a JavaScript library for higher-order Ambisonics
//  The library implements Web Audio blocks that perform
//  typical ambisonic processing operations on audio signals.
//
////////////////////////////////////////////////////////////////////

/////////////////////////////////
/* HOA VIRTUAL MICROPHONE */
/////////////////////////////////

exports.default = virtualMic;
//# sourceMappingURL=data:application/json;base64,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LENBQVAsRUFBVSxDQUFWLENBQWhCO0FBQ0g7O0FBRUQsaUJBQUssV0FBTDtBQUNIOzs7c0NBRWE7O0FBRVYsZ0JBQUksQ0FBSjtBQUNBLGlCQUFLLElBQUksSUFBSSxDQUFiLEVBQWdCLEtBQUssS0FBSyxLQUExQixFQUFpQyxHQUFqQyxFQUFzQztBQUNsQyxxQkFBSyxJQUFJLElBQUksQ0FBQyxDQUFkLEVBQWlCLEtBQUssQ0FBdEIsRUFBeUIsR0FBekIsRUFBOEI7QUFDMUIsd0JBQUksSUFBSSxDQUFKLEdBQVEsQ0FBUixHQUFZLENBQWhCO0FBQ0EseUJBQUssU0FBTCxDQUFlLENBQWYsSUFBb0IsS0FBSyxVQUFMLENBQWdCLENBQWhCLElBQXFCLEtBQUssS0FBTCxDQUFXLENBQVgsQ0FBekM7QUFDSDtBQUNKOztBQUVELGlCQUFLLElBQUksSUFBSSxDQUFiLEVBQWdCLElBQUksS0FBSyxHQUF6QixFQUE4QixHQUE5QixFQUFtQztBQUMvQixxQkFBSyxhQUFMLENBQW1CLENBQW5CLEVBQXNCLElBQXRCLENBQTJCLEtBQTNCLEdBQW1DLEtBQUssU0FBTCxDQUFlLENBQWYsQ0FBbkM7QUFDSDtBQUNKOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztrQkEzSmdCLFUiLCJmaWxlIjoiYW1iaS12aXJ0dWFsTWljLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vICBBcmNob250aXMgUG9saXRpc1xuLy8gIGFyY2hvbnRpcy5wb2xpdGlzQGFhbHRvLmZpXG4vLyAgRGF2aWQgUG9pcmllci1RdWlub3Rcbi8vICBkYXZpcG9pckBpcmNhbS5mclxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vXG4vLyAgSlNBbWJpc29uaWNzIGEgSmF2YVNjcmlwdCBsaWJyYXJ5IGZvciBoaWdoZXItb3JkZXIgQW1iaXNvbmljc1xuLy8gIFRoZSBsaWJyYXJ5IGltcGxlbWVudHMgV2ViIEF1ZGlvIGJsb2NrcyB0aGF0IHBlcmZvcm1cbi8vICB0eXBpY2FsIGFtYmlzb25pYyBwcm9jZXNzaW5nIG9wZXJhdGlvbnMgb24gYXVkaW8gc2lnbmFscy5cbi8vXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8qIEhPQSBWSVJUVUFMIE1JQ1JPUEhPTkUgKi9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG5pbXBvcnQgKiBhcyBqc2hsaWIgZnJvbSAnc3BoZXJpY2FsLWhhcm1vbmljLXRyYW5zZm9ybSc7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIHZpcnR1YWxNaWMge1xuXG4gICAgY29uc3RydWN0b3IoYXVkaW9DdHgsIG9yZGVyKSB7XG5cbiAgICAgICAgdGhpcy5pbml0aWFsaXplZCA9IGZhbHNlO1xuXG4gICAgICAgIHRoaXMuY3R4ID0gYXVkaW9DdHg7XG4gICAgICAgIHRoaXMub3JkZXIgPSBvcmRlcjtcbiAgICAgICAgdGhpcy5uQ2ggPSAob3JkZXIgKyAxKSAqIChvcmRlciArIDEpO1xuICAgICAgICB0aGlzLmF6aW0gPSAwO1xuICAgICAgICB0aGlzLmVsZXYgPSAwO1xuICAgICAgICB0aGlzLnZtaWNHYWlucyA9IG5ldyBBcnJheSh0aGlzLm5DaCk7XG4gICAgICAgIHRoaXMudm1pY0dhaW5Ob2RlcyA9IG5ldyBBcnJheSh0aGlzLm5DaCk7XG4gICAgICAgIHRoaXMudm1pY0NvZWZmcyA9IG5ldyBBcnJheSh0aGlzLm9yZGVyICsgMSk7XG4gICAgICAgIHRoaXMudm1pY1BhdHRlcm4gPSBcImh5cGVyY2FyZGlvaWRcIjtcbiAgICAgICAgdGhpcy5pbiA9IHRoaXMuY3R4LmNyZWF0ZUNoYW5uZWxTcGxpdHRlcih0aGlzLm5DaCk7XG4gICAgICAgIHRoaXMub3V0ID0gdGhpcy5jdHguY3JlYXRlR2FpbigpO1xuXG4gICAgICAgIC8vIEluaXRpYWxpemUgdm1pYyB0byBmb3J3YXJkIGZhY2luZyBoeXBlcmNhcmRpb2lkXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5uQ2g7IGkrKykge1xuICAgICAgICAgICAgdGhpcy52bWljR2Fpbk5vZGVzW2ldID0gdGhpcy5jdHguY3JlYXRlR2FpbigpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuU0h4eXogPSBuZXcgQXJyYXkodGhpcy5uQ2gpO1xuICAgICAgICB0aGlzLlNIeHl6LmZpbGwoMCk7XG4gICAgICAgIHRoaXMudXBkYXRlUGF0dGVybigpO1xuICAgICAgICB0aGlzLnVwZGF0ZU9yaWVudGF0aW9uKCk7XG5cbiAgICAgICAgLy8gQ3JlYXRlIGNvbm5lY3Rpb25zXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCB0aGlzLm5DaDsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLmluLmNvbm5lY3QodGhpcy52bWljR2Fpbk5vZGVzW2ldLCBpLCAwKTtcbiAgICAgICAgICAgIHRoaXMudm1pY0dhaW5Ob2Rlc1tpXS5jb25uZWN0KHRoaXMub3V0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuaW5pdGlhbGl6ZWQgPSB0cnVlO1xuICAgIH1cblxuXG4gICAgdXBkYXRlUGF0dGVybigpIHtcblxuICAgICAgICBmdW5jdGlvbiBjb21wdXRlQ2FyZGlvaWRDb2VmZnMoTikge1xuICAgICAgICAgICAgdmFyIGNvZWZmcyA9IG5ldyBBcnJheShOICsgMSk7XG4gICAgICAgICAgICBmb3IgKHZhciBuID0gMDsgbiA8PSBOOyBuKyspIHtcbiAgICAgICAgICAgICAgICBjb2VmZnNbbl0gPSBqc2hsaWIuZmFjdG9yaWFsKE4pICoganNobGliLmZhY3RvcmlhbChOKSAvIChqc2hsaWIuZmFjdG9yaWFsKE4gKyBuICsgMSkgKiBqc2hsaWIuZmFjdG9yaWFsKE4gLSBuKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gY29lZmZzO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gY29tcHV0ZUh5cGVyY2FyZENvZWZmcyhOKSB7XG4gICAgICAgICAgICB2YXIgY29lZmZzID0gbmV3IEFycmF5KE4gKyAxKTtcbiAgICAgICAgICAgIHZhciBuU0ggPSAoTisxKSooTisxKTtcbiAgICAgICAgICAgIGZvciAodmFyIG4gPSAwOyBuIDw9IE47IG4rKykge1xuICAgICAgICAgICAgICAgIGNvZWZmc1tuXSA9IDEgLyBuU0g7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gY29lZmZzO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gY29tcHV0ZVN1cGVyY2FyZENvZWZmcyhOKSB7XG4gICAgICAgICAgICBzd2l0Y2ggKE4pIHtcbiAgICAgICAgICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgICAgICAgICAgIHZhciBjb2VmZnMgPSBbMC4zNjYwLCAwLjIxMTNdO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgICAgICAgICAgIHZhciBjb2VmZnMgPSBbMC4yMzYyLCAwLjE1NjIsIDAuMDU5MF07XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgMzpcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNvZWZmcyA9IFswLjE3NjgsIDAuMTI4MSwgMC4wNjMzLCAwLjAxNzVdO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIDQ6XG4gICAgICAgICAgICAgICAgICAgIHZhciBjb2VmZnMgPSBbMC4xNDE0LCAwLjEwODcsIDAuMDYyMywgMC4wMjQ3LCAwLjAwNTRdO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiT3JkZXJzIHNob3VsZCBiZSBpbiB0aGUgcmFuZ2Ugb2YgMS00IGF0IHRoZSBtb21lbnQuXCIpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gY29lZmZzO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gY29tcHV0ZU1heFJFQ29lZmZzKE4pIHtcbiAgICAgICAgICAgIHZhciBjb2VmZnMgPSBuZXcgQXJyYXkoTiArIDEpO1xuICAgICAgICAgICAgY29lZmZzWzBdID0gMTtcbiAgICAgICAgICAgIHZhciBsZWdfbl9taW51czEgPSAwO1xuICAgICAgICAgICAgdmFyIGxlZ19uX21pbnVzMiA9IDA7XG4gICAgICAgICAgICB2YXIgbGVnX24gPSAwO1xuICAgICAgICAgICAgZm9yICh2YXIgbiA9IDE7IG4gPCBOICsgMTsgbisrKSB7XG4gICAgICAgICAgICAgICAgbGVnX24gPSBqc2hsaWIucmVjdXJzZUxlZ2VuZHJlUG9seShuLCBbTWF0aC5jb3MoMi40MDY4MDkgLyAoTiArIDEuNTEpKV0sIGxlZ19uX21pbnVzMSwgbGVnX25fbWludXMyKTtcbiAgICAgICAgICAgICAgICBjb2VmZnNbbl0gPSBsZWdfblswXVswXTtcblxuICAgICAgICAgICAgICAgIGxlZ19uX21pbnVzMiA9IGxlZ19uX21pbnVzMTtcbiAgICAgICAgICAgICAgICBsZWdfbl9taW51czEgPSBsZWdfbjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIGNvbXB1dGUgbm9ybWFsaXphdGlvbiBmYWN0b3JcbiAgICAgICAgICAgIHZhciBub3JtID0gMDtcbiAgICAgICAgICAgIGZvciAodmFyIG4gPSAwOyBuIDw9IE47IG4rKykge1xuICAgICAgICAgICAgICAgIG5vcm0gKz0gY29lZmZzW25dICogKDIqbisxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZvciAodmFyIG4gPSAwOyBuIDw9IE47IG4rKykge1xuICAgICAgICAgICAgICAgIGNvZWZmc1tuXSA9IGNvZWZmc1tuXS9ub3JtO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGNvZWZmcztcbiAgICAgICAgfVxuXG4gICAgICAgIHN3aXRjaCAodGhpcy52bWljUGF0dGVybikge1xuICAgICAgICAgICAgY2FzZSBcImNhcmRpb2lkXCI6XG4gICAgICAgICAgICAgICAgLy8gaGlnaGVyLW9yZGVyIGNhcmRpb2lkIGdpdmVuIGJ5OiAoMS8yKV5OICogKCAxK2Nvcyh0aGV0YSkgKV5OXG4gICAgICAgICAgICAgICAgdGhpcy52bWljQ29lZmZzID0gY29tcHV0ZUNhcmRpb2lkQ29lZmZzKHRoaXMub3JkZXIpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcInN1cGVyY2FyZGlvaWRcIjpcbiAgICAgICAgICAgICAgICAvLyBtYXhpbXVtIGZyb250LWJhY2sgZW5lcmd5IHJhdGlvXG4gICAgICAgICAgICAgICAgdGhpcy52bWljQ29lZmZzID0gY29tcHV0ZVN1cGVyY2FyZENvZWZmcyh0aGlzLm9yZGVyKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCJoeXBlcmNhcmRpb2lkXCI6XG4gICAgICAgICAgICAgICAgLy8gbWF4aW11bSBkaXJlY3Rpdml0eSBmYWN0b3JcbiAgICAgICAgICAgICAgICAvLyAodGhpcyBpcyB0aGUgY2xhc3NpYyBwbGFuZS93YXZlIGRlY29tcG9zaXRpb24gYmVhbWZvcm1lcixcbiAgICAgICAgICAgICAgICAvLyBhbHNvIHRlcm1lZCBcInJlZ3VsYXJcIiBpbiBzcGhlcmljYWwgYmVhbWZvcm1pbmcgbGl0ZXJhdHVyZSlcbiAgICAgICAgICAgICAgICB0aGlzLnZtaWNDb2VmZnMgPSBjb21wdXRlSHlwZXJjYXJkQ29lZmZzKHRoaXMub3JkZXIpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcIm1heF9yRVwiOlxuICAgICAgICAgICAgICAgIC8vIHF1aXRlIHNpbWlsYXIgdG8gbWF4aW11bSBmcm9udC1iYWNrIHJlamVjdGlvblxuICAgICAgICAgICAgICAgIHRoaXMudm1pY0NvZWZmcyA9IGNvbXB1dGVNYXhSRUNvZWZmcyh0aGlzLm9yZGVyKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgdGhpcy52bWljUGF0dGVybiA9IFwiaHlwZXJjYXJkaW9pZFwiO1xuICAgICAgICAgICAgICAgIHRoaXMudm1pY0NvZWZmcyA9IGNvbXB1dGVIeXBlcmNhcmRDb2VmZnModGhpcy5vcmRlcik7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnVwZGF0ZUdhaW5zKCk7XG4gICAgfVxuXG4gICAgdXBkYXRlT3JpZW50YXRpb24oKSB7XG5cbiAgICAgICAgdmFyIGF6aW0gPSB0aGlzLmF6aW0gKiBNYXRoLlBJIC8gMTgwO1xuICAgICAgICB2YXIgZWxldiA9IHRoaXMuZWxldiAqIE1hdGguUEkgLyAxODA7XG5cbiAgICAgICAgdmFyIHRlbXBTSCA9IGpzaGxpYi5jb21wdXRlUmVhbFNIKHRoaXMub3JkZXIsIFsgW2F6aW0sIGVsZXZdIF0pO1xuXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5uQ2g7IGkrKykge1xuICAgICAgICAgICAgdGhpcy5TSHh5eltpXSA9IHRlbXBTSFtpXVswXTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMudXBkYXRlR2FpbnMoKTtcbiAgICB9XG5cbiAgICB1cGRhdGVHYWlucygpIHtcblxuICAgICAgICB2YXIgcTtcbiAgICAgICAgZm9yICh2YXIgbiA9IDA7IG4gPD0gdGhpcy5vcmRlcjsgbisrKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBtID0gLW47IG0gPD0gbjsgbSsrKSB7XG4gICAgICAgICAgICAgICAgcSA9IG4gKiBuICsgbiArIG07XG4gICAgICAgICAgICAgICAgdGhpcy52bWljR2FpbnNbcV0gPSB0aGlzLnZtaWNDb2VmZnNbbl0gKiB0aGlzLlNIeHl6W3FdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm5DaDsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLnZtaWNHYWluTm9kZXNbaV0uZ2Fpbi52YWx1ZSA9IHRoaXMudm1pY0dhaW5zW2ldO1xuICAgICAgICB9XG4gICAgfVxufVxuIl19