function audiowriteHOA(order, path, filename, sig, fs_in, fs_out, bitsPerSample)

switch nargin
    case {1,2,3,4}
        error('Not enough arguments')
    case 5
        fs_out = fs_in;
        bitsPerSample = [];
    case 6
        bitsPerSample = [];
    case 7
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
fileExt = filename(end-3:end);
fileName = filename(1:end-4);

for k=1:nChGroups
    if k== nChGroups
        fileChanExt = ['_' sprintf('%02d',(k-1)* nChLim +1) '-' sprintf('%02d',nSH) 'ch' fileExt];
        filename_out = fullfile(path, [fileName fileChanExt]);
        if isempty(bitsPerSample), audiowrite(filename_out, sig(:,(k-1)*nChLim +1:nSH), fs_out);
        else audiowrite(filename_out, sig(:,(k-1)*nChLim +1:nSH), fs_out, 'bitsPerSample', bitsPerSample);
        end
    else
        fileChanExt = ['_' sprintf('%02d',(k-1)* nChLim +1) '-' sprintf('%02d',(k-1)* nChLim + nChLim) 'ch' fileExt];
        filename_out = fullfile(path, [fileName fileChanExt]);
        if isempty(bitsPerSample), audiowrite(filename_out, sig(:,(k-1)*nChLim + (1:nChLim) ), fs_out);
        else audiowrite(filename_out, sig(:,(k-1)*nChLim + (1:nChLim) ), fs_out, 'bitsPerSample', bitsPerSample);
        end
    end
    fprintf('file created: \t %s \n', filename_out);
end

