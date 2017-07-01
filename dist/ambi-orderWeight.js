'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _sphericalHarmonicTransform = require('spherical-harmonic-transform');

var jshlib = _interopRequireWildcard(_sphericalHarmonicTransform);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var orderWeight = function () {
    function orderWeight(audioCtx, order) {
        (0, _classCallCheck3.default)(this, orderWeight);


        this.ctx = audioCtx;
        this.order = order;

        this.nCh = (this.order + 1) * (this.order + 1);
        this.in = this.ctx.createChannelSplitter(this.nCh);
        this.out = this.ctx.createChannelMerger(this.nCh);

        this.gains = new Array(this.nCh);
        this.orderGains = new Array(this.order + 1);
        this.orderGains.fill(1);

        // initialize gains and connections
        for (var i = 0; i < this.nCh; i++) {
            this.gains[i] = this.ctx.createGain();

            this.in.connect(this.gains[i], i, 0);
            this.gains[i].connect(this.out, 0, i);
        }
    }

    (0, _createClass3.default)(orderWeight, [{
        key: 'updateOrderGains',
        value: function updateOrderGains() {

            var n;
            for (var i = 0; i < this.nCh; i++) {

                n = Math.floor(Math.sqrt(i));
                this.gains[i].gain.value = this.orderGains[n];
            }
        }
    }, {
        key: 'computeMaxRECoeffs',
        value: function computeMaxRECoeffs() {

            var N = this.order;
            this.orderGains[0] = 1;
            var leg_n_minus1 = 0;
            var leg_n_minus2 = 0;
            var leg_n = 0;
            for (var n = 1; n <= N; n++) {
                leg_n = jshlib.recurseLegendrePoly(n, [Math.cos(2.406809 / (N + 1.51))], leg_n_minus1, leg_n_minus2);
                this.orderGains[n] = leg_n[0][0];

                leg_n_minus2 = leg_n_minus1;
                leg_n_minus1 = leg_n;
            }
        }
    }]);
    return orderWeight;
}(); ////////////////////////////////////////////////////////////////////
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

/////////////////////////
/* HOA ORDER WEIGHTING */
/////////////////////////

