'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _sphericalHarmonicTransform = require('spherical-harmonic-transform');

var jshlib = _interopRequireWildcard(_sphericalHarmonicTransform);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var HOA_encoder = function () {
    function HOA_encoder(audioCtx, order) {
        (0, _classCallCheck3.default)(this, HOA_encoder);


        this.initialized = false;

        this.ctx = audioCtx;
        this.order = order;
        this.nCh = (order + 1) * (order + 1);
        this.azi = 0;
        this.elev = 0;
        this.gains = new Array(this.nCh);
        this.gainNodes = new Array(this.nCh);
        this.in = this.ctx.createGain();
        this.in.channelCountMode = 'explicit';
        this.in.channelCount = 1;
        this.out = this.ctx.createChannelMerger(this.nCh);
        // Initialize encoding gains
        for (var i = 0; i < this.nCh; i++) {
            this.gainNodes[i] = this.ctx.createGain();
            this.gainNodes[i].channelCountMode = 'explicit';
            this.gainNodes[i].channelCount = 1;
        }
        this.updateGains();
        // Make audio connections
        for (var i = 0; i < this.nCh; i++) {
            this.in.connect(this.gainNodes[i]);
            this.gainNodes[i].connect(this.out, 0, i);
        }

        this.initialized = true;
    }

    (0, _createClass3.default)(HOA_encoder, [{
        key: 'updateGains',
        value: function updateGains() {
            var N = this.order;
            var g_enc = jshlib.computeRealSH(N, [[this.azi * Math.PI / 180, this.elev * Math.PI / 180]]);

            for (var i = 0; i < this.nCh; i++) {
                this.gains[i] = g_enc[i][0];
                this.gainNodes[i].gain.value = this.gains[i];
            }
        }
    }]);
    return HOA_encoder;
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

/////////////////
/* HOA ENCODER */
/////////////////

exports.default = HOA_encoder;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFtYmktbW9ub0VuY29kZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7QUFpQkE7O0lBQVksTTs7Ozs7O0lBRVMsVztBQUVqQix5QkFBWSxRQUFaLEVBQXNCLEtBQXRCLEVBQTZCO0FBQUE7OztBQUV6QixhQUFLLFdBQUwsR0FBbUIsS0FBbkI7O0FBRUEsYUFBSyxHQUFMLEdBQVcsUUFBWDtBQUNBLGFBQUssS0FBTCxHQUFhLEtBQWI7QUFDQSxhQUFLLEdBQUwsR0FBVyxDQUFDLFFBQVEsQ0FBVCxLQUFlLFFBQVEsQ0FBdkIsQ0FBWDtBQUNBLGFBQUssR0FBTCxHQUFXLENBQVg7QUFDQSxhQUFLLElBQUwsR0FBWSxDQUFaO0FBQ0EsYUFBSyxLQUFMLEdBQWEsSUFBSSxLQUFKLENBQVUsS0FBSyxHQUFmLENBQWI7QUFDQSxhQUFLLFNBQUwsR0FBaUIsSUFBSSxLQUFKLENBQVUsS0FBSyxHQUFmLENBQWpCO0FBQ0EsYUFBSyxFQUFMLEdBQVUsS0FBSyxHQUFMLENBQVMsVUFBVCxFQUFWO0FBQ0EsYUFBSyxFQUFMLENBQVEsZ0JBQVIsR0FBMkIsVUFBM0I7QUFDQSxhQUFLLEVBQUwsQ0FBUSxZQUFSLEdBQXVCLENBQXZCO0FBQ0EsYUFBSyxHQUFMLEdBQVcsS0FBSyxHQUFMLENBQVMsbUJBQVQsQ0FBNkIsS0FBSyxHQUFsQyxDQUFYOztBQUVBLGFBQUssSUFBSSxJQUFJLENBQWIsRUFBZ0IsSUFBSSxLQUFLLEdBQXpCLEVBQThCLEdBQTlCLEVBQW1DO0FBQy9CLGlCQUFLLFNBQUwsQ0FBZSxDQUFmLElBQW9CLEtBQUssR0FBTCxDQUFTLFVBQVQsRUFBcEI7QUFDQSxpQkFBSyxTQUFMLENBQWUsQ0FBZixFQUFrQixnQkFBbEIsR0FBcUMsVUFBckM7QUFDQSxpQkFBSyxTQUFMLENBQWUsQ0FBZixFQUFrQixZQUFsQixHQUFpQyxDQUFqQztBQUNIO0FBQ0QsYUFBSyxXQUFMOztBQUVBLGFBQUssSUFBSSxJQUFJLENBQWIsRUFBZ0IsSUFBSSxLQUFLLEdBQXpCLEVBQThCLEdBQTlCLEVBQW1DO0FBQy9CLGlCQUFLLEVBQUwsQ0FBUSxPQUFSLENBQWdCLEtBQUssU0FBTCxDQUFlLENBQWYsQ0FBaEI7QUFDQSxpQkFBSyxTQUFMLENBQWUsQ0FBZixFQUFrQixPQUFsQixDQUEwQixLQUFLLEdBQS9CLEVBQW9DLENBQXBDLEVBQXVDLENBQXZDO0FBQ0g7O0FBRUQsYUFBSyxXQUFMLEdBQW1CLElBQW5CO0FBQ0g7Ozs7c0NBRWE7QUFDVixnQkFBSSxJQUFJLEtBQUssS0FBYjtBQUNBLGdCQUFJLFFBQVEsT0FBTyxhQUFQLENBQXFCLENBQXJCLEVBQXdCLENBQ2hDLENBQUMsS0FBSyxHQUFMLEdBQVcsS0FBSyxFQUFoQixHQUFxQixHQUF0QixFQUEyQixLQUFLLElBQUwsR0FBWSxLQUFLLEVBQWpCLEdBQXNCLEdBQWpELENBRGdDLENBQXhCLENBQVo7O0FBSUEsaUJBQUssSUFBSSxJQUFJLENBQWIsRUFBZ0IsSUFBSSxLQUFLLEdBQXpCLEVBQThCLEdBQTlCLEVBQW1DO0FBQy9CLHFCQUFLLEtBQUwsQ0FBVyxDQUFYLElBQWdCLE1BQU0sQ0FBTixFQUFTLENBQVQsQ0FBaEI7QUFDQSxxQkFBSyxTQUFMLENBQWUsQ0FBZixFQUFrQixJQUFsQixDQUF1QixLQUF2QixHQUErQixLQUFLLEtBQUwsQ0FBVyxDQUFYLENBQS9CO0FBQ0g7QUFDSjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7a0JBM0NnQixXIiwiZmlsZSI6ImFtYmktbW9ub0VuY29kZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gIEFyY2hvbnRpcyBQb2xpdGlzXG4vLyAgYXJjaG9udGlzLnBvbGl0aXNAYWFsdG8uZmlcbi8vICBEYXZpZCBQb2lyaWVyLVF1aW5vdFxuLy8gIGRhdmlwb2lyQGlyY2FtLmZyXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy9cbi8vICBXZWJBdWRpb19IT0EgYSBKYXZhU2NyaXB0IGxpYnJhcnkgZm9yIGhpZ2hlci1vcmRlciBBbWJpc29uaWNzXG4vLyAgVGhlIGxpYnJhcnkgaW1wbGVtZW50cyBXZWIgQXVkaW8gYmxvY2tzIHRoYXQgcGVyZm9ybVxuLy8gIHR5cGljYWwgYW1iaXNvbmljIHByb2Nlc3Npbmcgb3BlcmF0aW9ucyBvbiBhdWRpbyBzaWduYWxzLlxuLy9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbi8vLy8vLy8vLy8vLy8vLy8vXG4vKiBIT0EgRU5DT0RFUiAqL1xuLy8vLy8vLy8vLy8vLy8vLy9cblxuaW1wb3J0ICogYXMganNobGliIGZyb20gJ3NwaGVyaWNhbC1oYXJtb25pYy10cmFuc2Zvcm0nO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBIT0FfZW5jb2RlciB7XG5cbiAgICBjb25zdHJ1Y3RvcihhdWRpb0N0eCwgb3JkZXIpIHtcblxuICAgICAgICB0aGlzLmluaXRpYWxpemVkID0gZmFsc2U7XG5cbiAgICAgICAgdGhpcy5jdHggPSBhdWRpb0N0eDtcbiAgICAgICAgdGhpcy5vcmRlciA9IG9yZGVyO1xuICAgICAgICB0aGlzLm5DaCA9IChvcmRlciArIDEpICogKG9yZGVyICsgMSk7XG4gICAgICAgIHRoaXMuYXppID0gMDtcbiAgICAgICAgdGhpcy5lbGV2ID0gMDtcbiAgICAgICAgdGhpcy5nYWlucyA9IG5ldyBBcnJheSh0aGlzLm5DaCk7XG4gICAgICAgIHRoaXMuZ2Fpbk5vZGVzID0gbmV3IEFycmF5KHRoaXMubkNoKTtcbiAgICAgICAgdGhpcy5pbiA9IHRoaXMuY3R4LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgdGhpcy5pbi5jaGFubmVsQ291bnRNb2RlID0gJ2V4cGxpY2l0JztcbiAgICAgICAgdGhpcy5pbi5jaGFubmVsQ291bnQgPSAxO1xuICAgICAgICB0aGlzLm91dCA9IHRoaXMuY3R4LmNyZWF0ZUNoYW5uZWxNZXJnZXIodGhpcy5uQ2gpO1xuICAgICAgICAvLyBJbml0aWFsaXplIGVuY29kaW5nIGdhaW5zXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5uQ2g7IGkrKykge1xuICAgICAgICAgICAgdGhpcy5nYWluTm9kZXNbaV0gPSB0aGlzLmN0eC5jcmVhdGVHYWluKCk7XG4gICAgICAgICAgICB0aGlzLmdhaW5Ob2Rlc1tpXS5jaGFubmVsQ291bnRNb2RlID0gJ2V4cGxpY2l0JztcbiAgICAgICAgICAgIHRoaXMuZ2Fpbk5vZGVzW2ldLmNoYW5uZWxDb3VudCA9IDE7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy51cGRhdGVHYWlucygpO1xuICAgICAgICAvLyBNYWtlIGF1ZGlvIGNvbm5lY3Rpb25zXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5uQ2g7IGkrKykge1xuICAgICAgICAgICAgdGhpcy5pbi5jb25uZWN0KHRoaXMuZ2Fpbk5vZGVzW2ldKTtcbiAgICAgICAgICAgIHRoaXMuZ2Fpbk5vZGVzW2ldLmNvbm5lY3QodGhpcy5vdXQsIDAsIGkpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5pbml0aWFsaXplZCA9IHRydWU7XG4gICAgfVxuXG4gICAgdXBkYXRlR2FpbnMoKSB7XG4gICAgICAgIHZhciBOID0gdGhpcy5vcmRlcjtcbiAgICAgICAgdmFyIGdfZW5jID0ganNobGliLmNvbXB1dGVSZWFsU0goTiwgW1xuICAgICAgICAgICAgW3RoaXMuYXppICogTWF0aC5QSSAvIDE4MCwgdGhpcy5lbGV2ICogTWF0aC5QSSAvIDE4MF1cbiAgICAgICAgXSk7XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm5DaDsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLmdhaW5zW2ldID0gZ19lbmNbaV1bMF07XG4gICAgICAgICAgICB0aGlzLmdhaW5Ob2Rlc1tpXS5nYWluLnZhbHVlID0gdGhpcy5nYWluc1tpXTtcbiAgICAgICAgfVxuICAgIH1cbn1cbiJdfQ==