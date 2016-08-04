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
//  WebAudio_HOA a JavaScript library for higher-order Ambisonics
//  The library implements Web Audio blocks that perform
//  typical ambisonic processing operations on audio signals.
//
////////////////////////////////////////////////////////////////////

//////////////////////////
/* HOA BINAURAL DECODER */
//////////////////////////

var binDecoder = function () {
    function binDecoder(audioCtx, order) {
        (0, _classCallCheck3.default)(this, binDecoder);


        this.initialized = false;

        this.ctx = audioCtx;
        this.order = order;
        this.nCh = (order + 1) * (order + 1);
        this.decFilters = new Array(this.nCh);
        this.decFilterNodes = new Array(this.nCh);
        // input and output nodes
        this.in = this.ctx.createChannelSplitter(this.nCh);
        this.out = this.ctx.createChannelMerger(2);
        this.out.channelCountMode = 'explicit';
        this.out.channelCount = 1;
        // downmixing gains for left and right ears
        this.gainMid = this.ctx.createGain();
        this.gainSide = this.ctx.createGain();
        this.invertSide = this.ctx.createGain();
        this.gainMid.gain.value = 1;
        this.gainSide.gain.value = 1;
        this.invertSide.gain.value = -1;
        // convolver nodes
        for (var i = 0; i < this.nCh; i++) {
            this.decFilterNodes[i] = this.ctx.createConvolver();
            this.decFilterNodes[i].normalize = false;
        }
        // initialize convolvers to plain cardioids
        this.resetFilters();
        // create audio connections
        for (var i = 0; i < this.nCh; i++) {
            this.in.connect(this.decFilterNodes[i], i, 0);
            var n = Math.floor(Math.sqrt(i));
            var m = i - n * n - n;
            if (m >= 0) this.decFilterNodes[i].connect(this.gainMid);else this.decFilterNodes[i].connect(this.gainSide);
        }
        this.gainMid.connect(this.out, 0, 0);
        this.gainSide.connect(this.out, 0, 0);

        this.gainMid.connect(this.out, 0, 1);
        this.gainSide.connect(this.invertSide, 0, 0);
        this.invertSide.connect(this.out, 0, 1);

        this.initialized = true;
    }

    (0, _createClass3.default)(binDecoder, [{
        key: 'updateFilters',
        value: function updateFilters(audioBuffer) {
            // assign filters to convolvers
            for (var i = 0; i < this.nCh; i++) {
                this.decFilters[i] = this.ctx.createBuffer(1, audioBuffer.length, audioBuffer.sampleRate);
                this.decFilters[i].getChannelData(0).set(audioBuffer.getChannelData(i));

                this.decFilterNodes[i].buffer = this.decFilters[i];
            }
        }
    }, {
        key: 'resetFilters',
        value: function resetFilters() {
            // overwrite decoding filters (plain cardioid virtual microphones)
            var cardGains = new Array(this.nCh);
            cardGains.fill(0);
            cardGains[0] = 0.5;
            cardGains[1] = 0.5 / Math.sqrt(3);
            for (var i = 0; i < this.nCh; i++) {
                // ------------------------------------
                // This works for Chrome and Firefox:
                // this.decFilters[i] = this.ctx.createBuffer(1, 1, this.ctx.sampleRate);
                // this.decFilters[i].getChannelData(0).set([cardGains[i]]);
                // ------------------------------------
                // Safari forces us to use this:
                this.decFilters[i] = this.ctx.createBuffer(1, 64, this.ctx.sampleRate);
                // and will send gorgeous crancky noise bursts for any value below 64
                for (var j = 0; j < 64; j++) {
                    this.decFilters[i].getChannelData(0)[j] = 0.0;
                }
                this.decFilters[i].getChannelData(0)[0] = cardGains[i];
                // ------------------------------------
                this.decFilterNodes[i].buffer = this.decFilters[i];
            }
        }
    }]);
    return binDecoder;
}();

