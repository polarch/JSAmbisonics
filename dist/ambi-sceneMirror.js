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

/////////////////
/* HOA MIRROR */
/////////////////

var sceneMirror = function () {
    function sceneMirror(audioCtx, order) {
        (0, _classCallCheck3.default)(this, sceneMirror);


        this.ctx = audioCtx;
        this.order = order;
        this.nCh = (order + 1) * (order + 1);
        this.mirrorPlane = 0;
        // Input and output nodes
        this.in = this.ctx.createChannelSplitter(this.nCh);
        this.out = this.ctx.createChannelMerger(this.nCh);
        // Initialize mirroring gains to unity (no reflection) and connect
        this.gains = new Array(this.nCh);
        for (var q = 0; q < this.nCh; q++) {
            this.gains[q] = this.ctx.createGain();
            this.gains[q].gain.value = 1;
            // Create connections
            this.in.connect(this.gains[q], q, 0);
            this.gains[q].connect(this.out, 0, q);
        }
    }

    (0, _createClass3.default)(sceneMirror, [{
        key: "reset",
        value: function reset() {

            for (var q = 0; q < this.nCh; q++) {
                this.gains[q].gain.value = 1;
            }
        }
    }, {
        key: "mirror",
        value: function mirror(planeNo) {

            switch (planeNo) {
                case 0:
                    this.mirrorPlane = 0;
                    this.reset();
                    break;
                case 1:
                    // mirroring on yz-plane (front-back)
                    this.reset();
                    this.mirrorPlane = 1;
                    var q;
                    for (var n = 0; n <= this.order; n++) {
                        for (var m = -n; m <= n; m++) {
                            q = n * n + n + m;
                            if (m < 0 && m % 2 == 0 || m > 0 && m % 2 == 1) this.gains[q].gain.value = -1;
                        }
                    }
                    break;
                case 2:
                    // mirroring on xz-plane (left-right)
                    this.reset();
                    this.mirrorPlane = 2;
                    var q;
                    for (var n = 0; n <= this.order; n++) {
                        for (var m = -n; m <= n; m++) {
                            q = n * n + n + m;
                            if (m < 0) this.gains[q].gain.value = -1;
                        }
                    }
                    break;
                case 3:
                    // mirroring on xy-plane (up-down)
                    this.reset();
                    this.mirrorPlane = 3;
                    var q;
                    for (var n = 0; n <= this.order; n++) {
                        for (var m = -n; m <= n; m++) {
                            q = n * n + n + m;
                            if ((m + n) % 2 == 1) this.gains[q].gain.value = -1;
                        }
                    }
                    break;
                default:
                    console.log("The mirroring planes can be either 1 (yz), 2 (xz), 3 (xy), or 0 (no mirroring). Value set to 0.");
                    this.mirrorPlane = 0;
                    this.reset();
            }
        }
    }]);
    return sceneMirror;
}();

