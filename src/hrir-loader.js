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

        // DUMMY FILL IN OF THE BUFFER FOR NOW
        for (let i = 0; i < this.nCh; i++) {
            hoaBuffer.getChannelData(i).set(this.hrirBuffer[i].getChannelData(0));
        }

        return hoaBuffer;
    }

}
