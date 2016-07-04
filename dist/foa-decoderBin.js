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

///////////////////////////////
/* B_FORMAT BINAURAL DECODER */
///////////////////////////////

var Bformat_binDecoder = function () {
    function Bformat_binDecoder(audioCtx) {
        (0, _classCallCheck3.default)(this, Bformat_binDecoder);

        this.initialized = false;

        this.ctx = audioCtx;
        this.decFilters = new Array(4);
        this.decFilterNodes = new Array(4);
        // input and output nodes
        this.in = this.ctx.createChannelSplitter(4);
        this.out = this.ctx.createChannelMerger(2);
        // downmixing gains for left and right ears
        this.gainMid = this.ctx.createGain();
        this.gainSide = this.ctx.createGain();
        this.invertSide = this.ctx.createGain();
        this.gainMid.gain.value = 1;
        this.gainSide.gain.value = 1;
        this.invertSide.gain.value = -1;
        // initialize convolvers
        for (var i = 0; i < 4; i++) {
            this.decFilterNodes[i] = this.ctx.createConvolver();
            this.decFilterNodes[i].normalize = false;
        }
        // initialize filters to plain opposing cardioids
        this.resetFilters();

        // Create connections
        for (var i = 0; i < 4; i++) {
            this.in.connect(this.decFilterNodes[i], i, 0);

            if (i == 2) this.decFilterNodes[i].connect(this.gainSide, 0, 0);else this.decFilterNodes[i].connect(this.gainMid, 0, 0);
        }
        this.gainMid.connect(this.out, 0, 0);
        this.gainSide.connect(this.out, 0, 0);

        this.gainMid.connect(this.out, 0, 1);
        this.gainSide.connect(this.invertSide, 0, 0);
        this.invertSide.connect(this.out, 0, 1);

        this.initialized = true;
    }

    (0, _createClass3.default)(Bformat_binDecoder, [{
        key: "updateFilters",
        value: function updateFilters(audioBuffer) {
            // assign filters to convolvers
            for (var i = 0; i < 4; i++) {
                this.decFilters[i] = this.ctx.createBuffer(1, audioBuffer.length, audioBuffer.sampleRate);
                this.decFilters[i].getChannelData(0).set(audioBuffer.getChannelData(i));

                this.decFilterNodes[i].buffer = this.decFilters[i];
            }
        }
    }, {
        key: "resetFilters",
        value: function resetFilters() {
            // overwrite decoding filters with plain opposing cardioids
            var cardGains = [0.5 * Math.SQRT2, 0, 0.5, 0];
            for (var i = 0; i < 4; i++) {
                this.decFilters[i] = this.ctx.createBuffer(1, 1, this.ctx.sampleRate);
                this.decFilters[i].getChannelData(0).set([cardGains[i]]);

                this.decFilterNodes[i].buffer = this.decFilters[i];
            }
        }
    }]);
    return Bformat_binDecoder;
}();

