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

//////////////////////
/* B_FORMAT ENCODER */
//////////////////////

var Bformat_encoder = function () {
    function Bformat_encoder(audioCtx) {
        (0, _classCallCheck3.default)(this, Bformat_encoder);


        this.initialized = false;

        this.ctx = audioCtx;
        this.azi = 0;
        this.elev = 0;
        this.gainNodes = new Array(4);
        this.in = this.ctx.createGain();
        //    this.in.channelCountMode = 'explicit';
        //    this.in.channelCount = 1;
        this.out = this.ctx.createChannelMerger(4);
        // initialize gains to front direction
        this.gains = [Math.SQRT1_2, 1, 0, 0];
        for (var i = 0; i < 4; i++) {
            this.gainNodes[i] = this.ctx.createGain();
            //        this.gainNodes[i].channelCountMode = 'explicit';
            //        this.gainNodes[i].channelCount = 1;
            this.gainNodes[i].gain.value = this.gains[i];
        }

        // Create connections
        for (var _i = 0; _i < 4; _i++) {
            this.in.connect(this.gainNodes[_i]);
            this.gainNodes[_i].connect(this.out, 0, _i);
        }

        this.initialized = true;
    }

    (0, _createClass3.default)(Bformat_encoder, [{
        key: "updateGains",
        value: function updateGains() {
            var azi = this.azi * Math.PI / 180;
            var elev = this.elev * Math.PI / 180;

            this.gains[1] = Math.cos(azi) * Math.cos(elev);
            this.gains[2] = Math.sin(azi) * Math.cos(elev);
            this.gains[3] = Math.sin(elev);

            for (var i = 1; i < 4; i++) {
                this.gainNodes[i].gain.value = this.gains[i];
            }
        }
    }]);
    return Bformat_encoder;
}();

