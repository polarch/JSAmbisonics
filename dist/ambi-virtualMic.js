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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFtYmktdmlydHVhbE1pYy5qcyJdLCJuYW1lcyI6WyJqc2hsaWIiLCJ2aXJ0dWFsTWljIiwiYXVkaW9DdHgiLCJvcmRlciIsImluaXRpYWxpemVkIiwiY3R4IiwibkNoIiwiYXppbSIsImVsZXYiLCJ2bWljR2FpbnMiLCJBcnJheSIsInZtaWNHYWluTm9kZXMiLCJ2bWljQ29lZmZzIiwidm1pY1BhdHRlcm4iLCJpbiIsImNyZWF0ZUNoYW5uZWxTcGxpdHRlciIsIm91dCIsImNyZWF0ZUdhaW4iLCJpIiwiU0h4eXoiLCJmaWxsIiwidXBkYXRlUGF0dGVybiIsInVwZGF0ZU9yaWVudGF0aW9uIiwiY29ubmVjdCIsImNvbXB1dGVDYXJkaW9pZENvZWZmcyIsIk4iLCJjb2VmZnMiLCJuIiwiZmFjdG9yaWFsIiwiY29tcHV0ZUh5cGVyY2FyZENvZWZmcyIsIm5TSCIsImNvbXB1dGVTdXBlcmNhcmRDb2VmZnMiLCJjb25zb2xlIiwiZXJyb3IiLCJjb21wdXRlTWF4UkVDb2VmZnMiLCJsZWdfbl9taW51czEiLCJsZWdfbl9taW51czIiLCJsZWdfbiIsInJlY3Vyc2VMZWdlbmRyZVBvbHkiLCJNYXRoIiwiY29zIiwibm9ybSIsInVwZGF0ZUdhaW5zIiwiUEkiLCJ0ZW1wU0giLCJjb21wdXRlUmVhbFNIIiwicSIsIm0iLCJnYWluIiwidmFsdWUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7O0FBaUJBOztJQUFZQSxNOzs7Ozs7SUFFU0MsVTtBQUVqQix3QkFBWUMsUUFBWixFQUFzQkMsS0FBdEIsRUFBNkI7QUFBQTs7O0FBRXpCLGFBQUtDLFdBQUwsR0FBbUIsS0FBbkI7O0FBRUEsYUFBS0MsR0FBTCxHQUFXSCxRQUFYO0FBQ0EsYUFBS0MsS0FBTCxHQUFhQSxLQUFiO0FBQ0EsYUFBS0csR0FBTCxHQUFXLENBQUNILFFBQVEsQ0FBVCxLQUFlQSxRQUFRLENBQXZCLENBQVg7QUFDQSxhQUFLSSxJQUFMLEdBQVksQ0FBWjtBQUNBLGFBQUtDLElBQUwsR0FBWSxDQUFa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QSxpQkFBSyxJQUFJbkIsSUFBSSxDQUFiLEVBQWdCQSxLQUFLLEtBQUt4QixLQUExQixFQUFpQ3dCLEdBQWpDLEVBQXNDO0FBQ2xDLHFCQUFLLElBQUlvQixJQUFJLENBQUNwQixDQUFkLEVBQWlCb0IsS0FBS3BCLENBQXRCLEVBQXlCb0IsR0FBekIsRUFBOEI7QUFDMUJELHdCQUFJbkIsSUFBSUEsQ0FBSixHQUFRQSxDQUFSLEdBQVlvQixDQUFoQjtBQUNBLHlCQUFLdEMsU0FBTCxDQUFlcUMsQ0FBZixJQUFvQixLQUFLbEMsVUFBTCxDQUFnQmUsQ0FBaEIsSUFBcUIsS0FBS1IsS0FBTCxDQUFXMkIsQ0FBWCxDQUF6QztBQUNIO0FBQ0o7O0FBRUQsaUJBQUssSUFBSTVCLElBQUksQ0FBYixFQUFnQkEsSUFBSSxLQUFLWixHQUF6QixFQUE4QlksR0FBOUIsRUFBbUM7QUFDL0IscUJBQUtQLGFBQUwsQ0FBbUJPLENBQW5CLEVBQXNCOEIsSUFBdEIsQ0FBMkJDLEtBQTNCLEdBQW1DLEtBQUt4QyxTQUFMLENBQWVTLENBQWYsQ0FBbkM7QUFDSDtBQUNKOzs7S0E5S0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7a0JBSXFCakIsVSIsImZpbGUiOiJhbWJpLXZpcnR1YWxNaWMuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gIEFyY2hvbnRpcyBQb2xpdGlzXG4vLyAgYXJjaG9udGlzLnBvbGl0aXNAYWFsdG8uZmlcbi8vICBEYXZpZCBQb2lyaWVyLVF1aW5vdFxuLy8gIGRhdmlwb2lyQGlyY2FtLmZyXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy9cbi8vICBKU0FtYmlzb25pY3MgYSBKYXZhU2NyaXB0IGxpYnJhcnkgZm9yIGhpZ2hlci1vcmRlciBBbWJpc29uaWNzXG4vLyAgVGhlIGxpYnJhcnkgaW1wbGVtZW50cyBXZWIgQXVkaW8gYmxvY2tzIHRoYXQgcGVyZm9ybVxuLy8gIHR5cGljYWwgYW1iaXNvbmljIHByb2Nlc3Npbmcgb3BlcmF0aW9ucyBvbiBhdWRpbyBzaWduYWxzLlxuLy9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLyogSE9BIFZJUlRVQUwgTUlDUk9QSE9ORSAqL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbmltcG9ydCAqIGFzIGpzaGxpYiBmcm9tICdzcGhlcmljYWwtaGFybW9uaWMtdHJhbnNmb3JtJztcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgdmlydHVhbE1pYyB7XG5cbiAgICBjb25zdHJ1Y3RvcihhdWRpb0N0eCwgb3JkZXIpIHtcblxuICAgICAgICB0aGlzLmluaXRpYWxpemVkID0gZmFsc2U7XG5cbiAgICAgICAgdGhpcy5jdHggPSBhdWRpb0N0eDtcbiAgICAgICAgdGhpcy5vcmRlciA9IG9yZGVyO1xuICAgICAgICB0aGlzLm5DaCA9IChvcmRlciArIDEpICogKG9yZGVyICsgMSk7XG4gICAgICAgIHRoaXMuYXppbSA9IDA7XG4gICAgICAgIHRoaXMuZWxldiA9IDA7XG4gICAgICAgIHRoaXMudm1pY0dhaW5zID0gbmV3IEFycmF5KHRoaXMubkNoKTtcbiAgICAgICAgdGhpcy52bWljR2Fpbk5vZGVzID0gbmV3IEFycmF5KHRoaXMubkNoKTtcbiAgICAgICAgdGhpcy52bWljQ29lZmZzID0gbmV3IEFycmF5KHRoaXMub3JkZXIgKyAxKTtcbiAgICAgICAgdGhpcy52bWljUGF0dGVybiA9IFwiaHlwZXJjYXJkaW9pZFwiO1xuICAgICAgICB0aGlzLmluID0gdGhpcy5jdHguY3JlYXRlQ2hhbm5lbFNwbGl0dGVyKHRoaXMubkNoKTtcbiAgICAgICAgdGhpcy5vdXQgPSB0aGlzLmN0eC5jcmVhdGVHYWluKCk7XG5cbiAgICAgICAgLy8gSW5pdGlhbGl6ZSB2bWljIHRvIGZvcndhcmQgZmFjaW5nIGh5cGVyY2FyZGlvaWRcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm5DaDsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLnZtaWNHYWluTm9kZXNbaV0gPSB0aGlzLmN0eC5jcmVhdGVHYWluKCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5TSHh5eiA9IG5ldyBBcnJheSh0aGlzLm5DaCk7XG4gICAgICAgIHRoaXMuU0h4eXouZmlsbCgwKTtcbiAgICAgICAgdGhpcy51cGRhdGVQYXR0ZXJuKCk7XG4gICAgICAgIHRoaXMudXBkYXRlT3JpZW50YXRpb24oKTtcblxuICAgICAgICAvLyBDcmVhdGUgY29ubmVjdGlvbnNcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IHRoaXMubkNoOyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMuaW4uY29ubmVjdCh0aGlzLnZtaWNHYWluTm9kZXNbaV0sIGksIDApO1xuICAgICAgICAgICAgdGhpcy52bWljR2Fpbk5vZGVzW2ldLmNvbm5lY3QodGhpcy5vdXQpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5pbml0aWFsaXplZCA9IHRydWU7XG4gICAgfVxuXG5cbiAgICB1cGRhdGVQYXR0ZXJuKCkge1xuXG4gICAgICAgIGZ1bmN0aW9uIGNvbXB1dGVDYXJkaW9pZENvZWZmcyhOKSB7XG4gICAgICAgICAgICB2YXIgY29lZmZzID0gbmV3IEFycmF5KE4gKyAxKTtcbiAgICAgICAgICAgIGZvciAodmFyIG4gPSAwOyBuIDw9IE47IG4rKykge1xuICAgICAgICAgICAgICAgIGNvZWZmc1tuXSA9IGpzaGxpYi5mYWN0b3JpYWwoTikgKiBqc2hsaWIuZmFjdG9yaWFsKE4pIC8gKGpzaGxpYi5mYWN0b3JpYWwoTiArIG4gKyAxKSAqIGpzaGxpYi5mYWN0b3JpYWwoTiAtIG4pKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBjb2VmZnM7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBjb21wdXRlSHlwZXJjYXJkQ29lZmZzKE4pIHtcbiAgICAgICAgICAgIHZhciBjb2VmZnMgPSBuZXcgQXJyYXkoTiArIDEpO1xuICAgICAgICAgICAgdmFyIG5TSCA9IChOKzEpKihOKzEpO1xuICAgICAgICAgICAgZm9yICh2YXIgbiA9IDA7IG4gPD0gTjsgbisrKSB7XG4gICAgICAgICAgICAgICAgY29lZmZzW25dID0gMSAvIG5TSDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBjb2VmZnM7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBjb21wdXRlU3VwZXJjYXJkQ29lZmZzKE4pIHtcbiAgICAgICAgICAgIHN3aXRjaCAoTikge1xuICAgICAgICAgICAgICAgIGNhc2UgMTpcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNvZWZmcyA9IFswLjM2NjAsIDAuMjExM107XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgMjpcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNvZWZmcyA9IFswLjIzNjIsIDAuMTU2MiwgMC4wNTkwXTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAzOlxuICAgICAgICAgICAgICAgICAgICB2YXIgY29lZmZzID0gWzAuMTc2OCwgMC4xMjgxLCAwLjA2MzMsIDAuMDE3NV07XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgNDpcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNvZWZmcyA9IFswLjE0MTQsIDAuMTA4NywgMC4wNjIzLCAwLjAyNDcsIDAuMDA1NF07XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJPcmRlcnMgc2hvdWxkIGJlIGluIHRoZSByYW5nZSBvZiAxLTQgYXQgdGhlIG1vbWVudC5cIik7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBjb2VmZnM7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBjb21wdXRlTWF4UkVDb2VmZnMoTikge1xuICAgICAgICAgICAgdmFyIGNvZWZmcyA9IG5ldyBBcnJheShOICsgMSk7XG4gICAgICAgICAgICBjb2VmZnNbMF0gPSAxO1xuICAgICAgICAgICAgdmFyIGxlZ19uX21pbnVzMSA9IDA7XG4gICAgICAgICAgICB2YXIgbGVnX25fbWludXMyID0gMDtcbiAgICAgICAgICAgIHZhciBsZWdfbiA9IDA7XG4gICAgICAgICAgICBmb3IgKHZhciBuID0gMTsgbiA8IE4gKyAxOyBuKyspIHtcbiAgICAgICAgICAgICAgICBsZWdfbiA9IGpzaGxpYi5yZWN1cnNlTGVnZW5kcmVQb2x5KG4sIFtNYXRoLmNvcygyLjQwNjgwOSAvIChOICsgMS41MSkpXSwgbGVnX25fbWludXMxLCBsZWdfbl9taW51czIpO1xuICAgICAgICAgICAgICAgIGNvZWZmc1tuXSA9IGxlZ19uWzBdWzBdO1xuXG4gICAgICAgICAgICAgICAgbGVnX25fbWludXMyID0gbGVnX25fbWludXMxO1xuICAgICAgICAgICAgICAgIGxlZ19uX21pbnVzMSA9IGxlZ19uO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gY29tcHV0ZSBub3JtYWxpemF0aW9uIGZhY3RvclxuICAgICAgICAgICAgdmFyIG5vcm0gPSAwO1xuICAgICAgICAgICAgZm9yICh2YXIgbiA9IDA7IG4gPD0gTjsgbisrKSB7XG4gICAgICAgICAgICAgICAgbm9ybSArPSBjb2VmZnNbbl0gKiAoMipuKzEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZm9yICh2YXIgbiA9IDA7IG4gPD0gTjsgbisrKSB7XG4gICAgICAgICAgICAgICAgY29lZmZzW25dID0gY29lZmZzW25dL25vcm07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gY29lZmZzO1xuICAgICAgICB9XG5cbiAgICAgICAgc3dpdGNoICh0aGlzLnZtaWNQYXR0ZXJuKSB7XG4gICAgICAgICAgICBjYXNlIFwiY2FyZGlvaWRcIjpcbiAgICAgICAgICAgICAgICAvLyBoaWdoZXItb3JkZXIgY2FyZGlvaWQgZ2l2ZW4gYnk6ICgxLzIpXk4gKiAoIDErY29zKHRoZXRhKSApXk5cbiAgICAgICAgICAgICAgICB0aGlzLnZtaWNDb2VmZnMgPSBjb21wdXRlQ2FyZGlvaWRDb2VmZnModGhpcy5vcmRlcik7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwic3VwZXJjYXJkaW9pZFwiOlxuICAgICAgICAgICAgICAgIC8vIG1heGltdW0gZnJvbnQtYmFjayBlbmVyZ3kgcmF0aW9cbiAgICAgICAgICAgICAgICB0aGlzLnZtaWNDb2VmZnMgPSBjb21wdXRlU3VwZXJjYXJkQ29lZmZzKHRoaXMub3JkZXIpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcImh5cGVyY2FyZGlvaWRcIjpcbiAgICAgICAgICAgICAgICAvLyBtYXhpbXVtIGRpcmVjdGl2aXR5IGZhY3RvclxuICAgICAgICAgICAgICAgIC8vICh0aGlzIGlzIHRoZSBjbGFzc2ljIHBsYW5lL3dhdmUgZGVjb21wb3NpdGlvbiBiZWFtZm9ybWVyLFxuICAgICAgICAgICAgICAgIC8vIGFsc28gdGVybWVkIFwicmVndWxhclwiIGluIHNwaGVyaWNhbCBiZWFtZm9ybWluZyBsaXRlcmF0dXJlKVxuICAgICAgICAgICAgICAgIHRoaXMudm1pY0NvZWZmcyA9IGNvbXB1dGVIeXBlcmNhcmRDb2VmZnModGhpcy5vcmRlcik7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwibWF4X3JFXCI6XG4gICAgICAgICAgICAgICAgLy8gcXVpdGUgc2ltaWxhciB0byBtYXhpbXVtIGZyb250LWJhY2sgcmVqZWN0aW9uXG4gICAgICAgICAgICAgICAgdGhpcy52bWljQ29lZmZzID0gY29tcHV0ZU1heFJFQ29lZmZzKHRoaXMub3JkZXIpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICB0aGlzLnZtaWNQYXR0ZXJuID0gXCJoeXBlcmNhcmRpb2lkXCI7XG4gICAgICAgICAgICAgICAgdGhpcy52bWljQ29lZmZzID0gY29tcHV0ZUh5cGVyY2FyZENvZWZmcyh0aGlzLm9yZGVyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMudXBkYXRlR2FpbnMoKTtcbiAgICB9XG5cbiAgICB1cGRhdGVPcmllbnRhdGlvbigpIHtcblxuICAgICAgICB2YXIgYXppbSA9IHRoaXMuYXppbSAqIE1hdGguUEkgLyAxODA7XG4gICAgICAgIHZhciBlbGV2ID0gdGhpcy5lbGV2ICogTWF0aC5QSSAvIDE4MDtcblxuICAgICAgICB2YXIgdGVtcFNIID0ganNobGliLmNvbXB1dGVSZWFsU0godGhpcy5vcmRlciwgWyBbYXppbSwgZWxldl0gXSk7XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm5DaDsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLlNIeHl6W2ldID0gdGVtcFNIW2ldWzBdO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy51cGRhdGVHYWlucygpO1xuICAgIH1cblxuICAgIHVwZGF0ZUdhaW5zKCkge1xuXG4gICAgICAgIHZhciBxO1xuICAgICAgICBmb3IgKHZhciBuID0gMDsgbiA8PSB0aGlzLm9yZGVyOyBuKyspIHtcbiAgICAgICAgICAgIGZvciAodmFyIG0gPSAtbjsgbSA8PSBuOyBtKyspIHtcbiAgICAgICAgICAgICAgICBxID0gbiAqIG4gKyBuICsgbTtcbiAgICAgICAgICAgICAgICB0aGlzLnZtaWNHYWluc1txXSA9IHRoaXMudm1pY0NvZWZmc1tuXSAqIHRoaXMuU0h4eXpbcV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubkNoOyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMudm1pY0dhaW5Ob2Rlc1tpXS5nYWluLnZhbHVlID0gdGhpcy52bWljR2FpbnNbaV07XG4gICAgICAgIH1cbiAgICB9XG59XG4iXX0=