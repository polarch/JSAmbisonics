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
        key: "updateFilters",
        value: function updateFilters(audioBuffer) {
            // assign filters to convolvers
            for (var i = 0; i < this.nCh; i++) {
                this.decFilters[i] = this.ctx.createBuffer(1, audioBuffer.length, audioBuffer.sampleRate);
                this.decFilters[i].getChannelData(0).set(audioBuffer.getChannelData(i));

                this.decFilterNodes[i].buffer = this.decFilters[i];
            }
        }
    }, {
        key: "resetFilters",
        value: function resetFilters() {
            // overwrite decoding filters (plain cardioid virtual microphones)
            var cardGains = new Array(this.nCh);
            cardGains.fill(0);
            cardGains[0] = 0.5;
            cardGains[1] = 0.5 / Math.sqrt(3);
            for (var i = 0; i < this.nCh; i++) {
                this.decFilters[i] = this.ctx.createBuffer(1, 1, this.ctx.sampleRate);
                this.decFilters[i].getChannelData(0).set([cardGains[i]]);
                this.decFilterNodes[i].buffer = this.decFilters[i];
            }
        }
    }]);
    return binDecoder;
}();

exports.default = binDecoder;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFtYmktYmluYXVyYWxEZWNvZGVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQWlCcUIsVTtBQUVqQix3QkFBWSxRQUFaLEVBQXNCLEtBQXRCLEVBQTZCO0FBQUE7OztBQUV6QixhQUFLLFdBQUwsR0FBbUIsS0FBbkI7O0FBRUEsYUFBSyxHQUFMLEdBQVcsUUFBWDtBQUNBLGFBQUssS0FBTCxHQUFhLEtBQWI7QUFDQSxhQUFLLEdBQUwsR0FBVyxDQUFDLFFBQVEsQ0FBVCxLQUFlLFFBQVEsQ0FBdkIsQ0FBWDtBQUNBLGFBQUssVUFBTCxHQUFrQixJQUFJLEtBQUosQ0FBVSxLQUFLLEdBQWYsQ0FBbEI7QUFDQSxhQUFLLGNBQUwsR0FBc0IsSUFBSSxLQUFKLENBQVUsS0FBSyxHQUFmLENBQXRCOztBQUVBLGFBQUssRUFBTCxHQUFVLEtBQUssR0FBTCxDQUFTLHFCQUFULENBQStCLEtBQUssR0FBcEMsQ0FBVjtBQUNBLGFBQUssR0FBTCxHQUFXLEtBQUssR0FBTCxDQUFTLG1CQUFULENBQTZCLENBQTdCLENBQVg7O0FBRUEsYUFBSyxPQUFMLEdBQWUsS0FBSyxHQUFMLENBQVMsVUFBVCxFQUFmO0FBQ0EsYUFBSyxRQUFMLEdBQWdCLEtBQUssR0FBTCxDQUFTLFVBQVQsRUFBaEI7QUFDQSxhQUFLLFVBQUwsR0FBa0IsS0FBSyxHQUFMLENBQVMsVUFBVCxFQUFsQjtBQUNBLGFBQUssT0FBTCxDQUFhLElBQWIsQ0FBa0IsS0FBbEIsR0FBMEIsQ0FBMUI7QUFDQSxhQUFLLFFBQUwsQ0FBYyxJQUFkLENBQW1CLEtBQW5CLEdBQTJCLENBQTNCO0FBQ0EsYUFBSyxVQUFMLENBQWdCLElBQWhCLENBQXFCLEtBQXJCLEdBQTZCLENBQUMsQ0FBOUI7O0FBRUEsYUFBSyxJQUFJLElBQUksQ0FBYixFQUFnQixJQUFJLEtBQUssR0FBekIsRUFBOEIsR0FBOUIsRUFBbUM7QUFDL0IsaUJBQUssY0FBTCxDQUFv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dXJhbERlY29kZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gIEFyY2hvbnRpcyBQb2xpdGlzXG4vLyAgYXJjaG9udGlzLnBvbGl0aXNAYWFsdG8uZmlcbi8vICBEYXZpZCBQb2lyaWVyLVF1aW5vdFxuLy8gIGRhdmlwb2lyQGlyY2FtLmZyXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy9cbi8vICBXZWJBdWRpb19IT0EgYSBKYXZhU2NyaXB0IGxpYnJhcnkgZm9yIGhpZ2hlci1vcmRlciBBbWJpc29uaWNzXG4vLyAgVGhlIGxpYnJhcnkgaW1wbGVtZW50cyBXZWIgQXVkaW8gYmxvY2tzIHRoYXQgcGVyZm9ybVxuLy8gIHR5cGljYWwgYW1iaXNvbmljIHByb2Nlc3Npbmcgb3BlcmF0aW9ucyBvbiBhdWRpbyBzaWduYWxzLlxuLy9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vKiBIT0EgQklOQVVSQUwgREVDT0RFUiAqL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgYmluRGVjb2RlciB7XG5cbiAgICBjb25zdHJ1Y3RvcihhdWRpb0N0eCwgb3JkZXIpIHtcblxuICAgICAgICB0aGlzLmluaXRpYWxpemVkID0gZmFsc2U7XG5cbiAgICAgICAgdGhpcy5jdHggPSBhdWRpb0N0eDtcbiAgICAgICAgdGhpcy5vcmRlciA9IG9yZGVyO1xuICAgICAgICB0aGlzLm5DaCA9IChvcmRlciArIDEpICogKG9yZGVyICsgMSk7XG4gICAgICAgIHRoaXMuZGVjRmlsdGVycyA9IG5ldyBBcnJheSh0aGlzLm5DaCk7XG4gICAgICAgIHRoaXMuZGVjRmlsdGVyTm9kZXMgPSBuZXcgQXJyYXkodGhpcy5uQ2gpO1xuICAgICAgICAvLyBpbnB1dCBhbmQgb3V0cHV0IG5vZGVzXG4gICAgICAgIHRoaXMuaW4gPSB0aGlzLmN0eC5jcmVhdGVDaGFubmVsU3BsaXR0ZXIodGhpcy5uQ2gpO1xuICAgICAgICB0aGlzLm91dCA9IHRoaXMuY3R4LmNyZWF0ZUNoYW5uZWxNZXJnZXIoMik7XG4gICAgICAgIC8vIGRvd25taXhpbmcgZ2FpbnMgZm9yIGxlZnQgYW5kIHJpZ2h0IGVhcnNcbiAgICAgICAgdGhpcy5nYWluTWlkID0gdGhpcy5jdHguY3JlYXRlR2FpbigpO1xuICAgICAgICB0aGlzLmdhaW5TaWRlID0gdGhpcy5jdHguY3JlYXRlR2FpbigpO1xuICAgICAgICB0aGlzLmludmVydFNpZGUgPSB0aGlzLmN0eC5jcmVhdGVHYWluKCk7XG4gICAgICAgIHRoaXMuZ2Fpbk1pZC5nYWluLnZhbHVlID0gMTtcbiAgICAgICAgdGhpcy5nYWluU2lkZS5nYWluLnZhbHVlID0gMTtcbiAgICAgICAgdGhpcy5pbnZlcnRTaWRlLmdhaW4udmFsdWUgPSAtMTtcbiAgICAgICAgLy8gY29udm9sdmVyIG5vZGVzXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5uQ2g7IGkrKykge1xuICAgICAgICAgICAgdGhpcy5kZWNGaWx0ZXJOb2Rlc1tpXSA9IHRoaXMuY3R4LmNyZWF0ZUNvbnZvbHZlcigpO1xuICAgICAgICAgICAgdGhpcy5kZWNGaWx0ZXJOb2Rlc1tpXS5ub3JtYWxpemUgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICAvLyBpbml0aWFsaXplIGNvbnZvbHZlcnMgdG8gcGxhaW4gY2FyZGlvaWRzXG4gICAgICAgIHRoaXMucmVzZXRGaWx0ZXJzKCk7XG4gICAgICAgIC8vIGNyZWF0ZSBhdWRpbyBjb25uZWN0aW9uc1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubkNoOyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMuaW4uY29ubmVjdCh0aGlzLmRlY0ZpbHRlck5vZGVzW2ldLCBpLCAwKTtcbiAgICAgICAgICAgIHZhciBuID0gTWF0aC5mbG9vcihNYXRoLnNxcnQoaSkpO1xuICAgICAgICAgICAgdmFyIG0gPSBpIC0gbiAqIG4gLSBuO1xuICAgICAgICAgICAgaWYgKG0gPj0gMCkgdGhpcy5kZWNGaWx0ZXJOb2Rlc1tpXS5jb25uZWN0KHRoaXMuZ2Fpbk1pZCk7XG4gICAgICAgICAgICBlbHNlIHRoaXMuZGVjRmlsdGVyTm9kZXNbaV0uY29ubmVjdCh0aGlzLmdhaW5TaWRlKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmdhaW5NaWQuY29ubmVjdCh0aGlzLm91dCwgMCwgMCk7XG4gICAgICAgIHRoaXMuZ2FpblNpZGUuY29ubmVjdCh0aGlzLm91dCwgMCwgMCk7XG5cbiAgICAgICAgdGhpcy5nYWluTWlkLmNvbm5lY3QodGhpcy5vdXQsIDAsIDEpO1xuICAgICAgICB0aGlzLmdhaW5TaWRlLmNvbm5lY3QodGhpcy5pbnZlcnRTaWRlLCAwLCAwKTtcbiAgICAgICAgdGhpcy5pbnZlcnRTaWRlLmNvbm5lY3QodGhpcy5vdXQsIDAsIDEpO1xuXG4gICAgICAgIHRoaXMuaW5pdGlhbGl6ZWQgPSB0cnVlO1xuICAgIH1cblxuICAgIHVwZGF0ZUZpbHRlcnMoYXVkaW9CdWZmZXIpIHtcbiAgICAgICAgLy8gYXNzaWduIGZpbHRlcnMgdG8gY29udm9sdmVyc1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubkNoOyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMuZGVjRmlsdGVyc1tpXSA9IHRoaXMuY3R4LmNyZWF0ZUJ1ZmZlcigxLCBhdWRpb0J1ZmZlci5sZW5ndGgsIGF1ZGlvQnVmZmVyLnNhbXBsZVJhdGUpO1xuICAgICAgICAgICAgdGhpcy5kZWNGaWx0ZXJzW2ldLmdldENoYW5uZWxEYXRhKDApLnNldChhdWRpb0J1ZmZlci5nZXRDaGFubmVsRGF0YShpKSk7XG5cbiAgICAgICAgICAgIHRoaXMuZGVjRmlsdGVyTm9kZXNbaV0uYnVmZmVyID0gdGhpcy5kZWNGaWx0ZXJzW2ldO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmVzZXRGaWx0ZXJzKCkge1xuICAgICAgICAvLyBvdmVyd3JpdGUgZGVjb2RpbmcgZmlsdGVycyAocGxhaW4gY2FyZGlvaWQgdmlydHVhbCBtaWNyb3Bob25lcylcbiAgICAgICAgdmFyIGNhcmRHYWlucyA9IG5ldyBBcnJheSh0aGlzLm5DaCk7XG4gICAgICAgIGNhcmRHYWlucy5maWxsKDApO1xuICAgICAgICBjYXJkR2FpbnNbMF0gPSAwLjU7XG4gICAgICAgIGNhcmRHYWluc1sxXSA9IDAuNSAvIE1hdGguc3FydCgzKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm5DaDsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLmRlY0ZpbHRlcnNbaV0gPSB0aGlzLmN0eC5jcmVhdGVCdWZmZXIoMSwgMSwgdGhpcy5jdHguc2FtcGxlUmF0ZSk7XG4gICAgICAgICAgICB0aGlzLmRlY0ZpbHRlcnNbaV0uZ2V0Q2hhbm5lbERhdGEoMCkuc2V0KFtjYXJkR2FpbnNbaV1dKTtcbiAgICAgICAgICAgIHRoaXMuZGVjRmlsdGVyTm9kZXNbaV0uYnVmZmVyID0gdGhpcy5kZWNGaWx0ZXJzW2ldO1xuICAgICAgICB9XG4gICAgfVxufVxuIl19