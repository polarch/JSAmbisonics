////////////////////////////////////////////////////////////////////
//  Archontis Politis
//  archontis.politis@aalto.fi
////////////////////////////////////////////////////////////////////
//
//  WebAudio_HOA a JavaScript library for higher-order Ambisonics
//  The library implements Web Audio blocks that perform
//  typical ambisonic processing operations on audio signals.
//
////////////////////////////////////////////////////////////////////

/////////////////
/* HOA ENCODER */
/////////////////
function HOA_encoder(audioCtx, order)
{
    this.initialized = false;

    this.ctx = audioCtx;
    this.order = order;
    this.nCh = (order+1)*(order+1);
    this.azi = 0;
    this.elev = 0;
    this.gains = new Array(this.nCh);
    this.gainNodes = new Array(this.nCh);
    this.in = this.ctx.createGain();
    this.in.channelCountMode = 'explicit';
    this.in.channelCount = 1;
    this.out = this.ctx.createChannelMerger(this.nCh);
    // Initialize encoding gains
    for (var i=0; i<this.nCh; i++) {
        this.gainNodes[i] = this.ctx.createGain();
        this.gainNodes[i].channelCountMode = 'explicit';
        this.gainNodes[i].channelCount = 1;
    }
    this.updateGains();
    // Make audio connections
    for (var i=0; i<this.nCh; i++) {
        this.in.connect(this.gainNodes[i]);
        this.gainNodes[i].connect(this.out,0,i);
    }

    this.initialized = true;
}

HOA_encoder.prototype.updateGains = function()
{

    var N = this.order;
    var g_enc = computeRealSH(N, [[this.azi*Math.PI/180, this.elev*Math.PI/180]]);

    for (var i=0; i<this.nCh; i++) {
        this.gains[i] = g_enc[i][0];
        this.gainNodes[i].gain.value = this.gains[i];
    }
    console.log(this.gains);
}


///////////////////////
/* HOA ORDER LIMITER */
///////////////////////
function HOA_orderLimiter(audioCtx, orderIn, orderOut)
{
    this.ctx = audioCtx;
    this.orderIn = orderIn;
    if (orderOut<orderIn) this.orderOut = orderOut;
    else this.orderOut = orderIn;

    this.nChIn = (this.orderIn+1)*(this.orderIn+1);
    this.nChOut = (this.orderOut+1)*(this.orderOut+1);
    this.in = this.ctx.createChannelSplitter(this.nChIn);
    this.out = this.ctx.createChannelMerger(this.nChOut);

    for (var i=0; i<this.nChOut; i++) this.in.connect(this.out, i, i);
}

HOA_orderLimiter.prototype.updateOrder = function(orderOut)
{
    if (orderOut<=this.orderIn) this.orderOut = orderOut;
    else return;

    this.nChOut = (this.orderOut+1)*(this.orderOut+1);
    this.out.disconnect();
    this.out = this.ctx.createChannelMerger(this.nChOut);

    for (var i=0; i<this.nChOut; i++) this.in.connect(this.out, i, i);

}

/////////////////
/* HOA ROTATOR */
/////////////////
function HOA_rotator(audioCtx, order)
{
    this.ctx = audioCtx;
    this.order = order;
    this.nCh = (order+1)*(order+1);
    this.yaw = 0;
    this.pitch = 0;
    this.roll = 0;
    this.rotMtx = numeric.identity(this.nCh);
    this.rotMtxNodes = new Array(this.order);
    this.in = null;
    this.out = null;

    this.initialized = false;

}

HOA_rotator.prototype.updateRotMtx = function()
{
    if (!this.initialized) return;

    var yaw = this.yaw*Math.PI/180;
    var pitch = this.pitch*Math.PI/180;
    var roll = this.roll*Math.PI/180;

    this.rotMtx = getSHrotMtx(yawPitchRoll2Rzyx(yaw, pitch, roll), this.order);

    var band_idx = 1;
    for (var n=1; n<this.order+1; n++) {

        for (var i=0; i<2*n+1; i++) {
            for (var j=0; j<2*n+1; j++) {
                this.rotMtxNodes[n-1][i][j].gain.value = this.rotMtx[band_idx + i][band_idx + j];
            }
        }
        band_idx = band_idx + 2*n+1;
    }
}

