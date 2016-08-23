'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

require('get-float-time-domain-data');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var intensityAnalyser = function () {
    function intensityAnalyser(audioCtx) {
        (0, _classCallCheck3.default)(this, intensityAnalyser);


        this.ctx = audioCtx;
        this.fftSize = 2048;
        // Input and output nodes
        this.in = this.ctx.createChannelSplitter(4);
        this.out = this.ctx.createChannelMerger(4);
        // Gains to go from ACN/N3D to pressure-velocity (WXYZ)
        this.gains = new Array(4);
        for (var i = 0; i < 3; i++) {
            this.gains[i] = this.ctx.createGain();
            this.gains[i].gain.value = 1 / Math.sqrt(3);
        }
        // Initialize analyzer buffers
        this.analysers = new Array(4);
        this.analBuffers = new Array(4);
        for (i = 0; i < 4; i++) {
            this.analysers[i] = this.ctx.createAnalyser();
            this.analysers[i].fftSize = this.fftSize;
            this.analysers[i].smoothingTimeConstant = 0;
            this.analBuffers[i] = new Float32Array(this.fftSize);
        }
        // Create connections
        this.in.connect(this.out, 0, 0);
        this.in.connect(this.analysers[0], 0, 0);

        this.in.connect(this.gains[1], 1, 0);
        this.in.connect(this.gains[2], 2, 0);
        this.in.connect(this.gains[0], 3, 0);
        for (i = 0; i < 3; i++) {
            this.gains[i].connect(this.analysers[i + 1], 0, 0);
            this.gains[i].connect(this.out, 0, i + 1);
        }
    }

    (0, _createClass3.default)(intensityAnalyser, [{
        key: 'updateBuffers',
        value: function updateBuffers() {
            // Get latest time-domain data
            for (var i = 0; i < 4; i++) {
                this.analysers[i].getFloatTimeDomainData(this.analBuffers[i]);
            }
        }
    }, {
        key: 'computeIntensity',
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

//////////////////////////////////////////
/* PRESSURE-VELOCITY INTENSITY ANALYZER */
//////////////////////////////////////////

// for Safari support where audioContext.Analyser.getFloatTimeDomainData is not defined for now


exports.default = intensityAnalyser;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFtYmktaW50ZW5zaXR5QW5hbHlzZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7QUFrQkE7Ozs7SUFFcUIsaUI7QUFDakIsK0JBQVksUUFBWixFQUFzQjtBQUFBOzs7QUFFbEIsYUFBSyxHQUFMLEdBQVcsUUFBWDtBQUNBLGFBQUssT0FBTCxHQUFlLElBQWY7O0FBRUEsYUFBSyxFQUFMLEdBQVUsS0FBSyxHQUFMLENBQVMscUJBQVQsQ0FBK0IsQ0FBL0IsQ0FBVjtBQUNBLGFBQUssR0FBTCxHQUFXLEtBQUssR0FBTCxDQUFTLG1CQUFULENBQTZCLENBQTdCLENBQVg7O0FBRUEsYUFBSyxLQUFMLEdBQWEsSUFBSSxLQUFKLENBQVUsQ0FBVixDQUFiO0FBQ0EsYUFBSyxJQUFJLElBQUksQ0FBYixFQUFnQixJQUFJLENBQXBCLEVBQXVCLEdBQXZCLEVBQTRCO0FBQ3hCLGlCQUFLLEtBQUwsQ0FBVyxDQUFYLElBQWdCLEtBQUssR0FBTCxDQUFTLFVBQVQsRUFBaEI7QUFDQSxpQkFBSyxLQUFMLENBQVcsQ0FBWCxFQUFjLElBQWQsQ0FBbUIsS0FBbkIsR0FBMkIsSUFBSSxLQUFLLElBQUwsQ0FBVSxDQUFWLENBQS9CO0FBQ0g7O0FBRUQsYUFBSyxTQUFMLEdBQWlCLElBQUksS0FBSixDQUFVLENBQVYsQ0FBakI7QUFDQSxhQUFLLFdBQUwsR0FBbUIsSUFBSSxLQUFKLENBQVUsQ0FBVixDQUFuQjtBQUNBLGFBQUssSUFBSSxDQUFULEVBQVksSUFBSSxDQUFoQixFQUFtQixHQUFuQixFQUF3QjtBQUNwQixpQkFBSyxTQUFMLENBQWUsQ0FBZixJQUFvQixLQUFLLEdBQUwsQ0FBUyxjQUFULEVBQXBCO0FBQ0EsaUJBQUssU0FBTCxDQUFlLENBQWYsRUFBa0IsT0FBbEIsR0FBNEIsS0FBSyxPQUFqQztBQUNBLGlCQUFLLFNBQUwsQ0FBZSxDQUFmLEVBQWtCLHFCQUFsQixHQUEwQyxDQUExQztBQUNBLGlCQUFLLFdBQUwsQ0FBaUIsQ0FB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LENBQXBCLENBQW5DO0FBQ0EscUJBQUssS0FBSyxLQUFLLFdBQUwsQ0FBaUIsQ0FBakIsRUFBb0IsQ0FBcEIsSUFBeUIsS0FBSyxXQUFMLENBQWlCLENBQWpCLEVBQW9CLENBQXBCLENBQW5DO0FBQ0g7QUFDRCxnQkFBSSxDQUFDLEVBQUQsRUFBSyxFQUFMLEVBQVMsRUFBVCxDQUFKLEM7QUFDQSxxQkFBUyxLQUFLLElBQUwsQ0FBVSxFQUFFLENBQUYsSUFBTyxFQUFFLENBQUYsQ0FBUCxHQUFjLEVBQUUsQ0FBRixJQUFPLEVBQUUsQ0FBRixDQUFyQixHQUE0QixFQUFFLENBQUYsSUFBTyxFQUFFLENBQUYsQ0FBN0MsQ0FBVCxDO0FBQ0EsZ0JBQUksQ0FBQyxLQUFLLEVBQUwsR0FBVSxFQUFWLEdBQWUsRUFBaEIsSUFBc0IsQ0FBMUIsQztBQUNBLGtCQUFNLElBQUksVUFBVSxJQUFJLEtBQWQsQ0FBVixDO0FBQ0EsbUJBQU8sS0FBSyxLQUFMLENBQVcsRUFBWCxFQUFlLEVBQWYsSUFBcUIsR0FBckIsR0FBMkIsS0FBSyxFQUF2QztBQUNBLG1CQUFPLEtBQUssS0FBTCxDQUFXLEVBQUUsQ0FBRixDQUFYLEVBQWlCLEtBQUssSUFBTCxDQUFVLEVBQUUsQ0FBRixJQUFPLEVBQUUsQ0FBRixDQUFQLEdBQWMsRUFBRSxDQUFGLElBQU8sRUFBRSxDQUFGLENBQS9CLENBQWpCLElBQXlELEdBQXpELEdBQStELEtBQUssRUFBM0U7O0FBRUEsZ0JBQUksU0FBUyxDQUFDLElBQUQsRUFBTyxJQUFQLEVBQWEsR0FBYixFQUFrQixDQUFsQixDQUFiO0FBQ0EsbUJBQU8sTUFBUDtBQUNIOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztrQkExRWdCLGlCIiwiZmlsZSI6ImFtYmktaW50ZW5zaXR5QW5hbHlzZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gIEFyY2hvbnRpcyBQb2xpdGlzXG4vLyAgYXJjaG9udGlzLnBvbGl0aXNAYWFsdG8uZmlcbi8vICBEYXZpZCBQb2lyaWVyLVF1aW5vdFxuLy8gIGRhdmlwb2lyQGlyY2FtLmZyXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy9cbi8vICBXZWJBdWRpb19IT0EgYSBKYXZhU2NyaXB0IGxpYnJhcnkgZm9yIGhpZ2hlci1vcmRlciBBbWJpc29uaWNzXG4vLyAgVGhlIGxpYnJhcnkgaW1wbGVtZW50cyBXZWIgQXVkaW8gYmxvY2tzIHRoYXQgcGVyZm9ybVxuLy8gIHR5cGljYWwgYW1iaXNvbmljIHByb2Nlc3Npbmcgb3BlcmF0aW9ucyBvbiBhdWRpbyBzaWduYWxzLlxuLy9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLyogUFJFU1NVUkUtVkVMT0NJVFkgSU5URU5TSVRZIEFOQUxZWkVSICovXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLy8gZm9yIFNhZmFyaSBzdXBwb3J0IHdoZXJlIGF1ZGlvQ29udGV4dC5BbmFseXNlci5nZXRGbG9hdFRpbWVEb21haW5EYXRhIGlzIG5vdCBkZWZpbmVkIGZvciBub3dcbmltcG9ydCAnZ2V0LWZsb2F0LXRpbWUtZG9tYWluLWRhdGEnO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBpbnRlbnNpdHlBbmFseXNlciB7XG4gICAgY29uc3RydWN0b3IoYXVkaW9DdHgpIHtcblxuICAgICAgICB0aGlzLmN0eCA9IGF1ZGlvQ3R4O1xuICAgICAgICB0aGlzLmZmdFNpemUgPSAyMDQ4O1xuICAgICAgICAvLyBJbnB1dCBhbmQgb3V0cHV0IG5vZGVzXG4gICAgICAgIHRoaXMuaW4gPSB0aGlzLmN0eC5jcmVhdGVDaGFubmVsU3BsaXR0ZXIoNCk7XG4gICAgICAgIHRoaXMub3V0ID0gdGhpcy5jdHguY3JlYXRlQ2hhbm5lbE1lcmdlcig0KTtcbiAgICAgICAgLy8gR2FpbnMgdG8gZ28gZnJvbSBBQ04vTjNEIHRvIHByZXNzdXJlLXZlbG9jaXR5IChXWFlaKVxuICAgICAgICB0aGlzLmdhaW5zID0gbmV3IEFycmF5KDQpO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IDM7IGkrKykge1xuICAgICAgICAgICAgdGhpcy5nYWluc1tpXSA9IHRoaXMuY3R4LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgICAgIHRoaXMuZ2FpbnNbaV0uZ2Fpbi52YWx1ZSA9IDEgLyBNYXRoLnNxcnQoMyk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gSW5pdGlhbGl6ZSBhbmFseXplciBidWZmZXJzXG4gICAgICAgIHRoaXMuYW5hbHlzZXJzID0gbmV3IEFycmF5KDQpO1xuICAgICAgICB0aGlzLmFuYWxCdWZmZXJzID0gbmV3IEFycmF5KDQpO1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgNDsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLmFuYWx5c2Vyc1tpXSA9IHRoaXMuY3R4LmNyZWF0ZUFuYWx5c2VyKCk7XG4gICAgICAgICAgICB0aGlzLmFuYWx5c2Vyc1tpXS5mZnRTaXplID0gdGhpcy5mZnRTaXplO1xuICAgICAgICAgICAgdGhpcy5hbmFseXNlcnNbaV0uc21vb3RoaW5nVGltZUNvbnN0YW50ID0gMDtcbiAgICAgICAgICAgIHRoaXMuYW5hbEJ1ZmZlcnNbaV0gPSBuZXcgRmxvYXQzMkFycmF5KHRoaXMuZmZ0U2l6ZSk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gQ3JlYXRlIGNvbm5lY3Rpb25zXG4gICAgICAgIHRoaXMuaW4uY29ubmVjdCh0aGlzLm91dCwgMCwgMCk7XG4gICAgICAgIHRoaXMuaW4uY29ubmVjdCh0aGlzLmFuYWx5c2Vyc1swXSwgMCwgMCk7XG4gICAgICAgIFxuICAgICAgICB0aGlzLmluLmNvbm5lY3QodGhpcy5nYWluc1sxXSwgMSwgMCk7XG4gICAgICAgIHRoaXMuaW4uY29ubmVjdCh0aGlzLmdhaW5zWzJdLCAyLCAwKTtcbiAgICAgICAgdGhpcy5pbi5jb25uZWN0KHRoaXMuZ2FpbnNbMF0sIDMsIDApO1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgMzsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLmdhaW5zW2ldLmNvbm5lY3QodGhpcy5hbmFseXNlcnNbaSsxXSwgMCwgMCk7XG4gICAgICAgICAgICB0aGlzLmdhaW5zW2ldLmNvbm5lY3QodGhpcy5vdXQsIDAsIGkrMSk7XG4gICAgICAgIH1cblxuICAgIH1cblxuICAgIHVwZGF0ZUJ1ZmZlcnMoKSB7XG4gICAgICAgIC8vIEdldCBsYXRlc3QgdGltZS1kb21haW4gZGF0YVxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IDQ7IGkrKykge1xuICAgICAgICAgICAgdGhpcy5hbmFseXNlcnNbaV0uZ2V0RmxvYXRUaW1lRG9tYWluRGF0YSh0aGlzLmFuYWxCdWZmZXJzW2ldKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGNvbXB1dGVJbnRlbnNpdHkoKSB7XG4gICAgICAgIC8vIENvbXB1dGUgY29ycmVsYXRpb25zIGFuZCBlbmVyZ2llcyBvZiBjaGFubmVsc1xuICAgICAgICB2YXIgaVggPSAwO1xuICAgICAgICB2YXIgaVkgPSAwO1xuICAgICAgICB2YXIgaVogPSAwO1xuICAgICAgICB2YXIgV1cgPSAwO1xuICAgICAgICB2YXIgWFggPSAwO1xuICAgICAgICB2YXIgWVkgPSAwO1xuICAgICAgICB2YXIgWlogPSAwO1xuICAgICAgICB2YXIgSSwgSV9ub3JtLCBFLCBQc2ksIGF6aW0sIGVsZXY7XG4gICAgICAgIC8vIEFjY3VtdWxhdG9ycyBmb3IgY29ycmVsYXRpb25zIGFuZCBlbmVyZ2llc1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuZmZ0U2l6ZTsgaSsrKSB7XG5cbiAgICAgICAgICAgIGlYID0gaVggKyBNYXRoLnNxcnQoMikgKiB0aGlzLmFuYWxCdWZmZXJzWzBdW2ldICogdGhpcy5hbmFsQnVmZmVyc1sxXVtpXTtcbiAgICAgICAgICAgIGlZID0gaVkgKyBNYXRoLnNxcnQoMikgKiB0aGlzLmFuYWxCdWZmZXJzWzBdW2ldICogdGhpcy5hbmFsQnVmZmVyc1syXVtpXTtcbiAgICAgICAgICAgIGlaID0gaVogKyBNYXRoLnNxcnQoMikgKiB0aGlzLmFuYWxCdWZmZXJzWzBdW2ldICogdGhpcy5hbmFsQnVmZmVyc1szXVtpXTtcbiAgICAgICAgICAgIFdXID0gV1cgKyAyICogdGhpcy5hbmFsQnVmZmVyc1swXVtpXSAqIHRoaXMuYW5hbEJ1ZmZlcnNbMF1baV07XG4gICAgICAgICAgICBYWCA9IFhYICsgdGhpcy5hbmFsQnVmZmVyc1sxXVtpXSAqIHRoaXMuYW5hbEJ1ZmZlcnNbMV1baV07XG4gICAgICAgICAgICBZWSA9IFlZICsgdGhpcy5hbmFsQnVmZmVyc1syXVtpXSAqIHRoaXMuYW5hbEJ1ZmZlcnNbMl1baV07XG4gICAgICAgICAgICBaWiA9IFpaICsgdGhpcy5hbmFsQnVmZmVyc1szXVtpXSAqIHRoaXMuYW5hbEJ1ZmZlcnNbM11baV07XG4gICAgICAgIH1cbiAgICAgICAgSSA9IFtpWCwgaVksIGlaXTsgLy8gaW50ZW5zaXR5XG4gICAgICAgIElfbm9ybSA9IE1hdGguc3FydChJWzBdICogSVswXSArIElbMV0gKiBJWzFdICsgSVsyXSAqIElbMl0pOyAvLyBpbnRlbnNpdHkgbWFnbml0dWRlXG4gICAgICAgIEUgPSAoV1cgKyBYWCArIFlZICsgWlopIC8gMjsgLy8gZW5lcmd5XG4gICAgICAgIFBzaSA9IDEgLSBJX25vcm0gLyAoRSArIDEwZS04KTsgLy8gZGlmZnVzZW5lc3NcbiAgICAgICAgYXppbSA9IE1hdGguYXRhbjIoaVksIGlYKSAqIDE4MCAvIE1hdGguUEk7XG4gICAgICAgIGVsZXYgPSBNYXRoLmF0YW4yKElbMl0sIE1hdGguc3FydChJWzBdICogSVswXSArIElbMV0gKiBJWzFdKSkgKiAxODAgLyBNYXRoLlBJO1xuXG4gICAgICAgIHZhciBwYXJhbXMgPSBbYXppbSwgZWxldiwgUHNpLCBFXTtcbiAgICAgICAgcmV0dXJuIHBhcmFtcztcbiAgICB9XG59XG4iXX0=