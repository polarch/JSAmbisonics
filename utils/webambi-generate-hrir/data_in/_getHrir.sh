#!/bin/bash

# get hrir from serverv
wget ftp://ftp.ircam.fr/pub/IRCAM/equipes/salles/listen/archive/SUBJECTS/IRC_1008.zip

# unzip
unzip *.zip

# extract .mat
mv RAW/MAT/HRIR/* .

# remove overload
rm -Rf *.zip && rm -Rf RAW && rm -Rf COMPENSATED
