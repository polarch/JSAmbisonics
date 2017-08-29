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

var sceneRotator = function () {
    function sceneRotator(audioCtx, order) {
        (0, _classCallCheck3.default)(this, sceneRotator);


        this.ctx = audioCtx;
        this.order = order;
        this.nCh = (order + 1) * (order + 1);
        this.yaw = 0;
        this.pitch = 0;
        this.roll = 0;
        this.rotMtx = numeric.identity(this.nCh);
        this.rotMtxNodes = new Array(this.order);
        // Input and output nodes
        this.in = this.ctx.createChannelSplitter(this.nCh);
        this.out = this.ctx.createChannelMerger(this.nCh);

        // Initialize rotation gains to identity matrix
        for (var n = 1; n <= this.order; n++) {

            var gains_n = new Array(2 * n + 1);
            for (var i = 0; i < 2 * n + 1; i++) {
                gains_n[i] = new Array(2 * n + 1);
                for (var j = 0; j < 2 * n + 1; j++) {
                    gains_n[i][j] = this.ctx.createGain();
                    if (i == j) gains_n[i][j].gain.value = 1;else gains_n[i][j].gain.value = 0;
                }
            }
            this.rotMtxNodes[n - 1] = gains_n;
        }

        // Create connections
        this.in.connect(this.out, 0, 0); // zeroth order ch. does not rotate

        var band_idx = 1;
        for (n = 1; n <= this.order; n++) {
            for (i = 0; i < 2 * n + 1; i++) {
                for (j = 0; j < 2 * n + 1; j++) {
                    this.in.connect(this.rotMtxNodes[n - 1][i][j], band_idx + j, 0);
                    this.rotMtxNodes[n - 1][i][j].connect(this.out, 0, band_idx + i);
                }
            }
            band_idx = band_idx + 2 * n + 1;
        }
    }

    (0, _createClass3.default)(sceneRotator, [{
        key: 'updateRotMtx',
        value: function updateRotMtx() {

            var yaw = this.yaw * Math.PI / 180;
            var pitch = this.pitch * Math.PI / 180;
            var roll = this.roll * Math.PI / 180;

            this.rotMtx = jshlib.getSHrotMtx(jshlib.yawPitchRoll2Rzyx(yaw, pitch, roll), this.order);

            var band_idx = 1;
            for (var n = 1; n < this.order + 1; n++) {

                for (var i = 0; i < 2 * n + 1; i++) {
                    for (var j = 0; j < 2 * n + 1; j++) {
                        this.rotMtxNodes[n - 1][i][j].gain.value = this.rotMtx[band_idx + i][band_idx + j];
                    }
                }
                band_idx = band_idx + 2 * n + 1;
            }
        }
    }]);
    return sceneRotator;
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

/////////////////
/* HOA ROTATOR */
/////////////////

exports.default = sceneRotator;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFtYmktc2NlbmVSb3RhdG9yLmpzIl0sIm5hbWVzIjpbImpzaGxpYiIsInNjZW5lUm90YXRvciIsImF1ZGlvQ3R4Iiwib3JkZXIiLCJjdHgiLCJuQ2giLCJ5YXciLCJwaXRjaCIsInJvbGwiLCJyb3RNdHgiLCJudW1lcmljIiwiaWRlbnRpdHkiLCJyb3RNdHhOb2RlcyIsIkFycmF5IiwiaW4iLCJjcmVhdGVDaGFubmVsU3BsaXR0ZXIiLCJvdXQiLCJjcmVhdGVDaGFubmVsTWVyZ2VyIiwibiIsImdhaW5zX24iLCJpIiwiaiIsImNyZWF0ZUdhaW4iLCJnYWluIiwidmFsdWUiLCJjb25uZWN0IiwiYmFuZF9pZHgiLCJNYXRoIiwiUEkiLCJnZXRTSHJvdE10eCIsInlhd1BpdGNoUm9sbDJSenl4Il0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7OztBQWlCQTs7SUFBWUEsTTs7Ozs7O0lBRVNDLFk7QUFFakIsMEJBQVlDLFFBQVosRUFBc0JDLEtBQXRCLEVBQTZCO0FBQUE7OztBQUV6QixhQUFLQyxHQUFMLEdBQVdGLFFBQVg7QUFDQSxhQUFLQyxLQUFMLEdBQWFBLEtBQWI7QUFDQSxhQUFLRSxHQUFMLEdBQVcsQ0FBQ0YsUUFBUSxDQUFULEtBQWVBLFFBQVEsQ0FBdkIsQ0FBWDtBQUNBLGFBQUtHLEdBQUwsR0FBVyxDQUFYO0FBQ0EsYUFBS0MsS0FBTCxHQUFhLENBQWI7QUFDQSxhQUFLQyxJQUFMLEdBQVksQ0FBWjtBQUNBLGFBQUtDLE1BQUwsR0FBY0MsUUFBUUMsUUFBUixDQUFpQixLQUFLTixHQUF0QixDQUFkO0FBQ0EsYUFBS08sV0FBTCxHQUFtQixJQUFJQyxLQUFKLENBQVUsS0FBS1YsS0FBZixDQUFuQjtBQUNBO0FBQ0EsYUFBS1csRUFBTCxHQUFVLEtBQUtWLEdBQUwsQ0FBU1cscUJBQVQsQ0FBK0IsS0FBS1YsR0FBcEMsQ0FBVjtBQUNBLGFBQUtXLEdBQUwsR0FBVyxLQUFLWixHQUFMLENBQVNhLG1CQUFULENBQTZCLEtBQUtaLEdBQWxDLENBQVg7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QUlDLElBQUksQ0FBYixFQUFnQkEsSUFBSSxJQUFJSCxDQUFKLEdBQVEsQ0FBNUIsRUFBK0JHLEdBQS9CLEVBQW9DO0FBQ2hDLDZCQUFLVCxXQUFMLENBQWlCTSxJQUFJLENBQXJCLEVBQXdCRSxDQUF4QixFQUEyQkMsQ0FBM0IsRUFBOEJFLElBQTlCLENBQW1DQyxLQUFuQyxHQUEyQyxLQUFLZixNQUFMLENBQVlpQixXQUFXTixDQUF2QixFQUEwQk0sV0FBV0wsQ0FBckMsQ0FBM0M7QUFDSDtBQUNKO0FBQ0RLLDJCQUFXQSxXQUFXLElBQUlSLENBQWYsR0FBbUIsQ0FBOUI7QUFDSDtBQUNKOzs7S0FuRkw7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7a0JBSXFCakIsWSIsImZpbGUiOiJhbWJpLXNjZW5lUm90YXRvci5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyAgQXJjaG9udGlzIFBvbGl0aXNcbi8vICBhcmNob250aXMucG9saXRpc0BhYWx0by5maVxuLy8gIERhdmlkIFBvaXJpZXItUXVpbm90XG4vLyAgZGF2aXBvaXJAaXJjYW0uZnJcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vL1xuLy8gIEpTQW1iaXNvbmljcyBhIEphdmFTY3JpcHQgbGlicmFyeSBmb3IgaGlnaGVyLW9yZGVyIEFtYmlzb25pY3Ncbi8vICBUaGUgbGlicmFyeSBpbXBsZW1lbnRzIFdlYiBBdWRpbyBibG9ja3MgdGhhdCBwZXJmb3JtXG4vLyAgdHlwaWNhbCBhbWJpc29uaWMgcHJvY2Vzc2luZyBvcGVyYXRpb25zIG9uIGF1ZGlvIHNpZ25hbHMuXG4vL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLy8vLy8vLy8vLy8vLy8vLy9cbi8qIEhPQSBST1RBVE9SICovXG4vLy8vLy8vLy8vLy8vLy8vL1xuXG5pbXBvcnQgKiBhcyBqc2hsaWIgZnJvbSAnc3BoZXJpY2FsLWhhcm1vbmljLXRyYW5zZm9ybSc7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIHNjZW5lUm90YXRvciB7XG5cbiAgICBjb25zdHJ1Y3RvcihhdWRpb0N0eCwgb3JkZXIpIHtcblxuICAgICAgICB0aGlzLmN0eCA9IGF1ZGlvQ3R4O1xuICAgICAgICB0aGlzLm9yZGVyID0gb3JkZXI7XG4gICAgICAgIHRoaXMubkNoID0gKG9yZGVyICsgMSkgKiAob3JkZXIgKyAxKTtcbiAgICAgICAgdGhpcy55YXcgPSAwO1xuICAgICAgICB0aGlzLnBpdGNoID0gMDtcbiAgICAgICAgdGhpcy5yb2xsID0gMDtcbiAgICAgICAgdGhpcy5yb3RNdHggPSBudW1lcmljLmlkZW50aXR5KHRoaXMubkNoKTtcbiAgICAgICAgdGhpcy5yb3RNdHhOb2RlcyA9IG5ldyBBcnJheSh0aGlzLm9yZGVyKTtcbiAgICAgICAgLy8gSW5wdXQgYW5kIG91dHB1dCBub2Rlc1xuICAgICAgICB0aGlzLmluID0gdGhpcy5jdHguY3JlYXRlQ2hhbm5lbFNwbGl0dGVyKHRoaXMubkNoKTtcbiAgICAgICAgdGhpcy5vdXQgPSB0aGlzLmN0eC5jcmVhdGVDaGFubmVsTWVyZ2VyKHRoaXMubkNoKTtcbiAgICAgICAgXG4gICAgICAgIC8vIEluaXRpYWxpemUgcm90YXRpb24gZ2FpbnMgdG8gaWRlbnRpdHkgbWF0cml4XG4gICAgICAgIGZvciAodmFyIG4gPSAxOyBuIDw9IHRoaXMub3JkZXI7IG4rKykge1xuICAgICAgICAgICAgXG4gICAgICAgICAgICB2YXIgZ2FpbnNfbiA9IG5ldyBBcnJheSgyICogbiArIDEpO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCAyICogbiArIDE7IGkrKykge1xuICAgICAgICAgICAgICAgIGdhaW5zX25baV0gPSBuZXcgQXJyYXkoMiAqIG4gKyAxKTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IDIgKiBuICsgMTsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgIGdhaW5zX25baV1bal0gPSB0aGlzLmN0eC5jcmVhdGVHYWluKCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpID09IGopIGdhaW5zX25baV1bal0uZ2Fpbi52YWx1ZSA9IDE7XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgZ2FpbnNfbltpXVtqXS5nYWluLnZhbHVlID0gMDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLnJvdE10eE5vZGVzW24gLSAxXSA9IGdhaW5zX247XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIENyZWF0ZSBjb25uZWN0aW9uc1xuICAgICAgICB0aGlzLmluLmNvbm5lY3QodGhpcy5vdXQsIDAsIDApOyAvLyB6ZXJvdGggb3JkZXIgY2guIGRvZXMgbm90IHJvdGF0ZVxuICAgICAgICBcbiAgICAgICAgdmFyIGJhbmRfaWR4ID0gMTtcbiAgICAgICAgZm9yIChuID0gMTsgbiA8PSB0aGlzLm9yZGVyOyBuKyspIHtcbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCAyICogbiArIDE7IGkrKykge1xuICAgICAgICAgICAgICAgIGZvciAoaiA9IDA7IGogPCAyICogbiArIDE7IGorKykge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmluLmNvbm5lY3QodGhpcy5yb3RNdHhOb2Rlc1tuIC0gMV1baV1bal0sIGJhbmRfaWR4ICsgaiwgMCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucm90TXR4Tm9kZXNbbiAtIDFdW2ldW2pdLmNvbm5lY3QodGhpcy5vdXQsIDAsIGJhbmRfaWR4ICsgaSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYmFuZF9pZHggPSBiYW5kX2lkeCArIDIgKiBuICsgMTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHVwZGF0ZVJvdE10eCgpIHtcblxuICAgICAgICB2YXIgeWF3ID0gdGhpcy55YXcgKiBNYXRoLlBJIC8gMTgwO1xuICAgICAgICB2YXIgcGl0Y2ggPSB0aGlzLnBpdGNoICogTWF0aC5QSSAvIDE4MDtcbiAgICAgICAgdmFyIHJvbGwgPSB0aGlzLnJvbGwgKiBNYXRoLlBJIC8gMTgwO1xuXG4gICAgICAgIHRoaXMucm90TXR4ID0ganNobGliLmdldFNIcm90TXR4KGpzaGxpYi55YXdQaXRjaFJvbGwyUnp5eCh5YXcsIHBpdGNoLCByb2xsKSwgdGhpcy5vcmRlcik7XG5cbiAgICAgICAgdmFyIGJhbmRfaWR4ID0gMTtcbiAgICAgICAgZm9yIChsZXQgbiA9IDE7IG4gPCB0aGlzLm9yZGVyICsgMTsgbisrKSB7XG5cbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgMiAqIG4gKyAxOyBpKyspIHtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IDIgKiBuICsgMTsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucm90TXR4Tm9kZXNbbiAtIDFdW2ldW2pdLmdhaW4udmFsdWUgPSB0aGlzLnJvdE10eFtiYW5kX2lkeCArIGldW2JhbmRfaWR4ICsgal07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYmFuZF9pZHggPSBiYW5kX2lkeCArIDIgKiBuICsgMTtcbiAgICAgICAgfVxuICAgIH1cbn1cbiJdfQ==