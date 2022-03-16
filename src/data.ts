import { DataItem } from './types';

const tags = ['Apples', 'Bananas', 'Cherries'];
export type NodePlacement = 'into' | 'before' | 'after';

export interface TreeNode<T> {
  data: T;
  parent?: TreeNode<T>;
  children: Array<TreeNode<T>>;
}

const nodes = new Map<string, TreeNode<DataItem>>();

export function createFakeData(): Array<TreeNode<DataItem>> {
  let num = 1;

  function createNode(depth: number, parent?: TreeNode<DataItem>) {
    const id = `grp:${num++}`;

    const node: TreeNode<DataItem> = {
      data: {
        id,
        label: `Group ${id}`,
        count: Math.floor(Math.random() * 1000),
        description: 'Description',
        tags,
        longDescription: 'Long description',
        type: 'Type',
        source: 'file.csv',
        location: 'root -> folder -> file.csv',
      },
      parent,
      children: [],
    };

    // Child groups
    if (depth < 3) {
      for (let i = 0; i < 3; i++) {
        node.children.push(createNode(depth + 1, node));
      }
    }

    nodes.set(id, node);

    return node;
  }

  return Array.from({ length: 5 }).map((_, i) => createNode(0));
}

const roots = createFakeData();

function mapNode(
  node: TreeNode<DataItem>,
  parent?: TreeNode<DataItem>
): TreeNode<DataItem> {
  const result: TreeNode<DataItem> = {
    data: {
      ...node.data,
    },
    children: [],
  };

  node.children.forEach((c) => {
    result.children.push(mapNode(c, result));
  });

  return result;
}

export function getFakeData(): Array<TreeNode<DataItem>> {
  return roots.map((r) => mapNode(r));
}

export function moveNode(
  id: string,
  destId: string,
  placement: NodePlacement
): Promise<null> {
  return new Promise((resolve) => {
    const toMove = nodes.get(id);
    const destination = nodes.get(destId);

    if (!toMove || !destination) {
      return;
    }

    const oldSiblings = toMove.parent?.children ?? roots;
    oldSiblings.splice(
      oldSiblings.findIndex((n) => n.data.id === id),
      1
    );

    switch (placement) {
      case 'into':
        destination.children.push(toMove);
        toMove.parent = destination;
        break;
      default:
        const parent = destination.parent;
        const newSiblings = parent?.children ?? roots;
        toMove.parent = parent;

        const place =
          newSiblings.indexOf(destination) + (placement === 'before' ? 0 : 1);

        newSiblings.splice(place, 0, toMove);
        break;
    }

    resolve(null);
  });
}

export function changeData() {
  return new Promise((resolve) => {
    nodes.forEach((node) => {
      node.data.count = Math.random() * 1000;
    });

    resolve(null);
  });
}
