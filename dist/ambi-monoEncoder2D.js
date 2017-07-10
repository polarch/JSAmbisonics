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
//
//  monoEncoder for 2D use
//  adapted by Thomas Deppisch
//  thomas.deppisch93@gmail.com
//
////////////////////////////////////////////////////////////////////
////////////////////
/* HOA 2D ENCODER */
///////////////////

var utils = require("./utils.js");

var monoEncoder2D = function () {
    function monoEncoder2D(audioCtx, order) {
        (0, _classCallCheck3.default)(this, monoEncoder2D);


        this.initialized = false;

        this.ctx = audioCtx;
        this.order = order;
        this.nCh = 2 * order + 1;
        this.azim = 0;
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

    (0, _createClass3.default)(monoEncoder2D, [{
        key: 'updateGains',
        value: function updateGains() {
            var N = this.order;
            var g_enc = getCircHarmonics(N, [this.azim]);

            for (var i = 0; i < this.nCh; i++) {
                this.gainNodes[i].gain.value = g_enc[i][0] * this.interpolationFactor;
            }
        }
    }]);
    return monoEncoder2D;
}();

exports.default = monoEncoder2D;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImhyaXItbG9hZGVyMkRfbG9jYWwuanMiXSwibmFtZXMiOlsidXRpbHMiLCJyZXF1aXJlIiwibW9ub0VuY29kZXIyRCIsImF1ZGlvQ3R4Iiwib3JkZXIiLCJpbml0aWFsaXplZCIsImN0eCIsIm5DaCIsImF6aW0iLCJlbGV2IiwiZ2FpbnMiLCJBcnJheSIsImdhaW5Ob2RlcyIsImluIiwiY3JlYXRlR2FpbiIsImNoYW5uZWxDb3VudE1vZGUiLCJjaGFubmVsQ291bnQiLCJvdXQiLCJjcmVhdGVDaGFubmVsTWVyZ2VyIiwiaSIsInVwZGF0ZUdhaW5zIiwiY29ubmVjdCIsIk4iLCJnX2VuYyIsImdldENpcmNIYXJtb25pY3MiLCJnYWluIiwidmFsdWUiLCJpbnRlcnBvbGF0aW9uRmFjdG9yIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLElBQUlBLFFBQVFDLFFBQVEsWUFBUixDQUFaOztJQUVxQkMsYTtBQUVqQiwyQkFBWUMsUUFBWixFQUFzQkMsS0FBdEIsRUFBNkI7QUFBQTs7O0FBRXpCLGFBQUtDLFdBQUwsR0FBbUIsS0FBbkI7O0FBRUEsYUFBS0MsR0FBTCxHQUFXSCxRQUFYO0FBQ0EsYUFBS0MsS0FBTCxHQUFhQSxLQUFiO0FBQ0EsYUFBS0csR0FBTCxHQUFXLElBQUVILEtBQUYsR0FBVSxDQUFyQjtBQUNBLGFBQUtJLElBQUwsR0FBWSxDQUFaO0FBQ0EsYUFBS0MsSUFBTCxHQUFZLENBQVo7QUFDQSxhQUFLQyxLQUFMLEdBQWEsSUFBSUMsS0FBSixDQUFVLEtBQUtKLEdBQWYsQ0FBYjtBQUNBLGFBQUtLLFNBQUwsR0FBaUIsSUFBSUQsS0FBSixDQUFVLEtBQUtKLEdBQWYsQ0FBakI7QUFDQSxhQUFLTSxFQUFMLEdBQVUsS0FBS1AsR0FBTCxDQUFTUSxVQUFULEVBQVY7QUFDQSxhQUFLRCxFQUFMLENBQVFFLGdCQUFSLEdBQTJCLFVBQTNCO0FBQ0EsYUFBS0YsRUFBTCxDQUFRRyxZQUFSLEdBQXVCLENBQXZCO0FBQ0EsYUFBS0MsR0FBTCxHQUFXLEtBQUtYLEdBQUwsQ0FBU1ksbUJBQVQsQ0FBNkIsS0FBS1gsR0FBbEMsQ0FBWDtBQUNBO0FBQ0EsYUFBSyxJQUFJWSxJQUFJLENBQWIsRUFBZ0JBLElBQUksS0FBS1osR0FBekIsRUFBOEJZLEdBQTlCLEVBQW1DO0FBQy9CLGlCQUFLUCxTQUFMLENBQWVPLENBQWYsSUFBb0IsS0FBS2IsR0FBTCxDQUFTUSxVQUFULEVBQXBCO0FBQ0EsaUJBQUtGLFNBQUwsQ0FBZU8sQ0FBZixFQUFrQkosZ0JBQWxCLEdBQXFDLFVBQXJDO0FBQ0EsaUJBQUtILFNBQUwsQ0FBZU8sQ0FBZixFQUFrQkgsWUFBbEIsR0FBaUMsQ0FBakM7QUFDSDtBQUNELGFBQUtJLFdBQUw7QUFDQTtBQUNBLGFBQUssSUFBSUQsSUFBSSxDQUFiLEVBQWdCQSxJQUFJLEtBQUtaLEdBQXpCLEVBQThCWSxHQUE5QixFQUFtQztBQUMvQixpQkFBS04sRUFBTCxDQUFRUSxPQUFSLENBQWdCLEtBQUtULFNBQUwsQ0FBZU8sQ0FBZixDQUFoQjtBQUNBLGlCQUFLUCxTQUFMLENBQWVPLENBQWYsRUFBa0JFLE9BQWxCLENBQTBCLEtBQUtKLEdBQS9CLEVBQW9DLENBQXBDLEVBQXVDRSxDQUF2QztBQUNIOztBQUVELGFBQUtkLFdBQUwsR0FBbUIsSUFBbkI7QUFDSDs7OztzQ0FFYTtBQUNWLGdCQUFJaUIsSUFBSSxLQUFLbEIsS0FBYjtBQUNBLGdCQUFJbUIsUUFBUUMsaUJBQWlCRixDQUFqQixFQUFvQixDQUFDLEtBQUtkLElBQU4sQ0FBcEIsQ0FBWjs7QUFFQSxpQkFBSyxJQUFJVyxJQUFJLENBQWIsRUFBZ0JBLElBQUksS0FBS1osR0FBekIsRUFBOEJZLEdBQTlCLEVBQW1DO0FBQy9CLHFCQUFLUCxTQUFMLENBQWVPLENBQWYsRUFBa0JNLElBQWxCLENBQXVCQyxLQUF2QixHQUErQkgsTUFBTUosQ0FBTixFQUFTLENBQVQsSUFBYyxLQUFLUSxtQkFBbEQ7QUFDSDtBQUNKOzs7OztrQkF4Q2dCekIsYSIsImZpbGUiOiJocmlyLWxvYWRlcjJEX2xvY2FsLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vICBBcmNob250aXMgUG9saXRpc1xuLy8gIGFyY2hvbnRpcy5wb2xpdGlzQGFhbHRvLmZpXG4vLyAgRGF2aWQgUG9pcmllci1RdWlub3Rcbi8vICBkYXZpcG9pckBpcmNhbS5mclxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vXG4vLyAgSlNBbWJpc29uaWNzIGEgSmF2YVNjcmlwdCBsaWJyYXJ5IGZvciBoaWdoZXItb3JkZXIgQW1iaXNvbmljc1xuLy8gIFRoZSBsaWJyYXJ5IGltcGxlbWVudHMgV2ViIEF1ZGlvIGJsb2NrcyB0aGF0IHBlcmZvcm1cbi8vICB0eXBpY2FsIGFtYmlzb25pYyBwcm9jZXNzaW5nIG9wZXJhdGlvbnMgb24gYXVkaW8gc2lnbmFscy5cbi8vXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy9cbi8vICBtb25vRW5jb2RlciBmb3IgMkQgdXNlXG4vLyAgYWRhcHRlZCBieSBUaG9tYXMgRGVwcGlzY2hcbi8vICB0aG9tYXMuZGVwcGlzY2g5M0BnbWFpbC5jb21cbi8vXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8qIEhPQSAyRCBFTkNPREVSICovXG4vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbnZhciB1dGlscyA9IHJlcXVpcmUoXCIuL3V0aWxzLmpzXCIpO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBtb25vRW5jb2RlcjJEIHtcblxuICAgIGNvbnN0cnVjdG9yKGF1ZGlvQ3R4LCBvcmRlcikge1xuXG4gICAgICAgIHRoaXMuaW5pdGlhbGl6ZWQgPSBmYWxzZTtcblxuICAgICAgICB0aGlzLmN0eCA9IGF1ZGlvQ3R4O1xuICAgICAgICB0aGlzLm9yZGVyID0gb3JkZXI7XG4gICAgICAgIHRoaXMubkNoID0gMipvcmRlciArIDE7XG4gICAgICAgIHRoaXMuYXppbSA9IDA7XG4gICAgICAgIHRoaXMuZWxldiA9IDA7XG4gICAgICAgIHRoaXMuZ2FpbnMgPSBuZXcgQXJyYXkodGhpcy5uQ2gpO1xuICAgICAgICB0aGlzLmdhaW5Ob2RlcyA9IG5ldyBBcnJheSh0aGlzLm5DaCk7XG4gICAgICAgIHRoaXMuaW4gPSB0aGlzLmN0eC5jcmVhdGVHYWluKCk7XG4gICAgICAgIHRoaXMuaW4uY2hhbm5lbENvdW50TW9kZSA9ICdleHBsaWNpdCc7XG4gICAgICAgIHRoaXMuaW4uY2hhbm5lbENvdW50ID0gMTtcbiAgICAgICAgdGhpcy5vdXQgPSB0aGlzLmN0eC5jcmVhdGVDaGFubmVsTWVyZ2VyKHRoaXMubkNoKTtcbiAgICAgICAgLy8gSW5pdGlhbGl6ZSBlbmNvZGluZyBnYWluc1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubkNoOyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMuZ2Fpbk5vZGVzW2ldID0gdGhpcy5jdHguY3JlYXRlR2FpbigpO1xuICAgICAgICAgICAgdGhpcy5nYWluTm9kZXNbaV0uY2hhbm5lbENvdW50TW9kZSA9ICdleHBsaWNpdCc7XG4gICAgICAgICAgICB0aGlzLmdhaW5Ob2Rlc1tpXS5jaGFubmVsQ291bnQgPSAxO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMudXBkYXRlR2FpbnMoKTtcbiAgICAgICAgLy8gTWFrZSBhdWRpbyBjb25uZWN0aW9uc1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubkNoOyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMuaW4uY29ubmVjdCh0aGlzLmdhaW5Ob2Rlc1tpXSk7XG4gICAgICAgICAgICB0aGlzLmdhaW5Ob2Rlc1tpXS5jb25uZWN0KHRoaXMub3V0LCAwLCBpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuaW5pdGlhbGl6ZWQgPSB0cnVlO1xuICAgIH1cblxuICAgIHVwZGF0ZUdhaW5zKCkge1xuICAgICAgICB2YXIgTiA9IHRoaXMub3JkZXI7XG4gICAgICAgIHZhciBnX2VuYyA9IGdldENpcmNIYXJtb25pY3MoTiwgW3RoaXMuYXppbV0pO1xuXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5uQ2g7IGkrKykge1xuICAgICAgICAgICAgdGhpcy5nYWluTm9kZXNbaV0uZ2Fpbi52YWx1ZSA9IGdfZW5jW2ldWzBdICogdGhpcy5pbnRlcnBvbGF0aW9uRmFjdG9yO1xuICAgICAgICB9XG4gICAgfVxufVxuIl19