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
/* B_FORMAT ROTATOR */
//////////////////////

var Bformat_rotator = function () {
    function Bformat_rotator(audioCtx) {
        (0, _classCallCheck3.default)(this, Bformat_rotator);

        this.initialized = false;

        this.ctx = audioCtx;
        this.yaw = 0;
        this.pitch = 0;
        this.roll = 0;
        this.rotMtx = [[], [], []];
        this.rotMtxNodes = [[], [], []];

        // Input and output nodes
        this.in = this.ctx.createChannelSplitter(4);
        this.out = this.ctx.createChannelMerger(4);
        // Initialize rotation gains to identity matrix
        for (var i = 0; i < 3; i++) {
            for (var j = 0; j < 3; j++) {
                this.rotMtxNodes[i][j] = context.createGain();
                if (i == j) this.rotMtxNodes[i][j].gain.value = 1;else this.rotMtxNodes[i][j].gain.value = 0;
            }
        }
        // Create connections
        this.in.connect(this.out, 0, 0);

        for (var _i = 0; _i < 3; _i++) {
            for (var _j = 0; _j < 3; _j++) {
                this.in.connect(this.rotMtxNodes[_i][_j], _j + 1, 0);
                this.rotMtxNodes[_i][_j].connect(this.out, 0, _i + 1);
            }
        }

        this.initialized = true;
    }

    (0, _createClass3.default)(Bformat_rotator, [{
        key: "updateRotMtx",
        value: function updateRotMtx() {
            var yaw = this.yaw * Math.PI / 180;
            var pitch = this.pitch * Math.PI / 180;
            var roll = this.roll * Math.PI / 180;
            var Rxx, Rxy, Rxz, Ryx, Ryy, Ryz, Rzx, Rzy, Rzz;

            Rxx = Math.cos(pitch) * Math.cos(yaw);
            Rxy = Math.cos(pitch) * Math.sin(yaw);
            Rxz = -Math.sin(pitch);
            Ryx = Math.cos(yaw) * Math.sin(pitch) * Math.sin(roll) - Math.cos(roll) * Math.sin(yaw);
            Ryy = Math.cos(roll) * Math.cos(yaw) + Math.sin(pitch) * Math.sin(roll) * Math.sin(yaw);
            Ryz = Math.cos(pitch) * Math.sin(roll);
            Rzx = Math.sin(roll) * Math.sin(yaw) + Math.cos(roll) * Math.cos(yaw) * Math.sin(pitch);
            Rzy = Math.cos(roll) * Math.sin(pitch) * Math.sin(yaw) - Math.cos(yaw) * Math.sin(roll);
            Rzz = Math.cos(pitch) * Math.cos(roll);

            this.rotMtx = [[Rxx, Rxy, Rxz], [Ryx, Ryy, Ryz], [Rzx, Rzy, Rzz]];

            for (var i = 0; i < 3; i++) {
                for (var j = 0; j < 3; j++) {
                    this.rotMtxNodes[i][j].gain.value = this.rotMtx[i][j];
                }
            }
        }
    }]);
    return Bformat_rotator;
}();

