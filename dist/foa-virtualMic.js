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

/////////////////////////////////
/* B_FORMAT VIRTUAL MICROPHONE */
/////////////////////////////////

var Bformat_vmic = function () {
    function Bformat_vmic(audioCtx) {
        (0, _classCallCheck3.default)(this, Bformat_vmic);

        this.initialized = false;

        this.ctx = audioCtx;
        this.azi = 0;
        this.elev = 0;
        this.vmicGainNodes = new Array(4);
        this.vmicCoeff = 0.5;
        this.vmicPattern = "cardioid";
        this.in = this.ctx.createChannelSplitter(4);
        this.out = this.ctx.createGain();
        // Initialize vmic to forward facing cardioid
        this.vmicGains = [0.5 * Math.SQRT2, 0.5, 0, 0];
        for (var i = 0; i < 4; i++) {
            this.vmicGainNodes[i] = this.ctx.createGain();
            this.vmicGainNodes[i].gain.value = this.vmicGains[i];
        }
        // Initialize orientation
        this.xyz = [1, 0, 0];
        // Create connections
        for (i = 0; i < 4; i++) {
            this.in.connect(this.vmicGainNodes[i], i, 0);
            this.vmicGainNodes[i].connect(this.out);
        }

        this.initialized = true;
    }

    (0, _createClass3.default)(Bformat_vmic, [{
        key: "updatePattern",
        value: function updatePattern() {
            switch (this.vmicPattern) {
                case "subcardioid":
                    this.vmicCoeff = 2 / 3;
                    break;
                case "cardioid":
                    this.vmicCoeff = 1 / 2;
                    break;
                case "supercardioid":
                    this.vmicCoeff = (Math.sqrt(3) - 1) / 2;
                    break;
                case "hypercardioid":
                    this.vmicCoeff = 1 / 4;
                    break;
                case "dipole":
                    this.vmicCoeff = 0;
                    break;
                default:
                    this.vmicPattern = "cardioid";
                    this.vmicCoeff = 1 / 2;
            }
            this.updateGains();
        }
    }, {
        key: "updateOrientation",
        value: function updateOrientation() {
            var azi = this.azi * Math.PI / 180;
            var elev = this.elev * Math.PI / 180;

            this.xyz[0] = Math.cos(azi) * Math.cos(elev);
            this.xyz[1] = Math.sin(azi) * Math.cos(elev);
            this.xyz[2] = Math.sin(elev);

            this.updateGains();
        }
    }, {
        key: "updateGains",
        value: function updateGains() {
            var a = this.vmicCoeff;
            var xyz = this.xyz;
            this.vmicGains[0] = a * Math.SQRT2;
            this.vmicGains[1] = (1 - a) * xyz[0];
            this.vmicGains[2] = (1 - a) * xyz[1];
            this.vmicGains[3] = (1 - a) * xyz[2];

            for (var i = 0; i < 4; i++) {
                this.vmicGainNodes[i].gain.value = this.vmicGains[i];
            }
        }
    }]);
    return Bformat_vmic;
}();