exports.default = Bformat_encoder;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZvYS1lbmNvZGVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQWlCcUIsZTtBQUVqQiw2QkFBWSxRQUFaLEVBQXNCO0FBQUE7OztBQUVsQixhQUFLLFdBQUwsR0FBbUIsS0FBbkI7O0FBRUEsYUFBSyxHQUFMLEdBQVcsUUFBWDtBQUNBLGFBQUssR0FBTCxHQUFXLENBQVg7QUFDQSxhQUFLLElBQUwsR0FBWSxDQUFaO0FBQ0EsYUFBSyxTQUFMLEdBQWlCLElBQUksS0FBSixDQUFVLENBQVYsQ0FBakI7QUFDQSxhQUFLLEVBQUwsR0FBVSxLQUFLLEdBQUwsQ0FBUyxVQUFULEVBQVY7OztBQUdBLGFBQUssR0FBTCxHQUFXLEtBQUssR0FBTCxDQUFTLG1CQUFULENBQTZCLENBQTdCLENBQVg7O0FBRUEsYUFBSyxLQUFMLEdBQWEsQ0FBQyxLQUFLLE9BQU4sRUFBZSxDQUFmLEVBQWtCLENBQWxCLEVBQXFCLENBQXJCLENBQWI7QUFDQSxhQUFLLElBQUksSUFBSSxDQUFiLEVBQWdCLElBQUksQ0FBcEIsRUFBdUIsR0FBdkIsRUFBNEI7QUFDeEIsaUJBQUssU0FBTCxDQUFlLENBQWYsSUFBb0IsS0FBSyxHQUFMLENBQVMsVUFBVCxFQUFwQjs7O0FBR0EsaUJBQUssU0FBTCxDQUFlLENBQWYsRUFBa0IsSUFBbEIsQ0FBdUIsS0FBdkIsR0FBK0IsS0FBSyxLQUFMLENBQVcsQ0FBWCxDQUEvQjtBQUNIOzs7QUFHRCxhQUFLLElBQUksS0FBSSxDQUFiLEVBQWdCLEtBQUksQ0FBcEIsRUFBdUIsSUFBdkIsRUFBNEI7QUFDeEIsaUJBQUssRUFBTCxDQUFRLE9BQVIsQ0FBZ0IsS0FBSyxTQUFMLENBQWUsRUFBZixDQUFoQjtBQUNBLGlCQUFLLFNBQUwsQ0FBZSxFQUFmLEVBQWtCLE9BQWxCLENBQTBCLEtBQUssR0FBL0IsRUFBb0MsQ0FBcEMsRUFBdUMsRUFBdkM7QUFDSDs7QUFFRCxhQUFLLFdBQUwsR0FBbUIsSUFBbkI7QUFDSDs7OztzQ0FFYTtBQUNWLGdCQUFJLE1BQU0sS0FBSyxHQUFMLEdBQVcsS0FBSyxFQUFoQixHQUFxQixHQUEvQjtBQUNBLGdCQUFJLE9BQU8sS0FBSyxJQUFMLEdBQVksS0FBSyxFQUFqQixHQUFzQixHQUFqQzs7QUFFQSxpQkFBSyxLQUFMLENBQVcsQ0FBWCxJQUFnQixLQUFLLEdBQUwsQ0FBUyxHQUFULElBQWdCLEtBQUssR0FBTCxDQUFTLElBQVQsQ0FBaEM7QUFDQSxpQkFBSyxLQUFMLENBQVcsQ0FBWCxJQUFnQixLQUFLLEdBQUwsQ0FBUyxHQUFULElBQWdCLEtBQUssR0FBTCxDQUFTLElBQVQsQ0FBaEM7QUFDQSxpQkFBSyxLQUFMLENBQVcsQ0FBWCxJQUFnQixLQUFLLEdBQUwsQ0FBUyxJQUFULENBQWhCOztBQUVBLGlCQUFLLElBQUksSUFBSSxDQUFiLEVBQWdCLElBQUksQ0FBcEIsRUFBdUIsR0FBdkIsRUFBNEI7QUFDeEIscUJBQUssU0FBTCxDQUFlLENBQWYsRUFBa0IsSUFBbEIsQ0FBdUIsS0FBdkIsR0FBK0IsS0FBSyxLQUFMLENBQVcsQ0FBWCxDQUEvQjtBQUNIO0FBQ0o7Ozs7O2tCQTNDZ0IsZSIsImZpbGUiOiJmb2EtZW5jb2Rlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyAgQXJjaG9udGlzIFBvbGl0aXNcbi8vICBhcmNob250aXMucG9saXRpc0BhYWx0by5maVxuLy8gIERhdmlkIFBvaXJpZXItUXVpbm90XG4vLyAgZGF2aXBvaXJAaXJjYW0uZnJcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vL1xuLy8gIFdlYkF1ZGlvX0hPQSBhIEphdmFTY3JpcHQgbGlicmFyeSBmb3IgaGlnaGVyLW9yZGVyIEFtYmlzb25pY3Ncbi8vICBUaGUgbGlicmFyeSBpbXBsZW1lbnRzIFdlYiBBdWRpbyBibG9ja3MgdGhhdCBwZXJmb3JtXG4vLyAgdHlwaWNhbCBhbWJpc29uaWMgcHJvY2Vzc2luZyBvcGVyYXRpb25zIG9uIGF1ZGlvIHNpZ25hbHMuXG4vL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLyogQl9GT1JNQVQgRU5DT0RFUiAqL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBCZm9ybWF0X2VuY29kZXIge1xuXG4gICAgY29uc3RydWN0b3IoYXVkaW9DdHgpIHtcblxuICAgICAgICB0aGlzLmluaXRpYWxpemVkID0gZmFsc2U7XG5cbiAgICAgICAgdGhpcy5jdHggPSBhdWRpb0N0eDtcbiAgICAgICAgdGhpcy5hemkgPSAwO1xuICAgICAgICB0aGlzLmVsZXYgPSAwO1xuICAgICAgICB0aGlzLmdhaW5Ob2RlcyA9IG5ldyBBcnJheSg0KTtcbiAgICAgICAgdGhpcy5pbiA9IHRoaXMuY3R4LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgLy8gICAgdGhpcy5pbi5jaGFubmVsQ291bnRNb2RlID0gJ2V4cGxpY2l0JztcbiAgICAgICAgLy8gICAgdGhpcy5pbi5jaGFubmVsQ291bnQgPSAxO1xuICAgICAgICB0aGlzLm91dCA9IHRoaXMuY3R4LmNyZWF0ZUNoYW5uZWxNZXJnZXIoNCk7XG4gICAgICAgIC8vIGluaXRpYWxpemUgZ2FpbnMgdG8gZnJvbnQgZGlyZWN0aW9uXG4gICAgICAgIHRoaXMuZ2FpbnMgPSBbTWF0aC5TUVJUMV8yLCAxLCAwLCAwXTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCA0OyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMuZ2Fpbk5vZGVzW2ldID0gdGhpcy5jdHguY3JlYXRlR2FpbigpO1xuICAgICAgICAgICAgLy8gICAgICAgIHRoaXMuZ2Fpbk5vZGVzW2ldLmNoYW5uZWxDb3VudE1vZGUgPSAnZXhwbGljaXQnO1xuICAgICAgICAgICAgLy8gICAgICAgIHRoaXMuZ2Fpbk5vZGVzW2ldLmNoYW5uZWxDb3VudCA9IDE7XG4gICAgICAgICAgICB0aGlzLmdhaW5Ob2Rlc1tpXS5nYWluLnZhbHVlID0gdGhpcy5nYWluc1tpXTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENyZWF0ZSBjb25uZWN0aW9uc1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IDQ7IGkrKykge1xuICAgICAgICAgICAgdGhpcy5pbi5jb25uZWN0KHRoaXMuZ2Fpbk5vZGVzW2ldKTtcbiAgICAgICAgICAgIHRoaXMuZ2Fpbk5vZGVzW2ldLmNvbm5lY3QodGhpcy5vdXQsIDAsIGkpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5pbml0aWFsaXplZCA9IHRydWU7XG4gICAgfVxuXG4gICAgdXBkYXRlR2FpbnMoKSB7XG4gICAgICAgIGxldCBhemkgPSB0aGlzLmF6aSAqIE1hdGguUEkgLyAxODA7XG4gICAgICAgIGxldCBlbGV2ID0gdGhpcy5lbGV2ICogTWF0aC5QSSAvIDE4MDtcblxuICAgICAgICB0aGlzLmdhaW5zWzFdID0gTWF0aC5jb3MoYXppKSAqIE1hdGguY29zKGVsZXYpO1xuICAgICAgICB0aGlzLmdhaW5zWzJdID0gTWF0aC5zaW4oYXppKSAqIE1hdGguY29zKGVsZXYpO1xuICAgICAgICB0aGlzLmdhaW5zWzNdID0gTWF0aC5zaW4oZWxldik7XG5cbiAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPCA0OyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMuZ2Fpbk5vZGVzW2ldLmdhaW4udmFsdWUgPSB0aGlzLmdhaW5zW2ldO1xuICAgICAgICB9XG4gICAgfVxufVxuIl19