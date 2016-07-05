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

////////////////
/* HOA LOADER */
////////////////

var HOAloader = function () {
    function HOAloader(context, order, url, callback) {
        (0, _classCallCheck3.default)(this, HOAloader);

        this.context = context;
        this.order = order;
        this.nCh = (order + 1) * (order + 1);
        this.nChGroups = Math.ceil(this.nCh / 8);
        this.buffers = new Array();
        this.loadCount = 0;
        this.loaded = false;
        this.onLoad = callback;
        this.urls = new Array(this.nChGroups);

        var fileExt = url.slice(url.length - 3, url.length);

        for (var i = 0; i < this.nChGroups; i++) {

            if (i == this.nChGroups - 1) {
                this.urls[i] = url.slice(0, url.length - 4) + "_" + pad(i * 8 + 1, 2) + "-" + pad(this.nCh, 2) + "ch." + fileExt;
            } else {
                this.urls[i] = url.slice(0, url.length - 4) + "_" + pad(i * 8 + 1, 2) + "-" + pad(i * 8 + 8, 2) + "ch." + fileExt;
            }
        }

        function pad(num, size) {
            return ('000000000' + num).substr(-size);
        }
    }

    (0, _createClass3.default)(HOAloader, [{
        key: "loadBuffers",
        value: function loadBuffers(url, index) {
            // Load buffer asynchronously
            var request = new XMLHttpRequest();
            request.open("GET", url, true);
            request.responseType = "arraybuffer";

            var scope = this;

            request.onload = function () {
                // Asynchronously decode the audio file data in request.response
                scope.context.decodeAudioData(request.response, function (buffer) {
                    if (!buffer) {
                        alert('error decoding file data: ' + url);
                        return;
                    }
                    scope.buffers[index] = buffer;
                    scope.loadCount++;
                    if (scope.loadCount == scope.nChGroups) {
                        scope.loaded = true;
                        scope.concatBuffers();
                        console.log("HOAloader: all buffers loaded and concatenated");
                        scope.onLoad(scope.concatBuffer);
                    }
                }, function (error) {
                    console.error('decodeAudioData error', error);
                });
            };

            request.onerror = function () {
                alert('HOAloader: XHR error');
            };

            request.send();
        }
    }, {
        key: "load",
        value: function load() {
            for (var i = 0; i < this.nChGroups; ++i) {
                this.loadBuffers(this.urls[i], i);
            }
        }
    }, {
        key: "concatBuffers",
        value: function concatBuffers() {

            if (!this.loaded) return;

            var nCh = this.nCh;
            var nChGroups = this.nChGroups;

            var length = this.buffers[0].length;
            var srate = this.buffers[0].sampleRate;

            this.concatBuffer = this.context.createBuffer(nCh, length, srate);
            for (var i = 0; i < nChGroups; i++) {
                for (var j = 0; j < this.buffers[i].numberOfChannels; j++) {
                    this.concatBuffer.getChannelData(i * 8 + j).set(this.buffers[i].getChannelData(j));
                }
            }
        }
    }]);
    return HOAloader;
}();

