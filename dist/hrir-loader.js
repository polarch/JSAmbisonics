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

var HRIRloader = function () {
    function HRIRloader(context, order, callback) {
        (0, _classCallCheck3.default)(this, HRIRloader);

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

    (0, _createClass3.default)(HRIRloader, [{
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
    return HRIRloader;
}();

exports.default = HRIRloader;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImhyaXItbG9hZGVyLmpzIl0sIm5hbWVzIjpbInNlcnZlU29mYUhyaXIiLCJ1dGlscyIsInJlcXVpcmUiLCJIUklSbG9hZGVyIiwiY29udGV4dCIsIm9yZGVyIiwiY2FsbGJhY2siLCJuQ2giLCJvbkxvYWQiLCJocnRmU2V0IiwiSHJ0ZlNldCIsImF1ZGlvQ29udGV4dCIsImNvb3JkaW5hdGVTeXN0ZW0iLCJ3aXNoZWRTcGVha2VyUG9zIiwiZ2V0VGRlc2lnbiIsInNldFVybCIsImxvYWQiLCJ0aGVuIiwiZ3JhbnRlZEZpbHRlclBvcyIsImhyaXJCdWZmZXIiLCJpIiwibGVuZ3RoIiwicHVzaCIsIm5lYXJlc3QiLCJwb3NpdGlvbiIsImZpciIsImFuZ3VsYXJEaXN0RGVnIiwiTWF0aCIsInNxcnQiLCJwb3ciLCJjb25zb2xlIiwibG9nIiwicm91bmQiLCJkZWNvZGluZ01hdHJpeCIsImdldEFtYmlzb25pY0RlY010eCIsImhvYUJ1ZmZlciIsImdldEhvYUZpbHRlckZyb21IcmlyRmlsdGVyIiwiaHJpckJ1ZmZlckxlbmd0aCIsImhyaXJCdWZmZXJTYW1wbGVSYXRlIiwic2FtcGxlUmF0ZSIsImNyZWF0ZUJ1ZmZlciIsImNvbmNhdEJ1ZmZlckFycmF5TGVmdCIsIkZsb2F0MzJBcnJheSIsImoiLCJrIiwiZ2V0Q2hhbm5lbERhdGEiLCJzZXQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7O0FBaUJBOztJQUFZQSxhOzs7Ozs7QUFDWixJQUFJQyxRQUFRQyxRQUFRLFlBQVIsQ0FBWixDLENBbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0lBS3FCQyxVO0FBQ2pCLHdCQUFZQyxPQUFaLEVBQXFCQyxLQUFyQixFQUE0QkMsUUFBNUIsRUFBc0M7QUFBQTs7QUFDbEMsYUFBS0YsT0FBTCxHQUFlQSxPQUFmO0FBQ0EsYUFBS0MsS0FBTCxHQUFhQSxLQUFiO0FBQ0EsYUFBS0Us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LEdBQS9CLEVBQW9DOEIsZ0JBQXBDLEVBQXNEQyxvQkFBdEQsQ0FBaEI7O0FBRUE7QUFDQSxpQkFBSyxJQUFJbEIsSUFBSSxDQUFiLEVBQWdCQSxJQUFJLEtBQUtiLEdBQXpCLEVBQThCYSxHQUE5QixFQUFtQztBQUMvQixvQkFBSXFCLHdCQUF3QixJQUFJQyxZQUFKLENBQWlCTCxnQkFBakIsQ0FBNUI7QUFDQSxxQkFBSyxJQUFJTSxJQUFJLENBQWIsRUFBZ0JBLElBQUksS0FBS3hCLFVBQUwsQ0FBZ0JFLE1BQXBDLEVBQTRDc0IsR0FBNUMsRUFBaUQ7QUFDN0MseUJBQUssSUFBSUMsSUFBSSxDQUFiLEVBQWdCQSxJQUFJUCxnQkFBcEIsRUFBc0NPLEdBQXRDLEVBQTJDO0FBQ3ZDSCw4Q0FBc0JHLENBQXRCLEtBQTRCLEtBQUtYLGNBQUwsQ0FBb0JVLENBQXBCLEVBQXVCdkIsQ0FBdkIsSUFBNEIsS0FBS0QsVUFBTCxDQUFnQndCLENBQWhCLEVBQW1CRSxjQUFuQixDQUFrQyxDQUFsQyxFQUFxQ0QsQ0FBckMsQ0FBeEQ7QUFDSDtBQUNKO0FBQ0RULDBCQUFVVSxjQUFWLENBQXlCekIsQ0FBekIsRUFBNEIwQixHQUE1QixDQUFnQ0wscUJBQWhDO0FBQ0g7O0FBRUQsbUJBQU9OLFNBQVA7QUFDSDs7Ozs7a0JBMUVnQmhDLFUiLCJmaWxlIjoiaHJpci1sb2FkZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gIEFyY2hvbnRpcyBQb2xpdGlzIChBYWx0byBVbml2ZXJzaXR5KVxuLy8gIGFyY2hvbnRpcy5wb2xpdGlzQGFhbHRvLmZpXG4vLyAgRGF2aWQgUG9pcmllci1RdWlub3QgKElSQ0FNKVxuLy8gIGRhdmlwb2lyQGlyY2FtLmZyXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy9cbi8vICBKU0FtYmlzb25pY3MgYSBKYXZhU2NyaXB0IGxpYnJhcnkgZm9yIGhpZ2hlci1vcmRlciBBbWJpc29uaWNzXG4vLyAgVGhlIGxpYnJhcnkgaW1wbGVtZW50cyBXZWIgQXVkaW8gYmxvY2tzIHRoYXQgcGVyZm9ybVxuLy8gIHR5cGljYWwgYW1iaXNvbmljIHByb2Nlc3Npbmcgb3BlcmF0aW9ucyBvbiBhdWRpbyBzaWduYWxzLlxuLy9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbi8vLy8vLy8vLy8vLy8vLy8vXG4vKiBIUklSIExPQURFUiAqL1xuLy8vLy8vLy8vLy8vLy8vLy9cblxuaW1wb3J0ICogYXMgc2VydmVTb2ZhSHJpciBmcm9tICdzZXJ2ZS1zb2ZhLWhyaXInO1xudmFyIHV0aWxzID0gcmVxdWlyZShcIi4vdXRpbHMuanNcIik7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEhSSVJsb2FkZXIge1xuICAgIGNvbnN0cnVjdG9yKGNvbnRleHQsIG9yZGVyLCBjYWxsYmFjaykge1xuICAgICAgICB0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xuICAgICAgICB0aGlzLm9yZGVyID0gb3JkZXI7XG4gICAgICAgIHRoaXMubkNoID0gKG9yZGVyICsgMSkgKiAob3JkZXIgKyAxKTtcblxuICAgICAgICAvLyBmb25jdGlvbiBjYWxsZWQgd2hlbiBmaWx0ZXJzIGxvYWRlZFxuICAgICAgICB0aGlzLm9uTG9hZCA9IGNhbGxiYWNrO1xuXG4gICAgICAgIC8vIGluc3RhbnRpYXRlIGhydGZzZXQgZnJvbSBzZXJ2ZS1zb2ZhLWhydGYgbGliXG4gICAgICAgIHRoaXMuaHJ0ZlNldCA9IG5ldyBzZXJ2ZVNvZmFIcmlyLkhydGZTZXQoeyBhdWRpb0NvbnRleHQ6dGhpcy5jb250ZXh0LCBjb29yZGluYXRlU3lzdGVtOidzb2ZhU3BoZXJpY2FsJyB9KTtcblxuICAgICAgICAvLyBkZWZpbmUgcmVxdWlyZWQgc3BlYWtlcnMgKGhlbmNlIGhyaXJzKSBwb3NpdGlvbnMgYmFzZWQgb24gQW1iaXNvbmljIG9yZGVyXG4gICAgICAgIHRoaXMud2lzaGVkU3BlYWtlclBvcyA9IHV0aWxzLmdldFRkZXNpZ24oMip0aGlzLm9yZGVyKTtcbiAgICB9XG5cbiAgICBsb2FkKHNldFVybCkge1xuXG4gICAgICAgIHRoaXMuaHJ0ZlNldC5sb2FkKHNldFVybCkudGhlbiggKCkgPT4ge1xuXG4gICAgICAgICAgICAvLyBleHRyYWN0IGhyaXIgYnVmZmVycyBvZiBpbnRlcmVzdCBmcm9tIHRoZSBkYXRhYmFzZVxuICAgICAgICAgICAgbGV0IGdyYW50ZWRGaWx0ZXJQb3MgPSBbXTtcbiAgICAgICAgICAgIHRoaXMuaHJpckJ1ZmZlciA9IFtdO1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLndpc2hlZFNwZWFrZXJQb3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAvLyBnZXQgYXZhaWxhYmxlIHBvc2l0aW9ucyAoaW4gdGhlIGRiKSBuZWFyZXN0IGZyb20gdGhlIHJlcXVpcmVkIHNwZWFrZXJzIHBvc2l0aW9uc1xuICAgICAgICAgICAgICAgIGdyYW50ZWRGaWx0ZXJQb3MucHVzaCh0aGlzLmhydGZTZXQubmVhcmVzdCh0aGlzLndpc2hlZFNwZWFrZXJQb3NbaV0pLnBvc2l0aW9uKTtcbiAgICAgICAgICAgICAgICAvLyBnZXQgcmVsYXRlZCBocmlyXG4gICAgICAgICAgICAgICAgdGhpcy5ocmlyQnVmZmVyLnB1c2godGhpcy5ocnRmU2V0Lm5lYXJlc3QodGhpcy53aXNoZWRTcGVha2VyUG9zW2ldKS5maXIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBERUJVRyAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICAgICAgICAgIC8vIGNvbXBhcmUgcmVxdWlyZWQgdnMuIHByZXNlbnQgcG9zaXRpb25zIGluIEhSSVIgZmlsdGVyXG4gICAgICAgICAgICBsZXQgYW5ndWxhckRpc3REZWcgPSAwO1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLndpc2hlZFNwZWFrZXJQb3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy53aXNoZWRTcGVha2VyUG9zW2ldWzBdIDwgMCkgdGhpcy53aXNoZWRTcGVha2VyUG9zW2ldWzBdICs9IDM2MC4wO1xuICAgICAgICAgICAgICAgIGFuZ3VsYXJEaXN0RGVnICs9IE1hdGguc3FydChcbiAgICAgICAgICAgICAgICAgICAgTWF0aC5wb3codGhpcy53aXNoZWRTcGVha2VyUG9zW2ldWzBdIC0gZ3JhbnRlZEZpbHRlclBvc1tpXVswXSwgMikgK1xuICAgICAgICAgICAgICAgICAgICBNYXRoLnBvdyh0aGlzLndpc2hlZFNwZWFrZXJQb3NbaV1bMV0gLSBncmFudGVkRmlsdGVyUG9zW2ldWzFdLCAyKSk7XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coJ2Fza2VkIC8gZ3JhbnRlZCBwb3M6ICcsIHRoaXMud2lzaGVkU3BlYWtlclBvc1tpXSwgJy8nLCBncmFudGVkRmlsdGVyUG9zW2ldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdzdW1tZWQgLyBhdmVyYWdlIGFuZ3VsYXIgZGlzdCBiZXR3ZWVuIGFza2VkIGFuZCBwcmVzZW50IHBvczonLFxuICAgICAgICAgICAgICAgIE1hdGgucm91bmQoYW5ndWxhckRpc3REZWcqMTAwKS8xMDAsICdkZWcgLycsXG4gICAgICAgICAgICAgICAgTWF0aC5yb3VuZCggKGFuZ3VsYXJEaXN0RGVnL3RoaXMud2lzaGVkU3BlYWtlclBvcy5sZW5ndGgpICoxMDApLzEwMCwgJ2RlZycpO1xuICAgICAgICAgICAgLy8gREVCVUcgRU5EIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbiAgICAgICAgICAgIC8vIGdldCBkZWNvZGluZyBtYXRyaXhcbiAgICAgICAgICAgIHRoaXMuZGVjb2RpbmdNYXRyaXggPSB1dGlscy5nZXRBbWJpc29uaWNEZWNNdHgoZ3JhbnRlZEZpbHRlclBvcywgdGhpcy5vcmRlcik7XG5cbiAgICAgICAgICAgIC8vIGNvbnZlcnQgaHJpciBmaWx0ZXJzIHRvIGhvYSBmaWx0ZXJzXG4gICAgICAgICAgICB0aGlzLmhvYUJ1ZmZlciA9IHRoaXMuZ2V0SG9hRmlsdGVyRnJvbUhyaXJGaWx0ZXIoKTtcblxuICAgICAgICAgICAgLy8gcGFzcyByZXN1bHRpbmcgaG9hIGZpbHRlcnMgdG8gdXNlciBjYWxsYmFja1xuICAgICAgICAgICAgdGhpcy5vbkxvYWQodGhpcy5ob2FCdWZmZXIpO1xuICAgICAgICB9KVxuICAgIH1cblxuICAgIGdldEhvYUZpbHRlckZyb21IcmlyRmlsdGVyKCkge1xuICAgICAgICAvLyBjcmVhdGUgZW1wdHkgYnVmZmVyIHJlYWR5IHRvIHJlY2VpdmUgaG9hIGZpbHRlcnNcbiAgICAgICAgbGV0IGhyaXJCdWZmZXJMZW5ndGggPSB0aGlzLmhyaXJCdWZmZXJbMF0ubGVuZ3RoOyAvLyBhc3N1bWluZyB0aGV5IGFsbCBoYXZlIHRoZSBzYW1lXG4gICAgICAgIGxldCBocmlyQnVmZmVyU2FtcGxlUmF0ZSA9IHRoaXMuaHJpckJ1ZmZlclswXS5zYW1wbGVSYXRlOyAvLyBzYW1lXG4gICAgICAgIGxldCBob2FCdWZmZXIgPSB0aGlzLmNvbnRleHQuY3JlYXRlQnVmZmVyKHRoaXMubkNoLCBocmlyQnVmZmVyTGVuZ3RoLCBocmlyQnVmZmVyU2FtcGxlUmF0ZSk7XG5cbiAgICAgICAgLy8gc3VtIHdlaWdodGVkIEhSSVIgb3ZlciBBbWJpc29uaWMgY2hhbm5lbHMgdG8gY3JlYXRlIEhPQSBJUnNcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLm5DaDsgaSsrKSB7XG4gICAgICAgICAgICBsZXQgY29uY2F0QnVmZmVyQXJyYXlMZWZ0ID0gbmV3IEZsb2F0MzJBcnJheShocmlyQnVmZmVyTGVuZ3RoKTtcbiAgICAgICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgdGhpcy5ocmlyQnVmZmVyLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgayA9IDA7IGsgPCBocmlyQnVmZmVyTGVuZ3RoOyBrKyspIHtcbiAgICAgICAgICAgICAgICAgICAgY29uY2F0QnVmZmVyQXJyYXlMZWZ0W2tdICs9IHRoaXMuZGVjb2RpbmdNYXRyaXhbal1baV0gKiB0aGlzLmhyaXJCdWZmZXJbal0uZ2V0Q2hhbm5lbERhdGEoMClba107XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaG9hQnVmZmVyLmdldENoYW5uZWxEYXRhKGkpLnNldChjb25jYXRCdWZmZXJBcnJheUxlZnQpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGhvYUJ1ZmZlcjtcbiAgICB9XG5cbn1cbiJdfQ==