exports.default = sceneMirror;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFtYmktc2NlbmVNaXJyb3IuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBaUJxQixXO0FBRWpCLHlCQUFZLFFBQVosRUFBc0IsS0FBdEIsRUFBNkI7QUFBQTs7O0FBRXpCLGFBQUssR0FBTCxHQUFXLFFBQVg7QUFDQSxhQUFLLEtBQUwsR0FBYSxLQUFiO0FBQ0EsYUFBSyxHQUFMLEdBQVcsQ0FBQyxRQUFRLENBQVQsS0FBZSxRQUFRLENBQXZCLENBQVg7QUFDQSxhQUFLLFdBQUwsR0FBbUIsQ0FBbkI7O0FBRUEsYUFBSyxFQUFMLEdBQVUsS0FBSyxHQUFMLENBQVMscUJBQVQsQ0FBK0IsS0FBSyxHQUFwQyxDQUFWO0FBQ0EsYUFBSyxHQUFMLEdBQVcsS0FBSyxHQUFMLENBQVMsbUJBQVQsQ0FBNkIsS0FBSyxHQUFsQyxDQUFYOztBQUVBLGFBQUssS0FBTCxHQUFhLElBQUksS0FBSixDQUFVLEtBQUssR0FBZixDQUFiO0FBQ0EsYUFBSyxJQUFJLElBQUksQ0FBYixFQUFnQixJQUFJLEtBQUssR0FBekIsRUFBOEIsR0FBOUIsRUFBbUM7QUFDL0IsaUJBQUssS0FBTCxDQUFXLENBQVgsSUFBZ0IsS0FBSyxHQUFMLENBQVMsVUFBVCxFQUFoQjtBQUNBLGlCQUFLLEtBQUwsQ0FBVyxDQUFYLEVBQWMsSUFBZCxDQUFtQixLQUFuQixHQUEyQixDQUEzQjs7QUFFQSxpQkFBSyxFQUFMLENBQVEsT0FBUixDQUFnQixLQUFLLEtBQUwsQ0FBVyxDQUFYLENBQWhCLEVBQStCLENBQS9CLEVBQWtDLENBQWxDO0FBQ0EsaUJBQUssS0FBTCxDQUFXLENBQVgsRUFBYyxPQUFkLENBQXNCLEtBQUssR0FBM0IsRUFBZ0MsQ0FBaEMsRUFBbUMsQ0FBbkM7QUFDSDtBQUVKOzs7O2dDQUVPOztBQUVKLGlCQUFLLElBQUksSUFBSSxDQUFiLEVBQWdCLElBQUksS0FBSyxHQUF6QixFQUE4QixHQUE5QixFQUFtQztBQUMvQixxQkFBSyxLQUFMLENBQVcsQ0FBWCxFQUFjLElBQWQsQ0FBbUIsS0FBbkIsR0FBMkIsQ0FBM0I7QUFDSDtBQUNKOzs7K0JBRU0sTyxFQUFTOztBQUVaLG9CQUFPLE9BQVA7QUFDSSxxQkFBSyxDQUFMO0FBQ0kseUJBQUssV0FBTCxHQUFtQixDQUFuQjtBQUNBLHlCQUFLLEtBQUw7QUFDQTtBQUNKLHFCQUFLLENBQUw7O0FBRUkseUJBQUssS0FBTDtBQUNBLHlCQUFLLFdBQUwsR0FBbUIsQ0FBbkI7QUFDQSx3QkFBSSxDQUFKO0FBQ0EseUJBQUssSUFBSSxJQUFJLENBQWIsRUFBZ0IsS0FBSyxLQUFLLEtBQTFCLEVBQWlDLEdBQWpDLEVBQXNDO0FBQ2xDLDZCQUFLLElBQUksSUFBSSxDQUFDLENBQWQsRUFBaUIsS0FBSyxDQUF0QixFQUF5QixHQUF6QixFQUE4QjtBQUMxQixnQ0FBSSxJQUFFLENBQUYsR0FBSSxDQUFKLEdBQU0sQ0FBVjtBQUNBLGdDQUFLLElBQUUsQ0FBRixJQUFPLElBQUUsQ0FBRixJQUFLLENBQWIsSUFBa0IsSUFBRSxDQUFGLElBQU8sSUFBRSxDQUFGLElBQUssQ0FBbEMsRUFBc0MsS0FBSyxLQUFMLENBQVcsQ0FBWCxFQUFjLElBQWQsQ0FBbUIsS0FBbkIsR0FBMkIsQ0FBQyxDQUE1QjtBQUN6QztBQUNKO0FBQ0Q7QUFDSixxQkFBSyxDQUFMOztBQUVJLHlCQUFLLEtBQUw7QUFDQSx5QkFBSyxXQUFMLEdBQW1CLENBQW5CO0FBQ0Esd0JBQUksQ0FBSjtBQUNBLHlCQUFLLElBQUksSUFBSSxDQUFiLEVBQWdCLEtBQUssS0FBSyxLQUExQixFQUFpQyxHQUFqQyxFQUFzQztBQUNsQyw2QkFBSyxJQUFJLElBQUksQ0FBQyxDQUFkLEVBQWlCLEtBQUssQ0FBdEIsRUFBeUIsR0FBekIsRUFBOEI7QUFDMUIsZ0NBQUksSUFBRSxDQUFGLEdBQUksQ0FBSixHQUFNLENBQVY7QUFDQSxnQ0FBSSxJQUFFLENBQU4sRUFBUyxLQUFLLEtBQUwsQ0FBVyxDQUFYLEVBQWMsSUFBZCxDQUFtQixLQUFuQixHQUEyQixDQUFDLENBQTVCO0FBQ1o7QUFDSjtBQUNEO0FBQ0oscUJBQUssQ0FBTDs7QUFFSSx5QkFBSyxLQUFMO0FBQ0EseUJBQUssV0FBTCxHQUFtQixDQUFuQjtBQUNBLHdCQUFJLENBQUo7QUFDQSx5QkFBSyxJQUFJLElBQUksQ0FBYixFQUFnQixLQUFLLEtBQUssS0FBMUIsRUFBaUMsR0FBakMsRUFBc0M7QUFDbEMsNkJBQUssSUFBSSxJQUFJLENBQUMsQ0FBZCxFQUFpQixLQUFLLENBQXRCLEVBQXlCLEdBQXpCLEVBQThCO0FBQzFCLGdDQUFJLElBQUUsQ0FBRixHQUFJLENBQUosR0FBTSxDQUFWO0FBQ0EsZ0NBQUksQ0FBQyxJQUFFLENBQUgsSUFBTSxDQUFOLElBQVMsQ0FBYixFQUFnQixLQUFLLEtBQUwsQ0FBVyxDQUFYLEVBQWMsSUFBZCxDQUFtQixLQUFuQixHQUEyQixDQUFDLENBQTVCO0FBQ25CO0FBQ0o7QUFDRDtBQUNKO0FBQ0ksNEJBQVEsR0FBUixDQUFZLGlHQUFaO0FBQ0EseUJBQUssV0FBTCxHQUFtQixDQUFuQjtBQUNBLHlCQUFLLEtBQUw7QUE1Q1I7QUFnREg7Ozs7O2tCQWhGZ0IsVyIsImZpbGUiOiJhbWJpLXNjZW5lTWlycm9yLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vICBBcmNob250aXMgUG9saXRpc1xuLy8gIGFyY2hvbnRpcy5wb2xpdGlzQGFhbHRvLmZpXG4vLyAgRGF2aWQgUG9pcmllci1RdWlub3Rcbi8vICBkYXZpcG9pckBpcmNhbS5mclxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vXG4vLyAgSlNBbWJpc29uaWNzIGEgSmF2YVNjcmlwdCBsaWJyYXJ5IGZvciBoaWdoZXItb3JkZXIgQW1iaXNvbmljc1xuLy8gIFRoZSBsaWJyYXJ5IGltcGxlbWVudHMgV2ViIEF1ZGlvIGJsb2NrcyB0aGF0IHBlcmZvcm1cbi8vICB0eXBpY2FsIGFtYmlzb25pYyBwcm9jZXNzaW5nIG9wZXJhdGlvbnMgb24gYXVkaW8gc2lnbmFscy5cbi8vXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4vLy8vLy8vLy8vLy8vLy8vL1xuLyogSE9BIE1JUlJPUiAqL1xuLy8vLy8vLy8vLy8vLy8vLy9cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3Mgc2NlbmVNaXJyb3Ige1xuXG4gICAgY29uc3RydWN0b3IoYXVkaW9DdHgsIG9yZGVyKSB7XG5cbiAgICAgICAgdGhpcy5jdHggPSBhdWRpb0N0eDtcbiAgICAgICAgdGhpcy5vcmRlciA9IG9yZGVyO1xuICAgICAgICB0aGlzLm5DaCA9IChvcmRlciArIDEpICogKG9yZGVyICsgMSk7XG4gICAgICAgIHRoaXMubWlycm9yUGxhbmUgPSAwO1xuICAgICAgICAvLyBJbnB1dCBhbmQgb3V0cHV0IG5vZGVzXG4gICAgICAgIHRoaXMuaW4gPSB0aGlzLmN0eC5jcmVhdGVDaGFubmVsU3BsaXR0ZXIodGhpcy5uQ2gpO1xuICAgICAgICB0aGlzLm91dCA9IHRoaXMuY3R4LmNyZWF0ZUNoYW5uZWxNZXJnZXIodGhpcy5uQ2gpO1xuICAgICAgICAvLyBJbml0aWFsaXplIG1pcnJvcmluZyBnYWlucyB0byB1bml0eSAobm8gcmVmbGVjdGlvbikgYW5kIGNvbm5lY3RcbiAgICAgICAgdGhpcy5nYWlucyA9IG5ldyBBcnJheSh0aGlzLm5DaCk7XG4gICAgICAgIGZvciAodmFyIHEgPSAwOyBxIDwgdGhpcy5uQ2g7IHErKykge1xuICAgICAgICAgICAgdGhpcy5nYWluc1txXSA9IHRoaXMuY3R4LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgICAgIHRoaXMuZ2FpbnNbcV0uZ2Fpbi52YWx1ZSA9IDE7XG4gICAgICAgICAgICAvLyBDcmVhdGUgY29ubmVjdGlvbnNcbiAgICAgICAgICAgIHRoaXMuaW4uY29ubmVjdCh0aGlzLmdhaW5zW3FdLCBxLCAwKTtcbiAgICAgICAgICAgIHRoaXMuZ2FpbnNbcV0uY29ubmVjdCh0aGlzLm91dCwgMCwgcSk7XG4gICAgICAgIH1cblxuICAgIH1cbiAgICBcbiAgICByZXNldCgpIHtcbiAgICAgICAgXG4gICAgICAgIGZvciAodmFyIHEgPSAwOyBxIDwgdGhpcy5uQ2g7IHErKykge1xuICAgICAgICAgICAgdGhpcy5nYWluc1txXS5nYWluLnZhbHVlID0gMTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIG1pcnJvcihwbGFuZU5vKSB7XG4gICAgICAgIFxuICAgICAgICBzd2l0Y2gocGxhbmVObykge1xuICAgICAgICAgICAgY2FzZSAwOlxuICAgICAgICAgICAgICAgIHRoaXMubWlycm9yUGxhbmUgPSAwO1xuICAgICAgICAgICAgICAgIHRoaXMucmVzZXQoKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgMTpcbiAgICAgICAgICAgICAgICAvLyBtaXJyb3Jpbmcgb24geXotcGxhbmUgKGZyb250LWJhY2spXG4gICAgICAgICAgICAgICAgdGhpcy5yZXNldCgpO1xuICAgICAgICAgICAgICAgIHRoaXMubWlycm9yUGxhbmUgPSAxO1xuICAgICAgICAgICAgICAgIHZhciBxO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIG4gPSAwOyBuIDw9IHRoaXMub3JkZXI7IG4rKykge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBtID0gLW47IG0gPD0gbjsgbSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBxID0gbipuK24rbTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICgobTwwICYmIG0lMj09MCl8fChtPjAgJiYgbSUyPT0xKSkgdGhpcy5nYWluc1txXS5nYWluLnZhbHVlID0gLTE7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgICAgICAgLy8gbWlycm9yaW5nIG9uIHh6LXBsYW5lIChsZWZ0LXJpZ2h0KVxuICAgICAgICAgICAgICAgIHRoaXMucmVzZXQoKTtcbiAgICAgICAgICAgICAgICB0aGlzLm1pcnJvclBsYW5lID0gMjtcbiAgICAgICAgICAgICAgICB2YXIgcTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBuID0gMDsgbiA8PSB0aGlzLm9yZGVyOyBuKyspIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgbSA9IC1uOyBtIDw9IG47IG0rKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcSA9IG4qbituK207XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobTwwKSB0aGlzLmdhaW5zW3FdLmdhaW4udmFsdWUgPSAtMTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgMzpcbiAgICAgICAgICAgICAgICAvLyBtaXJyb3Jpbmcgb24geHktcGxhbmUgKHVwLWRvd24pXG4gICAgICAgICAgICAgICAgdGhpcy5yZXNldCgpO1xuICAgICAgICAgICAgICAgIHRoaXMubWlycm9yUGxhbmUgPSAzO1xuICAgICAgICAgICAgICAgIHZhciBxO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIG4gPSAwOyBuIDw9IHRoaXMub3JkZXI7IG4rKykge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBtID0gLW47IG0gPD0gbjsgbSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBxID0gbipuK24rbTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICgobStuKSUyPT0xKSB0aGlzLmdhaW5zW3FdLmdhaW4udmFsdWUgPSAtMTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJUaGUgbWlycm9yaW5nIHBsYW5lcyBjYW4gYmUgZWl0aGVyIDEgKHl6KSwgMiAoeHopLCAzICh4eSksIG9yIDAgKG5vIG1pcnJvcmluZykuIFZhbHVlIHNldCB0byAwLlwiKVxuICAgICAgICAgICAgICAgIHRoaXMubWlycm9yUGxhbmUgPSAwO1xuICAgICAgICAgICAgICAgIHRoaXMucmVzZXQoKTtcbiAgICAgICAgfVxuICAgICAgICBcblxuICAgIH1cblxufVxuIl19