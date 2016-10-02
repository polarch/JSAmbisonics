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
                _this.decodingMatrix = utils.getAmbiBinauralDecMtx(grantedFilterPos, _this.order);

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
//# sourceMappingURL=data:application/json;base64,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QUFLLFVBQUwsQ0FBZ0IsQ0FBaEIsRUFBbUIsVUFBOUMsQztBQUNBLGdCQUFJLFlBQVksS0FBSyxPQUFMLENBQWEsWUFBYixDQUEwQixLQUFLLEdBQS9CLEVBQW9DLGdCQUFwQyxFQUFzRCxvQkFBdEQsQ0FBaEI7OztBQUdBLGlCQUFLLElBQUksSUFBSSxDQUFiLEVBQWdCLElBQUksS0FBSyxHQUF6QixFQUE4QixHQUE5QixFQUFtQztBQUMvQixvQkFBSSx3QkFBd0IsSUFBSSxZQUFKLENBQWlCLGdCQUFqQixDQUE1QjtBQUNBLHFCQUFLLElBQUksSUFBSSxDQUFiLEVBQWdCLElBQUksS0FBSyxVQUFMLENBQWdCLE1BQXBDLEVBQTRDLEdBQTVDLEVBQWlEO0FBQzdDLHlCQUFLLElBQUksSUFBSSxDQUFiLEVBQWdCLElBQUksZ0JBQXBCLEVBQXNDLEdBQXRDLEVBQTJDO0FBQ3ZDLDhDQUFzQixDQUF0QixLQUE0QixLQUFLLGNBQUwsQ0FBb0IsQ0FBcEIsRUFBdUIsQ0FBdkIsSUFBNEIsS0FBSyxVQUFMLENBQWdCLENBQWhCLEVBQW1CLGNBQW5CLENBQWtDLENBQWxDLEVBQXFDLENBQXJDLENBQXhEO0FBQ0g7QUFDSjtBQUNELDBCQUFVLGNBQVYsQ0FBeUIsQ0FBekIsRUFBNEIsR0FBNUIsQ0FBZ0MscUJBQWhDO0FBQ0g7O0FBRUQsbUJBQU8sU0FBUDtBQUNIOzs7OztrQkExRWdCLFUiLCJmaWxlIjoiaHJpci1sb2FkZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gIEFyY2hvbnRpcyBQb2xpdGlzIChBYWx0byBVbml2ZXJzaXR5KVxuLy8gIGFyY2hvbnRpcy5wb2xpdGlzQGFhbHRvLmZpXG4vLyAgRGF2aWQgUG9pcmllci1RdWlub3QgKElSQ0FNKVxuLy8gIGRhdmlwb2lyQGlyY2FtLmZyXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy9cbi8vICBKU0FtYmlzb25pY3MgYSBKYXZhU2NyaXB0IGxpYnJhcnkgZm9yIGhpZ2hlci1vcmRlciBBbWJpc29uaWNzXG4vLyAgVGhlIGxpYnJhcnkgaW1wbGVtZW50cyBXZWIgQXVkaW8gYmxvY2tzIHRoYXQgcGVyZm9ybVxuLy8gIHR5cGljYWwgYW1iaXNvbmljIHByb2Nlc3Npbmcgb3BlcmF0aW9ucyBvbiBhdWRpbyBzaWduYWxzLlxuLy9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbi8vLy8vLy8vLy8vLy8vLy8vXG4vKiBIUklSIExPQURFUiAqL1xuLy8vLy8vLy8vLy8vLy8vLy9cblxuaW1wb3J0ICogYXMgc2VydmVTb2ZhSHJpciBmcm9tICdzZXJ2ZS1zb2ZhLWhyaXInO1xudmFyIHV0aWxzID0gcmVxdWlyZShcIi4vdXRpbHMuanNcIik7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEhSSVJsb2FkZXIge1xuICAgIGNvbnN0cnVjdG9yKGNvbnRleHQsIG9yZGVyLCBjYWxsYmFjaykge1xuICAgICAgICB0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xuICAgICAgICB0aGlzLm9yZGVyID0gb3JkZXI7XG4gICAgICAgIHRoaXMubkNoID0gKG9yZGVyICsgMSkgKiAob3JkZXIgKyAxKTtcblxuICAgICAgICAvLyBmb25jdGlvbiBjYWxsZWQgd2hlbiBmaWx0ZXJzIGxvYWRlZFxuICAgICAgICB0aGlzLm9uTG9hZCA9IGNhbGxiYWNrO1xuXG4gICAgICAgIC8vIGluc3RhbnRpYXRlIGhydGZzZXQgZnJvbSBzZXJ2ZS1zb2ZhLWhydGYgbGliXG4gICAgICAgIHRoaXMuaHJ0ZlNldCA9IG5ldyBzZXJ2ZVNvZmFIcmlyLkhydGZTZXQoeyBhdWRpb0NvbnRleHQ6dGhpcy5jb250ZXh0LCBjb29yZGluYXRlU3lzdGVtOidzb2ZhU3BoZXJpY2FsJyB9KTtcblxuICAgICAgICAvLyBkZWZpbmUgcmVxdWlyZWQgc3BlYWtlcnMgKGhlbmNlIGhyaXJzKSBwb3NpdGlvbnMgYmFzZWQgb24gQW1iaXNvbmljIG9yZGVyXG4gICAgICAgIHRoaXMud2lzaGVkU3BlYWtlclBvcyA9IHV0aWxzLmdldFRkZXNpZ24oMip0aGlzLm9yZGVyKTtcbiAgICB9XG5cbiAgICBsb2FkKHNldFVybCkge1xuXG4gICAgICAgIHRoaXMuaHJ0ZlNldC5sb2FkKHNldFVybCkudGhlbiggKCkgPT4ge1xuXG4gICAgICAgICAgICAvLyBleHRyYWN0IGhyaXIgYnVmZmVycyBvZiBpbnRlcmVzdCBmcm9tIHRoZSBkYXRhYmFzZVxuICAgICAgICAgICAgbGV0IGdyYW50ZWRGaWx0ZXJQb3MgPSBbXTtcbiAgICAgICAgICAgIHRoaXMuaHJpckJ1ZmZlciA9IFtdO1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLndpc2hlZFNwZWFrZXJQb3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAvLyBnZXQgYXZhaWxhYmxlIHBvc2l0aW9ucyAoaW4gdGhlIGRiKSBuZWFyZXN0IGZyb20gdGhlIHJlcXVpcmVkIHNwZWFrZXJzIHBvc2l0aW9uc1xuICAgICAgICAgICAgICAgIGdyYW50ZWRGaWx0ZXJQb3MucHVzaCh0aGlzLmhydGZTZXQubmVhcmVzdCh0aGlzLndpc2hlZFNwZWFrZXJQb3NbaV0pLnBvc2l0aW9uKTtcbiAgICAgICAgICAgICAgICAvLyBnZXQgcmVsYXRlZCBocmlyXG4gICAgICAgICAgICAgICAgdGhpcy5ocmlyQnVmZmVyLnB1c2godGhpcy5ocnRmU2V0Lm5lYXJlc3QodGhpcy53aXNoZWRTcGVha2VyUG9zW2ldKS5maXIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBERUJVRyAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgICAgICAgICAgIC8vIGNvbXBhcmUgcmVxdWlyZWQgdnMuIHByZXNlbnQgcG9zaXRpb25zIGluIEhSSVIgZmlsdGVyXG4gICAgICAgICAgICBsZXQgYW5ndWxhckRpc3REZWcgPSAwO1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLndpc2hlZFNwZWFrZXJQb3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy53aXNoZWRTcGVha2VyUG9zW2ldWzBdIDwgMCkgdGhpcy53aXNoZWRTcGVha2VyUG9zW2ldWzBdICs9IDM2MC4wO1xuICAgICAgICAgICAgICAgIGFuZ3VsYXJEaXN0RGVnICs9IE1hdGguc3FydChcbiAgICAgICAgICAgICAgICAgICAgTWF0aC5wb3codGhpcy53aXNoZWRTcGVha2VyUG9zW2ldWzBdIC0gZ3JhbnRlZEZpbHRlclBvc1tpXVswXSwgMikgK1xuICAgICAgICAgICAgICAgICAgICBNYXRoLnBvdyh0aGlzLndpc2hlZFNwZWFrZXJQb3NbaV1bMV0gLSBncmFudGVkRmlsdGVyUG9zW2ldWzFdLCAyKSk7XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coJ2Fza2VkIC8gZ3JhbnRlZCBwb3M6ICcsIHRoaXMud2lzaGVkU3BlYWtlclBvc1tpXSwgJy8nLCBncmFudGVkRmlsdGVyUG9zW2ldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdzdW1tZWQgLyBhdmVyYWdlIGFuZ3VsYXIgZGlzdCBiZXR3ZWVuIGFza2VkIGFuZCBwcmVzZW50IHBvczonLFxuICAgICAgICAgICAgICAgIE1hdGgucm91bmQoYW5ndWxhckRpc3REZWcqMTAwKS8xMDAsICdkZWcgLycsXG4gICAgICAgICAgICAgICAgTWF0aC5yb3VuZCggKGFuZ3VsYXJEaXN0RGVnL3RoaXMud2lzaGVkU3BlYWtlclBvcy5sZW5ndGgpICoxMDApLzEwMCwgJ2RlZycpO1xuICAgICAgICAgICAgLy8gREVCVUcgRU5EIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbiAgICAgICAgICAgIC8vIGdldCBkZWNvZGluZyBtYXRyaXhcbiAgICAgICAgICAgIHRoaXMuZGVjb2RpbmdNYXRyaXggPSB1dGlscy5nZXRBbWJpQmluYXVyYWxEZWNNdHgoZ3JhbnRlZEZpbHRlclBvcywgdGhpcy5vcmRlcik7XG5cbiAgICAgICAgICAgIC8vIGNvbnZlcnQgaHJpciBmaWx0ZXJzIHRvIGhvYSBmaWx0ZXJzXG4gICAgICAgICAgICB0aGlzLmhvYUJ1ZmZlciA9IHRoaXMuZ2V0SG9hRmlsdGVyRnJvbUhyaXJGaWx0ZXIoKTtcblxuICAgICAgICAgICAgLy8gcGFzcyByZXN1bHRpbmcgaG9hIGZpbHRlcnMgdG8gdXNlciBjYWxsYmFja1xuICAgICAgICAgICAgdGhpcy5vbkxvYWQodGhpcy5ob2FCdWZmZXIpO1xuICAgICAgICB9KVxuICAgIH1cblxuICAgIGdldEhvYUZpbHRlckZyb21IcmlyRmlsdGVyKCkge1xuICAgICAgICAvLyBjcmVhdGUgZW1wdHkgYnVmZmVyIHJlYWR5IHRvIHJlY2VpdmUgaG9hIGZpbHRlcnNcbiAgICAgICAgbGV0IGhyaXJCdWZmZXJMZW5ndGggPSB0aGlzLmhyaXJCdWZmZXJbMF0ubGVuZ3RoOyAvLyBhc3N1bWluZyB0aGV5IGFsbCBoYXZlIHRoZSBzYW1lXG4gICAgICAgIGxldCBocmlyQnVmZmVyU2FtcGxlUmF0ZSA9IHRoaXMuaHJpckJ1ZmZlclswXS5zYW1wbGVSYXRlOyAvLyBzYW1lXG4gICAgICAgIGxldCBob2FCdWZmZXIgPSB0aGlzLmNvbnRleHQuY3JlYXRlQnVmZmVyKHRoaXMubkNoLCBocmlyQnVmZmVyTGVuZ3RoLCBocmlyQnVmZmVyU2FtcGxlUmF0ZSk7XG5cbiAgICAgICAgLy8gc3VtIHdlaWdodGVkIEhSSVIgb3ZlciBBbWJpc29uaWMgY2hhbm5lbHMgdG8gY3JlYXRlIEhPQSBJUnNcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLm5DaDsgaSsrKSB7XG4gICAgICAgICAgICBsZXQgY29uY2F0QnVmZmVyQXJyYXlMZWZ0ID0gbmV3IEZsb2F0MzJBcnJheShocmlyQnVmZmVyTGVuZ3RoKTtcbiAgICAgICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgdGhpcy5ocmlyQnVmZmVyLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgayA9IDA7IGsgPCBocmlyQnVmZmVyTGVuZ3RoOyBrKyspIHtcbiAgICAgICAgICAgICAgICAgICAgY29uY2F0QnVmZmVyQXJyYXlMZWZ0W2tdICs9IHRoaXMuZGVjb2RpbmdNYXRyaXhbal1baV0gKiB0aGlzLmhyaXJCdWZmZXJbal0uZ2V0Q2hhbm5lbERhdGEoMClba107XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaG9hQnVmZmVyLmdldENoYW5uZWxEYXRhKGkpLnNldChjb25jYXRCdWZmZXJBcnJheUxlZnQpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGhvYUJ1ZmZlcjtcbiAgICB9XG5cbn1cbiJdfQ==