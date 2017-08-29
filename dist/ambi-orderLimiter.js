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
//  JSAmbisonics a JavaScript library for higher-order Ambisonics
//  The library implements Web Audio blocks that perform
//  typical ambisonic processing operations on audio signals.
//
////////////////////////////////////////////////////////////////////

///////////////////////
/* HOA ORDER LIMITER */
///////////////////////

var orderLimiter = function () {
    function orderLimiter(audioCtx, orderIn, orderOut) {
        (0, _classCallCheck3.default)(this, orderLimiter);


        this.ctx = audioCtx;
        this.orderIn = orderIn;
        if (orderOut < orderIn) this.orderOut = orderOut;else this.orderOut = orderIn;

        this.nChIn = (this.orderIn + 1) * (this.orderIn + 1);
        this.nChOut = (this.orderOut + 1) * (this.orderOut + 1);
        this.in = this.ctx.createChannelSplitter(this.nChIn);
        this.out = this.ctx.createChannelMerger(this.nChOut);

        for (var i = 0; i < this.nChOut; i++) {
            this.in.connect(this.out, i, i);
        }
    }

    (0, _createClass3.default)(orderLimiter, [{
        key: "updateOrder",
        value: function updateOrder(orderOut) {

            if (orderOut <= this.orderIn) {
                this.orderOut = orderOut;
            } else return;

            this.nChOut = (this.orderOut + 1) * (this.orderOut + 1);
            this.out.disconnect();
            this.out = this.ctx.createChannelMerger(this.nChOut);

            for (var i = 0; i < this.nChOut; i++) {
                this.in.connect(this.out, i, i);
            }
        }
    }]);
    return orderLimiter;
}();