exports.default = Bformat_vmic;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZvYS12aXJ0dWFsTWljLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQWlCcUIsWTtBQUVqQiwwQkFBWSxRQUFaLEVBQXNCO0FBQUE7O0FBQ2xCLGFBQUssV0FBTCxHQUFtQixLQUFuQjs7QUFFQSxhQUFLLEdBQUwsR0FBVyxRQUFYO0FBQ0EsYUFBSyxHQUFMLEdBQVcsQ0FBWDtBQUNBLGFBQUssSUFBTCxHQUFZLENBQVo7QUFDQSxhQUFLLGFBQUwsR0FBcUIsSUFBSSxLQUFKLENBQVUsQ0FBVixDQUFyQjtBQUNBLGFBQUssU0FBTCxHQUFpQixHQUFqQjtBQUNBLGFBQUssV0FBTCxHQUFtQixVQUFuQjtBQUNBLGFBQUssRUFBTCxHQUFVLEtBQUssR0FBTCxDQUFTLHFCQUFULENBQStCLENBQS9CLENBQVY7QUFDQSxhQUFLLEdBQUwsR0FBVyxLQUFLLEdBQUwsQ0FBUyxVQUFULEVBQVg7O0FBRUEsYUFBSyxTQUFMLEdBQWlCLENBQUMsTUFBTSxLQUFLLEtBQVosRUFBbUIsR0FBbkIsRUFBd0IsQ0FBeEIsRUFBMkIsQ0FBM0IsQ0FBakI7QUFDQSxhQUFLLElBQUksSUFBSSxDQUFiLEVBQWdCLElBQUksQ0FBcEIsRUFBdUIsR0FBdkIsRUFBNEI7QUFDeEIsaUJBQUssYUFBTCxDQUFtQixDQUFuQixJQUF3QixLQUFLLEdBQUwsQ0FBUyxVQUFULEVBQXhCO0FBQ0EsaUJBQUssYUFBTCxDQUFtQixDQUFuQixFQUFzQixJQUF0QixDQUEyQixLQUEzQixHQUFtQyxLQUFLLFNBQUwsQ0FBZSxDQUFmLENBQW5DO0FBQ0g7O0FBRUQsYUFBSyxHQUFMLEdBQVcsQ0FBQyxDQUFELEVBQUksQ0FBSixFQUFPLENBQVAsQ0FBWDs7QUFFQSxhQUFLLElBQUksQ0FBVCxFQUFZLElBQUksQ0FBaEIsRUFBbUIsR0FBbkIsRUFBd0I7QUFDcEIsaUJBQUssRUFBTCxDQUFRLE9BQVIsQ0FBZ0IsS0FBSyxhQUFMLENBQW1CLENBQW5CLENBQWhCLEVBQXVDLENBQXZDLEVBQTBDLENBQTFDO0FBQ0EsaUJBQUssYUFBTCxDQUFtQixDQUFuQixFQUFzQixPQUF0QixDQUE4QixLQUFLLEdBQW5DO0FBQ0g7O0FBRUQsYUFBSyxXQUFMLEdBQW1CLElBQW5CO0FBQ0g7Ozs7d0NBRWU7QUFDWixvQkFBUSxLQUFLLFdBQWI7QUFDSSxxQkFBSyxhQUFMO0FBQ0kseUJBQUssU0FBTCxHQUFpQixJQUFJLENBQXJCO0FBQ0E7QUFDSixxQkFBSyxVQUFMO0FBQ0kseUJBQUssU0FBTCxHQUFpQixJQUFJLENBQXJCO0FBQ0E7QUFDSixxQkFBSyxlQUFMO0FBQ0kseUJBQUssU0FBTCxHQUFpQixDQUFDLEtBQUssSUFBTCxDQUFVLENBQVYsSUFBZSxDQUFoQixJQUFxQixDQUF0QztBQUNBO0FBQ0oscUJBQUssZUFBTDtBQUNJLHlCQUFLLFNBQUwsR0FBaUIsSUFBSSxDQUFyQjtBQUNBO0FBQ0oscUJBQUssUUFBTDtBQUNJLHlCQUFLLFNBQUwsR0FBaUIsQ0FBakI7QUFDQTtBQUNKO0FBQ0kseUJBQUssV0FBTCxHQUFtQixVQUFuQjtBQUNBLHlCQUFLLFNBQUwsR0FBaUIsSUFBSSxDQUFyQjtBQWxCUjtBQW9CQSxpQkFBSyxXQUFMO0FBQ0g7Ozs0Q0FFbUI7QUFDaEIsZ0JBQUksTUFBTSxLQUFLLEdBQUwsR0FBVyxLQUFLLEVBQWhCLEdBQXFCLEdBQS9CO0FBQ0EsZ0JBQUksT0FBTyxLQUFLLElBQUwsR0FBWSxLQUFLLEVBQWpCLEdBQXNCLEdBQWpDOztBQUVBLGlCQUFLLEdBQUwsQ0FBUyxDQUFULElBQWMsS0FBSyxHQUFMLENBQVMsR0FBVCxJQUFnQixLQUFLLEdBQUwsQ0FBUyxJQUFULENBQTlCO0FBQ0EsaUJBQUssR0FBTCxDQUFTLENBQVQsSUFBYyxLQUFLLEdBQUwsQ0FBUyxHQUFULElBQWdCLEtBQUssR0FBTCxDQUFTLElBQVQsQ0FBOUI7QUFDQSxpQkFBSyxHQUFMLENBQVMsQ0FBVCxJQUFjLEtBQUssR0FBTCxDQUFTLElBQVQsQ0FBZDs7QUFFQSxpQkFBSyxXQUFMO0FBQ0g7OztzQ0FFYTtBQUNWLGdCQUFJLElBQUksS0FBSyxTQUFiO0FBQ0EsZ0JBQUksTUFBTSxLQUFLLEdBQWY7QUFDQSxpQkFBSyxTQUFMLENBQWUsQ0FBZixJQUFvQixJQUFJLEtBQUssS0FBN0I7QUFDQSxpQkFBSyxTQUFMLENBQWUsQ0FBZixJQUFvQixDQUFDLElBQUksQ0FBTCxJQUFVLElBQUksQ0FBSixDQUE5QjtBQUNBLGlCQUFLLFNBQUwsQ0FBZSxDQUFmLElBQW9CLENBQUMsSUFBSSxDQUFMLElBQVUsSUFBSSxDQUFKLENBQTlCO0FBQ0EsaUJBQUssU0FBTCxDQUFlLENBQWYsSUFBb0IsQ0FBQyxJQUFJLENBQUwsSUFBVSxJQUFJLENBQUosQ0FBOUI7O0FBRUEsaUJBQUssSUFBSSxJQUFJLENBQWIsRUFBZ0IsSUFBSSxDQUFwQixFQUF1QixHQUF2QixFQUE0QjtBQUN4QixxQkFBSyxhQUFMLENBQW1CLENBQW5CLEVBQXNCLElBQXRCLENBQTJCLEtBQTNCLEdBQW1DLEtBQUssU0FBTCxDQUFlLENBQWYsQ0FBbkM7QUFDSDtBQUNKOzs7OztrQkE1RWdCLFkiLCJmaWxlIjoiZm9hLXZpcnR1YWxNaWMuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gIEFyY2hvbnRpcyBQb2xpdGlzXG4vLyAgYXJjaG9udGlzLnBvbGl0aXNAYWFsdG8uZmlcbi8vICBEYXZpZCBQb2lyaWVyLVF1aW5vdFxuLy8gIGRhdmlwb2lyQGlyY2FtLmZyXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy9cbi8vICBXZWJBdWRpb19IT0EgYSBKYXZhU2NyaXB0IGxpYnJhcnkgZm9yIGhpZ2hlci1vcmRlciBBbWJpc29uaWNzXG4vLyAgVGhlIGxpYnJhcnkgaW1wbGVtZW50cyBXZWIgQXVkaW8gYmxvY2tzIHRoYXQgcGVyZm9ybVxuLy8gIHR5cGljYWwgYW1iaXNvbmljIHByb2Nlc3Npbmcgb3BlcmF0aW9ucyBvbiBhdWRpbyBzaWduYWxzLlxuLy9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLyogQl9GT1JNQVQgVklSVFVBTCBNSUNST1BIT05FICovXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQmZvcm1hdF92bWljIHtcblxuICAgIGNvbnN0cnVjdG9yKGF1ZGlvQ3R4KSB7XG4gICAgICAgIHRoaXMuaW5pdGlhbGl6ZWQgPSBmYWxzZTtcblxuICAgICAgICB0aGlzLmN0eCA9IGF1ZGlvQ3R4O1xuICAgICAgICB0aGlzLmF6aSA9IDA7XG4gICAgICAgIHRoaXMuZWxldiA9IDA7XG4gICAgICAgIHRoaXMudm1pY0dhaW5Ob2RlcyA9IG5ldyBBcnJheSg0KTtcbiAgICAgICAgdGhpcy52bWljQ29lZmYgPSAwLjU7XG4gICAgICAgIHRoaXMudm1pY1BhdHRlcm4gPSBcImNhcmRpb2lkXCI7XG4gICAgICAgIHRoaXMuaW4gPSB0aGlzLmN0eC5jcmVhdGVDaGFubmVsU3BsaXR0ZXIoNCk7XG4gICAgICAgIHRoaXMub3V0ID0gdGhpcy5jdHguY3JlYXRlR2FpbigpO1xuICAgICAgICAvLyBJbml0aWFsaXplIHZtaWMgdG8gZm9yd2FyZCBmYWNpbmcgY2FyZGlvaWRcbiAgICAgICAgdGhpcy52bWljR2FpbnMgPSBbMC41ICogTWF0aC5TUVJUMiwgMC41LCAwLCAwXTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCA0OyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMudm1pY0dhaW5Ob2Rlc1tpXSA9IHRoaXMuY3R4LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgICAgIHRoaXMudm1pY0dhaW5Ob2Rlc1tpXS5nYWluLnZhbHVlID0gdGhpcy52bWljR2FpbnNbaV07XG4gICAgICAgIH1cbiAgICAgICAgLy8gSW5pdGlhbGl6ZSBvcmllbnRhdGlvblxuICAgICAgICB0aGlzLnh5eiA9IFsxLCAwLCAwXTtcbiAgICAgICAgLy8gQ3JlYXRlIGNvbm5lY3Rpb25zXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCA0OyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMuaW4uY29ubmVjdCh0aGlzLnZtaWNHYWluTm9kZXNbaV0sIGksIDApO1xuICAgICAgICAgICAgdGhpcy52bWljR2Fpbk5vZGVzW2ldLmNvbm5lY3QodGhpcy5vdXQpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5pbml0aWFsaXplZCA9IHRydWU7XG4gICAgfVxuXG4gICAgdXBkYXRlUGF0dGVybigpIHtcbiAgICAgICAgc3dpdGNoICh0aGlzLnZtaWNQYXR0ZXJuKSB7XG4gICAgICAgICAgICBjYXNlIFwic3ViY2FyZGlvaWRcIjpcbiAgICAgICAgICAgICAgICB0aGlzLnZtaWNDb2VmZiA9IDIgLyAzO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcImNhcmRpb2lkXCI6XG4gICAgICAgICAgICAgICAgdGhpcy52bWljQ29lZmYgPSAxIC8gMjtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCJzdXBlcmNhcmRpb2lkXCI6XG4gICAgICAgICAgICAgICAgdGhpcy52bWljQ29lZmYgPSAoTWF0aC5zcXJ0KDMpIC0gMSkgLyAyO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcImh5cGVyY2FyZGlvaWRcIjpcbiAgICAgICAgICAgICAgICB0aGlzLnZtaWNDb2VmZiA9IDEgLyA0O1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcImRpcG9sZVwiOlxuICAgICAgICAgICAgICAgIHRoaXMudm1pY0NvZWZmID0gMDtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgdGhpcy52bWljUGF0dGVybiA9IFwiY2FyZGlvaWRcIjtcbiAgICAgICAgICAgICAgICB0aGlzLnZtaWNDb2VmZiA9IDEgLyAyO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMudXBkYXRlR2FpbnMoKTtcbiAgICB9XG5cbiAgICB1cGRhdGVPcmllbnRhdGlvbigpIHtcbiAgICAgICAgdmFyIGF6aSA9IHRoaXMuYXppICogTWF0aC5QSSAvIDE4MDtcbiAgICAgICAgdmFyIGVsZXYgPSB0aGlzLmVsZXYgKiBNYXRoLlBJIC8gMTgwO1xuXG4gICAgICAgIHRoaXMueHl6WzBdID0gTWF0aC5jb3MoYXppKSAqIE1hdGguY29zKGVsZXYpO1xuICAgICAgICB0aGlzLnh5elsxXSA9IE1hdGguc2luKGF6aSkgKiBNYXRoLmNvcyhlbGV2KTtcbiAgICAgICAgdGhpcy54eXpbMl0gPSBNYXRoLnNpbihlbGV2KTtcblxuICAgICAgICB0aGlzLnVwZGF0ZUdhaW5zKCk7XG4gICAgfVxuXG4gICAgdXBkYXRlR2FpbnMoKSB7XG4gICAgICAgIHZhciBhID0gdGhpcy52bWljQ29lZmY7XG4gICAgICAgIHZhciB4eXogPSB0aGlzLnh5ejtcbiAgICAgICAgdGhpcy52bWljR2FpbnNbMF0gPSBhICogTWF0aC5TUVJUMjtcbiAgICAgICAgdGhpcy52bWljR2FpbnNbMV0gPSAoMSAtIGEpICogeHl6WzBdO1xuICAgICAgICB0aGlzLnZtaWNHYWluc1syXSA9ICgxIC0gYSkgKiB4eXpbMV07XG4gICAgICAgIHRoaXMudm1pY0dhaW5zWzNdID0gKDEgLSBhKSAqIHh5elsyXTtcblxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IDQ7IGkrKykge1xuICAgICAgICAgICAgdGhpcy52bWljR2Fpbk5vZGVzW2ldLmdhaW4udmFsdWUgPSB0aGlzLnZtaWNHYWluc1tpXTtcbiAgICAgICAgfVxuICAgIH1cbn1cbiJdfQ==