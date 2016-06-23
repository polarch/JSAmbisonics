%% Split a multichannel .wav file into N channels chuncks
% 
% This script loads a multi-channel audio file to split it and save
% it as N-channel chunks, respecting the formating used in the 
% hoa-loader class of the webaudio Ambisonic library.
% 
% Author: David Poirier-Quinot
% IRCAM-CNRS
% 06/2016

% Set current folder to script's location
cd(fileparts(mfilename('fullpath')));

% Define IOs paths
filename_in = fullfile(pwd,'HOA3_rec4');

% Load
[y,Fs] = audioread([filename_in '.wav']);

% save as splitted wavefiles
NumChannelPerFile = 8;
for i = 1:size(y,2)/NumChannelPerFile;
    
    index_low = 1 + (i-1)*NumChannelPerFile;
    index_high = i*NumChannelPerFile;
    
    audio_out_name = sprintf('%s_%2.2d-%2.2dch.wav', filename_in, index_low, index_high);
    audio_out = y(:,index_low:index_high);
    
    % delete current file if exists
    if exist(audio_out_name,'file') == 2; delete(audio_out_name); end

    % write file
    audiowrite(audio_out_name, audio_out , Fs, 'BitsPerSample', 16);
    fprintf('file created: \t %s \n', audio_out_name);
end