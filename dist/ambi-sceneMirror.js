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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFtYmktc2NlbmVNaXJyb3IuanMiXSwibmFtZXMiOlsic2NlbmVNaXJyb3IiLCJhdWRpb0N0eCIsIm9yZGVyIiwiY3R4IiwibkNoIiwibWlycm9yUGxhbmUiLCJpbiIsImNyZWF0ZUNoYW5uZWxTcGxpdHRlciIsIm91dCIsImNyZWF0ZUNoYW5uZWxNZXJnZXIiLCJnYWlucyIsIkFycmF5IiwicSIsImNyZWF0ZUdhaW4iLCJnYWluIiwidmFsdWUiLCJjb25uZWN0IiwicGxhbmVObyIsInJlc2V0IiwibiIsIm0iLCJjb25zb2xlIiwibG9nIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7SUFFcUJBLFc7QUFFakIseUJBQVlDLFFBQVosRUFBc0JDLEtBQXRCLEVBQTZCO0FBQUE7OztBQUV6QixhQUFLQyxHQUFMLEdBQVdGLFFBQVg7QUFDQSxhQUFLQyxLQUFMLEdBQWFBLEtBQWI7QUFDQSxhQUFLRSxHQUFMLEdBQVcsQ0FBQ0YsUUFBUSxDQUFULEtBQWVBLFFBQVEsQ0FBdkIsQ0FBWDtBQUNBLGFBQUtHLFdBQUwsR0FBbUIsQ0FBbkI7QUFDQTtBQUNBLGFBQUtDLEVBQUwsR0FBVSxLQUFLSCxHQUFMLENBQVNJLHFCQUFULENBQStCLEtBQUtILEdBQXBDLENBQVY7QUFDQSxhQUFLSSxHQUFMLEdBQVcsS0FBS0wsR0FBTCxDQUFTTSxtQkFBVCxDQUE2QixLQUFLTCxHQUFsQyxDQUFYO0FBQ0E7QUFDQSxhQUFLTSxLQUFMLEdBQWEsSUFBSUMsS0FBSixDQUFVLEtBQUtQLEdBQWYsQ0FBYjtBQUNBLGFBQUssSUFBSVEsSUFBSSxDQUFiLEVBQWdCQSxJQUFJLEtBQUtSLEdBQXpCLEVBQThCUSxHQUE5QixFQUFtQztBQUMvQixpQkFBS0YsS0FBTCxDQUFXRSxDQUFYLElBQWdCLEtBQUtULEdBQUwsQ0FBU1UsVUFBVCxFQUFo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QW1CLENBQW5CO0FBQ0EseUJBQUthLEtBQUw7QUE1Q1I7QUFnREg7Ozs7O2tCQWhGZ0JsQixXIiwiZmlsZSI6ImFtYmktc2NlbmVNaXJyb3IuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gIEFyY2hvbnRpcyBQb2xpdGlzXG4vLyAgYXJjaG9udGlzLnBvbGl0aXNAYWFsdG8uZmlcbi8vICBEYXZpZCBQb2lyaWVyLVF1aW5vdFxuLy8gIGRhdmlwb2lyQGlyY2FtLmZyXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy9cbi8vICBKU0FtYmlzb25pY3MgYSBKYXZhU2NyaXB0IGxpYnJhcnkgZm9yIGhpZ2hlci1vcmRlciBBbWJpc29uaWNzXG4vLyAgVGhlIGxpYnJhcnkgaW1wbGVtZW50cyBXZWIgQXVkaW8gYmxvY2tzIHRoYXQgcGVyZm9ybVxuLy8gIHR5cGljYWwgYW1iaXNvbmljIHByb2Nlc3Npbmcgb3BlcmF0aW9ucyBvbiBhdWRpbyBzaWduYWxzLlxuLy9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbi8vLy8vLy8vLy8vLy8vLy8vXG4vKiBIT0EgTUlSUk9SICovXG4vLy8vLy8vLy8vLy8vLy8vL1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBzY2VuZU1pcnJvciB7XG5cbiAgICBjb25zdHJ1Y3RvcihhdWRpb0N0eCwgb3JkZXIpIHtcblxuICAgICAgICB0aGlzLmN0eCA9IGF1ZGlvQ3R4O1xuICAgICAgICB0aGlzLm9yZGVyID0gb3JkZXI7XG4gICAgICAgIHRoaXMubkNoID0gKG9yZGVyICsgMSkgKiAob3JkZXIgKyAxKTtcbiAgICAgICAgdGhpcy5taXJyb3JQbGFuZSA9IDA7XG4gICAgICAgIC8vIElucHV0IGFuZCBvdXRwdXQgbm9kZXNcbiAgICAgICAgdGhpcy5pbiA9IHRoaXMuY3R4LmNyZWF0ZUNoYW5uZWxTcGxpdHRlcih0aGlzLm5DaCk7XG4gICAgICAgIHRoaXMub3V0ID0gdGhpcy5jdHguY3JlYXRlQ2hhbm5lbE1lcmdlcih0aGlzLm5DaCk7XG4gICAgICAgIC8vIEluaXRpYWxpemUgbWlycm9yaW5nIGdhaW5zIHRvIHVuaXR5IChubyByZWZsZWN0aW9uKSBhbmQgY29ubmVjdFxuICAgICAgICB0aGlzLmdhaW5zID0gbmV3IEFycmF5KHRoaXMubkNoKTtcbiAgICAgICAgZm9yICh2YXIgcSA9IDA7IHEgPCB0aGlzLm5DaDsgcSsrKSB7XG4gICAgICAgICAgICB0aGlzLmdhaW5zW3FdID0gdGhpcy5jdHguY3JlYXRlR2FpbigpO1xuICAgICAgICAgICAgdGhpcy5nYWluc1txXS5nYWluLnZhbHVlID0gMTtcbiAgICAgICAgICAgIC8vIENyZWF0ZSBjb25uZWN0aW9uc1xuICAgICAgICAgICAgdGhpcy5pbi5jb25uZWN0KHRoaXMuZ2FpbnNbcV0sIHEsIDApO1xuICAgICAgICAgICAgdGhpcy5nYWluc1txXS5jb25uZWN0KHRoaXMub3V0LCAwLCBxKTtcbiAgICAgICAgfVxuXG4gICAgfVxuICAgIFxuICAgIHJlc2V0KCkge1xuICAgICAgICBcbiAgICAgICAgZm9yICh2YXIgcSA9IDA7IHEgPCB0aGlzLm5DaDsgcSsrKSB7XG4gICAgICAgICAgICB0aGlzLmdhaW5zW3FdLmdhaW4udmFsdWUgPSAxO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgbWlycm9yKHBsYW5lTm8pIHtcbiAgICAgICAgXG4gICAgICAgIHN3aXRjaChwbGFuZU5vKSB7XG4gICAgICAgICAgICBjYXNlIDA6XG4gICAgICAgICAgICAgICAgdGhpcy5taXJyb3JQbGFuZSA9IDA7XG4gICAgICAgICAgICAgICAgdGhpcy5yZXNldCgpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAxOlxuICAgICAgICAgICAgICAgIC8vIG1pcnJvcmluZyBvbiB5ei1wbGFuZSAoZnJvbnQtYmFjaylcbiAgICAgICAgICAgICAgICB0aGlzLnJlc2V0KCk7XG4gICAgICAgICAgICAgICAgdGhpcy5taXJyb3JQbGFuZSA9IDE7XG4gICAgICAgICAgICAgICAgdmFyIHE7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgbiA9IDA7IG4gPD0gdGhpcy5vcmRlcjsgbisrKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIG0gPSAtbjsgbSA8PSBuOyBtKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHEgPSBuKm4rbittO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKChtPDAgJiYgbSUyPT0wKXx8KG0+MCAmJiBtJTI9PTEpKSB0aGlzLmdhaW5zW3FdLmdhaW4udmFsdWUgPSAtMTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgMjpcbiAgICAgICAgICAgICAgICAvLyBtaXJyb3Jpbmcgb24geHotcGxhbmUgKGxlZnQtcmlnaHQpXG4gICAgICAgICAgICAgICAgdGhpcy5yZXNldCgpO1xuICAgICAgICAgICAgICAgIHRoaXMubWlycm9yUGxhbmUgPSAyO1xuICAgICAgICAgICAgICAgIHZhciBxO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIG4gPSAwOyBuIDw9IHRoaXMub3JkZXI7IG4rKykge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBtID0gLW47IG0gPD0gbjsgbSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBxID0gbipuK24rbTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtPDApIHRoaXMuZ2FpbnNbcV0uZ2Fpbi52YWx1ZSA9IC0xO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAzOlxuICAgICAgICAgICAgICAgIC8vIG1pcnJvcmluZyBvbiB4eS1wbGFuZSAodXAtZG93bilcbiAgICAgICAgICAgICAgICB0aGlzLnJlc2V0KCk7XG4gICAgICAgICAgICAgICAgdGhpcy5taXJyb3JQbGFuZSA9IDM7XG4gICAgICAgICAgICAgICAgdmFyIHE7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgbiA9IDA7IG4gPD0gdGhpcy5vcmRlcjsgbisrKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIG0gPSAtbjsgbSA8PSBuOyBtKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHEgPSBuKm4rbittO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKChtK24pJTI9PTEpIHRoaXMuZ2FpbnNbcV0uZ2Fpbi52YWx1ZSA9IC0xO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlRoZSBtaXJyb3JpbmcgcGxhbmVzIGNhbiBiZSBlaXRoZXIgMSAoeXopLCAyICh4eiksIDMgKHh5KSwgb3IgMCAobm8gbWlycm9yaW5nKS4gVmFsdWUgc2V0IHRvIDAuXCIpXG4gICAgICAgICAgICAgICAgdGhpcy5taXJyb3JQbGFuZSA9IDA7XG4gICAgICAgICAgICAgICAgdGhpcy5yZXNldCgpO1xuICAgICAgICB9XG4gICAgICAgIFxuXG4gICAgfVxuXG59XG4iXX0=