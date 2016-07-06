////////////////////////////////////////////////////////////////////
//  Archontis Politis
//  archontis.politis@aalto.fi
////////////////////////////////////////////////////////////////////
//
//  WebAudio_FOA a JavaScript library for first-order Ambisonics
//  The library implements Web Audio blocks that perform
//  typical ambisonic processing operations on audio signals.
//
////////////////////////////////////////////////////////////////////


//////////////////////
/* B_FORMAT ENCODER */
//////////////////////
function Bformat_encoder(audioCtx)
{
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
    for (var i=0; i<4; i++) {
        this.gainNodes[i] = this.ctx.createGain();
//        this.gainNodes[i].channelCountMode = 'explicit';
//        this.gainNodes[i].channelCount = 1;
        this.gainNodes[i].gain.value = this.gains[i];
    }
    
    // Create connections
    for (var i=0; i<4; i++) {
        this.in.connect(this.gainNodes[i]);
        this.gainNodes[i].connect(this.out,0,i);
    }
    
    this.initialized = true;
}
            
Bformat_encoder.prototype.updateGains = function()
{
    var azi = this.azi * Math.PI/180;
    var elev = this.elev * Math.PI/180;
    
    this.gains[1] = Math.cos(azi)*Math.cos(elev);
    this.gains[2] = Math.sin(azi)*Math.cos(elev);
    this.gains[3] = Math.sin(elev);
    
    for (var i=1; i<4; i++) {
        this.gainNodes[i].gain.value = this.gains[i];
    }
}


//////////////////////
/* B_FORMAT ROTATOR */
//////////////////////
function Bformat_rotator(audioCtx)
{
    this.initialized = false;
    
    this.ctx = audioCtx;
    this.yaw = 0;
    this.pitch = 0;
    this.roll = 0;
    this.rotMtx = [[],[],[]];
    this.rotMtxNodes = [[],[],[]];
    // Input and output nodes
    this.in = this.ctx.createChannelSplitter(4);
    this.out = this.ctx.createChannelMerger(4);
    // Initialize rotation gains to identity matrix
    for (i=0; i<3; i++) {
        for (j=0; j<3; j++) {
            this.rotMtxNodes[i][j] = context.createGain();
            if (i == j) this.rotMtxNodes[i][j].gain.value = 1;
            else this.rotMtxNodes[i][j].gain.value = 0;
        }
    }
    // Create connections
    this.in.connect(this.out,0,0);
    
    for (i=0; i<3; i++) {
        for (j=0; j<3; j++) {
            this.in.connect(this.rotMtxNodes[i][j],j+1,0);
            this.rotMtxNodes[i][j].connect(this.out,0,i+1);
        }
    }
    
    this.initialized = true;
}

Bformat_rotator.prototype.updateRotMtx = function()
{
    var yaw = this.yaw*Math.PI/180;
    var pitch = this.pitch*Math.PI/180;
    var roll = this.roll*Math.PI/180;
    var Rxx, Rxy, Rxz, Ryx, Ryy, Ryz, Rzx, Rzy, Rzz;
    
    Rxx = Math.cos(pitch)*Math.cos(yaw);
    Rxy = Math.cos(pitch)*Math.sin(yaw);
    Rxz = -Math.sin(pitch);
    Ryx = Math.cos(yaw)*Math.sin(pitch)*Math.sin(roll) - Math.cos(roll)*Math.sin(yaw);
    Ryy = Math.cos(roll)*Math.cos(yaw) + Math.sin(pitch)*Math.sin(roll)*Math.sin(yaw);
    Ryz = Math.cos(pitch)*Math.sin(roll);
    Rzx = Math.sin(roll)*Math.sin(yaw) + Math.cos(roll)*Math.cos(yaw)*Math.sin(pitch);
    Rzy = Math.cos(roll)*Math.sin(pitch)*Math.sin(yaw) - Math.cos(yaw)*Math.sin(roll);
    Rzz = Math.cos(pitch)*Math.cos(roll);
    
    this.rotMtx = [[Rxx, Rxy, Rxz], [Ryx, Ryy, Ryz], [Rzx, Rzy, Rzz]];
    //console.log(this.rotMtx);

    for (i=0; i<3; i++) {
        for (j=0; j<3; j++) {
            this.rotMtxNodes[i][j].gain.value = this.rotMtx[i][j];
        }
    }
}


