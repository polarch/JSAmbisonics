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
//  sceneMirror for 2D use
//  adapted by Thomas Deppisch
//  thomas.deppisch93@gmail.com
//
////////////////////////////////////////////////////////////////////
//////////////////
/* HOA MIRROR 2D*/
//////////////////

var sceneMirror2D = function () {
    function sceneMirror2D(audioCtx, order) {
        (0, _classCallCheck3.default)(this, sceneMirror2D);


        this.ctx = audioCtx;
        this.order = order;
        this.nCh = 2 * order + 1;
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

    (0, _createClass3.default)(sceneMirror2D, [{
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
                    for (var i = 2; i < this.nCh; i++) {
                        this.gains[i].gain.value = -1;
                        if (i % 2 != 0) i = i + 2;
                    }
                    break;
                case 2:
                    // mirroring on xz-plane (left-right)
                    this.reset();
                    this.mirrorPlane = 2;
                    for (var i = 0; i < this.nCh; i++) {
                        if (i % 2 != 0) this.gains[i].gain.value = -1;
                    }
                    break;
                case 3:
                    // mirroring on xy-plane (up-down)
                    console.log("up-down mirroring in 2D mode not possible");
                    break;
                default:
                    console.log("The mirroring planes can be either 1 (yz), 2 (xz) or 0 (no mirroring). Value set to 0.");
                    this.mirrorPlane = 0;
                    this.reset();
            }
        }
    }]);
    return sceneMirror2D;
}();

