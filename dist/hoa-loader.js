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

            // Detect if the 8-ch audio file is OGG, then remap 8-channel files to the correct
            // order cause Chrome and Firefox messes it up when loading. Other browsers have not
            // been tested with OGG files. 8ch Wave files work fine for both browsers.
            var remap8ChanFile = [1, 2, 3, 4, 5, 6, 7, 8];
            if (this.fileExt.toLowerCase() == "ogg") {
                console.log("Loading of 8chan OGG files [Chrome/Firefox]: remap channels to correct order!");
                remap8ChanFile = [1, 3, 2, 7, 8, 5, 6, 4];
                //remap8ChanFile = [1,3,2,8,6,7,4,5];
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
//# sourceMappingURL=data:application/json;base64,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LEVBQWEsQ0FBYixFQUFlLENBQWYsQ0FBakI7O0FBRUg7O0FBRUQsaUJBQUssWUFBTCxHQUFvQixLQUFLLE9BQUwsQ0FBYSxZQUFiLENBQTBCLEdBQTFCLEVBQStCLE1BQS9CLEVBQXVDLEtBQXZDLENBQXBCO0FBQ0EsaUJBQUssSUFBSSxJQUFJLENBQWIsRUFBZ0IsSUFBSSxTQUFwQixFQUErQixHQUEvQixFQUFvQztBQUNoQyxxQkFBSyxJQUFJLElBQUksQ0FBYixFQUFnQixJQUFJLEtBQUssT0FBTCxDQUFhLENBQWIsRUFBZ0IsZ0JBQXBDLEVBQXNELEdBQXRELEVBQTJEO0FBQ3ZELHlCQUFLLFlBQUwsQ0FBa0IsY0FBbEIsQ0FBaUMsSUFBSSxDQUFKLEdBQVEsQ0FBekMsRUFBNEMsR0FBNUMsQ0FBZ0QsS0FBSyxPQUFMLENBQWEsQ0FBYixFQUFnQixjQUFoQixDQUErQixlQUFlLENBQWYsSUFBa0IsQ0FBakQsQ0FBaEQ7QUFDSDtBQUNKO0FBQ0o7Ozs7O2tCQXBHZ0IsUyIsImZpbGUiOiJob2EtbG9hZGVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vICBBcmNob250aXMgUG9saXRpc1xuLy8gIGFyY2hvbnRpcy5wb2xpdGlzQGFhbHRvLmZpXG4vLyAgRGF2aWQgUG9pcmllci1RdWlub3Rcbi8vICBkYXZpcG9pckBpcmNhbS5mclxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vXG4vLyAgSlNBbWJpc29uaWNzIGEgSmF2YVNjcmlwdCBsaWJyYXJ5IGZvciBoaWdoZXItb3JkZXIgQW1iaXNvbmljc1xuLy8gIFRoZSBsaWJyYXJ5IGltcGxlbWVudHMgV2ViIEF1ZGlvIGJsb2NrcyB0aGF0IHBlcmZvcm1cbi8vICB0eXBpY2FsIGFtYmlzb25pYyBwcm9jZXNzaW5nIG9wZXJhdGlvbnMgb24gYXVkaW8gc2lnbmFscy5cbi8vXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4vLy8vLy8vLy8vLy8vLy8vXG4vKiBIT0EgTE9BREVSICovXG4vLy8vLy8vLy8vLy8vLy8vXG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEhPQWxvYWRlciB7XG4gICAgY29uc3RydWN0b3IoY29udGV4dCwgb3JkZXIsIHVybCwgY2FsbGJhY2spIHtcbiAgICAgICAgdGhpcy5jb250ZXh0ID0gY29udGV4dDtcbiAgICAgICAgdGhpcy5vcmRlciA9IG9yZGVyO1xuICAgICAgICB0aGlzLm5DaCA9IChvcmRlciArIDEpICogKG9yZGVyICsgMSk7XG4gICAgICAgIHRoaXMubkNoR3JvdXBzID0gTWF0aC5jZWlsKHRoaXMubkNoIC8gOCk7XG4gICAgICAgIHRoaXMuYnVmZmVycyA9IG5ldyBBcnJheSgpO1xuICAgICAgICB0aGlzLmxvYWRDb3VudCA9IDA7XG4gICAgICAgIHRoaXMubG9hZGVkID0gZmFsc2U7XG4gICAgICAgIHRoaXMub25Mb2FkID0gY2FsbGJhY2s7XG4gICAgICAgIHRoaXMudXJscyA9IG5ldyBBcnJheSh0aGlzLm5DaEdyb3Vwcyk7XG5cbiAgICAgICAgdmFyIGZpbGVFeHQgPSB1cmwuc2xpY2UodXJsLmxlbmd0aCAtIDMsIHVybC5sZW5ndGgpO1xuICAgICAgICB0aGlzLmZpbGVFeHQgPSBmaWxlRXh0O1xuXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5uQ2hHcm91cHM7IGkrKykge1xuXG4gICAgICAgICAgICBpZiAoaSA9PSB0aGlzLm5DaEdyb3VwcyAtIDEpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnVybHNbaV0gPSB1cmwuc2xpY2UoMCwgdXJsLmxlbmd0aCAtIDQpICsgXCJfXCIgKyBwYWQoaSAqIDggKyAxLCAyKSArIFwiLVwiICsgcGFkKHRoaXMubkNoLCAyKSArIFwiY2guXCIgKyBmaWxlRXh0O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLnVybHNbaV0gPSB1cmwuc2xpY2UoMCwgdXJsLmxlbmd0aCAtIDQpICsgXCJfXCIgKyBwYWQoaSAqIDggKyAxLCAyKSArIFwiLVwiICsgcGFkKGkgKiA4ICsgOCwgMikgKyBcImNoLlwiICsgZmlsZUV4dDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIHBhZChudW0sIHNpemUpIHtcbiAgICAgICAgICAgIHJldHVybiAoJzAwMDAwMDAwMCcgKyBudW0pLnN1YnN0cigtc2l6ZSk7XG4gICAgICAgIH1cblxuICAgIH1cblxuICAgIGxvYWRCdWZmZXJzKHVybCwgaW5kZXgpIHtcbiAgICAgICAgLy8gTG9hZCBidWZmZXIgYXN5bmNocm9ub3VzbHlcbiAgICAgICAgdmFyIHJlcXVlc3QgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcbiAgICAgICAgcmVxdWVzdC5vcGVuKFwiR0VUXCIsIHVybCwgdHJ1ZSk7XG4gICAgICAgIHJlcXVlc3QucmVzcG9uc2VUeXBlID0gXCJhcnJheWJ1ZmZlclwiO1xuXG4gICAgICAgIHZhciBzY29wZSA9IHRoaXM7XG5cbiAgICAgICAgcmVxdWVzdC5vbmxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIC8vIEFzeW5jaHJvbm91c2x5IGRlY29kZSB0aGUgYXVkaW8gZmlsZSBkYXRhIGluIHJlcXVlc3QucmVzcG9uc2VcbiAgICAgICAgICAgIHNjb3BlLmNvbnRleHQuZGVjb2RlQXVkaW9EYXRhKFxuICAgICAgICAgICAgICAgIHJlcXVlc3QucmVzcG9uc2UsXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24oYnVmZmVyKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghYnVmZmVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhbGVydCgnZXJyb3IgZGVjb2RpbmcgZmlsZSBkYXRhOiAnICsgdXJsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBzY29wZS5idWZmZXJzW2luZGV4XSA9IGJ1ZmZlcjtcbiAgICAgICAgICAgICAgICAgICAgc2NvcGUubG9hZENvdW50Kys7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzY29wZS5sb2FkQ291bnQgPT0gc2NvcGUubkNoR3JvdXBzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzY29wZS5sb2FkZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgc2NvcGUuY29uY2F0QnVmZmVycygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJIT0Fsb2FkZXI6IGFsbCBidWZmZXJzIGxvYWRlZCBhbmQgY29uY2F0ZW5hdGVkXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICBzY29wZS5vbkxvYWQoc2NvcGUuY29uY2F0QnVmZmVyKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24oZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgYWxlcnQoXCJCcm93c2VyIGNhbm5vdCBkZWNvZGUgYXVkaW8gZGF0YTogIFwiICsgIHVybCArIFwiXFxuXFxuRXJyb3I6IFwiICsgZXJyb3IgKyBcIlxcblxcbihJZiB5b3UgcmUgdXNpbmcgU2FmYXJpIGFuZCBnZXQgYSBudWxsIGVycm9yLCB0aGlzIGlzIG1vc3QgbGlrZWx5IGR1ZSB0byBBcHBsZSdzIHNoYWR5IHBsYW4gZ29pbmcgb24gdG8gc3RvcCB0aGUgLm9nZyBmb3JtYXQgZnJvbSBlYXNpbmcgd2ViIGRldmVsb3BlcidzIGxpZmUgOilcIik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJlcXVlc3Qub25lcnJvciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgYWxlcnQoJ0hPQWxvYWRlcjogWEhSIGVycm9yJyk7XG4gICAgICAgIH1cblxuICAgICAgICByZXF1ZXN0LnNlbmQoKTtcbiAgICB9XG5cbiAgICBsb2FkKCkge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubkNoR3JvdXBzOyArK2kpIHRoaXMubG9hZEJ1ZmZlcnModGhpcy51cmxzW2ldLCBpKTtcbiAgICB9XG5cbiAgICBjb25jYXRCdWZmZXJzKCkge1xuXG4gICAgICAgIGlmICghdGhpcy5sb2FkZWQpIHJldHVybjtcblxuICAgICAgICB2YXIgbkNoID0gdGhpcy5uQ2g7XG4gICAgICAgIHZhciBuQ2hHcm91cHMgPSB0aGlzLm5DaEdyb3VwcztcblxuICAgICAgICB2YXIgbGVuZ3RoID0gdGhpcy5idWZmZXJzWzBdLmxlbmd0aDtcbiAgICAgICAgdGhpcy5idWZmZXJzLmZvckVhY2goIChiKSA9PiB7bGVuZ3RoID0gTWF0aC5tYXgobGVuZ3RoLCBiLmxlbmd0aCl9KTtcbiAgICAgICAgdmFyIHNyYXRlID0gdGhpcy5idWZmZXJzWzBdLnNhbXBsZVJhdGU7XG4gICAgICAgIFxuICAgICAgICAvLyBEZXRlY3QgaWYgdGhlIDgtY2ggYXVkaW8gZmlsZSBpcyBPR0csIHRoZW4gcmVtYXAgOC1jaGFubmVsIGZpbGVzIHRvIHRoZSBjb3JyZWN0XG4gICAgICAgIC8vIG9yZGVyIGNhdXNlIENocm9tZSBhbmQgRmlyZWZveCBtZXNzZXMgaXQgdXAgd2hlbiBsb2FkaW5nLiBPdGhlciBicm93c2VycyBoYXZlIG5vdFxuICAgICAgICAvLyBiZWVuIHRlc3RlZCB3aXRoIE9HRyBmaWxlcy4gOGNoIFdhdmUgZmlsZXMgd29yayBmaW5lIGZvciBib3RoIGJyb3dzZXJzLlxuICAgICAgICB2YXIgcmVtYXA4Q2hhbkZpbGUgPSBbMSwyLDMsNCw1LDYsNyw4XTtcbiAgICAgICAgaWYgKHRoaXMuZmlsZUV4dC50b0xvd2VyQ2FzZSgpID09IFwib2dnXCIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiTG9hZGluZyBvZiA4Y2hhbiBPR0cgZmlsZXMgW0Nocm9tZS9GaXJlZm94XTogcmVtYXAgY2hhbm5lbHMgdG8gY29ycmVjdCBvcmRlciFcIilcbiAgICAgICAgICAgIHJlbWFwOENoYW5GaWxlID0gWzEsMywyLDcsOCw1LDYsNF07XG4gICAgICAgICAgICAvL3JlbWFwOENoYW5GaWxlID0gWzEsMywyLDgsNiw3LDQsNV07XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmNvbmNhdEJ1ZmZlciA9IHRoaXMuY29udGV4dC5jcmVhdGVCdWZmZXIobkNoLCBsZW5ndGgsIHNyYXRlKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBuQ2hHcm91cHM7IGkrKykge1xuICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCB0aGlzLmJ1ZmZlcnNbaV0ubnVtYmVyT2ZDaGFubmVsczsgaisrKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jb25jYXRCdWZmZXIuZ2V0Q2hhbm5lbERhdGEoaSAqIDggKyBqKS5zZXQodGhpcy5idWZmZXJzW2ldLmdldENoYW5uZWxEYXRhKHJlbWFwOENoYW5GaWxlW2pdLTEpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cbiJdfQ==