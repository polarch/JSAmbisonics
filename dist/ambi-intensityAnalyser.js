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

//////////////////////////////////////////
/* PRESSURE-VELOCITY INTENSITY ANALYZER */
//////////////////////////////////////////

var intensityAnalyser = function () {
    function intensityAnalyser(audioCtx) {
        (0, _classCallCheck3.default)(this, intensityAnalyser);

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

    (0, _createClass3.default)(intensityAnalyser, [{
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
            var I, I_norm, E, Psi, azim, elev;
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
            azim = Math.atan2(iY, iX) * 180 / Math.PI;
            elev = Math.atan2(I[2], Math.sqrt(I[0] * I[0] + I[1] * I[1])) * 180 / Math.PI;

            var params = [azim, elev, Psi, E];
            return params;
        }
    }]);
    return intensityAnalyser;
}();

exports.default = intensityAnalyser;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFtYmktaW50ZW5zaXR5QW5hbHlzZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBaUJxQixpQjtBQUNqQiwrQkFBWSxRQUFaLEVBQXNCO0FBQUE7O0FBQ2xCLGFBQUssV0FBTCxHQUFtQixLQUFuQjs7QUFFQSxhQUFLLEdBQUwsR0FBVyxRQUFYO0FBQ0EsYUFBSyxPQUFMLEdBQWUsSUFBZjtBQUNBLGFBQUssU0FBTCxHQUFpQixJQUFJLEtBQUosQ0FBVSxDQUFWLENBQWpCO0FBQ0EsYUFBSyxXQUFMLEdBQW1CLElBQUksS0FBSixDQUFVLENBQVYsQ0FBbkI7O0FBRUEsYUFBSyxFQUFMLEdBQVUsS0FBSyxHQUFMLENBQVMscUJBQVQsQ0FBK0IsQ0FBL0IsQ0FBVjtBQUNBLGFBQUssR0FBTCxHQUFXLEtBQUssR0FBTCxDQUFTLG1CQUFULENBQTZCLENBQTdCLENBQVg7O0FBRUEsYUFBSyxJQUFJLElBQUksQ0FBYixFQUFnQixJQUFJLENBQXBCLEVBQXVCLEdBQXZCLEVBQTRCO0FBQ3hCLGlCQUFLLFNBQUwsQ0FBZSxDQUFmLElBQW9CLEtBQUssR0FBTCxDQUFTLGNBQVQsRUFBcEI7QUFDQSxpQkFBSyxTQUFMLENBQWUsQ0FBZixFQUFrQixPQUFsQixHQUE0QixLQUFLLE9BQWpDO0FBQ0EsaUJBQUssU0FBTCxDQUFlLENBQWYsRUFBa0IscUJBQWxCLEdBQTBDLENBQTFDO0FBQ0EsaUJBQUssV0FBTCxDQUFpQixDQUFqQixJQUFzQixJQUFJLFlBQUosQ0FBaUIsS0FBSyxPQUF0QixDQUF0QjtBQUNIOztBQUVELGFBQUssSUFBSSxLQUFJLENBQWIsRUFBZ0IsS0FBSSxDQUFwQixFQUF1QixJQUF2QixFQUE0QjtBQUN4QixpQkFBSyxFQUFMLENBQVEsT0FBUixDQUFnQixLQUFLLEdBQXJCLEVBQTBCLEVBQTFCLEVBQTZCLEVBQTdCO0FBQ0EsaUJBQUssRUFBTCxDQUFRLE9BQVIsQ0FBZ0IsS0FB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QixJQUF5RCxHQUF6RCxHQUErRCxLQUFLLEVBQTNFOztBQUVBLGdCQUFJLFNBQVMsQ0FBQyxJQUFELEVBQU8sSUFBUCxFQUFhLEdBQWIsRUFBa0IsQ0FBbEIsQ0FBYjtBQUNBLG1CQUFPLE1BQVA7QUFDSDs7Ozs7a0JBaEVnQixpQiIsImZpbGUiOiJhbWJpLWludGVuc2l0eUFuYWx5c2VyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vICBBcmNob250aXMgUG9saXRpc1xuLy8gIGFyY2hvbnRpcy5wb2xpdGlzQGFhbHRvLmZpXG4vLyAgRGF2aWQgUG9pcmllci1RdWlub3Rcbi8vICBkYXZpcG9pckBpcmNhbS5mclxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vXG4vLyAgV2ViQXVkaW9fSE9BIGEgSmF2YVNjcmlwdCBsaWJyYXJ5IGZvciBoaWdoZXItb3JkZXIgQW1iaXNvbmljc1xuLy8gIFRoZSBsaWJyYXJ5IGltcGxlbWVudHMgV2ViIEF1ZGlvIGJsb2NrcyB0aGF0IHBlcmZvcm1cbi8vICB0eXBpY2FsIGFtYmlzb25pYyBwcm9jZXNzaW5nIG9wZXJhdGlvbnMgb24gYXVkaW8gc2lnbmFscy5cbi8vXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8qIFBSRVNTVVJFLVZFTE9DSVRZIElOVEVOU0lUWSBBTkFMWVpFUiAqL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIGludGVuc2l0eUFuYWx5c2VyIHtcbiAgICBjb25zdHJ1Y3RvcihhdWRpb0N0eCkge1xuICAgICAgICB0aGlzLmluaXRpYWxpemVkID0gZmFsc2U7XG5cbiAgICAgICAgdGhpcy5jdHggPSBhdWRpb0N0eDtcbiAgICAgICAgdGhpcy5mZnRTaXplID0gMjA0ODtcbiAgICAgICAgdGhpcy5hbmFseXNlcnMgPSBuZXcgQXJyYXkoNCk7XG4gICAgICAgIHRoaXMuYW5hbEJ1ZmZlcnMgPSBuZXcgQXJyYXkoNCk7XG4gICAgICAgIC8vIElucHV0IGFuZCBvdXRwdXQgbm9kZXNcbiAgICAgICAgdGhpcy5pbiA9IHRoaXMuY3R4LmNyZWF0ZUNoYW5uZWxTcGxpdHRlcig0KTtcbiAgICAgICAgdGhpcy5vdXQgPSB0aGlzLmN0eC5jcmVhdGVDaGFubmVsTWVyZ2VyKDQpO1xuICAgICAgICAvLyBJbml0aWFsaXplIGFuYWx5emVyIGJ1ZmZlcnNcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCA0OyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMuYW5hbHlzZXJzW2ldID0gdGhpcy5jdHguY3JlYXRlQW5hbHlzZXIoKTtcbiAgICAgICAgICAgIHRoaXMuYW5hbHlzZXJzW2ldLmZmdFNpemUgPSB0aGlzLmZmdFNpemU7XG4gICAgICAgICAgICB0aGlzLmFuYWx5c2Vyc1tpXS5zbW9vdGhpbmdUaW1lQ29uc3RhbnQgPSAwO1xuICAgICAgICAgICAgdGhpcy5hbmFsQnVmZmVyc1tpXSA9IG5ldyBGbG9hdDMyQXJyYXkodGhpcy5mZnRTaXplKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBDcmVhdGUgY29ubmVjdGlvbnNcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCA0OyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMuaW4uY29ubmVjdCh0aGlzLm91dCwgaSwgaSk7XG4gICAgICAgICAgICB0aGlzLmluLmNvbm5lY3QodGhpcy5hbmFseXNlcnNbaV0sIGksIDApO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5pbml0aWFsaXplZCA9IHRydWU7XG4gICAgfVxuXG4gICAgdXBkYXRlQnVmZmVycygpIHtcbiAgICAgICAgLy8gR2V0IGxhdGVzdCB0aW1lLWRvbWFpbiBkYXRhXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgNDsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLmFuYWx5c2Vyc1tpXS5nZXRGbG9hdFRpbWVEb21haW5EYXRhKHRoaXMuYW5hbEJ1ZmZlcnNbaV0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgY29tcHV0ZUludGVuc2l0eSgpIHtcbiAgICAgICAgLy8gQ29tcHV0ZSBjb3JyZWxhdGlvbnMgYW5kIGVuZXJnaWVzIG9mIGNoYW5uZWxzXG4gICAgICAgIHZhciBpWCA9IDA7XG4gICAgICAgIHZhciBpWSA9IDA7XG4gICAgICAgIHZhciBpWiA9IDA7XG4gICAgICAgIHZhciBXVyA9IDA7XG4gICAgICAgIHZhciBYWCA9IDA7XG4gICAgICAgIHZhciBZWSA9IDA7XG4gICAgICAgIHZhciBaWiA9IDA7XG4gICAgICAgIHZhciBJLCBJX25vcm0sIEUsIFBzaSwgYXppbSwgZWxldjtcbiAgICAgICAgLy8gQWNjdW11bGF0b3JzIGZvciBjb3JyZWxhdGlvbnMgYW5kIGVuZXJnaWVzXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5mZnRTaXplOyBpKyspIHtcblxuICAgICAgICAgICAgaVggPSBpWCArIE1hdGguc3FydCgyKSAqIHRoaXMuYW5hbEJ1ZmZlcnNbMF1baV0gKiB0aGlzLmFuYWxCdWZmZXJzWzFdW2ldO1xuICAgICAgICAgICAgaVkgPSBpWSArIE1hdGguc3FydCgyKSAqIHRoaXMuYW5hbEJ1ZmZlcnNbMF1baV0gKiB0aGlzLmFuYWxCdWZmZXJzWzJdW2ldO1xuICAgICAgICAgICAgaVogPSBpWiArIE1hdGguc3FydCgyKSAqIHRoaXMuYW5hbEJ1ZmZlcnNbMF1baV0gKiB0aGlzLmFuYWxCdWZmZXJzWzNdW2ldO1xuICAgICAgICAgICAgV1cgPSBXVyArIDIgKiB0aGlzLmFuYWxCdWZmZXJzWzBdW2ldICogdGhpcy5hbmFsQnVmZmVyc1swXVtpXTtcbiAgICAgICAgICAgIFhYID0gWFggKyB0aGlzLmFuYWxCdWZmZXJzWzFdW2ldICogdGhpcy5hbmFsQnVmZmVyc1sxXVtpXTtcbiAgICAgICAgICAgIFlZID0gWVkgKyB0aGlzLmFuYWxCdWZmZXJzWzJdW2ldICogdGhpcy5hbmFsQnVmZmVyc1syXVtpXTtcbiAgICAgICAgICAgIFpaID0gWlogKyB0aGlzLmFuYWxCdWZmZXJzWzNdW2ldICogdGhpcy5hbmFsQnVmZmVyc1szXVtpXTtcbiAgICAgICAgfVxuICAgICAgICBJID0gW2lYLCBpWSwgaVpdOyAvLyBpbnRlbnNpdHlcbiAgICAgICAgSV9ub3JtID0gTWF0aC5zcXJ0KElbMF0gKiBJWzBdICsgSVsxXSAqIElbMV0gKyBJWzJdICogSVsyXSk7IC8vIGludGVuc2l0eSBtYWduaXR1ZGVcbiAgICAgICAgRSA9IChXVyArIFhYICsgWVkgKyBaWikgLyAyOyAvLyBlbmVyZ3lcbiAgICAgICAgUHNpID0gMSAtIElfbm9ybSAvIChFICsgMTBlLTgpOyAvLyBkaWZmdXNlbmVzc1xuICAgICAgICBhemltID0gTWF0aC5hdGFuMihpWSwgaVgpICogMTgwIC8gTWF0aC5QSTtcbiAgICAgICAgZWxldiA9IE1hdGguYXRhbjIoSVsyXSwgTWF0aC5zcXJ0KElbMF0gKiBJWzBdICsgSVsxXSAqIElbMV0pKSAqIDE4MCAvIE1hdGguUEk7XG5cbiAgICAgICAgdmFyIHBhcmFtcyA9IFthemltLCBlbGV2LCBQc2ksIEVdO1xuICAgICAgICByZXR1cm4gcGFyYW1zO1xuICAgIH1cbn1cbiJdfQ==