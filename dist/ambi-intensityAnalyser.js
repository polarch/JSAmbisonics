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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFtYmktaW50ZW5zaXR5QW5hbHlzZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBaUJxQixnQjtBQUNqQiw4QkFBWSxRQUFaLEVBQXNCO0FBQUE7O0FBQ2xCLGFBQUssV0FBTCxHQUFtQixLQUFuQjs7QUFFQSxhQUFLLEdBQUwsR0FBVyxRQUFYO0FBQ0EsYUFBSyxPQUFMLEdBQWUsSUFBZjtBQUNBLGFBQUssU0FBTCxHQUFpQixJQUFJLEtBQUosQ0FBVSxDQUFWLENBQWpCO0FBQ0EsYUFBSyxXQUFMLEdBQW1CLElBQUksS0FBSixDQUFVLENBQVYsQ0FBbkI7O0FBRUEsYUFBSyxFQUFMLEdBQVUsS0FBSyxHQUFMLENBQVMscUJBQVQsQ0FBK0IsQ0FBL0IsQ0FBVjtBQUNBLGFBQUssR0FBTCxHQUFXLEtBQUssR0FBTCxDQUFTLG1CQUFULENBQTZCLENBQTdCLENBQVg7O0FBRUEsYUFBSyxJQUFJLElBQUksQ0FBYixFQUFnQixJQUFJLENBQXBCLEVBQXVCLEdBQXZCLEVBQTRCO0FBQ3hCLGlCQUFLLFNBQUwsQ0FBZSxDQUFmLElBQW9CLEtBQUssR0FBTCxDQUFTLGNBQVQsRUFBcEI7QUFDQSxpQkFBSyxTQUFMLENBQWUsQ0FBZixFQUFrQixPQUFsQixHQUE0QixLQUFLLE9BQWpDO0FBQ0EsaUJBQUssU0FBTCxDQUFlLENBQWYsRUFBa0IscUJBQWxCLEdBQTBDLENBQTFDO0FBQ0EsaUJBQUssV0FBTCxDQUFpQixDQUFqQixJQUFzQixJQUFJLFlBQUosQ0FBaUIsS0FBSyxPQUF0QixDQUF0QjtBQUNIOztBQUVELGFBQUssSUFBSSxLQUFJLENBQWIsRUFBZ0IsS0FBSSxDQUFwQixFQUF1QixJQUF2QixFQUE0QjtBQUN4QixpQkFBSyxFQUFMLENBQVEsT0FBUixDQUFnQixLQUFLLEdBQXJCLEVBQTBCLEVBQTFCLEVBQTZCLEVBQTdCO0FBQ0EsaUJBQUssRUFBTCxDQUFRLE9BQVIsQ0FBZ0IsS0FB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QixJQUF5RCxHQUF6RCxHQUErRCxLQUFLLEVBQTNFOztBQUVBLGdCQUFJLFNBQVMsQ0FBQyxHQUFELEVBQU0sSUFBTixFQUFZLEdBQVosRUFBaUIsQ0FBakIsQ0FBYjtBQUNBLG1CQUFPLE1BQVA7QUFDSDs7Ozs7a0JBaEVnQixnQiIsImZpbGUiOiJhbWJpLWludGVuc2l0eUFuYWx5c2VyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vICBBcmNob250aXMgUG9saXRpc1xuLy8gIGFyY2hvbnRpcy5wb2xpdGlzQGFhbHRvLmZpXG4vLyAgRGF2aWQgUG9pcmllci1RdWlub3Rcbi8vICBkYXZpcG9pckBpcmNhbS5mclxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vXG4vLyAgV2ViQXVkaW9fSE9BIGEgSmF2YVNjcmlwdCBsaWJyYXJ5IGZvciBoaWdoZXItb3JkZXIgQW1iaXNvbmljc1xuLy8gIFRoZSBsaWJyYXJ5IGltcGxlbWVudHMgV2ViIEF1ZGlvIGJsb2NrcyB0aGF0IHBlcmZvcm1cbi8vICB0eXBpY2FsIGFtYmlzb25pYyBwcm9jZXNzaW5nIG9wZXJhdGlvbnMgb24gYXVkaW8gc2lnbmFscy5cbi8vXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8qIEJfRk9STUFUIElOVEVOU0lUWSBBTkFMWVpFUiAqL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEJmb3JtYXRfYW5hbHlzZXIge1xuICAgIGNvbnN0cnVjdG9yKGF1ZGlvQ3R4KSB7XG4gICAgICAgIHRoaXMuaW5pdGlhbGl6ZWQgPSBmYWxzZTtcblxuICAgICAgICB0aGlzLmN0eCA9IGF1ZGlvQ3R4O1xuICAgICAgICB0aGlzLmZmdFNpemUgPSAyMDQ4O1xuICAgICAgICB0aGlzLmFuYWx5c2VycyA9IG5ldyBBcnJheSg0KTtcbiAgICAgICAgdGhpcy5hbmFsQnVmZmVycyA9IG5ldyBBcnJheSg0KTtcbiAgICAgICAgLy8gSW5wdXQgYW5kIG91dHB1dCBub2Rlc1xuICAgICAgICB0aGlzLmluID0gdGhpcy5jdHguY3JlYXRlQ2hhbm5lbFNwbGl0dGVyKDQpO1xuICAgICAgICB0aGlzLm91dCA9IHRoaXMuY3R4LmNyZWF0ZUNoYW5uZWxNZXJnZXIoNCk7XG4gICAgICAgIC8vIEluaXRpYWxpemUgYW5hbHl6ZXIgYnVmZmVyc1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IDQ7IGkrKykge1xuICAgICAgICAgICAgdGhpcy5hbmFseXNlcnNbaV0gPSB0aGlzLmN0eC5jcmVhdGVBbmFseXNlcigpO1xuICAgICAgICAgICAgdGhpcy5hbmFseXNlcnNbaV0uZmZ0U2l6ZSA9IHRoaXMuZmZ0U2l6ZTtcbiAgICAgICAgICAgIHRoaXMuYW5hbHlzZXJzW2ldLnNtb290aGluZ1RpbWVDb25zdGFudCA9IDA7XG4gICAgICAgICAgICB0aGlzLmFuYWxCdWZmZXJzW2ldID0gbmV3IEZsb2F0MzJBcnJheSh0aGlzLmZmdFNpemUpO1xuICAgICAgICB9XG4gICAgICAgIC8vIENyZWF0ZSBjb25uZWN0aW9uc1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IDQ7IGkrKykge1xuICAgICAgICAgICAgdGhpcy5pbi5jb25uZWN0KHRoaXMub3V0LCBpLCBpKTtcbiAgICAgICAgICAgIHRoaXMuaW4uY29ubmVjdCh0aGlzLmFuYWx5c2Vyc1tpXSwgaSwgMCk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmluaXRpYWxpemVkID0gdHJ1ZTtcbiAgICB9XG5cbiAgICB1cGRhdGVCdWZmZXJzKCkge1xuICAgICAgICAvLyBHZXQgbGF0ZXN0IHRpbWUtZG9tYWluIGRhdGFcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCA0OyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMuYW5hbHlzZXJzW2ldLmdldEZsb2F0VGltZURvbWFpbkRhdGEodGhpcy5hbmFsQnVmZmVyc1tpXSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBjb21wdXRlSW50ZW5zaXR5KCkge1xuICAgICAgICAvLyBDb21wdXRlIGNvcnJlbGF0aW9ucyBhbmQgZW5lcmdpZXMgb2YgY2hhbm5lbHNcbiAgICAgICAgdmFyIGlYID0gMDtcbiAgICAgICAgdmFyIGlZID0gMDtcbiAgICAgICAgdmFyIGlaID0gMDtcbiAgICAgICAgdmFyIFdXID0gMDtcbiAgICAgICAgdmFyIFhYID0gMDtcbiAgICAgICAgdmFyIFlZID0gMDtcbiAgICAgICAgdmFyIFpaID0gMDtcbiAgICAgICAgdmFyIEksIElfbm9ybSwgRSwgUHNpLCBhemksIGVsZXY7XG4gICAgICAgIC8vIEFjY3VtdWxhdG9ycyBmb3IgY29ycmVsYXRpb25zIGFuZCBlbmVyZ2llc1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuZmZ0U2l6ZTsgaSsrKSB7XG5cbiAgICAgICAgICAgIGlYID0gaVggKyBNYXRoLnNxcnQoMikgKiB0aGlzLmFuYWxCdWZmZXJzWzBdW2ldICogdGhpcy5hbmFsQnVmZmVyc1sxXVtpXTtcbiAgICAgICAgICAgIGlZID0gaVkgKyBNYXRoLnNxcnQoMikgKiB0aGlzLmFuYWxCdWZmZXJzWzBdW2ldICogdGhpcy5hbmFsQnVmZmVyc1syXVtpXTtcbiAgICAgICAgICAgIGlaID0gaVogKyBNYXRoLnNxcnQoMikgKiB0aGlzLmFuYWxCdWZmZXJzWzBdW2ldICogdGhpcy5hbmFsQnVmZmVyc1szXVtpXTtcbiAgICAgICAgICAgIFdXID0gV1cgKyAyICogdGhpcy5hbmFsQnVmZmVyc1swXVtpXSAqIHRoaXMuYW5hbEJ1ZmZlcnNbMF1baV07XG4gICAgICAgICAgICBYWCA9IFhYICsgdGhpcy5hbmFsQnVmZmVyc1sxXVtpXSAqIHRoaXMuYW5hbEJ1ZmZlcnNbMV1baV07XG4gICAgICAgICAgICBZWSA9IFlZICsgdGhpcy5hbmFsQnVmZmVyc1syXVtpXSAqIHRoaXMuYW5hbEJ1ZmZlcnNbMl1baV07XG4gICAgICAgICAgICBaWiA9IFpaICsgdGhpcy5hbmFsQnVmZmVyc1szXVtpXSAqIHRoaXMuYW5hbEJ1ZmZlcnNbM11baV07XG4gICAgICAgIH1cbiAgICAgICAgSSA9IFtpWCwgaVksIGlaXTsgLy8gaW50ZW5zaXR5XG4gICAgICAgIElfbm9ybSA9IE1hdGguc3FydChJWzBdICogSVswXSArIElbMV0gKiBJWzFdICsgSVsyXSAqIElbMl0pOyAvLyBpbnRlbnNpdHkgbWFnbml0dWRlXG4gICAgICAgIEUgPSAoV1cgKyBYWCArIFlZICsgWlopIC8gMjsgLy8gZW5lcmd5XG4gICAgICAgIFBzaSA9IDEgLSBJX25vcm0gLyAoRSArIDEwZS04KTsgLy8gZGlmZnVzZW5lc3NcbiAgICAgICAgYXppID0gTWF0aC5hdGFuMihpWSwgaVgpICogMTgwIC8gTWF0aC5QSTtcbiAgICAgICAgZWxldiA9IE1hdGguYXRhbjIoSVsyXSwgTWF0aC5zcXJ0KElbMF0gKiBJWzBdICsgSVsxXSAqIElbMV0pKSAqIDE4MCAvIE1hdGguUEk7XG5cbiAgICAgICAgdmFyIHBhcmFtcyA9IFthemksIGVsZXYsIFBzaSwgRV07XG4gICAgICAgIHJldHVybiBwYXJhbXM7XG4gICAgfVxufVxuIl19