exports.default = Bformat_binDecoder;
//# sourceMappingURL=data:application/json;base64,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LENBQWdCLENBQWhCLEVBQW1CLGNBQW5CLENBQWtDLENBQWxDLEVBQXFDLEdBQXJDLENBQXlDLFlBQVksY0FBWixDQUEyQixDQUEzQixDQUF6Qzs7QUFFQSxxQkFBSyxjQUFMLENBQW9CLENBQXBCLEVBQXVCLE1BQXZCLEdBQWdDLEtBQUssVUFBTCxDQUFnQixDQUFoQixDQUFoQztBQUNIO0FBQ0o7Ozt1Q0FFYzs7QUFFWCxnQkFBSSxZQUFZLENBQUMsTUFBTSxLQUFLLEtBQVosRUFBbUIsQ0FBbkIsRUFBc0IsR0FBdEIsRUFBMkIsQ0FBM0IsQ0FBaEI7QUFDQSxpQkFBSyxJQUFJLElBQUksQ0FBYixFQUFnQixJQUFJLENBQXBCLEVBQXVCLEdBQXZCLEVBQTRCO0FBQ3hCLHFCQUFLLFVBQUwsQ0FBZ0IsQ0FBaEIsSUFBcUIsS0FBSyxHQUFMLENBQVMsWUFBVCxDQUFzQixDQUF0QixFQUF5QixDQUF6QixFQUE0QixLQUFLLEdBQUwsQ0FBUyxVQUFyQyxDQUFyQjtBQUNBLHFCQUFLLFVBQUwsQ0FBZ0IsQ0FBaEIsRUFBbUIsY0FBbkIsQ0FBa0MsQ0FBbEMsRUFBcUMsR0FBckMsQ0FBeUMsQ0FBQyxVQUFVLENBQVYsQ0FBRCxDQUF6Qzs7QUFFQSxxQkFBSyxjQUFMLENBQW9CLENBQXBCLEVBQXVCLE1BQXZCLEdBQWdDLEtBQUssVUFBTCxDQUFnQixDQUFoQixDQUFoQztBQUNIO0FBQ0o7Ozs7O2tCQS9EZ0Isa0IiLCJmaWxlIjoiZm9hLWRlY29kZXJCaW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gIEFyY2hvbnRpcyBQb2xpdGlzXG4vLyAgYXJjaG9udGlzLnBvbGl0aXNAYWFsdG8uZmlcbi8vICBEYXZpZCBQb2lyaWVyLVF1aW5vdFxuLy8gIGRhdmlwb2lyQGlyY2FtLmZyXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy9cbi8vICBXZWJBdWRpb19IT0EgYSBKYXZhU2NyaXB0IGxpYnJhcnkgZm9yIGhpZ2hlci1vcmRlciBBbWJpc29uaWNzXG4vLyAgVGhlIGxpYnJhcnkgaW1wbGVtZW50cyBXZWIgQXVkaW8gYmxvY2tzIHRoYXQgcGVyZm9ybVxuLy8gIHR5cGljYWwgYW1iaXNvbmljIHByb2Nlc3Npbmcgb3BlcmF0aW9ucyBvbiBhdWRpbyBzaWduYWxzLlxuLy9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8qIEJfRk9STUFUIEJJTkFVUkFMIERFQ09ERVIgKi9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEJmb3JtYXRfYmluRGVjb2RlciB7XG5cbiAgICBjb25zdHJ1Y3RvcihhdWRpb0N0eCkge1xuICAgICAgICB0aGlzLmluaXRpYWxpemVkID0gZmFsc2U7XG5cbiAgICAgICAgdGhpcy5jdHggPSBhdWRpb0N0eDtcbiAgICAgICAgdGhpcy5kZWNGaWx0ZXJzID0gbmV3IEFycmF5KDQpO1xuICAgICAgICB0aGlzLmRlY0ZpbHRlck5vZGVzID0gbmV3IEFycmF5KDQpO1xuICAgICAgICAvLyBpbnB1dCBhbmQgb3V0cHV0IG5vZGVzXG4gICAgICAgIHRoaXMuaW4gPSB0aGlzLmN0eC5jcmVhdGVDaGFubmVsU3BsaXR0ZXIoNCk7XG4gICAgICAgIHRoaXMub3V0ID0gdGhpcy5jdHguY3JlYXRlQ2hhbm5lbE1lcmdlcigyKTtcbiAgICAgICAgLy8gZG93bm1peGluZyBnYWlucyBmb3IgbGVmdCBhbmQgcmlnaHQgZWFyc1xuICAgICAgICB0aGlzLmdhaW5NaWQgPSB0aGlzLmN0eC5jcmVhdGVHYWluKCk7XG4gICAgICAgIHRoaXMuZ2FpblNpZGUgPSB0aGlzLmN0eC5jcmVhdGVHYWluKCk7XG4gICAgICAgIHRoaXMuaW52ZXJ0U2lkZSA9IHRoaXMuY3R4LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgdGhpcy5nYWluTWlkLmdhaW4udmFsdWUgPSAxO1xuICAgICAgICB0aGlzLmdhaW5TaWRlLmdhaW4udmFsdWUgPSAxO1xuICAgICAgICB0aGlzLmludmVydFNpZGUuZ2Fpbi52YWx1ZSA9IC0xO1xuICAgICAgICAvLyBpbml0aWFsaXplIGNvbnZvbHZlcnNcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCA0OyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMuZGVjRmlsdGVyTm9kZXNbaV0gPSB0aGlzLmN0eC5jcmVhdGVDb252b2x2ZXIoKTtcbiAgICAgICAgICAgIHRoaXMuZGVjRmlsdGVyTm9kZXNbaV0ubm9ybWFsaXplID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgLy8gaW5pdGlhbGl6ZSBmaWx0ZXJzIHRvIHBsYWluIG9wcG9zaW5nIGNhcmRpb2lkc1xuICAgICAgICB0aGlzLnJlc2V0RmlsdGVycygpO1xuXG4gICAgICAgIC8vIENyZWF0ZSBjb25uZWN0aW9uc1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IDQ7IGkrKykge1xuICAgICAgICAgICAgdGhpcy5pbi5jb25uZWN0KHRoaXMuZGVjRmlsdGVyTm9kZXNbaV0sIGksIDApO1xuXG4gICAgICAgICAgICBpZiAoaSA9PSAyKSB0aGlzLmRlY0ZpbHRlck5vZGVzW2ldLmNvbm5lY3QodGhpcy5nYWluU2lkZSwgMCwgMCk7XG4gICAgICAgICAgICBlbHNlIHRoaXMuZGVjRmlsdGVyTm9kZXNbaV0uY29ubmVjdCh0aGlzLmdhaW5NaWQsIDAsIDApO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZ2Fpbk1pZC5jb25uZWN0KHRoaXMub3V0LCAwLCAwKTtcbiAgICAgICAgdGhpcy5nYWluU2lkZS5jb25uZWN0KHRoaXMub3V0LCAwLCAwKTtcblxuICAgICAgICB0aGlzLmdhaW5NaWQuY29ubmVjdCh0aGlzLm91dCwgMCwgMSk7XG4gICAgICAgIHRoaXMuZ2FpblNpZGUuY29ubmVjdCh0aGlzLmludmVydFNpZGUsIDAsIDApO1xuICAgICAgICB0aGlzLmludmVydFNpZGUuY29ubmVjdCh0aGlzLm91dCwgMCwgMSk7XG5cbiAgICAgICAgdGhpcy5pbml0aWFsaXplZCA9IHRydWU7XG4gICAgfVxuXG5cbiAgICB1cGRhdGVGaWx0ZXJzKGF1ZGlvQnVmZmVyKSB7XG4gICAgICAgIC8vIGFzc2lnbiBmaWx0ZXJzIHRvIGNvbnZvbHZlcnNcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCA0OyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMuZGVjRmlsdGVyc1tpXSA9IHRoaXMuY3R4LmNyZWF0ZUJ1ZmZlcigxLCBhdWRpb0J1ZmZlci5sZW5ndGgsIGF1ZGlvQnVmZmVyLnNhbXBsZVJhdGUpO1xuICAgICAgICAgICAgdGhpcy5kZWNGaWx0ZXJzW2ldLmdldENoYW5uZWxEYXRhKDApLnNldChhdWRpb0J1ZmZlci5nZXRDaGFubmVsRGF0YShpKSk7XG5cbiAgICAgICAgICAgIHRoaXMuZGVjRmlsdGVyTm9kZXNbaV0uYnVmZmVyID0gdGhpcy5kZWNGaWx0ZXJzW2ldO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmVzZXRGaWx0ZXJzKCkge1xuICAgICAgICAvLyBvdmVyd3JpdGUgZGVjb2RpbmcgZmlsdGVycyB3aXRoIHBsYWluIG9wcG9zaW5nIGNhcmRpb2lkc1xuICAgICAgICB2YXIgY2FyZEdhaW5zID0gWzAuNSAqIE1hdGguU1FSVDIsIDAsIDAuNSwgMF07XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgNDsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLmRlY0ZpbHRlcnNbaV0gPSB0aGlzLmN0eC5jcmVhdGVCdWZmZXIoMSwgMSwgdGhpcy5jdHguc2FtcGxlUmF0ZSk7XG4gICAgICAgICAgICB0aGlzLmRlY0ZpbHRlcnNbaV0uZ2V0Q2hhbm5lbERhdGEoMCkuc2V0KFtjYXJkR2FpbnNbaV1dKTtcblxuICAgICAgICAgICAgdGhpcy5kZWNGaWx0ZXJOb2Rlc1tpXS5idWZmZXIgPSB0aGlzLmRlY0ZpbHRlcnNbaV07XG4gICAgICAgIH1cbiAgICB9XG59XG4iXX0=