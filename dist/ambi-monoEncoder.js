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

var monoEncoder = function () {
    function monoEncoder(audioCtx, order) {
        (0, _classCallCheck3.default)(this, monoEncoder);


        this.initialized = false;

        this.ctx = audioCtx;
        this.order = order;
        this.nCh = (order + 1) * (order + 1);
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

    (0, _createClass3.default)(monoEncoder, [{
        key: 'updateGains',
        value: function updateGains() {
            var N = this.order;
            var g_enc = jshlib.computeRealSH(N, [[this.azim * Math.PI / 180, this.elev * Math.PI / 180]]);

            for (var i = 0; i < this.nCh; i++) {
                this.gains[i] = g_enc[i][0];
                this.gainNodes[i].gain.value = this.gains[i];
            }
        }
    }]);
    return monoEncoder;
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
/* HOA ENCODER */
/////////////////

exports.default = monoEncoder;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFtYmktbW9ub0VuY29kZXIuanMiXSwibmFtZXMiOlsianNobGliIiwibW9ub0VuY29kZXIiLCJhdWRpb0N0eCIsIm9yZGVyIiwiaW5pdGlhbGl6ZWQiLCJjdHgiLCJuQ2giLCJhemltIiwiZWxldiIsImdhaW5zIiwiQXJyYXkiLCJnYWluTm9kZXMiLCJpbiIsImNyZWF0ZUdhaW4iLCJjaGFubmVsQ291bnRNb2RlIiwiY2hhbm5lbENvdW50Iiwib3V0IiwiY3JlYXRlQ2hhbm5lbE1lcmdlciIsImkiLCJ1cGRhdGVHYWlucyIsImNvbm5lY3QiLCJOIiwiZ19lbmMiLCJjb21wdXRlUmVhbFNIIiwiTWF0aCIsIlBJIiwiZ2FpbiIsInZhbHVlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7OztBQWlCQTs7SUFBWUEsTTs7Ozs7O0lBRVNDLFc7QUFFakIseUJBQVlDLFFBQVosRUFBc0JDLEtBQXRCLEVBQTZCO0FBQUE7OztBQUV6QixhQUFLQyxXQUFMLEdBQW1CLEtBQW5COztBQUVBLGFBQUtDLEdBQUwsR0FBV0gsUUFBWDtBQUNBLGFBQUtDLEtBQUwsR0FBYUEsS0FBYjtBQUNBLGFBQUtHLEdBQUwsR0FBVyxDQUFDSCxRQUFRLENBQVQsS0FBZUEsUUFBUSxDQUF2QixDQUFYO0FBQ0EsYUFBS0ksSUFBTCxHQUFZLENBQVo7QUFDQSxhQUFLQyxJQUFMLEdBQVksQ0FBWjtBQUNBLGFBQUtDLEtBQUwsR0FBYSxJQUFJQyxLQUFKLENBQVUsS0FBS0osR0FBZixDQUFiO0FBQ0EsYUFBS0ssU0FBTCxHQUFpQixJQUFJRCxLQUFKLENBQVUsS0FBS0osR0FBZixDQUFqQjtBQUNBLGFBQUtNLEVBQUwsR0FBVSxLQUFLUCxHQUFMLENBQVNRLFVBQVQsRUFBVjtBQUNBLGFBQUtELEVBQUwsQ0FBUUUsZ0JBQVIsR0FBMkIsVUFBM0I7QUFDQSxhQUFLRixFQUFMLENBQVFHLFlBQVIsR0FBdUIsQ0FBdkI7QUFDQSxhQUFLQyxHQUFMLEdBQVcsS0FBS1gsR0FBTCxDQUFTWSxtQkFBVCxDQUE2QixLQUFLWCxHQUFsQyxDQUFYO0FBQ0E7QUFDQSxhQUFLLElBQUlZLElBQUksQ0FBYixFQUFnQkEsSUFBSSxLQUFLWixHQUF6QixFQUE4QlksR0FBOUIsRUFBbUM7QUFDL0IsaUJBQUtQLFNBQUwsQ0FBZU8sQ0FBZixJQUFvQixLQUFLYixHQUFMLENBQVNRLFVBQVQsRUFBcEI7QUFDQSxpQkFBS0YsU0FBTCxDQUFlTyxDQUFmLEVBQWtCSixnQkFBbEIsR0FBcUMsVUFBckM7QUFDQSxpQkFBS0gsU0FBTCxDQUFlTyxDQUFmLEVBQWtCSCxZQUFsQixHQUFpQyxDQUFqQztBQUNIO0FBQ0QsYUFBS0ksV0FBTDtBQUNBO0FBQ0EsYUFBSyxJQUFJRCxJQUFJLENBQWIsRUFBZ0JBLElBQUksS0FBS1osR0FBekIsRUFBOEJZLEdBQTlCLEVBQW1DO0FBQy9CLGlCQUFLTixFQUFMLENBQVFRLE9BQVIsQ0FBZ0IsS0FBS1QsU0FBTCxDQUFlTyxDQUFmLENBQWhCO0FBQ0EsaUJBQUtQLFNBQUwsQ0FBZU8sQ0FBZixFQUFrQkUsT0FBbEIsQ0FBMEIsS0FBS0osR0FBL0IsRUFBb0MsQ0FBcEMsRUFBdUNFLENBQXZDO0FBQ0g7O0FBRUQsYUFBS2QsV0FBTCxHQUFtQixJQUFuQjtBQUNIOzs7O3NDQUVhO0FBQ1YsZ0JBQUlpQixJQUFJLEtBQUtsQixLQUFiO0FBQ0EsZ0JBQUltQixRQUFRdEIsT0FBT3VCLGFBQVAsQ0FBcUJGLENBQXJCLEVBQXdCLENBQ2hDLENBQUMsS0FBS2QsSUFBTCxHQUFZaUIsS0FBS0MsRUFBakIsR0FBc0IsR0FBdkIsRUFBNEIsS0FBS2pCLElBQUwsR0FBWWdCLEtBQUtDLEVBQWpCLEdBQXNCLEdBQWxELENBRGdDLENBQXhCLENBQVo7O0FBSUEsaUJBQUssSUFBSVAsSUFBSSxDQUFiLEVBQWdCQSxJQUFJLEtBQUtaLEdBQXpCLEVBQThCWSxHQUE5QixFQUFtQztBQUMvQixxQkFBS1QsS0FBTCxDQUFXUyxDQUFYLElBQWdCSSxNQUFNSixDQUFOLEVBQVMsQ0FBVCxDQUFoQjtBQUNBLHFCQUFLUCxTQUFMLENBQWVPLENBQWYsRUFBa0JRLElBQWxCLENBQXVCQyxLQUF2QixHQUErQixLQUFLbEIsS0FBTCxDQUFXUyxDQUFYLENBQS9CO0FBQ0g7QUFDSjs7O0tBOURMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O2tCQUlxQmpCLFciLCJmaWxlIjoiYW1iaS1tb25vRW5jb2Rlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyAgQXJjaG9udGlzIFBvbGl0aXNcbi8vICBhcmNob250aXMucG9saXRpc0BhYWx0by5maVxuLy8gIERhdmlkIFBvaXJpZXItUXVpbm90XG4vLyAgZGF2aXBvaXJAaXJjYW0uZnJcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vL1xuLy8gIEpTQW1iaXNvbmljcyBhIEphdmFTY3JpcHQgbGlicmFyeSBmb3IgaGlnaGVyLW9yZGVyIEFtYmlzb25pY3Ncbi8vICBUaGUgbGlicmFyeSBpbXBsZW1lbnRzIFdlYiBBdWRpbyBibG9ja3MgdGhhdCBwZXJmb3JtXG4vLyAgdHlwaWNhbCBhbWJpc29uaWMgcHJvY2Vzc2luZyBvcGVyYXRpb25zIG9uIGF1ZGlvIHNpZ25hbHMuXG4vL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLy8vLy8vLy8vLy8vLy8vLy9cbi8qIEhPQSBFTkNPREVSICovXG4vLy8vLy8vLy8vLy8vLy8vL1xuXG5pbXBvcnQgKiBhcyBqc2hsaWIgZnJvbSAnc3BoZXJpY2FsLWhhcm1vbmljLXRyYW5zZm9ybSc7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIG1vbm9FbmNvZGVyIHtcblxuICAgIGNvbnN0cnVjdG9yKGF1ZGlvQ3R4LCBvcmRlcikge1xuXG4gICAgICAgIHRoaXMuaW5pdGlhbGl6ZWQgPSBmYWxzZTtcblxuICAgICAgICB0aGlzLmN0eCA9IGF1ZGlvQ3R4O1xuICAgICAgICB0aGlzLm9yZGVyID0gb3JkZXI7XG4gICAgICAgIHRoaXMubkNoID0gKG9yZGVyICsgMSkgKiAob3JkZXIgKyAxKTtcbiAgICAgICAgdGhpcy5hemltID0gMDtcbiAgICAgICAgdGhpcy5lbGV2ID0gMDtcbiAgICAgICAgdGhpcy5nYWlucyA9IG5ldyBBcnJheSh0aGlzLm5DaCk7XG4gICAgICAgIHRoaXMuZ2Fpbk5vZGVzID0gbmV3IEFycmF5KHRoaXMubkNoKTtcbiAgICAgICAgdGhpcy5pbiA9IHRoaXMuY3R4LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgdGhpcy5pbi5jaGFubmVsQ291bnRNb2RlID0gJ2V4cGxpY2l0JztcbiAgICAgICAgdGhpcy5pbi5jaGFubmVsQ291bnQgPSAxO1xuICAgICAgICB0aGlzLm91dCA9IHRoaXMuY3R4LmNyZWF0ZUNoYW5uZWxNZXJnZXIodGhpcy5uQ2gpO1xuICAgICAgICAvLyBJbml0aWFsaXplIGVuY29kaW5nIGdhaW5zXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5uQ2g7IGkrKykge1xuICAgICAgICAgICAgdGhpcy5nYWluTm9kZXNbaV0gPSB0aGlzLmN0eC5jcmVhdGVHYWluKCk7XG4gICAgICAgICAgICB0aGlzLmdhaW5Ob2Rlc1tpXS5jaGFubmVsQ291bnRNb2RlID0gJ2V4cGxpY2l0JztcbiAgICAgICAgICAgIHRoaXMuZ2Fpbk5vZGVzW2ldLmNoYW5uZWxDb3VudCA9IDE7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy51cGRhdGVHYWlucygpO1xuICAgICAgICAvLyBNYWtlIGF1ZGlvIGNvbm5lY3Rpb25zXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5uQ2g7IGkrKykge1xuICAgICAgICAgICAgdGhpcy5pbi5jb25uZWN0KHRoaXMuZ2Fpbk5vZGVzW2ldKTtcbiAgICAgICAgICAgIHRoaXMuZ2Fpbk5vZGVzW2ldLmNvbm5lY3QodGhpcy5vdXQsIDAsIGkpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5pbml0aWFsaXplZCA9IHRydWU7XG4gICAgfVxuXG4gICAgdXBkYXRlR2FpbnMoKSB7XG4gICAgICAgIHZhciBOID0gdGhpcy5vcmRlcjtcbiAgICAgICAgdmFyIGdfZW5jID0ganNobGliLmNvbXB1dGVSZWFsU0goTiwgW1xuICAgICAgICAgICAgW3RoaXMuYXppbSAqIE1hdGguUEkgLyAxODAsIHRoaXMuZWxldiAqIE1hdGguUEkgLyAxODBdXG4gICAgICAgIF0pO1xuXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5uQ2g7IGkrKykge1xuICAgICAgICAgICAgdGhpcy5nYWluc1tpXSA9IGdfZW5jW2ldWzBdO1xuICAgICAgICAgICAgdGhpcy5nYWluTm9kZXNbaV0uZ2Fpbi52YWx1ZSA9IHRoaXMuZ2FpbnNbaV07XG4gICAgICAgIH1cbiAgICB9XG59XG4iXX0=