exports.default = orderWeight;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFtYmktb3JkZXJXZWlnaHQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7QUFpQkE7O0lBQVksTTs7Ozs7O0lBRVMsVztBQUVqQix5QkFBWSxRQUFaLEVBQXNCLEtBQXRCLEVBQTZCO0FBQUE7OztBQUV6QixhQUFLLEdBQUwsR0FBVyxRQUFYO0FBQ0EsYUFBSyxLQUFMLEdBQWEsS0FBYjs7QUFFQSxhQUFLLEdBQUwsR0FBVyxDQUFDLEtBQUssS0FBTCxHQUFhLENBQWQsS0FBb0IsS0FBSyxLQUFMLEdBQWEsQ0FBakMsQ0FBWDtBQUNBLGFBQUssRUFBTCxHQUFVLEtBQUssR0FBTCxDQUFTLHFCQUFULENBQStCLEtBQUssR0FBcEMsQ0FBVjtBQUNBLGFBQUssR0FBTCxHQUFXLEtBQUssR0FBTCxDQUFTLG1CQUFULENBQTZCLEtBQUssR0FBbEMsQ0FBWDs7QUFFQSxhQUFLLEtBQUwsR0FBYSxJQUFJLEtBQUosQ0FBVSxLQUFLLEdBQWYsQ0FBYjtBQUNBLGFBQUssVUFBTCxHQUFrQixJQUFJLEtBQUosQ0FBVSxLQUFLLEtBQUwsR0FBVyxDQUFyQixDQUFsQjtBQUNBLGFBQUssVUFBTCxDQUFnQixJQUFoQixDQUFxQixDQUFyQjs7O0FBR0EsYUFBSyxJQUFJLElBQUksQ0FBYixFQUFnQixJQUFJLEtBQUssR0FBekIsRUFBOEIsR0FBOUIsRUFBbUM7QUFDL0IsaUJBQUssS0FBTCxDQUFXLENBQVgsSUFBZ0IsS0FBSyxHQUFMLENBQVMsVUFBVCxFQUFoQjs7QUFFQSxpQkFBSyxFQUFMLENBQVEsT0FBUixDQUFnQixLQUFLLEtBQUwsQ0FBVyxDQUFYLENBQWhCLEVBQStCLENBQS9CLEVBQWtDLENBQWxDO0FBQ0EsaUJBQUssS0FBTCxDQUFXLENBQVgsRUFBYyxPQUFkLENBQXNCLEtBQUssR0FBM0IsRUFBK0IsQ0FBL0IsRUFBaUMsQ0FBakM7QUFDSDtBQUNKOzs7OzJDQUVrQjs7QUFFZixnQkFBSSxDQUFKO0FBQ0EsaUJBQUssSUFBSSxJQUFJLENBQWIsRUFBZ0IsSUFBSSxLQUFLLEdBQXpCLEVBQThCLEdBQTlCLEVBQW1DOztBQUUvQixvQkFBSSxLQUFLLEtBQUwsQ0FBVyxLQUFLLElBQUwsQ0FBVSxDQUFWLENBQVgsQ0FBSjtBQUNBLHFCQUFLLEtBQUwsQ0FBVyxDQUFYLEVBQWMsSUFBZCxDQUFtQixLQUFuQixHQUEyQixLQUFLLFVBQUwsQ0FBZ0IsQ0FBaEIsQ0FBM0I7QUFDSDtBQUNKOzs7NkNBRW9COztBQUVqQixnQkFBSSxJQUFJLEtBQUssS0FBYjtBQUNBLGlCQUFLLFVBQUwsQ0FBZ0IsQ0FBaEIsSUFBcUIsQ0FBckI7QUFDQSxnQkFBSSxlQUFlLENBQW5CO0FBQ0EsZ0JBQUksZUFBZSxDQUFuQjtBQUNBLGdCQUFJLFFBQVEsQ0FBWjtBQUNBLGlCQUFLLElBQUksSUFBSSxDQUFiLEVBQWdCLEtBQUssQ0FBckIsRUFBd0IsR0FBeEIsRUFBNkI7QUFDekIsd0JBQVEsT0FBTyxtQkFBUCxDQUEyQixDQUEzQixFQUE4QixDQUFDLEtBQUssR0FBTCxDQUFTLFlBQVksSUFBSSxJQUFoQixDQUFULENBQUQsQ0FBOUIsRUFBaUUsWUFBakUsRUFBK0UsWUFBL0UsQ0FBUjtBQUNBLHFCQUFLLFVBQUwsQ0FBZ0IsQ0FBaEIsSUFBcUIsTUFBTSxDQUFOLEVBQVMsQ0FBVCxDQUFyQjs7QUFFQSwrQkFBZSxZQUFmO0FBQ0EsK0JBQWUsS0FBZjtBQUNIO0FBQ0o7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O2tCQWhEZ0IsVyIsImZpbGUiOiJhbWJpLW9yZGVyV2VpZ2h0LmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vICBBcmNob250aXMgUG9saXRpc1xuLy8gIGFyY2hvbnRpcy5wb2xpdGlzQGFhbHRvLmZpXG4vLyAgRGF2aWQgUG9pcmllci1RdWlub3Rcbi8vICBkYXZpcG9pckBpcmNhbS5mclxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vXG4vLyAgSlNBbWJpc29uaWNzIGEgSmF2YVNjcmlwdCBsaWJyYXJ5IGZvciBoaWdoZXItb3JkZXIgQW1iaXNvbmljc1xuLy8gIFRoZSBsaWJyYXJ5IGltcGxlbWVudHMgV2ViIEF1ZGlvIGJsb2NrcyB0aGF0IHBlcmZvcm1cbi8vICB0eXBpY2FsIGFtYmlzb25pYyBwcm9jZXNzaW5nIG9wZXJhdGlvbnMgb24gYXVkaW8gc2lnbmFscy5cbi8vXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vKiBIT0EgT1JERVIgV0VJR0hUSU5HICovXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbmltcG9ydCAqIGFzIGpzaGxpYiBmcm9tICdzcGhlcmljYWwtaGFybW9uaWMtdHJhbnNmb3JtJztcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3Mgb3JkZXJXZWlnaHQge1xuXG4gICAgY29uc3RydWN0b3IoYXVkaW9DdHgsIG9yZGVyKSB7XG5cbiAgICAgICAgdGhpcy5jdHggPSBhdWRpb0N0eDtcbiAgICAgICAgdGhpcy5vcmRlciA9IG9yZGVyO1xuICAgICAgICBcbiAgICAgICAgdGhpcy5uQ2ggPSAodGhpcy5vcmRlciArIDEpICogKHRoaXMub3JkZXIgKyAxKTtcbiAgICAgICAgdGhpcy5pbiA9IHRoaXMuY3R4LmNyZWF0ZUNoYW5uZWxTcGxpdHRlcih0aGlzLm5DaCk7XG4gICAgICAgIHRoaXMub3V0ID0gdGhpcy5jdHguY3JlYXRlQ2hhbm5lbE1lcmdlcih0aGlzLm5DaCk7XG4gICAgICAgIFxuICAgICAgICB0aGlzLmdhaW5zID0gbmV3IEFycmF5KHRoaXMubkNoKTtcbiAgICAgICAgdGhpcy5vcmRlckdhaW5zID0gbmV3IEFycmF5KHRoaXMub3JkZXIrMSlcbiAgICAgICAgdGhpcy5vcmRlckdhaW5zLmZpbGwoMSk7XG5cbiAgICAgICAgLy8gaW5pdGlhbGl6ZSBnYWlucyBhbmQgY29ubmVjdGlvbnNcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLm5DaDsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLmdhaW5zW2ldID0gdGhpcy5jdHguY3JlYXRlR2FpbigpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICB0aGlzLmluLmNvbm5lY3QodGhpcy5nYWluc1tpXSwgaSwgMCk7XG4gICAgICAgICAgICB0aGlzLmdhaW5zW2ldLmNvbm5lY3QodGhpcy5vdXQsMCxpKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHVwZGF0ZU9yZGVyR2FpbnMoKSB7XG5cbiAgICAgICAgdmFyIG47XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5uQ2g7IGkrKykge1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBuID0gTWF0aC5mbG9vcihNYXRoLnNxcnQoaSkpO1xuICAgICAgICAgICAgdGhpcy5nYWluc1tpXS5nYWluLnZhbHVlID0gdGhpcy5vcmRlckdhaW5zW25dO1xuICAgICAgICB9XG4gICAgfVxuICAgIFxuICAgIGNvbXB1dGVNYXhSRUNvZWZmcygpIHtcbiAgICAgICAgXG4gICAgICAgIHZhciBOID0gdGhpcy5vcmRlcjtcbiAgICAgICAgdGhpcy5vcmRlckdhaW5zWzBdID0gMTtcbiAgICAgICAgdmFyIGxlZ19uX21pbnVzMSA9IDA7XG4gICAgICAgIHZhciBsZWdfbl9taW51czIgPSAwO1xuICAgICAgICB2YXIgbGVnX24gPSAwO1xuICAgICAgICBmb3IgKHZhciBuID0gMTsgbiA8PSBOOyBuKyspIHtcbiAgICAgICAgICAgIGxlZ19uID0ganNobGliLnJlY3Vyc2VMZWdlbmRyZVBvbHkobiwgW01hdGguY29zKDIuNDA2ODA5IC8gKE4gKyAxLjUxKSldLCBsZWdfbl9taW51czEsIGxlZ19uX21pbnVzMik7XG4gICAgICAgICAgICB0aGlzLm9yZGVyR2FpbnNbbl0gPSBsZWdfblswXVswXTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgbGVnX25fbWludXMyID0gbGVnX25fbWludXMxO1xuICAgICAgICAgICAgbGVnX25fbWludXMxID0gbGVnX247XG4gICAgICAgIH1cbiAgICB9XG59XG4iXX0=