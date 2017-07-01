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

export default class HRIRloader_local {
    constructor(context, order, callback) {
        this.context = context;
        this.order = order;
        this.nCh = (order + 1) * (order + 1);
        // function called when filters loaded
        this.onLoad = callback;
        // define required virtual speaker positions based on Ambisonic order
        this.vls_dirs_deg = utils.getTdesign(2*this.order);
        this.nVLS = this.vls_dirs_deg.length;
        // angular resolution for fast lookup to closest HRIR to a given direction
        this.nearestLookupRes = [5,5];
    }

    load(setUrl) {
     
        var self = this;
        // setup the request
        var requestHrir = new XMLHttpRequest();
        requestHrir.open("GET", setUrl, true);
        requestHrir.responseType = "json";
        requestHrir.onload = function() {
            // load useful HRIR stuff from JSON
            self.parseHrirFromJSON(requestHrir.response);
            // construct lookup table for fast closest HRIR finding
            self.nearestLookup = utils.createNearestLookup(self.hrir_dirs_deg, self.nearestLookupRes);
            // find closest indices to VLS
            let nearestIdx = utils.findNearest(self.vls_dirs_deg, self.nearestLookup, self.nearestLookupRes);
            // get closest HRIRs to the VLS design
            self.nearest_dirs_deg = self.getClosestDirs(nearestIdx, self.hrir_dirs_deg);
            self.vls_hrirs = self.getClosestHrirFilters(nearestIdx, self.hrirs);
            // compute ambisonic decoding filters
            self.computeDecFilters();
        }
        requestHrir.send(); // Send the Request and Load the File
    }
    
    parseHrirFromJSON(hrirSet) {
        var self = this;
        this.fs = hrirSet.leaves[6].data[0];                    // samplerate of the set
        this.nHrirs = hrirSet.leaves[4].data.length;            // number of HRIR measurements
        this.nSamples = hrirSet.leaves[8].data[0][1].length;    // length of HRIRs
        // parse azimuth-elevation of HRIRs
        this.hrir_dirs_deg = [];
        hrirSet.leaves[4].data.forEach(function(element) {
                                       self.hrir_dirs_deg.push([element[0], element[1]]);
                                       });
        // parse HRIR buffers
        this.hrirs = [];
        hrirSet.leaves[8].data.forEach(function(element) {
                                       let left = new Float64Array(element[0]);
                                       let right = new Float64Array(element[1]);
                                       self.hrirs.push([left, right]);
                                       })
    }
    
    getClosestDirs(nearestIdx, hrir_dirs_deg) {
    // getClosestHrirFilters(target_dirs_deg, hrir_dirs_deg, INFO) {
        var nDirs = nearestIdx.length;
        var nearest_dirs_deg = [];
        for (let i = 0; i < nDirs; i++) {
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
    
    getClosestHrirFilters(nearestIdx, hrirs) {
    
        var nDirs = nearestIdx.length;
        var nearest_hrirs = [];
        for (let i = 0; i < nDirs; i++) {
            // get respective hrirs
            nearest_hrirs.push(hrirs[nearestIdx[i]]);
        }
        return nearest_hrirs;
    }
    
    computeDecFilters() {

        // get decoding matrix
        this.decodingMatrix = utils.getAmbiBinauralDecMtx(this.nearest_dirs_deg, this.order);
        // convert hrir filters to hoa filters
        this.hoaBuffer = this.getHoaFilterFromHrirFilter(this.nCh, this.nSamples, this.fs, this.vls_hrirs, this.decodingMatrix);
        // pass resulting hoa filters to user callback
        this.onLoad(this.hoaBuffer);
    }

    getHoaFilterFromHrirFilter(nCh, nSamples, sampleRate, hrirs, decodingMatrix) {
        // create empty buffer ready to receive hoa filters
        if (nSamples>hrirs[0][0].length) nSamples = hrirs[0][0].length;
        let hoaBuffer = this.context.createBuffer(nCh, nSamples, sampleRate);

        // sum weighted HRIR over Ambisonic channels to create HOA IRs
        for (let i = 0; i < nCh; i++) {
            let concatBufferArrayLeft = new Float32Array(nSamples);
            for (let j = 0; j < hrirs.length; j++) {
                for (let k = 0; k < nSamples; k++) {
                    concatBufferArrayLeft[k] += decodingMatrix[j][i] * hrirs[j][0][k];
                }
            }
            hoaBuffer.getChannelData(i).set(concatBufferArrayLeft);
        }
        return hoaBuffer;
    }

}
