'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

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
//
//  monoEncoder for 2D use
//  adapted by Thomas Deppisch
//  thomas.deppisch93@gmail.com
//
////////////////////////////////////////////////////////////////////
////////////////////
/* HOA 2D ENCODER */
///////////////////

var utils = require("./utils.js");

var monoEncoder2D = function () {
    function monoEncoder2D(audioCtx, order) {
        (0, _classCallCheck3.default)(this, monoEncoder2D);


        this.initialized = false;

        this.ctx = audioCtx;
        this.order = order;
        this.nCh = 2 * order + 1;
        this.azim = 0;
        this.elev = 0;
        this.gains = new Array(this.nCh);
        this.gainNodes = new Array(this.nCh);
        this.in = this.ctx.createGain();
        this.in.channelCountMode = 'explicit';
        this.in.channelCount = 1;
        this.out = this.ctx.createChannelMerger(this.nCh);
        // Initialize encoding gains
        for (var i = 0; i < this.nCh; i++) {
            this.gainNodes[i] = this.ctx.createGain();
            this.gainNodes[i].channelCountMode = 'explicit';
            this.gainNodes[i].channelCount = 1;
        }
        this.updateGains();
        // Make audio connections
        for (var i = 0; i < this.nCh; i++) {
            this.in.connect(this.gainNodes[i]);
            this.gainNodes[i].connect(this.out, 0, i);
        }

        this.initialized = true;
    }

    (0, _createClass3.default)(monoEncoder2D, [{
        key: 'updateGains',
        value: function updateGains() {
            var N = this.order;
            var g_enc = utils.getCircHarmonics(N, [this.azim]);

            for (var i = 0; i < this.nCh; i++) {
                this.gainNodes[i].gain.value = g_enc[i][0];
            }
        }
    }]);
    return monoEncoder2D;
}();

