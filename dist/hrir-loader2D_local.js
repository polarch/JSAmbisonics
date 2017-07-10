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
////////////////////////////////////////////////////////////////////
//
//  HRIRloader for 2D use
//  adapted by Thomas Deppisch
//  thomas.deppisch93@gmail.com
//
////////////////////////////////////////////////////////////////////
///////////////////
/* HRIR LOADER 2D*/
///////////////////

var utils = require("./utils.js");

var HRIRloader2D_local = function () {
    function HRIRloader2D_local(context, order, callback) {
        (0, _classCallCheck3.default)(this, HRIRloader2D_local);

        this.context = context;
        this.order = order;
        this.nCh = 2 * order + 1;
        // function called when filters loaded
        this.onLoad = callback;
        // define required virtual speaker positions based on Ambisonic order
        this.vls_dirs_deg = sampleCircle(2 * this.order + 2); //2n+2 virtual speakers for 2D
        this.nVLS = this.vls_dirs_deg.length;
        // angular resolution for fast lookup to closest HRIR to a given direction
        this.nearestLookupRes = [5, 5];
    }

    (0, _createClass3.default)(HRIRloader2D_local, [{
        key: "load",
        value: function load(setUrl) {

            var self = this;
            // setup the request
            var requestHrir = new XMLHttpRequest();
            requestHrir.open("GET", setUrl, true);
            requestHrir.responseType = "json";
            requestHrir.onload = function () {
                // load useful HRIR stuff from JSON
                self.parseHrirFromJSON(requestHrir.response);
                // construct lookup table for fast closest HRIR finding
                self.nearestLookup = utils.createNearestLookup(self.hrir_dirs_deg, self.nearestLookupRes);
                // find closest indices to VLS
                var nearestIdx = utils.findNearest(self.vls_dirs_deg, self.nearestLookup, self.nearestLookupRes);
                // get closest HRIRs to the VLS design
                self.nearest_dirs_deg = self.getClosestDirs(nearestIdx, self.hrir_dirs_deg);
                self.vls_hrirs = self.getClosestHrirFilters(nearestIdx, self.hrirs);
                // compute ambisonic decoding filters
                self.computeDecFilters();
            };
            requestHrir.send(); // Send the Request and Load the File
        }
    }, {
        key: "parseHrirFromJSON",
        value: function parseHrirFromJSON(hrirSet) {
            var self = this;
            this.fs = hrirSet.leaves[6].data[0]; // samplerate of the set
            this.nHrirs = hrirSet.leaves[4].data.length; // number of HRIR measurements
            this.nSamples = hrirSet.leaves[8].data[0][1].length; // length of HRIRs
            // parse azimuth-elevation of HRIRs
            this.hrir_dirs_deg = [];
            hrirSet.leaves[4].data.forEach(function (element) {
                self.hrir_dirs_deg.push([element[0], element[1]]);
            });
            // parse HRIR buffers
            this.hrirs = [];
            hrirSet.leaves[8].data.forEach(function (element) {
                var left = new Float64Array(element[0]);
                var right = new Float64Array(element[1]);
                self.hrirs.push([left, right]);
            });
        }
    }, {
        key: "getClosestDirs",
        value: function getClosestDirs(nearestIdx, hrir_dirs_deg) {
            // getClosestHrirFilters(target_dirs_deg, hrir_dirs_deg, INFO) {
            var nDirs = nearestIdx.length;
            var nearest_dirs_deg = [];
            for (var _i = 0; _i < nDirs; _i++) {
                // get available positions (in the HRIR set) nearest from the required speakers positions
                nearest_dirs_deg.push(hrir_dirs_deg[nearestIdx[_i]]);
            }
            return nearest_dirs_deg;
            //        if (INFO) {
            //            // compare required vs. present positions in HRIR filter
            //            let angularDistDeg = 0;
            //            for (let i = 0; i < nDirs; i++) {
            //                if (this.target_dirs_deg[i][0] < 0) this.target_dirs_deg[i][0] += 360.0;
            //                angularDistDeg += Math.sqrt(
            //                                            Math.pow(this.target_dirs_deg[i][0] - grantedFilterPos[i][0], 2) +
            //                                            Math.pow(this.target_dirs_deg[i][1] - grantedFilterPos[i][1], 2));
            //                // console.log('asked / granted pos: ', this.wishedSpeakerPos[i], '/', grantedFilterPos[i]);
            //            }
            //            console.log('summed / average angular dist between target and actual pos:',
            //                        Math.round(angularDistDeg*100)/100, 'deg /',
            //                        Math.round( (angularDistDeg/this.wishedSpeakerPos.length) *100)/100, 'deg');
            //        }
        }
    }, {
        key: "getClosestHrirFilters",
        value: function getClosestHrirFilters(nearestIdx, hrirs) {

            var nDirs = nearestIdx.length;
            var nearest_hrirs = [];
            for (var _i2 = 0; _i2 < nDirs; _i2++) {
                // get respective hrirs
                nearest_hrirs.push(hrirs[nearestIdx[_i2]]);
            }
            return nearest_hrirs;
        }
    }, {
        key: "computeDecFilters",
        value: function computeDecFilters() {

            // max rE optimization
            var a_n = [];
            a_n.push(1);
            for (i = 1; i < this.order + 1; i++) {
                a_n.push(Math.cos(i * Math.PI / this.nCh));
                a_n.push(Math.cos(i * Math.PI / this.nCh));
            }
            var diagA = numeric.diag(a_n);
            // get decoding matrix
            this.decodingMatrix = numeric.transpose(getCircHarmonics(this.order, getColumn(this.nearest_dirs_deg, 0)));
            this.decodingMatrix = numeric.dot(this.decodingMatrix, diagA);
            // normalise to number of speakers
            this.decodingMatrix = numeric.mul(2 * Math.PI / this.vls_dirs_deg.length, this.decodingMatrix);
            // convert hrir filters to hoa filters
            this.hoaBuffer = this.getHoaFilterFromHrirFilter(this.nCh, this.nSamples, this.fs, this.vls_hrirs, this.decodingMatrix);
            // pass resulting hoa filters to user callback
            this.onLoad(this.hoaBuffer);
        }
    }, {
        key: "getHoaFilterFromHrirFilter",
        value: function getHoaFilterFromHrirFilter(nCh, nSamples, sampleRate, hrirs, decodingMatrix) {
            // create empty buffer ready to receive hoa filters
            if (nSamples > hrirs[0][0].length) nSamples = hrirs[0][0].length;
            var hoaBuffer = this.context.createBuffer(nCh, nSamples, sampleRate);

            // sum weighted HRIR over Ambisonic channels to create HOA IRs
            for (var _i3 = 0; _i3 < nCh; _i3++) {
                var concatBufferArrayLeft = new Float32Array(nSamples);
                for (var j = 0; j < hrirs.length; j++) {
                    for (var k = 0; k < nSamples; k++) {
                        concatBufferArrayLeft[k] += decodingMatrix[j][_i3] * hrirs[j][0][k];
                    }
                }
                hoaBuffer.getChannelData(_i3).set(concatBufferArrayLeft);
            }
            return hoaBuffer;
        }
    }]);
    return HRIRloader2D_local;
}();

