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
////////////////////////////////////////////////////////////////////
//
//  orderLimiter for 2D use
//  adapted by Thomas Deppisch
//  thomas.deppisch93@gmail.com
//
////////////////////////////////////////////////////////////////////
/////////////////////////
/* HOA ORDER LIMITER 2D*/
/////////////////////////

var orderLimiter2D = function () {
    function orderLimiter2D(audioCtx, orderIn, orderOut) {
        (0, _classCallCheck3.default)(this, orderLimiter2D);


        this.ctx = audioCtx;
        this.orderIn = orderIn;
        if (orderOut < orderIn) this.orderOut = orderOut;else this.orderOut = orderIn;

        this.nChIn = 2 * this.orderIn + 1;
        this.nChOut = 2 * this.orderOut + 1;
        this.in = this.ctx.createChannelSplitter(this.nChIn);
        this.out = this.ctx.createChannelMerger(this.nChOut);

        for (var i = 0; i < this.nChOut; i++) {
            this.in.connect(this.out, i, i);
        }
    }

    (0, _createClass3.default)(orderLimiter2D, [{
        key: "updateOrder",
        value: function updateOrder(orderOut) {

            if (orderOut <= this.orderIn) {
                this.orderOut = orderOut;
            } else return;

            this.nChOut = 2 * this.orderOut + 1;
            this.out.disconnect();
            this.out = this.ctx.createChannelMerger(this.nChOut);

            for (var i = 0; i < this.nChOut; i++) {
                this.in.connect(this.out, i, i);
            }
        }
    }]);
    return orderLimiter2D;
}();

