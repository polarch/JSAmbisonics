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
//# sourceMappingURL=data:application/json;base64,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LE1BQS9CLEVBQXVDLEtBQXZDLENBQXBCO0FBQ0EsaUJBQUssSUFBSSxJQUFJLENBQWIsRUFBZ0IsSUFBSSxTQUFwQixFQUErQixHQUEvQixFQUFvQztBQUNoQyxxQkFBSyxJQUFJLElBQUksQ0FBYixFQUFnQixJQUFJLEtBQUssT0FBTCxDQUFhLENBQWIsRUFBZ0IsZ0JBQXBDLEVBQXNELEdBQXRELEVBQTJEO0FBQ3ZELHlCQUFLLFlBQUwsQ0FBa0IsY0FBbEIsQ0FBaUMsSUFBSSxDQUFKLEdBQVEsQ0FBekMsRUFBNEMsR0FBNUMsQ0FBZ0QsS0FBSyxPQUFMLENBQWEsQ0FBYixFQUFnQixjQUFoQixDQUErQixlQUFlLENBQWYsSUFBa0IsQ0FBakQsQ0FBaEQ7QUFDSDtBQUNKO0FBQ0o7Ozs7O2tCQW5HZ0IsUyIsImZpbGUiOiJob2EtbG9hZGVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vICBBcmNob250aXMgUG9saXRpc1xuLy8gIGFyY2hvbnRpcy5wb2xpdGlzQGFhbHRvLmZpXG4vLyAgRGF2aWQgUG9pcmllci1RdWlub3Rcbi8vICBkYXZpcG9pckBpcmNhbS5mclxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vXG4vLyAgV2ViQXVkaW9fSE9BIGEgSmF2YVNjcmlwdCBsaWJyYXJ5IGZvciBoaWdoZXItb3JkZXIgQW1iaXNvbmljc1xuLy8gIFRoZSBsaWJyYXJ5IGltcGxlbWVudHMgV2ViIEF1ZGlvIGJsb2NrcyB0aGF0IHBlcmZvcm1cbi8vICB0eXBpY2FsIGFtYmlzb25pYyBwcm9jZXNzaW5nIG9wZXJhdGlvbnMgb24gYXVkaW8gc2lnbmFscy5cbi8vXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4vLy8vLy8vLy8vLy8vLy8vXG4vKiBIT0EgTE9BREVSICovXG4vLy8vLy8vLy8vLy8vLy8vXG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEhPQWxvYWRlciB7XG4gICAgY29uc3RydWN0b3IoY29udGV4dCwgb3JkZXIsIHVybCwgY2FsbGJhY2spIHtcbiAgICAgICAgdGhpcy5jb250ZXh0ID0gY29udGV4dDtcbiAgICAgICAgdGhpcy5vcmRlciA9IG9yZGVyO1xuICAgICAgICB0aGlzLm5DaCA9IChvcmRlciArIDEpICogKG9yZGVyICsgMSk7XG4gICAgICAgIHRoaXMubkNoR3JvdXBzID0gTWF0aC5jZWlsKHRoaXMubkNoIC8gOCk7XG4gICAgICAgIHRoaXMuYnVmZmVycyA9IG5ldyBBcnJheSgpO1xuICAgICAgICB0aGlzLmxvYWRDb3VudCA9IDA7XG4gICAgICAgIHRoaXMubG9hZGVkID0gZmFsc2U7XG4gICAgICAgIHRoaXMub25Mb2FkID0gY2FsbGJhY2s7XG4gICAgICAgIHRoaXMudXJscyA9IG5ldyBBcnJheSh0aGlzLm5DaEdyb3Vwcyk7XG5cbiAgICAgICAgdmFyIGZpbGVFeHQgPSB1cmwuc2xpY2UodXJsLmxlbmd0aCAtIDMsIHVybC5sZW5ndGgpO1xuICAgICAgICB0aGlzLmZpbGVFeHQgPSBmaWxlRXh0O1xuXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5uQ2hHcm91cHM7IGkrKykge1xuXG4gICAgICAgICAgICBpZiAoaSA9PSB0aGlzLm5DaEdyb3VwcyAtIDEpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnVybHNbaV0gPSB1cmwuc2xpY2UoMCwgdXJsLmxlbmd0aCAtIDQpICsgXCJfXCIgKyBwYWQoaSAqIDggKyAxLCAyKSArIFwiLVwiICsgcGFkKHRoaXMubkNoLCAyKSArIFwiY2guXCIgKyBmaWxlRXh0O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLnVybHNbaV0gPSB1cmwuc2xpY2UoMCwgdXJsLmxlbmd0aCAtIDQpICsgXCJfXCIgKyBwYWQoaSAqIDggKyAxLCAyKSArIFwiLVwiICsgcGFkKGkgKiA4ICsgOCwgMikgKyBcImNoLlwiICsgZmlsZUV4dDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIHBhZChudW0sIHNpemUpIHtcbiAgICAgICAgICAgIHJldHVybiAoJzAwMDAwMDAwMCcgKyBudW0pLnN1YnN0cigtc2l6ZSk7XG4gICAgICAgIH1cblxuICAgIH1cblxuICAgIGxvYWRCdWZmZXJzKHVybCwgaW5kZXgpIHtcbiAgICAgICAgLy8gTG9hZCBidWZmZXIgYXN5bmNocm9ub3VzbHlcbiAgICAgICAgdmFyIHJlcXVlc3QgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcbiAgICAgICAgcmVxdWVzdC5vcGVuKFwiR0VUXCIsIHVybCwgdHJ1ZSk7XG4gICAgICAgIHJlcXVlc3QucmVzcG9uc2VUeXBlID0gXCJhcnJheWJ1ZmZlclwiO1xuXG4gICAgICAgIHZhciBzY29wZSA9IHRoaXM7XG5cbiAgICAgICAgcmVxdWVzdC5vbmxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIC8vIEFzeW5jaHJvbm91c2x5IGRlY29kZSB0aGUgYXVkaW8gZmlsZSBkYXRhIGluIHJlcXVlc3QucmVzcG9uc2VcbiAgICAgICAgICAgIHNjb3BlLmNvbnRleHQuZGVjb2RlQXVkaW9EYXRhKFxuICAgICAgICAgICAgICAgIHJlcXVlc3QucmVzcG9uc2UsXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24oYnVmZmVyKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghYnVmZmVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhbGVydCgnZXJyb3IgZGVjb2RpbmcgZmlsZSBkYXRhOiAnICsgdXJsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBzY29wZS5idWZmZXJzW2luZGV4XSA9IGJ1ZmZlcjtcbiAgICAgICAgICAgICAgICAgICAgc2NvcGUubG9hZENvdW50Kys7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzY29wZS5sb2FkQ291bnQgPT0gc2NvcGUubkNoR3JvdXBzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzY29wZS5sb2FkZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgc2NvcGUuY29uY2F0QnVmZmVycygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJIT0Fsb2FkZXI6IGFsbCBidWZmZXJzIGxvYWRlZCBhbmQgY29uY2F0ZW5hdGVkXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICBzY29wZS5vbkxvYWQoc2NvcGUuY29uY2F0QnVmZmVyKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24oZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignZGVjb2RlQXVkaW9EYXRhIGVycm9yJywgZXJyb3IpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICByZXF1ZXN0Lm9uZXJyb3IgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGFsZXJ0KCdIT0Fsb2FkZXI6IFhIUiBlcnJvcicpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmVxdWVzdC5zZW5kKCk7XG4gICAgfVxuXG4gICAgbG9hZCgpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm5DaEdyb3VwczsgKytpKSB0aGlzLmxvYWRCdWZmZXJzKHRoaXMudXJsc1tpXSwgaSk7XG4gICAgfVxuXG4gICAgY29uY2F0QnVmZmVycygpIHtcblxuICAgICAgICBpZiAoIXRoaXMubG9hZGVkKSByZXR1cm47XG5cbiAgICAgICAgdmFyIG5DaCA9IHRoaXMubkNoO1xuICAgICAgICB2YXIgbkNoR3JvdXBzID0gdGhpcy5uQ2hHcm91cHM7XG5cbiAgICAgICAgdmFyIGxlbmd0aCA9IHRoaXMuYnVmZmVyc1swXS5sZW5ndGg7XG4gICAgICAgIHZhciBzcmF0ZSA9IHRoaXMuYnVmZmVyc1swXS5zYW1wbGVSYXRlO1xuICAgICAgICBcbiAgICAgICAgLy8gRGV0ZWN0IGlmIHRoZSA4LWNoIGF1ZGlvIGZpbGUgaXMgT0dHIGFuZCBpZiB0aGUgYnJvd3NlciBpcyBDaHJvbWUsXG4gICAgICAgIC8vIHRoZW4gcmVtYXAgOC1jaGFubmVsIGZpbGVzIHRvIHRoZSBjb3JyZWN0IG9yZGVyIGNhdXNlIENocm9tZSBtZXNzZSBpdCB1cCB3aGVuIGxvYWRpbmdcbiAgICAgICAgLy8gRmlyZWZveCBkb2VzIG5vdCBoYXZlIHRoaXMgaXNzdWUuIDhjaCBXYXZlIGZpbGVzIHdvcmsgZmluZSBmb3IgYm90aCBicm93c2Vycy5cbiAgICAgICAgdmFyIHJlbWFwOENoYW5GaWxlID0gWzEsMiwzLDQsNSw2LDcsOF07XG4gICAgICAgIHZhciBpc0Nocm9tZSA9ICEhd2luZG93LmNocm9tZVxuICAgICAgICBpZiAoaXNDaHJvbWUgJiYgdGhpcy5maWxlRXh0LnRvTG93ZXJDYXNlKCkgPT0gXCJvZ2dcIikge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJMb2FkaW5nIG9mIDhjaGFuIE9HRyBmaWxlcyB1c2luZyBDaHJvbWU6IHJlbWFwIGNoYW5uZWxzIHRvIGNvcnJlY3Qgb3JkZXIhXCIpXG4gICAgICAgICAgICByZW1hcDhDaGFuRmlsZSA9IFsxLDMsMiw3LDgsNSw2LDRdO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jb25jYXRCdWZmZXIgPSB0aGlzLmNvbnRleHQuY3JlYXRlQnVmZmVyKG5DaCwgbGVuZ3RoLCBzcmF0ZSk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbkNoR3JvdXBzOyBpKyspIHtcbiAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgdGhpcy5idWZmZXJzW2ldLm51bWJlck9mQ2hhbm5lbHM7IGorKykge1xuICAgICAgICAgICAgICAgIHRoaXMuY29uY2F0QnVmZmVyLmdldENoYW5uZWxEYXRhKGkgKiA4ICsgaikuc2V0KHRoaXMuYnVmZmVyc1tpXS5nZXRDaGFubmVsRGF0YShyZW1hcDhDaGFuRmlsZVtqXS0xKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG4iXX0=