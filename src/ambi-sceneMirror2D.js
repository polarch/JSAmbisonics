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
//  sceneMirror for 2D use
//  adapted by Thomas Deppisch
//  thomas.deppisch93@gmail.com
//
////////////////////////////////////////////////////////////////////
//////////////////
/* HOA MIRROR 2D*/
//////////////////

export default class sceneMirror2D {

    constructor(audioCtx, order) {

        this.ctx = audioCtx;
        this.order = order;
        this.nCh = 2 * order + 1;
        this.mirrorPlane = 0;
        // Input and output nodes
        this.in = this.ctx.createChannelSplitter(this.nCh);
        this.out = this.ctx.createChannelMerger(this.nCh);
        // Initialize mirroring gains to unity (no reflection) and connect
        this.gains = new Array(this.nCh);
        for (var q = 0; q < this.nCh; q++) {
            this.gains[q] = this.ctx.createGain();
            this.gains[q].gain.value = 1;
            // Create connections
            this.in.connect(this.gains[q], q, 0);
            this.gains[q].connect(this.out, 0, q);
        }

    }

    reset() {

        for (var q = 0; q < this.nCh; q++) {
            this.gains[q].gain.value = 1;
        }
    }

    mirror(planeNo) {

        switch(planeNo) {
            case 0:
                this.mirrorPlane = 0;
                this.reset();
                break;
            case 1:
                // mirroring on yz-plane (front-back)
                this.reset();
                this.mirrorPlane = 1;
                for (var i = 2; i < this.nCh; i++) {
                    this.gains[i].gain.value = -1;
                    if (i%2 != 0) i = i + 2;
                }
                break;
            case 2:
                // mirroring on xz-plane (left-right)
                this.reset();
                this.mirrorPlane = 2;
                for (var i = 0; i < this.nCh; i++) {
                    if (i%2 != 0) this.gains[i].gain.value = -1;
                }
                break;
            case 3:
                // mirroring on xy-plane (up-down)
                console.log("up-down mirroring in 2D mode not possible")
                break;
            default:
                console.log("The mirroring planes can be either 1 (yz), 2 (xz) or 0 (no mirroring). Value set to 0.")
                this.mirrorPlane = 0;
                this.reset();
        }


    }

}
