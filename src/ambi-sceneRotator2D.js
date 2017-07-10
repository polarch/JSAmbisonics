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
//  sceneRotator for 2D use
//  adapted by Thomas Deppisch
//  thomas.deppisch93@gmail.com
//
////////////////////////////////////////////////////////////////////
////////////////////
/* HOA ROTATOR 2D */
///////////////////

export default class sceneRotator2D {

    constructor(audioCtx, order) {

        this.ctx = audioCtx;
        this.order = order;
        this.nCh = 2*order + 1;
        this.yaw = 0;

        // Input and output nodes
        this.in = this.ctx.createChannelSplitter(this.nCh);
        this.out = this.ctx.createChannelMerger(this.nCh);

        this.rotMtxNodes = new Array(2*this.order);
        this.in.connect(this.out, 0, 0); // W channel does not rotate

        //initialize gain nodes
        for (var i=0;i<(2*this.order);i=i+2){
          // every output needs two gain nodes
          var tempGainArr = new Array(2);
          tempGainArr[0] = this.ctx.createGain();
          tempGainArr[1] = this.ctx.createGain();
          var tempGainArr2 = new Array(2);
          tempGainArr2[0] = this.ctx.createGain();
          tempGainArr2[1] = this.ctx.createGain();

          this.rotMtxNodes[i] = tempGainArr;
          this.rotMtxNodes[i+1] = tempGainArr2;
          //Input Channels: [W,Y,X,Y2,X2,Y3,X3,...]
          this.in.connect(this.rotMtxNodes[i][0],(i+1),0);
          this.rotMtxNodes[i][0].connect(this.out,0,i+1);
          this.in.connect(this.rotMtxNodes[i][1],(i+2),0);
          this.rotMtxNodes[i][1].connect(this.out,0,i+1);

          this.in.connect(this.rotMtxNodes[i+1][0],(i+1),0);
          this.rotMtxNodes[i+1][0].connect(this.out,0,i+2);
          this.in.connect(this.rotMtxNodes[i+1][1],(i+2),0);
          this.rotMtxNodes[i+1][1].connect(this.out,0,i+2);
        }
        // initialize rotation matrix
        this.updateRotMtx();
    }

    updateRotMtx() {
        var azim = this.yaw * Math.PI / 180;
        var j = 1;
        for (let i=0;i<(2*this.order);i=i+2){
          // channels are ACN ordered!
          this.rotMtxNodes[i][0].gain.value = Math.cos(j*azim);
          this.rotMtxNodes[i][1].gain.value = Math.sin(j*azim);
          this.rotMtxNodes[i+1][0].gain.value = -Math.sin(j*azim);
          this.rotMtxNodes[i+1][1].gain.value = Math.cos(j*azim);
          j++;
        }
    }
}