exports.default = HRIRloader2D_local;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImhyaXItbG9hZGVyMkRfbG9jYWwuanMiXSwibmFtZXMiOlsidXRpbHMiLCJyZXF1aXJlIiwiSFJJUmxvYWRlcjJEX2xvY2FsIiwiY29udGV4dCIsIm9yZGVyIiwiY2FsbGJhY2siLCJuQ2giLCJvbkxvYWQiLCJ2bHNfZGlyc19kZWciLCJzYW1wbGVDaXJjbGUiLCJuVkxTIiwibGVuZ3RoIiwibmVhcmVzdExvb2t1cFJlcyIsInNldFVybCIsInNlbGYiLCJyZXF1ZXN0SHJpciIsIlhNTEh0dHBSZXF1ZXN0Iiwib3BlbiIsInJlc3BvbnNlVHlwZSIsIm9ubG9hZCIsInBhcnNlSHJpckZyb21KU09OIiwicmVzcG9uc2UiLCJuZWFyZXN0TG9va3VwIiwiY3JlYXRlTmVhcmVzdExvb2t1cCIsImhyaXJfZGlyc19kZWciLCJuZWFyZXN0SWR4IiwiZmluZE5lYXJlc3QiLCJuZWFyZXN0X2RpcnNfZGVnIiwiZ2V0Q2xvc2VzdERpcnMiLCJ2bHNfaHJpcnMiLCJnZXRDbG9zZXN0SHJpckZpbHRlcnMiLCJocmlycyIsImNvbXB1dGVEZWNGaWx0ZXJzIiwic2VuZCIsImhyaXJTZXQiLCJmcyIsImxlYXZlcyIsImRhdGEiLCJuSHJpcnMiLCJuU2FtcGxlcyIsImZvckVhY2giLCJlbGVtZW50IiwicHVzaCIsImxlZnQiLCJGbG9hdDY0QXJyYXkiLCJyaWdodCIsIm5EaXJzIiwiaSIsIm5lYXJlc3RfaHJpcnMiLCJhX24iLCJNYXRoIiwiY29zIiwiUEkiLCJkaWFnQSIsIm51bWVyaWMiLCJkaWFnIiwiZGVjb2RpbmdNYXRyaXgiLCJ0cmFuc3Bvc2UiLCJnZXRDaXJjSGFybW9uaWNzIiwiZ2V0Q29sdW1uIiwiZG90IiwibXVsIiwiaG9hQnVmZmVyIiwiZ2V0SG9hRmlsdGVyRnJvbUhyaXJGaWx0ZXIiLCJzYW1wbGVSYXRlIiwiY3JlYXRlQnVmZmVyIiwiY29uY2F0QnVmZmVyQXJyYXlMZWZ0IiwiRmxvYXQzMkFycmF5IiwiaiIsImsiLCJnZXRDaGFubmVsRGF0YSIsInNldCJd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RUFBWXBCLE1BQXZCO0FBQ2pDLGdCQUFJbUQsWUFBWSxLQUFLM0QsT0FBTCxDQUFhOEQsWUFBYixDQUEwQjNELEdBQTFCLEVBQStCaUMsUUFBL0IsRUFBeUN5QixVQUF6QyxDQUFoQjs7QUFFQTtBQUNBLGlCQUFLLElBQUlqQixNQUFJLENBQWIsRUFBZ0JBLE1BQUl6QyxHQUFwQixFQUF5QnlDLEtBQXpCLEVBQThCO0FBQzFCLG9CQUFJbUIsd0JBQXdCLElBQUlDLFlBQUosQ0FBaUI1QixRQUFqQixDQUE1QjtBQUNBLHFCQUFLLElBQUk2QixJQUFJLENBQWIsRUFBZ0JBLElBQUlyQyxNQUFNcEIsTUFBMUIsRUFBa0N5RCxHQUFsQyxFQUF1QztBQUNuQyx5QkFBSyxJQUFJQyxJQUFJLENBQWIsRUFBZ0JBLElBQUk5QixRQUFwQixFQUE4QjhCLEdBQTlCLEVBQW1DO0FBQy9CSCw4Q0FBc0JHLENBQXRCLEtBQTRCYixlQUFlWSxDQUFmLEVBQWtCckIsR0FBbEIsSUFBdUJoQixNQUFNcUMsQ0FBTixFQUFTLENBQVQsRUFBWUMsQ0FBWixDQUFuRDtBQUNIO0FBQ0o7QUFDRFAsMEJBQVVRLGNBQVYsQ0FBeUJ2QixHQUF6QixFQUE0QndCLEdBQTVCLENBQWdDTCxxQkFBaEM7QUFDSDtBQUNELG1CQUFPSixTQUFQO0FBQ0g7Ozs7O2tCQWpJZ0I1RCxrQiIsImZpbGUiOiJocmlyLWxvYWRlcjJEX2xvY2FsLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vICBBcmNob250aXMgUG9saXRpcyAoQWFsdG8gVW5pdmVyc2l0eSlcbi8vICBhcmNob250aXMucG9saXRpc0BhYWx0by5maVxuLy8gIERhdmlkIFBvaXJpZXItUXVpbm90IChJUkNBTSlcbi8vICBkYXZpcG9pckBpcmNhbS5mclxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vXG4vLyAgSlNBbWJpc29uaWNzIGEgSmF2YVNjcmlwdCBsaWJyYXJ5IGZvciBoaWdoZXItb3JkZXIgQW1iaXNvbmljc1xuLy8gIFRoZSBsaWJyYXJ5IGltcGxlbWVudHMgV2ViIEF1ZGlvIGJsb2NrcyB0aGF0IHBlcmZvcm1cbi8vICB0eXBpY2FsIGFtYmlzb25pYyBwcm9jZXNzaW5nIG9wZXJhdGlvbnMgb24gYXVkaW8gc2lnbmFscy5cbi8vXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vXG4vLyAgSFJJUmxvYWRlciBmb3IgMkQgdXNlXG4vLyAgYWRhcHRlZCBieSBUaG9tYXMgRGVwcGlzY2hcbi8vICB0aG9tYXMuZGVwcGlzY2g5M0BnbWFpbC5jb21cbi8vXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLy8vLy8vLy8vLy8vLy8vL1xuLyogSFJJUiBMT0FERVIgMkQqL1xuLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG52YXIgdXRpbHMgPSByZXF1aXJlKFwiLi91dGlscy5qc1wiKTtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgSFJJUmxvYWRlcjJEX2xvY2FsIHtcbiAgICBjb25zdHJ1Y3Rvcihjb250ZXh0LCBvcmRlciwgY2FsbGJhY2spIHtcbiAgICAgICAgdGhpcy5jb250ZXh0ID0gY29udGV4dDtcbiAgICAgICAgdGhpcy5vcmRlciA9IG9yZGVyO1xuICAgICAgICB0aGlzLm5DaCA9IDIqb3JkZXIgKyAxO1xuICAgICAgICAvLyBmdW5jdGlvbiBjYWxsZWQgd2hlbiBmaWx0ZXJzIGxvYWRlZFxuICAgICAgICB0aGlzLm9uTG9hZCA9IGNhbGxiYWNrO1xuICAgICAgICAvLyBkZWZpbmUgcmVxdWlyZWQgdmlydHVhbCBzcGVha2VyIHBvc2l0aW9ucyBiYXNlZCBvbiBBbWJpc29uaWMgb3JkZXJcbiAgICAgICAgdGhpcy52bHNfZGlyc19kZWcgPSBzYW1wbGVDaXJjbGUoMip0aGlzLm9yZGVyICsgMik7IC8vMm4rMiB2aXJ0dWFsIHNwZWFrZXJzIGZvciAyRFxuICAgICAgICB0aGlzLm5WTFMgPSB0aGlzLnZsc19kaXJzX2RlZy5sZW5ndGg7XG4gICAgICAgIC8vIGFuZ3VsYXIgcmVzb2x1dGlvbiBmb3IgZmFzdCBsb29rdXAgdG8gY2xvc2VzdCBIUklSIHRvIGEgZ2l2ZW4gZGlyZWN0aW9uXG4gICAgICAgIHRoaXMubmVhcmVzdExvb2t1cFJlcyA9IFs1LDVdO1xuICAgIH1cblxuICAgIGxvYWQoc2V0VXJsKSB7XG5cbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICAvLyBzZXR1cCB0aGUgcmVxdWVzdFxuICAgICAgICB2YXIgcmVxdWVzdEhyaXIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcbiAgICAgICAgcmVxdWVzdEhyaXIub3BlbihcIkdFVFwiLCBzZXRVcmwsIHRydWUpO1xuICAgICAgICByZXF1ZXN0SHJpci5yZXNwb25zZVR5cGUgPSBcImpzb25cIjtcbiAgICAgICAgcmVxdWVzdEhyaXIub25sb2FkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAvLyBsb2FkIHVzZWZ1bCBIUklSIHN0dWZmIGZyb20gSlNPTlxuICAgICAgICAgICAgc2VsZi5wYXJzZUhyaXJGcm9tSlNPTihyZXF1ZXN0SHJpci5yZXNwb25zZSk7XG4gICAgICAgICAgICAvLyBjb25zdHJ1Y3QgbG9va3VwIHRhYmxlIGZvciBmYXN0IGNsb3Nlc3QgSFJJUiBmaW5kaW5nXG4gICAgICAgICAgICBzZWxmLm5lYXJlc3RMb29rdXAgPSB1dGlscy5jcmVhdGVOZWFyZXN0TG9va3VwKHNlbGYuaHJpcl9kaXJzX2RlZywgc2VsZi5uZWFyZXN0TG9va3VwUmVzKTtcbiAgICAgICAgICAgIC8vIGZpbmQgY2xvc2VzdCBpbmRpY2VzIHRvIFZMU1xuICAgICAgICAgICAgbGV0IG5lYXJlc3RJZHggPSB1dGlscy5maW5kTmVhcmVzdChzZWxmLnZsc19kaXJzX2RlZywgc2VsZi5uZWFyZXN0TG9va3VwLCBzZWxmLm5lYXJlc3RMb29rdXBSZXMpO1xuICAgICAgICAgICAgLy8gZ2V0IGNsb3Nlc3QgSFJJUnMgdG8gdGhlIFZMUyBkZXNpZ25cbiAgICAgICAgICAgIHNlbGYubmVhcmVzdF9kaXJzX2RlZyA9IHNlbGYuZ2V0Q2xvc2VzdERpcnMobmVhcmVzdElkeCwgc2VsZi5ocmlyX2RpcnNfZGVnKTtcbiAgICAgICAgICAgIHNlbGYudmxzX2hyaXJzID0gc2VsZi5nZXRDbG9zZXN0SHJpckZpbHRlcnMobmVhcmVzdElkeCwgc2VsZi5ocmlycyk7XG4gICAgICAgICAgICAvLyBjb21wdXRlIGFtYmlzb25pYyBkZWNvZGluZyBmaWx0ZXJzXG4gICAgICAgICAgICBzZWxmLmNvbXB1dGVEZWNGaWx0ZXJzKCk7XG4gICAgICAgIH1cbiAgICAgICAgcmVxdWVzdEhyaXIuc2VuZCgpOyAvLyBTZW5kIHRoZSBSZXF1ZXN0IGFuZCBMb2FkIHRoZSBGaWxlXG4gICAgfVxuXG4gICAgcGFyc2VIcmlyRnJvbUpTT04oaHJpclNldCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHRoaXMuZnMgPSBocmlyU2V0LmxlYXZlc1s2XS5kYXRhWzBdOyAgICAgICAgICAgICAgICAgICAgLy8gc2FtcGxlcmF0ZSBvZiB0aGUgc2V0XG4gICAgICAgIHRoaXMubkhyaXJzID0gaHJpclNldC5sZWF2ZXNbNF0uZGF0YS5sZW5ndGg7ICAgICAgICAgICAgLy8gbnVtYmVyIG9mIEhSSVIgbWVhc3VyZW1lbnRzXG4gICAgICAgIHRoaXMublNhbXBsZXMgPSBocmlyU2V0LmxlYXZlc1s4XS5kYXRhWzBdWzFdLmxlbmd0aDsgICAgLy8gbGVuZ3RoIG9mIEhSSVJzXG4gICAgICAgIC8vIHBhcnNlIGF6aW11dGgtZWxldmF0aW9uIG9mIEhSSVJzXG4gICAgICAgIHRoaXMuaHJpcl9kaXJzX2RlZyA9IFtdO1xuICAgICAgICBocmlyU2V0LmxlYXZlc1s0XS5kYXRhLmZvckVhY2goZnVuY3Rpb24oZWxlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5ocmlyX2RpcnNfZGVnLnB1c2goW2VsZW1lbnRbMF0sIGVsZW1lbnRbMV1dKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAvLyBwYXJzZSBIUklSIGJ1ZmZlcnNcbiAgICAgICAgdGhpcy5ocmlycyA9IFtdO1xuICAgICAgICBocmlyU2V0LmxlYXZlc1s4XS5kYXRhLmZvckVhY2goZnVuY3Rpb24oZWxlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGxlZnQgPSBuZXcgRmxvYXQ2NEFycmF5KGVsZW1lbnRbMF0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHJpZ2h0ID0gbmV3IEZsb2F0NjRBcnJheShlbGVtZW50WzFdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuaHJpcnMucHVzaChbbGVmdCwgcmlnaHRdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgfVxuXG4gICAgZ2V0Q2xvc2VzdERpcnMobmVhcmVzdElkeCwgaHJpcl9kaXJzX2RlZykge1xuICAgIC8vIGdldENsb3Nlc3RIcmlyRmlsdGVycyh0YXJnZXRfZGlyc19kZWcsIGhyaXJfZGlyc19kZWcsIElORk8pIHtcbiAgICAgICAgdmFyIG5EaXJzID0gbmVhcmVzdElkeC5sZW5ndGg7XG4gICAgICAgIHZhciBuZWFyZXN0X2RpcnNfZGVnID0gW107XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbkRpcnM7IGkrKykge1xuICAgICAgICAgICAgLy8gZ2V0IGF2YWlsYWJsZSBwb3NpdGlvbnMgKGluIHRoZSBIUklSIHNldCkgbmVhcmVzdCBmcm9tIHRoZSByZXF1aXJlZCBzcGVha2VycyBwb3NpdGlvbnNcbiAgICAgICAgICAgIG5lYXJlc3RfZGlyc19kZWcucHVzaChocmlyX2RpcnNfZGVnW25lYXJlc3RJZHhbaV1dKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbmVhcmVzdF9kaXJzX2RlZztcbiAgICAgICAgLy8gICAgICAgIGlmIChJTkZPKSB7XG4gICAgICAgIC8vICAgICAgICAgICAgLy8gY29tcGFyZSByZXF1aXJlZCB2cy4gcHJlc2VudCBwb3NpdGlvbnMgaW4gSFJJUiBmaWx0ZXJcbiAgICAgICAgLy8gICAgICAgICAgICBsZXQgYW5ndWxhckRpc3REZWcgPSAwO1xuICAgICAgICAvLyAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbkRpcnM7IGkrKykge1xuICAgICAgICAvLyAgICAgICAgICAgICAgICBpZiAodGhpcy50YXJnZXRfZGlyc19kZWdbaV1bMF0gPCAwKSB0aGlzLnRhcmdldF9kaXJzX2RlZ1tpXVswXSArPSAzNjAuMDtcbiAgICAgICAgLy8gICAgICAgICAgICAgICAgYW5ndWxhckRpc3REZWcgKz0gTWF0aC5zcXJ0KFxuICAgICAgICAvLyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgTWF0aC5wb3codGhpcy50YXJnZXRfZGlyc19kZWdbaV1bMF0gLSBncmFudGVkRmlsdGVyUG9zW2ldWzBdLCAyKSArXG4gICAgICAgIC8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBNYXRoLnBvdyh0aGlzLnRhcmdldF9kaXJzX2RlZ1tpXVsxXSAtIGdyYW50ZWRGaWx0ZXJQb3NbaV1bMV0sIDIpKTtcbiAgICAgICAgLy8gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coJ2Fza2VkIC8gZ3JhbnRlZCBwb3M6ICcsIHRoaXMud2lzaGVkU3BlYWtlclBvc1tpXSwgJy8nLCBncmFudGVkRmlsdGVyUG9zW2ldKTtcbiAgICAgICAgLy8gICAgICAgICAgICB9XG4gICAgICAgIC8vICAgICAgICAgICAgY29uc29sZS5sb2coJ3N1bW1lZCAvIGF2ZXJhZ2UgYW5ndWxhciBkaXN0IGJldHdlZW4gdGFyZ2V0IGFuZCBhY3R1YWwgcG9zOicsXG4gICAgICAgIC8vICAgICAgICAgICAgICAgICAgICAgICAgTWF0aC5yb3VuZChhbmd1bGFyRGlzdERlZyoxMDApLzEwMCwgJ2RlZyAvJyxcbiAgICAgICAgLy8gICAgICAgICAgICAgICAgICAgICAgICBNYXRoLnJvdW5kKCAoYW5ndWxhckRpc3REZWcvdGhpcy53aXNoZWRTcGVha2VyUG9zLmxlbmd0aCkgKjEwMCkvMTAwLCAnZGVnJyk7XG4gICAgICAgIC8vICAgICAgICB9XG4gICAgfVxuXG4gICAgZ2V0Q2xvc2VzdEhyaXJGaWx0ZXJzKG5lYXJlc3RJZHgsIGhyaXJzKSB7XG5cbiAgICAgICAgdmFyIG5EaXJzID0gbmVhcmVzdElkeC5sZW5ndGg7XG4gICAgICAgIHZhciBuZWFyZXN0X2hyaXJzID0gW107XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbkRpcnM7IGkrKykge1xuICAgICAgICAgICAgLy8gZ2V0IHJlc3BlY3RpdmUgaHJpcnNcbiAgICAgICAgICAgIG5lYXJlc3RfaHJpcnMucHVzaChocmlyc1tuZWFyZXN0SWR4W2ldXSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5lYXJlc3RfaHJpcnM7XG4gICAgfVxuXG4gICAgY29tcHV0ZURlY0ZpbHRlcnMoKSB7XG5cbiAgICAgICAgLy8gbWF4IHJFIG9wdGltaXphdGlvblxuICAgICAgICB2YXIgYV9uID0gW107XG4gICAgICAgIGFfbi5wdXNoKDEpO1xuICAgICAgICBmb3IoaT0xO2k8KHRoaXMub3JkZXIrMSk7aSsrKXtcbiAgICAgICAgICBhX24ucHVzaChNYXRoLmNvcygoaSpNYXRoLlBJKS8odGhpcy5uQ2gpKSk7XG4gICAgICAgICAgYV9uLnB1c2goTWF0aC5jb3MoKGkqTWF0aC5QSSkvKHRoaXMubkNoKSkpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBkaWFnQSA9IG51bWVyaWMuZGlhZyhhX24pO1xuICAgICAgICAvLyBnZXQgZGVjb2RpbmcgbWF0cml4XG4gICAgICAgIHRoaXMuZGVjb2RpbmdNYXRyaXggPSBudW1lcmljLnRyYW5zcG9zZShnZXRDaXJjSGFybW9uaWNzKHRoaXMub3JkZXIsZ2V0Q29sdW1uKHRoaXMubmVhcmVzdF9kaXJzX2RlZywgMCkpKTtcbiAgICAgICAgdGhpcy5kZWNvZGluZ01hdHJpeCA9IG51bWVyaWMuZG90KHRoaXMuZGVjb2RpbmdNYXRyaXgsIGRpYWdBKTtcbiAgICAgICAgLy8gbm9ybWFsaXNlIHRvIG51bWJlciBvZiBzcGVha2Vyc1xuICAgICAgICB0aGlzLmRlY29kaW5nTWF0cml4ID0gbnVtZXJpYy5tdWwoKDIqTWF0aC5QSSkvdGhpcy52bHNfZGlyc19kZWcubGVuZ3RoLCB0aGlzLmRlY29kaW5nTWF0cml4KTtcbiAgICAgICAgLy8gY29udmVydCBocmlyIGZpbHRlcnMgdG8gaG9hIGZpbHRlcnNcbiAgICAgICAgdGhpcy5ob2FCdWZmZXIgPSB0aGlzLmdldEhvYUZpbHRlckZyb21IcmlyRmlsdGVyKHRoaXMubkNoLCB0aGlzLm5TYW1wbGVzLCB0aGlzLmZzLCB0aGlzLnZsc19ocmlycywgdGhpcy5kZWNvZGluZ01hdHJpeCk7XG4gICAgICAgIC8vIHBhc3MgcmVzdWx0aW5nIGhvYSBmaWx0ZXJzIHRvIHVzZXIgY2FsbGJhY2tcbiAgICAgICAgdGhpcy5vbkxvYWQodGhpcy5ob2FCdWZmZXIpO1xuICAgIH1cblxuICAgIGdldEhvYUZpbHRlckZyb21IcmlyRmlsdGVyKG5DaCwgblNhbXBsZXMsIHNhbXBsZVJhdGUsIGhyaXJzLCBkZWNvZGluZ01hdHJpeCkge1xuICAgICAgICAvLyBjcmVhdGUgZW1wdHkgYnVmZmVyIHJlYWR5IHRvIHJlY2VpdmUgaG9hIGZpbHRlcnNcbiAgICAgICAgaWYgKG5TYW1wbGVzPmhyaXJzWzBdWzBdLmxlbmd0aCkgblNhbXBsZXMgPSBocmlyc1swXVswXS5sZW5ndGg7XG4gICAgICAgIGxldCBob2FCdWZmZXIgPSB0aGlzLmNvbnRleHQuY3JlYXRlQnVmZmVyKG5DaCwgblNhbXBsZXMsIHNhbXBsZVJhdGUpO1xuXG4gICAgICAgIC8vIHN1bSB3ZWlnaHRlZCBIUklSIG92ZXIgQW1iaXNvbmljIGNoYW5uZWxzIHRvIGNyZWF0ZSBIT0EgSVJzXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbkNoOyBpKyspIHtcbiAgICAgICAgICAgIGxldCBjb25jYXRCdWZmZXJBcnJheUxlZnQgPSBuZXcgRmxvYXQzMkFycmF5KG5TYW1wbGVzKTtcbiAgICAgICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgaHJpcnMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBrID0gMDsgayA8IG5TYW1wbGVzOyBrKyspIHtcbiAgICAgICAgICAgICAgICAgICAgY29uY2F0QnVmZmVyQXJyYXlMZWZ0W2tdICs9IGRlY29kaW5nTWF0cml4W2pdW2ldICogaHJpcnNbal1bMF1ba107XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaG9hQnVmZmVyLmdldENoYW5uZWxEYXRhKGkpLnNldChjb25jYXRCdWZmZXJBcnJheUxlZnQpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBob2FCdWZmZXI7XG4gICAgfVxuXG59XG4iXX0=