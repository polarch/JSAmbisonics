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

var sceneRotator2D = function () {
    function sceneRotator2D(audioCtx, order) {
        (0, _classCallCheck3.default)(this, sceneRotator2D);


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

    (0, _createClass3.default)(sceneRotator2D, [{
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
    return sceneRotator2D;
}();

exports.default = sceneRotator2D;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFtYmktc2NlbmVSb3RhdG9yMkQuanMiXSwibmFtZXMiOlsic2NlbmVSb3RhdG9yMkQiLCJhdWRpb0N0eCIsIm9yZGVyIiwiY3R4IiwibkNoIiwieWF3IiwiaW4iLCJjcmVhdGVDaGFubmVsU3BsaXR0ZXIiLCJvdXQiLCJjcmVhdGVDaGFubmVsTWVyZ2VyIiwicm90TXR4Tm9kZXMiLCJBcnJheSIsImNvbm5lY3QiLCJpIiwidGVtcEdhaW5BcnIiLCJjcmVhdGVHYWluIiwidGVtcEdhaW5BcnIyIiwidXBkYXRlUm90TXR4IiwiYXppbSIsIk1hdGgiLCJQSSIsImoiLCJnYWluIiwidmFsdWUiLCJjb3MiLCJzaW4iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7SUFFcUJBLGM7QUFFakIsNEJBQVlDLFFBQVosRUFBc0JDLEtBQXRCLEVBQTZCO0FBQUE7OztBQUV6QixhQUFLQyxHQUFMLEdBQVdGLFFBQVg7QUFDQSxhQUFLQyxLQUFMLEdBQWFBLEtBQWI7QUFDQSxhQUFLRSxHQUFMLEdBQVcsSUFBRUYsS0FBRixHQUFVLENBQXJCO0FBQ0EsYUFBS0csR0FBTCxHQUFXLENBQVg7O0FBRUE7QUFDQSxhQUFLQyxFQUFMLEdBQVUsS0FBS0gsR0FBTCxDQUFTSSxxQkFBVCxDQUErQixLQUFLSCxHQUFwQyxDQUFWO0FBQ0EsYUFBS0ksR0FBTCxHQUFXLEtBQUtMLEdBQUwsQ0FBU00sbUJBQVQsQ0FBNkIsS0FBS0wsR0FBbEMsQ0FBWDs7QUFFQSxhQUFLTSxXQUFMLEdBQW1CLElBQUlDLEtBQUosQ0FBVSxJQUFFLEtBQUtULEtBQWpCLENBQW5CO0FBQ0EsYUFBS0ksRUFBTCxDQUFRTSxPQUFSLENBQWdCLEtBQUtKLEdBQXJCLEVBQTBCLENBQTFCLEVBQTZCLENBQTdC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LENBQWlCRyxJQUFFLENBQW5CLEVBQXNCLENBQXRCLEVBQXlCUyxJQUF6QixDQUE4QkMsS0FBOUIsR0FBc0MsQ0FBQ0osS0FBS00sR0FBTCxDQUFTSixJQUFFSCxJQUFYLENBQXZDO0FBQ0EscUJBQUtSLFdBQUwsQ0FBaUJHLElBQUUsQ0FBbkIsRUFBc0IsQ0FBdEIsRUFBeUJTLElBQXpCLENBQThCQyxLQUE5QixHQUFzQ0osS0FBS0ssR0FBTCxDQUFTSCxJQUFFSCxJQUFYLENBQXRDO0FBQ0FHO0FBQ0Q7QUFDSjs7Ozs7a0JBdERnQnJCLGMiLCJmaWxlIjoiYW1iaS1zY2VuZVJvdGF0b3IyRC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyAgQXJjaG9udGlzIFBvbGl0aXNcbi8vICBhcmNob250aXMucG9saXRpc0BhYWx0by5maVxuLy8gIERhdmlkIFBvaXJpZXItUXVpbm90XG4vLyAgZGF2aXBvaXJAaXJjYW0uZnJcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vL1xuLy8gIEpTQW1iaXNvbmljcyBhIEphdmFTY3JpcHQgbGlicmFyeSBmb3IgaGlnaGVyLW9yZGVyIEFtYmlzb25pY3Ncbi8vICBUaGUgbGlicmFyeSBpbXBsZW1lbnRzIFdlYiBBdWRpbyBibG9ja3MgdGhhdCBwZXJmb3JtXG4vLyAgdHlwaWNhbCBhbWJpc29uaWMgcHJvY2Vzc2luZyBvcGVyYXRpb25zIG9uIGF1ZGlvIHNpZ25hbHMuXG4vL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vL1xuLy8gIHNjZW5lUm90YXRvciBmb3IgMkQgdXNlXG4vLyAgYWRhcHRlZCBieSBUaG9tYXMgRGVwcGlzY2hcbi8vICB0aG9tYXMuZGVwcGlzY2g5M0BnbWFpbC5jb21cbi8vXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8qIEhPQSBST1RBVE9SIDJEICovXG4vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIHNjZW5lUm90YXRvcjJEIHtcblxuICAgIGNvbnN0cnVjdG9yKGF1ZGlvQ3R4LCBvcmRlcikge1xuXG4gICAgICAgIHRoaXMuY3R4ID0gYXVkaW9DdHg7XG4gICAgICAgIHRoaXMub3JkZXIgPSBvcmRlcjtcbiAgICAgICAgdGhpcy5uQ2ggPSAyKm9yZGVyICsgMTtcbiAgICAgICAgdGhpcy55YXcgPSAwO1xuXG4gICAgICAgIC8vIElucHV0IGFuZCBvdXRwdXQgbm9kZXNcbiAgICAgICAgdGhpcy5pbiA9IHRoaXMuY3R4LmNyZWF0ZUNoYW5uZWxTcGxpdHRlcih0aGlzLm5DaCk7XG4gICAgICAgIHRoaXMub3V0ID0gdGhpcy5jdHguY3JlYXRlQ2hhbm5lbE1lcmdlcih0aGlzLm5DaCk7XG5cbiAgICAgICAgdGhpcy5yb3RNdHhOb2RlcyA9IG5ldyBBcnJheSgyKnRoaXMub3JkZXIpO1xuICAgICAgICB0aGlzLmluLmNvbm5lY3QodGhpcy5vdXQsIDAsIDApOyAvLyBXIGNoYW5uZWwgZG9lcyBub3Qgcm90YXRlXG5cbiAgICAgICAgLy9pbml0aWFsaXplIGdhaW4gbm9kZXNcbiAgICAgICAgZm9yICh2YXIgaT0wO2k8KDIqdGhpcy5vcmRlcik7aT1pKzIpe1xuICAgICAgICAgIC8vIGV2ZXJ5IG91dHB1dCBuZWVkcyB0d28gZ2FpbiBub2Rlc1xuICAgICAgICAgIHZhciB0ZW1wR2FpbkFyciA9IG5ldyBBcnJheSgyKTtcbiAgICAgICAgICB0ZW1wR2FpbkFyclswXSA9IHRoaXMuY3R4LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgICB0ZW1wR2FpbkFyclsxXSA9IHRoaXMuY3R4LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgICB2YXIgdGVtcEdhaW5BcnIyID0gbmV3IEFycmF5KDIpO1xuICAgICAgICAgIHRlbXBHYWluQXJyMlswXSA9IHRoaXMuY3R4LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgICB0ZW1wR2FpbkFycjJbMV0gPSB0aGlzLmN0eC5jcmVhdGVHYWluKCk7XG5cbiAgICAgICAgICB0aGlzLnJvdE10eE5vZGVzW2ldID0gdGVtcEdhaW5BcnI7XG4gICAgICAgICAgdGhpcy5yb3RNdHhOb2Rlc1tpKzFdID0gdGVtcEdhaW5BcnIyO1xuICAgICAgICAgIC8vSW5wdXQgQ2hhbm5lbHM6IFtXLFksWCxZMixYMixZMyxYMywuLi5dXG4gICAgICAgICAgdGhpcy5pbi5jb25uZWN0KHRoaXMucm90TXR4Tm9kZXNbaV1bMF0sKGkrMSksMCk7XG4gICAgICAgICAgdGhpcy5yb3RNdHhOb2Rlc1tpXVswXS5jb25uZWN0KHRoaXMub3V0LDAsaSsxKTtcbiAgICAgICAgICB0aGlzLmluLmNvbm5lY3QodGhpcy5yb3RNdHhOb2Rlc1tpXVsxXSwoaSsyKSwwKTtcbiAgICAgICAgICB0aGlzLnJvdE10eE5vZGVzW2ldWzFdLmNvbm5lY3QodGhpcy5vdXQsMCxpKzEpO1xuXG4gICAgICAgICAgdGhpcy5pbi5jb25uZWN0KHRoaXMucm90TXR4Tm9kZXNbaSsxXVswXSwoaSsxKSwwKTtcbiAgICAgICAgICB0aGlzLnJvdE10eE5vZGVzW2krMV1bMF0uY29ubmVjdCh0aGlzLm91dCwwLGkrMik7XG4gICAgICAgICAgdGhpcy5pbi5jb25uZWN0KHRoaXMucm90TXR4Tm9kZXNbaSsxXVsxXSwoaSsyKSwwKTtcbiAgICAgICAgICB0aGlzLnJvdE10eE5vZGVzW2krMV1bMV0uY29ubmVjdCh0aGlzLm91dCwwLGkrMik7XG4gICAgICAgIH1cbiAgICAgICAgLy8gaW5pdGlhbGl6ZSByb3RhdGlvbiBtYXRyaXhcbiAgICAgICAgdGhpcy51cGRhdGVSb3RNdHgoKTtcbiAgICB9XG5cbiAgICB1cGRhdGVSb3RNdHgoKSB7XG4gICAgICAgIHZhciBhemltID0gdGhpcy55YXcgKiBNYXRoLlBJIC8gMTgwO1xuICAgICAgICB2YXIgaiA9IDE7XG4gICAgICAgIGZvciAobGV0IGk9MDtpPCgyKnRoaXMub3JkZXIpO2k9aSsyKXtcbiAgICAgICAgICAvLyBjaGFubmVscyBhcmUgQUNOIG9yZGVyZWQhXG4gICAgICAgICAgdGhpcy5yb3RNdHhOb2Rlc1tpXVswXS5nYWluLnZhbHVlID0gTWF0aC5jb3MoaiphemltKTtcbiAgICAgICAgICB0aGlzLnJvdE10eE5vZGVzW2ldWzFdLmdhaW4udmFsdWUgPSBNYXRoLnNpbihqKmF6aW0pO1xuICAgICAgICAgIHRoaXMucm90TXR4Tm9kZXNbaSsxXVswXS5nYWluLnZhbHVlID0gLU1hdGguc2luKGoqYXppbSk7XG4gICAgICAgICAgdGhpcy5yb3RNdHhOb2Rlc1tpKzFdWzFdLmdhaW4udmFsdWUgPSBNYXRoLmNvcyhqKmF6aW0pO1xuICAgICAgICAgIGorKztcbiAgICAgICAgfVxuICAgIH1cbn1cbiJdfQ==