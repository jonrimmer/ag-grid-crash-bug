import { ICellEditor, ICellRendererParams } from 'ag-grid-community';
import { forwardRef, useImperativeHandle, useState, VFC } from 'react';
import styled from 'styled-components';
import { DataItem } from './types';

export type LabelCellParams = ICellRendererParams & { data: DataItem };

const StyledInput = styled.input`
  margin-left: 0.6rem;
  width: calc(100% - 1.2rem);
`;

const LabelCell = styled.span`
  display: flex;
  align-items: center;
  gap: 0.8rem;
`;

const StyledIcon = styled.svg`
  flex-shrink: 0;
  width: 16px;
  height: 16px;
`;

export const LabelCellRenderer: VFC<LabelCellParams> = ({ data }) => {
  return (
    <LabelCell>
      {data.icon && <StyledIcon name={data.icon} />}
      {data.label}
    </LabelCell>
  );
};

export const LabelCellEditor = forwardRef<ICellEditor, ICellRendererParams>(
  (props, ref) => {
    const [value, setValue] = useState<string>(props.data.label);

    useImperativeHandle(ref, () => {
      return {
        getValue() {
          return value;
        },
      };
    });

    return (
      <StyledInput
        autoFocus
        type="text"
        value={value}
        onChange={(e) => setValue(e.currentTarget.value)}
      />
    );
  }
);
