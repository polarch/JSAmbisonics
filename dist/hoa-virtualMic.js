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
//# sourceMappingURL=data:application/json;base64,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QUQwQyxDQUFqQyxDQUFiOztBQUlBLGlCQUFLLElBQUksSUFBSSxDQUFiLEVBQWdCLElBQUksS0FBSyxHQUF6QixFQUE4QixHQUE5QixFQUFtQztBQUMvQixxQkFBSyxLQUFMLENBQVcsQ0FBWCxJQUFnQixPQUFPLENBQVAsRUFBVSxDQUFWLENBQWhCO0FBQ0g7O0FBRUQsaUJBQUssV0FBTDtBQUNIOzs7c0NBRWE7O0FBRVYsZ0JBQUksQ0FBSjtBQUNBLGlCQUFLLElBQUksSUFBSSxDQUFiLEVBQWdCLElBQUksS0FBSyxLQUFMLEdBQWEsQ0FBakMsRUFBb0MsR0FBcEMsRUFBeUM7QUFDckMscUJBQUssSUFBSSxJQUFJLENBQUMsS0FBSyxLQUFuQixFQUEwQixJQUFJLEtBQUssS0FBTCxHQUFhLENBQTNDLEVBQThDLEdBQTlDLEVBQW1EO0FBQy9DLHdCQUFJLElBQUksQ0FBSixHQUFRLENBQVIsR0FBWSxDQUFoQjtBQUNBLHlCQUFLLFNBQUwsQ0FBZSxDQUFmLElBQXFCLElBQUksS0FBSyxJQUFMLENBQVUsSUFBSSxDQUFKLEdBQVEsQ0FBbEIsQ0FBTCxHQUE2QixLQUFLLFVBQUwsQ0FBZ0IsQ0FBaEIsQ0FBN0IsR0FBa0QsS0FBSyxLQUFMLENBQVcsQ0FBWCxDQUF0RTtBQUNIO0FBQ0o7O0FBRUQsaUJBQUssSUFBSSxJQUFJLENBQWIsRUFBZ0IsSUFBSSxLQUFLLEdBQXpCLEVBQThCLEdBQTlCLEVBQW1DO0FBQy9CLHFCQUFLLGFBQUwsQ0FBbUIsQ0FBbkIsRUFBc0IsSUFBdEIsQ0FBMkIsS0FBM0IsR0FBbUMsS0FBSyxTQUFMLENBQWUsQ0FBZixDQUFuQztBQUNIO0FBQ0o7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O2tCQTdIZ0IsUSIsImZpbGUiOiJob2EtdmlydHVhbE1pYy5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyAgQXJjaG9udGlzIFBvbGl0aXNcbi8vICBhcmNob250aXMucG9saXRpc0BhYWx0by5maVxuLy8gIERhdmlkIFBvaXJpZXItUXVpbm90XG4vLyAgZGF2aXBvaXJAaXJjYW0uZnJcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vL1xuLy8gIFdlYkF1ZGlvX0hPQSBhIEphdmFTY3JpcHQgbGlicmFyeSBmb3IgaGlnaGVyLW9yZGVyIEFtYmlzb25pY3Ncbi8vICBUaGUgbGlicmFyeSBpbXBsZW1lbnRzIFdlYiBBdWRpbyBibG9ja3MgdGhhdCBwZXJmb3JtXG4vLyAgdHlwaWNhbCBhbWJpc29uaWMgcHJvY2Vzc2luZyBvcGVyYXRpb25zIG9uIGF1ZGlvIHNpZ25hbHMuXG4vL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vKiBIT0EgVklSVFVBTCBNSUNST1BIT05FICovXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuaW1wb3J0ICogYXMganNobGliIGZyb20gJ3NwaGVyaWNhbC1oYXJtb25pYy10cmFuc2Zvcm0nO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBIT0Ffdm1pYyB7XG5cbiAgICBjb25zdHJ1Y3RvcihhdWRpb0N0eCwgb3JkZXIpIHtcblxuICAgICAgICB0aGlzLmluaXRpYWxpemVkID0gZmFsc2U7XG5cbiAgICAgICAgdGhpcy5jdHggPSBhdWRpb0N0eDtcbiAgICAgICAgdGhpcy5vcmRlciA9IG9yZGVyO1xuICAgICAgICB0aGlzLm5DaCA9IChvcmRlciArIDEpICogKG9yZGVyICsgMSk7XG4gICAgICAgIHRoaXMuYXppID0gMDtcbiAgICAgICAgdGhpcy5lbGV2ID0gMDtcbiAgICAgICAgdGhpcy52bWljR2FpbnMgPSBuZXcgQXJyYXkodGhpcy5uQ2gpO1xuICAgICAgICB0aGlzLnZtaWNHYWluTm9kZXMgPSBuZXcgQXJyYXkodGhpcy5uQ2gpO1xuICAgICAgICB0aGlzLnZtaWNDb2VmZnMgPSBuZXcgQXJyYXkodGhpcy5vcmRlciArIDEpO1xuICAgICAgICB0aGlzLnZtaWNQYXR0ZXJuID0gXCJoeXBlcmNhcmRpb2lkXCI7XG4gICAgICAgIHRoaXMuaW4gPSB0aGlzLmN0eC5jcmVhdGVDaGFubmVsU3BsaXR0ZXIodGhpcy5uQ2gpO1xuICAgICAgICB0aGlzLm91dCA9IHRoaXMuY3R4LmNyZWF0ZUdhaW4oKTtcblxuICAgICAgICAvLyBJbml0aWFsaXplIHZtaWMgdG8gZm9yd2FyZCBmYWNpbmcgaHlwZXJjYXJkaW9pZFxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubkNoOyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMudm1pY0dhaW5Ob2Rlc1tpXSA9IHRoaXMuY3R4LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLlNIeHl6ID0gbmV3IEFycmF5KHRoaXMubkNoKTtcbiAgICAgICAgdGhpcy5TSHh5ei5maWxsKDApO1xuICAgICAgICB0aGlzLnVwZGF0ZVBhdHRlcm4oKTtcbiAgICAgICAgdGhpcy51cGRhdGVPcmllbnRhdGlvbigpO1xuXG4gICAgICAgIC8vIENyZWF0ZSBjb25uZWN0aW9uc1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgdGhpcy5uQ2g7IGkrKykge1xuICAgICAgICAgICAgdGhpcy5pbi5jb25uZWN0KHRoaXMudm1pY0dhaW5Ob2Rlc1tpXSwgaSwgMCk7XG4gICAgICAgICAgICB0aGlzLnZtaWNHYWluTm9kZXNbaV0uY29ubmVjdCh0aGlzLm91dCk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmluaXRpYWxpemVkID0gdHJ1ZTtcbiAgICB9XG5cblxuICAgIHVwZGF0ZVBhdHRlcm4oKSB7XG5cbiAgICAgICAgZnVuY3Rpb24gY29tcHV0ZUNhcmRpb2lkQ29lZmZzKE4pIHtcbiAgICAgICAgICAgIHZhciBjb2VmZnMgPSBuZXcgQXJyYXkoTiArIDEpO1xuICAgICAgICAgICAgZm9yICh2YXIgbiA9IDA7IG4gPCBOICsgMTsgbisrKSB7XG4gICAgICAgICAgICAgICAgY29lZmZzW25dID0gTWF0aC5zcXJ0KDIgKiBuICsgMSkgKiBqc2hsaWIuZmFjdG9yaWFsKE4pICoganNobGliLmZhY3RvcmlhbChOICsgMSkgLyAoanNobGliLmZhY3RvcmlhbChOICsgbiArIDEpICoganNobGliLmZhY3RvcmlhbChOIC0gbikpIC8gKE4gKyAxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBjb2VmZnM7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBjb21wdXRlSHlwZXJjYXJkQ29lZmZzKE4pIHtcbiAgICAgICAgICAgIHZhciBjb2VmZnMgPSBuZXcgQXJyYXkoTiArIDEpO1xuICAgICAgICAgICAgY29lZmZzLmZpbGwoMSk7XG4gICAgICAgICAgICByZXR1cm4gY29lZmZzO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gY29tcHV0ZU1heFJFQ29lZmZzKE4pIHtcbiAgICAgICAgICAgIHZhciBjb2VmZnMgPSBuZXcgQXJyYXkoTiArIDEpO1xuICAgICAgICAgICAgY29lZmZzWzBdID0gMTtcbiAgICAgICAgICAgIHZhciBsZWdfbl9taW51czEgPSAwO1xuICAgICAgICAgICAgdmFyIGxlZ19uX21pbnVzMiA9IDA7XG4gICAgICAgICAgICB2YXIgbGVnX24gPSAwO1xuICAgICAgICAgICAgZm9yICh2YXIgbiA9IDE7IG4gPCBOICsgMTsgbisrKSB7XG4gICAgICAgICAgICAgICAgbGVnX24gPSBqc2hsaWIucmVjdXJzZUxlZ2VuZHJlUG9seShuLCBbTWF0aC5jb3MoMi40MDY4MDkgLyAoTiArIDEuNTEpKV0sIGxlZ19uX21pbnVzMSwgbGVnX25fbWludXMyKTtcbiAgICAgICAgICAgICAgICBjb2VmZnNbbl0gPSBsZWdfblswXVswXTtcblxuICAgICAgICAgICAgICAgIGxlZ19uX21pbnVzMiA9IGxlZ19uX21pbnVzMTtcbiAgICAgICAgICAgICAgICBsZWdfbl9taW51czEgPSBsZWdfbjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBjb2VmZnM7XG4gICAgICAgIH1cblxuICAgICAgICBzd2l0Y2ggKHRoaXMudm1pY1BhdHRlcm4pIHtcbiAgICAgICAgICAgIGNhc2UgXCJjYXJkaW9pZFwiOlxuICAgICAgICAgICAgICAgIC8vIGhpZ2hlci1vcmRlciBjYXJkaW9pZCBnaXZlbiBieTogKDEvMileTiAqICggMStjb3ModGhldGEpICleTlxuICAgICAgICAgICAgICAgIHRoaXMudm1pY0NvZWZmcyA9IGNvbXB1dGVDYXJkaW9pZENvZWZmcyh0aGlzLm9yZGVyKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCJzdXBlcmNhcmRpb2lkXCI6XG4gICAgICAgICAgICAgICAgLy8gbWF4aW11bSBmcm9udC1iYWNrIGVuZXJneSByYXRpb1xuICAgICAgICAgICAgICAgIC8vIFRCRFxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcImh5cGVyY2FyZGlvaWRcIjpcbiAgICAgICAgICAgICAgICAvLyBtYXhpbXVtIGRpcmVjdGl2aXR5IGZhY3RvclxuICAgICAgICAgICAgICAgIC8vICh0aGlzIGlzIHRoZSBjbGFzc2ljIHBsYW5lL3dhdmUgZGVjb21wb3NpdGlvbiBiZWFtZm9ybWVyLFxuICAgICAgICAgICAgICAgIC8vIGFsc28gdGVybWVkIFwicmVndWxhclwiIGluIHNwaGVyaWNhbCBiZWFtZm9ybWluZyBsaXRlcmF0dXJlKVxuICAgICAgICAgICAgICAgIHRoaXMudm1pY0NvZWZmcyA9IGNvbXB1dGVIeXBlcmNhcmRDb2VmZnModGhpcy5vcmRlcik7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwibWF4X3JFXCI6XG4gICAgICAgICAgICAgICAgLy8gcXVpdGUgc2ltaWxhciB0byBtYXhpbXVtIGZyb250LWJhY2sgcmVqZWN0aW9uXG4gICAgICAgICAgICAgICAgdGhpcy52bWljQ29lZmZzID0gY29tcHV0ZU1heFJFQ29lZmZzKHRoaXMub3JkZXIpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICB0aGlzLnZtaWNQYXR0ZXJuID0gXCJoeXBlcmNhcmRpb2lkXCI7XG4gICAgICAgICAgICAgICAgdGhpcy52bWljQ29lZmZzID0gY29tcHV0ZUh5cGVyY2FyZENvZWZmcyh0aGlzLm9yZGVyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMudXBkYXRlR2FpbnMoKTtcbiAgICB9XG5cbiAgICB1cGRhdGVPcmllbnRhdGlvbigpIHtcblxuICAgICAgICB2YXIgYXppID0gdGhpcy5hemkgKiBNYXRoLlBJIC8gMTgwO1xuICAgICAgICB2YXIgZWxldiA9IHRoaXMuZWxldiAqIE1hdGguUEkgLyAxODA7XG5cbiAgICAgICAgdmFyIHRlbXBTSCA9IGpzaGxpYi5jb21wdXRlUmVhbFNIKHRoaXMub3JkZXIsIFtcbiAgICAgICAgICAgIFthemksIGVsZXZdXG4gICAgICAgIF0pO1xuXG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgdGhpcy5uQ2g7IGkrKykge1xuICAgICAgICAgICAgdGhpcy5TSHh5eltpXSA9IHRlbXBTSFtpXVswXTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMudXBkYXRlR2FpbnMoKTtcbiAgICB9XG5cbiAgICB1cGRhdGVHYWlucygpIHtcblxuICAgICAgICB2YXIgcTtcbiAgICAgICAgZm9yICh2YXIgbiA9IDA7IG4gPCB0aGlzLm9yZGVyICsgMTsgbisrKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBtID0gLXRoaXMub3JkZXI7IG0gPCB0aGlzLm9yZGVyICsgMTsgbSsrKSB7XG4gICAgICAgICAgICAgICAgcSA9IG4gKiBuICsgbiArIG07XG4gICAgICAgICAgICAgICAgdGhpcy52bWljR2FpbnNbcV0gPSAoMSAvIE1hdGguc3FydCgyICogbiArIDEpKSAqIHRoaXMudm1pY0NvZWZmc1tuXSAqIHRoaXMuU0h4eXpbcV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IHRoaXMubkNoOyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMudm1pY0dhaW5Ob2Rlc1tpXS5nYWluLnZhbHVlID0gdGhpcy52bWljR2FpbnNbaV07XG4gICAgICAgIH1cbiAgICB9XG59XG4iXX0=