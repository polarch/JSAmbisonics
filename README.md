# JSAmbisonics
A JS library for first-order ambisonic (FOA) and higher-order ambisonic (HOA) processing for  browsers, using Web Audio.

> Archontis Politis (Aalto University)
> archontis.politis@aalto.fi
>
> David Poirier-Quinot (IRCAM)
> david.poirier-quinot@ircam.fr

----
## Description
JSAmbisonics is a JavaScript library that implements a set of objects for real-time spatial audio processing, using the Ambisonics framework. The objects correspond to typical ambisonic processing blocks, and internally implement Web Audio graphs for the associated operations. The library is based on 3 main components:
* **FOA classes**: to design first-order ambisonics, based on the B-format signal set.
* **HOA classes**:to design higher-order Ambisonics, based on the ACN signal set specification, with N3D normalization of the Ambisonic signals. Most of its internal routines are based on the **JSHlib.js** library for spherical harmonics, and the [numeric.js](http://www.numericjs.com/) JavaScript library for matrix and vector operations.
* **JSHlib**: A library that computes real spherical harmonics, the spherical harmonic transform (SHT) and its inverse, and rotations in the spherical harmonic domain. Requires the [numeric.js](http://www.numericjs.com/) JavaScript library for matrix and vector operations.

The library is a work-in-progress, but fully functional. At the moment, demos seem to work fine in Mozilla Firefox and Google Chrome. No other browsers have been checked yet.

---
## Live demo (Chrome and Firefox)

See the live [Rawgit demo](https://rawgit.com/polarch/JSAmbisonics/f56b0aece88087f939fa4727c64fcd9191573265/index.html)  (serving the content of the ``./examples`` folder).

HOA recordings are made by the author in the [Communication Acoustics laboratory of Aalto University](http://spa.aalto.fi/en/research/research_groups/communication_acoustics/), using the [Eigenmike](http://www.mhacoustics.com/products#eigenmike1) microphone.

---
## First-order (B-format) Ambisonics

FOA classes implemented:
* **Bformat_encoder**: encodes a monophonic sound source to a B-format stream, at a user-defined panning direction.
* **Bformat_rotator**: rotates the sound scene of a B-format stream, at user-defined yaw, pitch, roll rotation angles.
* **Bformat_vmic**: implements standard virtual microphones to a B-format stream, with user-defined orientation.
* **Bformat_binDecoder**: implements a B-format to binaural conversion, using user-defined HRTF-based filters. If these are not provided, two plain opposing cardioids are used instead.
* **Bformat_analyser**: implements an acoustic intensity analysis for visualization of directional information captured in the B-format stream.

---
## Higher-order (ACN/N3D) ambisonics

HOA classes implemented:
* **HOA_encoder**: encodes a monophonic sound source to a HOA stream of a set order, at a user-defined panning direction.
* **HOA_rotator**: rotates the sound scene of a HOA stream, at user-defined yaw, pitch, roll rotation angles.
* **HOA_vmic**: implements higher-order virtual microphones to a HOA stream, with user-defined orientation.
* **HOA_binDecoder**: implements a HOA to binaural conversion, using user-defined HRTF-based filters. If these are not provided, two plain opposing cardioids are used instead.
* **HOA_order_limiter**: takes a HOA stream of order N, and outputs the channel limited HOA stream of order N'<=N
* **HOA_bf2acn**: converts a B-format stream to an ACN/N3D HOA stream
* **HOA_acn2bf**: converts the first-order channels of a HOA stream to B-format
* **HOA_analyser**: implements an acoustic intensity analysis for visualization of directional information captured in the HOA stream.

---
## Usage

All objects have an input node *object.in* and an output node *object.out* which are used for the connections. The number of channels expected from each input depends on the object (for example a B-format encoder expects a monophonic signal, and outputs 4 channels, a B-format binaural decoder expects 4-channel input and outputs 2 channels, etc.). Example connections:
```javascript
soundBufferPlayer.connect(BFencoder.in);
BFencoder.out.connect(BFrotator.in);
BFrotator.out.connect(BFbinDecoder.in);
BFbinDecoder.connect(audioContext.destination);
```
which implements a graph such as:
```
soundBufferPlayer ------------->BFencoder------------>BFrotator---------->BFbinDecoder-------------->out
                  mono stream            BF stream             BF stream              stereo stream
```
and
```javascript
soundBufferPlayer.connect(BFvmic.in);
BFvmic.out.connect(audioContext.destination);
```
with a graph such as:
```
soundBufferPlayer ------------->BFvmic------------>out
                  BF stream           mono stream
```

To use either FOA or HOA objects, include the JSAmbisonic library in the body of your html code as:
```javascript
<script type="text/javascript" src="web-audio-ambisonic.umd.js"></script>
```

See the scripts in the ``./examples`` folder for more insights on how to use the different objects of the library.

### Usage (FOA detail)

**B-format encoder** is initialized inside your JavaScript code as

```javascript
var BFencoder = new webAudioAmbisonic.Bformat_encoder(audioContext)
```

where *context* is the current Web Audio context. The input stream comes from an audio node to be spatialized.
The azimuth and elevation of the encoded source can be updated at runtime by

```javascript
BFencoder.azi = azi_value_in_degrees;
BFencoder.elev = elev_value_in_degrees;
BFencoder.updateGains();
```

**B-format rotator** is initialized inside your JavaScript code as

```javascript
var BFrotator = new webAudioAmbisonic.Bformat_rotator(audioContext)
```

where *context* is the current Web Audio context.
The yaw (Z-axis rotation), pitch (Y-axis) and roll (X-axis) rotation angles can be updated at runtime by
```javascript
BFrotator.yaw = yaw_value_in_degrees;
BFrotator.pitch = pitch_value_in_degrees;
BFrotator.roll = roll_value_in_degrees;
BFrotator.updateRotMtx();
```

**B-format binaural decoder** is initialized inside your JavaScript code as

```javascript
var BFbinDecoder = new webAudioAmbisonic.Bformat_binDecoder(audioContext)
```

where *context* is the current Web Audio context. If no decoding filters are passed to the decoder, an initial decoding based on two opposing cardioids is defined by default.
In case binaural decoding filters are available, they should be loaded in a multichannel (4-channel) *audioBuffer* and passed to the decoder through

```javascript
BFbinDecoder.updateFilters(audioBuffer);
```

Some FOA and HOA HRTF-based decoding filters are included in the examples.

**B-format virtual microphone** is initialized inside your JavaScript code as

```javascript
var BFvmic = new webAudioAmbisonic.Bformat_vmic(audioContext)
```

where *context* is the current Web Audio context. The virtual microphone is initialized to a cardioid pointing to the front. The orientation can be updated at runtime by

```javascript
BFvmic.azi = azi_value_in_degrees;
BFvmic.elev = elev_value_in_degrees;
BFvmic.updateOrientation();
```

The pattern of the microphone can be also updated by

```javascript
BFvmic.vmicPattern = string;
BFvmic.updatePattern();
```
where *string* can be one of the following:
* "subcardioid"
* "cardioid"
* "supercardioid"
* "hypercardioid"
* "dipole"


### Usage (HOA detail)

The initialization and usage of all objects is the same as for the B-format with the following differences:

1. In the initialization the *order* should be passed after the *audioContext*, which defines the HOA order and the number of channels of the HOA stream, e.g.
```javascript
var HOAencoder = new webAudioAmbisonic.HOA_encoder(audioContext, order)
```

2. The *HOA_binDecoder* now requires a multichannel *audioBuffer* for the binaural filters that has *(order+1)^2* filters (e.g. 9 filters for *order=2*, 16 filters for *order=3*, etc.). Chrome seems to have problems at the moment to decode multichannel WAVE files of more than 8 channels, so the HOA filters should be loaded from 8ch files with groups of the HOA channels. Firefox does not seem to have any problem with >8ch. After the individual 8ch buffers have been loaded in the Web Audio context, then they should be merged into an *audiobuffer* with all HOA channels. A helper sound file loading class *HOAloader.js* is provided for that; for more info see below.

3. The *HOA_vmic* has as available higher-order patterns the following: {"cardioid","hypercardioid","max-rE"}, where the *max-rE* specification is the pattern that maximizes the energy vector for a given order, with high front-to-back rejection ratio. The higher-order hypercardioid has the maximum directivity factor for a given order.

The HOA code is based on the larger Matlab [HOA](https://github.com/polarch/Higher-Order-Ambisonics) and [Spherical Harmonic Transform](https://github.com/polarch/Spherical-Harmonic-Transform) libraries contributed by the author in Github. The rotation algorithm is the fast recursive one by [Ivanic and Ruedenberg](http://pubs.acs.org/doi/abs/10.1021/jp953350u?journalCode=jpchax).

---
## Note on the loading of multichannel files for HOA

The HOA processing of *order=N* requires audio streams of *(N+1)^2* channels. Loading HOA recordins or HOA binaural filters from sound files of that many channels seems to be problematic for the browsers. Firefox seems to be able to handle many channels but Chrome fails at WAVE files of >8ch. For that reason a helper class is provided that loads individual 8ch files that have been split from the full HOA multichannel file. usage:

```javascript
var HOA3soundBuffer;
var order = 3;
var url = "https://address/HOA3_rec1.wav";
var callbackOnLoad = function(mergedBuffer) {
    HOA3soundBuffer = mergedBuffer;
}
var HOA3loader = new webAudioAmbisonic.HOAloader(audioContext, order, url, callbackOnLoad);
HOA3loader.load();
```
The class will try to find files with the provided file name *HOA3_rec1.wav* but of the form:
```
  HOA3_rec1_01-08ch.wav
  HOA3_rec1_09-16ch.wav
```
The above example for 3rd-order will have exactly two files of 8ch (16 HOA channels). For a 2nd-order example (9 HOA channels) the loader will check for
```
  HOA2_rec1_01-08ch.wav
  HOA2_rec1_09-09ch.wav
```
and so on.

---
## Developpers

To modify the library you need Node.js installed on your machine. Install the project's dependencies typing in a terminal (opened in project's root):

```bash
npm install
```

You can then start developing, using the ```watch```  utility to dynamically transpile / bundle your code as you write it:

```bash
npm run watch
```

and test the changes on the files of the ```./examples``` folder, serving ```./index.html``` with a local http server (see e.g. the [http-server node](https://github.com/indexzero/http-server)).

When you're satisfied with your changes, create ```web-audio-ambisonic.*.js``` bundles with:

```bash
npm run bundle
```
