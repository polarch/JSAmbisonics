////////////////////////////////////////////////////////////////////
//  Archontis Politis
//  archontis.politis@aalto.fi
//  David Poirier-Quinot
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
//  orderLimiter for 2D use
//  adapted by Thomas Deppisch
//  thomas.deppisch93@gmail.com
//
////////////////////////////////////////////////////////////////////
/////////////////////////
/* HOA ORDER LIMITER 2D*/
/////////////////////////

export default class orderLimiter2D {

    constructor(audioCtx, orderIn, orderOut) {

        this.ctx = audioCtx;
        this.orderIn = orderIn;
        if (orderOut < orderIn) this.orderOut = orderOut;
        else this.orderOut = orderIn;

        this.nChIn = 2 * this.orderIn + 1;
        this.nChOut = 2 * this.orderOut + 1;
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

        this.nChOut = 2 * this.orderOut + 1;
        this.out.disconnect();
        this.out = this.ctx.createChannelMerger(this.nChOut);

        for (let i = 0; i < this.nChOut; i++) {
            this.in.connect(this.out, i, i);
        }
    }
}
