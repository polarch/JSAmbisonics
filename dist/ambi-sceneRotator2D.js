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
//  sceneRotator for 2D use
//  adapted by Thomas Deppisch
//  thomas.deppisch93@gmail.com
//
////////////////////////////////////////////////////////////////////
////////////////////
/* HOA ROTATOR 2D */
///////////////////

var sceneRotator = function () {
    function sceneRotator(audioCtx, order) {
        (0, _classCallCheck3.default)(this, sceneRotator);


        this.ctx = audioCtx;
        this.order = order;
        this.nCh = 2 * order + 1;
        this.yaw = 0;

        // Input and output nodes
        this.in = this.ctx.createChannelSplitter(this.nCh);
        this.out = this.ctx.createChannelMerger(this.nCh);

        this.rotMtxNodes = new Array(2 * this.order);
        this.in.connect(this.out, 0, 0); // W channel does not rotate

        //initialize gain nodes
        for (var i = 0; i < 2 * this.order; i = i + 2) {
            // every output needs two gain nodes
            var tempGainArr = new Array(2);
            tempGainArr[0] = this.ctx.createGain();
            tempGainArr[1] = this.ctx.createGain();
            var tempGainArr2 = new Array(2);
            tempGainArr2[0] = this.ctx.createGain();
            tempGainArr2[1] = this.ctx.createGain();

            this.rotMtxNodes[i] = tempGainArr;
            this.rotMtxNodes[i + 1] = tempGainArr2;
            //Input Channels: [W,Y,X,Y2,X2,Y3,X3,...]
            this.in.connect(this.rotMtxNodes[i][0], i + 1, 0);
            this.rotMtxNodes[i][0].connect(this.out, 0, i + 1);
            this.in.connect(this.rotMtxNodes[i][1], i + 2, 0);
            this.rotMtxNodes[i][1].connect(this.out, 0, i + 1);

            this.in.connect(this.rotMtxNodes[i + 1][0], i + 1, 0);
            this.rotMtxNodes[i + 1][0].connect(this.out, 0, i + 2);
            this.in.connect(this.rotMtxNodes[i + 1][1], i + 2, 0);
            this.rotMtxNodes[i + 1][1].connect(this.out, 0, i + 2);
        }
        // initialize rotation matrix
        this.updateRotMtx();
    }

    (0, _createClass3.default)(sceneRotator, [{
        key: "updateRotMtx",
        value: function updateRotMtx() {
            var azim = this.yaw * Math.PI / 180;
            var j = 1;
            for (var i = 0; i < 2 * this.order; i = i + 2) {
                // channels are ACN ordered!
                this.rotMtxNodes[i][0].gain.value = Math.cos(j * azim);
                this.rotMtxNodes[i][1].gain.value = Math.sin(j * azim);
                this.rotMtxNodes[i + 1][0].gain.value = -Math.sin(j * azim);
                this.rotMtxNodes[i + 1][1].gain.value = Math.cos(j * azim);
                j++;
            }
        }
    }]);
    return sceneRotator;
}();

