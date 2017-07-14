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

var intensityAnalyser2D = function () {
    function intensityAnalyser2D(audioCtx) {
        (0, _classCallCheck3.default)(this, intensityAnalyser2D);


        this.ctx = audioCtx;
        this.fftSize = 2048;
        // Input and output nodes
        this.in = this.ctx.createChannelSplitter(3);
        this.out = this.ctx.createChannelMerger(3);
        // Gains to go from ACN/N3D to pressure-velocity (WXY)
        this.gains = new Array(2);
        for (var i = 0; i < 2; i++) {
            this.gains[i] = this.ctx.createGain();
            this.gains[i].gain.value = 1 / Math.sqrt(3);
        }
        // Initialize analyzer buffers
        this.analysers = new Array(3);
        this.analBuffers = new Array(3);
        for (i = 0; i < 3; i++) {
            this.analysers[i] = this.ctx.createAnalyser();
            this.analysers[i].fftSize = this.fftSize;
            this.analysers[i].smoothingTimeConstant = 0;
            this.analBuffers[i] = new Float32Array(this.fftSize);
        }
        // Create connections
        this.in.connect(this.out, 0, 0); //W
        this.in.connect(this.analysers[0], 0, 0);

        this.in.connect(this.gains[1], 1, 0); //X
        this.in.connect(this.gains[0], 2, 0); //Y
        for (i = 0; i < 2; i++) {
            this.gains[i].connect(this.analysers[i + 1], 0, 0);
            this.gains[i].connect(this.out, 0, i + 1);
        }
    }

    (0, _createClass3.default)(intensityAnalyser2D, [{
        key: 'updateBuffers',
        value: function updateBuffers() {
            // Get latest time-domain data
            for (var i = 0; i < 3; i++) {
                this.analysers[i].getFloatTimeDomainData(this.analBuffers[i]);
            }
        }
    }, {
        key: 'computeIntensity',
        value: function computeIntensity() {
            // Compute correlations and energies of channels
            var iX = 0;
            var iY = 0;
            var WW = 0;
            var XX = 0;
            var YY = 0;
            var I, I_norm, E, Psi, azim, elev;
            // Accumulators for correlations and energies
            for (var i = 0; i < this.fftSize; i++) {
                iX = iX + this.analBuffers[0][i] * this.analBuffers[1][i];
                iY = iY + this.analBuffers[0][i] * this.analBuffers[2][i];
                WW = WW + this.analBuffers[0][i] * this.analBuffers[0][i];
                XX = XX + this.analBuffers[1][i] * this.analBuffers[1][i];
                YY = YY + this.analBuffers[2][i] * this.analBuffers[2][i];
            }
            I = [iX, iY]; // intensity
            I_norm = Math.sqrt(I[0] * I[0] + I[1] * I[1]); // intensity magnitude
            E = (WW + XX + YY) / 2; // energy
            Psi = 1 - I_norm / (E + 10e-8); // diffuseness
            azim = -Math.atan2(iY, iX) * 180 / Math.PI;
            elev = 0;

            var params = [azim, elev, Psi, E];
            return params;
        }
    }]);
    return intensityAnalyser2D;
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
////////////////////////////////////////////////////////////////////
//
//  intensityAnalyser for 2D use
//  adapted by Thomas Deppisch
//  thomas.deppisch93@gmail.com
//
////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////
/* PRESSURE-VELOCITY INTENSITY ANALYZER for 2D Ambisonics */
////////////////////////////////////////////////////////////

// for Safari support where audioContext.Analyser.getFloatTimeDomainData is not defined for now


exports.default = intensityAnalyser2D;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFtYmktaW50ZW5zaXR5QW5hbHlzZXIyRC5qcyJdLCJuYW1lcyI6WyJpbnRlbnNpdHlBbmFseXNlcjJEIiwiYXVkaW9DdHgiLCJjdHgiLCJmZnRTaXplIiwiaW4iLCJjcmVhdGVDaGFubmVsU3BsaXR0ZXIiLCJvdXQiLCJjcmVhdGVDaGFubmVsTWVyZ2VyIiwiZ2FpbnMiLCJBcnJheSIsImkiLCJjcmVhdGVHYWluIiwiZ2FpbiIsInZhbHVlIiwiTWF0aCIsInNxcnQiLCJhbmFseXNlcnMiLCJhbmFsQnVmZmVycyIsImNyZWF0ZUFuYWx5c2VyIiwic21vb3RoaW5nVGltZUNvbnN0YW50IiwiRmxvYXQzMkFycmF5IiwiY29ubmVjdCIsImdldEZsb2F0VGltZURvbWFpbkRhdGEiLCJpWCIsImlZIiwiV1ciLCJYWCIsIllZIiwiSSIsIklfbm9ybSIsIkUiLCJQc2kiLCJhemltIiwiZWxldiIsImF0YW4yIiwiUEkiLCJwYXJhbXMiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7O0FBd0JBOzs7O0lBRXFCQSxtQjtBQUNqQixpQ0FBWUMsUUFBWixFQUFzQjtBQUFBOzs7QUFFbEIsYUFBS0MsR0FBTCxHQUFXRCxRQUFYO0FBQ0EsYUFBS0UsT0FBTCxHQUFlLElBQWY7QUFDQTtBQUNBLGFBQUtDLEVBQUwsR0FBVSxLQUFLRixHQUFMLENBQVNHLHFCQUFULENBQStCLENBQS9CLENBQVY7QUFDQSxhQUFLQyxHQUFMLEdBQVcsS0FBS0osR0FBTCxDQUFTSyxtQkFBVCxDQUE2QixDQUE3QixDQUFYO0FBQ0E7QUFDQSxhQUFLQyxLQUFMLEdBQWEsSUFBSUMsS0FBSixDQUFVLENBQVYsQ0FBYjtBQUNBLGFBQUssSUFBSUMsSUFBSSxDQUFiLEVBQWdCQSxJQUFJLENBQXBCLEVBQXVCQSxHQUF2QixFQUE0QjtBQUN4QixpQkFBS0YsS0FBTCxDQUFXRSxDQUFYLElBQWdCLEtBQUtSLEdBQUwsQ0FBU1MsVUFBVCxFQUFoQjtBQUNBLGlCQUFLSCxLQUFMLENBQVdFLENBQVgsRUFB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ZSI6ImFtYmktaW50ZW5zaXR5QW5hbHlzZXIyRC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyAgQXJjaG9udGlzIFBvbGl0aXNcbi8vICBhcmNob250aXMucG9saXRpc0BhYWx0by5maVxuLy8gIERhdmlkIFBvaXJpZXItUXVpbm90XG4vLyAgZGF2aXBvaXJAaXJjYW0uZnJcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vL1xuLy8gIEpTQW1iaXNvbmljcyBhIEphdmFTY3JpcHQgbGlicmFyeSBmb3IgaGlnaGVyLW9yZGVyIEFtYmlzb25pY3Ncbi8vICBUaGUgbGlicmFyeSBpbXBsZW1lbnRzIFdlYiBBdWRpbyBibG9ja3MgdGhhdCBwZXJmb3JtXG4vLyAgdHlwaWNhbCBhbWJpc29uaWMgcHJvY2Vzc2luZyBvcGVyYXRpb25zIG9uIGF1ZGlvIHNpZ25hbHMuXG4vL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vL1xuLy8gIGludGVuc2l0eUFuYWx5c2VyIGZvciAyRCB1c2Vcbi8vICBhZGFwdGVkIGJ5IFRob21hcyBEZXBwaXNjaFxuLy8gIHRob21hcy5kZXBwaXNjaDkzQGdtYWlsLmNvbVxuLy9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8qIFBSRVNTVVJFLVZFTE9DSVRZIElOVEVOU0lUWSBBTkFMWVpFUiBmb3IgMkQgQW1iaXNvbmljcyAqL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbi8vIGZvciBTYWZhcmkgc3VwcG9ydCB3aGVyZSBhdWRpb0NvbnRleHQuQW5hbHlzZXIuZ2V0RmxvYXRUaW1lRG9tYWluRGF0YSBpcyBub3QgZGVmaW5lZCBmb3Igbm93XG5pbXBvcnQgJ2dldC1mbG9hdC10aW1lLWRvbWFpbi1kYXRhJztcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgaW50ZW5zaXR5QW5hbHlzZXIyRCB7XG4gICAgY29uc3RydWN0b3IoYXVkaW9DdHgpIHtcblxuICAgICAgICB0aGlzLmN0eCA9IGF1ZGlvQ3R4O1xuICAgICAgICB0aGlzLmZmdFNpemUgPSAyMDQ4O1xuICAgICAgICAvLyBJbnB1dCBhbmQgb3V0cHV0IG5vZGVzXG4gICAgICAgIHRoaXMuaW4gPSB0aGlzLmN0eC5jcmVhdGVDaGFubmVsU3BsaXR0ZXIoMyk7XG4gICAgICAgIHRoaXMub3V0ID0gdGhpcy5jdHguY3JlYXRlQ2hhbm5lbE1lcmdlcigzKTtcbiAgICAgICAgLy8gR2FpbnMgdG8gZ28gZnJvbSBBQ04vTjNEIHRvIHByZXNzdXJlLXZlbG9jaXR5IChXWFkpXG4gICAgICAgIHRoaXMuZ2FpbnMgPSBuZXcgQXJyYXkoMik7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgMjsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLmdhaW5zW2ldID0gdGhpcy5jdHguY3JlYXRlR2FpbigpO1xuICAgICAgICAgICAgdGhpcy5nYWluc1tpXS5nYWluLnZhbHVlID0gMSAvIE1hdGguc3FydCgzKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBJbml0aWFsaXplIGFuYWx5emVyIGJ1ZmZlcnNcbiAgICAgICAgdGhpcy5hbmFseXNlcnMgPSBuZXcgQXJyYXkoMyk7XG4gICAgICAgIHRoaXMuYW5hbEJ1ZmZlcnMgPSBuZXcgQXJyYXkoMyk7XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCAzOyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMuYW5hbHlzZXJzW2ldID0gdGhpcy5jdHguY3JlYXRlQW5hbHlzZXIoKTtcbiAgICAgICAgICAgIHRoaXMuYW5hbHlzZXJzW2ldLmZmdFNpemUgPSB0aGlzLmZmdFNpemU7XG4gICAgICAgICAgICB0aGlzLmFuYWx5c2Vyc1tpXS5zbW9vdGhpbmdUaW1lQ29uc3RhbnQgPSAwO1xuICAgICAgICAgICAgdGhpcy5hbmFsQnVmZmVyc1tpXSA9IG5ldyBGbG9hdDMyQXJyYXkodGhpcy5mZnRTaXplKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBDcmVhdGUgY29ubmVjdGlvbnNcbiAgICAgICAgdGhpcy5pbi5jb25uZWN0KHRoaXMub3V0LCAwLCAwKTsgIC8vV1xuICAgICAgICB0aGlzLmluLmNvbm5lY3QodGhpcy5hbmFseXNlcnNbMF0sIDAsIDApO1xuXG4gICAgICAgIHRoaXMuaW4uY29ubmVjdCh0aGlzLmdhaW5zWzFdLCAxLCAwKTsgLy9YXG4gICAgICAgIHRoaXMuaW4uY29ubmVjdCh0aGlzLmdhaW5zWzBdLCAyLCAwKTsgLy9ZXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCAyOyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMuZ2FpbnNbaV0uY29ubmVjdCh0aGlzLmFuYWx5c2Vyc1tpKzFdLCAwLCAwKTtcbiAgICAgICAgICAgIHRoaXMuZ2FpbnNbaV0uY29ubmVjdCh0aGlzLm91dCwgMCwgaSsxKTtcbiAgICAgICAgfVxuXG4gICAgfVxuXG4gICAgdXBkYXRlQnVmZmVycygpIHtcbiAgICAgICAgLy8gR2V0IGxhdGVzdCB0aW1lLWRvbWFpbiBkYXRhXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgMzsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLmFuYWx5c2Vyc1tpXS5nZXRGbG9hdFRpbWVEb21haW5EYXRhKHRoaXMuYW5hbEJ1ZmZlcnNbaV0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgY29tcHV0ZUludGVuc2l0eSgpIHtcbiAgICAgICAgLy8gQ29tcHV0ZSBjb3JyZWxhdGlvbnMgYW5kIGVuZXJnaWVzIG9mIGNoYW5uZWxzXG4gICAgICAgIHZhciBpWCA9IDA7XG4gICAgICAgIHZhciBpWSA9IDA7XG4gICAgICAgIHZhciBXVyA9IDA7XG4gICAgICAgIHZhciBYWCA9IDA7XG4gICAgICAgIHZhciBZWSA9IDA7XG4gICAgICAgIHZhciBJLCBJX25vcm0sIEUsIFBzaSwgYXppbSwgZWxldjtcbiAgICAgICAgLy8gQWNjdW11bGF0b3JzIGZvciBjb3JyZWxhdGlvbnMgYW5kIGVuZXJnaWVzXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5mZnRTaXplOyBpKyspIHtcbiAgICAgICAgICAgIGlYID0gaVggKyB0aGlzLmFuYWxCdWZmZXJzWzBdW2ldICogdGhpcy5hbmFsQnVmZmVyc1sxXVtpXTtcbiAgICAgICAgICAgIGlZID0gaVkgKyB0aGlzLmFuYWxCdWZmZXJzWzBdW2ldICogdGhpcy5hbmFsQnVmZmVyc1syXVtpXTtcbiAgICAgICAgICAgIFdXID0gV1cgKyB0aGlzLmFuYWxCdWZmZXJzWzBdW2ldICogdGhpcy5hbmFsQnVmZmVyc1swXVtpXTtcbiAgICAgICAgICAgIFhYID0gWFggKyB0aGlzLmFuYWxCdWZmZXJzWzFdW2ldICogdGhpcy5hbmFsQnVmZmVyc1sxXVtpXTtcbiAgICAgICAgICAgIFlZID0gWVkgKyB0aGlzLmFuYWxCdWZmZXJzWzJdW2ldICogdGhpcy5hbmFsQnVmZmVyc1syXVtpXTtcbiAgICAgICAgfVxuICAgICAgICBJID0gW2lYLCBpWV07IC8vIGludGVuc2l0eVxuICAgICAgICBJX25vcm0gPSBNYXRoLnNxcnQoSVswXSpJWzBdICsgSVsxXSpJWzFdKTsgLy8gaW50ZW5zaXR5IG1hZ25pdHVkZVxuICAgICAgICBFID0gKFdXICsgWFggKyBZWSkgLyAyOyAvLyBlbmVyZ3lcbiAgICAgICAgUHNpID0gMSAtIElfbm9ybSAvIChFICsgMTBlLTgpOyAvLyBkaWZmdXNlbmVzc1xuICAgICAgICBhemltID0gLU1hdGguYXRhbjIoaVksIGlYKSAqIDE4MCAvIE1hdGguUEk7XG4gICAgICAgIGVsZXYgPSAwO1xuXG4gICAgICAgIHZhciBwYXJhbXMgPSBbYXppbSwgZWxldiwgUHNpLCBFXTtcbiAgICAgICAgcmV0dXJuIHBhcmFtcztcbiAgICB9XG59XG4iXX0=