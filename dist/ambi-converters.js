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
//# sourceMappingURL=data:application/json;base64,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SUFBYyxDQUFmLElBQXFCLENBQXpCLEVBQTRCO0FBQUUsc0JBQUUsSUFBRixDQUFPLENBQVA7QUFBVyxpQkFBekMsTUFBK0M7QUFBRSxzQkFBRSxPQUFGLENBQVUsQ0FBVjtBQUFjO0FBQ2xFO0FBQ0QsaUJBQUssVUFBTCxHQUFrQixLQUFLLFVBQUwsQ0FBZ0IsTUFBaEIsQ0FBdUIsQ0FBdkIsQ0FBbEI7QUFDSDtBQUNKOzs7QUFHRCxTQUFLLElBQUksSUFBSSxDQUFiLEVBQWdCLElBQUksS0FBSyxHQUF6QixFQUE4QixHQUE5QixFQUFtQztBQUMvQixhQUFLLEtBQUwsQ0FBVyxDQUFYLElBQWdCLEtBQUssR0FBTCxDQUFTLFVBQVQsRUFBaEI7QUFDQSxhQUFLLEVBQUwsQ0FBUSxPQUFSLENBQWdCLEtBQUssS0FBTCxDQUFXLENBQVgsQ0FBaEIsRUFBK0IsS0FBSyxVQUFMLENBQWdCLENBQWhCLENBQS9CLEVBQW1ELENBQW5EO0FBQ0EsYUFBSyxLQUFMLENBQVcsQ0FBWCxFQUFjLE9BQWQsQ0FBc0IsS0FBSyxHQUEzQixFQUFnQyxDQUFoQyxFQUFtQyxDQUFuQztBQUNIO0FBQ0osQyIsImZpbGUiOiJhbWJpLWNvbnZlcnRlcnMuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gIEFyY2hvbnRpcyBQb2xpdGlzXG4vLyAgYXJjaG9udGlzLnBvbGl0aXNAYWFsdG8uZmlcbi8vICBEYXZpZCBQb2lyaWVyLVF1aW5vdFxuLy8gIGRhdmlwb2lyQGlyY2FtLmZyXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy9cbi8vICBXZWJBdWRpb19IT0EgYSBKYXZhU2NyaXB0IGxpYnJhcnkgZm9yIGhpZ2hlci1vcmRlciBBbWJpc29uaWNzXG4vLyAgVGhlIGxpYnJhcnkgaW1wbGVtZW50cyBXZWIgQXVkaW8gYmxvY2tzIHRoYXQgcGVyZm9ybVxuLy8gIHR5cGljYWwgYW1iaXNvbmljIHByb2Nlc3Npbmcgb3BlcmF0aW9ucyBvbiBhdWRpbyBzaWduYWxzLlxuLy9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vKiBCLUZPUk1BVCBUTyBBQ04vTjNEIENPTlZFUlRFUiAqL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbmV4cG9ydCBjbGFzcyBIT0FfYmYyYWNuIHtcblxuICAgIGNvbnN0cnVjdG9yKGF1ZGlvQ3R4KSB7XG5cbiAgICAgICAgdGhpcy5jdHggPSBhdWRpb0N0eDtcbiAgICAgICAgdGhpcy5pbiA9IHRoaXMuY3R4LmNyZWF0ZUNoYW5uZWxTcGxpdHRlcig0KTtcbiAgICAgICAgdGhpcy5vdXQgPSB0aGlzLmN0eC5jcmVhdGVDaGFubmVsTWVyZ2VyKDQpO1xuICAgICAgICB0aGlzLmdhaW5zID0gW107XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCA0OyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMuZ2FpbnNbaV0gPSB0aGlzLmN0eC5jcmVhdGVHYWluKCk7XG4gICAgICAgICAgICBpZiAoaSA9PSAwKSB0aGlzLmdhaW5zW2ldLmdhaW4udmFsdWUgPSBNYXRoLlNRUlQyO1xuICAgICAgICAgICAgZWxzZSB0aGlzLmdhaW5zW2ldLmdhaW4udmFsdWUgPSBNYXRoLnNxcnQoMyk7XG5cbiAgICAgICAgICAgIHRoaXMuZ2FpbnNbaV0uY29ubmVjdCh0aGlzLm91dCwgMCwgaSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5pbi5jb25uZWN0KHRoaXMuZ2FpbnNbMF0sIDAsIDApO1xuICAgICAgICB0aGlzLmluLmNvbm5lY3QodGhpcy5nYWluc1szXSwgMSwgMCk7XG4gICAgICAgIHRoaXMuaW4uY29ubmVjdCh0aGlzLmdhaW5zWzFdLCAyLCAwKTtcbiAgICAgICAgdGhpcy5pbi5jb25uZWN0KHRoaXMuZ2FpbnNbMl0sIDMsIDApO1xuICAgIH1cbn1cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8qIEFDTi9OM0QgVE8gQi1GT1JNQVQgQ09OVkVSVEVSICovXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuZXhwb3J0IGNsYXNzIEhPQV9hY24yYmYge1xuXG4gICAgY29uc3RydWN0b3IoYXVkaW9DdHgpIHtcblxuICAgICAgICB0aGlzLmN0eCA9IGF1ZGlvQ3R4O1xuICAgICAgICB0aGlzLmluID0gdGhpcy5jdHguY3JlYXRlQ2hhbm5lbFNwbGl0dGVyKDQpO1xuICAgICAgICB0aGlzLm91dCA9IHRoaXMuY3R4LmNyZWF0ZUNoYW5uZWxNZXJnZXIoNCk7XG4gICAgICAgIHRoaXMuZ2FpbnMgPSBbXTtcblxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IDQ7IGkrKykge1xuICAgICAgICAgICAgdGhpcy5nYWluc1tpXSA9IHRoaXMuY3R4LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgICAgIGlmIChpID09IDApIHRoaXMuZ2FpbnNbaV0uZ2Fpbi52YWx1ZSA9IE1hdGguU1FSVDFfMjtcbiAgICAgICAgICAgIGVsc2UgdGhpcy5nYWluc1tpXS5nYWluLnZhbHVlID0gMSAvIE1hdGguc3FydCgzKTtcblxuICAgICAgICAgICAgdGhpcy5nYWluc1tpXS5jb25uZWN0KHRoaXMub3V0LCAwLCBpKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmluLmNvbm5lY3QodGhpcy5nYWluc1swXSwgMCwgMCk7XG4gICAgICAgIHRoaXMuaW4uY29ubmVjdCh0aGlzLmdhaW5zWzJdLCAxLCAwKTtcbiAgICAgICAgdGhpcy5pbi5jb25uZWN0KHRoaXMuZ2FpbnNbM10sIDIsIDApO1xuICAgICAgICB0aGlzLmluLmNvbm5lY3QodGhpcy5nYWluc1sxXSwgMywgMCk7XG4gICAgfVxufVxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLyogQUNOL04zRCBUTyBCLUZPUk1BVCBDT05WRVJURVIgKi9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5leHBvcnQgY2xhc3MgSE9BX2Z1bWEyYWNuIHtcblxuICAgIGNvbnN0cnVjdG9yKGF1ZGlvQ3R4LCBvcmRlcikge1xuXG4gICAgICAgIHRoaXMuY3R4ID0gYXVkaW9DdHg7XG4gICAgICAgIHRoaXMub3JkZXIgPSBvcmRlcjtcbiAgICAgICAgdGhpcy5uQ2ggPSAob3JkZXIgKyAxKSAqIChvcmRlciArIDEpO1xuICAgICAgICB0aGlzLmluID0gdGhpcy5jdHguY3JlYXRlQ2hhbm5lbFNwbGl0dGVyKHRoaXMubkNoKTtcbiAgICAgICAgdGhpcy5vdXQgPSB0aGlzLmN0eC5jcmVhdGVDaGFubmVsTWVyZ2VyKHRoaXMubkNoKTtcbiAgICAgICAgdGhpcy5nYWlucyA9IFtdO1xuICAgICAgICB0aGlzLnJlbWFwQXJyYXkgPSBbXTtcblxuICAgICAgICAvLyBnZXQgY2hhbm5lbCByZW1hcHBpbmcgdmFsdWVzIG9yZGVyIDAtMVxuICAgICAgICB0aGlzLnJlbWFwQXJyYXkucHVzaCgwLCAyLCAzLCAxKTsgLy8gbWFudWFsbHkgaGFuZGxlIHVudGlsIG9yZGVyIDFcblxuICAgICAgICAvLyBnZXQgY2hhbm5lbCByZW1hcHBpbmcgdmFsdWVzIG9yZGVyIDItTlxuICAgICAgICB2YXIgbyA9IDA7XG4gICAgICAgIHZhciBtO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubkNoOyBpKyspIHtcbiAgICAgICAgICAgIG0gPSBbXTtcbiAgICAgICAgICAgIGlmIChpID49IChvICsgMSkgKiAobyArIDEpKSB7XG4gICAgICAgICAgICAgICAgbyArPSAxO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSAobyArIDEpICogKG8gKyAxKTsgaiA8IChvICsgMikgKiAobyArIDIpOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCgoaiArIG8gJSAyKSAlIDIpID09IDApIHsgbS5wdXNoKGopIH0gZWxzZSB7IG0udW5zaGlmdChqKSB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMucmVtYXBBcnJheSA9IHRoaXMucmVtYXBBcnJheS5jb25jYXQobSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBjb25uZWN0IGlucHV0cy9vdXRwdXRzIChrZXB0IHNlcGFyYXRlZCBmb3IgY2xhcml0eSdzIHNha2UpXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5uQ2g7IGkrKykge1xuICAgICAgICAgICAgdGhpcy5nYWluc1tpXSA9IHRoaXMuY3R4LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgICAgIHRoaXMuaW4uY29ubmVjdCh0aGlzLmdhaW5zW2ldLCB0aGlzLnJlbWFwQXJyYXlbaV0sIDApO1xuICAgICAgICAgICAgdGhpcy5nYWluc1tpXS5jb25uZWN0KHRoaXMub3V0LCAwLCBpKTtcbiAgICAgICAgfVxuICAgIH1cbn1cbiJdfQ==