exports.default = sceneRotator;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImhyaXItbG9hZGVyMkRfbG9jYWwuanMiXSwibmFtZXMiOlsic2NlbmVSb3RhdG9yIiwiYXVkaW9DdHgiLCJvcmRlciIsImN0eCIsIm5DaCIsInlhdyIsImluIiwiY3JlYXRlQ2hhbm5lbFNwbGl0dGVyIiwib3V0IiwiY3JlYXRlQ2hhbm5lbE1lcmdlciIsInJvdE10eE5vZGVzIiwiQXJyYXkiLCJjb25uZWN0IiwiaSIsInRlbXBHYWluQXJyIiwiY3JlYXRlR2FpbiIsInRlbXBHYWluQXJyMiIsInVwZGF0ZVJvdE10eCIsImF6aW0iLCJNYXRoIiwiUEkiLCJqIiwiZ2FpbiIsInZhbHVlIiwiY29zIiwic2luIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0lBRXFCQSxZO0FBRWpCLDBCQUFZQyxRQUFaLEVBQXNCQyxLQUF0QixFQUE2QjtBQUFBOzs7QUFFekIsYUFBS0MsR0FBTCxHQUFXRixRQUFYO0FBQ0EsYUFBS0MsS0FBTCxHQUFhQSxLQUFiO0FBQ0EsYUFBS0UsR0FBTCxHQUFXLElBQUVGLEtBQUYsR0FBVSxDQUFyQjtBQUNBLGFBQUtHLEdBQUwsR0FBVyxDQUFYOztBQUVBO0FBQ0EsYUFBS0MsRUFBTCxHQUFVLEtBQUtILEdBQUwsQ0FBU0kscUJBQVQsQ0FBK0IsS0FBS0gsR0FBcEMsQ0FBVjtBQUNBLGFBQUtJLEdBQUwsR0FBVyxLQUFLTCxHQUFMLENBQVNNLG1CQUFULENBQTZCLEtBQUtMLEdBQWxDLENBQVg7O0FBRUEsYUFBS00sV0FBTCxHQUFtQixJQUFJQyxLQUFKLENBQVUsSUFBRSxLQUFLVCxLQUFqQixDQUFuQjtBQUNBLGFBQUtJLEVBQUwsQ0FBUU0sT0FBUixDQUFnQixLQUFLSixHQUFyQixFQUEwQixDQUExQixFQUE2QixDQUE3QixF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QUFpQkcsSUFBRSxDQUFuQixFQUFzQixDQUF0QixFQUF5QlMsSUFBekIsQ0FBOEJDLEtBQTlCLEdBQXNDLENBQUNKLEtBQUtNLEdBQUwsQ0FBU0osSUFBRUgsSUFBWCxDQUF2QztBQUNBLHFCQUFLUixXQUFMLENBQWlCRyxJQUFFLENBQW5CLEVBQXNCLENBQXRCLEVBQXlCUyxJQUF6QixDQUE4QkMsS0FBOUIsR0FBc0NKLEtBQUtLLEdBQUwsQ0FBU0gsSUFBRUgsSUFBWCxDQUF0QztBQUNBRztBQUNEO0FBQ0o7Ozs7O2tCQXREZ0JyQixZIiwiZmlsZSI6ImhyaXItbG9hZGVyMkRfbG9jYWwuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gIEFyY2hvbnRpcyBQb2xpdGlzXG4vLyAgYXJjaG9udGlzLnBvbGl0aXNAYWFsdG8uZmlcbi8vICBEYXZpZCBQb2lyaWVyLVF1aW5vdFxuLy8gIGRhdmlwb2lyQGlyY2FtLmZyXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy9cbi8vICBKU0FtYmlzb25pY3MgYSBKYXZhU2NyaXB0IGxpYnJhcnkgZm9yIGhpZ2hlci1vcmRlciBBbWJpc29uaWNzXG4vLyAgVGhlIGxpYnJhcnkgaW1wbGVtZW50cyBXZWIgQXVkaW8gYmxvY2tzIHRoYXQgcGVyZm9ybVxuLy8gIHR5cGljYWwgYW1iaXNvbmljIHByb2Nlc3Npbmcgb3BlcmF0aW9ucyBvbiBhdWRpbyBzaWduYWxzLlxuLy9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy9cbi8vICBzY2VuZVJvdGF0b3IgZm9yIDJEIHVzZVxuLy8gIGFkYXB0ZWQgYnkgVGhvbWFzIERlcHBpc2NoXG4vLyAgdGhvbWFzLmRlcHBpc2NoOTNAZ21haWwuY29tXG4vL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vKiBIT0EgUk9UQVRPUiAyRCAqL1xuLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBzY2VuZVJvdGF0b3Ige1xuXG4gICAgY29uc3RydWN0b3IoYXVkaW9DdHgsIG9yZGVyKSB7XG5cbiAgICAgICAgdGhpcy5jdHggPSBhdWRpb0N0eDtcbiAgICAgICAgdGhpcy5vcmRlciA9IG9yZGVyO1xuICAgICAgICB0aGlzLm5DaCA9IDIqb3JkZXIgKyAxO1xuICAgICAgICB0aGlzLnlhdyA9IDA7XG5cbiAgICAgICAgLy8gSW5wdXQgYW5kIG91dHB1dCBub2Rlc1xuICAgICAgICB0aGlzLmluID0gdGhpcy5jdHguY3JlYXRlQ2hhbm5lbFNwbGl0dGVyKHRoaXMubkNoKTtcbiAgICAgICAgdGhpcy5vdXQgPSB0aGlzLmN0eC5jcmVhdGVDaGFubmVsTWVyZ2VyKHRoaXMubkNoKTtcblxuICAgICAgICB0aGlzLnJvdE10eE5vZGVzID0gbmV3IEFycmF5KDIqdGhpcy5vcmRlcik7XG4gICAgICAgIHRoaXMuaW4uY29ubmVjdCh0aGlzLm91dCwgMCwgMCk7IC8vIFcgY2hhbm5lbCBkb2VzIG5vdCByb3RhdGVcblxuICAgICAgICAvL2luaXRpYWxpemUgZ2FpbiBub2Rlc1xuICAgICAgICBmb3IgKHZhciBpPTA7aTwoMip0aGlzLm9yZGVyKTtpPWkrMil7XG4gICAgICAgICAgLy8gZXZlcnkgb3V0cHV0IG5lZWRzIHR3byBnYWluIG5vZGVzXG4gICAgICAgICAgdmFyIHRlbXBHYWluQXJyID0gbmV3IEFycmF5KDIpO1xuICAgICAgICAgIHRlbXBHYWluQXJyWzBdID0gdGhpcy5jdHguY3JlYXRlR2FpbigpO1xuICAgICAgICAgIHRlbXBHYWluQXJyWzFdID0gdGhpcy5jdHguY3JlYXRlR2FpbigpO1xuICAgICAgICAgIHZhciB0ZW1wR2FpbkFycjIgPSBuZXcgQXJyYXkoMik7XG4gICAgICAgICAgdGVtcEdhaW5BcnIyWzBdID0gdGhpcy5jdHguY3JlYXRlR2FpbigpO1xuICAgICAgICAgIHRlbXBHYWluQXJyMlsxXSA9IHRoaXMuY3R4LmNyZWF0ZUdhaW4oKTtcblxuICAgICAgICAgIHRoaXMucm90TXR4Tm9kZXNbaV0gPSB0ZW1wR2FpbkFycjtcbiAgICAgICAgICB0aGlzLnJvdE10eE5vZGVzW2krMV0gPSB0ZW1wR2FpbkFycjI7XG4gICAgICAgICAgLy9JbnB1dCBDaGFubmVsczogW1csWSxYLFkyLFgyLFkzLFgzLC4uLl1cbiAgICAgICAgICB0aGlzLmluLmNvbm5lY3QodGhpcy5yb3RNdHhOb2Rlc1tpXVswXSwoaSsxKSwwKTtcbiAgICAgICAgICB0aGlzLnJvdE10eE5vZGVzW2ldWzBdLmNvbm5lY3QodGhpcy5vdXQsMCxpKzEpO1xuICAgICAgICAgIHRoaXMuaW4uY29ubmVjdCh0aGlzLnJvdE10eE5vZGVzW2ldWzFdLChpKzIpLDApO1xuICAgICAgICAgIHRoaXMucm90TXR4Tm9kZXNbaV1bMV0uY29ubmVjdCh0aGlzLm91dCwwLGkrMSk7XG5cbiAgICAgICAgICB0aGlzLmluLmNvbm5lY3QodGhpcy5yb3RNdHhOb2Rlc1tpKzFdWzBdLChpKzEpLDApO1xuICAgICAgICAgIHRoaXMucm90TXR4Tm9kZXNbaSsxXVswXS5jb25uZWN0KHRoaXMub3V0LDAsaSsyKTtcbiAgICAgICAgICB0aGlzLmluLmNvbm5lY3QodGhpcy5yb3RNdHhOb2Rlc1tpKzFdWzFdLChpKzIpLDApO1xuICAgICAgICAgIHRoaXMucm90TXR4Tm9kZXNbaSsxXVsxXS5jb25uZWN0KHRoaXMub3V0LDAsaSsyKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBpbml0aWFsaXplIHJvdGF0aW9uIG1hdHJpeFxuICAgICAgICB0aGlzLnVwZGF0ZVJvdE10eCgpO1xuICAgIH1cblxuICAgIHVwZGF0ZVJvdE10eCgpIHtcbiAgICAgICAgdmFyIGF6aW0gPSB0aGlzLnlhdyAqIE1hdGguUEkgLyAxODA7XG4gICAgICAgIHZhciBqID0gMTtcbiAgICAgICAgZm9yIChsZXQgaT0wO2k8KDIqdGhpcy5vcmRlcik7aT1pKzIpe1xuICAgICAgICAgIC8vIGNoYW5uZWxzIGFyZSBBQ04gb3JkZXJlZCFcbiAgICAgICAgICB0aGlzLnJvdE10eE5vZGVzW2ldWzBdLmdhaW4udmFsdWUgPSBNYXRoLmNvcyhqKmF6aW0pO1xuICAgICAgICAgIHRoaXMucm90TXR4Tm9kZXNbaV1bMV0uZ2Fpbi52YWx1ZSA9IE1hdGguc2luKGoqYXppbSk7XG4gICAgICAgICAgdGhpcy5yb3RNdHhOb2Rlc1tpKzFdWzBdLmdhaW4udmFsdWUgPSAtTWF0aC5zaW4oaiphemltKTtcbiAgICAgICAgICB0aGlzLnJvdE10eE5vZGVzW2krMV1bMV0uZ2Fpbi52YWx1ZSA9IE1hdGguY29zKGoqYXppbSk7XG4gICAgICAgICAgaisrO1xuICAgICAgICB9XG4gICAgfVxufVxuIl19