exports.default = sceneMirror2D;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFtYmktc2NlbmVNaXJyb3IyRC5qcyJdLCJuYW1lcyI6WyJzY2VuZU1pcnJvcjJEIiwiYXVkaW9DdHgiLCJvcmRlciIsImN0eCIsIm5DaCIsIm1pcnJvclBsYW5lIiwiaW4iLCJjcmVhdGVDaGFubmVsU3BsaXR0ZXIiLCJvdXQiLCJjcmVhdGVDaGFubmVsTWVyZ2VyIiwiZ2FpbnMiLCJBcnJheSIsInEiLCJjcmVhdGVHYWluIiwiZ2FpbiIsInZhbHVlIiwiY29ubmVjdCIsInBsYW5lTm8iLCJyZXNldCIsImkiLCJjb25zb2xlIiwibG9nIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0lBRXFCQSxhO0FBRWpCLDJCQUFZQyxRQUFaLEVBQXNCQyxLQUF0QixFQUE2QjtBQUFBOzs7QUFFekIsYUFBS0MsR0FBTCxHQUFXRixRQUFYO0FBQ0EsYUFBS0MsS0FBTCxHQUFhQSxLQUFiO0FBQ0EsYUFBS0UsR0FBTCxHQUFXLElBQUlGLEtBQUosR0FBWSxDQUF2QjtBQUNBLGFBQUtHLFdBQUwsR0FBbUIsQ0FBbkI7QUFDQTtBQUNBLGFBQUtDLEVBQUwsR0FBVSxLQUFLSCxHQUFMLENBQVNJLHFCQUFULENBQStCLEtBQUtILEdBQXBDLENBQVY7QUFDQSxhQUFLSSxHQUFMLEdBQVcsS0FBS0wsR0FBTCxDQUFTTSxtQkFBVCxDQUE2QixLQUFLTCxHQUFsQyxDQUFYO0FBQ0E7QUFDQSxhQUFLTSxLQUFMLEdBQWEsSUFBSUMsS0FBSixDQUFVLEtBQUtQLEdBQWYsQ0FBYjtBQUNBLGFBQUssSUFBSVEsSUFBSSxDQUFiLEVBQWdCQSxJQUFJLEtBQUtSLEdBQXpCLEVBQThCUSxHQUE5QixFQUFtQztBQUMvQixpQkFBS0YsS0FBTCxDQUFXRSxDQUFYLElBQWdCLEtBQUtULEdBQUwsQ0FBU1UsVUFBVCxFQUFoQjtBQUNBLGlCQUFLSCxLQUFMLENBQVdFLENBQVgsRUFBY0UsSUFBZCxDQUFtQkMsS0FBbkIsR0FBMkIsQ0FBM0I7QUFDQTtBQUNBLGlCQUFLVCxFQUFMLENBQVFVLE9BQVIsQ0FBZ0IsS0FBS04sS0FBTCxDQUFXRSxDQUFYLENBQWhCLEVBQStCQSxDQUEvQixFQUFrQyxDQUFsQztBQUNBLGlCQUFLRixLQUFMLENBQVdFLENBQVgsRUFBY0ksT0FBZCxDQUFzQixLQUFLUixHQUEzQixFQUFnQyxDQUFoQyxFQUFtQ0ksQ0FBbkM7QUFDSDtBQUVKOzs7O2dDQUVPOztBQUVKLGlCQUFLLElBQUlBLElBQUksQ0FBYixFQUFnQkEsSUFBSSxLQUFLUixHQUF6QixFQUE4QlEsR0FBOUIsRUFBbUM7QUFDL0IscUJBQUtGLEtBQUwsQ0FBV0UsQ0FBWCxFQUFjRSxJQUFkLENBQW1CQyxLQUFuQixHQUEyQixDQUEzQjtBQUNIO0FBQ0o7OzsrQkFFTUUsTyxFQUFTOztBQUVaLG9CQUFPQSxPQUFQO0FBQ0kscUJBQUssQ0FBTDtBQUNJLHlCQUFLWixXQUFMLEdBQW1CLENBQW5CO0FBQ0EseUJBQUthLEtBQUw7QUFDQTtBQUNKLHFCQUFLLENBQUw7QUFDSTtBQUNBLHlCQUFLQSxLQUFMO0FBQ0EseUJBQUtiLFdBQUwsR0FBbUIsQ0FBbkI7QUFDQSx5QkFBSyxJQUFJYyxJQUFJLENBQWIsRUFBZ0JBLElBQUksS0FBS2YsR0FBekIsRUFBOEJlLEdBQTlCLEVBQW1DO0FBQy9CLDZCQUFLVCxLQUFMLENBQVdTLENBQVgsRUFBY0wsSUFBZCxDQUFtQkMsS0FBbkIsR0FBMkIsQ0FBQyxDQUE1QjtBQUNBLDRCQUFJSSxJQUFFLENBQUYsSUFBTyxDQUFYLEVBQWNBLElBQUlBLElBQUksQ0FBUjtBQUNqQjtBQUNEO0FBQ0oscUJBQUssQ0FBTDtBQUNJO0FBQ0EseUJBQUtELEtBQUw7QUFDQSx5QkFBS2IsV0FBTCxHQUFtQixDQUFuQjtBQUNBLHlCQUFLLElBQUljLElBQUksQ0FBYixFQUFnQkEsSUFBSSxLQUFLZixHQUF6QixFQUE4QmUsR0FBOUIsRUFBbUM7QUFDL0IsNEJBQUlBLElBQUUsQ0FBRixJQUFPLENBQVgsRUFBYyxLQUFLVCxLQUFMLENBQVdTLENBQVgsRUFBY0wsSUFBZCxDQUFtQkMsS0FBbkIsR0FBMkIsQ0FBQyxDQUE1QjtBQUNqQjtBQUNEO0FBQ0oscUJBQUssQ0FBTDtBQUNJO0FBQ0FLLDRCQUFRQyxHQUFSLENBQVksMkNBQVo7QUFDQTtBQUNKO0FBQ0lELDRCQUFRQyxHQUFSLENBQVksd0ZBQVo7QUFDQSx5QkFBS2hCLFdBQUwsR0FBbUIsQ0FBbkI7QUFDQSx5QkFBS2EsS0FBTDtBQTdCUjtBQWlDSDs7Ozs7a0JBakVnQmxCLGEiLCJmaWxlIjoiYW1iaS1zY2VuZU1pcnJvcjJELmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vICBBcmNob250aXMgUG9saXRpc1xuLy8gIGFyY2hvbnRpcy5wb2xpdGlzQGFhbHRvLmZpXG4vLyAgRGF2aWQgUG9pcmllci1RdWlub3Rcbi8vICBkYXZpcG9pckBpcmNhbS5mclxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vXG4vLyAgSlNBbWJpc29uaWNzIGEgSmF2YVNjcmlwdCBsaWJyYXJ5IGZvciBoaWdoZXItb3JkZXIgQW1iaXNvbmljc1xuLy8gIFRoZSBsaWJyYXJ5IGltcGxlbWVudHMgV2ViIEF1ZGlvIGJsb2NrcyB0aGF0IHBlcmZvcm1cbi8vICB0eXBpY2FsIGFtYmlzb25pYyBwcm9jZXNzaW5nIG9wZXJhdGlvbnMgb24gYXVkaW8gc2lnbmFscy5cbi8vXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vXG4vLyAgc2NlbmVNaXJyb3IgZm9yIDJEIHVzZVxuLy8gIGFkYXB0ZWQgYnkgVGhvbWFzIERlcHBpc2NoXG4vLyAgdGhvbWFzLmRlcHBpc2NoOTNAZ21haWwuY29tXG4vL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLyogSE9BIE1JUlJPUiAyRCovXG4vLy8vLy8vLy8vLy8vLy8vLy9cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3Mgc2NlbmVNaXJyb3IyRCB7XG5cbiAgICBjb25zdHJ1Y3RvcihhdWRpb0N0eCwgb3JkZXIpIHtcblxuICAgICAgICB0aGlzLmN0eCA9IGF1ZGlvQ3R4O1xuICAgICAgICB0aGlzLm9yZGVyID0gb3JkZXI7XG4gICAgICAgIHRoaXMubkNoID0gMiAqIG9yZGVyICsgMTtcbiAgICAgICAgdGhpcy5taXJyb3JQbGFuZSA9IDA7XG4gICAgICAgIC8vIElucHV0IGFuZCBvdXRwdXQgbm9kZXNcbiAgICAgICAgdGhpcy5pbiA9IHRoaXMuY3R4LmNyZWF0ZUNoYW5uZWxTcGxpdHRlcih0aGlzLm5DaCk7XG4gICAgICAgIHRoaXMub3V0ID0gdGhpcy5jdHguY3JlYXRlQ2hhbm5lbE1lcmdlcih0aGlzLm5DaCk7XG4gICAgICAgIC8vIEluaXRpYWxpemUgbWlycm9yaW5nIGdhaW5zIHRvIHVuaXR5IChubyByZWZsZWN0aW9uKSBhbmQgY29ubmVjdFxuICAgICAgICB0aGlzLmdhaW5zID0gbmV3IEFycmF5KHRoaXMubkNoKTtcbiAgICAgICAgZm9yICh2YXIgcSA9IDA7IHEgPCB0aGlzLm5DaDsgcSsrKSB7XG4gICAgICAgICAgICB0aGlzLmdhaW5zW3FdID0gdGhpcy5jdHguY3JlYXRlR2FpbigpO1xuICAgICAgICAgICAgdGhpcy5nYWluc1txXS5nYWluLnZhbHVlID0gMTtcbiAgICAgICAgICAgIC8vIENyZWF0ZSBjb25uZWN0aW9uc1xuICAgICAgICAgICAgdGhpcy5pbi5jb25uZWN0KHRoaXMuZ2FpbnNbcV0sIHEsIDApO1xuICAgICAgICAgICAgdGhpcy5nYWluc1txXS5jb25uZWN0KHRoaXMub3V0LCAwLCBxKTtcbiAgICAgICAgfVxuXG4gICAgfVxuXG4gICAgcmVzZXQoKSB7XG5cbiAgICAgICAgZm9yICh2YXIgcSA9IDA7IHEgPCB0aGlzLm5DaDsgcSsrKSB7XG4gICAgICAgICAgICB0aGlzLmdhaW5zW3FdLmdhaW4udmFsdWUgPSAxO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgbWlycm9yKHBsYW5lTm8pIHtcblxuICAgICAgICBzd2l0Y2gocGxhbmVObykge1xuICAgICAgICAgICAgY2FzZSAwOlxuICAgICAgICAgICAgICAgIHRoaXMubWlycm9yUGxhbmUgPSAwO1xuICAgICAgICAgICAgICAgIHRoaXMucmVzZXQoKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgMTpcbiAgICAgICAgICAgICAgICAvLyBtaXJyb3Jpbmcgb24geXotcGxhbmUgKGZyb250LWJhY2spXG4gICAgICAgICAgICAgICAgdGhpcy5yZXNldCgpO1xuICAgICAgICAgICAgICAgIHRoaXMubWlycm9yUGxhbmUgPSAxO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAyOyBpIDwgdGhpcy5uQ2g7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmdhaW5zW2ldLmdhaW4udmFsdWUgPSAtMTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGklMiAhPSAwKSBpID0gaSArIDI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAyOlxuICAgICAgICAgICAgICAgIC8vIG1pcnJvcmluZyBvbiB4ei1wbGFuZSAobGVmdC1yaWdodClcbiAgICAgICAgICAgICAgICB0aGlzLnJlc2V0KCk7XG4gICAgICAgICAgICAgICAgdGhpcy5taXJyb3JQbGFuZSA9IDI7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm5DaDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpJTIgIT0gMCkgdGhpcy5nYWluc1tpXS5nYWluLnZhbHVlID0gLTE7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAzOlxuICAgICAgICAgICAgICAgIC8vIG1pcnJvcmluZyBvbiB4eS1wbGFuZSAodXAtZG93bilcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcInVwLWRvd24gbWlycm9yaW5nIGluIDJEIG1vZGUgbm90IHBvc3NpYmxlXCIpXG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiVGhlIG1pcnJvcmluZyBwbGFuZXMgY2FuIGJlIGVpdGhlciAxICh5eiksIDIgKHh6KSBvciAwIChubyBtaXJyb3JpbmcpLiBWYWx1ZSBzZXQgdG8gMC5cIilcbiAgICAgICAgICAgICAgICB0aGlzLm1pcnJvclBsYW5lID0gMDtcbiAgICAgICAgICAgICAgICB0aGlzLnJlc2V0KCk7XG4gICAgICAgIH1cblxuXG4gICAgfVxuXG59XG4iXX0=