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

///////////////////////
/* HOA ORDER LIMITER */
///////////////////////

var HOA_orderLimiter = function () {
    function HOA_orderLimiter(audioCtx, orderIn, orderOut) {
        (0, _classCallCheck3.default)(this, HOA_orderLimiter);


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

    (0, _createClass3.default)(HOA_orderLimiter, [{
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
    return HOA_orderLimiter;
}();

exports.default = HOA_orderLimiter;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImhvYS1saW1pdGVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQWlCcUIsZ0I7QUFFakIsOEJBQVksUUFBWixFQUFzQixPQUF0QixFQUErQixRQUEvQixFQUF5QztBQUFBOzs7QUFFckMsYUFBSyxHQUFMLEdBQVcsUUFBWDtBQUNBLGFBQUssT0FBTCxHQUFlLE9BQWY7QUFDQSxZQUFJLFdBQVcsT0FBZixFQUF3QixLQUFLLFFBQUwsR0FBZ0IsUUFBaEIsQ0FBeEIsS0FDSyxLQUFLLFFBQUwsR0FBZ0IsT0FBaEI7O0FBRUwsYUFBSyxLQUFMLEdBQWEsQ0FBQyxLQUFLLE9BQUwsR0FBZSxDQUFoQixLQUFzQixLQUFLLE9BQUwsR0FBZSxDQUFyQyxDQUFiO0FBQ0EsYUFBSyxNQUFMLEdBQWMsQ0FBQyxLQUFLLFFBQUwsR0FBZ0IsQ0FBakIsS0FBdUIsS0FBSyxRQUFMLEdBQWdCLENBQXZDLENBQWQ7QUFDQSxhQUFLLEVBQUwsR0FBVSxLQUFLLEdBQUwsQ0FBUyxxQkFBVCxDQUErQixLQUFLLEtBQXBDLENBQVY7QUFDQSxhQUFLLEdBQUwsR0FBVyxLQUFLLEdBQUwsQ0FBUyxtQkFBVCxDQUE2QixLQUFLLE1BQWxDLENBQVg7O0FBRUEsYUFBSyxJQUFJLElBQUksQ0FBYixFQUFnQixJQUFJLEtBQUssTUFBekIsRUFBaUMsR0FBakMsRUFBc0M7QUFDbEMsaUJBQUssRUFBTCxDQUFRLE9BQVIsQ0FBZ0IsS0FBSyxHQUFyQixFQUEwQixDQUExQixFQUE2QixDQUE3QjtBQUNIO0FBQ0o7Ozs7b0NBRVcsUSxFQUFVOztBQUVsQixnQkFBSSxZQUFZLEtBQUssT0FBckIsRUFBOEI7QUFDMUIscUJBQUssUUFBTCxHQUFnQixRQUFoQjtBQUNILGFBRkQsTUFHSzs7QUFFTCxpQkFBSyxNQUFMLEdBQWMsQ0FBQyxLQUFLLFFBQUwsR0FBZ0IsQ0FBakIsS0FBdUIsS0FBSyxRQUFMLEdBQWdCLENBQXZDLENBQWQ7QUFDQSxpQkFBSyxHQUFMLENBQVMsVUFBVDtBQUNBLGlCQUFLLEdBQUwsR0FBVyxLQUFLLEdBQUwsQ0FBUyxtQkFBVCxDQUE2QixLQUFLLE1BQWxDLENBQVg7O0FBRUEsaUJBQUssSUFBSSxJQUFJLENBQWIsRUFBZ0IsSUFBSSxLQUFLLE1BQXpCLEVBQWlDLEdBQWpDLEVBQXNDO0FBQ2xDLHFCQUFLLEVBQUwsQ0FBUSxPQUFSLENBQWdCLEtBQUssR0FBckIsRUFBMEIsQ0FBMUIsRUFBNkIsQ0FBN0I7QUFDSDtBQUNKOzs7OztrQkFqQ2dCLGdCIiwiZmlsZSI6ImhvYS1saW1pdGVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vICBBcmNob250aXMgUG9saXRpc1xuLy8gIGFyY2hvbnRpcy5wb2xpdGlzQGFhbHRvLmZpXG4vLyAgRGF2aWQgUG9pcmllci1RdWlub3Rcbi8vICBkYXZpcG9pckBpcmNhbS5mclxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vXG4vLyAgV2ViQXVkaW9fSE9BIGEgSmF2YVNjcmlwdCBsaWJyYXJ5IGZvciBoaWdoZXItb3JkZXIgQW1iaXNvbmljc1xuLy8gIFRoZSBsaWJyYXJ5IGltcGxlbWVudHMgV2ViIEF1ZGlvIGJsb2NrcyB0aGF0IHBlcmZvcm1cbi8vICB0eXBpY2FsIGFtYmlzb25pYyBwcm9jZXNzaW5nIG9wZXJhdGlvbnMgb24gYXVkaW8gc2lnbmFscy5cbi8vXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLyogSE9BIE9SREVSIExJTUlURVIgKi9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEhPQV9vcmRlckxpbWl0ZXIge1xuXG4gICAgY29uc3RydWN0b3IoYXVkaW9DdHgsIG9yZGVySW4sIG9yZGVyT3V0KSB7XG5cbiAgICAgICAgdGhpcy5jdHggPSBhdWRpb0N0eDtcbiAgICAgICAgdGhpcy5vcmRlckluID0gb3JkZXJJbjtcbiAgICAgICAgaWYgKG9yZGVyT3V0IDwgb3JkZXJJbikgdGhpcy5vcmRlck91dCA9IG9yZGVyT3V0O1xuICAgICAgICBlbHNlIHRoaXMub3JkZXJPdXQgPSBvcmRlckluO1xuXG4gICAgICAgIHRoaXMubkNoSW4gPSAodGhpcy5vcmRlckluICsgMSkgKiAodGhpcy5vcmRlckluICsgMSk7XG4gICAgICAgIHRoaXMubkNoT3V0ID0gKHRoaXMub3JkZXJPdXQgKyAxKSAqICh0aGlzLm9yZGVyT3V0ICsgMSk7XG4gICAgICAgIHRoaXMuaW4gPSB0aGlzLmN0eC5jcmVhdGVDaGFubmVsU3BsaXR0ZXIodGhpcy5uQ2hJbik7XG4gICAgICAgIHRoaXMub3V0ID0gdGhpcy5jdHguY3JlYXRlQ2hhbm5lbE1lcmdlcih0aGlzLm5DaE91dCk7XG5cbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLm5DaE91dDsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLmluLmNvbm5lY3QodGhpcy5vdXQsIGksIGkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgdXBkYXRlT3JkZXIob3JkZXJPdXQpIHtcblxuICAgICAgICBpZiAob3JkZXJPdXQgPD0gdGhpcy5vcmRlckluKSB7XG4gICAgICAgICAgICB0aGlzLm9yZGVyT3V0ID0gb3JkZXJPdXQ7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSByZXR1cm47XG5cbiAgICAgICAgdGhpcy5uQ2hPdXQgPSAodGhpcy5vcmRlck91dCArIDEpICogKHRoaXMub3JkZXJPdXQgKyAxKTtcbiAgICAgICAgdGhpcy5vdXQuZGlzY29ubmVjdCgpO1xuICAgICAgICB0aGlzLm91dCA9IHRoaXMuY3R4LmNyZWF0ZUNoYW5uZWxNZXJnZXIodGhpcy5uQ2hPdXQpO1xuXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5uQ2hPdXQ7IGkrKykge1xuICAgICAgICAgICAgdGhpcy5pbi5jb25uZWN0KHRoaXMub3V0LCBpLCBpKTtcbiAgICAgICAgfVxuICAgIH1cbn1cbiJdfQ==