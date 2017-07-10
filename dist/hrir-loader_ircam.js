'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _serveSofaHrir = require('serve-sofa-hrir');

var serveSofaHrir = _interopRequireWildcard(_serveSofaHrir);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var utils = require("./utils.js"); ////////////////////////////////////////////////////////////////////
//  Archontis Politis (Aalto University)
//  archontis.politis@aalto.fi
//  David Poirier-Quinot (IRCAM)
//  davipoir@ircam.fr
////////////////////////////////////////////////////////////////////
//
//  JSAmbisonics a JavaScript library for higher-order Ambisonics
//  The library implements Web Audio blocks that perform
//  typical ambisonic processing operations on audio signals.
//
////////////////////////////////////////////////////////////////////

/////////////////
/* HRIR LOADER */
/////////////////

var HRIRloader_ircam = function () {
    function HRIRloader_ircam(context, order, callback) {
        (0, _classCallCheck3.default)(this, HRIRloader_ircam);

        this.context = context;
        this.order = order;
        this.nCh = (order + 1) * (order + 1);

        // fonction called when filters loaded
        this.onLoad = callback;

        // instantiate hrtfset from serve-sofa-hrtf lib
        this.hrtfSet = new serveSofaHrir.HrtfSet({ audioContext: this.context, coordinateSystem: 'sofaSpherical' });

        // define required speakers (hence hrirs) positions based on Ambisonic order
        this.wishedSpeakerPos = utils.getTdesign(2 * this.order);
    }

    (0, _createClass3.default)(HRIRloader_ircam, [{
        key: 'load',
        value: function load(setUrl) {
            var _this = this;

            this.hrtfSet.load(setUrl).then(function () {

                // extract hrir buffers of interest from the database
                var grantedFilterPos = [];
                _this.hrirBuffer = [];
                for (var i = 0; i < _this.wishedSpeakerPos.length; i++) {
                    // get available positions (in the db) nearest from the required speakers positions
                    grantedFilterPos.push(_this.hrtfSet.nearest(_this.wishedSpeakerPos[i]).position);
                    // get related hrir
                    _this.hrirBuffer.push(_this.hrtfSet.nearest(_this.wishedSpeakerPos[i]).fir);
                }

                // DEBUG //////////////////////////////////////////////////////
                // compare required vs. present positions in HRIR filter
                var angularDistDeg = 0;
                for (var _i = 0; _i < _this.wishedSpeakerPos.length; _i++) {
                    if (_this.wishedSpeakerPos[_i][0] < 0) _this.wishedSpeakerPos[_i][0] += 360.0;
                    angularDistDeg += Math.sqrt(Math.pow(_this.wishedSpeakerPos[_i][0] - grantedFilterPos[_i][0], 2) + Math.pow(_this.wishedSpeakerPos[_i][1] - grantedFilterPos[_i][1], 2));
                    // console.log('asked / granted pos: ', this.wishedSpeakerPos[i], '/', grantedFilterPos[i]);
                }
                console.log('summed / average angular dist between asked and present pos:', Math.round(angularDistDeg * 100) / 100, 'deg /', Math.round(angularDistDeg / _this.wishedSpeakerPos.length * 100) / 100, 'deg');
                // DEBUG END //////////////////////////////////////////////////

                // get decoding matrix
                _this.decodingMatrix = utils.getAmbisonicDecMtx(grantedFilterPos, _this.order);

                // convert hrir filters to hoa filters
                _this.hoaBuffer = _this.getHoaFilterFromHrirFilter();

                // pass resulting hoa filters to user callback
                _this.onLoad(_this.hoaBuffer);
            });
        }
    }, {
        key: 'getHoaFilterFromHrirFilter',
        value: function getHoaFilterFromHrirFilter() {
            // create empty buffer ready to receive hoa filters
            var hrirBufferLength = this.hrirBuffer[0].length; // assuming they all have the same
            var hrirBufferSampleRate = this.hrirBuffer[0].sampleRate; // same
            var hoaBuffer = this.context.createBuffer(this.nCh, hrirBufferLength, hrirBufferSampleRate);

            // sum weighted HRIR over Ambisonic channels to create HOA IRs
            for (var i = 0; i < this.nCh; i++) {
                var concatBufferArrayLeft = new Float32Array(hrirBufferLength);
                for (var j = 0; j < this.hrirBuffer.length; j++) {
                    for (var k = 0; k < hrirBufferLength; k++) {
                        concatBufferArrayLeft[k] += this.decodingMatrix[j][i] * this.hrirBuffer[j].getChannelData(0)[k];
                    }
                }
                hoaBuffer.getChannelData(i).set(concatBufferArrayLeft);
            }

            return hoaBuffer;
        }
    }]);
    return HRIRloader_ircam;
}();

