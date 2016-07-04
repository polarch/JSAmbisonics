////////////////////////////////////////////////////////////////////
//  Archontis Politis
//  archontis.politis@aalto.fi
//  David Poirier-Quinot
//  davipoir@ircam.fr
////////////////////////////////////////////////////////////////////
//
//  WebAudio_HOA a JavaScript library for higher-order Ambisonics
//  The library implements Web Audio blocks that perform
//  typical ambisonic processing operations on audio signals.
//
////////////////////////////////////////////////////////////////////

//////////////////////
/* B_FORMAT ENCODER */
//////////////////////

export default class Bformat_encoder {

    constructor(audioCtx) {

        this.initialized = false;

        this.ctx = audioCtx;
        this.azi = 0;
        this.elev = 0;
        this.gainNodes = new Array(4);
        this.in = this.ctx.createGain();
        //    this.in.channelCountMode = 'explicit';
        //    this.in.channelCount = 1;
        this.out = this.ctx.createChannelMerger(4);
        // initialize gains to front direction
        this.gains = [Math.SQRT1_2, 1, 0, 0];
        for (let i = 0; i < 4; i++) {
            this.gainNodes[i] = this.ctx.createGain();
            //        this.gainNodes[i].channelCountMode = 'explicit';
            //        this.gainNodes[i].channelCount = 1;
            this.gainNodes[i].gain.value = this.gains[i];
        }

        // Create connections
        for (let i = 0; i < 4; i++) {
            this.in.connect(this.gainNodes[i]);
            this.gainNodes[i].connect(this.out, 0, i);
        }

        this.initialized = true;
    }

    updateGains() {
        let azi = this.azi * Math.PI / 180;
        let elev = this.elev * Math.PI / 180;

        this.gains[1] = Math.cos(azi) * Math.cos(elev);
        this.gains[2] = Math.sin(azi) * Math.cos(elev);
        this.gains[3] = Math.sin(elev);

        for (let i = 1; i < 4; i++) {
            this.gainNodes[i].gain.value = this.gains[i];
        }
    }
}
