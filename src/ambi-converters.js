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

///////////////////////////////////
/* FOA B-FORMAT TO ACN/N3D CONVERTER */
///////////////////////////////////
export class bf2acn {

    constructor(audioCtx) {

        this.ctx = audioCtx;
        this.in = this.ctx.createChannelSplitter(4);
        this.out = this.ctx.createChannelMerger(4);
        this.gains = [];

        for (var i = 0; i < 4; i++) {
            this.gains[i] = this.ctx.createGain();
            if (i == 0) this.gains[i].gain.value = Math.SQRT2;
            else this.gains[i].gain.value = Math.sqrt(3);

            this.gains[i].connect(this.out, 0, i);
        }
        this.in.connect(this.gains[0], 0, 0);
        this.in.connect(this.gains[3], 1, 0);
        this.in.connect(this.gains[1], 2, 0);
        this.in.connect(this.gains[2], 3, 0);
    }
}

///////////////////////////////////
/* ACN/N3D TO FOA B-FORMAT CONVERTER */
///////////////////////////////////
export class acn2bf {

    constructor(audioCtx) {

        this.ctx = audioCtx;
        this.in = this.ctx.createChannelSplitter(4);
        this.out = this.ctx.createChannelMerger(4);
        this.gains = [];

        for (var i = 0; i < 4; i++) {
            this.gains[i] = this.ctx.createGain();
            if (i == 0) this.gains[i].gain.value = Math.SQRT1_2;
            else this.gains[i].gain.value = 1 / Math.sqrt(3);

            this.gains[i].connect(this.out, 0, i);
        }
        this.in.connect(this.gains[0], 0, 0);
        this.in.connect(this.gains[2], 1, 0);
        this.in.connect(this.gains[3], 2, 0);
        this.in.connect(this.gains[1], 3, 0);
    }
}

///////////////////////////////////
/* ACN/N3D TO B-FORMAT CONVERTER */
///////////////////////////////////
export class fuma2acn {

    constructor(audioCtx, order) {

        this.ctx = audioCtx;
        this.order = order;
        this.nCh = (order + 1) * (order + 1);
        this.in = this.ctx.createChannelSplitter(this.nCh);
        this.out = this.ctx.createChannelMerger(this.nCh);
        this.gains = [];
        this.remapArray = [];

        // get channel remapping values order 0-1
        this.remapArray.push(0, 2, 3, 1); // manually handle until order 1

        // get channel remapping values order 2-N
        var o = 0;
        var m;
        for (var i = 0; i < this.nCh; i++) {
            m = [];
            if (i >= (o + 1) * (o + 1)) {
                o += 1;
                for (var j = (o + 1) * (o + 1); j < (o + 2) * (o + 2); j++) {
                    if (((j + o % 2) % 2) == 0) { m.push(j) } else { m.unshift(j) }
                }
                this.remapArray = this.remapArray.concat(m);
            }
        }

        // connect inputs/outputs (kept separated for clarity's sake)
        for (var i = 0; i < this.nCh; i++) {
            this.gains[i] = this.ctx.createGain();
            this.in.connect(this.gains[i], this.remapArray[i], 0);
            this.gains[i].connect(this.out, 0, i);
        }
    }
}
