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
//# sourceMappingURL=data:application/json;base64,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QXpELEdBQStELEtBQUssRUFBM0U7O0FBRUEsZ0JBQUksU0FBUyxDQUFDLEdBQUQsRUFBTSxJQUFOLEVBQVksR0FBWixFQUFpQixDQUFqQixDQUFiO0FBQ0EsbUJBQU8sTUFBUDtBQUNIOzs7OztrQkFoRWdCLGdCIiwiZmlsZSI6ImZvYS1hbmFseXNlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyAgQXJjaG9udGlzIFBvbGl0aXNcbi8vICBhcmNob250aXMucG9saXRpc0BhYWx0by5maVxuLy8gIERhdmlkIFBvaXJpZXItUXVpbm90XG4vLyAgZGF2aXBvaXJAaXJjYW0uZnJcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vL1xuLy8gIFdlYkF1ZGlvX0hPQSBhIEphdmFTY3JpcHQgbGlicmFyeSBmb3IgaGlnaGVyLW9yZGVyIEFtYmlzb25pY3Ncbi8vICBUaGUgbGlicmFyeSBpbXBsZW1lbnRzIFdlYiBBdWRpbyBibG9ja3MgdGhhdCBwZXJmb3JtXG4vLyAgdHlwaWNhbCBhbWJpc29uaWMgcHJvY2Vzc2luZyBvcGVyYXRpb25zIG9uIGF1ZGlvIHNpZ25hbHMuXG4vL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vKiBCX0ZPUk1BVCBJTlRFTlNJVFkgQU5BTFlaRVIgKi9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBCZm9ybWF0X2FuYWx5c2VyIHtcbiAgICBjb25zdHJ1Y3RvcihhdWRpb0N0eCkge1xuICAgICAgICB0aGlzLmluaXRpYWxpemVkID0gZmFsc2U7XG5cbiAgICAgICAgdGhpcy5jdHggPSBhdWRpb0N0eDtcbiAgICAgICAgdGhpcy5mZnRTaXplID0gMjA0ODtcbiAgICAgICAgdGhpcy5hbmFseXNlcnMgPSBuZXcgQXJyYXkoNCk7XG4gICAgICAgIHRoaXMuYW5hbEJ1ZmZlcnMgPSBuZXcgQXJyYXkoNCk7XG4gICAgICAgIC8vIElucHV0IGFuZCBvdXRwdXQgbm9kZXNcbiAgICAgICAgdGhpcy5pbiA9IHRoaXMuY3R4LmNyZWF0ZUNoYW5uZWxTcGxpdHRlcig0KTtcbiAgICAgICAgdGhpcy5vdXQgPSB0aGlzLmN0eC5jcmVhdGVDaGFubmVsTWVyZ2VyKDQpO1xuICAgICAgICAvLyBJbml0aWFsaXplIGFuYWx5emVyIGJ1ZmZlcnNcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCA0OyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMuYW5hbHlzZXJzW2ldID0gdGhpcy5jdHguY3JlYXRlQW5hbHlzZXIoKTtcbiAgICAgICAgICAgIHRoaXMuYW5hbHlzZXJzW2ldLmZmdFNpemUgPSB0aGlzLmZmdFNpemU7XG4gICAgICAgICAgICB0aGlzLmFuYWx5c2Vyc1tpXS5zbW9vdGhpbmdUaW1lQ29uc3RhbnQgPSAwO1xuICAgICAgICAgICAgdGhpcy5hbmFsQnVmZmVyc1tpXSA9IG5ldyBGbG9hdDMyQXJyYXkodGhpcy5mZnRTaXplKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBDcmVhdGUgY29ubmVjdGlvbnNcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCA0OyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMuaW4uY29ubmVjdCh0aGlzLm91dCwgaSwgaSk7XG4gICAgICAgICAgICB0aGlzLmluLmNvbm5lY3QodGhpcy5hbmFseXNlcnNbaV0sIGksIDApO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5pbml0aWFsaXplZCA9IHRydWU7XG4gICAgfVxuXG4gICAgdXBkYXRlQnVmZmVycygpIHtcbiAgICAgICAgLy8gR2V0IGxhdGVzdCB0aW1lLWRvbWFpbiBkYXRhXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgNDsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLmFuYWx5c2Vyc1tpXS5nZXRGbG9hdFRpbWVEb21haW5EYXRhKHRoaXMuYW5hbEJ1ZmZlcnNbaV0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgY29tcHV0ZUludGVuc2l0eSgpIHtcbiAgICAgICAgLy8gQ29tcHV0ZSBjb3JyZWxhdGlvbnMgYW5kIGVuZXJnaWVzIG9mIGNoYW5uZWxzXG4gICAgICAgIHZhciBpWCA9IDA7XG4gICAgICAgIHZhciBpWSA9IDA7XG4gICAgICAgIHZhciBpWiA9IDA7XG4gICAgICAgIHZhciBXVyA9IDA7XG4gICAgICAgIHZhciBYWCA9IDA7XG4gICAgICAgIHZhciBZWSA9IDA7XG4gICAgICAgIHZhciBaWiA9IDA7XG4gICAgICAgIHZhciBJLCBJX25vcm0sIEUsIFBzaSwgYXppLCBlbGV2O1xuICAgICAgICAvLyBBY2N1bXVsYXRvcnMgZm9yIGNvcnJlbGF0aW9ucyBhbmQgZW5lcmdpZXNcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmZmdFNpemU7IGkrKykge1xuXG4gICAgICAgICAgICBpWCA9IGlYICsgTWF0aC5zcXJ0KDIpICogdGhpcy5hbmFsQnVmZmVyc1swXVtpXSAqIHRoaXMuYW5hbEJ1ZmZlcnNbMV1baV07XG4gICAgICAgICAgICBpWSA9IGlZICsgTWF0aC5zcXJ0KDIpICogdGhpcy5hbmFsQnVmZmVyc1swXVtpXSAqIHRoaXMuYW5hbEJ1ZmZlcnNbMl1baV07XG4gICAgICAgICAgICBpWiA9IGlaICsgTWF0aC5zcXJ0KDIpICogdGhpcy5hbmFsQnVmZmVyc1swXVtpXSAqIHRoaXMuYW5hbEJ1ZmZlcnNbM11baV07XG4gICAgICAgICAgICBXVyA9IFdXICsgMiAqIHRoaXMuYW5hbEJ1ZmZlcnNbMF1baV0gKiB0aGlzLmFuYWxCdWZmZXJzWzBdW2ldO1xuICAgICAgICAgICAgWFggPSBYWCArIHRoaXMuYW5hbEJ1ZmZlcnNbMV1baV0gKiB0aGlzLmFuYWxCdWZmZXJzWzFdW2ldO1xuICAgICAgICAgICAgWVkgPSBZWSArIHRoaXMuYW5hbEJ1ZmZlcnNbMl1baV0gKiB0aGlzLmFuYWxCdWZmZXJzWzJdW2ldO1xuICAgICAgICAgICAgWlogPSBaWiArIHRoaXMuYW5hbEJ1ZmZlcnNbM11baV0gKiB0aGlzLmFuYWxCdWZmZXJzWzNdW2ldO1xuICAgICAgICB9XG4gICAgICAgIEkgPSBbaVgsIGlZLCBpWl07IC8vIGludGVuc2l0eVxuICAgICAgICBJX25vcm0gPSBNYXRoLnNxcnQoSVswXSAqIElbMF0gKyBJWzFdICogSVsxXSArIElbMl0gKiBJWzJdKTsgLy8gaW50ZW5zaXR5IG1hZ25pdHVkZVxuICAgICAgICBFID0gKFdXICsgWFggKyBZWSArIFpaKSAvIDI7IC8vIGVuZXJneVxuICAgICAgICBQc2kgPSAxIC0gSV9ub3JtIC8gKEUgKyAxMGUtOCk7IC8vIGRpZmZ1c2VuZXNzXG4gICAgICAgIGF6aSA9IE1hdGguYXRhbjIoaVksIGlYKSAqIDE4MCAvIE1hdGguUEk7XG4gICAgICAgIGVsZXYgPSBNYXRoLmF0YW4yKElbMl0sIE1hdGguc3FydChJWzBdICogSVswXSArIElbMV0gKiBJWzFdKSkgKiAxODAgLyBNYXRoLlBJO1xuXG4gICAgICAgIHZhciBwYXJhbXMgPSBbYXppLCBlbGV2LCBQc2ksIEVdO1xuICAgICAgICByZXR1cm4gcGFyYW1zO1xuICAgIH1cbn1cbiJdfQ==