HOA_rotator.prototype.init = function()
{
    if (this.initialized) return;

    // Input and output nodes
    this.in = this.ctx.createChannelSplitter(this.nCh);
    this.out = this.ctx.createChannelMerger(this.nCh);

    // Initialize rotation gains to identity matrix
    for (var n=1; n<this.order+1; n++) {

        var gains_n = new Array(2*n+1);
        for (var i=0; i<2*n+1; i++) {
            gains_n[i] = new Array(2*n+1);
            for (var j=0; j<2*n+1; j++) {
                gains_n[i][j] = this.ctx.createGain();
                if (i == j) gains_n[i][j].gain.value = 1;
                else gains_n[i][j].gain.value = 0;
            }
        }
        this.rotMtxNodes[n-1] = gains_n;
    }

    // Create connections
    this.in.connect(this.out,0,0); // zeroth order ch. does not rotate

    var band_idx = 1;
    for (var n=1; n<this.order+1; n++) {
        for (var i=0; i<2*n+1; i++) {
            for (var j=0; j<2*n+1; j++) {
                this.in.connect(this.rotMtxNodes[n-1][i][j],band_idx+j,0);
                this.rotMtxNodes[n-1][i][j].connect(this.out,0,band_idx+i);
            }
        }
        band_idx = band_idx + 2*n+1;
    }

    this.initialized = true;
}


//////////////////////////
/* HOA BINAURAL DECODER */
//////////////////////////
function HOA_binDecoder(audioCtx, order)
{
    this.initialized = false;

    this.ctx = audioCtx;
    this.order = order;
    this.nCh = (order+1)*(order+1);
    this.decFilters = new Array(2*this.nCh);
    this.decFilterNodes = new Array(2*this.nCh);
    // input and output nodes
    this.in = this.ctx.createChannelSplitter(this.nCh);
    this.out = this.ctx.createChannelMerger(2);
    // convolver nodes
    for (var i=0; i<2*this.nCh; i++) {
        this.decFilterNodes[i] = this.ctx.createConvolver();
        this.decFilterNodes[i].normalize = false;
    }
    // initialize convolvers to plain cardioids
    this.resetFilters();
    // create audio connections
    for (var i=0; i<this.nCh; i++) {
        // connect left ear filters
        this.in.connect(this.decFilterNodes[2*i],i,0);
        this.decFilterNodes[2*i].connect(this.out,0,0);
        // connect right ear filters
        this.in.connect(this.decFilterNodes[2*i+1],i,0);
        this.decFilterNodes[2*i+1].connect(this.out,0,1);
    }

    this.initialized = true;
}

HOA_binDecoder.prototype.updateFilters = function(audioBuffer)
{
    // assign filters to convolvers
    for (var i=0; i<2*this.nCh; i++) {
        this.decFilters[i] = this.ctx.createBuffer(1, audioBuffer.length, audioBuffer.sampleRate);
        this.decFilters[i].getChannelData(0).set(audioBuffer.getChannelData(i));

        this.decFilterNodes[i].buffer = this.decFilters[i];
    }
}

HOA_binDecoder.prototype.resetFilters = function()
{
    // overwrite decoding filters (plain cardioid virtual microphones)
    var cardGains = new Array(this.nCh);
    cardGains.fill(0);
    cardGains[0] = 0.5;
    cardGains[1] = 0.5/Math.sqrt(3);
    for (var i=0; i<this.nCh; i++) {
        this.decFilters[i] = this.ctx.createBuffer(1, 1, this.ctx.sampleRate);
        this.decFilters[i].getChannelData(0).set([cardGains[i]]);
        this.decFilterNodes[i].buffer = this.decFilters[i];
    }
}

/////////////////////////////////
/* HOA VIRTUAL MICROPHONE */
/////////////////////////////////
function HOA_vmic(audioCtx, order)
{
    this.initialized = false;

    this.ctx = audioCtx;
    this.order = order;
    this.nCh = (order+1)*(order+1);
    this.azi = 0;
    this.elev = 0;
    this.vmicGains = new Array(this.nCh);
    this.vmicGainNodes = new Array(this.nCh);
    this.vmicCoeffs = new Array(this.order+1);
    this.vmicPattern = "hypercardioid";
    this.in = this.ctx.createChannelSplitter(this.nCh);
    this.out = this.ctx.createGain();

    // Initialize vmic to forward facing hypercardioid
    for (var i=0; i<this.nCh; i++) {
        this.vmicGainNodes[i] = this.ctx.createGain();
    }
    this.SHxyz = new Array(this.nCh);
    this.SHxyz.fill(0);
    this.updatePattern();
    this.updateOrientation();

    // Create connections
    for (i=0; i<this.nCh; i++) {
        this.in.connect(this.vmicGainNodes[i],i,0);
        this.vmicGainNodes[i].connect(this.out);
    }

    this.initialized = true;
}

