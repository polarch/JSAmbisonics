"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.fuma2acn = exports.acn2bf = exports.bf2acn = undefined;

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
/* FOA B-FORMAT TO ACN/N3D CONVERTER */
///////////////////////////////////

var bf2acn = exports.bf2acn = function bf2acn(audioCtx) {
    (0, _classCallCheck3.default)(this, bf2acn);


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
/* ACN/N3D TO FOA B-FORMAT CONVERTER */
///////////////////////////////////


var acn2bf = exports.acn2bf = function acn2bf(audioCtx) {
    (0, _classCallCheck3.default)(this, acn2bf);


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


var fuma2acn = exports.fuma2acn = function fuma2acn(audioCtx, order) {
    (0, _classCallCheck3.default)(this, fuma2acn);


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
//# sourceMappingURL=data:application/json;base64,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SUFBYyxDQUFmLElBQXFCLENBQXpCLEVBQTRCO0FBQUUsc0JBQUUsSUFBRixDQUFPLENBQVA7QUFBVyxpQkFBekMsTUFBK0M7QUFBRSxzQkFBRSxPQUFGLENBQVUsQ0FBVjtBQUFjO0FBQ2xFO0FBQ0QsaUJBQUssVUFBTCxHQUFrQixLQUFLLFVBQUwsQ0FBZ0IsTUFBaEIsQ0FBdUIsQ0FBdkIsQ0FBbEI7QUFDSDtBQUNKOzs7QUFHRCxTQUFLLElBQUksSUFBSSxDQUFiLEVBQWdCLElBQUksS0FBSyxHQUF6QixFQUE4QixHQUE5QixFQUFtQztBQUMvQixhQUFLLEtBQUwsQ0FBVyxDQUFYLElBQWdCLEtBQUssR0FBTCxDQUFTLFVBQVQsRUFBaEI7QUFDQSxhQUFLLEVBQUwsQ0FBUSxPQUFSLENBQWdCLEtBQUssS0FBTCxDQUFXLENBQVgsQ0FBaEIsRUFBK0IsS0FBSyxVQUFMLENBQWdCLENBQWhCLENBQS9CLEVBQW1ELENBQW5EO0FBQ0EsYUFBSyxLQUFMLENBQVcsQ0FBWCxFQUFjLE9BQWQsQ0FBc0IsS0FBSyxHQUEzQixFQUFnQyxDQUFoQyxFQUFtQyxDQUFuQztBQUNIO0FBQ0osQyIsImZpbGUiOiJhbWJpLWNvbnZlcnRlcnMuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gIEFyY2hvbnRpcyBQb2xpdGlzXG4vLyAgYXJjaG9udGlzLnBvbGl0aXNAYWFsdG8uZmlcbi8vICBEYXZpZCBQb2lyaWVyLVF1aW5vdFxuLy8gIGRhdmlwb2lyQGlyY2FtLmZyXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy9cbi8vICBXZWJBdWRpb19IT0EgYSBKYXZhU2NyaXB0IGxpYnJhcnkgZm9yIGhpZ2hlci1vcmRlciBBbWJpc29uaWNzXG4vLyAgVGhlIGxpYnJhcnkgaW1wbGVtZW50cyBXZWIgQXVkaW8gYmxvY2tzIHRoYXQgcGVyZm9ybVxuLy8gIHR5cGljYWwgYW1iaXNvbmljIHByb2Nlc3Npbmcgb3BlcmF0aW9ucyBvbiBhdWRpbyBzaWduYWxzLlxuLy9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vKiBGT0EgQi1GT1JNQVQgVE8gQUNOL04zRCBDT05WRVJURVIgKi9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5leHBvcnQgY2xhc3MgYmYyYWNuIHtcblxuICAgIGNvbnN0cnVjdG9yKGF1ZGlvQ3R4KSB7XG5cbiAgICAgICAgdGhpcy5jdHggPSBhdWRpb0N0eDtcbiAgICAgICAgdGhpcy5pbiA9IHRoaXMuY3R4LmNyZWF0ZUNoYW5uZWxTcGxpdHRlcig0KTtcbiAgICAgICAgdGhpcy5vdXQgPSB0aGlzLmN0eC5jcmVhdGVDaGFubmVsTWVyZ2VyKDQpO1xuICAgICAgICB0aGlzLmdhaW5zID0gW107XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCA0OyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMuZ2FpbnNbaV0gPSB0aGlzLmN0eC5jcmVhdGVHYWluKCk7XG4gICAgICAgICAgICBpZiAoaSA9PSAwKSB0aGlzLmdhaW5zW2ldLmdhaW4udmFsdWUgPSBNYXRoLlNRUlQyO1xuICAgICAgICAgICAgZWxzZSB0aGlzLmdhaW5zW2ldLmdhaW4udmFsdWUgPSBNYXRoLnNxcnQoMyk7XG5cbiAgICAgICAgICAgIHRoaXMuZ2FpbnNbaV0uY29ubmVjdCh0aGlzLm91dCwgMCwgaSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5pbi5jb25uZWN0KHRoaXMuZ2FpbnNbMF0sIDAsIDApO1xuICAgICAgICB0aGlzLmluLmNvbm5lY3QodGhpcy5nYWluc1szXSwgMSwgMCk7XG4gICAgICAgIHRoaXMuaW4uY29ubmVjdCh0aGlzLmdhaW5zWzFdLCAyLCAwKTtcbiAgICAgICAgdGhpcy5pbi5jb25uZWN0KHRoaXMuZ2FpbnNbMl0sIDMsIDApO1xuICAgIH1cbn1cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8qIEFDTi9OM0QgVE8gRk9BIEItRk9STUFUIENPTlZFUlRFUiAqL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbmV4cG9ydCBjbGFzcyBhY24yYmYge1xuXG4gICAgY29uc3RydWN0b3IoYXVkaW9DdHgpIHtcblxuICAgICAgICB0aGlzLmN0eCA9IGF1ZGlvQ3R4O1xuICAgICAgICB0aGlzLmluID0gdGhpcy5jdHguY3JlYXRlQ2hhbm5lbFNwbGl0dGVyKDQpO1xuICAgICAgICB0aGlzLm91dCA9IHRoaXMuY3R4LmNyZWF0ZUNoYW5uZWxNZXJnZXIoNCk7XG4gICAgICAgIHRoaXMuZ2FpbnMgPSBbXTtcblxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IDQ7IGkrKykge1xuICAgICAgICAgICAgdGhpcy5nYWluc1tpXSA9IHRoaXMuY3R4LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgICAgIGlmIChpID09IDApIHRoaXMuZ2FpbnNbaV0uZ2Fpbi52YWx1ZSA9IE1hdGguU1FSVDFfMjtcbiAgICAgICAgICAgIGVsc2UgdGhpcy5nYWluc1tpXS5nYWluLnZhbHVlID0gMSAvIE1hdGguc3FydCgzKTtcblxuICAgICAgICAgICAgdGhpcy5nYWluc1tpXS5jb25uZWN0KHRoaXMub3V0LCAwLCBpKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmluLmNvbm5lY3QodGhpcy5nYWluc1swXSwgMCwgMCk7XG4gICAgICAgIHRoaXMuaW4uY29ubmVjdCh0aGlzLmdhaW5zWzJdLCAxLCAwKTtcbiAgICAgICAgdGhpcy5pbi5jb25uZWN0KHRoaXMuZ2FpbnNbM10sIDIsIDApO1xuICAgICAgICB0aGlzLmluLmNvbm5lY3QodGhpcy5nYWluc1sxXSwgMywgMCk7XG4gICAgfVxufVxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLyogQUNOL04zRCBUTyBCLUZPUk1BVCBDT05WRVJURVIgKi9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5leHBvcnQgY2xhc3MgZnVtYTJhY24ge1xuXG4gICAgY29uc3RydWN0b3IoYXVkaW9DdHgsIG9yZGVyKSB7XG5cbiAgICAgICAgdGhpcy5jdHggPSBhdWRpb0N0eDtcbiAgICAgICAgdGhpcy5vcmRlciA9IG9yZGVyO1xuICAgICAgICB0aGlzLm5DaCA9IChvcmRlciArIDEpICogKG9yZGVyICsgMSk7XG4gICAgICAgIHRoaXMuaW4gPSB0aGlzLmN0eC5jcmVhdGVDaGFubmVsU3BsaXR0ZXIodGhpcy5uQ2gpO1xuICAgICAgICB0aGlzLm91dCA9IHRoaXMuY3R4LmNyZWF0ZUNoYW5uZWxNZXJnZXIodGhpcy5uQ2gpO1xuICAgICAgICB0aGlzLmdhaW5zID0gW107XG4gICAgICAgIHRoaXMucmVtYXBBcnJheSA9IFtdO1xuXG4gICAgICAgIC8vIGdldCBjaGFubmVsIHJlbWFwcGluZyB2YWx1ZXMgb3JkZXIgMC0xXG4gICAgICAgIHRoaXMucmVtYXBBcnJheS5wdXNoKDAsIDIsIDMsIDEpOyAvLyBtYW51YWxseSBoYW5kbGUgdW50aWwgb3JkZXIgMVxuXG4gICAgICAgIC8vIGdldCBjaGFubmVsIHJlbWFwcGluZyB2YWx1ZXMgb3JkZXIgMi1OXG4gICAgICAgIHZhciBvID0gMDtcbiAgICAgICAgdmFyIG07XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5uQ2g7IGkrKykge1xuICAgICAgICAgICAgbSA9IFtdO1xuICAgICAgICAgICAgaWYgKGkgPj0gKG8gKyAxKSAqIChvICsgMSkpIHtcbiAgICAgICAgICAgICAgICBvICs9IDE7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IChvICsgMSkgKiAobyArIDEpOyBqIDwgKG8gKyAyKSAqIChvICsgMik7IGorKykge1xuICAgICAgICAgICAgICAgICAgICBpZiAoKChqICsgbyAlIDIpICUgMikgPT0gMCkgeyBtLnB1c2goaikgfSBlbHNlIHsgbS51bnNoaWZ0KGopIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5yZW1hcEFycmF5ID0gdGhpcy5yZW1hcEFycmF5LmNvbmNhdChtKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGNvbm5lY3QgaW5wdXRzL291dHB1dHMgKGtlcHQgc2VwYXJhdGVkIGZvciBjbGFyaXR5J3Mgc2FrZSlcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm5DaDsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLmdhaW5zW2ldID0gdGhpcy5jdHguY3JlYXRlR2FpbigpO1xuICAgICAgICAgICAgdGhpcy5pbi5jb25uZWN0KHRoaXMuZ2FpbnNbaV0sIHRoaXMucmVtYXBBcnJheVtpXSwgMCk7XG4gICAgICAgICAgICB0aGlzLmdhaW5zW2ldLmNvbm5lY3QodGhpcy5vdXQsIDAsIGkpO1xuICAgICAgICB9XG4gICAgfVxufVxuIl19