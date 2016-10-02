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
        this.fileExt = fileExt;

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
                    alert("Browser cannot decode audio data:  " + url + "\n\nError: " + error + "\n\n(If you re using Safari and get a null error, this is most likely due to Apple's shady plan going on to stop the .ogg format from easing web developer's life :)");
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
            this.buffers.forEach(function (b) {
                length = Math.max(length, b.length);
            });
            var srate = this.buffers[0].sampleRate;

            // Detect if the 8-ch audio file is OGG and if the browser is Chrome,
            // then remap 8-channel files to the correct order cause Chrome messe it up when loading
            // Firefox does not have this issue. 8ch Wave files work fine for both browsers.
            var remap8ChanFile = [1, 2, 3, 4, 5, 6, 7, 8];
            var isChrome = !!window.chrome;
            if (isChrome && this.fileExt.toLowerCase() == "ogg") {
                console.log("Loading of 8chan OGG files using Chrome: remap channels to correct order!");
                remap8ChanFile = [1, 3, 2, 7, 8, 5, 6, 4];
            }

            this.concatBuffer = this.context.createBuffer(nCh, length, srate);
            for (var i = 0; i < nChGroups; i++) {
                for (var j = 0; j < this.buffers[i].numberOfChannels; j++) {
                    this.concatBuffer.getChannelData(i * 8 + j).set(this.buffers[i].getChannelData(remap8ChanFile[j] - 1));
                }
            }
        }
    }]);
    return HOAloader;
}();

