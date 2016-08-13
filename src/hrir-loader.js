////////////////////////////////////////////////////////////////////
//  Archontis Politis (Aalto University)
//  archontis.politis@aalto.fi
//  David Poirier-Quinot (IRCAM)
//  davipoir@ircam.fr
////////////////////////////////////////////////////////////////////
//
//  WebAudio_HOA a JavaScript library for higher-order Ambisonics
//  The library implements Web Audio blocks that perform
//  typical ambisonic processing operations on audio signals.
//
////////////////////////////////////////////////////////////////////

/////////////////
/* HRIR LOADER */
/////////////////

import * as serveSofaHrtf from 'serve-sofa-hrtf';
import {getTdesign} from './utils'

var ambidec = require("../utils/binAmbidec.js")

export default class HRIRloader {
    constructor(context, order, callback) {
        this.context = context;
        this.order = order;
        this.nCh = (order + 1) * (order + 1);

        // fonction called when filters loaded
        this.onLoad = callback;

        // instantiate hrtfset from serve-sofa-hrtf lib
        this.hrtfSet = new serveSofaHrtf.HrtfSet({ audioContext:this.context, coordinateSystem:'sofaSpherical' });

        // define required speakers (hence hrirs) positions based on Ambisonic order
        this.wishedSpeakerPos = getTdesign(2*this.order);
    }



    load(setUrl) {

        this.hrtfSet.load(setUrl).then( () => {

            // extract hrir buffers of interest from the database
            this.grantedFilterPos = [];
            this.hrirBuffer = [];
            for (let i = 0; i < this.wishedSpeakerPos.length; i++) {
                // get available positions (in the db) nearest from the required speakers positions
                this.grantedFilterPos.push(this.hrtfSet.nearest(this.wishedSpeakerPos[i]).position);
                // get related hrir
                this.hrirBuffer.push(this.hrtfSet.nearest(this.wishedSpeakerPos[i]).fir);
            }

            // DEBUG
            for (let i = 0; i < this.wishedSpeakerPos.length; i++) {
                console.log('asked / granted pos: ', this.wishedSpeakerPos[i], '/', this.grantedFilterPos[i]);
            }
            console.log('hrirBuffer: ', this.hrirBuffer);

            // get decoding matrix
            // - from deg to rad
            this.grantedFilterPosRad = [];
            for (let i = 0; i < this.grantedFilterPos.length; i++) {
                this.grantedFilterPosRad.push([
                    this.grantedFilterPos[i][0] * Math.PI / 180.0,
                    this.grantedFilterPos[i][1] * Math.PI / 180.0,
                    this.grantedFilterPos[i][2]
                    ]);
            }
            // - get decoding matrix
            this.M_dec = ambidec.getAmbiBinauralDecMtx( this.grantedFilterPosRad, this.order );
            console.log('decoding matrix: ', this.M_dec);

            // convert hrir filters to hoa filters
            this.hoaBuffer = this.getHoaFilterFromHrirFilter();
            console.log('hoaBuffer: ', this.hoaBuffer);

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
                    concatBufferArrayLeft[k] += this.M_dec[j][i] * this.hrirBuffer[j].getChannelData(0)[k];
                }
            }
            // console.log('concat buffer: ',i,concatBufferArrayLeft);
            hoaBuffer.getChannelData(i).set(concatBufferArrayLeft);
        }

        return hoaBuffer;
    }

}