exports.default = orderLimiter2D;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFtYmktb3JkZXJMaW1pdGVyMkQuanMiXSwibmFtZXMiOlsib3JkZXJMaW1pdGVyMkQiLCJhdWRpb0N0eCIsIm9yZGVySW4iLCJvcmRlck91dCIsImN0eCIsIm5DaEluIiwibkNoT3V0IiwiaW4iLCJjcmVhdGVDaGFubmVsU3BsaXR0ZXIiLCJvdXQiLCJjcmVhdGVDaGFubmVsTWVyZ2VyIiwiaSIsImNvbm5lY3QiLCJkaXNjb25uZWN0Il0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0lBRXFCQSxjO0FBRWpCLDRCQUFZQyxRQUFaLEVBQXNCQyxPQUF0QixFQUErQkMsUUFBL0IsRUFBeUM7QUFBQTs7O0FBRXJDLGFBQUtDLEdBQUwsR0FBV0gsUUFBWDtBQUNBLGFBQUtDLE9BQUwsR0FBZUEsT0FBZjtBQUNBLFlBQUlDLFdBQVdELE9BQWYsRUFBd0IsS0FBS0MsUUFBTCxHQUFnQkEsUUFBaEIsQ0FBeEIsS0FDSyxLQUFLQSxRQUFMLEdBQWdCRCxPQUFoQjs7QUFFTCxhQUFLRyxLQUFMLEdBQWEsSUFBSSxLQUFLSCxPQUFULEdBQW1CLENBQWhDO0FBQ0EsYUFBS0ksTUFBTCxHQUFjLElBQUksS0FBS0gsUUFBVCxHQUFvQixDQUFsQztBQUNBLGFBQUtJLEVBQUwsR0FBVSxLQUFLSCxHQUFMLENBQVNJLHFCQUFULENBQStCLEtBQUtILEtBQXBDLENBQVY7QUFDQSxhQUFLSSxHQUFMLEdBQVcsS0FBS0wsR0FBTCxDQUFTTSxtQkFBVCxDQUE2QixLQUFLSixNQUFsQyxDQUFYOztBQUVBLGFBQUssSUFBSUssSUFBSSxDQUFiLEVBQWdCQSxJQUFJLEtBQUtMLE1BQXpCLEVBQWlDSyxHQUFqQyxFQUFzQztBQUNsQyxpQkFBS0osRUFBTCxDQUFRSyxPQUFSLENBQWdCLEtBQUtILEdBQXJCLEVBQTBCRSxDQUExQixFQUE2QkEsQ0FBN0I7QUFDSDtBQUNKOzs7O29DQUVXUixRLEVBQVU7O0FBRWxCLGdCQUFJQSxZQUFZLEtBQUtELE9BQXJCLEVBQThCO0FBQzFCLHFCQUFLQyxRQUFMLEdBQWdCQSxRQUFoQjtBQUNILGFBRkQsTUFHSzs7QUFFTCxpQkFBS0csTUFBTCxHQUFjLElBQUksS0FBS0gsUUFBVCxHQUFvQixDQUFsQztBQUNBLGlCQUFLTSxHQUFMLENBQVNJLFVBQVQ7QUFDQSxpQkFBS0osR0FBTCxHQUFXLEtBQUtMLEdBQUwsQ0FBU00sbUJBQVQsQ0FBNkIsS0FBS0osTUFBbEMsQ0FBWDs7QUFFQSxpQkFBSyxJQUFJSyxJQUFJLENBQWIsRUFBZ0JBLElBQUksS0FBS0wsTUFBekIsRUFBaUNLLEdBQWpDLEVBQXNDO0FBQ2xDLHFCQUFLSixFQUFMLENBQVFLLE9BQVIsQ0FBZ0IsS0FBS0gsR0FBckIsRUFBMEJFLENBQTFCLEVBQTZCQSxDQUE3QjtBQUNIO0FBQ0o7Ozs7O2tCQWpDZ0JYLGMiLCJmaWxlIjoiYW1iaS1vcmRlckxpbWl0ZXIyRC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyAgQXJjaG9udGlzIFBvbGl0aXNcbi8vICBhcmNob250aXMucG9saXRpc0BhYWx0by5maVxuLy8gIERhdmlkIFBvaXJpZXItUXVpbm90XG4vLyAgZGF2aXBvaXJAaXJjYW0uZnJcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vL1xuLy8gIEpTQW1iaXNvbmljcyBhIEphdmFTY3JpcHQgbGlicmFyeSBmb3IgaGlnaGVyLW9yZGVyIEFtYmlzb25pY3Ncbi8vICBUaGUgbGlicmFyeSBpbXBsZW1lbnRzIFdlYiBBdWRpbyBibG9ja3MgdGhhdCBwZXJmb3JtXG4vLyAgdHlwaWNhbCBhbWJpc29uaWMgcHJvY2Vzc2luZyBvcGVyYXRpb25zIG9uIGF1ZGlvIHNpZ25hbHMuXG4vL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vL1xuLy8gIG9yZGVyTGltaXRlciBmb3IgMkQgdXNlXG4vLyAgYWRhcHRlZCBieSBUaG9tYXMgRGVwcGlzY2hcbi8vICB0aG9tYXMuZGVwcGlzY2g5M0BnbWFpbC5jb21cbi8vXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLyogSE9BIE9SREVSIExJTUlURVIgMkQqL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBvcmRlckxpbWl0ZXIyRCB7XG5cbiAgICBjb25zdHJ1Y3RvcihhdWRpb0N0eCwgb3JkZXJJbiwgb3JkZXJPdXQpIHtcblxuICAgICAgICB0aGlzLmN0eCA9IGF1ZGlvQ3R4O1xuICAgICAgICB0aGlzLm9yZGVySW4gPSBvcmRlckluO1xuICAgICAgICBpZiAob3JkZXJPdXQgPCBvcmRlckluKSB0aGlzLm9yZGVyT3V0ID0gb3JkZXJPdXQ7XG4gICAgICAgIGVsc2UgdGhpcy5vcmRlck91dCA9IG9yZGVySW47XG5cbiAgICAgICAgdGhpcy5uQ2hJbiA9IDIgKiB0aGlzLm9yZGVySW4gKyAxO1xuICAgICAgICB0aGlzLm5DaE91dCA9IDIgKiB0aGlzLm9yZGVyT3V0ICsgMTtcbiAgICAgICAgdGhpcy5pbiA9IHRoaXMuY3R4LmNyZWF0ZUNoYW5uZWxTcGxpdHRlcih0aGlzLm5DaEluKTtcbiAgICAgICAgdGhpcy5vdXQgPSB0aGlzLmN0eC5jcmVhdGVDaGFubmVsTWVyZ2VyKHRoaXMubkNoT3V0KTtcblxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMubkNoT3V0OyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMuaW4uY29ubmVjdCh0aGlzLm91dCwgaSwgaSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB1cGRhdGVPcmRlcihvcmRlck91dCkge1xuXG4gICAgICAgIGlmIChvcmRlck91dCA8PSB0aGlzLm9yZGVySW4pIHtcbiAgICAgICAgICAgIHRoaXMub3JkZXJPdXQgPSBvcmRlck91dDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHJldHVybjtcblxuICAgICAgICB0aGlzLm5DaE91dCA9IDIgKiB0aGlzLm9yZGVyT3V0ICsgMTtcbiAgICAgICAgdGhpcy5vdXQuZGlzY29ubmVjdCgpO1xuICAgICAgICB0aGlzLm91dCA9IHRoaXMuY3R4LmNyZWF0ZUNoYW5uZWxNZXJnZXIodGhpcy5uQ2hPdXQpO1xuXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5uQ2hPdXQ7IGkrKykge1xuICAgICAgICAgICAgdGhpcy5pbi5jb25uZWN0KHRoaXMub3V0LCBpLCBpKTtcbiAgICAgICAgfVxuICAgIH1cbn1cbiJdfQ==