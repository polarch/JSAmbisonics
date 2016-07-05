"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.HOA_fuma2acn = exports.HOA_acn2bf = exports.HOA_bf2acn = undefined;

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

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

///////////////////////////////////
/* B-FORMAT TO ACN/N3D CONVERTER */
///////////////////////////////////

var HOA_bf2acn = exports.HOA_bf2acn = function HOA_bf2acn(audioCtx) {
    (0, _classCallCheck3.default)(this, HOA_bf2acn);


    this.ctx = audioCtx;
    this.in = this.ctx.createChannelSplitter(4);
    this.out = this.ctx.createChannelMerger(4);
    this.gains = [];

    for (var i = 0; i < 4; i++) {
        this.gains[i] = this.ctx.createGain();
        if (i == 0) this.gains[i].gain.value = Math.SQRT2;else this.gains[i].gain.value = Math.sqrt(3);

        this.gains[i].connect(this.out, 0, i);
    }
    this.in.connect(this.gains[0], 0, 0);
    this.in.connect(this.gains[3], 1, 0);
    this.in.connect(this.gains[1], 2, 0);
    this.in.connect(this.gains[2], 3, 0);
};

///////////////////////////////////
/* ACN/N3D TO B-FORMAT CONVERTER */
///////////////////////////////////


var HOA_acn2bf = exports.HOA_acn2bf = function HOA_acn2bf(audioCtx) {
    (0, _classCallCheck3.default)(this, HOA_acn2bf);


    this.ctx = audioCtx;
    this.in = this.ctx.createChannelSplitter(4);
    this.out = this.ctx.createChannelMerger(4);
    this.gains = [];

    for (var i = 0; i < 4; i++) {
        this.gains[i] = this.ctx.createGain();
        if (i == 0) this.gains[i].gain.value = Math.SQRT1_2;else this.gains[i].gain.value = 1 / Math.sqrt(3);

        this.gains[i].connect(this.out, 0, i);
    }
    this.in.connect(this.gains[0], 0, 0);
    this.in.connect(this.gains[2], 1, 0);
    this.in.connect(this.gains[3], 2, 0);
    this.in.connect(this.gains[1], 3, 0);
};

///////////////////////////////////
/* ACN/N3D TO B-FORMAT CONVERTER */
///////////////////////////////////


var HOA_fuma2acn = exports.HOA_fuma2acn = function HOA_fuma2acn(audioCtx, order) {
    (0, _classCallCheck3.default)(this, HOA_fuma2acn);


    this.ctx = audioCtx;
    this.order = order;
    this.nCh = (order + 1) * (order + 1);
    this.in = this.ctx.createChannelSplitter(this.nCh);
    this.out = this.ctx.createChannelMerger(this.nCh);
    this.gains = [];
    this.remapArray = [];

    // get channel remapping values order 0-1
    this.remapArray.push(0, 2, 3, 1); // manually handle until order 1

    // get channel remapping values order 2-N
    var o = 0;
    var m;
    for (var i = 0; i < this.nCh; i++) {
        m = [];
        if (i >= (o + 1) * (o + 1)) {
            o += 1;
            for (var j = (o + 1) * (o + 1); j < (o + 2) * (o + 2); j++) {
                if ((j + o % 2) % 2 == 0) {
                    m.push(j);
                } else {
                    m.unshift(j);
                }
            }
            this.remapArray = this.remapArray.concat(m);
        }
    }

    // connect inputs/outputs (kept separated for clarity's sake)
    for (var i = 0; i < this.nCh; i++) {
        this.gains[i] = this.ctx.createGain();
        this.in.connect(this.gains[i], this.remapArray[i], 0);
        this.gains[i].connect(this.out, 0, i);
    }
};
//# sourceMappingURL=data:application/json;base64,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QUFjLENBQWYsSUFBcUIsQ0FBekIsRUFBNEI7QUFBRSxzQkFBRSxJQUFGLENBQU8sQ0FBUDtBQUFXLGlCQUF6QyxNQUErQztBQUFFLHNCQUFFLE9BQUYsQ0FBVSxDQUFWO0FBQWM7QUFDbEU7QUFDRCxpQkFBSyxVQUFMLEdBQWtCLEtBQUssVUFBTCxDQUFnQixNQUFoQixDQUF1QixDQUF2QixDQUFsQjtBQUNIO0FBQ0o7OztBQUdELFNBQUssSUFBSSxJQUFJLENBQWIsRUFBZ0IsSUFBSSxLQUFLLEdBQXpCLEVBQThCLEdBQTlCLEVBQW1DO0FBQy9CLGFBQUssS0FBTCxDQUFXLENBQVgsSUFBZ0IsS0FBSyxHQUFMLENBQVMsVUFBVCxFQUFoQjtBQUNBLGFBQUssRUFBTCxDQUFRLE9BQVIsQ0FBZ0IsS0FBSyxLQUFMLENBQVcsQ0FBWCxDQUFoQixFQUErQixLQUFLLFVBQUwsQ0FBZ0IsQ0FBaEIsQ0FBL0IsRUFBbUQsQ0FBbkQ7QUFDQSxhQUFLLEtBQUwsQ0FBVyxDQUFYLEVBQWMsT0FBZCxDQUFzQixLQUFLLEdBQTNCLEVBQWdDLENBQWhDLEVBQW1DLENBQW5DO0FBQ0g7QUFDSixDIiwiZmlsZSI6ImhvYS1jb252ZXJ0ZXJzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vICBBcmNob250aXMgUG9saXRpc1xuLy8gIGFyY2hvbnRpcy5wb2xpdGlzQGFhbHRvLmZpXG4vLyAgRGF2aWQgUG9pcmllci1RdWlub3Rcbi8vICBkYXZpcG9pckBpcmNhbS5mclxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vXG4vLyAgV2ViQXVkaW9fSE9BIGEgSmF2YVNjcmlwdCBsaWJyYXJ5IGZvciBoaWdoZXItb3JkZXIgQW1iaXNvbmljc1xuLy8gIFRoZSBsaWJyYXJ5IGltcGxlbWVudHMgV2ViIEF1ZGlvIGJsb2NrcyB0aGF0IHBlcmZvcm1cbi8vICB0eXBpY2FsIGFtYmlzb25pYyBwcm9jZXNzaW5nIG9wZXJhdGlvbnMgb24gYXVkaW8gc2lnbmFscy5cbi8vXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLyogQi1GT1JNQVQgVE8gQUNOL04zRCBDT05WRVJURVIgKi9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5leHBvcnQgY2xhc3MgSE9BX2JmMmFjbiB7XG5cbiAgICBjb25zdHJ1Y3RvcihhdWRpb0N0eCkge1xuXG4gICAgICAgIHRoaXMuY3R4ID0gYXVkaW9DdHg7XG4gICAgICAgIHRoaXMuaW4gPSB0aGlzLmN0eC5jcmVhdGVDaGFubmVsU3BsaXR0ZXIoNCk7XG4gICAgICAgIHRoaXMub3V0ID0gdGhpcy5jdHguY3JlYXRlQ2hhbm5lbE1lcmdlcig0KTtcbiAgICAgICAgdGhpcy5nYWlucyA9IFtdO1xuXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgNDsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLmdhaW5zW2ldID0gdGhpcy5jdHguY3JlYXRlR2FpbigpO1xuICAgICAgICAgICAgaWYgKGkgPT0gMCkgdGhpcy5nYWluc1tpXS5nYWluLnZhbHVlID0gTWF0aC5TUVJUMjtcbiAgICAgICAgICAgIGVsc2UgdGhpcy5nYWluc1tpXS5nYWluLnZhbHVlID0gTWF0aC5zcXJ0KDMpO1xuXG4gICAgICAgICAgICB0aGlzLmdhaW5zW2ldLmNvbm5lY3QodGhpcy5vdXQsIDAsIGkpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuaW4uY29ubmVjdCh0aGlzLmdhaW5zWzBdLCAwLCAwKTtcbiAgICAgICAgdGhpcy5pbi5jb25uZWN0KHRoaXMuZ2FpbnNbM10sIDEsIDApO1xuICAgICAgICB0aGlzLmluLmNvbm5lY3QodGhpcy5nYWluc1sxXSwgMiwgMCk7XG4gICAgICAgIHRoaXMuaW4uY29ubmVjdCh0aGlzLmdhaW5zWzJdLCAzLCAwKTtcbiAgICB9XG59XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vKiBBQ04vTjNEIFRPIEItRk9STUFUIENPTlZFUlRFUiAqL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbmV4cG9ydCBjbGFzcyBIT0FfYWNuMmJmIHtcblxuICAgIGNvbnN0cnVjdG9yKGF1ZGlvQ3R4KSB7XG5cbiAgICAgICAgdGhpcy5jdHggPSBhdWRpb0N0eDtcbiAgICAgICAgdGhpcy5pbiA9IHRoaXMuY3R4LmNyZWF0ZUNoYW5uZWxTcGxpdHRlcig0KTtcbiAgICAgICAgdGhpcy5vdXQgPSB0aGlzLmN0eC5jcmVhdGVDaGFubmVsTWVyZ2VyKDQpO1xuICAgICAgICB0aGlzLmdhaW5zID0gW107XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCA0OyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMuZ2FpbnNbaV0gPSB0aGlzLmN0eC5jcmVhdGVHYWluKCk7XG4gICAgICAgICAgICBpZiAoaSA9PSAwKSB0aGlzLmdhaW5zW2ldLmdhaW4udmFsdWUgPSBNYXRoLlNRUlQxXzI7XG4gICAgICAgICAgICBlbHNlIHRoaXMuZ2FpbnNbaV0uZ2Fpbi52YWx1ZSA9IDEgLyBNYXRoLnNxcnQoMyk7XG5cbiAgICAgICAgICAgIHRoaXMuZ2FpbnNbaV0uY29ubmVjdCh0aGlzLm91dCwgMCwgaSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5pbi5jb25uZWN0KHRoaXMuZ2FpbnNbMF0sIDAsIDApO1xuICAgICAgICB0aGlzLmluLmNvbm5lY3QodGhpcy5nYWluc1syXSwgMSwgMCk7XG4gICAgICAgIHRoaXMuaW4uY29ubmVjdCh0aGlzLmdhaW5zWzNdLCAyLCAwKTtcbiAgICAgICAgdGhpcy5pbi5jb25uZWN0KHRoaXMuZ2FpbnNbMV0sIDMsIDApO1xuICAgIH1cbn1cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8qIEFDTi9OM0QgVE8gQi1GT1JNQVQgQ09OVkVSVEVSICovXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuZXhwb3J0IGNsYXNzIEhPQV9mdW1hMmFjbiB7XG5cbiAgICBjb25zdHJ1Y3RvcihhdWRpb0N0eCwgb3JkZXIpIHtcblxuICAgICAgICB0aGlzLmN0eCA9IGF1ZGlvQ3R4O1xuICAgICAgICB0aGlzLm9yZGVyID0gb3JkZXI7XG4gICAgICAgIHRoaXMubkNoID0gKG9yZGVyICsgMSkgKiAob3JkZXIgKyAxKTtcbiAgICAgICAgdGhpcy5pbiA9IHRoaXMuY3R4LmNyZWF0ZUNoYW5uZWxTcGxpdHRlcih0aGlzLm5DaCk7XG4gICAgICAgIHRoaXMub3V0ID0gdGhpcy5jdHguY3JlYXRlQ2hhbm5lbE1lcmdlcih0aGlzLm5DaCk7XG4gICAgICAgIHRoaXMuZ2FpbnMgPSBbXTtcbiAgICAgICAgdGhpcy5yZW1hcEFycmF5ID0gW107XG5cbiAgICAgICAgLy8gZ2V0IGNoYW5uZWwgcmVtYXBwaW5nIHZhbHVlcyBvcmRlciAwLTFcbiAgICAgICAgdGhpcy5yZW1hcEFycmF5LnB1c2goMCwgMiwgMywgMSk7IC8vIG1hbnVhbGx5IGhhbmRsZSB1bnRpbCBvcmRlciAxXG5cbiAgICAgICAgLy8gZ2V0IGNoYW5uZWwgcmVtYXBwaW5nIHZhbHVlcyBvcmRlciAyLU5cbiAgICAgICAgdmFyIG8gPSAwO1xuICAgICAgICB2YXIgbTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm5DaDsgaSsrKSB7XG4gICAgICAgICAgICBtID0gW107XG4gICAgICAgICAgICBpZiAoaSA+PSAobyArIDEpICogKG8gKyAxKSkge1xuICAgICAgICAgICAgICAgIG8gKz0gMTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gKG8gKyAxKSAqIChvICsgMSk7IGogPCAobyArIDIpICogKG8gKyAyKTsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICgoKGogKyBvICUgMikgJSAyKSA9PSAwKSB7IG0ucHVzaChqKSB9IGVsc2UgeyBtLnVuc2hpZnQoaikgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLnJlbWFwQXJyYXkgPSB0aGlzLnJlbWFwQXJyYXkuY29uY2F0KG0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gY29ubmVjdCBpbnB1dHMvb3V0cHV0cyAoa2VwdCBzZXBhcmF0ZWQgZm9yIGNsYXJpdHkncyBzYWtlKVxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubkNoOyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMuZ2FpbnNbaV0gPSB0aGlzLmN0eC5jcmVhdGVHYWluKCk7XG4gICAgICAgICAgICB0aGlzLmluLmNvbm5lY3QodGhpcy5nYWluc1tpXSwgdGhpcy5yZW1hcEFycmF5W2ldLCAwKTtcbiAgICAgICAgICAgIHRoaXMuZ2FpbnNbaV0uY29ubmVjdCh0aGlzLm91dCwgMCwgaSk7XG4gICAgICAgIH1cbiAgICB9XG59XG4iXX0=