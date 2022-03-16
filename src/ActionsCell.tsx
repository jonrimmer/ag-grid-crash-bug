import { ICellRendererParams } from 'ag-grid-enterprise';
import { Component } from 'react';
import { AgReactComponent } from 'ag-grid-react';
import { DataItem } from './types';
import styled from 'styled-components';

export interface ActionsCellEvent {
  row: DataItem;
}

export interface OnShowContextMenuEvent extends ActionsCellEvent {
  trigger: HTMLButtonElement;
}

export type ActionsCellParams = ICellRendererParams & {
  data: DataItem;
};

const IconButton = styled.button<{ icon: string; kind: string }>``;

export class ActionsCellRenderer
  extends Component<ActionsCellParams>
  implements AgReactComponent
{
  getReactContainerStyle() {
    return {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.4rem',
      height: '100%',
    };
  }

  render() {
    return (
      <>
        <IconButton
          icon="edit"
          kind="tertiary"
          onClick={(e) => {
            e.stopPropagation();
          }}
        />
        <IconButton
          icon="moreVert"
          kind="tertiary"
          onClick={(e) => {
            e.stopPropagation();
          }}
        />
      </>
    );
  }
}
