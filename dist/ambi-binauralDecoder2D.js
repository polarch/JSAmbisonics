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
////////////////////////////////////////////////////////////////////
//
//  binDecoder for 2D use
//  adapted by Thomas Deppisch
//  thomas.deppisch93@gmail.com
//
////////////////////////////////////////////////////////////////////
/////////////////////////////
/* HOA BINAURAL DECODER 2D */
/////////////////////////////

var binDecoder2D = function () {
    function binDecoder2D(audioCtx, order) {
        (0, _classCallCheck3.default)(this, binDecoder2D);


        this.initialized = false;

        this.ctx = audioCtx;
        this.order = order;
        this.nCh = 2 * order + 1;
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
            if (i % 2 == 0) this.decFilterNodes[i].connect(this.gainMid); //even numbers to mid signal
            else this.decFilterNodes[i].connect(this.gainSide); //odd numbers to side signal
        }
        this.gainMid.connect(this.out, 0, 0);
        this.gainSide.connect(this.out, 0, 0);

        this.gainMid.connect(this.out, 0, 1);
        this.gainSide.connect(this.invertSide, 0, 0);
        this.invertSide.connect(this.out, 0, 1);

        this.initialized = true;
    }

    (0, _createClass3.default)(binDecoder2D, [{
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
    return binDecoder2D;
}();

exports.default = binDecoder2D;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFtYmktYmluYXVyYWxEZWNvZGVyMkQuanMiXSwibmFtZXMiOlsiYmluRGVjb2RlcjJEIiwiYXVkaW9DdHgiLCJvcmRlciIsImluaXRpYWxpemVkIiwiY3R4IiwibkNoIiwiZGVjRmlsdGVycyIsIkFycmF5IiwiZGVjRmlsdGVyTm9kZXMiLCJpbiIsImNyZWF0ZUNoYW5uZWxTcGxpdHRlciIsIm91dCIsImNyZWF0ZUNoYW5uZWxNZXJnZXIiLCJjaGFubmVsQ291bnRNb2RlIiwiY2hhbm5lbENvdW50IiwiZ2Fpbk1pZCIsImNyZWF0ZUdhaW4iLCJnYWluU2lkZSIsImludmVydFNpZGUiLCJnYWluIiwidmFsdWUiLCJpIiwiY3JlYXRlQ29udm9sdmVyIiwibm9ybWFsaXplIiwicmVzZXRGaWx0ZXJzIiwiY29ubmVjdCIsImF1ZGlvQnVmZmVyIiwiY3JlYXRlQnVmZmVyIiwibGVuZ3RoIiwic2FtcGxlUmF0ZSIsImdldENoYW5uZWxEYXRhIiwic2V0IiwiYnVmZmVyIiwiY2FyZEdhaW5zIiwiZmlsbCIsIk1hdGgiLCJzcXJ0IiwiaiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7OztBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztJQUVxQkEsWTtBQUVqQiwwQkFBWUMsUUFBWixFQUFzQkMsS0FBdEIsRUFBNkI7QUFBQTs7O0FBRXpCLGFBQUtDLFdBQUwsR0FBbUIsS0FBbkI7O0FBRUEsYUFBS0MsR0FBTCxHQUFXSCxRQUFYO0FBQ0EsYUFBS0MsS0FBTCxHQUFhQSxLQUFiO0FBQ0EsYUFBS0csR0FBTCxHQUFXLElBQUVILEtBQUYsR0FBVSxDQUFyQjtBQUNBLGFBQUtJLFVBQUwsR0FBa0IsSUFBSUMsS0FBSixDQUFVLEtBQUtGLEdBQWYsQ0FBbEI7QUFDQSxhQUFLRyxjQUFMLEdBQXNCLElBQUlELEtBQUos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dXJhbERlY29kZXIyRC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyAgQXJjaG9udGlzIFBvbGl0aXNcbi8vICBhcmNob250aXMucG9saXRpc0BhYWx0by5maVxuLy8gIERhdmlkIFBvaXJpZXItUXVpbm90XG4vLyAgZGF2aXBvaXJAaXJjYW0uZnJcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vL1xuLy8gIEpTQW1iaXNvbmljcyBhIEphdmFTY3JpcHQgbGlicmFyeSBmb3IgaGlnaGVyLW9yZGVyIEFtYmlzb25pY3Ncbi8vICBUaGUgbGlicmFyeSBpbXBsZW1lbnRzIFdlYiBBdWRpbyBibG9ja3MgdGhhdCBwZXJmb3JtXG4vLyAgdHlwaWNhbCBhbWJpc29uaWMgcHJvY2Vzc2luZyBvcGVyYXRpb25zIG9uIGF1ZGlvIHNpZ25hbHMuXG4vL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vL1xuLy8gIGJpbkRlY29kZXIgZm9yIDJEIHVzZVxuLy8gIGFkYXB0ZWQgYnkgVGhvbWFzIERlcHBpc2NoXG4vLyAgdGhvbWFzLmRlcHBpc2NoOTNAZ21haWwuY29tXG4vL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vKiBIT0EgQklOQVVSQUwgREVDT0RFUiAyRCAqL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgYmluRGVjb2RlcjJEIHtcblxuICAgIGNvbnN0cnVjdG9yKGF1ZGlvQ3R4LCBvcmRlcikge1xuXG4gICAgICAgIHRoaXMuaW5pdGlhbGl6ZWQgPSBmYWxzZTtcblxuICAgICAgICB0aGlzLmN0eCA9IGF1ZGlvQ3R4O1xuICAgICAgICB0aGlzLm9yZGVyID0gb3JkZXI7XG4gICAgICAgIHRoaXMubkNoID0gMipvcmRlciArIDE7XG4gICAgICAgIHRoaXMuZGVjRmlsdGVycyA9IG5ldyBBcnJheSh0aGlzLm5DaCk7XG4gICAgICAgIHRoaXMuZGVjRmlsdGVyTm9kZXMgPSBuZXcgQXJyYXkodGhpcy5uQ2gpO1xuICAgICAgICAvLyBpbnB1dCBhbmQgb3V0cHV0IG5vZGVzXG4gICAgICAgIHRoaXMuaW4gPSB0aGlzLmN0eC5jcmVhdGVDaGFubmVsU3BsaXR0ZXIodGhpcy5uQ2gpO1xuICAgICAgICB0aGlzLm91dCA9IHRoaXMuY3R4LmNyZWF0ZUNoYW5uZWxNZXJnZXIoMik7XG4gICAgICAgIHRoaXMub3V0LmNoYW5uZWxDb3VudE1vZGUgPSAnZXhwbGljaXQnO1xuICAgICAgICB0aGlzLm91dC5jaGFubmVsQ291bnQgPSAxO1xuICAgICAgICAvLyBkb3dubWl4aW5nIGdhaW5zIGZvciBsZWZ0IGFuZCByaWdodCBlYXJzXG4gICAgICAgIHRoaXMuZ2Fpbk1pZCA9IHRoaXMuY3R4LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgdGhpcy5nYWluU2lkZSA9IHRoaXMuY3R4LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgdGhpcy5pbnZlcnRTaWRlID0gdGhpcy5jdHguY3JlYXRlR2FpbigpO1xuICAgICAgICB0aGlzLmdhaW5NaWQuZ2Fpbi52YWx1ZSA9IDE7XG4gICAgICAgIHRoaXMuZ2FpblNpZGUuZ2Fpbi52YWx1ZSA9IDE7XG4gICAgICAgIHRoaXMuaW52ZXJ0U2lkZS5nYWluLnZhbHVlID0gLTE7XG4gICAgICAgIC8vIGNvbnZvbHZlciBub2Rlc1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubkNoOyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMuZGVjRmlsdGVyTm9kZXNbaV0gPSB0aGlzLmN0eC5jcmVhdGVDb252b2x2ZXIoKTtcbiAgICAgICAgICAgIHRoaXMuZGVjRmlsdGVyTm9kZXNbaV0ubm9ybWFsaXplID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgLy8gaW5pdGlhbGl6ZSBjb252b2x2ZXJzIHRvIHBsYWluIGNhcmRpb2lkc1xuICAgICAgICB0aGlzLnJlc2V0RmlsdGVycygpO1xuICAgICAgICAvLyBjcmVhdGUgYXVkaW8gY29ubmVjdGlvbnNcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm5DaDsgaSsrKSB7XG4gICAgICAgICAgdGhpcy5pbi5jb25uZWN0KHRoaXMuZGVjRmlsdGVyTm9kZXNbaV0sIGksIDApO1xuICAgICAgICAgIGlmICgoaSUyKSA9PSAwKSB0aGlzLmRlY0ZpbHRlck5vZGVzW2ldLmNvbm5lY3QodGhpcy5nYWluTWlkKTsgLy9ldmVuIG51bWJlcnMgdG8gbWlkIHNpZ25hbFxuICAgICAgICAgIGVsc2UgdGhpcy5kZWNGaWx0ZXJOb2Rlc1tpXS5jb25uZWN0KHRoaXMuZ2FpblNpZGUpOyAvL29kZCBudW1iZXJzIHRvIHNpZGUgc2lnbmFsXG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5nYWluTWlkLmNvbm5lY3QodGhpcy5vdXQsIDAsIDApO1xuICAgICAgICB0aGlzLmdhaW5TaWRlLmNvbm5lY3QodGhpcy5vdXQsIDAsIDApO1xuXG4gICAgICAgIHRoaXMuZ2Fpbk1pZC5jb25uZWN0KHRoaXMub3V0LCAwLCAxKTtcbiAgICAgICAgdGhpcy5nYWluU2lkZS5jb25uZWN0KHRoaXMuaW52ZXJ0U2lkZSwgMCwgMCk7XG4gICAgICAgIHRoaXMuaW52ZXJ0U2lkZS5jb25uZWN0KHRoaXMub3V0LCAwLCAxKTtcblxuICAgICAgICB0aGlzLmluaXRpYWxpemVkID0gdHJ1ZTtcbiAgICB9XG5cbiAgICB1cGRhdGVGaWx0ZXJzKGF1ZGlvQnVmZmVyKSB7XG4gICAgICAgIC8vIGFzc2lnbiBmaWx0ZXJzIHRvIGNvbnZvbHZlcnNcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm5DaDsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLmRlY0ZpbHRlcnNbaV0gPSB0aGlzLmN0eC5jcmVhdGVCdWZmZXIoMSwgYXVkaW9CdWZmZXIubGVuZ3RoLCBhdWRpb0J1ZmZlci5zYW1wbGVSYXRlKTtcbiAgICAgICAgICAgIHRoaXMuZGVjRmlsdGVyc1tpXS5nZXRDaGFubmVsRGF0YSgwKS5zZXQoYXVkaW9CdWZmZXIuZ2V0Q2hhbm5lbERhdGEoaSkpO1xuXG4gICAgICAgICAgICB0aGlzLmRlY0ZpbHRlck5vZGVzW2ldLmJ1ZmZlciA9IHRoaXMuZGVjRmlsdGVyc1tpXTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJlc2V0RmlsdGVycygpIHtcbiAgICAgICAgLy8gb3ZlcndyaXRlIGRlY29kaW5nIGZpbHRlcnMgKHBsYWluIGNhcmRpb2lkIHZpcnR1YWwgbWljcm9waG9uZXMpXG4gICAgICAgIHZhciBjYXJkR2FpbnMgPSBuZXcgQXJyYXkodGhpcy5uQ2gpO1xuICAgICAgICBjYXJkR2FpbnMuZmlsbCgwKTtcbiAgICAgICAgY2FyZEdhaW5zWzBdID0gMC41O1xuICAgICAgICBjYXJkR2FpbnNbMV0gPSAwLjUgLyBNYXRoLnNxcnQoMyk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5uQ2g7IGkrKykge1xuICAgICAgICAgICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICAgICAgICAvLyBUaGlzIHdvcmtzIGZvciBDaHJvbWUgYW5kIEZpcmVmb3g6XG4gICAgICAgICAgICAvLyB0aGlzLmRlY0ZpbHRlcnNbaV0gPSB0aGlzLmN0eC5jcmVhdGVCdWZmZXIoMSwgMSwgdGhpcy5jdHguc2FtcGxlUmF0ZSk7XG4gICAgICAgICAgICAvLyB0aGlzLmRlY0ZpbHRlcnNbaV0uZ2V0Q2hhbm5lbERhdGEoMCkuc2V0KFtjYXJkR2FpbnNbaV1dKTtcbiAgICAgICAgICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgICAgICAgLy8gU2FmYXJpIGZvcmNlcyB1cyB0byB1c2UgdGhpczpcbiAgICAgICAgICAgIHRoaXMuZGVjRmlsdGVyc1tpXSA9IHRoaXMuY3R4LmNyZWF0ZUJ1ZmZlcigxLCA2NCwgdGhpcy5jdHguc2FtcGxlUmF0ZSk7XG4gICAgICAgICAgICAvLyBhbmQgd2lsbCBzZW5kIGdvcmdlb3VzIGNyYW5ja3kgbm9pc2UgYnVyc3RzIGZvciBhbnkgdmFsdWUgYmVsb3cgNjRcbiAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgNjQ7IGorKykge1xuICAgICAgICAgICAgICAgIHRoaXMuZGVjRmlsdGVyc1tpXS5nZXRDaGFubmVsRGF0YSgwKVtqXSA9IDAuMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuZGVjRmlsdGVyc1tpXS5nZXRDaGFubmVsRGF0YSgwKVswXSA9IGNhcmRHYWluc1tpXTtcbiAgICAgICAgICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgICAgICAgdGhpcy5kZWNGaWx0ZXJOb2Rlc1tpXS5idWZmZXIgPSB0aGlzLmRlY0ZpbHRlcnNbaV07XG4gICAgICAgIH1cbiAgICB9XG59XG4iXX0=