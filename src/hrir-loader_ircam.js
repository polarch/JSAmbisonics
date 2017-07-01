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

import * as serveSofaHrir from 'serve-sofa-hrir';
var utils = require("./utils.js");

export default class HRIRloader_ircam {
    constructor(context, order, callback) {
        this.context = context;
        this.order = order;
        this.nCh = (order + 1) * (order + 1);

        // fonction called when filters loaded
        this.onLoad = callback;

        // instantiate hrtfset from serve-sofa-hrtf lib
        this.hrtfSet = new serveSofaHrir.HrtfSet({ audioContext:this.context, coordinateSystem:'sofaSpherical' });

        // define required speakers (hence hrirs) positions based on Ambisonic order
        this.wishedSpeakerPos = utils.getTdesign(2*this.order);
    }

    load(setUrl) {

        this.hrtfSet.load(setUrl).then( () => {

            // extract hrir buffers of interest from the database
            let grantedFilterPos = [];
            this.hrirBuffer = [];
            for (let i = 0; i < this.wishedSpeakerPos.length; i++) {
                // get available positions (in the db) nearest from the required speakers positions
                grantedFilterPos.push(this.hrtfSet.nearest(this.wishedSpeakerPos[i]).position);
                // get related hrir
                this.hrirBuffer.push(this.hrtfSet.nearest(this.wishedSpeakerPos[i]).fir);
            }

            // DEBUG //////////////////////////////////////////////////////
            // compare required vs. present positions in HRIR filter
            let angularDistDeg = 0;
            for (let i = 0; i < this.wishedSpeakerPos.length; i++) {
                if (this.wishedSpeakerPos[i][0] < 0) this.wishedSpeakerPos[i][0] += 360.0;
                angularDistDeg += Math.sqrt(
                    Math.pow(this.wishedSpeakerPos[i][0] - grantedFilterPos[i][0], 2) +
                    Math.pow(this.wishedSpeakerPos[i][1] - grantedFilterPos[i][1], 2));
                // console.log('asked / granted pos: ', this.wishedSpeakerPos[i], '/', grantedFilterPos[i]);
            }
            console.log('summed / average angular dist between asked and present pos:',
                Math.round(angularDistDeg*100)/100, 'deg /',
                Math.round( (angularDistDeg/this.wishedSpeakerPos.length) *100)/100, 'deg');
            // DEBUG END //////////////////////////////////////////////////

            // get decoding matrix
            this.decodingMatrix = utils.getAmbisonicDecMtx(grantedFilterPos, this.order);

            // convert hrir filters to hoa filters
            this.hoaBuffer = this.getHoaFilterFromHrirFilter();

            // pass resulting hoa filters to user callback
            this.onLoad(this.hoaBuffer);
        })
    }

    getHoaFilterFromHrirFilter() {
        // create empty buffer ready to receive hoa filters
        let hrirBufferLength = this.hrirBuffer[0].length; // assuming they all have the same
        let hrirBufferSampleRate = this.hrirBuffer[0].sampleRate; // same
        let hoaBuffer = this.context.createBuffer(this.nCh, hrirBufferLength, hrirBufferSampleRate);

        // sum weighted HRIR over Ambisonic channels to create HOA IRs
        for (let i = 0; i < this.nCh; i++) {
            let concatBufferArrayLeft = new Float32Array(hrirBufferLength);
            for (let j = 0; j < this.hrirBuffer.length; j++) {
                for (let k = 0; k < hrirBufferLength; k++) {
                    concatBufferArrayLeft[k] += this.decodingMatrix[j][i] * this.hrirBuffer[j].getChannelData(0)[k];
                }
            }
            hoaBuffer.getChannelData(i).set(concatBufferArrayLeft);
        }

        return hoaBuffer;
    }

}
