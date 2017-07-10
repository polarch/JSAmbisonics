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

var rmsAnalyser = function () {
    function rmsAnalyser(audioCtx, order) {
        (0, _classCallCheck3.default)(this, rmsAnalyser);


        this.ctx = audioCtx;
        this.order = order;
        this.nCh = (order + 1) * (order + 1);
        this.fftSize = 2048;
        // Input and output nodes
        this.in = this.ctx.createChannelSplitter(this.nCh);
        this.out = this.ctx.createChannelMerger(this.nCh);
        // Initialize analyzer buffers
        this.analysers = new Array(this.nCh);
        this.analBuffers = new Array(this.nCh);
        for (var i = 0; i < this.nCh; i++) {
            this.analysers[i] = this.ctx.createAnalyser();
            this.analysers[i].fftSize = this.fftSize;
            this.analysers[i].smoothingTimeConstant = 0;
            this.analBuffers[i] = new Float32Array(this.fftSize);
            // Create connections
            this.in.connect(this.analysers[i], i, 0);
            this.analysers[i].connect(this.out, 0, i);
        }
    }

    (0, _createClass3.default)(rmsAnalyser, [{
        key: 'updateBuffers',
        value: function updateBuffers() {
            // Get latest time-domain data
            for (var i = 0; i < this.nCh; i++) {
                this.analysers[i].getFloatTimeDomainData(this.analBuffers[i]);
            }
        }
    }, {
        key: 'computeRMS',
        value: function computeRMS() {

            var rms_values = new Array(this.nCh);
            rms_values.fill(0);
            // Accumulators for energies
            for (var i = 0; i < this.nCh; i++) {
                for (var n = 0; n < this.fftSize; n++) {
                    rms_values[i] = rms_values[i] + this.analBuffers[i][n] * this.analBuffers[i][n];
                }
                rms_values[i] = Math.sqrt(rms_values[i] / this.fftSize);
            }
            return rms_values;
        }
    }]);
    return rmsAnalyser;
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
/* RMS AMPLITUDE ANALYZER */
//////////////////////////////////////////

// for Safari support where audioContext.Analyser.getFloatTimeDomainData is not defined for now


exports.default = rmsAnalyser;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFtYmktcm1zQW5hbHlzZXIuanMiXSwibmFtZXMiOlsicm1zQW5hbHlzZXIiLCJhdWRpb0N0eCIsIm9yZGVyIiwiY3R4IiwibkNoIiwiZmZ0U2l6ZSIsImluIiwiY3JlYXRlQ2hhbm5lbFNwbGl0dGVyIiwib3V0IiwiY3JlYXRlQ2hhbm5lbE1lcmdlciIsImFuYWx5c2VycyIsIkFycmF5IiwiYW5hbEJ1ZmZlcnMiLCJpIiwiY3JlYXRlQW5hbHlzZXIiLCJzbW9vdGhpbmdUaW1lQ29uc3RhbnQiLCJGbG9hdDMyQXJyYXkiLCJjb25uZWN0IiwiZ2V0RmxvYXRUaW1lRG9tYWluRGF0YSIsInJtc192YWx1ZXMiLCJmaWxsIiwibiIsIk1hdGgiLCJzcXJ0Il0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7OztBQWtCQTs7OztJQUVxQkEsVztBQUNqQix5QkFBWUMsUUFBWixFQUFzQkMsS0FBdEIsRUFBNkI7QUFBQTs7O0FBRXpCLGFBQUtDLEdBQUwsR0FBV0YsUUFBWDtBQUNBLGFBQUtDLEtBQUwsR0FBYUEsS0FBYjtBQUNBLGFBQUtFLEdBQUwsR0FBVyxDQUFDRixRQUFRLENBQVQsS0FBZUEsUUFBUSxDQUF2QixDQUFYO0FBQ0EsYUFBS0csT0FBTCxHQUFlLElBQWY7QUFDQTtBQUNBLGFBQUtDLEVBQUwsR0FBVSxLQUFLSCxHQUFMLENBQVNJLHFCQUFULENBQStCLEtBQUtILEdBQXBDLENBQVY7QUFDQSxhQUFLSSxHQUFMLEdBQVcsS0FBS0wsR0FBTCxDQUFTTSxtQkFBVCxDQUE2QixLQUFLTCxHQUFsQyxDQUFYO0FBQ0E7QUFDQSxhQUFLTSxTQUFMLEdBQWlCLElBQUlDLEtBQUosQ0FBVSxLQUFLUCxHQUFmLENBQWpCO0FBQ0EsYUFBS1EsV0FBTCxHQUFtQixJQUFJRCxLQUFKLENBQVUsS0FBS1AsR0FBZixDQUFuQjtBQUNBLGFBQUssSUFBSVMsSUFBSSxDQUFiLEVBQWdCQSxJQUFJLEtBQUtULEdBQXpCLEVBQThCUyxHQUE5QixFQUFtQztBQUMvQixpQkFBS0gsU0FBTCxDQUFlRyxDQUFmLElBQW9CLEtBQUtWLEdBQUwsQ0FBU1csY0FBVCxFQUFwQjtBQUNBLGlCQUFLSixTQUFMLENBQWVHLENBQWYsRUFBa0JSLE9BQWxCLEdBQTRCLEtBQUtBLE9BQWpDO0FBQ0EsaUJBQUtLLFNBQUwsQ0FBZUcsQ0FBZixFQUFrQkUscUJBQWxCLEdBQTBDLENBQTFDO0FBQ0EsaUJBQUtILFdBQUwsQ0FBaUJDLENBQWpCLElBQXNCLElBQUlHLFlBQUosQ0FBaUIsS0FBS1gsT0FBdEIsQ0FBdEI7QUFDQTtBQUNBLGlCQUFLQyxFQUFMLENBQVFXLE9BQVIsQ0FBZ0IsS0FBS1AsU0FBTCxDQUFlRyxDQUFmLENBQWhCLEVBQW1DQSxDQUFuQyxFQUFzQyxDQUF0QztBQUNBLGlCQUFLSCxTQUFMLENBQWVHLENBQWYsRUFBa0JJLE9BQWxCLENBQTBCLEtBQUtULEdBQS9CLEVBQW9DLENBQXBDLEVBQXVDSyxDQUF2QztBQUNIO0FBRUo7Ozs7d0NBRWU7QUFDWjtBQUNBLGlCQUFLLElBQUlBLElBQUksQ0FBYixFQUFnQkEsSUFBSSxLQUFLVCxHQUF6QixFQUE4QlMsR0FBOUIsRUFBbUM7QUFDL0IscUJBQUtILFNBQUwsQ0FBZUcsQ0FBZixFQUFrQkssc0JBQWxCLENBQXlDLEtBQUtOLFdBQUwsQ0FBaUJDLENBQWpCLENBQXpDO0FBQ0g7QUFDSjs7O3FDQUVZOztBQUVULGdCQUFJTSxhQUFhLElBQUlSLEtBQUosQ0FBVSxLQUFLUCxHQUFmLENBQWpCO0FBQ0FlLHVCQUFXQyxJQUFYLENBQWdCLENBQWhCO0FBQ0E7QUFDQSxpQkFBSyxJQUFJUCxJQUFJLENBQWIsRUFBZ0JBLElBQUksS0FBS1QsR0FBekIsRUFBOEJTLEdBQTlCLEVBQW1DO0FBQy9CLHFCQUFLLElBQUlRLElBQUksQ0FBYixFQUFnQkEsSUFBSSxLQUFLaEIsT0FBekIsRUFBa0NnQixHQUFsQyxFQUF1QztBQUNuQ0YsK0JBQVdOLENBQVgsSUFBZ0JNLFdBQVdOLENBQVgsSUFBZ0IsS0FBS0QsV0FBTCxDQUFpQkMsQ0FBakIsRUFBb0JRLENBQXBCLElBQXlCLEtBQUtULFdBQUwsQ0FBaUJDLENBQWpCLEVBQW9CUSxDQUFwQixDQUF6RDtBQUNIO0FBQ0RGLDJCQUFXTixDQUFYLElBQWdCUyxLQUFLQyxJQUFMLENBQVdKLFdBQVdOLENBQVgsSUFBYyxLQUFLUixPQUE5QixDQUFoQjtBQUNIO0FBQ0QsbUJBQU9jLFVBQVA7QUFDSDs7O0tBaEVMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7OztrQkFHcUJuQixXIiwiZmlsZSI6ImFtYmktcm1zQW5hbHlzZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gIEFyY2hvbnRpcyBQb2xpdGlzXG4vLyAgYXJjaG9udGlzLnBvbGl0aXNAYWFsdG8uZmlcbi8vICBEYXZpZCBQb2lyaWVyLVF1aW5vdFxuLy8gIGRhdmlwb2lyQGlyY2FtLmZyXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy9cbi8vICBKU0FtYmlzb25pY3MgYSBKYXZhU2NyaXB0IGxpYnJhcnkgZm9yIGhpZ2hlci1vcmRlciBBbWJpc29uaWNzXG4vLyAgVGhlIGxpYnJhcnkgaW1wbGVtZW50cyBXZWIgQXVkaW8gYmxvY2tzIHRoYXQgcGVyZm9ybVxuLy8gIHR5cGljYWwgYW1iaXNvbmljIHByb2Nlc3Npbmcgb3BlcmF0aW9ucyBvbiBhdWRpbyBzaWduYWxzLlxuLy9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLyogUk1TIEFNUExJVFVERSBBTkFMWVpFUiAqL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbi8vIGZvciBTYWZhcmkgc3VwcG9ydCB3aGVyZSBhdWRpb0NvbnRleHQuQW5hbHlzZXIuZ2V0RmxvYXRUaW1lRG9tYWluRGF0YSBpcyBub3QgZGVmaW5lZCBmb3Igbm93XG5pbXBvcnQgJ2dldC1mbG9hdC10aW1lLWRvbWFpbi1kYXRhJztcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3Mgcm1zQW5hbHlzZXIge1xuICAgIGNvbnN0cnVjdG9yKGF1ZGlvQ3R4LCBvcmRlcikge1xuXG4gICAgICAgIHRoaXMuY3R4ID0gYXVkaW9DdHg7XG4gICAgICAgIHRoaXMub3JkZXIgPSBvcmRlcjtcbiAgICAgICAgdGhpcy5uQ2ggPSAob3JkZXIgKyAxKSAqIChvcmRlciArIDEpO1xuICAgICAgICB0aGlzLmZmdFNpemUgPSAyMDQ4O1xuICAgICAgICAvLyBJbnB1dCBhbmQgb3V0cHV0IG5vZGVzXG4gICAgICAgIHRoaXMuaW4gPSB0aGlzLmN0eC5jcmVhdGVDaGFubmVsU3BsaXR0ZXIodGhpcy5uQ2gpO1xuICAgICAgICB0aGlzLm91dCA9IHRoaXMuY3R4LmNyZWF0ZUNoYW5uZWxNZXJnZXIodGhpcy5uQ2gpO1xuICAgICAgICAvLyBJbml0aWFsaXplIGFuYWx5emVyIGJ1ZmZlcnNcbiAgICAgICAgdGhpcy5hbmFseXNlcnMgPSBuZXcgQXJyYXkodGhpcy5uQ2gpO1xuICAgICAgICB0aGlzLmFuYWxCdWZmZXJzID0gbmV3IEFycmF5KHRoaXMubkNoKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm5DaDsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLmFuYWx5c2Vyc1tpXSA9IHRoaXMuY3R4LmNyZWF0ZUFuYWx5c2VyKCk7XG4gICAgICAgICAgICB0aGlzLmFuYWx5c2Vyc1tpXS5mZnRTaXplID0gdGhpcy5mZnRTaXplO1xuICAgICAgICAgICAgdGhpcy5hbmFseXNlcnNbaV0uc21vb3RoaW5nVGltZUNvbnN0YW50ID0gMDtcbiAgICAgICAgICAgIHRoaXMuYW5hbEJ1ZmZlcnNbaV0gPSBuZXcgRmxvYXQzMkFycmF5KHRoaXMuZmZ0U2l6ZSk7XG4gICAgICAgICAgICAvLyBDcmVhdGUgY29ubmVjdGlvbnNcbiAgICAgICAgICAgIHRoaXMuaW4uY29ubmVjdCh0aGlzLmFuYWx5c2Vyc1tpXSwgaSwgMCk7XG4gICAgICAgICAgICB0aGlzLmFuYWx5c2Vyc1tpXS5jb25uZWN0KHRoaXMub3V0LCAwLCBpKTtcbiAgICAgICAgfVxuXG4gICAgfVxuXG4gICAgdXBkYXRlQnVmZmVycygpIHtcbiAgICAgICAgLy8gR2V0IGxhdGVzdCB0aW1lLWRvbWFpbiBkYXRhXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5uQ2g7IGkrKykge1xuICAgICAgICAgICAgdGhpcy5hbmFseXNlcnNbaV0uZ2V0RmxvYXRUaW1lRG9tYWluRGF0YSh0aGlzLmFuYWxCdWZmZXJzW2ldKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGNvbXB1dGVSTVMoKSB7XG4gICAgICAgIFxuICAgICAgICB2YXIgcm1zX3ZhbHVlcyA9IG5ldyBBcnJheSh0aGlzLm5DaCk7XG4gICAgICAgIHJtc192YWx1ZXMuZmlsbCgwKTtcbiAgICAgICAgLy8gQWNjdW11bGF0b3JzIGZvciBlbmVyZ2llc1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubkNoOyBpKyspIHtcbiAgICAgICAgICAgIGZvciAobGV0IG4gPSAwOyBuIDwgdGhpcy5mZnRTaXplOyBuKyspIHtcbiAgICAgICAgICAgICAgICBybXNfdmFsdWVzW2ldID0gcm1zX3ZhbHVlc1tpXSArIHRoaXMuYW5hbEJ1ZmZlcnNbaV1bbl0gKiB0aGlzLmFuYWxCdWZmZXJzW2ldW25dO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcm1zX3ZhbHVlc1tpXSA9IE1hdGguc3FydCggcm1zX3ZhbHVlc1tpXS90aGlzLmZmdFNpemUgKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcm1zX3ZhbHVlcztcbiAgICB9XG59XG4iXX0=