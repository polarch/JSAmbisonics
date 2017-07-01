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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFtYmktaW50ZW5zaXR5QW5hbHlzZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7QUFrQkE7Ozs7SUFFcUIsaUI7QUFDakIsK0JBQVksUUFBWixFQUFzQjtBQUFBOzs7QUFFbEIsYUFBSyxHQUFMLEdBQVcsUUFBWDtBQUNBLGFBQUssT0FBTCxHQUFlLElBQWY7O0FBRUEsYUFBSyxFQUFMLEdBQVUsS0FBSyxHQUFMLENBQVMscUJBQVQsQ0FBK0IsQ0FBL0IsQ0FBVjtBQUNBLGFBQUssR0FBTCxHQUFXLEtBQUssR0FBTCxDQUFTLG1CQUFULENBQTZCLENBQTdCLENBQVg7O0FBRUEsYUFBSyxLQUFMLEdBQWEsSUFBSSxLQUFKLENBQVUsQ0FBVixDQUFiO0FBQ0EsYUFBSyxJQUFJLElBQUksQ0FBYixFQUFnQixJQUFJLENBQXBCLEVBQXVCLEdBQXZCLEVBQTRCO0FBQ3hCLGlCQUFLLEtBQUwsQ0FBVyxDQUFYLElBQWdCLEtBQUssR0FBTCxDQUFTLFVBQVQsRUFBaEI7QUFDQSxpQkFBSyxLQUFMLENBQVcsQ0FBWCxFQUFjLElBQWQsQ0FBbUIsS0FBbkIsR0FBMkIsSUFBSSxLQUFLLElBQUwsQ0FBVSxDQUFWLENBQS9CO0FBQ0g7O0FBRUQsYUFBSyxTQUFMLEdBQWlCLElBQUksS0FBSixDQUFVLENBQVYsQ0FBakI7QUFDQSxhQUFLLFdBQUwsR0FBbUIsSUFBSSxLQUFKLENBQVUsQ0FBVixDQUFuQjtBQUNBLGFBQUssSUFBSSxDQUFULEVBQVksSUFBSSxDQUFoQixFQUFtQixHQUFuQixFQUF3QjtBQUNwQixpQkFBSyxTQUFMLENBQWUsQ0FBZixJQUFvQixLQUFLLEdBQUwsQ0FBUyxjQUFULEVBQXBCO0FBQ0EsaUJBQUssU0FBTCxDQUFlLENBQWYsRUFBa0IsT0FBbEIsR0FBNEIsS0FBSyxPQUFqQztBQUNBLGlCQUFLLFNBQUwsQ0FBZSxDQUFmLEVBQWtCLHFCQUFsQixHQUEwQyxDQUExQztBQUNBLGlCQUFLLFdBQUwsQ0FBaUIsQ0FB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cEIsQ0FBbkM7QUFDSDtBQUNELGdCQUFJLENBQUMsRUFBRCxFQUFLLEVBQUwsRUFBUyxFQUFULENBQUosQztBQUNBLHFCQUFTLEtBQUssSUFBTCxDQUFVLEVBQUUsQ0FBRixJQUFLLEVBQUUsQ0FBRixDQUFMLEdBQVksRUFBRSxDQUFGLElBQUssRUFBRSxDQUFGLENBQWpCLEdBQXdCLEVBQUUsQ0FBRixJQUFLLEVBQUUsQ0FBRixDQUF2QyxDQUFULEM7QUFDQSxnQkFBSSxDQUFDLEtBQUssRUFBTCxHQUFVLEVBQVYsR0FBZSxFQUFoQixJQUFzQixDQUExQixDO0FBQ0Esa0JBQU0sSUFBSSxVQUFVLElBQUksS0FBZCxDQUFWLEM7QUFDQSxtQkFBTyxLQUFLLEtBQUwsQ0FBVyxFQUFYLEVBQWUsRUFBZixJQUFxQixHQUFyQixHQUEyQixLQUFLLEVBQXZDO0FBQ0EsbUJBQU8sS0FBSyxLQUFMLENBQVcsRUFBRSxDQUFGLENBQVgsRUFBaUIsS0FBSyxJQUFMLENBQVUsRUFBRSxDQUFGLElBQU8sRUFBRSxDQUFGLENBQVAsR0FBYyxFQUFFLENBQUYsSUFBTyxFQUFFLENBQUYsQ0FBL0IsQ0FBakIsSUFBeUQsR0FBekQsR0FBK0QsS0FBSyxFQUEzRTs7QUFFQSxnQkFBSSxTQUFTLENBQUMsSUFBRCxFQUFPLElBQVAsRUFBYSxHQUFiLEVBQWtCLENBQWxCLENBQWI7QUFDQSxtQkFBTyxNQUFQO0FBQ0g7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O2tCQTFFZ0IsaUIiLCJmaWxlIjoiYW1iaS1pbnRlbnNpdHlBbmFseXNlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyAgQXJjaG9udGlzIFBvbGl0aXNcbi8vICBhcmNob250aXMucG9saXRpc0BhYWx0by5maVxuLy8gIERhdmlkIFBvaXJpZXItUXVpbm90XG4vLyAgZGF2aXBvaXJAaXJjYW0uZnJcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vL1xuLy8gIEpTQW1iaXNvbmljcyBhIEphdmFTY3JpcHQgbGlicmFyeSBmb3IgaGlnaGVyLW9yZGVyIEFtYmlzb25pY3Ncbi8vICBUaGUgbGlicmFyeSBpbXBsZW1lbnRzIFdlYiBBdWRpbyBibG9ja3MgdGhhdCBwZXJmb3JtXG4vLyAgdHlwaWNhbCBhbWJpc29uaWMgcHJvY2Vzc2luZyBvcGVyYXRpb25zIG9uIGF1ZGlvIHNpZ25hbHMuXG4vL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vKiBQUkVTU1VSRS1WRUxPQ0lUWSBJTlRFTlNJVFkgQU5BTFlaRVIgKi9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4vLyBmb3IgU2FmYXJpIHN1cHBvcnQgd2hlcmUgYXVkaW9Db250ZXh0LkFuYWx5c2VyLmdldEZsb2F0VGltZURvbWFpbkRhdGEgaXMgbm90IGRlZmluZWQgZm9yIG5vd1xuaW1wb3J0ICdnZXQtZmxvYXQtdGltZS1kb21haW4tZGF0YSc7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIGludGVuc2l0eUFuYWx5c2VyIHtcbiAgICBjb25zdHJ1Y3RvcihhdWRpb0N0eCkge1xuXG4gICAgICAgIHRoaXMuY3R4ID0gYXVkaW9DdHg7XG4gICAgICAgIHRoaXMuZmZ0U2l6ZSA9IDIwNDg7XG4gICAgICAgIC8vIElucHV0IGFuZCBvdXRwdXQgbm9kZXNcbiAgICAgICAgdGhpcy5pbiA9IHRoaXMuY3R4LmNyZWF0ZUNoYW5uZWxTcGxpdHRlcig0KTtcbiAgICAgICAgdGhpcy5vdXQgPSB0aGlzLmN0eC5jcmVhdGVDaGFubmVsTWVyZ2VyKDQpO1xuICAgICAgICAvLyBHYWlucyB0byBnbyBmcm9tIEFDTi9OM0QgdG8gcHJlc3N1cmUtdmVsb2NpdHkgKFdYWVopXG4gICAgICAgIHRoaXMuZ2FpbnMgPSBuZXcgQXJyYXkoMyk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgMzsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLmdhaW5zW2ldID0gdGhpcy5jdHguY3JlYXRlR2FpbigpO1xuICAgICAgICAgICAgdGhpcy5nYWluc1tpXS5nYWluLnZhbHVlID0gMSAvIE1hdGguc3FydCgzKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBJbml0aWFsaXplIGFuYWx5emVyIGJ1ZmZlcnNcbiAgICAgICAgdGhpcy5hbmFseXNlcnMgPSBuZXcgQXJyYXkoNCk7XG4gICAgICAgIHRoaXMuYW5hbEJ1ZmZlcnMgPSBuZXcgQXJyYXkoNCk7XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCA0OyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMuYW5hbHlzZXJzW2ldID0gdGhpcy5jdHguY3JlYXRlQW5hbHlzZXIoKTtcbiAgICAgICAgICAgIHRoaXMuYW5hbHlzZXJzW2ldLmZmdFNpemUgPSB0aGlzLmZmdFNpemU7XG4gICAgICAgICAgICB0aGlzLmFuYWx5c2Vyc1tpXS5zbW9vdGhpbmdUaW1lQ29uc3RhbnQgPSAwO1xuICAgICAgICAgICAgdGhpcy5hbmFsQnVmZmVyc1tpXSA9IG5ldyBGbG9hdDMyQXJyYXkodGhpcy5mZnRTaXplKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBDcmVhdGUgY29ubmVjdGlvbnNcbiAgICAgICAgdGhpcy5pbi5jb25uZWN0KHRoaXMub3V0LCAwLCAwKTtcbiAgICAgICAgdGhpcy5pbi5jb25uZWN0KHRoaXMuYW5hbHlzZXJzWzBdLCAwLCAwKTtcbiAgICAgICAgXG4gICAgICAgIHRoaXMuaW4uY29ubmVjdCh0aGlzLmdhaW5zWzFdLCAxLCAwKTtcbiAgICAgICAgdGhpcy5pbi5jb25uZWN0KHRoaXMuZ2FpbnNbMl0sIDIsIDApO1xuICAgICAgICB0aGlzLmluLmNvbm5lY3QodGhpcy5nYWluc1swXSwgMywgMCk7XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCAzOyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMuZ2FpbnNbaV0uY29ubmVjdCh0aGlzLmFuYWx5c2Vyc1tpKzFdLCAwLCAwKTtcbiAgICAgICAgICAgIHRoaXMuZ2FpbnNbaV0uY29ubmVjdCh0aGlzLm91dCwgMCwgaSsxKTtcbiAgICAgICAgfVxuXG4gICAgfVxuXG4gICAgdXBkYXRlQnVmZmVycygpIHtcbiAgICAgICAgLy8gR2V0IGxhdGVzdCB0aW1lLWRvbWFpbiBkYXRhXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgNDsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLmFuYWx5c2Vyc1tpXS5nZXRGbG9hdFRpbWVEb21haW5EYXRhKHRoaXMuYW5hbEJ1ZmZlcnNbaV0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgY29tcHV0ZUludGVuc2l0eSgpIHtcbiAgICAgICAgLy8gQ29tcHV0ZSBjb3JyZWxhdGlvbnMgYW5kIGVuZXJnaWVzIG9mIGNoYW5uZWxzXG4gICAgICAgIHZhciBpWCA9IDA7XG4gICAgICAgIHZhciBpWSA9IDA7XG4gICAgICAgIHZhciBpWiA9IDA7XG4gICAgICAgIHZhciBXVyA9IDA7XG4gICAgICAgIHZhciBYWCA9IDA7XG4gICAgICAgIHZhciBZWSA9IDA7XG4gICAgICAgIHZhciBaWiA9IDA7XG4gICAgICAgIHZhciBJLCBJX25vcm0sIEUsIFBzaSwgYXppbSwgZWxldjtcbiAgICAgICAgLy8gQWNjdW11bGF0b3JzIGZvciBjb3JyZWxhdGlvbnMgYW5kIGVuZXJnaWVzXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5mZnRTaXplOyBpKyspIHtcblxuICAgICAgICAgICAgaVggPSBpWCArIHRoaXMuYW5hbEJ1ZmZlcnNbMF1baV0gKiB0aGlzLmFuYWxCdWZmZXJzWzFdW2ldO1xuICAgICAgICAgICAgaVkgPSBpWSArIHRoaXMuYW5hbEJ1ZmZlcnNbMF1baV0gKiB0aGlzLmFuYWxCdWZmZXJzWzJdW2ldO1xuICAgICAgICAgICAgaVogPSBpWiArIHRoaXMuYW5hbEJ1ZmZlcnNbMF1baV0gKiB0aGlzLmFuYWxCdWZmZXJzWzNdW2ldO1xuICAgICAgICAgICAgV1cgPSBXVyArIHRoaXMuYW5hbEJ1ZmZlcnNbMF1baV0gKiB0aGlzLmFuYWxCdWZmZXJzWzBdW2ldO1xuICAgICAgICAgICAgWFggPSBYWCArIHRoaXMuYW5hbEJ1ZmZlcnNbMV1baV0gKiB0aGlzLmFuYWxCdWZmZXJzWzFdW2ldO1xuICAgICAgICAgICAgWVkgPSBZWSArIHRoaXMuYW5hbEJ1ZmZlcnNbMl1baV0gKiB0aGlzLmFuYWxCdWZmZXJzWzJdW2ldO1xuICAgICAgICAgICAgWlogPSBaWiArIHRoaXMuYW5hbEJ1ZmZlcnNbM11baV0gKiB0aGlzLmFuYWxCdWZmZXJzWzNdW2ldO1xuICAgICAgICB9XG4gICAgICAgIEkgPSBbaVgsIGlZLCBpWl07IC8vIGludGVuc2l0eVxuICAgICAgICBJX25vcm0gPSBNYXRoLnNxcnQoSVswXSpJWzBdICsgSVsxXSpJWzFdICsgSVsyXSpJWzJdKTsgLy8gaW50ZW5zaXR5IG1hZ25pdHVkZVxuICAgICAgICBFID0gKFdXICsgWFggKyBZWSArIFpaKSAvIDI7IC8vIGVuZXJneVxuICAgICAgICBQc2kgPSAxIC0gSV9ub3JtIC8gKEUgKyAxMGUtOCk7IC8vIGRpZmZ1c2VuZXNzXG4gICAgICAgIGF6aW0gPSBNYXRoLmF0YW4yKGlZLCBpWCkgKiAxODAgLyBNYXRoLlBJO1xuICAgICAgICBlbGV2ID0gTWF0aC5hdGFuMihJWzJdLCBNYXRoLnNxcnQoSVswXSAqIElbMF0gKyBJWzFdICogSVsxXSkpICogMTgwIC8gTWF0aC5QSTtcblxuICAgICAgICB2YXIgcGFyYW1zID0gW2F6aW0sIGVsZXYsIFBzaSwgRV07XG4gICAgICAgIHJldHVybiBwYXJhbXM7XG4gICAgfVxufVxuIl19