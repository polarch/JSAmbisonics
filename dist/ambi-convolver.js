'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

////////////////////////////////////////////////////////////////////
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

/////////////////////////////
/* MULTI-CHANNEL CONVOLVER */
/////////////////////////////

var convolver = function () {
    function convolver(audioCtx, order) {
        (0, _classCallCheck3.default)(this, convolver);


        this.initialized = false;

        this.ctx = audioCtx;
        this.order = order;
        this.nCh = (order + 1) * (order + 1);
        this.encFilters = new Array(this.nCh);
        this.encFilterNodes = new Array(this.nCh);
        // input and output nodes
        this.in = this.ctx.createGain();
        this.in.channelCountMode = 'explicit';
        this.in.channelCount = 1;
        this.out = this.ctx.createChannelMerger(this.nCh);
        // convolver nodes
        for (var i = 0; i < this.nCh; i++) {
            this.encFilterNodes[i] = this.ctx.createConvolver();
            this.encFilterNodes[i].normalize = false;
        }
        // create audio connections
        for (var i = 0; i < this.nCh; i++) {
            this.in.connect(this.encFilterNodes[i]);
            this.encFilterNodes[i].connect(this.out, 0, i);
        }

        this.initialized = true;
    }

    (0, _createClass3.default)(convolver, [{
        key: 'updateFilters',
        value: function updateFilters(audioBuffer) {
            // assign filters to convolvers
            for (var i = 0; i < this.nCh; i++) {
                this.encFilters[i] = this.ctx.createBuffer(1, audioBuffer.length, audioBuffer.sampleRate);
                this.encFilters[i].getChannelData(0).set(audioBuffer.getChannelData(i));

                this.encFilterNodes[i].buffer = this.encFilters[i];
            }
        }
    }]);
    return convolver;
}();

