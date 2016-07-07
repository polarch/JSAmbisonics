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
                for (var n = 0; n <= N; n++) {
                    coeffs[n] = Math.sqrt(2 * n + 1) * jshlib.factorial(N) * jshlib.factorial(N + 1) / (jshlib.factorial(N + n + 1) * jshlib.factorial(N - n)) / (N + 1);
                }
                return coeffs;
            }

            function computeHypercardCoeffs(N) {
                var coeffs = new Array(N + 1);
                var nSH = (N + 1) * (N + 1);
                for (var n = 0; n <= N; n++) {
                    coeffs[n] = Math.sqrt(2 * n + 1) / nSH;
                }
                return coeffs;
            }

            function computeSupercardCoeffs(N) {
                switch (N) {
                    case 1:
                        var coeffs = [0.3660, 0.3660];
                        break;
                    case 2:
                        var coeffs = [0.2362, 0.2706, 0.1320];
                        break;
                    case 3:
                        var coeffs = [0.1768, 0.2218, 0.1416, 0.0463];
                        break;
                    case 4:
                        var coeffs = [0.1414, 0.1883, 0.1394, 0.0653, 0.0161];
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
                    coeffs[n] = Math.sqrt(2 * n + 1) * leg_n[0][0];

                    leg_n_minus2 = leg_n_minus1;
                    leg_n_minus1 = leg_n;
                }
                // compute normalization factor
                var norm = 0;
                for (var n = 0; n <= N; n++) {
                    norm += coeffs[n] * Math.sqrt(2 * n + 1);
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

            var azi = this.azi * Math.PI / 180;
            var elev = this.elev * Math.PI / 180;

            var tempSH = jshlib.computeRealSH(this.order, [[azi, elev]]);

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
                    this.vmicGains[q] = this.vmicCoeffs[n] * this.SHxyz[q] / Math.sqrt(2 * n + 1);
                }
            }

            for (var i = 0; i < this.nCh; i++) {
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
//# sourceMappingURL=data:application/json;base64,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S0FBSyxLQUExQixFQUFpQyxDQUFFLENBQUMsR0FBRCxFQUFNLElBQU4sQ0FBRixDQUFqQyxDQUFiOztBQUVBLGlCQUFLLElBQUksSUFBSSxDQUFiLEVBQWdCLElBQUksS0FBSyxHQUF6QixFQUE4QixHQUE5QixFQUFtQztBQUMvQixxQkFBSyxLQUFMLENBQVcsQ0FBWCxJQUFnQixPQUFPLENBQVAsRUFBVSxDQUFWLENBQWhCO0FBQ0g7O0FBRUQsaUJBQUssV0FBTDtBQUNIOzs7c0NBRWE7O0FBRVYsZ0JBQUksQ0FBSjtBQUNBLGlCQUFLLElBQUksSUFBSSxDQUFiLEVBQWdCLEtBQUssS0FBSyxLQUExQixFQUFpQyxHQUFqQyxFQUFzQztBQUNsQyxxQkFBSyxJQUFJLElBQUksQ0FBQyxDQUFkLEVBQWlCLEtBQUssQ0FBdEIsRUFBeUIsR0FBekIsRUFBOEI7QUFDMUIsd0JBQUksSUFBSSxDQUFKLEdBQVEsQ0FBUixHQUFZLENBQWhCO0FBQ0EseUJBQUssU0FBTCxDQUFlLENBQWYsSUFBb0IsS0FBSyxVQUFMLENBQWdCLENBQWhCLElBQXFCLEtBQUssS0FBTCxDQUFXLENBQVgsQ0FBckIsR0FBcUMsS0FBSyxJQUFMLENBQVUsSUFBRSxDQUFGLEdBQUksQ0FBZCxDQUF6RDtBQUNIO0FBQ0o7O0FBRUQsaUJBQUssSUFBSSxJQUFJLENBQWIsRUFBZ0IsSUFBSSxLQUFLLEdBQXpCLEVBQThCLEdBQTlCLEVBQW1DO0FBQy9CLHFCQUFLLGFBQUwsQ0FBbUIsQ0FBbkIsRUFBc0IsSUFBdEIsQ0FBMkIsS0FBM0IsR0FBbUMsS0FBSyxTQUFMLENBQWUsQ0FBZixDQUFuQztBQUNIO0FBQ0o7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O2tCQTNKZ0IsUSIsImZpbGUiOiJhbWJpLXZpcnR1YWxNaWMuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gIEFyY2hvbnRpcyBQb2xpdGlzXG4vLyAgYXJjaG9udGlzLnBvbGl0aXNAYWFsdG8uZmlcbi8vICBEYXZpZCBQb2lyaWVyLVF1aW5vdFxuLy8gIGRhdmlwb2lyQGlyY2FtLmZyXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy9cbi8vICBXZWJBdWRpb19IT0EgYSBKYXZhU2NyaXB0IGxpYnJhcnkgZm9yIGhpZ2hlci1vcmRlciBBbWJpc29uaWNzXG4vLyAgVGhlIGxpYnJhcnkgaW1wbGVtZW50cyBXZWIgQXVkaW8gYmxvY2tzIHRoYXQgcGVyZm9ybVxuLy8gIHR5cGljYWwgYW1iaXNvbmljIHByb2Nlc3Npbmcgb3BlcmF0aW9ucyBvbiBhdWRpbyBzaWduYWxzLlxuLy9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLyogSE9BIFZJUlRVQUwgTUlDUk9QSE9ORSAqL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbmltcG9ydCAqIGFzIGpzaGxpYiBmcm9tICdzcGhlcmljYWwtaGFybW9uaWMtdHJhbnNmb3JtJztcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgSE9BX3ZtaWMge1xuXG4gICAgY29uc3RydWN0b3IoYXVkaW9DdHgsIG9yZGVyKSB7XG5cbiAgICAgICAgdGhpcy5pbml0aWFsaXplZCA9IGZhbHNlO1xuXG4gICAgICAgIHRoaXMuY3R4ID0gYXVkaW9DdHg7XG4gICAgICAgIHRoaXMub3JkZXIgPSBvcmRlcjtcbiAgICAgICAgdGhpcy5uQ2ggPSAob3JkZXIgKyAxKSAqIChvcmRlciArIDEpO1xuICAgICAgICB0aGlzLmF6aSA9IDA7XG4gICAgICAgIHRoaXMuZWxldiA9IDA7XG4gICAgICAgIHRoaXMudm1pY0dhaW5zID0gbmV3IEFycmF5KHRoaXMubkNoKTtcbiAgICAgICAgdGhpcy52bWljR2Fpbk5vZGVzID0gbmV3IEFycmF5KHRoaXMubkNoKTtcbiAgICAgICAgdGhpcy52bWljQ29lZmZzID0gbmV3IEFycmF5KHRoaXMub3JkZXIgKyAxKTtcbiAgICAgICAgdGhpcy52bWljUGF0dGVybiA9IFwiaHlwZXJjYXJkaW9pZFwiO1xuICAgICAgICB0aGlzLmluID0gdGhpcy5jdHguY3JlYXRlQ2hhbm5lbFNwbGl0dGVyKHRoaXMubkNoKTtcbiAgICAgICAgdGhpcy5vdXQgPSB0aGlzLmN0eC5jcmVhdGVHYWluKCk7XG5cbiAgICAgICAgLy8gSW5pdGlhbGl6ZSB2bWljIHRvIGZvcndhcmQgZmFjaW5nIGh5cGVyY2FyZGlvaWRcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm5DaDsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLnZtaWNHYWluTm9kZXNbaV0gPSB0aGlzLmN0eC5jcmVhdGVHYWluKCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5TSHh5eiA9IG5ldyBBcnJheSh0aGlzLm5DaCk7XG4gICAgICAgIHRoaXMuU0h4eXouZmlsbCgwKTtcbiAgICAgICAgdGhpcy51cGRhdGVQYXR0ZXJuKCk7XG4gICAgICAgIHRoaXMudXBkYXRlT3JpZW50YXRpb24oKTtcblxuICAgICAgICAvLyBDcmVhdGUgY29ubmVjdGlvbnNcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IHRoaXMubkNoOyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMuaW4uY29ubmVjdCh0aGlzLnZtaWNHYWluTm9kZXNbaV0sIGksIDApO1xuICAgICAgICAgICAgdGhpcy52bWljR2Fpbk5vZGVzW2ldLmNvbm5lY3QodGhpcy5vdXQpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5pbml0aWFsaXplZCA9IHRydWU7XG4gICAgfVxuXG5cbiAgICB1cGRhdGVQYXR0ZXJuKCkge1xuXG4gICAgICAgIGZ1bmN0aW9uIGNvbXB1dGVDYXJkaW9pZENvZWZmcyhOKSB7XG4gICAgICAgICAgICB2YXIgY29lZmZzID0gbmV3IEFycmF5KE4gKyAxKTtcbiAgICAgICAgICAgIGZvciAodmFyIG4gPSAwOyBuIDw9IE47IG4rKykge1xuICAgICAgICAgICAgICAgIGNvZWZmc1tuXSA9IE1hdGguc3FydCgyKm4rMSkgKiBqc2hsaWIuZmFjdG9yaWFsKE4pICoganNobGliLmZhY3RvcmlhbChOICsgMSkgLyAoanNobGliLmZhY3RvcmlhbChOICsgbiArIDEpICoganNobGliLmZhY3RvcmlhbChOIC0gbikpIC8gKE4gKyAxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBjb2VmZnM7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBjb21wdXRlSHlwZXJjYXJkQ29lZmZzKE4pIHtcbiAgICAgICAgICAgIHZhciBjb2VmZnMgPSBuZXcgQXJyYXkoTiArIDEpO1xuICAgICAgICAgICAgdmFyIG5TSCA9IChOKzEpKihOKzEpO1xuICAgICAgICAgICAgZm9yICh2YXIgbiA9IDA7IG4gPD0gTjsgbisrKSB7XG4gICAgICAgICAgICAgICAgY29lZmZzW25dID0gTWF0aC5zcXJ0KDIqbisxKSAvIG5TSDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBjb2VmZnM7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGZ1bmN0aW9uIGNvbXB1dGVTdXBlcmNhcmRDb2VmZnMoTikge1xuICAgICAgICAgICAgc3dpdGNoIChOKSB7XG4gICAgICAgICAgICAgICAgY2FzZSAxOlxuICAgICAgICAgICAgICAgICAgICB2YXIgY29lZmZzID0gWzAuMzY2MCwgMC4zNjYwXTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAyOlxuICAgICAgICAgICAgICAgICAgICB2YXIgY29lZmZzID0gWzAuMjM2MiwgMC4yNzA2LCAwLjEzMjBdO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIDM6XG4gICAgICAgICAgICAgICAgICAgIHZhciBjb2VmZnMgPSBbMC4xNzY4LCAwLjIyMTgsIDAuMTQxNiwgMC4wNDYzXTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSA0OlxuICAgICAgICAgICAgICAgICAgICB2YXIgY29lZmZzID0gWzAuMTQxNCwgMC4xODgzLCAwLjEzOTQsIDAuMDY1MywgMC4wMTYxXTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIk9yZGVycyBzaG91bGQgYmUgaW4gdGhlIHJhbmdlIG9mIDEtNCBhdCB0aGUgbW9tZW50LlwiKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGNvZWZmcztcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGNvbXB1dGVNYXhSRUNvZWZmcyhOKSB7XG4gICAgICAgICAgICB2YXIgY29lZmZzID0gbmV3IEFycmF5KE4gKyAxKTtcbiAgICAgICAgICAgIGNvZWZmc1swXSA9IDE7XG4gICAgICAgICAgICB2YXIgbGVnX25fbWludXMxID0gMDtcbiAgICAgICAgICAgIHZhciBsZWdfbl9taW51czIgPSAwO1xuICAgICAgICAgICAgdmFyIGxlZ19uID0gMDtcbiAgICAgICAgICAgIGZvciAodmFyIG4gPSAxOyBuIDwgTiArIDE7IG4rKykge1xuICAgICAgICAgICAgICAgIGxlZ19uID0ganNobGliLnJlY3Vyc2VMZWdlbmRyZVBvbHkobiwgW01hdGguY29zKDIuNDA2ODA5IC8gKE4gKyAxLjUxKSldLCBsZWdfbl9taW51czEsIGxlZ19uX21pbnVzMik7XG4gICAgICAgICAgICAgICAgY29lZmZzW25dID0gTWF0aC5zcXJ0KDIqbisxKSAqIGxlZ19uWzBdWzBdO1xuXG4gICAgICAgICAgICAgICAgbGVnX25fbWludXMyID0gbGVnX25fbWludXMxO1xuICAgICAgICAgICAgICAgIGxlZ19uX21pbnVzMSA9IGxlZ19uO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gY29tcHV0ZSBub3JtYWxpemF0aW9uIGZhY3RvclxuICAgICAgICAgICAgdmFyIG5vcm0gPSAwO1xuICAgICAgICAgICAgZm9yICh2YXIgbiA9IDA7IG4gPD0gTjsgbisrKSB7XG4gICAgICAgICAgICAgICAgbm9ybSArPSBjb2VmZnNbbl0gKiBNYXRoLnNxcnQoMipuKzEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZm9yICh2YXIgbiA9IDA7IG4gPD0gTjsgbisrKSB7XG4gICAgICAgICAgICAgICAgY29lZmZzW25dID0gY29lZmZzW25dL25vcm07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gY29lZmZzO1xuICAgICAgICB9XG5cbiAgICAgICAgc3dpdGNoICh0aGlzLnZtaWNQYXR0ZXJuKSB7XG4gICAgICAgICAgICBjYXNlIFwiY2FyZGlvaWRcIjpcbiAgICAgICAgICAgICAgICAvLyBoaWdoZXItb3JkZXIgY2FyZGlvaWQgZ2l2ZW4gYnk6ICgxLzIpXk4gKiAoIDErY29zKHRoZXRhKSApXk5cbiAgICAgICAgICAgICAgICB0aGlzLnZtaWNDb2VmZnMgPSBjb21wdXRlQ2FyZGlvaWRDb2VmZnModGhpcy5vcmRlcik7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwic3VwZXJjYXJkaW9pZFwiOlxuICAgICAgICAgICAgICAgIC8vIG1heGltdW0gZnJvbnQtYmFjayBlbmVyZ3kgcmF0aW9cbiAgICAgICAgICAgICAgICB0aGlzLnZtaWNDb2VmZnMgPSBjb21wdXRlU3VwZXJjYXJkQ29lZmZzKHRoaXMub3JkZXIpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcImh5cGVyY2FyZGlvaWRcIjpcbiAgICAgICAgICAgICAgICAvLyBtYXhpbXVtIGRpcmVjdGl2aXR5IGZhY3RvclxuICAgICAgICAgICAgICAgIC8vICh0aGlzIGlzIHRoZSBjbGFzc2ljIHBsYW5lL3dhdmUgZGVjb21wb3NpdGlvbiBiZWFtZm9ybWVyLFxuICAgICAgICAgICAgICAgIC8vIGFsc28gdGVybWVkIFwicmVndWxhclwiIGluIHNwaGVyaWNhbCBiZWFtZm9ybWluZyBsaXRlcmF0dXJlKVxuICAgICAgICAgICAgICAgIHRoaXMudm1pY0NvZWZmcyA9IGNvbXB1dGVIeXBlcmNhcmRDb2VmZnModGhpcy5vcmRlcik7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwibWF4X3JFXCI6XG4gICAgICAgICAgICAgICAgLy8gcXVpdGUgc2ltaWxhciB0byBtYXhpbXVtIGZyb250LWJhY2sgcmVqZWN0aW9uXG4gICAgICAgICAgICAgICAgdGhpcy52bWljQ29lZmZzID0gY29tcHV0ZU1heFJFQ29lZmZzKHRoaXMub3JkZXIpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICB0aGlzLnZtaWNQYXR0ZXJuID0gXCJoeXBlcmNhcmRpb2lkXCI7XG4gICAgICAgICAgICAgICAgdGhpcy52bWljQ29lZmZzID0gY29tcHV0ZUh5cGVyY2FyZENvZWZmcyh0aGlzLm9yZGVyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMudXBkYXRlR2FpbnMoKTtcbiAgICB9XG5cbiAgICB1cGRhdGVPcmllbnRhdGlvbigpIHtcblxuICAgICAgICB2YXIgYXppID0gdGhpcy5hemkgKiBNYXRoLlBJIC8gMTgwO1xuICAgICAgICB2YXIgZWxldiA9IHRoaXMuZWxldiAqIE1hdGguUEkgLyAxODA7XG5cbiAgICAgICAgdmFyIHRlbXBTSCA9IGpzaGxpYi5jb21wdXRlUmVhbFNIKHRoaXMub3JkZXIsIFsgW2F6aSwgZWxldl0gXSk7XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm5DaDsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLlNIeHl6W2ldID0gdGVtcFNIW2ldWzBdO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy51cGRhdGVHYWlucygpO1xuICAgIH1cblxuICAgIHVwZGF0ZUdhaW5zKCkge1xuXG4gICAgICAgIHZhciBxO1xuICAgICAgICBmb3IgKHZhciBuID0gMDsgbiA8PSB0aGlzLm9yZGVyOyBuKyspIHtcbiAgICAgICAgICAgIGZvciAodmFyIG0gPSAtbjsgbSA8PSBuOyBtKyspIHtcbiAgICAgICAgICAgICAgICBxID0gbiAqIG4gKyBuICsgbTtcbiAgICAgICAgICAgICAgICB0aGlzLnZtaWNHYWluc1txXSA9IHRoaXMudm1pY0NvZWZmc1tuXSAqIHRoaXMuU0h4eXpbcV0gLyBNYXRoLnNxcnQoMipuKzEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm5DaDsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLnZtaWNHYWluTm9kZXNbaV0uZ2Fpbi52YWx1ZSA9IHRoaXMudm1pY0dhaW5zW2ldO1xuICAgICAgICB9XG4gICAgfVxufVxuIl19