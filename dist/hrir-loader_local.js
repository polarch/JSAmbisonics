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

/////////////////
/* HRIR LOADER */
/////////////////

var utils = require("./utils.js");

var HRIRloader_local = function () {
    function HRIRloader_local(context, order, callback) {
        (0, _classCallCheck3.default)(this, HRIRloader_local);

        this.context = context;
        this.order = order;
        this.nCh = (order + 1) * (order + 1);
        // function called when filters loaded
        this.onLoad = callback;
        // define required virtual speaker positions based on Ambisonic order
        this.vls_dirs_deg = utils.getTdesign(2 * this.order);
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

            // get decoding matrix
            this.decodingMatrix = utils.getAmbiBinauralDecMtx(this.nearest_dirs_deg, this.order);
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
    return HRIRloader_local;
}();

exports.default = HRIRloader_local;
//# sourceMappingURL=data:application/json;base64,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QUdBLGlCQUFLLElBQUksSUFBSSxDQUFiLEVBQWdCLElBQUksR0FBcEIsRUFBeUIsR0FBekIsRUFBOEI7QUFDMUIsb0JBQUksd0JBQXdCLElBQUksWUFBSixDQUFpQixRQUFqQixDQUE1QjtBQUNBLHFCQUFLLElBQUksSUFBSSxDQUFiLEVBQWdCLElBQUksTUFBTSxNQUExQixFQUFrQyxHQUFsQyxFQUF1QztBQUNuQyx5QkFBSyxJQUFJLElBQUksQ0FBYixFQUFnQixJQUFJLFFBQXBCLEVBQThCLEdBQTlCLEVBQW1DO0FBQy9CLDhDQUFzQixDQUF0QixLQUE0QixlQUFlLENBQWYsRUFBa0IsQ0FBbEIsSUFBdUIsTUFBTSxDQUFOLEVBQVMsQ0FBVCxFQUFZLENBQVosQ0FBbkQ7QUFDSDtBQUNKO0FBQ0QsMEJBQVUsY0FBVixDQUF5QixDQUF6QixFQUE0QixHQUE1QixDQUFnQyxxQkFBaEM7QUFDSDtBQUNELG1CQUFPLFNBQVA7QUFDSDs7Ozs7a0JBdEhnQixnQiIsImZpbGUiOiJocmlyLWxvYWRlcl9sb2NhbC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyAgQXJjaG9udGlzIFBvbGl0aXMgKEFhbHRvIFVuaXZlcnNpdHkpXG4vLyAgYXJjaG9udGlzLnBvbGl0aXNAYWFsdG8uZmlcbi8vICBEYXZpZCBQb2lyaWVyLVF1aW5vdCAoSVJDQU0pXG4vLyAgZGF2aXBvaXJAaXJjYW0uZnJcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vL1xuLy8gIEpTQW1iaXNvbmljcyBhIEphdmFTY3JpcHQgbGlicmFyeSBmb3IgaGlnaGVyLW9yZGVyIEFtYmlzb25pY3Ncbi8vICBUaGUgbGlicmFyeSBpbXBsZW1lbnRzIFdlYiBBdWRpbyBibG9ja3MgdGhhdCBwZXJmb3JtXG4vLyAgdHlwaWNhbCBhbWJpc29uaWMgcHJvY2Vzc2luZyBvcGVyYXRpb25zIG9uIGF1ZGlvIHNpZ25hbHMuXG4vL1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLy8vLy8vLy8vLy8vLy8vLy9cbi8qIEhSSVIgTE9BREVSICovXG4vLy8vLy8vLy8vLy8vLy8vL1xuXG52YXIgdXRpbHMgPSByZXF1aXJlKFwiLi91dGlscy5qc1wiKTtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgSFJJUmxvYWRlcl9sb2NhbCB7XG4gICAgY29uc3RydWN0b3IoY29udGV4dCwgb3JkZXIsIGNhbGxiYWNrKSB7XG4gICAgICAgIHRoaXMuY29udGV4dCA9IGNvbnRleHQ7XG4gICAgICAgIHRoaXMub3JkZXIgPSBvcmRlcjtcbiAgICAgICAgdGhpcy5uQ2ggPSAob3JkZXIgKyAxKSAqIChvcmRlciArIDEpO1xuICAgICAgICAvLyBmdW5jdGlvbiBjYWxsZWQgd2hlbiBmaWx0ZXJzIGxvYWRlZFxuICAgICAgICB0aGlzLm9uTG9hZCA9IGNhbGxiYWNrO1xuICAgICAgICAvLyBkZWZpbmUgcmVxdWlyZWQgdmlydHVhbCBzcGVha2VyIHBvc2l0aW9ucyBiYXNlZCBvbiBBbWJpc29uaWMgb3JkZXJcbiAgICAgICAgdGhpcy52bHNfZGlyc19kZWcgPSB1dGlscy5nZXRUZGVzaWduKDIqdGhpcy5vcmRlcik7XG4gICAgICAgIHRoaXMublZMUyA9IHRoaXMudmxzX2RpcnNfZGVnLmxlbmd0aDtcbiAgICAgICAgLy8gYW5ndWxhciByZXNvbHV0aW9uIGZvciBmYXN0IGxvb2t1cCB0byBjbG9zZXN0IEhSSVIgdG8gYSBnaXZlbiBkaXJlY3Rpb25cbiAgICAgICAgdGhpcy5uZWFyZXN0TG9va3VwUmVzID0gWzUsNV07XG4gICAgfVxuXG4gICAgbG9hZChzZXRVcmwpIHtcbiAgICAgXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgLy8gc2V0dXAgdGhlIHJlcXVlc3RcbiAgICAgICAgdmFyIHJlcXVlc3RIcmlyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG4gICAgICAgIHJlcXVlc3RIcmlyLm9wZW4oXCJHRVRcIiwgc2V0VXJsLCB0cnVlKTtcbiAgICAgICAgcmVxdWVzdEhyaXIucmVzcG9uc2VUeXBlID0gXCJqc29uXCI7XG4gICAgICAgIHJlcXVlc3RIcmlyLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgLy8gbG9hZCB1c2VmdWwgSFJJUiBzdHVmZiBmcm9tIEpTT05cbiAgICAgICAgICAgIHNlbGYucGFyc2VIcmlyRnJvbUpTT04ocmVxdWVzdEhyaXIucmVzcG9uc2UpO1xuICAgICAgICAgICAgLy8gY29uc3RydWN0IGxvb2t1cCB0YWJsZSBmb3IgZmFzdCBjbG9zZXN0IEhSSVIgZmluZGluZ1xuICAgICAgICAgICAgc2VsZi5uZWFyZXN0TG9va3VwID0gdXRpbHMuY3JlYXRlTmVhcmVzdExvb2t1cChzZWxmLmhyaXJfZGlyc19kZWcsIHNlbGYubmVhcmVzdExvb2t1cFJlcyk7XG4gICAgICAgICAgICAvLyBmaW5kIGNsb3Nlc3QgaW5kaWNlcyB0byBWTFNcbiAgICAgICAgICAgIGxldCBuZWFyZXN0SWR4ID0gdXRpbHMuZmluZE5lYXJlc3Qoc2VsZi52bHNfZGlyc19kZWcsIHNlbGYubmVhcmVzdExvb2t1cCwgc2VsZi5uZWFyZXN0TG9va3VwUmVzKTtcbiAgICAgICAgICAgIC8vIGdldCBjbG9zZXN0IEhSSVJzIHRvIHRoZSBWTFMgZGVzaWduXG4gICAgICAgICAgICBzZWxmLm5lYXJlc3RfZGlyc19kZWcgPSBzZWxmLmdldENsb3Nlc3REaXJzKG5lYXJlc3RJZHgsIHNlbGYuaHJpcl9kaXJzX2RlZyk7XG4gICAgICAgICAgICBzZWxmLnZsc19ocmlycyA9IHNlbGYuZ2V0Q2xvc2VzdEhyaXJGaWx0ZXJzKG5lYXJlc3RJZHgsIHNlbGYuaHJpcnMpO1xuICAgICAgICAgICAgLy8gY29tcHV0ZSBhbWJpc29uaWMgZGVjb2RpbmcgZmlsdGVyc1xuICAgICAgICAgICAgc2VsZi5jb21wdXRlRGVjRmlsdGVycygpO1xuICAgICAgICB9XG4gICAgICAgIHJlcXVlc3RIcmlyLnNlbmQoKTsgLy8gU2VuZCB0aGUgUmVxdWVzdCBhbmQgTG9hZCB0aGUgRmlsZVxuICAgIH1cbiAgICBcbiAgICBwYXJzZUhyaXJGcm9tSlNPTihocmlyU2V0KSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgdGhpcy5mcyA9IGhyaXJTZXQubGVhdmVzWzZdLmRhdGFbMF07ICAgICAgICAgICAgICAgICAgICAvLyBzYW1wbGVyYXRlIG9mIHRoZSBzZXRcbiAgICAgICAgdGhpcy5uSHJpcnMgPSBocmlyU2V0LmxlYXZlc1s0XS5kYXRhLmxlbmd0aDsgICAgICAgICAgICAvLyBudW1iZXIgb2YgSFJJUiBtZWFzdXJlbWVudHNcbiAgICAgICAgdGhpcy5uU2FtcGxlcyA9IGhyaXJTZXQubGVhdmVzWzhdLmRhdGFbMF1bMV0ubGVuZ3RoOyAgICAvLyBsZW5ndGggb2YgSFJJUnNcbiAgICAgICAgLy8gcGFyc2UgYXppbXV0aC1lbGV2YXRpb24gb2YgSFJJUnNcbiAgICAgICAgdGhpcy5ocmlyX2RpcnNfZGVnID0gW107XG4gICAgICAgIGhyaXJTZXQubGVhdmVzWzRdLmRhdGEuZm9yRWFjaChmdW5jdGlvbihlbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmhyaXJfZGlyc19kZWcucHVzaChbZWxlbWVudFswXSwgZWxlbWVudFsxXV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIC8vIHBhcnNlIEhSSVIgYnVmZmVyc1xuICAgICAgICB0aGlzLmhyaXJzID0gW107XG4gICAgICAgIGhyaXJTZXQubGVhdmVzWzhdLmRhdGEuZm9yRWFjaChmdW5jdGlvbihlbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgbGVmdCA9IG5ldyBGbG9hdDY0QXJyYXkoZWxlbWVudFswXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgcmlnaHQgPSBuZXcgRmxvYXQ2NEFycmF5KGVsZW1lbnRbMV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5ocmlycy5wdXNoKFtsZWZ0LCByaWdodF0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICB9XG4gICAgXG4gICAgZ2V0Q2xvc2VzdERpcnMobmVhcmVzdElkeCwgaHJpcl9kaXJzX2RlZykge1xuICAgIC8vIGdldENsb3Nlc3RIcmlyRmlsdGVycyh0YXJnZXRfZGlyc19kZWcsIGhyaXJfZGlyc19kZWcsIElORk8pIHtcbiAgICAgICAgdmFyIG5EaXJzID0gbmVhcmVzdElkeC5sZW5ndGg7XG4gICAgICAgIHZhciBuZWFyZXN0X2RpcnNfZGVnID0gW107XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbkRpcnM7IGkrKykge1xuICAgICAgICAgICAgLy8gZ2V0IGF2YWlsYWJsZSBwb3NpdGlvbnMgKGluIHRoZSBIUklSIHNldCkgbmVhcmVzdCBmcm9tIHRoZSByZXF1aXJlZCBzcGVha2VycyBwb3NpdGlvbnNcbiAgICAgICAgICAgIG5lYXJlc3RfZGlyc19kZWcucHVzaChocmlyX2RpcnNfZGVnW25lYXJlc3RJZHhbaV1dKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbmVhcmVzdF9kaXJzX2RlZztcbiAgICAgICAgLy8gICAgICAgIGlmIChJTkZPKSB7XG4gICAgICAgIC8vICAgICAgICAgICAgLy8gY29tcGFyZSByZXF1aXJlZCB2cy4gcHJlc2VudCBwb3NpdGlvbnMgaW4gSFJJUiBmaWx0ZXJcbiAgICAgICAgLy8gICAgICAgICAgICBsZXQgYW5ndWxhckRpc3REZWcgPSAwO1xuICAgICAgICAvLyAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbkRpcnM7IGkrKykge1xuICAgICAgICAvLyAgICAgICAgICAgICAgICBpZiAodGhpcy50YXJnZXRfZGlyc19kZWdbaV1bMF0gPCAwKSB0aGlzLnRhcmdldF9kaXJzX2RlZ1tpXVswXSArPSAzNjAuMDtcbiAgICAgICAgLy8gICAgICAgICAgICAgICAgYW5ndWxhckRpc3REZWcgKz0gTWF0aC5zcXJ0KFxuICAgICAgICAvLyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgTWF0aC5wb3codGhpcy50YXJnZXRfZGlyc19kZWdbaV1bMF0gLSBncmFudGVkRmlsdGVyUG9zW2ldWzBdLCAyKSArXG4gICAgICAgIC8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBNYXRoLnBvdyh0aGlzLnRhcmdldF9kaXJzX2RlZ1tpXVsxXSAtIGdyYW50ZWRGaWx0ZXJQb3NbaV1bMV0sIDIpKTtcbiAgICAgICAgLy8gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coJ2Fza2VkIC8gZ3JhbnRlZCBwb3M6ICcsIHRoaXMud2lzaGVkU3BlYWtlclBvc1tpXSwgJy8nLCBncmFudGVkRmlsdGVyUG9zW2ldKTtcbiAgICAgICAgLy8gICAgICAgICAgICB9XG4gICAgICAgIC8vICAgICAgICAgICAgY29uc29sZS5sb2coJ3N1bW1lZCAvIGF2ZXJhZ2UgYW5ndWxhciBkaXN0IGJldHdlZW4gdGFyZ2V0IGFuZCBhY3R1YWwgcG9zOicsXG4gICAgICAgIC8vICAgICAgICAgICAgICAgICAgICAgICAgTWF0aC5yb3VuZChhbmd1bGFyRGlzdERlZyoxMDApLzEwMCwgJ2RlZyAvJyxcbiAgICAgICAgLy8gICAgICAgICAgICAgICAgICAgICAgICBNYXRoLnJvdW5kKCAoYW5ndWxhckRpc3REZWcvdGhpcy53aXNoZWRTcGVha2VyUG9zLmxlbmd0aCkgKjEwMCkvMTAwLCAnZGVnJyk7XG4gICAgICAgIC8vICAgICAgICB9XG4gICAgfVxuICAgIFxuICAgIGdldENsb3Nlc3RIcmlyRmlsdGVycyhuZWFyZXN0SWR4LCBocmlycykge1xuICAgIFxuICAgICAgICB2YXIgbkRpcnMgPSBuZWFyZXN0SWR4Lmxlbmd0aDtcbiAgICAgICAgdmFyIG5lYXJlc3RfaHJpcnMgPSBbXTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBuRGlyczsgaSsrKSB7XG4gICAgICAgICAgICAvLyBnZXQgcmVzcGVjdGl2ZSBocmlyc1xuICAgICAgICAgICAgbmVhcmVzdF9ocmlycy5wdXNoKGhyaXJzW25lYXJlc3RJZHhbaV1dKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbmVhcmVzdF9ocmlycztcbiAgICB9XG4gICAgXG4gICAgY29tcHV0ZURlY0ZpbHRlcnMoKSB7XG5cbiAgICAgICAgLy8gZ2V0IGRlY29kaW5nIG1hdHJpeFxuICAgICAgICB0aGlzLmRlY29kaW5nTWF0cml4ID0gdXRpbHMuZ2V0QW1iaUJpbmF1cmFsRGVjTXR4KHRoaXMubmVhcmVzdF9kaXJzX2RlZywgdGhpcy5vcmRlcik7XG4gICAgICAgIC8vIGNvbnZlcnQgaHJpciBmaWx0ZXJzIHRvIGhvYSBmaWx0ZXJzXG4gICAgICAgIHRoaXMuaG9hQnVmZmVyID0gdGhpcy5nZXRIb2FGaWx0ZXJGcm9tSHJpckZpbHRlcih0aGlzLm5DaCwgdGhpcy5uU2FtcGxlcywgdGhpcy5mcywgdGhpcy52bHNfaHJpcnMsIHRoaXMuZGVjb2RpbmdNYXRyaXgpO1xuICAgICAgICAvLyBwYXNzIHJlc3VsdGluZyBob2EgZmlsdGVycyB0byB1c2VyIGNhbGxiYWNrXG4gICAgICAgIHRoaXMub25Mb2FkKHRoaXMuaG9hQnVmZmVyKTtcbiAgICB9XG5cbiAgICBnZXRIb2FGaWx0ZXJGcm9tSHJpckZpbHRlcihuQ2gsIG5TYW1wbGVzLCBzYW1wbGVSYXRlLCBocmlycywgZGVjb2RpbmdNYXRyaXgpIHtcbiAgICAgICAgLy8gY3JlYXRlIGVtcHR5IGJ1ZmZlciByZWFkeSB0byByZWNlaXZlIGhvYSBmaWx0ZXJzXG4gICAgICAgIGlmIChuU2FtcGxlcz5ocmlyc1swXVswXS5sZW5ndGgpIG5TYW1wbGVzID0gaHJpcnNbMF1bMF0ubGVuZ3RoO1xuICAgICAgICBsZXQgaG9hQnVmZmVyID0gdGhpcy5jb250ZXh0LmNyZWF0ZUJ1ZmZlcihuQ2gsIG5TYW1wbGVzLCBzYW1wbGVSYXRlKTtcblxuICAgICAgICAvLyBzdW0gd2VpZ2h0ZWQgSFJJUiBvdmVyIEFtYmlzb25pYyBjaGFubmVscyB0byBjcmVhdGUgSE9BIElSc1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG5DaDsgaSsrKSB7XG4gICAgICAgICAgICBsZXQgY29uY2F0QnVmZmVyQXJyYXlMZWZ0ID0gbmV3IEZsb2F0MzJBcnJheShuU2FtcGxlcyk7XG4gICAgICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IGhyaXJzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgayA9IDA7IGsgPCBuU2FtcGxlczsgaysrKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbmNhdEJ1ZmZlckFycmF5TGVmdFtrXSArPSBkZWNvZGluZ01hdHJpeFtqXVtpXSAqIGhyaXJzW2pdWzBdW2tdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGhvYUJ1ZmZlci5nZXRDaGFubmVsRGF0YShpKS5zZXQoY29uY2F0QnVmZmVyQXJyYXlMZWZ0KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gaG9hQnVmZmVyO1xuICAgIH1cblxufVxuIl19