///////////////////////////////
/* B_FORMAT BINAURAL DECODER */
///////////////////////////////
function Bformat_binDecoder(audioCtx)
{
    this.initialized = false;
    
    this.ctx = audioCtx;
    this.decFilters = new Array(4);
    this.decFilterNodes = new Array(4);
    // input and output nodes
    this.in = this.ctx.createChannelSplitter(4);
    this.out = this.ctx.createChannelMerger(2);
    // downmixing gains for left and right ears
    this.gainMid = this.ctx.createGain();
    this.gainSide = this.ctx.createGain();
    this.invertSide = this.ctx.createGain();
    this.gainMid.gain.value = 1;
    this.gainSide.gain.value = 1;
    this.invertSide.gain.value = -1;
    // initialize convolvers
    for (var i=0; i<4; i++) {
        this.decFilterNodes[i] = this.ctx.createConvolver();
        this.decFilterNodes[i].normalize = false;
    }
    // initialize filters to plain opposing cardioids
    this.resetFilters();
    
    // Create connections
    for (var i=0; i<4; i++) {
        this.in.connect(this.decFilterNodes[i],i,0);
        
        if (i==2) this.decFilterNodes[i].connect(this.gainSide,0,0);
        else this.decFilterNodes[i].connect(this.gainMid,0,0);
    }
    this.gainMid.connect(this.out,0,0);
    this.gainSide.connect(this.out,0,0);

    this.gainMid.connect(this.out,0,1);
    this.gainSide.connect(this.invertSide,0,0);
    this.invertSide.connect(this.out,0,1);
    
    this.initialized = true;
}


Bformat_binDecoder.prototype.updateFilters = function(audioBuffer)
{
    // assign filters to convolvers
    for (var i=0; i<4; i++) {
        this.decFilters[i] = this.ctx.createBuffer(1, audioBuffer.length, audioBuffer.sampleRate);
        this.decFilters[i].getChannelData(0).set(audioBuffer.getChannelData(i));
        
        this.decFilterNodes[i].buffer = this.decFilters[i];
    }
}

Bformat_binDecoder.prototype.resetFilters = function(audioBuffer)
{
    // overwrite decoding filters with plain opposing cardioids
    var cardGains = [0.5*Math.SQRT2, 0, 0.5, 0];
    for (var i=0; i<4; i++) {
        this.decFilters[i] = this.ctx.createBuffer(1, 1, this.ctx.sampleRate);
        this.decFilters[i].getChannelData(0).set([cardGains[i]]);
        
        this.decFilterNodes[i].buffer = this.decFilters[i];
    }
}


/////////////////////////////////
/* B_FORMAT VIRTUAL MICROPHONE */
/////////////////////////////////
function Bformat_vmic(audioCtx)
{
    this.initialized = false;
    
    this.ctx = audioCtx;
    this.azi = 0;
    this.elev = 0;
    this.vmicGainNodes = new Array(4);
    this.vmicCoeff = 0.5;
    this.vmicPattern = "cardioid";
    this.in = this.ctx.createChannelSplitter(4);
    this.out = this.ctx.createGain();
    // Initialize vmic to forward facing cardioid
    this.vmicGains = [0.5*Math.SQRT2, 0.5, 0, 0];
    for (var i=0; i<4; i++) {
        this.vmicGainNodes[i] = this.ctx.createGain();
        this.vmicGainNodes[i].gain.value = this.vmicGains[i];
    }
    // Initialize orientation
    this.xyz = [1, 0, 0];
    // Create connections
    for (i=0; i<4; i++) {
        this.in.connect(this.vmicGainNodes[i],i,0);
        this.vmicGainNodes[i].connect(this.out);
    }
    
    this.initialized = true;
}

