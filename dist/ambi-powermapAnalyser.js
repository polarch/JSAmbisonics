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
//  WebAudio_HOA a JavaScript library for higher-order Ambisonics
//  The library implements Web Audio blocks that perform
//  typical ambisonic processing operations on audio signals.
//
////////////////////////////////////////////////////////////////////

/////////////////////////////////
/* HOA INTENSITY ANALYZER */
/////////////////////////////////

var HOA_analyser = function () {
    function HOA_analyser(audioCtx, order) {
        (0, _classCallCheck3.default)(this, HOA_analyser);

        this.initialized = false;

        this.ctx = audioCtx;
        this.order = order;
        this.nCh = (order + 1) * (order + 1);
        this.fftSize = 2048;
        this.analysers = new Array(this.nCh);
        this.analBuffers = new Array(this.nCh);
        // Input and output nodes
        this.in = this.ctx.createChannelSplitter(this.nCh);
        this.out = this.ctx.createChannelMerger(this.nCh);
        // Initialize analyzer buffers
        for (var i = 0; i < this.nCh; i++) {
            this.analysers[i] = this.ctx.createAnalyser();
            this.analysers[i].fftSize = this.fftSize;
            this.analysers[i].smoothingTimeConstant = 0;
            this.analBuffers[i] = new Float32Array(this.fftSize);
        }
        // Create connections
        for (var _i = 0; _i < this.nCh; _i++) {
            this.in.connect(this.out, _i, _i);
            this.in.connect(this.analysers[_i], _i, 0);
        }

        this.initialized = true;
    }

    (0, _createClass3.default)(HOA_analyser, [{
        key: "updateBuffers",
        value: function updateBuffers() {
            // Get latest time-domain data
            for (var i = 0; i < this.nCh; i++) {
                this.analysers[i].getFloatTimeDomainData(this.analBuffers[i]);
            }
        }
    }, {
        key: "computeIntensity",
        value: function computeIntensity() {
            // Compute correlations and energies of channels
            var iCh = new Array(this.nCh).fill(0); // intensity
            var corrCh = new Array(this.nCh).fill(0); // correlation
            var I_norm, E, Psi, azi, elev;
            // Accumulators for correlations and energies
            for (var i = 0; i < this.fftSize; i++) {
                for (var j = 0; j < this.nCh; j++) {

                    if (j == 0) {
                        corrCh[j] += 2 * this.analBuffers[j][i] * this.analBuffers[j][i];
                    } else {
                        corrCh[j] += this.analBuffers[j][i] * this.analBuffers[j][i];
                        iCh[j] += Math.sqrt(2) * this.analBuffers[0][i] * this.analBuffers[j][i];
                    }
                }
            }

            var summedInt = 0;
            var summedCorr = 0;
            for (var _i2 = 0; _i2 < iCh.length; _i2++) {
                if (_i2 != 0) summedInt += iCh[_i2] * iCh[_i2];
                summedCorr += corrCh[_i2];
            }

            // TO UPGRADE: for now the analyser only considers the first 4 channels
            // of the Ambisonic stream
            I_norm = Math.sqrt(summedInt); // intensity magnitude
            E = summedCorr / 2; // energy
            Psi = 1 - I_norm / (E + 10e-8); // diffuseness
            azi = Math.atan2(iCh[1], iCh[3]) * 180 / Math.PI;
            elev = Math.atan2(iCh[2], Math.sqrt(iCh[1] * iCh[1] + iCh[3] * iCh[3])) * 180 / Math.PI;
            var params = [azi, elev, Psi, E];
            return params;
        }
    }]);
    return HOA_analyser;
}();

