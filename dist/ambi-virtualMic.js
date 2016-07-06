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
//# sourceMappingURL=data:application/json;base64,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Q0FEMEMsQ0FBakMsQ0FBYjs7QUFJQSxpQkFBSyxJQUFJLElBQUksQ0FBYixFQUFnQixJQUFJLEtBQUssR0FBekIsRUFBOEIsR0FBOUIsRUFBbUM7QUFDL0IscUJBQUssS0FBTCxDQUFXLENBQVgsSUFBZ0IsT0FBTyxDQUFQLEVBQVUsQ0FBVixDQUFoQjtBQUNIOztBQUVELGlCQUFLLFdBQUw7QUFDSDs7O3NDQUVhOztBQUVWLGdCQUFJLENBQUo7QUFDQSxpQkFBSyxJQUFJLElBQUksQ0FBYixFQUFnQixJQUFJLEtBQUssS0FBTCxHQUFhLENBQWpDLEVBQW9DLEdBQXBDLEVBQXlDO0FBQ3JDLHFCQUFLLElBQUksSUFBSSxDQUFDLEtBQUssS0FBbkIsRUFBMEIsSUFBSSxLQUFLLEtBQUwsR0FBYSxDQUEzQyxFQUE4QyxHQUE5QyxFQUFtRDtBQUMvQyx3QkFBSSxJQUFJLENBQUosR0FBUSxDQUFSLEdBQVksQ0FBaEI7QUFDQSx5QkFBSyxTQUFMLENBQWUsQ0FBZixJQUFxQixJQUFJLEtBQUssSUFBTCxDQUFVLElBQUksQ0FBSixHQUFRLENBQWxCLENBQUwsR0FBNkIsS0FBSyxVQUFMLENBQWdCLENBQWhCLENBQTdCLEdBQWtELEtBQUssS0FBTCxDQUFXLENBQVgsQ0FBdEU7QUFDSDtBQUNKOztBQUVELGlCQUFLLElBQUksSUFBSSxDQUFiLEVBQWdCLElBQUksS0FBSyxHQUF6QixFQUE4QixHQUE5QixFQUFtQztBQUMvQixxQkFBSyxhQUFMLENBQW1CLENBQW5CLEVBQXNCLElBQXRCLENBQTJCLEtBQTNCLEdBQW1DLEtBQUssU0FBTCxDQUFlLENBQWYsQ0FBbkM7QUFDSDtBQUNKOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztrQkE3SGdCLFEiLCJmaWxlIjoiYW1iaS12aXJ0dWFsTWljLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vICBBcmNob250aXMgUG9saXRpc1xuLy8gIGFyY2hvbnRpcy5wb2xpdGlzQGFhbHRvLmZpXG4vLyAgRGF2aWQgUG9pcmllci1RdWlub3Rcbi8vICBkYXZpcG9pckBpcmNhbS5mclxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vXG4vLyAgV2ViQXVkaW9fSE9BIGEgSmF2YVNjcmlwdCBsaWJyYXJ5IGZvciBoaWdoZXItb3JkZXIgQW1iaXNvbmljc1xuLy8gIFRoZSBsaWJyYXJ5IGltcGxlbWVudHMgV2ViIEF1ZGlvIGJsb2NrcyB0aGF0IHBlcmZvcm1cbi8vICB0eXBpY2FsIGFtYmlzb25pYyBwcm9jZXNzaW5nIG9wZXJhdGlvbnMgb24gYXVkaW8gc2lnbmFscy5cbi8vXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8qIEhPQSBWSVJUVUFMIE1JQ1JPUEhPTkUgKi9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG5pbXBvcnQgKiBhcyBqc2hsaWIgZnJvbSAnc3BoZXJpY2FsLWhhcm1vbmljLXRyYW5zZm9ybSc7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEhPQV92bWljIHtcblxuICAgIGNvbnN0cnVjdG9yKGF1ZGlvQ3R4LCBvcmRlcikge1xuXG4gICAgICAgIHRoaXMuaW5pdGlhbGl6ZWQgPSBmYWxzZTtcblxuICAgICAgICB0aGlzLmN0eCA9IGF1ZGlvQ3R4O1xuICAgICAgICB0aGlzLm9yZGVyID0gb3JkZXI7XG4gICAgICAgIHRoaXMubkNoID0gKG9yZGVyICsgMSkgKiAob3JkZXIgKyAxKTtcbiAgICAgICAgdGhpcy5hemkgPSAwO1xuICAgICAgICB0aGlzLmVsZXYgPSAwO1xuICAgICAgICB0aGlzLnZtaWNHYWlucyA9IG5ldyBBcnJheSh0aGlzLm5DaCk7XG4gICAgICAgIHRoaXMudm1pY0dhaW5Ob2RlcyA9IG5ldyBBcnJheSh0aGlzLm5DaCk7XG4gICAgICAgIHRoaXMudm1pY0NvZWZmcyA9IG5ldyBBcnJheSh0aGlzLm9yZGVyICsgMSk7XG4gICAgICAgIHRoaXMudm1pY1BhdHRlcm4gPSBcImh5cGVyY2FyZGlvaWRcIjtcbiAgICAgICAgdGhpcy5pbiA9IHRoaXMuY3R4LmNyZWF0ZUNoYW5uZWxTcGxpdHRlcih0aGlzLm5DaCk7XG4gICAgICAgIHRoaXMub3V0ID0gdGhpcy5jdHguY3JlYXRlR2FpbigpO1xuXG4gICAgICAgIC8vIEluaXRpYWxpemUgdm1pYyB0byBmb3J3YXJkIGZhY2luZyBoeXBlcmNhcmRpb2lkXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5uQ2g7IGkrKykge1xuICAgICAgICAgICAgdGhpcy52bWljR2Fpbk5vZGVzW2ldID0gdGhpcy5jdHguY3JlYXRlR2FpbigpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuU0h4eXogPSBuZXcgQXJyYXkodGhpcy5uQ2gpO1xuICAgICAgICB0aGlzLlNIeHl6LmZpbGwoMCk7XG4gICAgICAgIHRoaXMudXBkYXRlUGF0dGVybigpO1xuICAgICAgICB0aGlzLnVwZGF0ZU9yaWVudGF0aW9uKCk7XG5cbiAgICAgICAgLy8gQ3JlYXRlIGNvbm5lY3Rpb25zXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCB0aGlzLm5DaDsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLmluLmNvbm5lY3QodGhpcy52bWljR2Fpbk5vZGVzW2ldLCBpLCAwKTtcbiAgICAgICAgICAgIHRoaXMudm1pY0dhaW5Ob2Rlc1tpXS5jb25uZWN0KHRoaXMub3V0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuaW5pdGlhbGl6ZWQgPSB0cnVlO1xuICAgIH1cblxuXG4gICAgdXBkYXRlUGF0dGVybigpIHtcblxuICAgICAgICBmdW5jdGlvbiBjb21wdXRlQ2FyZGlvaWRDb2VmZnMoTikge1xuICAgICAgICAgICAgdmFyIGNvZWZmcyA9IG5ldyBBcnJheShOICsgMSk7XG4gICAgICAgICAgICBmb3IgKHZhciBuID0gMDsgbiA8IE4gKyAxOyBuKyspIHtcbiAgICAgICAgICAgICAgICBjb2VmZnNbbl0gPSBNYXRoLnNxcnQoMiAqIG4gKyAxKSAqIGpzaGxpYi5mYWN0b3JpYWwoTikgKiBqc2hsaWIuZmFjdG9yaWFsKE4gKyAxKSAvIChqc2hsaWIuZmFjdG9yaWFsKE4gKyBuICsgMSkgKiBqc2hsaWIuZmFjdG9yaWFsKE4gLSBuKSkgLyAoTiArIDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGNvZWZmcztcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGNvbXB1dGVIeXBlcmNhcmRDb2VmZnMoTikge1xuICAgICAgICAgICAgdmFyIGNvZWZmcyA9IG5ldyBBcnJheShOICsgMSk7XG4gICAgICAgICAgICBjb2VmZnMuZmlsbCgxKTtcbiAgICAgICAgICAgIHJldHVybiBjb2VmZnM7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBjb21wdXRlTWF4UkVDb2VmZnMoTikge1xuICAgICAgICAgICAgdmFyIGNvZWZmcyA9IG5ldyBBcnJheShOICsgMSk7XG4gICAgICAgICAgICBjb2VmZnNbMF0gPSAxO1xuICAgICAgICAgICAgdmFyIGxlZ19uX21pbnVzMSA9IDA7XG4gICAgICAgICAgICB2YXIgbGVnX25fbWludXMyID0gMDtcbiAgICAgICAgICAgIHZhciBsZWdfbiA9IDA7XG4gICAgICAgICAgICBmb3IgKHZhciBuID0gMTsgbiA8IE4gKyAxOyBuKyspIHtcbiAgICAgICAgICAgICAgICBsZWdfbiA9IGpzaGxpYi5yZWN1cnNlTGVnZW5kcmVQb2x5KG4sIFtNYXRoLmNvcygyLjQwNjgwOSAvIChOICsgMS41MSkpXSwgbGVnX25fbWludXMxLCBsZWdfbl9taW51czIpO1xuICAgICAgICAgICAgICAgIGNvZWZmc1tuXSA9IGxlZ19uWzBdWzBdO1xuXG4gICAgICAgICAgICAgICAgbGVnX25fbWludXMyID0gbGVnX25fbWludXMxO1xuICAgICAgICAgICAgICAgIGxlZ19uX21pbnVzMSA9IGxlZ19uO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGNvZWZmcztcbiAgICAgICAgfVxuXG4gICAgICAgIHN3aXRjaCAodGhpcy52bWljUGF0dGVybikge1xuICAgICAgICAgICAgY2FzZSBcImNhcmRpb2lkXCI6XG4gICAgICAgICAgICAgICAgLy8gaGlnaGVyLW9yZGVyIGNhcmRpb2lkIGdpdmVuIGJ5OiAoMS8yKV5OICogKCAxK2Nvcyh0aGV0YSkgKV5OXG4gICAgICAgICAgICAgICAgdGhpcy52bWljQ29lZmZzID0gY29tcHV0ZUNhcmRpb2lkQ29lZmZzKHRoaXMub3JkZXIpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcInN1cGVyY2FyZGlvaWRcIjpcbiAgICAgICAgICAgICAgICAvLyBtYXhpbXVtIGZyb250LWJhY2sgZW5lcmd5IHJhdGlvXG4gICAgICAgICAgICAgICAgLy8gVEJEXG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwiaHlwZXJjYXJkaW9pZFwiOlxuICAgICAgICAgICAgICAgIC8vIG1heGltdW0gZGlyZWN0aXZpdHkgZmFjdG9yXG4gICAgICAgICAgICAgICAgLy8gKHRoaXMgaXMgdGhlIGNsYXNzaWMgcGxhbmUvd2F2ZSBkZWNvbXBvc2l0aW9uIGJlYW1mb3JtZXIsXG4gICAgICAgICAgICAgICAgLy8gYWxzbyB0ZXJtZWQgXCJyZWd1bGFyXCIgaW4gc3BoZXJpY2FsIGJlYW1mb3JtaW5nIGxpdGVyYXR1cmUpXG4gICAgICAgICAgICAgICAgdGhpcy52bWljQ29lZmZzID0gY29tcHV0ZUh5cGVyY2FyZENvZWZmcyh0aGlzLm9yZGVyKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCJtYXhfckVcIjpcbiAgICAgICAgICAgICAgICAvLyBxdWl0ZSBzaW1pbGFyIHRvIG1heGltdW0gZnJvbnQtYmFjayByZWplY3Rpb25cbiAgICAgICAgICAgICAgICB0aGlzLnZtaWNDb2VmZnMgPSBjb21wdXRlTWF4UkVDb2VmZnModGhpcy5vcmRlcik7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIHRoaXMudm1pY1BhdHRlcm4gPSBcImh5cGVyY2FyZGlvaWRcIjtcbiAgICAgICAgICAgICAgICB0aGlzLnZtaWNDb2VmZnMgPSBjb21wdXRlSHlwZXJjYXJkQ29lZmZzKHRoaXMub3JkZXIpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy51cGRhdGVHYWlucygpO1xuICAgIH1cblxuICAgIHVwZGF0ZU9yaWVudGF0aW9uKCkge1xuXG4gICAgICAgIHZhciBhemkgPSB0aGlzLmF6aSAqIE1hdGguUEkgLyAxODA7XG4gICAgICAgIHZhciBlbGV2ID0gdGhpcy5lbGV2ICogTWF0aC5QSSAvIDE4MDtcblxuICAgICAgICB2YXIgdGVtcFNIID0ganNobGliLmNvbXB1dGVSZWFsU0godGhpcy5vcmRlciwgW1xuICAgICAgICAgICAgW2F6aSwgZWxldl1cbiAgICAgICAgXSk7XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCB0aGlzLm5DaDsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLlNIeHl6W2ldID0gdGVtcFNIW2ldWzBdO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy51cGRhdGVHYWlucygpO1xuICAgIH1cblxuICAgIHVwZGF0ZUdhaW5zKCkge1xuXG4gICAgICAgIHZhciBxO1xuICAgICAgICBmb3IgKHZhciBuID0gMDsgbiA8IHRoaXMub3JkZXIgKyAxOyBuKyspIHtcbiAgICAgICAgICAgIGZvciAodmFyIG0gPSAtdGhpcy5vcmRlcjsgbSA8IHRoaXMub3JkZXIgKyAxOyBtKyspIHtcbiAgICAgICAgICAgICAgICBxID0gbiAqIG4gKyBuICsgbTtcbiAgICAgICAgICAgICAgICB0aGlzLnZtaWNHYWluc1txXSA9ICgxIC8gTWF0aC5zcXJ0KDIgKiBuICsgMSkpICogdGhpcy52bWljQ29lZmZzW25dICogdGhpcy5TSHh5eltxXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgdGhpcy5uQ2g7IGkrKykge1xuICAgICAgICAgICAgdGhpcy52bWljR2Fpbk5vZGVzW2ldLmdhaW4udmFsdWUgPSB0aGlzLnZtaWNHYWluc1tpXTtcbiAgICAgICAgfVxuICAgIH1cbn1cbiJdfQ==