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
//# sourceMappingURL=data:application/json;base64,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RUFBaEIsR0FBcUIsR0FBL0I7QUFDQSxnQkFBSSxRQUFRLEtBQUssS0FBTCxHQUFhLEtBQUssRUFBbEIsR0FBdUIsR0FBbkM7QUFDQSxnQkFBSSxPQUFPLEtBQUssSUFBTCxHQUFZLEtBQUssRUFBakIsR0FBc0IsR0FBakM7O0FBRUEsaUJBQUssTUFBTCxHQUFjLE9BQU8sV0FBUCxDQUFtQixPQUFPLGlCQUFQLENBQXlCLEdBQXpCLEVBQThCLEtBQTlCLEVBQXFDLElBQXJDLENBQW5CLEVBQStELEtBQUssS0FBcEUsQ0FBZDs7QUFFQSxnQkFBSSxXQUFXLENBQWY7QUFDQSxpQkFBSyxJQUFJLElBQUksQ0FBYixFQUFnQixJQUFJLEtBQUssS0FBTCxHQUFhLENBQWpDLEVBQW9DLEdBQXBDLEVBQXlDOztBQUVyQyxxQkFBSyxJQUFJLElBQUksQ0FBYixFQUFnQixJQUFJLElBQUksQ0FBSixHQUFRLENBQTVCLEVBQStCLEdBQS9CLEVBQW9DO0FBQ2hDLHlCQUFLLElBQUksSUFBSSxDQUFiLEVBQWdCLElBQUksSUFBSSxDQUFKLEdBQVEsQ0FBNUIsRUFBK0IsR0FBL0IsRUFBb0M7QUFDaEMsNkJBQUssV0FBTCxDQUFpQixJQUFJLENBQXJCLEVBQXdCLENBQXhCLEVBQTJCLENBQTNCLEVBQThCLElBQTlCLENBQW1DLEtBQW5DLEdBQTJDLEtBQUssTUFBTCxDQUFZLFdBQVcsQ0FBdkIsRUFBMEIsV0FBVyxDQUFyQyxDQUEzQztBQUNIO0FBQ0o7QUFDRCwyQkFBVyxXQUFXLElBQUksQ0FBZixHQUFtQixDQUE5QjtBQUNIO0FBQ0o7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O2tCQWhFZ0IsWSIsImZpbGUiOiJhbWJpLXNjZW5lUm90YXRvci5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyAgQXJjaG9udGlzIFBvbGl0aXNcbi8vICBhcmNob250aXMucG9saXRpc0BhYWx0by5maVxuLy8gIERhdmlkIFBvaXJpZXItUXVpbm90XG4vLyAgZGF2aXBvaXJAaXJjYW0uZnJcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vL1xuLy8gIEpTQW1iaXNvbmljcyBhIEphdmFTY3JpcHQgbGlicmFyeSBmb3IgaGlnaGVyLW9yZGVyIEFtYmlzb25pY3Ncbi8vICBUaGUgbGlicmFyeSBpbXBsZW1lbnRzIFdlYiBBdWRpbyBibG9ja3MgdGhhdCBwZXJmb3JtXG4vLyAgdHlwaWNhbCBhbWJpc29uaWMgcHJvY2Vzc2luZyBvcGVyYXRpb25zIG9uIGF1ZGlvIHNpZ25hbHMuXG4vL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLy8vLy8vLy8vLy8vLy8vLy9cbi8qIEhPQSBST1RBVE9SICovXG4vLy8vLy8vLy8vLy8vLy8vL1xuXG5pbXBvcnQgKiBhcyBqc2hsaWIgZnJvbSAnc3BoZXJpY2FsLWhhcm1vbmljLXRyYW5zZm9ybSc7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIHNjZW5lUm90YXRvciB7XG5cbiAgICBjb25zdHJ1Y3RvcihhdWRpb0N0eCwgb3JkZXIpIHtcblxuICAgICAgICB0aGlzLmN0eCA9IGF1ZGlvQ3R4O1xuICAgICAgICB0aGlzLm9yZGVyID0gb3JkZXI7XG4gICAgICAgIHRoaXMubkNoID0gKG9yZGVyICsgMSkgKiAob3JkZXIgKyAxKTtcbiAgICAgICAgdGhpcy55YXcgPSAwO1xuICAgICAgICB0aGlzLnBpdGNoID0gMDtcbiAgICAgICAgdGhpcy5yb2xsID0gMDtcbiAgICAgICAgdGhpcy5yb3RNdHggPSBudW1lcmljLmlkZW50aXR5KHRoaXMubkNoKTtcbiAgICAgICAgdGhpcy5yb3RNdHhOb2RlcyA9IG5ldyBBcnJheSh0aGlzLm9yZGVyKTtcbiAgICAgICAgLy8gSW5wdXQgYW5kIG91dHB1dCBub2Rlc1xuICAgICAgICB0aGlzLmluID0gdGhpcy5jdHguY3JlYXRlQ2hhbm5lbFNwbGl0dGVyKHRoaXMubkNoKTtcbiAgICAgICAgdGhpcy5vdXQgPSB0aGlzLmN0eC5jcmVhdGVDaGFubmVsTWVyZ2VyKHRoaXMubkNoKTtcbiAgICAgICAgXG4gICAgICAgIC8vIEluaXRpYWxpemUgcm90YXRpb24gZ2FpbnMgdG8gaWRlbnRpdHkgbWF0cml4XG4gICAgICAgIGZvciAodmFyIG4gPSAxOyBuIDw9IHRoaXMub3JkZXI7IG4rKykge1xuICAgICAgICAgICAgXG4gICAgICAgICAgICB2YXIgZ2FpbnNfbiA9IG5ldyBBcnJheSgyICogbiArIDEpO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCAyICogbiArIDE7IGkrKykge1xuICAgICAgICAgICAgICAgIGdhaW5zX25baV0gPSBuZXcgQXJyYXkoMiAqIG4gKyAxKTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IDIgKiBuICsgMTsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgIGdhaW5zX25baV1bal0gPSB0aGlzLmN0eC5jcmVhdGVHYWluKCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpID09IGopIGdhaW5zX25baV1bal0uZ2Fpbi52YWx1ZSA9IDE7XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgZ2FpbnNfbltpXVtqXS5nYWluLnZhbHVlID0gMDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLnJvdE10eE5vZGVzW24gLSAxXSA9IGdhaW5zX247XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIENyZWF0ZSBjb25uZWN0aW9uc1xuICAgICAgICB0aGlzLmluLmNvbm5lY3QodGhpcy5vdXQsIDAsIDApOyAvLyB6ZXJvdGggb3JkZXIgY2guIGRvZXMgbm90IHJvdGF0ZVxuICAgICAgICBcbiAgICAgICAgdmFyIGJhbmRfaWR4ID0gMTtcbiAgICAgICAgZm9yIChuID0gMTsgbiA8PSB0aGlzLm9yZGVyOyBuKyspIHtcbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCAyICogbiArIDE7IGkrKykge1xuICAgICAgICAgICAgICAgIGZvciAoaiA9IDA7IGogPCAyICogbiArIDE7IGorKykge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmluLmNvbm5lY3QodGhpcy5yb3RNdHhOb2Rlc1tuIC0gMV1baV1bal0sIGJhbmRfaWR4ICsgaiwgMCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucm90TXR4Tm9kZXNbbiAtIDFdW2ldW2pdLmNvbm5lY3QodGhpcy5vdXQsIDAsIGJhbmRfaWR4ICsgaSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYmFuZF9pZHggPSBiYW5kX2lkeCArIDIgKiBuICsgMTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHVwZGF0ZVJvdE10eCgpIHtcblxuICAgICAgICB2YXIgeWF3ID0gdGhpcy55YXcgKiBNYXRoLlBJIC8gMTgwO1xuICAgICAgICB2YXIgcGl0Y2ggPSB0aGlzLnBpdGNoICogTWF0aC5QSSAvIDE4MDtcbiAgICAgICAgdmFyIHJvbGwgPSB0aGlzLnJvbGwgKiBNYXRoLlBJIC8gMTgwO1xuXG4gICAgICAgIHRoaXMucm90TXR4ID0ganNobGliLmdldFNIcm90TXR4KGpzaGxpYi55YXdQaXRjaFJvbGwyUnp5eCh5YXcsIHBpdGNoLCByb2xsKSwgdGhpcy5vcmRlcik7XG5cbiAgICAgICAgdmFyIGJhbmRfaWR4ID0gMTtcbiAgICAgICAgZm9yIChsZXQgbiA9IDE7IG4gPCB0aGlzLm9yZGVyICsgMTsgbisrKSB7XG5cbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgMiAqIG4gKyAxOyBpKyspIHtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IDIgKiBuICsgMTsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucm90TXR4Tm9kZXNbbiAtIDFdW2ldW2pdLmdhaW4udmFsdWUgPSB0aGlzLnJvdE10eFtiYW5kX2lkeCArIGldW2JhbmRfaWR4ICsgal07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYmFuZF9pZHggPSBiYW5kX2lkeCArIDIgKiBuICsgMTtcbiAgICAgICAgfVxuICAgIH1cbn1cbiJdfQ==