exports.default = orderLimiter;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFtYmktb3JkZXJMaW1pdGVyLmpzIl0sIm5hbWVzIjpbIm9yZGVyTGltaXRlciIsImF1ZGlvQ3R4Iiwib3JkZXJJbiIsIm9yZGVyT3V0IiwiY3R4IiwibkNoSW4iLCJuQ2hPdXQiLCJpbiIsImNyZWF0ZUNoYW5uZWxTcGxpdHRlciIsIm91dCIsImNyZWF0ZUNoYW5uZWxNZXJnZXIiLCJpIiwiY29ubmVjdCIsImRpc2Nvbm5lY3QiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztJQUVxQkEsWTtBQUVqQiwwQkFBWUMsUUFBWixFQUFzQkMsT0FBdEIsRUFBK0JDLFFBQS9CLEVBQXlDO0FBQUE7OztBQUVyQyxhQUFLQyxHQUFMLEdBQVdILFFBQVg7QUFDQSxhQUFLQyxPQUFMLEdBQWVBLE9BQWY7QUFDQSxZQUFJQyxXQUFXRCxPQUFmLEVBQXdCLEtBQUtDLFFBQUwsR0FBZ0JBLFFBQWhCLENBQXhCLEtBQ0ssS0FBS0EsUUFBTCxHQUFnQkQsT0FBaEI7O0FBRUwsYUFBS0csS0FBTCxHQUFhLENBQUMsS0FBS0gsT0FBTCxHQUFlLENBQWhCLEtBQXNCLEtBQUtBLE9BQUwsR0FBZSxDQUFyQyxDQUFiO0FBQ0EsYUFBS0ksTUFBTCxHQUFjLENBQUMsS0FBS0gsUUFBTCxHQUFnQixDQUFqQixLQUF1QixLQUFLQSxRQUFMLEdBQWdCLENBQXZDLENBQWQ7QUFDQSxhQUFLSSxFQUFMLEdBQVUsS0FBS0gsR0FBTCxDQUFTSSxxQkFBVCxDQUErQixLQUFLSCxLQUFwQyxDQUFWO0FBQ0EsYUFBS0ksR0FBTCxHQUFXLEtBQUtMLEdBQUwsQ0FBU00sbUJBQVQsQ0FBNkIsS0FBS0osTUFBbEMsQ0FBWDs7QUFFQSxhQUFLLElBQUlLLElBQUksQ0FBYixFQUFnQkEsSUFBSSxLQUFLTCxNQUF6QixFQUFpQ0ssR0FBakMsRUFBc0M7QUFDbEMsaUJBQUtKLEVBQUwsQ0FBUUssT0FBUixDQUFnQixLQUFLSCxHQUFyQixFQUEwQkUsQ0FBMUIsRUFBNkJBLENBQTdCO0FBQ0g7QUFDSjs7OztvQ0FFV1IsUSxFQUFVOztBQUVsQixnQkFBSUEsWUFBWSxLQUFLRCxPQUFyQixFQUE4QjtBQUMxQixxQkFBS0MsUUFBTCxHQUFnQkEsUUFBaEI7QUFDSCxhQUZELE1BR0s7O0FBRUwsaUJBQUtHLE1BQUwsR0FBYyxDQUFDLEtBQUtILFFBQUwsR0FBZ0IsQ0FBakIsS0FBdUIsS0FBS0EsUUFBTCxHQUFnQixDQUF2QyxDQUFkO0FBQ0EsaUJBQUtNLEdBQUwsQ0FBU0ksVUFBVDtBQUNBLGlCQUFLSixHQUFMLEdBQVcsS0FBS0wsR0FBTCxDQUFTTSxtQkFBVCxDQUE2QixLQUFLSixNQUFsQyxDQUFYOztBQUVBLGlCQUFLLElBQUlLLElBQUksQ0FBYixFQUFnQkEsSUFBSSxLQUFLTCxNQUF6QixFQUFpQ0ssR0FBakMsRUFBc0M7QUFDbEMscUJBQUtKLEVBQUwsQ0FBUUssT0FBUixDQUFnQixLQUFLSCxHQUFyQixFQUEwQkUsQ0FBMUIsRUFBNkJBLENBQTdCO0FBQ0g7QUFDSjs7Ozs7a0JBakNnQlgsWSIsImZpbGUiOiJhbWJpLW9yZGVyTGltaXRlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyAgQXJjaG9udGlzIFBvbGl0aXNcbi8vICBhcmNob250aXMucG9saXRpc0BhYWx0by5maVxuLy8gIERhdmlkIFBvaXJpZXItUXVpbm90XG4vLyAgZGF2aXBvaXJAaXJjYW0uZnJcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vL1xuLy8gIEpTQW1iaXNvbmljcyBhIEphdmFTY3JpcHQgbGlicmFyeSBmb3IgaGlnaGVyLW9yZGVyIEFtYmlzb25pY3Ncbi8vICBUaGUgbGlicmFyeSBpbXBsZW1lbnRzIFdlYiBBdWRpbyBibG9ja3MgdGhhdCBwZXJmb3JtXG4vLyAgdHlwaWNhbCBhbWJpc29uaWMgcHJvY2Vzc2luZyBvcGVyYXRpb25zIG9uIGF1ZGlvIHNpZ25hbHMuXG4vL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8qIEhPQSBPUkRFUiBMSU1JVEVSICovXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBvcmRlckxpbWl0ZXIge1xuXG4gICAgY29uc3RydWN0b3IoYXVkaW9DdHgsIG9yZGVySW4sIG9yZGVyT3V0KSB7XG5cbiAgICAgICAgdGhpcy5jdHggPSBhdWRpb0N0eDtcbiAgICAgICAgdGhpcy5vcmRlckluID0gb3JkZXJJbjtcbiAgICAgICAgaWYgKG9yZGVyT3V0IDwgb3JkZXJJbikgdGhpcy5vcmRlck91dCA9IG9yZGVyT3V0O1xuICAgICAgICBlbHNlIHRoaXMub3JkZXJPdXQgPSBvcmRlckluO1xuXG4gICAgICAgIHRoaXMubkNoSW4gPSAodGhpcy5vcmRlckluICsgMSkgKiAodGhpcy5vcmRlckluICsgMSk7XG4gICAgICAgIHRoaXMubkNoT3V0ID0gKHRoaXMub3JkZXJPdXQgKyAxKSAqICh0aGlzLm9yZGVyT3V0ICsgMSk7XG4gICAgICAgIHRoaXMuaW4gPSB0aGlzLmN0eC5jcmVhdGVDaGFubmVsU3BsaXR0ZXIodGhpcy5uQ2hJbik7XG4gICAgICAgIHRoaXMub3V0ID0gdGhpcy5jdHguY3JlYXRlQ2hhbm5lbE1lcmdlcih0aGlzLm5DaE91dCk7XG5cbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLm5DaE91dDsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLmluLmNvbm5lY3QodGhpcy5vdXQsIGksIGkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgdXBkYXRlT3JkZXIob3JkZXJPdXQpIHtcblxuICAgICAgICBpZiAob3JkZXJPdXQgPD0gdGhpcy5vcmRlckluKSB7XG4gICAgICAgICAgICB0aGlzLm9yZGVyT3V0ID0gb3JkZXJPdXQ7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSByZXR1cm47XG5cbiAgICAgICAgdGhpcy5uQ2hPdXQgPSAodGhpcy5vcmRlck91dCArIDEpICogKHRoaXMub3JkZXJPdXQgKyAxKTtcbiAgICAgICAgdGhpcy5vdXQuZGlzY29ubmVjdCgpO1xuICAgICAgICB0aGlzLm91dCA9IHRoaXMuY3R4LmNyZWF0ZUNoYW5uZWxNZXJnZXIodGhpcy5uQ2hPdXQpO1xuXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5uQ2hPdXQ7IGkrKykge1xuICAgICAgICAgICAgdGhpcy5pbi5jb25uZWN0KHRoaXMub3V0LCBpLCBpKTtcbiAgICAgICAgfVxuICAgIH1cbn1cbiJdfQ==