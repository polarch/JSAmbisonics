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
        this.vls_dirs_deg = utils.sampleCircle(2 * this.order + 2); //2n+2 virtual speakers for 2D
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
            for (var i = 0; i < nDirs; i++) {
                // get available positions (in the HRIR set) nearest from the required speakers positions
                nearest_dirs_deg.push(hrir_dirs_deg[nearestIdx[i]]);
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
            for (var i = 0; i < nDirs; i++) {
                // get respective hrirs
                nearest_hrirs.push(hrirs[nearestIdx[i]]);
            }
            return nearest_hrirs;
        }
    }, {
        key: "computeDecFilters",
        value: function computeDecFilters() {

            // max rE optimization
            var a_n = [];
            a_n.push(1);
            for (var i = 1; i < this.order + 1; i++) {
                a_n.push(Math.cos(i * Math.PI / (2 * this.order + 2)));
                a_n.push(Math.cos(i * Math.PI / (2 * this.order + 2)));
            }
            var diagA = numeric.diag(a_n);
            // get decoding matrix
            this.decodingMatrix = numeric.transpose(utils.getCircHarmonics(this.order, utils.getColumn(this.vls_dirs_deg, 0)));
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
            for (var i = 0; i < nCh; i++) {
                var concatBufferArrayLeft = new Float32Array(nSamples);
                for (var j = 0; j < hrirs.length; j++) {
                    for (var k = 0; k < nSamples; k++) {
                        concatBufferArrayLeft[k] += decodingMatrix[j][i] * hrirs[j][0][k];
                    }
                }
                hoaBuffer.getChannelData(i).set(concatBufferArrayLeft);
            }
            return hoaBuffer;
        }
    }]);
    return HRIRloader2D_local;
}();

