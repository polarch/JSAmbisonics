%% LOAD DESIGNS AND CONVERT TO SPHERICAL COORDS
load('t_designs_1_21.mat')

for t=1:length(t_designs)
    t_designs_sph{t} = unitCart2sph(t_designs{t});
end

%% WRITE TO FILE

str = sprintf('SPH_T_DESIGNS = {\n\n');

for t=1:length(t_designs)
    
    t_design = t_designs{t};
    t_design_sph = t_designs_sph{t};
    if (t>1), faces = convhulln(t_design); end
    K = size(t_design,1);
    
    str = [str sprintf(['\t/* T-DESIGN 3.' num2str(t) '.' num2str(K) ' */\n'])];
    str = [str sprintf(['\tTD' num2str(t) ': {\n'])];
    
    % vertices
    str = [str sprintf('\t\t"xyx":[')];
    for n=1:K
        temp = sprintf('%1.7f,',t_design(n,:));
        temp = ['[' temp(1:end-1) '],'];
        str = [str temp];
    end
    str = [str(1:end-1) sprintf('],\n')];
    
    if (t>1)
        % faces
        str = [str sprintf('\t\t"faces":[')];
        nface = size(faces,1);
        
        for n=1:nface
            temp = sprintf('%i,',faces(n,:)-1);
            temp = ['[' temp(1:end-1) '],'];
            str = [str temp];
        end
        str = [str(1:end-1) sprintf('],\n')];
    end
    
    % angles
    str = [str sprintf('\t\t"azimElev":[')];
    for n=1:K
        temp = sprintf('%1.7f,',t_design_sph(n,:));
        temp = ['[' temp(1:end-1) '],'];
        str = [str temp];
    end
    if (t<length(t_designs)), str = [str(1:end-1) sprintf(']},\n\n')];
    else str = [str(1:end-1) sprintf(']}\n\n};')];
    end
    
end

FID = fopen('sphTdesigns.js','w')
fprintf(FID,'%s',str)
fclose(FID)
