'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

require('get-float-time-domain-data');

var _numeric = require('numeric');

var numeric = _interopRequireWildcard(_numeric);

var _sphericalHarmonicTransform = require('spherical-harmonic-transform');

var jshlib = _interopRequireWildcard(_sphericalHarmonicTransform);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var utils = require('./utils.js'); ////////////////////////////////////////////////////////////////////
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

/////////////////////////////////
/* HOA POWERMAP ANALYZER */
/////////////////////////////////

////// NOT COMPLETED YET !!! ///////

// for Safari support where audioContext.Analyser.getFloatTimeDomainData is not defined for now

var powermapAnalyser = function () {
    function powermapAnalyser(audioCtx, order, mode) {
        (0, _classCallCheck3.default)(this, powermapAnalyser);


        this.ctx = audioCtx;
        this.order = order;
        this.nCh = (order + 1) * (order + 1);
        this.fftSize = 2048;
        this.analysers = new Array(this.nCh);
        this.analBuffers = new Array(this.nCh);
        // Input and output nodes
        this.in = this.ctx.createChannelSplitter(this.nCh);
        this.out = this.ctx.createChannelMerger(this.nCh);
        // Initialize analyzer buffers
        for (var i = 0; i < this.nCh; i++) {
            this.analysers[i] = this.ctx.createAnalyser();
            this.analysers[i].fftSize = this.fftSize;
            this.analysers[i].smoothingTimeConstant = 0;
            this.analBuffers[i] = new Float32Array(this.fftSize);
        }
        // Create connections
        for (var _i = 0; _i < this.nCh; _i++) {
            this.in.connect(this.out, _i, _i);
            this.in.connect(this.analysers[_i], _i, 0);
        }

        // Initialise t-Design for power map
        var td_dirs_deg = utils.getTdesign(4 * order);
        this.td_dirs_rad = utils.deg2rad(td_dirs_deg);
        // SH sampling matrix
        this.SHmtx = jshlib.computeRealSH(this.order, this.td_dirs_rad);
        this.mode = mode;
        //        this.nCoeffs = (2*this.order+1)*(2*this.order+1)
        //        this.powerCoeffs = new Array( this.nCoeffs );
        //        this.powerCoeffs.fill(0);
        //        // Smoothing coefficient
        //        this.smoothCoeff = 0.5;
    }

    (0, _createClass3.default)(powermapAnalyser, [{
        key: 'updateBuffers',
        value: function updateBuffers() {
            // Get latest time-domain data
            for (var i = 0; i < this.nCh; i++) {
                this.analysers[i].getFloatTimeDomainData(this.analBuffers[i]);
            }
        }
    }, {
        key: 'computePowermap',
        value: function computePowermap() {

            var nDirs = this.td_dirs_rad.length;
            // reconstruction
            var data = numeric.dot(numeric.transpose(this.SHmtx), this.analBuffers);
            // compute directional power
            var powerValues = new Array(nDirs);
            // Accumulators for energies
            for (var i = 0; i < nDirs; i++) {
                for (var n = 0; n < this.fftSize; n++) {
                    var tmp_pwr = 0;
                    tmp_pwr = tmp_pwr + data[i][n] * data[i][n];
                }
                var tmp_pwr = tmp_pwr / this.fftSize;
                powerValues[i] = [this.td_dirs_rad[i][0], this.td_dirs_rad[i][1], tmp_pwr];
            }

            if (this.mode == 0) return powerValues;else if (this.mode == 1) {
                // Re-encode directional energy to SH coefficients
                var powerCoeffs = jshlib.forwardSHT(2 * this.order, powerValues);
                return powerCoeffs;
            }

            //        // Smooth coefficients
            //        for (var i = 0; i < this.nCoeffs; i++) this.powerCoeffs[i] = this.smoothCoeff*this.powerCoeffs[i] + (1-this.smoothCoeff)*powerCoeffs[i];
            //        
            //        return this.powerCoeffs;
        }
    }]);
    return powermapAnalyser;
}();

