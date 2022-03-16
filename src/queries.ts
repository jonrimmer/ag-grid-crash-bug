import { useMutation, useQuery, useQueryClient } from 'react-query';
import {
  changeData,
  getFakeData,
  moveNode,
  NodePlacement,
  TreeNode,
} from './data';
import { DataItem } from './types';

export const useDataQuery = () => {
  return useQuery(
    'dataLoad',
    () =>
      new Promise<Array<TreeNode<DataItem>>>((resolve) => {
        setTimeout(() => resolve(getFakeData()), 100);
      })
  );
};

export const useDataMove = () => {
  const queryClient = useQueryClient();

  return useMutation(
    ({
      id,
      destId,
      placement,
    }: {
      id: string;
      destId: string;
      placement: NodePlacement;
    }) => {
      return moveNode(id, destId, placement);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('dataLoad');
      },
    }
  );
};

export const useDataUpdate = () => {
  const queryClient = useQueryClient();

  return useMutation(
    () => {
      return changeData();
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('dataLoad');
      },
    }
  );
};