exports.default = HOA_analyser;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFtYmktcG93ZXJtYXBBbmFseXNlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUFpQnFCLFk7QUFDakIsMEJBQVksUUFBWixFQUFzQixLQUF0QixFQUE2QjtBQUFBOztBQUN6QixhQUFLLFdBQUwsR0FBbUIsS0FBbkI7O0FBRUEsYUFBSyxHQUFMLEdBQVcsUUFBWDtBQUNBLGFBQUssS0FBTCxHQUFhLEtBQWI7QUFDQSxhQUFLLEdBQUwsR0FBVyxDQUFDLFFBQVEsQ0FBVCxLQUFlLFFBQVEsQ0FBdkIsQ0FBWDtBQUNBLGFBQUssT0FBTCxHQUFlLElBQWY7QUFDQSxhQUFLLFNBQUwsR0FBaUIsSUFBSSxLQUFKLENBQVUsS0FBSyxHQUFmLENBQWpCO0FBQ0EsYUFBSyxXQUFMLEdBQW1CLElBQUksS0FBSixDQUFVLEtBQUssR0FBZixDQUFuQjs7QUFFQSxhQUFLLEVBQUwsR0FBVSxLQUFLLEdBQUwsQ0FBUyxxQkFBVCxDQUErQixLQUFLLEdBQXBDLENBQVY7QUFDQSxhQUFLLEdBQUwsR0FBVyxLQUFLLEdBQUwsQ0FBUyxtQkFBVCxDQUE2QixLQUFLLEdBQWxDLENBQVg7O0FBRUEsYUFBSyxJQUFJLElBQUksQ0FBYixFQUFnQixJQUFJLEtBQUssR0FBekIsRUFBOEIsR0FBOUIsRUFBbUM7QUFDL0IsaUJBQUssU0FBTCxDQUFlLENBQWYsSUFBb0IsS0FBSyxHQUFMLENBQVMsY0FBVCxFQUFwQjtBQUNBLGlCQUFLLFNBQUwsQ0FBZSxDQUFmLEVBQWtCLE9BQWxCLEdBQTRCLEtBQUssT0FBakM7QUFDQSxpQkFBSyxTQUFMLENBQWUsQ0FBZixFQUFrQixxQkFBbEIsR0FBMEMsQ0FBMUM7QUFDQSxpQkFBSyxXQUFMLENBQWlCLENBQWpCLElBQXNCLElBQUksWUFBSixDQUFpQixLQUFLLE9BQXRCLENBQXRCO0FBQ0g7O0FBRUQsYUFBSyxJQUFJLEtBQUksQ0FBYixFQUFnQixLQUFJLEtBQUssR0FBekIsRUFBOEIsSUFBOUIsRUFBbUM7QUFDL0IsaUJBQUssRUFBTCxDQUFRLE9BQVIsQ0FBZ0IsS0FBSyxHQUFyQixFQUEwQixFQUExQixFQUE2QixFQUE3QjtBQUNBLGlCQUFLLEVBQUwsQ0FBUSxPQUFSLENBQWdCLEtBQUssU0FBTCxDQUFlLEVBQWYsQ0FBaEIsRUFBbUMsRUFBbkMsRUFBc0MsQ0FBdEM7QUFDSDs7QUFFRCxhQUFLLFdBQUwsR0FBbUIsSUFBbkI7QUFDSDs7Ozt3Q0FFZTs7QUFFWixpQkFBSyxJQUFJLElBQUksQ0FBYixFQUFnQixJQUFJLEtBQUssR0FBekIsRUFBOEIsR0FBOUIsRUFBbUM7QUFDL0IscUJBQUssU0FBTCxDQUFlLENBQWYsRUFBa0Isc0JBQWxCLENBQXlDLEtBQUssV0FBTCxDQUFpQixDQUFqQixDQUF6QztBQUNIO0FBQ0o7OzsyQ0FFa0I7O0FBRWYsZ0JBQUksTUFBTSxJQUFJLEtBQUosQ0FBVSxLQUFLLEdBQWYsRUFBb0IsSUFBcEIsQ0FBeUIsQ0FBekIsQ0FBVixDO0FBQ0EsZ0JBQUksU0FBUyxJQUFJLEtBQUosQ0FBVSxLQUFLLEdBQWYsRUFBb0IsSUFBcEIsQ0FBeUIsQ0FBekIsQ0FBYixDO0FBQ0EsZ0JBQUksTUFBSixFQUFZLENBQVosRUFBZSxHQUFmLEVBQW9CLEdBQXBCLEVBQXlCLElBQXpCOztBQUVBLGlCQUFLLElBQUksSUFBSSxDQUFiLEVBQWdCLElBQUksS0FBSyxPQUF6QixFQUFrQyxHQUFsQyxFQUF1QztBQUNuQyxxQkFBSyxJQUFJLElBQUksQ0FBYixFQUFnQixJQUFJLEtBQUssR0FBekIsRUFBOEIsR0FBOUIsRUFBbUM7O0FBRS9CLHdCQUFJLEtBQUcsQ0FBUCxFQUFVO0FBQ04sK0JBQU8sQ0FBUCxLQUFhLElBQUksS0FBSyxXQUFMLENBQWlCLENBQWpCLEVBQW9CLENBQXBCLENBQUosR0FBNkIsS0FBSyxXQUFMLENBQWlCLENBQWpCLEVBQW9CLENBQXBCLENBQTFDO0FBQ0gscUJBRkQsTUFHSztBQUNELCtCQUFPLENBQVAsS0FBYSxLQUFLLFdBQUwsQ0FBaUIsQ0FBakIsRUFBb0IsQ0FBcEIsSUFBeUIsS0FBSyxXQUFMLENBQWlCLENBQWpCLEVBQW9CLENBQXBCLENBQXRDO0FBQ0EsNEJBQUksQ0FBSixLQUFVLEtBQUssSUFBTCxDQUFVLENBQVYsSUFBZSxLQUFLLFdBQUwsQ0FBaUIsQ0FBakIsRUFBb0IsQ0FBcEIsQ0FBZixHQUF3QyxLQUFLLFdBQUwsQ0FBaUIsQ0FBakIsRUFBb0IsQ0FBcEIsQ0FBbEQ7QUFDSDtBQUNKO0FBQ0o7O0FBRUQsZ0JBQUksWUFBWSxDQUFoQjtBQUNBLGdCQUFJLGFBQWEsQ0FBakI7QUFDQSxpQkFBSyxJQUFJLE1BQUksQ0FBYixFQUFnQixNQUFJLElBQUksTUFBeEIsRUFBZ0MsS0FBaEMsRUFBcUM7QUFDakMsb0JBQUksT0FBSyxDQUFULEVBQVksYUFBYSxJQUFJLEdBQUosSUFBUyxJQUFJLEdBQUosQ0FBdEI7QUFDWiw4QkFBYyxPQUFPLEdBQVAsQ0FBZDtBQUNIOzs7O0FBSUQscUJBQVMsS0FBSyxJQUFMLENBQVUsU0FBVixDQUFULEM7QUFDQSxnQkFBSSxhQUFhLENBQWpCLEM7QUFDQSxrQkFBTSxJQUFJLFVBQVUsSUFBSSxLQUFkLENBQVYsQztBQUNBLGtCQUFNLEtBQUssS0FBTCxDQUFXLElBQUksQ0FBSixDQUFYLEVBQW1CLElBQUksQ0FBSixDQUFuQixJQUE2QixHQUE3QixHQUFtQyxLQUFLLEVBQTlDO0FBQ0EsbUJBQU8sS0FBSyxLQUFMLENBQVcsSUFBSSxDQUFKLENBQVgsRUFBbUIsS0FBSyxJQUFMLENBQVUsSUFBSSxDQUFKLElBQVMsSUFBSSxDQUFKLENBQVQsR0FBa0IsSUFBSSxDQUFKLElBQVMsSUFBSSxDQUFKLENBQXJDLENBQW5CLElBQW1FLEdBQW5FLEdBQXlFLEtBQUssRUFBckY7QUFDQSxnQkFBSSxTQUFTLENBQUMsR0FBRCxFQUFNLElBQU4sRUFBWSxHQUFaLEVBQWlCLENBQWpCLENBQWI7QUFDQSxtQkFBTyxNQUFQO0FBQ0g7Ozs7O2tCQXZFZ0IsWSIsImZpbGUiOiJhbWJpLXBvd2VybWFwQW5hbHlzZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gIEFyY2hvbnRpcyBQb2xpdGlzXG4vLyAgYXJjaG9udGlzLnBvbGl0aXNAYWFsdG8uZmlcbi8vICBEYXZpZCBQb2lyaWVyLVF1aW5vdFxuLy8gIGRhdmlwb2lyQGlyY2FtLmZyXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy9cbi8vICBXZWJBdWRpb19IT0EgYSBKYXZhU2NyaXB0IGxpYnJhcnkgZm9yIGhpZ2hlci1vcmRlciBBbWJpc29uaWNzXG4vLyAgVGhlIGxpYnJhcnkgaW1wbGVtZW50cyBXZWIgQXVkaW8gYmxvY2tzIHRoYXQgcGVyZm9ybVxuLy8gIHR5cGljYWwgYW1iaXNvbmljIHByb2Nlc3Npbmcgb3BlcmF0aW9ucyBvbiBhdWRpbyBzaWduYWxzLlxuLy9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLyogSE9BIElOVEVOU0lUWSBBTkFMWVpFUiAqL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEhPQV9hbmFseXNlciB7XG4gICAgY29uc3RydWN0b3IoYXVkaW9DdHgsIG9yZGVyKSB7XG4gICAgICAgIHRoaXMuaW5pdGlhbGl6ZWQgPSBmYWxzZTtcblxuICAgICAgICB0aGlzLmN0eCA9IGF1ZGlvQ3R4O1xuICAgICAgICB0aGlzLm9yZGVyID0gb3JkZXI7XG4gICAgICAgIHRoaXMubkNoID0gKG9yZGVyICsgMSkgKiAob3JkZXIgKyAxKTtcbiAgICAgICAgdGhpcy5mZnRTaXplID0gMjA0ODtcbiAgICAgICAgdGhpcy5hbmFseXNlcnMgPSBuZXcgQXJyYXkodGhpcy5uQ2gpO1xuICAgICAgICB0aGlzLmFuYWxCdWZmZXJzID0gbmV3IEFycmF5KHRoaXMubkNoKTtcbiAgICAgICAgLy8gSW5wdXQgYW5kIG91dHB1dCBub2Rlc1xuICAgICAgICB0aGlzLmluID0gdGhpcy5jdHguY3JlYXRlQ2hhbm5lbFNwbGl0dGVyKHRoaXMubkNoKTtcbiAgICAgICAgdGhpcy5vdXQgPSB0aGlzLmN0eC5jcmVhdGVDaGFubmVsTWVyZ2VyKHRoaXMubkNoKTtcbiAgICAgICAgLy8gSW5pdGlhbGl6ZSBhbmFseXplciBidWZmZXJzXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5uQ2g7IGkrKykge1xuICAgICAgICAgICAgdGhpcy5hbmFseXNlcnNbaV0gPSB0aGlzLmN0eC5jcmVhdGVBbmFseXNlcigpO1xuICAgICAgICAgICAgdGhpcy5hbmFseXNlcnNbaV0uZmZ0U2l6ZSA9IHRoaXMuZmZ0U2l6ZTtcbiAgICAgICAgICAgIHRoaXMuYW5hbHlzZXJzW2ldLnNtb290aGluZ1RpbWVDb25zdGFudCA9IDA7XG4gICAgICAgICAgICB0aGlzLmFuYWxCdWZmZXJzW2ldID0gbmV3IEZsb2F0MzJBcnJheSh0aGlzLmZmdFNpemUpO1xuICAgICAgICB9XG4gICAgICAgIC8vIENyZWF0ZSBjb25uZWN0aW9uc1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMubkNoOyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMuaW4uY29ubmVjdCh0aGlzLm91dCwgaSwgaSk7XG4gICAgICAgICAgICB0aGlzLmluLmNvbm5lY3QodGhpcy5hbmFseXNlcnNbaV0sIGksIDApO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5pbml0aWFsaXplZCA9IHRydWU7XG4gICAgfVxuXG4gICAgdXBkYXRlQnVmZmVycygpIHtcbiAgICAgICAgLy8gR2V0IGxhdGVzdCB0aW1lLWRvbWFpbiBkYXRhXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5uQ2g7IGkrKykge1xuICAgICAgICAgICAgdGhpcy5hbmFseXNlcnNbaV0uZ2V0RmxvYXRUaW1lRG9tYWluRGF0YSh0aGlzLmFuYWxCdWZmZXJzW2ldKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGNvbXB1dGVJbnRlbnNpdHkoKSB7XG4gICAgICAgIC8vIENvbXB1dGUgY29ycmVsYXRpb25zIGFuZCBlbmVyZ2llcyBvZiBjaGFubmVsc1xuICAgICAgICB2YXIgaUNoID0gbmV3IEFycmF5KHRoaXMubkNoKS5maWxsKDApOyAvLyBpbnRlbnNpdHlcbiAgICAgICAgdmFyIGNvcnJDaCA9IG5ldyBBcnJheSh0aGlzLm5DaCkuZmlsbCgwKTsgLy8gY29ycmVsYXRpb25cbiAgICAgICAgdmFyIElfbm9ybSwgRSwgUHNpLCBhemksIGVsZXY7XG4gICAgICAgIC8vIEFjY3VtdWxhdG9ycyBmb3IgY29ycmVsYXRpb25zIGFuZCBlbmVyZ2llc1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuZmZ0U2l6ZTsgaSsrKSB7XG4gICAgICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHRoaXMubkNoOyBqKyspIHtcblxuICAgICAgICAgICAgICAgIGlmIChqPT0wKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvcnJDaFtqXSArPSAyICogdGhpcy5hbmFsQnVmZmVyc1tqXVtpXSAqIHRoaXMuYW5hbEJ1ZmZlcnNbal1baV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjb3JyQ2hbal0gKz0gdGhpcy5hbmFsQnVmZmVyc1tqXVtpXSAqIHRoaXMuYW5hbEJ1ZmZlcnNbal1baV07XG4gICAgICAgICAgICAgICAgICAgIGlDaFtqXSArPSBNYXRoLnNxcnQoMikgKiB0aGlzLmFuYWxCdWZmZXJzWzBdW2ldICogdGhpcy5hbmFsQnVmZmVyc1tqXVtpXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgc3VtbWVkSW50ID0gMDtcbiAgICAgICAgbGV0IHN1bW1lZENvcnIgPSAwO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGlDaC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKGkgIT0gMCkgc3VtbWVkSW50ICs9IGlDaFtpXSAqIGlDaFtpXTtcbiAgICAgICAgICAgIHN1bW1lZENvcnIgKz0gY29yckNoW2ldO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVE8gVVBHUkFERTogZm9yIG5vdyB0aGUgYW5hbHlzZXIgb25seSBjb25zaWRlcnMgdGhlIGZpcnN0IDQgY2hhbm5lbHNcbiAgICAgICAgLy8gb2YgdGhlIEFtYmlzb25pYyBzdHJlYW1cbiAgICAgICAgSV9ub3JtID0gTWF0aC5zcXJ0KHN1bW1lZEludCk7IC8vIGludGVuc2l0eSBtYWduaXR1ZGVcbiAgICAgICAgRSA9IHN1bW1lZENvcnIgLyAyOyAvLyBlbmVyZ3lcbiAgICAgICAgUHNpID0gMSAtIElfbm9ybSAvIChFICsgMTBlLTgpOyAvLyBkaWZmdXNlbmVzc1xuICAgICAgICBhemkgPSBNYXRoLmF0YW4yKGlDaFsxXSwgaUNoWzNdKSAqIDE4MCAvIE1hdGguUEk7XG4gICAgICAgIGVsZXYgPSBNYXRoLmF0YW4yKGlDaFsyXSwgTWF0aC5zcXJ0KGlDaFsxXSAqIGlDaFsxXSArIGlDaFszXSAqIGlDaFszXSkpICogMTgwIC8gTWF0aC5QSTtcbiAgICAgICAgdmFyIHBhcmFtcyA9IFthemksIGVsZXYsIFBzaSwgRV07XG4gICAgICAgIHJldHVybiBwYXJhbXM7XG4gICAgfVxufVxuIl19