exports.default = powermapAnalyser;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFtYmktcG93ZXJtYXBBbmFseXNlci5qcyJdLCJuYW1lcyI6WyJudW1lcmljIiwianNobGliIiwidXRpbHMiLCJyZXF1aXJlIiwicG93ZXJtYXBBbmFseXNlciIsImF1ZGlvQ3R4Iiwib3JkZXIiLCJtb2RlIiwiY3R4IiwibkNoIiwiZmZ0U2l6ZSIsImFuYWx5c2VycyIsIkFycmF5IiwiYW5hbEJ1ZmZlcnMiLCJpbiIsImNyZWF0ZUNoYW5uZWxTcGxpdHRlciIsIm91dCIsImNyZWF0ZUNoYW5uZWxNZXJnZXIiLCJpIiwiY3JlYXRlQW5hbHlzZXIiLCJzbW9vdGhpbmdUaW1lQ29uc3RhbnQiLCJGbG9hdDMyQXJyYXkiLCJjb25uZWN0IiwidGRfZGlyc19kZWciLCJnZXRUZGVzaWduIiwidGRfZGlyc19yYWQiLCJkZWcycmFkIiwiU0htdHgiLCJjb21wdXRlUmVhbFNIIiwiZ2V0RmxvYXRUaW1lRG9tYWluRGF0YSIsIm5EaXJzIiwibGVuZ3RoIiwiZGF0YSIsImRvdCIsInRyYW5zcG9zZSIsInBvd2VyVmFsdWVzIiwibiIsInRtcF9wd3IiLCJwb3dlckNvZWZmcyIsImZvcndhcmRTSFQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7O0FBb0JBOztBQUVBOztJQUFZQSxPOztBQUNaOztJQUFZQyxNOzs7Ozs7QUFFWixJQUFJQyxRQUFRQyxRQUFRLFlBQVIsQ0FBWixDLENBekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7O0lBUXFCQyxnQjtBQUNqQiw4QkFBWUMsUUFBWixFQUFzQkMsS0FBdEIsRUFBNkJDLElBQTdCLEVBQW1DO0FBQUE7OztBQUUvQixhQUFLQyxHQUFMLEdBQVdILFFBQVg7QUFDQSxhQUFLQyxLQUFMLEdBQWFBLEtBQWI7QUFDQSxhQUFLRyxHQUFMLEdBQVcsQ0FBQ0gsUUFBUSxDQUFULEtBQWVBLFFBQVEsQ0FBdkIsQ0FBWDtBQUNB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QWlCUCxDQUFqQixFQUFvQixDQUFwQixDQUFGLEVBQTBCLEtBQUtPLFdBQUwsQ0FBaUJQLENBQWpCLEVBQW9CLENBQXBCLENBQTFCLEVBQW1EbUIsT0FBbkQsQ0FBakI7QUFDSDs7QUFFRCxnQkFBSSxLQUFLOUIsSUFBTCxJQUFhLENBQWpCLEVBQW9CLE9BQU80QixXQUFQLENBQXBCLEtBQ0ssSUFBSSxLQUFLNUIsSUFBTCxJQUFhLENBQWpCLEVBQW9CO0FBQ3JCO0FBQ0Esb0JBQUkrQixjQUFjckMsT0FBT3NDLFVBQVAsQ0FBa0IsSUFBRSxLQUFLakMsS0FBekIsRUFBZ0M2QixXQUFoQyxDQUFsQjtBQUNBLHVCQUFPRyxXQUFQO0FBQ0g7O0FBRUQ7QUFDUjtBQUNBO0FBQ0E7QUFDSzs7Ozs7a0JBekVnQmxDLGdCIiwiZmlsZSI6ImFtYmktcG93ZXJtYXBBbmFseXNlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyAgQXJjaG9udGlzIFBvbGl0aXNcbi8vICBhcmNob250aXMucG9saXRpc0BhYWx0by5maVxuLy8gIERhdmlkIFBvaXJpZXItUXVpbm90XG4vLyAgZGF2aXBvaXJAaXJjYW0uZnJcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vL1xuLy8gIEpTQW1iaXNvbmljcyBhIEphdmFTY3JpcHQgbGlicmFyeSBmb3IgaGlnaGVyLW9yZGVyIEFtYmlzb25pY3Ncbi8vICBUaGUgbGlicmFyeSBpbXBsZW1lbnRzIFdlYiBBdWRpbyBibG9ja3MgdGhhdCBwZXJmb3JtXG4vLyAgdHlwaWNhbCBhbWJpc29uaWMgcHJvY2Vzc2luZyBvcGVyYXRpb25zIG9uIGF1ZGlvIHNpZ25hbHMuXG4vL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vKiBIT0EgUE9XRVJNQVAgQU5BTFlaRVIgKi9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4vLy8vLy8gTk9UIENPTVBMRVRFRCBZRVQgISEhIC8vLy8vLy9cblxuLy8gZm9yIFNhZmFyaSBzdXBwb3J0IHdoZXJlIGF1ZGlvQ29udGV4dC5BbmFseXNlci5nZXRGbG9hdFRpbWVEb21haW5EYXRhIGlzIG5vdCBkZWZpbmVkIGZvciBub3dcbmltcG9ydCAnZ2V0LWZsb2F0LXRpbWUtZG9tYWluLWRhdGEnO1xuXG5pbXBvcnQgKiBhcyBudW1lcmljIGZyb20gJ251bWVyaWMnO1xuaW1wb3J0ICogYXMganNobGliIGZyb20gJ3NwaGVyaWNhbC1oYXJtb25pYy10cmFuc2Zvcm0nO1xuXG52YXIgdXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzLmpzJyk7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIHBvd2VybWFwQW5hbHlzZXIge1xuICAgIGNvbnN0cnVjdG9yKGF1ZGlvQ3R4LCBvcmRlciwgbW9kZSkge1xuXG4gICAgICAgIHRoaXMuY3R4ID0gYXVkaW9DdHg7XG4gICAgICAgIHRoaXMub3JkZXIgPSBvcmRlcjtcbiAgICAgICAgdGhpcy5uQ2ggPSAob3JkZXIgKyAxKSAqIChvcmRlciArIDEpO1xuICAgICAgICB0aGlzLmZmdFNpemUgPSAyMDQ4O1xuICAgICAgICB0aGlzLmFuYWx5c2VycyA9IG5ldyBBcnJheSh0aGlzLm5DaCk7XG4gICAgICAgIHRoaXMuYW5hbEJ1ZmZlcnMgPSBuZXcgQXJyYXkodGhpcy5uQ2gpO1xuICAgICAgICAvLyBJbnB1dCBhbmQgb3V0cHV0IG5vZGVzXG4gICAgICAgIHRoaXMuaW4gPSB0aGlzLmN0eC5jcmVhdGVDaGFubmVsU3BsaXR0ZXIodGhpcy5uQ2gpO1xuICAgICAgICB0aGlzLm91dCA9IHRoaXMuY3R4LmNyZWF0ZUNoYW5uZWxNZXJnZXIodGhpcy5uQ2gpO1xuICAgICAgICAvLyBJbml0aWFsaXplIGFuYWx5emVyIGJ1ZmZlcnNcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLm5DaDsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLmFuYWx5c2Vyc1tpXSA9IHRoaXMuY3R4LmNyZWF0ZUFuYWx5c2VyKCk7XG4gICAgICAgICAgICB0aGlzLmFuYWx5c2Vyc1tpXS5mZnRTaXplID0gdGhpcy5mZnRTaXplO1xuICAgICAgICAgICAgdGhpcy5hbmFseXNlcnNbaV0uc21vb3RoaW5nVGltZUNvbnN0YW50ID0gMDtcbiAgICAgICAgICAgIHRoaXMuYW5hbEJ1ZmZlcnNbaV0gPSBuZXcgRmxvYXQzMkFycmF5KHRoaXMuZmZ0U2l6ZSk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gQ3JlYXRlIGNvbm5lY3Rpb25zXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5uQ2g7IGkrKykge1xuICAgICAgICAgICAgdGhpcy5pbi5jb25uZWN0KHRoaXMub3V0LCBpLCBpKTtcbiAgICAgICAgICAgIHRoaXMuaW4uY29ubmVjdCh0aGlzLmFuYWx5c2Vyc1tpXSwgaSwgMCk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIEluaXRpYWxpc2UgdC1EZXNpZ24gZm9yIHBvd2VyIG1hcFxuICAgICAgICB2YXIgdGRfZGlyc19kZWcgPSB1dGlscy5nZXRUZGVzaWduKDQgKiBvcmRlcik7XG4gICAgICAgIHRoaXMudGRfZGlyc19yYWQgPSB1dGlscy5kZWcycmFkKHRkX2RpcnNfZGVnKTtcbiAgICAgICAgLy8gU0ggc2FtcGxpbmcgbWF0cml4XG4gICAgICAgIHRoaXMuU0htdHggPSBqc2hsaWIuY29tcHV0ZVJlYWxTSCh0aGlzLm9yZGVyLCB0aGlzLnRkX2RpcnNfcmFkKTtcbiAgICAgICAgdGhpcy5tb2RlID0gbW9kZTtcbi8vICAgICAgICB0aGlzLm5Db2VmZnMgPSAoMip0aGlzLm9yZGVyKzEpKigyKnRoaXMub3JkZXIrMSlcbi8vICAgICAgICB0aGlzLnBvd2VyQ29lZmZzID0gbmV3IEFycmF5KCB0aGlzLm5Db2VmZnMgKTtcbi8vICAgICAgICB0aGlzLnBvd2VyQ29lZmZzLmZpbGwoMCk7XG4vLyAgICAgICAgLy8gU21vb3RoaW5nIGNvZWZmaWNpZW50XG4vLyAgICAgICAgdGhpcy5zbW9vdGhDb2VmZiA9IDAuNTtcbiAgICB9XG5cbiAgICB1cGRhdGVCdWZmZXJzKCkge1xuICAgICAgICAvLyBHZXQgbGF0ZXN0IHRpbWUtZG9tYWluIGRhdGFcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLm5DaDsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLmFuYWx5c2Vyc1tpXS5nZXRGbG9hdFRpbWVEb21haW5EYXRhKHRoaXMuYW5hbEJ1ZmZlcnNbaV0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIFxuICAgIGNvbXB1dGVQb3dlcm1hcCgpIHtcbiAgICAgICAgXG4gICAgICAgIHZhciBuRGlycyA9IHRoaXMudGRfZGlyc19yYWQubGVuZ3RoO1xuICAgICAgICAvLyByZWNvbnN0cnVjdGlvblxuICAgICAgICB2YXIgZGF0YSA9IG51bWVyaWMuZG90KG51bWVyaWMudHJhbnNwb3NlKHRoaXMuU0htdHgpLCB0aGlzLmFuYWxCdWZmZXJzKTtcbiAgICAgICAgLy8gY29tcHV0ZSBkaXJlY3Rpb25hbCBwb3dlclxuICAgICAgICB2YXIgcG93ZXJWYWx1ZXMgPSBuZXcgQXJyYXkobkRpcnMpO1xuICAgICAgICAvLyBBY2N1bXVsYXRvcnMgZm9yIGVuZXJnaWVzXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbkRpcnM7IGkrKykge1xuICAgICAgICAgICAgZm9yIChsZXQgbiA9IDA7IG4gPCB0aGlzLmZmdFNpemU7IG4rKykge1xuICAgICAgICAgICAgICAgIHZhciB0bXBfcHdyID0gMDtcbiAgICAgICAgICAgICAgICB0bXBfcHdyID0gdG1wX3B3ciArIGRhdGFbaV1bbl0gKiBkYXRhW2ldW25dO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIHRtcF9wd3IgPSB0bXBfcHdyL3RoaXMuZmZ0U2l6ZTtcbiAgICAgICAgICAgIHBvd2VyVmFsdWVzW2ldID0gWyB0aGlzLnRkX2RpcnNfcmFkW2ldWzBdLCB0aGlzLnRkX2RpcnNfcmFkW2ldWzFdICwgdG1wX3B3ciBdO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZiAodGhpcy5tb2RlID09IDApIHJldHVybiBwb3dlclZhbHVlcztcbiAgICAgICAgZWxzZSBpZiAodGhpcy5tb2RlID09IDEpIHtcbiAgICAgICAgICAgIC8vIFJlLWVuY29kZSBkaXJlY3Rpb25hbCBlbmVyZ3kgdG8gU0ggY29lZmZpY2llbnRzXG4gICAgICAgICAgICB2YXIgcG93ZXJDb2VmZnMgPSBqc2hsaWIuZm9yd2FyZFNIVCgyKnRoaXMub3JkZXIsIHBvd2VyVmFsdWVzKTtcbiAgICAgICAgICAgIHJldHVybiBwb3dlckNvZWZmcztcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gICAgICAgIC8vIFNtb290aCBjb2VmZmljaWVudHNcbi8vICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubkNvZWZmczsgaSsrKSB0aGlzLnBvd2VyQ29lZmZzW2ldID0gdGhpcy5zbW9vdGhDb2VmZip0aGlzLnBvd2VyQ29lZmZzW2ldICsgKDEtdGhpcy5zbW9vdGhDb2VmZikqcG93ZXJDb2VmZnNbaV07XG4vLyAgICAgICAgXG4vLyAgICAgICAgcmV0dXJuIHRoaXMucG93ZXJDb2VmZnM7XG4gICAgfVxuXG59XG4iXX0=