exports.default = HOAloader;
//# sourceMappingURL=data:application/json;base64,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QUgsRUFBSyxDQUFMLEVBQU8sQ0FBUCxFQUFTLENBQVQsRUFBVyxDQUFYLEVBQWEsQ0FBYixFQUFlLENBQWYsQ0FBakI7QUFDSDs7QUFFRCxpQkFBSyxZQUFMLEdBQW9CLEtBQUssT0FBTCxDQUFhLFlBQWIsQ0FBMEIsR0FBMUIsRUFBK0IsTUFBL0IsRUFBdUMsS0FBdkMsQ0FBcEI7QUFDQSxpQkFBSyxJQUFJLElBQUksQ0FBYixFQUFnQixJQUFJLFNBQXBCLEVBQStCLEdBQS9CLEVBQW9DO0FBQ2hDLHFCQUFLLElBQUksSUFBSSxDQUFiLEVBQWdCLElBQUksS0FBSyxPQUFMLENBQWEsQ0FBYixFQUFnQixnQkFBcEMsRUFBc0QsR0FBdEQsRUFBMkQ7QUFDdkQseUJBQUssWUFBTCxDQUFrQixjQUFsQixDQUFpQyxJQUFJLENBQUosR0FBUSxDQUF6QyxFQUE0QyxHQUE1QyxDQUFnRCxLQUFLLE9BQUwsQ0FBYSxDQUFiLEVBQWdCLGNBQWhCLENBQStCLGVBQWUsQ0FBZixJQUFrQixDQUFqRCxDQUFoRDtBQUNIO0FBQ0o7QUFDSjs7Ozs7a0JBcEdnQixTIiwiZmlsZSI6ImhvYS1sb2FkZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gIEFyY2hvbnRpcyBQb2xpdGlzXG4vLyAgYXJjaG9udGlzLnBvbGl0aXNAYWFsdG8uZmlcbi8vICBEYXZpZCBQb2lyaWVyLVF1aW5vdFxuLy8gIGRhdmlwb2lyQGlyY2FtLmZyXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy9cbi8vICBKU0FtYmlzb25pY3MgYSBKYXZhU2NyaXB0IGxpYnJhcnkgZm9yIGhpZ2hlci1vcmRlciBBbWJpc29uaWNzXG4vLyAgVGhlIGxpYnJhcnkgaW1wbGVtZW50cyBXZWIgQXVkaW8gYmxvY2tzIHRoYXQgcGVyZm9ybVxuLy8gIHR5cGljYWwgYW1iaXNvbmljIHByb2Nlc3Npbmcgb3BlcmF0aW9ucyBvbiBhdWRpbyBzaWduYWxzLlxuLy9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbi8vLy8vLy8vLy8vLy8vLy9cbi8qIEhPQSBMT0FERVIgKi9cbi8vLy8vLy8vLy8vLy8vLy9cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgSE9BbG9hZGVyIHtcbiAgICBjb25zdHJ1Y3Rvcihjb250ZXh0LCBvcmRlciwgdXJsLCBjYWxsYmFjaykge1xuICAgICAgICB0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xuICAgICAgICB0aGlzLm9yZGVyID0gb3JkZXI7XG4gICAgICAgIHRoaXMubkNoID0gKG9yZGVyICsgMSkgKiAob3JkZXIgKyAxKTtcbiAgICAgICAgdGhpcy5uQ2hHcm91cHMgPSBNYXRoLmNlaWwodGhpcy5uQ2ggLyA4KTtcbiAgICAgICAgdGhpcy5idWZmZXJzID0gbmV3IEFycmF5KCk7XG4gICAgICAgIHRoaXMubG9hZENvdW50ID0gMDtcbiAgICAgICAgdGhpcy5sb2FkZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5vbkxvYWQgPSBjYWxsYmFjaztcbiAgICAgICAgdGhpcy51cmxzID0gbmV3IEFycmF5KHRoaXMubkNoR3JvdXBzKTtcblxuICAgICAgICB2YXIgZmlsZUV4dCA9IHVybC5zbGljZSh1cmwubGVuZ3RoIC0gMywgdXJsLmxlbmd0aCk7XG4gICAgICAgIHRoaXMuZmlsZUV4dCA9IGZpbGVFeHQ7XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm5DaEdyb3VwczsgaSsrKSB7XG5cbiAgICAgICAgICAgIGlmIChpID09IHRoaXMubkNoR3JvdXBzIC0gMSkge1xuICAgICAgICAgICAgICAgIHRoaXMudXJsc1tpXSA9IHVybC5zbGljZSgwLCB1cmwubGVuZ3RoIC0gNCkgKyBcIl9cIiArIHBhZChpICogOCArIDEsIDIpICsgXCItXCIgKyBwYWQodGhpcy5uQ2gsIDIpICsgXCJjaC5cIiArIGZpbGVFeHQ7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMudXJsc1tpXSA9IHVybC5zbGljZSgwLCB1cmwubGVuZ3RoIC0gNCkgKyBcIl9cIiArIHBhZChpICogOCArIDEsIDIpICsgXCItXCIgKyBwYWQoaSAqIDggKyA4LCAyKSArIFwiY2guXCIgKyBmaWxlRXh0O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gcGFkKG51bSwgc2l6ZSkge1xuICAgICAgICAgICAgcmV0dXJuICgnMDAwMDAwMDAwJyArIG51bSkuc3Vic3RyKC1zaXplKTtcbiAgICAgICAgfVxuXG4gICAgfVxuXG4gICAgbG9hZEJ1ZmZlcnModXJsLCBpbmRleCkge1xuICAgICAgICAvLyBMb2FkIGJ1ZmZlciBhc3luY2hyb25vdXNseVxuICAgICAgICB2YXIgcmVxdWVzdCA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuICAgICAgICByZXF1ZXN0Lm9wZW4oXCJHRVRcIiwgdXJsLCB0cnVlKTtcbiAgICAgICAgcmVxdWVzdC5yZXNwb25zZVR5cGUgPSBcImFycmF5YnVmZmVyXCI7XG5cbiAgICAgICAgdmFyIHNjb3BlID0gdGhpcztcblxuICAgICAgICByZXF1ZXN0Lm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgLy8gQXN5bmNocm9ub3VzbHkgZGVjb2RlIHRoZSBhdWRpbyBmaWxlIGRhdGEgaW4gcmVxdWVzdC5yZXNwb25zZVxuICAgICAgICAgICAgc2NvcGUuY29udGV4dC5kZWNvZGVBdWRpb0RhdGEoXG4gICAgICAgICAgICAgICAgcmVxdWVzdC5yZXNwb25zZSxcbiAgICAgICAgICAgICAgICBmdW5jdGlvbihidWZmZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFidWZmZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFsZXJ0KCdlcnJvciBkZWNvZGluZyBmaWxlIGRhdGE6ICcgKyB1cmwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHNjb3BlLmJ1ZmZlcnNbaW5kZXhdID0gYnVmZmVyO1xuICAgICAgICAgICAgICAgICAgICBzY29wZS5sb2FkQ291bnQrKztcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNjb3BlLmxvYWRDb3VudCA9PSBzY29wZS5uQ2hHcm91cHMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNjb3BlLmxvYWRlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBzY29wZS5jb25jYXRCdWZmZXJzKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkhPQWxvYWRlcjogYWxsIGJ1ZmZlcnMgbG9hZGVkIGFuZCBjb25jYXRlbmF0ZWRcIilcbiAgICAgICAgICAgICAgICAgICAgICAgIHNjb3BlLm9uTG9hZChzY29wZS5jb25jYXRCdWZmZXIpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBmdW5jdGlvbihlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICBhbGVydChcIkJyb3dzZXIgY2Fubm90IGRlY29kZSBhdWRpbyBkYXRhOiAgXCIgKyAgdXJsICsgXCJcXG5cXG5FcnJvcjogXCIgKyBlcnJvciArIFwiXFxuXFxuKElmIHlvdSByZSB1c2luZyBTYWZhcmkgYW5kIGdldCBhIG51bGwgZXJyb3IsIHRoaXMgaXMgbW9zdCBsaWtlbHkgZHVlIHRvIEFwcGxlJ3Mgc2hhZHkgcGxhbiBnb2luZyBvbiB0byBzdG9wIHRoZSAub2dnIGZvcm1hdCBmcm9tIGVhc2luZyB3ZWIgZGV2ZWxvcGVyJ3MgbGlmZSA6KVwiKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgcmVxdWVzdC5vbmVycm9yID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBhbGVydCgnSE9BbG9hZGVyOiBYSFIgZXJyb3InKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJlcXVlc3Quc2VuZCgpO1xuICAgIH1cblxuICAgIGxvYWQoKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5uQ2hHcm91cHM7ICsraSkgdGhpcy5sb2FkQnVmZmVycyh0aGlzLnVybHNbaV0sIGkpO1xuICAgIH1cblxuICAgIGNvbmNhdEJ1ZmZlcnMoKSB7XG5cbiAgICAgICAgaWYgKCF0aGlzLmxvYWRlZCkgcmV0dXJuO1xuXG4gICAgICAgIHZhciBuQ2ggPSB0aGlzLm5DaDtcbiAgICAgICAgdmFyIG5DaEdyb3VwcyA9IHRoaXMubkNoR3JvdXBzO1xuXG4gICAgICAgIHZhciBsZW5ndGggPSB0aGlzLmJ1ZmZlcnNbMF0ubGVuZ3RoO1xuICAgICAgICB0aGlzLmJ1ZmZlcnMuZm9yRWFjaCggKGIpID0+IHtsZW5ndGggPSBNYXRoLm1heChsZW5ndGgsIGIubGVuZ3RoKX0pO1xuICAgICAgICB2YXIgc3JhdGUgPSB0aGlzLmJ1ZmZlcnNbMF0uc2FtcGxlUmF0ZTtcbiAgICAgICAgXG4gICAgICAgIC8vIERldGVjdCBpZiB0aGUgOC1jaCBhdWRpbyBmaWxlIGlzIE9HRyBhbmQgaWYgdGhlIGJyb3dzZXIgaXMgQ2hyb21lLFxuICAgICAgICAvLyB0aGVuIHJlbWFwIDgtY2hhbm5lbCBmaWxlcyB0byB0aGUgY29ycmVjdCBvcmRlciBjYXVzZSBDaHJvbWUgbWVzc2UgaXQgdXAgd2hlbiBsb2FkaW5nXG4gICAgICAgIC8vIEZpcmVmb3ggZG9lcyBub3QgaGF2ZSB0aGlzIGlzc3VlLiA4Y2ggV2F2ZSBmaWxlcyB3b3JrIGZpbmUgZm9yIGJvdGggYnJvd3NlcnMuXG4gICAgICAgIHZhciByZW1hcDhDaGFuRmlsZSA9IFsxLDIsMyw0LDUsNiw3LDhdO1xuICAgICAgICB2YXIgaXNDaHJvbWUgPSAhIXdpbmRvdy5jaHJvbWVcbiAgICAgICAgaWYgKGlzQ2hyb21lICYmIHRoaXMuZmlsZUV4dC50b0xvd2VyQ2FzZSgpID09IFwib2dnXCIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiTG9hZGluZyBvZiA4Y2hhbiBPR0cgZmlsZXMgdXNpbmcgQ2hyb21lOiByZW1hcCBjaGFubmVscyB0byBjb3JyZWN0IG9yZGVyIVwiKVxuICAgICAgICAgICAgcmVtYXA4Q2hhbkZpbGUgPSBbMSwzLDIsNyw4LDUsNiw0XTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuY29uY2F0QnVmZmVyID0gdGhpcy5jb250ZXh0LmNyZWF0ZUJ1ZmZlcihuQ2gsIGxlbmd0aCwgc3JhdGUpO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG5DaEdyb3VwczsgaSsrKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHRoaXMuYnVmZmVyc1tpXS5udW1iZXJPZkNoYW5uZWxzOyBqKyspIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNvbmNhdEJ1ZmZlci5nZXRDaGFubmVsRGF0YShpICogOCArIGopLnNldCh0aGlzLmJ1ZmZlcnNbaV0uZ2V0Q2hhbm5lbERhdGEocmVtYXA4Q2hhbkZpbGVbal0tMSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuIl19