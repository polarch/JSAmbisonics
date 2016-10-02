load('t_designs_1_21.mat');

for i = 1:length(t_designs);
    array = t_designs{i};
    fprintf('[\n');
    for j = 1:size(array,1);
%         [azim, elev, dist] = cart2sph(array(j,1), array(j,2), array(j,3));
%         azim = rad2deg(azim); elev = rad2deg(elev);
%         fprintf('[%.2f,\t %.2f,\t %.2f], \n', azim, elev, dist); 
        fprintf('[%.4f,\t %.4f,\t %.4f], \n', array(j,1), array(j,2), array(j,3)); 
    end
    fprintf('],\n');
end