exports.default = binDecoder;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFtYmktYmluYXVyYWxEZWNvZGVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQWlCcUIsVTtBQUVqQix3QkFBWSxRQUFaLEVBQXNCLEtBQXRCLEVBQTZCO0FBQUE7OztBQUV6QixhQUFLLFdBQUwsR0FBbUIsS0FBbkI7O0FBRUEsYUFBSyxHQUFMLEdBQVcsUUFBWDtBQUNBLGFBQUssS0FBTCxHQUFhLEtBQWI7QUFDQSxhQUFLLEdBQUwsR0FBVyxDQUFDLFFBQVEsQ0FBVCxLQUFlLFFBQVEsQ0FBdkIsQ0FBWDtBQUNBLGFBQUssVUFBTCxHQUFrQixJQUFJLEtBQUosQ0FBVSxLQUFLLEdBQWYsQ0FBbEI7QUFDQSxhQUFLLGNBQUwsR0FBc0IsSUFBSSxLQUFKLENBQVUsS0FBSyxHQUFmLENBQXRCOztBQUVBLGFBQUssRUFBTCxHQUFVLEtBQUssR0FBTCxDQUFTLHFCQUFULENBQStCLEtBQUssR0FBcEMsQ0FBVjtBQUNBLGFBQUssR0FBTCxHQUFXLEtBQUssR0FBTCxDQUFTLG1CQUFULENBQTZCLENBQTdCLENBQVg7QUFDQSxhQUFLLEdBQUwsQ0FBUyxnQkFBVCxHQUE0QixVQUE1QjtBQUNBLGFBQUssR0FBTCxDQUFTLFlBQVQsR0FBd0IsQ0FBeEI7O0FBRUEsYUFBSyxPQUFMLEdBQWUsS0FBSyxHQUFMLENBQVMsVUFBVCxFQUFmO0FBQ0EsYUFBSyxRQUFMLEdBQWdCLEtBQUssR0FBTCxDQUFTLFVBQVQsRUFBaEI7QUFDQSxhQUFLLFVBQUwsR0FBa0IsS0FBSyxHQUFMLENBQVMsVUFBVCxFQUFsQjtBQUNBLGFBQUssT0FBTCxDQUFhLElBQWIsQ0FBa0IsS0FBbEIsR0FBMEIsQ0FBMUI7QUFDQSxhQUFLLFFBQUwsQ0FBYyxJQUFkLENBQW1CLEtBQW5CLEdBQTJCLENBQTNCO0FBQ0EsYUFBSyxVQUFMLENBQWdCLElBQWhCLENBQXFCLEtBQXJCLEdBQTZCLENBQUMsQ0FBOUI7O0FBRUEsYUFBSyxJ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QyxHQUExQztBQUNIO0FBQ0QscUJBQUssVUFBTCxDQUFnQixDQUFoQixFQUFtQixjQUFuQixDQUFrQyxDQUFsQyxFQUFxQyxDQUFyQyxJQUEwQyxVQUFVLENBQVYsQ0FBMUM7O0FBRUEscUJBQUssY0FBTCxDQUFvQixDQUFwQixFQUF1QixNQUF2QixHQUFnQyxLQUFLLFVBQUwsQ0FBZ0IsQ0FBaEIsQ0FBaEM7QUFDSDtBQUNKOzs7OztrQkFoRmdCLFUiLCJmaWxlIjoiYW1iaS1iaW5hdXJhbERlY29kZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gIEFyY2hvbnRpcyBQb2xpdGlzXG4vLyAgYXJjaG9udGlzLnBvbGl0aXNAYWFsdG8uZmlcbi8vICBEYXZpZCBQb2lyaWVyLVF1aW5vdFxuLy8gIGRhdmlwb2lyQGlyY2FtLmZyXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy9cbi8vICBXZWJBdWRpb19IT0EgYSBKYXZhU2NyaXB0IGxpYnJhcnkgZm9yIGhpZ2hlci1vcmRlciBBbWJpc29uaWNzXG4vLyAgVGhlIGxpYnJhcnkgaW1wbGVtZW50cyBXZWIgQXVkaW8gYmxvY2tzIHRoYXQgcGVyZm9ybVxuLy8gIHR5cGljYWwgYW1iaXNvbmljIHByb2Nlc3Npbmcgb3BlcmF0aW9ucyBvbiBhdWRpbyBzaWduYWxzLlxuLy9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vKiBIT0EgQklOQVVSQUwgREVDT0RFUiAqL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgYmluRGVjb2RlciB7XG5cbiAgICBjb25zdHJ1Y3RvcihhdWRpb0N0eCwgb3JkZXIpIHtcblxuICAgICAgICB0aGlzLmluaXRpYWxpemVkID0gZmFsc2U7XG5cbiAgICAgICAgdGhpcy5jdHggPSBhdWRpb0N0eDtcbiAgICAgICAgdGhpcy5vcmRlciA9IG9yZGVyO1xuICAgICAgICB0aGlzLm5DaCA9IChvcmRlciArIDEpICogKG9yZGVyICsgMSk7XG4gICAgICAgIHRoaXMuZGVjRmlsdGVycyA9IG5ldyBBcnJheSh0aGlzLm5DaCk7XG4gICAgICAgIHRoaXMuZGVjRmlsdGVyTm9kZXMgPSBuZXcgQXJyYXkodGhpcy5uQ2gpO1xuICAgICAgICAvLyBpbnB1dCBhbmQgb3V0cHV0IG5vZGVzXG4gICAgICAgIHRoaXMuaW4gPSB0aGlzLmN0eC5jcmVhdGVDaGFubmVsU3BsaXR0ZXIodGhpcy5uQ2gpO1xuICAgICAgICB0aGlzLm91dCA9IHRoaXMuY3R4LmNyZWF0ZUNoYW5uZWxNZXJnZXIoMik7XG4gICAgICAgIHRoaXMub3V0LmNoYW5uZWxDb3VudE1vZGUgPSAnZXhwbGljaXQnO1xuICAgICAgICB0aGlzLm91dC5jaGFubmVsQ291bnQgPSAxO1xuICAgICAgICAvLyBkb3dubWl4aW5nIGdhaW5zIGZvciBsZWZ0IGFuZCByaWdodCBlYXJzXG4gICAgICAgIHRoaXMuZ2Fpbk1pZCA9IHRoaXMuY3R4LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgdGhpcy5nYWluU2lkZSA9IHRoaXMuY3R4LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgdGhpcy5pbnZlcnRTaWRlID0gdGhpcy5jdHguY3JlYXRlR2FpbigpO1xuICAgICAgICB0aGlzLmdhaW5NaWQuZ2Fpbi52YWx1ZSA9IDE7XG4gICAgICAgIHRoaXMuZ2FpblNpZGUuZ2Fpbi52YWx1ZSA9IDE7XG4gICAgICAgIHRoaXMuaW52ZXJ0U2lkZS5nYWluLnZhbHVlID0gLTE7XG4gICAgICAgIC8vIGNvbnZvbHZlciBub2Rlc1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubkNoOyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMuZGVjRmlsdGVyTm9kZXNbaV0gPSB0aGlzLmN0eC5jcmVhdGVDb252b2x2ZXIoKTtcbiAgICAgICAgICAgIHRoaXMuZGVjRmlsdGVyTm9kZXNbaV0ubm9ybWFsaXplID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgLy8gaW5pdGlhbGl6ZSBjb252b2x2ZXJzIHRvIHBsYWluIGNhcmRpb2lkc1xuICAgICAgICB0aGlzLnJlc2V0RmlsdGVycygpO1xuICAgICAgICAvLyBjcmVhdGUgYXVkaW8gY29ubmVjdGlvbnNcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm5DaDsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLmluLmNvbm5lY3QodGhpcy5kZWNGaWx0ZXJOb2Rlc1tpXSwgaSwgMCk7XG4gICAgICAgICAgICB2YXIgbiA9IE1hdGguZmxvb3IoTWF0aC5zcXJ0KGkpKTtcbiAgICAgICAgICAgIHZhciBtID0gaSAtIG4gKiBuIC0gbjtcbiAgICAgICAgICAgIGlmIChtID49IDApIHRoaXMuZGVjRmlsdGVyTm9kZXNbaV0uY29ubmVjdCh0aGlzLmdhaW5NaWQpO1xuICAgICAgICAgICAgZWxzZSB0aGlzLmRlY0ZpbHRlck5vZGVzW2ldLmNvbm5lY3QodGhpcy5nYWluU2lkZSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5nYWluTWlkLmNvbm5lY3QodGhpcy5vdXQsIDAsIDApO1xuICAgICAgICB0aGlzLmdhaW5TaWRlLmNvbm5lY3QodGhpcy5vdXQsIDAsIDApO1xuXG4gICAgICAgIHRoaXMuZ2Fpbk1pZC5jb25uZWN0KHRoaXMub3V0LCAwLCAxKTtcbiAgICAgICAgdGhpcy5nYWluU2lkZS5jb25uZWN0KHRoaXMuaW52ZXJ0U2lkZSwgMCwgMCk7XG4gICAgICAgIHRoaXMuaW52ZXJ0U2lkZS5jb25uZWN0KHRoaXMub3V0LCAwLCAxKTtcblxuICAgICAgICB0aGlzLmluaXRpYWxpemVkID0gdHJ1ZTtcbiAgICB9XG5cbiAgICB1cGRhdGVGaWx0ZXJzKGF1ZGlvQnVmZmVyKSB7XG4gICAgICAgIC8vIGFzc2lnbiBmaWx0ZXJzIHRvIGNvbnZvbHZlcnNcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm5DaDsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLmRlY0ZpbHRlcnNbaV0gPSB0aGlzLmN0eC5jcmVhdGVCdWZmZXIoMSwgYXVkaW9CdWZmZXIubGVuZ3RoLCBhdWRpb0J1ZmZlci5zYW1wbGVSYXRlKTtcbiAgICAgICAgICAgIHRoaXMuZGVjRmlsdGVyc1tpXS5nZXRDaGFubmVsRGF0YSgwKS5zZXQoYXVkaW9CdWZmZXIuZ2V0Q2hhbm5lbERhdGEoaSkpO1xuXG4gICAgICAgICAgICB0aGlzLmRlY0ZpbHRlck5vZGVzW2ldLmJ1ZmZlciA9IHRoaXMuZGVjRmlsdGVyc1tpXTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJlc2V0RmlsdGVycygpIHtcbiAgICAgICAgLy8gb3ZlcndyaXRlIGRlY29kaW5nIGZpbHRlcnMgKHBsYWluIGNhcmRpb2lkIHZpcnR1YWwgbWljcm9waG9uZXMpXG4gICAgICAgIHZhciBjYXJkR2FpbnMgPSBuZXcgQXJyYXkodGhpcy5uQ2gpO1xuICAgICAgICBjYXJkR2FpbnMuZmlsbCgwKTtcbiAgICAgICAgY2FyZEdhaW5zWzBdID0gMC41O1xuICAgICAgICBjYXJkR2FpbnNbMV0gPSAwLjUgLyBNYXRoLnNxcnQoMyk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5uQ2g7IGkrKykge1xuICAgICAgICAgICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICAgICAgICAvLyBUaGlzIHdvcmtzIGZvciBDaHJvbWUgYW5kIEZpcmVmb3g6XG4gICAgICAgICAgICAvLyB0aGlzLmRlY0ZpbHRlcnNbaV0gPSB0aGlzLmN0eC5jcmVhdGVCdWZmZXIoMSwgMSwgdGhpcy5jdHguc2FtcGxlUmF0ZSk7XG4gICAgICAgICAgICAvLyB0aGlzLmRlY0ZpbHRlcnNbaV0uZ2V0Q2hhbm5lbERhdGEoMCkuc2V0KFtjYXJkR2FpbnNbaV1dKTtcbiAgICAgICAgICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgICAgICAgLy8gU2FmYXJpIGZvcmNlcyB1cyB0byB1c2UgdGhpczpcbiAgICAgICAgICAgIHRoaXMuZGVjRmlsdGVyc1tpXSA9IHRoaXMuY3R4LmNyZWF0ZUJ1ZmZlcigxLCA2NCwgdGhpcy5jdHguc2FtcGxlUmF0ZSk7XG4gICAgICAgICAgICAvLyBhbmQgd2lsbCBzZW5kIGdvcmdlb3VzIGNyYW5ja3kgbm9pc2UgYnVyc3RzIGZvciBhbnkgdmFsdWUgYmVsb3cgNjRcbiAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgNjQ7IGorKykge1xuICAgICAgICAgICAgICAgIHRoaXMuZGVjRmlsdGVyc1tpXS5nZXRDaGFubmVsRGF0YSgwKVtqXSA9IDAuMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuZGVjRmlsdGVyc1tpXS5nZXRDaGFubmVsRGF0YSgwKVswXSA9IGNhcmRHYWluc1tpXTtcbiAgICAgICAgICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgICAgICAgdGhpcy5kZWNGaWx0ZXJOb2Rlc1tpXS5idWZmZXIgPSB0aGlzLmRlY0ZpbHRlcnNbaV07XG4gICAgICAgIH1cbiAgICB9XG59XG4iXX0=