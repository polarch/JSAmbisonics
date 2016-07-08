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

    (0, _createClass3.default)(virtualMic, [{
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
//# sourceMappingURL=data:application/json;base64,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S0FBSyxLQUExQixFQUFpQyxDQUFFLENBQUMsR0FBRCxFQUFNLElBQU4sQ0FBRixDQUFqQyxDQUFiOztBQUVBLGlCQUFLLElBQUksSUFBSSxDQUFiLEVBQWdCLElBQUksS0FBSyxHQUF6QixFQUE4QixHQUE5QixFQUFtQztBQUMvQixxQkFBSyxLQUFMLENBQVcsQ0FBWCxJQUFnQixPQUFPLENBQVAsRUFBVSxDQUFWLENBQWhCO0FBQ0g7O0FBRUQsaUJBQUssV0FBTDtBQUNIOzs7c0NBRWE7O0FBRVYsZ0JBQUksQ0FBSjtBQUNBLGlCQUFLLElBQUksSUFBSSxDQUFiLEVBQWdCLEtBQUssS0FBSyxLQUExQixFQUFpQyxHQUFqQyxFQUFzQztBQUNsQyxxQkFBSyxJQUFJLElBQUksQ0FBQyxDQUFkLEVBQWlCLEtBQUssQ0FBdEIsRUFBeUIsR0FBekIsRUFBOEI7QUFDMUIsd0JBQUksSUFBSSxDQUFKLEdBQVEsQ0FBUixHQUFZLENBQWhCO0FBQ0EseUJBQUssU0FBTCxDQUFlLENBQWYsSUFBb0IsS0FBSyxVQUFMLENBQWdCLENBQWhCLElBQXFCLEtBQUssS0FBTCxDQUFXLENBQVgsQ0FBckIsR0FBcUMsS0FBSyxJQUFMLENBQVUsSUFBRSxDQUFGLEdBQUksQ0FBZCxDQUF6RDtBQUNIO0FBQ0o7O0FBRUQsaUJBQUssSUFBSSxJQUFJLENBQWIsRUFBZ0IsSUFBSSxLQUFLLEdBQXpCLEVBQThCLEdBQTlCLEVBQW1DO0FBQy9CLHFCQUFLLGFBQUwsQ0FBbUIsQ0FBbkIsRUFBc0IsSUFBdEIsQ0FBMkIsS0FBM0IsR0FBbUMsS0FBSyxTQUFMLENBQWUsQ0FBZixDQUFuQztBQUNIO0FBQ0o7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O2tCQTNKZ0IsVSIsImZpbGUiOiJhbWJpLXZpcnR1YWxNaWMuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gIEFyY2hvbnRpcyBQb2xpdGlzXG4vLyAgYXJjaG9udGlzLnBvbGl0aXNAYWFsdG8uZmlcbi8vICBEYXZpZCBQb2lyaWVyLVF1aW5vdFxuLy8gIGRhdmlwb2lyQGlyY2FtLmZyXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy9cbi8vICBXZWJBdWRpb19IT0EgYSBKYXZhU2NyaXB0IGxpYnJhcnkgZm9yIGhpZ2hlci1vcmRlciBBbWJpc29uaWNzXG4vLyAgVGhlIGxpYnJhcnkgaW1wbGVtZW50cyBXZWIgQXVkaW8gYmxvY2tzIHRoYXQgcGVyZm9ybVxuLy8gIHR5cGljYWwgYW1iaXNvbmljIHByb2Nlc3Npbmcgb3BlcmF0aW9ucyBvbiBhdWRpbyBzaWduYWxzLlxuLy9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLyogSE9BIFZJUlRVQUwgTUlDUk9QSE9ORSAqL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbmltcG9ydCAqIGFzIGpzaGxpYiBmcm9tICdzcGhlcmljYWwtaGFybW9uaWMtdHJhbnNmb3JtJztcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgdmlydHVhbE1pYyB7XG5cbiAgICBjb25zdHJ1Y3RvcihhdWRpb0N0eCwgb3JkZXIpIHtcblxuICAgICAgICB0aGlzLmluaXRpYWxpemVkID0gZmFsc2U7XG5cbiAgICAgICAgdGhpcy5jdHggPSBhdWRpb0N0eDtcbiAgICAgICAgdGhpcy5vcmRlciA9IG9yZGVyO1xuICAgICAgICB0aGlzLm5DaCA9IChvcmRlciArIDEpICogKG9yZGVyICsgMSk7XG4gICAgICAgIHRoaXMuYXppID0gMDtcbiAgICAgICAgdGhpcy5lbGV2ID0gMDtcbiAgICAgICAgdGhpcy52bWljR2FpbnMgPSBuZXcgQXJyYXkodGhpcy5uQ2gpO1xuICAgICAgICB0aGlzLnZtaWNHYWluTm9kZXMgPSBuZXcgQXJyYXkodGhpcy5uQ2gpO1xuICAgICAgICB0aGlzLnZtaWNDb2VmZnMgPSBuZXcgQXJyYXkodGhpcy5vcmRlciArIDEpO1xuICAgICAgICB0aGlzLnZtaWNQYXR0ZXJuID0gXCJoeXBlcmNhcmRpb2lkXCI7XG4gICAgICAgIHRoaXMuaW4gPSB0aGlzLmN0eC5jcmVhdGVDaGFubmVsU3BsaXR0ZXIodGhpcy5uQ2gpO1xuICAgICAgICB0aGlzLm91dCA9IHRoaXMuY3R4LmNyZWF0ZUdhaW4oKTtcblxuICAgICAgICAvLyBJbml0aWFsaXplIHZtaWMgdG8gZm9yd2FyZCBmYWNpbmcgaHlwZXJjYXJkaW9pZFxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubkNoOyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMudm1pY0dhaW5Ob2Rlc1tpXSA9IHRoaXMuY3R4LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLlNIeHl6ID0gbmV3IEFycmF5KHRoaXMubkNoKTtcbiAgICAgICAgdGhpcy5TSHh5ei5maWxsKDApO1xuICAgICAgICB0aGlzLnVwZGF0ZVBhdHRlcm4oKTtcbiAgICAgICAgdGhpcy51cGRhdGVPcmllbnRhdGlvbigpO1xuXG4gICAgICAgIC8vIENyZWF0ZSBjb25uZWN0aW9uc1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgdGhpcy5uQ2g7IGkrKykge1xuICAgICAgICAgICAgdGhpcy5pbi5jb25uZWN0KHRoaXMudm1pY0dhaW5Ob2Rlc1tpXSwgaSwgMCk7XG4gICAgICAgICAgICB0aGlzLnZtaWNHYWluTm9kZXNbaV0uY29ubmVjdCh0aGlzLm91dCk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmluaXRpYWxpemVkID0gdHJ1ZTtcbiAgICB9XG5cblxuICAgIHVwZGF0ZVBhdHRlcm4oKSB7XG5cbiAgICAgICAgZnVuY3Rpb24gY29tcHV0ZUNhcmRpb2lkQ29lZmZzKE4pIHtcbiAgICAgICAgICAgIHZhciBjb2VmZnMgPSBuZXcgQXJyYXkoTiArIDEpO1xuICAgICAgICAgICAgZm9yICh2YXIgbiA9IDA7IG4gPD0gTjsgbisrKSB7XG4gICAgICAgICAgICAgICAgY29lZmZzW25dID0gTWF0aC5zcXJ0KDIqbisxKSAqIGpzaGxpYi5mYWN0b3JpYWwoTikgKiBqc2hsaWIuZmFjdG9yaWFsKE4gKyAxKSAvIChqc2hsaWIuZmFjdG9yaWFsKE4gKyBuICsgMSkgKiBqc2hsaWIuZmFjdG9yaWFsKE4gLSBuKSkgLyAoTiArIDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGNvZWZmcztcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGNvbXB1dGVIeXBlcmNhcmRDb2VmZnMoTikge1xuICAgICAgICAgICAgdmFyIGNvZWZmcyA9IG5ldyBBcnJheShOICsgMSk7XG4gICAgICAgICAgICB2YXIgblNIID0gKE4rMSkqKE4rMSk7XG4gICAgICAgICAgICBmb3IgKHZhciBuID0gMDsgbiA8PSBOOyBuKyspIHtcbiAgICAgICAgICAgICAgICBjb2VmZnNbbl0gPSBNYXRoLnNxcnQoMipuKzEpIC8gblNIO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGNvZWZmcztcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgZnVuY3Rpb24gY29tcHV0ZVN1cGVyY2FyZENvZWZmcyhOKSB7XG4gICAgICAgICAgICBzd2l0Y2ggKE4pIHtcbiAgICAgICAgICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgICAgICAgICAgIHZhciBjb2VmZnMgPSBbMC4zNjYwLCAwLjM2NjBdO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgICAgICAgICAgIHZhciBjb2VmZnMgPSBbMC4yMzYyLCAwLjI3MDYsIDAuMTMyMF07XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgMzpcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNvZWZmcyA9IFswLjE3NjgsIDAuMjIxOCwgMC4xNDE2LCAwLjA0NjNdO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIDQ6XG4gICAgICAgICAgICAgICAgICAgIHZhciBjb2VmZnMgPSBbMC4xNDE0LCAwLjE4ODMsIDAuMTM5NCwgMC4wNjUzLCAwLjAxNjFdO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiT3JkZXJzIHNob3VsZCBiZSBpbiB0aGUgcmFuZ2Ugb2YgMS00IGF0IHRoZSBtb21lbnQuXCIpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gY29lZmZzO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gY29tcHV0ZU1heFJFQ29lZmZzKE4pIHtcbiAgICAgICAgICAgIHZhciBjb2VmZnMgPSBuZXcgQXJyYXkoTiArIDEpO1xuICAgICAgICAgICAgY29lZmZzWzBdID0gMTtcbiAgICAgICAgICAgIHZhciBsZWdfbl9taW51czEgPSAwO1xuICAgICAgICAgICAgdmFyIGxlZ19uX21pbnVzMiA9IDA7XG4gICAgICAgICAgICB2YXIgbGVnX24gPSAwO1xuICAgICAgICAgICAgZm9yICh2YXIgbiA9IDE7IG4gPCBOICsgMTsgbisrKSB7XG4gICAgICAgICAgICAgICAgbGVnX24gPSBqc2hsaWIucmVjdXJzZUxlZ2VuZHJlUG9seShuLCBbTWF0aC5jb3MoMi40MDY4MDkgLyAoTiArIDEuNTEpKV0sIGxlZ19uX21pbnVzMSwgbGVnX25fbWludXMyKTtcbiAgICAgICAgICAgICAgICBjb2VmZnNbbl0gPSBNYXRoLnNxcnQoMipuKzEpICogbGVnX25bMF1bMF07XG5cbiAgICAgICAgICAgICAgICBsZWdfbl9taW51czIgPSBsZWdfbl9taW51czE7XG4gICAgICAgICAgICAgICAgbGVnX25fbWludXMxID0gbGVnX247XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBjb21wdXRlIG5vcm1hbGl6YXRpb24gZmFjdG9yXG4gICAgICAgICAgICB2YXIgbm9ybSA9IDA7XG4gICAgICAgICAgICBmb3IgKHZhciBuID0gMDsgbiA8PSBOOyBuKyspIHtcbiAgICAgICAgICAgICAgICBub3JtICs9IGNvZWZmc1tuXSAqIE1hdGguc3FydCgyKm4rMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmb3IgKHZhciBuID0gMDsgbiA8PSBOOyBuKyspIHtcbiAgICAgICAgICAgICAgICBjb2VmZnNbbl0gPSBjb2VmZnNbbl0vbm9ybTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBjb2VmZnM7XG4gICAgICAgIH1cblxuICAgICAgICBzd2l0Y2ggKHRoaXMudm1pY1BhdHRlcm4pIHtcbiAgICAgICAgICAgIGNhc2UgXCJjYXJkaW9pZFwiOlxuICAgICAgICAgICAgICAgIC8vIGhpZ2hlci1vcmRlciBjYXJkaW9pZCBnaXZlbiBieTogKDEvMileTiAqICggMStjb3ModGhldGEpICleTlxuICAgICAgICAgICAgICAgIHRoaXMudm1pY0NvZWZmcyA9IGNvbXB1dGVDYXJkaW9pZENvZWZmcyh0aGlzLm9yZGVyKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCJzdXBlcmNhcmRpb2lkXCI6XG4gICAgICAgICAgICAgICAgLy8gbWF4aW11bSBmcm9udC1iYWNrIGVuZXJneSByYXRpb1xuICAgICAgICAgICAgICAgIHRoaXMudm1pY0NvZWZmcyA9IGNvbXB1dGVTdXBlcmNhcmRDb2VmZnModGhpcy5vcmRlcik7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwiaHlwZXJjYXJkaW9pZFwiOlxuICAgICAgICAgICAgICAgIC8vIG1heGltdW0gZGlyZWN0aXZpdHkgZmFjdG9yXG4gICAgICAgICAgICAgICAgLy8gKHRoaXMgaXMgdGhlIGNsYXNzaWMgcGxhbmUvd2F2ZSBkZWNvbXBvc2l0aW9uIGJlYW1mb3JtZXIsXG4gICAgICAgICAgICAgICAgLy8gYWxzbyB0ZXJtZWQgXCJyZWd1bGFyXCIgaW4gc3BoZXJpY2FsIGJlYW1mb3JtaW5nIGxpdGVyYXR1cmUpXG4gICAgICAgICAgICAgICAgdGhpcy52bWljQ29lZmZzID0gY29tcHV0ZUh5cGVyY2FyZENvZWZmcyh0aGlzLm9yZGVyKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCJtYXhfckVcIjpcbiAgICAgICAgICAgICAgICAvLyBxdWl0ZSBzaW1pbGFyIHRvIG1heGltdW0gZnJvbnQtYmFjayByZWplY3Rpb25cbiAgICAgICAgICAgICAgICB0aGlzLnZtaWNDb2VmZnMgPSBjb21wdXRlTWF4UkVDb2VmZnModGhpcy5vcmRlcik7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIHRoaXMudm1pY1BhdHRlcm4gPSBcImh5cGVyY2FyZGlvaWRcIjtcbiAgICAgICAgICAgICAgICB0aGlzLnZtaWNDb2VmZnMgPSBjb21wdXRlSHlwZXJjYXJkQ29lZmZzKHRoaXMub3JkZXIpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy51cGRhdGVHYWlucygpO1xuICAgIH1cblxuICAgIHVwZGF0ZU9yaWVudGF0aW9uKCkge1xuXG4gICAgICAgIHZhciBhemkgPSB0aGlzLmF6aSAqIE1hdGguUEkgLyAxODA7XG4gICAgICAgIHZhciBlbGV2ID0gdGhpcy5lbGV2ICogTWF0aC5QSSAvIDE4MDtcblxuICAgICAgICB2YXIgdGVtcFNIID0ganNobGliLmNvbXB1dGVSZWFsU0godGhpcy5vcmRlciwgWyBbYXppLCBlbGV2XSBdKTtcblxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubkNoOyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMuU0h4eXpbaV0gPSB0ZW1wU0hbaV1bMF07XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnVwZGF0ZUdhaW5zKCk7XG4gICAgfVxuXG4gICAgdXBkYXRlR2FpbnMoKSB7XG5cbiAgICAgICAgdmFyIHE7XG4gICAgICAgIGZvciAodmFyIG4gPSAwOyBuIDw9IHRoaXMub3JkZXI7IG4rKykge1xuICAgICAgICAgICAgZm9yICh2YXIgbSA9IC1uOyBtIDw9IG47IG0rKykge1xuICAgICAgICAgICAgICAgIHEgPSBuICogbiArIG4gKyBtO1xuICAgICAgICAgICAgICAgIHRoaXMudm1pY0dhaW5zW3FdID0gdGhpcy52bWljQ29lZmZzW25dICogdGhpcy5TSHh5eltxXSAvIE1hdGguc3FydCgyKm4rMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubkNoOyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMudm1pY0dhaW5Ob2Rlc1tpXS5nYWluLnZhbHVlID0gdGhpcy52bWljR2FpbnNbaV07XG4gICAgICAgIH1cbiAgICB9XG59XG4iXX0=