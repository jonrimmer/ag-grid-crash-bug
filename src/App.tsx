import { useEffect, useState } from 'react';
import './App.css';
import { TreeNode } from './data';
import { Grid } from './Grid';
import { useDataQuery } from './queries';
import { DataItem, DataItemRow } from './types';

function* mapTreeToRows(
  tree: Array<TreeNode<DataItem>>,
  parentPath: string[] = []
): Generator<DataItemRow> {
  for (const node of tree) {
    const path = [...parentPath, node.data.id];

    yield {
      path,
      ...node.data,
    };

    yield* mapTreeToRows(node.children, path);
  }
}

function App() {
  const { data } = useDataQuery();
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState<DataItem[]>();

  useEffect(() => {
    console.dir(data);
    setRows(data ? Array.from(mapTreeToRows(data)) : undefined);
  }, [data]);

  return (
    <div className="App">
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.currentTarget.value)}
      />
      <Grid data={rows} search={search} onAction={() => {}} />
    </div>
  );
}

export default App;