Bformat_vmic.prototype.updatePattern = function()
{
    switch(this.vmicPattern) {
        case "subcardioid":
            this.vmicCoeff = 2/3;
            break;
        case "cardioid":
            this.vmicCoeff = 1/2;
            break;
        case "supercardioid":
            this.vmicCoeff = (Math.sqrt(3)-1)/2;
            break;
        case "hypercardioid":
            this.vmicCoeff = 1/4;
            break;
        case "dipole":
            this.vmicCoeff = 0;
            break;
        default:
            this.vmicPattern = "cardioid";
            this.vmicCoeff = 1/2;
    }
    this.updateGains();
}

Bformat_vmic.prototype.updateOrientation = function()
{
    var azi = this.azi*Math.PI/180;
    var elev = this.elev*Math.PI/180;
    
    this.xyz[0] = Math.cos(azi)*Math.cos(elev);
    this.xyz[1] = Math.sin(azi)*Math.cos(elev);
    this.xyz[2] = Math.sin(elev);
    
    this.updateGains();
}

Bformat_vmic.prototype.updateGains = function()
{
    var a = this.vmicCoeff;
    var xyz = this.xyz;
    this.vmicGains[0] = a*Math.SQRT2;
    this.vmicGains[1] = (1-a)*xyz[0];
    this.vmicGains[2] = (1-a)*xyz[1];
    this.vmicGains[3] = (1-a)*xyz[2];
    
    for (var i=0; i<4; i++) {
        this.vmicGainNodes[i].gain.value = this.vmicGains[i];
    }
}


/////////////////////////////////
/* B_FORMAT INTENSITY ANALYZER */
/////////////////////////////////
function Bformat_analyser(audioCtx)
{
    this.initialized = false;
    
    this.ctx = audioCtx;
    this.fftSize = 2048;
    this.analysers = new Array(4);
    this.analBuffers = new Array(4);
    // Input and output nodes
    this.in = this.ctx.createChannelSplitter(4);
    this.out = this.ctx.createChannelMerger(4);
    // Initialize analyzer buffers
    for (var i=0; i<4; i++) {
        this.analysers[i] = this.ctx.createAnalyser();
        this.analysers[i].fftSize = this.fftSize;
        this.analysers[i].smoothingTimeConstant = 0;
        this.analBuffers[i] = new Float32Array(this.fftSize);
    }
    // Create connections
    for (var i=0; i<4; i++) {
        this.in.connect(this.out, i, i);
        this.in.connect(this.analysers[i], i, 0);
    }
    
    this.initialized = true;
}

Bformat_analyser.prototype.updateBuffers = function()
{
    // Get latest time-domain data
    for (var i=0; i<4; i++) {
        this.analysers[i].getFloatTimeDomainData(this.analBuffers[i]);
    }
}

Bformat_analyser.prototype.computeIntensity = function()
{
    // Compute correlations and energies of channels
    var iX = 0;
    var iY = 0;
    var iZ = 0;
    var WW = 0;
    var XX = 0;
    var YY = 0;
    var ZZ = 0;
    var I, I_norm, E, Psi, azi, elev;
    // Accumulators for correlations and energies
    for (i=0;i<this.fftSize;i++) {
        
        iX = iX + Math.sqrt(2)*this.analBuffers[0][i]*this.analBuffers[1][i];
        iY = iY + Math.sqrt(2)*this.analBuffers[0][i]*this.analBuffers[2][i];
        iZ = iZ + Math.sqrt(2)*this.analBuffers[0][i]*this.analBuffers[3][i];
        WW = WW + 2*this.analBuffers[0][i]*this.analBuffers[0][i];
        XX = XX + this.analBuffers[1][i]*this.analBuffers[1][i];
        YY = YY + this.analBuffers[2][i]*this.analBuffers[2][i];
        ZZ = ZZ + this.analBuffers[3][i]*this.analBuffers[3][i];
    }
    I = [iX, iY, iZ]; // intensity
    I_norm = Math.sqrt(I[0]*I[0] + I[1]*I[1] + I[2]*I[2]); // intensity magnitude
    E = (WW + XX + YY + ZZ)/2; // energy
    Psi = 1 - I_norm/(E+10e-8); // diffuseness
    azi = Math.atan2(iY, iX)*180/Math.PI;
    elev = Math.atan2(I[2], Math.sqrt(I[0]*I[0] + I[1]*I[1]))*180/Math.PI;

    var params = [azi, elev, Psi, E];
    return params;
}
