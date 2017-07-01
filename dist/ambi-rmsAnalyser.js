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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFtYmktcm1zQW5hbHlzZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7QUFrQkE7Ozs7SUFFcUIsVztBQUNqQix5QkFBWSxRQUFaLEVBQXNCLEtBQXRCLEVBQTZCO0FBQUE7OztBQUV6QixhQUFLLEdBQUwsR0FBVyxRQUFYO0FBQ0EsYUFBSyxLQUFMLEdBQWEsS0FBYjtBQUNBLGFBQUssR0FBTCxHQUFXLENBQUMsUUFBUSxDQUFULEtBQWUsUUFBUSxDQUF2QixDQUFYO0FBQ0EsYUFBSyxPQUFMLEdBQWUsSUFBZjs7QUFFQSxhQUFLLEVBQUwsR0FBVSxLQUFLLEdBQUwsQ0FBUyxxQkFBVCxDQUErQixLQUFLLEdBQXBDLENBQVY7QUFDQSxhQUFLLEdBQUwsR0FBVyxLQUFLLEdBQUwsQ0FBUyxtQkFBVCxDQUE2QixLQUFLLEdBQWxDLENBQVg7O0FBRUEsYUFBSyxTQUFMLEdBQWlCLElBQUksS0FBSixDQUFVLEtBQUssR0FBZixDQUFqQjtBQUNBLGFBQUssV0FBTCxHQUFtQixJQUFJLEtBQUosQ0FBVSxLQUFLLEdBQWYsQ0FBbkI7QUFDQSxhQUFLLElBQUksSUFBSSxDQUFiLEVBQWdCLElBQUksS0FBSyxHQUF6QixFQUE4QixHQUE5QixFQUFtQztBQUMvQixpQkFBSyxTQUFMLENBQWUsQ0FBZixJQUFvQixLQUFLLEdBQUwsQ0FBUyxjQUFULEVBQXBCO0FBQ0EsaUJBQUssU0FBTCxDQUFlLENBQWYsRUFBa0IsT0FBbEIsR0FBNEIsS0FBSyxPQUFqQztBQUNBLGlCQUFLLFNBQUwsQ0FBZSxDQUFmLEVBQWtCLHFCQUFsQixHQUEwQyxDQUExQztBQUNBLGlCQUFLLFdBQUwsQ0FBaUIsQ0FBakIsSUFBc0IsSUFBSSxZQUFKLENBQWlCLEtBQUssT0FBdEIsQ0FBdEI7O0FBRUEsaUJBQUssRUFBTCxDQUFRLE9BQVIsQ0FBZ0IsS0FBSyxTQUFMLENBQWUsQ0FBZixDQUFoQixFQUFtQyxDQUFuQyxFQUFzQyxDQUF0QztBQUNBLGlCQUFLLFNBQUwsQ0FBZSxDQUFmLEVBQWtCLE9BQWxCLENBQTBCLEtBQUssR0FBL0IsRUFBb0MsQ0FBcEMsRUFBdUMsQ0FBdkM7QUFDSDtBQUVKOzs7O3dDQUVlOztBQUVaLGlCQUFLLElBQUksSUFBSSxDQUFiLEVBQWdCLElBQUksS0FBSyxHQUF6QixFQUE4QixHQUE5QixFQUFtQztBQUMvQixxQkFBSyxTQUFMLENBQWUsQ0FBZixFQUFrQixzQkFBbEIsQ0FBeUMsS0FBSyxXQUFMLENBQWlCLENBQWpCLENBQXpDO0FBQ0g7QUFDSjs7O3FDQUVZOztBQUVULGdCQUFJLGFBQWEsSUFBSSxLQUFKLENBQVUsS0FBSyxHQUFmLENBQWpCO0FBQ0EsdUJBQVcsSUFBWCxDQUFnQixDQUFoQjs7QUFFQSxpQkFBSyxJQUFJLElBQUksQ0FBYixFQUFnQixJQUFJLEtBQUssR0FBekIsRUFBOEIsR0FBOUIsRUFBbUM7QUFDL0IscUJBQUssSUFBSSxJQUFJLENBQWIsRUFBZ0IsSUFBSSxLQUFLLE9BQXpCLEVBQWtDLEdBQWxDLEVBQXVDO0FBQ25DLCtCQUFXLENBQVgsSUFBZ0IsV0FBVyxDQUFYLElBQWdCLEtBQUssV0FBTCxDQUFpQixDQUFqQixFQUFvQixDQUFwQixJQUF5QixLQUFLLFdBQUwsQ0FBaUIsQ0FBakIsRUFBb0IsQ0FBcEIsQ0FBekQ7QUFDSDtBQUNELDJCQUFXLENBQVgsSUFBZ0IsS0FBSyxJQUFMLENBQVcsV0FBVyxDQUFYLElBQWMsS0FBSyxPQUE5QixDQUFoQjtBQUNIO0FBQ0QsbUJBQU8sVUFBUDtBQUNIOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztrQkE1Q2dCLFciLCJmaWxlIjoiYW1iaS1ybXNBbmFseXNlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyAgQXJjaG9udGlzIFBvbGl0aXNcbi8vICBhcmNob250aXMucG9saXRpc0BhYWx0by5maVxuLy8gIERhdmlkIFBvaXJpZXItUXVpbm90XG4vLyAgZGF2aXBvaXJAaXJjYW0uZnJcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vL1xuLy8gIEpTQW1iaXNvbmljcyBhIEphdmFTY3JpcHQgbGlicmFyeSBmb3IgaGlnaGVyLW9yZGVyIEFtYmlzb25pY3Ncbi8vICBUaGUgbGlicmFyeSBpbXBsZW1lbnRzIFdlYiBBdWRpbyBibG9ja3MgdGhhdCBwZXJmb3JtXG4vLyAgdHlwaWNhbCBhbWJpc29uaWMgcHJvY2Vzc2luZyBvcGVyYXRpb25zIG9uIGF1ZGlvIHNpZ25hbHMuXG4vL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vKiBSTVMgQU1QTElUVURFIEFOQUxZWkVSICovXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLy8gZm9yIFNhZmFyaSBzdXBwb3J0IHdoZXJlIGF1ZGlvQ29udGV4dC5BbmFseXNlci5nZXRGbG9hdFRpbWVEb21haW5EYXRhIGlzIG5vdCBkZWZpbmVkIGZvciBub3dcbmltcG9ydCAnZ2V0LWZsb2F0LXRpbWUtZG9tYWluLWRhdGEnO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBybXNBbmFseXNlciB7XG4gICAgY29uc3RydWN0b3IoYXVkaW9DdHgsIG9yZGVyKSB7XG5cbiAgICAgICAgdGhpcy5jdHggPSBhdWRpb0N0eDtcbiAgICAgICAgdGhpcy5vcmRlciA9IG9yZGVyO1xuICAgICAgICB0aGlzLm5DaCA9IChvcmRlciArIDEpICogKG9yZGVyICsgMSk7XG4gICAgICAgIHRoaXMuZmZ0U2l6ZSA9IDIwNDg7XG4gICAgICAgIC8vIElucHV0IGFuZCBvdXRwdXQgbm9kZXNcbiAgICAgICAgdGhpcy5pbiA9IHRoaXMuY3R4LmNyZWF0ZUNoYW5uZWxTcGxpdHRlcih0aGlzLm5DaCk7XG4gICAgICAgIHRoaXMub3V0ID0gdGhpcy5jdHguY3JlYXRlQ2hhbm5lbE1lcmdlcih0aGlzLm5DaCk7XG4gICAgICAgIC8vIEluaXRpYWxpemUgYW5hbHl6ZXIgYnVmZmVyc1xuICAgICAgICB0aGlzLmFuYWx5c2VycyA9IG5ldyBBcnJheSh0aGlzLm5DaCk7XG4gICAgICAgIHRoaXMuYW5hbEJ1ZmZlcnMgPSBuZXcgQXJyYXkodGhpcy5uQ2gpO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubkNoOyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMuYW5hbHlzZXJzW2ldID0gdGhpcy5jdHguY3JlYXRlQW5hbHlzZXIoKTtcbiAgICAgICAgICAgIHRoaXMuYW5hbHlzZXJzW2ldLmZmdFNpemUgPSB0aGlzLmZmdFNpemU7XG4gICAgICAgICAgICB0aGlzLmFuYWx5c2Vyc1tpXS5zbW9vdGhpbmdUaW1lQ29uc3RhbnQgPSAwO1xuICAgICAgICAgICAgdGhpcy5hbmFsQnVmZmVyc1tpXSA9IG5ldyBGbG9hdDMyQXJyYXkodGhpcy5mZnRTaXplKTtcbiAgICAgICAgICAgIC8vIENyZWF0ZSBjb25uZWN0aW9uc1xuICAgICAgICAgICAgdGhpcy5pbi5jb25uZWN0KHRoaXMuYW5hbHlzZXJzW2ldLCBpLCAwKTtcbiAgICAgICAgICAgIHRoaXMuYW5hbHlzZXJzW2ldLmNvbm5lY3QodGhpcy5vdXQsIDAsIGkpO1xuICAgICAgICB9XG5cbiAgICB9XG5cbiAgICB1cGRhdGVCdWZmZXJzKCkge1xuICAgICAgICAvLyBHZXQgbGF0ZXN0IHRpbWUtZG9tYWluIGRhdGFcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLm5DaDsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLmFuYWx5c2Vyc1tpXS5nZXRGbG9hdFRpbWVEb21haW5EYXRhKHRoaXMuYW5hbEJ1ZmZlcnNbaV0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgY29tcHV0ZVJNUygpIHtcbiAgICAgICAgXG4gICAgICAgIHZhciBybXNfdmFsdWVzID0gbmV3IEFycmF5KHRoaXMubkNoKTtcbiAgICAgICAgcm1zX3ZhbHVlcy5maWxsKDApO1xuICAgICAgICAvLyBBY2N1bXVsYXRvcnMgZm9yIGVuZXJnaWVzXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5uQ2g7IGkrKykge1xuICAgICAgICAgICAgZm9yIChsZXQgbiA9IDA7IG4gPCB0aGlzLmZmdFNpemU7IG4rKykge1xuICAgICAgICAgICAgICAgIHJtc192YWx1ZXNbaV0gPSBybXNfdmFsdWVzW2ldICsgdGhpcy5hbmFsQnVmZmVyc1tpXVtuXSAqIHRoaXMuYW5hbEJ1ZmZlcnNbaV1bbl07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBybXNfdmFsdWVzW2ldID0gTWF0aC5zcXJ0KCBybXNfdmFsdWVzW2ldL3RoaXMuZmZ0U2l6ZSApO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBybXNfdmFsdWVzO1xuICAgIH1cbn1cbiJdfQ==