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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFtYmktaW50ZW5zaXR5QW5hbHlzZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7QUFrQkE7Ozs7SUFFcUIsaUI7QUFDakIsK0JBQVksUUFBWixFQUFzQjtBQUFBOztBQUNsQixhQUFLLFdBQUwsR0FBbUIsS0FBbkI7O0FBRUEsYUFBSyxHQUFMLEdBQVcsUUFBWDtBQUNBLGFBQUssT0FBTCxHQUFlLElBQWY7QUFDQSxhQUFLLFNBQUwsR0FBaUIsSUFBSSxLQUFKLENBQVUsQ0FBVixDQUFqQjtBQUNBLGFBQUssV0FBTCxHQUFtQixJQUFJLEtBQUosQ0FBVSxDQUFWLENBQW5COztBQUVBLGFBQUssRUFBTCxHQUFVLEtBQUssR0FBTCxDQUFTLHFCQUFULENBQStCLENBQS9CLENBQVY7QUFDQSxhQUFLLEdBQUwsR0FBVyxLQUFLLEdBQUwsQ0FBUyxtQkFBVCxDQUE2QixDQUE3QixDQUFYOztBQUVBLGFBQUssSUFBSSxJQUFJLENBQWIsRUFBZ0IsSUFBSSxDQUFwQixFQUF1QixHQUF2QixFQUE0QjtBQUN4QixpQkFBSyxTQUFMLENBQWUsQ0FBZixJQUFvQixLQUFLLEdBQUwsQ0FBUyxjQUFULEVBQXBCO0FBQ0EsaUJBQUssU0FBTCxDQUFlLENBQWYsRUFBa0IsT0FBbEIsR0FBNEIsS0FBSyxPQUFqQztBQUNBLGlCQUFLLFNBQUwsQ0FBZSxDQUFmLEVBQWtCLHFCQUFsQixHQUEwQyxDQUExQztBQUNBLGlCQUFLLFdBQUwsQ0FBaUIsQ0FBakIsSUFBc0IsSUFBSSxZQUFKLENBQWlCLEtBQUssT0FBdEIsQ0FBdEI7QUFDSDs7QUFFRCxhQUFLLElBQUksS0FBSSxDQUFiLEVBQWdCLEtBQUksQ0FBcEIsRUFBdUIsSUFBdkIsRUFBNEI7QUFDeEIsaUJBQUssRUFBTCxDQUFRLE9BQVIsQ0FBZ0IsS0FBSyxHQUFyQixFQUEwQixFQUExQixFQUE2QixFQUE3QjtBQUNBLGlCQUFLLEVBQUwsQ0FBUSxPQUFSLENBQWdCLEtBQUssU0FBTCxDQUFl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ekQsR0FBK0QsS0FBSyxFQUEzRTs7QUFFQSxnQkFBSSxTQUFTLENBQUMsSUFBRCxFQUFPLElBQVAsRUFBYSxHQUFiLEVBQWtCLENBQWxCLENBQWI7QUFDQSxtQkFBTyxNQUFQO0FBQ0g7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O2tCQWhFZ0IsaUIiLCJmaWxlIjoiYW1iaS1pbnRlbnNpdHlBbmFseXNlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyAgQXJjaG9udGlzIFBvbGl0aXNcbi8vICBhcmNob250aXMucG9saXRpc0BhYWx0by5maVxuLy8gIERhdmlkIFBvaXJpZXItUXVpbm90XG4vLyAgZGF2aXBvaXJAaXJjYW0uZnJcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vL1xuLy8gIFdlYkF1ZGlvX0hPQSBhIEphdmFTY3JpcHQgbGlicmFyeSBmb3IgaGlnaGVyLW9yZGVyIEFtYmlzb25pY3Ncbi8vICBUaGUgbGlicmFyeSBpbXBsZW1lbnRzIFdlYiBBdWRpbyBibG9ja3MgdGhhdCBwZXJmb3JtXG4vLyAgdHlwaWNhbCBhbWJpc29uaWMgcHJvY2Vzc2luZyBvcGVyYXRpb25zIG9uIGF1ZGlvIHNpZ25hbHMuXG4vL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vKiBQUkVTU1VSRS1WRUxPQ0lUWSBJTlRFTlNJVFkgQU5BTFlaRVIgKi9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4vLyBmb3IgU2FmYXJpIHN1cHBvcnQgd2hlcmUgYXVkaW9Db250ZXh0LkFuYWx5c2VyLmdldEZsb2F0VGltZURvbWFpbkRhdGEgaXMgbm90IGRlZmluZWQgZm9yIG5vd1xuaW1wb3J0ICdnZXQtZmxvYXQtdGltZS1kb21haW4tZGF0YSc7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIGludGVuc2l0eUFuYWx5c2VyIHtcbiAgICBjb25zdHJ1Y3RvcihhdWRpb0N0eCkge1xuICAgICAgICB0aGlzLmluaXRpYWxpemVkID0gZmFsc2U7XG5cbiAgICAgICAgdGhpcy5jdHggPSBhdWRpb0N0eDtcbiAgICAgICAgdGhpcy5mZnRTaXplID0gMjA0ODtcbiAgICAgICAgdGhpcy5hbmFseXNlcnMgPSBuZXcgQXJyYXkoNCk7XG4gICAgICAgIHRoaXMuYW5hbEJ1ZmZlcnMgPSBuZXcgQXJyYXkoNCk7XG4gICAgICAgIC8vIElucHV0IGFuZCBvdXRwdXQgbm9kZXNcbiAgICAgICAgdGhpcy5pbiA9IHRoaXMuY3R4LmNyZWF0ZUNoYW5uZWxTcGxpdHRlcig0KTtcbiAgICAgICAgdGhpcy5vdXQgPSB0aGlzLmN0eC5jcmVhdGVDaGFubmVsTWVyZ2VyKDQpO1xuICAgICAgICAvLyBJbml0aWFsaXplIGFuYWx5emVyIGJ1ZmZlcnNcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCA0OyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMuYW5hbHlzZXJzW2ldID0gdGhpcy5jdHguY3JlYXRlQW5hbHlzZXIoKTtcbiAgICAgICAgICAgIHRoaXMuYW5hbHlzZXJzW2ldLmZmdFNpemUgPSB0aGlzLmZmdFNpemU7XG4gICAgICAgICAgICB0aGlzLmFuYWx5c2Vyc1tpXS5zbW9vdGhpbmdUaW1lQ29uc3RhbnQgPSAwO1xuICAgICAgICAgICAgdGhpcy5hbmFsQnVmZmVyc1tpXSA9IG5ldyBGbG9hdDMyQXJyYXkodGhpcy5mZnRTaXplKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBDcmVhdGUgY29ubmVjdGlvbnNcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCA0OyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMuaW4uY29ubmVjdCh0aGlzLm91dCwgaSwgaSk7XG4gICAgICAgICAgICB0aGlzLmluLmNvbm5lY3QodGhpcy5hbmFseXNlcnNbaV0sIGksIDApO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5pbml0aWFsaXplZCA9IHRydWU7XG4gICAgfVxuXG4gICAgdXBkYXRlQnVmZmVycygpIHtcbiAgICAgICAgLy8gR2V0IGxhdGVzdCB0aW1lLWRvbWFpbiBkYXRhXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgNDsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLmFuYWx5c2Vyc1tpXS5nZXRGbG9hdFRpbWVEb21haW5EYXRhKHRoaXMuYW5hbEJ1ZmZlcnNbaV0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgY29tcHV0ZUludGVuc2l0eSgpIHtcbiAgICAgICAgLy8gQ29tcHV0ZSBjb3JyZWxhdGlvbnMgYW5kIGVuZXJnaWVzIG9mIGNoYW5uZWxzXG4gICAgICAgIHZhciBpWCA9IDA7XG4gICAgICAgIHZhciBpWSA9IDA7XG4gICAgICAgIHZhciBpWiA9IDA7XG4gICAgICAgIHZhciBXVyA9IDA7XG4gICAgICAgIHZhciBYWCA9IDA7XG4gICAgICAgIHZhciBZWSA9IDA7XG4gICAgICAgIHZhciBaWiA9IDA7XG4gICAgICAgIHZhciBJLCBJX25vcm0sIEUsIFBzaSwgYXppbSwgZWxldjtcbiAgICAgICAgLy8gQWNjdW11bGF0b3JzIGZvciBjb3JyZWxhdGlvbnMgYW5kIGVuZXJnaWVzXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5mZnRTaXplOyBpKyspIHtcblxuICAgICAgICAgICAgaVggPSBpWCArIE1hdGguc3FydCgyKSAqIHRoaXMuYW5hbEJ1ZmZlcnNbMF1baV0gKiB0aGlzLmFuYWxCdWZmZXJzWzFdW2ldO1xuICAgICAgICAgICAgaVkgPSBpWSArIE1hdGguc3FydCgyKSAqIHRoaXMuYW5hbEJ1ZmZlcnNbMF1baV0gKiB0aGlzLmFuYWxCdWZmZXJzWzJdW2ldO1xuICAgICAgICAgICAgaVogPSBpWiArIE1hdGguc3FydCgyKSAqIHRoaXMuYW5hbEJ1ZmZlcnNbMF1baV0gKiB0aGlzLmFuYWxCdWZmZXJzWzNdW2ldO1xuICAgICAgICAgICAgV1cgPSBXVyArIDIgKiB0aGlzLmFuYWxCdWZmZXJzWzBdW2ldICogdGhpcy5hbmFsQnVmZmVyc1swXVtpXTtcbiAgICAgICAgICAgIFhYID0gWFggKyB0aGlzLmFuYWxCdWZmZXJzWzFdW2ldICogdGhpcy5hbmFsQnVmZmVyc1sxXVtpXTtcbiAgICAgICAgICAgIFlZID0gWVkgKyB0aGlzLmFuYWxCdWZmZXJzWzJdW2ldICogdGhpcy5hbmFsQnVmZmVyc1syXVtpXTtcbiAgICAgICAgICAgIFpaID0gWlogKyB0aGlzLmFuYWxCdWZmZXJzWzNdW2ldICogdGhpcy5hbmFsQnVmZmVyc1szXVtpXTtcbiAgICAgICAgfVxuICAgICAgICBJID0gW2lYLCBpWSwgaVpdOyAvLyBpbnRlbnNpdHlcbiAgICAgICAgSV9ub3JtID0gTWF0aC5zcXJ0KElbMF0gKiBJWzBdICsgSVsxXSAqIElbMV0gKyBJWzJdICogSVsyXSk7IC8vIGludGVuc2l0eSBtYWduaXR1ZGVcbiAgICAgICAgRSA9IChXVyArIFhYICsgWVkgKyBaWikgLyAyOyAvLyBlbmVyZ3lcbiAgICAgICAgUHNpID0gMSAtIElfbm9ybSAvIChFICsgMTBlLTgpOyAvLyBkaWZmdXNlbmVzc1xuICAgICAgICBhemltID0gTWF0aC5hdGFuMihpWSwgaVgpICogMTgwIC8gTWF0aC5QSTtcbiAgICAgICAgZWxldiA9IE1hdGguYXRhbjIoSVsyXSwgTWF0aC5zcXJ0KElbMF0gKiBJWzBdICsgSVsxXSAqIElbMV0pKSAqIDE4MCAvIE1hdGguUEk7XG5cbiAgICAgICAgdmFyIHBhcmFtcyA9IFthemltLCBlbGV2LCBQc2ksIEVdO1xuICAgICAgICByZXR1cm4gcGFyYW1zO1xuICAgIH1cbn1cbiJdfQ==