exports.default = HOAloader;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImhvYS1sb2FkZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBaUJxQixTO0FBQ2pCLHVCQUFZLE9BQVosRUFBcUIsS0FBckIsRUFBNEIsR0FBNUIsRUFBaUMsUUFBakMsRUFBMkM7QUFBQTs7QUFDdkMsYUFBSyxPQUFMLEdBQWUsT0FBZjtBQUNBLGFBQUssS0FBTCxHQUFhLEtBQWI7QUFDQSxhQUFLLEdBQUwsR0FBVyxDQUFDLFFBQVEsQ0FBVCxLQUFlLFFBQVEsQ0FBdkIsQ0FBWDtBQUNBLGFBQUssU0FBTCxHQUFpQixLQUFLLElBQUwsQ0FBVSxLQUFLLEdBQUwsR0FBVyxDQUFyQixDQUFqQjtBQUNBLGFBQUssT0FBTCxHQUFlLElBQUksS0FBSixFQUFmO0FBQ0EsYUFBSyxTQUFMLEdBQWlCLENBQWpCO0FBQ0EsYUFBSyxNQUFMLEdBQWMsS0FBZDtBQUNBLGFBQUssTUFBTCxHQUFjLFFBQWQ7QUFDQSxhQUFLLElBQUwsR0FBWSxJQUFJLEtBQUosQ0FBVSxLQUFLLFNBQWYsQ0FBWjs7QUFFQSxZQUFJLFVBQVUsSUFBSSxLQUFKLENBQVUsSUFBSSxNQUFKLEdBQWEsQ0FBdkIsRUFBMEIsSUFBSSxNQUE5QixDQUFkOztBQUVBLGFBQUssSUFBSSxJQUFJLENBQWIsRUFBZ0IsSUFBSSxLQUFLLFNBQXpCLEVBQW9DLEdBQXBDLEVBQXlDOztBQUVyQyxnQkFBSSxLQUFLLEtBQUssU0FBTCxHQUFpQixDQUExQixFQUE2QjtBQUN6QixxQkFBSyxJQUFMLENBQVUsQ0FBVixJQUFlLElBQUksS0FBSixDQUFVLENBQVYsRUFBYSxJQUFJLE1BQUosR0FBYSxDQUExQixJQUErQixHQUEvQixHQUFxQyxJQUFJLElBQUksQ0FBSixHQUFRLENBQVosRUFBZSxDQUFmLENBQXJDLEdBQXlELEdBQXpELEdBQStELElBQUksS0FBSyxHQUFULEVBQWMsQ0FBZCxDQUEvRCxHQUFrRixLQUFsRixHQUEwRixPQUF6RztBQUNILGFBRkQsTUFFTztBQUNILHFCQUFLLElBQUwsQ0FBVSxDQUFWLElBQWUsSUFBSSxLQUFKLENBQVUsQ0FBVixFQUFhLElBQUksTUFBSixHQUFhLENBQTFCLElBQStCLEdBQS9CLEdBQXFDLElBQUksSUFBSSxDQUFKLEdBQVEsQ0FBWixFQUFlLENBQWYsQ0FBckMsR0FBeUQsR0FBekQsR0FBK0QsSUFBSSxJQUFJLENBQUosR0FBUSxDQUFaLEVBQWUsQ0FBZixDQUEvRCxHQUFtRixLQUFuRixHQUEyRixPQUExRztBQUNIO0FBQ0o7O0FBRUQsaUJBQVMsR0FBVCxDQUFhLEdBQWIsRUFBa0IsSUFBbEIsRUFBd0I7QUFDcEIsbUJBQU8sQ0FBQyxjQUFjLEdBQWYsRUFBb0IsTUFBcEIsQ0FBMkIsQ0FBQyxJQUE1QixDQUFQO0FBQ0g7QUFFSjs7OztvQ0FFVyxHLEVBQUssSyxFQUFPOztBQUVwQixnQkFBSSxVQUFVLElBQUksY0FBSixFQUFkO0FBQ0Esb0JBQVEsSUFBUixDQUFhLEtBQWIsRUFBb0IsR0FBcEIsRUFBeUIsSUFBekI7QUFDQSxvQkFBUSxZQUFSLEdBQXVCLGFBQXZCOztBQUVBLGdCQUFJLFFBQVEsSUFBWjs7QUFFQSxvQkFBUSxNQUFSLEdBQWlCLFlBQVc7O0FBRXhCLHNCQUFNLE9BQU4sQ0FBYyxlQUFkLENBQ0ksUUFBUSxRQURaLEVBRUksVUFBUyxNQUFULEVBQWlCO0FBQ2Isd0JBQUksQ0FBQyxNQUFMLEVBQWE7QUFDVCw4QkFBTSwrQkFBK0IsR0FBckM7QUFDQTtBQUNIO0FBQ0QsMEJBQU0sT0FBTixDQUFjLEtBQWQsSUFBdUIsTUFBdkI7QUFDQSwwQkFBTSxTQUFOO0FBQ0Esd0JBQUksTUFBTSxTQUFOLElBQW1CLE1BQU0sU0FBN0IsRUFBd0M7QUFDcEMsOEJBQU0sTUFBTixHQUFlLElBQWY7QUFDQSw4QkFBTSxhQUFOO0FBQ0EsZ0NBQVEsR0FBUixDQUFZLGdEQUFaO0FBQ0EsOEJBQU0sTUFBTixDQUFhLE1BQU0sWUFBbkI7QUFDSDtBQUNKLGlCQWZMLEVBZ0JJLFVBQVMsS0FBVCxFQUFnQjtBQUNaLDRCQUFRLEtBQVIsQ0FBYyx1QkFBZCxFQUF1QyxLQUF2QztBQUNILGlCQWxCTDtBQW9CSCxhQXRCRDs7QUF3QkEsb0JBQVEsT0FBUixHQUFrQixZQUFXO0FBQ3pCLHNCQUFNLHNCQUFOO0FBQ0gsYUFGRDs7QUFJQSxvQkFBUSxJQUFSO0FBQ0g7OzsrQkFFTTtBQUNILGlCQUFLLElBQUksSUFBSSxDQUFiLEVBQWdCLElBQUksS0FBSyxTQUF6QixFQUFvQyxFQUFFLENBQXRDO0FBQXlDLHFCQUFLLFdBQUwsQ0FBaUIsS0FBSyxJQUFMLENBQVUsQ0FBVixDQUFqQixFQUErQixDQUEvQjtBQUF6QztBQUNIOzs7d0NBRWU7O0FBRVosZ0JBQUksQ0FBQyxLQUFLLE1BQVYsRUFBa0I7O0FBRWxCLGdCQUFJLE1BQU0sS0FBSyxHQUFmO0FBQ0EsZ0JBQUksWUFBWSxLQUFLLFNBQXJCOztBQUVBLGdCQUFJLFNBQVMsS0FBSyxPQUFMLENBQWEsQ0FBYixFQUFnQixNQUE3QjtBQUNBLGdCQUFJLFFBQVEsS0FBSyxPQUFMLENBQWEsQ0FBYixFQUFnQixVQUE1Qjs7QUFFQSxpQkFBSyxZQUFMLEdBQW9CLEtBQUssT0FBTCxDQUFhLFlBQWIsQ0FBMEIsR0FBMUIsRUFBK0IsTUFBL0IsRUFBdUMsS0FBdkMsQ0FBcEI7QUFDQSxpQkFBSyxJQUFJLElBQUksQ0FBYixFQUFnQixJQUFJLFNBQXBCLEVBQStCLEdBQS9CLEVBQW9DO0FBQ2hDLHFCQUFLLElBQUksSUFBSSxDQUFiLEVBQWdCLElBQUksS0FBSyxPQUFMLENBQWEsQ0FBYixFQUFnQixnQkFBcEMsRUFBc0QsR0FBdEQsRUFBMkQ7QUFDdkQseUJBQUssWUFBTCxDQUFrQixjQUFsQixDQUFpQyxJQUFJLENBQUosR0FBUSxDQUF6QyxFQUE0QyxHQUE1QyxDQUFnRCxLQUFLLE9BQUwsQ0FBYSxDQUFiLEVBQWdCLGNBQWhCLENBQStCLENBQS9CLENBQWhEO0FBQ0g7QUFDSjtBQUNKOzs7OztrQkF4RmdCLFMiLCJmaWxlIjoiaG9hLWxvYWRlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyAgQXJjaG9udGlzIFBvbGl0aXNcbi8vICBhcmNob250aXMucG9saXRpc0BhYWx0by5maVxuLy8gIERhdmlkIFBvaXJpZXItUXVpbm90XG4vLyAgZGF2aXBvaXJAaXJjYW0uZnJcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vL1xuLy8gIFdlYkF1ZGlvX0hPQSBhIEphdmFTY3JpcHQgbGlicmFyeSBmb3IgaGlnaGVyLW9yZGVyIEFtYmlzb25pY3Ncbi8vICBUaGUgbGlicmFyeSBpbXBsZW1lbnRzIFdlYiBBdWRpbyBibG9ja3MgdGhhdCBwZXJmb3JtXG4vLyAgdHlwaWNhbCBhbWJpc29uaWMgcHJvY2Vzc2luZyBvcGVyYXRpb25zIG9uIGF1ZGlvIHNpZ25hbHMuXG4vL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLy8vLy8vLy8vLy8vLy8vL1xuLyogSE9BIExPQURFUiAqL1xuLy8vLy8vLy8vLy8vLy8vL1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBIT0Fsb2FkZXIge1xuICAgIGNvbnN0cnVjdG9yKGNvbnRleHQsIG9yZGVyLCB1cmwsIGNhbGxiYWNrKSB7XG4gICAgICAgIHRoaXMuY29udGV4dCA9IGNvbnRleHQ7XG4gICAgICAgIHRoaXMub3JkZXIgPSBvcmRlcjtcbiAgICAgICAgdGhpcy5uQ2ggPSAob3JkZXIgKyAxKSAqIChvcmRlciArIDEpO1xuICAgICAgICB0aGlzLm5DaEdyb3VwcyA9IE1hdGguY2VpbCh0aGlzLm5DaCAvIDgpO1xuICAgICAgICB0aGlzLmJ1ZmZlcnMgPSBuZXcgQXJyYXkoKTtcbiAgICAgICAgdGhpcy5sb2FkQ291bnQgPSAwO1xuICAgICAgICB0aGlzLmxvYWRlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLm9uTG9hZCA9IGNhbGxiYWNrO1xuICAgICAgICB0aGlzLnVybHMgPSBuZXcgQXJyYXkodGhpcy5uQ2hHcm91cHMpO1xuXG4gICAgICAgIHZhciBmaWxlRXh0ID0gdXJsLnNsaWNlKHVybC5sZW5ndGggLSAzLCB1cmwubGVuZ3RoKTtcblxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubkNoR3JvdXBzOyBpKyspIHtcblxuICAgICAgICAgICAgaWYgKGkgPT0gdGhpcy5uQ2hHcm91cHMgLSAxKSB7XG4gICAgICAgICAgICAgICAgdGhpcy51cmxzW2ldID0gdXJsLnNsaWNlKDAsIHVybC5sZW5ndGggLSA0KSArIFwiX1wiICsgcGFkKGkgKiA4ICsgMSwgMikgKyBcIi1cIiArIHBhZCh0aGlzLm5DaCwgMikgKyBcImNoLlwiICsgZmlsZUV4dDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy51cmxzW2ldID0gdXJsLnNsaWNlKDAsIHVybC5sZW5ndGggLSA0KSArIFwiX1wiICsgcGFkKGkgKiA4ICsgMSwgMikgKyBcIi1cIiArIHBhZChpICogOCArIDgsIDIpICsgXCJjaC5cIiArIGZpbGVFeHQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBwYWQobnVtLCBzaXplKSB7XG4gICAgICAgICAgICByZXR1cm4gKCcwMDAwMDAwMDAnICsgbnVtKS5zdWJzdHIoLXNpemUpO1xuICAgICAgICB9XG5cbiAgICB9XG5cbiAgICBsb2FkQnVmZmVycyh1cmwsIGluZGV4KSB7XG4gICAgICAgIC8vIExvYWQgYnVmZmVyIGFzeW5jaHJvbm91c2x5XG4gICAgICAgIHZhciByZXF1ZXN0ID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG4gICAgICAgIHJlcXVlc3Qub3BlbihcIkdFVFwiLCB1cmwsIHRydWUpO1xuICAgICAgICByZXF1ZXN0LnJlc3BvbnNlVHlwZSA9IFwiYXJyYXlidWZmZXJcIjtcblxuICAgICAgICB2YXIgc2NvcGUgPSB0aGlzO1xuXG4gICAgICAgIHJlcXVlc3Qub25sb2FkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAvLyBBc3luY2hyb25vdXNseSBkZWNvZGUgdGhlIGF1ZGlvIGZpbGUgZGF0YSBpbiByZXF1ZXN0LnJlc3BvbnNlXG4gICAgICAgICAgICBzY29wZS5jb250ZXh0LmRlY29kZUF1ZGlvRGF0YShcbiAgICAgICAgICAgICAgICByZXF1ZXN0LnJlc3BvbnNlLFxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uKGJ1ZmZlcikge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWJ1ZmZlcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgYWxlcnQoJ2Vycm9yIGRlY29kaW5nIGZpbGUgZGF0YTogJyArIHVybCk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgc2NvcGUuYnVmZmVyc1tpbmRleF0gPSBidWZmZXI7XG4gICAgICAgICAgICAgICAgICAgIHNjb3BlLmxvYWRDb3VudCsrO1xuICAgICAgICAgICAgICAgICAgICBpZiAoc2NvcGUubG9hZENvdW50ID09IHNjb3BlLm5DaEdyb3Vwcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2NvcGUubG9hZGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNjb3BlLmNvbmNhdEJ1ZmZlcnMoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiSE9BbG9hZGVyOiBhbGwgYnVmZmVycyBsb2FkZWQgYW5kIGNvbmNhdGVuYXRlZFwiKVxuICAgICAgICAgICAgICAgICAgICAgICAgc2NvcGUub25Mb2FkKHNjb3BlLmNvbmNhdEJ1ZmZlcik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ2RlY29kZUF1ZGlvRGF0YSBlcnJvcicsIGVycm9yKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgcmVxdWVzdC5vbmVycm9yID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBhbGVydCgnSE9BbG9hZGVyOiBYSFIgZXJyb3InKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJlcXVlc3Quc2VuZCgpO1xuICAgIH1cblxuICAgIGxvYWQoKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5uQ2hHcm91cHM7ICsraSkgdGhpcy5sb2FkQnVmZmVycyh0aGlzLnVybHNbaV0sIGkpO1xuICAgIH1cblxuICAgIGNvbmNhdEJ1ZmZlcnMoKSB7XG5cbiAgICAgICAgaWYgKCF0aGlzLmxvYWRlZCkgcmV0dXJuO1xuXG4gICAgICAgIHZhciBuQ2ggPSB0aGlzLm5DaDtcbiAgICAgICAgdmFyIG5DaEdyb3VwcyA9IHRoaXMubkNoR3JvdXBzO1xuXG4gICAgICAgIHZhciBsZW5ndGggPSB0aGlzLmJ1ZmZlcnNbMF0ubGVuZ3RoO1xuICAgICAgICB2YXIgc3JhdGUgPSB0aGlzLmJ1ZmZlcnNbMF0uc2FtcGxlUmF0ZTtcblxuICAgICAgICB0aGlzLmNvbmNhdEJ1ZmZlciA9IHRoaXMuY29udGV4dC5jcmVhdGVCdWZmZXIobkNoLCBsZW5ndGgsIHNyYXRlKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBuQ2hHcm91cHM7IGkrKykge1xuICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCB0aGlzLmJ1ZmZlcnNbaV0ubnVtYmVyT2ZDaGFubmVsczsgaisrKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jb25jYXRCdWZmZXIuZ2V0Q2hhbm5lbERhdGEoaSAqIDggKyBqKS5zZXQodGhpcy5idWZmZXJzW2ldLmdldENoYW5uZWxEYXRhKGopKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cbiJdfQ==