exports.default = monoEncoder2D;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFtYmktbW9ub0VuY29kZXIyRC5qcyJdLCJuYW1lcyI6WyJ1dGlscyIsInJlcXVpcmUiLCJtb25vRW5jb2RlcjJEIiwiYXVkaW9DdHgiLCJvcmRlciIsImluaXRpYWxpemVkIiwiY3R4IiwibkNoIiwiYXppbSIsImVsZXYiLCJnYWlucyIsIkFycmF5IiwiZ2Fpbk5vZGVzIiwiaW4iLCJjcmVhdGVHYWluIiwiY2hhbm5lbENvdW50TW9kZSIsImNoYW5uZWxDb3VudCIsIm91dCIsImNyZWF0ZUNoYW5uZWxNZXJnZXIiLCJpIiwidXBkYXRlR2FpbnMiLCJjb25uZWN0IiwiTiIsImdfZW5jIiwiZ2V0Q2lyY0hhcm1vbmljcyIsImdhaW4iLCJ2YWx1ZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7OztBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxJQUFJQSxRQUFRQyxRQUFRLFlBQVIsQ0FBWjs7SUFFcUJDLGE7QUFFakIsMkJBQVlDLFFBQVosRUFBc0JDLEtBQXRCLEVBQTZCO0FBQUE7OztBQUV6QixhQUFLQyxXQUFMLEdBQW1CLEtBQW5COztBQUVBLGFBQUtDLEdBQUwsR0FBV0gsUUFBWDtBQUNBLGFBQUtDLEtBQUwsR0FBYUEsS0FBYjtBQUNBLGFBQUtHLEdBQUwsR0FBVyxJQUFFSCxLQUFGLEdBQVUsQ0FBckI7QUFDQSxhQUFLSSxJQUFMLEdBQVksQ0FBWjtBQUNBLGFBQUtDLElBQUwsR0FBWSxDQUFaO0FBQ0EsYUFBS0MsS0FBTCxHQUFhLElBQUlDLEtBQUosQ0FBVSxLQUFLSixHQUFmLENBQWI7QUFDQSxhQUFLSyxTQUFMLEdBQWlCLElBQUlELEtBQUosQ0FBVSxLQUFLSixHQUFmLENBQWpCO0FBQ0EsYUFBS00sRUFBTCxHQUFVLEtBQUtQLEdBQUwsQ0FBU1EsVUFBVCxFQUFWO0FBQ0EsYUFBS0QsRUFBTCxDQUFRRSxnQkFBUixHQUEyQixVQUEzQjtBQUNBLGFBQUtGLEVBQUwsQ0FBUUcsWUFBUixHQUF1QixDQUF2QjtBQUNBLGFBQUtDLEdBQUwsR0FBVyxLQUFLWCxHQUFMLENBQVNZLG1CQUFULENBQTZCLEtBQUtYLEdBQWxDLENBQVg7QUFDQTtBQUNBLGFBQUssSUFBSVksSUFBSSxDQUFiLEVBQWdCQSxJQUFJLEtBQUtaLEdBQXpCLEVBQThCWSxHQUE5QixFQUFtQztBQUMvQixpQkFBS1AsU0FBTCxDQUFlTyxDQUFmLElBQW9CLEtBQUtiLEdBQUwsQ0FBU1EsVUFBVCxFQUFwQjtBQUNBLGlCQUFLRixTQUFMLENBQWVPLENBQWYsRUFBa0JKLGdCQUFsQixHQUFxQyxVQUFyQztBQUNBLGlCQUFLSCxTQUFMLENBQWVPLENBQWYsRUFBa0JILFlBQWxCLEdBQWlDLENBQWpDO0FBQ0g7QUFDRCxhQUFLSSxXQUFMO0FBQ0E7QUFDQSxhQUFLLElBQUlELElBQUksQ0FBYixFQUFnQkEsSUFBSSxLQUFLWixHQUF6QixFQUE4QlksR0FBOUIsRUFBbUM7QUFDL0IsaUJBQUtOLEVBQUwsQ0FBUVEsT0FBUixDQUFnQixLQUFLVCxTQUFMLENBQWVPLENBQWYsQ0FBaEI7QUFDQSxpQkFBS1AsU0FBTCxDQUFlTyxDQUFmLEVBQWtCRSxPQUFsQixDQUEwQixLQUFLSixHQUEvQixFQUFvQyxDQUFwQyxFQUF1Q0UsQ0FBdkM7QUFDSDs7QUFFRCxhQUFLZCxXQUFMLEdBQW1CLElBQW5CO0FBQ0g7Ozs7c0NBRWE7QUFDVixnQkFBSWlCLElBQUksS0FBS2xCLEtBQWI7QUFDQSxnQkFBSW1CLFFBQVF2QixNQUFNd0IsZ0JBQU4sQ0FBdUJGLENBQXZCLEVBQTBCLENBQUMsS0FBS2QsSUFBTixDQUExQixDQUFaOztBQUVBLGlCQUFLLElBQUlXLElBQUksQ0FBYixFQUFnQkEsSUFBSSxLQUFLWixHQUF6QixFQUE4QlksR0FBOUIsRUFBbUM7QUFDL0IscUJBQUtQLFNBQUwsQ0FBZU8sQ0FBZixFQUFrQk0sSUFBbEIsQ0FBdUJDLEtBQXZCLEdBQStCSCxNQUFNSixDQUFOLEVBQVMsQ0FBVCxDQUEvQjtBQUNIO0FBQ0o7Ozs7O2tCQXhDZ0JqQixhIiwiZmlsZSI6ImFtYmktbW9ub0VuY29kZXIyRC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyAgQXJjaG9udGlzIFBvbGl0aXNcbi8vICBhcmNob250aXMucG9saXRpc0BhYWx0by5maVxuLy8gIERhdmlkIFBvaXJpZXItUXVpbm90XG4vLyAgZGF2aXBvaXJAaXJjYW0uZnJcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vL1xuLy8gIEpTQW1iaXNvbmljcyBhIEphdmFTY3JpcHQgbGlicmFyeSBmb3IgaGlnaGVyLW9yZGVyIEFtYmlzb25pY3Ncbi8vICBUaGUgbGlicmFyeSBpbXBsZW1lbnRzIFdlYiBBdWRpbyBibG9ja3MgdGhhdCBwZXJmb3JtXG4vLyAgdHlwaWNhbCBhbWJpc29uaWMgcHJvY2Vzc2luZyBvcGVyYXRpb25zIG9uIGF1ZGlvIHNpZ25hbHMuXG4vL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vXG4vLyAgbW9ub0VuY29kZXIgZm9yIDJEIHVzZVxuLy8gIGFkYXB0ZWQgYnkgVGhvbWFzIERlcHBpc2NoXG4vLyAgdGhvbWFzLmRlcHBpc2NoOTNAZ21haWwuY29tXG4vL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vKiBIT0EgMkQgRU5DT0RFUiAqL1xuLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG52YXIgdXRpbHMgPSByZXF1aXJlKFwiLi91dGlscy5qc1wiKTtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgbW9ub0VuY29kZXIyRCB7XG5cbiAgICBjb25zdHJ1Y3RvcihhdWRpb0N0eCwgb3JkZXIpIHtcblxuICAgICAgICB0aGlzLmluaXRpYWxpemVkID0gZmFsc2U7XG5cbiAgICAgICAgdGhpcy5jdHggPSBhdWRpb0N0eDtcbiAgICAgICAgdGhpcy5vcmRlciA9IG9yZGVyO1xuICAgICAgICB0aGlzLm5DaCA9IDIqb3JkZXIgKyAxO1xuICAgICAgICB0aGlzLmF6aW0gPSAwO1xuICAgICAgICB0aGlzLmVsZXYgPSAwO1xuICAgICAgICB0aGlzLmdhaW5zID0gbmV3IEFycmF5KHRoaXMubkNoKTtcbiAgICAgICAgdGhpcy5nYWluTm9kZXMgPSBuZXcgQXJyYXkodGhpcy5uQ2gpO1xuICAgICAgICB0aGlzLmluID0gdGhpcy5jdHguY3JlYXRlR2FpbigpO1xuICAgICAgICB0aGlzLmluLmNoYW5uZWxDb3VudE1vZGUgPSAnZXhwbGljaXQnO1xuICAgICAgICB0aGlzLmluLmNoYW5uZWxDb3VudCA9IDE7XG4gICAgICAgIHRoaXMub3V0ID0gdGhpcy5jdHguY3JlYXRlQ2hhbm5lbE1lcmdlcih0aGlzLm5DaCk7XG4gICAgICAgIC8vIEluaXRpYWxpemUgZW5jb2RpbmcgZ2FpbnNcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm5DaDsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLmdhaW5Ob2Rlc1tpXSA9IHRoaXMuY3R4LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgICAgIHRoaXMuZ2Fpbk5vZGVzW2ldLmNoYW5uZWxDb3VudE1vZGUgPSAnZXhwbGljaXQnO1xuICAgICAgICAgICAgdGhpcy5nYWluTm9kZXNbaV0uY2hhbm5lbENvdW50ID0gMTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnVwZGF0ZUdhaW5zKCk7XG4gICAgICAgIC8vIE1ha2UgYXVkaW8gY29ubmVjdGlvbnNcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm5DaDsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLmluLmNvbm5lY3QodGhpcy5nYWluTm9kZXNbaV0pO1xuICAgICAgICAgICAgdGhpcy5nYWluTm9kZXNbaV0uY29ubmVjdCh0aGlzLm91dCwgMCwgaSk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmluaXRpYWxpemVkID0gdHJ1ZTtcbiAgICB9XG5cbiAgICB1cGRhdGVHYWlucygpIHtcbiAgICAgICAgdmFyIE4gPSB0aGlzLm9yZGVyO1xuICAgICAgICB2YXIgZ19lbmMgPSB1dGlscy5nZXRDaXJjSGFybW9uaWNzKE4sIFt0aGlzLmF6aW1dKTtcblxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubkNoOyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMuZ2Fpbk5vZGVzW2ldLmdhaW4udmFsdWUgPSBnX2VuY1tpXVswXTtcbiAgICAgICAgfVxuICAgIH1cbn1cbiJdfQ==