exports.default = HRIRloader2D_local;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImhyaXItbG9hZGVyMkRfbG9jYWwuanMiXSwibmFtZXMiOlsidXRpbHMiLCJyZXF1aXJlIiwiSFJJUmxvYWRlcjJEX2xvY2FsIiwiY29udGV4dCIsIm9yZGVyIiwiY2FsbGJhY2siLCJuQ2giLCJvbkxvYWQiLCJ2bHNfZGlyc19kZWciLCJzYW1wbGVDaXJjbGUiLCJuVkxTIiwibGVuZ3RoIiwibmVhcmVzdExvb2t1cFJlcyIsInNldFVybCIsInNlbGYiLCJyZXF1ZXN0SHJpciIsIlhNTEh0dHBSZXF1ZXN0Iiwib3BlbiIsInJlc3BvbnNlVHlwZSIsIm9ubG9hZCIsInBhcnNlSHJpckZyb21KU09OIiwicmVzcG9uc2UiLCJuZWFyZXN0TG9va3VwIiwiY3JlYXRlTmVhcmVzdExvb2t1cCIsImhyaXJfZGlyc19kZWciLCJuZWFyZXN0SWR4IiwiZmluZE5lYXJlc3QiLCJuZWFyZXN0X2RpcnNfZGVnIiwiZ2V0Q2xvc2VzdERpcnMiLCJ2bHNfaHJpcnMiLCJnZXRDbG9zZXN0SHJpckZpbHRlcnMiLCJocmlycyIsImNvbXB1dGVEZWNGaWx0ZXJzIiwic2VuZCIsImhyaXJTZXQiLCJmcyIsImxlYXZlcyIsImRhdGEiLCJuSHJpcnMiLCJuU2FtcGxlcyIsImZvckVhY2giLCJlbGVtZW50IiwicHVzaCIsImxlZnQiLCJGbG9hdDY0QXJyYXkiLCJyaWdodCIsIm5EaXJzIiwiaSIsIm5lYXJlc3RfaHJpcnMiLCJhX24iLCJNYXRoIiwiY29zIiwiUEkiLCJkaWFnQSIsIm51bWVyaWMiLCJkaWFnIiwiZGVjb2RpbmdNYXRyaXgiLCJ0cmFuc3Bvc2UiLCJnZXRDaXJjSGFybW9uaWNzIiwiZ2V0Q29sdW1uIiwiZG90IiwibXVsIiwiaG9hQnVmZmVyIiwiZ2V0SG9hRmlsdGVyRnJvbUhyaXJGaWx0ZXIiLCJzYW1wbGVSYXRlIiwiY3JlYXRlQnVmZmVyIiwiY29uY2F0QnVmZmVyQXJyYXlMZWZ0IiwiRmxvYXQzMkFycmF5IiwiaiIsImsiLCJnZXRDaGFubmVsRGF0YSIsInNldCJd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LGdCQUFJakIsV0FBU1IsTUFBTSxDQUFOLEVBQVMsQ0FBVCxFQUFZcEIsTUFBekIsRUFBaUM0QixXQUFXUixNQUFNLENBQU4sRUFBUyxDQUFULEVBQVlwQixNQUF2QjtBQUNqQyxnQkFBSW1ELFlBQVksS0FBSzNELE9BQUwsQ0FBYThELFlBQWIsQ0FBMEIzRCxHQUExQixFQUErQmlDLFFBQS9CLEVBQXlDeUIsVUFBekMsQ0FBaEI7O0FBRUE7QUFDQSxpQkFBSyxJQUFJakIsSUFBSSxDQUFiLEVBQWdCQSxJQUFJekMsR0FBcEIsRUFBeUJ5QyxHQUF6QixFQUE4QjtBQUMxQixvQkFBSW1CLHdCQUF3QixJQUFJQyxZQUFKLENBQWlCNUIsUUFBakIsQ0FBNUI7QUFDQSxxQkFBSyxJQUFJNkIsSUFBSSxDQUFiLEVBQWdCQSxJQUFJckMsTUFBTXBCLE1BQTFCLEVBQWtDeUQsR0FBbEMsRUFBdUM7QUFDbkMseUJBQUssSUFBSUMsSUFBSSxDQUFiLEVBQWdCQSxJQUFJOUIsUUFBcEIsRUFBOEI4QixHQUE5QixFQUFtQztBQUMvQkgsOENBQXNCRyxDQUF0QixLQUE0QmIsZUFBZVksQ0FBZixFQUFrQnJCLENBQWxCLElBQXVCaEIsTUFBTXFDLENBQU4sRUFBUyxDQUFULEVBQVlDLENBQVosQ0FBbkQ7QUFDSDtBQUNKO0FBQ0RQLDBCQUFVUSxjQUFWLENBQXlCdkIsQ0FBekIsRUFBNEJ3QixHQUE1QixDQUFnQ0wscUJBQWhDO0FBQ0g7QUFDRCxtQkFBT0osU0FBUDtBQUNIOzs7OztrQkFqSWdCNUQsa0IiLCJmaWxlIjoiaHJpci1sb2FkZXIyRF9sb2NhbC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyAgQXJjaG9udGlzIFBvbGl0aXMgKEFhbHRvIFVuaXZlcnNpdHkpXG4vLyAgYXJjaG9udGlzLnBvbGl0aXNAYWFsdG8uZmlcbi8vICBEYXZpZCBQb2lyaWVyLVF1aW5vdCAoSVJDQU0pXG4vLyAgZGF2aXBvaXJAaXJjYW0uZnJcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vL1xuLy8gIEpTQW1iaXNvbmljcyBhIEphdmFTY3JpcHQgbGlicmFyeSBmb3IgaGlnaGVyLW9yZGVyIEFtYmlzb25pY3Ncbi8vICBUaGUgbGlicmFyeSBpbXBsZW1lbnRzIFdlYiBBdWRpbyBibG9ja3MgdGhhdCBwZXJmb3JtXG4vLyAgdHlwaWNhbCBhbWJpc29uaWMgcHJvY2Vzc2luZyBvcGVyYXRpb25zIG9uIGF1ZGlvIHNpZ25hbHMuXG4vL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vL1xuLy8gIEhSSVJsb2FkZXIgZm9yIDJEIHVzZVxuLy8gIGFkYXB0ZWQgYnkgVGhvbWFzIERlcHBpc2NoXG4vLyAgdGhvbWFzLmRlcHBpc2NoOTNAZ21haWwuY29tXG4vL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8vLy8vLy8vLy8vLy8vLy9cbi8qIEhSSVIgTE9BREVSIDJEKi9cbi8vLy8vLy8vLy8vLy8vLy8vLy9cblxudmFyIHV0aWxzID0gcmVxdWlyZShcIi4vdXRpbHMuanNcIik7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEhSSVJsb2FkZXIyRF9sb2NhbCB7XG4gICAgY29uc3RydWN0b3IoY29udGV4dCwgb3JkZXIsIGNhbGxiYWNrKSB7XG4gICAgICAgIHRoaXMuY29udGV4dCA9IGNvbnRleHQ7XG4gICAgICAgIHRoaXMub3JkZXIgPSBvcmRlcjtcbiAgICAgICAgdGhpcy5uQ2ggPSAyKm9yZGVyICsgMTtcbiAgICAgICAgLy8gZnVuY3Rpb24gY2FsbGVkIHdoZW4gZmlsdGVycyBsb2FkZWRcbiAgICAgICAgdGhpcy5vbkxvYWQgPSBjYWxsYmFjaztcbiAgICAgICAgLy8gZGVmaW5lIHJlcXVpcmVkIHZpcnR1YWwgc3BlYWtlciBwb3NpdGlvbnMgYmFzZWQgb24gQW1iaXNvbmljIG9yZGVyXG4gICAgICAgIHRoaXMudmxzX2RpcnNfZGVnID0gdXRpbHMuc2FtcGxlQ2lyY2xlKDIqdGhpcy5vcmRlciArIDIpOyAvLzJuKzIgdmlydHVhbCBzcGVha2VycyBmb3IgMkRcbiAgICAgICAgdGhpcy5uVkxTID0gdGhpcy52bHNfZGlyc19kZWcubGVuZ3RoO1xuICAgICAgICAvLyBhbmd1bGFyIHJlc29sdXRpb24gZm9yIGZhc3QgbG9va3VwIHRvIGNsb3Nlc3QgSFJJUiB0byBhIGdpdmVuIGRpcmVjdGlvblxuICAgICAgICB0aGlzLm5lYXJlc3RMb29rdXBSZXMgPSBbNSw1XTtcbiAgICB9XG5cbiAgICBsb2FkKHNldFVybCkge1xuXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgLy8gc2V0dXAgdGhlIHJlcXVlc3RcbiAgICAgICAgdmFyIHJlcXVlc3RIcmlyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG4gICAgICAgIHJlcXVlc3RIcmlyLm9wZW4oXCJHRVRcIiwgc2V0VXJsLCB0cnVlKTtcbiAgICAgICAgcmVxdWVzdEhyaXIucmVzcG9uc2VUeXBlID0gXCJqc29uXCI7XG4gICAgICAgIHJlcXVlc3RIcmlyLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgLy8gbG9hZCB1c2VmdWwgSFJJUiBzdHVmZiBmcm9tIEpTT05cbiAgICAgICAgICAgIHNlbGYucGFyc2VIcmlyRnJvbUpTT04ocmVxdWVzdEhyaXIucmVzcG9uc2UpO1xuICAgICAgICAgICAgLy8gY29uc3RydWN0IGxvb2t1cCB0YWJsZSBmb3IgZmFzdCBjbG9zZXN0IEhSSVIgZmluZGluZ1xuICAgICAgICAgICAgc2VsZi5uZWFyZXN0TG9va3VwID0gdXRpbHMuY3JlYXRlTmVhcmVzdExvb2t1cChzZWxmLmhyaXJfZGlyc19kZWcsIHNlbGYubmVhcmVzdExvb2t1cFJlcyk7XG4gICAgICAgICAgICAvLyBmaW5kIGNsb3Nlc3QgaW5kaWNlcyB0byBWTFNcbiAgICAgICAgICAgIGxldCBuZWFyZXN0SWR4ID0gdXRpbHMuZmluZE5lYXJlc3Qoc2VsZi52bHNfZGlyc19kZWcsIHNlbGYubmVhcmVzdExvb2t1cCwgc2VsZi5uZWFyZXN0TG9va3VwUmVzKTtcbiAgICAgICAgICAgIC8vIGdldCBjbG9zZXN0IEhSSVJzIHRvIHRoZSBWTFMgZGVzaWduXG4gICAgICAgICAgICBzZWxmLm5lYXJlc3RfZGlyc19kZWcgPSBzZWxmLmdldENsb3Nlc3REaXJzKG5lYXJlc3RJZHgsIHNlbGYuaHJpcl9kaXJzX2RlZyk7XG4gICAgICAgICAgICBzZWxmLnZsc19ocmlycyA9IHNlbGYuZ2V0Q2xvc2VzdEhyaXJGaWx0ZXJzKG5lYXJlc3RJZHgsIHNlbGYuaHJpcnMpO1xuICAgICAgICAgICAgLy8gY29tcHV0ZSBhbWJpc29uaWMgZGVjb2RpbmcgZmlsdGVyc1xuICAgICAgICAgICAgc2VsZi5jb21wdXRlRGVjRmlsdGVycygpO1xuICAgICAgICB9XG4gICAgICAgIHJlcXVlc3RIcmlyLnNlbmQoKTsgLy8gU2VuZCB0aGUgUmVxdWVzdCBhbmQgTG9hZCB0aGUgRmlsZVxuICAgIH1cblxuICAgIHBhcnNlSHJpckZyb21KU09OKGhyaXJTZXQpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICB0aGlzLmZzID0gaHJpclNldC5sZWF2ZXNbNl0uZGF0YVswXTsgICAgICAgICAgICAgICAgICAgIC8vIHNhbXBsZXJhdGUgb2YgdGhlIHNldFxuICAgICAgICB0aGlzLm5IcmlycyA9IGhyaXJTZXQubGVhdmVzWzRdLmRhdGEubGVuZ3RoOyAgICAgICAgICAgIC8vIG51bWJlciBvZiBIUklSIG1lYXN1cmVtZW50c1xuICAgICAgICB0aGlzLm5TYW1wbGVzID0gaHJpclNldC5sZWF2ZXNbOF0uZGF0YVswXVsxXS5sZW5ndGg7ICAgIC8vIGxlbmd0aCBvZiBIUklSc1xuICAgICAgICAvLyBwYXJzZSBhemltdXRoLWVsZXZhdGlvbiBvZiBIUklSc1xuICAgICAgICB0aGlzLmhyaXJfZGlyc19kZWcgPSBbXTtcbiAgICAgICAgaHJpclNldC5sZWF2ZXNbNF0uZGF0YS5mb3JFYWNoKGZ1bmN0aW9uKGVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuaHJpcl9kaXJzX2RlZy5wdXNoKFtlbGVtZW50WzBdLCBlbGVtZW50WzFdXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgLy8gcGFyc2UgSFJJUiBidWZmZXJzXG4gICAgICAgIHRoaXMuaHJpcnMgPSBbXTtcbiAgICAgICAgaHJpclNldC5sZWF2ZXNbOF0uZGF0YS5mb3JFYWNoKGZ1bmN0aW9uKGVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBsZWZ0ID0gbmV3IEZsb2F0NjRBcnJheShlbGVtZW50WzBdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCByaWdodCA9IG5ldyBGbG9hdDY0QXJyYXkoZWxlbWVudFsxXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmhyaXJzLnB1c2goW2xlZnQsIHJpZ2h0XSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgIH1cblxuICAgIGdldENsb3Nlc3REaXJzKG5lYXJlc3RJZHgsIGhyaXJfZGlyc19kZWcpIHtcbiAgICAvLyBnZXRDbG9zZXN0SHJpckZpbHRlcnModGFyZ2V0X2RpcnNfZGVnLCBocmlyX2RpcnNfZGVnLCBJTkZPKSB7XG4gICAgICAgIHZhciBuRGlycyA9IG5lYXJlc3RJZHgubGVuZ3RoO1xuICAgICAgICB2YXIgbmVhcmVzdF9kaXJzX2RlZyA9IFtdO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG5EaXJzOyBpKyspIHtcbiAgICAgICAgICAgIC8vIGdldCBhdmFpbGFibGUgcG9zaXRpb25zIChpbiB0aGUgSFJJUiBzZXQpIG5lYXJlc3QgZnJvbSB0aGUgcmVxdWlyZWQgc3BlYWtlcnMgcG9zaXRpb25zXG4gICAgICAgICAgICBuZWFyZXN0X2RpcnNfZGVnLnB1c2goaHJpcl9kaXJzX2RlZ1tuZWFyZXN0SWR4W2ldXSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5lYXJlc3RfZGlyc19kZWc7XG4gICAgICAgIC8vICAgICAgICBpZiAoSU5GTykge1xuICAgICAgICAvLyAgICAgICAgICAgIC8vIGNvbXBhcmUgcmVxdWlyZWQgdnMuIHByZXNlbnQgcG9zaXRpb25zIGluIEhSSVIgZmlsdGVyXG4gICAgICAgIC8vICAgICAgICAgICAgbGV0IGFuZ3VsYXJEaXN0RGVnID0gMDtcbiAgICAgICAgLy8gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG5EaXJzOyBpKyspIHtcbiAgICAgICAgLy8gICAgICAgICAgICAgICAgaWYgKHRoaXMudGFyZ2V0X2RpcnNfZGVnW2ldWzBdIDwgMCkgdGhpcy50YXJnZXRfZGlyc19kZWdbaV1bMF0gKz0gMzYwLjA7XG4gICAgICAgIC8vICAgICAgICAgICAgICAgIGFuZ3VsYXJEaXN0RGVnICs9IE1hdGguc3FydChcbiAgICAgICAgLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIE1hdGgucG93KHRoaXMudGFyZ2V0X2RpcnNfZGVnW2ldWzBdIC0gZ3JhbnRlZEZpbHRlclBvc1tpXVswXSwgMikgK1xuICAgICAgICAvLyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgTWF0aC5wb3codGhpcy50YXJnZXRfZGlyc19kZWdbaV1bMV0gLSBncmFudGVkRmlsdGVyUG9zW2ldWzFdLCAyKSk7XG4gICAgICAgIC8vICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCdhc2tlZCAvIGdyYW50ZWQgcG9zOiAnLCB0aGlzLndpc2hlZFNwZWFrZXJQb3NbaV0sICcvJywgZ3JhbnRlZEZpbHRlclBvc1tpXSk7XG4gICAgICAgIC8vICAgICAgICAgICAgfVxuICAgICAgICAvLyAgICAgICAgICAgIGNvbnNvbGUubG9nKCdzdW1tZWQgLyBhdmVyYWdlIGFuZ3VsYXIgZGlzdCBiZXR3ZWVuIHRhcmdldCBhbmQgYWN0dWFsIHBvczonLFxuICAgICAgICAvLyAgICAgICAgICAgICAgICAgICAgICAgIE1hdGgucm91bmQoYW5ndWxhckRpc3REZWcqMTAwKS8xMDAsICdkZWcgLycsXG4gICAgICAgIC8vICAgICAgICAgICAgICAgICAgICAgICAgTWF0aC5yb3VuZCggKGFuZ3VsYXJEaXN0RGVnL3RoaXMud2lzaGVkU3BlYWtlclBvcy5sZW5ndGgpICoxMDApLzEwMCwgJ2RlZycpO1xuICAgICAgICAvLyAgICAgICAgfVxuICAgIH1cblxuICAgIGdldENsb3Nlc3RIcmlyRmlsdGVycyhuZWFyZXN0SWR4LCBocmlycykge1xuXG4gICAgICAgIHZhciBuRGlycyA9IG5lYXJlc3RJZHgubGVuZ3RoO1xuICAgICAgICB2YXIgbmVhcmVzdF9ocmlycyA9IFtdO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG5EaXJzOyBpKyspIHtcbiAgICAgICAgICAgIC8vIGdldCByZXNwZWN0aXZlIGhyaXJzXG4gICAgICAgICAgICBuZWFyZXN0X2hyaXJzLnB1c2goaHJpcnNbbmVhcmVzdElkeFtpXV0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuZWFyZXN0X2hyaXJzO1xuICAgIH1cblxuICAgIGNvbXB1dGVEZWNGaWx0ZXJzKCkge1xuXG4gICAgICAgIC8vIG1heCByRSBvcHRpbWl6YXRpb25cbiAgICAgICAgdmFyIGFfbiA9IFtdO1xuICAgICAgICBhX24ucHVzaCgxKTtcbiAgICAgICAgZm9yKHZhciBpPTE7aTwodGhpcy5vcmRlcisxKTtpKyspe1xuICAgICAgICAgIGFfbi5wdXNoKE1hdGguY29zKChpKk1hdGguUEkpLygyKnRoaXMub3JkZXIrMikpKTtcbiAgICAgICAgICBhX24ucHVzaChNYXRoLmNvcygoaSpNYXRoLlBJKS8oMip0aGlzLm9yZGVyKzIpKSk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGRpYWdBID0gbnVtZXJpYy5kaWFnKGFfbik7XG4gICAgICAgIC8vIGdldCBkZWNvZGluZyBtYXRyaXhcbiAgICAgICAgdGhpcy5kZWNvZGluZ01hdHJpeCA9IG51bWVyaWMudHJhbnNwb3NlKHV0aWxzLmdldENpcmNIYXJtb25pY3ModGhpcy5vcmRlcix1dGlscy5nZXRDb2x1bW4odGhpcy52bHNfZGlyc19kZWcsIDApKSk7XG4gICAgICAgIHRoaXMuZGVjb2RpbmdNYXRyaXggPSBudW1lcmljLmRvdCh0aGlzLmRlY29kaW5nTWF0cml4LCBkaWFnQSk7XG4gICAgICAgIC8vIG5vcm1hbGlzZSB0byBudW1iZXIgb2Ygc3BlYWtlcnNcbiAgICAgICAgdGhpcy5kZWNvZGluZ01hdHJpeCA9IG51bWVyaWMubXVsKCgyKk1hdGguUEkpL3RoaXMudmxzX2RpcnNfZGVnLmxlbmd0aCwgdGhpcy5kZWNvZGluZ01hdHJpeCk7XG4gICAgICAgIC8vIGNvbnZlcnQgaHJpciBmaWx0ZXJzIHRvIGhvYSBmaWx0ZXJzXG4gICAgICAgIHRoaXMuaG9hQnVmZmVyID0gdGhpcy5nZXRIb2FGaWx0ZXJGcm9tSHJpckZpbHRlcih0aGlzLm5DaCwgdGhpcy5uU2FtcGxlcywgdGhpcy5mcywgdGhpcy52bHNfaHJpcnMsIHRoaXMuZGVjb2RpbmdNYXRyaXgpO1xuICAgICAgICAvLyBwYXNzIHJlc3VsdGluZyBob2EgZmlsdGVycyB0byB1c2VyIGNhbGxiYWNrXG4gICAgICAgIHRoaXMub25Mb2FkKHRoaXMuaG9hQnVmZmVyKTtcbiAgICB9XG5cbiAgICBnZXRIb2FGaWx0ZXJGcm9tSHJpckZpbHRlcihuQ2gsIG5TYW1wbGVzLCBzYW1wbGVSYXRlLCBocmlycywgZGVjb2RpbmdNYXRyaXgpIHtcbiAgICAgICAgLy8gY3JlYXRlIGVtcHR5IGJ1ZmZlciByZWFkeSB0byByZWNlaXZlIGhvYSBmaWx0ZXJzXG4gICAgICAgIGlmIChuU2FtcGxlcz5ocmlyc1swXVswXS5sZW5ndGgpIG5TYW1wbGVzID0gaHJpcnNbMF1bMF0ubGVuZ3RoO1xuICAgICAgICBsZXQgaG9hQnVmZmVyID0gdGhpcy5jb250ZXh0LmNyZWF0ZUJ1ZmZlcihuQ2gsIG5TYW1wbGVzLCBzYW1wbGVSYXRlKTtcblxuICAgICAgICAvLyBzdW0gd2VpZ2h0ZWQgSFJJUiBvdmVyIEFtYmlzb25pYyBjaGFubmVscyB0byBjcmVhdGUgSE9BIElSc1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG5DaDsgaSsrKSB7XG4gICAgICAgICAgICBsZXQgY29uY2F0QnVmZmVyQXJyYXlMZWZ0ID0gbmV3IEZsb2F0MzJBcnJheShuU2FtcGxlcyk7XG4gICAgICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IGhyaXJzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgayA9IDA7IGsgPCBuU2FtcGxlczsgaysrKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbmNhdEJ1ZmZlckFycmF5TGVmdFtrXSArPSBkZWNvZGluZ01hdHJpeFtqXVtpXSAqIGhyaXJzW2pdWzBdW2tdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGhvYUJ1ZmZlci5nZXRDaGFubmVsRGF0YShpKS5zZXQoY29uY2F0QnVmZmVyQXJyYXlMZWZ0KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gaG9hQnVmZmVyO1xuICAgIH1cblxufVxuIl19