# Description

This folder contains a set of Matlab scripts that can be used to create assets (IRs, soundfiles, etc.) to use with the webaudio Ambisonic library.


# Create Assets

## Download new HRIR sets

The Matlab scripts are compliant with the [LISTEN HRTF database](http://recherche.ircam.fr/equipes/salles/listen/download.html). for direct download, type the following in a terminal opened in this directory:

```
HRIR_ID=1008
wget ftp://ftp.ircam.fr/pub/IRCAM/equipes/salles/listen/archive/SUBJECTS/IRC_${HRIR_ID}.zip
unzip IRC_${HRIR_ID}.zip
mv RAW/MAT/HRIR/* .
rm -Rf IRC_${HRIR_ID}.zip && rm -Rf RAW && rm -Rf COMPENSATED
```

## Create Ambisonic HRIRs

See readme.m file