exports.default = HRIRloader_ircam;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImhyaXItbG9hZGVyX2lyY2FtLmpzIl0sIm5hbWVzIjpbInNlcnZlU29mYUhyaXIiLCJ1dGlscyIsInJlcXVpcmUiLCJIUklSbG9hZGVyX2lyY2FtIiwiY29udGV4dCIsIm9yZGVyIiwiY2FsbGJhY2siLCJuQ2giLCJvbkxvYWQiLCJocnRmU2V0IiwiSHJ0ZlNldCIsImF1ZGlvQ29udGV4dCIsImNvb3JkaW5hdGVTeXN0ZW0iLCJ3aXNoZWRTcGVha2VyUG9zIiwiZ2V0VGRlc2lnbiIsInNldFVybCIsImxvYWQiLCJ0aGVuIiwiZ3JhbnRlZEZpbHRlclBvcyIsImhyaXJCdWZmZXIiLCJpIiwibGVuZ3RoIiwicHVzaCIsIm5lYXJlc3QiLCJwb3NpdGlvbiIsImZpciIsImFuZ3VsYXJEaXN0RGVnIiwiTWF0aCIsInNxcnQiLCJwb3ciLCJjb25zb2xlIiwibG9nIiwicm91bmQiLCJkZWNvZGluZ01hdHJpeCIsImdldEFtYmlzb25pY0RlY010eCIsImhvYUJ1ZmZlciIsImdldEhvYUZpbHRlckZyb21IcmlyRmlsdGVyIiwiaHJpckJ1ZmZlckxlbmd0aCIsImhyaXJCdWZmZXJTYW1wbGVSYXRlIiwic2FtcGxlUmF0ZSIsImNyZWF0ZUJ1ZmZlciIsImNvbmNhdEJ1ZmZlckFycmF5TGVmdCIsIkZsb2F0MzJBcnJheSIsImoiLCJrIiwiZ2V0Q2hhbm5lbERhdGEiLCJzZXQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7O0FBaUJBOztJQUFZQSxhOzs7Ozs7QUFDWixJQUFJQyxRQUFRQyxRQUFRLFlBQVIsQ0FBWixDLENBbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0lBS3FCQyxnQjtBQUNqQiw4QkFBWUMsT0FBWixFQUFxQkMsS0FBckIsRUFBNEJDLFFBQTVCLEVBQXNDO0FBQUE7O0FBQ2xDLGFBQUtGLE9BQUwsR0FBZUEsT0FBZjtBQUNBLGFBQUtDLEtBQUwsR0FBYUEsS0FB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LENBQTBCLEtBQUtqQyxHQUEvQixFQUFvQzhCLGdCQUFwQyxFQUFzREMsb0JBQXRELENBQWhCOztBQUVBO0FBQ0EsaUJBQUssSUFBSWxCLElBQUksQ0FBYixFQUFnQkEsSUFBSSxLQUFLYixHQUF6QixFQUE4QmEsR0FBOUIsRUFBbUM7QUFDL0Isb0JBQUlxQix3QkFBd0IsSUFBSUMsWUFBSixDQUFpQkwsZ0JBQWpCLENBQTVCO0FBQ0EscUJBQUssSUFBSU0sSUFBSSxDQUFiLEVBQWdCQSxJQUFJLEtBQUt4QixVQUFMLENBQWdCRSxNQUFwQyxFQUE0Q3NCLEdBQTVDLEVBQWlEO0FBQzdDLHlCQUFLLElBQUlDLElBQUksQ0FBYixFQUFnQkEsSUFBSVAsZ0JBQXBCLEVBQXNDTyxHQUF0QyxFQUEyQztBQUN2Q0gsOENBQXNCRyxDQUF0QixLQUE0QixLQUFLWCxjQUFMLENBQW9CVSxDQUFwQixFQUF1QnZCLENBQXZCLElBQTRCLEtBQUtELFVBQUwsQ0FBZ0J3QixDQUFoQixFQUFtQkUsY0FBbkIsQ0FBa0MsQ0FBbEMsRUFBcUNELENBQXJDLENBQXhEO0FBQ0g7QUFDSjtBQUNEVCwwQkFBVVUsY0FBVixDQUF5QnpCLENBQXpCLEVBQTRCMEIsR0FBNUIsQ0FBZ0NMLHFCQUFoQztBQUNIOztBQUVELG1CQUFPTixTQUFQO0FBQ0g7Ozs7O2tCQTFFZ0JoQyxnQiIsImZpbGUiOiJocmlyLWxvYWRlcl9pcmNhbS5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyAgQXJjaG9udGlzIFBvbGl0aXMgKEFhbHRvIFVuaXZlcnNpdHkpXG4vLyAgYXJjaG9udGlzLnBvbGl0aXNAYWFsdG8uZmlcbi8vICBEYXZpZCBQb2lyaWVyLVF1aW5vdCAoSVJDQU0pXG4vLyAgZGF2aXBvaXJAaXJjYW0uZnJcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vL1xuLy8gIEpTQW1iaXNvbmljcyBhIEphdmFTY3JpcHQgbGlicmFyeSBmb3IgaGlnaGVyLW9yZGVyIEFtYmlzb25pY3Ncbi8vICBUaGUgbGlicmFyeSBpbXBsZW1lbnRzIFdlYiBBdWRpbyBibG9ja3MgdGhhdCBwZXJmb3JtXG4vLyAgdHlwaWNhbCBhbWJpc29uaWMgcHJvY2Vzc2luZyBvcGVyYXRpb25zIG9uIGF1ZGlvIHNpZ25hbHMuXG4vL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLy8vLy8vLy8vLy8vLy8vLy9cbi8qIEhSSVIgTE9BREVSICovXG4vLy8vLy8vLy8vLy8vLy8vL1xuXG5pbXBvcnQgKiBhcyBzZXJ2ZVNvZmFIcmlyIGZyb20gJ3NlcnZlLXNvZmEtaHJpcic7XG52YXIgdXRpbHMgPSByZXF1aXJlKFwiLi91dGlscy5qc1wiKTtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgSFJJUmxvYWRlcl9pcmNhbSB7XG4gICAgY29uc3RydWN0b3IoY29udGV4dCwgb3JkZXIsIGNhbGxiYWNrKSB7XG4gICAgICAgIHRoaXMuY29udGV4dCA9IGNvbnRleHQ7XG4gICAgICAgIHRoaXMub3JkZXIgPSBvcmRlcjtcbiAgICAgICAgdGhpcy5uQ2ggPSAob3JkZXIgKyAxKSAqIChvcmRlciArIDEpO1xuXG4gICAgICAgIC8vIGZvbmN0aW9uIGNhbGxlZCB3aGVuIGZpbHRlcnMgbG9hZGVkXG4gICAgICAgIHRoaXMub25Mb2FkID0gY2FsbGJhY2s7XG5cbiAgICAgICAgLy8gaW5zdGFudGlhdGUgaHJ0ZnNldCBmcm9tIHNlcnZlLXNvZmEtaHJ0ZiBsaWJcbiAgICAgICAgdGhpcy5ocnRmU2V0ID0gbmV3IHNlcnZlU29mYUhyaXIuSHJ0ZlNldCh7IGF1ZGlvQ29udGV4dDp0aGlzLmNvbnRleHQsIGNvb3JkaW5hdGVTeXN0ZW06J3NvZmFTcGhlcmljYWwnIH0pO1xuXG4gICAgICAgIC8vIGRlZmluZSByZXF1aXJlZCBzcGVha2VycyAoaGVuY2UgaHJpcnMpIHBvc2l0aW9ucyBiYXNlZCBvbiBBbWJpc29uaWMgb3JkZXJcbiAgICAgICAgdGhpcy53aXNoZWRTcGVha2VyUG9zID0gdXRpbHMuZ2V0VGRlc2lnbigyKnRoaXMub3JkZXIpO1xuICAgIH1cblxuICAgIGxvYWQoc2V0VXJsKSB7XG5cbiAgICAgICAgdGhpcy5ocnRmU2V0LmxvYWQoc2V0VXJsKS50aGVuKCAoKSA9PiB7XG5cbiAgICAgICAgICAgIC8vIGV4dHJhY3QgaHJpciBidWZmZXJzIG9mIGludGVyZXN0IGZyb20gdGhlIGRhdGFiYXNlXG4gICAgICAgICAgICBsZXQgZ3JhbnRlZEZpbHRlclBvcyA9IFtdO1xuICAgICAgICAgICAgdGhpcy5ocmlyQnVmZmVyID0gW107XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMud2lzaGVkU3BlYWtlclBvcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIC8vIGdldCBhdmFpbGFibGUgcG9zaXRpb25zIChpbiB0aGUgZGIpIG5lYXJlc3QgZnJvbSB0aGUgcmVxdWlyZWQgc3BlYWtlcnMgcG9zaXRpb25zXG4gICAgICAgICAgICAgICAgZ3JhbnRlZEZpbHRlclBvcy5wdXNoKHRoaXMuaHJ0ZlNldC5uZWFyZXN0KHRoaXMud2lzaGVkU3BlYWtlclBvc1tpXSkucG9zaXRpb24pO1xuICAgICAgICAgICAgICAgIC8vIGdldCByZWxhdGVkIGhyaXJcbiAgICAgICAgICAgICAgICB0aGlzLmhyaXJCdWZmZXIucHVzaCh0aGlzLmhydGZTZXQubmVhcmVzdCh0aGlzLndpc2hlZFNwZWFrZXJQb3NbaV0pLmZpcik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIERFQlVHIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAgICAgICAgICAgLy8gY29tcGFyZSByZXF1aXJlZCB2cy4gcHJlc2VudCBwb3NpdGlvbnMgaW4gSFJJUiBmaWx0ZXJcbiAgICAgICAgICAgIGxldCBhbmd1bGFyRGlzdERlZyA9IDA7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMud2lzaGVkU3BlYWtlclBvcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLndpc2hlZFNwZWFrZXJQb3NbaV1bMF0gPCAwKSB0aGlzLndpc2hlZFNwZWFrZXJQb3NbaV1bMF0gKz0gMzYwLjA7XG4gICAgICAgICAgICAgICAgYW5ndWxhckRpc3REZWcgKz0gTWF0aC5zcXJ0KFxuICAgICAgICAgICAgICAgICAgICBNYXRoLnBvdyh0aGlzLndpc2hlZFNwZWFrZXJQb3NbaV1bMF0gLSBncmFudGVkRmlsdGVyUG9zW2ldWzBdLCAyKSArXG4gICAgICAgICAgICAgICAgICAgIE1hdGgucG93KHRoaXMud2lzaGVkU3BlYWtlclBvc1tpXVsxXSAtIGdyYW50ZWRGaWx0ZXJQb3NbaV1bMV0sIDIpKTtcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZygnYXNrZWQgLyBncmFudGVkIHBvczogJywgdGhpcy53aXNoZWRTcGVha2VyUG9zW2ldLCAnLycsIGdyYW50ZWRGaWx0ZXJQb3NbaV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc29sZS5sb2coJ3N1bW1lZCAvIGF2ZXJhZ2UgYW5ndWxhciBkaXN0IGJldHdlZW4gYXNrZWQgYW5kIHByZXNlbnQgcG9zOicsXG4gICAgICAgICAgICAgICAgTWF0aC5yb3VuZChhbmd1bGFyRGlzdERlZyoxMDApLzEwMCwgJ2RlZyAvJyxcbiAgICAgICAgICAgICAgICBNYXRoLnJvdW5kKCAoYW5ndWxhckRpc3REZWcvdGhpcy53aXNoZWRTcGVha2VyUG9zLmxlbmd0aCkgKjEwMCkvMTAwLCAnZGVnJyk7XG4gICAgICAgICAgICAvLyBERUJVRyBFTkQgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuICAgICAgICAgICAgLy8gZ2V0IGRlY29kaW5nIG1hdHJpeFxuICAgICAgICAgICAgdGhpcy5kZWNvZGluZ01hdHJpeCA9IHV0aWxzLmdldEFtYmlzb25pY0RlY010eChncmFudGVkRmlsdGVyUG9zLCB0aGlzLm9yZGVyKTtcblxuICAgICAgICAgICAgLy8gY29udmVydCBocmlyIGZpbHRlcnMgdG8gaG9hIGZpbHRlcnNcbiAgICAgICAgICAgIHRoaXMuaG9hQnVmZmVyID0gdGhpcy5nZXRIb2FGaWx0ZXJGcm9tSHJpckZpbHRlcigpO1xuXG4gICAgICAgICAgICAvLyBwYXNzIHJlc3VsdGluZyBob2EgZmlsdGVycyB0byB1c2VyIGNhbGxiYWNrXG4gICAgICAgICAgICB0aGlzLm9uTG9hZCh0aGlzLmhvYUJ1ZmZlcik7XG4gICAgICAgIH0pXG4gICAgfVxuXG4gICAgZ2V0SG9hRmlsdGVyRnJvbUhyaXJGaWx0ZXIoKSB7XG4gICAgICAgIC8vIGNyZWF0ZSBlbXB0eSBidWZmZXIgcmVhZHkgdG8gcmVjZWl2ZSBob2EgZmlsdGVyc1xuICAgICAgICBsZXQgaHJpckJ1ZmZlckxlbmd0aCA9IHRoaXMuaHJpckJ1ZmZlclswXS5sZW5ndGg7IC8vIGFzc3VtaW5nIHRoZXkgYWxsIGhhdmUgdGhlIHNhbWVcbiAgICAgICAgbGV0IGhyaXJCdWZmZXJTYW1wbGVSYXRlID0gdGhpcy5ocmlyQnVmZmVyWzBdLnNhbXBsZVJhdGU7IC8vIHNhbWVcbiAgICAgICAgbGV0IGhvYUJ1ZmZlciA9IHRoaXMuY29udGV4dC5jcmVhdGVCdWZmZXIodGhpcy5uQ2gsIGhyaXJCdWZmZXJMZW5ndGgsIGhyaXJCdWZmZXJTYW1wbGVSYXRlKTtcblxuICAgICAgICAvLyBzdW0gd2VpZ2h0ZWQgSFJJUiBvdmVyIEFtYmlzb25pYyBjaGFubmVscyB0byBjcmVhdGUgSE9BIElSc1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMubkNoOyBpKyspIHtcbiAgICAgICAgICAgIGxldCBjb25jYXRCdWZmZXJBcnJheUxlZnQgPSBuZXcgRmxvYXQzMkFycmF5KGhyaXJCdWZmZXJMZW5ndGgpO1xuICAgICAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCB0aGlzLmhyaXJCdWZmZXIubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBrID0gMDsgayA8IGhyaXJCdWZmZXJMZW5ndGg7IGsrKykge1xuICAgICAgICAgICAgICAgICAgICBjb25jYXRCdWZmZXJBcnJheUxlZnRba10gKz0gdGhpcy5kZWNvZGluZ01hdHJpeFtqXVtpXSAqIHRoaXMuaHJpckJ1ZmZlcltqXS5nZXRDaGFubmVsRGF0YSgwKVtrXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBob2FCdWZmZXIuZ2V0Q2hhbm5lbERhdGEoaSkuc2V0KGNvbmNhdEJ1ZmZlckFycmF5TGVmdCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gaG9hQnVmZmVyO1xuICAgIH1cblxufVxuIl19