exports.default = Bformat_rotator;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZvYS1yb3RhdG9yLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQWlCcUIsZTtBQUVqQiw2QkFBWSxRQUFaLEVBQXNCO0FBQUE7O0FBQ2xCLGFBQUssV0FBTCxHQUFtQixLQUFuQjs7QUFFQSxhQUFLLEdBQUwsR0FBVyxRQUFYO0FBQ0EsYUFBSyxHQUFMLEdBQVcsQ0FBWDtBQUNBLGFBQUssS0FBTCxHQUFhLENBQWI7QUFDQSxhQUFLLElBQUwsR0FBWSxDQUFaO0FBQ0EsYUFBSyxNQUFMLEdBQWMsQ0FBRSxFQUFGLEVBQU0sRUFBTixFQUFVLEVBQVYsQ0FBZDtBQUNBLGFBQUssV0FBTCxHQUFtQixDQUFFLEVBQUYsRUFBTSxFQUFOLEVBQVUsRUFBVixDQUFuQjs7O0FBR0EsYUFBSyxFQUFMLEdBQVUsS0FBSyxHQUFMLENBQVMscUJBQVQsQ0FBK0IsQ0FBL0IsQ0FBVjtBQUNBLGFBQUssR0FBTCxHQUFXLEtBQUssR0FBTCxDQUFTLG1CQUFULENBQTZCLENBQTdCLENBQVg7O0FBRUEsYUFBSyxJQUFJLElBQUksQ0FBYixFQUFnQixJQUFJLENBQXBCLEVBQXVCLEdBQXZCLEVBQTRCO0FBQ3hCLGlCQUFLLElBQUksSUFBSSxDQUFiLEVBQWdCLElBQUksQ0FBcEIsRUFBdUIsR0FBdkIsRUFBNEI7QUFDeEIscUJBQUssV0FBTCxDQUFpQixDQUFqQixFQUFvQixDQUFwQixJQUF5QixRQUFRLFVBQVIsRUFBekI7QUFDQSxvQkFBSSxLQUFLLENBQVQsRUFBWSxLQUFLLFdBQUwsQ0FBaUIsQ0FBakIsRUFBb0IsQ0FBcEIsRUFBdUIsSUFBdkIsQ0FBNEIsS0FBNUIsR0FBb0MsQ0FBcEMsQ0FBWixLQUNLLEtBQUssV0FBTCxDQUFpQixDQUFqQixFQUFvQixDQUFwQixFQUF1QixJQUF2QixDQUE0QixLQUE1QixHQUFvQyxDQUFwQztBQUNSO0FBQ0o7O0FBRUQsYUFBSyxFQUFMLENBQVEsT0FBUixDQUFnQixLQUFLLEdBQXJCLEVBQTBCLENBQTFCLEVBQTZCLENBQTdCOztBQUVBLGFBQUssSUFBSSxLQUFJLENBQWIsRUFBZ0IsS0FBSSxDQUFwQixFQUF1QixJQUF2QixFQUE0QjtBQUN4QixpQkFBSyxJQUFJLEtBQUksQ0FBYixFQUFnQixLQUFJLENBQXBCLEVBQXVCLElBQXZCLEVBQTRCO0FBQ3hCLHFCQUFLLEVBQUwsQ0FBUSxPQUFSLENBQWdCLEtBQUssV0FBTCxDQUFpQixFQUFqQixFQUFvQixFQUFwQixDQUFoQixFQUF3QyxLQUFJLENBQTVDLEVBQStDLENBQS9DO0FBQ0EscUJBQUssV0FBTCxDQUFpQixFQUFqQixFQUFvQixFQUFwQixFQUF1QixPQUF2QixDQUErQixLQUFLLEdBQXBDLEVBQXlDLENBQXpDLEVBQTRDLEtBQUksQ0FBaEQ7QUFDSDtBQUNKOztBQUVELGFBQUssV0FBTCxHQUFtQixJQUFuQjtBQUNIOzs7O3VDQUVjO0FBQ1gsZ0JBQUksTUFBTSxLQUFLLEdBQUwsR0FBVyxLQUFLLEVBQWhCLEdBQXFCLEdBQS9CO0FBQ0EsZ0JBQUksUUFBUSxLQUFLLEtBQUwsR0FBYSxLQUFLLEVBQWxCLEdBQXVCLEdBQW5DO0FBQ0EsZ0JBQUksT0FBTyxLQUFLLElBQUwsR0FBWSxLQUFLLEVBQWpCLEdBQXNCLEdBQWpDO0FBQ0EsZ0JBQUksR0FBSixFQUFTLEdBQVQsRUFBYyxHQUFkLEVBQW1CLEdBQW5CLEVBQXdCLEdBQXhCLEVBQTZCLEdBQTdCLEVBQWtDLEdBQWxDLEVBQXVDLEdBQXZDLEVBQTRDLEdBQTVDOztBQUVBLGtCQUFNLEtBQUssR0FBTCxDQUFTLEtBQVQsSUFBa0IsS0FBSyxHQUFMLENBQVMsR0FBVCxDQUF4QjtBQUNBLGtCQUFNLEtBQUssR0FBTCxDQUFTLEtBQVQsSUFBa0IsS0FBSyxHQUFMLENBQVMsR0FBVCxDQUF4QjtBQUNBLGtCQUFNLENBQUMsS0FBSyxHQUFMLENBQVMsS0FBVCxDQUFQO0FBQ0Esa0JBQU0sS0FBSyxHQUFMLENBQVMsR0FBVCxJQUFnQixLQUFLLEdBQUwsQ0FBUyxLQUFULENBQWhCLEdBQWtDLEtBQUssR0FBTCxDQUFTLElBQVQsQ0FBbEMsR0FBbUQsS0FBSyxHQUFMLENBQVMsSUFBVCxJQUFpQixLQUFLLEdBQUwsQ0FBUyxHQUFULENBQTFFO0FBQ0Esa0JBQU0sS0FBSyxHQUFMLENBQVMsSUFBVCxJQUFpQixLQUFLLEdBQUwsQ0FBUyxHQUFULENBQWpCLEdBQWlDLEtBQUssR0FBTCxDQUFTLEtBQVQsSUFBa0IsS0FBSyxHQUFMLENBQVMsSUFBVCxDQUFsQixHQUFtQyxLQUFLLEdBQUwsQ0FBUyxHQUFULENBQTFFO0FBQ0Esa0JBQU0sS0FBSyxHQUFMLENBQVMsS0FBVCxJQUFrQixLQUFLLEdBQUwsQ0FBUyxJQUFULENBQXhCO0FBQ0Esa0JBQU0sS0FBSyxHQUFMLENBQVMsSUFBVCxJQUFpQixLQUFLLEdBQUwsQ0FBUyxHQUFULENBQWpCLEdBQWlDLEtBQUssR0FBTCxDQUFTLElBQVQsSUFBaUIsS0FBSyxHQUFMLENBQVMsR0FBVCxDQUFqQixHQUFpQyxLQUFLLEdBQUwsQ0FBUyxLQUFULENBQXhFO0FBQ0Esa0JBQU0sS0FBSyxHQUFMLENBQVMsSUFBVCxJQUFpQixLQUFLLEdBQUwsQ0FBUyxLQUFULENBQWpCLEdBQW1DLEtBQUssR0FBTCxDQUFTLEdBQVQsQ0FBbkMsR0FBbUQsS0FBSyxHQUFMLENBQVMsR0FBVCxJQUFnQixLQUFLLEdBQUwsQ0FBUyxJQUFULENBQXpFO0FBQ0Esa0JBQU0sS0FBSyxHQUFMLENBQVMsS0FBVCxJQUFrQixLQUFLLEdBQUwsQ0FBUyxJQUFULENBQXhCOztBQUVBLGlCQUFLLE1BQUwsR0FBYyxDQUNWLENBQUMsR0FBRCxFQUFNLEdBQU4sRUFBVyxHQUFYLENBRFUsRUFFVixDQUFDLEdBQUQsRUFBTSxHQUFOLEVBQVcsR0FBWCxDQUZVLEVBR1YsQ0FBQyxHQUFELEVBQU0sR0FBTixFQUFXLEdBQVgsQ0FIVSxDQUFkOztBQU1BLGlCQUFLLElBQUksSUFBSSxDQUFiLEVBQWdCLElBQUksQ0FBcEIsRUFBdUIsR0FBdkIsRUFBNEI7QUFDeEIscUJBQUssSUFBSSxJQUFJLENBQWIsRUFBZ0IsSUFBSSxDQUFwQixFQUF1QixHQUF2QixFQUE0QjtBQUN4Qix5QkFBSyxXQUFMLENBQWlCLENBQWpCLEVBQW9CLENBQXBCLEVBQXVCLElBQXZCLENBQTRCLEtBQTVCLEdBQW9DLEtBQUssTUFBTCxDQUFZLENBQVosRUFBZSxDQUFmLENBQXBDO0FBQ0g7QUFDSjtBQUNKOzs7OztrQkEvRGdCLGUiLCJmaWxlIjoiZm9hLXJvdGF0b3IuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gIEFyY2hvbnRpcyBQb2xpdGlzXG4vLyAgYXJjaG9udGlzLnBvbGl0aXNAYWFsdG8uZmlcbi8vICBEYXZpZCBQb2lyaWVyLVF1aW5vdFxuLy8gIGRhdmlwb2lyQGlyY2FtLmZyXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy9cbi8vICBXZWJBdWRpb19IT0EgYSBKYXZhU2NyaXB0IGxpYnJhcnkgZm9yIGhpZ2hlci1vcmRlciBBbWJpc29uaWNzXG4vLyAgVGhlIGxpYnJhcnkgaW1wbGVtZW50cyBXZWIgQXVkaW8gYmxvY2tzIHRoYXQgcGVyZm9ybVxuLy8gIHR5cGljYWwgYW1iaXNvbmljIHByb2Nlc3Npbmcgb3BlcmF0aW9ucyBvbiBhdWRpbyBzaWduYWxzLlxuLy9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8qIEJfRk9STUFUIFJPVEFUT1IgKi9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQmZvcm1hdF9yb3RhdG9yIHtcblxuICAgIGNvbnN0cnVjdG9yKGF1ZGlvQ3R4KSB7XG4gICAgICAgIHRoaXMuaW5pdGlhbGl6ZWQgPSBmYWxzZTtcblxuICAgICAgICB0aGlzLmN0eCA9IGF1ZGlvQ3R4O1xuICAgICAgICB0aGlzLnlhdyA9IDA7XG4gICAgICAgIHRoaXMucGl0Y2ggPSAwO1xuICAgICAgICB0aGlzLnJvbGwgPSAwO1xuICAgICAgICB0aGlzLnJvdE10eCA9IFsgW10sIFtdLCBbXSBdO1xuICAgICAgICB0aGlzLnJvdE10eE5vZGVzID0gWyBbXSwgW10sIFtdIF07XG5cbiAgICAgICAgLy8gSW5wdXQgYW5kIG91dHB1dCBub2Rlc1xuICAgICAgICB0aGlzLmluID0gdGhpcy5jdHguY3JlYXRlQ2hhbm5lbFNwbGl0dGVyKDQpO1xuICAgICAgICB0aGlzLm91dCA9IHRoaXMuY3R4LmNyZWF0ZUNoYW5uZWxNZXJnZXIoNCk7XG4gICAgICAgIC8vIEluaXRpYWxpemUgcm90YXRpb24gZ2FpbnMgdG8gaWRlbnRpdHkgbWF0cml4XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgMzsgaSsrKSB7XG4gICAgICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IDM7IGorKykge1xuICAgICAgICAgICAgICAgIHRoaXMucm90TXR4Tm9kZXNbaV1bal0gPSBjb250ZXh0LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgICAgICAgICBpZiAoaSA9PSBqKSB0aGlzLnJvdE10eE5vZGVzW2ldW2pdLmdhaW4udmFsdWUgPSAxO1xuICAgICAgICAgICAgICAgIGVsc2UgdGhpcy5yb3RNdHhOb2Rlc1tpXVtqXS5nYWluLnZhbHVlID0gMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyBDcmVhdGUgY29ubmVjdGlvbnNcbiAgICAgICAgdGhpcy5pbi5jb25uZWN0KHRoaXMub3V0LCAwLCAwKTtcblxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IDM7IGkrKykge1xuICAgICAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCAzOyBqKyspIHtcbiAgICAgICAgICAgICAgICB0aGlzLmluLmNvbm5lY3QodGhpcy5yb3RNdHhOb2Rlc1tpXVtqXSwgaiArIDEsIDApO1xuICAgICAgICAgICAgICAgIHRoaXMucm90TXR4Tm9kZXNbaV1bal0uY29ubmVjdCh0aGlzLm91dCwgMCwgaSArIDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5pbml0aWFsaXplZCA9IHRydWU7XG4gICAgfVxuXG4gICAgdXBkYXRlUm90TXR4KCkge1xuICAgICAgICB2YXIgeWF3ID0gdGhpcy55YXcgKiBNYXRoLlBJIC8gMTgwO1xuICAgICAgICB2YXIgcGl0Y2ggPSB0aGlzLnBpdGNoICogTWF0aC5QSSAvIDE4MDtcbiAgICAgICAgdmFyIHJvbGwgPSB0aGlzLnJvbGwgKiBNYXRoLlBJIC8gMTgwO1xuICAgICAgICB2YXIgUnh4LCBSeHksIFJ4eiwgUnl4LCBSeXksIFJ5eiwgUnp4LCBSenksIFJ6ejtcblxuICAgICAgICBSeHggPSBNYXRoLmNvcyhwaXRjaCkgKiBNYXRoLmNvcyh5YXcpO1xuICAgICAgICBSeHkgPSBNYXRoLmNvcyhwaXRjaCkgKiBNYXRoLnNpbih5YXcpO1xuICAgICAgICBSeHogPSAtTWF0aC5zaW4ocGl0Y2gpO1xuICAgICAgICBSeXggPSBNYXRoLmNvcyh5YXcpICogTWF0aC5zaW4ocGl0Y2gpICogTWF0aC5zaW4ocm9sbCkgLSBNYXRoLmNvcyhyb2xsKSAqIE1hdGguc2luKHlhdyk7XG4gICAgICAgIFJ5eSA9IE1hdGguY29zKHJvbGwpICogTWF0aC5jb3MoeWF3KSArIE1hdGguc2luKHBpdGNoKSAqIE1hdGguc2luKHJvbGwpICogTWF0aC5zaW4oeWF3KTtcbiAgICAgICAgUnl6ID0gTWF0aC5jb3MocGl0Y2gpICogTWF0aC5zaW4ocm9sbCk7XG4gICAgICAgIFJ6eCA9IE1hdGguc2luKHJvbGwpICogTWF0aC5zaW4oeWF3KSArIE1hdGguY29zKHJvbGwpICogTWF0aC5jb3MoeWF3KSAqIE1hdGguc2luKHBpdGNoKTtcbiAgICAgICAgUnp5ID0gTWF0aC5jb3Mocm9sbCkgKiBNYXRoLnNpbihwaXRjaCkgKiBNYXRoLnNpbih5YXcpIC0gTWF0aC5jb3MoeWF3KSAqIE1hdGguc2luKHJvbGwpO1xuICAgICAgICBSenogPSBNYXRoLmNvcyhwaXRjaCkgKiBNYXRoLmNvcyhyb2xsKTtcblxuICAgICAgICB0aGlzLnJvdE10eCA9IFtcbiAgICAgICAgICAgIFtSeHgsIFJ4eSwgUnh6XSxcbiAgICAgICAgICAgIFtSeXgsIFJ5eSwgUnl6XSxcbiAgICAgICAgICAgIFtSengsIFJ6eSwgUnp6XVxuICAgICAgICBdO1xuXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgMzsgaSsrKSB7XG4gICAgICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IDM7IGorKykge1xuICAgICAgICAgICAgICAgIHRoaXMucm90TXR4Tm9kZXNbaV1bal0uZ2Fpbi52YWx1ZSA9IHRoaXMucm90TXR4W2ldW2pdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuIl19