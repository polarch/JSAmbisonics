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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFtYmktcG93ZXJtYXBBbmFseXNlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7OztBQW9CQTs7QUFFQTs7SUFBWSxPOztBQUNaOztJQUFZLE07Ozs7OztBQUVaLElBQUksUUFBUSxRQUFRLFlBQVIsQ0FBWixDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBRXFCLGdCO0FBQ2pCLDhCQUFZLFFBQVosRUFBc0IsS0FBdEIsRUFBNkIsSUFBN0IsRUFBbUM7QUFBQTs7O0FBRS9CLGFBQUssR0FBTCxHQUFXLFFBQVg7QUFDQSxhQUFLLEtBQUwsR0FBYSxLQUFiO0FBQ0EsYUFBSyxHQUFMLEdBQVcsQ0FBQyxRQUFRLENBQVQsS0FBZSxRQUFRLENBQXZCLENBQVg7QUFDQSxhQUFLLE9BQUwsR0FBZSxJQUFmO0FBQ0EsYUFBSyxTQUFMLEdBQWlCLElBQUksS0FBSixDQUFVLEtBQUssR0FBZixDQUFqQjtBQUNBLGFBQUssV0FBTCxHQUFtQixJQUFJLEtBQUosQ0FBVSxLQUFLLEdBQWYsQ0FBbkI7O0FBRUEsYUFBSyxFQUFMLEdBQVUsS0FBSyxHQUFMLENBQVMscUJBQVQsQ0FBK0IsS0FBSyxHQUFwQyxDQUFWO0FBQ0EsYUFBSyxHQUFMLEdBQVcsS0FBSyxHQUFMLENBQVMsbUJBQVQsQ0FBNkIsS0FBSyxHQUFsQyxDQUFYOztBQUVBLGFBQUssSUFBSSxJQUFJLENBQWIsRUFBZ0IsSUFBSSxLQUFLLEdBQXpCLEVBQThCLEdBQTlCLEVBQW1DO0FBQy9CLGlCQUFLLFNBQUwsQ0FBZSxDQUFmLElBQW9CLEtBQUssR0FBTCxDQUFTLGNBQVQsRUFBcEI7QUFDQSxpQkFBSyxTQUFMLENBQWUsQ0FBZixFQUFrQixPQUFsQixHQUE0QixLQUFLLE9BQWpDO0FBQ0EsaUJBQUssU0FBTCxDQUFlLENBQWYsRUFBa0IscUJBQWxCLEdBQTBDLENBQTFDO0FBQ0EsaUJBQUssV0FBTCxDQUFpQixDQUFqQixJQUFzQixJQUFJLFlBQUosQ0FBaUIsS0FBSyxPQUF0QixDQUF0QjtBQUNIOztBQUVELGFBQUssSUFBSSxLQUFJLENBQWIsRUFBZ0IsS0FBSSxLQUFLLEdBQXpCLEVBQThCLElBQTlCLEVBQW1DO0FBQy9CLGlCQUFLLEVBQUwsQ0FBUSxPQUFSLENBQWdCLEtBQUssR0FBckIsRUFBMEIsRUFBMUIsRUFBNkIsRUFBN0I7QUFDQSxpQkFBSyxFQUFMLENBQVEsT0FBUixDQUFnQixLQUFLLFNBQUwsQ0FBZSxFQUFmLENBQWhCLEVBQW1DLEVBQW5DLEVBQXNDLENBQXRDO0FBQ0g7OztBQUdELFlBQUksY0FBYyxNQUFNLFVBQU4sQ0FBaUIsSUFBSSxLQUFyQixDQUFsQjtBQUNBLGFBQUssV0FBTCxHQUFtQixNQUFNLE9BQU4sQ0FBYyxXQUFkLENBQW5COztBQUVBLGFBQUssS0FBTCxHQUFhLE9BQU8sYUFBUCxDQUFxQixLQUFLLEtBQTFCLEVBQWlDLEtBQUssV0FBdEMsQ0FBYjtBQUNBLGFBQUssSUFBTCxHQUFZLElBQVo7Ozs7OztBQU1IOzs7O3dDQUVlOztBQUVaLGlCQUFLLElBQUksSUFBSSxDQUFiLEVBQWdCLElBQUksS0FBSyxHQUF6QixFQUE4QixHQUE5QixFQUFtQztBQUMvQixxQkFBSyxTQUFMLENBQWUsQ0FBZixFQUFrQixzQkFBbEIsQ0FBeUMsS0FBSyxXQUFMLENBQWlCLENBQWpCLENBQXpDO0FBQ0g7QUFDSjs7OzBDQUVpQjs7QUFFZCxnQkFBSSxRQUFRLEtBQUssV0FBTCxDQUFpQixNQUE3Qjs7QUFFQSxnQkFBSSxPQUFPLFFBQVEsR0FBUixDQUFZLFFBQVEsU0FBUixDQUFrQixLQUFLLEtBQXZCLENBQVosRUFBMkMsS0FBSyxXQUFoRCxDQUFYOztBQUVBLGdCQUFJLGNBQWMsSUFBSSxLQUFKLENBQVUsS0FBVixDQUFsQjs7QUFFQSxpQkFBSyxJQUFJLElBQUksQ0FBYixFQUFnQixJQUFJLEtBQXBCLEVBQTJCLEdBQTNCLEVBQWdDO0FBQzVCLHFCQUFLLElBQUksSUFBSSxDQUFiLEVBQWdCLElBQUksS0FBSyxPQUF6QixFQUFrQyxHQUFsQyxFQUF1QztBQUNuQyx3QkFBSSxVQUFVLENBQWQ7QUFDQSw4QkFBVSxVQUFVLEtBQUssQ0FBTCxFQUFRLENBQVIsSUFBYSxLQUFLLENBQUwsRUFBUSxDQUFSLENBQWpDO0FBQ0g7QUFDRCxvQkFBSSxVQUFVLFVBQVEsS0FBSyxPQUEzQjtBQUNBLDRCQUFZLENBQVosSUFBaUIsQ0FBRSxLQUFLLFdBQUwsQ0FBaUIsQ0FBakIsRUFBb0IsQ0FBcEIsQ0FBRixFQUEwQixLQUFLLFdBQUwsQ0FBaUIsQ0FBakIsRUFBb0IsQ0FBcEIsQ0FBMUIsRUFBbUQsT0FBbkQsQ0FBakI7QUFDSDs7QUFFRCxnQkFBSSxLQUFLLElBQUwsSUFBYSxDQUFqQixFQUFvQixPQUFPLFdBQVAsQ0FBcEIsS0FDSyxJQUFJLEtBQUssSUFBTCxJQUFhLENBQWpCLEVBQW9COztBQUVyQixvQkFBSSxjQUFjLE9BQU8sVUFBUCxDQUFrQixJQUFFLEtBQUssS0FBekIsRUFBZ0MsV0FBaEMsQ0FBbEI7QUFDQSx1QkFBTyxXQUFQO0FBQ0g7Ozs7OztBQU1KOzs7OztrQkF6RWdCLGdCIiwiZmlsZSI6ImFtYmktcG93ZXJtYXBBbmFseXNlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyAgQXJjaG9udGlzIFBvbGl0aXNcbi8vICBhcmNob250aXMucG9saXRpc0BhYWx0by5maVxuLy8gIERhdmlkIFBvaXJpZXItUXVpbm90XG4vLyAgZGF2aXBvaXJAaXJjYW0uZnJcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vL1xuLy8gIEpTQW1iaXNvbmljcyBhIEphdmFTY3JpcHQgbGlicmFyeSBmb3IgaGlnaGVyLW9yZGVyIEFtYmlzb25pY3Ncbi8vICBUaGUgbGlicmFyeSBpbXBsZW1lbnRzIFdlYiBBdWRpbyBibG9ja3MgdGhhdCBwZXJmb3JtXG4vLyAgdHlwaWNhbCBhbWJpc29uaWMgcHJvY2Vzc2luZyBvcGVyYXRpb25zIG9uIGF1ZGlvIHNpZ25hbHMuXG4vL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vKiBIT0EgUE9XRVJNQVAgQU5BTFlaRVIgKi9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4vLy8vLy8gTk9UIENPTVBMRVRFRCBZRVQgISEhIC8vLy8vLy9cblxuLy8gZm9yIFNhZmFyaSBzdXBwb3J0IHdoZXJlIGF1ZGlvQ29udGV4dC5BbmFseXNlci5nZXRGbG9hdFRpbWVEb21haW5EYXRhIGlzIG5vdCBkZWZpbmVkIGZvciBub3dcbmltcG9ydCAnZ2V0LWZsb2F0LXRpbWUtZG9tYWluLWRhdGEnO1xuXG5pbXBvcnQgKiBhcyBudW1lcmljIGZyb20gJ251bWVyaWMnO1xuaW1wb3J0ICogYXMganNobGliIGZyb20gJ3NwaGVyaWNhbC1oYXJtb25pYy10cmFuc2Zvcm0nO1xuXG52YXIgdXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzLmpzJyk7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIHBvd2VybWFwQW5hbHlzZXIge1xuICAgIGNvbnN0cnVjdG9yKGF1ZGlvQ3R4LCBvcmRlciwgbW9kZSkge1xuXG4gICAgICAgIHRoaXMuY3R4ID0gYXVkaW9DdHg7XG4gICAgICAgIHRoaXMub3JkZXIgPSBvcmRlcjtcbiAgICAgICAgdGhpcy5uQ2ggPSAob3JkZXIgKyAxKSAqIChvcmRlciArIDEpO1xuICAgICAgICB0aGlzLmZmdFNpemUgPSAyMDQ4O1xuICAgICAgICB0aGlzLmFuYWx5c2VycyA9IG5ldyBBcnJheSh0aGlzLm5DaCk7XG4gICAgICAgIHRoaXMuYW5hbEJ1ZmZlcnMgPSBuZXcgQXJyYXkodGhpcy5uQ2gpO1xuICAgICAgICAvLyBJbnB1dCBhbmQgb3V0cHV0IG5vZGVzXG4gICAgICAgIHRoaXMuaW4gPSB0aGlzLmN0eC5jcmVhdGVDaGFubmVsU3BsaXR0ZXIodGhpcy5uQ2gpO1xuICAgICAgICB0aGlzLm91dCA9IHRoaXMuY3R4LmNyZWF0ZUNoYW5uZWxNZXJnZXIodGhpcy5uQ2gpO1xuICAgICAgICAvLyBJbml0aWFsaXplIGFuYWx5emVyIGJ1ZmZlcnNcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLm5DaDsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLmFuYWx5c2Vyc1tpXSA9IHRoaXMuY3R4LmNyZWF0ZUFuYWx5c2VyKCk7XG4gICAgICAgICAgICB0aGlzLmFuYWx5c2Vyc1tpXS5mZnRTaXplID0gdGhpcy5mZnRTaXplO1xuICAgICAgICAgICAgdGhpcy5hbmFseXNlcnNbaV0uc21vb3RoaW5nVGltZUNvbnN0YW50ID0gMDtcbiAgICAgICAgICAgIHRoaXMuYW5hbEJ1ZmZlcnNbaV0gPSBuZXcgRmxvYXQzMkFycmF5KHRoaXMuZmZ0U2l6ZSk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gQ3JlYXRlIGNvbm5lY3Rpb25zXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5uQ2g7IGkrKykge1xuICAgICAgICAgICAgdGhpcy5pbi5jb25uZWN0KHRoaXMub3V0LCBpLCBpKTtcbiAgICAgICAgICAgIHRoaXMuaW4uY29ubmVjdCh0aGlzLmFuYWx5c2Vyc1tpXSwgaSwgMCk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIEluaXRpYWxpc2UgdC1EZXNpZ24gZm9yIHBvd2VyIG1hcFxuICAgICAgICB2YXIgdGRfZGlyc19kZWcgPSB1dGlscy5nZXRUZGVzaWduKDQgKiBvcmRlcik7XG4gICAgICAgIHRoaXMudGRfZGlyc19yYWQgPSB1dGlscy5kZWcycmFkKHRkX2RpcnNfZGVnKTtcbiAgICAgICAgLy8gU0ggc2FtcGxpbmcgbWF0cml4XG4gICAgICAgIHRoaXMuU0htdHggPSBqc2hsaWIuY29tcHV0ZVJlYWxTSCh0aGlzLm9yZGVyLCB0aGlzLnRkX2RpcnNfcmFkKTtcbiAgICAgICAgdGhpcy5tb2RlID0gbW9kZTtcbi8vICAgICAgICB0aGlzLm5Db2VmZnMgPSAoMip0aGlzLm9yZGVyKzEpKigyKnRoaXMub3JkZXIrMSlcbi8vICAgICAgICB0aGlzLnBvd2VyQ29lZmZzID0gbmV3IEFycmF5KCB0aGlzLm5Db2VmZnMgKTtcbi8vICAgICAgICB0aGlzLnBvd2VyQ29lZmZzLmZpbGwoMCk7XG4vLyAgICAgICAgLy8gU21vb3RoaW5nIGNvZWZmaWNpZW50XG4vLyAgICAgICAgdGhpcy5zbW9vdGhDb2VmZiA9IDAuNTtcbiAgICB9XG5cbiAgICB1cGRhdGVCdWZmZXJzKCkge1xuICAgICAgICAvLyBHZXQgbGF0ZXN0IHRpbWUtZG9tYWluIGRhdGFcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLm5DaDsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLmFuYWx5c2Vyc1tpXS5nZXRGbG9hdFRpbWVEb21haW5EYXRhKHRoaXMuYW5hbEJ1ZmZlcnNbaV0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIFxuICAgIGNvbXB1dGVQb3dlcm1hcCgpIHtcbiAgICAgICAgXG4gICAgICAgIHZhciBuRGlycyA9IHRoaXMudGRfZGlyc19yYWQubGVuZ3RoO1xuICAgICAgICAvLyByZWNvbnN0cnVjdGlvblxuICAgICAgICB2YXIgZGF0YSA9IG51bWVyaWMuZG90KG51bWVyaWMudHJhbnNwb3NlKHRoaXMuU0htdHgpLCB0aGlzLmFuYWxCdWZmZXJzKTtcbiAgICAgICAgLy8gY29tcHV0ZSBkaXJlY3Rpb25hbCBwb3dlclxuICAgICAgICB2YXIgcG93ZXJWYWx1ZXMgPSBuZXcgQXJyYXkobkRpcnMpO1xuICAgICAgICAvLyBBY2N1bXVsYXRvcnMgZm9yIGVuZXJnaWVzXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbkRpcnM7IGkrKykge1xuICAgICAgICAgICAgZm9yIChsZXQgbiA9IDA7IG4gPCB0aGlzLmZmdFNpemU7IG4rKykge1xuICAgICAgICAgICAgICAgIHZhciB0bXBfcHdyID0gMDtcbiAgICAgICAgICAgICAgICB0bXBfcHdyID0gdG1wX3B3ciArIGRhdGFbaV1bbl0gKiBkYXRhW2ldW25dO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIHRtcF9wd3IgPSB0bXBfcHdyL3RoaXMuZmZ0U2l6ZTtcbiAgICAgICAgICAgIHBvd2VyVmFsdWVzW2ldID0gWyB0aGlzLnRkX2RpcnNfcmFkW2ldWzBdLCB0aGlzLnRkX2RpcnNfcmFkW2ldWzFdICwgdG1wX3B3ciBdO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZiAodGhpcy5tb2RlID09IDApIHJldHVybiBwb3dlclZhbHVlcztcbiAgICAgICAgZWxzZSBpZiAodGhpcy5tb2RlID09IDEpIHtcbiAgICAgICAgICAgIC8vIFJlLWVuY29kZSBkaXJlY3Rpb25hbCBlbmVyZ3kgdG8gU0ggY29lZmZpY2llbnRzXG4gICAgICAgICAgICB2YXIgcG93ZXJDb2VmZnMgPSBqc2hsaWIuZm9yd2FyZFNIVCgyKnRoaXMub3JkZXIsIHBvd2VyVmFsdWVzKTtcbiAgICAgICAgICAgIHJldHVybiBwb3dlckNvZWZmcztcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gICAgICAgIC8vIFNtb290aCBjb2VmZmljaWVudHNcbi8vICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubkNvZWZmczsgaSsrKSB0aGlzLnBvd2VyQ29lZmZzW2ldID0gdGhpcy5zbW9vdGhDb2VmZip0aGlzLnBvd2VyQ29lZmZzW2ldICsgKDEtdGhpcy5zbW9vdGhDb2VmZikqcG93ZXJDb2VmZnNbaV07XG4vLyAgICAgICAgXG4vLyAgICAgICAgcmV0dXJuIHRoaXMucG93ZXJDb2VmZnM7XG4gICAgfVxuXG59XG4iXX0=