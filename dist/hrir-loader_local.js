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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImhyaXItbG9hZGVyX2xvY2FsLmpzIl0sIm5hbWVzIjpbInV0aWxzIiwicmVxdWlyZSIsIkhSSVJsb2FkZXJfbG9jYWwiLCJjb250ZXh0Iiwib3JkZXIiLCJjYWxsYmFjayIsIm5DaCIsIm9uTG9hZCIsInZsc19kaXJzX2RlZyIsImdldFRkZXNpZ24iLCJuVkxTIiwibGVuZ3RoIiwibmVhcmVzdExvb2t1cFJlcyIsInNldFVybCIsInNlbGYiLCJyZXF1ZXN0SHJpciIsIlhNTEh0dHBSZXF1ZXN0Iiwib3BlbiIsInJlc3BvbnNlVHlwZSIsIm9ubG9hZCIsInBhcnNlSHJpckZyb21KU09OIiwicmVzcG9uc2UiLCJuZWFyZXN0TG9va3VwIiwiY3JlYXRlTmVhcmVzdExvb2t1cCIsImhyaXJfZGlyc19kZWciLCJuZWFyZXN0SWR4IiwiZmluZE5lYXJlc3QiLCJuZWFyZXN0X2RpcnNfZGVnIiwiZ2V0Q2xvc2VzdERpcnMiLCJ2bHNfaHJpcnMiLCJnZXRDbG9zZXN0SHJpckZpbHRlcnMiLCJocmlycyIsImNvbXB1dGVEZWNGaWx0ZXJzIiwic2VuZCIsImhyaXJTZXQiLCJmcyIsImxlYXZlcyIsImRhdGEiLCJuSHJpcnMiLCJuU2FtcGxlcyIsImZvckVhY2giLCJlbGVtZW50IiwicHVzaCIsImxlZnQiLCJGbG9hdDY0QXJyYXkiLCJyaWdodCIsIm5EaXJzIiwiaSIsIm5lYXJlc3RfaHJpcnMiLCJkZWNvZGluZ01hdHJpeCIsImdldEFtYmlCaW5hdXJhbERlY010eCIsImhvYUJ1ZmZlciIsImdldEhvYUZpbHRlckZyb21IcmlyRmlsdGVyIiwic2FtcGxlUmF0ZSIsImNyZWF0ZUJ1ZmZlciIsImNvbmNhdEJ1ZmZlckFycmF5TGVmdCIsIkZsb2F0MzJBcnJheSIsImoiLCJrIiwiZ2V0Q2hhbm5lbERhdGEiLCJzZXQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBLElBQUlBLFFBQVFDLFFBQVEsWUFBUixDQUFaOztJQUVxQkMsZ0I7QUFDakIsOEJBQVlDLE9BQVosRUFBcUJDLEtBQXJCLEVBQTRCQyxRQUE1QixFQUFzQztBQUFBOztBQUNsQyxhQUFLRixPQUFMLEdBQWVBLE9BQWY7QUFDQSxhQUFLQyxLQUFMLEdBQWFBLEtBQWI7QUFDQSxhQUFLRSxHQUFMLEdBQVcsQ0FBQ0YsUUFBUSxDQUFULEtBQWVBLFFBQVEsQ0FBdkIsQ0FBWDtBQUNBO0FBQ0EsYUFBS0csTUFBTCxHQUFjRixRQUFkO0FBQ0E7QUFDQSxhQUFLRyxZQUFMLEdBQW9CUixNQUFNUyxVQUFOLENBQWlCLElBQUUsS0FBS0wsS0FBeEIsQ0FBcEI7QUFDQSxhQUFLTSxJQUFMLEdBQVksS0FBS0YsWUFBTCxDQUFrQkcsTUFBOUI7QUFDQTtBQUNBLGFBQUtDLGdCQUFMLEdBQXdCLENBQUMsQ0FBRCxFQUFHLENBQUgsQ0FBeEI7QUFDSDs7Ozs2QkFFSUMsTSxFQUFROztBQUVULGdCQUFJQyxPQUFPLElBQVg7QUFDQTtBQUNBLGdCQUFJQyxjQUFjLElBQUlDLGNBQUosRUFBbEI7QUFDQUQsd0JBQVlFLElBQVosQ0FBaUIsS0FBakIsRUFBd0JKLE1BQXhCLEVBQWdDLElBQWhDO0FBQ0FFLHdCQUFZRyxZQUFaLEdBQTJCLE1BQTNCO0FBQ0FILHdCQUFZSSxNQUFaLEdBQXFCLFlBQVc7QUFDNUI7QUFDQUwscUJBQUtNLGlCQUFMLENBQXVCTCxZQUFZTSxRQUFuQztBQUNBO0FBQ0FQLHFCQUFLUSxhQUFMLEdBQXFCdEIsTUFBTXVCLG1CQUFOLENBQTBCVCxLQUFLVSxhQUEvQixFQUE4Q1YsS0FBS0YsZ0JBQW5ELENBQXJCO0FBQ0E7QUFDQSxvQkFBSWEsYUFBYXpCLE1BQU0wQixXQUFOLENBQWtCWixLQUFLTixZQUF2QixFQUFxQ00sS0FBS1EsYUFBMUMsRUFBeURSLEtBQUtGLGdCQUE5RCxDQUFqQjtBQUNBO0FBQ0FFLHFCQUFLYSxnQkFBTCxHQUF3QmIsS0FBS2MsY0FBTCxDQUFvQkgsVUFBcEIsRUFBZ0NYLEtBQUtVLGFBQXJDLENBQXhCO0FBQ0FWLHFCQUFLZSxTQUFMLEdBQWlCZixLQUFLZ0IscUJBQUwsQ0FBMkJMLFVBQTNCLEVBQXVDWCxLQUFLaUIsS0FBNUMsQ0FBakI7QUFDQTtBQUNBakIscUJBQUtrQixpQkFBTDtBQUNILGFBWkQ7QUFhQWpCLHdCQUFZa0IsSUFBWixHQXBCUyxDQW9CVztBQUN2Qjs7OzBDQUVpQkMsTyxFQUFTO0FBQ3ZCLGdCQUFJcEIsT0FBTyxJQUFYO0FBQ0EsaUJBQUtxQixFQUFMLEdBQVVELFFBQVFFLE1BQVIsQ0FBZSxDQUFmLEVBQWtCQyxJQUFsQixDQUF1QixDQUF2QixDQUFWLENBRnVCLENBRWlDO0FBQ3hELGlCQUFLQyxNQUFMLEdBQWNKLFFBQVFFLE1BQVIsQ0FBZSxDQUFmLEVBQWtCQyxJQUFsQixDQUF1QjFCLE1BQXJDLENBSHVCLENBR2lDO0FBQ3hELGlCQUFLNEIsUUFBTCxHQUFnQkwsUUFBUUUsTUFBUixDQUFlLENBQWYsRUFBa0JDLElBQWxCLENBQXVCLENBQXZCLEVBQTBCLENBQTFCLEVBQTZCMUIsTUFBN0MsQ0FKdUIsQ0FJaUM7QUFDeEQ7QUFDQSxpQkFBS2EsYUFBTCxHQUFxQixFQUFyQjtBQUNBVSxvQkFBUUUsTUFBUixDQUFlLENBQWYsRUFBa0JDLElBQWxCLENBQXVCRyxPQUF2QixDQUErQixVQUFTQyxPQUFULEVBQWtCO0FBQ2xCM0IscUJBQUtVLGFBQUwsQ0FBbUJrQixJQUFuQixDQUF3QixDQUFDRCxRQUFRLENBQVIsQ0FBRCxFQUFhQSxRQUFRLENBQVIsQ0FBYixDQUF4QjtBQUNDLGFBRmhDO0FBR0E7QUFDQSxpQkFBS1YsS0FBTCxHQUFhLEVBQWI7QUFDQUcsb0JBQVFFLE1BQVIsQ0FBZSxDQUFmLEVBQWtCQyxJQUFsQixDQUF1QkcsT0FBdkIsQ0FBK0IsVUFBU0MsT0FBVCxFQUFrQjtBQUNsQixvQkFBSUUsT0FBTyxJQUFJQyxZQUFKLENBQWlCSCxRQUFRLENBQVIsQ0FBakIsQ0FBWDtBQUNBLG9CQUFJSSxRQUFRLElBQUlELFlBQUosQ0FBaUJILFFBQVEsQ0FBUixDQUFqQixDQUFaO0FBQ0EzQixxQkFBS2lCLEtBQUwsQ0FBV1csSUFBWCxDQUFnQixDQUFDQyxJQUFELEVBQU9FLEtBQVAsQ0FBaEI7QUFDQyxhQUpoQztBQUtIOzs7dUNBRWNwQixVLEVBQVlELGEsRUFBZTtBQUMxQztBQUNJLGdCQUFJc0IsUUFBUXJCLFdBQVdkLE1BQXZCO0FBQ0EsZ0JBQUlnQixtQkFBbUIsRUFBdkI7QUFDQSxpQkFBSyxJQUFJb0IsSUFBSSxDQUFiLEVBQWdCQSxJQUFJRCxLQUFwQixFQUEyQkMsR0FBM0IsRUFBZ0M7QUFDNUI7QUFDQXBCLGlDQUFpQmUsSUFBakIsQ0FBc0JsQixjQUFjQyxXQUFXc0IsQ0FBWCxDQUFkLENBQXRCO0FBQ0g7QUFDRCxtQkFBT3BCLGdCQUFQO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNIOzs7OENBRXFCRixVLEVBQVlNLEssRUFBTzs7QUFFckMsZ0JBQUllLFFBQVFyQixXQUFXZCxNQUF2QjtBQUNBLGdCQUFJcUMsZ0JBQWdCLEVBQXBCO0FBQ0EsaUJBQUssSUFBSUQsSUFBSSxDQUFiLEVBQWdCQSxJQUFJRCxLQUFwQixFQUEyQkMsR0FBM0IsRUFBZ0M7QUFDNUI7QUFDQUMsOEJBQWNOLElBQWQsQ0FBbUJYLE1BQU1OLFdBQVdzQixDQUFYLENBQU4sQ0FBbkI7QUFDSDtBQUNELG1CQUFPQyxhQUFQO0FBQ0g7Ozs0Q0FFbUI7O0FBRWhCO0FBQ0EsaUJBQUtDLGNBQUwsR0FBc0JqRCxNQUFNa0QscUJBQU4sQ0FBNEIsS0FBS3ZCLGdCQUFqQyxFQUFtRCxLQUFLdkIsS0FBeEQsQ0FBdEI7QUFDQTtBQUNBLGlCQUFLK0MsU0FBTCxHQUFpQixLQUFLQywwQkFBTCxDQUFnQyxLQUFLOUMsR0FBckMsRUFBMEMsS0FBS2lDLFFBQS9DLEVBQXlELEtBQUtKLEVBQTlELEVBQWtFLEtBQUtOLFNBQXZFLEVBQWtGLEtBQUtvQixjQUF2RixDQUFqQjtBQUNBO0FBQ0EsaUJBQUsxQyxNQUFMLENBQVksS0FBSzRDLFNBQWpCO0FBQ0g7OzttREFFMEI3QyxHLEVBQUtpQyxRLEVBQVVjLFUsRUFBWXRCLEssRUFBT2tCLGMsRUFBZ0I7QUFDekU7QUFDQSxnQkFBSVYsV0FBU1IsTUFBTSxDQUFOLEVBQVMsQ0FBVCxFQUFZcEIsTUFBekIsRUFBaUM0QixXQUFXUixNQUFNLENBQU4sRUFBUyxDQUFULEVBQVlwQixNQUF2QjtBQUNqQyxnQkFBSXdDLFlBQVksS0FBS2hELE9BQUwsQ0FBYW1ELFlBQWIsQ0FBMEJoRCxHQUExQixFQUErQmlDLFFBQS9CLEVBQXlDYyxVQUF6QyxDQUFoQjs7QUFFQTtBQUNBLGlCQUFLLElBQUlOLElBQUksQ0FBYixFQUFnQkEsSUFBSXpDLEdBQXBCLEVBQXlCeUMsR0FBekIsRUFBOEI7QUFDMUIsb0JBQUlRLHdCQUF3QixJQUFJQyxZQUFKLENBQWlCakIsUUFBakIsQ0FBNUI7QUFDQSxxQkFBSyxJQUFJa0IsSUFBSSxDQUFiLEVBQWdCQSxJQUFJMUIsTUFBTXBCLE1BQTFCLEVBQWtDOEMsR0FBbEMsRUFBdUM7QUFDbkMseUJBQUssSUFBSUMsSUFBSSxDQUFiLEVBQWdCQSxJQUFJbkIsUUFBcEIsRUFBOEJtQixHQUE5QixFQUFtQztBQUMvQkgsOENBQXNCRyxDQUF0QixLQUE0QlQsZUFBZVEsQ0FBZixFQUFrQlYsQ0FBbEIsSUFBdUJoQixNQUFNMEIsQ0FBTixFQUFTLENBQVQsRUFBWUMsQ0FBWixDQUFuRDtBQUNIO0FBQ0o7QUFDRFAsMEJBQVVRLGNBQVYsQ0FBeUJaLENBQXpCLEVBQTRCYSxHQUE1QixDQUFnQ0wscUJBQWhDO0FBQ0g7QUFDRCxtQkFBT0osU0FBUDtBQUNIOzs7OztrQkF0SGdCakQsZ0IiLCJmaWxlIjoiaHJpci1sb2FkZXJfbG9jYWwuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gIEFyY2hvbnRpcyBQb2xpdGlzIChBYWx0byBVbml2ZXJzaXR5KVxuLy8gIGFyY2hvbnRpcy5wb2xpdGlzQGFhbHRvLmZpXG4vLyAgRGF2aWQgUG9pcmllci1RdWlub3QgKElSQ0FNKVxuLy8gIGRhdmlwb2lyQGlyY2FtLmZyXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy9cbi8vICBKU0FtYmlzb25pY3MgYSBKYXZhU2NyaXB0IGxpYnJhcnkgZm9yIGhpZ2hlci1vcmRlciBBbWJpc29uaWNzXG4vLyAgVGhlIGxpYnJhcnkgaW1wbGVtZW50cyBXZWIgQXVkaW8gYmxvY2tzIHRoYXQgcGVyZm9ybVxuLy8gIHR5cGljYWwgYW1iaXNvbmljIHByb2Nlc3Npbmcgb3BlcmF0aW9ucyBvbiBhdWRpbyBzaWduYWxzLlxuLy9cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbi8vLy8vLy8vLy8vLy8vLy8vXG4vKiBIUklSIExPQURFUiAqL1xuLy8vLy8vLy8vLy8vLy8vLy9cblxudmFyIHV0aWxzID0gcmVxdWlyZShcIi4vdXRpbHMuanNcIik7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEhSSVJsb2FkZXJfbG9jYWwge1xuICAgIGNvbnN0cnVjdG9yKGNvbnRleHQsIG9yZGVyLCBjYWxsYmFjaykge1xuICAgICAgICB0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xuICAgICAgICB0aGlzLm9yZGVyID0gb3JkZXI7XG4gICAgICAgIHRoaXMubkNoID0gKG9yZGVyICsgMSkgKiAob3JkZXIgKyAxKTtcbiAgICAgICAgLy8gZnVuY3Rpb24gY2FsbGVkIHdoZW4gZmlsdGVycyBsb2FkZWRcbiAgICAgICAgdGhpcy5vbkxvYWQgPSBjYWxsYmFjaztcbiAgICAgICAgLy8gZGVmaW5lIHJlcXVpcmVkIHZpcnR1YWwgc3BlYWtlciBwb3NpdGlvbnMgYmFzZWQgb24gQW1iaXNvbmljIG9yZGVyXG4gICAgICAgIHRoaXMudmxzX2RpcnNfZGVnID0gdXRpbHMuZ2V0VGRlc2lnbigyKnRoaXMub3JkZXIpO1xuICAgICAgICB0aGlzLm5WTFMgPSB0aGlzLnZsc19kaXJzX2RlZy5sZW5ndGg7XG4gICAgICAgIC8vIGFuZ3VsYXIgcmVzb2x1dGlvbiBmb3IgZmFzdCBsb29rdXAgdG8gY2xvc2VzdCBIUklSIHRvIGEgZ2l2ZW4gZGlyZWN0aW9uXG4gICAgICAgIHRoaXMubmVhcmVzdExvb2t1cFJlcyA9IFs1LDVdO1xuICAgIH1cblxuICAgIGxvYWQoc2V0VXJsKSB7XG4gICAgIFxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIC8vIHNldHVwIHRoZSByZXF1ZXN0XG4gICAgICAgIHZhciByZXF1ZXN0SHJpciA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuICAgICAgICByZXF1ZXN0SHJpci5vcGVuKFwiR0VUXCIsIHNldFVybCwgdHJ1ZSk7XG4gICAgICAgIHJlcXVlc3RIcmlyLnJlc3BvbnNlVHlwZSA9IFwianNvblwiO1xuICAgICAgICByZXF1ZXN0SHJpci5vbmxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIC8vIGxvYWQgdXNlZnVsIEhSSVIgc3R1ZmYgZnJvbSBKU09OXG4gICAgICAgICAgICBzZWxmLnBhcnNlSHJpckZyb21KU09OKHJlcXVlc3RIcmlyLnJlc3BvbnNlKTtcbiAgICAgICAgICAgIC8vIGNvbnN0cnVjdCBsb29rdXAgdGFibGUgZm9yIGZhc3QgY2xvc2VzdCBIUklSIGZpbmRpbmdcbiAgICAgICAgICAgIHNlbGYubmVhcmVzdExvb2t1cCA9IHV0aWxzLmNyZWF0ZU5lYXJlc3RMb29rdXAoc2VsZi5ocmlyX2RpcnNfZGVnLCBzZWxmLm5lYXJlc3RMb29rdXBSZXMpO1xuICAgICAgICAgICAgLy8gZmluZCBjbG9zZXN0IGluZGljZXMgdG8gVkxTXG4gICAgICAgICAgICBsZXQgbmVhcmVzdElkeCA9IHV0aWxzLmZpbmROZWFyZXN0KHNlbGYudmxzX2RpcnNfZGVnLCBzZWxmLm5lYXJlc3RMb29rdXAsIHNlbGYubmVhcmVzdExvb2t1cFJlcyk7XG4gICAgICAgICAgICAvLyBnZXQgY2xvc2VzdCBIUklScyB0byB0aGUgVkxTIGRlc2lnblxuICAgICAgICAgICAgc2VsZi5uZWFyZXN0X2RpcnNfZGVnID0gc2VsZi5nZXRDbG9zZXN0RGlycyhuZWFyZXN0SWR4LCBzZWxmLmhyaXJfZGlyc19kZWcpO1xuICAgICAgICAgICAgc2VsZi52bHNfaHJpcnMgPSBzZWxmLmdldENsb3Nlc3RIcmlyRmlsdGVycyhuZWFyZXN0SWR4LCBzZWxmLmhyaXJzKTtcbiAgICAgICAgICAgIC8vIGNvbXB1dGUgYW1iaXNvbmljIGRlY29kaW5nIGZpbHRlcnNcbiAgICAgICAgICAgIHNlbGYuY29tcHV0ZURlY0ZpbHRlcnMoKTtcbiAgICAgICAgfVxuICAgICAgICByZXF1ZXN0SHJpci5zZW5kKCk7IC8vIFNlbmQgdGhlIFJlcXVlc3QgYW5kIExvYWQgdGhlIEZpbGVcbiAgICB9XG4gICAgXG4gICAgcGFyc2VIcmlyRnJvbUpTT04oaHJpclNldCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHRoaXMuZnMgPSBocmlyU2V0LmxlYXZlc1s2XS5kYXRhWzBdOyAgICAgICAgICAgICAgICAgICAgLy8gc2FtcGxlcmF0ZSBvZiB0aGUgc2V0XG4gICAgICAgIHRoaXMubkhyaXJzID0gaHJpclNldC5sZWF2ZXNbNF0uZGF0YS5sZW5ndGg7ICAgICAgICAgICAgLy8gbnVtYmVyIG9mIEhSSVIgbWVhc3VyZW1lbnRzXG4gICAgICAgIHRoaXMublNhbXBsZXMgPSBocmlyU2V0LmxlYXZlc1s4XS5kYXRhWzBdWzFdLmxlbmd0aDsgICAgLy8gbGVuZ3RoIG9mIEhSSVJzXG4gICAgICAgIC8vIHBhcnNlIGF6aW11dGgtZWxldmF0aW9uIG9mIEhSSVJzXG4gICAgICAgIHRoaXMuaHJpcl9kaXJzX2RlZyA9IFtdO1xuICAgICAgICBocmlyU2V0LmxlYXZlc1s0XS5kYXRhLmZvckVhY2goZnVuY3Rpb24oZWxlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5ocmlyX2RpcnNfZGVnLnB1c2goW2VsZW1lbnRbMF0sIGVsZW1lbnRbMV1dKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAvLyBwYXJzZSBIUklSIGJ1ZmZlcnNcbiAgICAgICAgdGhpcy5ocmlycyA9IFtdO1xuICAgICAgICBocmlyU2V0LmxlYXZlc1s4XS5kYXRhLmZvckVhY2goZnVuY3Rpb24oZWxlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGxlZnQgPSBuZXcgRmxvYXQ2NEFycmF5KGVsZW1lbnRbMF0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHJpZ2h0ID0gbmV3IEZsb2F0NjRBcnJheShlbGVtZW50WzFdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuaHJpcnMucHVzaChbbGVmdCwgcmlnaHRdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgfVxuICAgIFxuICAgIGdldENsb3Nlc3REaXJzKG5lYXJlc3RJZHgsIGhyaXJfZGlyc19kZWcpIHtcbiAgICAvLyBnZXRDbG9zZXN0SHJpckZpbHRlcnModGFyZ2V0X2RpcnNfZGVnLCBocmlyX2RpcnNfZGVnLCBJTkZPKSB7XG4gICAgICAgIHZhciBuRGlycyA9IG5lYXJlc3RJZHgubGVuZ3RoO1xuICAgICAgICB2YXIgbmVhcmVzdF9kaXJzX2RlZyA9IFtdO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG5EaXJzOyBpKyspIHtcbiAgICAgICAgICAgIC8vIGdldCBhdmFpbGFibGUgcG9zaXRpb25zIChpbiB0aGUgSFJJUiBzZXQpIG5lYXJlc3QgZnJvbSB0aGUgcmVxdWlyZWQgc3BlYWtlcnMgcG9zaXRpb25zXG4gICAgICAgICAgICBuZWFyZXN0X2RpcnNfZGVnLnB1c2goaHJpcl9kaXJzX2RlZ1tuZWFyZXN0SWR4W2ldXSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5lYXJlc3RfZGlyc19kZWc7XG4gICAgICAgIC8vICAgICAgICBpZiAoSU5GTykge1xuICAgICAgICAvLyAgICAgICAgICAgIC8vIGNvbXBhcmUgcmVxdWlyZWQgdnMuIHByZXNlbnQgcG9zaXRpb25zIGluIEhSSVIgZmlsdGVyXG4gICAgICAgIC8vICAgICAgICAgICAgbGV0IGFuZ3VsYXJEaXN0RGVnID0gMDtcbiAgICAgICAgLy8gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG5EaXJzOyBpKyspIHtcbiAgICAgICAgLy8gICAgICAgICAgICAgICAgaWYgKHRoaXMudGFyZ2V0X2RpcnNfZGVnW2ldWzBdIDwgMCkgdGhpcy50YXJnZXRfZGlyc19kZWdbaV1bMF0gKz0gMzYwLjA7XG4gICAgICAgIC8vICAgICAgICAgICAgICAgIGFuZ3VsYXJEaXN0RGVnICs9IE1hdGguc3FydChcbiAgICAgICAgLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIE1hdGgucG93KHRoaXMudGFyZ2V0X2RpcnNfZGVnW2ldWzBdIC0gZ3JhbnRlZEZpbHRlclBvc1tpXVswXSwgMikgK1xuICAgICAgICAvLyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgTWF0aC5wb3codGhpcy50YXJnZXRfZGlyc19kZWdbaV1bMV0gLSBncmFudGVkRmlsdGVyUG9zW2ldWzFdLCAyKSk7XG4gICAgICAgIC8vICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCdhc2tlZCAvIGdyYW50ZWQgcG9zOiAnLCB0aGlzLndpc2hlZFNwZWFrZXJQb3NbaV0sICcvJywgZ3JhbnRlZEZpbHRlclBvc1tpXSk7XG4gICAgICAgIC8vICAgICAgICAgICAgfVxuICAgICAgICAvLyAgICAgICAgICAgIGNvbnNvbGUubG9nKCdzdW1tZWQgLyBhdmVyYWdlIGFuZ3VsYXIgZGlzdCBiZXR3ZWVuIHRhcmdldCBhbmQgYWN0dWFsIHBvczonLFxuICAgICAgICAvLyAgICAgICAgICAgICAgICAgICAgICAgIE1hdGgucm91bmQoYW5ndWxhckRpc3REZWcqMTAwKS8xMDAsICdkZWcgLycsXG4gICAgICAgIC8vICAgICAgICAgICAgICAgICAgICAgICAgTWF0aC5yb3VuZCggKGFuZ3VsYXJEaXN0RGVnL3RoaXMud2lzaGVkU3BlYWtlclBvcy5sZW5ndGgpICoxMDApLzEwMCwgJ2RlZycpO1xuICAgICAgICAvLyAgICAgICAgfVxuICAgIH1cbiAgICBcbiAgICBnZXRDbG9zZXN0SHJpckZpbHRlcnMobmVhcmVzdElkeCwgaHJpcnMpIHtcbiAgICBcbiAgICAgICAgdmFyIG5EaXJzID0gbmVhcmVzdElkeC5sZW5ndGg7XG4gICAgICAgIHZhciBuZWFyZXN0X2hyaXJzID0gW107XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbkRpcnM7IGkrKykge1xuICAgICAgICAgICAgLy8gZ2V0IHJlc3BlY3RpdmUgaHJpcnNcbiAgICAgICAgICAgIG5lYXJlc3RfaHJpcnMucHVzaChocmlyc1tuZWFyZXN0SWR4W2ldXSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5lYXJlc3RfaHJpcnM7XG4gICAgfVxuICAgIFxuICAgIGNvbXB1dGVEZWNGaWx0ZXJzKCkge1xuXG4gICAgICAgIC8vIGdldCBkZWNvZGluZyBtYXRyaXhcbiAgICAgICAgdGhpcy5kZWNvZGluZ01hdHJpeCA9IHV0aWxzLmdldEFtYmlCaW5hdXJhbERlY010eCh0aGlzLm5lYXJlc3RfZGlyc19kZWcsIHRoaXMub3JkZXIpO1xuICAgICAgICAvLyBjb252ZXJ0IGhyaXIgZmlsdGVycyB0byBob2EgZmlsdGVyc1xuICAgICAgICB0aGlzLmhvYUJ1ZmZlciA9IHRoaXMuZ2V0SG9hRmlsdGVyRnJvbUhyaXJGaWx0ZXIodGhpcy5uQ2gsIHRoaXMublNhbXBsZXMsIHRoaXMuZnMsIHRoaXMudmxzX2hyaXJzLCB0aGlzLmRlY29kaW5nTWF0cml4KTtcbiAgICAgICAgLy8gcGFzcyByZXN1bHRpbmcgaG9hIGZpbHRlcnMgdG8gdXNlciBjYWxsYmFja1xuICAgICAgICB0aGlzLm9uTG9hZCh0aGlzLmhvYUJ1ZmZlcik7XG4gICAgfVxuXG4gICAgZ2V0SG9hRmlsdGVyRnJvbUhyaXJGaWx0ZXIobkNoLCBuU2FtcGxlcywgc2FtcGxlUmF0ZSwgaHJpcnMsIGRlY29kaW5nTWF0cml4KSB7XG4gICAgICAgIC8vIGNyZWF0ZSBlbXB0eSBidWZmZXIgcmVhZHkgdG8gcmVjZWl2ZSBob2EgZmlsdGVyc1xuICAgICAgICBpZiAoblNhbXBsZXM+aHJpcnNbMF1bMF0ubGVuZ3RoKSBuU2FtcGxlcyA9IGhyaXJzWzBdWzBdLmxlbmd0aDtcbiAgICAgICAgbGV0IGhvYUJ1ZmZlciA9IHRoaXMuY29udGV4dC5jcmVhdGVCdWZmZXIobkNoLCBuU2FtcGxlcywgc2FtcGxlUmF0ZSk7XG5cbiAgICAgICAgLy8gc3VtIHdlaWdodGVkIEhSSVIgb3ZlciBBbWJpc29uaWMgY2hhbm5lbHMgdG8gY3JlYXRlIEhPQSBJUnNcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBuQ2g7IGkrKykge1xuICAgICAgICAgICAgbGV0IGNvbmNhdEJ1ZmZlckFycmF5TGVmdCA9IG5ldyBGbG9hdDMyQXJyYXkoblNhbXBsZXMpO1xuICAgICAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBocmlycy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICAgIGZvciAobGV0IGsgPSAwOyBrIDwgblNhbXBsZXM7IGsrKykge1xuICAgICAgICAgICAgICAgICAgICBjb25jYXRCdWZmZXJBcnJheUxlZnRba10gKz0gZGVjb2RpbmdNYXRyaXhbal1baV0gKiBocmlyc1tqXVswXVtrXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBob2FCdWZmZXIuZ2V0Q2hhbm5lbERhdGEoaSkuc2V0KGNvbmNhdEJ1ZmZlckFycmF5TGVmdCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGhvYUJ1ZmZlcjtcbiAgICB9XG5cbn1cbiJdfQ==