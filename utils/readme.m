%%  README - How to use Matlab routines
% 
%   This script illustrates how to use the Matlab routines in this folder 
%   to create Ambisonic Head Related Impulse Responses. These IRs are used 
%   in the webaudio ambisonic lib, convolved with Ambisonic channels for 
%   direct Ambisonic to binaural decoding (i.e. listening over headphone 
%   to an audio field encoded as Ambisonic channels.
% 
%   Two approaches are supported to create the Ambisonic HRIRs: 1)
%   projection of the HRIRs on Spherical Harmonics, and 2) binaural
%   listening of the Ambisonic sound field decoded on a set of virtual
%   speakers.
% 
%   Authors:
%   Archontis Politis, archontis.politis@aalto.fi
%   David Poirier-Quinot, david.poirier-quinot@ircam.fr

%% Init

% Set current folder to script's location
cd( fileparts( mfilename('fullpath') ) );

% Select encoding approach
available_approach = {'DIRECT','VIRTUAL'};
ENCODING_APPROACH = available_approach{1};

%% Load HRIR

% hrir_base_name = 'IRC_1008_C_44100'; % see README.md for download instructions
hrir_filename = fullfile( pwd, [hrir_base_name '.sofa'] );
s = SOFAload(hrir_filename);

%% Generate SH HRIR

order = 1;
dirsAziElev  = s.SourcePosition(:, 1:2);

switch ENCODING_APPROACH
    
    case 'DIRECT'

        hrirs = squeeze( s.Data.IR(:, 2, :) ).'; % only right hrtf
        dirsAziElev = deg2rad(dirsAziElev);
        [h_hoa2bin, H_hoa2bin] = getHOA2binauralFilters_direct(order, hrirs, dirsAziElev);

    case 'VIRTUAL'
        
        hrirs_l = squeeze( s.Data.IR(:, 1, :) ); % only left hrtf (since we're being arbitrary, why not be fair)
        useRawArray = false;
        h_hoa2bin = getHOA2binauralFilters_virtual(order, hrirs_l, dirsAziElev, useRawArray);
end

%% Save IRs to use with JSHlib

filepath = pwd;
filename = [hrir_base_name '_' ENCODING_APPROACH '.wav'];
fs_in = s.Data.SamplingRate;
sig = h_hoa2bin / max(sum(abs(h_hoa2bin))); % normalization
audiowriteHOA(order, filepath, filename, sig, fs_in);