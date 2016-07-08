# JSAmbisonics
A JS library for first-order ambisonic (FOA) and higher-order ambisonic (HOA) processing for  browsers, using Web Audio.

---
>
> Archontis Politis (Aalto University)
>
> archontis.politis@aalto.fi
>
> David Poirier-Quinot (IRCAM)
>
> david.poirier-quinot@ircam.fr
>
----

## Description
JSAmbisonics is a JavaScript library that implements a set of objects for real-time spatial audio processing, using the Ambisonics framework. The objects correspond to typical ambisonic processing blocks, and internally implement Web Audio graphs for the associated operations.

The library is suitable for both FOA and HOA processing, using the following specifications:
* FOA B-format signals with traditional ordering **[W X Y Z]** and a factor of **1/sqrt(2)** on the omnidirectional first channel.
* FOA or HOA (up to 3rd-order) using the [Furse-Malham specification](http://www.blueripplesound.com/b-format).
* FOA or HOA with ACN channel ordering and N3D normalization. This is the default mode, and all internal processing is done using this.
* FOA or HOA with ACN channel ordering and SN3D normalization.

Computation of spherical harmonics and rotations rely on the JavaScript spherical harmonic library contributed by the author [here](https://github.com/polarch/Spherical-Harmonic-Transform-JS). The HOA code is based on the larger Matlab [HOA](https://github.com/polarch/Higher-Order-Ambisonics) and [Spherical Harmonic Transform](https://github.com/polarch/Spherical-Harmonic-Transform) libraries contributed by the author in Github. The rotation algorithm is the fast recursive one by [Ivanic and Ruedenberg](http://pubs.acs.org/doi/abs/10.1021/jp953350u?journalCode=jpchax).

The implemented Web Audio classes are:
* **monoEncoder**: encodes a monophonic sound source to an ambisonic stream of a set order, with real-time control of the panning direction.
* **sceneRotator**: rotates the sound scene of an ambisonic stream, with real-time control of yaw, pitch, and roll rotation angles.
* **virtualMic**: applies FOA and HOA virtual microphones to an ambionic stream, with real-time control of their orientation and pattern.
* **binDecoder**: implements an ambisonic to binaural decoding, using user-defined HRTF-based filters. If these are not provided, two plain opposing cardioids are used instead.
* **orderLimiter**: takes a HOA stream of order N, and outputs the channel-limited HOA stream of order N'<=N
* **converters.bf2acn**: converts a traditional FOA stream to FOA ACN/N3D stream
* **converters.acn2bf**: converts the first-order channels of a HOA stream to traditional FOA stream
* **converters.n3d2sn3d**: converts an ACN/N3D stream to an ACN/SN3D stream
* **converters.sn3d2n3d**: converts an ACN/SN3D stream to an ACN/N3D stream
* **converters.fuma2acn**: converts a FuMa stream to a ACN/N3D stream
* **intensityAnalyser**: implements an acoustic intensity analysis for visualization of directional information captured in the ambisonic stream.

The library is a work-in-progress, but fully functional. At the moment, demos seem to work fine in Mozilla Firefox and Google Chrome. No other browsers have been checked yet.

---
## Real-time demo (Chrome and Firefox)

See the live [Rawgit demo](https://rawgit.com/polarch/JSAmbisonics/e5090128dd38eb8a3d5d2db3e76c6e3066db7e5b/index.html)  (serving the content of the ``./examples`` folder).

HOA recordings are made by the author in the [Communication Acoustics laboratory of Aalto University](http://spa.aalto.fi/en/research/research_groups/communication_acoustics/), using the [Eigenmike](http://www.mhacoustics.com/products#eigenmike1) microphone.

---
## Usage

To add the library to you node project, type in (terminal at project root):

```bash
npm install polarch/JSAmbisonics
```

To use the ambisonic objects, include the WebAudioAmbisonic library in the body of your html code as:
```javascript
<script type="text/javascript" src="web-audio-ambisonic.umd.js"></script>
```

**ambisonic encoder** is initialized as

```javascript
var encoder = new webAudioAmbisonic.monoEncoder(audioContext, order)
```

where *audioContext* is the current Web Audio context, and *order* the desired ambisonic order. The input stream comes from an audio node to be spatialized.
The azimuth and elevation of the encoded source can be updated at runtime by

```javascript
encoder.azim = azim_value_in_degrees;
encoder.elev = elev_value_in_degrees;
encoder.updateGains();
```

**ambisonic rotator** is initialized as

```javascript
var rotator = new webAudioAmbisonic.sceneRotator(audioContext, order)
```

The yaw (Z-axis rotation), pitch (Y-axis) and roll (X-axis) rotation angles can be updated at runtime by
```javascript
rotator.yaw = yaw_value_in_degrees;
rotator.pitch = pitch_value_in_degrees;
rotator.roll = roll_value_in_degrees;
rotator.updateRotMtx();
```

**ambisonic binaural decoder** is initialized as

```javascript
var binDecoder = new webAudioAmbisonic.binDecoder(audioContext, order)
```

If no decoding filters are passed to the decoder, an initial decoding based on two opposing cardioids is defined by default.
In case binaural decoding filters are available, they should be loaded in a multichannel *audioBuffer* and passed to the decoder through

```javascript
binDecoder.updateFilters(audioBuffer);
```

The number of channels of the buffer should be equal or greater to ```(order+1)^2```, which amounts to the number of ambisonic channels for the specified order. The filters can be reset to their default cardioids by

```javascript
binDecoder.resetFilters();
```

Some FOA and HOA HRTF-based decoding filters are included in the examples.

**ambisonic virtual microphone** is initialized as

```javascript
var vmic = new webAudioAmbisonic.virtualMic(audioContext, order)
```

The virtual microphone is initialized to a hypercardioid of the appropriate order, pointing to the front. The orientation can be updated at runtime by

```javascript
vmic.azim = azim_value_in_degrees;
vmic.elev = elev_value_in_degrees;
vmic.updateOrientation();
```

The pattern of the microphone can be also updated by

```javascript
vmic.vmicPattern = string;
vmic.updatePattern();
```
where *string* can be one of the following:
* **"cardioid"**
* **"supercardioid"**
* **"hypercardioid"**
* **"max_rE"**

Higher-order cardioids correspond to the normal cardioid raised to the power of *order*. Higher-order supercardioids correspond to the pattern of that order that maximizes the front-to-back energy ratio. Higher-order hypercardioids correspond to the pattern of that order that maximizes the directivity factor. the max-rE pattern, found in ambisonic decoding literature, corresponds to the pattern of that order that maximizes the (Gerzon) energy vector for diffuse sound.

All objects have an input node *object.in* and an output node *object.out* which are used for the connections. The number of channels expected from each input depends on the object (for example a FOA encoder expects a monophonic signal, and outputs 4 channels, a FOA binaural decoder expects 4-channel input and outputs 2 channels, etc.). Example connections:
```javascript
soundBufferPlayer.connect(encoder.in);
encoder.out.connect(rotator.in);
rotator.out.connect(binDecoder.in);
binDecoder.connect(audioContext.destination);
```
which implements a graph such as:
```
soundBufferPlayer ------------->encoder------------>rotator---------->binDecoder-------------->out
                  mono stream            HOA stream         HOA stream            stereo stream
```
and
```javascript
soundBufferPlayer.connect(vmic.in);
vmic.out.connect(audioContext.destination);
```
with a graph such as:
```
soundBufferPlayer ------------->vmic------------>out
                  HOA stream         mono stream
```

See the scripts in the ``./examples`` folder for more insights on how to use the different objects of the library.

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
## Developers

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

## License

The library is released under the [BSD 3-Clause License](https://opensource.org/licenses/BSD-3-Clause).