exports.default = convolver;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFtYmktY29udm9sdmVyLmpzIl0sIm5hbWVzIjpbImNvbnZvbHZlciIsImF1ZGlvQ3R4Iiwib3JkZXIiLCJpbml0aWFsaXplZCIsImN0eCIsIm5DaCIsImVuY0ZpbHRlcnMiLCJBcnJheSIsImVuY0ZpbHRlck5vZGVzIiwiaW4iLCJjcmVhdGVHYWluIiwiY2hhbm5lbENvdW50TW9kZSIsImNoYW5uZWxDb3VudCIsIm91dCIsImNyZWF0ZUNoYW5uZWxNZXJnZXIiLCJpIiwiY3JlYXRlQ29udm9sdmVyIiwibm9ybWFsaXplIiwiY29ubmVjdCIsImF1ZGlvQnVmZmVyIiwiY3JlYXRlQnVmZmVyIiwibGVuZ3RoIiwic2FtcGxlUmF0ZSIsImdldENoYW5uZWxEYXRhIiwic2V0IiwiYnVmZmVyIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7SUFFcUJBLFM7QUFFakIsdUJBQVlDLFFBQVosRUFBc0JDLEtBQXRCLEVBQTZCO0FBQUE7OztBQUV6QixhQUFLQyxXQUFMLEdBQW1CLEtBQW5COztBQUVBLGFBQUtDLEdBQUwsR0FBV0gsUUFBWDtBQUNBLGFBQUtDLEtBQUwsR0FBYUEsS0FBYjtBQUNBLGFBQUtHLEdBQUwsR0FBVyxDQUFDSCxRQUFRLENBQVQsS0FBZUEsUUFBUSxDQUF2QixDQUFYO0FBQ0EsYUFBS0ksVUFBTCxHQUFrQixJQUFJQyxLQUFKLENBQVUsS0FBS0YsR0FBZixDQUFsQjtBQUNBLGFBQUtHLGNBQUwsR0FBc0IsSUFBSUQsS0FBSixDQUFVLEtBQUtGLEdBQWYsQ0FBdEI7QUFDQTtBQUNBLGFBQUtJLEVBQUwsR0FBVSxLQUFLTCxHQUFMLENBQVNNLFVBQVQsRUFBVjtBQUNBLGFBQUtELEVBQUwsQ0FBUUUsZ0JBQVIsR0FBMkIsVUFBM0I7QUFDQSxhQUFLRixFQUFMLENBQVFHLFlBQVIsR0FBdUIsQ0FBdkI7QUFDQSxhQUFLQyxHQUFMLEdBQVcsS0FBS1QsR0FBTCxDQUFTVSxtQkFBVCxDQUE2QixLQUFLVCxHQUFsQyxDQUFYO0FBQ0E7QUFDQSxhQUFLLElBQUlVLElBQUksQ0FBYixFQUFnQkEsSUFBSSxLQUFLVixHQUF6QixFQUE4QlUsR0FBOUIsRUFBbUM7QUFDL0IsaUJBQUtQLGNBQUwsQ0FBb0JPLENBQXBCLElBQXlCLEtBQUtYLEdBQUwsQ0FBU1ksZUFBVCxFQUF6QjtBQUNBLGlCQUFLUixjQUFMLENBQW9CTyxDQUFwQixFQUF1QkUsU0FBdkIsR0FBbUMsS0FBbkM7QUFDSDtBQUNEO0FBQ0EsYUFBSyxJQUFJRixJQUFJLENBQWIsRUFBZ0JBLElBQUksS0FBS1YsR0FBekIsRUFBOEJVLEdBQTlCLEVBQW1DO0FBQy9CLGlCQUFLTixFQUFMLENBQVFTLE9BQVIsQ0FBZ0IsS0FBS1YsY0FBTCxDQUFvQk8sQ0FBcEIsQ0FBaEI7QUFDQSxpQkFBS1AsY0FBTCxDQUFvQk8sQ0FBcEIsRUFBdUJHLE9BQXZCLENBQStCLEtBQUtMLEdBQXBDLEVBQXlDLENBQXpDLEVBQTRDRSxDQUE1QztBQUNIOztBQUVELGFBQUtaLFdBQUwsR0FBbUIsSUFBbkI7QUFDSDs7OztzQ0FFYWdCLFcsRUFBYTtBQUN2QjtBQUNBLGlCQUFLLElBQUlKLElBQUksQ0FBYixFQUFnQkEsSUFBSSxLQUFLVixHQUF6QixFQUE4QlUsR0FBOUIsRUFBbUM7QUFDL0IscUJBQUtULFVBQUwsQ0FBZ0JTLENBQWhCLElBQXFCLEtBQUtYLEdBQUwsQ0FBU2dCLFlBQVQsQ0FBc0IsQ0FBdEIsRUFBeUJELFlBQVlFLE1BQXJDLEVBQTZDRixZQUFZRyxVQUF6RCxDQUFyQjtBQUNBLHFCQUFLaEIsVUFBTCxDQUFnQlMsQ0FBaEIsRUFBbUJRLGNBQW5CLENBQWtDLENBQWxDLEVBQXFDQyxHQUFyQyxDQUF5Q0wsWUFBWUksY0FBWixDQUEyQlIsQ0FBM0IsQ0FBekM7O0FBRUEscUJBQUtQLGNBQUwsQ0FBb0JPLENBQXBCLEVBQXVCVSxNQUF2QixHQUFnQyxLQUFLbkIsVUFBTCxDQUFnQlMsQ0FBaEIsQ0FBaEM7QUFDSDtBQUNKOzs7OztrQkF0Q2dCZixTIiwiZmlsZSI6ImFtYmktY29udm9sdmVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vICBBcmNob250aXMgUG9saXRpc1xuLy8gIGFyY2hvbnRpcy5wb2xpdGlzQGFhbHRvLmZpXG4vLyAgRGF2aWQgUG9pcmllci1RdWlub3Rcbi8vICBkYXZpcG9pckBpcmNhbS5mclxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vXG4vLyAgSlNBbWJpc29uaWNzIGEgSmF2YVNjcmlwdCBsaWJyYXJ5IGZvciBoaWdoZXItb3JkZXIgQW1iaXNvbmljc1xuLy8gIFRoZSBsaWJyYXJ5IGltcGxlbWVudHMgV2ViIEF1ZGlvIGJsb2NrcyB0aGF0IHBlcmZvcm1cbi8vICB0eXBpY2FsIGFtYmlzb25pYyBwcm9jZXNzaW5nIG9wZXJhdGlvbnMgb24gYXVkaW8gc2lnbmFscy5cbi8vXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLyogTVVMVEktQ0hBTk5FTCBDT05WT0xWRVIgKi9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIGNvbnZvbHZlciB7XG5cbiAgICBjb25zdHJ1Y3RvcihhdWRpb0N0eCwgb3JkZXIpIHtcblxuICAgICAgICB0aGlzLmluaXRpYWxpemVkID0gZmFsc2U7XG5cbiAgICAgICAgdGhpcy5jdHggPSBhdWRpb0N0eDtcbiAgICAgICAgdGhpcy5vcmRlciA9IG9yZGVyO1xuICAgICAgICB0aGlzLm5DaCA9IChvcmRlciArIDEpICogKG9yZGVyICsgMSk7XG4gICAgICAgIHRoaXMuZW5jRmlsdGVycyA9IG5ldyBBcnJheSh0aGlzLm5DaCk7XG4gICAgICAgIHRoaXMuZW5jRmlsdGVyTm9kZXMgPSBuZXcgQXJyYXkodGhpcy5uQ2gpO1xuICAgICAgICAvLyBpbnB1dCBhbmQgb3V0cHV0IG5vZGVzXG4gICAgICAgIHRoaXMuaW4gPSB0aGlzLmN0eC5jcmVhdGVHYWluKCk7XG4gICAgICAgIHRoaXMuaW4uY2hhbm5lbENvdW50TW9kZSA9ICdleHBsaWNpdCc7XG4gICAgICAgIHRoaXMuaW4uY2hhbm5lbENvdW50ID0gMTtcbiAgICAgICAgdGhpcy5vdXQgPSB0aGlzLmN0eC5jcmVhdGVDaGFubmVsTWVyZ2VyKHRoaXMubkNoKTtcbiAgICAgICAgLy8gY29udm9sdmVyIG5vZGVzXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5uQ2g7IGkrKykge1xuICAgICAgICAgICAgdGhpcy5lbmNGaWx0ZXJOb2Rlc1tpXSA9IHRoaXMuY3R4LmNyZWF0ZUNvbnZvbHZlcigpO1xuICAgICAgICAgICAgdGhpcy5lbmNGaWx0ZXJOb2Rlc1tpXS5ub3JtYWxpemUgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICAvLyBjcmVhdGUgYXVkaW8gY29ubmVjdGlvbnNcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm5DaDsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLmluLmNvbm5lY3QodGhpcy5lbmNGaWx0ZXJOb2Rlc1tpXSk7XG4gICAgICAgICAgICB0aGlzLmVuY0ZpbHRlck5vZGVzW2ldLmNvbm5lY3QodGhpcy5vdXQsIDAsIGkpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5pbml0aWFsaXplZCA9IHRydWU7XG4gICAgfVxuXG4gICAgdXBkYXRlRmlsdGVycyhhdWRpb0J1ZmZlcikge1xuICAgICAgICAvLyBhc3NpZ24gZmlsdGVycyB0byBjb252b2x2ZXJzXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5uQ2g7IGkrKykge1xuICAgICAgICAgICAgdGhpcy5lbmNGaWx0ZXJzW2ldID0gdGhpcy5jdHguY3JlYXRlQnVmZmVyKDEsIGF1ZGlvQnVmZmVyLmxlbmd0aCwgYXVkaW9CdWZmZXIuc2FtcGxlUmF0ZSk7XG4gICAgICAgICAgICB0aGlzLmVuY0ZpbHRlcnNbaV0uZ2V0Q2hhbm5lbERhdGEoMCkuc2V0KGF1ZGlvQnVmZmVyLmdldENoYW5uZWxEYXRhKGkpKTtcblxuICAgICAgICAgICAgdGhpcy5lbmNGaWx0ZXJOb2Rlc1tpXS5idWZmZXIgPSB0aGlzLmVuY0ZpbHRlcnNbaV07XG4gICAgICAgIH1cbiAgICB9XG5cblxufVxuIl19