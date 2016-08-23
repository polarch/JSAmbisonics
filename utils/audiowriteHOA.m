function audiowriteHOA(order, path, filename, sig, fs_in, fs_out, fileExt, audioPars)

switch nargin
    case {1,2,3,4}
        error('Not enough arguments')
    case 5
        fs_out = fs_in;
        bitsPerSample = [];
        fileExt = [];
        audioPars = {};
    case 6
        bitsPerSample = [];
        fileExt = [];
        audioPars = {};
    case 7
        fileExt = [];
        audioPars = {};
    case 8
        audioPars = {};
    case 9
        ;
    otherwise
        error('Too many arguments')
end

% normalize if range > 1
peak = max(max(abs(sig)));
if peak>=1
    warning('Peak value >=1, signals will be normalized to -6dBFS');
    sig = 0.5*sig/peak;
end

% resample if needed
if fs_in~=fs_out
    sig = resample(sig, fs_out, fs_in);
end

nCh = size(sig,2);
nSH = (order+1)^2;
if nCh~=nSH
    warning('The number of channels not equal to number of HOA components for specified order, empty channels will be added');
    lSig = size(sig,1);
    sig = [sig, zeros(lSig, nSH-nCh)];
end

nChLim = 8;
nChGroups = ceil(nSH/nChLim);
if isempty(fileExt)
    fileExt = filename(end-2:end);
    switch fileExt
        case 'wav'
            audioPars = {'bitsPerSample', 16};
        case 'ogg'
            audioPars = {'quality', 100};
    end
end
fileName = filename(1:end-4);

if nChGroups==1
    filename_out = fullfile(path, [fileName '.' fileExt]);
    audiowrite(filename_out, sig, fs_out, audioPars{:});
    fprintf('file created: \t %s \n', filename_out);
else
    
    for k=1:nChGroups
        if k== nChGroups
            fileChanExt = ['_' sprintf('%02d',(k-1)* nChLim +1) '-' sprintf('%02d',nSH) 'ch.' fileExt];
            filename_out = fullfile(path, [fileName fileChanExt]);
            audiowrite(filename_out, sig(:,(k-1)*nChLim +1:nSH), fs_out, audioPars{:});
        else
            fileChanExt = ['_' sprintf('%02d',(k-1)* nChLim +1) '-' sprintf('%02d',(k-1)* nChLim + nChLim) 'ch.' fileExt];
            filename_out = fullfile(path, [fileName fileChanExt]);
            audiowrite(filename_out, sig(:,(k-1)*nChLim + (1:nChLim) ), fs_out, audioPars{:});
        end
        fprintf('file created: \t %s \n', filename_out);
    end
end