HOA_vmic.prototype.updatePattern = function()
{

    function computeCardioidCoeffs(N) {
        var coeffs = new Array(N+1);
        for (var n=0; n<N+1; n++) {
            coeffs[n] = Math.sqrt(2*n+1) * factorial(N)*factorial(N+1)/(factorial(N+n+1)*factorial(N-n))/(N+1);
        }
        console.log(coeffs);
        return coeffs;
    }
    function computeHypercardCoeffs(N) {
        var coeffs = new Array(N+1);
        coeffs.fill(1);
        return coeffs;
    }
    function computeMaxRECoeffs(N) {
        var coeffs = new Array(N+1);
        coeffs[0] = 1;
        var leg_n_minus1 = 0;
        var leg_n_minus2 = 0;
        var leg_n = 0;
        for (var n=1; n<N+1; n++) {
            leg_n = recurseLegendrePoly(n, [Math.cos(2.406809/(N+1.51))], leg_n_minus1, leg_n_minus2);
            coeffs[n] = leg_n[0][0];

            leg_n_minus2 = leg_n_minus1;
            leg_n_minus1 = leg_n;
        }
        console.log(coeffs);
        return coeffs;
    }

    switch(this.vmicPattern) {
        case "cardioid":
            // higher-order cardioid given by: (1/2)^N * ( 1+cos(theta) )^N
            this.vmicCoeffs = computeCardioidCoeffs(this.order);
            break;
        case "supercardioid":
            // maximum front-back energy ratio
            // TBD
            break;
        case "hypercardioid":
            // maximum directivity factor
            // (this is the classic plane/wave decomposition beamformer,
            // also termed "regular" in spherical beamforming literature)
            this.vmicCoeffs = computeHypercardCoeffs(this.order);
            break;
        case "max_rE":
            // quite similar to maximum front-back rejection
            this.vmicCoeffs = computeMaxRECoeffs(this.order);
            break;
        default:
            this.vmicPattern = "hypercardioid";
            this.vmicCoeffs = computeHypercardCoeffs(this.order);
    }

    this.updateGains();
}

HOA_vmic.prototype.updateOrientation = function()
{

    var azi = this.azi*Math.PI/180;
    var elev = this.elev*Math.PI/180;

    var tempSH = computeRealSH(this.order, [[azi, elev]]);

    for (var i=1; i<this.nCh; i++) {
        this.SHxyz[i] = tempSH[i][0];
    }

    this.updateGains();
}

HOA_vmic.prototype.updateGains = function()
{

    var q;
    for (var n=0; n<this.order+1; n++) {
        for (var m=-this.order; m<this.order+1; m++) {
            q = n*n+n+m;
            this.vmicGains[q] = (1/Math.sqrt(2*n+1)) * this.vmicCoeffs[n] * this.SHxyz[q];
        }
    }

    for (var i=1; i<this.nCh; i++) {
        this.vmicGainNodes[i].gain.value = this.vmicGains[i];
    }
}


///////////////////////////////////
/* B-FORMAT TO ACN/N3D CONVERTER */
///////////////////////////////////
function HOA_bf2acn(audioCtx)
{
    this.ctx = audioCtx;
    this.in = this.ctx.createChannelSplitter(4);
    this.out = this.ctx.createChannelMerger(4);
    this.gains = [];

    for (var i=0; i<4; i++) {
        this.gains[i] = this.ctx.createGain();
        if (i==0) this.gains[i].gain.value = Math.SQRT2;
        else this.gains[i].gain.value = Math.sqrt(3);

        this.gains[i].connect(this.out,0,i);
    }
    this.in.connect(this.gains[0],0,0);
    this.in.connect(this.gains[3],1,0);
    this.in.connect(this.gains[1],2,0);
    this.in.connect(this.gains[2],3,0);
}


///////////////////////////////////
/* ACN/N3D TO B-FORMAT CONVERTER */
///////////////////////////////////
function HOA_acn2bf(audioCtx)
{
    this.ctx = audioCtx;
    this.in = this.ctx.createChannelSplitter(4);
    this.out = this.ctx.createChannelMerger(4);
    this.gains = [];

    for (var i=0; i<4; i++) {
        this.gains[i] = this.ctx.createGain();
        if (i==0) this.gains[i].gain.value = Math.SQRT1_2;
        else this.gains[i].gain.value = 1/Math.sqrt(3);

        this.gains[i].connect(this.out,0,i);
    }
    this.in.connect(this.gains[0],0,0);
    this.in.connect(this.gains[2],1,0);
    this.in.connect(this.gains[3],2,0);
    this.in.connect(this.gains[1],3,0);
}
