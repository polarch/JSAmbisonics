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

///////////////////////
/* HOA ORDER LIMITER */
///////////////////////

export default class orderLimiter {

    constructor(audioCtx, orderIn, orderOut) {

        this.ctx = audioCtx;
        this.orderIn = orderIn;
        if (orderOut < orderIn) this.orderOut = orderOut;
        else this.orderOut = orderIn;

        this.nChIn = (this.orderIn + 1) * (this.orderIn + 1);
        this.nChOut = (this.orderOut + 1) * (this.orderOut + 1);
        this.in = this.ctx.createChannelSplitter(this.nChIn);
        this.out = this.ctx.createChannelMerger(this.nChOut);

        for (let i = 0; i < this.nChOut; i++) {
            this.in.connect(this.out, i, i);
        }
    }

    updateOrder(orderOut) {

        if (orderOut <= this.orderIn) {
            this.orderOut = orderOut;
        }
        else return;

        this.nChOut = (this.orderOut + 1) * (this.orderOut + 1);
        this.out.disconnect();
        this.out = this.ctx.createChannelMerger(this.nChOut);

        for (let i = 0; i < this.nChOut; i++) {
            this.in.connect(this.out, i, i);
        }
    }
}
