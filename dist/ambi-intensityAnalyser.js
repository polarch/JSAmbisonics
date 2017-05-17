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
        this.gains = new Array(3);
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

                iX = iX + this.analBuffers[0][i] * this.analBuffers[1][i];
                iY = iY + this.analBuffers[0][i] * this.analBuffers[2][i];
                iZ = iZ + this.analBuffers[0][i] * this.analBuffers[3][i];
                WW = WW + this.analBuffers[0][i] * this.analBuffers[0][i];
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
//  JSAmbisonics a JavaScript library for higher-order Ambisonics
//  The library implements Web Audio blocks that perform
//  typical ambisonic processing operations on audio signals.
//
////////////////////////////////////////////////////////////////////

//////////////////////////////////////////
/* PRESSURE-VELOCITY INTENSITY ANALYZER */
//////////////////////////////////////////

// for Safari support where audioContext.Analyser.getFloatTimeDomainData is not defined for now


exports.default = intensityAnalyser;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFtYmktaW50ZW5zaXR5QW5hbHlzZXIuanMiXSwibmFtZXMiOlsiaW50ZW5zaXR5QW5hbHlzZXIiLCJhdWRpb0N0eCIsImN0eCIsImZmdFNpemUiLCJpbiIsImNyZWF0ZUNoYW5uZWxTcGxpdHRlciIsIm91dCIsImNyZWF0ZUNoYW5uZWxNZXJnZXIiLCJnYWlucyIsIkFycmF5IiwiaSIsImNyZWF0ZUdhaW4iLCJnYWluIiwidmFsdWUiLCJNYXRoIiwic3FydCIsImFuYWx5c2VycyIsImFuYWxCdWZmZXJzIiwiY3JlYXRlQW5hbHlzZXIiLCJzbW9vdGhpbmdUaW1lQ29uc3RhbnQiLCJGbG9hdDMyQXJyYXkiLCJjb25uZWN0IiwiZ2V0RmxvYXRUaW1lRG9tYWluRGF0YSIsImlYIiwiaVkiLCJpWiIsIldXIiwiWFgiLCJZWSIsIlpaIiwiSSIsIklfbm9ybSIsIkUiLCJQc2kiLCJhemltIiwiZWxldiIsImF0YW4yIiwiUEkiLCJwYXJhbXMiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7O0FBa0JBOzs7O0lBRXFCQSxpQjtBQUNqQiwrQkFBWUMsUUFBWixFQUFzQjtBQUFBOzs7QUFFbEIsYUFBS0MsR0FBTCxHQUFXRCxRQUFYO0FBQ0EsYUFBS0UsT0FBTCxHQUFlLElBQWY7QUFDQTtBQUNBLGFBQUtDLEVBQUwsR0FBVSxLQUFLRixHQUFMLENBQVNHLHFCQUFULENBQStCLENBQS9CLENBQVY7QUFDQSxhQUFLQyxHQUFMLEdBQVcsS0FBS0osR0FBTCxDQUFTSyxtQkFBVCxDQUE2QixDQUE3QixDQUFYO0FBQ0E7QUFDQSxhQUFLQyxLQUFMLEdBQWEsSUFBSUMsS0FBSixDQUFVLENBQVYsQ0FBYjtBQUNBLGFBQUssSUFBSUMsSUFBSSxDQUFiLEVBQWdCQSxJQUFJLENBQXBCLEVBQXVCQSxHQUF2QixFQUE0QjtBQUN4QixpQkFBS0YsS0FBTCxDQUFXRSxDQUFYLElBQWdCLEtBQUtSLEdBQUwsQ0FBU1MsVUFBVCxFQUFoQjtBQUNBLGlCQUFLSCxLQUFMLENBQVdFLENB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LEtBQWQsQ0FBVixDQXhCZSxDQXdCaUI7QUFDaENFLG1CQUFPcEIsS0FBS3NCLEtBQUwsQ0FBV1osRUFBWCxFQUFlRCxFQUFmLElBQXFCLEdBQXJCLEdBQTJCVCxLQUFLdUIsRUFBdkM7QUFDQUYsbUJBQU9yQixLQUFLc0IsS0FBTCxDQUFXTixFQUFFLENBQUYsQ0FBWCxFQUFpQmhCLEtBQUtDLElBQUwsQ0FBVWUsRUFBRSxDQUFGLElBQU9BLEVBQUUsQ0FBRixDQUFQLEdBQWNBLEVBQUUsQ0FBRixJQUFPQSxFQUFFLENBQUYsQ0FBL0IsQ0FBakIsSUFBeUQsR0FBekQsR0FBK0RoQixLQUFLdUIsRUFBM0U7O0FBRUEsZ0JBQUlDLFNBQVMsQ0FBQ0osSUFBRCxFQUFPQyxJQUFQLEVBQWFGLEdBQWIsRUFBa0JELENBQWxCLENBQWI7QUFDQSxtQkFBT00sTUFBUDtBQUNIOzs7S0E5Rkw7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTs7O2tCQUdxQnRDLGlCIiwiZmlsZSI6ImFtYmktaW50ZW5zaXR5QW5hbHlzZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gIEFyY2hvbnRpcyBQb2xpdGlzXG4vLyAgYXJjaG9udGlzLnBvbGl0aXNAYWFsdG8uZmlcbi8vICBEYXZpZCBQb2lyaWVyLVF1aW5vdFxuLy8gIGRhdmlwb2lyQGlyY2FtLmZyXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy9cbi8vICBKU0FtYmlzb25pY3MgYSBKYXZhU2NyaXB0IGxpYnJhcnkgZm9yIGhpZ2hlci1vcmRlciBBbWJpc29uaWNzXG4vLyAgVGhlIGxpYnJhcnkgaW1wbGVtZW50cyBXZWIgQXVkaW8gYmxvY2tzIHRoYXQgcGVyZm9ybVxuLy8gIHR5cGljYWwgYW1iaXNvbmljIHByb2Nlc3Npbmcgb3BlcmF0aW9ucyBvbiBhdWRpbyBzaWduYWxzLlxuLy9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLyogUFJFU1NVUkUtVkVMT0NJVFkgSU5URU5TSVRZIEFOQUxZWkVSICovXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLy8gZm9yIFNhZmFyaSBzdXBwb3J0IHdoZXJlIGF1ZGlvQ29udGV4dC5BbmFseXNlci5nZXRGbG9hdFRpbWVEb21haW5EYXRhIGlzIG5vdCBkZWZpbmVkIGZvciBub3dcbmltcG9ydCAnZ2V0LWZsb2F0LXRpbWUtZG9tYWluLWRhdGEnO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBpbnRlbnNpdHlBbmFseXNlciB7XG4gICAgY29uc3RydWN0b3IoYXVkaW9DdHgpIHtcblxuICAgICAgICB0aGlzLmN0eCA9IGF1ZGlvQ3R4O1xuICAgICAgICB0aGlzLmZmdFNpemUgPSAyMDQ4O1xuICAgICAgICAvLyBJbnB1dCBhbmQgb3V0cHV0IG5vZGVzXG4gICAgICAgIHRoaXMuaW4gPSB0aGlzLmN0eC5jcmVhdGVDaGFubmVsU3BsaXR0ZXIoNCk7XG4gICAgICAgIHRoaXMub3V0ID0gdGhpcy5jdHguY3JlYXRlQ2hhbm5lbE1lcmdlcig0KTtcbiAgICAgICAgLy8gR2FpbnMgdG8gZ28gZnJvbSBBQ04vTjNEIHRvIHByZXNzdXJlLXZlbG9jaXR5IChXWFlaKVxuICAgICAgICB0aGlzLmdhaW5zID0gbmV3IEFycmF5KDMpO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IDM7IGkrKykge1xuICAgICAgICAgICAgdGhpcy5nYWluc1tpXSA9IHRoaXMuY3R4LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgICAgIHRoaXMuZ2FpbnNbaV0uZ2Fpbi52YWx1ZSA9IDEgLyBNYXRoLnNxcnQoMyk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gSW5pdGlhbGl6ZSBhbmFseXplciBidWZmZXJzXG4gICAgICAgIHRoaXMuYW5hbHlzZXJzID0gbmV3IEFycmF5KDQpO1xuICAgICAgICB0aGlzLmFuYWxCdWZmZXJzID0gbmV3IEFycmF5KDQpO1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgNDsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLmFuYWx5c2Vyc1tpXSA9IHRoaXMuY3R4LmNyZWF0ZUFuYWx5c2VyKCk7XG4gICAgICAgICAgICB0aGlzLmFuYWx5c2Vyc1tpXS5mZnRTaXplID0gdGhpcy5mZnRTaXplO1xuICAgICAgICAgICAgdGhpcy5hbmFseXNlcnNbaV0uc21vb3RoaW5nVGltZUNvbnN0YW50ID0gMDtcbiAgICAgICAgICAgIHRoaXMuYW5hbEJ1ZmZlcnNbaV0gPSBuZXcgRmxvYXQzMkFycmF5KHRoaXMuZmZ0U2l6ZSk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gQ3JlYXRlIGNvbm5lY3Rpb25zXG4gICAgICAgIHRoaXMuaW4uY29ubmVjdCh0aGlzLm91dCwgMCwgMCk7XG4gICAgICAgIHRoaXMuaW4uY29ubmVjdCh0aGlzLmFuYWx5c2Vyc1swXSwgMCwgMCk7XG4gICAgICAgIFxuICAgICAgICB0aGlzLmluLmNvbm5lY3QodGhpcy5nYWluc1sxXSwgMSwgMCk7XG4gICAgICAgIHRoaXMuaW4uY29ubmVjdCh0aGlzLmdhaW5zWzJdLCAyLCAwKTtcbiAgICAgICAgdGhpcy5pbi5jb25uZWN0KHRoaXMuZ2FpbnNbMF0sIDMsIDApO1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgMzsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLmdhaW5zW2ldLmNvbm5lY3QodGhpcy5hbmFseXNlcnNbaSsxXSwgMCwgMCk7XG4gICAgICAgICAgICB0aGlzLmdhaW5zW2ldLmNvbm5lY3QodGhpcy5vdXQsIDAsIGkrMSk7XG4gICAgICAgIH1cblxuICAgIH1cblxuICAgIHVwZGF0ZUJ1ZmZlcnMoKSB7XG4gICAgICAgIC8vIEdldCBsYXRlc3QgdGltZS1kb21haW4gZGF0YVxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IDQ7IGkrKykge1xuICAgICAgICAgICAgdGhpcy5hbmFseXNlcnNbaV0uZ2V0RmxvYXRUaW1lRG9tYWluRGF0YSh0aGlzLmFuYWxCdWZmZXJzW2ldKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGNvbXB1dGVJbnRlbnNpdHkoKSB7XG4gICAgICAgIC8vIENvbXB1dGUgY29ycmVsYXRpb25zIGFuZCBlbmVyZ2llcyBvZiBjaGFubmVsc1xuICAgICAgICB2YXIgaVggPSAwO1xuICAgICAgICB2YXIgaVkgPSAwO1xuICAgICAgICB2YXIgaVogPSAwO1xuICAgICAgICB2YXIgV1cgPSAwO1xuICAgICAgICB2YXIgWFggPSAwO1xuICAgICAgICB2YXIgWVkgPSAwO1xuICAgICAgICB2YXIgWlogPSAwO1xuICAgICAgICB2YXIgSSwgSV9ub3JtLCBFLCBQc2ksIGF6aW0sIGVsZXY7XG4gICAgICAgIC8vIEFjY3VtdWxhdG9ycyBmb3IgY29ycmVsYXRpb25zIGFuZCBlbmVyZ2llc1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuZmZ0U2l6ZTsgaSsrKSB7XG5cbiAgICAgICAgICAgIGlYID0gaVggKyB0aGlzLmFuYWxCdWZmZXJzWzBdW2ldICogdGhpcy5hbmFsQnVmZmVyc1sxXVtpXTtcbiAgICAgICAgICAgIGlZID0gaVkgKyB0aGlzLmFuYWxCdWZmZXJzWzBdW2ldICogdGhpcy5hbmFsQnVmZmVyc1syXVtpXTtcbiAgICAgICAgICAgIGlaID0gaVogKyB0aGlzLmFuYWxCdWZmZXJzWzBdW2ldICogdGhpcy5hbmFsQnVmZmVyc1szXVtpXTtcbiAgICAgICAgICAgIFdXID0gV1cgKyB0aGlzLmFuYWxCdWZmZXJzWzBdW2ldICogdGhpcy5hbmFsQnVmZmVyc1swXVtpXTtcbiAgICAgICAgICAgIFhYID0gWFggKyB0aGlzLmFuYWxCdWZmZXJzWzFdW2ldICogdGhpcy5hbmFsQnVmZmVyc1sxXVtpXTtcbiAgICAgICAgICAgIFlZID0gWVkgKyB0aGlzLmFuYWxCdWZmZXJzWzJdW2ldICogdGhpcy5hbmFsQnVmZmVyc1syXVtpXTtcbiAgICAgICAgICAgIFpaID0gWlogKyB0aGlzLmFuYWxCdWZmZXJzWzNdW2ldICogdGhpcy5hbmFsQnVmZmVyc1szXVtpXTtcbiAgICAgICAgfVxuICAgICAgICBJID0gW2lYLCBpWSwgaVpdOyAvLyBpbnRlbnNpdHlcbiAgICAgICAgSV9ub3JtID0gTWF0aC5zcXJ0KElbMF0qSVswXSArIElbMV0qSVsxXSArIElbMl0qSVsyXSk7IC8vIGludGVuc2l0eSBtYWduaXR1ZGVcbiAgICAgICAgRSA9IChXVyArIFhYICsgWVkgKyBaWikgLyAyOyAvLyBlbmVyZ3lcbiAgICAgICAgUHNpID0gMSAtIElfbm9ybSAvIChFICsgMTBlLTgpOyAvLyBkaWZmdXNlbmVzc1xuICAgICAgICBhemltID0gTWF0aC5hdGFuMihpWSwgaVgpICogMTgwIC8gTWF0aC5QSTtcbiAgICAgICAgZWxldiA9IE1hdGguYXRhbjIoSVsyXSwgTWF0aC5zcXJ0KElbMF0gKiBJWzBdICsgSVsxXSAqIElbMV0pKSAqIDE4MCAvIE1hdGguUEk7XG5cbiAgICAgICAgdmFyIHBhcmFtcyA9IFthemltLCBlbGV2LCBQc2ksIEVdO1xuICAgICAgICByZXR1cm4gcGFyYW1zO1xuICAgIH1cbn1cbiJdfQ==