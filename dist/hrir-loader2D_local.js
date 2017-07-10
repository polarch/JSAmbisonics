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

var HRIRloader_local = function () {
    function HRIRloader_local(context, order, callback) {
        (0, _classCallCheck3.default)(this, HRIRloader_local);

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

    (0, _createClass3.default)(HRIRloader_local, [{
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
    return HRIRloader_local;
}();

exports.default = HRIRloader_local;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImhyaXItbG9hZGVyMkRfbG9jYWwuanMiXSwibmFtZXMiOlsidXRpbHMiLCJyZXF1aXJlIiwiSFJJUmxvYWRlcl9sb2NhbCIsImNvbnRleHQiLCJvcmRlciIsImNhbGxiYWNrIiwibkNoIiwib25Mb2FkIiwidmxzX2RpcnNfZGVnIiwic2FtcGxlQ2lyY2xlIiwiblZMUyIsImxlbmd0aCIsIm5lYXJlc3RMb29rdXBSZXMiLCJzZXRVcmwiLCJzZWxmIiwicmVxdWVzdEhyaXIiLCJYTUxIdHRwUmVxdWVzdCIsIm9wZW4iLCJyZXNwb25zZVR5cGUiLCJvbmxvYWQiLCJwYXJzZUhyaXJGcm9tSlNPTiIsInJlc3BvbnNlIiwibmVhcmVzdExvb2t1cCIsImNyZWF0ZU5lYXJlc3RMb29rdXAiLCJocmlyX2RpcnNfZGVnIiwibmVhcmVzdElkeCIsImZpbmROZWFyZXN0IiwibmVhcmVzdF9kaXJzX2RlZyIsImdldENsb3Nlc3REaXJzIiwidmxzX2hyaXJzIiwiZ2V0Q2xvc2VzdEhyaXJGaWx0ZXJzIiwiaHJpcnMiLCJjb21wdXRlRGVjRmlsdGVycyIsInNlbmQiLCJocmlyU2V0IiwiZnMiLCJsZWF2ZXMiLCJkYXRhIiwibkhyaXJzIiwiblNhbXBsZXMiLCJmb3JFYWNoIiwiZWxlbWVudCIsInB1c2giLCJsZWZ0IiwiRmxvYXQ2NEFycmF5IiwicmlnaHQiLCJuRGlycyIsImkiLCJuZWFyZXN0X2hyaXJzIiwiYV9uIiwiTWF0aCIsImNvcyIsIlBJIiwiZGlhZ0EiLCJudW1lcmljIiwiZGlhZyIsImRlY29kaW5nTWF0cml4IiwidHJhbnNwb3NlIiwiZ2V0Q2lyY0hhcm1vbmljcyIsImdldENvbHVtbiIsImRvdCIsIm11bCIsImhvYUJ1ZmZlciIsImdldEhvYUZpbHRlckZyb21IcmlyRmlsdGVyIiwic2FtcGxlUmF0ZSIsImNyZWF0ZUJ1ZmZlciIsImNvbmNhdEJ1ZmZlckFycmF5TGVmdCIsIkZsb2F0MzJBcnJheSIsImoiLCJrIiwiZ2V0Q2hhbm5lbERhdGEiLCJzZXQiXSwi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QVlwQixNQUF2QjtBQUNqQyxnQkFBSW1ELFlBQVksS0FBSzNELE9BQUwsQ0FBYThELFlBQWIsQ0FBMEIzRCxHQUExQixFQUErQmlDLFFBQS9CLEVBQXlDeUIsVUFBekMsQ0FBaEI7O0FBRUE7QUFDQSxpQkFBSyxJQUFJakIsTUFBSSxDQUFiLEVBQWdCQSxNQUFJekMsR0FBcEIsRUFBeUJ5QyxLQUF6QixFQUE4QjtBQUMxQixvQkFBSW1CLHdCQUF3QixJQUFJQyxZQUFKLENBQWlCNUIsUUFBakIsQ0FBNUI7QUFDQSxxQkFBSyxJQUFJNkIsSUFBSSxDQUFiLEVBQWdCQSxJQUFJckMsTUFBTXBCLE1BQTFCLEVBQWtDeUQsR0FBbEMsRUFBdUM7QUFDbkMseUJBQUssSUFBSUMsSUFBSSxDQUFiLEVBQWdCQSxJQUFJOUIsUUFBcEIsRUFBOEI4QixHQUE5QixFQUFtQztBQUMvQkgsOENBQXNCRyxDQUF0QixLQUE0QmIsZUFBZVksQ0FBZixFQUFrQnJCLEdBQWxCLElBQXVCaEIsTUFBTXFDLENBQU4sRUFBUyxDQUFULEVBQVlDLENBQVosQ0FBbkQ7QUFDSDtBQUNKO0FBQ0RQLDBCQUFVUSxjQUFWLENBQXlCdkIsR0FBekIsRUFBNEJ3QixHQUE1QixDQUFnQ0wscUJBQWhDO0FBQ0g7QUFDRCxtQkFBT0osU0FBUDtBQUNIOzs7OztrQkFqSWdCNUQsZ0IiLCJmaWxlIjoiaHJpci1sb2FkZXIyRF9sb2NhbC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyAgQXJjaG9udGlzIFBvbGl0aXMgKEFhbHRvIFVuaXZlcnNpdHkpXG4vLyAgYXJjaG9udGlzLnBvbGl0aXNAYWFsdG8uZmlcbi8vICBEYXZpZCBQb2lyaWVyLVF1aW5vdCAoSVJDQU0pXG4vLyAgZGF2aXBvaXJAaXJjYW0uZnJcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vL1xuLy8gIEpTQW1iaXNvbmljcyBhIEphdmFTY3JpcHQgbGlicmFyeSBmb3IgaGlnaGVyLW9yZGVyIEFtYmlzb25pY3Ncbi8vICBUaGUgbGlicmFyeSBpbXBsZW1lbnRzIFdlYiBBdWRpbyBibG9ja3MgdGhhdCBwZXJmb3JtXG4vLyAgdHlwaWNhbCBhbWJpc29uaWMgcHJvY2Vzc2luZyBvcGVyYXRpb25zIG9uIGF1ZGlvIHNpZ25hbHMuXG4vL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vL1xuLy8gIEhSSVJsb2FkZXIgZm9yIDJEIHVzZVxuLy8gIGFkYXB0ZWQgYnkgVGhvbWFzIERlcHBpc2NoXG4vLyAgdGhvbWFzLmRlcHBpc2NoOTNAZ21haWwuY29tXG4vL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8vLy8vLy8vLy8vLy8vLy9cbi8qIEhSSVIgTE9BREVSIDJEKi9cbi8vLy8vLy8vLy8vLy8vLy8vLy9cblxudmFyIHV0aWxzID0gcmVxdWlyZShcIi4vdXRpbHMuanNcIik7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEhSSVJsb2FkZXJfbG9jYWwge1xuICAgIGNvbnN0cnVjdG9yKGNvbnRleHQsIG9yZGVyLCBjYWxsYmFjaykge1xuICAgICAgICB0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xuICAgICAgICB0aGlzLm9yZGVyID0gb3JkZXI7XG4gICAgICAgIHRoaXMubkNoID0gMipvcmRlciArIDE7XG4gICAgICAgIC8vIGZ1bmN0aW9uIGNhbGxlZCB3aGVuIGZpbHRlcnMgbG9hZGVkXG4gICAgICAgIHRoaXMub25Mb2FkID0gY2FsbGJhY2s7XG4gICAgICAgIC8vIGRlZmluZSByZXF1aXJlZCB2aXJ0dWFsIHNwZWFrZXIgcG9zaXRpb25zIGJhc2VkIG9uIEFtYmlzb25pYyBvcmRlclxuICAgICAgICB0aGlzLnZsc19kaXJzX2RlZyA9IHNhbXBsZUNpcmNsZSgyKnRoaXMub3JkZXIgKyAyKTsgLy8ybisyIHZpcnR1YWwgc3BlYWtlcnMgZm9yIDJEXG4gICAgICAgIHRoaXMublZMUyA9IHRoaXMudmxzX2RpcnNfZGVnLmxlbmd0aDtcbiAgICAgICAgLy8gYW5ndWxhciByZXNvbHV0aW9uIGZvciBmYXN0IGxvb2t1cCB0byBjbG9zZXN0IEhSSVIgdG8gYSBnaXZlbiBkaXJlY3Rpb25cbiAgICAgICAgdGhpcy5uZWFyZXN0TG9va3VwUmVzID0gWzUsNV07XG4gICAgfVxuXG4gICAgbG9hZChzZXRVcmwpIHtcblxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIC8vIHNldHVwIHRoZSByZXF1ZXN0XG4gICAgICAgIHZhciByZXF1ZXN0SHJpciA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuICAgICAgICByZXF1ZXN0SHJpci5vcGVuKFwiR0VUXCIsIHNldFVybCwgdHJ1ZSk7XG4gICAgICAgIHJlcXVlc3RIcmlyLnJlc3BvbnNlVHlwZSA9IFwianNvblwiO1xuICAgICAgICByZXF1ZXN0SHJpci5vbmxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIC8vIGxvYWQgdXNlZnVsIEhSSVIgc3R1ZmYgZnJvbSBKU09OXG4gICAgICAgICAgICBzZWxmLnBhcnNlSHJpckZyb21KU09OKHJlcXVlc3RIcmlyLnJlc3BvbnNlKTtcbiAgICAgICAgICAgIC8vIGNvbnN0cnVjdCBsb29rdXAgdGFibGUgZm9yIGZhc3QgY2xvc2VzdCBIUklSIGZpbmRpbmdcbiAgICAgICAgICAgIHNlbGYubmVhcmVzdExvb2t1cCA9IHV0aWxzLmNyZWF0ZU5lYXJlc3RMb29rdXAoc2VsZi5ocmlyX2RpcnNfZGVnLCBzZWxmLm5lYXJlc3RMb29rdXBSZXMpO1xuICAgICAgICAgICAgLy8gZmluZCBjbG9zZXN0IGluZGljZXMgdG8gVkxTXG4gICAgICAgICAgICBsZXQgbmVhcmVzdElkeCA9IHV0aWxzLmZpbmROZWFyZXN0KHNlbGYudmxzX2RpcnNfZGVnLCBzZWxmLm5lYXJlc3RMb29rdXAsIHNlbGYubmVhcmVzdExvb2t1cFJlcyk7XG4gICAgICAgICAgICAvLyBnZXQgY2xvc2VzdCBIUklScyB0byB0aGUgVkxTIGRlc2lnblxuICAgICAgICAgICAgc2VsZi5uZWFyZXN0X2RpcnNfZGVnID0gc2VsZi5nZXRDbG9zZXN0RGlycyhuZWFyZXN0SWR4LCBzZWxmLmhyaXJfZGlyc19kZWcpO1xuICAgICAgICAgICAgc2VsZi52bHNfaHJpcnMgPSBzZWxmLmdldENsb3Nlc3RIcmlyRmlsdGVycyhuZWFyZXN0SWR4LCBzZWxmLmhyaXJzKTtcbiAgICAgICAgICAgIC8vIGNvbXB1dGUgYW1iaXNvbmljIGRlY29kaW5nIGZpbHRlcnNcbiAgICAgICAgICAgIHNlbGYuY29tcHV0ZURlY0ZpbHRlcnMoKTtcbiAgICAgICAgfVxuICAgICAgICByZXF1ZXN0SHJpci5zZW5kKCk7IC8vIFNlbmQgdGhlIFJlcXVlc3QgYW5kIExvYWQgdGhlIEZpbGVcbiAgICB9XG5cbiAgICBwYXJzZUhyaXJGcm9tSlNPTihocmlyU2V0KSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgdGhpcy5mcyA9IGhyaXJTZXQubGVhdmVzWzZdLmRhdGFbMF07ICAgICAgICAgICAgICAgICAgICAvLyBzYW1wbGVyYXRlIG9mIHRoZSBzZXRcbiAgICAgICAgdGhpcy5uSHJpcnMgPSBocmlyU2V0LmxlYXZlc1s0XS5kYXRhLmxlbmd0aDsgICAgICAgICAgICAvLyBudW1iZXIgb2YgSFJJUiBtZWFzdXJlbWVudHNcbiAgICAgICAgdGhpcy5uU2FtcGxlcyA9IGhyaXJTZXQubGVhdmVzWzhdLmRhdGFbMF1bMV0ubGVuZ3RoOyAgICAvLyBsZW5ndGggb2YgSFJJUnNcbiAgICAgICAgLy8gcGFyc2UgYXppbXV0aC1lbGV2YXRpb24gb2YgSFJJUnNcbiAgICAgICAgdGhpcy5ocmlyX2RpcnNfZGVnID0gW107XG4gICAgICAgIGhyaXJTZXQubGVhdmVzWzRdLmRhdGEuZm9yRWFjaChmdW5jdGlvbihlbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmhyaXJfZGlyc19kZWcucHVzaChbZWxlbWVudFswXSwgZWxlbWVudFsxXV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIC8vIHBhcnNlIEhSSVIgYnVmZmVyc1xuICAgICAgICB0aGlzLmhyaXJzID0gW107XG4gICAgICAgIGhyaXJTZXQubGVhdmVzWzhdLmRhdGEuZm9yRWFjaChmdW5jdGlvbihlbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgbGVmdCA9IG5ldyBGbG9hdDY0QXJyYXkoZWxlbWVudFswXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgcmlnaHQgPSBuZXcgRmxvYXQ2NEFycmF5KGVsZW1lbnRbMV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5ocmlycy5wdXNoKFtsZWZ0LCByaWdodF0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICB9XG5cbiAgICBnZXRDbG9zZXN0RGlycyhuZWFyZXN0SWR4LCBocmlyX2RpcnNfZGVnKSB7XG4gICAgLy8gZ2V0Q2xvc2VzdEhyaXJGaWx0ZXJzKHRhcmdldF9kaXJzX2RlZywgaHJpcl9kaXJzX2RlZywgSU5GTykge1xuICAgICAgICB2YXIgbkRpcnMgPSBuZWFyZXN0SWR4Lmxlbmd0aDtcbiAgICAgICAgdmFyIG5lYXJlc3RfZGlyc19kZWcgPSBbXTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBuRGlyczsgaSsrKSB7XG4gICAgICAgICAgICAvLyBnZXQgYXZhaWxhYmxlIHBvc2l0aW9ucyAoaW4gdGhlIEhSSVIgc2V0KSBuZWFyZXN0IGZyb20gdGhlIHJlcXVpcmVkIHNwZWFrZXJzIHBvc2l0aW9uc1xuICAgICAgICAgICAgbmVhcmVzdF9kaXJzX2RlZy5wdXNoKGhyaXJfZGlyc19kZWdbbmVhcmVzdElkeFtpXV0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuZWFyZXN0X2RpcnNfZGVnO1xuICAgICAgICAvLyAgICAgICAgaWYgKElORk8pIHtcbiAgICAgICAgLy8gICAgICAgICAgICAvLyBjb21wYXJlIHJlcXVpcmVkIHZzLiBwcmVzZW50IHBvc2l0aW9ucyBpbiBIUklSIGZpbHRlclxuICAgICAgICAvLyAgICAgICAgICAgIGxldCBhbmd1bGFyRGlzdERlZyA9IDA7XG4gICAgICAgIC8vICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBuRGlyczsgaSsrKSB7XG4gICAgICAgIC8vICAgICAgICAgICAgICAgIGlmICh0aGlzLnRhcmdldF9kaXJzX2RlZ1tpXVswXSA8IDApIHRoaXMudGFyZ2V0X2RpcnNfZGVnW2ldWzBdICs9IDM2MC4wO1xuICAgICAgICAvLyAgICAgICAgICAgICAgICBhbmd1bGFyRGlzdERlZyArPSBNYXRoLnNxcnQoXG4gICAgICAgIC8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBNYXRoLnBvdyh0aGlzLnRhcmdldF9kaXJzX2RlZ1tpXVswXSAtIGdyYW50ZWRGaWx0ZXJQb3NbaV1bMF0sIDIpICtcbiAgICAgICAgLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIE1hdGgucG93KHRoaXMudGFyZ2V0X2RpcnNfZGVnW2ldWzFdIC0gZ3JhbnRlZEZpbHRlclBvc1tpXVsxXSwgMikpO1xuICAgICAgICAvLyAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZygnYXNrZWQgLyBncmFudGVkIHBvczogJywgdGhpcy53aXNoZWRTcGVha2VyUG9zW2ldLCAnLycsIGdyYW50ZWRGaWx0ZXJQb3NbaV0pO1xuICAgICAgICAvLyAgICAgICAgICAgIH1cbiAgICAgICAgLy8gICAgICAgICAgICBjb25zb2xlLmxvZygnc3VtbWVkIC8gYXZlcmFnZSBhbmd1bGFyIGRpc3QgYmV0d2VlbiB0YXJnZXQgYW5kIGFjdHVhbCBwb3M6JyxcbiAgICAgICAgLy8gICAgICAgICAgICAgICAgICAgICAgICBNYXRoLnJvdW5kKGFuZ3VsYXJEaXN0RGVnKjEwMCkvMTAwLCAnZGVnIC8nLFxuICAgICAgICAvLyAgICAgICAgICAgICAgICAgICAgICAgIE1hdGgucm91bmQoIChhbmd1bGFyRGlzdERlZy90aGlzLndpc2hlZFNwZWFrZXJQb3MubGVuZ3RoKSAqMTAwKS8xMDAsICdkZWcnKTtcbiAgICAgICAgLy8gICAgICAgIH1cbiAgICB9XG5cbiAgICBnZXRDbG9zZXN0SHJpckZpbHRlcnMobmVhcmVzdElkeCwgaHJpcnMpIHtcblxuICAgICAgICB2YXIgbkRpcnMgPSBuZWFyZXN0SWR4Lmxlbmd0aDtcbiAgICAgICAgdmFyIG5lYXJlc3RfaHJpcnMgPSBbXTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBuRGlyczsgaSsrKSB7XG4gICAgICAgICAgICAvLyBnZXQgcmVzcGVjdGl2ZSBocmlyc1xuICAgICAgICAgICAgbmVhcmVzdF9ocmlycy5wdXNoKGhyaXJzW25lYXJlc3RJZHhbaV1dKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbmVhcmVzdF9ocmlycztcbiAgICB9XG5cbiAgICBjb21wdXRlRGVjRmlsdGVycygpIHtcblxuICAgICAgICAvLyBtYXggckUgb3B0aW1pemF0aW9uXG4gICAgICAgIHZhciBhX24gPSBbXTtcbiAgICAgICAgYV9uLnB1c2goMSk7XG4gICAgICAgIGZvcihpPTE7aTwodGhpcy5vcmRlcisxKTtpKyspe1xuICAgICAgICAgIGFfbi5wdXNoKE1hdGguY29zKChpKk1hdGguUEkpLyh0aGlzLm5DaCkpKTtcbiAgICAgICAgICBhX24ucHVzaChNYXRoLmNvcygoaSpNYXRoLlBJKS8odGhpcy5uQ2gpKSk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGRpYWdBID0gbnVtZXJpYy5kaWFnKGFfbik7XG4gICAgICAgIC8vIGdldCBkZWNvZGluZyBtYXRyaXhcbiAgICAgICAgdGhpcy5kZWNvZGluZ01hdHJpeCA9IG51bWVyaWMudHJhbnNwb3NlKGdldENpcmNIYXJtb25pY3ModGhpcy5vcmRlcixnZXRDb2x1bW4odGhpcy5uZWFyZXN0X2RpcnNfZGVnLCAwKSkpO1xuICAgICAgICB0aGlzLmRlY29kaW5nTWF0cml4ID0gbnVtZXJpYy5kb3QodGhpcy5kZWNvZGluZ01hdHJpeCwgZGlhZ0EpO1xuICAgICAgICAvLyBub3JtYWxpc2UgdG8gbnVtYmVyIG9mIHNwZWFrZXJzXG4gICAgICAgIHRoaXMuZGVjb2RpbmdNYXRyaXggPSBudW1lcmljLm11bCgoMipNYXRoLlBJKS90aGlzLnZsc19kaXJzX2RlZy5sZW5ndGgsIHRoaXMuZGVjb2RpbmdNYXRyaXgpO1xuICAgICAgICAvLyBjb252ZXJ0IGhyaXIgZmlsdGVycyB0byBob2EgZmlsdGVyc1xuICAgICAgICB0aGlzLmhvYUJ1ZmZlciA9IHRoaXMuZ2V0SG9hRmlsdGVyRnJvbUhyaXJGaWx0ZXIodGhpcy5uQ2gsIHRoaXMublNhbXBsZXMsIHRoaXMuZnMsIHRoaXMudmxzX2hyaXJzLCB0aGlzLmRlY29kaW5nTWF0cml4KTtcbiAgICAgICAgLy8gcGFzcyByZXN1bHRpbmcgaG9hIGZpbHRlcnMgdG8gdXNlciBjYWxsYmFja1xuICAgICAgICB0aGlzLm9uTG9hZCh0aGlzLmhvYUJ1ZmZlcik7XG4gICAgfVxuXG4gICAgZ2V0SG9hRmlsdGVyRnJvbUhyaXJGaWx0ZXIobkNoLCBuU2FtcGxlcywgc2FtcGxlUmF0ZSwgaHJpcnMsIGRlY29kaW5nTWF0cml4KSB7XG4gICAgICAgIC8vIGNyZWF0ZSBlbXB0eSBidWZmZXIgcmVhZHkgdG8gcmVjZWl2ZSBob2EgZmlsdGVyc1xuICAgICAgICBpZiAoblNhbXBsZXM+aHJpcnNbMF1bMF0ubGVuZ3RoKSBuU2FtcGxlcyA9IGhyaXJzWzBdWzBdLmxlbmd0aDtcbiAgICAgICAgbGV0IGhvYUJ1ZmZlciA9IHRoaXMuY29udGV4dC5jcmVhdGVCdWZmZXIobkNoLCBuU2FtcGxlcywgc2FtcGxlUmF0ZSk7XG5cbiAgICAgICAgLy8gc3VtIHdlaWdodGVkIEhSSVIgb3ZlciBBbWJpc29uaWMgY2hhbm5lbHMgdG8gY3JlYXRlIEhPQSBJUnNcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBuQ2g7IGkrKykge1xuICAgICAgICAgICAgbGV0IGNvbmNhdEJ1ZmZlckFycmF5TGVmdCA9IG5ldyBGbG9hdDMyQXJyYXkoblNhbXBsZXMpO1xuICAgICAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBocmlycy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICAgIGZvciAobGV0IGsgPSAwOyBrIDwgblNhbXBsZXM7IGsrKykge1xuICAgICAgICAgICAgICAgICAgICBjb25jYXRCdWZmZXJBcnJheUxlZnRba10gKz0gZGVjb2RpbmdNYXRyaXhbal1baV0gKiBocmlyc1tqXVswXVtrXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBob2FCdWZmZXIuZ2V0Q2hhbm5lbERhdGEoaSkuc2V0KGNvbmNhdEJ1ZmZlckFycmF5TGVmdCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGhvYUJ1ZmZlcjtcbiAgICB9XG5cbn1cbiJdfQ==